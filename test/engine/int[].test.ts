// https://bun.sh/docs/test/writing

// @ts-ignore
import {describe, expect, test} from 'bun:test';

import argMate from '../../src/argMate';
import argMateMini from '../../src/argMateMini';
import type {ArgMateEngine} from '../../src/types.js';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('int[]' + engineType, () => {
		test('Plain', () => {
			const argv = argMate('--foo 9 --foo 2'.split(' '), {foo: {type: 'int[]'}});
			expect(argv).toEqual({
				_: [],
				foo: [9, 2],
			});
		});

		test('Single', () => {
			const argv = argMate('--foo 9'.split(' '), {foo: {type: 'int[]'}});
			expect(argv).toEqual({
				_: [],
				foo: [9],
			});
		});
		test('None', () => {
			const argv = argMate('--bar 9'.split(' '), {foo: {type: 'int[]'}});
			expect(argv).toEqual({
				_: ['9'],
				foo: [],
				bar: true,
			});
		});
	});
}
