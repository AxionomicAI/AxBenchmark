# M02 — Retained results, provenance, and comparability

Status: proposed feature contract derived from [the product specification](../SPEC.md). This module specifies behavior to implement, not existing functionality.

## Purpose and boundary

AxBenchmark is a Python terminal application for comparing coding-agent harnesses on multi-step software work. Users reuse a template or create one from a project prompt, run selected harness/model configurations, collect measurements, obtain independent LLM reviews, and generate an interactive report. M02 preserves those outcomes and admits other machines' results only to comparisons with matching template SHA-256 identities. **R002**

Results extend the README methodology: measured cost and time, separate quality assessment, and rankings for different priorities. They describe complete harness/model/environment configurations, not isolated model capability. Independent execution on another machine and ZIP exchange are supported; remote orchestration, hardware provisioning, and native Windows support are outside initial scope. Preserve historical applications, results, and reviews. **R004, R015**

Engineers implementing retention should use this contract to preserve enough information for subsequent inspection, exchange, and analysis. The contract specifies conceptual information and operations. The persistence layout chosen for the engine is recorded under Implementation as an implementation decision; no deletion policy is defined.

## Retained information contract

A template defines the specification, ordered tasks, starting files, acceptance checks, execution protocol, and rubric. A run configuration selects harnesses, providers, models, efforts, environment settings, judge, and weights. Each result records **one trial of one configuration on one machine**, linked to its exact template revision. An immutable globally unique `RunUid` identifies the experiment; its separate `RunLabel` is a local date/suffix display label. Shared `TrialRef {run_uid, configuration_id, trial_index}` identifies a trial, and one globally unique `ResultId` binds permanently to it. `trial_count` belongs to the frozen launch, not the identity. Labels can collide across machines; internal operations use UIDs and a label resolves only when exactly one visible run matches. When a run uses more than one trial, each trial is a separate result linked to its configuration and trial index; trials of one configuration are never merged into one record. Distinct runs of an unchanged configuration remain distinct outcomes. **R017, R077, R122**

Retain these linked information groups; they are not a mandated storage schema:

| Group | Required retained information |
|---|---|
| Definition and launch | Approved exact template and full SHA-256; packaged baseline and its identity; resolved configuration, including trial count, the display currency and the optional electricity tariff; catalog metadata used at launch, including the price table with its source and retrieval date and each account's billing kind with its source (read from the harness, or declared by the user); the exchange-rate snapshot frozen at launch (rates to USD for every price currency and the display currency, each with its source and retrieval date, or recorded as missing); original scoring weights. Reusable configurations remain associated with their pinned template revision, with configurations and scoring presets persisted in YAML by [M07](07-run-configuration.md). **R066, R134** |
| Origin and execution | Source run UID and label, result identifier and immutable trial binding, originating machine identity and label, hardware/OS details, local/imported provenance, harness versions, timestamps, trial index and trial count, and configuration details sufficient to expose model/effort, environment policy, concurrency, and judge selection. **R066, R116, R124, R143** |
| Measurements and outcomes | Normalized measurements, sources and coverage, cost bases (including an API-equivalent estimate's price source and date and the frozen rate that converted a non-USD price, an energy estimate's measurement scope, and the billing kind each basis rests on, labelled "declared by user" when the user declared it), telemetry limitations, hardware samples, and task outcomes. Preserve process outcomes separately from passed, failed, or unverified acceptance checks, including missing prerequisites and broken verification infrastructure. **R076, R116, R124, R134** |
| Reviews and evidence | Original judge configuration and metadata, raw grades, review evidence and limitations, task evidence, logs, generated artifact/task snapshots, and available commit identities. Keep review grades distinct from process and verification outcomes. **R076, R082, R116, R134, R143** |

Credentials must not appear in exported settings, logs, or reports. Export only the selected run's required records and supporting material, excluding raw credentials and unrelated machine files. Preservation requirements do not authorize copying unrelated directories. **R066, R116**

## Operations and invariants

**Record and inspect.** Accept the frozen launch information and subsequent outcomes from execution, verification, measurement, and judging owners. Retain unavailable or incomplete observations with their coverage rather than inventing values. Every competitor receives identical approved inputs and an independent baseline; retaining or inspecting results must leave the source repository and historical benchmark artifacts untouched. Later analysis uses retained snapshots and the packaged baseline. **R076, R124, R134, R140**

**Import and re-export.** [M17](17-zip-exchange.md) validates packages before results join retained collections. A result ZIP contains the exact template, selected run's records and configuration (including the frozen exchange-rate snapshot), machine label and hardware/OS details, harness versions, timestamps, outcomes, measurements with coverage, original weights, judge metadata/grades, snapshots, and evidence, covered by a result-payload file-integrity manifest. Source result identifiers and provenance survive subsequent exports. **R116**

Reimporting the same template or identical result is idempotent. An identical import creates no duplicate; a different payload reusing an existing result identifier is rejected without overwriting the original. Distinct run UIDs are retained even when their configuration and human label match. A reused run UID with a different immutable launch binding, or a second result ID for an already bound `TrialRef`, rejects the whole batch; matching labels alone are never conflicts. Different template hashes never enter one comparison or ranking. Integrity failures are surfaced through M17's rejection behavior without partially adding records. **R122**

**Halted by a template change.** M11's `RunInvalidationCoordinator` appends one durable `RunInvalidation` before cleanup, including the run UID, invalidation ID, approved and computed SHA-256, changed paths, detection time and source. The overlay applies to every trial of the run, including already sealed results and completed reviews. Queries retain the original execution status and expose an effective interrupted/non-comparable status with reason "template identity invalidated". Unsealed results finish the partial-data finalization barrier; sealed facts are never reopened or rebound. All evidence remains inspectable and exportable with the invalidation, while every comparison, ranking and report excludes the run. **R067, R122, R153**

Label results as locally produced or imported and retain execution evidence. Matching SHA-256 proves identity of the packaged benchmark definition; payload checks verify packaged data integrity. Neither certifies faithful third-party execution nor authentic measurements. Do not describe validated imports as execution certification. **R123**

**Compare.** Accumulate results for the same template, including compatible imports, and expose machine, harness/model/effort, environment policy, concurrency, and judge filters. Machine differences are intentional comparison inputs, not hash mismatches. Apply one common selected weight set to a combined report while retaining each result's original weights and grades. Show every trial of a configuration and, beside them, the mean of cost, time and quality with the min–max range, as computed by [M06](06-scoring-rankings.md). Keep cost bases, telemetry limitations, measurement conditions, and imported provenance visible; matching hashes do not establish equivalent conditions. Wherever a cost basis is shown, a billing kind the user declared is labelled "declared by user"; unknown billing never appears as a verified $0. **R035, R077, R080, R124, R143**

**Review again explicitly.** [M12](12-quality-judging.md) uses one fresh headless session per artifact, reviews configurations sequentially, and applies the same judge configuration and template rubric throughout a local comparison. Imported reviews retain their original judge details and evidence. An explicit request may add a fresh review with the selected judge, preserving the original and recording additional judging cost separately. Quality and combined rankings remain separate across different judge configurations. **R082, R143**

**Derive outputs.** Reporting, ZIP exchange, and alternative weighting operate from retained data without new model calls. An electricity tariff entered or changed in Results is an analysis setting like alternative weights: it recalculates the energy-cost estimate, is labelled as an alternative, and never changes the tariff or estimate recorded with the run. Costs are kept and compared in USD; Results show each run's amounts in that run's frozen display currency, converted from USD with the rates frozen with that run. A list or comparison spanning runs with different display currencies shows USD and says so. A currency with no frozen rate leaves the converted value unknown (`no_rate_conversion`), never guessed; the historical README exchange rate is never used. Rankings and orderings compute in USD. The display currency is not an analysis setting: Results offer no other display currency and accept no analysis rates. The same analysis tariff applies to the Rankings tab and to a report generated from Results. Alternative analysis does not overwrite original results, grades, weights, tariffs, display currencies or rates. Hand accumulated artifact reviews and compatible results to [M13](13-standalone-html-report.md) for report generation; at completion, attempt to open the report and always display its location, including when opening fails. **R035, R124, R134**

## Integration dependencies

[M01](01-template-library-identity.md) supplies immutable template identity; [M16](16-custom-template-planning.md) supplies baseline capture; [M05](05-harness-execution-isolation.md) and [M11](11-run-orchestration.md) supply execution and lifecycle facts. [M08](08-verification-evidence.md), [M10](10-measurements-cost.md), and [M18](18-hardware-monitoring.md) supply evidence and measurement semantics. [M06](06-scoring-rankings.md) computes derived scores; [M15](15-terminal-interface.md) and [M14](14-command-line-interface.md) expose retained-result operations as clients of the engine API and evaluate none of these rules themselves. M02 preserves these distinctions for every consumer.

