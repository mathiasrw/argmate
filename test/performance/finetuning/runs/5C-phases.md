# 5C: the phases of the first parse

µs, the median of 200 new processes. `import` is the load of the bundle. `preprocessing` is `configPreprocessing` (0 with no config, and for `precompiled`). `call into engine` is the time from the end of the preprocessing to the first line of the engine. `setup` is the entry of the engine to the first token: the destructuring of the config, the copy of the output, the reverse of the input and the spots. `late checks` is from the end of the token loop to the alias and inflate step, and `return` is that step and the return. The total is import plus first parse. The timestamps cost a little, so the total is a little above the cold table.

- Machine: Apple M1 Pro
- Node v24.22.1, Bun v1.4.3
- argmate v0.9.1, branch `v1`, `1152549`
- Date: 2026-11-02 09:18

| Runtime | Workload | import | preprocessing | call into engine | setup | token loop | late checks | return | total |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| node | config | 810.5 | 601.4 | 514.0 | 10.3 | 316.9 | 21.5 | 0.3 | 2289.8 |
| node | plain | 811.4 | 1.8 | 532.8 | 20.9 | 374.1 | 3.7 | 0.2 | 1749.8 |
| node | precompiled | 567.0 | 1.3 | 528.5 | 7.8 | 339.9 | 20.9 | 0.3 | 1465.2 |
| bun | config | 868.3 | 550.9 | 580.0 | 11.4 | 204.1 | 17.3 | 0.3 | 2259.1 |
| bun | plain | 861.7 | 2.1 | 620.5 | 25.6 | 223.0 | 6.7 | 0.3 | 1744.8 |
| bun | precompiled | 504.4 | 0.7 | 608.4 | 12.5 | 250.5 | 17.3 | 0.3 | 1397.9 |
