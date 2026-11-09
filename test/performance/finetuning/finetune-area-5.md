# Area 5: How to measure the small parts honestly

A cold start is the time to load the library and make the first parse in a new process. Take a change of 20 µs on a cold start of 1500 µs. A cold start of 1520 µs needs 1.01x as long as a cold start of 1500 µs. The noise from one run to the next is larger than this difference. Noise is the random difference between two runs of the same code.

Every section in areas 1 to 4 needs a measurement that can see such a change. This area sets the method. The method runs 5C and 5D first, because their results show which sections deserve the time.

## 5A. Cold: 200 processes, median, `hrtime`

The measurement makes one parse in a new process. It does this 200 times for each variant. A variant is one change to a copy of the engine. The branch engine and the variant take turns. The branch engine is the full engine as it is on the branch. The result is the median and the 95 % bootstrap interval of the difference.

The median is the middle value of the sorted times. The 95 % bootstrap interval is a range that holds the true difference with a chance of 95 %. The measurement finds the range by resampling the 200 times many times.

The timer is `process.hrtime.bigint()` (3D). The measurement gives the load and the first parse as two numbers, because a change can move one and not the other. The load is the time to import the bundle. A bundle is the built JavaScript file of an engine. The first parse is the time of the first parse call.

Each process parses one workload. A workload is a fixed input for the parser. There are five workloads.

- `plain` has arguments and no config.
- `config` is a typical CLI with 8 parameters.
- `precompiled` is `config` with the config compiled at build time.
- `files` is a shell glob expanded to 500 files.
- `groups` is short flags in groups.

A row of a result table is one workload on one runtime. A runtime is Node or Bun.

The reason for this method is that a new process has the noise of the operating system. Examples are the page cache, the CPU frequency and other processes. With 200 runs and the median, two measurements of the same code give times with a ratio of about 1.01x. The interval shows if a difference is real. The engines take turns, so a drift of the machine during the run affects both engines in the same way. A drift is a slow change of the speed of the machine.

To try it, use `../engineCold/run.js`. This script makes the cold measurement for the full engine against the mini engine. The finetuning harness is a copy of this script. The copy takes two bundle folders, the branch engine and a variant, in place of the full engine and the mini engine. A bundle folder holds the bundle files of one engine. The copy prints the same table.

Run the harness on both runtimes. Make sure that nothing else runs on the machine and that `caffeinate -i` is on.

The measurement gives the load in µs, the first parse in µs, and the difference with its interval.

The decision rule is that a number is real if its interval does not include zero. If the interval includes zero, the row says "no change".

## 5B. Hot: the existing harness

Hot is the time of one parse after the same process made many parses. By then the JIT compiler has optimized the engine. The JIT compiler turns code that runs often into fast machine code.

The script `../engineHot/run.js` measures this time. It runs 10 rounds of 400 ms for each variant, and each round has its own process. The branch engine and the variant take turns. The result is the median and the interval.

The script stays as it was, except that it takes two bundle folders, as in 5A.

The reason is that a change for cold start must not cost hot speed. The hot number is also the number that the comparison with other libraries shows.

To try it, use the same copy as in 5A, with the hot script.

The measurement gives the time of a parse in ns, and the difference with its interval, for all five workloads.

The decision rule is the same as in 5A. Record a hot loss outside the interval on any workload. Then weigh the loss against the cold gain, with the decision rule of the section.

## 5C. First-parse breakdown by phase

The section uses a debug build of the engine. The build has `hrtime` marks between the phases of the first parse. The phases are the import, the config preprocessing and the call into the engine. The other phases are the setup (this includes the output copy), the token loop, the late checks and the return. The build runs once in a new process. The measurement repeats this 200 times, on both runtimes, for both `config` and `plain`.

The first parse takes 1000 µs. A hot parse takes 5 µs. Without the breakdown, each section in area 2 is a guess about which piece is the largest. With the breakdown, three pieces each get a number before the test of any change. These pieces are the preprocessing (2D), the first executions of the regexes (2A) and the compilation of the engine (1F).

A regex (regular expression) is a pattern that the code uses to match text, for example `/^\d+$/`.

To try it, use a script in this folder. The script does these steps.

1. Copy `src/argEngine.ts` and `src/compileConfig.ts`.
2. Insert `marks.push(process.hrtime.bigint())` at the phase borders, with a small text replacement.
3. Build the copy.
4. Run the cold measurement.

The script prints the marks as the time in µs between each mark and the next mark. A wrapper on `RegExp.prototype.exec` and `test` counts and times the first executions of the regexes. The wrapper records the pattern source and the time of the first call only.

The measurement gives the time of each phase in µs. It also gives a list of regexes, with the time of the first execution of each regex in µs. It does this on both runtimes.

