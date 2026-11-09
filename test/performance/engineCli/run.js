// The real CLI: the wall time of a whole process that parses process.argv with the workload `config` and prints the result.
// `baseline` prints process.argv with no argmate, so `full - baseline` is what argmate costs the CLI. Writes results.md.
//   node run.js [runs]
import {execSync, spawnSync} from 'node:child_process';
import {mkdirSync, rmSync} from 'node:fs';
import {scenarios} from '../shared/scenarios.js';
import {median, pct, relative, saving} from '../shared/stats.js';
import {writeResults} from '../shared/env.js';

process.chdir(import.meta.dirname);
execSync('bash ../shared/build.sh', {stdio: 'inherit'});

const [runs = '300'] = process.argv.slice(2);
const clis = ['baseline', 'full', 'mini', 'full-engine', 'mini-engine'];

// Executables made with `bun build --compile`, 70 MB each. They are deleted at the end.
mkdirSync('dist', {recursive: true});
for (const cli of clis) {
	execSync(`bun build ../shared/dist/cli/${cli}.js --compile --minify --outfile dist/${cli}`, {
		stdio: 'ignore',
	});
}

const runtimes = {node: ['node'], bun: ['bun'], 'bun --compile': []};
const commands = [];
for (const [runtime, prefix] of Object.entries(runtimes)) {
	for (const cli of clis) {
		const file = prefix.length ? `../shared/dist/cli/${cli}.js` : `dist/${cli}`;
		const [command, ...rest] = [...prefix, file, ...scenarios.config.args];
		commands.push({runtime, cli, command, rest, ms: []});
	}
}

const expected = spawnSync(commands[1].command, commands[1].rest, {encoding: 'utf8'}).stdout;
for (const c of commands) {
	const out = spawnSync(c.command, c.rest, {encoding: 'utf8'}).stdout;
	if ('baseline' !== c.cli && out !== expected) {
		throw new Error(`${c.runtime} ${c.cli} gives ${out}, not ${expected}`);
	}
}

for (let i = 0; i < 10; i++) for (const c of commands) spawnSync(c.command, c.rest);
for (let i = 0; i < +runs; i++) {
	for (let j = 0; j < commands.length; j++) {
		const c = commands[(i + j) % commands.length];
		const start = process.hrtime.bigint();
		const out = spawnSync(c.command, c.rest);
		c.ms.push(Number(process.hrtime.bigint() - start) / 1e6);
		if (out.status) throw new Error(String(out.stderr));
	}
}
rmSync('dist', {recursive: true});

const ms = n => n.toFixed(2) + ' ms';
const rows = [
	'| Runtime | Import | baseline | full | mini | argmate in full | mini is faster by (95 % interval) |',
	'|---|---|---:|---:|---:|---:|---:|',
];
for (const runtime of Object.keys(runtimes)) {
	const get = cli => commands.find(c => c.runtime === runtime && c.cli === cli).ms;
	const base = median(get('baseline'));
	for (const [label, suffix] of [
		['`argmate`, config at run time', ''],
		['`argmate/engine`, precompiled', '-engine'],
	]) {
		const full = get('full' + suffix);
		const mini = get('mini' + suffix);
		const row = `| ${runtime} | ${label} | ${ms(base)} | ${ms(median(full))} | ${ms(median(mini))} | ${ms(median(full) - base)} | ${pct(saving(full, mini))} |`;
		console.log(row);
		rows.push(row);
	}
}

const candidates = [
	['argmate/mini', 'mini'],
	['argmate', 'full'],
	['argmate/mini/engine, precompiled', 'mini-engine'],
	['argmate/engine, precompiled', 'full-engine'],
	['no parser (baseline)', 'baseline'],
];
const time = (runtime, cli) =>
	median(commands.find(c => c.runtime === runtime && c.cli === cli).ms);
const columns = Object.keys(runtimes);
const summary = [
	`| Import | ${columns.join(' | ')} |`,
	`|---|${columns.map(() => '---:').join('|')}|`,
	...candidates.map(
		([label, cli]) =>
			`| ${label} | ${columns.map(runtime => relative(time(runtime, cli), time(runtime, 'mini'))).join(' | ')} |`
	),
];

writeResults(
	'Engines: real CLI',
	`The wall time of a whole process that parses \`process.argv\` with the workload \`config\` and prints the result. ${runs} runs for each command; all ${commands.length} commands take turns. \`baseline\` is the same CLI with no argmate: it only prints \`process.argv\`. "argmate in full" is \`full - baseline\`. "mini is faster by" is \`1 - mini / full\`, with a 95 % bootstrap interval. \`bun --compile\` is an executable made with \`bun build --compile\`. The first table is the time of the whole process compared to argmate/mini: 1.000× is the same time.`,
	`${summary.join('\n')}\n\n${rows.join('\n')}`
);
