// Compares argmate with other parsers: what each one gives for common inputs, its size, and its speed.
// Each parser parses the same CLI (see libs.js), and must give the same result for the workload before it is timed.
// Writes results.md.
//   node run.js [rounds of hot] [processes of cold] [runs of cli]
import {execSync, spawnSync} from 'node:child_process';
import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {writeResults} from '../shared/env.js';
import {difference, median, relative} from '../shared/stats.js';

process.chdir(import.meta.dirname);
const [rounds = '8', processes = '100', runs = '200'] = process.argv.slice(2);
const start = Date.now();
const step = what => console.log(`${((Date.now() - start) / 1000).toFixed(0)} s: ${what}`);

if (!existsSync('node_modules')) execSync('bun install', {stdio: 'inherit'});
execSync('bash ../shared/build.sh', {stdio: 'inherit'});
execSync('bun precompile.js', {stdio: 'inherit'});

step('built');
const {libs, workload, inputs} = await import('./libs.js');
const names = Object.keys(libs);
const runtimes = ['node', 'bun'];
const sections = [];

// What each parser gives for common inputs
const show = v => (undefined === v ? 'undefined' : JSON.stringify(v));
const describe = expected =>
	Object.entries(expected)
		.map(([key, value]) => `${key} = ${show(value)}`)
		.join(', ');
const behaviourRows = [
	`| Parser | ${inputs.map(([input]) => `\`${input}\``).join(' | ')} |`,
	`|---|${inputs.map(() => ':---:').join('|')}|`,
	`| *Expected* | ${inputs.map(([, expected]) => describe(expected)).join(' | ')} |`,
];
const misses = [];
for (const name of names) {
	const parse = await libs[name].load();
	const cells = [];
	for (const [input, expected] of inputs) {
		let result;
		try {
			result = await parse(input.split(' '));
		} catch (e) {
			result = {error: String(e.message || e).split('\n')[0]};
		}
		const ok = Object.keys(expected).every(key => isDeepStrictEqual(result[key], expected[key]));
		cells.push(ok ? '✅' : '❌');
		if (!ok) {
			const got = result.error
				? `error: ${result.error}`
				: describe(Object.fromEntries(Object.keys(expected).map(key => [key, result[key]])));
			misses.push(`- ${name}, \`${input}\`: ${got}`);
		}
	}
	behaviourRows.push(`| ${name} | ${cells.join(' | ')} |`);
}
sections.push(
	`## Behaviour: what each parser gives for common inputs\n\nEach column is one input on the command line, with node. The row *Expected* is the right result. ✅ means the parser gives it, ❌ means it gives something else (see the list below the table). This is not about speed: it shows if a parser reads the input the way a user means it.\n\n${behaviourRows.join('\n')}\n\nWhat the parsers with ❌ give:\n\n${misses.join('\n')}`
);

step('behaviour');

// Each parser must give the expected result for the workload, with both runtimes. Else its time is for other work.
const timed = [];
const excluded = [];
for (const name of names) {
	const wrong = runtimes.filter(runtime => {
		const out = spawnSync(runtime, ['worker.js', 'cli', name, ...workload.args], {
			encoding: 'utf8',
		});
		return out.status || !isDeepStrictEqual(JSON.parse(out.stdout), workload.expected);
	});
	if (wrong.length) excluded.push(`${name} (${wrong.join(', ')})`);
	else timed.push(name);
}

step('workload checked');

// The size of each parser when it is installed: its package and all packages it depends on
const dirSize = dir =>
	readdirSync(dir, {withFileTypes: true}).reduce((sum, entry) => {
		if ('node_modules' === entry.name) return sum;
		const path = `${dir}/${entry.name}`;
		return sum + (entry.isDirectory() ? dirSize(path) : statSync(path).size);
	}, 0);
