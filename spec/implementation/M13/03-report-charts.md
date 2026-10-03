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

Combined chart stacks the dynamic enabled-key contributions from AnalysisProjection across cost, time, quality, generation_rate, input_tokens, output_tokens, file_count and loc; labels include active weights, direction, policy/reference, analysis and judge group. Defaults show the original three enabled segments. Sum of exact stack values equals the exact combined score; disabled components have no segment/reference requirement. No missing-value redistribution or recalc from rounded score text.

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

Render scoped context timelines/partitions inside TASK_EVIDENCE, using the pinned prepared projections. Distinguish current-input membership from observed history/billed traffic, native versus predicted labels, text estimates, nulls, gaps, compaction and native-only/pending/partial analyses. Show used-percent only from the returned compatible native total/limit; never force category shares to 100%. Review charts retain backend/group/commentary provenance and separate observer/grader costs. Hardware timelines disclose actual local-decision overlap and unknown attribution without subtraction.

`ChartProjection.combined` carries keyed component, exact normalized weight/factor/contribution, direction, selected policy/basis, reference and eligible cohort identity. Render any enabled subset of eight with a stable legend and accessible details; extra combined-factor exclusions cannot remove an otherwise eligible direct shortlist/scatter point. Statistic tooltips and measured rows consume engine pooled/mean labels, units, coverage and independent Files/LOC states; geometry is approximate only after exact ranking. Tables, controls and chart projection share one analysis revision.

**Frozen domain contract.** Quality chart series/labels/tooltips derive from each frozen profile category and comment mappings and remain partitioned by full JudgeGroup/ref; no hard-coded web axes or fixed category positions. Evidence navigation preserves plan/matrix/case/source-role and observation mode, with missing required inputs and partial coverage visible alongside retained grades. Agent application models are functional context, distinct from builder provenance; specification labels describe design quality.

Extend `ChartProjection` subject details with returned variant refs, FINETUNE+QUANT, exact native facets, creator-role/date-kind precision, evidence tier and `VariantComparisonV1` mode/signature/confounds. Variant filter/view/signature changes flow through the same `AnalysisState` revision as tables and contribution stacks. Excluded or unverified subjects retain inspectable raw rows and explicit omission reasons; charts never label them Matched, connect merged label groups or claim an isolated quantization effect for joint/harness variation.

**Saved versus local provenance.** Keep `AnalysisSnapshotRef {analysis_id, analysis_digest, input_digest, publication_id, status, freshness}` from the acknowledged M02 sink in the initial ReportSnapshot/Model/outcome and table/chart detail. Freshness is explicitly as captured; an offline file cannot know later database changes. Report job ledgers remain working output state, not score authority. Browser filter/reweight/export produces an explicit unsaved local derivation tied to that original reference; it must not reuse the ID as proof the changed analysis was saved. Graph coordinates are approximate presentation; exact pairs and retained official ordinal/tie keys define the initial saved analysis.

**Route, comparison and profile interfaces.** Extend chart data/facets/tooltips with harness axis, route/profile/treatment, independent variant tier, comparison classification and N/6 coverage from pinned M06/M02 inputs. Full-matrix table retains blocked/not_selected/unverified cells without plotting invented quality/cost/speed. Hops/assets/control reasons use detail projections or EXISTS semantics, never duplicate chart rows; unknown usage remains unknown. Gateway overhead and true inference locality appear as provenance, not fabricated model compute.

## Integrated requirements

R192, R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R191 — [authoritative SQLite results and analyses](../RESULTS-DATABASE.md).
R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R184, R185, R186, R187, R188 — frozen domain profile/evidence contracts: [R184](../quality-judges/BACKEND.md); [R185](../quality-judges/MOBILE.md); [R186](../quality-judges/DEVOPS.md); [R187](../quality-judges/AGENTIC.md); [R188](../quality-judges/SPECIFICATION.md).

R173, R175, R176 — [benchmark statistics](../BENCHMARK-STATISTICS.md).

R166, R171 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

## Acceptance and faults

**Route/profile acceptance:** Assert one point per existing declared subject/analysis grain with multiple hops/assets, no zero point for missing cell, distinct same-harness profile treatments and exact saved-rank labels. Every chart has a table-equivalent matrix/coverage explanation.

**SQLite acceptance:** A sink failure or stale input prevents a report claiming saved scores; one retained snapshot feeds initial tables/charts/outcome. Copy HTML alone, disable engine/network, reweight/filter/download and verify unsaved labels, unchanged original reference and exact Python/JS parity.

**Variant acceptance:** Use same-label different-UID, claimed-root, unknown date, combined FT+QUANT and mandatory mismatch chart fixtures. Tables, omissions, legends/tooltips and full TrialRef detail links agree with the current engine-equivalent projection; geometry rounding cannot alter matching/ranking and all provenance text stays inert.

**Domain acceptance:** Render charts for all six category signatures including specification-first spec, ungraded gaps and separate versions/backends. Confirm chart geometry cannot change eligibility/grades or imply simulation/live equivalence.

Add eight-component and sparse-subset stacks, direction/policy changes, zero extrema, zero-weight unknown extras and incomplete-generation exclusions. Compare exact stack sums with M06 vectors before Number geometry, ensure specialized/scatter eligibility stays independent, and verify pooled/mean/baseline labels and unknown file/LOC details after filters/reset/download at wide and narrow browser sizes.

Extend existing fixtures for native-only and delayed/partial analysis, explicit local overlap/unknown attribution, distinct decision/harness/human fingerprints and offline or disabled-engine operation as applicable. Assert unchanged scope/digests, no fabricated values/calls, and no reclassification triggered by viewing, export/import or navigation.

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
