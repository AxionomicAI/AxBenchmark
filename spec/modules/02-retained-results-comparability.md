# M02 — Retained results, provenance, and comparability

Status: proposed feature contract derived from [the product specification](../SPEC.md). This module specifies behavior to implement, not existing functionality.

## Purpose and boundary

AxBenchmark is a Python terminal application for comparing coding-agent harnesses on multi-step software work. Users reuse a template or create one from a project prompt, run selected harness/model configurations, collect measurements, obtain independent LLM reviews, and generate an interactive report. M02 preserves those outcomes and admits other machines' results only to comparisons with matching template SHA-256 identities. **R002**

Results extend the README methodology: measured cost and time, separate quality assessment, and rankings for different priorities. They describe complete harness/model/environment configurations, not isolated model capability. Independent execution on another machine and ZIP exchange are supported; remote orchestration, hardware provisioning, and native Windows support are outside initial scope. Preserve historical applications, results, and reviews. **R004, R015**

Engineers implementing retention should use this contract to preserve enough information for subsequent inspection, exchange, and analysis. The contract specifies conceptual information and operations. The persistence layout chosen for the engine is recorded under Implementation as an implementation decision; no deletion policy is defined.

## Retained information contract

A template defines the specification, ordered tasks, starting files, acceptance checks, execution protocol, and rubric. A run configuration selects harnesses, providers, models, efforts, environment settings, judge, and weights. Each result records **one configuration on one machine**, linked to its exact template revision. A run identifier identifies the experiment used by run-level operations; a result identifier identifies an individual outcome within it. Distinct runs of an unchanged configuration remain distinct outcomes. **R017, R122**

Retain these linked information groups; they are not a mandated storage schema:

| Group | Required retained information |
|---|---|
| Definition and launch | Approved exact template and full SHA-256; packaged baseline and its identity; resolved configuration; catalog metadata used at launch; original scoring weights. Reusable configurations remain associated with their pinned template revision, with configurations and scoring presets persisted in YAML by [M07](07-run-configuration.md). **R066, R134** |
| Origin and execution | Source result identifier, originating machine identity and label, hardware/OS details, local/imported provenance, harness versions, timestamps, and configuration details sufficient to expose model/effort, environment policy, concurrency, and judge selection. **R066, R116, R124, R143** |
| Measurements and outcomes | Normalized measurements, sources and coverage, cost bases, telemetry limitations, hardware samples, and task outcomes. Preserve process outcomes separately from passed, failed, or unverified acceptance checks, including missing prerequisites and broken verification infrastructure. **R076, R116, R124, R134** |
| Reviews and evidence | Original judge configuration and metadata, raw grades, review evidence and limitations, task evidence, logs, generated artifact/task snapshots, and available commit identities. Keep review grades distinct from process and verification outcomes. **R076, R082, R116, R134, R143** |

Credentials must not appear in exported settings, logs, or reports. Export only the selected run's required records and supporting material, excluding raw credentials and unrelated machine files. Preservation requirements do not authorize copying unrelated directories. **R066, R116**

## Operations and invariants

**Record and inspect.** Accept the frozen launch information and subsequent outcomes from execution, verification, measurement, and judging owners. Retain unavailable or incomplete observations with their coverage rather than inventing values. Every competitor receives identical approved inputs and an independent baseline; retaining or inspecting results must leave the source repository and historical benchmark artifacts untouched. Later analysis uses retained snapshots and the packaged baseline. **R076, R124, R134, R140**

**Import and re-export.** [M17](17-zip-exchange.md) validates packages before results join retained collections. A result ZIP contains the exact template, selected run's records and configuration, machine label and hardware/OS details, harness versions, timestamps, outcomes, measurements with coverage, original weights, judge metadata/grades, snapshots, and evidence, covered by a result-payload file-integrity manifest. Source result identifiers and provenance survive subsequent exports. **R116**

Reimporting the same template or identical result is idempotent. An identical import creates no duplicate; a different payload reusing an existing result identifier is rejected without overwriting the original. Distinct runs are retained even when their configuration matches. Different template hashes never enter one comparison or ranking. Integrity failures are surfaced through M17's rejection behavior without partially adding records. **R122**

Label results as locally produced or imported and retain execution evidence. Matching SHA-256 proves identity of the packaged benchmark definition; payload checks verify packaged data integrity. Neither certifies faithful third-party execution nor authentic measurements. Do not describe validated imports as execution certification. **R123**

**Compare.** Accumulate results for the same template, including compatible imports, and expose machine, harness/model/effort, environment policy, concurrency, and judge filters. Machine differences are intentional comparison inputs, not hash mismatches. Apply one common selected weight set to a combined report while retaining each result's original weights and grades. Keep cost bases, telemetry limitations, measurement conditions, and imported provenance visible; matching hashes do not establish equivalent conditions. **R035, R124, R143**

