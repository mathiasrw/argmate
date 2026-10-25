// #7a: `argInfo()`: help text for the command line
// `argInfo(infoConfig, parameterConfig)` gives a table with one row for each parameter: the short flag, the long
// flags, and the description with the tags. The `intro` of the config is before the table, the `outro` is after it.
import {beforeEach, describe, expect, test} from 'bun:test';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {argInfo, argInfoMini, argMate, argMateMini, root} from '../../helper.ts';

const config = () => ({
	version: {alias: 'v', describe: 'Print the version'},
	steps: {type: 'int', alias: ['l', 'loops'], describe: 'How many times to run'},
	port: {type: 'int', default: 8080, describe: 'Where the server listens'},
	engine: {valid: ['V8', 'RE2'], describe: 'The regex engine'},
});

const names = ['version', 'steps', 'port', 'engine'];

const introOutro = () => ({intro: 'mytool runs a thing', outro: 'See the docs for more'});

const long =
	'Set the size of each search step so that slow searches stop sooner and the status shows some progress on the screen for each file';

// The help for a config that was not parsed: the config is the second argument of `argInfo()`
const help = (conf = config(), infoConfig = {}) => argInfo(infoConfig, conf);

// The first line of each row of the table: the lines that start with a flag
const rows = text => text.split('\n').filter(line => /^\s*-/.test(line));

// The first line of the row that has the description. '' when there is no such row.
const row = (text, description) => rows(text).find(line => line.includes(description)) || '';

const tooLong = (text, width) => text.split('\n').filter(line => line.length > width);

// `argInfo()` keeps the config of the last parse. A parse with an empty config removes it.
// Thus no test depends on the tests before it.
beforeEach(() => {
	argMate([], {}, {});
	argMateMini([], {}, {});
});

