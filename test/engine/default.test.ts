// https://bun.sh/docs/test/writing

// @ts-ignore
import {describe, expect, test} from 'bun:test';

import argMate from '../../src/argMate';
import argMateMini from '../../src/argMateMini';
import type {ArgMateEngine} from '../../src/types.js';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('Default' + engineType, () => {
		test('Default to boolean', () => {
			const argv = argMate('--foo bar --foo2 bar2'.split(' '));
			expect(argv).toEqual({
				_: ['bar', 'bar2'],
				foo: true,
				foo2: true,
			});
		});

		if (!engineType)
			test('Boolean negative', () => {
				const argv = argMate('--no-foo bar --foo2 bar2'.split(' '));
				expect(argv).toEqual({
					_: ['bar', 'bar2'],
					foo: false,
					foo2: true,
				});
			});
	});
}
