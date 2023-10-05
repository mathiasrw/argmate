const minimist = require('minimist');

let x = JSON.stringify(minimist(process.argv.slice(2))).length;
