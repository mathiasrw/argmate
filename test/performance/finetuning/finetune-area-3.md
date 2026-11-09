# Area 3: Node and Bun quirks

The two runtimes start a module in different ways. Each runtime has a feature that lets a CLI skip the cost of load and compile while the program runs. A CLI is a program that a user starts from the command line. The library cannot turn on these features. The author can write the library so that the features work, and the README can show the recipe. This area also has two corrections to the way the cold harness measures.

This document uses three terms. The cold start is the time to load the library and make the first parse in a new process. The cold harness is the test program that measures the cold start. The operation is the fine tuning work in this folder, which measures each change to the library separately.

## 3A. Node snapshots and single executable applications

The change is a startup snapshot of Node. The command `node --snapshot-blob snap.blob --build-snapshot entry.js` builds the snapshot. The command `node --snapshot-blob snap.blob main.js` starts Node from the snapshot.

The snapshot holds the heap after `entry.js` ran. The heap is the memory of the program. So a module that `entry.js` loaded is already loaded when `main.js` runs, with its regular expressions compiled. The single executable application (SEA) can embed the same snapshot. A CLI author who wants the fastest start builds a snapshot.

The reason is that a snapshot removes the load and the one-time compile of the first parse. These are the two largest parts of the cold start. The library must be snapshot safe. Module evaluation is the moment when the runtime runs the top level of a module. A snapshot safe library follows two rules.

- At module evaluation, the module uses no `process`, no input or output, no timers and no `Math.random`.
- The module scope holds no state that must be fresh in each run.

The file `argService.ts` keeps `parameterConfig_` and `engineSettings_` in module scope for `argInfo()`. Each parse sets both variables. So each parse overwrites a stale value from the snapshot. A stale value is an old value that the snapshot holds. The author must check that each parse overwrites the stale value.

To try it, write a script in this folder. The script builds a snapshot with `argmate` imported and a config preprocessed. Then the script runs the `config` workload from the snapshot. A workload is a fixed input that a test parses. Compare the result with the plain cold run, which is the cold harness without a snapshot. First check that the 1E list is empty.

The measurement is the cold load and the first parse from the snapshot, on Node only.

The decision rule is to give a number for the README and a recipe. If the module is not snapshot safe, the author adds the fix to the library. Section 3B also needs the fix.

## 3B. Bun compile and bytecode

The command `bun build --compile` makes one binary. A binary is one file that holds the runtime and the program, and the system can run the file. The binary holds the runtime and the bundle. The bundle is the single file that the build makes from the library.

The option `--bytecode` adds the compiled bytecode of the bundle. Bytecode is the form of the code after the runtime parses and compiles the code. The binary holds the bytecode as a cache, so Bun skips the parse at start. A CLI author who ships to Bun users, or who ships the compiled binary, can use both options.

The reason is that the bytecode cache removes the parse and the first compile. The library has the same job as in 3A. At module evaluation, the library must do nothing that is not a plain literal. The bundle must be in the CJS form that `--bytecode` needs today. CJS is the module form that uses `require`. The other module form, ESM, uses `import`.

To try it, follow these steps.

1. Build `test/manual/example.ts` or the `config` workload with `bun build --compile`.
2. Build the same file with `--compile --bytecode`.
3. Run the cold measurement inside each binary.
4. Compare the results with `bun cold.js`.

The measurement is the cold load and the first parse, on Bun only. The size of the binary is not a criterion.

The decision rule is to give a number for the README and a recipe. The library keeps any change that the bytecode form needs, if the change has no cost on the other paths.

## 3C. Static `import` versus dynamic `import()` in Bun

The cold harness loads the engine with `await import(file)`, which is a dynamic import. A real CLI has a static `import` at the top of its file. On Bun the two forms take different paths in the module loader. The cold table shows that Bun needs 1.10x as long as Node to load (642 µs against 585 µs). The cause can be the dynamic form and not Bun.

The reason is that the harness must measure what a CLI does. If the harness does not, every Bun number in this operation is wrong by the difference between the two forms.

