# Engines: real CLI

The wall time of a whole process that parses `process.argv` with the workload `config` and prints the result. 3 runs for each command; all 15 commands take turns. `baseline` is the same CLI with no argmate: it only prints `process.argv`. "argmate in full" is `full - baseline`. "mini is faster by" is `1 - mini / full`, with a 95 % bootstrap interval. `bun --compile` is an executable made with `bun build --compile`. The first table is the time of the whole process compared to argmate/mini: 1.000× is the same time.

- Machine: Apple M1 Pro
- Node v22.23.3, Bun v1.4.3
- argmate v0.9.0, branch `v091`, `8daa5da` + changes that are not committed
- Date: 2026-10-25 20:02

| Import | node | bun | bun --compile |
|---|---:|---:|---:|
| argmate/mini | 1.000× | 1.000× | 1.000× |
| argmate | 1.000× | 0.974× | 0.973× |
| argmate/mini/engine, precompiled | 0.931× | 0.933× | 0.925× |
| argmate/engine, precompiled | 0.936× | 0.879× | 0.927× |
| no parser (baseline) | 0.923× | 0.867× | 0.865× |

| Runtime | Import | baseline | full | mini | argmate in full | mini is faster by (95 % interval) |
|---|---|---:|---:|---:|---:|---:|
| node | `argmate`, config at run time | 37.36 ms | 40.49 ms | 40.48 ms | 3.14 ms | 0.0 % (-10.2 to 2.8) |
| node | `argmate/engine`, precompiled | 37.36 ms | 37.89 ms | 37.69 ms | 0.53 ms | 0.5 % (-0.6 to 3.7) |
| bun | `argmate`, config at run time | 10.55 ms | 11.86 ms | 12.17 ms | 1.31 ms | -2.6 % (-48.7 to 9.9) |
| bun | `argmate/engine`, precompiled | 10.55 ms | 10.70 ms | 11.36 ms | 0.15 ms | -6.1 % (-22.8 to -2.6) |
| bun --compile | `argmate`, config at run time | 10.11 ms | 11.38 ms | 11.69 ms | 1.26 ms | -2.7 % (-13.6 to 6.0) |
| bun --compile | `argmate/engine`, precompiled | 10.11 ms | 10.83 ms | 10.81 ms | 0.72 ms | 0.2 % (-6.6 to 12.6) |
