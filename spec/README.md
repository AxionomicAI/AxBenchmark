# AxBenchmark implementation entry guide

For the engineer or coding agent implementing AxBenchmark: this specification set defines **18 ownership parents and 69 bounded implementation children**. It describes proposed software and planned acceptance work, not an implemented application or passing runtime tests. Benchmark behavior belongs in the headless engine; TUI and CLI clients present its API contracts.

**Start with [Bootstrap](implementation/BOOTSTRAP.md), then [M11.1](implementation/M11/01-engine-client-api.md) → [M11.2](implementation/M11/02-events-jobs-lifecycle.md) → [M15.1](implementation/M15/01-tui-foundation.md) → [M15.2](implementation/M15/02-tui-shell.md).** This publishes owner contracts and creates the client, event/job and screen foundations that early feature work needs.

## Repository layout

`spec/` contains only this README, [architecture](ARCHITECTURE.md), [traceability](TRACEABILITY.md), and [implementation](implementation/). The [active reference contracts](implementation/reference/README.md) keep the product specification, parent contracts, decision history and wireframes available to the child tasks. The [legacy benchmark](../legacy/README.md) contains the original runs, reports and fixed prompts. The empty `solution/` directory is reserved for the application; Git does not track empty directories, so create it with `mkdir -p solution` after cloning.

## Choose and finish one child

1. Read [the development sequence](implementation/DEVELOPMENT-SEQUENCE.md) and the selected node in [dependencies.json](implementation/dependencies.json). Select one unfinished child whose `requires` implementations have passed their required checks. Bootstrap is the initial task with no implementation prerequisite. Prefer the first ready node in `recommended_order`; module numbers identify owners, not a strict M01–M18 development order.
2. Read that child's parent, [ARCHITECTURE](ARCHITECTURE.md), entry conditions, exact ownership, interfaces and full acceptance/fault sections. Load prerequisite evidence and the relevant [requirement/test allocation](implementation/CHILD-TEST-MAP.md). A specification file or an unchecked test plan does not establish a completed prerequisite.
3. Implement only the selected child's owned paths and its explicitly permitted shared contributions. Preserve other owners' declarations and edits; coordinate registry, composition and shared-style changes. Feature owners implement their screens; M15 supplies the shared shell and integration. Do not create private clients, duplicate DTOs or fixture implementations in production to bypass a prerequisite.
4. Run the child's required tests, relevant shared schema/import checks and applicable real-service checks. API work uses the real M11 foundations; screen work uses the M15 harness at the specified sizes. Record installed-provider, platform and consent/access requirements exactly as the child defines them. If a mandatory child check cannot run, leave that child pending and select another ready task.
5. Hand off the child ID, changed owned files, exact commands/results, evidence and remaining gates. For each deferred real integration, name the scenario, provider/child, platform/version, missing prerequisite and next check. A child becomes ready for dependants only after its bounded acceptance passes. A parent is accepted only after every child and its real integration gates pass.

`requires` means completed implementation prerequisites; `contracts` means Bootstrap-published declarations that the child may exercise with its specified fixtures; `integration_gates` means acceptance obligations, including explicitly deferred later-parent checks. They are different statuses. Fixture or fake-port evidence does not establish real harness, browser or sensor support; missing access is pending, never a passing skip.

After Bootstrap, M01.1, M04.1, M11.1, M12.1, M15.1 and M18.1 have no other implementation prerequisites. The domain-focused alternatives include M01.1, M04.1, M12.1 and M18.1; the recommended M11/M15 path unblocks feature API and screen work first. The manifest has **70 nodes including Bootstrap and 316 explicit prerequisite edges**; these are planning facts, not completion counts. See the development sequence for milestone limits and full macOS/Linux acceptance.

Proposed `axbenchmark/`, `tests/`, `schemas/` and package/configuration paths are relative to the **coding root, `solution/` at the repository root**. Documentation links here are relative to this README; manifest `path` values and the wireframe commands below are relative to the `spec/` directory. Future child test commands run from `solution/` after their implementation exists. Preserved benchmark inputs are in `../legacy/benchmark/tasks/` relative to that coding root.

## Parent ownership and child entry points

Each parent owns the behavior and full acceptance contract. Each linked child narrows the files, prerequisites, interfaces and evidence for one coding task; the graph supplies the schedule.

