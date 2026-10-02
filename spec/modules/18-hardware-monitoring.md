# M18 — Optional CPU and GPU monitoring

Status: proposed module contract derived from [SPEC.md](../SPEC.md). This describes required behavior, not implemented functionality. Requirement IDs refer to [source traceability](TRACEABILITY.md).

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

Prefer energy-counter deltas when available. Otherwise integrate sampled power and label the derived energy as an estimate. Account for resets, wraparound, and missing samples, retaining partial coverage instead of presenting an incomplete interval as fully measured. Preserve the source's definitions and uncertainty. Do not add overlapping package, subdomain, and SoC measurements, and do not describe power estimates as wall-socket measurements. [R112, R113, R147]

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
| `SamplingInterval` | `Decimal` seconds, `MIN = 0.5`, `MAX = 10`, `DEFAULT = 1`. `validate_interval(value)` raises `InvalidInterval` outside the range or for a non-number; nothing is rounded or clamped. Frozen with the launch; not a template input. **[R106]** |
| `effective_interval(requested, collector_min) -> CollectorInterval` | `max(requested, collector_min)` per collector, with `raised: bool` when the collector's minimum applied. Recorded in every collection and shown wherever an interval is shown; the requested value is never displayed as a collector's actual interval. **[R106, R147]** |
| `MetricFamily` | `CPU_UTILIZATION`, `GPU_UTILIZATION`, `MEMORY`, `POWER`, `ENERGY`, `TEMPERATURE`. **[R102]** |
| `Scope` | `PROCESS_TREE`, `HOST`, `CPU_PACKAGE`, `CPU_SUBDOMAIN`, `GPU`, `SOC`, `SOC_SUBDOMAIN`. Every sample, observation and label carries one; there is no unscoped value. **[R108]** |
| `Domain` | `id` (e.g. `intel-rapl:0`, `intel-rapl:0:0`, `nvidia:0`), `scope`, `label`, `parent: str \| None`. The parent link is how overlap is known. **[R113]** |
| `CollectorId` | `PSUTIL`, `MACMON`, `POWERMETRICS`, `POWERCAP_RAPL`, `NVIDIA_SMI`, `AMD_SMI`. **[R104]** |
| `CollectorCause` | `MISSING_TOOL`, `INSUFFICIENT_PERMISSION`, `MISSING_DRIVER_OR_KERNEL_INTERFACE`, `UNSUPPORTED_HARDWARE`, `COLLECTOR_FAILURE`. Single definition; M03's readiness domain imports it. **[R103]** |
| `ProbeOutcome` | Raw facts of one probe: tool path and version or absence, device nodes found, permission errors with path and mode, sensor enumeration, parse errors, timeout. |
| `classify(outcome) -> Capability` | Pure mapping to `AVAILABLE` or `UNAVAILABLE(cause, detail)`. A found tool with no sensor is `UNSUPPORTED_HARDWARE`, never `MISSING_TOOL`; an existing counter that cannot be read is `INSUFFICIENT_PERMISSION`; an absent kernel interface or device node is `MISSING_DRIVER_OR_KERNEL_INTERFACE`; a crash, timeout or unparseable output is `COLLECTOR_FAILURE`. A metric is `AVAILABLE` only when a probe read a value. **[R103, R104]** |
| `Capability` | `ref` (`collector:<collector>:<metric>:<domain>`, stable across detections), metric, domain, collector, collector version, unit, status, `has_guidance`, `min_interval_s` (the fastest interval the collector supports, from its probe or adapter). |
| `CapabilityReport` | Host (OS, version, distribution, CPU, GPUs, hostname), `detected_at`, capabilities. |
| `enabled_metrics(report, mode) -> Sequence[Capability]` | Empty for `OFF`; otherwise only `AVAILABLE` capabilities. **[R102, R104]** |
| `limitations(report, mode, interval) -> Sequence[Limitation]` | One per unavailable metric with its cause, one per collector whose minimum is slower than `interval` ("nvidia-smi samples every 2 s"), or a single `monitoring off` limitation. Never blocking. Feeds M07's `SetupFacts` and results. **[R103, R106, R146]** |
| `Sample` | `t` (wall time and monotonic offset), `ref`, value or `None`, unit, source, scope, `missing_reason`. A failed read is a `None` sample, never 0. **[R106, R147]** |
| `ProcessObservation` | `configuration_id \| None`, root pid/pgid, CPU time, peak RSS, `attribution: HARNESS_TREE \| SEPARATE_SERVER`, `endpoint_kind: LOCAL \| CLOUD`, note. A local model server outside the harness group is `SEPARATE_SERVER` with `configuration_id=None`. **[R107, R111]** |
| `counter_delta(readings, max_range) -> Derived` | Sum of positive steps; a decrease with a known `max_range` is a wraparound (`+max_range`, event recorded); a decrease without one is a reset that splits the interval and leaves the gap uncovered. **[R112]** |
| `integrate_power(samples, interval) -> Derived` | Rectangle integration of present samples only, with the collector's effective interval; gaps are not interpolated; result is always `estimate=True`. **[R112, R113]** |
| `Derived` | `wh: Decimal \| None`, `method: COUNTER_DELTA \| POWER_INTEGRATION`, `estimate`, `coverage` (covered seconds / window seconds), `events` (wraparounds, resets, gaps with start and length). `coverage < 1` is `PARTIAL`; no samples is `UNAVAILABLE`. |
| `derive_energy(domains, series, window) -> Sequence[EnergyObservation]` | Per domain: `counter_delta` when the domain has an energy counter, else `integrate_power`. **[R112]** |
| `EnergyObservation` | Domain, scope, `window`, `Derived`, source, source definition text, `summed: bool`. |
| `non_overlapping(observations) -> EnergyScope` | Marks child domains (`CPU_SUBDOMAIN`, `SOC_SUBDOMAIN`) of a measured parent `summed=False`; the scope is the set of measured top-level domains plus `not_measured` (the rest of the host). Package + cores and SoC + subdomains are never added. Label text such as "CPU package + GPU · not system". **[R113, R114]** |
| `Window` | `EXPERIMENT`, or `SEQUENTIAL(configuration_id, trial_index, task_id \| None, start, end, includes_background=True)`. |
| `allocation(scheduling) -> Allocation` | `NONE` when more than one configuration could run at once; `PER_WINDOW` only when the run's scheduling is `jobs == 1`. There is no function that divides experiment energy among configurations. **[R109, R110, R147]** |
| `window_energy(observations_per_domain, windows) -> Sequence[WindowEnergy]` | Only callable with `PER_WINDOW`; one row per configuration and trial (task windows inside it summed), with the `non_overlapping` scope label and coverage; every row carries `includes_background=True`; the total row is the sum of windows and is labelled not exclusive. **[R110, R113]** |
| `downsample(series, points) -> Sequence[Bucket]` | Mean per bucket; a bucket that contains a missing sample is flagged `gap`, a bucket with no sample is `None`. |
| `guidance_for(capability, host, catalog) -> Guidance` | Commands only when the catalog has an entry verified for the host's OS and distribution version; otherwise links only. `UNSUPPORTED_HARDWARE` never carries an install command. **[R103, R105]** |

