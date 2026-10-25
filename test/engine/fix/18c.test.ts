// #18c: Types `bool` and `bool[]`
// `bool` is a short name for `boolean`. The README shows `bool` and `bool[]`, but the config check rejected them with `Invalid type 'bool'`.
// The two engines must accept `bool` as the type `boolean`, and `bool[]` as the type `boolean[]` (issue 18d).
import {describe, expect, test} from 'bun:test';
import {argMate, argMateMini} from '../../helper.ts';

const engines = {'full engine': argMate, 'mini engine': argMateMini};

// `error` is the callback for input errors and `panic` is the callback for config errors
const settings = () => ({
	error: msg => {
		throw new Error(`input error: ${msg}`);
	},
	panic: msg => {
		throw new Error(`config error: ${msg}`);
	},
});

for (const [name, engine] of Object.entries(engines)) {
	describe(`#18c bool is the same type as boolean: ${name}`, () => {
		test.todo('the flag gives true', () => {
			expect(engine(['--b'], {b: {type: 'bool'}})).toEqual({_: [], b: true});
		});

		test.todo('the flag does not take the next argument as its value', () => {
			expect(engine(['--b', 'file'], {b: {type: 'bool'}})).toEqual({_: ['file'], b: true});
		});

		test.todo('the alias gives true', () => {
			expect(engine(['-b'], {bee: {type: 'bool', alias: 'b'}})).toEqual({_: [], bee: true});
		});

		test.todo('the parameter is absent when the flag is not given', () => {
			expect(engine([], {b: {type: 'bool'}})).toEqual({_: []});
		});

		test.todo('the default is the value when the flag is not given', () => {
			expect(engine([], {b: {type: 'bool', default: false}})).toEqual({_: [], b: false});
		});

		test.todo('the flag changes a default of false to true', () => {
			expect(engine(['--b'], {b: {type: 'bool', default: false}})).toEqual({_: [], b: true});
		});

		test('the type `boolean` gives these results', () => {
			expect(engine(['--b', 'file'], {b: {type: 'boolean'}})).toEqual({_: ['file'], b: true});
			expect(engine(['-b'], {bee: {type: 'boolean', alias: 'b'}})).toEqual({_: [], bee: true});
			expect(engine([], {b: {type: 'boolean'}})).toEqual({_: []});
			expect(engine([], {b: {type: 'boolean', default: false}})).toEqual({_: [], b: false});
			expect(engine(['--b'], {b: {type: 'boolean', default: false}})).toEqual({_: [], b: true});
		});
	});
}

describe('#18c bool in the full engine: negation and assignment', () => {
	test.todo('--no- gives false', () => {
		expect(argMate(['--no-b'], {b: {type: 'bool'}})).toEqual({_: [], b: false});
	});

	test.todo('--no- changes a default of true to false', () => {
		expect(argMate(['--no-b'], {b: {type: 'bool', default: true}})).toEqual({_: [], b: false});
	});

	test.todo('the assigned words true, yes and on give true', () => {
		for (const word of ['true', 'yes', 'on']) {
			expect(argMate([`--b=${word}`], {b: {type: 'bool'}})).toEqual({_: [], b: true});
		}
	});

	test.todo('the assigned words false, no and off give false', () => {
		for (const word of ['false', 'no', 'off']) {
			expect(argMate([`--b=${word}`], {b: {type: 'bool'}})).toEqual({_: [], b: false});
		}
	});

	test.todo('a different assigned word is an input error', () => {
		expect(() => argMate(['--b=maybe'], {b: {type: 'bool'}}, settings())).toThrow(/^input error: /);
	});

	test('the type `boolean` gives these results', () => {
		expect(argMate(['--no-b'], {b: {type: 'boolean'}})).toEqual({_: [], b: false});
		expect(argMate(['--no-b'], {b: {type: 'boolean', default: true}})).toEqual({_: [], b: false});
		expect(argMate(['--b=yes'], {b: {type: 'boolean'}})).toEqual({_: [], b: true});
		expect(argMate(['--b=off'], {b: {type: 'boolean'}})).toEqual({_: [], b: false});
		expect(() => argMate(['--b=maybe'], {b: {type: 'boolean'}}, settings())).toThrow(
			/^input error: /
		);
	});
});

// The README says that mini has no `--no-` negation and no conversion of the words yes/no
describe('#18c bool in the mini engine: no negation and no assignment', () => {
	test.todo('--no- is a different flag', () => {
		expect(argMateMini(['--no-b'], {b: {type: 'bool'}})).toEqual({_: [], noB: true});
	});

	test.todo('an assigned value is an input error', () => {
		expect(() => argMateMini(['--b=yes'], {b: {type: 'bool'}}, settings())).toThrow(
			/^input error: /
		);
	});

	test('the type `boolean` gives these results', () => {
		expect(argMateMini(['--no-b'], {b: {type: 'boolean'}})).toEqual({_: [], noB: true});
		expect(() => argMateMini(['--b=yes'], {b: {type: 'boolean'}}, settings())).toThrow(
			/^input error: /
		);
	});
});

// The type `boolean[]` does not work before issue 18d is done. test/engine/fix/18d.test.ts has its complete tests.
describe('#18c bool[] is the same type as boolean[]', () => {
	test.todo('full engine: each use of the flag adds one value', () => {
		expect(argMate(['--b', '--no-b', '--b=yes'], {b: {type: 'bool[]'}})).toEqual({
			_: [],
			b: [true, false, true],
		});
	});

	test.todo('full engine: the flag does not take the next argument as its value', () => {
		expect(argMate(['--b', 'file', '--b'], {b: {type: 'bool[]'}})).toEqual({
			_: ['file'],
			b: [true, true],
		});
	});

	test.todo('full engine: the value is an empty array when the flag is not given', () => {
		expect(argMate([], {b: {type: 'bool[]'}})).toEqual({_: [], b: []});
	});

	test.todo('mini engine: the value is an empty array when the flag is not given', () => {
		expect(argMateMini([], {b: {type: 'bool[]'}})).toEqual({_: [], b: []});
	});

	// Assumption: the mini engine gets the type `boolean[]` also (issue 18d does not name the engines).
	test.todo('mini engine: each use of the flag adds true', () => {
		expect(argMateMini(['--b', '--b'], {b: {type: 'bool[]'}})).toEqual({_: [], b: [true, true]});
	});

	test('the type `boolean[]` is accepted in the config of the two engines', () => {
		expect(argMate([], {b: {type: 'boolean[]'}})).toEqual({_: [], b: []});
		expect(argMateMini([], {b: {type: 'boolean[]'}})).toEqual({_: [], b: []});
	});
});
