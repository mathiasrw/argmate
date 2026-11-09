// `file`, `folder` and `path`: text that names a thing on the disk. The tests run in the root of the project,
// where `package.json` is a file and `src` is a folder.
// @ts-expect-error
import {describe, expect, test} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import {argEngine, argMate, argMateMini, precompileConfig} from '../helper.ts';

run(argMate);
run(argMateMini, ' Mini');

// The error object, or the result when there is no error
function parse(argMate: ArgMateEngine, args: string[], config: any) {
	let error: any;
	const result = argMate(args, config, {
		error: e => {
			error ??= {...e};
		},
	});
	return error || result;
}

function run(argMate: ArgMateEngine, engineType = '') {
	const engineMini = !!engineType;

	describe('file, folder and path' + engineType, () => {
		test('a file that is there is the text of the input', () => {
			expect(argMate(['-f', 'package.json'], {file: {alias: 'f', type: 'file'}})).toEqual({
				_: [],
				file: 'package.json',
			});
		});

		(engineMini ? test.todo : test)('a file that is not there', () => {
			expect(parse(argMate, ['-f', 'nope.sql'], {file: {alias: 'f', type: 'file'}})).toEqual({
				code: 'INVALID',
				key: 'file',
				alias: '-f',
				value: 'nope.sql',
				message: 'File not found: nope.sql',
			});
		});

		(engineMini ? test.todo : test)('a folder is not a file', () => {
			expect(parse(argMate, ['--file', 'src'], {file: {type: 'file'}}).message).toBe(
				'Not a file: src'
			);
		});

		(engineMini ? test.todo : test)('a file is not a folder', () => {
			expect(parse(argMate, ['--out', 'package.json'], {out: {type: 'folder'}}).message).toBe(
				'Not a folder: package.json'
			);
		});

		(engineMini ? test.todo : test)('an empty value is a missing value', () => {
			expect(parse(argMate, ['-f', ''], {file: {alias: 'f', type: 'file'}})).toEqual({
				code: 'MISSING_VALUE',
				key: 'file',
				alias: '-f',
				message: "No file provided for 'file'",
			});
		});

		(engineMini ? test.todo : test)('a path that is not there', () => {
			expect(parse(argMate, ['--p', 'nope'], {p: {type: 'path'}}).message).toBe(
				'Path not found: nope'
			);
		});

		(engineMini ? test.todo : test)(
			'in an array, the error has the value that is not there',
			() => {
				const error = parse(argMate, ['--p', 'src', '--p', 'nope'], {p: {type: 'path[]'}});
				expect(error.value).toBe('nope');
			}
		);

		(engineMini ? test.todo : test)(
			'the check is before `validate`, so `validate` gets a file that is there',
			() => {
				const seen: string[] = [];
				const config = {f: {type: 'file', validate: (v: string) => seen.push(v) > 0}};
				expect(parse(argMate, ['--f', 'nope.sql'], config).code).toBe('INVALID');
				expect(seen).toEqual([]);
			}
		);
	});
}

describe('file, folder and path with no file system', () => {
	test('is a config error', () => {
		const process = (globalThis as any).process;
		const getBuiltinModule = process.getBuiltinModule;
		process.getBuiltinModule = undefined;
		try {
			expect(() => argMate(['--f', 'package.json'], {f: {type: 'file'}})).toThrow(
				"The types 'file', 'folder' and 'path' need process.getBuiltinModule (Node 22.3 and newer, Bun, Deno)"
			);
		} finally {
			process.getBuiltinModule = getBuiltinModule;
		}
	});

	test('is not needed when there is no value to check', () => {
		const process = (globalThis as any).process;
		const getBuiltinModule = process.getBuiltinModule;
		process.getBuiltinModule = undefined;
		try {
			expect(argMate([], {f: {type: 'file'}})).toEqual({_: []});
			expect(argMate([], {f: {type: 'file', default: '-'}})).toEqual({_: [], f: '-'});
		} finally {
			process.getBuiltinModule = getBuiltinModule;
		}
	});
});

describe('file, folder and path in a precompiled config', () => {
	test('the engine checks the file', () => {
		const config = new Function('return ' + precompileConfig({f: {type: 'file'}}))();
		expect(() => argEngine(['--f', 'nope.sql'], config)).toThrow('File not found: nope.sql');
	});
});
