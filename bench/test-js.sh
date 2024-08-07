command -v bun || (brew tap oven-sh/bun && brew install bun)
command -v node || brew install node

[ ! -f "package.json" ] && cp _package.json package.json && npm install && npm upgrade

run() {
	local PARAMS="$1"

	echo "\n\n\n About to run Node with $PARAMS"
	node test-js.cjs -- $PARAMS

	echo "\n\n\n About to run Bun with $PARAMS"
	bun test-js.cjs -- $PARAMS
}

run "-b --bool --no-meep --multi=baz"

run "--name=meowmers bare -cats woo -h awesome --multi=quux --key value --no-meep --blatzk=1000 -fp node my-program.js --many1 5 --many1 null --many1 foo a b c d e f g h i -j k l m n -- a b c d e f g -h i j k"

cp package.json	_package.json