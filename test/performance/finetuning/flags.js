// 5E: the cold first parse of the branch engine under flags of V8's regex engine. Node only.
//   node flags.js [processes] [workload]
import {spawnSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {environment} from '../shared/env.js';
import {difference, median} from '../shared/stats.js';
import {bundleDir, build, here} from './lib.js';

process.chdir(here);
const [runs = '200', workload = 'config'] = process.argv.slice(2);
build('base');
const settings = {
	default: [],
	'--no-regexp-tier-up': ['--no-regexp-tier-up'],
	'--regexp-tier-up-ticks=1000': ['--regexp-tier-up-ticks=1000'],
	'--regexp-interpret-all': ['--regexp-interpret-all'],
};
const t = Object.fromEntries(Object.keys(settings).map(k => [k, {load: [], parse: []}]));
for (let i = 0; i < +runs; i++) {
	const order = Object.keys(settings);
	if (i % 2) order.reverse();
	for (const name of order) {
		const o = spawnSync('node', [...settings[name], 'cold.js', bundleDir('base'), workload], {
			encoding: 'utf8',
		});
		if (o.status) throw new Error(o.stderr);
		const [load, parse] = o.stdout.trim().split(' ').map(Number);
		t[name].load.push(load);
		t[name].parse.push(parse);
	}
}
const rows = Object.keys(settings).map(name => {
	const d = difference(t[name].parse, t.default.parse);
	return `| ${name} | ${median(t[name].load).toFixed(1)} | ${median(t[name].parse).toFixed(1)} | ${d.value.toFixed(1)} (${d.low.toFixed(1)} to ${d.high.toFixed(1)}) |`;
});
const body = [
	`# 5E: V8's regex tier, cold first parse of \`${workload}\``,
	'',
	`µs, the median of ${runs} processes. The last column is the first parse of the setting minus the first parse of the default, with the 95 % bootstrap interval: positive means the setting is slower.`,
	'',
	environment(),
	'',
	'| Flags | load | first parse | first parse minus default |',
	'|---|---:|---:|---:|',
	...rows,
	'',
].join('\n');
mkdirSync('runs', {recursive: true});
writeFileSync(path.join('runs', `5E-${workload}.md`), body);
console.log(body);
