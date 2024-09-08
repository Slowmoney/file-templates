import * as assert from 'assert';
import { readFileSync } from 'fs';
import { TemplateExecutor } from '../template-executor.js';

suite('Extension Test Suite', () => {
	test('Pipe Concat Pascal', async () => {
		const executor = new TemplateExecutor({ input: '/home/work' }, `#folder:%input|>pascal-case|>/styles|>pascal-case`);
		const files = await executor.exec();
		debugger;
		assert.equal(files.length, 1);
		assert.equal(files[0].variables['folder'], "HomeWorkStyles");
		assert.notEqual(files[0].variables['folder'], "homeWorkStyles");
		assert.notEqual(files[0].variables['folder'], "/home/work/styles");
	});
	test('Pipe Concat Camel', async () => {
		const executor = new TemplateExecutor({ input: '/home/work' }, `#folder:%input|>pascal-case|>/styles|>camel-case`);
		const files = await executor.exec();
		debugger;
		assert.equal(files.length, 1);
		assert.equal(files[0].variables['folder'], "homeWorkStyles");
		assert.notEqual(files[0].variables['folder'], "HomeWorkStyles");
		assert.notEqual(files[0].variables['folder'], "/home/work/styles");
	});
	test('Pipe Concat Path Case', async () => {
		const executor = new TemplateExecutor({ input: '/home/work' }, `#folder:%input|>/styles|>path-case`);
		const files = await executor.exec();
		assert.equal(files.length, 1);
		assert.equal(files[0].variables['folder'], "home/work/styles");
		assert.notEqual(files[0].variables['folder'], "HomeWorkStyles");
		assert.notEqual(files[0].variables['folder'], "homeWorkStyles");
	});
	test('#split', async () => {
		const executor = new TemplateExecutor({ input: '/home/work' }, `#folder:%input|>/styles|>path-case\n#filename:index\n#ext:ts\n#split\n#filename:test`);
		const files = await executor.exec();

		assert.equal(files.length, 2);
		assert.equal(files[0].folder, "home/work/styles");
		assert.equal(files[1].folder, "home/work/styles");
		assert.equal(files[1].variables['ext'], "ts");
		assert.equal(files[0].variables['ext'], "ts");
		assert.equal(files[1].filename, "test.ts");
		assert.equal(files[0].filename, "index.ts");
		assert.equal(files[0].variables['folder'], "home/work/styles");
		assert.notEqual(files[0].variables['folder'], "HomeWorkStyles");
		assert.notEqual(files[0].variables['folder'], "homeWorkStyles");
	});

	test('#split with spaces', async () => {
		const executor = new TemplateExecutor({ input: '/home/work' }, `#folder : %input |> /styles |> path-case\n #filename: index\n#ext:ts\n#split\n#ext: js \n #filename:test`);
		const files = await executor.exec();

		assert.equal(files.length, 2);
		assert.equal(files[0].folder, "home/work/styles");
		assert.equal(files[1].folder, "home/work/styles");
		assert.equal(files[1].variables['ext'], "js");
		assert.equal(files[0].variables['ext'], "ts");
		assert.equal(files[1].filename, "test.js");
		assert.equal(files[0].filename, "index.ts");
		assert.equal(files[0].variables['folder'], "home/work/styles");
		assert.notEqual(files[0].variables['folder'], "HomeWorkStyles");
		assert.notEqual(files[0].variables['folder'], "homeWorkStyles");
	});

	test('Pipe concat', async () => {
		const executor = new TemplateExecutor({ input: '/home/work' }, `#folder : %input |> /styles |> |> /1 |> /2|> /2/5`);
		const files = await executor.exec();

		assert.equal(files.length, 1);
		assert.equal(files[0].folder, "/home/work/styles/1/2/2/5");
	});

	test('No Input', async () => {
		const executor = new TemplateExecutor({ input: '' }, `#folder : %input |> /styles |> |> /1 |> /2|> /2/5`);
		const files = await executor.exec();

		assert.equal(files.length, 1);
		assert.equal(files[0].folder, "%input/styles/1/2/2/5");
		assert.equal(files[0].filename, "%filename.%ext");
		assert.equal(files[0].text, "");
	});

	test('Nest ddd template', async () => {
		const template = readFileSync('../../src/templates/ts/nest-ddd.template', 'utf-8');
		const executor = new TemplateExecutor({ input: 'BigData' }, template);
		const files = await executor.exec();

		assert.equal(files.length, 6);
		for (const file of files) {
			assert.equal(file.getVariable('moduleFolder'), 'big-data');
		}
		assert.equal(files[0].folder, "big-data/application");
		assert.equal(files[0].getVariable('ext'), "module.ts");
		assert.equal(files[0].filename, "application.module.ts");
		assert.equal(files[0].text, 'import { Module } from "@nestjs/common";\n' +
			'import { InfrastructureModule } from "../infrastructure/infrastructure.module";\n' +
			'\n' +
			'@Module({\n' +
			'    imports: [InfrastructureModule]\n' +
			'})\n' +
			'export class ApplicationModule {}\n');

		assert.equal(files[1].folder, "big-data/domain");
		assert.equal(files[1].getVariable('ext'), "module.ts");
		assert.equal(files[1].filename, "domain.module.ts");
		assert.equal(files[1].text, 'import { Module } from "@nestjs/common";\n' +
			'\n' +
			'@Module({})\n' +
			'export class DomainModule {}\n');

		assert.equal(files[2].folder, "big-data/infrastructure");
		assert.equal(files[2].getVariable('ext'), "module.ts");
		assert.equal(files[2].filename, "infrastructure.module.ts");
		assert.equal(files[2].text, 'import { Module } from "@nestjs/common";\n' +
			'\n' +
			'@Module({})\n' +
			'export class InfrastructureModule {}\n');

		assert.equal(files[3].folder, "big-data/domain/models");
		assert.equal(files[3].filename, "%filename.%ext");
		assert.equal(files[3].text, "");

		assert.equal(files[4].folder, "big-data/infrastructure/adapters");
		assert.equal(files[4].filename, "%filename.%ext");
		assert.equal(files[4].text, "");

		assert.equal(files[5].folder, "big-data");
		assert.equal(files[5].filename, "big-data.module.ts");
		assert.equal(files[5].getVariable('ext'), "module.ts");
		assert.equal(files[5].text, 'import { Module } from "@nestjs/common";\n' +
			'import { ApplicationModule } from "./application/application.module";\n' +
			'\n' +
			'@Module({\n' +
			'    imports: [ApplicationModule]\n' +
			'})\n' +
			'export class BigDataModule {}\n');
	});

	test('React template', async () => {
		const template = readFileSync('../../src/templates/ts/react-component.template', 'utf-8');
		const executor = new TemplateExecutor({ input: 'myButton' }, template);
		const files = await executor.exec();

		assert.equal(files.length, 5);
		for (const file of files) {
			assert.equal(file.getVariable('moduleFolder'), '%moduleFolder');
		}
		assert.equal(files[0].getVariable('filename'), 'MyButton');
		assert.equal(files[0].getVariable('functionName'), 'MyButton');
		assert.equal(files[0].getVariable('folder'), 'MyButton');
		assert.equal(files[0].getVariable('ext'), 'tsx');
		assert.equal(files[0].getVariable('className'), 'my-button');

		assert.equal(files[1].getVariable('filename'), 'index');
		assert.equal(files[1].getVariable('functionName'), 'MyButton');
		assert.equal(files[1].getVariable('folder'), 'MyButton');
		assert.equal(files[1].getVariable('ext'), 'ts');
		assert.equal(files[1].getVariable('className'), 'my-button');
		assert.equal(files[1].text, `export { default } from "./MyButton";\n`);

		assert.equal(files[2].getVariable('filename'), 'full-hd', '2');
		assert.equal(files[2].getVariable('functionName'), 'MyButton', '2');
		assert.equal(files[2].getVariable('folder'), 'MyButton/styles', '2');
		assert.equal(files[2].getVariable('ext'), 'scss', '2');
		assert.equal(files[2].getVariable('className'), 'my-button', '2');
		assert.equal(files[2].text, '.my-button {\n\n}\n', '2');

		assert.equal(files[3].getVariable('filename'), 'mobile', '3');
		assert.equal(files[3].getVariable('functionName'), 'MyButton', '3');
		assert.equal(files[3].getVariable('folder'), 'MyButton/styles', '3');
		assert.equal(files[3].getVariable('ext'), 'scss');
		assert.equal(files[3].getVariable('className'), 'my-button', '3');
		assert.equal(files[3].text, '.my-button {\n\n}\n', '3');

		assert.equal(files[4].getVariable('filename'), 'MyButton');
		assert.equal(files[4].getVariable('functionName'), 'MyButton');
		assert.equal(files[4].getVariable('folder'), 'MyButton');
		assert.equal(files[4].getVariable('ext'), 'module.scss');
		assert.equal(files[4].getVariable('className'), 'my-button');
	});

});
