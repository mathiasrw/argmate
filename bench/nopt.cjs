const nopt = require('nopt');

let x = JSON.stringify(nopt(process.argv.slice(2))).length;
