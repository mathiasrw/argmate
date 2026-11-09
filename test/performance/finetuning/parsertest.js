// 2Ae: does the hand-written parseToken give the match of re.paramLong and re.paramShort for any string?
//   node parsertest.js [strings]
import {readFileSync} from 'node:fs';

const source = readFileSync(new URL('./variants/2Ae/argEngine.ts', import.meta.url), 'utf8');
const start = source.indexOf('// 2Ae:');
const end = source.indexOf('// A value of unspecified type as a number');
// The TypeScript types are removed by hand: the parser has few of them
const js = source
	.slice(start, end)
	.replace(/\(c: number\)/g, '(c)')
	.replace(/\(s: string, from: number\)/g, '(s, from)')
	.replace(/\(arg: string, long: boolean\): string\[\] \| null/g, '(arg, long)');
const parseToken = new Function(`${js}\nreturn parseToken;`)();

const paramLong = /^(--)$|^-(-)(no-)?([^=\s-]+(?:-[^=\s-]+)*)()(?:(=)|$)/u;
const paramShort = /^-()()()([^=\s-](?:[^=\s-]*?[^=\s\d-])?)(\d*)(?:(=)|$)/u;

const alphabet = [
	'-',
	'-',
	'-',
	'=',
	'=',
	' ',
	'\t',
	' ',
	' ',
	'﻿',
	'\u0085',
	'᠎',
	'a',
	'b',
	'n',
	'o',
	'N',
	'0',
	'1',
	'5',
	'9',
	'é',
	'😀',
	'\u{1F1E9}',
	'\n',
	'.',
	'_',
	'no-',
	'--',
	'no-no-',
];
let seed = 12345;
const rand = n => {
	seed = (seed * 1103515245 + 12345) & 0x7fffffff;
	return seed % n;
};
const total = +(process.argv[2] ?? 2000000);
let bad = 0;
for (let k = 0; k < total; k++) {
	const len = 1 + rand(7);
	let s = rand(4) ? '-' : '';
	if (rand(2)) s += '-';
	for (let i = 0; i < len; i++) s += alphabet[rand(alphabet.length)];
	if (s.charCodeAt(0) !== 45) continue;
	const long = 45 === s.charCodeAt(1);
	const want = (long ? paramLong : paramShort).exec(s);
	const got = parseToken(s, long);
	const norm = m =>
		m
			? [m[0], !!m[1], !!m[2], m[3] || '', m[4] || '', m[5] || '', m[6] || '']
					.map(String)
					.join('\u0001')
			: null;
	const wantN = norm(want);
	const gotN = norm(got);
	if (wantN !== gotN) {
		if (bad++ < 15)
			console.log(
				'DIFFERENT',
				JSON.stringify(s),
				'regex:',
				JSON.stringify(want && [...want]),
				'hand:',
				JSON.stringify(got)
			);
	}
}
console.log(`${total} strings, ${bad} different`);
