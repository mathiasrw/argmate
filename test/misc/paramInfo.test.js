// https://bun.sh/docs/test/writing

// @ts-ignore
import {describe, expect, test} from 'bun:test';

import argMate, {argInfo} from '../../src/argMate.js';
import argMateMini, {argInfo as argInfoMini} from '../../src/argMateMini.js';

run(argMate, argInfo);
run(argMateMini, argInfoMini, ' Mini');

let help;

function run(argMate, argInfo, engineType = '') {
	describe('argInfo' + engineType, () => {
		test('shows someting', () => {
			argMate('--foo bar --foo2 bar2'.split(' '), {
				foo: {type: 'string'},
				foo2: {type: 'string'},
			});
			const help = argInfo();

			expect(help).toMatch(/foo2/);
		});

		test('Mention param info', () => {
			argMate('--foo'.split(' '), {bar: 42});
			const help = argInfo();

			expect(help).toMatch(/bar/);
			expect(help).toMatch(/42/);
		});

		test('Intro + outro', () => {
			argMate(
				'--foo bar --foo2 bar2'.split(' '),
				{},
				{
					intro: 'This is the first line',
					outro: 'That was amazing - thank you!',
				}
			);
			help = argInfo();
			expect(help).toMatch(/first line/);
			expect(help).toMatch(/thank you/);
		});

		test.todo('Config details', () => {
			// Alias, type, mandatory, default, conflict,
		});

		test.todo('Settings details', () => {
			//
		});
	});
}
