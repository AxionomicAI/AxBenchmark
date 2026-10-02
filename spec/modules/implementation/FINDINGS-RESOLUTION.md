# F01–F19 specification resolution ledger

Reconciled: 2026-10-02. The [historical review](../../recommendations.md) records defects in the baseline specification, not observed production failures. It remains unchanged. This ledger records the final normative destinations and the acceptance work still required. [SPEC.md](../../SPEC.md) remains the product authority; [source-unit coverage](../TRACEABILITY.md) and the [child/test map](CHILD-TEST-MAP.md) supply the complete requirement allocation.

**Status meaning:** “Specified” means the correction has an explicit contract in the linked sources. “Prototype statically checked” means generated illustrative states and their source bindings were checked, not that an API, calculation, process or Textual interaction ran. Every runtime gate below is **PLANNED / pending**. No finding is labelled as a production bug fixed or a future test passed.

The current [screen/state ownership ledger](../../design/wireframe-tui/ownership-ledger.md) inventories 170 named states / 206 size variants; the static verifier covers 443 focus frames. It also separates contract-only future states from rendered artboards. Browser visual inspection in this reconciliation was limited to one Chrome screenshot, with other tool attempts failing; it is not a full visual sweep or Textual test. The review's older 159/187 inventory and 16-image inspection describe its historical baseline only.

## F01 — One canonical template definition

