// https://bun.sh/docs/test/writing

// @ts-ignore
import {describe, expect, test} from 'bun:test';

import argMate from '../../src/argMate';
import argMateMini from '../../src/argMateMini';
import type {ArgMateEngine} from '../../src/types.js';

run(argMate);
run(argMateMini, ' Mini');

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
			const argv = argMate('--foo b'.split(' '), {
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
