[![CI-test](https://github.com/mathiasrw/argmate/workflows/CI-test/badge.svg)](https://github.com/mathiasrw/argmate/actions)
[![NPM downloads](https://img.shields.io/npm/dm/argmate.svg?style=flat&label=npm%20downloads)](https://npm-stat.com/charts.html?package=argmate)
[![npm version](https://badge.fury.io/js/argmate.svg)](https://www.npmjs.com/package/argmate)
[![FOSSA Status](https://img.shields.io/badge/license-CC%20BY-brightgreen.svg)](https://app.fossa.io/projects/git%2Bgithub.com%2Fmathiasrw%2Fargmate?ref=badge_shield)
[![OPEN open source software](https://img.shields.io/badge/Open--OSS-%E2%9C%94-brightgreen.svg)](http://open-oss.com)

# ArgMate

> _Your go-to companion for lightning-fast CLI parameter parsing, seasoned with convenient features to make your development experience much more smooth._

While developing things like [AlaSQL](https://www.npmjs.com/package/alasql) and [RexReplace](https://www.npmjs.com/package/rexreplace) I've always been caught between two types of CLI parsers. On one hand, there are feature-rich options like [yargs](https://www.npmjs.com/package/yargs) and [commander](https://www.npmjs.com/package/commander), which, despite their heavy startup time, provide useful help like easy defaults, smooth validation, and well-structured CLI help text output. On the other hand, more simple alternatives like [nopt](https://www.npmjs.com/package/nopt) and [mri](https://www.npmjs.com/package/mri) excel in performance but lack in development experience. After yet again uncovering a performance hit from using a heavyweight parser, I decided to solve this issue once and for all.

```
Benchmark:
argMate         9,089,813 ops/sec ±2.15% (98 runs sampled)		  1x
nopt            2,070,397 ops/sec ±1.21% (94 runs sampled)		  4x
mri             1,832,768 ops/sec ±0.13% (99 runs sampled)		  5x
minimist        706,265 ops/sec ±1.05% (94 runs sampled)		 13x
yargs-parser    67,417 ops/sec ±0.39% (97 runs sampled)			135x
```

Meet ArgMate: a CLI parameter parser that's not just fast—it's 4-5 times faster than other parsers focused on speed, while being feature-rich. _But how?!?_ A computer processes instructions at a set pace. To get results faster the only option is to ask the computer to do less work. By minimising how many times variables are touched and keeping those operations close together, the implementation enables efficient caching of data, resulting in fewer CPU cycles to get the result.



## Installation

```sh
yarn add argmate
# or
npm install argmate
```

## Usage

```js
argMate(arguments, [parameters [, config ]]);
```

## Examples

### Getting Started

```js
import argMate from 'argmate';

const args = process.argv.slice(2);

const params = {
	loops: 10, 				// --loops must be an integer and will default to 10 if not set.
	help: false
};
const config = {
Defaults to true.
	allowUnknown: false,	// Only allow parameters we have specified (--loops and --help). 
	error: msg => {			// If there is an error (like providing parameters not allowed), this function will be invoked.
		console.error('There was a problem:', msg);
		process.exit(1);
	},
};

const argv = argMate(args, params, config); // params and config are not mandatory
```

### A More Complete Example

```js
import argMate, {helpText} from 'argmate';

const args = process.argv.slice(2);
const params = {
	start: {
		default: 0,
		alias: ['s'],
	},
	steps: {
		type: 'number',
		mandatory: true,
		alias: ['l', 'loops'],
		valid: v => v > 0, 			// Call config.error if value is not valid
	},
	help: {
		alias: ['h'],
	},
};

const argv = argMate(args, params);

// If the help flag is set, display the help text and exit.
if (argv.help) {
	console.log(helpText());
	process.exit();
}

// Run a loop based on parsed arguments.
for (let i = argv.start; i < argv.start + argv.steps; i++) {
	console.log(i);
}
```

### Default Behavior

```js
import argMate from 'argmate';

let argv;

// By default, parameters are treated as boolean.
argv = argMate(['--foo', 'bar']);
// Output: {_: ['bar'], foo: true}

// If the type is explicitly set, it will be parsed accordingly.
argv = argMate(['--foo', 'bar'], {foo: {type: 'string'}});
// Output: {_: [], foo: 'bar'}
```

## Configuration

### Params

```js
const params = {
	// The object returned from argMate will have the same propety names as this object
	foo: {
		type: 'string', 				// boolean | string | number/float | int | hex | array/string[] | number[]/float[] | int[] | hex[]
		default: 'val', 				// The default value for the parameter. If the type is not specified, the type will be determined from this field.
		mandatory: true, 				// Calls config.error if the value is not provided. No effect if used in combination with "default".
		alias: [], 						// Other values to be treated as this parameter. Also accepts a single string.
										// If you camelCase the keyword, it will treat kebab-case of the word as an alias
		conflict: [], 					// Other keys to be treated as conflicting. Also accepts a single string.
		valid: () => {}, 				// Function to check if the value is valid (will call config.error if not valid)
		describe: 'Description here', 	// A description of the parameter. Will be used for the helpText (see below).
	},
};
```

### Config

```js
const config = {
	error: msg => {},		// Function to be called when a problem has been detected in the parsing. Defaults to throwing an informative exception (should probably be changed to something more friendly)
	panic: msg => {},		// Function to be called when there is a panic in the engine. Defaults to throwing an informative exception. (Mostly used for development and should probably not be changed.)
	allowUnknown: true, 	// Specify if parameters not described in "params" are allowed. If violated, config.error will be called.
	no: true, 				// Specify if boolean flags with "no-" as the first part will be treated as a negation. If so, --no-foo will result in {'_':[], 'foo': false}. Works well with default: true;
	intro: 'Intro Text', 	// Text to add above the information about each parameter in the help text.
	outro: 'Outro Text', 	// Text to add below the information about each parameter in the help text.
};
```

## Help Text

You can call `helpText()` after invoking `argMate()` to get a CLI-friendly description of the options.

```js
import argMate, {helpText} from 'argmate';

const argv = argMate(
	process.argv.slice(2),
	{
		foo: {type: 'string'},
		foo2: {type: 'string'},
	},
	{
		intro: 'Introduction here', 	// Text to add above the information about each parameter in the help text.
		outro: 'See you later!', 		// Text to add below the information about each parameter in the help text.
	}
);

console.log(
	helpText({
		width: 100,			// Max character limit in the width of the output.
		format: 'cli', 		// cli | markdown
		voidIntro: false, 	// Avoid including the intro.
		voidOutro: false, 	// Avoid including the outro.
	})
);
```

---

Please note that argMate is an [OPEN open source software](http://open-oss.com) project.
This means that individuals making significant and valuable contributions are given commit access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.

[![OPEN open source software](https://img.shields.io/badge/Open--OSS-%E2%9C%94-brightgreen.svg)](http://open-oss.com)

## License

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fmathiasrw%2Fargmate.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fmathiasrw%2Fargmate?ref=badge_large)
