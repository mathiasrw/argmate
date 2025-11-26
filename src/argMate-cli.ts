import argMate from './argMate.js';

const x = argMate(process.argv.slice(2));

console.log(JSON.stringify(x));
