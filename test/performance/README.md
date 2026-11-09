# Performance tests

Each folder is one test. `run.js` in the folder is the one way to start it, and it writes `results.md` in the folder: what was measured, the machine, the versions and the tables.

| Folder | What it measures |
|---|---|
| `engineSize/` | The size of the bundles of the full and the mini engine |
| `engineHot/` | Full and mini: many parses in one process, after the JIT compiler has optimized the engine |
| `engineCold/` | Full and mini: load and first parse in a new process, measured inside the process |
| `engineCli/` | Full and mini: the wall time of a whole CLI process, with Node, Bun and `bun build --compile` |
| `compareLibs/` | argmate and 11 other parsers: what they give for common forms, their size, and the hot, cold and CLI speed |
| `argInfoOnError/` | What the setting `argInfoOnError` costs a parse with no error: the hot path with the help made on an error or up front, and a precompiled config with and without the help rows, hot and when loaded |
| `shared/` | Not a test. The workloads, the build of argmate, the check that full and mini give the same results, and the statistics |

## How to run

```sh
./run.sh                    # all tests, about 20 minutes
./run.sh compareLibs        # only the folders given
node engineHot/run.js 4     # one test with fewer rounds: a quick look
```

Each `run.js` builds argmate from `src/` as it is now, also from changes that are not committed. `compareLibs` installs the parsers in `compareLibs/node_modules` the first time. On macOS `run.sh` uses `caffeinate -i`: when the machine sleeps, the processes stop and the numbers are not correct. Other work on the machine makes the numbers jump. Do not run two tests at the same time.

None of the files are `*.test.*` files, so `bun test` does not run them.

## Method

- full and mini (and the parsers in `compareLibs`) must give the same result for the workload before they are timed. `shared/check.js` and `compareLibs/run.js` check this.
- Each measurement runs in its own process. The engines or parsers take turns, so a change in the load of the machine hits all of them.
- The tables have medians. "95 % interval" is a bootstrap interval of the difference. An interval that includes 0 means: no difference was found.

## Summary of the run of 2026-10-25

Apple M1 Pro, Node v22.23.3, Bun v1.4.3. Each number is a factor of argmate/mini: 1.000× is the same, 1.100× is 10 % slower or larger, 0.900× is 10 % faster. The full tables are in the `results.md` files.

### Full and mini engine

These numbers are from before the last performance changes in the engines. Run `./run.sh engineHot engineCold engineCli engineSize` to update them.

| | Real CLI process | Load + first parse (cold) | Many parses (hot) | Bundle size |
|---|---:|---:|---:|---:|
| argmate/mini | 1.000× | 1.000× | 1.000× | 1.000× |
| argmate | 0.998× to 1.012× | 1.066× to 1.234× | 1.206× to 2.246× | 1.114× (gzip 1.111×) |
| argmate/engine, precompiled | 0.973× to 0.981× | | | 0.515× |
| no parser at all | 0.889× to 0.988× | | | |

- **In a real CLI the full engine and mini are the same, within 1.2 %.** All of argmate costs a Bun CLI 1.0 to 1.4 ms. With Node the cost is smaller than the noise in this run (-0.6 to 0.4 ms). The start of the runtime takes 10 to 40 ms.
- When cold, the load and first parse of full take 7 to 23 % longer than mini.
- When hot, mini is 1.2 to 2.2 times faster. Only a program that parses many times in one process gets this.
- A precompiled config (`argmate/engine`) gives more than mini does: 0.973× to 0.981×.

### argmate and other parsers

v1 is argmate as it is now in `src/`, on the way to version 1. v0.8 is the published argmate 0.8.5. The rows are in the order of the Node CLI, and each number is a factor of v1 mini. "Behaviour" is how many of the 10 common inputs (in `compareLibs/results.md`) the parser reads as the user means them.

