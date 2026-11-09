# 5C: the regexes of a first parse

The regexes executed in the first parse of a workload, in the order of their first execution, and the time of that first execution in µs (median of 30 processes). Wrapped, so the sum is a little above the real cost.

- Machine: Apple M1 Pro
- Node v24.22.1, Bun v1.4.3
- argmate v0.9.1, branch `v1`, `1152549`
- Date: 2026-11-02 09:20

| Runtime | Workload | Regexes touched | Sum of first executions, µs |
|---|---|---:|---:|
| node | plain | 8 | 186 |
| node | config | 14 | 243 |
| bun | plain | 8 | 162 |
| bun | config | 14 | 222 |

| Runtime | Workload | Regex | First execution, µs |
|---|---|---|---:|
| node | plain | `/^(?<STOP>--)$\|^-(?<LONG>-)(?<NO>no-)?(?<KEY>[^=\s-]+(?:-[^=\s-]+)*)(?:(?<ASSIGN>=)\|$)/u` | 46.7 |
| node | plain | `/^\d+$/` | 11.5 |
| node | plain | `/[^-]-[^-]/u` | 9.5 |
| node | plain | `/^-?(?:0\|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/` | 41.4 |
| node | plain | `/^-(?<KEY>[^=\s-](?:[^=\s-]*?[^=\s\d-])?)(?<KEYNUM>\d*)(?:(?<ASSIGN>=)\|$)/u` | 20.6 |
| node | plain | `/\d(?![\uFE0F\u20E3])/` | 8.7 |
| node | plain | `/[\u0080-\uFFFF]/` | 5.0 |
| node | plain | `/-(.)/gsu` | 42.5 |
| node | config | `/^bool(\[\])?$/` | 27.2 |
| node | config | `/^(file\|folder\|path)(\[\]\|)$/` | 24.8 |
| node | config | `/^((array\|count)\|(boolean\|string\|number\|float\|int\|hex)(\[\])?)$/` | 30.6 |
| node | config | `/(^array\|\[\])$/` | 14.8 |
| node | config | `/[,\s]+-?-?\|^--?/` | 28.2 |
| node | config | `/[a-z0-9][A-Z]/u` | 10.1 |
| node | config | `/[,\s]+-?-?\|^--?/y` | 0.3 |
| node | config | `/[,\s]+-?-?\|^--?/y` | 0.3 |
| node | config | `/[,\s]+-?-?\|^--?/y` | 0.3 |
| node | config | `/^(?<STOP>--)$\|^-(?<LONG>-)(?<NO>no-)?(?<KEY>[^=\s-]+(?:-[^=\s-]+)*)(?:(?<ASSIGN>=)\|$)/u` | 34.4 |
| node | config | `/^-?(?:0\|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/` | 41.4 |
| node | config | `/^-(?<KEY>[^=\s-](?:[^=\s-]*?[^=\s\d-])?)(?<KEYNUM>\d*)(?:(?<ASSIGN>=)\|$)/u` | 18.2 |
| node | config | `/\d(?![\uFE0F\u20E3])/` | 8.1 |
| node | config | `/[\u0080-\uFFFF]/` | 4.8 |
| bun | plain | `/^(?<STOP>--)$\|^-(?<LONG>-)(?<NO>no-)?(?<KEY>[^=\s-]+(?:-[^=\s-]+)*)(?:(?<ASSIGN>=)\|$)/u` | 67.1 |
| bun | plain | `/^\d+$/` | 10.8 |
| bun | plain | `/[^-]-[^-]/u` | 13.6 |
| bun | plain | `/^-?(?:0\|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/` | 14.9 |
| bun | plain | `/^-(?<KEY>[^=\s-](?:[^=\s-]*?[^=\s\d-])?)(?<KEYNUM>\d*)(?:(?<ASSIGN>=)\|$)/u` | 15.7 |
| bun | plain | `/\d(?![\uFE0F\u20E3])/` | 8.6 |
| bun | plain | `/[\u0080-\uFFFF]/` | 3.5 |
| bun | plain | `/-(.)/gsu` | 27.5 |
| bun | config | `/^bool(\[\])?$/` | 41.8 |
| bun | config | `/^(file\|folder\|path)(\[\]\|)$/` | 25.0 |
| bun | config | `/^((array\|count)\|(boolean\|string\|number\|float\|int\|hex)(\[\])?)$/` | 28.9 |
| bun | config | `/(^array\|\[\])$/` | 17.4 |
| bun | config | `/[,\s]+-?-?\|^--?/` | 24.2 |
| bun | config | `/[a-z0-9][A-Z]/u` | 9.2 |
| bun | config | `/[,\s]+-?-?\|^--?/y` | 0.2 |
| bun | config | `/[,\s]+-?-?\|^--?/y` | 0.2 |
| bun | config | `/[,\s]+-?-?\|^--?/y` | 0.2 |
| bun | config | `/^(?<STOP>--)$\|^-(?<LONG>-)(?<NO>no-)?(?<KEY>[^=\s-]+(?:-[^=\s-]+)*)(?:(?<ASSIGN>=)\|$)/u` | 31.1 |
| bun | config | `/^-?(?:0\|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/` | 17.6 |
| bun | config | `/^-(?<KEY>[^=\s-](?:[^=\s-]*?[^=\s\d-])?)(?<KEYNUM>\d*)(?:(?<ASSIGN>=)\|$)/u` | 14.4 |
| bun | config | `/\d(?![\uFE0F\u20E3])/` | 8.2 |
| bun | config | `/[\u0080-\uFFFF]/` | 3.4 |
