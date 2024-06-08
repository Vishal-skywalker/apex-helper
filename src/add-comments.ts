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
                // Detect and remove existing comment if any
                const { cleanedCode, commentRange, descValue, dateValue } = await removeExistingComment(editor, selectionRange);

                // Analyze the cleaned code (without the old comment)
                let initialIndentation = cleanedCode.match(/^\s*/)?.[0] || ''; // Get leading spaces for indentation
                const methodInfo = analyzeCode(cleanedCode);

                if (methodInfo !== 'Unknown format') {
                    // Insert new comment snippet
                    insertCommentSnippet(editor, commentRange.start, methodInfo, initialIndentation, descValue, dateValue);
                }
            }
        }
    } catch (error) {
        console.log('Error adding comment:', error);
    }
}

async function removeExistingComment(editor: vscode.TextEditor, selectionRange: vscode.Range): Promise<{ cleanedCode: string, commentRange: vscode.Range, descValue: string, dateValue: string }> {
    // Get the full text including comments
    const fullText = editor.document.getText(selectionRange);
    
    // Detect the existing Javadoc comment block (/** ... */)
    const leadingJavadocPattern = /\/\*\*[\s\S]*?\*\//;
    const match = fullText.match(leadingJavadocPattern);

    if (match) {
        // Remove the leading Javadoc comment and adjust the range
        const startPos = selectionRange.start;
        const startOffset = editor.document.offsetAt(startPos);
        const commentStart = startOffset + fullText.indexOf(match[0]);
        const commentEnd = commentStart + match[0].length;

        const commentRange = new vscode.Range(
            editor.document.positionAt(commentStart),
            editor.document.positionAt(commentEnd)
        );

        // Extract description value
        const descriptionPattern = /@description\s+(.*)/;
        const descMatch = match[0].match(descriptionPattern);
        const descValue = descMatch ? descMatch[1].trim() : '';

        // Extract description value
        const datePattern = /@Date\s+(.*)/;
        const dateMatch = match[0].match(datePattern);
        const dateValue = dateMatch ? dateMatch[1].trim() : '';

        // Remove the comment from the document
        await editor.edit(editBuilder => {
            editBuilder.delete(commentRange);
        });

        // Return the cleaned code, adjusted range, and description value
        const cleanedCode = fullText.replace(match[0], '').trimStart();
        return { cleanedCode, commentRange: new vscode.Range(selectionRange.start, selectionRange.end), descValue, dateValue};
    }

    return { cleanedCode: fullText, commentRange: selectionRange, descValue: '' , dateValue: ''};
}

function analyzeCode(code: string): string | MethodInfo {
    code = code.trim();

    // Check if it's a class
    if (/\sclass\s/.test(code)) {
        return 'Class';
    }

    // Check if it's a method
    if (/\w+\s+\w+\s*\(.*\)\s*{/.test(code)) {
        // Extract method signature
        let signature = code.substring(0, code.indexOf('{')).trim();

        // Remove method keywords and annotations
        const methodRegex = new RegExp(METHOD_KEYWORDS.join('|'), 'g');
        signature = signature.replace(methodRegex, '').trim();

        // Split signature into return type and method name + args
        const parts = signature.split(/\s+/);
        const returnType = parts[0];
        const argsString = signature.substring(signature.indexOf('(') + 1, signature.indexOf(')')).trim();

        const methodInfo: MethodInfo = {
            returnType,
            arguments: {}
        };

        // Extract arguments
        if (argsString) {
            const argsArray = argsString.split(',');
            argsArray.forEach(arg => {
                const [argType, argName] = arg.trim().split(/\s+/);
                if (argType && argName) {
                    methodInfo.arguments[argName] = argType;
                }
            });
        }
        return methodInfo;
    }

    return 'Unknown format';
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