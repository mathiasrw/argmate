const asTable = require('as-table');

(async () => {
	const argMate = (await import('../../dist/argEngineMini.js')).default;

	const x = argMate((process?.argv || Deno.args).slice(2));
	console.log(JSON.stringify(x, null, 2));
})();
