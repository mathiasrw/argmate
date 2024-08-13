// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

function run(argMate, type = '') {
	describe.todo('Exotic Input' + type, () => {
		describe('Shorthand notation', () => {
			test('Space in value', () => {
				let argv = argMate(['--foo=bar baz']);
				expect(argv).toEqual({_: [], foo: 'bar baz'});
			});

			test('Single quotes', () => {
				let argv = argMate(["--foo='bar baz'"]);
				expect(argv).toEqual({_: [], foo: "'bar baz'"});
			});

			test('Double quotes', () => {
				let argv = argMate(['--foo="bar baz"']);
				expect(argv).toEqual({_: [], foo: '"bar baz"'});
			});

			test('Escaped quotes', () => {
				let argv = argMate(['--foo=\\"bar\\"']);
				expect(argv).toEqual({_: [], foo: '"bar"'});
			});

			test('Unicode characters', () => {
				let argv = argMate(['--foo=こんにちは']);
				expect(argv).toEqual({_: [], foo: 'こんにちは'});
			});

			test('Emoji', () => {
				let argv = argMate(['--foo=🚀']);
				expect(argv).toEqual({_: [], foo: '🚀'});
			});

			test('Special characters', () => {
				let argv = argMate(['--foo=!@#$%^&*()']);
				expect(argv).toEqual({_: [], foo: '!@#$%^&*()'});
			});

			test('Backslashes', () => {
				let argv = argMate(['--path=C:\\Program Files\\App']);
				expect(argv).toEqual({_: [], path: 'C:\\Program Files\\App'});
			});

			test('Forward slashes', () => {
				let argv = argMate(['--url=http://example.com/path']);
				expect(argv).toEqual({_: [], url: 'http://example.com/path'});
			});

			test('Multiple equal signs', () => {
				let argv = argMate(['--equation=y=mx+b']);
				expect(argv).toEqual({_: [], equation: 'y=mx+b'});
			});

			test('Value starting with hyphen', () => {
				let argv = argMate(['--range=-10,10']);
				expect(argv).toEqual({_: [], range: '-10,10'});
			});

			test('Empty string value', () => {
				let argv = argMate(['--empty=""']);
				expect(argv).toEqual({_: [], empty: '""'});
			});

			test('Camel case key', () => {
				let argv = argMate(['--camelCase=value']);
				expect(argv).toEqual({_: [], camelCase: 'value'});
			});

			test('Snake case key', () => {
				let argv = argMate(['--snake_case=value']);
				expect(argv).toEqual({_: [], snake_case: 'value'});
			});

			test('Kebab case key', () => {
				let argv = argMate(['--kebab-case=value']);
				expect(argv).toEqual({_: [], 'kebab-case': 'value'});
			});

			test('Numeric key', () => {
				let argv = argMate(['--123=value']);
				expect(argv).toEqual({_: [], '123': 'value'});
			});

			test('Key with underscore', () => {
				let argv = argMate(['--_private=value']);
				expect(argv).toEqual({_: [], _private: 'value'});
			});

			test('Value with comma', () => {
				let argv = argMate(['--list=a,b,c']);
				expect(argv).toEqual({_: [], list: 'a,b,c'});
			});

			test('Value with semicolon', () => {
				let argv = argMate(['--command=git add; git commit']);
				expect(argv).toEqual({_: [], command: 'git add; git commit'});
			});

			test('Value with pipe', () => {
				let argv = argMate(['--pipeline=grep foo | sort']);
				expect(argv).toEqual({_: [], pipeline: 'grep foo | sort'});
			});

			test('Value with ampersand', () => {
				let argv = argMate(['--bg=node server.js &']);
				expect(argv).toEqual({_: [], bg: 'node server.js &'});
			});

			test('Value with parentheses', () => {
				let argv = argMate(['--group=(a+b)']);
				expect(argv).toEqual({_: [], group: '(a+b)'});
			});

			test('Value with square brackets', () => {
				let argv = argMate(['--array=[1,2,3]']);
				expect(argv).toEqual({_: [], array: '[1,2,3]'});
			});

			test('Value with curly braces', () => {
				let argv = argMate(['--json={"key":"value"}']);
				expect(argv).toEqual({_: [], json: '{"key":"value"}'});
			});

			test('Value with angle brackets', () => {
				let argv = argMate(['--html=<div>content</div>']);
				expect(argv).toEqual({_: [], html: '<div>content</div>'});
			});

			test('Value with backticks', () => {
				let argv = argMate(['--command=`echo Hello`']);
				expect(argv).toEqual({_: [], command: '`echo Hello`'});
			});

			test('Value with dollar sign', () => {
				let argv = argMate(['--var=$HOME']);
				expect(argv).toEqual({_: [], var: '$HOME'});
			});

			test('Value with percent sign', () => {
				let argv = argMate(['--encoded=%20']);
				expect(argv).toEqual({_: [], encoded: '%20'});
			});

			test('Value with caret', () => {
				let argv = argMate(['--regex=^start']);
				expect(argv).toEqual({_: [], regex: '^start'});
			});

			test('Value with tilde', () => {
				let argv = argMate(['--home=~/Documents']);
				expect(argv).toEqual({_: [], home: '~/Documents'});
			});
		});

		describe('Split assign notation', () => {
			test('Space in value', () => {
				let argv = argMate(['--foo=', 'bar baz']);
				expect(argv).toEqual({_: [], foo: 'bar baz'});
			});

			test('Single quotes', () => {
				let argv = argMate(['--foo=', "'bar baz'"]);
				expect(argv).toEqual({_: [], foo: "'bar baz'"});
			});

			test('Double quotes', () => {
				let argv = argMate(['--foo=', '"bar baz"']);
				expect(argv).toEqual({_: [], foo: '"bar baz"'});
			});

			test('Escaped quotes', () => {
				let argv = argMate(['--foo=', '\\"bar\\"']);
				expect(argv).toEqual({_: [], foo: '\\"bar\\"'});
			});

			test('Unicode characters', () => {
				let argv = argMate(['--foo=', 'こんにちは']);
				expect(argv).toEqual({_: [], foo: 'こんにちは'});
			});

			test('Emoji', () => {
				let argv = argMate(['--foo=', '🚀']);
				expect(argv).toEqual({_: [], foo: '🚀'});
			});

			test('Special characters', () => {
				let argv = argMate(['--foo=', '!@#$%^&*()']);
				expect(argv).toEqual({_: [], foo: '!@#$%^&*()'});
			});

			test('Backslashes', () => {
				let argv = argMate(['--path=', 'C:\\Program Files\\App']);
				expect(argv).toEqual({_: [], path: 'C:\\Program Files\\App'});
			});

			test('Forward slashes', () => {
				let argv = argMate(['--url=', 'http://example.com/path']);
				expect(argv).toEqual({_: [], url: 'http://example.com/path'});
			});

			test('Multiple equal signs', () => {
				let argv = argMate(['--equation=', 'y=mx+b']);
				expect(argv).toEqual({_: [], equation: 'y=mx+b'});
			});

			test('Value starting with hyphen', () => {
				let argv = argMate(['--range=', '-10,10']);
				expect(argv).toEqual({_: [], range: '-10,10'});
			});

			test('Empty string value', () => {
				let argv = argMate(['--empty=', '""']);
				expect(argv).toEqual({_: [], empty: '""'});
			});

			test('Camel case key', () => {
				let argv = argMate(['--camelCase=', 'value']);
				expect(argv).toEqual({_: [], camelCase: 'value'});
			});

			test('Snake case key', () => {
				let argv = argMate(['--snake_case=', 'value']);
				expect(argv).toEqual({_: [], snake_case: 'value'});
			});

			test('Kebab case key', () => {
				let argv = argMate(['--kebab-case=', 'value']);
				expect(argv).toEqual({_: [], 'kebab-case': 'value'});
			});

			test('Numeric key', () => {
				let argv = argMate(['--123=', 'value']);
				expect(argv).toEqual({_: [], '123': 'value'});
			});

			test('Key with underscore', () => {
				let argv = argMate(['--_private=', 'value']);
				expect(argv).toEqual({_: [], _private: 'value'});
			});

			test('Value with comma', () => {
				let argv = argMate(['--list=', 'a,b,c']);
				expect(argv).toEqual({_: [], list: 'a,b,c'});
			});

			test('Value with semicolon', () => {
				let argv = argMate(['--command=', 'git add; git commit']);
				expect(argv).toEqual({_: [], command: 'git add; git commit'});
			});

			test('Value with pipe', () => {
				let argv = argMate(['--pipeline=', 'grep foo | sort']);
				expect(argv).toEqual({_: [], pipeline: 'grep foo | sort'});
			});

			test('Value with ampersand', () => {
				let argv = argMate(['--bg=', 'node server.js &']);
				expect(argv).toEqual({_: [], bg: 'node server.js &'});
			});

			test('Value with parentheses', () => {
				let argv = argMate(['--group=', '(a+b)']);
				expect(argv).toEqual({_: [], group: '(a+b)'});
			});

			test('Value with square brackets', () => {
				let argv = argMate(['--array=', '[1,2,3]']);
				expect(argv).toEqual({_: [], array: '[1,2,3]'});
			});

			test('Value with curly braces', () => {
				let argv = argMate(['--json=', '{"key":"value"}']);
				expect(argv).toEqual({_: [], json: '{"key":"value"}'});
			});

			test('Value with angle brackets', () => {
				let argv = argMate(['--html=', '<div>content</div>']);
				expect(argv).toEqual({_: [], html: '<div>content</div>'});
			});

			test('Value with backticks', () => {
				let argv = argMate(['--command=', '`echo Hello`']);
				expect(argv).toEqual({_: [], command: '`echo Hello`'});
			});

			test('Value with dollar sign', () => {
				let argv = argMate(['--var=', '$HOME']);
				expect(argv).toEqual({_: [], var: '$HOME'});
			});

			test('Value with percent sign', () => {
				let argv = argMate(['--encoded=', '%20']);
				expect(argv).toEqual({_: [], encoded: '%20'});
			});

			test('Value with caret', () => {
				let argv = argMate(['--regex=', '^start']);
				expect(argv).toEqual({_: [], regex: '^start'});
			});

			test('Value with tilde', () => {
				let argv = argMate(['--home=', '~/Documents']);
				expect(argv).toEqual({_: [], home: '~/Documents'});
			});
		});
	});
}
