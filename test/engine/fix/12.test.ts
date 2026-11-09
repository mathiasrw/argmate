// #12: You cannot use one config object for two parses
// The first parse added an entry for each alias to the config object of the caller. The second parse
// read that entry as a parameter of type boolean, so the alias no longer gave the parameter.
// Now ArgMate does not change the config object of the caller.
import {describe, expect, test} from 'bun:test';
import {argEngine, argEngineMini, argMate, argMateMini, configPreprocessing} from '../../helper.ts';

const engines = [
	{
		name: 'argMate',
		parse: argMate,
		engine: argEngine,
		mandatoryMessage: "The parameter 'fooBar' is mandatory. You can also use an alias: foo-bar",
	},
	{
		name: 'argMateMini',
		parse: argMateMini,
		engine: argEngineMini,
		mandatoryMessage: "'--fooBar' is mandatory.  Or use an alias: --foo-bar",
	},
];

for (const {name, parse, engine, mandatoryMessage} of engines) {
	// One parse for each array of args, all with the same config object
	const parses = (config, ...inputs) => inputs.map(args => parse(args, config));

	describe(`#12 One config object for two parses: ${name}`, () => {
		test('the second parse gives the same result as the first', () => {
			const config = {file: {type: 'string', alias: 'f'}};
			expect(parses(config, ['-f', 'a.sql'], ['-f', 'a.sql'])).toEqual([
				{_: [], file: 'a.sql'},
				{_: [], file: 'a.sql'},
			]);
		});

		test('the third parse gives the same result as the first', () => {
			const config = {file: {type: 'string', alias: 'f'}};
			expect(parses(config, ['-f', 'a.sql'], ['-f', 'a.sql'], ['-f', 'a.sql'])).toEqual([
				{_: [], file: 'a.sql'},
				{_: [], file: 'a.sql'},
				{_: [], file: 'a.sql'},
			]);
		});

		test('the alias works in the second parse when the first parse used the name', () => {
			const config = {file: {type: 'string', alias: 'f'}};
			expect(parses(config, ['--file', 'a.sql'], ['-f', 'b.sql'])).toEqual([
				{_: [], file: 'a.sql'},
				{_: [], file: 'b.sql'},
			]);
		});

		test('each alias in a list of aliases works in the second parse', () => {
			const config = {file: {type: 'string', alias: ['f', 'input']}};
			expect(parses(config, ['--file', 'a.sql'], ['-f', 'b.sql'], ['--input', 'c.sql'])).toEqual([
				{_: [], file: 'a.sql'},
				{_: [], file: 'b.sql'},
				{_: [], file: 'c.sql'},
			]);
		});

		test('the alias of a boolean parameter works in the second parse', () => {
			const config = {verbose: {type: 'boolean', alias: 'v'}};
			expect(parses(config, ['-v', 'x'], ['-v', 'x'])).toEqual([
				{_: ['x'], verbose: true},
				{_: ['x'], verbose: true},
			]);
		});

		test('the alias of an array parameter works in the second parse', () => {
			const config = {tag: {type: 'string[]', alias: 't'}};
			expect(parses(config, ['-t', 'a', '-t', 'b'], ['-t', 'a', '-t', 'b'])).toEqual([
				{_: [], tag: ['a', 'b']},
				{_: [], tag: ['a', 'b']},
			]);
		});

		test('the aliases of several parameters work in the second parse', () => {
			const config = {
				port: {type: 'int', alias: 'p'},
				file: {type: 'string', alias: 'f'},
				verbose: {type: 'boolean', alias: 'v'},
			};
			const args = () => ['-p', '80', '-f', 'a.sql', '-v'];
			expect(parses(config, args(), args())).toEqual([
				{_: [], port: 80, file: 'a.sql', verbose: true},
				{_: [], port: 80, file: 'a.sql', verbose: true},
			]);
		});

		// ArgMate itself adds the alias `foo-bar` to a parameter with the name `fooBar`
		test('the kebab-case form of a camelCase parameter works in the second parse', () => {
			const config = {fooBar: {type: 'string'}};
			expect(parses(config, ['--foo-bar', 'x'], ['--foo-bar', 'x'])).toEqual([
				{_: [], fooBar: 'x'},
				{_: [], fooBar: 'x'},
			]);
		});

		// Assumption: todo-v9.md does not have this symptom. Each parse adds `foo-bar` to the alias list
		// one more time, so the second message is `... alias: foo-bar, foo-bar`.
		test('the error message of the second parse is the same as that of the first', () => {
			const config = {fooBar: {type: 'string', mandatory: true}};
			const messages = [];
			const settings = {
				error: ({message: msg}) => {
					messages.push(msg);
				},
			};
			parse([], config, settings);
			parse([], config, settings);
			expect(messages).toEqual([mandatoryMessage, mandatoryMessage]);
		});

		// todo-v9.md does not say that the config object of the caller stays as the caller wrote it.
		// This test only says that the second parse does not change it more than the first parse did.
		test('the second parse does not change the config object', () => {
			const config = {file: {type: 'string', alias: 'f'}};
			parse(['-f', 'a.sql'], config);
			const afterFirstParse = structuredClone(config);
			parse(['-f', 'a.sql'], config);
			expect(config).toEqual(afterFirstParse);
		});

		test('the second parse does not change the config object of a camelCase parameter', () => {
			const config = {fooBar: {type: 'string'}};
			parse(['--foo-bar', 'x'], config);
			const afterFirstParse = structuredClone(config);
			parse(['--foo-bar', 'x'], config);
			expect(config).toEqual(afterFirstParse);
		});

		test('the name of the parameter works in the second parse', () => {
			const config = {file: {type: 'string', alias: 'f'}};
			expect(parses(config, ['--file', 'a.sql'], ['--file', 'b.sql'])).toEqual([
				{_: [], file: 'a.sql'},
				{_: [], file: 'b.sql'},
			]);
		});

		test('the second parse does not have the values of the first parse', () => {
			const config = {file: {type: 'string', alias: 'f'}};
			expect(parses(config, ['--file', 'a.sql', 'x'], [])).toEqual([
				{_: ['x'], file: 'a.sql'},
				{_: []},
			]);
		});
	});

	describe(`#12 One config object for two calls of configPreprocessing: ${name}`, () => {
		test('the alias works with the second engine config', () => {
			const config = {file: {type: 'string', alias: 'f'}};
			configPreprocessing(config);
			const engineConfig = configPreprocessing(config);
			expect(engine(['-f', 'a.sql'], engineConfig)).toEqual({_: [], file: 'a.sql'});
		});
	});
}
