// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate, {argInfo} from '../src/argMate.ts';
import argMateLite, {argInfo as argInfoLite} from '../src/argMateLite.ts';

run(argMate, argInfo);
run(argMateLite, argInfoLite, ' lite');

let help;

function run(argMate, argInfo, type = '') {
	describe('argInfo' + type, () => {
		test('shows someting', () => {
			argMate('--foo bar --foo2 bar2'.split(' '));
			let help = argInfo();

			expect(help).toMatch(/params/);
		});

		test('Mention param info', () => {
			argMate('--foo'.split(' '), {bar: 42});
			let help = argInfo();

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

		test.todo('Param details', () => {
			// Alias, type, mandatory, default, conflict,
		});

		test.todo('Conf details', () => {
			//
		});
	});
}
