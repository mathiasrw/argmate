// https://bun.sh/docs/test/writing

// @ts-ignore - bun:test types not available during TypeScript compilation
import {expect, test, describe} from 'bun:test';

import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';
import type {ArgMateEngine} from '../../src/types.js';

run(argMate);
run(argMateLite, ' lite');

let argv;

function run(argMate: ArgMateEngine, engineType = '') {
	describe.todo('Miscellaneous tests and edge cases' + engineType, () => {
		test('Long handle on single letter variations', () => {
			expect(argMate(['--f', 'value1', '-f', 'value2'])).toEqual({f: 'value2'});
			expect(argMate(['--foo=', 'bar', '--f=', 'baz'])).toEqual({foo: 'bar', f: 'baz'});
		});
	});
}
