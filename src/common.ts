export const re = {
	isCamel: /[a-z0-9][A-Z]/u,
	isKebab: /\w-\w+/u,
	camel2kebab: /([a-z0-9]|(?=[A-Z]))([A-Z])/gu,
	kebab2camel: /-+([^-])|-+$/g,
	isArrayType: /(^array|\[\])$/,
	validTypes: /^((array|count|json|split)|(boolean|string|number|float|int|hex)(\[\])?)$/,
	paramTokens:
		/^(?<STOP>--)$|^-(?<LONG>-+)?(?<NO>no-)?(?<KEY>[^=\s]+?)(?<KEYNUM>[\d]*)(?<ASSIGN>=(?<VAL>.*))?$/u,
	listDeviders: /[,\s]+-?-?|^--?/,
	isHex: /^(0x)?[A-Fa-f0-9]+$/,
	isHexPrefix: /^(0x)[A-Fa-f0-9]+$/,
	truncate: /^(.{40}).*$/u,
	boolStringTrue: /^(true|yes|on)$/i,
	boolstringfalse: /^(false|no|off)$/i,
};
