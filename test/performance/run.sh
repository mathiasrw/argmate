#!/bin/bash
# Runs all benchmarks, one folder after the other, or only the folders given: ./run.sh compareLibs
# Each folder has its own run.js and writes its own results.md.
# The machine must be quiet: other work makes the numbers jump.
set -e
cd "$(dirname "$0")"
# On macOS, caffeinate keeps the machine awake: a sleep in the middle of a run stops it.
keepAwake=$(command -v caffeinate >/dev/null && echo 'caffeinate -i')
for dir in ${@:-engineSize engineHot engineCold engineCli compareLibs argInfoOnError}; do
	echo "== $dir"
	$keepAwake node "$dir/run.js"
done
