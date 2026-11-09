# Finetuning: maxInline, maxSlice6 against max

Workloads: plain, config, files, groups, precompiled. Runtimes: node, bun. The engines take turns, each in its own process. The timer is `process.hrtime.bigint()`.

- Machine: Apple M1 Pro
- Node v24.22.1, Bun v1.4.3
- argmate v0.9.1, branch `v1`, `1152549`
- Date: 2026-11-02 11:57

## maxInline

Size, bytes. Gain = base - variant: positive is smaller.

| Bundle | base | variant | gain |
|---|---:|---:|---:|
| argMate.js | 24528 | 24446 | +82.0 |
| argEngine.js | 12738 | 12649 | +89.0 |

Cold: load and first parse in a new process, µs. Median of 150 processes. Gain = base - variant with the 95 % bootstrap interval: positive is faster.

| Runtime and workload | base load + parse = total | variant load + parse = total | load gain | first parse gain | total gain | |
|---|---:|---:|---:|---:|---:|---|
| node plain | 842.8 + 707.7 = 1558.4 | 850.5 + 749.4 = 1604.7 | -7.7 (-13.3 to -2.5) | -41.7 (-47.8 to -30.1) | -46.3 (-58.8 to -33.5) | slower |
| node config | 854.6 + 989.5 = 1852.1 | 857.3 + 1044.9 = 1913.2 | -2.6 (-14.5 to +6.3) | -55.4 (-66.1 to -39.8) | -61.1 (-78.5 to -36.3) | slower |
| node files | 847.5 + 991.6 = 1842.8 | 847.6 + 1025.0 = 1875.7 | -0.1 (-8.3 to +7.6) | -33.4 (-40.2 to -23.8) | -32.8 (-51.7 to -16.1) | slower |
| node groups | 861.6 + 844.3 = 1721.9 | 857.3 + 874.7 = 1735.4 | +4.3 (-6.0 to +17.3) | -30.5 (-41.8 to -15.3) | -13.5 (-44.1 to +7.3) | no change |
| node precompiled | 572.5 + 663.3 = 1238.0 | 570.7 + 709.1 = 1282.8 | +1.8 (-3.8 to +7.9) | -45.8 (-51.4 to -39.4) | -44.8 (-57.2 to -31.8) | slower |
| bun plain | 993.4 + 734.5 = 1745.0 | 973.8 + 774.9 = 1775.5 | +19.5 (-10.3 to +40.5) | -40.4 (-51.2 to -24.3) | -30.5 (-64.6 to +6.1) | no change |
| bun config | 949.2 + 1099.0 = 2060.3 | 954.0 + 1131.1 = 2092.9 | -4.8 (-24.9 to +15.2) | -32.1 (-56.1 to -6.8) | -32.6 (-73.5 to +15.4) | no change |
| bun files | 996.5 + 1165.1 = 2180.9 | 975.3 + 1202.5 = 2185.5 | +21.3 (-18.1 to +47.8) | -37.4 (-61.3 to -9.9) | -4.6 (-82.9 to +42.2) | no change |
| bun groups | 957.0 + 900.2 = 1863.1 | 963.9 + 941.3 = 1908.8 | -6.9 (-26.6 to +11.5) | -41.1 (-54.3 to -29.5) | -45.8 (-81.4 to -6.1) | slower |
| bun precompiled | 497.1 + 718.6 = 1220.3 | 489.5 + 761.3 = 1255.0 | +7.6 (-12.9 to +19.7) | -42.8 (-58.3 to -20.4) | -34.7 (-64.7 to +0.7) | no change |

Hot: one parse after the JIT compiler has optimized the engine, ns. Median of 10 rounds of 400 ms. Gain = base - variant with the 95 % bootstrap interval: positive is faster.

| Runtime and workload | base | variant | gain ns | gain % | |
|---|---:|---:|---:|---:|---|
| node plain | 1538.0 | 1532.7 | +5.3 (-7.1 to +44.1) | +0.3 (-0.5 to +3.0) | no change |
| node config | 5304.0 | 5283.4 | +20.7 (-2.0 to +283.8) | +0.4 (-0.0 to +5.3) | no change |
| node files | 8802.9 | 8811.4 | -8.5 (-128.0 to +434.3) | -0.1 (-1.5 to +4.7) | no change |
| node groups | 3093.6 | 2931.3 | +162.3 (-897.9 to +748.5) | +5.2 (-33.7 to +20.9) | no change |
| node precompiled | 2221.6 | 2176.9 | +44.7 (-100.0 to +114.1) | +2.0 (-4.5 to +5.4) | no change |
| bun plain | 1249.8 | 1252.8 | -3.0 (-27.8 to +24.8) | -0.2 (-2.2 to +2.1) | no change |
| bun config | 2559.2 | 2505.9 | +53.2 (-84.0 to +180.6) | +2.1 (-3.2 to +6.7) | no change |
| bun files | 5398.6 | 5431.0 | -32.4 (-101.3 to +101.1) | -0.6 (-1.8 to +1.5) | no change |
| bun groups | 2455.4 | 2455.0 | +0.4 (-26.8 to +48.8) | +0.0 (-1.0 to +2.0) | no change |
| bun precompiled | 1579.3 | 1560.5 | +18.8 (-10.5 to +82.5) | +1.2 (-0.7 to +4.3) | no change |

