// https://bun.sh/docs/test/writing

// @ts-expect-error
import {describe, expect, test} from 'bun:test';

import type {DoneCallback, ErrorCallback} from '../../src/test-types.js';
import type {ArgMateEngine} from '../../src/types.js';
import {argMate, argMateMini} from '../helper.ts';

run(argMate);
run(argMateMini, ' Mini');

let argv: unknown;

function run(argMate: ArgMateEngine, engineType = '') {
	describe('allowUnknown' + engineType, () => {
		test('Default', () => {
			const argv = argMate('--foo bar'.split(' '), {bar: 123});
			expect(argv).toEqual({
				_: ['bar'],
				bar: 123,
				foo: true,
			});
		});

		test('Disabled A', () => {
			expect(() => {
				argMate('--foo bar'.split(' '), {bar: 123}, {allowUnknown: false});
			}).toThrow(/Unknown parameter.*foo.*not allowed/i);
		});

		test('Disabled B', () => {
			expect(() => {
				argMate('--foo a --bar 456'.split(' '), {bar: 123}, {allowUnknown: false});
			}).toThrow(/Unknown parameter.*foo.*not allowed/i);
		});

		test('Disabled C', () => {
			argv = argMate(
				'--foo a --bar 456'.split(' '),
				{foo: 'b', bar: 123},
				{
					allowUnknown: false,
				}
			);
			expect(argv).toEqual({
				_: [],
				bar: 456,
				foo: 'a',
			});
		});
	});
}
