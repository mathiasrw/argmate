// import iconv from 'iconv-lite';
// sade.js
import sade from 'sade';

const prog = sade('my-cli', true);

prog
	.option('--foo', 'foo option')
	.option('-i', 'i flag')
	.option('-s', 's flag')
	.action(x => {
		console.log(JSON.stringify(x));
		// console.log(iconv.decode(Buffer.from([0x66, 0x6f, 0x6f, 0x62, 0x61, 0x72]), 'win1251'));
	});

prog.parse(process.argv);
