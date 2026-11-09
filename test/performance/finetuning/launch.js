// 3A and 3B: the wall time of a whole process that parses the `config` workload and prints the result:
// Node with a bundle (ESM, CJS) and with a startup snapshot, Bun with a bundle and as a compiled binary with and without bytecode.
//   node launch.js [processes] [variant]
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {environment} from '../shared/env.js';
import {difference, median} from '../shared/stats.js';
import {build, bundleDir, here} from './lib.js';

process.chdir(here);
const runs = +(process.argv[2] ?? 100);
const variant = process.argv[3] ?? 'base';
build(variant);
const dir = path.join(here, 'dist', 'launch');
rmSync(dir, {recursive: true, force: true});
mkdirSync(dir, {recursive: true});
const args = [
	'--file',
	'a.txt',
	'--port=8080',
	'-vv',
	'-t',
	'x',
	'--tag',
	'y',
	'--name',
	' bob ',
	'--ratio',
	'1.5',
	'-d',
	'rest1',
	'rest2',
];
const bundle = path.join(bundleDir(variant), 'argMate.js');
const scenarios = path.join(here, '../shared/scenarios.js');
writeFileSync(
	path.join(dir, 'cli-src.js'),
	`import argMate from ${JSON.stringify(bundle)};\nimport {scenarios} from ${JSON.stringify(scenarios)};\nconst {config} = scenarios.config;\nconsole.log(JSON.stringify(argMate(process.argv.slice(2), config)));\n`
);
const bun = (...a) => execFileSync('bun', a, {cwd: dir, stdio: 'pipe'});
bun('build', 'cli-src.js', '--target=node', '--format=esm', '--minify', '--outfile=cli.mjs');
bun('build', 'cli-src.js', '--target=node', '--format=cjs', '--minify', '--outfile=cli.cjs');

// The same program with the config made at build time: `argmate/engine` and the compiled config
const engineBundle = path.join(bundleDir(variant), 'argEngine.js');
const compiled = path.join(bundleDir(variant), 'precompiled.js');
writeFileSync(
	path.join(dir, 'cli-pre-src.js'),
	`import argEngine from ${JSON.stringify(engineBundle)};\nimport {fresh} from ${JSON.stringify(compiled)};\nconsole.log(JSON.stringify(argEngine(process.argv.slice(2), fresh())));\n`
);
bun(
	'build',
	'cli-pre-src.js',
	'--target=node',
	'--format=esm',
	'--minify',
	'--outfile=cli-pre.mjs'
);

const commands = {
	'node esm': ['node', ['cli.mjs']],
	'node cjs': ['node', ['cli.cjs']],
	'bun esm': ['bun', ['cli.mjs']],
	'bun cjs': ['bun', ['cli.cjs']],
	'node precompiled': ['node', ['cli-pre.mjs']],
	'bun precompiled': ['bun', ['cli-pre.mjs']],
};
const failed = {};

// 3A: a snapshot of Node. The entry has the bundle inside, as the entry of a snapshot can not load files
writeFileSync(
	path.join(dir, 'snap-src.js'),
	`import argMate from ${JSON.stringify(bundle)};\nimport {scenarios} from ${JSON.stringify(scenarios)};\nimport v8 from 'node:v8';\nconst {config} = scenarios.config;\nv8.startupSnapshot.setDeserializeMainFunction(() => {\n\tconsole.log(JSON.stringify(argMate(process.argv.slice(2), config)));\n});\n`
);
try {
	bun(
		'build',
		'snap-src.js',
		'--target=node',
		'--format=cjs',
		'--minify',
		'--outfile=snap-entry.cjs'
	);
	const built = spawnSync(
		'node',
		['--snapshot-blob', 'snap.blob', '--build-snapshot', 'snap-entry.cjs'],
		{cwd: dir, encoding: 'utf8'}
	);
	if (built.status)
		throw new Error((built.stderr || built.stdout).trim().split('\n').slice(0, 4).join(' | '));
	// There is no script, so `--` ends the options of Node and `x` takes the place of the script in process.argv
	commands['node snapshot'] = ['node', ['--snapshot-blob', 'snap.blob', '--', 'x']];
} catch (e) {
	failed['node snapshot'] = String(e.message || e).slice(0, 300);
}

// 3B: a binary of Bun, with and without bytecode
for (const [name, extra] of [
	['bun compiled', []],
	['bun compiled bytecode', ['--bytecode']],
]) {
	try {
		bun(
			'build',
			'cli-src.js',
			'--compile',
			...extra,
			'--minify',
			`--outfile=${name.replace(/ /g, '-')}`
		);
		commands[name] = [path.join(dir, name.replace(/ /g, '-')), []];
	} catch (e) {
		failed[name] = String(e.stderr || e.message).slice(0, 300);
	}
}

const run = ([cmd, a]) => {
	const t = process.hrtime.bigint();
	const o = spawnSync(cmd, [...a, ...args], {cwd: dir, encoding: 'utf8'});
	const ms = Number(process.hrtime.bigint() - t) / 1e6;
	if (o.status) throw new Error(`${cmd} ${a}: ${o.stderr}`);
	return {ms, out: o.stdout.trim()};
};
const names = Object.keys(commands);
const outputs = {};
for (const n of names) outputs[n] = run(commands[n]).out;
const reference = outputs['node esm'];
const different = names.filter(n => outputs[n] !== reference);
const times = Object.fromEntries(names.map(n => [n, []]));
for (let i = 0; i < runs; i++) {
	const order = i % 2 ? names.slice().reverse() : names;
	for (const n of order) times[n].push(run(commands[n]).ms);
}
const fastest = Object.fromEntries(
	['node', 'bun'].map(r => [
		r,
		Math.min(...names.filter(n => n.startsWith(r)).map(n => median(times[n]))),
	])
);
const rows = names.map(n => {
	const ref = n.startsWith('bun') ? 'bun esm' : 'node esm';
	const d = difference(times[n], times[ref]);
	return `| ${n} | ${median(times[n]).toFixed(1)} | ${(median(times[n]) / fastest[n.startsWith('bun') ? 'bun' : 'node']).toFixed(2)}× | ${n === ref ? '' : `${d.value.toFixed(1)} (${d.low.toFixed(1)} to ${d.high.toFixed(1)})`} |`;
});
const body = [
	`# 3A and 3B: the wall time of a whole process, \`${variant}\``,
	'',
	`ms from the start of the process to its exit, the median of ${runs} runs of each, \`config\` workload, the commands take turns. The last column is the time of the row minus the time of \`node esm\` (or \`bun esm\` for the rows of Bun) with the 95 % bootstrap interval: negative means faster.`,
	different.length
		? `\nThe output is not the same as that of \`node esm\` for: ${different.join(', ')}.\n`
		: '',
	environment(),
	'',
	'| Command | median ms | relative to the fastest of its runtime | difference to the bundle (ESM), ms |',
	'|---|---:|---:|---:|',
	...rows,
	'',
	Object.keys(failed).length
		? 'Did not work:\n\n' +
			Object.entries(failed)
				.map(([k, v]) => `- ${k}: ${v}`)
				.join('\n') +
			'\n'
		: '',
].join('\n');
mkdirSync('runs', {recursive: true});
writeFileSync(`runs/3AB-launch-${variant}.md`, body);
console.log(body);