## maxSlice6

Size, bytes. Gain = base - variant: positive is smaller.

| Bundle | base | variant | gain |
|---|---:|---:|---:|
| argMate.js | 24528 | 24500 | +28.0 |
| argEngine.js | 12738 | 12710 | +28.0 |

Cold: load and first parse in a new process, µs. Median of 150 processes. Gain = base - variant with the 95 % bootstrap interval: positive is faster.

| Runtime and workload | base load + parse = total | variant load + parse = total | load gain | first parse gain | total gain | |
|---|---:|---:|---:|---:|---:|---|
| node plain | 842.8 + 707.7 = 1558.4 | 856.5 + 718.6 = 1584.9 | -13.6 (-21.9 to -4.9) | -10.9 (-17.8 to -3.9) | -26.5 (-38.8 to -8.3) | slower |
| node config | 854.6 + 989.5 = 1852.1 | 854.8 + 1007.9 = 1876.6 | -0.1 (-11.6 to +8.8) | -18.4 (-31.9 to -6.4) | -24.5 (-59.7 to +6.5) | no change |
| node files | 847.5 + 991.6 = 1842.8 | 848.9 + 996.1 = 1848.3 | -1.3 (-11.2 to +6.9) | -4.5 (-12.3 to +5.0) | -5.5 (-20.5 to +12.9) | no change |
| node groups | 861.6 + 844.3 = 1721.9 | 862.6 + 850.2 = 1721.4 | -1.0 (-16.1 to +12.6) | -6.0 (-19.7 to +10.1) | +0.4 (-53.2 to +26.7) | no change |
| node precompiled | 572.5 + 663.3 = 1238.0 | 571.5 + 671.8 = 1244.2 | +1.0 (-6.9 to +6.4) | -8.5 (-14.0 to -0.1) | -6.2 (-15.3 to +5.1) | no change |
| bun plain | 993.4 + 734.5 = 1745.0 | 981.5 + 737.2 = 1725.4 | +11.8 (-12.1 to +32.8) | -2.7 (-12.7 to +13.3) | +19.6 (-4.8 to +51.6) | no change |
| bun config | 949.2 + 1099.0 = 2060.3 | 964.7 + 1116.7 = 2083.6 | -15.5 (-38.3 to +6.8) | -17.7 (-35.5 to +11.2) | -23.3 (-63.5 to +27.7) | no change |
| bun files | 996.5 + 1165.1 = 2180.9 | 969.5 + 1163.5 = 2141.0 | +27.0 (-9.0 to +50.9) | +1.6 (-21.8 to +28.2) | +39.9 (-27.0 to +82.8) | no change |
| bun groups | 957.0 + 900.2 = 1863.1 | 945.5 + 902.5 = 1853.3 | +11.5 (-5.4 to +31.3) | -2.3 (-16.3 to +10.8) | +9.8 (-23.5 to +46.4) | no change |
| bun precompiled | 497.1 + 718.6 = 1220.3 | 491.1 + 732.7 = 1224.5 | +6.0 (-5.5 to +17.0) | -14.1 (-29.3 to +6.0) | -4.3 (-28.7 to +27.6) | no change |

Hot: one parse after the JIT compiler has optimized the engine, ns. Median of 10 rounds of 400 ms. Gain = base - variant with the 95 % bootstrap interval: positive is faster.

| Runtime and workload | base | variant | gain ns | gain % | |
|---|---:|---:|---:|---:|---|
| node plain | 1538.0 | 1547.8 | -9.8 (-24.3 to +6.1) | -0.6 (-1.6 to +0.4) | no change |
| node config | 5304.0 | 5339.5 | -35.5 (-264.7 to +73.2) | -0.7 (-4.9 to +0.9) | no change |
| node files | 8802.9 | 8773.2 | +29.7 (-89.0 to +469.8) | +0.3 (-1.0 to +5.2) | no change |
| node groups | 3093.6 | 2884.2 | +209.4 (-177.7 to +782.8) | +6.8 (-8.3 to +21.3) | no change |
| node precompiled | 2221.6 | 2214.4 | +7.2 (-60.2 to +89.6) | +0.3 (-2.8 to +3.6) | no change |
| bun plain | 1249.8 | 1245.7 | +4.1 (-32.7 to +34.3) | +0.3 (-2.7 to +2.8) | no change |
| bun config | 2559.2 | 2455.1 | +104.0 (+14.1 to +234.5) | +4.1 (+0.2 to +8.7) | faster |
| bun files | 5398.6 | 5434.6 | -36.0 (-110.7 to +105.5) | -0.7 (-2.1 to +1.5) | no change |
| bun groups | 2455.4 | 2453.1 | +2.3 (-40.1 to +37.6) | +0.1 (-1.8 to +1.6) | no change |
| bun precompiled | 1579.3 | 1565.4 | +13.8 (-260.2 to +67.6) | +0.9 (-17.7 to +4.1) | no change |

Rows: 1 faster, 6 slower, 33 no change.
