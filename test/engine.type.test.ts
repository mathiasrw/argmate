// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';
import argMateLite from '../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

function run(argMate, type = '') {
	describe('Type', () => {
		test.todo('Set error from the outside' + type, done => {
			let argv = argMate(
				'--foobar'.split(' '),
				{
					foo: {type: '123abc'},
				},
				{
					error: msg => {
						expect(msg).toContain('type');
						expect(msg).toContain('123abc');
						done();
					},
				}
			);
		});

		test('Invalid type', () => {
			expect(() => {
				argMate(
					'--foo 3'.split(' '),
					{
						foo: {type: 'xyz'},
					},
					{
						error: msg => {
							console.log('bad - should panic!');
							expect(1).toBe(0);
						},
					}
				);
			}).toThrow();
		});
	});
}
