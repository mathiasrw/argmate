# Engines: real CLI

The wall time of a whole process that parses `process.argv` with the workload `config` and prints the result. 300 runs for each command; all 15 commands take turns. `baseline` is the same CLI with no argmate: it only prints `process.argv`. "argmate in full" is `full - baseline`. "mini is faster by" is `1 - mini / full`, with a 95 % bootstrap interval. `bun --compile` is an executable made with `bun build --compile`. The first table is the time of the whole process compared to argmate/mini: 1.000× is the same time.

- Machine: Apple M1 Pro
- Node v22.23.3, Bun v1.4.3
- argmate v0.9.0, branch `v091`, `14acca8` + changes that are not committed
- Date: 2026-10-25 21:02

| Import | node | bun | bun --compile |
|---|---:|---:|---:|
| argmate/mini | 1.000× | 1.000× | 1.000× |
| argmate | 0.998× | 1.007× | 1.012× |
| argmate/mini/engine, precompiled | 0.977× | 0.966× | 0.976× |
| argmate/engine, precompiled | 0.973× | 0.981× | 0.979× |
| no parser (baseline) | 0.988× | 0.889× | 0.894× |

| Runtime | Import | baseline | full | mini | argmate in full | mini is faster by (95 % interval) |
|---|---|---:|---:|---:|---:|---:|
| node | `argmate`, config at run time | 40.29 ms | 40.73 ms | 40.79 ms | 0.44 ms | -0.2 % (-1.6 to 1.7) |
| node | `argmate/engine`, precompiled | 40.29 ms | 39.69 ms | 39.87 ms | -0.59 ms | -0.4 % (-2.1 to 0.8) |
| bun | `argmate`, config at run time | 10.36 ms | 11.74 ms | 11.66 ms | 1.38 ms | 0.7 % (-0.9 to 2.3) |
| bun | `argmate/engine`, precompiled | 10.36 ms | 11.44 ms | 11.27 ms | 1.08 ms | 1.5 % (-1.0 to 3.9) |
| bun --compile | `argmate`, config at run time | 10.41 ms | 11.78 ms | 11.64 ms | 1.38 ms | 1.2 % (-1.5 to 3.3) |
| bun --compile | `argmate/engine`, precompiled | 10.41 ms | 11.40 ms | 11.36 ms | 0.99 ms | 0.3 % (-1.4 to 3.1) |
