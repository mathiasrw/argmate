export const median = list => {
	const sorted = list.slice().sort((a, b) => a - b);
	const mid = sorted.length >> 1;
	return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const resample = list => list.map(() => list[(Math.random() * list.length) | 0]);

// How much faster mini is than full, in % of full, with a 95 % bootstrap interval of the difference of the medians.
// Positive: mini is faster.
export function saving(full, mini) {
	const of = (f, m) => (1 - median(m) / median(f)) * 100;
	const boot = [];
	for (let i = 0; i < 2000; i++) boot.push(of(resample(full), resample(mini)));
	boot.sort((a, b) => a - b);
	return {pct: of(full, mini), low: boot[50], high: boot[1949]};
}

export const pct = ({pct, low, high}) =>
	`${pct.toFixed(1)} % (${low.toFixed(1)} to ${high.toFixed(1)})`;

// The difference of the medians, a - b, with a 95 % bootstrap interval.
export function difference(a, b) {
	const boot = [];
	for (let i = 0; i < 2000; i++) boot.push(median(resample(a)) - median(resample(b)));
	boot.sort((x, y) => x - y);
	return {value: median(a) - median(b), low: boot[50], high: boot[1949]};
}

// A time as a factor of the time of argmate/mini: 1.000× is the same, 2.000× is two times slower.
export const relative = (value, base) => {
	const x = value / base;
	return (x < 10 ? x.toFixed(3) : x < 100 ? x.toFixed(1) : x.toFixed(0)) + '×';
};
