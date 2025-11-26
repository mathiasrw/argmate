import pkg from 'benchmark';
const {Suite} = pkg;
import nopt from 'nopt';
import yargsParser from 'yargs-parser';
import minimist from 'minimist';
import mri from 'mri';
import argmate from '../../dist/argmate.js';
import argmateMini from '../../dist/argmateMini.js';
import argmateEngine from '../../dist/argEngine.js';
import argmateEngineMini from '../../dist/argEngineMini.js';
import arg from 'arg';
import {Command} from 'commander';
import meow from 'meow';
import {Args, Flags, Parser} from '@oclif/core';
import sade from 'sade';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';

console.log('\nBenchmark:');
const bench = new Suite();
const args = process.argv.slice(2).length ? process.argv.slice(2) : ['--foo=bar', '-is', 'foobar'];

const argmateConfig = {
	i: false,
	s: false,
	foo: '',
	name: '',
	multi: '',
	key: '',
	meep: true,
	blatzk: '',
	many1: '',
};

const argmateEngineConfig = {
	output: {
		_: [],
		i: false,
		s: false,
		foo: '',
		name: '',
		multi: '',
		key: '',
		meep: true,
		blatzk: '',
		many1: '',
	},
	validate: [],
	mandatory: [],
	conflict: [],
	complexDefault: {},
	config: {
		i: {
			type: 'boolean',
			key: 'i',
		},
		s: {
			type: 'boolean',
			key: 's',
		},
		foo: {
			type: 'string',
			key: 'foo',
		},
		name: {
			type: 'string',
			key: 'name',
		},
		multi: {
			type: 'string',
			key: 'multi',
		},
		key: {
			type: 'string',
			key: 'key',
		},
		meep: {
			type: 'boolean',
			key: 'meep',
		},
		blatzk: {
			type: 'string',
			key: 'blatzk',
		},
		many1: {
			type: 'string',
			key: 'many1',
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

// arg setup - expanded to handle more options
const argConfig = {
	'--foo': String,
	'-i': Boolean,
	'-s': Boolean,
	'--name': String,
	'-c': Boolean,
	'-a': Boolean,
	'-t': Boolean,
	'-s': Boolean,
	'-w': Boolean,
	'-o': Boolean,
	'-o': Boolean,
	'--multi': String,
	'--key': String,
	'--no-meep': Boolean,
	'--blatzk': String,
	'-f': Boolean,
	'-p': Boolean,
	'--many1': String,
	'-n': String,
	'-m': String,
	'-e': String,
	'-b': Boolean,
	'-j': Boolean,
	'-k': Boolean,
	'-l': Boolean,
	'-g': Boolean,
	'-h': Boolean,
	'-i': Boolean,
};

const commanderProgram = new Command();
commanderProgram
	.option('--foo <value>', 'foo option')
	.option('-i', 'i flag')
	.option('-s', 's flag')
	.option('--name <value>', 'name option')
	.option('--multi <value>', 'multi option')
	.option('--key <value>', 'key option')
	.option('--no-meep', 'no-meep flag')
	.option('--blatzk <value>', 'blatzk option')
	.option('--many1 <value>', 'many1 option')
	.allowExcessArguments(true);

const oclifConfig = {
	args: {
		file: Args.string(),
	},
	flags: {
		foo: Flags.string(),
		i: Flags.boolean({char: 'i'}),
		s: Flags.boolean({char: 's'}),
		name: Flags.string(),
		multi: Flags.string(),
		key: Flags.string(),
		'no-meep': Flags.boolean(),
		blatzk: Flags.string(),
		many1: Flags.string(),
	},
};

const sadeProgram = sade('my-cli', true);
sadeProgram
	.option('--foo', 'foo option')
	.option('-i', 'i flag')
	.option('-s', 's flag')
	.option('--name', 'name option')
	.option('--multi', 'multi option')
	.option('--key', 'key option')
	.option('--no-meep', 'no-meep flag')
	.option('--blatzk', 'blatzk option')
	.option('--many1', 'many1 option')
	.action(() => {});

bench
	.add('arg                            ', () => arg(argConfig, {argv: args}))
	.add('commander                      ', () => {
		commanderProgram.parse(['node', 'test', ...args]);
		return commanderProgram.opts();
	})
	.add('meow                           ', () => {
		const result = meow({
			importMeta: import.meta,
			argv: args,
		});
		return result.flags;
	})
	.add('minimist                    ', () => minimist(args))
	.add('mri                         ', () => mri(args))
	.add('nopt                        ', () => nopt(args))
	.add('oclif                       ', () => Parser.parse(args, oclifConfig).flags)
	.add('sade                        ', () => {
		sadeProgram.parse(['node', 'test', ...args]);
		return {};
	})
	.add('yargs                       ', () => yargs(args).parse())
	.add('yargs-parser                ', () => yargsParser(args))

	.add('argmate                     ', () => argmate(args))
	.add('argmate + config            ', () => argmate(args), argmateConfig)
	.add('argmate engine              ', () => argmateEngine(args))
	.add('argmate engine + config     ', () => argmateEngine(args, argmateEngineConfig))
	.add('argmate engine mini         ', () => argmateEngineMini(args))
	.add('argmate engine mini + config', () => argmateEngineMini(args, argmateEngineConfig))
	.add('argmate mini                ', () => argmateMini(args))
	.add('argmate mini + config       ', () => argmateMini(args), argmateConfig)

	.on('cycle', e => console.log(String(e.target)))
	.run({
		cycles: 100,
	});
