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

	console.time('argMateMini');
	let argMateMini = (await import('../dist/argMateMini.js')).default;
	console.timeEnd('argMateMini');

	console.time('argMateArgEngine');
	let argMateArgEngine = (await import('../dist/argEngine.js')).default;
	console.timeEnd('argMateArgEngine');

	console.time('argMateArgEngineMini');
	let argMateArgEngineMini = (await import('../dist/argEngineMini.js')).default;
	console.timeEnd('argMateArgEngineMini');

	console.log('\nBenchmark:');
	const bench = new Suite();
	const args = process.argv.slice(2).length
		? process.argv.slice(2)
		: ['-b', '--bool', '--no-meep', '--multi=baz'];

	argmateGeneratedConfig = {
		output: {
			_: [],
			b: false,
			bool: false,
			'no-meep': false,
			multi: '',
		},
		validate: [],
		mandatory: [],
		complexDefault: {},
		settings: {
			error: msg => {
				throw msg;
			},
			panic: msg => {
				throw msg;
			},
			allowUnknown: true,
			autoCamelKebabCase: true,
			allowNegatingFlags: true,
			allowKeyNumValues: true,
		},
		config: {
			b: {
				type: 'boolean',
			},
			bool: {
				type: 'boolean',
			},
			'no-meep': {
				type: 'boolean',
			},
			multi: {
				type: 'string',
			},
		},
	};

	bench
		.add('yargs-parser        ', () => yargs(args))
		.add('nopt                ', () => nopt(args))
		.add('minimist            ', () => minimist(args))
		.add('mri                 ', () => mri(args))
		.add('argMateMini         ', () => argMateMini(args), {}, {})
		.add('argMateMini+Config  ', () => argMateMini(args), {
			b: false,
			bool: false,
			'no-meep': false,
			multi: '',
		})
		.add('argMateEngMini+settings ', () => argMateArgEngineMini(args, argmateGeneratedConfig))
		.add('argMateEngineMini   ', () => argMateArgEngineMini(args))
		.add('argMate             ', () => argMate(args), {}, {})
		.add('argMate+Config  ', () => argMate(args), {
			b: false,
			bool: false,
			'no-meep': false,
			multi: '',
		})
		.add('argMateEng+settings ', () => argMateArgEngine(args, argmateGeneratedConfig))
		.add('argMateEngine       ', () => argMateArgEngine(args))
		.on('cycle', e => console.log(String(e.target)))
		.run({
			cycles: 1000,
		});
})();
