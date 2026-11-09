# ArgMate specification

_What you can expect from the data you parse with ArgMate._

In short, ArgMate takes an array of CLI input like

    ['build', '--export-dir', './dist', '--verbose']

and returns an object that makes it easier to take action on

    {_: ['build'], exportDir: './dist', verbose: true}

A result of `ERROR` and a code is the input error with that code. `ERROR_NOT_VALID_CONFIG` is a config error.

## Behaviour

### An input that starts with `-` is a parameter, other inputs are values

_(See the exception for negative numbers below)_

| Input | Config | Result |
|---|---|---|
| `-v file.txt` | Default | `{_: ['file.txt'], v: true}` |
| `--verbose` | Default | `{_: [], verbose: true}` |
| `-🍿` | Default | `{_: [], '🍿': true}` |
| `-` | Default | `{_: ['-']}` |

### An unspecified parameter is considered a flag

| Input | Config | Result |
|---|---|---|
| `--name bob` | Default | `{_: ['bob'], name: true}` |
| `--name bob` | `{name: {type: 'string'}}` | `{_: [], name: 'bob'}` |

Flags can be negated:

| Input | Config | Result |
|---|---|---|
| `--no-color` | Default | `{_: [], color: false}` |
| `--no-color=1` | Default | `ERROR NEGATED_AND_ASSIGNED` |
| `--no-port` | `{port: {type: 'int'}}` | `ERROR MISSING_VALUE` |
| `--no-port 80` | `{port: {type: 'int'}}` | `ERROR NEGATED_AND_ASSIGNED` |
| `--no-v` | `{v: {type: 'count'}}` | `ERROR BAD_TYPE` |

A parameter name of only digits must be specified:

| Input | Config | Result |
|---|---|---|
| `--5` | Default | `ERROR NUMBER_NAME` |
| `--5` | `{5: {type: 'bool'}}` | `{_: [], 5: true}` |
| `--123=value` | Default | `ERROR NUMBER_NAME` |
| `--123=value` | `{123: {type: 'string'}}` | `{_: [], 123: 'value'}` |

### An unspecified parameter followed by `=` gets a value

| Input | Config | Result |
|---|---|---|
| `-v=file.txt` | Default | `{_: [], v: 'file.txt'}` |
| `--name=bob` | Default | `{_: [], name: 'bob'}` |
| `--name=` | Default | `{_: [], name: ''}` |
| `--n=a=b` | Default | `{_: [], n: 'a=b'}` |
| `--n=bob` | Default | `{_: [], n: 'bob'}` |
| `-n=bob` | Default | `{_: [], n: 'bob'}` |

### A short parameter is one visual character, and short parameters can be chained

| Input | Config | Result |
|---|---|---|
| `-a` | Default | `{_: [], a: true}` |
| `-abc` | Default | `{_: [], a: true, b: true, c: true}` |
| `-abc=5` | Default | `{_: [], a: true, b: true, c: 5}` |
| `--abc=5` | Default | `{_: [], abc: 5}` |
| `-⚾🎾🏀` | Default | `{_: [], '⚾': true, '🎾': true, '🏀': true}` |

A group that is also a long name, a key or an alias, is most likely that name with one dash too few. When a letter of it is not in the config, it is the error `UNKNOWN`, with `Did you mean '--file'?` in the message, also when unknown parameters are allowed. When each letter is in the config, it is a group.

| Input | Config | Result |
|---|---|---|
| `-file a.sql` | `{file: {alias: 'f', type: 'string'}}` | `ERROR UNKNOWN` |
| `-abc` | `{abc: {}, a: {}}` | `ERROR UNKNOWN` |
| `-ab` | `{x: {alias: 'ab'}, a: {}}` | `ERROR UNKNOWN` |
| `-abc` | `{abc: {}, a: {}, b: {}, c: {}}` | `{_: [], a: true, b: true, c: true}` |
| `-abc` | `{a: {}}` | `{_: [], a: true, b: true, c: true}` |

### A long parameter can not be chained, can include digits, and is camelCase in the output

| Input | Config | Result |
|---|---|---|
| `--foo-bar --file-path file.txt` | Default | `{_: ['file.txt'], fooBar: true, filePath: true}` |
| `--👍🏽👍🏽👍🏽` | Default | `{_: [], '👍🏽👍🏽👍🏽': true}` |
| `--utf8` | Default | `{_: [], utf8: true}` |

