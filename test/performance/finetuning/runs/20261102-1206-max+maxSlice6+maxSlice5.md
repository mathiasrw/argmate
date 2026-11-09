# Finetuning: max, maxSlice6, maxSlice5 against maxInline

Workloads: plain, config, files, groups, precompiled. Runtimes: node, bun. The engines take turns, each in its own process. The timer is `process.hrtime.bigint()`.

- Machine: Apple M1 Pro
- Node v24.22.1, Bun v1.4.3
- argmate v0.9.1, branch `v1`, `1152549`
- Date: 2026-11-02 12:06

## max

Size, bytes. Gain = base - variant: positive is smaller.

| Bundle | base | variant | gain |
|---|---:|---:|---:|
| argMate.js | 24446 | 24528 | -82.0 |
| argEngine.js | 12649 | 12738 | -89.0 |

Cold: load and first parse in a new process, µs. Median of 150 processes. Gain = base - variant with the 95 % bootstrap interval: positive is faster.

| Runtime and workload | base load + parse = total | variant load + parse = total | load gain | first parse gain | total gain | |
|---|---:|---:|---:|---:|---:|---|
| node plain | 850.3 + 748.2 = 1603.4 | 850.0 + 714.8 = 1571.9 | +0.4 (-6.2 to +8.3) | +33.5 (+24.4 to +46.4) | +31.5 (+11.8 to +53.4) | faster |
| node config | 850.9 + 1039.7 = 1889.7 | 853.5 + 1005.5 = 1862.3 | -2.6 (-12.3 to +5.0) | +34.3 (+24.6 to +44.4) | +27.4 (+10.9 to +48.3) | faster |
| node files | 844.6 + 1027.5 = 1874.8 | 841.6 + 990.5 = 1838.3 | +2.9 (-3.6 to +10.2) | +37.1 (+30.8 to +45.5) | +36.5 (+25.8 to +50.4) | faster |
| node groups | 849.0 + 867.1 = 1720.0 | 847.1 + 831.5 = 1680.2 | +1.9 (-4.3 to +11.2) | +35.7 (+26.7 to +44.0) | +39.8 (+22.8 to +54.6) | faster |
| node precompiled | 570.3 + 712.4 = 1283.3 | 620.6 + 667.7 = 1291.2 | -50.4 (-56.7 to -45.0) | +44.7 (+38.4 to +50.3) | -7.9 (-24.0 to +10.4) | no change |
| bun plain | 980.8 + 784.3 = 1760.9 | 981.4 + 743.1 = 1726.9 | -0.6 (-27.6 to +27.9) | +41.1 (+23.8 to +56.2) | +34.0 (+6.7 to +71.2) | faster |
| bun config | 946.3 + 1148.2 = 2111.4 | 969.9 + 1092.1 = 2080.1 | -23.6 (-52.8 to -2.3) | +56.1 (+31.7 to +80.4) | +31.4 (-25.1 to +74.9) | no change |
| bun files | 929.8 + 1150.8 = 2089.1 | 941.0 + 1109.3 = 2057.2 | -11.3 (-28.7 to +0.9) | +41.5 (+16.0 to +59.1) | +31.9 (-10.3 to +67.7) | no change |
| bun groups | 924.1 + 923.0 = 1852.0 | 926.4 + 868.6 = 1794.2 | -2.3 (-15.0 to +9.1) | +54.4 (+39.5 to +79.3) | +57.8 (+34.0 to +95.6) | faster |
| bun precompiled | 474.0 + 722.4 = 1193.2 | 477.5 + 690.5 = 1168.2 | -3.5 (-12.8 to +0.6) | +31.8 (+19.9 to +41.9) | +25.0 (+6.8 to +39.1) | faster |

Hot: one parse after the JIT compiler has optimized the engine, ns. Median of 10 rounds of 400 ms. Gain = base - variant with the 95 % bootstrap interval: positive is faster.

| Runtime and workload | base | variant | gain ns | gain % | |
|---|---:|---:|---:|---:|---|
| node plain | 1545.5 | 1538.4 | +7.1 (-25.4 to +62.6) | +0.5 (-1.6 to +3.9) | no change |
| node config | 5279.0 | 5259.5 | +19.5 (-23.8 to +48.5) | +0.4 (-0.5 to +0.9) | no change |
| node files | 8597.5 | 8541.8 | +55.8 (-12.0 to +83.5) | +0.6 (-0.1 to +1.0) | no change |
| node groups | 2842.2 | 2850.9 | -8.8 (-49.8 to +8.1) | -0.3 (-1.6 to +0.3) | no change |
| node precompiled | 2151.4 | 2160.7 | -9.3 (-49.6 to +15.5) | -0.4 (-2.2 to +0.7) | no change |
| bun plain | 1266.2 | 1261.0 | +5.2 (-11.8 to +30.8) | +0.4 (-0.9 to +2.2) | no change |
| bun config | 2507.0 | 2493.2 | +13.8 (-125.8 to +75.2) | +0.6 (-5.0 to +3.0) | no change |
| bun files | 5520.5 | 5504.0 | +16.5 (-115.5 to +117.9) | +0.3 (-2.1 to +1.7) | no change |
| bun groups | 2456.1 | 2468.7 | -12.6 (-78.2 to +13.2) | -0.5 (-3.2 to +0.6) | no change |
| bun precompiled | 1561.7 | 1577.3 | -15.6 (-69.0 to +4.0) | -1.0 (-3.8 to +0.3) | no change |

