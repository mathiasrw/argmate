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
		test('as function' + engineType, () => {
			expect(() => {
				argMate('--foo 3'.split(' '), {
					foo: {type: 'number', valid: v => v > 4},
				});
			}).toThrow(/foo.*3/i);
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
