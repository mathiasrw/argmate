// The size of the bundles of both engines.
//   node run.js
import {execSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {writeResults} from '../shared/env.js';
import {relative} from '../shared/stats.js';

process.chdir(import.meta.dirname);
execSync('bash ../shared/build.sh', {stdio: 'inherit'});

const bundles = [
	['argmate/mini', 'argMateMini'],
	['argmate', 'argMate'],
	['argmate/mini/engine', 'argEngineMini'],
	['argmate/engine', 'argEngine'],
];
const size = {};
for (const [name, file] of bundles) {
	const code = readFileSync(`../shared/dist/${file}.js`);
	size[name] = {minified: code.length, gzip: gzipSync(code).length};
}
const base = size['argmate/mini'];

const summary = ['| Import | Minified | gzip |', '|---|---:|---:|'];
const bytes = ['| Import | Bundle | Minified | gzip |', '|---|---|---:|---:|'];
for (const [name, file] of bundles) {
	const {minified, gzip} = size[name];
	summary.push(
		`| \`${name}\` | ${relative(minified, base.minified)} | ${relative(gzip, base.gzip)} |`
	);
	bytes.push(`| \`${name}\` | \`${file}.js\` | ${minified} | ${gzip} |`);
}

writeResults(
	'Engines: size',
	'The bundles of each entry point, built with the flags of `bun run build-esm`. The first table is the size compared to `argmate/mini`: 1.000× is the same size. The second table is in bytes.',
	`${summary.join('\n')}\n\n${bytes.join('\n')}`
);
