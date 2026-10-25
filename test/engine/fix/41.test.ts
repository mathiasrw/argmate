// #41: A negated unknown parameter with a value loses its negation
// `--no-bogus=true` gave `{bogus: true}`: the engine dropped the `no-` and gave no error.
// For a parameter in the config the same input is an input error.
import {describe, expect, test} from 'bun:test';
import {argMate} from '../../helper.ts';

// Makes an input error an `Error` that a test can catch
const settings = {
	error: (msg: string) => {
		throw new Error(`input error: ${msg}`);
	},
};

const message = "input error: The parameter 'bogus' can't be negated AND assigned at the same time";

describe('#41 A negated unknown parameter with a value is an input error', () => {
	for (const value of ['true', 'false', '0', '1', 'yes', '5', 'abc']) {
		test.todo(`--no-bogus=${value} with no config`, () => {
			expect(() => argMate([`--no-bogus=${value}`], undefined, settings)).toThrow(message);
		});
	}

	test.todo('--no-bogus=true when there is a config', () => {
		expect(() => argMate(['--no-bogus=true'], {file: {type: 'string'}}, settings)).toThrow(message);
	});

	test.todo('the value in the next argument', () => {
		expect(() => argMate(['--no-bogus=', 'abc'], undefined, settings)).toThrow(message);
	});

	test.todo('the name in kebab-case', () => {
		expect(() => argMate(['--no-foo-bar=5'], undefined, settings)).toThrow('input error');
	});

	test('--no-bogus with no value gives false', () => {
		expect(argMate(['--no-bogus'], undefined, settings)).toEqual({_: [], bogus: false});
	});

	test('--bogus=5 with no negation gives the value', () => {
		expect(argMate(['--bogus=5'], undefined, settings)).toEqual({_: [], bogus: 5});
	});

	test('a boolean parameter in the config gives this input error now', () => {
		expect(() => argMate(['--no-color=false'], {color: true}, settings)).toThrow(
			"input error: The parameter 'color' can't be negated AND assigned at the same time"
		);
	});

	// With this setting `no-` is a part of the name, thus there is no negation
	test('with allowNegatingFlags: false the name is noBogus', () => {
		expect(argMate(['--no-bogus=5'], undefined, {...settings, allowNegatingFlags: false})).toEqual({
			_: [],
			noBogus: 5,
		});
	});
});
