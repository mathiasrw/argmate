// Variant `this`: each functionality of the full engine is a function of its own.
// The functions share the state of the parse through `this`, thus they take no arguments.
// @ts-nocheck
import {re} from '../../src/common.js';

const hasProp = Object.prototype.hasOwnProperty;

// What a step tells the loop. 0: go to the next step
const NEXT = 1; // read the next argument
const STOP = 2; // leave the loop
const EXIT = 3; // return `this.exit` from the engine

function decode(this: any) {
	const token = this.arg.match(re.paramTokens);
	if (!token) {
		this.exit = this.panic('Group not returned');
		return EXIT;
	}
	const groups = token.groups;
	this.STOP = groups.STOP;
	this.LONG = groups.LONG;
	this.NO = groups.NO;
	this.KEY = groups.KEY;
	this.KEYNUM = groups.KEYNUM;
	this.ASSIGN = groups.ASSIGN;
	this.VAL = groups.VAL;
	return 0;
}

function stop(this: any) {
	if (!this.STOP) return 0;
	if (this.greedy) {
		this.output._.push(this.args.reverse().join(' '));
	} else {
		this.output._ = this.output._.concat(this.args.reverse());
	}
	return STOP;
}

function negate(this: any) {
	if (this.NO && !this.allowNegatingFlags) {
		this.KEY = (this.NO || '') + this.KEY;
		this.NO = '';
	}
	return 0;
}

function keynum(this: any) {
	if (this.KEYNUM) {
		if (!this.allowKeyNumValues || this.LONG || this.ASSIGN) {
			this.KEY += this.KEYNUM;
			this.KEYNUM = '';
		} else {
			if (!this.LONG && 1 < this.KEY.length) {
				this.exit = this.error(
					`Unsupported format: '${this.arg}'. Did you miss a dash at the beginning?`
				);
				return EXIT;
			}
			this.VAL = this.ASSIGN = this.KEYNUM;
		}
	}
	return 0;
}

function group(this: any) {
	if (!this.LONG && 1 < [...this.KEY].length) {
		const multi = this.KEY.split('').map(v => (this.NO ? '-no-' : '-') + v);
		multi[multi.length - 1] += this.ASSIGN || '';
		this.args = this.args.concat(multi.reverse());
		return NEXT;
	}
	return 0;
}

function positional(this: any) {
	if (!this.KEY) {
		this._.push(this.arg);
		return NEXT;
	}
	return 0;
}

function unknown(this: any) {
	if (this.parameterConfig[this.KEY]) return 0;

	if (!this.allowUnknown) {
		this.exit = this.error(`Unknown parameter '${this.KEY}' not allowed`);
		return EXIT;
	}

	if (this.autoCamelKebabCase && re.isKebab.test(this.KEY)) {
		this.KEY = this.KEY.replace(re.kebab2camel, (_, letter) => letter.toUpperCase());
	}

	if (this.ASSIGN) {
		if (!this.VAL) {
			if (this.args.length === 0) {
				this.exit = this.error(`No data provided for '${this.KEY}'`);
				return EXIT;
			}
			this.VAL = this.args.pop() || '';
		}
		const VAL = this.VAL;
		if (+VAL + '' === VAL) this.output[this.KEY] = +VAL;
		else if (this.allowBoolString && re.boolStringTrue.test(VAL)) this.output[this.KEY] = true;
		else if (this.allowBoolString && re.boolStringFalse.test(VAL)) this.output[this.KEY] = false;
		else this.output[this.KEY] = VAL;
	} else {
		this.output[this.KEY] = !this.NO;
	}
	this.inputLog.push(this.KEY);
	return NEXT;
}

function value(this: any) {
	this.theKey = this.parameterConfig[this.KEY].key;
	this.theType = this.parameterConfig[this.theKey || this.KEY].type;

	if (
		!this.VAL &&
		!(('count' === this.theType && !this.ASSIGN) || ('boolean' === this.theType && !this.ASSIGN))
	) {
		if (0 === this.args.length) {
			this.exit = this.error(`No data provided for '${this.KEY}'`);
			return EXIT;
		}

		this.VAL ||= this.args.pop() || '';
	}
	return 0;
}

function bool(this: any) {
	if ('boolean' !== this.theType) return 0;

	let result = !this.NO;
	if (this.ASSIGN) {
		if (this.NO) {
			this.exit = this.error(
				`The parameter '${this.KEY}' can't be negated AND assigned at the same time`
			);
			return EXIT;
		}

		if (this.allowBoolString && re.boolStringTrue.test(this.VAL)) {
			result = true;
		} else if (this.allowBoolString && re.boolStringFalse.test(this.VAL)) {
			result = false;
		} else {
			const VAL = this.VAL;
			this.exit = this.error(
				`The parameter '${this.KEY}' is a boolean (a flag) so can't assign a value like '${VAL === VAL.slice(0, 16) ? VAL : VAL.slice(0, 16)}'`
			);
			return EXIT;
		}
	}
	this.output[this.theKey] = result;
	this.inputLog.push(this.theKey);
	return NEXT;
}

