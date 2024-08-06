// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

// also include array as type

import argMate from '../src/argMate';
import argMateLite from '../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

function run(argMate, caliber = '') {
	describe('string[]' + caliber, () => {
		test('Explicit', () => {
			let argv = argMate('--foo a  --foo b  --foo c'.split(/\s+/), {foo: {type: 'string[]'}});

			expect(argv).toEqual({
				_: [],
				foo: ['a', 'b', 'c'],
			});
		});

		test.if(!caliber)('Implicit', () => {
			let argv = argMate('--foo a  --foo b  --foo c'.split(/\s+/), {
				foo: {default: ['x', 'y', 'z']},
			});

			expect(argv).toEqual({
				_: [],
				foo: ['a', 'b', 'c'],
			});
		});

		test('Implicit default', () => {
			let argv = argMate('--foo a  --foo b  --foo c'.split(/\s+/), {
				bar: {default: ['x', 'y', 'z']},
			});

			expect(argv).toEqual({
				_: ['a', 'b', 'c'],
				bar: ['x', 'y', 'z'],
				foo: true,
			});
		});
	});
}
