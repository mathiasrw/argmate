// #7b: `argInfo()`: markdown format
// `argInfo({format: 'markdown', config})` gives a markdown table with one row for each parameter (the flags,
// the description and the tags), with the `intro` of the config before the table and the `outro` after it.
import {beforeEach, describe, expect, test} from 'bun:test';
import {argInfo, argInfoMini, argMate, argMateMini, configPreprocessing} from '../../helper.ts';

const config = () => ({
	version: {alias: 'v', describe: 'Print the version'},
	steps: {type: 'int', alias: ['l', 'loops'], describe: 'How many times to run'},
	port: {type: 'int', default: 8080, describe: 'Where the server listens'},
	engine: {valid: ['V8', 'RE2'], describe: 'The regex engine'},
});

const long =
	'Set the size of each search step so that slow searches stop sooner and the status shows some progress on the screen for each file';

// The markdown for a config that was not parsed: the config is in the options of `argInfo()`
const markdown = (conf = config(), options = {}) =>
	argInfo({format: 'markdown', ...options, config: conf});

// The cells of a table line. The `|` at the start and at the end of the line are optional in markdown,
// and `\|` is a `|` in the text of a cell.
const cells = line =>
	line
		.trim()
		.replace(/^\||\|$/g, '')
		.split(/(?<!\\)\|/)
		.map(cell => cell.trim());

// The lines of the table: the lines that have a `|`. Line 0 is the header row, line 1 is the separator row.
const lines = text => text.split('\n').filter(line => line.includes('|'));

// The cells of each row of a parameter: the lines of the table after the separator row
const body = text => lines(text).slice(2).map(cells);

// The table line of the parameter that has the flag. '' when there is no such line.
const row = (text, flag) => lines(text).find(line => line.includes(flag)) || '';

// `argInfo()` keeps the config of the last parse. A parse with an empty config removes it.
// So no test depends on the tests before it.
beforeEach(() => {
	argMate([], {}, {});
	argMateMini([], {}, {});
});

describe('#7b argInfo(): markdown format', () => {
	describe('a markdown table', () => {
		test('the separator row comes after the header row, with one cell for each header cell', () => {
			const [header, separator] = lines(markdown()).map(cells);
			expect(header.length).toBeGreaterThan(1);
			expect(separator).toEqual(header.map(() => expect.stringMatching(/^:?-+:?$/)));
		});

		test('one row for each parameter comes after the separator row', () => {
			expect(lines(markdown()).slice(2)).toEqual([
				expect.stringContaining('--version'),
				expect.stringContaining('--steps'),
				expect.stringContaining('--port'),
				expect.stringContaining('--engine'),
			]);
		});

		// The tag of a `valid` list is `[V8, RE2]`, with no `|` that starts a new cell
		test('each row has one cell for each header cell', () => {
			const [header] = lines(markdown()).map(cells);
			expect(body(markdown()).map(row => row.length)).toEqual(Array(4).fill(header.length));
		});
	});

	describe('the row of a parameter', () => {
		test('has the name and all the aliases', () => {
			const flags = row(markdown(), '--steps').match(/(?<![\w-])--?\w[\w-]*/g);
			expect(flags.sort()).toEqual(['--loops', '--steps', '-l']);
		});

		test('has the description', () => {
			expect(row(markdown(), '--port')).toContain('Where the server listens');
		});

		test('has the type', () => {
			expect(row(markdown(), '--steps')).toMatch(/\bint\b/);
		});

		test('has the default value', () => {
			expect(row(markdown(), '--port')).toMatch(/\b8080\b/);
		});

		test('has the valid values', () => {
			expect(row(markdown(), '--engine')).toMatch(/\bV8\b.*\bRE2\b/);
		});
	});

	describe('a row is one line of markdown', () => {
		test('a long description is not broken at `width`', () => {
			const text = markdown({step: {type: 'int', describe: long}}, {width: 40});
			expect(row(text, '--step')).toContain(long);
		});

		test('a line break in a description does not start a new row', () => {
			const text = markdown({step: {type: 'int', describe: 'First part\nSecond part'}});
			expect(body(text)).toHaveLength(1);
			expect(row(text, '--step')).toMatch(/First part.*Second part/);
		});

		test('a `|` in a description does not start a new cell', () => {
			const text = markdown({mode: {type: 'string', describe: 'Use fast|slow search'}});
			const [header] = lines(text).map(cells);
			expect(body(text).map(row => row.length)).toEqual([header.length]);
		});
	});

	describe('intro and outro', () => {
		// The numbers of the lines that have the intro, the first and the last line of the table, and the outro
		const where = () => {
			const text = {intro: 'mytool runs a thing', outro: 'See the docs for more'};
			const all = markdown({...text, ...config()}).split('\n');
			return {
				all,
				intro: all.findIndex(line => line.includes('mytool runs a thing')),
				first: all.findIndex(line => line.includes('|')),
				last: all.findLastIndex(line => line.includes('|')),
				outro: all.findIndex(line => line.includes('See the docs for more')),
			};
		};

		test('the intro of the config is before the table and the outro is after it', () => {
			const {intro, first, last, outro} = where();
			expect(intro).toBeGreaterThanOrEqual(0);
			expect(first).toBeGreaterThan(intro);
			expect(outro).toBeGreaterThan(last);
		});

		// Markdown: some parsers read a table only when an empty line is above it
		test('an empty line is between the intro and the table', () => {
			const {all, intro, first} = where();
			expect(first).toBeGreaterThan(intro + 1);
			expect(all[first - 1].trim()).toBe('');
		});

		// Markdown: a line of text directly below a table row becomes a row of the table
		test('an empty line is between the table and the outro', () => {
			const {all, last, outro} = where();
			expect(outro).toBeGreaterThan(last + 1);
			expect(all[last + 1].trim()).toBe('');
		});
	});

	describe('the mini entry point', () => {
		test('gives the same markdown as the full entry point', () => {
			expect(argInfoMini({format: 'markdown', config: config()})).toBe(markdown());
		});
	});
});
