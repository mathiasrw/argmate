// #5: Automatic conversion of the values in `_`
// All values in `_` were strings, and no setting changed this.
// With `allowAutoNumbers` (default `true`) a value of unspecified type that is an int, a float or scientific
// notation becomes a number: in `_` and after an unknown key with `=`. Hex and bool words stay strings.
// The mini engine has no tests here: it gets no new features.
import {describe, expect, test} from 'bun:test';
import {argMate, configPreprocessing} from '../../helper.ts';

describe('#5 Automatic conversion of the values in _', () => {
	describe('text in a number form becomes a number', () => {
		const numberForms = [
			['40', 40],
			['1.5', 1.5],
			['1.0', 1],
			['1e3', 1000],
			['-5', -5],
			['-0.7', -0.7],
			['0', 0],
			['1', 1],
			['9007199254740991', Number.MAX_SAFE_INTEGER],
		];

		for (const [value, number] of numberForms) {
			test(`${value} becomes the number ${number}`, () => {
				expect(argMate([value])).toEqual({_: [number]});
			});
		}
	});

	describe('all other values stay strings', () => {
		const notNumberForms = [
			['0x10', 'hexadecimal'],
			['0xff', 'hexadecimal'],
			['007', 'zeros at the start'],
			['.5', 'no digit before the point'],
			['1.', 'no digit after the point'],
			['10,10', 'comma'],
			['1_000', 'underscore'],
			['12345678901234567890', 'larger than the maximum safe integer'],
			['9007199254740992', 'the maximum safe integer + 1'],
			['1e400', 'larger than the largest number'],
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

		test('bool words stay strings, in any case', () => {
			const words = ['true', 'yes', 'on', 'false', 'no', 'off', 'TRUE', 'Yes', 'OFF'];
			expect(argMate([...words])).toEqual({_: words});
		});
	});

	describe('the setting allowAutoNumbers', () => {
		test('the default is true', () => {
			expect(argMate(['40', 'on'])).toEqual({_: [40, 'on']});
		});

		test('the default is the same when there is a config', () => {
			expect(argMate(['40', 'on'], {})).toEqual({_: [40, 'on']});
		});

		test('with allowAutoNumbers: true, the engine converts each value in _', () => {
			expect(argMate(['build', '40', 'on', 'my.file'], {}, {allowAutoNumbers: true})).toEqual({
				_: ['build', 40, 'on', 'my.file'],
			});
		});

		test('with allowAutoNumbers: false, all values in _ are strings', () => {
			const values = ['40', '1.5', '-5', '0x10', 'on', 'foo'];
			expect(argMate([...values], {}, {allowAutoNumbers: false})).toEqual({_: values});
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

		test('with strict: true, the values in _ are strings', () => {
			expect(argMate(['40', 'on', '1.5'], {}, {strict: true})).toEqual({_: ['40', 'on', '1.5']});
		});

		test('strict: true sets allowAutoNumbers to false', () => {
			expect(configPreprocessing({}, {strict: true}).engineSettings.allowAutoNumbers).toBe(false);
		});

		test('with strict: true and allowAutoNumbers: true, the values in _ are numbers', () => {
			expect(argMate(['40', '-5'], {}, {strict: true, allowAutoNumbers: true})).toEqual({
				_: [40, -5],
			});
		});
	});

	// The value of `--key=value` with an unknown key gets the same conversion as a value in `_`
	describe('the value after an unknown key', () => {
		test('an integer and a decimal are numbers', () => {
			expect(argMate(['--a=5', '--b=1.5', '--c=-5'])).toEqual({_: [], a: 5, b: 1.5, c: -5});
		});

		test('--a=1.0 gives the number 1', () => {
			expect(argMate(['--a=1.0'])).toEqual({_: [], a: 1});
		});

		test('--a=1e3 gives the number 1000', () => {
			expect(argMate(['--a=1e3'])).toEqual({_: [], a: 1000});
		});

		test("--a=0x10 gives the string '0x10'", () => {
			expect(argMate(['--a=0x10'])).toEqual({_: [], a: '0x10'});
		});

		test("--a=on gives the string 'on'", () => {
			expect(argMate(['--a=on'])).toEqual({_: [], a: 'on'});
		});

		test('with allowAutoNumbers: false, the value stays a string', () => {
			expect(argMate(['--a=5'], {}, {allowAutoNumbers: false})).toEqual({_: [], a: '5'});
		});
	});

	describe('effect on programs that get file names in _', () => {
		test('by default the file name 2024 becomes a number and the file name on stays a string', () => {
			expect(argMate(['2024', 'on'])).toEqual({_: [2024, 'on']});
		});

		test('with allowAutoNumbers: false, the file names 2024 and on stay strings', () => {
			expect(argMate(['2024', 'on'], {}, {allowAutoNumbers: false})).toEqual({_: ['2024', 'on']});
		});
	});
});
