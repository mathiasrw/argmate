// https://bun.sh/docs/test/writing

// @ts-expect-error
import {describe, expect, test} from 'bun:test';

// also include array as type

import type {ArgMateEngine} from '../../src/types.js';
import {argMate, argMateMini} from '../helper.ts';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, caliber = '') {
	describe('string[]' + caliber, () => {
		test('Explicit', () => {
			const argv = argMate('--foo a  --foo b  --foo c'.split(/\s+/), {foo: {type: 'string[]'}});

			expect(argv).toEqual({
				_: [],
				foo: ['a', 'b', 'c'],
			});
		});

		test('Implicit', () => {
			const argv = argMate('--foo a  --foo b  --foo c'.split(/\s+/), {
				foo: {default: ['x', 'y', 'z']},
			});

			expect(argv).toEqual({
				_: [],
				foo: ['a', 'b', 'c'],
			});
		});

		test('Implicit default', () => {
			const argv = argMate('--foo a  --foo b  --foo c'.split(/\s+/), {
				bar: {default: ['x', 'y', 'z']},
			});

			expect(argv).toEqual({
				_: ['a', 'b', 'c'],
				bar: ['x', 'y', 'z'],
				foo: true,
			});
		});
	});
}
