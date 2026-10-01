# DeepSeek-V4-Flash UD-Q8_K_XL via Claude Code (1M context)

**Where:** 4× NVIDIA RTX PRO 6000 Blackwell 96 GB, GPU (rented), llama.cpp `llama-server` (Unsloth build b11160)  
**Result folder:** `4x-rtxpro6000-deepseek-v4-flash-q8kxl`  
**Agent:** Claude Code 2.1.286, headless (`-p --dangerously-skip-permissions --output-format stream-json`), clean config dir  
**Model settings:** 1,048,576-token context, 1 slot, flash attention, temperature 1.0, top_p 1.0, no speculative decoding

| Task | Result | Time | Output tokens | Cost (rental · GPU energy) | Notes |
|---|---|---|---|---|---|
| T1-scaffold | ✅ | 4 min 39 s | 7,116 | COP 1,274 ($0.38) · 56.7 Wh | built far beyond a scaffold: form, sortable table, search/filter, CRUD, JSON export (one commit) |
| T2-data | ✅ | 2 min 42 s | 2,256 | COP 740 ($0.22) · 35.1 Wh | seedSampleData(): 8 sample products across 6 categories on first run |
| T3-management | ✅ | 1 min 13 s | 1,259 | COP 333 ($0.10) · 15.6 Wh | no changes: add/edit/delete already existed from T1; verified and left the clean tree |
| T4-lookup | ✅ | 11 min 25 s | 8,635 | COP 3,127 ($0.94) · 149.9 Wh | detail panel, search-term highlighting, keyboard shortcuts (+251 lines) |
| T5-cart | ✅ | 9 min 37 s | 6,541 | COP 2,634 ($0.79) · 124.2 Wh | cart in its own localStorage key: +/- and typed quantity, remove, clear, running total |
| T6-checkout | ✅ | 13 min 02 s | 6,929 | COP 3,570 ($1.07) · 170.8 Wh | stock validation before purchase, stock deduction, order history (expandable), README updated; checked: stock 12 → 9, cart emptied, order survives reload |
| **Total** | **6/6** | **42 min 38 s** | **32,736** | **COP 11,678 ($3.50) · 552.3 Wh** |  |

✅ passed my headless-Chrome check · ☑️ passed, checked through the final site · ❌ failed  
Cost = machine rental at $4.919/h x wall time, COP at TRM 3,341.23. GPU energy (all 4 GPUs, `nvidia-smi`, ~780 W average) is shown for reference:
552.3 Wh = COP 449.9 at COP 814.63/kWh; CPU package energy (RAPL) is not readable in the rented container.  
Output tokens = Claude Code's reported usage. llama-server counted 54,939 generated tokens for the whole session (thinking included, plus the stopped T7 and one smoke test).

- Generation ran at ~57 tok/s; prompt reading at ~1,645 tok/s. About 70% of the time went to re-reading the whole conversation on every
  agent step (54-58k tokens, ~35 s each): DeepSeek's chat template drops earlier thinking, so each request no longer matches the cached
  prefix, and DeepSeek-V4's compressed + sliding-window cache cannot roll back to the divergence point, so llama.cpp re-processes from scratch.
- Browser check: headless Chrome on `file://index.html` for each task's snapshot, 18 checks on the final site (load errors, sample
  data with stock, add/edit/delete, lookup with untrimmed input and no matches, cart add/+/-/typed qty/remove/total/reload,
  checkout stock/cart/order + reload), all passed with no page errors.
- T7 (test in a real browser and fix) was started, then stopped by the operator after 15 min 43 s to save machine time; it is not counted.
  The agent had installed Playwright; removed afterwards: `~/.cache/ms-playwright` (Chromium 1243, headless shell, ffmpeg) and
  `node_modules/`, `package.json`, `package-lock.json`, `test.mjs` in the work dir. The site here is the T6 commit `a8f0b99`.
- Speed options tested before the run and rejected: MTP draft (GGUF has no MTP layers), ngram speculation (changed greedy outputs),
  larger ubatch (slower prompt reading), `-sm tensor` (15 tok/s vs 59).
