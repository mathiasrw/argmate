// Made by tools/generateTestsFromDocumentation.js from SPEC.md, in its order: each row of a table is one test.
// Do not edit: change the table. `bun run test` makes this file again.
import {describe, expect, test} from 'bun:test';
import {argMate} from './helper.ts';

// The code of the first input error
function errorCode(args, config, settings) {
	let code;
	try {
		argMate(args, config, {
			...settings,
			error: e => {
				code ??= 'ERROR ' + e.code;
			},
			panic: () => {
				throw 'ERROR_NOT_VALID_CONFIG';
			},
		});
	} catch (e) {
		if (e !== 'ERROR_NOT_VALID_CONFIG') throw e;
		code ??= e;
	}
	return code;
}

describe('Behaviour', () => {
	describe('An input that starts with `-` is a parameter, other inputs are values', () => {
		test('-v file.txt', () => {
			expect(argMate(['-v', 'file.txt'], {}, {})).toEqual({_: ['file.txt'], v: true});
		});
		test('--verbose', () => {
			expect(argMate(['--verbose'], {}, {})).toEqual({_: [], verbose: true});
		});
		test('-🍿', () => {
			expect(argMate(['-🍿'], {}, {})).toEqual({_: [], '🍿': true});
		});
		test('-', () => {
			expect(argMate(['-'], {}, {})).toEqual({_: ['-']});
		});
	});
	describe('An unspecified parameter is considered a flag', () => {
		test('--name bob', () => {
			expect(argMate(['--name', 'bob'], {}, {})).toEqual({_: ['bob'], name: true});
		});
		test("--name bob with {name: {type: 'string'}}", () => {
			expect(argMate(['--name', 'bob'], {name: {type: 'string'}}, {})).toEqual({
				_: [],
				name: 'bob',
			});
		});
		test('--no-color', () => {
			expect(argMate(['--no-color'], {}, {})).toEqual({_: [], color: false});
		});
		test('--no-color=1', () => {
			expect(errorCode(['--no-color=1'], {}, {})).toBe('ERROR NEGATED_AND_ASSIGNED');
		});
		test("--no-port with {port: {type: 'int'}}", () => {
			expect(errorCode(['--no-port'], {port: {type: 'int'}}, {})).toBe('ERROR MISSING_VALUE');
		});
		test("--no-port 80 with {port: {type: 'int'}}", () => {
			expect(errorCode(['--no-port', '80'], {port: {type: 'int'}}, {})).toBe(
				'ERROR NEGATED_AND_ASSIGNED'
			);
		});
		test("--no-v with {v: {type: 'count'}}", () => {
			expect(errorCode(['--no-v'], {v: {type: 'count'}}, {})).toBe('ERROR BAD_TYPE');
		});
		test('--5', () => {
			expect(errorCode(['--5'], {}, {})).toBe('ERROR NUMBER_NAME');
		});
		test("--5 with {5: {type: 'bool'}}", () => {
			expect(argMate(['--5'], {5: {type: 'bool'}}, {})).toEqual({_: [], 5: true});
		});
		test('--123=value', () => {
			expect(errorCode(['--123=value'], {}, {})).toBe('ERROR NUMBER_NAME');
		});
		test("--123=value with {123: {type: 'string'}}", () => {
			expect(argMate(['--123=value'], {123: {type: 'string'}}, {})).toEqual({_: [], 123: 'value'});
		});
	});
	describe('An unspecified parameter followed by `=` gets a value', () => {
		test('-v=file.txt', () => {
			expect(argMate(['-v=file.txt'], {}, {})).toEqual({_: [], v: 'file.txt'});
		});
		test('--name=bob', () => {
			expect(argMate(['--name=bob'], {}, {})).toEqual({_: [], name: 'bob'});
		});
		test('--name=', () => {
			expect(argMate(['--name='], {}, {})).toEqual({_: [], name: ''});
		});
		test('--n=a=b', () => {
			expect(argMate(['--n=a=b'], {}, {})).toEqual({_: [], n: 'a=b'});
		});
		test('--n=bob', () => {
			expect(argMate(['--n=bob'], {}, {})).toEqual({_: [], n: 'bob'});
		});
		test('-n=bob', () => {
			expect(argMate(['-n=bob'], {}, {})).toEqual({_: [], n: 'bob'});
		});
	});
	describe('A short parameter is one visual character, and short parameters can be chained', () => {
		test('-a', () => {
			expect(argMate(['-a'], {}, {})).toEqual({_: [], a: true});
		});
		test('-abc', () => {
			expect(argMate(['-abc'], {}, {})).toEqual({_: [], a: true, b: true, c: true});
		});
		test('-abc=5', () => {
			expect(argMate(['-abc=5'], {}, {})).toEqual({_: [], a: true, b: true, c: 5});
		});
		test('--abc=5', () => {
			expect(argMate(['--abc=5'], {}, {})).toEqual({_: [], abc: 5});
		});
		test('-⚾🎾🏀', () => {
			expect(argMate(['-⚾🎾🏀'], {}, {})).toEqual({_: [], '⚾': true, '🎾': true, '🏀': true});
		});
		test("-file a.sql with {file: {alias: 'f', type: 'string'}}", () => {
			expect(errorCode(['-file', 'a.sql'], {file: {alias: 'f', type: 'string'}}, {})).toBe(
				'ERROR UNKNOWN'
			);
		});
		test('-abc with {abc: {}, a: {}}', () => {
			expect(errorCode(['-abc'], {abc: {}, a: {}}, {})).toBe('ERROR UNKNOWN');
		});
		test("-ab with {x: {alias: 'ab'}, a: {}}", () => {
			expect(errorCode(['-ab'], {x: {alias: 'ab'}, a: {}}, {})).toBe('ERROR UNKNOWN');
		});
		test('-abc with {abc: {}, a: {}, b: {}, c: {}}', () => {
			expect(argMate(['-abc'], {abc: {}, a: {}, b: {}, c: {}}, {})).toEqual({
				_: [],
				a: true,
				b: true,
				c: true,
			});
		});
		test('-abc with {a: {}}', () => {
			expect(argMate(['-abc'], {a: {}}, {})).toEqual({_: [], a: true, b: true, c: true});
		});
	});
	describe('A long parameter can not be chained, can include digits, and is camelCase in the output', () => {
		test('--foo-bar --file-path file.txt', () => {
			expect(argMate(['--foo-bar', '--file-path', 'file.txt'], {}, {})).toEqual({
				_: ['file.txt'],
				fooBar: true,
				filePath: true,
			});
		});
		test('--👍🏽👍🏽👍🏽', () => {
			expect(argMate(['--👍🏽👍🏽👍🏽'], {}, {})).toEqual({_: [], '👍🏽👍🏽👍🏽': true});
		});
		test('--utf8', () => {
			expect(argMate(['--utf8'], {}, {})).toEqual({_: [], utf8: true});
		});
	});
	describe('Digits at the end of a short group are an assignment to the last character', () => {
		test('-a12', () => {
			expect(argMate(['-a12'], {}, {})).toEqual({_: [], a: 12});
		});
		test('-ab12', () => {
			expect(argMate(['-ab12'], {}, {})).toEqual({_: [], a: true, b: 12});
		});
		test('-a -b=12', () => {
			expect(argMate(['-a', '-b=12'], {}, {})).toEqual({_: [], a: true, b: 12});
		});
		test('-n100', () => {
			expect(argMate(['-n100'], {}, {})).toEqual({_: [], n: 100});
		});
		test('-A0', () => {
			expect(argMate(['-A0'], {}, {})).toEqual({_: [], A: 0});
		});
		test("-A0 with {A: {type: 'bool'}}", () => {
			expect(argMate(['-A0'], {A: {type: 'bool'}}, {})).toEqual({_: [], A: false});
		});
		test("-A0 with {A: {type: 'bool'}, 0: {type: 'bool'}}", () => {
			expect(argMate(['-A0'], {A: {type: 'bool'}, 0: {type: 'bool'}}, {})).toEqual({
				_: [],
				A: true,
				0: true,
			});
		});
		test("-A1 with {A: {type: 'bool'}}", () => {
			expect(argMate(['-A1'], {A: {type: 'bool'}}, {})).toEqual({_: [], A: true});
		});
		test("-A5 with {A: {type: 'bool'}}", () => {
			expect(errorCode(['-A5'], {A: {type: 'bool'}}, {})).toBe('ERROR BAD_VALUE');
		});
		test("-A00 with {A: {type: 'bool'}}", () => {
			expect(errorCode(['-A00'], {A: {type: 'bool'}}, {})).toBe('ERROR BAD_VALUE');
		});
		test("-A=0 with {A: {type: 'bool'}}", () => {
			expect(argMate(['-A=0'], {A: {type: 'bool'}}, {})).toEqual({_: [], A: false});
		});
		test("-A 0 with {A: {type: 'bool'}}", () => {
			expect(argMate(['-A', '0'], {A: {type: 'bool'}}, {})).toEqual({_: [0], A: true});
		});
		test('-utf8', () => {
			expect(argMate(['-utf8'], {}, {})).toEqual({_: [], u: true, t: true, f: 8});
		});
		test('-n1.5', () => {
			expect(argMate(['-n1.5'], {}, {})).toEqual({_: ['-n1.5']});
		});
		test("-a5=3 with {a: {type: 'bool'}, 5: {type: 'int'}}", () => {
			expect(argMate(['-a5=3'], {a: {type: 'bool'}, 5: {type: 'int'}}, {})).toEqual({
				_: [],
				a: true,
				5: 3,
			});
		});
		test("-a5=3 with {a: {type: 'bool'}}", () => {
			expect(errorCode(['-a5=3'], {a: {type: 'bool'}}, {})).toBe('ERROR NUMBER_NAME');
		});
		test('-a5=3', () => {
			expect(errorCode(['-a5=3'], {}, {})).toBe('ERROR NUMBER_NAME');
		});
		test('-5=3', () => {
			expect(errorCode(['-5=3'], {}, {})).toBe('ERROR NUMBER_NAME');
		});
		test("-5=3 with {5: {type: 'int'}}", () => {
			expect(argMate(['-5=3'], {5: {type: 'int'}}, {})).toEqual({_: [], 5: 3});
		});
	});
	describe('Numeric-looking inputs are converted to the numeric value', () => {
		test('5 1.5 -1e3', () => {
			expect(argMate(['5', '1.5', '-1e3'], {}, {})).toEqual({_: [5, 1.5, -1000]});
		});
		test('--n=5', () => {
			expect(argMate(['--n=5'], {}, {})).toEqual({_: [], n: 5});
		});
		test("--n=5 with {n: {type: 'string'}}", () => {
			expect(argMate(['--n=5'], {n: {type: 'string'}}, {})).toEqual({_: [], n: '5'});
		});
		test('007 0x10 .5', () => {
			expect(argMate(['007', '0x10', '.5'], {}, {})).toEqual({_: ['007', '0x10', '.5']});
		});
		test('12345678901234567890 1e400', () => {
			expect(argMate(['12345678901234567890', '1e400'], {}, {})).toEqual({
				_: ['12345678901234567890', '1e400'],
			});
		});
		test("-n 12345678901234567890 -m 1e400 with {n: {type: 'number'}, m: {type: 'number'}}", () => {
			expect(
				errorCode(
					['-n', '12345678901234567890', '-m', '1e400'],
					{n: {type: 'number'}, m: {type: 'number'}},
					{}
				)
			).toBe('ERROR BAD_VALUE');
		});
	});
	describe('A negative number is a value, unless the config has its first character', () => {
		test('-5', () => {
			expect(argMate(['-5'], {}, {})).toEqual({_: [-5]});
		});
		test("-5 with {5: {type: 'bool'}}", () => {
			expect(argMate(['-5'], {5: {type: 'bool'}}, {})).toEqual({_: [], 5: true});
		});
		test('-0x10 -007 -.5 -5px', () => {
			expect(argMate(['-0x10', '-007', '-.5', '-5px'], {}, {})).toEqual({
				_: ['-0x10', '-007', '-.5', '-5px'],
			});
		});
		test('-12', () => {
			expect(argMate(['-12'], {}, {})).toEqual({_: [-12]});
		});
		test("-12 with {1: {type: 'bool'}, 2: {type: 'bool'}}", () => {
			expect(argMate(['-12'], {1: {type: 'bool'}, 2: {type: 'bool'}}, {})).toEqual({
				_: [],
				1: true,
				2: true,
			});
		});
		test("-12 with {1: {type: 'bool'}}", () => {
			expect(errorCode(['-12'], {1: {type: 'bool'}}, {})).toBe('ERROR BAD_VALUE');
		});
		test("-10 with {1: {type: 'bool'}}", () => {
			expect(argMate(['-10'], {1: {type: 'bool'}}, {})).toEqual({_: [], 1: false});
		});
		test("-12 with {1: {type: 'int'}}", () => {
			expect(argMate(['-12'], {1: {type: 'int'}}, {})).toEqual({_: [], 1: 2});
		});
	});
	describe('Every input after `--` is considered a string', () => {
		test('-v=5 --', () => {
			expect(argMate(['-v=5', '--'], {}, {})).toEqual({_: [], v: 5});
		});
		test('-- -v=5', () => {
			expect(argMate(['--', '-v=5'], {}, {})).toEqual({_: ['-v=5']});
		});
		test('-9 -- -9', () => {
			expect(argMate(['-9', '--', '-9'], {}, {})).toEqual({_: [-9, '-9']});
		});
	});
	describe('A parameter that is not a boolean takes the next input as its value', () => {
		test("--text -5 with {text: {type: 'string'}}", () => {
			expect(argMate(['--text', '-5'], {text: {type: 'string'}}, {})).toEqual({_: [], text: '-5'});
		});
		test("--num -5 with {num: {type: 'number'}}", () => {
			expect(argMate(['--num', '-5'], {num: {type: 'number'}}, {})).toEqual({_: [], num: -5});
		});
		test('--port 8080', () => {
			expect(argMate(['--port', '8080'], {}, {})).toEqual({_: [8080], port: true});
		});
		test("--port 8080 with {port: {type: 'int'}}", () => {
			expect(argMate(['--port', '8080'], {port: {type: 'int'}}, {})).toEqual({_: [], port: 8080});
		});
		test("--port with {port: {type: 'int'}}", () => {
			expect(errorCode(['--port'], {port: {type: 'int'}}, {})).toBe('ERROR MISSING_VALUE');
		});
	});
	describe('A value must fit the type of its parameter', () => {
		test("--port 8080 with {port: {type: 'int'}}", () => {
			expect(argMate(['--port', '8080'], {port: {type: 'int'}}, {})).toEqual({_: [], port: 8080});
		});
		test("--port p0p0 with {port: {type: 'int'}}", () => {
			expect(errorCode(['--port', 'p0p0'], {port: {type: 'int'}}, {})).toBe('ERROR BAD_VALUE');
		});
		test("--n=5 with {n: {type: 'int'}}", () => {
			expect(argMate(['--n=5'], {n: {type: 'int'}}, {})).toEqual({_: [], n: 5});
		});
		test("-n=5 with {n: {type: 'int'}}", () => {
			expect(argMate(['-n=5'], {n: {type: 'int'}}, {})).toEqual({_: [], n: 5});
		});
		test("-n=1.5 with {n: {type: 'int'}}", () => {
			expect(errorCode(['-n=1.5'], {n: {type: 'int'}}, {})).toBe('ERROR BAD_VALUE');
		});
		test("-n=007 with {n: {type: 'int'}}", () => {
			expect(errorCode(['-n=007'], {n: {type: 'int'}}, {})).toBe('ERROR BAD_VALUE');
		});
		test("-n=0x10 with {n: {type: 'int'}}", () => {
			expect(argMate(['-n=0x10'], {n: {type: 'int'}}, {})).toEqual({_: [], n: 16});
		});
		test("-n=-0x10 with {n: {type: 'int'}}", () => {
			expect(errorCode(['-n=-0x10'], {n: {type: 'int'}}, {})).toBe('ERROR BAD_VALUE');
		});
		test("-n=1e3 with {n: {type: 'int'}}", () => {
			expect(argMate(['-n=1e3'], {n: {type: 'int'}}, {})).toEqual({_: [], n: 1000});
		});
		test("-n=12345678901234567890 with {n: {type: 'int'}}", () => {
			expect(errorCode(['-n=12345678901234567890'], {n: {type: 'int'}}, {})).toBe(
				'ERROR BAD_VALUE'
			);
		});
		test("-n=1.5 with {n: {type: 'number'}}", () => {
			expect(argMate(['-n=1.5'], {n: {type: 'number'}}, {})).toEqual({_: [], n: 1.5});
		});
		test("-n=0x10 with {n: {type: 'number'}}", () => {
			expect(argMate(['-n=0x10'], {n: {type: 'number'}}, {})).toEqual({_: [], n: 16});
		});
		test("-n=1e400 with {n: {type: 'number'}}", () => {
			expect(errorCode(['-n=1e400'], {n: {type: 'number'}}, {})).toBe('ERROR BAD_VALUE');
		});
		test("-n=12345678901234567890 with {n: {type: 'number'}}", () => {
			expect(errorCode(['-n=12345678901234567890'], {n: {type: 'number'}}, {})).toBe(
				'ERROR BAD_VALUE'
			);
		});
		test("-h=ff with {h: {type: 'hex'}}", () => {
			expect(argMate(['-h=ff'], {h: {type: 'hex'}}, {})).toEqual({_: [], h: 255});
		});
		test("-h=-ff with {h: {type: 'hex'}}", () => {
			expect(argMate(['-h=-ff'], {h: {type: 'hex'}}, {})).toEqual({_: [], h: -255});
		});
		test("-s=5 with {s: {type: 'string'}}", () => {
			expect(argMate(['-s=5'], {s: {type: 'string'}}, {})).toEqual({_: [], s: '5'});
		});
		test("--s= x with {s: {type: 'string'}}", () => {
			expect(argMate(['--s=', 'x'], {s: {type: 'string'}}, {})).toEqual({_: ['x'], s: ''});
		});
		test("--n= 5 with {n: {type: 'int'}}", () => {
			expect(errorCode(['--n=', '5'], {n: {type: 'int'}}, {})).toBe('ERROR MISSING_VALUE');
		});
		test("--n= with {n: {type: 'float'}}", () => {
			expect(errorCode(['--n='], {n: {type: 'float'}}, {})).toBe('ERROR MISSING_VALUE');
		});
		test("--n= with {n: {type: 'number'}}", () => {
			expect(errorCode(['--n='], {n: {type: 'number'}}, {})).toBe('ERROR MISSING_VALUE');
		});
		test("--h= with {h: {type: 'hex'}}", () => {
			expect(errorCode(['--h='], {h: {type: 'hex'}}, {})).toBe('ERROR MISSING_VALUE');
		});
		test("--n= with {n: {type: 'int[]'}}", () => {
			expect(errorCode(['--n='], {n: {type: 'int[]'}}, {})).toBe('ERROR MISSING_VALUE');
		});
		test("--v= with {v: {type: 'count'}}", () => {
			expect(errorCode(['--v='], {v: {type: 'count'}}, {})).toBe('ERROR MISSING_VALUE');
		});
		test("--d= with {d: {type: 'bool'}}", () => {
			expect(argMate(['--d='], {d: {type: 'bool'}}, {})).toEqual({_: [], d: false});
		});
		test("--d= --d=yes with {d: {type: 'bool[]'}}", () => {
			expect(argMate(['--d=', '--d=yes'], {d: {type: 'bool[]'}}, {})).toEqual({
				_: [],
				d: [false, true],
			});
		});
	});
	describe('A specified boolean parameter will understand boolean strings', () => {
		test('--d=yes --e=OFF', () => {
			expect(argMate(['--d=yes', '--e=OFF'], {}, {})).toEqual({_: [], d: 'yes', e: 'OFF'});
		});
		test("--d=yes --e=OFF with {d: {type: 'bool'}, e: {type: 'bool'}}", () => {
			expect(argMate(['--d=yes', '--e=OFF'], {d: {type: 'bool'}, e: {type: 'bool'}}, {})).toEqual({
				_: [],
				d: true,
				e: false,
			});
		});
		test("--d=foobar with {d: {type: 'bool'}}", () => {
			expect(errorCode(['--d=foobar'], {d: {type: 'bool'}}, {})).toBe('ERROR BAD_VALUE');
		});
		test("(no input) with {d: {type: 'bool', default: null}}", () => {
			expect(argMate([], {d: {type: 'bool', default: null}}, {})).toEqual({_: [], d: null});
		});
		test("--d with {d: {type: 'bool', default: null}}", () => {
			expect(argMate(['--d'], {d: {type: 'bool', default: null}}, {})).toEqual({_: [], d: true});
		});
	});
	describe('Each type reads its own kind of value', () => {
		test("--d with {d: {type: 'boolean'}}", () => {
			expect(argMate(['--d'], {d: {type: 'boolean'}}, {})).toEqual({_: [], d: true});
		});
		test("--d=no with {d: {type: 'bool'}}", () => {
			expect(argMate(['--d=no'], {d: {type: 'bool'}}, {})).toEqual({_: [], d: false});
		});
		test("--s 5 with {s: {type: 'string'}}", () => {
			expect(argMate(['--s', '5'], {s: {type: 'string'}}, {})).toEqual({_: [], s: '5'});
		});
		test("--n 5 with {n: {type: 'int'}}", () => {
			expect(argMate(['--n', '5'], {n: {type: 'int'}}, {})).toEqual({_: [], n: 5});
		});
		test("--n 1.5 with {n: {type: 'float'}}", () => {
			expect(argMate(['--n', '1.5'], {n: {type: 'float'}}, {})).toEqual({_: [], n: 1.5});
		});
		test("--n 1e3 with {n: {type: 'number'}}", () => {
			expect(argMate(['--n', '1e3'], {n: {type: 'number'}}, {})).toEqual({_: [], n: 1000});
		});
		test("--h ff with {h: {type: 'hex'}}", () => {
			expect(argMate(['--h', 'ff'], {h: {type: 'hex'}}, {})).toEqual({_: [], h: 255});
		});
		test("-vvv with {v: {type: 'count'}}", () => {
			expect(argMate(['-vvv'], {v: {type: 'count'}}, {})).toEqual({_: [], v: 3});
		});
		test("--d=yes --d=no with {d: {type: 'boolean[]'}}", () => {
			expect(argMate(['--d=yes', '--d=no'], {d: {type: 'boolean[]'}}, {})).toEqual({
				_: [],
				d: [true, false],
			});
		});
		test("--d=on --d=0 with {d: {type: 'bool[]'}}", () => {
			expect(argMate(['--d=on', '--d=0'], {d: {type: 'bool[]'}}, {})).toEqual({
				_: [],
				d: [true, false],
			});
		});
		test("--s a --s 5 with {s: {type: 'string[]'}}", () => {
			expect(argMate(['--s', 'a', '--s', '5'], {s: {type: 'string[]'}}, {})).toEqual({
				_: [],
				s: ['a', '5'],
			});
		});
		test("--s a --s 5 with {s: {type: 'array'}}", () => {
			expect(argMate(['--s', 'a', '--s', '5'], {s: {type: 'array'}}, {})).toEqual({
				_: [],
				s: ['a', '5'],
			});
		});
		test("--n 1 --n 2 with {n: {type: 'int[]'}}", () => {
			expect(argMate(['--n', '1', '--n', '2'], {n: {type: 'int[]'}}, {})).toEqual({
				_: [],
				n: [1, 2],
			});
		});
		test("--n 1 --n 2.5 with {n: {type: 'float[]'}}", () => {
			expect(argMate(['--n', '1', '--n', '2.5'], {n: {type: 'float[]'}}, {})).toEqual({
				_: [],
				n: [1, 2.5],
			});
		});
		test("--n 1 --n 1e3 with {n: {type: 'number[]'}}", () => {
			expect(argMate(['--n', '1', '--n', '1e3'], {n: {type: 'number[]'}}, {})).toEqual({
				_: [],
				n: [1, 1000],
			});
		});
		test("--h ff --h 0x10 with {h: {type: 'hex[]'}}", () => {
			expect(argMate(['--h', 'ff', '--h', '0x10'], {h: {type: 'hex[]'}}, {})).toEqual({
				_: [],
				h: [255, 16],
			});
		});
		test("(no input) with {s: {type: 'string[]'}}", () => {
			expect(argMate([], {s: {type: 'string[]'}}, {})).toEqual({_: [], s: []});
		});
	});
	describe('`file`, `folder` and `path` name a thing on the disk', () => {
		test("--f package.json with {f: {type: 'file'}}", () => {
			expect(argMate(['--f', 'package.json'], {f: {type: 'file'}}, {})).toEqual({
				_: [],
				f: 'package.json',
			});
		});
		test("--f nope.json with {f: {type: 'file'}}", () => {
			expect(errorCode(['--f', 'nope.json'], {f: {type: 'file'}}, {})).toBe('ERROR INVALID');
		});
		test("--f src with {f: {type: 'file'}}", () => {
			expect(errorCode(['--f', 'src'], {f: {type: 'file'}}, {})).toBe('ERROR INVALID');
		});
		test("--d src with {d: {type: 'folder'}}", () => {
			expect(argMate(['--d', 'src'], {d: {type: 'folder'}}, {})).toEqual({_: [], d: 'src'});
		});
		test("--d package.json with {d: {type: 'folder'}}", () => {
			expect(errorCode(['--d', 'package.json'], {d: {type: 'folder'}}, {})).toBe('ERROR INVALID');
		});
		test("--p src --p package.json with {p: {type: 'path[]'}}", () => {
			expect(argMate(['--p', 'src', '--p', 'package.json'], {p: {type: 'path[]'}}, {})).toEqual({
				_: [],
				p: ['src', 'package.json'],
			});
		});
		test("--p src --p nope with {p: {type: 'path[]'}}", () => {
			expect(errorCode(['--p', 'src', '--p', 'nope'], {p: {type: 'path[]'}}, {})).toBe(
				'ERROR INVALID'
			);
		});
		test("--f package with {f: {type: 'file', transform: v => v + '.json'}}", () => {
			expect(
				argMate(['--f', 'package'], {f: {type: 'file', transform: v => v + '.json'}}, {})
			).toEqual({_: [], f: 'package.json'});
		});
		test("(no input) with {f: {type: 'file', default: 'nope.json'}}", () => {
			expect(argMate([], {f: {type: 'file', default: 'nope.json'}}, {})).toEqual({
				_: [],
				f: 'nope.json',
			});
		});
		test("--f - with {f: {type: 'file', default: '-'}}", () => {
			expect(argMate(['--f', '-'], {f: {type: 'file', default: '-'}}, {})).toEqual({_: [], f: '-'});
		});
		test("--f nope.json with {f: {type: 'file', default: '-'}}", () => {
			expect(errorCode(['--f', 'nope.json'], {f: {type: 'file', default: '-'}}, {})).toBe(
				'ERROR INVALID'
			);
		});
		test("--f= with {f: {type: 'file'}}", () => {
			expect(errorCode(['--f='], {f: {type: 'file'}}, {})).toBe('ERROR MISSING_VALUE');
		});
		test("--p a --p with {p: {type: 'path[]', default: ['a']}}", () => {
			expect(errorCode(['--p', 'a', '--p'], {p: {type: 'path[]', default: ['a']}}, {})).toBe(
				'ERROR MISSING_VALUE'
			);
		});
		test("(no input) with {f: {type: 'file[]'}}", () => {
			expect(argMate([], {f: {type: 'file[]'}}, {})).toEqual({_: [], f: []});
		});
	});
	describe('A config of only a default value gives the type of the default', () => {
		test('(no input) with {d: null}', () => {
			expect(argMate([], {d: null}, {})).toEqual({_: [], d: null});
		});
		test('--d with {d: null}', () => {
			expect(argMate(['--d'], {d: null}, {})).toEqual({_: [], d: true});
		});
		test('--no-d with {d: null}', () => {
			expect(argMate(['--no-d'], {d: null}, {})).toEqual({_: [], d: false});
		});
		test('--d with {d: false}', () => {
			expect(argMate(['--d'], {d: false}, {})).toEqual({_: [], d: true});
		});
		test('--no-d with {d: true}', () => {
			expect(argMate(['--no-d'], {d: true}, {})).toEqual({_: [], d: false});
		});
		test('(no input) with {n: 5}', () => {
			expect(argMate([], {n: 5}, {})).toEqual({_: [], n: 5});
		});
		test('--n 1.5 with {n: 5}', () => {
			expect(argMate(['--n', '1.5'], {n: 5}, {})).toEqual({_: [], n: 1.5});
		});
		test('--n x with {n: 5}', () => {
			expect(errorCode(['--n', 'x'], {n: 5}, {})).toBe('ERROR BAD_VALUE');
		});
		test("--s 5 with {s: 'bob'}", () => {
			expect(argMate(['--s', '5'], {s: 'bob'}, {})).toEqual({_: [], s: '5'});
		});
		test('--t a --t 5 with {t: []}', () => {
			expect(argMate(['--t', 'a', '--t', '5'], {t: []}, {})).toEqual({_: [], t: ['a', '5']});
		});
		test('(no input) with {t: [1]}', () => {
			expect(argMate([], {t: [1]}, {})).toEqual({_: [], t: [1]});
		});
		test('--t 5 with {t: [1]}', () => {
			expect(argMate(['--t', '5'], {t: [1]}, {})).toEqual({_: [], t: [5]});
		});
		test("--t 5 with {t: ['a', 1]}", () => {
			expect(argMate(['--t', '5'], {t: ['a', 1]}, {})).toEqual({_: [], t: ['5']});
		});
		test('--t 5 with {t: {default: [1, 2]}}', () => {
			expect(argMate(['--t', '5'], {t: {default: [1, 2]}}, {})).toEqual({_: [], t: [5]});
		});
	});
	describe('`valid` is a list of values, and a value can have aliases', () => {
		test("(no input) with {e: {valid: [['V8', 'v8', ['js', 'node']], ['RE2', 're2']]}}", () => {
			expect(
				argMate(
					[],
					{
						e: {
							valid: [
								['V8', 'v8', ['js', 'node']],
								['RE2', 're2'],
							],
						},
					},
					{}
				)
			).toEqual({_: [], e: 'V8'});
		});
		test("--e RE2 with {e: {valid: [['V8', 'v8', ['js', 'node']], ['RE2', 're2']]}}", () => {
			expect(
				argMate(
					['--e', 'RE2'],
					{
						e: {
							valid: [
								['V8', 'v8', ['js', 'node']],
								['RE2', 're2'],
							],
						},
					},
					{}
				)
			).toEqual({_: [], e: 'RE2'});
		});
		test("--e re2 with {e: {valid: [['V8', 'v8', ['js', 'node']], ['RE2', 're2']]}}", () => {
			expect(
				argMate(
					['--e', 're2'],
					{
						e: {
							valid: [
								['V8', 'v8', ['js', 'node']],
								['RE2', 're2'],
							],
						},
					},
					{}
				)
			).toEqual({_: [], e: 'RE2'});
		});
		test("--e node with {e: {valid: [['V8', 'v8', ['js', 'node']], ['RE2', 're2']]}}", () => {
			expect(
				argMate(
					['--e', 'node'],
					{
						e: {
							valid: [
								['V8', 'v8', ['js', 'node']],
								['RE2', 're2'],
							],
						},
					},
					{}
				)
			).toEqual({_: [], e: 'V8'});
		});
		test("--e js with {e: {valid: [['V8', ['v8'], ['js']], ['RE2', 're2']]}}", () => {
			expect(
				argMate(
					['--e', 'js'],
					{
						e: {
							valid: [
								['V8', ['v8'], ['js']],
								['RE2', 're2'],
							],
						},
					},
					{}
				)
			).toEqual({_: [], e: 'V8'});
		});
		test("--e v8 with {e: {valid: [['V8', ['v8', 'js']], ['RE2', 're2']]}}", () => {
			expect(
				argMate(
					['--e', 'v8'],
					{
						e: {
							valid: [
								['V8', ['v8', 'js']],
								['RE2', 're2'],
							],
						},
					},
					{}
				)
			).toEqual({_: [], e: 'V8'});
		});
		test("--e Re2 with {e: {valid: [['V8', 'v8', ['js', 'node']], ['RE2', 're2']]}}", () => {
			expect(
				errorCode(
					['--e', 'Re2'],
					{
						e: {
							valid: [
								['V8', 'v8', ['js', 'node']],
								['RE2', 're2'],
							],
						},
					},
					{}
				)
			).toBe('ERROR INVALID');
		});
		test("--t a --t x with {t: {type: 'string[]', valid: ['a', ['b', 'x']]}}", () => {
			expect(
				argMate(['--t', 'a', '--t', 'x'], {t: {type: 'string[]', valid: ['a', ['b', 'x']]}}, {})
			).toEqual({_: [], t: ['a', 'b']});
		});
		test("--n 2 with {n: {type: 'int', valid: [1, 2]}}", () => {
			expect(argMate(['--n', '2'], {n: {type: 'int', valid: [1, 2]}}, {})).toEqual({_: [], n: 2});
		});
		test("--n 3 with {n: {type: 'int', valid: [1, 2]}}", () => {
			expect(errorCode(['--n', '3'], {n: {type: 'int', valid: [1, 2]}}, {})).toBe('ERROR INVALID');
		});
	});
	describe('`validate` replaces the check of the list', () => {
		test("--n 7 with {n: {type: 'int', validate: v => 5 < v}}", () => {
			expect(argMate(['--n', '7'], {n: {type: 'int', validate: v => 5 < v}}, {})).toEqual({
				_: [],
				n: 7,
			});
		});
		test("--n 3 with {n: {type: 'int', validate: v => 5 < v}}", () => {
			expect(errorCode(['--n', '3'], {n: {type: 'int', validate: v => 5 < v}}, {})).toBe(
				'ERROR INVALID'
			);
		});
		test("--n 3 with {n: {type: 'int', validate: v => 5 < v ? undefined : 'Too small'}}", () => {
			expect(
				errorCode(
					['--n', '3'],
					{n: {type: 'int', validate: v => (5 < v ? undefined : 'Too small')}},
					{}
				)
			).toBe('ERROR INVALID');
		});
		test('--s abc with {s: {validate: /^[a-z]+$/}}', () => {
			expect(argMate(['--s', 'abc'], {s: {validate: /^[a-z]+$/}}, {})).toEqual({_: [], s: 'abc'});
		});
		test('--s a1 with {s: {validate: /^[a-z]+$/}}', () => {
			expect(errorCode(['--s', 'a1'], {s: {validate: /^[a-z]+$/}}, {})).toBe('ERROR INVALID');
		});
		test("--s b with {s: {validate: ['a', 'b']}}", () => {
			expect(argMate(['--s', 'b'], {s: {validate: ['a', 'b']}}, {})).toEqual({_: [], s: 'b'});
		});
		test("--e js with {e: {valid: [['V8', ['js']], 'RE2'], validate: (v, valid) => v === valid[0][0]}}", () => {
			expect(
				argMate(
					['--e', 'js'],
					{e: {valid: [['V8', ['js']], 'RE2'], validate: (v, valid) => v === valid[0][0]}},
					{}
				)
			).toEqual({_: [], e: 'V8'});
		});
		test("--e RE2 with {e: {valid: [['V8', ['js']], 'RE2'], validate: (v, valid) => v === valid[0][0]}}", () => {
			expect(
				errorCode(
					['--e', 'RE2'],
					{e: {valid: [['V8', ['js']], 'RE2'], validate: (v, valid) => v === valid[0][0]}},
					{}
				)
			).toBe('ERROR INVALID');
		});
		test("--e x with {e: {valid: ['V8', 'RE2'], validate: () => true}}", () => {
			expect(argMate(['--e', 'x'], {e: {valid: ['V8', 'RE2'], validate: () => true}}, {})).toEqual({
				_: [],
				e: 'x',
			});
		});
		test("(no input) with {n: {type: 'int', valid: v => 5 < v}}", () => {
			expect(errorCode([], {n: {type: 'int', valid: v => 5 < v}}, {})).toBe(
				'ERROR_NOT_VALID_CONFIG'
			);
		});
		test('(no input) with {s: {valid: /^[a-z]+$/}}', () => {
			expect(errorCode([], {s: {valid: /^[a-z]+$/}}, {})).toBe('ERROR_NOT_VALID_CONFIG');
		});
		test("(no input) with {s: {valid: ['a'], validate: ['b']}}", () => {
			expect(errorCode([], {s: {valid: ['a'], validate: ['b']}}, {})).toBe(
				'ERROR_NOT_VALID_CONFIG'
			);
		});
	});
	describe('An alias becomes its value, then `transform` runs, then the check', () => {
		test("--sort ascii with {sort: {valid: ['natural', 'ascii']}}", () => {
			expect(argMate(['--sort', 'ascii'], {sort: {valid: ['natural', 'ascii']}}, {})).toEqual({
				_: [],
				sort: 'ascii',
			});
		});
		test("--sort ASCII with {sort: {valid: ['natural', 'ascii']}}", () => {
			expect(errorCode(['--sort', 'ASCII'], {sort: {valid: ['natural', 'ascii']}}, {})).toBe(
				'ERROR INVALID'
			);
		});
		test("--sort ASCII with {sort: {transform: v => v.toLowerCase(), valid: ['natural', 'ascii']}}", () => {
			expect(
				argMate(
					['--sort', 'ASCII'],
					{sort: {transform: v => v.toLowerCase(), valid: ['natural', 'ascii']}},
					{}
				)
			).toEqual({_: [], sort: 'ascii'});
		});
		test("--sort size with {sort: {transform: v => v.toLowerCase(), valid: ['natural', 'ascii']}}", () => {
			expect(
				errorCode(
					['--sort', 'size'],
					{sort: {transform: v => v.toLowerCase(), valid: ['natural', 'ascii']}},
					{}
				)
			).toBe('ERROR INVALID');
		});
		test("--e js with {e: {valid: [['V8', ['js']], 'RE2'], transform: v => v + '!', validate: v => 'V8!' === v}}", () => {
			expect(
				argMate(
					['--e', 'js'],
					{
						e: {
							valid: [['V8', ['js']], 'RE2'],
							transform: v => v + '!',
							validate: v => 'V8!' === v,
						},
					},
					{}
				)
			).toEqual({_: [], e: 'V8!'});
		});
		test("--e RE2 with {e: {valid: [['V8', ['js']], 'RE2'], transform: () => 'js'}}", () => {
			expect(
				errorCode(['--e', 'RE2'], {e: {valid: [['V8', ['js']], 'RE2'], transform: () => 'js'}}, {})
			).toBe('ERROR INVALID');
		});
		test("--n 3 with {n: {type: 'int', transform: v => v * 2, validate: v => 5 < v}}", () => {
			expect(
				argMate(['--n', '3'], {n: {type: 'int', transform: v => v * 2, validate: v => 5 < v}}, {})
			).toEqual({_: [], n: 6});
		});
		test("--n 2 with {n: {type: 'int', transform: v => v * 2, validate: v => 5 < v}}", () => {
			expect(
				errorCode(['--n', '2'], {n: {type: 'int', transform: v => v * 2, validate: v => 5 < v}}, {})
			).toBe('ERROR INVALID');
		});
	});
	describe('A conflict is found by any name of the parameter', () => {
		test("-a with {a: {conflict: 'b'}, b: false}", () => {
			expect(argMate(['-a'], {a: {conflict: 'b'}, b: false}, {})).toEqual({
				_: [],
				a: true,
				b: false,
			});
		});
		test("-a -b with {a: {conflict: 'b'}, b: false}", () => {
			expect(errorCode(['-a', '-b'], {a: {conflict: 'b'}, b: false}, {})).toBe('ERROR CONFLICT');
		});
		test("-b -a with {a: {conflict: 'b'}, b: false}", () => {
			expect(errorCode(['-b', '-a'], {a: {conflict: 'b'}, b: false}, {})).toBe('ERROR CONFLICT');
		});
		test("-P -T with {voidPipe: {alias: 'P', conflict: ['T']}, trimPipe: {alias: 'T'}}", () => {
			expect(
				errorCode(
					['-P', '-T'],
					{voidPipe: {alias: 'P', conflict: ['T']}, trimPipe: {alias: 'T'}},
					{}
				)
			).toBe('ERROR CONFLICT');
		});
		test("--void-pipe --trim-pipe with {voidPipe: {conflict: 'trim-pipe'}, trimPipe: false}", () => {
			expect(
				errorCode(
					['--void-pipe', '--trim-pipe'],
					{voidPipe: {conflict: 'trim-pipe'}, trimPipe: false},
					{}
				)
			).toBe('ERROR CONFLICT');
		});
		test("-V -t with {voidPipe: {alias: 'V', conflict: 'trimPipe'}, trimPipe: {alias: 't'}}", () => {
			expect(
				errorCode(
					['-V', '-t'],
					{voidPipe: {alias: 'V', conflict: 'trimPipe'}, trimPipe: {alias: 't'}},
					{}
				)
			).toBe('ERROR CONFLICT');
		});
		test("--port 80 --socket a with {port: {type: 'int', conflict: 'socket'}, socket: {type: 'string'}}", () => {
			expect(
				errorCode(
					['--port', '80', '--socket', 'a'],
					{port: {type: 'int', conflict: 'socket'}, socket: {type: 'string'}},
					{}
				)
			).toBe('ERROR CONFLICT');
		});
		test("--x --y with {x: {conflict: 'z'}, y: false}", () => {
			expect(argMate(['--x', '--y'], {x: {conflict: 'z'}, y: false}, {})).toEqual({
				_: [],
				x: true,
				y: true,
			});
		});
	});
	describe('`demand` needs the other parameter in the input', () => {
		test("--null-in with {nullIn: {demand: 'globPipe'}, globPipe: false}", () => {
			expect(errorCode(['--null-in'], {nullIn: {demand: 'globPipe'}, globPipe: false}, {})).toBe(
				'ERROR DEMAND'
			);
		});
		test("--null-in --glob-pipe with {nullIn: {demand: 'globPipe'}, globPipe: false}", () => {
			expect(
				argMate(['--null-in', '--glob-pipe'], {nullIn: {demand: 'globPipe'}, globPipe: false}, {})
			).toEqual({_: [], nullIn: true, globPipe: true});
		});
		test("--glob-pipe with {nullIn: {demand: 'globPipe'}, globPipe: false}", () => {
			expect(argMate(['--glob-pipe'], {nullIn: {demand: 'globPipe'}, globPipe: false}, {})).toEqual(
				{_: [], globPipe: true}
			);
		});
		test("-n -g with {nullIn: {alias: 'n', demand: 'g'}, globPipe: {alias: 'g'}}", () => {
			expect(
				argMate(['-n', '-g'], {nullIn: {alias: 'n', demand: 'g'}, globPipe: {alias: 'g'}}, {})
			).toEqual({_: [], nullIn: true, globPipe: true});
		});
		test("-n with {nullIn: {alias: 'n', demand: 'g'}, globPipe: {alias: 'g', default: true}}", () => {
			expect(
				errorCode(
					['-n'],
					{nullIn: {alias: 'n', demand: 'g'}, globPipe: {alias: 'g', default: true}},
					{}
				)
			).toBe('ERROR DEMAND');
		});
		test("--port 80 with {port: {type: 'int', demand: 'host'}, host: {type: 'string'}}", () => {
			expect(
				errorCode(
					['--port', '80'],
					{port: {type: 'int', demand: 'host'}, host: {type: 'string'}},
					{}
				)
			).toBe('ERROR DEMAND');
		});
		test("(no input) with {nullIn: {demand: 'globPipe'}}", () => {
			expect(errorCode([], {nullIn: {demand: 'globPipe'}}, {})).toBe('ERROR_NOT_VALID_CONFIG');
		});
	});
	describe('`spot` takes one input by its place, before the parse', () => {
		test('-x y a.md with {pattern: {spot: 1}, replacement: {spot: 2}}', () => {
			expect(
				argMate(['-x', 'y', 'a.md'], {pattern: {spot: 1}, replacement: {spot: 2}}, {})
			).toEqual({_: ['a.md'], pattern: '-x', replacement: 'y'});
		});
		test('a.txt b.txt dir with {dest: {spot: -1}}', () => {
			expect(argMate(['a.txt', 'b.txt', 'dir'], {dest: {spot: -1}}, {})).toEqual({
				_: ['a.txt', 'b.txt'],
				dest: 'dir',
			});
		});
		test('-- -x with {p: {spot: 2}}', () => {
			expect(argMate(['--', '-x'], {p: {spot: 2}}, {})).toEqual({_: [], p: '-x'});
		});
		test("5 a with {n: {spot: 1, type: 'int'}}", () => {
			expect(argMate(['5', 'a'], {n: {spot: 1, type: 'int'}}, {})).toEqual({_: ['a'], n: 5});
		});
		test("x a with {n: {spot: 1, type: 'int'}}", () => {
			expect(errorCode(['x', 'a'], {n: {spot: 1, type: 'int'}}, {})).toBe('ERROR BAD_VALUE');
		});
		test('a with {p: {spot: 3}}', () => {
			expect(argMate(['a'], {p: {spot: 3}}, {})).toEqual({_: ['a']});
		});
		test('(no input) with {p: {spot: 0}}', () => {
			expect(errorCode([], {p: {spot: 0}}, {})).toBe('ERROR_NOT_VALID_CONFIG');
		});
		test('a b c with {p: {spot: -2}}', () => {
			expect(argMate(['a', 'b', 'c'], {p: {spot: -2}}, {})).toEqual({_: ['a', 'c'], p: 'b'});
		});
		test("yes a with {debug: {spot: 1, type: 'boolean'}}", () => {
			expect(argMate(['yes', 'a'], {debug: {spot: 1, type: 'boolean'}}, {})).toEqual({
				_: ['a'],
				debug: true,
			});
		});
		test("off a with {debug: {spot: 1, type: 'boolean'}}", () => {
			expect(argMate(['off', 'a'], {debug: {spot: 1, type: 'boolean'}}, {})).toEqual({
				_: ['a'],
				debug: false,
			});
		});
		test("maybe a with {debug: {spot: 1, type: 'boolean'}}", () => {
			expect(errorCode(['maybe', 'a'], {debug: {spot: 1, type: 'boolean'}}, {})).toBe(
				'ERROR BAD_VALUE'
			);
		});
		test('(no input) with {p: {spot: 1.5}}', () => {
			expect(errorCode([], {p: {spot: 1.5}}, {})).toBe('ERROR_NOT_VALID_CONFIG');
		});
		test("(no input) with {p: {spot: 1, type: 'count'}}", () => {
			expect(errorCode([], {p: {spot: 1, type: 'count'}}, {})).toBe('ERROR_NOT_VALID_CONFIG');
		});
		test("(no input) with {p: {spot: 1, alias: 'x'}}", () => {
			expect(errorCode([], {p: {spot: 1, alias: 'x'}}, {})).toBe('ERROR_NOT_VALID_CONFIG');
		});
		test('a b with {p: {spot: 1}, q: {spot: -2}}', () => {
			expect(errorCode(['a', 'b'], {p: {spot: 1}, q: {spot: -2}}, {})).toBe('ERROR MISSING_VALUE');
		});
		test('a b c with {p: {spot: 1}, q: {spot: -2}}', () => {
			expect(argMate(['a', 'b', 'c'], {p: {spot: 1}, q: {spot: -2}}, {})).toEqual({
				_: ['c'],
				p: 'a',
				q: 'b',
			});
		});
		test('(no input) with {p: {spot: 1}, q: {spot: 1}}', () => {
			expect(errorCode([], {p: {spot: 1}, q: {spot: 1}}, {})).toBe('ERROR_NOT_VALID_CONFIG');
		});
	});
	describe('`next` and `last` take several inputs, counted from the parameter', () => {
		test("--coordinates 4 2 a.md with {coordinates: {type: 'number[]', next: 2}}", () => {
			expect(
				argMate(['--coordinates', '4', '2', 'a.md'], {coordinates: {type: 'number[]', next: 2}}, {})
			).toEqual({_: ['a.md'], coordinates: [4, 2]});
		});
		test('--coordinates -4 -x with {coordinates: {next: 2}}', () => {
			expect(argMate(['--coordinates', '-4', '-x'], {coordinates: {next: 2}}, {})).toEqual({
				_: [],
				coordinates: ['-4', '-x'],
			});
		});
		test("--coordinates -4 -x with {coordinates: {type: 'number[]', next: 2}}", () => {
			expect(
				errorCode(['--coordinates', '-4', '-x'], {coordinates: {type: 'number[]', next: 2}}, {})
			).toBe('ERROR BAD_VALUE');
		});
		test('--coordinates 4 with {coordinates: {next: 2}}', () => {
			expect(errorCode(['--coordinates', '4'], {coordinates: {next: 2}}, {})).toBe(
				'ERROR MISSING_VALUE'
			);
		});
		test('--files=a b c with {files: {next: 2}}', () => {
			expect(errorCode(['--files=a', 'b', 'c'], {files: {next: 2}}, {})).toBe(
				'ERROR ASSIGN_NOT_ALLOWED'
			);
		});
		test('--files=a b c d with {files: {last: 2}}', () => {
			expect(errorCode(['--files=a', 'b', 'c', 'd'], {files: {last: 2}}, {})).toBe(
				'ERROR ASSIGN_NOT_ALLOWED'
			);
		});
		test('--files a b c d with {files: {next: -2}}', () => {
			expect(argMate(['--files', 'a', 'b', 'c', 'd'], {files: {next: -2}}, {})).toEqual({
				_: ['d'],
				files: ['a', 'b', 'c'],
			});
		});
		test('--files a b c d with {files: {last: 2}}', () => {
			expect(argMate(['--files', 'a', 'b', 'c', 'd'], {files: {last: 2}}, {})).toEqual({
				_: ['a', 'b'],
				files: ['c', 'd'],
			});
		});
		test('--files A B C D E F with {files: {last: -3}}', () => {
			expect(argMate(['--files', 'A', 'B', 'C', 'D', 'E', 'F'], {files: {last: -3}}, {})).toEqual({
				_: ['A', 'B'],
				files: ['C', 'D', 'E', 'F'],
			});
		});
		test('-x y --files a.md b.md c.md with {pattern: {spot: 1}, replacement: {spot: 2}, files: {last: -1}}', () => {
			expect(
				argMate(
					['-x', 'y', '--files', 'a.md', 'b.md', 'c.md'],
					{pattern: {spot: 1}, replacement: {spot: 2}, files: {last: -1}},
					{}
				)
			).toEqual({_: [], pattern: '-x', replacement: 'y', files: ['a.md', 'b.md', 'c.md']});
		});
		test('-x y a.md with {pattern: {spot: 1}, replacement: {spot: 2}, files: {last: -1}}', () => {
			expect(
				argMate(
					['-x', 'y', 'a.md'],
					{pattern: {spot: 1}, replacement: {spot: 2}, files: {last: -1}},
					{}
				)
			).toEqual({_: ['a.md'], pattern: '-x', replacement: 'y', files: []});
		});
		test("(no input) with {files: {next: 2, type: 'string'}}", () => {
			expect(errorCode([], {files: {next: 2, type: 'string'}}, {})).toBe('ERROR_NOT_VALID_CONFIG');
		});
		test('(no input) with {files: {next: 2, last: 2}}', () => {
			expect(errorCode([], {files: {next: 2, last: 2}}, {})).toBe('ERROR_NOT_VALID_CONFIG');
		});
	});
});

