import argMate from '../../../dist/argMate.js';
import hash from 'object-hash';

const x = argMate(process.argv.slice(2));

console.log(JSON.stringify(x));
console.log(hash(x));
