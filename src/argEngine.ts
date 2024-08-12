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

	args.reverse(); // Reverse, pop, push, reverse 8.77 times faster than unshft, shift

	while (args.length) {
		let arg: string = '' + args.pop();

		if (arg.charCodeAt(0) !== 45) {
			output['_'].push(arg);
			continue;
		}

		const token = arg.match(re.paramTokens);

		if (undefined === token) return conf.panic('Grup not returned');

		let {STOP, LONG, NO, KEY, KEYNUM, ASSIGN, VAL} = token?.groups || {
			STOP: '',
			LONG: '',
			NO: '',
			KEY: '',
			KEYNUM: '',
			ASSIGN: '',
			VAL: '',
		};

		if (STOP) {
			output['_'] = output['_'].concat(args.reverse());
			break;
		}

		if (NO && !conf.allowNegatingFlags) {
			KEY = (NO?.length ? NO : '') + KEY;
			NO = '';
		}

		if (KEYNUM) {
			if (!conf.allowKeyNumValues || LONG || ASSIGN) {
				KEY = KEY + (KEYNUM ? KEYNUM : '');
				KEYNUM = '';
			} else {
				if (!LONG && 1 < KEY.length) {
					return conf.error(
						`Unsupported format: '${arg}'. Did you miss a dash at the beginning?`
					);
				}
				VAL = ASSIGN = KEYNUM;
			}
		}

		if (!LONG && 1 < KEY.length) {
			const multi = KEY.split('').map(v => (NO ? '-no-' : '-') + v);
			multi[multi.length - 1] = multi[multi.length - 1] + (ASSIGN ? ASSIGN : '');
			args = args.concat(multi.reverse());
			continue;
		}

		if (!KEY) {
			output['_'].push(arg);
			continue;
		}

		// Key is not a defined parameter
		if (!params[KEY]) {
			if (!conf.allowUnknown) return conf.error(`Unknown parameter '${KEY}' not allowed.`);

			if (conf.autoCamelKebabCase && re.isKebab.test(KEY)) {
				KEY = KEY.replace(re.kebab, function (match, letter) {
					return letter.toUpperCase();
				});
			}

			if (ASSIGN) {
				if (!VAL) {
					if (args.length === 0) return conf.error(`No data provided for '${KEY}'`);
					VAL = args.pop() || '';
				}
				// @ts-ignore
				output[KEY] = +VAL == VAL ? +VAL : VAL;
				inputLog.push(KEY);
			} else {
				output[KEY] = !NO;
				inputLog.push(KEY);
			}
			continue;
		}

		if ('boolean' === params[KEY].type) {
			if (ASSIGN)
				return conf.error(
					`The parameter '${KEY}' is a boolean (a flag) and can't be assigned a value like '${arg}'`
				);
			output[params[KEY].key] = !NO;
			inputLog.push(params[KEY].key);
			continue;
		}

		if (NO) {
			return conf.error(`Can't negate '${KEY}' as the type is set to '${params[KEY].type}'`);
		}

		if ('count' === params[KEY].type) {
			output[params[KEY].key]++;
			inputLog.push(params[KEY].key);
			continue;
		}

		if (0 === args.length) {
			return conf.error(`No data provided for '${KEY}'`);
		}

		VAL ||= args.pop() || '';

		let num = 0;

		switch (params[params[KEY].key].type) {
			case 'string':
				output[params[KEY].key] = VAL;
				continue;

			case 'array':
			case 'string[]':
				output[params[KEY].key].push(VAL);
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
				return conf.panic(`'${KEY}' configuration uses invalid type '${params[KEY].type}'`);
		}

		if (isNaN(num) || !isFinite(num))
			return conf.error(`The value of '${KEY}' is not a valid ${params[KEY].type}: '${VAL}'`);

		if (Array.isArray(output[params[KEY].key])) {
			output[params[KEY].key].push(num);
		} else {
			output[params[KEY].key] = num;
		}
	}

	for (let key in complexDefault) {
		if (!params.hasOwnProperty(key)) continue;

		if (undefined === output[key] || !output[key].length) {
			output[key] = complexDefault[key];
		}
	}

	for (let key of validate) {
		let help = '';
		if ('function' === typeof params[key].valid) {
			if (params[key].valid(output[key])) continue;
		} else {
			if (!Array.isArray(params[key].valid))
				return conf.panic(
					`The "valid" property of '${key}' parameter must be a function or an array of valid values`
				);
			if (params[key].valid.includes(output[key])) continue;
			help = '. Please use one of the following values: ' + JSON.stringify(params[key].valid);
		}

		return conf.error(
			`The value provided for the parameter '${key}' is not valid: '${output[key]}'` + help
		);
	}

	for (let key of mandatory) {
		if (undefined === output[key])
			return conf.error(
				`The parameter '${key}' is mandatory.` +
					(params[key].alias.length
						? ` You can also use an alias: ${params[key].alias.join(', ')}`
						: '')
			);
	}

	for (let key of conflict) {
		if (!inputLog.includes(key)) continue;

		const conflicting = params[key]?.conflict.find(value => inputLog.includes(value));
		if (conflicting) {
			return conf.error(`The parameter '${key}' conflicts with '${conflicting}'`);
		}
	}
	return output;
}
