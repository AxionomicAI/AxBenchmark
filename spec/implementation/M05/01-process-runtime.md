# M05.1 — process-runtime

Parent: [M05 engine contract](../reference/modules/05-harness-execution-isolation.md#1-engine-component). Requirements: R010, R012, R065, R069, R076–R078, R134, R137, R138, R153, R154. Findings: F06 scoped records, F09 invalidation, F03 durable drainage, F04/F05/F18 transport and F15 ordering.

Outcome: a daemon-owned invocation completes, fails or cancels with durable process facts and no implicit retry. This is proposed implementation work; fixtures do not establish any real harness’s support.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap and M11.1 `engine-client-api` / M11.2 `events-jobs-lifecycle` from the [foundation contract](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries).

**Bootstrap-published contracts, allowed as injected fixtures:** M01 `RevisionReader`/semantic baseline; M02 `ResultRecorder` and `EvidenceRef`; M07 frozen inputs; M10 acknowledged observation sink; M11 invalidation/scheduler consumers; M12/M16 role inputs; M03 diagnostic `JobId`; M18 `ProcessTracking.started/exited` application interface. Their complete feature implementations are later parent integration gates.

No dependency on a real adapter or M11 scheduler is needed to prove process ownership. Do not import those providers’ adapters or stored files.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/harness/domain/identity.py`, `invocations.py`, `observations.py`, `outcomes.py`, `errors.py`.
- `axbenchmark/engine/harness/ports.py`, `application/interfaces.py`, `application/invoke.py`, `stop.py`, `reconcile.py`, `verify.py`.
- `axbenchmark/engine/harness/adapters/process.py`, `store_fs.py`; `axbenchmark/api/harness.py` for published DTOs.
- `tests/harness/test_process_runtime.py`, `test_invocation_store.py`, `test_diagnostic_verification.py`, `test_scope_contracts.py`, `test_process_tracking.py`; `tests/harness/fixtures/process_child.py` and `fake_ports.py`.

Publish `HarnessAdapter`, `ProcessRunner`, `ProcessHandle`, `InvocationStore` and `InvocationObservationSink` ports; inject M18’s exact `ProcessTracking` application interface into the owned invoke/stop/reconcile use cases. Keep harness-specific argument construction/parsing out of this child.

Implement the invoke/stop/reconcile/verify members of parent `HarnessExecution`/`HarnessInspection`; M05.2 supplies establishment/resource/snapshot members. No client spawn method or new job is introduced.

Allocate `InvocationId` and persist launch intent before spawn. Competitor `TaskScope` carries `TrialRef`, `ResultId` and task id; judge scope carries its review plus explicit artifact result/trial. Planner and readiness scopes stay independent.

Diagnostic verification accepts M03’s `job_id` alongside its record directory and returns `VerificationScope`, `InvocationId` and that `JobId`. Never open a benchmark result or synthesize run/trial/task identity for it.

A request cannot contain a prior conversation id. Validate frozen model/effort before spawn; unknown effort means omission. An invocation id replay never launches a second process; a differing repeated request yields `harness.invocation_conflict`.

Use a fresh supervised process group with closed stdin. Drain both streams continuously, persist scoped entries before fan-out, await exit and stream EOF, then persist the final result. A deadline/stop terminates descendants and records cleanup; partial output remains readable.

Store stable operation ids plus payload digests for intent, outcome, evidence and log entries. Identical recovery writes are no-ops; conflicting repeats fail. Persist process start identity as well as pid/group, so reconciliation cannot signal an unrelated reused pid.

M11 appends M05’s returned task outcome/evidence to M02 with those operation ids and awaits durability before finalization. M05 does not seal, rank or grade task success. Write failure is `harness.persistence_failed`, leaving lifecycle recovery pending.

Await accepted competitor usage/exit facts through `InvocationObservationSink.accept(invocation_id, entry_id, scope, fact)`; the M10 implementation deduplicates entry ids and returns durable `ObservationReceipt {observation_id, payload_digest}`. Preserve raw reported cost, exact decimal amount and explicit/documented currency provenance; missing provenance stays unknown, never guessed USD. Planner/judge usage returns to its caller; verification usage stays diagnostic. Do not wait for a UI client or use its bounded queue for accounting.

For competitor `TaskScope`, begin output draining, then await `ProcessTracking.started(scope, invocation_id, pid, pgid, process_start)` before the start transition. Await `exited(scope, invocation_id)` after exit/drainage before returning; recovery repeats the same idempotent identities. OFF/missing/failed collectors acknowledge explicit gaps and never stop execution; telemetry storage failure remains pending recovery, not an ignored collector failure. Other roles make no tracking call.

Pass M01 `IdentityMismatch` unchanged to the owning operation. M11 routes it to `RunInvalidationCoordinator` outside the failing invocation, so coordinator cleanup cannot deadlock waiting for itself. Never map it to ordinary exit failure.

Verification uses one fixed minimal headless call with all tools denied, no explicit model/effort and a 60-second deadline. If those restrictions cannot be established, fail before spawning. No automatic invocation, retry or benchmark data is permitted.

Publish the complete `InvocationFact = UsageReported | ProcessObservation | GenerationTimingObserved | RequestRosterObserved` union in the application boundary; M10.1 owns the last two pure declarations in `domain/request_observations.py`. Add the parent's `ProcessObservation` to owned `domain/models.py`. Route every accepted timing/roster fact through the existing durable `InvocationObservationSink.accept` with stable entry ID, payload digest and identical outer/inner competitor scope. A source record with usage and timing emits separate IDs referencing one evidence digest; timing is never another chargeable usage report. Await pending acknowledgements before completion, including stop/recovery; unknown timing is data, storage failure is pending work. Process-lifetime timestamps never substitute for generation windows.

Extend `RequestedSettings`/serialized InvocationRequest with the frozen requested `ModelVariantRefV1`, resolved artifact/proof and control snapshot. Publish `VariantObserved(evidence: VariantEvidenceV1)` in `HarnessSignal` and `InvocationResult.variant_evidence` plus durable receipts; this uses `VariantEvidenceRecorder` separately from the accounting `InvocationFact` union. Bind all observations to supplied invocation/full TrialRef/request scope, preserving proof limits and redacted source evidence.

Before dispatch, validate available serving evidence against the frozen selection. Known mismatch returns existing `harness.model_rejected` with `reason=variant_mismatch`, expected/observed refs and no spawn. During-task mismatch stops/drains that invocation, persists partial output/observations and returns the same model-selection failure for M11's configuration halt. Missing proof is unverified, not mismatch. Accepted observation receipts join process completion; late post-seal evidence uses M02 annotations. Neither drift nor recovery invokes a substitute model or M01 template invalidation.

**Route, comparison and profile interfaces.** Publish `RouteObserved(evidence: RequestRouteObservationV1)` alongside `VariantObserved` without adding either to M10 InvocationFact. Extend RequestedSettings/InvocationRequest with optional immutable `resolved_access_plan` and `resolved_existing_agent_plan`; EffortSelection accepts the resolved Mapped branch and never treats it as a string flag. Common source records have a stable engine-bound invocation/request/attempt/source identity and sanitized evidence digest. For result-backed calls, dispatch route evidence through M02 VariantEvidenceRecorder.append_route_observation, then reference its source_fact_ref in any variant projection; replay reuses the same source and disagreement is retained. Never use a live event or M10 accounting copy as a second model/effort authority. Planner/diagnostic observations stay in their existing scope journals, not fabricated retained results. Completion awaits all accepted receipts; absent exposure settles unverified while failed persistence remains pending.

## Integrated requirements

R192, R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R173, R176 — [benchmark statistics](../BENCHMARK-STATISTICS.md).

R177, R178, R181, R182, R183 — [benchmark modes](../BENCHMARK-MODES.md); [Cursor](../M05/08-cursor-adapter.md) and [OpenCode](../M05/09-opencode-adapter.md) registry contracts.

Publish the shared six-value HarnessId and the parent's version-aware `CompetitorInputs` on InvocationRequest, plus `TaskRepositoryEvidence` refs/receipts on InvocationResult. M05.2 captures start facts before spawn and end facts after drainage; the existing process completion barrier awaits their durable receipts without classifying commit success. Exact one-shot T1 and multi-step introduced-prefix bytes remain unchanged through intent serialization. Extend scope/intent/recovery fixtures across both modes and all six IDs: no unknown harness coercion, extra task, commit-on-recovery or repaired invocation; missing evidence remains typed and visible.

## Acceptance and faults

**Route/profile acceptance:** Round-trip Mapped/Contract and resolved plans in both clients, then race route and variant evidence retries, absent usage, differing source reports and stop/drain. No duplicate raw fact/charge, alias-derived effective value or post-seal mutation. PlanningScope and diagnostic scopes use no TrialRef; shared source IDs cannot cross invocation/role.

**Variant acceptance:** Add scope/intent/drainage fixtures for absent proof, alias-only report, confirmed loaded composition and known mismatch before/during dispatch. Zero predispatch spawn, one stop/drain, delayed evidence acknowledgement, idempotent recovery and unchanged accounting union must hold; variant mismatch cannot enter the template-invalidation path.

Extend `test_scope_contracts.py`, `test_process_runtime.py` and `test_invocation_store.py` for all four fact variants, delayed timing/roster acknowledgements, duplicate versus conflicting retries and cross-trial requests. Non-competitor roles make no request-statistics sink call; missing source timing/roster remains explicitly unavailable without holding an otherwise durable invocation open.

Run:

```sh
pytest tests/harness/test_process_runtime.py tests/harness/test_invocation_store.py tests/harness/test_diagnostic_verification.py tests/harness/test_scope_contracts.py tests/harness/test_process_tracking.py
```

1. A real local fixture subprocess floods stdout/stderr, reads stdin, forks a child and exits nonzero. Capture all lines, observe EOF, preserve partial logs, and distinguish launch failure, timeout and stop from normal exit.
2. Invoke two tasks with a fake adapter: distinct processes, no session reuse, exact frozen model and no retry on rejection. Disconnect both clients; daemon process identity and invocation count remain unchanged on reconnect.
3. Crash/fail writes after launch intent, a log append, exit drainage and final record. Recovery deduplicates stable ids, reports ambiguous/orphaned work and never reruns a task. Disk-full/rename faults publish no false completion.
4. Use two trials with identical task ids and two runs with equal labels; results, snapshots, logs and operation ids remain separate. Result/trial mismatch fails before I/O.
5. A fake critical sink delays/fails acknowledgement while UI queues overflow. Invocation completion waits for critical durability; UI disconnection does not block draining or discard retained facts.
6. Feed identity mismatch from an injected baseline/read provider during invocation setup. The owning operation receives the original digests/paths; no `config_failed` result replaces it.
7. Verification checks confirmed, auth rejected, offline, failed, timeout, cancelled and controls-unavailable cases. Zero spawns without usable restriction controls; at most one with consent, and no `ResultRecorder` call in any diagnostic case.
8. With an awaited tracking spy, test immediate exit, stop, recovery replay, PID reuse and UI overflow: exact start/exit arguments and flush ordering survive; OFF/collector failure returns explicit partial/unavailable state and execution continues. Storage failure blocks completion; no judge/planner/diagnostic call reaches competitor tracking/accounting.
9. Run fixture-child process-group termination, pid reuse rejection and engine-restart reconciliation on real macOS and Linux. Record OS/runtime versions and cleanup receipts; this proves runtime behavior, not a harness CLI contract.

**UI boundary:** no screens or artboards owned. Supply scoped outcomes/errors for RunConfig, TaskBlocked, ModelRejected and diagnostic Environment states; M05.7/M03 render them.

**Pending parent obligations:** M05.2 resources/restoration, M05.3–M05.6 and M05.8–M05.9 version-qualified adapters, M05.7 API/views, and real M02/M10/M11 retention/finalization plus M03/M12/M16 caller integrations and real M18 process registration/flush. Judge requests use the same runtime with M05.2’s protected-root environment. The Bootstrap fixture path alone cannot complete M05.

### Automated judge assessment storage binding

Judging scopes carry the durable automated `assessment_id` and actual independently selected JudgeGroup in addition to the assessed ResultId/TrialRef. Reserved ReviewId is an identity promise, not a committed Review. Route/call observations may publish before Review completion; they must not inherit competitor harness/access bindings. Diagnostic/planner scopes remain outside result-only inference-call storage.
