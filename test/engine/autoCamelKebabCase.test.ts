// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../../src/argMate';
import {ArgMateConfig, ArgMateSettings} from '../../src/types';
import argMateMini from '../../src/argMateMini';

run(argMate);
run(argMateMini, ' Mini');
let argv;

function run(
	argMate: (
		args: string[],
		config?: ArgMateConfig,
		settings?: ArgMateSettings
	) => {[key: string]: any},
	type = ''
) {
	describe('autoCamelKebabCase' + type, () => {
		test('Default', () => {
			argv = argMate('--foo-bar 234'.split(' '), {fooBar: {type: 'int'}});
			expect(argv).toEqual({
				_: [],
				fooBar: 234,
			});
		});

		test('Disabled', () => {
			argv = argMate(
				'--foo-bar 234'.split(' '),
				{fooBar: {type: 'int'}},
				{autoCamelKebabCase: false}
			);
			expect(argv).toEqual({
				_: ['234'],
				'foo-bar': true,
			});
		});

		test('Disabled but configured', () => {
			argv = argMate(
				'--foo-bar 234'.split(' '),
				{'foo-bar': {type: 'int'}},
				{autoCamelKebabCase: false}
			);
			expect(argv).toEqual({
				_: [],
				'foo-bar': 234,
			});
		});

		test('CamelCaseing with single char config', () => {
			argv = argMate('-F -f -a=1 -A=2'.split(' '), {}, {autoCamelKebabCase: false});
			expect(argv).toEqual({
				_: [],
				F: true,
				f: true,
				a: 1,
				A: 2,
			});
		});

		test('Not CamelCaseing with single char config', () => {
			argv = argMate('-F -f -a=1 -A=2'.split(' '), {}, {autoCamelKebabCase: true});
			expect(argv).toEqual({
				_: [],
				F: true,
				f: true,
				a: 1,
				A: 2,
			});
		});
	});
}
