// Variant `param`: the same as `this.ts`, but each function gets the state of the parse as its one argument.
// Made by make-variants.py from this.ts. Do not edit.
// @ts-nocheck
import {re} from '../../src/common.js';

const hasProp = Object.prototype.hasOwnProperty;

// What a step tells the loop. 0: go to the next step
const NEXT = 1; // read the next argument
const STOP = 2; // leave the loop
const EXIT = 3; // return `s.exit` from the engine

function decode(s) {
	const token = s.arg.match(re.paramTokens);
	if (!token) {
		s.exit = s.panic('Group not returned');
		return EXIT;
	}
	const groups = token.groups;
	s.STOP = groups.STOP;
	s.LONG = groups.LONG;
	s.NO = groups.NO;
	s.KEY = groups.KEY;
	s.KEYNUM = groups.KEYNUM;
	s.ASSIGN = groups.ASSIGN;
	s.VAL = groups.VAL;
	return 0;
}

function stop(s) {
	if (!s.STOP) return 0;
	if (s.greedy) {
		s.output._.push(s.args.reverse().join(' '));
	} else {
		s.output._ = s.output._.concat(s.args.reverse());
	}
	return STOP;
}

function negate(s) {
	if (s.NO && !s.allowNegatingFlags) {
		s.KEY = (s.NO || '') + s.KEY;
		s.NO = '';
	}
	return 0;
}

function keynum(s) {
	if (s.KEYNUM) {
		if (!s.allowKeyNumValues || s.LONG || s.ASSIGN) {
			s.KEY += s.KEYNUM;
			s.KEYNUM = '';
		} else {
			if (!s.LONG && 1 < s.KEY.length) {
				s.exit = s.error(`Unsupported format: '${s.arg}'. Did you miss a dash at the beginning?`);
				return EXIT;
			}
			s.VAL = s.ASSIGN = s.KEYNUM;
		}
	}
	return 0;
}

function group(s) {
	if (!s.LONG && 1 < [...s.KEY].length) {
		const multi = s.KEY.split('').map(v => (s.NO ? '-no-' : '-') + v);
		multi[multi.length - 1] += s.ASSIGN || '';
		s.args = s.args.concat(multi.reverse());
		return NEXT;
	}
	return 0;
}

function positional(s) {
	if (!s.KEY) {
		s._.push(s.arg);
		return NEXT;
	}
	return 0;
}

function unknown(s) {
	if (s.parameterConfig[s.KEY]) return 0;

	if (!s.allowUnknown) {
		s.exit = s.error(`Unknown parameter '${s.KEY}' not allowed`);
		return EXIT;
	}

	if (s.autoCamelKebabCase && re.isKebab.test(s.KEY)) {
		s.KEY = s.KEY.replace(re.kebab2camel, (_, letter) => letter.toUpperCase());
	}

	if (s.ASSIGN) {
		if (!s.VAL) {
			if (s.args.length === 0) {
				s.exit = s.error(`No data provided for '${s.KEY}'`);
				return EXIT;
			}
			s.VAL = s.args.pop() || '';
		}
		const VAL = s.VAL;
		if (+VAL + '' === VAL) s.output[s.KEY] = +VAL;
		else if (s.allowBoolString && re.boolStringTrue.test(VAL)) s.output[s.KEY] = true;
		else if (s.allowBoolString && re.boolStringFalse.test(VAL)) s.output[s.KEY] = false;
		else s.output[s.KEY] = VAL;
	} else {
		s.output[s.KEY] = !s.NO;
	}
	s.inputLog.push(s.KEY);
	return NEXT;
}

function value(s) {
	s.theKey = s.parameterConfig[s.KEY].key;
	s.theType = s.parameterConfig[s.theKey || s.KEY].type;

	if (!s.VAL && !(('count' === s.theType && !s.ASSIGN) || ('boolean' === s.theType && !s.ASSIGN))) {
		if (0 === s.args.length) {
			s.exit = s.error(`No data provided for '${s.KEY}'`);
			return EXIT;
		}

		s.VAL ||= s.args.pop() || '';
	}
	return 0;
}

