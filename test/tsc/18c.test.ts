// #18c: Types `bool` and `bool[]`
// The tests of the types for this item. The tests of the functions are in test/engine/fix/18c.test.ts.
import {describe, expect, test} from 'bun:test';
import {typeErrors} from './helper.ts';

describe('#18c bool[] is the same type as boolean[]: TypeScript types', () => {
	// Today the type of the result is `boolean`
	test.todo('TypeScript: the type of the result is boolean[]', () => {
		const code = `
				import argMate from 'argmate';
				const argv = argMate([], {b: {type: 'bool[]', mandatory: true}});
				const b: boolean[] = argv.b;
			`;
		expect(typeErrors(code)).toEqual([]);
	}, 10000);
});
