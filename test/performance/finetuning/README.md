# Operation finetuning

The full engine is fast when it is hot. A parse is hot when the same process has made many parses before. By then the JIT compiler has optimized the engine. The JIT compiler is the part of the runtime that makes code faster while the program runs. A hot parse needs about 3 to 5 µs.

A real command line program never reaches the speed of a hot parse. The program loads the module, parses once and exits. A cold start is the time to load the module and to make the first parse in a new process. On Node (a runtime, that is, a program that runs JavaScript), the load of `argmate` needs about 580 µs. The first parse needs about 1000 µs.

So the first parse needs about 200 times as long as a hot parse. A shorter cold start comes from a shorter load time and from fewer one-time costs of the first parse. A one-time cost is work that the process does once, for example the compile of a regular expression (a regex) at its first use. A shorter cold start does not come from the parse loop.

This operation measures every candidate change on its own and keeps the changes that help. The operation ended with `engineMax`. `engineMax` is the full engine with the best combination of the kept changes. `engineMax` is now the full engine in `src/`.

## The areas

| Area | Document | What it covers |
|---|---|---|
| 1 | `finetune-area-1.md` | Load time. The size of the built file (the bundle), the shape of the module and the code that runs when the module loads |
| 2 | `finetune-area-2.md` | First parse. The compile of regexes, the compile of a function at its first call (lazy compile) and the preprocessing of the config |
| 3 | `finetune-area-3.md` | Special behavior of Node and Bun. Snapshots, bytecode, forms of import and timers |
| 4 | `finetune-area-4.md` | Fewer instructions in the code that runs for each parse (the hot path) |
| 5 | `finetune-area-5.md` | How to measure the small parts with correct results |

A snapshot is a saved copy of the memory of a started program. Bytecode is code that the runtime has already compiled.

Each area document has one section for each letter, for example `1A` and `1B`. A section says what to change and why the change can help. A section also says how to try the change and how to measure it. The last part of a section is the rule that decides to keep or to drop the change. The results of each section go in the table at the end of its document. The table also has the date, the commit and the machine.

## Method

A variant is a copy of the engine with one change. The branch engine is the engine as it is on the branch at the time of the measurement.

- Measure one variant at a time. Each section is one change to a copy of the engine. Measure the variant against the branch engine. Two changes in one measurement tell nothing about either change.
- Measure on both runtimes, Node and Bun. Write the versions in the results. If a change helps one runtime and hurts the other, record both results. Decide per runtime only if the two runtimes can get different code. They cannot today. So the sum of the results decides.
- Make three measurements for each variant.
  - Cold is the load and the first parse in a new process (area 5A).
  - Hot is many parses in one process (area 5B).
  - Size is the size of the minified bundle. The minified bundle is the file that `bun build --minify` makes.
- A change for cold start must not cost hot speed. A change for hot speed must not cost cold start.
- Use medians and intervals.
  - The cold number is the median of 200 processes. The median is the middle value of the measured values in order of size.
  - The hot number is the median of 10 rounds of 400 ms. A round is one period of 400 ms in which one process makes parses.
  - Each number has a 95 % bootstrap interval from `../shared/stats.js`. The interval is a range around the number. The script computes the range with many random resamples of the measured values. The true value is in the range with a chance of 95 %.
  - Noise is a change in the numbers that comes from the machine and not from the code. A difference inside the interval is noise. Record it as "no change".
- Use a quiet machine. Nothing else runs on the machine. The command `caffeinate -i` keeps the machine awake, as `../run.sh` does.
- Run the tests first. A variant goes to the benchmarks only if `bun run tst` passes with it. If a variant fails a test and a change of one line cannot fix it, drop the variant. Write down the reason.
- Write comments that say why. A kept change gets a comment in the engine that names the section. The comment on the reverse, pop and push already names a section. The comment keeps the reason with the code.

## The harness

The harness is the set of scripts in this folder that build, test and measure the variants.

The existing benchmarks in `../engineHot`, `../engineCold` and `../engineSize` measure `../shared/dist/`. The script `../shared/build.sh` builds `../shared/dist/` from `src/`. In this operation, a variant is a copy of `src/argEngine.ts` in `variants/<section>.ts`, for example `variants/4A.ts`. The harness builds each variant to its own folder. Then the harness runs the three benchmarks for the branch engine and for the variant, and the two engines take turns.

The output has one row for each variant. The row has cold, hot and size for each runtime. The row also has the difference to the branch engine, with its interval. Area 5 has the details.

The variants are not committed. A variant is a tool of the operation. The result of a variant is its row in the table of its section.

### How to run it

The harness takes its base engine from `src/` of the branch where it runs. The measurements in this folder used `src/` of the commit `1152549` (branch `v1`), before the engine `engineMax` existed. Now `src/` is the engine `engineMax`. So the harness measures a variant against `engineMax`, and the old numbers do not come back. To measure again as before, run the harness in a copy of the commit `1152549`.

