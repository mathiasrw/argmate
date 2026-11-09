# Area 2: First parse, regex and compile

The first parse on Node is about 1000 µs for the `config` workload and about 460 µs for `precompiled`. A workload is a named input for the benchmark. A cold start is the first run of the engine in a new process. The first parse of a cold start is the cold first parse.

A hot parse is a parse that runs after the JIT compiler has optimized the engine. The JIT compiler turns code that runs often into fast machine code. A hot parse of the same input is 5 µs.

The difference between the cold first parse and the hot parse is one-time work. The one-time work has four pieces.

- The compile of the engine function (1F).
- The first execution of each regex.
- The inline caches that start empty.
- The config preprocessing that a CLI runs once and never again.

An inline cache is a small store in compiled code. The store remembers the shape (the layout of the properties) of the objects that the code used. A new process starts with empty inline caches. A CLI is a program that a user starts on the command line. This area is about the pieces inside the first parse.

The measurement is the second number of `../engineCold/cold.js`. For the breakdown by phase, see 5C. Run 5C first in this area, because 5C shows which of the four pieces is the largest before you try any change.

## 2A. Regex first execution, and charCode checks instead

A regex is a pattern that matches text. The first `exec` or `test` of a regex compiles the regex, on both V8 and Yarr. Node runs V8. Bun runs JavaScriptCore, and the regex engine of JavaScriptCore is Yarr.

By default, V8 first compiles a regex to bytecode for an interpreter. Bytecode is a list of simple instructions, and an interpreter runs the instructions one by one. After the first interpreted execution, V8 compiles the regex to native code. Native code is machine code that the processor runs directly. This second step is the regex tier-up (`--regexp-tier-up-ticks`, see 5E).

On a cold start, each regex that the parse touches needs a bytecode compile, an interpreted run and then a native compile. So a regex that runs twice costs two compiles. A charCode check compares the numeric code of one character with a fixed number. Count the distinct regexes that one typical parse touches. Replace each regex that has a cheap equivalent in charCode checks.

The reason to replace regexes is the cost of a first execution. Each first execution costs 10 to 50 µs. The cost is more for a pattern with the `u` flag, a lookbehind or many alternatives. Ten regexes cost 100 to 500 µs, which is up to half of the first parse.

To try it, list the regexes that the `config` workload touches. The list has these regexes.

- `paramLong`
- `paramShort`
- `notParam`
- `isKebab`
- `kebab2camel`
- `boolStringTrue`
- `boolStringFalse`
- `autoNumber`
- `isHex`
- `isHexPrefix`
- `hasDigit`
- `hasNonAscii`

Then make a variant for each regex, with the regex replaced. A variant is a version of the engine with one change. The next list gives four examples.

- `isKebab` is a scan for a `-` that is not first or last.
- `hasNonAscii` is a loop that stops at the first charCode above 127.
- `hasDigit` is a loop with a range check.
- `boolStringTrue` is a `switch` on the lowercased string.

`paramLong` and `paramShort` stay regexes, because they are the parser. Earlier work measured the split of the parser into two regexes. For each variant, count the regexes that the parse touches, before and after the change. Use a wrapper on `RegExp.prototype.exec` and `test` in a debug run.

The measurement is the cold first parse on `config` and `plain`. Also measure the hot parse on all workloads. A hand-written loop can be slower than a hot regex after the tier-up. The hot benchmark shows this loss.

The decision rule is to keep each replacement that lowers the cold first parse and does not lose more than the interval when hot. The interval is the range around a measured result. The true result lies in this range with a chance of 95 %. Record for each regex the cost of the first execution on Node and Bun. Then you can use the list again.

## 2B. Bun's regex engine is not V8's

