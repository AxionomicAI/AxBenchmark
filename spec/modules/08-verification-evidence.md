# M08 — Acceptance verification and evidence

Status: proposed required contract. This module defines how AxBenchmark establishes observable task outcomes and retains supporting evidence. It does not assert that verification is implemented. [SPEC.md](../SPEC.md) remains authoritative. The [Implementation](#implementation) section places this behavior in the headless engine fixed by [the architecture decision](ARCHITECTURE.md); interfaces present verification outcomes and evidence from the engine and evaluate none of these rules themselves.

## Purpose and boundaries

The frozen executable acceptance checks determine task success. Agent completion statements, process exit codes, and independent judge grades are separate observations and cannot substitute for those checks. Checks assess the approved observable requirements without imposing an unnecessary source layout, internal design, or implementation technique. **[R073, R144]**

Verification participates in execution of the pinned template revision: approved checks run, evidence is preserved, and progress and measurement information remain available through the execution workflow. M11 owns orchestration, M10 owns measurements, and M15 owns their presentation; this module supplies verification progress, outcomes, and evidence to those collaborators. **[R034]**

## Inputs, operations, and outputs

Conceptual inputs are the pinned template's specification and approved executable checks, the task identity and resulting snapshot, the delivered artifact for final regression, and independently recorded process outcomes. Browser or backend setup uses the template's approved execution instructions and available prerequisites. These inputs identify what is being verified; they do not authorize revising acceptance requirements after seeing a competitor's output. **[R034, R073, R074, R076, R144]**

For each task, run the applicable approved checks against a disposable copy of its snapshot. Keep verification tooling outside competitor source. Preserve the task snapshot as evidence while allowing the disposable copy to absorb test activity. Verification must not manually repair generated application code, whether a check fails or setup exposes an application defect. The delivered artifact receives a final regression check, also through a disposable copy, so earlier successful observations cannot stand in for its final behavior. **[R074]**

Outputs comprise independently recorded process and verification outcomes plus task-associated evidence, snapshots, logs, and available commit identities. A missing commit identity remains unavailable rather than being invented. Evidence must remain attributable to the task and snapshot it describes; final regression evidence describes the delivered artifact. These are conceptual information requirements, not a prescribed storage format or check schema; the format chosen for this implementation is recorded under Implementation and is not a product requirement. **[R074, R076]**

Browser verification uses Python Playwright. Exercise meaningful workflows and keyboard behavior, observe browser errors, and capture desktop screenshots at 1440×1000 and mobile screenshots at 390×844. Which steps capture screenshots is defined by the template's checks; each capture produces both viewports. Screenshots support inspection; producing images alone does not establish workflow success. Backend verification exercises the approved interface contract. Fullstack artifacts require the applicable browser and backend behavior to be observable through that contract. **[R073, R075, R149]**

Provide the resulting acceptance evidence to the independent judge separately from measured execution statistics. The handoff includes the relevant check results and browser evidence without conflating behavioral verification with cost, timing, or other execution measurements. The screenshots the judge receives are those captured by the final regression check against the delivered artifact, at both viewports; per-task screenshots stay in evidence, results and the report but are not judge input. A later judge grade must not rewrite a check outcome. **[R075, R083, R144]**

## Outcomes, failures, and invariants

Record each check as passed, failed, or unverified. Passed means the executable check established its required observable behavior; failed means it established a requirement failure; unverified means verification could not establish whether the requirement passed or failed. Missing prerequisites and broken verification infrastructure must be distinguishable from observed application failures and from each other, with their reasons retained. An inability to run a check cannot produce a pass. **[R073, R076, R144]**

Keep process completion, process failure, failed checks, unverified checks, and judge grades distinct throughout retention and presentation. For example, successful process termination can coexist with a failed check, and an interrupted process can coexist with whatever checks were actually established against its snapshot. Neither example permits missing verification to be inferred. Logs and available evidence remain attached to the affected task even when verification cannot complete. **[R076, R144]**

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

This section applies the [headless engine architecture](ARCHITECTURE.md). It records implementation decisions; the requirements above remain the product contract. Paths, file formats, defaults and type names below are implementation choices and may change without changing product behavior.

### 1. Engine component

Package `axbenchmark.engine.verification`. M08 never decides when verification runs: [M11](11-run-orchestration.md) calls it after each task process ends and once more for the delivered artifact, through the application interface below. M08 owns the disposable copies, the verifier processes and the application services started on those copies, the classification of every check, the verification evidence files, and the evidence bundle handed to [M12](12-quality-judging.md). It hands outcomes and evidence to [M02](02-retained-results-comparability.md) for retention and reads them back from M02 for every query, so live, finished and imported results are served by one path.

#### Domain (`engine/verification/domain/`)

Frozen slotted dataclasses and enums; no I/O, no asyncio, no pydantic.

| Type or rule | Content |
|---|---|
| `CheckKind` | Enum `repo`, `browser`, `keyboard`, `backend`. Taken from the frozen check definition; it selects the runner, it does not change classification. |
| `CheckDefinition` | `check_id`, `task_id`, `title`, `kind`, `required: bool`, `entry` (path of the check module inside the revision's `checks/`), `needs: tuple[Prerequisite, ...]`, `timeout`. Parsed from the frozen revision; never edited by M08. **[R073]** |
| `CheckSuite` | Ordered `CheckDefinition`s plus the approved `ExecutionInstructions` (setup, start, stop, readiness probe, base URL or entry file). Rule `checks_for(task_id)` and `all_checks()` (final regression). |
| `Phase` | Enum `at_task`, `final_regression`. Every result, event and evidence file carries it. **[R074]** |
| `CheckStatus` | Enum `passed`, `failed`, `unverified`. The only three outcomes. **[R073, R076]** |
| `NotPassedCause` | Enum `application_failure` (with `failed`), `missing_prerequisite`, `verifier_error`, `not_run` (each with `unverified`). The pairing is enforced in `CheckResult.__post_init__`. **[R076, R144]** |
| `StepRecord` | `index`, `description`, `ok: bool`, `keyboard: bool`, `observed: str \| None`, `captured: bool` (the check captured screenshots after this step). A step is a requirement observation declared by the check. |
| `RunnerReport` | What a verifier process returned: `exit` (code or signal), `report: ParsedReport \| None` (`verdict: passed \| requirement_failed \| check_crashed \| prerequisite_missing`, expected, observed, steps, console errors, screenshot files, traceback). |
| `classify(snapshot, preflight, report) -> CheckResult` | No task snapshot → `unverified/not_run`. Unmet preflight prerequisite → `unverified/missing_prerequisite` with M03's reason code. `prerequisite_missing` reported by the runner → same. `requirement_failed` (a declared step or expectation failed, including an approved setup or start step that the application did not satisfy) → `failed/application_failure`. `passed` with exit 0 and a well-formed report → `passed`. Everything else (exception outside a declared step, killed at the time limit, nonzero exit, missing or malformed report) → `unverified/verifier_error`. Screenshots and console output never influence the status. No branch maps an inability to run to `passed`. **[R073, R076, R144]** |
| `CheckResult` | `check_id`, `task_id`, `phase`, `status`, `cause \| None`, `reason`, `expected`, `observed`, `steps`, `console_errors`, `evidence: tuple[EvidenceRef, ...]`, `duration`, `snapshot: SnapshotRef`, `tooling: ToolingFacts`. |
| `ToolingFacts` | Verifier version, Playwright for Python version, browser name and build, tooling location, `copy_disposed: bool`, `repairs: Literal["none"]`. The type admits no other repairs value. **[R074, R075]** |
| `SnapshotRef` | Snapshot id from M05's end-of-task record, `commit: CommitIdentity \| Unavailable(reason)`. A missing commit stays `Unavailable`; there is no constructor that derives one. **[R076]** |
| `Viewport` | Constants `DESKTOP = Viewport(1440, 1000)`, `MOBILE = Viewport(390, 844)`. A browser check captures at the steps its module requests (`CheckContext.capture()`); every capture produces both viewports. The template's checks, not M08, decide which steps capture. **[R075]** |
| `TaskVerification` | `run_id`, `result_id`, `configuration_id`, `task_id`, `phase`, `state: pending \| running \| complete`, `stage`, `results: tuple[CheckResult, ...]`, `process_outcome_ref` (M05's record, shown, never read for classification), `failure: VerificationFailure \| None`. Rule `summary()` counts by status and cause. |
| `Stage` | Enum `preserve_snapshot`, `create_copy`, `setup`, `run_checks`, `capture_screenshots`, `dispose_copy`, the steps drawn on VerifyProgress. |
| `compare(at_task, final) -> tuple[RegressionRow, ...]` | Per check: both results and `change: same \| fixed \| regressed \| differs` (`differs` covers any other pair, e.g. passed → unverified). Both sides are kept; neither replaces the other. **[R074]** |
| `JudgeEvidence` | `result_id`, artifact `SnapshotRef` (final), revision refs (specification, prompts, rubric), per-task and final `CheckResult`s, `screenshots`: only those of `Phase.final_regression`, each at `DESKTOP` and `MOBILE`, keyed by check and step, keyboard steps, console errors. Per-task screenshots are not admitted (`select_judge_screenshots(results)` filters by phase). The type has no field for cost, tokens, time or hardware samples; `KEPT_APART` lists those categories, plus per-task screenshots, for display. **[R075, R083, R144]** |
| `assert_outside(tool_dir, copy_dir, workspace)` | Raises `ToolingInsideWorkspace` when the tooling directory is inside either tree. Called before every runner start. **[R074]** |

Domain errors: `ToolingInsideWorkspace`, `SnapshotUnavailable`, `SuiteInvalid(path, message)`, `PhaseNotReady`, `UnknownCheck`.

#### Ports (`engine/verification/ports.py`)

```python
class SuiteSource(Protocol):                 # bound to M01's RevisionReader
    async def suite(self, sha: Sha256) -> CheckSuite: ...              # raises IdentityMismatch, SuiteInvalid
class SnapshotSource(Protocol):              # bound to M05's application interface
    async def task_snapshot(self, run: RunId, cfg: ConfigurationId, trial_index: int, task: TaskId) -> SnapshotRef | None: ...
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
    async def acquire(self, run: RunId, cfg: ConfigurationId) -> VerificationLease: ...
    async def release(self, lease: VerificationLease) -> None: ...
class EvidenceFiles(Protocol):               # working files before hand-over to M02
    def task_dir(self, run: RunId, cfg: ConfigurationId, task: TaskId, phase: Phase) -> Path: ...
class ResultSink(Protocol):                  # bound to M02's ResultRecorder
    async def append_check_outcomes(self, rid: ResultId, task: TaskId, checks: Sequence[CheckResult]) -> None: ...
    async def attach_evidence(self, rid: ResultId, ref: EvidenceRef) -> None: ...
class ResultSource(Protocol):                # bound to M02's RetainedResultReader and evidence reader
    async def get(self, rid: ResultId) -> RetainedResult: ...
    async def for_template(self, sha: Sha256, f: ResultFilter | None) -> Sequence[RetainedResult]: ...
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
    async def verify_task(self, rid: ResultId, run: RunId, cfg: ConfigurationId, trial_index: int, task: TaskId, sha: Sha256) -> TaskVerification: ...
    async def verify_final(self, rid: ResultId, run: RunId, cfg: ConfigurationId, trial_index: int, sha: Sha256) -> TaskVerification: ...
    async def cancel(self, run: RunId, cfg: ConfigurationId | None) -> None: ...   # runs.stop; unfinished checks → unverified/not_run
    async def reconcile(self) -> None: ...                                         # engine start: dispose orphan copies, end orphan verifiers
class AcceptanceEvidence(Protocol):          # used by M12
    async def for_judge(self, rid: ResultId) -> JudgeEvidence: ...                 # raises PhaseNotReady before the final regression
class CheckIndex(Protocol):                  # used by M01 (task tab) and M09 (coverage)
    def titles(self, definition: TemplateDefinition) -> Mapping[TaskId, Sequence[CheckTitle]]: ...
class CheckFormat(Protocol):                 # used by M16 (planned and edited checks) and M09 (package tests)
    def parse(self, document: bytes) -> CheckSuite: ...                           # raises SuiteInvalid
    def validate(self, document: bytes) -> Sequence[ErrorInfo]: ...               # acceptance.v1; empty when valid
```

| Use case | Kind | Behavior |
|---|---|---|
| `VerifyTask` | internal | Resolve the task snapshot; none → every check of the task `unverified/not_run`. Otherwise publish stages as they pass: preserve the snapshot reference and commit identity, create the disposable copy, run preflight, acquire a lease, start approved services on the copy, run each check of the task in definition order, capture both viewports, stop services, dispose the copy, release the lease. Classify every check, write the evidence, hand results and evidence refs to M02, publish events. A failure in any stage turns only the checks it prevented into `unverified` with the stage named in `reason`; checks already classified keep their result. Generated code is never modified; the copy absorbs test activity and is deleted. **[R034, R073, R074, R075, R076]** |
| `VerifyFinal` | internal | Same pipeline with `Phase.final_regression`, the last task's snapshot as the delivered artifact and `all_checks()`. Task-phase results are not read or changed. **[R074]** |
| `CancelVerification` | internal | Ends verifier and service process groups for the scope, records unfinished checks as `unverified/not_run` with reason `stopped`, disposes copies. Called only from M11's stop. |
| `ReconcileVerification` | internal | At engine start, removes leftover copies under `tmp/verify/` and ends recorded verifier groups; checks of an interrupted verification are recorded `unverified/verifier_error` with reason `engine stopped`, never re-run silently. |
| `PrepareJudgeEvidence` | internal + query | Builds `JudgeEvidence` from the retained result with the final-regression screenshots only. Backs `AcceptanceEvidence.for_judge` and `verification.judge_input.get`. **[R075, R083]** |
| `GetTaskChecks`, `GetRegression`, `ListNotPassed`, `ListScreenshots`, `GetProgress` | query | Back the queries in part 2; read through `ResultSource` (plus in-memory stage state for a running verification) and compute capability flags. |
| `OpenEvidence`, `RevealEvidence` | command | Resolve the evidence path through M02 (confined to the result directory) and hand it to `SystemOpener`. No state changes. |

#### Adapters (`engine/verification/adapters/`)

| Adapter | Implements |
|---|---|
| `suite_v1.py` | `SuiteSource` over M01's `RevisionReader`: parses the revision's `checks/acceptance.v1.json` (check id, task id, title, kind, required, entry, needs, timeout) and the approved execution instructions; also implements `CheckIndex`. The planner of [M16](16-custom-template-planning.md) emits the same format. |
| `runner_process.py` | `CheckRunner`: starts `python -m axbenchmark.engine.verification.adapters.verifier` in its own process group with its working directory in the tooling directory, never in the copy, and arguments naming the check module (read from the read-only revision tree), the target and the output directory. It enforces the check's time limit and reads `report.json`. |
| `verifier/` | The verifier program. Provides check modules with a `CheckContext` (`step()`, `expect()`, `press()`, `capture()`, `page`, `http`, `repo`) on Python Playwright with a fresh context per check; records console and page errors, keyboard steps, and on each `capture()` screenshots at `DESKTOP` then `MOBILE` named by step; writes `report.json`. An exception inside `step()` or `expect()` is `requirement_failed`; any other exception is `check_crashed`; a missing browser executable is `prerequisite_missing`. **[R075]** |
| `fs_copies.py` | `DisposableCopies`, `EvidenceFiles`, and `SnapshotSource.materialize` target directories; copies are removed with a verified `rmtree`. |
| `services_process.py` | `AppServices`: runs approved setup/start/stop commands with the copy as working directory, inside the lease's port range, and waits for the approved readiness probe. |
| `opener.py` | `SystemOpener`. |
| `rpc.py` | Maps `verification.*` methods to use cases, domain results to DTOs and domain errors to `verification.*` codes; registers the snapshot provider for the `verification` topic with M11's subscription service. |

#### Persisted state

M08 writes working files only under the configuration directory M11 hands it and hands every file to M02, which retains it under `results/<result_id>/evidence/`.

| Path | Content |
|---|---|
| `~/.axbenchmark/runs/<run_id>/<configuration_slug>/trial-<n>/verify/<task_id>/` | Per check: `<check_id>.json` (the `CheckResult`), `<check_id>.log`, `<check_id>-s<step>-desktop.png`, `<check_id>-s<step>-mobile.png` per capture; `stages.jsonl`; `services.log`. |
| `…/verify/final/` | The same files for the final regression. |
| `~/.axbenchmark/tmp/verify/<copy_id>/` | Disposable copies and the tooling directory. Deleted after each verification and swept on engine start. |

The task snapshot itself is M05's record; M08 only references it. No file in these directories is credential-bearing.

#### Owned processes

Verifier processes, the application services started from approved instructions on a copy, and the browsers Playwright launches are children of `axbenchmarkd` in per-verification process groups, never children of a client. They end when the verification finishes, on `TaskVerifier.cancel` (from `runs.stop`) and on engine-start reconciliation. Detaching a client never reaches them.

### 2. API surface (`verification.*`)

Verification itself has no client-callable command or job: it starts only from M11's run pipeline, so no interface can re-run, skip or override a check. The client surface is read-only over retained outcomes, plus two commands that open evidence on the local machine.

#### Queries (safety `read`)

| Method | Request | Response | Errors | Capability flags |
|---|---|---|---|---|
| `verification.task.get` | `result_id`, `task_id` | `TaskChecksDTO`: `result_bar` (origin, machine, harness, model, process outcome, check counts, snapshot commit or `null` with reason), `task_order: list[TaskRefDTO]`, `state: pending \| running \| complete`, `checks: list[CheckRowDTO(check_id, title, kind, required, status, cause, reason)]`, `details: dict[check_id, CheckDetailDTO(status, cause, reason, expected, observed, steps, console_errors, screenshots, log_evidence_id, duration)]`, `facts: VerificationFactsDTO` (snapshot, checked-on, tooling, browser, repairs, process outcome label, grades label), `final_summary: list[RegressionRowDTO] \| None`, `failure: ErrorDTO \| None` | `verification.unknown_result`, `verification.unknown_task`, `verification.record_unreadable` | `can_previous_task`, `can_next_task`, `can_screenshots`, `can_final_regression`, `can_judge_input`, `can_open_log`, each with a reason code when false |
| `verification.regression.get` | `result_id` | `RegressionDTO`: `artifact` (task id, commit), `rows: list[RegressionRowDTO(check_id, title, kind, task_id, at_task, final, change)]`, `summary` (counts per phase, changed check ids) | `verification.unknown_result`, `verification.regression_pending` | `can_open_check` per row |
| `verification.not_passed.list` | `template_sha256`, `result_ids?`, `run_id?`, `causes?: list[NotPassedCause]`, `text?` | `NotPassedPage`: `causes: list[CauseDTO(code, label, description, count)]`, `rows: list[NotPassedRowDTO(result_id, result_label, live, check_ids, status, cause, reason, task_id, evidence_ids, effect)]` (consecutive checks of one task with one cause are one row) | `verification.unknown_template`, `verification.invalid_filter` (with `field`) | `can_open` per row |
| `verification.screenshots.list` | `result_id`, `task_id`, `check_id?`, `phase?` | `list[ScreenshotDTO(check_id, after_step, viewport{name, width, height}, evidence_id, file_name, size)]` | `verification.unknown_result`, `verification.unknown_task` | `can_open`, `can_reveal` |
| `verification.judge_input.get` | `result_id` | `JudgeInputDTO`: `judge_label`, `given: list[HandoffItemDTO(label, count?, evidence_ids)]` (screenshots appear as one item "screenshots from the final regression" with their count, both viewports), `kept_apart: list[HandoffItemDTO]` (includes per-task screenshots) | `verification.unknown_result`, `verification.regression_pending` | `can_reveal` |
| `verification.progress.get` | `run_id`, `configuration_id` | `VerifyProgressDTO`: `task_id`, `phase`, `subject` (harness, model, effort), `stages: list[StageDTO(stage, label, status: done \| now \| todo)]`, `checks_done`, `checks_total`, `current_check`, `so_far: list[CheckRowDTO]`, `seq` | `verification.unknown_configuration` | `is_verifying` |

`CheckDetailDTO.observed`, step text and console output are data from the competitor's application; interfaces render them as inert text.

#### Commands

| Method | Request | Response | Errors | Safety |
|---|---|---|---|---|
| `verification.evidence.open` | `result_id`, `evidence_id` | `OpenOutcomeDTO(path, opened: bool, message?)` | `verification.evidence_not_found`, `verification.open_failed` | `read` (changes no state) |
| `verification.evidence.reveal` | `result_id`, `evidence_id \| task_id` | `OpenOutcomeDTO` | `verification.evidence_not_found`, `verification.open_failed` | `read` |

#### Events (topic `verification`)

Every payload carries `run_id`, `result_id`, `configuration_id`, `task_id` and `phase`.

| Event | Payload | Consumers |
|---|---|---|
| `verification.task.started` | check count, snapshot commit or `null` | VerifyProgressScreen, RunScreen lanes (M11/M15), CLI progress |
| `verification.stage.changed` | `stage`, `status`, label | VerifyProgressScreen `#verify-steps` |
| `verification.check.completed` | `CheckRowDTO`, duration | VerifyProgressScreen `#verify-so-far`, TaskChecksScreen, ChecksScreen live rows |
| `verification.task.completed` | counts by status and cause, `started_at`, `finished_at` | M10 (verification phase duration, kept out of benchmark elapsed), M11, RunScreen, CLI progress line ("checks 2✓") |
| `verification.regression.completed` | counts per phase, changed check ids | FinalRegressionScreen, M12 (judging may start), M11 |

#### Error codes

| Code | Raised when |
|---|---|
| `verification.unknown_result`, `verification.unknown_task`, `verification.unknown_configuration`, `verification.unknown_template` | Query target does not exist. |
| `verification.record_unreadable` | M02 cannot read the result's verification evidence. |
| `verification.regression_pending` | The final regression has not completed (or the configuration ended before a delivered artifact existed). |
| `verification.invalid_filter` | Unknown cause or malformed filter; `field` names it. |
| `verification.evidence_not_found` | The evidence id is not part of that result. |
| `verification.open_failed` | The system viewer could not be started; message verbatim from the OS. |

Verification failures are data, not RPC errors: they appear as `unverified` checks with `cause` and `reason`, and as `TaskChecksDTO.failure` when a whole task could not be verified (for example `verification.snapshot_missing`, `verification.tooling_inside_workspace`, `verification.suite_invalid`).

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `RevisionReader.open(sha)` (in-engine) | M01 | Frozen check definitions, execution instructions, specification, prompts and rubric refs; raises on identity mismatch. **[R067, R073]** |
| `HarnessExecution.task_snapshot(run, cfg, trial_index, task)` / `.materialize(ref, into)` (in-engine) | M05 | Source of each disposable copy; commit identity from the snapshot. **[R074]** |
| `HarnessResources.lease_verification(run, cfg)` / `.release_verification(lease)` (in-engine): port range and empty browser profile disjoint from the competitor's | M05 | Running services and browsers on the copy without colliding with the configuration's live resources. **[R072, R074]** |
| `AssessOperation` (in-engine) / `environment.assess` | M03 | Preflight of Python Playwright, Chromium, Node.js and template-declared runtimes; its reason codes become `missing_prerequisite` reasons. **[R076]** |
| `ResultRecorder.append_check_outcomes`, `ResultRecorder.attach_evidence` | M02 | Retention of outcomes and evidence. **[R076]** |
| `RetainedResultReader.get`, `.for_template`, `.evidence`, `.read_evidence` (in-engine counterparts of `results.evidence` / `results.read_evidence`) | M02 | Every `verification.*` query, imported results included; evidence confined to the result directory. |
| `ScoringRules.eligibility_notes` | M06 | The `effect` text on not-passed rows; M08 states no eligibility rule itself. **[R100]** |
| Calls to `TaskVerifier.verify_task` after each `harness.task.exited` with a snapshot, `verify_final` after the last task, `cancel` from `runs.stop`, `reconcile` at engine start; configuration directory allocation | M11 | Placing verification in the run pipeline. **[R034]** |
| `events.subscribe` with per-namespace snapshot providers, `runs.status` | M11 | Live screens; VerifyProgress subject line. |
| Caller of `AcceptanceEvidence.for_judge` after `verification.regression.completed` | M12 | Judge handoff without measurements. **[R075]** |
| Caller of `CheckIndex.titles` | M01, M09 | Task tab and coverage screens. |
| Caller of `CheckFormat.parse` / `.validate` | M16, M09 | Planned checks and the built-in suite use the one `acceptance.v1` reader. |
| Check generation in `acceptance.v1` format | M16 | Planned templates verifiable by the same runner. |
| App shell, `.-compact` class, push of TaskChecksScreen from ResultScreen `enter` on `#task-outcomes`, and of `EvidenceViewerScreen` from ResultScreen `l`, `#open-log`, "Open snapshot" and "Open evidence" | M02 / M15 | Navigation into M08 screens. |
| `p` on RunConfigScreen pushing `VerifyProgressScreen(run_id, configuration_id)` (in its key list, beside `v` for the live view) | M05 | Entry point of VerifyProgress. |
| `results.evidence(result_id, task_id?)`, `results.read_evidence(result_id, evidence_id, offset, limit)` | M02 | EvidenceViewerScreen file list and paged content. |

### 4. Screens

All screens are pure views. View models are frozen dataclasses built by pure functions in `tui/viewmodels/verification.py`; they map `status`/`cause` to glyphs and wording (`passed` → “✓ passed”, `failed` → “✗ failed” bold, `unverified` → “? unverified” italic, `unverified` with `not_run` → “○ not run” dim) and never classify, count, compare phases or decide eligibility; counts, `change` and `effect` arrive from the engine. `check_action` returns `None` (dimmed, never hidden) when a capability flag is false. Every data widget sits in a `ContentSwitcher` with `#x`, `#x-loading`, `#x-empty`, `#x-error`; an error shows the engine's message and remedy verbatim with a Retry that repeats the load. All screens subscribe on mount and unsubscribe on unmount; leaving a screen sends no command.

#### TaskChecksScreen — artboard TaskChecks (wide and compact)

| Item | Specification |
|---|---|
| Class and file | `TaskChecksScreen(Screen)` in `axbenchmark/tui/screens/verification.py`, constructed with `result_id`, `task_id`, optional `check_id` to focus. Tree, ids and TCSS as in the M08 board: `Header`, `Static #result-bar`, `Horizontal #main` with `Vertical #left` (`DataTable #task-checks .bordered`, `Static #verification-facts .kv`, `DataTable #final-summary .bordered`) and `VerticalScroll #check-detail .pane` (`Static #check-outcome`, `ListView #check-steps`, `Static #check-evidence .kv`), `Horizontal .actions` (`#screenshots`, `#final-regression`, `#judge-input` buttons), `Footer`. `Screen.-compact` hides `#verification-facts` and `#final-summary`. |
| View model | `TaskChecksVM(title, result_bar, rows: tuple[CheckRowVM, ...], cursor_check_id, details: Mapping[str, CheckDetailVM], facts: tuple[KV, ...], final_rows: tuple[RegressionRowVM, ...] \| None, state, failure: NoticeVM \| None, actions: Mapping[str, ActionState])` from `build_task_checks_vm(dto: TaskChecksDTO, focus: str \| None)`. |
| Load | Worker on mount and on task change: `verification.task.get(result_id, task_id)`. |
| Subscriptions | `events.subscribe(["verification"])` filtered to `result_id`: `verification.check.completed` and `verification.task.completed` for this task, `verification.regression.completed`; each re-issues `verification.task.get` (debounced 250 ms). |
| States | `ContentSwitcher #task-checks-switcher`: `#task-checks`; `#task-checks-loading` (load in flight, or `state == running`: “Verifying T6 on a disposable copy…”); `#task-checks-empty` (`state == pending`: “T6 has not been verified yet”, “Checks run after the task process ends.”); `#task-checks-error` (typed RPC error, or `failure` notice such as “Verification could not start” with the engine's reason; the rows below still show each check as unverified). |

| Binding | Action | API call |
|---|---|---|
| `esc` | `app.pop_screen` | none |
| row highlight in `#task-checks` | show that check in `#check-detail` | none (details are in the loaded DTO) |
| `←` / `→` | previous / next task in `task_order`; enabled by `can_previous_task` / `can_next_task` | `verification.task.get(result_id, task_id=…)` |
| `s`, `#screenshots` | push `ScreenshotsScreen(result_id, task_id, check_id)`; enabled by `can_screenshots` | `verification.screenshots.list` (in that screen) |
| `f`, `#final-regression`, click on `#final-summary` | push `FinalRegressionScreen(result_id)`; enabled by `can_final_regression` | `verification.regression.get` (in that screen) |
| `j`, `#judge-input` | push `JudgeInputScreen(result_id)`; enabled by `can_judge_input` | `verification.judge_input.get` (in that screen) |
| `l` | push `EvidenceViewerScreen(result_id, log_evidence_id)` for the highlighted check; enabled by `can_open_log` | `results.read_evidence` (in that screen) |
| `tab` | `focus_next` | none |

#### FinalRegressionScreen — artboard FinalRegression

`FinalRegressionScreen(Screen)` in `tui/screens/verification.py`; tree `Header`, `Static #result-bar`, `DataTable #regression .bordered` (`height: 24; cursor_type = "row"`; `.change-regressed` bold), `Static #regression-summary .kv`, `Static .notice`, `Button #open-check`, `Footer`. View model `RegressionVM(result_bar, rows: tuple[RegressionRowVM, ...], summary: tuple[KV, ...], actions)` from `build_regression_vm(RegressionDTO)`; `change` renders as “=” (`same`), “✗ → ✓ fixed in T7” (`fixed`), “✓ → ✗ regressed” (`regressed`) from the engine's value. Load `verification.regression.get(result_id)`; subscribe to `verification.regression.completed` for the result. States `#regression`, `#regression-loading`, `#regression-empty` (`verification.regression_pending`: “The delivered artifact has not been checked yet”), `#regression-error`.

| Binding | API call |
|---|---|
| `esc` | none (`app.pop_screen`) |
| `enter`, `#open-check` | push `TaskChecksScreen(result_id, row.task_id, row.check_id)`, which loads `verification.task.get`; enabled by the row's `can_open_check` |
| `n` | push `ChecksScreen(template_sha256, result_ids=[result_id])`, which loads `verification.not_passed.list` |
| `tab` | none |

#### ChecksScreen — artboard CheckOutcomes

`ChecksScreen(Screen)` in `tui/screens/verification.py`, constructed with `template_sha256` and optional `result_ids` / `run_id`; tree `Header`, `Static #result-bar`, `Horizontal #cause-legend` (4 × `Static .cause`), `DataTable #not-passed .bordered`, `Static #outcome-detail .pane`, `Footer`. View model `NotPassedVM(bar, causes: tuple[CauseVM, ...], rows: tuple[NotPassedRowVM, ...], detail: OutcomeDetailVM \| None, filter: FilterVM)` from `build_not_passed_vm(NotPassedPage, cursor)`. The cause legend renders `causes` in the order returned; the “Different from” line is built from the other causes' descriptions in the same response; `effect` is M06's text verbatim. Load `verification.not_passed.list(template_sha256, result_ids?, run_id?, causes?, text?)`; subscribe to `verification.check.completed` and `results.result.sealed` for the template, re-issuing the list (debounced). States `#not-passed`, `#not-passed-loading`, `#not-passed-empty` (“Every check passed for these results”), `#not-passed-error`.

| Binding | API call |
|---|---|
| `esc` | none (`app.pop_screen`) |
| row highlight | none (detail is in the row) |
| `o`, `enter` | push `TaskChecksScreen(row.result_id, row.task_id, row.check_ids[0])`; enabled by `can_open` |
| `/` | focus a filter `Input`; on submit `verification.not_passed.list(…, text=…)` |
| `c` | cycle the cause filter (all → each `CauseDTO.code`); `verification.not_passed.list(…, causes=[code])` |
| `tab` | none |

#### ScreenshotsScreen — artboard Screenshots

`ScreenshotsScreen(Screen)` in `tui/screens/verification.py`; tree `Header`, `Static #result-bar`, `DataTable #shots .bordered`, `Horizontal #shot-frames` with `Static .shot.-desktop` (`width: 63; height: 24`) and `Static .shot.-mobile` (`width: 21; height: 24`), `Footer`. The frames are placeholders drawn to the proportions in `ScreenshotDTO.viewport`; terminals are not assumed to render images. View model `ScreenshotsVM(bar, rows: tuple[ScreenshotRowVM, ...], frames: tuple[FrameVM, FrameVM], actions)` from `build_screenshots_vm(list[ScreenshotDTO], cursor)`. Load `verification.screenshots.list(result_id, task_id, check_id?)`; no subscriptions. States `#shots`, `#shots-loading`, `#shots-empty` (“No browser checks in this task”), `#shots-error`.

| Binding | API call |
|---|---|
| `esc` | none |
| `o` | `verification.evidence.open(result_id, row.evidence_id)`; `opened: false` shows the message verbatim |
| `f` | `verification.evidence.reveal(result_id, row.evidence_id)` |
| `tab` | none |

#### VerifyProgressScreen — artboard VerifyProgress

`VerifyProgressScreen(ModalScreen[None])` in `tui/screens/run_config.py`, pushed by `p` on M05's RunConfigScreen, constructed with `run_id`, `configuration_id`; tree `Vertical #verify-progress .dialog` (`Vertical #verify-steps` with `ProgressBar` `show_eta = False`, `Static #verify-so-far`, `Horizontal .dialog-actions` with Hide), `Footer`; dialog width 84. View model `VerifyProgressVM(title, steps: tuple[StepVM, ...], progress: tuple[int, int], so_far: tuple[CheckRowVM, ...], note)` from `build_verify_progress_vm(VerifyProgressDTO)`; events are folded in by a pure `apply_event(vm, event) -> VerifyProgressVM`. Load `verification.progress.get(run_id, configuration_id)`; subscribe to `verification.stage.changed`, `verification.check.completed`, `verification.task.completed` for the configuration, resuming with `since_seq` from the DTO. States `#verify-progress`, `#verify-progress-loading`, `#verify-progress-empty` (`is_verifying` false: “No verification is running for this configuration”), `#verify-progress-error`.

| Binding | API call |
|---|---|
| `esc`, Hide | none; `dismiss(None)`; verification continues |

#### JudgeInputScreen — artboard JudgeHandoff

`JudgeInputScreen(ModalScreen[None])` in `tui/screens/verification.py`, over TaskChecksScreen; tree `Vertical #judge-input .dialog` (`Static #given`, `Static #kept-apart`, `Horizontal .dialog-actions` with Open folder and Close), `Footer`; dialog width 86. View model `JudgeInputVM(title, judge_label, given: tuple[str, ...], kept_apart: tuple[str, ...], actions)` from `build_judge_input_vm(JudgeInputDTO)`; the ✓ and ✗ lists are the two DTO lists, not a selection made by the screen. Load `verification.judge_input.get(result_id)`; no subscriptions. States `#judge-input`, `#judge-input-loading`, `#judge-input-empty` (`verification.regression_pending`), `#judge-input-error`.

| Binding | API call |
|---|---|
| `esc`, Close | none; `dismiss(None)` |
| Open folder | `verification.evidence.reveal(result_id, task_id=artifact task)`; enabled by `can_reveal` |

#### EvidenceViewerScreen — artboard EvidenceViewer

| Item | Specification |
|---|---|
| Class and file | `EvidenceViewerScreen(Screen)` in `axbenchmark/tui/screens/verification.py`, constructed with `result_id`, optional `evidence_id` to select, optional `task_id` to scope the list. Pushed by M02's ResultScreen (`l` and `#open-log` with the check log's id, "Open snapshot" with the task snapshot's id, "Open evidence" with no id) and by TaskChecksScreen `l` (the highlighted check's `log_evidence_id`). Tree: `Header`, `Static #evidence-bar`, `Horizontal #evidence-main` with `DataTable #evidence-files .bordered` (Kind, Task, Name, Size) and `Vertical #evidence-view .pane` (`Static #evidence-meta .kv`, `TextArea #evidence-text`, `read_only=True`, `soft_wrap=False`), `Horizontal .actions` (`Button #open-external` "Open in system viewer", `Button #reveal` "Show in folder"), `Footer`. `Screen.-compact` hides `#evidence-files` and shows the selected item only; `e` toggles the list. |
| View model | `tui/viewmodels/evidence.py`: `EvidenceViewerVM(bar, files: tuple[EvidenceFileVM, ...], selected: str \| None, meta: tuple[KV, ...], text: str \| None, text_complete: bool, binary_note: str \| None, actions: Mapping[str, ActionState])` from `build_evidence_vm(items: list[EvidenceItemDTO], chunks: Sequence[EvidenceChunkDTO], selected)`. Text is concatenated chunk data rendered inert; a non-text media type (screenshot, snapshot archive) sets `binary_note` ("Binary evidence · open it in the system viewer") and no text. `open_external` and `reveal` are always enabled for an item; the open outcome decides. |
| Load | Worker on mount: `results.evidence(result_id, task_id?)` for `#evidence-files`, then for the selected item `results.read_evidence(result_id, evidence_id, offset=0, limit=256 KiB)`. Scrolling to the end of `#evidence-text` while the last chunk has `eof == false` loads the next chunk with `offset` advanced; nothing is loaded past what the user scrolls to. |
| Subscriptions | None: evidence of a retained result does not change. |
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
| Measurements (M10) | Check counts per task via M02; verification phase duration from `verification.task.completed`. |
| Template task tab (M01), coverage (M09) | Check titles through `CheckIndex`. |
| Judging screens (M12) | `JudgeEvidence` (final-regression screenshots at both viewports, no per-task screenshots) through `AcceptanceEvidence`; the review stores evidence references, never check outcomes. |
| HTML report (M13) | Task evidence and screenshots via M02. |

### 5. CLI

M14 owns the commands; these reach M08.

| Command | Methods |
|---|---|
| `axbenchmark run --config … --no-tui`, `axbenchmark --attach RUN_ID` | `runs.launch` / `events.subscribe` (M11); progress lines combine `harness.task.exited` with `verification.task.completed` (“T1 ✓ exit 0 · checks 2✓”). |
| `axbenchmark status RUN_ID` | `runs.status` (M11) with check summaries from M02; failed and unverified counts are printed separately. |
| Proposed for M14: `axbenchmark checks show RESULT_ID [--task ID]`, `axbenchmark checks regression RESULT_ID`, `axbenchmark checks not-passed --template SHA [--result ID] [--cause CAUSE]`, `axbenchmark checks screenshots RESULT_ID --task ID [--open]`, `axbenchmark checks judge-input RESULT_ID` | `verification.task.get`, `verification.regression.get`, `verification.not_passed.list`, `verification.screenshots.list` (+ `verification.evidence.open`), `verification.judge_input.get`. `--json` prints the response models; a typed error exits 1. |

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain (`tests/engine/verification/domain/`) | `classify` table: no snapshot → `unverified/not_run`; unmet preflight → `missing_prerequisite`; `requirement_failed` → `failed/application_failure`; `check_crashed`, timeout kill, nonzero exit with a passing report, missing and malformed report → `unverified/verifier_error`; only an explicit pass with exit 0 is `passed`. Property test (hypothesis): no input without an explicit passing report yields `passed`; screenshots and console data never change the status. `CheckResult` rejects invalid status/cause pairs. `compare` yields `same`, `fixed`, `regressed`, `differs` and keeps both sides (the board's 18✓ 3✗ / 18✓ 3✗ fixture with T4.2 and T5.4 swapped). `assert_outside` rejects tooling inside the copy or workspace. `JudgeEvidence` has no measurement field (asserted on `dataclasses.fields`); `select_judge_screenshots` keeps only final-regression captures and both viewports of each. `SnapshotRef` keeps an unavailable commit unavailable. |
| Use cases with fakes | `FakeSnapshotSource`, `FakeCheckRunner` (scripted reports), `FakePreflight`, `FakeAppServices`, in-memory `ResultSink`. A process with exit 0 and a failing check records `failed`; a failed process with a snapshot still has its checks run; no snapshot gives `not_run`. Missing Chromium from preflight and a crashing fixture loader produce different causes with reasons kept. A failing approved start step records `failed/application_failure` and no write reaches the snapshot (fake snapshot is read-only and asserts on write). The copy is disposed after success, failure and cancel. `VerifyFinal` leaves task-phase results untouched. `cancel` turns unfinished checks into `not_run` with reason `stopped`. `for_judge` before the final regression raises `PhaseNotReady`; after it, its screenshots are exactly the fake final-regression captures and none of the per-task ones. Events are published in stage order. |
| Verifier (integration, marked `browser`) | The real verifier against a small static fixture site and a broken copy of it: steps, keyboard presses, console errors, both screenshot sizes (1440×1000, 390×844 read from the PNG headers) at each step the fixture check captures and at no other step, `requirement_failed` vs `check_crashed`, working directory outside the copy. |
| API via `InProcessClient` | Composed engine with fake adapters and no interface: run a fake two-task configuration through M11, observe `verification.*` events, then `verification.task.get`, `regression.get`, `not_passed.list` (cause counts and filters), `screenshots.list`, `judge_input.get` (no measurement category and no per-task screenshot in `given`). Typed errors and capability reasons serialize as specified; registry kinds and safety classes; JSON Schema snapshot; drop and reconnect with `since_seq` during verification. `import-linter` contracts for the four layers. |
| Screens with a fake client | View-model builders unit-tested from canned DTOs (glyph mapping, `not_run` rendering, `null` commit text, compact hiding). Textual `Pilot` for TaskChecks (wide and 80×24), FinalRegression, CheckOutcomes, Screenshots, VerifyProgress, JudgeHandoff and EvidenceViewer fixtures (text log paged in two chunks, a binary screenshot showing the system-viewer note, `results.evidence_not_found` in `#evidence-error`): each binding issues exactly the call in part 4 and `esc` issues none; flags dim `s`, `f`, `j`, `l`, `←`, `→`; pending, running and failure states land in the right `ContentSwitcher` child; engine messages render verbatim; no screen imports `axbenchmark.engine`. |