| Parent contract | Bounded implementation children |
|---|---|
| [M01 — Template library and immutable identity](implementation/reference/modules/01-template-library-identity.md) | [M01.1](implementation/M01/01-canonical-definition.md), [M01.2](implementation/M01/02-revision-storage.md), [M01.3](implementation/M01/03-library-service.md), [M01.4](implementation/M01/04-library-screens.md) |
| [M02 — Retained results, provenance, and comparability](implementation/reference/modules/02-retained-results-comparability.md) | [M02.1](implementation/M02/01-retained-records.md), [M02.2](implementation/M02/02-retention-services.md), [M02.3](implementation/M02/03-results-screens.md) |
| [M03 — Environment discovery and readiness](implementation/reference/modules/03-environment-readiness.md) | [M03.1](implementation/M03/01-readiness-service.md), [M03.2](implementation/M03/02-readiness-screens.md) |
| [M04 — Model, effort, and capability catalog](implementation/reference/modules/04-model-catalog.md) | [M04.1](implementation/M04/01-catalog-resolution.md), [M04.2](implementation/M04/02-catalog-discovery.md), [M04.3](implementation/M04/03-price-rate-sources.md), [M04.4](implementation/M04/04-catalog-screens.md) |
| [M05 — Headless harness execution and isolation](implementation/reference/modules/05-harness-execution-isolation.md) | [M05.1](implementation/M05/01-process-runtime.md), [M05.2](implementation/M05/02-isolation-observation.md), [M05.3](implementation/M05/03-claude-adapter.md), [M05.4](implementation/M05/04-codex-adapter.md), [M05.5](implementation/M05/05-grok-adapter.md), [M05.6](implementation/M05/06-pi-adapter.md), [M05.7](implementation/M05/07-adapter-views-integration.md), [M05.8](implementation/M05/08-cursor-adapter.md), [M05.9](implementation/M05/09-opencode-adapter.md) |
| [M06 — Weighting, eligibility, and rankings](implementation/reference/modules/06-scoring-rankings.md) | [M06.1](implementation/M06/01-scoring-service.md), [M06.2](implementation/M06/02-rankings-screens.md) |
| [M07 — Run configuration and launch validation](implementation/reference/modules/07-run-configuration.md) | [M07.1](implementation/M07/01-configuration-drafts.md), [M07.2](implementation/M07/02-launch-preparation.md), [M07.3](implementation/M07/03-setup-review-screens.md) |
| [M08 — Acceptance verification and evidence](implementation/reference/modules/08-verification-evidence.md) | [M08.1](implementation/M08/01-verification-runtime.md), [M08.2](implementation/M08/02-verification-adapters.md), [M08.3](implementation/M08/03-verification-screens.md) |
| [M09 — Default seven-task inventory benchmark](implementation/reference/modules/09-default-inventory-benchmark.md) | [M09.1](implementation/M09/01-inventory-package.md), [M09.2](implementation/M09/02-inventory-repository-checks.md), [M09.3](implementation/M09/03-inventory-behavior-checks.md), [M09.4](implementation/M09/04-inventory-screens.md) |
| [M10 — Execution measurements and cost accounting](implementation/reference/modules/10-measurements-cost.md) | [M10.1](implementation/M10/01-task-accounting.md), [M10.2](implementation/M10/02-final-accounting.md), [M10.3](implementation/M10/03-measurement-screens.md) |
| [M11 — Run scheduling and persistent lifecycle](implementation/reference/modules/11-run-orchestration.md) | [M11.1](implementation/M11/01-engine-client-api.md), [M11.2](implementation/M11/02-events-jobs-lifecycle.md), [M11.3](implementation/M11/03-run-scheduler.md), [M11.4](implementation/M11/04-stop-recovery-invalidation.md), [M11.5](implementation/M11/05-run-screens.md) |
| [M12 — Independent quality judging](implementation/reference/modules/12-quality-judging.md) | [M12.1](implementation/M12/01-review-contract.md), [M12.2](implementation/M12/02-judging-worker.md), [M12.3](implementation/M12/03-judging-screens.md), [M12.4](implementation/M12/04-decision-engines-runtime.md), [M12.5](implementation/M12/05-human-review-web.md) |
| [M13 — Standalone interactive HTML report](implementation/reference/modules/13-standalone-html-report.md) | [M13.1](implementation/M13/01-offline-report-artifact.md), [M13.2](implementation/M13/02-browser-analysis.md), [M13.3](implementation/M13/03-report-charts.md), [M13.4](implementation/M13/04-report-jobs-screens.md) |
| [M14 — Command-line and unattended access](implementation/reference/modules/14-command-line-interface.md) | [M14.1](implementation/M14/01-registry-cli.md), [M14.2](implementation/M14/02-curated-cli-flows.md) |
| [M15 — Terminal user interface](implementation/reference/modules/15-terminal-interface.md) | [M15.1](implementation/M15/01-tui-foundation.md), [M15.2](implementation/M15/02-tui-shell.md), [M15.3](implementation/M15/03-tui-integration.md) |
| [M16 — Custom template planning and baseline capture](implementation/reference/modules/16-custom-template-planning.md) | [M16.1](implementation/M16/01-repository-capture.md), [M16.2](implementation/M16/02-planning-jobs.md), [M16.3](implementation/M16/03-draft-approval.md), [M16.4](implementation/M16/04-planner-screens.md), [M16.5](implementation/M16/05-draft-editor-screens.md) |
| [M17 — Portable ZIP exchange and validation](implementation/reference/modules/17-zip-exchange.md) | [M17.1](implementation/M17/01-archive-contract.md), [M17.2](implementation/M17/02-exchange-transactions.md), [M17.3](implementation/M17/03-exchange-screens.md) |
| [M18 — Optional CPU and GPU monitoring](implementation/reference/modules/18-hardware-monitoring.md) | [M18.1](implementation/M18/01-telemetry-domain.md), [M18.2](implementation/M18/02-sampling-lifecycle.md), [M18.3](implementation/M18/03-macos-collectors.md), [M18.4](implementation/M18/04-linux-collectors.md), [M18.5](implementation/M18/05-telemetry-screens.md) |

