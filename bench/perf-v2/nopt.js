import hash from 'object-hash';
import nopt from 'nopt';
// Or: const nopt = require('nopt');

const x = nopt({}, {}, process.argv, 2);

//const x = nopt(process.argv.slice(2));

console.log(JSON.stringify(x));
console.log(hash(x));
