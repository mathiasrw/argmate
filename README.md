![ArgMate](https://github.com/mathiasrw/argmate/assets/1063454/b63fe097-dc1b-49c2-919e-cd665024e34d)

# ArgMate

[![CI-test](https://github.com/mathiasrw/argmate/workflows/CI-test/badge.svg)](https://github.com/mathiasrw/argmate/actions)
[![NPM downloads](https://img.shields.io/npm/dm/argmate.svg?style=flat&label=npm%20downloads)](https://npm-stat.com/charts.html?package=argmate)
[![npm version](https://badge.fury.io/js/argmate.svg)](https://www.npmjs.com/package/argmate)
[![FOSSA Status](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://app.fossa.io/projects/git%2Bgithub.com%2Fmathiasrw%2Fargmate?ref=badge_shield)
[![OPEN open source software](https://img.shields.io/badge/Open--OSS-%E2%9C%94-brightgreen.svg)](http://open-oss.com)



> _Your go-to mate for CLI parameter parsing. Friendly, faster than a cut snake, and with added sprinkles of convenience to make your development experience a breeze. Only 6KB and zero dependencies - cheers!_

While developing tools like [AlaSQL](https://www.npmjs.com/package/alasql) and [RexReplace](https://www.npmjs.com/package/rexreplace), I've often been torn between two types of CLI parsers. On one hand, there are feature-rich options like [yargs](https://www.npmjs.com/package/yargs) and [commander](https://www.npmjs.com/package/commander). Despite their heavy startup time, these parsers provide useful features like easy defaults, smooth validation, and well-structured CLI help text output. On the other hand, simpler alternatives like [nopt](https://www.npmjs.com/package/nopt) and [mri](https://www.npmjs.com/package/mri) excel in performance but lack in development experience. After uncovering yet another performance hit from using a heavyweight parser, I decided to solve this issue once and for all.

```
Benchmark:
argmate         9,089,813 ops/sec ±2.15% (98 runs sampled)        1x
nopt            2,070,397 ops/sec ±1.21% (94 runs sampled)        4x
mri             1,832,768 ops/sec ±0.13% (99 runs sampled)        5x
minimist        706,265 ops/sec ±1.05% (94 runs sampled)         13x
yargs-parser    67,417 ops/sec ±0.39% (97 runs sampled)         135x
```

**Meet ArgMate**, a CLI parameter parser that's not just fast - it's 4-5 times faster than other parsers focused on speed, while still being feature-rich. _But how?!?_ A computer processes instructions at a set pace. To get results faster, the only option is to do fewer things. By minimising how many times variables are touched and keeping those operations close together, the implementation enables efficient caching of data, resulting in fewer CPU cycles to get stuff done.

## Usage

```sh
bun add argmate
# or
yarn add argmate
# or
npm install argmate
````

## Examples


Getting parameters from CLI command `node index.js --foo=bar -X .md`

```js
import argMate from 'argmate';
let argv;
argv = argMate(process.argv.slice(2)); // Slice(2) to ignore the node executable and the path to your script
console.log(argv);
// {foo: "bar", X: true, _: ['.md']}
```


By default, parameters are treated as boolean flags. Non-parameters are stored in the `_` property of the output


```js
argMate(['--foo', 'bar', '-i']);
// {_: ['bar'], foo: true, i: true}
```




Use the `=` notation for assignment, with or without separation to the value. Type is inferred from the value (string or number).

```js
argMate(['--foo=', 'bar', '-i=123']);
// {_: [], foo: 'bar', i: 123}
```

Setting a default value of a parameter in the config will ensure the parameter is always present in the output. The type is derived from the default value.

```js
argMate(['--foo', 'bar2'], { foo: 'bar', i: 42 });
// {_: [], foo: 'bar2', i: 42}
```


### Default values and limiting input to known parameters

You can provide default values and enforce that no unknown parameters are allowed:

```js
import argMate from 'argmate';

const args = process.argv.slice(2);

// Define what parameters you expect
const config = {
	foo: {default: 10},	// --foo is expected to be an integer and will defaults to 10 if not set
	bar: {default: false}  // --bar is expected to be a boolean and will default to false if not set
};

// Define how argMate is to behave
const settings = {
	allowUnknown: false  // Only allow specified parameters (--foo and --bar)
};

const argv = argMate(args, config, settings);
```

Same example but a bit shorter

```js
import argMate from 'argmate';

const argv = argMate(process.argv.slice(2), 
	{
		foo: 10,   // shorthand for {default: 10} is to set the default value directly
		bar: false // shorthand for {default: false} is to set the default value directly
	}, {
		allowUnknown: false 
	});
```

### Real world example

Here's a more comprehensive example demonstrating additional features:

```javascript
import argMate, { argInfo } from 'argmate';

const args = process.argv.slice(2);

const config = {
	start: {
		default: 0,
		alias: ['s']
	},
	steps: {
		type: 'int',
		mandatory: true,
		alias: ['l', 'loops'],
		validate: v => v > 0  // Validate the input is larger than zero
	},
	help: {
		alias: ['h']
	}
};

const settings = {
	allowUnknown: false,
	error: msg => {
		console.error('Error:', msg);
		process.exit(1);
	}
};

const argv = argMate(args, config, settings);

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




## API Reference

The `argMate` function has the following signature:

```javascript
argMate(<arguments>, [<config> [, <settings> ]]);
```

### Parameter Configuration

The second argument is a config object that defines the parameters you expect, their types, aliases, and behavior.

```javascript
const config = {
	// Each key corresponds to a parameter name (e.g., --hight)
	hight: {
		// The expected data type.
		// Can be: 'string', 'boolean', 'bool', 'number', 'int', 'float', 'hex', 
		// or array types: 'string[]', 'boolean[]', 'bool[]', 'number[]', 'int[]', 'float[]', 'hex[]'
		// `array` is an alias for `string[]`.
		// If not set, type is detemined form the value of  from `default`, or defaults to boolean.
		type: 'int',

		// The default value if the parameter is not provided in the input.
		// If type is not specified, the type will be determined from the default value.
		default: 'val',

		// A list of alternate names for the parameter.
		// can also be a string witn a single value or comma seperated values
		alias: ['s'],

		// An array of other parameters that cannot be used in the same input.
		// can also be a string witn a single value or comma seperated values
		conflict: ['range'],

		// A function, a regular expression or an array to validate the parameter's value.
		// The error handler is called if the function returns false, the regular expression
		// does not match (use ^ and $ to match the full value), or the value is not in the array.
		// Alias: valid
		validate: (v) => {v >= 0},

		// A function to modify the value before it's returned.
		transform: (v) => v.trim(),
	
		// Makes the parameter required in the input. The error handler is called if it's missing.
		// Alias: required
		mandatory: false,

		// A description used for generating the help text.
		// Aliases: describe, desc
		description: 'The starting number for the loop.',
	},
};
```

These are all the properties of a parameter. `validate`, `mandatory` and `description` have aliases: `valid`, `required`, and `describe` or `desc`. Use one name only: the canonical name and its alias in the same parameter is a configuration error. Any other property, for example a misspelled `alais`, is a configuration error also: `panic` is called when the config is read, and TypeScript rejects it at compile time.

### Settings

The third argument is a settings object that controls the overall behavior of the parser.

```javascript
const settings = {
	// The function invoked when there's an input error (e.g., validation fails)
	// Defaults to throwing an error.
	error: msg => {throw msg},

	// The function invoked for configuration errors (e.g., invalid config or settings)
	// Defaults to throwing an error.
	panic: msg => {throw msg},

	// Allow any parameter as part of the input
	// If false only parameters defined in the config object are allowed in the input
	allowUnknown: true,

	// Allow allow negating boolean flags with a 'no-' prefix (e.g., --no-color).
	// If false, boolean flags with a 'no-' in front will be treated as any other parameter. 
	allowNegatingFlags: true,

	// Allows short-hand number assignment (e.g., -n100 for n=100)
	// If false, the short-hand number assignment notation will be ginored 
	// (so `-n100` will become `n100 = true` instead of the default behavour of becoming `n=100`).
	allowKeyNumValues: true,

	// If true, allows assignment with '=' (e.g., --foo=bar).
	// If false, parameters with `=` will raise an error instead of assigning 
	// (`--foo=10` will raise error)
	allowAssign: true,

	// If true, converts "true", "yes", "on" to boolean true, and vice-versa for false.
	// If false, strings are not tested for values like "true", "yes", "on" before converted to boolean true 
	// (and vice-versa for false).
	allowBoolString: true,

	// A shorthand to set all `allow*` settings to `false`.
	strict: false,

	// If true, kebab-case args (--foo-bar) automatically become camelCase (fooBar).
	// If false kebab-case input parameters liike (--foo-bar) will not automatically become camelCase (fooBar).
	autoCamelKebabCase: true,

	// If true, inflates dot-notation keys into nested objects.
	// --user.name=mate becomes { user: { name: 'mate' } }
	outputInflate: false,

	// If true, all arguments after a double dash (--) will be merged into one single argument joined by space.
	// Default is false.
	greedy: false,

	// Text to display before the parameter list in the help output.
	intro: 'My Awesome CLI Tool - Usage:',

	// Text to display after the parameter list.
	outro: 'For more help, visit https://example.com',
};
```

### Help Text Generation (`argInfo`)

You can call `argInfo()` after invoking `argMate()` to get a CLI-friendly help description based on your configuration.

```javascript
import argMate, {argInfo} from 'argmate';

const argv = argMate(
	process.argv.slice(2),
	{
		foo: {description: 'A foo parameter.', type: 'string'},
		bar: {description: 'A bar parameter.', alias: 'b'},
	},
	{
		intro: 'Introduction here',
		outro: 'See you later!',
	}
);

console.log(
	argInfo({
		width: 100,			// Max character limit for the output width.
		format: 'cli', 		// 'cli' | 'markdown'. Default is 'cli'.
		showIntro: true, 	// If false, omits the intro text.
		showOutro: true, 	// If false, omits the outro text.
	})
);
```

## Please note
- If you provide array kind of types (like string[]) you can trust the value is always an array. If no values are provided the array is empty. 
- If you don't specify, you get help, but not consistency. If you specify you know exactly what you get. 
 - Unknown parameters will be treated as booleans. If you want to assign a value to an unknown parameter you need to A) define a type or a default value in the config obj, or B) add "=" at the end of the parameter in the inputs.
- If you provide the same alias to two parameters, the alias will stay with the first parameter you define. 
- for defined config you need to provide int, number or float as type for it to be a number in the resulting data object
- but if you have not defined the parameter and assign a value then numerical values will beidentified and provided as a value



## argMateMini

Sometimes all you want is simplicity, speed and a minimal footprint. If you don't need too much magic and convenience, then `argMateMini` is your friend.

```javascript
import argMate from 'argmate/mini';
```

`argMateMini` contains all the essence of CLI parsing and, to be frank, will be the best fit for most use cases. But compared to its big brother `argMate` it has:

- No parameter conflict detection
- No emojis and fancy unicode in parameter names

It also does not recognise the slightly more exotic traditions in CLI parameter formats:

- No flag negation like the `--no-flag` syntax
- No ultra-short assignments like `-r255` as a shorthand for `-r=255`

Only numeric values are auto-converted, all other values remain strings:

- No auto hex conversion for `int` type (but `type: 'hex'` is supported)
- No magic string conversion to boolean from true/false, yes/no, on/off

Everything else is exactly like `argMate`, just faster.


## Type Reference

| Type | ArgMate | ArgMateMini |
|------|---------|-------------|
| `boolean` | Expect a boolean value. `--flag` gives `true`, `--no-flag` gives `false`. Boolean-representative strings can be used for explicit assignments like `--flag=true` (works for `true`, `on`, `yes`, `1`, `false`, `off`, `no` and `0`). | Negation is not supported (`--no-myflag`) and setting booleans from strings is not supported. |
| `bool` | Alias for `boolean` | Same |
| `string` | Expect a string. `--name bob` gives `name: 'bob'`. | Same |
| `int` | Expect integer values. `--count 42` gives `count: 42`. `0x...` values are auto-converted from hex so `--port 0x1f` gives `port: 31`. | No `0x...` conversion of values. |
| `float` | Numeric values. `--rate 3.14` gives `rate: 3.14`. | Same |
| `number`  | Alias for `float` | Same |
| `count` | Counter behaving like a summarised `int[]`. Each plain occurrence adds 1 (`-vvv` gives `v: 3`), and explicit ints add their value (`-v=4 -v -v` gives `v: 6`, `-v=-2` subtracts 2). Non-int assignments error. Negation is not supported (`--no-foo` errors). | Same, except negation is treated as an unknown `noFoo` flag (no error). |
| `hex` | Hexadecimal values. `--id 0xabc` and `--id abc` both give `id: 2748`. | Same |
| `string[]` | Same as `string`. You can provide the parameter multiple times and it will always be an array. | Same |
| `array` | Alias for `string[]` | Same |
| `hex[]` | Same as `hex`. You can provide the parameter multiple times and it will always be an array. | Same |
| `number[]` / `float[]` | Same as `number`. You can provide the parameter multiple times and it will always be an array. | Same |
| `boolean[]` / `bool[]` | Same as `boolean`. You can provide the parameter multiple times and it will always be an array. | Same |
| `int[]` | Same as `int`. You can provide the parameter multiple times and it will always be an array. | Same, but no `0x...` values. Use `type: 'hex[]'` for hex input. |
| derived from default | Type is inferred from the `default` value. `{n: 1}` reads numbers, `{name: 'bob'}` reads strings, `{flag: false}` reads booleans, `{tags: []}` reads string arrays. | Same |
| unspecified | Unknown parameters are booleans: `--flag` gives `flag: true`. Assigned unknown values are auto-converted: `--n=42` gives `n: 42`, `--yes=true` gives `yes: true`, `--name=bob` gives `name: 'bob'`. A separated value is positional: `--name bob` gives `name: true` and `_: ['bob']`. | Same, but only numbers are auto-converted. `--yes=true` gives `yes: 'true'`. |


# Ideas
- ? Flag to autoconvert _ values to int when convertible? (like deno)
- We do not support autoconverting magic strings like "true" and "false" 
	- maybe we should have an option to convert magic strings...
- ? input type json that is parsed and added as data?
- ? comma-separated list to array?
- Demonstrate how to use macros to pregenerate engineConfig to make things even faster. manual or via https://bun.sh/docs/bundler/macros - https://bun.sh/docs/bundler/macros#export-condition-macro
- Add bool as phsynonym for boolean parameter type

 

## License

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fmathiasrw%2Fargmate.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fmathiasrw%2Fargmate?ref=badge_large)


