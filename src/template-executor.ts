import fs from 'fs';
import path from 'path';
const changeCase = import('change-case');
class FileToSave {
    public variables: Record<string, string>
    constructor(
        public readonly content: string[],
        variables: Record<string, string>
    ) {
        this.variables = JSON.parse(JSON.stringify(variables));
    }

    updateVariables(variables: Record<string, string>) {
        this.variables = JSON.parse(JSON.stringify(variables));
    }

    addLine(value: string) {
        this.content.push(value);
    }

    get filename() {
        return `${this.getVariable('filename')}.${this.getVariable('ext') }`;
    }

    get text() {
        return this.content.join('\n');
    }

    get folder() {
        return this.variables['folder'];
    }

    getVariable(name: string) {
        return this.variables[name] || `%${name}`;
    }
}

export class TemplateExecutor{
    private pipes: Record<string, (input: string) => Promise<string>> = {
        ['kebab-case']: async (input: string) => (await changeCase).kebabCase(input),
        ['camel-case']: async (input: string) => (await changeCase).camelCase(input),
        ['pascal-case']: async (input: string) => (await changeCase).pascalCase(input),
        ['constant-case']: async (input: string) => (await changeCase).constantCase(input),
        ['path-case']: async (input: string) => (await changeCase).pathCase(input),
    };
    targetPath: string = '';
    file: FileToSave[] = [];
    constructor(private variables: Record<string, string>, private template: string) {}
    setTargetPath(targetPath: string) {
        this.targetPath = targetPath;
    }
    async exec() {
        const lines = this.template.split('\n');
        this.file = [];
        let fileIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            if (!this.file[fileIndex]) {
                this.file[fileIndex] = new FileToSave([], this.variables);
            }
            const line = lines[i].replaceAll('\r', '');

            const trimmedLine = line.trim().replaceAll('\t', '');
            if (trimmedLine.startsWith('#')) {
                if (trimmedLine.startsWith('#split')) {
                    this.file[fileIndex].updateVariables(this.variables);
                    fileIndex++;
                } else {
                    let [name, expression] = line.split(':');
                    name = name.trim();
                    expression = expression.trim();
                    const varName = name.replace('#', '');
                    this.variables[varName] = await this.parseExpression(expression);
                    this.file[fileIndex].updateVariables(this.variables);
                }
            } else {
                this.file[fileIndex].addLine(this.parseLine(line));
            }
        }
        return this.file;
    }

    save() {
        for (const f of this.file) {
            this.saveFile(f);
        }
    }

    saveFile(file: FileToSave) {
        const result = file.text;
        const folder = path.join(this.targetPath, file.folder);
        fs.mkdirSync(folder, { recursive: true });
        if (result && file.content.some(Boolean)) {
            const resultPath = path.join(this.targetPath, file.folder, `./${file.filename}`);
            fs.writeFileSync(resultPath, result, 'utf8',);
        }
    }

    parseLine(text: string) {
        for (const key in this.variables) {
            text = text.replaceAll(`%${key}`, this.variables[key] || `%${key}`);
        }
        return text;
    }

    async parseExpression(expression: string) {
        let text = this.parseLine(expression);

        let [name, ...pipes] = text.split('|>');
        name = name.trim();
        for (let pipe of pipes) {
            pipe = pipe.trim();
            name = await this.execPipe(name, pipe);
        }

        return name;
    }

    execPipe(text: string, pipeName: string) {
        if (!this.pipes[pipeName]) {
            return text + pipeName;
        }
        return this.pipes[pipeName](text);
    }
}
