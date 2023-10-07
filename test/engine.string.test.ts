// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';

describe('string', () => {
	test('Default', () => {
		let argv = argMate('--foo bar --foo2 bar2'.trim().split(/\s+/), {
			foo: {type: 'string'},
			foo2: {type: 'string'},
		});

		expect(argv).toEqual({
			_: [],
			foo: 'bar',
			foo2: 'bar2',
		});
	});
});