A workload is one fixed test input of the benchmarks, for example `plain` or `config`. The option `--workloads` selects the workloads.

```sh
node run.js 4A                    # variants/4A.ts against the branch engine: tests, size, cold and hot, Node and Bun
node run.js 4A 4B                 # more variants in one run: every engine takes turns
node run.js --runs 50 --rounds 4 --workloads plain,config 4A    # a short run
node run.js --no-cold --workloads files,groups 4E              # only the hot measurement of two workloads
```

A variant is a file `variants/<name>.ts`. The file is a copy of `src/argEngine.ts`. A variant can also be a folder `variants/<name>/`. The folder holds files of `src/` that replace the files with the same name. Use a folder for a change in `compileConfig.ts`, `common.ts` or `argService.ts`. The script `run.js` does the steps below in order.

1. `run.js` builds the branch engine and each variant to `dist/<name>/`, with the flags of `bun run build-esm`. `run.js` also builds `precompiled.js` for each engine from the `compileConfig.ts` of that engine.
2. `run.js` runs the tests with the sources of the variant (`bun test` on a copy of the repository). `run.js` does not measure a variant that fails a test. The option `--no-test` skips the tests.
3. `run.js` checks that the variant gives the same result as the branch engine for every workload.
4. `run.js` measures cold (`cold.js`, 200 processes) and hot (`hot.js`, 10 rounds of 400 ms) on Node and on Bun. The engines take turns. Each engine runs in its own process. The timer is `process.hrtime.bigint()`.
5. `run.js` writes `runs/<date>-<variants>.md` with size, cold and hot. Every gain in the file is `base - variant`, so a positive gain means faster or smaller. The base is the engine that the run measures the variant against. Each gain has its 95 % bootstrap interval. A row says "faster" or "slower" only if the interval does not include zero.

The harness has these files.

- `lib.js` for the build, the tests and the equality check
- `cold.js` for the cold measurement
- `hot.js` for the hot measurement
- `run.js` for the whole run
- `phases.js` for section 5C
- `timer-check.js` for section 3D
- `flags.js` for section 5E
- `deopt.js` for section 5D

The script `../shared/gen.ts` takes a source folder and an output folder, for example `bun gen.ts <src> <out>`. The harness uses `../shared/gen.ts` to build each variant from its own source folder.

## Cross-over effects

Some sections overlap. So the gain of two kept changes together is not always the sum of their gains.

- Sections 2C and 4A are the same change, called indexed captures. The engine reads the groups of a regex by number, for example `token[1]`, and not by name. Section 2C looks at the change for cold start, and section 4A looks at the change for the hot path. The measurement is in section 4A, and section 2C refers to section 4A.
- Sections 1D and 2A both change the regex objects. Section 1D is about the creation of the regexes at load. Section 2A is about the first execution of the regexes. If section 2A replaces a regex with charCode checks, that regex is no longer in section 1D.
- Sections 1F and 2D both reduce the code that V8 (the JavaScript engine of Node) compiles before the first parse. If section 1F splits the late checks into a function, the preprocessing of section 2D is a candidate for the same split.
- Section 4B removes the `ASSIGN` capture. If section 4A first changes the engine to indexed captures, section 4B changes the indexes again. Do section 4A first. Then do section 4B on top of section 4A.
- Section 4G changes the shape of the output object. Section 4D reads from the parameter config. Both changes alter what the inline caches see. An inline cache is a note at a place in the code. The note holds the shape of the objects that the runtime saw there. Measure section 4G last of the hot path changes.

If two kept changes overlap, measure the combination as its own row before the combination goes into `engineMax`.

## The end: `engineMax`

The kept changes touch three files. The files are `argEngine.ts`, `compileConfig.ts` and `common.ts`. During the operation, `engineMax` was the folder `engineMax/` with a copy of those three files.

`engineMax` is now the full engine. The changes are in `src/`, and the folder `engineMax/` is removed. After the measurements, three names changed.

- `slices` becomes `nextOrLast`.
- `takeSlice` becomes `paramValueFromNextOrLast`.
- `takeSpots` becomes `paramValueFromSpot`.

The files `types.ts` and `argEngineMini.ts` change by these renames only. The numbers in `results.md` come from the code before the renames. The renames do not change what the code does.

The operation added the changes one at a time (`variants/m1` to `variants/m5`). The operation measured each combination as its own row before the next change.

## Result of the operation (2026-11-02)

The file `results.md` has the tables. In a table, the fastest engine in a row is `1.00x`. The other engines show how long they need compared to the fastest engine. In the text, "Full needs 1.26x as long as Max" means that the time of Full is 1.26 times the time of Max. Max is the full engine with the kept changes, now in `src/`. Full is the full engine before the changes, at commit `1152549`.

