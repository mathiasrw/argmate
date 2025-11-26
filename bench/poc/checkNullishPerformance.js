import {performance} from 'perf_hooks';

// --- Methods to Test ---

function checkWithIncludes(value) {
	// The original method from the pull request
	return [null, undefined].includes(value);
}

function checkWithLooseEquality(value) {
	// The recommended, idiomatic alternative
	return value == null;
}

function checkWithStrictEquality(value) {
	// The verbose but explicit alternative
	return value === null || value === undefined;
}

// It's also interesting to test the inverse check
function checkWithLooseInequality(value) {
	return value != null;
}

// --- Test Harness (inspired by your file) ---

function measurePerformance(fn, param, iterations = 100000000) {
	// Warm-up phase to allow the JIT compiler to optimize
	for (let i = 0; i < 10000; i++) {
		fn(param);
	}

	// Actual performance measurement
	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		fn(param);
	}
	const end = performance.now();
	return end - start;
}

// --- Test Execution ---

const testCases = [
	null, // The primary case
	undefined, // The other primary case
	'some/path/string', // A "truthy" value
	0, // A "falsy" but not nullish value
	'', // Another "falsy" but not nullish value
	{}, // An object
];

const methods = {
	'[null, undefined].includes(v)': checkWithIncludes,
	'v == null': checkWithLooseEquality,
	'v === null || v === undefined': checkWithStrictEquality,
	'v != null (inverse check)': checkWithLooseInequality,
};

console.log(`Running performance tests (${(100_000_000).toLocaleString()} iterations each)...`);

for (const param of testCases) {
	// Use JSON.stringify to clearly show null vs undefined vs empty string
	console.log(`\n--- Testing with param: ${JSON.stringify(param)} ---`);
	for (const [name, method] of Object.entries(methods)) {
		const timeTaken = measurePerformance(method, param);
		// padEnd helps align the output for readability
		console.log(`${name.padEnd(32)}: ${timeTaken.toFixed(2)} ms`);
	}
}
