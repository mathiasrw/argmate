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
	parameterConfig: ArgMateConfig,
	engineSettings?: ArgMateSettings
) {
	return objectToCode(configPreprocessing(parameterConfig, engineSettings));
}

/** #__PURE__ */ export function configPreprocessing(
	parameterConfig: ArgMateConfig,
	engineSettings: ArgMateSettings = {}
): ArgMateEngineConfig {
	const mandatory: string[] = [];
	const validate: string[] = [];
	const transform: string[] = [];
	const conflict: string[] = [];
	const complexDefault: {[key: string]: string[] | number[]} = {};
	const output: {[key: string]: unknown} = {
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
		...(engineSettings.strict ? strictSettings : {}),
		...engineSettings,
	};

	const {panic} = finalSettings;
	const hasOwnPropertyFn = Object.prototype.hasOwnProperty;
	const processedConfig: {[key: string]: any} = {};

	for (const key in parameterConfig) {
		if (!hasOwnPropertyFn.call(parameterConfig, key)) continue;
		// `param` is typed loosely here because it is mutated extensively below
		// (normalization, alias/conflict array coercion, type/default coercion).
		// The public-facing constraint lives in `ArgMateConfig` + `ValidateConfig`.
		let param: any = parameterConfig[key];

		// If only default value is provided, then transform to object with correct type
		if (param === null || typeof param !== 'object' || Array.isArray(param)) {
			param = {
				default: param,
				type: findType(param),
			};
		} else {
			// Copy to avoid mutating the user's config object. An alias of a config property gets its
			// canonical name in the copy. A switch is faster here than a regex or a Set.
			// Keep in sync with `ConfigPropertyName` in `types.ts`
			const copy: any = {};
			for (const configProperty in param) {
				let canonical = configProperty;
				switch (configProperty) {
					case 'type':
					case 'default':
					case 'alias':
					case 'conflict':
					case 'validate':
					case 'transform':
					case 'mandatory':
					case 'description':
						break;
					case 'valid':
						canonical = 'validate';
						break;
					case 'required':
						canonical = 'mandatory';
						break;
					case 'describe':
					case 'desc':
						canonical = 'description';
						break;
					default:
						return panic(`Unknown config property '${configProperty}' for parameter '${key}'`);
				}
				if (canonical in copy) {
					return panic(`More than one config property for '${canonical}' in parameter '${key}'`);
				}
				copy[canonical] = param[configProperty];
			}
			param = copy;
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

		if ('function' === typeof param.transform) {
			transform.push(key);
		}

		if (undefined !== param.validate) {
			validate.push(key);
			if (Array.isArray(param.validate)) {
				if (undefined === param.default) {
					if (!param.validate.length) {
						return panic(`Empty array found for valid values of '${key}'`);
					}

					if (undefined === param.type) {
						param.type = findType(param.validate[0]);
					}
					param.default = param.validate[0];
				}
			} else if (param.validate instanceof RegExp) {
				// A regular expression is for text, thus it gives the type `string` when there is no type and no default
				if (undefined === param.type && undefined === param.default) {
					param.type = 'string';
				}
			} else if ('function' !== typeof param.validate) {
				// The engines do not check this again
				return panic(
					`The "validate" property of '${key}' must be a function, a regular expression or an array of valid values`
				);
			}
		}

		param.type = param.type?.toLowerCase() || findType(param.default) || 'boolean';

		if (undefined !== param.default) {
			if (Array.isArray(param.default)) {
				complexDefault[key] = param.default;
			} else if ('count' === param.type) {
				return panic(
					`Default parameter '${param.default}' is not allowed for '${key}' because of its type '${param.type}'`
				);
			} else {
				output[key] = param.default;
			}
		}

		if ('count' === param.type) {
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
				if (undefined === parameterConfig[alias] && undefined === processedConfig[alias]) {
					processedConfig[alias] = {key};
				}
			}
		}

		processedConfig[key] = param;
	}

	return {
		parameterConfig: processedConfig as any,
		engineSettings: finalSettings,
		output,
		validate,
		transform,
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
