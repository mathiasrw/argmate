// @ts-ignore
import {ArgMateParams, ArgMateConfig} from './types.d.ts';
interface ArgMateConfigMandatory extends ArgMateConfig {
	error: (msg: string) => void;
	panic: (msg: string) => void;
}

const re = {
	kebab: /([a-z0-9]|(?=[A-Z]))([A-Z])/g,
	camel: /-+([^-])|-+$/g,
	arrayType: /array|string\[\]|number\[\]|int\[\]|float\[\]|hex\[\]/,
	paramTokens:
		/^(?<STOP>--)$|^-(?<LONG>-+)?(?<NO>no-)?(?<KEY>[^=\s]+?)(?<KEYNUM>[\d]*)(?<ASSIGN>=(?<VAL>.*))?$/,
};

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
*/

const defaultConf = {
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
};

const strictConf = {
	allowUnknown: false,
	autoCamelKebabCase: false,
	allowNegatingFlags: false,
	allowKeyNumValues: false,
};

export function engine(args: string[], params: ArgMateParams, conf_: ArgMateConfig) {
	const mandatory: string[] = [];
	const validate: string[] = [];
	let result: any = {
		_: [],
	};
	let arrayTypeDefaults: any = {};

	let arrayTypeKeys: any = [];

	const conf: ArgMateConfigMandatory = {
		...defaultConf,
		...(conf_.strict ? strictConf : {}),
		...conf_,
	};

	for (let key in params) {
		if (!params.hasOwnProperty(key)) continue;
		let param = params[key];
		// If only default value is provided, then transform to object with correct type

		if (param === null || typeof param !== 'object' || Array.isArray(param)) {
			param = {
				default: param,
				type: findType(param),
			};
		}

		param.key = key;
		param.alias = param.alias || [];
		param.conflict = param.conflict || [];

		if (undefined !== param.valid) {
			validate.push(key);
			if (undefined === param.default && Array.isArray(param.valid)) {
				if (!param.valid.length)
					return conf.panic(`Empty array found for valid values of '${key}'`);

				if (undefined === param.type) {
					param.type = findType(param.valid[0]);
				}
				param.default = param.valid[0];
			}
		}

		param.type = param.type?.toLowerCase() || findType(param.default) || 'boolean';

		if (undefined !== param.default) {
			if (Array.isArray(param.default)) {
				arrayTypeDefaults[key] = param.default;
			} else if ('count' == param.type) {
				return conf.error(
					`Default parameters like '${param.default}' are not allowed on parameters like '${key}' with the type '${param.type}'`
				);
			} else {
				result[key] = param.default;
			}
		}

		if ('count' == param.type) {
			result[key] = 0;
		}

		if (param.type.match(re.arrayType)) {
			result[key] = [];
			arrayTypeKeys.push(key);
		}

		if (param.mandatory) {
			mandatory.push(key);
		}

		if (conf.autoCamelKebabCase) {
			let kebab = key.replace(re.kebab, '$1-$2').toLowerCase();
			if (kebab !== key) {
				param.alias = [kebab].concat(param.alias || []);
			}
		}

		if (undefined !== param.alias && !Array.isArray(param.alias)) param.alias = [param.alias];

		if (param.alias) param.alias.forEach(alias => (params[alias] = param));
	}

	args.reverse(); // Reverse, pop, push, reverse 8.77 times faster than unshft, shift

	while (args.length) {
		let arg: string = '' + args.pop();

		if (!arg.startsWith('-')) {
			result['_'].push(arg);
			continue;
		}

		const token = arg.match(re.paramTokens);

		if (undefined === token) return conf.panic('Grups not returned');

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
			result['_'] = result['_'].concat(args.reverse());
			break;
		}

		if (NO && !conf.allowUnknown) {
			KEY = (NO ? NO : '') + KEY;
			NO = '';
		}

		if (KEYNUM) {
			if (!conf.allowKeyNumValues || LONG || ASSIGN) {
				KEY = KEY + (KEYNUM ? KEYNUM : '');
				KEYNUM = '';
			} else {
				if (!LONG && 1 < KEY.length) {
					return conf.error(
						`Unsupported format: '${arg}'. Did you miss a dash before that?`
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

		if (!KEY) return conf.panic(`Key is never meant to be undefined`);

		// Key not defined as a parameter
		if (!params[KEY]) {
			if (!conf.allowUnknown)
				return conf.error(`Unspecified parameters like '${KEY}' not allowed.`);

			if (conf.autoCamelKebabCase) {
				KEY = KEY.replace(re.camel, function (match, letter) {
					return letter.toUpperCase();
				});
			}

			if (ASSIGN) {
				if (!VAL) {
					if (args.length === 0)
						return conf.error(
							`Expected one more parameter to fill the value of '${KEY}'`
						);
					VAL = args.pop() || '';
				}
				// @ts-ignore
				result[KEY] = +VAL == VAL ? +VAL : VAL;
			} else {
				result[KEY] = !NO;
			}
			continue;
		}

		if ('boolean' === params[KEY].type) {
			if (ASSIGN)
				return conf.error(
					`You asked for the parameter '${KEY}' to be boolean but you are trying to assign a value: '${arg}'`
				);
			result[params[KEY].key] = !NO;
			continue;
		}

		if (NO) {
			return conf.error(`Can't negate '${KEY}' as the type is set to '${params[KEY].type}'`);
		}

		if ('count' === params[KEY].type) {
			result[KEY]++;
			continue;
		}

		if (0 === args.length)
			return conf.error(`Expected one more parameter to fill the value of '${KEY}'`);

		VAL ||= args.pop() || '';

		let num = 0;

		switch (params[KEY].type) {
			case 'string':
				result[params[KEY].key] = VAL;
				continue;

			case 'array':
			case 'string[]':
				result[params[KEY].key].push(VAL);
				continue;

			case 'number':
			case 'float':
			case 'number[]':
			case 'float[]':
				num = +VAL;
				break;

			case 'int':
			case 'int[]':
				debugger;
				num = +VAL | 0;
				if ('' + num !== VAL) num = NaN;

				break;

			case 'hex':
			case 'hex[]':
				num = parseInt(VAL, 16);
				break;
			default:
				return conf.panic(
					`The parameter '${KEY}' is configured with an invalid type: '${params[KEY].type}'`
				);
		}

		if (isNaN(num) || !isFinite(num))
			return conf.error(`The value of '${KEY}' is not a valid ${params[KEY].type}: '${VAL}'`);
		if (params[KEY].type.match(re.arrayType)) {
			result[params[KEY].key].push(num);
		} else {
			result[params[KEY].key] = num;
		}
	}

	for (let key in arrayTypeDefaults) {
		if (!params.hasOwnProperty(key)) continue;

		if (undefined === result[key] || !result[key].length) {
			result[key] = arrayTypeDefaults[key];
		}
	}

	for (let key of validate) {
		let help = '';
		if ('function' === typeof params[key].valid) {
			if (params[key].valid(result[key])) continue;
		} else {
			if (!Array.isArray(params[key].valid))
				return conf.panic(
					`The "valid" property of the '${key}' parameter must be a function or an array of valid values`
				);
			if (params[key].valid.includes(result[key])) continue;
			help = '. Please use one of the following values: ' + JSON.stringify(params[key].valid);
		}

		return conf.error(
			`The value provided for parameter '${key}' is not valid: '${result[key]}'` + help
		);
	}

	mandatory.forEach(key => {
		if (undefined === result[key])
			return conf.error(
				`The parameter '${key}' is mandatory.` +
					(params[key].alias.length
						? ` You can also provide an alias: ${params[key].alias.join(', ')}`
						: '')
			);
	});

	// todo: check for conflict

	return result;
}

function findType(val) {
	if (null === val || undefined === val) return void 0;

	let type = typeof val;
	let isArray = Array.isArray(val);

	if (isArray && val.length > 0) {
		type = typeof val[0];
	}

	switch (type) {
		case 'boolean':
		case 'number':
			return type + (isArray ? '[]' : '');
		default:
			return 'string' + (isArray ? '[]' : '');
	}
}
