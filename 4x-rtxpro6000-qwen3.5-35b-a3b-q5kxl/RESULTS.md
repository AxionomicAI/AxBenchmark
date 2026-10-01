# Qwen3.5-35B-A3B UD-Q5_K_XL via Claude Code (262k context)

**Where:** 4× NVIDIA RTX PRO 6000 Blackwell 96 GB, GPU (rented), llama.cpp `llama-server` (Unsloth build b11160)  
**Agent:** Claude Code 2.1.286, headless (`-p --dangerously-skip-permissions --output-format stream-json`), clean config dir  
**Model settings:** 262,144-token context (native max), 1 slot, flash attention, temperature 0.6, top_p 0.95, top_k 20, min_p 0 (model card preset for coding/WebDev); chat template patched to accept Claude Code's extra system messages  
**Result folder:** `4x-rtxpro6000-qwen3.5-35b-a3b-q5kxl`

| Task | Result | Time | Output tokens | Cost (rental · GPU energy) | Notes |
|---|---|---|---|---|---|
| T1-scaffold | ✅ | 0 min 19 s | 3,283 | COP 87 ($0.03) · 3.2 Wh | index.html, css/, js/, README; add form already in the scaffold (369 lines) |
| T2-data | ✅ | 0 min 11 s | 1,731 | COP 50 ($0.02) · 1.9 Wh | SAMPLE_DATA: 8 products, seeded on first run |
| T3-management | ✅ | 0 min 29 s | 5,228 | COP 132 ($0.04) · 5.0 Wh | edit (form reuse) and delete with confirm |
| T4-lookup | ✅ | 0 min 22 s | 3,549 | COP 100 ($0.03) · 3.7 Wh | search by name/category/quantity, trimmed; clear button; 'no items match' row |
| T5-cart | ✅ | 0 min 30 s | 5,026 | COP 137 ($0.04) · 5.3 Wh | own localStorage key; +/- and typed quantity, remove, clear, total; 'add all to cart' |
| T6-checkout | ❌ | 0 min 39 s | 6,348 | COP 178 ($0.05) · 6.6 Wh | checkout validates and decrements stock (45 → 42), empties the cart and saves the order, but the order history is never drawn on page load: init() does not call renderOrders(), so after a reload the list stays empty |
| **Total** | **5/6** | **2 min 30 s** | **25,165** | **COP 685 ($0.20) · 25.7 Wh** |  |

✅ passed my headless-Chrome check · ☑️ passed, checked through the final site · ❌ failed · ⏹️ stopped by the operator  
Cost = machine rental at $4.919/h x wall time, COP at TRM 3,341.23. GPU energy (all 4 GPUs, `nvidia-smi`) shown for reference:
25.7 Wh = COP 20.9 at COP 814.63/kWh; CPU package energy (RAPL) is not readable in the rented container.  
Output tokens = Claude Code's reported usage.

- Fastest run by far (2 min 30 s for T1-T6): ~3B active parameters per token. Prompt cache reuse worked (same as GLM, unlike DeepSeek).
- Browser check: headless Chrome on `file://index.html` for each task's snapshot; 18 checks on the final site, 17 passed (order history after reload failed).
- The site here is the T6 commit.
