// Writes dist/config.js: the input and the engine config of the workload `config`.
// The engine writes the result to the `output` of the engine config, thus each parse gets a new one from fresh().
import {precompileConfig} from '../../src/compileConfig.ts';

const code = precompileConfig({
	file: {type: 'string', alias: 'f', mandatory: true},
	port: {type: 'int', default: 80, validate: (v: number) => v > 0},
	verbose: {type: 'count', alias: 'v'},
	tag: {type: 'string[]', alias: 't'},
	name: {type: 'string', transform: (v: string) => v.trim()},
	color: {type: 'boolean', default: true},
	ratio: {type: 'number'},
	debug: {type: 'boolean', alias: 'd'},
});

console.log(`const base = ${code};

const arrays = Object.keys(base.output).filter(key => Array.isArray(base.output[key]));

export function fresh() {
	const output = {...base.output};
	for (const key of arrays) output[key] = [];
	return {...base, output};
}

export const args = ['--file', 'a.txt', '--port=8080', '-vv', '-t', 'x', '--tag', 'y', '--name', ' bob ', '--no-color', '--ratio', '1.5', '-d', 'rest1', 'rest2'];

export const plainArgs = ['--foo=bar', '-is', 'foobar', '--no-color', '--port', '--name=x', 'file.txt', '--dry-run', '-n5'];
`);
