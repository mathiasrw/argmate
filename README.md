# ArgMate

> A helpful friend when you need a super fast parser for your cli parameter parser with a few bells and whissels.

```sh
yarn add argmate
# or
npm install argmate
```

# Usage

     argMate(arguments, [parameters	[, config ]]);

# Examples

Getting started

```js
import argMate from 'argmate';

let arguments = process.argv.slice(2);		// In this example we take the arguments provided to the parameter
let params = {loops: 10, help:false}; 		// --loops must be an integer and will default to 10 if not set. --help is a boolean.
let config = {
	allowUnknown: false						// only the parameters we have specified are allowed (--loops and --help). Defaults to true.
	error= (msg)=>{ 						// If there is an error (like providing parameters not allowed), this function will be envoked. Defaults to throwing an exception.
		console.error('There was a problem:', msg);
		process.exit(1)
	}
};

let argv = argMate(arguments, params, config);			// params and config are not mandatory
```

A more complete exampale

```js
import argMate, {helpText} from 'argmate';

let arguments = process.argv.slice(2);
let params = {
	start: {
		default:0
		alias:['s']
	},
	steps: {
		type:number,
		mandatory: true;
		alias:['l', 'loops']
		valid: (v) => v > 0
	},
	help:{
		alias:['h'],
	}
};

let argv = argMate(arguments, params);

if(argv.help){
	console.log(helpText());
	process.exit();
}

for(let i = argv.start; i<argv.start+argv.steps;i++){
	console.log(i)
}

```

Defaults to treating parameters as boolean

```js
import argMate from 'argmate';
let argv

argv = argMate(['--foo', 'bar']);
> {_:['bar'], foo:true}

argv = argMate(['--foo', 'bar'], {foo:{type:string}});
> {_:[], foo:bar}
```

The configuration of the parameters can contain the following fields

```js
    params = {
		"foo": {				// the object returned with values will always haver this name no matter what alias you use. If you camelCase the keyword it will accept same param in kebab-case
			"type": "string",	// boolean | string | number/float | int | hex | array/string[] | number[]/float[] | int[] | hex[]
			"default" val		// The default value for the parameter. If type is not specified type will be determined from this field
			"mandatory": true	// Forces a value to be privded. No effect if used in combination with "default"
			"alias": [],		// other values to be treated as this parameter. Also accepts single string.
			"conflict": []		// other keys or aliases to be treated as conflicting. Also accepts single string.
			"valid": ()=>{}		// Function to check if the value is valid (will call config.error if not valid)
			"describe": 		// A description of the parameter. Will be used for the heltText (see below)
    	}
	}

	config = {
		error: msg => {},		// Function to be called when there a problem has been detected in the parsing. Defaults to throwing an informative exceltion.
		panic: msg => {},		// Function to be called when there is a panic in the engine. Defaults to throwing an informative exceltion (mostly used for development and should probably not be changed)
		allowUnknown: true,		// Specify if parameters not described in "params" area allowed. If violated config.error will be called.
		no: true,				// Specify if boolean flags with "no-" as the first part will be treated as a negation. If so --no-foo will result in {'_':[], 'foo': false}. Works well with default: true;
		intro: "abc",			// Text to add above the information about each parameter in the help text
		outro: "xyz",			// Text to add below the information about each parameter in the help text
};
```

## helpText

After calling argMate you can call helpText() to get a CLI friendly description of the code

```js
import argMate, { helpText } from '../src/argMate.js';

let argv = argMate(process.argv.slice(2), {
	foo: { type: 'string' },
	foo2: { type: 'string' },
}, { intro: "what is going on?", outro: "Vi ses!" }));

console.log(helpText({					// showing the default values in case
			width: 100,					// max caracter limit in the width of the output
			format: 'cli',				// cli | markdown
			voidIntro: false,			// Avoid including the intro
			voidOutro: false,			// Avoid including the outro
		}));
```
