// How much of the first call is compile and cold state: the 1st, 2nd and 3rd call of configPreprocessing and of the engine in one process.
//   node warmup.js [processes]
import {spawnSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {environment} from '../shared/env.js';
import {scenarios} from '../shared/scenarios.js';
import {median} from '../shared/stats.js';
import {build, bundleDir, here} from './lib.js';

if ('one' === process.argv[2]) {
	const [, , , dir, name] = process.argv;
	const {args, config} = scenarios[name];
	const mod = await import(path.join(dir, 'argMate.js'));
	const now = process.hrtime.bigint;
	const out = [];
	const prepared = [];
	for (let i = 0; i < 3; i++) {
		const t = now();
		prepared.push(mod.configPreprocessing(config, {}));
		out.push(Number(now() - t) / 1000);
	}
	for (let i = 0; i < 3; i++) {
		const t = now();
		mod.argEngine(args, prepared[i]);
		out.push(Number(now() - t) / 1000);
	}
	console.log(out.map(n => n.toFixed(1)).join(' '));
} else {
	process.chdir(here);
	const runs = +(process.argv[2] ?? 100);
	build('base');
	const rows = [];
	for (const runtime of ['node', 'bun']) {
		for (const name of ['config']) {
			const cols = Array.from({length: 6}, () => []);
			for (let i = 0; i < runs; i++) {
				const o = spawnSync(
					runtime,
					[path.join(here, 'warmup.js'), 'one', bundleDir('base'), name],
					{encoding: 'utf8'}
				);
				if (o.status) throw new Error(o.stderr);
				o.stdout
					.trim()
					.split(' ')
					.forEach((n, j) => {
						cols[j].push(+n);
					});
			}
			rows.push(`| ${runtime} | ${name} | ${cols.map(c => median(c).toFixed(1)).join(' | ')} |`);
		}
	}
	const body = [
		'# The first, second and third call',
		'',
		`µs, the median of ${runs} processes. The second and third call use another prepared config of the same input, so the difference to the first call is compile, regex compile, empty inline caches and the first allocation of objects.`,
		'',
		environment(),
		'',
		'| Runtime | Workload | preprocessing 1st | 2nd | 3rd | engine 1st | 2nd | 3rd |',
		'|---|---|---:|---:|---:|---:|---:|---:|',
		...rows,
		'',
	].join('\n');
	mkdirSync('runs', {recursive: true});
	writeFileSync('runs/warmup.md', body);
	console.log(body);
}
