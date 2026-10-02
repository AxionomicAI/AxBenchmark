# M18 — Optional CPU and GPU monitoring

Status: proposed module contract derived from [SPEC.md](../SPEC.md). This describes required behavior, not implemented functionality. Requirement IDs refer to [source traceability](TRACEABILITY.md).

## Purpose and boundaries

Engineers implementing M18 must enable optional local hardware measurements without making a sensor a prerequisite for benchmarking. Monitoring defaults to automatic detection and may be disabled. Collect available CPU/GPU utilization, memory, power, energy, and temperature information only when compatible tools, hardware, and permissions permit it. A machine with no usable collectors remains able to benchmark. [R013, R102, R146]

M18 discovers telemetry capabilities, collects samples, derives appropriately scoped energy observations, and supplies their limitations to results consumers. It does not determine task success or allocate shared electricity usage to competing configurations. [R106, R109, R114, R147]

## Conceptual data and operations

The following contracts describe information that must survive collection and presentation; they do not prescribe storage classes or an implementation architecture.

| Concept | Required information and behavior |
|---|---|
| Capability observation | Collector identity and version, observed hardware capabilities, available metrics, and the specific reason a metric is unavailable. Detection must establish support before enabling a metric. [R103, R104] |
| Telemetry sample | Timestamp, device/domain identity, units, source, scope, value where available, and coverage. Preserve source-specific metric definitions and uncertainty. [R106, R113] |
| Process observation | Observable CPU time and memory attributable to a harness process tree, with its process association distinguished from host/device measurements. [R107, R108] |
| Energy observation | Measured counter delta or estimated integration of power, its device/domain and time window, source, units, and coverage limitations. [R106, R112, R113] |
| Electricity estimate | Optional tariff-based estimate retaining the energy observation's scope and uncertainty, clearly separated from provider cost and configuration rankings. [R114] |

Operations comprise detecting or rechecking capabilities, honoring monitoring disablement, collecting samples, associating observations with execution windows, deriving energy, and publishing samples and limitations. Collect host telemetry once per experiment, with a default sampling interval of one second; concurrent configurations consume that experiment's observations rather than creating duplicate host collections. Sampling and collector failures must not stop execution. Missing and partial data remain visibly unavailable or partial, never complete or zero. [R102, R106, R110, R112, R147]

## Discovery, guidance, and failure states

The Environment view and doctor must distinguish five unavailability conditions: a missing tool, insufficient permissions, missing drivers or kernel interfaces, unsupported hardware, and a collector failure. An unavailable metric must carry the applicable explanation; a single generic “monitoring unavailable” message cannot replace those distinctions. Users can continue while these limitations remain visible. [R103, R146]

Candidate sources are psutil for process/host telemetry, macmon or powermetrics on compatible Macs, powercap/RAPL counters on Linux, and NVIDIA or AMD vendor tools on supported GPUs. These are candidates, not guaranteed capabilities. Probe actual hardware support and collector versions before enabling measurements. Finding or installing a utility does not establish that a sensor exists or that the hardware can expose it. [R104]

For macOS and Linux, provide appropriate installation or setup guidance, supporting documentation, and a recheck action. AxBenchmark must not automatically install tools or change system permissions. Guidance must use verified platform-specific instructions rather than assume a package command works across Linux distributions. [R103, R105]

Future Apple Silicon guidance must retain the [macmon documentation](https://github.com/vladkens/macmon) reference for installation and JSON telemetry support. Relevant Linux guidance must reference [powercap documentation](https://cdn.kernel.org/doc/html/latest/power/powercap/powercap.html), [NVIDIA SMI documentation](https://docs.nvidia.com/deploy/nvidia-smi/), or [AMD SMI documentation](https://rocm.docs.amd.com/projects/amdsmi/en/latest/how-to/amdsmi-cli-tool.html), according to the detected platform and candidate source. These references do not promise support on any particular machine. [R104, R105]

## Attribution and energy invariants

Attribute process-tree CPU time and memory where observable. A separately running model server must not be assumed to belong to a harness process tree. Preserve the distinction between this attribution and host-wide, CPU-package, GPU, or SoC readings, labeling each by its actual scope. For cloud configurations, local telemetry describes the client machine; it cannot describe the provider's inference hardware. [R107, R108, R111]

Parallel execution remains the default. Shared-device energy belongs to the experiment and must not be divided arbitrarily among concurrent harnesses. Sequential execution permits displaying energy observed during each configuration's execution windows, but the display must explicitly include background activity and avoid exclusive-attribution claims. Sequential scheduling alone does not isolate electricity use. [R109, R110, R147]

Prefer energy-counter deltas when available. Otherwise integrate sampled power and label the derived energy as an estimate. Account for resets, wraparound, and missing samples, retaining partial coverage instead of presenting an incomplete interval as fully measured. Preserve the source's definitions and uncertainty. Do not add overlapping package, subdomain, and SoC measurements, and do not describe power estimates as wall-socket measurements. [R112, R113, R147]

An optional electricity tariff may produce a clearly labeled energy-cost estimate. Its scope follows the underlying measurement: CPU-package or GPU-only readings cannot justify whole-system electricity cost. Keep shared experiment energy separate from per-configuration rankings, and do not add overlapping energy charges to reported provider costs. [R114]

## Dependencies and handoffs

[M03 environment readiness](03-environment-readiness.md), [M15 TUI](15-terminal-interface.md), and [M14 command-line access](14-command-line-interface.md) expose capability explanations, setup guidance, and rechecks. [M07 configuration](07-run-configuration.md) carries monitoring choices. [M05 execution](05-harness-execution-isolation.md) supplies observable process associations; [M11 orchestration](11-run-orchestration.md) supplies experiment/concurrency context and execution windows. [R102, R103, R106–R110]

[M10 measurements](10-measurements-cost.md) preserves energy-cost distinctions; [M06 rankings](06-scoring-rankings.md) excludes shared-energy allocations. [M02 retained results](02-retained-results-comparability.md) and [M13 reports](13-standalone-html-report.md) consume samples, scopes, sources, coverage, and limitations without strengthening attribution claims. [R106, R108–R114, R147]

## Acceptance criteria

- Automatic detection is the default, explicit disablement works, and available metric families appear without requiring every sensor. [R013, R102]
- Each of the five unavailability conditions is distinguishable in Environment and doctor. Missing tools receive documented macOS/Linux guidance and a recheck action; no automatic installation or permission change occurs. [R103–R105, R146]
- Concurrent configurations share one host collection at the default one-second interval. Samples retain required metadata; collector or sampling failure leaves benchmark execution available and coverage honest. [R106, R147]
- Process-tree observations, external model servers, host/package/GPU/SoC scopes, and cloud-client limitations remain distinguishable. [R107, R108, R111, R146]
- Parallel energy has no fabricated competitor allocation. Sequential windows disclose background activity. Counter resets, wraparound, gaps, estimated power integration, and overlapping domains cannot produce falsely complete totals. [R109, R110, R112, R113, R147]
- Tariff estimates retain measured scope, remain separately labeled, and neither enter shared-energy configuration rankings nor duplicate provider charges. [R114]
