// #35: An array of numbers as default value gives strings
// The type of a parameter with no `type` comes from its default value. For a default value that is an array the
// type was always `string[]`, thus `--n 5` gave `['5']` when the default value was `[1, 2]`.
import {describe, expect, test} from 'bun:test';
import {argMate, argMateMini} from '../../helper.ts';

const engines = [
	{name: 'argMate', parse: argMate},
	{name: 'argMateMini', parse: argMateMini},
];

for (const {name, parse} of engines) {
	describe(`#35 The type of an array default value: ${name}`, () => {
		test.todo('a value from the input is a number when the default value is an array of numbers', () => {
			expect(parse(['--n', '5'], {n: {default: [1, 2]}})).toEqual({_: [], n: [5]});
		});

		test.todo('each value from the input is a number', () => {
			expect(parse(['--n', '5', '--n', '6.5'], {n: {default: [1, 2]}})).toEqual({
				_: [],
				n: [5, 6.5],
			});
		});

		test.todo('a value that is not a number gives an input error', () => {
			const settings = {
				error: (msg: string) => {
					throw new Error(`input error: ${msg}`);
				},
			};
			expect(() => parse(['--n', 'abc'], {n: {default: [1, 2]}}, settings)).toThrow('input error');
		});

		test('the default value is in the result when the parameter is not given', () => {
			expect(parse([], {n: {default: [1, 2]}})).toEqual({_: [], n: [1, 2]});
		});

		test('a value from the input is a string when the default value is an array of strings', () => {
			expect(parse(['--n', '5'], {n: {default: ['x']}})).toEqual({_: [], n: ['5']});
		});

		test('a value from the input is a number when the type is number[]', () => {
			expect(parse(['--n', '5'], {n: {type: 'number[]', default: [1, 2]}})).toEqual({
				_: [],
				n: [5],
			});
		});
	});
}