Bun runs JavaScriptCore, and the regex engine of JavaScriptCore is Yarr. Yarr compiles a regex to native code at once on the platforms that it supports, with no interpreter tier. The `u` flag, the `s` flag, named groups, lookbehind and Unicode property escapes cost a different amount on Yarr than on V8. A feature that is cheap on one engine is not cheap on the other. A named group is a part of a pattern that has a name. An indexed group has only a number.

The reason for this section is that the engine ships one code path for both runtimes. If a regex choice wins on Node and loses on Bun, you must know about the choice and weigh its gain against its loss.

To try it, use a micro benchmark and not the engine. A micro benchmark times a small piece of code alone. The benchmark is one file. The file times the first execution and 1000 hot executions of each regex in `common.ts`. The file does this in both runtimes, on the inputs of the `config` workload. The file also times the same regex with and without `u`, and with named and indexed groups.

The measurement is the time in µs of the first execution and the time in ns of one hot execution. The result has one row for each regex and each runtime.

This section gives a table and not a change. The table gives the cost for each runtime to 2A and 4A. The table goes in the results as the reference for later work.

## 2C. `token.groups` destructuring

A regex with named groups builds a `groups` object on every match. The `groups` object has a null prototype (no prototype) and one property for each group. The engine destructures seven names from the `groups` object on every token. To destructure is to read properties of an object into separate variables. A regex with indexed captures does not build the object. This change is the same as 4A, and 4A has the measurement.

This section is the view of the change on the cold first parse. The reason for the change is the cost of the `groups` object. A dictionary-mode object has its properties in a hash table, so the engine creates and reads the object more slowly. The creation of the `groups` object is in the line that the engine runs most often. On the first parse, the object also adds the shapes and inline caches of one more object type.

To try the change and to measure it, see 4A. The cold first parse numbers of the 4A run are in the Results table below. The decision is in 4A.

## 2D. The config preprocessing

The function `configPreprocessing` in `src/compileConfig.ts` turns the config of the user into the config of the engine. A CLI runs the function once for each process, so all of its cost falls in the cold first parse. For the `config` workload, this cost is the difference between `argmate` and `argmate/engine` in the cold table. The difference is about 550 µs of the first parse on Node. The difference is the largest single piece of the first parse.

The preprocessing does four things.

- The preprocessing makes several passes over the parameters.
- The preprocessing splits alias strings and conflict strings with regexes.
- The preprocessing copies objects to normalize property aliases.
- The preprocessing builds the output template, the validate list and the alias map.

Each pass and each regex runs for the first time in the new process, so each one adds to the cold first parse.

To try it, first run 5C with a timer around `configPreprocessing` alone. The timer shows the share of the function in the first parse. Then make these variants.

- The first variant normalizes the aliases (`describe`, `desc`, `description` and the others) only when a key is not canonical. The variant uses a charCode check before the loop.
- The second variant replaces the regex splits of alias strings and conflict strings with a split on `,` and a trim. The reason is that the list deviders regex is only for strings.
- The third variant makes one pass that builds the output template, the lists and the alias map together. The old form makes one pass for each of these three things.
- The fourth variant moves the panic checks for config errors behind one `if`. The `if` tests whether the config needs any check.

The precompile path (the plugin discussed on 2026-11-01) removes the whole preprocessing. The result of the precompile path is the ceiling, which is the best result that any variant can reach. The `precompiled` row of the cold table shows the full cost of the preprocessing.

The measurement is the cold first parse on `config`, `files` and `groups`. All three workloads go through `argMate` with a config. The hot parse on `config` also includes the preprocessing, because `argMate` runs the preprocessing on every call. So a gain shows there too.

The decision rule is to keep each variant that lowers the cold first parse on all three workloads. The essential core logic rule applies. The rule means one pass, the short branch first, and no helper locals (extra local variables).

## Results

The tables compare an old form with a new form. The old form is the engine without the change. The new form is the engine with the change. In each comparison, the faster form is 1.00x.

