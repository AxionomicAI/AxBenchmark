# M11.3 — run-scheduler

Parent: [M11 scheduling and launch](../reference/modules/11-run-orchestration.md#1-engine-component). Requirements: R034, R045, R060, R066–R069, R077, R138, R150, R154, R158. Findings: F02, F03, F05, F06, F09, F15.

Outcome: bind a complete immutable launch and execute per-harness queues, sequential tasks and distinct fresh trials with awaited verification/accounting.

## Entry conditions

**Completed prerequisites:** Bootstrap, [M11.2](02-events-jobs-lifecycle.md), M01.1–2 identity/storage, M02.1–2 retention, M05.1–2 process/adapter services, M07.1–2 resolution/freeze, M08.1–2 verification and M10.1–2 accounting. Screens are not required.

**Injected published contracts:** M12 RunJudging (`judge_run -> BatchId`, `wait/stop -> OriginalJudgingSettlement`, `recover -> OriginalJudgingSettlement | HumanRecoveryPending`, `batch_for_run -> BatchId | None`), M18 ExperimentTelemetry/close receipt and M11.4 invalidation/terminal coordinator. The child can prove scheduling and the terminal handoff with fakes; real M12.2/M18.2 lifecycle behavior is the M11.4 acceptance gate. M07's SchedulingVocabulary port is already published at Bootstrap, avoiding a setup/scheduler cycle.

## Exact proposed ownership

- `axbenchmark/engine/runs/domain/scheduling.py`, `execution.py`, `launch.py`, `state.py`.
- `axbenchmark/engine/runs/ports.py`, `application/interfaces.py`: RunRepository, RunContext, RunTimeline, ActiveRuns and SchedulingVocabulary implementations.
- `axbenchmark/engine/runs/application/launch.py`, `bind.py`, `supervise.py`, `execute_configuration.py`, `timeline.py`, `queries.py`.
- `axbenchmark/engine/runs/adapters/fs_runs.py`, `rpc.py`; `axbenchmark/api/runs.py` launch/query/status models and registrations.
- Add M11 run-provider registrations to daemon composition; no feature adapter imported by the foundation seam.
- `tests/engine/runs/test_scheduling.py`, `test_launch_binding.py`, `test_configuration_loop.py`, `test_timeline.py`.
- `tests/api/test_runs_launch_status.py`, `tests/integration/test_run_scheduler.py`.
- `tests/fixtures/runs/frozen_launch.py`, `scripted_execution.py`, `trials.py` with full bindings and exact scopes.

M11.4 owns stop/recovery/finalization implementations. This child awaits their published coordinator interfaces; it does not add a competing terminal path. M05 owns process spawning, M08 checks and M10 all arithmetic.

## Launch identity and durable binding

Reserve UUID4 RunUid and separately allocated RunLabel under the repository lock. UID is every internal/API/directory key; label/origin are display/resolution metadata. M02 resolves ambiguous CLI labels with candidate UIDs, never a guessed selection.

Resolve source, overrides and preview digest once through M07. Await JobContext.retain_initial_progress with the first LaunchStep containing final configuration/trial/task/task-run/logical-assessment/harness-session/decision-call-bound/human-case totals and optional warning before any progress publication. JobStatus.initial_progress is write-once and separate from latest progress, remaining in jobs.get/job snapshots after finish/cache expiry/restart. Unattended launch prints it once by launch job ID and continues without prompting.

Check identity; freeze configuration and original weights separately using that same resolved value, verified identity, UID/label and launch time. Journal commit intent; `commit(run_uid)` returns FrozenLaunch with the complete M02 RunBinding and frozen TrialRef roster.

Cancellation and commit-intent claim serialize. A cancellation that wins discards only uncommitted staging; once commit is claimed the job is noncancellable. A lost response checks LaunchRecords; never discard a committed launch or allocate another UID for the retry.

For every TrialRef call `ResultRecorder.open_result(trial)` idempotently, then scoped `append_scheduling(rid, record, operation_id)`. Journal returned ResultIds and binding progress, verify roster completeness, persist initial state, then open telemetry/admit supervision/public launch success.

No task starts or active-run publication occurs while any expected result is missing. Post-commit write failure is binding_pending with its UID/checkpoint; roll forward the same immutable binding. Crash recovery is M11.4 and must create missing records without restarting execution.

## Scheduling and task loop

An omitted jobs choice resolves to the shared registry count (currently six); active configurations are bounded by that frozen jobs limit and selected distinct harnesses, at most one per harness. Preserve explicit jobs=4/5 as those limits. Entry order breaks eligibility ties. Jobs 1 serializes all configurations. A configuration holds its slot across all requested trials; trials and tasks run sequentially.

Default one trial and three-hour task timeout; positive trial counts have no invented upper limit. Never add/repeat a trial because another failed. No scheduler rule retries a task.

Per trial establish `EnvironmentSpec.trial(TrialRef, ResultId)` from the semantic baseline with fresh workspace/resources. For each task allocate InvocationId and `TaskScope(trial, result_id, task_id, task_index, task_title)`; frozen settings and start-derived deadline go to M05 invoke.

Await process output/usage drainage and returned outcome/evidence. Append to M02 with M05's stable operation IDs; wait for `TaskVerifier.verify_task(rid, trial, task, sha)` and its durable M02/M10 acknowledgements before advancing.

Ordinary nonzero exit/timeout continues from the resulting workspace. Authentication/configuration/model/launch failures halt only that configuration and mark later tasks/trials not_run. A harness-internal retry is retained observation, never a new orchestrator attempt.

Check identity before each task, after the last task and around final regression through M08; check again before finalization/judging. Any propagated M01 `IdentityMismatch` from M01/M05/M08 routes to the shared run coordinator, not continuation or unverified classification.

Await final verification and environment release before another trial. Status/queries use `MeasurementSummary.for_trial(TrialRef)`; task logs/diffs/configuration description use explicit TrialRef or resolved ResultId. Only live selection may resolve active trial, returned explicitly.

Persist each phase/timeline transition with stable operation ID, await M10 required handler, then publish the revisioned observational event. Recovery redelivers unacknowledged handlers; no required work depends on UI queue delivery. Judging intervals are separate lifecycle data.

When producers settle, await M11.4 terminal coordinator; do not directly seal or publish ended. RunContext configuration/scheduling and execution windows all carry TrialRef; labels never key measurements/evidence.

**Frozen domain contract.** Extend DecisionResourceLease dispatch to its artifact_verification scope for approved M08 agent cases, using the existing atomic fair bounded cross-run queue. M08 acquires around product warmup/evaluation and settles after durable evidence/accounting; M12.4 alone acquires decision-call leases. Local/unknown product inference waits outside every managed competitor measured window unless the frozen launch explicitly allows overlap. Recheck frozen case/authority/budget/stop at grant, preserve full trial identity and never hold the run lock while waiting.

## Boards and supplied states

Supply LaunchCheck final totals/warning and binding-pending errors; RunOverview, RunQueued, RunSequential, RunFailures and trial progress DTOs. Explicit lane actions/selected trial, queues, requested/observed settings and partial/unknown measurements come from owners.

No screen or wireframe edits. Launch source changes require renewed reviewed totals/digest; completed binding success is the only navigation trigger to the active run.

Pass M07's frozen variant refs/control snapshots unchanged into each task request for every expected trial. Handle `harness.model_rejected(reason=variant_mismatch)` through the existing configuration failure branch: M05 refuses predispatch spawn or stops/drains detected drift; append its observations/receipts before halting later tasks/trials as not_run, while other configurations continue. Preserve affected request intervals/TrialRefs since the last reliable observation, conservatively the affected trial if coverage is unknown. Unverified evidence alone does not halt an otherwise usable selection. Template IdentityMismatch retains its separate run-wide coordinator.

**Route, comparison and profile interfaces.** Consume FrozenHarnessComparisonV1 from the existing launch binding and materialize only selected ConfigurationIds with their full expected trials. Strict matrices require frozen jobs=1; each configuration holds its single slot through sequential trials in frozen registry order. Exploratory concurrency uses existing resource policy and discloses overlap; no rotation/second scheduler. Extend existing DecisionResourceLease request/receipt scope union with `route_qualification{job_id,verification_id,plan_digest,invocation_id?}`; M03 owns its one acquisition around qualified M05 diagnostic execution, M12.4 still alone acquires decision scopes. No fake DecisionCallId/TrialRef. Local/mixed/unknown actual upstream inference enters the same bounded fair queue and settlement/recovery rules; loopback remote transport alone does not require local inference attribution. Every grant rechecks stop/cancel and qualification bounds.

**Frozen harness-comparison runs — R192–R193.**

[CROSS-HARNESS-COMPARISON.md](../CROSS-HARNESS-COMPARISON.md) supplies ordinary generated configuration entries plus a frozen full-registry comparison reference. Strict comparison setup selects jobs=1; ordinary non-matrix defaults remain unchanged. Respect existing slot ownership across all trials and frozen entry order; add no interleaved trial scheduler. Launch/stop/recovery never reconstruct the matrix from live profiles or registry state. Known route/model/effort mismatch durably records the affected scope and triggers existing lane stop/drain/retention, preserving incurred measurements and expected trials without template invalidation.

## Integrated requirements

R192, R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R189 — [human review](../M12/05-human-review-web.md).

R187 — frozen domain profile/evidence contracts: [R187](../quality-judges/AGENTIC.md).

R163, R164, R169 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

R177, R178, R183, R181, R182 — [benchmark modes](../BENCHMARK-MODES.md); [Cursor](../M05/08-cursor-adapter.md) and [OpenCode](../M05/09-opencode-adapter.md) registry contracts.

`execute_configuration.py` consumes the frozen format/mode/ordered-input/baseline and `TaskCommitProtocolRef` from M07, never reloads a source folder or live profile. One-shot runs exactly T1; multi-step runs one task per ordered primary, with introduced-prefix inputs and fresh process/conversation while retaining the trial's workspace/repository. C configurations × T trials × N primary tasks yields C×T×N logical tasks; checks and grading add none.

M05 establishes new-policy unborn/empty or synthetic-baseline/populated Git before measured work; M09 selects its unchanged absent-repository branch. Require Git/commit compatibility before spawn. After every attempted task await process drainage, durable repository/snapshot evidence and M08's mandatory protocol outcome even for empty authored suites; later tasks use existing continuation/stop rules, no retry/repair/engine commit or new scoring penalty. Never-started tasks have no invented milestone. Add loop tests for failed/timeout/no-change/missing-commit tasks, source deletion, ancestor retention and delayed evidence acknowledgement, including all six adapters and multiple trials occupying one configuration slot.

Own `engine/runs/application/decision_resources.py` and implement the parent's exact `DecisionResourceLease.acquire/cancel/settle/admit_measurement/close_measurement/reconcile` cross-run handshake in run application interfaces/ports: M12.4 alone acquires it for local or unknown-routing warmup/load/inference. Atomically exclude new clean competitor measured windows until resource settlement; default deferred policy waits for every managed run's windows to end. Use bounded fair cancellable queues, never wait for a lease while holding a run lock needed to close a window. Frozen live_local_overlap records contamination instead of claiming clean admission; localhost is not locality evidence.

Task output drainage joins M05 capture producers and closes every declared source. M10 `drain_run` awaits capture acknowledgements and durable gaps/closure with off/unavailable envelopes. Classification remains independent and never enters the terminal barrier; native capture continues while local decision work waits.

**Human admission acceptance:** Complete all expected competitor trials, verification/accounting and execution seals before M12 prepares the unique original HumanBatchPlan. Keep state=judging with wait_reason=human_input, pending counts/batch ref and reopen/stop capabilities. Release the configuration slots, automated judge FIFO, locks and every resource lease before a person reads/edits; unrelated runs and machine assessments continue. RunJudging.wait remains legitimately pending until all actual original dispositions; no report auto-open, timeout settlement or extra scheduler is added. Test multi-task trials yielding one case each and stopped-before-admission yielding no browser.

## Acceptance and faults

**Route/profile acceptance:** Six fixture cells×three trials yields one RunUid, six ConfigurationIds, 18 expected trials and no interleaving. Strict jobs>1 rejects before launch. Cross-run measured windows defer route diagnostics; cancel/unknown server activity uses existing durable queue without leaked locks, synthetic trial or model retry.

**Variant acceptance:** Script predispatch mismatch, drift in trial 2 and missing provider proof. Assert no substitute/retry, exact affected scope, awaited evidence receipts, later not_run outcomes, other lanes progressing and unchanged configuration slot ownership across trials. Post-seal exclusion does not call run-wide template invalidation.

**Domain acceptance:** Race product evaluation with competitor starts and decision requests across runs; verify shared fairness, bounded cancellation, no nested gate and zero unapproved/live-unready product calls. Configuration-owned trial sequencing and existing measurement windows remain unchanged.

Race competitor starts across two runs against local warmup and unknown-routing calls; prove atomic leases, no interleaving change to configuration trial slots, bounded cancellation and no run-lock deadlock. Delay capture closure versus classifier independently: only capture durability blocks seal.

```sh
pytest tests/engine/runs/test_scheduling.py tests/engine/runs/test_launch_binding.py tests/engine/runs/test_configuration_loop.py tests/engine/runs/test_timeline.py tests/api/test_runs_launch_status.py tests/integration/test_run_scheduler.py
```

1. Seven entries across all six harnesses start six then the queued same-harness entry under the registry default; selected subsets and explicit jobs=4/5 retain their own bounds, and jobs 1 never overlaps. Three trials occupy one slot with three distinct baselines/results/resources and unchanged sequential task order.
2. Reject zero/fractional trials and invalid jobs as typed application errors (M14 exit 1; local parser/input misuse exit 2); defaults yield one trial and three-hour deadlines. A high-trial launch durably retains exact totals/warning before work; subscribe only after completion/cache expiry/restart and recover them through jobs.get/job snapshot without duplicate printing; no implicit extra confirmation in unattended mode.
3. Cancel/fail each precommit step, then fail after commit and after each result open/scheduling append. Only precommit staging is removed; postcommit retry retains UID/binding and cannot spawn until all roster records exist.
4. Race cancel against commit and retry a lost commit/launch response. Observe exactly one committed binding and job outcome; no duplicate UID/results. A changed preview digest returns review_stale before staging.
5. Timeout T4 then observe T5 with T4 workspace, one invocation each. Auth failure in one lane halts its later trials while other lanes continue; no failed task gets another attempt.
6. Two trials have different T1 outcomes/logs/screenshots; query trial 1 during trial 2 and verify all IDs/paths/counts. Same-label different-UID runs never mix results, logs or measurements.
7. Block M05 drain, M08 acknowledgement or required phase handler; next task/finalization cannot overtake it. Disconnect/overflow clients and confirm required work still completes exactly once.
8. Inject identity mismatch on establishment, last-task check and final regression; no ordinary failure conversion or next task. Coordinator invoked once per run; M11.4 proves the actual cleanup/invalidation.

## Real integration and pending parent work

Compose real M01/M02/M05/M07/M08/M10 services with temporary durable stores and actual supported harness fixtures/processes. Verify M07 full binding, M02 scope/operation-ID checks and M10 acknowledgements without private state shortcuts.

**Pending parent obligations:** real M12/M18 finalization, all stop/recovery/invalidation races in M11.4, M11.5 screens and M13/M17 report/export agreement. Fake terminal ports cannot establish terminal retention correctness.
