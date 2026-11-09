// Checks the package as npm gives it to the users (items 43 and 45 in context/todo.md). Run `bun run build` first.
//   bun test/package/run.js
// 1. `npm pack`: only the files of the package, each file that package.json names, no dependencies, a small size
// 2. publint and attw on the package
// 3. A new project installs the package, and uses each entry point with `import` and `require`
//    in Node, Bun and Deno, after a bundler, and in TypeScript.
// It uses the `node` of the PATH, so the CI runs it with each Node version of its matrix. publint (Node 18+) and attw
// (Node 20+) check the package and not the Node of the users, so they run with Bun.
import {spawnSync} from 'node:child_process';
import {existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..', '..');
const bin = name => path.join(root, 'node_modules', '.bin', name);
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const maxSize = 500 * 1024;

const tmp = mkdtempSync(path.join(tmpdir(), 'argmate-pack-'));
const project = path.join(tmp, 'project');
const failures = [];

const run = (command, args, cwd = root) => {
	const result = spawnSync(command, args, {cwd, encoding: 'utf8'});
	return {
		out: (result.stdout || '').trim(),
		err: (result.stderr || '').trim(),
		exit: result.status,
	};
};
const check = (name, ok, details = '') => {
	console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
	if (!ok) failures.push(details ? `${name}\n${details}` : name);
};
const has = command => 0 === spawnSync(command, ['--version'], {encoding: 'utf8'}).status;

if (!existsSync(path.join(root, 'dist'))) {
	console.error('No dist/. Run `bun run build` first.');
	process.exit(1);
}

// 1. The package
// `npm pack <folder>` writes the tarball to the folder it runs in. `--pack-destination` is not in the npm of Node 15.
const packed = run('npm', ['pack', '--json', root], tmp);
const [info] = JSON.parse(packed.out.slice(packed.out.indexOf('[')));
const tarball = path.join(tmp, info.filename);
const files = info.files.map(file => file.path);

const strange = files.filter(file => !/^(package\.json|README\.md|LICENSE|dist\/.+)$/.test(file));
check(
	'The package has only package.json, README.md, LICENSE and dist/',
	0 === strange.length,
	strange.join('\n')
);

const leaves = value =>
	'string' === typeof value ? [value] : Object.values(value).flatMap(leaves);
const named = [pkg.main, pkg.module, pkg.types, ...leaves(pkg.exports)].map(file =>
	file.replace(/^\.\//, '')
);
const missing = [...new Set(named)].filter(file => !files.includes(file));
check(
	'Each file that main, module, types and exports name is in the package',
	0 === missing.length,
	missing.join('\n')
);

check(
	'The package has no dependencies',
	!Object.keys(pkg.dependencies || {}).length,
	JSON.stringify(pkg.dependencies)
);
check(
	`The unpacked size is below ${maxSize / 1024} KB (${(info.unpackedSize / 1024).toFixed(0)} KB)`,
	info.unpackedSize < maxSize
);

// 2. publint and attw
const publint = run('bun', [bin('publint')]);
check('publint gives no errors', 0 === publint.exit, publint.out + publint.err);

// The types are one file for ESM and CommonJS (item 20), so attw ignores these two rules until item 20 is done:
// internal-resolution-error (dist/types.d.ts imports files that are not in the package)
// false-esm (the types of `require` are ESM)
const attw = run('bun', [
	bin('attw'),
	tarball,
	'--profile',
	'node16',
	'--ignore-rules',
	'internal-resolution-error',
	'false-esm',
	'--format',
	'table-flipped',
]);
check('attw gives no errors (but the two rules of item 20)', 0 === attw.exit, attw.out + attw.err);

// 3. A new project that installs the package
writeFileSync(path.join(tmp, 'package.json'), '{}');
run('mkdir', ['-p', project]);
writeFileSync(
	path.join(project, 'package.json'),
	JSON.stringify({name: 'argmate-pack-test', private: true})
);
const install = run(
	'npm',
	['install', tarball, '--no-audit', '--no-fund', '--ignore-scripts', '--no-package-lock'],
	project
);
check('npm installs the package in a new project', 0 === install.exit, install.err);

// The exports of each entry point (as in test/misc/entry-points.test.ts), and the result of a parse
const entries = {
	argmate: ['default', 'argEngine', 'argInfo', 'configPreprocessing', 'precompileConfig'],
	'argmate/engine': ['default'],
	'argmate/mini': ['default', 'argEngine', 'argInfo', 'configPreprocessing', 'precompileConfig'],
	'argmate/mini/engine': ['default'],
	'argmate/info': ['default', 'argInfoFormat'],
	'argmate/precompile': ['configPreprocessing', 'precompileConfig'],
};
const parses = ['argmate', 'argmate/engine', 'argmate/mini', 'argmate/mini/engine'];
const expected = JSON.stringify({
	exports: entries,
	parse: Object.fromEntries(parses.map(name => [name, {_: ['bar'], foo: true}])),
});

const report = `(main, named) => [
	...(typeof main === 'function' ? ['default'] : []),
	...Object.keys(named).filter(key => key !== 'default' && typeof named[key] === 'function').sort(),
]`;
writeFileSync(
	path.join(project, 'esm.mjs'),
	`const report = ${report};
const found = {};
const parsed = {};
for (const name of ${JSON.stringify(Object.keys(entries))}) {
	const m = await import(name);
	found[name] = report(m.default, m);
}
for (const name of ${JSON.stringify(parses)}) parsed[name] = (await import(name)).default(['--foo', 'bar']);
console.log(JSON.stringify({exports: found, parse: parsed}));
`
);
writeFileSync(
	path.join(project, 'cjs.cjs'),
	`const report = ${report};
const found = {};
const parsed = {};
for (const name of ${JSON.stringify(Object.keys(entries))}) found[name] = report(require(name), require(name));
for (const name of ${JSON.stringify(parses)}) parsed[name] = require(name)(['--foo', 'bar']);
console.log(JSON.stringify({exports: found, parse: parsed}));
`
);

const node = run('node', ['--version']).out;
const runtimes = [['node', [], `Node ${node}`]];
if (has('bun')) runtimes.push(['bun', [], 'Bun']);
if (has('deno')) runtimes.push(['deno', ['run', '--allow-read', '--allow-env'], 'Deno']);
else console.log('skip Deno is not installed');

for (const [command, args, label] of runtimes) {
	for (const [file, how] of [
		['esm.mjs', 'import'],
		['cjs.cjs', 'require'],
	]) {
		const result = run(command, [...args, file], project);
		check(
			`${label}: ${how} gives each export and parses`,
			result.out === expected,
			result.out + result.err
		);
	}
}

// A bundler makes one file of the project, and Node runs it
const bundle = run(
	'bun',
	['build', 'esm.mjs', '--target', 'node', '--outfile', 'bundle.mjs'],
	project
);
const bundled = run('node', ['bundle.mjs'], project);
check(
	'After a bundler (bun build): import gives each export and parses',
	0 === bundle.exit && bundled.out === expected,
	bundle.err + bundled.out + bundled.err
);

// TypeScript finds types for each entry point with `moduleResolution` node16 and bundler (with `strict`, a missing types
// file is an error), and the result of `argmate` has its type. Until item 20 each entry point has the types of
// `argmate`, so only `argmate` is called, and `skipLibCheck` is true because dist/types.d.ts has errors.
writeFileSync(
	path.join(project, 'check.mts'),
	`import argMate, {precompileConfig} from 'argmate';
import * as mini from 'argmate/mini';
import * as engine from 'argmate/engine';
import * as miniEngine from 'argmate/mini/engine';
import * as info from 'argmate/info';
import * as precompile from 'argmate/precompile';

const result: {_: (string | number)[]; foo?: string} = argMate(['--foo', 'bar'], {foo: {type: 'string'}});
const code: string = precompileConfig({foo: {type: 'string'}});
console.log(result, code, mini, engine, miniEngine, info, precompile);
`
);
for (const [moduleOption, resolution] of [
	['node16', 'node16'],
	['esnext', 'bundler'],
]) {
	writeFileSync(
		path.join(project, `tsconfig.${resolution}.json`),
		JSON.stringify({
			compilerOptions: {
				module: moduleOption,
				moduleResolution: resolution,
				target: 'es2022',
				strict: true,
				noEmit: true,
				skipLibCheck: true,
				types: [],
			},
			files: ['check.mts'],
		})
	);
	const tsc = run(bin('tsc'), ['-p', `tsconfig.${resolution}.json`], project);
	check(
		`TypeScript (moduleResolution ${resolution}) finds the types`,
		0 === tsc.exit,
		tsc.out + tsc.err
	);
}

if (failures.length) {
	console.error(
		`\n${failures.length} checks failed. The project is in ${tmp}\n\n${failures.join('\n\n')}`
	);
	process.exit(1);
}
rmSync(tmp, {recursive: true, force: true});
console.log(`\nThe package ${info.name}@${info.version} is good.`);