A value such as old 1.03x means that the old form needs 1.03x as long as the new form. A value such as new 1.05x means that the new form needs 1.05x as long as the old form. The value 1.00x means that both forms need the same time. The words no change mean that the interval of the result includes 0. A pair of values with a slash gives the value for Node first and the value for Bun second.

A cold time is the time of the cold first parse, or the total when the cell says total. The total is the time to load the engine and to make the first parse in a new process. A size is in KB, and 1 KB is 1,024 bytes. All sizes are sizes of the bundle `argMate.js`.

| Section | Runtime | Cold first parse `config` (ratio) | Cold first parse `plain` (ratio) | Hot `config` (ratio) | Regexes touched | Kept | Date, commit, machine |
|---|---|---:|---:|---:|---:|---|---|
| 2A | node / bun | old 1.02x / new 1.01x (2Ac) | old 1.09x / old 1.03x (2Ac) | no change (2Ac) | Not counted again | Yes for 2Ac. No for 2Aa and 2Ab | 2026-11-02, `1152549`, M1 Pro |
| 2B | node / bun | not applicable | not applicable | not applicable | not applicable | A table, see below | 2026-11-02, `1152549`, M1 Pro |
| 2C | node / bun | 1.00x / old 1.03x (4A, no change) | old 1.01x / old 1.01x (4A, no change) | old 1.15x / old 1.16x (4A) | | Yes, this is 4A | 2026-11-02, `1152549`, M1 Pro |
| 2D | node / bun | old 1.20x / old 1.03x (`m3`, first parse `config`). With 2Dc2 added, old 1.05x / old 1.06x | not applicable | old 1.21x / old 1.17x (`m3`) | | Yes for 2Da, 2Db and 2Dc2. No test of the alias normalization, one pass and the panic checks | 2026-11-02, `1152549`, M1 Pro |

### 2A: what was run

| Variant | What | Cold | Hot | Result |
|---|---|---|---|---|
| 2Aa | `autoNumber` with a loop in place of `re.autoNumber`. The size is 22.52 KB in the old form and 22.89 KB in the new form. | First parse. Node old 1.04x - 1.08x (`plain`, `config`, `precompiled`). Bun new 1.06x (`files`). | Node old 1.28x (`files`). Bun new 1.17x (`files`) and new 1.02x (`precompiled`). | Drop, because the two runtimes disagree |
| 2Ab | Loops in place of `hasDigit`, `hasNonAscii`, `onlyDigits`, `isKebab` and `kebab2camel`. The size is 22.52 KB in the old form and 23.04 KB in the new form. | Total. Node new 1.01x (`config`) and new 1.02x (`precompiled`). | `plain` old 1.18x on Node and old 1.08x on Bun. The other workloads show no change. | Drop, because the cold cost of five new functions is more than the gain on one workload |
| 2Ac | Return, before `+VAL` and the regex, text that does not start with a digit or a dash. The size is 22.52 KB in the old form and 22.58 KB in the new form. | Total. Node old 1.05x (`plain`), old 1.02x (`config`), old 1.04x (`files`) and old 1.04x (`precompiled`). Bun old 1.01x (`plain`). The other workloads show no change on Bun. | `files` old 2.98x on Node and old 1.41x on Bun. `plain` old 1.08x on Node. No workload gets slower. | Keep |

The first character test (2Ac) does what the hand-written number test of 2Aa was meant to do. The test keeps the regex for the text that can be a number. On Bun, a regex needs less time than the same test written as a loop. The result holds for a string that JavaScriptCore has not seen before (2Aa and 2Ab).

This section does not change the regexes of `paramLong` and `paramShort`, or the first execution of the other regexes. The first execution of the 8 regexes of `plain` costs 160 to 190 µs on Node (5C). The text of 5E says that 170 to 270 µs of the first parse is the regex tier-up.

### 2D: what was run