Domain errors: `InvalidMode`, `InvalidInterval`, `UnknownCapability`, `NotSequential`, `NoTelemetry` (result recorded with monitoring off), `UnknownResult`.

#### Ports (`engine/telemetry/ports.py`)

```python
class CollectorProbe(Protocol):              # one adapter per CollectorId
    collector: CollectorId
    async def probe(self, host: Host, timeout_s: float) -> Sequence[ProbeOutcome]: ...   # includes min interval
    async def open(self, caps: Sequence[Capability], interval: CollectorInterval) -> SampleSource: ...

class SampleSource(Protocol):
    async def read(self) -> Sequence[Sample]: ...   # one tick; never raises for a missing value
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
    async def open_collection(self, run: RunId, meta: CollectionMeta) -> None: ...
    async def append(self, run: RunId, samples: Sequence[Sample]) -> None: ...
    async def append_processes(self, run: RunId, obs: Sequence[ProcessObservation]) -> None: ...
    async def finish(self, run: RunId, summary: ExperimentTelemetry) -> None: ...
    async def load(self, run: RunId) -> ExperimentTelemetry | None: ...
    async def open_collections(self) -> Sequence[RunId]: ...             # for reconciliation

class CsvSink(Protocol):
    async def write(self, path: Path, rows: Iterable[Sequence[str]], overwrite: bool) -> WrittenFile: ...
```

