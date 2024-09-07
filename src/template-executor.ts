import path from 'path';
import fs from 'fs';
const changeCase = require('change-case');
interface FileToSave {
    content: string[];
    variables: Record<string, string>;
}

export class TemplateExecutor{
    private pipes: Record<string, (input: string) => string> = {
        ['kebab-case']: (input: string) => changeCase.kebabCase(input),
        ['camel-case']: (input: string) => changeCase.camelCase(input),
        ['pascal-case']: (input: string) => changeCase.pascalCase(input),
        ['constant-case']: (input: string) => changeCase.constantCase(input),
        ['path-case']: (input: string) => changeCase.pathCase(input),
    };
    targetPath: string = '';
    constructor(private variables: Record<string, string>, private template: string) {}
    setTargetPath(targetPath: string) {
        this.targetPath = targetPath;
    }
    exec() {
        const lines = this.template.split('\n');
        const file: FileToSave[] = [];
        let fileIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            if (!file[fileIndex]) {
                file[fileIndex] = { content: [], variables: JSON.parse(JSON.stringify(this.variables)) };
            }
            const line = lines[i].replaceAll('\r', '');
            if (line.startsWith('#')) {
                if (line.includes('#split')) {
                    file[fileIndex].variables = JSON.parse(JSON.stringify(this.variables));
                    fileIndex++;
                } else {
                    const [name, expression] = line.split(':');
                    const varName = name.replace('#', '');
                    this.variables[varName] = this.parseExpression(expression);
                    file[fileIndex].variables = JSON.parse(JSON.stringify(this.variables));
                }
            } else {
                file[fileIndex].content.push(this.parseLine(line));
            }
        }
        for (const f of file) {
            this.saveFile(f);
        }
    }

    saveFile(file: FileToSave) {
        const result = file.content.join('\n');
        const folder = path.join(this.targetPath, file.variables['folder']);
        fs.mkdirSync(folder, { recursive: true });
        if (result && file.content.some(Boolean)) {
            const resultPath = path.join(this.targetPath, file.variables['folder'], `./${file.variables['filename'] || `%filename`}.${file.variables['ext'] || '%ext'}`);
            fs.writeFileSync(resultPath, result, 'utf8',);
        }
    }

    parseLine(text: string) {
        for (const key in this.variables) {
            text = text.replaceAll(`%${key}`, this.variables[key] ?? `%${key}`);
        }
        return text;
    }

    parseExpression(expression: string) {
        let text = this.parseLine(expression);

        const [name, ...pipes] = text.split('|>');

        for (const pipe of pipes) {
            text = this.execPipe(name, pipe);
        }

        return text;
    }

    execPipe(text: string, pipeName: string): string {
        if (!this.pipes[pipeName]) {throw new Error(`unknown pipe ${pipeName}`);}
        return this.pipes[pipeName](text);
    }
}
