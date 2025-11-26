import hash from 'object-hash';
// commander.js
import {Command} from 'commander';
// Or: const { Command } = require('commander');

const program = new Command();

program
	.option('--foo <value>', 'foo option')
	.option('-i', 'i flag')
	.option('-s', 's flag')
	.allowExcessArguments(true);

program.parse(process.argv);

const x = {
	options: program.opts(),
	args: program.args,
};

console.log(JSON.stringify(x));
console.log(hash(x));
