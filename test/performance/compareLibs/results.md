# Compare parsers

argmate and other parsers for the command line of Node, with the same CLI for each one. The setup of each parser is in `libs.js`.

- Machine: Apple M1 Pro
- Node v22.23.3, Bun v1.4.3
- argmate v0.9.0, branch `v091`, `8daa5da` + changes that are not committed
- Date: 2026-10-25 20:03

## Summary: compared to argmate/mini

Each time as a factor of the time of argmate/mini: 1.000× is the same time, 2.000× is two times slower, 0.500× is two times faster. The rows are in the order of the node CLI. *hot* is one parse in a process that parses many times, *cold* is the import and the first parse in a new process, *CLI* is the wall time of the whole process, with the start of the runtime. The tables below have the times.

The workload: `--name foo -p 8080 -d --tag a --tag b a.txt b.txt`. All parsers give the expected result for the workload, with node and bun.

| Parser | node hot | bun hot | node cold | bun cold | node CLI | bun CLI |
|---|---:|---:|---:|---:|---:|---:|
| argmate/mini | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× |
| util.parseArgs | 2.054× | 2.162× | 2.278× | 1.409× | 1.007× | 0.956× |
| argmate | 1.713× | 2.098× | 0.970× | 1.172× | 1.022× | 0.986× |
| arg | 0.600× | 0.701× | 1.894× | 0.702× | 1.034× | 0.958× |
| mri | 0.815× | 1.095× | 1.495× | 0.708× | 1.044× | 0.995× |
| sade | 2.608× | 3.282× | 2.543× | 1.394× | 1.090× | 1.004× |
| argmate (precompiled) | 0.806× | 1.530× | 1.137× | 1.095× | 1.102× | 1.077× |
| yargs-parser | 17.1× | 16.0× | 5.687× | 5.092× | 1.158× | 1.487× |
| nopt | 2.987× | 4.567× | 3.398× | 4.700× | 1.196× | 1.588× |
| minimist | 1.841× | 2.100× | 2.724× | 0.913× | 1.307× | 0.978× |
| commander | 4.419× | 6.947× | 7.966× | 6.315× | 1.310× | 1.680× |
| @oclif/core | 4.628× | 9.635× | 32.9× | 30.3× | 2.478× | 4.486× |
| yargs | 104× | 115× | 39.2× | 18.8× | 2.484× | 2.754× |
| meow | 3495× | 54.8× | 46.0× | 15.3× | 2.523× | 2.660× |

## Behaviour: what each parser gives for common inputs

Each column is one input on the command line, with node. The row *Expected* is the right result. ✅ means the parser gives it, ❌ means it gives something else (see the list below the table). This is not about speed: it shows if a parser reads the input the way a user means it.

| Parser | `--name foo` | `--name=foo` | `-p 8080` | `-p8080` | `-dp8080` | `--tag a --tag b` | `--debug --no-debug` | `--port -5` | `-- --name foo` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| *Expected* | name = "foo" | name = "foo" | port = 8080 | port = 8080 | debug = true, port = 8080 | tag = ["a","b"] | debug = false | port = -5 | name = undefined, _ = ["--name","foo"] |
| argmate | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| argmate (precompiled) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| argmate/mini | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| util.parseArgs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| minimist | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| mri | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| yargs-parser | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| yargs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| commander | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| meow | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| arg | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| nopt | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| sade | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| @oclif/core | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

What the parsers with ❌ give:

- argmate/mini, `-p8080`: port = -8
- argmate/mini, `-dp8080`: debug = true, port = -8
- argmate/mini, `--debug --no-debug`: debug = true
- minimist, `-dp8080`: debug = true, port = undefined
- minimist, `--port -5`: port = true
- mri, `-p8080`: port = true
- mri, `-dp8080`: debug = true, port = true
- mri, `--port -5`: port = true
- arg, `-p8080`: error: option requires argument (but was followed by another short argument): -p
- arg, `-dp8080`: error: option requires argument (but was followed by another short argument): -p
- arg, `--debug --no-debug`: debug = true
- nopt, `-p8080`: port = undefined
- nopt, `-dp8080`: debug = false, port = undefined
- sade, `-p8080`: port = true
- sade, `-dp8080`: debug = true, port = true
- sade, `--port -5`: port = true

