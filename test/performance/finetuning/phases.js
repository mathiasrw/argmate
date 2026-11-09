// 5C: where the time of the first parse goes. A copy of the engine gets a timestamp at each border between phases, in a
// new process, 200 times. The numbers are µs, the median of the processes.
//   node phases.js [processes] [variant]   (the variant of variants/, in place of src/)
// Phases: import (load of the bundle), preprocessing (configPreprocessing, only for a workload with a config), call into the engine,
// setup (entry of the engine to the first token: destructuring, the copy of the output, the reverse of the input, the spots),
// token loop, late checks (after the loop, to the alias and inflate step), and return (that step, and the return).
import {execFileSync, spawnSync} from 'node:child_process';
import {cpSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {environment} from '../shared/env.js';
import {scenarios} from '../shared/scenarios.js';
import {median} from '../shared/stats.js';
import {build, here} from './lib.js';

process.chdir(here);
const runs = +(process.argv[2] ?? 200);
const variant = process.argv[3];
const repo = path.resolve(here, '../../..');
const out = path.join(here, 'dist', 'phases');
const src = path.join(out, 'src');
rmSync(out, {recursive: true, force: true});
mkdirSync(out, {recursive: true});
if (variant) build(variant);
cpSync(variant ? path.join(here, 'dist', variant, 'src') : path.join(repo, 'src'), src, {
	recursive: true,
});

// A timestamp is pushed at each border. The text to find is part of the engine as it is, so a change of it fails here and not quietly
const mark = '/*mark*/ globalThis.__marks.push(process.hrtime.bigint());\n';
const borders = [
	['argProcessObj?: ArgMateEngineConfig\n): ArgMateResponse<ArgMateConfig> {\n', 'after'],
	['\twhile (args.length) {\n', 'before'],
	['\tfor (const [key, value] of Object.entries(complexDefault)) {\n', 'before'],
	['\treturn output as ArgMateResponse<ArgMateConfig>;\n', 'before'],
];
let engine = readFileSync(path.join(src, 'argEngine.ts'), 'utf8');
for (const [text, where] of borders) {
	if (1 !== engine.split(text).length - 1)
		throw new Error(`Border not found exactly once: ${text.trim()}`);
	engine = engine.replace(text, where === 'after' ? text + mark : mark + text);
}
writeFileSync(path.join(src, 'argEngine.ts'), engine);
execFileSync(
	'bun',
	[
		'build',
		'--target=node',
		'--format=esm',
		path.join(src, 'argMate.ts'),
		path.join(src, 'argEngine.ts'),
		'--outdir=' + out,
		'--minify',
		'--sourcemap=none',
	],
	{stdio: 'ignore'}
);
execFileSync('bun', [path.join(here, '../shared/gen.ts'), src, out], {stdio: 'inherit'});

writeFileSync(
	path.join(out, 'one.js'),
	`// node one.js <workload>: prints the µs of each phase of one first parse
import path from 'node:path';
import {scenarios} from ${JSON.stringify(path.join(here, '../shared/scenarios.js'))};
const name = process.argv[2];
const {args, config, precompiled} = scenarios[name];
const dir = ${JSON.stringify(out)};
const now = process.hrtime.bigint;
globalThis.__marks = [];
const engineConfig = precompiled ? (await import(path.join(dir, 'precompiled.js'))).fresh() : undefined;
const t0 = now();
const mod = await import(path.join(dir, precompiled ? 'argEngine.js' : 'argMate.js'));
const t1 = now();
const engine = precompiled ? mod.default : mod.argEngine;
const prepared = precompiled ? engineConfig : config ? mod.configPreprocessing(config, {}) : undefined;
const t2 = now();
const result = engine(args, prepared);
const t3 = now();
if (!result._) throw new Error('No result');
const [m0, m1, m2, m3] = globalThis.__marks;
const us = (a, b) => (Number(b - a) / 1000).toFixed(1);
console.log([us(t0, t1), us(t1, t2), us(t2, m0), us(m0, m1), us(m1, m2), us(m2, m3), us(m3, t3), us(t0, t3)].join(' '));
`
);

const columns = [
	'import',
	'preprocessing',
	'call into engine',
	'setup',
	'token loop',
	'late checks',
	'return',
	'total',
];
const rows = [];
for (const runtime of ['node', 'bun']) {
	for (const name of ['config', 'plain', 'precompiled']) {
		const list = columns.map(() => []);
		for (let i = 0; i < runs; i++) {
			const o = spawnSync(runtime, [path.join(out, 'one.js'), name], {encoding: 'utf8'});
			if (o.status) throw new Error(o.stderr);
			o.stdout
				.trim()
				.split(' ')
				.forEach((n, j) => {
					list[j].push(+n);
				});
		}
		const m = list.map(l => median(l));
		rows.push(`| ${runtime} | ${name} | ${m.map(n => n.toFixed(1)).join(' | ')} |`);
		console.error(rows.at(-1));
	}
}
const body = [
	'# 5C: the phases of the first parse',
	'',
	`µs, the median of ${runs} new processes. \`import\` is the load of the bundle. \`preprocessing\` is \`configPreprocessing\` (0 with no config, and for \`precompiled\`). \`call into engine\` is the time from the end of the preprocessing to the first line of the engine. \`setup\` is the entry of the engine to the first token: the destructuring of the config, the copy of the output, the reverse of the input and the spots. \`late checks\` is from the end of the token loop to the alias and inflate step, and \`return\` is that step and the return. The total is import plus first parse. The timestamps cost a little, so the total is a little above the cold table.`,
	'',
	environment(),
	'',
	`| Runtime | Workload | ${columns.join(' | ')} |`,
	`|---|---|${columns.map(() => '---:').join('|')}|`,
	...rows,
	'',
].join('\n');
mkdirSync('runs', {recursive: true});
writeFileSync(`runs/5C-phases${variant ? '-' + variant : ''}.md`, body);
console.log(body);