| Parser | Behaviour | Node CLI | Bun CLI | Node cold | Node hot | Install size |
|---|---:|---:|---:|---:|---:|---:|
| v1 mini (precompiled) | 9/10 | 0.998× | 0.982× | 0.853× | 0.360× | 120 KB |
| v1 (precompiled) | 10/10 | 0.999× | 0.993× | 0.979× | 0.697× | 120 KB |
| v1 mini | 9/10 | 1.000× | 1.000× | 1.000× | 1.000× | 120 KB |
| util.parseArgs | 10/10 | 1.002× | 1.044× | 2.791× | 2.164× | built in |
| v1 | 10/10 | 1.004× | 1.010× | 1.104× | 1.272× | 120 KB |
| v0.8 mini (precompiled) | 6/10 | 1.013× | 1.000× | 1.442× | 0.273× | 60175 KB, 35 packages |
| v0.8 mini | 6/10 | 1.013× | 0.993× | 1.526× | 0.694× | 60175 KB, 35 packages |
| v0.8 | 8/10 | 1.020× | 1.000× | 1.610× | 1.240× | 60175 KB, 35 packages |
| mri | 6/10 | 1.022× | 0.954× | 1.907× | 0.805× | 13 KB |
| v0.8 (precompiled) | 8/10 | 1.026× | 1.008× | 1.557× | 0.824× | 60175 KB, 35 packages |
| arg | 7/10 | 1.048× | 1.001× | 2.292× | 0.553× | 13 KB |
| sade | 6/10 | 1.064× | 1.053× | 3.021× | 2.598× | 44 KB, 2 packages |
| nopt | 8/10 | 1.084× | 1.484× | 4.434× | 3.062× | 31 KB, 2 packages |
| yargs-parser | 10/10 | 1.161× | 1.519× | 7.292× | 17.4× | 84 KB |
| commander | 10/10 | 1.232× | 1.671× | 9.882× | 4.445× | 203 KB |
| minimist | 8/10 | 1.284× | 0.984× | 2.804× | 1.899× | 53 KB |
| @oclif/core | 10/10 | 2.339× | 4.725× | 42.9× | 4.657× | 2029 KB, 38 packages |
| yargs | 10/10 | 2.450× | 2.988× | 46.7× | 105× | 593 KB, 21 packages |
| meow | 10/10 | 2.453× | 2.817× | 45.0× | 3556× | 401 KB |

- **In a real CLI, v1 is the fastest parser that reads all 10 inputs right.** With Node all of v1 costs 1.2 to 1.4 ms, v0.8 1.8 to 2.3 ms, `util.parseArgs` 1.4 ms, commander 10 ms and oclif, yargs and meow 54 to 58 ms. With Bun the small parsers (v1, mri, arg, minimist) cost less than 0.7 ms each.
- **v1 against v0.8:** v1 reads 10 of 10 inputs right (mini 9), v0.8 8 (mini 6). When cold, v1 is faster: with Node 0.85× to 1.10× against 1.44× to 1.61× for v0.8. When hot, v0.8 mini is faster than v1 mini (0.694× and 0.273× precompiled), because it reads fewer forms; v1 full is about the same as v0.8 full (1.272× against 1.240×). v0.8 installs 60 MB in 35 packages (a compiled CLI and 3 dependencies); v1 is one package of 120 KB.
- **v1 mini with a precompiled config is the fastest v1 in each test:** 0.360× when hot with Node.
- mri and arg are faster when hot, but they read 4 and 3 of the 10 inputs wrong (for example `-p8080` or `--port -5`).
- yargs builds a new instance for each parse, and meow reads `package.json` from the disk for each call. That is why they are so slow when hot.
- The v0.8 adapters give the engine a copy of the args and a new config for each parse: v0.8 empties the args array of the caller (issue #13) and changes the config. A real CLI parses one time, so there it does not matter.
- **minimist with Node:** a process with minimist is 12 ms slower than the import and parse inside it show. When an ES module imports minimist, Node takes about 13 ms more than when a CommonJS file requires it (50.0 ms against 34.4 ms; arg, also CommonJS, has no such cost). All adapters import from an ES module, so a CommonJS CLI with minimist is faster than the table shows.

What the libraries do in addition (help, version, validation) is in the notes of the size table in `compareLibs/results.md`. A parser that does more is slower for a reason, not only because of its code.