## maxSlice6

Size, bytes. Gain = base - variant: positive is smaller.

| Bundle | base | variant | gain |
|---|---:|---:|---:|
| argMate.js | 24446 | 24500 | -54.0 |
| argEngine.js | 12649 | 12710 | -61.0 |

Cold: load and first parse in a new process, µs. Median of 150 processes. Gain = base - variant with the 95 % bootstrap interval: positive is faster.

| Runtime and workload | base load + parse = total | variant load + parse = total | load gain | first parse gain | total gain | |
|---|---:|---:|---:|---:|---:|---|
| node plain | 850.3 + 748.2 = 1603.4 | 849.6 + 721.4 = 1575.0 | +0.7 (-5.8 to +9.0) | +26.8 (+20.3 to +38.5) | +28.4 (+14.3 to +47.8) | faster |
| node config | 850.9 + 1039.7 = 1889.7 | 850.2 + 1005.8 = 1860.7 | +0.7 (-9.3 to +7.3) | +34.0 (+25.9 to +44.7) | +29.0 (+11.0 to +47.2) | faster |
| node files | 844.6 + 1027.5 = 1874.8 | 844.2 + 999.5 = 1848.0 | +0.4 (-8.1 to +7.9) | +28.0 (+19.6 to +36.3) | +26.8 (+11.8 to +44.0) | faster |
| node groups | 849.0 + 867.1 = 1720.0 | 848.6 + 840.5 = 1690.2 | +0.4 (-4.4 to +9.8) | +26.6 (+19.1 to +35.4) | +29.8 (+14.7 to +48.3) | faster |
| node precompiled | 570.3 + 712.4 = 1283.3 | 571.9 + 669.5 = 1243.3 | -1.6 (-7.0 to +4.2) | +42.8 (+33.0 to +48.2) | +40.0 (+31.5 to +55.2) | faster |
| bun plain | 980.8 + 784.3 = 1760.9 | 969.1 + 741.3 = 1722.6 | +11.7 (-10.3 to +34.9) | +43.0 (+26.8 to +56.3) | +38.3 (+14.8 to +73.7) | faster |
| bun config | 946.3 + 1148.2 = 2111.4 | 962.8 + 1107.4 = 2093.4 | -16.5 (-31.6 to -2.3) | +40.8 (+12.0 to +59.8) | +18.0 (-24.0 to +56.2) | no change |
| bun files | 929.8 + 1150.8 = 2089.1 | 926.2 + 1115.7 = 2041.3 | +3.6 (-11.1 to +14.1) | +35.2 (+21.6 to +54.2) | +47.8 (+14.7 to +76.1) | faster |
| bun groups | 924.1 + 923.0 = 1852.0 | 934.3 + 888.3 = 1820.5 | -10.1 (-28.2 to +3.8) | +34.8 (+18.6 to +61.3) | +31.5 (-6.9 to +74.2) | no change |
| bun precompiled | 474.0 + 722.4 = 1193.2 | 478.3 + 703.3 = 1182.5 | -4.3 (-12.2 to +3.2) | +19.1 (+10.6 to +30.4) | +10.7 (-4.1 to +26.6) | no change |

Hot: one parse after the JIT compiler has optimized the engine, ns. Median of 10 rounds of 400 ms. Gain = base - variant with the 95 % bootstrap interval: positive is faster.

| Runtime and workload | base | variant | gain ns | gain % | |
|---|---:|---:|---:|---:|---|
| node plain | 1545.5 | 1539.9 | +5.6 (-17.0 to +60.4) | +0.4 (-0.7 to +3.9) | no change |
| node config | 5279.0 | 5282.9 | -3.9 (-21.1 to +42.7) | -0.1 (-0.4 to +0.8) | no change |
| node files | 8597.5 | 8545.1 | +52.5 (-34.1 to +96.6) | +0.6 (-0.4 to +1.1) | no change |
| node groups | 2842.2 | 2844.6 | -2.4 (-33.3 to +14.7) | -0.1 (-1.2 to +0.5) | no change |
| node precompiled | 2151.4 | 2148.4 | +3.0 (-23.8 to +21.9) | +0.1 (-1.1 to +1.1) | no change |
| bun plain | 1266.2 | 1257.4 | +8.8 (-30.0 to +37.4) | +0.7 (-2.2 to +2.9) | no change |
| bun config | 2507.0 | 2499.7 | +7.3 (-71.1 to +74.9) | +0.3 (-3.2 to +2.9) | no change |
| bun files | 5520.5 | 5489.9 | +30.6 (-58.0 to +113.7) | +0.6 (-1.1 to +2.3) | no change |
| bun groups | 2456.1 | 2473.0 | -16.9 (-44.3 to +30.0) | -0.7 (-1.8 to +1.3) | no change |
| bun precompiled | 1561.7 | 1571.7 | -10.0 (-40.3 to +3.2) | -0.6 (-2.5 to +0.3) | no change |

