// #27: The engines must obey `allowAssign`
// The full engine read the setting `allowAssign` but did not use it, so `--foo=10` was accepted with `allowAssign: false`.
// The mini engine gave a flag with the name `foo=10` and no error. In the two engines, a `=` in a parameter must be an input error.
import {describe, expect, test} from 'bun:test';
import {argMate, argMateMini, configPreprocessing} from '../../helper.ts';

// Gives the result of the parse. When ArgMate calls `error` (input error) or `panic` (config error),
// gives the name of that callback and its message.
function parse(engine, args, config, settings = {}) {
	try {
		return engine(args, config, {
			...settings,
			error: ({message: msg}) => {
				throw {error: msg};
			},
			panic: msg => {
				throw {panic: msg};
			},
		});
	} catch (thrown) {
		if (thrown instanceof Error) throw thrown;
		return thrown;
	}
}

// The message in the plan is `Assignment with '=' is not allowed: '--foo=10'`. The tests accept each message, so the text can change
const inputError = {error: expect.any(String)};

const engines = [
	['Full engine', argMate],
	['Mini engine', argMateMini],
];

// Input with `=`: name of the case, input, config.
// The input is a string that each test splits, because the engine empties the array that it gets (issue 13).
const assignments = [
	['an unknown key', '--foo=10', () => ({})],
	['a string parameter', '--foo=bar', () => ({foo: {type: 'string'}})],
	['a number parameter', '--foo=10', () => ({foo: {type: 'number'}})],
	['a boolean parameter', '--foo=yes', () => ({foo: {type: 'boolean'}})],
	['the short form', '-f=10', () => ({})],
	['the value in the next token', '--foo= 10', () => ({})],
	['a group of short flags', '-abf=10', () => ({})],
];

for (const [name, engine] of engines) {
	const engineMini = engine === argMateMini;
	describe(`#27 ${name}: allowAssign: false`, () => {
		for (const [what, input, config] of assignments) {
			(engineMini ? test.todo : test)(`${what} (${input}) is an input error`, () => {
				expect(parse(engine, input.split(' '), config(), {allowAssign: false})).toEqual(inputError);
			});
		}

		test('a number parameter with the value in the next token (--foo 10) is accepted', () => {
			const config = {foo: {type: 'number'}};
			expect(parse(engine, ['--foo', '10'], config, {allowAssign: false})).toEqual({
				_: [],
				foo: 10,
			});
		});

		(engineMini ? test.todo : test)(
			'an unknown key and then a value (--foo 10) gives a flag and a value in `_`',
			() => {
				expect(parse(engine, ['--foo', '10'], {}, {allowAssign: false})).toEqual({
					_: [10],
					foo: true,
				});
			}
		);

		test('a value that contains = is accepted (--foo a=b)', () => {
			const config = {foo: {type: 'string'}};
			expect(parse(engine, ['--foo', 'a=b'], config, {allowAssign: false})).toEqual({
				_: [],
				foo: 'a=b',
			});
		});

		test('an argument that is not a parameter and contains = goes to `_`', () => {
			expect(parse(engine, ['a=b'], {}, {allowAssign: false})).toEqual({_: ['a=b']});
		});

		test('--foo=10 after `--` goes to `_`', () => {
			expect(parse(engine, ['--', '--foo=10'], {}, {allowAssign: false})).toEqual({
				_: ['--foo=10'],
			});
		});
	});

	describe(`#27 ${name}: allowAssign is true or not set`, () => {
		test('--foo=10 is accepted when there are no settings', () => {
			expect(engine(['--foo=10'])).toEqual({_: [], foo: 10});
		});

		test('--foo=10 is accepted when `allowAssign` is not set', () => {
			expect(parse(engine, ['--foo=10'], {})).toEqual({_: [], foo: 10});
		});

		test('--foo=10 is accepted with `allowAssign: true`', () => {
			expect(parse(engine, ['--foo=10'], {}, {allowAssign: true})).toEqual({_: [], foo: 10});
		});

		test('`allowAssign: true` has priority over `strict: true`', () => {
			const config = {foo: {type: 'number'}};
			expect(parse(engine, ['--foo=10'], config, {strict: true, allowAssign: true})).toEqual({
				_: [],
				foo: 10,
			});
		});
	});
}

describe('#27 Full engine: allowAssign: false and the short form with a number', () => {
	// This form has no `=`. The setting `allowKeyNumValues` controls it.
	test('-f10 is accepted', () => {
		expect(parse(argMate, ['-f10'], {}, {allowAssign: false})).toEqual({_: [], f: 10});
	});
});

describe('#27 strict: true sets allowAssign to false', () => {
	test('the settings that the engine gets have `allowAssign: false`', () => {
		expect(configPreprocessing({}, {strict: true}).engineSettings.allowAssign).toEqual(false);
	});

	// Parameters that are in the config, so `allowUnknown: false` is not the cause of the error
	const declared = [
		['a number parameter', '--foo=10', () => ({foo: {type: 'number'}})],
		['a string parameter', '--foo=bar', () => ({foo: {type: 'string'}})],
		['the short form', '-f=10', () => ({f: {type: 'string'}})],
	];

	for (const [what, input, config] of declared) {
		test(`Full engine: ${what} (${input}) is an input error`, () => {
			expect(parse(argMate, input.split(' '), config(), {strict: true})).toEqual(inputError);
		});
	}

	// Today the mini engine gives the error `Unknown parameter 'foo=10' not allowed` for these
	for (const [what, input, config] of declared.slice(0, 2)) {
		test(`Mini engine: ${what} (${input}) is an input error`, () => {
			expect(parse(argMateMini, input.split(' '), config(), {strict: true})).toEqual(inputError);
		});
	}

	// Today `allowUnknown: false` is the cause of this error
	for (const [name, engine] of engines) {
		test(`${name}: an unknown key (--foo=10) is an input error`, () => {
			expect(parse(engine, ['--foo=10'], {}, {strict: true})).toEqual(inputError);
		});
	}
});
