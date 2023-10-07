// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';

describe.todo('allowUnknown', () => {
	test('Plain', () => {
		let argv = argMate('--foo bar'.split(' '));
		expect(argv).toEqual({
			_: ['bar'],
			foo: true,
		});
	});

	test('Negation', () => {
		let argv = argMate(
			'--no-foo bar'.split(' '),
			{
				'no-foo': {type: 'boolean'},
			},
			{allowUnknown: false}
		);
		expect(argv).toEqual({
			_: ['bar'],
			noFoo: false,
		});
	});

	test('Disabled', done => {
		let argv = argMate(
			'--foo bar'.split(' '),
			{},
			{
				allowUnknown: false,
				error: msg => {
					expect(msg).toContain('Unspecified parameters');
					expect(msg).toContain('foo');
					done();
				},
			}
		);
	});
});
