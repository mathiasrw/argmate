// https://bun.sh/docs/test/writing

// @ts-ignore
import {describe, expect, test} from 'bun:test';

import argMate from '../../src/argMate';
import argMateMini from '../../src/argMateMini';
import type {ArgMateEngine} from '../../src/types.js';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('Stop' + engineType, () => {
		test('Default', () => {
			const argv = argMate('--foo bar -- --foo abc -g=4 -t9'.trim().split(/\s+/));

			expect(argv).toEqual({
				_: ['bar', '--foo', 'abc', '-g=4', '-t9'],
				foo: true,
			});
		});

		const argv = argMate('-s=-- -- -p=--'.split(' '));
		expect(argv).toEqual({_: ['-p=--'], s: '--'});
	});
}
