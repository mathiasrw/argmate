(async () => {
	const {Suite} = require('benchmark');
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
	let argMate = (await import('../dist/argMate.js')).default;
	console.timeEnd('argMate');

	console.log('\nBenchmark:');
	const bench = new Suite();
	const args = ['-b', '--bool', '--no-meep', '--multi=baz'];

	bench
		.add('minimist     ', () => minimist(args))
		.add('mri          ', () => mri(args))
		.add('nopt         ', () => nopt(args))
		.add('yargs-parser ', () => yargs(args))
		.add('argMate      ', () => argMate(args))
		.on('cycle', e => console.log(String(e.target)))
		.run();
})();
