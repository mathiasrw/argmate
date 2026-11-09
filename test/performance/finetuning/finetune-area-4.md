# Area 4: Fewer instructions on the hot path

The hot path is the token loop of `src/argEngine.ts`. A token is one item of the input list, for example `--fix` or a file name. The token loop reads the tokens in order. The loop already has three changes for speed.

- The engine reverses the input once and reads it with `pop`. The measurement showed that `shift` and `unshift` need 8.77x as long as `pop` and `push`.
- The regex has a long form and a short form.
- The typed log is a flat array.

This area has the next candidates. Each candidate is a few lines. Each candidate gets its own variant and its own row. A variant is a copy of the engine with one change.

A change that looks cheaper can be slower, because V8 or JavaScriptCore has already optimized the current form. V8 is the part of Node that runs JavaScript. JavaScriptCore is the part of Bun that runs JavaScript. Both run a function in a slow way at first. After many calls, both compile the function to fast machine code. This step is the optimization.

The hot benchmark (`../engineHot`) is the main measurement here. Hot is the time of one parse after the same process made many parses. The benchmark uses all five workloads. A workload is one fixed input with its config, which the benchmark parses many times. The workloads are `plain`, `config`, `files`, `groups` and `precompiled`.

The benchmark also measures the cold first parse. Cold start is the time to load the library and make the first parse in a new process. The cold first parse is the part of cold start for the first parse alone. A change in the loop changes what the first parse compiles.

Each result has a 95 % interval. The interval comes from the bootstrap method, which repeats the calculation on random samples of the measured times. A difference is noise if the interval includes 1.00x, which means no difference. A result inside noise has the label `no change`.

## 4A. Indexed captures instead of named groups

The regexes `re.paramLong` and `re.paramShort` have named groups. A named group is a part of a regex that has a name. The match gives the text of each group under its name. The engine reads `token.groups` and destructures `STOP, LONG, NO, KEY, KEYNUM, ASSIGN, VAL`. Destructuring reads several properties of an object into local variables in one statement.

The change replaces the names with positions, `token[1]`, `token[2]` and so on. The groups of the two regexes have the same order, so the same index has the same meaning in both.

The reason is the cost of the `groups` object. A match with named groups builds a `groups` object on every token. The object has a null prototype, which means that it has no parent object. The object has one property for each group. The indexed form reads from the match array. The match array already exists.

The destructuring also creates seven local variables. The interpreter is the slow first way to run code, before the optimization. On the first parse, the code runs in the interpreter. There the seven variables cost little, but the cost is not zero.

To try it, make one variant. In the variant, the regexes have no group names, and the reads use indexes. Nothing else changes in the regexes. Write a comment above each regex. The comment names the index of each group. The comment replaces the names, which were the documentation.

The measurement is the hot parse on all workloads, and the cold first parse on `plain` and `config`. The 4A row is also the result of 2C.

The decision rule is to keep the variant when the hot parse is faster on `plain`, `files` and `groups`, and no workload is slower. These three workloads have many tokens. The comment restores the readability that the names gave.

## 4B. `indexOf('=')` instead of the `ASSIGN` capture

The regexes end with `(?:(?<ASSIGN>=)|$)`. After the match, the engine takes a slice of `arg` (a part of the string) as the value. The change removes the `=` from the regexes. The engine finds the `=` with `arg.indexOf('=')` on the key part. Another way is to match the regex against `arg.slice(0, eq)` when the argument has an `=`.

The reason is the cost at the end of the regex. The alternative at the end is a branch that every match of the regex takes. The capture is also a group. An `indexOf` on a short string needs a few instructions. The measurement shows whether the total is smaller. The slice before the match creates a new string, which has a cost.

To try it, make the variant on top of 4A, because the indexes change. The variant starts with `const eq = arg.indexOf('='); const name = eq < 0 ? arg : arg.slice(0, eq);`. Then the regex runs on `name`. The engine sets the value with `VAL = arg.slice(eq + 1)`. The regexes lose their last group. The `$` anchor stays.

The measurement is the hot parse on `plain` and `config`, which have an `=` in their input, and on `files`, which has none. The cold first parse on `plain` is also measured.

The decision rule is to keep the variant when the hot parse is faster on the workloads with an `=`. The result on `files` must stay inside noise.

## 4C. Type dispatch on a charCode

The engine compares `theType` to strings in `'boolean' === theType` and `'count' === theType`. The `switch` in `finalValue` has 15 string cases. A `switch` on `theType.charCodeAt(0)` reaches the right branch with one integer compare. A second char code tells `int` from `int[]` where the difference matters.

