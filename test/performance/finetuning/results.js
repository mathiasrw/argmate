// Writes results.md from the last runs of `node run.js mini max` and `node run.js --base mini mini-max`.
//   node results.js
import {readdirSync, readFileSync, writeFileSync} from 'node:fs';

const latest = suffix => {
	const name = readdirSync('runs')
		.filter(f => f.endsWith(suffix))
		.sort()
		.at(-1);
	if (!name)
		throw new Error(
			`No run ends with ${suffix}: run node run.js mini max, and node run.js --base mini mini-max`
		);
	return name;
};

// The sections of a run file: { variant: { cold: {task: [base, variant]}, hot: {...}, size: {file: [base, variant]} } }
const parse = text => {
	const out = {};
	for (const section of text.split('\n## ').slice(1)) {
		const name = section.split('\n')[0];
		const cold = {};
		const hot = {};
		const size = {};
		for (const line of section.split('\n')) {
			const c = line
				.replace(/^\||\|$/g, '')
				.split('|')
				.map(x => x.trim());
			if (4 === c.length && c[0].endsWith('.js') && /^\d+$/.test(c[1])) size[c[0]] = [+c[1], +c[2]];
			if (!/^(node|bun) /.test(c[0] ?? '')) continue;
			const total = x => Number.parseFloat(x.split('=')[1]);
			if (7 === c.length) cold[c[0]] = [total(c[1]), total(c[2]), c[5], c[6]];
			else if (6 === c.length)
				hot[c[0]] = [Number.parseFloat(c[1]), Number.parseFloat(c[2]), c[4], c[5]];
		}
		out[name] = {cold, hot, size};
	}
	return out;
};

const maxFile = latest('-mini+max.md');
const miniFile = latest('-mini-max.md');
const maxText = readFileSync(`runs/${maxFile}`, 'utf8');
const miniText = readFileSync(`runs/${miniFile}`, 'utf8');
const [machine, runtimes, code, date] = maxText
	.slice(maxText.indexOf('- Machine'), maxText.indexOf('\n\n## '))
	.split('\n')
	.map(line => line.replace(/^- (Machine: |Date: )?/, ''));
const both = parse(maxText);
const mm = parse(miniText)['mini-max'];
const mini = both.mini;
const max = both.max;
const tasks = Object.keys(max.cold);
const launch = readFileSync('runs/3AB-launch-max.md', 'utf8')
	.split('\n')
	.filter(l => /^\| (node|bun) /.test(l))
	.map(l =>
		l
			.replace(/^\||\|$/g, '')
			.split('|')
			.map(c => c.trim())
	);
const labels = {
	'node esm': 'Node, `argmate`, config at run time',
	'node cjs': 'Node, `argmate`, CommonJS bundle',
	'node precompiled': 'Node, `argmate/engine`, config made at build time',
	'node snapshot': 'Node, startup snapshot',
	'bun esm': 'Bun, `argmate`, config at run time',
	'bun cjs': 'Bun, `argmate`, CommonJS bundle',
	'bun precompiled': 'Bun, `argmate/engine`, config made at build time',
	'bun compiled': 'Bun, `bun build --compile` binary',
	'bun compiled bytecode': 'Bun, `bun build --compile --bytecode` binary',
};
const best = r => launch.find(c => c[0].startsWith(r) && c[2].startsWith('1.00')).slice(0, 2);
const launchTable = [
	'| Command | Time of the whole run |',
	'|---|---:|',
	...launch.map(c => `| ${labels[c[0]] ?? c[0]} | ${c[2].replace('×', 'x')} |`),
].join('\n');

const x = v => `${v.toFixed(2)}x`;
const verdicts = o => Object.values(o).map(r => r.at(-1));
const count = (o, v) => verdicts(o).filter(r => r === v).length;

// A row: the values of the engines, each divided by the smallest of the row, and the smallest as it was measured
const row = (head, values, unit) => {
	const best = Math.min(...Object.values(values));
	return `| ${head.join(' | ')} | ${Object.values(values)
		.map(v => x(v / best))
		.join(' | ')} | ${best.toFixed(0)} ${unit} |`;
};
const table = (kind, unit) =>
	tasks.map(k =>
		row(k.split(' '), {Max: max[kind][k][1], Full: max[kind][k][0], Mini: mini[kind][k][1]}, unit)
	);
const miniTable = (kind, unit) =>
	tasks.map(k => row(k.split(' '), {'Mini + Max': mm[kind][k][1], Mini: mm[kind][k][0]}, unit));
