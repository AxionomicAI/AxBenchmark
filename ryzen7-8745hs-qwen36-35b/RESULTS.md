# Qwen3.6-35B-A3B Q4_K_S

**Where:** Ryzen 7 8745HS, CPU  
**Result folder:** `ryzen7-8745hs-qwen36-35b`

| Task | Result | Time | Output tokens | Cost (electricity) | Notes |
|---|---|---|---|---|---|
| T1-scaffold | ✅ | 7 min 22 s | 6,323 | COP 4.2 (5.2 Wh) | built search + add modal already (720 lines) |
| T2-data | ✅ | 6 min 20 s | 2,570 | COP 3.9 (4.8 Wh) | 10 products, no price field |
| T3-management | ✅ | 20 min 41 s | 7,933 | COP 13.1 (16.1 Wh) | ran out of the 30k budget before committing |
| T4-lookup | ✅ | 23 min 59 s | 10,302 | COP 15.5 (19.0 Wh) | budget exhausted; search, category, 6 sort orders |
| T5-cart | ❌ | 1 h 13 min | 15,171 | COP 42.4 (52.0 Wh) | cart broken: addToCart gets an object instead of an id; page error; 9 compactions |
| T6-checkout | ❌ | 1 h 27 min | 41,134 | COP 48.9 (60.0 Wh) | checkout and order history added but unreachable: the T5 cart bug was never fixed; tokens rebuilt from server.log (events log lost to a runner bug) |
| **Total** | **4/6** | **3 h 39 min** | **83,433** | **COP 128.0 (157.1 Wh)** |  |

✅ passed my headless-Chrome check · ☑️ passed, checked through the final site · ❌ failed · ⏳ running  
Cost = CPU package energy (RAPL) x COP 814.63/kWh; wall power is higher (RAM, SSD, fans, PSU).
