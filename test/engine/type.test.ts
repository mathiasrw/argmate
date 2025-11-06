// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';
import type {ArgMateEngine} from '../../src/types.js';

run(argMate);
run(argMateLite, ' lite');

function run(argMate: ArgMateEngine, caliber = '') {
	describe('Provide value type' + caliber, () => {
		test('Unsupported type', () => {
			expect(() => {
				argMate('--bar'.split(' '), {
					foo: {type: 'xyz'},
				});
			}).toThrow(/Invalid type.*xyz.*parameter.*foo/i);
		});

		test('Unexpected type will throw', () => {
			expect(() => {
				argMate('--foo xyz'.split(' '), {
					foo: {type: 'int'},
				});
			}).toThrow();
		});

		test('Count and array type does not support []', () => {
			expect(() => {
				argMate('--bar'.split(' '), {
					foo: {type: 'count[]'},
				});
			}).toThrow();

			expect(() => {
				argMate('--bar'.split(' '), {
					foo: {type: 'array[]'},
				});
			}).toThrow();
		});
	});
}
