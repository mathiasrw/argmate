// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

function run(argMate, type = '') {
	describe('string' + type, () => {
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
}
