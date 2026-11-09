# Area 1: Load time, bytes and module shape

Load is the time from `import 'argmate'` to the moment when the module is ready. On Node, the load of `argmate` is about 580 µs. The load of `argmate/engine` is about 385 µs. The difference of about 200 µs is the load of `compileConfig`, `helpText` and `formatArgInfo`. A successful parse never runs the code of these three parts. Every CLI (command line program) pays the load, every time, before it reads the first byte of input.

These terms have one meaning in this document.

- A runtime is a program that runs JavaScript. The two runtimes are Node and Bun.
- V8 is the part of Node that compiles and runs JavaScript.
- CJS is the CommonJS module format, which uses `require()`. ESM is the ES module format, which uses `import`.
- A bundle is one file that a bundler makes from many source files. An entry point is a module that a user imports, for example `argmate` or `argmate/engine`.
- To minify code is to make the file smaller, for example with no spaces and with short names.
- The engine is the part of `argmate` that parses the arguments. In the code, the engine is the function `argEngine`.
- The first parse is the first call of the parser in a process.
- The hot path is the code that runs in every parse.
- An async function gives a promise, not the value, and the caller needs `await`. A sync function gives the value at once.
- Cold start is the case of a new process that loads the module and makes the first parse. The cold total is the time of the cold start, that is, the load time plus the first parse time.
- Hot is the case of one parse after the same process made many parses.
- A workload is a fixed test case for the benchmarks. The workloads are `plain`, `config`, `files`, `groups` and `precompiled`.
- A variant is a copy of the engine code with one change. The base is the engine without that change.
- A ceiling is a variant with a block of code cut out. A ceiling is not correct, so a ceiling runs with `--no-test`. The gain of a ceiling is the most that a real change of that block can give.
- A closure is a function inside another function, with the variables that it uses from the outer function.
- Noise is the random change of a time from one run to the next. The 95 % interval of a difference is a range of likely values for the true difference. If the range includes zero, the difference is inside noise, and the row says no change.
- A ratio compares two times. The sentence "A needs 1.26x as long as B" means that the time of A divided by the time of B is 1.26. For a gain, A is the old form and B is the new form.
- A size is in KB. 1 KB is 1,024 bytes.

The cold harness `../engineCold/cold.js` measures the load. The harness prints the load time of the bundle as its first number. The size comes from `../engineSize`. The hot benchmark also runs, to check that a change for load does not cost hot speed.

## 1A. Fewer modules, and a lazy `argInfo`

The file `argMate.js` is one bundle. This bundle holds the code for the help text and the code for the config preprocessing. The change makes `argInfo` and its formatting a dynamic `import()`. A dynamic `import()` loads a module when the code reaches it, not at load. The `import()` runs only when the program calls `argInfo()` or when an error prints help. So a successful parse never loads the bytes of `argInfo` and its formatting, and never pre-parses these bytes.

V8 reads every byte of the bundle at load. V8 also pre-parses the bundle. A pre-parse is a fast scan that finds where each function ends. V8 does not compile a function body before the first call, so the cost is less than the cost of a full compile. But V8 still reads and scans the file. A cut of 4.0 KB - 5.0 KB of minified code from the load path is a measurable part of an 11.0 KB bundle.

To try it, replace the static import of `helpText.js` in `src/argService.ts` with `await import('./helpText.js')` inside `argInfo()`. The replacement makes `argInfo()` async. The other form keeps `argInfo()` sync and uses a `require` in the CJS build only. The choice between the two forms needs a decision. An async `argInfo()` is a breaking change, and v1 allows breaking changes. The async form also changes how the error callback prints help.

Try the async form first to get the number. Then decide the API (the public functions and settings of the library).

The measurements are these.

- The cold load for `argmate`.
- The size of `argMate.js`.
- The hot benchmark on `config`.
- The cold load of the help path. The help path is a parse that fails and prints help, for example with `--nope`. The timer includes the extra import.

Keep the change if both of these are true.

- The load drops by more than the 95 % interval.
- The help path does not get slower by more than the load that the change saves.

Also record the API change that the change needs.

## 1B. CJS versus ESM

On Node, `require()` of a CJS file links faster than `import` of an ESM file, by a few hundred µs on a small graph. The `exports` field gives the ESM file to `import` and the CJS file to `require`. A CLI that uses `import` gets the slower path, and the CLI has no choice.

