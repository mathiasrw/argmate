// Both engines must give the same result for each workload, and the CLIs the same output. Else the benchmarks compare different work.
import {spawnSync} from 'node:child_process';
import {isDeepStrictEqual} from 'node:util';
import {load} from './load.js';
import {scenarios} from './scenarios.js';

process.chdir(import.meta.dirname);
const problems = [];
for (const name of Object.keys(scenarios)) {
	const full = (await load('full', name))();
	const mini = (await load('mini', name))();
	if (!isDeepStrictEqual(full, mini)) problems.push(`${name}: ${JSON.stringify({full, mini})}`);
}

const outputs = {};
for (const cli of ['full', 'mini', 'full-engine', 'mini-engine']) {
	for (const runtime of ['node', 'bun']) {
		const result = spawnSync(runtime, [`dist/cli/${cli}.js`, ...scenarios.config.args], {
			encoding: 'utf8',
		});
		outputs[`${runtime} ${cli}`] = result.stdout + result.stderr;
	}
}
const first = Object.values(outputs)[0];
for (const [run, out] of Object.entries(outputs)) {
	if (out !== first) problems.push(`${run}: ${out}`);
}

if (problems.length) {
	console.error('full and mini do not give the same results:\n' + problems.join('\n'));
	process.exit(1);
}
