# Engines: size

The bundles of each entry point, built with the flags of `bun run build-esm`. The first table is the size compared to `argmate/mini`: 1.000× is the same size. The second table is in bytes.

- Machine: Apple M1 Pro
- Node v22.23.3, Bun v1.4.3
- argmate v0.9.0, branch `v091`, `8daa5da` + changes that are not committed
- Date: 2026-10-25 20:04

| Import | Minified | gzip |
|---|---:|---:|
| `argmate/mini` | 1.000× | 1.000× |
| `argmate` | 1.117× | 1.112× |
| `argmate/mini/engine` | 0.392× | 0.446× |
| `argmate/engine` | 0.508× | 0.563× |

| Import | Bundle | Minified | gzip |
|---|---|---:|---:|
| `argmate/mini` | `argMateMini.js` | 9974 | 4179 |
| `argmate` | `argMate.js` | 11137 | 4649 |
| `argmate/mini/engine` | `argEngineMini.js` | 3914 | 1864 |
| `argmate/engine` | `argEngine.js` | 5067 | 2354 |
