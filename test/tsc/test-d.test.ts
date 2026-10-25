// The `.test-d.ts` files in test/types/ are type tests that do not run: they must compile.
// A case that must not compile has `// @ts-expect-error` before it, and tsc gives an error when that case does compile.
import {expect, test} from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import {root} from '../helper.ts';
import {typeErrorsInFile} from './helper.ts';

const dir = 'test/types';

for (const file of fs
	.readdirSync(path.join(root, dir))
	.filter(name => name.endsWith('.test-d.ts'))) {
	test(`${dir}/${file} compiles`, () => {
		expect(typeErrorsInFile(path.join(dir, file))).toEqual([]);
	}, 30000);
}
