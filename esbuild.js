const esbuild = require("esbuild");
const { copy } = require("esbuild-copy-files");
const path = require('path');
const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');
const sourceDir = path.resolve(__dirname, './src');
const destDir = path.resolve(__dirname, './dist');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

async function main() {
	const ctx = await esbuild.context({
		entryPoints: [
			'src/extension.ts'
		],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'dist/extension.js',
		external: ['vscode'],
		logLevel: 'silent',
		loader: { '.template': 'file' },
		plugins: [
			/* add to the end of plugins array */
			esbuildProblemMatcherPlugin,
			copy({
				// When setting to true, make sure using esbuild's watch mode (ctx.watch())
				watch: !production,
				patterns: [
					{
						from: [`${sourceDir}/templates`],
						to: [`${destDir}/templates`],
						watch: true
					},
				]
			})
		],
	});
	if (watch) {
		await ctx.watch();
	} else {
		await ctx.rebuild();
		await ctx.dispose();
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
