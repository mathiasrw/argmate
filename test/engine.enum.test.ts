// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';

// Enum is really a parameter where an array of values have been set as valid. Will default to first element if default is not provided.

describe('Enum', () => {
	test('Set differently', () => {
		let argv = argMate('--engine V8'.trim().split(/\s+/), {
			engine: {default: 'V4', valid: ['V4', 'V8', 'V12']},
			foo2: {type: 'string'},
		});

		expect(argv).toEqual({
			_: [],
			engine: 'V8',
		});
	});

	test('Set to default', () => {
		let argv = argMate('--engine V8'.trim().split(/\s+/), {
			engine: {default: 'V8', valid: ['V8']},
		});

		expect(argv).toEqual({
			_: [],
			engine: 'V8',
		});
	});

	test('Not set', () => {
		let argv = argMate('--foobar 123'.trim().split(/\s+/), {
			engine: {default: 'V8', valid: ['V8']},
		});

		expect(argv).toEqual({
			_: ['123'],
			engine: 'V8',
			foobar: true,
		});
	});
});
