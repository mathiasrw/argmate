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
	// An input error with no config and no settings
	const noConfig = {
		call: () => parse(['---x']),
		message: "Invalid parameter '---x'",
	};

	// The calls with a config, with settings, or with an engine config
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
			call: () => parse([], {foo: {validate: 'x'}}),
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
		test('an input error with no config and no settings is an Error with the message', () => {
			const err = thrown(noConfig.call);
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe(noConfig.message);
		});

		for (const [what, {call, message}] of Object.entries(otherCalls)) {
			test(`${what} is an Error with the message`, () => {
				const err = thrown(call);
				expect(err).toBeInstanceOf(Error);
				expect(err.message).toBe(message);
			});
		}

		test('the engine with no engine config throws an Error', () => {
			const err = thrown(() => engine(['---x']));
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe("Invalid parameter '---x'");
		});
	});

	describe(`#15 The stack starts at the code that called argMate: ${name}`, () => {
		const {'a config error that the engine finds': engineCall, ...throughArgMate} = calls;

		for (const [what, {call}] of Object.entries(throughArgMate)) {
			test(`${what}: the first line of the stack is the caller`, () => {
				const [first = 'The error has no stack'] = frames(thrown(call));
				expect(first).toContain(import.meta.path);
			});

			// A stack with no lines also has no lines of the library, but it does not show the caller
			test(`${what}: the stack has lines and none is from the library`, () => {
				const stack = frames(thrown(call));
				expect(stack.length).toBeGreaterThan(0);
				expect(stack.filter(line => line.includes(library))).toEqual([]);
			});
		}

		// The engine is called directly, not through argMate, so its stack starts in the library
		test.todo('a config error that the engine finds: the first line of the stack is the caller', () => {
			const [first = 'The error has no stack'] = frames(thrown(engineCall.call));
			expect(first).toContain(import.meta.path);
		});

		test.todo('a config error that the engine finds: the stack has lines and none is from the library', () => {
			const stack = frames(thrown(engineCall.call));
			expect(stack.length).toBeGreaterThan(0);
			expect(stack.filter(line => line.includes(library))).toEqual([]);
		});
	});

	describe(`#15 A custom error function gets the message (error: in an object, item 48; panic: as a string): ${name}`, () => {
		test('error', () => {
			const messages = [];
			const error = ({message: msg}) => {
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
	test('a config error is an Error with the message', () => {
		const err = thrown(() => configPreprocessing({foo: {type: 'bogus'}}));
		expect(err).toBeInstanceOf(Error);
		expect(err.message).toBe("Invalid type 'bogus' for parameter 'foo'");
	});
});
