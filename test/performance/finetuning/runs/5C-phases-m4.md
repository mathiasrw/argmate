# 5C: the phases of the first parse

µs, the median of 200 new processes. `import` is the load of the bundle. `preprocessing` is `configPreprocessing` (0 with no config, and for `precompiled`). `call into engine` is the time from the end of the preprocessing to the first line of the engine. `setup` is the entry of the engine to the first token: the destructuring of the config, the copy of the output, the reverse of the input and the spots. `late checks` is from the end of the token loop to the alias and inflate step, and `return` is that step and the return. The total is import plus first parse. The timestamps cost a little, so the total is a little above the cold table.

- Machine: Apple M1 Pro
- Node v24.22.1, Bun v1.4.3
- argmate v0.9.1, branch `v1`, `1152549`
- Date: 2026-11-02 10:22

| Runtime | Workload | import | preprocessing | call into engine | setup | token loop | late checks | return | total |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| node | config | 854.1 | 329.6 | 367.7 | 9.8 | 294.4 | 17.5 | 0.3 | 1881.5 |
| node | plain | 851.0 | 1.9 | 387.9 | 21.1 | 296.9 | 2.9 | 0.3 | 1568.5 |
| node | precompiled | 572.2 | 1.3 | 387.2 | 7.7 | 303.0 | 17.6 | 0.3 | 1295.3 |
| bun | config | 918.1 | 393.1 | 438.6 | 10.3 | 253.8 | 20.4 | 0.3 | 2072.3 |
| bun | plain | 954.6 | 3.9 | 477.4 | 25.6 | 206.4 | 7.4 | 0.3 | 1692.8 |
| bun | precompiled | 538.5 | 0.8 | 472.7 | 14.4 | 267.5 | 18.6 | 0.3 | 1321.9 |
