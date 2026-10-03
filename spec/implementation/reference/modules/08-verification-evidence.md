# M08 — Acceptance verification and evidence

Status: proposed required contract. This module defines how AxBenchmark establishes observable task outcomes and retains supporting evidence. It does not assert that verification is implemented. [SPEC.md](../SPEC.md) remains authoritative. The [Implementation](#implementation) section places this behavior in the headless engine fixed by [the architecture decision](../../../ARCHITECTURE.md); interfaces present verification outcomes and evidence from the engine and evaluate none of these rules themselves.

## Implementation slices

These are bounded implementation assignments from [recommendations.md](../recommendations.md), not completed runtime features. All require the shared Bootstrap contracts; completed implementation dependencies are distinguished from injected published contracts in each child.

| Child | Boundary | Completed dependencies |
|---|---|---|
| [M08.1 — verification-runtime](../../M08/01-verification-runtime.md) | Observation schema, classification, scoped lifecycle, cancellation and durable completion | M01.1, M02.1, M05.1–M05.2, M11.1–M11.2 |
| [M08.2 — verification-adapters](../../M08/02-verification-adapters.md) | Python Playwright, repository/backend observations, services, evidence and judge input | M08.1, M02.2, M03.1 |
| [M08.3 — verification-screens](../../M08/03-verification-screens.md) | Checks, regression, screenshots, evidence, progress and judge handoff | M08.2, M15.1–M15.2 |

The parent closes only after real storage, scheduler, accounting, identity-coordinator, inventory-suite and interface integration pass. F03/F06/F09/F11 are resolved below at the contract level; M09 owns the exact inventory catalog and its coverage count.

The binding [mandatory task-commit contract](../../BENCHMARK-MODES.md#mandatory-task-commits) extends M08.1's existing observation schema, check index/validation, classification and durable lifecycle, and M08.2's suite/repository runners and evidence adapters. Consume M01's approved frozen `required_per_task` executable check/source/scope closure and M05's `TaskCommitProtocolRef` / durable `TaskRepositoryEvidence`; M05 prepares Git and captures facts, M08 classifies them, and M02 retains them. M08.3 consumes those same projections for the [mandatory commit evidence states](../../BENCHMARK-DESIGN-SPEC.md#mandatory-commit-review-and-evidence). This is a binding child-ownership extension, not a parallel check engine or a completed feature. **[R183]**

## Purpose and boundaries

The frozen executable acceptance checks determine task success. Agent completion statements, process exit codes, and independent judge grades are separate observations and cannot substitute for those checks. Checks assess the approved observable requirements without imposing an unnecessary source layout, internal design, or implementation technique. **[R073, R144]**

Verification participates in execution of the pinned template revision: approved checks run, evidence is preserved, and progress and measurement information remain available through the execution workflow. M11 owns orchestration, M10 owns measurements, and M15 owns their presentation; this module supplies verification progress, outcomes, and evidence to those collaborators. **[R034]**

## Inputs, operations, and outputs

Conceptual inputs are the pinned template's specification and approved executable checks, the task identity and resulting snapshot, the delivered artifact for final regression, and independently recorded process outcomes. Browser or backend setup uses the template's approved execution instructions and available prerequisites. These inputs identify what is being verified; they do not authorize revising acceptance requirements after seeing a competitor's output. **[R034, R073, R074, R076, R144]**

For each task, run the applicable approved checks against a disposable copy of its snapshot. Keep verification tooling outside competitor source. Preserve the task snapshot as evidence while allowing the disposable copy to absorb test activity. Verification must not manually repair generated application code, whether a check fails or setup exposes an application defect. The delivered artifact receives a final regression check, also through a disposable copy, so earlier successful observations cannot stand in for its final behavior. **[R074]**

Outputs comprise independently recorded process and verification outcomes plus task-associated evidence, snapshots, logs, and available commit identities. A missing commit identity remains unavailable rather than being invented. Evidence must remain attributable to the task and snapshot it describes; final regression evidence describes the delivered artifact. These are conceptual information requirements, not a prescribed storage format or check schema; the format chosen for this implementation is recorded under Implementation and is not a product requirement. **[R074, R076]**

Browser verification uses Python Playwright. Exercise meaningful workflows and keyboard behavior, observe browser errors, and capture desktop screenshots at 1440×1000 and mobile screenshots at 390×844. Which steps capture screenshots is defined by the template's checks; each capture produces both viewports. Screenshots support inspection; producing images alone does not establish workflow success. Backend verification exercises the approved interface contract. Fullstack artifacts require the applicable browser and backend behavior to be observable through that contract. **[R073, R075, R149]**

Provide the resulting acceptance evidence to the independent judge separately from measured execution statistics. The handoff includes the relevant check results and browser evidence without conflating behavioral verification with cost, timing, or other execution measurements. Judge evidence follows the approved profile-specific final-artifact coverage plan: web uses its existing two-viewports rule, native mobile uses its frozen device/state matrix, and text-domain profiles use their declared interface, change/recovery, agent-scenario or specification-validation evidence. Per-task screenshots stay in evidence, results and the report but are not judge input. A later judge grade must not rewrite a check outcome. **[R075, R083, R144]**

## Outcomes, failures, and invariants

Record each check as passed, failed, or unverified. Passed means the executable check established its required observable behavior; failed means it established a requirement failure; unverified means verification could not establish whether the requirement passed or failed. Missing prerequisites and broken verification infrastructure must be distinguishable from observed application failures and from each other, with their reasons retained. An inability to run a check cannot produce a pass. **[R073, R076, R144]**

Keep process completion, process failure, failed checks, unverified checks, and judge grades distinct throughout retention and presentation. For example, successful process termination can coexist with a failed check, and an interrupted process can coexist with whatever checks were actually established against its snapshot. Neither example permits missing verification to be inferred. Logs and available evidence remain attached to the affected task even when verification cannot complete. **[R076, R144]**

For every attempted new-policy task, the mandatory protocol check requires at least one new competitor-created reachable commit absent from its captured start history; an unborn start must become a valid first commit. The born start tip and all retained prior stage tips must remain ancestors of the end tip. Multiple commits and an explicit empty milestone commit for a no-change task are valid; a setup commit never counts. The end tree must match the task's delivered paths, bytes, deletions and executable flags under the frozen scope, with no staged, unstaged or untracked deliverable change. Actual filesystem inventory and retained inclusion/exclusion reasons control this observation: ignore rules or default Git status cannot hide required paths. Readable evidence establishing a missing commit, invalid advancement, rewritten ancestry or dirty delivery yields `failed/application_failure`; unreadable or insufficient history/snapshot evidence yields `unverified` with the applicable existing infrastructure cause and actual reason. Preserve snapshots, logs and partial evidence in either case. Process outcomes, behavioral checks and grades remain separate; apply existing M11 continuation/stop and M06 outcome rules without a new ranking penalty, engine auto-commit, task retry or model repair invocation. **[R183]**

Template identity failure is outside check classification: every in-run `IdentityMismatch(check)` propagates to M11's run invalidation coordinator, including suite reads, final regression, after the last task and cleanup. Retain already observed outcomes and partial evidence; the run overlay makes all its trials non-comparable without rewriting those facts. Every stored check/evidence/summary carries shared `TrialRef` or an explicitly resolved `ResultId`; retained navigation never selects a current/latest trial implicitly. **[R067, R076, R134, R153, R154; F06, F09]**

## Dependencies and integration

[M01](01-template-library-identity.md) and [M16](16-custom-template-planning.md) supply approved template inputs and the baseline context. [M05](05-harness-execution-isolation.md) and [M11](11-run-orchestration.md) supply execution outcomes and task artifacts; [M03](03-environment-readiness.md) exposes prerequisite availability. [M02](02-retained-results-comparability.md) retains task evidence and commit identities. [M12](12-quality-judging.md) consumes evidence for judging, while [M10](10-measurements-cost.md) retains statistics separately. [M06](06-scoring-rankings.md), [M15](15-terminal-interface.md), and [M13](13-standalone-html-report.md) consume verification outcomes without merging them with grades or process status. **[R034, R074, R075, R076, R144]**

Product integration verification must exercise frontend and backend workflows end to end, including an existing-repository baseline. Collaborate with M16, M06, and M15 to make TUI navigation, terminal resizing, failure states, and score calculations verifiable. Python Playwright is mandated for browser verification; the product contract does not prescribe a framework for terminal or scoring checks. The test levels this implementation uses are listed under Headless verification. **[R149]**

## Testable acceptance criteria

- A process reports success while an observable requirement fails: the approved check records failure. A favorable judge review does not change it. Unexecuted checks remain unverified. **[R073, R144]**
- Task checks use disposable snapshot copies, verification tooling remains outside competitor source, and verification introduces no manual application fixes. Final regression tests the delivered artifact and preserves earlier task evidence. **[R074, R076]**
- Python Playwright evidence demonstrates meaningful browser workflows, keyboard behavior, browser-error observations, and screenshots at both required dimensions at the steps the checks define. Backend evidence exercises the approved interface, and the judge receives evidence separately from measured statistics, with the final-regression screenshots at both viewports and no per-task screenshots. **[R075, R083]**
- Missing prerequisites, broken verification infrastructure, application-check failures, and process failures remain distinguishable in retained task outcomes, logs, snapshots, and available commit identities. **[R076, R144]**
- End-to-end frontend and backend scenarios include an existing-repository baseline, expose progress and measurements alongside preserved evidence, and verify navigation, resizing, failure handling, and score calculation integration. **[R034, R149]**

## Implementation

This section applies the [headless engine architecture](../../../ARCHITECTURE.md). It records implementation decisions; the requirements above remain the product contract. Paths, file formats, defaults and type names below are implementation choices and may change without changing product behavior.

### 1. Engine component

Package `axbenchmark.engine.verification`. M08 never decides when verification runs: [M11](11-run-orchestration.md) calls it after each task process ends and once more for the delivered artifact, through the application interface below. M08 owns the disposable copies, the verifier processes and the application services started on those copies, the classification of every check, the verification evidence files, and the evidence bundle handed to [M12](12-quality-judging.md). It hands outcomes and evidence to [M02](02-retained-results-comparability.md) for retention and reads them back from M02 for every query, so live, finished and imported results are served by one path.

#### Domain (`engine/verification/domain/`)

Frozen slotted dataclasses and enums; no I/O, no asyncio, no pydantic.

| Type or rule | Content |
|---|---|
| `CheckKind` | Enum `repo`, `browser`, `keyboard`, `backend`. Taken from the frozen check definition; it selects the runner, it does not change classification. |
| `CheckDefinition` | `check_id`, `task_id`, `title`, `kind`, `required: bool`, `entry` (relative check module path), `support_refs: tuple[RelPath, ...]` (declared helpers/fixtures), `needs: tuple[Prerequisite, ...]`, `timeout`, and the mandatory observation contract below. Parsed from the frozen revision; never edited by M08. **[R073]** |
| `CheckSuite` | Ordered definitions plus approved `ExecutionInstructions` (setup, start, stop, readiness probe, base URL or entry file). `checks_for(task_id, phase)` and `all_checks(phase)` select only definitions declaring that phase. Final checks observe the delivered artifact; historical obligations use preserved task snapshots, not a fabricated final-state substitute. |
| `CheckPhase` | Enum `at_task`, `final_regression`; `Phase` is its internal alias, never a second type. Every result, event and evidence file carries it. **[R074]** |
| `CheckStatus` | Enum `passed`, `failed`, `unverified`. The only three outcomes. **[R073, R076]** |
| `NotPassedCause` | Enum `application_failure` (with `failed`), `missing_prerequisite`, `verifier_error`, `not_run` (each with `unverified`). The pairing is enforced in `CheckResult.__post_init__`. **[R076, R144]** |
| `StepRecord` | `index`, `description`, `ok: bool`, `keyboard: bool`, `observed: str \| None`, `captured: bool` (the check captured screenshots after this step). A step is a requirement observation declared by the check. |
| `RunnerReport` | What a verifier process returned: `exit` (code or signal), `report: ParsedReport \| None` (`verdict: passed \| requirement_failed \| check_crashed \| prerequisite_missing`, expected, observed, steps, console errors, screenshot files, traceback). |
| `classify(snapshot, preflight, report) -> CheckResult` | No task snapshot → `unverified/not_run`. Unmet prerequisite → `unverified/missing_prerequisite` with M03's reason. A validated `requirement_failed` with declared expectation and observation evidence → `failed/application_failure`, including an approved application setup/start expectation. A valid passing report with all required observations and exit 0 → `passed`. Crashes (inside or outside a step), timeout kills, unexplained nonzero exit, missing/malformed report and unresolved observation strategy → `unverified/verifier_error`. A well-formed explicit requirement failure may use the runner's designated assertion exit code; an arbitrary nonzero exit establishes nothing. Screenshots/console data alone do not decide status. `IdentityMismatch`, persistence and acknowledgement failures never enter this function. **[R073, R076, R144]** |
| `CheckResult` / exported `CheckOutcome` | One type, exported under both names for M02: `result_id`, `trial: TrialRef`, `check_id`, defining `task_id`, `phase`, `status`, `cause \| None`, `reason`, `expected`, `observed`, observation-contract id, `steps`, `console_errors`, `evidence`, `duration`, `snapshot: SnapshotRef \| None`, `tooling`. Missing snapshots carry an explicit reason. A final result keeps the check's defining task id and separately identifies the delivered snapshot's task. |
| `ToolingFacts` | Verifier version, Playwright for Python version, browser name and build, tooling location, `copy_disposed: bool`, `repairs: Literal["none"]`. The type admits no other repairs value. **[R074, R075]** |
| `SnapshotRef` | M05's snapshot id, `result_id`, `trial: TrialRef`, source `task_id`, `commit: CommitIdentity \| Unavailable(reason)`. A missing commit stays unavailable. A declared commit-advancement check separately observes repository history; absence of a required commit with readable history is a failed requirement, not merely unavailable display metadata. **[R076]** |
| `Viewport` | Constants `DESKTOP = Viewport(1440, 1000)`, `MOBILE = Viewport(390, 844)`. A browser check captures at the steps its module requests (`CheckContext.capture()`); every capture produces both viewports. The template's checks, not M08, decide which steps capture. **[R075]** |
| `TaskVerification` | Stable `verification_id`, `result_id`, `trial: TrialRef`, target `task_id`, `phase`, `state: pending \| running \| complete`, `stage`, `results`, `process_outcome_ref` (shown, never used for classification), `failure`. `complete` requires durable M02 writes and M10 acknowledgement. `summary()` counts by defining task and phase without mixing final/post-task observations. |
| `Stage` | Enum `preserve_snapshot`, `create_copy`, `setup`, `run_checks`, `capture_screenshots`, `dispose_copy`, the steps drawn on VerifyProgress. |
| `compare(at_task, final) -> tuple[RegressionRow, ...]` | Per check: both results and `change: same \| fixed \| regressed \| differs`; an absent declared phase has `None` plus reason and `differs`, never a synthetic pass/fail. Different trial/result bindings are rejected. Both sides are kept; neither replaces the other. **[R074]** |
| `JudgeEvidence` | `result_id`, resolved `trial`, final artifact `SnapshotRef`, revision refs, per-task and final behavioral `JudgeCheckEvidence` projections, profile-required final-regression delivered-artifact evidence keyed by phase/check/step and frozen coverage-plan reference: web screenshot pairs, native mobile captures/semantic trees, scoped backend observations, DevOps plan/recovery evidence, product-agent scenario/tool/state traces or document graph/link reports. Every item binds its actual final snapshot and domain target/scenario; native capture context retains platform/OS/device/orientation/density/dimensions as declared. Keyboard steps and console errors remain available where applicable. The projection omits `CheckResult.duration`, process timing, measurement fields and per-task screenshot refs; filtering only the top-level screenshot list is insufficient. No cost, tokens, time or hardware enters the bundle. `KEPT_APART` lists those categories and per-task screenshots for display. **[R075, R083, R144]** |
| `assert_outside(tool_dir, copy_dir, workspace)` | Raises `ToolingInsideWorkspace` when the tooling directory is inside either tree. Called before every runner start. **[R074]** |

Domain errors: `ToolingInsideWorkspace`, `SnapshotUnavailable`, `SuiteInvalid(path, message)`, `PhaseNotReady`, `UnknownCheck`, `ScopeMismatch`, `PersistenceFailed`, `ObservationAckFailed`. M01's `IdentityMismatch(check)` is preserved unchanged outside ordinary classification.

#### Frozen observation contract (`acceptance.v1`)

M08 publishes `engine/verification/schemas/acceptance-v1.schema.json` at Bootstrap. The document is `{schema_version: "acceptance.v1", checks: [...]}`; execution instructions come from M01's canonical definition. Each check has the fields above and these mandatory fields. Reject unknown fields, duplicate ids, unknown task/requirement refs, unsafe entry paths and empty phase/evidence rules before execution. Suite bytes, check modules and referenced helpers/fixtures participate in M01 identity through the canonical definition’s `support_paths`; the engine’s schema implementation is versioned tooling, not an extra undeclared payload file. **[F11]**

For `required_per_task`, `SuiteSource`, `CheckFormat.validate_bindings` and `CheckIndex` resolve the approved protocol's executable check declarations into the existing runtime `CheckSuite`, using `CheckDefinition`, the known `repo` kind and the same observation/runner contract. Freeze stable check ids and task bindings with their source/version/digest before approval; retain each check's origin (authored acceptance or mandatory protocol), requirement/source reference and policy/check provenance through indexing, execution and outcomes. Validate ids across both origins, rejecting collisions, unknown tasks/strategies, missing source/scope references and reference escapes before launch; never guess a kind, generate replacement ids or load loose files. File references must close through M01's existing allowed `support_paths` and protocol reference validation. Preserve canonical authored suite/order/`tasks.check_ids` equality, including an explicitly empty authored suite: protocol entries extend the runtime index without rewriting that suite, adding metadata fields or changing the definition codec. Required protocol checks remain indexed and executable when behavioral check count is zero; their pass proves no behavioral coverage. **[R183]**

| Field | Contract |
|---|---|
| `requirement` | `{id, source_ref, statement}` pointing into an approved task/spec/protocol; the statement describes only that requirement's observable obligation. |
| `phases` | Nonempty list of `{phase: at_task \| final_regression, target: task_snapshot \| delivered_artifact \| task_history, prerequisite_task_ids: list[TaskId]}`, with unique phases. `at_task` may require no later task and cannot target the delivered artifact. Historical facts use actual task snapshots/history; final behavioral checks target the delivered artifact. |
| `observation` | `{strategy_ref, inputs, expected, evidence_kinds, on_unobservable}`. `strategy_ref` names a frozen check-module strategy; inputs/expected are schema-validated JSON values for that strategy. Evidence kinds are a nonempty list of `repository`, `data`, `browser`, `http`, `keyboard`, `console`, `screenshot`, `log`. `on_unobservable` is always `unverified/verifier_error`, retaining why the strategy failed. |
| `failure_rule` | `{expectation_id, mismatch_description}` identifies the deliberate assertion whose observed contradiction establishes `failed/application_failure`; missing prerequisites and infrastructure errors retain their separate unverified causes. A step boundary never turns an arbitrary exception into an application failure. |

The runner emits `ObservationRecord(contract_check_id, requirement_id, phase, target_snapshot_refs, strategy_ref, expected, observed, evidence_ids, outcome, cause, reason)`; M08 adds `result_id`/`TrialRef` and validates that scope and phase agree before retention. A pass needs the declared observations, not just a runner exit code. Requirement assertions use `CheckContext.expect(expectation_id, observation)`; runner faults use typed infrastructure errors. A cleanly executed declared workflow that demonstrates a missing required action is an application failure; ambiguous locators, unsupported instrumentation or undecodable data are unverified with reasons.

Strategies use approved public behavior, accessible roles/names/labels and documented interfaces, with deterministic discovery logged as evidence. No fixed CSS selector, DOM layout, localStorage key or JSON shape becomes an extra requirement. Read-only repository/data observation or external runtime instrumentation may discover varying implementations but must not patch generated code or force a new application API. If a fair observation cannot be established, record the limitation. Data-stage checks do not demand later UI: T2 can pass its data/persistence obligations without T3's inventory-management interface. M09 supplies the exact strategies, catalog and phase mappings next, including separate task-commit advancement observations and two materially different conforming fixtures; no fixed 21-check count is inherited here.

#### Ports (`engine/verification/ports.py`)

```python
class SuiteSource(Protocol):                 # bound to M01's RevisionReader
    async def suite(self, sha: Sha256) -> CheckSuite: ...              # raises IdentityMismatch, SuiteInvalid
class IdentitySource(Protocol):              # bound to M01's TemplateIdentity
    async def check(self, sha: Sha256) -> IdentityCheck: ...            # matches=False is promoted to IdentityMismatch(check)
class SnapshotSource(Protocol):              # bound to M05's application interface
    async def task_snapshot(self, trial: TrialRef, task: TaskId) -> SnapshotRef | None: ...
    async def materialize(self, ref: SnapshotRef, into: Path) -> None: ...   # read-only source, copy target
class DisposableCopies(Protocol):
    async def create(self, ref: SnapshotRef) -> DisposableCopy: ...    # under ~/.axbenchmark/tmp/verify/
    async def dispose(self, copy: DisposableCopy) -> bool: ...
class Preflight(Protocol):                   # bound to M03's AssessOperation
    async def unmet(self, needs: Sequence[Prerequisite]) -> Sequence[UnmetPrerequisite]: ...
class AppServices(Protocol):                 # approved setup/start/stop on the copy
    async def start(self, copy: DisposableCopy, instr: ExecutionInstructions, lease: VerificationLease) -> ServiceHandle: ...
    async def stop(self, handle: ServiceHandle) -> CleanupOutcome: ...
class CheckRunner(Protocol):                 # one verifier process per check
    async def run(self, check: CheckDefinition, target: CheckTarget, out_dir: Path) -> RunnerReport: ...
class VerificationLeases(Protocol):          # bound to M05: ports and an empty browser profile per verification
    async def acquire(self, trial: TrialRef) -> VerificationLease: ...
    async def release(self, lease: VerificationLease) -> None: ...
class EvidenceFiles(Protocol):               # working files before hand-over to M02
    def task_dir(self, trial: TrialRef, task: TaskId, phase: CheckPhase) -> Path: ...
class ResultSink(Protocol):                  # bound to M02's ResultRecorder
    async def append_check_outcomes(self, rid: ResultId, trial: TrialRef, task: TaskId, phase: CheckPhase, checks: Sequence[CheckOutcome], operation_id: str) -> None: ...
    async def attach_evidence(self, rid: ResultId, ref: EvidenceRef, operation_id: str) -> None: ...
class VerificationObservations(Protocol):    # M10 application interface; critical acknowledged delivery
    async def record_verification(self, observation: VerificationObservation) -> ObservationReceipt: ...
class ResultSource(Protocol):                # bound to M02's RetainedResultReader and evidence reader
    async def get(self, rid: ResultId) -> EffectiveResult: ...
    async def for_template(self, sha: Sha256, f: ResultFilter | None) -> Sequence[EffectiveResult]: ...
    async def read_evidence(self, rid: ResultId, evidence_id: str) -> bytes: ...
    async def evidence_path(self, rid: ResultId, evidence_id: str) -> Path: ...
class SystemOpener(Protocol):
    async def open(self, path: Path) -> None: ...                      # macOS `open`, Linux `xdg-open`
    async def reveal(self, path: Path) -> None: ...
```

`EventPublisher`, `Clock` and `IdGenerator` come from `engine/shared`. `EligibilityNotes` is M06's application Protocol (`ScoringRules.eligibility_notes`), used only to attach M06's own text to a not-passed row.

#### Application (`engine/verification/application/`)

Interfaces offered to other engine modules (`application/interfaces.py`):

```python
class TaskVerifier(Protocol):                # used by M11
    async def verify_task(self, rid: ResultId, trial: TrialRef, task: TaskId, sha: Sha256) -> TaskVerification: ...
    async def verify_final(self, rid: ResultId, trial: TrialRef, sha: Sha256) -> TaskVerification: ...
    async def cancel(self, run_uid: RunUid, cfg: ConfigurationId | None) -> None: ...  # stops all scoped active trials; awaits cleanup/writes
    async def reconcile(self) -> None: ...                                         # engine start: dispose orphan copies, end orphan verifiers
class AcceptanceEvidence(Protocol):          # used by M12
    async def for_judge(self, rid: ResultId) -> JudgeEvidence: ...                 # raises PhaseNotReady before the final regression
class CheckIndex(Protocol):                  # used by M01 (task tab) and M09 (coverage)
    def titles(self, definition: TemplateDefinition) -> Mapping[TaskId, Sequence[CheckTitle]]: ...
class CheckFormat(Protocol):                 # used by M16 (planned and edited checks) and M09 (package tests)
    def parse(self, document: bytes) -> CheckSuite: ...                           # raises SuiteInvalid
    def validate(self, document: bytes) -> Sequence[ErrorInfo]: ...               # acceptance.v1 structure; empty when valid
    def validate_bindings(self, suite: CheckSuite, definition: TemplateDefinition) -> Sequence[ErrorInfo]: ...  # task/source/support refs and phase prerequisites
class CheckSummaries(Protocol):              # consumed by M10; no current/last-trial fallback
    async def for_trial(self, trial: TrialRef, phase: CheckPhase) -> Mapping[TaskId, CheckSummary]: ...
```

Resolve `rid` through M02 and require equality with `trial` before allocating, reading or writing. `CheckSummaries` reads M02's explicit trial/phase records; each returned summary carries that scope. M10's former `for_configuration(run, cfg)` lookup is replaced by `for_trial(trial, phase)`.

| Use case | Kind | Behavior |
|---|---|---|
| `VerifyTask` | internal | Validate result/trial binding, open the verified suite, resolve the exact task snapshot (absent → applicable checks `unverified/not_run`), create a disposable copy, preflight, acquire that trial's lease, start approved services, run declared at-task checks, capture both viewports, drain/stop/dispose/release. Retain each classified result and evidence through M02, then await M10's observation receipt before returning/publishing completion. Only ordinary infrastructure failures classify prevented checks as unverified; requirement failures need observed assertion evidence. Identity and durable-write/acknowledgement failures propagate. **[R034, R073–R076]** |
| `VerifyFinal` | internal | Check identity before and after final regression; use the last task's snapshot as delivered artifact and `all_checks(Phase.final_regression)`. History-targeted checks read their preserved snapshots; post-task results are never replaced. Attach each result to its defining task and final phase, keeping artifact task separately. Await the same durable handoffs. M11 also checks identity after the last task and before finalization/judging. **[R067, R074, R153]** |
| `CancelVerification` | internal | Called by M11 stop/invalidation: stop and drain verifier/service groups, record unfinished checks `unverified/not_run` with terminal cause, retain partial evidence, dispose/release and await writes/acknowledgement. Identity invalidation itself is never a check outcome. |
| `ReconcileVerification` | internal | Before readers are admitted, load persisted verification journals and run invalidations, end orphan groups, retain observed partial facts, finish pending writes/acknowledgements and dispose copies. Unfinished ordinary interrupted checks are `unverified/not_run` with reason `engine stopped`; never rerun checks or alter sealed facts. Failures keep finalization pending. |
| `PrepareJudgeEvidence` | internal + query | Builds phase-separated behavioral projections and only final-regression screenshots of the delivered artifact. Recursively exclude duration/measurement fields and per-task/historical-snapshot screenshot refs. `for_judge` rejects an invalidated run; query presentation keeps evidence inspectable with its run reason. Backs `AcceptanceEvidence.for_judge` and `verification.judge_input.get`. **[R075, R083]** |
| `GetTaskChecks`, `GetRegression`, `ListNotPassed`, `ListScreenshots`, `GetProgress` | query | Back the queries in part 2; read through `ResultSource` (plus in-memory stage state for a running verification) and compute capability flags. |
| `OpenEvidence`, `RevealEvidence` | command | Resolve the evidence path through M02 (confined to the result directory) and hand it to `SystemOpener`. No state changes. |

`VerifyTask` includes the frozen mandatory protocol check after every attempted task's process drainage, consuming that invocation's retained start/end repository facts and snapshot through the existing M05/M02 ports. It does not depend on a nonempty authored suite or successful application service setup. The task cutoff fixes its evidence and protocol outcome: later commits, later-task snapshots and final regression cannot repair the milestone, and no live workspace `HEAD` substitutes for the retained task facts. Never-started tasks receive no fabricated protocol outcome. Stop/interruption preserves established observations and records unfinished verification as `unverified/not_run` with its actual terminal reason, without new model or repair work. `VerifyFinal` presents those retained at-task protocol outcomes; any declared final history observation reads the same task-bound evidence, never reruns a prior milestone against final `HEAD` or replaces its outcome. A protocol check with no final phase keeps the existing `None`/reason comparison semantics and contributes no invented final-phase pass. **[R183]**

**Awaited accounting and retention (F03).** Allocate one durable `verification_id` per `(ResultId, target task, phase)`. Use stable M02 operation IDs `verification:<id>:check:<check_id>` for each immutable outcome and `verification:<id>:evidence:<evidence_id>` for each file. Attach durable evidence before the referencing outcome. Identical retries are no-ops; conflicting bytes fail. A journal records pending fact/evidence writes and observation delivery so recovery completes the same operation without rerunning verification. Persistence failure is `verification.persistence_failed`, never a successful/ordinary unverified check.

Mandatory protocol observations bind `ResultId`, `TrialRef`, task and `InvocationId` to M05's retained start/end `HEAD` (including absent/unborn states), commit/tree ids, newly reachable commits, retained prior tips/ancestry, setup-versus-competitor origin, snapshot/digests, scoped dirty/untracked paths and inclusion/exclusion reasons. Retain policy/check version/digest, expected/observed values, classification and evidence references through these same durable idempotent writes. Git ids are evidence, never template SHA-256 identity; commit timestamps establish neither task timing nor attribution. Recovery replays the same bounded task-cutoff facts/writes without reobserving a later repository state, creating commits or rerunning competitor work. **[R183]**

`VerificationObservation` is `{observation_id, verification_id, result_id, trial, phase, artifact_task_id, summaries: tuple[TaskCheckSummary], started_at, finished_at, terminal_cause, evidence_ids}`. Each `TaskCheckSummary` contains `task_id`, phase, passed/failed/unverified/not-run counts and check ids; scope comes from the observation. `observation_id = verification:<id>:summary` is stable. M10's `record_verification` returns `ObservationReceipt(observation_id, payload_digest)` only after durable acceptance into its accounting journal; identical deliveries deduplicate, conflicts fail. M08 persists that receipt before marking complete. Failure is `verification.observation_ack_failed`; retry preserves evidence/outcomes. Verification durations stay outside competitor benchmark elapsed, and phase-keyed summaries never double-count post-task and final checks. UI events are not the delivery mechanism.

M11 awaits every M08 operation (including canceled/partial ones), then M10 `drain_run`, M18 close, M10 `finalize_run` and M02 seal in the [shared barrier](../../../ARCHITECTURE.md#finalization-and-immutable-retention). A completion event is observational, never permission for M12 to start independently: M11 starts judging after the barrier and identity gate. Late writes/acks block completion, export and report readiness.

**Identity propagation (F09).** Any `IdentityMismatch(check)` from suite/revision reads, pre/post-final checks or cleanup is retained as the fatal primary signal; broad exception handlers and exception groups must extract and rethrow it unchanged. Stop/drain children and retain already observed evidence in `finally`; secondary cleanup/storage errors are recorded for recovery and never mask identity. The M11 operation owner receives the original check plus detection source and calls `RunInvalidationCoordinator.invalidate(trial.run_uid, check, detected_at, source)` outside the child being joined, avoiding a coordinator waiting on itself. M11's after-last-task and before-finalization gates use the same route even when no further verification remains. No success/completed event is published on that exceptional return, no suite is re-pinned, and already sealed trials receive only the append-only run invalidation overlay.

#### Adapters (`engine/verification/adapters/`)

| Adapter | Implements |
|---|---|
| `suite_v1.py` | `SuiteSource` over M01's `RevisionReader`: validates the frozen `checks/acceptance.v1.json` against the observation schema, resolves canonical definition references and execution instructions; also implements `CheckIndex`. M16 emits the same format. Never catches `IdentityMismatch` as `SuiteInvalid`. |
| `runner_process.py` | `CheckRunner`: starts `python -m axbenchmark.engine.verification.adapters.verifier` in its own process group with its working directory in the tooling directory, never in the copy, and arguments naming the check module (read from the read-only revision tree), the target and the output directory. It enforces the check's time limit and reads `report.json`. |
| `verifier/` | Provides `CheckContext` (`step()`, `expect(expectation_id, observation)`, `press()`, `capture()`, `page`, `http`, `repo`). Python Playwright uses fresh profiles per check with check-declared state continuity inside its workflow. Capture both viewports at each declared step without dropping/changing workflow state; paired captures identify the same logical step. Write validated `report.json` including observation/evidence refs. Only a typed declared requirement assertion becomes `requirement_failed`; arbitrary exceptions even inside `step()` become `check_crashed`. Missing browser executable is `prerequisite_missing`; identity exceptions propagate as fatal signals. **[R075]** |
| `fs_copies.py`, `journal.py` | Scoped disposable copies and working evidence allocation; persist lifecycle/operation IDs and pending deliveries before acknowledging. Copy removal is confined to recorded owned paths, never snapshot/source/tooling trees. M05 owns materialization. |
| `services_process.py` | `AppServices`: runs approved setup/start/stop commands with the copy as working directory, inside the lease's port range, and waits for the approved readiness probe. |
| `opener.py` | `SystemOpener`. |
| `rpc.py` | Maps `verification.*` methods to use cases, domain results to DTOs and domain errors to `verification.*` codes; registers the snapshot provider for the `verification` topic with M11's subscription service. |

The existing repository runner observes M05/M02's scoped immutable proof of the task's declared commit/tree/history and snapshot requirements; displayed commit metadata alone cannot prove compliance. M05 owns capture and Git preparation, while M02 owns retained evidence schema/reference validation. M08 supplies the bounded observations needed by M13 reports and [M17's inert evidence exchange](17-zip-exchange.md), so inspection survives workspace/source removal. Read/export/import paths consume retained facts and verdicts: never restore or materialize a live `.git` directory/pointer, hooks, configuration, remotes or alternates, execute checks on import, or introduce an M08 Git archive codec. **[R183]**

#### Persisted state

M08 writes working files only under the validated trial directory M11 hands it and hands every file to M02. M02 retains distinct paths under `results/<result_id>/evidence/verification/<phase>/<defining_task_id>/`; the result ID resolves exactly one TrialRef. Safe internal path encodings are allocated by the owner, never raw UI labels.

| Path | Content |
|---|---|
| `~/.axbenchmark/runs/<run_uid>/<configuration_id>/trial-<trial_index>/verify/at_task/<task_id>/` | Per check: `<check_id>.json`, `.log`, paired step PNGs; `stages.jsonl`, `services.log`, `operation.json` journal. Records carry explicit result/trial/task/phase. |
| `…/verify/final_regression/<defining_task_id>/` | Distinct final-phase check/evidence files; final operation journal additionally identifies the delivered-artifact task. No final check overwrites at-task evidence. |
| `~/.axbenchmark/tmp/verify/<copy_id>/` | Disposable copies only. Tooling lives outside both copies and competitor source; cleanup runs after preservation and during startup reconciliation. |

The task snapshot itself is M05's record; M08 only references it. Evidence metadata includes its TrialRef and digest, not credentials. Redact credential material from service/verifier diagnostics before retention and render application text inert. A process exit does not acknowledge its evidence files; M02 durable attachment does.

#### Owned processes

Verifier processes, the application services started from approved instructions on a copy, and the browsers Playwright launches are children of `axbenchmarkd` in per-verification process groups, never children of a client. They end when the verification finishes, on `TaskVerifier.cancel` (from `runs.stop`) and on engine-start reconciliation. Detaching a client never reaches them.

### 2. API surface (`verification.*`)

Verification itself has no client-callable command or job: it starts only from M11's run pipeline, so no interface can re-run, skip or override a check. The client surface is read-only over retained outcomes, plus two commands that open evidence on the local machine.

Use shared `RunUid`, `TrialRef`, `ResultId`, `ActionState`, `EventCursor` and the [error envelope](../../../ARCHITECTURE.md#error-envelope): application errors are JSON-RPC `-32000` with stable `error.data.code`, field/remedy/details; clients decode `EngineError`. M08 creates no alternative JobRef or cancellation API. Internal verification IDs are not jobs. Every retained DTO includes its resolved `result_id` and `trial`; collection rows also carry defining task and phase.

#### Queries (safety `read`)

| Method | Request | Response | Errors | Capability flags |
|---|---|---|---|---|
| `verification.task.get` | `result_id`, `task_id`, `phase: CheckPhase` | `TaskChecksDTO`: `result_bar` (origin, machine, harness, model, process outcome, check counts, snapshot commit or `null` with reason), `task_order: list[TaskRefDTO]`, `state: pending \| running \| complete`, `checks: list[CheckRowDTO(check_id, task_id, phase, title, kind, required, status, cause, reason)]`, `details: dict[check_id, CheckDetailDTO(status, cause, reason, expected, observed, steps, console_errors, screenshots, log_evidence_id, duration)]`, `facts: VerificationFactsDTO` (snapshot, checked-on, tooling, browser, repairs, process outcome label, grades label), `final_summary: list[RegressionRowDTO] \| None`, `failure: ErrorDTO \| None` | `verification.unknown_result`, `verification.unknown_task`, `verification.record_unreadable` | `can_previous_task`, `can_next_task`, `can_screenshots`, `can_final_regression`, `can_judge_input`, `can_open_log`, each with a reason code when false |
| `verification.regression.get` | `result_id` | `RegressionDTO`: `artifact` (task id, commit), `rows: list[RegressionRowDTO(check_id, title, kind, task_id, at_task, final, change)]`, `summary` (counts per phase, changed check ids) | `verification.unknown_result`, `verification.regression_pending` | `can_open_check` per row |
| `verification.not_passed.list` | `template_sha256`, `result_ids?`, `run_uid?`, `causes?: list[NotPassedCause]`, `text?` | `NotPassedPage`: `causes: list[CauseDTO(code, label, description, count)]`, `rows: list[NotPassedRowDTO(result_id, trial, phase, result_label, live, check_ids, status, cause, reason, task_id, evidence_ids, effect)]` (consecutive checks of one result/trial/task/phase with one cause are one row) | `verification.unknown_template`, `verification.invalid_filter` (with `field`) | `can_open` per row |
| `verification.screenshots.list` | `result_id`, `task_id`, `phase: CheckPhase`, `check_id?` | `list[ScreenshotDTO(result_id, trial, task_id, phase, check_id, after_step, viewport{name, width, height}, evidence_id, file_name, size)]` | `verification.unknown_result`, `verification.unknown_task` | `can_open`, `can_reveal` |
| `verification.judge_input.get` | `result_id` | `JudgeInputDTO`: `judge_label`, `given: list[HandoffItemDTO(label, count?, evidence_ids)]` (profile-required groups identify their frozen plan, coverage and evidence IDs; web screenshots retain both viewports, native captures name matrix cells, and text evidence has no invented image requirement), `kept_apart: list[HandoffItemDTO]` (includes per-task screenshots) | `verification.unknown_result`, `verification.regression_pending` | `can_reveal` |
| `verification.progress.get` | `trial: TrialRef` | `VerifyProgressDTO`: `result_id`, resolved `trial`, `task_id`, `phase`, `subject` (harness, model, effort), `stages: list[StageDTO(stage, label, status: done \| now \| todo)]`, `checks_done`, `checks_total`, `current_check`, `so_far: list[CheckRowDTO]`, `object_key`, `revision` | `verification.unknown_configuration` | `is_verifying` |

`CheckDetailDTO.observed`, step text and console output are data from the competitor's application; interfaces render them as inert text.

Extend existing `CheckTitle`, `CheckRowDTO`, `CheckDetailDTO`, `VerificationFactsDTO` and regression/not-passed projections with stable protocol check ids, check origin/source/provenance and the scoped repository-evidence references above. `CheckIndex`, `CheckSummaries`, progress/events and query counts include required protocol entries exactly once in their declared phase, with authored behavioral coverage separately identifiable; an empty authored suite still displays “No behavioral checks declared.” `verification.task.get`, `verification.regression.get`, `verification.not_passed.list` and existing evidence routes expose retained policy, commit/tree, ancestry, scope and cause details for `TaskCommitPending`, `TaskCommitPassed`, `TaskCommitMissing`, `TaskCommitDirty` and `TaskCommitUnverified` in the [design state matrix](../../BENCHMARK-DESIGN-SPEC.md#screen-and-state-change-matrix). Pending remains pending; interfaces render engine outcomes without Git execution, local verdicts or a new commit-management API. **[R183]**

#### Commands

| Method | Request | Response | Errors | Safety |
|---|---|---|---|---|
| `verification.evidence.open` | `result_id`, `evidence_id` | `OpenOutcomeDTO(path, opened: bool, message?)` | `verification.evidence_not_found`, `verification.open_failed` | `read` (changes no state) |
| `verification.evidence.reveal` | `result_id`, `evidence_id \| {phase, task_id?}` | `OpenOutcomeDTO` | `verification.evidence_not_found`, `verification.open_failed` | `read` |

#### Events (topic `verification`)

Every payload carries `result_id`, `trial: TrialRef` (including `run_uid` and `trial_index`), defining `task_id` or explicit summary task keys, `artifact_task_id`, `phase` and `verification_id`. Append-only completion entries carry stable IDs; projection events carry shared object keys/revisions and envelope `EventCursor`. Register exact names and routes with M11; `verification` has its atomic projection snapshot provider.

| Event | Payload | Consumers |
|---|---|---|
| `verification.task.started` | check count, snapshot commit or `null` | VerifyProgressScreen, RunScreen lanes (M11/M15), CLI progress |
| `verification.stage.changed` | `stage`, `status`, label | VerifyProgressScreen `#verify-steps` |
| `verification.check.completed` | `CheckRowDTO`, duration | VerifyProgressScreen `#verify-so-far`, TaskChecksScreen, ChecksScreen live rows |
| `verification.task.completed` | counts by status and cause, `started_at`, `finished_at` | M11, RunScreen, CLI progress line ("checks 2✓") |
| `verification.regression.completed` | counts per phase, changed check ids | FinalRegressionScreen, M11 (judging remains gated by durable finalization) |

#### Error codes

| Code | Raised when |
|---|---|
| `verification.unknown_result`, `verification.unknown_task`, `verification.unknown_configuration`, `verification.unknown_template` | Query target does not exist. |
| `verification.record_unreadable` | M02 cannot read the result's verification evidence. |
| `verification.regression_pending` | The final regression has not completed (or the configuration ended before a delivered artifact existed). |
| `verification.invalid_filter` | Unknown cause or malformed filter; `field` names it. |
| `verification.evidence_not_found` | The evidence id is not part of that result. |
| `verification.open_failed` | The system viewer could not be started; message verbatim from the OS. |
| `verification.scope_mismatch` | Result/trial/task/phase or evidence binding disagrees; reject before allocation/write. |
| `verification.persistence_failed`, `verification.observation_ack_failed` | Durable M02 write or M10 acknowledgement failed; keep finalization pending and preserve recovery state, never classify as check failure. |

Ordinary verification failures are data: they appear as `unverified` checks with `cause` and `reason`, and as `TaskChecksDTO.failure` when a whole task could not be verified (for example `verification.snapshot_missing`, `verification.tooling_inside_workspace`, `verification.suite_invalid`).

Identity exceptions bypass this mapping and reach M11; the resulting run reason is shared `runs.template_identity_invalidated`. Queries show retained rows unchanged with that run overlay, never manufacture unverified rows to disguise invalidation.

Legacy v1 definitions, hashes, check bytes and retained outcomes remain unchanged. Genuinely absent historic protocol evidence is `not_recorded` availability, not a new `CheckStatus`, fabricated unverified check or reason to regrade. M09 retains its repository-absent T1 start, competitor initialization/first commit and original advancement predicates/ids; do not generate duplicate mandatory checks or strengthen its legacy checks. M07/M01 own the reviewed-new-revision gate for an incompatible legacy definition's new launch; M08 cannot retrofit it while loading a suite or reading old results. **[R183]**

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `RevisionReader.open(sha)` (in-engine) | M01 | Frozen check definitions, execution instructions, specification, prompts and rubric refs; raises on identity mismatch. **[R067, R073]** |
| `TemplateIdentity.check(sha)`; `RunInvalidationCoordinator.invalidate(run_uid, identity_check, detected_at, source)` | M01 / M11 | Before/after final regression and M11 after-last-task/finalization gates; every mismatch takes the fatal run route including cleanup. |
| `HarnessExecution.task_snapshot(trial: TrialRef, task)` / `.materialize(ref, into)` (in-engine) | M05 | Source of each disposable copy; commit identity from the snapshot. **[R074]** |
| `HarnessResources.lease_verification(trial: TrialRef)` / `.release_verification(lease)` (in-engine): port range and empty browser profile disjoint from the competitor's | M05 | Running services and browsers on the copy without colliding with the configuration's live resources. **[R072, R074]** |
| `AssessOperation` (in-engine) / `environment.assess` | M03 | Preflight of Python Playwright, Chromium, Node.js and template-declared runtimes; its reason codes become `missing_prerequisite` reasons. **[R076]** |
| `ResultRecorder.append_check_outcomes`, `ResultRecorder.attach_evidence` | M02 | Await durable outcomes/evidence with explicit result/trial/phase and stable operation IDs. **[R076]** |
| `RetainedResultReader.get`, `.for_template`, `.evidence`, `.read_evidence` (in-engine counterparts of `results.evidence` / `results.read_evidence`) | M02 | Every `verification.*` query, imported results included; evidence confined to the result directory. |
| `ScoringRules.eligibility_notes` | M06 | The `effect` text on not-passed rows; M08 states no eligibility rule itself. **[R100]** |
| Calls to `TaskVerifier.verify_task` after each task exit, including missing snapshot, `verify_final` after the last task, `cancel` from stop/invalidation, `reconcile` at engine start; explicit trial directory allocation | M11 | Await scoped verification/evidence and propagate fatal errors before finalization. **[R034]** |
| `VerificationObservations.record_verification` / `MeasurementFinalizer.drain_run` and `.finalize_run` | M10 | Durable idempotent observation acknowledgement, phase-separated summaries and awaited final retention; events alone never satisfy delivery. |
| `events.subscribe` with per-namespace snapshot providers, `runs.status` | M11 | Live screens; VerifyProgress subject line. |
| Caller of `AcceptanceEvidence.for_judge` after M11 finalization/identity gate | M12 | Judge handoff without measurements. **[R075]** |
| Caller of `CheckIndex.titles` | M01, M09 | Task tab and coverage screens. |
| Caller of `CheckFormat.parse` / `.validate` | M16, M09 | Planned checks and the built-in suite use the one `acceptance.v1` reader. |
| Check generation in `acceptance.v1` format | M16 | Planned templates verifiable by the same runner. |
| App shell, `.-compact` class, push of TaskChecksScreen from ResultScreen `enter` on `#task-outcomes`, and of `EvidenceViewerScreen` from ResultScreen `l`, `#open-log`, "Open snapshot" and "Open evidence" | M02 / M15 | Navigation into M08 screens. |
| `p` on RunConfigScreen pushing `VerifyProgressScreen(trial: TrialRef)` (in its key list, beside `v` for the live view) | M05 | Entry point of VerifyProgress. |
| `results.evidence(result_id, task_id?)`, `results.read_evidence(result_id, evidence_id, offset, limit)` | M02 | EvidenceViewerScreen file list and paged content. |

### 4. Screens

All screens are pure views. View models are frozen dataclasses built by pure functions in `tui/viewmodels/verification.py`; they map `status`/`cause` to glyphs and wording (`passed` → “✓ passed”, `failed` → “✗ failed” bold, `unverified` → “? unverified” italic, `unverified` with `not_run` → “○ not run” dim) and never classify, count, compare phases or decide eligibility; counts, `change` and `effect` arrive from the engine. `check_action` returns `None` (dimmed, never hidden) when a capability flag is false. Every data widget sits in a `ContentSwitcher` with `#x`, `#x-loading`, `#x-empty`, `#x-error`; an error shows the engine's message and remedy verbatim with a Retry that repeats the load. All screens subscribe on mount and unsubscribe on unmount; leaving a screen sends no command.

M15 supplies typed-cursor/revision subscription handling, replacement snapshots and query-worker generation guards. Resume from the last applied subscription `EventCursor`, never a query snapshot's revision or watermark. Reject late responses from a previously selected result/trial/task/phase. Bars display explicit trial index/count, phase and any run invalidation reason. Preserve that scope through previous/next, log, screenshot, regression and judge navigation. Live lanes resolve a TrialRef before pushing progress. Evidence IDs, offsets and check IDs never replace trial identity. No screen resumes with a bare sequence number.

#### TaskChecksScreen — artboard TaskChecks (wide and compact)

| Item | Specification |
|---|---|
| Class and file | `TaskChecksScreen(Screen)` in `axbenchmark/tui/screens/verification.py`, constructed with `result_id`, resolved `TrialRef`, `task_id`, `phase` and optional `check_id` to focus. Tree, ids and TCSS as in the M08 board: `Header`, `Static #result-bar`, `Horizontal #main` with `Vertical #left` (`DataTable #task-checks .bordered`, `Static #verification-facts .kv`, `DataTable #final-summary .bordered`) and `VerticalScroll #check-detail .pane` (`Static #check-outcome`, `ListView #check-steps`, `Static #check-evidence .kv`), `Horizontal .actions` (`#screenshots`, `#final-regression`, `#judge-input` buttons), `Footer`. `Screen.-compact` hides `#verification-facts` and `#final-summary`. |
| View model | `TaskChecksVM(title, result_bar, rows: tuple[CheckRowVM, ...], cursor_check_id, details: Mapping[str, CheckDetailVM], facts: tuple[KV, ...], final_rows: tuple[RegressionRowVM, ...] \| None, state, failure: NoticeVM \| None, actions: Mapping[str, ActionState])` from `build_task_checks_vm(dto: TaskChecksDTO, focus: str \| None)`. |
| Load | Worker on mount and on task change: `verification.task.get(result_id, task_id, phase)`. |
| Subscriptions | `events.subscribe(["verification"])` filtered to `result_id`: `verification.check.completed` and `verification.task.completed` for this task, `verification.regression.completed`; each re-issues `verification.task.get` (debounced 250 ms). |
| States | `ContentSwitcher #task-checks-switcher`: `#task-checks`; `#task-checks-loading` (load in flight, or `state == running`: “Verifying T6 on a disposable copy…”); `#task-checks-empty` (`state == pending`: “T6 has not been verified yet”, “Checks run after the task process ends.”); `#task-checks-error` (typed RPC error or ordinary failure notice with engine reason). Retained rows keep their actual outcomes; invalidation/persistence errors do not rewrite them. |

| Binding | Action | API call |
|---|---|---|
| `esc` | `app.pop_screen` | none |
| row highlight in `#task-checks` | show that check in `#check-detail` | none (details are in the loaded DTO) |
| `←` / `→` | previous / next task in `task_order`; enabled by `can_previous_task` / `can_next_task` | `verification.task.get(result_id, task_id=…, phase=phase)` |
| `s`, `#screenshots` | push `ScreenshotsScreen(result_id, task_id, phase, check_id)`; enabled by `can_screenshots` | `verification.screenshots.list` (in that screen) |
| `f`, `#final-regression`, click on `#final-summary` | push `FinalRegressionScreen(result_id)`; enabled by `can_final_regression` | `verification.regression.get` (in that screen) |
| `j`, `#judge-input` | push `JudgeInputScreen(result_id)`; enabled by `can_judge_input` | `verification.judge_input.get` (in that screen) |
| `l` | push `EvidenceViewerScreen(result_id, log_evidence_id)` for the highlighted check; enabled by `can_open_log` | `results.read_evidence` (in that screen) |
| `tab` | `focus_next` | none |

#### FinalRegressionScreen — artboard FinalRegression

`FinalRegressionScreen(Screen)` in `tui/screens/verification.py`; tree `Header`, `Static #result-bar`, `DataTable #regression .bordered` (`height: 24; cursor_type = "row"`; `.change-regressed` bold), `Static #regression-summary .kv`, `Static .notice`, `Button #open-check`, `Footer`. View model `RegressionVM(result_bar, rows: tuple[RegressionRowVM, ...], summary: tuple[KV, ...], actions)` from `build_regression_vm(RegressionDTO)`; `change` renders as “=” (`same`), “✗ → ✓ fixed in T7” (`fixed`), “✓ → ✗ regressed” (`regressed`) from the engine's value. Load `verification.regression.get(result_id)`; subscribe to `verification.regression.completed` for the result. States `#regression`, `#regression-loading`, `#regression-empty` (`verification.regression_pending`: “The delivered artifact has not been checked yet”), `#regression-error`.

| Binding | API call |
|---|---|
| `esc` | none (`app.pop_screen`) |
| `enter`, `#open-check` | push `TaskChecksScreen(result_id, trial, row.task_id, final_regression, row.check_id)`, which loads `verification.task.get`; enabled by the row's `can_open_check` |
| `n` | push `ChecksScreen(template_sha256, result_ids=[result_id])`, which loads `verification.not_passed.list` |
| `tab` | none |

#### ChecksScreen — artboard CheckOutcomes

`ChecksScreen(Screen)` in `tui/screens/verification.py`, constructed with `template_sha256` and optional `result_ids` / `run_uid`; tree `Header`, `Static #result-bar`, `Horizontal #cause-legend` (4 × `Static .cause`), `DataTable #not-passed .bordered`, `Static #outcome-detail .pane`, `Footer`. View model `NotPassedVM(bar, causes: tuple[CauseVM, ...], rows: tuple[NotPassedRowVM, ...], detail: OutcomeDetailVM \| None, filter: FilterVM)` from `build_not_passed_vm(NotPassedPage, cursor)`. The cause legend renders `causes` in the order returned; the “Different from” line is built from the other causes' descriptions in the same response; `effect` is M06's text verbatim. Load `verification.not_passed.list(template_sha256, result_ids?, run_uid?, causes?, text?)`; subscribe to `verification.check.completed` and `results.result.sealed` for the template, re-issuing the list (debounced). States `#not-passed`, `#not-passed-loading`, `#not-passed-empty` (“Every check passed for these results”), `#not-passed-error`.

| Binding | API call |
|---|---|
| `esc` | none (`app.pop_screen`) |
| row highlight | none (detail is in the row) |
| `o`, `enter` | push `TaskChecksScreen(row.result_id, row.trial, row.task_id, row.phase, row.check_ids[0])`; enabled by `can_open` |
| `/` | focus a filter `Input`; on submit `verification.not_passed.list(…, text=…)` |
| `c` | cycle the cause filter (all → each `CauseDTO.code`); `verification.not_passed.list(…, causes=[code])` |
| `tab` | none |

#### ScreenshotsScreen — artboard Screenshots

`ScreenshotsScreen(Screen)` in `tui/screens/verification.py`; tree `Header`, `Static #result-bar`, `DataTable #shots .bordered`, `Horizontal #shot-frames` with `Static .shot.-desktop` (`width: 63; height: 24`) and `Static .shot.-mobile` (`width: 21; height: 24`), `Footer`. The frames are placeholders drawn to the proportions in `ScreenshotDTO.viewport`; terminals are not assumed to render images. View model `ScreenshotsVM(bar, rows: tuple[ScreenshotRowVM, ...], frames: tuple[FrameVM, FrameVM], actions)` from `build_screenshots_vm(list[ScreenshotDTO], cursor)`. Load `verification.screenshots.list(result_id, task_id, phase, check_id?)`; no subscriptions. States `#shots`, `#shots-loading`, `#shots-empty` (“No browser checks in this task”), `#shots-error`.

| Binding | API call |
|---|---|
| `esc` | none |
| `o` | `verification.evidence.open(result_id, row.evidence_id)`; `opened: false` shows the message verbatim |
| `f` | `verification.evidence.reveal(result_id, row.evidence_id)` |
| `tab` | none |

#### VerifyProgressScreen — artboard VerifyProgress

`VerifyProgressScreen(ModalScreen[None])` in `tui/screens/verification.py`, pushed by `p` on M05's RunConfigScreen, constructed with `trial: TrialRef`; tree `Vertical #verify-progress .dialog` (`Vertical #verify-steps` with `ProgressBar` `show_eta = False`, `Static #verify-so-far`, `Horizontal .dialog-actions` with Hide), `Footer`; dialog width 84. View model `VerifyProgressVM(title, steps: tuple[StepVM, ...], progress: tuple[int, int], so_far: tuple[CheckRowVM, ...], note)` from `build_verify_progress_vm(VerifyProgressDTO)`; events are folded in by a pure `apply_event(vm, event) -> VerifyProgressVM`. Load `verification.progress.get(trial)`; subscribe to `verification.stage.changed`, `verification.check.completed`, `verification.task.completed` for the exact trial, resuming with `cursor: EventCursor` via M15’s subscription manager. States `#verify-progress`, `#verify-progress-loading`, `#verify-progress-empty` (`is_verifying` false: “No verification is running for this trial”), `#verify-progress-error`.

| Binding | API call |
|---|---|
| `esc`, Hide | none; `dismiss(None)`; verification continues |

#### JudgeInputScreen — artboard JudgeHandoff

`JudgeInputScreen(ModalScreen[None])` in `tui/screens/verification.py`, over TaskChecksScreen; tree `Vertical #judge-input .dialog` (`Static #given`, `Static #kept-apart`, `Horizontal .dialog-actions` with Open folder and Close), `Footer`; dialog width 86. View model `JudgeInputVM(title, judge_label, given: tuple[str, ...], kept_apart: tuple[str, ...], actions)` from `build_judge_input_vm(JudgeInputDTO)`; the ✓ and ✗ lists are the two DTO lists, not a selection made by the screen. Load `verification.judge_input.get(result_id)`; no subscriptions. States `#judge-input`, `#judge-input-loading`, `#judge-input-empty` (`verification.regression_pending`), `#judge-input-error`.

| Binding | API call |
|---|---|
| `esc`, Close | none; `dismiss(None)` |
| Open folder | `verification.evidence.reveal(result_id, {phase: final_regression})`; enabled by `can_reveal` |

#### EvidenceViewerScreen — artboard EvidenceViewer

| Item | Specification |
|---|---|
| Class and file | `EvidenceViewerScreen(Screen)` in `axbenchmark/tui/screens/verification.py`, constructed with `result_id`, optional `evidence_id` to select, optional `task_id` to scope the list. Pushed by M02's ResultScreen (`l` and `#open-log` with the check log's id, "Open snapshot" with the task snapshot's id, "Open evidence" with no id) and by TaskChecksScreen `l` (the highlighted check's `log_evidence_id`). Tree: `Header`, `Static #evidence-bar`, `Horizontal #evidence-main` with `DataTable #evidence-files .bordered` (Kind, Task, Phase, Name, Size) and `Vertical #evidence-view .pane` (`Static #evidence-meta .kv`, `TextArea #evidence-text`, `read_only=True`, `soft_wrap=False`), `Horizontal .actions` (`Button #open-external` "Open in system viewer", `Button #reveal` "Show in folder"), `Footer`. `Screen.-compact` hides `#evidence-files` and shows the selected item only; `e` toggles the list. |
| View model | `tui/viewmodels/evidence.py`: `EvidenceViewerVM(bar, files: tuple[EvidenceFileVM, ...], selected: str \| None, meta: tuple[KV, ...], text: str \| None, text_complete: bool, binary_note: str \| None, actions: Mapping[str, ActionState])` from `build_evidence_vm(items: list[EvidenceItemDTO], chunks: Sequence[EvidenceChunkDTO], selected)`. Text is concatenated chunk data rendered inert; a non-text media type (screenshot, snapshot archive) sets `binary_note` ("Binary evidence · open it in the system viewer") and no text. `open_external` and `reveal` are always enabled for an item; the open outcome decides. |
| Load | Worker on mount: `results.evidence(result_id, task_id?)` for `#evidence-files`, then for the selected item `results.read_evidence(result_id, evidence_id, offset=0, limit=256 KiB)`. Scrolling to the end of `#evidence-text` while the last chunk has `eof == false` loads the next chunk with `offset` advanced; nothing is loaded past what the user scrolls to. |
| Subscriptions | Sealed evidence is immutable. For an unsealed result subscribe to `results.outcome.recorded` and `results.result.sealed` for this explicit result, refresh the list without changing selection, and discard stale content workers. |
| States | `ContentSwitcher #evidence-switch`: `#evidence` (list and view), `#evidence-loading`, `#evidence-empty` (no evidence for the result or task: "No evidence recorded"), `#evidence-error` (`results.not_found`, `results.evidence_not_found`, `results.evidence_outside_result` with message and remedy verbatim, Retry repeats the load). |

| Binding | Action | API call |
|---|---|---|
| `esc` | `app.pop_screen` | none |
| `↑ ↓` in `#evidence-files` | select item | `results.read_evidence(result_id, evidence_id, 0, limit)` for the new item (debounced 150 ms) |
| `end`, scroll past the last line | `more` | `results.read_evidence(result_id, evidence_id, offset, limit)`; disabled when `text_complete` |
| `o`, `#open-external` | `open_external` | `verification.evidence.open(result_id, evidence_id)`; `opened: false` or `verification.open_failed` shows the message verbatim |
| `f`, `#reveal` | `reveal` | `verification.evidence.reveal(result_id, evidence_id)` |
| `e` (compact) | toggle `#evidence-files` | none |
| `tab` | `focus_next` | none |

#### Screens owned elsewhere that consume M08

| Screen (owner) | M08 data |
|---|---|
| `ResultScreen` Outcomes tab (M02) | Check states and causes inside `results.get` outcomes, recorded by M08; `enter` pushes TaskChecksScreen. |
| `RunScreen` lanes, `RunConfigScreen` (M11/M15, M05) | `verification.task.started`, `verification.task.completed`; VerifyProgressScreen on top of RunConfigScreen through `p`. |
| Rankings, ScoreBreakdown (M06) | Required-check status via M02 records. |
| Measurements (M10) | Check counts per task via M02; durable phase-scoped counts/duration through awaited `VerificationObservations.record_verification`. |
| Template task tab (M01), coverage (M09) | Check titles through `CheckIndex`. |
| Judging screens (M12) | `JudgeEvidence` (final-regression screenshots at both viewports, no per-task screenshots) through `AcceptanceEvidence`; the review stores evidence references, never check outcomes. |
| HTML report (M13) | Task evidence and screenshots via M02. |

### 5. CLI

M14 owns the commands; these reach M08.

| Command | Methods |
|---|---|
| `axbenchmark run --config … --no-tui`, `axbenchmark --attach RUN_UID` | `runs.launch` / `events.subscribe` (M11); progress lines combine `harness.task.exited` with `verification.task.completed` (“T1 ✓ exit 0 · checks 2✓”). |
| `axbenchmark status RUN_UID` | `runs.status` (M11) with check summaries from M02; failed and unverified counts are printed separately. |
| Proposed for M14: `axbenchmark checks show RESULT_ID --task ID [--phase PHASE]`, `axbenchmark checks regression RESULT_ID`, `axbenchmark checks not-passed --template SHA [--result ID] [--cause CAUSE]`, `axbenchmark checks screenshots RESULT_ID --task ID [--phase PHASE] [--open]`, `axbenchmark checks judge-input RESULT_ID` | `verification.task.get`, `verification.regression.get`, `verification.not_passed.list`, `verification.screenshots.list` (+ `verification.evidence.open`), `verification.judge_input.get`. `--phase` defaults to `at_task` in the CLI and is always sent explicitly; `--json` prints the response models; a typed error exits 1. |

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain (`tests/verification/`) | `classify` table: no snapshot → `unverified/not_run`; unmet preflight → `missing_prerequisite`; `requirement_failed` → `failed/application_failure`; `check_crashed`, timeout kill, nonzero exit with a passing report, missing and malformed report → `unverified/verifier_error`; only an explicit pass with exit 0 is `passed`. Property test (hypothesis): no input without an explicit passing report yields `passed`; screenshots and console data never change the status. `CheckResult` rejects invalid status/cause pairs. `compare` yields `same`, `fixed`, `regressed`, `differs` and keeps both sides (a fixture with equal aggregate counts but one fixed and one regressed check). `assert_outside` rejects tooling inside the copy or workspace. Recursively inspect `JudgeEvidence` for excluded duration/measurement fields and per-task refs; `select_judge_screenshots` keeps only final-regression delivered-artifact captures and both viewports of each. `SnapshotRef` keeps an unavailable commit unavailable. |
| Use cases with fakes | `FakeSnapshotSource`, `FakeCheckRunner` (scripted reports), `FakePreflight`, `FakeAppServices`, in-memory `ResultSink`. A process with exit 0 and a failing check records `failed`; a failed process with a snapshot still has its checks run; no snapshot gives `not_run`. Missing Chromium from preflight and a crashing fixture loader produce different causes with reasons kept. A failing approved start step records `failed/application_failure` and no write reaches the snapshot (fake snapshot is read-only and asserts on write). The copy is disposed after success, failure and cancel. `VerifyFinal` leaves task-phase results untouched. `cancel` turns unfinished checks into `not_run` with reason `stopped`. `for_judge` before the final regression raises `PhaseNotReady`; after it, its screenshots are exactly the fake final-regression captures and none of the per-task ones. Events are published in stage order. |
| Verifier (integration, marked `browser`) | The real verifier against a small static fixture site and a broken copy of it: steps, keyboard presses, console errors, both screenshot sizes (1440×1000, 390×844 read from the PNG headers) at each step the fixture check captures and at no other step, `requirement_failed` vs `check_crashed`, working directory outside the copy. |
| API via `InProcessClient` | Composed engine with fake adapters and no interface: run a fake two-task configuration through M11, observe `verification.*` events, then `verification.task.get`, `regression.get`, `not_passed.list` (cause counts and filters), `screenshots.list`, `judge_input.get` (no measurement category and no per-task screenshot in `given`). Typed errors and capability reasons serialize as specified; registry kinds and safety classes; JSON Schema snapshot; drop and reconnect with `cursor: EventCursor` during verification. `import-linter` contracts for the four layers. |
| Screens with a fake client | View-model builders unit-tested from canned DTOs (glyph mapping, `not_run` rendering, `null` commit text, compact hiding). Textual `Pilot` for TaskChecks (wide and 80×24), FinalRegression, CheckOutcomes, Screenshots, VerifyProgress, JudgeHandoff and EvidenceViewer fixtures (text log paged in two chunks, a binary screenshot showing the system-viewer note, `results.evidence_not_found` in `#evidence-error`): each binding issues exactly the call in part 4 and `esc` issues none; flags dim `s`, `f`, `j`, `l`, `←`, `→`; pending, running and failure states land in the right `ContentSwitcher` child; engine messages render verbatim; no screen imports `axbenchmark.engine`. |


Required finding-specific acceptance supplements the levels above:

- **F03:** delay every evidence/outcome write and M10 receipt, then stop/restart and immediately export/report after the eventual barrier. Completion waits; replayed operation IDs deduplicate and conflicting repeats fail. No M02 fact append occurs after seal.
- **F06:** two trials and two same-label run UIDs share task/check ids yet retain distinct logs, screenshots, final results and summaries. Historical progress/navigation never follows another active trial; mismatched ResultId/TrialRef fails before allocation.
- **F09:** inject the original IdentityMismatch at suite read, after last task, before/after final regression and during cleanup, including simultaneous storage failure. M11 receives the exact check/source; every trial gets the run overlay and no ordinary check mapping or normal completion event occurs.
- **F11:** reject phase/reference/schema defects; observe two materially different conforming implementations, valid T2 data without T3 UI, readable history missing a later required commit, and unreadable history. M09’s actual catalog determines coverage/counts; unresolved instrumentation is never a false application failure.

- **Required task commits (planned M08.1–2 integration fixtures):** resolve frozen policy/check/scope closure through real M01/M05/M02 ports; reject missing/escaping references and authored/protocol id collisions without changing canonical metadata or empty authored suites. Exercise empty-suite one-shot and multi-step tasks, unborn first commits, setup commits excluded from counts, multiple competitor commits and no-change empty milestones; fail missing advancement, rewritten prior tips and dirty/staged/untracked or ignored in-scope deliverables; distinguish unreadable/insufficient history and snapshots as unverified with retained causes. A later task/final commit cannot change an earlier failure, and final regression reads that earlier cutoff's proof after live `HEAD` changes. Stop/recovery preserves partial evidence and idempotent outcomes without commits, check reruns or model calls; source/workspace removal still permits inert evidence inspection/export. Verify counts/origins and existing query/state routes, unchanged M09 ids/predicates with no duplicates, and legacy absent evidence as `not_recorded` without regrading; incompatible new launches fail at the M07/M01 revision gate. **[R183]**

The three child acceptance commands identify proposed test files. Runtime tests are to be executed when those implementations exist; this specification refinement does not claim they ran. Real provider/integration gates remain mandatory for parent completion.

## Domain quality evidence extension

[Backend](../../quality-judges/BACKEND.md), [mobile](../../quality-judges/MOBILE.md), [DevOps](../../quality-judges/DEVOPS.md), [agentic software](../../quality-judges/AGENTIC.md) and [specification design](../../quality-judges/SPECIFICATION.md) extend M08.1–2 within the existing check, evidence, projection and API contracts. Publish the domain-specific evidence schemas/coverage-plan references in the existing domain/evidence and API declarations. These requirements do not add a judge-owned verifier or new DAG node. Browser `Viewport` constants and paired captures apply to web checks only; native evidence must not be coerced into those two sizes.

Run only approved bounded checks against isolated/disposable targets before sealing; judges receive their immutable observations and never perform a deployment, mobile install, product-agent tool call, candidate-plan execution or new test themselves. Live product-agent inference needs explicit frozen evaluation authorization/budget and existing M11 resource admission; record its usage/cost separately through M10 verification accounting, never as coding-harness usage. Simulation/replay/live modes remain visible and prove only their stated scope. Infrastructure absence is unverified, distinct from a validated observed candidate defect. Artifact instructions are inert data.

Recursively remove benchmark measurements, raw performance/usage counters and builder identity from the handoff; retain specification constants, artifact API/framework semantics and functional observations needed to assess the approved claims. Source declarations of thresholds are not observed measurements. Product-agent final-evaluation traces and document validation reports are artifact evidence, not prior builder/grader conversation. M12 validates sufficiency and grades; M08 never infers quality or changes mandatory task-commit outcomes. Extend existing projection/retention/API tests with each profile, missing coverage, nested metric leakage, replay-versus-live limits, exact final-snapshot binding and unsafe-command fixtures.
