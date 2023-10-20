// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';
import argMateLight from '../src/argMateLite';

run(argMate);
run(argMateLight, ' light');

function run(argMate, type = '') {
	describe('int[]' + type, () => {
		test('Plain', () => {
			let argv = argMate('--foo 9 --foo 2'.split(' '), {foo: {type: 'int[]'}});
			expect(argv).toEqual({
				_: [],
				foo: [9, 2],
			});
		});

		test('Single', () => {
			let argv = argMate('--foo 9'.split(' '), {foo: {type: 'int[]'}});
			expect(argv).toEqual({
				_: [],
				foo: [9],
			});
		});
		test('None', () => {
			let argv = argMate('--bar 9'.split(' '), {foo: {type: 'int[]'}});
			expect(argv).toEqual({
				_: ['9'],
				foo: [],
				bar: true,
			});
		});
	});
}
