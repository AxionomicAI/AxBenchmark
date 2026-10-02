# M02.3 — results-screens

Parent: [M02 screens](../../02-retained-results-comparability.md#4-screens). Requirements: R035, R067, R076–R082, R114, R116, R122–R124, R134, R143, R153, R154. Findings: F02, F03, F06, F09; consume F07 presentation fields and F14 import states.

Outcome: retained trials and details remain correctly scoped through all Results actions, including pending retention, invalidation, review and import/export entrypoints. This child implements clients, not result/scoring/accounting decisions.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M02.2](02-retention-services.md), M06.1 scoring service, M10.2 final accounting, M15.1–2 app/focus/widget foundations (child IDs in [recommendations](../../../recommendations.md)).

**Bootstrap-published contracts, allowed as injected fixtures:** M06 ranking/weights/breakdown navigation, M08 TaskChecks/EvidenceViewer, M10 CurrencyEnergy/Measurements/CostBasis, M12 rejudge options/job, M13 report outcome/reveal, M17 `ExchangeScreens.import_results(template_sha256, path?)`/`.export_results(run_uid)` factories and M18 telemetry entry points. Inject clients and navigation factories; real owning screens remain integration gates. Do not duplicate their engines, screens or conversion rules.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/tui/screens/results.py` (ResultsScreen, RejudgeScreen, ReportScreen), `axbenchmark/tui/screens/result.py` (ResultScreen).
- `axbenchmark/tui/viewmodels/results.py`, `result.py`, `result_review.py`, `report_ready.py`; `axbenchmark/tui/styles/results.tcss`, `result.tcss`.
- `tests/tui/test_results_viewmodels.py`, `test_results_screen.py`, `test_result_screen.py`, `test_results_exchange_entries.py`, `test_rejudge_screen.py`, `test_report_ready.py`; scoped fixtures in `tests/tui/fixtures/results/`.

The parent owns exact method/argument/event/binding contracts. Use `result_id` for selected historical records and `run_uid` for export; carry returned TrialRef/task/phase when opening evidence or checks. Labels are display text; collisions show origin plus UID. Subscribe using shared epoch/sequence cursors, replace only older object versions, and reload on run-wide invalidation/readiness as well as result events. View models only format returned values/capabilities. USD ordering, cost conversions, means, eligibility and import classification stay engine-owned. M17 owns all ZIP dialogs in `screens/exchange.py`, their builders in `viewmodels/exchange.py` and the ZIP widgets; this child owns only injected factory entry/return behavior, never exchange host fragments.

## Boards, states and acceptance

Run `pytest tests/tui/test_results_viewmodels.py tests/tui/test_results_screen.py tests/tui/test_result_screen.py tests/tui/test_results_exchange_entries.py tests/tui/test_rejudge_screen.py tests/tui/test_report_ready.py`, using Textual `App.run_test()`/Pilot plus pure view-model tests:

| Exact boards | Required state/action checks |
|---|---|
| Results, ResultsTrials, ResultsHalted, ResultsAnalysisTariff | Data/loading/empty/error/read-failure, filters, trial rows and mean/min–max, invalidated muted rows, retention-pending export/report gates, declared billing, mixed-currency USD notice, missing-rate unknown and alternative tariff. Wide/compact variants as cataloged. |
| ResultOrigin, ResultOutcomes, ResultReviews | Original/effective status and invalidation digests/paths; distinct process/check/grade columns; trial count/index; original/additional review costs; evidence unavailable/error and selected historical trial navigation. |
| Rejudge | Original preserved, judge unavailable, enabled/disabled submit and job success/failure. No job starts just by opening the dialog. |
| Results/ResultOrigin exchange entrypoints → M17 boards | `i` sends template SHA to the import factory; `x` sends the selected run UID to the export factory; engine retention capabilities gate entries. Return restores focus; only published import events refresh Results. M17.3 owns ResultPackagePick/ResultPackage, ResultImport/Conflict/Mismatch/Embedded and ExportResult state/action tests under [its contract](../M17/03-exchange-screens.md). |
| ReportReady | Path/size/count/judge groups/weights always present; open-attempt failure warning, copy path and reveal failure. M13 owns generation/progress. |

Use 120×40 and 80×24 for applicable board variants; exercise keyboard, mouse, focus restoration, tab switching, Escape and narrow scroll behavior. Each binding must emit exactly its parent-specified API/navigation call. Format always-present `CostDTO.display` and exact `DurationDTO` projections, including EUR, mixed-run USD and unknown conversion, preserving mean/min/max basis/billing/rate metadata without recalculation; tariff selection sends no currency/rate override. Two runs sharing one label must pass different UIDs to the export factory. M17 owns selected-subset planning and output behavior. While trial 2 is live, open trial 1's checks/logs and assert every requested result/TrialRef stays trial 1. Deliver a run invalidation event after a sealed detail loads; both detail and list refresh without rewriting original status. Test out-of-order responses/unmount and cursor replay so stale data cannot restore a capability.

**Real integration gate:** run the same navigation through the composed engine and real M06/M08/M10/M12/M13/M17/M18 screens; import two same-label runs, inspect both trials, rejudge explicitly, invalidate a sealed run, export/import its overlay, and generate an eligible offline report. Final amounts/coverage must match retained API records. Snapshot/fake-client rendering alone is insufficient.

**Pending parent obligations:** real engine/provider/navigation gates listed in all M02 children and CLI parity through M14. Parent acceptance requires those gates, not merely these screen tests.
