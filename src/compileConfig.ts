import type {ArgMateConfig, ArgMateEngineConfig, ArgMateSettings, EngineSettings} from './types.js';

import {findType, re} from './common.js';

const strictSettings = {
	allowUnknown: false,
	allowNegatingFlags: false,
	allowKeyNumValues: false,
	allowAssign: false,
	allowAutoNumbers: false,
};

/** #__PURE__ */ export function precompileConfig(
	parameterConfig: ArgMateConfig,
	engineSettings?: ArgMateSettings
): string {
	return objectToCode(configPreprocessing(parameterConfig, engineSettings));
}

// A string with no comma, space, dash or non-ASCII letter is one name. The loop finds that out without the regex, so
// the regex is not compiled for the usual config
const names = (value: unknown): string[] => {
	const text = String(value);
	for (let i = 0; i < text.length; i++) {
		const c = text.charCodeAt(i);
		if (c <= 32 || 44 === c || 45 === c || 127 <= c) return text.split(re.listDeviders);
	}
	return [text];
};

const PASS = {};

// Few configs have spot, next or last. A separate function is compiled only when a config has one
function preparePlace(
	param: any,
	key: string,
	spots: string[],
	nextOrLast: string[],
	processedConfig: {[key: string]: any},
	panic: (msg: string) => never
): unknown {
	if (1 < +(undefined !== param.spot) + +(undefined !== param.next) + +(undefined !== param.last)) {
		return panic(`The parameter '${key}' can only have one of "spot", "next" and "last"`);
	}
	const name = undefined !== param.spot ? 'spot' : undefined !== param.next ? 'next' : 'last';
	if (!Number.isInteger(param[name]) || !param[name]) {
		return panic(`The "${name}" property of '${key}' must be a whole number other than 0`);
	}
	if ('spot' === name) {
		if ('count' === param.type) {
			return panic(`The parameter '${key}' has "spot" and can not have the type 'count'`);
		}
		// A spot is found by its place, so a name for it in the input has no use
		if (param.alias) {
			return panic(`The parameter '${key}' has "spot" and can not have an alias`);
		}
		// Two spots with the same number always point at one input. A spot from the start and one from the end
		// point at one input only for some inputs, so the engine finds that overlap in the input
		const same = spots.find(other => processedConfig[other].spot === param.spot);
		if (same) {
			return panic(`The parameters '${same}' and '${key}' have the same "spot": ${param.spot}`);
		}
		spots.push(key);
	} else {
		if (!('array' === param.type || param.type.endsWith('[]')) || re.noValue.test(param.type)) {
			return panic(
				`The parameter '${key}' has "${name}" and must have an array type with values, not '${param.type}'`
			);
		}
		nextOrLast.push(key);
	}
	return PASS;
}

// Few configs have a list of valid values. A separate function is compiled only when a config has one
function prepareValid(param: any, key: string, panic: (msg: string) => never): unknown {
	if (!param.valid.length) {
		return panic(`Empty array found for valid values of '${key}'`);
	}
	param.validShown = param.valid.map((item: unknown) =>
		Array.isArray(item) ? item.filter(alias => !Array.isArray(alias)) : [item]
	);
	param.valid = param.valid.map((item: unknown) => (Array.isArray(item) ? item.flat() : [item]));
	if (undefined === param.default) {
		if (undefined === param.type) {
			param.type = findType(param.valid[0][0]) + (param.next || param.last ? '[]' : '');
		}
		param.default = param.valid[0][0];
	}
	return PASS;
}

// Few configs have conflict or demand. A separate function is compiled only when a config has one
function resolveGroups(
	processedConfig: {[key: string]: any},
	conflict: string[],
	demand: string[],
	panic: (msg: string) => never
): unknown {
	for (const key of conflict) {
		processedConfig[key].conflict = processedConfig[key].conflict.map(
			(name: string) => processedConfig[name]?.key ?? name
		);
	}

	for (const key of demand) {
		const unknown = processedConfig[key].demand.find((name: string) => !processedConfig[name]?.key);
		if (undefined !== unknown) {
			return panic(
				`The parameter '${key}' demands '${unknown}', which is not a parameter or an alias`
			);
		}
		processedConfig[key].demand = processedConfig[key].demand.map(
			(name: string) => processedConfig[name].key
		);
	}
	return PASS;
}

