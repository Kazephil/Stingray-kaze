/*******************************************************************************
 * Copyright (c) 2022 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/

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
        document.getElementById('searchText').focus();
        let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
        this.electron.ipcRenderer.send('replacetext-height', { width: body.clientWidth, height: body.clientHeight });
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