import {argInfoFormat as argInfo} from './helper.ts';

// Sample params similar to the old rexData example
const testParams = {
	version: {
		describe: 'Print version (can be given as only argument)',
		alias: 'v',
	},
	voidIgnoreCase: {
		describe: 'Void case insensitive search pattern.',
		alias: 'I',
	},
	encoding: {
		default: 'utf8',
		alias: 'e',
		describe: 'Encoding of files/piped data.',
	},
	halt: {
		alias: ['H', 'bail'],
		describe: 'Halt on first error',
		default: false,
	},
	excludeGlob: {
		alias: 'X',
		describe: 'Exclude files found with this glob. Can be used multiple times.',
		type: 'string[]',
	},
	engine: {
		alias: 'E',
		describe: 'What regex engine to use:',
		default: 'V8',
		valid: ['V8', 'bun', 'regex+'],
	},
	help: {
		alias: 'h',
		describe: 'Display help.',
	},
};

const testConf = {
	intro: 'MyTool v1.0.0 - A sample CLI tool',
	outro: 'For more info visit: https://example.com',
};

// Test CLI format
console.log('=== CLI Format ===');
console.log(argInfo({format: 'cli', width: 80}, testConf, testParams));

// Test JSON format
console.log('=== JSON Format ===');
console.log(JSON.stringify(argInfo({format: 'json'}, testConf, testParams), null, 2));

// Test Markdown format
console.log('=== Markdown Format ===');
console.log(argInfo({format: 'markdown'}, testConf, testParams));
