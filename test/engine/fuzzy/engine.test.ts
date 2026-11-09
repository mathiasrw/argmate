// Rules of the full engine that hold for any input. The input is random from a seed: see `helper.ts`.
// These tests are not part of `bun run test`. Run them with `bun run test-fuzzy`.
import {describe, expect, test} from 'bun:test';
import {argEngine, argMate, configPreprocessing, precompileConfig} from '../../helper.ts';
import {fuzz, type Random} from './helper.ts';

const names = [
	'port',
	'name',
	'level',
	'dryRun',
	'outDir',
	'x',
	'files',
	'mode',
	'retries',
	'tag',
	'q',
];
const letters = 'abcdefghijklmoprstuvwyz';
const types = [
	'boolean',
	'string',
	'int',
	'number',
	'float',
	'hex',
	'count',
	'string[]',
	'int[]',
	'number[]',
] as const;
type Type = (typeof types)[number];
type Param = {name: string; type: Type; alias?: string};

// Some parameters with a type each, and for some a short alias
function params(rnd: Random): Param[] {
	const free = [...letters];
	return rnd
		.shuffle(names.slice())
		.slice(0, rnd.int(1, 6))
		.map(name => {
			const param: Param = {name, type: rnd.pick(types)};
			if (1 < name.length && rnd.chance(0.5))
				param.alias = free.splice(rnd.int(0, free.length - 1), 1)[0];
			return param;
		});
}

const config = (list: Param[]) =>
	Object.fromEntries(
		list.map(p => [p.name, p.alias ? {type: p.type, alias: p.alias} : {type: p.type}])
	);

const kebab = (name: string) => name.replace(/[A-Z]/g, c => '-' + c.toLowerCase());

// A name of the parameter as it is typed: the long form, the kebab form, or the alias
function flag(rnd: Random, p: Param) {
	if (p.alias && rnd.chance(0.4)) return '-' + p.alias;
	if (1 === p.name.length) return rnd.pick(['-', '--']) + p.name;
	return '--' + (rnd.chance(0.5) ? kebab(p.name) : p.name);
}

// A value of the type, and the text that gives it
function value(rnd: Random, type: string): [unknown, string] {
	switch (type) {
		case 'string':
		case 'string[]': {
			const text = rnd.text('ab -=_.,:/\\"\'05🦖æ', 0, 8);
			return [text, text];
		}
		case 'int':
		case 'int[]': {
			const n = rnd.chance(0.1)
				? rnd.pick([Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, 0])
				: rnd.int(-1e6, 1e6);
			return [n, 0 < n && rnd.chance(0.2) ? '0x' + n.toString(16) : '' + n];
		}
		case 'number':
		case 'number[]':
		case 'float': {
			const n = rnd.int(-1e6, 1e6) / rnd.pick([1, 10, 1000, 1e6]);
			return [n, '' + n];
		}
		case 'hex': {
			const n = rnd.int(-1e6, 1e6);
			const text = n.toString(16);
			return [n, rnd.chance(0.5) ? text.toUpperCase() : text];
		}
		default: {
			const yes = rnd.chance(0.5);
			return [
				yes,
				rnd.pick(
					yes ? ['true', 'yes', 'on', '1', 'TRUE', 'Yes'] : ['false', 'no', 'off', '0', 'OFF', '']
				),
			];
		}
	}
}

// The result with no input: a count is 0 and a list is empty
function start(list: Param[]): Record<string, unknown> {
	const expected: Record<string, unknown> = {_: []};
	for (const p of list) {
		if ('count' === p.type) expected[p.name] = 0;
		if (p.type.endsWith('[]')) expected[p.name] = [];
	}
	return expected;
}

