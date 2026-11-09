// #48: Errors as data
// The `error` callback gets an object, not a string: `code`, `key`, `alias`, `value`, `with`, `withAlias`, `valid` and
// `message`. `message` is the text ArgMate gave before. The default `error` throws an `Error` with the message, and with
// the properties of the object on the `Error`. `panic` keeps its string.
// This is for the full engine. The mini engine gives only `code`, `key` and `message` (it is a curiosity, not the product).
import {describe, expect, test} from 'bun:test';
import {argEngine, argMate, configPreprocessing} from '../../helper.ts';

// The object that the `error` callback gets
function caught(args: string[], config: object, settings: object = {}) {
	let got: unknown;
	argMate(
		args,
		config as any,
		{
			...settings,
			error: (e: unknown) => {
				got = e;
			},
		} as any
	);
	return got;
}

// The value that `fn` throws
function thrown(fn: () => unknown): any {
	try {
		fn();
	} catch (err) {
		return err;
	}
}

describe('#48 The error callback gets an object', () => {
	test('UNKNOWN: a parameter that is not in the config, with allowUnknown: false', () => {
		expect(caught(['--foo-bar'], {}, {allowUnknown: false})).toEqual({
			code: 'UNKNOWN',
			key: 'foo-bar',
			alias: '--foo-bar',
			message: "Unknown parameter 'foo-bar' not allowed",
		});
	});

	test('UNKNOWN: a name that is not a valid parameter name', () => {
		expect(caught(['---x'], {})).toEqual({
			code: 'UNKNOWN',
			alias: '---x',
			message: "Invalid parameter '---x'",
		});
	});

	test('MISSING_VALUE: the name of the parameter', () => {
		expect(caught(['--port'], {port: {type: 'int', alias: 'p'}})).toEqual({
			code: 'MISSING_VALUE',
			key: 'port',
			alias: '--port',
			message: "No data provided for 'port'",
		});
	});

	test('MISSING_VALUE: an alias gives the config name in key and the alias as typed', () => {
		expect(caught(['-p'], {port: {type: 'int', alias: 'p'}})).toEqual({
			code: 'MISSING_VALUE',
			key: 'port',
			alias: '-p',
			message: "No data provided for 'p'",
		});
	});

	test('NEGATED_AND_ASSIGNED', () => {
		expect(caught(['--no-debug=1'], {debug: false})).toEqual({
			code: 'NEGATED_AND_ASSIGNED',
			key: 'debug',
			alias: '--no-debug',
			value: '1',
			message: "The parameter 'debug' can't be negated AND assigned at the same time",
		});
	});

	test('BAD_VALUE: a value for a boolean that is not a boolean string', () => {
		expect(caught(['--debug=x'], {debug: false})).toEqual({
			code: 'BAD_VALUE',
			key: 'debug',
			alias: '--debug',
			value: 'x',
			message: "The parameter 'debug' is a boolean (a flag) so can't assign a value like 'x'",
		});
	});

	test('NEGATED_AND_ASSIGNED: --no- for a parameter that takes a value', () => {
		expect(caught(['--no-port', '5'], {port: {type: 'int'}})).toEqual({
			code: 'NEGATED_AND_ASSIGNED',
			key: 'port',
			alias: '--no-port',
			value: '5',
			message: "The parameter 'port' can't be negated AND assigned at the same time",
		});
	});

	test('BAD_TYPE: --no- for a count', () => {
		expect(caught(['--no-v'], {v: {type: 'count'}})).toEqual({
			code: 'BAD_TYPE',
			key: 'v',
			alias: '--no-v',
			message: "Can't negate 'v' as the type is set to 'count'",
		});
	});

	test('BAD_VALUE: a count with a value that is not an int', () => {
		expect(caught(['-v=x'], {v: {type: 'count'}})).toEqual({
			code: 'BAD_VALUE',
			key: 'v',
			alias: '-v',
			value: 'x',
			message: "The value of 'v' is not a valid int: 'x'",
		});
	});

	test('BAD_VALUE: an int parameter with a value that is not an int', () => {
		expect(caught(['--port=x'], {port: {type: 'int'}})).toEqual({
			code: 'BAD_VALUE',
			key: 'port',
			alias: '--port',
			value: 'x',
			message: "The value of 'port' is not a valid int: 'x'",
		});
	});

	test('BAD_VALUE: a value of more than 16 characters is cut in the message, and is in full in value', () => {
		expect(caught(['--port', 'abcdefghijklmnopq'], {port: {type: 'int'}})).toEqual({
			code: 'BAD_VALUE',
			key: 'port',
			alias: '--port',
			value: 'abcdefghijklmnopq',
			message: "The value of 'port' is not a valid int: 'abcdefghijklmnop...'",
		});
	});

	test('BAD_VALUE: a value of 16 characters is not cut', () => {
		expect(caught(['--port', 'abcdefghijklmnop'], {port: {type: 'int'}})).toMatchObject({
			message: "The value of 'port' is not a valid int: 'abcdefghijklmnop'",
		});
	});

	test('INVALID: a value that is not in the validate list, with the list in valid', () => {
		expect(caught(['--sort', 'foo'], {sort: {type: 'string', validate: ['a', 'b']}})).toEqual({
			code: 'INVALID',
			key: 'sort',
			alias: '--sort',
			value: 'foo',
			valid: ['a', 'b'],
			message:
				"The value provided for the parameter 'sort' is not valid: 'foo'. Please use one of the following values: a, b",
		});
	});

	test('INVALID: a value that does not match the regular expression, with it in valid', () => {
		expect(caught(['--sort', 'foo'], {sort: {type: 'string', validate: /^a/}})).toEqual({
			code: 'INVALID',
			key: 'sort',
			alias: '--sort',
			value: 'foo',
			valid: /^a/,
			message:
				"The value provided for the parameter 'sort' is not valid: 'foo'. The value must match /^a/",
		});
	});

	test('INVALID: a validate function that gives false', () => {
		expect(caught(['--n', '3'], {n: {type: 'int', validate: (v: number) => v > 4}})).toEqual({
			code: 'INVALID',
			key: 'n',
			alias: '--n',
			value: 3,
			message: "The value provided for the parameter 'n' is not valid: '3'",
		});
	});

	test('INVALID: a default value that is not valid has the name in its long form as alias', () => {
		expect(caught([], {sort: {type: 'string', default: 'x', validate: ['a']}})).toEqual({
			code: 'INVALID',
			key: 'sort',
			alias: '--sort',
			value: 'x',
			valid: ['a'],
			message:
				"The value provided for the parameter 'sort' is not valid: 'x'. Please use one of the following values: a",
		});
	});

	test('INVALID: a transform that throws', () => {
		const transform = () => {
			throw new Error('boom');
		};
		expect(caught(['--n', '3'], {n: {type: 'int', transform}})).toEqual({
			code: 'INVALID',
			key: 'n',
			alias: '--n',
			value: 3,
			message: "The transform for 'n' threw: boom",
		});
	});

	test('MANDATORY: the name in its long form as alias', () => {
		expect(caught([], {file: {type: 'string', mandatory: true}})).toEqual({
			code: 'MANDATORY',
			key: 'file',
			alias: '--file',
			message: "The parameter 'file' is mandatory.",
		});
	});

	test('MANDATORY: a camelCase name has its kebab form as alias', () => {
		expect(caught([], {globPipe: {type: 'string', mandatory: true}})).toMatchObject({
			code: 'MANDATORY',
			alias: '--glob-pipe',
		});
	});

	test('MANDATORY: with `autoCamelKebabCase: false` a camelCase name keeps its form as alias', () => {
		const config = {globPipe: {type: 'string', mandatory: true}};
		expect(caught([], config, {autoCamelKebabCase: false})).toMatchObject({alias: '--globPipe'});
	});

	test('CONFLICT: the two parameters, by config name and as typed', () => {
		expect(caught(['-a', '--b'], {a: {type: 'boolean', conflict: ['b']}, b: false})).toEqual({
			code: 'CONFLICT',
			key: 'a',
			alias: '-a',
			with: 'b',
			withAlias: '--b',
			message: "The parameter '-a' conflicts with '--b'",
		});
	});
});

