# M12.2 — judging-worker

Parent: [M12 worker and ports](../../12-quality-judging.md#1-engine-component). Requirements: R035, R046, R067, R077, R082–R084, R134, R139, R144, R150, R153–R154. Findings: F03, F06, F09, F13; shared F02/F04/F15/F18.

Outcome: durable original/additional review work with sequential fresh sessions, protected artifacts, separate accounting and complete terminal dispositions. This is proposed implementation work.

## Entry conditions

**Completed prerequisites:** Bootstrap, [M12.1](01-review-contract.md), M05.1–2 process/adapter services, M02.2 retention, M08.2 evidence, M10.1 invocation accounting and M11.1–2 daemon/client/events/jobs. Neither full scheduler nor screen implementation is required to start.

**Published contracts allowed as fixtures:** M11 run lifecycle admission/invalidation/stop and M13/M17 consumer ports; M01/M03/M04/M06/M07 reads where not inherited. Use fakes for isolated orchestration, then real providers at the gate. M11.4 requires this child, so do not require completed M11.4 here.

## Exact proposed ownership

- `axbenchmark/engine/judging/domain/batches.py`, `settlement.py`; `ports.py` and additive `application/interfaces.py` worker contracts.
- `application/check_judge.py`, `judge_run.py`, `review_next.py`, `rejudge.py`, `stop.py`, `reconcile.py`, `queries.py`.
- `adapters/harness_judge.py`, `results_bridge.py`, `revision_bridge.py`, `evidence_bridge.py`, `catalog_bridge.py`, `readiness_bridge.py`, `cost_bridge.py`, `scoring_bridge.py`, `fs_batches.py`, `rpc.py`.
- `axbenchmark/api/judging.py`; additive factory/registry integration in daemon composition coordinated with M11, using its existing client/codec/event boundary.
- `tests/engine/judging/test_worker.py`, `test_rejudge.py`, `test_settlement.py`, `test_stop.py`, `test_recovery.py`, `test_identity.py`, `test_harness_bridge.py`, `test_review_retention.py`.
- `tests/api/test_judging.py`, `tests/integration/test_judging_lifecycle.py`; `tests/fixtures/judging/batches/`, `transcripts/`, `faults.py`.

M05 owns actual process/protection enforcement; M02 owns atomic review evidence storage; M10 owns charges; M11 owns run cleanup/report readiness. No direct execution-fact writes, model fallback or separate private process implementation.

## Exact lifecycle interfaces

```python
class RunJudging(Protocol):
    async def judge_run(self, run_uid: RunUid) -> BatchId: ...
    async def wait(self, batch_id: BatchId) -> OriginalJudgingSettlement: ...
    async def stop(self, batch_id: BatchId, cause: TerminalCause) -> OriginalJudgingSettlement: ...
    async def recover(self, run_uid: RunUid, cause: TerminalCause) -> OriginalJudgingSettlement: ...
    async def batch_for_run(self, run_uid: RunUid) -> BatchId | None: ...
```

Settlement is `{settlement_id, run_uid, batch_id?, roster_digest, dispositions, settlement_digest, cleanup, settled_at}`. Each expected ResultId/TrialRef has exactly one durable disposition with outcome, optional committed review ID/digest, required failure/not-judged reason and optional invalidation ID. No queued/reviewing/pending-write state counts as settled.

`judge_run` requires all execution results sealed, current identity and M11 admission eligibility; create/return one original batch by RunUid/full frozen roster. Include missing-artifact trials and unusable judge as explicit NOT_JUDGED; never omit a result to satisfy the barrier.

`wait` reads durable completion, independent of missed events. `stop` closes admission before cancelling and returns only durable dispositions/cleanup or typed settlement-pending error. Repeated calls return the first settlement; later stop causes stay M11 lifecycle data.

`recover` never invokes a model. Resolve prior committed reviews and immutable prepared intents; settle unfinished queued/reviewing slots NOT_JUDGED(cause), using engine_lost for startup loss and the supplied stopped/identity_invalidated cause for those terminal paths. If no batch exists, reconstruct the complete roster from M02 and settle every original without creating invocation work. Retry returns the same settlement. The durable originals/<run_uid>.yaml index supports batch_id=None; M11 retains the complete dispositions through M02 TerminalRetention.

M11 uses judge_run→wait normally, stop for existing batches, recover for engine loss or terminal paths before batch creation. Pass settlement to M02 finish_run_retention; storage errors leave readiness pending. A later explicit rejudge creates ADDITIONAL work and cannot reopen original retention.

## Worker and persistence

One FIFO engine worker owns all batches; at most one active judge invocation globally. Each result/trial gets a new invocation, conversation, read-only artifact/input copy and scratch area. No earlier review, measurement or history enters the next input.

Use M05 `JudgingScope(review_id, result_id, trial, artifact_label)` and standard InvocationRequest with Role.judge. Require the parent's typed `EnvironmentSpec.judge` extension for delivered SnapshotRef/protected roots/scratch; fail before invocation if protection cannot be established. Never substitute a fresh baseline or writable competitor workspace.

Allocate/persist stable batch/review/invocation IDs before spawn. Capture/pass a shared PublicationView on M01/M02 reads, close revision leases, validate artifact/evidence/trial bindings and check identity before/after invocation. M08 PhaseNotReady/missing artifact is explicit input unavailability, not a fabricated review.

Drain M05 response/usage and await `JudgingCostAccounting.measure(invocation_id)` with its stable observation IDs. Cost/time stays in a separate invocation account, including partial stopped/failed use, never in competitor measurement appends.

Persist full immutable prepared Review bytes/digest, then call M02 add_review. Identical lost-ack retry uses review ID/digest; conflict fails. M02 appends review-owned raw response/input/evidence/cost atomically; do not call execution attach_evidence after seal. Publish review.finished only after durable acknowledgement.

Crash after preparation may replay that exact append without regrading or invoking. Crash before a complete prepared intent never grades partial output. Keep diagnostic response/evidence and available cost with not-judged reason; recover does not interpret process exit as quality.

Explicit RUN judging.stop delegates to M11 runs.stop; M11 calls internal RunJudging.stop without recursive dispatch. Cancel/drain/join active slot and release resources; retain completed reviews, settle remaining originals and let terminal/report waits finish. Do not kill the global FIFO worker for other batches.

REJUDGE is a separate cancellable job; its JobRef/batch ID addresses only additional work. Check M02 artifact/can_rejudge, current identity and chosen capability; keep original/group unchanged, retain new review/group and separate cost. Import/view/profile queries invoke no judge. Serialize cancellation versus review preparation/commit through the shared job/lifecycle gate; cancellation cannot be reported while a grade later commits, and an already committed review retains its actual job outcome.

Catch every IdentityMismatch before ordinary input/invocation/validation errors. Await M11 invalidate(run_uid, check, detected_at, source) for durable registration only, then unwind the reporting worker. Supervisor cleanup joins afterward; never self-join. Identity applies to the retained artifact's original RunUid even for additional rejudging.

Serialize admission/review commit against M11 stop/invalidation; completed reviews survive the overlay and all original-run results become non-comparable. Remaining dispositions may cite NOT_JUDGED(identity_invalidated) only after overlay durability. Persistence failure outranks a false completed claim.

## Boards and supplied states

Supply Judging/JudgingTrials queued/running/settling and explicit trial identity; JudgingDone completed/failed/ungraded/not-judged; retention-pending/error, stopped/interrupted, invalidation, missing artifact/capability and partial separate cost. Review raw response may be absent; capability flags disable its action. No screens/wireframe edits.

## Acceptance and integration

```sh
pytest tests/engine/judging tests/api/test_judging.py tests/integration/test_judging_lifecycle.py
```

1. Two configurations × three trials make six sequential fresh sessions and protected delivered snapshots; deny attempted repair, path escape and prior-session reuse. Unknown screenshot support starts no invocation.
2. Delay usage/accounting, review append and disposition fsync; wait/finish retention cannot overtake any. Same-ID retry adds one review/charge; different bytes fail. Sealed fact digest never changes.
3. Stop queued/active/settling original judging and independently stop a rejudge. Preserve completed reviews; all originals settle once, additional cancellation leaves original retention unchanged, report waits reach explicit outcomes.
4. Crash before batch creation, during queued/active slot, after prepared review/M02 append and before settlement ack. Restart makes zero model calls and returns the same complete disposition roster/IDs on retry.
5. Fail identity on revision open/evidence access/establish/post-session after seal; one durable overlay, preserved reviews, no ordinary ungraded classification, no self-join. Race stop/review commit/invalidation and verify no new admission or report eligibility.
6. Compose real M01/M02/M05/M08/M10/M11/M12 and supported judge adapter; verify process-tree cleanup, separate cost and final screenshots. Immediately M13-report and M17-export/import committed reviews/groups; invalidate after seal and verify every consumer excludes the scope.

**Pending parent obligations:** M12.3 views; M05 judge-environment extension/current-version protection evidence; M11.4 real stop/recovery/identity barrier and M13/M17 portability gates. Fakes may prove orchestration, never parent runtime completion.
