// bun --inspect-brk test/manual.js      --no-foo bar --foo2 bar2

import argMate, { helpText } from '../src/argMate.js';

console.log(argMate(process.argv.slice(2), {
	foo: { type: 'string' },
	foo2: { type: 'string' },
}, { intro: "what is going on?", outro: "Vi ses!" }));

console.log(helpText());



/*0 && argMate('--foo bar --foo2 bar2'.trim().split(/\s+/), {
	foo: { type: 'string' },
	foo2: { type: 'string' },
});*/