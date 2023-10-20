const nopt = require('nopt');
const asTable = require('as-table');


let x = (nopt(process.argv.slice(2)))
console.log(asTable(Object.entries(x).map(([key, value]) => {
	return { Parameter: key, Value: value };
})))