/** #__PURE__ */ export function configPreprocessing(
	parameterConfig: ArgMateConfig,
	engineSettings: ArgMateSettings = {}
): ArgMateEngineConfig {
	const mandatory: string[] = [];
	const validate: string[] = [];
	const transform: string[] = [];
	const exists: string[] = [];
	const conflict: string[] = [];
	const demand: string[] = [];
	const spots: string[] = [];
	const nextOrLast: string[] = [];
	const complexDefault: {[key: string]: string[] | number[]} = {};
	const output: {[key: string]: unknown} = {
		_: [],
	};

	const finalSettings: EngineSettings = {
		error: e => {
			throw Object.assign(new Error(e.message), e);
		},
		panic: msg => {
			throw new Error(msg);
		},
		autoCamelKebabCase: true,
		allowUnknown: true,
		allowNegatingFlags: true,
		allowKeyNumValues: true,
		allowAssign: true,
		allowAutoNumbers: true,
		outputAlias: false,
		outputInflate: false,
		...(engineSettings.strict ? strictSettings : {}),
		// A custom `error` may return. The engine stops after it all the same.
		...(engineSettings as Partial<EngineSettings>),
	};

	const {panic} = finalSettings;
	const hasOwnPropertyFn = Object.prototype.hasOwnProperty;
	const processedConfig: {[key: string]: any} = {};

	for (const key in parameterConfig) {
		// `intro` and `outro` are the text of the help
		if (!hasOwnPropertyFn.call(parameterConfig, key) || 'intro' === key || 'outro' === key)
			continue;
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
			// canonical name in the copy. A list goes to `valid` and a function or a regular expression
			// to `validate`, by either name. A switch is faster here than a regex or a Set.
			// Keep in sync with `ConfigPropertyName` in `types.ts`
			const copy: any = {};
			for (const configProperty in param) {
				let canonical = configProperty;
				switch (configProperty) {
					case 'type':
					case 'default':
					case 'alias':
					case 'conflict':
					case 'demand':
					case 'spot':
					case 'next':
					case 'last':
					case 'transform':
					case 'mandatory':
					case 'description':
						break;
					case 'valid':
						if (undefined !== param.valid && !Array.isArray(param.valid)) {
							return panic(`The "valid" property of '${key}' must be an array of valid values`);
						}
						break;
					case 'validate':
						if (Array.isArray(param.validate)) canonical = 'valid';
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
			param.conflict = Array.isArray(param.conflict) ? param.conflict : names(param.conflict);
			if (param.conflict.length) {
				conflict.push(key);
			}
		}

		if ('function' === typeof param.transform) {
			transform.push(key);
		}

		if (param.demand) {
			param.demand = Array.isArray(param.demand) ? param.demand : names(param.demand);
			if (param.demand.length) {
				demand.push(key);
			}
		}

		if (param.valid || undefined !== param.validate) {
			validate.push(key);
		}

		if (param.valid) {
			const stop = prepareValid(param, key, panic);
			if (PASS !== stop) return stop as ArgMateEngineConfig;
		}

		if (undefined !== param.validate) {
			if (param.validate instanceof RegExp) {
				// A regular expression is for text, so it gives the type `string` when there is no type and no default
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

		param.type =
			param.type?.toLowerCase() ||
			findType(param.default) ||
			(param.spot ? 'string' : param.next || param.last ? 'string[]' : 'boolean');
		// `bool` is another name for `boolean`. A string test is enough, so no regex is compiled for it
		if ('bool' === param.type || 'bool[]' === param.type)
			param.type = 'boolean' + param.type.slice(4);

		// A file, a folder or a path is text, and the engine checks that it is on the disk
		const kind = param.type.endsWith('[]') ? param.type.slice(0, -2) : param.type;
		if ('file' === kind || 'folder' === kind || 'path' === kind) {
			param.exists = kind;
			param.type = 'string' + param.type.slice(kind.length);
			exists.push(key);
		}

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

		switch (param.type) {
			case 'array':
			case 'count':
			case 'boolean':
			case 'boolean[]':
			case 'string':
			case 'string[]':
			case 'number':
			case 'number[]':
			case 'float':
			case 'float[]':
			case 'int':
			case 'int[]':
			case 'hex':
			case 'hex[]':
				break;
			default:
				panic(`Invalid type '${param.type}' for parameter '${key}'`);
		}

		if (undefined !== param.spot || undefined !== param.next || undefined !== param.last) {
			const stop = preparePlace(param, key, spots, nextOrLast, processedConfig, panic);
			if (PASS !== stop) return stop as ArgMateEngineConfig;
		}

		if ('array' === param.type || param.type.endsWith('[]')) {
			output[key] = [];
		}

		if (param.mandatory) {
			mandatory.push(key);
		}

		if (param.alias) {
			param.alias = Array.isArray(param.alias) ? param.alias : names(param.alias).filter(Boolean);
		}

		let camel = false;
		if (finalSettings.autoCamelKebabCase) {
			for (let i = 1; i < key.length && !camel; i++) {
				const upper = key.charCodeAt(i);
				const before = key.charCodeAt(i - 1);
				camel =
					64 < upper &&
					upper < 91 &&
					((96 < before && before < 123) || (47 < before && before < 58));
			}
		}
		if (camel) {
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

	if (conflict.length || demand.length) {
		const stop = resolveGroups(processedConfig, conflict, demand, panic);
		if (PASS !== stop) return stop as ArgMateEngineConfig;
	}

	return {
		parameterConfig: processedConfig as any,
		engineSettings: finalSettings,
		output,
		validate,
		transform,
		exists,
		conflict,
		demand,
		spots,
		nextOrLast,
		mandatory,
		complexDefault,
	};
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