Ports onto other modules, satisfied by their application interfaces or a thin adapter: `RunContext` (M11: `configuration`, `scheduling`, `windows`, plus the run directory), `ResultRecorder.append_hardware_samples` (M02), `RetainedResultReader.get` (M02, for imported and finished results), `EnergyCostReader` (M10, recorded electricity estimate of a run). `Clock` (wall and monotonic), `EventPublisher` and `EventSource` come from `engine/shared`.

#### Application (`engine/telemetry/application/`)

| Use case | Kind | Behavior |
|---|---|---|
| `DetectCapabilities` | job `telemetry.detect`; in-engine `CollectorCapabilities.detect` (M03) | Runs every `CollectorProbe.probe` concurrently with a 10 s timeout each; a timeout or crash becomes `COLLECTOR_FAILURE` for that collector only. `classify` each outcome, save the report, publish `telemetry.capabilities.updated` with before → after changes. A second request while one runs returns the running job's `JobRef`. Never installs, never escalates. **[R103, R104]** |
| `GetCapabilities` | query `telemetry.capabilities` | Last report, mode options, `limitations` per mode, capability flags. Runs `DetectCapabilities` first only when no report exists. |
| `GetGuidance(ref)` | query `telemetry.guidance`; in-engine `CollectorCapabilities.guidance` (M03) | `guidance_for` the capability on this host, plus the other causes' remedies for context. |
| `ValidateMonitoring(mode, interval)` | in-engine `MonitoringOptions.validate` (M07) | Returns `MonitoringChoice` or raises `InvalidMode` / `InvalidInterval`; also `limitations(report, mode, interval)` and the effective interval per collector for `SetupFacts`. |
| `StartCollection(run, choice)` | in-engine `ExperimentTelemetry.open(run, MonitoringChoice)` (M11, after `bind`) | `OFF`: records `monitoring off` and returns. Otherwise takes the current report (detecting first if none exists), computes `effective_interval` per collector from the frozen `sampling_interval_s`, opens or joins one `SampleSource` per collector with enabled metrics, stores `CollectionMeta` (mode, requested interval, effective interval per collector, collectors and versions, host, domains, scheduling), registers the run with the engine-wide `HostSampler`, publishes `telemetry.collection.started`. Never raises to M11: any failure is recorded as a limitation. **[R102, R106]** |
| `HostSampler` | owned asyncio task | One per engine. Keeps one schedule per open collection and collector at that collector's effective interval on the monotonic clock. Each collector's source is opened once per engine and shared: polled collectors are read when a schedule is due (one read serves every collection due at that tick); streaming collectors (`macmon pipe`, vendor tools) run at the fastest effective interval any open collection needs and each collection takes the latest reading at its own ticks. Concurrent configurations of one run share their run's collection, so no experiment gets a second host collection. A source that raises is closed; its metrics get `None` samples with `COLLECTOR_FAILURE` from that tick on, and `telemetry.collector.failed` is published. Missed ticks are recorded as gaps, not backfilled. **[R106, R147]** |
| `TrackProcessTree` | on `harness.task.started` / `harness.task.exited` (M05) | Registers the task's pgid against its configuration, samples `group_usage` on each tick, closes on exit. For a configuration whose frozen entry is a local endpoint, observes `listener(port)` as `SEPARATE_SERVER` with no configuration; cloud entries are marked `CLOUD` (client machine only). **[R107, R108, R111]** |
| `FinishCollection(run)` | in-engine `ExperimentTelemetry.close` (M11, after the last configuration ends and before `ResultRecorder.seal`) | Unregisters the run, closes sources, `derive_energy` over the experiment window, `non_overlapping`, `allocation` from `RunContext.scheduling`; with `PER_WINDOW`, `window_energy` over `RunContext.windows`. Writes the summary and calls `append_hardware_samples` for each result (one per configuration and trial): the shared experiment series and energy (same collection id and digest for every result), that result's window energy when sequential, plus its configuration's process observations. Publishes `telemetry.collection.finished`. **[R106, R109, R110, R112, R113]** |
| `ReconcileCollections` | engine start | For each collection left open by a dead engine: finish it with coverage ending at the last stored sample. Nothing is extrapolated. |
| `GetExperimentTelemetry(result, points)` | query `telemetry.experiment` | Loads from `TelemetryStore` for local runs or from M02's retained record for imported ones; downsamples; adds M10's recorded electricity estimate unchanged. |
| `ExplainEnergy(result)` | query `telemetry.energy` | Domain rows with method, events and result; the fixed statements (preferred method, gap, overlap, label, allocation) as engine text. |
| `GetWindowEnergy(result)` | query `telemetry.windows` | `window_energy` rows; raises `NotSequential` for concurrent runs. |
| `ExportCsv(result, path, overwrite)` | command `telemetry.export_csv` | One row per sample with timestamp, ref, domain, scope, unit, source, value or empty, missing reason. |
| `DescribeSamples(samples)` | in-engine `TelemetryDescriber.describe` (M13) | Scope, source, coverage and limitation labels for timelines; pure. |
| `EnergyObservations(run)`, `WindowEnergyObservations(run)`, `HostEnergyScope()` | in-engine `EnergySource` (M10: `observations`, `window_energy`, `host_scope`) | Experiment observations with scope, window, coverage and source; for `PER_WINDOW` runs only, per configuration and trial window energy in kWh with the scope label, coverage and `includes_background` (empty for parallel runs, so M10 never receives a divided share); the scope label the current host can measure. **[R110, R114]** |

