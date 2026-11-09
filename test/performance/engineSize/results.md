# Engines: size

The bundles of each entry point, built with the flags of `bun run build-esm`. The first table is the size compared to `argmate/mini`: 1.000× is the same size. The second table is in bytes.

- Machine: Apple M1 Pro
- Node v22.23.3, Bun v1.4.3
- argmate v0.9.0, branch `v091`, `14acca8` + changes that are not committed
- Date: 2026-10-25 20:55

| Import | Minified | gzip |
|---|---:|---:|
| `argmate/mini` | 1.000× | 1.000× |
| `argmate` | 1.091× | 1.093× |
| `argmate/mini/engine` | 0.417× | 0.466× |
| `argmate/engine` | 0.507× | 0.563× |

| Import | Bundle | Minified | gzip |
|---|---|---:|---:|
| `argmate/mini` | `argMateMini.js` | 10386 | 4340 |
| `argmate` | `argMate.js` | 11335 | 4743 |
| `argmate/mini/engine` | `argEngineMini.js` | 4326 | 2022 |
| `argmate/engine` | `argEngine.js` | 5265 | 2444 |
