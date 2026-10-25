// Gives the parse of a workload as a function without arguments, for the engine `full` or `mini`.
import {scenarios} from './scenarios.js';

const bundles = {
	full: {service: './dist/argMate.js', engine: './dist/argEngine.js'},
	mini: {service: './dist/argMateMini.js', engine: './dist/argEngineMini.js'},
};

export async function load(engine, name) {
	const scenario = scenarios[name];
	if (!bundles[engine] || !scenario)
		throw new Error(`Unknown engine '${engine}' or workload '${name}'`);
	const {args, config} = scenario;
	if (scenario.precompiled) {
		const {fresh} = await import('./dist/precompiled.js');
		const {default: argEngine} = await import(bundles[engine].engine);
		return () => argEngine(args, fresh());
	}
	const {default: argMate} = await import(bundles[engine].service);
	return config ? () => argMate(args, config) : () => argMate(args);
}
