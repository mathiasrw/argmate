// #5: Automatic conversion of the values in `_`
// All values in `_` were strings, and no setting changed this.
// The setting `autoConvert` (proposed name, default `true` in the full engine) converts numbers and bool words.
// The mini engine has no tests here: todo-v9.md says to decide after the full engine has the feature.
import {describe, expect, test} from 'bun:test';
import {argMate, configPreprocessing} from '../../helper.ts';

describe('#5 Automatic conversion of the values in _', () => {
	describe('text in a number form becomes a number', () => {
		const numberForms = [
			['40', 40],
			['1.5', 1.5],
			['1.0', 1],
			['0x10', 16],
			['0xff', 255],
		];

		for (const [value, number] of numberForms) {
			test.todo(`${value} becomes the number ${number}`, () => {
				expect(argMate([value])).toEqual({_: [number]});
			});
		}

		// These two rows of the table need issue 2 also. test/engine/fix/2.test.ts has the tests for tokens with a dash.
		for (const [value, number] of [
			['-5', -5],
			['-0.7', -0.7],
		]) {
			test.todo(`${value} becomes the number ${number}`, () => {
				expect(argMate([value])).toEqual({_: [number]});
			});
		}

		test.todo('0 and 1 become numbers and not booleans', () => {
			expect(argMate(['0', '1'])).toEqual({_: [0, 1]});
		});

		test.todo('the maximum safe integer becomes a number', () => {
			expect(argMate(['9007199254740991'])).toEqual({_: [Number.MAX_SAFE_INTEGER]});
		});
	});

	describe('a bool word becomes a boolean', () => {
		for (const word of ['true', 'yes', 'on']) {
			test.todo(`${word} becomes true`, () => {
				expect(argMate([word])).toEqual({_: [true]});
			});
		}

		for (const word of ['false', 'no', 'off']) {
			test.todo(`${word} becomes false`, () => {
				expect(argMate([word])).toEqual({_: [false]});
			});
		}
	});

	describe('all other values stay strings', () => {
		const notNumberForms = [
			['.5', 'no digit before the point'],
			['1.', 'no digit after the point'],
			['10,10', 'comma'],
			['1_000', 'underscore'],
			['12345678901234567890', 'larger than the maximum safe integer'],
			['9007199254740992', 'the maximum safe integer + 1'],
		];

		for (const [value, cause] of notNumberForms) {
			test(`${value} stays a string (${cause})`, () => {
				expect(argMate([value])).toEqual({_: [value]});
			});
		}

		for (const value of ['foo', 'my.file', '1.2.3', '5px', 'Infinity', 'NaN', '']) {
			test(`'${value}' stays a string`, () => {
				expect(argMate([value])).toEqual({_: [value]});
			});
		}
	});

	describe('the setting autoConvert', () => {
		test.todo('the default is true', () => {
			expect(argMate(['40', 'on'])).toEqual({_: [40, true]});
		});

		test.todo('the default is the same when there is a config', () => {
			expect(argMate(['40', 'on'], {})).toEqual({_: [40, true]});
		});

		test.todo('with autoConvert: true, the engine converts each value in _', () => {
			expect(argMate(['build', '40', 'on', 'my.file'], {}, {autoConvert: true})).toEqual({
				_: ['build', 40, true, 'my.file'],
			});
		});

		test('with autoConvert: false, all values in _ are strings', () => {
			const values = ['40', '1.5', '0x10', 'true', 'yes', 'on', 'false', 'no', 'off', 'foo'];
			expect(argMate([...values], {}, {autoConvert: false})).toEqual({_: values});
		});

		test('the values after -- are not converted', () => {
			expect(argMate(['--', '40', 'on', '-5'])).toEqual({_: ['40', 'on', '-5']});
		});

		test('the value of a string parameter is not converted', () => {
			const config = {name: {type: 'string'}, mode: {type: 'string'}};
			expect(argMate(['--name', '40', '--mode', 'on'], config)).toEqual({
				_: [],
				name: '40',
				mode: 'on',
			});
		});
	});

	describe('more forms', () => {
		test("007 stays the string '007', because of the zeros at the start", () => {
			expect(argMate(['007'])).toEqual({_: ['007']});
		});

		test.todo('1e3 becomes the number 1000', () => {
			expect(argMate(['1e3'])).toEqual({_: [1000]});
		});

		test.todo('TRUE, Yes and OFF are converted: the case of the letters is not important', () => {
			expect(argMate(['TRUE', 'Yes', 'OFF'])).toEqual({_: [true, true, false]});
		});

		// The value of `--key=value` with an unknown key gets the same conversion as a value in `_`
		test.todo('--a=1.0 with an unknown key gives the number 1', () => {
			expect(argMate(['--a=1.0'])).toEqual({_: [], a: 1});
		});

		test.todo('--a=0x10 with an unknown key gives the number 16', () => {
			expect(argMate(['--a=0x10'])).toEqual({_: [], a: 16});
		});

		test('an integer and a decimal after an unknown key are numbers, as they are now', () => {
			expect(argMate(['--a=5', '--b=1.5', '--c=-5'])).toEqual({_: [], a: 5, b: 1.5, c: -5});
		});

		test('--a=on with an unknown key gives true, as it does now', () => {
			expect(argMate(['--a=on'])).toEqual({_: [], a: true});
		});

		test('with strict: true, the values in _ are strings', () => {
			expect(argMate(['40', 'on', '1.5'], {}, {strict: true})).toEqual({_: ['40', 'on', '1.5']});
		});

		test.todo('strict: true sets autoConvert to false', () => {
			expect(configPreprocessing({}, {strict: true}).engineSettings.autoConvert).toBe(false);
		});

		test.todo('with autoConvert: false, the value after an unknown key stays a string', () => {
			expect(argMate(['--a=5'], {}, {autoConvert: false})).toEqual({_: [], a: '5'});
		});
	});

	describe('effect on programs that get file names in _', () => {
		test.todo('by default the file name 2024 becomes a number and the file name on becomes true', () => {
			expect(argMate(['2024', 'on'])).toEqual({_: [2024, true]});
		});

		test('with autoConvert: false, the file names 2024 and on stay strings', () => {
			expect(argMate(['2024', 'on'], {}, {autoConvert: false})).toEqual({_: ['2024', 'on']});
		});
	});
});
