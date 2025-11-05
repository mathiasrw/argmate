// https://bun.sh/docs/test/writing

import {expect, test, describe} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import argMate from '../../src/argMate.js';
import argMateLite from '../../src/argMateLite.js';

run(argMate);
run(argMateLite, ' lite');

function run(argMate: ArgMateEngine, engineType = '') {
	if (!engineType)
		describe('Emojis' + engineType, () => {
			test('Single emoji flag', () => {
				expect(argMate(['-🍀'])).toEqual({'🍀': true, _: []});
			});

			test('Multiple emoji flag', () => {
				expect(argMate(['--🍀🍀', '-🍀'])).toEqual({'🍀🍀': true, '🍀': true, _: []});
			});
		});
}
