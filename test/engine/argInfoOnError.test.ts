// `argInfoOnError: true`: the message of an input error has the help for its parameters below it
import {describe, expect, test} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import {argMate, argMateMini} from '../helper.ts';

const config = () => ({
	intro: 'Usage: mytool [options]',
	file: {alias: 'f', type: 'string', description: 'The SQL file to run'},
	stdin: {description: 'Read the SQL from stdin', conflict: 'file'},
	out: {alias: 'o', type: 'string', description: 'Where the result goes'},
});

// The message of the error that is thrown
function message(argMate: ArgMateEngine, args: string[], settings: any = {argInfoOnError: true}) {
	try {
		argMate(args, config(), settings);
	} catch (e: any) {
		return e.message;
	}
}

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('argInfoOnError' + engineType, () => {
		test('the help for the parameter is below the message', () => {
			expect(message(argMate, ['--out'])).toBe(
				"No data provided for 'out'\n\nOptions:\n  -o  --out   Where the result goes [string]"
			);
		});

		test('the error object of the callback has the help in its message', () => {
			let got = '';
			argMate(['--out'], config(), {argInfoOnError: true, error: e => (got = e.message)});
			expect(got).toBe(
				"No data provided for 'out'\n\nOptions:\n  -o  --out   Where the result goes [string]"
			);
		});

		test('a name that is not in the config has no help', () => {
			expect(message(argMate, ['--bogus'], {argInfoOnError: true, allowUnknown: false})).toBe(
				"Unknown parameter 'bogus' not allowed"
			);
		});

		test('there is no help without the setting', () => {
			expect(message(argMate, ['--out'], {})).toBe("No data provided for 'out'");
		});
	});
}

describe('argInfoOnError with two parameters', () => {
	test('a conflict has the help for both', () => {
		expect(message(argMate, ['-f', 'a.sql', '--stdin'])).toBe(
			"The parameter '--stdin' conflicts with '-f'\n\nOptions:\n" +
				'  -f  --file    The SQL file to run [string]\n' +
				'      --stdin   Read the SQL from stdin [boolean]'
		);
	});

	test('a name that is not in the config has its "Did you mean" as the help', () => {
		expect(message(argMate, ['-file', 'a.sql'])).toBe(
			"Unknown parameter '-i' in '-file'\n\nDid you mean '--file'?"
		);
	});

	test('an error with no parameter has no help, not the help for all', () => {
		expect(
			message(argMate, ['-f', 'a.sql'], {argInfoOnError: true, crossValidate: () => 'Not today'})
		).toBe('Not today');
	});
});
