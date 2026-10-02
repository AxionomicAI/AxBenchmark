# M18.3 — macos-collectors

Parent: [M18 adapters and discovery](../../18-hardware-monitoring.md#1-engine-component). Requirements: R102–R108, R111–R113, R146–R147. Findings: F12 adapter evidence; consumes F02/F03/F06 lifecycle contracts.

Outcome: bounded read-only macOS collectors and host/version-specific guidance expose only measurements actually supported by the probed host.

## Entry conditions

**Completed prerequisites:** Bootstrap, [M18.2 sampling lifecycle](02-sampling-lifecycle.md), including M18.1 domain vectors, real M02 retention and shared subprocess/resource lifecycle seams.

**Published contracts allowed as fixtures:** M03 environment explanation/recheck, M07 monitoring draft, M05 scoped process associations and M11 RunContext. Real provider wiring remains required before parent acceptance; this child adds no scheduler dependency.

Before coding an adapter, record supported macOS/tool/psutil versions, official or maintainer documentation, captured help and representative sanitized output. No available host or undocumented output means an explicit unsupported/unverified branch, not a guessed parser.

## Exact proposed ownership

- `axbenchmark/engine/telemetry/adapters/macos_psutil.py`, `macmon_collector.py`, `powermetrics_collector.py`, `macos_registration.py`.
- Proposed guides `docs/collectors/macos.md`, `docs/collectors/macmon.md`, `docs/collectors/macos-powermetrics.md`, and `docs/collectors/guidance/macos.yaml` (entries consumed by M18.2's packaged guide loader).
- `tests/engine/telemetry/adapters/test_macos_psutil.py`, `test_macmon.py`, `test_powermetrics.py`, `test_macos_guides.py`.
- `tests/fixtures/telemetry/macos/manifest.json`, `psutil.json`, `macmon.jsonl`, `powermetrics.txt`, `failures.json`; include source/version/OS/device/provenance metadata.
- `tests/integration/test_macos_telemetry.py` with explicitly marked real-supported-host cases; record unsupported/unavailable combinations in the fixture manifest.

M18.2 owns the psutil registration dispatcher, process runner, store, sampler, allowlist enforcement and packaged-guide loader. This child registers its macOS implementation through those hooks; preserve the Linux sibling's registrations and files.

## Collector and documentation contracts

Implement CollectorProbe.probe(host, timeout_s) and open(capabilities, interval) -> SampleSource, whose read returns scoped source readings and close releases the owned child. Implement ProcessTreeReader through the platform adapter using documented observable operations.

Probe each metric separately. Emit ProbeOutcome with tool/version, raw evidence, sensor/domain identity, units, semantics, actual timing constraints and cause; M18.1 alone classifies availability. A missing field is unavailable, not a default 0.

Use the [psutil documentation](https://psutil.io/) for supported process/system APIs and version/platform exceptions. Capture denied/exited/reused-process cases. Keep observable harness-tree CPU time/RSS separate from host readings and outside model servers; never infer energy from process CPU percentages.

The [macmon maintainer documentation](https://github.com/vladkens/macmon) describes installation and JSON `pipe` output. Gate argument/output mappings by the captured supported version and probe actual Apple Silicon metrics before enabling them; availability of the executable alone proves nothing about a field on this host.

Keep macmon active/scaled utilization definitions distinct where exposed. Preserve source-specific CPU/GPU/SoC domain meaning; a field name containing system/all is insufficient evidence of wall-socket power or nonoverlap. Register verified aliases before M18.1 selection.

For powermetrics, consult the supported macOS host's installed Apple manual/help before choosing bounded read-only flags and parsers. Record that documentation/version with the fixture; this spec does not promise one output schema or privilege model across macOS releases.

Probe without escalation. Permission denial maps to the permission cause with documented guidance; never run sudo or suggest running AxBenchmark as root. Missing tool, missing interface, unsupported hardware and parse/timeout failure remain separate outcomes.

Read-only subprocess arguments are fixed/version-approved; no shell, arbitrary command, installation, stress mode or service installation. Bound time, output size and shutdown; slow/failed collectors must not stop benchmarking or deadlock close.

Open a streaming collector only through the shared source lease. Record source sample timestamp/identity, observed duration and restart/epoch evidence. Reconfiguration, parser restart or lost samples must not silently preserve continuity or refresh stale data.

Only publish counter semantics supported by documentation and device evidence. If reset/continuity/bound proof is insufficient, preserve raw readings and uncovered counter intervals; supported power may supply explicitly estimated energy under M18.1 rules.

## Guidance and ownership of presentation

Guidance entries are keyed by collector/cause/macOS version, with reference URL, verification date, exact tested version and command provenance. Commands appear only for a verified matching host; otherwise present links and the unresolved condition.

No installation command accompanies unsupported hardware. A recheck calls M03 environment.recheck(scope="collectors") through its existing flow; this child does not install tools, change permissions or own CollectorGuideScreen.

No UI files. Supply MonitoringSettings availability/requested/effective/observed interval states, CollectorGuide's five causes, Telemetry partial/none and EnergyDetail source-definition/overlap/reset fixtures to M18.5/M03.

## Recorded-output and fault acceptance

Run `pytest tests/engine/telemetry/adapters/test_macos_psutil.py tests/engine/telemetry/adapters/test_macmon.py tests/engine/telemetry/adapters/test_powermetrics.py tests/engine/telemetry/adapters/test_macos_guides.py`.

1. Parse version-tagged recorded output into exact units/source/domain definitions. Missing/renamed fields, malformed/truncated JSON/text, NaN and unknown schema yield explicit unavailable/failure, never zero or a guessed supported version.
2. Test missing binary, permissions, absent interface, unsupported hardware, timeout/crash as five distinct causes; successful tool/version output without a measured metric stays unavailable.
3. A 0.5 s request to a 2 s minimum reports both intervals and actual timestamps; a stalled/repeated line makes a gap. No interpolation or implicit counter continuity after restart.
4. Replay M18.1 reset/wrap/source-duplicate vectors through the adapters' normalized outputs; selection precedes parent/subdomain suppression. Conflicting source definitions remain unsummed evidence.
5. Denied process member/exited PID/reused PID and external server fixtures preserve partial attribution and TrialRefs. Cloud fixture retains client-only limitation.
6. Force open/read/close cancellation, output overflow and last-lease shutdown. Shared source stays alive for another run; orphan cleanup performs no new collection. Assert no mutating subprocess can be expressed.
7. Every guide command matches its platform/version verification record; unsupported/unknown versions get links-only guidance, no automatic tool/permission changes or elevated AxBenchmark instruction.

## Real supported-host gate and pending parent work

Run the marked integration suite on an explicitly recorded supported Mac with available tools/permissions. Capture versions, device IDs, capabilities, actual intervals and independently observable output; demonstrate clean shutdown, optional denial/unavailability and M02 retained evidence. Do not intentionally reset real counters merely to test arithmetic.

Verify M03 recheck/explanation and M18.2→M10→M02 close/finalization using real observed data. Report exact tested combinations and remaining gaps; a macmon fixture or one supported Mac is not certification of all Macs/powermetrics versions.

**Pending parent obligations:** Linux adapters (M18.4), screens (M18.5), real M11 stop/recovery and cross-platform M03/M07/M10/M13/M14/M17 consumer gates. No hardware execution is claimed by this specification change.