To try it, write a second cold script for a workload. The script has a static `import` of the bundle. A `--import` preload or `process.hrtime` at the top of the file starts the timer. Run both forms on Node and on Bun.

The measurement is the cold load in both forms, on both runtimes. Each number has a 95 % bootstrap interval, which is a range that the test computes from the measured runs. A difference inside the interval is noise, that is, a change that can come from chance alone. An interval that includes zero (for a ratio, 1.00x) means that the test found no difference.

The decision rule is that the harness changes to the form that a CLI uses, which is the static form. If the two forms differ by more than the interval on either runtime, the README notes the difference.

## 3D. `hrtime` in the harness

The files `../engineCold/cold.js` and `../engineHot/hot.js` use `performance.now()` as the timer. The resolution of a timer is its smallest step. On Node, `performance.now()` has a resolution in µs. On Bun the resolution of `performance.now()` is coarser. Bun rounds the value, so a load of 400 µs shows in steps of a fixed size. The function `process.hrtime.bigint()` has a resolution in ns on both runtimes.

The reason is that the operation measures differences of 10 to 50 µs. A timer with steps of 100 µs on one runtime hides such differences.

To try it, write a micro check, which is a very small test script. The check calls each timer 1000 times in a loop on both runtimes. The check prints the smallest difference that is not zero. Then change both harness files to `process.hrtime.bigint()`.

The measurement is the smallest step of each timer on each runtime.

The decision rule is that the harness uses the finer timer. This section is a precondition for every other section, so the author does it first.

## Results

In the table, n.a. means not applicable.

| Section | Runtime | Cold load | Cold first parse | Note | Date, commit, machine |
|---|---|---:|---:|---|---|
| 3A | node | n.a. | n.a. | The whole process needs 1.05x as long from a snapshot as from the bundle (40.2 ms against 38.2 ms), so the snapshot is slower. There is no recipe for the README | 2026-11-02, `1152549`, M1 Pro |
| 3B | bun | n.a. | n.a. | A compiled binary needs 1.05x as long as the bundle run by Bun. The bundle run by Bun needs 1.11x as long as a compiled binary with `--bytecode` (10.9 ms against 9.8 ms) | 2026-11-02, `1152549`, M1 Pro |
| 3C | both | n.a. | n.a. | The test found no difference, see below | 2026-11-02, `1152549`, M1 Pro |
| 3D | both | n.a. | n.a. | The smallest step is 41 ns for `performance.now()` and for `process.hrtime.bigint()`, on Node v24.22.1 and on Bun v1.4.3. The two timers do not differ. The new harness uses `hrtime` although the timers do not differ | 2026-11-02, `1152549`, M1 Pro |

### 3C: static import and dynamic import()

The command is `node static.js 100`, and the run file is `runs/3C-static.md`. The test measures the time from the start of the process to the first line of the entry file. The test does this for four entry files.

- An entry that imports the bundle with a static `import`.
- An entry that imports the bundle with `await import()`.
- An entry that imports an empty module with a static `import`.
- An entry that imports an empty module with `await import()`.

The load is the difference between the time with the bundle and the time with the empty module. The processes are independent, so the start of the process is noise of about 0.7 ms on Node. The intervals are wide.

The numbers in parentheses are 95 % bootstrap intervals. The base of the last column is the static load of the same runtime.

| Runtime | Static load | Dynamic load | Dynamic load compared to static load |
|---|---:|---:|---:|
| node | 1213 µs (392 to 1778) | 278 µs (-288 to 966) | 0.30x (-0.11x to 1.06x) |
| bun | 752 µs (612 to 867) | 779 µs (676 to 883) | 1.15x (0.93x to 1.42x) |

The test found no difference on either runtime. On Bun the dynamic load needs 1.15x as long as the static load, and the interval (0.93x to 1.42x) includes 1.00x. The load of the bundle in `cold.js` is 900 µs on Bun and 830 µs on Node. So the gap that the section started from is not in the numbers of this machine. That gap is Bun needing 1.10x as long as Node (642 µs against 585 µs).

