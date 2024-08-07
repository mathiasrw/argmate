// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';
import argMateLite from '../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');
let argv;
function run(argMate, type = '') {
	describe('Alias' + type, () => {
		test('Long key with short alias', () => {
			argv = argMate('--foo bar --foo2 bar2'.split(' '), {foo: {alias: 'f'}});
			expect(argv).toEqual({
				_: ['bar', 'bar2'],
				foo: true,
				foo2: true,
			});

			argv = argMate('--fooX bar --foo2 bar2'.split(' '), {foo: {alias: 'f'}});
			expect(argv).toEqual({
				_: ['bar', 'bar2'],
				fooX: true,
				foo2: true,
			});

			argv = argMate('--f bar --foo2 bar2'.split(' '), {foo: {alias: 'f'}});
			expect(argv).toEqual({
				_: ['bar', 'bar2'],
				foo: true,
				foo2: true,
			});
		});

		test('Short key with long alias', () => {
			argv = argMate('--f bar --foo2 bar2'.split(' '), {f: {alias: 'foo'}});
			expect(argv).toEqual({
				_: ['bar', 'bar2'],
				f: true,
				foo2: true,
			});

			argv = argMate('--foo bar --foo2 bar2'.split(' '), {f: {alias: 'foo'}});
			expect(argv).toEqual({
				_: ['bar', 'bar2'],
				f: true,
				foo2: true,
			});
		});

		test('Assign value', () => {
			argv = argMate('--foo bar --foo2 bar2'.split(' '), {foo: {alias: 'f', type: 'string'}});
			expect(argv).toEqual({
				_: ['bar2'],
				foo: 'bar',
				foo2: true,
			});

			argv = argMate('--foo2 bar2 --f bar'.split(' '), {foo: {alias: 'f', type: 'string'}});
			expect(argv).toEqual({
				_: ['bar2'],
				foo: 'bar',
				foo2: true,
			});
		});

		test('Series of assignments', () => {
			argv = argMate('--foo bar --foo bar2'.split(' '), {foo: {alias: 'f', type: 'string'}});
			expect(argv).toEqual({
				_: [],
				foo: 'bar2',
			});

			argv = argMate('--f bar --f bar2'.split(' '), {foo: {alias: 'f', type: 'string'}});
			expect(argv).toEqual({
				_: [],
				foo: 'bar2',
			});

			argv = argMate('--f bar --foo bar2'.split(' '), {foo: {alias: 'f', type: 'string'}});
			expect(argv).toEqual({
				_: [],
				foo: 'bar2',
			});

			argv = argMate('--foo bar --f bar2'.split(' '), {foo: {alias: 'f', type: 'string'}});
			expect(argv).toEqual({
				_: [],
				foo: 'bar2',
			});
		});

		test('Assign array', () => {
			argv = argMate('--foo bar --foo bar2'.split(' '), {
				foo: {alias: 'f', type: 'string[]'},
			});
			expect(argv).toEqual({
				_: [],
				foo: ['bar', 'bar2'],
			});

			argv = argMate('--f bar --f bar2'.split(' '), {foo: {alias: 'f', type: 'string[]'}});
			expect(argv).toEqual({
				_: [],
				foo: ['bar', 'bar2'],
			});

			argv = argMate('--f bar --foo bar2'.split(' '), {foo: {alias: 'f', type: 'string[]'}});
			expect(argv).toEqual({
				_: [],
				foo: ['bar', 'bar2'],
			});

			argv = argMate('--foo bar --f bar2'.split(' '), {foo: {alias: 'f', type: 'string[]'}});
			expect(argv).toEqual({
				_: [],
				foo: ['bar', 'bar2'],
			});
		});

		test('Multiple aliases A', () => {
			argv = argMate('--foo bar --foo2 bar2'.split(' '), {
				foo: {alias: ['f'], type: 'string'},
			});
			expect(argv).toEqual({
				_: ['bar2'],
				foo: 'bar',
				foo2: true,
			});

			argv = argMate('--foo2 bar2 --f bar'.split(' '), {foo: {alias: ['f'], type: 'string'}});
			expect(argv).toEqual({
				_: ['bar2'],
				foo: 'bar',
				foo2: true,
			});
		});

		test('Multiple aliases B', () => {
			argv = argMate('--foo bar --foo2 bar2'.split(' '), {
				foo: {alias: ['f', 'ff'], type: 'string'},
			});
			expect(argv).toEqual({
				_: ['bar2'],
				foo: 'bar',
				foo2: true,
			});

			argv = argMate('--foo2 bar2 --f bar'.split(' '), {
				foo: {alias: ['f', 'ff'], type: 'string'},
			});
			expect(argv).toEqual({
				_: ['bar2'],
				foo: 'bar',
				foo2: true,
			});

			argv = argMate('--foo2 bar2 --ff bar'.split(' '), {
				foo: {alias: ['f', 'ff'], type: 'string'},
			});
			expect(argv).toEqual({
				_: ['bar2'],
				foo: 'bar',
				foo2: true,
			});
		});

		test('Multiple aliases C', () => {
			argv = argMate('--foo bar --fooX barX -f bar2 --ff bar3'.split(' '), {
				foo: {alias: ['f', 'ff'], type: 'string[]'},
			});
			expect(argv).toEqual({
				_: ['barX'],
				foo: ['bar', 'bar2', 'bar3'],
				fooX: true,
			});
		});

		test('Multiple aliases D', () => {
			argv = argMate('--foo bar --fooX barX -f bar2 --ff bar3'.split(' '), {
				foo: {alias: ['f', 'ff'], type: 'string'},
				abc: {alias: ['a', 'aa'], type: 'string'},
			});
			expect(argv).toEqual({
				_: ['barX'],
				foo: 'bar3',
				fooX: true,
			});

			argv = argMate('--foo bar --aa xyz -f bar2 -a xyz2 --ff bar3 --abc xyz3'.split(' '), {
				foo: {alias: ['f', 'ff'], type: 'string'},
				abc: {alias: ['a', 'aa'], type: 'string'},
			});
			expect(argv).toEqual({
				_: [],
				foo: 'bar3',
				abc: 'xyz3',
			});
		});

		test('Multiple aliases E', () => {
			argv = argMate('--foo bar --fooX barX -f bar2 --ff bar3'.split(' '), {
				foo: {alias: ['f', 'ff'], type: 'string[]'},
				abc: {alias: ['a', 'aa'], type: 'string[]'},
			});
			expect(argv).toEqual({
				_: ['barX'],
				foo: ['bar', 'bar2', 'bar3'],
				fooX: true,
				abc: [],
			});

			argv = argMate('--foo bar --aa xyz -f bar2 -a xyz2 --ff bar3 --abc xyz3'.split(' '), {
				foo: {alias: ['f', 'ff'], type: 'string[]'},
				abc: {alias: ['a', 'aa'], type: 'string[]'},
			});
			expect(argv).toEqual({
				_: [],
				foo: ['bar', 'bar2', 'bar3'],
				abc: ['xyz', 'xyz2', 'xyz3'],
			});
		});

		test.todo('Conflicting aliases', () => {});
	});
}
