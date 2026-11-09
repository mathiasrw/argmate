import type {ArgMateConfig, ArgMateEngineConfig, ArgMateError, ArgMateResponse} from './types.js';

import {asText, re} from './common.js';

/*
/^(?<stop>--)$|^-(?<full>-)?(?<no>no-)?(?<key>[^=\s]+?)(?<keynum>[\d]*)(?<assign>=(?<val>.*))?$/,
--
--full
--full=-fullval
--no-full5=ful--lval-5
--full=
-s
-s1234
--s1234=3423
-s=-sh--ortval
-s=
-abc=
-multi
-no-noabc
-no-n
-no-bca=66
--no-n-o--abc

array of value as default
*/

// The name as typed, with its dashes: the parts of the token before its value
const named = (LONG: string, NO: string, KEY: string) => (LONG ? '--' : '-') + (NO || '') + KEY;
// A value in a message: a long one, like a pasted file, would fill the screen, and the error has it in full in `value`
const cut = (text: unknown) => {
	const value = '' + text;
	return 16 < value.length ? value.slice(0, 16) + '...' : value;
};
// The token as typed of a parameter that is in the input, from the log of key, token pairs
const tokenOf = (typed: string[], key: string) => {
	for (let i = typed.length - 2; 0 <= i; i -= 2) if (typed[i] === key) return typed[i + 1];
	return '';
};
// The name as typed of a parameter that is in the input, or its long form in kebab case
const asTyped = (typed: string[], key: string, kebab?: boolean) => {
	const token = tokenOf(typed, key);
	return token
		? token.split('=')[0]
		: (1 < key.length ? '--' : '-') +
				(kebab && re.isCamel.test(key) ? key.replace(re.camel2kebab, '$1-$2').toLowerCase() : key);
};
// Loops in place of `re.isKebab` and `re.kebab2camel`: they run for each parameter that the config does not know,
// and a loop is faster than a regex there
const isKebab = (s: string) => {
	for (let i = 1; i < s.length - 1; i++) {
		if (45 === s.charCodeAt(i) && 45 !== s.charCodeAt(i - 1) && 45 !== s.charCodeAt(i + 1))
			return true;
	}
	return false;
};
const kebab2camel = (s: string) => {
	let out = '';
	for (let i = 0; i < s.length; i++) {
		if (45 === s.charCodeAt(i) && i + 1 < s.length) {
			const letter = String.fromCodePoint(s.codePointAt(++i) as number);
			out += letter.toUpperCase();
			if (1 < letter.length) i++;
		} else out += s[i];
	}
	return out;
};
// A value of unspecified type as a number, when it is an int, a float or scientific notation that a number holds
const autoNumber = (VAL: string) => {
	// A number starts with a digit or a dash, so most text is known not to be a number from its first character,
	// without the regex
	const first = VAL.charCodeAt(0);
	if (45 !== first && (first < 48 || 57 < first)) return VAL;
	const number = +VAL;
	return re.autoNumber.test(VAL) &&
		(Number.isSafeInteger(number) || (Number.isFinite(number) && !Number.isInteger(number)))
		? number
		: VAL;
};
// The value of a parameter as its type: NaN when it is not a valid value, undefined when the type is unknown
const finalValue = (theType: string, VAL: string): unknown => {
	switch (theType) {
		case 'string':
		case 'array':
		case 'string[]':
			return VAL;

		case 'number':
		case 'float':
		case 'number[]':
		case 'float[]':
			return VAL.trim() &&
				Number.isFinite(+VAL) &&
				(!Number.isInteger(+VAL) || Number.isSafeInteger(+VAL))
				? +VAL
				: Number.NaN;

		case 'int':
		case 'int[]': {
			// Plain digits are the usual int and need no regex. A leading zero or 16 digits or more go on to the regex below,
			// which decides them
			const first = VAL.charCodeAt(0);
			if (48 < first && first < 58 && VAL.length < 16) {
				let i = VAL.length;
				while (--i && 47 < VAL.charCodeAt(i) && VAL.charCodeAt(i) < 58);
				if (!i) return +VAL;
			}
			return (re.autoNumber.test(VAL) || re.isHexPrefix.test(VAL)) && Number.isSafeInteger(+VAL)
				? +VAL
				: Number.NaN;
		}

		case 'hex':
		case 'hex[]': {
			// Many digits give Infinity, which is not a value a number holds
			const number = re.isHex.test(VAL) ? Number.parseInt(VAL, 16) : Number.NaN;
			return Number.isFinite(number) ? number : Number.NaN;
		}

		case 'boolean':
		case 'boolean[]':
			return re.boolStringTrue.test(VAL) ? true : re.boolStringFalse.test(VAL) ? false : Number.NaN;

		default:
			return undefined;
	}
};
// The error object is its message in a string, as the error was before it became an object
const fail = (error: (e: ArgMateError) => never, e: ArgMateError) =>
	error(Object.setPrototypeOf(e, asText));

