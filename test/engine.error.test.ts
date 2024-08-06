// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';
import argMateLite from '../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

function run(argMate, type = '') {
	describe('Error fn' + type, () => {
		test('Set error from the outside', done => {
			let argv = argMate(
				'--foobar'.split(' '),
				{
					foo: {mandatory: true},
				},
				{
					error: msg => {
						expect(msg).toContain('mandatory');
						done();
					},
				}
			);
		});
	});
}
