// @ts-ignore
import {ArgMateParams, ArgMateConfig, ArgProcessObj} from './types.js';
interface ArgMateConfigMandatory extends ArgMateConfig {
	error: (msg: string) => void;
	panic: (msg: string) => void;
}

// @ts-ignore
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

export default function argEngine(args: string[], argProcessObj?: ArgProcessObj) {
	argProcessObj = argProcessObj || {
		output: {
			_: [],
		},
		validate: [],
		mandatory: [],
		conflict: [],
		complexDefault: {},
		conf: {
			error: msg => {
				throw msg;
			},
			panic: msg => {
				throw msg;
			},
			allowUnknown: true,
			autoCamelKebabCase: true,
			allowNegatingFlags: true,
			allowKeyNumValues: true,
			allowAssign: true,
		},
		params: {},
	};

	const {mandatory, validate, complexDefault, output, conf, params, conflict} = argProcessObj;

	const inputLog: string[] = [];

	// Optimization: Cache frequently used methods and properties
	const {
		error,
		panic,
		allowUnknown,
		autoCamelKebabCase,
		allowNegatingFlags,
		allowKeyNumValues,
		allowAssign,
	} = conf;
	const outputPush = output['_'].push.bind(output['_']);
	const hasOwnProperty = Object.prototype.hasOwnProperty;

	// Reverse, pop, push, reverse 8.77 times faster than unshft, shift
	args.reverse();

	while (args.length) {
		let arg: string = '' + args.pop();

		if (arg.charCodeAt(0) !== 45) {
			outputPush(arg);
			continue;
		}

		const token = arg.match(re.paramTokens);

		if (!token) return panic('Group not returned');

		let {STOP, LONG, NO, KEY, KEYNUM, ASSIGN, VAL} = token.groups as {[key: string]: string};

		if (STOP) {
			output['_'] = output['_'].concat(args.reverse());
			break;
		}

		if (NO && !allowNegatingFlags) {
			KEY = (NO || '') + KEY;
			NO = '';
		}

		if (KEYNUM) {
			if (!allowKeyNumValues || LONG || ASSIGN) {
				KEY += KEYNUM;
				KEYNUM = '';
			} else {
				if (!LONG && 1 < KEY.length) {
					return error(
						`Unsupported format: '${arg}'. Did you miss a dash at the beginning?`
					);
				}
				VAL = ASSIGN = KEYNUM;
			}
		}

		if (!LONG && 1 < KEY.length) {
			const multi = KEY.split('').map(v => (NO ? '-no-' : '-') + v);
			multi[multi.length - 1] += ASSIGN || '';
			args = args.concat(multi.reverse());
			continue;
		}

		if (!KEY) {
			outputPush(arg);
			continue;
		}

		// Key is not a defined parameter
		if (!params[KEY]) {
			if (!allowUnknown) return error(`Unknown parameter '${KEY}' not allowed.`);

			if (autoCamelKebabCase && re.isKebab.test(KEY)) {
				KEY = KEY.replace(re.kebab2camel, (_, letter) => letter.toUpperCase());
			}

			if (ASSIGN) {
				if (!VAL) {
					if (args.length === 0) return error(`No data provided for '${KEY}'`);
					VAL = args.pop() || '';
				}
				// @ts-ignore
				output[KEY] = +VAL == VAL ? +VAL : VAL;
			} else {
				output[KEY] = !NO;
			}
			inputLog.push(KEY);
			continue;
		}

		const theKey = params[KEY].key;
		const theType = params[theKey].type;

		if ('boolean' === theType) {
			if (ASSIGN)
				return error(
					`The parameter '${KEY}' is a boolean (a flag) and can't be assigned a value like '${arg}'`
				);
			output[theKey] = !NO;
			inputLog.push(theKey);
			continue;
		}

		if (NO) {
			return error(`Can't negate '${KEY}' as the type is set to '${theType}'`);
		}

		if ('count' === theType) {
			output[theKey]++;
			inputLog.push(theKey);
			continue;
		}

		if (0 === args.length) {
			return error(`No data provided for '${KEY}'`);
		}

		VAL ||= args.pop() || '';

		let num = 0;

		switch (theType) {
			case 'string':
				output[theKey] = VAL;
				continue;

			case 'array':
			case 'string[]':
				output[theKey].push(VAL);
				continue;

			case 'number':
			case 'float':
			case 'number[]':
			case 'float[]':
				num = +VAL;
				break;

			case 'int':
			case 'int[]':
				num = +VAL | 0;
				if ('' + num !== VAL) num = NaN;
				break;

			case 'hex':
			case 'hex[]':
				num = parseInt(VAL, 16);
				break;
			default:
				return panic(`'${KEY}' configuration uses invalid type '${theType}'`);
		}

		if (isNaN(num) || !isFinite(num))
			return error(`The value of '${KEY}' is not a valid ${theType}: '${VAL}'`);

		if (Array.isArray(output[theKey])) {
			output[theKey].push(num);
		} else {
			output[theKey] = num;
		}
	}

	for (const [key, value] of Object.entries(complexDefault)) {
		if (!hasOwnProperty.call(params, key)) continue;
		if (undefined === output[key] || !output[key].length) {
			output[key] = value;
		}
	}

	for (const key of validate) {
		const param = params[key];
		let help = '';
		if ('function' === typeof param.valid) {
			if (param.valid(output[key])) continue;
		} else {
			if (!Array.isArray(param.valid))
				return panic(
					`The "valid" property of '${key}' parameter must be a function or an array of valid values`
				);
			if (param.valid.includes(output[key])) continue;
			help = '. Please use one of the following values: ' + JSON.stringify(param.valid);
		}
		return error(
			`The value provided for the parameter '${key}' is not valid: '${output[key]}'` + help
		);
	}

	for (const key of mandatory) {
		if (undefined === output[key])
			return error(
				`The parameter '${key}' is mandatory.${params[key]?.alias?.length ? ` You can also use an alias: ${params[key].alias.join(', ')}` : ''}`
			);
	}

	for (const key of conflict) {
		if (!inputLog.includes(key)) continue;
		const conflicting = params[key]?.conflict?.find(value => inputLog.includes(value));
		if (conflicting) {
			return error(`The parameter '${key}' conflicts with '${conflicting}'`);
		}
	}

	return output;
}
