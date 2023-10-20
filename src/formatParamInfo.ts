function breakLines(text, columnWidth) {
	const regex = new RegExp(`([^\s].{0,${columnWidth - 1}})(?:[\\s]|$)`, 'g');
	const lines = ('' + text).split('\n');
	return lines.map(l => l.match(regex) || []).flat();
	('');
}

function minimizeLineBreaks(data, maxWidth = 120) {
	const numColumns = data[0].length;
	let columnWidths = Array(numColumns).fill(0);
	let columnMinWidths = Array(numColumns).fill(0);
	let longestWord = 0;

	// Step 1: Calculate the Initial Minimum Widths and Column Widths
	data.forEach(row => {
		row.forEach((cell, i) => {
			cell ||= '';
			const longestWordInCell = Math.max(...cell.split(' ').map(word => word.length));
			longestWord = Math.max(longestWord, longestWordInCell);
			columnMinWidths[i] = Math.max(columnMinWidths[i], longestWordInCell);
			columnWidths[i] = Math.max(columnWidths[i], cell.length, columnMinWidths[i]);
		});
	});

	// Throw an error if the longest word is greater than maxWidth
	if (longestWord > maxWidth) {
		throw new Error('Longest word exceeds maxWidth.');
	}

	// Calculate initial total width and overflow
	let totalWidth = columnWidths.reduce((a, b) => a + b, 0);
	let overflow = totalWidth - maxWidth;

	// Step 2: Adjust the column widths if there's an overflow
	while (overflow > 0) {
		for (let i = 0; i < numColumns && overflow > 0; i++) {
			if (columnWidths[i] > columnMinWidths[i]) {
				columnWidths[i]--;
				overflow--;
			}
		}
	}

	// Now, the sum of columnWidths should not exceed maxWidth and should respect columnMinWidths.
	return columnWidths;
}

function tupple(row, widths) {
	const fields = row.map((v, i) => breakLines(v, widths[i]));

	let active = true;
	let lines: any[] = [];
	for (let i = 0; active; i++) {
		active = false;
		let line: string[] = [];
		fields.forEach((f, j) => {
			if (i < f.length) {
				active = true;
				return line.push(f[i].padEnd(widths[j], ' '));
			}
			line.push(' '.padEnd(widths[j], ' '));
		});
		lines.push(line);
	}
	lines.pop();
	return lines;
}

export function tableLayout(data, conf_?: any) {
	const conf = {
		...{
			maxWidth: 120,
			left: '  ',
			join: '   ',
			right: '  ',
		},
		...conf_,
	};
	debugger;
	const workingWidth =
		conf.maxWidth -
		conf.left.length -
		conf.join.length * (data.slice(-1).pop()?.length - 1) -
		conf.right.length;

	const optimizedWidths = minimizeLineBreaks(data, workingWidth);

	const table = data.map((t, i) => tupple(t, optimizedWidths));

	let ascii = '';

	table.forEach(r => {
		r.forEach(f => {
			ascii += conf.left;
			ascii += f.join(conf.join);
			ascii += conf.right;
			ascii += '\n';
		});
		ascii += '\n\n';
	});

	return ascii;
}

export default function formatParamInfo(settings_ = {}, conf = {}) {
	return;
	/*let settings =	{
		...{
			preIntro: '',
			showIntro: true,
			showOutrp: true,
			postOutro: '',
			format: 'cli',
			width: 100,
		}, 
		...settings_,
	}
	{...conf_, ...settings_},
	params || JSON.parse(JSON.stringify(params_))



	const settings = {
		...{
			maxWidth: 120,
			left: '    ',
			join: '    ',
			right: ' ',
		},
		...settings_,
	};
*/
	const dasData: any = [];

	for (let key in data) {
		let val = data[key];
		let params = [...val.alias, ...[key]].sort((a, b) => b.length - a.length).map(camelToKebab);
		dasData.push([
			params.pop(),
			params.join(', ') + (undefined === val.default ? '' : `\n[=${val.default}]`),
			val.describe || '' + (undefined === val.type ? '' : ` [${val.type}]`),
		]);
	}

	return tableLayout(dasData, settings);
}

function camelToKebab(str) {
	if (str.length === 1) return '-' + str;
	str = str
		.replace(/([A-Z])/g, (match, val, index) => (index === 0 ? val : '-' + val))
		.toLowerCase();

	return '--' + str;
}

/*
debugger;
console.log(
	tableThatData(rexData(), {
		maxWidth: Math.min(100, process.stdout.columns - 1),
		left: '      ',
		join: '       ',
		right: '',
	})
);

console.log(process.stdout.columns);

*/
//console.log(tableLayout(data));

function rexData() {
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
			describe:
				'Exclude files with a path that matches this regular expression. Will follow same regex flags and setup as the main search. Can be used multiple times.',
			type: 'string[]',
		},

		excludeGlob: {
			alias: 'X',
			describe: 'Exclude files found with this glob. Can be used multiple times.',
			type: 'string[]',
		},

		verbose: {
			alias: 'V',
			describe: 'More chatty output',
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
			describe: 'Display help.',
		},
	};
}