describe('#7a argInfo(): help text for the command line', () => {
	describe('one row for each parameter', () => {
		test('a row has the short flag, the long flag and the description', () => {
			expect(help()).toMatch(/^\s*-v\s+--version\s+Print the version/m);
		});

		test('an alias of one character gets one dash, a longer alias gets two dashes', () => {
			const [flags] = row(help(), 'How many times to run').split('How many times to run');
			expect(flags.trim().split(/,?\s+/).sort()).toEqual(['--loops', '--steps', '-l']);
		});

		test('the row has the type', () => {
			expect(help()).toMatch(/--steps\b.*\bint\b/);
		});

		test('the row has the valid values', () => {
			expect(help()).toMatch(/--engine\b.*\bV8\b.*\bRE2\b/);
		});

		test('the default value comes after the description', () => {
			expect(help()).toMatch(/--port\b.*Where the server listens.*\b8080\b/);
		});

		test('a parameter with no description has a row', () => {
			expect(help({quiet: {alias: 'q'}})).toMatch(/^\s*-q\s+--quiet\b/m);
		});

		test('a camelCase parameter has one row, with its kebab-case flag', () => {
			const text = help({dryRun: {describe: 'Change no files'}});
			expect(rows(text)).toHaveLength(1);
			expect(text).toMatch(/--dry-run\b.*Change no files/);
		});

		test.todo('a parameter that is only a default value has a row with that value', () => {
			expect(help({bar: 42})).toMatch(/^\s*--bar\b.*\b42\b/m);
		});

		test.todo('a parameter with a `valid` function has a row, without its code', () => {
			const text = help({steps: {type: 'int', valid: v => v > 0}});
			expect(text).toMatch(/--steps\b.*\bint\b/);
			expect(text).not.toContain('=>');
		});

		// docs/argInfo.md: "Short flags (single character) are separated from long flags"
		test.todo('a long flag with no short flag is in the column of the long flags', () => {
			const column = row(help(), 'Print the version').indexOf('--version');
			expect(column).toBeGreaterThan(0);
			expect(row(help(), 'Where the server listens').indexOf('--port')).toBe(column);
		});
	});

	describe('each parameter one time', () => {
		test('a config that was not parsed gives one row for each parameter', () => {
			expect(rows(help())).toHaveLength(4);
		});

		test('a config that was parsed gives one row for each parameter', () => {
			argMate([], config());
			expect(rows(argInfo())).toHaveLength(4);
		});
	});

	describe('intro and outro', () => {
		test('the intro of the config is before the table and the outro is after it', () => {
			expect(help({...introOutro(), ...config()})).toMatch(
				/mytool runs a thing[\s\S]*--version[\s\S]*See the docs for more/
			);
		});

		test('the lines of an intro keep their order', () => {
			const intro = ['First line of the intro', 'Second line of the intro'];
			expect(help({intro, ...config()})).toMatch(
				/First line of the intro[\s\S]*Second line of the intro[\s\S]*--version/
			);
		});

		test('`showIntro: false` leaves out the intro', () => {
			const conf = {...introOutro(), ...config()};
			expect(help(conf, {showIntro: false})).not.toContain('mytool runs a thing');
		});

		test('`showOutro: false` leaves out the outro', () => {
			const conf = {...introOutro(), ...config()};
			expect(help(conf, {showOutro: false})).not.toContain('See the docs for more');
		});

		// The parse reads `intro: 'text'` as a parameter with the name `intro` and the default value 'text'
		test.todo('the intro and the outro of the config are not parameters of the parse', () => {
			expect(argMate([], {...introOutro(), ...config()})).toEqual(argMate([], config()));
		});
	});

	describe('usage text and examples', () => {
		// The usage text and the examples are the properties `usage` and `examples` of the config,
		// next to `intro` and `outro`
		const conf = () => ({
			usage: 'mytool [options] <file>',
			examples: [
				['mytool --steps 3 a.txt', 'Run three times'],
				['mytool -v', 'Show the version number'],
			],
			...config(),
		});

		test.todo('the usage text is in the help', () => {
			expect(help(conf())).toContain('mytool [options] <file>');
		});

		// Assumption: a `[command, description]` pair is one row, thus the two are on one line when the width permits
		test.todo('an example has its command and its description on one line', () => {
			expect(help(conf())).toMatch(/mytool -v\b.*Show the version number/);
		});

		test('a `[command, description]` pair in the intro is one line', () => {
			const intro = ['Examples:', ['mytool -v', 'Show the version number']];
			expect(help({intro, ...config()})).toMatch(/^\s*mytool -v\s+Show the version number\s*$/m);
		});
	});

	describe('columns and long lines', () => {
		const wide = () => ({engine: {alias: 'E', type: 'string', default: 'V8', describe: long}});

		test('the descriptions start in the same column', () => {
			const text = help();
			const descriptions = Object.values(config()).map(param => param.describe);
			const columns = descriptions.map(description => row(text, description).indexOf(description));
			expect(columns[0]).toBeGreaterThan(0);
			expect(columns).toEqual(Array(4).fill(columns[0]));
		});

		// A line that fills its column keeps the space after its last word, thus it is one character too long
		test.todo('no line is longer than `width`', () => {
			expect(tooLong(help(wide(), {width: 60}), 60)).toEqual([]);
		});

		test('with no `width`, no line is longer than 100 characters', () => {
			expect(tooLong(help(wide()), 100)).toEqual([]);
		});

		test('a long description is broken into lines and keeps all its words', () => {
			const text = help(wide(), {width: 60});
			expect(text).not.toContain(long);
			expect(text.split(/\s+/)).toEqual(expect.arrayContaining(long.split(' ')));
		});

		test.todo('the long flags stay on one line when the table is wider than `width`', () => {
			expect(help(config(), {width: 60})).toContain('--loops, --steps');
		});

		// The loop in `minimizeLineBreaks` does not end when each column has its minimum width.
		// A new process with a time limit makes the help, thus the test run does not hang.
		test.todo('a small `width` gives the help and does not hang', () => {
			const code = `import('${path.join(root, 'src/argMate.ts')}').then(m => console.log(m.argInfo({width: 30}, ${JSON.stringify(config())})))`;
			const result = spawnSync('bun', ['-e', code], {encoding: 'utf8', timeout: 2000});
			expect(result.status).toBe(0);
		}, 5000);

		// Assumption: `width` is the limit for all the output (README: "Max character limit for the output width")
		test.todo('a long intro is broken at `width` also', () => {
			expect(tooLong(help({intro: long, ...config()}, {width: 60}), 60)).toEqual([]);
		});
	});

	describe('a config as argument', () => {
		test.todo('replaces the config of the last parse', () => {
			argMate([], {other: {describe: 'A parameter of a different program'}});
			expect(help()).not.toContain('A parameter of a different program');
		});

		test('`argInfo()` does not change the config that it gets', () => {
			const conf = config();
			help(conf);
			expect(conf).toEqual(config());
		});

		test.todo('the README shows `argInfo()` with the config as second argument', () => {
			const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
			// For example `argInfo(infoConfig, config)` or `argInfo({}, config)`
			expect(readme.match(/argInfo\([^()]*\)/g)).toContainEqual(
				expect.stringMatching(/^argInfo\(\s*(\w+|\{[^{}]*\})\s*,\s*\w+\s*\)$/)
			);
		});
	});

	describe("format: 'json'", () => {
		const json = conf => argInfo({format: 'json'}, conf);

		test('each parameter is one time in `params`', () => {
			expect(Object.keys(json(config()).params)).toEqual(names);
		});

		test('the intro and the outro are properties of the result', () => {
			expect(json(introOutro())).toEqual({...introOutro(), params: {}});
		});
	});

	describe('the mini entry point', () => {
		test('gives the same help as the full entry point', () => {
			expect(argInfoMini({}, config())).toBe(help());
		});
	});
});
