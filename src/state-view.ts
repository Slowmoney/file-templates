import * as vscode from 'vscode';

export class StateView {
    private statusBarItem: vscode.StatusBarItem;
    constructor(private command: string, context: vscode.ExtensionContext) {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = command;
        context.subscriptions.push(this.statusBarItem);
    }

    show(text: string) {
        console.log('show', text);
        this.statusBarItem.text = `$(file-directory-create) ${text}`;//`$(file-directory-create) Create files`;
        this.statusBarItem.show();
    }

    hide() {
        this.statusBarItem.text = ``;
        this.statusBarItem.hide();
    }
}
