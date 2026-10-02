# M12 — Independent quality judging

Authority: [the product specification](../SPEC.md). This module defines required judging behavior. Its [Implementation](#implementation) section places that behavior in the headless engine fixed by [the architecture decision](ARCHITECTURE.md); the TUI and CLI present the engine's reviews, validation outcomes and judge checks and never evaluate a judging rule themselves.

This proposed contract enables engineers to implement independent reviews of delivered benchmark artifacts. Quality complements the repository README's measured cost/time comparison and rankings for different priorities. It evaluates a complete harness/model/environment configuration on the defined work; it does not establish isolated model capability. These requirements describe intended behavior, not an existing implementation. [R004]

## Judge selection and launch agreement

Users independently choose the judge harness, model, and effort during setup. Preselect a valid saved choice; otherwise preselect the planner configuration if planning was used; otherwise preselect the first selected usable configuration. Preselection remains editable and does not recommend a model's quality. An unusable choice requires resolution before launch rather than silent replacement. [R033, R037]

Use the approved template's rubric and grading profile. Users complete the judge selection, quality-category weights, and cost/time/quality ranking weights before launching. M07 freezes the launch configuration and M06 validates the weights. Every competitor receives the same approved task suite and grading profile; the chosen judge and rubric remain common throughout the local comparison. A competitor's failure does not justify changing its rubric or granting additional repair opportunities during judging. [R033, R037, R082]

## Review inputs and execution

The review operation consumes an identified delivered artifact, its approved specification and source, the template rubric, acceptance results, screenshots, relevant evidence, and the resolved judge configuration. Evidence must remain associated with that artifact so a reader can follow a review's references. These are conceptual inputs; the product contract does not prescribe a transport format or review schema. The format used by the engine is an implementation decision recorded under Implementation. [R083, R084]

Review configurations sequentially, with one fresh headless judge session per delivered artifact. A session receives no earlier artifact's conversation or review. Use anonymous configuration labels where practical. Exclude measured cost, speed, and other competitors' reviews from judge inputs, including evidence excerpts supplied for assessment. Keep the label-to-result association outside the judge's assessment so the application can attach the review to the correct result. [R082, R083]

The judge inspects and assesses; it must never repair the application. UI judging requires a configuration capable of inspecting screenshots. M04 supplies capability information and M07 checks readiness; neither a model name nor unsupported capability assumptions establish screenshot support. If the required capability is unavailable, setup must identify the issue. If inspection or invocation fails during judging, retain the failure and avoid inventing an assessment. [R083, R084]

## Raw review contract and validity

A complete review contains a grade for every rubric category, evidence references, limitations, and comments on code quality, usability or developer experience, and specification adherence. Grades range from 1 through 5 in half-point increments. Apply these anchors consistently: 1 means missing or largely broken, 3 means usable with material gaps, and 5 means excellent for the defined scope. Intermediate grades use the same scope and evidence. [R084]

The application validates the returned review before treating it as graded. Missing categories, out-of-range values, unsupported increments, absent required commentary or evidence references, and otherwise malformed or incomplete responses remain ungraded. Preserve the available review and explain the deficiency; do not fill gaps with averages, zeroes, guesses, or a score inferred from process success. A reported limitation must remain visible with the review. [R084]

Raw category grades are M12's scoring output. M06 computes weighted quality and combined decision scores in the application, using the selected weights. Reweighting consumes retained grades without another judge session or alteration of the original review. Frozen acceptance checks determine task success; passed, failed, and unverified checks remain distinct from process outcomes and judge grades. A favorable quality review cannot turn a failed check or process failure into success. [R004, R144]

## Quality profiles

Frontend and fullstack projects use the web profile preserving the README's categories and defaults. Backend-only projects use the backend profile below. Apply one profile to every configuration within a comparison. The six rows implement R086, R087, R088, R089, R090, and R091 respectively; these default weights are editable through M06. [R085]

| Frontend/fullstack category | Default weight | Backend category | Default weight |
|---|---:|---|---:|
| UX | 25% | Developer experience | 25% |
| Visual quality | 15% | API/interface design | 15% |
| Code quality | 20% | Code quality | 20% |
| Business rules/specification | 25% | Business rules/specification | 25% |
| Robustness | 10% | Robustness | 10% |
| Accessibility | 5% | Operability/documentation | 5% |

## Accumulation, imports, and dependencies

Review each delivered artifact and make reviews available alongside accumulated results for the same template, including compatible imports from other machines. M02 retains the association between template, result, artifact, judge configuration, raw grades, evidence, and limitations. M13 uses those records to generate and open the HTML report; M12 does not need a model call merely to display a saved review. [R035]

Preserve an imported result's original judge configuration and review evidence. Different judge configurations form separate assessment groups for both quality and combined rankings; a matching template does not make different judges equivalent. M06 and M13 must receive the grouping information rather than flattening grades into a single assessment. [R082]

An explicit user request can rejudge an imported artifact with the selected judge. This creates an additional retained review, leaving the original intact. Apply the same fresh-session and evidence rules to the new review. Record its judging cost separately through M10; importing or viewing the artifact does not itself authorize rejudging. [R082]

[M01](01-template-library-identity.md) supplies the frozen rubric and template identity; [M07](07-run-configuration.md) supplies launch choices; [M05](05-harness-execution-isolation.md) supplies headless execution; [M08](08-verification-evidence.md) supplies acceptance evidence; [M02](02-retained-results-comparability.md) supplies retained artifacts and reviews. [M06](06-scoring-rankings.md) computes scores, [M10](10-measurements-cost.md) records separate judging costs, and [M13](13-standalone-html-report.md) presents retained assessments. M12 returns a valid raw review or an explicit ungraded outcome with available evidence and limitations. These boundaries keep review opinions, executable verification, and measured performance independently inspectable. [R004, R082–R084, R144]

## Acceptance criteria

- Exercise saved-choice, planner-choice, and first-selected-usable preselection; confirm user overrides and completed weights before launch. [R033]
- Review multiple artifacts with sequential fresh sessions, identical rubric/profile, practical anonymity, excluded performance/competitor-review inputs, and no application repair. Reject unsupported UI judging. [R037, R082, R083, R085]
- Accept complete half-point grades; leave malformed or incomplete reviews ungraded with their deficiencies visible. Confirm all required commentary and evidence references survive retention. [R084]
- Confirm both profiles match all six category/weight pairs above. Reweighting preserves raw reviews and never changes verification or process outcomes. [R086–R091, R144]
- Inspect compatible imported results, distinct judge groups, and an explicitly added review with its original preserved and additional cost separate; generate the report from retained evidence. [R035, R082]

## Implementation

Implementation decisions under [the architecture decision](ARCHITECTURE.md). They fix how the contract above is built and add no product behavior. M12 owns the judging rules (judge requirement, input filtering, review validation, profiles) and the sequencing of judge sessions. Interfaces reach them only through `judging.*`; other engine modules reach them through the application interfaces below. M12 writes no retained record itself: reviews are handed to [M02](02-retained-results-comparability.md) and judging cost to [M10](10-measurements-cost.md).

### 1. Engine component

Package `axbenchmark.engine.judging`.

**Domain** (`engine/judging/domain/`, frozen slotted dataclasses and enums, no I/O):

| Type or rule | Contents and rules |
|---|---|
| `GradingProfile` | `profile_id` (`web`, `backend`), ordered `categories: tuple[Category(key, label, default_weight), ...]`, `business_category`. The two constants `WEB_PROFILE` and `BACKEND_PROFILE` hold exactly the six rows of the profile table above, in that order. Weights are defaults only; editing belongs to M06. **R085–R091** |
| `Rubric` | Read from the frozen template revision: `profile_id`, `version` (e.g. "web v1"), category keys, anchor text, `project_type`. `Rubric.profile()` resolves the profile; a rubric whose categories do not match its profile is rejected as `RubricInvalid` before any session starts. **R037, R085** |
| `GradeScale` / `Grade` | Scale 1–5, step 1/2, held as `Fraction`. `Grade.parse(raw) -> Grade \| GradeDeficiency` rejects non-numbers, values outside 1–5 and values off the half-step grid; nothing is rounded. `ANCHORS = {1: "missing or largely broken", 3: "usable with material gaps", 5: "excellent for the defined scope"}`. **R084** |
| `JudgeRequirement` | `requirement_for(rubric) -> JudgeRequirement(screenshot_inspection: bool, reason)`. True for the web profile (UI judging). It is checked only against catalog capability data, never against a model name. **R083, R084** |
| `JudgeCheck` | `usable: bool`, the requirement, the capability state as reported by M04 (`supported \| unsupported \| unknown`) with its source, the readiness verdict from M03, and `reasons: tuple[Reason, ...]`. Rule `combine(requirement, capability, readiness)`: unknown is not supported; no other judge is substituted. **R033, R084** |
| `ArtifactLabel` / `LabelMap` | Labels `Artifact A`, `Artifact B`, … assigned in queue order. `LabelMap(label → result_id)` lives only in M12's batch record and is never part of a judge input. **R083** |
| `JudgeInputManifest` | What one session receives: delivered snapshot, approved specification and task prompts with their source, rubric and anchors, acceptance results, screenshots and other evidence items, each with an evidence id. `WITHHELD` is the fixed list returned to interfaces: cost, elapsed time, tokens, pricing, other artifacts' reviews, harness/model/provider/configuration names, the label map. Rule `admit(item) -> Admitted \| Withheld(reason)` rejects measurement fields and other results' reviews by kind. **R082, R083** |
| `redact(text, terms) -> Redacted` | Applied to every evidence excerpt and log line before it enters a manifest: replaces the result's harness, model, provider, configuration and machine names with `[withheld]` and records the count. **R083** |
| `RawReview` | The judge's response as parsed, untrusted: per-category entries (key, value text, evidence references, rationale), comments (`code_quality`, `usability` or `developer_experience`, `specification`), limitations; or `Unparseable(reason)`. |
| `validate_review(raw, rubric) -> GradedReview \| UngradedReview` | `GradedReview` only when every rubric category has a valid `Grade` and at least one evidence reference and all three comments are present. Otherwise `UngradedReview(deficiencies, kept)` where each `Deficiency` is `missing_category`, `unknown_category`, `out_of_range`, `off_half_step`, `missing_evidence_reference`, `missing_comment` or `malformed_response`, with the category or field. `kept` holds every part that was returned, including limitations. No default, average, zero or inference fills a gap. **R084** |
| `ReviewOutcome` | `GRADED`, `UNGRADED(deficiencies)`, `FAILED(cause)` (invocation or inspection failed; no assessment exists), `NOT_JUDGED(cause)` (stopped, or engine interrupted before the session). Never derived from process outcomes or checks. **R084, R144** |
| `JudgingBatch` | `batch_id`, `kind: RUN \| REJUDGE`, `run_id?`, frozen `JudgeSelection` (harness, target, account, model, effort), `Rubric`, ordered `ReviewSlot(label, result_id, status, review_id?)`. Rules: `next_slot()` returns the first queued slot only when no slot is `REVIEWING` (one session at a time); `finish(slot, outcome)`; `stop()` marks every queued or reviewing slot `NOT_JUDGED(stopped)`. A batch's judge and rubric never change after creation. **R082** |
| `JudgeSessionContract` | Fixed facts shown by interfaces: fresh headless session, one artifact, no earlier conversation or review, read-only copy. Returned as data. **R082, R083** |

Domain errors: `RubricInvalid`, `JudgeUnusable(check)`, `BatchNotFound`, `BatchNotRunning`, `ReviewNotFound`, `UnknownProfile`, `RejudgeNotAllowed(reason)`.

**Ports** (`engine/judging/ports.py`):

```python
class JudgeExecution(Protocol):           # bound to M05 HarnessExecution (role=judge)
    async def establish(self, spec: JudgeEnvironmentSpec) -> EstablishedEnvironment: ...  # read-only artifact copy
    async def invoke(self, req: JudgeInvocation) -> InvocationResult: ...                 # JudgingScope(review_id, label)
    async def release(self, environment_id: EnvironmentId) -> CleanupReport: ...
class JudgeResponses(Protocol):
    async def read(self, result: InvocationResult) -> bytes: ...      # final response from the invocation record
class ArtifactSource(Protocol):           # bound to M02 RetainedResultReader + snapshot access
    async def run(self, run_id: RunId) -> RetainedRun: ...
    async def result(self, rid: ResultId) -> RetainedResult: ...
    async def materialize_artifact(self, rid: ResultId, dest: Path) -> SnapshotRef: ...
class RevisionSource(Protocol):           # bound to M01 RevisionReader
    async def open(self, sha: Sha256) -> FrozenRevision: ...          # spec, prompts, rubric
class AcceptanceEvidence(Protocol):       # bound to M08's judge hand-off interface
    async def for_judge(self, rid: ResultId) -> JudgeEvidence: ...        # M08 domain type: check outcomes, screenshots, browser errors; no measurements
class CapabilityCheck(Protocol):          # bound to M04 CheckSelection
    async def check(self, sel: JudgeSelection, require: Sequence[str]) -> CapabilityVerdict: ...
class Readiness(Protocol):                # bound to M03 AssessOperation(operation="judge")
    async def assess(self, sel: JudgeSelection) -> ReadinessVerdict: ...
class ReviewSink(Protocol):               # bound to M02 ResultRecorder.add_review
    async def add(self, rid: ResultId, review: Review) -> None: ...
class JudgingCost(Protocol):              # bound to M10
    async def measure(self, result: InvocationResult, sel: JudgeSelection) -> JudgingMeasurement: ...
    async def estimate(self, sel: JudgeSelection, rubric: Rubric) -> MoneyObservation | None: ...
class QualityRules(Protocol):             # bound to M06 ScoringRules.weighted_quality
    def weighted_quality(self, grades: RawGrades, weights: QualityWeights) -> QualityBreakdown: ...
class BatchStore(Protocol):
    async def save(self, batch: JudgingBatch) -> None: ...
    async def load(self, batch_id: BatchId) -> JudgingBatch: ...
    async def open_batches(self) -> Sequence[JudgingBatch]: ...       # reconciliation on engine start
    async def write_input(self, batch_id: BatchId, label: ArtifactLabel, manifest: JudgeInputManifest) -> Path: ...
```

Plus `EventPublisher`, `Clock` and `IdGenerator` from `engine/shared`. M12 has no port that writes to an artifact snapshot, a check outcome or a measurement, so a judge cannot repair the application and a review cannot change verification. **R083, R144**

**Application** (`engine/judging/application/`), one class per use case:

| Use case | Reached through | Behavior |
|---|---|---|
| `CheckJudge` | `judging.check_judge`, `JudgeRequirements.check` (M07) | Opens the revision, derives `JudgeRequirement`, calls `CapabilityCheck` (with `image_input` when screenshot inspection is required) and `Readiness`, returns `JudgeCheck`. |
| `JudgeRun` | `RunJudging.judge_run` (M11) | After every configuration of a run has ended: reads the run's results and frozen judge selection and rubric from M02, re-checks the judge, creates a `RUN` batch with labels in the run's configuration order, enqueues it. An unusable judge at this point leaves every slot `NOT_JUDGED` with the check's reasons. Emits `judging.batch.started`. **R082** |
| `Rejudge` | `judging.rejudge` (job) | Verifies M02's `can_rejudge` preconditions and `CheckJudge` for the chosen selection, creates a one-slot `REJUDGE` batch and enqueues it. The resulting review is retained beside any existing review. **R082** |
| `ReviewNext` | engine-wide judging worker | Takes the next slot: materializes the artifact into a fresh read-only directory, builds the `JudgeInputManifest` (`admit`, `redact`), establishes the judge environment, invokes one fresh session, reads the response, `validate_review`, measures judging cost, hands the `Review` (outcome, raw grades, evidence references, comments, limitations, raw response and input manifest as review evidence, judging cost) to `ReviewSink`, releases the environment, emits `judging.review.finished`. A failed invocation yields `FAILED` with the harness outcome; no assessment is invented. **R082–R084** |
| `StopJudging` | `judging.stop`, `RunJudging.stop` (M11 `runs.stop`) | Ends the active judge invocation through `JudgeExecution` (M05 `HarnessExecution.stop_invocation`, then `release`), applies `JudgingBatch.stop()`, emits `judging.batch.finished` with `stopped: true`. |
| `GetJudgingStatus` | `judging.status` | Projects a batch (or a run's batch, or "waiting" when the run has none yet) into the status DTO with capabilities. |
| `GetReview` | `judging.review` | Loads a review through `ArtifactSource`, adds anchors, profile weights and, for a graded review, Q from `QualityRules` under the result's original quality weights. |
| `ListProfiles`, `GetProfile` | `judging.profiles`, `judging.get_profile`, `ProfileCatalog` (M06), `RubricIndex` (M01) | Return the two profiles, the scale and anchors, and the active profile of a template. |
| `RejudgeOptions` | `judging.rejudge_options` | The selected judge for the result's template with its `JudgeCheck`, the judge group it would join, rubric, session contract and cost estimate. |
| `ReconcileBatches` | engine start | A slot left `REVIEWING` by a previous engine becomes `NOT_JUDGED(engine_interrupted)`; queued slots stay queued and the worker resumes the queue. No partial response is graded. |

One asyncio worker task in the engine runs `ReviewNext` for all batches in FIFO order, so at most one judge session exists at any time, across runs and rejudge requests. **R082**

Application interfaces offered to other modules (`engine/judging/application/interfaces.py`):

```python
class RunJudging(Protocol):              # M11
    async def judge_run(self, run_id: RunId) -> BatchId: ...
    async def stop(self, batch_id: BatchId) -> StopReport: ...
    async def batch_for_run(self, run_id: RunId) -> BatchId | None: ...
class JudgeRequirements(Protocol):        # M07 setup validation and launch
    async def check(self, template: Sha256, judge: JudgeSelection) -> JudgeCheck: ...
class ProfileCatalog(Protocol):          # M06 GradingProfiles adapter
    def get(self, profile_id: str) -> GradingProfile: ...
class RubricIndex(Protocol):             # M01 template summary
    def summary(self, rubric: RubricDefinition) -> RubricSummary: ...   # profile id, version, category count
class RubricSource(Protocol):            # M16 planned templates, M09 package tests
    def for_project_type(self, project_type: ProjectType) -> RubricRef: ...   # packaged rubric for a profile
    def parse(self, document: bytes) -> RubricDefinition: ...                 # raises RubricInvalid
```

**Adapters** (`engine/judging/adapters/`):

| Adapter | Implements |
|---|---|
| `harness_judge.py` | `JudgeExecution` over M05's `HarnessExecution`: `Role.judge`, `JudgingScope(review_id, label)`, payload paths from `BatchStore.write_input`, a workspace that is the read-only artifact copy, permission profile denying writes outside a scratch directory. |
| `response_reader.py` | `JudgeResponses`: extracts the final message from the invocation record. The judge prompt asks for one JSON document matching `review.schema.json` (categories, grades as strings, evidence references by evidence id, comments, limitations); `domain.parse_raw_review` turns it into `RawReview` or `Unparseable`. The schema and prompt are files in `engine/judging/adapters/prompts/`. |
| `results_bridge.py` | `ArtifactSource`, `ReviewSink` over M02's application interfaces. |
| `revision_bridge.py`, `evidence_bridge.py`, `catalog_bridge.py`, `readiness_bridge.py`, `cost_bridge.py`, `scoring_bridge.py` | The remaining ports over M01, M08, M04, M03, M10 and M06 application interfaces. |
| `fs_batches.py` | `BatchStore` (YAML, write-to-temp and rename). |
| `rpc.py` | Maps `judging.*` DTOs to use cases and domain results and errors to DTOs and error codes; registers the snapshot provider for the `judging` topic with M11's subscription service. The only module file importing `axbenchmark.api`. |

**Persisted state** (engine-owned):

```
~/.axbenchmark/judging/
  <batch_id>/
    batch.yaml               kind, run or result id, judge selection, rubric ref, slots and outcomes
    labels.yaml              label → result id; never copied into an input directory
    <label>/input/           payload given to the session: manifest.json, prompt, schema, evidence copies
    <label>/artifact/        read-only copy of the delivered snapshot; removed after release
    <label>/invocation/      M05 invocation record and log for the judge session
```

Retained reviews, their raw responses and input manifests live in M02's `results/<result_id>/reviews/` once handed over; `judging/` is working state and is not exported.

**Owned processes:** the judging worker task. Judge harness processes are started through M05 and are children of `axbenchmarkd`; closing a client never reaches them. Only `StopJudging` (from `judging.stop` or M11's `runs.stop`) ends an active session early.

### 2. API surface

Namespace `judging.*`. DTOs in `axbenchmark.api.judging`.

**Queries** (safety class `read`)

| Method | Request fields | Response model | Errors |
|---|---|---|---|
| `judging.status` | `batch_id?` or `run_id?` (exactly one) | `JudgingStatus`: `batch_id?`, `kind`, `run_id?`, `state: waiting \| queued \| running \| finished \| stopped`, `judge: JudgeSelectionDTO`, `rubric: RubricRefDTO` (profile, version), `session_contract: list[str]`, `rows: list[ReviewRowDTO]`, `current: CurrentSessionDTO \| None`, `inputs: InputManifestDTO \| None`, `counts` (graded, ungraded, failed, not judged, queued), `ungraded_notice: UngradedNoticeDTO \| None`, `capabilities`, `seq` | `judging.unknown_batch`, `judging.unknown_run`, `judging.invalid_request` |
| `judging.review` | `review_id` | `ReviewDetail`: `review_id`, `result_id`, `run_id`, `provenance`, `label`, `configuration` (shown to the user only), `judge_group` (label, judge), `rubric`, `outcome: graded \| ungraded \| failed \| not_judged`, `grades: list[GradeRowDTO]`, `quality: QualityDTO \| None` (graded only, from M06, labelled as computed), `comments` (code quality, usability or developer experience, specification; each `str \| None`), `limitations: list[str]`, `validation: list[ValidationRowDTO]`, `comment_checks`, `consequences: list[str]`, `record` (judge, effort, session, reviewed at, elapsed, judging cost, evidence counts), `raw_response: EvidenceRefDTO`, `evidence: list[EvidenceRefDTO]`, `capabilities` | `judging.review_not_found` |
| `judging.profiles` | `template_sha256?` | `Profiles`: `profiles: list[ProfileDTO]` (profile id, label, categories with key, label, default weight), `active_profile_id?`, `rubric?`, `scale` (min, max, step), `anchors: list[AnchorDTO]`, `notes: list[str]` | `judging.unknown_template` |
| `judging.get_profile` | `profile_id` | `ProfileDTO` | `judging.unknown_profile` |
| `judging.check_judge` | `template_sha256`, `judge: JudgeSelectionDTO` (harness, target, account id, model id, effort `{explicit} \| "harness_default"`) | `JudgeCheckDTO`: `usable`, `requirement` (screenshot inspection, reason), `capability` (image input state, source), `readiness` (rows from M03), `reasons: list[ErrorInfo]` | `judging.unknown_template`, `judging.rubric_invalid` |
| `judging.rejudge_options` | `result_id` | `RejudgeOptions`: `subject`, `judges: list[JudgeOptionDTO]` (judge config id, selection, group label it joins, `check: JudgeCheckDTO`), `rubric`, `session_contract`, `estimate: MoneyObservationDTO \| None`, `group_note`, `capabilities` | `judging.result_not_found` |

`ReviewRowDTO`: `label`, `result_id`, `configuration` (user-visible), `status: queued \| reviewing \| graded \| ungraded \| failed \| not_judged`, `grades: list[str \| None]` in profile order (as returned; an ungraded row shows what came back), `elapsed: DurationObservationDTO \| None`, `judging_cost: MoneyObservationDTO \| None` (partial while reviewing, marked `so_far`), `review_id?`, `failure: ErrorInfo \| None`, `capabilities`.
`CurrentSessionDTO`: `label`, `index`, `count`, `invocation_id`, `pid`, `history: "none"`, `started_at`, `activity: list[ActivityDTO]` (from M05 actions in this `JudgingScope`, redacted), `progress: ObservedFraction \| None` (screenshots opened of those given, when the harness exposes file reads; otherwise `None`).
`InputManifestDTO`: `given: list[InputItemDTO]`, `withheld: list[str]` (the fixed `WITHHELD` list), `redactions: int`.
`GradeRowDTO`: `key`, `label`, `value: str \| None`, `anchor_steps: float \| None`, `default_weight`, `weight` (original, normalized, from the result's frozen weights), `evidence_refs: list[EvidenceRefDTO]`, `rationale`.
`ValidationRowDTO`: `category`, `returned: str \| None`, `evidence_count`, `deficiency: {code, message} \| None`.

**Capability flags**

| Flag | On | Reasons when false |
|---|---|---|
| `can_open` | status row | `judging.review_pending` (queued or reviewing), `judging.not_judged` |
| `can_stop` | status | `judging.not_running` |
| `can_open_evidence` | review | `judging.no_evidence` |
| `can_breakdown` | review | `judging.review_ungraded`, `judging.review_failed` |
| `can_rejudge` | rejudge options, per judge | M02's `results.*` reasons, `judging.judge_unusable`, `judging.screenshot_inspection_unsupported`, `judging.screenshot_inspection_unknown`, `environment.*` and `catalog.*` reasons passed through |

**Commands**

| Method | Request | Response | Errors | Safety |
|---|---|---|---|---|
| `judging.stop` | `batch_id` | `StopReport`: labels left not judged, cleanup report | `judging.unknown_batch`, `judging.not_running` | destructive |

**Jobs**

| Method | Request | Finished payload | Errors | Safety |
|---|---|---|---|---|
| `judging.rejudge` | `result_id`, `judge_config_id` | `RejudgeOutcome`: `review_id`, `outcome`, `judge_group`, `judging_cost` | `judging.result_not_found`, `judging.rejudge_not_allowed` (with M02's reason), `judging.judge_unusable` (with the `JudgeCheckDTO`), `judging.screenshot_inspection_unsupported`, `judging.screenshot_inspection_unknown` | write |

The job's `JobRef.id` is the batch id, so `judging.status(batch_id)`, `jobs.get` and `jobs.cancel` (which issues `StopJudging`) all address it. A run's judging batch is not a client job: M11 starts it and `runs.stop` or `judging.stop` ends it.

**Events** (topic `judging`; payloads carry `batch_id`, `run_id?` and `seq`):

| Event | Payload | Emitted when |
|---|---|---|
| `judging.batch.started` | kind, run id or result id, labels, judge, rubric | A batch is created. M11 run views switch to JudgingScreen on it. |
| `judging.review.started` | label, result id, review id, invocation id, index, count | A fresh session starts for one artifact. |
| `judging.review.progressed` | label, `ActivityDTO`, `progress?` | A redacted judge action is observed (at most every 500 ms). |
| `judging.review.finished` | label, result id, review id, outcome, grades as returned, elapsed, judging cost, deficiencies summary | The review is validated and handed to M02. |
| `judging.batch.finished` | counts, `stopped: bool` | The last slot ends or the batch is stopped. |

M02 additionally emits `results.review.added` once the review is retained.

**Error codes:** `judging.invalid_request`, `judging.unknown_batch`, `judging.unknown_run`, `judging.unknown_template`, `judging.unknown_profile`, `judging.review_not_found`, `judging.result_not_found`, `judging.rubric_invalid`, `judging.not_running`, `judging.judge_unusable`, `judging.screenshot_inspection_unsupported`, `judging.screenshot_inspection_unknown`, `judging.rejudge_not_allowed`. Deficiency codes in `ValidationRowDTO` (`judging.deficiency.missing_category`, `.unknown_category`, `.out_of_range`, `.off_half_step`, `.missing_evidence_reference`, `.missing_comment`, `.malformed_response`) are data, not RPC errors; so are session failures (`ReviewRowDTO.failure`, carrying M05's `harness.*` codes).

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `RevisionReader.open` (application interface) | M01 | Approved specification, prompts, rubric and project type of the frozen revision. |
| `RetainedResultReader.run`, `.get` (application interface) | M02 | Results of a run, frozen judge selection, rubric reference and original quality weights from `DefinitionAndLaunch`, existing reviews and judge groups. |
| `ArtifactSnapshots.materialize(rid, dest)` (application interface) | M02 | Read-only copy of a sealed result's delivered artifact for the judge. |
| `ResultRecorder.add_review` | M02 | Retain the original or additional review with raw response, input manifest and judging cost. |
| `results.get(result_id, ["reviews"])`, `results.read_evidence`, `can_rejudge` flag, event `results.review.added` | M02 | ResultReviews and RejudgeScreen context; reading raw responses and evidence from M12 screens. |
| `CheckSelection` application interface, `catalog.check_selection(require=["image_input"])` | M04 | Screenshot-inspection capability; `catalog.capability_unsupported` / `catalog.capability_unknown` are mapped to the `judging.screenshot_inspection_*` reasons. |
| `AssessOperation(operation="judge")`, `environment.assess` | M03 | Judge harness readiness. |
| `HarnessExecution.establish`, `.invoke`, `.release`, `.stop_invocation` (for `judging.stop`) with `Role.judge` and `JudgingScope` | M05 | Fresh headless judge sessions. |
| `harness.invocation.get`; events `harness.action.observed`, `harness.task.started`, `harness.task.exited` in `JudgingScope` | M05 | Current-session pid and activity on JudgingScreen. |
| `AcceptanceEvidence.for_judge(rid) -> JudgeEvidence` (check outcomes, screenshots, browser errors, no measurements) | M08 | Acceptance results and screenshots for the input manifest. **R075** |
| Evidence viewer screen and JudgeInputScreen | M08 | `e` and `r` on review screens. |
| `JudgingCostAccounting.measure(invocation_id)` and `.estimate(selection, result_id)` | M10 | Separate judging cost and elapsed per review; rejudge estimate. **R082** |
| `ScoringRules.weighted_quality` | M06 | Q row on ReviewScreen under original weights. |
| `ScoreBreakdownScreen`, `WeightsScreen` | M06 | `b` on ReviewScreen, `w` on ProfilesScreen. |
| `SavedJudges.for_template(sha)` (application interface) | M07 | Options in `judging.rejudge_options`. |
| `JudgeRequirements.check` callers; SetupScreen pushing JudgeCapabilityScreen and JudgeScreen | M07 | Launch blocked on an unusable judge; preselection order stays M07's. **R033** |
| `RunJudging.judge_run` call after every configuration ended; `runs.stop` calling `RunJudging.stop`; run state showing the judging phase | M11 | Starting and stopping a run's judging. |
| `events.subscribe`, `jobs.get`, `jobs.cancel`, `job.progress`, `job.finished` | M11 | Subscriptions and the rejudge job. |
| `OverrideScreen` | M04 | "Override catalog…" on JudgeCapabilityScreen. |
| App shell, `.-compact` screen class, shared modal styles | M15 | Hosting the screens. |

### 4. Screens

All M12 screens are views over the DTOs above. View models are frozen dataclasses built by pure functions in `tui/viewmodels/judging.py`; they format values (grades as given, `None` cost → "unknown", `so_far` → "so far") and never validate grades, compute Q, decide eligibility or choose a judge. `check_action` reads capability flags only (`False` hides, `None` dims). Each data widget sits in a `ContentSwitcher` with `#x`, `#x-loading`, `#x-empty`, `#x-error`; errors show the engine's message and remedy verbatim with Retry.

**JudgingScreen** — `JudgingScreen(Screen)` in `tui/screens/judging.py`, artboards Judging (wide, compact) and JudgingDone. Constructor `JudgingScreen(run_id: str | None = None, batch_id: str | None = None)`. Pushed by M11's run view on `judging.batch.started`, or from a run in its judging phase. Tree and TCSS as in the legend: `Static #judging-bar`, `DataTable #reviews .bordered` (cursor_type row), `Vertical #current .pane` with `ProgressBar`, `Static #inputs .pane` (`.-withheld` items dimmed), `Static #ungraded.notice.-error` and `Button #open-ungraded` in the finished state; `Screen.-compact #current { display: none; }`.

```python
@dataclass(frozen=True, slots=True)
class JudgingVM:
    bar: str                                  # "Reviewing artifact 3 of 4 · judge … · rubric web v1 · one fresh session per artifact, in order"
    rows: tuple[ReviewRowVM, ...]             # label, status glyph+text, configuration, grades "4.5 4.0 …", time, judging cost
    cursor_row: int | None                    # current or first ungraded row
    current: CurrentVM | None                 # session kv rows, activity lines, progress (None → indeterminate)
    inputs_given: tuple[str, ...]
    inputs_withheld: tuple[str, ...]
    ungraded: UngradedNoticeVM | None         # title + engine message; shown only when present
    body_state: Literal["data", "loading", "empty", "error"]
    actions: Mapping[str, ActionState]        # open_review per row, stop_judging
def build_judging_vm(status: JudgingStatus) -> JudgingVM: ...
def apply_judging_event(vm: JudgingVM, event: JudgingEvent) -> JudgingVM | Reload: ...
```

| Event or binding | API call | Result |
|---|---|---|
| mount | `judging.status(run_id or batch_id)` | `#reviews` populated; `#reviews-loading` ("Preparing anonymous labels…"); `#reviews-empty` when `state == "waiting"` ("Nothing to review yet"); `#reviews-error` on a typed error. JudgingDone is the same screen with `state == "finished"` and `ungraded_notice` set. |
| subscription | `events.subscribe(["judging", "harness"], since_seq=status.seq)` filtered to this batch and its `JudgingScope`; dropped on unmount | `judging.review.progressed` and `harness.action.observed` update `#current`; `judging.review.started/finished`, `judging.batch.finished` re-issue `judging.status` (debounced 250 ms). |
| `enter` (`open_review`) | none on push | `ReviewScreen(review_id)` for a graded row, `UngradedReviewScreen(review_id)` for ungraded or failed; enabled by the row's `can_open`. |
| `Button #open-ungraded` | none on push | `UngradedReviewScreen(ungraded_notice.review_id)`. |
| `p` (`profiles`) | none on push | `ProfilesScreen(template_sha256)`. |
| `d` (`detach`) | none | Unsubscribe and `app.pop_screen`; judging continues. |
| `s` (`stop_judging`) | `judging.stop(batch_id)` after M15's `ConfirmScreen` returns `True` (destructive methods are issued only from a confirming modal) | Remaining rows become not judged from the response and events; enabled by `can_stop`. |
| `tab` | none | Focus `#reviews` → `#current` → `#inputs` (compact: `#reviews` → `#inputs`). |

**ReviewScreen** — `ReviewScreen(Screen)` in `tui/screens/judging.py`, artboard ReviewDetail; also pushed from M02's ResultReviews. Tree: `Static #review-bar`, `DataTable #grades .bordered`, `VerticalScroll #comments .pane`, `Static #review-meta .pane.kv`, `Horizontal .actions`. View model `build_review_vm(detail: ReviewDetail) -> ReviewVM` with `bar`, `grade_rows` (category, grade, anchor bar from `anchor_steps`, weight, evidence refs, rationale), `quality_row` (from `detail.quality`, labelled "computed by AxBenchmark"), `comments` (three sections), `meta_rows`, `limitations`, `actions`.

| Event or binding | API call | Result |
|---|---|---|
| mount | `judging.review(review_id)` | `#grades`, `#comments`, `#review-meta`; `#grades-error` for `judging.review_not_found`. No subscription: a retained review never changes. |
| `esc` | none | `app.pop_screen`. |
| `e` (`evidence`), "Open evidence" | none on push | M08's evidence viewer with `detail.evidence`; it reads through `results.read_evidence`. Enabled by `can_open_evidence`. |
| `b` (`breakdown`), "Score breakdown" | none on push | M06's `ScoreBreakdownScreen(result_id, judge_group)`; enabled by `can_breakdown`. |
| `r` (`raw`), `Button #raw` | none on push | Evidence viewer on `detail.raw_response`. |

**UngradedReviewScreen** — `ModalScreen[None]` in `tui/screens/judging.py`, artboard ReviewUngraded, over JudgingScreen. Tree `Vertical #ungraded-review .dialog` with `DataTable #validation`, `Static #kept .kv`, `Static #consequences`, `.dialog-actions` (`Button #raw`, `Button #close`). View model `build_ungraded_vm(detail) -> UngradedVM`: validation rows from `detail.validation` (deficiency message shown as returned, deficient cells styled from the presence of `deficiency`), kept rows (comment checks, limitations, raw response path), consequences from `detail.consequences`.

| Event or binding | API call | Result |
|---|---|---|
| mount | `judging.review(review_id)` | Fills `#validation`, `#kept`, `#consequences`. |
| `r`, `Button #raw` | none on push | Evidence viewer on `raw_response`. |
| `esc`, `Button #close` | none | `dismiss(None)`. |

**ProfilesScreen** — `ModalScreen[None]` in `tui/screens/judging.py`, artboard RubricProfiles. Tree `Vertical #profiles .dialog` with `DataTable #profile-table`, `Static #profile-notes .kv`, `.dialog-actions`. View model `build_profiles_vm(p: Profiles) -> ProfilesVM`: two-column rows paired by position, `this_run` (active profile and rubric), scale, anchors, notes.

| Event or binding | API call | Result |
|---|---|---|
| mount | `judging.profiles(template_sha256)` | Table and notes. |
| `w`, "Quality weights…" | none on push | M06's `WeightsScreen(context="analysis", template_sha, profile_id, judge_group=None, initial=…)`; M12 applies nothing. |
| `esc`, "Close" | none | `dismiss(None)`. |

**JudgeCapabilityScreen** — `ModalScreen[Action]` in `tui/screens/setup.py`, artboard JudgeCapability. Pushed by M07's SetupScreen when its validation returns `judging.screenshot_inspection_unsupported` or `judging.screenshot_inspection_unknown` for the judge. Tree `Vertical #judge-capability .dialog` with `Static .notice.-error`, `Static #capability .kv`, `.dialog-actions` (`Button #override`, `Button #choose-judge`). View model `build_judge_capability_vm(template, check: JudgeCheckDTO)`: notice title from the first reason, kv rows Template, Needs (`requirement.reason`), Catalog (`capability`), Readiness (`readiness`).

| Event or binding | API call | Result |
|---|---|---|
| mount | `judging.check_judge(template_sha256, judge)` | Fills `#capability`; if `usable` is now true, the screen dismisses with `Action.RECHECK`. |
| `j`, `Button #choose-judge` | none | `dismiss(Action.CHOOSE_JUDGE)`; SetupScreen pushes M07's JudgeScreen. No judge is substituted. |
| "Override catalog…" | none | `dismiss(Action.OVERRIDE_CATALOG)`; SetupScreen pushes M04's override screen, then re-validates. |
| `esc` | none | `dismiss(Action.BACK)`. |

Screens of other modules that consume `judging.*`: RejudgeScreen (M02: `judging.rejudge_options` on mount; its parent issues `judging.rejudge`), ResultReviews (M02: pushes ReviewScreen), JudgeScreen and SetupScreen (M07: `judging.check_judge` per candidate, through M07's own validation), JudgeInputScreen (M08: shows the hand-off M12 consumes), Rankings (M06: profiles via `judging.get_profile`), M11's run view (switches to JudgingScreen on `judging.batch.started`).

### 5. CLI

| Command | API methods |
|---|---|
| `axbenchmark run --config … --no-tui` | After execution, prints judging progress from `judging.batch.started`, `judging.review.started`, `judging.review.finished` (label, outcome, grades, judging cost) and `judging.batch.finished`. Ctrl-C detaches; judging continues. |
| `axbenchmark --attach RUN_ID` | Subscription includes topic `judging`; an attach during the judging phase starts from `judging.status(run_id=…)`. |
| `axbenchmark status RUN_ID` | `judging.status(run_id=…)` alongside `runs.status`: per label status, outcome, grades, deficiencies, failures. |
| `axbenchmark stop RUN_ID` | `runs.stop` (M11), which calls `RunJudging.stop` for a run in its judging phase. |

`judging.rejudge`, `judging.review`, `judging.profiles` and `judging.check_judge` have no dedicated signature in [M14](14-command-line-interface.md); they are reachable through M14's generic registry access, with `--json` printing the response models.

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain unit | Both profile constants equal the six category/weight pairs of the table. `Grade.parse` accepts 1.0–5.0 in 0.5 steps and rejects 0.5, 5.5, 3.7, "four" without rounding. `validate_review` on the ungraded fixture of `screens-judging.mjs` (missing Accessibility, Robustness 3.7, Visual quality without evidence, missing specification comment) returns exactly those deficiencies and keeps every returned part and limitation; a complete fixture returns `GradedReview`. `requirement_for` returns screenshot inspection for the web profile; `combine` treats unknown capability as unusable. `admit` withholds measurements and other reviews; `redact` removes configuration names. `JudgingBatch.next_slot` never returns a second slot while one is reviewing; `stop()` leaves graded slots unchanged. |
| Use case (fake ports) | `ReviewNext` over four results: four separate `invoke` calls in queue order, each with a new `JudgingScope` and an input manifest that contains no cost, time, token, name or other-review field and no label map. A failed invocation yields `FAILED` and no grades. The `ReviewSink` receives the raw response for ungraded reviews. No port call writes to an artifact snapshot or check outcome. `Rejudge` adds a review beside the original and passes the separate judging cost. `JudgeRun` with an unusable judge starts no session. `ReconcileBatches` turns a reviewing slot into `NOT_JUDGED(engine_interrupted)`. |
| Adapter | `response_reader` on recorded judge transcripts: valid JSON, prose around JSON, truncated JSON (→ `malformed_response`). `harness_judge` builds a read-only workspace and a permission profile that blocks writes to it. |
| API (`InProcessClient`, no interface) | Every `judging.*` method against a composed engine with fake M05/M02/M04 ports: responses validate against the exported JSON Schema, error codes are stable, capability flags and reasons match the scenarios above. A subscription with `since_seq` replays `judging.review.finished`. `judging.rejudge` reports progress through `job.*` events and ends with `results.review.added`. With model access disabled, `judging.review` and `judging.profiles` still succeed and no judge port is called. **R035, R082, R084, R144** |
| Screen (fake client, `App.run_test()` / `Pilot`) | JudgingScreen renders the in-progress and finished fixtures in wide and compact sizes, switches `#reviews` to loading, empty and error, hides `#current` in compact, and dims `enter` on queued rows and `s` from `can_stop` only. Each binding issues exactly the call in the tables above (`s` → `judging.stop`, `d` → no command). ReviewScreen shows Q only from `detail.quality`; UngradedReviewScreen shows the engine's deficiency messages verbatim; JudgeCapabilityScreen dismisses with the right `Action`. View-model builders are tested without Textual. |
