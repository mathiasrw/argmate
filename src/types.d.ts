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
				default?: any;
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
	camelCaseUnknown?: boolean;
	allowNegatingFlags?: boolean;
	allowKeyNumValues?: boolean;
	kebabCaseAsAlias?: boolean;
	intro?: IntroOutroType;
	outro?: IntroOutroType;
}

export interface ArgMateHelpTextConfig {
	width?: number;
	format?: 'cli' | 'markdown';
	voidIntro?: boolean;
	voidOutro?: boolean;
}