// Bundle sizes are in KB (1 KB is 1,024 bytes, as in test/package/run.js)
const kb = v => `${(v / 1024).toFixed(1)} KB`;
const sizeRows = ['argMate.js', 'argEngine.js'].map(
	f =>
		`| ${f.replace('.js', '')} | ${kb(max.size[f][1])} | ${kb(max.size[f][0])} | ${kb(mini.size[f][1])} |`
);
const miniSize = ['argMate.js', 'argEngine.js'].map(
	f => `| ${f.replace('.js', 'Mini')} | ${kb(mm.size[f][1])} | ${kb(mm.size[f][0])} |`
);

// Max compared to Full: how many times as fast, per runtime
const speedup = (kind, runtime) => {
	const r = tasks.filter(k => k.startsWith(runtime)).map(k => max[kind][k][0] / max[kind][k][1]);
	return `${x(Math.min(...r))} - ${x(Math.max(...r))}`;
};
// One engine in the rows of one runtime: its time divided by the time of the fastest engine of the row
const spread = (kind, runtime, engine) => {
	const r = tasks
		.filter(k => k.startsWith(runtime))
		.map(k => {
			const t = {Max: max[kind][k][1], Full: max[kind][k][0], Mini: mini[kind][k][1]};
			return t[engine] / Math.min(...Object.values(t));
		});
	const lo = Math.min(...r);
	const hi = Math.max(...r);
	return lo === hi ? x(lo) : `${x(lo)} - ${x(hi)}`;
};
const summaryRow = (name, kind, runtime) =>
	`| ${name} | ${['Max', 'Full', 'Mini'].map(e => spread(kind, runtime, e)).join(' | ')} |`;

