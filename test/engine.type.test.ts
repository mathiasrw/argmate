// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';
import argMateLite from '../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

function run(argMate, caliber = '') {
	describe('Provide value type' + caliber, () => {
		test('Unsupported type', done => {
			argMate(
				'--bar'.split(' '),
				{
					foo: {type: 'xyz'},
				},
				{
					panic: msg => {
						expect(msg).toContain('foo');
						expect(msg).toContain('Invalid type');
						expect(msg).toContain('xyz');
						done();
					},
				}
			);
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