const tree = (pkg, from = 'node_modules', seen = new Map()) => {
	const dir = existsSync(`${from}/${pkg}/package.json`) ? `${from}/${pkg}` : `node_modules/${pkg}`;
	if (seen.has(dir)) return seen;
	seen.set(dir, dirSize(dir));
	const {dependencies = {}} = JSON.parse(readFileSync(`${dir}/package.json`, 'utf8'));
	for (const dep of Object.keys(dependencies)) tree(dep, `${dir}/node_modules`, seen);
	return seen;
};
const {dependencies} = JSON.parse(readFileSync('package.json', 'utf8'));
const kb = bytes => (bytes / 1024).toFixed(0) + ' KB';
execSync('bun run build', {cwd: '../../..', stdio: 'ignore'});
const [packed] = JSON.parse(
	execSync('npm pack --dry-run --json', {
		cwd: '../../..',
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'ignore'],
	})
);
const sizeRows = [
	'| Parser | Version | Packages | Install size | Note |',
	'|---|---|---:|---:|---|',
];
for (const name of names) {
	const lib = libs[name];
	let version = (dependencies[lib.version || name] || '').replace('npm:', '');
	let size = '';
	if ('src' === lib.version) {
		version = `${packed.version} (this branch)`;
		size = `1 | ${kb(packed.unpackedSize)}`;
	} else if ('node' === lib.version) {
		version = `node ${process.version}`;
		size = '0 | 0 KB';
	} else {
		const sizes = tree(lib.version || name);
		size = `${sizes.size} | ${kb([...sizes.values()].reduce((a, b) => a + b, 0))}`;
	}
	sizeRows.push(`| ${name} | ${version} | ${size} | ${lib.note || ''} |`);
}
sections.push(
	`## Size\n\nThe package and all packages it depends on, as installed. The size of argmate is the \`unpackedSize\` of \`npm pack\`: all entry points, ESM, CommonJS and types.\n\n${sizeRows.join('\n')}`
);

step('size');

const timedNote = excluded.length
	? `Not timed, because the result of the workload is not as expected: ${excluded.join(', ')}.`
	: 'All parsers give the expected result for the workload, with node and bun.';
const workloadNote = `The workload: \`${workload.args.join(' ')}\`. ${timedNote}`;
const sorted = (values, runtime) =>
	timed.slice().sort((a, b) => median(values[runtime][a]) - median(values[runtime][b]));
const take = (values, runtime, name, sample) => values[runtime][name].push(sample);
const blank = () =>
	Object.fromEntries(runtimes.map(r => [r, Object.fromEntries(timed.map(n => [n, []]))]));

// Hot: many parses in one process
const hot = blank();
for (const runtime of runtimes) {
	for (let i = 0; i < +rounds; i++) {
		for (const name of i % 2 ? timed.slice().reverse() : timed) {
			const out = spawnSync(runtime, ['worker.js', 'hot', name], {encoding: 'utf8'});
			if (out.status) throw new Error(out.stderr);
			take(hot, runtime, name, +out.stdout);
		}
	}
	step(`hot, ${runtime}`);
}
const hotRows = ['| Parser | node | | bun | |', '|---|---:|---:|---:|---:|'];
const argmateHot = runtime => median(hot[runtime].v1);
for (const name of sorted(hot, 'node')) {
	const cell = runtime =>
		`${median(hot[runtime][name]).toFixed(0)} ns | ${(median(hot[runtime][name]) / argmateHot(runtime)).toFixed(1)} ×`;
	hotRows.push(`| ${name} | ${cell('node')} | ${cell('bun')} |`);
}
sections.push(
	`## Hot: many parses in one process\n\n${workloadNote} The median time of one parse, of ${rounds} rounds of 400 ms; each round runs in its own process. × is the time compared to v1. This is what a program gets that parses many times in one process. A CLI parses one time, so see the next two tables for a CLI.\n\n${hotRows.join('\n')}`
);

// Cold: import the parser and parse one time, in a new process
const cold = {load: blank(), parse: blank(), total: blank()};
for (const runtime of runtimes) {
	for (let i = 0; i < +processes; i++) {
		for (const name of i % 2 ? timed.slice().reverse() : timed) {
			const out = spawnSync(runtime, ['worker.js', 'cold', name], {encoding: 'utf8'});
			if (out.status) throw new Error(out.stderr);
			const [load, parse] = out.stdout.trim().split(' ').map(Number);
			take(cold.load, runtime, name, load);
			take(cold.parse, runtime, name, parse);
			take(cold.total, runtime, name, load + parse);
		}
	}
	step(`cold, ${runtime}`);
}
const ms = n => (n / 1000).toFixed(2) + ' ms';
const coldRows = [
	'| Parser | node: import | node: first parse | node: total | bun: import | bun: first parse | bun: total |',
	'|---|---:|---:|---:|---:|---:|---:|',
];
for (const name of sorted(cold.total, 'node')) {
	const cell = runtime =>
		['load', 'parse', 'total'].map(part => ms(median(cold[part][runtime][name]))).join(' | ');
	coldRows.push(`| ${name} | ${cell('node')} | ${cell('bun')} |`);
}
sections.push(
	`## Cold: import and first parse in a new process\n\n${workloadNote} Measured inside the process with \`performance.now()\`: the time to import the parser and the time of the first parse. The median of ${processes} processes for each parser. This is what the parser costs a CLI, without the start of the runtime.\n\n${coldRows.join('\n')}`
);

