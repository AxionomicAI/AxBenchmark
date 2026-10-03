# M11.4 — stop-recovery-invalidation

Parent: [M11 terminal lifecycle](../reference/modules/11-run-orchestration.md#1-engine-component). Requirements: R046, R060, R067, R077–R081, R114, R134, R139, R147, R153–R155. Findings: F02, F03, F05, F06, F09, F13.

Outcome: every normal/stop/interruption/identity path settles cleanup and immutable retention through one recoverable coordinator, including judging after execution seal.

## Entry conditions

**Completed prerequisites:** Bootstrap, [M11.3](03-run-scheduler.md), M12.2 judging worker and M18.2 sampling lifecycle. M02/M05/M07/M08/M10 real services are inherited requirements, not optional fakes for final acceptance.

**Published contracts allowed as fixtures during unit work:** M13 CompletionReports.ensure/get/wait and reports.status durable outcome and M17 export consumer. Require their real integrations before parent acceptance. No dependency on M11.5 or M15 screens.

## Exact proposed ownership

- `axbenchmark/engine/runs/domain/stopping.py`, `invalidation.py`, `finalization.py`; additive lifecycle/capability rules in `domain/state.py`.
- `axbenchmark/engine/runs/application/stop.py`, `invalidate.py`, `finalize.py`, `reconcile.py`, `shutdown.py`, `completion.py`.
- Add RunInvalidationCoordinator and terminal coordinator implementations to `application/interfaces.py`; durable checkpoint support in runs ports/fs_runs adapter.
- Extend `axbenchmark/api/runs.py`, runs RPC registrations and query projections for stop/retention/report status and separate scope gates.
- Wire real M12/M18 cleanup/reconciliation and M10 finalization ports in daemon composition; do not edit their implementations here.
- `tests/engine/runs/test_stop.py`, `test_invalidation.py`, `test_finalization.py`, `test_recovery.py`, `test_terminal_races.py`.
- `tests/integration/test_run_retention_barrier.py`, `test_identity_during_judging.py`, `test_completion_report_wait.py`.
- `tests/fixtures/runs/crash_checkpoints.py`, `terminal_dispositions.py`: fault injection at every durable boundary.

Do not reopen M02 sealed facts, recalculate M10 receipts, own M12 review storage or bypass M05 process ownership. M11 supervises and awaits those owners.

## One terminal barrier

1. Close task admission; join/cancel tasks and checks, await output/usage/evidence persistence and after-last-task/final-regression identity checks. Preserve actual partial/not-run outcomes.
2. Await `MeasurementFinalizer.drain_run(run_uid)` for accepted usage/exit/check/execution-phase work; no ended-event trigger or UI queue dependency.
3. Await idempotent `ExperimentTelemetry.close(run_uid) -> TelemetryFinalizationReceipt`, including durable per-TrialRef hardware writes and last covered instant.
4. Await `MeasurementFinalizer.finalize_run(run_uid, telemetry_receipt, terminal_cause) -> MeasurementFinalizationReceipt`. Its M02 operation-ID appends and receipt must be durable before return.
5. Seal each unsealed ResultId with its actual execution status and valid receipt. Journal per-result progress; already sealed results retain earlier receipt/digest and skip all fact writes.
6. Check identity, await `batch_id = RunJudging.judge_run(run_uid)` then `RunJudging.wait(batch_id) -> OriginalJudgingSettlement` normally; terminal paths use stop/recover below. Settlement binds every expected ResultId/TrialRef with roster/settlement digests, GRADED/UNGRADED/FAILED/NOT_JUDGED dispositions and committed review IDs/digests. Judge duration/cost/reviews remain outside competitor facts.
7. Await `ResultRecorder.finish_run_retention(run_uid, TerminalRetention)` with unchanged M18/M10 receipts, complete original settlement and terminal lifecycle cause; only then publish terminal state and await CompletionReports.ensure(run_uid), including skipped dispositions for stopped/interrupted/invalidated runs.

A checkpoint fixes selected unsealed result IDs, accepted-observation cutoff/digest, telemetry receipt/digest, full launch digest and original terminal cause. Retry every pending finalizer call with those original inputs, including after engine loss or a later stop. Record later interruption separately in lifecycle/TerminalRetention; never replace finalized execution inputs to match the later outcome.

If no checkpoint exists, recovery creates one partial-data checkpoint once. Missing data remains unknown/partial. Failure leaves retention_pending and readiness false with the owning typed error; no successful terminal/report claim. M02 remains authoritative for retained/imported facts.

## Stop, invalidation and recovery

Run can_stop is enabled after complete binding during active execution, finalizing, retention_pending and judging; a repeated pending stop returns its receipt. Configuration can_stop is only queued/preparing/running/verifying. Preview, command and capability projections use the same rule under a lifecycle lock.

Persist stop intent before cancellation. Run stop cancels task/check work and awaits M05 cleanup; await `RunJudging.batch_for_run(run_uid) -> BatchId | None`, then internal `stop(batch_id, cause) -> OriginalJudgingSettlement` if present, otherwise `recover(run_uid, cause) -> OriginalJudgingSettlement` with zero model calls. Complete the barrier with that durable settlement. Configuration stop preserves other lanes and defers run-wide telemetry/finalization until they finish. Neither stop cancels durable finalization persistence.

Public RUN judging.stop delegates once to runs.stop; the supervisor calls internal RunJudging.stop, avoiding recursive public dispatch. Stop/recover preserve their first accepted settlement/cause on retry; later interruption stays lifecycle data.

Stopping during judging preserves sealed facts and completed reviews, records remaining originals not judged, and yields stopped outcome. Stop completion acknowledges actual cleanup/scoped dispositions, with separate retention/report state or typed pending error; it never disguises pending retention as success.

Implement `RunInvalidationCoordinator.invalidate(run_uid, identity_check, detected_at, source) -> RunInvalidation` for M01/M05/M08/M12 run-scoped failures. Before cleanup, await M02 append_run_invalidation with UID/ID, both digests, changed paths, time and source. First durable record wins; duplicates cannot overwrite evidence or start duplicate cleanup.

Every associated result/review becomes effectively interrupted/non-comparable immediately, including sealed results. Preserve original binding/facts/evidence. Cancel task admission/checks/active judges; finalize only unsealed results with partial data and end interrupted. Identity failures never become ordinary unverified checks or invalid judge responses.

Originating workers await durable registration, then unwind; supervisor cleanup joins them afterward. Never make a reporting M08/M12 worker await cleanup that joins itself. Serialize invalidation, stop, judge admission and terminal/report eligibility; persisted invalidation wins comparison exclusion even if stop raced first.

On startup resolve M07 commit intents, complete committed result rosters under the same UID, load invalidations before readers, reconcile orphan M05/M08/M12 resources and pending receipts/dispositions. Await `RunJudging.recover(run_uid, engine_lost)` for the complete frozen roster even with no existing batch; retain prior committed reviews/dispositions and settle the rest. No task/judge model call restarts. Lost active runs gain engine_lost lifecycle status while existing finalizer inputs remain fixed.

SIGTERM records engine_terminated, attempts the same cleanup/barrier, and leaves durable pending checkpoints if time expires. SIGKILL recovery uses last durable evidence/sample, never fabricated coverage. Client disconnect is neither interruption nor cancellation.

Use exact M13 awaited ports `CompletionReports.ensure(run_uid) -> ReportStatus`, `.get(run_uid) -> ReportStatus`, `.wait(run_uid) -> ReportDisposition`. Ensure is idempotent by completion RunUid; get recovers durable state and wait settles succeeded/failed/cancelled/skipped. Map succeeded to RunStatus written with path/open attempt; retain the other reasons/errors. Typed reports.retention_pending/reports.persistence_pending settle waits as pending errors in completion_report, preserving their code; a later report failure/pending never retracts settled M02 retention or changes the terminal run outcome. Persist projection before notifications; clients recover with reports.status(completion_run_uid=run_uid) or report_id after generic job-cache expiry. Required work never depends on a UI event.

## Boards and supplied states

Supply StopConfirm run/configuration gates and judge cleanup; StopCleanup terminate/cleanup/retain states; RunOverview/RunReattached finalizing, retention-pending/error, invalidation and report dispositions. M11.5 renders them; no wireframe edits here.

## Acceptance and fault matrix

```sh
pytest tests/engine/runs/test_stop.py tests/engine/runs/test_invalidation.py tests/engine/runs/test_finalization.py tests/engine/runs/test_recovery.py tests/engine/runs/test_terminal_races.py tests/integration/test_run_retention_barrier.py tests/integration/test_identity_during_judging.py tests/integration/test_completion_report_wait.py
```

1. Delay each required handler, telemetry close, evidence/measurement append, receipt, seal and original-review disposition. No later barrier/readiness/report step overtakes it; immediate retained/export facts match live values after readiness.
2. Crash after every checkpoint, including between two seals and after finish retention before terminal publication. Recover identical operation IDs/digests/receipts; append nothing after seal and publish terminal/report intent idempotently.
3. Assert exact judge_run → wait signatures and full settlement roster on normal completion. Stop/invalidate before any batch and recover after engine loss: batch_for_run may be None, recover settles every trial with zero model calls. Public RUN judging.stop delegates once; internal stop never calls it recursively.
4. Fail a finalizer append with cause completed, then stop/kill the engine. Retry uses completed checkpoint cause/digest while run lifecycle records stopped/engine_lost separately. With no checkpoint, interrupted recovery creates one partial-data checkpoint only.
5. Stop configuration versus run at each task/check/finalizer/judge boundary; other lanes continue for scoped stop. Repeated stop returns same ID. Completed configuration gate stays disabled during run judging while run gate remains enabled.
6. Mutate during last task, final regression and judging after seal, including a M12 read error and a concurrent second detector. All results/reviews exclude immediately; one first overlay/cleanup, both digests/paths retained, no binding rewrite or self-join deadlock.
7. Race stop, mismatch, judge start and final terminal publication. No new work enters after the winning halt; invalidation always defeats comparison eligibility and report readiness.
8. Detach/reconnect during cleanup and after missed report failure; snapshot state settles both stop/report waits. Test CompletionReports.ensure/get/wait and reports.status across succeeded→written, failed, cancelled, skipped and typed retention/persistence-pending; expire generic job cache/restart and verify the durable projection still settles without indefinite waiting.
9. Kill real child/service/judge process groups through M05, verify ports/resources released, restart with pending evidence, and prove no task/judge invocation repeats. Unsupported collector coverage stays partial/unknown.

## Real integration and pending parent work

Require real M02/M05/M07/M08/M10/M12/M18 services in fault tests. Complete sequential local-energy and parallel repeated-trial runs; exercise stop during judging and template mutation after seal. M17 export/import and M13 immediate report must agree with retained measurements and overlay eligibility.

**Pending parent obligations:** M11.5 screens; M14 command waits; M15 shell/reconnect; M13/M17 real consumer gates and platform/harness cleanup evidence. Fixture cleanup alone cannot complete this child or the parent.
