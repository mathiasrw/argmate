// The workloads. Each one uses only what both engines support: no `--no-` flags, no `-n5` values, no conflicts and no emojis.
// A workload with a `config` goes through `argMate()`. The workload `precompiled` calls the engine with the config from `precompileConfig()`.

const config = {
	file: {type: 'string', alias: 'f', mandatory: true},
	port: {type: 'int', default: 80, validate: v => v > 0},
	verbose: {type: 'count', alias: 'v'},
	tag: {type: 'string[]', alias: 't'},
	name: {type: 'string', transform: v => v.trim()},
	color: {type: 'boolean', default: true},
	ratio: {type: 'number'},
	debug: {type: 'boolean', alias: 'd'},
};

const configArgs = [
	'--file',
	'a.txt',
	'--port=8080',
	'-vv',
	'-t',
	'x',
	'--tag',
	'y',
	'--name',
	' bob ',
	'--ratio',
	'1.5',
	'-d',
	'rest1',
	'rest2',
];

const files = [];
for (let i = 0; i < 500; i++) files.push(`src/dir${i % 20}/file${i}.ts`);

export const scenarios = {
	// No config: a script that reads what it is given
	plain: {args: ['--foo=bar', '-is', 'foobar', '--name=x', 'file.txt', '--dry-run', '-v']},

	// A typical CLI: 8 parameters with types, aliases, defaults, validate, transform and mandatory
	config: {args: configArgs, config},

	// The same CLI with the config compiled at build time, as `argmate/engine` and `argmate/mini/engine` are used
	precompiled: {args: configArgs, config, precompiled: true},

	// A shell glob expanded to 500 files, as `lint src/**/*.ts`
	files: {
		args: ['-v', '--fix', ...files, '--max', '20'],
		config: {verbose: {type: 'count', alias: 'v'}, fix: false, max: {type: 'int', default: 50}},
	},

	// Short flags in groups
	groups: {
		args: ['-vvv', '-abc', '-xyz', '-q'],
		config: {
			v: {type: 'count'},
			a: false,
			b: false,
			c: false,
			x: false,
			y: false,
			z: false,
			q: false,
		},
	},
};
