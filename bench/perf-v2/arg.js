import hash from 'object-hash';
import arg from 'arg';
// Or: const arg = require('arg');

const x = arg(
	{
		'--foo': String,
		'-i': Boolean,
		'-s': Boolean,
	},
	{
		argv: process.argv.slice(2),
	}
);

console.log(JSON.stringify(x));
console.log(hash(x));
