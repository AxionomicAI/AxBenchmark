# M18 — Optional CPU and GPU monitoring

Status: proposed module contract derived from [SPEC.md](../SPEC.md). This describes required behavior, not implemented functionality. Requirement IDs refer to [source traceability](TRACEABILITY.md).

## Delivery slices

| Child | Bounded implementation | Completed prerequisites beyond Bootstrap |
|---|---|---|
| [M18.1 telemetry-domain](implementation/M18/01-telemetry-domain.md) | Pure capabilities, intervals, counter/coverage/source and window rules; F02/F06/F12 | None; publish this vocabulary early for M03/M07/M10 |
| [M18.2 sampling-lifecycle](implementation/M18/02-sampling-lifecycle.md) | Shared collection, scoped persistence/API and awaited close receipt; F03 | M18.1, M02.2, M11.1–2 |
| [M18.3 macos-collectors](implementation/M18/03-macos-collectors.md) | psutil/macmon/powermetrics adapters and verified guides | M18.2 |
| [M18.4 linux-collectors](implementation/M18/04-linux-collectors.md) | Linux psutil/RAPL/NVIDIA/AMD adapters and verified guides | M18.2 |
| [M18.5 telemetry-screens](implementation/M18/05-telemetry-screens.md) | Monitoring, telemetry, energy/windows and cross-owner guidance/CSV flows | M18.3–4, M10.2, M15.1–2 |

These are implementation prerequisites, not completed software. Bootstrap publishes M18 domain/receipt contracts and M11 RunContext/M05 process-event/M02 recorder fixtures. M18.1 requires no scheduler; M18.2 injects RunContext before the real M11.3–4 integration gate, avoiding a scheduler cycle. Parent completion also requires supported-host evidence and M03/M07/M10/M13/M14/M17 integration; fixture tests alone cannot establish sensor support.

## Purpose and boundaries

Engineers implementing M18 must enable optional local hardware measurements without making a sensor a prerequisite for benchmarking. Monitoring defaults to automatic detection and may be disabled. Collect available CPU/GPU utilization, memory, power, energy, and temperature information only when compatible tools, hardware, and permissions permit it. A machine with no usable collectors remains able to benchmark. [R013, R102, R146]

M18 discovers telemetry capabilities, collects samples, derives appropriately scoped energy observations, and supplies their limitations to results consumers. It does not determine task success or allocate shared electricity usage to competing configurations. [R106, R109, R114, R147]

## Conceptual data and operations

The following contracts describe information that must survive collection and presentation. The engine structure that holds them is fixed by [the architecture decision](ARCHITECTURE.md) and the Implementation section below; storage classes are not part of the product contract.

| Concept | Required information and behavior |
|---|---|
| Capability observation | Collector identity and version, observed hardware capabilities, available metrics, and the specific reason a metric is unavailable. Detection must establish support before enabling a metric. [R103, R104] |
| Telemetry sample | Timestamp, device/domain identity, units, source, scope, value where available, and coverage. Preserve source-specific metric definitions and uncertainty. [R106, R113] |
| Process observation | Observable CPU time and memory attributable to a harness process tree, with its process association distinguished from host/device measurements. [R107, R108] |
| Energy observation | Measured counter delta or estimated integration of power, its device/domain and time window, source, units, and coverage limitations. [R106, R112, R113] |
| Electricity estimate | Optional tariff-based estimate retaining the energy observation's scope and uncertainty, clearly separated from provider cost. Only a sequential run's per-configuration window energy can become a configuration's cost, and only through [M10](10-measurements-cost.md)'s rules. [R110, R114] |

Operations comprise detecting or rechecking capabilities, honoring monitoring disablement, collecting samples, associating observations with execution windows, deriving energy, and publishing samples and limitations. Collect host telemetry once per experiment; concurrent configurations consume that experiment's observations rather than creating duplicate host collections. The sampling interval is a run-configuration setting from 0.5 to 10 seconds, default one second, frozen at launch; other values are rejected, and it is not part of the template identity. A collector that cannot sample that fast samples at its own minimum interval. Each collector's actual interval is recorded and shown, never presented as the requested one. Sampling and collector failures must not stop execution. Missing and partial data remain visibly unavailable or partial, never complete or zero. [R102, R106, R110, R112, R147]

## Discovery, guidance, and failure states

The Environment view and doctor must distinguish five unavailability conditions: a missing tool, insufficient permissions, missing drivers or kernel interfaces, unsupported hardware, and a collector failure. An unavailable metric must carry the applicable explanation; a single generic “monitoring unavailable” message cannot replace those distinctions. Users can continue while these limitations remain visible. [R103, R146]

Candidate sources are psutil for process/host telemetry, macmon or powermetrics on compatible Macs, powercap/RAPL counters on Linux, and NVIDIA or AMD vendor tools on supported GPUs. These are candidates, not guaranteed capabilities. Probe actual hardware support and collector versions before enabling measurements. Finding or installing a utility does not establish that a sensor exists or that the hardware can expose it. [R104]

For macOS and Linux, provide appropriate installation or setup guidance, supporting documentation, and a recheck action. AxBenchmark must not automatically install tools or change system permissions. Guidance must use verified platform-specific instructions rather than assume a package command works across Linux distributions. [R103, R105]