const PASS = {};

// Few configs have spot, next, last, exists, conflict or demand. As separate functions they are compiled when a
// config first needs one, so a program without them does not pay for them at start. They return PASS, or what the
// engine must return
function paramValueFromSpot(
	args: string[],
	output: any,
	typed: string[],
	configObj: ArgMateEngineConfig
): unknown {
	const {
		spots,
		parameterConfig,
		engineSettings: {error},
	} = configObj as any;

	// The index in the reversed array of each spot, highest first, so taking one out doesn't shift the next
	const inputs = args.length;
	const indexed: {key: string; index: number}[] = [];
	for (const key of spots) {
		const spot = parameterConfig[key].spot as number;
		indexed.push({key, index: spot < 0 ? -spot - 1 : inputs - spot});
	}
	indexed.sort((a, b) => b.index - a.index);

	for (let i = 0; i < indexed.length; i++) {
		const {key, index} = indexed[i];
		// A spot without an input is not an error here: mandatory decides that
		if (index < 0 || inputs <= index) continue;
		// A spot from the start and one from the end overlap when there are few inputs
		if (i && index === indexed[i - 1].index)
			return fail(error, {
				code: 'MISSING_VALUE',
				key,
				alias: (1 < key.length ? '--' : '-') + key,
				with: indexed[i - 1].key,
				message: `Not enough data provided for both '${indexed[i - 1].key}' and '${key}': they overlap`,
			});

		const type = parameterConfig[key].type;
		const name = (1 < key.length ? '--' : '-') + key;
		const value = '' + args[index];
		const data = finalValue(type, value);

		if (Number.isNaN(data)) {
			// An empty boolean is false, so an empty value here is an empty number
			if ('' === value)
				return fail(error, {
					code: 'MISSING_VALUE',
					key,
					alias: name,
					message: `No data provided for '${key}'`,
				});
			return fail(error, {
				code: 'BAD_VALUE',
				key,
				alias: name,
				value,
				message: `The value of '${key}' is not a valid ${type}: '${cut(value)}'`,
			});
		}

		args.splice(index, 1);
		if (Array.isArray(output[key])) (output[key] as unknown[]).push(data);
		else output[key] = data;
		typed.push(key, name);
	}
	return PASS;
}

// One parameter takes several inputs with next or last. `at` holds what the error messages need to say about the token
function paramValueFromNextOrLast(
	args: string[],
	output: any,
	param: any,
	error: any,
	at: {KEY: string; alias: string; ASSIGN: string; VAL: string; arg: string}
): unknown {
	const {KEY, alias, ASSIGN, VAL, arg} = at;
	const theKey = param.key;
	const theType = param.type;
	if (ASSIGN)
		return fail(error, {
			code: 'ASSIGN_NOT_ALLOWED',
			key: theKey,
			alias,
			value: VAL,
			message: `The parameter '${KEY}' takes the inputs after it and can't be assigned with '=': '${cut(arg)}'`,
		});

	const amount = (param.next || param.last) as number;
	const count = 0 < amount ? amount : args.length + amount + 1;
	if (count < 1 || args.length < count)
		return fail(error, {
			code: 'MISSING_VALUE',
			key: theKey,
			alias,
			message: `Not enough data provided for '${KEY}'`,
		});
	// `args` is reversed, so the splice gives the values in reverse. They are reversed again to the order typed
	const values = (
		param.last ? args.splice(0, count) : args.splice(args.length - count, count)
	).reverse();
	const list = output[theKey] as unknown[];
	if ('string[]' === theType || 'array' === theType) {
		list.push(...values);
		return PASS;
	}
	for (let i = 0; i < count; i++) {
		const value = '' + values[i];
		const data = finalValue(theType, value);
		if (Number.isNaN(data)) {
			if ('' === value)
				return fail(error, {
					code: 'MISSING_VALUE',
					key: theKey,
					alias,
					message: `No data provided for '${KEY}'`,
				});
			return fail(error, {
				code: 'BAD_VALUE',
				key: theKey,
				alias,
				value,
				message: `The value of '${KEY}' is not a valid ${theType}: '${cut(value)}'`,
			});
		}
		list.push(data);
	}
	return PASS;
}

