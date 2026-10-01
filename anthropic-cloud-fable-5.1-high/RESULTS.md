# Claude Fable 5.1 (high)

**Where:** Anthropic cloud  
**Result folder:** `anthropic-cloud-fable-5.1-high`  
**Agent:** Claude Code 2.1.286, `claude -p --model claude-fable-5-1 --effort high --dangerously-skip-permissions --output-format stream-json --verbose`, run with the user's normal Claude Code setup  

| Task | Result | Time | Output tokens | Cost | Notes |
|---|---|---|---|---|---|
| T1-scaffold | ☑️ | 2 min 04 s | 8,003 | COP 4,204 ($1.26) | page shell (header, items panel, stored-item count), README; checked in Chrome over file:// |
| T2-data | ☑️ | 9 min 00 s | 46,835 | COP 13,877 ($4.15) | product model, 12 sample products seeded on first run, summary line; corrupt-storage recovery with a backup key; 31 Node tests |
| T3-management | ☑️ | 27 min 02 s | 58,856 | COP 23,152 ($6.93) | sorted table with SKU, category, price, quantity, reorder level, stock status; add/edit dialog with per-field errors; delete dialog; card layout on narrow screens |
| T4-lookup | ☑️ | 8 min 12 s | 44,606 | COP 19,590 ($5.86) | search over name, SKU and category (every word must match, ignores case, accents and punctuation), category and stock-status filters |
| T5-cart | ☑️ | 13 min 42 s | 74,266 | COP 28,752 ($8.61) | Add to cart per row; cart with -/+ and typed quantity, remove, subtotal, total; saved under `inventory.cart` |
| T6-checkout | ☑️ | 12 min 29 s | 63,968 | COP 24,350 ($7.29) | checkout with a confirm dialog, stock deduction, empty cart, order history; cross-tab safety; orders tests |
| T7-qa | ✅ | 22 min 38 s | 84,136 | COP 34,626 ($10.36) | tested as a user in Chrome and Firefox (Safari automation off, WebKit download timed out); found and fixed 8 bugs (messages, long text, cart quantities) |
| **Total** | **7/7** | **1 h 35 min** | **380,670** | **COP 148,551 ($44.46)** |  |

✅ passed my headless-Chrome check · ☑️ passed, checked through the final site · ❌ failed · ⏳ running  
Cost = Claude Code reported cost (API list price), COP at TRM 3,341.23.

- Browser check: 18 checks on the final site (`file://index.html`), all passed with no page errors.
- First attempt at 10:06 failed T1 with `API Error: 529 Overloaded` after 7 retries, before any model output; that run was stopped and restarted from scratch at 10:23 (logs kept as `claude-fable-high.overloaded-attempt`).
- Cleaned up afterwards (outside the work dir): `/tmp/inv-test` (231 MB of test scripts and a Firefox profile); the agent removed its own `/tmp/inv-check` in T2.
