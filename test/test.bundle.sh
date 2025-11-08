DIR="$(dirname "$0")"

echo Redirecting all tests to the bundle
bunx rexreplace@7 "../src/argMate'" "../dist/argMate.js'" "$DIR/*.test.ts" -q
bunx rexreplace@7 "../src/argMateMini.js'" "../dist/argMateMini.js'" "$DIR/*.test.ts" -q

CLAUDECODE=1 bun test --bail --timeout 500

echo Redirecting all tests back to src/
bunx rexreplace@7 "../dist/argMate.js'" "../src/argMate'" "$DIR/*.test.ts" -q
bunx rexreplace@7 "../dist/argMateMini.js'" "../src/argMateMini'" "$DIR/*.test.ts" -q