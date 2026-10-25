// #26: `leadingValues`: arguments at the start that are not flags
// The first arguments of a program can start with `-` (a search pattern). `--` does not help, because it also
// stops the parse of the flags that come after it. With `leadingValues: n` the first n arguments go to `_`.
import {describe, expect, test} from 'bun:test';
import {argMate, argMateMini} from '../../helper.ts';

const engines = [
	['full engine', argMate],
	['mini engine', argMateMini],
];

describe('#26 leadingValues', () => {
	for (const [name, parse] of engines) {
		describe(name, () => {
			test('the default is 0: the engine examines the first argument', () => {
				expect(parse(['-v', 'my.file'])).toEqual({_: ['my.file'], v: true});
			});

			test('with leadingValues: 0, the engine examines the first argument', () => {
				expect(parse(['-v', 'my.file'], {}, {leadingValues: 0})).toEqual({
					_: ['my.file'],
					v: true,
				});
			});

			// The engines put '- f' in `_` with no leadingValues (item 2b), thus this example passes now
			test('the example of todo-v9.md: the first 2 arguments go to _', () => {
				expect(parse(['- f', '_', 'my.file', '-v'], {}, {leadingValues: 2})).toEqual({
					_: ['- f', '_', 'my.file'],
					v: true,
				});
			});

			test.todo('the first 2 arguments are not flags when they look like flags', () => {
				expect(parse(['-a', '--b', 'my.file', '-v'], {}, {leadingValues: 2})).toEqual({
					_: ['-a', '--b', 'my.file'],
					v: true,
				});
			});

			test.todo('with leadingValues: 1, the second argument is a flag', () => {
				expect(parse(['-a', '-b', 'my.file'], {}, {leadingValues: 1})).toEqual({
					_: ['-a', 'my.file'],
					b: true,
				});
			});

			// The engines put '- f' in `_` with no leadingValues (item 2b), thus this test passes now
			test("the leading value '- f' goes to _ with no change", () => {
				expect(parse(['- f', '-v'], {}, {leadingValues: 1})).toEqual({_: ['- f'], v: true});
			});

			for (const token of ['-abc', '--long', '--key=value', '-n100', '--no-color']) {
				test.todo(`the leading value '${token}' goes to _ with no change`, () => {
					expect(parse([token, '-v'], {}, {leadingValues: 1})).toEqual({_: [token], v: true});
				});
			}

			test.todo('a leading -- is a value and does not stop the parse of the flags', () => {
				expect(parse(['--', '-v'], {}, {leadingValues: 1})).toEqual({_: ['--'], v: true});
			});

			test.todo('a leading value is not an unknown parameter', () => {
				expect(parse(['-x', 'my.file'], {}, {leadingValues: 1, allowUnknown: false})).toEqual({
					_: ['-x', 'my.file'],
				});
			});

			test.todo('the engine parses declared parameters after the leading values', () => {
				const config = {count: {type: 'number'}};
				expect(parse(['-e', '--count', '3', 'my.file'], config, {leadingValues: 1})).toEqual({
					_: ['-e', 'my.file'],
					count: 3,
				});
			});

			test('leading values with no dash give the same result as now', () => {
				expect(parse(['a', 'b', '-v'], {}, {leadingValues: 2})).toEqual({_: ['a', 'b'], v: true});
			});

			// It is not an error when there are fewer arguments than `leadingValues`
			test.todo('fewer arguments than leadingValues: all of them go to _', () => {
				expect(parse(['-x'], {}, {leadingValues: 2})).toEqual({_: ['-x']});
			});

			// "With no change" means that `autoConvert` (item 5) does not convert a leading value
			for (const value of [-1, 1.5, 'abc']) {
				test.todo(`leadingValues: ${JSON.stringify(value)} gives a config error`, () => {
					const settings = {
						leadingValues: value,
						panic: msg => {
							throw new Error(`config error: ${msg}`);
						},
					};
					expect(() => parse(['a'], {}, settings)).toThrow('config error');
				});
			}

			test('a leading value stays a string', () => {
				expect(parse(['40', 'on', '-v'], {}, {leadingValues: 2})).toEqual({
					_: ['40', 'on'],
					v: true,
				});
			});
		});
	}
});
