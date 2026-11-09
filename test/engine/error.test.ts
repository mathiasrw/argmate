// https://bun.sh/docs/test/writing

// @ts-expect-error
import {describe, expect, test} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import {argMate, argMateMini} from '../helper.ts';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	const engineMini = !!engineType;

	describe('Error fn' + engineType, () => {
		test('Set error handeling from the outside', done => {
			const argv = argMate(
				'--bar'.split(' '),
				{
					foo: {mandatory: true},
				},
				{
					error: ({message: msg}) => {
						expect(msg).toContain('mandatory');
						done();
					},
				}
			);
		});

		// SPEC.md: a group that is also a long name, with a letter that is not in the config
		(engineMini ? test.todo : test)('a group that is a long name proposes the long name', () => {
			let error: any;
			argMate(
				['-file', 'a.sql'],
				{file: {alias: 'f', type: 'string'}},
				{error: e => (error ??= {...e})}
			);
			expect(error).toEqual({
				code: 'UNKNOWN',
				key: 'i',
				alias: '-i',
				message: "Unknown parameter '-i' in '-file'\n\nDid you mean '--file'?",
			});
		});
	});
}
