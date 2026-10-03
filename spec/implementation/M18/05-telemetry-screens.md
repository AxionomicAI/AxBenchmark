# M18.5 — telemetry-screens

Parent: [M18 screens/API](../reference/modules/18-hardware-monitoring.md#4-screens). Requirements: R102–R114, R134, R146–R147, R154–R155. Findings: F02, F03, F06, F12 presentation; consumes shared F04/F18 client contracts.

Outcome: users can configure optional telemetry and inspect retained source/scope/coverage and energy derivation without any screen performing attribution, pricing or sensor logic.

## Entry conditions

**Completed prerequisites:** Bootstrap, [M18.3](03-macos-collectors.md), [M18.4](04-linux-collectors.md), M10.2 final accounting and M15.1–2 client/shell foundations. Inherited M18.2 API/retention tests and platform recorded-output tests must pass; unsupported real-hardware combinations remain explicit parent gates.

**Published contracts allowed as fixtures:** M02 ResultScreen capabilities/TrialRef, M03 CollectorGuideScreen/environment explanation, M07 SetupView/configs.set_execution and M10 CurrencyEnergyScreen/recorded costs. M14 CLI/M13 reports are consumer gates, not UI code dependencies.

## Exact proposed ownership

- `axbenchmark/tui/screens/telemetry.py` (TelemetryScreen, EnergyDetailScreen, WindowsScreen); only MonitoringScreen additions in `axbenchmark/tui/screens/setup.py`, coordinated with M07's owner.
- `axbenchmark/tui/viewmodels/telemetry.py`, `axbenchmark/tui/styles/telemetry.tcss`; consume M15 ActionState, ErrorVM, SubscriptionHub, PromptScreen and shared modal/layout conventions.
- `tests/tui/test_monitoring_screen.py`, `test_telemetry_screen.py`, `test_energy_detail.py`, `test_sequential_energy.py`; `tests/tui/viewmodels/test_telemetry.py`.
- `tests/fixtures/telemetry/views/monitoring.json`, `telemetry.json`, `energy.json`, `windows.json`, `errors.json`, `same_label_trials.json`.
- `tests/integration/test_telemetry_navigation.py`, `test_telemetry_accounting_views.py` for cross-owner entry points and retained-data parity.

Do not implement CollectorGuideScreen in a second location: it belongs to M03's `tui/screens/environment.py`. CurrencyEnergy belongs to M10; CSV writes belong to M18.2; doctor/CLI rendering to M14 and HTML charts to M13. No wireframe edits are owned here.

## Concrete UI contracts

MonitoringScreen(draft_id, current) opens from SetupScreen's Monitoring row. Query telemetry.capabilities with the requested interval, preserve typed input/radio state across debounced responses and reject stale responses by selection/generation.

Save calls exactly configs.set_execution(draft_id, monitoring={mode, sampling_interval_s}); dismiss only after success. Display engine field errors beneath their controls. Guidance calls environment.explain(selected_ref) then M03 CollectorGuideScreen; do not classify a failure locally.

TelemetryScreen(result_id) opens on ResultScreen's t binding only when can_telemetry permits. The response supplies RunUid/TrialRef; preserve that identity through resize queries, energy/windows dialogs and CSV exports, even while another trial is active.

Query telemetry.experiment(result_id, points) through the injected client. Display requested versus effective/observed intervals, source/scope, actual coverage, process attribution, cloud-client/background limitations and M10's recorded cost unchanged.

Render engine-provided gap buckets distinctly; never connect missing data as measured coverage. Off/none shows the supplied explanation; partial numeric values retain their coverage; provisional/close-pending/error is visible before finalized retention.

Energy detail calls telemetry.energy once then pushes the loaded EnergyDetailScreen. Show source/physical-domain rows, method, wrap/reset/ambiguous-gap events, selected/rejected reasons and shown-not-summed overlap labels. No client source preference or arithmetic.

Windows calls telemetry.windows only when can_windows permits, then displays loaded WindowsScreen. TrialRef labels distinguish repeated trials; use supplied columns, totals, coverage and includes-background note. Parallel mode stays unavailable even if tasks happened not to overlap.

CSV prompts for a path through M15 PromptScreen, then calls telemetry.export_csv(result_id, path, overwrite=false). An existing-target response offers explicit overwrite and only then resubmits true; cancelled prompt/confirmation sends no write.

Use M11/M15 shared revisions, EventCursor and snapshot/resync machinery for telemetry/run topics. Unmount unsubscribes; disconnect cannot affect collection. Lower-sequence new epochs, overflow and stale queries cannot revert result identity or finalized state.

All loads use injected client workers and content-switcher loading/empty/error states. Render shared numeric error-envelope message/remedy and field details; Retry repeats the same scoped query. Capability flags alone enable actions; dimmed actions make no API call.

## Exact boards and supplied states

| Board | Required states and actions |
|---|---|
| MonitoringSettings | automatic/off; five availability causes; no collectors; requested/effective/observed interval differences; detecting/loading/error; invalid mode/interval; guidance/save/cancel |
| CollectorGuide (M03-owned) | five causes; matching verified commands versus links only; unsupported has no install; recheck/change/unchanged/error; no tool or permission mutation |
| Telemetry | collected complete/partial, off, none, loading/error; provisional/close-pending/error/finalized; same-label UID distinction, explicit trial; separate-server/cloud-client limits; export path/overwrite |
| EnergyDetail | real wrap versus known/unknown-range reset; multiple-wrap/gap uncertainty; source duplicates before parent/subdomain overlap; rejected rows visible; measured/estimated/unavailable; close |
| SequentialEnergy | repeated-trial identity, dynamic domain columns, partial edges/gaps, background activity; supplied total/scope; parallel/no-energy disabled; close |
| CurrencyEnergy (M10-owned) | recorded versus alternative tariff, frozen currency/rate basis, partial scoped energy and no energy/provider double charge |

Existing artboard names remain. Future board changes need source-selection/rejection rows, actual timing, explicit TrialRef and pending-finalization states; parent wires these follow-ups without changing ownership.

## Acceptance and fault checks

Run `pytest tests/tui/test_monitoring_screen.py tests/tui/test_telemetry_screen.py tests/tui/test_energy_detail.py tests/tui/test_sequential_energy.py tests/tui/viewmodels/test_telemetry.py tests/integration/test_telemetry_navigation.py tests/integration/test_telemetry_accounting_views.py`.

1. App.run_test/Pilot at wide and compact widths covers every board/state, focus traversal, Escape/back behavior and modal stack. Loading/empty/error never renders as numeric zero or complete coverage.
2. Choose off and enter 1: ctrl+s sends one configs.set_execution with the exact input; engine interval error stays inline. A slow older capability response cannot overwrite a newer interval or selected mode.
3. Two different RunUids sharing a label and two trials sharing task IDs retain the selected result/trial while active-trial events arrive. Resizes and reconnect refresh only that selected scope.
4. M18.1's 100→10 range-1000 reset displays uncovered/partial, never 910 energy; the 80 J package duplicate plus 20 J GPU example displays 100 J once, rejected source/child evidence intact.
5. Parallel w and no-energy e are dimmed from capabilities and make zero calls. Sequential repeated-trial rows preserve includes-background, source/domain coverage and engine-provided totals.
6. CSV cancel sends no command; target-exists sends no overwrite until confirmed. Success/error retains the selected ResultId; empty missing cells and exact identity are verified using the real M18.2 sink.
7. Stop/crash while close or M10 finalization is blocked shows pending/error, never finalized/report-ready. After durable receipt/seal, retained views and M10 CurrencyEnergy match exact kWh/scope/rate values without screen arithmetic.
8. Inject snapshot race, overflow, epoch change, field/general errors and late unmounted worker responses. No stale update, leaked subscription or duplicate command; import-linter rejects TUI engine/sensor imports.

## Real integration and pending parent work

Navigate actual M07 Setup → Monitoring → M03 guide/recheck; M02 retained result → Telemetry → Energy/Windows/CSV; M10 accounting views. Compare finalized local/imported M02 facts and M13 report timelines, including no-sensor and stopped partial runs.

Verify supported-host sensor data through the completed platform gates; UI fixtures alone do not prove real sensors. Cross-platform absence remains nonblocking and explicitly shown.

**Pending parent obligations:** all real M05/M11 process/recovery and M03/M07/M10/M13/M14/M17 consumer gates, plus documented untested hardware combinations and the board follow-ups above. A screen test pass does not complete M18.