[Retained context monitoring](implementation/CONTEXT-MONITORING.md) is a binding extension to the existing child ownership and acceptance lists: M05 captures evidence, M10 counts it and applies classification through the shared selectable decision runtime, and M02 retains sources and versioned analysis. Read it with the parent and child before implementation; its new views remain contract-only until designed and verified.

## Authority, coverage and decision history

- [SPEC.md](implementation/reference/SPEC.md) is the product authority. [ARCHITECTURE.md](ARCHITECTURE.md) fixes shared invariants, layers, API boundaries and ownership. Parents define their detailed behavior; children define bounded implementation work. The dependency manifest mirrors prerequisite contracts rather than creating product behavior. If documents conflict, identify and reconcile the conflict in the authoritative contract and its dependent references; do not silently choose an interpretation or weaken a gate.
- [TRACEABILITY.md](TRACEABILITY.md) locates and assigns all **194 requirement IDs**. [CHILD-TEST-MAP.md](implementation/CHILD-TEST-MAP.md) allocates them to children, proposed tests and parent gates. Coverage and allocation do not establish runtime satisfaction.
- [FINDINGS-RESOLUTION.md](implementation/FINDINGS-RESOLUTION.md) records the current dispositions and pending acceptance work for **F01–F19**. [recommendations.md](implementation/reference/recommendations.md) remains the unchanged historical review; its baseline defects and inventory counts are not the current status.
- [Decision history](implementation/reference/decisions/OPEN-QUESTIONS.yaml), [round 2](implementation/reference/decisions/OPEN-QUESTIONS-R2.yaml) and [round 3](implementation/reference/decisions/OPEN-QUESTIONS-R3.yaml) preserve answers and original wording with `application` metadata linking applied clauses and later refinements. They are answered history, not a fresh open-question queue. `applied` means adopted in specifications/design, not runtime-verified. P16's explicit user clarification governs: **only results on the current default prevent automatic upgrade**, even when other templates have results.

## Wireframe reference and checks

Use [navigation and interaction contracts](implementation/reference/design/wireframe-tui/navigation.md), [the screen/state ownership ledger](implementation/reference/design/wireframe-tui/ownership-ledger.md), [the generated preview](implementation/reference/design/wireframe-tui/preview/preview.html) and [the animation](implementation/reference/design/wireframe-tui/animation.html). The ledger maps rendered states to owners and proposed files and separately identifies contract-only future acceptance states.

Run these reproducible documentation commands from `spec/`:

```sh
node implementation/reference/design/wireframe-tui/src/build.mjs
node implementation/reference/design/wireframe-tui/src/animation.mjs
node implementation/reference/design/wireframe-tui/src/verify.mjs
```

