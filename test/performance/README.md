# Performance tests

Each folder is one test. `run.js` in the folder is the one way to start it, and it writes `results.md` in the folder: what was measured, the machine, the versions and the tables.

| Folder | What it measures |
|---|---|
| `engineSize/` | The size of the bundles of the full and the mini engine |
| `engineHot/` | Full and mini: many parses in one process, after the JIT compiler has optimized the engine |
| `engineCold/` | Full and mini: load and first parse in a new process, measured inside the process |
| `engineCli/` | Full and mini: the wall time of a whole CLI process, with Node, Bun and `bun build --compile` |
| `compareLibs/` | argmate and 11 other parsers: what they give for common forms, their size, and the hot, cold and CLI speed |
| `shared/` | Not a test. The workloads, the build of argmate, the check that full and mini give the same results, and the statistics |

## How to run

```sh
./run.sh                    # all tests, about 20 minutes
./run.sh compareLibs        # only the folders given
node engineHot/run.js 4     # one test with fewer rounds: a quick look
```

Each `run.js` builds argmate from `src/` as it is now, also from changes that are not committed. `compareLibs` installs the parsers in `compareLibs/node_modules` the first time. On macOS `run.sh` uses `caffeinate -i`: when the machine sleeps, the processes stop and the numbers are not correct. Other work on the machine makes the numbers jump. Do not run two tests at the same time.

None of the files are `*.test.*` files, thus `bun test` does not run them.

## Method

- full and mini (and the parsers in `compareLibs`) must give the same result for the workload before they are timed. `shared/check.js` and `compareLibs/run.js` check this.
- Each measurement runs in its own process. The engines or parsers take turns, thus a change in the load of the machine hits all of them.
- The tables have medians. "95 % interval" is a bootstrap interval of the difference. An interval that includes 0 means: no difference was found.

## Summary of the run of 2026-10-25

Apple M1 Pro, Node v22.23.3, Bun v1.4.3. The numbers are in the `results.md` files.

### Full and mini engine

- **A real CLI is 0 to 2.3 % faster with mini, or slower by up to 1.4 %.** That is 0.5 ms or less. The start of the runtime takes 9 to 36 ms, and all of argmate costs 0.3 to 1.6 ms of it.
- When cold, mini saves about 140 to 260 µs (10 to 24 %) of the load and first parse. With Bun the precompiled mini engine is 7 % slower than the full one: Bun loads `argEngineMini.js` about 170 µs slower, although it is smaller. The cause is not known.
- When hot, mini is 1.3 to 3.3 times faster. Only a program that parses many times in one process gets this.
- Mini is 1.2 KB smaller minified (0.5 KB gzip).

### argmate and other parsers

- **Forms:** argmate (full) gives the expected result for all 9 forms, as do `util.parseArgs`, yargs-parser, yargs, commander, meow and @oclif/core. mini fails 3: `-p8080`, `-dp8080` and `--no-debug`. For `-p8080` mini gives `port = -8`, because it splits `-p8080` into `-p -8 -0 -8 -0`.
- **The real CLI:** argmate costs a Node CLI 1.1 ms; precompiled 0.6 ms. Only `util.parseArgs` (1.2 ms) is close. mri, arg and sade cost 2 to 4 ms, commander 10 ms, yargs, meow and @oclif/core 54 to 58 ms. With Bun, argmate, `util.parseArgs`, mri, arg, sade and minimist all cost 1.2 ms or less, and the differences between them are small.
- **Cold:** argmate has the fastest import and first parse with Node (1.2 to 1.3 ms). With Bun, arg, mri and minimist are faster (0.8 to 1.1 ms against 1.2 to 1.4 ms).
- **Hot:** arg, mri, argmate/mini and precompiled argmate are the fastest (1.0 to 1.5 µs a parse with Node). argmate is 2.5 µs. yargs is 194 µs, because it builds a new instance for each parse. meow is 6 ms with Node, because it reads `package.json` from the disk for each call.
- **Size:** argmate is one package of 118 KB with all entry points, ESM, CommonJS and types. The small parsers are 13 to 84 KB. yargs is 21 packages and 593 KB, @oclif/core 38 packages and 2 MB.
- **minimist with Node:** a whole process with minimist is 12 ms slower than the import and parse inside it show. A test outside `compareLibs` shows the cause: when an ES module imports minimist, Node takes about 13 ms more than when a CommonJS file requires it (50.0 ms against 34.4 ms; arg, also CommonJS, has no such cost). All adapters import from an ES module, thus a CommonJS CLI with minimist is faster than the table shows.

What the libraries do in addition (help, version, validation) is in the notes of the size table in `compareLibs/results.md`. A parser that does more work is slower for a reason, not only because of its code.
