# Does it cost speed to share engine code through functions?

The two engines have the same logic in many places. The code is written two times, because a call to a function in another file was thought to cost speed. This test measures that cost.

## The variants

All variants are the full engine and give the same result. `check.ts` compares them for 6336 combinations of input, config and settings.

| Variant | What it is | Minified | gzip |
|---|---|---:|---:|
| `now` | `src/argEngine.ts` as it is: one function | 4990 | 2296 |
| `this` | Each functionality is a function. The state of the parse is `this` (`decode.call(state)`), so no arguments | 7953 | 2774 |
| `param` | The same functions, but the state is their one argument (`decode(state)`) | 7313 | 2749 |
| `tail` | The loop is the code of `now`. Only the phases after the loop are functions (defaults, validate, transform, mandatory, conflict). They run one time for each parse | 5309 | 2417 |
| `hot` | The same as `tail`, and the number conversion in the loop is a function also | 5336 | 2431 |

`this` and `param` are larger because the minifier cannot give short names to the properties of the state object (`this.parameterConfig` stays as it is). A local variable becomes one letter.

## Hot: 200000 parses in one process

`hyperfine`, 2 passes of 12 runs, the second pass with the variants in the opposite sequence. The machine had other work, so the table has the fastest run of the 24. The means are in `../results/engine-sharing/hyperfine.md`.

Workload `config`: 16 arguments, a config with 8 parameters. Workload `plain`: 9 arguments, no config.

| Difference to `now` | `this` | `param` | `tail` | `hot` |
|---|---:|---:|---:|---:|
| Bun 1.3.11, `config` | +2.3 % | +2.7 % | -0.3 % | -0.6 % |
| Bun 1.3.11, `plain` | +0.3 % | 0.0 % | -0.9 % | -1.1 % |
| Node 20.20, `config` | +12.1 % | +3.7 % | +0.4 % | -1.0 % |
| Node 20.20, `plain` | +11.3 % | -0.2 % | +0.4 % | +1.3 % |

A difference of 1 % or less is noise.

## Cold: one parse in one process

This is what a CLI does. The code is new to the runtime, so it runs with no optimization.

`hyperfine` on the full process (300 runs) cannot see a difference: the process takes 11 ms (Bun) or 26 ms (Node), and the deviation is 2 to 5 ms.

`cold.js` measures inside the process: the time to load the engine file, and the time of the first parse. The table has the median of 200 processes for each variant. Two copies of `now` differ by 7 µs or less in this test.

| Load + first parse | `now` | `this` | `param` | `tail` | `hot` |
|---|---:|---:|---:|---:|---:|
| Bun, `config` | 1097 µs | 1361 µs (+24 %) | 1331 µs (+21 %) | 1194 µs (+9 %) | 1222 µs (+11 %) |
| Bun, `plain` | 1157 µs | 1307 µs (+13 %) | 1302 µs (+13 %) | 1258 µs (+9 %) | 1253 µs (+8 %) |
| Node, `config` | 839 µs | 1013 µs (+21 %) | 1012 µs (+21 %) | 880 µs (+5 %) | 886 µs (+6 %) |
| Node, `plain` | 959 µs | 1040 µs (+8 %) | 1038 µs (+8 %) | 989 µs (+3 %) | 996 µs (+4 %) |

The two parts are in `../results/engine-sharing/cold-first-parse.md`.

## What the numbers say

- One large function is the fastest form in each test. No variant with functions is faster.
- `this` costs the most: 11 to 12 % in Node when hot, and 8 to 24 % when cold. It is also 59 % larger.
- A function for a phase that runs one time for each parse (`tail`) costs nothing when hot. When cold it costs 30 to 100 µs: the runtime must compile each function before its first call.
- A small function in the loop (`hot`) costs nothing more than `tail`.
- The first parse in a process takes 350 to 580 µs. A parse in the hot test takes 3 to 6 µs. So a real CLI is about 100 times slower than the hot benchmark shows, and the cold numbers are the ones a user of a CLI gets.

## Decision

The two engines stay two files with the code written two times. It is the fastest and the smallest form.

One source file with a build constant (`bun build --define MINI=true`, and the minifier removes the branch that cannot run) gives the same bundles. It was tested and it works, but it is too complicated for what it gives.

## How to run

```sh
./build.sh                 # makes the variants and builds them to dist/
bun check.ts               # all variants give the result of `now`
./bench.sh pass1 now,this,param,tail,hot
./bench.sh pass2 hot,tail,param,this,now
node summarize.js pass1 pass2
node cold-median.js 200
```

`param.ts`, `tail.ts` and `hot.ts` are made by `make-variants.py`. Do not edit them.
