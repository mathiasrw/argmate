// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import argMate from '../../src/argMate';
import argMateMini from '../../src/argMateMini';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('allowNegatingFlags' + engineType, () => {
		if (!engineType)
			test('Default', () => {
				let argv = argMate('---no-foo bar'.split(' '));
				expect(argv).toEqual({
					_: ['bar'],
					foo: false,
				});
			});

		test('Disabled', () => {
			let argv = argMate('--no-foo bar'.split(' '), {}, {allowNegatingFlags: false});
			expect(argv).toEqual({
				_: ['bar'],
				noFoo: true,
			});
		});
	});
}
