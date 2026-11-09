// #7a: `argInfo()`: help text for the command line
// `argInfo({config})` gives a table with one row for each parameter: the short flag, the long
// flags, and the description with the tags. The `intro` of the config is before the table, the `outro` is after it.
import {beforeEach, describe, expect, test} from 'bun:test';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {argInfo, argInfoMini, argInfoStandalone, argMate, argMateMini, root} from '../../helper.ts';

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

// The help for a config that was not parsed: the config is in the options of `argInfo()`
const help = (conf = config(), options = {}) => argInfo({...options, config: conf});

// The first line of each row of the table: the lines that start with a flag
const rows = text => text.split('\n').filter(line => /^\s*-/.test(line));

// The first line of the row that has the description. '' when there is no such row.
const row = (text, description) => rows(text).find(line => line.includes(description)) || '';

const tooLong = (text, width) => text.split('\n').filter(line => line.length > width);

// `argInfo()` keeps the config of the last parse. A parse with an empty config removes it.
// So no test depends on the tests before it.
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

		test('a parameter that is only a default value has a row with that value', () => {
			expect(help({bar: 42})).toMatch(/^\s*--bar\b.*\b42\b/m);
		});

		test('a parameter with a `valid` function has a row, without its code', () => {
			const text = help({steps: {type: 'int', validate: v => v > 0}});
			expect(text).toMatch(/--steps\b.*\bint\b/);
			expect(text).not.toContain('=>');
		});

		// README, Help text: "A parameter with no one-character name has an empty short column"
		test('a long flag with no short flag is in the column of the long flags', () => {
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
		test('the intro and the outro of the config are not parameters of the parse', () => {
			expect(argMate([], {...introOutro(), ...config()})).toEqual(argMate([], config()));
		});
	});

	describe('usage text and examples', () => {
		// The usage and the examples are sections of the intro: a heading, then lines and rows
		const conf = () => ({
			intro: [
				['Usage', 'mytool [options] <file>'],
				[
					'Examples',
					['mytool --steps 3 a.txt', 'Run three times'],
					['mytool -v', 'Show the version number'],
				],
			],
			...config(),
		});

		test('the heading of a section has a colon and its lines are indented', () => {
			expect(help(conf())).toContain('Usage:\n  mytool [options] <file>\n');
		});

		test('an example has its command and its description on one line', () => {
			expect(help(conf())).toMatch(/^\s*mytool -v\s+Show the version number\s*$/m);
		});

		test('the descriptions of the examples start in the same column', () => {
			const lines = help(conf()).split('\n');
			const column = (text: string) => lines.find(line => line.includes(text))?.indexOf(text);
			expect(column('Run three times')).toBe(column('Show the version number'));
		});

		test('`$0` is the name of the running script', () => {
			const text = help({intro: [['Usage', '$0 <file>']]});
			expect(text).toContain('  ' + path.basename(process.argv[1]) + ' <file>');
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

		// A line that fills its column keeps the space after its last word, so it is one character too long
		test('no line is longer than `width`', () => {
			expect(tooLong(help(wide(), {width: 60}), 60)).toEqual([]);
		});

		test('with no `width`, no line is longer than the terminal or 120 characters', () => {
			const width = Math.min(120, process.stdout.columns || 120);
			expect(tooLong(help(wide()), width)).toEqual([]);
		});

		test('with no `width` and no terminal, the help is 120 characters wide', () => {
			const code = `import('${path.join(root, 'src/argMate.ts')}').then(m => console.log(m.argInfo({config: {engine: {describe: '${long} ${long}'}}})))`;
			const result = spawnSync('bun', ['-e', code], {encoding: 'utf8', timeout: 2000});
			const lengths = result.stdout.split('\n').map(line => line.length);
			expect(Math.max(...lengths)).toBeLessThanOrEqual(120);
			expect(Math.max(...lengths)).toBeGreaterThan(110);
		}, 5000);

		test('a long description is broken into lines and keeps all its words', () => {
			const text = help(wide(), {width: 60});
			expect(text).not.toContain(long);
			expect(text.split(/\s+/)).toEqual(expect.arrayContaining(long.split(' ')));
		});

		test('the long flags stay on one line when the table is wider than `width`', () => {
			expect(help(config(), {width: 60})).toContain('--steps, --loops');
		});

		// The old layout had a loop that did not end when each column had its minimum width.
		// A new process with a time limit makes the help, so the test run does not hang.
		test('a small `width` gives the help and does not hang', () => {
			const code = `import('${path.join(root, 'src/argMate.ts')}').then(m => console.log(m.argInfo({width: 30, config: ${JSON.stringify(config())}})))`;
			const result = spawnSync('bun', ['-e', code], {encoding: 'utf8', timeout: 2000});
			expect(result.status).toBe(0);
		}, 5000);

		// Assumption: `width` is the limit for all the output (README: "Max character limit for the output width")
		test('a long intro is broken at `width` also', () => {
			expect(tooLong(help({intro: long, ...config()}, {width: 60}), 60)).toEqual([]);
		});
	});

	describe('the layout', () => {
		const flags = () => ({
			verbose: {alias: 'V', description: 'More chatty output'},
			output: {type: 'string', alias: 'o', default: 'out.txt', description: 'Where to write'},
		});

		test('a column with no text takes no room', () => {
			expect(help({port: {type: 'int', describe: 'Where the server listens'}})).toContain(
				'\n  --port   Where the server listens [int]'
			);
		});

		test('the valid values are followed by the default, which is the first value when none is given', () => {
			const valid = [
				['V8', 'v8', ['js']],
				['RE2', 're2'],
			];
			expect(help({engine: {valid}})).toContain('[V8/v8, RE2/re2] =V8');
			expect(help({engine: {valid, default: 'RE2'}})).toContain('[V8/v8, RE2/re2] =RE2');
		});

		test('a description that does not fit beside the flags goes below them, with an empty line between rows', () => {
			expect(help(flags(), {width: 30})).toBe(
				[
					'Options:',
					'  -V  --verbose',
					'        More chatty output',
					'        [boolean]',
					'',
					'  -o  --output',
					'        Where to write',
					'        [string=out.txt]',
					'',
				].join('\n')
			);
		});

		// The last column at width 48 is 30 wide, the narrowest that stays beside the flags
		test('a description that fits beside the flags wraps in its column', () => {
			expect(help(flags(), {width: 48})).toBe(
				[
					'Options:',
					'  -V  --verbose   More chatty output [boolean]',
					'  -o  --output    Where to write',
					'                  [string=out.txt]',
					'',
				].join('\n')
			);
		});

		test('a column narrower than 30 goes below the flags, also when each word fits in it', () => {
			expect(help(flags(), {width: 47})).toBe(
				[
					'Options:',
					'  -V  --verbose',
					'        More chatty output [boolean]',
					'',
					'  -o  --output',
					'        Where to write [string=out.txt]',
					'',
				].join('\n')
			);
		});

		test('`minColumnWidth` sets the narrowest last column that stays beside the flags', () => {
			expect(help(flags(), {width: 47, minColumnWidth: 20})).toBe(
				[
					'Options:',
					'  -V  --verbose   More chatty output [boolean]',
					'  -o  --output    Where to write',
					'                  [string=out.txt]',
					'',
				].join('\n')
			);
		});

		test('only the row with a word that does not fit goes below the flags', () => {
			const conf = {
				verbose: {alias: 'V', description: 'More chatty output'},
				docs: {
					type: 'string',
					describe: 'Docs at https://github.com/AlaSQL/alasql/wiki/AlaSQL-CLI',
				},
				quiet: {alias: 'q', description: 'Less output'},
			};
			expect(help(conf, {width: 60})).toBe(
				[
					'Options:',
					'  -V  --verbose   More chatty output [boolean]',
					'',
					'      --docs',
					'        Docs at',
					'        https://github.com/AlaSQL/alasql/wiki/AlaSQL-CLI',
					'        [string]',
					'',
					'  -q  --quiet     Less output [boolean]',
					'',
				].join('\n')
			);
		});
	});

	describe('the engine settings', () => {
		test('`autoCamelKebabCase: false` keeps a camelCase name', () => {
			const text = argInfo({
				config: {dryRun: {describe: 'Change no files'}},
				settings: {autoCamelKebabCase: false},
			});
			expect(text).toMatch(/--dryRun\b.*Change no files/);
		});

		test('the settings of the last parse are used when none are given', () => {
			argMate([], {dryRun: {describe: 'Change no files'}}, {autoCamelKebabCase: false});
			expect(argInfo()).toMatch(/--dryRun\b/);
		});
	});

	describe('a config as argument', () => {
		test('replaces the config of the last parse', () => {
			argMate([], {other: {describe: 'A parameter of a different program'}});
			expect(help()).not.toContain('A parameter of a different program');
		});

		test('`argInfo()` does not change the config that it gets', () => {
			const conf = config();
			help(conf);
			expect(conf).toEqual(config());
		});

		test('the README shows `argInfo()` with the config in its options', () => {
			const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
			// For example `argInfo({config})` or `argInfo({config, format: 'markdown'})`
			expect(readme.match(/argInfo\([^()]*\)/g)).toContainEqual(
				expect.stringMatching(/^argInfo\(\{\s*config\b[^{}]*\}\)$/)
			);
		});
	});

	describe('include and exclude', () => {
		const tool = () => ({
			intro: 'MyTool 1.2: does the thing.',
			outro: 'More: https://example.com',
			verbose: {alias: 'V', description: 'More chatty output'},
			steps: {type: 'int', alias: ['l', 'loops'], description: 'How many times to run'},
			output: {type: 'string', alias: 'o', default: 'out.txt', description: 'Where to write'},
			dryRun: {description: 'Change no files'},
			help: {alias: 'h', description: 'Show the help'},
		});
		// The long names of the options table, in order
		const shownFor = (options: object, conf = tool()) =>
			(argInfo({...options, config: conf}) as string).match(/(?<=^\s*(-\w\s+)?)--[\w-]+/gm) || [];

		test('`include` takes the words of a command line, and `intro` and `outro` replace the ones of the config', () => {
			expect(
				argInfo({
					config: tool(),
					include: ['-V', 'foo', 'bar', '--output=x.md', '-h'],
					exclude: ['-h'],
					intro: 'Help for the options you gave:',
					outro: 'All the options: --help',
				})
			).toBe(
				[
					'Help for the options you gave:',
					'',
					'Options:',
					'  -V  --verbose   More chatty output [boolean]',
					'  -o  --output    Where to write [string=out.txt]',
					'',
					'All the options: --help',
					'',
				].join('\n')
			);
		});

		test('an empty `include` shows all the parameters', () => {
			expect(shownFor({include: []})).toEqual(shownFor({}));
			expect(shownFor({})).toHaveLength(5);
		});

		test('a short group names each of its flags', () => {
			expect(shownFor({include: ['-Vo', 'x.md']})).toEqual(['--verbose', '--output']);
		});

		test('an alias names its parameter', () => {
			expect(shownFor({include: ['--loops', '3']})).toEqual(['--steps']);
			expect(shownFor({include: ['-l3']})).toEqual(['--steps']);
		});

		test('the kebab-case form and the key name a parameter', () => {
			expect(shownFor({include: ['--dry-run']})).toEqual(['--dry-run']);
			expect(shownFor({include: ['--dryRun']})).toEqual(['--dry-run']);
		});

		test('`--no-` before a name names the parameter', () => {
			expect(shownFor({include: ['--no-verbose']})).toEqual(['--verbose']);
		});

		test('a parameter whose name starts with `no` is named by it, in each entry', () => {
			const options = {config: {noCache: {description: 'Read all again'}}, include: ['--no-cache']};
			expect(argInfo(options)).toContain('--no-cache');
			expect(argInfoMini(options)).toContain('--no-cache');
			expect(argInfoStandalone(options)).toContain('--no-cache');
		});

		test('one dash too few or too many still names the parameter', () => {
			expect(shownFor({include: ['-output', 'x.md']})).toEqual(['--output']);
			expect(shownFor({include: ['-output=x.md']})).toEqual(['--output']);
			expect(shownFor({include: ['--V']})).toEqual(['--verbose']);
			expect(shownFor({exclude: ['-help']})).toEqual([
				'--verbose',
				'--steps',
				'--output',
				'--dry-run',
			]);
		});

		test('a group that is not a long name is a group', () => {
			expect(shownFor({include: ['-Vh']})).toEqual(['--verbose', '--help']);
		});

		test('a value, an unknown name and a word after `--` name nothing', () => {
			expect(shownFor({include: ['-o', 'verbose', '--bogus', '--', '--help']})).toEqual([
				'--output',
			]);
		});

		test('`exclude` leaves out a parameter from all of them', () => {
			expect(shownFor({exclude: ['--help', '-V']})).toEqual(['--steps', '--output', '--dry-run']);
		});

		test('`exclude` wins over `include`', () => {
			expect(shownFor({include: ['-V', '-h'], exclude: ['--help']})).toEqual(['--verbose']);
		});

		test('with no parameter left there is no options table', () => {
			const text = argInfo({config: tool(), include: ['--bogus']});
			expect(text).toBe('MyTool 1.2: does the thing.\n\nMore: https://example.com\n');
		});

		test("with `format: 'json'`, `params` has only the parameters that are left", () => {
			const json = argInfo({config: tool(), format: 'json', include: ['-h'], showOutro: false});
			expect(json).toEqual({
				intro: 'MyTool 1.2: does the thing.',
				params: {help: {alias: 'h', description: 'Show the help'}},
			});
		});

		test("with `format: 'markdown'`, the table has only the parameters that are left", () => {
			const md = argInfo({
				config: tool(),
				format: 'markdown',
				include: ['-h'],
				showIntro: false,
				showOutro: false,
			});
			expect(md).toBe(
				[
					'## Options',
					'',
					'| Short | Long | Description |',
					'| --- | --- | --- |',
					'| `-h` | `--help` | Show the help [boolean] |',
					'',
				].join('\n')
			);
		});

		test('the words are read with no config, so the config of the program does not change them', () => {
			// With the config, `-o -h` would give the output `-h`. With no config, `-h` is a flag.
			expect(shownFor({include: ['-o', '-h']})).toEqual(['--output', '--help']);
		});

		test('the mini entry and the `argmate/info` entry give the same', () => {
			const options = {
				config: tool(),
				include: ['-Vo', 'x', '--no-dry-run', '--', '-h'],
				exclude: ['-o'],
			};
			expect(argInfoMini(options)).toBe(argInfo(options));
			expect(argInfoStandalone(options)).toBe(argInfo(options));
		});

		test('the last parse gives the config, so a filtered help needs no config after a parse', () => {
			argMate(['-V'], tool());
			expect(argInfo({include: ['-V']})).toContain('--verbose');
			expect(argInfo({include: ['-V']})).not.toContain('--output');
		});
	});

	describe("format: 'json'", () => {
		const json = conf => argInfo({format: 'json', config: conf});

		test('each parameter is one time in `params`', () => {
			expect(Object.keys(json(config()).params)).toEqual(names);
		});

		test('the intro and the outro are properties of the result', () => {
			expect(json(introOutro())).toEqual({...introOutro(), params: {}});
		});
	});

	describe('the mini entry point', () => {
		test('gives the same help as the full entry point', () => {
			expect(argInfoMini({config: config()})).toBe(help());
		});
	});
});
