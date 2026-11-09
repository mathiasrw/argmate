# Max against Full and Mini

Max is the full engine with the changes that the operation kept. Max is now the full engine in `src/`. Full is the full engine before the changes, at commit `1152549`. Mini is the mini engine.

The text of each change and its numbers are in `finetune-area-1.md` to `finetune-area-5.md`. The tables of every run are in `runs/`.

## How to read a table

A speed is a time relative to the fastest engine of the row. The fastest engine in a row is `1.00x`. An engine with `1.26x` needs 1.26 times as long as the fastest. The last column shows the `1.00x` as measured. Use it to get the time back in µs or ns.

A size is in KB. One KB is 1,024 bytes. A difference is outside noise when the 95 % bootstrap interval of the difference does not include zero.

Cold start is the time to load the library and make the first parse in a new process. Hot is the time of one parse after the same process made many parses.

## In short

Each cell is the range over the five workloads of the engine in that row. `1.00x` is the fastest of the three engines in each workload.

| | Max | Full | Mini |
|---|---:|---:|---:|
| Cold start, Node | 1.05x - 1.65x | 1.27x - 1.93x | 1.00x |
| Cold start, Bun | 1.15x - 1.61x | 1.32x - 1.85x | 1.00x |
| Hot, Node | 1.00x - 1.22x | 1.42x - 3.56x | 1.00x - 1.13x |
| Hot, Bun | 1.00x - 1.18x | 1.39x - 2.16x | 1.00x - 1.07x |

For a cold start, Full needs 1.14x - 1.26x as long as Max on Node and 1.12x - 1.15x as long on Bun. When hot, Full needs 1.42x - 3.56x as long as Max on Node and 1.32x - 1.98x as long on Bun.

The bundle size is in KB. The section Size has more.

| | Max | Full | Mini |
|---|---:|---:|---:|
| argMate | 24.0 KB | 22.5 KB | 15.8 KB |
| argEngine | 12.5 KB | 11.7 KB | 5.1 KB |

In 10 of 10 cold rows and 10 of 10 hot rows Max is faster than Full outside noise. In 0 rows Max is slower.

The tests pass with Max. This holds for `bun test` on the sources, on the ESM bundles and on the CJS bundles (2455 pass, as for Full). It holds for the fuzzy tests, the type tests, `tsc --noEmit` and `biome check`.

A differential test (`difftest.js`) gives the same random configs, settings and arguments to Full and to Max. It ran 300,000 cases for the full engine and 300,000 for the mini engine. It compares the error cases too. The result is 0 different cases.

The command `node run.js --runs 200 --rounds 12 mini max` made the first run (`runs/20261102-1215-mini+max.md`). The command `node run.js --base mini --runs 200 --rounds 12 mini-max` made the second run (`runs/20261102-1220-mini-max.md`). Cold start is the median of 200 processes, timed with `process.hrtime.bigint()`. Hot is the median of 12 rounds of 400 ms.

Each round makes many parses in one process, after the JIT compiler has optimized the engine. The JIT compiler turns code that runs often into fast machine code. The engines take turns, each in its own process. The 95 % bootstrap intervals are in the run files.

The measurement ran on an Apple M1 Pro with Node v24.22.1, Bun v1.4.3. The code is argmate v0.9.1, branch `v1`, `1152549`. The date is 2026-11-02 12:15.

## Cold: load and first parse

| Runtime | Workload | Max | Full | Mini | 1.00x is |
|---|---|---:|---:|---:|---:|
| node | plain | 1.38x | 1.58x | 1.00x | 1141 µs |
| node | config | 1.10x | 1.39x | 1.00x | 1695 µs |
| node | precompiled | 1.65x | 1.93x | 1.00x | 788 µs |
| node | files | 1.10x | 1.39x | 1.00x | 1692 µs |
| node | groups | 1.05x | 1.27x | 1.00x | 1620 µs |
| bun | plain | 1.34x | 1.49x | 1.00x | 1265 µs |
| bun | config | 1.19x | 1.34x | 1.00x | 1743 µs |
| bun | precompiled | 1.61x | 1.85x | 1.00x | 765 µs |
| bun | files | 1.21x | 1.39x | 1.00x | 1775 µs |
| bun | groups | 1.15x | 1.32x | 1.00x | 1686 µs |

## Hot: one parse

| Runtime | Workload | Max | Full | Mini | 1.00x is |
|---|---|---:|---:|---:|---:|
| node | plain | 1.00x | 1.71x | 1.04x | 1570 ns |
| node | config | 1.00x | 1.42x | 1.13x | 5319 ns |
| node | precompiled | 1.22x | 1.87x | 1.00x | 1761 ns |
| node | files | 1.00x | 3.56x | 1.04x | 8520 ns |
| node | groups | 1.00x | 1.86x | 1.12x | 2835 ns |
| bun | plain | 1.00x | 1.39x | 1.00x | 1247 ns |
| bun | config | 1.00x | 1.40x | 1.07x | 2484 ns |
| bun | precompiled | 1.16x | 1.54x | 1.00x | 1334 ns |
| bun | files | 1.09x | 2.16x | 1.00x | 5082 ns |
| bun | groups | 1.18x | 1.57x | 1.00x | 2071 ns |

## Size

The size of the minified ESM bundle (`bun build --minify`) in KB. `argMate` is the entry `argmate`. `argEngine` is the entry `argmate/engine`. The Mini column holds `argMateMini` and `argEngineMini`.

