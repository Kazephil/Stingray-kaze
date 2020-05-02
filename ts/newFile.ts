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
            document.getElementById('browseAlignment').blur();
        });
        this.electron.ipcRenderer.on('set-alignment', (event, arg) => {
            (document.getElementById('alignmentInput') as HTMLInputElement).value = arg;
        });        
        document.getElementById('browseSource').addEventListener('click', () => {
            this.electron.ipcRenderer.send('browse-source');
            document.getElementById('browseSource').blur();
        });
        this.electron.ipcRenderer.on('set-source', (event, arg) => {
            this.setSource(arg);
        });
        this.electron.ipcRenderer.on('set-target', (event, arg) => {
           this.setTarget(arg);
        });
        document.getElementById('browseTarget').addEventListener('click', () => {
            this.electron.ipcRenderer.send('browse-target');
            document.getElementById('browseTarget').blur();
        });
        document.getElementById('create').addEventListener('click', () => {
            this.createAlignment();
            document.getElementById('create').blur();
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
        if (arg.srcLang !== 'none') {
            (document.getElementById('srcLangSelect') as HTMLSelectElement).value = arg.srcLang;
        }
        document.getElementById('tgtLangSelect').innerHTML = languageOptions;
        if (arg.tgtLang !== 'none') {
            (document.getElementById('tgtLangSelect') as HTMLSelectElement).value = arg.tgtLang;
        }
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

    setSource(arg: any): void {
        (document.getElementById('sourceInput') as HTMLInputElement).value = arg.file;
        if (arg.type) {
            (document.getElementById('srcTypeSelect') as HTMLSelectElement).value = arg.type;
        }
        if (arg.charset) {
            (document.getElementById('srcEncodingSelect') as HTMLSelectElement).value = arg.charset;
        }

    }

    setTarget(arg: any): void {
        (document.getElementById('targetInput') as HTMLInputElement).value = arg.file;
        if (arg.type) {
            (document.getElementById('tgtTypeSelect') as HTMLSelectElement).value = arg.type;
        }
        if (arg.charset) {
            (document.getElementById('tgtEncodingSelect') as HTMLSelectElement).value = arg.charset;
        }

    }

    createAlignment(): void {
        let alignmentFile = (document.getElementById('alignmentInput') as HTMLInputElement).value;
        if (alignmentFile === '') {
            window.alert('Select alignment file');
            return;
        }
        let sourceFile = (document.getElementById('sourceInput') as HTMLInputElement).value;
        if (sourceFile === '') {
            window.alert('Select source file');
            return;
        }
        let srcLang = (document.getElementById('srcLangSelect') as HTMLSelectElement).value;
        if (srcLang === 'none') {
            window.alert('Select source language');
            return;
        }
        let srcType = (document.getElementById('srcTypeSelect') as HTMLSelectElement).value;
        if (srcType === 'none') {
            window.alert('Select source file type');
            return;
        }
        let srcEnc = (document.getElementById('srcEncodingSelect') as HTMLSelectElement).value;
        if (srcEnc === 'none') {
            window.alert('Select source character set');
            return;
        }
        let targetFile = (document.getElementById('targetInput') as HTMLInputElement).value;
        if (targetFile === '') {
            window.alert('Select target file');
            return;
        }
        let tgtLang = (document.getElementById('srcLangSelect') as HTMLSelectElement).value;
        if (tgtLang === 'none') {
            window.alert('Select target language');
            return;
        }
        let tgtType = (document.getElementById('srcTypeSelect') as HTMLSelectElement).value;
        if (tgtType === 'none') {
            window.alert('Select target file type');
            return;
        }
        let tgtEnc = (document.getElementById('srcEncodingSelect') as HTMLSelectElement).value;
        if (tgtEnc === 'none') {
            window.alert('Select target character set');
            return;
        }
        let paragraph = (document.getElementById('paragraph') as HTMLInputElement).checked;
        let params = {
            alignmentFile: alignmentFile,
            sourceFile: sourceFile,
            srcLang: srcLang,
            srcType: srcType,
            srcEnc: srcEnc,
            targetFile: targetFile,
            tgtLang: tgtLang,
            tgtType: tgtType,
            tgtEnc: tgtEnc,
            paragraph: paragraph
        }
        this.electron.ipcRenderer.send('create-alignment', params);
    }
}

new NewFile();