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

export interface ArgMateParamInfoConfig {
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

type ParserObj = void | {
	mandatory: string[];
	validate: string[];
	complexDefault: {[key: string]: string[] | number[]};
	output: {[key: string]: any};
	conf: ArgMateConfigMandatory;
	params: ArgMateParams;
};

export function configPrep(
	params: ArgMateParams,
	conf: ArgMateConfigMandatory,
	precompile: boolean
): ParserObj | string;

export function paramEngine(params: ParserObj): {[key: string]: any};

export function paramInfo(
	settings: ArgMateParamInfoConfig,
	conf?: ArgMateConfig,
	params?: ArgMateParams
): string;
