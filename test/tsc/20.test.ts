// #20: TypeScript cleanup
// The four entry points used one declaration file. It did not compile without `skipLibCheck`, it was not correct for the
// entry points and it was ESM only. A `count` or array parameter had `| undefined` in its type, but always has a value.
import {describe, expect, test} from 'bun:test';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import pkg from '../../package.json';
import {argMate, argMateMini, entryPoints, root} from '../helper.ts';
import {typeErrors} from './helper.ts';

const names = Object.keys(entryPoints).map(entry => pkg.name + entry.slice(1));

// Assumption: the types of each entry point have the exports that its ESM bundle has today
const moduleExports = {
	argmate: ['default', 'argEngine', 'argInfo', 'configPreprocessing', 'precompileConfig'],
	'argmate/mini': ['default', 'argEngine', 'argInfo', 'configPreprocessing', 'precompileConfig'],
	'argmate/engine': ['default'],
	'argmate/mini/engine': ['default'],
	'argmate/info': ['default', 'argInfoFormat'],
	'argmate/precompile': ['configPreprocessing', 'precompileConfig'],
};

const node16 = {module: 'node16', moduleResolution: 'node16'};
// Assumption: `module: preserve` is the bundler setup, because only that lets a file use `import` and `require`
const bundler = {module: 'preserve', moduleResolution: 'bundler'};

// With node16 the file extension gives the module format: `.mts` is an ES module and `.cts` is a CommonJS module
const esModule = 'code.mts';
const commonJs = 'code.cts';

const use = {
	import: name => `import parse from '${name}';\nparse(['--foo']);\n`,
	require: name => `import parse = require('${name}');\nparse(['--foo']);\n`,
};

// Type-checks one file in a new project that has the package in node_modules, as a user of the package has it.
// Gives the errors that tsc found, one string for each error. The errors in the declaration files of the package are included.
function consumerErrors(file, code, compilerOptions) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'argmate-consumer-'));
	try {
		fs.mkdirSync(path.join(dir, 'node_modules'));
		fs.symlinkSync(root, path.join(dir, 'node_modules', pkg.name), 'junction');
		const tsconfig = {
			compilerOptions: {
				target: 'ES2021',
				strict: true,
				noEmit: true,
				skipLibCheck: true,
				types: [],
				...compilerOptions,
			},
			files: [file],
		};
		fs.writeFileSync(path.join(dir, 'tsconfig.json'), JSON.stringify(tsconfig));
		fs.writeFileSync(path.join(dir, file), code);
		const tsc = path.join(root, 'node_modules/.bin/tsc');
		const result = spawnSync(tsc, ['-p', '.', '--pretty', 'false'], {cwd: dir, encoding: 'utf8'});
		if (result.error) throw result.error;
		const errors = result.stdout.split('\n').filter(line => /error TS\d+:/.test(line));
		if (result.status !== 0 && !errors.length) {
			throw new Error(
				`tsc stopped with exit code ${result.status}: ${result.stdout}${result.stderr}`
			);
		}
		return errors;
	} finally {
		fs.rmSync(dir, {recursive: true, force: true});
	}
}

// The declaration files that package.json names for one entry point, at any depth of the conditions
function declarationFiles(conditions) {
	if (typeof conditions === 'string') return /\.d\.[cm]?ts$/.test(conditions) ? [conditions] : [];
	return [...new Set(Object.values(conditions).flatMap(declarationFiles))];
}

