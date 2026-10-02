# M18.2 — sampling-lifecycle

Parent: [M18 lifecycle and ports](../../18-hardware-monitoring.md#1-engine-component). Requirements: R102–R114, R134, R146–R147, R154. Findings: F02, F03, F06, F12.

Outcome: one collection per experiment, shared collector resources, explicit trial/process observations and a durable close receipt that M10 consumes before M02 seals.

## Entry conditions

**Completed prerequisites:** Bootstrap, [M18.1](01-telemetry-domain.md), [M02.2 retention services](../M02/02-retention-services.md), M11.1 engine/client and M11.2 jobs/events foundations. Real M02 append/idempotency and real client/registry tests must pass before retention acceptance.

**Published contracts allowed as fixtures:** M11 RunContext configuration/scheduling/TrialRef windows and frozen roster/cutoff; M05 TaskScope/InvocationId lifecycle; M07 MonitoringChoice; M10 MeasurementReader/Finalizer. M11.3–4 scheduler/recovery and real collectors are integration gates, not circular entry dependencies.

## Exact proposed ownership

- `axbenchmark/engine/telemetry/ports.py`, `application/interfaces.py`, `detect.py`, `monitoring.py`, `sampler.py`, `process_tracking.py`, `open.py`, `close.py`, `reconcile.py`, `queries.py`, `export_csv.py`.
- `axbenchmark/engine/telemetry/adapters/jsonl_store.py`, `run_context.py`, `results_bridge.py`, `energy_costs.py`, `csv_sink.py`, `rpc.py`, `subprocess_allowlist.py`, `platform_host.py`, `packaged_guides.py`, `psutil_collector.py` (registration dispatcher only).
- `axbenchmark/api/telemetry.py`; M18 method/event/topic registrations and composition hook, coordinated with M11's registry/composition owner.
- `tests/engine/telemetry/test_sampler.py`, `test_process_tracking.py`, `test_close.py`, `test_recovery.py`, `test_store.py`, `test_queries.py`, `test_csv.py`; `tests/api/test_telemetry.py`.
- `tests/integration/test_telemetry_retention.py`; `tests/fixtures/telemetry/scripted_sources.py`, `lifecycle_checkpoints.py`, `capabilities.json`.

M18.3/4 supply collector implementations and guide entries, not separate schedulers. M10 owns tariffs/billing/accounting and M11 owns terminal cause/seal. M18.5 owns screens.

## Concrete ports and state

Implement parent CollectorProbe/SampleSource/ProcessTreeReader, HostInfo, GuideCatalog, TelemetryStore and CsvSink ports. Publish CollectorCapabilities, MonitoringOptions, ExperimentTelemetry, ProcessTracking, EnergySource and TelemetryDescriber exactly.

`ExperimentTelemetry.open(run_uid, choice)` follows complete result binding. Persist RunUid/TrialRef roster and frozen mode/interval/semantics/source policy, including off and no-collector cases. Identical open joins; changed binding/choice or reopening recovered/closed runs fails.

HostSampler schedules by RunUid/collection/collector; concurrent configurations share one run collection. Different runs share source leases, never result identity. A due read can serve both while retaining its source sample ID/timestamp and each run's actual schedule.

Record requested, effective and observed intervals separately. Streaming reconfiguration records continuity changes; repeated/stale latest readings cannot create new coverage. Missed ticks/read errors persist explicit gaps. One run closing does not terminate another run's source.

`ProcessTracking.started(TaskScope, InvocationId, pid, pgid, process_start)` and `.exited(TaskScope, InvocationId)` are awaited idempotent handoffs; M05 wiring is a required integration gate. Guard PID reuse, disappearing processes and denied members; retain partial observations rather than invented group totals.

External local listeners remain run-scoped separate-server rows; cloud entries describe the client. Neither process CPU time nor RSS can allocate shared device energy. Client detach or topic overflow cannot stop collection or lose required handoffs.

Persist the parent's collection/samples/processes/close/summary files with operation IDs, durable acknowledgements and atomic checkpoint/receipt replacement. Corrupt acknowledged batches fail as typed persistence errors; an unacknowledged torn tail is retained as a gap/recovery limitation.

## Close, finalization and recovery

1. M11 joins task/check producers, then awaits M10 drain_run. Close takes this run's lifecycle lock, removes only its schedules and joins accepted in-flight reads.
2. Flush accepted samples/gaps; fix durable execution windows/cutoff, frozen launch/roster, derivation policy and input digest once in TelemetryCloseCheckpoint. Subsequent calls load it, never recalculate inputs from newer lifecycle state.
3. Derive exact observations using M18.1 source selection before overlap filtering, then explicit sequential TrialRef windows. Unavailable/off retains reasons and complete trial envelope roster without zero energy.
4. Await M02 attach_evidence and append_hardware_samples(rid, payload, operation_id) for every unsealed trial. Use stable `telemetry:<run_uid>:<result_id>:hardware:v1` IDs; same payload deduplicates, changed payload conflicts. Reuse prior rows for sealed results.
5. Persist the exact parent TelemetryFinalizationReceipt and summary before returning/publishing finished. Receipt rows bind result/trial/hardware digests; collection/windows/input digests bind the underlying evidence.
6. M11 passes that receipt to M10 finalize_run with the original checkpoint cause; M10 retains the exact receipt in MeasurementSet energy evidence, then M11 seals through M02. No ended event or UI queue triggers required writes. Storage failure stays retention_pending, blocking seal/readiness.

Startup reconciliation closes orphan source resources; after M11 restores binding/windows it calls the same close using persisted samples/gaps only. Last persisted sample bounds coverage; the uncovered tail remains visible. Never probe, resume sensing, open a collection or launch work for a lost run.

Existing close/finalizer checkpoints retain original digest/cause/receipt/IDs after a later stop or engine loss; the newer lifecycle cause is separate. Concurrent close joins; all retries return identical receipts. No post-seal hardware/measurement append is permitted.

## API, boards and acceptance

Implement the parent's telemetry.capabilities/guidance/experiment/energy/windows queries, detect job and export_csv command through both clients. Register bare telemetry and run:<run_uid> topics with shared revisions/cursors; publish only durable state.

Finalized local/imported queries use M02 exclusively; active views are provisional. Export missing CSV cells as empty with reasons, exact units/scope/source/trial IDs and safe overwrite behavior. Currency estimates pass through M10 unchanged.

No UI files. Supply MonitoringSettings/CollectorGuide, Telemetry collected/off/none/partial/pending/error, EnergyDetail rejected/reset/gap and SequentialEnergy repeated-trial fixtures; parallel windows capability remains disabled with its engine reason.

Run `pytest tests/engine/telemetry/test_sampler.py tests/engine/telemetry/test_process_tracking.py tests/engine/telemetry/test_close.py tests/engine/telemetry/test_recovery.py tests/engine/telemetry/test_store.py tests/engine/telemetry/test_queries.py tests/engine/telemetry/test_csv.py tests/api/test_telemetry.py tests/integration/test_telemetry_retention.py`.

1. Two configurations make one read/tick; overlapping U/V runs at 1/2 s share a source but never scopes. Closing U leaves V live; requested 0.5 with minimum 2 records both plus observed jitter.
2. Two trials with reused pid/task labels stay distinct by TrialRef/InvocationId/start identity. A denied member gives partial data; external server/cloud labels survive export/import.
3. Delay source reads, M02 evidence/append and receipt persistence independently; close and M10/seal cannot overtake them. Sensor crash yields unavailable/partial receipt; storage failure returns typed pending error, not successful unavailable.
4. Crash after every append/checkpoint/receipt and between result seals; recover exact operation IDs/digests and no new source open. Retry completed cause after later engine_lost without changing finalizer inputs. Changed payload under the same operation ID conflicts.
5. Apply M18.1 100→10 known-range reset and duplicate-source vectors through actual retention: no 910 J, no doubled energy. Delayed M10 finalizer and immediate M13/M17 queries cannot observe falsely ready results.
6. Validate off/no-tool/no-energy, CSV nulls/conflicts, torn-tail/corrupt persisted state, shared snapshot races/resync/epoch change and disconnect. None causes automatic collection restart or post-seal writes.

**Real integration gate:** compose real M02/M05/M07/M10/M11.3–4 with M18.3/4 on supported hosts; sequential and parallel repeated trials, stop/shutdown/engine-loss, immediate retained/report/ZIP agreement. Fixture collectors do not establish hardware support.

**Pending parent obligations:** platform collectors/guides, screen navigation, M03 doctor/M14 CLI parity, M13/M17 consumers and real supported-host/finalization evidence above.
