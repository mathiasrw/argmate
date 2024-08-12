// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../src/argMate';
import argMateLite from '../src/argMateLite';

let argv;

run(argMate);
run(argMateLite, ' lite');

function run(argMate, type = '') {
	describe('Conflict' + type, () => {
		test.if(!type)('Opposing pairs A', () => {
			expect(() =>
				argMate(
					'--foo --bar'.split(' '),
					{
						foo: false,
						bar: {conflict: 'foo'},
					},
					{
						error: msg => {
							throw 'Error was called';
						},
					}
				)
			).toThrow('Error was called');
		});

		test.if(!type)('Opposing pairs B', done => {
			argMate(
				'--foo --bar'.split(' '),
				{
					foo: false,
					bar: {conflict: 'foo'},
				},
				{
					error: msg => {
						expect(msg).toContain('conflict');
						expect(msg).toContain('foo');
						expect(msg).toContain('bar');
						done();
					},
				}
			);
		});

		test.todo('Love triangle', () => {
			argv = argMate('--no-foo bar --foo2 bar2'.split(' '));
			expect(argv).toEqual({
				_: ['bar', 'bar2'],
				foo: false,
				foo2: true,
			});
		});
	});
}
