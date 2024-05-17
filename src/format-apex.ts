import * as vscode from 'vscode';

export default function format(doc: vscode.TextDocument): vscode.TextEdit[] {
    const editList: vscode.TextEdit[] = [];
    try {
        let depth: number = 0;
        let mlc = false;
        for (let i = 0; i < doc.lineCount; i++) {
            const line = doc.lineAt(i);
            let text: string = line.text.trim();
            const obj = indent(text, depth, mlc);
            text = obj.text;
            depth = obj.depth;
            mlc = obj.multilineComment;
            depth = countDepth(depth, text);
            editList.push(vscode.TextEdit.replace(line.range, text));
        }
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
    while (depth) {
        text = ('\t' + text);
        --depth;
    }
    return { text, depth: temp, multilineComment };
}

type Indentation = {
    text: string,
    depth: number,
    multilineComment: boolean
}