import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('addquickfile.addQuickFile', async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			vscode.window.showErrorMessage('Открой рабочую папку (workspace), чтобы использовать эту команду.');
			return;
		}

		const rootPath = workspaceFolders[0].uri.fsPath;

		let input = '';
		const quickPick = vscode.window.createQuickPick();
		quickPick.placeholder = 'Введите часть пути файла или папки...';

		
		const updateItems = async (value: string) => {
			input = value;
			const results = await searchPaths(rootPath, value);
			quickPick.items = results.map(r => ({ label: r }));
		};
		
		updateItems("");

		quickPick.onDidChangeValue(updateItems);

		quickPick.onDidAccept(() => {
			const selection = quickPick.selectedItems[0];
			if (selection) {
				vscode.window.showInformationMessage(`Вы выбрали: ${selection.label}`);
			}
			quickPick.hide();
		});

		quickPick.onDidHide(() => quickPick.dispose());
		quickPick.show();
	});

	context.subscriptions.push(disposable);
}

async function searchPaths(root: string, query: string): Promise<string[]> {
	const results: string[] = [];

	const searchWords = [".venv", "venv", "site-package", "node-modules"];

	async function walk(dir: string) {
		let files = await fs.promises.readdir(
			dir,
			// check this shit
			{"withFileTypes": false, "recursive": false}
		);
		
		let approvedFiles = [];

		for (const file of files) {
			let shouldAdd = true;
			for (const word of searchWords) {
				if (file.toLowerCase().includes(word)) {
					shouldAdd = false;
					break;
				}
			}
			if (shouldAdd) {
				approvedFiles.push(file);
			}
		}

		for (const file of approvedFiles) {
			const fullPath = path.join(dir, file);
			const relPath = path.relative(root, fullPath);
			const stat = await fs.promises.stat(fullPath);

			if (stat.isDirectory()) {
				if (relPath.toLowerCase().includes(query.toLowerCase())) {
					results.push(relPath);
				}
				await walk(fullPath);
			}
		}
	}

	try {
		await walk(root);
	} catch (err) {
		console.error('Ошибка при обходе папок:', err);
	}

	return results.slice(0, 50); // Ограничим кол-во результатов
}

export function deactivate() {}
