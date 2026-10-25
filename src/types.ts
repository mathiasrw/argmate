/**
 * Base config properties shared by all option types (before processing)
 */
type ParameterProperties = {
	mandatory?: boolean;
	required?: boolean; // Alias of `mandatory`
	alias?: string | string[];
	conflict?: string | string[];
	description?: string;
	describe?: string; // Alias of `description`
	desc?: string; // Alias of `description`
};

/**
 * Base config properties after processing by configPreprocessing
 * After processing, key is always present and alias/conflict are normalized to arrays
 */
type ParameterFinalProperties = {
	mandatory?: boolean;
	alias?: string[];
	conflict?: string[];
	description?: string;
	key: string; // Required after processing
};

/**
 * Typed config options with proper type inference for validate and transform functions
 */
type ParameterConfig =
	| (ParameterProperties & {
			type: 'boolean';
			default?: boolean;
			validate?: ((value: boolean) => boolean) | boolean[];
			valid?: ((value: boolean) => boolean) | boolean[]; // Alias of `validate`
			transform?: (value: boolean) => any;
	  })
	| (ParameterProperties & {
			type: 'string' | 'array';
			default?: string | string[];
			validate?: ((value: string | string[]) => boolean) | string[] | RegExp;
			valid?: ((value: string | string[]) => boolean) | string[] | RegExp; // Alias of `validate`
			transform?: (value: string | string[]) => any;
	  })
	| (ParameterProperties & {
			type: 'number' | 'float' | 'int' | 'hex' | 'count';
			default?: number;
			validate?: ((value: number) => boolean) | number[] | RegExp;
			valid?: ((value: number) => boolean) | number[] | RegExp; // Alias of `validate`
			transform?: (value: number) => any;
	  })
	| (ParameterProperties & {
			type: 'string[]';
			default?: string[];
			validate?: ((value: string[]) => boolean) | string[] | RegExp;
			valid?: ((value: string[]) => boolean) | string[] | RegExp; // Alias of `validate`
			transform?: (value: string[]) => any;
	  })
	| (ParameterProperties & {
			type: 'number[]' | 'float[]' | 'int[]' | 'hex[]';
			default?: number[];
			validate?: ((value: number[]) => boolean) | number[] | RegExp;
			valid?: ((value: number[]) => boolean) | number[] | RegExp; // Alias of `validate`
			transform?: (value: number[]) => any;
	  })
	| (ParameterProperties & {
			default: string;
			type?: 'string' | 'array';
			validate?: ((value: string) => boolean) | string[] | RegExp;
			valid?: ((value: string) => boolean) | string[] | RegExp; // Alias of `validate`
			transform?: (value: string) => any;
	  })
	| (ParameterProperties & {
			default: number;
			type?: 'number' | 'float' | 'int' | 'hex';
			validate?: ((value: number) => boolean) | number[] | RegExp;
			valid?: ((value: number) => boolean) | number[] | RegExp; // Alias of `validate`
			transform?: (value: number) => any;
	  })
	| (ParameterProperties & {
			default: boolean;
			type?: 'boolean';
			validate?: ((value: boolean) => boolean) | boolean[];
			valid?: ((value: boolean) => boolean) | boolean[]; // Alias of `validate`
			transform?: (value: boolean) => any;
	  })
	| (ParameterProperties & {
			default: string[];
			type?: 'string[]' | 'array';
			validate?: ((value: string[]) => boolean) | string[] | RegExp;
			valid?: ((value: string[]) => boolean) | string[] | RegExp; // Alias of `validate`
			transform?: (value: string[]) => any;
	  })
	| (ParameterProperties & {
			default: number[];
			type?: 'number[]' | 'float[]' | 'int[]' | 'hex[]';
			validate?: ((value: number[]) => boolean) | number[] | RegExp;
			valid?: ((value: number[]) => boolean) | number[] | RegExp; // Alias of `validate`
			transform?: (value: number[]) => any;
	  })
	| (ParameterProperties & {
			// A regular expression with no `type` and no `default` gives the type `string`
			type?: undefined;
			default?: undefined;
			validate: RegExp;
			valid?: undefined;
			transform?: (value: string) => any;
	  })
	| (ParameterProperties & {
			type?: undefined;
			default?: undefined;
			validate?: undefined;
			valid: RegExp; // Alias of `validate`
			transform?: (value: string) => any;
	  })
	| (ParameterProperties & {
			// Mutually-exclusive fallback for configs WITHOUT `type` AND WITHOUT `default`,
			// e.g. `{mandatory: true}`, `{alias: 'v'}`, `{conflict: 'foo'}`, `{}`.
			// Such entries default to boolean semantics at runtime.
			//
			// `type` and `default` are explicitly `undefined` here so that configs declaring
			// either field are forced to match one of the typed variants above. This makes
			// type mismatches (e.g. `{type: 'int', transform: (v: string) => ...}`) and
			// unknown type strings (e.g. `{type: 'date'}`) fail at compile time.
			type?: undefined;
			default?: undefined;
			validate?: ((value: boolean) => boolean) | boolean[];
			valid?: ((value: boolean) => boolean) | boolean[]; // Alias of `validate`
			transform?: (value: boolean) => any;
	  });

