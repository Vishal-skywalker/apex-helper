import * as vscode from 'vscode';
import Formatter from './auto-formatter/formatters/apexFormatter.js';

type Indentation = {
    text: string,
    depth: number,
    multilineComment: boolean
}

let TAB = ' '.repeat(4);

export default function format(doc: vscode.TextDocument): vscode.TextEdit[] {
    if (typeof vscode.window.activeTextEditor?.options.indentSize === 'number') {
        TAB = ' '.repeat(vscode.window.activeTextEditor?.options.indentSize);
    }
    const editList: vscode.TextEdit[] = [];
    try {
        const formattedDoc = new Formatter(TAB).format(doc.getText());
        const edit = vscode.TextEdit.replace(
            new vscode.Range(
                new vscode.Position(0, 0),
                doc.lineAt(doc.lineCount - 1).range.end
            ),
            formattedDoc
        );
        editList.push(edit);
    } catch (error) {
        console.log('error', error)
    }
    return editList;
}

function countDepth(depth: number, text: string): number {
    let comment = '';
    const commentStart = text.indexOf('//');
    if (commentStart > 0 && text.indexOf('{') < commentStart) {
        comment = text.slice(commentStart);
        text = text.slice(0, commentStart);
    }
    if (text.endsWith('{')) {
        ++depth;
    }
    return depth;
}

function indent(text: string, depth: number, mlc: boolean): Indentation {
    let temp = depth;
    let multilineComment = mlc;
    if (mlc && text.endsWith('*/')) {
        multilineComment = false;
    } else if (!mlc) {
        multilineComment = text.startsWith('/*');
    }
    if (text.startsWith('}')) {
        temp = --depth;
    }
    if (text.startsWith('*') && mlc) {
        text = ' ' + text;
    }
    text = TAB.repeat(depth) + text;
    return { text, depth: temp, multilineComment };
}