## Size

The package and all packages it depends on, as installed. The size of argmate is the `unpackedSize` of `npm pack`: all entry points, ESM, CommonJS and types.

| Parser | Version | Packages | Install size | Note |
|---|---|---:|---:|---|
| argmate | 0.9.0 (this branch) | 1 | 117 KB |  |
| argmate (precompiled) | 0.9.0 (this branch) | 1 | 117 KB | The config is compiled at build time with `precompileConfig()`, and the CLI imports `argmate/engine` |
| argmate/mini | 0.9.0 (this branch) | 1 | 117 KB |  |
| util.parseArgs | node v22.23.3 | 0 | 0 KB | Built into Node and Bun. It has no number type, thus the adapter converts `port` with `Number()` |
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

The workload: `--name foo -p 8080 -d --tag a --tag b a.txt b.txt`. All parsers give the expected result for the workload, with node and bun. The median time of one parse, of 1 rounds of 400 ms; each round runs in its own process. × is the time compared to argmate. This is what a program gets that parses many times in one process. A CLI parses one time, thus see the next two tables for a CLI.

| Parser | node | | bun | |
|---|---:|---:|---:|---:|
| arg | 1162 ns | 0.4 × | 610 ns | 0.3 × |
| argmate (precompiled) | 1563 ns | 0.5 × | 1330 ns | 0.7 × |
| mri | 1580 ns | 0.5 × | 952 ns | 0.5 × |
| argmate/mini | 1938 ns | 0.6 × | 869 ns | 0.5 × |
| argmate | 3320 ns | 1.0 × | 1824 ns | 1.0 × |
| minimist | 3568 ns | 1.1 × | 1826 ns | 1.0 × |
| util.parseArgs | 3981 ns | 1.2 × | 1879 ns | 1.0 × |
| sade | 5054 ns | 1.5 × | 2853 ns | 1.6 × |
| nopt | 5789 ns | 1.7 × | 3970 ns | 2.2 × |
| commander | 8563 ns | 2.6 × | 6038 ns | 3.3 × |
| @oclif/core | 8967 ns | 2.7 × | 8375 ns | 4.6 × |
| yargs-parser | 33099 ns | 10.0 × | 13919 ns | 7.6 × |
| yargs | 201501 ns | 60.7 × | 99791 ns | 54.7 × |
| meow | 6772484 ns | 2040.2 × | 47657 ns | 26.1 × |

## Cold: import and first parse in a new process

The workload: `--name foo -p 8080 -d --tag a --tag b a.txt b.txt`. All parsers give the expected result for the workload, with node and bun. Measured inside the process with `performance.now()`: the time to import the parser and the time of the first parse. The median of 2 processes for each parser. This is what the parser costs a CLI, without the start of the runtime.

