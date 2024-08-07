// @ts-ignore
import {ArgMateParams, ArgMateConfig, ArgMateConfigMandatory} from './types.js';

// @ts-ignore
import {re} from './common.js';

const defaultConf: ArgMateConfigMandatory = {
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
};

const strictConf = {
	allowUnknown: false,
	autoCamelKebabCase: false,
	allowNegatingFlags: false,
	allowKeyNumValues: false,
};

export function precompileConfig(params: ArgMateParams, conf?: ArgMateConfig) {
	return objectToCode(compileConfig(params, conf));
}

export function compileConfig(params: ArgMateParams, conf_: ArgMateConfig = {}) {
	const mandatory: string[] = [];
	const validate: string[] = [];
	let complexDefault: any = {};
	let output: any = {
		_: [],
	};

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
		//param.conflict = param.conflict || [];

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
				complexDefault[key] = param.default;
			} else if ('count' == param.type) {
				return conf.error(
					`Default parameters like '${param.default}' are not allowed on parameters like '${key}' with the type '${param.type}'`
				);
			} else {
				output[key] = param.default;
			}
		}

		if ('count' == param.type) {
			output[key] = 0;
		}

		if (!param.type.match(re.validTypes)) {
			conf.error(`Invalid type '${param.type}' for parameter '${key}'`);
		}

		if (param.type.match(re.arrayType)) {
			output[key] = [];
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

		if (param.alias)
			param.alias.forEach(alias => {
				if (undefined === params[alias]) params[alias] = {type: params[key].type, key};
			});
	}

	return {
		output,
		validate,
		mandatory,
		complexDefault,
		conf,
		params,
	};
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

function objectToCode(obj, level = 1) {
	let str = '{\n';

	for (const [key, value] of Object.entries(obj)) {
		str += `${'  '.repeat(level)}"${key}": `;
		if (typeof value === 'function') {
			str += value.toString();
		} else if (typeof value === 'object' && !Array.isArray(value)) {
			str += objectToCode(value, level + 1);
		} else {
			str += JSON.stringify(value);
		}
		str += ',\n';
	}

	str += '  '.repeat(level - 1) + '}';
	return str;
}
