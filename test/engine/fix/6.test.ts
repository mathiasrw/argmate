// #6: Print the help when there is an error
// No new setting is necessary: the `error` function can print the message, the help from `argInfo()`, or the two.
// `argInfo()` gives the help text for the command line (issue 7a). The README does not show the example yet.
import {describe, expect, test} from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import * as helper from '../../helper.ts';

// `argMate` and `argInfo` must come from the same entry point: each built bundle keeps its own last config
const full = {argMate: helper.argMate, argInfo: helper.argInfo};
const mini = {argMate: helper.argMateMini, argInfo: helper.argInfoMini};

const config = () => ({
	steps: {type: 'int', alias: 's', mandatory: true, describe: 'How many times to run'},
	version: {alias: 'v', describe: 'Print the version'},
});

const exit = new Error('process.exit');

// A program with the `error` function of the issue. `console` and `process` are stand-ins here: they keep the
// text that the program prints and its exit code. `process.exit` stops the parse with a throw, not the test run.
// `introOutro` is the `intro` and the `outro` of the program: they are properties of the config.
function program(args, {argMate, argInfo} = full, introOutro = {}) {
	const printed = {error: [], log: [], exit: undefined, argv: undefined};
	const console = {error: text => printed.error.push(text), log: text => printed.log.push(text)};
	const process = {
		exit: code => {
			printed.exit = code;
			throw exit;
		},
	};
	try {
		printed.argv = argMate(
			args,
			{...introOutro, ...config()},
			{
				allowUnknown: false,
				error: msg => {
					console.error(msg);
					console.log(argInfo());
					process.exit(1);
				},
			}
		);
	} catch (err) {
		if (err !== exit) throw err;
	}
	return printed;
}

const inputErrors = {
	'an unknown parameter': ['--steps', '3', '--bogus'],
	'a mandatory parameter that is not given': ['--version'],
	'a value of the wrong type': ['--steps', 'many'],
	'a parameter with no value': ['--steps'],
};

describe('#6 Print the help when there is an error', () => {
	describe('the `error` function prints the message', () => {
		for (const [name, args] of Object.entries(inputErrors)) {
			test(`${name} gives one message and the exit code 1`, () => {
				const {error, exit, argv} = program(args);
				expect(error).toHaveLength(1);
				expect(exit).toBe(1);
				expect(argv).toBeUndefined();
			});
		}

		test('the message tells what is wrong with the input', () => {
			expect(String(program(['--bogus']).error[0])).toContain('bogus');
		});

		test('input with no error prints nothing', () => {
			expect(program(['--steps', '3'])).toEqual({
				error: [],
				log: [],
				exit: undefined,
				argv: {_: [], steps: 3},
			});
		});
	});

	describe('the `error` function prints the help', () => {
		test('`argInfo()` in the `error` function gives one row for each parameter', () => {
			const {log} = program(['--bogus']);
			expect(log).toHaveLength(1);
			expect(log[0].split('\n').filter(line => /^\s*-/.test(line))).toEqual([
				expect.stringMatching(/-s\s+--steps\s+How many times to run/),
				expect.stringMatching(/-v\s+--version\s+Print the version/),
			]);
		});

		test('the help has the intro and the outro of the failing parse', () => {
			const introOutro = {intro: 'mytool runs a thing', outro: 'See the docs for more'};
			const [help = ''] = program(['--bogus'], full, introOutro).log;
			expect(help).toMatch(/mytool runs a thing[\s\S]*--steps[\s\S]*See the docs for more/);
		});

		test('the help does not show the config of a parse before it', () => {
			full.argMate([], {intro: 'Old', other: {describe: 'A parameter of a different program'}});
			const [help = ''] = program(['--bogus']).log;
			expect(help).not.toContain('A parameter of a different program');
			expect(help).not.toContain('Old');
		});

		test('the mini entry point gives the help text also', () => {
			const [help = ''] = program(['--bogus'], mini).log;
			expect(help).toMatch(/^\s*-s\s+--steps\s+How many times to run/m);
		});
	});

	describe('the README', () => {
		test.todo('has the example: an `error` function that prints the message and the help', () => {
			const readme = fs.readFileSync(path.join(helper.root, 'README.md'), 'utf8');
			expect(readme.match(/error:\s*msg\s*=>\s*\{[^}]*\}/g)).toContainEqual(
				expect.stringMatching(
					/console\.error\(.*msg\);\s*console\.log\(argInfo\(\)\);\s*process\.exit\(1\);/
				)
			);
		});
	});
});
