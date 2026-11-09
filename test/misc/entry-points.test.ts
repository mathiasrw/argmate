// Each entry point of the package must load through the paths in package.json.
// Each one is loaded by its name in a new Node process and in a new Bun process:
// with `import` when the tests run on the ESM bundles (test-esm), with `require` when they run on the CommonJS bundles (test-cjs).
// The tests on src/ do not build the package, so they skip this file.
import {describe, expect, test} from 'bun:test';
import path from 'node:path';
import pkg from '../../package.json';
import {type EntryPoint, root, run, target} from '../helper.ts';

// The exports of each entry point. `default` is what `import x from` and `require` give.
const exports: Record<EntryPoint, string[]> = {
	'.': ['default', 'argEngine', 'argInfo', 'configPreprocessing', 'precompileConfig'],
	'./engine': ['default'],
	'./mini': ['default', 'argEngine', 'argInfo', 'configPreprocessing', 'precompileConfig'],
	'./mini/engine': ['default'],
	'./info': ['default', 'argInfoFormat'],
	'./precompile': ['configPreprocessing', 'precompileConfig'],
};

// Prints the names of the exports that are functions, `default` first
const print = `(main, named) => console.log(JSON.stringify([
	...(typeof main === 'function' ? ['default'] : []),
	...Object.keys(named).filter(key => key !== 'default' && typeof named[key] === 'function').sort(),
]))`;

const load = {
	import: (name: string) => `import('${name}').then(m => (${print})(m.default, m))`,
	require: (name: string) => `(${print})(require('${name}'), require('${name}'))`,
};

const format = target === 'cjs' ? 'require' : 'import';

describe.skipIf(target === 'src')('The entry points load through the paths in package.json', () => {
	for (const runtime of ['node', 'bun'] as const) {
		for (const [entry, names] of Object.entries(exports) as [EntryPoint, string[]][]) {
			const name = pkg.name + entry.slice(1);

			test(`${runtime}: ${format} '${name}' gives ${pkg.exports[entry][format]} with [${names.join(', ')}]`, () => {
				expect(run(runtime, load[format](name))).toEqual({
					out: JSON.stringify(names),
					err: '',
					exit: 0,
				});
			}, 10000);
		}
	}

	// Only a program that runs from the command line has a shebang. A library does not.
	for (const entry of Object.keys(exports) as EntryPoint[]) {
		const file = pkg.exports[entry][format];

		test(`${file} does not start with a shebang`, async () => {
			expect((await Bun.file(path.join(root, file)).text()).startsWith('#!')).toBe(false);
		});
	}

	// The four entry points that parse
	for (const entry of ['.', './engine', './mini', './mini/engine']) {
		const name = pkg.name + entry.slice(1);
		const parse = {
			import: `import('${name}').then(m => console.log(JSON.stringify(m.default(['--foo', 'bar']))))`,
			require: `console.log(JSON.stringify(require('${name}')(['--foo', 'bar'])))`,
		};

		test(`node: ${format} '${name}' gives a function that parses`, () => {
			expect(run('node', parse[format]).out).toBe('{"_":["bar"],"foo":true}');
		}, 10000);
	}
});