function bool(s) {
	if ('boolean' !== s.theType) return 0;

	let result = !s.NO;
	if (s.ASSIGN) {
		if (s.NO) {
			s.exit = s.error(`The parameter '${s.KEY}' can't be negated AND assigned at the same time`);
			return EXIT;
		}

		if (s.allowBoolString && re.boolStringTrue.test(s.VAL)) {
			result = true;
		} else if (s.allowBoolString && re.boolStringFalse.test(s.VAL)) {
			result = false;
		} else {
			const VAL = s.VAL;
			s.exit = s.error(
				`The parameter '${s.KEY}' is a boolean (a flag) so can't assign a value like '${VAL === VAL.slice(0, 16) ? VAL : VAL.slice(0, 16)}'`
			);
			return EXIT;
		}
	}
	s.output[s.theKey] = result;
	s.inputLog.push(s.theKey);
	return NEXT;
}

function negated(s) {
	if (s.NO) {
		s.exit = s.error(`Can't negate '${s.KEY}' as the type is set to '${s.theType}'`);
		return EXIT;
	}
	return 0;
}

function count(s) {
	if ('count' !== s.theType) return 0;

	let inc = 1;
	if (s.ASSIGN) {
		inc = +s.VAL | 0;
		if (inc + '' !== s.VAL) {
			s.exit = s.error(`The value of '${s.KEY}' is not a valid int: '${s.VAL}'`);
			return EXIT;
		}
	}
	s.output[s.theKey] += inc;
	s.inputLog.push(s.theKey);
	return NEXT;
}

function convert(s) {
	const VAL = s.VAL;
	let data = 0;

	switch (s.theType) {
		case 'string':
			s.output[s.theKey] = VAL;
			return NEXT;

		case 'array':
		case 'string[]':
			s.output[s.theKey].push(VAL);
			return NEXT;

		case 'number':
		case 'float':
		case 'number[]':
		case 'float[]':
			data = +VAL;
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

		default:
			s.exit = s.panic(`Parameter '${s.KEY}' configuration has an invalid type: '${s.theType}'`);
			return EXIT;
	}

	if (Number.isNaN(data) || !Number.isFinite(data)) {
		s.exit = s.error(`The value of '${s.KEY}' is not a valid ${s.theType}: '${VAL}'`);
		return EXIT;
	}

	if (Array.isArray(s.output[s.theKey])) {
		s.output[s.theKey].push(data);
	} else {
		s.output[s.theKey] = data;
	}
	return NEXT;
}

function defaults(s) {
	for (const [key, value] of Object.entries(s.complexDefault)) {
		if (!hasProp.call(s.parameterConfig, key)) continue;
		if (undefined === s.output[key] || !s.output[key].length) {
			s.output[key] = value;
		}
	}
	return 0;
}

function validate(s) {
	const output = s.output;
	for (const key of s.validate) {
		if (undefined === output[key]) continue;

		const param = s.parameterConfig[key];
		let help = '';

		if ('function' === typeof param.validate) {
			if (param.validate(output[key])) continue;
		} else if (param.validate instanceof RegExp) {
			if (
				(Array.isArray(output[key]) ? output[key] : [output[key]]).every(
					v => -1 < String(v).search(param.validate)
				)
			)
				continue;
			help = '. The value must match ' + param.validate;
		} else {
			if (param.validate.includes(output[key])) continue;
			help = '. Please use one of the following values: ' + JSON.stringify(param.validate);
		}

		s.exit = s.error(
			`The value provided for the parameter '${key}' is not valid: '${output[key]}'` + help
		);
		return EXIT;
	}
	return 0;
}

function transform(s) {
	const output = s.output;
	for (const key of s.transform) {
		if (undefined === output[key]) continue;
		const fn = s.parameterConfig[key].transform;
		if ('function' !== typeof fn) {
			s.exit = s.panic(`The "transform" property of '${key}' parameter must be a function`);
			return EXIT;
		}
		try {
			output[key] = fn(output[key]);
		} catch (e) {
			s.exit = s.error(
				`The transform for '${key}' threw: ${e instanceof Error ? e.message : String(e)}`
			);
			return EXIT;
		}
	}
	return 0;
}

