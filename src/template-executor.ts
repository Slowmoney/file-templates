import { FileTemplate } from './file-template';
const changeCase = import('change-case');
type ParsedLineType = { type: 'content', content: string } | { type: 'special', special: string } | { type: 'variable', variable: { name: string; value: string } }
/**
 * Replaces placeholders in text with values from a variables object
 * @param {string} text - The text containing placeholders like %variableName
 * @param {Object} variables - Object containing variable names and their values
 * @return {string} - Text with placeholders replaced by actual values
 */
function replaceVariables(text: string, variables: Record<string, string>): string {
    // Create a regex that matches %variableName patterns
    const regex = /%(\w+)/g;

    // Replace each match with the corresponding value from variables object
    const result = text.replace(regex, (match, variableName) => {
        // Check if the variable exists in the variables object
        if (variables.hasOwnProperty(variableName) && variables[variableName]) {
            return variables[variableName];
        }
        // If variable not found, return the original placeholder
        return match;
    });
    return result;
}

function splitLines(value: string) {
    return value.split('\n');
}

function parseLine(line: string): ParsedLineType {
    const trimmedLine = line.trim().replaceAll('\r', '').replaceAll('\t', '');

    if (trimmedLine.startsWith('#')) {
        const isSpecialWord = ['#split', '#beginfile', '#endfile'].includes(trimmedLine);
        if (isSpecialWord) {
            return {
                type: 'special' as const,
                special: trimmedLine
            } as const;
        }
        let [name, expression] = trimmedLine.split(':');
        name = name.trim();
        expression = expression.trim();
        const varName = name.replace('#', '');

        return {
            type: 'variable' as const,
            variable: {
                name: varName,
                value: expression
            }
        } as const;
    }
    return {
        type: 'content' as const,
        content: line.replaceAll('\r', '')
    } as const;

}

function parseLines(lines: string[]) {
    return lines.map(e => parseLine(e));
}

function reduceTemplateToFiles(parsedLines: ParsedLineType[]) {
    const result: ParsedLineType[][] = [];
    let index = 0;
    for (const element of parsedLines) {
        if (!result[index]) { result[index] = []; }
        if (element.type === 'special') {
            index++;
            if (!result[index]) { result[index] = []; }
        }
        result[index].push(element);
    }
    return result;
}
function filterEmptyFiles(parsedLines: ParsedLineType[][]) {

    return parsedLines.filter(e => {
        const validContent = e.filter(e => e.type === 'content' && e.content || e.type === 'variable');
        return validContent.length !== 0;
    });
}
export class TemplateExecutor {
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
    async exec(onStateChange?: (state: string) => void) {



        const parsedLines = filterEmptyFiles(reduceTemplateToFiles(parseLines(splitLines(this.template))));
        for (let fileIndex = 0; fileIndex < parsedLines.length; fileIndex++) {
            const fileLines = parsedLines[fileIndex];
            if (!this.files[fileIndex]) {
                this.files[fileIndex] = new FileTemplate([], this.variables);
            }
            const currentFile = this.files[fileIndex];
            for (const element of fileLines) {
                if (element.type === 'variable') {
                    const val = await this.parseExpression(element.variable.value, currentFile.getVariables());
                    currentFile.setVariable(
                        element.variable.name,
                        val
                    );
                    this.variables[element.variable.name] = val;
                } else if (element.type === 'content') {
                    currentFile.addLine(this.parseLine(element.content, currentFile.getVariables()));
                }
            }

        }
        onStateChange?.('Parsing complete');
        return this.files;
    }

    save(onStateChange?: (state: string) => void) {
        for (const f of this.files) {
            onStateChange?.(`Saving file ${f.filename}`);
            f.save(this.targetPath);
        }
        onStateChange?.(`Saving complete`);
    }

    parseLine(text: string, localVariables: Record<string, string>) {
        //console.log(`🚀 ~ TemplateExecutor ~ parseLine ~ text:`, text)
        for (const key in localVariables) {
            text = text.replaceAll(`%${key}`, localVariables[key] || `%${key}`);
        }
        for (const key in this.variables) {
            text = text.replaceAll(`%${key}`, this.variables[key] || `%${key}`);
        }
        return text;
    }

    async parseExpression(expression: string, localVariables: Record<string, string>) {
        let [name, ...pipes] = expression.split('|>');
        name = name.trim();
        name = replaceVariables(name, localVariables);
        name = replaceVariables(name, this.variables);

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
