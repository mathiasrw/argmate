// Bugs found in 0.9.1

// @ts-expect-error
import {describe, expect, test} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import {argMate, argMateMini} from '../helper.ts';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	const engineMini = '' !== engineType;
	describe('Regression 0.9.1' + engineType, () => {
		test('a config object used again gives the same result', () => {
			const config = {kill: {type: 'boolean', alias: 'k'}};
			expect(argMate(['-k'], config)).toEqual({_: [], kill: true});
			expect(argMate(['-k'], config)).toEqual({_: [], kill: true});
		});

		// strict sets allowKeyNumValues to false, so the digits are not a value. Mini gives exit: -3
		(engineMini ? test.todo : test)(
			'a number right after a short flag stays in _ in strict mode',
			() => {
				expect(argMate(['-e3'], {exit: {type: 'int', alias: 'e'}}, {strict: true})).toEqual({
					_: ['-e3'],
				});
			}
		);

		test('a missing value in a group of short flags gives an error object', () => {
			let got: any;
			argMate(
				['-ke'],
				{kill: {type: 'boolean', alias: 'k'}, exit: {type: 'int', alias: 'e'}},
				{error: e => (got = e)}
			);
			expect(got).toMatchObject({code: 'MISSING_VALUE', key: 'exit'});
		});
	});
}
