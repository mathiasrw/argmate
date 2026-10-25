// #30: An engine config works for one parse only
// The engine writes each result to the one `output` object of the engine config (the result of
// `configPreprocessing` or `precompileConfig`). Thus a second parse has the values of the first parse.
import {describe, expect, test} from 'bun:test';
import {argEngine, argEngineMini, configPreprocessing, precompileConfig} from '../../helper.ts';

const config = () => ({file: {type: 'string', alias: 'f'}});

const engines = [
	{name: 'argEngine', engine: argEngine},
	{name: 'argEngineMini', engine: argEngineMini},
];

for (const {name, engine} of engines) {
	describe(`#30 One engine config for two parses: ${name}`, () => {
		test.todo('the second parse gives the same result as the first', () => {
			const engineConfig = configPreprocessing(config());
			const first = engine(['-f', 'a.sql', 'x'], engineConfig);
			const second = engine(['-f', 'a.sql', 'x'], engineConfig);
			expect([first, second]).toEqual([
				{_: ['x'], file: 'a.sql'},
				{_: ['x'], file: 'a.sql'},
			]);
		});

		test.todo('the second parse does not have the values of the first parse', () => {
			const engineConfig = configPreprocessing(config());
			const first = engine(['-f', 'a.sql'], engineConfig);
			const second = engine([], engineConfig);
			expect([first, second]).toEqual([{_: [], file: 'a.sql'}, {_: []}]);
		});

		test.todo('the second parse with the code from precompileConfig gives the same result', () => {
			const engineConfig = new Function(`return ${precompileConfig(config())}`)();
			const first = engine(['-f', 'a.sql', 'x'], engineConfig);
			const second = engine(['-f', 'a.sql', 'x'], engineConfig);
			expect([first, second]).toEqual([
				{_: ['x'], file: 'a.sql'},
				{_: ['x'], file: 'a.sql'},
			]);
		});
	});
}
