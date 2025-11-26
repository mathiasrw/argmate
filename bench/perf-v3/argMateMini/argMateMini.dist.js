// import iconv from 'iconv-lite';
import argMate from '../../../dist/argMateMini.js';

const x = argMate(process.argv.slice(2));

console.log(JSON.stringify(x));
// console.log(iconv.decode(Buffer.from([0x66, 0x6f, 0x6f, 0x62, 0x61, 0x72]), 'win1251'));