ESM linking resolves the module graph, checks the exports and runs the modules in a separate phase. A module graph is the set of modules that import each other. CJS runs the file in one step. Node 22 made ESM faster. So the size of the gap needs a measurement. Do not assume the gap.

To try it, follow these steps.

1. Add the CJS file to `../shared/build.sh`.
2. Build both files as `bun run build` does.
3. Run the cold harness with `import('../shared/dist/argMate.js')`.
4. Run the cold harness with `createRequire(import.meta.url)('../shared/dist/cjs/argMate.cjs')`.

The measurements are the cold load on Node and on Bun. Check that the first parse does not change.

This section gives information. The section does not change the code, unless the gap is large. If the ESM load on Node needs more than 1.08x as long as the CJS load, the README gets a line. The line recommends `require` for a CLI that wants the fastest start. Then the `default` export condition gets a review.

## 1C. Minify, and what it does to parse time

The build minifies the code. Fewer bytes mean a shorter read. But the parse time of V8 follows the number of tokens and functions more than the number of bytes. The task is to check that minification does not make the parse slower.

Minification can make the parse slower in two cases. In the first case, minification puts the code of helpers into one expression. In the second case, minification turns `if` chains into nested ternaries that the pre-parser handles worse. A ternary is an expression in the form `a ? b : c`.

To try it, build `argMate.js` in four ways.

- With `--minify`.
- Without `--minify`.
- With `--minify-syntax` alone.
- With `--minify-whitespace` alone.

Bun has three flags for this, which are `--minify-syntax`, `--minify-whitespace` and `--minify-identifiers`.

The measurements are the cold load of each build and the size of each build.

Keep the flags that give the lowest load. If the unminified build loads as fast, the gzip size decides. The reason is that npm and JSR send gzip files over the network. The gzip size is the size of the file after gzip compression.

## 1D. No work at module evaluation

The file `common.ts` builds the `re` object at load. The object holds about 25 regex literals. A regex literal is a regular expression that the code writes in place, for example `/a+/`. The file `argEngine.ts` has helpers at the module level.

All code at the top level of a module runs at module evaluation, that is, at load. The task is to find each piece of work at module evaluation. Move the work into the function that needs it. Or make the work a literal that V8 can create without running code.

A regex literal creates a JSRegExp object at evaluation. V8 compiles the pattern of the regex later, at the first use. So the object is cheap. But 25 of them in one object literal are still 25 allocations. The 25 regex objects also make an object that V8 stores as a dictionary. All of this work happens before the first line of the engine runs.

Bun creates the regex object in the same way. Yarr (the regex compiler of Bun) compiles the pattern at the first match.

To try it, make three variants.

- Variant one keeps `re` with only the regexes that the engine uses. Variant one also moves the preprocessing regexes to `compileConfig.ts`.
- Variant two makes each regex a module-level `const`. Then the bundler can drop the regexes that an entry point does not use. The bundler cannot do this with the properties of one object.
- Variant three uses the regexes of the hot path as local literals inside the engine function. This variant measures whether a literal inside a function costs time on each call. V8 creates the regex object once for each literal site and caches the pattern. But V8 creates the object again on each evaluation of the literal in a new closure.

The measurements are these.

- The cold load for `argmate` and for `argmate/engine`.
- The size.
- For variant three, the hot time on `config` and `plain`.

Keep the variant with the lowest load that does not cost hot speed. This section overlaps with 2A. A regex that 2A replaces leaves this list.

## 1E. No `process` at load

The file `helpText.ts` reads `process.stdout.columns` for the width of the help. The file reads the value inside `argInfoFormat`, and this is correct. The task is to check that no other code touches `process`, `globalThis`, `Deno` or `Bun` at module evaluation. The check includes the `script()` helper and the `'undefined' !== typeof process` guards.

A module that touches `process` at load cannot go into a snapshot (3A). A snapshot is a saved copy of the memory of a process, and Node can start a program from it. The module also runs slower in a worker (a second thread of the program). The touch is a side effect too. A side effect keeps a bundler from dropping the module as unused.

To try it, follow these steps.

1. Use `grep` to find `process`, `typeof` and `globalThis` at the top level of each source file.
2. Build the bundle.
3. Read the bundle for any code that runs before the first `function`.

The measurement has no number. The result is a list of places. When the work ends, the list is empty.