**Review again explicitly.** [M12](12-quality-judging.md) uses one fresh headless session per artifact, reviews configurations sequentially, and applies the same judge configuration and template rubric throughout a local comparison. Imported reviews retain their original judge details and evidence. An explicit request may add a fresh review with the selected judge, preserving the original and recording additional judging cost separately. Quality and combined rankings remain separate across different judge configurations. **R082, R143**

**Derive outputs.** Reporting, ZIP exchange, and alternative weighting operate from retained data without new model calls. Alternative analysis does not overwrite original results, grades, or weights. Hand accumulated artifact reviews and compatible results to [M13](13-standalone-html-report.md) for report generation; at completion, attempt to open the report and always display its location, including when opening fails. **R035, R124, R134**

## Integration dependencies

[M01](01-template-library-identity.md) supplies immutable template identity; [M16](16-custom-template-planning.md) supplies baseline capture; [M05](05-harness-execution-isolation.md) and [M11](11-run-orchestration.md) supply execution and lifecycle facts. [M08](08-verification-evidence.md), [M10](10-measurements-cost.md), and [M18](18-hardware-monitoring.md) supply evidence and measurement semantics. [M06](06-scoring-rankings.md) computes derived scores; [M15](15-terminal-interface.md) and [M14](14-command-line-interface.md) expose retained-result operations as clients of the engine API and evaluate none of these rules themselves. M02 preserves these distinctions for every consumer.

## Acceptance criteria

- A saved result exposes every retained information group above, including launch catalog metadata, evidence, and independent process/check outcomes. **R066, R076, R116, R134**
- Import/re-export preserves origin and source identifiers; repeated identical imports add nothing, conflicts never overwrite, and separate runs remain distinguishable. **R116, R122, R123**
- Same-template comparisons filter all required dimensions and preserve judge groups, original weights/grades, cost bases, and telemetry limitations. Different hashes cannot mix. **R082, R122, R124, R143**
- With model access unavailable, saved results still support reports, ZIP exchange, and reweighting. Rejudging requires an explicit action, preserves the original review, and accounts for extra cost separately. Report completion attempts opening and always shows the location. **R035, R082, R134**
- Existing repositories and historical applications, results, and reviews remain unchanged after retention, analysis, or exchange. **R015, R140**

## Implementation

Implementation decisions under [the architecture decision](ARCHITECTURE.md). They fix how the contract above is built; they add no product behavior. M02 is the only reader and writer of retained result records. Every other module, and every interface, reaches them through the `results.*` API or through the application interfaces below.

### 1. Engine component

Package `axbenchmark.engine.results`.

**Domain** (`engine/results/domain/`, frozen slotted dataclasses, no I/O):

| Type | Contents and rules |
|---|---|
| `RetainedResult` | Aggregate keyed by `ResultId`. Holds `run_id`, `template: TemplateIdentity` (full SHA-256, from `engine/shared`), the four information groups below, `reviews`, `status`, `sealed: bool` and `payload_digest`. Facts are appended, never replaced: every `append_*` returns a new aggregate whose existing parts are unchanged. A sealed result accepts only `add_review`. **R066, R076, R134** |
| `DefinitionAndLaunch` | Template identity, baseline identity, resolved configuration (frozen YAML text as handed over by M07 and its parsed facets), catalog metadata at launch, original quality and ranking weights, judge configuration. Credentials appear only as `CredentialPresence(name, is_set)`; the type has no value field. **R066** |
| `OriginAndExecution` | `source_result_id`, `origin: MachineIdentity(id, label)`, hardware/OS details, `provenance: Provenance`, harness versions, start/finish timestamps, requested and effective model/effort, environment policy and limitations, concurrency. **R116, R124, R143** |
| `Provenance` | `kind: LOCAL \| IMPORTED`; for imports `ImportOrigin(package_name, imported_at, payload_manifest_digest)` and `relays: tuple[MachineIdentity, ...]`. `with_relay()` appends a relay and never changes `origin` or `source_result_id`. **R116, R123** |
| `TaskOutcome` | `task_id`, `process: ProcessOutcome` (exit status, signal, not started, with cause, and `internal_retries` observed by M05 and recorded by M11) and `checks: tuple[CheckOutcome, ...]`. `CheckOutcome` and its three states `PASSED \| FAILED \| UNVERIFIED` with a cause (missing prerequisite, broken verification infrastructure, `not_run`, …) are [M08](08-verification-evidence.md)'s domain types, imported from `engine.verification.domain`; M02 adds no fourth state. Process and check state are separate fields with no derivation between them. **R076** |
| `Observation[T]` | A measured value or `Unavailable(reason)`, always with `source`, `coverage` and `limitations`. Missing values are retained as `Unavailable`, never defaulted to zero. Used for measurements, costs (with cost basis) and hardware samples. **R124, R134** |
| `Review` | `review_id`, `kind: ORIGINAL \| ADDITIONAL`, judge configuration, raw grades, evidence refs, limitations, judging cost (an `Observation`), reviewed-at and reviewing machine. `RetainedResult.add_review` rejects a second `ORIGINAL` and never removes one. **R082, R143** |
| `ComparisonScope` | One template SHA-256. `admit(result)` raises `TemplateMismatch` for any other hash, so a comparison or ranking input set can only ever contain one hash. Machine differences are facets, not mismatches. **R122, R124** |
| `Facets` / `ResultFilter` | Pure functions computing distinct values and counts for machine, configuration (harness/model/effort), environment policy, concurrency and judge configuration, and matching a result against a filter. **R124** |
| `JudgeGroup` | A judge configuration digest plus a short label assigned in order of first appearance within one `ComparisonScope`, stable across queries. Groups are never merged. **R082, R143** |
| `ImportDisposition` | `classify(existing_digest \| None, incoming_digest) -> ADD \| IDENTICAL \| CONFLICT`. Identical adds nothing; a conflict carries both digests and the differing payload paths. **R122** |
| `RetentionStatus` | Per information group: complete, or partial with the missing items named. Drives the ✓ list in `#retained`. **R134** |
| `ChecksSummary` | Passed, failed and unverified counts for a result or task, plus the not-run count derived from the `not_run` cause of unverified checks. |

