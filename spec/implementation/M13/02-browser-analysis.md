# M13.2 — browser-analysis

Parent: [M13 offline analysis](../reference/modules/13-standalone-html-report.md#1-engine-component). Requirements: R077, R081, R096–R101, R124, R130–R134, R143, R153–R156. Findings: F02, F07, F08, F09.

Outcome: apply exact alternative weights, sorting and filters inside the standalone file, with the same gates/reasons/order as M06 and unchanged retained facts.

## Entry conditions

**Completed implementation prerequisites:** [M13.1](01-offline-report-artifact.md), including real M02/M06/M10 pinned input and exact projection support. Require its direct-file/no-JS/safety tests first.

**Bootstrap-published contracts, allowed as injected fixtures:** M07 preset YAML schema; M06 ScoringMessages, Population/Analysis wire projection (including resolved ProfileSpec alongside matching profile_id) and normative vectors; M10 complete frozen-currency projections and its USD view when the generated scope is mixed. Fixtures may simulate missing/invalidated records, but cannot replace real Python scoring/accounting parity.

M06 owns `tests/fixtures/scoring_vectors.json` and its hand-reviewed expected values; consume the complete current corpus. Coordinate new vector additions with M06 instead of changing expected values to fit this scorer.

## Exact proposed ownership

- `axbenchmark/engine/reports/adapters/html/assets/scoring.js`: pure BigInt rational parsing/operations, weight validation, M06-equivalent quality/gates/minima/contributions/order.
- `axbenchmark/engine/reports/adapters/html/assets/report.js`: state/reducer, safe DOM table/filter/weight updates and exports; chart rendering remains M13.3.
- `tests/engine/reports/test_js_parity.py`, `test_js_static_safety.py`, `test_export_weights.py` and `tests/fixtures/reports/browser_vectors.json` for presentation/export cases only.
- `tests/browser/reports/test_analysis.py`, `test_analysis_exports.py`, `test_analysis_safety.py`; reuse M13.1 artifact/evidence fixtures.
- Add only required control/template hooks to M13.1 assets/report.html.j2 and CSS; preserve their original static tables and CSP assembly.

## Concrete interface

Expose pure `analyse(population, selection, judgeGroup) -> AnalysisProjection`, `validateWeights(profile, quality, ranking) -> ValidatedWeights | Issues`, and `reduce(state, action) -> AnalysisState`. Inputs carry resolved ProfileSpec/category/default/business rules, matching profile_id, exact rational strings, full frozen trial rosters and M10-prepared measures; output reason codes/field paths match M06.

AnalysisState holds machine/configuration/judge and shared variant filters with comparison/annotation selection, active original/alternative selection, per-group AnalysisProjection and table sort choices. It emits one revision to table/chart consumers so quality colors, shortlists and contribution stacks update together. Failed validation preserves the prior applied analysis.

Parse decimals without Number conversion; normalize each weight set independently. Reject negative, nonfinite, missing/unknown category and all-zero sets. Q, mean quality, minima, contributions and comparisons use reduced BigInt rationals; Number is allowed only after ordering for pixel placement/display geometry.

Pass M10 cost/time means/ranges and complete CostDTO metadata through unchanged. JS does no cost aggregation, tariff pricing or exchange-rate arithmetic. Browser filters select the precomputed engine frozen-currency projection when all visible runs share it, or USD projection plus engine mixed notice when they differ; inspect all visible runs before eligibility.

Report tariff is the engine-prepared recorded or alternative tariff selected at generation; there is no in-page tariff/currency/rate editor. Weight controls and filters operate solely on embedded facts, never contacting the engine.

## Scoring and identity invariants

Group by `(RunUid, configuration_id)` and judge group; retain ResultId/TrialRef and expected counts. Configuration/label filters cannot merge U/c with V/c or drop a missing/ineligible trial from a selected roster. Exact ties use M06's stable subject/result key, never rounded text or human label.

A subject requires all M06 default gates for every expected trial, including required business grade >=4, checks/process state and selected-group grades even when a scoring weight is zero. Missing trial/review and invalidated effective status remain exclusions.

Verified zero retains M06's maximum-cost rule. API/energy/reported zero without verified-zero status stays visible with basis and `cost_zero_unverified`; exclude it from lowest-cost and positive-cost-weight combined before averaging, even if another trial makes the mean positive. Never divide by zero or relabel its basis.

Zero-weight components need no measurement and have zero points/no minimum; this does not remove default/all-trial gates. Partial/unknown cost/time exclusions and guarded zero_time_unresolved exactly match M06; no weight redistribution or subset mean.

Resolve original quality and ranking sets independently per selected group/population. Differing originals use profile defaults and the exact explanatory label. Preserve each frozen set and associated UID/trial/origin for choosing it as an alternative. Reset re-evaluates the original selection for current filters.

## Persisted engine scores and offline previews — R191

[RESULTS-DATABASE.md](../RESULTS-DATABASE.md) requires the engine-generated initial report to carry its persisted analysis ID, exact input digest and snapshot metadata. Browser alternative weights/filters continue to work fully offline; label resulting calculations as unsaved local previews, not database-persisted scores. Downloading an alternative artifact preserves that provenance and does not secretly write a local database, contact the engine or claim persistence. Existing BigInt arithmetic and conformance vectors remain authoritative for these local calculations.

## Exports and safe rendering

All data becomes textContent or safe known attributes; forbid innerHTML, outerHTML, insertAdjacentHTML, document.write, eval, Function, dynamic import and every network API. Malicious labels/reviews cannot mutate the document structure.

Export alternative configuration through M07's preset schema with exact accepted weight values, label and original-reference metadata. Export alternative report from trusted immutable document segments plus escaped JSON islands naming its initial alternative; retain original static tables/evidence, full identity and CSP-valid scripts.

Use Blob/download without runtime fetch. Downloaded HTML must work from an empty directory, offline, including a second alternative/reset/export. No model call or original mutation; both exports identify the alternative clearly.

## Exact boards and states

ReportPage owns the browser controls: original/profile-default/alternative, per-result original choice, Apply errors by field, Reset, export actions, machine/configuration/judge filters, independent table sorts, empty/fewer-than-five and excluded rows with reasons. No Textual screen is owned here.

Supply states for unverified zero, verified zero, unknown/partial, missing trial/review, duplicate labels, separate judge groups, frozen COP/EUR/missing/mixed currency and precision-only ties. ReportGenerateDefaults is M13.4's engine-label consumer, not a second weight resolver.

Keep backend-specific JudgeGroup fingerprint and prepared context selections in offline state/filter/serialization. Weight alternatives operate only on retained valid raw grades and M10-prepared competitor measurements; native confidence, occupancy and observer/grader charges never become ranking factors. Switching groups cannot combine harness/decision/human reviews or change a pinned context analysis cutoff. No browser inference or runtime endpoint exists.

Extend production `scoring.js` `analyse`/`validateWeights` to M06's complete `RankingWeightsV2`/`RankingPlan`, enabled directions/policies, `ReferenceValues` and keyed `Contributions`. BigInt rational parsing preserves decimal lexemes and n/d; all eight weights normalize together, independently from quality. Recognize valid explicit legacy three-key input in memory with original provenance only; v2 omissions/errors and positive-factor direction errors match M06 field paths. Weight/filter state and exported M07 configuration/report contain all eight maps plus policies, not just visible enabled controls.

Read M10 prepared full-roster means and pooled N/D without averaging rates or rescanning artifacts. Skip disabled factors before lookup/compatibility/division. Enforce enabled metric completeness/selected-policy compatibility on every trial, same post-gate reference cohort, exact lower/higher zero conventions and existing cost/time/quality gates unchanged; extra combined requirements never exclude specialized shortlists or scatter. Resolve common originals by normalized eight-factor plan and enabled directions/policies; explicit differences use the same labelled defaults. Render independent cached/reasoning/file/LOC availability and retain excluded raw rows.

Extend `AnalysisState`/selection/export with `VariantFilterV1`, metadata view/revision and `VariantComparisonSelectionV1`; embedded subject inputs include all trial evidence/controls and pinned policy versions needed by the existing production offline scorer. Implement M06's variant classification before unchanged gates/normalization, preserving exact roots/adaptation, policy variation allowlists and candidate control signatures. Unknowns cannot match; partial dates expose definite/possible/unknown, strict date filters admit definite only. Unresolved signatures produce selection_required, never auto-select a favorable subset.

Filters retain complete `(RunUid, ConfigurationId)` rosters and separate JudgeGroups. As recorded/With annotations use only embedded snapshots and never clear mandatory effective-mismatch exclusions. Exported HTML/preset selection preserves mode/scope/policy and visible exploratory confounds; no inference, external metadata fetch or invented omitted trial.

**Saved versus local provenance.** Keep `AnalysisSnapshotRef {analysis_id, analysis_digest, input_digest, publication_id, status, freshness}` from the acknowledged M02 sink in the initial ReportSnapshot/Model/outcome and table/chart detail. Freshness is explicitly as captured; an offline file cannot know later database changes. Report job ledgers remain working output state, not score authority. Browser filter/reweight/export produces an explicit unsaved local derivation tied to that original reference; it must not reuse the ID as proof the changed analysis was saved. Graph coordinates are approximate presentation; exact pairs and retained official ordinal/tie keys define the initial saved analysis.

**Route, comparison and profile interfaces.** Extend versioned browser AnalysisState/filter/export shapes with harness_comparison selection and complete pinned matrix/classification/coverage independently of variant comparison. Mirror M06 classification and eligibility using frozen request/control/profile evidence cutoffs; client what-if is unsaved and never promotes unknown observations. Preserve the engine’s saved analysis ref/freshness and recompute extrema for the selected eligible whole subjects only. Local CSV/JSON exports include axis, N/6, exact model/effort/route/treatment refs and exclusions without private locators.

## Integrated requirements

R192, R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R191 — [authoritative SQLite results and analyses](../RESULTS-DATABASE.md).
R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R189 — [human review](../M12/05-human-review-web.md).

R184, R185, R186, R187, R188 — frozen domain profile/evidence contracts: [R184](../quality-judges/BACKEND.md); [R185](../quality-judges/MOBILE.md); [R186](../quality-judges/DEVOPS.md); [R187](../quality-judges/AGENTIC.md); [R188](../quality-judges/SPECIFICATION.md).

R175, R176 — [benchmark statistics](../BENCHMARK-STATISTICS.md).

R171 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

**Frozen domain contract.** analyse/validateWeights consume the embedded exact rubric-bound ProfileSpec, category keys/order/defaults and business_category; validate the entire version/digest/signature against the population. No browser family switch or latest-default lookup exists. All six grades are required independently of zero weights, and the raw business gate reads its declared key, including specification spec at position 1. Original/default/alternative controls change exact relative weights only; criterion meaning, coverage and backend group stay frozen.

**Human offline acceptance:** Filter/reweight committed human groups using the identical six-grade/full-trial/Q/business gate and BigInt vectors. Keep self-declared reviewer/form-policy and human_authored provenance, distinct additional groups and ungraded/missing exclusions; do not pool by label or infer a model identity. Imported/report data has no active case/draft/authentication controls. Assert zero network/engine/form opening on every alternative/reset/export action and unchanged exact scores for equal valid grades across all three backends.

## Acceptance and exact vectors

**Route/profile acceptance:** Shared M06/BigInt vectors cover confirmed subset, profile treatment difference, unsupported no-score cells, mismatched helpers and combined harness+variant factorial. Disconnect/network-disabled artifact stays complete and never qualifies or reactivates a route.

**SQLite acceptance:** A sink failure or stale input prevents a report claiming saved scores; one retained snapshot feeds initial tables/charts/outcome. Copy HTML alone, disable engine/network, reweight/filter/download and verify unsaved labels, unchanged original reference and exact Python/JS parity.

**Variant acceptance:** Run production JS against shared M06 variant vectors for quant/fine-tune package/joint/exploratory, different harness, unknown controls, declared lineage and late mismatch. Assert identical classifications, reasons, exact ranks and reset/export behavior offline with all network APIs disabled.

**Domain acceptance:** Extend JS/Python conformance vectors to every family, individual zeroes, positive-total relative weights, missing zero-weight grade, foreign category and mismatched rubric digest. Token/price/LOC/document counts do not modify raw quality or evidence sufficiency; existing eight-factor ranking math is unchanged.

Execute the complete expanded shared corpus through actual Python Fraction and production BigInt scorer: 2/4 higher/lower, proven zero extrema, unpaired duration, zero extras preserving 230/3 and 250/3, rate/cost 75/75 then A=100 after B exclusion, policy/direction disagreement and specialized-rank independence. Browser tests enable each factor, select policy/direction, reject missing v2 keys and positive unset direction, reset/export/reopen offline and compare exact values/reasons/order without model or engine calls.

Extend existing fixtures for native-only and delayed/partial analysis, explicit local overlap/unknown attribution, distinct decision/harness/human fingerprints and offline or disabled-engine operation as applicable. Assert unchanged scope/digests, no fabricated values/calls, and no reclassification triggered by viewing, export/import or navigation.

```sh
pytest tests/engine/reports/test_js_parity.py tests/engine/reports/test_js_static_safety.py tests/engine/reports/test_export_weights.py tests/browser/reports/test_analysis.py tests/browser/reports/test_analysis_exports.py tests/browser/reports/test_analysis_safety.py
```

1. Run every M06 normative vector through Python Fraction and test-only QuickJS BigInt runner; compare exact normalized weights, Q/quality range, trial eligibility/reasons, minima/points/order and full presentation fields. Never use float tolerance or derive expected data from either implementation.
2. Assert baseline scores A=230/3, B=250/3 and filtered B=100; U/V cross-label vectors remain 730/9 versus 700/9. Verified zero under 2:1:1 gives 100 versus 50; each unverified-zero basis excludes with cost_zero_unverified.
3. Include zero_cost_weight/zero_cost_other_gate, all_trial_zero/all_trial_gate, missing_trial/missing_judge_review, guarded_zero_time, sealed_invalidation, exact_ties/display_only_ties and judge_groups. Changing filter order or input permutation cannot alter exact output.
4. Run cop_display/eur_display/per_run_rates/missing_display_rate/missing_calculation_rate/mixed_display_currencies/unknown_billing_positive and originals_and_tariff. Preserve complete engine money/rate/billing/contributor projections; no currency option appears.
5. Integrate M10 costs 1,2,2 => 5/3 and energy COP 800 tariff => 1/10 USD, alternative 1000 => 1/8; no JS accounting code. Frozen versus USD projections change presentation without altering USD rankings.
6. Network-disabled file:// browser: apply both weight sets, invalid values, filters, exact sorting, reset and downloads. Reopen exported file offline, verify evidence/no-JS original tables and synchronized table/chart-ready data. All original retained digests remain unchanged.
7. Hostile strings in every control option/export label stay inert; no dialog/external request/executable element. Decimal precision beyond binary float and large numerators round-trip exactly.

## Real integration and pending parent work

Use M06's actual scorer and M10's actual prepared projections for parity, not a stub scoring service. Compose real M02 imported/missing-trial/invalidated populations. Pass artifacts to M13.3/M13.4 and M14/M15; verify a generated alternative and browser-exported alternative agree exactly.

**Pending parent obligations:** M13.3 charts, M13.4 durable lifecycle/screens, real M11/M12 report readiness and M17 import round trip; wireframe omission/currency/UID states in the parent. Vector success alone does not prove report completion or browser portability.
