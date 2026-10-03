# GLM-5.3-Flash UD-Q4_K_XL, own minimal harness, one conversation (1M context)

**Where:** 4× NVIDIA RTX PRO 6000 Blackwell 96 GB, GPU (rented), llama.cpp `llama-server` (Unsloth build b11160, carries llama.cpp PR #27754)  
**Result folder:** `4x-rtxpro6000-glm-5.3-flash-q4kxl`  
**Agent:** `glm-harness.py` (~130 lines of Python, no Claude Code): OpenAI chat API with 4 tools (bash, read_file, write_file, edit_file)
confined to the work dir; one-sentence system prompt; **all six tasks in the same conversation** (each task appended as a new user
message with the unchanged `00-project.md` + task prompt); up to 65,536 tokens per response (z.ai's own eval setting), 150 steps / 3 h per task  
**Model settings:** 1,048,576-token context, 1 slot, flash attention, temperature 1.0, top_p 1.0

| Task | Result | Time | Output tokens | Cost (rental · GPU energy) | Notes |
|---|---|---|---|---|---|
| T1-scaffold | ✅ | 0 min 47 s | 2,462 | COP 215 ($0.06) · 7.6 Wh | 7 steps; index.html, css, js/app.js, README; empty shell |
| T2-data | ✅ | 6 min 33 s | 19,465 | COP 1,794 ($0.54) · 66.3 Wh | 18 steps; storage + data modules (versioned keys), 10 seeded products with SKU, reorder level, location; Node test for the data layer |
| T3-management | ✅ | 11 min 26 s | 29,123 | COP 3,132 ($0.94) · 112.3 Wh | 17 steps; table with modal add/edit form (validation, unique SKU), delete with confirm modal, +/- stock buttons; installed npm + jsdom to test the UI |
| T4-lookup | ✅ | 7 min 31 s | 19,623 | COP 2,059 ($0.62) · 77.0 Wh | 10 steps; live search (trimmed, case-insensitive) + category filter, 'no results' state with clear-filters |
| T5-cart | ✅ | 15 min 34 s | 36,364 | COP 4,264 ($1.28) · 158.7 Wh | 21 steps; cart module in its own key: add, +/- (capped at stock), remove, clear, units and price totals; cart badge in the header |
| T6-checkout | ✅ | 11 min 54 s | 23,720 | COP 3,260 ($0.98) · 120.2 Wh | 17 steps; checkout validates stock, decrements it, empties the cart, numbered order history that survives reload; README updated |
| **Total** | **6/6** | **53 min 45 s** | **130,757** | **COP 14,723 ($4.41) · 542.1 Wh** | 90 steps |

✅ passed my headless-Chrome check · ☑️ passed, checked through the final site · ❌ failed  
Cost = machine rental at $4.919/h x wall time, COP at TRM 3,341.23. GPU energy (all 4 GPUs, `nvidia-smi`) shown for reference:
542.1 Wh = COP 441.6 at COP 814.63/kWh; CPU package energy (RAPL) is not readable in the rented container.  
Output tokens = llama-server's completion tokens per response (thinking included).

- Not the standard protocol: one conversation instead of a fresh session per task, and a minimal harness instead of Claude Code.
  Under Claude Code the same model was stopped in T2 after two 32,000-token responses spent planning (run discarded).
- Browser check: headless Chrome on `file://index.html` for each task's snapshot; 17 checks on the final site (this cart uses +/-
  buttons, no typed quantity), all passed with no page errors. Largest site of all runs: ~4,600 lines incl. 4 Node test files.
- Cleaned up afterwards (installed by the agent outside its work dir): `apt-get install npm` (445 packages, purged), `~/.npm` (185 MB),
  20 log files in `/tmp`; and `node_modules/` (jsdom, 15 MB, git-ignored) in the work dir. The site here is the T6 commit `aaf3947`.
