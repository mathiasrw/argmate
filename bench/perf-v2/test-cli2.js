const {Suite} = require('benchmark');

re = {
	whitespace: /\s+/,
};

async function runCMD(runtime, script, params) {
	return await Bun.$`${runtime} ${script} ${params}`;
}

async function runCMD2(runtime, script, params) {
	const proc = Bun.spawn([runtime, script, ...params.split(re.whitespace)], {
		stdio: ['ignore', 'ignore', 'ignore'],
	});

	const exitCode = await proc.exited;

	// Clean up the process
	proc.kill();

	// Small delay to prevent resource exhaustion
	await new Promise(resolve => setTimeout(resolve, 1));

	if (exitCode !== 0) {
		throw new Error(`Command failed: "${arguments.join(' ')}"`);
	}
}

function runBenchmarks(runCMD, runtime, args) {
	console.log(
		`\nBenchmark: ${('' + runCMD).replace(/^.*?function (.+)\([\s\S]*$/g, '$1')} ${runtime} ${args}\n`
	);
	const bench = new Suite();
	const params =
		args ||
		(process.argv.slice(2).length ? process.argv.slice(2) : ['--foo=bar', '-is', 'foobar']).join(
			' '
		);

	bench
		/*
	.add('arg                            ', async () => runCMD(runtime, 'arg.js', params))
		.add('commander                      ', async () => runCMD(runtime, 'commander.js', params))
		.add('meow                           ', async () => runCMD(runtime, 'meow.js', params))
		.add('minimist                       ', async () => runCMD(runtime, 'minimist.cjs', params))
		.add('mri                            ', async () => runCMD(runtime, 'mri.cjs', params))
		.add('nopt                           ', async () => runCMD(runtime, 'nopt.js', params))
		.add('oclif                          ', async () => runCMD(runtime, 'oclif.js', params))
		.add('sade                           ', async () => runCMD(runtime, 'sade.js', params))
		.add('yargs-parser                   ', async () => runCMD(runtime, 'yargs-parser.js', params))
		.add('yargs                          ', async () => runCMD(runtime, 'yargs.js', params))
*/
		.add('argmate                        ', async () =>
			runCMD(runtime, 'argmate/argMate.js', params)
		)
		/*	.add('argmate + config               ', async () =>
			runCMD(runtime, 'argmate/argMateConfig.js', params)
		)
		.add('argmate engine + config        ', async () =>
			runCMD(runtime, 'argmate/argMateEngineConfig.js', params)
		)

		.add('argmate mini                   ', async () =>
			runCMD(runtime, 'argmate/argMateMini.js', params)
		)
		.add('argmate mini + config          ', async () =>
			runCMD(runtime, 'argmate/argMateMiniConfig.js', params)
		)
		.add('argmate mini engine + config   ', async () =>
			runCMD(runtime, 'argmate/argMateEngineMiniConfig.js', params)
		)
/*
		.add('argmate exe                    ', async () => runCMD('../../../dist/argMate', '', params))
		.add('argmate mini exe               ', async () =>
			runCMD('../../../dist/argMateMini', '', params)
		)
*/
		.on('cycle', e => console.log(String(e.target)))
		.run({
			cycles: 200,
		});
}

runBenchmarks(runCMD, 'bun', '--foo=bar -is foobar');
runBenchmarks(runCMD, 'node', '--foo=bar -is foobar');

runBenchmarks(runCMD2, 'bun', '--foo=bar -is foobar');
runBenchmarks(runCMD2, 'node', '--foo=bar -is foobar');
