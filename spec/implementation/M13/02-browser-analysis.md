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

AnalysisState holds machine/configuration/judge filters, active original/alternative selection, per-group AnalysisProjection and table sort choices. It emits one revision to table/chart consumers so quality colors, shortlists and contribution stacks update together. Failed validation preserves the prior applied analysis.

Parse decimals without Number conversion; normalize each weight set independently. Reject negative, nonfinite, missing/unknown category and all-zero sets. Q, mean quality, minima, contributions and comparisons use reduced BigInt rationals; Number is allowed only after ordering for pixel placement/display geometry.

Pass M10 cost/time means/ranges and complete CostDTO metadata through unchanged. JS does no cost aggregation, tariff pricing or exchange-rate arithmetic. Browser filters select the precomputed engine frozen-currency projection when all visible runs share it, or USD projection plus engine mixed notice when they differ; inspect all visible runs before eligibility.

Report tariff is the engine-prepared recorded or alternative tariff selected at generation; there is no in-page tariff/currency/rate editor. Weight controls and filters operate solely on embedded facts, never contacting the engine.

## Scoring and identity invariants

Group by `(RunUid, configuration_id)` and judge group; retain ResultId/TrialRef and expected counts. Configuration/label filters cannot merge U/c with V/c or drop a missing/ineligible trial from a selected roster. Exact ties use M06's stable subject/result key, never rounded text or human label.

A subject requires all M06 default gates for every expected trial, including required business grade >=4, checks/process state and selected-group grades even when a scoring weight is zero. Missing trial/review and invalidated effective status remain exclusions.

Verified zero retains M06's maximum-cost rule. API/energy/reported zero without verified-zero status stays visible with basis and `cost_zero_unverified`; exclude it from lowest-cost and positive-cost-weight combined before averaging, even if another trial makes the mean positive. Never divide by zero or relabel its basis.

Zero-weight components need no measurement and have zero points/no minimum; this does not remove default/all-trial gates. Partial/unknown cost/time exclusions and guarded zero_time_unresolved exactly match M06; no weight redistribution or subset mean.

Resolve original quality and ranking sets independently per selected group/population. Differing originals use profile defaults and the exact explanatory label. Preserve each frozen set and associated UID/trial/origin for choosing it as an alternative. Reset re-evaluates the original selection for current filters.

## Exports and safe rendering

All data becomes textContent or safe known attributes; forbid innerHTML, outerHTML, insertAdjacentHTML, document.write, eval, Function, dynamic import and every network API. Malicious labels/reviews cannot mutate the document structure.

Export alternative configuration through M07's preset schema with exact accepted weight values, label and original-reference metadata. Export alternative report from trusted immutable document segments plus escaped JSON islands naming its initial alternative; retain original static tables/evidence, full identity and CSP-valid scripts.

Use Blob/download without runtime fetch. Downloaded HTML must work from an empty directory, offline, including a second alternative/reset/export. No model call or original mutation; both exports identify the alternative clearly.

## Exact boards and states

ReportPage owns the browser controls: original/profile-default/alternative, per-result original choice, Apply errors by field, Reset, export actions, machine/configuration/judge filters, independent table sorts, empty/fewer-than-five and excluded rows with reasons. No Textual screen is owned here.

Supply states for unverified zero, verified zero, unknown/partial, missing trial/review, duplicate labels, separate judge groups, frozen COP/EUR/missing/mixed currency and precision-only ties. ReportGenerateDefaults is M13.4's engine-label consumer, not a second weight resolver.

## Acceptance and exact vectors

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

## Persisted engine scores and offline previews — R191

[RESULTS-DATABASE.md](../RESULTS-DATABASE.md) requires the engine-generated initial report to carry its persisted analysis ID, exact input digest and snapshot metadata. Browser alternative weights/filters continue to work fully offline; label resulting calculations as unsaved local previews, not database-persisted scores. Downloading an alternative artifact preserves that provenance and does not secretly write a local database, contact the engine or claim persistence. Existing BigInt arithmetic and conformance vectors remain authoritative for these local calculations.
