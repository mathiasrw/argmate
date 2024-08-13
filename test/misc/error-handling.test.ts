// https://bun.sh/docs/test/writing

// @ts-ignore
import {expect, test, describe} from 'bun:test';

import argMate from '../../src/argMate';
import argMateLite from '../../src/argMateLite';

run(argMate);
run(argMateLite, ' lite');

let argv;

function run(argMate, type = '') {
	describe.todo('Miscellaneous tests and edge cases' + type, () => {
		describe.todo('4o' + type, () => {});
		describe.todo('Sonnet 3.5' + type, () => {});
	});
}
