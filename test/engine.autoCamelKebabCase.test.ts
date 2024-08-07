// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';
import argMateLite from '../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

function run(argMate, type = '') {
	describe('autoCamelKebabCase' + type, () => {
		test('Plane', () => {
			let argv = argMate('--foo-bar 234'.split(' '), {fooBar: {type: 'int'}});
			expect(argv).toEqual({
				_: [],
				fooBar: 234,
			});
		});

		test('Disabled', () => {
			let argv = argMate(
				'--foo-bar 234'.split(' '),
				{fooBar: {type: 'int'}},
				{autoCamelKebabCase: false}
			);
			expect(argv).toEqual({
				_: ['234'],
				'foo-bar': true,
			});
		});

		test('Disabled but configured', () => {
			let argv = argMate(
				'--foo-bar 234'.split(' '),
				{'foo-bar': {type: 'int'}},
				{autoCamelKebabCase: false}
			);
			expect(argv).toEqual({
				_: [],
				'foo-bar': 234,
			});
		});
	});
}
