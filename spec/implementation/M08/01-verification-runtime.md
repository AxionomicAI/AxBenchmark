# M08.1 — verification-runtime

Parent: [M08 verification engine](../reference/modules/08-verification-evidence.md#1-engine-component). Requirements: R034, R067, R073–R078, R134, R144, R150, R153–R154. Findings: F03, F06, F09, F11; consume F04/F18 shared contracts.

Outcome: a headless, explicitly scoped verification operation with frozen observation rules, separate check classifications and an awaited durable completion boundary. This child specifies proposed implementation, not an implemented verifier.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap package/test layout and shared IDs/errors/cursors; [M01.1](../M01/01-canonical-definition.md), [M02.1](../M02/01-retained-records.md), [M05.1](../M05/01-process-runtime.md), [M05.2](../M05/02-isolation-observation.md), M11.1 engine/client/API and M11.2 jobs/events foundations.

**Bootstrap-published contracts, allowed as injected fixtures:** M01 `RevisionReader`/`TemplateIdentity`; M02 `ResultRecorder`/reader; M03 prerequisite assessments; M10 `VerificationObservations`/finalizer; M11 scheduler/invalidation coordinator; M06 eligibility notes. M08 publishes check/evidence/observation schemas before M02/M09 consume them. Later provider implementations are integration gates, not circular entry requirements.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/verification/domain/checks.py`, `observations.py`, `classification.py`, `evidence.py`, `regression.py`, `errors.py`, `__init__.py`.
- `axbenchmark/engine/verification/ports.py`; `application/interfaces.py`, `verify.py`, `cancel.py`, `reconcile.py`, `summaries.py`.
- `axbenchmark/engine/verification/schemas/acceptance-v1.schema.json`, `observation-v1.schema.json`; `axbenchmark/api/verification.py` scoped DTO/schema publication.
- `tests/verification/test_suite_schema.py`, `test_classification.py`, `test_trial_scope.py`, `test_runtime_lifecycle.py`, `test_durable_completion.py`, `test_identity_invalidation.py`, `test_recovery.py`.
- `tests/verification/fixtures/contracts/` and `tests/verification/fakes.py` for phase rules, two trials, fatal identity and delayed persistence/acknowledgement.

Coordinate additive registrations in `api/registry.py`, `engine/daemon/composition.py` and import-linter configuration with M11. M08 owns its feature definitions; foundations remain M11-owned. No interface or competitor implementation belongs here.

Use shared `RunUid`, `TrialRef {run_uid, configuration_id, trial_index}` and `ResultId`. Resolve result ID once and reject scope disagreement before allocation or writes. Every check, snapshot/evidence reference, journal and summary carries result/trial/task/phase; one-based trial indices are bounded by frozen launch count.

Export one `CheckPhase` enum (`Phase` alias) and one `CheckResult`/`CheckOutcome` type for M02. Preserve process outcome independently. `SnapshotRef` keeps unavailable commit metadata unavailable; declared commit-history observations can still establish a missing required commit as failed.

Publish the parent's exact `acceptance.v1` envelope and mandatory `requirement`, `phases`, `observation`, `failure_rule` fields. Validate references, unique check ids/phases, safe entry paths and no later-task prerequisites at `at_task`. A strategy's inputs/expected values have a declared schema; no opaque instruction replaces an executable observation.

An `ObservationRecord` names requirement, phase, target snapshots, strategy, expected/observed values, evidence and classification. Pass requires all declared observations. Only typed requirement assertions establish `failed/application_failure`; arbitrary exceptions even inside a step are `unverified/verifier_error`. Missing prerequisites and not-run checks retain separate causes.

Do not impose a DOM/storage schema. T2 data/persistence may be observed without T3 UI. M09 supplies the exact inventory catalog, task-commit rules and differing conforming fixtures; M08 neither fixes its count at 21 nor decides application-specific selectors.

Implement `TaskVerifier.verify_task(rid, trial, task, sha)`, `.verify_final(rid, trial, sha)`, `.cancel(run_uid, cfg?)`, `.reconcile()`. Use M05 `task_snapshot(trial, task)` and `lease_verification(trial)`; leases/copies are not shared across trials. Final verification preserves at-task results and labels artifact task separately from each check's defining task.

`EvidenceFiles.task_dir(trial, task, phase)` allocates the parent's UID/configuration/trial/phase hierarchy. Stable `verification_id` identifies one logical task/phase operation. Attach evidence before `append_check_outcomes(rid, trial, task, phase, checks, operation_id)`; both M02 writes require stable operation IDs and durable return.

Persist pending writes and deliveries in the verification journal. Identical recovery appends are no-ops; conflicting bytes fail. No normal completion event, return or seal occurs while an evidence write is pending. Storage failure keeps finalization pending, without replacing already observed outcomes.

Await M10 `record_verification(VerificationObservation) -> ObservationReceipt` using the parent's exact fields and stable `verification:<id>:summary` ID. Receipt digest must match and is persisted before completion. Duplicate deliveries deduplicate; conflict or missing acknowledgement fails. M10 drains acknowledged observations before final accounting; UI queues are never accounting transport.

`CheckSummaries.for_trial(trial, phase)` reads M02 and returns explicit task/phase summaries. Keep final and post-task counts/durations separate; verification time does not become competitor benchmark elapsed.

Catch `IdentityMismatch(check)` separately from all ordinary failures, including nested/cleanup exceptions. Preserve the original check/source, drain/retain partial evidence, then rethrow to M11's owning operation. That owner calls the run coordinator outside the child being joined; secondary cleanup faults cannot mask identity or cause a self-wait.

M11 checks after the last task and before finalization/judging; M08 checks before/after final regression and on every verified suite read. Invalidation halts the whole run and overlays sealed trials, never becoming a failed/unverified check or a new template binding.

Stop/recovery drains groups, retains existing observations, marks genuinely unfinished checks not run, retries pending writes/acks and disposes only owned copies. It never silently reruns checks or reopens sealed execution facts.

## States and API

No rendering ownership. Publish pending/running/complete, stage, partial evidence, ordinary failure, durability-pending and run-invalidated projections for TaskChecks, VerifyProgress, FinalRegression and CheckOutcomes.

M08 verification is internal work, not a client job. Register exact `verification.*` events with explicit trial/phase, stable entry IDs or object revisions, and `EventCursor`; use shared numeric RPC errors with namespaced `data.code`. Child M08.2 implements query/RPC adapters.

## Acceptance and faults

Run `pytest tests/verification/test_suite_schema.py tests/verification/test_classification.py tests/verification/test_trial_scope.py tests/verification/test_runtime_lifecycle.py tests/verification/test_durable_completion.py tests/verification/test_identity_invalidation.py tests/verification/test_recovery.py`.

1. Reject unknown fields/references, unsafe entries, duplicate phases/ids and T2→T3 prerequisites. Pass a declared T2 data observation without UI; fail an observed missing required commit; classify unreadable history as unverified.
2. Exhaust status/cause pairs: no snapshot, missing browser, valid assertion failure, crash inside/outside a step, malformed/missing report, timeout and nonzero passing report. No absent observation can pass; process exit and judge grade cannot change checks.
3. Two trials share task/check ids but have different evidence and outcomes. Assert distinct allocator paths, summaries and retained records. Reject mismatched result/trial bodies and same-label different-UID contamination.
4. Delay every M02 write and M10 acknowledgement, cancel during delivery, crash between durable receipt and completion. Assert stable recovery IDs, no duplicate accounting, no premature completion/seal/export and conflict rejection.
5. Inject identity mismatch in suite read, after last task, before/after final regression and cleanup, including simultaneous storage failure. The coordinator receives the original check once; no ordinary failure mapping or success event appears; all associated trials become non-comparable.
6. Cancel during setup/check/capture/disposal and reconcile an orphan. Already observed rows survive, unfinished rows stay not run, groups drain and leases release; client detachment has no execution effect.

## Real integration gate

Compose M01 reads, M02 durable retention, M05 snapshots/resources, M08.2 real processes, M10 journal/finalizer and M11 coordinator. Delay storage/accounting, invalidate the last-task/final-read path, restart, then export/import retained facts and verify unchanged scope/outcomes and invalidation.

**Pending parent obligations:** M08.2 real runners/evidence/judge projection, M08.3 screens, M09's complete fair catalog, M11 terminal-path integration and frontend/backend/existing-repository end-to-end acceptance. Fake runtimes cannot close the parent.
