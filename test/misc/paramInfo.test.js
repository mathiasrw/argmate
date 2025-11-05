// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate, {argInfo} from '../../src/argMate';
import argMateLite, {argInfo as argInfoLite} from '../../src/argMateLite';

run(argMate, argInfo);
run(argMateLite, argInfoLite, ' lite');

let help;

function run(argMate, argInfo, engineType = '') {
	describe('argInfo' + engineType, () => {
		test('shows someting', () => {
			argMate('--foo bar --foo2 bar2'.split(' '), {
				foo: {type: 'string'},
				foo2: {type: 'string'},
			});
			let help = argInfo();
			console.log(help);
			expect(help).toMatch(/foo2/);
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

		test.todo('Config details', () => {
			// Alias, type, mandatory, default, conflict,
		});

		test.todo('Settings details', () => {
			//
		});
	});
}
