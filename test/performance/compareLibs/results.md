# Compare parsers

argmate and other parsers for the command line of Node, with the same CLI for each one. v1 is argmate as it is now in `src/`, on the way to version 1. v0.8 is the published argmate 0.8.5. Each one with the full and the mini engine, and with a precompiled config. The setup of each parser is in `libs.js`.

- Machine: Apple M1 Pro
- Node v22.23.3, Bun v1.4.3
- argmate v0.9.0, branch `v091`, `14acca8` + changes that are not committed
- Date: 2026-10-25 23:44

## Summary: compared to v1 mini

Each time as a factor of the time of v1 mini: 1.000× is the same time, 2.000× is two times slower, 0.500× is two times faster. The rows are in the order of the node CLI. *hot* is one parse in a process that parses many times, *cold* is the import and the first parse in a new process, *CLI* is the wall time of the whole process, with the start of the runtime. The tables below have the times.

The workload: `--name foo -p 8080 -d --tag a --tag b a.txt b.txt`. All parsers give the expected result for the workload, with node and bun.

| Parser | node hot | bun hot | node cold | bun cold | node CLI | bun CLI |
|---|---:|---:|---:|---:|---:|---:|
| v1 mini (precompiled) | 0.360× | 0.508× | 0.853× | 0.859× | 0.998× | 0.982× |
| v1 (precompiled) | 0.697× | 0.810× | 0.979× | 0.961× | 0.999× | 0.993× |
| v1 mini | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× |
| util.parseArgs | 2.164× | 1.686× | 2.791× | 1.259× | 1.002× | 1.044× |
| v1 | 1.272× | 1.262× | 1.104× | 1.089× | 1.004× | 1.010× |
| v0.8 mini (precompiled) | 0.273× | 0.328× | 1.442× | 1.062× | 1.013× | 1.000× |
| v0.8 mini | 0.694× | 0.801× | 1.526× | 0.950× | 1.013× | 0.993× |
| v0.8 | 1.240× | 1.682× | 1.610× | 1.047× | 1.020× | 1.000× |
| mri | 0.805× | 0.812× | 1.907× | 0.709× | 1.022× | 0.954× |
| v0.8 (precompiled) | 0.824× | 1.186× | 1.557× | 1.004× | 1.026× | 1.008× |
| arg | 0.553× | 0.539× | 2.292× | 0.652× | 1.048× | 1.001× |
| sade | 2.598× | 2.571× | 3.021× | 1.321× | 1.064× | 1.053× |
| nopt | 3.062× | 3.456× | 4.434× | 4.901× | 1.084× | 1.484× |
| yargs-parser | 17.4× | 9.795× | 7.292× | 5.207× | 1.161× | 1.519× |
| commander | 4.445× | 5.386× | 9.882× | 5.875× | 1.232× | 1.671× |
| minimist | 1.899× | 1.602× | 2.804× | 0.858× | 1.284× | 0.984× |
| @oclif/core | 4.657× | 7.260× | 42.9× | 31.5× | 2.339× | 4.725× |
| yargs | 105× | 84.9× | 46.7× | 17.0× | 2.450× | 2.988× |
| meow | 3556× | 42.2× | 45.0× | 15.4× | 2.453× | 2.817× |

## Behaviour: what each parser gives for common inputs

Each column is one input on the command line, with node. The row *Expected* is the right result. ✅ means the parser gives it, ❌ means it gives something else (see the list below the table). This is not about speed: it shows if a parser reads the input the way a user means it.

| Parser | `--name foo` | `--name=foo` | `--name= abc` | `-p 8080` | `-p8080` | `-dp8080` | `--tag a --tag b` | `--debug --no-debug` | `--port -5` | `-- --name foo` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| *Expected* | name = "foo" | name = "foo" | name = "", _ = ["abc"] | port = 8080 | port = 8080 | debug = true, port = 8080 | tag = ["a","b"] | debug = false | port = -5 | name = undefined, _ = ["--name","foo"] |
| v1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| v1 mini | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| v1 (precompiled) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| v1 mini (precompiled) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| v0.8 | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| v0.8 mini | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| v0.8 (precompiled) | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| v0.8 mini (precompiled) | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| util.parseArgs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| minimist | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| mri | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| yargs-parser | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yargs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| commander | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| meow | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| arg | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| nopt | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| sade | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| @oclif/core | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

What the parsers with ❌ give:

