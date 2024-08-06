export interface ArgMateParams {
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

export interface ArgMateConfig {
	error?: (msg: string) => void;
	strict?: boolean;
	allowUnknown?: boolean;
	autoCamelKebabCase?: boolean;
	allowNegatingFlags?: boolean;
	allowKeyNumValues?: boolean;
	allowAssign?: boolean;
	intro?: IntroOutroType;
	outro?: IntroOutroType;
}

export interface ArgMateConfigMandatory extends ArgMateConfig {
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

export default function argMate(
	args: string[],
	params?: ArgMateParams,
	conf?: ArgMateConfig
): {[key: string]: any};

type ArgProcessObj = void | {
	output: {[key: string]: any};
	mandatory: string[];
	validate: string[];
	complexDefault: {[key: string]: string[] | number[]};
	conf: ArgMateConfigMandatory;
	params: ArgMateParams;
};

export function configPrep(
	params: ArgMateParams,
	conf: ArgMateConfigMandatory,
	precompile: boolean
): ArgProcessObj | string;

export function argEngine(params: ArgProcessObj): {[key: string]: any};

export function argInfo(
	settings: ArgMateArgInfoConfig,
	conf?: ArgMateConfig,
	params?: ArgMateParams
): string;
