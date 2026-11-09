# 3C: static import and dynamic import() of the bundle

µs from the start of the process to the first line of the entry file, the median of 100 processes, and the load as the difference to an entry that imports an empty module. The last column is the load of the bundle with the 95 % bootstrap interval.

- Machine: Apple M1 Pro
- Node v24.22.1, Bun v1.4.3
- argmate v0.9.1, branch `v1`, `1152549`
- Date: 2026-11-02 10:21

| Runtime | Import | with the bundle | with an empty module | load |
|---|---|---:|---:|---:|
| node | static | 19801 | 18588 | 1212.9 (392.0 to 1777.9) |
| node | dynamic | 19108 | 18831 | 277.5 (-287.5 to 966.0) |
| node | dynamic minus static | | | -843.3 (-1342.7 to 68.6) |
| bun | static | 4177 | 3425 | 752.0 (611.7 to 867.0) |
| bun | dynamic | 4251 | 3472 | 778.7 (675.9 to 883.0) |
| bun | dynamic minus static | | | 109.6 (-56.0 to 312.4) |
