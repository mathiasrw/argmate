import {
	ArgMateConfig,
	type ArgMateEngineConfig,
	type ArgMateSettings,
	type ArgMateResponse,
} from './types.js';
interface EngineSettings extends ArgMateSettings {
	error: (msg: string) => never;
	panic: (msg: string) => never;
}

import {re} from './common.js';

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

export default function argEngineMini(
	args: string[],
	argProcessObj?: ArgMateEngineConfig
): ArgMateResponse<ArgMateConfig> {
	argProcessObj = argProcessObj || {
		output: {
			_: [],
		},
		validate: [],
		mandatory: [],
		conflict: [],
		complexDefault: {},
		settings: {
			error: (msg: string) => {
				throw msg;
			},
			panic: (msg: string) => {
				throw msg;
			},
			allowUnknown: true,
			autoCamelKebabCase: true,
			allowNegatingFlags: true,
			allowKeyNumValues: true,
			allowAssign: true,
		},
		config: {},
	};

	const {mandatory, validate, complexDefault, output, settings, config, conflict} = argProcessObj;

	const addArgument = output['_'].push.bind(output['_']);

	args.reverse(); // Reverse, pop, push, reverse 8.77 times faster than unshft, shift

	while (args.length) {
		const arg: string = '' + args.pop();

		if (arg.charCodeAt(0) !== 45) {
			addArgument(arg);
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

		if (settings.allowAssign) {
			const i = KEY.indexOf('=');
			if (-1 < i) {
				ASSIGN = true;
				VAL = KEY.slice(i + 1);
				KEY = KEY.slice(0, i);
			}
		}

		if (!LONG && 1 !== KEY.length) {
			if (ASSIGN) return settings.error(`Unsupported format: '${arg}'`);
			const multi = KEY.split('').map(v => '-' + v);
			args = args.concat(multi.reverse());
			continue;
		}

		if (!config[KEY]) {
			if (!settings.allowUnknown) return settings.error(`Unknown parameter '${KEY}' not allowed`);

			if (settings.autoCamelKebabCase) {
				KEY = KEY.replace(re.kebab2camel, (match, letter) => letter.toUpperCase());
			}

			if (ASSIGN) {
				if (!VAL) {
					if (0 === args.length) return settings.error(`No data provided for '${KEY}'`);
					VAL = args.pop() || '';
				}
				// @ts-ignore
				output[KEY] = +VAL + '' === VAL ? +VAL : VAL;
			} else {
				output[KEY] = true;
			}
			continue;
		}

		if ('boolean' === config[config[KEY].key].type) {
			if (ASSIGN) return settings.error(`'${KEY}' is boolean, so can't assign: '${arg}'`);
			output[config[KEY].key] = true;
			continue;
		}

		if ('count' === config[config[KEY].key].type) {
			if (ASSIGN) return settings.error(`'${KEY}' counting, so can't assign: '${arg}'`);
			(output[KEY] as number)++;
			continue;
		}

		if (!VAL) {
			if (0 === args.length) return settings.error(`No data provided for '${KEY}'`);
			VAL = args.pop() || '';
		}

		let num = 0;

		switch (config[config[KEY].key].type) {
			case 'string':
				output[config[KEY].key] = VAL;
				continue;

			case 'array':
			case 'string[]':
				(output[config[KEY].key] as any[]).push(VAL);
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
				if (num + '' !== VAL) num = Number.NaN;
				break;

			case 'hex':
			case 'hex[]':
				if (re.isHex.test(VAL)) {
					num = Number.parseInt(VAL, 16);
				} else {
					num = Number.NaN;
				}
				break;

			default:
				return settings.panic(`'${KEY}' got invalid type: '${config[config[KEY].key].type}'`);
		}

		if (isNaN(num) || !isFinite(num)) {
			return settings.error(
				`'${KEY}' value is not a valid ${config[config[KEY].key].type}: '${VAL}'`
			);
		}

		if (Array.isArray(output[config[KEY].key])) {
			(output[config[KEY].key] as any[]).push(num);
		} else {
			output[config[KEY].key] = num;
		}
	}

	for (const key of validate) {
		let help = '';
		if ('function' === typeof config[key].valid) {
			if (config[key].valid(output[key])) continue;
		} else {
			if (!Array.isArray(config[key].valid)) {
				return settings.panic(`"valid" property of '${key}' must be function or array`);
			}

			if (config[key].valid.includes(output[key])) {
				continue;
			}

			help = '. Valid values: ' + JSON.stringify(config[key].valid);
		}

		return settings.error(`Invalid value for '${key}': '${output[key]}'` + help);
	}

	for (const key of mandatory) {
		if (undefined === output[key]) {
			return settings.error(
				`'${key.length > 1 ? '--' : '-'}${key}' is mandatory` +
					(config[key]?.alias?.length
						? `.  Or use an alias: ${config[key].alias
								.map((v: string) => (v.length > 1 ? '--' : '-') + v)
								.join(', ')}`
						: '')
			);
		}
	}

	for (const key in complexDefault) {
		if (!config.hasOwnProperty(key)) continue;

		if (undefined === output[key] || !(output[key] as any[]).length) {
			output[key] = complexDefault[key];
		}
	}

	// todo: check for conflict ?

	return output as ArgMateResponse<ArgMateConfig>;
}
