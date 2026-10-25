// One process, one parse: the case of a real CLI. Prints µs to load the bundle and µs of the first parse.
//   node cold.js <full|mini> <workload>
import {scenarios} from '../shared/scenarios.js';

const [engine, name] = process.argv.slice(2);
const {args, config, precompiled} = scenarios[name];
const engineConfig = precompiled
	? (await import('../shared/dist/precompiled.js')).fresh()
	: undefined;
const file = {
	full: precompiled ? '../shared/dist/argEngine.js' : '../shared/dist/argMate.js',
	mini: precompiled ? '../shared/dist/argEngineMini.js' : '../shared/dist/argMateMini.js',
}[engine];

const start = performance.now();
const {default: parse} = await import(file);
const loaded = performance.now();
const result = precompiled ? parse(args, engineConfig) : config ? parse(args, config) : parse(args);
const parsed = performance.now();

if (!result._) throw new Error('No result');
console.log(((loaded - start) * 1000).toFixed(1), ((parsed - loaded) * 1000).toFixed(1));
