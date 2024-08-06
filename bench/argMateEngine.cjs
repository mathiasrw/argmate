const asTable = require('as-table');

(async () => {
	let argMate = (await import('../dist/argEngine.mjs')).default;

	let x = argMate((process?.argv || Deno.args).slice(2));
	console.log(
		asTable(
			Object.entries(x).map(([key, value]) => {
				return { Parameter: key, Value: value };
			})
		)
	);
})();
