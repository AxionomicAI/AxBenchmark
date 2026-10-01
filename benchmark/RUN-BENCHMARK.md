# Prompt: run the inventory benchmark on a new model

Copy everything below the line into a coding agent you use as the **operator** (Claude Code, Codex, ...),
opened in this `comparison` folder. Fill in the three blanks first.

---

You are the operator of a coding benchmark. Run it on a new model and add the result to this folder.

- **Agent under test:** `<headless command, e.g. claude -p --model ... --dangerously-skip-permissions --output-format stream-json --verbose>`
- **Where it runs:** `<machine, e.g. "Anthropic cloud" or "dirac (Ryzen 7 8745HS, CPU)">`
- **Result folder name:** `<machine-or-vendor>-<model>`, for example `xai-cloud-grok-4.7-fast-500k-medium`

**The benchmark.** `tasks/` holds the prompts: `00-project.md` (the project and the rules for the agent) and
the tasks T1-T6 (scaffold, data, management, lookup, cart, checkout), plus T7 (test in a real browser and
fix). Each task is one fresh session of the agent with the prompt `00-project.md` + the task file. The repository
on disk is the only state carried from one task to the next.

**Run it.** Use `./run-benchmark.sh <empty work dir> --qa -- <agent command>`. It runs T1-T7 in order, each
in a new agent process with a 3-hour limit, and logs times, exit codes, output and a snapshot per task to
`<work dir>.bench/`. Watch it while it runs and tell me as each task ends.

**Rules. They are what make the results comparable:**
1. **Never help the model.** Only prompt and verify. Don't edit its files, don't add hints, implementation
   details or UI requirements to any prompt, and don't re-run a task to get a better result.
2. **The prompts are fixed.** Use `tasks/` exactly as written.
3. **Same conditions for everyone.** Run in a clean environment: no personal skills, memories, MCP servers or
   global instruction files leaking into the agent (use a separate HOME / config dir if the CLI loads them).
   Record the model, reasoning effort, sandbox mode and context window you used.

**Measure, per task:** wall time; input, cached and output tokens; cost (the agent's reported cost, or tokens
x the provider's API list price, in USD and in COP at TRM 3,341.23). For local models, record CPU package
energy (RAPL) and price it at COP 814.63/kWh.

**Verify** every task in a real headless browser by opening `index.html` as a user would. Check: page errors;
products with stock persisted in localStorage; add, edit and delete; lookup (including untrimmed input and no
matches); cart add, quantities, remove, total, and persistence across reload; checkout decrements stock, empties
the cart and records an order that survives a reload. Mark each task passed, failed, or passed but only checked
through the final site, and note whether it was committed.

**Report.**
1. Copy the final site into `<result folder name>/`. For cloud agents this is the T7 snapshot; for local models
   it is T6.
2. Write `<result folder name>/RESULTS.md` with one row per task: result, committed, time, output tokens, cost,
   notes.
3. Add a row for the model to `COMPARISON.md` in the same format as the existing rows.
4. Clean up anything the agent installed outside its work directory during T7 (temporary projects, browser
   downloads), and tell me what you removed.
