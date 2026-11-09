// Made by tools/generateTestsFromDocumentation.js from README.md, in its order: each row of a table is one test.
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

describe('Default behaviour', () => {
	describe('Parameters', () => {
		test('--verbose', () => {
			expect(argMate(['--verbose'], {}, {})).toEqual({_: [], verbose: true});
		});
		test('-v', () => {
			expect(argMate(['-v'], {}, {})).toEqual({_: [], v: true});
		});
		test('--name bob', () => {
			expect(argMate(['--name', 'bob'], {}, {})).toEqual({_: ['bob'], name: true});
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
		test('-n=a=b', () => {
			expect(argMate(['-n=a=b'], {}, {})).toEqual({_: [], n: 'a=b'});
		});
		test('-abc', () => {
			expect(argMate(['-abc'], {}, {})).toEqual({_: [], a: true, b: true, c: true});
		});
		test('-a -b -c', () => {
			expect(argMate(['-a', '-b', '-c'], {}, {})).toEqual({_: [], a: true, b: true, c: true});
		});
		test('-abc=5', () => {
			expect(argMate(['-abc=5'], {}, {})).toEqual({_: [], a: true, b: true, c: 5});
		});
		test('--abc', () => {
			expect(argMate(['--abc'], {}, {})).toEqual({_: [], abc: true});
		});
		test('-🚀', () => {
			expect(argMate(['-🚀'], {}, {})).toEqual({_: [], '🚀': true});
		});
		test('-👍🏽x', () => {
			expect(argMate(['-👍🏽x'], {}, {})).toEqual({_: [], '👍🏽': true, x: true});
		});
		test("-vvv with {v: {type: 'count'}}", () => {
			expect(argMate(['-vvv'], {v: {type: 'count'}}, {})).toEqual({_: [], v: 3});
		});
		test("-p 80 with {port: {type: 'int', alias: 'p'}}", () => {
			expect(argMate(['-p', '80'], {port: {type: 'int', alias: 'p'}}, {})).toEqual({
				_: [],
				port: 80,
			});
		});
		test("-p=80 with {port: {type: 'int', alias: 'p'}}", () => {
			expect(argMate(['-p=80'], {port: {type: 'int', alias: 'p'}}, {})).toEqual({_: [], port: 80});
		});
		test('-a123', () => {
			expect(argMate(['-a123'], {}, {})).toEqual({_: [], a: 123});
		});
		test('-abc123', () => {
			expect(argMate(['-abc123'], {}, {})).toEqual({_: [], a: true, b: true, c: 123});
		});
		test('--abc123', () => {
			expect(argMate(['--abc123'], {}, {})).toEqual({_: [], abc123: true});
		});
		test('-n007', () => {
			expect(argMate(['-n007'], {}, {})).toEqual({_: [], n: '007'});
		});
		test("-p80 with {port: {type: 'int', alias: 'p'}}", () => {
			expect(argMate(['-p80'], {port: {type: 'int', alias: 'p'}}, {})).toEqual({_: [], port: 80});
		});
		test("-n100 with {n100: {type: 'bool'}}", () => {
			expect(argMate(['-n100'], {n100: {type: 'bool'}}, {})).toEqual({_: [], n: 100});
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
		test("-A0 with {A0: {type: 'bool'}}", () => {
			expect(argMate(['-A0'], {A0: {type: 'bool'}}, {})).toEqual({_: [], A: 0});
		});
		test('-a1b', () => {
			expect(argMate(['-a1b'], {}, {})).toEqual({_: ['-a1b']});
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
	});
	describe('Values', () => {
		test('file.txt x', () => {
			expect(argMate(['file.txt', 'x'], {}, {})).toEqual({_: ['file.txt', 'x']});
		});
		test('a -v b', () => {
			expect(argMate(['a', '-v', 'b'], {}, {})).toEqual({_: ['a', 'b'], v: true});
		});
		test('-', () => {
			expect(argMate(['-'], {}, {})).toEqual({_: ['-']});
		});
		test('-- -v --x', () => {
			expect(argMate(['--', '-v', '--x'], {}, {})).toEqual({_: ['-v', '--x']});
		});
		test('a -- b', () => {
			expect(argMate(['a', '--', 'b'], {}, {})).toEqual({_: ['a', 'b']});
		});
		test('-- -5 1.5', () => {
			expect(argMate(['--', '-5', '1.5'], {}, {})).toEqual({_: ['-5', '1.5']});
		});
	});
	describe('Auto numbers', () => {
		test('5 1.5 -1e3', () => {
			expect(argMate(['5', '1.5', '-1e3'], {}, {})).toEqual({_: [5, 1.5, -1000]});
		});
		test('--n=5 --m=-5', () => {
			expect(argMate(['--n=5', '--m=-5'], {}, {})).toEqual({_: [], n: 5, m: -5});
		});
		test('--f=1.5 --g=1.0', () => {
			expect(argMate(['--f=1.5', '--g=1.0'], {}, {})).toEqual({_: [], f: 1.5, g: 1});
		});
		test('--e=1e4 --s=-2.5e-4', () => {
			expect(argMate(['--e=1e4', '--s=-2.5e-4'], {}, {})).toEqual({_: [], e: 10000, s: -0.00025});
		});
		test('-n5', () => {
			expect(argMate(['-n5'], {}, {})).toEqual({_: [], n: 5});
		});
		test('007 0x10', () => {
			expect(argMate(['007', '0x10'], {}, {})).toEqual({_: ['007', '0x10']});
		});
		test('--n=+5 --m=.5 --k=1_000', () => {
			expect(argMate(['--n=+5', '--m=.5', '--k=1_000'], {}, {})).toEqual({
				_: [],
				n: '+5',
				m: '.5',
				k: '1_000',
			});
		});
		test('--big=12345678901234567890', () => {
			expect(argMate(['--big=12345678901234567890'], {}, {})).toEqual({
				_: [],
				big: '12345678901234567890',
			});
		});
		test('--inf=1e400', () => {
			expect(argMate(['--inf=1e400'], {}, {})).toEqual({_: [], inf: '1e400'});
		});
		test('--d=true --e=no', () => {
			expect(argMate(['--d=true', '--e=no'], {}, {})).toEqual({_: [], d: 'true', e: 'no'});
		});
		test('-5', () => {
			expect(argMate(['-5'], {}, {})).toEqual({_: [-5]});
		});
		test('-1.5', () => {
			expect(argMate(['-1.5'], {}, {})).toEqual({_: [-1.5]});
		});
		test('-1.0', () => {
			expect(argMate(['-1.0'], {}, {})).toEqual({_: [-1]});
		});
		test('-0', () => {
			expect(argMate(['-0'], {}, {})).toEqual({_: [-0]});
		});
		test('-1e3', () => {
			expect(argMate(['-1e3'], {}, {})).toEqual({_: [-1000]});
		});
		test('-1e-3', () => {
			expect(argMate(['-1e-3'], {}, {})).toEqual({_: [-0.001]});
		});
		test('-v -5 x', () => {
			expect(argMate(['-v', '-5', 'x'], {}, {})).toEqual({_: [-5, 'x'], v: true});
		});
		test('-0x10', () => {
			expect(argMate(['-0x10'], {}, {})).toEqual({_: ['-0x10']});
		});
		test('-007', () => {
			expect(argMate(['-007'], {}, {})).toEqual({_: ['-007']});
		});
		test('-.5', () => {
			expect(argMate(['-.5'], {}, {})).toEqual({_: ['-.5']});
		});
		test('-1.', () => {
			expect(argMate(['-1.'], {}, {})).toEqual({_: ['-1.']});
		});
		test('-5px', () => {
			expect(argMate(['-5px'], {}, {})).toEqual({_: ['-5px']});
		});
		test('-10,10', () => {
			expect(argMate(['-10,10'], {}, {})).toEqual({_: ['-10,10']});
		});
		test('-1_000', () => {
			expect(argMate(['-1_000'], {}, {})).toEqual({_: ['-1_000']});
		});
		test('-12345678901234567890', () => {
			expect(argMate(['-12345678901234567890'], {}, {})).toEqual({_: ['-12345678901234567890']});
		});
		test('-1e400', () => {
			expect(argMate(['-1e400'], {}, {})).toEqual({_: ['-1e400']});
		});
	});
	describe('Long names', () => {
		test('--port8080', () => {
			expect(argMate(['--port8080'], {}, {})).toEqual({_: [], port8080: true});
		});
		test('--utf8', () => {
			expect(argMate(['--utf8'], {}, {})).toEqual({_: [], utf8: true});
		});
		test('--dry-run', () => {
			expect(argMate(['--dry-run'], {}, {})).toEqual({_: [], dryRun: true});
		});
	});
	describe('Names of only digits', () => {
		test('--5', () => {
			expect(errorCode(['--5'], {}, {})).toBe('ERROR NUMBER_NAME');
		});
		test('--123=value', () => {
			expect(errorCode(['--123=value'], {}, {})).toBe('ERROR NUMBER_NAME');
		});
		test('--no-5', () => {
			expect(errorCode(['--no-5'], {}, {})).toBe('ERROR NUMBER_NAME');
		});
		test('-5=3', () => {
			expect(errorCode(['-5=3'], {}, {})).toBe('ERROR NUMBER_NAME');
		});
		test("-5=3 with {5: {type: 'int'}}", () => {
			expect(argMate(['-5=3'], {5: {type: 'int'}}, {})).toEqual({_: [], 5: 3});
		});
		test("--5 with {5: {type: 'bool'}}", () => {
			expect(argMate(['--5'], {5: {type: 'bool'}}, {})).toEqual({_: [], 5: true});
		});
		test("--123 x with {123: {type: 'string'}}", () => {
			expect(argMate(['--123', 'x'], {123: {type: 'string'}}, {})).toEqual({_: [], 123: 'x'});
		});
		test("-5 with {5: {type: 'bool'}}", () => {
			expect(argMate(['-5'], {5: {type: 'bool'}}, {})).toEqual({_: [], 5: true});
		});
		test("-1 with {verbose: {alias: '1'}}", () => {
			expect(argMate(['-1'], {verbose: {alias: '1'}}, {})).toEqual({_: [], verbose: true});
		});
		test("-12 with {1: {type: 'bool'}, 2: {type: 'bool'}}", () => {
			expect(argMate(['-12'], {1: {type: 'bool'}, 2: {type: 'bool'}}, {})).toEqual({
				_: [],
				1: true,
				2: true,
			});
		});
		test("-1a with {1: {type: 'bool'}, a: {type: 'bool'}}", () => {
			expect(argMate(['-1a'], {1: {type: 'bool'}, a: {type: 'bool'}}, {})).toEqual({
				_: [],
				1: true,
				a: true,
			});
		});
		test("-007 with {0: {type: 'bool'}, 7: {type: 'bool'}}", () => {
			expect(argMate(['-007'], {0: {type: 'bool'}, 7: {type: 'bool'}}, {})).toEqual({
				_: [],
				0: true,
				7: true,
			});
		});
		test("-.v with {'.': {type: 'bool'}, v: {type: 'bool'}}", () => {
			expect(argMate(['-.v'], {'.': {type: 'bool'}, v: {type: 'bool'}}, {})).toEqual({
				_: [],
				'.': true,
				v: true,
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
		test('-1️⃣', () => {
			expect(argMate(['-1️⃣'], {}, {})).toEqual({_: [], '1️⃣': true});
		});
	});
	describe('Negation', () => {
		test('--no-color', () => {
			expect(argMate(['--no-color'], {}, {})).toEqual({_: [], color: false});
		});
		test('--no-color=1', () => {
			expect(errorCode(['--no-color=1'], {}, {})).toBe('ERROR NEGATED_AND_ASSIGNED');
		});
		test("--no-debug=1 with {debug: {type: 'bool'}}", () => {
			expect(errorCode(['--no-debug=1'], {debug: {type: 'bool'}}, {})).toBe(
				'ERROR NEGATED_AND_ASSIGNED'
			);
		});
		test("--no-port with {port: {type: 'int'}}", () => {
			expect(errorCode(['--no-port'], {port: {type: 'int'}}, {})).toBe('ERROR MISSING_VALUE');
		});
		test("--no-port 5 with {port: {type: 'int'}}", () => {
			expect(errorCode(['--no-port', '5'], {port: {type: 'int'}}, {})).toBe(
				'ERROR NEGATED_AND_ASSIGNED'
			);
		});
		test("--no-v with {v: {type: 'count'}}", () => {
			expect(errorCode(['--no-v'], {v: {type: 'count'}}, {})).toBe('ERROR BAD_TYPE');
		});
	});
	describe('Specified types', () => {
		test("--name bob with {name: {type: 'string'}}", () => {
			expect(argMate(['--name', 'bob'], {name: {type: 'string'}}, {})).toEqual({
				_: [],
				name: 'bob',
			});
		});
		test("--name bob with {name: {type: 'int'}}", () => {
			expect(errorCode(['--name', 'bob'], {name: {type: 'int'}}, {})).toBe('ERROR BAD_VALUE');
		});
		test('--n 5 with {n: {default: 0}}', () => {
			expect(argMate(['--n', '5'], {n: {default: 0}}, {})).toEqual({_: [], n: 5});
		});
		test("--n x with {n: {default: 'a'}}", () => {
			expect(argMate(['--n', 'x'], {n: {default: 'a'}}, {})).toEqual({_: [], n: 'x'});
		});
		test("--text -5 with {text: {type: 'string'}}", () => {
			expect(argMate(['--text', '-5'], {text: {type: 'string'}}, {})).toEqual({_: [], text: '-5'});
		});
		test("--text --5 with {text: {type: 'string'}}", () => {
			expect(argMate(['--text', '--5'], {text: {type: 'string'}}, {})).toEqual({
				_: [],
				text: '--5',
			});
		});
		test("--num -5 with {num: {type: 'number'}}", () => {
			expect(argMate(['--num', '-5'], {num: {type: 'number'}}, {})).toEqual({_: [], num: -5});
		});
		test("--port with {port: {type: 'int'}}", () => {
			expect(errorCode(['--port'], {port: {type: 'int'}}, {})).toBe('ERROR MISSING_VALUE');
		});
		test("--port= 80 with {port: {type: 'int'}}", () => {
			expect(errorCode(['--port=', '80'], {port: {type: 'int'}}, {})).toBe('ERROR MISSING_VALUE');
		});
		test("--name= bob with {name: {type: 'string'}}", () => {
			expect(argMate(['--name=', 'bob'], {name: {type: 'string'}}, {})).toEqual({
				_: ['bob'],
				name: '',
			});
		});
		test("--n=5 --m=-5 with {n: {type: 'int'}, m: {type: 'int'}}", () => {
			expect(argMate(['--n=5', '--m=-5'], {n: {type: 'int'}, m: {type: 'int'}}, {})).toEqual({
				_: [],
				n: 5,
				m: -5,
			});
		});
		test("--n=0x10 with {n: {type: 'int'}}", () => {
			expect(argMate(['--n=0x10'], {n: {type: 'int'}}, {})).toEqual({_: [], n: 16});
		});
		test("--n=-0x10 with {n: {type: 'int'}}", () => {
			expect(errorCode(['--n=-0x10'], {n: {type: 'int'}}, {})).toBe('ERROR BAD_VALUE');
		});
		test("--n=1e3 with {n: {type: 'int'}}", () => {
			expect(argMate(['--n=1e3'], {n: {type: 'int'}}, {})).toEqual({_: [], n: 1000});
		});
		test("--n=1.5 with {n: {type: 'int'}}", () => {
			expect(errorCode(['--n=1.5'], {n: {type: 'int'}}, {})).toBe('ERROR BAD_VALUE');
		});
		test("--n=abc with {n: {type: 'int'}}", () => {
			expect(errorCode(['--n=abc'], {n: {type: 'int'}}, {})).toBe('ERROR BAD_VALUE');
		});
		test("--n=007 with {n: {type: 'int'}}", () => {
			expect(errorCode(['--n=007'], {n: {type: 'int'}}, {})).toBe('ERROR BAD_VALUE');
		});
		test("--n=12345678901234567890 with {n: {type: 'int'}}", () => {
			expect(errorCode(['--n=12345678901234567890'], {n: {type: 'int'}}, {})).toBe(
				'ERROR BAD_VALUE'
			);
		});
		test("--n=1.5 --m=-1e3 with {n: {type: 'number'}, m: {type: 'number'}}", () => {
			expect(
				argMate(['--n=1.5', '--m=-1e3'], {n: {type: 'number'}, m: {type: 'number'}}, {})
			).toEqual({_: [], n: 1.5, m: -1000});
		});
		test("--n=1.5 with {n: {type: 'float'}}", () => {
			expect(argMate(['--n=1.5'], {n: {type: 'float'}}, {})).toEqual({_: [], n: 1.5});
		});
		test("--n=0x10 with {n: {type: 'number'}}", () => {
			expect(argMate(['--n=0x10'], {n: {type: 'number'}}, {})).toEqual({_: [], n: 16});
		});
		test("--n=abc with {n: {type: 'number'}}", () => {
			expect(errorCode(['--n=abc'], {n: {type: 'number'}}, {})).toBe('ERROR BAD_VALUE');
		});
		test("--n=1e400 with {n: {type: 'number'}}", () => {
			expect(errorCode(['--n=1e400'], {n: {type: 'number'}}, {})).toBe('ERROR BAD_VALUE');
		});
		test("--n=12345678901234567890 with {n: {type: 'number'}}", () => {
			expect(errorCode(['--n=12345678901234567890'], {n: {type: 'number'}}, {})).toBe(
				'ERROR BAD_VALUE'
			);
		});
		test("--h=ff --g=0x10 with {h: {type: 'hex'}, g: {type: 'hex'}}", () => {
			expect(argMate(['--h=ff', '--g=0x10'], {h: {type: 'hex'}, g: {type: 'hex'}}, {})).toEqual({
				_: [],
				h: 255,
				g: 16,
			});
		});
		test("--h=-ff with {h: {type: 'hex'}}", () => {
			expect(argMate(['--h=-ff'], {h: {type: 'hex'}}, {})).toEqual({_: [], h: -255});
		});
		test("--h=zz with {h: {type: 'hex'}}", () => {
			expect(errorCode(['--h=zz'], {h: {type: 'hex'}}, {})).toBe('ERROR BAD_VALUE');
		});
		test("--d=yes --e=off --f=1 with {d: {type: 'bool'}, e: {type: 'bool'}, f: {type: 'bool'}}", () => {
			expect(
				argMate(
					['--d=yes', '--e=off', '--f=1'],
					{d: {type: 'bool'}, e: {type: 'bool'}, f: {type: 'bool'}},
					{}
				)
			).toEqual({_: [], d: true, e: false, f: true});
		});
		test("--d=TRUE with {d: {type: 'bool'}}", () => {
			expect(argMate(['--d=TRUE'], {d: {type: 'bool'}}, {})).toEqual({_: [], d: true});
		});
		test("--d=maybe with {d: {type: 'bool'}}", () => {
			expect(errorCode(['--d=maybe'], {d: {type: 'bool'}}, {})).toBe('ERROR BAD_VALUE');
		});
		test('--n with {n: {}}', () => {
			expect(argMate(['--n'], {n: {}}, {})).toEqual({_: [], n: true});
		});
		test('--n=-5 with {n: {}}', () => {
			expect(errorCode(['--n=-5'], {n: {}}, {})).toBe('ERROR BAD_VALUE');
		});
		test("(no input) with {d: {type: 'bool', default: null}}", () => {
			expect(argMate([], {d: {type: 'bool', default: null}}, {})).toEqual({_: [], d: null});
		});
		test("--d with {d: {type: 'bool', default: null}}", () => {
			expect(argMate(['--d'], {d: {type: 'bool', default: null}}, {})).toEqual({_: [], d: true});
		});
		test("--no-d with {d: {type: 'bool', default: null}}", () => {
			expect(argMate(['--no-d'], {d: {type: 'bool', default: null}}, {})).toEqual({
				_: [],
				d: false,
			});
		});
		test('(no input) with {d: null}', () => {
			expect(argMate([], {d: null}, {})).toEqual({_: [], d: null});
		});
		test('--d with {d: null}', () => {
			expect(argMate(['--d'], {d: null}, {})).toEqual({_: [], d: true});
		});
		test('--no-d with {d: null}', () => {
			expect(argMate(['--no-d'], {d: null}, {})).toEqual({_: [], d: false});
		});
		test("--s=5 --t=true with {s: {type: 'string'}, t: {type: 'string'}}", () => {
			expect(
				argMate(['--s=5', '--t=true'], {s: {type: 'string'}, t: {type: 'string'}}, {})
			).toEqual({_: [], s: '5', t: 'true'});
		});
	});
});

describe('Settings', () => {
	describe('allowUnknown', () => {
		test('--foo', () => {
			expect(argMate(['--foo'], {}, {})).toEqual({_: [], foo: true});
		});
		test('--foo and allowUnknown: false', () => {
			expect(errorCode(['--foo'], {}, {allowUnknown: false})).toBe('ERROR UNKNOWN');
		});
		test("--foo with {foo: {type: 'bool'}} and allowUnknown: false", () => {
			expect(argMate(['--foo'], {foo: {type: 'bool'}}, {allowUnknown: false})).toEqual({
				_: [],
				foo: true,
			});
		});
		test('-5 and allowUnknown: false', () => {
			expect(argMate(['-5'], {}, {allowUnknown: false})).toEqual({_: [-5]});
		});
	});
	describe('allowAutoNumbers', () => {
		test('5 1.5', () => {
			expect(argMate(['5', '1.5'], {}, {})).toEqual({_: [5, 1.5]});
		});
		test('5 1.5 and allowAutoNumbers: false', () => {
			expect(argMate(['5', '1.5'], {}, {allowAutoNumbers: false})).toEqual({_: ['5', '1.5']});
		});
		test('-5', () => {
			expect(argMate(['-5'], {}, {})).toEqual({_: [-5]});
		});
		test('-5 and allowAutoNumbers: false', () => {
			expect(argMate(['-5'], {}, {allowAutoNumbers: false})).toEqual({_: ['-5']});
		});
		test('--n=5 --m=-5', () => {
			expect(argMate(['--n=5', '--m=-5'], {}, {})).toEqual({_: [], n: 5, m: -5});
		});
		test('--n=5 --m=-5 and allowAutoNumbers: false', () => {
			expect(argMate(['--n=5', '--m=-5'], {}, {allowAutoNumbers: false})).toEqual({
				_: [],
				n: '5',
				m: '-5',
			});
		});
		test('-n5', () => {
			expect(argMate(['-n5'], {}, {})).toEqual({_: [], n: 5});
		});
		test('-n5 and allowAutoNumbers: false', () => {
			expect(argMate(['-n5'], {}, {allowAutoNumbers: false})).toEqual({_: [], n: '5'});
		});
		test("--n=5 with {n: {type: 'int'}} and allowAutoNumbers: false", () => {
			expect(argMate(['--n=5'], {n: {type: 'int'}}, {allowAutoNumbers: false})).toEqual({
				_: [],
				n: 5,
			});
		});
	});
	describe('allowKeyNumValues', () => {
		test('-n100', () => {
			expect(argMate(['-n100'], {}, {})).toEqual({_: [], n: 100});
		});
		test('-n100 and allowKeyNumValues: false', () => {
			expect(argMate(['-n100'], {}, {allowKeyNumValues: false})).toEqual({_: ['-n100']});
		});
		test("-A0 with {A: {type: 'bool'}}", () => {
			expect(argMate(['-A0'], {A: {type: 'bool'}}, {})).toEqual({_: [], A: false});
		});
		test("-A1 with {A: {type: 'bool'}}", () => {
			expect(argMate(['-A1'], {A: {type: 'bool'}}, {})).toEqual({_: [], A: true});
		});
		test("-A0 with {A: {type: 'bool'}} and allowKeyNumValues: false", () => {
			expect(argMate(['-A0'], {A: {type: 'bool'}}, {allowKeyNumValues: false})).toEqual({
				_: ['-A0'],
			});
		});
		test("-A0 with {A: {type: 'bool'}, 0: {type: 'bool'}} and allowKeyNumValues: false", () => {
			expect(
				argMate(['-A0'], {A: {type: 'bool'}, 0: {type: 'bool'}}, {allowKeyNumValues: false})
			).toEqual({_: [], A: true, 0: true});
		});
	});
	describe('allowNegatingFlags', () => {
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
	describe('allowAssign', () => {
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
	describe('autoCamelKebabCase', () => {
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
	describe('greedy', () => {
		test('-- a b', () => {
			expect(argMate(['--', 'a', 'b'], {}, {})).toEqual({_: ['a', 'b']});
		});
		test('-- a b and greedy: true', () => {
			expect(argMate(['--', 'a', 'b'], {}, {greedy: true})).toEqual({_: ['a b']});
		});
	});
	describe('strict', () => {
		test('-5 x', () => {
			expect(argMate(['-5', 'x'], {}, {})).toEqual({_: [-5, 'x']});
		});
		test('-5 x and strict: true', () => {
			expect(argMate(['-5', 'x'], {}, {strict: true})).toEqual({_: ['-5', 'x']});
		});
		test('--foo and strict: true', () => {
			expect(errorCode(['--foo'], {}, {strict: true})).toBe('ERROR UNKNOWN');
		});
		test("--port=80 with {port: {type: 'int'}} and strict: true", () => {
			expect(errorCode(['--port=80'], {port: {type: 'int'}}, {strict: true})).toBe(
				'ERROR ASSIGN_NOT_ALLOWED'
			);
		});
		test("--port 80 with {port: {type: 'int'}} and strict: true", () => {
			expect(argMate(['--port', '80'], {port: {type: 'int'}}, {strict: true})).toEqual({
				_: [],
				port: 80,
			});
		});
		test("-n5 with {n: {type: 'string'}} and strict: true", () => {
			expect(argMate(['-n5'], {n: {type: 'string'}}, {strict: true})).toEqual({_: ['-n5']});
		});
		test('-5 and strict: true, allowAutoNumbers: true', () => {
			expect(argMate(['-5'], {}, {strict: true, allowAutoNumbers: true})).toEqual({_: [-5]});
		});
		test("--port=80 with {port: {type: 'int'}} and allowUnknown: false", () => {
			expect(argMate(['--port=80'], {port: {type: 'int'}}, {allowUnknown: false})).toEqual({
				_: [],
				port: 80,
			});
		});
	});
	describe('outputAlias', () => {
		test("-f a.txt with {file: {type: 'string', alias: 'f'}}", () => {
			expect(argMate(['-f', 'a.txt'], {file: {type: 'string', alias: 'f'}}, {})).toEqual({
				_: [],
				file: 'a.txt',
			});
		});
		test("-f a.txt with {file: {type: 'string', alias: 'f'}} and outputAlias: true", () => {
			expect(
				argMate(['-f', 'a.txt'], {file: {type: 'string', alias: 'f'}}, {outputAlias: true})
			).toEqual({_: [], file: 'a.txt', f: 'a.txt'});
		});
		test("--dry-run with {dryRun: {alias: 'n'}} and outputAlias: true", () => {
			expect(argMate(['--dry-run'], {dryRun: {alias: 'n'}}, {outputAlias: true})).toEqual({
				_: [],
				dryRun: true,
				'dry-run': true,
				n: true,
			});
		});
	});
});
