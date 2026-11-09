# Engines: cold

One parse in a new process: the case of a real CLI, without the start of the runtime. Measured inside the process with `performance.now()`: the time to load the bundle and the time of the first parse. The median of 200 processes for each engine; full and mini take turns. The first table is the load and first parse compared to argmate/mini: 1.000× is the same time. In the second table "mini is faster by" is `1 - mini / full` of the total, with a 95 % bootstrap interval. The workloads are in `../shared/scenarios.js`.

- Machine: Apple M1 Pro
- Node v22.23.3, Bun v1.4.3
- argmate v0.9.0, branch `v091`, `14acca8` + changes that are not committed
- Date: 2026-10-25 21:00

| Engine | node plain | node config | node precompiled | node files | node groups | bun plain | bun config | bun precompiled | bun files | bun groups |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| argmate/mini | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× | 1.000× |
| argmate | 1.234× | 1.085× | 1.146× | 1.138× | 1.102× | 1.085× | 1.066× | 1.112× | 1.074× | 1.089× |

| Runtime | Workload | full: load + first parse | mini: load + first parse | mini is faster by (95 % interval) |
|---|---|---:|---:|---:|
| node | plain | 585 µs + 603 µs = 1193 µs | 551 µs + 418 µs = 967 µs | 19.0 % (17.5 to 20.5) |
| node | config | 582 µs + 1005 µs = 1602 µs | 550 µs + 921 µs = 1476 µs | 7.8 % (5.9 to 9.9) |
| node | precompiled | 385 µs + 459 µs = 849 µs | 370 µs + 368 µs = 741 µs | 12.7 % (10.5 to 14.4) |
| node | files | 580 µs + 1130 µs = 1731 µs | 556 µs + 943 µs = 1522 µs | 12.1 % (9.6 to 15.2) |
| node | groups | 578 µs + 928 µs = 1521 µs | 547 µs + 831 µs = 1381 µs | 9.2 % (7.4 to 10.7) |
| bun | plain | 642 µs + 647 µs = 1292 µs | 626 µs + 559 µs = 1190 µs | 7.9 % (6.5 to 9.1) |
| bun | config | 644 µs + 938 µs = 1583 µs | 617 µs + 863 µs = 1485 µs | 6.2 % (5.1 to 7.4) |
| bun | precompiled | 399 µs + 534 µs = 937 µs | 368 µs + 471 µs = 843 µs | 10.1 % (8.5 to 12.7) |
| bun | files | 648 µs + 940 µs = 1608 µs | 637 µs + 853 µs = 1497 µs | 6.9 % (5.3 to 8.8) |
| bun | groups | 648 µs + 849 µs = 1503 µs | 621 µs + 752 µs = 1380 µs | 8.2 % (6.5 to 10.3) |