The preprocessing is 600 µs of the first parse of `config` (5C). The warm-up probe (`warmup.js`) shows that the first call of `configPreprocessing` takes 626 µs on Node and the third call takes 25 µs. So about 540 µs are compile and cold state, and about 25 µs are work. The base engine is `m2` (the engine with the kept changes of that time), unless a row says another base.

| Variant | What | Cold | Hot | Size, old form against new form | Result |
|---|---|---|---|---|---|
| 2Da | The type test with no regex. `bool` is a string test. `file`, `folder` and `path` are a string test. The valid types are a `switch`. The array test is `endsWith('[]')`. | First parse. Node old 1.14x (`config`), old 1.14x (`files`) and old 1.18x (`groups`). Bun old 1.04x (`files`) and old 1.07x (`groups`). | `config` old 1.16x on Node and old 1.12x on Bun. `groups` old 1.42x on Node and old 1.20x on Bun. | 23.05 KB against 23.37 KB | Keep |
| 2Db | The code makes a name list from a string that has no comma, space, dash or non-ASCII letter, without the regex. The camel test is a loop. | Node `config` first parse old 1.03x (total old 1.02x). No change on Bun. | `groups` old 1.04x on Node. | 23.05 KB against 23.24 KB | Keep, the gain is small |
| 2Da with 2Db (`m3`) | | Total. Node old 1.10x (`config`), old 1.10x (`files`) and old 1.11x (`groups`). Bun old 1.03x (`files`). | `config` old 1.21x on Node and old 1.17x on Bun. `groups` old 1.47x on Node and old 1.20x on Bun. | 23.05 KB against 23.55 KB | Keep |
| 2Dc2 (against `m3`) | The checks of `spot`, `next`, `last`, the list of valid values and the names of `conflict` and `demand` are each in a function. The code calls the function when the config has that item. | Total. Node old 1.02x (`config`), old 1.02x (`files`) and old 1.01x (`groups`). Bun old 1.05x (`config`), old 1.03x (`files`, no change) and old 1.06x (`groups`). | Bun `files` new 1.02x. The other rows show no change. | 23.55 KB against 23.78 KB | Keep |

The preprocessing was 601 µs on Node and is 330 µs on `m4` (5C). Section 2D keeps `2Da`, `2Db` and `2Dc2`. The text of the section has four ideas. The ideas in the next list have no test.

- The alias normalization with a charCode check.
- One pass for the template, the lists and the alias map.
- The panic checks behind one `if`.

The 330 µs that remain are the compile of the function and the loop over the parameters. The warm-up probe shows that the work itself is small. So a new pass does not help.

The pattern is the same as in 1F. The cost is in the bytes that the engine compiles, not in the work that the bytes do.

### 2A, more variants (against `m4`)

| Variant | What | Cold | Hot | Size, old form against new form | Result |
|---|---|---|---|---|---|
| 1Da | Remove the six entries of `re` that nothing uses (1D). | Total. Node old 1.01x - 1.03x. | no change | 23.78 KB against 23.57 KB | Keep |
| 2Af | For `int` with digits only (no leading zero, fewer than 16 characters), return `+VAL` before the regexes. | First parse. Node old 1.03x (`config`), old 1.04x (`files`) and old 1.04x (`precompiled`). Bun old 1.02x (`precompiled`). | `config` old 1.03x on Node. | 23.78 KB against 23.91 KB | Keep, the gain is small |
| 2Ag | `isKebab` and `kebab2camel` are loops. | no change | `plain` old 1.19x on Node and old 1.10x on Bun. | 23.78 KB against 24.04 KB | Keep |
| 2Ae | A hand-written parser (`isSpace`, `nameEnd`, `longEnd`, `parseToken`) in place of `paramLong` and `paramShort`. The parser gives the match as the same array. | First parse. Node old 1.03x - 1.08x (4 of 5 workloads) and new 1.03x (`groups`). Bun new 1.02x - 1.06x. Total on Bun new 1.03x - 1.05x. On Bun, the new form needs more time on 5 of 5 workloads. | Node old 1.23x (`plain`), old 1.11x (`config`), old 1.40x (`groups`) and old 1.27x (`precompiled`). Bun old 1.15x - 1.40x (4 of 5 workloads). | 23.78 KB against 24.59 KB | Not kept, because the cold start is the goal and the new form needs more time on Bun |
| 2Ah | No `u` flag on `paramLong` and `paramShort` (against `max`). | no change (10 of 10 rows) | no change (9 of 10 rows) | 23.957 KB against 23.955 KB | Drop |

