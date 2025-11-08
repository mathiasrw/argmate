// https://bun.sh/docs/test/writing

// @ts-ignore
import {describe, expect, test} from 'bun:test';

import argMate from '../../src/argMate';
import argMateMini from '../../src/argMateMini';
import type {ArgMateEngine} from '../../src/types.js';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('allowNegatingFlags' + engineType, () => {
		if (!engineType)
			test('Default', () => {
				const argv = argMate('---no-foo bar'.split(' '));
				expect(argv).toEqual({
					_: ['bar'],
					foo: false,
				});
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
