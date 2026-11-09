// #2: Negative numbers are parsed as flags
// The engine read each token that starts with `-` as a parameter: `-5` became the flag `5`, and `-1.5` gave an error.
// A token with one dash and a digit must go to a check with four rules. A negative number is a value in `_`.
// A short name that is only digits is a parameter only when the config has it: then `-5` is that parameter, else `-5` is a number.
// A long name of only digits (`--5`) must also be in the config.
import {describe, expect, test} from 'bun:test';
import {argMate, argMateMini} from '../../helper.ts';

const numberForms = [
	['-5', -5],
	['-1.5', -1.5],
	['-0.7', -0.7],
	['-1.0', -1],
];

const notNumberForms = [
	['-0x10', 'hexadecimal'],
	['-0xff', 'hexadecimal'],
	['-.5', 'no digit before the point'],
	['-1.', 'no digit after the point'],
	['-10,10', 'comma'],
	['-1_000', 'underscore'],
	['-12345678901234567890', 'larger than the maximum safe integer'],
	['-1e30', 'larger than the maximum safe integer'],
	['-1e400', 'larger than the largest number'],
	['-5abc', 'letters after the digits'],
	['-5px', 'letters after the digits'],
];

describe('#2 Negative numbers are parsed as flags', () => {
	describe('rule 1: a token in a number form is a negative number in _', () => {
		// todo.md leaves open if `_` gets -0 or 0, so this test sets `allowAutoNumbers: false`
		test('-0 is a value in _ and not the flag 0', () => {
			expect(argMate(['-0'], {}, {allowAutoNumbers: false})).toEqual({_: ['-0']});
		});

		for (const [token, number] of numberForms) {
			test(`${token} is the number ${number}`, () => {
				expect(argMate([token])).toEqual({_: [number]});
			});
		}

		// Assumption: for a negative number, "larger than the maximum safe integer" is about the size without the sign
		test('-9007199254740991 is a number, because it is a safe integer', () => {
			expect(argMate(['-9007199254740991'])).toEqual({_: [Number.MIN_SAFE_INTEGER]});
		});
	});

	describe('rule 2: letters and then only digits: the digits are the value of the last letter', () => {
		test('-n100 is n = 100', () => {
			expect(argMate(['-n100'])).toEqual({_: [], n: 100});
		});

		test('-ab12 is a and b = 12', () => {
			expect(argMate(['-ab12'])).toEqual({_: [], a: true, b: 12});
		});

		test('-vn5 gives 5 to the declared parameter n', () => {
			expect(argMate(['-vn5'], {v: false, n: {type: 'int'}})).toEqual({_: [], v: true, n: 5});
		});

		test('-n100 gives 100 to the declared parameter n', () => {
			expect(argMate(['-n100'], {n: {type: 'int'}})).toEqual({_: [], n: 100});
		});

		// With `allowKeyNumValues: false` rule 2 does not apply, so rule 4 does.
		test('with allowKeyNumValues: false, -n100 is a string in _', () => {
			expect(argMate(['-n100'], {}, {allowKeyNumValues: false})).toEqual({_: ['-n100']});
		});
	});

	describe('rule 3: a token with = is a parameter with a value', () => {
		test('-f=a2.txt is f = a2.txt', () => {
			expect(argMate(['-f=a2.txt'])).toEqual({_: [], f: 'a2.txt'});
		});

		test('-n=-5 is n = -5', () => {
			expect(argMate(['-n=-5'])).toEqual({_: [], n: -5});
		});
	});

	describe('rule 4: all other tokens go to _ as strings', () => {
		for (const [token, cause] of notNumberForms) {
			test(`${token} is a string (${cause})`, () => {
				expect(argMate([token])).toEqual({_: [token]});
			});
		}

		// Rule 4 applies to one letter and a decimal.
		test('-n1.5 is a string, because rule 2 is for digits only', () => {
			expect(argMate(['-n1.5'])).toEqual({_: ['-n1.5']});
		});
	});

	describe('names with two dashes', () => {
		test('--port8080 does not change: it is the flag port8080', () => {
			expect(argMate(['--port8080'])).toEqual({_: [], port8080: true});
		});
	});

	describe('-0 to -9 are numbers when the config does not have them', () => {
		for (const digit of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
			test(`-${digit} is the number -${digit} and not the flag ${digit}`, () => {
				expect(argMate([`-${digit}`])).toEqual({_: [-digit]});
			});
		}

		test('with allowUnknown: false, -5 is a value and not an unknown parameter', () => {
			expect(argMate(['-5'], {}, {allowUnknown: false})).toEqual({_: [-5]});
		});

		test('a negative number after an unknown flag goes to _', () => {
			expect(argMate(['-v', '-5', 'x'])).toEqual({_: [-5, 'x'], v: true});
		});
	});

	describe('allowAutoNumbers sets the type of the value in _', () => {
		test('the default is true: -5 is the number -5', () => {
			expect(argMate(['-5'])).toEqual({_: [-5]});
		});

		test('the default is the same when there is a config', () => {
			expect(argMate(['-5'], {})).toEqual({_: [-5]});
		});

		test('with allowAutoNumbers: true, -5 is the number -5', () => {
			expect(argMate(['-5'], {}, {allowAutoNumbers: true})).toEqual({_: [-5]});
		});

		for (const [token] of numberForms) {
			test(`with allowAutoNumbers: false, ${token} is the string '${token}'`, () => {
				expect(argMate([token], {}, {allowAutoNumbers: false})).toEqual({_: [token]});
			});
		}

		test('a negative number keeps its position between the other values', () => {
			expect(argMate(['1', '-5', '2'], {}, {allowAutoNumbers: false})).toEqual({
				_: ['1', '-5', '2'],
			});
		});
	});

	describe('names of only digits', () => {
		// Makes an input error an `Error` that a test can catch
		const settings = {
			error: ({message: msg}: {message: string}) => {
				throw new Error(`input error: ${msg}`);
			},
		};

		test('-5=3 gives an input error', () => {
			expect(() => argMate(['-5=3'], {}, settings)).toThrow('input error');
		});

		test('-5=3 is 5 = 3 when the config has 5', () => {
			expect(argMate(['-5=3'], {5: {type: 'int'}})).toEqual({_: [], 5: 3});
		});

		test('-a5=3 gives an input error', () => {
			expect(() => argMate(['-a5=3'], {}, settings)).toThrow('input error');
		});

		test('-50=1 gives an input error', () => {
			expect(() => argMate(['-50=1'], {}, settings)).toThrow('input error');
		});

		for (const token of ['--5', '--0', '--123', '-0=1']) {
			test(`${token} gives an input error`, () => {
				expect(() => argMate([token], {}, settings)).toThrow('input error');
			});
		}

		test('-0 is the parameter 0 in the config', () => {
			expect(argMate(['-0'], {0: {type: 'boolean'}})).toEqual({_: [], 0: true});
		});

		test("-5 is the parameter '5' with a default value", () => {
			expect(argMate(['-5', 'x'], {'5': false})).toEqual({_: ['x'], 5: true});
		});

		test('--123 is the parameter 123 in the config', () => {
			expect(argMate(['--123', 'x'], {123: {type: 'string'}})).toEqual({_: [], 123: 'x'});
		});

		test("-1 is the alias '1' in the config", () => {
			expect(argMate(['-1'], {verbose: {alias: '1'}})).toEqual({_: [], verbose: true});
		});

		test('a name with letters and digits is correct in the config', () => {
			expect(argMate(['--port8080', '--utf8'], {port8080: {}, utf8: {}})).toEqual({
				_: [],
				port8080: true,
				utf8: true,
			});
		});

		test("with allowKeyNumValues: false, -A0 is the string '-A0' and not the flags A and 0", () => {
			expect(argMate(['-A0'], {A: {type: 'boolean'}}, {allowKeyNumValues: false})).toEqual({
				_: ['-A0'],
			});
		});

		test('--5 is a value when it comes after a parameter that takes a value', () => {
			expect(argMate(['--text', '--5'], {text: {type: 'string'}})).toEqual({_: [], text: '--5'});
		});

		test('-5=3 is a value when it comes after a parameter that takes a value', () => {
			expect(argMate(['--text', '-5=3'], {text: {type: 'string'}})).toEqual({_: [], text: '-5=3'});
		});
	});

	describe('more forms', () => {
		test("-007 is the string '-007', because of the zeros at the start", () => {
			expect(argMate(['-007'])).toEqual({_: ['-007']});
		});

		test('-1e3 is the number -1000', () => {
			expect(argMate(['-1e3'])).toEqual({_: [-1000]});
		});

		test('-5abc is a string in _', () => {
			expect(argMate(['-5abc'])).toEqual({_: ['-5abc']});
		});
	});

	describe('a negative number as the value of a parameter does not change', () => {
		test('a declared number parameter gets the number', () => {
			expect(argMate(['--num', '-5'], {num: {type: 'number'}})).toEqual({_: [], num: -5});
		});

		test('a declared number parameter gets a negative decimal', () => {
			expect(argMate(['--num', '-1.5'], {num: {type: 'number'}})).toEqual({_: [], num: -1.5});
		});

		test('a declared string parameter gets the string', () => {
			expect(argMate(['--text', '-5'], {text: {type: 'string'}})).toEqual({_: [], text: '-5'});
		});
	});

	describe('a negative number after --', () => {
		test('it is a string in _, because the values after -- are not converted', () => {
			expect(argMate(['--', '-5', '-1.5'])).toEqual({_: ['-5', '-1.5']});
		});
	});

	// The mini engine does not have this item (it is a curiosity, not the product). These tests stay todo.
	describe('mini engine', () => {
		test.todo('-0 is a value in _ and not the flag 0', () => {
			expect(argMateMini(['-0'], {}, {allowAutoNumbers: false})).toEqual({_: ['-0']});
		});

		for (const [token] of numberForms) {
			test.todo(`${token} is a value in _ and not a flag`, () => {
				expect(argMateMini([token], {}, {allowAutoNumbers: false})).toEqual({_: [token]});
			});
		}

		test('a declared number parameter gets the number', () => {
			expect(argMateMini(['--num', '-5'], {num: {type: 'number'}})).toEqual({_: [], num: -5});
		});

		test('-p8080 is p = 8080', () => {
			expect(argMateMini(['-p8080'])).toEqual({_: [], p: 8080});
		});

		test('-p8080 gives 8080 to the declared parameter p', () => {
			expect(argMateMini(['-p8080'], {p: {type: 'int'}})).toEqual({_: [], p: 8080});
		});

		test('-ab12 is a and b = 12', () => {
			expect(argMateMini(['-ab12'])).toEqual({_: [], a: true, b: 12});
		});

		test('-abc=5 is a, b and c = 5', () => {
			expect(argMateMini(['-abc=5'])).toEqual({_: [], a: true, b: true, c: 5});
		});
	});
});
