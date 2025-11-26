import hash from 'object-hash';
// sade.js
import sade from 'sade';

const prog = sade('my-cli', true);

prog
	.option('--foo', 'foo option')
	.option('-i', 'i flag')
	.option('-s', 's flag')
	.action(opts => {
		console.log(JSON.stringify(opts));
		console.log(hash(opts));
	});

prog.parse(process.argv);
