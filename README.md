[![CI-test](https://github.com/mathiasrw/argmate/workflows/CI-test/badge.svg)](https://github.com/mathiasrw/argmate/actions)
[![NPM downloads](https://img.shields.io/npm/dm/argmate.svg?style=flat&label=npm%20downloads)](https://npm-stat.com/charts.html?package=argmate)
[![npm version](https://badge.fury.io/js/argmate.svg)](https://www.npmjs.com/package/argmate)
[![FOSSA Status](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://app.fossa.io/projects/git%2Bgithub.com%2Fmathiasrw%2Fargmate?ref=badge_shield)
[![OPEN open source software](https://img.shields.io/badge/Open--OSS-%E2%9C%94-brightgreen.svg)](http://open-oss.com)

# ArgMate

> _Your go-to companion for lightning-fast CLI parameter parsing, seasoned with a handful of convenient features to make your development experience so much smoother._

While developing [AlaSQL](https://www.npmjs.com/package/alasql) and [RexReplace](https://www.npmjs.com/package/rexreplace), I've always been caught between two types of CLI parsers. On one hand, there are feature-rich options like [yargs](https://www.npmjs.com/package/yargs) and [commander](https://www.npmjs.com/package/commander), which, despite their heavy startup time, provide key elements such as easy defaults, smooth validation, and well-structured CLI help text output. On the other hand, faster alternatives like [minimist](https://www.npmjs.com/package/minimist) and [mri](https://www.npmjs.com/package/mri) excelled in performance but lacked in development experience.

After yet again uncovering a performance hit from using a heavyweight parser, I decided to solve this issue once and for all. Meet ArgMate: a CLI parameter parser that's as efficient as [mri](https://www.npmjs.com/package/mri) and nearly as feature-rich as [yargs](https://www.npmjs.com/package/yargs).

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
		valid: v => v > 0, // Call config.error if value is not valid
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
		type: 'string', // boolean | string | number/float | int | hex | array/string[] | number[]/float[] | int[] | hex[]
		default: 'val', // The default value for the parameter. If the type is not specified, the type will be determined from this field.
		mandatory: true, // Calls config.error if the value is not provided. No effect if used in combination with "default".
		alias: [], // Other values to be treated as this parameter. Also accepts a single string.
		// If you camelCase the keyword, it will treat kebab-case of the word as an alias
		conflict: [], // Other keys to be treated as conflicting. Also accepts a single string.
		valid: () => {}, // Function to check if the value is valid (will call config.error if not valid)
		describe: 'Description here', // A description of the parameter. Will be used for the helpText (see below).
	},
};
```

### Config

```js
const config = {
	error: msg => {}, // Function to be called when a problem has been detected in the parsing. Defaults to throwing an informative exception (should probably be changed to something more friendly)
	panic: msg => {}, // Function to be called when there is a panic in the engine. Defaults to throwing an informative exception. (Mostly used for development and should probably not be changed.)
	allowUnknown: true, // Specify if parameters not described in "params" are allowed. If violated, config.error will be called.
	no: true, // Specify if boolean flags with "no-" as the first part will be treated as a negation. If so, --no-foo will result in {'_':[], 'foo': false}. Works well with default: true;
	intro: 'Intro Text', // Text to add above the information about each parameter in the help text.
	outro: 'Outro Text', // Text to add below the information about each parameter in the help text.
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
		intro: 'Introduction here', // Text to add above the information about each parameter in the help text.
		outro: 'See you later!', // Text to add below the information about each parameter in the help text.
	}
);

console.log(
	helpText({
		width: 100, // Max character limit in the width of the output.
		format: 'cli', // cli | markdown
		voidIntro: false, // Avoid including the intro.
		voidOutro: false, // Avoid including the outro.
	})
);
```

---

Please note that RexReplace is an [OPEN open source software](http://open-oss.com) project.
This means that individuals making significant and valuable contributions are given commit access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.

[![OPEN open source software](https://img.shields.io/badge/Open--OSS-%E2%9C%94-brightgreen.svg)](http://open-oss.com)

## License

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fmathiasrw%2Fargmate.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fmathiasrw%2Fargmate?ref=badge_large)