Move every use inside a function. This section is a check. It is also a condition for 3A and 3B.

## 1F. Node compile cache, and lazy compilation of the late checks

V8 pre-parses every function at load. V8 compiles a function fully at the first call. The function `argEngine` has about 500 lines. The first parse compiles all of `argEngine`. The compile includes the late checks for `validate`, `transform`, `mandatory`, `conflict`, `demand` and `crossValidate`. V8 compiles the late checks also for a config that has none of them.

Node 22 has `module.enableCompileCache()`. This function saves the compiled code on disk between runs. The author of a CLI can call the function. The library cannot call the function. But the author of the library can write the code so that the cache gives a gain.

The compile time follows the size of the function that runs. V8 only pre-parses a function that no code calls. A full compile needs about 10 times as long as a pre-parse. The late checks can move into a function that the engine calls only when the config has any of them. Then the plain case compiles about half of the engine.

To try it, make two variants. Then test the compile cache.

- Variant one puts the late checks in a function `late(output, configObj, typed)` at the module level. The engine calls the function when `validate.length || transform.length || mandatory.length || conflict.length || demand.length || crossValidate` is true.
- Variant two does the same. Variant two also puts the unknown-parameter branch and the short-group split in their own functions. The `config` workload has neither.
- For the compile cache, run the cold harness with `NODE_COMPILE_CACHE=/tmp/cc` set. Do a warm run first. The warm run fills the cache. Then measure what the cache saves with the split and without the split.

The measurements are these.

- The cold first parse on `plain` and `precompiled`, where the late checks do not run.
- The cold first parse on `config`, where the late checks run.
- The hot time on all five workloads. A call across a function boundary can cost time on the hot path when V8 does not inline the call. To inline a call is to copy the code of the called function into the caller.

Keep the variant if the cold first parse drops on `plain` and `precompiled`, and the hot times stay inside the interval. Drop the variant if the hot time on `config` is more than 1.02x as long as the hot time of the base. This section overlaps with 2D.

## Results

Each ratio in the table compares the times of two forms. The cell names the form that needs more time and the form that needs less time. A size cell gives the size of the old form first and the size of the new form second. `n.a.` means not applicable.

| Section | Runtime | Cold load | Cold first parse | Hot `config` | Size | Kept | Date, commit, machine |
|---|---|---:|---:|---:|---:|---|---|
| 1A | node / bun | With the help code, the cold total needs 1.08x - 1.10x (Node) and 1.09x - 1.14x (Bun) as long as the ceiling `C4`, which has no help code. All of it is load | no change | n.a. | 23.1 KB against 17.3 KB | Not decided. See todo item 60 | 2026-11-02, `1152549`, M1 Pro |
| 1B | node / bun | CJS needs 1.07x (Node) and 1.13x (Bun) as long as ESM (CJS is slower) | ESM needs 1.02x (Node) and 1.09x (Bun) as long as CJS (CJS is faster) | n.a. | n.a. | No. This is information. `require()` is not faster | 2026-11-02, `1152549`, M1 Pro |
| 1C | node / bun | The builds with no minify, with syntax only and with whitespace only need more time than the build with `--minify`. These builds need 1.08x - 1.13x as long on Node and 1.05x - 1.08x as long on Bun | n.a. | n.a. | 22.5 KB against 31.5 KB - 42.3 KB | Keep `--minify` | 2026-11-02, `1152549`, M1 Pro |
| 1D | node / bun | On Node, the cold total with the six regexes needs 1.01x - 1.03x as long as without them (3 of 5 rows). On Bun there is no change | no change | no change | 23.78 KB against 23.57 KB | Yes. Remove the 6 regexes that nothing uses | 2026-11-02, `1152549`, M1 Pro |
| 1E | node | n.a. | n.a. | n.a. | n.a. | Nothing to change. The list is empty | 2026-11-02, `1152549`, M1 Pro |
| 1F | node / bun | 1Fx needs 1.01x as long as the base on Node (a small loss) and 1.01x on Bun (no change) | The base needs 1.11x (Node) and 1.13x (Bun) as long as 1Fx (`config`) | no change | 22.52 KB against 23.06 KB | Yes for 1Fb, 1Fd and 1Fe as `1Fx`. No for 1Fa, 1Fc and 1Fg | 2026-11-02, `1152549`, M1 Pro |

### 1F: what was run

