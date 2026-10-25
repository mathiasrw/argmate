// Regression test for #13: The engine empties the args array of the caller
import {describe, expect, test} from 'bun:test';
import {argEngine, argEngineMini, argMate, argMateMini, configPreprocessing} from '../helper.ts';

const engines = [
	{name: 'argMate', parse: argMate, engine: argEngine},
	{name: 'argMateMini', parse: argMateMini, engine: argEngineMini},
];

for (const {name, parse, engine} of engines) {
	describe(`#13 The args array of the caller does not change: ${name}`, () => {
		const unchanged = (args, run) => {
			const copy = [...args];
			run(args);
			expect(args).toEqual(copy);
		};

		test('no config', () => unchanged(['--foo', 'bar', 'baz'], a => parse(a)));
		test('config', () =>
			unchanged(['--foo', 'bar', 'baz'], a => parse(a, {foo: {type: 'string'}})));
		test('settings', () =>
			unchanged(['--foo', 'bar'], a => parse(a, undefined, {allowAssign: false})));
		test('no parameters', () => unchanged(['a', 'b', 'c'], a => parse(a)));
		test('`--`', () => unchanged(['a', '--', 'b', 'c'], a => parse(a)));
		test('`--` and greedy', () =>
			unchanged(['a', '--', 'b', 'c'], a => parse(a, {}, {greedy: true})));
		test('group of short flags', () => unchanged(['-abc', 'x'], a => parse(a)));
		test('empty array', () => unchanged([], a => parse(a)));

		test('input error', () => {
			const args = ['a', '--port', 'x', 'b'];
			expect(() => parse(args, {port: {type: 'int'}})).toThrow();
			expect(args).toEqual(['a', '--port', 'x', 'b']);
		});

		test('engine without config', () => unchanged(['--foo', 'bar', 'baz'], a => engine(a)));
		test('engine with config', () =>
			unchanged(['--foo', 'bar', 'baz'], a =>
				engine(a, configPreprocessing({foo: {type: 'string'}}))
			));

		test('two parses of one array give the same result', () => {
			const args = ['--foo', 'bar', 'baz'];
			const first = parse(args);
			expect(parse(args)).toEqual(first);
			expect(first).toEqual({_: ['bar', 'baz'], foo: true});
		});

		test('a frozen array can be parsed', () => {
			expect(parse(Object.freeze(['--foo', 'bar', 'baz']))).toEqual({_: ['bar', 'baz'], foo: true});
		});
	});
}
