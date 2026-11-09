// https://bun.sh/docs/test/writing

// @ts-expect-error
import {describe, expect, test} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import {argMate, argMateMini} from '../helper.ts';

run(argMate);
run(argMateMini, ' Mini');

// A long name can not start or end with a dash, or have two dashes in a row.
// A group of short flags can not have a dash.
function run(argMate: ArgMateEngine, engineType = '') {
	describe('Dashes in names' + engineType, () => {
		for (const token of [
			'---x',
			'----',
			'--foo-',
			'--no-',
			'--foo--bar',
			'--no--x',
			'-a-b',
			'-a-',
		]) {
			test(`${token} is an error`, () => {
				expect(() => argMate([token])).toThrow(`Invalid parameter '${token}'`);
			});
		}

		test('A dash inside a long name is kebab case', () => {
			expect(argMate(['--a-b'])).toEqual({_: [], aB: true});
		});

		test('A long name can end with digits after a dash', () => {
			expect(argMate(['--foo-1', '--level-23'])).toEqual({_: [], foo1: true, level23: true});
		});

		test('A digit inside a long name is part of the name', () => {
			expect(argMate(['--a1b'])).toEqual({_: [], a1b: true});
		});

		for (const token of ['-', '-=5', '--=5']) {
			test(`${token} has no name, so it goes to _`, () => {
				expect(argMate([token])).toEqual({_: [token]});
			});
		}

		for (const token of ['- f', '-a -b', '--x y']) {
			test(`'${token}' has a space, so it goes to _`, () => {
				expect(argMate([token])).toEqual({_: [token]});
			});
		}

		test('The args after an error are not read as positional', () => {
			expect(() => argMate(['-a-', '--b'])).toThrow(`Invalid parameter '-a-'`);
		});
	});
}
