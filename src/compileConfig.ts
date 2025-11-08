import type {ArgMateConfig, ArgMateEngineConfig, ArgMateSettings, EngineSettings} from './types.js';

import {re} from './common.js';

const strictSettings = {
	allowUnknown: false,
	allowNegatingFlags: false,
	allowKeyNumValues: false,
	allowAssign: false,
	allowBoolString: false,
};

/** #__PURE__ */ export function precompileConfig(
	config: ArgMateConfig,
	settings?: ArgMateSettings
) {
	return objectToCode(configPreprocessing(config, settings));
}

/** #__PURE__ */ export function configPreprocessing(
	config: ArgMateConfig,
	settings: ArgMateSettings = {}
): ArgMateEngineConfig {
	const mandatory: string[] = [];
	const validate: string[] = [];
	const conflict: string[] = [];
	const complexDefault: any = {};
	const output: any = {
		_: [],
	};

	const finalSettings: EngineSettings = {
		error: msg => {
			throw msg;
		},
		panic: msg => {
			throw msg;
		},
		autoCamelKebabCase: true,
		allowUnknown: true,
		allowNegatingFlags: true,
		allowKeyNumValues: true,
		allowAssign: true,
		allowBoolString: true,
		outputAlias: false,
		outputInflate: false,
		intro: '',
		outro: '',
		...(settings.strict ? strictSettings : {}),
		...settings,
	};

	const {panic} = finalSettings;
	const hasOwnProperty = Object.prototype.hasOwnProperty;

	for (const key in config) {
		if (!hasOwnProperty.call(config, key)) continue;
		let param = config[key];

		// If only default value is provided, then transform to object with correct type
		if (param === null || typeof param !== 'object' || Array.isArray(param)) {
			param = {
				default: param,
				type: findType(param),
			};
		}

		param.key = key;

		if (param.conflict) {
			param.conflict = Array.isArray(param.conflict)
				? param.conflict
				: String(param.conflict).split(re.listDeviders);
			if (param.conflict.length) {
				conflict.push(key);
			}
		}

		if (undefined !== param.valid) {
			validate.push(key);
			if (undefined === param.default && Array.isArray(param.valid)) {
				if (!param.valid.length) return panic(`Empty array found for valid values of '${key}'`);

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
				return panic(
					`Default parameter '${param.default}' is not allowed for '${key}' because of its type '${param.type}'`
				);
			} else {
				output[key] = param.default;
			}
		}

		if ('count' == param.type) {
			output[key] = 0;
		}

		if (!re.validTypes.test(param.type)) {
			panic(`Invalid type '${param.type}' for parameter '${key}'`);
		}

		if (re.isArrayType.test(param.type)) {
			output[key] = [];
		}

		if (param.mandatory) {
			mandatory.push(key);
		}

		if (param.alias) {
			param.alias = Array.isArray(param.alias)
				? param.alias
				: String(param.alias).split(re.listDeviders).filter(Boolean);
		}

		if (finalSettings.autoCamelKebabCase && re.isCamel.test(key)) {
			const kebab = key.replace(re.camel2kebab, '$1-$2').toLowerCase();
			if (kebab !== key) {
				param.alias = param.alias ? [kebab, ...param.alias] : [kebab];
			}
		}

		if (param.alias) {
			for (const alias of param.alias) {
				if (undefined === config[alias]) {
					config[alias] = {key};
				}
			}
		}

		config[key] = param;
	}

	return {
		config: config as any, // Config has been mutated in place to match EngineFinalConfig structure
		settings: finalSettings,
		output,
		validate,
		conflict,
		mandatory,
		complexDefault,
	};
}

/** #__PURE__ */ function findType(val: any): string | undefined {
	if (val === null || val === undefined) return undefined;

	const type = typeof val;
	const isArray = Array.isArray(val);

	switch (type) {
		case 'boolean':
		case 'number':
			return type + (isArray ? '[]' : '');
		default:
			return 'string' + (isArray ? '[]' : '');
	}
}

/** #__PURE__ */ function objectToCode(obj: any, level = 1): string {
	let str = '{\n';

	for (const [key, value] of Object.entries(obj)) {
		str += `${'  '.repeat(level)}"${key}": `;
		if (typeof value === 'function' || value instanceof RegExp) {
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
