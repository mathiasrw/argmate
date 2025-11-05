// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

let argv;

function run(argMate, engineType = '') {
	describe.todo('Error handeling' + engineType, () => {
		describe.todo('4o' + engineType, () => {
			test('Missing required argument (boolean flag)', done => {
				argMate(
					['--username'],
					{username: {mandatory: true}},
					{
						error: msg => {
							expect(msg).toContain('No data provided for');
							done();
						},
					}
				);
			});

			test('Missing required argument (integer)', done => {
				argMate(
					['--age'],
					{age: {type: 'int', mandatory: true}},
					{
						error: msg => {
							expect(msg).toContain('No data provided for');
							done();
						},
					}
				);
			});

			test('Missing required argument (string)', done => {
				argMate(
					['--name'],
					{name: {type: 'string', mandatory: true}},
					{
						error: msg => {
							expect(msg).toContain('No data provided for');
							done();
						},
					}
				);
			});

			test('Missing required argument with alias', done => {
				argMate(
					['-u'],
					{username: {alias: 'u', mandatory: true}},
					{
						error: msg => {
							expect(msg).toContain('No data provided for');
							done();
						},
					}
				);
			});

			test('Missing required argument (boolean flag) with negation', done => {
				argMate(
					['--no-enable'],
					{enable: {mandatory: true}},
					{
						error: msg => {
							expect(msg).toContain('No data provided for');
							done();
						},
					}
				);
			});

			test('Missing required argument with default value (should not trigger error)', () => {
				expect(argMate([], {username: {mandatory: true, default: 'defaultUser'}})).toEqual({
					username: 'defaultUser',
					_: [],
				});
			});

			test('Missing required positional argument', done => {
				argMate(
					['--foo'],
					{_: {mandatory: true}},
					{
						error: msg => {
							expect(msg).toContain('Missing required positional arguments');
							done();
						},
					}
				);
			});

			test('Missing required argument with provided invalid data', done => {
				argMate(
					['--age='],
					{age: {type: 'int', mandatory: true}},
					{
						error: msg => {
							expect(msg).toContain('No data provided for');
							done();
						},
					}
				);
			});

			test('Missing required array argument', done => {
				argMate(
					[],
					{files: {type: 'string[]', mandatory: true}},
					{
						error: msg => {
							expect(msg).toContain('Missing required array argument');
							done();
						},
					}
				);
			});

			test('Missing required argument in strict mode', done => {
				argMate(
					[],
					{username: {mandatory: true}},
					{
						allowUnknown: false,
						error: msg => {
							expect(msg).toContain('No data provided for');
							done();
						},
					}
				);
			});

			///			### Error Handling: Invalid Option Formats

			test('Invalid option format (no assignment)', done => {
				argMate(
					['--timeout'],
					{timeout: {type: 'int'}},
					{
						error: msg => {
							expect(msg).toContain('No data provided for');
							done();
						},
					}
				);
			});

			test('Invalid option format (invalid number)', done => {
				argMate(
					['--timeout=abc'],
					{timeout: {type: 'int'}},
					{
						error: msg => {
							expect(msg).toContain('Invalid value');
							done();
						},
					}
				);
			});

			test('Invalid option format (invalid float)', done => {
				argMate(
					['--threshold=abc'],
					{threshold: {type: 'float'}},
					{
						error: msg => {
							expect(msg).toContain('Invalid value');
							done();
						},
					}
				);
			});

			test('Invalid option format (hexadecimal)', done => {
				argMate(
					['--color=gggggg'],
					{color: {type: 'hex'}},
					{
						error: msg => {
							expect(msg).toContain('Invalid value');
							done();
						},
					}
				);
			});

			test('Invalid option format (boolean as value)', done => {
				argMate(
					['--verbose=false'],
					{verbose: {type: 'boolean'}},
					{
						error: msg => {
							expect(msg).toContain('Unsupported format');
							done();
						},
					}
				);
			});

			test('Invalid option format (unquoted string with spaces)', done => {
				argMate(
					['--message=Hello World'],
					{message: {type: 'string'}},
					{
						error: msg => {
							expect(msg).toContain('Unsupported format');
							done();
						},
					}
				);
			});

			test('Invalid option format (unsupported flag)', done => {
				argMate(
					['-x'],
					{},
					{
						error: msg => {
							expect(msg).toContain('Unknown parameter');
							done();
						},
					}
				);
			});

			test('Invalid option format (empty string)', done => {
				argMate(
					['--name='],
					{name: {type: 'string'}},
					{
						error: msg => {
							expect(msg).toContain('No data provided for');
							done();
						},
					}
				);
			});

			test('Invalid option format (array without values)', done => {
				argMate(
					['--files='],
					{files: {type: 'string[]'}},
					{
						error: msg => {
							expect(msg).toContain('No data provided for');
							done();
						},
					}
				);
			});

			test('Invalid option format (flag with equal sign but no value)', done => {
				argMate(
					['--flag='],
					{},
					{
						error: msg => {
							expect(msg).toContain('No data provided for');
							done();
						},
					}
				);
			});

			///	### Error Handling: Unknown Arguments

			test('Unknown argument (strict mode)', done => {
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

			test('Unknown argument with alias', done => {
				argMate(
					['-x'],
					{verbose: {alias: 'v'}},
					{
						error: msg => {
							expect(msg).toContain('Unknown parameter');
							done();
						},
					}
				);
			});

			test('Unknown argument in combination with known argument', done => {
				argMate(
					['--unknown', '--verbose'],
					{verbose: {type: 'boolean'}},
					{
						allowUnknown: false,
						error: msg => {
							expect(msg).toContain('Unknown parameter');
							done();
						},
					}
				);
			});

			test('Unknown argument with similar known argument', done => {
				argMate(
					['--verbose', '--verb'],
					{verbose: {type: 'boolean'}},
					{
						allowUnknown: false,
						error: msg => {
							expect(msg).toContain('Unknown parameter');
							done();
						},
					}
				);
			});

			test('Unknown argument with negation', done => {
				argMate(
					['--no-unknown'],
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

			test('Unknown argument with positional arguments', done => {
				argMate(
					['file.txt', '--unknown'],
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

			test('Unknown argument with invalid format', done => {
				argMate(
					['--unknown=123'],
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

			test('Unknown short flag argument', done => {
				argMate(
					['-u'],
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

			test('Unknown argument with conflicting flag', done => {
				argMate(
					['--foo', '--unknown'],
					{foo: {type: 'boolean'}},
					{
						allowUnknown: false,
						error: msg => {
							expect(msg).toContain('Unknown parameter');
							done();
						},
					}
				);
			});

			test('Unknown argument with multiple known arguments', done => {
				argMate(
					['--foo', '--bar', '--unknown'],
					{foo: {type: 'boolean'}, bar: {type: 'boolean'}},
					{
						allowUnknown: false,
						error: msg => {
							expect(msg).toContain('Unknown parameter');
							done();
						},
					}
				);
			});

			/// ### Error Handling: Type Mismatches

			test('Type mismatch (string expected, number provided)', done => {
				argMate(
					['--name=123'],
					{name: {type: 'string'}},
					{
						error: msg => {
							expect(msg).toContain('Type mismatch');
							done();
						},
					}
				);
			});

			test('Type mismatch (number expected, string provided)', done => {
				argMate(
					['--age=twenty'],
					{age: {type: 'int'}},
					{
						error: msg => {
							expect(msg).toContain('Type mismatch');
							done();
						},
					}
				);
			});

			test('Type mismatch (float expected, string provided)', done => {
				argMate(
					['--price=cheap'],
					{price: {type: 'float'}},
					{
						error: msg => {
							expect(msg).toContain('Type mismatch');
							done();
						},
					}
				);
			});

			test('Type mismatch (boolean expected, string provided)', done => {
				argMate(
					['--enabled=yes'],
					{enabled: {type: 'boolean'}},
					{
						error: msg => {
							expect(msg).toContain('Type mismatch');
							done();
						},
					}
				);
			});

			test('Type mismatch (int array expected, string provided)', done => {
				argMate(
					['--values=a,b,c'],
					{values: {type: 'int[]'}},
					{
						error: msg => {
							expect(msg).toContain('Type mismatch');
							done();
						},
					}
				);
			});

			test('Type mismatch (hex expected, number provided)', done => {
				argMate(
					['--color=123456'],
					{color: {type: 'hex'}},
					{
						error: msg => {
							expect(msg).toContain('Type mismatch');
							done();
						},
					}
				);
			});

			test('Type mismatch (float array expected, int provided)', done => {
				argMate(
					['--rates=1,2,3'],
					{rates: {type: 'float[]'}},
					{
						error: msg => {
							expect(msg).toContain('Type mismatch');
							done();
						},
					}
				);
			});

			test('Type mismatch (boolean array expected, string provided)', done => {
				argMate(
					['--flags=true,false,maybe'],
					{flags: {type: 'boolean[]'}},
					{
						error: msg => {
							expect(msg).toContain('Type mismatch');
							done();
						},
					}
				);
			});

			test('Type mismatch (int expected, hex provided)', done => {
				argMate(
					['--port=0x1f'],
					{port: {type: 'int'}},
					{
						error: msg => {
							expect(msg).toContain('Type mismatch');
							done();
						},
					}
				);
			});

			test('Type mismatch (float expected, int array provided)', done => {
				argMate(
					['--percentage=50,100'],
					{percentage: {type: 'float'}},
					{
						error: msg => {
							expect(msg).toContain('Type mismatch');
							done();
						},
					}
				);
			});

			test('Type mismatch (string expected, boolean provided)', done => {
				argMate(
					['--text=true'],
					{text: {type: 'string'}},
					{
						error: msg => {
							expect(msg).toContain('Type mismatch');
							done();
						},
					}
				);
			});

			test('Type mismatch (hex expected, string provided)', done => {
				argMate(
					['--color=blue'],
					{color: {type: 'hex'}},
					{
						error: msg => {
							expect(msg).toContain('Type mismatch');
							done();
						},
					}
				);
			});

			test('Type mismatch (int expected, float provided)', done => {
				argMate(
					['--port=8080.5'],
					{port: {type: 'int'}},
					{
						error: msg => {
							expect(msg).toContain('Type mismatch');
							done();
						},
					}
				);
			});

			test('Type mismatch (boolean expected, number provided)', done => {
				argMate(
					['--enabled=1'],
					{enabled: {type: 'boolean'}},
					{
						error: msg => {
							expect(msg).toContain('Type mismatch');
							done();
						},
					}
				);
			});

			test('Type mismatch (array expected, single value provided)', done => {
				argMate(
					['--files=file1.txt'],
					{files: {type: 'string[]'}},
					{
						error: msg => {
							expect(msg).toContain('Type mismatch');
							done();
						},
					}
				);
			});

			test('Type mismatch (int expected, string provided)', done => {
				argMate(
					['--port=abc'],
					{port: {type: 'int'}},
					{
						error: msg => {
							expect(msg).toContain('Type mismatch');
							done();
						},
					}
				);
			});

			test('Type mismatch (float expected, boolean provided)', done => {
				argMate(
					['--threshold=true'],
					{threshold: {type: 'float'}},
					{
						error: msg => {
							expect(msg).toContain('Type mismatch');
							done();
						},
					}
				);
			});

			test('Type mismatch (boolean expected, float provided)', done => {
				argMate(
					['--enabled=1.0'],
					{enabled: {type: 'boolean'}},
					{
						error: msg => {
							expect(msg).toContain('Type mismatch');
							done();
						},
					}
				);
			});

			test('Type mismatch (int array expected, float array provided)', done => {
				argMate(
					['--ids=1.1,2.2,3.3'],
					{ids: {type: 'int[]'}},
					{
						error: msg => {
							expect(msg).toContain('Type mismatch');
							done();
						},
					}
				);
			});

			test('Type mismatch (float expected, int provided)', done => {
				argMate(
					['--rate=5'],
					{rate: {type: 'float'}},
					{
						error: msg => {
							expect(msg).toContain('Type mismatch');
							done();
						},
					}
				);
			});
		});
		describe.todo('Sonnet 3.5' + engineType, () => {
			test('Basic boolean flag', () => {
				expect(argMate(['--verbose'], {verbose: {type: 'boolean'}})).toEqual({
					_: [],
					verbose: true,
				});
			});

			test('String type', () => {
				expect(argMate(['--name', 'John'], {name: {type: 'string'}})).toEqual({
					_: [],
					name: 'John',
				});
			});

			test('Number type', () => {
				expect(argMate(['--count', '42'], {count: {type: 'number'}})).toEqual({
					_: [],
					count: 42,
				});
			});

			test('Float type', () => {
				expect(argMate(['--price', '9.99'], {price: {type: 'float'}})).toEqual({
					_: [],
					price: 9.99,
				});
			});

			test('Integer type', () => {
				expect(argMate(['--age', '30'], {age: {type: 'int'}})).toEqual({
					_: [],
					age: 30,
				});
			});

			test('Hex type', () => {
				expect(argMate(['--color', 'FF00AA'], {color: {type: 'hex'}})).toEqual({
					_: [],
					color: 'FF00AA',
				});
			});

			test('Array type', () => {
				expect(argMate(['--fruits', 'apple', 'banana'], {fruits: {type: 'array'}})).toEqual(
					{_: [], fruits: ['apple', 'banana']}
				);
			});

			test('String array type', () => {
				expect(argMate(['--names', 'Alice', 'Bob'], {names: {type: 'string[]'}})).toEqual({
					_: [],
					names: ['Alice', 'Bob'],
				});
			});

			test('Number array type', () => {
				expect(
					argMate(['--scores', '75', '82', '91'], {scores: {type: 'number[]'}})
				).toEqual({_: [], scores: [75, 82, 91]});
			});

			test('Float array type', () => {
				expect(argMate(['--prices', '9.99', '15.50'], {prices: {type: 'float[]'}})).toEqual(
					{_: [], prices: [9.99, 15.5]}
				);
			});

			test('Integer array type', () => {
				expect(
					argMate(['--years', '2020', '2021', '2022'], {years: {type: 'int[]'}})
				).toEqual({_: [], years: [2020, 2021, 2022]});
			});

			test('Hex array type', () => {
				expect(
					argMate(['--colors', 'FF0000', '00FF00'], {colors: {type: 'hex[]'}})
				).toEqual({_: [], colors: ['FF0000', '00FF00']});
			});

			test('Default value', () => {
				expect(argMate([], {port: {default: 8080}})).toEqual({_: [], port: 8080});
			});

			test('Mandatory parameter', () => {
				expect(() => argMate([], {required: {mandatory: true}})).toThrow();
			});

			test('Alias (array)', () => {
				expect(argMate(['-v'], {verbose: {alias: ['v']}})).toEqual({
					_: [],
					verbose: true,
				});
			});

			test('Alias (string)', () => {
				expect(argMate(['-q'], {quiet: {alias: 'q'}})).toEqual({_: [], quiet: true});
			});

			test('Alias (comma-separated string)', () => {
				expect(argMate(['-s'], {silent: {alias: 'q,s'}})).toEqual({
					_: [],
					silent: true,
				});
			});

			test('Automatic kebab-case alias', () => {
				expect(argMate(['--dry-run'], {dryRun: {}})).toEqual({_: [], dryRun: true});
			});

			test('Conflicting parameters (array)', () => {
				expect(() =>
					argMate(['--min', '--max'], {min: {conflict: ['max']}, max: {}})
				).toThrow();
			});

			test('Conflicting parameters (string)', () => {
				expect(() =>
					argMate(['--on', '--off'], {on: {conflict: 'off'}, off: {}})
				).toThrow();
			});

			test('Conflicting parameters (comma-separated string)', () => {
				expect(() =>
					argMate(['--start', '--stop'], {start: {conflict: 'stop,pause'}, stop: {}})
				).toThrow();
			});

			test('Valid values (function)', () => {
				expect(argMate(['--age', '25'], {age: {valid: v => v >= 18 && v <= 99}})).toEqual({
					_: [],
					age: 25,
				});
			});

			test('Valid values (array)', () => {
				expect(
					argMate(['--color', 'red'], {color: {valid: ['red', 'green', 'blue']}})
				).toEqual({_: [], color: 'red'});
			});

			test('Invalid value', () => {
				expect(() =>
					argMate(['--color', 'yellow'], {color: {valid: ['red', 'green', 'blue']}})
				).toThrow();
			});

			test('Transform function', () => {
				expect(argMate(['--name', ' John '], {name: {transform: v => v.trim()}})).toEqual({
					_: [],
					name: 'John',
				});
			});

			test('Positional arguments', () => {
				expect(argMate(['file1.txt', 'file2.txt'])).toEqual({
					_: ['file1.txt', 'file2.txt'],
				});
			});

			test('Mixed positional and named arguments', () => {
				expect(argMate(['file.txt', '--verbose'], {verbose: {}})).toEqual({
					_: ['file.txt'],
					verbose: true,
				});
			});

			test('Boolean flag with explicit false value', () => {
				expect(argMate(['--verbose=false'], {verbose: {type: 'boolean'}})).toEqual({
					_: [],
					verbose: false,
				});
			});

			test('Long option with attached value', () => {
				expect(argMate(['--port=8080'], {port: {type: 'number'}})).toEqual({
					_: [],
					port: 8080,
				});
			});

			test('Short option with attached value', () => {
				expect(argMate(['-p8080'], {p: {type: 'number'}})).toEqual({_: [], p: 8080});
			});

			test('Grouped short boolean flags', () => {
				expect(argMate(['-abc'], {a: {}, b: {}, c: {}})).toEqual({
					_: [],
					a: true,
					b: true,
					c: true,
				});
			});

			test('Case-sensitive valid values', () => {
				expect(() =>
					argMate(['--color', 'RED'], {color: {valid: ['red', 'green', 'blue']}})
				).toThrow();
			});

			test('Case-insensitive valid values', () => {
				expect(
					argMate(['--color', 'RED'], {
						color: {valid: v => /red|green|blue/i.test(v)},
					})
				).toEqual({_: [], color: 'RED'});
			});

			test('Type inference from default value (string)', () => {
				expect(argMate(['--name', 'Alice'], {name: {default: 'Bob'}})).toEqual({
					_: [],
					name: 'Alice',
				});
			});

			test('Type inference from default value (number)', () => {
				expect(argMate(['--count', '5'], {count: {default: 10}})).toEqual({
					_: [],
					count: 5,
				});
			});

			test('Type inference from default value (boolean)', () => {
				expect(argMate(['--verbose'], {verbose: {default: false}})).toEqual({
					_: [],
					verbose: true,
				});
			});

			test('Repeated flag (boolean)', () => {
				expect(argMate(['--verbose', '--verbose'], {verbose: {}})).toEqual({
					_: [],
					verbose: true,
				});
			});

			test('Repeated flag (array)', () => {
				expect(argMate(['--tag', 'a', '--tag', 'b'], {tag: {type: 'array'}})).toEqual({
					_: [],
					tag: ['a', 'b'],
				});
			});

			test('Unknown parameter with allowUnknown true', () => {
				expect(argMate(['--unknown'], {}, {allowUnknown: true})).toEqual({
					_: [],
					unknown: true,
				});
			});

			test('Unknown parameter with allowUnknown false', () => {
				expect(() => argMate(['--unknown'], {}, {allowUnknown: false})).toThrow();
			});

			test('Custom error handling', () => {
				let errorMessage = '';
				argMate(
					['--required'],
					{required: {mandatory: true}},
					{
						error: msg => {
							errorMessage = msg;
						},
					}
				);
				expect(errorMessage).toContain('required');
			});

			test('Negated boolean flag', () => {
				expect(
					argMate(['--no-verbose'], {verbose: {type: 'boolean', default: true}})
				).toEqual({_: [], verbose: false});
			});

			test('Stop parsing at --', () => {
				expect(
					argMate(['--port', '8080', '--', '--verbose'], {port: {type: 'number'}})
				).toEqual({_: ['--verbose'], port: 8080});
			});

			test('Value with spaces', () => {
				expect(argMate(['--name', 'John Doe'], {name: {type: 'string'}})).toEqual({
					_: [],
					name: 'John Doe',
				});
			});

			test('Value with equal sign', () => {
				expect(argMate(['--equation', 'y=mx+b'], {equation: {type: 'string'}})).toEqual({
					_: [],
					equation: 'y=mx+b',
				});
			});

			test('Unicode in parameter names', () => {
				expect(argMate(['--名前', 'ジョン'], {名前: {type: 'string'}})).toEqual({
					_: [],
					名前: 'ジョン',
				});
			});

			test('Unicode in parameter values', () => {
				expect(argMate(['--name', '约翰'], {name: {type: 'string'}})).toEqual({
					_: [],
					name: '约翰',
				});
			});

			test('Empty string value', () => {
				expect(argMate(['--name', ''], {name: {type: 'string'}})).toEqual({
					_: [],
					name: '',
				});
			});
		});
	});
}