/**
 * The set of valid `type` string literals accepted by ArgMate.
 * Adding a new type requires updating:
 * - This union
 * - `ValueOfType<T>` below
 * - The engine switch statement in `argEngine.ts` / `argEngineMini.ts`
 * - The `re.validTypes` regex in `common.ts`
 */
export type ParameterTypeName =
	| 'boolean'
	| 'string'
	| 'array'
	| 'string[]'
	| 'number'
	| 'float'
	| 'int'
	| 'hex'
	| 'count'
	| 'number[]'
	| 'float[]'
	| 'int[]'
	| 'hex[]';

/**
 * Map a `type` literal to the value-type that ArgMate will produce at runtime.
 * This is what `transform` and `validate` callbacks receive as their first argument.
 */
type ValueOfType<T> = T extends 'boolean'
	? boolean
	: T extends 'string' | 'array'
		? string | string[]
		: T extends 'number' | 'float' | 'int' | 'hex' | 'count'
			? number
			: T extends 'string[]'
				? string[]
				: T extends 'number[]' | 'float[]' | 'int[]' | 'hex[]'
					? number[]
					: unknown;

/**
 * Map a `default` value to its value-type. Used when `type` is omitted.
 */
type ValueOfDefault<D> = D extends boolean
	? boolean
	: D extends number
		? number
		: D extends string
			? string
			: D extends readonly string[]
				? string[]
				: D extends readonly number[]
					? number[]
					: unknown;

/**
 * Extract the value-type from a single config entry shape `E`.
 * Prefers `type` over `default` when both are present.
 */
type ValueOf<E> = E extends {type: infer T}
	? ValueOfType<T>
	: E extends {default: infer D}
		? ValueOfDefault<D>
		: unknown;

/**
 * Utility type that produces a stricter per-entry shape for a user config:
 * `transform` / `validate` callbacks are typed against the value-type inferred
 * from each entry's `type` / `default`, and `type` is restricted to
 * `ParameterTypeName`.
 *
 * Not currently used by the default `argMate` signature (the discriminated
 * union in `ParameterConfig` already provides this narrowing for `as const`
 * configs). Exported for advanced users who want to author a config object
 * separately from the `argMate` call and have it type-checked end-to-end,
 * e.g. `const cfg = {...} satisfies ValidateConfig<typeof cfg>`.
 */
export type ValidateConfig<C> = {
	[K in keyof C]: C[K] extends object
		? Omit<C[K], 'transform' | 'validate' | 'valid' | 'type'> & {
				type?: ParameterTypeName;
				transform?: (value: ValueOf<C[K]>) => unknown;
				validate?: ((value: ValueOf<C[K]>) => boolean) | readonly ValueOf<C[K]>[] | RegExp;
				valid?: ((value: ValueOf<C[K]>) => boolean) | readonly ValueOf<C[K]>[] | RegExp;
			}
		: C[K];
};

