const yargs = require('yargs-parser');
const asTable = require('as-table');

const x = yargs(process.argv.slice(2));
console.log(
	asTable(
		Object.entries(x).map(([key, value]) => {
			return {Parameter: key, Value: value};
		})
	)
);
