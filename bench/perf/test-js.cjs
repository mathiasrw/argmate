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

	console.time('argmate');
	const argmate = (await import('../../dist/argmate.js')).default;
	console.timeEnd('argmate');

	console.time('argmateMini');
	const argmateMini = (await import('../../dist/argmateMini.js')).default;
	console.timeEnd('argmateMini');

	console.time('argmateEngine');
	const argmateEngine = (await import('../../dist/argEngine.js')).default;
	console.timeEnd('argmateEngine');

	console.time('argmateEngineMini');
	const argmateEngineMini = (await import('../../dist/argEngineMini.js')).default;
	console.timeEnd('argmateEngineMini');

	console.log('\nBenchmark:');
	const bench = new Suite();
	const args = process.argv.slice(2).length
		? process.argv.slice(2)
		: ['-b', '--bool', '--no-meep', '--multi=baz'];

	const argmateConfig = {
		b: false,
		bool: false,
		'no-meep': false,
		multi: '',
	};

	const argmateEngineConfig = {
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
	};

	bench
		.add('yargs-parser                   ', () => yargs(args))
		.add('nopt                           ', () => nopt(args))
		.add('minimist                       ', () => minimist(args))
		.add('mri                            ', () => mri(args))

		.add('argmate mini                   ', () => argmateMini(args))
		.add('argmate mini + config          ', () => argmateMini(args), argmateConfig)

		.add('argmate engine mini            ', () => argmateEngineMini(args))
		.add('argmate engine mini + config   ', () => argmateEngineMini(args, argmateEngineConfig))

		.add('argmate                        ', () => argmate(args))
		.add('argmate + config               ', () => argmate(args), argmateConfig)

		.add('argmate engine                 ', () => argmateEngine(args))
		.add('argmate engine + config        ', () => argmateEngine(args, argmateEngineConfig))

		.on('cycle', e => console.log(String(e.target)))
		.run({
			cycles: 1000,
		});
})();
