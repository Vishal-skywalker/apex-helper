import * as vscode from 'vscode';
import format from './format-apex';

export function activate(context: vscode.ExtensionContext) {

	vscode.languages.registerDocumentFormattingEditProvider('apex', {
		provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
			return format(document);
		}
	});
}

export function deactivate() { }
