// The prototype of an error object (item 48): in a string, the object is its message, as the error was before
export const asText = {
	toString(this: {message: string}) {
		return this.message;
	},
};

export const re = {
	isCamel: /[a-z0-9][A-Z]/u,
	isKebab: /[^-]-[^-]/u,
	kebab2camel: /-(.)/gsu,
	camel2kebab: /([a-z0-9]|(?=[A-Z]))([A-Z])/gu,
	isArrayType: /(^array|\[\])$/,
	noValue: /^(boolean(\[\])?|count)$/,
	validTypes: /^((array|count)|(boolean|string|number|float|int|hex)(\[\])?)$/,
	paramLong:
		/^(?<STOP>--)$|^-(?<LONG>-)(?<NO>no-)?(?<KEY>[^=\s-]+(?:-[^=\s-]+)*)(?:(?<ASSIGN>=)|$)/u,
	paramShort: /^-(?<KEY>[^=\s-](?:[^=\s-]*?[^=\s\d-])?)(?<KEYNUM>\d*)(?:(?<ASSIGN>=)|$)/u,
	notParam: /\s|^--?(?:=|$)/,
	bool: /^bool(\[\])?$/,
	onDisk: /^(file|folder|path)(\[\]|)$/,
	numberish: /^-[\d.](?![\uFE0F\u20E3])[^=]*$/,
	autoNumber: /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/,
	hasDigit: /\d(?![\uFE0F\u20E3])/,
	onlyDigits: /^\d+$/,
	keyNum: /^(.*?\D|.)(\d+)$/su,
	listDeviders: /[,\s]+-?-?|^--?/,
	hasSpace: /\s/,
	hasNonAscii: /[\u0080-\uFFFF]/,
	graphemes:
		/[\u{1F1E6}-\u{1F1FF}]{2}|[^\u200D](?:[\u0300-\u036F\u20D0-\u20FF\uFE00-\uFE0F\u{1F3FB}-\u{1F3FF}\u{E0020}-\u{E007F}]|\u200D[^\u200D])*|./gsu,
	isHex: /^-?(0x)?[A-Fa-f0-9]+$/,
	isHexPrefix: /^(0x)[A-Fa-f0-9]+$/,
	truncate: /^(.{40}).*$/u,
	boolStringTrue: /^(true|yes|on|1)$/i,
	boolStringFalse: /^(false|no|off|0|)$/i,
};

// ParamToken:  /^(?<STOP>--)$|^-(?<LONG>-+)?(?<NO>no-)?(?<KEY>[^=\s]+?)(?<KEYNUM>[\d]*)(?<ASSIGN>=(?<VAL>.*))?$/su, // A) ori
// ParamToken:  /^(?<STOP>--)$|^-(?<LONG>-)?(?<NO>no-)?(?<KEY>[^=\s-](?:[^=\s]*?[^=\s\d-])?)(?<KEYNUM>\d*)(?<ASSIGN>=(?<VAL>.*))?$/su, // ) Faster and without too much back propegation, but missing edgecases like keys ending in numbers
// Splitting long and short turned out to be the best way to nail all edgecases.

/*
| Scenario                       | v0.8        | v1      | v1 mini |v0.8 mini|
|--------------------------------|-------------|---------|---------|---------|
| typical: 5 flags, 3 str, 2 num |       1.96x |   1.27x |   1.00x |   1.13x |
| 500 params                     |       1.92x |   1.33x |   1.00x |   1.50x |
| long data: 3 x 200KB values    |      68.98x |   1.56x |   1.00x |   1.12x |
| 5000 short groups (-abc)       |       2.71x |   1.62x |   1.00x |   9.87x |
| digits trap n=2000             |    7282.80x |   9.21x |   1.00x |   1.06x |
| digits trap n=8000             |   74798.10x |  21.45x |   1.00x |   1.08x |
| digits trap n=32000            |  490291.26x |  34.52x |   1.00x |   1.13x |
*/

// The type of a default value, for a parameter with no type
/** #__PURE__ */ export function findType(val: any): string | undefined {
	if (val === null || val === undefined) return undefined;

	if (Array.isArray(val)) {
		return (
			(val.length && val.every(v => typeof v === typeof val[0]) ? findType(val[0]) : 'string') +
			'[]'
		);
	}

	switch (typeof val) {
		case 'boolean':
		case 'number':
			return typeof val;
		default:
			return 'string';
	}
}
