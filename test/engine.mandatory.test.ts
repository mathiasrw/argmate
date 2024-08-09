// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';
import argMateLite from '../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

function run(argMate, type = '') {
	describe('Mandatory' + type, () => {
		test('Default', () => {
			let argv = argMate('--foo bar'.split(' '), {
				foo: {mandatory: true},
			});
			expect(argv).toEqual({
				_: ['bar'],
				foo: true,
			});
		});

		test('with default', () => {
			let argv = argMate('--foo bar'.split(' '), {
				foo: {mandatory: true, default: 'abc'},
			});
			expect(argv).toEqual({
				_: [],
				foo: 'bar',
			});
		});
		test('missing', done => {
			let argv = argMate(
				'--bar'.split(' '),
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
