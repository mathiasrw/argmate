// The `config` workload of ../shared/scenarios.js, with a description for each parameter so there is help to show
export const config = () => ({
	file: {type: 'string', alias: 'f', mandatory: true, description: 'The file to read'},
	port: {type: 'int', default: 80, validate: v => v > 0, description: 'Where the server listens'},
	verbose: {type: 'count', alias: 'v', description: 'Say more, once for each v'},
	tag: {type: 'string[]', alias: 't', description: 'A tag for the run'},
	name: {type: 'string', transform: v => v.trim(), description: 'The name of the run'},
	color: {type: 'boolean', default: true, description: 'Colors in the output'},
	ratio: {type: 'number', description: 'How much to keep'},
	debug: {type: 'boolean', alias: 'd', description: 'Show what goes on'},
});

export const args = [
	'--file',
	'a.txt',
	'--port=8080',
	'-vv',
	'-t',
	'x',
	'--tag',
	'y',
	'--name',
	' bob ',
	'--ratio',
	'1.5',
	'-d',
	'rest1',
	'rest2',
];
