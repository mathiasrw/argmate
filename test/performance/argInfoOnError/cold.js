// Load the precompiled config and make the first parse, in a new process. Prints µs. The engine is loaded before
// the clock starts, as it is the same for both.
//   node cold.js <precompiled|precompiledHelp>
import {argEngine} from '../shared/dist/argMate.js';
import {args} from './config.js';

const start = performance.now();
const {default: config} = await import('./dist/' + process.argv[2] + '.js');
const result = argEngine(args, config);
console.log(((performance.now() - start) * 1000).toFixed(1));
if (!result) console.log(result);
