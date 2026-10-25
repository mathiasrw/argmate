// Parses the input of a workload N times with one variant of the engine.
//   node run.js <variant> <workload> [N]     workload: config | plain
const [variant, workload, times = '1'] = process.argv.slice(2);
const {default: engine} = await import(`./dist/${variant}.js`);
const {fresh, args, plainArgs} = await import('./dist/config.js');

let sink = 0;
const n = +times;
if ('config' === workload) {
	for (let i = 0; i < n; i++) sink += engine(args, fresh())._.length;
} else if ('plain' === workload) {
	for (let i = 0; i < n; i++) sink += engine(plainArgs)._.length;
} else {
	throw new Error(`Unknown workload '${workload}'`);
}
if (process.env.SHOW) console.log(sink);