Application interfaces offered to other modules (`engine/telemetry/application/interfaces.py`): `CollectorCapabilities` (M03), `MonitoringOptions` (M07), `ExperimentTelemetry` (M11), `EnergySource` (M10), `TelemetryDescriber` (M13).

#### Adapters (`engine/telemetry/adapters/`)

| Adapter | Implements | Notes |
|---|---|---|
| `psutil_collector.py` | `CollectorProbe` (`PSUTIL`), `ProcessTreeReader` | Host CPU utilization and memory; process groups by `os.getpgid` over `psutil.process_iter`; `listener` through `psutil.net_connections`. `AccessDenied` on a member is a partial observation, not a failure. |
| `macmon_collector.py` | `CollectorProbe` (`MACMON`) | Probes `macmon --version`; streams `macmon pipe` JSON as a child process in its own process group. Apple Silicon only. |
| `powermetrics_collector.py` | `CollectorProbe` (`POWERMETRICS`) | Probe runs `powermetrics -n 1` without privilege escalation; a root requirement is `INSUFFICIENT_PERMISSION`. |
| `powercap_collector.py` | `CollectorProbe` (`POWERCAP_RAPL`) | Reads `/sys/class/powercap/*/name`, `energy_uj`, `max_energy_range_uj` and the zone hierarchy (parent links); no `/sys/class/powercap` is `MISSING_DRIVER_OR_KERNEL_INTERFACE`, `EACCES` on `energy_uj` is `INSUFFICIENT_PERMISSION` with path and mode. |
| `nvidia_collector.py` | `CollectorProbe` (`NVIDIA_SMI`) | NVML through `nvidia-ml-py` when importable, otherwise `nvidia-smi --query-gpu=… --format=csv`; uses the total-energy counter where the device reports one, otherwise power samples. |
| `amd_collector.py` | `CollectorProbe` (`AMD_SMI`) | `amd-smi metric --json`; energy counter where exposed. |
| `subprocess_allowlist.py` | — | The only way the collectors above spawn processes: fixed executables and read-only arguments; `sudo`, package managers and `chmod` cannot be expressed. |
| `platform_host.py` | `HostInfo` | `platform`, `/etc/os-release`, `sw_vers`, CPU and GPU names. |
| `packaged_guides.py` | `GuideCatalog` | `docs/collectors/*.md` and `guidance.yaml` in the package: entries keyed by collector, cause, OS, distribution id and version, with commands, the guide path and the reference links named in the product contract (macmon, powercap, NVIDIA SMI, AMD SMI). |
| `jsonl_store.py` | `TelemetryStore` | Files below. Samples appended as JSON lines and flushed each tick; summaries written with temp file and rename. |
| `csv_sink.py` | `CsvSink` | Refuses an existing file unless `overwrite`. |
| `run_context.py`, `results_bridge.py`, `energy_costs.py` | ports onto M11, M02, M10 | Thin mappings; no rule. |
| `rpc.py` | — | DTOs in `axbenchmark.api.telemetry`; domain errors to the codes below. |

