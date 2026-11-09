// The cost of `argInfoOnError` when there is no error: the hot path of a parse, and the load of a precompiled
// config that has the help rows. Writes results.md.
//   node run.js [rounds]
import {execSync, spawnSync} from 'node:child_process';
import {difference, median} from '../shared/stats.js';
import {writeResults} from '../shared/env.js';

process.chdir(import.meta.dirname);
execSync('bash ../shared/build.sh', {stdio: 'inherit'});
execSync('node gen.js', {stdio: 'inherit'});

const {variants} = await import('./variants.js');
const want = JSON.stringify(variants.plain());
for (const name in variants)
	if (JSON.stringify(variants[name]()) !== want) throw new Error(`${name} gives another result`);

const [rounds = '15', cold = '40'] = process.argv.slice(2);
const one = (runtime, file, variant) => {
	const out = spawnSync(runtime, [file, variant], {encoding: 'utf8'});
	if (out.status) throw new Error(out.stderr);
	return +out.stdout;
};
// The variants take turns, so a change in the load of the machine hits all of them
const measure = (runtime, file, list, n) => {
	const t = Object.fromEntries(list.map(v => [v, []]));
	for (let i = 0; i < n; i++)
		for (const v of i % 2 ? list.slice().reverse() : list) t[v].push(one(runtime, file, v));
	return t;
};
const diff = (a, b, unit) => {
	const d = difference(a, b);
	return `${d.value.toFixed(0)} ${unit} (${d.low.toFixed(0)} to ${d.high.toFixed(0)})`;
};

const hot = [
	'| Runtime | Variant | ns per parse | Against | Difference (95 % interval) |',
	'|---|---|---:|---|---:|',
];
const load = [
	'| Runtime | Variant | µs to load and parse | Difference (95 % interval) |',
	'|---|---|---:|---:|',
];
const against = {onError: 'plain', upFront: 'plain', precompiledHelp: 'precompiled'};
for (const runtime of ['node', 'bun']) {
	const t = measure(runtime, 'hot.js', Object.keys(variants), +rounds);
	for (const v in t) {
		const base = against[v];
		const row = `| ${runtime} | ${v} | ${median(t[v]).toFixed(0)} | ${base || ''} | ${base ? diff(t[v], t[base], 'ns') : ''} |`;
		console.log(row);
		hot.push(row);
	}
	const c = measure(runtime, 'cold.js', ['precompiled', 'precompiledHelp'], +cold);
	for (const v in c) {
		const row = `| ${runtime} | ${v} | ${median(c[v]).toFixed(0)} | ${'precompiledHelp' === v ? diff(c[v], c.precompiled, 'µs') : ''} |`;
		console.log(row);
		load.push(row);
	}
}

writeResults(
	'argInfoOnError: the cost when there is no error',
	`The help goes below the message of an input error. This measures what that costs a parse that has no error, which is most parses. The workload is the \`config\` workload of \`../shared/scenarios.js\` with a description for each parameter (\`config.js\`). Each number is the median of ${rounds} processes (hot) or ${cold} processes (load); the variants take turns. A difference is the difference of the medians with a 95 % bootstrap interval: an interval that includes 0 means no difference was found.

- \`plain\`: \`argMate(args, config)\`
- \`onError\`: the same with \`argInfoOnError: true\`: the help is made only on an error
- \`upFront\`: the help made before each parse, as a config step that makes it up front would
- \`precompiled\`: \`argEngine(args, config)\` with a precompiled config, loaded from a module as a program ships it
- \`precompiledHelp\`: the same, where the \`error\` function of the precompiled config has the help rows (\`gen.js\`)`,
	`## Hot: many parses in one process\n\n${hot.join('\n')}\n\n## Load: import the precompiled config and parse one time, in a new process\n\n${load.join('\n')}`
);
