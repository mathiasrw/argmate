// https://bun.sh/docs/test/writing

// @ts-expect-error
import {describe, expect, test} from 'bun:test';

import type {ArgMateEngine} from '../../src/types.js';
import {argMate, argMateMini} from '../helper.ts';

run(argMate);
run(argMateMini, ' Mini');

function run(argMate: ArgMateEngine, engineType = '') {
	describe('Special characters' + engineType, () => {
		describe('4o' + engineType, () => {
			describe('Spaces in Values', () => {
				test('Value with leading and trailing spaces', () => {
					expect(argMate(['--path=', '  /usr/local/bin  '])).toEqual({
						path: '  /usr/local/bin  ',
						_: [],
					});
				});

				test('Value with multiple spaces in the middle', () => {
					expect(argMate(['--name=', 'John    Doe'])).toEqual({
						name: 'John    Doe',
						_: [],
					});
				});

				test('Positional argument with spaces', () => {
					expect(argMate(['file with spaces.txt'])).toEqual({
						_: ['file with spaces.txt'],
					});
				});
			});

			describe('Quotes (Single and Double)', () => {
				test('Value with double quotes', () => {
					expect(argMate(['--message=', '"Hello World"'])).toEqual({
						message: '"Hello World"',
						_: [],
					});
				});

				test('Value with single quotes', () => {
					expect(argMate(['--message=', "'Hello World'"])).toEqual({
						message: "'Hello World'",
						_: [],
					});
				});

				test('Quoted value with spaces', () => {
					expect(argMate(['--title=', '"My Document"'])).toEqual({
						title: '"My Document"',
						_: [],
					});
				});

				test('Mixed quotes in value', () => {
					expect(argMate(['--quote=', '"This is \'quoted\' inside"'])).toEqual({
						quote: '"This is \'quoted\' inside"',
						_: [],
					});
				});
			});

			describe('Escape Characters', () => {
				test('Escape characters in value', () => {
					expect(argMate(['--path=', 'C:\\\\Program Files\\\\App'])).toEqual({
						path: 'C:\\\\Program Files\\\\App',
						_: [],
					});
				});

				test('Escape sequence in double-quoted value', () => {
					expect(argMate(['--query=', '"SELECT * FROM \\"users\\""'])).toEqual({
						query: '"SELECT * FROM \\"users\\""',
						_: [],
					});
				});

				test('Backslash in value', () => {
					expect(argMate(['--dir=', 'C:\\Windows\\System32'])).toEqual({
						dir: 'C:\\Windows\\System32',
						_: [],
					});
				});
			});

			describe('Special Shell Characters', () => {
				test('Dollar sign in value', () => {
					expect(argMate(['--price=', '$99.99'])).toEqual({price: '$99.99', _: []});
				});

				test('Ampersand in value', () => {
					expect(argMate(['--search=', 'fish & chips'])).toEqual({
						search: 'fish & chips',
						_: [],
					});
				});

				test('Pipe character in value', () => {
					expect(argMate(['--command=', 'ls | grep "txt"'])).toEqual({
						command: 'ls | grep "txt"',
						_: [],
					});
				});

				test('Greater-than sign in value', () => {
					expect(argMate(['--output=', 'log.txt > errors.txt'])).toEqual({
						output: 'log.txt > errors.txt',
						_: [],
					});
				});

				test('Less-than sign in value', () => {
					expect(argMate(['--input=', '<stdin>'])).toEqual({input: '<stdin>', _: []});
				});
			});
		});

		describe('Internationalization', () => {
			describe('Unicode Characters', () => {
				test('Unicode characters in value', () => {
					expect(argMate(['--text=', 'こんにちは'])).toEqual({text: 'こんにちは', _: []});
				});

				test('Unicode characters in positional argument', () => {
					expect(argMate(['ファイル.txt'])).toEqual({_: ['ファイル.txt']});
				});

				test('Mixed Unicode and ASCII characters', () => {
					expect(argMate(['--title=', 'Hello 世界'])).toEqual({
						title: 'Hello 世界',
						_: [],
					});
				});
			});

			describe('Non-ASCII Characters', () => {
				test('Non-ASCII characters in value', () => {
					expect(argMate(['--author=', 'Jürgen'])).toEqual({author: 'Jürgen', _: []});
				});

				test('Non-ASCII characters in positional argument', () => {
					expect(argMate(['Résumé.pdf'])).toEqual({_: ['Résumé.pdf']});
				});

				test('Non-ASCII characters in quoted value', () => {
					expect(argMate(['--quote=', '"Café au lait"'])).toEqual({
						quote: '"Café au lait"',
						_: [],
					});
				});
			});

			describe('Right-to-Left Languages', () => {
				test('Right-to-left language in value', () => {
					expect(argMate(['--text=', 'مرحبا'])).toEqual({text: 'مرحبا', _: []});
				});

				test('Right-to-left language in positional argument', () => {
					expect(argMate(['مرحبا.txt'])).toEqual({_: ['مرحبا.txt']});
				});

				test('Mixed right-to-left and left-to-right text', () => {
					expect(argMate(['--sentence=', 'Hello مرحبا'])).toEqual({
						sentence: 'Hello مرحبا',
						_: [],
					});
				});
			});

			describe('Emoji', () => {
				test('Emoji in value', () => {
					expect(argMate(['--reaction=', '👍'])).toEqual({reaction: '👍', _: []});
				});

				test('Multiple emojis in value', () => {
					expect(argMate(['--message=', '🚀🔥'])).toEqual({message: '🚀🔥', _: []});
				});

				test('Emoji in positional argument', () => {
					expect(argMate(['📁_file.txt'])).toEqual({_: ['📁_file.txt']});
				});

				test('Emoji mixed with text', () => {
					expect(argMate(['--status=', 'Happy 😊'])).toEqual({status: 'Happy 😊', _: []});
				});
			});
		});

		describe('Additional Edge Cases', () => {
			describe('Special Characters in Flags', () => {
				test('Dollar sign in flag name', () => {
					expect(argMate(['--$debug=', 'true'])).toEqual({
						$debug: engineType ? 'true' : true,
						_: [],
					});
				});

				test('Ampersand in flag name', () => {
					expect(argMate(['--enable&=', 'true'])).toEqual({
						'enable&': engineType ? 'true' : true,
						_: [],
					});
				});

				test.todo('Dash in flag name - needs investigation', () => {
					expect(argMate(['--enable-feature=true'])).toEqual({
						_: ['--enable-feature=true'],
					});
				});

				test.todo('Flag name starting with number - needs investigation');
			});

			describe('Unicode in Flags', () => {
				test('Unicode in flag name', () => {
					expect(argMate(['--テスト=', 'true'])).toEqual({
						テスト: engineType ? 'true' : true,
						_: [],
					});
				});

				test('Non-ASCII characters in flag name', () => {
					expect(argMate(['--Über=', 'true'])).toEqual({Über: engineType ? 'true' : true, _: []});
				});

				test('Right-to-left flag name', () => {
					expect(argMate(['--مرحبا=', 'true'])).toEqual({مرحبا: engineType ? 'true' : true, _: []});
				});

				test('Emoji in flag name', () => {
					expect(argMate(['--🚀=', 'launch'])).toEqual({'🚀': 'launch', _: []});
				});
			});

			describe('Edge Cases Combining Multiple Features', () => {
				test('Unicode and special characters in value', () => {
					expect(argMate(['--input=', 'ファイル$123'])).toEqual({
						input: 'ファイル$123',
						_: [],
					});
				});

				test('Right-to-left text with special characters', () => {
					expect(argMate(['--text=', 'مرحبا&سلام'])).toEqual({text: 'مرحبا&سلام', _: []});
				});

				test('Emoji and spaces in value', () => {
					expect(argMate(['--mood=', 'Happy 😊 all day'])).toEqual({
						mood: 'Happy 😊 all day',
						_: [],
					});
				});

				test('Emoji and special characters in value', () => {
					expect(argMate(['--symbol=', '❤️&💡'])).toEqual({symbol: '❤️&💡', _: []});
				});

				test('Unicode, Emoji, and special characters in positional argument', () => {
					expect(argMate(['ファイル_🚀&.txt'])).toEqual({_: ['ファイル_🚀&.txt']});
				});
			});
		});
		describe('Sonnet 3.5' + engineType, () => {
			// Spaces in values
			test('Value with spaces', () => {
				expect(argMate(['--name', 'John Doe'], {name: {type: 'string'}})).toEqual({
					_: [],
					name: 'John Doe',
				});
			});

			test('Value with multiple spaces', () => {
				expect(argMate(['--address', '123   Main   St'], {address: {type: 'string'}})).toEqual({
					_: [],
					address: '123   Main   St',
				});
			});

			test('Value with leading and trailing spaces', () => {
				expect(argMate(['--title', '  The Book  '], {title: {type: 'string'}})).toEqual({
					_: [],
					title: '  The Book  ',
				});
			});

			// Quotes (single and double)
			test('Value with double quotes', () => {
				expect(argMate(['--message', '"Hello, World!"'], {message: {type: 'string'}})).toEqual({
					_: [],
					message: '"Hello, World!"',
				});
			});

			test('Value with single quotes', () => {
				expect(argMate(['--message', "'Hello, World!'"], {message: {type: 'string'}})).toEqual({
					_: [],
					message: "'Hello, World!'",
				});
			});

			test('Value with nested quotes', () => {
				expect(argMate(['--dialog', '"He said, \'Hello!\'"'], {dialog: {type: 'string'}})).toEqual({
					_: [],
					dialog: '"He said, \'Hello!\'"',
				});
			});

			test('Value with unmatched quotes', () => {
				expect(argMate(['--text', '"Unmatched'], {text: {type: 'string'}})).toEqual({
					_: [],
					text: '"Unmatched',
				});
			});

			// Escape characters
			test('Value with escaped spaces', () => {
				expect(argMate(['--path', '/path/with\\ spaces'], {path: {type: 'string'}})).toEqual({
					_: [],
					path: '/path/with\\ spaces',
				});
			});

			test('Value with escaped quotes', () => {
				expect(argMate(['--json', '{"key":"value\\"}'], {json: {type: 'string'}})).toEqual({
					_: [],
					json: '{"key":"value\\"}',
				});
			});

			test('Value with escaped backslashes', () => {
				expect(argMate(['--regex', '\\\\d+'], {regex: {type: 'string'}})).toEqual({
					_: [],
					regex: '\\\\d+',
				});
			});

			// Special shell characters
			test('Value with dollar sign', () => {
				expect(argMate(['--price', '$9.99'], {price: {type: 'string'}})).toEqual({
					_: [],
					price: '$9.99',
				});
			});

			test('Value with ampersand', () => {
				expect(argMate(['--company', 'Johnson & Johnson'], {company: {type: 'string'}})).toEqual({
					_: [],
					company: 'Johnson & Johnson',
				});
			});

			test('Value with pipe', () => {
				expect(argMate(['--command', 'ls | grep .txt'], {command: {type: 'string'}})).toEqual({
					_: [],
					command: 'ls | grep .txt',
				});
			});

			test('Value with greater than sign', () => {
				expect(argMate(['--output', 'result > file.txt'], {output: {type: 'string'}})).toEqual({
					_: [],
					output: 'result > file.txt',
				});
			});

			test('Value with less than sign', () => {
				expect(argMate(['--input', 'cat < file.txt'], {input: {type: 'string'}})).toEqual({
					_: [],
					input: 'cat < file.txt',
				});
			});

			// Unicode characters
			test('Unicode in parameter name', () => {
				expect(argMate(['--名前', 'John'], {名前: {type: 'string'}})).toEqual({
					_: [],
					名前: 'John',
				});
			});

			test('Unicode in parameter value', () => {
				expect(argMate(['--name', '约翰'], {name: {type: 'string'}})).toEqual({
					_: [],
					name: '约翰',
				});
			});

			test('Unicode in both name and value', () => {
				expect(argMate(['--名前', '约翰'], {名前: {type: 'string'}})).toEqual({
					_: [],
					名前: '约翰',
				});
			});

			// Non-ASCII characters
			test('Non-ASCII Latin characters', () => {
				expect(argMate(['--name', 'Jöhn Dõe'], {name: {type: 'string'}})).toEqual({
					_: [],
					name: 'Jöhn Dõe',
				});
			});

			test('Cyrillic characters', () => {
				expect(argMate(['--name', 'Иван'], {name: {type: 'string'}})).toEqual({
					_: [],
					name: 'Иван',
				});
			});

			test('Greek characters', () => {
				expect(argMate(['--name', 'Ελένη'], {name: {type: 'string'}})).toEqual({
					_: [],
					name: 'Ελένη',
				});
			});

			test('Arabic characters', () => {
				expect(argMate(['--name', 'محمد'], {name: {type: 'string'}})).toEqual({
					_: [],
					name: 'محمد',
				});
			});

			// Right-to-left languages
			test('Hebrew text', () => {
				expect(argMate(['--message', 'שלום עולם'], {message: {type: 'string'}})).toEqual({
					_: [],
					message: 'שלום עולם',
				});
			});

			test('Arabic text with numerals', () => {
				expect(argMate(['--text', 'النص 123'], {text: {type: 'string'}})).toEqual({
					_: [],
					text: 'النص 123',
				});
			});

			test('Mixed LTR and RTL text', () => {
				expect(argMate(['--mixed', 'Hello שלום'], {mixed: {type: 'string'}})).toEqual({
					_: [],
					mixed: 'Hello שלום',
				});
			});

			// Emoji
			test('Single emoji', () => {
				expect(argMate(['--mood', '😊'], {mood: {type: 'string'}})).toEqual({
					_: [],
					mood: '😊',
				});
			});

			test('Multiple emojis', () => {
				expect(argMate(['--weather', '☀️🌤️🌧️'], {weather: {type: 'string'}})).toEqual({
					_: [],
					weather: '☀️🌤️🌧️',
				});
			});

			test('Text with emojis', () => {
				expect(argMate(['--status', 'I am happy 😊'], {status: {type: 'string'}})).toEqual({
					_: [],
					status: 'I am happy 😊',
				});
			});

			test('Emoji in parameter name', () => {
				expect(argMate(['--mood-😊', 'happy'], {'mood-😊': {type: 'string'}})).toEqual({
					_: [],
					'mood-😊': 'happy',
				});
			});

			// Combining special cases
			test('Unicode with spaces and quotes', () => {
				expect(argMate(['--quote', '"你好，世界"'], {quote: {type: 'string'}})).toEqual({
					_: [],
					quote: '"你好，世界"',
				});
			});

			test('Emoji with special characters', () => {
				expect(
					argMate(['--command', 'echo "Hello 👋" > greeting.txt'], {
						command: {type: 'string'},
					})
				).toEqual({_: [], command: 'echo "Hello 👋" > greeting.txt'});
			});

			test('RTL text with numbers and special characters', () => {
				expect(argMate(['--data', 'إدخال_$123.45'], {data: {type: 'string'}})).toEqual({
					_: [],
					data: 'إدخال_$123.45',
				});
			});

			test('Mixed scripts', () => {
				expect(
					argMate(['--text', 'Hello Здравствуйте こんにちは'], {text: {type: 'string'}})
				).toEqual({_: [], text: 'Hello Здравствуйте こんにちは'});
			});

			// Edge cases
			test('Zero-width space in value', () => {
				expect(argMate(['--name', 'John\u200BDoe'], {name: {type: 'string'}})).toEqual({
					_: [],
					name: 'John\u200BDoe',
				});
			});

			test('Non-breaking space in value', () => {
				expect(argMate(['--text', 'Hello\u00A0World'], {text: {type: 'string'}})).toEqual({
					_: [],
					text: 'Hello\u00A0World',
				});
			});

			test('Combining diacritical marks', () => {
				expect(argMate(['--name', 'n\u0303'], {name: {type: 'string'}})).toEqual({
					_: [],
					name: 'n\u0303',
				});
			});

			test('Surrogate pairs', () => {
				expect(argMate(['--emoji', '𝄞'], {emoji: {type: 'string'}})).toEqual({
					_: [],
					emoji: '𝄞',
				});
			});

			test('Control characters', () => {
				expect(argMate(['--text', 'Line1\nLine2'], {text: {type: 'string'}})).toEqual({
					_: [],
					text: 'Line1\nLine2',
				});
			});

			test('Null character in string', () => {
				expect(argMate(['--text', 'Hello\0World'], {text: {type: 'string'}})).toEqual({
					_: [],
					text: 'Hello\0World',
				});
			});

			test('Very long Unicode string', () => {
				const longString = '🌈'.repeat(1000);
				expect(argMate(['--long', longString], {long: {type: 'string'}})).toEqual({
					_: [],
					long: longString,
				});
			});

			test('Mixing positional args with special characters', () => {
				expect(argMate(['file.txt', '--name=', 'John Doe', 'data.csv'])).toEqual({
					_: ['file.txt', 'data.csv'],
					name: 'John Doe',
				});
			});

			test('Unicode in positional args', () => {
				expect(argMate(['файл.txt', '--name=', 'John', '数据.csv'])).toEqual({
					_: ['файл.txt', '数据.csv'],
					name: 'John',
				});
			});

			test('Emoji in positional args', () => {
				expect(argMate(['📁', '--type=', 'folder', '📄'])).toEqual({
					_: ['📁', '📄'],
					type: 'folder',
				});
			});
		});

		describe('Exotic Input' + engineType, () => {
			describe('Shorthand notation', () => {
				test('Space in value', () => {
					const argv = argMate(['--foo=bar baz']);
					expect(argv).toEqual({_: [], foo: 'bar baz'});
				});

				test('Single quotes', () => {
					const argv = argMate(["--foo='bar baz'"]);
					expect(argv).toEqual({_: [], foo: "'bar baz'"});
				});

				test('Double quotes', () => {
					const argv = argMate(['--foo="bar baz"']);
					expect(argv).toEqual({_: [], foo: '"bar baz"'});
				});

				test('Escaped quotes', () => {
					const argv = argMate(['--foo=\\"bar\\"']);
					expect(argv).toEqual({_: [], foo: '\\"bar\\"'});
				});

				test('Unicode characters', () => {
					const argv = argMate(['--foo=こんにちは']);
					expect(argv).toEqual({_: [], foo: 'こんにちは'});
				});

				test('Emoji', () => {
					const argv = argMate(['--foo=🚀']);
					expect(argv).toEqual({_: [], foo: '🚀'});
				});

				test('Special characters', () => {
					const argv = argMate(['--foo=!@#$%^&*()']);
					expect(argv).toEqual({_: [], foo: '!@#$%^&*()'});
				});

				test('Backslashes', () => {
					const argv = argMate(['--path=C:\\Program Files\\App']);
					expect(argv).toEqual({_: [], path: 'C:\\Program Files\\App'});
				});

				test('Forward slashes', () => {
					const argv = argMate(['--url=http://example.com/path']);
					expect(argv).toEqual({_: [], url: 'http://example.com/path'});
				});

				test('Multiple equal signs', () => {
					const argv = argMate(['--equation=y=mx+b']);
					expect(argv).toEqual({_: [], equation: 'y=mx+b'});
				});

				test('Value starting with hyphen', () => {
					const argv = argMate(['--range=-10,10']);
					expect(argv).toEqual({_: [], range: '-10,10'});
				});

				test('Empty string value', () => {
					const argv = argMate(['--empty=""']);
					expect(argv).toEqual({_: [], empty: '""'});
				});

				test('Camel case key', () => {
					const argv = argMate(['--camelCase=value']);
					expect(argv).toEqual({_: [], camelCase: 'value'});
				});

				test('Snake case key', () => {
					const argv = argMate(['--snake_case=value']);
					expect(argv).toEqual({_: [], snake_case: 'value'});
				});

				test('Numeric key', () => {
					const argv = argMate(['--123=value']);
					expect(argv).toEqual({_: [], '123': 'value'});
				});

				test('Key with underscore', () => {
					const argv = argMate(['--_private=value']);
					expect(argv).toEqual({_: [], _private: 'value'});
				});

				test('Value with comma', () => {
					const argv = argMate(['--list=a,b,c']);
					expect(argv).toEqual({_: [], list: 'a,b,c'});
				});

				test('Value with semicolon', () => {
					const argv = argMate(['--command=git add; git commit']);
					expect(argv).toEqual({_: [], command: 'git add; git commit'});
				});

				test('Value with pipe', () => {
					const argv = argMate(['--pipeline=grep foo | sort']);
					expect(argv).toEqual({_: [], pipeline: 'grep foo | sort'});
				});

				test('Value with ampersand', () => {
					const argv = argMate(['--bg=node server.js &']);
					expect(argv).toEqual({_: [], bg: 'node server.js &'});
				});

				test('Value with parentheses', () => {
					const argv = argMate(['--group=(a+b)']);
					expect(argv).toEqual({_: [], group: '(a+b)'});
				});

				test('Value with square brackets', () => {
					const argv = argMate(['--array=[1,2,3]']);
					expect(argv).toEqual({_: [], array: '[1,2,3]'});
				});

				test('Value with curly braces', () => {
					const argv = argMate(['--json={"key":"value"}']);
					expect(argv).toEqual({_: [], json: '{"key":"value"}'});
				});

				test('Value with angle brackets', () => {
					const argv = argMate(['--html=<div>content</div>']);
					expect(argv).toEqual({_: [], html: '<div>content</div>'});
				});

				test('Value with backticks', () => {
					const argv = argMate(['--command=`echo Hello`']);
					expect(argv).toEqual({_: [], command: '`echo Hello`'});
				});

				test('Value with dollar sign', () => {
					const argv = argMate(['--var=$HOME']);
					expect(argv).toEqual({_: [], var: '$HOME'});
				});

				test('Value with percent sign', () => {
					const argv = argMate(['--encoded=%20']);
					expect(argv).toEqual({_: [], encoded: '%20'});
				});

				test('Value with caret', () => {
					const argv = argMate(['--regex=^start']);
					expect(argv).toEqual({_: [], regex: '^start'});
				});

				test('Value with tilde', () => {
					const argv = argMate(['--home=~/Documents']);
					expect(argv).toEqual({_: [], home: '~/Documents'});
				});
			});

			describe('Split assign notation', () => {
				test('Space in value', () => {
					const argv = argMate(['--foo=', 'bar baz']);
					expect(argv).toEqual({_: [], foo: 'bar baz'});
				});

				test('Single quotes', () => {
					const argv = argMate(['--foo=', "'bar baz'"]);
					expect(argv).toEqual({_: [], foo: "'bar baz'"});
				});

				test('Double quotes', () => {
					const argv = argMate(['--foo=', '"bar baz"']);
					expect(argv).toEqual({_: [], foo: '"bar baz"'});
				});

				test('Escaped quotes', () => {
					const argv = argMate(['--foo=', '\\"bar\\"']);
					expect(argv).toEqual({_: [], foo: '\\"bar\\"'});
				});

				test('Unicode characters', () => {
					const argv = argMate(['--foo=', 'こんにちは']);
					expect(argv).toEqual({_: [], foo: 'こんにちは'});
				});

				test('Emoji', () => {
					const argv = argMate(['--foo=', '🚀']);
					expect(argv).toEqual({_: [], foo: '🚀'});
				});

				test('Special characters', () => {
					const argv = argMate(['--foo=', '!@#$%^&*()']);
					expect(argv).toEqual({_: [], foo: '!@#$%^&*()'});
				});

				test('Backslashes', () => {
					const argv = argMate(['--path=', 'C:\\Program Files\\App']);
					expect(argv).toEqual({_: [], path: 'C:\\Program Files\\App'});
				});

				test('Forward slashes', () => {
					const argv = argMate(['--url=', 'http://example.com/path']);
					expect(argv).toEqual({_: [], url: 'http://example.com/path'});
				});

				test('Multiple equal signs', () => {
					const argv = argMate(['--equation=', 'y=mx+b']);
					expect(argv).toEqual({_: [], equation: 'y=mx+b'});
				});

				test('Value starting with hyphen', () => {
					const argv = argMate(['--range=', '-10,10']);
					expect(argv).toEqual({_: [], range: '-10,10'});
				});

				test('Empty string value', () => {
					const argv = argMate(['--empty=', '""']);
					expect(argv).toEqual({_: [], empty: '""'});
				});

				test('Camel case key', () => {
					const argv = argMate(['--camelCase=', 'value']);
					expect(argv).toEqual({_: [], camelCase: 'value'});
				});

				test('Snake case key', () => {
					const argv = argMate(['--snake_case=', 'value']);
					expect(argv).toEqual({_: [], snake_case: 'value'});
				});

				test('Numeric key', () => {
					const argv = argMate(['--123=', 'value']);
					expect(argv).toEqual({_: [], '123': 'value'});
				});

				test('Key with underscore', () => {
					const argv = argMate(['--_private=', 'value']);
					expect(argv).toEqual({_: [], _private: 'value'});
				});

				test('Value with comma', () => {
					const argv = argMate(['--list=', 'a,b,c']);
					expect(argv).toEqual({_: [], list: 'a,b,c'});
				});

				test('Value with semicolon', () => {
					const argv = argMate(['--command=', 'git add; git commit']);
					expect(argv).toEqual({_: [], command: 'git add; git commit'});
				});

				test('Value with pipe', () => {
					const argv = argMate(['--pipeline=', 'grep foo | sort']);
					expect(argv).toEqual({_: [], pipeline: 'grep foo | sort'});
				});

				test('Value with ampersand', () => {
					const argv = argMate(['--bg=', 'node server.js &']);
					expect(argv).toEqual({_: [], bg: 'node server.js &'});
				});

				test('Value with parentheses', () => {
					const argv = argMate(['--group=', '(a+b)']);
					expect(argv).toEqual({_: [], group: '(a+b)'});
				});

				test('Value with square brackets', () => {
					const argv = argMate(['--array=', '[1,2,3]']);
					expect(argv).toEqual({_: [], array: '[1,2,3]'});
				});

				test('Value with curly braces', () => {
					const argv = argMate(['--json=', '{"key":"value"}']);
					expect(argv).toEqual({_: [], json: '{"key":"value"}'});
				});

				test('Value with angle brackets', () => {
					const argv = argMate(['--html=', '<div>content</div>']);
					expect(argv).toEqual({_: [], html: '<div>content</div>'});
				});

				test('Value with backticks', () => {
					const argv = argMate(['--command=', '`echo Hello`']);
					expect(argv).toEqual({_: [], command: '`echo Hello`'});
				});

				test('Value with dollar sign', () => {
					const argv = argMate(['--var=', '$HOME']);
					expect(argv).toEqual({_: [], var: '$HOME'});
				});

				test('Value with percent sign', () => {
					const argv = argMate(['--encoded=', '%20']);
					expect(argv).toEqual({_: [], encoded: '%20'});
				});

				test('Value with caret', () => {
					const argv = argMate(['--regex=', '^start']);
					expect(argv).toEqual({_: [], regex: '^start'});
				});

				test('Value with tilde', () => {
					const argv = argMate(['--home=', '~/Documents']);
					expect(argv).toEqual({_: [], home: '~/Documents'});
				});
			});
		});
	});
}
