const {Suite} = require('benchmark');

async function runCMD(runtime, script, params) {
	return await Bun.$`${runtime} ${script} ${params}`;
}

function runBenchmarks(runtime, params) {
	console.log('\nBenchmark:');
	const bench = new Suite();
	const args = process.argv.slice(2).length
		? process.argv.slice(2)
		: ['-b', '--bool', '--no-meep', '--multi=baz'];

	bench
		.add('yargs-parser                   ', runCMD(runtime, 'yargs.cjs', params))
		.add('nopt                           ', runCMD(runtime, 'nopt.cjs', params))
		.add('minimist                       ', runCMD(runtime, 'minimist.cjs', params))
		.add('mri                            ', runCMD(runtime, 'mri.cjs', params))

		.add('argmate mini                   ', runCMD(runtime, 'argMateMini.cjs', params))
		.add('argmate mini + config          ', runCMD(runtime, 'argMateMiniConfig.cjs', params))

		.add('argmate engine mini            ', runCMD(runtime, 'argMateEngineMini.cjs', params))
		.add('argmate engine mini + config   ', runCMD(runtime, 'argMateEngineMiniConfig.cjs', params))

		.add('argmate                        ', runCMD(runtime, 'argMate.cjs', params))
		.add('argmate + config               ', runCMD(runtime, 'argMateConfig.cjs', params))

		.add('argmate engine                 ', runCMD(runtime, 'argMateEngine.cjs', params))
		.add('argmate engine + config        ', runCMD(runtime, 'argMateEngineConfig.cjs', params))

		.on('cycle', e => console.log(String(e.target)))
		.run({
			cycles: 1000,
		});
}

runBenchmarks('bun', '-b --bool --no-meep --multi=baz');
runBenchmarks('node', '-b --bool --no-meep --multi=baz');
