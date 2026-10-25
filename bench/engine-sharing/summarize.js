// Prints the results of bench.sh as Markdown tables. It takes the passes together: for each variant
// the mean of the means, and the difference to `now` in percent.
//   node summarize.js pass1 pass2
import fs from 'node:fs';

const passes = process.argv.slice(2);
const dir = 'dist/results/';
const variants = ['now', 'this', 'param', 'tail', 'hot'];
const parses = 200000;

function read(kind, runtime, workload) {
	const rows = Object.fromEntries(variants.map(v => [v, {means: [], mins: [], stddevs: []}]));
	for (const pass of passes) {
		const file = `${dir}${kind}-${runtime}-${workload}-${pass}.json`;
		for (const result of JSON.parse(fs.readFileSync(file, 'utf8')).results) {
			rows[result.command].means.push(result.mean);
			rows[result.command].mins.push(result.min);
			rows[result.command].stddevs.push(result.stddev);
		}
	}
	return rows;
}

const mean = list => list.reduce((a, b) => a + b, 0) / list.length;
const percent = (value, base) => {
	const diff = (value / base - 1) * 100;
	return (diff < 0 ? '' : '+') + diff.toFixed(1) + ' %';
};

console.log(`## Hot: ${parses} parses in one process\n`);
console.log(
	'| Runtime | Workload | Variant | Time of the process | ± | Fastest run | For one parse | To `now` |'
);
console.log('|---|---|---|---:|---:|---:|---:|---:|');
for (const runtime of ['bun', 'node']) {
	for (const workload of ['config', 'plain']) {
		const rows = read('hot', runtime, workload);
		const base = mean(rows.now.means);
		const baseMin = Math.min(...rows.now.mins);
		for (const variant of variants) {
			const time = mean(rows[variant].means);
			const min = Math.min(...rows[variant].mins);
			console.log(
				`| ${runtime} | ${workload} | ${variant} | ${(time * 1000).toFixed(0)} ms | ${(mean(rows[variant].stddevs) * 1000).toFixed(0)} ms | ${(min * 1000).toFixed(0)} ms (${percent(min, baseMin)}) | ${((time / parses) * 1e6).toFixed(2)} µs | ${percent(time, base)} |`
			);
		}
	}
}

console.log('\n## Cold: one parse in one process\n');
console.log('| Runtime | Variant | Time of the process | ± | To `now` |');
console.log('|---|---|---:|---:|---:|');
for (const runtime of ['bun', 'node']) {
	const rows = read('cold', runtime, 'config');
	const base = mean(rows.now.means);
	for (const variant of variants) {
		const time = mean(rows[variant].means);
		console.log(
			`| ${runtime} | ${variant} | ${(time * 1000).toFixed(2)} ms | ${(mean(rows[variant].stddevs) * 1000).toFixed(2)} ms | ${percent(time, base)} |`
		);
	}
}
