command -v hyperfine || brew install hyperfine
command -v bun || (brew tap oven-sh/bun && brew install bun)
command -v node || brew install node

OUTFILE=../results/cli-performance.txt

{

[ ! -f "package.json" ] && cp _package.json package.json && bun install && bun update

echo
echo
echo "yargs-parser: v$(bun -p 'require("yargs-parser/package.json").version')"
echo "minimist: v$(bun -p 'require("minimist/package.json").version')" 
echo "mri: v$(bun -p 'require("mri/package.json").version')"
echo "nopt: v$(bun -p 'require("nopt/package.json").version')"
echo "argmate: v$(bun -p 'require("../../package.json").version') ($(git branch --show-current) @ $(git rev-parse --short HEAD))"
echo
echo

[ ! -f "package.json" ] && cp _package.json package.json && npm install && npm upgrade

bun build --compile argMate.mjs --outfile argMate.bun.exe 

run_hyperfine() {
	local RUNTIME="$1"
	local PARAMS="$2"

	local EXTRA_COMMANDS=""
	[ -f "./argMate.bun.exe" ] && A+="./argMate.bun.exe $PARAMS "

	hyperfine --warmup 5               	 	\
		"$RUNTIME yargs.cjs $PARAMS"       	\
		"$RUNTIME minimist.cjs $PARAMS"    	\
		"$RUNTIME mri.cjs $PARAMS"         	\
		"$RUNTIME nopt.cjs $PARAMS"        	\
		"$RUNTIME argMate.mjs $PARAMS"     	\
		"$RUNTIME argMateEngine.mjs $PARAMS"     	\
		"$RUNTIME argMateMini.mjs $PARAMS"     	\
		"$RUNTIME argMateEngineMini.mjs $PARAMS"     	\
		"$RUNTIME argMate.cjs $PARAMS"     	\
		"$RUNTIME argMateEngine.cjs $PARAMS"     	\
		"$RUNTIME argMateMini.cjs $PARAMS"     	\
		"$RUNTIME argMateEngineMini.cjs $PARAMS"     	\
		#"$A"								\
		#"$B"									

}

echo running

run_hyperfine "bun"  "-b --bool --no-meep --multi=baz"
run_hyperfine "bun"  "--name=meowmers bare -cats woo -h awesome --multi=quux --key value --no-meep --blatzk=1000 -fp node my-program.js --many1 5 --many1 null --many1 foo a b c d e f g h i -j k l m n -- a b c d e f g -h i j k"

run_hyperfine "node" "-b --bool --no-meep --multi=baz"
run_hyperfine "node" "--name=meowmers bare -cats woo -h awesome --multi=quux --key value --no-meep --blatzk=1000 -fp node my-program.js --many1 5 --many1 null --many1 foo a b c d e f g h i -j k l m n -- a b c d e f g -h i j k"


cp package.json	_package.json

} | tee $OUTFILE

bun -p 'Bun.stripANSI(await Bun.stdin.text())' < $OUTFILE > $OUTFILE.tmp

mv $OUTFILE.tmp $OUTFILE