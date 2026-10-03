# Qwen3.8-27B GSQ-RCO IQ3_S (+ MTP draft)

**Where:** Ryzen 7 8745HS, CPU  
**Result folder:** `ryzen7-8745hs-qwen38-27b-iq3`

| Task | Result | Time | Output tokens | Cost (electricity) | Notes |
|---|---|---|---|---|---|
| T1-scaffold | ✅ | 9 min 03 s | 1,593 | COP 6.5 (8.0 Wh) | 6 responses, straight to the point |
| T2-data | ✅ | 23 min 40 s | 4,148 | COP 16.6 (20.4 Wh) | 5 products, no price field |
| T3-management | ✅ | 1 h 56 min | 10,673 | COP 65.7 (80.7 Wh) | about half of the 2 h lost to memory thrashing (fixed) |
| T4-lookup | ✅ | 16 min 56 s | 2,622 | COP 11.6 (14.3 Wh) | live case-insensitive name search, trims input, empty-state message |
| T5-cart | ☑️ | 3 h 00 min | 9,371 | COP 122.4 (150.2 Wh) | cart with prices, subtotals, total, remove, clear cart, persisted; 3 h budget ran out before committing (committed during T6) |
| T6-checkout | ❌ | 3 h 00 min | 10,197 | COP 121.7 (149.4 Wh) | 3 h budget ran out: order history and placeOrder() written, but the Checkout button is never un-hidden, so no purchase is possible; not committed; events log recovered from the guard's backup |
| **Total** | **5/6** | **8 h 46 min** | **38,604** | **COP 344.6 (423.0 Wh)** |  |

✅ passed my headless-Chrome check · ☑️ passed, checked through the final site · ❌ failed · ⏳ running  
Cost = CPU package energy (RAPL) x COP 814.63/kWh; wall power is higher (RAM, SSD, fans, PSU).
