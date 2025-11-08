// https://bun.sh/docs/test/writing

// @ts-ignore
import {describe, expect, test} from 'bun:test';

import argMate from '../../src/argMate';
import argMateMini from '../../src/argMateMini';
import type {ArgMateEngine} from '../../src/types.js';

run(argMate);
run(argMateMini, ' Mini');

let argv;
function run(argMate: ArgMateEngine, engineType = '') {
	if (!engineType)
		describe('AI on alias' + engineType, () => {
			test('Alias with no corresponding long option', () => {
				argv = argMate('-f bar'.split(' '), {foo: {alias: 'f', type: 'string'}});
				expect(argv).toEqual({
					_: [],
					foo: 'bar',
				});
			});

			test('Multiple aliases used in a sequence', () => {
				argv = argMate('-f bar --ff baz -f bar2'.split(' '), {
					foo: {alias: ['f', 'ff'], type: 'string[]'},
				});
				expect(argv).toEqual({
					_: [],
					foo: ['bar', 'baz', 'bar2'],
				});
			});

			test('Alias as a flag', () => {
				argv = argMate('-f --foo2'.split(' '), {foo: {alias: 'f'}});
				expect(argv).toEqual({
					_: [],
					foo: true,
					foo2: true,
				});
			});

			test('Conflicting aliases', () => {
				argv = argMate('-f bar -f baz'.split(' '), {foo: {alias: 'f', type: 'string[]'}});
				expect(argv).toEqual({
					_: [],
					foo: ['bar', 'baz'],
				});
			});

			test('Alias for a boolean flag', () => {
				argv = argMate('--foo'.split(' '), {foo: {alias: 'f'}});
				expect(argv).toEqual({
					_: [],
					foo: true,
				});

				argv = argMate('-f'.split(' '), {foo: {alias: 'f'}});
				expect(argv).toEqual({
					_: [],
					foo: true,
				});
			});

			test('Alias and value assignment combined', () => {
				argv = argMate('--foo=bar -f=baz'.split(' '), {foo: {alias: 'f', type: 'string'}});
				expect(argv).toEqual({
					_: [],
					foo: 'baz',
				});
			});

			test('Alias used multiple times with mixed types', () => {
				argv = argMate('-f bar -f baz'.split(' '), {foo: {alias: 'f', type: 'string[]'}});
				expect(argv).toEqual({
					_: [],
					foo: ['bar', 'baz'],
				});
			});

			test('Alias with different data types', () => {
				argv = argMate('--foo 42 -f 100'.split(' '), {foo: {alias: 'f', type: 'int'}});
				expect(argv).toEqual({
					_: [],
					foo: 100,
				});
			});

			test('Alias with default value 2345234', () => {
				argv = argMate([], {
					foo: {alias: 'f', type: 'string', default: 'defaultVal'},
				});
				expect(argv).toEqual({
					_: [],
					foo: 'defaultVal',
				});
			});

			test('Alias overriding a default value', () => {
				argv = argMate('-f bar'.split(' '), {
					foo: {alias: 'f', type: 'string', default: 'defaultVal'},
				});
				expect(argv).toEqual({
					_: [],
					foo: 'bar',
				});
			});

			test('Conflicting alias with another key', () => {
				argv = argMate('--foo bar -f baz'.split(' '), {
					foo: {alias: 'f', type: 'string'},
					bar: {alias: 'f', type: 'string'},
				});
				expect(argv).toEqual({
					_: [],
					foo: 'baz',
				});
			});

			test('Alias that matches a global flag', () => {
				argv = argMate('-v --foo bar'.split(' '), {foo: {alias: 'v', type: 'string'}});
				expect(argv).toEqual({
					_: ['bar'],
					foo: '--foo',
				});
			});

			test('Alias and unrelated flag', () => {
				argv = argMate('--foo bar --baz qux'.split(' '), {
					foo: {alias: 'f', type: 'string'},
					baz: {type: 'string'},
				});
				expect(argv).toEqual({
					_: [],
					foo: 'bar',
					baz: 'qux',
				});
			});

			test('Alias chain', () => {
				argv = argMate('-a bar -b baz'.split(' '), {
					foo: {alias: ['a', 'b'], type: 'string'},
				});
				expect(argv).toEqual({
					_: [],
					foo: 'baz',
				});
			});

			test('Alias with special characters', () => {
				argv = argMate('--foo-bar'.split(' '), {foo: {alias: 'foo-bar'}});
				expect(argv).toEqual({
					_: [],
					foo: true,
				});
			});

			test('Alias used after non-alias flag', () => {
				argv = argMate('--baz qux -f bar'.split(' '), {
					foo: {alias: 'f', type: 'string'},
					baz: {type: 'string'},
				});
				expect(argv).toEqual({
					_: [],
					foo: 'bar',
					baz: 'qux',
				});
			});

			test('Alias with mixed case', () => {
				argv = argMate('--Foo bar -f baz'.split(' '), {Foo: {alias: 'f', type: 'string'}});
				expect(argv).toEqual({
					_: [],
					Foo: 'baz',
				});
			});

			test('Alias with no value', () => {
				argv = argMate('--foo -f'.split(' '), {foo: {alias: 'f', type: 'count'}});
				expect(argv).toEqual({
					_: [],
					foo: 2,
				});
			});

			test('Alias with numeric values', () => {
				argv = argMate('-f 123'.split(' '), {foo: {alias: 'f', type: 'int'}});
				expect(argv).toEqual({
					_: [],
					foo: 123,
				});
			});

			test('Alias with numeric and string mix', () => {
				argv = argMate('--foo bar -f 123'.split(' '), {
					foo: {alias: 'f', type: 'string[]'},
				});
				expect(argv).toEqual({
					_: [],
					foo: ['bar', '123'],
				});
			});

			test('Alias that shadows another option', () => {
				argv = argMate('--foo bar -f qux'.split(' '), {
					foo: {alias: 'f', type: 'string'},
					qux: {alias: 'f', type: 'string'},
				});
				expect(argv).toEqual({
					_: [],
					foo: 'qux',
				});
			});

			test('Alias that overlaps with another flag', () => {
				argv = argMate('--foo bar --baz qux -f 123'.split(' '), {
					foo: {alias: 'f', type: 'string'},
					baz: {alias: 'f', type: 'boolean'},
				});
				expect(argv).toEqual({
					_: ['qux'],
					foo: '123',
					baz: true,
				});
			});

			test('Alias used in different contexts', () => {
				argv = argMate('--foo bar -f 123 --baz qux'.split(' '), {
					foo: {alias: 'f', type: 'string'},
					baz: {type: 'string'},
				});
				expect(argv).toEqual({
					_: [],
					foo: '123',
					baz: 'qux',
				});
			});

			test('Alias with multiple assignments and different types', () => {
				argv = argMate('--foo 123 -f 456'.split(' '), {foo: {alias: 'f', type: 'int[]'}});
				expect(argv).toEqual({
					_: [],
					foo: [123, 456],
				});
			});

			test('Alias with boolean flags', () => {
				argv = argMate('--foo -f'.split(' '), {foo: {alias: 'f', type: 'boolean'}});
				expect(argv).toEqual({
					_: [],
					foo: true,
				});
			});

			test('Alias with multiple flags', () => {
				argv = argMate('--foo --baz -f --qux'.split(' '), {
					foo: {alias: 'f', type: 'boolean'},
					baz: {type: 'boolean'},
					qux: {type: 'boolean'},
				});
				expect(argv).toEqual({
					_: [],
					foo: true,
					baz: true,
					qux: true,
				});
			});

			test('Alias that reuses global flag', () => {
				argv = argMate('--foo bar -v -f baz'.split(' '), {
					foo: {alias: 'v', type: 'string[]'},
				});
				expect(argv).toEqual({
					_: ['baz'],
					foo: ['bar', '-f'],
				});
			});

			test('Alias used with default value and overridden', () => {
				argv = argMate('-f baz'.split(' '), {
					foo: {alias: 'f', type: 'string', default: 'defaultVal'},
				});
				expect(argv).toEqual({
					_: [],
					foo: 'baz',
				});
			});

			test('Alias in nested structures', () => {
				argv = argMate('--foo bar --baz 7 -f 123 --q 456'.split(' '), {
					foo: {alias: 'f', type: 'string'},
					baz: {alias: 'q', type: 'int'},
				});
				expect(argv).toEqual({
					_: [],
					foo: '123',
					baz: 456,
				});
			});

			test('Alias with mixed array and non-array types', () => {
				argv = argMate('-f bar -f 123 --foo 456'.split(' '), {
					foo: {alias: 'f', type: 'string[]'},
				});
				expect(argv).toEqual({
					_: [],
					foo: ['bar', '123', '456'],
				});
			});

			test('Alias with overlapping string and int types', () => {
				argv = argMate('--foo bar -f 123 --foo 456'.split(' '), {
					foo: {alias: 'f', type: 'string[]'},
				});
				expect(argv).toEqual({
					_: [],
					foo: ['bar', '123', '456'],
				});
			});
		});
}