### Digits at the end of a short group are an assignment to the last character

For a boolean the digits are a boolean string, so `-A0` is `A = false` and `-A1` is `A = true`. Other digits are an error. The digits are flags only when each of them is in the config.

| Input | Config | Result |
|---|---|---|
| `-a12` | Default | `{_: [], a: 12}` |
| `-ab12` | Default | `{_: [], a: true, b: 12}` |
| `-a -b=12` | Default | `{_: [], a: true, b: 12}` |
| `-n100` | Default | `{_: [], n: 100}` |
| `-A0` | Default | `{_: [], A: 0}` |
| `-A0` | `{A: {type: 'bool'}}` | `{_: [], A: false}` |
| `-A0` | `{A: {type: 'bool'}, 0: {type: 'bool'}}` | `{_: [], A: true, 0: true}` |
| `-A1` | `{A: {type: 'bool'}}` | `{_: [], A: true}` |
| `-A5` | `{A: {type: 'bool'}}` | `ERROR BAD_VALUE` |
| `-A00` | `{A: {type: 'bool'}}` | `ERROR BAD_VALUE` |
| `-A=0` | `{A: {type: 'bool'}}` | `{_: [], A: false}` |
| `-A 0` | `{A: {type: 'bool'}}` | `{_: [0], A: true}` |
| `-utf8` | Default | `{_: [], u: true, t: true, f: 8}` |
| `-n1.5` | Default | `{_: ['-n1.5']}` |
| `-a5=3` | `{a: {type: 'bool'}, 5: {type: 'int'}}` | `{_: [], a: true, 5: 3}` |
| `-a5=3` | `{a: {type: 'bool'}}` | `ERROR NUMBER_NAME` |
| `-a5=3` | Default | `ERROR NUMBER_NAME` |
| `-5=3` | Default | `ERROR NUMBER_NAME` |
| `-5=3` | `{5: {type: 'int'}}` | `{_: [], 5: 3}` |

### Numeric-looking inputs are converted to the numeric value

A value of unspecified type that represents an int, a float or scientific notation is converted to its numeric value.

| Input | Config | Result |
|---|---|---|
| `5 1.5 -1e3` | Default | `{_: [5, 1.5, -1000]}` |
| `--n=5` | Default | `{_: [], n: 5}` |
| `--n=5` | `{n: {type: 'string'}}` | `{_: [], n: '5'}` |
| `007 0x10 .5` | Default | `{_: ['007', '0x10', '.5']}` |
| `12345678901234567890 1e400` | Default | `{_: ['12345678901234567890', '1e400']}` |
| `-n 12345678901234567890 -m 1e400` | `{n: {type: 'number'}, m: {type: 'number'}}` | `ERROR BAD_VALUE` |

### A negative number is a value, unless the config has its first character

When the config has the first character, the input is a short group: each character is a flag when the config has them all, else the digits after the first character are its value.

| Input | Config | Result |
|---|---|---|
| `-5` | Default | `{_: [-5]}` |
| `-5` | `{5: {type: 'bool'}}` | `{_: [], 5: true}` |
| `-0x10 -007 -.5 -5px` | Default | `{_: ['-0x10', '-007', '-.5', '-5px']}` |
| `-12` | Default | `{_: [-12]}` |
| `-12` | `{1: {type: 'bool'}, 2: {type: 'bool'}}` | `{_: [], 1: true, 2: true}` |
| `-12` | `{1: {type: 'bool'}}` | `ERROR BAD_VALUE` |
| `-10` | `{1: {type: 'bool'}}` | `{_: [], 1: false}` |
| `-12` | `{1: {type: 'int'}}` | `{_: [], 1: 2}` |

### Every input after `--` is considered a string

| Input | Config | Result |
|---|---|---|
| `-v=5 --` | Default | `{_: [], v: 5}` |
| `-- -v=5` | Default | `{_: ['-v=5']}` |
| `-9 -- -9` | Default | `{_: [-9, '-9']}` |

### A parameter that is not a boolean takes the next input as its value

| Input | Config | Result |
|---|---|---|
| `--text -5` | `{text: {type: 'string'}}` | `{_: [], text: '-5'}` |
| `--num -5` | `{num: {type: 'number'}}` | `{_: [], num: -5}` |
| `--port 8080` | Default | `{_: [8080], port: true}` |
| `--port 8080` | `{port: {type: 'int'}}` | `{_: [], port: 8080}` |
| `--port` | `{port: {type: 'int'}}` | `ERROR MISSING_VALUE` |

