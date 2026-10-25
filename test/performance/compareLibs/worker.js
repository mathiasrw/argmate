// One process for one parser.
//   node worker.js hot <parser>          prints ns for each parse, after the JIT compiler has optimized it
//   node worker.js cold <parser>         prints µs to import the parser and µs of the first parse
//   node worker.js cli <parser> ...args  parses the args and prints the result, as a real CLI
// The parser `baseline` is no parser: it gives the args as they are.
import {libs, workload} from './libs.js';

const [mode, name, ...args] = process.argv.slice(2);
const lib = 'baseline' === name ? {load: async () => argv => ({_: argv})} : libs[name];
if (!lib) throw new Error(`Unknown parser '${name}'`);

if ('cli' === mode) {
	const parse = await lib.load();
	console.log(JSON.stringify(await parse(args)));
} else if ('cold' === mode) {
	const start = performance.now();
	const parse = await lib.load();
	const loaded = performance.now();
	await parse(workload.args);
	const parsed = performance.now();
	console.log(((loaded - start) * 1000).toFixed(1), ((parsed - loaded) * 1000).toFixed(1));
} else if ('hot' === mode) {
	const parse = await lib.load();
	let sink = 0;
	const time = async budget => {
		let n = 0;
		const start = performance.now();
		let now = start;
		while (now - start < budget) {
			if (lib.async) for (let i = 0; i < 100; i++) sink += (await parse(workload.args))._.length;
			else for (let i = 0; i < 100; i++) sink += parse(workload.args)._.length;
			n += 100;
			now = performance.now();
		}
		return ((now - start) * 1e6) / n;
	};
	await time(300);
	console.log((await time(400)).toFixed(1));
	if (-1 === sink) console.log(sink);
} else {
	throw new Error(`Unknown mode '${mode}'`);
}
