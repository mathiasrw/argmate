// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

// also test float[]

import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

function run(argMate, engineType = '') {
	describe('number[]' + engineType, () => {
		test('Default', () => {
			let argv = argMate('--foo 9.2 --foo 2.9'.split(' '), {foo: {type: 'number[]'}});
			expect(argv).toEqual({
				_: [],
				foo: [9.2, 2.9],
			});
		});

		test('None', () => {
			let argv = argMate('--bar 9.2'.split(' '), {foo: {type: 'number[]'}});
			expect(argv).toEqual({
				_: ['9.2'],
				foo: [],
				bar: true,
			});
		});

		test('Single', () => {
			let argv = argMate('--foo 9.2'.split(' '), {foo: {type: 'number[]'}});
			expect(argv).toEqual({
				_: [],
				foo: [9.2],
			});
		});

		test('Multiple', () => {
			let argv = argMate('--foo 9.2 --foo 9.3 --foo 11'.split(' '), {
				foo: {type: 'number[]'},
			});
			expect(argv).toEqual({
				_: [],
				foo: [9.2, 9.3, 11],
			});
		});
	});
}
