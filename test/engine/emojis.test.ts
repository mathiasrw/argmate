// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import argMate from '../../src/argMate.js';
import argMateMini from '../../src/argMateMini.js';

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
		});
}
