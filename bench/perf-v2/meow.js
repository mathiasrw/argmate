import hash from 'object-hash';
// meow.js
import meow from 'meow';
// Or: const meow = require('meow'); (but requires Node >=14 for import.meta polyfill)

const x = meow({
	importMeta: import.meta,
});

console.log(JSON.stringify(x));
console.log(hash(x));
