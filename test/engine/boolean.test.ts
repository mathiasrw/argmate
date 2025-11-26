// https://bun.sh/docs/test/writing

// @ts-ignore
import {describe, expect, test} from 'bun:test';

import argMate from '../../src/argMate';
import argMateMini from '../../src/argMateMini';
import type {ArgMateEngine} from '../../src/types.js';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('Boolean' + engineType, () => {
		test('Default to boolean', () => {
			const argv = argMate('--foo bar --foo2 bar2'.split(' '));
			expect(argv).toEqual({
				_: ['bar', 'bar2'],
				foo: true,
				foo2: true,
			});
		});

		if (!engineType)
			test('Negate', () => {
				const argv = argMate('--no-foo bar --foo2 bar2'.split(' '));
				expect(argv).toEqual({
					_: ['bar', 'bar2'],
					foo: false,
					foo2: true,
				});
			});

		test('Default', () => {
			const argv = argMate('a b -c'.split(' '), {foo: true, bar: false});
			expect(argv).toEqual({
				_: ['a', 'b'],
				foo: true,
				bar: false,
				c: true,
			});
		});

		test.todo('Dont assign boolean', () => {
			expect(() => {
				argMate(
					'--foo= bar'.split(/\s+/),
					{
						foo: {type: 'boolean'},
					},
					{allowAssign: true}
				);
			}).toThrow(/foo.+can't assign.+bar/i);
		});

		test('Dont short assign boolean', () => {
			expect(() => {
				argMate(
					'--foo=bar'.split(' '),
					{
						foo: {type: 'boolean'},
					},
					{allowAssign: true}
				);
			}).toThrow(/foo.+boolean.+can't assign/i);
		});
	});
}