function checkExists(output: any, typed: string[], configObj: ArgMateEngineConfig): unknown {
	const {
		exists,
		parameterConfig,
		engineSettings: {error, panic, autoCamelKebabCase},
	} = configObj as any;

	// After `transform`, so the path that is checked is the one the program gets, and before `validate`, so a
	// function there gets a file that is there. `fs` is loaded only for a value to check, so a runtime with no
	// `getBuiltinModule` can still use a config with these types and their defaults.
	for (const key of exists) {
		if (undefined === output[key]) continue;
		const param = parameterConfig[key];
		const kind = param.exists as string;
		// A default can be a word with a meaning to the program, like `-` for stdin, so a value that is the default
		// is not checked
		const defaults = ([] as unknown[]).concat(param.default ?? []);
		for (const value of Array.isArray(output[key]) ? output[key] : [output[key]]) {
			if (defaults.includes(value)) continue;
			if ('' === value)
				return fail(error, {
					code: 'MISSING_VALUE',
					key,
					alias: asTyped(typed, key, autoCamelKebabCase),
					message: `No ${kind} provided for '${key}'`,
				});
			// `getBuiltinModule` is new in Node 22.3, so the types of Bun do not have it yet
			const fs = (globalThis as any).process?.getBuiltinModule?.('node:fs');
			if (!fs)
				return panic(
					`The types 'file', 'folder' and 'path' need process.getBuiltinModule (Node 22.3 and newer, Bun, Deno)`
				);
			let stat: {isFile(): boolean; isDirectory(): boolean} | undefined;
			// A path that can not be read, or a value that is not a path, is not found
			try {
				stat = fs.statSync(value, {throwIfNoEntry: false});
			} catch {}
			if (!stat)
				return fail(error, {
					code: 'INVALID',
					key,
					alias: asTyped(typed, key, autoCamelKebabCase),
					value,
					message: kind[0].toUpperCase() + kind.slice(1) + ' not found: ' + value,
				});
			if ('path' === kind || ('file' === kind ? stat.isFile() : stat.isDirectory())) continue;
			return fail(error, {
				code: 'INVALID',
				key,
				alias: asTyped(typed, key, autoCamelKebabCase),
				value,
				message: 'Not a ' + kind + ': ' + value,
			});
		}
	}

	return PASS;
}

function checkGroups(typed: string[], configObj: ArgMateEngineConfig): unknown {
	const {
		conflict,
		demand,
		parameterConfig,
		engineSettings: {error, autoCamelKebabCase},
	} = configObj as any;

	for (const conflictingKey of conflict) {
		if (!tokenOf(typed, conflictingKey)) continue;
		const conflicting = parameterConfig[conflictingKey]?.conflict?.find((value: string) =>
			tokenOf(typed, value)
		);
		if (conflicting) {
			return fail(error, {
				code: 'CONFLICT',
				key: conflictingKey,
				alias: asTyped(typed, conflictingKey, autoCamelKebabCase),
				with: conflicting,
				withAlias: asTyped(typed, conflicting, autoCamelKebabCase),
				message: `The parameter '${asTyped(typed, conflictingKey, autoCamelKebabCase)}' conflicts with '${asTyped(typed, conflicting, autoCamelKebabCase)}'`,
			});
		}
	}

	for (const key of demand) {
		if (!tokenOf(typed, key)) continue;
		const missing = (parameterConfig[key].demand as string[]).find(name => !tokenOf(typed, name));
		if (missing) {
			return fail(error, {
				code: 'DEMAND',
				key,
				alias: asTyped(typed, key, autoCamelKebabCase),
				with: missing,
				withAlias: asTyped(typed, missing, autoCamelKebabCase),
				message: `The parameter '${asTyped(typed, key, autoCamelKebabCase)}' demands '${asTyped(typed, missing, autoCamelKebabCase)}'`,
			});
		}
	}

	return PASS;
}

