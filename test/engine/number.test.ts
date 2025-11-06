// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

// also test float

import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';
import type {ArgMateEngine} from '../../src/types.js';

let argv;

run(argMate);
run(argMateLite, ' lite');

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

		test('Error on invalid autodetected type', done => {
			argMate(
				'--foo xyz --bar 222'.split(' '),
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

	test('Error on invalid explicit type', done => {
		argMate(
			'--foo 111 --foo2 xyz'.split(' '),
			{foo: 4, foo2: {type: 'number'}},
			{
				error: msg => {
					expect(msg).toContain('foo2');
					expect(msg).toContain('not a valid number');
					expect(msg).toContain('xyz');
					done();
				},
			}
		);
	});
}