| Bundle | Max | Full | Mini |
|---|---:|---:|---:|
| argMate | 24.0 KB | 22.5 KB | 15.8 KB |
| argEngine | 12.5 KB | 11.7 KB | 5.1 KB |

## Mini with the shared files of Max

The mini engine imports `compileConfig.ts` and `common.ts`, which Max changes, so its numbers change although its own file does not. `Mini + Max` is the mini engine built from the files of Max, and `Mini` the mini engine as it is.

### Cold: load and first parse

| Runtime | Workload | Mini + Max | Mini | 1.00x is |
|---|---|---:|---:|---:|
| node | plain | 1.00x | 1.02x | 1111 µs |
| node | config | 1.00x | 1.23x | 1356 µs |
| node | precompiled | 1.00x | 1.07x | 725 µs |
| node | files | 1.00x | 1.22x | 1379 µs |
| node | groups | 1.00x | 1.21x | 1313 µs |
| bun | plain | 1.00x | 1.00x | 1239 µs |
| bun | config | 1.00x | 1.12x | 1530 µs |
| bun | precompiled | 1.00x | 1.08x | 691 µs |
| bun | files | 1.00x | 1.11x | 1536 µs |
| bun | groups | 1.00x | 1.11x | 1407 µs |

### Hot: one parse

| Runtime | Workload | Mini + Max | Mini | 1.00x is |
|---|---|---:|---:|---:|
| node | plain | 1.00x | 1.00x | 1615 ns |
| node | config | 1.00x | 1.23x | 4859 ns |
| node | precompiled | 1.01x | 1.00x | 1749 ns |
| node | files | 1.00x | 1.06x | 8382 ns |
| node | groups | 1.00x | 1.68x | 1900 ns |
| bun | plain | 1.00x | 1.01x | 1247 ns |
| bun | config | 1.00x | 1.19x | 2289 ns |
| bun | precompiled | 1.03x | 1.00x | 1353 ns |
| bun | files | 1.00x | 1.05x | 4898 ns |
| bun | groups | 1.00x | 1.29x | 1595 ns |

### Size

| Bundle | Mini + Max | Mini |
|---|---:|---:|
| argMateMini | 16.3 KB | 15.8 KB |
| argEngineMini | 4.9 KB | 5.1 KB |

## The whole run of a program

This is the time from the start of the command (for example `node cli.mjs`) to the end of the command. It includes the start of Node or Bun. The test program parses the `config` workload and prints the result (`node launch.js 200 max`, `runs/3AB-launch-max.md`). The library is a small part of the run because Node needs about 38 ms to start and Bun about 10 ms. The fastest run of a runtime is `1.00x`. It is 37.7 ms on Node and 9.8 ms on Bun.

| Command | Time of the whole run |
|---|---:|
| Node, `argmate`, config at run time | 1.01x |
| Node, `argmate`, CommonJS bundle | 1.01x |
| Bun, `argmate`, config at run time | 1.10x |
| Bun, `argmate`, CommonJS bundle | 1.10x |
| Node, `argmate/engine`, config made at build time | 1.00x |
| Bun, `argmate/engine`, config made at build time | 1.06x |
| Node, startup snapshot | 1.07x |
| Bun, `bun build --compile` binary | 1.16x |
| Bun, `bun build --compile --bytecode` binary | 1.00x |

## What the changes are

Each number compares the engine without the change to the engine with the change. The engine with the change is 1.00x. A number of 1.06x means that the engine without the change needs 1.06 times as long.

The table shows a number only where the difference is outside noise. The column Cold, Node is the load and the first parse on Node. The column Hot, Node is one parse on Node. The area documents have every row and its interval.

| Change | Section | What | Cold, Node | Hot, Node |
|---|---|---|---|---|
| Cold blocks in functions | 1Fb, 1Fd, 1Fe | `exists`, `conflict`, `demand`, spots and slices are functions that are called when the config has one. They are compiled when first called, so most parses do not compile them. `paramValueFromNextOrLast` gets its state as one object | 1.06x - 1.09x | no change |
| Indexed captures | 4A, 2C | The two parameter regexes have the groups at the same places and the engine reads `token[1]` to `token[6]`, with no `groups` object | no change | 1.15x - 1.44x |
| First character before the number test | 2Ac | `autoNumber` returns text that does not start with a digit or a dash at once | 1.02x - 1.05x | 1.02x - 2.98x |
| No regexes in the preprocessing | 2Da | The type, the valid types and the array test are string tests | 1.08x - 1.10x | 1.04x - 1.42x |
| Names and camel case without regexes | 2Db | A name list from a string with no comma, space or dash, and the camel test, are loops | 1.02x | 1.01x - 1.04x |
| Cold blocks of the preprocessing in functions | 2Dc2 | `spot`, `next`, `last`, the list of valid values, `conflict` and `demand` | 1.01x - 1.02x | no change |
| A fast path for plain digits | 2Af | `int` with digits only needs no regex | 1.02x | 1.03x |
| Kebab case with loops | 2Ag | The conversion of an unknown `--dry-run` | no change | 1.19x |
| Regexes that nothing uses | 1Da | Six entries of `re` removed | 1.01x - 1.03x | 1.02x |

The area documents show the changes that were not kept, with the number that dropped each one. The strongest hot path change that is not in Max is `2Ae`. It is a hand-written parser in place of the two parameter regexes. When hot, the regexes need 1.11x - 1.40x as long as `2Ae` on both runtimes. At cold start on Bun, `2Ae` needs 1.03x - 1.05x as long as the regexes. So `2Ae` is not a cold start change.
