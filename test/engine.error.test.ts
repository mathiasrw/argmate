// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';
import argMateLight from '../src/argMateLite';

run(argMate);
run(argMateLight, ' light');

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
