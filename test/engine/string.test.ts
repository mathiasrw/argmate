// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../../src/argMate';
import argMateMini from '../../src/argMateMini';
import type {ArgMateEngine} from '../../src/types.js';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('string' + engineType, () => {
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
