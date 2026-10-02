# Specification review and implementation recommendations

Reviewed: 2026-10-02. Baseline: `497158871342b4e1aab2a2fc1b86c22df9224d15` (`Apply resolved open questions to spec, modules and wireframes`). The working tree was clean when the review began. References and line numbers below refer to that baseline.

Audience: the engineer or coding agent preparing implementation work. Use this document to reconcile the contracts, create the proposed child implementation specs, and choose a bounded next coding task.

## 1. Diagnostic

**The module specifications broadly cover the general specification, but are not yet consistent enough to implement independently without making conflicting choices.** The latest product decisions have reached most behavioral sections and wireframes. The remaining problems concentrate in shared identity, retention/finalization, subscriptions, repeated-trial addressing, accounting, and a few screen-to-API mappings.

**The wireframes broadly represent the intended workflows. They do not establish full compliance.** Their generated terminal grids agree with their source, but the exchange-rate editor uses the inverse units of its API, some screen contracts disagree with the displayed controls, and the billing editor and revision-deletion flow need reconciliation. Rendering a prototype also does not verify the future Textual keyboard, mouse, resize, or lifecycle behavior.

**Recommend splitting all 18 parent module specs into linked child implementation specs for reliable GPT-6.1 Sol medium work.** Keep the existing module ownership and numbering. These are substantial subsystem contracts, often covering domain logic, storage, adapters, APIs, screens, and several levels of tests. None is a prudent whole-file commitment for one independently tested session under the agreed definition. This is a delivery recommendation, not a claim that the model is incapable of implementing a whole module in a sufficiently long session.