describe('Settings', () => {
	describe('With `allowUnknown: false` an unspecified parameter will be rejected', () => {
		test('--foo', () => {
			expect(argMate(['--foo'], {}, {})).toEqual({_: [], foo: true});
		});
		test('--foo and allowUnknown: false', () => {
			expect(errorCode(['--foo'], {}, {allowUnknown: false})).toBe('ERROR UNKNOWN');
		});
		test('-5 and allowUnknown: false', () => {
			expect(argMate(['-5'], {}, {allowUnknown: false})).toEqual({_: [-5]});
		});
	});
	describe('With `allowAutoNumbers: false` unspecified values will remain strings', () => {
		test('5 -5 --n=1.5', () => {
			expect(argMate(['5', '-5', '--n=1.5'], {}, {})).toEqual({_: [5, -5], n: 1.5});
		});
		test('5 -5 --n=1.5 and allowAutoNumbers: false', () => {
			expect(argMate(['5', '-5', '--n=1.5'], {}, {allowAutoNumbers: false})).toEqual({
				_: ['5', '-5'],
				n: '1.5',
			});
		});
		test("--n=5 with {n: {type: 'int'}} and allowAutoNumbers: false", () => {
			expect(argMate(['--n=5'], {n: {type: 'int'}}, {allowAutoNumbers: false})).toEqual({
				_: [],
				n: 5,
			});
		});
	});
	describe('With `allowKeyNumValues: false` a short parameter followed by digits will remain a string in `_`', () => {
		test('-n100', () => {
			expect(argMate(['-n100'], {}, {})).toEqual({_: [], n: 100});
		});
		test('-n100 and allowKeyNumValues: false', () => {
			expect(argMate(['-n100'], {}, {allowKeyNumValues: false})).toEqual({_: ['-n100']});
		});
		test("-A0 with {A: {type: 'bool'}} and allowKeyNumValues: false", () => {
			expect(argMate(['-A0'], {A: {type: 'bool'}}, {allowKeyNumValues: false})).toEqual({
				_: ['-A0'],
			});
		});
	});
	describe('With `allowNegatingFlags: false` the `no-` will be part of the name', () => {
		test('--no-color', () => {
			expect(argMate(['--no-color'], {}, {})).toEqual({_: [], color: false});
		});
		test('--no-color and allowNegatingFlags: false', () => {
			expect(argMate(['--no-color'], {}, {allowNegatingFlags: false})).toEqual({
				_: [],
				noColor: true,
			});
		});
	});
	describe('With `allowAssign: false` an assignment with `=` will be rejected', () => {
		test('--foo=10', () => {
			expect(argMate(['--foo=10'], {}, {})).toEqual({_: [], foo: 10});
		});
		test('--foo=10 and allowAssign: false', () => {
			expect(errorCode(['--foo=10'], {}, {allowAssign: false})).toBe('ERROR ASSIGN_NOT_ALLOWED');
		});
		test("--port 80 with {port: {type: 'int'}} and allowAssign: false", () => {
			expect(argMate(['--port', '80'], {port: {type: 'int'}}, {allowAssign: false})).toEqual({
				_: [],
				port: 80,
			});
		});
	});
	describe('With `autoCamelKebabCase: false` kebab-case names will remain kebab case', () => {
		test('--dry-run', () => {
			expect(argMate(['--dry-run'], {}, {})).toEqual({_: [], dryRun: true});
		});
		test('--dry-run and autoCamelKebabCase: false', () => {
			expect(argMate(['--dry-run'], {}, {autoCamelKebabCase: false})).toEqual({
				_: [],
				'dry-run': true,
			});
		});
	});
	describe('With `greedy: true` the inputs after `--` will be joined into one string', () => {
		test('-- a b', () => {
			expect(argMate(['--', 'a', 'b'], {}, {})).toEqual({_: ['a', 'b']});
		});
		test('-- a b and greedy: true', () => {
			expect(argMate(['--', 'a', 'b'], {}, {greedy: true})).toEqual({_: ['a b']});
		});
	});
	describe('With `strict: true` each `allow` setting will be `false`, unless it is given', () => {
		test('--foo -5', () => {
			expect(argMate(['--foo', '-5'], {}, {})).toEqual({_: [-5], foo: true});
		});
		test('--foo -5 and strict: true', () => {
			expect(errorCode(['--foo', '-5'], {}, {strict: true})).toBe('ERROR UNKNOWN');
		});
		test('-5 and strict: true', () => {
			expect(argMate(['-5'], {}, {strict: true})).toEqual({_: ['-5']});
		});
		test("-A0 with {A: {type: 'bool'}} and strict: true", () => {
			expect(argMate(['-A0'], {A: {type: 'bool'}}, {strict: true})).toEqual({_: ['-A0']});
		});
		test('-5 and strict: true, allowAutoNumbers: true', () => {
			expect(argMate(['-5'], {}, {strict: true, allowAutoNumbers: true})).toEqual({_: [-5]});
		});
	});
	describe('`crossValidate` checks the parameters together, after all the other checks', () => {
		test('-a -b with {a: false, b: false} and crossValidate: argv => !(argv.a && argv.b)', () => {
			expect(
				errorCode(['-a', '-b'], {a: false, b: false}, {crossValidate: argv => !(argv.a && argv.b)})
			).toBe('ERROR CROSS_VALIDATE');
		});
		test("-a -b with {a: false, b: false} and crossValidate: argv => argv.a && argv.b ? 'Use a or b' : true", () => {
			expect(
				errorCode(
					['-a', '-b'],
					{a: false, b: false},
					{crossValidate: argv => (argv.a && argv.b ? 'Use a or b' : true)}
				)
			).toBe('ERROR CROSS_VALIDATE');
		});
		test('-a with {a: false, b: false} and crossValidate: argv => !(argv.a && argv.b)', () => {
			expect(
				argMate(['-a'], {a: false, b: false}, {crossValidate: argv => !(argv.a && argv.b)})
			).toEqual({_: [], a: true, b: false});
		});
		test('-a with {a: false, b: false} and crossValidate: argv => {argv.b = argv.a}', () => {
			expect(
				argMate(
					['-a'],
					{a: false, b: false},
					{
						crossValidate: argv => {
							argv.b = argv.a;
						},
					}
				)
			).toEqual({_: [], a: true, b: true});
		});
		test("-a -b with {a: {conflict: 'b'}, b: false} and crossValidate: () => true", () => {
			expect(
				errorCode(['-a', '-b'], {a: {conflict: 'b'}, b: false}, {crossValidate: () => true})
			).toBe('ERROR CONFLICT');
		});
	});
});
