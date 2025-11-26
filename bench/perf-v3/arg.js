// import iconv from 'iconv-lite';
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
// console.log(iconv.decode(Buffer.from([0x66, 0x6f, 0x6f, 0x62, 0x61, 0x72]), 'win1251'));