Each variant runs against the engine of the branch (`1152549`). That engine is the base. A cold row uses 100 processes, and a hot row uses 10 rounds. The workloads are `plain`, `config`, `files`, `groups` and `precompiled`. The runtimes are Node v24.22.1 and Bun v1.4.3. The tables of each run are in `runs/`.

A ratio in the tables is the time of the base divided by the time of the variant. A ratio above 1.00x means that the variant is faster. If the variant is slower, the cell says so and gives the time of the variant divided by the time of the base. The run files also give the 95 % interval of each difference. A row counts as faster or slower only when the interval excludes zero.

The compile of the engine function at its first call needs between 515 µs and 600 µs (5C). The ceilings below are the engine with a block cut out. They are the variants `C1` to `C3`.

| Cut out | Cold total, Node (base compared to variant) | Cold total, Bun (base compared to variant) | Size of `argMate.js` (base against variant) |
|---|---:|---:|---:|
| The 32 error objects (`C1`) | 1.09x - 1.11x | 1.10x - 1.14x | 22.5 KB against 18.9 KB |
| The spots block (`C2`) | 1.03x | 1.03x - 1.06x | 22.52 KB against 21.77 KB |
| The slices block (`C3`) | 1.03x | 1.03x | 22.52 KB against 21.72 KB |

The bundle `argEngine.js` is 11.7 KB with the error objects and 8.1 KB without them. With the error objects, the load needs 1.06x - 1.09x as long, because the bundle has more bytes. The first parse needs 1.09x - 1.20x as long.

| Variant | What | Cold total | Hot | Size of `argMate.js` (base against variant) | Result |
|---|---|---|---|---|---|
| 1Fa | All late checks in one function `late()` | The base needs 1.09x as long as 1Fa on `plain` (Node and Bun). 1Fa needs 1.02x - 1.03x as long as the base on `precompiled` and `config` | On Bun, 1Fa needs 1.06x as long as the base on `config` and 1.04x as long on `precompiled` | 22.52 KB against 22.81 KB | Drop. On Bun, the hot time of 1Fa on `config` is more than 1.02x as long as the base. The configs that have checks also need more cold time |
| 1Fb | `exists`, `conflict` and `demand` each in a function. The engine calls the function only when the list is not empty | On Node, the base needs 1.03x - 1.04x as long as 1Fb (4 of 4 rows). On Bun, the base needs 1.01x - 1.04x as long (3 of 4 rows) | no change (8 of 8) | 22.52 KB against 22.86 KB | Keep |
| 1Fc | The error object in a closure (`() => ({...})`) | On Node, the base needs 1.00x - 1.02x as long as 1Fc, and most rows show no change | On Node, 1Fc needs 1.01x - 1.05x as long as the base. On Bun, 1Fc needs 1.53x as long on `files` | 22.52 KB against 22.71 KB | Drop. The closure moves the loop variables to a context (a heap store for the variables that a closure uses) |
| 1Fd | The spots block in `paramValueFromSpot()` | On Node, the base needs 1.02x - 1.04x as long as 1Fd (4 of 4 rows). On Bun, the result is mixed | no change (8 of 8) | 22.52 KB against 22.65 KB | Keep |
| 1Fe | The slices block in `paramValueFromNextOrLast()` | On Node, the base needs 1.01x - 1.03x as long as 1Fe (3 of 4 rows). On Bun, the result is mixed | no change (8 of 8). In one row, 1Fe needs 1.00x as long as the base | 22.52 KB against 22.61 KB | Keep |
| 1Fx | 1Fb, 1Fd and 1Fe together | On Node, the base needs 1.06x - 1.09x as long as 1Fx. On Bun, the base needs 1.04x - 1.12x as long. All 10 rows are faster. The first parse of the base needs 1.10x - 1.22x as long | no change on 9 of 10 rows. On Bun, the base needs 1.20x as long as 1Fx on `files` | 22.52 KB against 23.06 KB | Keep. The gains add up |
| 1Fg | The error object made in `fail()` from positional arguments (32 sites) | The first parse of the base needs 1.02x as long as 1Fg on Node. The cold total shows mostly no change | no change | 22.52 KB against 21.85 KB | Drop. The gain is only 1.01x - 1.02x of the cold total, for the size change in the Size column |