### A value must fit the type of its parameter

An empty value of a number is a missing value. An empty value of a boolean is `false`, and an empty value of a string is the empty string.

| Input | Config | Result |
|---|---|---|
| `--port 8080` | `{port: {type: 'int'}}` | `{_: [], port: 8080}` |
| `--port p0p0` | `{port: {type: 'int'}}` | `ERROR BAD_VALUE` |
| `--n=5` | `{n: {type: 'int'}}` | `{_: [], n: 5}` |
| `-n=5` | `{n: {type: 'int'}}` | `{_: [], n: 5}` |
| `-n=1.5` | `{n: {type: 'int'}}` | `ERROR BAD_VALUE` |
| `-n=007` | `{n: {type: 'int'}}` | `ERROR BAD_VALUE` |
| `-n=0x10` | `{n: {type: 'int'}}` | `{_: [], n: 16}` |
| `-n=-0x10` | `{n: {type: 'int'}}` | `ERROR BAD_VALUE` |
| `-n=1e3` | `{n: {type: 'int'}}` | `{_: [], n: 1000}` |
| `-n=12345678901234567890` | `{n: {type: 'int'}}` | `ERROR BAD_VALUE` |
| `-n=1.5` | `{n: {type: 'number'}}` | `{_: [], n: 1.5}` |
| `-n=0x10` | `{n: {type: 'number'}}` | `{_: [], n: 16}` |
| `-n=1e400` | `{n: {type: 'number'}}` | `ERROR BAD_VALUE` |
| `-n=12345678901234567890` | `{n: {type: 'number'}}` | `ERROR BAD_VALUE` |
| `-h=ff` | `{h: {type: 'hex'}}` | `{_: [], h: 255}` |
| `-h=-ff` | `{h: {type: 'hex'}}` | `{_: [], h: -255}` |
| `-s=5` | `{s: {type: 'string'}}` | `{_: [], s: '5'}` |
| `--s= x` | `{s: {type: 'string'}}` | `{_: ['x'], s: ''}` |
| `--n= 5` | `{n: {type: 'int'}}` | `ERROR MISSING_VALUE` |
| `--n=` | `{n: {type: 'float'}}` | `ERROR MISSING_VALUE` |
| `--n=` | `{n: {type: 'number'}}` | `ERROR MISSING_VALUE` |
| `--h=` | `{h: {type: 'hex'}}` | `ERROR MISSING_VALUE` |
| `--n=` | `{n: {type: 'int[]'}}` | `ERROR MISSING_VALUE` |
| `--v=` | `{v: {type: 'count'}}` | `ERROR MISSING_VALUE` |
| `--d=` | `{d: {type: 'bool'}}` | `{_: [], d: false}` |
| `--d= --d=yes` | `{d: {type: 'bool[]'}}` | `{_: [], d: [false, true]}` |

### A specified boolean parameter will understand boolean strings

For parameters specified as boolean, the input strings `true`, `yes`, `on`, `1`, `false`, `no`, `off`, `0` and the empty string are converted into the boolean values `true` or `false`, in any case. All other values are rejected.

| Input | Config | Result |
|---|---|---|
| `--d=yes --e=OFF` | Default | `{_: [], d: 'yes', e: 'OFF'}` |
| `--d=yes --e=OFF` | `{d: {type: 'bool'}, e: {type: 'bool'}}` | `{_: [], d: true, e: false}` |
| `--d=foobar` | `{d: {type: 'bool'}}` | `ERROR BAD_VALUE` |
| | `{d: {type: 'bool', default: null}}` | `{_: [], d: null}` |
| `--d` | `{d: {type: 'bool', default: null}}` | `{_: [], d: true}` |

### Each type reads its own kind of value

