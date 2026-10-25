// https://bun.sh/docs/test/writing

// @ts-expect-error
import {describe, expect, test} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import {argMate, argMateMini} from '../helper.ts';

/* potential idea

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe.todo('JSON' + engineType, () => {
		test('simple value', () => {
			let argv = argMate(['--foo=', '5'], {foo: {type: 'json'}});
			expect(argv).toEqual({
				_: [],
				foo: 5,
			});
		});

		test('object', () => {
			let argv = argMate(['--foo=', '{"foo":"bar"}'], {foo: {type: 'json'}});
			expect(argv).toEqual({
				_: [],
				foo: {
					foo: 'bar',
				},
			});
		});

		test('Array of objects', () => {
			let argv = argMate(['--foo=', '[ {"foo": "bar"}, {"abc":"zyx"} ]'], {
				foo: {type: 'json'},
			});
			expect(argv).toEqual({
				_: [],
				foo: {
					foo: 'bar',
					abc: 'xyz',
				},
			});
		});
	});
}
//*/
