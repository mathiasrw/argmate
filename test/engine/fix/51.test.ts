// #51: One parameter demands another
// `demand` names one or more parameters that must be in the input when this one is. The names follow the rules of
// `conflict`: the config key, an alias, or the kebab form. A default value does not count. This is for the full engine.
import {describe, expect, test} from 'bun:test';
import {argMate, configPreprocessing} from '../../helper.ts';

// The object that the `error` callback gets, or the message that `panic` gets
function caught(args: string[], config: object) {
	let got: unknown;
	const result = argMate(
		args,
		config as any,
		{
			error: (e: unknown) => {
				got = e;
			},
			panic: (msg: unknown) => {
				got = {panic: msg};
			},
		} as any
	);
	return got ?? result;
}

const nullIn = () => ({nullIn: {alias: 'n', demand: 'globPipe'}, globPipe: {alias: 'g'}});

describe('#51 demand', () => {
	test('the parameter without the one it demands is an error with the two names', () => {
		expect(caught(['--null-in'], nullIn())).toEqual({
			code: 'DEMAND',
			key: 'nullIn',
			alias: '--null-in',
			with: 'globPipe',
			withAlias: '--glob-pipe',
			message: "The parameter '--null-in' demands '--glob-pipe'",
		});
	});

	test('the message has the names as typed', () => {
		expect(caught(['-n'], nullIn())).toMatchObject({
			message: "The parameter '-n' demands '--glob-pipe'",
		});
	});

	test('the two parameters are accepted', () => {
		expect(caught(['-n', '-g'], nullIn())).toEqual({_: [], nullIn: true, globPipe: true});
	});

	test('the required parameter alone is accepted', () => {
		expect(caught(['-g'], nullIn())).toEqual({_: [], globPipe: true});
	});

	test('a name in the list can be an alias or the kebab form', () => {
		for (const demand of ['g', 'glob-pipe', ['g']]) {
			const config = {nullIn: {demand}, globPipe: {alias: 'g'}};
			expect(caught(['--null-in'], config)).toMatchObject({code: 'DEMAND', with: 'globPipe'});
			expect(caught(['--null-in', '--glob-pipe'], config)).toEqual({
				_: [],
				nullIn: true,
				globPipe: true,
			});
		}
	});

	test('a list with two names needs the two', () => {
		const config = {a: {demand: 'b, c'}, b: {}, c: {}};
		expect(caught(['-a', '-b'], config)).toMatchObject({code: 'DEMAND', with: 'c'});
		expect(caught(['-a', '-b', '-c'], config)).toEqual({_: [], a: true, b: true, c: true});
	});

	test('a default value does not count', () => {
		const config = {nullIn: {demand: 'globPipe'}, globPipe: true};
		expect(caught(['--null-in'], config)).toMatchObject({code: 'DEMAND'});
	});

	test('a parameter of any type can require another', () => {
		const config = {port: {type: 'int', demand: 'host'}, host: {type: 'string'}};
		expect(caught(['--port', '80'], config)).toMatchObject({code: 'DEMAND', key: 'port'});
	});

	test('a name that is not a parameter or an alias is a config error', () => {
		expect(caught([], {nullIn: {demand: 'globPipe'}})).toEqual({
			panic: "The parameter 'nullIn' demands 'globPipe', which is not a parameter or an alias",
		});
	});

	test('the engine config has the names of the parameters', () => {
		const {parameterConfig, demand} = configPreprocessing(nullIn() as any) as any;
		expect(demand).toEqual(['nullIn']);
		expect(parameterConfig.nullIn.demand).toEqual(['globPipe']);
	});
});
