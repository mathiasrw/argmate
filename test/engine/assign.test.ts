// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import type {DoneCallback, ErrorCallback} from '../../src/test-types.js';
import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('Assign' + engineType, () => {
		test('Plain', () => {
			let argv = argMate('--foo= bar'.split(' '));
			expect(argv).toEqual({
				_: [],
				foo: 'bar',
			});
		});

		test('joint', () => {
			let argv = argMate('--foo=bar'.split(' '));
			expect(argv).toEqual({
				_: [],
				foo: 'bar',
			});
		});

		test('short', () => {
			let argv = argMate('-f= bar'.split(' '));
			expect(argv).toEqual({
				_: [],
				f: 'bar',
			});
		});

		test('short joint', () => {
			let argv = argMate('-f=bar'.split(' '));
			expect(argv).toEqual({
				_: [],
				f: 'bar',
			});
		});

		if (!engineType)
			test('super short', () => {
				let argv = argMate('-f123'.split(' '));
				expect(argv).toEqual({
					_: [],
					f: 123,
				});
			});

		if (!engineType)
			test('Multi not allowed', done => {
				let argv = argMate(
					'-foo123'.split(' '),
					{},
					{
						error: (msg: string) => {
							expect(msg).toContain('Unsupported format');
							expect(msg).toContain('foo');
							done();
						},
					}
				);
			});

		test('Missing assignment', done => {
			let argv = argMate(
				'--foo='.split(' '),
				{},
				{
					error: (msg: string) => {
						expect(msg).toContain('No data provided for');
						expect(msg).toContain('foo');
						done();
					},
				}
			);
		});

		test('Missing assignment long', done => {
			let argv = argMate(
				'--foo='.split(' '),
				{},
				{
					error: (msg: string) => {
						expect(msg).toContain('No data provided');
						expect(msg).toContain('foo');
						done();
					},
				}
			);
		});
		test('Missing assignment short', done => {
			let argv = argMate(
				'-abc ee -f='.split(' '),
				{},
				{
					error: (msg: string) => {
						expect(msg).toContain('No data provided');
						expect(msg).toContain('f');
						done();
					},
				}
			);
		});
	});
}