The reason is the cost of a string compare. An internalized string is a string that the runtime stores once. A compare of two internalized strings is a pointer compare, which compares two addresses. Here, the engine compares two internalized strings, so the change can give no gain.

A `switch` on 15 strings is a chain of compares. A `switch` on small integers becomes a jump table, which is a list of addresses that gives the branch with one lookup. The measurement decides.

To try it, make one variant. In the variant, `finalValue` switches on `charCodeAt(0)`. For the array forms, `finalValue` then switches on `length` or on the last char. Write the string cases as comments next to the codes.

The measurement is the hot parse on `config`, where every type appears, and on `groups`, which has only booleans and a count.

The decision rule is to keep the variant only when the hot parse is faster and outside noise. If the result is inside noise, drop the variant, because the strings are easier to read.

## 4D. Resolve the parameter once

The engine reads `parameterConfig[KEY]` for the alias check. Then the engine reads `parameterConfig[KEY].key` and `parameterConfig[theKey].type`. Later the engine reads `parameterConfig[theKey].next`, `.last` and `.spot`. An alias entry `{key}` holds the name `key` of the real parameter.

The change reads `parameterConfig[KEY]` once into a local variable. The change follows `.key` once to the parameter object. The change reads all other properties from the parameter object.

The reason is the inline cache. An inline cache is a small store at each property read. The inline cache remembers the shape of the objects that the read saw, and the shape is the list of properties. If the shape is the same each time, the read is a hit and is fast. So the gain for each read is small.

A token needs five to eight reads. The alias entries `{key}` have a different shape than the parameters. So the cache sees two shapes and is polymorphic. A polymorphic cache is slower.

To try it, make one variant. The essential core logic rule allows no helper locals. So the measurement must show that the two locals are worth it.

The measurement is the hot parse on `config` and `files`.

The decision rule is to keep the variant when the hot parse on `config` is faster and outside noise. Otherwise drop the variant, because of the rule on helper locals.

## 4E. No `'' + args.pop()`

The loop reads `const arg: string = '' + args.pop()`. The concatenation makes `arg` a string, also when the caller passed a number. The change adds one guard at the top, which converts the whole array to strings once. The guard is `args = args.map(String)` or a check that every element is a string. With the guard, the loop has no concatenation.

The reason is the cost of the concatenation. On V8, `'' + s` is cheap when `s` is already a string, because a concatenation with the empty string does nothing. The concatenation is still a call and a type check for each token. The guard costs one pass over the array. The `slice().reverse()` call already makes one pass. So the two can be one pass.

To try it, make one variant. The variant has the code `for (let i = args.length, r = []; i--; ) r.push('' + args[i])`. This code reverses the array and converts it to strings in a single pass. The loop uses the plain `args.pop()`. Run the tests that pass numbers in the input.

The measurement is the hot parse on `files`, which has 500 tokens, and on `plain`.

The decision rule is to keep the variant when the hot parse on `files` is faster and outside noise.

## 4F. The late checks skip with one length check each

After the token loop, the engine runs `for (const key of validate)`, `transform`, `mandatory`, `conflict`, `demand` and then `crossValidate`. These are the late checks. With an empty list, each loop is one length check. This section checks two things.

1. Nothing else runs for a config that has none of the late checks.
2. The order puts the most common check first.

The reason is that the `plain` and `precompiled` workloads have no late checks. So the late checks must cost nothing for these workloads. If the engine spends time after the loop on them, something runs that must not run.

To try it, use the 5C phase breakdown on `plain`. The phase breakdown shows the time of each phase of the first parse. If the phase after the loop takes more than 1 µs, read what runs. If not, the work of this section ends, and the results say so.

The measurement is the phase time from 5C.

The decision rule is no change, unless 5C shows that something runs that must not run. Section 1F overlaps with this section. Section 1F moves these checks into a function for the cold start.

## 4G. The shape of the output object

The output starts as `{...template}` of the compiled config, with every parameter at its default value. The engine writes known parameters to properties that exist, so the shape stays the same. Unknown parameters add properties in the order of the input. `_` is an array that grows.

V8 gives each object a hidden class, which lists the properties of the object in their order. A property that the engine adds in a different order on each run gives V8 a new hidden class each time. Each such step is a transition. After enough transitions, the object goes to dictionary mode. Dictionary mode is a slow way to store properties.

The reason is the cost of dictionary mode. An output in dictionary mode is slower to write. The CLI also reads the result more slowly. The `plain` workload has no config, so all of its parameters are unknown parameters. There are three options.

