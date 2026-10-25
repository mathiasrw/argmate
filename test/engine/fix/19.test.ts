// #19: Mini engine: `count` with an alias gives a wrong result
// The mini engine incremented the name that the user typed and not the parameter that the alias belongs to.
import {describe, expect, test} from 'bun:test';
import {argMate, argMateMini} from '../../helper.ts';

const config = () => ({verbose: {type: 'count', alias: 'V'}});

describe('#19 Mini engine: count with an alias', () => {
	test('the alias increments the parameter', () => {
		expect(argMateMini(['-V', '-V'], config())).toEqual({_: [], verbose: 2});
	});

	test('the alias and the name increment the same parameter', () => {
		expect(argMateMini(['-V', '--verbose', '-V'], config())).toEqual({_: [], verbose: 3});
	});

	test('the alias in a group of short flags increments the parameter', () => {
		expect(argMateMini(['-VVV'], config())).toEqual({_: [], verbose: 3});
	});

	test('each alias in a list of aliases increments the parameter', () => {
		const config = {verbose: {type: 'count', alias: ['V', 'loud']}};
		expect(argMateMini(['-V', '--loud', '--verbose'], config)).toEqual({_: [], verbose: 3});
	});

	test('the name of the parameter increments it', () => {
		expect(argMateMini(['--verbose', '--verbose'], config())).toEqual({_: [], verbose: 2});
	});

	test('the parameter is 0 when it is not given', () => {
		expect(argMateMini([], config())).toEqual({_: [], verbose: 0});
	});

	test('the full engine gives the correct result', () => {
		expect(argMate(['-V', '-V'], config())).toEqual({_: [], verbose: 2});
		expect(argMate(['-VVV'], config())).toEqual({_: [], verbose: 3});
	});
});
