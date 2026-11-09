// 3D: the smallest step of each timer. node timer-check.js, bun timer-check.js
const smallest = read => {
	let min = Infinity;
	for (let i = 0; i < 100000; i++) {
		const a = read();
		let b = read();
		while (b === a) b = read();
		min = Math.min(min, Number(b - a));
	}
	return min;
};
const hr = process.hrtime.bigint;
console.log(
	typeof Bun === 'undefined' ? 'node' : 'bun',
	'performance.now:',
	(smallest(() => performance.now()) * 1e6).toFixed(0),
	'ns, process.hrtime.bigint:',
	smallest(() => hr()),
	'ns'
);