Mini is the mini engine. A row is one runtime with one workload. The measurements ran on Node v24.22.1 and Bun v1.4.3 on an Apple M1 Pro. Each cold number is the median of 200 processes. Each hot number is the median of 12 rounds.

The list below compares Max to Full. The first three items measure the library only.

- Cold start. On Node, Full needs 1.14x - 1.26x as long as Max. On Bun, Full needs 1.12x - 1.15x as long as Max. All 10 rows are outside noise.
- Hot. On Node, Full needs 1.42x - 3.56x as long as Max. On Bun, Full needs 1.32x - 1.98x as long as Max. All 10 rows are outside noise.
- Size of the bundles. The bundle `argmate` is 24.0 KB for Max, 22.5 KB for Full and 15.8 KB for Mini. The bundle `argmate/engine` is 12.5 KB for Max, 11.7 KB for Full and 5.1 KB for Mini. 1 KB is 1,024 bytes.
- The whole run of a program (`launch.js`, from the start of the command to the end of the command). A Node run with Max needs about 38 ms. A Node run with Full needs 1.01x as long. A Node run needs about 20 times as long as the cold start of the library. A Bun run needs about 5 times as long.
- The tests pass with Max. The tests cover the sources, the ESM bundles, the CJS bundles, the fuzzy tests and the type tests. ESM is the module form with `import`. CJS is the module form with `require`. `tsc` and `biome check` report no problem.
- A differential test gives the same input to two programs and compares the results. The test `difftest.js` gives the same random cases to Full and to Max. It runs 300,000 cases for the full engine and 300,000 cases for the mini engine. The cases include errors. The test finds 0 different results.

The next numbers compare Max to Mini. When cold, Max needs 1.05x - 1.65x as long as Mini, so Mini is still the faster engine. When hot, Max is the faster engine in 5 of 10 rows. In these rows, Mini needs 1.04x - 1.13x as long as Max.

The mini engine shares `compileConfig.ts` and `common.ts` with the full engine, so the changes of Max also change Mini. The name `mini-max` is for Mini built with the files of Max. The measurement compares `mini-max` to Mini as it is now. The measurement uses the same 200 processes and 12 rounds. `mini-max` is never slower than Mini.

- Cold, for a config. On Node, Mini needs 1.21x - 1.23x as long as `mini-max`. On Bun, Mini needs 1.11x - 1.12x as long as `mini-max`.
- Cold, for a precompiled config. Mini needs 1.07x as long as `mini-max` on Node and 1.08x as long on Bun.
- Cold, for `plain`. There is no change.
- Hot. Mini needs up to 1.68x as long as `mini-max` (`groups`, Node). For `config` on Node, Mini needs 1.23x as long as `mini-max`.
- Size. `argMateMini.js` is 16.3 KB with the files of Max against 15.8 KB now. `argEngineMini.js` is 4.9 KB with the files of Max against 5.1 KB now. The reason is that the regexes that nothing uses are no longer in the shared table.

Before the changes, the cold start of `config` on Node needed 2290 µs in all (5C). The parts were as follows.

- The load needed 810 µs.
- The preprocessing needed 601 µs.
- The compile of the engine on its first call needed 514 µs.
- The first token loop needed 317 µs.

The first paragraph of this file gives 580 µs to load and 1000 µs for the first parse. Those numbers come from the plan, which used `performance.now()` and an earlier Node. This harness measures 810 µs to load `argmate` and 1470 µs for the first parse of `config`. The harness measures on Node v24.22.1 with `hrtime`.

The finding of the operation is that nearly all of the first parse is compile and cold state, and not work. Cold state means the state of a process that runs the code for the first time, with empty inline caches and no objects made yet. As evidence, the third call of `configPreprocessing` takes 25 µs.

So the gain comes from three things.

- The engine compiles less, because code that a parse does not run is in its own function (1F, 2D).
- The engine has fewer regexes (2A, 2D).
- One regex is cheaper (4A).

The remaining time (5C on `m4`, `config` on Node) is 1881 µs in all. The parts are as follows.

- The load needs 854 µs.
- The preprocessing needs 330 µs.
- The compile of the engine on its first call needs 368 µs.
- The first token loop needs 294 µs.

The largest part that the operation did not change is the help code in the bundle. The help code is 5.7 KB. On Node, the cold start with the help code needs 1.08x - 1.10x as long as the cold start without the code. Item 60 of `todo.md` describes this.

The next part is the 32 error objects of the engine. A ceiling is a variant that cuts out a whole part, so the ceiling shows the largest possible gain. The ceiling `C1` is the variant with no error objects. The cold start with the error objects needs 1.09x - 1.14x as long as the cold start of `C1`.

The operation did not do the following.

- Sections 3A and 3B ran as a measurement of the whole process and not as recipes. A recipe is a set of steps in the README for a user of the library.
- Section 2D has four ideas that the operation did not try (see `finetune-area-2.md`).
- Section 1D did not try separate constants for the regexes.
