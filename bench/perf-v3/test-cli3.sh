#!/bin/bash
set -e

command -v hyperfine >/dev/null || brew install hyperfine
command -v bun >/dev/null || (brew tap oven-sh/bun && brew install bun)
command -v node >/dev/null || brew install node

OUTFILE=../results/cli-performance.txt
mkdir -p "$(dirname "$OUTFILE")"

bun install arg commander meow minimist mri nopt oclif sade yargs-parser yargs > /dev/null
echo 
# Compile executables without the .exe extension for macOS
bun build argMate/argMate.dist.js --compile --outfile argMate/argMate.cli
bun build argMateMini/argMateMini.dist.js --compile --outfile argMateMini/argMateMini.cli

echo 
{
  echo "--- Library Versions ---"
  echo "Node: v$(node -v)"
  echo "Bun: v$(bun -v)"
  echo "arg: v$(bun -p 'require("arg/package.json").version')"
  echo "commander: v$(bun -p 'require("commander/package.json").version')"
  echo "meow: v$(bun -p 'require("meow/package.json").version')"
  echo "minimist: v$(bun -p 'require("minimist/package.json").version')"
  echo "mri: v$(bun -p 'require("mri/package.json").version')"
  echo "nopt: v$(bun -p 'require("nopt/package.json").version')"
  echo "oclif: v$(bun -p 'require("@oclif/core/package.json").version')"
  echo "sade: v$(bun -p 'require("sade/package.json").version')"
  echo "yargs: v$(bun -p 'require("yargs/package.json").version')"
  echo "yargs-parser: v$(bun -p 'require("yargs-parser/package.json").version')"
  echo "argmate: v$(bun -p 'require("../../package.json").version')-$(git branch --show-current)-$(git rev-parse --short HEAD)"
  echo

  run_hyperfineBoth() {
    local runtime="$1"
    local params="$2"

    echo "Benchmarking: $runtime ${params}\n"

    # hyperfine --warmup 1 -r 1 --show-output \
    hyperfine --warmup 5 -r 100 \
	  "$runtime arg.js $params" \
      "$runtime commander.js $params" \
      "$runtime meow.js $params" \
      "$runtime minimist.js $params" \
      "$runtime mri.js $params" \
      "$runtime nopt.js $params" \
      "$runtime oclif.js $params" \
      "$runtime sade.js $params" \
      "$runtime yargs-parser.js $params" \
      "$runtime yargs.js $params" \
	  "$runtime argMate/argMate.dist.js $params" \
      "$runtime argMate/argMateConfig.dist.js $params" \
      "$runtime argMate/argMateEngineConfig.dist.js $params" \
      "$runtime argMateMini/argMateMini.dist.js $params" \
      "$runtime argMateMini/argMateMiniConfig.dist.js $params" \
      "$runtime argMateMini/argMateMiniEngineConfig.dist.js $params" \
	  # "argMate/argMate.cli $params" \
	  # "argMateMini/argMateMini.cli $params" \
	  
    echo
  }

    run_hyperfineBunOnly() {
    local runtime="$1"
    local params="$2"

    echo "Benchmarking: $runtime ... ${params}\n"

    # hyperfine --warmup 3 -r 1 --show-output \
    hyperfine --warmup 5 -r 100 --prepare 'sleep 0.1' \
      "$runtime argmate/argMate.js $params" \
      "$runtime argmate/argMateConfig.js $params" \
      "$runtime argmate/argMateEngineConfig.js $params" \
      "$runtime argmateMini/argMateMini.js $params" \
      "$runtime argmateMini/argMateMiniConfig.js $params" \
      "$runtime argmateMini/argMateMiniEngineConfig.js $params" \
      #"./argmate-exe $params" \
      #"./argmate-mini-exe $params" \
 
    echo
  }

  PARAMS_SHORT="--foo=bar -is foobar"
  #  PARAMS_LONG="--name=meowmers bare -cats woo -h awesome --multi=quux --key value --no-meep --blatzk=1000 -fp node my-program.js --many1 5 --many1 null --many1 foo a b c d e f g h i -j k l m n -- a b c d e f g -h i j k"

  run_hyperfineBoth "node" "$PARAMS_SHORT"
  run_hyperfineBoth "bun" "$PARAMS_SHORT"
  run_hyperfineBunOnly "bun" "$PARAMS_SHORT"


} | tee "$OUTFILE"

bun -p 'Bun.stripANSI(await Bun.file(process.argv[1]).text())' "$OUTFILE" > "$OUTFILE.tmp"
mv "$OUTFILE.tmp" "$OUTFILE"
rm -f argMate/argMate.cli argMateMini/argMateMini.cli

echo "Benchmark results saved to $OUTFILE"