## maxSlice5

Size, bytes. Gain = base - variant: positive is smaller.

| Bundle | base | variant | gain |
|---|---:|---:|---:|
| argMate.js | 24446 | 24567 | -121.0 |
| argEngine.js | 12649 | 12777 | -128.0 |

Cold: load and first parse in a new process, µs. Median of 150 processes. Gain = base - variant with the 95 % bootstrap interval: positive is faster.

| Runtime and workload | base load + parse = total | variant load + parse = total | load gain | first parse gain | total gain | |
|---|---:|---:|---:|---:|---:|---|
| node plain | 850.3 + 748.2 = 1603.4 | 851.5 + 716.5 = 1570.5 | -1.2 (-6.1 to +7.3) | +31.7 (+25.2 to +44.6) | +32.9 (+19.7 to +51.5) | faster |
| node config | 850.9 + 1039.7 = 1889.7 | 852.0 + 997.1 = 1853.2 | -1.1 (-10.1 to +7.2) | +42.6 (+33.2 to +53.0) | +36.5 (+23.6 to +56.2) | faster |
| node files | 844.6 + 1027.5 = 1874.8 | 848.5 + 998.6 = 1850.9 | -3.9 (-10.6 to +5.2) | +28.9 (+22.8 to +36.2) | +23.8 (+9.9 to +36.9) | faster |
| node groups | 849.0 + 867.1 = 1720.0 | 849.4 + 833.8 = 1686.7 | -0.4 (-6.7 to +8.6) | +33.4 (+22.6 to +41.7) | +33.3 (+15.6 to +46.9) | faster |
| node precompiled | 570.3 + 712.4 = 1283.3 | 573.9 + 670.5 = 1245.3 | -3.7 (-10.5 to +1.9) | +41.9 (+33.6 to +48.1) | +38.0 (+26.9 to +51.4) | faster |
| bun plain | 980.8 + 784.3 = 1760.9 | 992.5 + 755.1 = 1755.5 | -11.7 (-39.1 to +17.3) | +29.2 (+8.5 to +44.3) | +5.4 (-45.8 to +47.6) | no change |
| bun config | 946.3 + 1148.2 = 2111.4 | 957.3 + 1098.6 = 2068.3 | -11.0 (-27.9 to +4.4) | +49.6 (+26.8 to +66.8) | +43.1 (+0.5 to +78.8) | faster |
| bun files | 929.8 + 1150.8 = 2089.1 | 933.2 + 1105.9 = 2050.4 | -3.4 (-23.4 to +8.5) | +44.9 (+21.1 to +61.8) | +38.6 (+6.7 to +67.2) | faster |
| bun groups | 924.1 + 923.0 = 1852.0 | 934.7 + 883.6 = 1820.7 | -10.6 (-24.1 to +4.5) | +39.4 (+21.9 to +64.7) | +31.3 (+1.5 to +74.2) | faster |
| bun precompiled | 474.0 + 722.4 = 1193.2 | 478.3 + 699.7 = 1180.8 | -4.3 (-11.7 to -0.0) | +22.6 (+10.1 to +33.6) | +12.3 (-2.1 to +25.6) | no change |

Hot: one parse after the JIT compiler has optimized the engine, ns. Median of 10 rounds of 400 ms. Gain = base - variant with the 95 % bootstrap interval: positive is faster.

| Runtime and workload | base | variant | gain ns | gain % | |
|---|---:|---:|---:|---:|---|
| node plain | 1545.5 | 1551.6 | -6.1 (-37.2 to +51.9) | -0.4 (-2.3 to +3.4) | no change |
| node config | 5279.0 | 5260.1 | +18.9 (-51.7 to +46.8) | +0.4 (-0.9 to +0.9) | no change |
| node files | 8597.5 | 8561.2 | +36.3 (-78.4 to +73.9) | +0.4 (-0.9 to +0.9) | no change |
| node groups | 2842.2 | 2877.5 | -35.3 (-94.2 to +19.1) | -1.2 (-3.4 to +0.7) | no change |
| node precompiled | 2151.4 | 2150.9 | +0.5 (-19.3 to +24.4) | +0.0 (-0.9 to +1.2) | no change |
| bun plain | 1266.2 | 1260.1 | +6.1 (-25.9 to +29.9) | +0.5 (-2.5 to +2.2) | no change |
| bun config | 2507.0 | 2495.3 | +11.7 (-17.4 to +73.1) | +0.5 (-0.7 to +2.9) | no change |
| bun files | 5520.5 | 5512.7 | +7.8 (-73.9 to +116.9) | +0.1 (-1.4 to +1.9) | no change |
| bun groups | 2456.1 | 2466.7 | -10.6 (-34.3 to +24.0) | -0.4 (-1.4 to +0.9) | no change |
| bun precompiled | 1561.7 | 1563.4 | -1.7 (-67.9 to +6.7) | -0.1 (-4.3 to +0.4) | no change |

Rows: 22 faster, 0 slower, 38 no change.
