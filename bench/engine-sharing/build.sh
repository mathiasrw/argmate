#!/bin/bash
# Builds each variant in the way package.json builds the engine (build-esm): one minified ESM file.
set -e
cd "$(dirname "$0")"
python3 make-variants.py
../../node_modules/.bin/biome format --write param.ts tail.ts hot.ts > /dev/null
mkdir -p dist && rm -f dist/*.js
build() { bun build --target node --format esm --minify --sourcemap=none "$1" --outfile "dist/$2.js" > /dev/null; }
build ../../src/argEngine.ts now
for variant in this param tail hot; do build "$variant.ts" "$variant"; done
bun gen-config.ts > dist/config.js
for variant in now this param tail hot; do
	printf '%-6s %6d bytes  %5d gzip\n' "$variant" "$(wc -c < "dist/$variant.js")" "$(gzip -c "dist/$variant.js" | wc -c)"
done
