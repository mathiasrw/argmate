// https://bun.sh/docs/test/writing

// @ts-expect-error
import {describe, expect, test} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import {argMate, argMateMini} from '../helper.ts';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('string' + engineType, () => {
		test('Default', () => {
			const argv = argMate('--foo bar --foo2 bar2'.trim().split(/\s+/), {
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
