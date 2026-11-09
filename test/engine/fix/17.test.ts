// #17: `outputAlias` crashes when there is an unknown parameter
// With `outputAlias: true` the engine read `config[key].alias` for each key in the result. An unknown
// parameter has no config entry, so the parse threw a TypeError. The mini engine has no `outputAlias`.
import {describe, expect, test} from 'bun:test';
import {argMate, argMateMini} from '../../helper.ts';

const config = () => ({file: {type: 'string', alias: 'f'}});
const settings = {outputAlias: true};

describe('#17 outputAlias with an unknown parameter', () => {
	test('an unknown parameter stays in the result with its own name', () => {
		expect(argMate(['--bogus'], config(), settings)).toEqual({_: [], bogus: true});
	});

	test('an unknown parameter and a known parameter that has an alias', () => {
		expect(argMate(['--bogus', '--file', 'a.sql'], config(), settings)).toEqual({
			_: [],
			bogus: true,
			file: 'a.sql',
			f: 'a.sql',
		});
	});

	test('an unknown parameter and the alias of a known parameter', () => {
		expect(argMate(['-f', 'a.sql', '--bogus'], config(), settings)).toEqual({
			_: [],
			bogus: true,
			file: 'a.sql',
			f: 'a.sql',
		});
	});

	test('an unknown parameter with an assigned number', () => {
		expect(argMate(['--bogus=5'], config(), settings)).toEqual({_: [], bogus: 5});
	});

	test('an unknown parameter with an assigned string', () => {
		expect(argMate(['--bogus=abc'], config(), settings)).toEqual({_: [], bogus: 'abc'});
	});

	test('an unknown parameter with the value in the next argument', () => {
		expect(argMate(['--bogus=', 'abc'], config(), settings)).toEqual({_: ['abc'], bogus: ''});
	});

	test('an unknown parameter that is negated', () => {
		expect(argMate(['--no-bogus'], config(), settings)).toEqual({_: [], bogus: false});
	});

	test('an unknown parameter in kebab-case gets its camelCase name', () => {
		expect(argMate(['--foo-bar'], config(), settings)).toEqual({_: [], fooBar: true});
	});

	test('unknown parameters in a group of short flags', () => {
		expect(argMate(['-xy'], config(), settings)).toEqual({_: [], x: true, y: true});
	});

	test('an unknown parameter when the config is empty', () => {
		expect(argMate(['--bogus'], {}, settings)).toEqual({_: [], bogus: true});
	});

	test('an unknown parameter when there is no config', () => {
		expect(argMate(['--bogus'], undefined, settings)).toEqual({_: [], bogus: true});
	});

	test('a known parameter gets its alias in the result', () => {
		expect(argMate(['--file', 'a.sql'], config(), settings)).toEqual({
			_: [],
			file: 'a.sql',
			f: 'a.sql',
		});
	});

	test('a known parameter gets each alias of a list in the result', () => {
		const config = {file: {type: 'string', alias: ['f', 'input']}};
		expect(argMate(['-f', 'a.sql'], config, settings)).toEqual({
			_: [],
			file: 'a.sql',
			f: 'a.sql',
			input: 'a.sql',
		});
	});

	test('a known parameter that has no alias stays in the result with its own name', () => {
		const config = {verbose: {type: 'boolean'}};
		expect(argMate(['--verbose'], config, settings)).toEqual({_: [], verbose: true});
	});

	test('a value that is not a parameter does not cause a crash', () => {
		expect(argMate(['a.sql'], config(), settings)).toEqual({_: ['a.sql']});
	});

	test('an unknown parameter is in the result when outputAlias is off', () => {
		expect(argMate(['--bogus'], config(), {outputAlias: false})).toEqual({_: [], bogus: true});
	});

	test('the mini engine does not crash', () => {
		expect(argMateMini(['--bogus'], config(), settings)).toEqual({_: [], bogus: true});
	});
});