/**
 * Processed config options after configPreprocessing has normalized them
 * Key is required and alias/conflict are arrays
 * Note: validate function accepts any to avoid union narrowing issues
 */
type ParameterFinalConfig =
	| (ParameterFinalProperties & {
			type: 'boolean';
			default?: boolean;
			validate?: ((value: any) => boolean) | boolean[];
			transform?: (value: boolean) => any;
	  })
	| (ParameterFinalProperties & {
			type: 'string' | 'array';
			default?: string | string[];
			validate?: ((value: any) => boolean) | string[] | RegExp;
			transform?: (value: string | string[]) => any;
	  })
	| (ParameterFinalProperties & {
			type: 'number' | 'float' | 'int' | 'hex' | 'count';
			default?: number;
			validate?: ((value: any) => boolean) | number[] | RegExp;
			transform?: (value: number) => any;
	  })
	| (ParameterFinalProperties & {
			type: 'string[]';
			default?: string[];
			validate?: ((value: any) => boolean) | string[] | RegExp;
			transform?: (value: string[]) => any;
	  })
	| (ParameterFinalProperties & {
			type: 'number[]' | 'float[]' | 'int[]' | 'hex[]';
			default?: number[];
			validate?: ((value: any) => boolean) | number[] | RegExp;
			transform?: (value: number[]) => any;
	  })
	| (ParameterFinalProperties & {
			type: string;
			default?: any;
			validate?: ((value: any) => boolean) | any[] | RegExp;
			transform?: (value: any) => any;
	  });

/**
 * The config properties of a parameter that ArgMate knows: the canonical names and their aliases.
 * Keep in sync with the check in `configPreprocessing` in `compileConfig.ts`.
 */
type ConfigPropertyName =
	| 'type'
	| 'default'
	| 'alias'
	| 'conflict'
	| 'validate'
	| 'valid' // Alias of `validate`
	| 'transform'
	| 'mandatory'
	| 'required' // Alias of `mandatory`
	| 'description'
	| 'describe' // Alias of `description`
	| 'desc'; // Alias of `description`

type RejectUnknownProperties<V> = V extends readonly unknown[]
	? V
	: V extends object
		? {[P in keyof V]: P extends ConfigPropertyName ? V[P] : never}
		: V;

/**
 * Gives the type `never` to each config property of a parameter that ArgMate does not know,
 * thus a misspelled property (`alais`) is a compile error. A generic `Config` gets no
 * excess property check from TypeScript, so `argMate` asks for `Config & StrictConfig<Config>`.
 */
export type StrictConfig<Config> = {[K in keyof Config]: RejectUnknownProperties<Config[K]>};

/**
 * User-facing config passed to argMate/configPreprocessing
 */
export interface ArgMateConfig {
	[key: string]: ParameterConfig | null | string | number | string[] | number[] | boolean;
}

/**
 * Internal config structure after configPreprocessing normalizes it
 * Each entry has a required 'key' property and normalized arrays
 */
interface EngineFinalConfig {
	[key: string]: ParameterFinalConfig;
}

type TextBlock = string | (string | [string, string])[];

export interface ArgMateSettings {
	panic?: (msg: string) => never;
	error?: (msg: string) => never;
	strict?: boolean;
	allowUnknown?: boolean;
	autoCamelKebabCase?: boolean;
	allowNegatingFlags?: boolean;
	allowKeyNumValues?: boolean;
	allowAssign?: boolean;
	allowBoolString?: boolean;
	outputAlias?: boolean;
	outputInflate?: boolean;
	intro?: TextBlock;
	outro?: TextBlock;
	greedy?: boolean;

	//	'dot-notation': false,
	//  'boolean-negation': false
}

export interface EngineSettings extends ArgMateSettings {
	error: (msg: string) => never;
	panic: (msg: string) => never;
}

export interface ArgMateInfoConfig {
	width?: number;
	format?: 'cli' | 'markdown' | 'json';
	preIntro?: TextBlock;
	showIntro?: boolean;
	showOutro?: boolean;
	postOutro?: TextBlock;
}

