// 5C, second half: the regexes one first parse touches, and what their first execution costs.
// The methods of RegExp are wrapped to time the first call on each regex object, so the numbers are a little above the real ones
// and the fast path of V8 for plain regexes is off. Use them for the order of the regexes and the count, not as exact costs.
//   node regexes.js [processes] [variant]
import {spawnSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {environment} from '../shared/env.js';
import {scenarios} from '../shared/scenarios.js';
import {median} from '../shared/stats.js';
import {build, bundleDir, here} from './lib.js';

if ('one' === process.argv[2]) {
	const [, , , dir, name] = process.argv;
	const {args, config, precompiled} = scenarios[name];
	const now = process.hrtime.bigint;
	const engineConfig = precompiled
		? (await import(path.join(dir, 'precompiled.js'))).fresh()
		: undefined;
	const mod = await import(path.join(dir, precompiled ? 'argEngine.js' : 'argMate.js'));
	const first = new Map();
	let depth = 0;
	const wrap = (key, original) => {
		RegExp.prototype[key] = {
			[original.name](...a) {
				if (depth || first.has(this)) return original.apply(this, a);
				depth++;
				const t = now();
				try {
					return original.apply(this, a);
				} finally {
					first.set(this, Number(now() - t) / 1000);
					depth--;
				}
			},
		}[original.name];
	};
	for (const key of ['exec', 'test', Symbol.replace, Symbol.match, Symbol.split, Symbol.search])
		wrap(key, RegExp.prototype[key]);
	if (precompiled) mod.default(args, engineConfig);
	else if (config) mod.default(args, config);
	else mod.default(args);
	console.log(JSON.stringify([...first].map(([re, us]) => ['/' + re.source + '/' + re.flags, us])));
} else {
	process.chdir(here);
	const runs = +(process.argv[2] ?? 30);
	const variant = process.argv[3] ?? 'base';
	build(variant);
	const out = [];
	const summary = [];
	for (const runtime of ['node', 'bun']) {
		for (const name of ['plain', 'config']) {
			const per = new Map();
			let order = [];
			for (let i = 0; i < runs; i++) {
				const o = spawnSync(
					runtime,
					[path.join(here, 'regexes.js'), 'one', bundleDir(variant), name],
					{encoding: 'utf8'}
				);
				if (o.status) throw new Error(o.stderr);
				const list = JSON.parse(o.stdout);
				order = list.map(([re]) => re);
				for (const [re, us] of list) per.set(re, [...(per.get(re) ?? []), us]);
			}
			const rows = order.map(
				re =>
					`| ${runtime} | ${name} | \`${re.replace(/\|/g, '\\|')}\` | ${median(per.get(re)).toFixed(1)} |`
			);
			summary.push(
				`| ${runtime} | ${name} | ${order.length} | ${order.reduce((s, re) => s + median(per.get(re)), 0).toFixed(0)} |`
			);
			out.push(...rows);
		}
	}
	const body = [
		'# 5C: the regexes of a first parse',
		'',
		`The regexes executed in the first parse of a workload, in the order of their first execution, and the time of that first execution in µs (median of ${runs} processes). Wrapped, so the sum is a little above the real cost.`,
		'',
		environment(),
		'',
		'| Runtime | Workload | Regexes touched | Sum of first executions, µs |',
		'|---|---|---:|---:|',
		...summary,
		'',
		'| Runtime | Workload | Regex | First execution, µs |',
		'|---|---|---|---:|',
		...out,
		'',
	].join('\n');
	mkdirSync('runs', {recursive: true});
	writeFileSync(`runs/5C-regexes${'base' === variant ? '' : '-' + variant}.md`, body);
	console.log(body);
}
