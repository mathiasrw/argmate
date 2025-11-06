// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';
import type {ArgMateEngine} from '../../src/types.js';

/* potential idea

run(argMate);
run(argMateLite, ' lite');

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
