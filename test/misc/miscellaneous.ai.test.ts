// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

let argv;

function run(argMate, type = '') {
	describe('Basic Functionality' + type, () => {
		describe('4o' + type, () => {
			test('Single flag', () => {
				expect(argMate(['--verbose'])).toEqual({verbose: true, _: []});
			});

			test('Multiple flags', () => {
				expect(argMate(['-v', '-d'])).toEqual({v: true, d: true, _: []});
			});

			test('Combined short flags', () => {
				expect(argMate(['-vd'])).toEqual({v: true, d: true, _: []});
			});

			test('Flag with short assignment', () => {
				expect(argMate(['--timeout=30'])).toEqual({timeout: 30, _: []});
			});

			test('Flag with separated assignment', () => {
				expect(argMate(['--timeout=', '30'])).toEqual({timeout: 30, _: []});
			});

			test('Flag with value containing equal sign', () => {
				expect(argMate(['--config=key=value'])).toEqual({config: 'key=value', _: []});
			});

			test('Flag with quoted value in short assignment', () => {
				expect(argMate(['--message="Hello World"'])).toEqual({
					message: '"Hello World"',
					_: [],
				});
			});

			test('Flag with quoted value in separated assignment', () => {
				expect(argMate(['--message=', 'Hello World'])).toEqual({
					message: 'Hello World',
					_: [],
				});
			});

			test('Positional arguments', () => {
				expect(argMate(['file1.txt', 'file2.txt'])).toEqual({
					_: ['file1.txt', 'file2.txt'],
				});
			});

			test('Mixed flags and positional arguments', () => {
				expect(argMate(['--verbose', 'file.txt'])).toEqual({
					verbose: true,
					_: ['file.txt'],
				});
			});

			test.if(!type)('Negated flag', () => {
				expect(argMate(['--no-cache'])).toEqual({cache: false, _: []});
			});

			test('Flag with multiple values (array)', () => {
				expect(
					argMate(['--include', 'file1.js', '--include', 'file2.js'], {
						include: {type: 'string[]'},
					})
				).toEqual({include: ['file1.js', 'file2.js'], _: []});
			});

			test('Integer value parsing', () => {
				expect(argMate(['--port=8080'], {port: 0})).toEqual({port: 8080, _: []});
			});

			test('Float value parsing', () => {
				expect(argMate(['--threshold=0.75'], {threshold: 0.0})).toEqual({
					threshold: 0.75,
					_: [],
				});
			});

			test('Hexadecimal value parsing', () => {
				expect(argMate(['--color=0xff00ff'])).toEqual({color: '0xff00ff', _: []});
			});

			test('Boolean flag and key-value pair', () => {
				expect(argMate(['--verbose', '--timeout=10'], {timeout: 0})).toEqual({
					verbose: true,
					timeout: 10,
					_: [],
				});
			});

			test('Boolean flag with multiple aliases', () => {
				expect(argMate(['-v', '--verbose'], {verbose: {alias: ['v']}})).toEqual({
					verbose: true,
					_: [],
				});
			});

			test.todo('Conflicting flags', () => {
				expect(() =>
					argMate(['--foo', '--bar'], {foo: false, bar: {conflict: 'foo'}})
				).toThrow('conflict');
			});

			test('Invalid value type', done => {
				argMate(
					['--age=twenty'],
					{age: {type: 'number'}},
					{
						error: msg => {
							expect(msg).toContain('not a valid number');
							done();
						},
					}
				);
			});
			test('Invalid value type2', done => {
				argMate(
					['--age=twenty'],
					{age: {default: 7}},
					{
						error: msg => {
							expect(msg).toContain('not a valid number');
							done();
						},
					}
				);
			});

			test('Missing required string', done => {
				argMate(
					['--username'],
					{username: {type: 'string', mandatory: true}},
					{
						error: msg => {
							expect(msg).toContain('No data provided');
							done();
						},
					}
				);
			});

			test('Unknown flag with strict mode', done => {
				argMate(
					['--unknown'],
					{},
					{
						allowUnknown: false,
						error: msg => {
							expect(msg).toContain('Unknown parameter');
							done();
						},
					}
				);
			});

			test('Flag with no value assignment', done => {
				argMate(
					['--timeout='],
					{timeout: 0},
					{
						error: msg => {
							expect(msg).toContain('No data provided');
							done();
						},
					}
				);
			});

			test('Flag with alias and value', () => {
				expect(argMate(['-t', '30'], {timeout: {alias: 't'}})).toEqual({
					timeout: true,
					_: ['30'], // yep, its a string as its an argument and not a parameter
				});
			});

			test('String with alias and value', () => {
				expect(argMate(['-t', 'abc'], {timeout: {type: 'string', alias: 't'}})).toEqual({
					timeout: 'abc',
					_: [],
				});
			});

			test('Positional argument with hyphen', () => {
				expect(argMate(['file-name.txt'])).toEqual({_: ['file-name.txt']});
			});

			test('Positional argument with equal sign', () => {
				expect(argMate(['file=name.txt'])).toEqual({_: ['file=name.txt']});
			});

			test('Flag with special characters in value', () => {
				expect(argMate(['--path=/usr/local/bin'])).toEqual({path: '/usr/local/bin', _: []});
			});

			test('Case-sensitive flag', () => {
				expect(argMate(['--FOO'], {FOO: {type: 'boolean'}})).toEqual({FOO: true, _: []});
			});

			test('Case-sensitive flag with alias', () => {
				expect(argMate(['--foo'], {FOO: {type: 'boolean', alias: 'foo'}})).toEqual({
					FOO: true,
					_: [],
				});
			});

			test.todo('Flag with numeric key', () => {
				expect(argMate(['-123', '456'], {})).toEqual({_: ['-123', '456']});
			});

			test('Flag with negative numeric value', () => {
				expect(argMate(['--delta=-5'], {delta: 0})).toEqual({delta: -5, _: []});
			});

			test('Flag with float array values', () => {
				expect(
					argMate(['--ratios=0.5', '--ratios=1.0', '--ratios=1.5'], {
						ratios: {type: 'float[]'},
					})
				).toEqual({ratios: [0.5, 1.0, 1.5], _: []});
			});

			test('Multiple positional arguments and flags', () => {
				expect(argMate(['file1.txt', '--verbose', 'file2.txt'])).toEqual({
					verbose: true,
					_: ['file1.txt', 'file2.txt'],
				});
			});

			test('Flag with multiple value types', () => {
				expect(argMate(['--size', 'large', '--port', '8080'], {size: '', port: 0})).toEqual(
					{
						size: 'large',
						port: 8080,
						_: [],
					}
				);
			});

			test('Flag with value containing spaces', () => {
				expect(argMate(['--message=', 'Hello World'])).toEqual({
					message: 'Hello World',
					_: [],
				});
			});

			test.todo('Flag with array of strings', () => {
				expect(
					argMate(['--files=file1.txt,file2.txt,file3.txt'], {files: {type: 'string[]'}})
				).toEqual({files: ['file1.txt', 'file2.txt', 'file3.txt'], _: []});
			});

			test('Flag with array of integers', () => {
				expect(argMate(['--ids=1', '--ids=2', '--ids=3'], {ids: {type: 'int[]'}})).toEqual({
					ids: [1, 2, 3],
					_: [],
				});
			});

			test.todo('Flag with invalid integer value in array', done => {
				argMate(
					['--ids=1', '--ids=abc', '--ids=3'],
					{ids: {type: 'int[]'}},
					{
						error: msg => {
							expect(msg).toContain('Invalid value');
							done();
						},
					}
				);
			});

			test.todo('Flag with file path containing spaces', () => {
				expect(argMate(['--path', '/my files/doc.txt'])).toEqual({
					path: '/my files/doc.txt',
					_: [],
				});
			});

			test.todo('Flag with URL as value', () => {
				expect(argMate(['--url', 'https://example.com'])).toEqual({
					url: 'https://example.com',
					_: [],
				});
			});

			test.todo('Flag with hyphenated value', () => {
				expect(argMate(['--option', 'long-value'])).toEqual({option: 'long-value', _: []});
			});

			test('Case-sensitive aliases', () => {
				expect(argMate(['--FOO'], {FOO: {alias: ['f']}})).toEqual({FOO: true, _: []});
			});

			test.todo('Alias with assigned value', () => {
				expect(argMate(['-u', 'john'], {username: {alias: 'u'}})).toEqual({
					username: 'john',
					_: [],
				});
			});

			test('Flag with quoted string containing spaces', () => {
				expect(argMate(['--name=', 'John Doe'])).toEqual({name: 'John Doe', _: []});
			});

			test.todo('Flag with multiple special characters', () => {
				expect(argMate(['--key', '!@#$%^&*()_+'])).toEqual({key: '!@#$%^&*()_+', _: []});
			});

			test('Mixed short and long flags', () => {
				expect(argMate(['-v', '--version'], {version: {alias: 'v'}})).toEqual({
					version: true,
					_: [],
				});
			});

			test.todo('Flag with value containing commas', () => {
				expect(argMate(['--tags', 'tag1,tag2,tag3'])).toEqual({
					tags: 'tag1,tag2,tag3',
					_: [],
				});
			});

			test('Flag with nested alias', () => {
				expect(argMate(['--verbose', '--v'], {verbose: {alias: ['v']}})).toEqual({
					verbose: true,
					_: [],
				});
			});

			test.todo('Flag with array and negated flag', () => {
				expect(
					argMate(['--no-cache', '--include=file1.js', '--include=file2.js'], {
						include: {type: 'string[]'},
					})
				).toEqual({cache: false, include: ['file1.js', 'file2.js'], _: []});
			});

			test('Invalid flag with no assignment', done => {
				argMate(
					['--foo='],
					{foo: {type: 'string'}},
					{
						error: msg => {
							expect(msg).toContain('No data provided');
							done();
						},
					}
				);
			});

			test.todo('Negated flag with alias', () => {
				expect(argMate(['--no-log', '--l'], {log: {alias: ['l']}})).toEqual({
					log: false,
					_: [],
				});
			});

			test('Flag with negative float value', () => {
				expect(argMate(['--rate=-2.5'], {rate: 0.0})).toEqual({rate: -2.5, _: []});
			});

			test.todo('Flag with array of strings containing special characters', () => {
				expect(argMate(['--chars=@,#,$'], {chars: {type: 'string[]'}})).toEqual({
					chars: ['@', '#', '$'],
					_: [],
				});
			});

			test('Mixed boolean flag and key-value pair', () => {
				expect(argMate(['--debug', '--level=3'], {level: 0})).toEqual({
					debug: true,
					level: 3,
					_: [],
				});
			});

			test('Flag with reserved characters in value', () => {
				expect(argMate(['--query=SELECT * FROM table WHERE id=1'])).toEqual({
					query: 'SELECT * FROM table WHERE id=1',
					_: [],
				});
			});
		});

		describe('Sonnet 3.5' + type, () => {
			test('Basic single flag', () => {
				expect(argMate(['--verbose'], {})).toEqual({_: [], verbose: true});
			});

			test('Multiple flags', () => {
				expect(argMate(['--verbose', '--quiet', '--debug'], {})).toEqual({
					_: [],
					verbose: true,
					quiet: true,
					debug: true,
				});
			});

			test('Flag with value', () => {
				expect(argMate(['--port', '8080'], {port: 0})).toEqual({_: [], port: 8080});
			});

			test('Flag with value containing equal sign', () => {
				expect(
					argMate(['--url=http://example.com', '--foo', 'bar=baz'], {url: '', foo: ''})
				).toEqual({_: [], url: 'http://example.com', foo: 'bar=baz'});
			});

			test('Positional arguments', () => {
				expect(argMate(['file1.txt', 'file2.txt'], {})).toEqual({
					_: ['file1.txt', 'file2.txt'],
				});
			});

			test('Mixed flags and positional arguments', () => {
				expect(argMate(['--verbose', 'file1.txt', '--quiet', 'file2.txt'], {})).toEqual({
					_: ['file1.txt', 'file2.txt'],
					verbose: true,
					quiet: true,
				});
			});

			test('Short flags', () => {
				expect(argMate(['-v', '-q'], {})).toEqual({_: [], v: true, q: true});
			});

			test('Grouped short flags', () => {
				expect(argMate(['-vqd'], {})).toEqual({_: [], v: true, q: true, d: true});
			});

			test('Short flag with value', () => {
				expect(argMate(['-p', '8080'], {p: 0})).toEqual({_: [], p: 8080});
			});

			test.todo('Short flag with attached value', () => {
				expect(argMate(['-p8080'], {p: 0})).toEqual({_: [], p: 8080});
			});

			test('Long flag with attached value', () => {
				expect(argMate(['--port=8080'], {port: 0})).toEqual({_: [], port: 8080});
			});

			test('Negative numbers as values', () => {
				expect(
					argMate(['--temp', '-5', '--pressure', '-10.5'], {temp: 0, pressure: 0})
				).toEqual({_: [], temp: -5, pressure: -10.5});
			});

			test('Flags with default values', () => {
				expect(argMate(['--verbose'], {quiet: false, verbose: false})).toEqual({
					_: [],
					quiet: false,
					verbose: true,
				});
			});

			test('Override default values', () => {
				expect(argMate(['--port', '9000'], {port: 8080})).toEqual({_: [], port: 9000});
			});

			test.todo('Boolean flags with explicit values', () => {
				expect(argMate(['--verbose=false', '--quiet=true'], {})).toEqual({
					_: [],
					verbose: false,
					quiet: true,
				});
			});

			test.todo('Array arguments', () => {
				expect(argMate(['--fruits', 'apple', 'banana', 'orange'], {fruits: []})).toEqual({
					_: [],
					fruits: ['apple', 'banana', 'orange'],
				});
			});

			test('Repeated flags', () => {
				expect(argMate(['--verbose', '--verbose', '--verbose'], {})).toEqual({
					_: [],
					verbose: true,
				});
			});

			test.todo('Unknown flags', () => {
				expect(argMate(['--unknown'], {allowUnknown: true})).toEqual({
					_: [],
					unknown: true,
				});
			});

			test.skip('Disallow unknown flags', () => {
				expect(() => argMate(['--unknown'], {allowUnknown: false})).toThrow();
			});

			test('Stop parsing after --', () => {
				expect(argMate(['--port', '8080', '--', '--verbose'], {port: 0})).toEqual({
					_: ['--verbose'],
					port: 8080,
				});
			});

			test.skip('Quoted arguments', () => {
				expect(argMate(['--name', '"John Doe"'], {name: ''})).toEqual({
					_: [],
					name: 'John Doe',
				});
			});

			test.skip('Escaped characters', () => {
				expect(argMate(['--path', 'C:\\Program\\ Files\\My\\ App'], {path: ''})).toEqual({
					_: [],
					path: 'C:\\Program Files\\My App',
				});
			});

			test('Unicode characters', () => {
				expect(argMate(['--name', '中文'], {name: ''})).toEqual({_: [], name: '中文'});
			});

			test('Empty string value', () => {
				expect(argMate(['--name', ''], {name: 'default'})).toEqual({_: [], name: ''});
			});

			test('Value with spaces', () => {
				expect(argMate(['--name', 'John Doe'], {name: ''})).toEqual({
					_: [],
					name: 'John Doe',
				});
			});

			test('Multiple equal signs in value', () => {
				expect(argMate(['--equation', 'y=mx+b'], {equation: ''})).toEqual({
					_: [],
					equation: 'y=mx+b',
				});
			});

			test.todo('Flag names with dashes', () => {
				expect(argMate(['--dry-run'], {})).toEqual({_: [], 'dry-run': true});
			});

			test.todo('Flag names with numbers', () => {
				expect(argMate(['--http2-server'], {})).toEqual({_: [], 'http2-server': true});
			});

			test('Case sensitivity', () => {
				expect(argMate(['--Verbose', '--QUIET'], {})).toEqual({
					_: [],
					Verbose: true,
					QUIET: true,
				});
			});

			test('Alias handling', () => {
				expect(argMate(['-v'], {verbose: {alias: 'v'}})).toEqual({_: [], verbose: true});
			});

			test('Multiple aliases', () => {
				expect(argMate(['-v', '--verb'], {verbose: {alias: ['v', 'verb']}})).toEqual({
					_: [],
					verbose: true,
				});
			});

			test.todo('Conflicting flags', () => {
				expect(() =>
					argMate(['--minify', '--beautify'], {
						minify: {conflict: 'beautify'},
						beautify: {conflict: 'minify'},
					})
				).toThrow();
			});

			test('Mandatory flags', () => {
				expect(() => argMate([], {port: {mandatory: true}})).toThrow();
			});

			test('Custom types', () => {
				expect(argMate(['--count', '5'], {count: {type: 'number'}})).toEqual({
					_: [],
					count: 5,
				});
			});

			test('Enum values', () => {
				expect(
					argMate(['--color', 'red'], {color: {valid: ['red', 'green', 'blue']}})
				).toEqual({_: [], color: 'red'});
			});

			test('Invalid enum value', () => {
				expect(() =>
					argMate(['--color', 'yellow'], {color: {valid: ['red', 'green', 'blue']}})
				).toThrow();
			});

			test.todo('Custom validation', () => {
				expect(argMate(['--age', '25'], {age: {valid: v => v >= 18 && v <= 99}})).toEqual({
					_: [],
					age: 25,
				});
			});

			test('Invalid custom validation', () => {
				expect(() =>
					argMate(['--age', '15'], {age: {valid: v => v >= 18 && v <= 99}})
				).toThrow();
			});

			test.todo('Coercion to boolean', () => {
				expect(argMate(['--feature=', 'on'], {feature: {type: 'boolean'}})).toEqual({
					_: [],
					feature: true,
				});
			});

			test.todo('Negated boolean flags', () => {
				expect(argMate(['--no-verbose'], {verbose: true})).toEqual({_: [], verbose: false});
			});

			test.todo('Array type with default', () => {
				expect(
					argMate(['--numbers', '1', '2', '3'], {
						numbers: {type: 'number[]', default: [0]},
					})
				).toEqual({_: [], numbers: [1, 2, 3]});
			});

			test('Mixing positional and named arguments', () => {
				expect(argMate(['pos1', '--named', 'value', 'pos2'], {named: ''})).toEqual({
					_: ['pos1', 'pos2'],
					named: 'value',
				});
			});

			test('Handling equals in values', () => {
				expect(argMate(['--eq=a=b', '--foo', 'c=d'], {eq: '', foo: ''})).toEqual({
					_: [],
					eq: 'a=b',
					foo: 'c=d',
				});
			});

			test('Multiple boolean flags in one argument', () => {
				expect(argMate(['-abc'], {})).toEqual({_: [], a: true, b: true, c: true});
			});

			test.todo('Flag with optional value', () => {
				expect(
					argMate(['--optional'], {optional: {type: 'string', default: 'defaultValue'}})
				).toEqual({_: [], optional: 'defaultValue'});
			});

			test('Flag with optional value provided', () => {
				expect(
					argMate(['--optional', 'providedValue'], {
						optional: {type: 'string', default: 'defaultValue'},
					})
				).toEqual({_: [], optional: 'providedValue'});
			});

			test('Handling special characters in values', () => {
				expect(argMate(['--special', '!@#$%^&*()'], {special: ''})).toEqual({
					_: [],
					special: '!@#$%^&*()',
				});
			});

			test.todo('Handling quotes within quoted strings', () => {
				expect(argMate(['--quote', '"He said, \\\\"Hello\\\\""'], {quote: ''})).toEqual({
					_: [],
					quote: 'He said, "Hello"',
				});
			});

			test('Very long argument values', () => {
				const longValue = 'a'.repeat(10000);
				expect(argMate(['--long', longValue], {long: ''})).toEqual({
					_: [],
					long: longValue,
				});
			});
		});
	});
}