| Input | Config | Result |
|---|---|---|
| `--d` | `{d: {type: 'boolean'}}` | `{_: [], d: true}` |
| `--d=no` | `{d: {type: 'bool'}}` | `{_: [], d: false}` |
| `--s 5` | `{s: {type: 'string'}}` | `{_: [], s: '5'}` |
| `--n 5` | `{n: {type: 'int'}}` | `{_: [], n: 5}` |
| `--n 1.5` | `{n: {type: 'float'}}` | `{_: [], n: 1.5}` |
| `--n 1e3` | `{n: {type: 'number'}}` | `{_: [], n: 1000}` |
| `--h ff` | `{h: {type: 'hex'}}` | `{_: [], h: 255}` |
| `-vvv` | `{v: {type: 'count'}}` | `{_: [], v: 3}` |
| `--d=yes --d=no` | `{d: {type: 'boolean[]'}}` | `{_: [], d: [true, false]}` |
| `--d=on --d=0` | `{d: {type: 'bool[]'}}` | `{_: [], d: [true, false]}` |
| `--s a --s 5` | `{s: {type: 'string[]'}}` | `{_: [], s: ['a', '5']}` |
| `--s a --s 5` | `{s: {type: 'array'}}` | `{_: [], s: ['a', '5']}` |
| `--n 1 --n 2` | `{n: {type: 'int[]'}}` | `{_: [], n: [1, 2]}` |
| `--n 1 --n 2.5` | `{n: {type: 'float[]'}}` | `{_: [], n: [1, 2.5]}` |
| `--n 1 --n 1e3` | `{n: {type: 'number[]'}}` | `{_: [], n: [1, 1000]}` |
| `--h ff --h 0x10` | `{h: {type: 'hex[]'}}` | `{_: [], h: [255, 16]}` |
| | `{s: {type: 'string[]'}}` | `{_: [], s: []}` |

### `file`, `folder` and `path` name a thing on the disk

They are text, and the value must be a file, a folder, or either of the two, when the parse runs. A relative path is from the working directory. The check is after `transform` and before `validate`. A value that is the default is not checked, as a default can be a word with a meaning to the program, like `-` for stdin. An empty value is a missing value. The message says what is wrong: `File not found: nope.json`, `Not a file: src` or `No file provided for 'f'`. Each has an array type.

| Input | Config | Result |
|---|---|---|
| `--f package.json` | `{f: {type: 'file'}}` | `{_: [], f: 'package.json'}` |
| `--f nope.json` | `{f: {type: 'file'}}` | `ERROR INVALID` |
| `--f src` | `{f: {type: 'file'}}` | `ERROR INVALID` |
| `--d src` | `{d: {type: 'folder'}}` | `{_: [], d: 'src'}` |
| `--d package.json` | `{d: {type: 'folder'}}` | `ERROR INVALID` |
| `--p src --p package.json` | `{p: {type: 'path[]'}}` | `{_: [], p: ['src', 'package.json']}` |
| `--p src --p nope` | `{p: {type: 'path[]'}}` | `ERROR INVALID` |
| `--f package` | `{f: {type: 'file', transform: v => v + '.json'}}` | `{_: [], f: 'package.json'}` |
| | `{f: {type: 'file', default: 'nope.json'}}` | `{_: [], f: 'nope.json'}` |
| `--f -` | `{f: {type: 'file', default: '-'}}` | `{_: [], f: '-'}` |
| `--f nope.json` | `{f: {type: 'file', default: '-'}}` | `ERROR INVALID` |
| `--f=` | `{f: {type: 'file'}}` | `ERROR MISSING_VALUE` |
| `--p a --p` | `{p: {type: 'path[]', default: ['a']}}` | `ERROR MISSING_VALUE` |
| | `{f: {type: 'file[]'}}` | `{_: [], f: []}` |

### A config of only a default value gives the type of the default

`{d: null}` is a boolean that is `null` when the flag is not given, so you can tell if it was given at all.

| Input | Config | Result |
|---|---|---|
| | `{d: null}` | `{_: [], d: null}` |
| `--d` | `{d: null}` | `{_: [], d: true}` |
| `--no-d` | `{d: null}` | `{_: [], d: false}` |
| `--d` | `{d: false}` | `{_: [], d: true}` |
| `--no-d` | `{d: true}` | `{_: [], d: false}` |
| | `{n: 5}` | `{_: [], n: 5}` |
| `--n 1.5` | `{n: 5}` | `{_: [], n: 1.5}` |
| `--n x` | `{n: 5}` | `ERROR BAD_VALUE` |
| `--s 5` | `{s: 'bob'}` | `{_: [], s: '5'}` |
| `--t a --t 5` | `{t: []}` | `{_: [], t: ['a', '5']}` |
| | `{t: [1]}` | `{_: [], t: [1]}` |
| `--t 5` | `{t: [1]}` | `{_: [], t: [5]}` |
| `--t 5` | `{t: ['a', 1]}` | `{_: [], t: ['5']}` |
| `--t 5` | `{t: {default: [1, 2]}}` | `{_: [], t: [5]}` |

