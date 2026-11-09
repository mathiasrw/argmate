# 2B: the cost of the regexes of the engine on V8 and on JavaScriptCore

First execution: µs for one `exec` on a new `RegExp` in a new process, the median of 30 processes. Hot: ns for one `exec` after 200000 executions, in one process, the median of 30. `exec` is used for all rows, so the `replace` and `split` rows are the cost of the pattern and not of the method.

- Machine: Apple M1 Pro
- Node v24.22.1, Bun v1.4.3
- argmate v0.9.1, branch `v1`, `1152549`
- Date: 2026-11-02 10:45

| Regex | Input | First, Node µs | First, Bun µs | Hot, Node ns | Hot, Bun ns |
|---|---|---:|---:|---:|---:|
| paramLong, indexed groups, u | `--dry-run=yes` | 42.5 | 64.3 | 80 | 64 |
| paramLong, named groups, u | `--dry-run=yes` | 27.2 | 22.9 | 129 | 98 |
| paramLong, indexed groups, no u | `--dry-run=yes` | 18.9 | 10.6 | 79 | 61 |
| paramShort, indexed groups, u | `-abc` | 18.8 | 9.7 | 66 | 55 |
| paramShort, named groups, u | `-abc` | 16.6 | 8.7 | 91 | 72 |
| autoNumber | `8080` | 39.1 | 14.1 | 32 | 28 |
| numberish | `-5` | 10.0 | 6.4 | 30 | 26 |
| notParam | `-- x` | 16.0 | 16.8 | 34 | 36 |
| hasDigit | `abc5` | 6.5 | 5.7 | 33 | 28 |
| hasNonAscii | `abc` | 4.5 | 2.8 | 15 | 14 |
| onlyDigits | `abc` | 5.5 | 2.6 | 14 | 11 |
| isKebab | `dry-run` | 5.9 | 4.4 | 33 | 29 |
| kebab2camel, replace | `dry-run` | 7.0 | 4.0 | 28 | 26 |
| boolStringTrue | `yes` | 20.5 | 8.2 | 35 | 30 |
| listDeviders, split | `a,b` | 20.2 | 9.5 | 33 | 29 |
