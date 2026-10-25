// https://bun.sh/docs/test/writing

// @ts-expect-error
import {describe, expect, test} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import {argMate, argMateMini} from '../helper.ts';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe(`Count${engineType}`, () => {
		test('Plain', () => {
			const argv = argMate('--foo bar --foo bar2'.split(' '), {foo: {type: 'count'}});
			expect(argv).toEqual({
				_: ['bar', 'bar2'],
				foo: 2,
			});
		});

		test('Repeated flags increment count', () => {
			const argv = argMate('--foo --foo --foo'.split(' '), {foo: {type: 'count'}});
			expect(argv).toEqual({
				_: [],
				foo: 3,
			});
		});

		test('Negated count flag', () => {
			if (engineType) {
				const argv = argMate('--no-foo'.split(' '), {foo: {type: 'count'}});
				expect(argv).toEqual({
					_: [],
					foo: 0,
					noFoo: true,
				});
				return;
			}

			expect(() => argMate('--no-foo'.split(' '), {foo: {type: 'count'}})).toThrow(
				/Can't negate 'foo'.*count/i
			);
		});

		test('Assigned int adds to count', () => {
			const argv = argMate('-v=4 -v -v'.split(' '), {v: {type: 'count'}});
			expect(argv).toEqual({
				_: [],
				v: 6,
			});
		});

		test('Assigned negative int subtracts from count', () => {
			const argv = argMate('-v -v -v=-2'.split(' '), {v: {type: 'count'}});
			expect(argv).toEqual({
				_: [],
				v: 0,
			});
		});

		test('Assigned non-int errors', () => {
			expect(() => argMate('--foo=false'.split(' '), {foo: {type: 'count'}})).toThrow(
				/not a valid int/i
			);
		});

		test('Assigned float errors', () => {
			expect(() => argMate('--foo=2.5'.split(' '), {foo: {type: 'count'}})).toThrow(
				/not a valid int/i
			);
		});

		test('String not allowed', () => {
			expect(() => {
				argMate('--fox bar --foX bar2'.split(' '), {
					foo: {type: 'count', default: 11},
				});
			}).toThrow(/11.*foo/i);
		});
	});
}
