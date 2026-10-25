// #2: Negative numbers are parsed as flags
// The engine read each token that starts with `-` as a parameter: `-5` became the flag `5`, and `-1.5` gave an error.
// A token with one dash and a digit must go to a check with four rules. A negative number is a value in `_`.
// No parameter has a name that is only digits: `-0` is a number, and `{0: ...}` in the config is a config error.
import {describe, expect, test} from 'bun:test';
import {argMate, argMateMini} from '../../helper.ts';

const numberForms = [
	['-5', -5],
	['-1.5', -1.5],
	['-0.7', -0.7],
	['-1.0', -1],
	['-0x10', -16],
];

const notNumberForms = [
	['-.5', 'no digit before the point'],
	['-1.', 'no digit after the point'],
	['-10,10', 'comma'],
	['-1_000', 'underscore'],
	['-12345678901234567890', 'larger than the maximum safe integer'],
	['-5abc', 'letters after the digits'],
	['-5px', 'letters after the digits'],
];

describe('#2 Negative numbers are parsed as flags', () => {
	describe('rule 1: a token in a number form is a negative number in _', () => {
		// todo.md leaves open if `_` gets -0 or 0, thus this test sets `autoConvert: false`
		test.todo('-0 is a value in _ and not the flag 0', () => {
			expect(argMate(['-0'], {}, {autoConvert: false})).toEqual({_: ['-0']});
		});

		for (const [token, number] of numberForms) {
			test.todo(`${token} is the number ${number}`, () => {
				expect(argMate([token])).toEqual({_: [number]});
			});
		}

		test.todo('-0xff is the number -255', () => {
			expect(argMate(['-0xff'])).toEqual({_: [-255]});
		});

		// Assumption: for a negative number, "larger than the maximum safe integer" is about the size without the sign
		test.todo('-9007199254740991 is a number, because it is a safe integer', () => {
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

		// With `allowKeyNumValues: false` rule 3 does not apply, thus rule 5 does.
		// Today the result is the flags `n`, `1` and `0`. `1` cannot be a parameter after this issue.
		test.todo('with allowKeyNumValues: false, -n100 is a string in _', () => {
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
			test.todo(`${token} is a string (${cause})`, () => {
				expect(argMate([token])).toEqual({_: [token]});
			});
		}

		// Rule 5 applies to one letter and a decimal.
		test.todo('-n1.5 is a string, because rule 2 is for digits only', () => {
			expect(argMate(['-n1.5'])).toEqual({_: ['-n1.5']});
		});
	});

	describe('names with two dashes', () => {
		test('--port8080 does not change: it is the flag port8080', () => {
			expect(argMate(['--port8080'])).toEqual({_: [], port8080: true});
		});
	});

	describe('-0 to -9 are not parameters', () => {
		for (const digit of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
			test.todo(`-${digit} is the number -${digit} and not the flag ${digit}`, () => {
				expect(argMate([`-${digit}`])).toEqual({_: [-digit]});
			});
		}

		test.todo('with allowUnknown: false, -5 is a value and not an unknown parameter', () => {
			expect(argMate(['-5'], {}, {allowUnknown: false})).toEqual({_: [-5]});
		});

		test.todo('a negative number after an unknown flag goes to _', () => {
			expect(argMate(['-v', '-5', 'x'])).toEqual({_: [-5, 'x'], v: true});
		});
	});

	describe('autoConvert sets the type of the value in _', () => {
		test.todo('the default is true: -5 is the number -5', () => {
			expect(argMate(['-5'])).toEqual({_: [-5]});
		});

		test.todo('the default is the same when there is a config', () => {
			expect(argMate(['-5'], {})).toEqual({_: [-5]});
		});

		test.todo('with autoConvert: true, -5 is the number -5', () => {
			expect(argMate(['-5'], {}, {autoConvert: true})).toEqual({_: [-5]});
		});

		for (const [token] of numberForms) {
			test.todo(`with autoConvert: false, ${token} is the string '${token}'`, () => {
				expect(argMate([token], {}, {autoConvert: false})).toEqual({_: [token]});
			});
		}

		test.todo('a negative number keeps its position between the other values', () => {
			expect(argMate(['1', '-5', '2'], {}, {autoConvert: false})).toEqual({_: ['1', '-5', '2']});
		});
	});

	describe('a name that is only digits is not the name of a parameter', () => {
		// Makes an input error an `Error` that a test can catch
		const settings = {
			error: (msg: string) => {
				throw new Error(`input error: ${msg}`);
			},
		};

		test.todo('--5 gives an input error', () => {
			expect(() => argMate(['--5'], {}, settings)).toThrow('input error');
		});

		test.todo('-5=3 gives an input error', () => {
			expect(() => argMate(['-5=3'], {}, settings)).toThrow('input error');
		});

		for (const token of ['--0', '--123', '-0=1']) {
			test.todo(`${token} gives an input error`, () => {
				expect(() => argMate([token], {}, settings)).toThrow('input error');
			});
		}

		// Makes a config error an `Error` that a test can catch
		const configSettings = {
			panic: (msg: string) => {
				throw new Error(`config error: ${msg}`);
			},
		};

		for (const [what, config] of [
			['the parameter 0', {0: {type: 'boolean'}}],
			["the parameter '5' as a default value", {'5': true}],
			['the parameter 123', {123: {type: 'string'}}],
			["the alias '1'", {verbose: {alias: '1'}}],
		] as const) {
			test.todo(`${what} in the config is a config error`, () => {
				expect(() => argMate([], config, configSettings)).toThrow('config error');
			});
		}

		test('a name with letters and digits is correct in the config', () => {
			expect(argMate(['--port8080', '--utf8'], {port8080: {}, utf8: {}})).toEqual({
				_: [],
				port8080: true,
				utf8: true,
			});
		});

		test.todo("with allowKeyNumValues: false, -A0 is the string '-A0' and not the flags A and 0", () => {
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
		test.todo("-007 is the string '-007', because of the zeros at the start", () => {
			expect(argMate(['-007'])).toEqual({_: ['-007']});
		});

		test.todo('-1e3 is the number -1000', () => {
			expect(argMate(['-1e3'])).toEqual({_: [-1000]});
		});

		test.todo('-5abc is a string in _', () => {
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

	// todo-v9.md #5 leaves the default of `autoConvert` open for the mini engine.
	// Thus these tests set `autoConvert: false`: the token is a value and not a flag.
	describe('mini engine', () => {
		test.todo('-0 is a value in _ and not the flag 0', () => {
			expect(argMateMini(['-0'], {}, {autoConvert: false})).toEqual({_: ['-0']});
		});

		for (const [token] of numberForms) {
			test.todo(`${token} is a value in _ and not a flag`, () => {
				expect(argMateMini([token], {}, {autoConvert: false})).toEqual({_: [token]});
			});
		}

		test('a declared number parameter gets the number', () => {
			expect(argMateMini(['--num', '-5'], {num: {type: 'number'}})).toEqual({_: [], num: -5});
		});
	});
});
