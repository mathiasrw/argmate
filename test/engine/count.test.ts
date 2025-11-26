// https://bun.sh/docs/test/writing

// @ts-ignore
import {describe, expect, test} from 'bun:test';

import argMate from '../../src/argMate';
import argMateMini from '../../src/argMateMini';
import type {ArgMateEngine} from '../../src/types.js';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('Count' + engineType, () => {
		test('Plain', () => {
			const argv = argMate('--foo bar --foo bar2'.split(' '), {foo: {type: 'count'}});
			expect(argv).toEqual({
				_: ['bar', 'bar2'],
				foo: 2,
			});
		});

		test('String not allowed', () => {
			expect(() => {
				argMate('--fox bar --foX bar2'.split(' '), {
					foo: {type: 'count', default: 11},
				});
			}).toThrow(/11.*foo/i);
		});
	});
}
