// @ts-ignore
import {ArgMateParams, ArgMateConfig, ArgProcessObj} from './types.js';
interface ArgMateConfigMandatory extends ArgMateConfig {
	error: (msg: string) => void;
	panic: (msg: string) => void;
}

export const re = {
	kebab: /([a-z0-9]|(?=[A-Z]))([A-Z])/g,
	camel: /-+([^-])|-+$/g,
};

/*
/^(?<stop>--)$|^-(?<full>-)?(?<no>no-)?(?<key>[^=\s]+?)(?<keynum>[\d]*)(?<assign>=(?<val>.*))?$/,
--
--full
 --full=-fullval
 --no-full5=ful--lval-5
--full=
-s
# -s1234
 --s1234=3423
 -s=-sh--ortval
-s=
-abc=
-multi
# -no-noabc
# -no-n
# -no-bca=66
# --no-n-o--abc

array of value as default
# conflicting values
*/

export default function argEngineLite(args: string[], argProcessObj?: ArgProcessObj) {
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

	const {mandatory, validate, output, conf, params, complexDefault} = argProcessObj;

	args.reverse(); // Reverse, pop, push, reverse 8.77 times faster than unshft, shift

	while (args.length) {
		let arg: string = '' + args.pop();

		if (arg.charCodeAt(0) !== 45) {
			output['_'].push(arg);
			continue;
		}

		let LONG = false;
		let KEY = '';
		let VAL = '';
		let ASSIGN = false;
		if (arg.charCodeAt(1) === 45) {
			LONG = true;
			KEY = arg.slice(2);
		} else {
			KEY = arg.slice(1);
		}

		// STOP
		if (LONG && !KEY) {
			output['_'] = output['_'].concat(args.reverse());
			break;
		}

		if (!KEY) {
			output['_'].push(arg);
			continue;
		}

		if (conf.allowAssign) {
			let i = KEY.indexOf('=');
			if (-1 < i) {
				ASSIGN = true;
				VAL = KEY.slice(i + 1);
				KEY = KEY.slice(0, i);
			}
		}

		if (!LONG && 1 !== KEY.length) {
			if (ASSIGN) return conf.error(`Unsupported format: '${arg}'`);
			const multi = KEY.split('').map(v => '-' + v);
			args = args.concat(multi.reverse());
			continue;
		}

		if (!params[KEY]) {
			if (!conf.allowUnknown) return conf.error(`Unknown parameter '${KEY}' not allowed`);

			if (conf.autoCamelKebabCase) {
				KEY = KEY.replace(re.camel, function (match, letter) {
					return letter.toUpperCase();
				});
			}

			if (ASSIGN) {
				if (!VAL) {
					if (0 === args.length) return conf.error(`No data provided for '${KEY}'`);
					VAL = args.pop() || '';
				}
				// @ts-ignore
				output[KEY] = +VAL == VAL ? +VAL : VAL;
			} else {
				output[KEY] = true;
			}
			continue;
		}

		if ('boolean' === params[KEY].type) {
			if (ASSIGN) return conf.error(`'${KEY}' is boolean, so can't assign: '${arg}'`);
			output[params[KEY].key] = true;
			continue;
		}

		if ('count' === params[KEY].type) {
			if (ASSIGN) return conf.error(`'${KEY}' counting, so can't assign: '${arg}'`);
			output[KEY]++;
			continue;
		}

		if (!VAL) {
			if (0 === args.length) return conf.error(`No data for '${KEY}'`);
			VAL = args.pop() || '';
		}

		let num = 0;

		switch (params[KEY].type) {
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
				return conf.panic(`'${KEY}' got invalid type: '${params[KEY].type}'`);
		}

		if (isNaN(num) || !isFinite(num)) {
			return conf.error(`'${KEY}' value is not a valid ${params[KEY].type}: '${VAL}'`);
		}

		if (Array.isArray(output[params[KEY].key])) {
			output[params[KEY].key].push(num);
		} else {
			output[params[KEY].key] = num;
		}
	}

	for (let key of validate) {
		let help = '';
		if ('function' === typeof params[key].valid) {
			if (params[key].valid(output[key])) continue;
		} else {
			if (!Array.isArray(params[key].valid)) {
				return conf.panic(`"valid" property of '${key}' must be function or array`);
			}

			if (params[key].valid.includes(output[key])) {
				continue;
			}

			help = '. Valid values: ' + JSON.stringify(params[key].valid);
		}

		return conf.error(`Invalid value for '${key}': '${output[key]}'` + help);
	}

	for (let key of mandatory) {
		if (undefined === output[key]) {
			return conf.error(
				`'${key.length > 1 ? '--' : '-'}${key}' is mandatory` +
					(params[key].alias.length
						? `.  Or use an alias: ${params[key].alias
								.map(v => (v.length > 1 ? '--' : '-') + v)
								.join(', ')}`
						: '')
			);
		}
	}

	for (let key in complexDefault) {
		if (!params.hasOwnProperty(key)) continue;

		if (undefined === output[key] || !output[key].length) {
			output[key] = complexDefault[key];
		}
	}

	// todo: check for conflict

	return output;
}
