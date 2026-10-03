# M10.3 — measurement-screens

Parent: [M10 screen/API contract](../reference/modules/10-measurements-cost.md#4-screens). Requirements: R004, R077–R082, R096, R110, R114, R134, R147, R154, R156–R157. Findings: F02, F04–F08, F19; expose F03 finalization states.

Outcome: implement measurement, timing, cost-basis and currency/energy editors using the parent's exact DTOs and capabilities. Users can inspect their selected trial, understand incomplete accounting and apply/reset only an alternative tariff after launch.

## Entry conditions

**Completed implementation prerequisites:** [M10.2](02-final-accounting.md), M15.1 TUI foundation and M15.2 shell/subscription manager, M11.1–M11.2 client/event foundations and their fake-client wide/compact test harness. These are implementation gates, not claims of current completion.

**Bootstrap-published contracts, allowed as injected fixtures:** M02 Results/Result route targets and result/filter DTOs; M07 Setup draft/save return contract; M08 explicit TaskChecks result/trial/task/phase route; M06 ranking DTO passthrough; engine exact cost/display/coverage/error models. Other feature screens may be route spies for this child's isolated tests; their real navigation is the parent gate.

## Ownership

Own proposed files:

- `axbenchmark/tui/screens/measurements.py`: MeasurementsScreen and TimingScreen; `axbenchmark/tui/viewmodels/measurements.py`, `timing.py`.
- Only CostBasisScreen in `axbenchmark/tui/screens/results.py` and `axbenchmark/tui/viewmodels/cost_basis.py`; preserve M02's other screens in the shared file.
- Only CurrencyEnergyScreen in `axbenchmark/tui/screens/setup.py` and `axbenchmark/tui/viewmodels/currency_energy.py`; preserve M07's other screens in the shared file.
- `axbenchmark/tui/styles/measurements.tcss` and M10-owned palette/route registration entries, coordinated with M15.
- `tests/tui/test_measurement_viewmodels.py`, `test_measurements_screen.py`, `test_timing_screen.py`, `test_cost_basis_screen.py`, `test_currency_energy_screen.py`, `test_measurement_navigation.py`.
- `tests/fixtures/tui/measurements/` schema-valid responses for all listed state/size/currency/trial cases.

M14 owns CLI command implementation, M15 owns shell/reconnect mechanisms and M02/M07/M08 own adjacent screens. No engine/accounting, collector or wireframe source changes belong here. Shared-file edits must touch only the named classes/imports/registrations.

## Boards and state ledger

| Board / screen | Required states and navigation |
|---|---|
| Measurements / MeasurementsScreen | Wide and 80×24 compact; loading, no completed task, content, provisional, unknown/unexposed, partial, retained read error. Result bar names TrialRef and trial count; task selection loads formation; Σ row makes no task call. |
| MeasurementsPartial / same screen | Interrupted/halted cause, observed partial values, never-started unknown values, coverage explanation and finalization-pending/persistence-error notices; no completed/export-ready claim before retention readiness. |
| TimingPhases / TimingScreen | Loading/content/error, concurrent lanes, separate task/queue/planning/verification/judging and experiment totals; trial-specific result links; stale/missing intervals stay labelled. |
| CostBasis / CostBasisScreen | Loading/empty/error, reported/estimated/verified-zero/energy/unknown/mixed bases, declared billing, per-trial rows, mixed-currency USD notice and missing conversion. |
| CurrencyEnergy / CurrencyEnergyScreen | Setup editable display currency and tariff with cached rates; analysis frozen currency/rates plus original or alternative tariff, reset, field errors, no tariff/energy/rate, scope/coverage and pending/error states. |

Wireframes currently supply these board families but remain untouched by this spec work. Reconcile any missing explicit phase/trial, unverified-zero, missing-rate or finalization-pending state in a later design task; prototype rendering alone does not satisfy these functional tests.

## Load, events and actions

Measurements loads `measurements.result(result_id, tariff?)`; wide task highlighting calls `measurements.task(result_id, task_id)` for the selected task. Preserve explicit TrialRef/phase from the response for `enter` → M08 TaskChecksScreen. Historical navigation never resolves the active/latest trial.

`t` opens TimingScreen(run_uid); `b` opens CostBasisScreen(template_sha, filters); `u` opens CurrencyEnergy in analysis mode. These navigation actions make no accounting write; each destination performs its own documented load. Parent capability flags control bindings/buttons. Esc/unmount only navigates/unsubscribes.

Timing loads `measurements.timing(run_uid)`. CostBasis loads `measurements.cost_bases(template_sha, filters, tariff?)`. Live measurement/timing uses bare topic `measurements`; cost basis also uses `results`. Filter exact registered event names by ResultId/TrialRef/RunUid/template as appropriate. Use the shell's `(epoch, seq)` cursor, object revisions and replacement snapshots; ignore stale selection responses and old subscription generations.

CurrencyEnergy setup previews/validates the raw AccountingDraft through `measurements.preview_accounting`/`validate_accounting`. Return AccountingDTO to M07, which alone calls `configs.set_execution`. No catalog refresh/rate edit belongs in this modal. Label rates as `1 USD = 4000 COP`, with source/date/supplied state.

CurrencyEnergy analysis reads `measurements.accounting(run_uid, tariff?)`; frozen display currency is disabled/read-only and there is no rate input. Apply returns `TariffChoiceDTO(alternative=tariff)`, Reset returns `alternative=None`; caller reissues its read query exactly once with the tariff included/omitted. It never sends a currency/rate override or a launch-config write.

Every handler follows the parent action table: one API operation for save/preview/query actions, no API operation for pure navigation/reset. Render typed issue fields/messages verbatim. Use ContentSwitcher loading/empty/error/content states and restore focus after resize/modal dismissal.

## Presentation invariants

View models are pure DTO→text/state functions. Format `CostDTO.display` with its explicit currency code (`$` only for USD); show USD calculation amount separately in details. Missing display conversion remains unknown with reason even when USD is known. Never infer currency/verified zero from punctuation or rounded text.

Preserve basis, declared-billing label, source/rate dates, covered/expected tasks, original/alternative tariff and energy scope in totals, task details and trial mean/min/max. Displayed zero estimate remains estimate with unverified-zero information; M06 owns exclusion text in rankings.

Do not sum tokens/columns, convert money, price energy, compute means/minima or re-sort exact cost rows. Read ordered engine DTOs. Timing fractions used for drawing intervals do not change time measurements. Compact layout keeps coverage/currency notices and explicit trial selection available even when formation/summary panes collapse.

## Acceptance and faults

Run the proposed suite:

```sh
pytest tests/tui/test_measurement_viewmodels.py tests/tui/test_measurements_screen.py tests/tui/test_timing_screen.py tests/tui/test_cost_basis_screen.py tests/tui/test_currency_energy_screen.py tests/tui/test_measurement_navigation.py
```

1. Feed exact USD `2107/10000` with display 0.21 and COP `4000/1` fixtures; assert currency/basis labels from DTOs, never local conversion. Missing COP rate shows unknown display and known USD detail; mixed COP/EUR view shows USD notice.
2. Pilot every board/state at wide and 80×24, including empty, read error, partial 5/7, no energy, unverified zero and declared API verified zero. Assert focus order, overflow, accessible button labels and capability-disabled actions.
3. Select trial U/c/1 T1 while U/c/2 runs, then receive a late trial-2 response/event. Preserve trial-1 formation/check route; phase identifies post-task versus final regression. Same-label V/c opens only by its resolved UID/result.
4. Setup Save returns one validated AccountingDTO; M07 spy receives one eventual set_execution call. Analysis Apply/Reset causes one caller read with tariff present/absent and no currency/rate/config-write fields; Cancel has no mutation.
5. Invalid amount/nonfinite/unsupported currency displays every returned field issue and preserves typed input. Missing conversion is a notice, not a guessed number or validation failure; rate table remains read-only in both modes.
6. Inject newer snapshot then stale replay, epoch reset and overflow resync. Assert shell-managed replacement and no lost measured row; unmount releases subscription without stopping execution. Delay query after selection change and reject its stale response.
7. Show finalization persistence error/pending while measurements exist; do not enable completion/export routes based on a nonempty table. Later finalized notification refreshes once; post-seal judging timing never changes competitor cost/time cells.
8. Import-boundary test forbids engine imports; spies fail if UI attempts arithmetic/provider/rate writes. Each binding and Σ/task row action issues precisely the parent call or navigation operation.

## Real integration and pending parent work

Compose actual M02 Results/Result, M07 Setup, M08 TaskChecks, M10 API and M15 shell. Navigate retained repeated trials through live updates, inspect timing/billing/currency, apply/reset a tariff and verify retained digests unchanged. Exercise socket reconnect/resize while a delayed finalization completes; confirm explicit trial/phase navigation and typed errors remain correct.

**Pending parent obligations:** real M05/M08 observation/M11/M18 retention barrier from M10.2, M06 ranking currency/zero gates, M13 offline reports, M14 CLI and M17 exchange parity. This screen child requires no paid model invocation; provider/platform verification belongs to those owners and remains explicit until performed.
