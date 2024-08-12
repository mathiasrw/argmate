export const re = {
	isCamel: /[a-z0-9][A-Z]/,
	isKebab: /\w-\w+/,
	camel2kebab: /([a-z0-9]|(?=[A-Z]))([A-Z])/g,
	kebab2camel: /-+([^-])|-+$/g,
	isArrayType: /(^array|\[\])$/,
	validTypes: /^((array|count)|(boolean|string|number|float|int|hex)(\[\])?)$/,
	paramTokens:
		/^(?<STOP>--)$|^-(?<LONG>-+)?(?<NO>no-)?(?<KEY>[^=\s]+?)(?<KEYNUM>[\d]*)(?<ASSIGN>=(?<VAL>.*))?$/,
	listDeviders: /[,\s]+-?-?|^--?/,
	isHex: /^(0x)?[A-Fa-f0-9]+$/,
	isHexPrefix: /^(0x)[A-Fa-f0-9]+$/,
};
