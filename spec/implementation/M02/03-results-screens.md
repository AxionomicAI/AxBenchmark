# M02.3 — results-screens

Parent: [M02 screens](../reference/modules/02-retained-results-comparability.md#4-screens). Requirements: R035, R067, R076–R082, R114, R116, R122–R124, R134, R143, R153, R154. Findings: F02, F03, F06, F09; consume F07 presentation fields and F14 import states.

Outcome: retained trials and details remain correctly scoped through all Results actions, including pending retention, invalidation, review and import/export entrypoints. This child implements clients, not result/scoring/accounting decisions.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M02.2](02-retention-services.md), M06.1 scoring service, M10.2 final accounting, M15.1–2 app/focus/widget foundations (child IDs in [recommendations](../reference/recommendations.md)).

**Bootstrap-published contracts, allowed as injected fixtures:** M06 ranking/weights/breakdown navigation, M08 TaskChecks/EvidenceViewer, M10 CurrencyEnergy/Measurements/CostBasis, M12 rejudge options/job, M13 report outcome/reveal, M17 `ExchangeScreens.import_results(template_sha256, path?)`/`.export_results(run_uid)` factories and M18 telemetry entry points. Inject clients and navigation factories; real owning screens remain integration gates. Do not duplicate their engines, screens or conversion rules.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/tui/screens/results.py` (ResultsScreen, RejudgeScreen, ReportScreen), `axbenchmark/tui/screens/result.py` (ResultScreen).
- `axbenchmark/tui/viewmodels/results.py`, `result.py`, `result_review.py`, `report_ready.py`; `axbenchmark/tui/styles/results.tcss`, `result.tcss`.
- `tests/tui/test_results_viewmodels.py`, `test_results_screen.py`, `test_result_screen.py`, `test_results_exchange_entries.py`, `test_rejudge_screen.py`, `test_report_ready.py`; scoped fixtures in `tests/tui/fixtures/results/`.

The parent owns exact method/argument/event/binding contracts. Use `result_id` for selected historical records and `run_uid` for export; carry returned TrialRef/task/phase when opening evidence or checks. Labels are display text; collisions show origin plus UID. Subscribe using shared epoch/sequence cursors, replace only older object versions, and reload on run-wide invalidation/readiness as well as result events. View models only format returned values/capabilities. USD ordering, cost conversions, means, eligibility and import classification stay engine-owned. M17 owns all ZIP dialogs in `screens/exchange.py`, their builders in `viewmodels/exchange.py` and the ZIP widgets; this child owns only injected factory entry/return behavior, never exchange host fragments.

Results/ResultsTrials VMs expose primary **Gen tok/s**, **In tok (cached)**, **Out tok (reasoning)** and **Files / LOC** beside elapsed time/cost. Consume retained M10 projections through `results.list/get`: generation summary is labelled pooled with inspectable exact N/D and per-trial range, other counts mean/min–max with separately labelled totals. Files/LOC means final snapshot size (baseline included), with each metric and detail category independently unavailable. Preserve source/policy/coverage/reason/evidence fields and route inspection to the selected M10 Measurements ResultId/full TrialRef; no rescan, arithmetic or latest-trial fallback.

Results filter state uses owner `VariantFilterV1`: exact benchmark/root or claimed family, adaptation/quant, creator node+role, date node+kind/precision, evidence state, comparison selection and As recorded/With annotations. Forward the complete selection to scoring and reports; use stable returned facet/subject IDs and cursor revision. Render FINETUNE+QUANT together, source/declared/conflict labels, date precision and definite/possible matches without local eligibility arithmetic.

ResultOrigin shows `VariantResultProjectionV1` requested/resolved/effective refs, manifest coverage, ordered lineage and append-only annotation history. Explicit corrections call `results.annotate_variant` with operation/prior-snapshot refs; read-only navigation never adopts them. Subscribe to `results.variant.annotated`; resync list/detail/rank actions. Mandatory mismatch notices identify affected TrialRefs in both metadata views and retain original observations/failure, distinct from template invalidation.

**Saved-analysis and database presentation.** Results/ReportReady retain the M02/M06 `AnalysisSnapshotRef` (ID/input/publication/status/freshness) with the complete filter/group selection. Show current, stale, pending and persistence-failed states; do not label an old score current after review/annotation/invalidation. Add owner API-backed DatabaseInfo and DatabaseSnapshot entry states in this existing results screen/viewmodel ownership: configured path/presence, schema/view/runtime, catalog/grain/count coverage, snapshot output/progress/pin/checksum and typed remedy. File selection sends an output path to `database.snapshot`; the client never opens SQLite. Reuse shared dialogs/jobs/subscriptions.

**Route, comparison and profile interfaces.** Extend result/list/detail/review viewmodels and `results.list/get` filter plumbing with harness_comparison selection, full frozen matrix, comparison_axis=harness, classification+N/6 coverage, profile/treatment, route/hops and requested/resolved/effective model/effort evidence. Follow retained refs through existing evidence APIs; no endpoint inspection on result navigation. Unselected/unsupported rows have no score, actual launched failures retain full trial state, and JudgeGroup profile identity stays distinct from competitor provenance. Present variant tier separately; no one-axis label when both harness and variant vary.

## Integrated requirements

R192, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R191 — [authoritative SQLite results and analyses](../RESULTS-DATABASE.md).
R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R189 — [human review](../M12/05-human-review-web.md).

R184, R185, R186, R187, R188 — frozen domain profile/evidence contracts: [R184](../quality-judges/BACKEND.md); [R185](../quality-judges/MOBILE.md); [R186](../quality-judges/DEVOPS.md); [R187](../quality-judges/AGENTIC.md); [R188](../quality-judges/SPECIFICATION.md).

R173, R174, R176 — [benchmark statistics](../BENCHMARK-STATISTICS.md).

R166, R168, R171, R172 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

R177, R178, R179, R180, R183 — [benchmark modes](../BENCHMARK-MODES.md).

Results/ResultOrigin/ResultOutcomes builders preserve the engine's format/mode/seven-domain/target/legacy and ordered-stage projections. Render the locked protocol/check identity and scoped task-commit outcome separately from process, authored behavioral checks and grades; setup commits never count as competitor milestones. Open the existing M08 evidence route with the selected ResultId/TrialRef/task, including retained history/tree/inventory causes and not_recorded/unreadable states. Add wide/compact one-shot/multi-step fixtures with empty authored suites, missing/dirty milestones and source/workspace removal; views never run Git, repair/regrade or merge a later task's verdict into an earlier task.

Retained result/evidence navigation preserves each capture source and selected analysis ID/cutoff when opening M10.3 ContextDetail through Measurements. ResultReviews/Rejudge render backend-tagged selection and full group identity: harness settings, immutable decision profile/pack/capability/acceptance evidence, or human reviewer/form-policy. Use M12 check_judge and the explicit selected READY System One gate for decision rejudge only; missing decision configuration does not disable saved reads or eligible human/harness grading. Rejudge is one explicit additional job and cannot reopen original retention. Add offline, native-only, pending-analysis and same-label cross-backend fixtures with no inference during navigation.

**Frozen domain contract.** Results/ResultReviews/Rejudge present frozen family/version/category/comment labels and domain evidence coverage/modality/mode from retained DTOs. Evidence actions keep the selected trial and native build/matrix, product case or supplied/candidate document role; no current-default rubric lookup or browser-only assumption. Explicit rejudge keeps the approved ref and separate group.

Human rejudge uses `RejudgeRequest(result_id, judge: JudgeSelection)` and `judging.rejudge(result_id, judge)`; legacy judge_config_id remains harness-only. Render pending human additional job/case refs with reopen, submitting/persistence error and skip/cancel outcomes without inventing review IDs. ResultReviews displays committed `human_authored` six-grade/comment/limitation data and self-declared reviewer/form-policy groups; model costs are not applicable. Add no-model fixtures for pending additional work, original retained/report-ready unaffected, lost receipt and invalidation. Open/reopen is explicit through M12; merely visiting Results/imported reviews creates no host.

## Boards, states and acceptance

**Route/profile acceptance:** Test unavailable cells without zero scores, confirmed subset versus exploratory all-six, ordinary same-harness multiple profiles, unverified/contradictory observations and stale saved analysis. Filters and source detail survive import/offline reads without activating a profile.

**SQLite acceptance:** At both terminal sizes show missing DB without creation, unsupported schema, unavailable counts, cancelled/failed snapshot and existing-output conflict. Saved scores display their exact ref; stale events/resync cannot restore freshness, and storage errors never show saved success.

**Variant acceptance:** Pilot both sizes with duplicate labels, multi-root lineage, quantized fine-tune, unknown quantizer/month date, conflicting claims and post-seal mismatch. Filter/annotation changes preserve whole subjects and exact API fields; switching to As recorded never removes exclusion, mutates original records or opens a judge.

**Domain acceptance:** Add wide/compact native gaps, backend text, DevOps plan-only, mixed agent modes and document-only review fixtures; offline navigation invokes no evaluation.

Add wide/compact Results fixtures for all four headings, pooled versus mean labels, unknown cached/reasoning details, known file_count with unknown LOC, missing trials and partial matched subsets. Verify retained/source-removed and imported views agree, eight-factor selection survives Rankings/report handoff, and changing weights cannot rewrite raw statistic columns.

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
