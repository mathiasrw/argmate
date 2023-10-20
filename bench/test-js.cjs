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
	let argMate = (await import('../dist/argMate.mjs')).default;
	console.timeEnd('argMate');

	console.time('argMatePlus');
	let argMatePlus = (await import('../dist/argMatePlus.mjs')).default;
	console.timeEnd('argMatePlus');

	console.time('argMateParamEngine');
	let argMateParamEngine = (await import('../dist/paramEngine.mjs')).default;
	console.timeEnd('argMateParamEngine');

	console.time('argMateParamEnginePlus');
	let argMateParamEnginePlus = (await import('../dist/paramEnginePlus.mjs')).default;
	console.timeEnd('argMateParamEnginePlus');

	console.log('\nBenchmark:');
	const bench = new Suite();
	const args = process.argv.slice(2).length
		? process.argv.slice(2)
		: ['-b', '--bool', '--no-meep', '--multi=baz'];

	argmateGeneratedConfig = {
		"output": {
			"_": [],
			"b": false,
			"bool": false,
			"no-meep": false,
			"multi": "",
		},
		"validate": [],
		"mandatory": [],
		"complexDefault": {
		},
		"conf": {
			"error": (msg) => {
				throw msg;
			},
			"panic": (msg) => {
				throw msg;
			},
			"allowUnknown": true,
			"autoCamelKebabCase": true,
			"allowNegatingFlags": true,
			"allowKeyNumValues": true,
		},
		"params": {
			"b": {
				type: 'boolean'
			},
			"bool": {
				type: 'boolean'
			},
			"no-meep": {
				type: 'boolean'
			},
			"multi": {
				type: 'string'
			},
		},
	}

	bench
		.add('yargs-parser        ', () => yargs(args))
		.add('nopt                ', () => nopt(args))
		.add('minimist            ', () => minimist(args))
		.add('mri                 ', () => mri(args))
		.add('argMatePlus         ', () => argMatePlus(args), {}, {})
		.add('argMatePlus+Config  ', () => argMatePlus(args), { b: false, bool: false, "no-meep": false, multi: '' })
		.add('argMateEngPlus+conf ', () => argMateParamEnginePlus(args, argmateGeneratedConfig))
		.add('argMateEnginePlus   ', () => argMateParamEnginePlus(args))
		.add('argMate             ', () => argMate(args), {}, {})
		.add('argMate+Config  ', () => argMate(args), { b: false, bool: false, "no-meep": false, multi: '' })
		.add('argMateEng+conf ', () => argMateParamEngine(args, argmateGeneratedConfig))
		.add('argMateEngine       ', () => argMateParamEngine(args))
		.on('cycle', e => console.log(String(e.target)))
		.run({
			cycles: 1000,
		});
})();








