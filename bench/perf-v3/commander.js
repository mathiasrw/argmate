// import iconv from 'iconv-lite';
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
// console.log(iconv.decode(Buffer.from([0x66, 0x6f, 0x6f, 0x62, 0x61, 0x72]), 'win1251'));
