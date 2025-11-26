import {describe, expect, test} from 'bun:test';
import argMate from '../src/argMate.ts';
import argMateMini from '../src/argMateMini.ts';

const engines = [
	{name: 'Regular', fn: argMate},
	{name: 'Mini', fn: argMateMini},
];

for (const {name, fn} of engines) {
	describe(`${name} Engine - Greedy Feature`, () => {
		test('should merge args after double dash when greedy is true', () => {
			const args = ['--greedy', '--', '-a', '-b', '-c'];
			const result = fn(args, {}, {greedy: true} as any);
			expect(result._).toEqual(['-a -b -c']);
		});

		test('should merge args after double dash when greedy is true (words)', () => {
			const args = ['--greedy', '--', 'foo', 'bar'];
			const result = fn(args, {}, {greedy: true} as any);
			expect(result._).toEqual(['foo bar']);
		});

		test('should merge args after double dash when greedy is true (flags)', () => {
			const args = ['--greedy', '--', '--foo', '--bar'];
			const result = fn(args, {}, {greedy: true} as any);
			expect(result._).toEqual(['--foo --bar']);
		});

		test('should NOT merge args after double dash when greedy is false (default)', () => {
			const args = ['--greedy', '--', '-a', '-b', '-c'];
			const result = fn(args, {}, {greedy: false} as any);
			expect(result._).toEqual(['-a', '-b', '-c']);
		});

		test('should NOT merge args after double dash when greedy is undefined (default)', () => {
			const args = ['--greedy', '--', '-a', '-b', '-c'];
			const result = fn(args, {});
			expect(result._).toEqual(['-a', '-b', '-c']);
		});

		test('should handle arguments before the double dash', () => {
			const args = ['-x', '--', '-x', '-y'];
			const result = fn(args, {y: false, x: false}, {greedy: true} as any);
			expect(result.x).toBe(true);
			expect(result.y).toBe(false);
			expect(result._).toEqual(['-x -y']);
		});

		test('should include subsequent double dashes in the merged string', () => {
			const args = ['--', '-a', '--', '-b'];
			const result = fn(args, {}, {greedy: true} as any);
			expect(result._).toEqual(['-a -- -b']);
		});

		test('should ignore defined parameters after double dash', () => {
			const args = ['--', '-a'];
			const config = {a: {type: 'boolean', default: false}};
			const result = fn(args, config, {greedy: true} as any);
			expect(result.a).toBe(false);
			expect(result._).toEqual(['-a']);
		});

		test('should not error on unknown parameters after double dash even if allowUnknown is false', () => {
			const args = ['--file', 'f.txt', '--', '--unknown', 'arg'];
			const config = {file: {type: 'string'}};
			const result = fn(args, config, {greedy: true, allowUnknown: false} as any);
			expect(result.file).toBe('f.txt');
			expect(result._).toEqual(['--unknown arg']);
		});
	});
}
