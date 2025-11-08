// https://bun.sh/docs/test/writing

// @ts-ignore
import {describe, expect, test} from 'bun:test';

// also test float

import argMate from '../../src/argMate';
import argMateMini from '../../src/argMateMini';
import type {ArgMateEngine} from '../../src/types.js';

let argv;

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('Number' + engineType, () => {
		test('Default to boolean', () => {
			argv = argMate('--foo 111 --bar 222'.split(' '), {foo: 4, bar: {type: 'number'}});
			expect(argv).toEqual({
				_: [],
				foo: 111,
				bar: 222,
			});
		});

		test('Error on invalid autodetected type', () => {
			expect(() => {
				argMate('--foo xyz --bar 222'.split(' '), {foo: 4, foo2: {type: 'number'}});
			}).toThrow(/foo.*not a valid number.*xyz/i);
		});
	});

	test('Error on invalid explicit type', () => {
		expect(() => {
			argMate('--foo 111 --foo2 xyz'.split(' '), {foo: 4, foo2: {type: 'number'}});
		}).toThrow(/foo2.*not a valid number.*xyz/i);
	});
}
