import argMate from '../dist/argMate.min.mjs';

let x = JSON.stringify(argMate((process?.argv || Deno.args).slice(2))).length;
