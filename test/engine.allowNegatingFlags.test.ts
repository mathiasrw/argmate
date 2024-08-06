// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';
import argMateLite from '../src/argMateLite';

run(argMate);
// run(argMateLite, ' lite');

function run(argMate, type = '') {
	describe.todo('allowNegatingFlags' + type, () => {
		test('Plain', () => {
			let argv = argMate('---no-foo bar'.split(' '));
			expect(argv).toEqual({
				_: ['bar'],
				foo: false,
			});
		});

		test('Disabled', () => {
			let argv = argMate('--no-foo bar'.split(' '), {}, {allowNegatingFlags: false});
			expect(argv).toEqual({
				_: ['bar'],
				noFoo: true,
			});
		});
	});
}
