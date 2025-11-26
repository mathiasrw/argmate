// import iconv from 'iconv-lite';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';

const x = yargs(hideBin(process.argv)).parse();

console.log(JSON.stringify(x));
// console.log(iconv.decode(Buffer.from([0x66, 0x6f, 0x6f, 0x62, 0x61, 0x72]), 'win1251'));
