# 5E: V8's regex tier, cold first parse of `config`

µs, the median of 200 processes. The last column is the first parse of the setting minus the first parse of the default, with the 95 % bootstrap interval: positive means the setting is slower.

- Machine: Apple M1 Pro
- Node v24.22.1, Bun v1.4.3
- argmate v0.9.1, branch `v1`, `1152549`
- Date: 2026-11-02 09:19

| Flags | load | first parse | first parse minus default |
|---|---:|---:|---:|
| default | 814.0 | 1468.7 | 0.0 (-10.8 to 10.5) |
| --no-regexp-tier-up | 813.3 | 1278.2 | -190.5 (-203.0 to -183.6) |
| --regexp-tier-up-ticks=1000 | 815.6 | 1198.3 | -270.4 (-280.1 to -260.9) |
| --regexp-interpret-all | 812.3 | 1194.9 | -273.8 (-283.2 to -265.9) |
