// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

function run(argMate, type = '') {
	describe('strictConf' + type, () => {
		test('Unknown parameter gives error', done => {
			argMate(
				'--bar value'.split(' '),
				{foo: {type: 'string'}},
				{
					strict: true,
					error: msg => {
						expect(msg).toContain('Unknown parameter');
						expect(msg).toContain('bar');
						done();
					},
				}
			);
		});

		test('No auto aliass from kebab to camel case', () => {
			let argv = argMate(
				'--foo-bar value'.split(' '),
				{'foo-bar': {type: 'string'}},
				{strict: true}
			);
			expect(argv).toEqual({
				_: [],
				'foo-bar': 'value',
			});

			expect(() => {
				argMate('--fooBar value'.split(' '), {'foo-bar': {type: 'string'}}, {strict: true});
			}).toThrow('Unknown parameter', 'not allowed');
		});

		test('Ignore negating flags', () => {
			let argv = argMate(
				'--no-flag'.split(' '),
				{flag: {type: 'boolean'}, 'no-flag': {type: 'boolean'}},
				{strict: true}
			);
			expect(argv).toEqual({
				_: [],
				'no-flag': true,
			});
		});

		test.todo('No keynum value assignments', () => {
			let argv = argMate(
				'-p123'.split(' '),
				{p: {type: 'boolean'}, p123: {type: 'boolean'}},
				{strict: true}
			);
			expect(argv).toEqual({
				_: [],
				p123: true,
			});
		});

		test.todo('Combination of strict behaviors', () => {
			let argv = argMate(
				'--defined-param value --foo-bar othervalue -p123'.split(' '),
				{
					'defined-param': {type: 'string'},
					'foo-bar': {type: 'string'},
					p123: {type: 'boolean'},
				},
				{strict: true}
			);
			expect(argv).toEqual({
				_: [],
				'defined-param': 'value',
				'foo-bar': 'othervalue',
				p123: true,
			});
		});

		test.todo('Error on multiple undefined parameters', done => {
			argMate(
				'--undefined1 value1 --undefined2 value2'.split(' '),
				{definedParam: {type: 'string'}},
				{
					strict: true,
					error: msg => {
						expect(msg).toContain('Unknown parameter');
						expect(msg).toContain('undefined1');
						done();
					},
				}
			);
		});

		test('Correct handling of defined boolean flags', () => {
			let argv = argMate(
				'--flag1 --flag2'.split(' '),
				{flag1: true, flag2: false},
				{strict: true}
			);
			expect(argv).toEqual({
				_: [],
				flag1: true,
				flag2: true,
			});
		});

		test.todo('Error on assigning value to boolean flag', done => {
			argMate(
				'--flag value'.split(' '),
				{flag: {type: 'boolean'}},
				{
					strict: true,
					error: msg => {
						expect(msg).toContain('boolean');
						expect(msg).toContain('flag');
						done();
					},
				}
			);
		});
	});
}
