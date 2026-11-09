import type {ArgMateConfig, ArgMateEngineConfig, ArgMateInfoConfig, HelpText} from './types.js';
import {findType, re} from './common.js';
import {type Cell, table, wrap} from './formatArgInfo.js';

// An engine reads the words of `include` and `exclude`
export type Engine = (args: string[], config?: ArgMateEngineConfig) => unknown;

// An item of a section: a line, a row of cells, or a blank line (null)
type Item = string | Cell[] | null;
// A part of the help: a paragraph, or a section with a heading and items
type Block = string | {heading: string; items: Item[]; header?: string[]};

// The name of the running script, for `$0`
const script = () =>
	('undefined' !== typeof process && process.argv?.[1]?.split(/[\\/]/).pop()) || '';

// The text is arrays in arrays, and the depth gives the meaning: see "Help text" in the README
function blocks(text: HelpText | undefined, name: string): Block[] {
	// split and join, as a `$` in the name would be a pattern in the replacement of `replaceAll`
	const named = (part: unknown) => ('' + part).split('$0').join(name);
	if (undefined === text || null === text || '' === text) return [];
	if (!Array.isArray(text)) return [named(text)];
	return text.map(part => {
		if (!Array.isArray(part)) return named(part);
		const heading = 'string' === typeof part[0] && part[0] ? named(part[0]) : '';
		const items = (heading ? part.slice(1) : part).map((item): Item => {
			if (!Array.isArray(item)) return '' === item ? null : named(item);
			if (!item.length) return null;
			// A row with one string is a line
			if (1 === item.length && !Array.isArray(item[0])) return named(item[0]);
			return item.map(cell => (Array.isArray(cell) ? cell.map(named) : named(cell)));
		});
		return {heading, items};
	});
}

// A parameter that is only a default value is the same as `{default: value}`
const asParam = (value: unknown): any =>
	null !== value && 'object' === typeof value && !Array.isArray(value) ? value : {default: value};

// The names of a parameter with no dashes, the key first. An alias can be a text with commas, as in the engine.
const namesOf = (key: string, param: any, kebab: boolean): string[] =>
	[
		key,
		...(Array.isArray(param.alias)
			? param.alias
			: null == param.alias
				? []
				: String(param.alias).split(re.listDeviders).filter(Boolean)),
	].map(name =>
		kebab && 1 < name.length ? name.replace(/(?<!^)[A-Z]/g, '-$&').toLowerCase() : name
	);

// The names in words of a command line, in camelCase. The engine reads them with no config, so a value or an unknown
// name is no problem, and a short group, `--name=value` and `--` are read as in a parse. An input error gives none.
// One dash too few is a reason to ask for help, so `-file` is read as `--file` when `file` is a long name. One dash
// too many needs nothing, as the engine reads `--f` as the name `f`.
function typed(words: string[], engine: Engine, long: Set<string>): Set<string> {
	const fixed = words.map(word =>
		/^-[^-]/.test(word) && long.has(camel(word.slice(1).split('=')[0])) ? '-' + word : word
	);
	try {
		return new Set(Object.keys(engine(fixed) as object).filter(name => '_' !== name));
	} catch {
		return new Set();
	}
}

const camel = (name: string) => name.replace(re.kebab2camel, (_, char) => char.toUpperCase());

// The parameters to show: with `include`, the ones named in it, and never the ones named in `exclude`. A parameter
// is named by its key, an alias, the kebab-case form, or `--no-` before one of them. The full engine reads
// `--no-color` as `color` and the mini engine as `noColor`, so both forms count, also for a name that starts with `no`.
function shown(
	parameterConfig: ArgMateConfig,
	include: string[],
	exclude: string[],
	engine?: Engine
): ArgMateConfig {
	if (!include.length && !exclude.length) return parameterConfig;
	if (!engine)
		throw new Error('`include` and `exclude` need an engine: argInfoFormat(options, engine)');
	const all: Record<string, string[]> = {};
	for (const key in parameterConfig)
		all[key] = namesOf(key, asParam(parameterConfig[key]), false).map(camel);
	const long = new Set(
		Object.values(all)
			.flat()
			.filter(name => 1 < name.length)
	);
	const included = include.length ? typed(include, engine, long) : undefined;
	const excluded = typed(exclude, engine, long);
	const result: ArgMateConfig = {};
	for (const key in parameterConfig) {
		const names = all[key];
		const named = (found: Set<string>) =>
			names.some(
				name =>
					found.has(name) ||
					found.has('no' + name[0].toUpperCase() + name.slice(1)) ||
					found.has(name.replace(/^no([A-Z])/, (_, char) => char.toLowerCase()))
			);
		if ((!included || named(included)) && !named(excluded)) result[key] = parameterConfig[key];
	}
	return result;
}

// The row of each parameter: the short flag and the long names as one split cell, then the description and the tags
function optionRows(
	parameterConfig: ArgMateConfig,
	kebab: boolean,
	code: (flag: string) => string
) {
	const rows: Cell[][] = [];
	for (const key in parameterConfig) {
		const param = asParam(parameterConfig[key]);
		const names = namesOf(key, param, kebab).map(name => (1 === name.length ? '-' : '--') + name);
		const at = names.findIndex(name => 2 === name.length);
		const short = -1 < at ? names.splice(at, 1)[0] : '';
		const description = param.description ?? param.describe ?? param.desc ?? '';
		rows.push([
			[code(short), names.map(code).join(', ')],
			(description ? description + ' ' : '') + tags(param),
		]);
	}
	return rows;
}

