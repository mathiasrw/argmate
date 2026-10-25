// https://bun.sh/docs/test/writing

// @ts-expect-error
import {describe, expect, test} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import {argMate, argMateMini} from '../helper.ts';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	if (!engineType)
		describe('Emojis' + engineType, () => {
			test('Single emoji flag', () => {
				expect(argMate(['-🍀'])).toEqual({'🍀': true, _: []});
			});

			test('Multiple emoji flag', () => {
				expect(argMate(['--🍀🍀', '-🍀'])).toEqual({'🍀🍀': true, '🍀': true, _: []});
			});

			test('Emoji with variation selector as short flag', () => {
				expect(argMate(['-☺️'])).toEqual({'☺️': true, _: []});
			});

			test('Emoji with skin tone as short flag', () => {
				expect(argMate(['-👍🏽'])).toEqual({'👍🏽': true, _: []});
			});

			test('Joined emoji as short flag', () => {
				expect(argMate(['-👨‍👩‍👧'])).toEqual({'👨‍👩‍👧': true, _: []});
			});

			test('Flag and keycap emoji as short flags', () => {
				expect(argMate(['-🇩🇰', '-1️⃣'])).toEqual({'🇩🇰': true, '1️⃣': true, _: []});
			});

			test('Group of emoji short flags', () => {
				expect(argMate(['-🥵🤖☺️👍🏽'])).toEqual({
					'🥵': true,
					'🤖': true,
					'☺️': true,
					'👍🏽': true,
					_: [],
				});
			});

			test('Group of emojis and letters', () => {
				expect(argMate(['-a🍀b'])).toEqual({a: true, '🍀': true, b: true, _: []});
			});

			test('Group of letters with accents, and e with the combining accent U+0301', () => {
				expect(argMate(['-æøå', '-éx'])).toEqual({
					æ: true,
					ø: true,
					å: true,
					é: true,
					x: true,
					_: [],
				});
			});

			test('Group of emojis with assigned value', () => {
				expect(argMate(['-🍀🤖=5'])).toEqual({'🍀': true, '🤖': 5, _: []});
			});

			test('Emoji short flag with value', () => {
				expect(argMate(['-☺️', '5'], {'☺️': {type: 'int'}})).toEqual({'☺️': 5, _: []});
			});

			test('Emoji short flag with digits', () => {
				expect(argMate(['-🍀5', '-a☺️7'])).toEqual({'🍀': 5, a: true, '☺️': 7, _: []});
			});

			test('Emoji short flag as count', () => {
				expect(argMate(['-🍀🍀🍀'], {'🍀': {type: 'count'}})).toEqual({'🍀': 3, _: []});
			});

			test('Negated emoji flag', () => {
				expect(argMate(['--no-🤖'], {'🤖': true})).toEqual({'🤖': false, _: []});
			});
		});
}
