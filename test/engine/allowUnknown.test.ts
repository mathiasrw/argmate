// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

let argv;

function run(argMate, type = '') {
	describe('allowUnknown' + type, () => {
		test('Default', () => {
			let argv = argMate('--foo bar'.split(' '), {bar: 123});
			expect(argv).toEqual({
				_: ['bar'],
				bar: 123,
				foo: true,
			});
		});

		test('Disabled A', done => {
			argMate(
				'--foo bar'.split(' '),
				{bar: 123},
				{
					allowUnknown: false,
					error: msg => {
						expect(msg).toContain('not allowed');
						expect(msg).toContain('foo');
						done();
					},
				}
			);
		});

		test('Disabled B', done => {
			argMate(
				'--foo a --bar 456'.split(' '),
				{bar: 123},
				{
					allowUnknown: false,
					error: msg => {
						expect(msg).toContain('not allowed');
						expect(msg).toContain('foo');
						done();
					},
				}
			);
		});

		test('Disabled C', () => {
			argv = argMate(
				'--foo a --bar 456'.split(' '),
				{foo: 'b', bar: 123},
				{
					allowUnknown: false,
				}
			);
			expect(argv).toEqual({
				_: [],
				bar: 456,
				foo: 'a',
			});
		});
	});
}
