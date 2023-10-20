// https://bun.sh/docs/test/writing

// @ts-ignore
import { expect, test, describe } from 'bun:test';

import argMate, { paramInfo } from '../src/argMate.ts';

describe.todo('paramInfo', () => {
	test('shows someting', () => {
		argMate('--foo bar --foo2 bar2'.split(' '));
		let help = paramInfo();

		expect(help).toMatch(/params/);
	});

	test('shows someting', () => {
		argMate(
			'--foo bar --foo2 bar2'.split(' '),
			{},
			{
				intro: 'This is the first line',
				outro: 'That was amazing - thank you!',
			}
		);
		let help = paramInfo();

		expect(help).toMatch(/first line/);
		expect(help).toMatch(/thank you/);
	});
});
