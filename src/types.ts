/**
 * Base config properties shared by all option types (before processing)
 */
type ParameterProperties = {
	mandatory?: boolean;
	alias?: string | string[];
	conflict?: string | string[];
	describe?: string;
	key?: string; // Added dynamically by configPreprocessing
};

/**
 * Base config properties after processing by configPreprocessing
 * After processing, key is always present and alias/conflict are normalized to arrays
 */
type ParameterFinalProperties = {
	mandatory?: boolean;
	alias?: string[];
	conflict?: string[];
	describe?: string;
	key: string; // Required after processing
};

/**
 * Typed config options with proper type inference for valid and transform functions
 */
type ParameterConfig =
	| (ParameterProperties & {
			type: 'boolean';
			default?: boolean;
			valid?: ((value: boolean) => boolean) | boolean[];
			transform?: (value: boolean) => any;
	  })
	| (ParameterProperties & {
			type: 'string' | 'array';
			default?: string | string[];
			valid?: ((value: string | string[]) => boolean) | string[];
			transform?: (value: string | string[]) => any;
	  })
	| (ParameterProperties & {
			type: 'number' | 'float' | 'int' | 'hex' | 'count';
			default?: number;
			valid?: ((value: number) => boolean) | number[];
			transform?: (value: number) => any;
	  })
	| (ParameterProperties & {
			type: 'string[]';
			default?: string[];
			valid?: ((value: string[]) => boolean) | string[];
			transform?: (value: string[]) => any;
	  })
	| (ParameterProperties & {
			type: 'number[]' | 'float[]' | 'int[]' | 'hex[]';
			default?: number[];
			valid?: ((value: number[]) => boolean) | number[];
			transform?: (value: number[]) => any;
	  })
	| (ParameterProperties & {
			default: string;
			type?: 'string' | 'array';
			valid?: ((value: string) => boolean) | string[];
			transform?: (value: string) => any;
	  })
	| (ParameterProperties & {
			default: number;
			type?: 'number' | 'float' | 'int' | 'hex';
			valid?: ((value: number) => boolean) | number[];
			transform?: (value: number) => any;
	  })
	| (ParameterProperties & {
			default: boolean;
			type?: 'boolean';
			valid?: ((value: boolean) => boolean) | boolean[];
			transform?: (value: boolean) => any;
	  })
	| (ParameterProperties & {
			default: string[];
			type?: 'string[]' | 'array';
			valid?: ((value: string[]) => boolean) | string[];
			transform?: (value: string[]) => any;
	  })
	| (ParameterProperties & {
			default: number[];
			type?: 'number[]' | 'float[]' | 'int[]' | 'hex[]';
			valid?: ((value: number[]) => boolean) | number[];
			transform?: (value: number[]) => any;
	  })
	| (ParameterProperties & {
			type?: Exclude<
				string,
				| 'boolean'
				| 'string'
				| 'array'
				| 'number'
				| 'float'
				| 'int'
				| 'hex'
				| 'count'
				| 'string[]'
				| 'number[]'
				| 'float[]'
				| 'int[]'
				| 'hex[]'
			>;
			default?: any;
			valid?: ((value: any) => boolean) | any[];
			transform?: (value: any) => any;
	  });

/**
 * Processed config options after configPreprocessing has normalized them
 * Key is required and alias/conflict are arrays
 * Note: valid function accepts any to avoid union narrowing issues
 */
type ParameterFinalConfig =
	| (ParameterFinalProperties & {
			type: 'boolean';
			default?: boolean;
			valid?: ((value: any) => boolean) | boolean[];
			transform?: (value: boolean) => any;
	  })
	| (ParameterFinalProperties & {
			type: 'string' | 'array';
			default?: string | string[];
			valid?: ((value: any) => boolean) | string[];
			transform?: (value: string | string[]) => any;
	  })
	| (ParameterFinalProperties & {
			type: 'number' | 'float' | 'int' | 'hex' | 'count';
			default?: number;
			valid?: ((value: any) => boolean) | number[];
			transform?: (value: number) => any;
	  })
	| (ParameterFinalProperties & {
			type: 'string[]';
			default?: string[];
			valid?: ((value: any) => boolean) | string[];
			transform?: (value: string[]) => any;
	  })
	| (ParameterFinalProperties & {
			type: 'number[]' | 'float[]' | 'int[]' | 'hex[]';
			default?: number[];
			valid?: ((value: any) => boolean) | number[];
			transform?: (value: number[]) => any;
	  })
	| (ParameterFinalProperties & {
			type: string;
			default?: any;
			valid?: ((value: any) => boolean) | any[];
			transform?: (value: any) => any;
	  });

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
	config?: ArgMateConfig,
	settings?: ArgMateSettings
) => {[key: string]: any};

export declare function argMate<const Config extends ArgMateConfig | undefined = undefined>(
	args: string[],
	config?: Config,
	settings?: ArgMateSettings
): ArgMateResponse<Config>;

/**
 * The compiled configuration object returned by configPreprocessing()
 * This is what gets passed to the argEngine functions
 */
export type ArgMateEngineConfig = {
	output: {[key: string]: any};
	mandatory: string[];
	validate: string[];
	conflict: string[];
	complexDefault: {[key: string]: string[] | number[]};
	settings: EngineSettings;
	config: EngineFinalConfig;
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
	? T extends {type: infer Type}
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
														: boolean; // default to boolean if no type or default specified

/**
 * Check if a config field has a default value
 */
type HasDefault<Config> = Config extends {readonly default: any} | {default: any} ? true : false;

/**
 * Check if a config field is mandatory (has mandatory: true flag)
 */
type IsMandatory<Config> = Config extends {readonly mandatory: true} | {mandatory: true}
	? true
	: false;

/**
 * Check if a config field is required (always present in result)
 * A field is required if it has mandatory: true OR has a default value
 */
type IsRequired<Config> = HasDefault<Config> extends true
	? true
	: IsMandatory<Config> extends true
		? true
		: false;

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
