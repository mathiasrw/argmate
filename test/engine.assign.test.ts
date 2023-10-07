// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';

describe('Assign', () => {
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

	test('super short', () => {
		console.log(121111);
		let argv = argMate('-f123'.split(' '));
		expect(argv).toEqual({
			_: [],
			f: 123,
		});
		console.log(198767898761);
	});

	test('Multi not allowed', done => {
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
					expect(msg).toContain('one more parameter');
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
					expect(msg).toContain('one more parameter');
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
					expect(msg).toContain('one more parameter');
					expect(msg).toContain('f');
					done();
				},
			}
		);
	});
});
