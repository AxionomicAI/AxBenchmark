# M10.2 — final-accounting

Parent: [M10 accounting engine/API](../../10-measurements-cost.md#1-engine-component). Requirements: R004, R077–R082, R096, R110, R114, R122, R134, R147, R153–R156. Findings: F02–F08, F12, F19.

Outcome: produce exact trial/energy projections and durably finalize all competitor accounting before M02 seals. This child owns the headless query API and is the single cost/time aggregation implementation consumed by rankings/results/reports.

## Entry conditions

**Completed implementation prerequisites:** [M10.1](01-task-accounting.md), [M02.2 retention services](../M02/02-retention-services.md), M18.1 telemetry-domain child from the [hardware parent](../../18-hardware-monitoring.md), Bootstrap and M11.1–M11.2 client/event foundations. Require their storage, exact-value, normalization and registry tests before integration here.

**Bootstrap-published contracts, allowed as injected fixtures:** M07 LaunchRecords; M08 CheckSummaries; M11 RunTimeline/supervision; M18 EnergySource/ExperimentTelemetry close receipt; M06 consumer DTO/gate interfaces. M18's real collector service and M11 scheduler/recovery are later integration gates, not circular prerequisites. M02's recorder/reader are real for this child's retention tests.

## Ownership

Own proposed files:

- `axbenchmark/engine/measurements/domain/aggregates.py`, `trials.py`, `energy.py`, `finalization.py` (receipt validation consumes M18's published type; no local replacement schema).
- `axbenchmark/engine/measurements/application/drain.py`, `finalize_run.py`, `reconcile.py`, `result_queries.py`, `cost_analysis.py`, `accounting_queries.py`; additive aggregation/finalizer members in `application/interfaces.py` and `ports.py`.
- `axbenchmark/engine/measurements/adapters/results.py`, `launch_facts.py`, `timeline.py`, `checks.py`, `energy.py`, `current_rates.py`, `event_wiring.py`, `rpc.py`.
- Add query/summary/finalization DTOs in `axbenchmark/api/measurements.py`; M10 method/event/topic registrations only in `axbenchmark/api/registry.py` and `axbenchmark/engine/daemon/composition.py`, coordinated with M11.
- `tests/engine/measurements/test_aggregates.py`, `test_trials.py`, `test_energy.py`, `test_finalization.py`, `test_finalization_recovery.py`, `test_retained_queries.py`; `tests/api/test_measurements.py`, `tests/integration/test_measurement_retention.py`.
- `tests/fixtures/measurements/final_accounting.json` for exact expected values, receipts/digests, same-label runs and trial/energy/currency cases.

Do not implement M18 counter collectors, M11 scheduling, M02 sealing or M06 eligibility. Finalizer requests durable writes/receipt from M02; the supervisor invokes sealing separately. M10.3 owns rendering.

## Interfaces and invariants

Implement `MeasurementFinalizer.drain_run(run_uid)` and `.finalize_run(run_uid, telemetry_receipt, terminal_cause)` exactly. Publish `CostAnalysis.display_currency_for(pinned_runs) -> DisplayCurrencyDTO`, `.ranking_cost(EffectiveResult, tariff, display_currency=None) -> CostObservation`, and `MeasurementReader.trial_summary(TrialGroup, tariff, display_currency=None) -> TrialSummary`.

Pinned cost/trial analysis is pure: consume the caller's M02 publication-view records/overlays, never reload the live journal. Internal display override permits only the USD mixed-currency choice from `display_currency_for`; public analysis schemas forbid currency/rates. Return the parent's full CostDTO/MeasuredDTO/RateUseDTO/BillingDTO for every mean/min/max and reference minimum; exact `n/d` survives all boundaries.

Use `(run_uid, configuration_id)` plus frozen trial count, preserving missing indices and explicit TrialRefs. Sum task values with coverage; trial means/min/max become unknown if any expected trial is unknown/missing, partial if any is partial. Never drop a trial or blend same-label runs. Preserve contributor evidence when basis/price/rate provenance differs.

Unknown billing preserves valid positive aggregates with the limitation. Numeric zero estimates retain their original basis and `cost_zero_unverified`; only all-verified-zero tasks/trials yield verified-zero aggregates. M06 owns the final gate, including exclusion of a subject whose one trial is zero-unverified even if mean cost is positive.

Price kWh × tariff using frozen rates. Sequential local endpoints use only their own closed TrialRef window; parallel experiment energy stays separate. Preserve actual measured domains, includes-background, source/coverage and no-tariff/no-energy/no-rate limitations. Accept M18's deduplicated coverage; do not turn a known-range reset or an ambiguous gap into a wrap/complete value.

Import M18's exact published `TelemetryFinalizationReceipt` from [its ports contract](../../18-hardware-monitoring.md#ports-enginetelemetryportspy). Retain it complete and unchanged as `MeasurementSet.energy_evidence.telemetry_receipt`: schema version, run/collection IDs, input/collection/windows digests, full cutoff (wall time, monotonic offset, clock epoch, optional last persisted sample), status/limitations and every sorted result/trial/hardware-digest/operation-ID row. Do not reconstruct a local receipt or keep only the current trial's row. Off/unavailable receipts still name every expected trial and preserve unknown energy.

Implement the parent's read queries through both clients. Current cached rates are allowed only for prelaunch accounting preview; alternatives derive from retained kWh/frozen rates and never write. Finalized local/imported views use M02 original facts; live journal values are explicitly provisional.

## Awaited barrier and recovery

1. M11 joins/cancels M05/M08 producers and their evidence/receipt work, then awaits `drain_run`; all accepted usage/exit/check/execution-phase work must settle.
2. M11 awaits M18 `ExperimentTelemetry.close(run_uid)`. Pin its closed-source evidence/M02 HardwareSamples, validate matching schema/run/collection, frozen roster and every ResultId↔TrialRef binding, and match `input_digest`, `collection_digest`, `windows_digest`, cutoff/source policy and each `hardware_digest` using M18's canonical digest definition. Require stable row operation IDs `telemetry:<run_uid>:<result_id>:hardware:v1`, including reused sealed rows. Any mismatch fails before pricing/final append/receipt; live sources and host preview cannot satisfy validation.
3. `finalize_run` drains again and atomically freezes its input/cutoff digest. Build one MeasurementSet for each unsealed expected trial using frozen billing/pricing/rates, task/check/time/source evidence, original tariff/energy/coverage and the complete unchanged M18 receipt in `energy_evidence.telemetry_receipt`.
4. Await M02 evidence attachments and `append_measurements(rid, set, operation_id)` with stable IDs, then `finalization_receipt(run_uid, rids)`. Persist the returned receipt before resolving the finalizer call. M11 may then seal; this child never seals or publishes terminal run state.
5. Recovery retries the exact durable journal/checkpoint operation. Reuse the pending checkpoint's original cause/input digest; later run interruption is separate lifecycle/status evidence. Same ID/payload is a no-op; changed input is a conflict. A failure keeps finalization and export/report readiness pending. Already sealed trials retain existing receipts and skip writes; incomplete multi-result sealing resumes safely.

Stop, invalidation, shutdown and startup interruption follow the same sequence; partial/unknown data never becomes complete. New observations beyond cutoff fail as finalized, identical acknowledged retries deduplicate. Post-seal judging cost/time is separate invocation/run-lifecycle data and never changes the execution measurement receipt.

Consume exact singular `run.phase.started`, `run.phase.finished`, `run.state.changed`; ended is a timing notification, never an energy/accounting trigger. M11's phase persistence/handler is awaited; required accounting never travels on a client queue. Publish revisioned events on bare topic `measurements`, with M11's typed cursor/snapshot/resync rules.

## Boards and supplied states

Supply all responses for Measurements, MeasurementsPartial, TimingPhases, CostBasis and CurrencyEnergy: complete/partial/unknown, no observations, provisional, finalization pending/error, frozen/alternative tariff, declared billing, missing rate, mixed currency and exact-zero basis. No screen files or wireframes are changed here.

## Acceptance and faults

Run the proposed suite:

```sh
pytest tests/engine/measurements tests/api/test_measurements.py tests/integration/test_measurement_retention.py
```

1. Costs 1,2,2 produce exact mean `5/3`, min 1, max 2 with complete DTOs; one partial makes summary partial, one unknown/missing makes mean/ranges unknown. Distinct U/c and V/c keep separate means even with matching run labels/configuration IDs.
2. COP 4000/USD, 0.5 kWh and 800 COP/kWh give USD `1/10`; alternative 1000 gives `1/8` with unchanged retained digests. Parallel/local remains unknown; provider cost receives no energy addition. Zero energy is `0/1` energy estimate, never verified zero.
3. A known-range reset from 100→10 supplied as an uncovered M18 interval is not 910 energy units here; preserve partial coverage. Duplicate physical-domain sources already resolved by M18 cannot be charged again. Missing EUR tariff/display rates stay unknown in only the affected projections.
4. Freeze COP/EUR runs with different source dates and declared billing; shared-currency views use each run's rate, mixed views use USD plus notice. Costs/order stay exact and DTO metadata survives every trial mean/min/max. No arbitrary display override is accepted.
5. Block each usage/check acknowledgement, timeline commit, telemetry close, evidence append, measurement append and finalization receipt in turn; assert M02 cannot seal and export/report readiness stays false. Inject stop and interruption at each point without manufacturing absent values.
6. Crash after every durable write and after one of two result seals. Recover and compare receipts/digests; same bytes deduplicate, changed observation/receipt/finalizer inputs fail. Late new facts cannot append after seal. A stop during judging leaves previously sealed facts unchanged.
7. Query immediately after finalization, export/import and compare original measurements/energy/billing/rates/exact means and the complete unchanged M18 receipt through real M02 readers. Corrupt a retained record and assert typed failure, never reconstruction from working state/current catalog. Mutate each source digest, selected-source payload, cutoff/clock epoch, stable hardware operation ID and run/trial/result binding in turn; expect `measurements.telemetry_receipt_mismatch` with no final append/receipt. Test missing/duplicate/extra rows, off/unavailable full-roster receipts and previously sealed rows with zero new fact writes.
8. Registry rejects plural run events and event-name topics; client snapshot race, lower-sequence new epoch and overflow retain latest projections. API schemas round-trip reduced rationals/errors and reject analysis currency/rates while prelaunch validation accepts display currency.

## Real integration and pending parent work

Compose real M05/M07/M08/M11 scheduler/recovery and M18 collector closure with M02/M10. Complete sequential and parallel repeated-trial runs, then delayed-output stop/interruption; immediately export via M17 and report via M13 after readiness. Compare retained/live/imported/report facts and the unchanged M18 receipt, verify closed-source digests and prove no post-seal append. Test actual M06 zero gates and USD score/order invariance across display currencies.

Real macOS/Linux energy source/reset behavior and current harness/rate-source support require owner verification; fixture normalization is not platform certification. **Pending parent obligations:** M10.3 screens, M14 CLI, M15 navigation and all real M06/M13/M17 consumer gates. A headless fake telemetry run cannot complete M10.
