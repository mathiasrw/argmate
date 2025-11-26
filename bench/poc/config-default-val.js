import {performance} from 'perf_hooks';

// --- SHARED SETUP ---
// Define the default configuration object once to be fair to both methods.
const defaultConfig = {
	output: {_: []},
	validate: [],
	mandatory: [],
	conflict: [],
	complexDefault: {},
	config: {},
	settings: {
		error: msg => {
			throw new Error(msg);
		},
		panic: msg => {
			throw new Error(msg);
		},
		allowUnknown: true,
		autoCamelKebabCase: true,
		allowNegatingFlags: true,
		allowKeyNumValues: true,
		allowAssign: true,
		outputAlias: false,
	},
};

// --- TEST FUNCTIONS ---

/**
 * Method 1: ES6 Destructuring with Defaults.
 * This will throw an error if inputConfig is null or undefined,
 * so we guard it with `|| {}`.
 */
function testDestructuring(iterations, inputConfig) {
	for (let i = 0; i < iterations; i++) {
		const {
			output = defaultConfig.output,
			validate = defaultConfig.validate,
			mandatory = defaultConfig.mandatory,
			conflict = defaultConfig.conflict,
			complexDefault = defaultConfig.complexDefault,
			config = defaultConfig.config,
			settings = defaultConfig.settings,
		} = inputConfig || {}; // The actual operation being benchmarked
	}
}

/**
 * Method 2: Classic Logical OR Assignment.
 * This assigns the entire default object if the input is falsy.
 */
function testLogicalOr(iterations, inputConfig) {
	for (let i = 0; i < iterations; i++) {
		let argProcessObj = inputConfig; // Reset for each iteration
		argProcessObj = argProcessObj || defaultConfig; // The operation being benchmarked
	}
}

// --- BENCHMARK RUNNER ---

const ITERATIONS = 20_000_000;
const WARMUP_ITERATIONS = 10_000;

const methods = {
	'ES6 Destructuring': testDestructuring,
	'Logical OR (||)': testLogicalOr,
};

function runBenchmark(scenarioName, inputForScenario) {
	console.log(`\n--- ${scenarioName} ---`);
	console.log(`Comparing performance for initializing config objects...`);

	// Warm-up phase for this specific scenario
	for (const method of Object.values(methods)) {
		method(WARMUP_ITERATIONS, inputForScenario);
	}

	// Measurement phase
	for (const [name, method] of Object.entries(methods)) {
		const start = performance.now();
		method(ITERATIONS, inputForScenario);
		const end = performance.now();
		const timeTaken = end - start;
		console.log(`${name.padEnd(20, ' ')}: ${timeTaken.toFixed(2)} ms`);
	}
}

// --- SCENARIOS ---

// Scenario 1: No config is passed, so defaults must be generated.
runBenchmark('Scenario 1: Input is UNDEFINED (Defaulting Path)', undefined);

// Scenario 2: A valid config is passed, so defaults should be ignored.
const providedConfig = {
	output: {_: ['some-value']},
	settings: {allowUnknown: false},
};
runBenchmark('Scenario 2: Input is PROVIDED (Non-Defaulting Path)', providedConfig);
