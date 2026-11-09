// #24b: `conflict` does not work for parameters that take a value
// The engine added only `boolean`, `count` and unknown parameters to its list of the parameters in the input.
// So a conflict with a string, number or array parameter was never found.
import {describe, expect, test} from 'bun:test';
import {argMate} from '../../helper.ts';

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

// Each type that takes a value, with a value that is correct for the type
const valueTypes = [
	['string', 'a'],
	['number', '1.5'],
	['float', '1.5'],
	['int', '3'],
	['hex', 'ff'],
	['array', 'a'],
	['string[]', 'a'],
	['number[]', '1.5'],
	['float[]', '1.5'],
	['int[]', '3'],
	['hex[]', 'ff'],
];

const valConflictsWithFlag = {conflict: ['val', 'flag']};
const flagConflictsWithVal = {conflict: ['flag', 'val']};

// `val` takes a value and has the list
const listOnVal = (type = 'string') => ({val: {type, conflict: ['flag']}, flag: {type: 'boolean'}});
// `flag` is a boolean and has the list
const listOnFlag = (type = 'string') => ({flag: {type: 'boolean', conflict: ['val']}, val: {type}});

describe('#24b A parameter that takes a value and a boolean', () => {
	for (const [type, value] of valueTypes) {
		test(`a '${type}' parameter that has the list conflicts with the boolean`, () => {
			expect(parse(['--val', value, '--flag'], listOnVal(type))).toEqual(valConflictsWithFlag);
		});
	}

	for (const [type, value] of valueTypes) {
		test(`a boolean that has the list conflicts with the '${type}' parameter`, () => {
			expect(parse(['--flag', '--val', value], listOnFlag(type))).toEqual(flagConflictsWithVal);
		});
	}

	test('the user types the boolean first', () => {
		expect(parse(['--flag', '--val', 'a'], listOnVal())).toEqual(valConflictsWithFlag);
	});

	test('the user assigns the value with =', () => {
		expect(parse(['--val=a', '--flag'], listOnVal())).toEqual(valConflictsWithFlag);
	});

	test('the user assigns the value with = and the boolean has the list', () => {
		expect(parse(['--flag', '--val=a'], listOnFlag())).toEqual(flagConflictsWithVal);
	});

	test('the user gives the value in the short form with a number (-n100)', () => {
		const config = {n: {type: 'number', conflict: ['flag']}, flag: {type: 'boolean'}};
		expect(parse(['-n100', '--flag'], config)).toEqual({
			conflict: ['n', 'flag'],
		});
	});

	test('the user types the alias of the parameter that takes a value', () => {
		const config = {val: {type: 'string', alias: 'v', conflict: ['flag']}, flag: {type: 'boolean'}};
		expect(parse(['-v', 'a', '--flag'], config)).toEqual(valConflictsWithFlag);
	});

	test('the parameter that takes a value has a default value and the user types it', () => {
		const config = {flag: {conflict: ['val']}, val: 'x'};
		expect(parse(['--flag', '--val', 'a'], config)).toEqual(flagConflictsWithVal);
	});

	test('the user gives an array parameter two times', () => {
		expect(parse(['--val', 'a', '--val', 'b', '--flag'], listOnVal('string[]'))).toEqual(
			valConflictsWithFlag
		);
	});
});

describe('#24b Two parameters that take a value', () => {
	const fromConflictsWithTo = {conflict: ['from', 'to']};

	test('a string conflicts with a number', () => {
		const config = {from: {type: 'string', conflict: ['to']}, to: {type: 'number'}};
		expect(parse(['--from', 'a', '--to', '2'], config)).toEqual(fromConflictsWithTo);
	});

	test('a number conflicts with a string', () => {
		const config = {from: {type: 'number', conflict: ['to']}, to: {type: 'string'}};
		expect(parse(['--from', '1', '--to', 'b'], config)).toEqual(fromConflictsWithTo);
	});

	test('an array conflicts with an array', () => {
		const config = {from: {type: 'string[]', conflict: ['to']}, to: {type: 'int[]'}};
		expect(parse(['--from', 'a', '--to', '2'], config)).toEqual(fromConflictsWithTo);
	});

	test('the user assigns the two values with =', () => {
		const config = {from: {type: 'string', conflict: ['to']}, to: {type: 'number'}};
		expect(parse(['--from=a', '--to=2'], config)).toEqual(fromConflictsWithTo);
	});

	test('the user types the parameter in the list first', () => {
		const config = {from: {type: 'string', conflict: ['to']}, to: {type: 'number'}};
		expect(parse(['--to', '2', '--from', 'a'], config)).toEqual(fromConflictsWithTo);
	});
});

describe('#24b A parameter that is not in the input', () => {
	test('a parameter that takes a value is accepted when the boolean is not in the input', () => {
		expect(parse(['--val', 'a'], listOnVal())).toEqual({_: [], val: 'a'});
	});

	test('a boolean is accepted when the parameter that takes a value is not in the input', () => {
		expect(parse(['--flag'], listOnVal())).toEqual({_: [], flag: true});
	});

	test('a default value is not a conflict', () => {
		const config = {flag: {conflict: ['val']}, val: {type: 'string', default: 'x'}};
		expect(parse(['--flag'], config)).toEqual({_: [], flag: true, val: 'x'});
	});

	test('the empty array of an array parameter is not a conflict', () => {
		expect(parse(['--flag'], listOnFlag('string[]'))).toEqual({_: [], flag: true, val: []});
	});

	test('the default value of an array parameter is not a conflict', () => {
		const config = {flag: {conflict: ['val']}, val: {type: 'string[]', default: ['x']}};
		expect(parse(['--flag'], config)).toEqual({_: [], flag: true, val: ['x']});
	});

	test('the 0 of a count parameter is not a conflict', () => {
		expect(parse(['--flag'], listOnFlag('count'))).toEqual({_: [], flag: true, val: 0});
	});

	test('the same parameter two times is not a conflict', () => {
		expect(parse(['--val', 'a', '--val', 'b'], listOnVal('string[]'))).toEqual({
			_: [],
			val: ['a', 'b'],
		});
	});
});

describe('#24b Boolean and count parameters', () => {
	test('a boolean that has the list conflicts with a boolean', () => {
		expect(parse(['--flag', '--val'], listOnFlag('boolean'))).toEqual(flagConflictsWithVal);
	});

	test('a boolean that has the list conflicts with a count', () => {
		expect(parse(['--flag', '--val'], listOnFlag('count'))).toEqual(flagConflictsWithVal);
	});

	test('a count that has the list conflicts with a boolean', () => {
		expect(parse(['--val', '--flag'], listOnVal('count'))).toEqual(valConflictsWithFlag);
	});

	test('a boolean with an assigned value (=yes) conflicts with a boolean', () => {
		expect(parse(['--flag=yes', '--val'], listOnFlag('boolean'))).toEqual(flagConflictsWithVal);
	});
});
