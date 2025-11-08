// https://bun.sh/docs/test/writing

// @ts-ignore
import {describe, expect, test} from 'bun:test';

import argMate from '../../src/argMate';
import argMateMini from '../../src/argMateMini';
import type {DoneCallback, ErrorCallback} from '../../src/test-types.js';
import type {ArgMateEngine} from '../../src/types.js';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('Assign' + engineType, () => {
		test('Plain', () => {
			const argv = argMate('--foo= bar'.split(' '));
			expect(argv).toEqual({
				_: [],
				foo: 'bar',
			});
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
			expect(argv).toEqual({
				_: [],
				f: 'bar',
			});
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
			test('Multi not allowed', () => {
				expect(() => {
					argMate('-foo123'.split(' '), {}, {allowAssign: true});
				}).toThrow(/Unsupported format.*foo/i);
			});

		test('Missing assignment', () => {
			expect(() => {
				argMate('--foo='.split(' '), {}, {allowAssign: true});
			}).toThrow(/No data provided for.*foo/i);
		});

		test('Missing assignment long', () => {
			expect(() => {
				argMate('--foo='.split(' '), {}, {allowAssign: true});
			}).toThrow(/No data provided.*foo/i);
		});
		test('Missing assignment short', () => {
			expect(() => {
				argMate('-abc ee -f='.split(' '), {}, {allowAssign: true});
			}).toThrow(/No data provided.*f/i);
		});
	});
}
