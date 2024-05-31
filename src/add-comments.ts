import * as vscode from 'vscode';

const METHOD_KEYWORDS = [
    'public',
    'private',
    'global',
    'protected',
    'override',
    'testmethod',
    'static',
    "@.+\\(.+\\)",
    "@.+",
];

type MethodInfo = {
    returnType: string;
    arguments: { [key: string]: string };
}

export default function addComment() {
    try {
        const editor = vscode.window.activeTextEditor;
        const selection = editor?.selection;
        if (selection && !selection.isEmpty) {
            const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
            const highlighted = editor.document.getText(selectionRange);
            if (highlighted) {
                const initialIndentation = highlighted.trimEnd().replace(highlighted.trim(), '').replaceAll('\n', '').replaceAll('\r', '');
                const interMiditiateIndentation = ' ' + initialIndentation;
                const methodInfo = analyzeCode(highlighted);
                if (methodInfo !== 'Unknown format') {
                    const snippet = new vscode.SnippetString(initialIndentation + '/**\n');
                    snippet.appendText(interMiditiateIndentation + '* @description ');
                    snippet.appendPlaceholder('add your description here');
                    snippet.appendText('\n');
                    if (methodInfo !== 'Class' && typeof methodInfo !== 'string') {
                        for (const key in methodInfo.arguments) {
                            snippet.appendText(`${interMiditiateIndentation}* @param ${key} ${methodInfo.arguments[key]}\n`);
                        }
                        snippet.appendText(interMiditiateIndentation + `* @return ${methodInfo.returnType}\n`);
                    }
                    snippet.appendText(interMiditiateIndentation + '*/\n');
                    editor.insertSnippet(snippet, selection.start);
                }
            }
        }
    } catch (error) {
        console.log('error :>> ', error);
    }
}

function analyzeCode(code: string): string | MethodInfo {
    code = code.trim();
    // Check if it is a Class
    const classRegex = new RegExp('\\sclass\\s', 'ig');
    if (classRegex.test(code)) {
        return 'Class';
    }
    // Check if it contains a method definition
    const isMethod = code.includes('(') && code.endsWith('}');
    if (isMethod) {
        const methodRegex = new RegExp(METHOD_KEYWORDS.join('|'), 'ig');
        let signature = code.substring(0, code.indexOf('{')).trim();
        signature = signature.replaceAll(methodRegex, '').trim();
        const returnType = signature.split(' ')[0];
        const methodInfo: MethodInfo = {
            returnType,
            arguments: {}
        };
        // Extract arguments
        const argsString = signature.substring(signature.indexOf('(') + 1, signature.indexOf(')')).trim();
        if (argsString) {
            const argsArray = argsString.split(',');
            argsArray.forEach(arg => {
                const argParts = arg.trim().split(' ');
                const argType = argParts[0]?.trim();
                const argName = argParts[1]?.trim();
                methodInfo.arguments[argName] = argType;
            });
        }
        return methodInfo;
    }
    return 'Unknown format';
}