describe('#48 The default error throws an Error with the properties of the object', () => {
	test('argMate with a config', () => {
		const err = thrown(() => argMate(['--port'], {port: {type: 'int'}}));
		expect(err).toBeInstanceOf(Error);
		expect(err.message).toBe("No data provided for 'port'");
		expect([err.code, err.key, err.alias]).toEqual(['MISSING_VALUE', 'port', '--port']);
	});

	test('argMate with no config and no settings', () => {
		const err = thrown(() => argMate(['---x']));
		expect(err).toBeInstanceOf(Error);
		expect([err.code, err.alias, err.message]).toEqual([
			'UNKNOWN',
			'---x',
			"Invalid parameter '---x'",
		]);
	});

	test('the engine with an engine config from configPreprocessing', () => {
		const err = thrown(() => argEngine(['--port'], configPreprocessing({port: {type: 'int'}})));
		expect(err).toBeInstanceOf(Error);
		expect([err.code, err.key, err.message]).toEqual([
			'MISSING_VALUE',
			'port',
			"No data provided for 'port'",
		]);
	});
});

describe('#48 panic keeps its string', () => {
	test('a custom panic gets the message of a config error as a string', () => {
		let got: unknown;
		argMate(
			[],
			{foo: {type: 'bogus'}} as any,
			{
				panic: (msg: unknown) => {
					got = msg;
				},
			} as any
		);
		expect(got).toBe("Invalid type 'bogus' for parameter 'foo'");
	});
});
