/*****************************************************************************
Copyright (c) 2008-2020 - Maxprograms,  http://www.maxprograms.com/

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

class Preferences {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.send('get-languages');
        this.electron.ipcRenderer.on('set-languages', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setLanguages(arg);
        });
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        this.electron.ipcRenderer.on('set-preferences', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('themeColor') as HTMLSelectElement).value = arg.theme;
            (document.getElementById('srcLangSelect') as HTMLSelectElement).value = arg.srcLang;
            (document.getElementById('tgtLangSelect') as HTMLSelectElement).value = arg.tgtLang;
            (document.getElementById('defaultSRX') as HTMLInputElement).value = arg.srx;
            (document.getElementById('defaultCatalog') as HTMLInputElement).value = arg.catalog;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => { KeyboardHandler.keyListener(event); });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                this.electron.ipcRenderer.send('close-preferences');
            }
            if (event.key === 'Enter') {
                this.savePreferences();
            }
        });
        document.getElementById('browseSRX').addEventListener('click', () => {
            this.electron.ipcRenderer.send('browse-srx');
        });
        document.getElementById('browseCatalog').addEventListener('click', () => {
            this.electron.ipcRenderer.send('browse-catalog');
        });
        document.getElementById('save').addEventListener('click', () => {
            this.savePreferences();
        });
        this.electron.ipcRenderer.on('get-height', () => {
            let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
            this.electron.ipcRenderer.send('settings-height', { width: body.clientWidth, height: body.clientHeight });
        });
        this.electron.ipcRenderer.on('set-srx', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('defaultSRX') as HTMLInputElement).value = arg;
        });
        this.electron.ipcRenderer.on('set-catalog', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('defaultCatalog') as HTMLInputElement).value = arg;
        });
    }

    setLanguages(arg: any): void {
        var array = arg.languages;
        var languageOptions = '<option value="none">Select Language</option>';
        for (let i = 0; i < array.length; i++) {
            var lang = array[i];
            languageOptions = languageOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        }
        document.getElementById('srcLangSelect').innerHTML = languageOptions;
        document.getElementById('tgtLangSelect').innerHTML = languageOptions;
        this.electron.ipcRenderer.send('get-preferences');
    }

    savePreferences() {
        var prefs: any = {
            srcLang: (document.getElementById('srcLangSelect') as HTMLSelectElement).value,
            tgtLang: (document.getElementById('tgtLangSelect') as HTMLSelectElement).value,
            theme: (document.getElementById('themeColor') as HTMLSelectElement).value,
            catalog: (document.getElementById('defaultCatalog') as HTMLInputElement).value,
            srx: (document.getElementById('defaultSRX') as HTMLInputElement).value
        }
        this.electron.ipcRenderer.send('save-preferences', prefs);
    }
}

new Preferences();




