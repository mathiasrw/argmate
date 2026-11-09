// Runs cold.js many times for each variant and prints the median of the load time and of the first parse.
// The variants take turns, so a change in the load of the machine has the same effect on all of them.
import {spawnSync} from 'node:child_process';

const [runs = '200'] = process.argv.slice(2);
const variants = ['now', 'this', 'param', 'tail', 'hot'];
const median = list => list.sort((a, b) => a - b)[list.length >> 1];

console.log('| Runtime | Workload | Variant | Load the engine | First parse |');
console.log('|---|---|---|---:|---:|');
for (const runtime of ['bun', 'node']) {
	for (const workload of ['config', 'plain']) {
		const load = Object.fromEntries(variants.map(v => [v, []]));
		const parse = Object.fromEntries(variants.map(v => [v, []]));
		for (let i = 0; i < +runs; i++) {
			for (const variant of variants) {
				const out = spawnSync(runtime, ['cold.js', variant, workload], {encoding: 'utf8'}).stdout;
				const [l, p] = out.trim().split(' ').map(Number);
				load[variant].push(l);
				parse[variant].push(p);
			}
		}
		for (const variant of variants) {
			console.log(
				`| ${runtime} | ${workload} | ${variant} | ${median(load[variant]).toFixed(0)} µs | ${median(parse[variant]).toFixed(0)} µs |`
			);
		}
	}
}
