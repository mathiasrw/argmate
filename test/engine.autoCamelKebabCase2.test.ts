// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';

describe('autoCamelKebabCase', () => {
	test('Plain', () => {
		let argv = argMate('--foo-bar 123'.split(' '));
		expect(argv).toEqual({
			_: ['123'],
			fooBar: true,
		});
	});

	test('Turned off', () => {
		let argv = argMate('--foo-bar 123'.split(' '), {}, {autoCamelKebabCase: false});
		expect(argv).toEqual({
			_: ['123'],
			'foo-bar': true,
		});
	});
});
