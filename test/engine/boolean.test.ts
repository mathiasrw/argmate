// https://bun.sh/docs/test/writing

import {expect, test, describe} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('Boolean' + engineType, () => {
		test('Default to boolean', () => {
			let argv = argMate('--foo bar --foo2 bar2'.split(' '));
			expect(argv).toEqual({
				_: ['bar', 'bar2'],
				foo: true,
				foo2: true,
			});
		});

		if (!engineType)
			test('Negate', () => {
				let argv = argMate('--no-foo bar --foo2 bar2'.split(' '));
				expect(argv).toEqual({
					_: ['bar', 'bar2'],
					foo: false,
					foo2: true,
				});
			});

		test('Default', () => {
			let argv = argMate('a b -c'.split(' '), {foo: true, bar: false});
			expect(argv).toEqual({
				_: ['a', 'b'],
				foo: true,
				bar: false,
				c: true,
			});
		});

		test('Dont assign boolean', done => {
			let argv = argMate(
				'--foo= bar'.split(' '),
				{
					foo: {type: 'boolean'},
				},
				{
					error: msg => {
						expect(msg).toContain('foo');
						expect(msg).toContain('boolean');
						expect(msg).toContain('assign');
						done();
					},
				}
			);
		});

		test('Dont short assign boolean', done => {
			let argv = argMate(
				'--foo=bar'.split(' '),
				{
					foo: {type: 'boolean'},
				},
				{
					error: msg => {
						expect(msg).toContain('foo');
						expect(msg).toContain('boolean');
						expect(msg).toContain('assign');
						done();
					},
				}
			);
		});
	});
}
