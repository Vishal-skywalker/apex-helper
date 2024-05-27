import * as vscode from 'vscode';

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
    if (!text.replaceAll(/[\s]/ig, '')) {
        return { text, depth, multilineComment: mlc };
    }
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
    // if (!(mlc || multilineComment)) {
    //     text = addSpaces(text);
    // }
    if (text.startsWith('*') && mlc) {
        text = ' ' + text;
    }
    text = TAB.repeat(depth) + text;
    return { text, depth: temp, multilineComment };
}

function addSpaces(args: string): string {
    const spacedArgs = args
        .replace(/\s*([\+\-\*\/\=\^\&\|\%]+)\s*/g, ' $1 ') // add spaces
        .replace(/ +/g, ' ') // ensure no duplicate spaces
        .replace(/\( /g, '(') // remove space after (
        .replace(/ \)/g, ')'); // remove space before )
    return spacedArgs;
}