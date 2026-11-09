// #28: `valid` runs when the parameter is not in the result
// ArgMate called `valid` for each parameter that has it, also when the parameter had no value.
// A `valid` function got `undefined` then, so the parameter was mandatory.
import {describe, expect, test} from 'bun:test';
import {argMate, argMateMini} from '../../helper.ts';

const largerThan4 = (v: number) => v > 4;

// Makes an input error an `Error` that a test can catch
const settings = {
	error: ({message: msg}: {message: string}) => {
		throw new Error(msg);
	},
};

const engines = [
	{name: 'argMate', parse: argMate},
	{name: 'argMateMini', parse: argMateMini},
];

for (const {name, parse} of engines) {
	describe(`#28 valid is only for a value that is in the result: ${name}`, () => {
		test('a parameter with a valid function is not mandatory', () => {
			expect(parse([], {n: {type: 'number', validate: largerThan4}})).toEqual({_: []});
		});

		test('the valid function is not called when the parameter has no value', () => {
			let calls = 0;
			const validate = () => {
				calls++;
				return true;
			};
			parse(['--other'], {n: {type: 'number', validate}});
			expect(calls).toBe(0);
		});

		// A default value is in the result, so it is checked
		test('a default value that is not valid gives an input error', () => {
			const config = {n: {default: 1, validate: largerThan4}};
			expect(() => parse([], config, settings)).toThrow("'n'");
		});

		test('a default value that is valid is in the result', () => {
			expect(parse([], {n: {default: 9, validate: largerThan4}})).toEqual({_: [], n: 9});
		});

		// An array type that is not given is `[]` in the result, so it is checked
		test('the [] of an array parameter that is not given is checked', () => {
			const config = {n: {type: 'string[]', validate: (v: string[]) => v.length > 0}};
			expect(() => parse([], config, settings)).toThrow("'n'");
		});

		test('a value from the input that is valid is in the result', () => {
			expect(parse(['--n', '7'], {n: {type: 'number', validate: largerThan4}})).toEqual({
				_: [],
				n: 7,
			});
		});

		test('a value from the input that is not valid gives an input error', () => {
			const config = {n: {type: 'number', validate: largerThan4}};
			expect(() => parse(['--n', '1'], config, settings)).toThrow("'n'");
		});

		test('a value from the input that is not in the valid list gives an input error', () => {
			const config = {n: {valid: ['a', 'b']}};
			expect(() => parse(['--n', 'z'], config, settings)).toThrow("'n'");
		});

		// A valid list is an enum: its first value is the default value
		test('a valid list gives its first value when the parameter is not given', () => {
			expect(parse([], {n: {valid: ['a', 'b']}})).toEqual({_: [], n: 'a'});
		});
	});
}
