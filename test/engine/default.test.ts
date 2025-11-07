// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import argMate from '../../src/argMate';
import argMateMini from '../../src/argMateMini';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('Default' + engineType, () => {
		test('Default to boolean', () => {
			let argv = argMate('--foo bar --foo2 bar2'.split(' '));
			expect(argv).toEqual({
				_: ['bar', 'bar2'],
				foo: true,
				foo2: true,
			});
		});

		if (!engineType)
			test('Boolean negative', () => {
				let argv = argMate('--no-foo bar --foo2 bar2'.split(' '));
				expect(argv).toEqual({
					_: ['bar', 'bar2'],
					foo: false,
					foo2: true,
				});
			});
	});
}
