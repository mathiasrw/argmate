// @ts-expect-error
import {describe, expect, test} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import {argMate, argMateMini} from '../helper.ts';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('transform' + engineType, () => {
		test('Basic string transform (trim)', () => {
			expect(
				argMate(['--name', '  John  '], {
					name: {type: 'string', transform: (v: string) => v.trim()},
				})
			).toEqual({_: [], name: 'John'});
		});

		test('String transform (uppercase)', () => {
			expect(
				argMate(['--name', 'john'], {
					name: {type: 'string', transform: (v: string) => v.toUpperCase()},
				})
			).toEqual({_: [], name: 'JOHN'});
		});

		test('Number transform (multiply)', () => {
			expect(
				argMate(['--n', '5'], {
					n: {type: 'int', transform: (v: number) => v * 10},
				})
			).toEqual({_: [], n: 50});
		});

		test('Number transform (add)', () => {
			expect(
				argMate(['--offset', '10'], {
					offset: {type: 'number', transform: (v: number) => v + 100},
				})
			).toEqual({_: [], offset: 110});
		});

		test('Array transform (whole-value semantics)', () => {
			expect(
				argMate(['--tags', 'a', '--tags', 'b', '--tags', 'c'], {
					tags: {type: 'string[]', transform: (v: string[]) => v.map(x => x.toUpperCase())},
				})
			).toEqual({_: [], tags: ['A', 'B', 'C']});
		});

		test('Array transform (filter)', () => {
			expect(
				argMate(['--nums', '1', '--nums', '2', '--nums', '3'], {
					nums: {type: 'int[]', transform: (v: number[]) => v.filter(x => x > 1)},
				})
			).toEqual({_: [], nums: [2, 3]});
		});

		test('Transform skipped when value is undefined (no input, no default)', () => {
			let called = false;
			const result = argMate(['--other', 'x'], {
				other: {type: 'string'},
				name: {
					type: 'string',
					transform: () => {
						called = true;
						return 'called';
					},
				},
			});
			expect(called).toBe(false);
			expect(result.name).toBeUndefined();
		});

		test('Transform runs when value is set via default', () => {
			expect(
				argMate([], {
					name: {
						type: 'string',
						default: '  default  ',
						transform: (v: string) => v.trim(),
					},
				})
			).toEqual({_: [], name: 'default'});
		});

		test('Transform runs when value is provided', () => {
			expect(
				argMate(['--name', '  provided  '], {
					name: {
						type: 'string',
						default: '  default  ',
						transform: (v: string) => v.trim(),
					},
				})
			).toEqual({_: [], name: 'provided'});
		});

		test('Transform throws error (main engine)', () => {
			expect(() =>
				argMate(['--name', 'x'], {
					name: {
						type: 'string',
						transform: () => {
							throw new Error('boom');
						},
					},
				})
			).toThrow(/transform.*boom/);
		});

		test('Transform throws error (mini engine)', () => {
			expect(() =>
				argMate(['--name', 'x'], {
					name: {
						type: 'string',
						transform: () => {
							throw new Error('boom');
						},
					},
				})
			).toThrow(/transform.*boom/);
		});

		test('Transform returns undefined (allowed, but weird)', () => {
			expect(
				argMate(['--name', 'x'], {
					name: {type: 'string', transform: () => undefined as any},
				})
			).toEqual({_: [], name: undefined});
		});

		test('Transform returns different type (allowed)', () => {
			expect(
				argMate(['--name', '123'], {
					name: {type: 'string', transform: (v: string) => Number.parseInt(v, 10)},
				})
			).toEqual({_: [], name: 123});
		});

		if (!engineType) {
			test('Transform with alias (canonical key used)', () => {
				expect(
					argMate(['-n', '  John  '], {
						name: {type: 'string', alias: 'n', transform: (v: string) => v.trim()},
					})
				).toEqual({_: [], name: 'John'});
			});
		}

		test('Transform with autoCamelKebabCase', () => {
			expect(
				argMate(['--my-name', '  John  '], {
					myName: {type: 'string', transform: (v: string) => v.trim()},
				})
			).toEqual({_: [], myName: 'John'});
		});

		test('Transform runs after validation', () => {
			expect(
				argMate(['--n', '5'], {
					n: {
						type: 'int',
						valid: (v: number) => v >= 0 && v <= 10,
						transform: (v: number) => v * 2,
					},
				})
			).toEqual({_: [], n: 10});
		});

		test('Transform runs before mandatory check', () => {
			expect(
				argMate(['--n', '5'], {
					n: {
						type: 'int',
						mandatory: true,
						transform: (v: number) => v * 2,
					},
				})
			).toEqual({_: [], n: 10});
		});

		test('Transform with type mismatch (config error, user responsibility)', () => {
			// User declared type: 'int' but wrote a transform expecting string
			// argMate doesn't prevent this — transform receives the parsed number
			expect(() =>
				argMate(['--n', '5'], {
					n: {
						type: 'int',
						transform: (v: string) => v.trim(),
					},
				})
			).toThrow(/transform.*trim/); // 5.trim() throws, caught by our try/catch
		});

		test('Transform throws on type mismatch (user error caught)', () => {
			expect(() =>
				argMate(['--n', '5'], {
					n: {
						type: 'int',
						transform: (v: any) => v.trim(),
					},
				})
			).toThrow(/transform/); // 5.trim() throws, caught by our try/catch
		});

		test('Transform with invalid input after type coercion', () => {
			// Hex parsing produces NaN for invalid input, transform sees NaN
			expect(() =>
				argMate(['--n', 'xyz'], {
					n: {
						type: 'hex',
						transform: (v: number) => v * 2,
					},
				})
			).toThrow(/not a valid hex/); // Type validation runs before transform
		});

		test('Transform on count type (receives number)', () => {
			expect(
				argMate(['--count', '--count', '--count'], {
					count: {
						type: 'count',
						transform: (v: number) => Math.min(v, 5), // cap at 5
					},
				})
			).toEqual({_: [], count: 3});
		});

		test('Transform on boolean type (receives boolean)', () => {
			expect(
				argMate(['--flag'], {
					flag: {
						type: 'boolean',
						transform: (v: boolean) => (!v).toString(),
					},
				})
			).toEqual({_: [], flag: 'false'});
		});

		if (!engineType)
			test('Transform on negated boolean', () => {
				expect(
					argMate(['--no-flag'], {
						flag: {
							type: 'boolean',
							transform: (v: boolean) => (!v).toString(),
						},
					})
				).toEqual({_: [], flag: 'true'});
			});
	});
}
