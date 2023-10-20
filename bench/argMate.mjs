import {createRequire as createImportMetaRequire} from 'node:module';
import.meta.require ||= id => createImportMetaRequire(import.meta.url)(id);

// import argMate from '../dist/argMate.mjs';
import argMate from '../src/argMate.ts';
const asTable = import.meta.require('as-table');

let x = argMate((process?.argv || Deno.args).slice(2));
console.log(
	asTable(
		Object.entries(x).map(([key, value]) => {
			return {Parameter: key, Value: value};
		})
	)
);
