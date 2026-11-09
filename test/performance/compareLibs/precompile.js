// Writes the engine configs of the precompiled adapters, each made by the precompileConfig() of its own version:
//   dist/precompiled.js      v1, from src/
//   dist/precompiled-v08.js  v0.8, from the published argmate 0.8.5
// The engine writes the result to the output of the engine config, so each parse needs a new one: fresh().
// Run with bun, because it imports the TypeScript of src/.
import {precompileConfig as precompileV08} from 'argmate-v08';
import {precompileConfig} from '../../../src/compileConfig.ts';
import {argmateConfig} from './libs.js';

const write = (file, code) =>
	Bun.write(
		file,
		`const base = ${code};

const arrays = Object.keys(base.output).filter(key => Array.isArray(base.output[key]));

export function fresh() {
	const output = {...base.output};
	for (const key of arrays) output[key] = [];
	return {...base, output};
}
`
	);

await write('dist/precompiled.js', precompileConfig(argmateConfig));
await write('dist/precompiled-v08.js', precompileV08(argmateConfig));
