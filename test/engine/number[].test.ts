// https://bun.sh/docs/test/writing

// @ts-ignore
import {describe, expect, test} from 'bun:test';

// also test float[]

import argMate from '../../src/argMate';
import argMateMini from '../../src/argMateMini';
import type {ArgMateEngine} from '../../src/types.js';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('number[]' + engineType, () => {
		test('Default', () => {
			const argv = argMate('--foo 9.2 --foo 2.9'.split(' '), {foo: {type: 'number[]'}});
			expect(argv).toEqual({
				_: [],
				foo: [9.2, 2.9],
			});
		});

		test('None', () => {
			const argv = argMate('--bar 9.2'.split(' '), {foo: {type: 'number[]'}});
			expect(argv).toEqual({
				_: ['9.2'],
				foo: [],
				bar: true,
			});
		});

		test('Single', () => {
			const argv = argMate('--foo 9.2'.split(' '), {foo: {type: 'number[]'}});
			expect(argv).toEqual({
				_: [],
				foo: [9.2],
			});
		});

		test('Multiple', () => {
			const argv = argMate('--foo 9.2 --foo 9.3 --foo 11'.split(' '), {
				foo: {type: 'number[]'},
			});
			expect(argv).toEqual({
				_: [],
				foo: [9.2, 9.3, 11],
			});
		});
	});
}
