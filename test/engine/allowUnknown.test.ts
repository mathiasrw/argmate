// https://bun.sh/docs/test/writing

import {expect, test, describe} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import type {DoneCallback, ErrorCallback} from '../../src/test-types.js';
import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

let argv;

function run(argMate: ArgMateEngine, engineType = '') {
	describe('allowUnknown' + engineType, () => {
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
					error: (msg: string) => {
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
					error: (msg: string) => {
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
