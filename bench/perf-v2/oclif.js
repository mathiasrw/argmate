import hash from 'object-hash';
import {Args, Flags, Parser} from '@oclif/core';

const parseResult = await Parser.parse(process.argv.slice(2), {
	args: {
		file: Args.string(),
	},
	flags: {
		foo: Flags.string(),
		i: Flags.boolean({char: 'i'}),
		s: Flags.boolean({char: 's'}),
	},
});

const x = {args: parseResult.args, flags: parseResult.flags};

console.log(JSON.stringify(x));
console.log(hash(x));

// cmdmix 'bun %1.js --foo=bar -s foobar' oclif
