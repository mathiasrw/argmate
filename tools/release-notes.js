// Prints the commits since the tag of the release before this one, and opens the page for a new release on GitHub
// with them as the text. `postrelease` runs it after `npm publish` and `git push --tags` (item 45 in context/todo.md).
//   bun tools/release-notes.js
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

const git = (...args) => spawnSync('git', args, {encoding: 'utf8'}).stdout.trim();
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const tag = `v${pkg.version}`;
const before = git('describe', '--tags', '--abbrev=0', `${tag}^`);
const commits = git('log', '--format=- %s', `${before}..${tag}^`);
const repo = pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, '');

console.log(`${tag}, the commits since ${before}:\n\n${commits}\n`);

const page = `${repo}/releases/new?tag=${tag}&title=${tag}&body=${encodeURIComponent(commits)}`;
const open = 'darwin' === process.platform ? 'open' : 'xdg-open';
if (spawnSync(open, [page]).status)
	console.log(`Open this page to make the release on GitHub:\n${page}`);
