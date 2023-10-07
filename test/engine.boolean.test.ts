// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';

describe('Boolean', () => {
	test('Default to boolean', () => {
		let argv = argMate('--foo bar --foo2 bar2'.split(' '));
		expect(argv).toEqual({
			_: ['bar', 'bar2'],
			foo: true,
			foo2: true,
		});
	});

	test('Negate', () => {
		let argv = argMate('--no-foo bar --foo2 bar2'.split(' '));
		expect(argv).toEqual({
			_: ['bar', 'bar2'],
			foo: false,
			foo2: true,
		});
	});

	test('Default', () => {
		let argv = argMate('a b -c'.split(' '), {foo: true, bar: false});
		expect(argv).toEqual({
			_: ['a', 'b'],
			foo: true,
			bar: false,
			c: true,
		});
	});

	test('Dont assign boolean', done => {
		let argv = argMate(
			'--foo= bar'.split(' '),
			{
				foo: {type: 'boolean'},
			},
			{
				error: msg => {
					expect(msg).toContain('foo');
					expect(msg).toContain('boolean');
					expect(msg).toContain('assign');
					done();
				},
			}
		);
	});

	test('Dont short assign boolean', done => {
		let argv = argMate(
			'--foo=bar'.split(' '),
			{
				foo: {type: 'boolean'},
			},
			{
				error: msg => {
					expect(msg).toContain('foo');
					expect(msg).toContain('boolean');
					expect(msg).toContain('assign');
					done();
				},
			}
		);
	});
});
