// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../../src/argMate';
import argMateMini from '../../src/argMateMini';
import type {ArgMateEngine} from '../../src/types.js';

run(argMate);
run(argMateMini, ' Mini');

let argv;

function run(argMate: ArgMateEngine, engineType = '') {
	describe.todo('Miscellaneous tests and edge cases' + engineType, () => {
		test('Long handle on single letter variations', () => {
			expect(argMate(['--f', 'value1', '-f', 'value2'])).toEqual({f: 'value2'});
			expect(argMate(['--foo=', 'bar', '--f=', 'baz'])).toEqual({foo: 'bar', f: 'baz'});
		});
	});
}
