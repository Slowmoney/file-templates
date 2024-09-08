import fs from 'fs';
import path from 'path';
import * as vscode from 'vscode';
import { Node, readDirTree } from './read-dir-tree';
import { TemplateExecutor } from './template-executor';

export function activate(context: vscode.ExtensionContext) {
	async function showList(node: Node) {
		const selectedCustomFile = await vscode.window.showQuickPick(node.children.map(e => e.name), { title: 'Custom Templates', });
		if (!selectedCustomFile) {
			return null;
		}

		return node.children.find(e => e.name === selectedCustomFile)!;
	}

	const createFile = async (targetPath: string, filePath: string, templateName: string) => {
		let originalFileName = await vscode.window.showInputBox({ title: 'File Name' });
		if (!originalFileName) { return; }

		let originalContent = fs.readFileSync(filePath, 'utf-8');

		const executor = new TemplateExecutor({ input: originalFileName, folder: '' }, originalContent);
		executor.setTargetPath(targetPath);
		await executor.exec();
		executor.save();
	};

	const disposable = vscode.commands.registerCommand('file-templates.show', async (uri: vscode.Uri) => {
		try {
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
				let res = await showList(root);
				if (!res) { break; }
				paths.push(res.name);
				root = res;
				if (root.type === 'file') { break; }
			}

			if (root.type !== 'file') { return; }
			const filePath = root.path;
			await createFile(uri.fsPath, filePath, root.name);
		} catch (error) {
			//@ts-ignore
			vscode.window.showInformationMessage(`Create file error`, error.toString());
		}

	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