The first corrections to make are [the inverted exchange-rate editor](#f19), [measurement retention before sealing](#f03), [portable run identity](#f02), [one canonical template descriptor](#f01), and [lossless subscription snapshots](#f04). The findings below identify the affected owners and a verification condition for each correction.

### Review basis and limits

- Reviewed the general requirements, all 18 modules' behavior and implementation contracts, architecture, development sequence, traceability, three decision rounds, navigation, and wireframe sources/previews. The latest commit was compared with its predecessor to identify changed obligations.
- `SPEC.md` remains the documented product authority. Recorded answers explain intent; existing answers are not reopened below. Where implementation text contradicts the settled behavior, correct the implementation text and affected examples.
- The traceability ledger contains **158 unique requirement IDs**. Its source digest matches the current `SPEC.md`: `c7108ddd3f5b8517bc90cad2e8a9b93f897a2c2069c59b8bc696c6d6628bf01f`. This verifies the snapshot, not semantic satisfaction. `R156` and `R157` have owners in the ledger but no explicit citations in the numbered modules; their behaviors are nevertheless described.
- The source catalog contains **159 artboards / 187 size variants**, including **29 compact variants**. All declared terminal render/focus variants rendered without detected grid-boundary writes, table-width errors, or footer overflow. All **183 terminal variants** matched the first-focus text of their committed generated previews. Four special design/report variants are outside that terminal-text comparison. `NavMap` intentionally becomes `Main.dc.html`; it is not a missing board.
- Visually inspected 16 representative rendered variants: Setup wide; ReviewLaunch compact; CurrencyEnergy wide; RankingsProfileDefaults compact; PlanReview wide/compact; EvidenceViewer compact; RunHalted wide; Judging compact; LibraryDrafts wide; Library compact; TrialBudgetWarning wide; CatalogOverride wide; CatalogRates wide; ResultsTrials wide; ReportPage wide. Appendix A inventories all boards checked structurally.
- This is a specification review. It does not claim the engine, Textual screens, harness integrations, collector integrations, or proposed acceptance tests exist or pass. Live provider price scraping, installed harness switches, and real macOS/Linux collectors were not certified by this review.

### General-spec coverage

“Covered” here means the behavior has a module owner and an articulated contract. Findings identify why that is not yet an implementation sign-off.

| General-spec area | Coverage and remaining gap |
|---|---|
| §1 scope and headless architecture | M03/M05/M11/M14/M15 cover platforms, harnesses, and interchangeable clients. Extract foundations before following the numbered order (F15). |
| §2 library, default benchmark, planning | M01/M07/M09/M16 cover revisions, saved setup, upgrades, drafts and planner-free reuse. Canonical payload, executable baseline metadata and acceptance-check boundaries need fixes (F01, F10, F11). |
| §3 execution, TUI and CLI | M05/M11/M14/M15 cover concurrent queues, sequential mode, passive live view and detach/stop. Subscription delivery and judging-stop contracts need reconciliation (F04, F05, F13). |
| §4 catalog and configuration | M03/M04/M07 cover supported/unknown effort, overrides, prices, rates and billing provenance. The billing editor differs from the API design (F16); currency propagation is incomplete (F07), and the rate editor reverses the API units (F19). |
| §5 methodology and measurements | M05/M08/M10/M11 cover fresh conversations, isolation, evidence and trials. Finalization, trial addressing, identity invalidation and accounting edge cases remain problematic (F03, F06, F08, F09). |
| §6 quality and rankings | M06/M12 specify independent judges, strict grades, two weight sets, judge groups, partial-data exclusions and all-trial eligibility. Portable grouping and zero-estimate handling need fixes (F02, F08). |
| §7 hardware | M03/M10/M18 specify optional collectors, scope, intervals, coverage and sequential energy estimates. Counter resets must not automatically become wraps (F12); final energy must be retained before sealing (F03). |
| §8 exchange and identity | M01/M02/M17 cover bounded validation, matching hashes, provenance, conflicts and idempotency. Canonical format, portable run identity and atomic visibility need fixes (F01, F02, F14). |
| §9 reports and acceptance | M02/M06/M13 define offline HTML, embedded evidence, charts, raw grades and alternative weights. Report correctness depends on the upstream retention, grouping and currency fixes; Python/JavaScript conformance must include them. |

### Per-module verdict

**Aligned**: no direct product contradiction identified in the reviewed contract; shared dependencies still apply. **Partial**: a concrete inconsistency or missing implementation contract is identified. **Blocked**: resolve the listed finding before implementing the affected core. Wireframe “aligned” does not mean a functional UI test passed.

| Module | General-spec satisfaction | Wireframe alignment | Implementation readiness / main findings |
|---|---|---|---|
| [M01 Library/identity](modules/01-template-library-identity.md) | Partial | Partial: deletion absent from binding legend | Blocked: F01, F10; reconcile F17 |
| [M02 Retained results](modules/02-retained-results-comparability.md) | Partial | Broadly aligned, including trial/halted views | Blocked: F02, F03, F14 |
| [M03 Readiness](modules/03-environment-readiness.md) | Aligned | Aligned: absent/unknown/auth/offline/collector states | Ready for bounded work after shared foundations and provider interfaces |
| [M04 Catalog](modules/04-model-catalog.md) | Broadly aligned | Partial: mixed billing scope and inverse rate units | Resolve F16/F19; consume F08's accounting rule |
| [M05 Harness execution](modules/05-harness-execution-isolation.md) | Broadly aligned | Aligned for invocation, policy and live-source states | Resolve baseline restoration contract F10; adapter/version fixtures required |
| [M06 Scoring](modules/06-scoring-rankings.md) | Partial | Partial: DTO/formatting cannot fully support currency rule | Blocked: F02, F07, F08 |
| [M07 Configuration](modules/07-run-configuration.md) | Partial | Broadly aligned: launch totals and warning present | Resolve F07's stale currency paragraph; retain settled R158 behavior |
| [M08 Verification](modules/08-verification-evidence.md) | Partial | Broadly aligned: final evidence and viewer present | Blocked for multi-trial retention: F06; integrate F09/F11 |
| [M09 Inventory template](modules/09-default-inventory-benchmark.md) | Partial | Partial: displayed check coverage overstates specified checks | Blocked: F01, F11 |
| [M10 Measurements](modules/10-measurements-cost.md) | Partial | Broadly aligned: trials, coverage and tariff views present | Blocked: F03, F05–F08 |
| [M11 Orchestration](modules/11-run-orchestration.md) | Partial | Broadly aligned; stop capability requires correction | Blocked: F02–F06, F09, F13 |
| [M12 Judging](modules/12-quality-judging.md) | Aligned in judging behavior | Aligned: trials, invalid review and screenshot requirements | Integrate F03/F09/F13; do not merge judge groups |
| [M13 HTML report](modules/13-standalone-html-report.md) | Aligned in presentation requirements | Broadly aligned | Depends on F02/F03/F07/F08; extend exact-scoring conformance vectors |
| [M14 CLI](modules/14-command-line-interface.md) | Aligned in user-facing behavior | Aligned: consent, halted run and report-wait examples | Depends on corrected lifecycle/events; reconcile common error envelope F18 |
| [M15 TUI infrastructure](modules/15-terminal-interface.md) | Broadly aligned | Broadly aligned, including RunListDetail compact layout | Resolve subscription cursor contract F04; move foundation work earlier F15 |
| [M16 Planning](modules/16-custom-template-planning.md) | Partial in integration contracts | Partial: T4 check shown against T3 snapshot | Resolve F01/F05/F10; correct F17 |
| [M17 ZIP exchange](modules/17-zip-exchange.md) | Partial | Broadly aligned: unsafe/incomplete/mismatch/conflict paths | Blocked: F01/F02/F14 |
| [M18 Hardware](modules/18-hardware-monitoring.md) | Partial | Broadly aligned: actual intervals, scope and gaps | Resolve F03/F12; collector fixtures and platform verification required |

## 2. Prioritized findings and corrections

P1: fix before implementing the affected core; can corrupt identity, evidence, accounting, or lifecycle behavior. P2: fix before implementing the affected interface or integrating modules. P3: documentation/example correction. These are specification defects or gaps, not observed production bugs.

<a id="f01"></a>
### F01 — P1: built-in and generic templates do not share a complete canonical payload contract

**Evidence:** [M01 implementation](modules/01-template-library-identity.md#1-engine-component), lines 81–89, hashes complete payload-file bytes and reads the definition from `metadata.json`. [M09 implementation](modules/09-default-inventory-benchmark.md#1-engine-component), lines 72–85 and 129, packages/parses `template.yaml`, mixes display fields with defining fields, and says only selected fields are hashed. It provides no explicit conversion to M01's required descriptor. M16's `to_frozen`, line 89, also needs this common descriptor. Requirements: R115, R118–R120, R141.

**Consequence:** an implementation can hash display names, omit required metadata, or produce a built-in ZIP that the generic importer cannot reconstruct identically.

**Correction:** make M01 own a versioned `metadata.json` schema and canonical writer. M09 converts its authoring YAML into that payload before identity calculation; display-only authoring files remain outside the defining payload. M16 uses the same writer. Include explicit empty-baseline and task/check/service/rubric references; M17 consumes precisely this representation.

**Acceptance:** built-in, planner-produced and imported copies of one definition have identical canonical bytes/digests; a display rename preserves the digest; task-order or protocol edits change it; macOS/Linux ZIP round trips agree.

<a id="f02"></a>
### F02 — P1: local run labels are used as portable grouping keys

**Evidence:** [M11 domain](modules/11-run-orchestration.md#1-engine-component), line 86, defines `RunId` as the locally allocated date and letter suffix. [M02 `TrialGroup`](modules/02-retained-results-comparability.md#1-engine-component), line 78, and [M06 `ConfigurationSubject`](modules/06-scoring-rankings.md#1-engine-component), line 83, group by `(run_id, configuration_id)` without origin. M10's trial-summary lookup has the same key. R077, R122–R124, R154.

**Consequence:** two machines can independently produce `2026-10-02-a` with the same saved configuration ID. Importing both can merge their trials or make run lookup/export ambiguous. Global result IDs alone do not make the grouping key global.

**Correction:** add an immutable globally unique run UID; retain the date/suffix as the human label. Use `(run_uid, configuration_id, trial_index)` for facts and grouping, carry it through ZIPs/DTOs, and use UID-based resolution internally. Local commands may accept an unambiguous local label; imported collisions must expose origin and UID rather than pick a run silently.

**Acceptance:** import two machines' same-label/same-configuration runs; keep distinct subjects, means, result sets, report scopes and exports. Reimport remains idempotent.

<a id="f03"></a>
### F03 — P1: measurements lack an explicit retention handoff before results are sealed

**Evidence:** [M02](modules/02-retained-results-comparability.md#1-engine-component), lines 74, 135–136 and 151, allows measurement appends only before sealing. [M11 `SuperviseRun`](modules/11-run-orchestration.md#1-engine-component), line 192, closes telemetry, seals results, judges, and then ends the run. [M10](modules/10-measurements-cost.md#1-engine-component), lines 144–149, writes its own measurement store and prices energy only on `state: ended`; its interfaces do not specify who calls M02's `append_measurements`. R078–R081, R114, R134, R147, R155.

**Consequence:** final energy cost arrives after the immutable result boundary, and asynchronous task/check handlers may not have finished before sealing or completion reporting. A local view reading M10's store could disagree with a ZIP or report reading retained facts.

**Correction:** define and await an M10 `finalize_run` application operation. M11 first finishes checks, drains measurement work, closes M18, computes and appends every trial's final measurements/energy/billing/rate evidence through M02, then seals. Judge reviews remain appendable afterward; report generation begins after those reviews finish. Apply an equivalent partial-data finalization barrier to stop/interruption paths.

**Acceptance:** delay usage/check handlers, complete a sequential local-energy run, and immediately export/report. Retained records, live queries and imported results must agree; no measurement append occurs after seal.

<a id="f04"></a>
### F04 — P1: subscription snapshots can lose events, and the client omits the epoch cursor

**Evidence:** [M11 `Subscribe`](modules/11-run-orchestration.md#1-engine-component), line 202, queues first, takes snapshots, then returns the *current* sequence and delivers later events. Its wire request includes `epoch` at line 293, but `EngineClient.subscribe`, line 224, exposes only `since_seq`; [M15](modules/15-terminal-interface.md#1-engine-component) tracks/resumes sequence numbers without an explicit epoch reset. R046, R139, R150.

**Consequence:** snapshot A can be read at sequence 10, event 11 can update A while snapshot B is read, and returning watermark 11 discards the update missing from snapshot A. After restart, a sequence from the old epoch can also suppress valid new events unless the client contract handles it.

**Correction:** under the event/state synchronization boundary, register the subscription and capture watermark S; snapshot after S and replay all queued events greater than S in order. Make replay of snapshot-covered events idempotent and prevent older object revisions from replacing newer snapshot data. Use this single handoff algorithm across topic providers. Use a typed `(epoch, seq)` cursor end to end; clear old deduplication state on fresh-epoch snapshots and resync notifications.

**Acceptance:** inject an event between two topic snapshots; no update is lost. Restart with a lower sequence number; the client replaces state and accepts new events. Also test compaction and queue overflow.

<a id="f05"></a>
### F05 — P1: two subscribers use names the event contract does not publish

**Evidence:** [Architecture API shape](modules/ARCHITECTURE.md#api-shape) explicitly uses singular `run.*` events. [M10 `event_wiring.py`](modules/10-measurements-cost.md#1-engine-component), line 167, subscribes to `runs.*`. [M16 PlanningProgress subscriptions](modules/16-custom-template-planning.md#4-screens), line 327, subscribes to bare `job`; [M11 topic contract](modules/11-run-orchestration.md#2-api-surface-runs-events-jobs-engine), lines 320–326, defines `jobs` and `job:<id>`. R034, R031, R079, R150.

**Correction:** M10 consumes `run.phase.started`, `run.phase.finished` and `run.state.changed`. M16 subscribes to `planning` plus its `job:<id>` topic. Generate/validate publisher names, topic names and consumers from a shared registry; do not conflate event prefixes with topic names.

**Acceptance:** reject the stale names in a contract test; real registered events update timing/energy and advance planning to success/failure without polling or private state access.

<a id="f06"></a>
### F06 — P1: repeated-trial addressing is not propagated through all evidence/measurement ports

**Evidence:** M05's `TaskScope` and M08's `TaskVerifier` correctly carry `trial_index`. However, [M08 `EvidenceFiles.task_dir`](modules/08-verification-evidence.md#1-engine-component), line 100, takes only run/configuration/task/phase, while its storage layout contains `trial-<n>`. [M10 `TaskMeasurement` and `CheckSummaries.for_configuration`](modules/10-measurements-cost.md#1-engine-component), lines 79 and 126, also omit an explicit trial in the documented scope/lookup. M05 screen calls default to the current/last trial. R076–R078, R134, R154.

**Consequence:** T1 evidence/check totals from trial 2 can overwrite or be shown for trial 1 if the implementer follows those narrower signatures.

**Correction:** carry a shared `TrialRef` or globally unique `ResultId` through every stored task record, evidence-path allocator, check-summary read and historical task/log view. Only a genuinely live view may default to the active trial; a selected retained result always supplies its explicit trial.

**Acceptance:** run two trials with different T1 outcomes and logs, navigate both while trial 2 is active, then export/import. Paths, counts, screenshots and logs remain separate.

<a id="f07"></a>
### F07 — P1: frozen display currency is contradicted and absent from ranking presentation contracts

**Evidence:** [M07](modules/07-run-configuration.md#configuration-behavior), line 23, calls a later display-currency choice an analysis setting. [M10](modules/10-measurements-cost.md#cost-basis-and-currency) explicitly forbids it. [M06 `RankingView`/`MeasurementDTO`](modules/06-scoring-rankings.md#2-api-surface-scoring), lines 180–189, has no complete display-currency/conversion payload, and line 240 prescribes `$x.xx`. SPEC §5/R081 and the navigation design-system rule require the frozen currency, with mixed-run USD fallback and visible conversion provenance.

**Correction:** remove the obsolete M07 sentence about analysis-time currency. Extend M06 presentation DTOs to carry USD calculation values separately from engine-produced display amounts, currency codes, rate provenance and mixed-currency notices. Preserve declared-billing labels in those DTOs. TUI formatting uses this metadata; it must not invent a currency from `$` or perform conversions. Apply the same contract to score breakdowns and shortlists.

**Acceptance:** one COP-display run, one non-dollar display run, missing rates, and a mixed-currency comparison render correctly. USD ordering and scores stay unchanged. Results expose alternative tariff/weights, not alternative currency.

<a id="f08"></a>
### F08 — P1: accounting permits zero estimates but scoring only defines verified zero

**Evidence:** [M04 `validate_override`](modules/04-model-catalog.md#1-engine-component), line 104, accepts nonnegative prices. [M10](modules/10-measurements-cost.md#1-engine-component), lines 76 and 94–95, can therefore produce a zero API estimate or zero measured-energy estimate; these are not `VERIFIED_ZERO`. [M06](modules/06-scoring-rankings.md#1-engine-component), lines 81 and 89–90, special-cases only verified zero before dividing by cost. M10's `configuration_cost`, line 81, also specifies API/subscription/local but omits the `UNKNOWN` billing branch even though unknown billing may have a valid positive estimate. R080, R100–R101, R155.

**Correction:** explicitly preserve a valid reported/estimated aggregate for unknown billing with its limitation. For a numeric zero that is not verified zero, retain the observation but exclude it from positive-cost-weight/lowest-cost eligibility with `cost_zero_unverified`; never relabel it as a verified charge. Zero-cost-weight rankings may use it subject to other gates. Document this proposed edge-case policy in SPEC/M06/M10 and the scoring vectors. Keep the existing guarded zero-time behavior unless a separate product decision changes it.

**Acceptance:** zero price overrides, zero energy, unknown billing with positive cost, verified zero, and positive costs produce finite deterministic results. An unverified zero never becomes a verified-zero winner or a denominator.

<a id="f09"></a>
### F09 — P1: identity invalidation has no complete path from verification/judging back to run halt

**Evidence:** [M11](modules/11-run-orchestration.md#1-engine-component), lines 192–194, catches `IdentityInvalidated` from the before-task check in `ExecuteConfiguration`. M01's `RevisionReader.open` also checks identity; M08 reads the suite through it and M12 reopens the revision in `CheckJudge`. M08 classifies ordinary verification-stage failures locally. The contract does not route every later identity mismatch to `HaltForIdentity`, including after the last task or after execution results have been sealed. R067, R153.

**Correction:** define one run-scoped invalidation coordinator. Identity mismatches from M01/M05/M08/M12 propagate to it rather than become ordinary verification/judging failures. Check identity after the last task and before finalization/judging. Define an append-only run-invalidation record that removes every associated result from comparison even if its execution facts are already sealed; cancel active judge work and retain existing evidence.

**Acceptance:** mutate the template during T7, final regression, and judging. Each first detected mismatch halts the run, records both digests/paths, cleans up, and excludes every result without altering its original template binding.

<a id="f10"></a>
### F10 — P1: executable baseline semantics are captured but not carried through identity and restoration

**Evidence:** [M16 `BaselineSnapshot`](modules/16-custom-template-planning.md#1-engine-component), line 76, distinguishes regular and executable Git files, but `to_frozen`, line 89, passes payload roles/bytes without specifying how that mode survives. [M01](modules/01-template-library-identity.md#1-engine-component), lines 83–85 and 116, excludes file modes from the manifest and materializes every file as 0444. M05's baseline-copy contract does not say how executable bits are restored; M17 exports files as 0644. R068, R115, R119, R140.

**Correction:** distinguish physical read-only storage permissions from the captured executable flag. Preserve executable intent in hashed baseline metadata; copies into competitor/verification workspaces restore executable flags and appropriate writable working permissions. Keep approved storage at 0444/0555. ZIP imports reconstruct from semantic metadata, not archive permissions.

**Acceptance:** capture a repository containing an executable launcher and a regular file with identical bytes. Local and imported runs preserve their distinct execution behavior, while the approved revision stays read-only.

<a id="f11"></a>
### F11 — P1: inventory acceptance checks need a fair, explicit observation contract

**Evidence:** [Preserved T2 prompt](../benchmark/tasks/T2-data.md) asks for data/persistence; [T3](../benchmark/tasks/T3-management.md) introduces inventory viewing/management. [Wireframe checks](design/wireframe-tui/src/checks-data.mjs), lines 7–10, require products to *appear* on first load at T2. [M09](modules/09-default-inventory-benchmark.md#acceptance-criteria), line 57, requires all seven commits, while its fixed 21-check catalog explicitly names the T1 commit and T6 README update but does not specify independent commit observations for the other tasks. Display-only “also checked” statements are not an executable contract. R021–R028, R073–R076.

**Correction:** separate data-stage obligations from later UI obligations; do not fail T2 for UI that is only required at T3. Define each check's phase, observable requirement, evidence and failure classification, including per-task commit advancement. Specify the locator/observation strategy for differing generated implementations without requiring an unapproved DOM or storage schema. Reconcile the check count and wireframe coverage from the resulting versioned suite, rather than preserving 21 as an arbitrary limit.

**Acceptance:** two materially different conforming inventory implementations pass; a valid T2 data implementation without the T3 UI does not receive a false application failure; missing later commits are recorded as failed requirements, not merely unavailable metadata.

<a id="f12"></a>
### F12 — P1: known counter range is insufficient to distinguish reset from wraparound

**Evidence:** [M18 `counter_delta`](modules/18-hardware-monitoring.md#1-engine-component), line 90, treats every decrease with a known `max_range` as a wrap. Its tests at line 359 only cover resets *without* a range. SPEC §7/R112 requires both resets and wraps to be accounted for.

**Consequence:** a reset from 100 to 10 with range 1000 would be counted as 910 units of energy, even when it was not a wrap, inflating local cost/rankings.

**Correction:** include collector continuity/reset evidence, timestamps and plausible delta bounds. A decrease is a wrap only when continuity and the collector's counter semantics support it; an ambiguous decrease creates an uncovered interval. Also make source preference explicit when two collectors describe the same physical domain, before parent/subdomain overlap removal.

**Acceptance:** real wrap, reset with known range, reset without range, long gap, and duplicate observations of one device have separate fixtures. Ambiguous data remains partial, never fabricated complete energy.

<a id="f13"></a>
### F13 — P2: stop capability excludes judging even though the stop operation supports it

**Evidence:** [M11 `allowed_actions`](modules/11-run-orchestration.md#1-engine-component), line 99, enables stop for queued/preparing/running/verifying scopes. `StopRun`, line 195, explicitly supports `judging` via `RunJudging.stop`. Interfaces are required to obey those capability flags. R046–R047, R139.

**Correction:** define run-level and configuration-level stop gates separately. A run remains stoppable throughout active execution and judging; a completed configuration is not independently restarted or stopped. Make CLI/TUI status, previews and bindings agree.

**Acceptance:** stop from TUI and CLI while a judge is running; the judge process ends, remaining reviews become not-judged, the run becomes stopped and no completion-report wait hangs.

<a id="f14"></a>
### F14 — P1: embedded-template/result registration allows partial visibility

**Evidence:** [M17 two-store registration](modules/17-zip-exchange.md#1-engine-component), line 143, commits M01's template index before M02's result batch and explicitly permits a window in which readers can see the template alone. SPEC §8/R117/R142 and the architecture's command contract require no partial addition/application.

**Correction:** keep the import transaction invisible until both registrations commit. Use a transaction-aware visibility marker/publication boundary across the two repositories; recovery rolls forward or rolls back before readers are admitted. Prevent launch/export/delete of a staged revision. Record exactly which revision/result registrations the transaction created so rollback cannot remove pre-existing data.

**Acceptance:** pause or crash after every registration stage while another client lists, launches and exports. It sees the pre-import state or the complete imported collection, never an actionable half-import. Failure and retry preserve prior records and idempotency.

<a id="f15"></a>
### F15 — P2: numbered delivery order omits executable foundations required by early modules

**Evidence:** [Development sequence](modules/DEVELOPMENT-SEQUENCE.md#recommended-order) places M11 at step 11 and M15 at step 15. Early modules require `InProcessClient`, registry/jobs/events, shared screen bases/widgets and fake-client screen tests in their own completion criteria. The sequence says to establish shared contracts first but does not identify the runnable foundation slices. R150 and module headless-verification sections.

**Correction:** extract M11.1–M11.2 and M15.1–M15.2 below before feature screens/API tests, plus a shared-contract/bootstrap gate. Keep feature owners' screen implementations in their own child specs; M15 owns the shell and final integration, not duplicate implementations of every screen. Publish dependency edges and separate contract availability from full module completion.

**Acceptance:** an early M01/M03 slice can run its real API and fake-client screen tests using checked-in foundations, without inventing private clients or widgets. The child-spec dependency graph is acyclic.

<a id="f16"></a>
### F16 — P2: catalog billing controls do not match their API scope

**Evidence:** [CatalogOverride source](design/wireframe-tui/src/screens-readiness.mjs), lines 390–405, adds account billing to the model-entry editor and its single Save. [M04](modules/04-model-catalog.md#4-screens), lines 297 and 312–324, instead defines a separate `BillingScreen` and `catalog.save_account_override`; `catalog.save_override` has no billing field. M04 also says RatesScreen has “No artboard yet,” although `CatalogRates` exists. R157 and the one-command-per-action interface rule.

**Correction:** retain the already separated API ownership. Move billing out of the entry override artboard into an explicit BillingScreen reached with `b`; its Save issues only `save_account_override`. Keep CatalogOverride scoped to model fields. Link the existing CatalogRates board to RatesScreen and remove stale missing-artboard text. Show account-wide effect and inherited/declared/unknown states.

**Acceptance:** editing billing affects all models in the selected account only; editing one model's effort/price does not change billing. Each Save has one matching command and typed error path.

<a id="f17"></a>
### F17 — P2/P3: several navigation and example contracts are stale

- **P2, deletion:** [M01 screen bindings](modules/01-template-library-identity.md#4-screens), line 331, assigns Delete on template rows to revision deletion. [Library legend](design/wireframe-tui/src/boards.mjs), line 60, says Delete is for drafts only. Add the revision-deletion confirmation/refusal states and a context-sensitive binding/palette entry; keep built-ins, active-run revisions and revisions with results disabled. Test both row types and cancellation.
- **P3, selected task:** [PlanReview source](design/wireframe-tui/src/screens-planning.mjs), lines 176–186, displays T4's checks but says they run against the T3 snapshot. Correct it to T4 and derive the label from the selected task; verify PlanReview and PlanReopened.
- **P3, coverage maintenance:** [Traceability](modules/TRACEABILITY.md) assigns R156/R157, but module prose cites older adjacent IDs instead. Add these citations at the exchange-rate/billing contracts and acceptance checks. Add an artboard-to-screen/state ledger for new states; a missing literal artboard name alone is not a missing behavior.

<a id="f18"></a>
### F18 — P2: common error envelope descriptions disagree

**Evidence:** [Architecture API shape](modules/ARCHITECTURE.md#api-shape), line 78, describes a JSON-RPC error with a string `code`. [M11 JSON-RPC adapter](modules/11-run-orchestration.md#1-engine-component), line 213, correctly distinguishes the numeric outer `code: -32000` from the namespaced application `data.code`. Client and generated CLI authors could implement different wire shapes.

**Correction:** adopt M11's concrete envelope everywhere. Specify the numeric transport error code and stable namespaced `data.code`, with field/remedy details in `data`; clients expose the namespaced value after decoding. Include both protocol-level and application-error examples in the shared API contract.

**Acceptance:** socket and in-process clients round-trip the same typed errors; CLI and TUI display the same message/field/remedy without parsing prose.

<a id="f19"></a>
### F19 — P1: the exchange-rate editor displays the reciprocal of the API's required value

**Evidence:** [M04 `RateRecord` and `save_rate_override`](modules/04-model-catalog.md#1-engine-component), lines 87 and 228, define `per_usd` as currency units per USD: COP 4,000 means 1 USD = 4,000 COP. The [CatalogRates renderer](design/wireframe-tui/src/screens-readiness.mjs), lines 426–435, labels its column “USD per unit” and edits `0.000250` USD per COP. The screen command passes the value to `catalog.save_rate_override`; no reciprocal conversion contract exists. CurrencyEnergy already shows the intended units per USD. R081, R156.

**Consequence:** implementing the editor as drawn and passing its value as specified stores 0.000250 COP/USD instead of 4,000 COP/USD. For example, converting 4,000 COP with M10's `amount / per_usd` would give 16,000,000 USD instead of 1 USD.

**Correction:** standardize the editable rate on `currency units per 1 USD` throughout the API, CatalogRates, Catalog summaries and CLI. In this fixture the editable COP value is `4000`, not `0.000250`. A reciprocal may be a clearly labelled read-only explanation. Regenerate both previews and check their units against the DTO schema.

**Acceptance:** enter 4,000 COP/USD, save/reopen/freeze/export/import it, and convert 4,000 COP to 1 USD and back. Repeat with EUR and a missing rate; no UI computes or silently guesses a reciprocal.

## 3. GPT-6.1 Sol medium sizing

### Meaning of the estimate

The agreed session target is **one agent completing implementation and relevant tests, with prerequisite implementations available and product choices already resolved**. Count every responsibility assigned to the file, including its owned UI and adapters. Context compaction is allowed; no wall-clock or token budget was specified. No estimate assumes parallel agents or a later uncounted hardening session.

Official documentation identifies `gpt-6.1-sol`, supports medium reasoning, and lists a 1,050,000-token model context window with 922,000 maximum input and 128,000 maximum output. Those are model capacities, not this workspace's effective context configuration or a tested module-completion guarantee. The docs recommend evaluation on the actual task. The judgments and child counts below are this review's engineering estimates, not OpenAI recommendations. [Official GPT-6.1 Sol model documentation](https://developers.openai.com/api/docs/models/gpt-6.1-sol)

The splitting criterion is independently reviewable behavior and verification burden, not Markdown length. The full parent can be accepted only after its child work and integration gates pass. Child counts are initial work packages, not promised billing/time estimates; a real adapter that lacks documented controls must be investigated rather than marked implemented using only a mock.

| Spec | Whole-file session decision | Proposed children | Main sizing reason | Confidence |
|---|---|---:|---|---|
| M01 | Split | 4 | Canonical identity, atomic read-only storage, revision lifecycle and many library/editor/exchange entry states | High |
| M02 | Split | 3 | Immutable result schema, evidence/import storage and comparative UI | High |
| M03 | Split | 2 | Discovery/consented verification plus multi-state readiness UI, with several external producers | Medium |
| M04 | Split | 4 | Layer resolver, harness discovery, three price sources/rates, and catalog editors | High |
| M05 | Split | 7 | Process isolation/runtime plus four independently verified harness adapters and observation UI | High |
| M06 | Split | 2 | Exact scoring/eligibility contract and interactive weights/rankings UI with parity fixtures | Medium |
| M07 | Split | 3 | Persistent editing/presets, immutable launch resolution, and setup/review flows | High |
| M08 | Split | 3 | Verification process/service lifecycle, browser/backend evidence adapters, and evidence UI | High |
| M09 | Split | 4 | Preserved template package, repository obligations, behavioral checks, and inventory screens | High |
| M10 | Split | 3 | Usage/cost normalization, final energy/trial retention, and accounting/measurement UI | High |
| M11 | Split | 5 | Daemon/client, replay/jobs, scheduler, stop/recovery, and live run UI | High |
| M12 | Split | 3 | Strict review contract, protected sequential judging lifecycle, and judging/review UI | Medium |
| M13 | Split | 4 | Safe offline artifact, JavaScript parity, interactive charts, and report job/UI lifecycle | High |
| M14 | Split | 2 | Registry-generated CLI plus curated consent/follow/report/exit semantics | Medium |
| M15 | Split | 3 | Shared widgets/shell, reconnect/navigation, and cross-module workflow acceptance | High |
| M16 | Split | 5 | Git capture, planner jobs, persistent review/approval, selection/progress UI, and content editors | High |
| M17 | Split | 3 | Bounded archive validation, transactional registration/export, and exchange UI | High |
| M18 | Split | 5 | Energy rules, shared sampling lifecycle, macOS adapters, Linux adapters, and telemetry UI/guides | High |
| **Total** | **18 parents retained** | **65** | Foundations below are included in these counts | — |

### Child-spec convention and completion rule

Proposed destination: `modules/implementation/MNN/NN-slug.md`, linked from the parent. These files are recommendations, not created by this review. Every child must name its parent requirements/finding resolutions, exact owned files, public/internal interfaces, prerequisites, wireframe states where applicable, and acceptance checks. It must state which parent requirements remain pending.

The IDs below define the child boundaries. **All children require Bootstrap**, described in §4. Dependencies name completed implementations; where a later provider would create a cycle, explicitly inject its published Protocol with fixtures, then require the real-provider integration gate before accepting the parent. A fake adapter demonstrates orchestration behavior, not support for that real harness or sensor.

| Child | Deliverable and acceptance boundary | Additional prerequisites |
|---|---|---|
| M01.1 `canonical-definition` | Shared descriptor, path validation and identity writer; golden vectors, rename stability, executable metadata and ZIP-independent hashes | F01/F10 resolved |
| M01.2 `revision-storage` | Object/revision stores, registration, restore, mode audit and crash-safe deletion; failure injection preserves other revisions | M01.1 |
| M01.3 `library-service` | Lineage/default selection, revision/draft operations and `templates.*`; no-harness and upgrade-result cases through API | M01.2, M11.1–2; M02/M07/M09/M16 ports |
| M01.4 `library-screens` | Library/template/revision screens and entry points to owning modules; wide/compact navigation, deletion and identical-revision tests | M01.3, M15.1–2; related screen contracts |
| M02.1 `retained-records` | Result/run/trial identities, immutable facts, review append and evidence schema; serialization/provenance/grouping tests | M01.1; M08/M10/M12 fact schemas |
| M02.2 `retention-services` | Files/evidence, atomic batch import, finalization handoff and `results.*`; interrupted and imported round trips | M02.1, M11.1–2; M06/M10 query ports |
| M02.3 `results-screens` | Results/trial/detail/filter/review entry points; preserved originals, halted rows and currency display | M02.2, M06.1, M10.2, M15.1–2 |
| M03.1 `readiness-service` | Machine/runtime inventory, operation gates, consent plan/verification and API; unknown/auth/offline remain distinct | M11.1–2; M01/M05/M18 probe ports |
| M03.2 `readiness-screens` | Environment/collector states and guidance actions; no-harness data workflows remain available | M03.1, M15.1–2 |
| M04.1 `catalog-resolution` | Version/account-scoped metadata, overrides, billing/rate/price value types and precedence; pure fixtures | M03 inventory schema |
| M04.2 `catalog-discovery` | Cache/persistence, first-launch/version/manual refresh and harness discovery bridge; failure preserves overrides/cache | M04.1, M03.1, M05 inspection contracts, M11.1–2 |
| M04.3 `price-rate-sources` | Anthropic/OpenAI/xAI price adapters and rate source, frozen-ready snapshots; offline recorded-response and changed-format tests | M04.1–2; verified source formats |
| M04.4 `catalog-screens` | Catalog/model picker, separate entry/billing/rate editors; each action reaches the matching API scope and uses currency units per USD | M04.2–3, M15.1–2; F16/F19 resolved |
| M05.1 `process-runtime` | Spawn/drain/timeout/cleanup ownership, role scopes and invocation persistence; no client-owned lifetime or implicit retry | M11.1–2, M01 baseline contract |
| M05.2 `isolation-observation` | Clean/current assessment, independent workspaces/resources, snapshot restoration, passive logs/diffs/rates | M05.1, M01.1–2 |
| M05.3 `claude-adapter` | Claude inspection, headless launch, supported clean controls, usage/effective settings; transcript and installed-version checks | M05.1–2 |
| M05.4 `codex-adapter` | Same complete adapter contract for Codex; verify supported controls against current official documentation | M05.1–2 |
| M05.5 `grok-adapter` | Same complete adapter contract for Grok CLI; unsupported controls remain explicit | M05.1–2 |
| M05.6 `pi-adapter` | Same complete adapter contract for Pi; prove unsupported settings and observations stay explicit | M05.1–2 |
| M05.7 `adapter-views-integration` | Policy/configuration/log/isolation views and all four adapters through the shared API; current/clean matrix and cleanup checks on macOS/Linux | M05.3–6, M03.1, M04.2, M15.1–2 |
| M06.1 `scoring-service` | Exact weights, all-trial gates/means, grouping, zeros, order, explanations and API; shared Python/JS vectors | M02/M10/M12 data contracts, M11.1–2; F02/F07/F08 resolved |
| M06.2 `rankings-screens` | Rankings, breakdown, presets/alternatives and export; currency-aware wide/compact rendering and original reset | M06.1, M07.1, M15.1–2 |
| M07.1 `configuration-drafts` | YAML saved configurations, persistent setup drafts and presets; independent revision scope and restart/discard tests | M01 identity, M11.1–2; M06 validation contract |
| M07.2 `launch-preparation` | Shared readiness/catalog/judge/weights validation, previews, snapshots, freeze and stale-review handling | M07.1, M03.1, M04.1–3, M06.1; M05/M12/M18 ports |
| M07.3 `setup-review-screens` | Setup/edit/judge/review/frozen record and budget dialog; exact totals and all-local warning exception | M07.2, M15.1–2; M10 accounting contract |
| M08.1 `verification-runtime` | Suite/check schema, classification, disposable copies, service/runner cancellation and explicit trial paths | M01.1, M02.1, M05.1–2, M11.1–2 |
| M08.2 `verification-adapters` | Playwright, backend/repository checks, viewport captures and evidence handoff; final/per-task separation | M08.1, M02.2, M03.1 |
| M08.3 `verification-screens` | Checks/regression/not-passed/screenshots/viewer/progress/judge handoff; inert evidence and trial selection tests | M08.2, M15.1–2 |
| M09.1 `inventory-package` | Byte-preserved prompts, canonical package, rubric and built-in registration; empty baseline, no planner and version pins | M01.1–3, M08 suite schema, M12 profile schema |
| M09.2 `inventory-repository-checks` | Task commits, README and approved technology/direct-file obligations mapped to executable checks | M09.1, M08.1–2; F11 observation contract |
| M09.3 `inventory-behavior-checks` | Data/CRUD/lookup/cart/checkout/QA requirements on differing conforming fixtures, with fair phase boundaries | M09.2, M08.2 |
| M09.4 `inventory-screens` | About/prompts/coverage/look-alike/upgrade screens generated from package facts | M09.3, M15.1–2 |
| M10.1 `task-accounting` | Usage fold, reported/estimated costs, billing, frozen currency conversion and task timing; cumulative/partial/zero fixtures | M04/M05/M07 contracts; F08 resolved |
| M10.2 `final-accounting` | Trial aggregation, scoped energy tariff analysis, finalization/retention barrier and query API | M10.1, M02.2, M18.1; M11 timeline port |
| M10.3 `measurement-screens` | Task/trial/timing/cost-basis/accounting/tariff views; mixed-currency and missing-rate fixtures | M10.2, M15.1–2 |
| M11.1 `engine-client-api` | Composition seam, registry, DTO round trips, Unix socket, handshake and both clients; permissions/version/error tests | Bootstrap only; feature use cases injected |
| M11.2 `events-jobs-lifecycle` | Event bus, atomic snapshot/replay, typed cursor, jobs, cancellation and daemon idle/autostart lifecycle | M11.1; F04/F05 resolved |
| M11.3 `run-scheduler` | Launch preparation, per-harness queues, trial loops and awaited verification/accounting; faithful failure continuation | M01/M02/M05/M07/M08/M10 services; M12/M18 ports |
| M11.4 `stop-recovery-invalidation` | Cleanup, interrupted recovery, identity coordinator, judging stop and finalization for every terminal path | M11.3, M12.2, M18.2; F03/F09/F13 resolved |
| M11.5 `run-screens` | Run/live/stop/detach/reattach/locked states, compact list/detail, slow-client tests | M11.4, M05 observation service, M15.1–2 |
| M12.1 `review-contract` | Rubric/profile reader, capability requirements, input filtering and strict half-point review validation | M01/M04/M08 schemas |
| M12.2 `judging-worker` | Sequential fresh sessions, immutable artifacts, separate costs, original/additional reviews and cancellation | M12.1, M05.1–2, M02.2, M08.2, M10.1, M11.1–2 |
| M12.3 `judging-screens` | Progress/trials/profile/capability/invalid-review/detail views and explicit rejudge entry | M12.2, M06.1, M15.1–2 |
| M13.1 `offline-report-artifact` | Safe self-contained HTML/data/evidence, readable no-JS tables and file lifecycle; network-disabled direct-file test | M02.2, M06.1, M10.2 |
| M13.2 `browser-analysis` | Exact JavaScript scoring/filter/weight logic and configuration export; parity with all shared vectors | M13.1 |
| M13.3 `report-charts` | Top-five groups, log-cost scatter and stacked ranking, grouping/coverage/currency/telemetry presentation | M13.2 |
| M13.4 `report-jobs-screens` | Plan/generate/open/reveal/completion flow and TUI dialogs; failed opener/report path and cancellation tests | M13.3, M11.1–2, M15.1–2 |
| M14.1 `registry-cli` | Typer composition, generated commands/help/JSON, input and typed-error mapping, destructive consent | M11.1–2; published registry |
| M14.2 `curated-cli-flows` | Run/follow/detach/status/stop, doctor consent, exchange and report waiting; real-socket process tests | M14.1 and relevant completed engine services |
| M15.1 `tui-foundation` | Shared widgets, themes, screen/modal bases, view-model helpers, fake client and wide/compact test harness | M11 API DTOs |
| M15.2 `tui-shell` | Connection/subscription management, navigation, palette, focus and screen-state lifecycle | M15.1, M11.1–2 |
| M15.3 `tui-integration` | Connect feature-owned screens; end-to-end no-harness, creation, execution, import, report and resize journeys | All relevant engine/screen children |
| M16.1 `repository-capture` | Read-only committed-tree inspection/capture, executable metadata and source-preservation proof | M01.1, M11.1–2 |
| M16.2 `planning-jobs` | Planner selection/verification handoff, fresh generation/regeneration, interrupted jobs and persisted sessions | M16.1, M03.1, M04.1–2, M05.1–2, M11.1–2 |
| M16.3 `draft-approval` | Persist/edit/reopen/discard, service validation, canonical conversion, duplicate blocking and approval | M16.2, M01.1–3, M08/M12 validators |
| M16.4 `planner-screens` | Planner/default/unknown/verify/progress/failure/reopen states with correct job subscriptions | M16.2, M15.1–2 |
| M16.5 `draft-editor-screens` | Specification/task/check/service editing, name, regeneration and approval; wide/compact state preservation | M16.3–4 |
| M17.1 `archive-contract` | Shared payload format, safe bounded reader, completeness/hash/reference validation | M01.1, M02.1; F01/F02 resolved |
| M17.2 `exchange-transactions` | Deterministic payload export, staged inspection/commit, atomic visibility and recovery/idempotency | M17.1, M01.2–3, M02.2, M11.1–2 |
| M17.3 `exchange-screens` | Picker, previews, validation progress, mismatch/embedded/conflict/unsafe states and exports | M17.2, M15.1–2 |
| M18.1 `telemetry-domain` | Capabilities, intervals, coverage, reset/wrap, source overlap and window rules; numeric fixtures | F12 resolved |
| M18.2 `sampling-lifecycle` | Shared sources/per-run schedules, process trees, persistent samples and finalization handoff | M18.1, M02.2, M11.1–2; run-window port |
| M18.3 `macos-collectors` | psutil/macmon/powermetrics capability adapters and verified guides; recorded and real-supported-host checks | M18.2 |
| M18.4 `linux-collectors` | psutil/RAPL/NVIDIA/AMD adapters and distro-aware guides; recorded-output coverage and explicit hardware limits | M18.2 |
| M18.5 `telemetry-screens` | Monitoring/guidance/timeline/energy/windows, CSV and accounting integration; source/scope/coverage visible | M18.3–4, M10.2, M15.1–2 |

Adapter children assume supported versions and documented controls are established before coding. M18.4 also assumes recorded output fixtures are prepared; absence of suitable NVIDIA/AMD hardware limits verification and must be recorded, not replaced by a claim of tested support. Calibrate later work-package estimates against the first completed children; the 65-package decomposition is a starting delivery plan, not measured model throughput.

## 4. Correction and delivery order

1. **Reconcile shared contracts first:** F01/F02/F06/F10 for identity and trial references; F03/F04/F05/F09/F13/F14 for lifecycle, publication and retention; F07/F08/F12/F19 for accounting. Amend SPEC only for genuinely new edge-case policy, such as unverified numeric zero, and label that change explicitly.
2. **Bootstrap:** establish package/test layout, shared IDs/value objects, published Protocol/DTO/registry definitions, error envelope, deterministic fixtures and import boundaries. Publish shared check/profile/measurement schemas before their first consumers. This is prerequisite preparation, not a claim that all producing modules are implemented.
3. **Executable foundations:** M11.1–2 and M15.1–2. Use injected fake feature services to prove API/client/event/screen infrastructure without making those feature modules depend on completed orchestration.
4. **Domain and persistence:** implement identity/retention/catalog/readiness/configuration/scoring, while introducing the M08/M12/M18 domain contracts when needed. Complete a single-harness measured inventory run with real storage and disposable verification; keep its milestone explicitly partial.
5. **Complete execution:** finish all harness adapters, trials, stop/recovery, finalization and independent judging. Add M18 collection/pricing integration before claiming local energy-cost ranking support.
6. **Consumers and authoring:** complete result/measurement/scoring screens, CLI, standalone reports, planner capture/edit/approval and ZIP transactions. Apply F16/F17/F19 wireframe corrections and regenerate previews from source.
7. **Final integration:** finish M15.3 and cross-platform acceptance. Link child completions back to parent requirements and actual tests; update the development sequence and traceability. Parents are complete only when their real integrations, not just fake-port tests, pass.

Do not treat M01→M18 as a strict whole-module dependency chain. For example, M01 library counts can use M02's published interface before result UI exists, and M07 needs M12's profile/requirements contract before the judging worker exists. M11.3 consumes a judging port; M12.2 needs only daemon/jobs foundations, which avoids a scheduler/worker cycle.

### Required acceptance scenarios after the corrections

| Scenario | Required observable result |
|---|---|
| Canonical identity and executable baseline | Built-in/planned/imported definitions agree; rename does not rehash; executable flags survive read-only storage and ZIP exchange. |
| Two machines, same human run label | Distinct run subjects/trials, stable provenance, no accidental averaging or ambiguous export. |
| Repeated trials | Fresh baseline per trial; every trial's logs/checks/screenshots/measurements remain addressable; one ineligible trial excludes the configuration. |
| Finalization under delayed events | Report, ZIP and retained queries contain the same final cost/time/coverage; energy cost is retained before sealing. |
| Snapshot/reconnect/overflow | Events during snapshots are not lost; old-epoch cursors resnapshot; slow clients cannot stall tasks. |
| Template mutation at every phase | First detection during execution/final verification/judging halts the run, preserves evidence, cleans up and excludes every result. |
| Accounting matrix | API/subscription/local/unknown, declared billing, reported zero, estimate zero, partial usage, missing prices/rates, correct rate direction, COP/other display currency and mixed-run USD fallback. |
| Energy matrix | Sequential versus parallel, absent tariff, changed analysis tariff, resets with/without range, gaps, overlapping sources and actual collector interval. |
| Import transaction faults | Unsafe/corrupt/conflicting data rejected; crashes/concurrent readers see no half-import; identical reimports remain idempotent. |
| Fair inventory checks | Conforming implementations with different UI/storage choices pass; T2 is not judged on T3 UI; commits and runtime constraints have explicit observations. |
| No-harness/offline/consent | Browse/import/export/report stay available; planning does not use unconfirmed harnesses; verify requires actual consent; unattended trial warning does not prompt. |
| Judge/report parity | Final-regression screenshots only, fresh trial sessions, malformed reviews ungraded, no repairs; Python and offline JavaScript agree on all scoring vectors. |
| UI/CLI equivalence | 120×40 and 80×24 workflows, keyboard/mouse/focus, trial selection, account billing, deletion refusal, stop during judging, detach and report-wait failures. |

## 5. Supporting-document recommendations

| File | Disposition |
|---|---|
| [SPEC.md](SPEC.md) | Keep as the product authority. Clarify new numeric-zero policy and portable run identity; retain all accepted decisions. It is not a one-session coding task. |
| [ARCHITECTURE.md](modules/ARCHITECTURE.md) | Retain architecture; correct error envelope and specify shared contracts/publication boundaries. Implementation is distributed across foundation and owner children. |
| [DEVELOPMENT-SEQUENCE.md](modules/DEVELOPMENT-SEQUENCE.md) | Replace whole-module order as the actionable schedule with a child dependency graph and gates, preserving the broader milestones. |
| [TRACEABILITY.md](modules/TRACEABILITY.md) | Source digest is current. Add explicit R156/R157 references and child/test mappings; a requirement ID in prose is not evidence that a test passed. |
| [Module README](modules/README.md) | Link parent-to-child implementation specs and this diagnostic when applying the recommendations; explain parent completion rules. |
| [Decision round 1](modules/OPEN-QUESTIONS.yaml), [round 2](modules/OPEN-QUESTIONS-R2.yaml), [round 3](modules/OPEN-QUESTIONS-R3.yaml) | Preserve answered history. Mark resolved items as applied and link their final normative clauses so old `current_assumption` text is not mistaken for current policy. |
| [Navigation and wireframes](design/wireframe-tui/navigation.md) | Reconcile F16/F17/F19 and add an explicit screen/state/API ownership index. Regenerate previews; preserve the existing wide/compact grid checks. |

## Appendix A. Structural wireframe inventory

These are source-catalog groups, not a proposal to transfer ownership. Shared boards such as ReportReady, exchange entry screens and RunListDetail still use their documented owning modules. The listed compact counterparts were checked wherever declared. No semantic gap is inferred merely because a new state lacks a literal name in a module paragraph.

| Group | Artboards |
|---|---|
| Shared | DesignSystem, NavMap (generated as Main), WidgetStates |
| M01 | Library, LibraryDrafts, DraftDiscard, LibraryLookAlike, LibraryUpgrade, LibraryLoading, LibraryEmpty, LibraryError, LibraryNoHarness, CommandPalette, TemplateTasks, TemplateIdentity, TemplateConfigs, TemplateResults, NewTemplate, NewTemplateRepo, NewTemplateInvalid, Revise, ReviseActiveRun, ReviseConfirm, ReviseIdentical, RevisionSaved, ExportTemplate, ImportTemplate, ImportVerifying, ImportRejected, ImportDuplicate, LaunchCheck, LaunchMismatch |
| M02 | Results, ResultsTrials, ResultsHalted, ResultsAnalysisTariff, ResultImport, ResultImportConflict, ExportResult, ReportReady, ResultOrigin, ResultOutcomes, ResultReviews, Rejudge |
| M03 | Environment, EnvironmentAuthFailed, EnvironmentRechecked, EnvironmentOffline, EnvironmentNoHarness, EnvironmentCollectors |
| M04 | Catalog, CatalogRefreshFailed, CatalogOverride, CatalogRates, ModelPicker, ModelPickerUnknown |
| M05 | EnvPolicy, CleanModeBlocked, RunConfig, TaskBlocked, ModelRejected, RunIsolation |
| M06 | Rankings, RankingsProfileDefaults, RankingsTrials, ScoreBreakdown, WeightsEditor, WeightsInvalid, RankingsAlternative |
| M07 | Setup, SetupInvalid, JudgePicker, JudgeFallback, ReviewLaunch, TrialBudgetWarning, LaunchRecord |
| M08 | TaskChecks, FinalRegression, CheckOutcomes, Screenshots, EvidenceViewer, VerifyProgress, JudgeHandoff |
| M09 | InventoryAbout, InventoryPrompts, InventoryChecks, InventoryVariant, InventoryUpgrade |
| M10 | Measurements, MeasurementsPartial, MeasurementsTrials, TimingPhases, CostBasis, CurrencyEnergy, TariffAnalysis |
| M11 | RunOverview, RunQueued, RunSequential, RunFailures, RunHalted, HarnessLive, HarnessLiveStreaming, HarnessLiveLimited, RunDetach, RunReattached, StopConfirm, StopCleanup, ActiveLocked |
| M12 | Judging, JudgingDone, JudgingTrials, ReviewUngraded, ReviewDetail, RubricProfiles, JudgeCapability |
| M13 | ReportGenerate, ReportGenerateDefaults, ReportProgress, ReportPage |
| M14 | CliHelp, CliRun, CliRunReport, CliInvalid, CliHalted, CliStatusStop, CliDoctor, CliVerify, CliExchange |
| M15 | HelpKeys, RunListDetail, PromptSavePreset, PromptExportConfig, PromptExportCsv |
| M16 | PlannerPicker, PlannerUnknownModel, PlannerNoUsable, PlannerVerify, PlanningProgress, PlanningFailed, PlanningInterrupted, PlanReview, PlanReopened, PlanServices, PlanServiceEdit, PlanEdit, PlanRegenerate, PlanApprove, PlanApproveIdentical |
| M17 | ImportUnsafe, ImportIncomplete, ResultPackagePick, ResultPackage, ResultMismatch, ResultEmbedded |
| M18 | MonitoringSettings, CollectorGuide, Telemetry, EnergyDetail, SequentialEnergy |

## Appendix B. Suggested child-spec template

```markdown
# MNN.K — Bounded capability

Parent: MNN. Requirements: Rxxx, Ryyy. Resolved findings: Fxx.
Prerequisites: concrete child IDs and published contract versions.

Outcome: one observable capability and its completion boundary.
Ownership: implementation/test files and shared files coordinated with other children.
Contracts: requests, responses, events, errors, persistence and relevant invariants.
Wireframes: exact boards/states, or “no UI”; shared widgets consumed.
Acceptance: domain, adapter/API, fault and UI cases appropriate to this capability.
Integration gate: real-provider checks required before the parent can be complete.
Pending parent requirements: what subsequent children still deliver.
```

The next implementation task should start from one such bounded contract after its findings and prerequisites are resolved, rather than asking the agent to interpret an entire parent file as an indivisible coding assignment.