// The real CLI: the wall time of a whole process
const cli = Object.fromEntries(
	runtimes.map(r => [r, Object.fromEntries(['baseline', ...timed].map(n => [n, []]))])
);
const commands = runtimes.flatMap(runtime =>
	['baseline', ...timed].map(name => ({
		runtime,
		name,
		args: ['worker.js', 'cli', name, ...workload.args],
	}))
);
for (let i = 0; i < 5; i++) for (const c of commands) spawnSync(c.runtime, c.args);
for (let i = 0; i < +runs; i++) {
	for (let j = 0; j < commands.length; j++) {
		const c = commands[(i + j) % commands.length];
		const start = process.hrtime.bigint();
		const out = spawnSync(c.runtime, c.args);
		cli[c.runtime][c.name].push(Number(process.hrtime.bigint() - start) / 1e6);
		if (out.status) throw new Error(String(out.stderr));
	}
	if (0 === (i + 1) % 50) step(`cli, ${i + 1} of ${runs} runs`);
}
const cost = (runtime, name) => difference(cli[runtime][name], cli[runtime].baseline);
const cliRows = [
	'| Parser | node: process | node: the parser costs (95 % interval) | bun: process | bun: the parser costs (95 % interval) |',
	'|---|---:|---:|---:|---:|',
];
const range = ({value, low, high}) =>
	`${value.toFixed(2)} ms (${low.toFixed(2)} to ${high.toFixed(2)})`;
const cliBase = runtimes
	.map(runtime => `${runtime} ${median(cli[runtime].baseline).toFixed(2)} ms`)
	.join(', ');
for (const name of timed.slice().sort((a, b) => median(cli.node[a]) - median(cli.node[b]))) {
	const cell = runtime =>
		`${median(cli[runtime][name]).toFixed(2)} ms | ${range(cost(runtime, name))}`;
	cliRows.push(`| ${name} | ${cell('node')} | ${cell('bun')} |`);
}
sections.push(
	`## The real CLI: a whole process\n\n${workloadNote} The wall time of a process that imports the parser, parses the args and prints the result. ${runs} runs for each command; all ${commands.length} commands take turns. The baseline is the same process with no parser: ${cliBase}. "The parser costs" is the median of the parser minus the median of the baseline.\n\n${cliRows.join('\n')}`
);

step('cli');

// The summary: each time compared to v1 mini
const tasks = [
	['node hot', name => median(hot.node[name])],
	['bun hot', name => median(hot.bun[name])],
	['node cold', name => median(cold.total.node[name])],
	['bun cold', name => median(cold.total.bun[name])],
	['node CLI', name => median(cli.node[name])],
	['bun CLI', name => median(cli.bun[name])],
];
const summaryRows = [
	`| Parser | ${tasks.map(([task]) => task).join(' | ')} |`,
	`|---|${tasks.map(() => '---:').join('|')}|`,
	...timed
		.slice()
		.sort((a, b) => median(cli.node[a]) - median(cli.node[b]))
		.map(
			name =>
				`| ${name} | ${tasks.map(([, get]) => relative(get(name), get('v1 mini'))).join(' | ')} |`
		),
];
sections.unshift(
	`## Summary: compared to v1 mini\n\nEach time as a factor of the time of v1 mini: 1.000× is the same time, 2.000× is two times slower, 0.500× is two times faster. The rows are in the order of the node CLI. *hot* is one parse in a process that parses many times, *cold* is the import and the first parse in a new process, *CLI* is the wall time of the whole process, with the start of the runtime. The tables below have the times.\n\n${workloadNote}\n\n${summaryRows.join('\n')}`
);

writeResults(
	'Compare parsers',
	'argmate and other parsers for the command line of Node, with the same CLI for each one. v1 is argmate as it is now in `src/`, on the way to version 1. v0.8 is the published argmate 0.8.5. Each one with the full and the mini engine, and with a precompiled config. The setup of each parser is in `libs.js`.',
	sections.join('\n\n')
);
