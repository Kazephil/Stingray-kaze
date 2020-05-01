/*****************************************************************************
Copyright (c) 2008-2020 - Maxprograms,  http://www.maxprograms.com\\

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to compile,
modify and use the Software in its executable form without restrictions.

Redistribution of this Software or parts of it in any form (source code or
executable binaries) requires prior written permission from Maxprograms.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*****************************************************************************/

import { app, BrowserWindow, dialog, ipcMain, Menu, MenuItem, shell, webContents, nativeTheme, Rectangle, IpcMainEvent } from "electron";
import { existsSync, mkdirSync, readFile, readFileSync, writeFile, writeFileSync } from "fs";
import { ClientRequest, request, IncomingMessage } from "http";

class Stingray {

    static path = require('path');
    static https = require('https');

    static mainWindow: BrowserWindow;
    static aboutWindow: BrowserWindow;
    static licensesWindow: BrowserWindow;
    static settingsWindow: BrowserWindow;
    static contents: webContents;
    currentDefaults: Rectangle;

    static currentPreferences: any = { theme: 'system', srcLang: 'none', tgtLang: 'none' }
    static currentTheme: string = 'system';

    verticalPadding: number = 46;

    constructor() {
        app.allowRendererProcessReuse = true;
        if (!app.requestSingleInstanceLock()) {
            app.quit();
        } else {
            if (Stingray.mainWindow) {
                // Someone tried to run a second instance, we should focus our window.
                if (Stingray.mainWindow.isMinimized()) {
                    Stingray.mainWindow.restore();
                }
                Stingray.mainWindow.focus();
            }
        }
        this.loadDefaults();
        Stingray.loadPreferences();
        app.on('ready', () => {
            this.createWindow();
            Stingray.mainWindow.loadURL(Stingray.path.join('file://', app.getAppPath(), 'index.html'));
            Stingray.mainWindow.on('resize', () => {
                this.saveDefaults();
            });
            Stingray.mainWindow.on('move', () => {
                this.saveDefaults();
            });
            Stingray.mainWindow.once('ready-to-show', () => {
                Stingray.setTheme();
                Stingray.mainWindow.setBounds(this.currentDefaults);
                Stingray.mainWindow.show();
            });
            Stingray.checkUpdates(true);
        });
        ipcMain.on('get-theme', (event, arg) => {
            event.sender.send('set-theme', Stingray.currentTheme);
        });
        ipcMain.on('about-height', (event, arg) => {
            let rect: Rectangle = Stingray.aboutWindow.getBounds();
            rect.height = arg.height + this.verticalPadding;
            Stingray.aboutWindow.setBounds(rect);
        });
        ipcMain.on('licenses-height', (event, arg) => {
            let rect: Rectangle = Stingray.licensesWindow.getBounds();
            rect.height = arg.height + this.verticalPadding;
            Stingray.licensesWindow.setBounds(rect);
        })
        ipcMain.on('settings-height', (event, arg) => {
            let rect: Rectangle = Stingray.settingsWindow.getBounds();
            rect.height = arg.height + this.verticalPadding;
            Stingray.settingsWindow.setBounds(rect);
        });
        ipcMain.on('save-preferences', (event, arg) => {
            Stingray.settingsWindow.close();
            Stingray.currentPreferences = arg;
            Stingray.savePreferences();
        });
        ipcMain.on('get-preferences', (event, arg) => {
            event.sender.send('set-preferences', Stingray.currentPreferences);
        });
        nativeTheme.on('updated', () => {
            Stingray.loadPreferences();
            Stingray.setTheme();
        });
        ipcMain.on('licenses-clicked', () => {
            Stingray.showLicenses();
        });
        ipcMain.on('open-license', (event, arg) => {
            Stingray.openLicense(arg.type);
        })
        ipcMain.on('show-help', () => {
            Stingray.showHelp();
        });
    }

