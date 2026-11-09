// Makes a test of each row in the tables of SPEC.md and README.md, so the two files say what the engine does.
// A table is one with the columns Input, Config and Result, and optionally Settings before Result.
// Each row also runs here: when the engine does not give a row, this stops with exit code 1, and `bun run test` with it.
//   bun tools/generateTestsFromDocumentation.js
import {spawnSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import argMate from '../src/argMate.ts';

const sources = [
	['SPEC.md', 'test/spec.test.js'],
	['README.md', 'test/readme.test.js'],
];

const quote = s => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const unwrap = cell => cell.trim().replace(/^`(.*)`$/, '$1');
const value = code => new Function(`return (${code})`)();

// `ERROR` and the code of the first input error, or ERROR_NOT_VALID_CONFIG for a config error
function errorCode(args, config, settings) {
	let code;
	try {
		argMate(args, config, {
			...settings,
			error: e => {
				code ??= 'ERROR ' + e.code;
			},
			panic: () => {
				throw 'ERROR_NOT_VALID_CONFIG';
			},
		});
	} catch (e) {
		if ('ERROR_NOT_VALID_CONFIG' !== e) throw e;
		code ??= e;
	}
	return code;
}

function passes(args, config, settings, expected) {
	try {
		const [config_, settings_] = [value(config), value(settings)];
		if (expected.startsWith('ERROR')) return errorCode(args, config_, settings_) === expected;
		return Bun.deepEquals(argMate(args, config_, settings_), value(expected));
	} catch {
		return false;
	}
}

const failed = [];

for (const [source, target] of sources) {
	const out = [
		`// Made by tools/generateTestsFromDocumentation.js from ${source}, in its order: each row of a table is one test.`,
		'// Do not edit: change the table. `bun run test` makes this file again.',
		"import {describe, expect, test} from 'bun:test';",
		"import {argMate} from './helper.ts';",
		'',
		'// The code of the first input error',
		errorCode.toString(),
	];
	let section = '';
	let heading = '';
	// The describe blocks that are open: 0, 1 for the section, 2 for the heading also
	let open = 0;
	let openSection = null;
	let openHeading = null;
	let columns = null;

	const close = level => {
		for (; level < open; open--) out.push('});');
	};

	for (const line of readFileSync(source, 'utf8').split('\n')) {
		const title = line.match(/^(#{1,4}) (.*)/);
		if (title) {
			columns = null;
			if (title[1].length <= 2) [section, heading] = [title[2].trim(), ''];
			else heading = title[2].trim();
			continue;
		}
		if (!line.startsWith('|')) {
			columns = null;
			continue;
		}
		const cells = line.trim().slice(1, -1).split('|').map(unwrap);
		if (!columns) {
			if ('Input' === cells[0] && 'Config' === cells[1]) columns = cells;
			continue;
		}
		if (cells[0].startsWith('---')) continue;

		const row = Object.fromEntries(columns.map((name, i) => [name, cells[i]]));
		const settings = row.Settings || 'Default';
		const args = row.Input ? row.Input.split(/\s+/) : [];
		const config = 'Default' === row.Config ? '{}' : row.Config;
		const settingsCode = 'Default' === settings ? '{}' : `{${settings.replace(/`/g, '')}}`;
		let name = row.Input || '(no input)';
		if ('Default' !== row.Config) name += ' with ' + row.Config;
		if ('Default' !== settings) name += ' and ' + settings.replace(/`/g, '');

		if (section !== openSection) {
			close(0);
			out.push('', `describe(${quote(section)}, () => {`);
			open = 1;
			openSection = section;
			openHeading = null;
		}
		if (heading !== openHeading) {
			close(1);
			if (heading) {
				out.push(`describe(${quote(heading)}, () => {`);
				open = 2;
			}
			openHeading = heading;
		}

		const call = row.Result.startsWith('ERROR') ? 'errorCode' : 'argMate';
		const matcher = 'errorCode' === call ? 'toBe' : 'toEqual';
		const expected = 'errorCode' === call ? quote(row.Result) : row.Result;
		if (!passes(args, config, settingsCode, row.Result))
			failed.push(`${source}: ${section} > ${heading} > ${name}`);
		out.push(
			`test(${quote(name)}, () => {`,
			`expect(${call}([${args.map(quote).join(', ')}], ${config}, ${settingsCode})).${matcher}(${expected});`,
			'});'
		);
	}
	close(0);

	writeFileSync(target, out.join('\n') + '\n');
	spawnSync('bunx', ['biome', 'format', '--write', target]);
}

if (failed.length) {
	console.error(
		`\n\x1b[41m\x1b[37m STOP \x1b[0m The engine does not give these rows of the documentation (${failed.length}):\n`
	);
	for (const row of failed) console.error('\x1b[31m  ' + row + '\x1b[0m');
	console.error(
		'\nFix the engine or the table. The tests in test/spec.test.js and test/readme.test.js show the difference.\n'
	);
	process.exit(1);
}
