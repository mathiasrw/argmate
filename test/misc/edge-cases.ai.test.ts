// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../../src/argMate';
import argMateMini from '../../src/argMateMini';
import type {ArgMateEngine} from '../../src/types.js';

run(argMate);
run(argMateMini, ' Mini');

let argv;

function run(argMate: ArgMateEngine, engineType = '') {
	describe('Edge cases' + engineType, () => {
		describe('4o' + engineType, () => {
			test('Empty input', () => {
				expect(argMate([])).toEqual({_: []});
			});

			test('Empty input with config object', () => {
				expect(argMate([], {verbose: {type: 'boolean'}})).toEqual({_: []});
			});

			test('Empty input with default values', () => {
				expect(argMate([], {verbose: false})).toEqual({verbose: false, _: []});
			});

			test('Empty input with mandatory parameter', () => {
				expect(() => {
					argMate([], {verbose: {mandatory: true}});
				}).toThrow(/verbose.*is mandatory/i);
			});

			///### **Extremely Long Arguments**

			test('Extremely long single flag', () => {
				const longFlag = '--' + 'v'.repeat(1000);
				expect(argMate([longFlag])).toEqual({[longFlag.slice(2)]: true, _: []});
			});

			test('Extremely long value for flag', () => {
				const longValue = 'a'.repeat(10000);
				expect(argMate(['--file=', longValue])).toEqual({file: longValue, _: []});
			});

			test('Extremely long argument with separator', () => {
				const longValue = 'x'.repeat(5000);
				expect(argMate(['--key=' + longValue])).toEqual({key: longValue, _: []});
			});

			test('Extremely long positional argument', () => {
				const longArg = 'arg'.repeat(3000);
				expect(argMate([longArg])).toEqual({_: [longArg]});
			});

			test('Extremely long flag with number value', () => {
				const longNum = '9'.repeat(999) + 'x'; // Invalid number with non-numeric character
				expect(() => {
					argMate(['--timeout', longNum], {timeout: 0});
				}).toThrow(/not a valid number/i);
			});

			/// ### **Repeated Arguments**

			test('Repeated boolean flag', () => {
				expect(argMate(['--verbose', '--verbose'])).toEqual({verbose: true, _: []});
			});

			test('Repeated flag with different values', () => {
				expect(argMate(['--level=1', '--level=2'], {level: 0})).toEqual({level: 2, _: []});
			});

			test('Repeated flag with array type', () => {
				expect(argMate(['--port=8080', '--port=9090'], {port: {type: 'int[]'}})).toEqual({
					port: [8080, 9090],
					_: [],
				});
			});

			test('Repeated flag with array and separator', () => {
				expect(
					argMate(['--include=file1.js', '--include=file2.js'], {
						include: {type: 'string[]'},
					})
				).toEqual({include: ['file1.js', 'file2.js'], _: []});
			});

			test('Repeated positional arguments', () => {
				expect(argMate(['file1.txt', 'file1.txt'])).toEqual({
					_: ['file1.txt', 'file1.txt'],
				});
			});

			///### **Conflicting Options**

			test.todo('Conflicting boolean flags', () => {
				expect(() =>
					argMate(['--enable', '--disable'], {
						enable: {type: 'boolean'},
						disable: {conflict: 'enable'},
					})
				).toThrow();
			});

			test.todo('Conflicting flags with one having alias', () => {
				expect(() =>
					argMate(['--fast', '-s'], {
						fast: 'boolean',
						safe: {alias: 's', conflict: 'fast'},
					})
				).toThrow();
			});

			test('Conflicting flags with values', () => {
				expect(() =>
					argMate(['--mode=fast', '--mode=safe'], {mode: {conflict: 'safe'}})
				).toThrow();
			});

			test.todo('Conflicting flags with alias and separate assignment', () => {
				expect(() =>
					argMate(['--dark-mode', '--dm'], {
						darkMode: {alias: 'dm'},
						lightMode: {conflict: 'darkMode'},
					})
				).toThrow();
			});

			test.todo('Conflicting flags with negated option', () => {
				expect(() =>
					argMate(['--no-cache', '--cache'], {cache: {type: 'boolean'}})
				).toThrow();
			});

			/// ### **More Edge Cases**

			test('Empty string as input', () => {
				expect(argMate([''])).toEqual({_: ['']});
			});

			test('Whitespace only input', () => {
				expect(argMate([' '])).toEqual({_: [' ']});
			});

			test.todo('Newline character in argument', () => {
				expect(argMate(['--message=\nHello'])).toEqual({message: '\nHello', _: []});
			});

			test('Tab character in argument', () => {
				expect(argMate(['--path=\t/home'])).toEqual({path: '\t/home', _: []});
			});

			test('Argument with special characters', () => {
				expect(argMate(['--key=!@#$%^&*()'])).toEqual({key: '!@#$%^&*()', _: []});
			});

			test('Multiple repeated arguments in array type', () => {
				expect(argMate(['--id=1', '--id=2', '--id=3'], {id: {type: 'int[]'}})).toEqual({
					id: [1, 2, 3],
					_: [],
				});
			});

			test.todo('Conflicting array-type arguments', () => {
				expect(() =>
					argMate(['--id=1', '--id=2', '--no-id'], {
						id: {type: 'int[]', conflict: 'no-id'},
					})
				).toThrow();
			});

			test('Extremely long repeated flag with array type', () => {
				const longValue1 = 'a'.repeat(5000);
				const longValue2 = 'b'.repeat(5000);
				expect(
					argMate(['--data=' + longValue1, '--data=' + longValue2], {
						data: {type: 'string[]'},
					})
				).toEqual({data: [longValue1, longValue2], _: []});
			});

			test('Repeated boolean flag with alias', () => {
				expect(argMate(['--enable', '-e'], {enable: {alias: 'e'}})).toEqual({
					enable: true,
					_: [],
				});
			});

			test('Repeated flag with different aliases', () => {
				expect(argMate(['-x', '-y'], {x: {alias: ['y']}})).toEqual({x: true, _: []});
			});

			test.todo('Conflicting flags with repeated arguments', () => {
				expect(() =>
					argMate(['--foo', '--bar', '--foo'], {foo: {conflict: 'bar'}, bar: {}})
				).toThrow();
			});

			test.todo('Conflicting flags with repeated and negated arguments', () => {
				expect(() =>
					argMate(['--foo', '--no-foo', '--bar'], {foo: {conflict: 'bar'}, bar: {}})
				).toThrow();
			});

			test('Repeated positional arguments with varying lengths', () => {
				expect(argMate(['short', 'longer', 'evenlongertext'])).toEqual({
					_: ['short', 'longer', 'evenlongertext'],
				});
			});

			test.todo('Repeated flags with different casing', () => {
				expect(
					argMate(['--CaseSensitive', '--casesensitive'], {
						CaseSensitive: {type: 'boolean'},
					})
				).toEqual({CaseSensitive: true, _: []});
			});

			test.todo('Empty string as flag value', () => {
				expect(argMate(['--name='])).toEqual({name: '', _: []});
			});

			test('Whitespace string as flag value', () => {
				expect(argMate(['--name= '])).toEqual({name: ' ', _: []});
			});

			test.todo('Multiple conflicting flags with separator', () => {
				expect(() =>
					argMate(['--on', '--off'], {on: {conflict: 'off'}, off: {}})
				).toThrow();
			});

			test('Conflicting boolean flags with separated assignment', () => {
				expect(() =>
					argMate(['--enable=', 'true', '--disable'], {
						enable: {conflict: 'disable'},
						disable: {},
					})
				).toThrow();
			});

			test('Long argument with spaces in value', () => {
				const longValue =
					'This is a very long string containing multiple spaces and special characters like @#$%';
				expect(argMate(['--description=', longValue])).toEqual({
					description: longValue,
					_: [],
				});
			});

			test('Repeated flags with both short and long assignments', () => {
				expect(
					argMate(['--path=/usr/local/bin', '--path=', '/opt/bin'], {
						path: {type: 'string[]'},
					})
				).toEqual({path: ['/usr/local/bin', '/opt/bin'], _: []});
			});

			test.todo('Repeated conflicting flags with alias', () => {
				expect(() =>
					argMate(['-f', '--fast', '--safe'], {
						fast: {alias: 'f', conflict: 'safe'},
						safe: {},
					})
				).toThrow();
			});

			test('Conflicting flags with values and alias', () => {
				expect(() =>
					argMate(['--mode=fast', '--mode=safe'], {mode: {alias: 'm', conflict: 'safe'}})
				).toThrow();
			});

			test('Repeated conflicting flags with array type', () => {
				expect(() =>
					argMate(['--id=1', '--id=2', '--no-id=3'], {
						id: {type: 'int[]', conflict: 'no-id'},
						'no-id': {},
					})
				).toThrow();
			});

			test('Extremely long input with multiple arguments', () => {
				const longArg1 = 'arg'.repeat(3000);
				const longArg2 = 'anotherarg'.repeat(2000);
				expect(argMate([longArg1, '--flag', longArg2])).toEqual({
					flag: true,
					_: [longArg1, longArg2],
				});
			});

			test('Whitespace-only argument between flags', () => {
				expect(argMate(['--enable', ' ', '--disable'])).toEqual({
					enable: true,
					disable: true,
					_: [' '],
				});
			});

			test('Newline character in flag value', () => {
				expect(argMate(['--message=Hello\nWorld'])).toEqual({
					message: 'Hello\nWorld',
					_: [],
				});
			});

			test('Tab character in flag value', () => {
				expect(argMate(['--path=/usr/\tlocal/bin'])).toEqual({
					path: '/usr/\tlocal/bin',
					_: [],
				});
			});
		});
		describe('Sonnet 3.5' + engineType, () => {
			// Empty input
			test('Empty input', () => {
				expect(argMate([], {})).toEqual({_: []});
			});

			test('Only whitespace input', () => {
				expect(argMate(['   '], {})).toEqual({_: ['   ']});
			});

			test('Empty string argument', () => {
				expect(argMate(['--empty', ''], {empty: 'default'})).toEqual({_: [], empty: ''});
			});

			test.todo('Empty array argument', () => {
				expect(argMate(['--array'], {array: {type: 'string[]'}})).toEqual({
					_: [],
					array: [],
				});
			});

			// Extremely long arguments
			test('Extremely long flag name', () => {
				const longFlag = 'a'.repeat(1000);
				expect(argMate([`--${longFlag}`], {})).toEqual({_: [], [longFlag]: true});
			});

			test.todo('Extremely long value', () => {
				const longValue = 'a'.repeat(1000000);
				expect(argMate(['--long', longValue], {long: ''})).toEqual({
					_: [],
					long: longValue,
				});
			});

			test('Extremely long positional argument', () => {
				const longArg = 'a'.repeat(1000000);
				expect(argMate([longArg], {})).toEqual({_: [longArg]});
			});

			test('Many short flags', () => {
				const manyFlags = '-' + 'a'.repeat(1000);
				expect(argMate([manyFlags], {})).toEqual({
					_: [],
					...Object.fromEntries(
						'a'
							.repeat(1000)
							.split('')
							.map(c => [c, true])
					),
				});
			});

			// Repeated arguments
			test('Repeated boolean flag', () => {
				expect(argMate(['--flag', '--flag', '--flag'], {})).toEqual({_: [], flag: true});
			});

			test('Repeated value flag', () => {
				expect(
					argMate(['--value', '1', '--value', '2', '--value', '3'], {
						value: {type: 'string'},
					})
				).toEqual({_: [], value: '3'});
			});

			test('Repeated array flag', () => {
				expect(
					argMate(['--array', '1', '--array', '2', '--array', '3'], {
						array: {type: 'string[]'},
					})
				).toEqual({_: [], array: ['1', '2', '3']});
			});

			test('Many positional arguments', () => {
				expect(argMate(['pos', 'pos', 'pos'], {})).toEqual({_: ['pos', 'pos', 'pos']});
			});

			// Conflicting options
			test.todo('Conflicting boolean flags', () => {
				expect(() =>
					argMate(['--on', '--off'], {
						on: {conflict: 'off'},
						off: {conflict: 'on'},
					})
				).toThrow();
			});

			test.todo('Conflicting value flags', () => {
				expect(() =>
					argMate(['--min', '0', '--max', '100'], {
						min: {type: 'number', conflict: 'max'},
						max: {type: 'number', conflict: 'min'},
					})
				).toThrow();
			});

			test.todo('Self-conflicting flag', () => {
				expect(() =>
					argMate(['--paradox'], {
						paradox: {conflict: 'paradox'},
					})
				).toThrow();
			});

			test.todo('Multiple conflicts', () => {
				expect(() =>
					argMate(['--a', '--b', '--c'], {
						a: {conflict: ['b', 'c']},
						b: {conflict: ['a', 'c']},
						c: {conflict: ['a', 'b']},
					})
				).toThrow();
			});

			// Mixed edge cases
			test.todo('Long flag name with equals and empty value', () => {
				const longFlag = 'a'.repeat(1000);
				expect(argMate([`--${longFlag}=`], {[longFlag]: ''})).toEqual({
					_: [],
					[longFlag]: '',
				});
			});

			test.todo('Conflicting flags', () => {
				expect(() =>
					argMate(['--a', '--b', '--a', '--b'], {
						a: {conflict: 'b'},
						b: {conflict: 'a'},
					})
				).toThrow();
			});

			test.todo('Very long array with repeated values', () => {
				const args = ['--array', ...Array(10000).fill('value')];
				expect(argMate(args, {array: {type: 'string[]'}})).toEqual({
					_: [],
					array: Array(10000).fill('value'),
				});
			});

			test('Mixture of valid and invalid enum values', () => {
				expect(() =>
					argMate(['--color', 'red', '--color', 'green', '--color', 'invalid'], {
						color: {type: 'string[]', valid: ['red', 'green', 'blue']},
					})
				).toThrow();
			});

			test('Extremely nested default value', () => {
				const nestedDefault = {a: {b: {c: {d: {e: 'deep'}}}}};
				expect(argMate([], {nested: {default: nestedDefault}})).toEqual({
					_: [],
					nested: nestedDefault,
				});
			});

			test('Flag with extremely long alias', () => {
				const longAlias = 'a'.repeat(1000);
				expect(argMate([`--${longAlias}`], {short: {alias: longAlias}})).toEqual({
					_: [],
					short: true,
				});
			});

			test.todo('Extremely long negated boolean flag', () => {
				const longFlag = 'a'.repeat(1000);
				expect(argMate([`--no-${longFlag}`], {[longFlag]: true})).toEqual({
					_: [],
					[longFlag]: false,
				});
			});

			test.todo('Conflicting flags with extremely long names', () => {
				const longFlag1 = 'a'.repeat(1000);
				const longFlag2 = 'b'.repeat(1000);
				expect(() =>
					argMate([`--${longFlag1}`, `--${longFlag2}`], {
						[longFlag1]: {conflict: longFlag2},
						[longFlag2]: {conflict: longFlag1},
					})
				).toThrow();
			});

			test.todo('Extremely long key-value pair', () => {
				const longKey = 'k'.repeat(1000);
				const longValue = 'v'.repeat(1000000);
				expect(argMate([`--${longKey}=${longValue}`], {[longKey]: ''})).toEqual({
					_: [],
					[longKey]: longValue,
				});
			});

			test.todo('Many conflicts in config', () => {
				const config = {};
				for (let i = 0; i < 1000; i++) {
					config[`flag${i}`] = {conflict: `flag${(i + 1) % 1000}`};
				}
				expect(() => argMate(['--flag0', '--flag1'], config)).toThrow();
			});

			test.todo('Mixing extremely long flags and short flags', () => {
				const longFlag = 'a'.repeat(1000);
				expect(argMate([`--${longFlag}`, '-s'], {})).toEqual({
					_: [],
					[longFlag]: true,
					s: true,
				});
			});

			test.todo('Repeated extremely long flag with different casing', () => {
				const longFlag = 'a'.repeat(500) + 'A'.repeat(500);
				expect(
					argMate([`--${longFlag}`, `--${longFlag.toLowerCase()}`], {
						caseSensitive: false,
					})
				).toEqual({_: [], [longFlag.toLowerCase()]: true});
			});

			test.todo('Extremely long value with special characters', () => {
				const longValue = ('a'.repeat(1000) + '!@#$%^&*()').repeat(100);
				expect(argMate(['--special', longValue], {special: ''})).toEqual({
					_: [],
					special: longValue,
				});
			});

			test.todo('Many repeated short flags', () => {
				const args = '-a '.repeat(1000).split(' ');
				expect(argMate(args, {})).toEqual({_: [], a: true});
			});

			test.todo('Extremely long argument with internal spaces', () => {
				const longArg = 'a'.repeat(1000) + ' '.repeat(100) + 'b'.repeat(1000);
				expect(argMate(['--long', longArg], {long: ''})).toEqual({_: [], long: longArg});
			});

			test.todo('Extremely long argument with quotes', () => {
				const longArg = '"' + 'a'.repeat(1000000) + '"';
				expect(argMate(['--quoted', longArg], {quoted: ''})).toEqual({
					_: [],
					quoted: 'a'.repeat(1000000),
				});
			});

			test('Mixing extremely long positional and named arguments', () => {
				const longPositional = 'p'.repeat(1000000);
				const longNamed = 'n'.repeat(1000000);
				expect(argMate([longPositional, '--named', longNamed], {named: ''})).toEqual({
					_: [longPositional],
					named: longNamed,
				});
			});

			test('Extremely long hexadecimal value', () => {
				const longHex = '0x' + 'f'.repeat(1000000);
				expect(argMate(['--hex', longHex], {hex: {type: 'string'}})).toEqual({
					_: [],
					hex: longHex,
				});
			});

			test.todo('Extremely deep array nesting', () => {
				const deepArray = JSON.stringify(Array(1000).fill('nested'));
				expect(argMate(['--deep', deepArray], {deep: {type: 'json'}})).toEqual({
					_: [],
					deep: Array(1000).fill('nested'),
				});
			});

			test('Extremely long default help text', () => {
				const longHelp = 'h'.repeat(1000000);
				expect(argMate(['--help'], {help: {description: longHelp}})).toEqual({
					_: [],
					help: true,
				});
			});

			test.todo('Extremely long regex pattern for validation', () => {
				const longRegex = '^a' + '?'.repeat(1000000) + '$';
				expect(
					argMate(['--pattern', 'a'], {
						pattern: {
							type: 'string',
							valid: (v: string) => new RegExp(longRegex).test(v),
						},
					})
				).toEqual({_: [], pattern: 'a'});
			});

			test.todo('Extremely long camelCase conversion', () => {
				const longKebab = 'a-'.repeat(1000) + 'z';
				const longCamel = 'a'.repeat(1000) + 'Z';
				expect(argMate([`--${longKebab}`, 'value'], {[longCamel]: ''})).toEqual({
					_: [],
					[longCamel]: 'value',
				});
			});
		});
	});
}
