// https://bun.sh/docs/test/writing

// @ts-expect-error
import {describe, expect, test} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import {argMate, argMateMini} from '../helper.ts';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('Error fn' + engineType, () => {
		test('Set error handeling from the outside', done => {
			const argv = argMate(
				'--bar'.split(' '),
				{
					foo: {mandatory: true},
				},
				{
					error: msg => {
						expect(msg).toContain('mandatory');
						done();
					},
				}
			);
		});
	});
}
