import * as vscode from 'vscode';

const METHOD_KEYWORDS = [
    'public',
    'private',
    'global',
    'protected',
    'override',
    'testmethod',
    'static',
    '@.+\\(.+\\)',
    '@.+',
];

type MethodInfo = {
    returnType: string;
    arguments: { [key: string]: string };
}

export default function addComment() {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }

        const selection = editor.selection;
        if (selection && !selection.isEmpty) {
            const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
            const highlighted = editor.document.getText(selectionRange);

            if (highlighted) {
                const initialIndentation = highlighted.trimEnd().replace(highlighted.trim(), '').replace(/\n|\r/g, '');
                const interMiditiateIndentation = ' ' + initialIndentation;
                const methodInfo = analyzeCode(highlighted);

                if (methodInfo !== 'Unknown format') {
                    let snippet: vscode.SnippetString;

                    // Check for existing comment
                    const commentRegex = /\/\*\*[\s\S]*?\*\//;
                    const existingCommentMatch = commentRegex.exec(highlighted);
                    if (existingCommentMatch) {
                        const existingComment = existingCommentMatch[0];
                        const updatedComment = updateComment(existingComment, methodInfo, initialIndentation, interMiditiateIndentation);
                        snippet = new vscode.SnippetString(updatedComment);
                    } else {
                        snippet = createNewComment(methodInfo, initialIndentation, interMiditiateIndentation);
                    }

                    editor.insertSnippet(snippet, selection.start);
                }
            }
        }
    } catch (error) {
        console.log('error :>> ', error);
        vscode.window.showErrorMessage('An error occurred while adding a comment.');
    }
}

function analyzeCode(code: string): string | MethodInfo {
    code = code.trim();

    // Check if it is a Class
    const classRegex = /\sclass\s/ig;
    if (classRegex.test(code)) {
        return 'Class';
    }

    // Check if it contains a method definition
    const isMethod = code.includes('(') && code.endsWith('}');
    if (isMethod) {
        const methodRegex = new RegExp(METHOD_KEYWORDS.join('|'), 'ig');
        let signature = code.substring(0, code.indexOf('{')).trim();
        signature = signature.replace(methodRegex, '').trim();

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
                const [argType, argName] = arg.trim().split(/\s+/);
                if (argName) {
                    methodInfo.arguments[argName] = argType;
                }
            });
        }

        return methodInfo;
    }

    return 'Unknown format';
}

function createNewComment(methodInfo: MethodInfo, initialIndentation: string, interMiditiateIndentation: string): vscode.SnippetString {
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
    return snippet;
}

function updateComment(existingComment: string, methodInfo: MethodInfo, initialIndentation: string, interMiditiateIndentation: string): string {
    const paramRegex = /@param\s+(\w+)\s+(\w+)/g;
    const existingParams = [];
    let match;

    while ((match = paramRegex.exec(existingComment)) !== null) {
        existingParams.push(match[1]);
    }

    const newParams = Object.keys(methodInfo.arguments);

    if (JSON.stringify(existingParams) !== JSON.stringify(newParams)) {
        let updatedComment = initialIndentation + '/**\n';
        updatedComment += interMiditiateIndentation + '* @description ';
        const descriptionMatch = /@description\s+(.+)/.exec(existingComment);
        updatedComment += (descriptionMatch ? descriptionMatch[1] : 'add your description here') + '\n';

        newParams.forEach(param => {
            updatedComment += `${interMiditiateIndentation}* @param ${param} ${methodInfo.arguments[param]}\n`;
        });

        updatedComment += interMiditiateIndentation + `* @return ${methodInfo.returnType}\n`;
        updatedComment += interMiditiateIndentation + '*/\n';

        return updatedComment;
    }

    return existingComment;
}