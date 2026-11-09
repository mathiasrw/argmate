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

Meet ArgMate, a CLI parameter parser that's not just fast - it's 4-5 times faster than other parsers focused on speed, while still being feature-rich. _But how?!?_ A computer processes instructions at a set pace. To get results faster, the only option is to do fewer things. By minimising how many times variables are touched and keeping those operations close together, the implementation enables efficient caching of data, resulting in fewer CPU cycles to get stuff done.

## Usage

```sh
bun add argmate
# or
yarn add argmate
# or
npm install argmate
```

In Deno, import it from npm, or add it from [JSR](https://jsr.io/@mathiasrw/argmate):

```js
import argMate from 'npm:argmate';
```

```sh
deno add jsr:@mathiasrw/argmate
```

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




Use the `=` notation for assignment. Type is inferred from the value (string or number). With nothing after the `=` the value is an empty string, and the next argument is not the value.

```js
argMate(['--foo=bar', '-i=123']);
// {_: [], foo: 'bar', i: 123}

argMate(['--foo=', 'bar']);
// {_: ['bar'], foo: ''}
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

A boolean with `null` as default tells if the flag was given at all: `{debug: null}` gives `debug: null` when the flag is not in the input, `true` for `--debug` and `false` for `--no-debug`.

### Real world example

Here's a more comprehensive example demonstrating additional features:

```javascript
import argMate from 'argmate';
import { argInfo } from 'argmate/info';

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
	error: e => {
		console.error('Error:', e.message);
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
		// Can be: 'string', 'boolean', 'bool', 'number', 'int', 'float', 'hex', 'file', 'folder', 'path',
		// or array types: 'string[]', 'boolean[]', 'bool[]', 'number[]', 'int[]', 'float[]', 'hex[]',
		// 'file[]', 'folder[]', 'path[]'. A file, a folder or a path must be on the disk.
		// `array` is an alias for `string[]`.
		// If not set, type is detemined form the value of  from `default`, or defaults to boolean.
		type: 'int',

		// The default value if the parameter is not provided in the input.
		// If type is not specified, the type will be determined from the default value.
		default: 'val',

		// A list of alternate names for the parameter.
		// can also be a string witn a single value or comma seperated values
		alias: ['s'],

		// An array of other parameters that cannot be used in the same input, by any of their names.
		// can also be a string witn a single value or comma seperated values
		conflict: ['range'],

		// The input in this spot, counted from 1 (-1 is the last one, -2 the second last). It is taken
		// before the parse, so a value like `-x` is not read as a parameter. A string unless a type
		// is given. A boolean reads a boolean string like `yes`.
		// spot: 1,

		// The inputs after the parameter: `next: 2` takes two, `next: -1` takes the rest.
		// A value with `=` is an error (`--files=a`).
		// `last: 2` takes the last two inputs, `last: -2` takes from the second after the parameter.
		// The type must be an array type, `string[]` when none is given. Use one of `spot`, `next` and `last`.
		// next: 2,

		// Other parameters that must be in the input when this one is, by any of their names.
		// can also be a string witn a single value or comma seperated values
		demand: ['loops'],

		// The list of valid values. Only a list. The first one is the default. An item can be
		// [value, ...aliases]: a string is an alias the help shows, an array holds hidden aliases.
		// An alias in the input gives the value, before `transform`. The list is case sensitive.
		valid: [['natural', 'n', ['nat']], 'ascii'],

		// A function or a regular expression that checks the value, in place of the check of the list.
		// A list here is the list of `valid`. The function gets the value and the `valid` list, with each item as [value, ...aliases].
		// It returns true or nothing to pass, false for the standard message, or a string as the message.
		// A regular expression must match (use ^ and $ to match the full value).
		validate: (v) => v >= 0 || `${v} is negative`,

		// A function to modify the value before it's returned. It runs after an alias of `valid`
		// becomes its value and before `validate`, so `validate` checks the transformed value.
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

These are all the properties of a parameter. `mandatory` and `description` have aliases: `required`, and `describe` or `desc`. Use one name only: the canonical name and its alias in the same parameter is a configuration error. `valid` takes a list only, and a list in `validate` goes to `valid`. A list in both is a configuration error. Any other property, for example a misspelled `alais`, is a configuration error also: `panic` is called when the config is read, and TypeScript rejects it at compile time.

### Settings

The third argument is a settings object that controls the overall behavior of the parser.

```javascript
const settings = {
	// The function invoked when there's an input error (e.g., validation fails).
	// It gets an error object (see below). Defaults to throwing an Error with its message and properties.
	error: e => {throw Object.assign(new Error(e.message), e)},

	// The function invoked for configuration errors (e.g., invalid config or settings).
	// It gets the message as a string. Defaults to throwing an Error.
	panic: msg => {throw new Error(msg)},

	// Allow any parameter as part of the input
	// If false only parameters defined in the config object are allowed in the input
	allowUnknown: true,

	// Allow allow negating boolean flags with a 'no-' prefix (e.g., --no-color).
	// If false, boolean flags with a 'no-' in front will be treated as any other parameter. 
	allowNegatingFlags: true,

	// Allows short-hand number assignment (e.g., -n100 for n=100, -ab12 for a and b=12)
	// If false, `-n100` is the string '-n100' in `_`.
	allowKeyNumValues: true,

	// If true, allows assignment with '=' (e.g., --foo=bar).
	// If false, a value with `=` is the input error ASSIGN_NOT_ALLOWED (`--foo=10`).
	// A value as the next word is still allowed (`--foo 10`).
	allowAssign: true,

	// If true, a value without a type that is an int, a float or scientific notation becomes a number:
	// `5`, `-1.5` and `--n=1e3` give 5, -1.5 and 1000. Hexadecimal and leading zeros stay strings.
	// If false, every value of unspecified type stays a string. A specified type is not changed by this.
	allowAutoNumbers: true,

	// A shorthand to set all `allow*` settings to `false`. A setting that is also given wins.
	strict: false,

	// If true, kebab-case args (--foo-bar) automatically become camelCase (fooBar).
	// If false kebab-case input parameters liike (--foo-bar) will not automatically become camelCase (fooBar).
	autoCamelKebabCase: true,

	// If true, each alias is in the result too, with the same value as the name.
	// Handy for code that reads argv.f where the config says file.
	outputAlias: false,

	// If true, inflates dot-notation keys into nested objects.
	// --user.name=mate becomes { user: { name: 'mate' } }
	outputInflate: false,

	// If true, all arguments after a double dash (--) will be merged into one single argument joined by space.
	// Default is false.
	greedy: false,

	// If true, the message of an input error has the help for its parameters below it:
	// one row, or both rows of a conflict. A name that is not in the config gets no help.
	// The program must import 'argmate/info' (see Help text), or the config is an error.
	argInfoOnError: false,

	// A function that checks the parameters together, after all the other checks. It gets the result,
	// which it may change. It returns true or nothing to pass, false for the standard message,
	// or a string as the message. The error code is CROSS_VALIDATE.
	crossValidate: argv => !(argv.jsPipe && argv.replacementPipe) || 'Pipe the code or the replacement, not both',
};
```

The text of the help, `intro` and `outro`, is in the config, next to the parameters: see Help text below.

### Negative numbers

A word with one dash and a number is a negative number, and goes to `_`: `-5`, `-1.5` and `-1e3` give `-5`, `-1.5` and `-1000`. With `allowAutoNumbers: false` they are strings. A word that looks like a number but is not one (`-0x10`, `-.5`, `-007`, `-5px`) goes to `_` as a string.

A name of only digits must be in the config: `--5` and `-5=3` are the input error `NUMBER_NAME`, and with `{5: {type: 'int'}}`, `-5=3` gives `5: 3`. When the config has the first character, the word is a short group: with `{5: false}`, `-5` gives `5: true`, and with `{1: {type: 'int'}}`, `-12` gives `1: 2`.

```js
argMate(['--offset', '-5', '-3', 'file.txt'], {offset: {type: 'int'}});
// {_: [-3, 'file.txt'], offset: -5}
```

### Errors

An input error calls `error` with an object:

| Property | Content |
| --- | --- |
| `code` | One of `UNKNOWN`, `MISSING_VALUE`, `INVALID`, `CONFLICT`, `DEMAND`, `MANDATORY`, `BAD_TYPE`, `BAD_VALUE`, `NEGATED_AND_ASSIGNED`, `ASSIGN_NOT_ALLOWED`, `NUMBER_NAME`, `CROSS_VALIDATE` (see Error codes under Details) |
| `key` | The parameter, by its config name |
| `alias` | The name as typed, with its dashes, like `--sort` or `-Z` |
| `value` | The value, when the error is about one |
| `with` | The other parameter, by its config name, for `CONFLICT` and `DEMAND` |
| `withAlias` | The other parameter as typed |
| `valid` | The list of valid values, or the regular expression, for `INVALID` |
| `message` | A text that says what is wrong |

```js
argMate(args, config, {
	error: e => {
		console.error(argInfo());
		console.error(e.code === 'UNKNOWN' ? `Unknown argument: ${e.alias}` : e.message);
		process.exit(3);
	},
});
```

In a string the object is its message, so `'Error: ' + e` gives the text. The default `error` throws an `Error` with the message, and with the properties of the object on it. Its stack starts at the code that called `argMate`. The mini engine gives only `code`, `key` and `message`.

### Help text (`argInfo`)

`argInfo()` gives the help for a config. It works before a parse, after a parse and in the `error` callback. With no config it uses the config of the last parse. It never merges two configs, so for the help of another config, or before a parse, give the config in the options: `argInfo({config})`.

The help code is not in the `argmate` entry. `argInfo` comes from `argmate/info`, so a program that never prints help does not load the help code (the program starts faster). Two rules follow:

- Import `argInfo` from `argmate/info`. `argmate` does not export it.
- The setting `argInfoOnError` works only in a program that imports `argmate/info`. A bare `import 'argmate/info';` is enough. With `argInfoOnError: true` and no such import, `argMate` throws a config error that says what to import.

A bundler follows the plain import, so a bundled program holds the help code only when it imports `argmate/info`. The same rules hold for `argmate/mini`.

```javascript
import argMate from 'argmate';
import {argInfo} from 'argmate/info';

const config = {
	intro: [
		'MyTool 1.2: does the thing.',
		['Usage', '$0 pattern replacement [file|option]+'],
		[
			'Examples',
			[['$0 foo bar', 'a.md'], 'Replace foo with bar in a.md'],
			[['$0 "^#" "##"', '*.md'], 'Move every headline one level down'],
			[['$0 -V foo bar', 'a.md'], 'The same, and say what it does'],
			['$0 --version', 'Show the version'],
		],
	],
	outro: 'More: https://example.com',

	verbose: {alias: 'V', description: 'More chatty output'},
	engine: {valid: ['V8', 'RE2'], description: 'The regex engine'},
	output: {type: 'string', alias: 'o', default: 'out.txt', description: 'Where to write'},
};

const argv = argMate(process.argv.slice(2), config);
console.log(argInfo());
```

gives

```
MyTool 1.2: does the thing.

Usage:
  mytool pattern replacement [file|option]+

Examples:
  mytool foo bar     a.md   Replace foo with bar in a.md
  mytool "^#" "##"   *.md   Move every headline one level down
  mytool -V foo bar  a.md   The same, and say what it does
  mytool --version          Show the version

Options:
  -V  --verbose   More chatty output [boolean]
      --engine    The regex engine [V8, RE2] =V8
  -o  --output    Where to write [string=out.txt]

More: https://example.com
```

The text is arrays in arrays, and the depth gives the meaning:

| Depth | A string | An array |
|---|---|---|
| `intro` and `outro` | A paragraph | A section |
| In a section | The heading when it is first, else a line | A row of a table |
| In a row | A cell | A cell split into columns, one for each string |

- A row with one string is the same as a line. A row with three strings has three cells.
- A cell that is an array is split into columns, and a row whose cell is a string spans them: `mytool --version` above.
- The rows of a section are one table: the columns line up, and the last column wraps at `width`. A long text wraps in its cell and makes the row taller.
- An empty string or an empty array in a section is a blank line.
- The options table is a section with the heading `Options`, after `intro` and before `outro`. A row has the short flag, the long names, the description and the tags: the type, `=` and the default, the valid values with the aliases that the help shows and then the default, which is the first value when the config has none (`[V8/v8, RE2/re2] =V8`), or the regular expression (`[/^\d+$/]`). A `validate` function gives only the type.
- A parameter with no one-character name has an empty short column. The name comes before its aliases: `-l  --steps, --loops`.
- A column with no text takes no room.
- The text of a row goes on the lines below the row when its longest word does not fit beside the other columns, or when the space there is less than `minColumnWidth`. An empty line is before and after such a row.
- `$0` is the name of the running script.
- `intro` and `outro` are help text, not parameters.

`argInfo` takes one object of options:

```javascript
argInfo({
	config,             // The parameters, intro and outro. Default: the config of the last parse
	settings,           // The engine settings, like autoCamelKebabCase. Default: those of the last parse
	include: [],        // Words of a command line: only the parameters they name. Empty: all of them
	exclude: [],        // Words of a command line: never the parameters they name
	intro, outro,       // In place of the intro and the outro of the config
	width: 120,         // The longest line: the width of the terminal, and no more than 120
	minColumnWidth: 30, // The narrowest the last column of a table gets before its text goes below the row
	format: 'cli',      // 'cli', 'markdown' or 'json'
	showIntro: true,    // false leaves out the intro
	showOutro: true,    // false leaves out the outro
});
```

`include` and `exclude` filter the options table. They take the words of a command line, so the input of the program can go in as it is. ArgMate never decides that a help flag wins over an error, but this gives a program what it needs to do so:

```javascript
argInfo({
	config,
	include: process.argv.slice(2),
	exclude: ['-h'],
	intro: 'Help for the options you gave:',
	outro: 'All the options: $0 --help',
});
```

`mytool -V foo bar --output=x.md -h` gives

```
Help for the options you gave:

Options:
  -V  --verbose   More chatty output [boolean]
  -o  --output    Where to write [string=out.txt]

All the options: mytool --help
```

- A word names a parameter by its key, an alias or its kebab-case form, with its dashes. `--no-` before a name also names it. One dash too few or too many still names it, as that is a reason to ask for help: `-output` names `--output`, and `--V` names `-V`.
- The words are read as in a parse, with no config: `-Vo` names `-V` and `-o`, `--output=x.md` names `--output`, and a value, an unknown name or a word after `--` names nothing. In `-o verbose`, the word `verbose` is a value.
- `exclude` wins over `include`. An empty `include` means all the parameters.
- When no parameter is left, there is no options table. With `format: 'json'`, `params` has the parameters that are left.

With `format: 'markdown'` a heading is a `##` heading, a paragraph and a line stay text, and the rows of a section are a markdown table that can be pasted into a README. A `|` in a cell is escaped and a line break becomes a space, so a row stays one row. With `format: 'json'` you get the config as you wrote it.

## Please note
- ArgMate never prints and never exits. A `--help` or `--version` flag is a boolean like any other, and your program decides what to do with it:

  ```js
  import argMate from 'argmate';
  import {argInfo} from 'argmate/info';

  const argv = argMate(process.argv.slice(2), {help: {alias: 'h'}, version: {alias: 'v'}});
  if (argv.help) console.log(argInfo()), process.exit(0);
  if (argv.version) console.log(pkg.version), process.exit(0);
  ```

  The same goes for errors: the default `error` throws, and you catch it or give your own `error` to print and exit the way your tool likes.

  With `argInfoOnError: true` the message of an input error has the help for its parameters below it. The program must import `argmate/info`. The error is thrown or goes to your `error` as before:

  ```js
  import argMate from 'argmate';
  import 'argmate/info';

  argMate(['-f', 'a.sql', '--stdin'], {
  	file: {alias: 'f', type: 'string', description: 'The SQL file to run'},
  	stdin: {description: 'Read the SQL from stdin', conflict: 'file'},
  }, {argInfoOnError: true});
  // Error: The parameter '--stdin' conflicts with '-f'
  //
  // Options:
  //   -f  --file    The SQL file to run [string]
  //       --stdin   Read the SQL from stdin [boolean]
  ```
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

Values of a specified type convert less:

- No auto hex conversion for `int` type (but `type: 'hex'` is supported)
- No conversion of `true`, `yes`, `on`, `false`, `no` and `off` for a `boolean` parameter

Everything else is exactly like `argMate`, just faster.

# Sleazy details 


## Type Reference

| Type | ArgMate | ArgMateMini |
|------|---------|-------------|
| `boolean` | Expect a boolean value. `--flag` gives `true`, `--no-flag` gives `false`. Boolean-representative strings can be used for explicit assignments like `--flag=true` (works for `true`, `on`, `yes`, `1`, `false`, `off`, `no` and `0`). | Negation is not supported (`--no-myflag`) and setting booleans from strings is not supported. |
| `bool` | Alias for `boolean` | Same |
| `string` | Expect a string. `--name bob` gives `name: 'bob'`. | Same |
| `int` | Expect integer values. `--count 42` gives `count: 42`. `0x...` values are auto-converted from hex so `--port 0x1f` gives `port: 31`. | No `0x...` conversion of values. |
| `float` | Numeric values. `--rate 3.14` gives `rate: 3.14`. | Same |
| `number`  | Alias for `float` | Same |
| `count` | Counter behaving like a summarised `int[]`. Each plain occurrence adds 1 (`-vvv` gives `v: 3`), and explicit ints add their value (`-v=4 -v -v` gives `v: 6`, `-v=-2` subtracts 2). Non-int assignments error. Negation is not supported (`--no-foo` is the error `BAD_TYPE`). | Same, except negation is treated as an unknown `noFoo` flag (no error). |
| `hex` | Hexadecimal values. `--id 0xabc` and `--id abc` both give `id: 2748`, and `--id -ff` gives `id: -255`. | Same |
| `string[]` | Same as `string`. You can provide the parameter multiple times and it will always be an array. | Same |
| `array` | Alias for `string[]` | Same |
| `hex[]` | Same as `hex`. You can provide the parameter multiple times and it will always be an array. | Same |
| `number[]` / `float[]` | Same as `number`. You can provide the parameter multiple times and it will always be an array. | Same |
| `boolean[]` / `bool[]` | Same as `boolean`. You can provide the parameter multiple times and it will always be an array. | Same |
| `int[]` | Same as `int`. You can provide the parameter multiple times and it will always be an array. | Same, but no `0x...` values. Use `type: 'hex[]'` for hex input. |
| `file` | A string that must be a file on the disk when the parse runs. `--conf nope.json` is the error `File not found: nope.json`, and `--conf src` is `Not a file: src`. A relative path is from the working directory. The default is not checked, as it can be a word with a meaning to the program. | |
| `folder` | Same as `file`, for a folder. | |
| `path` | Same as `file`, for a file or a folder. | |
| `file[]` / `folder[]` / `path[]` | Same as `file`, `folder` and `path`. You can provide the parameter multiple times and it will always be an array. | |
| derived from default | Type is inferred from the `default` value. `{n: 1}` reads numbers, `{name: 'bob'}` reads strings, `{flag: false}` reads booleans, `{flag: null}` reads booleans and is `null` when the flag is not given, `{tags: []}` reads string arrays. | Same, but `--no-flag` is not supported |
| unspecified | Unknown parameters are booleans: `--flag` gives `flag: true`. An assigned number is a number, all other assigned values are strings: `--n=42` gives `n: 42`, `--yes=true` gives `yes: 'true'`, `--name=bob` gives `name: 'bob'`. A separated value is positional: `--name bob` gives `name: true` and `_: ['bob']`. | Same |




## Default behaviour

What you can expect from the data you parse with ArgMate. Each example is `argMate(input, config, settings)`: the input is the words of the command line, as the shell gives them to the program. `Default` means no config or no settings. `ERROR X` is an input error with the code `X`.


This section shows ArgMate with no configuration. Using ArgMate without a configuration is not advised, as a lot of behaviour becomes implied, but it is good to know the baseline.

#### Parameters

An input that starts with `-` is a parameter (see the exception for negative numbers below). A short form parameter is a single character like `-a`, and short parameters can be strung together: `-abc` is `-a -b -c`. A character is a grapheme, so an emoji is one character. A long form parameter like `--abc` can not be strung together.

With no configuration a parameter is a boolean flag. The exception is a parameter with `=<value>` after its name: it is a parameter with that value.

| Input | Config | Result |
|---|---|---|
| `--verbose` | Default | `{_: [], verbose: true}` |
| `-v` | Default | `{_: [], v: true}` |
| `--name bob` | Default | `{_: ['bob'], name: true}` |
| `--name=bob` | Default | `{_: [], name: 'bob'}` |
| `--name=` | Default | `{_: [], name: ''}` |
| `--n=a=b` | Default | `{_: [], n: 'a=b'}` |
| `-n=a=b` | Default | `{_: [], n: 'a=b'}` |
| `-abc` | Default | `{_: [], a: true, b: true, c: true}` |
| `-a -b -c` | Default | `{_: [], a: true, b: true, c: true}` |
| `-abc=5` | Default | `{_: [], a: true, b: true, c: 5}` |
| `--abc` | Default | `{_: [], abc: true}` |
| `-🚀` | Default | `{_: [], '🚀': true}` |
| `-👍🏽x` | Default | `{_: [], '👍🏽': true, x: true}` |
| `-vvv` | `{v: {type: 'count'}}` | `{_: [], v: 3}` |
| `-p 80` | `{port: {type: 'int', alias: 'p'}}` | `{_: [], port: 80}` |
| `-p=80` | `{port: {type: 'int', alias: 'p'}}` | `{_: [], port: 80}` |

For historical reasons a short form parameter can take a value of only digits without the `=`. The digits are the value of the last character.

| Input | Config | Result |
|---|---|---|
| `-a123` | Default | `{_: [], a: 123}` |
| `-abc123` | Default | `{_: [], a: true, b: true, c: 123}` |
| `--abc123` | Default | `{_: [], abc123: true}` |
| `-n007` | Default | `{_: [], n: '007'}` |
| `-p80` | `{port: {type: 'int', alias: 'p'}}` | `{_: [], port: 80}` |
| `-n100` | `{n100: {type: 'bool'}}` | `{_: [], n: 100}` |
| `-A0` | `{A: {type: 'bool'}}` | `{_: [], A: false}` |
| `-A0` | `{A: {type: 'bool'}, 0: {type: 'bool'}}` | `{_: [], A: true, 0: true}` |
| `-A0` | `{A0: {type: 'bool'}}` | `{_: [], A: 0}` |
| `-a1b` | Default | `{_: ['-a1b']}` |
| `-n1.5` | Default | `{_: ['-n1.5']}` |
| `-a5=3` | `{a: {type: 'bool'}, 5: {type: 'int'}}` | `{_: [], a: true, 5: 3}` |
| `-a5=3` | `{a: {type: 'bool'}}` | `ERROR NUMBER_NAME` |
| `-a5=3` | Default | `ERROR NUMBER_NAME` |

#### Values

An input that does not start with `-` is a value. After a parameter that is not a flag, the value is saved under the name of that parameter. Else it is added to the array `_` in the returned object.

| Input | Config | Result |
|---|---|---|
| `file.txt x` | Default | `{_: ['file.txt', 'x']}` |
| `a -v b` | Default | `{_: ['a', 'b'], v: true}` |
| `-` | Default | `{_: ['-']}` |

All inputs after the input `--` are values, as strings, no matter the content.

| Input | Config | Result |
|---|---|---|
| `-- -v --x` | Default | `{_: ['-v', '--x']}` |
| `a -- b` | Default | `{_: ['a', 'b']}` |
| `-- -5 1.5` | Default | `{_: ['-5', '1.5']}` |

#### Auto numbers

With no configuration a value that is an integer, a float or a number in scientific notation is converted to its numeric value. This includes negative numbers, even though they start with `-`.

A number is only converted when JavaScript can hold it exactly. An integer, also one in scientific notation, must be a safe integer (at most `9007199254740991` from zero). A float must have digits on both sides of the `.`. Each number must be finite. Else the value stays a string. Hexadecimal (`0x10`) and numbers with leading zeros (`007`) stay strings.

A value of unspecified type is never converted to a boolean: `--d=true` gives the string `'true'`.

| Input | Config | Result |
|---|---|---|
| `5 1.5 -1e3` | Default | `{_: [5, 1.5, -1000]}` |
| `--n=5 --m=-5` | Default | `{_: [], n: 5, m: -5}` |
| `--f=1.5 --g=1.0` | Default | `{_: [], f: 1.5, g: 1}` |
| `--e=1e4 --s=-2.5e-4` | Default | `{_: [], e: 10000, s: -0.00025}` |
| `-n5` | Default | `{_: [], n: 5}` |
| `007 0x10` | Default | `{_: ['007', '0x10']}` |
| `--n=+5 --m=.5 --k=1_000` | Default | `{_: [], n: '+5', m: '.5', k: '1_000'}` |
| `--big=12345678901234567890` | Default | `{_: [], big: '12345678901234567890'}` |
| `--inf=1e400` | Default | `{_: [], inf: '1e400'}` |
| `--d=true --e=no` | Default | `{_: [], d: 'true', e: 'no'}` |
| `-5` | Default | `{_: [-5]}` |
| `-1.5` | Default | `{_: [-1.5]}` |
| `-1.0` | Default | `{_: [-1]}` |
| `-0` | Default | `{_: [-0]}` |
| `-1e3` | Default | `{_: [-1000]}` |
| `-1e-3` | Default | `{_: [-0.001]}` |
| `-v -5 x` | Default | `{_: [-5, 'x'], v: true}` |
| `-0x10` | Default | `{_: ['-0x10']}` |
| `-007` | Default | `{_: ['-007']}` |
| `-.5` | Default | `{_: ['-.5']}` |
| `-1.` | Default | `{_: ['-1.']}` |
| `-5px` | Default | `{_: ['-5px']}` |
| `-10,10` | Default | `{_: ['-10,10']}` |
| `-1_000` | Default | `{_: ['-1_000']}` |
| `-12345678901234567890` | Default | `{_: ['-12345678901234567890']}` |
| `-1e400` | Default | `{_: ['-1e400']}` |

#### Long names

The name is all of the word after `--`, up to a `=`. Digits are part of a long name: `--utf8`, `--http2` and `--ipv6` are real names. A kebab-case name is camelCase in the output.

| Input | Config | Result |
|---|---|---|
| `--port8080` | Default | `{_: [], port8080: true}` |
| `--utf8` | Default | `{_: [], utf8: true}` |
| `--dry-run` | Default | `{_: [], dryRun: true}` |

#### Names of only digits

A name of only digits must be in the config: `--5` and `--123=value` are the input error `NUMBER_NAME` without it. In the short form it needs a `=` (`-5=3`), as `-5` is a negative number. When the config has the first character of a negative number, the word is a short group: each character is a flag when the config has them all, else the digits after the first character are its value.

| Input | Config | Result |
|---|---|---|
| `--5` | Default | `ERROR NUMBER_NAME` |
| `--123=value` | Default | `ERROR NUMBER_NAME` |
| `--no-5` | Default | `ERROR NUMBER_NAME` |
| `-5=3` | Default | `ERROR NUMBER_NAME` |
| `-5=3` | `{5: {type: 'int'}}` | `{_: [], 5: 3}` |
| `--5` | `{5: {type: 'bool'}}` | `{_: [], 5: true}` |
| `--123 x` | `{123: {type: 'string'}}` | `{_: [], 123: 'x'}` |
| `-5` | `{5: {type: 'bool'}}` | `{_: [], 5: true}` |
| `-1` | `{verbose: {alias: '1'}}` | `{_: [], verbose: true}` |
| `-12` | `{1: {type: 'bool'}, 2: {type: 'bool'}}` | `{_: [], 1: true, 2: true}` |
| `-1a` | `{1: {type: 'bool'}, a: {type: 'bool'}}` | `{_: [], 1: true, a: true}` |
| `-007` | `{0: {type: 'bool'}, 7: {type: 'bool'}}` | `{_: [], 0: true, 7: true}` |
| `-.v` | `{'.': {type: 'bool'}, v: {type: 'bool'}}` | `{_: [], '.': true, v: true}` |
| `-12` | `{1: {type: 'bool'}}` | `ERROR BAD_VALUE` |
| `-10` | `{1: {type: 'bool'}}` | `{_: [], 1: false}` |
| `-12` | `{1: {type: 'int'}}` | `{_: [], 1: 2}` |
| `-1️⃣` | Default | `{_: [], '1️⃣': true}` |

#### Negation

`--no-name` sets the flag `name` to `false`. It can not have a value: a parameter that takes a value can not be negated.

| Input | Config | Result |
|---|---|---|
| `--no-color` | Default | `{_: [], color: false}` |
| `--no-color=1` | Default | `ERROR NEGATED_AND_ASSIGNED` |
| `--no-debug=1` | `{debug: {type: 'bool'}}` | `ERROR NEGATED_AND_ASSIGNED` |
| `--no-port` | `{port: {type: 'int'}}` | `ERROR MISSING_VALUE` |
| `--no-port 5` | `{port: {type: 'int'}}` | `ERROR NEGATED_AND_ASSIGNED` |
| `--no-v` | `{v: {type: 'count'}}` | `ERROR BAD_TYPE` |

#### Specified types

When the config gives a parameter a type, or a default that sets the type, the type decides:

- A parameter that is not a boolean takes the next word as its value, also when it starts with `-`. When there is no next word, it is `MISSING_VALUE`. An empty value of a number (`--port=`) is `MISSING_VALUE` too, and the next word is not taken.
- `int`: an auto number whose value is a safe integer, or a hexadecimal with `0x`.
- `number` and `float`: an auto number that is finite, and a safe integer when its value is an integer. Or a hexadecimal with `0x`.
- `hex`: hexadecimal digits, with or without `0x`.
- `boolean`: `true`, `yes`, `on`, `1` are `true`, and `false`, `no`, `off`, `0` and the empty value (`--debug=`) are `false`, in any case. `{name: {}}` without a type or a default is a boolean. A boolean with the default `null` tells if the flag was given at all.
- `string`: any value.

A value that the type can not hold is `BAD_VALUE`. A message quotes at most 16 characters of a value, with `...` after a longer one; `value` of the error has all of it.

| Input | Config | Result |
|---|---|---|
| `--name bob` | `{name: {type: 'string'}}` | `{_: [], name: 'bob'}` |
| `--name bob` | `{name: {type: 'int'}}` | `ERROR BAD_VALUE` |
| `--n 5` | `{n: {default: 0}}` | `{_: [], n: 5}` |
| `--n x` | `{n: {default: 'a'}}` | `{_: [], n: 'x'}` |
| `--text -5` | `{text: {type: 'string'}}` | `{_: [], text: '-5'}` |
| `--text --5` | `{text: {type: 'string'}}` | `{_: [], text: '--5'}` |
| `--num -5` | `{num: {type: 'number'}}` | `{_: [], num: -5}` |
| `--port` | `{port: {type: 'int'}}` | `ERROR MISSING_VALUE` |
| `--port= 80` | `{port: {type: 'int'}}` | `ERROR MISSING_VALUE` |
| `--name= bob` | `{name: {type: 'string'}}` | `{_: ['bob'], name: ''}` |
| `--n=5 --m=-5` | `{n: {type: 'int'}, m: {type: 'int'}}` | `{_: [], n: 5, m: -5}` |
| `--n=0x10` | `{n: {type: 'int'}}` | `{_: [], n: 16}` |
| `--n=-0x10` | `{n: {type: 'int'}}` | `ERROR BAD_VALUE` |
| `--n=1e3` | `{n: {type: 'int'}}` | `{_: [], n: 1000}` |
| `--n=1.5` | `{n: {type: 'int'}}` | `ERROR BAD_VALUE` |
| `--n=abc` | `{n: {type: 'int'}}` | `ERROR BAD_VALUE` |
| `--n=007` | `{n: {type: 'int'}}` | `ERROR BAD_VALUE` |
| `--n=12345678901234567890` | `{n: {type: 'int'}}` | `ERROR BAD_VALUE` |
| `--n=1.5 --m=-1e3` | `{n: {type: 'number'}, m: {type: 'number'}}` | `{_: [], n: 1.5, m: -1000}` |
| `--n=1.5` | `{n: {type: 'float'}}` | `{_: [], n: 1.5}` |
| `--n=0x10` | `{n: {type: 'number'}}` | `{_: [], n: 16}` |
| `--n=abc` | `{n: {type: 'number'}}` | `ERROR BAD_VALUE` |
| `--n=1e400` | `{n: {type: 'number'}}` | `ERROR BAD_VALUE` |
| `--n=12345678901234567890` | `{n: {type: 'number'}}` | `ERROR BAD_VALUE` |
| `--h=ff --g=0x10` | `{h: {type: 'hex'}, g: {type: 'hex'}}` | `{_: [], h: 255, g: 16}` |
| `--h=-ff` | `{h: {type: 'hex'}}` | `{_: [], h: -255}` |
| `--h=zz` | `{h: {type: 'hex'}}` | `ERROR BAD_VALUE` |
| `--d=yes --e=off --f=1` | `{d: {type: 'bool'}, e: {type: 'bool'}, f: {type: 'bool'}}` | `{_: [], d: true, e: false, f: true}` |
| `--d=TRUE` | `{d: {type: 'bool'}}` | `{_: [], d: true}` |
| `--d=maybe` | `{d: {type: 'bool'}}` | `ERROR BAD_VALUE` |
| `--n` | `{n: {}}` | `{_: [], n: true}` |
| `--n=-5` | `{n: {}}` | `ERROR BAD_VALUE` |
| | `{d: {type: 'bool', default: null}}` | `{_: [], d: null}` |
| `--d` | `{d: {type: 'bool', default: null}}` | `{_: [], d: true}` |
| `--no-d` | `{d: {type: 'bool', default: null}}` | `{_: [], d: false}` |
| | `{d: null}` | `{_: [], d: null}` |
| `--d` | `{d: null}` | `{_: [], d: true}` |
| `--no-d` | `{d: null}` | `{_: [], d: false}` |
| `--s=5 --t=true` | `{s: {type: 'string'}, t: {type: 'string'}}` | `{_: [], s: '5', t: 'true'}` |

## Settings

The settings are provided as the (optional) third argument to `argMate`. the settings change how the processing operates. 

#### allowUnknown

Default `true`. With `false`, an unspecified parameter is the input error `UNKNOWN`. Values are not parameters, so a negative number is not unknown.

| Input | Config | Settings | Result |
|---|---|---|---|
| `--foo` | Default | Default | `{_: [], foo: true}` |
| `--foo` | Default | `allowUnknown: false` | `ERROR UNKNOWN` |
| `--foo` | `{foo: {type: 'bool'}}` | `allowUnknown: false` | `{_: [], foo: true}` |
| `-5` | Default | `allowUnknown: false` | `{_: [-5]}` |

#### allowAutoNumbers

Default `true`. With `false`, numbers do not convert: each value of unspecified type stays a string. A value with a specified type is not changed by this setting.

| Input | Config | Settings | Result |
|---|---|---|---|
| `5 1.5` | Default | Default | `{_: [5, 1.5]}` |
| `5 1.5` | Default | `allowAutoNumbers: false` | `{_: ['5', '1.5']}` |
| `-5` | Default | Default | `{_: [-5]}` |
| `-5` | Default | `allowAutoNumbers: false` | `{_: ['-5']}` |
| `--n=5 --m=-5` | Default | Default | `{_: [], n: 5, m: -5}` |
| `--n=5 --m=-5` | Default | `allowAutoNumbers: false` | `{_: [], n: '5', m: '-5'}` |
| `-n5` | Default | Default | `{_: [], n: 5}` |
| `-n5` | Default | `allowAutoNumbers: false` | `{_: [], n: '5'}` |
| `--n=5` | `{n: {type: 'int'}}` | `allowAutoNumbers: false` | `{_: [], n: 5}` |

#### allowKeyNumValues

Default `true`. The digits after a short flag are its value: `-n100` is `n = 100`. For a boolean they are a boolean string, so `-A0` is `A = false` and `-A1` is `A = true`. With `false`, the digits after a short flag are not its value: the word is a value in `_`, as a string.

| Input | Config | Settings | Result |
|---|---|---|---|
| `-n100` | Default | Default | `{_: [], n: 100}` |
| `-n100` | Default | `allowKeyNumValues: false` | `{_: ['-n100']}` |
| `-A0` | `{A: {type: 'bool'}}` | Default | `{_: [], A: false}` |
| `-A1` | `{A: {type: 'bool'}}` | Default | `{_: [], A: true}` |
| `-A0` | `{A: {type: 'bool'}}` | `allowKeyNumValues: false` | `{_: ['-A0']}` |
| `-A0` | `{A: {type: 'bool'}, 0: {type: 'bool'}}` | `allowKeyNumValues: false` | `{_: [], A: true, 0: true}` |

#### allowNegatingFlags

Default `true`. With `false`, `--no-name` is not a negation: `no-name` is the name.

| Input | Config | Settings | Result |
|---|---|---|---|
| `--no-color` | Default | Default | `{_: [], color: false}` |
| `--no-color` | Default | `allowNegatingFlags: false` | `{_: [], noColor: true}` |

#### allowAssign

Default `true`. With `false`, a value with `=` is the input error `ASSIGN_NOT_ALLOWED`. A value as the next word is still allowed.

| Input | Config | Settings | Result |
|---|---|---|---|
| `--foo=10` | Default | Default | `{_: [], foo: 10}` |
| `--foo=10` | Default | `allowAssign: false` | `ERROR ASSIGN_NOT_ALLOWED` |
| `--port 80` | `{port: {type: 'int'}}` | `allowAssign: false` | `{_: [], port: 80}` |

#### autoCamelKebabCase

Default `true`. With `false`, a kebab-case name stays kebab-case in the output.

| Input | Config | Settings | Result |
|---|---|---|---|
| `--dry-run` | Default | Default | `{_: [], dryRun: true}` |
| `--dry-run` | Default | `autoCamelKebabCase: false` | `{_: [], 'dry-run': true}` |

#### greedy

Default `false`. With `true`, the values after `--` are one string, joined with a space.

| Input | Config | Settings | Result |
|---|---|---|---|
| `-- a b` | Default | Default | `{_: ['a', 'b']}` |
| `-- a b` | Default | `greedy: true` | `{_: ['a b']}` |

#### strict

Default `false`. With `true`, it sets `allowUnknown`, `allowAutoNumbers`, `allowKeyNumValues`, `allowNegatingFlags` and `allowAssign` to `false`. A setting that is also given wins over `strict`.

If all you want is "only the flags in my config", `allowUnknown: false` is the setting. `strict` goes further: it also turns off `--no-name`, `-n100`, `--name=value` and numbers in `_`, so each input has one way to be written.

| Input | Config | Settings | Result |
|---|---|---|---|
| `-5 x` | Default | Default | `{_: [-5, 'x']}` |
| `-5 x` | Default | `strict: true` | `{_: ['-5', 'x']}` |
| `--foo` | Default | `strict: true` | `ERROR UNKNOWN` |
| `--port=80` | `{port: {type: 'int'}}` | `strict: true` | `ERROR ASSIGN_NOT_ALLOWED` |
| `--port 80` | `{port: {type: 'int'}}` | `strict: true` | `{_: [], port: 80}` |
| `-n5` | `{n: {type: 'string'}}` | `strict: true` | `{_: ['-n5']}` |
| `-5` | Default | `strict: true`, `allowAutoNumbers: true` | `{_: [-5]}` |
| `--port=80` | `{port: {type: 'int'}}` | `allowUnknown: false` | `{_: [], port: 80}` |

#### outputAlias

Default `false`. With `true`, each alias of a parameter is in the result too, with the same value. The kebab-case form of a camelCase name counts as an alias. This helps when you move code from a parser that does this, and the code reads `argv.f` where the config says `file`.

| Input | Config | Settings | Result |
|---|---|---|---|
| `-f a.txt` | `{file: {type: 'string', alias: 'f'}}` | Default | `{_: [], file: 'a.txt'}` |
| `-f a.txt` | `{file: {type: 'string', alias: 'f'}}` | `outputAlias: true` | `{_: [], file: 'a.txt', f: 'a.txt'}` |
| `--dry-run` | `{dryRun: {alias: 'n'}}` | `outputAlias: true` | `{_: [], dryRun: true, 'dry-run': true, n: true}` |

### Error codes

The `code` of the error object of an input error.

| Code | When |
|---|---|
| `UNKNOWN` | An unspecified parameter, with `allowUnknown: false` |
| `MISSING_VALUE` | A parameter that takes a value is the last word, or the value of a number is empty (`--port=`) |
| `NEGATED_AND_ASSIGNED` | `--no-name=value`, or `--no-name` for a parameter that takes a value |
| `BAD_TYPE` | A parameter is used against its type: `--no-` for a count |
| `BAD_VALUE` | A value that the type of the parameter can not hold |
| `NUMBER_NAME` | A name of only digits that the config does not have (`--5`, `-5=3`), or a short group with a digit and `=` that the config does not have all characters of (`-a5=3`) |
| `ASSIGN_NOT_ALLOWED` | A value with `=`, with `allowAssign: false` or for a parameter with `next` or `last` |
| `INVALID` | A value that `valid` or `validate` rejects, or a `transform` that throws |
| `MANDATORY` | A `mandatory` parameter is not in the input |
| `CONFLICT` | Two parameters of a `conflict` are in the input |
| `DEMAND` | A parameter is in the input without a parameter of its `demand` |
| `CROSS_VALIDATE` | `crossValidate` returns `false` or a string |


## Ideas
- ? input type json that is parsed and added as data?
- ? comma-separated list to array?
- Demonstrate how to use macros to pregenerate engineConfig to make things even faster. manual or via https://bun.sh/docs/bundler/macros - https://bun.sh/docs/bundler/macros#export-condition-macro
- ? "Did you mean" for a typo: `--minfy` gives `Did you mean '--minify'?`, and `e.suggestions: ['minify']`.
	- The engine already says this for a wrong number of dashes (`-version`). This is the same for a misspelled name.
	- Letter distance, where two swapped letters count as one change (as git and commander do). Names and aliases.
	- Only when a name is close: `--bogus` gets no suggestion. Long names only, as each one-letter name is one change from all others.
	- Only on the error path, so a valid input costs nothing.
- ? Collect all the errors: `maxErrors` in the settings (default 1). The parse goes on after an error, and the `error` callback gets all of them in `e.errors`.
	- A help flag that wins over errors is for the program to decide, not ArgMate. `include` of `argInfo` gives it the tool.

 

## Notes for the README review

Things to add or check when the README is reviewed:

- Say that the order is: the name (an alias or the kebab form becomes the config key) as each input is read, type, an alias of `valid` to its value, `transform`, `validate` or the check of the list, then `mandatory`, `conflict`, `demand` and `crossValidate`.
- The type of an array default comes from its values: `{n: [1]}` is a `number[]`.
- The list of error codes and the error object in one place.

## License

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fmathiasrw%2Fargmate.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fmathiasrw%2Fargmate?ref=badge_large)


