// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';

// remember to deal with setting stricts, but then setting all other objects
describe('Strict', () => {
	test.todo('Default to boolean', () => {
		let argv = argMate('--foo bar --foo2 bar2'.split(' '));
		expect(argv).toEqual({
			_: ['bar', 'bar2'],
			foo: true,
			foo2: true,
		});
	});
});
