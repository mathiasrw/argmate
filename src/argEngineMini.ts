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
		transform: [],
		mandatory: [],
		conflict: [],
		complexDefault: {},
		engineSettings: {
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
		parameterConfig: {},
	};

	const {mandatory, validate, transform, complexDefault, output, engineSettings, parameterConfig} =
		argProcessObj;
	const _ = output._ as (string | number)[];

	args = args.slice().reverse(); // Reverse, pop, push, reverse 8.77 times faster than unshft, shift. A copy: the array of the caller does not change

	while (args.length) {
		const arg: string = '' + args.pop();

		if (arg.charCodeAt(0) !== 45) {
			_.push(arg);
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
			if (engineSettings.greedy) {
				output._.push(args.reverse().join(' '));
			} else {
				output._ = output._.concat(args.reverse());
			}
			break;
		}

		if (engineSettings.allowAssign) {
			const i = KEY.indexOf('=');
			if (-1 < i) {
				ASSIGN = true;
				VAL = KEY.slice(i + 1);
				KEY = KEY.slice(0, i);
			}
		}

		if (!KEY) {
			_.push(arg);
			continue;
		}

		if (!LONG && 1 !== KEY.length) {
			if (re.hasSpace.test(KEY)) {
				_.push(arg);
				continue;
			}
			if (ASSIGN) return engineSettings.error(`Unsupported format: '${arg}'`);
			const multi = KEY.split('').map(v => '-' + v);
			args = args.concat(multi.reverse());
			continue;
		}

		if (!parameterConfig[KEY]) {
			if (re.hasSpace.test(KEY)) {
				_.push(arg);
				continue;
			}
			if (!engineSettings.allowUnknown)
				return engineSettings.error(`Unknown parameter '${KEY}' not allowed`);

			if (engineSettings.autoCamelKebabCase) {
				KEY = KEY.replace(re.kebab2camel, (_match, letter) => letter.toUpperCase());
			}

			if (ASSIGN) {
				output[KEY] = +VAL + '' === VAL ? +VAL : VAL;
			} else {
				output[KEY] = true;
			}
			continue;
		}

		const param = parameterConfig[parameterConfig[KEY].key || KEY];
		const type = param.type;

		if ('boolean' === type) {
			if (ASSIGN)
				return engineSettings.error(`'${KEY}' is boolean, so can't assign: '${VAL.slice(0, 16)}'`);
			output[param.key] = true;
			continue;
		}

		if ('count' === param.type) {
			let inc = 1;
			if (ASSIGN) {
				inc = +VAL | 0;
				if (inc + '' !== VAL) {
					return engineSettings.error(`'${KEY}' value is not a valid int: '${VAL}'`);
				}
			}
			(output[param.key] as number) += inc;
			continue;
		}

		if (!ASSIGN) {
			if (0 === args.length) return engineSettings.error(`No data provided for '${KEY}'`);
			VAL = args.pop() || '';
		}

		let num = 0;

		switch (param.type) {
			case 'string':
				output[param.key] = VAL;
				continue;

			case 'array':
			case 'string[]':
				(output[param.key] as any[]).push(VAL);
				continue;

			case 'number':
			case 'float':
			case 'number[]':
			case 'float[]':
				num = VAL.trim() ? +VAL : Number.NaN;
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
				return engineSettings.panic(
					`'${KEY}' got invalid type: '${parameterConfig[parameterConfig[KEY].key].type}'`
				);
		}

		if (Number.isNaN(num) || !Number.isFinite(num)) {
			return engineSettings.error(
				`'${KEY}' value is not a valid ${parameterConfig[param.key].type}: '${VAL}'`
			);
		}

		if (Array.isArray(output[param.key])) {
			(output[param.key] as any[]).push(num);
		} else {
			output[param.key] = num;
		}
	}

	for (const key of validate) {
		if (undefined === output[key]) continue;

		const el = parameterConfig[parameterConfig[key].key || key];
		let help = '';

		if ('function' === typeof el.validate) {
			if (el.validate(output[key])) continue;
		} else if (el.validate instanceof RegExp) {
			if (
				(Array.isArray(output[key]) ? output[key] : [output[key]]).every(
					v => -1 < String(v).search(el.validate as RegExp)
				)
			) {
				continue;
			}
			help = '. Must match ' + el.validate;
		} else {
			if ((el.validate as any[]).includes(output[key])) {
				continue;
			}

			help = '. Valid values: ' + JSON.stringify(el.validate);
		}

		return engineSettings.error(`Invalid value for '${key}': '${output[key]}'` + help);
	}

	for (const key of transform) {
		if (undefined === output[key]) continue;
		const fn: unknown = parameterConfig[key].transform;
		if ('function' !== typeof fn) {
			return engineSettings.panic(`'${key}' transform must be a function`);
		}
		try {
			output[key] = fn(output[key]);
		} catch (e) {
			return engineSettings.error(
				`'${key}' transform threw: ${e instanceof Error ? e.message : String(e)}`
			);
		}
	}

	for (const key of mandatory) {
		if (undefined === output[key]) {
			return engineSettings.error(
				`'${key.length > 1 ? '--' : '-'}${key}' is mandatory` +
					(parameterConfig[parameterConfig[key].key || key]?.alias?.length
						? `.  Or use an alias: ${parameterConfig[parameterConfig[key].key || key]?.alias
								?.map((v: string) => (v.length > 1 ? '--' : '-') + v)
								.join(', ')}`
						: '')
			);
		}
	}

	for (let key in complexDefault) {
		key = parameterConfig[key].key || key;
		if (!Object.hasOwn(parameterConfig, key)) continue;

		if (undefined === output[key] || !(output[key] as any[]).length) {
			output[key] = complexDefault[key];
		}
	}

	return output as ArgMateResponse<ArgMateConfig>;
}
