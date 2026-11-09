// 3C: the load of the bundle with a static `import` and with a dynamic `import()`, on each runtime. The time is performance.now() at the first
// line of the entry file (from the start of the process), and the load is the difference to the same entry with an empty module.
//   node static.js [processes]
import {spawnSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {environment} from '../shared/env.js';
import {difference, median} from '../shared/stats.js';
import {build, bundleDir, here} from './lib.js';

process.chdir(here);
const runs = +(process.argv[2] ?? 200);
build('base');
const dir = path.join(here, 'dist', 'static');
mkdirSync(dir, {recursive: true});
const bundle = path.join(bundleDir('base'), 'argMate.js');
writeFileSync(path.join(dir, 'empty.js'), 'export default 1;\n');
const entries = {
	'static bundle': `import x from ${JSON.stringify(bundle)};\nconsole.log(performance.now() * 1000, typeof x);\n`,
	'static empty': `import x from './empty.js';\nconsole.log(performance.now() * 1000, typeof x);\n`,
	'dynamic bundle': `const {default: x} = await import(${JSON.stringify(bundle)});\nconsole.log(performance.now() * 1000, typeof x);\n`,
	'dynamic empty': `const {default: x} = await import('./empty.js');\nconsole.log(performance.now() * 1000, typeof x);\n`,
};
for (const [name, code] of Object.entries(entries))
	writeFileSync(path.join(dir, name.replace(' ', '-') + '.js'), code);

const rows = [];
for (const runtime of ['node', 'bun']) {
	const t = Object.fromEntries(Object.keys(entries).map(k => [k, []]));
	for (let i = 0; i < runs; i++) {
		const names = Object.keys(entries);
		if (i % 2) names.reverse();
		for (const name of names) {
			const o = spawnSync(runtime, [path.join(dir, name.replace(' ', '-') + '.js')], {
				encoding: 'utf8',
			});
			if (o.status) throw new Error(o.stderr);
			t[name].push(+o.stdout.split(' ')[0]);
		}
	}
	const row = (label, a, b) => {
		const d = difference(a, b);
		return `| ${runtime} | ${label} | ${median(a).toFixed(0)} | ${median(b).toFixed(0)} | ${d.value.toFixed(1)} (${d.low.toFixed(1)} to ${d.high.toFixed(1)}) |`;
	};
	rows.push(row('static', t['static bundle'], t['static empty']));
	rows.push(row('dynamic', t['dynamic bundle'], t['dynamic empty']));
	const s = t['static bundle'].map((v, i) => v - t['static empty'][i]);
	const d = t['dynamic bundle'].map((v, i) => v - t['dynamic empty'][i]);
	const diff = difference(d, s);
	rows.push(
		`| ${runtime} | dynamic minus static | | | ${diff.value.toFixed(1)} (${diff.low.toFixed(1)} to ${diff.high.toFixed(1)}) |`
	);
}
const body = [
	'# 3C: static import and dynamic import() of the bundle',
	'',
	`µs from the start of the process to the first line of the entry file, the median of ${runs} processes, and the load as the difference to an entry that imports an empty module. The last column is the load of the bundle with the 95 % bootstrap interval.`,
	'',
	environment(),
	'',
	'| Runtime | Import | with the bundle | with an empty module | load |',
	'|---|---|---:|---:|---:|',
	...rows,
	'',
].join('\n');
mkdirSync('runs', {recursive: true});
writeFileSync('runs/3C-static.md', body);
console.log(body);
