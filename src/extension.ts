import * as vscode from 'vscode';
import { FsNodeResolver } from './fs-node-resolver';
import { StateView } from './state-view';
import { TemplateExecutor } from './template-executor';

const SHOW_COMMAND = 'file-templates.show';
export function activate(context: vscode.ExtensionContext) {
	const stateView = new StateView(SHOW_COMMAND, context);
	const fsNodeResolver = new FsNodeResolver();

	const createFile = async (targetPath: string, filePath: string) => {
		stateView.show('Read templates folders');
		let templateData = await fsNodeResolver.getTemplate(filePath);
		if (!templateData) {
			return;
		}
		const executor = new TemplateExecutor({ input: templateData.inputVariable, folder: '' }, templateData.templateContext);
		executor.setTargetPath(targetPath);
		await executor.exec((state: string) => {
			stateView.show(state);
		});
		executor.save((state: string) => {
			stateView.show(state);
		});
		vscode.window.showInformationMessage(`Complete creating ${executor.files.length} files`);
	};


	const disposable = vscode.commands.registerCommand(SHOW_COMMAND, async (uri: vscode.Uri) => {
		try {
			let targetPath: string | undefined = uri?.fsPath;
			if (!targetPath) {
				targetPath = await vscode.window.showInputBox({ title: 'Target folder' });
			}
			if (!targetPath) {
				throw new Error("Select folder and launch command");
			}
			stateView.show('Resolving folders');
			const data = await fsNodeResolver.resolve();
			if (!data) { return; }
			await createFile(uri.fsPath, data.filePath);
		} catch (error) {
			//@ts-ignore
			vscode.window.showErrorMessage(`Create file error`, error.toString());
		}
		stateView.hide();
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
