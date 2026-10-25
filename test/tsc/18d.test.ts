// #18d: Type `boolean[]`
// The tests of the types for this item. The tests of the functions are in test/engine/fix/18d.test.ts.
import {describe, expect, test} from 'bun:test';
import {typeErrors} from './helper.ts';

describe('#18d Type boolean[]: TypeScript', () => {
	// Today the type of the result is `boolean`
	test.todo('the type of the result is boolean[]', () => {
		const code = `
				import argMate from 'argmate';
				const argv = argMate([], {b: {type: 'boolean[]', mandatory: true}});
				const b: boolean[] = argv.b;
			`;
		expect(typeErrors(code)).toEqual([]);
	}, 10000);
});
