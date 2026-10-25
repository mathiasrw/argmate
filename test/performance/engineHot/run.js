// Many parses in one process, for each runtime and workload. Writes results.md.
//   node run.js [rounds]
import {execSync, spawnSync} from 'node:child_process';
import {scenarios} from '../shared/scenarios.js';
import {median, pct, relative, saving} from '../shared/stats.js';
import {writeResults} from '../shared/env.js';

process.chdir(import.meta.dirname);
execSync('bash ../shared/build.sh', {stdio: 'inherit'});

const [rounds = '10'] = process.argv.slice(2);
const tasks = [];
const rows = [
	'| Runtime | Workload | full | mini | mini is faster by (95 % interval) |',
	'|---|---|---:|---:|---:|',
];
for (const runtime of ['node', 'bun']) {
	for (const name of Object.keys(scenarios)) {
		const ns = {full: [], mini: []};
		for (let i = 0; i < +rounds; i++) {
			for (const engine of i % 2 ? ['mini', 'full'] : ['full', 'mini']) {
				const out = spawnSync(runtime, ['hot.js', engine, name], {encoding: 'utf8'});
				if (out.status) throw new Error(out.stderr);
				ns[engine].push(+out.stdout);
			}
		}
		tasks.push({task: `${runtime} ${name}`, full: median(ns.full), mini: median(ns.mini)});
		const row = `| ${runtime} | ${name} | ${median(ns.full).toFixed(0)} ns | ${median(ns.mini).toFixed(0)} ns | ${pct(saving(ns.full, ns.mini))} |`;
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
	'Engines: hot',
	`Many parses in one process, thus the JIT compiler has optimized the engine. For each workload, ${rounds} rounds of 400 ms for each engine. Each round runs in its own process, and full and mini take turns. The first table is the time of one parse compared to argmate/mini: 1.000× is the same time, 2.000× is two times slower. The second table has the median time of one parse, and "mini is faster by" is \`1 - mini / full\` with a 95 % bootstrap interval. The workloads are in \`../shared/scenarios.js\`.`,
	`${summary.join('\n')}\n\n${rows.join('\n')}`
);
