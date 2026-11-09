// One process, many parses, after the JIT compiler has optimized the code. Prints ns per parse.
//   node hot.js <variant>
import {variants} from './variants.js';

const parse = variants[process.argv[2]];
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
console.log(time(400).toFixed(1));
if (-1 === sink) console.log(sink);
