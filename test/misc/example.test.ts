// https://bun.sh/docs/test/writing

// @ts-expect-error
import {describe, expect, test} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import {argMate, argMateMini} from '../helper.ts';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe.todo('Miscellaneous tests and edge cases' + engineType, () => {
		test('Long handle on single letter variations', () => {
			expect(argMate(['--f', 'value1', '-f', 'value2'])).toEqual({f: 'value2'});
			expect(argMate(['--foo=', 'bar', '--f=', 'baz'])).toEqual({foo: 'bar', f: 'baz'});
		});
	});
}
