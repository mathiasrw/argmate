import hash from 'object-hash';
import argMate from '../../../dist/argMateMini.js';

const x = argMate(process.argv.slice(2));

console.log(JSON.stringify(x));
console.log(hash(x));
