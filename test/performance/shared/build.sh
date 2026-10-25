#!/bin/bash
# Builds argmate to shared/dist/ with the flags of `bun run build-esm`, writes the files the benchmarks use,
# and checks that both engines give the same results. It builds from src/ as it is now, also from changes that are not committed.
set -e
cd "$(dirname "$0")"
rm -fr dist
bun build --target node --format esm ../../../src/argMate.ts ../../../src/argMateMini.ts ../../../src/argEngine.ts ../../../src/argEngineMini.ts --outdir dist/ --minify --sourcemap=none > /dev/null
bun gen.ts
node check.js
