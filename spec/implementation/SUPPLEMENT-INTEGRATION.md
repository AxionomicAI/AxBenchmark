# Supplemental specification integration

This index records how the feature supplements enter the parent ownership contracts and bounded implementation tasks. Integration means the documentation has concrete input, output, lifecycle, presentation and acceptance obligations. It does not mean that application code, provider integrations or runtime tests are complete.

The product authority remains [SPEC](reference/SPEC.md), with [architecture](../ARCHITECTURE.md), [source traceability](../TRACEABILITY.md), [child/test allocation](CHILD-TEST-MAP.md) and the [dependency manifest](dependencies.json). The latest design handoff is [BENCHMARK-DESIGN-SPEC.md](BENCHMARK-DESIGN-SPEC.md); it distinguishes rendered reference states from pending designs.

## Feature-to-owner inventory

| Feature contract | Requirements | Primary delivery owners |
|---|---|---|
| [Modes, targets and task commits](BENCHMARK-MODES.md), [Cursor](M05/08-cursor-adapter.md), [OpenCode](M05/09-opencode-adapter.md) | R177–R183 | M01/M16 authoring and identity; M03/M04 readiness/catalog; M05/M07/M08/M09/M11 execution and checks; retained/client/exchange consumers |
| [Context monitoring](CONTEXT-MONITORING.md) and [decision engines](DECISION-ENGINES.md) | R161–R172 | M05 capture; M10 counts/classification/accounting; M12.4 decision runtime; M02 retention; M11/M18 lifecycle/resources; client/report/exchange consumers |
| [Measured statistics and ranking factors](BENCHMARK-STATISTICS.md) | R173–R176 | M05 observations; M10 exact metrics; M06 eligibility/ranking; M02 retention; setup/report/CLI/exchange consumers |
| [Backend](quality-judges/BACKEND.md), [mobile](quality-judges/MOBILE.md), [DevOps](quality-judges/DEVOPS.md), [agentic software](quality-judges/AGENTIC.md), [specification design](quality-judges/SPECIFICATION.md) | R184–R188 | M12 rubric/assessment; M08 evidence; M01/M16 template authoring; M06 scoring; setup/readiness/retention/client consumers |
| [Human judging](M12/05-human-review-web.md) | R189 | M12.1/.2/.5 validation/admission/form; M02 durable submission; M11 pending lifecycle; setup/scoring/report/CLI/exchange consumers |
| [Model variants](MODEL-VARIANTS.md) | R190 | M04 identity/provenance; M07 freeze; M05 effective observations; M02 retained evidence; comparison/client/exchange consumers |
| [SQLite results and analyses](RESULTS-DATABASE.md) | R191 | M11 shared transaction foundation; M02 mappings/repository/analysis sink; M06 exact scores; M17 publication; M13/M14 analysis access |
| [Cross-harness API access](CROSS-HARNESS-COMPARISON.md) and [existing launcher profiles](CROSS-HARNESS-COMPARISON.md#existing-agent-aliases-and-launcher-profiles) | R192–R194 | M04 profiles/bindings; M03 qualification; M05 isolated execution; M07 matrix/selection/freeze; M02 normalized provenance; scoring/judging/client/exchange consumers |

The child/test map lists the full allocations; primary owners above do not exclude downstream obligations. Relevant parent and child main sections must agree with their supplements. A link alone is not a substitute for specifying the consumer's concrete fields, ports, states and tests.

## Boundaries retained

- All six harnesses remain in one registry. A provider gateway or named launcher profile is a configuration choice, not another harness.
- Model configuration declarations, requested controls, runtime observations and comparison eligibility remain distinct. Unsupported or unverified paths cannot become successful comparisons through UI labels or fixtures.
- SQLite stores structured retained facts and score snapshots; canonical interchange and large evidence files retain their defined roles. Pure scoring stays separate from durable analysis retention.
- Manual authoring is independent of optional planning. Supported immutable template formats and archived benchmark inputs are separate from old-installation migration; there is no requirement to backfill an obsolete application installation.
- The private configuration used during discussion is illustrative only. No defaults, fixtures, registrations or runtime dependencies may derive from it. Examples and tests are independently fictional.
- Grading, observer, qualification and competitor accounting remain scoped. Human waiting is not competitor execution, and generic API access does not enable System One roles.

## Reproducible documentation checks

From any directory, invoke the repository paths below (these examples assume `spec/` as the working directory):

```sh
python3 implementation/validate-specs.py --require-supplement-coverage
python3 implementation/sqlite/validate-schema.py
node implementation/reference/design/wireframe-tui/src/verify.mjs
```

The first command checks the source digest/locators, graph, child allocations and local links. The second exercises the proposed SQL schema and query fixtures in disposable databases. The third checks the static prototype. None establishes runtime acceptance, visual review or installed-provider support. Feature-owned implementation tests and real integration gates remain explicitly pending until the application exists and is exercised.

## Completed contract reconciliation

Fresh sequential feature passes reviewed modes/commits/six harnesses, context and decision engines, statistics, all domain rubrics, human review, model variants, SQLite retention, and routed/existing profiles. A subsequent narrow storage pass closed the independent JudgeGroup route/automated assessment lifecycle. All 69 child contracts were inspected; inventory-only presentation/checks and raw platform collectors retained their existing scope where the added behavior belongs to their integrated shared owners.

Concrete reconciliations include versioned domain evidence schemas, exact rubric-bound weight interfaces, human pending/recovery/totals, pre-seal delivered-snapshot leases, shared capture/analysis projections, typed variant/route evidence and annotations, disjoint diagnostic/verification resource scopes, and durable automated assessment identity before a Review exists. Original/additional judges use their actual JudgeGroup configuration; failed billed work does not fabricate a Review or borrow a competitor identity.

Manual draft editing now depends on M16.3 and M15 foundations; optional planner navigation is a later integration gate. The current manifest has 70 nodes (69 children plus Bootstrap) and 316 prerequisite edges. A final dedicated subagent consolidated all pending design work into **45 groups, BD-001–BD-045**, in the latest design handoff, including existing contract-only navigation and recovery obligations. These groups describe new or updated shared surfaces against the current static prototype; every runtime/provider/platform gate remains planned.
