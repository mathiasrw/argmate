// #25: Catch property names that are not correct
// The tests of the types for this item. The tests of the functions are in test/engine/fix/25.test.ts.
import {describe, expect, test} from 'bun:test';
import {typeErrors} from './helper.ts';

describe('#25 The TypeScript types', () => {
	// Type-checks two calls. Line 2 has a correct config. Line 3 has the same config and one unknown property.
	const check = (correct, incorrect) =>
		typeErrors(
			`import argMate from 'argmate';\nargMate([], ${correct});\nargMate([], ${incorrect});\n`
		);
	const oneErrorOnLine3 = [expect.stringMatching(/^code\.ts\(3,\d+\): error TS\d+: /)];

	test('an unknown property next to `type` is rejected', () => {
		expect(check(`{file: {type: 'string'}}`, `{file: {type: 'string', alais: 'f'}}`)).toEqual(
			oneErrorOnLine3
		);
	}, 10000);

	test('an unknown property next to `default` is rejected', () => {
		expect(check(`{file: {default: 'a.txt'}}`, `{file: {default: 'a.txt', alais: 'f'}}`)).toEqual(
			oneErrorOnLine3
		);
	}, 10000);

	test('an unknown property next to `alias` is rejected', () => {
		expect(check(`{file: {alias: 'f'}}`, `{file: {alias: 'f', alais: 'x'}}`)).toEqual(
			oneErrorOnLine3
		);
	}, 10000);

	test('an unknown property next to `description` is rejected', () => {
		expect(
			check(
				`{file: {description: 'The file'}}`,
				`{file: {description: 'The file', descripton: 'The file'}}`
			)
		).toEqual(oneErrorOnLine3);
	}, 10000);

	// `valid`, `required`, `describe` and `desc` are aliases of `validate`, `mandatory` and `description`
	test('the aliases of the config properties compile', () => {
		const config = `{
					a: {type: 'int', validate: (v: number) => v > 0, mandatory: true, description: 'A'},
					b: {type: 'int', validate: (v: number) => v > 0, required: true, describe: 'B'},
					c: {type: 'string', validate: ['x', 'y'], desc: 'C'},
					d: {type: 'string', valid: ['x', 'y']},
				}`;
		const code = `
				import argMate from 'argmate';
				import argMateMini from 'argmate/mini';
				argMateMini([], ${config});
				const argv = argMate([], ${config});
				const a: number = argv.a;
				const b: number = argv.b;
			`;
		expect(typeErrors(code)).toEqual([]);
	}, 10000);

	test('`required: true` makes the parameter not optional in the result, as `mandatory: true` does', () => {
		const code = `
				import argMate from 'argmate';
				const argv = argMate([], {a: {type: 'int', required: true}, b: {type: 'int'}});
				const a: number = argv.a;
				const b: number = argv.b;
			`;
		expect(typeErrors(code)).toEqual([expect.stringMatching(/^code\.ts\(5,\d+\): error TS2322: /)]);
	}, 10000);
});
