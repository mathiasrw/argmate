export const re = {
	kebab: /([a-z0-9]|(?=[A-Z]))([A-Z])/g,
	camel: /-+([^-])|-+$/g,
	arrayType: /array|string\[\]|number\[\]|int\[\]|float\[\]|hex\[\]/,
	paramTokens:
		/^(?<STOP>--)$|^-(?<LONG>-+)?(?<NO>no-)?(?<KEY>[^=\s]+?)(?<KEYNUM>[\d]*)(?<ASSIGN>=(?<VAL>.*))?$/,
};
