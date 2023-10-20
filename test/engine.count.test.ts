// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';
import argMateLight from '../src/argMateLite';

run(argMate);
run(argMateLight, ' light');

function run(argMate, type = '') {
	describe('Count' + type, () => {
		test('Plain', () => {
			let argv = argMate('--foo bar --foo bar2'.split(' '), {foo: {type: 'count'}});
			expect(argv).toEqual({
				_: ['bar', 'bar2'],
				foo: 2,
			});
		});

		test('Default not allowed', done => {
			let argv = argMate(
				'--fox bar --foX bar2'.split(' '),
				{
					foo: {type: 'count', default: 11},
				},
				{
					error: msg => {
						expect(msg).toContain('11');
						expect(msg).toContain('foo');
						done();
					},
				}
			);
		});
	});
}
