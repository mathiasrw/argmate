// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate, {helpText} from '../src/argMate.ts';

describe('helpText', () => {
	test('shows someting', () => {
		argMate('--foo bar --foo2 bar2'.split(' '));
		let help = helpText();

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
		let help = helpText();

		expect(help).toMatch(/first line/);
		expect(help).toMatch(/thank you/);
	});
});
