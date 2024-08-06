// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';
import argMateLite from '../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

function run(argMate, type = '') {
	describe('Assign' + type, () => {
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

		test.if(!type)('super short', () => {
			let argv = argMate('-f123'.split(' '));
			expect(argv).toEqual({
				_: [],
				f: 123,
			});
		});

		test.if(!type)('Multi not allowed', done => {
			let argv = argMate(
				'-foo123'.split(' '),
				{},
				{
					error: msg => {
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
					error: msg => {
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
					error: msg => {
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
					error: msg => {
						expect(msg).toContain('No data provided');
						expect(msg).toContain('f');
						done();
					},
				}
			);
		});
	});
}