#### Persisted state and owned processes

| Path | Content |
|---|---|
| `~/.axbenchmark/telemetry/capabilities.json` | Last `CapabilityReport`. No credentials. |
| `<run dir>/telemetry/collection.json` | `CollectionMeta`: mode, requested sampling interval, effective interval per collector (with `raised`), host, collectors and versions, domains with parents, scheduling, started/ended, state `open \| finished \| reconciled`. |
| `<run dir>/telemetry/samples.jsonl` | One line per tick and ref; `null` values with `missing_reason`. |
| `<run dir>/telemetry/processes.jsonl` | `ProcessObservation`s per tick (cumulative CPU time, RSS). |
| `<run dir>/telemetry/summary.json` | Derived `EnergyObservation`s, `EnergyScope`, `Allocation`, window energy per configuration and trial when sequential, per-metric summaries and coverage. |

Retained results carry the same content through M02; imported results are served only from M02. **Owned processes:** probe subprocesses (bounded by timeout, process group killed on expiry) and, while a collection is open, long-running collector children (`macmon pipe`, vendor tools). All are children of `axbenchmarkd`, never of a client, and end when the last collection closes or the engine stops. A collector process crash ends that collector only.

### 2. API surface (`telemetry.*`)

DTOs in `axbenchmark.api.telemetry`. Every value cell is `MeasuredDTO(value: str | None, unit, coverage: complete | partial | unavailable, coverage_pct?, estimate: bool, reason?)`, and every series or row carries `source` and `scope_label`, so interfaces render text and state without deriving either.

#### Queries

| Method | Request | Response | Errors | Capability flags | Safety |
|---|---|---|---|---|---|
| `telemetry.capabilities` | `sampling_interval_s?` (to preview effective intervals) | `CapabilitiesView {host: HostDTO, detected_at, modes: [{value, label}], default_mode, interval: {default_s: 1, min_s: 0.5, max_s: 10, requested_s}, rows: [CapabilityRowDTO {ref, metric, source, version?, scope_label, status: "on" \| "unavailable", cause?, cause_text?, has_guidance, min_interval_s, effective_interval_s, interval_raised}], energy_note, statements: [[label, text]], limitations_by_mode: {mode: [LimitationDTO]}, detection_job?: JobRef}` | — | `can_detect` (`reason: telemetry.detection_running`) | read |
| `telemetry.guidance` | `ref` | `GuidanceDTO {ref, title, host, source, found, cause, cause_text, commands?: {text, verified_for}, guide_path, references: [{label, url}], other_causes: [[cause, remedy]], continue_note}` | `telemetry.unknown_capability` | `can_copy_commands` | read |
| `telemetry.experiment` | `result_id`, `points: int = 80` | `TelemetryView {state: "collected" \| "off" \| "none", bar: str, provenance, host, concurrency_text, requested_interval_s, collector_intervals: [{collector, effective_interval_s, raised}], duration, series: [SeriesDTO {label, source, scope_label, unit, buckets: [float \| null], gap_buckets: [int], summary}], markers: [{at: float, label}], processes: [ProcessRowDTO {label, cpu_time, peak_rss, note, attribution, endpoint_kind}], process_note, energy: [[label, text]], energy_note, footnote}` | `telemetry.unknown_result` | `can_energy_detail`, `can_windows` (`reason: telemetry.not_sequential` or `telemetry.no_energy`), `can_export_csv` | read |
| `telemetry.energy` | `result_id` | `EnergyDerivationView {title, rows: [{domain, method, events, result: MeasuredDTO, summed: bool}], statements: [[label, text]], tariff_note?}` | `telemetry.unknown_result`, `telemetry.no_energy` | — | read |
| `telemetry.windows` | `result_id` | `WindowEnergyView {title, subtitle, columns: [str], rows: [{window, configuration_id, trial_index, duration, values: [MeasuredDTO], includes}], total: {…same}, scope_label, note}` | `telemetry.unknown_result`, `telemetry.not_sequential`, `telemetry.no_energy` | — | read |

