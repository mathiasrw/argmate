// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

function run(argMate, type = '') {
	describe('AllowKeyNumValues' + type, () => {
		if (!type)
			test('Default', () => {
				let argv = argMate('-s123'.split(' '));
				expect(argv).toEqual({
					_: [],
					s: 123,
				});
			});

		if (!type)
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

		if (!type)
			test('No long config', () => {
				let argv = argMate('--s123'.split(' '));
				expect(argv).toEqual({
					_: [],
					s123: true,
				});
			});
	});
}
