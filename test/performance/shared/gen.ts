// Writes the files the benchmarks use to shared/dist/:
//   precompiled.js  the engine config of the workload `config`, from precompileConfig()
//   cli/*.js        small CLIs that parse process.argv with the workload `config` and print the result
// With no arguments it reads ../../../src. A copy of the sources and an output folder can be given, as
// `bun gen.ts <src folder> <out folder>`: the finetuning harness builds each variant of the engine this way.
import path from 'node:path';
import {scenarios} from './scenarios.js';

const [srcDir = '../../../src', outDir = 'dist'] = Bun.argv.slice(2);
const {precompileConfig} = await import(path.resolve(srcDir, 'compileConfig.ts'));

const toCode = (v: unknown): string =>
	'function' === typeof v
		? v.toString()
		: v && 'object' === typeof v
			? '{' +
				Object.entries(v)
					.map(([k, x]) => JSON.stringify(k) + ': ' + toCode(x))
					.join(', ') +
				'}'
			: JSON.stringify(v);

const engineConfig = precompileConfig(scenarios.config.config);

await Bun.write(
	`${outDir}/precompiled.js`,
	`const base = ${engineConfig};

const arrays = Object.keys(base.output).filter(key => Array.isArray(base.output[key]));

// The engine writes the result to the output of the engine config, so each parse needs a new one
export function fresh() {
	const output = {...base.output};
	for (const key of arrays) output[key] = [];
	return {...base, output};
}
`
);

const print = 'console.log(JSON.stringify(argv));\n';
const cli = {
	baseline: `const argv = {_: process.argv.slice(2)};\n${print}`,
	full: `import argMate from '../argMate.js';\nconst argv = argMate(process.argv.slice(2), ${toCode(scenarios.config.config)});\n${print}`,
	mini: `import argMate from '../argMateMini.js';\nconst argv = argMate(process.argv.slice(2), ${toCode(scenarios.config.config)});\n${print}`,
	'full-engine': `import argEngine from '../argEngine.js';\nconst argv = argEngine(process.argv.slice(2), ${engineConfig});\n${print}`,
	'mini-engine': `import argEngine from '../argEngineMini.js';\nconst argv = argEngine(process.argv.slice(2), ${engineConfig});\n${print}`,
};
for (const [name, code] of Object.entries(cli)) await Bun.write(`${outDir}/cli/${name}.js`, code);
