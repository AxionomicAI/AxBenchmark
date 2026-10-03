# M10.1 — task-accounting

Parent: [M10 accounting engine](../reference/modules/10-measurements-cost.md#1-engine-component). Requirements: R004, R044, R078–R082, R134, R147, R152, R154, R156–R157. Findings: F02–F06, F07–F08, F19.

Outcome: implement a headless, durably acknowledged task/invocation accounting service with exact cost/time observations. This child is a proposed implementation contract, not evidence that a harness or accounting implementation exists.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap package/test layout, shared RunUid/TrialRef/ResultId/InvocationId, immutable DTO/error/observation schemas, deterministic fixture builders and import-boundary checks. M11.1 engine/client/API and M11.2 events foundations must pass before this child's API/registry integration; neither the scheduler nor real harnesses are entry requirements.

**Bootstrap-published contracts, allowed as injected fixtures:** M04 pricing/billing/rate values; M07 frozen LaunchRecords; M05 InvocationScope/InvocationFact/ExposureProfile and InvocationObservationSink; M08 VerificationObservation/CheckSummary/CheckPhase; M02 result/trial binding reader; M11 durable phase/timeline publisher. Publish M10 receipts/DTOs at Bootstrap before those consumers are implemented. Inject protocols without importing producer adapters; real implementations are a later gate.

## Ownership

Own only these proposed implementation paths:

- `axbenchmark/engine/measurements/domain/observations.py`, `usage.py`, `costs.py`, `currency.py`, `timing.py`, `throughput.py`, `request_observations.py`, `accounting.py`, `models.py`, `errors.py`, `__init__.py`.
- `axbenchmark/engine/measurements/ports.py` and `application/interfaces.py` for the parent contracts; `application/record_observation.py`, `record_verification.py`, `finalize_task.py`, `invocation_account.py`.
- `axbenchmark/engine/measurements/adapters/json_journal.py`; `axbenchmark/api/measurements.py` shared exact measured/cost/rate/billing/receipt DTO definitions and exports.
- `tests/engine/measurements/test_usage.py`, `test_task_cost.py`, `test_currency.py`, `test_task_time.py`, `test_observation_journal.py`, `test_verification_ack.py`, `test_invocation_account.py`, `test_throughput.py`; shared `tests/fixtures/measurements/statistics.json`.
- `tests/fixtures/measurements/task_accounting.json` and `tests/engine/measurements/fakes.py` with explicit scopes and failure/late-ack controls.

M10.2 extends interfaces/DTOs additively for aggregation/finalization/query projections, owns RPC/composition and retains the original facts. Coordinate shared contract changes with producer owners. M06 owns ranking gates, M18 owns collector normalization and M02 owns sealed storage. No UI, scheduler or collector code belongs here.

Own `domain/context.py`, `context_tokens.py`, `context_classification.py`, `application/record_context.py`, `adapters/context_journal.py`, shared ports/DTOs and `test_context_tokens.py`/`test_context_receipts.py`. Implement `ContextCaptureSink.accept(observation) -> ContextCaptureReceipt` and `.close(scope, cutoff, operation_id) -> ContextClosureReceipt`; acknowledge durable journal acceptance, reject same-ID changed payload/scope, and bind closure to all accepted ranges/gaps with complete/partial/unavailable/off status.

Publish separate context identity/evidence sections: full result/TrialRef/task/invocation/session/agent/window/request/phase; classification native source plus optional analysis; count nullable integer, scope/method/fidelity/tokenizer/framing/basis/coverage; membership included/excluded/unknown with native evidence. Eleven fixed labels use `context-labels/1`; thinking and thinking_summary differ. Exact partitions require complete framed input token positions mapped once; crossing/unmapped positions stay unattributed. Text-only estimates never become exact, arithmetic residuals never invent categories, native totals do not imply complete partition, and unknown hidden reasoning remains null. Current-window snapshots, observed history and billed traffic are distinct. Persist sanitized evidence only, with original-versus-redacted count basis and no credential-bearing token IDs.

**Retained storage boundary.** Durable observation journals/checkpoints remain producer working state. M02 SQLite is the authoritative retained mapping for exact call counters/timing pairs/rosters, statistics, prices/costs, source inventory, context identities/labels/counts/membership and purpose-separated auxiliary accounts. Map native/adapter-synthetic scope explicitly; context classification cannot become traffic. `append_measurements`/context/evidence operations await M02 receipts; finalized readers never fall back to journal JSON. Alternative measurement projections are pure; an M06/M13 wrapper may retain their containing derived analysis without editing execution facts.

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

**Frozen domain contract.** Add parent VerificationAuxiliaryObservation codec and VerificationObservations.record_auxiliary to the existing durable observation journal/receipt protocol. Preserve stable evaluation/attempt/verification/check/case/ResultId/TrialRef/plan/final-artifact identity, source/mode and known/partial/unknown product usage/cost/time. Product evaluation observations never enter InvocationObservationSink competitor request rosters or become DecisionCall receipts; replay retains observation identity and no fresh charge.

## Boards and states

No rendering ownership. Supply task fixtures for Measurements, MeasurementsPartial, CostBasis and task-formation panels: pending/no report, complete, partial, unknown/unexposed, declared billing, verified zero, unverified zero, missing rate, conflicting observation and persistence-pending. CurrencyEnergy uses the same exact rate/validation types. Wireframes remain unchanged.

Implement the parent's [canonical request observations](../reference/modules/10-measurements-cost.md#canonical-request-observations) in the owned pure `request_observations.py`: `RequestFactScope`, `RequestKey`, `GenerationTimingObserved`, `RequestRosterObserved`. `InvocationObservationSink.accept` consumes all four M05 `InvocationFact` variants; both API codecs preserve exact rational timestamps/durations, usage IDs, source clocks, normalized token policy and scoped roster evidence. Request classes import only shared identities/exact values, so M05 may use this vocabulary without a provider dependency cycle.

`throughput.py` pairs normalized acknowledged request output with its own positive compatible generation duration. Sum matched output N and durations D (including concurrent intervals) and return N/D with exact `Fraction`; retain pairs, N/D, per-basis rows, coverage and typed limitations in `GenerationAggregate`/`M10Statistic`. Whole-scope known requires a closed complete invocation-and-descendants roster; otherwise only the matched subset is numeric. Never divide full output by partial timing, average rates, union intervals or substitute process/tool/first-token time. Proven zero output requires positive matching D; missing D is unknown.

Resolve parent cumulative/request overlap once before pairing and totals; cached/reasoning inclusion semantics are explicit and missing detail is null independently from its known parent. Current-context estimates/labels cannot supply native traffic. Planning, human waiting, grading, observer, probe and external verification accounts never enter competitor counts or throughput; the competitor's own nested requests and tool work retain their normal scope.

**Route, comparison and profile interfaces.** Extend usage/cost source metadata with exact route/account/model/deployment/tier price scope, correlated request/attempt IDs, ordered hop refs, charge owner and inclusive-versus-additional charge basis. In the existing reducer, gateway and upstream reports of one charge are alternatives; a separately evidenced gateway fee adds once. Distinct retry/helper/discarded-response attempts remain counted even when route matching fails; unknown roster/charge coverage stays partial. Local gateway placement does not determine Billing.LOCAL or generation timing. Add `RouteQualificationObservations.record(observation: RouteQualificationObservationV1) -> ObservationReceipt` in existing auxiliary-accounting adapters: diagnostic JobId/VerificationScope/invocation/request/attempt/plan digest, verification role, measured bounds and settlement linkage; no ResultId/TrialRef/DecisionCallId required. The receipt acknowledges durable measured evidence before M03 settles the resource lease.

## Integrated requirements

R192, R193 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R191 — [authoritative SQLite results and analyses](../RESULTS-DATABASE.md).
R189 — [human review](../M12/05-human-review-web.md).

R187 — frozen domain profile/evidence contracts: [R187](../quality-judges/AGENTIC.md).

R173, R176 — [benchmark statistics](../BENCHMARK-STATISTICS.md).

R161, R162, R163, R164, R171 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

R181, R182 — [benchmark modes](../BENCHMARK-MODES.md); [Cursor](../M05/08-cursor-adapter.md) and [OpenCode](../M05/09-opencode-adapter.md) registry contracts.

Extend this child's producer/retention fixtures to Cursor and generation-qualified OpenCode using the same six-registry observation contracts. Keep unexposed native usage, currency, output-generation timing and request membership unknown; neither CLI terminal duration nor a registry entry proves measurement support. Preserve scope/deduplication/receipt behavior and full frozen trial rosters for both new adapters. Add one-shot versus multi-step accounting cases without changing arithmetic: synthetic baseline Git setup precedes competitor timing, task commits made during an invocation remain within task time, and mandatory protocol verification stays a separate verification phase. No extra task or model call is charged for a commit failure.

**Human accounting acceptance:** Human wait/edit/save/submit timestamps are separately labelled M12 lifecycle observations with incomplete-observation limits. Model usage/API charge is not applicable and labor/host cost is unmeasured; do not manufacture an InvocationId, DecisionCallId, zero-price receipt or auxiliary inference account. Keep every competitor elapsed/token/cost/Gen/Files/LOC value and sealed measurement receipt unchanged across pending human wait, restart, submit and skip. Test those transitions while an unrelated automated run proceeds; measurement/detail views remain inspectable without opening the anonymous form.

## Acceptance and faults

**Route/profile acceptance:** Fixtures combine inclusive gateway amount, duplicate upstream receipt, independent fee, helper attempt and discarded retry; charge each exactly once with native currency/unknown price preserved. Test loopback remote inference and unknown locality, diagnostic accounting with no benchmark result and failed persistence blocking settlement acknowledgment.

**SQLite acceptance:** Round-trip exact producer values through real SQLite and current codecs after deleting working journals. Independent unknown detail/LOC states, signed hardware values and eleven context labels survive; delayed row/outbox acknowledgement blocks seal, and retry never double-counts accepted usage.

**Domain acceptance:** Retry identical auxiliary observations once, reject conflicting/cross-trial IDs and preserve partial/unknown values. Same-server product calls leave competitor paired usage/time/Gen tok/s unchanged; delayed auxiliary writes prevent M08 completion without changing existing arithmetic.

Run `pytest tests/engine/measurements/test_throughput.py` with the existing suite. Fixture pairs 100/2 and 300/3 yield exactly 80 (not 75), even overlapping; add untimed output 200 and retain matched 400/5 while whole throughput is partial, never 600/5. Cover exact fractional seconds, zero output/positive time, nonpositive/nonfinite clocks, mixed bases, terminal roster gaps, forward usage refs, parent/detail overlap, retries and auxiliary same-server calls. Delay timing/roster durability and assert acceptance/finalization cannot overtake it.

Run context token/receipt fixtures for nonadditive chunks, repeated positions versus repeated text, cache/reasoning overlap, boundary-crossing tokens, native total with unknown categories, scoped nested agents/windows, redaction and known-zero versus unknown. Delay closure/journal acknowledgement and verify durable idempotence without waiting for classification.

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
