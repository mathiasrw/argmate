// https://bun.sh/docs/test/writing

// @ts-expect-error
import {describe, expect, test} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import {argMate, argMateMini} from '../helper.ts';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('allowNegatingFlags' + engineType, () => {
		if (!engineType)
			test('Default', () => {
				const argv = argMate('--no-foo bar'.split(' '));
				expect(argv).toEqual({
					_: ['bar'],
					foo: false,
				});
			});

		test('Three dashes is an error', () => {
			expect(() => argMate('---no-foo bar'.split(' '))).toThrow("Invalid parameter '---no-foo'");
		});

		test('Disabled', () => {
			const argv = argMate('--no-foo bar'.split(' '), {}, {allowNegatingFlags: false});
			expect(argv).toEqual({
				_: ['bar'],
				noFoo: true,
			});
		});
	});
}
