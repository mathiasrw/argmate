// #13: The engine empties the args array of the caller
// The engine reversed the array of the caller and removed each item with `pop()`.
// After the parse the array was empty, or it had only the items that the engine did not get to.
import {describe, expect, test} from 'bun:test';
import {argEngine, argEngineMini, argMate, argMateMini, configPreprocessing} from '../../helper.ts';

const engines = [
	{name: 'argMate', parse: argMate, engine: argEngine},
	{name: 'argMateMini', parse: argMateMini, engine: argEngineMini},
];

for (const {name, parse, engine} of engines) {
	describe(`#13 The args array of the caller does not change: ${name}`, () => {
		test('after a parse with no config', () => {
			const args = ['--foo', 'bar', 'baz'];
			parse(args);
			expect(args).toEqual(['--foo', 'bar', 'baz']);
		});

		test('after a parse with a config', () => {
			const args = ['--foo', 'bar', 'baz'];
			parse(args, {foo: {type: 'string'}});
			expect(args).toEqual(['--foo', 'bar', 'baz']);
		});

		test('after a parse with settings', () => {
			const args = ['--foo', 'bar', 'baz'];
			parse(args, undefined, {allowAssign: false});
			expect(args).toEqual(['--foo', 'bar', 'baz']);
		});

		test('when no item is a parameter', () => {
			const args = ['a', 'b', 'c'];
			parse(args);
			expect(args).toEqual(['a', 'b', 'c']);
		});

		// The engine stopped at `--`, thus the array had the items after it: ['b', 'c']
		test('when `--` is in the input', () => {
			const args = ['a', '--', 'b', 'c'];
			parse(args);
			expect(args).toEqual(['a', '--', 'b', 'c']);
		});

		test('when `--` is in the input and `greedy` is on', () => {
			const args = ['a', '--', 'b', 'c'];
			parse(args, {}, {greedy: true});
			expect(args).toEqual(['a', '--', 'b', 'c']);
		});

		// The engine made a new array for the group, thus the array of the caller had the items after it: ['x']
		test('when a group of short flags is in the input', () => {
			const args = ['-abc', 'x'];
			parse(args);
			expect(args).toEqual(['-abc', 'x']);
		});

		test('when the parse throws an input error', () => {
			const args = ['a', '--port', 'x', 'b'];
			expect(() => parse(args, {port: {type: 'int'}})).toThrow();
			expect(args).toEqual(['a', '--port', 'x', 'b']);
		});

		test('when the parse with no config throws an input error', () => {
			const args = ['a', '--foo='];
			expect(() => parse(args)).toThrow();
			expect(args).toEqual(['a', '--foo=']);
		});

		test('after a call to the engine with no engine config', () => {
			const args = ['--foo', 'bar', 'baz'];
			engine(args);
			expect(args).toEqual(['--foo', 'bar', 'baz']);
		});

		test('after a call to the engine with an engine config', () => {
			const args = ['--foo', 'bar', 'baz'];
			engine(args, configPreprocessing({foo: {type: 'string'}}));
			expect(args).toEqual(['--foo', 'bar', 'baz']);
		});

		test('thus two parses of one array give the same result', () => {
			const args = ['--foo', 'bar', 'baz'];
			expect([parse(args), parse(args)]).toEqual([
				{_: ['bar', 'baz'], foo: true},
				{_: ['bar', 'baz'], foo: true},
			]);
		});

		// The engine must not write to the array. `args.reverse()` threw a TypeError here.
		test('thus an array that is frozen can be parsed', () => {
			expect(parse(Object.freeze(['--foo', 'bar', 'baz']))).toEqual({_: ['bar', 'baz'], foo: true});
		});

		test('an empty array stays empty', () => {
			const args = [];
			expect(parse(args)).toEqual({_: []});
			expect(args).toEqual([]);
		});
	});
}
