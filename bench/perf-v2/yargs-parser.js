import hash from 'object-hash';
import parser from 'yargs-parser';

const x = parser(process.argv.slice(2));

console.log(JSON.stringify(x));
console.log(hash(x));
