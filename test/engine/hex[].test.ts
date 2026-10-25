// https://bun.sh/docs/test/writing

// @ts-expect-error
import {describe, expect, test} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import {argMate, argMateMini} from '../helper.ts';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('hex[]' + engineType, () => {
		test('Plain', () => {
			const argv = argMate('--foo 0xff --foo 0x01'.split(' '), {foo: {type: 'hex[]'}});
			expect(argv).toEqual({
				_: [],
				foo: [255, 1],
			});
		});

		test('Single', () => {
			const argv = argMate('--foo 0xff'.split(' '), {foo: {type: 'hex[]'}});
			expect(argv).toEqual({
				_: [],
				foo: [255],
			});
		});
		test('None', () => {
			const argv = argMate('--bar 0xff'.split(' '), {foo: {type: 'hex[]'}});
			expect(argv).toEqual({
				_: ['0xff'],
				foo: [],
				bar: true,
			});
		});
	});
}
