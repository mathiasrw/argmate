// #18b: Type `split`
// The name `split` was in the list of valid types, but there was no code and no documentation for it.
// Now `split` is not a valid type: use `transform`.
import {describe, expect, test} from 'bun:test';
import {argMate, argMateMini} from '../../helper.ts';

// `panic` is the callback for config errors
const settings = {
	panic: (msg: string) => {
		throw new Error(`config error: ${msg}`);
	},
};

const split = (v: string) => v.split(/[,;\n]/);

const engines = [
	{name: 'argMate', parse: argMate},
	{name: 'argMateMini', parse: argMateMini},
];

for (const {name, parse} of engines) {
	describe(`#18b split is not a type: ${name}`, () => {
		test('the type gives a config error when ArgMate reads the config', () => {
			expect(() => parse([], {tags: {type: 'split'}}, settings)).toThrow('config error');
		});

		test('a string parameter with transform gives the array', () => {
			const config = {tags: {type: 'string', transform: split}};
			expect(parse(['--tags', 'a,b;c'], config)).toEqual({_: [], tags: ['a', 'b', 'c']});
		});
	});
}
