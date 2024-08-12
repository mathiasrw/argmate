// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';
import argMateLite from '../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

function run(argMate, type = '') {
	describe('Hex' + type, () => {
		describe('Real hex codes', () => {
			test('Hex with no 0x prefix', () => {
				let argv = argMate('--foo a1'.split(' '), {foo: {type: 'hex'}});
				expect(argv).toEqual({
					_: [],
					foo: 161,
				});
			});

			test('Hex with 0x prefix', () => {
				let argv = argMate('--foo 0xa1'.split(' '), {foo: {type: 'hex'}});
				expect(argv).toEqual({
					_: [],
					foo: 161,
				});
			});
			test('Multiple hex values', () => {
				let argv = argMate('--foo 0xa1 --foo a2'.split(' '), {foo: {type: 'hex'}});
				expect(argv).toEqual({
					_: [],
					foo: 162,
				});
			});

			test('Invalid hex input A', () => {
				expect(() => argMate('--foo g1'.split(' '), {foo: {type: 'hex'}})).toThrow(
					'is not a valid hex'
				);
			});

			test('Invalid hex input B', done => {
				argMate(
					'--foo abx4'.split(' '),
					{foo: {type: 'hex'}},
					{
						error: m => {
							expect(m).toContain('not a valid hex');
							done();
						},
					}
				);
			});
		});

		describe.if(!type)('Hex via int' + type, () => {
			test('Hex with 0x prefix', () => {
				let argv = argMate('--foo 0xa'.split(' '), {foo: {type: 'int'}});
				expect(argv).toEqual({
					_: [],
					foo: 10,
				});
			});

			test('Hex withOUT 0x prefix', () => {
				expect(() => argMate('--foo a'.split(' '), {foo: {type: 'int'}})).toThrow(
					'not a valid int'
				);
			});

			test('Multiple', () => {
				let argv = argMate('--foo 0xA --foo 0xf'.split(' '), {foo: {type: 'int'}});
				expect(argv).toEqual({
					_: [],
					foo: 15,
				});
			});

			test('Not defined', () => {
				let argv = argMate('--bar 0xB'.split(' '), {foo: {type: 'int'}});
				expect(argv).toEqual({
					_: ['0xB'],
					bar: true,
				});
			});
		});
	});
}
