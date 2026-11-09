// #52: An explicit empty value
// `--key=` gives the empty string for a string and leaves the next input alone. For a number the empty value is a
// missing value, `MISSING_VALUE`, also when it comes as an empty input and not with `=`. For a boolean it is
// `false`. The SPEC has the rows with `=`; these are the inputs a row can not write: an empty input.
import {describe, expect, test} from 'bun:test';
import {argMate} from '../../helper.ts';

// The code of the error that the input gives
function code(args: string[], config: object) {
	try {
		argMate(args, config as any);
	} catch (err) {
		return (err as {code: string}).code;
	}
}

describe('#52 an explicit empty value', () => {
	test('an empty input after a number is a missing value', () => {
		expect(code(['--n', ''], {n: {type: 'int'}})).toBe('MISSING_VALUE');
	});

	test('an empty input after a string is the empty string', () => {
		expect(argMate(['--s', ''], {s: {type: 'string'}})).toEqual({_: [], s: ''});
	});

	test('an empty input at the spot of a number is a missing value', () => {
		expect(code(['', 'a'], {p: {spot: 1, type: 'int'}})).toBe('MISSING_VALUE');
	});

	test('an empty input at the spot of a boolean is false', () => {
		expect(argMate(['', 'a'], {p: {spot: 1, type: 'boolean'}})).toEqual({_: ['a'], p: false});
	});

	test('an empty input in the slice of a number is a missing value', () => {
		expect(code(['--c', '1', ''], {c: {type: 'int[]', next: 2}})).toBe('MISSING_VALUE');
	});

	test('an empty input in a last slice of a number is a missing value', () => {
		expect(code(['--c', 'a', '1', ''], {c: {type: 'int[]', last: 2}})).toBe('MISSING_VALUE');
	});

	test('an empty input as the last input after a number is a missing value', () => {
		expect(code(['a', '--n', ''], {n: {type: 'int'}})).toBe('MISSING_VALUE');
	});

	test('the error of an empty number has no value, as the other missing values', () => {
		let got: unknown;
		argMate(['--port='], {port: {type: 'int'}}, {error: (e: unknown) => (got = e)} as any);
		expect(got).toEqual({
			code: 'MISSING_VALUE',
			key: 'port',
			alias: '--port',
			message: "No data provided for 'port'",
		});
	});
});
