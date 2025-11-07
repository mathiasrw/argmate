import {createRequire as createImportMetaRequire} from 'node:module';
import.meta.require ||= id => createImportMetaRequire(import.meta.url)(id);

const asTable = import.meta.require('as-table');

import argMate from '../dist/argMateMini.js';

let x = argMate((process?.argv || Deno.args).slice(2));
console.log(
	asTable(
		Object.entries(x).map(([key, value]) => {
			return {Parameter: key, Value: value};
		})
	)
);