function negated(this: any) {
	if (this.NO) {
		this.exit = this.error(`Can't negate '${this.KEY}' as the type is set to '${this.theType}'`);
		return EXIT;
	}
	return 0;
}

function count(this: any) {
	if ('count' !== this.theType) return 0;

	let inc = 1;
	if (this.ASSIGN) {
		inc = +this.VAL | 0;
		if (inc + '' !== this.VAL) {
			this.exit = this.error(`The value of '${this.KEY}' is not a valid int: '${this.VAL}'`);
			return EXIT;
		}
	}
	this.output[this.theKey] += inc;
	this.inputLog.push(this.theKey);
	return NEXT;
}

function convert(this: any) {
	const VAL = this.VAL;
	let data = 0;

	switch (this.theType) {
		case 'string':
			this.output[this.theKey] = VAL;
			return NEXT;

		case 'array':
		case 'string[]':
			this.output[this.theKey].push(VAL);
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
			this.exit = this.panic(
				`Parameter '${this.KEY}' configuration has an invalid type: '${this.theType}'`
			);
			return EXIT;
	}

	if (Number.isNaN(data) || !Number.isFinite(data)) {
		this.exit = this.error(`The value of '${this.KEY}' is not a valid ${this.theType}: '${VAL}'`);
		return EXIT;
	}

	if (Array.isArray(this.output[this.theKey])) {
		this.output[this.theKey].push(data);
	} else {
		this.output[this.theKey] = data;
	}
	return NEXT;
}

function defaults(this: any) {
	for (const [key, value] of Object.entries(this.complexDefault)) {
		if (!hasProp.call(this.parameterConfig, key)) continue;
		if (undefined === this.output[key] || !this.output[key].length) {
			this.output[key] = value;
		}
	}
	return 0;
}

function validate(this: any) {
	const output = this.output;
	for (const key of this.validate) {
		if (undefined === output[key]) continue;

		const param = this.parameterConfig[key];
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

		this.exit = this.error(
			`The value provided for the parameter '${key}' is not valid: '${output[key]}'` + help
		);
		return EXIT;
	}
	return 0;
}

function transform(this: any) {
	const output = this.output;
	for (const key of this.transform) {
		if (undefined === output[key]) continue;
		const fn = this.parameterConfig[key].transform;
		if ('function' !== typeof fn) {
			this.exit = this.panic(`The "transform" property of '${key}' parameter must be a function`);
			return EXIT;
		}
		try {
			output[key] = fn(output[key]);
		} catch (e) {
			this.exit = this.error(
				`The transform for '${key}' threw: ${e instanceof Error ? e.message : String(e)}`
			);
			return EXIT;
		}
	}
	return 0;
}

function mandatory(this: any) {
	for (const key of this.mandatory) {
		if (undefined === this.output[key]) {
			this.exit = this.error(
				`The parameter '${key}' is mandatory.${this.parameterConfig[key]?.alias?.length ? ` You can also use an alias: ${this.parameterConfig[key].alias.join(', ')}` : ''}`
			);
			return EXIT;
		}
	}
	return 0;
}

function conflict(this: any) {
	for (const conflictingKey of this.conflict) {
		if (!this.inputLog.includes(conflictingKey)) continue;
		const conflicting = this.parameterConfig[conflictingKey]?.conflict?.find(value =>
			this.inputLog.includes(value)
		);
		if (conflicting) {
			this.exit = this.error(`The parameter '${conflictingKey}' conflicts with '${conflicting}'`);
			return EXIT;
		}
	}
	return 0;
}

function alias(this: any) {
	const output = this.output;
	const tempOutput = {};
	for (const key in output) {
		if ('_' === key || !hasProp.call(output, key)) continue;
		const result = output[key];
		tempOutput[key] = result;
		const alias = this.parameterConfig[key].alias;
		if (!alias) continue;
		for (const a of alias) {
			tempOutput[a] = result;
		}
	}

	Object.assign(output, tempOutput);
}

function inflate(this: any) {
	const flatObj = this.output;
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
			decode.call(s) ||
			stop.call(s) ||
			negate.call(s) ||
			keynum.call(s) ||
			group.call(s) ||
			positional.call(s) ||
			unknown.call(s) ||
			value.call(s) ||
			bool.call(s) ||
			negated.call(s) ||
			count.call(s) ||
			convert.call(s);

		if (STOP === step) break;
		if (EXIT === step) return s.exit;
	}

	if (
		defaults.call(s) ||
		validate.call(s) ||
		transform.call(s) ||
		mandatory.call(s) ||
		conflict.call(s)
	) {
		return s.exit;
	}

	if (settings.outputAlias) alias.call(s);

	if (settings.outputInflate) return inflate.call(s);

	return s.output;
}
