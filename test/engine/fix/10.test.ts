// #10: `transform` is not applied
// The README and the types have the `transform` property, but the engines did not read it, so the value did not change.
// The two engines apply `transform` to the value after the validation.
import {describe, expect, test} from 'bun:test';
import {argMate, argMateMini} from '../../helper.ts';

const upper = v => v.toUpperCase();

const config = () => ({name: {type: 'string', alias: 'n', transform: upper}});

// `error` is the callback for input errors and `panic` is the callback for config errors
const settings = () => ({
	error: ({message: msg}) => {
		throw new Error(`input error: ${msg}`);
	},
	panic: msg => {
		throw new Error(`config error: ${msg}`);
	},
});

describe('#10 The full engine applies transform', () => {
	test('the result of transform is the value of the parameter', () => {
		expect(argMate(['--name', 'bob'], config())).toEqual({_: [], name: 'BOB'});
	});

	test('the example in the README trims the value', () => {
		const config = {name: {type: 'string', transform: v => v.trim()}};
		expect(argMate(['--name', ' bob '], config)).toEqual({_: [], name: 'bob'});
	});

	test('a value that is given with the alias is transformed', () => {
		expect(argMate(['-n', 'bob'], config())).toEqual({_: [], name: 'BOB'});
	});

	test('a value that is assigned with = is transformed', () => {
		expect(argMate(['--name=bob'], config())).toEqual({_: [], name: 'BOB'});
	});

	test('with outputAlias the alias has the transformed value also', () => {
		expect(argMate(['--name', 'bob'], config(), {outputAlias: true})).toEqual({
			_: [],
			name: 'BOB',
			n: 'BOB',
		});
	});

	test('transform can give a value of a different type', () => {
		const config = {name: {type: 'string', transform: v => v.length}};
		expect(argMate(['--name', 'bob'], config)).toEqual({_: [], name: 3});
	});

	test('transform changes only its own parameter', () => {
		const args = ['--name', 'bob', '--other', 'bob', 'bob'];
		expect(argMate(args, {...config(), other: {type: 'string'}})).toEqual({
			_: ['bob'],
			name: 'BOB',
			other: 'bob',
		});
	});

	test('transform gets the value one time', () => {
		const calls = [];
		const config = {name: {type: 'string', alias: 'n', transform: v => calls.push(v)}};
		argMate(['-n', 'bob'], config);
		expect(calls).toEqual(['bob']);
	});
});

// #50 turned the order around: transform runs first, and the validation checks the transformed value
describe('#10 #50 transform runs before the validation', () => {
	test('a `valid` function gets the transformed value', () => {
		const config = {name: {type: 'string', validate: v => v === 'BOB', transform: upper}};
		expect(argMate(['--name', 'bob'], config, settings())).toEqual({_: [], name: 'BOB'});
	});

	test('a `valid` list is compared with the transformed value', () => {
		const config = {name: {type: 'string', valid: ['BOB', 'EVE'], transform: upper}};
		expect(argMate(['--name', 'eve'], config, settings())).toEqual({_: [], name: 'EVE'});
	});

	test('a value that is not valid is an input error', () => {
		const config = {name: {type: 'string', validate: v => v === 'BOB', transform: upper}};
		expect(() => argMate(['--name', 'eve'], config, settings())).toThrow(/^input error: /);
	});

	test('transform gets a value that is not valid', () => {
		const calls = [];
		const config = {
			name: {type: 'string', validate: v => v === 'bob', transform: v => calls.push(v)},
		};
		expect(() => argMate(['--name', 'eve'], config, settings())).toThrow();
		expect(calls).toEqual(['eve']);
	});
});

describe('#10 transform gets the value in the type of the parameter', () => {
	test('number', () => {
		const config = {n: {type: 'number', transform: v => v * 2}};
		expect(argMate(['--n', '1.5'], config)).toEqual({_: [], n: 3});
	});

	// The text '5' would give '51'
	test('int', () => {
		const config = {n: {type: 'int', transform: v => v + 1}};
		expect(argMate(['--n', '5'], config)).toEqual({_: [], n: 6});
	});

	test('hex', () => {
		const config = {n: {type: 'hex', transform: v => v + 1}};
		expect(argMate(['--n', 'ff'], config)).toEqual({_: [], n: 256});
	});

	test('boolean', () => {
		const config = {color: {type: 'boolean', transform: v => (v ? 'on' : 'off')}};
		expect(argMate(['--no-color'], config)).toEqual({_: [], color: 'off'});
	});

	// transform runs after the parse, not for each use of the flag
	test('count: transform gets the total', () => {
		const config = {verbose: {type: 'count', alias: 'v', transform: v => v * 10}};
		expect(argMate(['-vvv'], config)).toEqual({_: [], verbose: 30});
	});
});

// src/types.ts gives the `transform` of an array type the array as its argument: `transform?: (value: string[]) => any`
describe('#10 transform with an array type', () => {
	test('string[]: the result of transform replaces the array', () => {
		const config = {tag: {type: 'string[]', transform: v => v.join('+')}};
		expect(argMate(['--tag', 'a', '--tag', 'b'], config)).toEqual({_: [], tag: 'a+b'});
	});

	test('number[]: transform gets an array of numbers', () => {
		const config = {n: {type: 'number[]', transform: v => v.reduce((a, b) => a + b, 0)}};
		expect(argMate(['--n', '1', '--n', '2'], config)).toEqual({_: [], n: 3});
	});

	test('transform gets the complete array one time', () => {
		const calls = [];
		const config = {tag: {type: 'string[]', transform: v => calls.push(v)}};
		argMate(['--tag', 'a', '--tag', 'b'], config);
		expect(calls).toEqual([['a', 'b']]);
	});
});

describe('#10 transform and a default', () => {
	test('a value that is given is transformed', () => {
		const config = {name: {default: 'eve', transform: upper}};
		expect(argMate(['--name', 'bob'], config)).toEqual({_: [], name: 'BOB'});
	});

	// todo-v9.md does not say if `transform` applies to a default.
	// It does: `transform` applies to each value that is in the result.
	test('the default is transformed when the parameter is not given', () => {
		const config = {name: {default: 'eve', transform: upper}};
		expect(argMate([], config)).toEqual({_: [], name: 'EVE'});
	});

	// A parameter with no value and no default is not in the result, so `transform` does not get it.
	test('a parameter with no value and no default stays absent', () => {
		const config = {name: {type: 'string', transform: v => v.trim()}};
		expect(argMate([], config)).toEqual({_: []});
	});
});

describe('#10 The mini engine applies transform also', () => {
	test('the result has the value that transform returns', () => {
		expect(argMateMini(['--name', 'bob'], config())).toEqual({_: [], name: 'BOB'});
	});
});