The payload digest is SHA-256 over a canonical serialization of the record's four groups and original review plus the per-file digests of its evidence and snapshots, excluding local-only fields (import time, local paths, relays). It is computed at seal or import and used for idempotency only; it is not the result-payload manifest of [M17](17-zip-exchange.md), which M17 builds and checks.

Domain errors: `TemplateMismatch`, `ResultIdConflict`, `ResultSealed`, `OriginalReviewExists`, `ResultNotFound`, `UnknownTemplate`, `UnknownRun`.

**Ports** (`engine/results/ports.py`):

```python
class ResultRepository(Protocol):
    async def index(self) -> ResultIndex: ...                       # rows + per-record read failures
    async def load(self, result_id: ResultId) -> RetainedResult: ...
    async def create(self, result: RetainedResult) -> None: ...      # fails if the id exists
    async def replace(self, result: RetainedResult, expected_version: int) -> None: ...
    async def commit_batch(self, batch: ImportBatch) -> None: ...    # all records appear or none
class EvidenceStore(Protocol):
    async def digest(self, ref: EvidenceRef) -> Sha256: ...
    async def list(self, result_id: ResultId, task_id: TaskId | None) -> list[EvidenceItem]: ...
    async def read(self, result_id: ResultId, evidence_id: str, offset: int, limit: int) -> EvidenceChunk: ...
class TemplateDirectory(Protocol):          # bound to M01's application interface
    async def describe(self, sha256: Sha256) -> TemplateLabel | None: ...   # name, revision, built-in
class ScoringRules(Protocol):               # bound to M06's application interface; pure functions
    def measured_order_key(self, r: RetainedResult) -> SortKey: ...         # highest known cost first, unknown last
    def weighted_quality(self, grades: RawGrades, weights: QualityWeights) -> QualityBreakdown: ...
    def eligibility_notes(self, r: RetainedResult) -> tuple[EligibilityNote, ...]: ...
```

Plus `Clock`, `IdGenerator` and `EventPublisher` from `engine/shared`. M02 evaluates no scoring rule itself; `ScoringRules` is the port through which M06's rules are applied to retained data.

**Application** (`engine/results/application/`), one class per use case:

| Use case | Reached through | Behavior |
|---|---|---|
| `ListResults` | `results.list` | Builds a `ComparisonScope` for the requested hash, applies the filter, orders with `ScoringRules.measured_order_key`, returns rows, facets, counts, capabilities and per-record read failures. |
| `GetResult` | `results.get` | Loads one result and the requested sections; adds `RetentionStatus`, `weighted_quality` for each review under the original weights, and `eligibility_notes`. |
| `GetRun` | `results.get_run` | Resolves a run id or run directory path to the run's retained results. |
| `ListEvidence`, `ReadEvidence` | `results.evidence`, `results.read_evidence` | Lists and reads evidence files of one result in bounded chunks; never resolves a path outside that result's directory. |
| `OpenResult` | `ResultRecorder.open_result` (M11) | Creates a record from the frozen launch handed over at launch. Emits `results.result.recorded`. |
| `AppendFacts` | `ResultRecorder.append_*` (M05/M11, M08, M10, M18) | Appends task outcomes, check outcomes, measurements, hardware samples and evidence refs (digested on append). Emits `results.outcome.recorded`. |
| `SealResult`, `MarkInterrupted` | `ResultRecorder.seal`, `.mark_interrupted` (M11) | Records the final status, computes the payload digest, freezes the record. Interruption is recorded as observed, with no outcome invented. Emits `results.result.sealed`. |
| `AddReview` | `ResultRecorder.add_review` (M12) | Adds the original review, or an additional review beside it with its separate judging cost. Emits `results.review.added`. **R082** |
| `ClassifyIncoming` | `ImportRegistrar.classify` (M17) | Returns an `ImportDisposition` per incoming result already validated by M17. |
| `RegisterImport` | `ImportRegistrar.register` (M17) | Re-classifies under the store lock; any `CONFLICT` rejects the whole batch with nothing written; otherwise commits every `ADD` atomically and skips `IDENTICAL`. Emits `results.import.registered`. **R122** |
| `BuildExportBundle` | `RetainedResultReader.export_bundle` (M17) | Returns the selected run's records, evidence and snapshot refs with digests and preserved provenance, and nothing else: no credentials, no files outside the result directories. **R066, R116** |

Application interfaces offered to other modules (`engine/results/application/interfaces.py`, Protocols implemented here and wired in `engine/daemon/composition.py`):

```python
class ResultRecorder(Protocol):
    async def open_result(self, launch: FrozenLaunch) -> ResultId: ...
    async def append_task_outcome(self, rid: ResultId, outcome: TaskOutcome) -> None: ...
    async def append_check_outcomes(self, rid: ResultId, task: TaskId, checks: Sequence[CheckOutcome]) -> None: ...
    async def append_measurements(self, rid: ResultId, m: MeasurementSet) -> None: ...
    async def append_hardware_samples(self, rid: ResultId, s: HardwareSamples) -> None: ...
    async def attach_evidence(self, rid: ResultId, ref: EvidenceRef) -> None: ...
    async def add_review(self, rid: ResultId, review: Review) -> None: ...
    async def seal(self, rid: ResultId, status: ResultStatus) -> None: ...
    async def mark_interrupted(self, rid: ResultId, observed_at: datetime) -> None: ...
    async def append_scheduling(self, rid: ResultId, s: SchedulingRecord) -> None: ...          # M11, R045
    async def mark_identity_invalidated(self, rid: ResultId, check: IdentityCheck) -> None: ... # M11, R067; never rebinds
class ImportRegistrar(Protocol):
    async def read_incoming(self, staged_result_dir: Path) -> IncomingResult: ...   # M17; M02 parses its own record format
    async def classify(self, incoming: Sequence[IncomingResult]) -> list[ImportDisposition]: ...
    async def register(self, batch: ValidatedResultBatch) -> RegistrationOutcome: ...
class RetainedResultReader(Protocol):
    async def for_template(self, sha256: Sha256, f: ResultFilter | None = None) -> list[RetainedResult]: ...
    async def get(self, rid: ResultId) -> RetainedResult: ...
    async def run(self, run: RunId | Path) -> RetainedRun: ...
    async def export_bundle(self, run: RunId, rids: Sequence[ResultId]) -> ExportBundle: ...  # per file: path, digest, size, opener
    async def evidence(self, rid: ResultId, task_id: TaskId | None = None) -> list[EvidenceItem]: ...   # M08, M13
    async def read_evidence(self, rid: ResultId, evidence_id: str) -> bytes: ...                      # M08, M13; confined to the result
class RevisionResults(Protocol):            # M01 library rows and detail pane
    async def counts(self, sha256: Sha256) -> ResultCounts: ...   # total, local, imported, latest run
class ArtifactSnapshots(Protocol):          # M12 judge sessions
    async def materialize(self, rid: ResultId, dest: Path) -> None: ...   # read-only copy of the delivered artifact
```

**Adapters** (`engine/results/adapters/`):

| Adapter | Implements |
|---|---|
| `fs_repository.py` | `ResultRepository` on the layout below, with YAML records (ruamel.yaml), write-to-temp, fsync and rename for every file, and an `fcntl` lock on `results/.lock`. `commit_batch` stages every record under `results/.staging/<batch>/`, renames each into place, then rewrites `index.yaml` last; a failure before the index rename removes the staged and renamed directories. |
| `fs_evidence.py` | `EvidenceStore`: SHA-256 per file, chunked reads, resolution confined to the result directory (resolved path must stay under it; links are not followed). |
| `rpc.py` | Maps `results.*` DTOs to use-case inputs and domain results and errors back to DTOs and error codes. The only module file that imports `axbenchmark.api`. |

**Persisted state** (engine-owned; no interface opens these files):

