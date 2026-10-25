// #18a: Type `json`
// The name `json` was in the list of valid types, but the engines did not have the type. The config was accepted,
// and the parse gave a config error when the user gave the parameter. Now `json` is not a valid type: use `transform`.
import {describe, expect, test} from 'bun:test';
import {argMate, argMateMini} from '../../helper.ts';

// `error` is the callback for input errors and `panic` is the callback for config errors
const settings = {
	error: (msg: string) => {
		throw new Error(`input error: ${msg}`);
	},
	panic: (msg: string) => {
		throw new Error(`config error: ${msg}`);
	},
};

const engines = [
	{name: 'argMate', parse: argMate},
	{name: 'argMateMini', parse: argMateMini},
];

for (const {name, parse} of engines) {
	describe(`#18a json is not a type: ${name}`, () => {
		test('the type gives a config error when ArgMate reads the config', () => {
			expect(() => parse([], {data: {type: 'json'}}, settings)).toThrow('config error');
		});

		test('a string parameter with transform: JSON.parse gives the data', () => {
			const config = {data: {type: 'string', transform: JSON.parse}};
			expect(parse(['--data', '{"a":[1,2]}'], config)).toEqual({_: [], data: {a: [1, 2]}});
		});

		test('text that is not valid JSON gives an input error', () => {
			const config = {data: {type: 'string', transform: JSON.parse}};
			expect(() => parse(['--data', '{a:1'], config, settings)).toThrow('input error');
		});
	});
}
