// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

let argv;

function run(argMate, type = '') {
	describe.todo('Miscellaneous tests and edge cases' + type, () => {
		test('Long handle on single letter variations', () => {
			expect(argMate(['--f', 'value1', '-f', 'value2'])).toEqual({f: 'value2'});
			expect(argMate(['--foo=', 'bar', '--f=', 'baz'])).toEqual({foo: 'bar', f: 'baz'});
			// Adjust expectations based on your chosen behavior
		});
	});
}