```
~/.axbenchmark/results/
  index.yaml                 one row per retained result: id, run, template SHA-256, provenance, facets, payload digest
  .lock
  .staging/<batch_id>/       import batches before commit; swept on engine start
  <result_id>/
    record.yaml              the four information groups, status, sealed flag
    config.yaml              resolved configuration exactly as frozen by M07
    reviews/<review_id>.yaml original and additional reviews
    evidence/  snapshots/    logs, check output, screenshots, task snapshots, with digests in record.yaml
```

Local and imported results share this layout because result ids are global (**R122**). Run state under `~/.axbenchmark/runs/<run_id>/` belongs to [M11](11-run-orchestration.md); records there are never edited by M02. Analysis, reweighting and report generation write nothing under `results/` (**R134**). On engine start M02 sweeps `.staging/`, rebuilds no record and repairs nothing: an unreadable record stays listed as a read failure. M11 decides which open results were interrupted and calls `mark_interrupted`.

**Owned processes:** none.

### 2. API surface

All methods are in the `results.*` namespace and have safety class `read`. M02 exposes no command that edits or deletes a retained record; records change only through the application interfaces above, driven by runs, judging and imports.

**Queries**

| Method | Request fields | Response model | Errors |
|---|---|---|---|
| `results.list` | `template_sha256`, `filters: {machine_ids?, configurations?, env_policies?, concurrency?, judge_groups?}`, `cursor?`, `limit?` (default 200) | `ResultsPage`: `template: TemplateScopeDTO` (name, revision, built-in, full SHA-256), `counts` (total, local, imported, shown), `facets: list[FacetDTO]` (dimension, options with counts), `order: {key, label}`, `rows: list[ResultRowDTO]`, `read_failures: list[RecordFailureDTO]` (result id, path, message), `capabilities`, `next_cursor` | `results.unknown_template`, `results.invalid_filter` (with `field`), `results.store_unreadable` |
| `results.get` | `result_id`, `sections: list["summary" \| "launch" \| "origin" \| "outcomes" \| "reviews" \| "retention"]` | `ResultDetail`: `header` (provenance, machine, run, harness, model, effort, template, status), one DTO per requested section, `capabilities` | `results.not_found`, `results.record_unreadable`, `results.store_unreadable` |
| `results.get_run` | `run` (run id or run directory path) | `RetainedRunDTO`: run id, origin machine, template scope, `results: list[ResultRowDTO]`, `capabilities` | `results.unknown_run`, `results.store_unreadable` |
| `results.evidence` | `result_id`, `task_id?` | `list[EvidenceItemDTO]`: evidence id, kind (log, check output, screenshot, snapshot, review evidence), task id, size, digest | `results.not_found` |
| `results.read_evidence` | `result_id`, `evidence_id`, `offset`, `limit` (max 1 MiB) | `EvidenceChunkDTO`: media type, text or base64 bytes, `eof`. Text is returned as data; interfaces render it inert. | `results.evidence_not_found`, `results.evidence_outside_result` |

`ResultRowDTO`: `result_id`, `run_id`, `provenance` (`local` | `imported`), `machine` (id, label), `harness`, `model`, `effort` (requested, effective, `effective_verified`), `env_policy`, `concurrency`, `judge_group` (label, description), `status`, `checks: ChecksSummaryDTO`, `cost: MoneyObservationDTO | None` with basis, `elapsed: DurationObservationDTO | None`, `capabilities`. Unknown cost and time arrive as `null` with a reason, never as zero.

