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

class NewFile {

    electron = require('electron');

    constructor() {
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event, arg) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        this.electron.ipcRenderer.send('get-languages');
        this.electron.ipcRenderer.on('set-languages', (event, arg) => {
            this.setLanguages(arg);
        });
        this.electron.ipcRenderer.send('get-types');
        this.electron.ipcRenderer.on('set-types', (event, arg) => {
            this.setTypes(arg);
        });
        this.electron.ipcRenderer.send('get-charsets');
        this.electron.ipcRenderer.on('set-charsets', (event, arg) => {
            this.setCharsets(arg);
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                window.close();
            }
        });
        this.electron.ipcRenderer.on('get-height', () => {
            let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
            this.electron.ipcRenderer.send('newFile-height', { width: body.clientWidth, height: body.clientHeight });
        });
        document.getElementById('browseAlignment').addEventListener('click', () => {
            this.electron.ipcRenderer.send('browse-alignment');
        });
        this.electron.ipcRenderer.on('set-alignment', (event, arg) => {
            (document.getElementById('alignmentInput') as HTMLInputElement).value = arg;
        });        
        document.getElementById('browseSource').addEventListener('click', () => {
            this.electron.ipcRenderer.send('browse-source');
        });
        this.electron.ipcRenderer.on('set-source', (event, arg) => {
            (document.getElementById('sourceInput') as HTMLInputElement).value = arg;
        });
        this.electron.ipcRenderer.on('set-target', (event, arg) => {
            (document.getElementById('targetInput') as HTMLInputElement).value = arg;
        });
        document.getElementById('browseTarget').addEventListener('click', () => {
            this.electron.ipcRenderer.send('browse-target');
        });
    }

    setLanguages(arg: any): void {
        var array: any[] = arg.languages;
        var languageOptions = '<option value="none">Select Language</option>';
        for (let i = 0; i < array.length; i++) {
            var lang = array[i];
            languageOptions = languageOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        }
        document.getElementById('srcLangSelect').innerHTML = languageOptions;
        document.getElementById('tgtLangSelect').innerHTML = languageOptions;
    }

    setTypes(arg: any) : void {
        var array: any[] = arg.types;
        var typeOptions = '<option value="none">Select Type</option>';
        for (let i = 0; i < array.length; i++) {
            var type = array[i];
            typeOptions = typeOptions + '<option value="' + type.code + '">' + type.description + '</option>';
        }
        document.getElementById('srcTypeSelect').innerHTML = typeOptions;
        document.getElementById('tgtTypeSelect').innerHTML = typeOptions;
    }

    setCharsets(arg: any) : void {
        var array: any[] = arg.charsets;
        var typeOptions = '<option value="none">Select Character Set</option>';
        for (let i = 0; i < array.length; i++) {
            var type = array[i];
            typeOptions = typeOptions + '<option value="' + type.code + '">' + type.description + '</option>';
        }
        document.getElementById('srcEncodingSelect').innerHTML = typeOptions;
        document.getElementById('tgtEncodingSelect').innerHTML = typeOptions;
    }
}

new NewFile();