- Use `Object.create(null)` for the output. This object is a dictionary from the start, and it is stable.
- Use a template that has `_` and nothing else.
- Leave the code as it is, if the measurement shows no transition cost.

To try it, make a variant for each of the first two options. Then run a debug run with `node --allow-natives-syntax` and `%HasFastProperties(output)`. The result shows whether the output is in dictionary mode after a `plain` parse and after a `config` parse.

The measurement is the hot parse on `plain` and `config`. The results also show `%HasFastProperties` before and after the change, as yes or no.

The decision rule is to keep the variant when the hot parse on `plain` is faster and outside noise, and `config` does not get slower. Measure this variant last among the hot path changes, because 4D changes what the inline caches see.

## Results

Each speed in the table is the time of the old engine compared to the time of the engine with the change. The engine with the change has the value 1.00x. A value above 1.00x means that the change makes the parse faster. A value below 1.00x means that the change makes the parse slower. The old engine is the engine of the branch for 4A. For 4B to 4E, the old engine is `m1`.

The text after the table names both engines in each sentence. The slower engine comes first, so its value is above 1.00x.

| Section | Runtime | Hot `plain` | Hot `config` | Hot `files` | Hot `groups` | Cold first parse `plain` | Kept | Date, commit, machine |
|---|---|---:|---:|---:|---:|---:|---|---|
| 4A | node / bun | 1.30x / 1.21x | 1.15x / 1.16x | 1.02x / 1.02x (no change) | 1.24x / 1.09x | 1.01x / 1.01x (no change) | Yes | 2026-11-02, `1152549`, M1 Pro |
| 4B | node / bun | 0.97x / 0.98x | no change | no change | no change | no change | No | 2026-11-02, `1152549`, M1 Pro |
| 4C | node / bun | no change | no change | not measured | no change | not measured | No (fails a test, and no gain without the test) | 2026-11-02, `1152549`, M1 Pro |
| 4D | node / bun | 0.99x / no change | no change | no change | 1.03x / no change | no change | No (`precompiled` 1.04x on both) | 2026-11-02, `1152549`, M1 Pro |
| 4E | node / bun | no change | no change | 0.94x / 0.78x | 1.01x / 1.01x | no change | No | 2026-11-02, `1152549`, M1 Pro |
| 4F | node | not measured | not measured | not measured | not measured | not measured | Nothing to change | 2026-11-02, `1152549`, M1 Pro |
| 4G | node | not measured | not measured | not measured | not measured | not measured | Nothing to change | 2026-11-02, `1152549`, M1 Pro |

### 4: what was run

The measurement of 4A compares the variant with the engine of the branch. The measurements of 4B to 4E compare each variant with `m1`. The engine `m1` is the engine of the branch with the kept changes, 1Fx and 4A together. Each run uses 5 workloads and both runtimes.

The cold measurement uses 100 new processes. The hot measurement uses 10 rounds. A round is a block of hot parses in one process. The tables of each run are in `runs/`. 4C failed a test and is below.

4A is the change to indexed captures. The two regexes have the groups in the same places. These are 1 STOP, 2 LONG, 3 NO, 4 KEY, 5 KEYNUM and 6 ASSIGN. The short form has empty groups for the first three.

The change is in `common.ts` and in one line of the engine. With 4A, `argMate.js` is 22.47 KB against 22.52 KB without it. All tests pass.

The next table shows the hot result of 4A for each workload. The interval is in brackets.

| Workload | Hot Node, old engine compared to 4A | Hot Bun, old engine compared to 4A |
|---|---:|---:|
| `plain` | 1.30x (1.29x - 1.32x) | 1.21x (1.19x - 1.28x) |
| `config` | 1.15x (1.05x - 1.26x) | 1.16x (1.06x - 1.20x) |
| `files` | 1.02x (no change) | 1.02x (no change) |
| `groups` | 1.24x (1.22x - 1.26x) | 1.09x (1.09x - 1.12x) |
| `precompiled` | 1.44x (1.41x - 1.45x) | 1.26x (1.25x - 1.29x) |

The named groups cost one `groups` object for each token that goes through the regex. `files` has 500 tokens that are not parameters. The regex does not run for these tokens, so the change has nothing to speed up there. The largest hot path gain of the operation is 4A. The cold first parse is the same. On Node `plain`, the old engine needs 1.01x as long as the engine with 4A, which is inside noise.

The second run of 4A is from 2026-11-03 (`runs/20261103-1612-4A.md`). The cold measurement used 100 processes. The hot measurement used 20 rounds.

The machine was busy. The load average was 7.3 before the run and 10.0 after it, on 8 cores. The load average is the mean number of tasks that run or wait to run. So this run has more noise than the first run.