- v1 mini, `--debug --no-debug`: debug = true
- v1 mini (precompiled), `--debug --no-debug`: debug = true
- v0.8, `--name= abc`: name = "abc", _ = []
- v0.8, `-dp8080`: error: Unsupported format: '-dp8080'. Did you miss a dash at the beginning?
- v0.8 mini, `--name= abc`: name = "abc", _ = []
- v0.8 mini, `-p8080`: port = -8
- v0.8 mini, `-dp8080`: debug = true, port = -8
- v0.8 mini, `--debug --no-debug`: debug = true
- v0.8 (precompiled), `--name= abc`: name = "abc", _ = []
- v0.8 (precompiled), `-dp8080`: error: Unsupported format: '-dp8080'. Did you miss a dash at the beginning?
- v0.8 mini (precompiled), `--name= abc`: name = "abc", _ = []
- v0.8 mini (precompiled), `-p8080`: port = -8
- v0.8 mini (precompiled), `-dp8080`: debug = true, port = -8
- v0.8 mini (precompiled), `--debug --no-debug`: debug = true
- minimist, `-dp8080`: debug = true, port = undefined
- minimist, `--port -5`: port = true
- mri, `--name= abc`: name = "abc", _ = []
- mri, `-p8080`: port = true
- mri, `-dp8080`: debug = true, port = true
- mri, `--port -5`: port = true
- arg, `-p8080`: error: option requires argument (but was followed by another short argument): -p
- arg, `-dp8080`: error: option requires argument (but was followed by another short argument): -p
- arg, `--debug --no-debug`: debug = true
- nopt, `-p8080`: port = undefined
- nopt, `-dp8080`: debug = false, port = undefined
- sade, `--name= abc`: name = "abc", _ = []
- sade, `-p8080`: port = true
- sade, `-dp8080`: debug = true, port = true
- sade, `--port -5`: port = true

## Size

The package and all packages it depends on, as installed. The size of argmate is the `unpackedSize` of `npm pack`: all entry points, ESM, CommonJS and types.

| Parser | Version | Packages | Install size | Note |
|---|---|---:|---:|---|
| v1 | 0.9.0 (this branch) | 1 | 120 KB |  |
| v1 mini | 0.9.0 (this branch) | 1 | 120 KB |  |
| v1 (precompiled) | 0.9.0 (this branch) | 1 | 120 KB | The config is compiled at build time with `precompileConfig()`, and the CLI imports the engine only |
| v1 mini (precompiled) | 0.9.0 (this branch) | 1 | 120 KB | The config is compiled at build time with `precompileConfig()`, and the CLI imports the engine only |
| v0.8 | argmate@0.8.5 | 35 | 60175 KB |  |
| v0.8 mini | argmate@0.8.5 | 35 | 60175 KB |  |
| v0.8 (precompiled) | argmate@0.8.5 | 35 | 60175 KB | The config is compiled at build time with `precompileConfig()`, and the CLI imports the engine only |
| v0.8 mini (precompiled) | argmate@0.8.5 | 35 | 60175 KB | The config is compiled at build time with `precompileConfig()`, and the CLI imports the engine only |
| util.parseArgs | node v22.23.3 | 0 | 0 KB | Built into Node and Bun. It has no number type, so the adapter converts `port` with `Number()` |
| minimist | 1.2.8 | 1 | 53 KB |  |
| mri | 1.2.0 | 1 | 13 KB |  |
| yargs-parser | 22.0.0 | 1 | 84 KB |  |
| yargs | 18.2.0 | 21 | 593 KB | With the default `--help` and `--version` |
| commander | 15.0.0 | 1 | 203 KB | With the default `--help`. `port` uses the option parser `Number`, `tag` a function that collects the values |
| meow | 14.1.0 | 1 | 401 KB | With the default `--help` and `--version`. meow reads the nearest package.json for them |
| arg | 5.0.2 | 1 | 13 KB |  |
| nopt | 10.0.1 | 2 | 31 KB |  |
| sade | 1.8.1 | 2 | 44 KB | With the default `--help` and `--version`. sade uses mri |
| @oclif/core | 5.1.9 | 38 | 2029 KB | Only the parser of oclif (`Parser.parse`), not a full oclif command. It is async. `tag` has `multipleNonGreedy`, else it takes the files also |

## Hot: many parses in one process

