# M10.1 — task-accounting

Parent: [M10 accounting engine](../reference/modules/10-measurements-cost.md#1-engine-component). Requirements: R004, R044, R078–R082, R134, R147, R152, R154, R156–R157. Findings: F02–F06, F07–F08, F19.

Outcome: implement a headless, durably acknowledged task/invocation accounting service with exact cost/time observations. This child is a proposed implementation contract, not evidence that a harness or accounting implementation exists.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap package/test layout, shared RunUid/TrialRef/ResultId/InvocationId, immutable DTO/error/observation schemas, deterministic fixture builders and import-boundary checks. M11.1 engine/client/API and M11.2 events foundations must pass before this child's API/registry integration; neither the scheduler nor real harnesses are entry requirements.

**Bootstrap-published contracts, allowed as injected fixtures:** M04 pricing/billing/rate values; M07 frozen LaunchRecords; M05 InvocationScope/InvocationFact/ExposureProfile and InvocationObservationSink; M08 VerificationObservation/CheckSummary/CheckPhase; M02 result/trial binding reader; M11 durable phase/timeline publisher. Publish M10 receipts/DTOs at Bootstrap before those consumers are implemented. Inject protocols without importing producer adapters; real implementations are a later gate.

## Ownership

Own only these proposed implementation paths:

- `axbenchmark/engine/measurements/domain/observations.py`, `usage.py`, `costs.py`, `currency.py`, `timing.py`, `accounting.py`, `models.py`, `errors.py`, `__init__.py`.
- `axbenchmark/engine/measurements/ports.py` and `application/interfaces.py` for the parent contracts; `application/record_observation.py`, `record_verification.py`, `finalize_task.py`, `invocation_account.py`.
- `axbenchmark/engine/measurements/adapters/json_journal.py`; `axbenchmark/api/measurements.py` shared exact measured/cost/rate/billing/receipt DTO definitions and exports.
- `tests/engine/measurements/test_usage.py`, `test_task_cost.py`, `test_currency.py`, `test_task_time.py`, `test_observation_journal.py`, `test_verification_ack.py`, `test_invocation_account.py`.
- `tests/fixtures/measurements/task_accounting.json` and `tests/engine/measurements/fakes.py` with explicit scopes and failure/late-ack controls.

M10.2 extends interfaces/DTOs additively for aggregation/finalization/query projections, owns RPC/composition and retains the original facts. Coordinate shared contract changes with producer owners. M06 owns ranking gates, M18 owns collector normalization and M02 owns sealed storage. No UI, scheduler or collector code belongs here.

## Interfaces and invariants

Implement M05 `InvocationObservationSink.accept(invocation_id, entry_id, scope, fact) -> ObservationReceipt` and M08 `VerificationObservations.record_verification(observation) -> ObservationReceipt`. A receipt is `{observation_id, payload_digest}` and returns only after the journal's durable acceptance. M05 entry IDs and M08 `verification:<id>:summary` IDs survive retry/recovery.

Validate ResultId→TrialRef binding before acceptance. Reject reused IDs with changed scope/payload as `measurements.observation_conflict`; identical input returns the original receipt without a second charge/event. Task records include invocation/result/trial/task; M08 summaries include phase and artifact task separately from defining task. Labels never identify a record.

Persist pending/durable projections, stable operation IDs and payload digests. Torn/unreadable journal entries produce typed persistence/read errors; never infer a missing final report or overwrite contradictory data. Recovery may finish projection of an accepted fact; it cannot rerun a task or invent an exit.

Fold reports by invocation sequence: latest cumulative total replaces earlier cumulative totals; deltas sum; duplicates count once. Mixed streams with unresolvable overlap stay partial. A final cumulative total is not an extra delta. No terminal report means incomplete coverage; unexposed token categories remain unknown. Cached/input and reasoning/output overlaps are never added twice.

Parse finite decimals exactly and calculate with rational values. Serialize reduced `n/d` as authoritative `MeasuredDTO.exact`; rounded decimal strings are presentation only. Preserve USD calculation and explicit display-currency projection separately, both with coverage and source. Never use floats or 28-digit rounded values for a later calculation.

Reported cost wins for its usage. Missing reported cost may yield a labelled API-equivalent estimate from frozen input/output usage and price currency/rates. Reported zero under subscription/unknown billing is retained as raw evidence but ignored as a charge; estimate where possible. Only complete reported zero with known non-subscription billing is verified zero; local configuration cost belongs to M10.2 energy accounting.

A zero estimate keeps value `0/1`, original estimate basis and `cost_zero_unverified` information. Unknown billing preserves a valid positive amount with `billing_unknown`. Preserve full M04 frozen billing provenance and its declared-by-user label. M06 alone applies positive-cost/lowest-cost eligibility gates.

`per_usd` means currency units per 1 USD: COP `4000`. Price/report/tariff currency converts by division, display by multiplication. Retain source/date/label, including supplied or missing state; no live catalog lookup or historical constant. Missing display rate leaves USD known; missing required price conversion makes the cost unknown.

Benchmark task duration includes tool work, excluding queue/planning/external checks/judging. Interrupted duration ends at the last observed instant and is partial; never-started stays unknown. Planning/judging accounts remain separate; diagnostic verification usage is excluded.

M08 `record_verification` preserves the parent's exact observation shape and phases, and acknowledges independently of optional UI notifications. `CheckSummaries.for_trial(trial, phase)` is the published lookup; no configuration-only fallback. The final drain/finalize state machine is M10.2's ownership.

## Boards and states

No rendering ownership. Supply task fixtures for Measurements, MeasurementsPartial, CostBasis and task-formation panels: pending/no report, complete, partial, unknown/unexposed, declared billing, verified zero, unverified zero, missing rate, conflicting observation and persistence-pending. CurrencyEnergy uses the same exact rate/validation types. Wireframes remain unchanged.

## Acceptance and faults

Run the proposed suite:

```sh
pytest tests/engine/measurements/test_usage.py tests/engine/measurements/test_task_cost.py tests/engine/measurements/test_currency.py tests/engine/measurements/test_task_time.py tests/engine/measurements/test_observation_journal.py tests/engine/measurements/test_verification_ack.py tests/engine/measurements/test_invocation_account.py
```

1. Cumulative 100→200→300→final 300 gives 300; delta 100+200 gives 300. Replay shuffled unique entries, duplicate final and conflicting same-ID entry. Assert exact counts, partial mixed-stream result and no total published for non-final usage.
2. Input 702000 at USD 0.25/M plus output 44000 at USD 0.80/M gives `2107/10000`, displayed 0.21; reasoning 17000 adds no cost. Verify estimate terms/source and absence of cached discount; unexposed categories never become zero.
3. Reported USD 0.5 overrides that estimate. API reported zero with complete coverage is verified; incomplete report is not. Subscription/unknown zero falls back to the estimate; known usage with zero prices gives estimate `0/1`. Unknown billing with USD 0.5 retains it and the limitation.
4. COP 4000/USD converts COP 4000→USD 1→COP 4000; EUR 0.8/USD converts EUR 0.8→USD 1. Missing price rate gives unknown; missing display rate keeps USD 1. Change the fake current catalog and assert frozen calculations remain byte-identical.
5. Trial U/c/1 T1 and U/c/2 T1 have different usage/checks; U/c and V/c may share a label. Require distinct journal keys, phase summaries and exact result binding. Reject mismatched result/trial before any write.
6. Pause durable journal commit and show producer acknowledgement stays pending; fail it and show no success event. Crash after durable acceptance before projection, recover once, retry identical observation and compare the receipt digest. Changed M08 summary bytes fail without erasing original checks.
7. Task durations 1000+2000 ms exclude verification 500 and judging 700; missing exit remains partial at last observation. Separate planning/judging accounts and verification diagnostic scopes contribute zero entries to competitor aggregates, without inventing zero measurements.

## Real integration gate

Use real M05 usage/exit normalization, M07 frozen launch records and M08 durable summaries against this journal. Delay every producer's acknowledgement and verify its owning operation cannot complete first. Exercise at least two trials with distinct T1 facts and the actual supported harness fixture parser; adapter/current-version verification remains M05's obligation.

**Pending parent obligations:** M10.2 trial/energy aggregation, finalization/retention, queries and registered events; M10.3 screens; real M02/M11/M18 completion barrier, M06 zero gates and M13/M17 offline consumers. Passing this child's injected fixtures never establishes sealed/report-ready accounting.
