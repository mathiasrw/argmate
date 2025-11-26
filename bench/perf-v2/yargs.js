import hash from 'object-hash';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';

const x = yargs(hideBin(process.argv)).parse();

console.log(JSON.stringify(x));
console.log(hash(x));
