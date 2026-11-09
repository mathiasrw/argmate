// #26: Positions: `spot`, `next` and `last`
// `spot` takes one input by its place, counted from 1, before the parse. `next` and `last` take several inputs,
// counted from the parameter. SPEC.md has the rules. This is for the full engine.
import {describe, expect, test} from 'bun:test';
import {argMate, configPreprocessing} from '../../helper.ts';

const rr = () => ({pattern: {spot: 1}, replacement: {spot: 2}, files: {last: -1}});

describe('#26 spot', () => {
	test('a value that looks like a parameter is not unknown with `strict: true`', () => {
		expect(
			argMate(['-x', 'y'], {pattern: {spot: 1}, replacement: {spot: 2}}, {strict: true})
		).toEqual({
			_: [],
			pattern: '-x',
			replacement: 'y',
		});
	});

	test('the parameter is in the input for `demand`', () => {
		const config = {pattern: {spot: 1}, files: {next: -1, demand: 'pattern'}};
		expect(argMate(['x', '--files', 'a.md'], config)).toEqual({
			_: [],
			pattern: 'x',
			files: ['a.md'],
		});
	});

	test('the array of the caller does not change', () => {
		const args = ['-x', 'y', '--files', 'a.md'];
		argMate(args, rr());
		expect(args).toEqual(['-x', 'y', '--files', 'a.md']);
	});

	test('two spots that overlap are an error with both names', () => {
		let got: unknown;
		argMate(['a', 'b'], {p: {spot: 1}, q: {spot: -2}}, {
			error: (e: unknown) => {
				got = e;
			},
		} as any);
		expect(got).toEqual({
			code: 'MISSING_VALUE',
			key: 'q',
			alias: '-q',
			with: 'p',
			message: "Not enough data provided for both 'p' and 'q': they overlap",
		});
	});

	test('the engine config has the names of the parameters with `spot` in `spots`', () => {
		expect((configPreprocessing(rr() as any) as any).spots).toEqual(['pattern', 'replacement']);
	});
});

describe('#26 next and last', () => {
	test('a short alias in a group takes its values', () => {
		expect(argMate(['-vf', 'a', 'b'], {files: {alias: 'f', next: 2}, v: false})).toEqual({
			_: [],
			files: ['a', 'b'],
			v: true,
		});
	});

	test('each value gets the value of its `valid` alias', () => {
		const config = {e: {next: 2, valid: ['a', ['b', 'x']]}};
		expect(argMate(['--e', 'a', 'x'], config)).toEqual({_: [], e: ['a', 'b']});
	});

	test('the parameter given two times takes its values two times', () => {
		expect(argMate(['--files', 'a', '--files', 'b'], {files: {next: 1}})).toEqual({
			_: [],
			files: ['a', 'b'],
		});
	});

	test('the parameters after the values are read as parameters', () => {
		expect(argMate(['--files', 'a', 'b', '-v'], {files: {next: 2}, v: false})).toEqual({
			_: [],
			files: ['a', 'b'],
			v: true,
		});
	});

	test('a value with `=` is an error with the name as typed', () => {
		let got: unknown;
		argMate(['-f=a', 'b'], {files: {alias: 'f', next: 2}}, {
			error: (e: unknown) => {
				got = e;
			},
		} as any);
		expect(got).toEqual({
			code: 'ASSIGN_NOT_ALLOWED',
			key: 'files',
			alias: '-f',
			value: 'a',
			message: "The parameter 'f' takes the inputs after it and can't be assigned with '=': '-f=a'",
		});
	});

	test('the error for too few values has the name as typed', () => {
		let got: unknown;
		argMate(['-f', 'a'], {files: {alias: 'f', next: 2}}, {
			error: (e: unknown) => {
				got = e;
			},
		} as any);
		expect(got).toEqual({
			code: 'MISSING_VALUE',
			key: 'files',
			alias: '-f',
			message: "Not enough data provided for 'f'",
		});
	});
});
