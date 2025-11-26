import {performance} from 'perf_hooks';

const argToPush = 'foobar';

// --- Test Functions ---

function directBracketAccess(iterations) {
	const output = {_: []};
	for (let i = 0; i < iterations; i++) {
		output['_'].push(argToPush);
	}
}

function directDotAccess(iterations) {
	const output = {_: []};
	for (let i = 0; i < iterations; i++) {
		output._.push(argToPush);
	}
}

function preBoundBracketAccess(iterations) {
	const output = {_: []};
	const addArgument = output['_'].push.bind(output['_']);
	for (let i = 0; i < iterations; i++) {
		addArgument(argToPush);
	}
}

function preBoundDotAccess(iterations) {
	const output = {_: []};
	const addArgument = output._.push.bind(output._);
	for (let i = 0; i < iterations; i++) {
		addArgument(argToPush);
	}
}

function cachedArrayReference(iterations) {
	const output = {_: []};
	const targetArray = output._;
	for (let i = 0; i < iterations; i++) {
		targetArray.push(argToPush);
	}
}

function cachedArrayReferenceTmpVal(iterations) {
	const output = {_: []};
	const tmpVal = output._;
	for (let i = 0; i < iterations; i++) {
		tmpVal.push(argToPush);
	}
}

// NEW: Your first suggestion is added here.
function cachedArrayAndMethodWithCall(iterations) {
	const output = {_: []};
	const targetArray = output._; // Cache the array
	const pushMethod = targetArray.push; // Cache the method
	for (let i = 0; i < iterations; i++) {
		// Use .call() with the cached array as context
		pushMethod.call(targetArray, argToPush);
	}
}

// --- Benchmark Setup ---

const ITERATIONS = 90_000_000;
const WARMUP_ITERATIONS = 10_000;

const methods = {
	'output["_"].push(arg)': directBracketAccess,
	'output._.push(arg)': directDotAccess,
	'addArgument = output["_"].push.bind(...)': preBoundBracketAccess,
	'addArgument = output._.push.bind(...)': preBoundDotAccess,
	'targetArray = output._; targetArray.push(arg)': cachedArrayReference,
	'tmpVal = output._; tmpVal.push(arg)': cachedArrayReferenceTmpVal,
	'target = o._; fn = t.push; fn.call(t, arg)': cachedArrayAndMethodWithCall, // Added!
};

// --- GLOBAL WARM-UP PHASE ---
console.log('Starting global warm-up phase...');
for (const method of Object.values(methods)) {
	method(WARMUP_ITERATIONS);
}
console.log('Warm-up complete. Starting benchmark.\n');

// --- MEASUREMENT PHASE ---
console.log(`Comparing array push performance...`);
console.log(`Iterations: ${ITERATIONS.toLocaleString()}\n`);

for (const [name, method] of Object.entries(methods)) {
	const start = performance.now();
	method(ITERATIONS);
	const end = performance.now();
	const timeTaken = end - start;

	console.log(`${name.padEnd(50, ' ')}: ${timeTaken.toFixed(2)} ms`);
}
