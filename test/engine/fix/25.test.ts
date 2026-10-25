// #25: Catch property names that are not correct
// ArgMate ignored a property that it does not know: `{file: {alais: 'f'}}` gave no error and `-f` did not exist.
// The types of the full engine accepted such a property when it was next to a property that ArgMate knows.
import {describe, expect, test} from 'bun:test';
import {
	argInfo,
	argMate,
	argMateMini,
	configPreprocessing,
	precompileConfig,
} from '../../helper.ts';

// Gives the result of the parse. When ArgMate calls `error` (input error) or `panic` (config error),
// gives the name of that callback and its message.
function parse(args, config, engine = argMate) {
	try {
		return engine(args, config, {
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

// For the functions that only read the config
const panic = msg => {
	throw new Error(`config error: ${msg}`);
};

describe('#25 A property that ArgMate does not know', () => {
	test('the example of the issue gives a config error', () => {
		expect(parse(['-f'], {file: {alais: 'f'}})).toEqual({panic: expect.any(String)});
	});

	test('the config error comes when ArgMate reads the config, also with no input', () => {
		expect(parse([], {file: {alais: 'f'}})).toEqual({panic: expect.any(String)});
	});

	// Assumption: todo-v9.md does not give the text of the message. The message has the name of the property.
	test('the message has the name of the property', () => {
		expect(parse([], {file: {alais: 'f'}})).toEqual({panic: expect.stringContaining('alais')});
	});

	// Assumption: the message has the name of the parameter also.
	test('the message has the name of the parameter', () => {
		expect(parse([], {file: {alais: 'f'}})).toEqual({panic: expect.stringContaining('file')});
	});

	const unknownProperties = [
		['aliases', ['f']],
		['Alias', 'f'],
		['conflicts', ['out']],
		['defualt', 'a.txt'],
		['defaults', 'a.txt'],
		['tpye', 'string'],
		['requried', true],
		['Required', true],
		['validator', ['a.txt', 'b.txt']],
		['choices', ['a.txt', 'b.txt']],
		['transfrom', v => v],
		['descripton', 'The file'],
		['help', 'The file'],
		['key', 'file'],
	];

	for (const [property, value] of unknownProperties) {
		test(`'${property}' gives a config error`, () => {
			expect(parse([], {file: {[property]: value}})).toEqual({
				panic: expect.stringContaining(property),
			});
		});
	}

	test('an unknown property next to correct properties gives a config error', () => {
		const config = {file: {type: 'string', alias: 'f', alais: 'x'}};
		expect(parse([], config)).toEqual({panic: expect.stringContaining('alais')});
	});

	test('an unknown property in the second parameter gives a config error', () => {
		const config = {file: {alias: 'f'}, out: {alais: 'o'}};
		expect(parse([], config)).toEqual({panic: expect.stringContaining('alais')});
	});

	test('the parse throws when there is no `panic` setting', () => {
		expect(() => argMate([], {file: {alais: 'f'}})).toThrow();
	});

	test('the mini engine gives the config error', () => {
		expect(parse([], {file: {alais: 'f'}}, argMateMini)).toEqual({
			panic: expect.stringContaining('alais'),
		});
	});

	test('configPreprocessing() gives the config error', () => {
		expect(() => configPreprocessing({file: {alais: 'f'}}, {panic})).toThrow(
			/^config error: .*alais/
		);
	});

	test('precompileConfig() gives the config error', () => {
		expect(() => precompileConfig({file: {alais: 'f'}}, {panic})).toThrow(/^config error: .*alais/);
	});
});

describe('#25 The properties that ArgMate knows', () => {
	const knownProperties = [
		['type', {file: {type: 'string'}}, ['--file', 'a.txt'], {_: [], file: 'a.txt'}],
		['default', {file: {default: 'a.txt'}}, [], {_: [], file: 'a.txt'}],
		['alias', {file: {alias: 'f'}}, ['-f'], {_: [], file: true}],
		['conflict', {file: {conflict: ['out']}, out: {}}, ['--file'], {_: [], file: true}],
		[
			'validate',
			{file: {validate: ['a.txt', 'b.txt']}},
			['--file', 'b.txt'],
			{_: [], file: 'b.txt'},
		],
		['transform', {file: {transform: v => v}}, ['--file'], {_: [], file: true}],
		['mandatory', {file: {mandatory: true}}, ['--file'], {_: [], file: true}],
		['description', {file: {description: 'The file'}}, ['--file'], {_: [], file: true}],
	];

	for (const [property, config, args, result] of knownProperties) {
		test(`'${property}' is accepted`, () => {
			expect(parse(args, config)).toEqual(result);
		});
	}

	test('the eight properties in one parameter are accepted', () => {
		const config = {
			file: {
				type: 'string',
				default: 'a.txt',
				alias: 'f',
				conflict: ['out'],
				validate: ['a.txt', 'b.txt'],
				transform: v => v,
				mandatory: true,
				description: 'The file',
			},
			out: {},
		};
		expect(parse(['-f', 'b.txt'], config)).toEqual({_: [], file: 'b.txt'});
	});

	test('a parameter with no properties is accepted', () => {
		expect(parse(['--file'], {file: {}})).toEqual({_: [], file: true});
	});
});

// `validate`, `mandatory` and `description` are the canonical names. Each alias gives the result of its canonical name.
describe('#25 The aliases of the config properties', () => {
	for (const engine of [argMate, argMateMini]) {
		const name = engine === argMate ? 'argMate' : 'argMateMini';

		for (const property of ['validate', 'valid']) {
			test(`${name}: '${property}' with a list accepts a value in the list`, () => {
				const config = {file: {[property]: ['a.txt', 'b.txt']}};
				expect(parse(['--file', 'b.txt'], config, engine)).toEqual({_: [], file: 'b.txt'});
			});

			test(`${name}: '${property}' with a list rejects a value that is not in the list`, () => {
				const config = {file: {[property]: ['a.txt', 'b.txt']}};
				expect(parse(['--file', 'c.txt'], config, engine)).toEqual({
					error: expect.stringContaining('file'),
				});
			});

			test(`${name}: '${property}' with a list gives its first value as the default`, () => {
				expect(parse([], {file: {[property]: ['a.txt', 'b.txt']}}, engine)).toEqual({
					_: [],
					file: 'a.txt',
				});
			});

			test(`${name}: '${property}' with a function checks the value`, () => {
				const config = {n: {type: 'int', [property]: v => v > 4}};
				expect(parse(['--n', '5'], config, engine)).toEqual({_: [], n: 5});
				expect(parse(['--n', '3'], config, engine)).toEqual({error: expect.stringContaining('n')});
			});
		}

		for (const property of ['mandatory', 'required']) {
			test(`${name}: '${property}' makes the parameter mandatory`, () => {
				const config = {file: {type: 'string', [property]: true}};
				expect(parse(['--file', 'a.txt'], config, engine)).toEqual({_: [], file: 'a.txt'});
				expect(parse([], config, engine)).toEqual({error: expect.stringContaining('file')});
			});

			test(`${name}: '${property}: false' does not make the parameter mandatory`, () => {
				expect(parse([], {file: {type: 'string', [property]: false}}, engine)).toEqual({_: []});
			});
		}

		for (const property of ['description', 'describe', 'desc']) {
			test(`${name}: '${property}' is accepted`, () => {
				expect(parse(['--file'], {file: {[property]: 'The file'}}, engine)).toEqual({
					_: [],
					file: true,
				});
			});
		}

		const twoNames = [
			['validate', {validate: ['a'], valid: ['a']}],
			['validate', {valid: ['a'], validate: ['a']}],
			['mandatory', {mandatory: true, required: true}],
			['mandatory', {required: true, mandatory: true}],
			['description', {description: 'x', describe: 'x'}],
			['description', {describe: 'x', description: 'x'}],
			['description', {description: 'x', desc: 'x'}],
			['description', {desc: 'x', describe: 'x'}],
		];

		for (const [canonical, param] of twoNames) {
			test(`${name}: '${Object.keys(param).join(`' and '`)}' in one parameter is a config error`, () => {
				expect(parse([], {file: param}, engine)).toEqual({
					panic: `More than one config property for '${canonical}' in parameter 'file'`,
				});
			});
		}
	}

	test('the engine config has the canonical names only', () => {
		const {parameterConfig} = configPreprocessing({
			file: {valid: ['a', 'b'], required: true, describe: 'The file'},
		});
		expect(parameterConfig.file).toMatchObject({
			validate: ['a', 'b'],
			mandatory: true,
			description: 'The file',
		});
		expect(Object.keys(parameterConfig.file)).not.toContain('valid');
		expect(Object.keys(parameterConfig.file)).not.toContain('required');
		expect(Object.keys(parameterConfig.file)).not.toContain('describe');
	});

	test('the config object of the user does not change', () => {
		const config = {file: {valid: ['a', 'b'], required: true, desc: 'The file'}};
		parse(['--file', 'a'], config);
		expect(config).toEqual({file: {valid: ['a', 'b'], required: true, desc: 'The file'}});
	});

	for (const property of ['description', 'describe', 'desc']) {
		test(`argInfo() shows the text of '${property}'`, () => {
			expect(argInfo({}, {file: {[property]: 'The file to read'}})).toContain('The file to read');
		});
	}

	for (const property of ['validate', 'valid']) {
		test(`argInfo() shows the list of '${property}'`, () => {
			expect(argInfo({}, {file: {[property]: ['aaa', 'bbb']}})).toContain('aaa|bbb');
		});
	}
});

// A default value in place of the object is not an object with properties. It must not give a config error.
describe('#25 A default value in place of the object', () => {
	const shorthands = [
		['a string', 'a.txt'],
		['a number', 10],
		['a boolean', false],
		['an array of strings', ['a.txt', 'b.txt']],
		['an array of numbers', [1, 2]],
	];

	for (const [name, value] of shorthands) {
		test(`${name} is accepted`, () => {
			expect(parse([], {file: value})).toEqual({_: [], file: value});
		});
	}

	test('null is accepted', () => {
		expect(parse(['--file'], {file: null})).toEqual({_: [], file: true});
	});
});
