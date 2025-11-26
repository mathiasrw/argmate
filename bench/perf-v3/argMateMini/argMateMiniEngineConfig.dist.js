// import iconv from 'iconv-lite';
import argMate from '../../../dist/argEngineMini.js';

const x = argMate((process?.argv).slice(2), {
	output: {
		_: [],
		foo: '',
		i: false,
		s: false,
	},
	validate: [],
	mandatory: [],
	conflict: [],
	complexDefault: {},
	config: {
		foo: {
			type: 'string',
		},
		i: {
			type: 'boolean',
		},
		s: {
			type: 'boolean',
		},
	},
	settings: {
		error: msg => {
			throw msg;
		},
		panic: msg => {
			throw msg;
		},
		allowUnknown: true,
		autoCamelKebabCase: true,
		allowNegatingFlags: true,
		allowKeyNumValues: true,
	},
});

console.log(JSON.stringify(x));
// console.log(iconv.decode(Buffer.from([0x66, 0x6f, 0x6f, 0x62, 0x61, 0x72]), 'win1251'));
