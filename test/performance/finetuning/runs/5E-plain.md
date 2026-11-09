# 5E: V8's regex tier, cold first parse of `plain`

µs, the median of 200 processes. The last column is the first parse of the setting minus the first parse of the default, with the 95 % bootstrap interval: positive means the setting is slower.

- Machine: Apple M1 Pro
- Node v24.22.1, Bun v1.4.3
- argmate v0.9.1, branch `v1`, `1152549`
- Date: 2026-11-02 09:19

| Flags | load | first parse | first parse minus default |
|---|---:|---:|---:|
| default | 826.3 | 952.1 | 0.0 (-6.9 to 6.9) |
| --no-regexp-tier-up | 821.5 | 850.2 | -101.9 (-111.7 to -96.5) |
| --regexp-tier-up-ticks=1000 | 820.9 | 789.7 | -162.4 (-170.1 to -158.6) |
| --regexp-interpret-all | 817.2 | 782.9 | -169.3 (-177.4 to -164.7) |
