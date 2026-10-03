# Benchmark infrastructure review

Reviewed every text file under `benchmark/`: the runner, operator instructions, shared project specification, and T1–T7 prompts. This is supporting infrastructure, not an inventory application. **Product UX and visual design: N/A.** Do not rank it alongside the application implementations.

Parent synthesis grades on the shared 1–5 scale: **code quality 3**, **operator UX 2.5**, **workflow/reproducibility 2**. The runner is small and readable, but completion/error handling, timeout enforcement, clean-run guarantees and evidence management have material gaps described below. Inventory business rules, visual design and UI accessibility are not applicable to this folder.

## Common acceptance checklist

| Requirement | Exact acceptance basis | Useful verification |
|---|---|---|
| Shared constraints | HTML5 and vanilla JavaScript; no frameworks/libraries; all application data in localStorage; works by opening `index.html` directly (`tasks/00-project.md:3`). | Open through `file://`, inspect scripts/dependencies and persistence. A localhost-only demonstration does not establish this requirement. |
| T1 | Git repository, basic project structure, README, commit (`tasks/T1-scaffold.md:3`). | Inspect files and available Git metadata; mark commit history unverified when exports omit `.git`. |
| T2 | Products with stock, persisted in localStorage, sample data on first run, commit (`tasks/T2-data.md:3`). | Start with empty storage, inspect samples, modify stock and reload; ensure intentional empty inventory stays empty. |
| T3 | View inventory and add, edit, delete products, commit (`tasks/T3-management.md:3`). | Complete each operation through the UI, reload, check resulting inventory. |
| T4 | Quickly find products through inventory lookup, commit (`tasks/T4-lookup.md:3`). | Search matching/nonmatching text; test whitespace handling per operator instructions (`RUN-BENCHMARK.md:35–39`). Specific search fields, fuzzy matching and sorting are not mandated. |
| T5 | Add inventory products to a cart, change quantities, remove items, show total, persist cart, commit (`tasks/T5-cart.md:3`). | Exercise each operation and reload with a nonempty cart. |
| T6 | Completing a purchase updates stock and retains order history; update README and commit (`tasks/T6-checkout.md:3`). | Compare stock before/after, check durable order after reload; cart clearing is explicitly required by operator verification (`RUN-BENCHMARK.md:37–38`). |
| T7 | Thorough real-browser testing, fixes, commit (`tasks/T7-qa.md:3`). | Requires execution evidence; tests present in source alone do not prove execution. This is an extra remediation opportunity, not a shared T1–T6 product feature. |

The prompts do **not** require a specific visual style, responsive breakpoint, dark mode, categories, SKU, taxes, authentication, payments, remote backend, automated tests, or accessibility standard. These can be assessed as quality differentiators, but absence alone is not a spec failure. Invalid quantities, overselling, stale cart references, storage failures and multi-tab consistency are useful robustness tests; label their status separately from explicit acceptance requirements.

## Findings

| Priority | Evidence | Finding and practical impact |
|---|---|---|
| High: comparison validity | `RUN-BENCHMARK.md:42–43`; `run-benchmark.sh:7,30` | The published result is explicitly T7 for cloud agents and T6 for local models. Cloud sites therefore get an extra browser-test-and-fix task. Final-site scores can compare the delivered artifacts, but cannot isolate model/provider capability under equal opportunities. Show the tested snapshot/T7 status next to scores. |
| Medium: reproducibility | `RUN-BENCHMARK.md:19,27–29`; `run-benchmark.sh:28,32,39` | Clean work directories, isolated settings and model configuration are operator requirements, not enforced safeguards. The runner accepts any existing directory and inherits the caller's environment/configuration. A previous run, global instructions or installed tools can influence results. The command is logged, but a complete environment/model/config manifest is not produced. |
| Medium: time-limit enforcement | `run-benchmark.sh:17,26,39` | If neither `timeout` nor `gtimeout` is installed, `TIMEOUT` is empty and the runner silently executes with no timeout. The documented three-hour ceiling is then unenforced. |
| Medium: run integrity | `run-benchmark.sh:19,28,39–45` | Only `set -u` is enabled. Agent failures are recorded but the runner continues and ends with `ALL_DONE`; its exit status does not reliably reflect failed tasks. Directory creation and snapshot failures are also unchecked. Logs are useful, but completion is not proof of success or complete artifacts. |
| Medium: repeated-run evidence | `run-benchmark.sh:29,39,41–42` | Reusing a work directory appends run/task logs while overwriting per-task stdout, stderr and tar snapshots. This can combine multiple runs' timing records with only the latest task artifacts. |
| Medium: measurement completeness | `RUN-BENCHMARK.md:31–39`; `run-benchmark.sh:38–43` | The script captures timing, return codes, raw output, snapshots and a cumulative commit count; it does not implement token/cost/energy collection, structured acceptance results, browser testing or per-task commit identification. These remain manual operator work and are not standardized by executable checks here. A task checked only in the final site should not be represented as independently validated at that task's snapshot. |
| Low: operator ergonomics | `RUN-BENCHMARK.md:4,14,19` | The instructions say to operate from the `comparison` folder but reference `tasks/` and `./run-benchmark.sh` as if the working directory were `benchmark/`. Following the documented root-directory command literally fails. |

Strengths: small and readable runner; fixed task prompts; separate agent processes; task outputs and snapshots preserved on a fresh run; explicit prohibitions on operator help; explicit direct-file/localStorage verification instructions. The operator guide recognizes final-only checks, which is useful when honestly reported.

Validation performed: `bash -n benchmark/run-benchmark.sh` **passed**. `shellcheck` is unavailable. No benchmark/model process was launched, no paid inference was performed, and no application files were changed.

Recommended additional comparison categories: **functional robustness/data integrity**, **accessibility/responsive behavior**, and **verification confidence/reproducibility**. Keep cost and speed as separate reported benchmark context, because no uniform independent rerun or identical T7 opportunity has been established.
