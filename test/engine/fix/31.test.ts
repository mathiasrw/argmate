// #31: Reject the short form `-no-`
// The engine read `-no-foo` as the short flags `f`, `o` and `o`, all negated: the result was `{f: false, o: false}`.
// Negation is only for the long form `--no-foo`.
import {describe, expect, test} from 'bun:test';
import {argMate} from '../../helper.ts';

// Makes an input error an `Error` that a test can catch
const settings = {
	error: ({message: msg}: {message: string}) => {
		throw new Error(`input error: ${msg}`);
	},
};

describe('#31 The short form -no- is an input error', () => {
	test('-no-foo gives an input error', () => {
		expect(() => argMate(['-no-foo'], {}, settings)).toThrow('input error');
	});

	test('the message has the token that the user typed', () => {
		expect(() => argMate(['-no-foo'], {}, settings)).toThrow("'-no-foo'");
	});

	test('-no-foo gives an input error when foo is a parameter', () => {
		expect(() => argMate(['-no-foo'], {foo: {type: 'boolean'}}, settings)).toThrow('input error');
	});

	test('--no-foo negates the flag foo', () => {
		expect(argMate(['--no-foo'])).toEqual({_: [], foo: false});
	});
});