The workload: `--name foo -p 8080 -d --tag a --tag b a.txt b.txt`. All parsers give the expected result for the workload, with node and bun. The median time of one parse, of 8 rounds of 400 ms; each round runs in its own process. × is the time compared to v1. This is what a program gets that parses many times in one process. A CLI parses one time, so see the next two tables for a CLI.

| Parser | node | | bun | |
|---|---:|---:|---:|---:|
| v0.8 mini (precompiled) | 516 ns | 0.2 × | 364 ns | 0.3 × |
| v1 mini (precompiled) | 681 ns | 0.3 × | 563 ns | 0.4 × |
| arg | 1047 ns | 0.4 × | 597 ns | 0.4 × |
| v0.8 mini | 1314 ns | 0.5 × | 888 ns | 0.6 × |
| v1 (precompiled) | 1321 ns | 0.5 × | 898 ns | 0.6 × |
| mri | 1524 ns | 0.6 × | 901 ns | 0.6 × |
| v0.8 (precompiled) | 1560 ns | 0.6 × | 1316 ns | 0.9 × |
| v1 mini | 1894 ns | 0.8 × | 1109 ns | 0.8 × |
| v0.8 | 2349 ns | 1.0 × | 1865 ns | 1.3 × |
| v1 | 2408 ns | 1.0 × | 1400 ns | 1.0 × |
| minimist | 3595 ns | 1.5 × | 1777 ns | 1.3 × |
| util.parseArgs | 4098 ns | 1.7 × | 1869 ns | 1.3 × |
| sade | 4920 ns | 2.0 × | 2851 ns | 2.0 × |
| nopt | 5798 ns | 2.4 × | 3833 ns | 2.7 × |
| commander | 8416 ns | 3.5 × | 5973 ns | 4.3 × |
| @oclif/core | 8819 ns | 3.7 × | 8051 ns | 5.8 × |
| yargs-parser | 32962 ns | 13.7 × | 10863 ns | 7.8 × |
| yargs | 199364 ns | 82.8 × | 94196 ns | 67.3 × |
| meow | 6733757 ns | 2796.2 × | 46822 ns | 33.4 × |

## Cold: import and first parse in a new process

The workload: `--name foo -p 8080 -d --tag a --tag b a.txt b.txt`. All parsers give the expected result for the workload, with node and bun. Measured inside the process with `performance.now()`: the time to import the parser and the time of the first parse. The median of 100 processes for each parser. This is what the parser costs a CLI, without the start of the runtime.

| Parser | node: import | node: first parse | node: total | bun: import | bun: first parse | bun: total |
|---|---:|---:|---:|---:|---:|---:|
| v1 mini (precompiled) | 0.78 ms | 0.33 ms | 1.11 ms | 0.82 ms | 0.39 ms | 1.21 ms |
| v1 (precompiled) | 0.80 ms | 0.47 ms | 1.28 ms | 0.86 ms | 0.50 ms | 1.35 ms |
| v1 mini | 0.61 ms | 0.69 ms | 1.30 ms | 0.64 ms | 0.76 ms | 1.40 ms |
| v1 | 0.62 ms | 0.81 ms | 1.44 ms | 0.67 ms | 0.85 ms | 1.53 ms |
| v0.8 mini (precompiled) | 1.64 ms | 0.23 ms | 1.88 ms | 1.17 ms | 0.31 ms | 1.49 ms |
| v0.8 mini | 1.40 ms | 0.57 ms | 1.99 ms | 0.67 ms | 0.66 ms | 1.33 ms |
| v0.8 (precompiled) | 1.64 ms | 0.38 ms | 2.03 ms | 0.96 ms | 0.44 ms | 1.41 ms |
| v0.8 | 1.39 ms | 0.70 ms | 2.10 ms | 0.69 ms | 0.77 ms | 1.47 ms |
| mri | 2.26 ms | 0.23 ms | 2.49 ms | 0.70 ms | 0.29 ms | 1.00 ms |
| arg | 2.50 ms | 0.48 ms | 2.99 ms | 0.57 ms | 0.34 ms | 0.92 ms |
| util.parseArgs | 3.05 ms | 0.57 ms | 3.64 ms | 1.68 ms | 0.09 ms | 1.77 ms |
| minimist | 2.77 ms | 0.77 ms | 3.66 ms | 0.54 ms | 0.65 ms | 1.21 ms |
| sade | 3.11 ms | 0.82 ms | 3.94 ms | 1.07 ms | 0.77 ms | 1.86 ms |
| nopt | 4.76 ms | 0.99 ms | 5.78 ms | 6.06 ms | 0.81 ms | 6.89 ms |
| yargs-parser | 7.76 ms | 1.73 ms | 9.51 ms | 5.78 ms | 1.48 ms | 7.32 ms |
| commander | 11.25 ms | 1.47 ms | 12.89 ms | 6.95 ms | 1.29 ms | 8.25 ms |
| @oclif/core | 54.28 ms | 1.53 ms | 55.98 ms | 42.08 ms | 2.04 ms | 44.23 ms |
| meow | 29.24 ms | 29.41 ms | 58.72 ms | 17.97 ms | 3.55 ms | 21.57 ms |
| yargs | 55.29 ms | 5.26 ms | 60.88 ms | 19.55 ms | 4.33 ms | 23.87 ms |

