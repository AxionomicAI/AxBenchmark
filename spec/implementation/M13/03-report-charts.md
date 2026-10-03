# M13.3 — report-charts

Parent: [M13 required presentation](../reference/modules/13-standalone-html-report.md#required-presentation-and-operations). Requirements: R077, R081, R124, R126–R134, R143, R148, R154–R156. Findings: F02, F07, F08; shared F03/F09.

Outcome: render all three required chart groups and optional hardware timelines from the same exact analysis revision as the tables, with honest omissions and complete comparison provenance.

## Entry conditions

**Completed implementation prerequisites:** [M13.2 browser-analysis](02-browser-analysis.md), including M13.1 pinned artifact and Python/JS parity. Reuse its pure AnalysisState/reducer and M10 engine projections.

**Bootstrap-published contracts, allowed as injected fixtures:** M18 TimelineDescription (physical scope/source/coverage/limitations and samples); M06 ranking reasons and group summaries; M10 money/billing/rate contributor projections. Actual collector scope/attribution and M18 service composition remain a parent gate.

## Exact proposed ownership

- `axbenchmark/engine/reports/domain/charts.py`: scatter_partition/environment_legend presentation only; no score, eligibility or cost/time averaging rules.
- `axbenchmark/engine/reports/adapters/html/assets/charts.js`: chart projection/rendering via createElementNS and textContent.
- Chart/timeline slots and styles only in `assets/report.html.j2`, `assets/report.css`, coordinated with existing M13.1–2 owners; no overwrite of safe serialization or controls.
- `tests/engine/reports/test_chart_projection.py`, `test_scatter_partition.py`, `test_timeline_labels.py`.
- `tests/browser/reports/test_charts.py`, `test_chart_filters.py`, `test_chart_currency.py`, `test_chart_safety.py`.
- `tests/fixtures/reports/charts.json`: references normative scoring inputs/expected analyses rather than duplicating their scoring outputs.

## Concrete interface and boundaries

`build_chart_projection(AnalysisState, ReportModel) -> ChartProjection` selects subjects/points/labels from the current M06-equivalent AnalysisProjection. It returns top_five cost/time/quality lists, grouped scatter points/omissions, combined contributions and telemetry descriptors.

`renderCharts(root, projection, revision)` atomically replaces its owned DOM nodes for one revision; stale revisions cannot replace current tables/charts. Preserve focus and selected evidence subject. No asynchronous network or independent scoring/filter state exists.

Each chart item contains stable subject key `(RunUid, configuration_id, JudgeGroupId)`, ordered ResultIds/TrialRefs, origin/run label and exact values plus engine presentation. Pointer/keyboard detail actions select that explicit subject, never the newest trial or first matching human label.

Keep exact rational ordering/tie decisions until geometric projection. Convert only bounded layout coordinates to Number, protecting empty/constant/very small/large domains from NaN/Infinity; pixel approximation never changes labels/order/contributions or eligibility.

## Required chart groups

Direct top-five includes lowest cost, shortest elapsed time and highest quality. Render zero through five actual eligible subjects as supplied by M06, with count/explanation; never pad or promote excluded entries. Preserve quality/combined judge isolation and engine tie order.

Scatter uses logarithmic USD cost on x, complete elapsed mean on y and selected-weight Q color. One point represents one distinct run/configuration/judge group, at M10 cost/time means and M06 Q. Environment legend lists actual included policies, with clear keys for every plotted policy.

Omit verified zero from the log axis with ZERO_COST, unverified zero with COST_ZERO_UNVERIFIED, and unknown/partial cost or time, ungraded or all-trial-ineligible subjects with explicit reasons. Tables retain all filtered admitted rows. Never turn unknown into zero, plot a subset mean or silently hide omissions.

Combined chart stacks cost/time/quality contributions from AnalysisProjection and labels active weights/analysis and judge group. Sum of exact stack values equals the exact combined score. Zero-weight segments remain zero; no missing-value redistribution or recalc from rounded score text.

Changing either weight set or machine/configuration/judge filter recomputes one analysis revision and updates tables, minima, top fives, scatter color/points and combined stack together. Reset and downloaded alternatives use the same path.

## Currency, provenance and timelines

USD is the chart calculation unit; label the logarithmic cost axis explicitly USD. Cost labels/tooltips also carry the page's engine-frozen display currency and exact USD/reference value where needed. Mixed visible frozen currencies select the precomputed USD projection and engine notice.

Never format a bare `$` as a currency assumption. Include M10 basis_label, reported/verified/estimate distinction, price source/date, energy_scope/tariff source, conversion/display_rate, declared billing, coverage and limitations. Means/ranges retain contributor metadata when singular provenance is mixed.

Do not introduce an alternate currency, rate or tariff editor. A generation-time analysis tariff remains alternative in every affected label. Missing display rate stays unknown while known USD may still rank; missing calculation rate excludes through M06.

Optional timelines consume M18's actual sampling intervals/source/scope/coverage. Distinguish client machine from cloud inference, shared experiment energy from attributable sequential TrialRef windows, and full/partial/missing collection. No per-configuration energy allocation or collector reset repair belongs in charts.

No telemetry yields a useful “nothing collected” part note, not an invented curve. Gaps remain gaps. Overlap/deduplication decisions come from M18, energy pricing from M10, never browser code.

## Exact boards and states

ReportPage: all three chart groups, environment legend, omissions, separate judge groups, cost basis/coverage details, optional timelines and evidence navigation. Support original/alternative/profile-default labels and fewer-than-five/none eligible states.

Required variants: verified $0 axis omission, unverified-zero exclusion, partial/unknown, missing trial, same-label U/V runs, equal/disparate/constant values, precision-only tie, differing judge groups, COP/EUR/shared/mixed/missing rates, hardware missing/gaps and alternative tariff.

Retain original essential tables when JavaScript is disabled; a noscript notice explains interactive charts. No Textual screen or wireframe file is owned by this child. ReportGenerate/Defaults parts stay locked via M13.4.

## Acceptance and faults

```sh
pytest tests/engine/reports/test_chart_projection.py tests/engine/reports/test_scatter_partition.py tests/engine/reports/test_timeline_labels.py tests/browser/reports/test_charts.py tests/browser/reports/test_chart_filters.py tests/browser/reports/test_chart_currency.py tests/browser/reports/test_chart_safety.py
```

1. Open a moved HTML alone via file:// with networking disabled; assert all three chart groups exist, all embedded assets are usable, and no external request occurs. No eligible entries/fewer than five render exact counts and reasons without broken scales.
2. Cross-label U/c and V/c each have their own point/rank; three trials make one point per subject at exact means. Missing/ineligible trial excludes the entire subject and preserves its table/evidence rows.
3. Verified-zero/zero-api/zero-energy/zero-reported-unknown, partial cost/time and missing data show correct omitted reasons. Positive average containing unverified-zero trial never becomes a scatter/ranking point. Every tooltipped value retains exact basis/coverage.
4. Normative baseline stacks total A=230/3 and B=250/3; zero-weight/guarded-zero-time and exact/display-only ties keep scorer order and finite geometry. Filter/Apply/Reset updates all elements to one revision.
5. COP, EUR, per-run frozen rates, mixed display and missing conversion use complete engine projections with USD axis. Rank order stays fixed when only display projection changes; estimate/declaration/source/date labels remain accessible.
6. Hardware fixtures retain gaps/sampling intervals/scope/limitations, no fake cloud/per-harness values; no samples render a note. Two trials' timeline/evidence detail actions carry exact TrialRef.
7. Hostile labels/price URLs/tooltips/reviews create no executable SVG/HTML, external navigation or dialog. Inspect chart DOM for safe namespace/text construction and run static network/injection checks inherited from M13.2.
8. Browser resize, keyboard detail selection and filters preserve selected identity; downloaded alternative opens offline with correct chart state. JavaScript-disabled essential tables still show original facts/weights.

## Real integration and pending parent work

Use actual M06/M10 projections and M02 retained/imported records for chart/table equality. Integrate M18's actual telemetry descriptors and measurements from sequential/parallel runs; compare USD/basis/coverage with immediate report and M17 re-import. Do not infer real collector support from fabricated samples.

**Pending parent obligations:** M13.4 jobs/screens/completion; M11/M12 finalization/invalidation races, M14/M15 navigation and wireframe ReportPage additions. Passing chart fixtures cannot establish eligible publication or complete offline lifecycle.
