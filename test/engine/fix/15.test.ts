// #15: All errors must be `Error` objects
// A call with a config or with settings threw the message as a string: no `message` property and no stack.
// The stack of an `Error` started in the library and not at the code that called `argMate`.
import {describe, expect, test} from 'bun:test';
import path from 'node:path';
import {
	argEngine,
	argEngineMini,
	argMate,
	argMateMini,
	configPreprocessing,
	root,
	target,
} from '../../helper.ts';

// The directory that has the code of the library: src/ for the source and dist/ for the bundles
const library = path.join(root, target === 'src' ? 'src' : 'dist') + path.sep;

// The value that `fn` throws
function thrown(fn) {
	try {
		fn();
	} catch (err) {
		return err;
	}
}

// The lines of the stack, one for each function call. The first one is the code that made the error.
const frames = err => String(err?.stack ?? '').match(/^\s+at .+$/gm) ?? [];

const engines = [
	{
		name: 'argMate',
		parse: argMate,
		engine: argEngine,
		engineMessage: `Parameter 'foo' configuration has an invalid type: 'bogus'`,
	},
	{
		name: 'argMateMini',
		parse: argMateMini,
		engine: argEngineMini,
		engineMessage: `'foo' got invalid type: 'bogus'`,
	},
];

// An engine config with a type that the config check does not let through. Only the engine can find it.
function bogusType(settings) {
	const engineConfig = configPreprocessing({foo: {type: 'string'}}, settings);
	engineConfig.parameterConfig.foo.type = 'bogus';
	return engineConfig;
}

for (const {name, parse, engine, engineMessage} of engines) {
	const engineMini = name === 'argMateMini';

	// The one call that throws an `Error` now, and only in the full engine
	const noConfig = {
		call: () => parse(['--foo=']),
		message: "No data provided for 'foo'",
	};

	// The other calls throw a string now
	const otherCalls = {
		'an input error with a config': {
			call: () => parse(['--foo'], {foo: {type: 'string'}}),
			message: "No data provided for 'foo'",
		},
		'an input error with settings and no config': {
			call: () => parse(['--foo'], undefined, {allowUnknown: false}),
			message: "Unknown parameter 'foo' not allowed",
		},
		'a config error that the config check finds': {
			call: () => parse([], {foo: {type: 'bogus'}}),
			message: "Invalid type 'bogus' for parameter 'foo'",
		},
		'a config error that the config check finds in `validate`': {
			call: () => parse([], {foo: {valid: 'x'}}),
			message: `The "validate" property of 'foo' must be a function, a regular expression or an array of valid values`,
		},
		'a config error that the engine finds': {
			call: () => engine(['--foo', 'a'], bogusType()),
			message: engineMessage,
		},
	};

	// Each call throws with the default `error` function or the default `panic` function
	const calls = {'an input error with no config and no settings': noConfig, ...otherCalls};

	describe(`#15 The default error functions throw an Error: ${name}`, () => {
		(engineMini ? test.todo : test)(
			'an input error with no config and no settings is an Error with the message',
			() => {
				const err = thrown(noConfig.call);
				expect(err).toBeInstanceOf(Error);
				expect(err.message).toBe(noConfig.message);
			}
		);

		for (const [what, {call, message}] of Object.entries(otherCalls)) {
			test.todo(`${what} is an Error with the message`, () => {
				const err = thrown(call);
				expect(err).toBeInstanceOf(Error);
				expect(err.message).toBe(message);
			});
		}

		(engineMini ? test.todo : test)('the engine with no engine config throws an Error', () => {
			const err = thrown(() => engine(['--foo=']));
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe("No data provided for 'foo'");
		});
	});

	describe(`#15 The stack starts at the code that called argMate: ${name}`, () => {
		for (const [what, {call}] of Object.entries(calls)) {
			test.todo(`${what}: the first line of the stack is the caller`, () => {
				const [first = 'The error has no stack'] = frames(thrown(call));
				expect(first).toContain(import.meta.path);
			});

			// A stack with no lines also has no lines of the library, but it does not show the caller
			test.todo(`${what}: the stack has lines and none is from the library`, () => {
				const stack = frames(thrown(call));
				expect(stack.length).toBeGreaterThan(0);
				expect(stack.filter(line => line.includes(library))).toEqual([]);
			});
		}
	});

	describe(`#15 A custom error function gets the message as a string: ${name}`, () => {
		test('error', () => {
			const messages = [];
			const error = msg => {
				messages.push(msg);
			};
			parse(['--foo'], {foo: {type: 'string'}}, {error});
			expect(messages).toEqual(["No data provided for 'foo'"]);
		});

		test('panic from the config check', () => {
			const messages = [];
			const panic = msg => {
				messages.push(msg);
			};
			parse([], {foo: {type: 'bogus'}}, {panic});
			expect(messages).toEqual(["Invalid type 'bogus' for parameter 'foo'"]);
		});

		test('panic from the engine', () => {
			const messages = [];
			const panic = msg => {
				messages.push(msg);
			};
			engine(['--foo', 'a'], bogusType({panic}));
			expect(messages).toEqual([engineMessage]);
		});

		test('the value that a custom error function throws gets to the caller unchanged', () => {
			const custom = {code: 2};
			const error = () => {
				throw custom;
			};
			expect(thrown(() => parse(['--foo'], {foo: {type: 'string'}}, {error}))).toBe(custom);
		});
	});
}

describe('#15 configPreprocessing', () => {
	test.todo('a config error is an Error with the message', () => {
		const err = thrown(() => configPreprocessing({foo: {type: 'bogus'}}));
		expect(err).toBeInstanceOf(Error);
		expect(err.message).toBe("Invalid type 'bogus' for parameter 'foo'");
	});
});