### `valid` is a list of values, and a value can have aliases

An item of the list is a value, or `[value, ...aliases]`. A string in that array is an alias that the help shows, and an array in it holds aliases that the help does not show: `['V8', ['v8', 'js']]` and `['V8', ['v8'], ['js']]` are the same. An alias in the input gives the value. The first value is the default.

| Input | Config | Result |
|---|---|---|
| | `{e: {valid: [['V8', 'v8', ['js', 'node']], ['RE2', 're2']]}}` | `{_: [], e: 'V8'}` |
| `--e RE2` | `{e: {valid: [['V8', 'v8', ['js', 'node']], ['RE2', 're2']]}}` | `{_: [], e: 'RE2'}` |
| `--e re2` | `{e: {valid: [['V8', 'v8', ['js', 'node']], ['RE2', 're2']]}}` | `{_: [], e: 'RE2'}` |
| `--e node` | `{e: {valid: [['V8', 'v8', ['js', 'node']], ['RE2', 're2']]}}` | `{_: [], e: 'V8'}` |
| `--e js` | `{e: {valid: [['V8', ['v8'], ['js']], ['RE2', 're2']]}}` | `{_: [], e: 'V8'}` |
| `--e v8` | `{e: {valid: [['V8', ['v8', 'js']], ['RE2', 're2']]}}` | `{_: [], e: 'V8'}` |
| `--e Re2` | `{e: {valid: [['V8', 'v8', ['js', 'node']], ['RE2', 're2']]}}` | `ERROR INVALID` |
| `--t a --t x` | `{t: {type: 'string[]', valid: ['a', ['b', 'x']]}}` | `{_: [], t: ['a', 'b']}` |
| `--n 2` | `{n: {type: 'int', valid: [1, 2]}}` | `{_: [], n: 2}` |
| `--n 3` | `{n: {type: 'int', valid: [1, 2]}}` | `ERROR INVALID` |

### `validate` replaces the check of the list

`valid` is a list only. `validate` is a function or a regular expression, and a list in `validate` is the list of `valid`. A function gets the value and the list of `valid`, with each item as `[value, ...aliases]`. It returns `true` or nothing to pass, `false` for the standard message, or a string that is the message.

| Input | Config | Result |
|---|---|---|
| `--n 7` | `{n: {type: 'int', validate: v => 5 < v}}` | `{_: [], n: 7}` |
| `--n 3` | `{n: {type: 'int', validate: v => 5 < v}}` | `ERROR INVALID` |
| `--n 3` | `{n: {type: 'int', validate: v => 5 < v ? undefined : 'Too small'}}` | `ERROR INVALID` |
| `--s abc` | `{s: {validate: /^[a-z]+$/}}` | `{_: [], s: 'abc'}` |
| `--s a1` | `{s: {validate: /^[a-z]+$/}}` | `ERROR INVALID` |
| `--s b` | `{s: {validate: ['a', 'b']}}` | `{_: [], s: 'b'}` |
| `--e js` | `{e: {valid: [['V8', ['js']], 'RE2'], validate: (v, valid) => v === valid[0][0]}}` | `{_: [], e: 'V8'}` |
| `--e RE2` | `{e: {valid: [['V8', ['js']], 'RE2'], validate: (v, valid) => v === valid[0][0]}}` | `ERROR INVALID` |
| `--e x` | `{e: {valid: ['V8', 'RE2'], validate: () => true}}` | `{_: [], e: 'x'}` |
| | `{n: {type: 'int', valid: v => 5 < v}}` | `ERROR_NOT_VALID_CONFIG` |
| | `{s: {valid: /^[a-z]+$/}}` | `ERROR_NOT_VALID_CONFIG` |
| | `{s: {valid: ['a'], validate: ['b']}}` | `ERROR_NOT_VALID_CONFIG` |

### An alias becomes its value, then `transform` runs, then the check

`transform` gets the value of an alias, not the alias. `valid` is case sensitive. A `transform` that changes the case runs before the check, so the check is of the transformed value.