The tables show that V8 compiles a function at the first call, whatever the branches do. So code that most parses do not run belongs in its own function. The engine calls that function from a condition that the engine already tests. The hot path does not change, because the condition was there before.

A closure is not the same. A closure moves the variables of the loop to a context (1Fc). The result of section 1F is `1Fx`. The error objects are the largest piece that is still in the engine. In `C1`, the base needs 1.09x - 1.11x as long as the engine without the error objects on Node. Variant 1Fg got only a part of the gain of `C1`, because the text of the messages stays.

### 1A, 1C, 1D, 1E: what was run

1A, the help in the bundle. The ceiling `C4` is `argmate` with no help code. In `C4`, `argService.ts` has no `helpText.js`, and `argInfo` throws an error. The run uses `--no-test` against the variant `m2`. The bundle `argMate.js` is 23.1 KB with the help code and 17.3 KB in `C4`.

On Node, the cold total with the help code needs 1.10x (`plain`), 1.09x (`config`) and 1.08x (`groups`) as long as the cold total of `C4`. On Bun, the ratios are 1.14x, 1.09x and 1.11x. These ratios are for the cold start of a program that never prints help. The first parse is the same, so all of the difference is the load of the bytes.

The workload `precompiled` loads `argEngine.js`, which never had the help code. The result of `precompiled` is the same. On Node, the ratio is 1.00x, and there is no change.

A real change needs an API decision. One choice is `argInfo` only from `argmate/info`. The other choice is a dynamic `import()` that makes `argInfo()` async. See item 60 of `todo.md`.

1C, the flags of `bun build`. The base is the build with `--minify`, which sets all three flags. The base is 22.5 KB. The ratios below compare the cold total of each other build to the cold total of the base.

- The build with only `--minify-syntax` is 40.7 KB. This build needs 1.10x - 1.12x as long as the base on Node and 1.05x - 1.08x as long on Bun.
- The build with only `--minify-whitespace` is 31.5 KB. This build needs 1.08x - 1.09x as long as the base on Node and 1.07x as long on Bun.
- The build with only `--minify-identifiers` is 34.3 KB. This build needs 1.04x as long as the base on Node. On Bun there is no change.
- The build with no minify is 42.3 KB. This build needs 1.12x - 1.13x as long as the base on Node and 1.05x - 1.06x as long on Bun.

The extra time is the load of the extra bytes. The build stays as it is. This test did not measure gzip, because a program does not load a gzip file.

1D, work at module evaluation. After the kept changes, six entries of `re` in `common.ts` have no user. They are `isArrayType`, `bool`, `onDisk`, `validTypes`, `keyNum` and `truncate`. The entries `keyNum` and `truncate` had no user before.

The variant `1Da` removes the six entries. The bundle `argMate.js` is 23.78 KB with the entries and 23.57 KB without them. On Node, the cold total with the entries needs 1.01x - 1.03x as long as without them. The rows `files`, `groups` and `precompiled` are outside noise. On Bun there is no change. The hot time is the same.

The runtime creates the regexes at load and compiles them at the first use. So a regex that no code runs costs only the allocation. An entry point has all entries of `re` today. An object `re` with separate constants for the entries lets a bundler drop the entries that an entry point does not use. This was not tried, because the gain is only the allocations of a few regexes.

1E, `process` at load. At module evaluation, the files `argEngine.ts`, `compileConfig.ts`, `common.ts`, `argService.ts` and `helpText.ts` run only constants, functions and regex literals. The code reads `process` in three places, and all three are inside functions. The first place is `script()`. The second place is `argInfoFormat`, when the code makes the help. The third place is the check of a `file`, `folder` or `path` value, through `globalThis.process.getBuiltinModule`.

The file `argService.ts` keeps the config of the last parse in two variables of the module. A parse sets both variables. The list is empty. So the code of the library does not block a snapshot (3A).

### 1B: CommonJS and ESM

The command is `node cjs.js 200 max` (`runs/1B-cjs-max.md`). In a new process, the command loads `argMate.cjs` with `require()` and `argMate.js` with `import()`. Then the command makes the first parse of `config`. The times in the table are in µs. A ratio compares the slower form to the faster form. The 95 % interval is in brackets.

