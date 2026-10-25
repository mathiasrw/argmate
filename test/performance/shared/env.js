// Writes results.md of a benchmark: what it measures, the machine and versions, and the tables.
import {execSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';

const sh = command => {
	try {
		return execSync(command, {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim();
	} catch {
		return '';
	}
};

export function environment() {
	const pkg = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'));
	const changes = sh('git status --porcelain -- ../../../src')
		? ' + changes that are not committed'
		: '';
	return [
		`- Machine: ${sh('sysctl -n machdep.cpu.brand_string') || sh('uname -m')}`,
		`- Node ${process.version}, Bun v${sh('bun -v')}`,
		`- argmate v${pkg.version}, branch \`${sh('git branch --show-current')}\`, \`${sh('git rev-parse --short HEAD')}\`${changes}`,
		`- Date: ${sh("date '+%Y-%m-%d %H:%M'")}`,
	].join('\n');
}

export function writeResults(title, about, body) {
	writeFileSync('results.md', `# ${title}\n\n${about}\n\n${environment()}\n\n${body.trim()}\n`);
	console.log(`Results saved to ${process.cwd()}/results.md`);
}