`buckets` values are normalized to 0–1 per series by the engine; `gap_buckets` lists buckets that contain a missing sample. `markers` place configuration end times on the shared time axis.

#### Commands and jobs

| Method | Kind | Request | Response | Errors | Safety |
|---|---|---|---|---|---|
| `telemetry.detect` | job | — | progress `{collector, done, total}`; result `CapabilitiesView` | — (probe failures are rows with `COLLECTOR_FAILURE`) | read (probes only; no system change) |
| `telemetry.export_csv` | command | `result_id`, `path` (absolute), `overwrite: bool = false` | `WrittenFileDTO {path, rows, bytes}` | `telemetry.unknown_result`, `telemetry.no_telemetry`, `telemetry.target_exists`, `telemetry.invalid_target` | write |

Monitoring mode and sampling interval are stored by M07: `configs.set_execution(draft_id, monitoring={mode, sampling_interval_s})`, which returns `telemetry.invalid_mode` (`field: monitoring.mode`) or `telemetry.invalid_interval` (`field: monitoring.sampling_interval_s`) from `MonitoringOptions.validate`. M18 adds no method to `configs.*`.

#### Events

| Event | Payload | Topics |
|---|---|---|
| `telemetry.capabilities.updated` | `CapabilitiesView`, `changes: [{ref, before, after}]` | `telemetry` (snapshot `CapabilitiesView`) |
| `telemetry.collection.started` | `run_id`, `mode`, enabled refs, `requested_interval_s`, `collector_intervals` | `telemetry`, `run:<id>` |
| `telemetry.collector.failed` | `run_id`, collector, refs, `cause: collector_failure`, `at`, message | `telemetry`, `run:<id>` |
| `telemetry.collection.finished` | `run_id`, coverage per ref, energy available | `telemetry`, `run:<id>` |

#### Error codes

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
| `RunContext.configuration`, `.scheduling`, `.windows` (per configuration and trial), `.run_dir` (application interface) | M11 | Endpoint kind and port per configuration, concurrency, execution windows, `<run dir>/telemetry/`. |
| Calls to `ExperimentTelemetry.open(run, MonitoringChoice(mode, sampling_interval_s))` after `bind` and `.close(run)` after the last configuration ends and before `ResultRecorder.seal`, also on stop, identity halt and reconciliation | M11 | One collection per experiment at the frozen interval, closed before results are sealed. |
| Routing of `telemetry.collection.*` and `telemetry.collector.failed` to `run:<id>` through `TopicRegistry` | M11 | Run log visibility of collector failures. |
| `events.subscribe`, `jobs.get`, `jobs.cancel`, `job.progress`, `job.finished` | M11 | Subscriptions and job supervision. |
| Events `harness.task.started` (pid, pgid), `harness.task.exited` | M05 | Process-tree association per configuration. |
| `ResultRecorder.append_hardware_samples`, `RetainedResultReader.get` | M02 | Retain samples with each result; serve imported results. |
| `t` binding on `ResultScreen` (ResultOrigin) pushing `TelemetryScreen(result_id)`, enabled from the result capability `can_telemetry` | M02 | Entry point named in the TelemetryScreen tree ("t from a result"). |
| `MeasurementReader` energy costs of a run (recorded tariff estimate with scope); caller of `EnergySource.window_energy` | M10 | Electricity line of `#energy` and the tariff note, shown unchanged; local configuration cost in sequential runs. |
| `configs.set_execution(draft_id, monitoring={mode, sampling_interval_s})`; `SetupView.execution.monitoring`; Setup's Monitoring row pushing `MonitoringScreen(draft_id, current)` | M07 | Storing mode and interval; entry point. |
| `environment.explain(ref)` accepting M18 capability refs; `CollectorGuideScreen`; `environment.recheck(scope="collectors")` | M03 | Guidance dialog and recheck from Environment and from MonitoringScreen. |
| `CollectorCause` imported from `engine.telemetry.domain` in M03's readiness domain | M03 | One five-cause vocabulary. |
| App shell `app.client`, `ContentSwitcher` state widgets, `-compact` class, shared `ActionState` view-model type, `PromptScreen` for the Export CSV path (not drawn in the wireframes) | M15 | Hosting the screens; the Export CSV path. |

