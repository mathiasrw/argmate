const mri = require('mri');
const asTable = require('as-table');

const x = mri(process.argv.slice(2));
console.log(
	asTable(
		Object.entries(x).map(([key, value]) => {
			return {Parameter: key, Value: value};
		})
	)
);
