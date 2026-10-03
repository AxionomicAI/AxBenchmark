# Grok 4.7 Fast, 500k context (medium)

**Where:** xAI cloud  
**Result folder:** `xai-cloud-grok-4.7-fast-500k-medium`

| Task | Result | Time | Output tokens | Cost | Notes |
|---|---|---|---|---|---|
| T1-scaffold | ✅ | 0 min 47 s | 5,236 | COP 434 ($0.13) |  |
| T2-data | ☑️ | 3 min 11 s | 24,493 | COP 2,005 ($0.60) |  |
| T3-management | ☑️ | 3 min 54 s | 28,131 | COP 2,339 ($0.70) |  |
| T4-lookup | ☑️ | 3 min 00 s | 20,459 | COP 1,771 ($0.53) | search trims input, stock filter, no-match message |
| T5-cart | ☑️ | 4 min 37 s | 31,478 | COP 3,876 ($1.16) | no prices anywhere: the cart total counts units |
| T6-checkout | ✅ | 7 min 01 s | 51,138 | COP 3,742 ($1.12) | confirm dialog, stock 15→13, order history persisted |
| T7-qa | ✅ | 16 min 10 s | 112,319 | COP 6,916 ($2.07) | Puppeteer with the installed Chrome (desktop + phone); fixed cart quantity edits lost on click, checkout dialog scrolling, wrong stock messages, long names overflowing phones |
| **Total** | **7/7** | **38 min 40 s** | **273,254** | **COP 21,083 ($6.31)** |  |

✅ passed my headless-Chrome check · ☑️ passed, checked through the final site · ❌ failed · ⏳ running  
Cost = Grok CLI reported cost (xAI list price), COP at TRM 3,341.23.