### 4. Screens

Owned artboards: MonitoringSettings, Telemetry, EnergyDetail, SequentialEnergy ([navigation §23](../design/wireframe-tui/navigation.md)). CollectorGuide is drawn on the M18 page but is `CollectorGuideScreen` in `tui/screens/environment.py`, specified by [M03](03-environment-readiness.md); its content is M18's `GuidanceDTO` passed through `environment.explain`. CurrencyEnergy is M10's screen and shows M18's scope through `measurements.preview_accounting`.

Shared rules: loads run in an `exclusive=True` worker through the injected client; data widgets sit in `ContentSwitcher`s with `#x`, `#x-loading`, `#x-empty`, `#x-error`; errors show the engine's `message` and `remedy` verbatim with a Retry that repeats the load; `check_action` returns `None` (dimmed) from capability flags only. No screen classifies a cause, decides an enabled metric, sums energy, computes coverage or decides whether windows apply.

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
| Subscription | When the result belongs to an active run: `events.subscribe(["run:<run_id>"])`; `telemetry.collection.finished` reloads. Otherwise none. Dropped on unmount. |

| Binding | Action | API call |
|---|---|---|
| `esc` | `app.pop_screen` | none |
| `e`, Button `#energy-detail` | `energy_detail` | `telemetry.energy(result_id)`, then push `EnergyDetailScreen(view)`; enabled by `can_energy_detail` |
| `w` | `windows` | `telemetry.windows(result_id)`, then push `WindowsScreen(view)`; enabled by `can_windows`, dimmed with its reason otherwise |
| Button `#export-csv` | `export_csv` | `telemetry.export_csv(result_id, path)` with the path from M15's `PromptScreen`; `telemetry.target_exists` offers overwrite, which repeats the call with `overwrite=true`; enabled by `can_export_csv` |
| `tab` | `focus_next` | none |

#### EnergyDetailScreen — artboard EnergyDetail

