/**
 * Compile-time type tests for `transform` / `valid` inference and the strict
 * `type` whitelist.
 *
 * This file is not executed at runtime — it is checked by `tsc` (or your IDE).
 * The positive cases must compile cleanly. Each negative case is preceded by
 * `// @ts-expect-error`: if that case ever stops erroring, `tsc` will flag
 * this file with "Unused @ts-expect-error directive".
 *
 * Together with the runtime panic in `compileConfig.ts:118` (`Invalid type ...`)
 * and the runtime tests in `test/engine/transform.test.ts`, this guards the
 * "Option C" type system promise: a wrong `transform` signature or an unknown
 * `type` string must fail loudly — never silently.
 *
 * NOTE: Users do NOT need to write `as const` on the config object — the
 * `<const Config>` generic modifier on `argMate` (TypeScript 5.0+) preserves
 * literal types automatically. `argMate(args, {n: {type: 'int', ...}})` is
 * sufficient; `type: 'int'` is preserved as a literal for discriminated-union
 * narrowing.
 */

import argMate from '../../src/argMate';

// ============================================================================
// Positive cases — these must compile cleanly
// ============================================================================

// --- type → value-type inference for transform ---

argMate(['--n', '5'], {
	n: {type: 'int', transform: (v: number) => v * 2},
});

argMate(['--name', 'x'], {
	name: {
		type: 'string',
		transform: (v: string | string[]) => (Array.isArray(v) ? v.join(',') : v.trim()),
	},
});

argMate(['--flag'], {
	flag: {type: 'boolean', transform: (v: boolean) => !v},
});

argMate(['--tags', 'a'], {
	tags: {type: 'string[]', transform: (v: string[]) => v.map(s => s.toUpperCase())},
});

argMate(['--nums', '1', '--nums', '2'], {
	nums: {type: 'int[]', transform: (v: number[]) => v.filter(n => n > 0)},
});

argMate(['-c'], {
	count: {type: 'count', transform: (v: number) => Math.min(v, 5)},
});

// --- default → value-type inference for transform ---

argMate([], {
	port: {default: 8080, transform: (v: number) => v + 1},
});

argMate([], {
	host: {default: 'localhost', transform: (v: string) => v.toUpperCase()},
});

argMate([], {
	debug: {default: false, transform: (v: boolean) => !v},
});

// --- valid uses the same inference ---

argMate(['--n', '5'], {
	n: {type: 'int', validate: (v: number) => v >= 0 && v <= 100},
});

argMate(['--color', 'red'], {
	color: {type: 'string', valid: ['red', 'green', 'blue']},
});

// --- shorthand syntax (no transform / no valid) still works ---

argMate([], {
	foo: 10,
	bar: false,
	name: 'test',
});

argMate([], {
	verbose: {type: 'boolean'},
	output: {type: 'string'},
	count: {type: 'int', mandatory: true},
});

// --- configs without `type` / `default` (the boolean-fallback variant) ---

argMate([], {
	flag: {alias: 'f'},
	other: {conflict: 'flag'},
	empty: {},
	must: {mandatory: true},
});

// ============================================================================
// Negative cases — each MUST error. If TS stops erroring, this file fails.
// ============================================================================

// --- transform parameter type mismatch ---

argMate(['--n', '5'], {
	// @ts-expect-error - transform expects number (type: 'int'), not string
	n: {type: 'int', transform: (v: string) => v.trim()},
});

argMate(['--name', 'x'], {
	// @ts-expect-error - transform expects string | string[] (type: 'string'), not number
	name: {type: 'string', transform: (v: number) => v * 2},
});

argMate([], {
	// @ts-expect-error - transform expects number (inferred from default: 42), not string
	n: {default: 42, transform: (v: string) => v.trim()},
});

argMate(['--tags', 'a'], {
	// @ts-expect-error - transform expects string[] (type: 'string[]'), not number
	tags: {type: 'string[]', transform: (v: number) => v},
});

// --- valid parameter type mismatch ---

argMate(['--n', '5'], {
	// @ts-expect-error - validate expects number, not string
	n: {type: 'int', validate: (v: string) => v.length > 0},
});

// --- invalid type strings (caught by ParameterTypeName whitelist) ---

argMate(['--n', '5'], {
	// @ts-expect-error - 'date' is not a recognized type
	n: {type: 'date'},
});

argMate(['--n', '5'], {
	// @ts-expect-error - 'email' is not a recognized type
	n: {type: 'email', transform: (v: string) => v},
});

argMate(['--n', '5'], {
	// @ts-expect-error - typo: 'boolean[]' is not a recognized type
	n: {type: 'boolean[]'},
});

argMate(['--n', '5'], {
	// @ts-expect-error - typo: 'Int' is wrong case
	n: {type: 'Int'},
});

// --- file, folder and path are text ---

{
	const r = argMate(['--f', 'a.sql'], {
		f: {type: 'file'},
		d: {type: 'folder[]', default: ['src']},
	});
	const f: string | undefined = r.f;
	const d: string[] = r.d;
	// @ts-expect-error - a file is text, not a number
	const n: number | undefined = r.f;
}
