import type {ArgMateConfig, ArgMateEngineConfig, ArgMateResponse} from './types.js';

import {re} from './common.js';

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

export default function argEngine(
	args: string[],
	argProcessObj?: ArgMateEngineConfig
): ArgMateResponse<ArgMateConfig> {
	// Use logical OR for better performance
	const configObj = argProcessObj || {
		output: {_: []},
		validate: [],
		transform: [],
		mandatory: [],
		conflict: [],
		complexDefault: {},
		parameterConfig: {},
		engineSettings: {
			error: (msg: string) => {
				throw new Error(msg);
			},
			panic: (msg: string) => {
				throw new Error(msg);
			},
			allowUnknown: true,
			autoCamelKebabCase: true,
			allowNegatingFlags: true,
			allowKeyNumValues: true,
			allowAssign: true,
			outputAlias: false,
			allowBoolString: true,
			outputInflate: false,
		},
	};

	const {
		output,
		validate,
		transform,
		mandatory,
		conflict,
		complexDefault,
		parameterConfig,
		engineSettings: {
			error,
			panic,
			allowUnknown,
			autoCamelKebabCase,
			allowNegatingFlags,
			allowKeyNumValues,
			// allowAssign,
			outputAlias,
			allowBoolString,
			outputInflate,
			greedy,
		},
	} = configObj;

	const inputLog: string[] = [];
	// See poc benchmark for array assignment
	const _ = output._ as (string | number)[];
	const hasProp = Object.prototype.hasOwnProperty;

	// Reverse, pop, push, reverse 8.77 times faster than unshft, shift
	args = args.slice().reverse(); // A copy: the array of the caller does not change

	while (args.length) {
		// Speed
		const arg: string = '' + args.pop();

		if (arg.charCodeAt(0) !== 45) {
			_.push(arg);
			continue;
		}

		const token = arg.match(re.paramTokens);

		if (!token) {
			_.push(arg);
			continue;
		}

		let {STOP, LONG, NO, KEY, KEYNUM, ASSIGN, VAL} = token.groups as {[key: string]: string};

		if (STOP) {
			if (greedy) {
				output._.push(args.reverse().join(' '));
			} else {
				output._ = output._.concat(args.reverse());
			}
			break;
		}

		if (NO && !allowNegatingFlags) {
			KEY = (NO || '') + KEY;
			NO = '';
		}

		if (KEYNUM && (!allowKeyNumValues || LONG || ASSIGN)) {
			KEY += KEYNUM;
			KEYNUM = '';
		}

		if (!LONG && 1 < KEY.length) {
			const multi = re.hasNonAscii.test(KEY)
				? (KEY.match(re.graphemes) as string[])
				: KEY.split('');
			if (1 < multi.length) {
				multi[multi.length - 1] += KEYNUM + (ASSIGN || '');
				args = args.concat(multi.map(v => (NO ? '-no-' : '-') + v).reverse());
				continue;
			}
		}

		if (KEYNUM) VAL = ASSIGN = KEYNUM;

		if (!KEY) {
			_.push(arg);
			continue;
		}

		// Key is not a defined parameter
		if (!parameterConfig[KEY]) {
			if (!allowUnknown) return error(`Unknown parameter '${KEY}' not allowed`);

			if (autoCamelKebabCase && re.isKebab.test(KEY)) {
				KEY = KEY.replace(re.kebab2camel, (_, letter) => letter.toUpperCase());
			}

			if (ASSIGN) {
				// Speed
				if (+VAL + '' === VAL) output[KEY] = +VAL;
				else if (allowBoolString && re.boolStringTrue.test(VAL)) output[KEY] = true;
				else if (allowBoolString && re.boolStringFalse.test(VAL)) output[KEY] = false;
				else output[KEY] = VAL;
			} else {
				output[KEY] = !NO;
			}
			inputLog.push(KEY);
			continue;
		}

		const theKey = parameterConfig[KEY].key;
		const theType = parameterConfig[theKey || KEY].type;

		if (!ASSIGN && 'count' !== theType && 'boolean' !== theType) {
			if (0 === args.length) return error(`No data provided for '${KEY}'`);
			VAL = args.pop() || '';
		}

		if ('boolean' === theType) {
			let result = !NO;
			if (ASSIGN) {
				if (NO)
					return error(`The parameter '${KEY}' can't be negated AND assigned at the same time`);

				if (allowBoolString && re.boolStringTrue.test(VAL)) {
					result = true;
				} else if (allowBoolString && re.boolStringFalse.test(VAL)) {
					result = false;
				} else {
					return error(
						`The parameter '${KEY}' is a boolean (a flag) so can't assign a value like '${VAL === VAL.slice(0, 16) ? VAL : VAL.slice(0, 16)}'`
					);
				}
			}
			output[theKey] = result;
			inputLog.push(theKey);
			continue;
		}

		if (NO) {
			return error(`Can't negate '${KEY}' as the type is set to '${theType}'`);
		}

		if ('count' === theType) {
			let inc = 1;
			if (ASSIGN) {
				inc = +VAL | 0;
				if (inc + '' !== VAL) {
					return error(`The value of '${KEY}' is not a valid int: '${VAL}'`);
				}
			}
			(output[theKey] as number) += inc;
			inputLog.push(theKey);
			continue;
		}

		let data = 0;

		switch (theType) {
			case 'string':
				output[theKey] = VAL;
				continue;

			case 'array':
			case 'string[]':
				(output[theKey] as unknown[]).push(VAL);
				continue;

			case 'number':
			case 'float':
			case 'number[]':
			case 'float[]':
				data = VAL.trim() ? +VAL : Number.NaN;
				break;

			case 'int':
			case 'int[]':
				data = +VAL | 0;
				if (data + '' !== VAL && !re.isHexPrefix.test(VAL)) data = Number.NaN;
				break;

			case 'hex':
			case 'hex[]':
				if (re.isHex.test(VAL)) {
					data = Number.parseInt(VAL, 16);
				} else {
					data = Number.NaN;
				}

				break;

			/*
			case 'json':
				console.log(VAL);
				try {
					data = JSON.parse(VAL);
				} catch (e) {
					data = NaN; // I know - a bit cheeky...
					VAL = e.message; // VAL.replace(re.truncate, '$1...');
				}
				break;
			*/

			default:
				return panic(`Parameter '${KEY}' configuration has an invalid type: '${theType}'`);
		}

		if (Number.isNaN(data) || !Number.isFinite(data))
			return error(`The value of '${KEY}' is not a valid ${theType}: '${VAL}'`);

		if (Array.isArray(output[theKey])) {
			output[theKey].push(data);
		} else {
			output[theKey] = data;
		}
	}

	for (const [key, value] of Object.entries(complexDefault)) {
		if (!hasProp.call(parameterConfig, key)) continue;
		if (undefined === output[key] || !(output[key] as unknown[]).length) {
			output[key] = value;
		}
	}

	for (const key of validate) {
		if (undefined === output[key]) continue;

		const param = parameterConfig[key];
		let help = '';

		if ('function' === typeof param.validate) {
			if (param.validate(output[key])) continue;
		} else if (param.validate instanceof RegExp) {
			if (
				(Array.isArray(output[key]) ? output[key] : [output[key]]).every(
					v => -1 < String(v).search(param.validate as RegExp)
				)
			)
				continue;
			help = '. The value must match ' + param.validate;
		} else {
			if ((param.validate as any[]).includes(output[key])) continue;
			help = '. Please use one of the following values: ' + JSON.stringify(param.validate);
		}

		return error(
			`The value provided for the parameter '${key}' is not valid: '${output[key]}'` + help
		);
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
			return error(
				`The transform for '${key}' threw: ${e instanceof Error ? e.message : String(e)}`
			);
		}
	}

	for (const key of mandatory) {
		if (undefined === output[key])
			return error(
				`The parameter '${key}' is mandatory.${parameterConfig[key]?.alias?.length ? ` You can also use an alias: ${parameterConfig[key].alias.join(', ')}` : ''}`
			);
	}
	for (const conflictingKey of conflict) {
		if (!inputLog.includes(conflictingKey)) continue;
		const conflicting = parameterConfig[conflictingKey]?.conflict?.find((value: string) =>
			//const conflicting = config[config[conflictingKey].key]?.conflict?.find((value: string) =>
			inputLog.includes(value)
		);
		if (conflicting) {
			return error(`The parameter '${conflictingKey}' conflicts with '${conflicting}'`);
		}
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
