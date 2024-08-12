// Tests are inpsired from the Deno CLI parseArgs https://github.com/denoland/std/blob/main/cli/parse_args_test.ts
// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';

let argv;

const Deno = {
	test: (...a) => {},
};

const assertEquals = function (a, b) {
	expect(a).toEqual(b);
};

const assertThrows = function (a, b, c) {
	expect(a).toThrow(c);
};

run(argMate);
run(argMateLite, ' lite');

function run(parseArgs, type = '') {
	describe('Inspired by deno' + type, () => {
		test('parseArgs() handles true boolean flag', () => {
			argv = parseArgs(['moo', '--honk', 'cow']);

			expect(argv).toEqual({
				_: ['moo', 'cow'],
				honk: true,
			});

			expect(typeof argv.honk).toEqual('boolean');
		});

		test('parseArgs() handles boolean true flag if double dashed', () => {
			argv = argMate(['moo', '--honk', 'cow', '--tacos=good', '-p', '55'], {
				p: 0,
			});

			expect(argv).toEqual({
				_: ['moo', 'cow'],
				honk: true,
				tacos: 'good',
				p: 55,
			});

			expect(typeof argv.honk).toEqual('boolean');
		});

		test('parseArgs() handles boolean flag default value', () => {
			argv = argMate(['moo'], {
				t: false,
				verbose: false,
			});

			expect(argv).toEqual({
				_: ['moo'],
				verbose: false,
				t: false,
			});

			expect(typeof argv.verbose).toEqual('boolean');
			expect(typeof argv.t).toEqual('boolean');
		});

		test('parseArgs() handles boolean group', () => {
			argv = argMate(['-x', '-z', 'one', 'two', 'three'], {
				x: false,
				y: false,
				z: false,
			});

			expect(argv).toEqual({
				_: ['one', 'two', 'three'],
				x: true,
				y: false,
				z: true,
			});

			expect(typeof argv.x).toEqual('boolean');
			expect(typeof argv.y).toEqual('boolean');
			expect(typeof argv.z).toEqual('boolean');
		});

		test.todo('parseArgs() handles boolean and alias default values', () => {
			argv = argMate(
				[],
				{
					bar: {type: 'boolean', alias: 'b'},
					foo: {type: 'string'},
				},
				{
					outputAlias: true,
				}
			);

			expect(argv).toEqual({
				_: [],
				bar: false,
				b: false,
			});

			expect(typeof argv.bar).toEqual('boolean');
			expect(typeof argv.b).toEqual('boolean');
		});

		test.if(!type)('parseArgs() handles boolean and alias with chainable api', () => {
			expect(
				argMate(
					['-h', 'derp'],
					{
						herp: {type: 'boolean', alias: 'h'},
					},
					{
						outputAlias: true,
					}
				)
			).toEqual({
				_: ['derp'],
				herp: true,
				h: true,
			});

			expect(
				argMate(
					['--herp', 'derp'],
					{
						herp: {type: 'boolean', alias: 'h'},
					},
					{
						outputAlias: true,
					}
				)
			).toEqual({
				_: ['derp'],
				herp: true,
				h: true,
			});
		});

		Deno.test('parseArgs() handles boolean and alias with options hash', function () {
			const aliased = ['-h', 'derp'];
			const regular = ['--herp', 'derp'];
			const opts = {
				alias: {h: 'herp'},
				boolean: 'herp',
			} as const;
			const aliasedArgv = parseArgs(aliased, opts);
			const propertyArgv = parseArgs(regular, opts);
			const expected = {
				herp: true,
				h: true,
				_: ['derp'],
			};
			assertEquals(aliasedArgv, expected);
			assertEquals(propertyArgv, expected);
		});

		Deno.test('parseArgs() handles boolean and alias array with options hash', function () {
			const aliased = ['-h', 'derp'];
			const regular = ['--herp', 'derp'];
			const alt = ['--harp', 'derp'];
			const opts = {
				alias: {h: ['herp', 'harp']},
				boolean: 'h',
			} as const;
			const aliasedArgv = parseArgs(aliased, opts);
			const propertyArgv = parseArgs(regular, opts);
			const altPropertyArgv = parseArgs(alt, opts);
			const expected = {
				harp: true,
				herp: true,
				h: true,
				_: ['derp'],
			};
			assertEquals(aliasedArgv, expected);
			assertEquals(propertyArgv, expected);
			assertEquals(altPropertyArgv, expected);
		});

		Deno.test('parseArgs() handles boolean and alias using explicit true', function () {
			const aliased = ['-h', 'true'];
			const regular = ['--herp', 'true'];
			const opts = {
				alias: {h: 'herp'},
				boolean: 'h',
			} as const;
			const aliasedArgv = parseArgs(aliased, opts);
			const propertyArgv = parseArgs(regular, opts);
			const expected = {
				herp: true,
				h: true,
				_: [],
			};

			assertEquals(aliasedArgv, expected);
			assertEquals(propertyArgv, expected);
		});

		// regression, see https://github.com/substack/node-optimist/issues/71
		// boolean and --x=true
		Deno.test('parseArgs() handles boolean and non-boolean', function () {
			const parsed = parseArgs(['--boool', '--other=true'], {
				boolean: 'boool',
			});

			assertEquals(parsed.boool, true);
			assertEquals(parsed.other, 'true');

			const parsed2 = parseArgs(['--boool', '--other=false'], {
				boolean: 'boool',
			});

			assertEquals(parsed2.boool, true);
			assertEquals(parsed2.other, 'false');
		});

		Deno.test('parseArgs() handles boolean true parsing', function () {
			const parsed = parseArgs(['--boool=true'], {
				default: {
					boool: false,
				},
				boolean: ['boool'],
			});

			assertEquals(parsed.boool, true);
		});

		Deno.test('parseArgs() handles boolean false parsing', function () {
			const parsed = parseArgs(['--boool=false'], {
				default: {
					boool: true,
				},
				boolean: ['boool'],
			});

			assertEquals(parsed.boool, false);
		});

		Deno.test('parseArgs() handles boolean true-like parsing', function () {
			const parsed = parseArgs(['-t', 'true123'], {boolean: ['t']});
			assertEquals(parsed.t, true);

			const parsed2 = parseArgs(['-t', '123'], {boolean: ['t']});
			assertEquals(parsed2.t, true);

			const parsed3 = parseArgs(['-t', 'false123'], {boolean: ['t']});
			assertEquals(parsed3.t, true);
		});

		Deno.test('parseArgs() handles boolean after boolean negation', function () {
			const parsed = parseArgs(['--foo', '--no-foo'], {
				boolean: ['foo'],
				negatable: ['foo'],
			});
			assertEquals(parsed.foo, false);

			const parsed2 = parseArgs(['--foo', '--no-foo', '123'], {
				boolean: ['foo'],
				negatable: ['foo'],
			});
			assertEquals(parsed2.foo, false);
		});

		Deno.test('parseArgs() handles boolean after boolean negation', function () {
			const parsed = parseArgs(['--no-foo', '--foo'], {
				boolean: ['foo'],
				negatable: ['foo'],
			});
			assertEquals(parsed.foo, true);

			const parsed2 = parseArgs(['--no-foo', '--foo', '123'], {
				boolean: ['foo'],
				negatable: ['foo'],
			});
			assertEquals(parsed2.foo, true);
		});

		Deno.test('parseArgs() handles latest flag boolean negation', function () {
			const parsed = parseArgs(['--no-foo', '--foo', '--no-foo'], {
				boolean: ['foo'],
				negatable: ['foo'],
			});
			assertEquals(parsed.foo, false);

			const parsed2 = parseArgs(['--no-foo', '--foo', '--no-foo', '123'], {
				boolean: ['foo'],
				negatable: ['foo'],
			});
			assertEquals(parsed2.foo, false);
		});

		Deno.test('parseArgs() handles latest flag boolean', function () {
			const parsed = parseArgs(['--foo', '--no-foo', '--foo'], {
				boolean: ['foo'],
				negatable: ['foo'],
			});
			assertEquals(parsed.foo, true);

			const parsed2 = parseArgs(['--foo', '--no-foo', '--foo', '123'], {
				boolean: ['foo'],
				negatable: ['foo'],
			});
			assertEquals(parsed2.foo, true);
		});

		Deno.test('parseArgs() handles string negatable option', function () {
			const parsed = parseArgs(['--no-foo'], {
				boolean: ['foo'],
				negatable: 'foo',
			});
			assertEquals(parsed.foo, false);
		});

		Deno.test('parseArgs() handles hyphen', function () {
			assertEquals(parseArgs(['-n', '-']), {n: '-', _: []});
			assertEquals(parseArgs(['-']), {_: ['-']});
			assertEquals(parseArgs(['-f-']), {f: '-', _: []});
			assertEquals(parseArgs(['-b', '-'], {boolean: 'b'}), {b: true, _: ['-']});
			assertEquals(parseArgs(['-s', '-'], {string: 's'}), {s: '-', _: []});
		});

		Deno.test('parseArgs() handles double dash', function () {
			assertEquals(parseArgs(['-a', '--', 'b']), {a: true, _: ['b']});
			assertEquals(parseArgs(['--a', '--', 'b']), {a: true, _: ['b']});
			assertEquals(parseArgs(['--a', '--', 'b']), {a: true, _: ['b']});
		});

		Deno.test('parseArgs() moves args after double dash into own array', function () {
			assertEquals(parseArgs(['--name', 'John', 'before', '--', 'after'], {'--': true}), {
				name: 'John',
				_: ['before'],
				'--': ['after'],
			});
		});

		Deno.test('parseArgs() handles default true boolean value', function () {
			const argv = parseArgs([], {
				boolean: 'sometrue',
				default: {sometrue: true},
			});
			assertEquals(argv.sometrue, true);
		});

		Deno.test('parseArgs() handles default true boolean value', function () {
			const argv = parseArgs([], {
				boolean: 'somefalse',
				default: {somefalse: false},
			});
			assertEquals(argv.somefalse, false);
		});

		Deno.test('parseArgs() handles default null boolean value', function () {
			const argv = parseArgs([], {
				boolean: 'maybe',
				default: {maybe: null},
			});
			assertEquals(argv.maybe, null);
			const argv2 = parseArgs(['--maybe'], {
				boolean: 'maybe',
				default: {maybe: null},
			});
			assertEquals(argv2.maybe, true);
		});

		Deno.test('parseArgs() handles dotted alias', function () {
			const argv = parseArgs(['--a.b', '22'], {
				default: {'a.b': 11},
				alias: {'a.b': 'aa.bb'},
			});
			assertEquals(argv.a.b, 22);
			assertEquals(argv.aa.bb, 22);
		});

		Deno.test('parseArgs() handles dotted default value', function () {
			const argv = parseArgs([], {
				default: {'a.b': 11},
				alias: {'a.b': 'aa.bb'},
			});
			assertEquals(argv.a.b, 11);
			assertEquals(argv.aa.bb, 11);
		});

		Deno.test('parseArgs() handles dotted default with no alias', function () {
			const argv = parseArgs([], {default: {'a.b': 11}});
			assertEquals(argv.a.b, 11);
		});

		Deno.test('parseArgs() handles short', function () {
			const argv = parseArgs(['-b=123']);
			assertEquals(argv, {b: 123, _: []});
		});

		Deno.test('parseArgs() handles multi short', function () {
			const argv = parseArgs(['-a=whatever', '-b=robots']);
			assertEquals(argv, {a: 'whatever', b: 'robots', _: []});
		});

		Deno.test('parseArgs() handles long opts', function () {
			assertEquals(parseArgs(['--bool']), {bool: true, _: []});
			assertEquals(parseArgs(['--pow', 'xixxle']), {pow: 'xixxle', _: []});
			assertEquals(parseArgs(['--pow=xixxle']), {pow: 'xixxle', _: []});
			assertEquals(parseArgs(['--host', 'localhost', '--port', '555']), {
				host: 'localhost',
				port: 555,
				_: [],
			});
			assertEquals(parseArgs(['--host=localhost', '--port=555']), {
				host: 'localhost',
				port: 555,
				_: [],
			});
		});

		test('parseArgs() handles numbers', () => {
			argv = argMate(
				[
					'-x',
					'1234',
					'-y',
					'5.67',
					'-z',
					'1e7',
					'-w',
					'10f',
					'--hex',
					'0xdeadbeef',
					'789',
				],
				{
					x: {type: 'int'},
					y: {type: 'float'},
					z: {type: 'float'},
					w: {type: 'string'},
					hex: {type: 'hex'},
				},
				{
					outputAlias: false,
				}
			);

			expect(argv).toEqual({
				_: ['789'],
				x: 1234,
				y: 5.67,
				z: 1e7,
				w: '10f',
				hex: 0xdeadbeef,
			});

			expect(typeof argv.x).toEqual('number');
			expect(typeof argv.y).toEqual('number');
			expect(typeof argv.z).toEqual('number');
			expect(typeof argv.w).toEqual('string');
			expect(typeof argv.hex).toEqual('number');
			expect(typeof argv._[0]).toEqual('string');
		});

		Deno.test('parseArgs() handles already number', function () {
			const argv = parseArgs(['-x', '1234', '789']);
			assertEquals(argv, {x: 1234, _: [789]});
			assertEquals(typeof argv.x, 'number');
			assertEquals(typeof argv._[0], 'number');
		});

		Deno.test('parseArgs() parses args', function () {
			assertEquals(parseArgs(['--no-moo']), {'no-moo': true, _: []});
			assertEquals(parseArgs(['-v', 'a', '-v', 'b', '-v', 'c']), {
				v: 'c',
				_: [],
			});
		});

		Deno.test('parseArgs() handles comprehensive', function () {
			assertEquals(
				parseArgs([
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
					'-f=abc=def',
					'--foo=---=\\n--+34-=/=',
					'-e==',
					'--',
					'--not-a-flag',
					'eek',
				]),
				{
					c: true,
					a: true,
					t: true,
					e: '=',
					f: 'abc=def',
					foo: '---=\\n--+34-=/=',
					s: 'woo',
					h: 'awesome',
					b: true,
					bool: true,
					key: 'value',
					multi: 'baz',
					'no-meep': true,
					name: 'meowmers',
					_: ['bare', '--not-a-flag', 'eek'],
				}
			);
		});

		Deno.test('parseArgs() handles flag boolean', function () {
			const argv = parseArgs(['-t', 'moo'], {boolean: 't'});
			assertEquals(argv, {t: true, _: ['moo']});
			assertEquals(typeof argv.t, 'boolean');
		});

		Deno.test('parseArgs() handles flag boolean value', function () {
			const argv = parseArgs(['--verbose', 'false', 'moo', '-t', 'true'], {
				boolean: ['t', 'verbose'],
				default: {verbose: true},
			});

			assertEquals(argv, {
				verbose: false,
				t: true,
				_: ['moo'],
			});

			assertEquals(typeof argv.verbose, 'boolean');
			assertEquals(typeof argv.t, 'boolean');
		});

		Deno.test('parseArgs() handles newlines in params', function () {
			const args = parseArgs(['-s', 'X\nX']);
			assertEquals(args, {_: [], s: 'X\nX'});

			// reproduce in bash:
			// VALUE="new
			// line"
			// deno program.js --s="$VALUE"
			const args2 = parseArgs(['--s=X\nX']);
			assertEquals(args2, {_: [], s: 'X\nX'});
		});

		Deno.test('parseArgs() handles strings', function () {
			const s = parseArgs(['-s', '0001234'], {string: 's'}).s;
			assertEquals(s, '0001234');
			assertEquals(typeof s, 'string');

			const x = parseArgs(['-x', '56'], {string: 'x'}).x;
			assertEquals(x, '56');
			assertEquals(typeof x, 'string');
		});

		Deno.test('parseArgs() handles string args', function () {
			const s = parseArgs(['  ', '  '], {string: '_'})._;
			assertEquals(s.length, 2);
			assertEquals(typeof s[0], 'string');
			assertEquals(s[0], '  ');
			assertEquals(typeof s[1], 'string');
			assertEquals(s[1], '  ');
		});

		Deno.test('parseArgs() handles empty strings', function () {
			const s = parseArgs(['-s'], {string: 's'}).s;
			assertEquals(s, '');
			assertEquals(typeof s, 'string');

			const str = parseArgs(['--str'], {string: 'str'}).str;
			assertEquals(str, '');
			assertEquals(typeof str, 'string');

			const letters = parseArgs(['-art'], {
				string: ['a', 't'],
			});

			assertEquals(letters.a, '');
			assertEquals(letters.r, true);
			assertEquals(letters.t, '');
		});

		Deno.test('parseArgs() handles string and alias', function () {
			const x = parseArgs(['--str', '000123'], {
				string: 's',
				alias: {s: 'str'},
			});

			assertEquals(x.str, '000123');
			assertEquals(typeof x.str, 'string');
			assertEquals(x.s, '000123');
			assertEquals(typeof x.s, 'string');

			const y = parseArgs(['-s', '000123'], {
				string: 'str',
				alias: {str: 's'},
			});

			assertEquals(y.str, '000123');
			assertEquals(typeof y.str, 'string');
			assertEquals(y.s, '000123');
			assertEquals(typeof y.s, 'string');
		});

		Deno.test('parseArgs() handles slash break', function () {
			assertEquals(parseArgs(['-I/foo/bar/baz']), {I: '/foo/bar/baz', _: []});
			assertEquals(parseArgs(['-xyz/foo/bar/baz']), {
				x: true,
				y: true,
				z: '/foo/bar/baz',
				_: [],
			});
		});

		Deno.test('parseArgs() handles alias', function () {
			const argv = parseArgs(['-f', '11', '--zoom', '55'], {
				alias: {z: 'zoom'},
			});
			assertEquals(argv.zoom, 55);
			assertEquals(argv.z, argv.zoom);
			assertEquals(argv.f, 11);
		});

		Deno.test('parseArgs() handles multi alias', function () {
			const argv = parseArgs(['-f', '11', '--zoom', '55'], {
				alias: {z: ['zm', 'zoom']},
			});
			assertEquals(argv.zoom, 55);
			assertEquals(argv.z, argv.zoom);
			assertEquals(argv.z, argv.zm);
			assertEquals(argv.f, 11);
		});

		Deno.test('parseArgs() handles nested dotted objects', function () {
			const argv = parseArgs([
				'--foo.bar',
				'3',
				'--foo.baz',
				'4',
				'--foo.quux.quibble',
				'5',
				'--foo.quux.oO',
				'--beep.boop',
			]);

			assertEquals(argv.foo, {
				bar: 3,
				baz: 4,
				quux: {
					quibble: 5,
					oO: true,
				},
			});
			assertEquals(argv.beep, {boop: true});
		});

		Deno.test('parseArgs() handles flag builtin property', function () {
			const argv = parseArgs(['--toString', '--valueOf', 'foo']);
			assertEquals(argv, {toString: true, valueOf: 'foo', _: []});
			assertEquals(typeof argv.toString, 'boolean');
			assertEquals(typeof argv.valueOf, 'string');
		});

		Deno.test('parseArgs() handles numeric short args', function () {
			assertEquals(parseArgs(['-n123']), {n: 123, _: []});
			assertEquals(parseArgs(['-123', '456']), {1: true, 2: true, 3: 456, _: []});
		});

		Deno.test('parseArgs() handles short', function () {
			assertEquals(parseArgs(['-b']), {b: true, _: []});
			assertEquals(parseArgs(['foo', 'bar', 'baz']), {_: ['foo', 'bar', 'baz']});
			assertEquals(parseArgs(['-cats']), {
				c: true,
				a: true,
				t: true,
				s: true,
				_: [],
			});
			assertEquals(parseArgs(['-cats', 'meow']), {
				c: true,
				a: true,
				t: true,
				s: 'meow',
				_: [],
			});
			assertEquals(parseArgs(['-h', 'localhost']), {h: 'localhost', _: []});
			assertEquals(parseArgs(['-h', 'localhost', '-p', '555']), {
				h: 'localhost',
				p: 555,
				_: [],
			});
		});

		Deno.test('parseArgs() handles mixed short bool and capture', function () {
			assertEquals(parseArgs(['-h', 'localhost', '-fp', '555', 'script.js']), {
				f: true,
				p: 555,
				h: 'localhost',
				_: ['script.js'],
			});
		});

		Deno.test('parseArgs() handles short and long', function () {
			assertEquals(parseArgs(['-h', 'localhost', '-fp', '555', 'script.js']), {
				f: true,
				p: 555,
				h: 'localhost',
				_: ['script.js'],
			});
		});

		// stops parsing on the first non-option when stopEarly is set
		Deno.test('parseArgs() handles stopEarly option', function () {
			const argv = parseArgs(['--aaa', 'bbb', 'ccc', '--ddd'], {
				stopEarly: true,
			});

			assertEquals(argv, {
				aaa: 'bbb',
				_: ['ccc', '--ddd'],
			});
		});

		Deno.test('parseArgs() handles boolean and alias that are not unknown', function () {
			const unknown: unknown[] = [];
			function unknownFn(arg: string, k?: string, v?: unknown): boolean {
				unknown.push({arg, k, v});
				return false;
			}
			const aliased = ['-h', 'true', '--derp', 'true'];
			const regular = ['--herp', 'true', '-d', 'false'];
			const opts = {
				alias: {h: 'herp'},
				boolean: 'h',
				unknown: unknownFn,
			};
			parseArgs(aliased, opts);
			parseArgs(regular, opts);

			assertEquals(unknown, [
				{arg: '--derp', k: 'derp', v: 'true'},
				{arg: '-d', k: 'd', v: 'false'},
			]);
		});

		Deno.test(
			'parseArgs() handles flag boolean true any double hyphen argument is not unknown',
			function () {
				const unknown: unknown[] = [];
				function unknownFn(arg: string, k?: string, v?: unknown): boolean {
					unknown.push({arg, k, v});
					return false;
				}
				const argv = parseArgs(['--honk', '--tacos=good', 'cow', '-p', '55'], {
					boolean: true,
					unknown: unknownFn,
				});
				assertEquals(unknown, [
					{arg: '--tacos=good', k: 'tacos', v: 'good'},
					{arg: 'cow', k: undefined, v: undefined},
					{arg: '-p', k: 'p', v: '55'},
				]);
				assertEquals(argv, {
					honk: true,
					_: [],
				});
			}
		);

		Deno.test('parseArgs() handles string and alias is not unknown', function () {
			const unknown: unknown[] = [];
			function unknownFn(arg: string, k?: string, v?: unknown): boolean {
				unknown.push({arg, k, v});
				return false;
			}
			const aliased = ['-h', 'hello', '--derp', 'goodbye'];
			const regular = ['--herp', 'hello', '-d', 'moon'];
			const opts = {
				alias: {h: 'herp'},
				string: 'h',
				unknown: unknownFn,
			};
			parseArgs(aliased, opts);
			parseArgs(regular, opts);

			assertEquals(unknown, [
				{arg: '--derp', k: 'derp', v: 'goodbye'},
				{arg: '-d', k: 'd', v: 'moon'},
			]);
		});

		Deno.test('parseArgs() handles default and alias is not unknown', function () {
			const unknown: unknown[] = [];
			function unknownFn(arg: string, k?: string, v?: unknown): boolean {
				unknown.push({arg, k, v});
				return false;
			}
			const aliased = ['-h', 'hello'];
			const regular = ['--herp', 'hello'];
			const opts = {
				default: {h: 'bar'},
				alias: {h: 'herp'},
				unknown: unknownFn,
			};
			parseArgs(aliased, opts);
			parseArgs(regular, opts);

			assertEquals(unknown, []);
		});

		Deno.test('parseArgs() handles value following double hyphen', function () {
			const unknown: unknown[] = [];
			function unknownFn(arg: string, k?: string, v?: unknown): boolean {
				unknown.push({arg, k, v});
				return false;
			}
			const aliased = ['--bad', '--', 'good', 'arg'];
			const opts = {
				'--': true,
				unknown: unknownFn,
			};
			const argv = parseArgs(aliased, opts);

			assertEquals(unknown, [{arg: '--bad', k: 'bad', v: true}]);
			assertEquals(argv, {
				'--': ['good', 'arg'],
				_: [],
			});
		});

		Deno.test('parseArgs() handles whitespace', function () {
			assertEquals(parseArgs(['-x', '\t']).x, '\t');
		});

		Deno.test('parseArgs() handles collect args default behaviour', function () {
			const argv = parseArgs([
				'--foo',
				'bar',
				'--foo',
				'baz',
				'--beep',
				'boop',
				'--bool',
				'--bool',
			]);

			assertEquals(argv, {
				foo: 'baz',
				beep: 'boop',
				bool: true,
				_: [],
			});
		});

		Deno.test('parseArgs() handles collect args with default behaviour', function () {
			const argv = parseArgs([], {
				collect: ['foo'],
				default: {
					foo: ['bar', 'baz'],
				},
			});

			assertEquals(argv, {
				foo: ['bar', 'baz'],
				_: [],
			});
		});

		Deno.test('parseArgs() handles collect unknown args', function () {
			const argv = parseArgs(
				[
					'--foo',
					'bar',
					'--foo',
					'baz',
					'--beep',
					'boop',
					'--bib',
					'--bib',
					'--bab',
					'--bab',
				],
				{
					collect: ['beep', 'bib'],
				}
			);

			assertEquals(argv, {
				foo: 'baz',
				beep: ['boop'],
				bib: [true, true],
				bab: true,
				_: [],
			});
		});

		Deno.test('parseArgs() handles collect args', function () {
			const argv = parseArgs(
				[
					'--bool',
					'--bool',
					'--boolArr',
					'--str',
					'foo',
					'--strArr',
					'beep',
					'--unknown',
					'--unknownArr',
				],
				{
					boolean: ['bool', 'boolArr'],
					string: ['str', 'strArr'],
					collect: ['boolArr', 'strArr', 'unknownArr'],
					alias: {
						bool: 'b',
						strArr: 'S',
						boolArr: 'B',
					},
				}
			);

			assertEquals(argv, {
				bool: true,
				b: true,
				boolArr: [true],
				B: [true],
				str: 'foo',
				strArr: ['beep'],
				S: ['beep'],
				unknown: true,
				unknownArr: [true],
				_: [],
			});
		});

		Deno.test('parseArgs() handles collect negateable args', function () {
			const argv = parseArgs(['--foo', '123', '-f', '456', '--no-foo'], {
				string: ['foo'],
				collect: ['foo'],
				negatable: ['foo'],
				alias: {
					foo: 'f',
				},
			});

			assertEquals(argv, {
				foo: false,
				f: false,
				_: [],
			});
		});

		Deno.test('parseArgs() handles string collect option', function () {
			const argv = parseArgs(['--foo', '123', '--foo', '345'], {
				collect: 'foo',
			});

			assertEquals(argv, {
				foo: [123, 345],
				_: [],
			});
		});

		// type tests not included

		Deno.test('parseArgs() handles collect with alias', () => {
			const args = ['--header', 'abc', '--header', 'def'];
			const parsed = parseArgs(args, {
				collect: ['header'],
				alias: {
					H: 'header',
				},
			});
			assertEquals(parsed.header, ['abc', 'def']);
		});

		Deno.test('parseArgs() throws if the alias value is undefined', () => {
			assertThrows(
				() => {
					parseArgs([], {
						alias: {
							h: undefined,
						},
					});
				},
				Error,
				'Alias value must be defined'
			);
		});
	});
}
