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

		test('parseArgs() handles boolean and alias with options hash', () => {
			const opts = {
				herp: {type: 'boolean', alias: 'h'},
			};
			const aliasedArgv = argMate(['-h', 'derp'], opts, {outputAlias: true});
			const propertyArgv = argMate(['--herp', 'derp'], opts, {outputAlias: true});

			const expected = {
				herp: true,
				h: true,
				_: ['derp'],
			};
			expect(aliasedArgv).toEqual(expected);
			expect(propertyArgv).toEqual(expected);
		});

		test.todo('parseArgs() handles boolean and alias array with options hash', () => {
			const opts = {
				herp: {type: 'boolean', alias: ['h', 'harp']},
			};
			const expected = {
				harp: true,
				herp: true,
				h: true,
				_: ['derp'],
			};
			expect(argMate(['--harp', 'derp'], opts, {outputAlias: true})).toEqual(expected);

			expect(argMate(['-h', 'derp'], opts, {outputAlias: true})).toEqual(expected);

			expect(argMate(['--herp', 'derp'], opts, {outputAlias: true})).toEqual(expected);
		});

		/* we dont support magic strings
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

		*/

		// regression, see https://github.com/substack/node-optimist/issues/71
		// boolean and --x=true
		test('parseArgs() handles boolean and non-boolean', () => {
			const opts = {
				boool: {type: 'boolean'},
			};

			const parsed = argMate(['--boool', '--other=true'], opts);
			expect(parsed.boool).toEqual(true);
			expect(parsed.other).toEqual('true');

			const parsed2 = argMate(['--boool', '--other=false'], opts);
			expect(parsed2.boool).toEqual(true);
			expect(parsed2.other).toEqual('false');
		});

		// Modified from the original as we dont want to convert string "true" to a boolean
		test('parseArgs() handles boolean true parsing', () => {
			let argv = argMate('--boool=true'.split(' '));
			expect(argv).toEqual({
				_: [],
				boool: 'true',
			});
		});

		/*
		// If you ask for abool you will get an error when trying to assign
		Deno.test('parseArgs() handles boolean false parsing', function () {
			const parsed = parseArgs(['--boool=false'], {
				default: {
					boool: true,
				},
				boolean: ['boool'],
			});

			assertEquals(parsed.boool, false);
		});
		*/

		/* unsupported 
		Deno.test('parseArgs() handles boolean true-like parsing', function () {
			const parsed = parseArgs(['-t', 'true123'], {boolean: ['t']});
			assertEquals(parsed.t, true);

			const parsed2 = parseArgs(['-t', '123'], {boolean: ['t']});
			assertEquals(parsed2.t, true);

			const parsed3 = parseArgs(['-t', 'false123'], {boolean: ['t']});
			assertEquals(parsed3.t, true);
		});
		*/

		test('parseArgs() handles boolean after boolean negation', () => {
			argv = argMate(['--foo', '--no-foo'], {
				foo: false,
			});

			expect(argv.foo).toEqual(false);

			argv = argMate(['--foo', '--no-foo', '123'], {
				foo: false,
			});

			expect(argv.foo).toEqual(false);
			expect(argv._).toEqual(['123']);
		});

		test('parseArgs() handles boolean after boolean negation', () => {
			// Test for `--no-foo` followed by `--foo`
			argv = argMate(['--no-foo', '--foo'], {
				foo: false, // default value
			});

			expect(argv.foo).toEqual(true);

			// Test for `--no-foo`, `--foo`, and an additional argument `123`
			argv = argMate(['--no-foo', '--foo', '123'], {
				foo: false, // default value
			});

			expect(argv.foo).toEqual(true);
			expect(argv._).toEqual(['123']);
		});

		test('parseArgs() handles latest flag boolean negation', () => {
			// Test for the case with `--no-foo`, `--foo`, and `--no-foo`
			argv = argMate(['--no-foo', '--foo', '--no-foo'], {
				foo: false,
			});

			expect(argv.foo).toEqual(false);

			// Test for the case with `--no-foo`, `--foo`, `--no-foo`, and an additional argument `123`
			argv = argMate(['--no-foo', '--foo', '--no-foo', '123'], {
				foo: false,
			});

			expect(argv.foo).toEqual(false);
			expect(argv._).toEqual(['123']);
		});

		test('parseArgs() handles latest flag boolean', () => {
			// Test for the case with `--foo`, `--no-foo`, and `--foo`
			argv = argMate(['--foo', '--no-foo', '--foo'], {
				foo: false,
			});

			expect(argv.foo).toEqual(true);

			// Test for the case with `--foo`, `--no-foo`, `--foo`, and an additional argument `123`
			argv = argMate(['--foo', '--no-foo', '--foo', '123'], {
				foo: false,
			});

			expect(argv.foo).toEqual(true);
			expect(argv._).toEqual(['123']);
		});

		test('parseArgs() handles string negatable option', () => {
			argv = argMate(['--no-foo'], {
				foo: false,
			});

			expect(argv.foo).toEqual(false);
		});

		test.todo('parseArgs() handles hyphen', () => {
			expect(argMate(['-n', '-'], {n: ''})).toEqual({n: '-', _: []});
			//expect(argMate(['-'], {})).toEqual({_: ['-']});
			//expect(argMate(['-f-', ''], {f: ''})).toEqual({f: '-', _: []});
			//expect(argMate(['-b', '-'], {b: false})).toEqual({b: true, _: ['-']});
			expect(argMate(['-s', '-'], {s: ''})).toEqual({s: '-', _: []});
		});

		test('parseArgs() handles double dash', () => {
			expect(argMate(['-a', '--', 'b'])).toEqual({a: true, _: ['b']});
			expect(argMate(['--a', '--', 'b'])).toEqual({a: true, _: ['b']});
			expect(argMate(['--a', '--', 'b'])).toEqual({a: true, _: ['b']});
		});

		/* 
		// If you want to do stupid things, then use another lib. 
		// no - we dont want to support naming a parameter "--"
		Deno.test('parseArgs() moves args after double dash into own array', function () {
			assertEquals(parseArgs(['--name', 'John', 'before', '--', 'after'], {'--': true}), {
				name: 'John',
				_: ['before'],
				'--': ['after'],
			});
		});
		*/

		test('parseArgs() handles default true boolean value', () => {
			argv = argMate([], {
				sometrue: true,
			});

			expect(argv.sometrue).toEqual(true);
		});

		test('parseArgs() handles default true boolean value', () => {
			argv = argMate([], {
				somefalse: false,
			});

			expect(argv.somefalse).toEqual(false);
		});

		test('parseArgs() handles default null boolean value', () => {
			// Test for the case with no arguments
			argv = argMate([], {
				maybe: null,
			});

			expect(argv.maybe).toEqual(null);

			// Test for the case with `--maybe`
			argv = argMate(['--maybe'], {
				maybe: false,
			});

			expect(argv.maybe).toEqual(true);
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

		test('parseArgs() handles short', () => {
			const argv = argMate(['-b=123']);
			expect(argv).toEqual({b: 123, _: []});
		});

		test('parseArgs() handles multi short', () => {
			const argv = argMate(['-a=whatever', '-b=robots']);
			expect(argv).toEqual({
				_: [],
				a: 'whatever',
				b: 'robots',
			});
		});

		test('parseArgs() handles long opts', () => {
			expect(
				argMate(['--bool'], {
					bool: false,
				})
			).toEqual({bool: true, _: []});

			expect(
				argMate(['--pow', 'xixxle'], {
					pow: '',
				})
			).toEqual({pow: 'xixxle', _: []});

			expect(
				argMate(['--pow=xixxle'], {
					pow: '',
				})
			).toEqual({pow: 'xixxle', _: []});

			expect(
				argMate(['--host', 'localhost', '--port', '555'], {
					host: '',
					port: 0,
				})
			).toEqual({
				host: 'localhost',
				port: 555,
				_: [],
			});

			expect(argMate(['--host=', 'localhost', '--port=', '555'], {})).toEqual({
				host: 'localhost',
				port: 555,
				_: [],
			});

			expect(argMate(['--host=localhost', '--port=55.5'], {})).toEqual({
				host: 'localhost',
				port: 55.5,
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

		// edited as we dont convert input strings automagicly
		test('parseArgs() handles already number', () => {
			const argv = argMate(['-x=', '1234', '789']);
			expect(argv).toEqual({x: 1234, _: ['789']});
			expect(typeof argv.x).toBe('number');
			expect(typeof argv._[0]).toBe('string');
		});

		test('parseArgs() parses args', () => {
			expect(
				argMate(['--no-moo'], {}, {allowNegatingFlags: false, autoCamelKebabCase: false})
			).toEqual({
				'no-moo': true,
				_: [],
			});
			expect(argMate(['-v', 'a', '-v', 'b', '-v', 'c'], {v: ''})).toEqual({
				v: 'c',
				_: [],
			});
		});

		test('parseArgs() handles comprehensive', () => {
			expect(
				argMate(
					[
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
					],
					{
						name: '',
						multi: '',
						key: '',
						foo: '',
						f: '',
						e: '',
						s: '',
						h: '',
					},
					{allowNegatingFlags: false, autoCamelKebabCase: false}
				)
			).toEqual({
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
			});
		});

		test('parseArgs() handles flag boolean', () => {
			const argv = argMate(['-t', 'moo'], {t: {type: 'boolean'}});
			expect(argv).toEqual({t: true, _: ['moo']});
			expect(typeof argv.t).toBe('boolean');
		});

		/* we dont support boolean magic values 

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
		*/

		test('parseArgs() handles newlines in params', () => {
			const args = argMate(['-s', 'X\nX'], {s: ''});
			expect(args).toEqual({_: [], s: 'X\nX'});

			const args2 = argMate(['-s=', 'X\nX']); // changed from originally ['--s=X\nX']
			expect(args2).toEqual({_: [], s: 'X\nX'});
		});

		test('parseArgs() handles strings', () => {
			const s = argMate(['-s', '0001234'], {s: ''}).s;
			expect(s).toBe('0001234');
			expect(typeof s).toBe('string');

			const x = argMate(['-x', '56'], {x: ''}).x;
			expect(x).toBe('56');
			expect(typeof x).toBe('string');
		});

		test('parseArgs() handles string args', () => {
			const s = argMate(['  ', '  '])._;
			expect(s.length).toBe(2);
			expect(typeof s[0]).toBe('string');
			expect(s[0]).toBe('  ');
			expect(typeof s[1]).toBe('string');
			expect(s[1]).toBe('  ');
		});

		// I dont agree with this. If something is to be a string and its provided it needs to be assigned
		test('parseArgs() handles empty strings', () => {
			const s = argMate(
				[
					/*'-s'*/
				],
				{s: ''}
			).s;
			expect(s).toEqual('');
			expect(typeof s).toBe('string');

			const str = argMate(
				[
					/*'--str'*/
				],
				{str: ''}
			).str;
			expect(str).toEqual('');
			expect(typeof str).toBe('string');

			const letters = argMate([/*'-art'*/ '-r'], {a: '', t: ''});
			expect(letters.a).toEqual('');
			expect(letters.r).toEqual(true);
			expect(letters.t).toEqual('');
		});

		test.todo('parseArgs() handles string and alias A', () => {
			const opts1 = {
				str: {type: 'string', alias: 's'},
			};
			let x = argMate(['--str', '000123'], opts1);
			expect(x.str).toEqual('000123');
			expect(typeof x.str).toBe('string');
			expect(x.s).toEqual('000123');
			expect(typeof x.s).toBe('string');

			x = argMate(['-s', '000123'], opts1);
			expect(x.str).toEqual('000123');
			expect(typeof x.str).toBe('string');
			expect(x.s).toEqual('000123');
			expect(typeof x.s).toBe('string');
		});

		test.todo('parseArgs() handles string and alias B', () => {
			const opts2 = {
				s: {type: 'string', alias: 'str'},
			};
			let y = argMate(['-s', '000123'], opts2);
			expect(y.str).toEqual('000123');
			expect(typeof y.str).toBe('string');
			expect(y.s).toEqual('000123');
			expect(typeof y.s).toBe('string');

			y = argMate(['--str', '000123'], opts2);
			expect(y.str).toEqual('000123');
			expect(typeof y.str).toBe('string');
			expect(y.s).toEqual('000123');
			expect(typeof y.s).toBe('string');
		});

		test.todo('parseArgs() handles slash break A', () => {
			expect(argMate(['-I/foo/bar/baz'])).toEqual({I: '/foo/bar/baz', _: []});
			expect(argMate(['-xyz/foo/bar/baz'], {x: true, y: true, z: ''})).toEqual({
				x: true,
				y: true,
				z: '/foo/bar/baz',
				_: [],
			});
		});

		test.todo('parseArgs() handles slash break B', () => {
			expect(argMate(['-I=/foo/bar/baz'])).toEqual({I: '/foo/bar/baz', _: []});
			expect(argMate(['-xyz=/foo/bar/baz'], {x: true, y: true, z: ''})).toEqual({
				x: true,
				y: true,
				z: '/foo/bar/baz',
				_: [],
			});
		});

		test.todo('parseArgs() handles slash break C', () => {
			expect(argMate(['-I=/foo/bar/baz'])).toEqual({I: '/foo/bar/baz', _: []});
			expect(argMate(['-xyz=/foo/bar/baz'])).toEqual({
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
