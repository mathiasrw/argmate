// import iconv from 'iconv-lite';
// meow.js
import meow from 'meow';
// Or: const meow = require('meow'); (but requires Node >=14 for import.meta polyfill)

const x = meow({
	importMeta: import.meta,
});

console.log(JSON.stringify(x));
// console.log(iconv.decode(Buffer.from([0x66, 0x6f, 0x6f, 0x62, 0x61, 0x72]), 'win1251'));
