# M06.2 — rankings-screens

Parent: [M06 screens](../reference/modules/06-scoring-rankings.md#4-screens). Requirements: R077, R081, R092–R101, R114, R124, R131, R145, R149, R153–R155. Findings: F02, F07, F08, F09; consume F04 subscription foundations.

Outcome: an implementer can deliver ranking, score explanation and weight-editing screens using engine-owned decisions, with traceable trials, currency and exclusions. Proposed UI work; wireframes are inputs and later design edits are outside this child-spec change.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap; [M06.1](01-scoring-service.md); M07.1 `configuration-drafts` for working presets; M15.1 `tui-foundation` and M15.2 `tui-shell` from the [foundation contract](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries). Reuse widgets, prompts, workers, cursor-aware subscriptions, focus and wide/compact harness.

**Bootstrap-published contracts, allowed as injected fixtures:** M02 ResultsScreen host/filter/inspection navigation; M10 currency/tariff DTOs and CurrencyEnergyScreen handoff; M13 ReportGenerateScreen; M12 ProfilesScreen and M07 setup callers. Inject schema-valid client responses and navigation factories until those owners integrate their real screens. Do not make their full implementations entry dependencies.

Render supplied backend/profile/version and group fingerprint when choosing a JudgeGroup, preserving harness, decision and human groups even when labels/models match. Expose decision commentary/acceptance provenance and unavailable quality without deriving confidence-based quality. Offline/native-only measurements and deterministic analysis remain available with decision engines disabled; applying weights or changing a group makes no model call.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/tui/screens/rankings.py` (`RankingsPane`, `ScoreBreakdownScreen`) and `screens/weights.py` (`WeightsScreen`).
- `axbenchmark/tui/viewmodels/rankings.py`, `score_breakdown.py`, `weights.py`; `axbenchmark/tui/styles/rankings.tcss`, `weights.tcss`.
- The explicit import/mount seam in M02-owned `axbenchmark/tui/screens/results.py`; coordinate it with M02. Do not move or duplicate the ResultsScreen host.
- `tests/tui/test_rankings_viewmodels.py`, `test_rankings_screen.py`, `test_score_breakdown.py`, `test_weights_screen.py`, `test_rankings_navigation.py`, `test_rankings_subscription.py`.
- `tests/tui/fixtures/scoring/` JSON views for every board plus currency, missing data, zero, all-trial exclusion and invalidation variants.

Use only parent `scoring.*`, M07 `configs.save_preset`, M13 report navigation and M02 inspection navigation. Requests carry the current template/filter/judge/weight/tariff selection; result actions carry explicit result IDs/full TrialRefs, never a run label. Weight choices use the same filters as the active ranking.

View models format DTOs only. Render full `CostDTO` metadata for rows, means/ranges, minima, shortlists and breakdowns. USD calculation values remain separate from the engine-produced display amounts/codes, frozen rate source/date, basis, coverage and declared-billing labels. No conversion, quality calculation, eligibility, minimum selection or score computation belongs in UI. Money sort keys use supplied exact USD values.

There is no analysis currency/rate selector. A missing display conversion shows unknown and its reason while a known USD amount remains visible in detail; mixed-currency views show the engine's USD notice. Zero shown after rounding never becomes a verified-zero label. Partial and unverified-zero observations remain inspectable with the engine exclusion reason.

**Frozen domain contract.** Rankings, ScoreBreakdown and WeightsScreen obtain ordered quality controls/labels/defaults and business gate from the frozen ProfileSpec/ref in WeightChoices. Pass rubric_ref to preview/validate and preserve it when opening setup/report analysis. Show family/version and separate JudgeGroups; specification quality labels describe design documents. Zero selected weight never hides a required missing grade; no web-only ux/visual keys or fixed fourth-category gate is computed in the view.

## Boards, states and actions

**SQLite acceptance:** Test repeated equal selections reusing an ID, changed annotation/review/filter making a new or stale result, failed save, delayed response and reconnect. Inspecting old results retains their original group/roster; UI formatting never changes exact ranks.

| Exact board/state | Contract |
|---|---|
| Rankings | Combined score, three shortlists, enabled-component references, primary statistics, all trial entries, judge/filter selection and currency notice; original analysis labels remain visible. |
| RankingsProfileDefaults | Exact fallback label when originals differ; each result's frozen weights remain available as an alternative choice. |
| RankingsTrials | Each UID-scoped subject's frozen/observed count, every TrialRef, mean/min–max and named failing/missing trial; same-label origins/UIDs distinguish subjects. |
| RankingsAlternative | Alternative weights/tariff labels, reset to original, save preset, export weights and report handoff. |
| ScoreBreakdown | Subject plus selected trial identity; per-trial gates; common quality weights; typed measured/eligible-minimum money with exact contributions and engine rule text. |
| WeightsEditor | Independent quality/ranking inputs and normalized previews; profile defaults, common/result originals and saved presets. Setup primary action says “Use weights”; analysis says “Apply as alternative”. |
| WeightsInvalid | Engine field issues, percentages absent, disabled Apply/Save; raw invalid input stays editable. |
| Parent-defined states without separate boards | Loading, no comparable results, fewer than five, no qualifiers, zero-time uncomputable, unknown/partial/no-rate, invalidated open breakdown, query/export errors and retry. Preserve M02 inspection access. |

All boards have 120×40 wide and 80×24 compact verification. Use the parent's `#combined`, `#combined-loading`, `#combined-empty`, `#combined-error`, `#currency-label`, `#all-entries`, shortlist IDs, `#breakdown*`, `#weights*` and named inputs. Compact mode retains reasons, currency and identity, with scrolling where needed.

- First tab activation/filter/judge/tariff change calls `scoring.rank` with the full current selection. Breakdown/previous/next calls `scoring.breakdown` for the returned explicit result ID.
- Weight changes debounce `scoring.preview_weights`; Apply calls `validate_weights`, then the caller applies the returned values. Reset requests original weights; Restore defaults loads the distinct profile defaults.
- Save invokes `configs.save_preset` after the shared name prompt. Export invokes `scoring.export_weights`; existing-target error offers explicit overwrite. Report navigation forwards the complete current selection to M13.
- Honor engine capability states; typed errors render verbatim. Escape/cancel preserves the host selection and focus. Cancelled prompts issue no command.
- Subscribe to M02's event-only `results` topic through M15: sealed/import/review/invalidation changes re-query rank and any open breakdown. Resync re-queries; stale workers cannot overwrite newer selection or restore invalidated rows. Unmount stops observation only.

Extend Rankings/RankingsTrials and ScoreBreakdown VMs to retain the four primary statistic columns, pooled-generation label/N/D, count means/ranges and independent Files/LOC/cached/reasoning availability. Render dynamic enabled-key reference/contribution rows with direction, exact value, selected policy/basis, full eligible cohort and per-trial exclusion reasons; no fixed three-row score layout or client scoring math.

WeightsEditor renders all eight stable component inputs, five explicit higher/lower/unset selectors and engine-provided comparison policy/basis choices; cost/time/quality directions are fixed. Send complete `RankingWeightsV2` plus policies to preview/validate/export and return the same envelope to Setup. Missing positive-factor direction/invalid map/policy issues keep raw input and disable Apply/Save. Presets, defaults, alternative/reset and report handoff preserve exact originals/schema provenance; disabled extras stay visible without acquiring data requirements. Explain that direction expresses preference, not quality.

Rankings/ScoreBreakdown consume `VariantComparisonV1` and shared `VariantFilterV1` alongside the existing weight/group selection. Add compare controls for quantization, fine-tune weights-only/package, joint and exploratory; explicit Matched view and control-signature picker use engine candidate groups. Show root/adaptation/quant facets, creator-role/date-kind filters, evidence tiers, confounds/exclusions with affected TrialRefs and full-roster counts. Carry metadata view/revision and policy refs through breakdown, weights, report and reset; clients never derive equality, select a favorable cohort or merge labels.

Display fixed-harness variant and varying-harness comparisons as separate axes. Unverified/card-only lineage stays exploratory, and As recorded still shows mandatory mismatch exclusions. Preserve original metrics, exact score explanations and separate JudgeGroups.

**Analysis retention state.** Rankings/ScoreBreakdown expose the returned analysis ID/input digest/publication and freshness beside their current selection. A completed engine result means the M02 sink acknowledged it; pending or failed persistence is a typed state with Retry, never a locally marked saved result. Historical stale analyses remain inspectable with their pinned cohort, while refresh requests a new owner analysis. Forward saved reference and complete selection to report generation; no client SQL or local durable score store.

**Route, comparison and profile interfaces.** Extend Rankings/ScoreBreakdown/weights VM inputs with HarnessComparisonSelectionV1 through existing `scoring.rank/breakdown` calls and ResultFilters; render returned HarnessComparisonV1 alongside saved AnalysisSnapshotRef/freshness. Show harness axis, full six-cell matrix, coverage N/6, exact common model/native-effort/profile route refs and distinct variant tier. Whole-subject selection and explicit exploratory analysis use owner validation; retain excluded/unverified/mismatch reasons without invented scores or averaged JudgeGroups. Profile treatment labels disclose another varied control.

## Integrated requirements

R192, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R191 — [authoritative SQLite results and analyses](../RESULTS-DATABASE.md).
R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R189 — [human review](../M12/05-human-review-web.md).

R184, R185, R186, R187, R188 — frozen domain profile/evidence contracts: [R184](../quality-judges/BACKEND.md); [R185](../quality-judges/MOBILE.md); [R186](../quality-judges/DEVOPS.md); [R187](../quality-judges/AGENTIC.md); [R188](../quality-judges/SPECIFICATION.md).

R173, R175, R176 — [benchmark statistics](../BENCHMARK-STATISTICS.md).

R171 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

**Human review acceptance:** Only committed server-validated GRADED reviews supply Q. Pending cases, drafts, explicit ungraded submissions, skips and cancellation preserve missing/invalid-review exclusions across the full expected roster, even with quality weight zero. Human reviewer/form-policy/version/digest and shared rubric/evidence/scope remain separate JudgeGroups; no averaging across reviewers or machine groups and no inferred model identity. Test equal raw-grade parity across all three backends, one pending trial excluding its whole subject, and a later additional human review leaving original selection unchanged. Display pending quality separately from known competitor measurements; reweight/filter/inspect never opens a form or invokes inference.

## Acceptance and faults

**Route/profile acceptance:** Fake-client cases show confirmed subset, blocked/unselected no score, launched partial/failure, unverified helper scope, combined harness+variant factorial and stale saved analysis. Changing filters recomputes extrema via M06; UI never upgrades declarations or edits historical controls.

**Variant acceptance:** Wide/compact compare fixtures show combined FT+QUANT, multiple signatures, unknown controls, differing harnesses, partial date matches and post-seal exclusion. Each change sends the full engine selection once and stale responses cannot restore Matched. Same-label equal-content configurations remain separate rows; no model call or local scorer is added.

**Domain acceptance:** Render every family with original/default/alternative weights, zero weight, invalid category and unavailable evidence; assert returned category order and exact owner calls at both terminal sizes, with no scoring or model work in view models.

Pilot 120×40 and 80×24 with all eight controls, unknown zero-weight extras, positive missing direction, independent file/LOC availability, mixed-basis uncomputable cohort, dynamic five-extra stacks and conflicting-original policy/direction labels. Assert complete API payloads, typed field paths, exact engine breakdowns and save/reset/export/report round trips. Required grade/check gates persist when quality has zero weight, and no action calls a judge or recomputes values in a VM.

Add same-label harness/decision/human group fixtures, changed decision profile/pack/acceptance digests, missing selected-group trial reviews and separate observer costs. Assert exact original score vectors, exclusions and zero-inference reweighting remain unchanged.

Run the proposed suite:

```sh
pytest tests/tui/test_rankings_viewmodels.py tests/tui/test_rankings_screen.py tests/tui/test_score_breakdown.py tests/tui/test_weights_screen.py tests/tui/test_rankings_navigation.py tests/tui/test_rankings_subscription.py
```

1. Render every board/state through pure view-model tests and Textual Pilot in both dimensions. Check keyboard/mouse, scroll, focus, resize and Escape; assertions cover visible currency, source/date, basis/billing and exact trial links.
2. Drive every action once and assert its exact client/navigation call. Applying/resetting preserves original records in the fake service; no UI path imports engine scoring/accounting, requests a judge or writes retained data.
3. Render COP 4000, EUR 0.90, differing frozen EUR rates, missing EUR display conversion and mixed-currency USD fallback from M06.1 vectors in main rows, ranges, shortlists, minima and breakdown. No unconditional dollar formatter or client conversion is allowed.
4. Render unverified zero with original estimate/energy basis and `cost_zero_unverified`; show positive unknown-billing cost with its limitation, verified-zero full contribution and zero-time unavailable score. Zero-cost weight does not remove business-grade/check exclusions.
5. Show same-label U/c and V/c separately. A missing/failing U/c/2 excludes U only and remains named in the table/breakdown; selection and previous/next links cannot switch UID accidentally.
6. Delay request A, change selection to B, return B then A; retain B. Deliver invalidation after a sealed/reviewed score, reconnect with a new epoch and force resync: old scores disappear and the open breakdown shows the typed overlay error with inspection access.
7. Exercise invalid input, missing profile, failed query, failed preset save/export, existing target, declined overwrite and cancelled prompt. Preserve inputs/selection, display errors and make Retry issue only the intended call.

## Real integration gate

Through real EngineClient/M06.1 and M02 ResultsScreen, inspect retained repeated trials, change filters/judge/weights/tariff, save/reload a real M07 preset, export/reload weights and generate a real M13 report. Compare exact engine order and all currency/billing metadata with the report generated through M06.1's pinned `analyse_population` seam; confirm originals and retained fact digests are unchanged. Invalidate the sealed run and verify all mounted views refresh.

**Pending parent obligations:** M06.1 real retention/accounting/profile integration and Python/JavaScript conformance; M07 setup and M12 profile entry points; M13 offline controls; M14 CLI parity; M15.3 complete navigation acceptance. Fake-client rendering does not claim these integrations complete.
