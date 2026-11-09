# The first, second and third call

µs, the median of 100 processes. The second and third call use another prepared config of the same input, so the difference to the first call is compile, regex compile, empty inline caches and the first allocation of objects.

- Machine: Apple M1 Pro
- Node v24.22.1, Bun v1.4.3
- argmate v0.9.1, branch `v1`, `1152549`
- Date: 2026-11-02 10:21

| Runtime | Workload | preprocessing 1st | 2nd | 3rd | engine 1st | 2nd | 3rd |
|---|---|---:|---:|---:|---:|---:|---:|
| node | config | 625.8 | 88.0 | 24.6 | 856.5 | 96.8 | 42.8 |
| bun | config | 523.6 | 25.3 | 16.6 | 774.0 | 27.2 | 14.9 |
