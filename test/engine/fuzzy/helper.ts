// The fuzz tests make random input from a seed, so a run can be repeated. Each case has its own seed: the seed of
// the run plus the number of the case. A case that fails says the command that repeats only that case.
//   FUZZ_SEED    the seed of the run. Default: a new random seed each run.
//   FUZZ_ROUNDS  how many cases each test runs. Default: 1000.

const runSeed = Number(process.env.FUZZ_SEED) || Math.floor(Math.random() * 0x7fffffff);
const rounds = Number(process.env.FUZZ_ROUNDS) || 1000;

export type Random = ReturnType<typeof random>;

// mulberry32, as in ../rexreplace: small, fast and the same on every runtime
export function random(seed: number) {
	let state = seed | 0;
	const next = () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
	const pick = <T>(list: readonly T[]): T => list[int(0, list.length - 1)];
	return {
		next,
		int,
		pick,
		chance: (p: number) => next() < p,
		// A text of characters from the string; an emoji counts as one character
		text: (chars: string, min: number, max: number) => {
			const all = [...chars];
			let text = '';
			for (let i = int(min, max); i; i--) text += pick(all);
			return text;
		},
		shuffle: <T>(list: T[]): T[] => {
			for (let i = list.length - 1; 0 < i; i--) {
				const j = int(0, i);
				[list[i], list[j]] = [list[j], list[i]];
			}
			return list;
		},
	};
}

// Runs `check` for each case with its own random generator. `check` throws when a rule does not hold; the error
// then gets what the case was and the command that runs it again.
export function fuzz(name: string, check: (rnd: Random, show: (what: object) => void) => void) {
	for (let i = 0; i < rounds; i++) {
		const seed = runSeed + i;
		let shown = {};
		try {
			check(random(seed), what => {
				shown = what;
			});
		} catch (err) {
			const again = `FUZZ_SEED=${seed} FUZZ_ROUNDS=1 bun test ./test/engine/fuzzy -t '${name}'`;
			const message = (err as Error).message;
			throw new Error(
				`${message}\n\nThe case:\n${show(shown)}\n\nRun this case again:\n  ${again}\n\nRun all with this seed:\n  FUZZ_SEED=${runSeed} bun run test-fuzzy\n`
			);
		}
	}
}

// The case as text: the args as a shell would take them, and the rest as JSON
const show = (what: object) =>
	Object.entries(what)
		.map(([key, value]) => `  ${key}: ${'args' === key ? quote(value) : JSON.stringify(value)}`)
		.join('\n');

const quote = (args: string[]) =>
	args.map(arg => "'" + arg.replaceAll("'", "'\\''") + "'").join(' ');
