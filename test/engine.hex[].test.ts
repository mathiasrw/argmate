// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';

describe('hex[]', () => {
	test('Plain', () => {
		let argv = argMate('--foo 0xff --foo 0x01'.split(' '), {foo: {type: 'hex[]'}});
		expect(argv).toEqual({
			_: [],
			foo: [255, 1],
		});
	});

	test('Single', () => {
		let argv = argMate('--foo 0xff'.split(' '), {foo: {type: 'hex[]'}});
		expect(argv).toEqual({
			_: [],
			foo: [255],
		});
	});
	test('None', () => {
		let argv = argMate('--bar 0xff'.split(' '), {foo: {type: 'hex[]'}});
		expect(argv).toEqual({
			_: ['0xff'],
			foo: [],
			bar: true,
		});
	});
});
