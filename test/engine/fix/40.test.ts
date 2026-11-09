// #40: `validate` can be a regular expression
// `validate` was a function or a list of the valid values. Now it can be a regular expression that the value must match.
import {describe, expect, test} from 'bun:test';
import {
	argEngine,
	argEngineMini,
	argInfo,
	argMate,
	argMateMini,
	configPreprocessing,
	precompileConfig,
} from '../../helper.ts';

// Gives the result of the parse. When ArgMate calls `error` (input error) or `panic` (config error),
// gives the name of that callback and its message.
function parse(engine, args, config) {
	try {
		return engine(args, config, {
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

const engines = [
	{
		name: 'argMate',
		parse: (args, config) => parse(argMate, args, config),
		engine: argEngine,
		message: (key, value, pattern) =>
			`The value provided for the parameter '${key}' is not valid: '${value}'. The value must match ${pattern}`,
	},
	{
		name: 'argMateMini',
		parse: (args, config) => parse(argMateMini, args, config),
		engine: argEngineMini,
		message: (key, value, pattern) =>
			`Invalid value for '${key}': '${value}'. Must match ${pattern}`,
	},
];

for (const {name, parse, engine, message} of engines) {
	describe(`#40 validate as a regular expression: ${name}`, () => {
		const email = /^[^\s@]+@[^\s@]+$/;

		test('a value that matches is accepted', () => {
			const config = {email: {type: 'string', validate: email}};
			expect(parse(['--email', 'a@b.dk'], config)).toEqual({_: [], email: 'a@b.dk'});
		});

		test('a value that does not match is an input error', () => {
			const config = {email: {type: 'string', validate: email}};
			expect(parse(['--email', 'abc'], config)).toEqual({error: message('email', 'abc', email)});
		});

		test('a regular expression in `valid` is a config error', () => {
			expect(parse(['--email', 'a@b.dk'], {email: {type: 'string', valid: email}})).toEqual({
				panic: `The "valid" property of 'email' must be an array of valid values`,
			});
		});

		test('a value given with = is checked', () => {
			const config = {email: {type: 'string', validate: email}};
			expect(parse(['--email=a@b.dk'], config)).toEqual({_: [], email: 'a@b.dk'});
			expect(parse(['--email=abc'], config)).toEqual({error: message('email', 'abc', email)});
		});

		test('a value given with an alias of the parameter is checked', () => {
			const config = {email: {type: 'string', alias: 'e', validate: email}};
			expect(parse(['-e', 'a@b.dk'], config)).toEqual({_: [], email: 'a@b.dk'});
			expect(parse(['-e', 'abc'], config)).toEqual({error: message('email', 'abc', email)});
		});

		// The same rule as RegExp.test(): use ^ and $ when the full value must match
		test('the regular expression can match a part of the value', () => {
			const config = {name: {type: 'string', validate: /b/}};
			expect(parse(['--name', 'abc'], config)).toEqual({_: [], name: 'abc'});
			expect(parse(['--name', 'xyz'], config)).toEqual({error: message('name', 'xyz', '/b/')});
		});

		test('with ^ and $ the full value must match', () => {
			const config = {name: {type: 'string', validate: /^b$/}};
			expect(parse(['--name', 'b'], config)).toEqual({_: [], name: 'b'});
			expect(parse(['--name', 'abc'], config)).toEqual({error: message('name', 'abc', '/^b$/')});
		});

		test('the flags of the regular expression are used', () => {
			const config = {name: {type: 'string', validate: /^abc$/i}};
			expect(parse(['--name', 'ABC'], config)).toEqual({_: [], name: 'ABC'});
		});

		test('with no type and no default the type is string', () => {
			const config = {email: {validate: email}};
			expect(parse(['--email', 'a@b.dk'], config)).toEqual({_: [], email: 'a@b.dk'});
			expect(parse(['--email', 'abc'], config)).toEqual({error: message('email', 'abc', email)});
		});

		test('with a default the type comes from the default', () => {
			const config = {port: {default: 80, validate: /^\d{2,4}$/}};
			expect(parse(['--port', '8080'], config)).toEqual({_: [], port: 8080});
			expect(parse(['--port', '5'], config)).toEqual({error: message('port', 5, '/^\\d{2,4}$/')});
		});

		test('a number is checked as text', () => {
			const config = {port: {type: 'int', validate: /^\d{4}$/}};
			expect(parse(['--port', '8080'], config)).toEqual({_: [], port: 8080});
			expect(parse(['--port', '80'], config)).toEqual({error: message('port', 80, '/^\\d{4}$/')});
		});

		test('a parameter that is not in the input is not checked', () => {
			expect(parse([], {email: {type: 'string', validate: email}})).toEqual({_: []});
			expect(parse(['x'], {email: {validate: email}})).toEqual({_: ['x']});
		});

		test('a default value that matches is accepted', () => {
			const config = {email: {default: 'a@b.dk', validate: email}};
			expect(parse([], config)).toEqual({_: [], email: 'a@b.dk'});
		});

		test('a default value that does not match is an input error', () => {
			const config = {email: {default: 'abc', validate: email}};
			expect(parse([], config)).toEqual({error: message('email', 'abc', email)});
		});

		test('each item of an array parameter must match', () => {
			const config = {tag: {type: 'string[]', validate: /^[a-z]+$/}};
			expect(parse(['--tag', 'a', '--tag', 'b'], config)).toEqual({_: [], tag: ['a', 'b']});
			expect(parse(['--tag', 'a', '--tag', 'B2'], config)).toEqual({
				error: message('tag', 'a,B2', '/^[a-z]+$/'),
			});
		});

		test('an array parameter that is not in the input is accepted', () => {
			const config = {tag: {type: 'string[]', validate: /^[a-z]+$/}};
			expect(parse([], config)).toEqual({_: [], tag: []});
		});

		test('mandatory and a regular expression: the parameter must be given', () => {
			const config = {email: {mandatory: true, validate: email}};
			expect(parse([], config)).toEqual({error: expect.stringContaining('mandatory')});
		});

		// RegExp.test() with the flag `g` starts at `lastIndex`, so each second call gives another answer
		test('a regular expression with the flag g gives the same answer for each parse', () => {
			const global = /b/g;
			const config = {name: {type: 'string', validate: global}};
			for (let i = 0; i < 4; i++) {
				expect(parse(['--name', 'abc'], config)).toEqual({_: [], name: 'abc'});
			}
			expect(global.lastIndex).toBe(0);
		});

		test('the regular expression of the caller does not change', () => {
			const sticky = /b/y;
			sticky.lastIndex = 1;
			parse(['--name', 'abc'], {name: {type: 'string', validate: sticky}});
			expect(sticky.lastIndex).toBe(1);
		});

		// #50: transform runs first
		test('the regular expression checks the transformed value', () => {
			const config = {
				name: {type: 'string', validate: /^[A-Z]+$/, transform: v => v.toUpperCase()},
			};
			expect(parse(['--name', 'abc'], config)).toEqual({_: [], name: 'ABC'});
			expect(parse(['--name', 'a1'], config)).toEqual({
				error: message('name', 'A1', '/^[A-Z]+$/'),
			});
		});

		// The config check finds it when ArgMate reads the config, also when the parameter is not in the input
		test('a validate that is not a function, a regular expression or a list is a config error', () => {
			const panic = `The "validate" property of 'foo' must be a function, a regular expression or an array of valid values`;
			for (const validate of [5, '^a$', {}, null, true]) {
				expect(parse(['--foo', 'a'], {foo: {type: 'string', validate}})).toEqual({panic});
				expect(parse([], {foo: {type: 'string', validate}})).toEqual({panic});
				expect(parse([], {foo: {valid: validate}})).toEqual({
					panic: `The "valid" property of 'foo' must be an array of valid values`,
				});
			}
		});

		test('a validate that is undefined is the same as no validate', () => {
			expect(parse(['--foo', 'a'], {foo: {type: 'string', validate: undefined}})).toEqual({
				_: [],
				foo: 'a',
			});
		});

		test('the engine with an engine config checks the regular expression', () => {
			const config = {email: {type: 'string', validate: email}};
			expect(engine(['--email', 'a@b.dk'], configPreprocessing(config))).toEqual({
				_: [],
				email: 'a@b.dk',
			});
			expect(() => engine(['--email', 'abc'], configPreprocessing(config))).toThrow();
		});

		// precompileConfig() gives JavaScript code. The regular expression is a regex literal in that code.
		test('the engine with a precompiled config checks the regular expression', () => {
			const code = precompileConfig({email: {type: 'string', validate: email}});
			expect(code).toContain('"validate": ' + email);
			const precompiled = () => new Function('return ' + code)();
			expect(engine(['--email', 'a@b.dk'], precompiled())).toEqual({_: [], email: 'a@b.dk'});
			expect(() => engine(['--email', 'abc'], precompiled())).toThrow();
		});
	});
}

describe('#40 validate as a regular expression: argInfo', () => {
	// argInfo() with no config gives the help for the config of the last parse
	test('argInfo() gives the help for a parameter with a regular expression', () => {
		argMate([], {email: {type: 'string', validate: /@/, description: 'Your email'}});
		const help = argInfo();
		expect(help).toContain('--email');
		expect(help).toContain('Your email');
	});
});
