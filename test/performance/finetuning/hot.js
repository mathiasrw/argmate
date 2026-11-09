// One process, many parses: the JIT compiler has optimized the engine. Prints ns per parse.
//   node hot.js <bundle folder> <workload> [ms to measure]
import {load} from './lib.js';

const [dir, name, ms = '400'] = process.argv.slice(2);
const parse = await load(dir, name);
const now = process.hrtime.bigint;

let sink = 0;
const time = budget => {
	let n = 0;
	const start = now();
	let elapsed = 0n;
	while (elapsed < BigInt(budget) * 1000000n) {
		for (let i = 0; i < 1000; i++) sink += parse()._.length;
		n += 1000;
		elapsed = now() - start;
	}
	return Number(elapsed) / n;
};

time(300);
console.log(time(+ms).toFixed(1));
if (-1 === sink) console.log(sink);
