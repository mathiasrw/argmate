## Hot: 200000 parses in one process

| Runtime | Workload | Variant | Time of the process | ± | Fastest run | For one parse | To `now` |
|---|---|---|---:|---:|---:|---:|---:|
| bun | config | now | 834 ms | 15 ms | 818 ms (+0.0 %) | 4.17 µs | +0.0 % |
| bun | config | this | 861 ms | 22 ms | 837 ms (+2.3 %) | 4.31 µs | +3.2 % |
| bun | config | param | 865 ms | 24 ms | 840 ms (+2.7 %) | 4.33 µs | +3.7 % |
| bun | config | tail | 855 ms | 36 ms | 816 ms (-0.3 %) | 4.28 µs | +2.5 % |
| bun | config | hot | 836 ms | 14 ms | 813 ms (-0.6 %) | 4.18 µs | +0.2 % |
| bun | plain | now | 790 ms | 37 ms | 756 ms (+0.0 %) | 3.95 µs | +0.0 % |
| bun | plain | this | 786 ms | 33 ms | 759 ms (+0.3 %) | 3.93 µs | -0.6 % |
| bun | plain | param | 844 ms | 138 ms | 756 ms (-0.0 %) | 4.22 µs | +6.7 % |
| bun | plain | tail | 814 ms | 108 ms | 749 ms (-0.9 %) | 4.07 µs | +2.9 % |
| bun | plain | hot | 762 ms | 9 ms | 748 ms (-1.1 %) | 3.81 µs | -3.6 % |
| node | config | now | 1304 ms | 271 ms | 1143 ms (+0.0 %) | 6.52 µs | +0.0 % |
| node | config | this | 1362 ms | 68 ms | 1281 ms (+12.1 %) | 6.81 µs | +4.5 % |
| node | config | param | 1309 ms | 95 ms | 1185 ms (+3.7 %) | 6.54 µs | +0.4 % |
| node | config | tail | 1264 ms | 141 ms | 1148 ms (+0.4 %) | 6.32 µs | -3.0 % |
| node | config | hot | 1208 ms | 70 ms | 1131 ms (-1.0 %) | 6.04 µs | -7.4 % |
| node | plain | now | 595 ms | 38 ms | 572 ms (+0.0 %) | 2.98 µs | +0.0 % |
| node | plain | this | 664 ms | 47 ms | 636 ms (+11.3 %) | 3.32 µs | +11.5 % |
| node | plain | param | 615 ms | 30 ms | 570 ms (-0.2 %) | 3.07 µs | +3.2 % |
| node | plain | tail | 604 ms | 32 ms | 574 ms (+0.4 %) | 3.02 µs | +1.5 % |
| node | plain | hot | 594 ms | 9 ms | 579 ms (+1.3 %) | 2.97 µs | -0.2 % |

## Cold: one parse in one process

| Runtime | Variant | Time of the process | ± | To `now` |
|---|---|---:|---:|---:|
| bun | now | 10.81 ms | 1.77 ms | +0.0 % |
| bun | this | 11.80 ms | 2.64 ms | +9.2 % |
| bun | param | 11.95 ms | 3.23 ms | +10.6 % |
| bun | tail | 11.72 ms | 2.42 ms | +8.4 % |
| bun | hot | 11.39 ms | 2.76 ms | +5.4 % |
| node | now | 26.37 ms | 4.92 ms | +0.0 % |
| node | this | 25.45 ms | 2.46 ms | -3.5 % |
| node | param | 25.64 ms | 2.63 ms | -2.8 % |
| node | tail | 26.18 ms | 4.58 ms | -0.7 % |
| node | hot | 25.60 ms | 2.33 ms | -2.9 % |
