// #18d: Type `boolean[]`
// The README shows `boolean[]` and the config accepted it, but the engine did not have the type: `--b` gave the error `No data provided for 'b'`.
// Each use of the flag must add one value to an array. The value is `[]` when the flag is not given.
import {describe, expect, test} from 'bun:test';
import {argMate, argMateMini} from '../../helper.ts';

const config = () => ({b: {type: 'boolean[]'}});

// `error` is the callback for input errors and `panic` is the callback for config errors
const settings = () => ({
	error: msg => {
		throw new Error(`input error: ${msg}`);
	},
	panic: msg => {
		throw new Error(`config error: ${msg}`);
	},
});

const parse = (...args) => argMate(args, config(), settings());

describe('#18d Type boolean[]: each use of the flag adds one value', () => {
	test.todo('the example in todo-v9.md', () => {
		expect(parse('--b', '--no-b', '--b=yes')).toEqual({_: [], b: [true, false, true]});
	});

	test.todo('one flag gives an array with one value', () => {
		expect(parse('--b')).toEqual({_: [], b: [true]});
	});

	test.todo('the flag adds true for each use', () => {
		expect(parse('--b', '--b', '--b')).toEqual({_: [], b: [true, true, true]});
	});

	test.todo('the flag does not take the next argument as its value', () => {
		expect(parse('--b', 'file', '--b')).toEqual({_: ['file'], b: [true, true]});
	});

	test.todo('--no- adds false', () => {
		expect(parse('--no-b')).toEqual({_: [], b: [false]});
	});

	test.todo('the assigned words true, yes and on add true', () => {
		expect(parse('--b=true', '--b=yes', '--b=on')).toEqual({_: [], b: [true, true, true]});
	});

	test.todo('the assigned words false, no and off add false', () => {
		expect(parse('--b=false', '--b=no', '--b=off')).toEqual({_: [], b: [false, false, false]});
	});

	test.todo('a different assigned word is an input error', () => {
		expect(() => parse('--b=maybe')).toThrow(/^input error: /);
	});

	test('the type `boolean` keeps only the last value', () => {
		expect(argMate(['--b', '--no-b'], {b: {type: 'boolean'}})).toEqual({_: [], b: false});
	});
});

describe('#18d Type boolean[]: alias', () => {
	const config = () => ({verbose: {type: 'boolean[]', alias: 'v'}});

	test.todo('the alias and the name add to the same array', () => {
		expect(argMate(['-v', '--no-verbose', '-v'], config())).toEqual({
			_: [],
			verbose: [true, false, true],
		});
	});

	test.todo('the alias in a group of short flags adds one value for each letter', () => {
		expect(argMate(['-vvv'], config())).toEqual({_: [], verbose: [true, true, true]});
	});
});

describe('#18d Type boolean[]: the flag is not given', () => {
	test('the value is an empty array', () => {
		expect(parse()).toEqual({_: [], b: []});
	});

	test('the value is the default', () => {
		const config = {b: {type: 'boolean[]', default: [true, false]}};
		expect(argMate([], config)).toEqual({_: [], b: [true, false]});
	});

	// The same rule as for the other array types (test/engine/string[].test.ts)
	test.todo('a flag that is given replaces the default', () => {
		const config = {b: {type: 'boolean[]', default: [true, true]}};
		expect(argMate(['--no-b'], config)).toEqual({_: [], b: [false]});
	});
});

// todo-v9.md does not name the engines. The example needs `--no-` and `=yes`, and only the full engine has them.
describe('#18d Type boolean[]: the mini engine', () => {
	test('the value is an empty array when the flag is not given', () => {
		expect(argMateMini([], config())).toEqual({_: [], b: []});
	});

	// Assumption: the mini engine gets the type also. The README says that mini is the same as the full engine
	// but for a list of differences, and the types are not in that list.
	test.todo('the flag adds true for each use', () => {
		expect(argMateMini(['--b', 'file', '--b'], config(), settings())).toEqual({
			_: ['file'],
			b: [true, true],
		});
	});
});
