import hash from 'object-hash';
import mri from 'mri';

const x = mri(process.argv.slice(2));

console.log(JSON.stringify(x));
console.log(hash(x));
