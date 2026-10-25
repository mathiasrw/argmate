// #2b: A token that the engine cannot read gives a config error
// A token that starts with `-` but is not in the pattern for a parameter (a single `-`, or `'- f'`) made the
// full engine call `panic('Group not returned')`. `panic` is for config errors. The token goes to `_` now.
import {describe, expect, test} from 'bun:test';
import {argMate, argMateMini} from '../../helper.ts';

// Parse with settings that record each call of `error` (input error) and of `panic` (config error)
function parse(engine, args, config = {}, settings = {}) {
	const calls = [];
	const result = engine(args, config, {
		...settings,
		error: msg => {
			calls.push(`error: ${msg}`);
		},
		panic: msg => {
			calls.push(`panic: ${msg}`);
		},
	});
	return {result, calls};
}

describe('#2b A token that the engine cannot read', () => {
	describe('the token goes to _ as a string', () => {
		test("a single - becomes '-'", () => {
			expect(argMate(['-'])).toEqual({_: ['-']});
		});

		test("a dash and then a space: '- f'", () => {
			expect(argMate(['- f'])).toEqual({_: ['- f']});
		});

		test("a space in a short name: '-a b'", () => {
			expect(argMate(['-a b'])).toEqual({_: ['-a b']});
		});

		test("a space in a long name: '--foo bar'", () => {
			expect(argMate(['--foo bar'])).toEqual({_: ['--foo bar']});
		});

		// Assumption: `-=5` is such a token. It has no name before the `=`, thus it is not in the pattern.
		test("no name before the =: '-=5'", () => {
			expect(argMate(['-=5'])).toEqual({_: ['-=5']});
		});

		test('the engine parses the arguments that come after the token', () => {
			expect(argMate(['a', '-', 'b', '--foo'])).toEqual({_: ['a', '-', 'b'], foo: true});
		});
	});

	describe('input from the user does not call panic', () => {
		test('a single - calls no error function', () => {
			expect(parse(argMate, ['-'])).toEqual({result: {_: ['-']}, calls: []});
		});

		test("'- f' calls no error function", () => {
			expect(parse(argMate, ['- f'])).toEqual({result: {_: ['- f']}, calls: []});
		});

		test('an error in the config calls panic', () => {
			expect(parse(argMate, [], {foo: {type: 'nonsense'}}).calls).toEqual([
				"panic: Invalid type 'nonsense' for parameter 'foo'",
			]);
		});

		test('an error in the input calls error', () => {
			expect(parse(argMate, ['--foo'], {}, {allowUnknown: false}).calls).toEqual([
				"error: Unknown parameter 'foo' not allowed",
			]);
		});
	});

	describe('a token that the engine does not examine', () => {
		test('a single - is the value of a parameter', () => {
			expect(argMate(['-n', '-'], {n: {type: 'string'}})).toEqual({_: [], n: '-'});
		});

		test('the tokens after -- go to _', () => {
			expect(argMate(['--', '-', '- f'])).toEqual({_: ['-', '- f']});
		});
	});

	describe('mini engine', () => {
		test("a single - becomes '-'", () => {
			expect(argMateMini(['-'])).toEqual({_: ['-']});
		});

		test('a single - calls no error function', () => {
			expect(parse(argMateMini, ['-'])).toEqual({result: {_: ['-']}, calls: []});
		});

		test("no name before the =: '-=5' and '--=5'", () => {
			expect(argMateMini(['-=5'])).toEqual({_: ['-=5']});
			expect(argMateMini(['--=5'])).toEqual({_: ['--=5']});
		});

		test("'-=5' calls no error function", () => {
			expect(parse(argMateMini, ['-=5'])).toEqual({result: {_: ['-=5']}, calls: []});
		});

		test('the engine parses the arguments that come after the token', () => {
			expect(argMateMini(['a', '-', 'b', '--foo'])).toEqual({_: ['a', '-', 'b'], foo: true});
		});

		// A name with a space is not a name. The mini engine has no pattern, thus it checks the name itself.
		for (const token of ['- f', '-a b', '--foo bar', '- ', '-a\tb', '- f=3', '--foo bar=3']) {
			test(`${JSON.stringify(token)} goes to _`, () => {
				expect(argMateMini([token])).toEqual({_: [token]});
			});
		}

		test('a name with a space goes to _ also when there is a config', () => {
			expect(argMateMini(['- f', '--file', 'a', '-a b'], {file: {type: 'string'}})).toEqual({
				_: ['- f', '-a b'],
				file: 'a',
			});
		});

		test('a name with a space calls no error function, also with allowUnknown: false', () => {
			expect(parse(argMateMini, ['- f'], {}, {allowUnknown: false})).toEqual({
				result: {_: ['- f']},
				calls: [],
			});
		});

		test('a space in the value is correct', () => {
			expect(argMateMini(['--foo=a b'])).toEqual({_: [], foo: 'a b'});
		});
	});
});
