import {performance} from 'perf_hooks';

// Function to generate a random array of 1 to 9 elements
function generateRandomArray() {
	const arraySize = Math.floor(Math.random() * 9) + 1; // 1 to 9 elements
	return Array.from({length: arraySize}, () => Math.random());
}

// Function to test .concat method
function concatMethod() {
	const array1 = generateRandomArray();
	const array2 = generateRandomArray();
	return array1.concat(array2);
}

// Function to test spread (...) notation
function spreadMethod() {
	const array1 = generateRandomArray();
	const array2 = generateRandomArray();
	return [...array1, ...array2];
}

// Function to test spread with .push() method
function pushSpreadMethod() {
	const array1 = generateRandomArray();
	const array2 = generateRandomArray();
	const result = [...array1]; // Start with a copy of array1
	result.push(...array2);
	return result;
}

function warmup(fn, iterations = 10000) {
	for (let i = 0; i < iterations; i++) {
		fn(); // Call the function without arguments
	}
}

function measurePerformance(fn, iterations = 1000000) {
	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		fn(); // Call the function without arguments
	}
	const end = performance.now();
	return end - start;
}

const warmupIterations = 10000;
const testIterations = 1000000;

// Warmup and Test for .concat Method
console.log(`Warming up .concat method...`);
warmup(concatMethod, warmupIterations);

console.log(`Testing .concat method...`);
const concatTime = measurePerformance(concatMethod, testIterations);
console.log(`.concat method took ${concatTime.toFixed(2)}ms`);

// Warmup and Test for spread (...) notation Method
console.log(`Warming up spread (...) notation method...`);
warmup(spreadMethod, warmupIterations);

console.log(`Testing spread (...) notation method...`);
const spreadTime = measurePerformance(spreadMethod, testIterations);
console.log(`Spread (...) notation method took ${spreadTime.toFixed(2)}ms`);

// Warmup and Test for spread with .push() Method
console.log(`Warming up spread with .push() method...`);
warmup(pushSpreadMethod, warmupIterations);

console.log(`Testing spread with .push() method...`);
const pushSpreadTime = measurePerformance(pushSpreadMethod, testIterations);
console.log(`Spread with .push() method took ${pushSpreadTime.toFixed(2)}ms`);

// Comparing Results
const times = {
	'.concat': concatTime,
	'spread (...) notation': spreadTime,
	'spread with .push()': pushSpreadTime,
};

for (const [method, time] of Object.entries(times)) {
	console.log(`${method} method took ${time.toFixed(2)}ms`);
}

const fastestMethod = Object.keys(times).reduce((a, b) => (times[a] < times[b] ? a : b));

console.log(`${fastestMethod} is the fastest method.`);
