// Feature 8: A check across parameters
// The setting `crossValidate` is a function that runs once after all the other checks. It gets the result, which it
// may change. `true` or nothing passes. `false` or a string is the error `CROSS_VALIDATE`, and a string is its
// message. This is for the full engine.
import {describe, expect, test} from 'bun:test';
import {argMate} from '../../helper.ts';

// The object that the `error` callback gets, or the result
function caught(args: string[], config: object, settings: object) {
	let got: unknown;
	const result = argMate(
		args,
		config as any,
		{
			...settings,
			error: (e: unknown) => {
				got = e;
			},
		} as any
	);
	return got ?? result;
}

const pipes = () => ({jsPipe: false, replacementPipe: false, trim: false});

describe('Feature 8 crossValidate', () => {
	test('a string is the error with that message', () => {
		const crossValidate = argv =>
			argv.jsPipe && argv.replacementPipe ? 'Pipe the code or the replacement, not both' : true;
		expect(caught(['--js-pipe', '--replacement-pipe'], pipes(), {crossValidate})).toEqual({
			code: 'CROSS_VALIDATE',
			message: 'Pipe the code or the replacement, not both',
		});
		expect(caught(['--js-pipe'], pipes(), {crossValidate})).toEqual({
			_: [],
			jsPipe: true,
			replacementPipe: false,
			trim: false,
		});
	});

	test('false is the error with the standard message', () => {
		expect(caught([], pipes(), {crossValidate: () => false})).toEqual({
			code: 'CROSS_VALIDATE',
			message: 'Across parameters and values this is not a valid combination',
		});
	});

	test('nothing passes', () => {
		expect(caught(['--trim'], pipes(), {crossValidate: () => {}})).toMatchObject({trim: true});
	});

	test('it may change the result', () => {
		const crossValidate = argv => {
			if (argv.trim) argv.jsPipe = argv.replacementPipe = true;
		};
		expect(caught(['--trim'], pipes(), {crossValidate})).toEqual({
			_: [],
			jsPipe: true,
			replacementPipe: true,
			trim: true,
		});
	});

	test('it gets the values after transform and valid, and `_`', () => {
		let got: unknown;
		const config = {
			engine: {valid: [['V8', 'v8'], 'RE2']},
			n: {type: 'int', transform: v => v * 2},
		};
		caught(['a.md', '--engine', 'v8', '--n', '2'], config, {
			crossValidate: argv => {
				got = structuredClone(argv);
			},
		});
		expect(got).toEqual({_: ['a.md'], engine: 'V8', n: 4});
	});

	test('it runs after the other checks', () => {
		let calls = 0;
		const config = {a: {conflict: 'b'}, b: false};
		const result = caught(['-a', '-b'], config, {crossValidate: () => calls++});
		expect(result).toMatchObject({code: 'CONFLICT'});
		expect(calls).toBe(0);
	});
});
