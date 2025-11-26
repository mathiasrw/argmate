import {performance} from 'perf_hooks';

// --- Constants (Defined once for reuse) ---
const NEEDLE = 'txt()';
const NEEDLE_LENGTH = NEEDLE.length;
// NEW: More robust, case-insensitive regex that allows for whitespace.
const REUSED_REGEX = /txt\s*\(\s*\)/i;

// --- Methods to Test ---

function checkWithOptionalAndCoalesce(haystack) {
	return haystack?.includes(NEEDLE) ?? false;
}

function checkWithLengthGuard(haystack) {
	return haystack?.length >= NEEDLE_LENGTH && haystack.includes(NEEDLE);
}

/** Uses nullish coalescing to provide a default empty string. The regex engine is always invoked. */
function checkWithRegexAndCoalesce(haystack) {
	return REUSED_REGEX.test(haystack ?? '');
}

/** NEW: Uses short-circuiting. Avoids calling .test() entirely if haystack is null, undefined, or ''. */
function checkWithShortCircuitRegex(haystack) {
	// We use !! to ensure the return value is a strict boolean (true/false)
	// because ('' && true) would otherwise result in '', not false.
	return !!(haystack && REUSED_REGEX.test(haystack));
}

// --- Test Harness ---

function measurePerformance(fn, param, iterations = 25_000_000) {
	for (let i = 0; i < 10000; i++) {
		fn(param);
	}
	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		fn(param);
	}
	const end = performance.now();
	return end - start;
}

// --- Generate Long Test Strings ---
const baseString = 'a_very_long_string_that_does_not_contain_the_target_substring_';
const longStringWithoutMatch = baseString.repeat(10);
const longStringWithMatchAtEnd = longStringWithoutMatch + NEEDLE;

// --- Test Execution ---

const testCases = [
	undefined,
	null,
	'This string contains Txt ( ) which the new regex will match.',
	'A long string that does not contain the target.',
	'abc', // A short string that will fail the length guard
	'', // Empty string (will fail short-circuit)
	'txt()', // An exact match
	longStringWithMatchAtEnd, // Worst-case for searching
	longStringWithoutMatch, // Worst-case for searching
];

const methods = {
	's?.includes(n) ?? false': checkWithOptionalAndCoalesce,
	's?.length>=nL && s.includes()': checkWithLengthGuard,
	"regex.test(s ?? '')": checkWithRegexAndCoalesce,
	's && regex.test(s)': checkWithShortCircuitRegex,
};

console.log(
	`Running refined substring tests (${(25_000_000).toLocaleString()} iterations each)...`
);

for (const param of testCases) {
	const paramLabel =
		param === undefined
			? 'undefined'
			: param === null
				? 'null'
				: `"${param.substring(0, 30)}..." (length: ${param.length})`;

	console.log(`\n--- Testing with haystack: ${paramLabel} ---`);

	for (const [name, method] of Object.entries(methods)) {
		const timeTaken = measurePerformance(method, param);
		console.log(`${name.padEnd(32)}: ${timeTaken.toFixed(2)} ms`);
	}
}
