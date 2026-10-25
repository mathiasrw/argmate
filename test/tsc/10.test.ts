// #10: `transform` is not applied
// The tests of the types for this item. The tests of the functions are in test/engine/fix/10.test.ts,
// and test/types/transform-inference.test-d.ts has the types of the value that `transform` gets.
import {describe, expect, test} from 'bun:test';
import {typeErrors} from './helper.ts';

describe('#10 TypeScript: transform', () => {
	// Now the result has the type of the parameter: `size` is a number for tsc, but the value is a string
	test.todo('the result has the return type of transform', () => {
		const code = `
				import argMate from 'argmate';
				const argv = argMate([], {
					size: {type: 'int', mandatory: true, transform: (v: number) => String(v)},
				});
				const size: string = argv.size;
			`;
		expect(typeErrors(code)).toEqual([]);
	}, 10000);

	// The README has this form: `transform: (v) => v.trim()`
	test.todo('a transform with no type on its parameter compiles', () => {
		const code = `
				import argMate from 'argmate';
				argMate([], {name: {type: 'string', transform: v => String(v).trim()}});
			`;
		expect(typeErrors(code)).toEqual([]);
	}, 10000);
});
