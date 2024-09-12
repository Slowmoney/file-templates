import fs from 'fs';
import path from 'path';
export class FileTemplate {
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
        return `${this.getVariable('filename')}.${this.getVariable('ext')}`;
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

    save(targetPath: string) {
        const result = this.text;
        const folder = path.join(targetPath, this.folder);
        fs.mkdirSync(folder, { recursive: true });
        if (result && this.content.some(Boolean)) {
            const resultPath = path.join(targetPath, this.folder, `./${this.filename}`);
            fs.writeFileSync(resultPath, result, 'utf8',);
        }
    }
}
