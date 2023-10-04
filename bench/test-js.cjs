(async () => {
	const { Suite } = require('benchmark');
	console.log('Load Times:');

	console.time('nopt');
	const nopt = require('nopt');
	console.timeEnd('nopt');

	console.time('yargs-parser');
	const yargs = require('yargs-parser');
	console.timeEnd('yargs-parser');

	console.time('minimist');
	const minimist = require('minimist');
	console.timeEnd('minimist');

	console.time('mri');
	const mri = require('mri');
	console.timeEnd('mri');

	console.time('argMate');
	let argMate = (await import('../dist/argMate.min.js')).default;
	console.timeEnd('argMate');

	console.log('\nBenchmark:');
	const bench = new Suite();
	const args = ['-b', '--bool', '--no-meep', '--multi=baz'];

	bench
		.add('argMate@0.4.0       ', () => argMate(args))
		.add('mri@1.1.1           ', () => mri(args))
		.add('nopt@5.0.0          ', () => nopt(args))
		.add('minimist@1.2.5      ', () => minimist(args))
		.add('yargs-parser@20.2.9 ', () => yargs(args))
		.on('cycle', e => console.log(String(e.target)))
		.run({
			cycles: 1000
		});
})();


