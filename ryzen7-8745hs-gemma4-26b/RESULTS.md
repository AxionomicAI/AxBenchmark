# Gemma 4 26B-A4B QAT Q4_K_XL

**Where:** Ryzen 7 8745HS, CPU  
**Result folder:** `ryzen7-8745hs-gemma4-26b`

| Task | Result | Time | Output tokens | Cost (electricity) | Notes |
|---|---|---|---|---|---|
| T1-scaffold | ✅ | 13 min 27 s | 9,069 | COP 8.7 (10.7 Wh) | 58 responses for a 57-line scaffold |
| T2-data | ✅ | 3 min 11 s | 2,652 | COP 2.0 (2.4 Wh) | 3 seed products |
| T3-management | ✅ | 12 min 53 s | 7,788 | COP 8.3 (10.2 Wh) |  |
| T4-lookup | ✅ | 11 min 48 s | 6,259 | COP 7.7 (9.5 Wh) | no trim, no 'no results' message |
| T5-cart | ✅ | 21 min 49 s | 12,492 | COP 14.3 (17.5 Wh) | cart not capped at stock |
| T6-checkout | ✅ | 27 min 07 s | 12,715 | COP 17.9 (22.0 Wh) | checkout refuses over-stock orders |
| **Total** | **6/6** | **1 h 30 min** | **50,975** | **COP 58.9 (72.3 Wh)** |  |

✅ passed my headless-Chrome check · ☑️ passed, checked through the final site · ❌ failed · ⏳ running  
Cost = CPU package energy (RAPL) x COP 814.63/kWh; wall power is higher (RAM, SSD, fans, PSU).
