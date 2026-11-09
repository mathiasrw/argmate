// https://bun.sh/docs/test/writing

// @ts-expect-error
import {describe, expect, test} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import {argInfo, argMate, argMateMini} from '../helper.ts';

run(argMate);
run(argMateMini, ' Mini');

// A list item can be `[value, ...aliases]`: a string is an alias in the help, an array holds aliases that the help
// does not show. An alias in the input gives the value.
const engine = () => ({
	engine: {
		valid: [
			['V8', 'v8', ['js', 'node']],
			['RE2', 're2'],
		],
	},
});

// The error object that the `error` callback gets
function caught(argMate: ArgMateEngine, args: string[], config: object) {
	let got: any;
	argMate(
		args,
		config as any,
		{
			error: (e: unknown) => {
				got = e;
			},
		} as any
	);
	return got;
}

function run(argMate: ArgMateEngine, engineType = '') {
	const engineMini = '' !== engineType;

	describe('Valid with aliases' + engineType, () => {
		(engineMini ? test.todo : test)('an alias in the help gives the value', () => {
			expect(argMate(['--engine', 'v8'], engine())).toEqual({_: [], engine: 'V8'});
		});

		(engineMini ? test.todo : test)('a hidden alias gives the value', () => {
			expect(argMate(['--engine', 'node'], engine())).toEqual({_: [], engine: 'V8'});
		});

		test('the value itself is accepted', () => {
			expect(argMate(['--engine', 'RE2'], engine())).toEqual({_: [], engine: 'RE2'});
		});

		test('the first value is the default', () => {
			expect(argMate([], engine())).toEqual({_: [], engine: 'V8'});
		});

		test('the list is case sensitive', () => {
			expect(() => argMate(['--engine', 'Re2'], engine())).toThrow();
		});

		(engineMini ? test.todo : test)(
			'each value of an array type is checked and gets its value',
			() => {
				const config = {tag: {type: 'string[]', valid: ['a', ['b', 'x']]}};
				expect(argMate(['--tag', 'a', '--tag', 'x'], config)).toEqual({_: [], tag: ['a', 'b']});
				expect(() => argMate(['--tag', 'a', '--tag', 'y'], config)).toThrow();
			}
		);

		(engineMini ? test.todo : test)(
			'the error has the values and aliases of the help, not the hidden aliases',
			() => {
				expect(caught(argMate, ['--engine', 'x'], engine())).toEqual({
					code: 'INVALID',
					key: 'engine',
					alias: '--engine',
					value: 'x',
					valid: ['V8', 'v8', 'RE2', 're2'],
					message:
						"The value provided for the parameter 'engine' is not valid: 'x'. Please use one of the following values: V8/v8, RE2/re2",
				});
			}
		);

		test('the help shows the aliases with / and the values with a comma, not the hidden aliases', () => {
			const help = argInfo({config: engine()});
			expect(help).toContain('[V8/v8, RE2/re2]');
			expect(help).not.toContain('node');
		});

		test('a valid that is not a list is a config error', () => {
			expect(() => argMate([], {foo: {valid: 5}} as any)).toThrow(
				`The "valid" property of 'foo' must be an array of valid values`
			);
		});

		test('a function in valid is a config error', () => {
			expect(() => argMate([], {foo: {valid: () => true}} as any)).toThrow(
				`The "valid" property of 'foo' must be an array of valid values`
			);
		});

		test('a list in validate is the list of valid', () => {
			const config = {foo: {validate: ['a', 'b']}};
			expect(argMate([], config)).toEqual({_: [], foo: 'a'});
			expect(() => argMate(['--foo', 'c'], config)).toThrow();
		});

		test('a list in valid and in validate is a config error', () => {
			expect(() => argMate([], {foo: {valid: ['a'], validate: ['b']}} as any)).toThrow(
				"More than one config property for 'valid' in parameter 'foo'"
			);
		});

		(engineMini ? test.todo : test)('transform gets the value of an alias', () => {
			let got: unknown;
			const config = {
				engine: {valid: [['V8', ['js']], 'RE2'], transform: (v: string) => (got = v)},
			};
			argMate(['--engine', 'js'], config);
			expect(got).toBe('V8');
		});

		(engineMini ? test.todo : test)('an alias that transform gives is not a value', () => {
			const config = {engine: {valid: [['V8', ['js']], 'RE2'], transform: () => 'js'}};
			expect(() => argMate(['--engine', 'RE2'], config)).toThrow();
		});
	});

	describe('validate replaces the check of the list' + engineType, () => {
		(engineMini ? test.todo : test)(
			'validate gets the value and the list with the hidden aliases',
			() => {
				let got: unknown[] = [];
				const config = {
					engine: {
						valid: [['V8', 'v8', ['js']], 'RE2'],
						validate: (...args: unknown[]) => {
							got = args;
						},
					},
				};
				argMate(['--engine', 'js'], config);
				expect(got).toEqual(['V8', [['V8', 'v8', 'js'], ['RE2']]]);
			}
		);

		test('validate accepts a value that is not in the list', () => {
			const config = {engine: {valid: ['V8', 'RE2'], validate: () => true}};
			expect(argMate(['--engine', 'x'], config)).toEqual({_: [], engine: 'x'});
		});

		(engineMini ? test.todo : test)('a string from validate is the message', () => {
			const config = {n: {type: 'int', validate: (v: number) => 4 < v || `${v} is too small`}};
			expect(caught(argMate, ['--n', '3'], config)).toEqual({
				code: 'INVALID',
				key: 'n',
				alias: '--n',
				value: 3,
				message: '3 is too small',
			});
		});

		(engineMini ? test.todo : test)('undefined from validate passes', () => {
			const config = {n: {type: 'int', validate: () => undefined}};
			expect(argMate(['--n', '3'], config)).toEqual({_: [], n: 3});
		});

		test('false from validate gives the standard message', () => {
			const config = {n: {type: 'int', validate: () => false}};
			expect(caught(argMate, ['--n', '3'], config).message).toContain("'n'");
		});
	});

	describe('Valid' + engineType, () => {
		test('as function' + engineType, () => {
			expect(() => {
				argMate('--foo 3'.split(' '), {
					foo: {type: 'number', validate: v => v > 4},
				});
			}).toThrow(/foo.*3/i);
		});

		test('as array', () => {
			const argv = argMate('--foo b'.split(' '), {
				foo: {valid: ['a', 'b', 'c']},
			});

			expect(argv).toEqual({
				_: [],
				foo: 'b',
			});
		});

		test('invalid', () => {
			expect(() => {
				argMate('--foo 3'.split(' '), {
					foo: {type: 'number', valid: false},
				});
			}).toThrow();
		});
	});
}
