// https://bun.sh/docs/test/writing

// @ts-ignore
import {describe, expect, test} from 'bun:test';

import argMate from '../../src/argMate';
import argMateMini from '../../src/argMateMini';
import type {ArgMateConfig, ArgMateSettings} from '../../src/types';

run(argMate);
run(argMateMini, ' Mini');

function run(
	argMate: (
		args: string[],
		config?: ArgMateConfig,
		settings?: ArgMateSettings
	) => {[key: string]: any},
	type = ''
) {
	describe('strictSettings' + type, () => {
		test('Unknown parameter gives error', () => {
			expect(() => {
				argMate('--bar value'.split(' '), {foo: {type: 'string'}}, {strict: true});
			}).toThrow(/Unknown parameter.+bar/i);
		});

		test('No auto aliass from kebab to camel case', () => {
			const argv = argMate(
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
			}).toThrow(/Unknown parameter.+not allowed/i);
		});

		test('Ignore negating flags', () => {
			const argv = argMate(
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
			const argv = argMate(
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
			const argv = argMate(
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

		test('Error on multiple undefined parameters', () => {
			expect(() => {
				argMate(
					'--undefined1 value1 --undefined2 value2'.split(' '),
					{definedParam: {type: 'string'}},
					{strict: true}
				);
			}).toThrow(/Unknown parameter.+undefined1/i);
		});

		test('Correct handling of defined boolean flags', () => {
			const argv = argMate(
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

		test('Error on assigning value to boolean flag', () => {
			expect(() => {
				argMate(
					'--flag=value'.split(' '),
					{flag: {type: 'boolean'}},
					{strict: true, allowAssign: true}
				);
			}).toThrow(/flag.+boolean.+can't assign/i);
		});
	});
}