export type ArgMateEngine = (
	args: string[],
	parameterConfig?: ArgMateConfig,
	engineSettings?: ArgMateSettings
) => {[key: string]: any};

export declare function argMate<const Config extends ArgMateConfig | undefined = undefined>(
	args: string[],
	parameterConfig?: Config & StrictConfig<Config>,
	engineSettings?: ArgMateSettings
): ArgMateResponse<Config>;

/**
 * The compiled configuration object returned by configPreprocessing()
 * This is what gets passed to the argEngine functions
 */
export type ArgMateEngineConfig = {
	output: {[key: string]: any};
	mandatory: string[];
	validate: string[];
	transform: string[];
	conflict: string[];
	complexDefault: {[key: string]: string[] | number[]};
	engineSettings: EngineSettings;
	parameterConfig: EngineFinalConfig;
};

// ============================================================================
// Type Inference System
// ============================================================================

/**
 * Normalize shorthand config forms to full config objects
 * Examples:
 * - {foo: 10} -> {foo: {default: 10; type: 'int'}}
 * - {foo: {default: 10}} -> {foo: {default: 10; type: 'int'}}
 * - {foo: {type: 'string'}} -> {foo: {type: 'string'}}
 */
type NormalizeConfigValue<T> = T extends {type?: any; default?: any}
	? T extends {type: unknown}
		? T
		: T extends {default: infer D}
			? D extends string
				? T & {type: 'string'}
				: D extends number
					? T & {type: 'int'}
					: D extends boolean
						? T & {type: 'boolean'}
						: D extends readonly string[]
							? T & {type: 'string[]'}
							: D extends readonly number[]
								? T & {type: 'number[]'}
								: D extends string[]
									? T & {type: 'string[]'}
									: D extends number[]
										? T & {type: 'number[]'}
										: T
			: T
	: T extends {type?: any}
		? T
		: T extends string
			? {default: T; type: 'string'}
			: T extends number
				? {default: T; type: 'int'}
				: T extends boolean
					? {default: T; type: 'boolean'}
					: T extends readonly string[]
						? {default: T; type: 'string[]'}
						: T extends readonly number[]
							? {default: T; type: 'number[]'}
							: T extends string[]
								? {default: T; type: 'string[]'}
								: T extends number[]
									? {default: T; type: 'number[]'}
									: T extends null
										? {type: 'boolean'}
										: // An object with no `type` and no `default` (for example `{mandatory: true}`)
											// keeps its properties, thus `mandatory` and `validate` are read from it
											T extends readonly unknown[]
											? {type: 'boolean'}
											: T extends object
												? T
												: {type: 'boolean'};

/**
 * Widen literal types to their base types
 * "foo" | "bar" -> string
 * 1 | 2 | 3 -> number
 * true | false -> boolean
 */
type WidenLiteral<T> = T extends string
	? string
	: T extends number
		? number
		: T extends boolean
			? boolean
			: T;

/**
 * Helper to widen array/tuple types to mutable arrays with widened element types
 * Converts readonly ["a", "b"] to string[]
 * Converts readonly [1, 2, 3] to number[]
 * Converts readonly string[] to string[]
 */
type WidenArray<T> = T extends readonly (infer U)[]
	? WidenLiteral<U>[]
	: T extends (infer U)[]
		? WidenLiteral<U>[]
		: never;

/**
 * Infer the TypeScript type from a normalized config value
 * Each branch explicitly returns mutable, widened types
 */
