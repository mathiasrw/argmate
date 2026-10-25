// One parse in a new process, for each runtime and workload. Writes results.md.
//   node run.js [processes]
import {execSync, spawnSync} from 'node:child_process';
import {scenarios} from '../shared/scenarios.js';
import {median, pct, relative, saving} from '../shared/stats.js';
import {writeResults} from '../shared/env.js';

process.chdir(import.meta.dirname);
execSync('bash ../shared/build.sh', {stdio: 'inherit'});

const [runs = '200'] = process.argv.slice(2);
const tasks = [];
const rows = [
	'| Runtime | Workload | full: load + first parse | mini: load + first parse | mini is faster by (95 % interval) |',
	'|---|---|---:|---:|---:|',
];
const us = n => n.toFixed(0) + ' µs';
for (const runtime of ['node', 'bun']) {
	for (const name of Object.keys(scenarios)) {
		const t = {full: {load: [], parse: [], total: []}, mini: {load: [], parse: [], total: []}};
		for (let i = 0; i < +runs; i++) {
			for (const engine of i % 2 ? ['mini', 'full'] : ['full', 'mini']) {
				const out = spawnSync(runtime, ['cold.js', engine, name], {encoding: 'utf8'});
				if (out.status) throw new Error(out.stderr);
				const [load, parse] = out.stdout.trim().split(' ').map(Number);
				t[engine].load.push(load);
				t[engine].parse.push(parse);
				t[engine].total.push(load + parse);
			}
		}
		tasks.push({
			task: `${runtime} ${name}`,
			full: median(t.full.total),
			mini: median(t.mini.total),
		});
		const cell = e =>
			`${us(median(t[e].load))} + ${us(median(t[e].parse))} = ${us(median(t[e].total))}`;
		const row = `| ${runtime} | ${name} | ${cell('full')} | ${cell('mini')} | ${pct(saving(t.full.total, t.mini.total))} |`;
		console.log(row);
		rows.push(row);
	}
}

const summary = [
	`| Engine | ${tasks.map(t => t.task).join(' | ')} |`,
	`|---|${tasks.map(() => '---:').join('|')}|`,
	`| argmate/mini | ${tasks.map(t => relative(t.mini, t.mini)).join(' | ')} |`,
	`| argmate | ${tasks.map(t => relative(t.full, t.mini)).join(' | ')} |`,
];

writeResults(
	'Engines: cold',
	`One parse in a new process: the case of a real CLI, without the start of the runtime. Measured inside the process with \`performance.now()\`: the time to load the bundle and the time of the first parse. The median of ${runs} processes for each engine; full and mini take turns. The first table is the load and first parse compared to argmate/mini: 1.000× is the same time. In the second table "mini is faster by" is \`1 - mini / full\` of the total, with a 95 % bootstrap interval. The workloads are in \`../shared/scenarios.js\`.`,
	`${summary.join('\n')}\n\n${rows.join('\n')}`
);
