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

// An error object (item 48): in a string, it is its message
const fail = (error: (e: ArgMateError) => never, e: ArgMateError) =>
	error(Object.setPrototypeOf(e, asText));

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
		exists: [],
		mandatory: [],
		conflict: [],
		demand: [],
		spots: [],
		slices: [],
		complexDefault: {},
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
		},
		parameterConfig: {},
	};

	const {
		mandatory,
		validate,
		transform,
		complexDefault,
		output: template,
		engineSettings,
		parameterConfig,
	} = argProcessObj;
	const output = {...template};
	for (const key in output) if (Array.isArray(output[key])) output[key] = output[key].slice();
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

		if (!KEY || re.hasSpace.test(KEY)) {
			_.push(arg);
			continue;
		}

		if (
			LONG
				? 45 === KEY.charCodeAt(0) || 45 === KEY.charCodeAt(KEY.length - 1) || KEY.includes('--')
				: KEY.includes('-')
		) {
			return fail(engineSettings.error, {code: 'UNKNOWN', message: `Invalid parameter '${arg}'`});
		}

		if (!LONG && 1 < KEY.length) {
			if (!ASSIGN && engineSettings.allowKeyNumValues) {
				let j = KEY.length;
				while (1 < j && (KEY.charCodeAt(j - 1) - 48) >>> 0 < 10) j--;
				if (j < KEY.length) {
					VAL = KEY.slice(j);
					KEY = KEY.slice(0, j);
					ASSIGN = true;
				}
			}
			const multi = re.hasNonAscii.test(KEY)
				? (KEY.match(re.graphemes) as string[])
				: KEY.split('');
			if (1 < multi.length) {
				multi[multi.length - 1] += ASSIGN ? '=' + VAL : '';
				for (let i = multi.length; i--; ) args.push('-' + multi[i]);
				continue;
			}
		}

		if (!parameterConfig[KEY]) {
			if (!engineSettings.allowUnknown)
				return fail(engineSettings.error, {
					code: 'UNKNOWN',
					key: KEY,
					message: `Unknown parameter '${KEY}' not allowed`,
				});

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

		const param = parameterConfig[parameterConfig[KEY].key];
		const type = param.type;

		if ('boolean' === type) {
			if (ASSIGN)
				return fail(engineSettings.error, {
					code: 'BAD_VALUE',
					key: param.key,
					message: `'${KEY}' is boolean, so can't assign: '${VAL.slice(0, 16)}'`,
				});
			output[param.key] = true;
			continue;
		}

		if ('count' === param.type) {
			let inc = 1;
			if (ASSIGN) {
				inc = +VAL | 0;
				if (inc + '' !== VAL) {
					return fail(engineSettings.error, {
						code: 'BAD_VALUE',
						key: param.key,
						message: `'${KEY}' value is not a valid int: '${VAL}'`,
					});
				}
			}
			(output[param.key] as number) += inc;
			continue;
		}

		if (!ASSIGN) {
			if (0 === args.length)
				return fail(engineSettings.error, {
					code: 'MISSING_VALUE',
					key: param.key,
					message: `No data provided for '${KEY}'`,
				});
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
			return fail(engineSettings.error, {
				code: 'BAD_VALUE',
				key: param.key,
				message: `'${KEY}' value is not a valid ${parameterConfig[param.key].type}: '${VAL}'`,
			});
		}

		if (Array.isArray(output[param.key])) {
			(output[param.key] as any[]).push(num);
		} else {
			output[param.key] = num;
		}
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
			return fail(engineSettings.error, {
				code: 'INVALID',
				key,
				message: `'${key}' transform threw: ${e instanceof Error ? e.message : String(e)}`,
			});
		}
	}

	for (const key of validate) {
		if (undefined === output[key]) continue;

		const el = parameterConfig[key];
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
			if ((el.valid as unknown[][]).some(item => item[0] === output[key])) {
				continue;
			}

			help = '. Valid values: ' + JSON.stringify((el.valid as unknown[][]).map(item => item[0]));
		}

		return fail(engineSettings.error, {
			code: 'INVALID',
			key,
			message: `Invalid value for '${key}': '${output[key]}'` + help,
		});
	}

	for (const key of mandatory) {
		if (undefined === output[key]) {
			return fail(engineSettings.error, {
				code: 'MANDATORY',
				key,
				message:
					`'${key.length > 1 ? '--' : '-'}${key}' is mandatory` +
					(parameterConfig[key].alias?.length
						? `.  Or use an alias: ${parameterConfig[key].alias
								?.map((v: string) => (v.length > 1 ? '--' : '-') + v)
								.join(', ')}`
						: ''),
			});
		}
	}

	for (const key in complexDefault) {
		if (undefined === output[key] || !(output[key] as any[]).length) {
			output[key] = complexDefault[key].slice();
		}
	}

	return output as ArgMateResponse<ArgMateConfig>;
}
