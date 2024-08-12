// bun --inspect-brk test/manual.js      --no-foo bar --foo2 bar2
import argMate, {argInfo} from '../src/argMate.js';
let argv;
debugger;

argv = argMate(
	['-h', 'derp'],
	{
		herp: {type: 'boolean', alias: 'h'},
	},
	{
		outputAlias: true,
	}
);

console.log(argv);

process.exit();

console.log(precompileConfig({b: false, bool: false, 'no-meep': false, multi: ''}));
process.exit();

debugger;
argMate('--foo bar --foo2 bar2'.split(' '));

process.exit();

let conf = precompileConfig(lotsofParamConfig());
console.log(conf);

process.exit();
argv = argMate('-f123'.split(' '));

console.log({argv});

console.log(
	argMate(
		process.argv.slice(2),
		{
			foo: {type: 'string'},
			foo2: {type: 'string', alias: ['abc']},
		},
		{intro: 'what is going on?', outro: 'Vi ses!'}
	)
);

console.log(argInfo());

/*0 && argMate('--foo bar --foo2 bar2'.trim().split(/\s+/), {
	foo: { type: 'string' },
	foo2: { type: 'string' },
});*/

function lotsofParamConfig() {
	return {
		version: {
			describe: 'Print rexreplace version (can be given as only argument)',
			alias: 'v',
		},

		voidIgnoreCase: {
			describe: 'Void case insensitive search pattern.',
			alias: 'I',
		},

		voidGlobal: {
			describe: 'Void global search (stop looking after the first match).',
			alias: 'G',
		},

		voidMultiline: {
			describe:
				'Void multiline search pattern. Makes ^ and $ match start/end of whole content rather than each line.',
			alias: 'M',
		},

		dotAll: {
			alias: 's',
			describe: 'Have `.` also match newline.',
		},

		unicode: {
			describe: 'Treat pattern as a sequence of unicode code points.',
			alias: 'u',
		},

		encoding: {
			default: 'utf8',
			alias: 'e',
			describe: 'Encoding of files/piped data.',
		},

		engine: {
			alias: 'E',
			describe: 'What regex engine to use:',
			default: 'V8',
			valid: ['V8' /*'RE2' /*'sd', 'stream'*/],
		},

		literal: {
			alias: 'L',
			describe: 'Literal string search (no regex used when searching)',
		},

		voidEuro: {
			alias: '€',
			describe: "Void having '€' as alias for '$' in pattern and replacement parameters",
		},

		voidSection: {
			alias: '§',
			describe: "Void having '§' as alias for '\\' in pattern and replacement parameters",
		},

		voidAsync: {
			alias: 'A',
			describe: `Handle files in a synchronous flow. Good to limit memory usage when handling large files. `,
		},

		halt: {
			alias: ['H', 'bail'],
			describe: 'Halt on first error',
			default: false,
		},

		quiet: {
			alias: 'q',
			describe: 'Only display errors (no other info)',
		},

		quietTotal: {
			alias: 'Q',
			describe: 'Never display any errors or info',
		},

		voidBackup: {
			alias: 'B',
			describe:
				'Avoid temporary backing up files. Works async (independent of -A flag) and will speed up things but at one point data lives only in memory, and you might lose data if the process is forced closed.',
		},

		keepBackup: {
			describe: 'Keep the backup file with the original content.',
			alias: 'b',
		},

		output: {
			alias: 'o',
			describe:
				'Output the final result instead of saving to file. Will output the full content even if no replacement has taken place.',
			//conflict:'O'
		},

		outputMatch: {
			alias: 'm',
			describe:
				`Output each match on a new line. ` +
				`Will not replace any content but you still need to provide a dummy value (like \`_\`) as replacement parameter. ` +
				`If search pattern does not contain matching groups the full match will be outputted. ` +
				`If search pattern _does_ contain matching groups only matching groups will be outputted (same line with no delimiter). ` +
				``,
		},

		trimPipe: {
			alias: 'T',
			describe:
				`Trim piped data before processing. ` +
				`If piped data only consists of chars that can be trimmed (new line, space, tabs...) it will become an empty string. ` +
				'',
		},

		replacementPipe: {
			alias: 'R',
			describe: `Replacement is being piped in. You still need to provide a dummy value (like \`_\`) as replacement parameter.`,
			conflict: ['g', 'G'],
		},

		globPipe: {
			alias: 'g',
			describe:
				'Filename/globs will be piped in. If filename/globs are provided in command (-X flags are ok) the execution will halt',
			conflict: ['G'],
		},

		/*    .boolean('G')
	.describe('G', "filename/globs provided are to files containing one target filename/glob per line")
	.alias('G', 'glob-file')
	.conflicts('G','g')*/

		simulate: {
			alias: 'S',
			describe: 'Simulate output without changing any files',
		},

		excludeRe: {
			alias: 'x',
			decsribe:
				'Exclude files with a path that matches this regular expression. Will follow same regex flags and setup as the main search. Can be used multiple times.',
			type: 'string[]',
		},

		excludeGlob: {
			alias: 'X',
			decsribe: 'Exclude files found with this glob. Can be used multiple times.',
			type: 'string[]',
		},

		verbose: {
			alias: 'V',
			descrube: 'More chatty output',
		},

		debug: {
			alias: 'd',
			describe: 'Print debug info',
			//.conflicts('V', 'q')
			//.conflicts('V', 'Q')
		},

		/*
	
	
	-T (Expect no match in any file and return exit 1 if found)
	-t (Expect a match in each file and return exit 1 if not found)
	
	
	.boolean('N')
	.alias('N', 'void-newline')
	.describe('N',
		`Avoid having newline when outputting data (or when piping). `+
		`Normally . `+
		   ''
	)
	
	
	
	.boolean('p')
	.describe('p', "Pattern is the path to a filename containing the pattern. If more than one line is found in the file the pattern will be defined by each line trimmed and having newlines removed followed by other all rules (like -€).)")
	.alias('p', 'pattern-file')
	
	
	.boolean('r')
	.alias('r', 'replacement-file')
	.describe('r',
		`Replacement is the path to a filename containing the replacement`.`Will run before any other rules (like -€)`
	)
	
	
	
	.boolean('n')
	.describe('n', "Do replacement on file path+name instead of file content (rename/move the files)")
	.alias('n', 'name')
	
	// https://github.com/eugeneware/replacestream
	.integer('M')
	.describe('M', "Maximum length of match. Set this value only if any single file of your ")
	.alias('M', 'max-match-len')
	.default('M', false)
	
	
	
	
	
	.boolean('J')
	.describe('J', "Pattern is javascript source that will return a string giving the pattern to use")
	.alias('J', 'pattern-js')
	
	
	.boolean('glob-js')
	.describe('glob-js', "filename/globs are javascript source that will return a string with newline seperating each glob to work on")
	
	
	*/

		replacementJs: {
			alias: ['j', 'js'],

			describe: `Treat replacement as javascript source code. 
		The statement from the last expression will become the replacement string. 
		Purposefully implemented the most insecure way possible to remove _any_ incentive to consider running code from an untrusted party. 
		The full match will be available as a javascript variable named $0 while each captured group will be available as $1, $2, $3, ... and so on. 
		At some point, the $ char _will_ give you a headache when used from the command line, so use €0, €1, €2, €3... instead. 
		If the javascript source code references to the full match or a captured group the code will run once per match. Otherwise, it will run once per file. 

		The code has access to the following variables: 
		\`r\` as an alias for \`require\` with both expanded to understand a relative path even if it is not starting with \`./\`, 
		\`fs\` from node, 
		\`path\` from node, 
		\`glob\` proxy name for the .sync function of fast-glob from npm, 
		\`pipe\`: the data piped into the command (null if no piped data), 
		\`find\`: pattern searched for (the needle), 
		\`text\`: full text being searched i.e. file content or piped data (the haystack), 
		\`bytes\`: total size of the haystack in bytes, 
		\`size\`: human-friendly representation of the total size of the haystack, 
		\`time\`: String representing the local time when the command was invoked,
		\`time_obj\`: date object representing \`time\`,
		\`now\`: alias for \`time\`,
		\`cwd\`: current process working dir, 
		\`nl\`: a new-line char,
		\`_\`: a single space char (for easy string concatenation).

		The following values defaults to \`❌\` if haystack does not originate from a file:
		\`file\`: contains the full path of the active file being searched (including full filename), 
		\`file_rel\`: contains \`file\` relative to current process working dir, 
		\`dirpath\`: contains the full path without filename of the active file being searched, 
		\`dirpath_rel\`: contains \`dirpath\` relative to current process working dir, 
		\`filename\`: is the full filename of the active file being searched without path, 
		\`name\`: filename of the active file being searched with no extension, 
		\`ext\`: extension of the filename including leading dot, 
		\`mtime\`: ISO inspired representation of the last local modification time of the current file, 
		\`ctime\`: ISO representation of the local creation time of the current file. 
		\`mtime_obj\`: date object representing \`mtime\`, 
		\`ctime_obj\`: date object representing \`ctime\`. 

		All variables, except from module, date objects, \`nl\` and \`_\`, has a corresponding variable name followed by \`_\` where the content has an extra space at the end (for easy concatenation). 
		`.replaceAll(/\s+/g, ' '),
		},

		help: {
			alias: 'h',
			discibe: 'Display help.',
		},
	};
}