The current static inventory is **194 named states, 233 size variants and 514 focus frames**. Static verification checks the generated prototype and its bindings. Browser visual inspection during this reconciliation was limited to one screenshot, with other tool attempts failing; no full visual sweep or Textual tests are claimed. Child runtime tests must still prove actual keyboard/mouse behavior, resize, calls, lifecycle and integration.

[Shared decision engines](implementation/DECISION-ENGINES.md) define selectable System One profiles and grading backends; [benchmark statistics](implementation/BENCHMARK-STATISTICS.md) define Gen tok/s, input/output tokens, Files/LOC and optional ranking factors. Read these binding supplements with their allocated children.

For the next design pass, start with the [consolidated benchmark design handoff](implementation/BENCHMARK-DESIGN-SPEC.md). Its **45 pending design groups (BD-001–BD-045)** cover all added features, with UI owners, exact bindings, states, delivery order and acceptance gates. The [context-analysis companion](implementation/CONTEXT-DESIGN-HANDOFF.md) points to the context and decision-engine groups.

[Benchmark modes](implementation/BENCHMARK-MODES.md) define one-shot prompts, ordered multi-step specification files and immutable captures of the current target folder. [The benchmark design handoff](implementation/BENCHMARK-DESIGN-SPEC.md) specifies the new/updated screens, including [Cursor CLI](implementation/M05/08-cursor-adapter.md) and [OpenCode](implementation/M05/09-opencode-adapter.md).

[Mandatory task commits](implementation/BENCHMARK-MODES.md#mandatory-task-commits) require a competitor commit after every attempted task, with scoped verification/evidence and isolated trial repositories. Manual folder capture remains independent of Git installation.

## Domain quality judges

Quality reviews use the template-pinned domain rubric, separately from measured tokens, price, throughput and Files/LOC. These proposed contracts extend existing judging and verification children:

- [Backend](implementation/quality-judges/BACKEND.md) — interfaces, rules, recovery and operability.
- [Mobile](implementation/quality-judges/MOBILE.md) — native interaction, adaptation, lifecycle, permissions and accessibility.
- [DevOps](implementation/quality-judges/DEVOPS.md) — reproducible automation, change boundaries, recovery and operational evidence.
- [Agentic software](implementation/quality-judges/AGENTIC.md) — the agent being built, including tool use, state, safeguards and evaluation.
- [Specification design and decomposition](implementation/quality-judges/SPECIFICATION.md) — requirements, interfaces, cohesive slices, dependencies and implementable acceptance criteria.

[The shared judging contract](implementation/reference/modules/12-quality-judging.md#quality-profiles) owns profile routing, versioned selection and common validation; frontend/fullstack retains the web profile.

[Human quality review](implementation/M12/05-human-review-web.md) adds a selectable judge backend for every domain rubric: after benchmark execution, one local browser form queue opens for explicit, saved human assessment. M12.5 owns the active form; the standalone results report stays offline.

[Model variants and provenance](implementation/MODEL-VARIANTS.md) specifies base-model, quantization and fine-tune comparison, with role-specific creator/date evidence, frozen serving identity and offline result filters.

[Normalized results database](implementation/RESULTS-DATABASE.md) defines authoritative SQLite storage for facts, measurements, grades and versioned score snapshots, with an [executable schema](implementation/sqlite/results-v1.sql), read-only analysis views and [SQL examples](implementation/sqlite/analysis-examples.sql) for graphs and comparisons.

[Cross-harness comparison and API access](implementation/CROSS-HARNESS-COMPARISON.md) defines same-model/effort matrices across all six harnesses, OpenRouter/LiteLLM profiles, isolated Claude Code/Codex configuration, truthful compatibility states and normalized route evidence for analysis.

[Existing configured agents](implementation/CROSS-HARNESS-COMPARISON.md#existing-agent-aliases-and-launcher-profiles) can be selected by a registered alias/profile such as `claudeg`, preserving declared settings through isolated benchmark snapshots with explicit treatment and override provenance.

[Supplement integration](implementation/SUPPLEMENT-INTEGRATION.md) maps every added feature to its parent/child owners and distinguishes documentation integration from pending runtime gates. Run `python3 implementation/validate-specs.py --require-supplement-coverage` from `spec/` for portable graph, allocation, source-digest and local-link checks.