No change comes out of this section. The result is the order in which the other sections run. The section for the largest phase runs first.

## 5D. Optimization and deoptimization during the first parse

V8 is the part of Node that runs JavaScript. The command `node --trace-opt --trace-deopt cold.js full config` prints when V8 optimizes a function. It also prints when V8 throws the optimized code away. This second event is a deoptimization (deopt). A deopt in the engine during a normal parse is a sign of a type that changes. Two examples are a property that is sometimes a string and sometimes undefined, and an array that holds strings and then a number.

A deopt costs the compilation that V8 threw away and the compilation that follows. This cost is extra time at cold start. A deopt also shows a place where the code is polymorphic. Polymorphic code handles values of more than one type at the same place. So the code is slower when hot too.

To try it, run the trace on all five workloads. Use a loop of 100 parses in one process, so the engine reaches the optimizing tier. A tier is a level of compilation, and the optimizing tier makes the fastest code. Read every line that names `argEngine` or a helper of `argEngine`.

Bun has no such flag. `BUN_JSC_dumpOptimizationStats` and `--smol` do not give the same result. So this test runs on Node only. The hot benchmark checks the finding on Bun.

The measurement gives a list of deopt reasons, each with the line in the engine. The list can be empty.

Each deopt gets a variant that removes its cause. The measurement of the variant is the same as for a section of area 4. An empty list is a result. Write it in the results table.

## 5E. The regex interpreter tier

V8 runs a regex in a bytecode interpreter for the first executions of the regex. A bytecode interpreter reads a compact form of the regex and runs it step by step. After a number of ticks, V8 compiles the regex to native code. A tick is one execution of the regex. Native code is machine code that the CPU runs directly.

The flag `--regexp-tier-up-ticks` sets the number of ticks. The default is 1 in current V8. So V8 compiles the regex to native code after the first execution. This switch from the interpreter to native code is the tier-up. A higher value keeps a regex in the interpreter for more executions.

The flag `--no-regexp-tier-up` keeps everything in the interpreter. The flags `--regexp-interpret-all` and `--no-enable-experimental-regexp-engine` change the regex engine. The difference between the settings, on the cold first parse, is the cost of the compilation of the regexes. Section 2A needs this number.

Without this measurement, the share of the first parse that is regex compilation is a guess. With the measurement, 2A knows its ceiling before the work replaces any regex. A ceiling is the largest gain that a section can give.

To try it, run `node --regexp-tier-up-ticks=1000 cold.js full config` against the default settings. Run each setting 200 times. Run `node --no-regexp-tier-up` as a third point. Bun has no equivalent flag. So the micro benchmark of 2B gives the number for Bun. A micro benchmark times one small piece of code alone.

The measurement is the cold first parse under each flag.

The result is a number for 2A. If the interpreter run gives a faster first parse, that result supports few and small regexes. It also argues against the `u` flag where the code does not need the flag. This can happen, because the native compilation of a regex is work too.

## Results

| Section | Runtime | Result | Date, commit, machine |
|---|---|---|---|
| 5A | both | The harness is ready (`run.js`, `cold.js`). An A/A test measures an identical copy against the branch engine, so the true difference is 0. The A/A test used 200 processes and 5 workloads. 0 of 10 cold rows and 0 of 10 hot rows are outside noise. 1 of the 30 single intervals did not include 0. A count of 1 fits the 95 % level. On Node the interval of the total is about 25 µs. A total that is 25 µs above the total of the branch engine has the ratio 1.01x. On Bun the interval is about 50 µs, which gives the ratio 1.02x. A variant with 3000 loop iterations added is slower in all 4 cold rows. The variant needs 1.04x - 1.05x as long as the branch engine on Node and 1.09x - 1.14x on Bun. The harness does not measure a variant that fails a test | 2026-11-01, `1152549`, M1 Pro |
| 5B | both | The harness is ready (`hot.js`, 10 rounds of 400 ms). In the A/A test, the end of the interval is at 1.01x compared to the time of the branch engine on Node, and at 1.02x - 1.03x on Bun. With 5 rounds, a machine that stopped for a short time gave intervals of millions of ns. So use 10 rounds, and run a row with a wide interval again | 2026-11-01, `1152549`, M1 Pro |
| 5C | both | The phase table is below. The compilation of the engine takes 515 to 600 µs. The preprocessing takes 550 to 600 µs. The first token loop takes 200 to 375 µs. The run files are `runs/5C-phases.md` and `runs/5C-regexes.md` | 2026-11-02, `1152549`, M1 Pro |
| 5D | node | The deopt list is below. It shows one deopt in the engine | 2026-11-02, `1152549`, M1 Pro |
| 5E | node | On `config`, the first parse with the default settings (1469 µs) needs 1.23x as long as the first parse with `--regexp-interpret-all`. On `plain`, the ratio is 1.22x (952 µs for the default settings). The difference between the two times is the cost of the regex tier-up. The run files are `runs/5E-config.md` and `runs/5E-plain.md` | 2026-11-02, `1152549`, M1 Pro |

