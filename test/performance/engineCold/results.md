# Engines: cold

One parse in a new process: the case of a real CLI, without the start of the runtime. Measured inside the process with `performance.now()`: the time to load the bundle and the time of the first parse. The median of 200 processes for each engine; full and mini take turns. "mini is faster by" is `1 - mini / full` of the total, with a 95 % bootstrap interval. The workloads are in `../shared/scenarios.js`.

- Machine: Apple M1 Pro
- Node v22.23.3, Bun v1.4.3
- argmate v0.9.0, branch `v091`, `a3fe3ce` + changes that are not committed
- Date: 2026-10-25 19:02

| Runtime | Workload | full: load + first parse | mini: load + first parse | mini is faster by (95 % interval) |
|---|---|---:|---:|---:|
| bun | plain | 557 µs + 557 µs = 1115 µs | 529 µs + 423 µs = 958 µs | 14.1 % (11.8 to 16.1) |
| bun | config | 550 µs + 832 µs = 1381 µs | 522 µs + 719 µs = 1241 µs | 10.2 % (7.9 to 11.7) |
| bun | precompiled | 320 µs + 459 µs = 774 µs | 487 µs + 341 µs = 828 µs | -6.9 % (-8.7 to -4.5) |
| bun | files | 547 µs + 825 µs = 1370 µs | 519 µs + 695 µs = 1216 µs | 11.3 % (10.2 to 12.8) |
| bun | groups | 547 µs + 739 µs = 1287 µs | 517 µs + 618 µs = 1137 µs | 11.7 % (10.9 to 12.6) |
| node | plain | 531 µs + 565 µs = 1097 µs | 510 µs + 330 µs = 839 µs | 23.5 % (22.9 to 24.0) |
| node | config | 533 µs + 957 µs = 1491 µs | 508 µs + 815 µs = 1323 µs | 11.3 % (10.6 to 11.8) |
| node | precompiled | 359 µs + 424 µs = 783 µs | 335 µs + 269 µs = 605 µs | 22.8 % (22.2 to 23.3) |
| node | files | 533 µs + 1068 µs = 1604 µs | 510 µs + 845 µs = 1356 µs | 15.4 % (14.8 to 15.9) |
| node | groups | 533 µs + 881 µs = 1416 µs | 508 µs + 741 µs = 1248 µs | 11.8 % (11.3 to 12.2) |
