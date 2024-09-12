import { FileTemplate } from './file-template';
const changeCase = import('change-case');

export class TemplateExecutor{
    private pipes: Record<string, (input: string) => Promise<string>> = {
        ['kebab-case']: async (input: string) => (await changeCase).kebabCase(input),
        ['camel-case']: async (input: string) => (await changeCase).camelCase(input),
        ['pascal-case']: async (input: string) => (await changeCase).pascalCase(input),
        ['constant-case']: async (input: string) => (await changeCase).constantCase(input),
        ['path-case']: async (input: string) => (await changeCase).pathCase(input),
        ['snake-case']: async (input: string) => (await changeCase).snakeCase(input),
        ['no-case']: async (input: string) => (await changeCase).noCase(input),
        ['pascal-snake-case']: async (input: string) => (await changeCase).pascalSnakeCase(input),
        ['dot-case']: async (input: string) => (await changeCase).dotCase(input),
    };
    targetPath: string = '';
    files: FileTemplate[] = [];
    constructor(private variables: Record<string, string>, private template: string) {}
    setTargetPath(targetPath: string) {
        this.targetPath = targetPath;
    }
    async exec(onStateChange: (state: string) => void) {
        const lines = this.template.split('\n');
        this.files = [];
        let fileIndex = 0;
        onStateChange('Parsing');
        for (let i = 0; i < lines.length; i++) {
            if (!this.files[fileIndex]) {
                this.files[fileIndex] = new FileTemplate([], this.variables);
            }
            const line = lines[i].replaceAll('\r', '');

            const trimmedLine = line.trim().replaceAll('\t', '');
            if (trimmedLine.startsWith('#')) {
                if (trimmedLine.startsWith('#split') || trimmedLine.startsWith('#beginfile') || trimmedLine.startsWith('#endfile')) {
                    this.files[fileIndex].updateVariables(this.variables);
                    fileIndex++;
                } else {
                    let [name, expression] = line.split(':');
                    name = name.trim();
                    expression = expression.trim();
                    const varName = name.replace('#', '');
                    this.variables[varName] = await this.parseExpression(expression);
                    this.files[fileIndex].updateVariables(this.variables);
                }
            } else {
                this.files[fileIndex].addLine(this.parseLine(line));
            }
        }
        onStateChange('Parsing complete');
        return this.files;
    }

    save(onStateChange: (state: string) => void) {
        for (const f of this.files) {
            onStateChange(`Saving file ${f.filename}`);
            f.save(this.targetPath);
        }
        onStateChange(`Saving complete`);
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