2Ae gives the same match as the two regexes for 3,000,000 random strings. The strings contain dashes, `=`, spaces (also `U+00A0`, `U+2003`, `U+FEFF`), digits, `no-`, letters, an emoji and a regional indicator. The command `node parsertest.js 3000000` finds 0 different results, and 2Ae passes the tests. Of the changes found after 4A and 2Ac, 2Ae is the strongest change to the hot path.

On Node, the cold first parse of the regexes needs 1.03x - 1.08x as long as 2Ae on 4 of 5 workloads. The reason is that V8 compiles a regex on its first execution and does not compile the loop. On Bun, the first parse of 2Ae needs 1.02x - 1.06x as long as the first parse of the regexes. The reason is that JavaScriptCore first runs the parser of 2Ae in its interpreter. JavaScriptCore compiles a regex at once.

A program that parses many times and runs on both runtimes will want 2Ae. The code of 2Ae is in `variants/2Ae/` and not in `engineMax`.

### 2B: the cost of a regex on V8 and on JavaScriptCore

The command `node regexbench.js 30` (`runs/2B-regexes.md`) measures two things. The first is the first execution of a new `RegExp` in a new process. The second is one execution after 200,000 other executions.

| Regex | Input | First, Node µs | First, Bun µs | Hot, Node ns | Hot, Bun ns |
|---|---|---:|---:|---:|---:|
| paramLong, indexed groups, `u` | `--dry-run=yes` | 42.5 | 64.3 | 80 | 64 |
| paramLong, named groups, `u` | `--dry-run=yes` | 27.2 | 22.9 | 129 | 98 |
| paramLong, indexed groups, no `u` | `--dry-run=yes` | 18.9 | 10.6 | 79 | 61 |
| paramShort, indexed groups, `u` | `-abc` | 18.8 | 9.7 | 66 | 55 |
| paramShort, named groups, `u` | `-abc` | 16.6 | 8.7 | 91 | 72 |
| autoNumber | `8080` | 39.1 | 14.1 | 32 | 28 |
| boolStringTrue | `yes` | 20.5 | 8.2 | 35 | 30 |
| listDeviders, split | `a,b` | 20.2 | 9.5 | 33 | 29 |
| notParam | `-- x` | 16.0 | 16.8 | 34 | 36 |
| the others (`numberish`, `hasDigit`, `hasNonAscii`, `onlyDigits`, `isKebab`, `kebab2camel`) | | 4.5 to 10.0 | 2.6 to 6.4 | 14 to 33 | 11 to 29 |

On Node, one hot execution of `paramLong` needs 1.61x as long with named groups as with indexed groups (129 ns against 80 ns). On Bun, the ratio is 1.53x (98 ns against 64 ns). The difference between named groups and indexed groups is the gain of 4A.

A first execution costs 5 to 40 µs on Node and 3 to 64 µs on Bun. On Node, the first execution of `autoNumber` needs 2.77x as long as on Bun. On Node, the first execution of `boolStringTrue` needs 2.50x as long as on Bun.

With the `u` flag, the first execution of `paramLong` needs 2.25x as long on Node (42.5 µs against 18.9 µs). On Bun, the ratio is 6.07x (64.3 µs against 10.6 µs). The `u` flag has no effect when hot. When 2Ah removed the `u` flag from the engine, nothing changed. So the first execution in a micro benchmark is not the same as the first execution in a parse.
