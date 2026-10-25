// #16: Helpful error message for a long name with one dash
// The engine reads `-version` as the group of flags `-v -e -r -s -i -o -n`. When `e` was unknown, the message was
// `Unknown parameter 'e' not allowed`. It did not show what the user typed and did not propose `--version`.
import {describe, expect, test} from 'bun:test';
import {argMate, argMateMini} from '../../helper.ts';

// Gives the result of the parse. When ArgMate calls `error` (input error) or `panic` (config error),
// gives the name of that callback and its message.
// An unknown parameter is an error only with `allowUnknown: false` (`strict: true` sets it also).
function parse(engine, args, config, settings = {allowUnknown: false}) {
	try {
		return engine(args, config, {
			...settings,
			error: msg => {
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

// `-v` is known and `-e` is unknown, as in the example of the issue
const versionIsName = () => ({version: {type: 'boolean'}, verbose: {alias: 'v'}});
const versionIsAlias = () => ({info: {alias: 'version'}, verbose: {alias: 'v'}});

const didYouMeanVersion = {
	error: "Unknown parameter '-e' in '-version'. Did you mean '--version'?",
};

describe('#16 Full engine: the letters together are a name', () => {
	test.todo('the name of a parameter: the message proposes two dashes', () => {
		expect(parse(argMate, ['-version'], versionIsName())).toEqual(didYouMeanVersion);
	});

	test.todo('an alias: the message proposes two dashes', () => {
		expect(parse(argMate, ['-version'], versionIsAlias())).toEqual(didYouMeanVersion);
	});

	test.todo('the kebab-case alias that ArgMate adds for a camelCase name', () => {
		const config = {dryRun: {alias: 'd'}};
		expect(parse(argMate, ['-dry-run'], config)).toEqual({
			error: "Unknown parameter '-r' in '-dry-run'. Did you mean '--dry-run'?",
		});
	});

	test.todo('the first letter of the group is the unknown letter', () => {
		const config = {version: {type: 'boolean'}};
		expect(parse(argMate, ['-version'], config)).toEqual({
			error: "Unknown parameter '-v' in '-version'. Did you mean '--version'?",
		});
	});

	test.todo('the fourth letter of the group is the unknown letter', () => {
		const config = {version: {type: 'boolean'}, v: {}, e: {}, r: {}};
		expect(parse(argMate, ['-version'], config)).toEqual({
			error: "Unknown parameter '-s' in '-version'. Did you mean '--version'?",
		});
	});

	test.todo('the token comes after other arguments', () => {
		expect(parse(argMate, ['file.txt', '-v', '-version'], versionIsName())).toEqual(
			didYouMeanVersion
		);
	});

	test.todo('the message is the same with `strict: true`', () => {
		expect(parse(argMate, ['-version'], versionIsName(), {strict: true})).toEqual(
			didYouMeanVersion
		);
	});
});

describe('#16 Full engine: the letters together are not a name', () => {
	// Assumption: the message is the first sentence of the message in the issue, with or without the period.
	// todo-v9.md says only: show the full token in the message.
	test.todo('the message shows the full token and proposes nothing', () => {
		const config = {verbose: {alias: 'v'}};
		expect(parse(argMate, ['-vex'], config)).toEqual({
			error: expect.stringMatching(/^Unknown parameter '-e' in '-vex'\.?$/),
		});
	});

	test.todo('a token with two letters', () => {
		const config = {verbose: {alias: 'v'}};
		expect(parse(argMate, ['-ve'], config)).toEqual({
			error: expect.stringMatching(/^Unknown parameter '-e' in '-ve'\.?$/),
		});
	});

	test.todo('the first letter of the group is the unknown letter', () => {
		const config = {verbose: {alias: 'v'}};
		expect(parse(argMate, ['-xv'], config)).toEqual({
			error: expect.stringMatching(/^Unknown parameter '-x' in '-xv'\.?$/),
		});
	});
});

describe('#16 Full engine: what does not change', () => {
	const shortFlags = () => ({verbose: {alias: 'v'}, quiet: {alias: 'q'}, debug: {alias: 'd'}});

	test('a group of known short flags is accepted', () => {
		expect(parse(argMate, ['-vqd'], shortFlags())).toEqual({
			_: [],
			verbose: true,
			quiet: true,
			debug: true,
		});
	});

	test('a group of known short flags is accepted when the letters together are a name', () => {
		const config = {version: {type: 'boolean'}, v: {}, e: {}, r: {}, s: {}, i: {}, o: {}, n: {}};
		expect(parse(argMate, ['-version'], config)).toEqual({
			_: [],
			v: true,
			e: true,
			r: true,
			s: true,
			i: true,
			o: true,
			n: true,
		});
	});

	test('one unknown short flag keeps its message', () => {
		expect(parse(argMate, ['-e'], versionIsName())).toEqual({
			error: "Unknown parameter 'e' not allowed",
		});
	});

	test('one unknown short flag after a group of known short flags keeps its message', () => {
		expect(parse(argMate, ['-vq', '-e'], shortFlags())).toEqual({
			error: "Unknown parameter 'e' not allowed",
		});
	});

	test('an unknown name with two dashes keeps its message', () => {
		expect(parse(argMate, ['--versio'], versionIsName())).toEqual({
			error: "Unknown parameter 'versio' not allowed",
		});
	});

	test('there is no error when unknown parameters are allowed', () => {
		expect(parse(argMate, ['-version'], versionIsName(), {})).toEqual({
			_: [],
			verbose: true,
			e: true,
			r: true,
			s: true,
			i: true,
			o: true,
			n: true,
		});
	});
});

describe('#16 Mini engine: the message does not change', () => {
	test('the letters together are the name of a parameter', () => {
		expect(parse(argMateMini, ['-version'], versionIsName())).toEqual({
			error: "Unknown parameter 'e' not allowed",
		});
	});

	test('the letters together are an alias', () => {
		expect(parse(argMateMini, ['-version'], versionIsAlias())).toEqual({
			error: "Unknown parameter 'e' not allowed",
		});
	});

	test('the letters together are not a name', () => {
		const config = {verbose: {alias: 'v'}};
		expect(parse(argMateMini, ['-vex'], config)).toEqual({
			error: "Unknown parameter 'e' not allowed",
		});
	});
});
