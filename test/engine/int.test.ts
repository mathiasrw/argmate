// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../../src/argMate';
import argMateMini from '../../src/argMateMini';
import type {ArgMateEngine} from '../../src/types.js';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('int' + engineType, () => {
		test('Default', () => {
			let argv = argMate('--foo 9'.split(' '), {foo: {type: 'int'}});
			expect(argv).toEqual({
				_: [],
				foo: 9,
			});
		});

		test('Multiple', () => {
			let argv = argMate('--foo 9 --foo 2'.split(' '), {foo: {type: 'int'}});
			expect(argv).toEqual({
				_: [],
				foo: 2,
			});
		});

		test('None', () => {
			let argv = argMate('--bar 9'.split(' '), {foo: {type: 'int'}});
			expect(argv).toEqual({
				_: ['9'],
				bar: true,
			});
		});

		test('Will throw on problematic input', () => {
			expect(() => argMate('--foo bar'.split(' '), {foo: {type: 'int'}})).toThrow(
				'is not a valid '
			);
		});
	});
}
