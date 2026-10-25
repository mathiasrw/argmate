// One process, one parse: the case of a real CLI. Prints the time to load the engine and the time of the first parse, in µs.
//   node cold.js <variant> <workload>
const [variant, workload] = process.argv.slice(2);
const {fresh, args, plainArgs} = await import('./dist/config.js');
const engineConfig = 'config' === workload ? fresh() : undefined;
const input = 'config' === workload ? args : plainArgs;

const start = performance.now();
const {default: engine} = await import(`./dist/${variant}.js`);
const loaded = performance.now();
engine(input, engineConfig);
const parsed = performance.now();

console.log(((loaded - start) * 1000).toFixed(1), ((parsed - loaded) * 1000).toFixed(1));
