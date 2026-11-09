// One process, one parse: the case of a real CLI. Prints µs to load the bundle and µs of the first parse.
// The timer is process.hrtime.bigint(), as it has ns steps on Node and on Bun (3D).
//   node cold.js <bundle folder> <workload>
import path from 'node:path';
import {scenarios} from '../shared/scenarios.js';

const [dir, name] = process.argv.slice(2);
const {args, config, precompiled} = scenarios[name];
const engineConfig = precompiled
	? (await import(path.join(dir, 'precompiled.js'))).fresh()
	: undefined;
const file = path.join(dir, precompiled ? 'argEngine.js' : 'argMate.js');
const now = process.hrtime.bigint;

const start = now();
const {default: parse} = await import(file);
const loaded = now();
const result = precompiled ? parse(args, engineConfig) : config ? parse(args, config) : parse(args);
const parsed = now();

if (!result._) throw new Error('No result');
console.log(
	(Number(loaded - start) / 1000).toFixed(1),
	(Number(parsed - loaded) / 1000).toFixed(1)
);
