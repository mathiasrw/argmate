# argInfoOnError: the cost when there is no error

The help goes below the message of an input error. This measures what that costs a parse that has no error, which is most parses. The workload is the `config` workload of `../shared/scenarios.js` with a description for each parameter (`config.js`). Each number is the median of 15 processes (hot) or 40 processes (load); the variants take turns. A difference is the difference of the medians with a 95 % bootstrap interval: an interval that includes 0 means no difference was found.

- `plain`: `argMate(args, config)`
- `onError`: the same with `argInfoOnError: true`: the help is made only on an error
- `upFront`: the help made before each parse, as a config step that makes it up front would
- `precompiled`: `argEngine(args, config)` with a precompiled config, loaded from a module as a program ships it
- `precompiledHelp`: the same, where the `error` function of the precompiled config has the help rows (`gen.js`)

- Machine: Apple M1 Pro
- Node v24.22.1, Bun v1.4.3
- argmate v0.9.1, branch `v1`, `1152549`
- Date: 2026-11-01 21:28

## Hot: many parses in one process

| Runtime | Variant | ns per parse | Against | Difference (95 % interval) |
|---|---|---:|---|---:|
| node | plain | 8111 |  |  |
| node | onError | 8100 | plain | -11 ns (-137 to 178) |
| node | upFront | 24831 | plain | 16721 ns (16334 to 17231) |
| node | precompiled | 3317 |  |  |
| node | precompiledHelp | 3321 | precompiled | 4 ns (-55 to 43) |
| bun | plain | 3676 |  |  |
| bun | onError | 3772 | plain | 96 ns (-16 to 290) |
| bun | upFront | 18830 | plain | 15154 ns (14796 to 16226) |
| bun | precompiled | 2057 |  |  |
| bun | precompiledHelp | 2037 | precompiled | -20 ns (-72 to 74) |

## Load: import the precompiled config and parse one time, in a new process

| Runtime | Variant | µs to load and parse | Difference (95 % interval) |
|---|---|---:|---:|
| node | precompiled | 1204 |  |
| node | precompiledHelp | 1241 | 36 µs (-28 to 128) |
| bun | precompiled | 1408 |  |
| bun | precompiledHelp | 1393 | -15 µs (-57 to 70) |
