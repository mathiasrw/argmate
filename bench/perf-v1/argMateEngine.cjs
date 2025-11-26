const asTable = require('as-table');

(async () => {
	const argMate = (await import('../../dist/argEngine.js')).default;

	const x = argMate((process?.argv || Deno.args).slice(2));
	console.log(
		asTable(
			Object.entries(x).map(([key, value]) => {
				return {Parameter: key, Value: value};
			})
		)
	);
})();