| Input | Config | Result |
|---|---|---|
| `--sort ascii` | `{sort: {valid: ['natural', 'ascii']}}` | `{_: [], sort: 'ascii'}` |
| `--sort ASCII` | `{sort: {valid: ['natural', 'ascii']}}` | `ERROR INVALID` |
| `--sort ASCII` | `{sort: {transform: v => v.toLowerCase(), valid: ['natural', 'ascii']}}` | `{_: [], sort: 'ascii'}` |
| `--sort size` | `{sort: {transform: v => v.toLowerCase(), valid: ['natural', 'ascii']}}` | `ERROR INVALID` |
| `--e js` | `{e: {valid: [['V8', ['js']], 'RE2'], transform: v => v + '!', validate: v => 'V8!' === v}}` | `{_: [], e: 'V8!'}` |
| `--e RE2` | `{e: {valid: [['V8', ['js']], 'RE2'], transform: () => 'js'}}` | `ERROR INVALID` |
| `--n 3` | `{n: {type: 'int', transform: v => v * 2, validate: v => 5 < v}}` | `{_: [], n: 6}` |
| `--n 2` | `{n: {type: 'int', transform: v => v * 2, validate: v => 5 < v}}` | `ERROR INVALID` |

### A conflict is found by any name of the parameter

A name in `conflict` can be the name of the parameter, an alias, or the kebab form. It works for every type. A name that is not in the config is ignored.

| Input | Config | Result |
|---|---|---|
| `-a` | `{a: {conflict: 'b'}, b: false}` | `{_: [], a: true, b: false}` |
| `-a -b` | `{a: {conflict: 'b'}, b: false}` | `ERROR CONFLICT` |
| `-b -a` | `{a: {conflict: 'b'}, b: false}` | `ERROR CONFLICT` |
| `-P -T` | `{voidPipe: {alias: 'P', conflict: ['T']}, trimPipe: {alias: 'T'}}` | `ERROR CONFLICT` |
| `--void-pipe --trim-pipe` | `{voidPipe: {conflict: 'trim-pipe'}, trimPipe: false}` | `ERROR CONFLICT` |
| `-V -t` | `{voidPipe: {alias: 'V', conflict: 'trimPipe'}, trimPipe: {alias: 't'}}` | `ERROR CONFLICT` |
| `--port 80 --socket a` | `{port: {type: 'int', conflict: 'socket'}, socket: {type: 'string'}}` | `ERROR CONFLICT` |
| `--x --y` | `{x: {conflict: 'z'}, y: false}` | `{_: [], x: true, y: true}` |

### `demand` needs the other parameter in the input

A name in `demand` can be the name of the parameter, an alias, or the kebab form. A default value does not count. A name that is not in the config is a config error.

| Input | Config | Result |
|---|---|---|
| `--null-in` | `{nullIn: {demand: 'globPipe'}, globPipe: false}` | `ERROR DEMAND` |
| `--null-in --glob-pipe` | `{nullIn: {demand: 'globPipe'}, globPipe: false}` | `{_: [], nullIn: true, globPipe: true}` |
| `--glob-pipe` | `{nullIn: {demand: 'globPipe'}, globPipe: false}` | `{_: [], globPipe: true}` |
| `-n -g` | `{nullIn: {alias: 'n', demand: 'g'}, globPipe: {alias: 'g'}}` | `{_: [], nullIn: true, globPipe: true}` |
| `-n` | `{nullIn: {alias: 'n', demand: 'g'}, globPipe: {alias: 'g', default: true}}` | `ERROR DEMAND` |
| `--port 80` | `{port: {type: 'int', demand: 'host'}, host: {type: 'string'}}` | `ERROR DEMAND` |
| | `{nullIn: {demand: 'globPipe'}}` | `ERROR_NOT_VALID_CONFIG` |

### `spot` takes one input by its place, before the parse

`spot` counts the inputs from 1, or from the end when it is negative. The input is taken out before the parse, so `-x` is a value and not a parameter. The value is a string unless a type is given. A boolean reads a boolean string, as with `=`. A spot has no alias. Two spots with the same number are a config error. A spot from the start and one from the end overlap when there are few inputs; that is the input error `MISSING_VALUE`.

