# 5C: the regexes of a first parse

The regexes executed in the first parse of a workload, in the order of their first execution, and the time of that first execution in µs (median of 30 processes). Wrapped, so the sum is a little above the real cost.

- Machine: Apple M1 Pro
- Node v24.22.1, Bun v1.4.3
- argmate v0.9.1, branch `v1`, `1152549`
- Date: 2026-11-02 10:22

| Runtime | Workload | Regexes touched | Sum of first executions, µs |
|---|---|---:|---:|
| node | plain | 7 | 153 |
| node | config | 5 | 137 |
| bun | plain | 7 | 158 |
| bun | config | 5 | 126 |

| Runtime | Workload | Regex | First execution, µs |
|---|---|---|---:|
| node | plain | `/^(--)$\|^-(-)(no-)?([^=\s-]+(?:-[^=\s-]+)*)()(?:(=)\|$)/u` | 49.9 |
| node | plain | `/^\d+$/` | 11.6 |
| node | plain | `/[^-]-[^-]/u` | 8.0 |
| node | plain | `/^-()()()([^=\s-](?:[^=\s-]*?[^=\s\d-])?)(\d*)(?:(=)\|$)/u` | 21.4 |
| node | plain | `/\d(?![\uFE0F\u20E3])/` | 10.8 |
| node | plain | `/[\u0080-\uFFFF]/` | 5.7 |
| node | plain | `/-(.)/gsu` | 45.9 |
| node | config | `/^(--)$\|^-(-)(no-)?([^=\s-]+(?:-[^=\s-]+)*)()(?:(=)\|$)/u` | 50.2 |
| node | config | `/^-?(?:0\|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/` | 47.8 |
| node | config | `/^-()()()([^=\s-](?:[^=\s-]*?[^=\s\d-])?)(\d*)(?:(=)\|$)/u` | 22.5 |
| node | config | `/\d(?![\uFE0F\u20E3])/` | 9.8 |
| node | config | `/[\u0080-\uFFFF]/` | 7.1 |
| bun | plain | `/^(--)$\|^-(-)(no-)?([^=\s-]+(?:-[^=\s-]+)*)()(?:(=)\|$)/u` | 70.0 |
| bun | plain | `/^\d+$/` | 11.7 |
| bun | plain | `/[^-]-[^-]/u` | 15.0 |
| bun | plain | `/^-()()()([^=\s-](?:[^=\s-]*?[^=\s\d-])?)(\d*)(?:(=)\|$)/u` | 15.9 |
| bun | plain | `/\d(?![\uFE0F\u20E3])/` | 10.8 |
| bun | plain | `/[\u0080-\uFFFF]/` | 4.2 |
| bun | plain | `/-(.)/gsu` | 30.1 |
| bun | config | `/^(--)$\|^-(-)(no-)?([^=\s-]+(?:-[^=\s-]+)*)()(?:(=)\|$)/u` | 66.9 |
| bun | config | `/^-?(?:0\|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/` | 24.4 |
| bun | config | `/^-()()()([^=\s-](?:[^=\s-]*?[^=\s\d-])?)(\d*)(?:(=)\|$)/u` | 13.9 |
| bun | config | `/\d(?![\uFE0F\u20E3])/` | 16.5 |
| bun | config | `/[\u0080-\uFFFF]/` | 4.0 |
