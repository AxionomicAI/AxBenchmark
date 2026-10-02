# M12 — Independent quality judging

Authority: [the product specification](../SPEC.md). This module defines required judging behavior. Its [Implementation](#implementation) section places that behavior in the headless engine fixed by [the architecture decision](ARCHITECTURE.md); the TUI and CLI present the engine's reviews, validation outcomes and judge checks and never evaluate a judging rule themselves.

This proposed contract enables engineers to implement independent reviews of delivered benchmark artifacts. Quality complements the repository README's measured cost/time comparison and rankings for different priorities. It evaluates a complete harness/model/environment configuration on the defined work; it does not establish isolated model capability. These requirements describe intended behavior, not an existing implementation. [R004]

## Recommended implementation children

The [recommendations](../recommendations.md#child-spec-convention-and-completion-rule) divide this proposed implementation into three children. These are implementation assignments, not completed runtime work.

| Child | Completed implementation prerequisites and boundary |
|---|---|
| [M12.1 — review-contract](implementation/M12/01-review-contract.md) | Bootstrap contracts for M01/M04/M08; strict profiles, evidence projection and review validity. |
| [M12.2 — judging-worker](implementation/M12/02-judging-worker.md) | M12.1, M05.1–2, M02.2, M08.2, M10.1 and M11.1–2; durable sessions, original dispositions, separate costs and cancellation. |
| [M12.3 — judging-screens](implementation/M12/03-judging-screens.md) | M12.2, M06.1 and M15.1–2; judging/profile/review/capability views and explicit rejudge navigation. |

Later M11 scheduler/invalidation and M13/M17 consumers use published Bootstrap Protocols during isolated work; real integrations are mandatory before parent acceptance. Preserve sequential fresh sessions, separate judge groups and strict validity throughout. Findings F03/F06/F09/F13 and shared F02/F04/F15/F18 contracts are applied below.

## Judge selection and launch agreement

Users independently choose the judge harness, model, and effort during setup. Preselect a valid saved choice; otherwise preselect the planner configuration if planning was used; otherwise preselect the first selected usable configuration. Preselection remains editable and does not recommend a model's quality. An unusable choice requires resolution before launch rather than silent replacement. [R033, R037]

Use the approved template's rubric and grading profile. Users complete the judge selection, quality-category weights, and cost/time/quality ranking weights before launching. M07 freezes the launch configuration and M06 validates the weights. Every competitor receives the same approved task suite and grading profile; the chosen judge and rubric remain common throughout the local comparison. A competitor's failure does not justify changing its rubric or granting additional repair opportunities during judging. [R033, R037, R082]

## Review inputs and execution

The review operation consumes an identified delivered artifact, its approved specification and source, the template rubric, acceptance results, the screenshots from the final regression, relevant evidence, and the resolved judge configuration. The screenshots are those captured by the final regression check against the delivered artifact, at both viewports (1440×1000 and 390×844); which steps capture them is defined by the template's checks. Per-task screenshots stay in evidence, results and the report but are not judge input. Evidence must remain associated with that artifact so a reader can follow a review's references. M08 projects behavioral check evidence recursively: check durations, all other measurement fields and per-task or historical-snapshot screenshot references are excluded even when nested in logs or evidence metadata. Passed/failed/unverified outcomes, behavioral observations, keyboard steps and browser errors remain available. These are conceptual inputs; the product contract does not prescribe a transport format or review schema. The format used by the engine is an implementation decision recorded under Implementation. [R083, R084]

Review configurations sequentially, with one fresh headless judge session per delivered artifact. When a configuration ran several trials, each trial is a separate delivered artifact and is judged in its own session, so N trials take N sessions. A session receives no earlier artifact's conversation or review, including another trial's. Use anonymous configuration labels where practical. Exclude measured cost, speed, and other competitors' reviews from judge inputs, including evidence excerpts supplied for assessment. Keep the label-to-result association outside the judge's assessment so the application can attach the review to the correct result. [R082, R083, R154]

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

[M01](01-template-library-identity.md) supplies the frozen rubric and template identity; [M07](07-run-configuration.md) supplies launch choices; [M05](05-harness-execution-isolation.md) supplies headless execution; [M08](08-verification-evidence.md) supplies acceptance evidence; [M02](02-retained-results-comparability.md) supplies retained artifacts and reviews. [M06](06-scoring-rankings.md) computes scores, [M10](10-measurements-cost.md) records separate judging costs, and [M13](13-standalone-html-report.md) presents retained assessments. M12 returns a graded, ungraded, failed or not-judged disposition with available evidence and limitations. These boundaries keep review opinions, executable verification, and measured performance independently inspectable. [R004, R082–R084, R144]

## Lifecycle and retention

M11 starts original judging only after durable evidence/accounting finalization and execution sealing. One original-review disposition is durably settled for every expected ResultId/TrialRef, including unusable judge, missing artifact/evidence, invocation failure and cancellation. M11 awaits this settlement before `finish_run_retention`, terminal publication and completion-report handling. Judging costs and reviews append separately; no judging path appends measurements or other execution facts after seal. [R035, R082, R134]

Run-level stop during original judging cancels and drains the active invocation, retains completed reviews, settles remaining originals as not judged with reasons and lets run/report waits reach an explicit outcome. Independent additional rejudging has its own job and cancellation; it does not reopen the original run. After engine loss, recovery retains completed reviews, resolves existing persistence intents and records every unfinished slot not judged without new model calls. An explicit user retry creates new additional work and never resumes the lost conversation. [R046, R082, R139]

Any identity failure before or during judging, including after execution seals, reaches M11's run invalidation coordinator. It never becomes an ordinary ungraded or failed assessment. The coordinator durably registers the run overlay, then the reporting worker unwinds before supervisor cleanup joins it. All associated results become non-comparable while their facts and prior reviews remain intact. [R067, R153]

## Acceptance criteria

- Exercise saved-choice, planner-choice, and first-selected-usable preselection; confirm user overrides and completed weights before launch. [R033]
- Review multiple artifacts with sequential fresh sessions, identical rubric/profile, practical anonymity, excluded performance/competitor-review inputs, and no application repair. Reject unsupported UI judging. [R037, R082, R083, R085]
- Give the judge the final-regression screenshots at 1440×1000 and 390×844 and no per-task screenshots; judge each trial of a multi-trial configuration in its own session. [R077, R083]
- Accept complete half-point grades; leave malformed or incomplete reviews ungraded with their deficiencies visible. Confirm all required commentary and evidence references survive retention. [R084]
- Confirm both profiles match all six category/weight pairs above. Reweighting preserves raw reviews and never changes verification or process outcomes. [R086–R091, R144]
- Inspect compatible imported results, distinct judge groups, and an explicitly added review with its original preserved and additional cost separate; generate the report from retained evidence. [R035, R082]
- Stop during judging and recover after engine loss without new model calls; every expected trial has a durable original disposition before terminal retention/report handling. Preserve sealed facts and distinct same-label RunUids. [R046, R077, R134, R139, R154]
- Detect a mismatch in preparation, evidence access or the final review check after seal: append one run invalidation, unwind without self-join, retain completed reviews and exclude all affected results. [R067, R153]

## Implementation

Implementation decisions under [the architecture decision](ARCHITECTURE.md). They fix how the contract above is built and add no product behavior. M12 owns the judging rules (judge requirement, input filtering, review validation, profiles) and the sequencing of judge sessions. Interfaces reach them only through `judging.*`; other engine modules reach them through the application interfaces below. M12 writes no retained record itself: reviews are handed to [M02](02-retained-results-comparability.md) and judging cost to [M10](10-measurements-cost.md).

### 1. Engine component

Package `axbenchmark.engine.judging`.

**Domain** (`engine/judging/domain/`, frozen slotted dataclasses and enums, no I/O):

| Type or rule | Contents and rules |
|---|---|
| `GradingProfile` | `profile_id` (`web`, `backend`), ordered `categories: tuple[Category(key, label, default_weight), ...]`, `business_category`. The two constants `WEB_PROFILE` and `BACKEND_PROFILE` hold exactly the six rows of the profile table above, in that order. Weights are defaults only; editing belongs to M06. **R085–R091** |
| `Rubric` | Read from the frozen template revision: `profile_id`, `version` (e.g. "web v1"), category keys, anchor text, `project_type`. `Rubric.profile()` resolves the profile; a rubric whose categories do not match its profile is rejected as `RubricInvalid` before any session starts. **R037, R085** |
| `GradeScale` / `Grade` | Scale 1–5, step 1/2, held as `Fraction`. `Grade.parse(raw) -> Grade \| GradeDeficiency` parses finite decimal numbers or numeric strings exactly, rejects booleans/non-numeric/non-finite values, values outside 1–5 and values off the half-step grid; nothing is rounded. `ANCHORS = {1: "missing or largely broken", 3: "usable with material gaps", 5: "excellent for the defined scope"}`. **R084** |
| `JudgeRequirement` | `requirement_for(rubric) -> JudgeRequirement(screenshot_inspection: bool, reason)`. True for the web profile (UI judging). It is checked only against catalog capability data, never against a model name. **R083, R084** |
| `JudgeCheck` | `usable: bool`, `profile_id`, ordered default quality weights, the requirement, the capability state as reported by M04 (`supported \| unsupported \| unknown`) with its source, the readiness verdict from M03, and `reasons: tuple[Reason, ...]`. Rule `combine(requirement, capability, readiness)`: unknown is not supported; no other judge is substituted. **R033, R084** |
| `ArtifactLabel` / `LabelMap` | Labels `Artifact A`, `Artifact B`, … assigned in queue order. `LabelMap(label → (result_id, TrialRef))` lives only in M12's batch record and is never part of a judge input. **R083** |
| `JudgeInputManifest` | What one session receives: delivered snapshot, approved specification and task prompts with their source, rubric and anchors, acceptance results, the final-regression screenshots at both viewports (1440×1000 and 390×844, as M08 hands them over) and other evidence items, each with an evidence id. Per-task screenshots are not admitted. `WITHHELD` is the fixed list returned to interfaces: cost, elapsed time, tokens, pricing, other artifacts' reviews, harness/model/provider/configuration names, trial index, the label map. Rule `admit(evidence: JudgeEvidence) -> Admitted \| Withheld(reason)` accepts only the M08 behavioral projection and recursively checks allowed fields/references; it rejects measurements/durations, other reviews and all per-task or historical-snapshot screenshot refs at every nesting level. Paths supplied to the judge use anonymous aliases; ResultId/TrialRef and mapping metadata stay outside the payload. Behavioral errors and keyboard steps remain evidence. **R082, R083** |
| `redact(text, terms) -> Redacted` | Applied to every evidence excerpt and log line before it enters a manifest: replaces the result's harness, model, provider, configuration and machine names with `[withheld]` and records the count. **R083** |
| `RawReview` | The judge's response as parsed, untrusted: per-category entries (key, value text, evidence references, rationale), comments (`code_quality`, `usability` or `developer_experience`, `specification`), limitations; or `Unparseable(reason)`. |
| `validate_review(raw, rubric, admitted_refs) -> GradedReview \| UngradedReview` | `GradedReview` only when each rubric category occurs exactly once with a valid `Grade`, at least one reference resolving within the admitted artifact evidence, nonempty rationale, all three nonempty comments and an explicit limitations list (possibly empty). Reject duplicate JSON keys/categories, unknown categories and foreign/nonexistent references. Otherwise `UngradedReview(deficiencies, kept)` with `missing_category`, `duplicate_category`, `unknown_category`, `out_of_range`, `off_half_step`, `missing_evidence_reference`, `invalid_evidence_reference`, `missing_comment`, `missing_rationale` or `malformed_response`, naming category/field. `kept` holds every part that was returned, including limitations. No default, average, zero or inference fills a gap. **R084** |
| `ReviewOutcome` | `GRADED`, `UNGRADED(deficiencies)`, `FAILED(cause)` (ordinary invocation/inspection failure), `NOT_JUDGED(cause)` (unusable, unavailable input, stopped or engine lost). Identity mismatch is a fatal run-invalidation path, never `FAILED`/`UNGRADED`; unsettled dispositions use `NOT_JUDGED(identity_invalidated)` only with the durable overlay. Never derived from process outcomes or checks. **R084, R144** |
| `JudgingBatch` | `batch_id`, `kind: RUN \| REJUDGE`, `run_uid`, frozen `JudgeSelection` (harness, target, account, model, effort), `Rubric`, ordered `ReviewSlot(label, result_id, trial: TrialRef, status, review_id, invocation_id?)`. Allocate stable review IDs before invocation. `next_slot()` requires no active session globally; `finish` preserves a committed review; `stop(cause)` closes admission and marks only unsettled slots not judged after cleanup/persistence. Judge/rubric never change. |
| `OriginalReviewDisposition` / `OriginalJudgingSettlement` | Published with M02 TerminalRetention: one disposition `{result_id, trial, outcome: GRADED \| UNGRADED \| FAILED \| NOT_JUDGED, review_id?, review_digest?, cause?, invalidation_id?}` per frozen expected trial. GRADED/UNGRADED require a committed review; FAILED/NOT_JUDGED require a reason and may reference retained diagnostic review evidence. Settlement is `{settlement_id, run_uid, batch_id?, roster_digest, dispositions, settlement_digest, cleanup, settled_at}`; M02 validates complete roster and review IDs/digests. No queued/reviewing/persistence-pending slot counts as settled. **R082** |
| `JudgeSessionContract` | Fixed facts shown by interfaces: fresh headless session, one artifact, no earlier conversation or review, read-only copy. Returned as data. **R082, R083** |

Domain errors: `RubricInvalid`, `JudgeUnusable(check)`, `BatchNotFound`, `BatchNotRunning`, `ReviewNotFound`, `UnknownProfile`, `RejudgeNotAllowed(reason)`, `ScopeMismatch`, `SettlementPending(cause)`, `SettlementConflict`. M01 `IdentityMismatch(check)` remains a fatal typed identity error; never wrap it in these ordinary assessment errors.

**Ports** (`engine/judging/ports.py`):

```python
class JudgeExecution(Protocol):           # M05 typed HarnessExecution; no parallel process API
    async def establish(self, spec: EnvironmentSpec) -> EstablishedEnvironment: ...
    async def invoke(self, req: InvocationRequest) -> InvocationResult: ...
    async def stop_invocation(self, invocation_id: InvocationId) -> CleanupReport: ...
    async def release(self, environment_id: EnvironmentId) -> CleanupReport: ...
class JudgeResponses(Protocol):
    async def read(self, result: InvocationResult) -> bytes: ...
class ArtifactSource(Protocol):           # M02; capture/pass one PublicationView across reads
    async def run(self, run_uid: RunUid, view: PublicationView | None = None) -> RetainedRun: ...
    async def result(self, rid: ResultId, view: PublicationView | None = None) -> EffectiveResult: ...
    async def materialize_artifact(self, rid: ResultId, dest: Path, view: PublicationView | None = None) -> None: ...
class RevisionSource(Protocol):           # M01; release FrozenRevision read lease
    async def open(self, sha: Sha256, view: PublicationView | None = None) -> FrozenRevision: ...
class IdentitySource(Protocol):           # M01 TemplateIdentity; check before/after each session
    async def check(self, sha: Sha256) -> IdentityCheck: ...
class AcceptanceEvidence(Protocol):       # M08, exact resolved ResultId/TrialRef/final artifact
    async def for_judge(self, rid: ResultId) -> JudgeEvidence: ...
class CapabilityCheck(Protocol):
    async def check(self, sel: JudgeSelection, require: Sequence[str]) -> CapabilityVerdict: ...
class Readiness(Protocol):
    async def assess(self, sel: JudgeSelection) -> ReadinessVerdict: ...
class ReviewSink(Protocol):               # M02 ResultRecorder.add_review after seal
    async def add(self, rid: ResultId, review: Review) -> None: ...  # identical review_id + digest retry only
class JudgingCost(Protocol):              # exact M10 JudgingCostAccounting; separate invocation account
    async def measure(self, invocation_id: InvocationId) -> JudgingMeasurement: ...
    async def estimate(self, selection: JudgeSelection, result_id: ResultId) -> MoneyObservation | None: ...
class QualityRules(Protocol):
    def weighted_quality(self, grades: RawGrades, weights: QualityWeights) -> QualityBreakdown: ...
class BatchStore(Protocol):
    async def save(self, batch: JudgingBatch) -> None: ...             # durable checkpoint before acknowledgement
    async def load(self, batch_id: BatchId) -> JudgingBatch: ...
    async def open_batches(self) -> Sequence[JudgingBatch]: ...       # reconciliation, never automatic resumption
    async def prepare_review(self, batch_id: BatchId, review: Review) -> ReviewIntent: ...  # immutable bytes/digest
    async def settle(self, settlement: OriginalJudgingSettlement) -> OriginalJudgingSettlement: ...
    async def write_input(self, batch_id: BatchId, label: ArtifactLabel, manifest: JudgeInputManifest) -> Path: ...
```

Plus `RunInvalidationCoordinator.invalidate(run_uid, identity_check, detected_at, source)` from M11 (durable registration only), and `EventPublisher`, `Clock` and `IdGenerator` from `engine/shared`. M12 has no port that writes to an artifact snapshot, a check outcome or a measurement, so a judge cannot repair the application and a review cannot change verification. **R083, R144**

**Application** (`engine/judging/application/`), one class per use case:

| Use case | Reached through | Behavior |
|---|---|---|
| `CheckJudge` | `judging.check_judge`, `JudgeRequirements.check` (M07) | Opens the revision, derives `JudgeRequirement`, calls `CapabilityCheck` (with `image_input` when screenshot inspection is required) and `Readiness`, returns `JudgeCheck`. |
| `JudgeRun` | `RunJudging.judge_run` (M11) | Requires every expected execution result sealed and current run eligibility/identity validated. Resolve RunUid/full roster, frozen judge/rubric; create or return the unique durable original batch in configuration/trial order, including results without usable artifacts. Unusable judge/missing inputs settle explicit not-judged reasons. Under M11 lifecycle admission gate enqueue only eligible work; a repeated call never creates another original or invocation. **R082** |
| `Rejudge` | `judging.rejudge` (job) | Verifies M02's `can_rejudge` preconditions and `CheckJudge` for the chosen selection, creates a one-slot `REJUDGE` batch and enqueues it. The resulting review is retained beside any existing review. **R082** |
| `ReviewNext` | engine-wide judging worker | Validate ResultId/TrialRef binding and identity, materialize the delivered snapshot read-only, project M08 evidence and anonymous inputs, persist invocation intent and start one fresh typed judge invocation. Drain response/usage; check identity again before assessment publication. Validate available response, await separate M10 accounting, persist immutable review intent, call M02 add_review, release resources and acknowledge slot disposition before publishing. Ordinary failure yields FAILED, absent final artifact/evidence NOT_JUDGED; no repair/retry/default grades. Identity routes to the coordinator and worker unwind, outside these classifications. **R082–R084** |
| `StopJudging` | internal `RunJudging.stop`; independent rejudge cancellation | Persist close-admission/cause, stop/drain active M05 invocation, join the slot worker and release resources. Retain committed reviews; settle every remaining original disposition with reason and available separate accounting/evidence. Return only after durable settlement, or a typed pending error. RUN `judging.stop` delegates to M11 run stop; REJUDGE stop cancels only that job. |
| `GetJudgingStatus` | `judging.status` | Projects a batch (or a run's batch, or "waiting" when the run has none yet) into the status DTO with capabilities. |
| `GetReview` | `judging.review` | Loads a review through `ArtifactSource`, adds anchors, profile weights and, for a graded review, Q from `QualityRules` under the result's original quality weights. |
| `ListProfiles`, `GetProfile` | `judging.profiles`, `judging.get_profile`, `ProfileCatalog` (M06), `RubricIndex` (M01) | Return the two profiles, the scale and anchors, and the active profile of a template. |
| `RejudgeOptions` | `judging.rejudge_options` | The selected judge for the result's template with its `JudgeCheck`, the judge group it would join, rubric, session contract and cost estimate. |
| `ReconcileBatches` | engine start / `RunJudging.recover` | Reconcile orphan resources and immutable pending persistence intents with original review/invocation IDs. Keep already committed reviews; all unfinished queued/reviewing original slots become NOT_JUDGED(engine_lost), even if no batch existed before the crash. Never invoke a model or grade a partial response. REJUDGE jobs with a durably complete review settle from that stored outcome; unfinished jobs settle independently as cancelled with the reason; explicit user retry creates a new additional review. |
| `WaitForOriginalJudging` | `RunJudging.wait` (M11) | Await the durable complete settlement from snapshots/checkpoints, not observational events. Persistence failure returns a typed retention-pending error; no fabricated completion or endless report wait. |

One asyncio worker task runs `ReviewNext` for all batches in FIFO order; at most one judge session exists across runs/rejudge requests. Stop joins the active slot task, never terminates the global worker for other batches. Completed reviews and stable review IDs survive restart. **R082**

M02 `add_review` owns atomic review/evidence append, keyed by review ID/digest; do not call its execution `attach_evidence` or measurement methods after seal. Persist prepared review bytes before the append; a lost acknowledgement retries identical bytes and never repeats the model call. An incomplete response without a durable prepared review is not graded on recovery. M10 drains/accounting use stable invocation observation IDs; costs stay separate from competitor aggregates. Storage failures keep settlement pending and reach M11 as typed errors.

Catch `IdentityMismatch(check)` from every M01/M05/M08 read and promote a negative identity check before ordinary failure handling. Await only `invalidate`'s durable registration; then cancel/unwind the originating slot operation so supervisor cleanup can join it. The lifecycle gate serializes judge admission/review commit with invalidation/stop. Retain existing reviews and attach the overlay to all original-run results; no new invocation starts for an invalidated run. Additional rejudge identity failures use the artifact's original RunUid and also invalidate that retained run. No cleanup self-join is permitted.

Application interfaces offered to other modules (`engine/judging/application/interfaces.py`):

```python
class RunJudging(Protocol):              # M11
    async def judge_run(self, run_uid: RunUid) -> BatchId: ...
    async def wait(self, batch_id: BatchId) -> OriginalJudgingSettlement: ...
    async def stop(self, batch_id: BatchId, cause: TerminalCause) -> OriginalJudgingSettlement: ...
    async def recover(self, run_uid: RunUid, cause: TerminalCause) -> OriginalJudgingSettlement: ...
    async def batch_for_run(self, run_uid: RunUid) -> BatchId | None: ...
class JudgeRequirements(Protocol):        # M07 setup validation and launch
    async def check(self, template: Sha256, judge: JudgeSelection) -> JudgeCheck: ...
    def session_count(self, configurations: int, trials: int) -> int: ...  # exact product; M07 validates positive integers
class ProfileCatalog(Protocol):          # M06 GradingProfiles adapter
    def get(self, profile_id: str) -> GradingProfile: ...
class RubricIndex(Protocol):             # M01 template summary
    def summary(self, rubric: RubricDefinition) -> RubricSummary: ...   # profile id, version, category count
class RubricSource(Protocol):            # M16 planned templates, M09 package tests
    def for_project_type(self, project_type: ProjectType) -> RubricRef: ...   # packaged rubric for a profile
    def parse(self, document: bytes) -> RubricDefinition: ...                 # raises RubricInvalid
```

`judge_run` is idempotent by RunUid/original roster. `wait` returns the persisted original settlement even after a missed event/restart. `stop` is idempotent for its batch and first accepted cause: repeat returns the same settlement, preserving committed reviews; later causes are M11 lifecycle data. `recover` closes admission and settles originals without invocation, reconstructing missing slots from M02's frozen full roster even when `batch_for_run` is None. Remaining dispositions use the supplied terminal cause (`engine_lost` for startup loss, `stopped`/`identity_invalidated` for those no-batch terminal paths). It reuses existing review IDs/dispositions and returns the same settlement on retry. M11 uses `judge_run → wait` normally, `stop` when a batch exists, and `recover` for engine loss or a terminal path with no batch. Calls cannot acknowledge while persistence is pending. REJUDGE jobs use their own `RejudgeOutcome`, never enter the original settlement or delay a previously terminal run.

**Required M05 role extension:** `EnvironmentSpec.judge(scope: JudgingScope, artifact: SnapshotRef, artifact_root: Path, input_root: Path, scratch_root: Path, settings: RequestedSettings, policy: EnvironmentPolicy, record_dir: Path)` consumes M02's materialized delivered artifact. `PermissionProfile` must distinguish protected read-only artifact/input roots from writable scratch; deny repairs and all writes to protected roots, including traversal/symlink escapes; session output may go only to scratch/engine-owned records. The judge environment cannot use the competitor's writable-workspace default. M05 owns this typed extension and enforcement; failure to establish protection is a typed pre-invocation failure, never an unprotected fallback. This is a provider integration obligation, not a second execution API.

**Adapters** (`engine/judging/adapters/`):

| Adapter | Implements |
|---|---|
| `harness_judge.py` | `JudgeExecution` over M05's `HarnessExecution`: `Role.judge`, exact `JudgingScope(review_id, result_id, trial, artifact_label)` and `InvocationRequest`; anonymous payload paths from `BatchStore.write_input`. The M05 judge environment must bind the delivered SnapshotRef, protected read-only artifact/input roots and a distinct writable scratch root; no competitor baseline substitution. These typed M05 role/permission contracts must be reconciled in M05 before adapter acceptance, not implemented as a private M12 process path. |
| `response_reader.py` | `JudgeResponses`: extracts the final message from the invocation record. The judge prompt asks for one JSON document matching `review.schema.json` (categories, grades as strings, evidence references by evidence id, comments, limitations); `domain.parse_raw_review` turns it into `RawReview` or `Unparseable`. The schema and prompt are files in `engine/judging/adapters/prompts/`. |
| `results_bridge.py` | `ArtifactSource`, `ReviewSink` over M02's application interfaces. |
| `revision_bridge.py`, `evidence_bridge.py`, `catalog_bridge.py`, `readiness_bridge.py`, `cost_bridge.py`, `scoring_bridge.py` | The remaining ports over M01, M08, M04, M03, M10 and M06 application interfaces. |
| `fs_batches.py` | `BatchStore` with fsync/temp/rename, immutable review intents, disposition digests and persisted cleanup/settlement progress; conflict fails instead of overwriting. |
| `rpc.py` | Maps `judging.*` DTOs to use cases and domain results and errors to DTOs and error codes; registers the snapshot provider for the `judging` topic with M11's subscription service. The only module file importing `axbenchmark.api`. |

**Persisted state** (engine-owned):

```
~/.axbenchmark/judging/
  <batch_id>/
    batch.yaml               kind, RunUid, ResultId/TrialRef roster, judge/rubric, stable review/invocation IDs, outcomes
    labels.yaml              label → ResultId/TrialRef; never copied into an input directory
    review-intents/          immutable prepared review bytes/digests; replay only persistence
    settlement.yaml          durable complete original dispositions and cleanup report
    <label>/input/           payload given to the session: manifest.json, prompt, schema, evidence copies
    <label>/artifact/        read-only copy of the delivered snapshot; removed after release
    <label>/invocation/      M05 invocation record and log for the judge session
```

A durable `~/.axbenchmark/judging/originals/<run_uid>.yaml` index holds the roster and original settlement reference; recovery with no batch persists its settlement here with `batch_id=None`. It cannot enqueue sessions. M11 copies validated dispositions into M02 TerminalRetention, so working-state loss cannot erase a terminal run's evidence.

Retained reviews, their raw responses and input manifests live in M02's `results/<result_id>/reviews/` once handed over; `judging/` is working state and is not exported.

**Owned processes:** the judging worker task. Judge harness processes are started through M05 and are children of `axbenchmarkd`; closing a client never reaches them. Explicit stop/job cancellation, run identity invalidation and engine shutdown end an active session through M05 cleanup. Client disconnect never does.

### 2. API surface

Namespace `judging.*`. DTOs in `axbenchmark.api.judging`.

**Queries** (safety class `read`)

| Method | Request fields | Response model | Errors |
|---|---|---|---|
| `judging.status` | `batch_id?` or `run_uid?` (exactly one) | `JudgingStatus`: `batch_id?`, `kind`, `run_uid?`, `run_label`, `origin`, `state: waiting \| queued \| running \| settling \| finished \| stopped \| interrupted`, `retention_state`, `settlement_error?`, `invalidation?`, `judge: JudgeSelectionDTO`, `rubric: RubricRefDTO` (profile, version), `session_contract: list[str]`, `rows: list[ReviewRowDTO]`, `current: CurrentSessionDTO \| None`, `inputs: InputManifestDTO \| None`, `counts` (graded, ungraded, failed, not judged, queued), `ungraded_notice: UngradedNoticeDTO \| None`, `capabilities`, `revision` | `judging.unknown_batch`, `judging.unknown_run`, `judging.invalid_request` |
| `judging.review` | `review_id` | `ReviewDetail`: `review_id`, `result_id`, `trial: TrialRef`, `run_uid`, `run_label`, `provenance`, `invalidation?`, `label`, `configuration` (shown to the user only), `judge_group` (label, judge), `rubric`, `outcome: graded \| ungraded \| failed \| not_judged`, `grades: list[GradeRowDTO]`, `quality: QualityDTO \| None` (graded only, from M06, labelled as computed), `comments` (code quality, usability or developer experience, specification; each `str \| None`), `limitations: list[str]`, `validation: list[ValidationRowDTO]`, `comment_checks`, `consequences: list[str]`, `record` (judge, effort, session, reviewed at, elapsed, judging cost, evidence counts), `raw_response: EvidenceRefDTO \| None`, `evidence: list[EvidenceRefDTO]`, `capabilities` | `judging.review_not_found` |
| `judging.profiles` | `template_sha256?` | `Profiles`: `profiles: list[ProfileDTO]` (profile id, label, categories with key, label, default weight), `active_profile_id?`, `rubric?`, `scale` (min, max, step), `anchors: list[AnchorDTO]`, `notes: list[str]` | `judging.unknown_template` |
| `judging.get_profile` | `profile_id` | `ProfileDTO` | `judging.unknown_profile` |
| `judging.check_judge` | `template_sha256`, `judge: JudgeSelectionDTO` (harness, target, account id, model id, effort `{explicit} \| "harness_default"`) | `JudgeCheckDTO`: `usable`, `profile_id`, `default_quality_weights`, `requirement` (screenshot inspection, reason), `capability` (image input state, source), `readiness` (rows from M03), `reasons: list[ErrorInfo]` | `judging.unknown_template`, `judging.rubric_invalid` |
| `judging.rejudge_options` | `result_id` | `RejudgeOptions`: `subject`, `judges: list[JudgeOptionDTO]` (judge config id, selection, group label it joins, `check: JudgeCheckDTO`), `rubric`, `session_contract`, `estimate: MoneyObservationDTO \| None`, `group_note`, `capabilities` | `judging.result_not_found` |

`ReviewRowDTO`: `label`, `result_id`, `configuration` (user-visible), `trial: TrialRef`, `trial_count` (user-visible, never in judge input), `status: queued \| reviewing \| graded \| ungraded \| failed \| not_judged`, `grades: list[str \| None]` in profile order (as returned; an ungraded row shows what came back), `elapsed: DurationObservationDTO \| None`, `judging_cost: MoneyObservationDTO \| None` (partial while reviewing, marked `so_far`), `review_id?`, `failure: ErrorInfo \| None`, `capabilities`.
`CurrentSessionDTO`: `label`, `index`, `count`, `invocation_id`, `pid`, `history: "none"`, `started_at`, `activity: list[ActivityDTO]` (from M05 actions in this `JudgingScope`, redacted), `progress: ObservedFraction \| None` (screenshots opened of those given, when the harness exposes file reads; otherwise `None`).
`InputManifestDTO`: `given: list[InputItemDTO]`, `withheld: list[str]` (the fixed `WITHHELD` list), `redactions: int`.
`GradeRowDTO`: `key`, `label`, `value: str \| None`, `anchor_steps: float \| None`, `default_weight`, `weight` (original, normalized, from the result's frozen weights), `evidence_refs: list[EvidenceRefDTO]`, `rationale`.
`ValidationRowDTO`: `category`, `returned: str \| None`, `evidence_count`, `deficiency: {code, message} \| None`.

**Capability flags**

| Flag | On | Reasons when false |
|---|---|---|
| `can_open` | status row; enabled only for retained review_id | `judging.review_pending` (queued or reviewing), `judging.not_judged` |
| `can_stop` | status; RUN uses M11 run-level gate, REJUDGE uses its job gate | `judging.not_running`, M11 pending/terminal reasons |
| `can_open_evidence` / `can_raw` | review | `judging.no_evidence` / `judging.no_raw_response` |
| `can_breakdown` | review | `judging.review_ungraded`, `judging.review_failed`, `results.identity_invalidated` |
| `can_rejudge` | rejudge options, per judge | M02's `results.*` reasons, `judging.judge_unusable`, `judging.screenshot_inspection_unsupported`, `judging.screenshot_inspection_unknown`, `environment.*` and `catalog.*` reasons passed through |

**Commands**

| Method | Request | Response | Errors | Safety |
|---|---|---|---|---|
| `judging.stop` | `batch_id` | `StopReport`: batch kind, durable dispositions, cleanup, run stop receipt/retention/report status when RUN | `judging.unknown_batch`, `judging.not_running`, `judging.settlement_pending` | destructive |

**Jobs**

| Method | Request | Finished payload | Errors | Safety |
|---|---|---|---|---|
| `judging.rejudge` | `result_id`, `judge_config_id` | `RejudgeOutcome`: `review_id`, `outcome`, `judge_group`, `judging_cost` | `judging.result_not_found`, `judging.rejudge_not_allowed` (with M02's reason), `judging.judge_unusable` (with the `JudgeCheckDTO`), `judging.screenshot_inspection_unsupported`, `judging.screenshot_inspection_unknown` | write |

The job's `JobRef.id` is the batch id, so `judging.status(batch_id)`, `jobs.get` and `jobs.cancel` (which issues `StopJudging`) all address it. A run's original batch is not a client job: M11 starts it. Public `judging.stop` resolves RUN to M11 `runs.stop(run_uid)` so lifecycle/report status settles; M11 invokes the internal `RunJudging.stop`, avoiding recursive dispatch. REJUDGE `jobs.cancel`/`judging.stop` affects only that additional job. Job cancellation remains pending until cleanup/accounting/review evidence settle. Serialize rejudge cancellation against durable review preparation/commit using the shared job/lifecycle gate: cancellation that wins prevents assessment commit; completed commit wins with its retained outcome, never a cancelled job that later publishes a grade. Once persistence is committed, finish/recover it without another model call.

**Events** (registered topic `judging`; payloads carry `batch_id`, `run_uid` and ResultId/TrialRef for slot events; the shared envelope carries `EventCursor` and revisioned projection changes):

| Event | Payload | Emitted when |
|---|---|---|
| `judging.batch.started` | kind, run UID, full result/trial roster, labels, judge, rubric | A batch is created. M11 run views switch to JudgingScreen on it. |
| `judging.review.started` | label, result id, review id, invocation id, index, count | A fresh session starts for one artifact. |
| `judging.review.progressed` | label, `ActivityDTO`, `progress?` | A redacted judge action is observed (at most every 500 ms). |
| `judging.review.finished` | label, result id, optional retained review id, outcome, grades as returned, elapsed, judging cost, deficiencies summary | The review/disposition is durable, with a review ID only when M02 retained one. |
| `judging.batch.finished` | counts, settled outcome/cause, settlement digest for RUN, cleanup | All required dispositions are durable; not emitted as successful completion on storage failure. |

M02 additionally emits `results.review.added` once the review is retained. A review is immutable, but an append-only invalidation may change its result's eligibility: status/review projections observe `results.run.invalidated` and refresh capabilities. Settlement uses awaited ports, never delivery of these UI events.

**Error codes:** `judging.invalid_request`, `judging.unknown_batch`, `judging.unknown_run`, `judging.unknown_template`, `judging.unknown_profile`, `judging.review_not_found`, `judging.result_not_found`, `judging.rubric_invalid`, `judging.not_running`, `judging.judge_unusable`, `judging.screenshot_inspection_unsupported`, `judging.screenshot_inspection_unknown`, `judging.rejudge_not_allowed`, `judging.scope_mismatch`, `judging.settlement_pending`, `judging.settlement_conflict`. Deficiency codes in `ValidationRowDTO` (`judging.deficiency.missing_category`, `.duplicate_category`, `.unknown_category`, `.out_of_range`, `.off_half_step`, `.missing_evidence_reference`, `.invalid_evidence_reference`, `.missing_comment`, `.missing_rationale`, `.malformed_response`) are data, not RPC errors; so are session failures (`ReviewRowDTO.failure`, carrying M05's `harness.*` codes).

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `RevisionReader.open` (application interface) | M01 | Lease-backed approved specification/prompts/rubric; use shared PublicationView and close the lease. Any identity failure propagates to the run coordinator. |
| `RetainedResultReader.run`, `.get` (application interface) | M02 | Results of a run, frozen judge selection, rubric reference and original quality weights from `DefinitionAndLaunch`, existing reviews and judge groups. |
| `ArtifactSnapshots.materialize(rid, dest)` (application interface) | M02 | Read-only copy of a sealed result's delivered artifact for the judge. |
| `ResultRecorder.add_review` | M02 | Retain original/additional review and its evidence/cost atomically after seal, idempotent by review ID/digest; never execution evidence appends. |
| `results.get(result_id, ["reviews"])`, `results.read_evidence`, `can_rejudge` flag, event `results.review.added` | M02 | ResultReviews and RejudgeScreen context; reading raw responses and evidence from M12 screens. |
| `CheckSelection` application interface, `catalog.check_selection(require=["image_input"])` | M04 | Screenshot-inspection capability; `catalog.capability_unsupported` / `catalog.capability_unknown` are mapped to the `judging.screenshot_inspection_*` reasons. |
| `AssessOperation(operation="judge")`, `environment.assess` | M03 | Judge harness readiness. |
| `HarnessExecution.establish`, `.invoke`, `.release`, `.stop_invocation` (for `judging.stop`) with `Role.judge` and `JudgingScope` | M05 | Fresh headless judge sessions with `JudgingScope(review_id, result_id, trial, artifact_label)` and the required protected-artifact M05 extension. |
| `harness.invocation.get`; events `harness.action.observed`, `harness.task.started`, `harness.task.exited` in `JudgingScope` | M05 | Current-session pid and activity on JudgingScreen. |
| `AcceptanceEvidence.for_judge(rid) -> JudgeEvidence` (check outcomes, the screenshots captured by the final regression check against the delivered artifact at 1440×1000 and 390×844, behavioral errors/keyboard steps; recursively no duration/measurement fields or per-task screenshot refs) | M08 | Acceptance results and screenshots for the input manifest. **R075** |
| `EvidenceViewerScreen` and JudgeInputScreen (its judge-input text reads "screenshots from the final regression") | M08 | `e` and `r` on review screens. |
| `JudgingCostAccounting.measure(invocation_id)` and `.estimate(selection, result_id)` | M10 | Separate judging cost and elapsed per review; rejudge estimate. **R082** |
| `ScoringRules.weighted_quality` | M06 | Q row on ReviewScreen under original weights. |
| `ScoreBreakdownScreen`, `WeightsScreen` | M06 | `b` on ReviewScreen, `w` on ProfilesScreen. |
| `SavedJudges.for_template(sha)` (application interface) | M07 | Options in `judging.rejudge_options`. |
| `JudgeRequirements.check` callers; SetupScreen pushing JudgeCapabilityScreen and JudgeScreen | M07 | Launch blocked on an unusable judge; preselection order stays M07's. **R033** |
| `RunJudging.judge_run`, `.wait`, `.stop`, `.recover`, `.batch_for_run`; `RunInvalidationCoordinator.invalidate` | M11 | Exact interfaces above: original dispositions settle before finish_run_retention; no new model calls on recovery; durable-only invalidation registration prevents self-join. |
| `events.subscribe`, `jobs.get`, `jobs.cancel`, `job.progress`, `job.finished` | M11 | Subscriptions and the rejudge job. |
| `OverrideScreen` | M04 | "Override catalog…" on JudgeCapabilityScreen. |
| App shell, `.-compact` screen class, shared modal styles | M15 | Hosting the screens. |

### 4. Screens

All M12 screens are views over the DTOs above. View models are frozen dataclasses built by pure functions in `tui/viewmodels/judging.py`; they format values (grades as given, `None` cost → "unknown", `so_far` → "so far") and never validate grades, compute Q, decide eligibility or choose a judge. `check_action` reads shared `ActionState.enabled/reason` only (`None` dims a disabled binding; `False` would hide it). Each data widget sits in a `ContentSwitcher` with `#x`, `#x-loading`, `#x-empty`, `#x-error`; errors show the engine's message and remedy verbatim with Retry.

**JudgingScreen** — `JudgingScreen(Screen)` in `tui/screens/judging.py`, artboards Judging, JudgingDone and JudgingTrials (wide 120×40, compact 80×24). Constructor `JudgingScreen(run_uid: str | None = None, batch_id: str | None = None)`. Pushed by M11's run view on `judging.batch.started`, or from a run in its judging phase. Tree and TCSS as in the legend: `Static #judging-bar`, `DataTable #reviews .bordered` (cursor_type row), `Vertical #current .pane` with `ProgressBar`, `Static #inputs .pane` (`.-withheld` items dimmed), `Static #ungraded.notice.-error` and `Button #open-ungraded` in the finished state; `Screen.-compact #current { display: none; }`.

```python
@dataclass(frozen=True, slots=True)
class JudgingVM:
    bar: str                                  # "Reviewing artifact 3 of 4 · judge … · rubric web v1 · one fresh session per artifact, in order"
    rows: tuple[ReviewRowVM, ...]             # label, status glyph+text, configuration with "trial 2/3" when count > 1, grades "4.5 4.0 …", time, judging cost
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
| mount | `judging.status(run_uid or batch_id)` | `#reviews` populated; `#reviews-loading` ("Preparing anonymous labels…"); `#reviews-empty` when `state == "waiting"` ("Nothing to review yet"); `#reviews-error` on a typed error. JudgingDone is the same screen with `state == "finished"`; `ungraded_notice` is present only if needed. Settling/stopped/interrupted/invalidation/pending-error states keep their distinct engine notices. |
| subscription | `events.subscribe(["judging", "harness", "results"], cursor=cursor)` through M15's shared subscription manager; filter batch and ResultId/TrialRef/JudgingScope; drop on unmount | `judging.review.progressed` and `harness.action.observed` update `#current`; `judging.review.started/finished`, `judging.batch.finished` and invalidation refresh status. Revisioned snapshots/upserts/tombstones reject stale replay; a resync replaces the generation and ignores old deliveries. |
| `enter` (`open_review`) | none on push | `ReviewScreen(review_id)` for a graded row, `UngradedReviewScreen(review_id)` for ungraded, failed or diagnostic not-judged; enabled by the row's `can_open`. |
| `Button #open-ungraded` | none on push | `UngradedReviewScreen(ungraded_notice.review_id)`. |
| `p` (`profiles`) | none on push | `ProfilesScreen(template_sha256)`. |
| `d` (`detach`) | none | Unsubscribe and `app.pop_screen`; judging continues. |
| `s` (`stop_judging`) | `judging.stop(batch_id)` after M15's `ConfirmScreen` returns `True` (destructive methods are issued only from a confirming modal) | RUN invokes M11 run stop through this dispatcher; REJUDGE cancels its job only. Show settling/pending-error until durable response/status; completed reviews stay visible. Enabled by `can_stop`. |
| `tab` | none | Focus `#reviews` → `#current` → `#inputs` (compact: `#reviews` → `#inputs`). |

**ReviewScreen** — `ReviewScreen(Screen)` in `tui/screens/judging.py`, artboard ReviewDetail; also pushed from M02's ResultReviews. Tree: `Static #review-bar`, `DataTable #grades .bordered`, `VerticalScroll #comments .pane`, `Static #review-meta .pane.kv`, `Horizontal .actions`. View model `build_review_vm(detail: ReviewDetail) -> ReviewVM` with `bar`, `grade_rows` (category, grade, anchor bar from `anchor_steps`, weight, evidence refs, rationale), `quality_row` (from `detail.quality`, labelled "computed by AxBenchmark"), `comments` (three sections), `meta_rows`, `limitations`, `actions`.

| Event or binding | API call | Result |
|---|---|---|
| mount | `judging.review(review_id)` | `#grades`, `#comments`, `#review-meta`; `#grades-error` for `judging.review_not_found`. Subscribe to `results` invalidations for this RunUid; refresh eligibility/capabilities without mutating the immutable review. |
| `esc` | none | `app.pop_screen`. |
| `e` (`evidence`), "Open evidence" | none on push | M08's `EvidenceViewerScreen` with `detail.evidence`; it reads through `results.read_evidence`. Enabled by `can_open_evidence`. |
| `b` (`breakdown`), "Score breakdown" | none on push | M06's `ScoreBreakdownScreen(result_id, judge_group)`; enabled by `can_breakdown`. |
| `r` (`raw`), `Button #raw` | none on push | `EvidenceViewerScreen` on `detail.raw_response`, enabled only by `can_raw`. |

**UngradedReviewScreen** — `ModalScreen[None]` in `tui/screens/judging.py`, artboard ReviewUngraded, over JudgingScreen. Tree `Vertical #ungraded-review .dialog` with `DataTable #validation`, `Static #kept .kv`, `Static #consequences`, `.dialog-actions` (`Button #raw`, `Button #close`). View model `build_ungraded_vm(detail) -> UngradedVM`: validation rows from `detail.validation` (deficiency message shown as returned, deficient cells styled from the presence of `deficiency`), kept rows (comment checks, limitations, raw response path), consequences from `detail.consequences`.

| Event or binding | API call | Result |
|---|---|---|
| mount | `judging.review(review_id)` | Fills `#validation`, `#kept`, `#consequences`. |
| `r`, `Button #raw` | none on push | `EvidenceViewerScreen` on `raw_response`, enabled only by `can_raw`. |
| `esc`, `Button #close` | none | `dismiss(None)`. |

**ProfilesScreen** — `ModalScreen[None]` in `tui/screens/judging.py`, artboard RubricProfiles. Tree `Vertical #profiles .dialog` with `DataTable #profile-table`, `Static #profile-notes .kv`, `.dialog-actions`. View model `build_profiles_vm(p: Profiles) -> ProfilesVM`: two-column rows paired by position, `this_run` (active profile and rubric), scale, anchors, notes.

| Event or binding | API call | Result |
|---|---|---|
| mount | `judging.profiles(template_sha256)` | Table and notes. |
| `w`, "Quality weights…" | none on push | M06's `WeightsScreen(context="analysis", template_sha, profile_id, judge_group=None, initial=…)`; M12 applies nothing. |
| `esc`, "Close" | none | `dismiss(None)`. |

**JudgeCapabilityScreen** — `ModalScreen[Action]` in `tui/screens/judge_capability.py`, artboard JudgeCapability (M07 imports its screen factory; M12 does not own M07 setup.py). Pushed by M07's SetupScreen when its validation returns `judging.screenshot_inspection_unsupported` or `judging.screenshot_inspection_unknown` for the judge. Tree `Vertical #judge-capability .dialog` with `Static .notice.-error`, `Static #capability .kv`, `.dialog-actions` (`Button #override`, `Button #choose-judge`). View model `build_judge_capability_vm(template, check: JudgeCheckDTO)`: notice title from the first reason, kv rows Template, Needs (`requirement.reason`), Catalog (`capability`), Readiness (`readiness`).

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
| `axbenchmark --attach RUN` | Subscription includes topic `judging`; an attach during the judging phase starts from `judging.status(run_uid=…)`. |
| `axbenchmark status RUN` | `judging.status(run_uid=…)` alongside `runs.status`: per label status, outcome, grades, deficiencies, failures. |
| `axbenchmark stop RUN` | `runs.stop` (M11), which calls `RunJudging.stop` for a run in its judging phase. |

CLI resolves RUN to an unambiguous RunUid through M02 before requests; same-label imported collisions require UID/origin. Run stop remains enabled during original judging and completion/report waits settle from persisted status, including skipped/cancelled/failed or retention-pending error.

`judging.rejudge`, `judging.review`, `judging.profiles` and `judging.check_judge` have no dedicated signature in [M14](14-command-line-interface.md); they are reachable through M14's generic registry access, with `--json` printing the response models.

### 6. Headless verification

The children own exact source/test assignments and commands. Parent acceptance requires these behavior checks through real composed providers; no runtime execution is claimed by this specification edit.

| Level | Required evidence |
|---|---|
| Review/domain | Both exact six-category profiles/default weights; every half-point accepted; booleans/non-finite/out-of-range/off-step rejected without rounding. Missing/duplicate/unknown categories, absent comments/rationale, bad/foreign evidence and malformed/truncated/duplicate-key JSON remain ungraded with all available parts and limitations retained. No process/check success supplies a missing grade. |
| Input contract | Recursively inspect nested M08 evidence: no durations/cost/tokens/hardware, competitor reviews, trial identities or per-task screenshot refs. Preserve task/final behavioral outcomes and errors. Every admitted screenshot belongs to the delivered final-regression snapshot and correct 1440×1000/390×844 capture pair. Scope mismatch or unknown evidence reference fails explicitly. |
| Worker/retention | Two configurations × three trials yield six sequential, independent typed sessions. Verify read-only artifact/input roots, fresh scratch and no earlier response/conversation. Delay M05 usage, M10 accounting, M02 add_review and batch settlement: no next completion acknowledgement/finish retention overtakes required writes. Identical write retry keeps review ID/digest, groups and costs; conflicting retry fails; no measurement/evidence fact append after seal. |
| Stop/recovery | Stop queued/active/settling original judging: cancel process tree, retain committed reviews, settle every remaining original and allow terminal/report wait to finish. Kill after prepared intent, M02 append, batch acknowledgement and before batch creation; recovery finishes durable writes/dispositions with zero model calls. An independent rejudge stop leaves original settlement intact; explicit retry starts new additional work only. |
| Identity | Fail revision open, nested evidence read, M05 establishment or post-invocation identity after execution seal. Await one durable M11 overlay, unwind reporter before supervisor joins, preserve prior reviews/facts and exclude every original-run result. Race stop/commit/invalidation; no new session or report eligibility survives the overlay. |
| API/events | Through real InProcessClient/socket codecs, exercise every method/error/capability and full ResultId/TrialRef. Reconnect with EventCursor, older revision, epoch change and overflow; no duplicate reviews or lost terminal settlement. Read retained reviews/profiles with model access disabled. Missing raw response is explicit, never a fabricated file. |
| Screens/CLI | Every exact board and loading/empty/error/settling/stopped/interrupted/persistence-pending state at 120×40 and 80×24. Bindings issue the documented method once; detach issues none. Engine grades/Q/capability reasons remain authoritative. Original-run stop versus rejudge cancellation, invalidation refresh, same-label UID selection and report failure/pending status all settle. |
| Real integration | Compose M01/M02/M05/M08/M10/M11/M12 with actual supported judge adapter and temporary stores; M13 immediate report and M17 export/import agree on committed review version, separate judge groups/costs and invalidation. Repeat stop/restart/mismatch after sealing without competitor-fact writes or additional recovery calls. |
