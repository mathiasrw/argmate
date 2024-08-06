// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';
import argMateLite from '../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

function run(argMate, type = '') {
	describe('Stop' + type, () => {
		test('Default', () => {
			let argv = argMate('--foo bar -- --foo abc -g=4 -t9'.trim().split(/\s+/));

			expect(argv).toEqual({
				_: ['bar', '--foo', 'abc', '-g=4', '-t9'],
				foo: true,
			});
		});
	});
}
