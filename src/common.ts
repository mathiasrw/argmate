export const re = {
	isCamel: /[a-z0-9][A-Z]/u,
	isKebab: /\w-\w+/u,
	camel2kebab: /([a-z0-9]|(?=[A-Z]))([A-Z])/gu,
	kebab2camel: /-+([^-])|-+$/g,
	isArrayType: /(^array|\[\])$/,
	validTypes: /^((array|count)|(boolean|string|number|float|int|hex)(\[\])?)$/,
	paramTokens:
		/^(?<STOP>--)$|^-(?<LONG>-+)?(?<NO>no-)?(?<KEY>[^=\s]+?)(?<KEYNUM>[\d]*)(?<ASSIGN>=(?<VAL>.*))?$/su,
	listDeviders: /[,\s]+-?-?|^--?/,
	hasSpace: /\s/,
	hasNonAscii: /[\u0080-\uFFFF]/,
	graphemes:
		/[\u{1F1E6}-\u{1F1FF}]{2}|[^\u200D](?:[\u0300-\u036F\u20D0-\u20FF\uFE00-\uFE0F\u{1F3FB}-\u{1F3FF}\u{E0020}-\u{E007F}]|\u200D[^\u200D])*|./gsu,
	isHex: /^(0x)?[A-Fa-f0-9]+$/,
	isHexPrefix: /^(0x)[A-Fa-f0-9]+$/,
	truncate: /^(.{40}).*$/u,
	boolStringTrue: /^(true|yes|on|1)$/i,
	boolStringFalse: /^(false|no|off|0)$/i,
};
