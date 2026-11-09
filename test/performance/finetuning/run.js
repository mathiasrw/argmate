// Measures variants of the engine against the engine of the branch: size, cold and hot, on Node and on Bun.
//   node run.js [options] <variant>...
//     --runs N          processes for each engine and workload in the cold measurement (default 200)
//     --rounds N        rounds of 400 ms for each engine and workload in the hot measurement (default 10)
//     --runtimes a,b    default node,bun
//     --workloads a,b   default all of ../shared/scenarios.js
//     --base NAME       measure against the variant NAME in place of the engine of the branch (for a change on top of another)
//     --no-test --no-cold --no-hot   leave a step out
// A variant is variants/<name>.ts (a copy of src/argEngine.ts) or the folder variants/<name>/ (files of src/).
// Every engine is measured in its own process, and the engines take turns. The result is written to runs/.
import {spawnSync} from 'node:child_process';
import {mkdirSync, statSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {environment} from '../shared/env.js';
import {scenarios} from '../shared/scenarios.js';
import {difference, median, saving} from '../shared/stats.js';
import {build, bundleDir, here, sameResults, test} from './lib.js';

process.chdir(here);

const opt = {
	runs: 200,
	rounds: 10,
	runtimes: ['node', 'bun'],
	workloads: Object.keys(scenarios),
	test: true,
	cold: true,
	hot: true,
	base: 'base',
};
const variants = [];
const args = process.argv.slice(2);
while (args.length) {
	const arg = args.shift();
	if ('--runs' === arg) opt.runs = +args.shift();
	else if ('--rounds' === arg) opt.rounds = +args.shift();
	else if ('--runtimes' === arg) opt.runtimes = args.shift().split(',');
	else if ('--workloads' === arg) opt.workloads = args.shift().split(',');
	else if ('--base' === arg) opt.base = args.shift();
	else if (arg.startsWith('--no-')) opt[arg.slice(5)] = false;
	else if (arg.startsWith('--')) throw new Error(`Unknown option ${arg}`);
	else variants.push(arg);
}
if (!variants.length) throw new Error('Name at least one variant: node run.js <variant>...');
for (const name of opt.workloads)
	if (!scenarios[name]) throw new Error(`Unknown workload '${name}'`);

const baseName = opt.base;
const names = [baseName, ...variants];
const log = text => process.stderr.write(text + '\n');

for (const name of names) {
	log(`== build ${name}`);
	build(name);
}

for (const name of variants) {
	if (opt.test) {
		log(`== tests with ${name}`);
		const result = test(name);
		if (!result.ok) {
			console.error(result.output);
			throw new Error(`The tests fail with '${name}': it is not measured`);
		}
	}
	const problems = await sameResults(bundleDir(baseName), bundleDir(name));
	if (problems.length) {
		throw new Error(
			`'${name}' does not give the results of the branch engine:\n${problems.join('\n')}`
		);
	}
}

// The engines take turns, and the first one changes from round to round
const turns = i => names.slice(i % names.length).concat(names.slice(0, i % names.length));
const spawn = (runtime, script, name, workload) => {
	const out = spawnSync(runtime, [script, bundleDir(name), workload], {encoding: 'utf8'});
	if (out.status) throw new Error(out.stderr);
	return out.stdout.trim().split(' ').map(Number);
};

const us = n => n.toFixed(1);
const signed = n => (0 <= n ? '+' : '-') + Math.abs(n).toFixed(1);
// gain = base - variant: positive means the variant is faster or smaller. Inside the interval is noise.
const verdict = ({low, high}) => (0 < low ? 'faster' : high < 0 ? 'slower' : 'no change');
const gain = (base, variant) => {
	const d = difference(base, variant);
	return {
		...d,
		text: `${signed(d.value)} (${signed(d.low)} to ${signed(d.high)})`,
		verdict: verdict(d),
	};
};

const cold = {};
if (opt.cold) {
	for (const runtime of opt.runtimes) {
		for (const workload of opt.workloads) {
			const t = Object.fromEntries(names.map(n => [n, {load: [], parse: [], total: []}]));
			for (let i = 0; i < opt.runs; i++) {
				for (const name of turns(i)) {
					const [load, parse] = spawn(runtime, 'cold.js', name, workload);
					t[name].load.push(load);
					t[name].parse.push(parse);
					t[name].total.push(load + parse);
				}
				if (0 === (i + 1) % 50) log(`cold ${runtime} ${workload}: ${i + 1}/${opt.runs}`);
			}
			cold[`${runtime} ${workload}`] = t;
		}
	}
}

const hot = {};
if (opt.hot) {
	for (const runtime of opt.runtimes) {
		for (const workload of opt.workloads) {
			const t = Object.fromEntries(names.map(n => [n, []]));
			for (let i = 0; i < opt.rounds; i++) {
				for (const name of turns(i)) t[name].push(spawn(runtime, 'hot.js', name, workload)[0]);
			}
			hot[`${runtime} ${workload}`] = t;
			log(`hot ${runtime} ${workload}: done`);
		}
	}
}

const bytes = (name, file) => statSync(path.join(bundleDir(name), file)).size;
const count = {faster: 0, slower: 0, 'no change': 0};
const sections = [];
for (const name of variants) {
	const out = [`## ${name}`, ''];

	out.push(
		'Size, bytes. Gain = base - variant: positive is smaller.',
		'',
		'| Bundle | base | variant | gain |',
		'|---|---:|---:|---:|'
	);
	for (const file of ['argMate.js', 'argEngine.js']) {
		out.push(
			`| ${file} | ${bytes(baseName, file)} | ${bytes(name, file)} | ${signed(bytes(baseName, file) - bytes(name, file))} |`
		);
	}

	if (opt.cold) {
		out.push(
			'',
			`Cold: load and first parse in a new process, µs. Median of ${opt.runs} processes. Gain = base - variant with the 95 % bootstrap interval: positive is faster.`,
			'',
			'| Runtime and workload | base load + parse = total | variant load + parse = total | load gain | first parse gain | total gain | |',
			'|---|---:|---:|---:|---:|---:|---|'
		);
		for (const [task, t] of Object.entries(cold)) {
			const cell = e =>
				`${us(median(t[e].load))} + ${us(median(t[e].parse))} = ${us(median(t[e].total))}`;
			const total = gain(t[baseName].total, t[name].total);
			count[total.verdict]++;
			out.push(
				`| ${task} | ${cell(baseName)} | ${cell(name)} | ${gain(t[baseName].load, t[name].load).text} | ${gain(t[baseName].parse, t[name].parse).text} | ${total.text} | ${total.verdict} |`
			);
		}
	}

	if (opt.hot) {
		out.push(
			'',
			`Hot: one parse after the JIT compiler has optimized the engine, ns. Median of ${opt.rounds} rounds of 400 ms. Gain = base - variant with the 95 % bootstrap interval: positive is faster.`,
			'',
			'| Runtime and workload | base | variant | gain ns | gain % | |',
			'|---|---:|---:|---:|---:|---|'
		);
		for (const [task, t] of Object.entries(hot)) {
			const g = gain(t[baseName], t[name]);
			count[g.verdict]++;
			const s = saving(t[baseName], t[name]);
			out.push(
				`| ${task} | ${us(median(t[baseName]))} | ${us(median(t[name]))} | ${g.text} | ${signed(s.pct)} (${signed(s.low)} to ${signed(s.high)}) | ${g.verdict} |`
			);
		}
	}
	sections.push(out.join('\n'));
}

const d = new Date();
const two = n => String(n).padStart(2, '0');
const stamp = `${d.getFullYear()}${two(d.getMonth() + 1)}${two(d.getDate())}-${two(d.getHours())}${two(d.getMinutes())}`;
const title = `Finetuning: ${variants.join(', ')} against ${baseName === 'base' ? 'the branch engine' : baseName}`;
const body = [
	`# ${title}`,
	'',
	`Workloads: ${opt.workloads.join(', ')}. Runtimes: ${opt.runtimes.join(', ')}. The engines take turns, each in its own process. The timer is \`process.hrtime.bigint()\`.`,
	'',
	environment(),
	'',
	sections.join('\n\n'),
	'',
	`Rows: ${count.faster} faster, ${count.slower} slower, ${count['no change']} no change.`,
	'',
].join('\n');
mkdirSync('runs', {recursive: true});
const file = path.join('runs', `${stamp}-${variants.join('+')}.md`);
writeFileSync(file, body);
console.log(body);
log(`Saved to ${path.join(here, file)}`);
