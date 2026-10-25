// The same CLI for each parser: --name <string>, -p/--port <number>, -d/--debug (a flag, also --no-debug)
// and -t/--tag <string> (can repeat). Each parser is set up with its own features, as its docs show.
// `load()` imports the parser and gives a parse function. The parse function gives the same form for each parser:
// {name, port, debug, tag, _}, thus the results can be compared.

const norm = (o, _) => ({
	name: o.name,
	port: o.port,
	debug: !!o.debug,
	tag: undefined === o.tag ? [] : [].concat(o.tag),
	_,
});

export const argmateConfig = {
	name: {type: 'string'},
	port: {type: 'number', alias: 'p'},
	debug: {type: 'boolean', alias: 'd'},
	tag: {type: 'string[]', alias: 't'},
};

export const libs = {
	argmate: {
		version: 'src',
		load: async () => {
			const {default: argMate} = await import('../shared/dist/argMate.js');
			return argv => {
				const o = argMate(argv, argmateConfig);
				return norm(o, o._);
			};
		},
	},

	'argmate (precompiled)': {
		version: 'src',
		note: 'The config is compiled at build time with `precompileConfig()`, and the CLI imports `argmate/engine`',
		load: async () => {
			const {fresh} = await import('./dist/precompiled.js');
			const {default: argEngine} = await import('../shared/dist/argEngine.js');
			return argv => {
				const o = argEngine(argv, fresh());
				return norm(o, o._);
			};
		},
	},

	'argmate/mini': {
		version: 'src',
		load: async () => {
			const {default: argMate} = await import('../shared/dist/argMateMini.js');
			return argv => {
				const o = argMate(argv, argmateConfig);
				return norm(o, o._);
			};
		},
	},

	'util.parseArgs': {
		version: 'node',
		note: 'Built into Node and Bun. It has no number type, thus the adapter converts `port` with `Number()`',
		load: async () => {
			const {parseArgs} = await import('node:util');
			return argv => {
				const {values, positionals} = parseArgs({
					args: argv,
					options: {
						name: {type: 'string'},
						port: {type: 'string', short: 'p'},
						debug: {type: 'boolean', short: 'd'},
						tag: {type: 'string', short: 't', multiple: true},
					},
					allowPositionals: true,
					allowNegative: true,
					strict: false,
				});
				return norm(
					{...values, port: undefined === values.port ? undefined : Number(values.port)},
					positionals
				);
			};
		},
	},

	minimist: {
		load: async () => {
			const {default: minimist} = await import('minimist');
			return argv => {
				const o = minimist(argv, {
					string: ['name', 'tag'],
					boolean: ['debug'],
					alias: {p: 'port', d: 'debug', t: 'tag'},
				});
				return norm(o, o._);
			};
		},
	},

	mri: {
		load: async () => {
			const {default: mri} = await import('mri');
			return argv => {
				const o = mri(argv, {
					string: ['name', 'tag'],
					boolean: ['debug'],
					alias: {p: 'port', d: 'debug', t: 'tag'},
				});
				return norm(o, o._);
			};
		},
	},

	'yargs-parser': {
		load: async () => {
			const {default: parser} = await import('yargs-parser');
			return argv => {
				const o = parser(argv, {
					string: ['name', 'tag'],
					number: ['port'],
					boolean: ['debug'],
					alias: {port: ['p'], debug: ['d'], tag: ['t']},
				});
				return norm(o, o._);
			};
		},
	},

	yargs: {
		note: 'With the default `--help` and `--version`',
		load: async () => {
			const {default: yargs} = await import('yargs');
			return argv => {
				const o = yargs(argv)
					.option('name', {type: 'string'})
					.option('port', {type: 'number', alias: 'p'})
					.option('debug', {type: 'boolean', alias: 'd'})
					.option('tag', {type: 'string', alias: 't'})
					.exitProcess(false)
					.parseSync();
				return norm(o, o._);
			};
		},
	},

	commander: {
		note: 'With the default `--help`. `port` uses the option parser `Number`, `tag` a function that collects the values',
		load: async () => {
			const {Command} = await import('commander');
			return argv => {
				const program = new Command()
					.option('--name <name>')
					.option('-p, --port <port>', '', Number)
					.option('-d, --debug')
					.option('--no-debug')
					.option('-t, --tag <tag>', '', (v, list) => list.concat(v), [])
					.allowUnknownOption()
					.allowExcessArguments()
					.exitOverride();
				program.parse(argv, {from: 'user'});
				return norm(program.opts(), program.args);
			};
		},
	},

	meow: {
		note: 'With the default `--help` and `--version`. meow reads the nearest package.json for them',
		load: async () => {
			const {default: meow} = await import('meow');
			return argv => {
				const cli = meow({
					importMeta: import.meta,
					argv,
					flags: {
						name: {type: 'string'},
						port: {type: 'number', shortFlag: 'p'},
						debug: {type: 'boolean', shortFlag: 'd'},
						tag: {type: 'string', shortFlag: 't', isMultiple: true},
					},
				});
				return norm(cli.flags, cli.input);
			};
		},
	},

	arg: {
		load: async () => {
			const {default: arg} = await import('arg');
			return argv => {
				const o = arg(
					{
						'--name': String,
						'--port': Number,
						'--debug': Boolean,
						'--tag': [String],
						'-p': '--port',
						'-d': '--debug',
						'-t': '--tag',
					},
					{argv, permissive: true}
				);
				return norm(
					{name: o['--name'], port: o['--port'], debug: o['--debug'], tag: o['--tag']},
					o._
				);
			};
		},
	},

	nopt: {
		load: async () => {
			const {default: nopt} = await import('nopt');
			return argv => {
				const o = nopt(
					{name: String, port: Number, debug: Boolean, tag: [String, Array]},
					{p: ['--port'], d: ['--debug'], t: ['--tag']},
					argv,
					0
				);
				return norm(o, o.argv.remain);
			};
		},
	},

	sade: {
		note: 'With the default `--help` and `--version`. sade uses mri',
		load: async () => {
			const {default: sade} = await import('sade');
			return argv => {
				const {args} = sade('cli', true)
					.option('--name')
					.option('-p, --port')
					.option('-d, --debug')
					.option('-t, --tag')
					.action(() => {})
					.parse(['node', 'cli', ...argv], {lazy: true});
				const o = args[args.length - 1];
				return norm(o, o._);
			};
		},
	},

	'@oclif/core': {
		async: true,
		note: 'Only the parser of oclif (`Parser.parse`), not a full oclif command. It is async. `tag` has `multipleNonGreedy`, else it takes the files also',
		load: async () => {
			const {Parser, Flags} = await import('@oclif/core');
			return async argv => {
				const r = await Parser.parse(argv, {
					flags: {
						name: Flags.string(),
						port: Flags.integer({char: 'p'}),
						debug: Flags.boolean({char: 'd', allowNo: true}),
						tag: Flags.string({char: 't', multiple: true, multipleNonGreedy: true}),
					},
					strict: false,
				});
				return norm(r.flags, r.argv);
			};
		},
	},
};

// The workload of the speed tests, and the result each parser must give
export const workload = {
	args: ['--name', 'foo', '-p', '8080', '-d', '--tag', 'a', '--tag', 'b', 'a.txt', 'b.txt'],
	expected: {name: 'foo', port: 8080, debug: true, tag: ['a', 'b'], _: ['a.txt', 'b.txt']},
};

// Common inputs on the command line, and what each one must give. Only the fields in `expected` are compared.
export const inputs = [
	['--name foo', {name: 'foo'}],
	['--name=foo', {name: 'foo'}],
	['--name= abc', {name: '', _: ['abc']}],
	['-p 8080', {port: 8080}],
	['-p8080', {port: 8080}],
	['-dp8080', {debug: true, port: 8080}],
	['--tag a --tag b', {tag: ['a', 'b']}],
	['--debug --no-debug', {debug: false}],
	['--port -5', {port: -5}],
	['-- --name foo', {name: undefined, _: ['--name', 'foo']}],
];