## The real CLI: a whole process

The workload: `--name foo -p 8080 -d --tag a --tag b a.txt b.txt`. All parsers give the expected result for the workload, with node and bun. The wall time of a process that imports the parser, parses the args and prints the result. 200 runs for each command; all 40 commands take turns. The baseline is the same process with no parser: node 37.72 ms, bun 10.99 ms. "The parser costs" is the median of the parser minus the median of the baseline.

| Parser | node: process | node: the parser costs (95 % interval) | bun: process | bun: the parser costs (95 % interval) |
|---|---:|---:|---:|---:|
| v1 mini (precompiled) | 38.95 ms | 1.22 ms (0.82 to 1.79) | 11.24 ms | 0.25 ms (0.07 to 0.48) |
| v1 (precompiled) | 38.98 ms | 1.25 ms (0.68 to 1.64) | 11.37 ms | 0.38 ms (0.14 to 0.61) |
| v1 mini | 39.01 ms | 1.28 ms (0.79 to 1.79) | 11.45 ms | 0.46 ms (0.23 to 0.68) |
| util.parseArgs | 39.09 ms | 1.37 ms (0.95 to 1.69) | 11.96 ms | 0.97 ms (0.77 to 1.12) |
| v1 | 39.15 ms | 1.43 ms (1.02 to 1.97) | 11.57 ms | 0.58 ms (0.42 to 0.79) |
| v0.8 mini (precompiled) | 39.51 ms | 1.79 ms (1.48 to 2.28) | 11.45 ms | 0.45 ms (0.27 to 0.79) |
| v0.8 mini | 39.52 ms | 1.79 ms (1.41 to 2.34) | 11.37 ms | 0.38 ms (0.11 to 0.60) |
| v0.8 | 39.77 ms | 2.05 ms (1.58 to 2.52) | 11.45 ms | 0.46 ms (0.30 to 0.69) |
| mri | 39.86 ms | 2.14 ms (1.75 to 2.51) | 10.92 ms | -0.07 ms (-0.22 to 0.17) |
| v0.8 (precompiled) | 40.01 ms | 2.29 ms (1.88 to 2.74) | 11.55 ms | 0.55 ms (0.25 to 0.71) |
| arg | 40.86 ms | 3.14 ms (2.65 to 3.69) | 11.47 ms | 0.47 ms (0.31 to 0.61) |
| sade | 41.49 ms | 3.77 ms (3.33 to 4.22) | 12.06 ms | 1.07 ms (0.92 to 1.24) |
| nopt | 42.28 ms | 4.55 ms (4.03 to 5.21) | 16.99 ms | 6.00 ms (5.77 to 6.19) |
| yargs-parser | 45.30 ms | 7.57 ms (7.14 to 7.97) | 17.40 ms | 6.41 ms (6.16 to 6.60) |
| commander | 48.06 ms | 10.34 ms (9.89 to 10.78) | 19.13 ms | 8.14 ms (8.03 to 8.28) |
| minimist | 50.09 ms | 12.36 ms (11.86 to 12.94) | 11.26 ms | 0.27 ms (-0.01 to 0.45) |
| @oclif/core | 91.25 ms | 53.53 ms (53.05 to 54.28) | 54.10 ms | 43.11 ms (42.55 to 43.92) |
| yargs | 95.59 ms | 57.86 ms (56.86 to 58.61) | 34.22 ms | 23.23 ms (22.88 to 23.48) |
| meow | 95.69 ms | 57.96 ms (57.19 to 59.26) | 32.26 ms | 21.27 ms (21.01 to 21.59) |
