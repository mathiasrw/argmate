// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';
import type {ArgMateEngine} from '../../src/types.js';

run(argMate);
run(argMateLite, ' lite');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('Valid' + engineType, () => {
		test('as function' + engineType, done => {
			let argv = argMate(
				'--foo 3'.split(' '),
				{
					foo: {type: 'number', valid: v => v > 4},
				},
				{
					error: msg => {
						expect(msg).toContain('foo');
						expect(msg).toContain('3');
						done();
					},
				}
			);
		});

		test('as array', () => {
			let argv = argMate('--foo b'.split(' '), {
				foo: {valid: ['a', 'b', 'c']},
			});

			expect(argv).toEqual({
				_: [],
				foo: 'b',
			});
		});

		test('invalid', () => {
			expect(() => {
				argMate('--foo 3'.split(' '), {
					foo: {type: 'number', valid: false},
				});
			}).toThrow();
		});
	});
}
