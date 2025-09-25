import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { fileSelector } from './fileSelector';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('addquickfile.addQuickFile', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('Open your workspace to be able to add files');
            return;
        }

        // context.sett

        const rootPath = workspaceFolders[0].uri.fsPath;

        let input = '';
        const quickPick = vscode.window.createQuickPick();
        quickPick.placeholder = 'Write path here...';

        
        const updateItems = async (value: string) => {
            input = value;
            const results = await searchPaths(rootPath, value);
            quickPick.items = results.map(r => ({ label: r }));
        };
        
        updateItems("");

        quickPick.onDidChangeValue(updateItems);

        quickPick.onDidAccept(async () => {
            const selection = quickPick.selectedItems[0];
            if (selection) {
                await createFile(context, selection);
            }
            quickPick.hide();
        });

        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
    });

    context.subscriptions.push(disposable);
}

async function createFile(context: vscode.ExtensionContext, selectedItem: vscode.QuickPickItem) {
  const inputBox = await vscode.window.showInputBox({ placeHolder: "" });
  if (!inputBox) { return; }

  let newPath = inputBox;

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('Open your workspace to be able to add files');
    return;
  }
  const rootPath = workspaceFolders[0].uri.fsPath;
  const selectedPath = selectedItem.label;

  const isDirInput = /[\\/]$/.test(newPath);

  const targetPath = path.join(rootPath, selectedPath, newPath);

  if (isDirInput) {
    await fs.promises.mkdir(targetPath, { recursive: true });
    return;
  }

  const pathSplitted = newPath.split(/[\\/]/).filter(Boolean);
  const filename = pathSplitted.at(-1) ?? "";
  const preparedText = fileSelector(filename);

  await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.promises.writeFile(targetPath, preparedText);

  const uri = vscode.Uri.file(targetPath);
  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(doc);
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
        if (
          file.toLowerCase().includes(word) || file.startsWith(".")
        ) {
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