export default function argEngine(
	args: string[],
	argProcessObj?: ArgMateEngineConfig
): ArgMateResponse<ArgMateConfig> {
	// Use logical OR for better performance
	const configObj = argProcessObj || {
		output: {_: []},
		validate: [],
		transform: [],
		exists: [],
		mandatory: [],
		conflict: [],
		demand: [],
		spots: [],
		nextOrLast: [],
		complexDefault: {},
		parameterConfig: {},
		engineSettings: {
			error: (e: ArgMateError) => {
				throw Object.assign(new Error(e.message), e);
			},
			panic: (msg: string) => {
				throw new Error(msg);
			},
			allowUnknown: true,
			autoCamelKebabCase: true,
			allowNegatingFlags: true,
			allowKeyNumValues: true,
			allowAssign: true,
			allowAutoNumbers: true,
			outputAlias: false,
			outputInflate: false,
		},
	};

	const {
		output: template,
		validate,
		transform,
		exists,
		mandatory,
		conflict,
		demand,
		spots,
		nextOrLast,
		complexDefault,
		parameterConfig,
		engineSettings: {
			error,
			panic,
			allowUnknown,
			autoCamelKebabCase,
			allowNegatingFlags,
			allowKeyNumValues,
			allowAutoNumbers,
			allowAssign,
			outputAlias,
			outputInflate,
			greedy,
			crossValidate,
		},
	} = configObj;

	const output = {...template};
	for (const key in output) if (Array.isArray(output[key])) output[key] = output[key].slice();

	// The parameters that are in the input, as key, token pairs
	const typed: string[] = [];
	// See poc benchmark for array assignment
	const _ = output._ as (string | number)[];
	const hasProp = Object.prototype.hasOwnProperty;

	// Reverse, pop, push, reverse 8.77 times faster than unshft, shift
	args = args.slice().reverse(); // A copy: the array of the caller does not change

	if (spots.length) {
		const stop = paramValueFromSpot(args, output, typed, configObj);
		if (PASS !== stop) return stop as ArgMateResponse<ArgMateConfig>;
	}
	while (args.length) {
		// Speed
		const arg: string = '' + args.pop();

		if (arg.charCodeAt(0) !== 45) {
			_.push(allowAutoNumbers ? autoNumber(arg) : arg);
			continue;
		}

		const second = arg.charCodeAt(1);

		if (
			(46 === second || (47 < second && second < 58)) &&
			!parameterConfig[arg[1]] &&
			re.numberish.test(arg)
		) {
			_.push(allowAutoNumbers ? autoNumber(arg) : arg);
			continue;
		}

		const token = (45 === second ? re.paramLong : re.paramShort).exec(arg);

		if (!token) {
			if (re.notParam.test(arg)) {
				_.push(arg);
				continue;
			}
			return fail(error, {
				code: 'UNKNOWN',
				alias: arg,
				message:
					`Invalid parameter '${arg}'` +
					(45 !== second && parameterConfig[arg.slice(1)] ? `\n\nDid you mean '-${arg}'?` : ''),
			});
		}

		// The groups have no names, so the match has no `groups` object. See `re` in common.ts for the place of each
		const STOP = token[1];
		const LONG = token[2];
		let NO = token[3];
		let KEY = token[4];
		let KEYNUM = token[5];
		let ASSIGN = token[6];
		let VAL = '';

		if (ASSIGN) {
			ASSIGN = arg.slice(token[0].length - 1);
			VAL = ASSIGN.slice(1);
			if (!allowAssign)
				return fail(error, {
					code: 'ASSIGN_NOT_ALLOWED',
					key: parameterConfig[KEY]?.key || KEY,
					alias: named(LONG, NO, KEY + (KEYNUM || '')),
					value: VAL,
					message: `Assigning a value with '=' is not allowed: '${cut(arg)}'`,
				});
		}

		if (STOP) {
			if (greedy) {
				output._.push(args.reverse().join(' '));
			} else {
				output._ = output._.concat(args.reverse());
			}
			break;
		}

		if (NO && !allowNegatingFlags) {
			KEY = NO + KEY;
			NO = '';
		}

		if (KEYNUM && (!allowKeyNumValues || ASSIGN)) {
			KEY += KEYNUM;
			KEYNUM = '';
		}

		if (!LONG && (KEYNUM || (!parameterConfig[KEY] && re.hasDigit.test(KEY)))) {
			const multi = (
				re.hasNonAscii.test(KEY) ? (KEY + KEYNUM).match(re.graphemes) : (KEY + KEYNUM).split('')
			) as string[];
			if (multi.every(k => parameterConfig[k])) {
				multi[multi.length - 1] += ASSIGN || '';
				for (let i = multi.length; i--; ) args.push('-' + multi[i]);
				continue;
			}
			if (!parameterConfig[KEY] && (!KEYNUM || re.hasDigit.test(KEY))) {
				if (!ASSIGN) {
					_.push(arg);
					continue;
				}
				return fail(error, {
					code: 'NUMBER_NAME',
					key: KEY,
					alias: named(LONG, NO, KEY),
					message: `Invalid parameter '${arg}': a short name with a digit must be in the config`,
				});
			}
		}

		if (!LONG && 1 < KEY.length) {
			const multi = re.hasNonAscii.test(KEY)
				? (KEY.match(re.graphemes) as string[])
				: KEY.split('');
			if (1 < multi.length) {
				// A group that is also a long name is most likely that name with one dash too few, so an unknown
				// letter in it is an error also when unknown names are allowed: `-file` is not `-f -i -l -e`
				const unknown =
					(!allowUnknown || parameterConfig[KEY]) && multi.find(k => !parameterConfig[k]);
				if (unknown)
					return fail(error, {
						code: 'UNKNOWN',
						key: unknown,
						alias: '-' + unknown,
						message:
							`Unknown parameter '-${unknown}' in '${arg}'` +
							(parameterConfig[KEY] ? `\n\nDid you mean '--${KEY}'?` : ''),
					});
				multi[multi.length - 1] += KEYNUM + (ASSIGN || '');
				for (let i = multi.length; i--; ) args.push('-' + multi[i]);
				continue;
			}
		}

		if (KEYNUM) VAL = ASSIGN = KEYNUM;

		// Key is not a defined parameter
		if (!parameterConfig[KEY]) {
			if (!allowUnknown)
				return fail(error, {
					code: 'UNKNOWN',
					key: KEY,
					alias: named(LONG, NO, KEY),
					message: `Unknown parameter '${KEY}' not allowed`,
				});

			if (re.onlyDigits.test(KEY))
				return fail(error, {
					code: 'NUMBER_NAME',
					key: KEY,
					alias: named(LONG, NO, KEY),
					message: `Invalid parameter '${arg}': a name of only digits must be in the config`,
				});

			if (autoCamelKebabCase && isKebab(KEY)) {
				KEY = kebab2camel(KEY);
			}

			if (ASSIGN) {
				if (NO)
					return fail(error, {
						code: 'NEGATED_AND_ASSIGNED',
						key: KEY,
						alias: named(LONG, NO, KEY),
						value: VAL,
						message: `The parameter '${KEY}' can't be negated AND assigned at the same time`,
					});
				output[KEY] = allowAutoNumbers ? autoNumber(VAL) : VAL;
			} else {
				output[KEY] = !NO;
			}
			typed.push(KEY, arg);
			continue;
		}

		const theKey = parameterConfig[KEY].key;
		const theType = parameterConfig[theKey].type;
		typed.push(theKey, arg);

		if ('boolean' === theType || 'boolean[]' === theType) {
			let result = !NO;
			if (ASSIGN) {
				if (NO)
					return fail(error, {
						code: 'NEGATED_AND_ASSIGNED',
						key: theKey,
						alias: named(LONG, NO, KEY),
						value: VAL,
						message: `The parameter '${KEY}' can't be negated AND assigned at the same time`,
					});

				if (re.boolStringTrue.test(VAL)) {
					result = true;
				} else if (re.boolStringFalse.test(VAL)) {
					result = false;
				} else {
					return fail(error, {
						code: 'BAD_VALUE',
						key: theKey,
						alias: named(LONG, NO, KEY),
						value: VAL,
						message: `The parameter '${KEY}' is a boolean (a flag) so can't assign a value like '${cut(VAL)}'`,
					});
				}
			}
			if ('boolean' === theType) output[theKey] = result;
			else (output[theKey] as boolean[]).push(result);
			continue;
		}

		if (nextOrLast.length && (parameterConfig[theKey].next || parameterConfig[theKey].last)) {
			const stop = paramValueFromNextOrLast(args, output, parameterConfig[theKey], error, {
				KEY,
				alias: named(LONG, NO, KEY),
				ASSIGN,
				VAL,
				arg,
			});
			if (PASS !== stop) return stop as ArgMateResponse<ArgMateConfig>;
			continue;
		}

		if (!ASSIGN && 'count' !== theType) {
			if (0 === args.length)
				return fail(error, {
					code: 'MISSING_VALUE',
					key: theKey,
					alias: named(LONG, NO, KEY),
					message: `No data provided for '${KEY}'`,
				});
			VAL = args.pop() || '';
		}

		if ('count' === theType) {
			if (NO)
				return fail(error, {
					code: 'BAD_TYPE',
					key: theKey,
					alias: named(LONG, NO, KEY),
					message: `Can't negate '${KEY}' as the type is set to '${theType}'`,
				});
			let inc = 1;
			if (ASSIGN) {
				inc = +VAL | 0;
				if (inc + '' !== VAL) {
					if ('' === VAL)
						return fail(error, {
							code: 'MISSING_VALUE',
							key: theKey,
							alias: named(LONG, NO, KEY),
							message: `No data provided for '${KEY}'`,
						});
					return fail(error, {
						code: 'BAD_VALUE',
						key: theKey,
						alias: named(LONG, NO, KEY),
						value: VAL,
						message: `The value of '${KEY}' is not a valid int: '${cut(VAL)}'`,
					});
				}
			}
			(output[theKey] as number) += inc;
			continue;
		}

		if (NO)
			return fail(error, {
				code: 'NEGATED_AND_ASSIGNED',
				key: theKey,
				alias: named(LONG, NO, KEY),
				value: VAL,
				message: `The parameter '${KEY}' can't be negated AND assigned at the same time`,
			});

		// A string is its final value, so it is stored at once and the next input is read
		if ('string' === theType) {
			output[theKey] = VAL;
			continue;
		}
		if ('string[]' === theType || 'array' === theType) {
			(output[theKey] as unknown[]).push(VAL);
			continue;
		}

		const data = finalValue(theType, VAL);

		if (undefined === data)
			return panic(`Parameter '${KEY}' configuration has an invalid type: '${theType}'`);

		// A boolean was read above, so here an empty value is an empty number
		if (Number.isNaN(data)) {
			if ('' === VAL)
				return fail(error, {
					code: 'MISSING_VALUE',
					key: theKey,
					alias: named(LONG, NO, KEY),
					message: `No data provided for '${KEY}'`,
				});
			return fail(error, {
				code: 'BAD_VALUE',
				key: theKey,
				alias: named(LONG, NO, KEY),
				value: VAL,
				message: `The value of '${KEY}' is not a valid ${theType}: '${cut(VAL)}'`,
			});
		}

		if (Array.isArray(output[theKey])) {
			output[theKey].push(data);
		} else {
			output[theKey] = data;
		}
	}

	for (const [key, value] of Object.entries(complexDefault)) {
		if (undefined === output[key] || !(output[key] as unknown[]).length) {
			output[key] = value.slice();
		}
	}

	for (const key of validate) {
		const valid = parameterConfig[key].valid as unknown[][] | undefined;
		if (undefined === output[key] || !valid) continue;
		const toValue = (v: unknown) => valid.find(item => item.includes(v))?.[0] ?? v;
		output[key] = Array.isArray(output[key]) ? output[key].map(toValue) : toValue(output[key]);
	}

	for (const key of transform) {
		if (undefined === output[key]) continue;
		const fn: unknown = parameterConfig[key].transform;
		if ('function' !== typeof fn) {
			return panic(`The "transform" property of '${key}' parameter must be a function`);
		}
		try {
			output[key] = fn(output[key]);
		} catch (e) {
			return fail(error, {
				code: 'INVALID',
				key,
				alias: asTyped(typed, key, autoCamelKebabCase),
				value: output[key],
				message: `The transform for '${key}' threw: ${e instanceof Error ? e.message : String(e)}`,
			});
		}
	}

	if (exists.length) {
		const stop = checkExists(output, typed, configObj);
		if (PASS !== stop) return stop as ArgMateResponse<ArgMateConfig>;
	}

	for (const key of validate) {
		if (undefined === output[key]) continue;

		const param = parameterConfig[key];
		let help = '';
		const values: unknown[] = Array.isArray(output[key]) ? output[key] : [output[key]];

		if ('function' === typeof param.validate) {
			const result = param.validate(output[key], param.valid);
			if ('string' === typeof result && result) help = result;
			else if (result || undefined === result) continue;
		} else if (param.validate instanceof RegExp) {
			if (values.every(v => -1 < String(v).search(param.validate as RegExp))) continue;
			help = '. The value must match ' + param.validate;
		} else {
			if (values.every(v => (param.valid as unknown[][]).some(item => item[0] === v))) continue;
			help =
				'. Please use one of the following values: ' +
				(param.validShown as unknown[][]).map(item => item.join('/')).join(', ');
		}

		return fail(error, {
			code: 'INVALID',
			key,
			alias: asTyped(typed, key, autoCamelKebabCase),
			value: output[key],
			...(param.validate instanceof RegExp
				? {valid: param.validate}
				: param.validShown
					? {valid: param.validShown.flat()}
					: {}),
			message:
				'function' === typeof param.validate && help
					? help
					: `The value provided for the parameter '${key}' is not valid: '${cut(output[key])}'` +
						help,
		});
	}

	for (const key of mandatory) {
		if (undefined === output[key])
			return fail(error, {
				code: 'MANDATORY',
				key,
				alias: asTyped(typed, key, autoCamelKebabCase),
				message: `The parameter '${key}' is mandatory.${parameterConfig[key]?.alias?.length ? ` You can also use an alias: ${parameterConfig[key].alias.join(', ')}` : ''}`,
			});
	}
	if (conflict.length || demand.length) {
		const stop = checkGroups(typed, configObj);
		if (PASS !== stop) return stop as ArgMateResponse<ArgMateConfig>;
	}

	if (crossValidate) {
		const result = crossValidate(output);
		if (false === result || ('string' === typeof result && result))
			return fail(error, {
				code: 'CROSS_VALIDATE',
				message: result || 'Across parameters and values this is not a valid combination',
			});
	}

	if (outputAlias) {
		const tempOutput: Record<string, unknown> = {};
		for (const key in output) {
			if ('_' === key || !hasProp.call(output, key)) continue;
			const result = output[key];
			tempOutput[key] = result;
			const alias = parameterConfig[key]?.alias;
			if (!alias) continue;
			for (const a of alias) {
				tempOutput[a] = result;
			}
		}

		Object.assign(output, tempOutput);
	}

	if (outputInflate) {
		return inflate(output as ArgMateResponse<ArgMateConfig>);
	}

	return output as ArgMateResponse<ArgMateConfig>;
}

function inflate(flatObj: ArgMateResponse<ArgMateConfig>): ArgMateResponse<ArgMateConfig> {
	const result: Record<string, unknown> = {};

	// Always preserve the _ property
	result._ = flatObj._;

	for (const key in flatObj) {
		if (key === '_') continue; // Skip _ as it's already handled
		const keys = key.split('.');
		let currentLevel: Record<string, unknown> = result;

		keys.forEach((k: string, i: number) => {
			if (!currentLevel[k]) {
				currentLevel[k] = {};
			}

			if (i === keys.length - 1) {
				currentLevel[k] = flatObj[key];
			} else {
				currentLevel = currentLevel[k] as Record<string, unknown>;
			}
		});
	}

	return result as ArgMateResponse<ArgMateConfig>;
}