Future Apple Silicon guidance must retain the [macmon documentation](https://github.com/vladkens/macmon) reference for installation and JSON telemetry support. Relevant Linux guidance must reference [powercap documentation](https://cdn.kernel.org/doc/html/latest/power/powercap/powercap.html), [NVIDIA SMI documentation](https://docs.nvidia.com/deploy/nvidia-smi/), or [AMD SMI documentation](https://rocm.docs.amd.com/projects/amdsmi/en/latest/how-to/amdsmi-cli-tool.html), according to the detected platform and candidate source. These references do not promise support on any particular machine. [R104, R105]

## Attribution and energy invariants

Attribute process-tree CPU time and memory where observable. A separately running model server must not be assumed to belong to a harness process tree. Preserve the distinction between this attribution and host-wide, CPU-package, GPU, or SoC readings, labeling each by its actual scope. For cloud configurations, local telemetry describes the client machine; it cannot describe the provider's inference hardware. [R107, R108, R111]

Parallel execution remains the default. Shared-device energy belongs to the experiment and must not be divided among concurrent harnesses. Sequential execution permits displaying energy observed during each configuration's execution windows (per trial when a configuration runs several), and supplying it with its scope and coverage to [M10](10-measurements-cost.md), but the display must explicitly include background activity and avoid exclusive-attribution claims. Sequential scheduling alone does not isolate electricity use. [R109, R110, R147]

Prefer usable energy-counter deltas when available. Otherwise integrate sampled power and label the derived energy as an estimate. A known counter range alone never proves a wrap: require collector continuity/reset evidence, increasing timestamps, documented counter semantics and plausible delta bounds. Resets, ambiguous decreases and gaps with possible multiple wraps leave uncovered intervals. Preserve source definitions, rejected readings and uncertainty. Resolve competing sources for the same physical domain deterministically before removing parent/subdomain overlap. Do not add overlapping package, subdomain, and SoC measurements, and do not describe power estimates as wall-socket measurements. [R112, R113, R147]

An optional electricity tariff may produce a clearly labeled energy-cost estimate, computed by M10. Its scope follows the underlying measurement: CPU-package or GPU-only readings cannot justify whole-system electricity cost. Keep shared experiment energy of parallel runs separate from per-configuration rankings; in sequential runs, the window energy M18 supplies for a configuration on a local endpoint is what M10 prices as that configuration's "energy estimate" cost, labelled with this scope. Do not add energy charges to reported provider costs. [R110, R114, R155]

## Dependencies and handoffs

[M03 environment readiness](03-environment-readiness.md) combines capability explanations, setup guidance, and rechecks into its readiness report; [M15 TUI](15-terminal-interface.md) and [M14 command-line access](14-command-line-interface.md) present them as clients of the engine API without evaluating any M18 rule. [M07 configuration](07-run-configuration.md) carries monitoring choices. [M05 execution](05-harness-execution-isolation.md) supplies observable process associations; [M11 orchestration](11-run-orchestration.md) supplies experiment/concurrency context and execution windows. [R102, R103, R106–R110]

[M10 measurements](10-measurements-cost.md) preserves energy-cost distinctions; [M06 rankings](06-scoring-rankings.md) excludes shared-energy allocations. [M02 retained results](02-retained-results-comparability.md) and [M13 reports](13-standalone-html-report.md) consume samples, scopes, sources, coverage, and limitations without strengthening attribution claims. [R106, R108–R114, R147]

## Acceptance criteria

- Automatic detection is the default, explicit disablement works, and available metric families appear without requiring every sensor. [R013, R102]
- Each of the five unavailability conditions is distinguishable in Environment and doctor. Missing tools receive documented macOS/Linux guidance and a recheck action; no automatic installation or permission change occurs. [R103–R105, R146]
- Concurrent configurations share one host collection at the run's sampling interval (default one second). Intervals outside 0.5–10 s are rejected; a collector slower than the requested interval records and shows its own actual interval. Samples retain required metadata; collector or sampling failure leaves benchmark execution available and coverage honest. [R106, R147]
- Process-tree observations, external model servers, host/package/GPU/SoC scopes, and cloud-client limitations remain distinguishable. [R107, R108, R111, R146]
- Parallel energy has no fabricated competitor allocation. Sequential windows disclose background activity. Counter resets, wraparound, gaps, estimated power integration, and overlapping domains cannot produce falsely complete totals. [R109, R110, R112, R113, R147]
- Tariff estimates retain measured scope, remain separately labeled, and neither enter rankings from shared parallel energy nor duplicate provider charges; a sequential run supplies per-configuration window energy with scope. [R110, R114]

## Implementation

This section applies [the architecture decision](ARCHITECTURE.md). Everything below is an implementation choice; the product behavior above and [SPEC.md](../SPEC.md) stay authoritative. Paths, timeouts, file formats and the downsampling scheme are engineering defaults, not product requirements.

### 1. Engine component

Package `axbenchmark.engine.telemetry`. M18 owns collector discovery, the per-experiment host collection, process-tree observation, energy derivation and the descriptions of scope and coverage that every consumer shows. It is the only code that classifies a collector finding into one of the five causes, decides whether a metric is enabled, integrates power, applies counter deltas, detects overlapping domains or decides whether energy can be shown per window. No port it declares can install software, run `sudo` or change a permission. **[R103, R105]**

#### Domain (`engine/telemetry/domain/`)

Frozen dataclasses, enums and pure functions; no I/O, no asyncio.

| Type or rule | Content |
|---|---|
| `MonitoringMode` | `AUTOMATIC` (default), `OFF`. With `SamplingInterval`, the vocabulary of M07's `ExecutionSettings.monitoring` (`MonitoringChoice(mode, sampling_interval_s)`). **[R102]** |
| `SamplingInterval` | Finite `Decimal` seconds, `MIN = 0.5`, `MAX = 10`, `DEFAULT = 1`. `validate_interval(value)` raises `InvalidInterval` outside the range or for nonfinite/non-numeric input; nothing is rounded or clamped. Frozen with the launch; not a template input. **[R106]** |
| `effective_interval(requested, collector_min) -> CollectorInterval` | `max(requested, collector_min)` per collector, with `raised: bool` when the collector's minimum applied. Recorded in every collection and shown wherever an interval is shown; the requested value is never displayed as a collector's actual interval. **[R106, R147]** |
| `MetricFamily` | `CPU_UTILIZATION`, `GPU_UTILIZATION`, `MEMORY`, `POWER`, `ENERGY`, `TEMPERATURE`. **[R102]** |
| `Scope` | `PROCESS_TREE`, `HOST`, `CPU_PACKAGE`, `CPU_SUBDOMAIN`, `GPU`, `SOC`, `SOC_SUBDOMAIN`. Every sample, observation and label carries one; there is no unscoped value. **[R108]** |
| `Domain` | Collector-local `id`, verified `physical_domain_id` (host/device identity plus measured domain, never just a device index), `scope`, metric definition, `label`, `parent: str \| None`, and alias/overlap evidence. Unknown alias relationships remain explicitly unresolved and cannot justify a summed total. **[R113]** |
| `CollectorId` | `PSUTIL`, `MACMON`, `POWERMETRICS`, `POWERCAP_RAPL`, `NVIDIA_SMI`, `AMD_SMI`. **[R104]** |
| `CollectorCause` | `MISSING_TOOL`, `INSUFFICIENT_PERMISSION`, `MISSING_DRIVER_OR_KERNEL_INTERFACE`, `UNSUPPORTED_HARDWARE`, `COLLECTOR_FAILURE`. Single definition; M03's readiness domain imports it. **[R103]** |
| `ProbeOutcome` | Raw facts of one probe: tool path and version or absence, device nodes found, permission errors with path and mode, sensor enumeration, parse errors, timeout. |
| `classify(outcome) -> Capability` | Pure mapping to `AVAILABLE` or `UNAVAILABLE(cause, detail)`. A found tool with no sensor is `UNSUPPORTED_HARDWARE`, never `MISSING_TOOL`; an existing counter that cannot be read is `INSUFFICIENT_PERMISSION`; an absent kernel interface or device node is `MISSING_DRIVER_OR_KERNEL_INTERFACE`; a crash, timeout or unparseable output is `COLLECTOR_FAILURE`. A metric is `AVAILABLE` only when a probe read a value. **[R103, R104]** |
| `Capability` | `ref` (`collector:<collector>:<metric>:<domain>`, stable across detections), metric, domain, collector, collector version, unit, status, `has_guidance`, `min_interval_s` (the fastest interval the collector supports, from its probe or adapter). |
| `CapabilityReport` | Host (OS, version, distribution, CPU, GPUs, hostname), `detected_at`, capabilities. |
| `enabled_metrics(report, mode) -> Sequence[Capability]` | Empty for `OFF`; otherwise only `AVAILABLE` capabilities. **[R102, R104]** |
| `limitations(report, mode, interval) -> Sequence[Limitation]` | One per unavailable metric with its cause, one per collector whose minimum is slower than `interval` ("nvidia-smi samples every 2 s"), or a single `monitoring off` limitation. Never blocking. Feeds M07's `SetupFacts` and results. **[R103, R106, R146]** |
| `SourceReading` | Collector/device-scoped raw value with sample id, source timestamp/epoch, observed duration, units, domain and continuity evidence; no run/trial attribution. HostSampler wraps one reading in each due run’s Sample envelope without treating it as another physical measurement. |
| `Sample` | `sample_id`, `run_uid`, `collection_id`, `active_trials: tuple[TrialRef, ...]` (context only, not energy ownership), `t` (wall time, monotonic offset and clock/collector epoch), `ref`, physical domain, value or `None`, unit, source/version, scope, observed interval, continuity/reset evidence and `missing_reason`. Raw host samples have experiment scope; every retained result envelope additionally binds its explicit `TrialRef`. A failed/stale read is `None`, never 0. **[R106, R147]** |
| `ProcessObservation` | `run_uid`, `trial: TrialRef \| None`, `task_id \| None`, invocation/root pid/pgid and process-start identity, CPU time, peak RSS, coverage, `attribution: HARNESS_TREE \| SEPARATE_SERVER`, `endpoint_kind: LOCAL \| CLOUD`, note. Harness observations require a trial; a server outside that group is run-scoped `SEPARATE_SERVER` with `trial=None`, not competitor energy. **[R107, R111]** |
| `CounterSemantics` | Documented source/version, unit scaling, modulus/range meaning if known, reset/epoch behavior, continuity evidence requirements, conservative maximum energy rate and bound provenance, accepted gap limit. An observed instantaneous power value or configured power limit is not automatically a guaranteed upper bound. |
| `counter_delta(readings, semantics, window) -> Derived` | Validate adjacent intervals with the rules below. Sum only admissible, uniquely determined deltas; positive differences also require continuity and gap/bound checks. Reset or ambiguous intervals stay uncovered, with raw values and reason retained. Range alone never selects a wrap. **[R112]** |
| `integrate_power(samples, interval, window) -> Derived` | Left-rectangle integration only over fresh, adjacent valid readings within the accepted gap limit, clipped to the window; use actual timestamp differences, not tick count × requested interval. Do not bridge missing samples, extend a final sample or reuse stale values. Always `estimate=True`. **[R112, R113]** |
| `Derived` | Exact rational Wh (shared exact-value vocabulary) or `None`, method, estimate, covered interval set, window duration and coverage, events with times/reasons. Divide J by 3600 and Wh by 1000 exactly. No admissible interval is `UNAVAILABLE`, not 0; a measured zero over covered time is valid. |
| `derive_energy(domains, series, window) -> Sequence[EnergyObservation]` | Derive candidates per source, run `select_sources` for physical-domain duplicates, then `non_overlapping`; preserve all candidates and decisions. Prefer usable counters; power fallback remains an estimate. **[R112]** |
| `EnergyObservation` | `run_uid`, explicit experiment or TrialRef window, physical domain/scope, Derived, source/version/definition, selection reason, `selected`, `summed`; rejected observations keep their evidence and coverage. |
| `select_sources(candidates, policy) -> SourceSelection` | Per physical domain and window: usable COUNTER_DELTA before usable POWER_INTEGRATION, then greater covered duration, then frozen collector preference, then lexical source ref. Default preference: POWERCAP_RAPL, NVIDIA_SMI, AMD_SMI, MACMON, POWERMETRICS, PSUTIL. Record policy/version and each rejection; never splice different sources' counter baselines. |
| `non_overlapping(selected) -> EnergyScope` | After source selection, usable parent measurements exclude children from the sum; retain child rows as shown, not summed. Unresolved domain relationships are not summed. Preserve per-domain coverage and the intersection of covered intervals for aggregate full-scope coverage. Label e.g. "CPU package + GPU · not system". **[R113, R114]** |
| `Window` | `EXPERIMENT(run_uid, start, end)` or `SEQUENTIAL(trial: TrialRef, task_id \| None, start, end, includes_background=True)`. Durable M11 execution windows supply boundaries; absent/not-run windows are unavailable, never zero-duration measured energy. |
| `allocation(scheduling) -> Allocation` | `NONE` when more than one configuration could run at once; `PER_WINDOW` only when the run's scheduling is `jobs == 1`. There is no function that divides experiment energy among configurations. **[R109, R110, R147]** |
| `window_energy(observations_per_domain, windows) -> Sequence[WindowEnergy]` | Only callable with `PER_WINDOW`; one row per TrialRef using the union of its task windows, with the selected non-overlapping scope and coverage. Every row carries `includes_background=True`; sum disjoint windows for the total, labelled not exclusive. **[R110, R113]** |
| `downsample(series, points) -> Sequence[Bucket]` | Mean per bucket; a bucket that contains a missing sample is flagged `gap`, a bucket with no sample is `None`. |
| `guidance_for(capability, host, catalog) -> Guidance` | Commands only when the catalog has an entry verified for the host's OS and distribution version; otherwise links only. `UNSUPPORTED_HARDWARE` never carries an install command. **[R103, R105]** |

**Counter admission (F12).** Reject nonfinite/out-of-range counter values, nonpositive ranges/bounds, non-increasing or cross-epoch timestamps, reset evidence, missing affirmative continuity evidence, unsupported semantics, gaps beyond the frozen accepted gap limit, and implausible increments. For a documented modulo counter with range `R`, enumerate nonnegative candidates `new − old + kR` consistent with documented semantics and the bound `B = maximum_energy_rate × elapsed`; accept only one possible candidate. A decrease requires exactly one wrap (`k=1`), affirmative continuity and no reset; if another wrap is plausible or reset cannot be excluded, the interval is uncovered. Nonmodulo counters require documented monotonic semantics and continuity. Do not infer a counter reset solely from a parser restart, or continuity solely from an unchanged tool PID. Gaps/resets establish a new baseline without inventing energy across the break.

Counter intervals straddling a trial boundary are not prorated: use only intervals wholly within that window or actual readings at both boundaries; keep the uncovered edge. Power rectangles may be clipped because they are already estimates. Union task windows before deriving a trial total, so nested windows are not counted twice. Scope, included background activity and every missing edge survive M10 pricing and retained exports.

Domain errors: `InvalidMode`, `InvalidInterval`, `UnknownCapability`, `NotSequential`, `NoTelemetry` (result recorded with monitoring off), `UnknownResult`, `ScopeMismatch`, `CollectionConflict`, `TelemetryFinalizationConflict`, `TelemetryPersistenceFailed`. Sensor unavailability is a value/limitation; retention failure is a typed error that blocks sealing.

#### Ports (`engine/telemetry/ports.py`)

```python
class CollectorProbe(Protocol):              # one adapter per CollectorId
    collector: CollectorId
    async def probe(self, host: Host, timeout_s: float) -> Sequence[ProbeOutcome]: ...   # includes min interval
    async def open(self, caps: Sequence[Capability], interval: CollectorInterval) -> SampleSource: ...

class SampleSource(Protocol):
    async def read(self) -> Sequence[SourceReading]: ...   # one tick; missing value is data
    async def close(self) -> None: ...

class ProcessTreeReader(Protocol):
    async def group_usage(self, pgid: int) -> ProcessUsage: ...          # summed CPU time, RSS of live members
    async def listener(self, port: int) -> ProcessUsage | None: ...      # local model server, if observable

class HostInfo(Protocol):
    def describe(self) -> Host: ...

class GuideCatalog(Protocol):
    def entries(self, collector: CollectorId, cause: CollectorCause) -> Sequence[GuideEntry]: ...

class TelemetryStore(Protocol):
    async def save_report(self, report: CapabilityReport) -> None: ...
    async def load_report(self) -> CapabilityReport | None: ...
    async def open_collection(self, run_uid: RunUid, meta: CollectionMeta) -> None: ...
    async def append(self, run_uid: RunUid, samples: Sequence[Sample], operation_id: str) -> None: ...
    async def append_processes(self, run_uid: RunUid, obs: Sequence[ProcessObservation], operation_id: str) -> None: ...
    async def checkpoint_close(self, run_uid: RunUid, checkpoint: TelemetryCloseCheckpoint) -> None: ...
    async def finish(self, run_uid: RunUid, summary: TelemetrySummary, receipt: TelemetryFinalizationReceipt) -> None: ...
    async def load(self, run_uid: RunUid) -> StoredCollection | None: ...
    async def open_collections(self) -> Sequence[RunUid]: ...

class ExperimentTelemetry(Protocol):  # published application interface; M11 awaits both
    async def open(self, run_uid: RunUid, choice: MonitoringChoice) -> None: ...
    async def close(self, run_uid: RunUid) -> TelemetryFinalizationReceipt: ...

class ProcessTracking(Protocol):  # M05 scoped process lifecycle handoff, injected at composition
    async def started(self, scope: TaskScope, invocation_id: InvocationId, pid: int, pgid: int, process_start: str) -> None: ...
    async def exited(self, scope: TaskScope, invocation_id: InvocationId) -> None: ...

class CsvSink(Protocol):
    async def write(self, path: Path, rows: Iterable[Sequence[str]], overwrite: bool) -> WrittenFile: ...
```

Ports onto other modules, satisfied by public application interfaces or thin adapters: `RunContext.configuration(run_uid)`, `.scheduling(run_uid)`, `.windows(run_uid)` (M11: frozen roster/ResultId bindings, TrialRef windows with durable end/cutoff state and run directory), `ResultRecorder.append_hardware_samples(rid, HardwareSamples, operation_id)` and `.attach_evidence(rid, EvidenceRef, operation_id)` (M02), `RetainedResultReader.get` (M02), `MeasurementReader` (M10, recorded electricity estimate). `Clock`, exact values, RunUid/TrialRef, publication and typed cursor interfaces come from Bootstrap/shared foundations. No port imports another module's adapter or runs a collector on behalf of a UI.

`HardwareSamples` is the schema-versioned M18 payload accepted by M02: `run_uid`, `trial: TrialRef`, `result_id`, `collection_id`, shared collection digest/evidence refs, per-trial windows/process observations, selected and rejected energy observations, source policy/semantics, actual intervals, gaps and coverage/limitations. Every retained envelope binds its result's trial, while the referenced host series remains explicitly experiment-scoped and is not duplicated energy. M02 validates scope and durability.

`TelemetryFinalizationReceipt` is M18's single published frozen contract, consumed unchanged by M10/M11: `{schema_version: 1, run_uid, collection_id, input_digest, collection_digest, windows_digest, cutoff: {wall_time, monotonic_offset, clock_epoch, last_persisted_sample_id?}, status: complete | partial | unavailable | off, limitations, results: [{result_id, trial: TrialRef, hardware_digest, operation_id}]}`. Sort result rows by ResultId; digests are SHA-256 of canonical credential-free inputs/collection/windows/hardware payload respectively, excluding receipt/checkpoint bookkeeping. `input_digest` binds the launch digest, roster, windows, sample/gap cutoff and frozen derivation policy. `complete` means complete coverage for the declared enabled/measured scope, never every host sensor. An unavailable/off receipt still retains explicit reasons and every expected trial envelope; no energy value is fabricated.

**Awaited close and recovery (F03).** M11 joins producers and awaits M10 `drain_run` → M18 `close` → M10 `finalize_run(run_uid, receipt, original_terminal_cause)` → M02 seal. Close removes only this RunUid's schedules, drains in-flight accepted reads, flushes persisted samples/gaps, freezes execution windows and cutoff in `TelemetryCloseCheckpoint`, derives from those exact inputs, and awaits all M02 evidence/hardware writes. Stable append IDs are `telemetry:<run_uid>:<result_id>:hardware:v1` (and deterministic evidence/batch IDs); the same ID/payload is a no-op, changed payload is a conflict. Persist the receipt and close completion before returning or publishing finished. OFF, no collectors and collector failure follow this barrier with explicit unavailable data; storage failure remains pending and cannot be swallowed as optional monitoring failure.

Repeated/concurrent close joins the same checkpoint and returns the identical receipt. After engine loss, M11 first recovers binding/windows, then invokes close using persisted samples/gaps only; no probe, resumed sampler or new collection is allowed for that run. The uncovered tail extends to the recorded execution cutoff; nothing is extrapolated beyond the last persisted sample. Existing close/finalizer checkpoints retain their original windows, input digest, operation IDs, cause and receipt; later engine-lost/stop cause is separate M11 lifecycle evidence. Already sealed results reuse prior receipt rows and receive no fact writes. `run.state.changed(ended)` and observational telemetry events never trigger accounting or retention.

#### Application (`engine/telemetry/application/`)

| Use case | Kind | Behavior |
|---|---|---|
| `DetectCapabilities` | job `telemetry.detect`; in-engine `CollectorCapabilities.detect` (M03) | Runs every `CollectorProbe.probe` concurrently with a 10 s timeout each; a timeout or crash becomes `COLLECTOR_FAILURE` for that collector only. `classify` each outcome, save the report, publish `telemetry.capabilities.updated` with before → after changes. A second request while one runs returns the running job's `JobRef`. Never installs, never escalates. **[R103, R104]** |
| `GetCapabilities` | query `telemetry.capabilities` | Last report, mode options, `limitations` per mode, capability flags. Runs `DetectCapabilities` first only when no report exists. |
| `GetGuidance(ref)` | query `telemetry.guidance`; in-engine `CollectorCapabilities.guidance` (M03) | `guidance_for` the capability on this host, plus the other causes' remedies for context. |
| `ValidateMonitoring(mode, interval)` | in-engine `MonitoringOptions.validate` (M07) | Returns `MonitoringChoice` or raises `InvalidMode` / `InvalidInterval`; also `limitations(report, mode, interval)` and the effective interval per collector for `SetupFacts`. |
| `StartCollection(run_uid, choice)` | awaited `ExperimentTelemetry.open` (M11, after complete binding) | Persist OFF/no-collector metadata too. Otherwise detect if needed, freeze capabilities/source policy/intervals and register this RunUid's collection with HostSampler. Identical open joins; changed choice/binding conflicts. Collector errors become limitations and never stop execution; persistence errors are typed, preventing an unrecorded collection. A recovered/closed run cannot open anew. **[R102, R106]** |
| `HostSampler` | owned asyncio task | One engine task; schedules keyed by RunUid/collection/collector, associated with explicit active TrialRefs. Share one source/read per collector across due collections, preserving source timestamp/sample identity. Streaming sources use the fastest admitted interval; each collection records its effective schedule plus observed intervals, and cannot reuse stale samples as new readings. Restart/reconfiguration changes continuity epoch unless the adapter proves counter continuity. A source crash affects only that collector, records gaps and failure, never auto-restarts the run. Closing one run releases only its leases; last lease closes the source. **[R106, R147]** |
| `TrackProcessTree` | M05 scoped start/exit application handoff | Register TaskScope/TrialRef/InvocationId and pgid/process-start identity; sample observable group usage until exit. Separate listeners have run scope and no attributed trial. Cloud entries describe the client only. Required registration/flush is awaited and idempotent; public `harness.task.started` / `.exited` events are observational, not a lossy-queue persistence dependency. **[R107, R108, R111]** |
| `FinishCollection(run_uid)` | awaited `ExperimentTelemetry.close -> TelemetryFinalizationReceipt` | Execute the checkpoint/retention barrier above; select sources before overlap filtering; sequential windows carry exact TrialRefs. Await M02 writes for each unsealed expected result and reuse prior sealed receipt rows. Keep shared collection identity/digest across envelopes without allocating its energy. Publish finished only after durable receipt, then let M10 price it before M11 seals. **[R106, R109, R110, R112, R113]** |
| `ReconcileCollections` | M11 startup coordinator | Load orphaned collection metadata, stop orphan collector children and mark sampling closed; after M11 recovers durable windows, call the same close operation from persisted samples/gaps. Never open/probe/resume lost-run collection. No new receipt or changed inputs for an existing checkpoint. |
| `GetExperimentTelemetry(result, points)` | query `telemetry.experiment` | Finalized local and imported facts come only from M02; active local projections from TelemetryStore are explicitly provisional. Downsample and add M10's recorded electricity estimate unchanged. |
| `ExplainEnergy(result)` | query `telemetry.energy` | Domain rows with method, events and result; the fixed statements (preferred method, gap, overlap, label, allocation) as engine text. |
| `GetWindowEnergy(result)` | query `telemetry.windows` | `window_energy` rows; raises `NotSequential` for concurrent runs. |
| `ExportCsv(result, path, overwrite)` | command `telemetry.export_csv` | One row per sample with RunUid, retained TrialRef envelope, sample id, timestamps/observed interval, ref, physical domain, scope, unit, source/version, value or empty, selection and missing reason. Retain experiment-scope labels; use authoritative M02 facts once finalized. |
| `DescribeSamples(samples)` | in-engine `TelemetryDescriber.describe` (M13) | Scope, source, coverage and limitation labels for timelines; pure. |
| `EnergyObservations(run_uid)`, `WindowEnergyObservations(run_uid)`, `HostEnergyScope()` | in-engine `EnergySource` (M10: `observations`, `window_energy`, `host_scope`) | Closed receipt-bound observations with exact kWh, source/selection/scope and coverage; sequential rows require TrialRef and background labels, parallel returns no per-trial allocation. M10 verifies the receipt/digests before consuming these observations. Host preview is capability guidance only and cannot replace a closed run's measured scope. **[R110, R114]** |

Application interfaces offered to other modules (`engine/telemetry/application/interfaces.py`): `CollectorCapabilities` (M03), `MonitoringOptions` (M07), `ExperimentTelemetry` (M11), `ProcessTracking` (M05), `EnergySource` (M10), `TelemetryDescriber` (M13). Bootstrap publishes these signatures; wire the M05 handoff before real process-attribution acceptance.

#### Adapters (`engine/telemetry/adapters/`)

| Adapter | Implements | Notes |
|---|---|---|
| `psutil_collector.py`, `macos_psutil.py`, `linux_psutil.py` | Dispatcher plus platform `CollectorProbe` (`PSUTIL`)/`ProcessTreeReader` | M18.2 owns registration infrastructure; M18.3/4 own distinct platform implementations. Version-gated documented process/host reads retain denied/disappeared member coverage and process-start identity, never fabricated attribution. |
| `macmon_collector.py` | `CollectorProbe` (`MACMON`) | Version-gated `macmon pipe` JSON in an owned process group. Maintainer documentation establishes the candidate interface; recorded schema and actual host probe establish enabled metrics. |
| `powermetrics_collector.py` | `CollectorProbe` (`POWERMETRICS`) | Bounded read-only probe using flags verified against the supported host's installed Apple manual/help; permission denial is unavailable. No privilege escalation or general claim of supported output format. |
| `powercap_collector.py` | `CollectorProbe` (`POWERCAP_RAPL`) | Discover the documented sysfs zone roots actually present on the supported host; read `name`, `energy_uj`, `max_energy_range_uj` and parent hierarchy. No supported interface is `MISSING_DRIVER_OR_KERNEL_INTERFACE`; an observed denied counter read is `INSUFFICIENT_PERMISSION`. Range/reset/continuity evidence still passes the F12 admission rule. Never write sysfs. |
| `nvidia_collector.py` | `CollectorProbe` (`NVIDIA_SMI`) | Version/device-gated NVML binding or read-only SMI query with individually probed fields. Counter only after documented units/semantics/continuity are verified; otherwise supported power fields provide estimates or unavailable values. |
| `amd_collector.py` | `CollectorProbe` (`AMD_SMI`) | Version-gated read-only metric JSON command verified against official docs/help. No assumed counter, units, reset semantics or sensor merely because a utility exists. |
| `subprocess_allowlist.py` | — | The only way the collectors above spawn processes: fixed executables and read-only arguments; `sudo`, package managers and `chmod` cannot be expressed. |
| `platform_host.py` | `HostInfo` | `platform`, `/etc/os-release`, `sw_vers`, CPU and GPU names. |
| `packaged_guides.py` | `GuideCatalog` | `docs/collectors/*.md` and `guidance/macos.yaml`, `guidance/linux.yaml` in the package: entries keyed by collector, cause, OS, distribution id and version, with commands, the guide path and the reference links named in the product contract (macmon, powercap, NVIDIA SMI, AMD SMI). |
| `jsonl_store.py` | `TelemetryStore` | Files below. Durable operation-ID batches, torn-tail detection, fsync before acknowledgement; atomic checkpoints/summary/receipt with temp file, fsync and rename. Never silently discard an acknowledged batch. |
| `csv_sink.py` | `CsvSink` | Refuses an existing file unless `overwrite`. |
| `run_context.py`, `results_bridge.py`, `energy_costs.py` | ports onto M11, M02, M10 | Thin mappings; no rule. |
| `rpc.py` | — | DTOs in `axbenchmark.api.telemetry`; domain errors to the codes below. |

#### Persisted state and owned processes

| Path | Content |
|---|---|
| `~/.axbenchmark/telemetry/capabilities.json` | Last `CapabilityReport`. No credentials. |
| `<run dir>/telemetry/collection.json` | UID-keyed CollectionMeta: RunUid/TrialRef roster, launch binding, requested/effective intervals, observed timing policy, host/device/source versions, semantics/source preference, domains, scheduling, state `open \| closing \| finished \| recovery_pending`. |
| `<run dir>/telemetry/samples.jsonl` | Scoped operation-ID batches with sample/source identity, timestamps/epoch, values or explicit gaps; stale/missed reads never backfilled. |
| `<run dir>/telemetry/processes.jsonl` | Scoped ProcessObservations including TrialRef/InvocationId or explicit separate-server scope. |
| `<run dir>/telemetry/close.json` | Frozen TelemetryCloseCheckpoint: cutoff, input/windows/launch digests, selected results, operation IDs, per-result durable append progress and receipt. |
| `<run dir>/telemetry/summary.json` | Derived accepted/rejected observations and raw references, EnergyScope, allocation, explicit trial-window energy, exact values, coverage and limitations. |

M18 retains hardware content through M02; M10 copies the exact close receipt into its retained MeasurementSet energy evidence before sealing; finalized local and imported results are served only from M02. **Owned processes:** timeout-bounded probes and admitted streaming collectors belong to `axbenchmarkd`, never a client; close the process only after its last live collection lease ends. Collector crashes affect that collector only. Startup cleanup/recovery cannot begin new sensing for a lost run. No tariff, billing or provider-cost arithmetic lives in M18.

### 2. API surface (`telemetry.*`)

DTOs in `axbenchmark.api.telemetry`; rows carry RunUid and explicit TrialRef where result-scoped. Exact energy values serialize as reduced `n/d` strings, matching M10's convention; rendering may round but CSV/retention preserve the exact value. Every value cell is `MeasuredDTO(value: str | None, unit, coverage: complete | partial | unavailable, coverage_pct?, estimate: bool, reason?)`, and every series or row carries `source` and `scope_label`, so interfaces render text and state without deriving either.

#### Queries

| Method | Request | Response | Errors | Capability flags | Safety |
|---|---|---|---|---|---|
| `telemetry.capabilities` | `sampling_interval_s?` (to preview effective intervals) | `CapabilitiesView {host: HostDTO, detected_at, modes: [{value, label}], default_mode, interval: {default_s: 1, min_s: 0.5, max_s: 10, requested_s}, rows: [CapabilityRowDTO {ref, metric, source, version?, scope_label, status: "on" \| "unavailable", cause?, cause_text?, has_guidance, min_interval_s, effective_interval_s, interval_raised}], energy_note, statements: [[label, text]], limitations_by_mode: {mode: [LimitationDTO]}, detection_job?: JobRef}` | — | `can_detect` (`reason: telemetry.detection_running`) | read |
| `telemetry.guidance` | `ref` | `GuidanceDTO {ref, title, host, source, found, cause, cause_text, commands?: {text, verified_for}, guide_path, references: [{label, url}], other_causes: [[cause, remedy]], continue_note}` | `telemetry.unknown_capability` | `can_copy_commands` | read |
| `telemetry.experiment` | `result_id`, `points: int = 80` | `TelemetryView {run_uid, trial: TrialRefDTO, finalization: "provisional" \| "pending" \| "finalized" \| "error", state: "collected" \| "off" \| "none", bar: str, provenance, host, concurrency_text, requested_interval_s, collector_intervals: [{collector, effective_interval_s, observed_interval_range_s, raised}], duration, series: [SeriesDTO {label, source, scope_label, unit, buckets: [float \| null], gap_buckets: [int], summary}], markers: [{at: float, label}], processes: [ProcessRowDTO {label, cpu_time, peak_rss, note, attribution, endpoint_kind}], process_note, energy: [[label, text]], energy_note, footnote}` | `telemetry.unknown_result` | `can_energy_detail`, `can_windows` (`reason: telemetry.not_sequential` or `telemetry.no_energy`), `can_export_csv` | read |
| `telemetry.energy` | `result_id` | `EnergyDerivationView {title, rows: [{domain, physical_domain_id, source, method, events, result: MeasuredDTO, selected: bool, selection_reason, summed: bool}], statements: [[label, text]], tariff_note?}` | `telemetry.unknown_result`, `telemetry.no_energy` | — | read |
| `telemetry.windows` | `result_id` | `WindowEnergyView {title, subtitle, columns: [str], rows: [{window, trial: TrialRefDTO, duration, values: [MeasuredDTO], includes}], total: {…same}, scope_label, note}` | `telemetry.unknown_result`, `telemetry.not_sequential`, `telemetry.no_energy` | — | read |

`buckets` values are normalized to 0–1 per series by the engine; `gap_buckets` lists buckets that contain a missing sample. `markers` retain explicit TrialRef/configuration identity on the shared time axis. `can_energy_detail` is true when derivation evidence exists even if every candidate is unavailable, so reset/ambiguity reasons remain inspectable; `no_energy` means no such evidence exists. A window-total row has an explicit set of contributing TrialRefs, never an invented single trial.

#### Commands and jobs

| Method | Kind | Request | Response | Errors | Safety |
|---|---|---|---|---|---|
| `telemetry.detect` | job | — | progress `{collector, done, total}`; result `CapabilitiesView` | — (probe failures are rows with `COLLECTOR_FAILURE`) | read (probes only; no system change) |
| `telemetry.export_csv` | command | `result_id`, `path` (absolute), `overwrite: bool = false` | `WrittenFileDTO {path, rows, bytes}` | `telemetry.unknown_result`, `telemetry.no_telemetry`, `telemetry.target_exists`, `telemetry.invalid_target` | write |

Monitoring mode and sampling interval are stored by M07: `configs.set_execution(draft_id, monitoring={mode, sampling_interval_s})`, which returns `telemetry.invalid_mode` (`field: monitoring.mode`) or `telemetry.invalid_interval` (`field: monitoring.sampling_interval_s`) from `MonitoringOptions.validate`. M18 adds no method to `configs.*`.

#### Events

Register revisioned `telemetry` snapshots and run events through M11’s shared publication boundary; save state before publishing. Clients use `EventCursor {epoch, seq}` and resnapshot on resync/overflow, never subscribe by event-name topic. Required collection/retention work uses awaited application ports, not these notifications.

| Event | Payload | Topics |
|---|---|---|
| `telemetry.capabilities.updated` | `CapabilitiesView`, `changes: [{ref, before, after}]` | `telemetry` (snapshot `CapabilitiesView`) |
| `telemetry.collection.started` | `run_uid`, `mode`, enabled refs, `requested_interval_s`, `collector_intervals` | `telemetry`, `run:<run_uid>` |
| `telemetry.collector.failed` | `run_uid`, collector, refs, `cause: collector_failure`, `at`, message | `telemetry`, `run:<run_uid>` |
| `telemetry.collection.finished` | `run_uid`, coverage per ref, energy available | `telemetry`, `run:<run_uid>` |

#### Error codes

Use the shared numeric JSON-RPC error envelope with namespaced `data.code`, message, remedy and field details. Internal persistence/finalization conflicts reach M11 as typed pending-retention errors; sensor unavailability remains a successful capability/receipt with explicit limitations.

| Code | Raised when |
|---|---|
| `telemetry.invalid_mode` | A monitoring value other than `automatic` or `off`. |
| `telemetry.invalid_interval` | A sampling interval that is not a number from 0.5 to 10 seconds. |
| `telemetry.unknown_capability` | `ref` not in the current report. |
| `telemetry.unknown_result` | No retained result with that id. |
| `telemetry.no_telemetry` | The result was recorded with monitoring off or with no samples. |
| `telemetry.no_energy` | No energy observation exists for the result. |
| `telemetry.not_sequential` | Window energy requested for a run that allowed more than one configuration at once. |
| `telemetry.target_exists`, `telemetry.invalid_target` | CSV export path conflicts or is not writable. |

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `RunContext.configuration(run_uid)`, `.scheduling(run_uid)`, `.windows(run_uid)` (TrialRef/result roster and durable cutoff), `.run_dir` (application interface) | M11 | Endpoint kind and port per configuration, concurrency, execution windows, `<run dir>/telemetry/`. |
| Await `ExperimentTelemetry.open(run_uid, MonitoringChoice)` after complete binding and idempotent `.close(run_uid) -> TelemetryFinalizationReceipt` after producer/drain settlement and before M10 finalize/M02 seal, including stop/recovery | M11 | One collection per experiment at the frozen interval, closed before results are sealed. |
| Routing of `telemetry.collection.*` and `telemetry.collector.failed` to `run:<run_uid>` through `TopicRegistry` | M11 | Run log visibility of collector failures. |
| `events.subscribe`, `jobs.get`, `jobs.cancel`, `job.progress`, `job.finished` | M11 | Subscriptions and job supervision. |
| `ProcessTracking.started(TaskScope, InvocationId, pid, pgid, process_start)` / `.exited(TaskScope, InvocationId)`; scoped public lifecycle events | M05 | Await process registration/flush; observations remain optional, with explicit gaps if unavailable. |
| `ResultRecorder.append_hardware_samples(rid, HardwareSamples, operation_id)`, `RetainedResultReader.get` | M02 | Retain samples with each result; serve imported results. |
| `t` binding on `ResultScreen` (ResultOrigin) pushing `TelemetryScreen(result_id)`, enabled from the result capability `can_telemetry` | M02 | Entry point named in the TelemetryScreen tree ("t from a result"). |
| `MeasurementReader` recorded costs; `MeasurementFinalizer.drain_run/finalize_run`; receipt-bound `EnergySource.observations/window_energy` | M10 | Electricity line of `#energy` and the tariff note, shown unchanged; local configuration cost in sequential runs. |
| `configs.set_execution(draft_id, monitoring={mode, sampling_interval_s})`; `SetupView.execution.monitoring`; Setup's Monitoring row pushing `MonitoringScreen(draft_id, current)` | M07 | Storing mode and interval; entry point. |
| `environment.explain(ref)` accepting M18 capability refs; `CollectorGuideScreen`; `environment.recheck(scope="collectors")` | M03 | Guidance dialog and recheck from Environment and from MonitoringScreen. |
| `CollectorCause` imported from `engine.telemetry.domain` in M03's readiness domain | M03 | One five-cause vocabulary. |
| App shell `app.client`, `ContentSwitcher` state widgets, `-compact` class, shared `ActionState` view-model type, `PromptScreen` for the Export CSV path (not drawn in the wireframes) | M15 | Hosting the screens; the Export CSV path. |

### 4. Screens

Owned artboards: MonitoringSettings, Telemetry, EnergyDetail, SequentialEnergy ([navigation §23](../design/wireframe-tui/navigation.md)). CollectorGuide is drawn on the M18 page but is `CollectorGuideScreen` in `tui/screens/environment.py`, specified by [M03](03-environment-readiness.md); its content is M18's `GuidanceDTO` passed through `environment.explain`. CurrencyEnergy is M10's screen and shows M18's scope through `measurements.preview_accounting`.

Shared rules: show provisional, close-pending/error, complete, partial and unavailable engine states explicitly. Loads run in an `exclusive=True` worker through the injected client; data widgets sit in `ContentSwitcher`s with `#x`, `#x-loading`, `#x-empty`, `#x-error`; errors show the engine's `message` and `remedy` verbatim with a Retry that repeats the load; `check_action` returns `None` (dimmed) from capability flags only. No screen classifies a cause, decides an enabled metric, sums energy, computes coverage or decides whether windows apply.

View models (`tui/viewmodels/telemetry.py`):

```python
@dataclass(frozen=True)
class MonitoringVM:
    modes: list[tuple[str, str]]; selected: str        # RadioSet #monitoring-mode
    interval_text: str; interval_hint: str             # Input #sampling-interval as typed; "0.5–10 s, default 1 s"
    interval_error: str | None; host_line: str
    rows: list[tuple[str, tuple[str, str, str, str, str], str]]   # ref, (metric, source, scope, interval, status), status class
    statements: list[tuple[str, str]]                  # Energy, Never, Results
    limitation_note: str; guidance_enabled: dict[str, bool]

@dataclass(frozen=True)
class SeriesVM:
    label: str; source: str; values: list[float | None]; gaps: set[int]; summary: str

@dataclass(frozen=True)
class TelemetryVM:
    run_uid: str; trial: TrialRefDTO; finalization: str
    state: Literal["collected", "off", "none"]; bar: str
    series: list[SeriesVM]; axis: tuple[str, list[tuple[float, str]], str]
    processes: list[tuple[str, str, str, str]]; separate_rows: set[int]; process_note: str
    energy: list[tuple[str, str]]; energy_note: str; footnote: str
    actions: dict[str, ActionState]                    # energy_detail, windows, export_csv

def build_monitoring_vm(view: CapabilitiesView, selected: str) -> MonitoringVM: ...
def build_telemetry_vm(view: TelemetryView) -> TelemetryVM: ...
def build_energy_vm(view: EnergyDerivationView) -> EnergyVM: ...
def build_windows_vm(view: WindowEnergyView) -> WindowsVM: ...
```

Builders map `status`, `coverage`, `estimate` and `attribution` to glyphs (✓ ▲ ✗ ○) and TCSS classes and copy text; they make no decision.

#### MonitoringScreen — artboard MonitoringSettings

`MonitoringScreen(ModalScreen[MonitoringChoiceDTO | None])` in `tui/screens/setup.py`, constructor `MonitoringScreen(draft_id: str, current: MonitoringChoiceDTO)`; pushed from the Monitoring row of SetupScreen's `#execution-pane` (M07). Returns the stored mode and interval or `None`.

| Aspect | Specification |
|---|---|
| Widgets | `Vertical #monitoring .dialog` with `RadioSet #monitoring-mode` (labels from `modes`), `Input #sampling-interval` (seconds) with the range hint, host line, `DataTable #detected` (Metric, Source, Scope, Interval, Status; Interval is the collector's effective interval, marked when its minimum applies; row keys are `ref`), `Static .kv` (statements), limitation note, `.dialog-actions` with `Button #guidance` ("Guidance…"), Cancel, `Button #save`. `#guidance` is an addition; the wireframe leaves it unnamed. TCSS from the legend (`#detected { height: 6; }`, modal width 86). |
| Load | Worker calls `telemetry.capabilities(sampling_interval_s=current)`; `Input.Changed` on `#sampling-interval` repeats it (debounced) so the Interval column shows the effective intervals. ContentSwitcher `#detected` / `#detected-loading` (detection running and no report) / `#detected-error`. |
| Subscription | `events.subscribe(["telemetry"])` on mount; `telemetry.capabilities.updated` rebuilds the view model, keeping the selected radio. Dropped on unmount. |

| Binding | Action | API call |
|---|---|---|
| `esc` | `dismiss(None)` | none |
| `tab` / `shift+tab` | `focus_next` / `focus_previous` | none |
| `ctrl+s`, Button `#save` | `save` | `configs.set_execution(draft_id, monitoring={mode: selected, sampling_interval_s: <input text>})`; on success `dismiss(choice)`; `telemetry.invalid_mode` is shown under `#monitoring-mode` and `telemetry.invalid_interval` under `#sampling-interval` |
| Button `#guidance` | `guidance` | `environment.explain(ref)` for the cursor row, then push `CollectorGuideScreen(explanation)`; dimmed unless the row's `has_guidance` |

#### TelemetryScreen — artboard Telemetry

`TelemetryScreen(Screen)` in `tui/screens/telemetry.py`, constructor `TelemetryScreen(result_id: str)`; pushed by `t` from ResultScreen (M02).

| Aspect | Specification |
|---|---|
| Widgets | `Header`; `Static #telemetry-bar` (`bar`, including the requested interval and any collector whose actual interval differs); `Vertical #charts .pane` (wireframe `Static #charts`, height 12) holding one row per series: label, source, `Sparkline` over `values` with gap buckets drawn as `·` in the muted class, `summary`; then the time axis with `markers`; `Horizontal` with `Vertical .pane` > `DataTable #process-trees` (Configuration, CPU time, Peak RSS, Note; `separate_rows` in the bold class) and `process_note`, and `Static #energy .pane.kv` (width 54) with `energy` pairs and `energy_note`; footnote; `Horizontal .actions` with `Button #energy-detail` and `Button #export-csv` (id is an addition); `Footer`. |
| Load | Worker calls `telemetry.experiment(result_id, points=<#charts content width − label and summary columns>)`; on resize past a width step it reloads with the new `points`. |
| ContentSwitcher | `#telemetry` (state `collected`); `#telemetry-empty` (state `off` or `none`: the engine's `bar` and limitation text, e.g. "monitoring off", never empty charts); `#telemetry-loading`; `#telemetry-error`. |
| Subscription | When the result belongs to an active run: `events.subscribe(["run:<run_uid>"])`; `telemetry.collection.finished` reloads. Otherwise none. Dropped on unmount. |

| Binding | Action | API call |
|---|---|---|
| `esc` | `app.pop_screen` | none |
| `e`, Button `#energy-detail` | `energy_detail` | `telemetry.energy(result_id)`, then push `EnergyDetailScreen(view)`; enabled by `can_energy_detail` |
| `w` | `windows` | `telemetry.windows(result_id)`, then push `WindowsScreen(view)`; enabled by `can_windows`, dimmed with its reason otherwise |
| Button `#export-csv` | `export_csv` | `telemetry.export_csv(result_id, path)` with the path from M15's `PromptScreen`; `telemetry.target_exists` offers overwrite, which repeats the call with `overwrite=true`; enabled by `can_export_csv` |
| `tab` | `focus_next` | none |

#### EnergyDetailScreen — artboard EnergyDetail

`EnergyDetailScreen(ModalScreen[None])` in `tui/screens/telemetry.py`, constructed with the `EnergyDerivationView` already loaded by TelemetryScreen. `Vertical #energy-detail .dialog` > `DataTable #energy-domains` (Domain, Source, Method, Events, Result; `summed=False` rows in the muted class with the engine's "shown, not summed" text), `Static .kv` (statements: Preferred, Gap, Overlap, Label, Allocation), tariff note, Close. No load, no subscription. `esc` → `dismiss`, no API call.

#### WindowsScreen — artboard SequentialEnergy

`WindowsScreen(ModalScreen[None])` in `tui/screens/telemetry.py`, constructed with the `WindowEnergyView`. `Vertical #windows .dialog` > subtitle, `DataTable #window-energy` (Window — configuration, and trial when there are several — Duration, then `columns`, Includes; the total row in bold), scope label, `Static #windows-note` (`note`), Close. Column headers come from the DTO, so a host without a GPU shows no GPU column. `esc` → `dismiss`, no API call.

**Wireframe follow-up:** MonitoringSettings needs effective versus observed intervals; EnergyDetail needs physical-domain/source preference and rejected-source/reset/gap reasons; SequentialEnergy needs explicit trial identity; Telemetry needs provisional/close-pending/error variants. Keep the existing boards; no wireframe edits here. CollectorGuide belongs to M03 and CurrencyEnergy to M10.

**Consumers elsewhere:** EnvironmentScreen `#collectors` and `CollectorGuideScreen` (M03) through `environment.*`; SetupScreen `#execution-pane` and `#limitations` (M07) through `SetupView`; CurrencyEnergyScreen `#energy-scope` (M10); the report's hardware timelines (M13); ResultScreen origin and coverage (M02).

### 5. CLI

| Command | API |
|---|---|
| `axbenchmark doctor [--collectors]` | `environment.recheck(scope)`; M03 calls `CollectorCapabilities.detect` and prints collector rows with cause and `remedy` (M14). |
| `axbenchmark run --config FILE …` | Monitoring mode and sampling interval come from the configuration's `execution.monitoring`; `telemetry.invalid_mode` and `telemetry.invalid_interval` are printed verbatim by M07 validation. With `--no-tui`, `telemetry.collector.failed` lines appear in the run stream. |
| Proposed for M14: `axbenchmark telemetry detect [--json]` | `telemetry.detect` job; prints rows like `doctor --collectors`. |
| Proposed for M14: `axbenchmark telemetry guidance REF [--json]` | `telemetry.guidance`. |
| Proposed for M14: `axbenchmark telemetry show RESULT_ID [--energy] [--windows] [--json]` | `telemetry.experiment`, `telemetry.energy`, `telemetry.windows`. |
| Proposed for M14: `axbenchmark telemetry export RESULT_ID --out FILE [--overwrite]` | `telemetry.export_csv`. |

Exit codes follow ARCHITECTURE.md; a detection that found no collectors exits 0.

### 6. Headless verification

Child commands are proposed implementation acceptance, not tests executed by this specification change. Use each child's exact source/test ownership and prerequisite gates.

| Gate | Required evidence |
|---|---|
| Pure domain | [M18.1 numerical vectors](implementation/M18/01-telemetry-domain.md#numerical-and-fault-acceptance): 950→30, range 1000, continuous 1 s, 100 W bound gives 80 J only when documented wrap semantics/evidence support it. Known-range 100→10 reset never gives 910; subsequent 10→30 gives 20 J with half coverage. Unknown-range reset, ambiguous 20 s/multiple-wrap interval and absent continuity remain uncovered. Duplicate 80 J package sources plus a 50 J child and separate 20 J GPU yield 100 J once, with rejected rows retained. |
| Intervals/coverage | 0.5/1/10 accepted, out-of-range/nonfinite/text rejected; 0.5 request plus 2 s minimum records both and observed timing. Fresh 60 W readings at 0/1 and 3/4 with a missing reading at 2 give 120 J and 1/2 coverage over 4 s. Missing-only data is unavailable, never zero. Counter window edges are not prorated; unions avoid nested-task duplication; aggregate coverage cannot exceed any summed domain's coverage. |
| Lifecycle/retention | [M18.2](implementation/M18/02-sampling-lifecycle.md): same-label different-UID runs and repeated TrialRefs never collide; shared source leases and requested/effective/observed intervals survive retention. Delay read flush, M02 append, receipt persistence and M10 finalization: no seal/readiness can overtake them. Inject every crash checkpoint, changed operation-ID payload, partial seal and later stop/engine loss; original input/cause/digest/receipt stays fixed and no lost-run collector resumes. |
| Recorded adapters | [M18.3](implementation/M18/03-macos-collectors.md), [M18.4](implementation/M18/04-linux-collectors.md): versioned recorded output, documented controls, five causes, unsupported fields, reset/continuity evidence, timestamp/gap/alias cases, bounded children and no mutation/escalation. A tool/version probe alone never proves a sensor. |
| API/clients/screens | Both actual clients round-trip exact values, TrialRefs, errors and capabilities. Shared typed cursor/revision snapshots withstand races, overflow, reconnect and epoch changes without duplicate collection. [M18.5](implementation/M18/05-telemetry-screens.md) tests each named board/state, dimmed actions, stable historical trial selection, guidance ownership and CSV empty values/overwrite. Finalized/imported queries read M02, never recompute from working state. |
| Real supported-host and consumer integration | On documented supported macOS/Linux combinations, capture real tool/device/permissions/interval evidence; explicitly list untested GPU/platform combinations. Compose M03 discovery, M05 process handoff, M07 frozen settings, M11 stop/recovery and the M18→M10→M02 receipt barrier; immediate M13 report/M17 export-import and M14 doctor/CLI agree with retained facts. No real sensor/hardware test is claimed here. |

Pending owner reconciliation: M05 must wire the published awaited ProcessTracking start/exit handoff; M10 must preserve the exact M18 receipt as retained MeasurementSet energy evidence. The remaining wireframe changes are listed under Screens. Neither unresolved hardware gates nor these consumer gates can be replaced with fake-provider completion claims.
