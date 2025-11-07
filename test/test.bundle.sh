DIR="$(dirname "$0")"

echo Redirecting all tests to the bundle
npx rexreplace@7 "../src/argMate'" "../dist/argMate.js'" "$DIR/*.test.ts" -q
npx rexreplace@7 "../src/argMateMini.js'" "../dist/argMateMini.js'" "$DIR/*.test.ts" -q

bun test --bail

echo Redirecting all tests back to src/
npx rexreplace@7 "../dist/argMate.js'" "../src/argMate'" "$DIR/*.test.ts" -q
npx rexreplace@7 "../dist/argMateMini.js'" "../src/argMateMini'" "$DIR/*.test.ts" -q