`EnergyDetailScreen(ModalScreen[None])` in `tui/screens/telemetry.py`, constructed with the `EnergyDerivationView` already loaded by TelemetryScreen. `Vertical #energy-detail .dialog` > `DataTable #energy-domains` (Domain, Method, Events, Result; `summed=False` rows in the muted class with the engine's "shown, not summed" text), `Static .kv` (statements: Preferred, Gap, Overlap, Label, Allocation), tariff note, Close. No load, no subscription. `esc` → `dismiss`, no API call.

#### WindowsScreen — artboard SequentialEnergy

`WindowsScreen(ModalScreen[None])` in `tui/screens/telemetry.py`, constructed with the `WindowEnergyView`. `Vertical #windows .dialog` > subtitle, `DataTable #window-energy` (Window — configuration, and trial when there are several — Duration, then `columns`, Includes; the total row in bold), scope label, `Static #windows-note` (`note`), Close. Column headers come from the DTO, so a host without a GPU shows no GPU column. `esc` → `dismiss`, no API call.

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

| Level | Tests |
|---|---|
| Domain (`tests/engine/telemetry/domain/`) | `classify`: tool present and no sensor → `UNSUPPORTED_HARDWARE`; `energy_uj` mode 0400 root → `INSUFFICIENT_PERMISSION`; no `/sys/class/powercap` → `MISSING_DRIVER_OR_KERNEL_INTERFACE`; timeout and garbage output → `COLLECTOR_FAILURE`; absent executable → `MISSING_TOOL`; each of the five is distinct. `enabled_metrics` is empty for `OFF` and never contains an unavailable metric. `counter_delta` over a wraparound with known range equals the true delta and records one event; a reset without range leaves partial coverage. `integrate_power` with a 74 s gap gives an estimate with coverage < 1 and no interpolated value; no input yields 0 from missing samples. `non_overlapping` never adds `intel-rapl:0` and `intel-rapl:0:0`, and labels CPU package + GPU as not system. `allocation` is `NONE` for jobs > 1; `window_energy` rows all include background, carry the scope label and the total matches the sum of windows (the R-0919lab-1 fixture: seven windows adding to 27:30); two trials of one configuration give two rows. `validate_interval` accepts 0.5, 1 and 10 and rejects 0.4, 10.5, 0 and text, never clamping; `effective_interval` raises a 0.5 s request to a collector's 2 s minimum with `raised` and keeps 1 s for a collector whose minimum is 0.5 s. `guidance_for` returns no commands for an unverified distribution and none for unsupported hardware. Property tests (hypothesis): coverage is `COMPLETE` only when every tick has a value; energy is monotonic in covered samples. |
| Use cases (fakes for every port) | `DetectCapabilities` with one probe hanging returns the others and a `COLLECTOR_FAILURE` row; no fake records any install or permission call. Two concurrent configurations produce one `HostSampler` read per tick; two overlapping runs at 1 s and 2 s share one source per collector and each collection records its own interval. A collection records requested and effective intervals in `collection.json`. `EnergySource.window_energy` is empty for a `jobs 4` run and has one row per configuration and trial for a `jobs 1` run. A source that raises mid-run publishes `telemetry.collector.failed`, keeps the run going and leaves `None` samples. `TrackProcessTree` attributes a fake harness group per configuration and a fake local listener as `SEPARATE_SERVER`; cloud entries are marked client only. `FinishCollection` appends the same collection digest to every result before seal. `ReconcileCollections` ends coverage at the last sample. `OFF` records "monitoring off" and starts no source. |
| API via `InProcessClient` | Composed engine with fake collectors and harness, no interface: launch a three-configuration run, subscribe to `run:<id>`, observe `telemetry.collection.started` and `.finished`; `telemetry.experiment` returns `can_windows=false, reason=telemetry.not_sequential`, and `telemetry.windows` returns that code; a `jobs 1` run returns window rows. Drop the client mid-run and reconnect with `since_seq`: one collection, no duplicate samples. `telemetry.export_csv` writes empty cells for missing samples and refuses an existing file. Error codes and DTOs validate against the exported JSON Schema. |
| Screens (`App.run_test()` with a fake client) | MonitoringScreen renders the wireframe's five `#detected` rows from a `CapabilitiesView` fixture with their effective intervals, `ctrl+s` issues exactly `configs.set_execution(draft_id, monitoring={mode: "off", sampling_interval_s: "1"})` after selecting Off, `telemetry.invalid_interval` from the fake marks `#sampling-interval`, `#guidance` is dimmed on a row without guidance. TelemetryScreen renders gaps as `·` from `gap_buckets`, `separate_rows` in bold, and the `off` state in `#telemetry-empty`; `w` is dimmed from `can_windows` and issues no call; `e` issues `telemetry.energy` once and pushes EnergyDetailScreen. View-model builders are tested without Textual against DTO fixtures taken from `screens-telemetry.mjs`. Import-linter: `tui` imports only `api` and `client`. |
