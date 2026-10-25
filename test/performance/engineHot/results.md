# Engines: hot

Many parses in one process, thus the JIT compiler has optimized the engine. For each workload, 10 rounds of 400 ms for each engine. Each round runs in its own process, and full and mini take turns. The first table is the time of one parse compared to argmate/mini: 1.000× is the same time, 2.000× is two times slower. The second table has the median time of one parse, and "mini is faster by" is `1 - mini / full` with a 95 % bootstrap interval. The workloads are in `../shared/scenarios.js`.

- Machine: Apple M1 Pro
- Node v22.23.3, Bun v1.4.3
- argmate v0.9.0, branch `v091`, `8daa5da` + changes that are not committed
- Date: 2026-10-25 20:06

| Engine | node plain | node config | node precompiled | node files | node groups | bun plain | bun config | bun precompiled | bun files | bun groups |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| argmate/mini | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× |
| argmate | 1.699× | 1.519× | 2.503× | 1.433× | 2.066× | 2.188× | 2.043× | 3.288× | 1.186× | 2.403× |

| Runtime | Workload | full | mini | mini is faster by (95 % interval) |
|---|---|---:|---:|---:|
| node | plain | 2722 ns | 1602 ns | 41.1 % (35.7 to 43.1) |
| node | config | 6127 ns | 4032 ns | 34.2 % (30.4 to 38.3) |
| node | precompiled | 3401 ns | 1359 ns | 60.1 % (58.5 to 61.6) |
| node | files | 7143 ns | 4984 ns | 30.2 % (25.3 to 32.5) |
| node | groups | 4779 ns | 2312 ns | 51.6 % (48.3 to 55.4) |
| bun | plain | 2261 ns | 1033 ns | 54.3 % (53.5 to 55.1) |
| bun | config | 3871 ns | 1895 ns | 51.1 % (50.1 to 52.1) |
| bun | precompiled | 2754 ns | 838 ns | 69.6 % (68.7 to 70.5) |
| bun | files | 5895 ns | 4972 ns | 15.7 % (-11.0 to 17.8) |
| bun | groups | 4989 ns | 2076 ns | 58.4 % (56.1 to 62.2) |
