// #29: Say what the mini engine has and what it does not have
// The mini engine leaves out features to get speed and a small size, but there was no complete list of them.
// These tests keep the points that are decided. The points that are not decided have no tests.
import {describe, expect, test} from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import {argMateMini, root} from '../../helper.ts';

describe('#29 The mini engine does not have', () => {
	test('conflict: the two parameters are accepted', () => {
		const config = {a: {conflict: ['b']}, b: {}};
		expect(argMateMini(['--a', '--b'], config)).toEqual({_: [], a: true, b: true});
	});

	test('outputAlias: the result has only the name of the parameter', () => {
		const config = {file: {type: 'string', alias: 'f'}};
		expect(argMateMini(['--file', 'x'], config, {outputAlias: true})).toEqual({_: [], file: 'x'});
	});

	test.todo('the list in the README has outputAlias', () => {
		const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
		expect(readme.slice(readme.indexOf('## argMateMini'))).toContain('outputAlias');
	});
});
