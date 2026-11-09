// Builds the bundles of the branch engine and of the variants, and checks them.
//   base       the engine as it is in src/ now
//   <name>     a copy of src/ with variants/<name>.ts laid over argEngine.ts, or with each file of variants/<name>/ laid over the file of the same name
import {execFileSync, spawnSync} from 'node:child_process';
import {
	copyFileSync,
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {scenarios} from '../shared/scenarios.js';

export const here = import.meta.dirname;
const repo = path.resolve(here, '../../..');
const entries = ['argMate', 'argMateMini', 'argEngine', 'argEngineMini'];

export const bundleDir = name => path.join(here, 'dist', name);

export function build(name) {
	// `mini` is the mini engine as a variant, so the full engine, the mini engine and a variant can be measured in one run.
	// `mini-<variant>` is the mini engine built with the files of the variant (it shares compileConfig.ts and common.ts)
	if (/^mini(-|$)/.test(name)) {
		const from = 'mini' === name ? 'base' : name.slice(5);
		const src = build(from);
		const out = bundleDir(name);
		rmSync(out, {recursive: true, force: true});
		cpSync(bundleDir(from), out, {recursive: true});
		copyFileSync(path.join(out, 'argMateMini.js'), path.join(out, 'argMate.js'));
		copyFileSync(path.join(out, 'argEngineMini.js'), path.join(out, 'argEngine.js'));
		cpSync(src, path.join(out, 'src'), {recursive: true});
		return path.join(out, 'src');
	}
	const out = bundleDir(name);
	rmSync(out, {recursive: true, force: true});
	mkdirSync(out, {recursive: true});
	let src = path.join(repo, 'src');
	if ('base' !== name) {
		src = path.join(out, 'src');
		cpSync(path.join(repo, 'src'), src, {recursive: true});
		const file = path.join(here, 'variants', name + '.ts');
		const folder = path.join(here, 'variants', name);
		if (existsSync(file)) copyFileSync(file, path.join(src, 'argEngine.ts'));
		else if (existsSync(folder)) cpSync(folder, src, {recursive: true});
		else
			throw new Error(
				`No variant '${name}': make variants/${name}.ts or the folder variants/${name}/`
			);
	}
	// variants/<name>/flags.txt: the flags of the build, one a line, in place of --minify (for 1C)
	const flagFile = path.join(here, 'variants', name, 'flags.txt');
	const flags = existsSync(flagFile)
		? readFileSync(flagFile, 'utf8').split('\n').filter(Boolean)
		: ['--minify'];
	execFileSync(
		'bun',
		[
			'build',
			'--target=node',
			'--format=esm',
			...entries.map(entry => path.join(src, entry + '.ts')),
			'--outdir=' + out,
			...flags,
			'--sourcemap=none',
		],
		{stdio: 'inherit'}
	);
	execFileSync('bun', [path.join(here, '../shared/gen.ts'), src, out], {stdio: 'inherit'});
	return src;
}

// A variant goes to the benchmark only when the tests pass with it: the tests run on a copy of the repo with the sources of the variant
export function test(name) {
	// Outside the repo: the tests are in a folder of the repo, and a folder can not be copied into itself
	const tmp = mkdtempSync(path.join(tmpdir(), 'argmate-finetuning-'));
	cpSync(path.join(bundleDir(name), 'src'), path.join(tmp, 'src'), {recursive: true});
	cpSync(path.join(repo, 'test'), path.join(tmp, 'test'), {
		recursive: true,
		filter: from => !path.relative(path.join(repo, 'test'), from).startsWith('performance'),
	});
	for (const file of [
		'package.json',
		'tsconfig.json',
		'README.md',
		'SPEC.md',
		'jsr.json',
		'biome.json',
	])
		copyFileSync(path.join(repo, file), path.join(tmp, file));
	symlinkSync(path.join(repo, 'node_modules'), path.join(tmp, 'node_modules'));
	const result = spawnSync(
		'bun',
		['test', '--bail', '--timeout', '500', '--path-ignore-patterns', 'test/{tsc,engine/fuzzy}/**'],
		{cwd: tmp, encoding: 'utf8', env: {...process.env, CLAUDECODE: '1', ARGMATE_TEST_TARGET: 'src'}}
	);
	rmSync(tmp, {recursive: true, force: true});
	return {ok: 0 === result.status, output: (result.stdout || '') + (result.stderr || '')};
}

// The parse of a workload as a function without arguments, for the bundles in a folder
export async function load(dir, name) {
	const {args, config, precompiled} = scenarios[name];
	if (precompiled) {
		const {fresh} = await import(path.join(dir, 'precompiled.js'));
		const {default: argEngine} = await import(path.join(dir, 'argEngine.js'));
		return () => argEngine(args, fresh());
	}
	const {default: argMate} = await import(path.join(dir, 'argMate.js'));
	return config ? () => argMate(args, config) : () => argMate(args);
}

// The benchmarks compare the time of the same work, so the variant must give the result of the branch engine
export async function sameResults(baseDir, variantDir) {
	const problems = [];
	for (const name of Object.keys(scenarios)) {
		const a = (await load(baseDir, name))();
		const b = (await load(variantDir, name))();
		if (!isDeepStrictEqual(a, b))
			problems.push(`${name}: ${JSON.stringify({base: a, variant: b})}`);
	}
	return problems;
}
