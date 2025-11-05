// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

// also test float

import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';

let argv;

run(argMate);
run(argMateLite, ' lite');

function run(argMate, engineType = '') {
	describe('Number' + engineType, () => {
		test('Default to boolean', () => {
			argv = argMate('--foo 111 --foo2 222'.split(' '), {foo: 4, foo2: {type: 'number'}});
			expect(argv).toEqual({
				_: [],
				foo: 111,
				foo2: 222,
			});
		});

		test('Error on invalid type', done => {
			argMate(
				'--foo xyz --foo2 222'.split(' '),
				{foo: 4, foo2: {type: 'number'}},
				{
					error: msg => {
						expect(msg).toContain('foo');
						expect(msg).toContain('not a valid number');
						expect(msg).toContain('xyz');
						done();
					},
				}
			);
		});
	});
}
