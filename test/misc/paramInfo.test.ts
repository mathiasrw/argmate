// https://bun.sh/docs/test/writing

// @ts-expect-error
import {describe, expect, test} from 'bun:test';

import {argInfo, argMate} from '../helper.ts';
import {argInfoMini, argMateMini} from '../helper.ts';

run(argMate, argInfo);
run(argMateMini, argInfoMini, ' Mini');

let help: unknown;

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
			argMate('--foo'.split(' '), {bar: {type: 'number', default: 42}});
			const help = argInfo();

			expect(help).toMatch(/bar/);
			expect(help).toMatch(/42/);
		});

		test('Intro + outro', () => {
			argMate(
				'--foo bar --foo2 bar2'.split(' '),
				{
					intro: 'This is the first line',
					outro: 'That was amazing - thank you!',
				},
				{}
			);
			help = argInfo();
			expect(help).toMatch(/first line/);
			expect(help).toMatch(/thank you/);
		});
	});
}
