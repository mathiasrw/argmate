// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';
import type {ArgMateEngine} from '../../src/types.js';

function run(argMate: ArgMateEngine, engineType = '') {
	describe('AllowKeyNumValues' + engineType, () => {
		if (!engineType)
			test('Default', () => {
				let argv = argMate('-s123'.split(' '));
				expect(argv).toEqual({
					_: [],
					s: 123,
				});
			});

		if (!engineType)
			describe('Disallow', () => {
				test('Default', () => {
					let argv = argMate(
						'-s123'.split(' '),
						{},
						{
							allowKeyNumValues: false,
						}
					);
					expect(argv).toEqual({
						_: [],
						s: true,
						'1': true,
						'2': true,
						'3': true,
					});
				});
			});

		if (!engineType)
			test('No long config', () => {
				let argv = argMate('--s123'.split(' '));
				expect(argv).toEqual({
					_: [],
					s123: true,
				});
			});
	});
}

run(argMate);
run(argMateLite, ' lite');
