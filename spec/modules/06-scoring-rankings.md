# M06 — Weighting, eligibility, and rankings

Authority: [the product specification](../SPEC.md). This module defines required analysis behavior. Its [Implementation](#implementation) section places that behavior in the headless engine fixed by [the architecture decision](ARCHITECTURE.md); every interface presents the engine's results and never computes scores, eligibility or normalization itself.

This proposed contract defines application-computed scores and rankings, extending the repository README's separate measured cost/time and quality assessments. Rankings compare priorities across complete harness/model/environment configurations; they do not establish isolated model capability. These are required behaviors, not claims of existing implementation. [R004]

## Inputs, outputs, and boundaries

Analysis consumes matching-template results: stable result identifiers, each result's explicit `TrialRef {run_uid, configuration_id, trial_index}`, frozen trial count, original and effective execution status with run-invalidation overlay, required-check outcomes, raw rubric grades and validity, judge configuration, cost and elapsed-time measurements with availability, coverage, basis and provenance, original weights, the optional analysis tariff, and current filters. It produces normalized weights, weighted quality, per-configuration trial means and min–max ranges, ranking eligibility and exclusion explanations, eligible reference minima, component contributions, and deterministic ordered results. Original records remain separately inspectable. [R096, R097, R098, R099, R100, R124, R131]

[M07](07-run-configuration.md) completes setup before launch: independently select judge harness/model/effort, preselecting a valid saved choice, then the planner configuration when used, otherwise the first selected usable configuration. Use the template rubric and finish both weight choices before execution. [M12](12-quality-judging.md) supplies validated raw grades; [M08](08-verification-evidence.md) supplies required-check outcomes; [M10](10-measurements-cost.md) supplies measurements; [M02](02-retained-results-comparability.md) preserves originals and provenance. M06 computes totals rather than accepting judge-calculated totals as authoritative. [R033, R096, R100]

## Weight operations and validation

Expose two independently editable weight sets in the TUI and YAML. Quality-category weights determine the overall application grade; cost/time/quality weights determine the combined decision score and default to equal thirds. Neither set changes the other's normalization. [R092, R093, R094]

Quality defaults follow the template profile: frontend/fullstack uses UX 25%, visual quality 15%, code quality 20%, business rules/specification 25%, robustness 10%, and accessibility 5%. Backend substitutes developer experience, API/interface design, and operability/documentation in the corresponding positions. M12 defines these profiles; use the same template profile throughout a comparison. [R033, R093, R095]

Support editing, named preset saving/loading, restoring defaults, and previewing normalized percentages. Every supplied weight must be finite and nonnegative, and each set must have a positive total. Divide each weight by its own set's total. Reject unknown categories/components, negative or nonfinite values, and all-zero sets with an explanation identifying the invalid input. Zero removes that component's contribution while retaining raw category grades for later analysis. Both sets must remain saved and reproducible. The source does not specify how omitted weight keys are handled; this contract does not invent a default-fill policy. [R095, R145]

Freeze original weights before execution and retain raw grades separately. Exploring either alternative set in results or HTML recomputes totals without judge calls or overwriting original results. Label alternatives, provide reset to the original analysis, and permit alternative configuration/report export. Restoring product/profile defaults and resetting an alternative to frozen originals are distinct operations. [R096, R145]

The original analysis of a judge group uses common weights for every entry. For each set, when every result in the group froze the same weights, those weights are used and labelled "original". When the frozen weights differ across results, the grading profile's default weights (SPEC §6) are used instead, labelled "Profile defaults: original weights differ across results", so every machine shows the same ranking. Within a combined ranking, quality uses the same category weights for all entries. Each result's own original weights stay visible with the result and can be chosen, like custom weights, through the alternative-weights control. Raw grades and original weights are never changed. [R096, R124]

## Calculations

For valid raw category grades gᵢ on the 1–5 scale and normalized category weights aᵢ, quality Q = Σ(aᵢ × gᵢ). Equivalently, multiply each grade by its original category weight, sum those products, and divide by the original category-weight total. The application performs this weighted mean from retained grades. [R096, R097]

For normalized ranking weights w꜀, wₜ, wᵩ summing to one, the combined score is exactly 100 × (w꜀ × minEligibleCost / cost + wₜ × minEligibleTime / time + wᵩ × Q / 5), subject to the zero-weight and verified-zero-cost rules below. The three displayed contributions are the corresponding terms multiplied by 100. [R098, R099]

The ranked `ConfigurationSubject` is exactly `(run_uid, configuration_id)`; `run_label` is display metadata, never a key. When a configuration ran more than one trial, each trial is a separate result; rankings use the configuration's mean cost, mean time and mean quality over its trials, and tables show every trial beside that mean and its min–max range. A configuration enters a ranking only when every one of its trials is eligible for that ranking; a configuration with one trial is ranked exactly as its single result. Require every frozen trial index, including imported subsets: missing trials exclude the subject, and filters or judge selection cannot reduce the expected trial count. A missing selected-judge review excludes that trial as ungraded; it never removes the trial from the mean. [R077, R100, R154]

Compute each minimum from configurations eligible for that particular ranking, after applicable filters and judge grouping; recompute when that eligible population changes. Preserve numerical precision throughout normalization, quality, minima, contributions, scoring, and comparison; round only for display. A displayed tie is not an exact numerical tie. Exact ties use a stable result identifier deterministically, keeping separate runs of one configuration distinct. [R099, R124, R131]

## Eligibility and exceptional data

Default shortlists require completed execution, verified required checks, valid required grades, and a raw business rules/specification grade of at least 4/5. Failed or unverified required checks cannot satisfy verification. A high weighted quality score cannot bypass these gates. [R100]

Exclude an entry missing a positively weighted measurement from the affected ranking and explain why; never redistribute its weights across available components. A partial measurement counts as missing for any ranking in which it carries positive weight: partial cost excludes the entry from the lowest-cost ranking and from combined rankings with a cost weight above zero, and partial elapsed time likewise for time. The entry stays in tables with its partial value, its coverage and an explanation such as "cost covers 6 of 7 tasks". A zero-weight component contributes nothing and requires no measurement for that component. This does not waive the separate required-grade and business-grade eligibility gates. Keep failed, incomplete, and excluded entries in full tables with their status visible. Direct lowest-cost, shortest-time, and highest-quality shortlists apply the eligibility and measurement requirements relevant to their ranking. [R100]

The cost that counts for rankings is [M10](10-measurements-cost.md)'s: a reported cost; a verified $0, which holds only when the provider or harness reports $0, usage coverage is complete for every task and the account's billing kind is known and not a subscription (an unknown billing kind never yields a verified $0); an API-equivalent estimate from the price table recorded at launch, labelled as an estimate with its price source and date; or, in sequential runs only, for a configuration on a local endpoint with no API cost, the energy-cost estimate (measured kWh in that configuration's execution windows × tariff), labelled "energy estimate" with its measurement scope (for example GPU + CPU package, not whole-system). A subscription or a missing price is never $0. In parallel runs shared energy is never divided, so such a configuration's cost stays unknown; without a tariff or an energy measurement it is unknown too. A tariff entered in Results as an analysis setting recalculates the energy estimate for the analysis, labelled as alternative, without changing the recorded one. [R101, R114, R155]

**New edge-case policy (F08), from SPEC §6:** retain any numeric zero lacking M10's verified-zero basis, including zero API and energy estimates, with its original value and basis. Exclude the trial and its entire subject from lowest-cost rankings and combined rankings with positive cost weight using `cost_zero_unverified`; never divide by it or promote it to verified zero. Cost weight zero removes this measurement gate only. Unknown billing retains any valid positive reported/estimated cost, with its limitation and billing label visible. [R080, R100, R101]

Rankings compute in USD. Costs display in the compared runs' frozen display currency, or in USD with a note saying so when the compared runs froze different display currencies; there is no analysis-time currency choice. [R081]

When a verified eligible minimum cost is zero, every verified zero-cost entry receives its full cost contribution, 100 × w꜀; positive-cost entries receive zero cost contribution. Unknown cost never becomes zero. If fewer than five qualify, show only that number; if none qualify or no ranking can be computed, explain the cause. The source gives no corresponding zero-elapsed-time convention; treat that as an unresolved calculation case rather than inventing a ratio or copying the cost exception. [R101]

## Comparison and presentation contract

Within a matching template, display and filter by originating machine, harness/model/effort, environment policy, concurrency, and judge configuration. Machine differences are intentional inputs, not hash mismatches. Apply common selected weights to a combined report while retaining each result's original weights and grades. Keep quality and combined rankings separate by judge configuration. Expose local/imported provenance, cost bases (reported, verified $0, API-equivalent estimate, energy estimate with its scope), and telemetry limitations so template compatibility never implies identical measurement conditions; the source does not mandate automatic exclusion solely for differing cost bases. Every comparison read applies M02's run invalidation overlay before grouping: an invalidation excludes all trials of that UID, including already sealed completed results and completed reviews, without rewriting their facts. Results inspection remains available in M02. A previously opened breakdown refreshes to `scoring.not_comparable` with the overlay; it cannot retain a stale score. [R067, R124]

[M13](13-standalone-html-report.md) uses the README presentation as its starting point and identifies the template and full SHA-256 in every report. Measured tables default to highest known cost first, unknowns last; quality tables default to descending unrounded quality within judge groups. Support sorting, machine/configuration/judge filtering, and task-detail/evidence inspection. [M15](15-terminal-interface.md) and M13 consume the same scoring contracts, served by the engine. [R131]

## Acceptance scenarios

- Save and reload both sets through YAML/TUI. Ranking inputs 2:1:1 preview 50%:25%:25%, independently of category weights. Reject negative, nonfinite, unknown-category, and all-zero inputs. With web grades UX 4 and all others 5, default quality is 4.75; zero UX weight yields 5 while retaining raw UX 4. Exercise defaults, alternatives, reset, and export without judge calls or original-record changes. [R092, R093, R094, R095, R096, R097, R145]
- Two eligible same-judge entries A/B have costs 2/4, times 20/10, and quality 4/5. Equal ranking weights produce A = 76⅔ and B = 83⅓. Filtering out A recomputes B's score to 100. Verify unrounded comparisons and deterministic exact ties across repeated calculations. [R098, R099, R124, R131]
- With weights ½:¼:¼, verified zero cost receives 50 cost points and positive cost receives zero. Unknown cost excludes an entry; selecting zero cost weight removes that measurement requirement. Business grade 3.5 still fails eligibility. Retain all entries in tables, show two when only two qualify, and explain an empty shortlist. [R100, R101]
- Partial cost covering 6 of 7 tasks excludes the entry from lowest-cost and from combined rankings with w꜀ > 0, with that explanation, and leaves it ranked when w꜀ = 0; partial time behaves likewise. A local configuration in a sequential run with a measured kWh and a tariff ranks on its energy estimate, labelled with scope; in a parallel run its cost is unknown. Changing the analysis tariff changes that estimate and the ranking, labelled alternative, and leaves the record unchanged. [R100, R101, R114]
- A configuration with three trials ranks on the mean of its trials' cost, time and quality and shows every trial with the min–max range; one ineligible trial excludes the configuration with that trial named. [R077, R100, R154]
- When a judge group's results froze identical weights, the original ranking uses them labelled "original"; when they differ, it uses the profile defaults labelled "Profile defaults: original weights differ across results", with one common set of category weights for every entry; choosing one result's original weights applies them as an alternative. [R096, R124]
- Exercise frontend and backend workflows, including an existing-repository baseline, through setup, verification, scoring, and report inspection. Verify calculations and failure explanations, TUI navigation/resizing, common-weight imported comparisons, preserved originals, and separated judge groups. [R124, R145, R149]

## Implementation children

These proposed children resolve [F02, F07, F08 and F09](../recommendations.md); they are implementation instructions, not completion claims. Bootstrap contracts may be fixtures, while each child's real integration gate remains required before accepting M06.

| Child | Scope |
|---|---|
| [M06.1 — scoring-service](implementation/M06/01-scoring-service.md) | Exact weights/quality, complete UID-scoped subjects, eligibility, explanations, API and shared Python/JavaScript vectors. |
| [M06.2 — rankings-screens](implementation/M06/02-rankings-screens.md) | Rankings, breakdown, weights/presets/exports and currency-aware wide/compact views over engine results. |

## Implementation

Implementation decisions under [the architecture decision](ARCHITECTURE.md). They fix where the rules above run and how interfaces reach them; they add no product behavior beyond the explicitly adopted F08 edge-case policy above. Where the contract leaves a case unresolved (omitted weight keys, zero elapsed time), the engine reports it rather than choosing a policy.

### 1. Engine component

Package `axbenchmark.engine.scoring`. M06 is a pure analysis service: it reads retained data through ports, computes, and returns. It owns no persisted state under `~/.axbenchmark/`, publishes no events and starts no processes. Original weights are frozen by [M07](07-run-configuration.md) and retained by [M02](02-retained-results-comparability.md); named presets are persisted by M07 ([M02](02-retained-results-comparability.md) records "scoring presets persisted in YAML by M07"). The only file M06 writes is an exported alternative weight configuration at a path the user chooses.

**Domain** (`engine/scoring/domain/`, no I/O). All arithmetic uses `fractions.Fraction`, so normalization, Q, minima, contributions, scores and comparisons are exact; API exact rational strings preserve every input/derived value used in ordering or offline recomputation; approximate floats are presentation conveniences only. Round only for display. Cost/time aggregation and all currency arithmetic remain M10-owned. [R099, R131]

| Type / function | Contents |
|---|---|
| `ProfileSpec` | `profile_id`, ordered `categories: tuple[CategoryKey, ...]`, `business_category: CategoryKey`, `default_quality: WeightSet`. Values come from M12 through a port; M06 does not hard-code profiles. [R093, R095] |
| `RankingComponent` | Enum `COST`, `TIME`, `QUALITY`. Default ranking weights 1:1:1. [R094] |
| `WeightSet` | `values: Mapping[str, Fraction]` as supplied, before validation. |
| `NormalizedWeights` | `raw: Mapping[K, Fraction]`, `normalized: Mapping[K, Fraction]` (sums to exactly 1). |
| `WeightIssue` | `field` (`quality.<key>`, `ranking.<key>`, `quality`, `ranking`), `reason` (`negative`, `nonfinite`, `unknown_component`, `all_zero`, `missing_component`, `not_a_number`). `missing_component` is reported, never filled: the contract defines no default-fill policy for omitted keys. [R095] |
| `normalize(ws, allowed) -> NormalizedWeights` | Divides each value by its own set's total; raises `InvalidWeights(issues)` listing every issue at once. Each set is validated alone; neither set reads the other. [R095] |
| `Measurement` | `value: Fraction \| None`, coverage and limitations; cost wraps M10's `CostAnalysis` value in USD plus its unchanged basis, billing, price/energy/rate evidence and display projection. Time wraps M10 elapsed time. No value/basis is inferred from a display amount. `None` stays unknown; a numeric zero is retained and is verified only when M10 says `verified_zero`. M06 performs no conversion or cost/time aggregation. [R081, R101, R114] |
| `ScoringEntry` | One trial: `result_id`, `trial: TrialRef`, `run_label`, frozen `trial_count`, `original_status`, effective `status`, `comparable`, `invalidation`, required-check counts, raw `grades`, `grades_valid`, `judge_group`, `cost`, `time`, original weight sets and comparison dimensions (machine/origin, harness/model/effort, environment policy, concurrency). The selected review is projected without changing the trial binding. |
| `ConfigurationSubject` | Key `(run_uid, configuration_id)`, `trials` in explicit TrialRef order, frozen `trial_count`, `observed_count`, `missing_trial_indices`, `stable_id` = result ID of the lowest observed trial index for deterministic ties. Build from M02's pinned `TrialGroup`, never from label, configuration ID alone, current trial or a filtered subset. Subjects with missing trials cannot rank. [R077, R122, R131] |
| `quality(grades, weights) -> Fraction` | Q = Σ aᵢ × gᵢ over normalized category weights. [R097] |
| `trial_summary(subject, measured) -> ConfigurationSummary` | Cost/time means, ranges, basis and coverage pass through M10's `TrialSummary` unchanged. M06 adds exact mean/min/max quality over all expected trials under common selected weights (unknown if any trial/review is missing or invalid), plus per-ranking eligibility. `ScoringRules.trial_summary` used by M02 instead applies each trial's original weights. Both paths retain every TrialRef and frozen count; M06 has no cost/time aggregation rule. [R077] |
| `ExclusionReason` | Codes `not_completed`, `not_comparable`, `missing_trial`, `check_failed`, `check_unverified`, `ungraded`, `grades_invalid`, `business_grade_below_4`, `cost_missing`, `cost_partial`, `cost_zero_unverified`, `time_missing`, `time_partial`, `zero_time_unresolved`, `trial_ineligible`. Reasons carry `message`, explicit `trial: TrialRef \| None`, `result_id?`, covered/total task counts, invalidation details when applicable and nested trial reasons. Missing-trial reasons name the expected TrialRef. [R077, R100] |
| `gates(subject, ranking, rw) -> tuple[ExclusionReason, ...]` | First enforce complete roster and comparability, then default gates on every expected trial. Required cost/time gates also run on every trial before using M10's summary: combined needs cost iff w꜀ > 0 and time iff wₜ > 0; lowest-cost always needs cost; shortest-time needs time. Missing/partial measurements yield `*_missing`/`*_partial`; needed numeric zero cost without `verified_zero` yields `cost_zero_unverified`. Any failing trial excludes the whole subject (`trial_ineligible` wrapping the exact TrialRef/reasons for multi-trial subjects), even if its aggregate mean is positive. Then verify required summary coverage. No weights are redistributed. [R077, R100] |
| `RankingKind` | `COMBINED`, `LOWEST_COST`, `SHORTEST_TIME`, `HIGHEST_QUALITY`. |
| `minima(eligible) -> Minima` | Exact minimum USD mean cost/time among eligible subjects for that ranking after whole-subject filters and judge selection. Do not read a zero-weight component or require a minimum for it. A zero cost minimum is usable only when M10 marks the whole subject `verified_zero` (every trial verified zero). Unverified zero never reaches this function. [R099, R101] |
| `combined_score(subject, q, minima, rw) -> Contributions` | `cost_points`, `time_points`, `quality_points`, `score`, `cost_rule` (`ratio`, `verified_zero_minimum`, `zero_weight`). Verified-zero minimum: verified $0 entries get 100 × w꜀, positive costs get 0. Branch on zero weights before reading/dividing either measurement. A zero time minimum with wₜ > 0 marks the ranking `zero_time_unresolved` instead of producing a ratio. [R098, R099, R101] |
| `order(rows)` | Sort key `(-score, stable_id)` on exact values; shortlists use `(cost, stable_id)`, `(time, stable_id)`, `(-q, stable_id)` on trial means and keep at most five. Separate runs of one configuration are separate subjects with separate ids. [R099, R131] |
| `analyse(population, selection, group) -> Analysis` | Runs the above for one judge group: per-trial Q, per-subject trial summaries and exclusions per ranking, the four rankings with qualifying counts and empty-ranking explanations, minima, full-table default orders (highest known cost first, unknown last; quality descending within the group). Judge groups are never merged. [R077, R100, R124, R131] |
| `resolve_original(group_entries, profile) -> AppliedWeights` | For each set independently: when every entry of the group in the current population froze the same weights, `source = ORIGINAL`, label "original"; otherwise the profile's default weights (`ProfileSpec.default_quality`, ranking 1:1:1), `source = PROFILE_DEFAULTS`, label "Profile defaults: original weights differ across results". Never refuses. Also returns the distinct frozen sets with the result ids that froze each. [R096, R124] |
| `WeightSelection` | `ORIGINAL` (the common weights from `resolve_original`, applied to every entry, so quality uses one set of category weights in a ranking) or `ALTERNATIVE(quality, ranking, label, origin)` applied to every entry in the comparison, where `origin` is `custom`, `preset(name)` or `result_original(result_id)` (one result's frozen weights chosen in the editor). [R096, R124] |

**Pinned population contract** (`engine/scoring/domain/models.py`, M06-owned):

`Population` is an immutable application input containing `view: PublicationView`, `profile_id`, the resolved `profile: ProfileSpec`, `entries: Mapping[TrialRef, EffectiveResult]` (available comparable trials, including failed/incomplete trials), `groups: tuple[TrialGroup, ...]` (complete frozen counts/expected refs and explicit missing indices), `measured: Mapping[tuple[RunUid, ConfigurationId], TrialSummary]`, prepared `currency` and applied `tariff` context, `judge_groups` and `notices`. Retain all selected-judge review possibilities in each entry; the pure analysis projects one `ScoringEntry` per expected trial for the requested group, preserving a missing review as `ungraded`. `profile.profile_id` must match `profile_id`; the producer resolves it during preparation so pinned scoring needs no profile query.

All members are domain values: exact fractions, M02 effective records/groups and M10 measurement/currency/billing/provenance values. DTO names elsewhere describe the adapter's serialized shape (`DisplayCurrencyDTO`, `CostDTO`, etc.), not imports into this record or domain rules. The publication view is an opaque pinned snapshot descriptor, not permission for the scorer to load newer data. Tariff validation, currency selection and every cost/time projection are complete before construction.

`RankingService.analyse_population(population, group, selection)` is the authoritative prepared-input entry. Validate binding/count/map consistency, group and weights, then delegate to the existing pure `analyse`/`resolve_original` rules; no second scorer, fresh query, profile lookup, cost/time aggregation, conversion or tariff application occurs. Missing expected trials remain valid population data and yield all-trial exclusions. Reject an inconsistent binding with `scoring.inconsistent_population` or supplied non-comparable/invalidated scope with `scoring.not_comparable`; never silently drop a supplied invalidated run. Eligible minima, excluded explanations and all trial gates use only this pin. A later invalidation cannot be discovered without a new read: API refresh rebuilds the population, while M13 rechecks its captured versions at guarded artifact publication and rejects a changed/invalidated scope.

**Ports** (`engine/scoring/ports.py`):

```python
class ResultPopulation(Protocol):
    async def load(self, template_sha: str, filters: ResultFilter, tariff: Tariff | None) -> Population: ...   # M02's domain ResultFilter
    # Returns the M06-owned domain Population above: one pin, resolved profile and all prepared M10 projections.
    # Read all expected trials for selected subjects; no review/filter may silently shrink a group's roster.
    # tariff None means each run's recorded tariff; no DTO classes occur in the domain Population.

class GradingProfiles(Protocol):
    async def for_profile(self, profile_id: str) -> ProfileSpec: ...

class WeightPresets(Protocol):
    async def list(self, template_sha: str) -> Sequence[NamedWeights]: ...

class WeightExportSink(Protocol):
    async def write(self, path: Path, doc: WeightExportDoc, overwrite: bool) -> Path: ...
```

There is deliberately no judging, harness or result-writing port: alternative analysis cannot call a judge or modify an original record because the module has no way to. [R096, R145]

**Application** (`engine/scoring/application/`), one use case per method:

| Use case | Method | Steps |
|---|---|---|
| `ComputeRankings` | `scoring.rank` | Prepare one pinned `Population` through `ResultPopulation.load` (including resolved profile and any analysis tariff), delegate to `RankingService.analyse_population`, then map its domain Analysis to DTOs/capabilities. The existing `RankingService.analyse` convenience entry follows this same path. |
| `ExplainScore` | `scoring.breakdown` | As `ComputeRankings`, reject a non-comparable selected result with its overlay, then project one subject's gates, quality rows and contribution rows, with previous/next ranked ids. |
| `PreviewWeights` | `scoring.preview_weights` | `normalize` both sets independently; return percentages or issues without raising. [R095] |
| `ValidateWeights` | `scoring.validate_weights` | `normalize` both sets; raise `InvalidWeights` on any issue. Also the in-engine `WeightValidation` Protocol used by M07 at launch. |
| `ListWeightChoices` | `scoring.weight_choices` | The common weights the original analysis uses (from `resolve_original`), each distinct frozen original set with the results that froze it, profile defaults with 1:1:1, and M07 presets for the template. |
| `ExportWeights` | `scoring.export_weights` | Validate, then write the alternative configuration through `WeightExportSink`. [R096] |

The engine exposes `ComputeRankings` and `ValidateWeights` to other modules as application Protocols (`RankingService`, `WeightValidation`), so [M07](07-run-configuration.md) launch validation and [M13](13-standalone-html-report.md) report generation run the same code as the API. It also offers `ScoringRules`, the pure rules other modules apply to retained data without restating them:

```python
class RankingService(Protocol):          # M13 uses the prepared-input entry
    async def analyse_population(self, population: Population, group: JudgeGroupId,
                                 selection: WeightSelection) -> Analysis: ...  # existing pure rules; no queries/accounting
    async def analyse(self, template_sha: str, filters: ResultFilter, group: JudgeGroupId, selection: WeightSelection,
                      tariff: Tariff | None = None) -> Analysis: ...   # prepare one Population, then delegate; None uses recorded tariffs
    def scoring_messages(self) -> Mapping[str, str]: ...      # reason code -> message template, for the report's in-page recomputation
class WeightValidation(Protocol):        # M07
    def validate(self, profile_id: str, quality: WeightSet, ranking: WeightSet) -> tuple[NormalizedWeights, NormalizedWeights]: ...  # raises InvalidWeights
class ScoringRules(Protocol):            # M02 (results order, Q, notes, trial summaries), M08 (not-passed effect text), M12 (Q on a review)
    def measured_order_key(self, r: EffectiveResult, cost: Cost) -> SortKey: ...             # highest known cost first, unknown last
    def weighted_quality(self, grades: RawGrades, weights: WeightSet) -> QualityBreakdown: ...
    def eligibility_notes(self, r: EffectiveResult) -> tuple[EligibilityNote, ...]: ...
    def trial_summary(self, group: TrialGroup, measured: TrialSummary) -> ConfigurationSummary: ...  # cost and time from M10's TrialSummary; adds Q mean and min–max (each trial's original weights) and eligibility
```

**Adapters** (`engine/scoring/adapters/`):

| Adapter | Implements |
|---|---|
| `results_population.py` | `ResultPopulation` captures one `PublicationView`, calls M02 `RetainedResultReader.for_template(..., view)` for effective comparable records, and `run(run_uid, view)` for their frozen rosters. Filters select whole subjects; judge selection projects that judge's review per trial without dropping missing reviews. Pass pinned `EffectiveResult`/`TrialGroup` values to M10 `CostAnalysis.ranking_cost(result, tariff, display_currency=None)` and `MeasurementReader.trial_summary(group, tariff, display_currency=None)`; neither reloads live working state. M10 `CostAnalysis.display_currency_for(pinned_runs) -> DisplayCurrencyDTO` selects the page currency; use the USD override only for its mixed-currency fallback. M10 returns complete presentation metadata. Breakdown uses `get(result_id, view)` to detect invalidation, never bypassing overlays. |
| `profiles.py` | `GradingProfiles` over M12's application interface. |
| `presets.py` | `WeightPresets` over M07's application interface. |
| `yaml_export.py` | `WeightExportSink`; writes the M07 preset YAML schema so an export can be reused as a preset. |
| `rpc.py` | DTO ↔ domain mapping. Weight maps are `dict[str, float \| str]` with `allow_inf_nan=True`: a number or the raw input text, so negative, nonfinite, unparsable and unknown inputs reach the domain and come back as `scoring.invalid_weights` rather than transport errors. Values convert with `Fraction(Decimal(str(v)))`; text that does not parse is `not_a_number`. Responses carry reduced rational strings `n/d` (positive denominator) for every numeric scoring input/output; floats cannot feed comparisons or M13 recomputation. Decimal texts parse exactly; nonfinite input is rejected before Fraction construction. M10 exact measurement values are forwarded without a float round trip. |

### 2. API surface (`scoring.*`)

No `scoring.*` analysis request accepts display currency, rates or an ambiguous `run_id`. Common request fragments: `template_sha: str`; `filters: ResultFilters` (M02's DTO: machine, configuration, environment policy, concurrency, judge); `judge_group: str | None` (first group when omitted); `weights: WeightSelectionDTO` = `{source: "original" | "alternative", quality: dict[str, float | str] | None, ranking: dict[str, float | str] | None, label: str | None, origin: {kind: "custom" | "preset" | "result_original", name?, result_id?} | None}`; `tariff: TariffDTO | None` (M10's DTO; an analysis tariff, omitted for each run's recorded tariff).

Queries (safety `read`):

| Method | Request | Response | Errors |
|---|---|---|---|
| `scoring.rank` | `template_sha`, `filters`, `judge_group`, `weights`, `tariff` | `RankingView` | `scoring.unknown_template`, `scoring.unknown_judge_group`, `scoring.invalid_weights`, `scoring.invalid_tariff` (M10 field issues), `scoring.population_unavailable`, `scoring.inconsistent_population` |
| `scoring.breakdown` | as rank + `result_id` (explicit trial) | `ScoreBreakdown` | as rank + `scoring.unknown_result`, `scoring.not_comparable` (UID and invalidation overlay) |
| `scoring.preview_weights` | `profile_id`, quality/ranking maps of numbers or raw text | `WeightPreview` (invalid input is data) | `scoring.unknown_profile` |
| `scoring.validate_weights` | as preview | `ValidatedWeights` | `scoring.invalid_weights`, `scoring.unknown_profile` |
| `scoring.weight_choices` | `template_sha`, `judge_group`, `filters` (same population as rank) | `WeightChoices` | `scoring.unknown_template`, `scoring.unknown_judge_group` |

Commands:

| Method | Request | Response | Errors | Safety |
|---|---|---|---|---|
| `scoring.export_weights` | `template_sha`, `profile_id`, quality/ranking maps, label, path, `overwrite=false` | `WeightExportResult {path}` | `scoring.invalid_weights`, `scoring.export_target_exists`, `scoring.export_failed` | `write` |

Jobs/events: none. Queries recompute from pinned inputs; only the explicit alternative-weight export writes a file. Screens consume M02 change events.

Response models (`axbenchmark.api.scoring`); M10-owned projections are imported, not reimplemented here:

| Model | Fields |
|---|---|
| `RankingView` | `template_sha`, `profile_id`, `categories: list[CategoryDTO {key, label}]`, `judge_groups: list[JudgeGroupDTO {id, label, harness, model, effort, entry_count}]`, `judge_group`, `weights: AppliedWeightsDTO`, `tariff: AppliedTariffDTO`, `currency: DisplayCurrencyDTO`, `combined: RankingDTO`, `lowest_cost`, `shortest_time`, `highest_quality: ShortlistDTO`, `configurations: list[ConfigurationDTO]`, `entries: list[EntryDTO]`, notices, capabilities. Currency selection includes every shown comparable subject before eligibility, so changing weights cannot change currency. |
| `AppliedWeightsDTO` | `source: "original" \| "alternative"`, `label`, `quality`, `ranking: AppliedSetDTO {source: "original" \| "profile_defaults" \| "alternative", label, weights: list[WeightDTO]}`; `WeightDTO = {key, label, raw: ExactNumberDTO, normalized: ExactNumberDTO}`. Both sets always apply commonly within a judge group. |
| `ExactNumberDTO` | `{value: float, exact: str}`; `exact` is reduced `n/d`, denominator positive. Exact scores, Q, grades, weights and contributions use it; unknown is an enclosing `null` with reason, never a numeric zero. M13 parses exact strings using integer rational arithmetic. |
| `SubjectRefDTO` / `TrialRefDTO` | `{run_uid, configuration_id}` / `{run_uid, configuration_id, trial_index}`. Every subject row also has `run_label`, machine/origin and `stable_id`; every trial has `result_id`, full `trial`, frozen `trial_count`. |
| `RankingDTO` | `kind`, `rows: list[RankedRowDTO]`, qualifying/population subject counts, `minima: MinimaDTO`, `computable`, explanation. A guarded zero-time combined ranking has no scored rows, `computable=false`, explanation/reason `zero_time_unresolved`. |
| `RankedRowDTO` | `rank`, `subject: SubjectRefDTO`, `stable_id`, run label/machine/origin/harness/model/effort, `trials: list[TrialValueDTO]`, `summary: SummaryDTO`, `score`, cost/time/quality points as `ExactNumberDTO`, `tie_broken_by_id`. Links resolve a concrete trial result ID. |
| `ShortlistDTO` / `ShortlistRowDTO` | `kind`, `currency: DisplayCurrencyDTO`, rows (≤5), qualifying/population counts, explanation; each row has rank, subject/stable ID, run label/machine/origin/harness/model/effort, all `TrialValueDTO`s and `summary: SummaryDTO`. No generic naked money `value`: lowest-cost shows `summary.cost.mean: CostDTO`, shortest-time the duration mean, highest-quality the exact Q mean. |
| `ConfigurationDTO` | Subject/stable ID, run label/machine/origin, frozen/observed trial counts, missing indices, trials, `summary: SummaryDTO`, `rankings: dict[RankingKind, InclusionDTO]`. No flattened averages across UIDs. |
| `TrialValueDTO` / `EntryDTO` | TrialValue: result ID/full TrialRef/frozen count, `cost: CostDTO`, `time: DurationDTO`, quality as exact number or null with reason. Entry adds harness/model/effort/machine/origin, original/effective status, comparability/overlay, checks, business grade, original weights label and per-ranking inclusion. |
| `SummaryDTO` | `cost: {mean, min, max: CostDTO}`, `time: {mean, min, max: DurationDTO}`, `quality: {mean, min, max: ExactNumberDTO \| None, unknown_reason?}`; M10 supplies every cost/time value and its metadata. Missing ranges remain explicit unknowns; single-trial ranges equal the value. |
| `InclusionDTO` / `ReasonDTO` | `{included, reasons}` / `{code, message, trial: TrialRefDTO \| None, result_id?, covered_tasks?, total_tasks?, invalidation?, causes: list[ReasonDTO]}`. All-trial exclusion identifies the exact failing/missing trial. |
| `MinimaDTO` | `cost: CostDTO \| None`, `cost_subject: SubjectRefDTO \| None`, `cost_rule`, `time: DurationDTO \| None`, `time_subject`; absent for zero-weight/unavailable components. Full money metadata is preserved even in breakdown reference minima. |
| `DisplayCurrencyDTO` | M10-owned `{computed_in: "USD", display_currency, mixed: bool, label, missing_rates: list[str]}`. Shared frozen currency or USD with `measurements.mixed_display_currency`; copied into ranking, breakdown and shortlist responses. No user currency selector. |
| `CostDTO` / `DurationDTO` | M10-owned cost projection copied intact: `amount: MeasuredDTO` in USD with exact value, `display: MeasuredDTO` with explicit currency and exact amount (or unknown reason), `basis`, engine `basis_label`, `billing: BillingDTO`, `price_source`/date, `energy_scope`, `tariff_source`, `alternative`, `by_basis`, `conversion`, `display_rate: RateUseDTO \| None`, limitations. `MeasuredDTO` carries `exact: str \| None` (reduced `n/d`, authoritative), a display-friendly value or null, unit/currency, coverage, covered/expected tasks, explanation/source and limitations; time uses the same measured shape with a duration unit. All mean/min/max amounts carry the same complete contract. |
| `RateUseDTO` / `BillingDTO` | Frozen M10 projection of M04/M07 evidence: rate currency, exact `per_usd` (currency units per 1 USD), source, `as_of`, `retrieved_at`, source URL and engine label; null rate plus `no_rate_conversion` for a missing conversion. Billing kind/source, `declared_by_user`, observation metadata and engine label; declarations remain in both billing and basis labels, including zero values. |
| `NoticeDTO` | `code`, severity, message; retain scoring notices for weights/verified-zero/estimates/energy/partial/imported data and M10 notices `measurements.mixed_display_currency`, `measurements.no_rate_conversion`, `measurements.declared_billing`, `measurements.billing_unknown`. Unknown billing never hides valid positive cost. |
| `RankingCapabilities` | `can_reset`, `can_export_weights`, `can_save_preset`, `can_edit_weights`, `can_breakdown`, each an action state with enabled/reason. Save preset is enabled only for an alternative. |
| `ScoreBreakdown` | Selected result ID/full TrialRef, subject/stable ID, run label/machine/origin/harness/model/effort/judge, `weights: AppliedWeightsDTO`, tariff, `currency: DisplayCurrencyDTO`, notices, `summary: SummaryDTO`, trials (TrialValue plus gates), subject gates, quality rows (key/label, raw grade mean, raw/normalized weight, contribution as exact numbers), combined rows (component, typed measured mean and eligible minimum, rule, normalized weight, exact points or null), exact score or null, rank/of, previous/next result IDs, exclusions. Money cells always use full `CostDTO`, including eligible minima; excluded/uncomputable scores are null, never NaN/Infinity. |
| `WeightPreview` | `quality`, `ranking: SetPreviewDTO {rows: list {key, label, raw, normalized \| None, issue \| None}, total, valid, issues: list[WeightIssueDTO]}`, `capabilities {can_apply, can_save_preset}` |
| `ValidatedWeights` | `profile_id`, `quality`, `ranking: list[WeightDTO]` |
| `WeightChoices` | `common: AppliedWeightsDTO` (what the original analysis uses), `original_differs: bool`, `originals: list[{label, result_ids, weights: ValidatedWeights}]` (each distinct frozen set, selectable as an alternative), `defaults: ValidatedWeights`, `presets: list[{name, weights: ValidatedWeights}]` |

Error codes: `scoring.population_unavailable` (retained read failure, with affected result/UID), `scoring.inconsistent_population` (conflicting trial/result binding or frozen count), `scoring.not_comparable`, `scoring.unknown_template`, `scoring.unknown_judge_group`, `scoring.unknown_result`, `scoring.unknown_profile`, `scoring.invalid_weights`, `scoring.invalid_tariff`, `scoring.export_target_exists`, `scoring.export_failed`. `scoring.invalid_weights` carries one `field` path per issue (`quality.ux`, `ranking.time`, `quality`) and its reason, so the editor marks the exact input. Differing original weights are not an error: the original analysis uses profile defaults and says so in `weights.label` and `scoring.profile_defaults_used`. [R095, R096, R145]

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `RetainedResultReader.for_template` (the application interface behind `results.list`; scoring inputs: status, required-check counts, raw grades and validity, judge configuration, cost/time measurements with availability and basis, original weights, comparison dimensions, origin) | M02 | `ResultPopulation` adapter. |
| `ResultFilters` API DTO and the domain `ResultFilter` it maps to | M02 | Shared filter model for `scoring.rank`. |
| `results.result.sealed`, `results.import.registered`, `results.review.added`, `results.run.invalidated` events | M02 | Rankings and open breakdowns refresh after imports, new runs, reviews and run-wide invalidation; sealed results receive no exception. |
| `judging.get_profile` and `ProfileCatalog.get` | M12 | Category keys, labels, business category and default weights for a profile. |
| `configs.list_presets`, `configs.save_preset` | M07 | Preset choices in the editor; Save preset… issues `configs.save_preset`. |
| Required-check outcome states (passed, failed, unverified) | M08 | Verification gate, via M02 records. |
| `CostAnalysis.ranking_cost(EffectiveResult, tariff, display_currency=None)`, `CostAnalysis.display_currency_for(pinned_runs) -> DisplayCurrencyDTO`, `MeasurementReader.trial_summary(TrialGroup, tariff, display_currency=None) -> TrialSummary`, `CostDTO`, `MeasuredDTO`, `RateUseDTO`, `BillingDTO`, `TariffDTO` and validation behind `scoring.invalid_tariff` | M10 | Single owner of all cost/time aggregation, basis/billing, frozen-rate conversion and complete money presentation including ranges. Retain exact values without float loss; supply unverified zeros unchanged. M06 applies eligibility only. |
| Full `TrialRef`, `RunUid`/display-only `RunLabel`, frozen trial count/roster and `RunInvalidation` overlays on retained results; `for_template` returning comparable results only | M02 | Building `ConfigurationSubject`s; results halted by a template change never enter. |
| `reports.generate` accepting `weights: WeightSelectionDTO`, `filters`, `judge_group`, `tariff` | M13 | `h` from Rankings writes the report with the current weights and analysis tariff. |
| `PromptScreen` (shared single-input prompt) | M15 | Name for Save preset…, path for Export configuration. |
| `events.subscribe` | M11 | Subscriptions for the Rankings tab. |

M07 consumes `WeightValidation` / `scoring.validate_weights` and `scoring.weight_choices`; M13 constructs M06's domain `Population` from its captured records/resolved profile/M10 projections and calls `RankingService.analyse_population`, then consumes the conformance vectors in section 6. `analyse` remains the query-backed convenience entry for callers without an existing pin.

### 4. Screens

Owned artboards: Rankings, RankingsProfileDefaults, RankingsTrials, RankingsAlternative, ScoreBreakdown, WeightsEditor, WeightsInvalid ([navigation §11](../design/wireframe-tui/navigation.md)). Each screen is a view over `scoring.*` responses. No screen normalizes, gates, ranks, picks a minimum or decides whether an action is allowed; it renders rows, messages and capability flags from the engine and shows typed errors verbatim.

**Rankings tab** — `RankingsPane` in `tui/screens/rankings.py`, mounted as `TabPane #tab-rankings` in M02-owned `ResultsScreen` (`tui/screens/results.py`). View model `tui/viewmodels/rankings.py`:

```python
@dataclass(frozen=True)
class RankingsVM:
    group_options: list[tuple[str, str]]; group_id: str
    weights_label: str; is_alternative: bool          # "original · quality web v1 · ranking 1:1:1" or "Profile defaults: original weights differ across results"
    currency_label: str                              # engine DisplayCurrencyDTO label; same metadata for rows/minima/shortlists
    tariff_label: str | None                          # from view.tariff; class -alternative for an analysis tariff
    combined_title: str; combined_subtitle: str       # "Combined · cost 33.3% …", "3 of 8 qualify"
    combined_rows: list[RowVM]                        # key = (run_uid, configuration_id); links use stable_id; cells pre-formatted; "× 3 trials", "mean (min–max)" when ranges are present
    shortlists: dict[str, ShortlistVM]                # title, rows, subtitle "4 qualify" | "top 5", explanation
    entries: list[RowVM]                              # one per trial, "trial 2/3"; last cell "✓ ranked" | "✗ " + engine reason messages
    excluded_compact: list[tuple[str, str]]           # compact #excluded lines
    minimums_text: str; notices: list[NoticeVM]
    capabilities: RankingCapabilities
    selection: AnalysisSelection                      # template_sha, filters, judge_group, weights, tariff, as last sent

def build_rankings_vm(view: RankingView, selection: AnalysisSelection, compact: bool) -> RankingsVM
```

Formatting only: score and points to one decimal, Q to two, cost from `CostDTO.display` with its currency code (e.g. `COP 4000`, `EUR 0.90`, `$1.00` only for USD), `unknown` with the engine reason when display value is absent, partial value with `▲` and coverage text, engine basis/billing/rate labels and durations. Detail panes additionally show `amount` labelled USD calculation value. Never substitute USD silently for an unknown display conversion or infer verified zero from displayed rounding. Order comes from the response; the view model never re-sorts. Column sorting chosen by the user uses exact numeric keys already supplied by the engine; money sorts by USD, not formatted display text. No UI conversion, minimum, eligibility or score calculation is allowed.

| Item | Behavior |
|---|---|
| Load | On first activation of the tab: `scoring.rank(template_sha, filters, judge_group=None, weights={source: "original"}, tariff)` in a worker, where `tariff` is the ResultsScreen's analysis tariff (M02's `e`), if any. |
| Subscriptions | On mount `events.subscribe(["results"])`, handling `results.result.sealed`, `results.import.registered`, `results.review.added` and `results.run.invalidated` filtered to the template by `template_sha256`; each event re-issues `scoring.rank` with the current selection and refreshes an open breakdown. Use M15's typed cursor/revision subscription manager; `results` is event-only, so resync re-queries. Cancel stale workers after selection/group/filter changes and reject late responses. Unsubscribe on unmount. |
| ContentSwitcher | `#combined` / `#combined-loading` / `#combined-empty` (shows `combined.explanation`) / `#combined-error` (error message + Retry). Each shortlist DataTable (`#lowest-cost`, `#shortest-time`, `#highest-quality`) shows its `explanation` when empty. `#all-entries` is empty when there are no comparable results; show the engine explanation and M02 inspection entry for invalidated results. |
| Widgets | `Select #judge-group` from `judge_groups`; `Static #weights-label` (class `-alternative` when `is_alternative`; shows "Profile defaults: original weights differ across results" from `weights.label` when the engine used them); `#minimums` from `minimums_text`; `#currency-label` and currency notices from `view.currency`; alternative notice from `scoring.alternative_active`; tariff label from `view.tariff`; compact (`Screen.-compact`): `#shortlists` one line each and `#excluded`. |
| Filters | `#filters` changes (M02 widgets) and an analysis tariff set or cleared with M02's `e` re-issue `scoring.rank` while the tab is active. |

| Binding | Action | API call |
|---|---|---|
| `1 · 2` | `show_tab` | none (M02); first show triggers the load above |
| `g` / `Select #judge-group` changed | `judge_group` | `scoring.rank(judge_group=<next id in judge_groups>)` |
| `b` / `enter` / `Button #breakdown` | `breakdown` | push `ScoreBreakdownScreen(selection, result_id)`; enabled by `can_breakdown` |
| `w` / `Edit weights…` | `weights` | push `WeightsScreen(context="analysis", …)`; on dismiss with `ValidatedWeights`: `scoring.rank(weights={source: "alternative", …})` |
| `r` / `Button #reset` | `reset` | `scoring.rank(weights={source: "original"})`; `check_action` returns `capabilities.can_reset` |
| `Save preset…` (alternative) | `save_preset` | `configs.save_preset(name, weights)` (M07) after M15's shared `PromptScreen` (artboard prompt for the preset name) returns a name; enabled by `can_save_preset` |
| `Export configuration` (alternative) | `export_weights` | `scoring.export_weights(…, path)` after M15's shared `PromptScreen` (artboard prompt for the export path) returns a path; enabled by `can_export_weights`; `scoring.export_target_exists` offers overwrite, which re-issues with `overwrite=True` |
| `h` / `HTML report` | `report` | push `ReportGenerateScreen` (M13) prefilled with `selection` (weights and tariff); its generate issues `reports.generate` |

**ScoreBreakdownScreen** — `ModalScreen[None]` in `tui/screens/rankings.py`; view model `tui/viewmodels/score_breakdown.py` (`BreakdownVM`: header line with the weights label, one line per trial with its gates and values when there are several, gate lines with ✓/✗ and engine detail, `#quality-breakdown` rows, `#combined-breakdown` rows with the engine's `rule` rendered as text, currency/basis/billing/coverage/rate labels for each money value and minimum, score line `rank n of m`, `prev_id`, `next_id`).

| Item | Behavior |
|---|---|
| Load | `scoring.breakdown(selection, result_id)`. |
| ContentSwitcher | `#breakdown` / `#breakdown-loading` / `#breakdown-error`; `scoring.not_comparable` replaces old scores with the invalidation explanation and an M02 inspection link. |
| `esc` | `dismiss(None)`, no call. |
| `←` / `→` | `scoring.breakdown(result_id=previous_result_id / next_result_id)`; disabled when the id is None. |

**WeightsScreen** — `ModalScreen[ValidatedWeights | None]` in `tui/screens/weights.py` (the wireframe's `WeightSet` result type is `ValidatedWeights`). Constructor `WeightsScreen(context: Literal["analysis", "setup"], template_sha: str, profile_id: str, judge_group: str | None, initial: ValidatedWeights, filters: ResultFilters | None = None)`. It is a pure editor: it never applies weights. The caller does: Rankings issues `scoring.rank`, SetupScreen (M07) issues its `configs.*` call, ProfilesScreen (M12) opens it in analysis context. In `setup` context the primary button reads "Use weights" instead of "Apply as alternative". View model `tui/viewmodels/weights.py`:

```python
@dataclass(frozen=True)
class WeightsVM:
    preset_options: list[tuple[str, str]]            # common original (or profile defaults) · each distinct result original · defaults · saved, from WeightChoices
    quality_rows: list[WeightRowVM]; ranking_rows: list[WeightRowVM]   # label, input text, pct or "—"/"✗", invalid flag
    quality_total: str; ranking_total: str
    quality_message: str | None; ranking_message: str | None          # engine issue messages, else hint
    title: str                                        # "Weights" | "Weights · fix 2 values"
    can_apply: bool; can_save_preset: bool

def build_weights_vm(choices: WeightChoices, inputs: Inputs, preview: WeightPreview | None) -> WeightsVM
```

| Item | Behavior |
|---|---|
| Load | `scoring.weight_choices(template_sha, judge_group, filters)`; inputs start from `initial`, then `scoring.preview_weights`. |
| Inputs | `(Label, Input.weight, Static.pct)` × categories in `#quality-weights` and × 3 in `#ranking-weights`, built from the profile's category list. Ids `#weight-<key>` (`#weight-ux`, `#weight-cost`, `#weight-time`, …). |
| `Input.Changed` | Debounced `scoring.preview_weights` with the raw text of every input; the engine parses it and reports `not_a_number` for text that is not a number. Issues set `Input.weight.-invalid` on the named field and fill `#weights-hint`. |
| ContentSwitcher | `#weights` / `#weights-loading` / `#weights-error`. |

| Binding | Action | API call |
|---|---|---|
| `esc` | `dismiss(None)` | none |
| `tab / shift+tab` | `focus_next / previous` | none |
| `Select #preset` changed | `load_preset` | fills inputs from the chosen `WeightChoices` entry (a result's original set is applied as an alternative with `origin = result_original`); the resulting change issues `scoring.preview_weights` |
| `ctrl+r` / `Restore defaults` | `restore_defaults` | fills inputs from `WeightChoices.defaults`, then `scoring.preview_weights`. Distinct from Reset to original on Rankings. [R096] |
| `ctrl+s` / `Button #apply` | `apply` | `scoring.validate_weights`; on success `dismiss(ValidatedWeights)`; `scoring.invalid_weights` marks fields and stays open. `check_action` returns `preview.capabilities.can_apply`. |
| `Save preset…` | `save_preset` | `configs.save_preset` (M07) after M15's shared `PromptScreen` returns a name; enabled by `can_save_preset` |

States map to artboards: WeightsEditor is a valid preview; WeightsInvalid is a preview with issues (Apply and Save preset disabled, percentages `—`); RankingsAlternative is `RankingView` with `weights.source == "alternative"`; RankingsProfileDefaults shows the common fallback label, and RankingsTrials shows explicit UID-scoped trials, means/ranges and all-trial exclusions. All have wide/compact variants. Wireframe edits are a later design task.

### 5. CLI

The source names no ranking command. Under the architecture rule that every API method is reachable from the CLI, the registry-generated `scoring` group exposes them; these are implementation-level commands owned by [M14](14-command-line-interface.md), not new product requirements.

| Command | Method |
|---|---|
| `axbenchmark scoring rank --template SHA [--judge-group ID] [filters] [--weights FILE] [--tariff AMOUNT_PER_KWH --tariff-currency CODE] [--json]` | `scoring.rank` (`--weights` reads a preset/export YAML as an alternative; `--tariff` is an analysis tariff) |
| `axbenchmark scoring explain RESULT_ID --template SHA [--weights FILE] [--tariff AMOUNT_PER_KWH --tariff-currency CODE] [--json]` | `scoring.breakdown` |
| `axbenchmark scoring check-weights FILE --profile ID [--json]` | `scoring.validate_weights` |
| `axbenchmark scoring choices --template SHA [--json]` | `scoring.weight_choices` |
| `axbenchmark scoring export-weights FILE --template SHA --output PATH [--overwrite]` | `scoring.export_weights` |

`rank` and `explain` require both tariff flags together: both absent means each run's recorded tariff; either alone is a parser error (exit 2, zero engine requests) naming the missing partner. Both produce `TariffDTO {per_kwh, currency}` intact. `--tariff-currency` denominates the energy tariff; it does not change frozen display currency or rates. No analysis display-currency/rate override or inferred currency is accepted.

`scoring.invalid_weights` and `scoring.invalid_tariff` exit 1 and print each field path with its reason. Human output prints the weights label, including "Profile defaults: original weights differ across results". Unattended launch reaches `scoring.validate_weights` through M07's launch validation.

### 6. Headless verification

[M06.1](implementation/M06/01-scoring-service.md) owns domain/application/API tests and the normative fixture `tests/fixtures/scoring_vectors.json`; [M06.2](implementation/M06/02-rankings-screens.md) owns view-model/Pilot tests. M13 owns the JavaScript runner and production offline scorer. Each vector carries `id`, frozen run/trial roster, selected judge/filters/weights, per-trial exact facts, M10-prepared measurement/display projections, and expected reasons, Q/summary/minima/contributions/order/presentation. Rational strings are reduced `n/d`; no float tolerance or JSON NaN/Infinity is permitted. Invalid numeric inputs are text such as `"NaN"`. Python uses `Fraction`; JavaScript uses BigInt rationals. Neither runner regenerates expected values from the implementation under test. M10 integration asserts the prepared accounting/display projections; the JavaScript scorer forwards them rather than repeating M10 calculations. [R099, R132]

For concrete vectors below, `U=00000000-0000-4000-8000-000000000001`, `V=00000000-0000-4000-8000-000000000002`; both may have label `2026-10-02-a` and configuration `c`. Trial references always expand these UIDs. Unless stated otherwise, execution/checks/grades pass, every raw category grade is `5/1`, time is `10/1`, cost is complete reported `2/1` USD, trial count is one, judge is J, and ranking weights are `1:1:1`. Each case is independent.

| Vector IDs and input delta | Exact expected result |
|---|---|
| `weights`, `quality`, `invalid_weights` | `2:1:1` normalizes to `1/2,1/4,1/4`. Web UX `4/1`, others `5/1` gives Q `19/4`; zero UX weight gives `5/1`, retaining grade `4/1`. Negative, nonfinite, unknown, omitted and all-zero inputs return the named field/reason; no default fill. |
| `baseline`, `filter_minima` | A: cost `2/1`, time `20/1`, all grades `4/1`; B: cost `4/1`, time `10/1`, all grades `5/1`. Minima `2/1,10/1`; A points `100/3,50/3,80/3`, score `230/3`; B points `50/3,100/3,100/3`, score `250/3`; order B,A. B alone gives `100/1`. |
| `verified_zero` | Weights `2:1:1`, A verified cost `0/1`, B reported `2/1`, both Q `5/1`, time `10/1`: cost points `50/1,0/1`, totals `100/1,50/1`. Declared API billing label and source survive all money cells; no `0/0`. |
| `zero_api_estimate`, `zero_energy_estimate`, `zero_reported_unknown_billing` | A cost `0/1` with basis `estimate`, `energy_estimate` or `reported` respectively; B default positive. A keeps value/basis/price or energy scope/billing, is excluded from lowest-cost and positive-cost combined with `cost_zero_unverified`; B is `100/1`, sole cost minimum `2/1`. No zero denominator. |
| `zero_cost_weight`, `zero_cost_other_gate` | Same A with weights `0:1:1`: combined `100/1`, cost points `0/1`, cost minimum absent; lowest-cost still excludes. A raw business grade `7/2` fails `business_grade_below_4` even with zero quality/cost weight (`0:1:0`). |
| `unknown_billing_positive` | A retains complete positive `2/1` for both reported and estimate variants, billing unknown limitation visible. A alone ranks `100/1`; no artificial unknown/zero replacement. |
| `partial_and_unknown` | A cost partial `2/1`, coverage 6/7 → `cost_partial`; unknown cost → `cost_missing`; positive-cost combined/lowest-cost exclude. Weights `0:1:1` permit `100/1`. Repeat for partial/unknown time with weights `1:0:1`; shortest-time still excludes. |
| `guarded_zero_time` | A time `0/1`, B `10/1`, all other gates pass: positive-time combined is uncomputable with `zero_time_unresolved`, no scores. Shortest-time orders A,B without a ratio. Weights `1:0:1` give both `100/1`, time points `0/1`, time minimum absent. |
| `complete_trials`, `cross_uid_labels` | U/c costs `1/1,3/1,5/1`, times `10/1,20/1,30/1`, all grades `4/1,5/1,5/1`; frozen count 3. M10 supplies cost mean/range `3/1,[1/1,5/1]`, time `20/1,[10/1,30/1]`; M06 Q `14/3,[4/1,5/1]`. V/c has one trial cost `9/1`, time `10/1`, Q `5/1`. Keep two subjects: scores U `730/9`, V `700/9`, order U,V; never average four trials or merge result sets. |
| `all_trial_zero`, `all_trial_gate` | U/c has two trials costs `0/1` estimate and `2/1` reported; M10 mean `1/1`. Still exclude whole subject for trial U/c/1 `cost_zero_unverified`. Separately, business `7/2` or a failed/unverified required check only at U/c/2 excludes U/c with that full TrialRef; V/c stays eligible. |
| `missing_trial`, `missing_judge_review` | U/c frozen count 3 but only trials 1 and 3 imported → `missing_trial` at U/c/2; no two-trial surrogate mean/rank. Restore trial 2 without a J review → `trial_ineligible` wrapping `ungraded` at U/c/2; another judge's review cannot satisfy J. |
| `sealed_invalidation` | U/c completed/sealed with a completed review, then M02 run invalidation overlay: no U trial/subject/minimum/shortlist in analysis; breakdown returns `scoring.not_comparable`. V/c remains `100/1`. Original statuses, fact digests and review bytes remain identical; repeat after import. |
| `cop_display`, `eur_display`, `per_run_rates` | USD `1/1`; M10 prepared COP display `4000/1` at `per_usd=4000/1`, or EUR `9/10` at `9/10`. For two EUR runs rates `9/10` and `4/5`, both USD `1/1`, display `9/10` and `4/5` respectively; score remains `100/1` each. Rate source=`override`, as_of=`2026-10-01`, supplied label survive rows/ranges/minima/breakdown/shortlists. |
| `missing_display_rate`, `missing_calculation_rate` | EUR display rate missing: USD `1/1` known, display unknown `no_rate_conversion`, score `100/1`; never show USD as EUR. Missing EUR price→USD conversion instead makes amount unknown and yields `cost_missing` while w꜀>0; never fetch a current rate. |
| `mixed_display_currencies` | U frozen COP, V frozen EUR, both USD `1/1`: M10 supplies USD display `1/1`, `mixed=true`, `measurements.mixed_display_currency`; both score `100/1`. No analysis currency/rate field. |
| `exact_ties`, `display_only_ties`, `judge_groups` | Exact equal scores sort lexically by distinct stable result IDs independent of input order. Quality-only Q `5/1` versus `4999999/1000000` gives scores `100/1` versus `4999999/50000`, despite same one-decimal display. Separate judges never share minima, means or weight resolution. |
| `originals_and_tariff` | Identical frozen sets resolve `original`; differing quality sets resolve profile defaults while identical ranking sets stay original. Alternative/reset/export leave records unchanged; analysis tariff reaches M10 and its prepared alternative labels/values propagate unchanged. |

Pinned-entry tests capture query-backed `analyse` results and its prepared domain `Population` for original and alternative weights, then disable every read/profile/accounting port and compare `analyse_population` against those captured results on the same snapshot. Assert identical exact scores, metadata and exclusion reasons; missing trials/reviews stay excluded, and supplied invalidated/inconsistent scope is rejected. M13 publication tests own the later-invalidation recheck. M14 owns CLI parser tests for paired tariff flags, lone-flag exit 2/zero requests and unchanged `TariffDTO` forwarding.

Use-case/API tests pin one publication view, reject conflicting trial bindings, omit invalidated subjects after events/resync, and round-trip every DTO/error through real in-process and socket clients with injected contracts. Delay responses to verify stale requests cannot restore excluded rows. Domain properties cover input permutation, weight scaling, exact ties and group isolation. Screen tests render every declared board at 120×40 and 80×24, assert metadata and explicit trial links, and prohibit imports of engine scoring/accounting code. Real M02/M10/M12/M07/M13 integration remains a separate required gate; fixture success alone does not complete M06.