**Status: specified; runtime pending.** [M01.1 canonical ownership](M01/01-canonical-definition.md#ownership-and-contracts) defines the versioned metadata writer, reference closure and canonical bytes. [M09.1 package conversion](M09/01-inventory-package.md#concrete-contract) and [M16.3 draft conversion](M16/03-draft-approval.md#draft-and-canonical-contracts) use it; [M17.1](M17/01-archive-contract.md#concrete-interfaces) validates that representation. This implements R115/R118–R120/R141 without introducing a second template identity.

**Acceptance gate:** [M01.1](CHILD-TEST-MAP.md#m01-1), M09.1, M16.3 and M17.1–2 must prove equal defining bytes/digests for equivalent built-in, planned and imported templates, rename stability, task/protocol sensitivity and macOS/Linux ZIP round trips. Descriptor fixtures alone cannot close the producer/parser/restoration integrations. [TemplateIdentity](../../design/wireframe-tui/preview/TemplateIdentity.dc.html) illustrates the identity display; it does not compute a digest.

## F02 — Portable run identity

**Status: specified; runtime pending.** The added [SPEC §2 paragraph](../../SPEC.md#templates-and-run-configurations), R159, distinguishes immutable RunUid from display RunLabel. [Shared identity](../ARCHITECTURE.md#shared-identity-and-addressing), [M02.1 bindings](M02/01-retained-records.md#ownership-and-interfaces), [M11.3 launch binding](M11/03-run-scheduler.md#launch-identity-and-durable-binding), [M06.1 subjects](M06/01-scoring-service.md#interfaces-and-invariants) and [M17.1 portable bindings](M17/01-archive-contract.md#concrete-interfaces) preserve this distinction. Existing CLI units R049/R051/R052/R058/R060 now use RUN_REF with explicit ambiguity refusal.

**Acceptance gate:** [M02.1–2](CHILD-TEST-MAP.md#m02-1), M06.1, M11.3, M14.2 and M17.2 must import equal-label/equal-configuration runs from different machines and preserve separate trials, means, report scopes and exports. Conflicting UID bindings fail and identical reimports are idempotent. [ResultsTrials](../../design/wireframe-tui/preview/ResultsTrials.dc.html) and [ResultPackage](../../design/wireframe-tui/preview/ResultPackage.dc.html) are examples; actual ambiguity and scoped navigation remain runtime cases.

## F03 — Retention before sealing

**Status: specified; runtime pending.** [Finalization architecture](../ARCHITECTURE.md#finalization-and-immutable-retention), [M10.2 awaited barrier](M10/02-final-accounting.md#awaited-barrier-and-recovery), [M18.2 close receipts](M18/02-sampling-lifecycle.md#close-finalization-and-recovery), [M02.2 retention](M02/02-retention-services.md#ownership-and-interfaces) and [M11.4 terminal barrier](M11/04-stop-recovery-invalidation.md#one-terminal-barrier) require durable accounting/telemetry handoffs before immutable seals. Original judging settlement precedes the completion report. R078–R081/R114/R134/R147/R155 cover the amended product obligations.

**Acceptance gate:** [M10.2](CHILD-TEST-MAP.md#m10-2) and M11.4 must delay producer acknowledgements, close sequential energy, stop/interruption and restart at each durable boundary. Real M02/M08/M10/M11/M12/M18 stores and services must agree with immediate M13 reports/M17 imports; no post-seal append or false completion is permitted. Finalization/retention-pending/error and report dispositions are explicitly [contract-only future UI states](../../design/wireframe-tui/ownership-ledger.md#contract-only-future-acceptance-states), not demonstrated transitions.

## F04 — Lossless snapshot and cursor handoff

**Status: specified; runtime pending.** [The shared handoff](../ARCHITECTURE.md#subscription-handoff-and-replay), [M11.2 cursor/registry contract](M11/02-events-jobs-lifecycle.md#cursor-snapshots-and-exact-registries) and [M15.2 subscription hub](M15/02-tui-shell.md#client-subscriptions-and-load-generations) specify watermark capture, queued replay, idempotent object revisions and full epoch/sequence cursors. R046/R139/R150 retain ownership of client-independent execution and reconnection.

**Acceptance gate:** [M11.2](CHILD-TEST-MAP.md#m11-2) injects an event between topic snapshots, restart to a lower sequence, compaction and slow-client overflow. M15.2 must consume the real client/bus protocol without dropping updates or restoring stale state. Feature clients then repeat their owner-specific races. [RunReattached](../../design/wireframe-tui/preview/RunReattached.dc.html) is an illustrative observation state; event ordering is not visible proof.

## F05 — Published event and topic names

**Status: specified; runtime pending.** [M11.2 exact registries](M11/02-events-jobs-lifecycle.md#cursor-snapshots-and-exact-registries) distinguishes event names from subscription topics. [M10.1 accounting handoffs](M10/01-task-accounting.md#interfaces-and-invariants) and [M16.2 planning publication](M16/02-planning-jobs.md#persistence-cancellation-and-event-handoff) use the shared contract; [M16.4](M16/04-planner-screens.md#progress-reconnect-and-state-preservation) observes `planning` plus the exact `job:<id>` topic. R031/R034/R079/R150 remain the source obligations.

**Acceptance gate:** [M11.2](CHILD-TEST-MAP.md#m11-2), M10.1–2 and M16.2/4 reject stale `runs.*` and bare `job` registrations, then prove real durable phase handoffs and planning success/failure with registered events. Timing/retention correctness requires the awaited producer path as well as presentation subscriptions. [PlanningProgress](../../design/wireframe-tui/preview/PlanningProgress.dc.html) is statically bound to the corrected topics; no live update is claimed.

## F06 — Trial scope across facts and evidence

**Status: specified; runtime pending.** [Shared TrialRef](../ARCHITECTURE.md#shared-identity-and-addressing), [M08.1 scoped verification](M08/01-verification-runtime.md#ownership-and-interfaces), [M10.1 task accounting](M10/01-task-accounting.md#interfaces-and-invariants) and [M05.7 historical views](M05/07-adapter-views-integration.md#exact-ui-boundary) require explicit retained result/trial scope. R076–R078/R134/R154 cover distinct facts, paths and summaries; genuinely live views alone may default to an active trial.

**Acceptance gate:** [M08.1–3](CHILD-TEST-MAP.md#m08-1), M05.7, M10.2–3 and M17.2 must retain different T1 outcomes/logs/screenshots for two trials, inspect trial 1 while trial 2 runs, then export/import without collisions or late-response replacement. [MeasurementsTrials](../../design/wireframe-tui/preview/MeasurementsTrials.dc.html) and [ResultsTrials](../../design/wireframe-tui/preview/ResultsTrials.dc.html) illustrate selection; their real navigation and stores remain pending.

## F07 — Frozen currency and exact presentation

**Status: specified; runtime pending.** [Accounting ownership](../ARCHITECTURE.md#accounting-and-presentation-ownership), [M07.2 launch freezing](M07/02-launch-preparation.md#ownership-and-interfaces), [M10.2 projections](M10/02-final-accounting.md#interfaces-and-invariants) and [M06.1 ranking contracts](M06/01-scoring-service.md#interfaces-and-invariants) keep exact USD calculation values separate from prepared display money and rate/billing provenance. Alternative tariff/weights do not change the frozen display currency (R081/R155–R157).

**Acceptance gate:** [M06.1–2](CHILD-TEST-MAP.md#m06-1), M10.2–3 and M13.2–3 must agree on COP, EUR, missing-rate and mixed-display USD fallback cases, preserving order and exact scoring values. Real launch/retention/import paths must retain declared-billing labels; screens perform no conversions. [CurrencyEnergy](../../design/wireframe-tui/preview/CurrencyEnergy.dc.html) and [Rankings](../../design/wireframe-tui/preview/Rankings.dc.html) provide static examples, not arithmetic verification.

## F08 — Unverified numeric zero

**Status: specified; runtime pending.** R160 is the explicitly labelled new policy in [SPEC §6](../../SPEC.md#editable-weights); it does not relabel the older verified-zero requirement R101. [M10.1](M10/01-task-accounting.md#interfaces-and-invariants) and [M10.2](M10/02-final-accounting.md#interfaces-and-invariants) preserve reported/estimated values and unknown billing limitations. [M06.1](M06/01-scoring-service.md#interfaces-and-invariants) excludes numeric zero without verified-zero status from lowest-cost and positive-cost-weight rankings using `cost_zero_unverified`; zero cost weight can retain eligibility under the other gates.

**Acceptance gate:** [M06.1](CHILD-TEST-MAP.md#m06-1), M10.1–2 and [M13.2 exact vectors](M13/02-browser-analysis.md#acceptance-and-exact-vectors) must cover zero price, zero energy, positive unknown-billing cost, verified zero and positive costs. Python and actual offline JavaScript must produce finite equal results and reasons; unverified zero never enters a denominator. Presentation/error variants remain [runtime acceptance states](../../design/wireframe-tui/ownership-ledger.md#contract-only-future-acceptance-states).

## F09 — Run-wide identity invalidation

**Status: specified; runtime pending.** Amended R153 and [the invalidation architecture](../ARCHITECTURE.md#identity-invalidation-after-launch) route every detected mismatch through [M11.4](M11/04-stop-recovery-invalidation.md#stop-invalidation-and-recovery). [M08.1](M08/01-verification-runtime.md#ownership-and-interfaces) and [M12.2](M12/02-judging-worker.md#worker-and-persistence) propagate identity failures; [M02.1](M02/01-retained-records.md#ownership-and-interfaces) keeps the overlay append-only and original sealed facts intact.

**Acceptance gate:** [M11.4](CHILD-TEST-MAP.md#m11-4) plus real verification/judging/storage must detect mutations during T7, final regression and post-seal judging, record both digests/paths once, cancel work, clean up and exclude every run result. M06/M13/M17 must preserve/expose invalidation after exchange and guard publication races. [RunHalted](../../design/wireframe-tui/preview/RunHalted.dc.html) and [ResultsHalted](../../design/wireframe-tui/preview/ResultsHalted.dc.html) illustrate the outcome only.

## F10 — Executable baseline intent

**Status: specified; runtime pending.** R068/R119/R140 and [M01.1 canonical metadata](M01/01-canonical-definition.md#ownership-and-contracts) distinguish hashed executable intent from storage permissions. [M16.1 capture](M16/01-repository-capture.md#interfaces-and-bytes), [M01.2 storage](M01/02-revision-storage.md#ownership-and-contracts), [M05.2 restoration](M05/02-isolation-observation.md#ownership-and-interfaces) and [M17.1 archive modes](M17/01-archive-contract.md#boundary-and-failure-rules) preserve that distinction for competitors and disposable verification.

**Acceptance gate:** [M16.1](CHILD-TEST-MAP.md#m16-1), M01.2, M05.2, M08.1–2 and M17.2 must carry a regular/executable pair with identical bytes through capture, read-only storage and local/imported workspaces on macOS/Linux. Actual execution and source-preservation checks are required; ZIP permission fixtures alone are insufficient. The identity/storage cases are contract requirements, not a separately rendered executable-mode demonstration.

## F11 — Fair inventory observations

**Status: specified; prototype statically checked; runtime pending.** Amended R073/R144 and [M09.1's versioned catalog](M09/01-inventory-package.md#concrete-contract) allocate 30 check rows. [M09.2](M09/02-inventory-repository-checks.md#concrete-checks-and-interfaces) defines per-task commit/runtime observations; [M09.3](M09/03-inventory-behavior-checks.md#concrete-catalog) defines data/behavior/QA observations without an imposed DOM/storage schema. [M09.4](M09/04-inventory-screens.md#concrete-presentation-contract) presents the exact suite and phases.

**Acceptance gate:** [M09.2–3](CHILD-TEST-MAP.md#m09-2) must run through real M08/Git/browser adapters against two materially different conforming implementations and documented defects. T2 data without T3 UI passes; missing required commits fail, unavailable history remains unverified. The statically checked [InventoryChecks](../../design/wireframe-tui/preview/InventoryChecks.dc.html), [CheckT2WithoutUI](../../design/wireframe-tui/preview/CheckT2WithoutUI.dc.html), [CheckMissingCommit](../../design/wireframe-tui/preview/CheckMissingCommit.dc.html) and [CheckHistoryUnavailable](../../design/wireframe-tui/preview/CheckHistoryUnavailable.dc.html) show classifications, not executed observations.

## F12 — Counter reset, wrap and overlapping sources

**Status: specified; runtime pending.** R112/R113/R147 now require continuity/reset evidence and plausible bounds, with duplicate-source selection before overlap exclusion. [M18.1 contracts and vectors](M18/01-telemetry-domain.md#contracts-and-rules), [M18.3 macOS evidence](M18/03-macos-collectors.md#collector-and-documentation-contracts) and [M18.4 Linux evidence](M18/04-linux-collectors.md#concrete-adapter-and-evidence-contracts) reject fabricated energy on ambiguous decreases or gaps.

**Acceptance gate:** [M18.1](CHILD-TEST-MAP.md#m18-1) separates true wrap, known-range reset, unknown-range reset, gaps and duplicate devices with exact vectors. M18.3–4 must separately verify supported-host counter semantics, units and intervals; recorded NVIDIA/AMD output is parser evidence only. M18.2/M10.2 must retain coverage before sealing. [EnergyDetail](../../design/wireframe-tui/preview/EnergyDetail.dc.html) illustrates source/coverage evidence; no sensor support is certified.

## F13 — Stop during judging

**Status: specified; runtime pending.** [M11.4 stop gates](M11/04-stop-recovery-invalidation.md#stop-invalidation-and-recovery), [M12.2 batch settlement](M12/02-judging-worker.md#exact-lifecycle-interfaces), [M11.5 actions](M11/05-run-screens.md#data-navigation-and-command-boundaries) and [M14.2](M14/02-curated-cli-flows.md#public-and-internal-interfaces) distinguish a stoppable active run from a completed configuration. Original run judging and independent rejudge cancellation use separate lifecycle scopes (R046/R047/R139).

**Acceptance gate:** [M11.4–5](CHILD-TEST-MAP.md#m11-4), M12.2–3 and M14.2 must stop real judge work from both clients, preserve completed reviews, settle remaining originals, retain costs and end report waits with explicit dispositions. Include finalizing/retention-pending races and engine loss. [StopConfirm](../../design/wireframe-tui/preview/StopConfirm.dc.html) and [Judging](../../design/wireframe-tui/preview/Judging.dc.html) are examples; the full action-state matrix remains runtime acceptance.

## F14 — Atomic import visibility

**Status: specified; runtime pending.** [Shared publication architecture](../ARCHITECTURE.md#atomic-publication-across-repositories), [M17.2 publication/recovery](M17/02-exchange-transactions.md#shared-publication-and-recovery), [M01.2](M01/02-revision-storage.md#ownership-and-contracts) and [M02.2](M02/02-retention-services.md#ownership-and-interfaces) keep staged template/result registrations invisible until one shared commit boundary. R117/R142 prohibit partial imports, including concurrent access and recovery.

**Acceptance gate:** [M17.2](CHILD-TEST-MAP.md#m17-2) faults every prepare/registration/publication stage with real repositories and concurrent list/launch/export/delete clients. Readers observe the prior state or the complete import; rollback touches only transaction-created records, committed retry remains idempotent and export leases close. [ImportIncomplete](../../design/wireframe-tui/preview/ImportIncomplete.dc.html) and [ResultEmbedded](../../design/wireframe-tui/preview/ResultEmbedded.dc.html) do not establish atomicity.

## F15 — Executable foundations and an acyclic schedule

**Status: specified; dependency graph checked; runtime pending.** [Bootstrap](BOOTSTRAP.md) publishes owner contracts and fixtures before consumers. [The development sequence](../DEVELOPMENT-SEQUENCE.md#recommended-order) and [dependencies.json](dependencies.json) place M11.1–2 and M15.1–2 ahead of feature API/screens, distinguish completed prerequisites from published contracts and later integration gates, and retain feature-screen ownership. R150 underlies the headless/client boundary.

**Acceptance gate:** the checked graph contains Bootstrap plus all 65 children without cycles. [M11.1–2](CHILD-TEST-MAP.md#m11-1) must still run real dispatcher/socket/job/event tests with injected features; [M15.1–2](CHILD-TEST-MAP.md#m15-1) must run the shared widget/client/shell harness. Early M01/M03 children must consume those checked-in foundations without private clients/widgets. Static graph validity is documentation evidence; no executable foundation has passed by virtue of this ledger. No dedicated product artboard applies.

## F16 — Separate account billing and model edits

**Status: specified; prototype statically checked; runtime pending.** [M04.1 billing resolution](M04/01-catalog-resolution.md#ownership-and-interfaces) and [M04.4 screen contracts](M04/04-catalog-screens.md#ownership-and-interfaces) keep `catalog.save_account_override` account-scoped and `catalog.save_override` model-scoped (R157). [CatalogBilling](../../design/wireframe-tui/preview/CatalogBilling.dc.html) has a separate Save; [CatalogOverride](../../design/wireframe-tui/preview/CatalogOverride.dc.html) contains no billing mutation. [CatalogRates](../../design/wireframe-tui/preview/CatalogRates.dc.html) is the existing RatesScreen board, not a missing artboard.

**Acceptance gate:** [M04.1/4](CHILD-TEST-MAP.md#m04-4) must test Value/Unknown/Inherit, declared labels, typed errors, cancel call counts and account isolation with real catalog services. Both models on account A change together; account B and independent model efforts/prices remain unchanged. M07/M10/M02/M17 must preserve billing provenance through frozen results and exchange. Static separation of controls does not prove these commands execute once.

## F17 — Deletion, selected task and coverage maintenance

**Status: specified; prototype statically checked; runtime pending.** [M01.3 deletion](M01/03-library-service.md#ownership-and-contracts) and [M01.4](M01/04-library-screens.md#wireframestate-coverage) define fresh deletion-plan confirmation and built-in/active/results refusal. Library and palette actions distinguish draft discard from revision deletion. [M16.5 selected-task contract](M16/05-draft-editor-screens.md#selected-task-and-edit-contracts) derives snapshot labels from the selection. R156/R157 now have explicit owner/child citations and [160-unit traceability](../TRACEABILITY.md); the [ownership ledger](../../design/wireframe-tui/ownership-ledger.md) makes state/API ownership discoverable.

**Acceptance gate:** [M01.3–4](CHILD-TEST-MAP.md#m01-4) must prove cancellation emits no delete, refusal/stale-plan/race behavior and both row types; M15 palette follows returned capabilities. M16.5 must change selected tasks through real Pilot/editor flows. [RevisionDeleteConfirm](../../design/wireframe-tui/preview/RevisionDeleteConfirm.dc.html), [RevisionDeleteChanged](../../design/wireframe-tui/preview/RevisionDeleteChanged.dc.html), [PlanReview](../../design/wireframe-tui/preview/PlanReview.dc.html) and [PlanReopened](../../design/wireframe-tui/preview/PlanReopened.dc.html) are statically reconciled, including T4 labels. Documentation coverage checks do not pass those UI races.

## F18 — One typed error envelope

**Status: specified; runtime pending.** [Architecture error envelope](../ARCHITECTURE.md#error-envelope), [Bootstrap publication](BOOTSTRAP.md#m11-client-and-registry-publication) and [M11.1 client contract](M11/01-engine-client-api.md#interfaces-and-invariants) distinguish numeric JSON-RPC transport `code` from stable application `data.code`, fields and remedies. [M14.1](M14/01-registry-cli.md#public-and-internal-interfaces) and [M15.2](M15/02-tui-shell.md#client-subscriptions-and-load-generations) consume decoded typed errors rather than parsing prose.

**Acceptance gate:** [M11.1](CHILD-TEST-MAP.md#m11-1), M14.1–2 and M15.2 must round-trip protocol and application errors through actual socket and in-process transports, preserving message/field/remedy behavior and appropriate CLI exits. Each feature's typed error paths remain its child acceptance responsibility. [LibraryError](../../design/wireframe-tui/preview/LibraryError.dc.html) illustrates an error view; transport parity has no dedicated rendered proof.

## F19 — Currency units per USD

**Status: specified; prototype statically checked; runtime pending.** R156 and [SPEC §4](../../SPEC.md#4-models-and-configuration) explicitly define positive currency units per 1 USD. [M04.1 rate rules](M04/01-catalog-resolution.md#ownership-and-interfaces), [M04.3 persistence/source contract](M04/03-price-rate-sources.md#ownership-and-interfaces), [M04.4 editor](M04/04-catalog-screens.md#acceptance-and-faults) and [M10.1 conversion](M10/01-task-accounting.md#interfaces-and-invariants) share this direction. [CatalogRates](../../design/wireframe-tui/preview/CatalogRates.dc.html) and its [compact counterpart](../../design/wireframe-tui/preview/CatalogRates-80x24.dc.html) edit COP `4000`; any reciprocal explanation is read-only.

**Acceptance gate:** [M04.3–4](CHILD-TEST-MAP.md#m04-3), M07.2, M10.1–2, M02.2 and M17.2 must save/reopen/freeze/export/import COP 4000 per USD and convert 4000 COP to 1 USD and back. Repeat EUR, USD identity and missing-rate cases; no client guesses or silently inverts a value. Current source availability/parser support requires the separate real-source evidence gate, not a passing recorded-response fixture.
