(async () => {

	let argMate = (await import('../dist/argMate.min.js')).default;

	let x = JSON.stringify(argMate((process?.argv || Deno.args).slice(2))).length

})();


