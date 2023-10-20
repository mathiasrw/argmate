DIR="$(dirname "$0")"

echo Redirecting all tests to the bundle
npx rexreplace@7 "../src/argMate'" "../dist/argMate.min.mjs'" "$DIR/*.test.ts" -q
npx rexreplace@7 "../src/argMateLite'" "../dist/argMateLite.min.mjs'" "$DIR/*.test.ts" -q

bun test --bail

echo Redirecting all tests back to src/
npx rexreplace@7 "../dist/argMate.min.mjs'" "../src/argMate'" "$DIR/*.test.ts" -q
npx rexreplace@7 "../dist/argMateLite.min.mjs'" "../src/argMateLite'" "$DIR/*.test.ts" -q 