import {performance} from 'perf_hooks';

// --- TEST FUNCTIONS ---

function testGlobalIsNaN(iterations, valueToTest) {
	// Prevents dead code elimination by ensuring a result is used.
	let result = false;
	for (let i = 0; i < iterations; i++) {
		result = isNaN(valueToTest);
	}
	return result;
}

function testNumberIsNaN(iterations, valueToTest) {
	let result = false;
	for (let i = 0; i < iterations; i++) {
		result = Number.isNaN(valueToTest);
	}
	return result;
}

// --- BENCHMARK RUNNER ---

const ITERATIONS = 100_000_000;
const WARMUP_ITERATIONS = 10_000;

const methods = {
	'Global isNaN()': testGlobalIsNaN,
	'Number.isNaN()': testNumberIsNaN,
};

function runBenchmark(scenarioName, valueToTest) {
	console.log(`\n--- ${scenarioName} ---`);
	console.log(`Input value: ${String(valueToTest)} (type: ${typeof valueToTest})`);

	// Warm-up phase for this specific scenario
	for (const method of Object.values(methods)) {
		method(WARMUP_ITERATIONS, valueToTest);
	}

	// Measurement phase
	for (const [name, method] of Object.entries(methods)) {
		const start = performance.now();
		method(ITERATIONS, valueToTest);
		const end = performance.now();
		const timeTaken = end - start;
		console.log(`${name.padEnd(16, ' ')}: ${timeTaken.toFixed(2)} ms`);
	}
}

// --- SCENARIOS ---

console.log('Comparing performance of isNaN() vs Number.isNaN()');

// Scenario 1: The ideal case for both. A simple number.
runBenchmark('Scenario 1: Input is a Number', 42);

// Scenario 2: The exact value they are meant to find.
runBenchmark('Scenario 2: Input is NaN', NaN);

// Scenario 3: A string that requires coercion for the global isNaN.
// This should show a significant performance difference.
runBenchmark('Scenario 3: Input is a non-numeric String', 'hello world');

// Scenario 4: An object, which also requires coercion.
runBenchmark('Scenario 4: Input is an Object', {});

// Scenario 5: Undefined, another classic coercion case.
runBenchmark('Scenario 5: Input is undefined', undefined);
