import * as vscode from 'vscode';
import format from './format-apex';
import addComment from './add-comments';

export function activate(context: vscode.ExtensionContext) {

	vscode.languages.registerDocumentFormattingEditProvider('apex', {
		provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
			return format(document);
		}
	});

	const command = 'apex-helper.addComments';
	vscode.commands.registerCommand(command, addComment);
}

export function deactivate() { }
