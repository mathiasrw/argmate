// One process, many parses: the JIT compiler has optimized the engine. Prints ns per parse.
//   node hot.js <full|mini> <workload> [ms to measure]
import {load} from '../shared/load.js';

const [engine, name, ms = '400'] = process.argv.slice(2);
const parse = await load(engine, name);

let sink = 0;
const time = budget => {
	let n = 0;
	const start = performance.now();
	let now = start;
	while (now - start < budget) {
		for (let i = 0; i < 1000; i++) sink += parse()._.length;
		n += 1000;
		now = performance.now();
	}
	return ((now - start) * 1e6) / n;
};

time(300);
console.log(time(+ms).toFixed(1));
if (-1 === sink) console.log(sink);
