# Contributing to ArgMate

Thanks for taking a look. ArgMate is small, and we would like to keep it that way: fast, with zero dependencies, and with behaviour you can look up. This page tells you how the project is put together and how to check your change.

## Getting started

You need [Bun](https://bun.sh). Then:

```sh
bun install
bun tst
```

`bun tst` formats the code and runs all the tests on `src/`. It is fast, so run it often.

## Where the behaviour is written down

- `SPEC.md` is the specification. Each table row is a test: the input, the config, and the result or the error code. When you change what the engine does, change the row first.
- `README.md` has rows of the same kind, and they are tests too.
- `tools/generateTestsFromDocumentation.js` makes `test/spec.test.js` and `test/readme.test.js` from the rows. `bun run test` runs it for you; run it yourself after you edit a table and before `bun tst`.

A row that does not hold fails the test run. That is on purpose: the docs and the code can not drift apart.

## The tests

- `test/engine/` has the tests of each part of the engine.
- `test/engine/fix/` has a file for each item of the todo list, named by its number. A test of a point that is not done yet is a `test.todo`. When it passes, make it a `test`.
- `test/engine/fuzzy/` has rules that hold for any input, checked with random input. See below.
- `test/tsc/` has the tests of the types.

The tests run on the source, and on the ESM and CommonJS bundles as npm gets them (`ARGMATE_TEST_TARGET` is `src`, `esm` or `cjs`).

## The scripts

- `bun tst`: the format, and all tests on `src/`. It is fast.
- `bun run test`: the tests made from the docs, `tst`, the lint, then the build and all tests on the ESM bundles and on the CommonJS bundles. Run this before you push.
- `bun run test-todo`: the tests of the points that are not done. A test that passes now is shown as a failure: remove its `.todo`.
- `bun run test-tsc`: the tests of the types.
- `bun run test-fuzzy`: the fuzz tests.
- `bun run build`: `dist/types.d.ts` must be one clean file with no `import` line two times.
- `bun run test-pack`: the package as npm gets it, with `import` and `require` in a new project.
- `bun run test-perf`: the speed of a parse. Run it before and after a change to the engine.

## Fuzz tests

`bun run test-fuzzy` checks rules that hold for any input, with a thousand random inputs for each rule. They are not part of `bun run test`, as a new seed each run means a new input each run, and a normal test run must give the same answer each time.

The input comes from a seed, so a run can be repeated. When a rule does not hold, you get the error, the case, and the commands that run it again:

```
error: The parameter 'out-dir' is a boolean (a flag) so can't assign a value like 'OFF'

The case:
  args: '--out-dir=OFF' '--out-dir'
  config: {"outDir":{"type":"boolean"},"mode":{"type":"string"}}

Run this case again:
  FUZZ_SEED=25 FUZZ_ROUNDS=1 bun test ./test/engine/fuzzy -t 'gives each value in the form it is typed'

Run all with this seed:
  FUZZ_SEED=7 bun run test-fuzzy
```

`FUZZ_ROUNDS=20000 bun run test-fuzzy` runs more cases. When the fuzz tests find a bug, add the case as a row in `SPEC.md` or as a test in `test/engine/`, so it stays fixed.

## The engine

`src/argEngine.ts` is the product. `src/argEngineMini.ts` is a smaller engine for the curious; it gets no new features.

The engine is fast because it does few things. It reads the input once, and as soon as a value is final it is stored and the next input is read. When you have two ways to write something, measure both. A comment says why, as the code shows what.

## Commits

One line, saying what the change does.
