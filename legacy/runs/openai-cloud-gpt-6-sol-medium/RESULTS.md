# Codex GPT-6 Sol (medium)

**Where:** OpenAI cloud  
**Result folder:** `openai-cloud-gpt-6-sol-medium`

| Task | Result | Time | Output tokens | Cost | Notes |
|---|---|---|---|---|---|
| T1-scaffold | ✅ | 3 min 15 s | 3,623 | COP 267 ($0.08) |  |
| T2-data | ☑️ | 3 min 37 s | 4,133 | COP 401 ($0.12) |  |
| T3-management | ☑️ | 4 min 25 s | 5,039 | COP 535 ($0.16) |  |
| T4-lookup | ☑️ | 3 min 50 s | 3,734 | COP 434 ($0.13) |  |
| T5-cart | ☑️ | 6 min 48 s | 7,365 | COP 702 ($0.21) |  |
| T6-checkout | ☑️ | 4 min 48 s | 5,317 | COP 601 ($0.18) | prices kept as integer cents |
| T7-qa | ✅ | 5 min 51 s | 6,446 | COP 601 ($0.18) | 5 Playwright scripts (smoke, visual, edge, persistence); fixed a stale checkout notice |
| **Total** | **7/7** | **32 min 34 s** | **35,657** | **COP 3,542 ($1.06)** |  |

✅ passed my headless-Chrome check · ☑️ passed, checked through the final site · ❌ failed · ⏳ running  
Cost = tokens x OpenAI API list price, COP at TRM 3,341.23.
