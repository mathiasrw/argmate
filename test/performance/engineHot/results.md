# Engines: hot

Many parses in one process, so the JIT compiler has optimized the engine. For each workload, 10 rounds of 400 ms for each engine. Each round runs in its own process, and full and mini take turns. The first table is the time of one parse compared to argmate/mini: 1.000× is the same time, 2.000× is two times slower. The second table has the median time of one parse, and "mini is faster by" is `1 - mini / full` with a 95 % bootstrap interval. The workloads are in `../shared/scenarios.js`.

- Machine: Apple M1 Pro
- Node v22.23.3, Bun v1.4.3
- argmate v0.9.0, branch `v091`, `14acca8` + changes that are not committed
- Date: 2026-10-25 20:58

| Engine | node plain | node config | node precompiled | node files | node groups | bun plain | bun config | bun precompiled | bun files | bun groups |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| argmate/mini | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× |
| argmate | 1.735× | 1.479× | 2.122× | 1.408× | 2.069× | 1.794× | 1.646× | 2.246× | 1.206× | 2.170× |

| Runtime | Workload | full | mini | mini is faster by (95 % interval) |
|---|---|---:|---:|---:|
| node | plain | 3011 ns | 1736 ns | 42.3 % (35.8 to 48.5) |
| node | config | 6304 ns | 4262 ns | 32.4 % (24.9 to 34.5) |
| node | precompiled | 3416 ns | 1610 ns | 52.9 % (52.1 to 54.1) |
| node | files | 7015 ns | 4981 ns | 29.0 % (28.2 to 30.4) |
| node | groups | 5189 ns | 2507 ns | 51.7 % (48.9 to 52.5) |
| bun | plain | 2310 ns | 1288 ns | 44.3 % (41.3 to 46.6) |
| bun | config | 3875 ns | 2354 ns | 39.2 % (38.3 to 41.4) |
| bun | precompiled | 2793 ns | 1243 ns | 55.5 % (51.3 to 56.2) |
| bun | files | 5996 ns | 4973 ns | 17.1 % (14.8 to 20.5) |
| bun | groups | 4767 ns | 2197 ns | 53.9 % (53.4 to 55.2) |
