// https://bun.sh/docs/test/writing

// @ts-ignore
import {describe, expect, test} from 'bun:test';

import argMate from '../../src/argMate';
import argMateMini from '../../src/argMateMini';
import type {ArgMateEngine} from '../../src/types.js';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('Mandatory' + engineType, () => {
		test('Default', () => {
			const argv = argMate('--foo bar'.split(' '), {
				foo: {mandatory: true},
			});
			expect(argv).toEqual({
				_: ['bar'],
				foo: true,
			});
		});

		test('with default', () => {
			const argv = argMate('--foo bar'.split(' '), {
				foo: {mandatory: true, default: 'abc'},
			});
			expect(argv).toEqual({
				_: [],
				foo: 'bar',
			});
		});
		test('missing', () => {
			expect(() => {
				argMate('--bar'.split(' '), {
					foo: {mandatory: true},
				});
			}).toThrow(/mandatory/i);
		});
	});
}
