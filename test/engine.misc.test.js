// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate.js';

describe('Inspired by mri', () => {
	// Note that we default to boolean and string where mri default to string and converts to number if valid

	test('Parse args', () => {
		let argv = argMate(['--no-moo']);
		expect(argv).toEqual({_: [], moo: false});
	});

	test('comprehensive', () => {
		let argv = argMate([
			'--name=meowmers',
			'bare',
			'-cats',
			'woo',
			'-h',
			'awesome',
			'--multi=quux',
			'--key',
			'value',
			'-b',
			'--bool',
			'--no-meep',
			'--multi=baz',
			'--number=-123',
			'--zeronum=0',
			'--',
			'--not-a-flag',
			'eek',
		]);

		expect(argv).toEqual({
			c: true,
			a: true,
			t: true,
			s: true,
			h: true,
			b: true,
			bool: true,
			key: true,
			multi: 'baz',
			meep: false,
			name: 'meowmers',
			number: -123,
			zeronum: 0,
			_: ['bare', 'woo', 'awesome', 'value', '--not-a-flag', 'eek'],
		});
	});

	test('nums', () => {
		let argv = argMate(
			['-x', '1234', '-y', '5.67', '-z', '1e7', '-w', '10f', '--hex', '0xdeadbeef', '789'],
			{
				x: {type: 'number'},
				y: {type: 'number'},
				z: {type: 'number'},
				w: {type: 'string'},
				hex: {type: 'hex'},
			}
		);

		expect(argv).toEqual({
			x: 1234,
			y: 5.67,
			z: 1e7,
			w: '10f',
			hex: 0xdeadbeef,
			_: ['789'],
		});
	});

	test('already a number', () => {
		let argv = argMate(['-x', 1234, 789], {
			x: {type: 'number'},
		});

		expect(argv).toEqual({x: 1234, _: ['789']});
	});
});
