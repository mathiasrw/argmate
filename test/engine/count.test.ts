// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import argMate from '../../src/argMate';
import argMateMini from '../../src/argMateMini';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('Count' + engineType, () => {
		test('Plain', () => {
			let argv = argMate('--foo bar --foo bar2'.split(' '), {foo: {type: 'count'}});
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
