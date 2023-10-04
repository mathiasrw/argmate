echo Please make sure to `brew install hyperfine`
echo And dont forget both Deno and Bun so you can compare with the compiled executables

bun build --compile argMate.mjs --outfile argMate.bun.exe 
deno        compile argMate.mjs --output  argMate.deno.exe 

export PARAMS="--name=meowmers bare -cats woo -h awesome --multi=quux --key value --no-meep --blatzk=1000 -fp node my-program.js --many1 5 --many1 null --many1 foo"
export PARAMS="-b --bool --no-meep --multi=baz"
export RUNTIME=bun
export RUNTIME=node

hyperfine --warmup	5 				\
	"$RUNTIME argMate.mjs $PARAMS"	\
	"$RUNTIME argMate.cjs $PARAMS"	\
	"$RUNTIME mri.cjs $PARAMS"		\
	"$RUNTIME nopt.cjs $PARAMS"		\
	"$RUNTIME minimist.cjs $PARAMS"	\
	"$RUNTIME yargs.cjs $PARAMS"	\
#	"./argMate.bun.exe $PARAMS"		\
#	"./argMate.deno.exe $PARAMS"	\
	
	