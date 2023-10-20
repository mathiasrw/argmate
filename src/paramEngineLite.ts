// @ts-ignore
import {ArgMateParams, ArgMateConfig, ParserObj} from './types.js';
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
*/

const defaultConf = {
	output: {
		_: [],
	},
	validate: [],
	mandatory: [],
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

export default function paramEngineLight(args: string[], parserObj: ParserObj = defaultConf) {
	if (!parserObj) throw `parserObj not set`;

	const {mandatory: m, validate: v, output: o, conf: c, params: p} = parserObj;

	args.reverse(); // Reverse, pop, push, reverse 8.77 times faster than unshft, shift

	while (args.length) {
		let arg: string = '' + args.pop();

		if (arg.charCodeAt(0) !== 45) {
			o['_'].push(arg);
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
			o['_'] = o['_'].concat(args.reverse());
			break;
		}

		if (!KEY) {
			o['_'].push(arg);
			continue;
		}

		if (c.allowAssign) {
			let i = KEY.indexOf('=');
			if (-1 < i) {
				ASSIGN = true;
				VAL = KEY.slice(i + 1);
				KEY = KEY.slice(0, i);
			}
		}

		if (!LONG && 1 !== KEY.length) {
			if (ASSIGN) return c.error(`Unsupported format: '${arg}'`);
			const multi = KEY.split('').map(v => '-' + v);
			args = args.concat(multi.reverse());
			continue;
		}

		if (!p[KEY]) {
			if (!c.allowUnknown) return c.error(`'${KEY}' not allowed`);

			if (c.autoCamelKebabCase) {
				KEY = KEY.replace(re.camel, function (match, letter) {
					return letter.toUpperCase();
				});
			}

			if (ASSIGN) {
				if (!VAL) {
					if (0 === args.length) return c.error(`No data for '${KEY}'`);
					VAL = args.pop() || '';
				}
				// @ts-ignore
				o[KEY] = +VAL == VAL ? +VAL : VAL;
			} else {
				o[KEY] = true;
			}
			continue;
		}

		if ('boolean' === p[KEY].type) {
			if (ASSIGN) return c.error(`'${KEY}' is boolean, so can't assign: '${arg}'`);
			o[p[KEY].key] = true;
			continue;
		}

		if ('count' === p[KEY].type) {
			if (ASSIGN) return c.error(`'${KEY}' is count, so can't assign: '${arg}'`);
			o[KEY]++;
			continue;
		}

		if (!VAL) {
			if (0 === args.length) return c.error(`No data for '${KEY}'`);
			VAL = args.pop() || '';
		}

		let num = 0;

		switch (p[KEY].type) {
			case 'string':
				o[p[KEY].key] = VAL;
				continue;

			case 'array':
			case 'string[]':
				o[p[KEY].key].push(VAL);
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
				return c.panic(`'${KEY}' got invalid type: '${p[KEY].type}'`);
		}

		if (isNaN(num) || !isFinite(num)) {
			return c.error(`'${KEY}' not a valid ${p[KEY].type}: '${VAL}'`);
		}

		if (Array.isArray(o[p[KEY].key])) {
			o[p[KEY].key].push(num);
		} else {
			o[p[KEY].key] = num;
		}
	}

	for (let key of v) {
		let help = '';
		if ('function' === typeof p[key].valid) {
			if (p[key].valid(o[key])) continue;
		} else {
			if (!Array.isArray(p[key].valid)) {
				return c.panic(`"valid" property of '${key}' must be function or array`);
			}

			if (p[key].valid.includes(o[key])) {
				continue;
			}

			help = '. Valid values: ' + JSON.stringify(p[key].valid);
		}

		return c.error(`Invalid value for '${key}': '${o[key]}'` + help);
	}

	for (let key of m) {
		if (undefined === o[key]) {
			return c.error(
				`'${key.length > 1 ? '--' : '-'}${key}' is mandatory` +
					(p[key].alias.length
						? `.  Or use an alias: ${p[key].alias
								.map(v => (v.length > 1 ? '--' : '-') + v)
								.join(', ')}`
						: '')
			);
		}
	}

	// todo: check for conflict

	return o;
}
