import {performance} from 'perf_hooks';

function toStringUsingString(param) {
	return String(param);
}

function toStringUsingToString(param) {
	return param?.toString() ?? String(param);
}

function toStringUsingConcatenation(param) {
	return param + '';
}

function toStringUsingConcatenation2(param) {
	return '' + param;
}

function toStringUsingTemplateLiteral(param) {
	return `${param}`;
}

function measurePerformance(fn, param, iterations = 100000000) {
	// Warm-up phase
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

const testCases = [42, true, null, [1, 2, 3], {key: 'value'}, 'already a string'];

const methods = {
	'String(param)': toStringUsingString,
	'param?.toString()': toStringUsingToString,
	'param + ""': toStringUsingConcatenation,
	'"" + param': toStringUsingConcatenation2,
	'`${param}`': toStringUsingTemplateLiteral,
};

for (const param of testCases) {
	console.log(`\nTesting with param: ${String(param)}`);
	for (const [name, method] of Object.entries(methods)) {
		const timeTaken = measurePerformance(method, param);
		console.log(`${name}: ${timeTaken.toFixed(2)} ms`);
	}
}
