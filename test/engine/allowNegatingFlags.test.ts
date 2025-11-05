// https://bun.sh/docs/test/writing

import {expect, test, describe} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

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

		if (!engineType)
			test('Disabled', () => {
				let argv = argMate('--no-foo bar'.split(' '), {}, {allowNegatingFlags: false});
				expect(argv).toEqual({
					_: ['bar'],
					noFoo: true,
				});
			});
	});
}
