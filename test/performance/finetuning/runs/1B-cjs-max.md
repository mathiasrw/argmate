# 1B: CommonJS and ESM, `max`

µs in a new process, the median of 200 processes, `config` workload. Gain = ESM - CJS with the 95 % bootstrap interval: positive means `require()` of the CJS bundle is faster.

- Machine: Apple M1 Pro
- Node v24.22.1, Bun v1.4.3
- argmate v0.9.1, branch `v1`, `1152549`
- Date: 2026-11-02 10:43

| Runtime | load ESM | load CJS | load gain | first parse ESM | first parse CJS | first parse gain |
|---|---:|---:|---:|---:|---:|---:|
| node | 1416.5 | 1515.5 | -99.0 (-121.6 to -71.4) | 1015.4 | 992.1 | 23.3 (12.8 to 40.4) |
| bun | 969.0 | 1097.8 | -128.8 (-147.7 to -108.4) | 1049.9 | 961.2 | 88.8 (63.7 to 106.1) |