## Acceptance criteria

- A saved result exposes every retained information group above, including launch catalog metadata, evidence, and independent process/check outcomes. **R066, R076, R116, R134**
- Import/re-export preserves origin, run/result identifiers, trial bindings and invalidations; repeated identical imports add nothing and conflicts never overwrite. Same-label runs remain separate, ambiguous lookup lists UIDs/origins, and reused UID/trial bindings conflict. Embedded-template/result publication is atomic across concurrent reads and crash recovery. **R116, R117, R122, R123, R142**
- Final accounting, hardware and evidence writes become durable before receipt-backed sealing. Delayed handlers cannot produce an early successful export/report; a crash between seals resumes only unfinished work. Completed review dispositions make retention ready; storage failure remains pending. **R078–R081, R114, R134, R147, R155**
- Same-template comparisons filter all required dimensions and preserve judge groups, original weights/grades, cost bases, and telemetry limitations. Different hashes cannot mix. Every trial is listed with its configuration and trial index beside the configuration's mean and min–max. **R077, R082, R122, R124, R143, R154**
- A detected template change appends one run invalidation, giving every trial an effective interrupted/non-comparable status, even when detected during judging after seal. Both SHA-256 values, changed paths, sealed facts, completed reviews and evidence survive inspection and export/import; no result is rebound or admitted to a comparison, ranking or report. **R067, R122, R153**
- An analysis tariff recalculates energy-cost estimates in Results, labelled as alternative, while the recorded tariff and estimates stay unchanged. **R114, R134**
- Results show each run's costs in its frozen display currency, converted with its frozen rates; a list spanning runs with different display currencies shows USD and says so; a currency without a frozen rate shows unknown with `no_rate_conversion`; row order and rankings use USD. A saved result retains its display currency and frozen exchange-rate snapshot, and a result ZIP carries them. **R081, R134**
- Every shown cost basis that rests on a billing kind declared by the user carries "declared by user"; unknown billing never shows as verified $0. **R080**
- With model access unavailable, saved results still support reports, ZIP exchange, and reweighting. Rejudging requires an explicit action, preserves the original review, and accounts for extra cost separately. Report completion attempts opening and always shows the location. **R035, R082, R134**
- Existing repositories and historical applications, results, and reviews remain unchanged after retention, analysis, or exchange. **R015, R140**

## Child implementation specs

Implement bounded children in the order permitted by their entry conditions; the parent is accepted only after all three and their real integration gates pass. Findings refer to [recommendations](../recommendations.md).

| Child | Scope |
|---|---|
| [M02.1 — retained-records](implementation/M02/01-retained-records.md) | Run/result/trial bindings, immutable facts, append-only reviews and invalidations, portable serialization. |
| [M02.2 — retention-services](implementation/M02/02-retention-services.md) | Durable records/evidence, finalization receipts, publication participants, queries and recovery. |
| [M02.3 — results-screens](implementation/M02/03-results-screens.md) | Results/trials/detail/filter/review/import/export/report states over engine DTOs. |

## Implementation

Implementation decisions under [the architecture decision](ARCHITECTURE.md). They fix how the contract above is built; they add no product behavior. M02 is the only reader and writer of retained result records. Every other module, and every interface, reaches them through the `results.*` API or through the application interfaces below.

### 1. Engine component

Package `axbenchmark.engine.results`.

**Domain** (`engine/results/domain/`, frozen slotted dataclasses, no I/O):

