import fs from 'fs';
import path from 'path';
import { Node, readDirTree } from './read-dir-tree';
import * as vscode from 'vscode';

export class FsNodeResolver {
    async showList(node: Node) {
        const selectedCustomFile = await vscode.window.showQuickPick(node.children.map(e => e.name), { title: 'Custom Templates', });
        if (!selectedCustomFile) {
            return null;
        }

        return node.children.find(e => e.name === selectedCustomFile)!;
    }

    async resolve() {
        const prefabsPath = path.resolve(__dirname, './templates');

        const workspaceFolders = (vscode.workspace.workspaceFolders?.map(e => {
            return { path: path.resolve(e.uri.fsPath, './.vscode', './.templates'), name: e.name };
        }) ?? []).filter(e => fs.existsSync(e.path));


        const tree: Node = {
            type: 'dir',
            name: 'root',
            path: '',
            children: [
                ...workspaceFolders.map(e => readDirTree(e.path, e.name)),
                readDirTree(prefabsPath, 'examples'),
            ]
        };

        let root = tree;
        const paths: string[] = [];
        while (root) {
            let res = await this.showList(root);
            if (!res) { break; }
            paths.push(res.name);
            root = res;
            if (root.type === 'file') { break; }
        }

        if (root.type !== 'file') { return; }
        const filePath = root.path;
        return {filePath,root};
    }

    async getTemplate(filePath: string) {
        let originalFileName = await vscode.window.showInputBox({ title: 'File Name | %input variable' });
        if (!originalFileName) { return; }

        let originalContent = fs.readFileSync(filePath, 'utf-8');
        return {
            templateContext: originalContent,
            inputVariable: originalFileName
        };
    }
}
