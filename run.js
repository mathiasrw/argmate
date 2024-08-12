import {performance} from 'perf_hooks';

// Function to generate random values, some of which will be arrays and some not
function generateRandomValues(count) {
	const values = [];
	for (let i = 0; i < count; i++) {
		const isArray = Math.random() > 0.5; // 50% chance to be an array
		if (isArray) {
			values.push([Math.random(), Math.random(), Math.random()]);
		} else {
			const notArray = Math.random() > 0.5 ? {} : Math.random();
			values.push(notArray);
		}
	}
	return values;
}

// Function to test Array.isArray
function arrayIsArrayMethod(values) {
	return values.map(value => Array.isArray(value));
}

// Function to test !!values.pop method
function popMethod(values) {
	return values.map(value => !!(value && value.pop));
}

function warmup(fn, values, iterations = 10000) {
	for (let i = 0; i < iterations; i++) {
		const randomValues = generateRandomValues(values.length);
		fn(randomValues);
	}
}

function measurePerformance(fn, values, iterations = 1000000) {
	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		const randomValues = generateRandomValues(values.length);
		fn(randomValues);
	}
	const end = performance.now();
	return end - start;
}

const warmupIterations = 10000;
const testIterations = 1000000;
const testArray = generateRandomValues(100);

// Warmup and Test for Array.isArray Method
console.log(`Warming up Array.isArray method...`);
warmup(arrayIsArrayMethod, testArray, warmupIterations);

console.log(`Testing Array.isArray method...`);
const arrayTime = measurePerformance(arrayIsArrayMethod, testArray, testIterations);
console.log(`Array.isArray method took ${arrayTime.toFixed(2)}ms`);

// Warmup and Test for !!values.pop Method
console.log(`Warming up !!values.pop method...`);
warmup(popMethod, testArray, warmupIterations);

console.log(`Testing !!values.pop method...`);
const popTime = measurePerformance(popMethod, testArray, testIterations);
console.log(`!!values.pop method took ${popTime.toFixed(2)}ms`);

// Comparing Results
if (arrayTime < popTime) {
	console.log('Array.isArray is faster.');
} else {
	console.log('!!values.pop is faster.');
}
