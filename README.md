
![mamate](https://github.com/mathiasrw/argmate/assets/1063454/b63fe097-dc1b-49c2-919e-cd665024e34d)

# ArgMate

[![CI-test](https://github.com/mathiasrw/argmate/workflows/CI-test/badge.svg)](https://github.com/mathiasrw/argmate/actions)
[![NPM downloads](https://img.shields.io/npm/dm/argmate.svg?style=flat&label=npm%20downloads)](https://npm-stat.com/charts.html?package=argmate)
[![npm version](https://badge.fury.io/js/argmate.svg)](https://www.npmjs.com/package/argmate)
[![FOSSA Status](https://img.shields.io/badge/license-CC%20BY-brightgreen.svg)](https://app.fossa.io/projects/git%2Bgithub.com%2Fmathiasrw%2Fargmate?ref=badge_shield)
[![OPEN open source software](https://img.shields.io/badge/Open--OSS-%E2%9C%94-brightgreen.svg)](http://open-oss.com)



> _Your go-to mate for CLI parameter parsing. Friendly, faster than a cut snake, and with added sprinkles of convenience to make your development experience a breeze. Only 6KB and zero dependencies - cheers!_

While developing tools like [AlaSQL](https://www.npmjs.com/package/alasql) and [RexReplace](https://www.npmjs.com/package/rexreplace), I've often been torn between two types of CLI parsers. On one hand, there are feature-rich options like [yargs](https://www.npmjs.com/package/yargs) and [commander](https://www.npmjs.com/package/commander). Despite their heavy startup time, these parsers provide useful features like easy defaults, smooth validation, and well-structured CLI help text output. On the other hand, simpler alternatives like [nopt](https://www.npmjs.com/package/nopt) and [mri](https://www.npmjs.com/package/mri) excel in performance but lack in development experience. After uncovering yet another performance hit from using a heavyweight parser, I decided to solve this issue once and for all.

```
Benchmark:
argMate         9,089,813 ops/sec ±2.15% (98 runs sampled)        1x
nopt            2,070,397 ops/sec ±1.21% (94 runs sampled)        4x
mri             1,832,768 ops/sec ±0.13% (99 runs sampled)        5x
minimist        706,265 ops/sec ±1.05% (94 runs sampled)         13x
yargs-parser    67,417 ops/sec ±0.39% (97 runs sampled)         135x
```

**Meet ArgMate**, a CLI parameter parser that's not just fast - it's 4-5 times faster than other parsers focused on speed, while still being feature-rich. _But how?!?_ A computer processes instructions at a set pace. To get results faster, the only option is to do fewer things. By minimising how many times variables are touched and keeping those operations close together, the implementation enables efficient caching of data, resulting in fewer CPU cycles to get stuff done.

## Installation

```sh
yarn add argmate
# or
npm install argmate
```

## Usage

```js
argMate(arguments, [parameterDetails [, config ]]);
```

## Examples

### Getting started

ArgMate follows traditional CLI notations - similar to yargs and mri. Here are some simple examples:

```js
import argMate from 'argmate';

let argv;

// By default, parameters are treated as boolean flags
// Non-parameters are stored in the `_` property of the output
argv = argMate(['--foo', 'bar', '-i']);
// {_: ['bar'], foo: true, i: true}

// Use the `=` notation for assignment, with or without seperation to the value
// Type is inferred from the value (string or number)
argv = argMate(['--foo=', 'bar', '-i=123']);
// {_: [], foo: 'bar', i: 123}

// Setting a default value makes the parser treat it as a parameter that must be assigned
// The type is guessed based on the default value
argv = argMate(['--foo', 'bar2'], { foo: 'bar', i: 42 });
// {_: [], foo: 'bar2', i: 42}

// Example running params from CLI `node index.js --foo=bar -X .md`
argv = argMate(process.argv.slice(2));
// { _: ['.md'], foo: "bar", X: true }
```

### Default values and limiting input to known parameters

You can provide default values and enforce that no unknown parameters are allowed:

```js
import argMate from 'argmate';

const args = process.argv.slice(2);

// Define parameter types and default values
const params = {
	foo: 10,	// --foo is expected to be an integer, default: 10
	bar: false  // --bar is expected to be a boolean, default: false
};

const config = {
	allowUnknown: false  // Only allow specified parameters (--foo and --bar)
};

const argv = argMate(args, params, config);
```

Same example but a bit shorter

```js
import argMate from 'argmate';

const argv = argMate(process.argv.slice(2), 
	{
		foo: 10,   
		bar: false 
	}, {
		allowUnknown: false 
	});
```

### Real world example

Here's a more comprehensive example demonstrating additional features:

```javascript
import argMate, { argInfo } from 'argmate';

const args = process.argv.slice(2);

const params = {
	start: {
		default: 0,
		alias: ['s']
	},
	steps: {
		type: 'number',
		mandatory: true,
		alias: ['l', 'loops'],
		valid: v => v > 0  // Validate the input
	},
	help: {
		alias: ['h']
	}
};

const config = {
	allowUnknown: false,
	error: msg => {
		console.error('Error:', msg);
		process.exit(1);
	}
};

const argv = argMate(args, params, config);

// Display help and exit if the help flag is set
if (argv.help) {
	console.log(argInfo());
	process.exit(0);
}

// Use the parsed arguments
for (let i = argv.start; i < argv.start + argv.steps; i++) {
	console.log(i);
}
```


### Enforcing parameter types and limiting allowed values

You can provide default values and enforce that no other parameters are allowed:

```js
import argMate from 'argmate';

const args = process.argv.slice(2);

// Define parameter types and default values
const params = {
    foo: 10,    // --foo is expected to be an integer, default: 10
    bar: false  // --bar is expected to be a boolean, default: false
};

const config = {
    allowUnknown: false  // Only allow specified parameters (--foo and --bar)
};

const argv = argMate(args, params, config);
```

Same example but a bit shorter

```js
import argMate from 'argmate';

const argv = ArgMate(process.argv.slice(2), 
	{
		foo: 10,   
		bar: false 
	}, {
    	allowUnknown: false 
	});
```

### Real world example

Here's a more comprehensive example demonstrating additional features:

```javascript
import argMate, { argInfo } from 'argmate';

const args = process.argv.slice(2);

const params = {
    start: {
        default: 0,
        alias: ['s']
    },
    steps: {
        type: 'number',
        mandatory: true,
        alias: ['l', 'loops'],
        valid: v => v > 0  // Validate the input
    },
    help: {
        alias: ['h']
    }
};

const config = {
    allowUnknown: false,
    error: msg => {
        console.error('Error:', msg);
        process.exit(1);
    }
};

const argv = argMate(args, params, config);

// Display help and exit if the help flag is set
if (argv.help) {
    console.log(argInfo());
    process.exit(0);
}

// Use the parsed arguments
for (let i = argv.start; i < argv.start + argv.steps; i++) {
    console.log(i);
}
```


## Configuration

### Params

```js
const params = {
	// The object returned from argMate will only have propety names provided in this object (foo in this example)
	foo: {
		type: 'string', 				// boolean | string/number | float | int | hex | array/string[] | number[]/float[] | int[] | hex[]. Optional. Defaults to boolean.
		default: 'val', 				// The default value for the parameter. If the type is not specified, the type will be determined from this field. Optional. 
		mandatory: true, 				// Calls config.error if the value is not provided. No effect if used in combination with "default".
		alias: [], 						// Other values to be treated as this parameter. Also accepts a string with a single value.
										// If you camelCase the property name, it will treat kebab-case of the word as an alias (so fooBar will automaticly have foo-bar as alias)
		conflict: [], 					// Other keys to be treated as conflicting. Also accepts a single string.
		valid: () => {}, 				// Function to check if the value is valid (will call config.error if not valid)
		describe: 'Description here', 	// A description of the parameter. Will be used for the help text (see below).
	},
};
```

### Config

```js
const config = {
	error: msg => {},		// Function to be called when a problem has been detected in a validation. Defaults to throwing an informative exception
	panic: msg => {},		// Function to be called when there is a panic in the engine. Defaults to throwing an informative exception. 
	allowUnknown: true, 	// Specify if parameters not described in "params" are allowed. If violated, config.error will be called.
	no: true, 				// Specify if boolean flags with "no-" as the first part will be treated as a negation. If so, --no-foo will result in {'_':[], 'foo': false}. Works well with default: true;
	intro: 'Intro Text', 	// Text to add above the information about each parameter in the help text.
	outro: 'Outro Text', 	// Text to add below the information about each parameter in the help text.
};
```

### Help Text

You can call `argInfo()` after invoking `argMate()` to get a CLI-friendly description.

```js
import argMate, {argInfo} from 'argmate';

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
	argInfo({
		width: 100,			// Max character limit of the width of the output. 
		format: 'cli', 		// cli | markdown. Default CLI. 
		voidIntro: false, 	// Avoid including the intro. Default false.
		voidOutro: false, 	// Avoid including the outro. Default false .
	})
);
```

## Notes
- If you provide array kind of types (like string[]) you can trust the value is alwas an array. If no values provided the array is emptly. 
- If you provide the same alias to two parameters, the alias will stay with the first parameter you define. 
- Demonstrate how to use macros to pregenerate engineConfig to make things even faster. manual or via https://bun.sh/docs/bundler/macros - https://bun.sh/docs/bundler/macros#export-condition-macro

###

- Lite will not convert your 0x prepended hexvalues to int

---

Please note that argMate is an [OPEN open source software](http://open-oss.com) project.
This means that individuals making significant and valuable contributions are given commit access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.

[![OPEN open source software](https://img.shields.io/badge/Open--OSS-%E2%9C%94-brightgreen.svg)](http://open-oss.com)

## License

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fmathiasrw%2Fargmate.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fmathiasrw%2Fargmate?ref=badge_large)