| Input | Config | Result |
|---|---|---|
| `-x y a.md` | `{pattern: {spot: 1}, replacement: {spot: 2}}` | `{_: ['a.md'], pattern: '-x', replacement: 'y'}` |
| `a.txt b.txt dir` | `{dest: {spot: -1}}` | `{_: ['a.txt', 'b.txt'], dest: 'dir'}` |
| `-- -x` | `{p: {spot: 2}}` | `{_: [], p: '-x'}` |
| `5 a` | `{n: {spot: 1, type: 'int'}}` | `{_: ['a'], n: 5}` |
| `x a` | `{n: {spot: 1, type: 'int'}}` | `ERROR BAD_VALUE` |
| `a` | `{p: {spot: 3}}` | `{_: ['a']}` |
| | `{p: {spot: 0}}` | `ERROR_NOT_VALID_CONFIG` |
| `a b c` | `{p: {spot: -2}}` | `{_: ['a', 'c'], p: 'b'}` |
| `yes a` | `{debug: {spot: 1, type: 'boolean'}}` | `{_: ['a'], debug: true}` |
| `off a` | `{debug: {spot: 1, type: 'boolean'}}` | `{_: ['a'], debug: false}` |
| `maybe a` | `{debug: {spot: 1, type: 'boolean'}}` | `ERROR BAD_VALUE` |
| | `{p: {spot: 1.5}}` | `ERROR_NOT_VALID_CONFIG` |
| | `{p: {spot: 1, type: 'count'}}` | `ERROR_NOT_VALID_CONFIG` |
| | `{p: {spot: 1, alias: 'x'}}` | `ERROR_NOT_VALID_CONFIG` |
| `a b` | `{p: {spot: 1}, q: {spot: -2}}` | `ERROR MISSING_VALUE` |
| `a b c` | `{p: {spot: 1}, q: {spot: -2}}` | `{_: ['c'], p: 'a', q: 'b'}` |
| | `{p: {spot: 1}, q: {spot: 1}}` | `ERROR_NOT_VALID_CONFIG` |

### `next` and `last` take several inputs, counted from the parameter

`next: 2` takes the two inputs after the parameter. A negative `next` takes up to and including that place from the end. `last: 2` takes the last two inputs. A negative `last` takes from that place after the parameter to the end. The inputs are taken as they are, and the type of each value is the type of the parameter. A value with `=` is an error. The type must be an array type, and it is `string[]` when none is given.

| Input | Config | Result |
|---|---|---|
| `--coordinates 4 2 a.md` | `{coordinates: {type: 'number[]', next: 2}}` | `{_: ['a.md'], coordinates: [4, 2]}` |
| `--coordinates -4 -x` | `{coordinates: {next: 2}}` | `{_: [], coordinates: ['-4', '-x']}` |
| `--coordinates -4 -x` | `{coordinates: {type: 'number[]', next: 2}}` | `ERROR BAD_VALUE` |
| `--coordinates 4` | `{coordinates: {next: 2}}` | `ERROR MISSING_VALUE` |
| `--files=a b c` | `{files: {next: 2}}` | `ERROR ASSIGN_NOT_ALLOWED` |
| `--files=a b c d` | `{files: {last: 2}}` | `ERROR ASSIGN_NOT_ALLOWED` |
| `--files a b c d` | `{files: {next: -2}}` | `{_: ['d'], files: ['a', 'b', 'c']}` |
| `--files a b c d` | `{files: {last: 2}}` | `{_: ['a', 'b'], files: ['c', 'd']}` |
| `--files A B C D E F` | `{files: {last: -3}}` | `{_: ['A', 'B'], files: ['C', 'D', 'E', 'F']}` |
| `-x y --files a.md b.md c.md` | `{pattern: {spot: 1}, replacement: {spot: 2}, files: {last: -1}}` | `{_: [], pattern: '-x', replacement: 'y', files: ['a.md', 'b.md', 'c.md']}` |
| `-x y a.md` | `{pattern: {spot: 1}, replacement: {spot: 2}, files: {last: -1}}` | `{_: ['a.md'], pattern: '-x', replacement: 'y', files: []}` |
| | `{files: {next: 2, type: 'string'}}` | `ERROR_NOT_VALID_CONFIG` |
| | `{files: {next: 2, last: 2}}` | `ERROR_NOT_VALID_CONFIG` |

## Settings

Settings are provided as the third parameter to `argMate` and direct how the processing engine behaves.

### With `allowUnknown: false` an unspecified parameter will be rejected