| Parser | node: import | node: first parse | node: total | bun: import | bun: first parse | bun: total |
|---|---:|---:|---:|---:|---:|---:|
| argmate | 0.81 ms | 0.80 ms | 1.61 ms | 0.82 ms | 0.89 ms | 1.72 ms |
| argmate/mini | 0.89 ms | 0.77 ms | 1.66 ms | 0.70 ms | 0.77 ms | 1.46 ms |
| argmate (precompiled) | 1.40 ms | 0.49 ms | 1.88 ms | 1.08 ms | 0.53 ms | 1.60 ms |
| mri | 2.25 ms | 0.22 ms | 2.48 ms | 0.74 ms | 0.30 ms | 1.04 ms |
| arg | 2.65 ms | 0.49 ms | 3.14 ms | 0.64 ms | 0.39 ms | 1.03 ms |
| util.parseArgs | 3.14 ms | 0.64 ms | 3.78 ms | 1.98 ms | 0.09 ms | 2.06 ms |
| sade | 3.31 ms | 0.91 ms | 4.22 ms | 1.24 ms | 0.80 ms | 2.04 ms |
| minimist | 3.69 ms | 0.83 ms | 4.52 ms | 0.67 ms | 0.67 ms | 1.34 ms |
| nopt | 4.67 ms | 0.96 ms | 5.63 ms | 6.05 ms | 0.83 ms | 6.89 ms |
| yargs-parser | 7.66 ms | 1.77 ms | 9.43 ms | 5.84 ms | 1.62 ms | 7.46 ms |
| commander | 11.23 ms | 1.98 ms | 13.21 ms | 7.95 ms | 1.30 ms | 9.25 ms |
| @oclif/core | 52.91 ms | 1.57 ms | 54.48 ms | 42.25 ms | 2.17 ms | 44.42 ms |
| yargs | 59.57 ms | 5.37 ms | 64.94 ms | 22.39 ms | 5.19 ms | 27.58 ms |
| meow | 37.03 ms | 39.17 ms | 76.21 ms | 18.57 ms | 3.87 ms | 22.44 ms |

## The real CLI: a whole process

The workload: `--name foo -p 8080 -d --tag a --tag b a.txt b.txt`. All parsers give the expected result for the workload, with node and bun. The wall time of a process that imports the parser, parses the args and prints the result. 2 runs for each command; all 30 commands take turns. The baseline is the same process with no parser: node 37.97 ms, bun 11.77 ms. "The parser costs" is the median of the parser minus the median of the baseline.

| Parser | node: process | node: the parser costs (95 % interval) | bun: process | bun: the parser costs (95 % interval) |
|---|---:|---:|---:|---:|
| argmate/mini | 39.05 ms | 1.08 ms (-1.03 to 3.19) | 12.54 ms | 0.77 ms (-0.13 to 1.68) |
| util.parseArgs | 39.32 ms | 1.35 ms (-0.15 to 2.86) | 11.99 ms | 0.22 ms (-0.51 to 0.95) |
| argmate | 39.91 ms | 1.94 ms (-0.56 to 4.44) | 12.36 ms | 0.59 ms (-0.01 to 1.20) |
| arg | 40.37 ms | 2.40 ms (0.83 to 3.97) | 12.01 ms | 0.24 ms (-0.71 to 1.19) |
| mri | 40.76 ms | 2.79 ms (1.14 to 4.44) | 12.48 ms | 0.71 ms (0.08 to 1.35) |
| sade | 42.56 ms | 4.59 ms (1.89 to 7.29) | 12.59 ms | 0.82 ms (0.11 to 1.54) |
| argmate (precompiled) | 43.03 ms | 5.06 ms (-0.39 to 10.51) | 13.51 ms | 1.74 ms (0.02 to 3.46) |
| yargs-parser | 45.22 ms | 7.24 ms (5.40 to 9.09) | 18.64 ms | 6.88 ms (5.53 to 8.22) |
| nopt | 46.69 ms | 8.72 ms (4.58 to 12.86) | 19.91 ms | 8.15 ms (5.40 to 10.89) |
| minimist | 51.03 ms | 13.06 ms (11.40 to 14.72) | 12.26 ms | 0.50 ms (-0.20 to 1.20) |
| commander | 51.18 ms | 13.21 ms (10.89 to 15.53) | 21.06 ms | 9.30 ms (8.12 to 10.47) |
| @oclif/core | 96.76 ms | 58.79 ms (56.97 to 60.60) | 56.24 ms | 44.47 ms (42.86 to 46.09) |
| yargs | 97.02 ms | 59.05 ms (57.26 to 60.84) | 34.53 ms | 22.76 ms (21.98 to 23.55) |
| meow | 98.53 ms | 60.56 ms (59.04 to 62.08) | 33.36 ms | 21.59 ms (20.47 to 22.71) |
