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

class SearchReplace {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => { KeyboardHandler.keyListener(event); });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                this.electron.ipcRenderer.send('close-search-replace');
            }
            if (event.key === 'Enter') {
                this.replace();
            }
        });
        document.getElementById('replace').addEventListener('click', () => {
            this.replace();
        });
        this.electron.ipcRenderer.on('get-height', () => {
            let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
            this.electron.ipcRenderer.send('replacetext-height', { width: body.clientWidth, height: body.clientHeight });
        });
    }

    replace(): void {
        var searchText: string = (document.getElementById('searchText') as HTMLInputElement).value;
        var replaceText: string = (document.getElementById('replaceText') as HTMLInputElement).value;
        let inSource: boolean = (document.getElementById('source') as HTMLInputElement).checked
        if (searchText.length === 0) {
            window.alert('Enter text to search');
            return;
        }
        if (replaceText.length === 0) {
            window.alert('Enter replacement text');
            return;
        }
        var regularExpression: boolean = (document.getElementById('regularExpression') as HTMLInputElement).checked;
        this.electron.ipcRenderer.send('replace-request', { search: searchText, replace: replaceText, inSource: inSource, regExp: regularExpression });
    }
}

new SearchReplace();