type InferConfigType<Config> = Config extends {readonly default: infer D} | {default: infer D}
	? // For defaults, widen arrays/tuples to general mutable arrays
		D extends readonly any[]
		? WidenArray<D>
		: D extends any[]
			? WidenArray<D>
			: // For non-array types, return as-is
				D extends string
				? string
				: D extends number
					? number
					: D extends boolean
						? boolean
						: unknown
	: // For explicit types, always return mutable array types
		Config extends {readonly type: 'string'} | {type: 'string'}
		? string
		: Config extends {readonly type: 'number'} | {type: 'number'}
			? number
			: Config extends {readonly type: 'int'} | {type: 'int'}
				? number
				: Config extends {readonly type: 'float'} | {type: 'float'}
					? number
					: Config extends {readonly type: 'hex'} | {type: 'hex'}
						? number
						: Config extends {readonly type: 'boolean'} | {type: 'boolean'}
							? boolean
							: Config extends {readonly type: 'bool'} | {type: 'bool'}
								? boolean
								: Config extends {readonly type: 'count'} | {type: 'count'}
									? number
									: Config extends
												| {readonly type: 'array' | 'string[]'}
												| {type: 'array' | 'string[]'}
										? string[]
										: Config extends {readonly type: 'number[]'} | {type: 'number[]'}
											? number[]
											: Config extends {readonly type: 'int[]'} | {type: 'int[]'}
												? number[]
												: Config extends {readonly type: 'float[]'} | {type: 'float[]'}
													? number[]
													: Config extends {readonly type: 'hex[]'} | {type: 'hex[]'}
														? number[]
														: Config extends
																	| {readonly validate: RegExp}
																	| {validate: RegExp}
																	| {readonly valid: RegExp}
																	| {valid: RegExp}
															? string // a regular expression is for text
															: boolean; // default to boolean if no type or default specified

/**
 * Check if a config field has a default value
 */
type HasDefault<Config> = Config extends {readonly default: any} | {default: any} ? true : false;

/**
 * Check if a config field is mandatory (has mandatory: true flag, or its alias required: true)
 */
type IsMandatory<Config> = Config extends
	| {readonly mandatory: true}
	| {mandatory: true}
	| {readonly required: true}
	| {required: true}
	? true
	: false;

/**
 * Check if a config field is required (always present in result)
 * A field is required if it has mandatory: true OR has a default value
 */
type IsRequired<Config> =
	HasDefault<Config> extends true ? true : IsMandatory<Config> extends true ? true : false;

/**
 * Check if a config field is optional (may be undefined in result)
 * A field is optional only if it has no default AND no mandatory flag
 */
type IsOptional<Config> = IsRequired<Config> extends true ? false : true;

/**
 * Deeply strip readonly from all types - arrays, objects, and primitives
 * This is the core type that ensures everything is mutable
 * Arrays are handled first to prevent them from being treated as objects
 */
type DeepMutable<T> = T extends readonly (infer U)[]
	? U extends object
		? DeepMutable<U>[]
		: U[]
	: T extends (infer U)[]
		? U extends object
			? DeepMutable<U>[]
			: U[]
		: T extends object
			? {-readonly [K in keyof T]: T[K] extends object ? DeepMutable<T[K]> : T[K]}
			: T;

/**
 * Infer the result type for a single config field
 * DeepMutable ensures complete mutability of the final type
 */
type InferFieldResult<ConfigValue> = ConfigValue extends null | undefined
	? boolean
	: InferConfigType<NormalizeConfigValue<ConfigValue>>;

/**
 * Build the result object type from the config
 */
type CLIParameters<Config extends ArgMateConfig> = {
	// Always include the _ property for remaining args (always present)
	_: string[];
} & {
	// Required fields (mandatory: true OR has default value)
	-readonly [K in keyof Config as IsRequired<NormalizeConfigValue<Config[K]>> extends true
		? K
		: never]: InferFieldResult<Config[K]>;
} & {
	// Optional fields (no default and not mandatory)
	-readonly [K in keyof Config as IsOptional<NormalizeConfigValue<Config[K]>> extends true
		? K
		: never]?: InferFieldResult<Config[K]>;
};

/**
 * Main type inference - converts config to result type
 * DeepMutable ensures the entire result is fully mutable
 */
export type ArgMateResponse<Config extends ArgMateConfig | undefined> = Config extends ArgMateConfig
	? DeepMutable<CLIParameters<Config>>
	: {[key: string]: any; _: string[]};
