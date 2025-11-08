command -v bun || (brew tap oven-sh/bun && brew install bun)
command -v node || brew install node

OUTFILE=../results/js-performance.txt

{

[ ! -f "package.json" ] && cp _package.json package.json && bun install && bun update

echo
echo
echo "yargs-parser: v$(bun -p 'require("yargs-parser/package.json").version')"
echo "minimist: v$(bun -p 'require("minimist/package.json").version')" 
echo "mri: v$(bun -p 'require("mri/package.json").version')"
echo "nopt: v$(bun -p 'require("nopt/package.json").version')"
echo "argmate: v$(bun -p 'require("../../package.json").version') - ($(git branch --show-current)  $(git rev-parse --short HEAD))"
echo

run() {
	local PARAMS="$1"
	echo 
	echo "About to run Node with $PARAMS"
	node test-js.cjs -- $PARAMS
	echo 
	echo "About to run Bun with $PARAMS"
	bun test-js.cjs -- $PARAMS
}

run "-b --bool --no-meep --multi=baz"

run "--name=meowmers bare -cats woo -h awesome --multi=quux --key value --no-meep --blatzk=1000 -fp node my-program.js --many1 5 --many1 null --many1 foo a b c d e f g h i -j k l m n -- a b c d e f g -h i j k"

cp package.json	_package.json

} | tee $OUTFILE

bun -p 'Bun.stripANSI(await Bun.stdin.text())' < $OUTFILE > $OUTFILE.tmp

mv $OUTFILE.tmp $OUTFILE

