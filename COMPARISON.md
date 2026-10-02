# Inventory website benchmark: comparison

Same six high-level tasks for every model ([fixed prompts](benchmark/tasks/)); the standard protocol uses a fresh session per task.
Cloud agents also ran T7 (test in a real browser and fix). Context sizes and the GPU GLM harness differ as documented in the [methodology](README.md#methodology) and notes below. The folders hold each model's final site. Prices show **USD first**, with COP in parentheses.

| Model | Where | Tasks passed | Time | Output tokens | Cost (USD / COP) | Folder |
|---|---|---|---|---|---|---|
| Claude Fable 5.1 (high) | Anthropic cloud | 7/7 | 1 h 35 min | 380,670 | **$44.46** (COP 148,551) | `anthropic-cloud-fable-5.1-high` |
| Codex GPT-6 Astra (high) | OpenAI cloud | 7/7 | 51 min 19 s | 59,148 | **$10.40** (COP 34,756) | `openai-cloud-gpt-6-astra-high` |
| Claude Opus 5.5 (medium) | Anthropic cloud | 7/7 | 20 min 02 s | 118,640 | **$6.50** (COP 21,718) | `anthropic-cloud-opus-5.5-medium` |
| Grok 4.7 Fast, 500k context (medium) | xAI cloud | 7/7 | 38 min 40 s | 273,254 | **$6.31** (COP 21,083) | `xai-cloud-grok-4.7-fast-500k-medium` |
| GLM-5.3-Flash UD-Q4_K_XL, 1M context, own minimal harness, one conversation for all tasks | 4× RTX PRO 6000 Blackwell, GPU | 6/6 | 53 min 45 s | 130,757 | **$4.41** (COP 14,723; rental; 542.1 Wh GPU) | `4x-rtxpro6000-glm-5.3-flash-q4kxl` |
| DeepSeek-V4-Flash UD-Q8_K_XL, 1M context, via Claude Code | 4× RTX PRO 6000 Blackwell, GPU | 6/6 | 42 min 38 s | 32,736 | **$3.50** (COP 11,678; rental; 552.3 Wh GPU) | `4x-rtxpro6000-deepseek-v4-flash-q8kxl` |
| Codex GPT-5.6 Sol (medium) | OpenAI cloud | 7/7 | 46 min 12 s | 53,528 | **$2.77** (COP 9,255) | `openai-cloud-gpt-5.6-sol-medium` |
| Claude Sonnet 5.5 (medium) | Anthropic cloud | 7/7 | 7 min 05 s | 56,470 | **$1.65** (COP 5,513) | `anthropic-cloud-sonnet-5.5-medium` |
| Codex GPT-6 Sol (medium) | OpenAI cloud | 7/7 | 32 min 34 s | 35,657 | **$1.06** (COP 3,542) | `openai-cloud-gpt-6-sol-medium` |
| GLM-5.3 Flash via Claude Code (claudeg) | z.ai cloud | 7/7 | 1 h 10 min | 187,466 | **$0.51** (COP 1,704) | `zai-cloud-glm-5.3-flash` |
| DeepSeek flash via Claude Code (clauded) | DeepSeek cloud | 7/7 | 51 min 20 s | 407,464 | **$0.45** (COP 1,504) | `deepseek-cloud-deepseek-flash` |
| Qwen3.5-35B-A3B UD-Q5_K_XL, 262k context, via Claude Code | 4× RTX PRO 6000 Blackwell, GPU | 5/6 | 2 min 30 s | 25,165 | **$0.20** (COP 685; rental; 25.7 Wh GPU) | `4x-rtxpro6000-qwen3.5-35b-a3b-q5kxl` |
| Qwen3.8-27B GSQ-RCO IQ3_S (+ MTP draft) | Ryzen 7 8745HS, CPU | 5/6 | 8 h 46 min | 38,604 | **$0.1031** (COP 344.6; 423.0 Wh) | `ryzen7-8745hs-qwen38-27b-iq3` |
| Qwen3.6-35B-A3B Q4_K_S | Ryzen 7 8745HS, CPU | 4/6 | 3 h 39 min | 83,433 | **$0.0383** (COP 128.0; 157.1 Wh) | `ryzen7-8745hs-qwen36-35b` |
| Gemma 4 26B-A4B QAT Q4_K_XL | Ryzen 7 8745HS, CPU | 6/6 | 1 h 30 min | 50,975 | **$0.0176** (COP 58.9; 72.3 Wh) | `ryzen7-8745hs-gemma4-26b` |

- Cloud cost: Claude Code's reported cost, or Codex tokens at OpenAI API list price (subscriptions change what you actually pay).
- Local cost: CPU package energy × **$0.2438/kWh** (COP 814.63/kWh) (Sabaneta, Antioquia); a lower bound on wall power.
- Rented GPU cost (4× RTX PRO 6000, vast.ai): machine rental at **$4.919/h** (COP 16,435.51/h) × wall time; GPU energy shown for reference (CPU RAPL not readable there).
  These runs used each model's large context (1M; Qwen 262k) instead of 30k, T1-T6 only (T7 stopped to save rental).
- Qwen3.5's checkout saves orders but never draws the history after a reload.
- The GLM own-harness run is not the standard protocol: `glm-harness.py` (4 tools, one-sentence system prompt, 65,536-token responses)
  instead of Claude Code, and all six tasks in one conversation instead of a fresh session each; prompts unchanged. It was created after repeated conflicts between Claude Code and GPU GLM; see [why the harness was created](README.md#why-the-glm-harness-was-created).
- Exchange rate: **$1 USD** = COP 3,341.23 (Banco de la República, 2026-09-30). CPU USD estimates use this historical rate and four decimal places; other USD amounts retain the recorded figures. Per-task detail: `RESULTS.md` in each folder.
- Gemma ran before context checkpoints and 8k compaction; Qwen3.6 got compaction from T5, Qwen3.8 from T4.

## Cost vs time vs quality — equal-weight top 5

**More is better:** cost, time and quality each contribute up to **33.3 points**, so a higher score ranks higher. The three factors carry **equal weight**; these percentages are an explicit choice and can be adjusted. Quality grades remain those in [QUALITY_COMPARISON.md](QUALITY_COMPARISON.md).

Eligibility requires a business rules/spec grade of at least **4/5**, used here as the minimum for a usable result. This includes 11 applications and excludes the four with major required-workflow defects: CPU Gemma, CPU Qwen 3.6, CPU Qwen 3.8 and GPU Qwen 3.5. Among eligible applications, DeepSeek cloud has the lowest recorded cost at **$0.45** (COP 1,504), and Sonnet has the shortest time at **425 seconds**.

**Score /100 = 33.3 × (minimum eligible cost / run cost) + 33.3 × (425 / elapsed seconds) + 33.3 × (unrounded quality / 5).** Cost ratios use the original COP amounts, equivalently their unrounded USD conversions. Lower cost and shorter time earn more points; doubling either halves its contribution. This is a decision aid using the recorded run figures and reviewer grades, not a new model benchmark or a quality percentage.

Under equal weights, **Sonnet ranks first because its speed earns the full time contribution**, **DeepSeek ranks second on the strength of the lowest cost**, and **cloud GLM ranks third because of its low cost**. The gap between Sonnet and DeepSeek is under three points, so either is a reasonable pick depending on whether turnaround or cost matters more. The main table above remains sorted by cost descending; this weighted table is ordered by score.

| Rank | Model | Cost (USD / COP) | Time | Quality /5 | Equal-weight score /100 (more is better) | Tradeoff |
|---:|---|---:|---|---:|---:|---|
| 1 | [Claude Sonnet 5.5 (medium)](quality-review/anthropic-cloud-sonnet-5.5-medium.md) | **$1.65** (COP 5,513) | 7 min 05 s | 3.65 | 66.76 | Fastest eligible run and still inexpensive. Strong choice for rapid iteration; mobile and failed-save weaknesses lower its quality grade. |
| 2 | [DeepSeek Flash (cloud)](quality-review/deepseek-cloud-deepseek-flash.md) | **$0.45** (COP 1,504) | 51 min 20 s | 3.93 | 64.10 | Cheapest eligible run with solid quality. Longer turnaround and storage-failure defects remain. |
| 3 | [GLM-5.3 Flash (cloud)](quality-review/zai-cloud-glm-5.3-flash.md) | **$0.51** (COP 1,704) | 1 h 10 min | 3.33 | 54.96 | Very low cost drives its rank despite the longest run and lowest quality in this shortlist; stale cart controls and failed-save defects matter. |
| 4 | [Codex GPT-6 Sol (medium)](quality-review/openai-cloud-gpt-6-sol-medium.md) | **$1.06** (COP 3,542) | 32 min 34 s | 3.93 | 47.57 | Cheaper and higher quality than Sonnet, but takes 25 min 29 s longer. A low-cost option when turnaround is less urgent. |
| 5 | [Claude Opus 5.5 (medium)](quality-review/anthropic-cloud-opus-5.5-medium.md) | **$6.50** (COP 21,718) | 20 min 02 s | 4.10 | 41.43 | Highest quality in this shortlist and second-fastest, but its higher cost limits its score. |

<!-- BEGIN GENERATED PRIORITY TABLES -->

## Top 3 by primary driver

These three tables rank directly by the named metric, separately from the equal-weight top five above. They use the same 11 eligible applications (business rules/spec grade at least 4/5). Cost and time sort ascending; quality sorts descending using unrounded grades. Ties favor lower cost, then shorter time; cost ties favor shorter time, then higher quality. The chart versions are embedded in [README.md](README.md).

### Cost driver — lowest cost

| Rank | Model | Cost (USD / COP) | Time | Quality /5 |
|---:|---|---:|---|---:|
| 1 | [DeepSeek Flash · cloud](quality-review/deepseek-cloud-deepseek-flash.md) | **$0.45** (COP 1,504) | 51 min 20 s | 3.93 |
| 2 | [GLM Flash · cloud](quality-review/zai-cloud-glm-5.3-flash.md) | **$0.51** (COP 1,704) | 1 h 10 min | 3.33 |
| 3 | [GPT-6 Sol](quality-review/openai-cloud-gpt-6-sol-medium.md) | **$1.06** (COP 3,542) | 32 min 34 s | 3.93 |

### Time driver — shortest run

| Rank | Model | Cost (USD / COP) | Time | Quality /5 |
|---:|---|---:|---|---:|
| 1 | [Sonnet 5.5](quality-review/anthropic-cloud-sonnet-5.5-medium.md) | **$1.65** (COP 5,513) | 7 min 05 s | 3.65 |
| 2 | [Opus 5.5](quality-review/anthropic-cloud-opus-5.5-medium.md) | **$6.50** (COP 21,718) | 20 min 02 s | 4.10 |
| 3 | [GPT-6 Sol](quality-review/openai-cloud-gpt-6-sol-medium.md) | **$1.06** (COP 3,542) | 32 min 34 s | 3.93 |

### Quality driver — highest artifact grade

| Rank | Model | Cost (USD / COP) | Time | Quality /5 |
|---:|---|---:|---|---:|
| 1 | [GPT-6 Astra](quality-review/openai-cloud-gpt-6-astra-high.md) | **$10.40** (COP 34,756) | 51 min 19 s | 4.35 |
| 2 | [Fable 5.1](quality-review/anthropic-cloud-fable-5.1-high.md) | **$44.46** (COP 148,551) | 1 h 35 min | 4.33 |
| 3 | [Opus 5.5](quality-review/anthropic-cloud-opus-5.5-medium.md) | **$6.50** (COP 21,718) | 20 min 02 s | 4.10 |

<!-- END GENERATED PRIORITY TABLES -->
