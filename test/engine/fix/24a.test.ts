// #24a: `conflict` must work on the parent parameter
// A name in a `conflict` list worked only if it was the name of a parameter. An alias in the list was ignored.
import {describe, expect, test} from 'bun:test';
import {argMate, configPreprocessing} from '../../helper.ts';

// Gives the result of the parse. When ArgMate calls `error` (input error) or `panic` (config error),
// gives the name of that callback and its message. A conflict gives the config names of the two parameters.
function parse(args, config, settings = {}) {
	try {
		return argMate(args, config, {
			...settings,
			error: ({code, key, with: other, message}) => {
				throw 'CONFLICT' === code ? {conflict: [key, other]} : {error: message};
			},
			panic: msg => {
				throw {panic: msg};
			},
		});
	} catch (thrown) {
		if (thrown instanceof Error) throw thrown;
		return thrown;
	}
}

// The example of the issue: the list has the alias `T` of the parameter `trimPipe`
const aliasInList = () => ({voidPipe: {alias: 'P', conflict: ['T']}, trimPipe: {alias: 'T'}});
const nameInList = () => ({voidPipe: {alias: 'P', conflict: ['trimPipe']}, trimPipe: {alias: 'T'}});

// The error has the names of the parent parameters in `key` and `with`. The message has the names as typed.
const voidConflictsWithTrim = {conflict: ['voidPipe', 'trimPipe']};
const trimConflictsWithVoid = {conflict: ['trimPipe', 'voidPipe']};

describe('#24a An alias in a conflict list', () => {
	test('the message has the names as typed', () => {
		let message = '';
		argMate(['-P', '--trim-pipe'], aliasInList(), {
			error: e => {
				message = e.message;
			},
		});
		expect(message).toBe("The parameter '-P' conflicts with '--trim-pipe'");
	});

	test('the user types the two aliases', () => {
		expect(parse(['-P', '-T'], aliasInList())).toEqual(voidConflictsWithTrim);
	});

	test('the user types the two names', () => {
		expect(parse(['--voidPipe', '--trimPipe'], aliasInList())).toEqual(voidConflictsWithTrim);
	});

	test('the user types one name and the alias that is in the list', () => {
		expect(parse(['--voidPipe', '-T'], aliasInList())).toEqual(voidConflictsWithTrim);
	});

	test('the user types one alias and the name of the parameter in the list', () => {
		expect(parse(['-P', '--trimPipe'], aliasInList())).toEqual(voidConflictsWithTrim);
	});

	test('the user types the aliases in the opposite sequence', () => {
		expect(parse(['-T', '-P'], aliasInList())).toEqual(voidConflictsWithTrim);
	});

	test('the user types the aliases as a group of short flags', () => {
		expect(parse(['-PT'], aliasInList())).toEqual(voidConflictsWithTrim);
	});

	test('the user types the names in kebab-case', () => {
		expect(parse(['--void-pipe', '--trim-pipe'], aliasInList())).toEqual(voidConflictsWithTrim);
	});

	test('the parameter has two aliases: one is in the list and the user types the other', () => {
		const config = {voidPipe: {alias: 'P', conflict: ['trim']}, trimPipe: {alias: ['T', 'trim']}};
		expect(parse(['-P', '-T'], config)).toEqual(voidConflictsWithTrim);
	});

	test('the list has the kebab-case alias that ArgMate adds for a camelCase name', () => {
		const config = {voidPipe: {conflict: ['trim-pipe']}, trimPipe: {}};
		expect(parse(['--voidPipe', '--trimPipe'], config)).toEqual(voidConflictsWithTrim);
	});

	test('the list is a string with aliases and commas', () => {
		const config = {
			voidPipe: {alias: 'P', conflict: 'T, K'},
			trimPipe: {alias: 'T'},
			keepPipe: {alias: 'K'},
		};
		expect(parse(['-P', '-K'], config)).toEqual({
			conflict: ['voidPipe', 'keepPipe'],
		});
	});

	test('the parameter that has the list comes after the other parameter in the config', () => {
		const config = {voidPipe: {alias: 'P'}, trimPipe: {alias: 'T', conflict: ['P']}};
		expect(parse(['-P', '-T'], config)).toEqual(trimConflictsWithVoid);
	});

	test('the two parameters have the alias of the other parameter in their lists', () => {
		const config = {
			voidPipe: {alias: 'P', conflict: ['T']},
			trimPipe: {alias: 'T', conflict: ['P']},
		};
		expect(parse(['-P', '-T'], config)).toEqual(voidConflictsWithTrim);
	});

	test('ArgMate replaces the alias with its parent parameter when it reads the config', () => {
		expect(configPreprocessing(aliasInList()).parameterConfig.voidPipe.conflict).toEqual([
			'trimPipe',
		]);
	});

	test('there is no error when the user types only the parameter that has the list', () => {
		expect(parse(['-P'], aliasInList())).toEqual({_: [], voidPipe: true});
	});

	test('there is no error when the user types only the parameter in the list', () => {
		expect(parse(['-T'], aliasInList())).toEqual({_: [], trimPipe: true});
	});
});

describe('#24a A name in a conflict list that is not a parameter and not an alias', () => {
	test('gives no config error', () => {
		const config = {voidPipe: {conflict: ['nope']}};
		expect(parse(['--voidPipe'], config)).toEqual({_: [], voidPipe: true});
	});
});

describe('#24a A parameter name in a conflict list', () => {
	test('the user types the two names', () => {
		expect(parse(['--voidPipe', '--trimPipe'], nameInList())).toEqual(voidConflictsWithTrim);
	});

	test('the user types the two aliases', () => {
		expect(parse(['-P', '-T'], nameInList())).toEqual(voidConflictsWithTrim);
	});

	test('the user types the aliases as a group of short flags', () => {
		expect(parse(['-PT'], nameInList())).toEqual(voidConflictsWithTrim);
	});

	test('the user types the names in kebab-case', () => {
		expect(parse(['--void-pipe', '--trim-pipe'], nameInList())).toEqual(voidConflictsWithTrim);
	});

	test('the parameter that has the list comes after the other parameter in the config', () => {
		const config = {voidPipe: {alias: 'P'}, trimPipe: {alias: 'T', conflict: ['voidPipe']}};
		expect(parse(['-P', '-T'], config)).toEqual(trimConflictsWithVoid);
	});

	test('the two parameters have the name of the other parameter in their lists', () => {
		const config = {
			voidPipe: {alias: 'P', conflict: ['trimPipe']},
			trimPipe: {alias: 'T', conflict: ['voidPipe']},
		};
		expect(parse(['-P', '-T'], config)).toEqual(voidConflictsWithTrim);
	});

	// The string gives the list ['', 'trimPipe', 'keepPipe', '']. The empty names must not give a config error.
	test('the list is a string with names, commas and spaces', () => {
		const config = {voidPipe: {conflict: ' trimPipe, keepPipe '}, trimPipe: {}, keepPipe: {}};
		expect(parse(['--voidPipe', '--keepPipe'], config)).toEqual({
			conflict: ['voidPipe', 'keepPipe'],
		});
	});

	test('ArgMate keeps the name when it reads the config', () => {
		expect(configPreprocessing(nameInList()).parameterConfig.voidPipe.conflict).toEqual([
			'trimPipe',
		]);
	});

	test('there is no error when the user types only one of the two parameters', () => {
		expect(parse(['-P'], nameInList())).toEqual({_: [], voidPipe: true});
	});
});