### 5C phase table

The times are in µs. Each time is the median of 200 new processes, from `node phases.js` (`runs/5C-phases.md`). The border between `call into engine` and `setup` is the first line of the engine. So `call into engine` is the compilation of the engine function on its first call. The timestamps cost a little time. So the totals are a little above the cold table.

The phases are as follows.

- `import` is the load of the bundle.
- `preprocessing` is the function `configPreprocessing`. It is close to 0 with no config and for `precompiled`.
- `call into engine` is the time from the end of the preprocessing to the first line of the engine.
- `setup` is the time from the entry of the engine to the first token. It includes the copy of the output.
- `token loop` is the loop that reads the tokens.
- `late checks` is the time from the end of the token loop to the alias and inflate step.
- `return` is the alias and inflate step and the return of the result.
- `total` is the import plus the first parse.

| Runtime | Workload | import | preprocessing | call into engine | setup | token loop | late checks | return | total |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| node | config | 810.5 | 601.4 | 514.0 | 10.3 | 316.9 | 21.5 | 0.3 | 2289.8 |
| node | plain | 811.4 | 1.8 | 532.8 | 20.9 | 374.1 | 3.7 | 0.2 | 1749.8 |
| node | precompiled | 567.0 | 1.3 | 528.5 | 7.8 | 339.9 | 20.9 | 0.3 | 1465.2 |
| bun | config | 868.3 | 550.9 | 580.0 | 11.4 | 204.1 | 17.3 | 0.3 | 2259.1 |
| bun | plain | 861.7 | 2.1 | 620.5 | 25.6 | 223.0 | 6.7 | 0.3 | 1744.8 |
| bun | precompiled | 504.4 | 0.7 | 608.4 | 12.5 | 250.5 | 17.3 | 0.3 | 1397.9 |

The table gives four findings.

- The compilation of the engine on its first call is the largest single piece after the load. It takes about 515 to 535 µs on Node and 580 to 620 µs on Bun, for `config`, `plain` and `precompiled`. The late checks run in 4 to 21 µs. So most of the compilation is code that a given parse does not run. Section 1F covers this compilation.
- The function `configPreprocessing` takes 550 to 600 µs for `config`. This time is the compilation of a function of 330 lines plus its first run. Section 2D covers this function.
- The first token loop takes 200 to 375 µs for 3 to 15 tokens. A hot parse takes 3 to 8 µs. The regexes are a large part of the loop time (see the tables below and 5E).
- The import takes 810 µs for `argmate` and 567 µs for `argmate/engine` on Node. The bundle `argmate/engine` has 11.7 KB. These 11.7 KB are about half of the load. Section 1A covers the load.

The tables below list the regexes that the first parse touches (`runs/5C-regexes.md`). A wrapper times the regexes, so the sums are a little above the real cost.

| Runtime | Workload | Regexes touched | Sum of first executions, µs |
|---|---|---:|---:|
| node | plain | 8 | 186 |
| node | config | 14 | 243 |
| bun | plain | 8 | 162 |
| bun | config | 14 | 222 |

The largest first executions on Node are in this list.

- `paramLong` takes 47 µs.
- `kebab2camel` (`/-(.)/gsu`) takes 43 µs. It is in `plain` because of `--dry-run`.
- `autoNumber` takes 41 µs.
- `validTypes` takes 31 µs.
- `listDeviders` takes 28 µs.
- `bool` takes 27 µs.
- `onDisk` takes 25 µs.
- `paramShort` takes 18 to 21 µs.

### 5D deopt list

The command is `node --trace-opt --trace-deopt deopt.js <workload>`. Each workload gets 20000 parses. The bundle is not minified, so it keeps its long names and its white space.

The table uses these terms.

- Maglev is an optimizing tier of V8.
- A Smi is a small integer that V8 stores without an object. A heap number is a number that V8 stores as an object, for example the float `1.5`.
- OSR is on-stack replacement. It is a switch to optimized code while a loop still runs.

| Workload | Function | Reason | Line | Fixed in |
|---|---|---|---|---|
| config, precompiled | `argEngine` (Maglev) | not a Smi | Not found. The input has the float `1.5` for `ratio`. So a value that was a Smi is a heap number one time | Not a defect. There is one deopt, because the data changes the type |
| all | the loop of `deopt.js` | prepare for OSR, insufficient type feedback for a compare | The harness, not the engine | Not applicable |

The trace shows no other deopt. The engine has no polymorphism that makes V8 throw the optimized code away. So area 4 has nothing to fix here.
