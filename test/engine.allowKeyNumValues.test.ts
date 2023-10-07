// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';

describe.todo('AllowKeyNumValues', () => {
	test('Default to boolean', () => {
		let argv = argMate('--foo bar --foo2 bar2'.split(' '));
		expect(argv).toEqual({
			_: ['bar', 'bar2'],
			foo: true,
			foo2: true,
		});
	});

	test('Boolean negative', () => {
		let argv = argMate('--no-foo bar --foo2 bar2'.split(' '));
		expect(argv).toEqual({
			_: ['bar', 'bar2'],
			foo: false,
			foo2: true,
		});
	});
});
