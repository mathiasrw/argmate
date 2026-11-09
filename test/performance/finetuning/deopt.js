// 5D: when V8 optimizes the engine and when it throws the optimized code away. Node only.
//   bun build --target=node --format=esm ../../../src/argMate.ts ../../../src/argEngine.ts --outdir=dist/readable
//   bun ../shared/gen.ts ../../../src dist/readable
//   node --trace-opt --trace-deopt deopt.js <workload> | grep -E 'argEngine|deoptimiz'
// The bundle is not minified, so the names in the trace are the names in the source.
import path from 'node:path';
import {load} from './lib.js';

const name = process.argv[2];
const parse = await load(path.join(import.meta.dirname, 'dist/readable'), name);
let sink = 0;
for (let i = 0; i < 20000; i++) sink += parse()._.length;
if (-1 === sink) console.log(sink);
