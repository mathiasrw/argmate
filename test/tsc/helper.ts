// The tests in this directory check the TypeScript types with tsc. They are slow, so they have their own script: test-tsc.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import pkg from '../../package.json';
import {entryPoints, root} from '../helper.ts';

// Run tsc on one file with the settings of the tsconfig.json of the package. Gives the errors of tsc for that file.
function tsc(dir: string, file: string, compilerOptions = {}): string[] {
	const tsconfig = {
		extends: path.join(root, 'tsconfig.json'),
		compilerOptions: {
			noEmit: true,
			typeRoots: [path.join(root, 'node_modules')],
			...compilerOptions,
		},
		files: [file],
	};
	fs.writeFileSync(path.join(dir, 'tsconfig.json'), JSON.stringify(tsconfig));
	const bin = path.join(root, 'node_modules/.bin/tsc');
	const result = spawnSync(bin, ['-p', '.', '--pretty', 'false'], {cwd: dir, encoding: 'utf8'});
	// Keeps the errors in the file, and the errors of tsc that are not in a file (for example: no input found)
	const inFile = `${path.basename(file)}(`;
	return result.stdout
		.split('\n')
		.filter(line => line.includes(inFile) || line.startsWith('error TS'));
}

// Type-check TypeScript code with tsc and get the errors that tsc found in that code, one string for each error.
// The code can import 'argmate', 'argmate/mini', 'argmate/engine' and 'argmate/mini/engine'. They give the source in src/.
// One call takes about a second, so give the test a timeout.
export function typeErrors(code: string): string[] {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'argmate-types-'));
	const paths: Record<string, string[]> = {};
	for (const [entry, file] of Object.entries(entryPoints)) {
		paths[pkg.name + entry.slice(1)] = [path.join(root, 'src', `${file}.ts`)];
	}
	fs.writeFileSync(path.join(dir, 'code.ts'), code);
	const errors = tsc(dir, 'code.ts', {paths});
	fs.rmSync(dir, {recursive: true, force: true});
	return errors;
}

// Type-check a file of the package, for example a `.test-d.ts` file in test/types/. Gives the errors in that file.
export function typeErrorsInFile(file: string): string[] {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'argmate-types-'));
	const errors = tsc(dir, path.join(root, file));
	fs.rmSync(dir, {recursive: true, force: true});
	return errors;
}
