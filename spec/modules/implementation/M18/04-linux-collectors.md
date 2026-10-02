# M18.4 — linux-collectors

Parent: [M18 adapters and counter rules](../../18-hardware-monitoring.md#1-engine-component). Requirements: R102–R108, R111–R113, R146–R147. Findings: F12; consumes F02/F03/F06 persistence/scope contracts.

Outcome: read-only Linux psutil/powercap/NVIDIA/AMD adapters and distro-aware guidance retain sensor limitations and enough evidence to reject unsafe energy deltas.

## Entry conditions

**Completed prerequisites:** Bootstrap and [M18.2 sampling lifecycle](02-sampling-lifecycle.md), including M18.1 numerical fixtures and real M02 operation-ID retention.

**Published contracts allowed as fixtures:** M03 explanation/recheck, M05 process scope, M07 frozen monitoring and M11 run/trial windows. M18.3 is not an entry dependency; platform adapters register independently through M18.2's dispatcher/loader hooks.

Before implementation, prepare version-tagged recorded outputs and a documentation/support matrix for each candidate. Record distribution/kernel, vendor driver/library/tool versions, device identity, available fields/units, permissions and provenance. Missing suitable GPU hardware is an explicit real-gate limitation.

## Exact proposed ownership

- `axbenchmark/engine/telemetry/adapters/linux_psutil.py`, `powercap_collector.py`, `nvidia_collector.py`, `amd_collector.py`, `linux_registration.py`.
- `docs/collectors/linux.md`, `powercap.md`, `nvidia.md`, `amd.md`, `guidance/linux.yaml`.
- `tests/engine/telemetry/adapters/test_linux_psutil.py`, `test_powercap.py`, `test_nvidia.py`, `test_amd.py`, `test_linux_guides.py`.
- `tests/fixtures/telemetry/linux/manifest.json`, `powercap_tree.json`, `nvidia.csv`, `nvml.json`, `amd.json`, `failures.json`, including independent provenance/version metadata per fixture.
- `tests/integration/test_linux_telemetry.py` with individually marked powercap/NVIDIA/AMD real-supported-host cases.

M18.2 owns subprocess/allowlist, shared psutil dispatcher, scheduling/store and guide-loader infrastructure. Register Linux-specific implementations without changing the macOS sibling's files or inventing another sampler.

## Concrete adapter and evidence contracts

Implement parent CollectorProbe/SampleSource and ProcessTreeReader shapes. Return ProbeOutcome per metric with observed value, units, physical-domain mapping, source version/definition, timing constraints and continuity/reset evidence. Domain classification and energy arithmetic stay in M18.1.

Use [psutil's documentation](https://psutil.io/) for version-supported CPU/memory/process operations; fixture exceptions and partial member reads. Harness groups carry TrialRef/InvocationId/process-start identity; separate listeners are experiment rows, not owned model-server energy.

[Linux powercap documentation](https://docs.kernel.org/power/powercap/powercap.html) describes zone/subzone energy counters, ranges and resettable attributes. Enumerate observed sysfs hierarchy and canonical device identity; do not assume each distribution/kernel exposes the same path or sensor.

Read name, energy_uj and max_energy_range_uj only where found; preserve hierarchy and units. Never write reset/constraint files. Missing interface, denied read, unsupported metric and parse/read failure have different causes.

A range file is not proof of wrap or continuity. Record documented modulus semantics, boot/device/collector epochs and any trustworthy reset/continuity evidence and bounds. Without sufficient proof, decreases and other ambiguous intervals stay uncovered; do not invent a reset flag the kernel did not report.

[NVIDIA SMI documentation](https://docs.nvidia.com/deploy/nvidia-smi/) is the starting source for supported query fields and driver/device limits. Any NVML binding additionally requires its official API/version semantics before implementation. Probe individual fields, normalize unavailable markers and keep counter units/reset behavior conditional on actual support.

[AMD SMI documentation](https://rocm.docs.amd.com/projects/amdsmi/en/latest/how-to/amdsmi-cli-tool.html) is the starting source for read-only metric/output controls. Verify exact arguments, JSON schema, units and device support against the captured tool version; no universal counter or field is assumed.

Prefer supported counters only after M18.1 admission; supported power supplies estimates otherwise. A device index or matching marketing name is insufficient to merge physical domains; use proven aliases and keep unresolved overlap unsummed.

All vendor calls use bounded read-only allowlisted operations; no reset, power-limit, persistence-mode, driver/service installation or privilege change. Helper subprocesses use the M18.2 shared lease and cleanup path; no client-owned processes.

Record requested/effective/observed intervals and source sample identity. Driver reload, device removal, reboot, counter discontinuity, parser restart and unknown stale sample timing cannot silently become continuous measured energy.

## Guides, boards and consumer ownership

Guide entries carry distribution/version/tool applicability, source URL, verification date and tested command provenance. Unknown distributions/versions get documentation links only; never assume a package command is portable.

Permission guidance explains the detected read failure without running changes or suggesting elevated AxBenchmark. Unsupported hardware has no install remedy. Recheck remains M03 environment.recheck(scope="collectors").

No UI ownership. Supply CollectorGuide five causes, MonitoringSettings metric/interval limitations, Telemetry missing/partial GPU and EnergyDetail reset/duplicate/overlap states; M03 owns guidance screens and M18.5 renders telemetry boards.

## Recorded-output, numerical and fault acceptance

Run `pytest tests/engine/telemetry/adapters/test_linux_psutil.py tests/engine/telemetry/adapters/test_powercap.py tests/engine/telemetry/adapters/test_nvidia.py tests/engine/telemetry/adapters/test_amd.py tests/engine/telemetry/adapters/test_linux_guides.py`.

1. Captured sysfs trees retain package/subdomain identities and microjoule units exactly. Absent/denied/unreadable/malformed paths and disappearing devices return distinct truthful outcomes; all file operations remain read-only.
2. Normalize recorded NVML/SMI/vendor values including unsupported fields, unavailable markers, unit/schema changes, truncated output and unknown versions. No successful version probe substitutes for an actual metric read.
3. Run M18.1 950→30 true wrap, 100→10 known-range reset, unknown-range reset and long/multiple-wrap gap vectors. 100→10 with range 1000 never silently becomes 910; insufficient continuity proof is uncovered even on a tool that usually wraps.
4. Two sources for one GPU/package select once before parent/subdomain suppression; reordering device enumeration cannot change identity or add energy. Keep rejected-source bytes, selected policy and per-domain coverage.
5. Simulate driver reload, device removal, timestamp reversal, repeated/stale output, timeout and subprocess death; affected collector becomes partial/unavailable while execution and other collectors continue. Last lease cleanup cannot kill another run's source.
6. Fake PID reuse/member permission failures retain partial scoped process observations; no external server is assigned to the harness. CSV/retained evidence preserves TrialRefs, definitions and missing reasons.
7. Test matching versus unverified distro/version guides, all five causes and forbidden mutating arguments. No test installs software, writes sysfs or changes host permissions.

## Real supported-host gate and pending parent work

Run each marked powercap/NVIDIA/AMD gate only on available supported hardware; capture exact OS/kernel/device/driver/tool/permissions and independent readings. Verify timestamps/units, optional absence/denial, shutdown and retained source/scope. Recorded GPU output is parser evidence, not a real-GPU pass.

Compose real M03 discovery/recheck and M18.2→M10→M02 close on sequential and parallel runs, then M11 stop/recovery without resumed sampling. List every unavailable/untested combination explicitly; no requirement to obtain a sensor merely to benchmark.

**Pending parent obligations:** macOS adapters/gates (M18.3), all telemetry UI (M18.5), M14 doctor/CLI and M13/M17 offline consumer agreement. Platform support and real hardware checks are not claimed by this specification change.