The harness keeps `await import()`, because the harness measures the load alone, in the process, with a timer in ns. The script `static.js` is the wrong tool for a gap smaller than 0.7 ms.

### 3A and 3B: a snapshot of Node, and a binary of Bun

The command is `node launch.js 200 max`, and the run file is `runs/3AB-launch-max.md`. The test measures the time of the whole process, from its start to its exit. The process parses the `config` workload and prints the output. The commands run in turns.

The median of a list of times is the middle value of the list. In the column "Compared to the fastest command of the runtime", `1.00x` is the fastest command of the runtime. The bundle (ESM) is `node cli.mjs` for Node and `bun cli.mjs` for Bun. A value below 1.00x in the last column means that the command needs less time than the bundle (ESM). A precompiled program has the config made at build time.

| Command | Median ms | Compared to the fastest command of the runtime | Compared to the bundle (ESM), with the 95 % bootstrap interval |
|---|---:|---:|---:|
| `node cli.mjs` | 38.2 | 1.01x | 1.00x |
| `node cli.cjs` | 38.0 | 1.01x | 1.00x (0.98x to 1.01x) |
| `node cli-pre.mjs` (precompiled, `argmate/engine`) | 37.7 | 1.00x | 0.99x (0.98x to 1.00x) |
| `node --snapshot-blob snap.blob -- x` | 40.2 | 1.07x | 1.05x (1.04x to 1.07x) |
| `bun cli.mjs` | 10.9 | 1.10x | 1.00x |
| `bun cli.cjs` | 10.8 | 1.10x | 1.00x (0.98x to 1.01x) |
| `bun cli-pre.mjs` (precompiled, `argmate/engine`) | 10.4 | 1.06x | 0.96x (0.94x to 0.98x) |
| `bun build --compile` binary | 11.4 | 1.16x | 1.06x (1.04x to 1.07x) |
| `bun build --compile --bytecode` binary | 9.8 | 1.00x | 0.91x (0.90x to 0.92x) |

The build made the snapshot from the bundle with `node --build-snapshot`. The output is the same as the output of the bundle in all the commands. So the library is snapshot safe (1E).

The snapshot does not help. Node reads the heap and deserializes it, which means that Node turns the stored form into objects again. The read and the deserialize cost more than the load and the first parse of a 24.0 KB bundle. The process from the snapshot needs 1.07x as long as the best Node command, `node cli-pre.mjs`.

The bundle run by Bun needs 1.11x as long as a binary of Bun with bytecode (10.9 ms against 9.8 ms). A binary without bytecode needs 1.05x as long as the bundle run by Bun (11.4 ms against 10.9 ms). So the README gets a recipe for the users of Bun who ship a binary. The recipe uses `--bytecode`.

The same program precompiled (the config made at build time, `argmate/engine`) has a shorter time on both runtimes. A Node process of the bundle needs 1.01x as long as the precompiled Node process (38.2 ms against 37.7 ms). A Bun process of the bundle needs 1.05x as long as the precompiled Bun process (10.9 ms against 10.4 ms).

The whole process takes about 38 ms on Node and about 10 ms on Bun. So the cold start of the library takes about 1 part in 20 of the time of a Node process. The cold start of the library takes about 1 part in 5 of the time of a Bun process. A Node process without the changes of the operation needs 1.01x as long as a Node process with the changes.

A first run of 100 processes on the same day gave 39.7 ms for the Node bundle and 11.7 ms for the Bun bundle. Every command changed in the same direction as in the run of the table. In the first run, the snapshot needed 1.03x as long as the Node bundle (40.7 ms against 39.7 ms). The bundle run by Bun needed 1.14x as long as the bytecode binary (11.7 ms against 10.3 ms).

The Node bundle needed 1.04x as long in the first run as in the run of the table (39.7 ms against 38.2 ms). The Bun bundle needed 1.07x as long in the first run as in the run of the table (11.7 ms against 10.9 ms). The machine changes from run to run, so compare only the rows of one run.
