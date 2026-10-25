// https://bun.sh/docs/test/writing

// @ts-expect-error
import {describe, expect, test} from 'bun:test';

import type {DoneCallback, ErrorCallback} from '../../src/test-types.js';
import type {ArgMateEngine} from '../../src/types.js';
import {argMate, argMateMini} from '../helper.ts';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('Assign' + engineType, () => {
		test('Plain', () => {
			const argv = argMate('--foo= bar'.split(' '));
			expect(argv).toEqual({_: ['bar'], foo: ''});
		});

		test('joint', () => {
			const argv = argMate('--foo=bar'.split(' '));
			expect(argv).toEqual({
				_: [],
				foo: 'bar',
			});
		});

		test('short', () => {
			const argv = argMate('-f= bar'.split(' '));
			expect(argv).toEqual({_: ['bar'], f: ''});
		});

		test('short joint', () => {
			const argv = argMate('-f=bar'.split(' '));
			expect(argv).toEqual({
				_: [],
				f: 'bar',
			});
		});

		if (!engineType)
			test('super short', () => {
				const argv = argMate('-f123'.split(' '));
				expect(argv).toEqual({
					_: [],
					f: 123,
				});
			});

		if (!engineType)
			test('Multi with digits gives the digits to the last letter', () => {
				expect(argMate('-foo123'.split(' '), {}, {allowAssign: true})).toEqual({
					_: [],
					f: true,
					o: 123,
				});
			});

		test('Missing assignment', () => {
			expect(argMate('--foo='.split(' '), {}, {allowAssign: true})).toEqual({_: [], foo: ''});
		});

		test('Missing assignment long', () => {
			expect(argMate('--foo='.split(' '), {}, {allowAssign: true})).toEqual({_: [], foo: ''});
		});
		test('Missing assignment short', () => {
			expect(argMate('-abc ee -f='.split(' '), {}, {allowAssign: true})).toEqual({
				_: ['ee'],
				a: true,
				b: true,
				c: true,
				f: '',
			});
		});
	});
}
