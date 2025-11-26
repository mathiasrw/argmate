import hash from 'object-hash';
import minimist from 'minimist';
// Or: const minimist = require('minimist');

const x = minimist(process.argv.slice(2));

console.log(JSON.stringify(x));
console.log(hash(x));
