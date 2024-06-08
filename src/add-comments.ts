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
};

export default async function addComment() {
    try {
        const editor = vscode.window.activeTextEditor;
        const selection = editor?.selection;

        if (selection && !selection.isEmpty) {
            const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
            const highlighted = editor.document.getText(selectionRange);

            if (highlighted) {
                // Removing and Preserving Description and Date Value
                const { cleanedCode, commentRange, descValue, dateValue } = await removeExistingComment(editor, selectionRange);

                // Analyis code after removing existing comment
                let initialIndentation = cleanedCode.match(/^\s*/)?.[0] || '';
                const methodInfo = analyzeCode(cleanedCode);

                if (methodInfo !== 'Unknown format') {
                    //adding new comment with existing description and date value
                    insertCommentSnippet(editor, commentRange.start, methodInfo, initialIndentation, descValue, dateValue);
                }
            }
        }
    } catch (error) {
        console.log('Error adding comment:', error);
    }
}

async function removeExistingComment(editor: vscode.TextEditor, selectionRange: vscode.Range): Promise<{ cleanedCode: string, commentRange: vscode.Range, descValue: string, dateValue: string }> {
    const fullText = editor.document.getText(selectionRange);
    
    const leadingJavadocPattern = /\/\*\*[\s\S]*?\*\//;
    const match = fullText.match(leadingJavadocPattern);

    if (match) {
        const startPos = selectionRange.start;
        const startOffset = editor.document.offsetAt(startPos);
        const commentStart = startOffset + fullText.indexOf(match[0]);
        const commentEnd = commentStart + match[0].length;

        const commentRange = new vscode.Range(
            editor.document.positionAt(commentStart),
            editor.document.positionAt(commentEnd)
        );

        // Extracting Description Value from existing comment
        const descriptionPattern = /@description\s+(.*)/;
        const descMatch = match[0].match(descriptionPattern);
        const descValue = descMatch ? descMatch[1].trim() : '';

        // Extracting Date Value from existing comment
        const datePattern = /@Date\s+(.*)/;
        const dateMatch = match[0].match(datePattern);
        const dateValue = dateMatch ? dateMatch[1].trim() : '';

        // removing the comment from selection
        await editor.edit(editBuilder => {
            editBuilder.delete(commentRange);
        });

        const cleanedCode = fullText.replace(match[0], '').trimStart();
        return { cleanedCode, commentRange: new vscode.Range(selectionRange.start, selectionRange.end), descValue, dateValue };
    }

    return { cleanedCode: fullText, commentRange: selectionRange, descValue: '' , dateValue: ''};
}

function analyzeCode(code: string): string | MethodInfo {
    code = code.trim();

    // check for class
    if (/\sclass\s/.test(code)) {
        return 'Class';
    }

    // Check for method
    if (/\w+\s+\w+\s*\(.*\)\s*{/.test(code)) {
        let signature = code.substring(0, code.indexOf('{')).trim();

        const methodRegex = new RegExp(METHOD_KEYWORDS.join('|'), 'g');
        signature = signature.replace(methodRegex, '').trim();

        const methodParts = signature.match(/(.*)\s+(\w+)\s*\((.*)\)/);
        if (!methodParts) return 'Unknown format';

        const returnType = methodParts[1].trim();
        const argsString = methodParts[3].trim();

        const methodInfo: MethodInfo = {
            returnType,
            arguments: {}
        };

        if (argsString) {
            const argsArray = parseArguments(argsString);
            argsArray.forEach(arg => {
                const [argType, argName] = splitArgTypeAndName(arg);
                if (argType && argName) {
                    methodInfo.arguments[argName] = argType.trim();
                }
            });
        }
        return methodInfo;
    }

    return 'Unknown format';
}

function parseArguments(argsString: string): string[] {
    let args = [];
    let depth = 0;
    let currentArg = '';

    for (let i = 0; i < argsString.length; i++) {
        const char = argsString[i];

        if (char === ',' && depth === 0) {
            args.push(currentArg.trim());
            currentArg = '';
        } else {
            currentArg += char;
            if (char === '<' || char === '(') depth++;
            if (char === '>' || char === ')') depth--;
        }
    }
    if (currentArg.trim()) args.push(currentArg.trim());

    return args;
}

function splitArgTypeAndName(arg: string): [string, string] {
    const match = arg.match(/(.+)\s+(\w+)$/);
    if (match) {
        const [, argType, argName] = match;
        return [argType, argName];
    }
    return ['', ''];
}

function insertCommentSnippet(editor: vscode.TextEditor, position: vscode.Position, methodInfo: MethodInfo | string, initialIndentation: string, descValue: string, dateValue: string) {
    const snippet = new vscode.SnippetString(`${initialIndentation}/**\n`);
    if(descValue){
        snippet.appendText(`${initialIndentation} * @description ${descValue}\n`);
    }else{
        snippet.appendText(`${initialIndentation} * @description add your description here\n`);
    }
    snippet.appendText(`${initialIndentation} * \n`);

    if (typeof methodInfo !== 'string' && methodInfo !== 'Class') {
        for (const key in methodInfo.arguments) {
            snippet.appendText(`${initialIndentation} * @param ${key} ${methodInfo.arguments[key]}\n`);
        }
        if(dateValue){
            snippet.appendText(`${initialIndentation} * @Date ${dateValue}\n`);
        }else{
            const formattedDate = `${new Date().getDate()} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][new Date().getMonth()]} ${new Date().getFullYear()}`;
            snippet.appendText(`${initialIndentation} * @Date ${formattedDate}\n`);
        }
        snippet.appendText(`${initialIndentation} * @return ${methodInfo.returnType}\n`);
    }

    snippet.appendText(`${initialIndentation} */\n`);
    editor.insertSnippet(snippet, position);
}