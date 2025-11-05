export interface ArgMateConfig {
	[key: string]:
		| {
				type?:
					| 'boolean'
					| 'string'
					| 'number'
					| 'float'
					| 'int'
					| 'count'
					| 'hex'
					| 'array'
					| 'string[]'
					| 'number[]'
					| 'float[]'
					| 'int[]'
					| 'hex[]';
				default?: string | number | string[] | number[];
				mandatory?: boolean;
				alias?: string | string[];
				conflict?: string | string[];
				valid?: (value: any) => boolean | string[] | number[];
				describe?: string;
		  }
		| null
		| string[]
		| number[]
		| Exclude<any, object>;
}

type IntroOutroType = string | (string | [string, string])[];

export interface ArgMateSettings {
	panic?: (msg: string) => void;
	error?: (msg: string) => void;
	strict?: boolean;
	allowUnknown?: boolean;
	autoCamelKebabCase?: boolean;
	allowNegatingFlags?: boolean;
	allowKeyNumValues?: boolean;
	allowAssign?: boolean;
	allowBoolString?: boolean;
	outputAlias?: boolean;
	outputInflate?: boolean;
	intro?: IntroOutroType;
	outro?: IntroOutroType;

	//	'dot-notation': false,
	//  'boolean-negation': false
}

export interface ArgMateSettingsMandatory extends ArgMateSettings {
	error: (msg: string) => void;
	panic: (msg: string) => void;
}

export interface ArgMateArgInfoConfig {
	width?: number;
	format?: 'cli' | 'markdown' | 'json';
	preIntro?: IntroOutroType;
	showIntro?: boolean;
	showOutro?: boolean;
	postOutro?: IntroOutroType;
}

export type ArgMateEngine = (
	args: string[],
	config?: ArgMateConfig,
	settings?: ArgMateSettings
) => {[key: string]: any};

export default function argMate(
	args: string[],
	config?: ArgMateConfig,
	settings?: ArgMateSettings
): {[key: string]: any};

type ArgProcessObj = void | {
	output: {[key: string]: any};
	mandatory: string[];
	validate: string[];
	conflict: string[];
	complexDefault: {[key: string]: string[] | number[]};
	settings: ArgMateSettingsMandatory;
	config: ArgMateConfig;
};

export function compileConfig(
	config: ArgMateConfig,
	settings: ArgMateSettingsMandatory,
	precompile: boolean
): ArgProcessObj | string;

export function argEngine(config: ArgProcessObj): {[key: string]: any};

export function formatArgInfo(
	infoConfig: ArgMateArgInfoConfig,
	settings: ArgMateSettings,
	config: ArgMateConfig
): string;

export function argInfo(
	infoConfig: ArgMateArgInfoConfig,
	settings?: ArgMateSettings,
	config?: ArgMateConfig
): string;
