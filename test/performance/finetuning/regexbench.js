// 2B: what a regex of the engine costs on V8 and on JavaScriptCore: the first execution in a new process, and one execution when hot.
//   node regexbench.js [processes]
import {spawnSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {environment} from '../shared/env.js';
import {median} from '../shared/stats.js';
import {here} from './lib.js';

// [name, regex source, flags, input]
const cases = [
	[
		'paramLong, indexed groups, u',
		'^(--)$|^-(-)(no-)?([^=\\s-]+(?:-[^=\\s-]+)*)()(?:(=)|$)',
		'u',
		'--dry-run=yes',
	],
	[
		'paramLong, named groups, u',
		'^(?<STOP>--)$|^-(?<LONG>-)(?<NO>no-)?(?<KEY>[^=\\s-]+(?:-[^=\\s-]+)*)(?:(?<ASSIGN>=)|$)',
		'u',
		'--dry-run=yes',
	],
	[
		'paramLong, indexed groups, no u',
		'^(--)$|^-(-)(no-)?([^=\\s-]+(?:-[^=\\s-]+)*)()(?:(=)|$)',
		'',
		'--dry-run=yes',
	],
	[
		'paramShort, indexed groups, u',
		'^-()()()([^=\\s-](?:[^=\\s-]*?[^=\\s\\d-])?)(\\d*)(?:(=)|$)',
		'u',
		'-abc',
	],
	[
		'paramShort, named groups, u',
		'^-(?<KEY>[^=\\s-](?:[^=\\s-]*?[^=\\s\\d-])?)(?<KEYNUM>\\d*)(?:(?<ASSIGN>=)|$)',
		'u',
		'-abc',
	],
	['autoNumber', '^-?(?:0|[1-9]\\d*)(?:\\.\\d+)?(?:[eE][+-]?\\d+)?$', '', '8080'],
	['numberish', '^-[\\d.](?![\\uFE0F\\u20E3])[^=]*$', '', '-5'],
	['notParam', '\\s|^--?(?:=|$)', '', '-- x'],
	['hasDigit', '\\d(?![\\uFE0F\\u20E3])', '', 'abc5'],
	['hasNonAscii', '[\\u0080-\\uFFFF]', '', 'abc'],
	['onlyDigits', '^\\d+$', '', 'abc'],
	['isKebab', '[^-]-[^-]', 'u', 'dry-run'],
	['kebab2camel, replace', '-(.)', 'gsu', 'dry-run'],
	['boolStringTrue', '^(true|yes|on|1)$', 'i', 'yes'],
	['listDeviders, split', '[,\\s]+-?-?|^--?', '', 'a,b'],
];

if ('one' === process.argv[2]) {
	const out = [];
	const now = process.hrtime.bigint;
	for (const [, source, flags, input] of cases) {
		const re = new RegExp(source, flags);
		const t = now();
		re.exec(input);
		out.push(Number(now() - t) / 1000);
	}
	// A fresh regex of the same pattern for each case, so a first execution is a first execution
	const hot = [];
	for (const [name, source, flags, input] of cases) {
		const re = new RegExp(source, flags);
		let sink = 0;
		for (let i = 0; i < 200000; i++) sink += re.exec(input) ? 1 : 0;
		const t = now();
		const n = 1000000;
		for (let i = 0; i < n; i++) sink += re.exec(input) ? 1 : 0;
		hot.push(Number(now() - t) / n);
		if (-1 === sink) console.log(name);
	}
	console.log(JSON.stringify({first: out, hot}));
} else {
	process.chdir(here);
	const runs = +(process.argv[2] ?? 30);
	const rows = {};
	for (const runtime of ['node', 'bun']) {
		const first = cases.map(() => []);
		const hot = cases.map(() => []);
		for (let i = 0; i < runs; i++) {
			const o = spawnSync(runtime, [path.join(here, 'regexbench.js'), 'one'], {encoding: 'utf8'});
			if (o.status) throw new Error(o.stderr);
			const r = JSON.parse(o.stdout.trim().split('\n').pop());
			r.first.forEach((v, j) => {
				first[j].push(v);
			});
			r.hot.forEach((v, j) => {
				hot[j].push(v);
			});
		}
		rows[runtime] = cases.map((c, j) => [median(first[j]), median(hot[j])]);
	}
	const lines = cases.map(
		(c, j) =>
			`| ${c[0]} | \`${c[3]}\` | ${rows.node[j][0].toFixed(1)} | ${rows.bun[j][0].toFixed(1)} | ${rows.node[j][1].toFixed(0)} | ${rows.bun[j][1].toFixed(0)} |`
	);
	const body = [
		'# 2B: the cost of the regexes of the engine on V8 and on JavaScriptCore',
		'',
		`First execution: µs for one \`exec\` on a new \`RegExp\` in a new process, the median of ${runs} processes. Hot: ns for one \`exec\` after 200000 executions, in one process, the median of ${runs}. \`exec\` is used for all rows, so the \`replace\` and \`split\` rows are the cost of the pattern and not of the method.`,
		'',
		environment(),
		'',
		'| Regex | Input | First, Node µs | First, Bun µs | Hot, Node ns | Hot, Bun ns |',
		'|---|---|---:|---:|---:|---:|',
		...lines,
		'',
	].join('\n');
	mkdirSync('runs', {recursive: true});
	writeFileSync('runs/2B-regexes.md', body);
	console.log(body);
}