// The type and the default, or the valid values and then the default, or the regular expression and the default.
// A `validate` function gives only the type.
function tags(param: any) {
	const valid = [param.valid, param.validate].find(Array.isArray);
	const is = null == param.default ? '' : '=' + param.default;
	// The first valid value is the default when the config has none
	if (valid)
		return (
			'[' +
			valid
				.map((item: unknown) =>
					Array.isArray(item) ? item.filter(alias => !Array.isArray(alias)).join('/') : item
				)
				.join(', ') +
			'] =' +
			(undefined === param.default ? [].concat(valid[0])[0] : param.default)
		);
	if (param.validate instanceof RegExp) return '[' + param.validate + is + ']';
	return '[' + (param.type || findType(param.default) || 'boolean') + is + ']';
}

function cli(all: Block[], width: number, minColumnWidth: number) {
	if (!all.length) return '';
	return (
		all
			.map(block => {
				if ('string' === typeof block) return wrap(block, width).join('\n');
				const lines = block.heading
					? [block.heading.endsWith(':') ? block.heading : block.heading + ':']
					: [];
				const rows = table(block.items.filter(Array.isArray) as Cell[][], width, minColumnWidth);
				let r = 0;
				for (const item of block.items) {
					if (null === item) lines.push('');
					else if ('string' === typeof item)
						lines.push(...wrap(item, width - 2).map(line => ('  ' + line).trimEnd()));
					else lines.push(...rows[r++]);
				}
				return lines.join('\n');
			})
			.join('\n\n') + '\n'
	);
}

// A `|` would start a new cell, and a line break a new row
const cellText = (text: string) => text.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');

function markdown(all: Block[]) {
	const parts: string[] = [];
	for (const block of all) {
		if ('string' === typeof block) {
			parts.push(block);
			continue;
		}
		if (block.heading) parts.push('## ' + block.heading.replace(/:$/, ''));
		const rows = block.items.filter(Array.isArray) as Cell[][];
		const count = Math.max(0, ...rows.map(row => row.length));
		const columns: number[] = Array(count).fill(1);
		for (const row of rows)
			row.forEach((cell, i) => {
				if (Array.isArray(cell)) columns[i] = Math.max(columns[i], cell.length);
			});
		const line = (cells: string[]) => '| ' + cells.join(' | ') + ' |';
		let tableLines: string[] = [];
		const end = () => {
			if (tableLines.length) parts.push(tableLines.join('\n'));
			tableLines = [];
		};
		for (const item of [...block.items, null]) {
			if (!Array.isArray(item)) {
				end();
				if (item) parts.push(item);
				continue;
			}
			if (!tableLines.length) {
				const header = block.header || columns.flatMap(n => Array(n).fill(''));
				tableLines.push(line(header), line(header.map(() => '---')));
			}
			// A string spans the columns of a split cell: it is in the first of them
			tableLines.push(
				line(
					columns.flatMap((n, i) => {
						const cell = [].concat((item[i] ?? '') as never) as string[];
						return Array.from({length: n}, (_, j) => cellText(cell[j] ?? ''));
					})
				)
			);
		}
	}
	return parts.length ? parts.join('\n\n') + '\n' : '';
}

// The help for `options.config`. `include` and `exclude` need the engine that reads their words.
export function argInfoFormat(
	options: ArgMateInfoConfig = {},
	engine?: Engine
): string | {intro?: HelpText; params: any; outro?: HelpText} {
	// The width of the terminal, but no more than 120, as longer lines are hard to read
	const {
		config = {},
		settings = {},
		include = [],
		exclude = [],
		width = Math.min(120, ('undefined' !== typeof process && process.stdout?.columns) || 120),
		minColumnWidth = 30,
		format = 'cli',
		showIntro = true,
		showOutro = true,
	} = options;
	const {
		intro: configIntro,
		outro: configOutro,
		...params
	} = config as ArgMateConfig & {
		intro?: HelpText;
		outro?: HelpText;
	};
	const intro = showIntro ? (options.intro ?? configIntro) : undefined;
	const outro = showOutro ? (options.outro ?? configOutro) : undefined;
	const kebab = false !== settings.autoCamelKebabCase;
	const parameterConfig = shown(params, include, exclude, engine);

	if ('json' === format)
		return {
			...(intro ? {intro} : {}),
			params: JSON.parse(JSON.stringify(parameterConfig)),
			...(outro ? {outro} : {}),
		};

	const md = 'markdown' === format;
	const name = script();
	const rows = optionRows(
		parameterConfig,
		kebab,
		md ? flag => (flag ? '`' + flag + '`' : '') : flag => flag
	);
	const all: Block[] = [
		...blocks(intro, name),
		...(rows.length
			? [{heading: 'Options', items: rows, header: ['Short', 'Long', 'Description']}]
			: []),
		...blocks(outro, name),
	];
	return md ? markdown(all) : cli(all, width, minColumnWidth);
}