describe('#20 TypeScript cleanup', () => {
	describe('a consumer project compiles with skipLibCheck: false', () => {
		for (const name of names) {
			test.todo(`node16, ES module: import '${name}'`, () => {
				const options = {...node16, skipLibCheck: false};
				expect(consumerErrors(esModule, use.import(name), options)).toEqual([]);
			}, 30000);

			test.todo(`node16, CommonJS module: require('${name}')`, () => {
				const options = {...node16, skipLibCheck: false};
				expect(consumerErrors(commonJs, use.require(name), options)).toEqual([]);
			}, 30000);

			test.todo(`bundler: import '${name}'`, () => {
				const options = {...bundler, skipLibCheck: false};
				expect(consumerErrors('code.ts', use.import(name), options)).toEqual([]);
			}, 30000);
		}
	});

	describe('each entry point has its own correct types', () => {
		test.todo('no two entry points use the same declaration file', () => {
			const files = Object.keys(entryPoints).flatMap(entry => declarationFiles(pkg.exports[entry]));
			expect(files.filter((file, index) => files.indexOf(file) !== index)).toEqual([]);
		});

		for (const name of names) {
			test.todo(`'${name}' has types for [${moduleExports[name].join(', ')}] and for no other export`, () => {
				const code = `import * as module from '${name}';
const names: Record<keyof typeof module, true> = {${moduleExports[name].map(key => `${key}: true`).join(', ')}};
`;
				expect(consumerErrors(esModule, code, node16)).toEqual([]);
			}, 30000);
		}

		// As in src/argMate.ts, where the result without a config is {[key: string]: any; _: string[]}
		test.todo("'argmate': the values in the result of a call without a config have the type any", () => {
			const code = `import argMate from 'argmate';
const port: number = argMate(['--port', '80']).port;
`;
			expect(consumerErrors(esModule, code, node16)).toEqual([]);
		}, 30000);

		// An engine takes the output of configPreprocessing(): at run time a call with a user config throws a TypeError
		for (const name of ['argmate/engine', 'argmate/mini/engine']) {
			test.todo(`'${name}': a call with a user config is a type error`, () => {
				const code = `import argEngine from '${name}';
// @ts-expect-error
argEngine(['--foo', 'bar'], {foo: {type: 'string'}});
`;
				expect(consumerErrors(esModule, code, node16)).toEqual([]);
			}, 30000);
		}
	});

	// `import` in an ES module is accepted today. The tests with skipLibCheck: false make sure of it for node16 and bundler.
	describe('import and require are accepted in a CommonJS project', () => {
		for (const name of names) {
			test.todo(`node16, CommonJS module: require('${name}')`, () => {
				expect(consumerErrors(commonJs, use.require(name), node16)).toEqual([]);
			}, 30000);

			test.todo(`node16, CommonJS module: import '${name}'`, () => {
				expect(consumerErrors(commonJs, use.import(name), node16)).toEqual([]);
			}, 30000);

			test.todo(`bundler: require('${name}')`, () => {
				expect(consumerErrors('code.ts', use.require(name), bundler)).toEqual([]);
			}, 30000);
		}
	});

	describe('a count or array parameter is not undefined', () => {
		const parameters = [
			['count', 'number', 0],
			['string[]', 'string[]', []],
			['array', 'string[]', []],
			['number[]', 'number[]', []],
			['int[]', 'number[]', []],
			['float[]', 'number[]', []],
			['hex[]', 'number[]', []],
		];

		for (const [type, tsType, empty] of parameters) {
			test.todo(`the type of a '${type}' parameter is ${tsType}`, () => {
				const code = `import argMate from 'argmate';
const result = argMate([], {value: {type: '${type}'}});
const value: ${tsType} = result.value;
`;
				expect(typeErrors(code)).toEqual([]);
			}, 30000);

			test(`the value of a '${type}' parameter that is not given is ${JSON.stringify(empty)}`, () => {
				expect(argMate([], {value: {type}})).toEqual({_: [], value: empty});
			});

			test(`mini: the value of a '${type}' parameter that is not given is ${JSON.stringify(empty)}`, () => {
				expect(argMateMini([], {value: {type}})).toEqual({_: [], value: empty});
			});
		}

		// The two assignments together make sure that the two types are the same
		test.todo('only the count and array parameters lose `undefined`: the other parameters without a default stay optional', () => {
			const code = `import argMate from 'argmate';
const result = argMate([], {
	verbose: {type: 'count'},
	tags: {type: 'string[]'},
	ports: {type: 'number[]'},
	name: {type: 'string'},
	port: {type: 'number'},
	force: {type: 'boolean'},
});
type Expected = {
	_: string[];
	verbose: number;
	tags: string[];
	ports: number[];
	name?: string;
	port?: number;
	force?: boolean;
};
const expected: Expected = result;
const actual: typeof result = {} as Expected;
`;
			expect(typeErrors(code)).toEqual([]);
		}, 30000);
	});
});