| Runtime | Load ESM (µs) | Load CJS (µs) | Load, CJS compared to ESM | First parse ESM (µs) | First parse CJS (µs) | First parse, ESM compared to CJS |
|---|---:|---:|---:|---:|---:|---:|
| node | 1416.5 | 1515.5 | 1.07x (1.05x - 1.09x) | 1015.4 | 992.1 | 1.02x (1.01x - 1.04x) |
| bun | 969.0 | 1097.8 | 1.13x (1.11x - 1.15x) | 1049.9 | 961.2 | 1.09x (1.06x - 1.11x) |

The load of the CJS file takes more time. The first parse of the CJS file takes less time. The reason is that the CJS load already does some work that the ESM form does at the first use.

On Node, the load plus the first parse of the CJS form needs 1.03x as long as the ESM form. On Bun, the CJS form needs 1.02x as long. A recommendation to use `require` for a CLI is wrong. So the README gets no line, and the `default` condition stays as it is.

The absolute loads are higher than the loads of `cold.js`, because `cjs.js` imports more before the timer starts. Both forms use the same measurement, so the difference is valid.

### 1Fe again: the shape of the function (review of `engineMax`, 2026-11-02)

The first `engineMax` had `paramValueFromNextOrLast` with 12 positional arguments. It also had `let VAL: string = undefined as unknown as string` in the engine. The review made two checks before it accepted these parts.

The first check asks whether the gain of the slice function is small. The check compares `max` with `maxInline` on the final build. The version `maxInline` has the original block in the engine and no function. The check uses 150 processes and 10 hot rounds. All versions in the table have `maxInline` as the base.

| Version | Arguments | First parse, Node (inline compared to this version) | First parse, Bun (inline compared to this version) | Hot | Size of `argEngine.js` (inline against this version) |
|---|---:|---|---|---|---:|
| `max` | 12 | 1.03x - 1.07x (5 of 5 outside noise) | 1.04x - 1.06x (5 of 5) | no change | 12.35 KB against 12.44 KB |
| `maxSlice6` (the check of `ASSIGN` stays in the engine) | 6 | 1.03x - 1.06x (5 of 5) | 1.03x - 1.06x (5 of 5) | no change | 12.35 KB against 12.41 KB |
| `maxSlice5` (the state of the token in one object) | 5 | 1.03x - 1.06x (5 of 5), total 1.01x - 1.03x (5 of 5) | 1.03x - 1.05x (5 of 5), total 1.02x (3 of 5) | no change | 12.35 KB against 12.48 KB |

The gain is not small. Without the function, the first parse needs 1.03x - 1.07x as long as with the function, on both runtimes. The cold start of `config` needs 1.02x - 1.03x as long without the function. The other two versions give about the same gain.

The ceiling `C3` gives about the same gain. In `C3`, the cold total with the block needs 1.03x as long as the cold total without the block. So the slices stay in a function.

The 12 arguments only rebuilt what the parameter already carries (key, type, `next`, `last`). The variant `maxSlice6` showed that the `ASSIGN` error costs compile time if the error goes back into the engine. On Node, the first parse of `maxSlice6` needs 1.01x - 1.02x as long as the first parse of `max`. So the error stays in the function.

The state of the token goes in as one object with named fields. This is the call `paramValueFromNextOrLast(args, output, param, error, {KEY, alias, ASSIGN, VAL, arg})`. That call is `engineMax` now.

The engine declares `VAL` as `let VAL = ''`. The old destructuring of `token.groups` gave `undefined` for `VAL`, because the regex has no such group. The cast kept that value.

The code reads `VAL` only after the code sets `VAL`. With `=`, `VAL` is the text after the `=`. Without `=`, `VAL` is `args.pop()`. A `count` parameter with no `=` never reads `VAL`.

The tests pass with both values, so the tests do not show which value is right. For this reason the file `difftest.js` holds a differential test. A differential test gives the same input to two builds and compares the results.

The test gives the same random config to the two builds. The config has types, aliases, defaults, `mandatory`, `validate`, `transform`, `conflict`, `demand`, `spot`, `next` and `last`. The test also gives the same settings and arguments. The two builds must give the same result or the same error, with the same key order.

For a deliberately broken engine, the test finds 3,679 differences in 20,000 cases. A sentinel is a special value that no other code uses. A build of `engineMax` with the sentinel `'\u0001UNSET\u0001'` in `VAL` gives 0 differences in 300,000 cases. In 90,814 of these cases, the result is an error. This holds for the full engine and for the mini engine. So `''` and `undefined` give the same result, and the engine has no cast.
