// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';

describe('Mandatory', () => {
	test('Plain', () => {
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
		argMate(
			'--foobar'.split(' '),
			{
				foo: {mandatory: true},
			},
			{
				error: msg => {
					done();
				},
			}
		);
	});
});
