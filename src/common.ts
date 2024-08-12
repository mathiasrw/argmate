export const re = {
	camel: /([a-z0-9]|(?=[A-Z]))([A-Z])/g,
	kebab: /-+([^-])|-+$/g,
	isKebab: /.-.+/,
	isArrayType: /(^array|\[\])$/,
	validTypes: /^((array|count)|(boolean|string|number|float|int|hex)(\[\])?)$/,
	paramTokens:
		/^(?<STOP>--)$|^-(?<LONG>-+)?(?<NO>no-)?(?<KEY>[^=\s]+?)(?<KEYNUM>[\d]*)(?<ASSIGN>=(?<VAL>.*))?$/,
	listDeviders: /[,\s]+/,
};
