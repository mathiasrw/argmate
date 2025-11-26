import hash from 'object-hash';
import argMate from '../../../src/argMate.ts';

const x = argMate(process.argv.slice(2), {
	foo: '',
	i: false,
	s: false,
});

console.log(JSON.stringify(x));
console.log(hash(x));
