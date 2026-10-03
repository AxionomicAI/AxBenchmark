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

**Frozen domain contract.** Measurement detail exposes artifact_verification auxiliary usage/cost/coverage separately from competitor, grader and observer accounts, retaining evaluation/case/mode refs and unknown values from M10. The quality/evidence route receives functional observations only; no product counters enter rubric charts or competitor Gen/token/cost columns.

## Boards and state ledger

| Board / screen | Required states and navigation |
|---|---|
| Measurements / MeasurementsScreen | Wide and 80×24 compact; loading, no completed task, content, provisional, unknown/unexposed, partial, retained read error. Result bar names TrialRef and trial count; task selection loads formation; Σ row makes no task call. |
| MeasurementsPartial / same screen | Interrupted/halted cause, observed partial values, never-started unknown values, coverage explanation and finalization-pending/persistence-error notices; no completed/export-ready claim before retention readiness. |
| TimingPhases / TimingScreen | Loading/content/error, concurrent lanes, separate task/queue/planning/verification/judging and experiment totals; trial-specific result links; stale/missing intervals stay labelled. |
| CostBasis / CostBasisScreen | Loading/empty/error, reported/estimated/verified-zero/energy/unknown/mixed bases, declared billing, per-trial rows, mixed-currency USD notice and missing conversion. |
| CurrencyEnergy / CurrencyEnergyScreen | Setup editable display currency and tariff with cached rates; analysis frozen currency/rates plus original or alternative tariff, reset, field errors, no tariff/energy/rate, scope/coverage and pending/error states. |

Wireframes currently supply these board families but remain untouched by this spec work. Reconcile any missing explicit phase/trial, unverified-zero, missing-rate or finalization-pending state in a later design task; prototype rendering alone does not satisfy these functional tests.

Own `tui/screens/context.py`, `tui/viewmodels/context.py`, `tui/styles/context.tcss`, additive Measurements actions and `tests/tui/test_context_screen.py`/`test_context_navigation.py`. `ContextDetail` accepts an exact ContextTarget plus optional snapshot/AnalysisSelection; session selection uses `measurements.context.sessions`, then snapshot/history/segments/analysis queries. Both retained Measurements and M11 HarnessLive route here with resolved ResultId/full TrialRef/task/session/agent/window, never newest-trial fallback.

Render current-input and observed-history tabs, independent native total/limit/phase, category count/fidelity/basis, native/predicted labels/confidence and membership, gaps, transitions and retained raw-source availability. Unknowns show their reason, not zero/empty bars. Used-percent requires the returned compatible native total/limit; no client math invents categories or membership. Reclassify shows destination/budget and engine capability/setup reason before the explicit job call; navigation/import/read stays model-free. Subscribe to exact registered events on `measurements`, discarding stale query and subscription generations.

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

Make **Gen tok/s**, **In tok (cached)**, **Out tok (reasoning)** and **Files / LOC** primary measured columns through `measurements.result` and `measurements.trials`. Cached/reasoning detail and file_count/loc have independent null/partial states. Final Files/LOC appears only on delivered trial/summary rows, labelled “final snapshot size (baseline included)”; task rows cannot display an invented snapshot count. Show “pooled” and exact matched N/D plus per-trial range for generation; show means/ranges and separately labelled totals for counts.

Extend owned measurement VMs with source/policy/version/digest, units, complete roster, matched subset coverage, typed limitations and safe evidence/inventory references from the DTOs. Existing result/task detail loads expose the breakdown; they do not rescan, compute rates/means or classify files. Preserve advisory live-rate labels separately. Wide and compact views retain all four headings and allow scoped detail/scroll access to coverage, unmatched requests, binary/text/excluded inventories and not-recorded evidence.

**Route, comparison and profile interfaces.** Extend measurement detail/cost-basis DTO consumers with route/account price scope, gateway-versus-inference locality, request/attempt coverage, inclusive charge versus additive fee and separate verification diagnostic receipts. Forward the complete ResultFilters.harness_comparison selection to measurements.cost_bases; labels come from retained evidence, never current catalog. Display gateway host overhead, helper/retry costs and unknown internal coverage without subtracting guessed model compute.

## Integrated requirements

R192, R193 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R189 — [human review](../M12/05-human-review-web.md).

R187 — frozen domain profile/evidence contracts: [R187](../quality-judges/AGENTIC.md).

R173, R174, R176 — [benchmark statistics](../BENCHMARK-STATISTICS.md).

R166, R168, R172 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

**Human accounting acceptance:** Human wait/edit/save/submit timestamps are separately labelled M12 lifecycle observations with incomplete-observation limits. Model usage/API charge is not applicable and labor/host cost is unmeasured; do not manufacture an InvocationId, DecisionCallId, zero-price receipt or auxiliary inference account. Keep every competitor elapsed/token/cost/Gen/Files/LOC value and sealed measurement receipt unchanged across pending human wait, restart, submit and skip. Test those transitions while an unrelated automated run proceeds; measurement/detail views remain inspectable without opening the anonymous form.

## Acceptance and faults

**Route/profile acceptance:** Fake-client screens show localhost remote charges, unknown route prices/currency, duplicate receipt alternatives, separate diagnostic role and mismatch costs preserved after comparison exclusion.

**Domain acceptance:** Add same-server product evaluation partial/unknown account fixtures; no UI arithmetic merges them into competitor statistics.

Add both-size fixtures for generation 80 with complete pairs versus partial 400/5 out of 600 output, pooled 200 versus trial range 50–300, input mean 7/2 and independent Files known/LOC unknown. Assert matching source/policy/roster detail, baseline-included label, partial subset labels, no phantom task file counts, no derived zero/rate and unchanged scope after trial switch/reconnect.

Pilot ContextDetail at both sizes with native-only, unknown membership, partial partition, pending/deferred/failed analysis, compaction, capture gaps and disabled reclassification. Switch trial/agent/window while replies are delayed; preserve scope and selected ledger cutoff, no implied classifier call or percent on incompatible denominators.

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
