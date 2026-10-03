# M18.1 — telemetry-domain

Parent: [M18 domain and counter admission](../reference/modules/18-hardware-monitoring.md#1-engine-component). Requirements: R102–R114, R146–R147, R154. Findings: F02, F06, F12; publishes F03 receipt vocabulary.

Outcome: deterministic pure rules preserve optional availability, measured scope and honest energy coverage before any collector or scheduler exists. These are proposed implementation requirements, not sensor test results.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap package/test layout, shared RunUid/TrialRef/ResultId and exact-value contracts, canonical serialization and import-boundary checks. No M11 scheduler, M03 service or sensor is required.

**Bootstrap-published contracts allowed as fixtures:** Capability/Guidance and the single CollectorCause vocabulary for M03; MonitoringChoice for M07; TelemetryFinalizationReceipt/EnergySource values for M10/M11; frozen run/trial windows. Publish these owner contracts early; later implementations cannot replace them with local variants.

## Exact proposed ownership

- `axbenchmark/engine/telemetry/domain/capabilities.py`, `intervals.py`, `samples.py`, `counters.py`, `energy.py`, `sources.py`, `windows.py`, `guidance.py`, `receipts.py`, `errors.py`.
- Pure schema fixtures in `tests/fixtures/telemetry/domain_vectors.json`, `receipt_v1.json`, `same_label_trials.json`.
- `tests/engine/telemetry/domain/test_capabilities.py`, `test_intervals.py`, `test_counters.py`, `test_sources.py`, `test_windows.py`, `test_receipts.py`, `test_guidance.py`.
- Own exports in `axbenchmark/engine/telemetry/domain/__init__.py`; expose only named pure contracts for M03/M07/M10/M02 consumers.

No I/O, asyncio, pydantic, third-party sensor imports, scheduler imports or cost/ranking rules. M18.2 owns ports/application/retention; adapter and UI files belong to later children.

Extend existing measurement/window provenance with decision-resource policy and actual lease/measurement overlap references (DecisionCall/profile/runtime/host/residency, known concurrent work and unknown attribution). Pure telemetry rules preserve experiment/process/window scopes and measured background work; context capture I/O, warm residency or inference can affect them. A local API charge of zero is unrelated to measured host cost. Never subtract an estimated observer energy share or label a contaminated window exclusive/clean.

## Contracts and rules

Implement parent `classify`, `enabled_metrics`, `limitations`, `validate_interval`, `effective_interval`, `counter_delta`, `integrate_power`, `select_sources`, `non_overlapping`, `allocation`, `window_energy`, `downsample` and `guidance_for` signatures exactly.

Monitoring defaults automatic. Only 0.5–10 seconds inclusive are valid, default 1; reject nonfinite/non-numeric inputs, never clamp. Effective interval is max(requested, collector minimum), and observed timing remains separate.

Distinguish all five causes. A found executable is not an available metric; require actual probe evidence. Missing readings are None with cause/coverage, never zero. Unsupported hardware has no installation remedy.

Host raw samples are experiment-scoped RunUid records. Harness/process/windows require explicit TrialRef plus task/invocation where relevant; retained hardware envelopes bind ResultId/TrialRef. Display labels never key data.

CounterSemantics binds documented units/modulus/reset behavior, collector/device continuity evidence, timestamps, gap limit and a defensible maximum energy-rate bound. A configured limit or nearby power sample is not automatically such a bound.

Accept an interval only with increasing same-clock timestamps, affirmative continuity, no reset, supported semantics and a unique plausible delta. For modulo R, enumerate `new-old+kR` within `[0, maximum_rate × elapsed]`; a decrease requires uniquely supported k=1. Range alone never proves wrap.

Reject ambiguous decreases, explicit resets, unknown continuity, excessive gaps and possible multiple wraps; also reject positive increments with those faults. Keep raw endpoints and reasons, start a new baseline, and count no energy for that interval.

Power integration uses adjacent fresh valid samples and actual elapsed time, clipped to the window. Never bridge gaps, reuse a stale sample or extend the last sample. Label all such energy estimated; no covered interval means unavailable, while measured zero remains numeric zero.

Use exact rational energy after unit conversion: J/3600 = Wh and Wh/1000 = kWh. Coverage is the union of accepted intervals divided by window duration; full-scope aggregate coverage is the intersection across summed domains, retaining individual coverage too.

Group candidates by verified physical domain before overlap removal. Prefer usable counters, then power; within a method use greater covered duration, frozen collector preference and lexical ref. Retain every rejected candidate/reason. Never splice counter baselines or sum uncertain aliases.

Then suppress child domains of a usable measured parent. Shared parallel energy stays experiment-only. Jobs=1 enables nonexclusive TrialRef windows with background activity; union nested task windows before deriving totals.

Counter pairs crossing trial boundaries cannot be prorated; preserve uncovered edges unless boundary readings exist. No task/trial window means unavailable. M10 alone prices sequential local-window kWh, preserving scope.

Receipt value schema is exactly the parent's TelemetryFinalizationReceipt; validate canonical digests, UID/trial roster, sorted result rows and explicit complete/partial/unavailable/off state. Runtime durability is M18.2's responsibility.

**Normalized retained telemetry.** M18 supplies typed series/sample/unit/source/scope and exact values with the unchanged TelemetryFinalizationReceipt through M02 ports; M02 owns SQLite hardware rows and evidence references. Live sampling journals remain provisional working state. Shared host series cannot acquire competitor attribution by a SQL join; signed temperatures and unknown coverage must round-trip without float authority or zero filling.

## Integrated requirements

R191 — [authoritative SQLite results and analyses](../RESULTS-DATABASE.md).
R169 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

## Numerical and fault acceptance

**SQLite acceptance:** Round-trip scoped samples, signed/large exact values, gaps and full receipt rows through real M02 SQL/read API/export. Delayed hardware-row acknowledgement keeps close/finalization pending; finalized reads still work after working journals are removed.

Extend existing fixtures for native-only and delayed/partial analysis, explicit local overlap/unknown attribution, distinct decision/harness/human fingerprints and offline or disabled-engine operation as applicable. Assert unchanged scope/digests, no fabricated values/calls, and no reclassification triggered by viewing, export/import or navigation.

Run `pytest tests/engine/telemetry/domain`; fixture units below are joules, monotonic seconds and watts unless stated otherwise.

1. True wrap: same documented continuous epoch, R=1000, maximum rate=100, t=0→1, 950→30. Only delta 80 is plausible; record one wrap, 80 J = 1/45 Wh, coverage 1/1.
2. Known-range reset: same range/bound, 100→10 with reset evidence at t=1 yields no delta, never 910. Add continuous 10→30 at t=2: 20 J = 1/180 Wh, coverage 1/2 and reset event.
3. Unknown-range reset: 100→10 then 10→30 under documented nonwrapping semantics with a new continuous epoch likewise retains only 20 J over the second second; first pair uncovered.
4. Long gap: R=1000, bound=100, 950→30 over 20 s permits 80 and 1080 J even if gap policy allows 20 s; unavailable. A 5 s gap with maximum accepted gap 2 s is uncovered independently. No continuity evidence rejects even the short 950→30 decrease.
5. Duplicate package sources A/B with equal 80 J counter coverage select the frozen priority winner once; 50 J child stays shown/not summed; separate GPU 20 J yields total 100 J = 1/36 Wh. Permuting inputs preserves selection/digest; rejected rows persist.
6. Power 60 W at t=0,1, missing t=2, 60 W at t=3,4 gives 120 J = 1/30 Wh over [0,4], coverage 1/2, estimate true. All missing is None, not zero; covered 0 W remains zero.
7. Same-label runs U/V and two trials each remain separate; jobs=4 returns no window allocation. Window-edge/nested-window fixtures cannot duplicate energy; out-of-order/repeated timestamps or stale source IDs add no covered time.
8. Validate all causes, interval boundaries/nonfinite values, policy tie-breaks, unsupported guides, exact receipt round-trip and cross-run/trial rejection. Property checks keep coverage in [0,1] and forbid overlapping selected domains/sources in totals.

## Boards, integration and pending parent work

No UI owned. Supply fixtures for MonitoringSettings intervals/availability; CollectorGuide five causes; Telemetry gaps/off/none; EnergyDetail wrap/reset/duplicate-source rows; SequentialEnergy repeated trials and background labels.

Real-source counter continuity/modulus/bound claims require versioned official documentation and supported-host evidence in M18.3–4. A synthetic wrap vector proves arithmetic only.

**Pending parent obligations:** durable sampling/close and M02/M10 barrier (M18.2), supported macOS/Linux collectors/guides (M18.3–4), screens/CSV consumer flows (M18.5), actual M11 recovery and retained/report/ZIP agreement.