writeFileSync(
	'results.md',
	`# Max against Full and Mini

Max is the full engine with the changes that the operation kept. Max is now the full engine in \`src/\`. Full is the full engine before the changes, at commit \`1152549\`. Mini is the mini engine.

The text of each change and its numbers are in \`finetune-area-1.md\` to \`finetune-area-5.md\`. The tables of every run are in \`runs/\`.

## How to read a table

A speed is a time relative to the fastest engine of the row. The fastest engine in a row is \`1.00x\`. An engine with \`1.26x\` needs 1.26 times as long as the fastest. The last column shows the \`1.00x\` as measured. Use it to get the time back in µs or ns.

A size is in KB. One KB is 1,024 bytes. A difference is outside noise when the 95 % bootstrap interval of the difference does not include zero.

Cold start is the time to load the library and make the first parse in a new process. Hot is the time of one parse after the same process made many parses.

## In short

Each cell is the range over the five workloads of the engine in that row. \`1.00x\` is the fastest of the three engines in each workload.

| | Max | Full | Mini |
|---|---:|---:|---:|
${summaryRow('Cold start, Node', 'cold', 'node')}
${summaryRow('Cold start, Bun', 'cold', 'bun')}
${summaryRow('Hot, Node', 'hot', 'node')}
${summaryRow('Hot, Bun', 'hot', 'bun')}

For a cold start, Full needs ${speedup('cold', 'node')} as long as Max on Node and ${speedup('cold', 'bun')} as long on Bun. When hot, Full needs ${speedup('hot', 'node')} as long as Max on Node and ${speedup('hot', 'bun')} as long on Bun.

The bundle size is in KB. The section Size has more.

| | Max | Full | Mini |
|---|---:|---:|---:|
${sizeRows.join('\n')}

In ${count(max.cold, 'faster')} of ${tasks.length} cold rows and ${count(max.hot, 'faster')} of ${tasks.length} hot rows Max is faster than Full outside noise. In ${count(max.cold, 'slower') + count(max.hot, 'slower')} rows Max is slower.

The tests pass with Max. This holds for \`bun test\` on the sources, on the ESM bundles and on the CJS bundles (2455 pass, as for Full). It holds for the fuzzy tests, the type tests, \`tsc --noEmit\` and \`biome check\`.

A differential test (\`difftest.js\`) gives the same random configs, settings and arguments to Full and to Max. It ran 300,000 cases for the full engine and 300,000 for the mini engine. It compares the error cases too. The result is 0 different cases.

The command \`node run.js --runs 200 --rounds 12 mini max\` made the first run (\`runs/${maxFile}\`). The command \`node run.js --base mini --runs 200 --rounds 12 mini-max\` made the second run (\`runs/${miniFile}\`). Cold start is the median of 200 processes, timed with \`process.hrtime.bigint()\`. Hot is the median of 12 rounds of 400 ms.

Each round makes many parses in one process, after the JIT compiler has optimized the engine. The JIT compiler turns code that runs often into fast machine code. The engines take turns, each in its own process. The 95 % bootstrap intervals are in the run files.

The measurement ran on an ${machine} with ${runtimes}. The code is ${code}. The date is ${date}.

## Cold: load and first parse

| Runtime | Workload | Max | Full | Mini | 1.00x is |
|---|---|---:|---:|---:|---:|
${table('cold', 'µs').join('\n')}

## Hot: one parse

| Runtime | Workload | Max | Full | Mini | 1.00x is |
|---|---|---:|---:|---:|---:|
${table('hot', 'ns').join('\n')}

## Size

The size of the minified ESM bundle (\`bun build --minify\`) in KB. \`argMate\` is the entry \`argmate\`. \`argEngine\` is the entry \`argmate/engine\`. The Mini column holds \`argMateMini\` and \`argEngineMini\`.

| Bundle | Max | Full | Mini |
|---|---:|---:|---:|
${sizeRows.join('\n')}

## Mini with the shared files of Max

The mini engine imports \`compileConfig.ts\` and \`common.ts\`, which Max changes, so its numbers change although its own file does not. \`Mini + Max\` is the mini engine built from the files of Max, and \`Mini\` the mini engine as it is.

### Cold: load and first parse

| Runtime | Workload | Mini + Max | Mini | 1.00x is |
|---|---|---:|---:|---:|
${miniTable('cold', 'µs').join('\n')}

### Hot: one parse

| Runtime | Workload | Mini + Max | Mini | 1.00x is |
|---|---|---:|---:|---:|
${miniTable('hot', 'ns').join('\n')}

### Size

| Bundle | Mini + Max | Mini |
|---|---:|---:|
${miniSize.join('\n')}

## The whole run of a program

This is the time from the start of the command (for example \`node cli.mjs\`) to the end of the command. It includes the start of Node or Bun. The test program parses the \`config\` workload and prints the result (\`node launch.js 200 max\`, \`runs/3AB-launch-max.md\`). The library is a small part of the run because Node needs about 38 ms to start and Bun about 10 ms. The fastest run of a runtime is \`1.00x\`. It is ${best('node')[1]} ms on Node and ${best('bun')[1]} ms on Bun.

${launchTable}

## What the changes are

Each number compares the engine without the change to the engine with the change. The engine with the change is 1.00x. A number of 1.06x means that the engine without the change needs 1.06 times as long.

The table shows a number only where the difference is outside noise. The column Cold, Node is the load and the first parse on Node. The column Hot, Node is one parse on Node. The area documents have every row and its interval.

| Change | Section | What | Cold, Node | Hot, Node |
|---|---|---|---|---|
| Cold blocks in functions | 1Fb, 1Fd, 1Fe | \`exists\`, \`conflict\`, \`demand\`, spots and slices are functions that are called when the config has one. They are compiled when first called, so most parses do not compile them. \`paramValueFromNextOrLast\` gets its state as one object | 1.06x - 1.09x | no change |
| Indexed captures | 4A, 2C | The two parameter regexes have the groups at the same places and the engine reads \`token[1]\` to \`token[6]\`, with no \`groups\` object | no change | 1.15x - 1.44x |
| First character before the number test | 2Ac | \`autoNumber\` returns text that does not start with a digit or a dash at once | 1.02x - 1.05x | 1.02x - 2.98x |
| No regexes in the preprocessing | 2Da | The type, the valid types and the array test are string tests | 1.08x - 1.10x | 1.04x - 1.42x |
| Names and camel case without regexes | 2Db | A name list from a string with no comma, space or dash, and the camel test, are loops | 1.02x | 1.01x - 1.04x |
| Cold blocks of the preprocessing in functions | 2Dc2 | \`spot\`, \`next\`, \`last\`, the list of valid values, \`conflict\` and \`demand\` | 1.01x - 1.02x | no change |
| A fast path for plain digits | 2Af | \`int\` with digits only needs no regex | 1.02x | 1.03x |
| Kebab case with loops | 2Ag | The conversion of an unknown \`--dry-run\` | no change | 1.19x |
| Regexes that nothing uses | 1Da | Six entries of \`re\` removed | 1.01x - 1.03x | 1.02x |

The area documents show the changes that were not kept, with the number that dropped each one. The strongest hot path change that is not in Max is \`2Ae\`. It is a hand-written parser in place of the two parameter regexes. When hot, the regexes need 1.11x - 1.40x as long as \`2Ae\` on both runtimes. At cold start on Bun, \`2Ae\` needs 1.03x - 1.05x as long as the regexes. So \`2Ae\` is not a cold start change.
`
);
console.log(readFileSync('results.md', 'utf8').slice(0, 400));
