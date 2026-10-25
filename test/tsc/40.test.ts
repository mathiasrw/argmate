// #40: `validate` can be a regular expression
// The tests of the types for this item. The tests of the functions are in test/engine/fix/40.test.ts.
import {describe, expect, test} from 'bun:test';
import {typeErrors} from './helper.ts';

describe('#40 The TypeScript types', () => {
	test('a regular expression compiles for the types with text and numbers', () => {
		const config = `{
					a: {type: 'string', validate: /x/},
					b: {type: 'string', valid: /x/},
					c: {type: 'int', validate: /^\\d+$/},
					d: {type: 'string[]', validate: /x/},
					e: {type: 'number[]', validate: /x/},
					f: {default: 'x', validate: /x/},
					g: {default: 5, validate: /5/},
					h: {validate: /x/},
					i: {valid: /x/},
				}`;
		const code = `
				import argMate from 'argmate';
				import argMateMini from 'argmate/mini';
				argMateMini([], ${config});
				argMate([], ${config});
			`;
		expect(typeErrors(code)).toEqual([]);
	}, 10000);

	test('with no type and no default the result is a string', () => {
		const code = `
				import argMate from 'argmate';
				const argv = argMate([], {
					a: {validate: /x/},
					b: {valid: /x/, mandatory: true},
					c: {alias: 'c'},
				});
				const a: string | undefined = argv.a;
				const b: string = argv.b;
				const c: boolean | undefined = argv.c;
			`;
		expect(typeErrors(code)).toEqual([]);
	}, 10000);

	// A boolean has only two values, thus a regular expression has no use there
	test('a regular expression for a boolean parameter is rejected', () => {
		const code = `import argMate from 'argmate';\nargMate([], {a: {type: 'string', validate: /x/}});\nargMate([], {a: {type: 'boolean', validate: /x/}});\n`;
		expect(typeErrors(code)).toEqual([expect.stringMatching(/^code\.ts\(3,\d+\): error TS\d+: /)]);
	}, 10000);

	// The parameter had the type `boolean | undefined`: the types did not read a parameter with no `type` and no `default`
	test('`mandatory: true` with no type and no default makes the parameter not optional', () => {
		const code = `
				import argMate from 'argmate';
				const argv = argMate([], {a: {mandatory: true}, b: {required: true}, c: {alias: 'c'}});
				const a: boolean = argv.a;
				const b: boolean = argv.b;
				const c: boolean = argv.c;
			`;
		expect(typeErrors(code)).toEqual([expect.stringMatching(/^code\.ts\(6,\d+\): error TS2322: /)]);
	}, 10000);
});
