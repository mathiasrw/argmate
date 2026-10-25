// Gives the tests the build that the environment variable ARGMATE_TEST_TARGET names:
//   src  the TypeScript source in src/ (default)
//   esm  the ESM bundles, through the `import` paths in package.json
//   cjs  the CommonJS bundles, through the `require` paths in package.json
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';
import pkg from '../package.json';

export const root = path.join(import.meta.dir, '..');
export const target = process.env.ARGMATE_TEST_TARGET || 'src';

// The entry points of the package and the file in src/ that each one is built from
export const entryPoints = {
	'.': 'argMate',
	'./engine': 'argEngine',
	'./mini': 'argMateMini',
	'./mini/engine': 'argEngineMini',
	'./info': 'argInfo',
	'./precompile': 'compileConfig',
};

export type EntryPoint = keyof typeof entryPoints;

const require = createRequire(import.meta.url);

async function load(entry: EntryPoint) {
	if (target === 'src') return import(path.join(root, 'src', `${entryPoints[entry]}.ts`));
	if (target === 'esm') return import(path.join(root, pkg.exports[entry].import));
	if (target === 'cjs') {
		// `require` gives the default export, and the named exports are properties of it
		const loaded = require(path.join(root, pkg.exports[entry].require));
		return {...loaded, default: loaded};
	}
	throw new Error(`Unknown ARGMATE_TEST_TARGET '${target}'. Use src, esm or cjs.`);
}

const [full, engine, mini, engineMini, info] = await Promise.all(
	(Object.keys(entryPoints) as EntryPoint[]).map(load)
);

export const argMate = full.default;
export const argMateMini = mini.default;
export const argEngine = engine.default;
export const argEngineMini = engineMini.default;
export const argInfoFormat = info.default;

export const {argInfo, configPreprocessing, precompileConfig} = full;
export const argInfoMini = mini.argInfo;

// Run JavaScript in a new `node` or `bun` process that has the package root as its working directory.
// There the package can load itself by name: `import('argmate/mini')` and `require('argmate/mini')`.
export function run(runtime: 'node' | 'bun', code: string) {
	const result = spawnSync(runtime, ['-e', code], {cwd: root, encoding: 'utf8'});
	return {out: result.stdout.trim(), err: result.stderr.trim(), exit: result.status};
}
