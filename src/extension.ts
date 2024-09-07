// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const changeCase = require('change-case');
import fs from 'fs';
import path from 'path';
import * as vscode from 'vscode';
import { Node, readDirTree } from './read-dir-tree';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "file-templates" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

	async function showList(node: Node) {
		const selectedCustomFile = await vscode.window.showQuickPick(node.children.map(e => e.name), { title: 'Custom Templates', });
		if (!selectedCustomFile) {
			return null;
		}

		return node.children.find(e => e.name === selectedCustomFile)!;
	}

	const createFile = async (targetPath: string, filePath: string, templateName: string) => {
		let fileName = await vscode.window.showInputBox({ title: 'File Name' });
		if (!fileName) { return; }

		let content = fs.readFileSync(filePath, 'utf-8');
		let lines = content.split('\n');

		const [_, extLine] = lines.find(e => e.startsWith('#ext'))?.split(':')??[];
		const [_1, fileNameCaseLine] = lines.find(e => e.startsWith('#filename-case'))?.split(':') ?? [];

		if (fileNameCaseLine === 'snake-case') {
			fileName = changeCase.snakeCase(fileName) + '';
		}
		else if (fileNameCaseLine === 'kebab-case') {
			fileName = changeCase.kebabCase(fileName) + '';
		}

		const extIndex = lines.findIndex(e => e.startsWith('#ext'));
		if (~extIndex) {
			lines.splice(extIndex, 1);
		}
		const filenameCaseIndex = lines.findIndex(e => e.startsWith('#filename-case'));
		if (~filenameCaseIndex) {
			lines.splice(extIndex, 1);
		}

		content = lines.join('\n');
		const [_2, ext] = templateName.split('.');

		const resultPath = path.join(targetPath, `./${fileName}.${extLine ?? ext}`);
		content = content.replaceAll('%filenamePascalCase', changeCase.pascalCase(fileName));
		content = content.replaceAll('%filename', fileName);

		fs.writeFileSync(resultPath, content, 'utf8');

		const openPath = vscode.Uri.file(resultPath);
		vscode.commands.executeCommand('vscode.open', openPath);
	};

	const disposable = vscode.commands.registerCommand('file-templates.show', async (uri: vscode.Uri) => {
		const prefabsPath = path.resolve(__dirname, './templates');

		const workspaceFolders = (vscode.workspace.workspaceFolders?.map(e => {
			return {path:path.resolve(e.uri.fsPath, './.vscode', './.templates'), name: e.name};
		}) ?? []).filter(e => fs.existsSync(e.path));


		const tree: Node = {
			type: 'dir',
			name: 'root',
			path: '',
			children: [
				readDirTree(prefabsPath, 'examples'),
				...workspaceFolders.map(e => readDirTree(e.path, e.name))
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

		if (root.type !== 'file') {return;}
		const filePath = root.path;
		createFile(uri.fsPath, filePath, root.name);
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
