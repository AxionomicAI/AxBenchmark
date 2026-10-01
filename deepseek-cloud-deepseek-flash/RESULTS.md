# DeepSeek flash via Claude Code (clauded)

**Where:** DeepSeek cloud  
**Result folder:** `deepseek-cloud-deepseek-flash`

| Task | Result | Time | Output tokens | Cost | Notes |
|---|---|---|---|---|---|
| T1-scaffold | ✅ | 1 min 22 s | 16,725 | COP 67 ($0.02) |  |
| T2-data | ☑️ | 8 min 37 s | 43,234 | COP 134 ($0.04) |  |
| T3-management | ☑️ | 7 min 08 s | 81,211 | COP 267 ($0.08) |  |
| T4-lookup | ☑️ | 4 min 28 s | 26,590 | COP 134 ($0.04) | trims input, 'No products match' message |
| T5-cart | ☑️ | 6 min 39 s | 78,735 | COP 267 ($0.08) |  |
| T6-checkout | ✅ | 12 min 27 s | 90,007 | COP 334 ($0.10) | confirm dialog, stock 24→22, order history persisted; tested itself in headless Chrome |
| T7-qa | ✅ | 10 min 39 s | 70,962 | COP 301 ($0.09) | Playwright in Chrome + Firefox (installed its own); fixed keyboard focus lost after redraws, long category overflowing phone width; flagged two-tab data loss but left it |
| **Total** | **7/7** | **51 min 20 s** | **407,464** | **COP 1,504 ($0.45)** |  |

✅ passed my headless-Chrome check · ☑️ passed, checked through the final site · ❌ failed · ⏳ running  
Cost = tokens x DeepSeek API list price (off-peak), COP at TRM 3,341.23.
