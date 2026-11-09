# 3A and 3B: the wall time of a whole process, `max`

ms from the start of the process to its exit, the median of 200 runs of each, `config` workload, the commands take turns. The last column is the time of the row minus the time of `node esm` (or `bun esm` for the rows of Bun) with the 95 % bootstrap interval: negative means faster.

- Machine: Apple M1 Pro
- Node v24.22.1, Bun v1.4.3
- argmate v0.9.1, branch `v1`, `1152549`
- Date: 2026-11-02 12:33

| Command | median ms | relative to the fastest of its runtime | difference to the bundle (ESM), ms |
|---|---:|---:|---:|
| node esm | 38.2 | 1.01× |  |
| node cjs | 38.0 | 1.01× | -0.1 (-0.6 to 0.3) |
| bun esm | 10.9 | 1.10× |  |
| bun cjs | 10.8 | 1.10× | -0.0 (-0.2 to 0.1) |
| node precompiled | 37.7 | 1.00× | -0.4 (-0.9 to -0.1) |
| bun precompiled | 10.4 | 1.06× | -0.4 (-0.6 to -0.2) |
| node snapshot | 40.2 | 1.07× | 2.1 (1.5 to 2.6) |
| bun compiled | 11.4 | 1.16× | 0.6 (0.4 to 0.8) |
| bun compiled bytecode | 9.8 | 1.00× | -1.0 (-1.1 to -0.9) |

