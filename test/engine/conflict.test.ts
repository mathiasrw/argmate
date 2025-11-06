// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';

let argv;

run(argMate);
run(argMateLite, ' lite');

function run(argMate: ArgMateEngine, engineType = '') {
	describe.if(!engineType)('Conflict' + engineType, () => {
		test('Opposing pairs A', () => {
			expect(() =>
				argMate(
					'--foo --bar'.split(' '),
					{
						foo: false,
						bar: {conflict: 'foo'},
					},
					{
						error: msg => {
							throw 'Error was called';
						},
					}
				)
			).toThrow('Error was called');
		});

		test('Opposing pairs B', () => {
			expect(() => {
				argMate('--foo --bar'.split(' '), {
					foo: false,
					bar: {conflict: 'foo'},
				});
			}).toThrow(/parameter.*bar.*conflicts.*foo/i);
		});

		test('Comma notation', () => {
			expect(() =>
				argMate(
					'--abc --foo'.split(' '),
					{abc: {conflict: ' foo,         bar '}},
					{
						error: msg => {
							expect(msg).toContain('conflict');
							expect(msg).toContain('abc');
							expect(msg).toContain('foo');
							throw 'Error was called';
						},
					}
				)
			).toThrow('Error was called');

			expect(() =>
				argMate(
					'--abc --bar'.split(' '),
					{abc: {conflict: 'foo, bar'}},
					{
						error: msg => {
							expect(msg).toContain('conflict');
							expect(msg).toContain('abc');
							expect(msg).toContain('bar');
							throw 'Error was called';
						},
					}
				)
			).toThrow('Error was called');
		});

		test('Array notation', () => {
			expect(() =>
				argMate(
					'--abc --foo'.split(' '),
					{abc: {conflict: ['foo', 'bar']}},
					{
						error: msg => {
							expect(msg).toContain('conflict');
							expect(msg).toContain('abc');
							expect(msg).toContain('foo');
							throw 'Error was called';
						},
					}
				)
			).toThrow('Error was called');

			expect(() =>
				argMate(
					'--abc --bar'.split(' '),
					{abc: {conflict: ['foo', 'bar']}},
					{
						error: msg => {
							expect(msg).toContain('conflict');
							expect(msg).toContain('abc');
							expect(msg).toContain('bar');
							throw 'Error was called';
						},
					}
				)
			).toThrow('Error was called');
		});

		test('Assign param', () => {
			argv = argMate('--foo --bar'.split(' '), {
				foo: '',
				bar: {conflict: 'foo'},
			});
			expect(argv).toEqual({
				_: [],
				foo: '--bar',
			});
		});

		test('Undefined key', () => {
			argv = argMate('--abc'.split(' '), {
				foo: {conflict: 'abc'},
				bar: {conflict: 'abc'},
			});

			expect(argv).toEqual({
				_: [],
				abc: true,
			});
			expect(() =>
				argMate(
					'--abc --foo'.split(' '),
					{
						abc: false,
						foo: {conflict: 'abc'},
						bar: {conflict: 'abc'},
					},
					{
						error: msg => {
							expect(msg).toContain('conflict');
							expect(msg).toContain('abc');
							throw 'Error was called';
						},
					}
				)
			).toThrow('Error was called');

			expect(() =>
				argMate(
					'--abc --bar'.split(' '),
					{
						abc: false,

						foo: {conflict: 'abc'},
						bar: {conflict: 'abc'},
					},
					{
						error: msg => {
							expect(msg).toContain('conflict');
							expect(msg).toContain('abc');
							throw 'Error was called';
						},
					}
				)
			).toThrow('Error was called');
		});

		test('Alias A1', () => {
			expect(() => {
				argMate('--abc --foo'.split(' '), {
					foo: {conflict: 'bar'},
					bar: {alias: 'abc'},
				});
			}).toThrow(/parameter.*foo.*conflicts.*bar/i);
		});
		test.todo('Alias A2', done => {
			argMate(
				'--bar --foo'.split(' '),
				{
					foo: {conflict: 'bar'},
					bar: {alias: 'abc'},
				},
				{
					error: msg => {
						expect(msg).toContain('conflict');
						expect(msg).toContain('foo');
						expect(msg).toContain('bar');
						done();
					},
				}
			);
		});

		test.todo('Alias B1', done => {
			argMate(
				'--abc --foo'.split(' '),
				{
					foo: {conflict: 'abc'},
					bar: {alias: 'abc'},
				},
				{
					error: msg => {
						expect(msg).toContain('conflict');
						expect(msg).toContain('foo');
						expect(msg).toContain('bar');
						done();
					},
				}
			);
		});

		test.todo('Alias B2', done => {
			argMate(
				'--bar --foo'.split(' '),
				{
					foo: {conflict: 'abc'},
					bar: {alias: 'abc'},
				},
				{
					error: msg => {
						expect(msg).toContain('conflict');
						expect(msg).toContain('foo');
						expect(msg).toContain('bar');
						done();
					},
				}
			);
		});
	});
}
