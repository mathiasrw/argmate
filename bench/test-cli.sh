command -v hyperfine || brew install hyperfine
command -v bun || (brew tap oven-sh/bun && brew install bun)
command -v deno || brew install deno
command -v node || brew install node

[ ! -f "package.json" ] && cp package_.json package.json && npm install && npm upgrade

bun build --compile argMate.mjs --outfile argMate.bun.exe 
deno        compile argMate.mjs --output  argMate.deno.exe 

run_hyperfine() {
	local RUNTIME="$1"
	local PARAMS="$2"

	local EXTRA_COMMANDS=""
	[ -f "./argMate.bun.exe" ] && A+="./argMate.bun.exe $PARAMS "
	[ -f "./argMate.deno.exe" ] && B+="./argMate.deno.exe $PARAMS "

	hyperfine --warmup 5               	 	\
		"$RUNTIME argMate.mjs $PARAMS"     	\
		"$RUNTIME argMate.cjs $PARAMS"     	\
		"$RUNTIME mri.cjs $PARAMS"         	\
		"$RUNTIME nopt.cjs $PARAMS"        	\
		"$RUNTIME minimist.cjs $PARAMS"    	\
		"$RUNTIME yargs.cjs $PARAMS"       	\
		#"$A"								\
		#"$B"									

}

echo running

run_hyperfine "bun"  "-b --bool --no-meep --multi=baz"
run_hyperfine "bun"  "--name=meowmers bare -cats woo -h awesome --multi=quux --key value --no-meep --blatzk=1000 -fp node my-program.js --many1 5 --many1 null --many1 foo a b c d e f g h i -j k l m n -- a b c d e f g -h i j k"

run_hyperfine "node" "-b --bool --no-meep --multi=baz"
run_hyperfine "node" "--name=meowmers bare -cats woo -h awesome --multi=quux --key value --no-meep --blatzk=1000 -fp node my-program.js --many1 5 --many1 null --many1 foo a b c d e f g h i -j k l m n -- a b c d e f g -h i j k"


cp package.json	package_.json