The next table shows the hot result for the old engine compared to the engine with 4A. The engine with 4A has the value 1.00x.

| Runtime | Workload | First run | Second run | Outside noise in the second run? |
|---|---|---:|---:|---|
| node | plain | 1.30x | 1.33x | yes |
| node | config | 1.15x | 1.15x | yes |
| node | files | 1.02x | 0.97x | no change |
| node | groups | 1.24x | 1.22x | no change (interval 1.00x - 1.46x) |
| node | precompiled | 1.44x | 1.41x | yes |
| bun | plain | 1.21x | 1.23x | yes |
| bun | config | 1.16x | 1.16x | yes |
| bun | files | 1.02x | 1.01x | no change |
| bun | groups | 1.09x | 1.11x | yes |
| bun | precompiled | 1.26x | 1.29x | yes |

In the first run, 8 hot rows were outside noise. In the second run, each of these 8 rows is within 0.03x of the first run. Of these 8 rows, 7 are outside noise again.

For cold start, the second run shows the same direction as the first run on Bun. The old engine needs 1.02x - 1.05x as long as the engine with 4A in 4 of the 5 rows. The second run shows no change on Node. Only `precompiled` on Bun is outside noise (1.05x). The first run had 3 rows outside noise.

The `files` rows cannot show the effect. In the second run, the interval of Node `files` is 0.91x - 1.04x. This interval is much wider than the size of the effect.

The result of `files` is low because the regex of 4A runs only for a token that starts with a dash. `files` has 505 tokens, and 3 of them are parameters (`-v`, `--fix`, `--max`). The 502 other tokens do not use the regex.

In `plain`, the old engine needs 1.30x as long as the engine with 4A on Node and 1.21x as long on Bun (first run). All of this difference comes from the 5 parameter tokens of `plain`.

`files` has 3 parameter tokens, so its difference is 3/5 of the difference in `plain`. The old engine takes 30,219 ns for `files` on Node. So the estimate for `files` is 1.01x on Node and 1.02x on Bun.

The first run measured 1.02x on both runtimes. The estimate is inside both intervals. So the low result comes from the small size of the effect. The low result does not come from a fault of the test.

To see the effect clearly, run `files` and `plain` alone on a quiet machine with 40 rounds. Use this command.

```sh
cd test/performance/finetuning && node run.js --no-test --no-cold --workloads files,plain --rounds 40 4A
```

With 4B (`indexOf('=')`), `plain` and `precompiled` are slower. The engine with 4B needs 1.02x - 1.04x as long as the old engine on these two workloads. The slice of the name and a second search cost more than the group that they replace.

With 4D (the parameter read once), the old engine needs 1.04x as long as the engine with 4D on `precompiled`, on both runtimes. On `groups` on Node, the old engine needs 1.03x as long. The rule of the section names `config`, and 4D shows no change on `config`. So the decision is to drop 4D. Look at 4D again if the precompiled engine becomes the way to use ArgMate.

With 4E (the input made into strings in one pass), `files` is slower. The engine with 4E needs 1.06x as long on Node and 1.28x as long on Bun as the old engine. The copy of 500 strings costs more than the 500 concatenations that the copy removes.

4C (the type dispatch on the first letter) fails the test "a config error that the engine finds is an Error with the message". The type `bogus` starts with `b`, and the engine reads it as a boolean. So 4C does not run with the tests.

### 4C, 4F, 4G

The run of 4C used `--no-test` against `m1`. The run measured only the hot parse, on `plain`, `config`, `groups` and `precompiled`. All 8 rows show no change. The largest difference is on Bun `config`. There the engine with 4C needs 1.01x as long as the old engine, with an interval of 0.95x - 1.03x.

The engine compares internalized strings, so the compare is a pointer compare. A `switch` on the strings is already as fast as a `switch` on a char code. The first-letter form also loses a check, as the text above says.

For 4F, the phase breakdown (5C) shows 3 to 7 µs for the late checks of `plain`. The phase breakdown shows 17 to 21 µs for `config` and `precompiled`, which have `validate`, `transform` and `mandatory`. For a config with none of these, the late checks cost three length tests. Nothing runs that must not run. The cold side of this section is 1F.

For 4G, `%HasFastProperties` is `true` for the result of `plain`, `config`, `files` and `groups`. This holds in the engine of the branch and in `engineMax`. The command for this check is `node --allow-natives-syntax fast.js <bundle folder>`. The output is not in dictionary mode, so an `Object.create(null)` or another template has nothing to fix.