function mandatory(s) {
	for (const key of s.mandatory) {
		if (undefined === s.output[key]) {
			s.exit = s.error(
				`The parameter '${key}' is mandatory.${s.parameterConfig[key]?.alias?.length ? ` You can also use an alias: ${s.parameterConfig[key].alias.join(', ')}` : ''}`
			);
			return EXIT;
		}
	}
	return 0;
}

function conflict(s) {
	for (const conflictingKey of s.conflict) {
		if (!s.inputLog.includes(conflictingKey)) continue;
		const conflicting = s.parameterConfig[conflictingKey]?.conflict?.find(value =>
			s.inputLog.includes(value)
		);
		if (conflicting) {
			s.exit = s.error(`The parameter '${conflictingKey}' conflicts with '${conflicting}'`);
			return EXIT;
		}
	}
	return 0;
}

function alias(s) {
	const output = s.output;
	const tempOutput = {};
	for (const key in output) {
		if ('_' === key || !hasProp.call(output, key)) continue;
		const result = output[key];
		tempOutput[key] = result;
		const alias = s.parameterConfig[key].alias;
		if (!alias) continue;
		for (const a of alias) {
			tempOutput[a] = result;
		}
	}

	Object.assign(output, tempOutput);
}

function inflate(s) {
	const flatObj = s.output;
	const result = {};

	result._ = flatObj._;

	for (const key in flatObj) {
		if (key === '_') continue;
		const keys = key.split('.');
		let currentLevel = result;

		keys.forEach((k, i) => {
			if (!currentLevel[k]) {
				currentLevel[k] = {};
			}

			if (i === keys.length - 1) {
				currentLevel[k] = flatObj[key];
			} else {
				currentLevel = currentLevel[k];
			}
		});
	}

	return result;
}

export default function argEngine(args, argProcessObj) {
	const configObj = argProcessObj || {
		output: {_: []},
		validate: [],
		transform: [],
		mandatory: [],
		conflict: [],
		complexDefault: {},
		parameterConfig: {},
		engineSettings: {
			error: msg => {
				throw new Error(msg);
			},
			panic: msg => {
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

	const settings = configObj.engineSettings;

	// All the properties are here from the start, thus the object keeps one shape
	const s = {
		args: args.slice().reverse(),
		output: configObj.output,
		_: configObj.output._,
		validate: configObj.validate,
		transform: configObj.transform,
		mandatory: configObj.mandatory,
		conflict: configObj.conflict,
		complexDefault: configObj.complexDefault,
		parameterConfig: configObj.parameterConfig,
		error: settings.error,
		panic: settings.panic,
		allowUnknown: settings.allowUnknown,
		autoCamelKebabCase: settings.autoCamelKebabCase,
		allowNegatingFlags: settings.allowNegatingFlags,
		allowKeyNumValues: settings.allowKeyNumValues,
		allowBoolString: settings.allowBoolString,
		greedy: settings.greedy,
		inputLog: [],
		arg: '',
		STOP: undefined,
		LONG: undefined,
		NO: undefined,
		KEY: undefined,
		KEYNUM: undefined,
		ASSIGN: undefined,
		VAL: undefined,
		theKey: undefined,
		theType: undefined,
		exit: undefined,
	};

	while (s.args.length) {
		const arg = '' + s.args.pop();

		if (arg.charCodeAt(0) !== 45) {
			s._.push(arg);
			continue;
		}

		s.arg = arg;

		const step =
			decode(s) ||
			stop(s) ||
			negate(s) ||
			keynum(s) ||
			group(s) ||
			positional(s) ||
			unknown(s) ||
			value(s) ||
			bool(s) ||
			negated(s) ||
			count(s) ||
			convert(s);

		if (STOP === step) break;
		if (EXIT === step) return s.exit;
	}

	if (defaults(s) || validate(s) || transform(s) || mandatory(s) || conflict(s)) {
		return s.exit;
	}

	if (settings.outputAlias) alias(s);

	if (settings.outputInflate) return inflate(s);

	return s.output;
}
