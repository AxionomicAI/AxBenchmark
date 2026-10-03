# M12.4 — decision-engines-runtime

Parent: [M12 quality judging](../reference/modules/12-quality-judging.md#1-engine-component). Requirements: R161, R165, R167–R172. Binding detail: [decision-engine contract](../DECISION-ENGINES.md); retained context rules remain in [context monitoring](../CONTEXT-MONITORING.md).

Outcome: one shared, headless decision runtime for independently selected context-classification and grading profiles. This is a proposed implementation assignment under existing M12, not evidence of implemented providers or verified model compatibility.

## Entry conditions

**Completed implementation prerequisites:** [Bootstrap](../BOOTSTRAP.md), [M11.1](../M11/01-engine-client-api.md) and [M11.2](../M11/02-events-jobs-lifecycle.md) only. Require their real dispatch, codec/client parity, jobs, authorization and lifecycle seams.

**Bootstrap-published contracts, allowed as injected fixtures:** M04 catalog/pricing/capability metadata, M03 readiness diagnostics, M10 auxiliary accounting, M11 cross-run resource admission and M02 retained evidence/profile/call storage. Use exact published protocols and deterministic fixtures; none of those full providers or the scheduler is an additional completed prerequisite.

[M10.2](../M10/02-final-accounting.md) and [M12.2](02-judging-worker.md) depend on this child. M12.1 remains a pure independent contract slice. Publish decision IDs, profiles/capabilities/requests/receipts and resource/accounting ports through Bootstrap; consumer implementations never enter this runtime's imports.

## Exact proposed ownership

All paths below are under `solution/`; assignments match the binding contract.

- `axbenchmark/engine/decisions/domain/{ids,profiles,capabilities,requests,answers,calls,errors}.py` and `__init__.py`.
- `axbenchmark/engine/decisions/ports.py`, `application/{interfaces,profiles,probe,evaluate,queue}.py`.
- `axbenchmark/engine/decisions/adapters/{systemone,profile_store,call_journal,rpc}.py` and additive daemon composition registration.
- `axbenchmark/api/decisions.py`; additive registry entries through M11.1's existing codec/client boundary.
- `tests/engine/decisions/test_{profiles,capabilities,systemone,normalization,queue,receipts,cancellation,resource_lease}.py`, `tests/api/test_decisions.py`, `tests/integration/test_decision_runtime.py`.
- `tests/fixtures/decisions/{typesafe,ollama,profiles,malformed,cancellation}/` with sanitized request/response and runtime-capability fixtures.

M10 owns context counting, capture, membership, label acceptance and analysis/accounting; M12.1–2 own evidence projection, rubric/question packs, grade composition, review validity and settlement. M03/M04 own diagnostics/catalog metadata, M11 resource admission, M02 retention, and M07/M12.3/M14 client presentation. Transfer none of their business logic or files here; add no private context/grading transport or second client/codec.

## Profiles and shared transport

Implement `DecisionEngine.capabilities`, `.probe` and `.evaluate` using the exact [shared schemas and normalization rules](../DECISION-ENGINES.md#typed-calls-normalization-and-confidence); do not maintain competing DTO definitions. Requests bind immutable profile/version/digest, purpose, scope and admitted input/evidence/schema identities supplied by the consumer.

Profiles retain explicit model identity/revision or opaque uncertainty, server/runtime/quantization/context settings, locality evidence, limits, capability provenance and credential references. Saved edits create immutable new versions; active selections and historical records never change. Capability support is supported/unsupported/unknown with source/version/time; names, URL shape and HTTP success do not prove support.

Freeze/recheck available local artifact bindings before dispatch; changed binding requires a new profile version. A response model-name echo is not a weights digest. Preserve M03/M04 provenance without overriding observed incompatibility, and retain endpoint/routing uncertainty for conservative admission.

One `SystemOneAdapter` handles configured TypeSafe remote and compatible directly addressed local Ollama dialects through `POST /v1/systemone` with `{model, state, questions}`. Dialect data covers auth, optional fields, limits, errors, usage meanings and tolerances. No chat/structured-JSON adapter, Laya dependency or alternate protocol fallback is included.

Resolve credentials only for the selected destination; TypeSafe credentials never travel to a local endpoint. Persist/export references, never secrets. Metadata/connectivity/capability probes default to zero inference; an explicitly requested bounded inference smoke test has its own cancellable job, purpose, budget and receipt. Never start/kill servers, download weights or change GPUs automatically.

Accept bounded Choice, Score and Noul questions with actual semantics in instructions/state, ordered levels/image identities and one fixed state per batch. Consumer code composes later decisions; answers never become implicit context for sibling questions. Enforce verified capability, payload/context/image limits before dispatch without truncation or substitution.

Normalize to discriminated ChoiceDecision, ScoreDecision and BooleanDecision while retaining sanitized native answers, distributions, confidence and semantics. BooleanDecision preserves Noul's true probability without inventing a threshold judgment. Missing optional confidence is null; absent usage is unknown. Never fabricate probabilities, counts or confidence, silently renormalize distributions, substitute a confidence formula or round Score into a grade.

Strictly validate JSON/duplicate keys, exact answer IDs/types/options, finite numeric bounds, distribution totals and Choice winner consistency. Retain the frozen dialect tolerance and raw values; ties/abstentions/deficiencies remain explicit for consumer acceptance. Grading and context acceptance policies belong to their callers; no runtime fallback weakens their requirements.

## Calls, accounting and bounded work

`DecisionCallId` is distinct from M05 `InvocationId`; scope includes the relevant run/result/trial or observer plus assessment/analysis identity. Persist request/profile/model/schema/input digests, attempts, timestamps, evidence refs, native usage/cost, resource provenance and terminal state under the shared receipt schema. HTTP work has no fabricated harness invocation, PID, process transcript or conversation.

Journal intent before dispatch and terminal/unknown state after response, timeout or cancellation; durable receipt acknowledgement is required for completion. Send typed idempotent auxiliary accounting keyed by DecisionCallId/observation ID with explicit purpose/role. Context observer, grading and connection-test charges stay distinguishable and outside competitor accounts; known local API charge zero does not mean known host operating cost.

Bound concurrency, outstanding calls/bytes, retries, timeouts and per-purpose/run budgets. Saturation returns durable pending/deferred or typed exhausted outcomes while capture remains nonblocking. Retry only policy-authorized known pre-dispatch grading failures; ambiguous dispatched grading is never silently repeated. Stop closes admission, then cancels/drains transport before acknowledging its terminal outcome.

Cache identity includes purpose, scope, input/evidence/schema/profile/model digests and acceptance policy, with original-call provenance. Default grading reuse across artifacts/trials is disabled; byte equality does not authorize crossing scope. No previous assessment or conversation enters a new request.

Default local inference waits until no managed competitor measured window is active across any run. The M11 resource lease atomically excludes new clean measurements and covers warmup/load/inference through settlement. Inject its published fixture here; do not implement the scheduler or hold a run lock needed to end an active window while awaiting admission.

Only frozen explicit opt-in `live_local_overlap` permits concurrent local work and marks affected measurements; unknown routing takes the conservative gate. Preserve actual intervals, runtime/residency, unknown ownership and known concurrent work. Never infer exclusive hardware, subtract guessed observer energy or claim unaffected measurements from a local URL.

Transport cancellation does not prove server termination. Bound drain; unresolved work durably becomes `server_state_unknown` with cleanup limitation and an unresolved lease. New clean measurement admission remains blocked until independent readiness resolves activity, while already selected overlap policy may admit contaminated measurements. Release worker/run locks, never kill an externally owned server or leave workers indefinitely waiting, and reconcile leases before restart admits clean work.

Recovery reconciles receipts/accounting and exact retained writes without invoking a grading model. Return incomplete grading outcomes for M12.2's durable NOT_JUDGED settlement; never resume or retry them on restart. A separately configured caller-owned context-observer resume policy cannot apply to grading. Review preparation, original retention and assessment serialization remain M12.2 responsibilities.

## API and supplied states

Register exactly `decisions.profiles.list`, `decisions.profiles.get`, `decisions.profiles.save`, `decisions.profiles.test`, `decisions.capabilities` and `decisions.calls.get`. Save creates a version; test requires explicit probe mode and inference tests return cancellable jobs. Reuse M11 authorization/job/error conventions and the same codecs for socket/InProcessClient; profile get/list never contact a model.

Supply independent role selections, unknown/unsupported capabilities, destination/auth uncertainty, queued/deferred/running/settling calls, budget exhaustion and server-state-unknown cleanup to the owning clients. No screen files belong here and HTTP progress never invents process activity.

Support lossless legacy TypeSafe/disabled profile migration through owner configuration contracts, preserving selection/threshold/model/budget/destination/credential reference and schema provenance. Retain immutable historical profiles, raw results and unknown future versions for offline inspection with explicit unsupported re-execution. Save/default changes, import/view and migration never cause inference, historical reclassification or profile overwrite.

## Acceptance and faults

Proposed commands from `solution/`; these are future implementation checks, not tests run by this specification change:

```sh
pytest tests/engine/decisions/test_profiles.py tests/engine/decisions/test_capabilities.py tests/engine/decisions/test_systemone.py tests/engine/decisions/test_normalization.py
pytest tests/engine/decisions/test_queue.py tests/engine/decisions/test_receipts.py tests/engine/decisions/test_cancellation.py tests/engine/decisions/test_resource_lease.py
pytest tests/api/test_decisions.py tests/integration/test_decision_runtime.py
lint-imports
```

1. Fixture both dialects through the same real adapter: Choice/Score/Noul, exact model/identity binding, ordered images, payload/context limits, optional usage/confidence, native errors and recorded tolerances. Reject malformed capabilities, incompatible revisions, duplicate/missing/extra IDs, invalid numbers/distributions and inconsistent winners without synthesized data or another protocol call.
2. Verify immutable version/digest reload, local identity mismatch, credential destination isolation and zero-inference metadata probes. Explicit smoke tests consume accounted budget and honour cancellation. Missing capabilities remain unknown and cannot enable unsupported input.
3. Build the actual headless daemon with real M11.1–2 dispatch/jobs and this runtime, injecting only the published external ports. Exercise every registered method through Unix socket and InProcessClient; assert tuple-to-wire-array/nullable capability parity, exact typed errors, authorization and job cleanup. No TUI, harness or real scheduler is needed.
4. Race cross-run competitor admission with local warmup/inference using the resource-gate fixture. Verify default defer, nonblocking capture, bounded/fair admission, opt-in overlap, cancellation before/after dispatch and server-state-unknown settlement; clean admission remains blocked without retaining worker/run locks or deadlocking other work.
5. Saturate queue/bytes/budgets, delay accounting and lose journal acknowledgement. Stable IDs prevent duplicate receipts/charges; completion cannot overtake durability. Crash grading before/after dispatch and during cancellation; recovery makes zero grading calls, while observer resume stays an explicit caller policy.
6. Migrate legacy TypeSafe/disabled and existing harness selections through published owner fixtures; role independence and original provenance survive reload. Export/import/read retained profiles/capabilities/calls with networking disabled, including unknown future versions; no mutation of history, inferred support or hidden inference occurs.
7. Enforce import boundaries: runtime imports no context/grading adapters or screens. Identical bytes in different trial/purpose scopes cannot share grading cache entries; native usage and auxiliary purpose/role never enter competitor invocation accounting.

## Real integration gate

Replace fixtures with real M03 readiness, M04 model/pricing metadata, M10 auxiliary accounting, M11 cross-run leases and M02 retention. Wire M10.2 classification and M12.2 grading through this runtime; verify their unchanged counting, validity, cancellation, sealed-fact and no-recovery-inference obligations. Exercise M07 selection, M12.3 views, M14 registry/CLI parity and M13/M17 offline reporting/archive round trips.

**Pending parent obligations:** real scheduler/consumer/retention integration, deployment-specific TypeSafe/Ollama protocol and model capability evidence, and client/archive gates. Fixture success establishes contract behavior only; it does not certify local hardware support, confidence calibration, grading accuracy or a working benchmark.
