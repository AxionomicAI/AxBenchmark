# Inventory website benchmark

Fifteen generated inventory applications, compared by recorded cost, elapsed time and independently reviewed artifact quality. Review date: **October 1, 2026**.

Different priorities produce different winners: **DeepSeek Flash cloud has the lowest eligible cost**, **Sonnet 5.5 has the shortest eligible run**, and **GPT-6 Astra has the highest weighted quality grade**, effectively tied with Fable. The original quality assessments are unchanged.

[Full cost/time comparison and ranking tables](COMPARISON.md) · [Quality grades and review evidence](QUALITY_COMPARISON.md) · [Methodology](#methodology) · [Why the GLM harness was created](#why-the-glm-harness-was-created)

## Top three by cost, time and quality

These are direct rankings by each metric, separate from the weighted shortlist below. All three use the same **11 eligible applications**, requiring a business rules/spec grade of at least **4/5**. The four applications with major required-workflow defects remain in the full comparison but are excluded from these shortlists. Eligibility does not mean an application is defect-free.

![Three direct rankings: lowest cost is DeepSeek cloud, cloud GLM, then GPT-6 Sol; shortest time is Sonnet, Opus, then GPT-6 Sol; highest quality is Astra, Fable, then Opus.](assets/charts/top-three-by-priority.png)

[Exact top-three tables](COMPARISON.md#top-3-by-primary-driver) · [Vector image](assets/charts/top-three-by-priority.svg)

## Cost, time and quality together

Lower and farther left means a faster, cheaper run. Color represents the quality grade; circles are cloud runs and diamonds are rented-GPU runs. USD is the primary cost axis, with COP as a secondary reference. The cost axis is logarithmic, so equal horizontal distances represent cost multiples. Sonnet stands out for turnaround, while DeepSeek and cloud GLM are cheaper but take much longer.

![Cost-versus-time plot for 11 eligible applications, colored by quality. Sonnet finishes in 7 minutes 5 seconds; DeepSeek cloud costs $0.45 (COP 1,504); Astra and Fable have the highest quality grades.](assets/charts/cost-time-quality.png)

[All recorded costs and times](COMPARISON.md) · [Vector image](assets/charts/cost-time-quality.svg)

## Cost-weighted top five

The working priority is **50% cost, 30% time and 20% quality**. Cheaper and faster runs earn more points, using the cheapest and fastest eligible runs as references. These weights are assumptions for a decision aid, not additional quality grades.

**Score /100 = 50 × (minimum eligible cost / run cost) + 30 × (425 / elapsed seconds) + 20 × (unrounded quality / 5).**

The minimum eligible cost is **$0.45** (COP 1,504). Calculations preserve the original COP ratios, equivalent to unrounded USD conversions.

DeepSeek leads this formula, followed by cloud GLM, Sonnet, GPT-6 Sol and Opus. Sonnet earns the maximum time contribution; DeepSeek earns the maximum cost contribution. The chart shows why cost-first weighting can favor a slower result.

![Stacked contributions to the weighted top-five scores: DeepSeek 69.84, cloud GLM 60.47, Sonnet 58.24, GPT-6 Sol 43.46 and Opus 30.47, out of 100.](assets/charts/weighted-value.png)

[Weighted ranking and tradeoffs](COMPARISON.md#cost-vs-time-vs-quality--weighted-top-5) · [Vector image](assets/charts/weighted-value.svg)

## Methodology

The benchmark measures how a coding agent builds a working application across successive tasks. Every model received the same [project specification](benchmark/tasks/00-project.md): an inventory website using HTML5 and vanilla JavaScript, with no frameworks or runtime libraries, all application data in `localStorage`, and direct operation by opening `index.html` in a browser.

### Tasks and execution

The [fixed task prompts](benchmark/tasks/) build on the files produced by earlier tasks:

| Task | Requested deliverable |
|---|---|
| T1 | Initialize Git, scaffold the project and write a README. |
| T2 | Add products, stock, persistent storage and first-run sample data. |
| T3 | Let users view, add, edit and delete products. |
| T4 | Add quick inventory lookup. |
| T5 | Add a persistent cart with quantity changes, removal and totals. |
| T6 | Complete purchases, update stock, retain order history and update the README. |
| T7 | Test the site thoroughly in a real browser, fix bugs and commit. |

For the standard protocol, each task starts a new agent process with the project specification plus that task's prompt; project files carry state between sessions. The [operator instructions](benchmark/RUN-BENCHMARK.md) call for fixed prompts, no implementation hints or manual code fixes, and no rerunning tasks simply to obtain a better result. Each task requests a commit. The [runner](benchmark/run-benchmark.sh) records start/end times, exit codes, output and a project snapshot for each task.

Cloud deliverables include T7; the CPU and rented-GPU deliverables stop at T6. The cloud runs therefore had an additional opportunity to find and fix browser defects. Each result folder's `RESULTS.md` records the model, environment, task outcomes and available measurements. A task verified only through the final application is distinguished there from a task checked at its own snapshot.

### Measurements and verification

Elapsed time is task wall-clock time, including the agent's tool work, rather than inference speed alone. Output-token figures come from the agent or serving system. Cloud costs use reported costs or token usage priced at the recorded API rates; CPU costs estimate package energy, a lower bound on total electricity use; GPU costs use machine rental time, with GPU energy shown separately. Prices display **USD first**, with COP secondary at the recorded rate of **$1 USD** = COP 3,341.23. These are different cost bases; calculation details remain in [COMPARISON.md](COMPARISON.md).

Browser verification checks direct-file loading, page errors, seeded stock, product management, search, cart operations and reload persistence. Checkout checks stock deduction, cart clearing and an order that survives reload. Historical pass labels are retained as run records; they are assessed separately from the later quality audit.

### How quality was judged

After generation, each application received a fresh review subagent, strictly one at a time. Reviewers read the implementation and specification, opened the actual `file://` site in an isolated Chrome context, exercised user workflows, and captured and viewed desktop **1440×1000** and mobile **390×844** screenshots. They ran supplied tests where feasible and recorded skips or missing dependencies. Targeted probes examined validation, focus, rendering and storage failures; simulated failure cases are identified separately from normal user actions.

The quality grade combines **UX 25%, visuals 15%, code quality 20%, business rules/spec adherence 25%, robustness 10% and accessibility 5%**, each graded from 1 to 5. Test counts are reported separately. The [review protocol](quality-review/REVIEW_PROTOCOL.md) and [individual evidence reports](quality-review/) document findings and limits. These quality weights are separate from the **50% cost / 30% time / 20% quality** decision score used above.

### Differences between runs

The results compare delivered artifacts and complete model/agent configurations. They are recorded runs rather than repeated-trial averages. The initial setup used a 30k-token context, while rented-GPU runs used larger model contexts: approximately 1M for DeepSeek and GLM, and 262k for Qwen. CPU checkpointing and compaction also changed across runs, as documented in the comparison notes.

The clean-environment rule was not uniform in practice: [Fable](anthropic-cloud-fable-5.1-high/RESULTS.md) and [Astra](openai-cloud-gpt-6-astra-high/RESULTS.md) used the operator's normal agent configurations, and Astra had its browser MCP tools available. Fable also restarted after a provider overload before any model output. GPU GLM used the custom harness described below. These differences affect comparisons of model capability independently of the surrounding tools and environment.

## Why the GLM harness was created

The GPU-hosted GLM model repeatedly conflicted with Claude Code during the initial attempts. After several such conflicts, a lightweight harness was created to give this model a simpler way to work through the benchmark. The [GPU GLM run notes](4x-rtxpro6000-glm-5.3-flash-q4kxl/RESULTS.md) record a concrete symptom: the Claude Code attempt was stopped during T2 after **two 32,000-token responses spent planning**. That attempt was discarded from the published completed-run result.

The replacement [GLM harness](glm-harness/glm-harness.py) is a small Python agent loop that talks directly to the model's local API. It uses a short system prompt and four explicit tools: `bash`, `read_file`, `write_file` and `edit_file`. The six product task prompts stayed unchanged. All six tasks were appended to **one continuing conversation**, with a 1M-token context and an output allowance of up to **65,536 tokens per response**.

With that configuration, the recorded run completed **T1–T6 in 53 min 45 s**, at **$4.41** (COP 14,723) in GPU rental cost. Its run report records **6/6 tasks passed** and 17 final-site browser checks with no page errors. The later [independent artifact review](quality-review/4x-rtxpro6000-glm-5.3-flash-q4kxl.md) graded it **3.63/5**, including remaining mobile and storage-failure weaknesses. The time and cost describe the completed harness run; they do not include the discarded Claude Code attempt.

**The practical lesson is that the harness matters alongside the model.** A general-purpose coding agent's prompts, tool interface and conversation strategy may fit some models better than others. Here, adapting the harness helped a model that had stalled complete the workflow. Depending on the model, a smaller custom harness can be the better practical choice.

This run changed the harness, conversation handling and response allowance together, so it cannot isolate which change produced the improvement. It is explicitly reported as a distinct model-and-harness configuration. A controlled comparison would hold those other settings constant and repeat both configurations. The [harness review](quality-review/glm-harness.md) also documents the lightweight runner's implementation and reproducibility limitations.