| Type | Contents and rules |
|---|---|
| `RetainedResult` | Aggregate keyed by `ResultId` and permanently bound to `TrialRef`, template SHA-256 and `RunBinding`. Holds the four information groups below, `reviews`, original `status: ResultStatus`, `sealed`, `facts_digest`, finalization receipt and version. Facts are append-only before seal and immutable afterward. Append-only reviews and run-invalidation associations may follow seal; neither changes `facts_digest`. Queries return an `EffectiveResult` combining this record with its run overlay. **R066, R076, R134, R153** |
| `DefinitionAndLaunch` | Template identity, baseline identity, resolved configuration (frozen YAML text as handed over by M07 and its parsed facets, including trial count, display currency and the optional electricity tariff), catalog metadata at launch including the price table with source URL and retrieval date per price and each account's billing kind with its source (`discovered`, `override` labelled "declared by user", or `unknown`, as resolved by M04 and frozen by M07), `rates`: M07's `RateSnapshot` exactly as frozen (display currency; per needed currency `per_usd`, source layer, source URL and retrieval date, or `MissingRate`), original quality and ranking weights, judge configuration. M02 stores these and resolves, converts or re-reads none of them; a result without a rate for a currency stays without it. Credentials appear only as `CredentialPresence(name, is_set)`; the type has no value field. **R066** |
| `OriginAndExecution` | `source_result_id`, `origin: MachineIdentity(id, label)`, hardware/OS details, `provenance: Provenance`, harness versions, start/finish timestamps, requested and effective model/effort, environment policy and limitations, concurrency. **R116, R124, R143** |
| `RunBinding` | `run_uid: RunUid`, `run_label: RunLabel`, originating machine ID, launch timestamp, template and baseline identity, and a canonical digest of the complete frozen credential-free launch (all configuration IDs, trial counts, settings, prices/rates, judge and original weights). Its digest excludes local paths, import metadata and later lifecycle/reviews. A UID has exactly one binding; compare the complete binding before merging any selected-result subset. **R077, R116, R122** |
| `TrialRef` | Shared `{run_uid, configuration_id, trial_index}` from `engine.shared.domain`; index is 1-based and bounded by the launch's `trial_count`. A `ResultId` binds to exactly one trial and a trial to exactly one result ID; import/export preserves both. **R077, R154** |
| `TrialGroup` | The results of one `(run_uid, configuration_id)`, ordered by `trial_index`, with frozen `trial_count`, observed result count and missing trial indices. A selected import subset cannot masquerade as a complete trial group. Pure grouping only; cost and time means and ranges come from M10 (`MeasurementReader.trial_summary`), quality mean and range from M06 (`ScoringRules.trial_summary`). Distinct runs never share a group. **R077, R122** |
| `ResultStatus` / `EffectiveResult` | Original execution status `COMPLETED`, `FAILED`, `INTERRUPTED(reason)` is frozen at seal. An associated `RunInvalidation` makes effective status `INTERRUPTED(template_identity_invalidated)` and `comparable=False` regardless of original status or existing reviews. Ordinary stopped/failed results remain inspectable; M06 separately determines ranking eligibility. **R067, R153** |
| `RunInvalidation` | Shared append-only run record `{run_uid, invalidation_id, approved_sha256, computed_sha256, changed_paths, detected_at, source}`. The first detection wins; retry returns that record without changing its evidence. All associated present or later-imported results inherit it. Conflicting reuse of `invalidation_id` fails; importing invalidation evidence must never clear existing invalidation. **R067, R153** |
| `Provenance` | `kind: LOCAL \| IMPORTED`; for imports `ImportOrigin(package_name, imported_at, payload_manifest_digest)` and `relays: tuple[MachineIdentity, ...]`. `with_relay()` appends a relay and never changes `origin` or `source_result_id`. **R116, R123** |
| `TaskOutcome` | `trial: TrialRef`, `task_id`, `process: ProcessOutcome` (exit status, signal, not started, with cause, and `internal_retries` observed by M05 and recorded by M11) and `checks: tuple[CheckOutcome, ...]`. `CheckOutcome` and its three states `PASSED \| FAILED \| UNVERIFIED` with a cause (missing prerequisite, broken verification infrastructure, `not_run`, …) are [M08](08-verification-evidence.md)'s domain types, imported from `engine.verification.domain`; M02 adds no fourth state. Process and check state are separate fields with no derivation between them. **R076** |
| `Observation[T]` | A measured value or `Unavailable(reason)`, always with `source`, `coverage` (complete, or partial with covered and total task counts) and `limitations`. Missing values are retained as `Unavailable`, never defaulted to zero. Used for measurements, costs (with M10's cost basis, plus the price source and date and any conversion rate of an API-equivalent estimate, the measurement scope of an energy estimate, and the billing kind and source the basis rests on) and hardware samples. Costs are retained in USD as M10 recorded them; no display-currency amount is stored. **R080, R081, R114, R124, R134** |
| `Review` | `review_id`, `result_id`, `trial: TrialRef`, `kind: ORIGINAL \| ADDITIONAL`, judge configuration, raw grades, evidence refs, limitations, judging cost (an `Observation`), reviewed-at and reviewing machine. `RetainedResult.add_review` rejects a second `ORIGINAL` and never removes one. **R082, R143** |
| `ComparisonScope` | One template SHA-256. `admit(effective_result)` raises `TemplateMismatch` for any other hash and `NotComparable` for a result whose effective status is not `comparable`, so a comparison or ranking input set can only ever contain one hash and never a result halted by a template change. Machine differences are facets, not mismatches. **R067, R122, R124** |
| `Facets` / `ResultFilter` | Pure functions computing distinct values and counts for machine, configuration (harness/model/effort), environment policy, concurrency and judge configuration, and matching a result against a filter. **R124** |
| `JudgeGroup` | A judge configuration digest plus a short label assigned in order of first appearance within one `ComparisonScope`, stable across queries. Groups are never merged. **R082, R143** |
| `ImportDisposition` | `classify(existing_digest \| None, incoming_digest) -> ADD \| IDENTICAL \| CONFLICT`. Identical adds nothing; a conflict carries both digests and the differing payload paths. **R122** |
| `RetentionStatus` | Per information group: complete, or partial with the missing items named. Drives the ✓ list in `#retained`. **R134** |
| `ChecksSummary` | Passed, failed and unverified counts for a result or task, plus the not-run count derived from the `not_run` cause of unverified checks. |

Every stored task, check, competitor measurement and scheduling window carries `TrialRef`; task-scoped data additionally carries `task_id` and verification phase where applicable. M18's `HardwareSamples` retention envelope binds `result_id`, `run_uid` and `TrialRef`, but its referenced shared host readings remain experiment-scoped. Active trial context never allocates shared host energy to a competitor; sequential windows retain their explicit TrialRef and background-load limitations. `EvidenceRef` binds `result_id`, `TrialRef`, task/phase, kind, relative path and digest. A producer supplying a result ID plus a mismatched scope is rejected before any write. Historical queries never substitute the active or latest trial. **R076–R078, R134, R154**

`facts_digest` is SHA-256 of canonical credential-free sealed execution facts and referenced evidence/snapshot digests, including run/trial/template binding. It excludes seal bookkeeping (status, sealed flag and receipt), reviews, invalidation overlays and local import fields, so setting the seal cannot invalidate its own receipt. `payload_digest` instead identifies a pinned export/import snapshot: the facts, original sealed status and terminal retention evidence plus every included original/additional review and run invalidation, with their evidence digests; local paths, import time and relays remain excluded. It is computed for that snapshot, not frozen before the original review exists. M17's archive manifest is a separate file-integrity envelope. A changed review or invalidation changes a later snapshot digest without rewriting sealed facts. Same-result-ID imports with a different snapshot are conflicts, not implicit review merges; identical reimports remain no-ops. **R082, R116, R122**

Domain errors: `TemplateMismatch`, `NotComparable`, `ResultIdConflict`, `RunBindingConflict`, `TrialBindingConflict`, `ScopeMismatch`, `InvalidationConflict`, `FinalizationReceiptMismatch`, `RetentionPending`, `ResultSealed`, `OriginalReviewExists`, `ResultNotFound`, `UnknownTemplate`, `UnknownRun`, `AmbiguousRun`, `SnapshotChanged`, `ImportIntentConflict`.

**Finalization and readiness.** Follow [the shared awaited barrier](ARCHITECTURE.md#finalization-and-immutable-retention): M11 awaits verification/evidence and M10 drainage, then M18 close, then M10 `finalize_run`. M10 durably appends final measurement/billing/rate/energy facts through M02 and obtains `MeasurementFinalizationReceipt(run_uid, result_ids, facts_digest)` from M02 after all associated evidence/hardware writes are durable. Here `facts_digest` hashes the sorted `(result_id, individual facts_digest)` entries for the receipt's explicit result set. `seal` verifies the receipt's run, membership and current digest; absent/stale receipts cannot seal. A run first finalizes its unsealed results; already sealed results retain their earlier receipts during stop/recovery. Repeating identical appends/seals with their operation IDs is a no-op; conflicting repeats fail. **R078–R081, R114, R134, R147, R155**

Persist finalization progress per run and result before acknowledging it. A crash after some results seal leaves the run `retention_pending`; retry finishes only remaining work, preserves prior sealed facts/receipts and never fabricates complete coverage. `ResultRecorder.finish_run_retention` is M11's final acknowledgement after every execution result is sealed and the original judging batch is settled (completed, failed, skipped or canceled with reasons). Only then is the run export-ready and completion-report-ready. Import validates equivalent terminal retention evidence, including selected sealed results and the complete frozen run binding. Additional explicit rejudging later is append-only: exports pin a durable review version and include only committed reviews. Reports still require comparability. An invalidated terminal run may be exported for inspection with its overlay, but never reported or compared. Storage failure keeps readiness false and is returned as a typed error. **R035, R116, R134, R153**

**Ports** (`engine/results/ports.py`):

```python
class ResultRepository(Protocol):
    async def index(self, view: PublicationView) -> ResultIndex: ...  # visible rows + read failures
    async def load(self, result_id: ResultId, view: PublicationView) -> RetainedResult: ...
    async def load_run(self, run_uid: RunUid, view: PublicationView) -> RunRetentionRecord: ...  # binding, overlay, readiness/progress
    async def create(self, binding: RunBinding, result: RetainedResult) -> None: ...  # atomically checks UID/trial/result bindings
    async def append(self, result: RetainedResult, expected_version: int, operation_id: str) -> None: ...
    async def invalidate(self, record: RunInvalidation) -> RunInvalidation: ...  # durable run overlay
    async def prepare(self, tx: TransactionId, batch: ValidatedResultBatch) -> ResultRegistration: ...
    async def commit_view(self, tx: TransactionId) -> None: ...  # durable/ready acknowledgement only
    async def rollback(self, tx: TransactionId, token: RegistrationToken) -> None: ...
class EvidenceStore(Protocol):
    async def digest(self, ref: EvidenceRef) -> Sha256: ...
    async def list(self, result_id: ResultId, task_id: TaskId | None, view: PublicationView) -> list[EvidenceItem]: ...
    async def read(self, result_id: ResultId, evidence_id: str, offset: int, limit: int, view: PublicationView) -> EvidenceChunk: ...
class TemplateDirectory(Protocol):          # M01's interface; callers reuse the same publication view
    async def describe(self, sha256: Sha256, view: PublicationView | None = None) -> TemplateLabel | None: ...
class ScoringRules(Protocol):               # bound to M06's application interface; pure functions
    def measured_order_key(self, r: EffectiveResult, cost: CostObservation) -> SortKey: ...         # highest known cost first, unknown last
    def weighted_quality(self, grades: RawGrades, weights: QualityWeights) -> QualityBreakdown: ...
    def eligibility_notes(self, r: EffectiveResult) -> tuple[EligibilityNote, ...]: ...
    def trial_summary(self, group: TrialGroup, measured: TrialSummary) -> ConfigurationSummary: ...  # Q mean and min–max and eligibility; cost and time passed through from M10
class CostAnalysis(Protocol):               # M10; pure projections over pinned retained inputs
    def display_currency_for(self, pinned_runs: Sequence[RetainedRun]) -> DisplayCurrencyDTO: ...
    def ranking_cost(self, result: EffectiveResult, tariff: Tariff | None, display_currency: CurrencyCode | None = None) -> CostObservation: ...
    def validate_tariff(self, draft: TariffDraft) -> Tariff: ...
class MeasurementReader(Protocol):          # M10; no reload of live working state
    def trial_summary(self, group: TrialGroup, tariff: Tariff | None, display_currency: CurrencyCode | None = None) -> TrialSummary: ...
    # tariff None uses recorded tariff; display_currency None uses the frozen currency.
    # Only display_currency_for's mixed-currency choice may override the currency to USD.

```

Plus `PublicationTransactions`, `PublicationView`, `Clock`, `IdGenerator` and `EventPublisher` from `engine/shared`. M02 evaluates no scoring or cost rule itself; `ScoringRules`, `CostAnalysis` and `MeasurementReader` are the ports through which M06's and M10's rules are applied to retained data. An analysis tariff passed to `CostAnalysis` is never written to a record. Order and trial summaries use the USD amount; the display currency changes only the `display` values, and no analysis request chooses it.

**Application** (`engine/results/application/`), one class per use case:

| Use case | Reached through | Behavior |
|---|---|---|
| `ListResults` | `results.list` | Captures one publication/read view for M01 identity, M02 records/overlays and M06/M10 analysis; filters the requested template population and pins the shown runs/complete frozen trial rosters. Calls `CostAnalysis.display_currency_for(pinned_runs)` once before ranking eligibility; this engine DTO determines the page currency and notices. Passes `display_currency="USD"` only for its mixed-currency fallback, otherwise `None`, to every `ranking_cost(result, tariff, display_currency)` and `MeasurementReader.trial_summary(group, tariff, display_currency)`. Validates an analysis tariff through `CostAnalysis.validate_tariff`; absent tariff uses each run's recorded tariff. Orders by exact USD costs via `ScoringRules.measured_order_key(result, cost)` and passes M10's intact cost/time summaries to `ScoringRules.trial_summary` for quality. Returns rows, trial summaries, facets, counts, tariff, currency, capabilities and read failures. Non-comparable results remain listed with their reason after comparable rows but never enter facets or trial summaries. No UI or M02 conversion or trial accounting is performed. |
| `GetResult` | `results.get` | Loads one result and the requested sections; adds `RetentionStatus`, `weighted_quality` for each review under the original weights, and `eligibility_notes`. Money values in the sections carry their recorded USD amount and a `display` value in the run's recorded display currency (through `CostAnalysis`). |
| `GetRun` | `results.get_run` | Loads a visible `run_uid` and its retained results. |
| `ResolveRun` | `results.resolve_run` | Accepts a UID, unambiguous label or engine-owned run-directory reference for CLI callers, returns the UID, and rejects ambiguous labels with candidate UIDs/origins. Subsequent API operations use `run_uid`; never inspect arbitrary client paths. |
| `ListEvidence`, `ReadEvidence` | `results.evidence`, `results.read_evidence` | Lists and reads evidence files of one result in bounded chunks; never resolves a path outside that result's directory. |
| `OpenResult` | `ResultRecorder.open_result(trial)` (M11) | Creates or idempotently returns the unique result ID for an explicit `TrialRef` from the complete frozen run launch, checks immutable run/trial bindings, and validates `trial_index <= trial_count`. Emits `results.result.recorded`. |
| `AppendFacts` | `ResultRecorder.append_*` (M05/M11, M08, M10, M18) | Appends task outcomes, check outcomes, measurements, hardware samples and evidence refs (digested on append). Emits `results.outcome.recorded`. |
| `SealResult`, `MarkInterrupted` | `ResultRecorder.seal`, `.mark_interrupted` (M11) | Requires the durable measurement finalization receipt, verifies all execution/evidence/hardware digests, records the final execution status and freezes `facts_digest`. Interruption uses the same partial-data barrier with no invented outcome. Run readiness stays pending until every result and original-review disposition settles. Emits `results.result.sealed`. |
| `AppendRunInvalidation` | `ResultRecorder.append_run_invalidation` (M11 coordinator) | Durably appends the first run overlay before cleanup. Every associated result immediately reads as effectively interrupted/non-comparable, including sealed results and completed reviews; no execution fact, review or template binding changes. Emits `results.run.invalidated` after persistence. **R067, R153** |
| `FinishRunRetention` | `ResultRecorder.finish_run_retention` (M11) | Durably validates/stores the finalization receipts and original-review dispositions for every expected trial, then exposes terminal export/report readiness (reports also require comparability). Emits `results.run.retention_ready`; failure leaves readiness false. |
| `AddReview` | `ResultRecorder.add_review` (M12) | After execution seal, adds the original review, or an additional review beside it with its separate judging cost. An identical review ID/digest retry is a no-op; conflicting review bytes or a second original fail. An invalidation never removes a completed review; no new judging starts for an invalidated run. Emits `results.review.added`. **R082** |
| `ClassifyIncoming` | `ImportRegistrar.classify` (M17) | Returns `ImportClassification` containing per-binding/result/invalidation dispositions and conflicts for the full staged batch already validated by M17; preview does not reserve or publish it. |
| `PrepareImport` | `ImportRegistrar.prepare/commit_view/rollback` (M17) | Reclassifies all run bindings, trial bindings, result snapshots and invalidation IDs under the publication write lock. Any conflict rejects the entire batch. Stages every new registration with exact transaction tokens and durably stores the participant receipt before returning; identical published records reserve existing entries. Same-transaction/same-intent prepare retries return the original tokens and created flags, including after a crash before M17 journaled the receipt. A changed intent fails; prepared creations are never reclassified as pre-existing on retry. `commit_view` only asserts durable readiness. M17 publishes the shared marker after M01/M02 are ready; only then emit `results.import.registered`. **R117, R122, R142** |
| `BuildExportBundle` | `RetainedResultReader.export_bundle` (M17) | Under one M02 read snapshot verifies terminal readiness and selected-result run membership, pins binding/retention/fact/review/invalidation versions and all supporting leases, and returns an `ExportBundle` handle. It includes the complete run binding and terminal evidence, selected result/config/rate files, evidence/snapshots, invalidation and provenance, excluding credentials and unrelated files. M17 writes from the pinned openers, enters `publication_guard()` through output commit, and closes the handle on every exit. **R066, R116** |

Application interfaces offered to other modules (`engine/results/application/interfaces.py`, Protocols implemented here and wired in `engine/daemon/composition.py`):

```python
class ResultRecorder(Protocol):
    async def open_result(self, trial: TrialRef) -> ResultId: ...  # M07 LaunchRecords.get(trial.run_uid); validates frozen roster
    async def append_task_outcome(self, rid: ResultId, outcome: TaskOutcome, operation_id: str) -> None: ...
    async def append_check_outcomes(self, rid: ResultId, trial: TrialRef, task: TaskId, phase: CheckPhase, checks: Sequence[CheckOutcome], operation_id: str) -> None: ...
    async def append_measurements(self, rid: ResultId, m: MeasurementSet, operation_id: str) -> None: ...  # m includes TrialRef; durable on return
    async def append_hardware_samples(self, rid: ResultId, s: HardwareSamples, operation_id: str) -> None: ...  # explicit TrialRef envelope; shared host series remains experiment-scoped
    async def attach_evidence(self, rid: ResultId, ref: EvidenceRef, operation_id: str) -> None: ...
    async def finalization_receipt(self, run_uid: RunUid, rids: Sequence[ResultId]) -> MeasurementFinalizationReceipt: ...  # M10, after final writes
    async def seal(self, rid: ResultId, status: ResultStatus, receipt: MeasurementFinalizationReceipt) -> None: ...
    async def mark_interrupted(self, rid: ResultId, reason: str, observed_at: datetime, receipt: MeasurementFinalizationReceipt) -> None: ...
    async def append_scheduling(self, rid: ResultId, s: SchedulingRecord, operation_id: str) -> None: ...  # s includes TrialRef
    async def add_review(self, rid: ResultId, review: Review) -> None: ...  # idempotent by review_id + digest
    async def append_run_invalidation(self, invalidation: RunInvalidation) -> RunInvalidation: ...  # run-scoped; no seal/rewrite
    async def finish_run_retention(self, run_uid: RunUid, outcome: TerminalRetention) -> None: ...
    # TerminalRetention: terminal cause, per-result finalization receipts, original-review dispositions and observed end time.
class ImportRegistrar(Protocol):
    async def read_incoming(self, staged_result_dir: Path, staged_run_dir: Path) -> IncomingResult: ...  # M02 parses its result AND shared run files; RecordInvalid(paths, reason)
    async def classify(self, incoming: ValidatedResultBatch, view: PublicationView) -> ImportClassification: ...
    async def prepare(self, tx: TransactionId, batch: ValidatedResultBatch) -> ResultRegistration: ...
    async def commit_view(self, tx: TransactionId) -> None: ...  # participant ready; never publishes independently
    async def rollback(self, tx: TransactionId, token: RegistrationToken) -> None: ...
    # ResultRegistration: tx, immutable intent digest, per-run-binding/result/invalidation tokens, created flags, added/skipped IDs.
    # Same tx + intent returns the original durable receipt, even if M17 never received/journaled it.
    # Changed intent raises ImportIntentConflict; rolled-back entries cannot be prepared again.
class RetainedResultReader(Protocol):
    async def for_template(self, sha256: Sha256, f: ResultFilter | None = None, view: PublicationView | None = None) -> list[EffectiveResult]: ...  # overlay applied; comparable only
    async def get(self, rid: ResultId, view: PublicationView | None = None) -> EffectiveResult: ...
    async def resolve_run(self, reference: str, view: PublicationView | None = None) -> RunUid: ...  # CLI resolver; AmbiguousRun(candidates)
    async def run(self, run_uid: RunUid, view: PublicationView | None = None) -> RetainedRun: ...
    async def export_bundle(self, run_uid: RunUid, rids: Sequence[ResultId], view: PublicationView | None = None) -> ExportBundle: ...  # leased, pinned snapshot; caller MUST close
    async def evidence(self, rid: ResultId, task_id: TaskId | None = None, view: PublicationView | None = None) -> list[EvidenceItem]: ...
    async def read_evidence(self, rid: ResultId, evidence_id: str, view: PublicationView | None = None) -> bytes: ...
class ExportBundle(Protocol):
    template_sha256: Sha256                 # immutable; derived and validated from the pinned RunBinding
    snapshot_digest: Sha256                 # exact pinned run/result/review/invalidation snapshot
    files: tuple[ExportFile, ...]           # confined relative path, digest, size, lease-backed opener
    def publication_guard(self) -> AsyncContextManager[None]: ...  # SnapshotChanged before commit if required versions/readiness differ
    async def close(self) -> None: ...      # idempotent; releases every lease
    async def __aenter__(self) -> ExportBundle: ...
    async def __aexit__(self, exc_type, exc, traceback) -> None: ...  # always closes
class RevisionResults(Protocol):
    async def counts(self, sha256: Sha256, view: PublicationView | None = None) -> ResultCounts: ...  # total/local/imported/latest UID+label
class ArtifactSnapshots(Protocol):
    async def materialize(self, rid: ResultId, dest: Path, view: PublicationView | None = None) -> None: ...  # read-only delivered artifact; explicit trial
```

A caller spanning repositories passes one captured `PublicationView`; omitted views are captured once at application entry, never independently midway through a response. Analysis consumes pinned `EffectiveResult`/`TrialGroup` data rather than reloading M10 working state. Invalidations are persisted and checked at every comparison entry; reports must reject an invalidated scope before publication.

**Export handle lifetime.** Acquisition under one M02 read snapshot verifies readiness and pins the run-binding digest, terminal retention revision, selected fact versions/digests, committed review versions and invalidation revision. Its immutable `template_sha256: Sha256` is derived from the pinned `RunBinding` and validated against every selected result's template identity; a disagreement rejects acquisition. M17 uses this value with the same `PublicationView` to open the approved M01 revision. The `ExportBundle` owns every result/evidence lease behind its file openers. `publication_guard()` reacquires the run mutation lock, verifies binding/retention/facts/invalidation and readiness against those pinned values, and holds that lock through M17's output commit. A changed required version raises `SnapshotChanged`; the caller discards the uncommitted output and may acquire a new handle, never silently repins this one. Later appended reviews do not invalidate its pinned review versions. Invalidation/readiness writers take the same lock; an invalidation after output commit is after this export's linearization point. `close()` or async-context exit releases all leases on success, failure or cancellation; M17 never opens M02 repository files directly. **R116, R134, R153**

**Incoming data ownership.** `read_incoming(staged_result_dir, staged_run_dir)` parses the selected result's M02 record/config/rates/reviews/evidence references plus the shared package `runs/<run_uid>/binding.yaml`, `retention.yaml` and `invalidations/` files. It returns `IncomingResult` containing the parsed result, run binding, terminal retention, invalidations and portable digests, validating their own schema and internal scope consistency. M17 cross-checks the returned shared data across selected results, package manifest and references to build `ValidatedResultBatch`; it does not implement another M02 codec. These portable retained run files belong to M02, separate from M11's local runtime state under `~/.axbenchmark/runs/<run_uid>/`.

**Prepare receipt recovery.** M02 persists immutable intent, exact registration tokens/created flags and participant phase with its prepared data before acknowledging `prepare`. Same-tx/same-intent retry returns that original receipt, including when M17 crashed before its journal receipt append. Different intent fails without mutation. Rollback uses recovered exact tokens, is idempotent, and cannot delete a `created=False` registration. Once a rollback is recorded, recovery uses that receipt/phase directly and never reprepares it. Shared marker publication remains the only visibility boundary.


**Adapters** (`engine/results/adapters/`):

| Adapter | Implements |
|---|---|
| `fs_repository.py` | `ResultRepository` on the layout below, with YAML records (ruamel.yaml), write-to-temp, fsync and rename for every file, and an `fcntl` lock on `results/.lock`. Prepares transaction-tagged immutable records/index overlays under `results/.staging/<transaction_id>/`; visible reads require the shared publication marker, not directory existence or a private index rename. A durable participant receipt preserves intent/tokens/created flags across same-tx retries. `commit_view` fsyncs participant state and acknowledges readiness; rollback removes only token-owned unpublished creations and releases reservations. Published data is never rolled back. |
| `fs_evidence.py` | `EvidenceStore`: SHA-256 per file, chunked reads, resolution confined to the result directory (resolved path must stay under it; links are not followed). |
| `rpc.py` | Maps `results.*` DTOs to use-case inputs and domain results and errors back to DTOs and error codes. The only module file that imports `axbenchmark.api`. |

**Persisted state** (engine-owned; no interface opens these files):

```
~/.axbenchmark/results/
  index.yaml                 visible base + transaction overlays: result ID, RunUid/TrialRef, template, provenance, digests
  runs/<run_uid>/binding.yaml immutable full run binding
  runs/<run_uid>/invalidations/ append-only first-detection evidence
  runs/<run_uid>/retention.yaml durable finalization/review progress and terminal readiness
  .lock
  .staging/<transaction_id>/ prepared imports plus durable participant intent/receipt/phase; recovery follows the shared journal/marker
  <result_id>/
    record.yaml              the four information groups, original status, sealed flag, receipt/facts digest
    config.yaml              resolved configuration exactly as frozen by M07 (display currency and tariff included)
    rates.yaml               RateSnapshot exactly as frozen by M07: display currency, per needed currency per_usd (currency units per 1 USD),
                             source layer, source URL, retrieval date, or missing
    reviews/<review_id>.yaml original and additional reviews
    evidence/  snapshots/    logs, check output, screenshots, task snapshots, with digests in record.yaml
```

Local and imported results share this layout because result ids are global (**R122**). Run state under `~/.axbenchmark/runs/<run_uid>/` belongs to [M11](11-run-orchestration.md); records there are never edited by M02. Analysis, reweighting, analysis tariffs and report generation write nothing under `results/` (**R081, R134**). Before admitting readers, M17/shared publication recovery resolves the journal: unpublished transactions roll back only their exact created tokens; published transactions roll forward cleanup and idempotent event delivery. Never blindly sweep staging or delete a pre-existing registration. Failed rollback blocks startup readiness with data still hidden. M02 loads durable run invalidations before comparison queries; M11 resumes incomplete finalization and marks unsealed results interrupted only with a valid partial-data receipt. Unreadable records remain explicit read failures, never reconstructed or silently repaired.

**Owned processes:** none.

### 2. API surface

All methods are in the `results.*` namespace and have safety class `read`. M02 exposes no command that edits or deletes a retained record; records change only through the application interfaces above, driven by runs, judging and imports.

**Queries**

| Method | Request fields | Response model | Errors |
|---|---|---|---|
| `results.list` | `template_sha256`, `filters: ResultFilters {machine_ids?, configurations?, env_policies?, concurrency?, judge_groups?}` (the shared API DTO, also used by `scoring.*`, `measurements.cost_bases` and `reports.*`; `adapters/rpc.py` maps it to the domain `ResultFilter`), `tariff?: TariffDTO` (analysis tariff: amount per kWh as text, currency), `cursor?`, `limit?` (default 200) | `ResultsPage`: `template: TemplateScopeDTO` (name, revision, built-in, full SHA-256), `counts` (total, local, imported, shown, not comparable), `facets: list[FacetDTO]` (dimension, options with counts; the `judge_groups` facet lists the judge groups), `order: {key, label}`, `rows: list[ResultRowDTO]`, `trial_groups: list[TrialGroupDTO]`, `tariff: AppliedTariffDTO` (`source: "recorded" \| "analysis"`, label, e.g. "Alternative tariff · 0.18 USD/kWh"), `currency: DisplayCurrencyDTO` (`computed_in: "USD"`, `display_currency: str`, the listed runs' frozen display currency, or `"USD"` when they recorded different ones; `mixed: bool`; `label`, e.g. "EUR · rates frozen with each run" or "USD · listed runs use different display currencies"; `missing_rates: list[str]`, the currencies some shown value had no frozen rate for), `notices: list[NoticeDTO]` (M10's codes, e.g. `measurements.no_rate_conversion` naming the currency, `measurements.mixed_display_currency`, `measurements.declared_billing`), `read_failures: list[RecordFailureDTO]` (result id, path, message), `capabilities`, `next_cursor` | `results.unknown_template`, `results.invalid_filter` (with `field`), `results.invalid_tariff` (M10's issues with `field`), `results.store_unreadable` |
| `results.get` | `result_id`, `sections: list["summary" \| "launch" \| "origin" \| "outcomes" \| "reviews" \| "retention"]` | `ResultDetail`: `header` (result ID, full TrialRef, trial count, provenance, machine, run UID/label, harness, model, effort, template, original/effective status, invalidation, retention state), one DTO per requested section, `currency: DisplayCurrencyDTO` (the run's frozen display currency; `mixed` is false), `capabilities` | `results.not_found`, `results.record_unreadable`, `results.store_unreadable` |
| `results.resolve_run` | `reference: str` (UID, label or engine-owned retained-run directory reference) | `RunResolutionDTO`: `run_uid`, `run_label`, origin machine | `results.unknown_run`, `runs.ambiguous_run` (candidate UIDs/origins), `results.store_unreadable` |
| `results.get_run` | `run_uid: RunUid` | `RetainedRunDTO`: `run_uid`, `run_label`, immutable binding digest, terminal retention state, invalidation overlay, origin machine, template scope, `results: list[ResultRowDTO]`, `capabilities` | `results.unknown_run`, `results.store_unreadable` |
| `results.evidence` | `result_id`, `task_id?` | `list[EvidenceItemDTO]`: evidence id, kind (log, check output, screenshot, snapshot, review evidence), explicit TrialRef, task id, verification phase, size, digest | `results.not_found` |
| `results.read_evidence` | `result_id`, `evidence_id`, `offset`, `limit` (max 1 MiB) | `EvidenceChunkDTO`: result ID, resolved TrialRef, evidence ID, media type, text or base64 bytes, `eof`. Text is returned as data; interfaces render it inert. | `results.evidence_not_found`, `results.evidence_outside_result` |

`ResultRowDTO`: `result_id`, `run_uid`, `run_label`, `trial: {run_uid, configuration_id, trial_index}`, `trial_count`, `provenance` (`local` | `imported`), `machine` (id, label), harness/model/effort (requested/effective/verified), environment policy, concurrency, judge group, `original_status`, effective `status`, `invalidation: RunInvalidationDTO | None`, retention state, interruption reason/digests/paths, `comparable`, check summary, `cost: CostDTO`, `elapsed: DurationDTO`, and capabilities. These are M10's authoritative DTOs, copied intact. `cost.amount` carries exact USD accounting; `cost.display: MeasuredDTO` is always present, including for USD and unknown conversion. Unknown exact/value fields are null with source/coverage/limitations, never a missing cost object or invented zero. Preserve basis/basis label, billing/declaration, price source/date, energy scope, tariff/alternative, exact `by_basis`, contributors, conversion, `display_rate: RateUseDTO | None` and all limitations. Display rounding never replaces exact rational values.

`TrialGroupDTO`: run UID/label, configuration ID, ordered result IDs, frozen trial count, observed count/missing indices, M10 `cost: {mean, min, max: CostDTO}` and `time: {mean, min, max: DurationDTO}`, and M06 quality mean/min/max with unknown reason and judge group. Each money projection retains exact/billing/basis/rate metadata and `CostContributorDTO` evidence; mean coefficients are `1/trial_count` and exact `by_basis` amounts sum to that mean. Min/max preserve the selected trial's provenance with M10's whole-group coverage/limitations. Missing/unknown trials produce full unknown projections rather than a surviving-subset range. Page currency comes from the single `display_currency_for` result; cost/time projections arrive unchanged from `MeasurementReader.trial_summary`, quality from `ScoringRules.trial_summary`. M06 applies all-trial eligibility against the frozen roster.

Section DTOs carry the fields drawn on the ResultScreen artboards: `LaunchDTO` (template, SHA-256, baseline, configuration name and fingerprint, frozen config path and YAML text, catalog metadata with the price table's source and date and per account the billing kind as `BillingDTO` ("declared by user" when declared), recorded display currency, `recorded_rates: list[RateUseDTO]` and `missing_rates: list[str]` from the frozen `RateSnapshot`, recorded tariff, trial count, original quality and ranking weights, judge, rubric), `OriginDTO` (source run UID/label, result id, explicit TrialRef, provenance with package and import time, relays, machine id and label, hardware, OS, harness version, started, finished, trial index of count, model and effort requested vs effective, environment policy and limitations, concurrency, credential presence by name, and for a halted result the interruption reason with approved and computed SHA-256 and changed paths), `OutcomesDTO` (per task with explicit TrialRef/task/verification phase: process outcome, `ChecksSummaryDTO`, check list with state, cause and evidence refs, `elapsed: DurationDTO`, tokens in/out, `cost: CostDTO` with complete exact/billing/rate/display metadata, coverage; totals with the same `DurationDTO`/`CostDTO` types; measurement sources and coverage; `eligibility_notes`), `ReviewsDTO` (original and additional reviews with result ID/TrialRef: judge group, judge configuration, reviewed at and on, rubric, raw grades, `weighted` per category and `quality` from M06's rules under the original weights, evidence summary, limitations, judging cost as M10 `CostDTO` outside competitor totals, validity), `RetentionDTO` (status per information group).

**Capability flags** (computed by the engine, rendered by interfaces):

| Flag | On | Reasons when false |
|---|---|---|
| `can_open` | row | `results.record_unreadable` |
| `can_rejudge` | row, detail | `results.no_artifact_snapshot`, `results.not_sealed`, `results.identity_invalidated` |
| `can_export` | row, detail, run | `results.not_sealed`, `results.retention_pending`, `results.record_unreadable`; invalidation does not prevent an inspection export carrying the overlay |
| `can_import` | page | always true for a known template (template mismatches are M17's to report) |
| `can_report` | page, run | `results.empty` (no comparable selection), `results.retention_pending`, `results.identity_invalidated` for an invalidated selected scope |
| `can_telemetry` | detail | `results.no_hardware_samples` (monitoring was off or no sample was retained) |
| `can_set_tariff` | page | `results.no_energy_measurements` (no listed result has an energy observation) |

`can_rejudge` covers only M02's preconditions (a sealed result with a retained artifact snapshot). Judge availability comes from [M12](12-quality-judging.md) in `judging.rejudge_options`.

**Commands and jobs:** none in `results.*`. Import and export are [M17](17-zip-exchange.md) jobs, rejudging is an [M12](12-quality-judging.md) job, report generation is an [M13](13-standalone-html-report.md) job.

**Events** (topic `results`; every payload carries `template_sha256`, `run_uid` and object revision; result events carry `result_id`/`TrialRef`, run/import events carry affected result IDs. Clients use the shared `(epoch, seq)` cursor and never replace newer object revisions with replayed older data):

| Event | Payload | Emitted when |
|---|---|---|
| `results.result.recorded` | result ID, RunUid, RunLabel, TrialRef, template SHA-256, provenance | A local result record is opened at launch. |
| `results.outcome.recorded` | result id, kind (task outcome, checks, measurements, hardware samples, evidence), task id? | A fact is appended during a run. |
| `results.result.sealed` | result id, status, interruption reason? | Execution facts are sealed against a finalization receipt; invalidation is its own run event. |
| `results.run.invalidated` | run UID, invalidation, affected result IDs | First run invalidation is durable, including when all results were sealed. |
| `results.run.retention_ready` | run UID, affected result IDs, terminal retention state | Finalization and original-review dispositions are durable. |
| `results.review.added` | result id, review id, kind, judge group | An original or additional review is retained. |
| `results.import.registered` | template SHA-256, added result ids, skipped identical ids | The shared M01/M02 publication marker commits, never at participant prepare or commit_view. |

**Error codes:** `results.unknown_template`, `results.unknown_run`, `results.retention_pending`, `results.not_found`, `results.invalid_filter`, `results.invalid_tariff`, `results.store_unreadable`, `results.record_unreadable`, `results.evidence_not_found`, `results.evidence_outside_result`. Reason codes used only in capability flags: `results.identity_invalidated`, `results.no_energy_measurements`. Domain errors raised through the application interfaces (`TemplateMismatch`, `NotComparable`, `ResultIdConflict`, `RunBindingConflict`, `TrialBindingConflict`, `ScopeMismatch`, `InvalidationConflict`, `FinalizationReceiptMismatch`, `SnapshotChanged`, `ImportIntentConflict`, `ResultSealed`, `OriginalReviewExists`, `RecordInvalid` from `ImportRegistrar.read_incoming` for a staged record M02 cannot parse) reach users through the calling module's API, for example M17 maps `ResultIdConflict` into its import rejection; collision DTOs carry existing/incoming digests, identifiers and differing paths. CLI label resolution maps `AmbiguousRun` to `runs.ambiguous_run` with candidate UIDs/origins; retained-run operations accept only `run_uid` after `results.resolve_run`.

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `TemplateDirectory.describe` (application interface), `templates.get` | M01 | Template name, revision and built-in flag for the identity bar; M02 stores only the hash. |
| `ScoringRules` (application interface: `measured_order_key`, `weighted_quality`, `eligibility_notes`, `trial_summary`) | M06 | Default row order, weighted grades and Q under original weights, eligibility effects in `results.get`, and each configuration's trial mean and min–max. |
| `CostAnalysis.display_currency_for(pinned_runs)`, `.ranking_cost(result, tariff, display_currency)` and `MeasurementReader.trial_summary(group, tariff, display_currency)` (application interfaces; the single cost and time trial rule), tariff validation behind `results.invalid_tariff` | M10 | The cost shown and ordered for each row: reported cost, verified $0, API-equivalent estimate with price source and date, or (local configuration in a sequential run) energy estimate under the recorded or analysis tariff with its scope. |
| `CurrencyEnergyScreen(mode="analysis")` returning a `TariffChoiceDTO` (recorded or an analysis tariff) | M10 | `e` on ResultsScreen. |
| Rankings tab content, `WeightsScreen`, `ScoreBreakdownScreen` and their `scoring.*` methods | M06 | `#tab-rankings`, `w` and "Score breakdown" on M02 screens. |
| `ResultRecorder` calls: `open_result` (one per trial, with its `TrialRef`), `seal`, `mark_interrupted`, `append_run_invalidation` (one overlay for every trial, even sealed), `finish_run_retention`, `append_task_outcome` | M11 (with M05 process facts) | Launch record, lifecycle and process outcomes; reconciliation on engine start. |
| `LaunchRecords.get(run_uid) -> FrozenLaunch` (application interface) | M07 | The frozen launch copied into each result opened by `open_result(TrialRef)`. |
| `ResultRecorder.append_check_outcomes`, `attach_evidence` | M08 | Check outcomes with causes and evidence. |
| `ResultRecorder.append_measurements`, `.finalization_receipt` | M10 | Durably retain scoped final measurements, cost basis and coverage; return the receipt only after all final writes. |
| `ResultRecorder.append_hardware_samples` | M18 | Hardware samples with coverage. |
| `ResultRecorder.add_review` | M12 | Original and additional reviews with judging cost. |
| `judging.rejudge_options` (query: judges with group label, rubric, session note, estimate, `can_rejudge`), `judging.rejudge` (job) | M12 | RejudgeScreen. |
| `ImportRegistrar.read_incoming(staged_result_dir, staged_run_dir)`, `.classify/prepare/commit_view/rollback`; `RetainedResultReader.export_bundle` | M17 | M02-owned result/shared-run parsing, original prepare receipts, and leased export content with guard/close. |
| `ExchangeScreens.import_results(template_sha256, path?)`, `.export_results(run_uid)` | M17 / M15 route registry | Injected ZIP navigation factories; M17 owns every exchange dialog, view model, widget and `exchange.*` call. M02 supplies only SHA/UID entry arguments and refreshes after publication. |
| `reports.generate` (job → `ReportOutcome`: path, size, result count, judge groups, weights label, `open_attempt`), `reports.reveal` (command, path) | M13 | ReportScreen content and its "Open folder" button; `axbenchmark report`. |
| `events.subscribe`, `jobs.get`, `jobs.cancel`, `job.progress`, `job.finished` | M11 | Live refresh and job tracking. |
| App shell: `app.client`, `.-compact` screen class, TemplateResults → ResultsScreen navigation | M15 | Hosting the screens below. |
| ResultPackageScreen, ImportResultsScreen, ExportResultsScreen and all their states | M17 | Complete ZIP workflow destinations; Results has no exchange host fragment. |
| TaskChecksScreen and `EvidenceViewerScreen` (artboard EvidenceViewer) | M08 | `enter` on `#task-outcomes`, `l`, "Open check log", "Open snapshot", "Open evidence". |
| TelemetryScreen | M18 | `t` from ResultOrigin. |
| MeasurementsScreen, CostBasisScreen | M10 | `m` from ResultOutcomes, `b` from Results. |

### 4. Screens

All screens are views over the DTOs above. View models are frozen dataclasses built by pure functions in `tui/viewmodels/`; they format values (unknown `CostDTO.display.value` → "unknown", `provenance == "imported"` → "↓"), and never sort, filter, score, classify or decide eligibility. `check_action` returns `True`, `False` (hidden) or `None` (dimmed) from capability flags only. Every data widget sits in a `ContentSwitcher` with `#x`, `#x-loading`, `#x-empty` and `#x-error`; an error shows the engine's message and remedy verbatim with a Retry button that repeats the load.

**ResultsScreen** — `tui/screens/results.py`, artboards Results, ResultsTrials, ResultsHalted and ResultsAnalysisTariff (wide/compact variants as cataloged). Pushed with `template_sha256` from TemplateResults (M01). Colliding run labels display origin and UID; selection/actions carry UID/result ID, never label text. Tree, ids and TCSS as in the legend (`#identity-bar`, `#results-tabs`, `#filters` with `#filter-machine`, `#filter-config`, `#filter-env`, `#filter-jobs`, `#filter-judge`, `#results-body`, `#results`, `#result-detail` with `#result-summary` and `#retained`, `.actions`, compact `#summary`).

```python
@dataclass(frozen=True, slots=True)
class ResultsVM:
    identity_bar: str                  # name · revision · full SHA-256 · counts · "same SHA-256 only"
    table_title: str                   # "Results · 12 of 12"
    order_label: str                   # from page.order.label
    filters: tuple[FilterVM, ...]      # dimension, widget id, options "all · 2", selected
    rows: tuple[ResultRowVM, ...]      # result ID, run UID/label+origin (UID visible on label collision), trial "2/3", machine cell, harness, model · effort, env, judge, status, checks, cost, time
    trial_rows: tuple[TrialSummaryVM, ...]   # per configuration with >1 trial: "mean (min–max)" for cost, time, Q, placed after its trials
    tariff_label: str | None           # AppliedTariffDTO.label; class -alternative when source == "analysis"
    currency_label: str                # DisplayCurrencyDTO.label: the runs' frozen display currency, or USD with the mixed-currency note
    body_state: Literal["data", "loading", "empty", "error"]
    read_failures: tuple[str, ...]
    actions: Mapping[str, ActionState]
def build_results_vm(page: ResultsPage) -> ResultsVM: ...
def build_selection_vm(detail: ResultDetail) -> SelectionVM: ...   # #result-summary kv rows, #retained groups, validated-not-certified notice
```

| Event or binding | API call | Result |
|---|---|---|
| mount; `Select.Changed` on a filter | `results.list(template_sha256, filters, tariff)` | `#results` or `#results-empty` ("No results match these filters", "esc Clear filters") or `#results-error`. `read_failures` show as an error notification naming each file; other rows stay listed. Each trial is its own row, followed by its configuration's mean and min–max row; partial cost or time shows ▲ with the engine's coverage text; a row with `comparable == false` shows its interruption reason ("template identity invalidated") and is styled muted. |
| row highlighted (exclusive worker, last wins) | `results.get(result_id, ["summary", "retention"])` | Fills `#result-summary` and `#retained`, or `#summary` in compact. |
| subscription | `events.subscribe(["results"])` on mount, dropped on unmount | `results.result.*`, `results.run.*`, `results.outcome.recorded`, `results.review.added`, `results.import.registered` with this `template_sha256` re-issue `results.list` (debounced 250 ms). |
| `esc` | none | `app.pop_screen`; in the empty state with filters set, clears them and re-issues `results.list`. |
| `1 · 2` | none | `show_tab`; Rankings content is M06's. |
| `f` | none | Focus `#filter-machine` (compact: filter sheet). |
| `o / enter`, `#open-result` | none | Push `ResultScreen(result_id)`; enabled by `can_open`. |
| `j` | none on push; `judging.rejudge(result_id, judge_config_id)` when RejudgeScreen returns a `RejudgeRequest` | Enabled by `can_rejudge`. The new review arrives as `results.review.added`. |
| `i` | none | Invoke injected `ExchangeScreens.import_results(template_sha256)`; enabled by `can_import`. |
| `x` | none | Invoke injected `ExchangeScreens.export_results(run_uid)` for the selected row; enabled by `can_export`. |
| `h` | none | Push M13's ReportGenerateScreen; enabled by `can_report`. Ends in ReportScreen. |
| `w` | none | Push M06's WeightsScreen. |
| `b` | none | Push M10's `CostBasisScreen(template_sha256, filters)`. |
| `e` (`tariff`) | none on push; `results.list(…, tariff)` when M10's `CurrencyEnergyScreen(mode="analysis")` returns a `TariffChoiceDTO` | Analysis tariff: an entered tariff is sent as `tariff` and labelled alternative; choosing "recorded" clears it. The same tariff is part of the analysis selection passed to the Rankings tab (M06) and to `h` (M13). Nothing is written. Enabled by `can_set_tariff`. `results.invalid_tariff` is shown verbatim. |

**ResultScreen** — `tui/screens/result.py`, artboards ResultOrigin, ResultOutcomes (wide and compact), ResultReviews. View model `tui/viewmodels/result.py`: `build_result_vm(detail) -> ResultVM` with `bar`, `definition_rows`, `origin_rows`, `provenance_notice | None`, `task_rows`, `totals_row`, `check_detail`, `coverage_rows`, `grade_rows`, `quality_row`, `review_meta_rows`, `additional_reviews`, `actions`. The tabs are wrapped as `#result-tabs` / `#result-tabs-loading` / `#result-tabs-error` (`results.not_found` and `results.record_unreadable` are errors, not empty).

| Event or binding | API call | Result |
|---|---|---|
| mount | `results.get(result_id, ["launch", "origin", "outcomes", "reviews", "retention"])` | Fills all three tabs; `#provenance-note` only for imported results. `#result-bar` shows the trial ("trial 2 of 3") and, for a halted result, the interruption reason; the Origin tab then lists approved and computed SHA-256 and changed paths. |
| subscription | `events.subscribe(["results"])` | Events for this `result_id` or its `run_uid` (invalidation/readiness) re-issue `results.get`. |
| `esc` | none | Back to ResultsScreen with filters kept. |
| `1 · 2 · 3` | none | `show_tab`. |
| row highlighted in `#task-outcomes` | none | `#check-detail` shows that task's first non-passed check from loaded data. |
| `enter` on `#task-outcomes` | none | Push M08's TaskChecksScreen with `result_id`, its exact `TrialRef`, selected task and verification phase; never default to the live trial. |
| `j`, `#rejudge` | `judging.rejudge` after RejudgeScreen returns | As on ResultsScreen. |
| `x` | none | Invoke injected `ExchangeScreens.export_results(run_uid)` for this result's run; M17 owns result-subset selection and planning. |
| `l`, `#open-log`, "Open snapshot", "Open evidence" | none on push | Push M08's `EvidenceViewerScreen` (artboard EvidenceViewer) with the `EvidenceRef`; it reads through `results.read_evidence`. |
| "Open config YAML" | none | M15's `FileViewScreen` with `launch.frozen_config_yaml` already loaded. |
| "Score breakdown" | none | Push M06's ScoreBreakdownScreen. |
| `m` (Outcomes tab) | none | Push M10's `MeasurementsScreen(result_id)`. |
| `t` (Origin tab) | none | Push M18's `TelemetryScreen(result_id)`; enabled by `can_telemetry`. |

**RejudgeScreen** — `ModalScreen[RejudgeRequest]` in `tui/screens/results.py`, artboard Rejudge. View model `build_rejudge_vm(detail, options)`.

| Event or binding | API call | Result |
|---|---|---|
| mount | `results.get(result_id, ["summary", "reviews"])` and `judging.rejudge_options(result_id)` | `#rejudge-subject`, `#original-review` (judge, date, raw grades, Q from the DTO), `#rejudge-judge` options, `#rejudge-terms` (rubric, session, estimate). |
| `ctrl+s`, `Button #rejudge` | none | `dismiss(RejudgeRequest(result_id, judge_config_id))`; enabled by `judging.rejudge_options.can_rejudge`. The parent issues `judging.rejudge`. |
| `esc` | none | `dismiss(None)`. |

**ZIP navigation destinations (M17-owned).** Results `i` calls `ExchangeScreens.import_results(template_sha256, path?)`; list/detail `x` calls `.export_results(run_uid)`. Factories are injected through M15's route registry; M02 tests exact entry arguments and return/focus/refresh behavior. M17 owns `ResultPackageScreen`, `ImportResultsScreen` and `ExportResultsScreen` in `tui/screens/exchange.py`, their view models in `tui/viewmodels/exchange.py`, ZIP picker and validation widgets, and every load/job/selection action. The [M17 screens contract](17-zip-exchange.md#4-screens) preserves ResultPackagePick/ResultPackage, ResultImport, ResultImportConflict, ResultMismatch, ResultEmbedded and ExportResult states, including all-or-nothing publication, UID-scoped subset planning, empty-selection refusal, invalidation inspection exports and typed failures. M02 renders none of these dialogs or fragments. A published import refreshes Results via `results.import.registered`; a canceled or failed dialog returns without implying registration.

**ReportScreen** — `ModalScreen[None]`, artboard ReportReady. Pushed by M13's ReportProgressScreen with the finished `ReportOutcome`; it makes no load call. View model `build_report_vm(outcome)`: `#report-path` always shows the path, size, result count, judge groups and weights label; the `.notice.-warning` is shown when `open_attempt.opened` is false, with the engine's message. **R035, R134**

| Binding | API call | Result |
|---|---|---|
| `c`, `Button #copy-path` | none | `app.copy_to_clipboard(path)`. |
| `Button #open-folder` | `reports.reveal(path)` | Error shown verbatim if it fails. |
| `esc`, `Button #close` | none | `dismiss(None)`. |

Screens of other modules that consume `results.*`: TemplateResults (M01, `results.list`), Rankings and ScoreBreakdown (M06, through `scoring.*`, which reads M02 via `RetainedResultReader`), TaskChecks and evidence views (M08, `results.get`, `results.read_evidence`), Measurements (M10), TelemetryScreen (M18), ReportGenerateScreen (M13), ResultPackageScreen (M17).

### 5. CLI

| Command | API methods |
|---|---|
| `axbenchmark results import ZIP --template SHA` | `exchange.inspect_results` job, then `exchange.import_results`; prints added and skipped-identical counts from `ImportOutcome`. A conflict or mismatch exits 1 with the typed error. |
| `axbenchmark results export RUN_REF --output PATH` | `results.resolve_run(RUN_REF)` returns one UID, then `exchange.export_results(run_uid, result_ids, path)`; ambiguity lists candidate UIDs/origins. |
| `axbenchmark report RUN_DIR` | `results.resolve_run(RUN_DIR)` returns a UID; `results.get_run(run_uid)` then `reports.generate` only after retention readiness; prints path/open attempt. The CLI never reads `RUN_DIR` itself. |

`--json` prints the response models above. `results.list`, `results.get`, `results.evidence` and `results.read_evidence` have no dedicated command in [M14](14-command-line-interface.md); they are reachable through whatever generic registry access M14 provides.

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain unit | `ComparisonScope.admit` rejects a second hash; machine differences pass. `classify` returns ADD, IDENTICAL, CONFLICT. Payload digest ignores import time, local paths and relays and changes with any grade, measurement or evidence byte. `add_review` keeps the original and rejects a second original. Sealed results reject outcome appends. `Provenance.with_relay` keeps origin and source id. Process and check states stay independent (exit 0 with a failed or unverified check). `Unavailable` observations survive round trips. Facets and filters over the 12-result fixture of `design/wireframe-tui/src/results-data.mjs`. `TrialGroup` groups three trials of one configuration by `(run_uid, configuration_id)` in index order and never joins two runs. `ComparisonScope.admit` raises `NotComparable` for an identity-invalidated result. |
| Use case (fake ports) | `ListResults` orders through a fake `ScoringRules` and reports per-record read failures without failing the page. `PrepareImport` with one conflicting result publishes nothing; a repeated identical batch adds nothing; two distinct runs of one configuration are both kept. `BuildExportBundle` exposes only scoped result/shared-run files and credential presence; guard failure blocks output commit, later review appends preserve pinned versions, and cancellation closes every lease. `MarkInterrupted` invents no outcome. `AppendRunInvalidation` overlays all trials before cleanup, keeps sealed fact digests and completed reviews unchanged, records both SHA-256 values/paths, and `for_template` excludes every associated result. `ListResults` with an analysis tariff passes it to a fake `CostAnalysis`, labels the page alternative and leaves every record byte-identical; over runs frozen with EUR and USD display currencies it shows USD amounts with `mixed: true` and `measurements.mixed_display_currency`, over EUR-only runs it shows EUR with the frozen rates, and a run without a frozen EUR rate shows unknown with `no_rate_conversion`; the `results.list` and `results.get` request models have no currency or rate field; a trial group's summary comes from the fake `ScoringRules.trial_summary`. Events are published once per change. |
| Adapter | `fs_repository` fault injection at prepare, participant commit_view and shared publication proves one cross-store view sees no partial batch; same-tx prepare recovers its original tokens/created flags after a crash before the coordinator journal receipt; rollback never deletes pre-existing data and published transactions roll forward. `fs_evidence` refuses `..` and symlinked paths. |
| API (`InProcessClient`, no interface) | Every `results.*` method against a composed engine with fake producers: response models validate against the exported JSON Schema; typed errors carry stable codes; capability flags and reasons match the scenarios above; `results.read_evidence` returns hostile markup as plain data; subscription with `cursor={epoch, seq}` replays `results.review.added`. With model access disabled, `results.*`, export and report paths succeed and no harness or judge port is called. **R035, R134** |
| Screen (fake client, `App.run_test()` / `Pilot`) | ResultsScreen renders the fixture page with colliding labels distinguished by origin/UID, per-trial rows and mean/min–max rows, switches `#results-body` to empty, loading and error, and dims `j`, `x`, `h`, `e` from capability flags only; `e` returning an analysis tariff re-issues `results.list` with `tariff` and nothing else. Each binding issues exactly the API call in the tables above and no other. ResultScreen keeps process, check and grade columns separate as delivered. Injected M17 factories receive the exact template SHA/run UID; returning from exchange restores focus and only published imports trigger a Results refresh; ReportScreen always shows the path and the warning when `opened` is false. View-model builders are tested without Textual. |