    createWindow(): void {
        Stingray.mainWindow = new BrowserWindow({
            title: app.name,
            width: this.currentDefaults.width,
            height: this.currentDefaults.height,
            x: this.currentDefaults.x,
            y: this.currentDefaults.y,
            useContentSize: true,
            webPreferences: {
                nodeIntegration: true
            },
            show: false,
            icon: Stingray.path.join(app.getAppPath(), 'icons', 'icon.png')
        });
        Stingray.contents = Stingray.mainWindow.webContents;
        var fileMenu: Menu = Menu.buildFromTemplate([
        ]);
        var editMenu: Menu = Menu.buildFromTemplate([
            { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => { Stingray.contents.undo(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Cut', accelerator: 'CmdOrCtrl+X', click: () => { Stingray.contents.cut(); } },
            { label: 'Copy', accelerator: 'CmdOrCtrl+C', click: () => { Stingray.contents.copy(); } },
            { label: 'Paste', accelerator: 'CmdOrCtrl+V', click: () => { Stingray.contents.paste(); } },
            { label: 'Select All', accelerator: 'CmdOrCtrl+A', click: () => { Stingray.contents.selectAll(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Replace Text...', accelerator: 'CmdOrCtrl+F', click: () => { this.replaceText(); } }
        ]);
        var helpMenu: Menu = Menu.buildFromTemplate([
            { label: 'Stingray User Guide', accelerator: 'F1', click: () => { Stingray.showHelp(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Check for Updates...', click: () => { Stingray.checkUpdates(false); } },
            { label: 'View Licenses', click: () => { Stingray.showLicenses(); } },
            new MenuItem({ type: 'separator' }),
            { label: 'Release History', click: () => { Stingray.showReleaseHistory(); } },
            { label: 'Support Group', click: () => { Stingray.showSupportGroup(); } }
        ]);
        var template: MenuItem[] = [
            new MenuItem({ label: '&File', role: 'fileMenu', submenu: fileMenu }),
            new MenuItem({ label: '&Edit', role: 'editMenu', submenu: editMenu }),
            new MenuItem({ label: '&Help', role: 'help', submenu: helpMenu })
        ];
        if (process.platform === 'darwin') {
            var appleMenu: Menu = Menu.buildFromTemplate([
                new MenuItem({ label: 'About...', click: () => { Stingray.showAbout(); } }),
                new MenuItem({
                    label: 'Preferences...', submenu: [
                        { label: 'Settings', accelerator: 'Cmd+,', click: () => { Stingray.showSettings(); } }
                    ]
                }),
                new MenuItem({ type: 'separator' }),
                new MenuItem({
                    label: 'Services', role: 'services', submenu: [
                        { label: 'No Services Apply', enabled: false }
                    ]
                }),
                new MenuItem({ type: 'separator' }),
                new MenuItem({ label: 'Quit Stingray', accelerator: 'Cmd+Q', role: 'quit', click: () => { app.quit(); } })
            ]);
            template.unshift(new MenuItem({ label: 'Stingray', role: 'appMenu', submenu: appleMenu }));
        } else {
            var help: MenuItem = template.pop();
            template.push(new MenuItem({
                label: '&Settings', submenu: [
                    { label: 'Preferences', click: () => { Stingray.showSettings(); } }
                ]
            }));
            template.push(help);
        }
        if (process.platform === 'win32') {
            template[0].submenu.append(new MenuItem({ type: 'separator' }));
            template[0].submenu.append(new MenuItem({ label: 'Exit', accelerator: 'Alt+F4', role: 'quit', click: () => { app.quit(); } }));
            template[3].submenu.append(new MenuItem({ type: 'separator' }));
            template[3].submenu.append(new MenuItem({ label: 'About...', click: () => { Stingray.showAbout(); } }));
        }
        if (process.platform === 'linux') {
            template[0].submenu.append(new MenuItem({ type: 'separator' }));
            template[0].submenu.append(new MenuItem({ label: 'Quit', accelerator: 'Ctrl+Q', role: 'quit', click: () => { app.quit(); } }));
            template[3].submenu.append(new MenuItem({ type: 'separator' }));
            template[3].submenu.append(new MenuItem({ label: 'About...', click: () => { Stingray.showAbout(); } }));
        }
        Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    }

    loadDefaults(): void {
        let defaultsFile: string = Stingray.path.join(app.getPath('appData'), app.name, 'defaults.json');
        this.currentDefaults = { width: 900, height: 700, x: 0, y: 0 };
        if (existsSync(defaultsFile)) {
            try {
                var data: Buffer = readFileSync(defaultsFile);
                this.currentDefaults = JSON.parse(data.toString());
            } catch (err) {
                console.log(err);
            }
        }
    }

    static loadPreferences(): void {
        let preferencesFile = this.path.join(app.getPath('appData'), app.name, 'preferences.json');
        if (existsSync(preferencesFile)) {
            try {
                var data: Buffer = readFileSync(preferencesFile);
                this.currentPreferences = JSON.parse(data.toString());
            } catch (err) {
                console.log(err);
            }
        }
        if (this.currentPreferences.theme === 'system') {
            if (nativeTheme.shouldUseDarkColors) {
                this.currentTheme = this.path.join(app.getAppPath(), 'css', 'dark.css');
                nativeTheme.themeSource = 'dark';
            } else {
                this.currentTheme = this.path.join(app.getAppPath(), 'css', 'light.css');
                nativeTheme.themeSource = 'light';
            }
        }
        if (this.currentPreferences.theme === 'dark') {
            this.currentTheme = this.path.join(app.getAppPath(), 'css', 'dark.css');
            nativeTheme.themeSource = 'dark';
        }
        if (this.currentPreferences.theme === 'light') {
            this.currentTheme = this.path.join(app.getAppPath(), 'css', 'light.css');
            nativeTheme.themeSource = 'light';
        }
    }

    static savePreferences(): void {
        let preferencesFile = this.path.join(app.getPath('appData'), app.name, 'preferences.json');
        writeFileSync(preferencesFile, JSON.stringify(this.currentPreferences));
        nativeTheme.themeSource = this.currentPreferences.theme;
    }

    saveDefaults(): void {
        let defaultsFile: string = Stingray.path.join(app.getPath('appData'), app.name, 'defaults.json');
        writeFileSync(defaultsFile, JSON.stringify(Stingray.mainWindow.getBounds()));
    }

    static setTheme(): void {
        this.contents.send('set-theme', this.currentTheme);
    }

    static checkUpdates(silent: boolean): void {
        this.https.get('https://raw.githubusercontent.com/rmraya/Stingray/master/package.json', (res: IncomingMessage) => {
            if (res.statusCode === 200) {
                let rawData = '';
                res.on('data', (chunk: string) => {
                    rawData += chunk;
                });
                res.on('end', () => {
                    try {
                        const parsedData: any = JSON.parse(rawData);
                        if (app.getVersion() !== parsedData.version) {
                            dialog.showMessageBox(this.mainWindow, {
                                type: 'info',
                                title: 'Updates Available',
                                message: 'Version ' + parsedData.version + ' is available'
                            });
                        } else {
                            if (!silent) {
                                dialog.showMessageBox(this.mainWindow, {
                                    type: 'info',
                                    message: 'There are currently no updates available'
                                });
                            }
                        }
                    } catch (e) {
                        dialog.showErrorBox('Error', e.message);
                    }
                });
            } else {
                if (!silent) {
                    dialog.showErrorBox('Error', 'Updates Request Failed.\nStatus code: ' + res.statusCode);
                }
            }
        }).on('error', (e: any) => {
            if (!silent) {
                dialog.showErrorBox('Error', e.message);
            }
        });
    }

    replaceText(): void {
        // TODO
    }

    static showAbout(): void {
        this.aboutWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: this.getWidth('aboutWindow'),
            minimizable: false,
            maximizable: false,
            resizable: false,
            useContentSize: true,
            show: false,
            icon: this.path.join(app.getAppPath(), 'icons', 'icon.png'),
            webPreferences: {
                nodeIntegration: true
            }
        });
        this.aboutWindow.setMenu(null);
        this.aboutWindow.loadURL(this.path.join('file://', app.getAppPath(), 'html', 'about.html'));
        this.aboutWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            this.aboutWindow.show();
        });
    }

    static showSettings(): void {
        this.settingsWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: this.getWidth('settingsWindow'),
            useContentSize: true,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.path.join(app.getAppPath(), 'icons', 'icon.png'),
            webPreferences: {
                nodeIntegration: true
            }
        });
        this.settingsWindow.setMenu(null);
        this.settingsWindow.loadURL(this.path.join('file://', app.getAppPath(), 'html', 'preferences.html'));
        this.settingsWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            this.settingsWindow.show();
        });
    }

    static showHelp(): void {
        shell.openExternal(this.path.join('file://', app.getAppPath(), 'stingray.pdf'));
    }

    static showLicenses(): void {
        this.licensesWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: this.getWidth('licensesWindow'),
            useContentSize: true,
            minimizable: false,
            maximizable: false,
            resizable: false,
            show: false,
            icon: this.path.join(app.getAppPath(), 'icons', 'icon.png'),
            webPreferences: {
                nodeIntegration: true
            }
        });
        this.licensesWindow.setMenu(null);
        this.licensesWindow.loadURL('file://' + app.getAppPath() + '/html/licenses.html');
        this.licensesWindow.once('ready-to-show', (event: IpcMainEvent) => {
            event.sender.send('get-height');
            this.licensesWindow.show();
        });
    }

    static openLicense(type: string) {
        var licenseFile = '';
        var title = '';
        switch (type) {
            case 'Stingray':
                licenseFile = this.path.join('file://', app.getAppPath(), 'html', 'licenses', 'license.txt');
                title = 'Stingray License';
                break;
            case "electron":
                licenseFile = this.path.join('file://', app.getAppPath(), 'html', 'licenses', 'electron.txt');
                title = 'MIT License';
                break;
            case "TypeScript":
            case "MapDB":
                licenseFile = this.path.join('file://', app.getAppPath(), 'html', 'licenses', 'Apache2.0.html');
                title = 'Apache 2.0';
                break;
            case "Java":
                licenseFile = this.path.join('file://', app.getAppPath(), 'html', 'licenses', 'java.html');
                title = 'GPL2 with Classpath Exception';
                break;
            case "OpenXLIFF":
                licenseFile = this.path.join('file://', app.getAppPath(), 'html', 'licenses', 'EclipsePublicLicense1.0.html');
                title = 'Eclipse Public License 1.0';
                break;
            case "JSON":
                licenseFile = this.path.join('file://', app.getAppPath(), 'html', 'licenses', 'json.txt');
                title = 'JSON.org License';
                break;
            case "jsoup":
                licenseFile = this.path.join('file://', app.getAppPath(), 'html', 'licenses', 'jsoup.txt');
                title = 'MIT License';
                break;
            case "DTDParser":
                licenseFile = this.path.join('file://', app.getAppPath(), 'html', 'licenses', 'LGPL2.1.txt');
                title = 'LGPL 2.1';
                break;
            default:
                dialog.showErrorBox('Error', 'Unknow license');
                return;
        }
        var licenseWindow = new BrowserWindow({
            parent: this.mainWindow,
            width: 680,
            height: 400,
            show: false,
            title: title,
            icon: this.path.join(app.getAppPath(), 'icons', 'icon.png'),
            webPreferences: {
                nodeIntegration: true
            }
        });
        licenseWindow.setMenu(null);
        licenseWindow.loadURL(licenseFile);
        licenseWindow.show();
    }
    static showReleaseHistory(): void {
        shell.openExternal('https://www.maxprograms.com/products/stgraylog.html');
    }

    static showSupportGroup(): void {
        shell.openExternal('https://groups.io/g/maxprograms/');
    }

    static getWidth(window: string): number {
        switch (window) {
            case 'aboutWindow': { return 436; }
            case 'licensesWindow': { return 430; }
            case 'settingsWindow': { return 600; }
        }
    }
}

new Stingray();