| Input | Config | Settings | Result |
|---|---|---|---|
| `--foo` | Default | Default | `{_: [], foo: true}` |
| `--foo` | Default | `allowUnknown: false` | `ERROR UNKNOWN` |
| `-5` | Default | `allowUnknown: false` | `{_: [-5]}` |

### With `allowAutoNumbers: false` unspecified values will remain strings

| Input | Config | Settings | Result |
|---|---|---|---|
| `5 -5 --n=1.5` | Default | Default | `{_: [5, -5], n: 1.5}` |
| `5 -5 --n=1.5` | Default | `allowAutoNumbers: false` | `{_: ['5', '-5'], n: '1.5'}` |
| `--n=5` | `{n: {type: 'int'}}` | `allowAutoNumbers: false` | `{_: [], n: 5}` |

### With `allowKeyNumValues: false` a short parameter followed by digits will remain a string in `_`

| Input | Config | Settings | Result |
|---|---|---|---|
| `-n100` | Default | Default | `{_: [], n: 100}` |
| `-n100` | Default | `allowKeyNumValues: false` | `{_: ['-n100']}` |
| `-A0` | `{A: {type: 'bool'}}` | `allowKeyNumValues: false` | `{_: ['-A0']}` |

### With `allowNegatingFlags: false` the `no-` will be part of the name

| Input | Config | Settings | Result |
|---|---|---|---|
| `--no-color` | Default | Default | `{_: [], color: false}` |
| `--no-color` | Default | `allowNegatingFlags: false` | `{_: [], noColor: true}` |

### With `allowAssign: false` an assignment with `=` will be rejected

| Input | Config | Settings | Result |
|---|---|---|---|
| `--foo=10` | Default | Default | `{_: [], foo: 10}` |
| `--foo=10` | Default | `allowAssign: false` | `ERROR ASSIGN_NOT_ALLOWED` |
| `--port 80` | `{port: {type: 'int'}}` | `allowAssign: false` | `{_: [], port: 80}` |

### With `autoCamelKebabCase: false` kebab-case names will remain kebab case

| Input | Config | Settings | Result |
|---|---|---|---|
| `--dry-run` | Default | Default | `{_: [], dryRun: true}` |
| `--dry-run` | Default | `autoCamelKebabCase: false` | `{_: [], 'dry-run': true}` |

### With `greedy: true` the inputs after `--` will be joined into one string

| Input | Config | Settings | Result |
|---|---|---|---|
| `-- a b` | Default | Default | `{_: ['a', 'b']}` |
| `-- a b` | Default | `greedy: true` | `{_: ['a b']}` |

### With `strict: true` each `allow` setting will be `false`, unless it is given

| Input | Config | Settings | Result |
|---|---|---|---|
| `--foo -5` | Default | Default | `{_: [-5], foo: true}` |
| `--foo -5` | Default | `strict: true` | `ERROR UNKNOWN` |
| `-5` | Default | `strict: true` | `{_: ['-5']}` |
| `-A0` | `{A: {type: 'bool'}}` | `strict: true` | `{_: ['-A0']}` |
| `-5` | Default | `strict: true, allowAutoNumbers: true` | `{_: [-5]}` |

### `crossValidate` checks the parameters together, after all the other checks

`crossValidate` gets the result, which it may change. `true` or nothing passes. `false` or a string is the error `CROSS_VALIDATE`, and a string is its message.

| Input | Config | Settings | Result |
|---|---|---|---|
| `-a -b` | `{a: false, b: false}` | `crossValidate: argv => !(argv.a && argv.b)` | `ERROR CROSS_VALIDATE` |
| `-a -b` | `{a: false, b: false}` | `crossValidate: argv => argv.a && argv.b ? 'Use a or b' : true` | `ERROR CROSS_VALIDATE` |
| `-a` | `{a: false, b: false}` | `crossValidate: argv => !(argv.a && argv.b)` | `{_: [], a: true, b: false}` |
| `-a` | `{a: false, b: false}` | `crossValidate: argv => {argv.b = argv.a}` | `{_: [], a: true, b: true}` |
| `-a -b` | `{a: {conflict: 'b'}, b: false}` | `crossValidate: () => true` | `ERROR CONFLICT` |

## Open points

- Not covered yet: `default`, `mandatory`, the rest of `transform`, `outputAlias`, `outputInflate`, and the help text.
