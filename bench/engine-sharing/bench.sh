#!/bin/bash
# Compares the variants of the engine with hyperfine. Run build.sh first.
#   ./bench.sh <name of the pass> <the variants in the sequence to run them>
# Hot: one process parses the input 200000 times, so the JIT compiler has optimized the engine.
# Cold: one process parses one time, as a CLI does.
set -e
cd "$(dirname "$0")"
pass="${1:-pass1}"
variants="${2:-now,this,param,tail,hot}"
out=dist/results
mkdir -p "$out"

for runtime in bun node; do
	for workload in config plain; do
		hyperfine --warmup 2 --runs 12 -N \
			--export-json "$out/hot-$runtime-$workload-$pass.json" \
			-L variant "$variants" -n "{variant}" \
			"$runtime run.js {variant} $workload 200000"
	done
done

for runtime in bun node; do
	hyperfine --warmup 20 --runs 300 -N \
		--export-json "$out/cold-$runtime-config-$pass.json" \
		-L variant "$variants" -n "{variant}" \
		"$runtime run.js {variant} config 1"
done