// The words that give one value of the parameter, and the change to the expected result
function give(rnd: Random, p: Param, expected: Record<string, unknown>): string[] {
	const name = flag(rnd, p);
	if ('boolean' === p.type) {
		if (rnd.chance(0.3)) {
			expected[p.name] = true;
			return [name];
		}
		if (rnd.chance(0.3) && name.startsWith('--')) {
			expected[p.name] = false;
			return ['--no-' + name.slice(2)];
		}
		const [data, text] = value(rnd, 'boolean');
		expected[p.name] = data;
		return [name + '=' + text];
	}
	if ('count' === p.type) {
		const n = rnd.chance(0.3) ? rnd.int(0, 9) : 1;
		expected[p.name] = (expected[p.name] as number) + n;
		return [1 === n && rnd.chance(0.7) ? name : name + '=' + n];
	}
	const [data, text] = value(rnd, p.type);
	if (p.type.endsWith('[]')) (expected[p.name] as unknown[]).push(data);
	else expected[p.name] = data;
	// A short flag with digits: `-p5`
	if (/^-\w$/.test(name) && /^\d+$/.test(text) && 'string' !== p.type && rnd.chance(0.3))
		return [name + text];
	return rnd.chance(0.5) ? [name + '=' + text] : [name, text];
}

describe('fuzzy: the full engine', () => {
	// The result of a random input is what the input says, for each form a value can be given in
	test('gives each value in the form it is typed', () => {
		fuzz('gives each value in the form it is typed', (rnd, show) => {
			const list = params(rnd);
			const expected = start(list);
			const args: string[] = [];
			for (let i = rnd.int(0, 8); i; i--) {
				if (rnd.chance(0.2)) {
					const word = rnd.text('abcxyz', 1, 5);
					(expected._ as unknown[]).push(word);
					args.push(word);
				} else args.push(...give(rnd, rnd.pick(list), expected));
			}
			// After `--` each word is a string in `_`, also one that looks like a parameter or a number
			if (rnd.chance(0.3)) {
				args.push('--');
				for (let i = rnd.int(0, 3); i; i--) {
					const word = rnd.text('-=ab5.', 0, 4);
					(expected._ as unknown[]).push(word);
					args.push(word);
				}
			}
			show({args, config: config(list)});
			expect(argMate(args, config(list))).toEqual(expected);
		});
	});

	// Any words, also ones that make no sense, give a result or an input error. Never another error.
	test('gives a result or an input error for any words', () => {
		const codes = [
			'UNKNOWN',
			'MISSING_VALUE',
			'INVALID',
			'CONFLICT',
			'DEMAND',
			'MANDATORY',
			'BAD_TYPE',
			'BAD_VALUE',
			'NEGATED_AND_ASSIGNED',
			'ASSIGN_NOT_ALLOWED',
			'NUMBER_NAME',
		];
		fuzz('gives a result or an input error for any words', (rnd, show) => {
			const list = params(rnd);
			const args = Array.from({length: rnd.int(0, 6)}, () => rnd.text('--=noxpqa5.🦖 ', 0, 6));
			const settings = {
				strict: rnd.chance(0.2),
				allowUnknown: rnd.chance(0.8),
				allowKeyNumValues: rnd.chance(0.8),
				allowNegatingFlags: rnd.chance(0.8),
				allowAutoNumbers: rnd.chance(0.8),
				greedy: rnd.chance(0.2),
			};
			show({args, config: config(list), settings});
			let result: unknown;
			try {
				result = argMate(args, config(list), settings);
			} catch (err) {
				expect(codes).toContain((err as {code: string}).code);
				return;
			}
			expect(Array.isArray((result as {_: unknown})._)).toBe(true);
			// The same input gives the same result: no state is left from the parse before
			expect(argMate(args, config(list), settings)).toEqual(result);
		});
	});

	// A config that is read once, or made into code, gives the same result as the config itself
	test('gives the same result with a precompiled config', () => {
		fuzz('gives the same result with a precompiled config', (rnd, show) => {
			const list = params(rnd);
			const expected = start(list);
			const args = Array.from({length: rnd.int(0, 6)}, () =>
				give(rnd, rnd.pick(list), expected)
			).flat();
			show({args, config: config(list)});
			const direct = argMate(args, config(list));
			expect(argEngine(args, configPreprocessing(config(list)))).toEqual(direct);
			// biome-ignore lint/security/noGlobalEval: the code is what precompileConfig gives to be pasted in a program
			expect(argEngine(args, eval('(' + precompileConfig(config(list)) + ')'))).toEqual(direct);
		});
	});
});