Section DTOs carry the fields drawn on the ResultScreen artboards: `LaunchDTO` (template, SHA-256, baseline, configuration name and fingerprint, frozen config path and YAML text, catalog metadata, original quality and ranking weights, judge, rubric), `OriginDTO` (source result id, provenance with package and import time, relays, machine id and label, hardware, OS, harness version, started, finished, model and effort requested vs effective, environment policy and limitations, concurrency, credential presence by name), `OutcomesDTO` (per task: process outcome, `ChecksSummaryDTO`, check list with state, cause and evidence refs, elapsed, tokens in/out, cost, coverage; totals; measurement sources and coverage; `eligibility_notes`), `ReviewsDTO` (original and additional reviews: judge group, judge configuration, reviewed at and on, rubric, raw grades, `weighted` per category and `quality` from M06's rules under the original weights, evidence summary, limitations, judging cost, validity), `RetentionDTO` (status per information group).

**Capability flags** (computed by the engine, rendered by interfaces):

| Flag | On | Reasons when false |
|---|---|---|
| `can_open` | row | `results.record_unreadable` |
| `can_rejudge` | row, detail | `results.no_artifact_snapshot`, `results.not_sealed` |
| `can_export` | row, detail, run | `results.not_sealed`, `results.record_unreadable` |
| `can_import` | page | always true for a known template (template mismatches are M17's to report) |
| `can_report` | page, run | `results.empty` |
| `can_telemetry` | detail | `results.no_hardware_samples` (monitoring was off or no sample was retained) |

`can_rejudge` covers only M02's preconditions (a sealed result with a retained artifact snapshot). Judge availability comes from [M12](12-quality-judging.md) in `judging.rejudge_options`.

**Commands and jobs:** none in `results.*`. Import and export are [M17](17-zip-exchange.md) jobs, rejudging is an [M12](12-quality-judging.md) job, report generation is an [M13](13-standalone-html-report.md) job.

**Events** (topic `results`; every payload carries `template_sha256` and `result_id` so subscribers can scope without reading records):

| Event | Payload | Emitted when |
|---|---|---|
| `results.result.recorded` | result id, run id, template SHA-256, provenance | A local result record is opened at launch. |
| `results.outcome.recorded` | result id, kind (task outcome, checks, measurements, hardware samples, evidence), task id? | A fact is appended during a run. |
| `results.result.sealed` | result id, status | A result is sealed or recorded as interrupted. |
| `results.review.added` | result id, review id, kind, judge group | An original or additional review is retained. |
| `results.import.registered` | template SHA-256, added result ids, skipped identical ids | An import batch commits. |

**Error codes:** `results.unknown_template`, `results.unknown_run`, `results.not_found`, `results.invalid_filter`, `results.store_unreadable`, `results.record_unreadable`, `results.evidence_not_found`, `results.evidence_outside_result`. Domain errors raised through the application interfaces (`TemplateMismatch`, `ResultIdConflict`, `ResultSealed`, `OriginalReviewExists`) reach users through the calling module's API, for example M17 maps `ResultIdConflict` into its import rejection; their DTO carries the existing and incoming digests and differing paths.

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `TemplateDirectory.describe` (application interface), `templates.get` | M01 | Template name, revision and built-in flag for the identity bar; M02 stores only the hash. |
| `ScoringRules` (application interface: `measured_order_key`, `weighted_quality`, `eligibility_notes`) | M06 | Default row order, weighted grades and Q under original weights, and eligibility effects in `results.get`. |
| Rankings tab content, `WeightsScreen`, `ScoreBreakdownScreen` and their `scoring.*` methods | M06 | `#tab-rankings`, `w` and "Score breakdown" on M02 screens. |
| `ResultRecorder` calls: `open_result`, `seal`, `mark_interrupted`, `append_task_outcome` | M11 (with M05 process facts) | Launch record, lifecycle and process outcomes; reconciliation on engine start. |
| `ResultRecorder.append_check_outcomes`, `attach_evidence` | M08 | Check outcomes with causes and evidence. |
| `ResultRecorder.append_measurements` | M10 | Normalized measurements, cost basis and coverage. |
| `ResultRecorder.append_hardware_samples` | M18 | Hardware samples with coverage. |
| `ResultRecorder.add_review` | M12 | Original and additional reviews with judging cost. |
| `judging.rejudge_options` (query: judges with group label, rubric, session note, estimate, `can_rejudge`), `judging.rejudge` (job) | M12 | RejudgeScreen. |
| `ImportRegistrar.classify`, `.register`, `RetainedResultReader.export_bundle` (callers) | M17 | Import dispositions, atomic registration, export content. |
| `exchange.inspect_results` (job → `ResultImportPreview` with staging id and per-result dispositions), `exchange.import_results` (command, `staging_id` → `ImportOutcome`), `exchange.plan_result_export` (query → default path, contents, exclusions, `can_export`), `exchange.export_results` (job → written path) | M17 | ImportResultsScreen, ExportResultsScreen, `results import` / `results export`. |
| `reports.generate` (job → `ReportOutcome`: path, size, result count, judge groups, weights label, `open_attempt`), `reports.reveal` (command, path) | M13 | ReportScreen content and its "Open folder" button; `axbenchmark report`. |
| `events.subscribe`, `jobs.get`, `jobs.cancel`, `job.progress`, `job.finished` | M11 | Live refresh and job tracking. |
| App shell: `app.client`, `.-compact` screen class, TemplateResults → ResultsScreen navigation | M15 | Hosting the screens below. |
| ResultPackageScreen, mismatch and embedded-revision states of ImportResultsScreen | M17 | `i` flow before and around M02's states. |
| TaskChecksScreen and `EvidenceViewerScreen` | M08 | `enter` on `#task-outcomes`, `l`, "Open check log", "Open snapshot". |
| TelemetryScreen | M18 | `t` from ResultOrigin. |
| MeasurementsScreen, CostBasisScreen | M10 | `m` from ResultOutcomes, `b` from Results. |

### 4. Screens

All screens are views over the DTOs above. View models are frozen dataclasses built by pure functions in `tui/viewmodels/`; they format values (`None` cost → "unknown", `provenance == "imported"` → "↓"), and never sort, filter, score, classify or decide eligibility. `check_action` returns `True`, `False` (hidden) or `None` (dimmed) from capability flags only. Every data widget sits in a `ContentSwitcher` with `#x`, `#x-loading`, `#x-empty` and `#x-error`; an error shows the engine's message and remedy verbatim with a Retry button that repeats the load.

**ResultsScreen** — `tui/screens/results.py`, artboard Results (wide and compact). Pushed with `template_sha256` from TemplateResults (M01). Tree, ids and TCSS as in the legend (`#identity-bar`, `#results-tabs`, `#filters` with `#filter-machine`, `#filter-config`, `#filter-env`, `#filter-jobs`, `#filter-judge`, `#results-body`, `#results`, `#result-detail` with `#result-summary` and `#retained`, `.actions`, compact `#summary`).

```python
@dataclass(frozen=True, slots=True)
class ResultsVM:
    identity_bar: str                  # name · revision · full SHA-256 · counts · "same SHA-256 only"
    table_title: str                   # "Results · 12 of 12"
    order_label: str                   # from page.order.label
    filters: tuple[FilterVM, ...]      # dimension, widget id, options "all · 2", selected
    rows: tuple[ResultRowVM, ...]      # result, machine cell, harness, model · effort, env, judge, status, checks, cost, time
    body_state: Literal["data", "loading", "empty", "error"]
    read_failures: tuple[str, ...]
    actions: Mapping[str, ActionState]
def build_results_vm(page: ResultsPage) -> ResultsVM: ...
def build_selection_vm(detail: ResultDetail) -> SelectionVM: ...   # #result-summary kv rows, #retained groups, validated-not-certified notice
```

| Event or binding | API call | Result |
|---|---|---|
| mount; `Select.Changed` on a filter | `results.list(template_sha256, filters)` | `#results` or `#results-empty` ("No results match these filters", "esc Clear filters") or `#results-error`. `read_failures` show as an error notification naming each file; other rows stay listed. |
| row highlighted (exclusive worker, last wins) | `results.get(result_id, ["summary", "retention"])` | Fills `#result-summary` and `#retained`, or `#summary` in compact. |
| subscription | `events.subscribe(["results"])` on mount, dropped on unmount | `results.result.*`, `results.outcome.recorded`, `results.review.added`, `results.import.registered` with this `template_sha256` re-issue `results.list` (debounced 250 ms). |
| `esc` | none | `app.pop_screen`; in the empty state with filters set, clears them and re-issues `results.list`. |
| `1 · 2` | none | `show_tab`; Rankings content is M06's. |
| `f` | none | Focus `#filter-machine` (compact: filter sheet). |
| `o / enter`, `#open-result` | none | Push `ResultScreen(result_id)`; enabled by `can_open`. |
| `j` | none on push; `judging.rejudge(result_id, judge_config_id)` when RejudgeScreen returns a `RejudgeRequest` | Enabled by `can_rejudge`. The new review arrives as `results.review.added`. |
| `i` | none | Push M17's ResultPackageScreen for this template; enabled by `can_import`. |
| `x` | none | Push `ExportResultsScreen(run_id)` for the selected row; enabled by `can_export`. |
| `h` | none | Push M13's ReportGenerateScreen; enabled by `can_report`. Ends in ReportScreen. |
| `w` | none | Push M06's WeightsScreen. |
| `b` | none | Push M10's `CostBasisScreen(template_sha256, filters)`. |

**ResultScreen** — `tui/screens/result.py`, artboards ResultOrigin, ResultOutcomes (wide and compact), ResultReviews. View model `tui/viewmodels/result.py`: `build_result_vm(detail) -> ResultVM` with `bar`, `definition_rows`, `origin_rows`, `provenance_notice | None`, `task_rows`, `totals_row`, `check_detail`, `coverage_rows`, `grade_rows`, `quality_row`, `review_meta_rows`, `additional_reviews`, `actions`. The tabs are wrapped as `#result-tabs` / `#result-tabs-loading` / `#result-tabs-error` (`results.not_found` and `results.record_unreadable` are errors, not empty).

| Event or binding | API call | Result |
|---|---|---|
| mount | `results.get(result_id, ["launch", "origin", "outcomes", "reviews", "retention"])` | Fills all three tabs; `#provenance-note` only for imported results. |
| subscription | `events.subscribe(["results"])` | Events for this `result_id` re-issue `results.get`. |
| `esc` | none | Back to ResultsScreen with filters kept. |
| `1 · 2 · 3` | none | `show_tab`. |
| row highlighted in `#task-outcomes` | none | `#check-detail` shows that task's first non-passed check from loaded data. |
| `enter` on `#task-outcomes` | none | Push M08's TaskChecksScreen. |
| `j`, `#rejudge` | `judging.rejudge` after RejudgeScreen returns | As on ResultsScreen. |
| `x` | none | Push `ExportResultsScreen(run_id, preselected=[result_id])`. |
| `l`, `#open-log`, "Open snapshot", "Open evidence" | none on push | Push M08's `EvidenceViewerScreen` with the `EvidenceRef`; it reads through `results.read_evidence`. |
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

**ImportResultsScreen** — `ModalScreen[ImportOutcome]`, artboards ResultImport and ResultImportConflict (M02's states; M17 specifies `#import-steps`, ResultMismatch and ResultEmbedded). Opened by M17's ResultPackageScreen with the `JobRef` of `exchange.inspect_results`. View model `build_import_vm(preview) -> ImportVM` with steps, preview rows (`+ add`, `= identical · skip`), conflict digests and differing paths, `can_add`.

| Event or binding | API call | Result |
|---|---|---|
| job events | `job.progress` / `job.finished` for the inspect job | `#import-steps` while running, then `#import-validated` or, when any disposition is `CONFLICT`, `#import-conflict` with `#conflict-digests`. |
| `ctrl+s`, `Button #add-results` | `exchange.import_results(staging_id)` | `dismiss(ImportOutcome)`; ResultsScreen refreshes from `results.import.registered`. Disabled unless `can_add`. |
| `Button #show-differences` | none | Expands the differing paths already in the preview. |
| `esc`, `Button #close` | none | `dismiss(None)`; nothing was added. |

**ExportResultsScreen** — `ModalScreen[Path | None]`, artboard ExportResult. View model `build_export_vm(run, plan)`.

| Event or binding | API call | Result |
|---|---|---|
| mount | `results.get_run(run_id)` and `exchange.plan_result_export(run_id)` | `#export-selection` (one entry per result with status), `#export-results-path` default, `#export-results-contents` from the plan's contents and exclusions. |
| `space` | none | Toggle a result in the selection. |
| `ctrl+s`, `Button #export-zip` | `exchange.export_results(run_id, result_ids, path)` | Progress from job events; on success `dismiss(path)` and the path is shown. A typed error with `field` marks `#export-results-path`. |
| `esc` | none | `dismiss(None)`. |

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
| `axbenchmark results export RUN_ID --output PATH` | `exchange.export_results` job; M17 reads the bundle from M02. |
| `axbenchmark report RUN_DIR` | `results.get_run(RUN_DIR)` to resolve the run, then `reports.generate`; prints the path and the open attempt from `ReportOutcome`. The CLI passes `RUN_DIR` as given and never reads it. |

`--json` prints the response models above. `results.list`, `results.get`, `results.evidence` and `results.read_evidence` have no dedicated command in [M14](14-command-line-interface.md); they are reachable through whatever generic registry access M14 provides.

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain unit | `ComparisonScope.admit` rejects a second hash; machine differences pass. `classify` returns ADD, IDENTICAL, CONFLICT. Payload digest ignores import time, local paths and relays and changes with any grade, measurement or evidence byte. `add_review` keeps the original and rejects a second original. Sealed results reject outcome appends. `Provenance.with_relay` keeps origin and source id. Process and check states stay independent (exit 0 with a failed or unverified check). `Unavailable` observations survive round trips. Facets and filters over the 12-result fixture of `design/wireframe-tui/src/results-data.mjs`. |
| Use case (fake ports) | `ListResults` orders through a fake `ScoringRules` and reports per-record read failures without failing the page. `RegisterImport` with one conflicting result writes nothing; a repeated identical batch adds nothing; two distinct runs of one configuration are both kept. `BuildExportBundle` excludes files outside result directories and contains only credential presence. `MarkInterrupted` invents no outcome. Events are published once per change. |
| Adapter | `fs_repository` crash injection between staged renames and the index rename leaves the previous index and no visible partial batch after restart. `fs_evidence` refuses `..` and symlinked paths. |
| API (`InProcessClient`, no interface) | Every `results.*` method against a composed engine with fake producers: response models validate against the exported JSON Schema; typed errors carry stable codes; capability flags and reasons match the scenarios above; `results.read_evidence` returns hostile markup as plain data; subscription with `since_seq` replays `results.review.added`. With model access disabled, `results.*`, export and report paths succeed and no harness or judge port is called. **R035, R134** |
| Screen (fake client, `App.run_test()` / `Pilot`) | ResultsScreen renders the fixture page, switches `#results-body` to empty, loading and error, and dims `j`, `x`, `h` from capability flags only. Each binding issues exactly the API call in the tables above and no other. ResultScreen keeps process, check and grade columns separate as delivered. ImportResultsScreen renders add, skip and conflict states from a fake preview; ReportScreen always shows the path and the warning when `opened` is false. View-model builders are tested without Textual. |
