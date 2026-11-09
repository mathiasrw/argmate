// 1B: the load of the CommonJS bundle (`require`) and of the ESM bundle (`import()`), in a new process, on each runtime.
//   node cjs.js [processes] [variant]
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {environment} from '../shared/env.js';
import {scenarios} from '../shared/scenarios.js';
import {difference, median} from '../shared/stats.js';
import {build, bundleDir, here} from './lib.js';

if ('one' === process.argv[2]) {
	const [, , , kind, dir] = process.argv;
	const {args, config} = scenarios.config;
	const now = process.hrtime.bigint;
	const req = createRequire(import.meta.url);
	const cjsFile = path.join(dir, 'cjs/argMate.cjs');
	const esmFile = path.join(dir, 'argMate.js');
	const t0 = now();
	const parse = 'cjs' === kind ? req(cjsFile) : (await import(esmFile)).default;
	const t1 = now();
	const result = parse(args, config);
	const t2 = now();
	if (!result._) throw new Error('No result');
	console.log((Number(t1 - t0) / 1000).toFixed(1), (Number(t2 - t1) / 1000).toFixed(1));
} else {
	process.chdir(here);
	const runs = +(process.argv[2] ?? 200);
	const variant = process.argv[3] ?? 'base';
	const src = build(variant);
	const dir = bundleDir(variant);
	execFileSync(
		'bun',
		[
			'build',
			'--target=node',
			'--format=cjs',
			path.join(src, 'argMate.ts'),
			'--outfile=' + path.join(dir, 'cjs/argMate.cjs'),
			'--minify',
			'--footer',
			'module.exports = Object.assign(module.exports.default || {}, module.exports)',
		],
		{stdio: 'ignore'}
	);
	const rows = [];
	for (const runtime of ['node', 'bun']) {
		const t = {esm: {load: [], parse: []}, cjs: {load: [], parse: []}};
		for (let i = 0; i < runs; i++) {
			for (const kind of i % 2 ? ['cjs', 'esm'] : ['esm', 'cjs']) {
				const o = spawnSync(runtime, [path.join(here, 'cjs.js'), 'one', kind, dir], {
					encoding: 'utf8',
				});
				if (o.status) throw new Error(o.stderr);
				const [load, parse] = o.stdout.trim().split(' ').map(Number);
				t[kind].load.push(load);
				t[kind].parse.push(parse);
			}
		}
		const d = difference(t.esm.load, t.cjs.load);
		const dp = difference(t.esm.parse, t.cjs.parse);
		rows.push(
			`| ${runtime} | ${median(t.esm.load).toFixed(1)} | ${median(t.cjs.load).toFixed(1)} | ${d.value.toFixed(1)} (${d.low.toFixed(1)} to ${d.high.toFixed(1)}) | ${median(t.esm.parse).toFixed(1)} | ${median(t.cjs.parse).toFixed(1)} | ${dp.value.toFixed(1)} (${dp.low.toFixed(1)} to ${dp.high.toFixed(1)}) |`
		);
	}
	const body = [
		`# 1B: CommonJS and ESM, \`${variant}\``,
		'',
		`µs in a new process, the median of ${runs} processes, \`config\` workload. Gain = ESM - CJS with the 95 % bootstrap interval: positive means \`require()\` of the CJS bundle is faster.`,
		'',
		environment(),
		'',
		'| Runtime | load ESM | load CJS | load gain | first parse ESM | first parse CJS | first parse gain |',
		'|---|---:|---:|---:|---:|---:|---:|',
		...rows,
		'',
	].join('\n');
	mkdirSync('runs', {recursive: true});
	writeFileSync(`runs/1B-cjs-${variant}.md`, body);
	console.log(body);
}
