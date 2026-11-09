// The prototype of an error object: in a string, the object is its message, as the error was before
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
	noValue: /^(boolean(\[\])?|count)$/,
	// The groups have no names, and they are in the same places in both regexes: 1 STOP, 2 LONG, 3 NO, 4 KEY,
	// 5 KEYNUM, 6 ASSIGN. A group that the form does not have is empty (the short form has no STOP, LONG and NO,
	// the long form no KEYNUM)
	paramLong: /^(--)$|^-(-)(no-)?([^=\s-]+(?:-[^=\s-]+)*)()(?:(=)|$)/u,
	paramShort: /^-()()()([^=\s-](?:[^=\s-]*?[^=\s\d-])?)(\d*)(?:(=)|$)/u,
	notParam: /\s|^--?(?:=|$)/,
	numberish: /^-[\d.](?![\uFE0F\u20E3])[^=]*$/,
	autoNumber: /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/,
	hasDigit: /\d(?![\uFE0F\u20E3])/,
	onlyDigits: /^\d+$/,
	listDeviders: /[,\s]+-?-?|^--?/,
	hasSpace: /\s/,
	hasNonAscii: /[\u0080-\uFFFF]/,
	graphemes:
		/[\u{1F1E6}-\u{1F1FF}]{2}|[^\u200D](?:[\u0300-\u036F\u20D0-\u20FF\uFE00-\uFE0F\u{1F3FB}-\u{1F3FF}\u{E0020}-\u{E007F}]|\u200D[^\u200D])*|./gsu,
	isHex: /^-?(0x)?[A-Fa-f0-9]+$/,
	isHexPrefix: /^(0x)[A-Fa-f0-9]+$/,
	boolStringTrue: /^(true|yes|on|1)$/i,
	boolStringFalse: /^(false|no|off|0|)$/i,
};

// ParamToken:  /^(?<STOP>--)$|^-(?<LONG>-+)?(?<NO>no-)?(?<KEY>[^=\s]+?)(?<KEYNUM>[\d]*)(?<ASSIGN>=(?<VAL>.*))?$/su, // A) ori
// ParamToken:  /^(?<STOP>--)$|^-(?<LONG>-)?(?<NO>no-)?(?<KEY>[^=\s-](?:[^=\s]*?[^=\s\d-])?)(?<KEYNUM>\d*)(?<ASSIGN>=(?<VAL>.*))?$/su, // ) Faster and without too much back propegation, but missing edgecases like keys ending in numbers
// Splitting long and short turned out to be the best way to nail all edgecases.
//
// C) The split form, with a name for each group. This was `re.paramLong` and `re.paramShort` before the names were
// taken out. The names say what each part is, and the engine read them with `token.groups`. This is a copy of the two
// regexes that were replaced:
//   paramLong:  /^(?<STOP>--)$|^-(?<LONG>-)(?<NO>no-)?(?<KEY>[^=\s-]+(?:-[^=\s-]+)*)(?:(?<ASSIGN>=)|$)/u,
//   paramShort: /^-(?<KEY>[^=\s-](?:[^=\s-]*?[^=\s\d-])?)(?<KEYNUM>\d*)(?:(?<ASSIGN>=)|$)/u,
//
// D) Today, in `re` above: the same two patterns, with the names taken out and the groups in the same places in
// both: 1 STOP, 2 LONG, 3 NO, 4 KEY, 5 KEYNUM, 6 ASSIGN. A group that the form does not have is an empty group. The
// engine reads `token[1]` to `token[6]`. This is harder to read than C. It is there because a match with named groups
// builds a `groups` object for each token, with one property for each group, and the match array exists anyway.
// If you change a group, change the numbers in `argEngine.ts` and in the line above the regexes.
//
// What it gave, measured with the benchmark in `test/performance/finetuning`. Apple M1 Pro, Node v24.22.1 and Bun
// v1.4.3, 2026-11-02. The faster form of a row is 1.00x and the other is its time relative to it. "no change" means
// that the 95 % interval includes zero.
// Workloads: plain is no config, config is 8 parameters, files is 500 tokens that are not parameters, groups is
// booleans and a count, precompiled is an engine config made at build time.
//
// Cold start is the time to load the library and make the first parse in a new process (median of 100 processes).
// A CLI sees this one. The gain is on Bun only (3 rows of 10, 1.04x). On Node there is no change.
//
// Hot is the time of one parse after the same process made many parses (median of 10 rounds of 400 ms). A program that
// parses many times sees this one. The gain is 1.09x - 1.44x in 8 rows of 10. `files` does not change, as its tokens
// are not parameters and the regex does not run for them.

/*
Cold start:
| Runtime | Workload    | Indexed (D) | Named groups (C) | 1.00x is | Outside noise? |
|---------|-------------|------------:|-----------------:|---------:|----------------|
| node    | plain       |       1.00x |            1.01x |  1801 µs | no change      |
| node    | config      |       1.00x |            1.00x |  2306 µs | no change      |
| node    | files       |       1.00x |            1.01x |  2333 µs | no change      |
| node    | groups      |       1.00x |            1.01x |  2029 µs | no change      |
| node    | precompiled |       1.00x |            1.01x |  1494 µs | no change      |
| bun     | plain       |       1.00x |            1.02x |  1867 µs | no change      |
| bun     | config      |       1.00x |            1.04x |  2282 µs | yes            |
| bun     | files       |       1.00x |            1.01x |  2382 µs | no change      |
| bun     | groups      |       1.00x |            1.04x |  2123 µs | yes            |
| bun     | precompiled |       1.00x |            1.04x |  1456 µs | yes            |

Hot:
| Runtime | Workload    | Indexed (D) | Named groups (C) | 1.00x is | Outside noise? |
|---------|-------------|------------:|-----------------:|---------:|----------------|
| node    | plain       |       1.00x |            1.30x |  2054 ns | yes            |
| node    | config      |       1.00x |            1.15x |  6656 ns | yes            |
| node    | files       |       1.00x |            1.02x | 29735 ns | no change      |
| node    | groups      |       1.00x |            1.24x |  4240 ns | yes            |
| node    | precompiled |       1.00x |            1.44x |  2300 ns | yes            |
| bun     | plain       |       1.00x |            1.21x |  1420 ns | yes            |
| bun     | config      |       1.00x |            1.16x |  2965 ns | yes            |
| bun     | files       |       1.00x |            1.02x | 10754 ns | no change      |
| bun     | groups      |       1.00x |            1.09x |  2955 ns | yes            |
| bun     | precompiled |       1.00x |            1.26x |  1630 ns | yes            |
*/

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
