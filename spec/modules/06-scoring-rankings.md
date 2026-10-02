# M06 — Weighting, eligibility, and rankings

Authority: [the product specification](../SPEC.md). This module defines required analysis behavior. Its [Implementation](#implementation) section places that behavior in the headless engine fixed by [the architecture decision](ARCHITECTURE.md); every interface presents the engine's results and never computes scores, eligibility or normalization itself.

This proposed contract defines application-computed scores and rankings, extending the repository README's separate measured cost/time and quality assessments. Rankings compare priorities across complete harness/model/environment configurations; they do not establish isolated model capability. These are required behaviors, not claims of existing implementation. [R004]

## Inputs, outputs, and boundaries

Analysis consumes matching-template results: stable result identifiers, each result's configuration and trial index, execution status, required-check outcomes, raw rubric grades and validity, judge configuration, cost and elapsed-time measurements with availability, coverage, basis and provenance, original weights, the optional analysis tariff, and current filters. It produces normalized weights, weighted quality, per-configuration trial means and min–max ranges, ranking eligibility and exclusion explanations, eligible reference minima, component contributions, and deterministic ordered results. Original records remain separately inspectable. [R096, R097, R098, R099, R100, R124, R131]

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

When a configuration ran more than one trial, each trial is a separate result; rankings use the configuration's mean cost, mean time and mean quality over its trials, and tables show every trial beside that mean and its min–max range. A configuration enters a ranking only when every one of its trials is eligible for that ranking; a configuration with one trial is ranked exactly as its single result. [R077, R100, R154]

Compute each minimum from configurations eligible for that particular ranking, after applicable filters and judge grouping; recompute when that eligible population changes. Preserve numerical precision throughout normalization, quality, minima, contributions, scoring, and comparison; round only for display. A displayed tie is not an exact numerical tie. Exact ties use a stable result identifier deterministically, keeping separate runs of one configuration distinct. [R099, R124, R131]

## Eligibility and exceptional data

Default shortlists require completed execution, verified required checks, valid required grades, and a raw business rules/specification grade of at least 4/5. Failed or unverified required checks cannot satisfy verification. A high weighted quality score cannot bypass these gates. [R100]

Exclude an entry missing a positively weighted measurement from the affected ranking and explain why; never redistribute its weights across available components. A partial measurement counts as missing for any ranking in which it carries positive weight: partial cost excludes the entry from the lowest-cost ranking and from combined rankings with a cost weight above zero, and partial elapsed time likewise for time. The entry stays in tables with its partial value, its coverage and an explanation such as "cost covers 6 of 7 tasks". A zero-weight component contributes nothing and requires no measurement for that component. This does not waive the separate required-grade and business-grade eligibility gates. Keep failed, incomplete, and excluded entries in full tables with their status visible. Direct lowest-cost, shortest-time, and highest-quality shortlists apply the eligibility and measurement requirements relevant to their ranking. [R100]

The cost that counts for rankings is [M10](10-measurements-cost.md)'s: a reported cost; a verified $0, which holds only when the provider or harness reports $0, usage coverage is complete for every task and the account's billing kind is known and not a subscription (an unknown billing kind never yields a verified $0); an API-equivalent estimate from the price table recorded at launch, labelled as an estimate with its price source and date; or, in sequential runs only, for a configuration on a local endpoint with no API cost, the energy-cost estimate (measured kWh in that configuration's execution windows × tariff), labelled "energy estimate" with its measurement scope (for example GPU + CPU package, not whole-system). A subscription or a missing price is never $0. In parallel runs shared energy is never divided, so such a configuration's cost stays unknown; without a tariff or an energy measurement it is unknown too. A tariff entered in Results as an analysis setting recalculates the energy estimate for the analysis, labelled as alternative, without changing the recorded one. [R101, R114, R155]

Rankings compute in USD. Costs display in the compared runs' frozen display currency, or in USD with a note saying so when the compared runs froze different display currencies; there is no analysis-time currency choice. [R081]

When a verified eligible minimum cost is zero, every verified zero-cost entry receives its full cost contribution, 100 × w꜀; positive-cost entries receive zero cost contribution. Unknown cost never becomes zero. If fewer than five qualify, show only that number; if none qualify or no ranking can be computed, explain the cause. The source gives no corresponding zero-elapsed-time convention; treat that as an unresolved calculation case rather than inventing a ratio or copying the cost exception. [R101]

## Comparison and presentation contract

Within a matching template, display and filter by originating machine, harness/model/effort, environment policy, concurrency, and judge configuration. Machine differences are intentional inputs, not hash mismatches. Apply common selected weights to a combined report while retaining each result's original weights and grades. Keep quality and combined rankings separate by judge configuration. Expose local/imported provenance, cost bases (reported, verified $0, API-equivalent estimate, energy estimate with its scope), and telemetry limitations so template compatibility never implies identical measurement conditions; the source does not mandate automatic exclusion solely for differing cost bases. Results halted by a template change never enter an analysis. [R067, R124]

[M13](13-standalone-html-report.md) uses the README presentation as its starting point and identifies the template and full SHA-256 in every report. Measured tables default to highest known cost first, unknowns last; quality tables default to descending unrounded quality within judge groups. Support sorting, machine/configuration/judge filtering, and task-detail/evidence inspection. [M15](15-terminal-interface.md) and M13 consume the same scoring contracts, served by the engine. [R131]

## Acceptance scenarios

- Save and reload both sets through YAML/TUI. Ranking inputs 2:1:1 preview 50%:25%:25%, independently of category weights. Reject negative, nonfinite, unknown-category, and all-zero inputs. With web grades UX 4 and all others 5, default quality is 4.75; zero UX weight yields 5 while retaining raw UX 4. Exercise defaults, alternatives, reset, and export without judge calls or original-record changes. [R092, R093, R094, R095, R096, R097, R145]
- Two eligible same-judge entries A/B have costs 2/4, times 20/10, and quality 4/5. Equal ranking weights produce A = 76⅔ and B = 83⅓. Filtering out A recomputes B's score to 100. Verify unrounded comparisons and deterministic exact ties across repeated calculations. [R098, R099, R124, R131]
- With weights ½:¼:¼, verified zero cost receives 50 cost points and positive cost receives zero. Unknown cost excludes an entry; selecting zero cost weight removes that measurement requirement. Business grade 3.5 still fails eligibility. Retain all entries in tables, show two when only two qualify, and explain an empty shortlist. [R100, R101]
- Partial cost covering 6 of 7 tasks excludes the entry from lowest-cost and from combined rankings with w꜀ > 0, with that explanation, and leaves it ranked when w꜀ = 0; partial time behaves likewise. A local configuration in a sequential run with a measured kWh and a tariff ranks on its energy estimate, labelled with scope; in a parallel run its cost is unknown. Changing the analysis tariff changes that estimate and the ranking, labelled alternative, and leaves the record unchanged. [R100, R101, R114]
- A configuration with three trials ranks on the mean of its trials' cost, time and quality and shows every trial with the min–max range; one ineligible trial excludes the configuration with that trial named. [R077, R100, R154]
- When a judge group's results froze identical weights, the original ranking uses them labelled "original"; when they differ, it uses the profile defaults labelled "Profile defaults: original weights differ across results", with one common set of category weights for every entry; choosing one result's original weights applies them as an alternative. [R096, R124]
- Exercise frontend and backend workflows, including an existing-repository baseline, through setup, verification, scoring, and report inspection. Verify calculations and failure explanations, TUI navigation/resizing, common-weight imported comparisons, preserved originals, and separated judge groups. [R124, R145, R149]

## Implementation

Implementation decisions under [the architecture decision](ARCHITECTURE.md). They fix where the rules above run and how interfaces reach them; they add no product behavior. Where the contract leaves a case unresolved (omitted weight keys, zero elapsed time), the engine reports it rather than choosing a policy.

### 1. Engine component

Package `axbenchmark.engine.scoring`. M06 is a pure analysis service: it reads retained data through ports, computes, and returns. It owns no persisted state under `~/.axbenchmark/`, publishes no events and starts no processes. Original weights are frozen by [M07](07-run-configuration.md) and retained by [M02](02-retained-results-comparability.md); named presets are persisted by M07 ([M02](02-retained-results-comparability.md) records "scoring presets persisted in YAML by M07"). The only file M06 writes is an exported alternative weight configuration at a path the user chooses.

**Domain** (`engine/scoring/domain/`, no I/O). All arithmetic uses `fractions.Fraction`, so normalization, Q, minima, contributions, scores and comparisons are exact; floats appear only in DTOs, and rounding happens only in view models. [R099, R131]

| Type / function | Contents |
|---|---|
| `ProfileSpec` | `profile_id`, ordered `categories: tuple[CategoryKey, ...]`, `business_category: CategoryKey`, `default_quality: WeightSet`. Values come from M12 through a port; M06 does not hard-code profiles. [R093, R095] |
| `RankingComponent` | Enum `COST`, `TIME`, `QUALITY`. Default ranking weights 1:1:1. [R094] |
| `WeightSet` | `values: Mapping[str, Fraction]` as supplied, before validation. |
| `NormalizedWeights` | `raw: Mapping[K, Fraction]`, `normalized: Mapping[K, Fraction]` (sums to exactly 1). |
| `WeightIssue` | `field` (`quality.<key>`, `ranking.<key>`, `quality`, `ranking`), `reason` (`negative`, `nonfinite`, `unknown_component`, `all_zero`, `missing_component`, `not_a_number`). `missing_component` is reported, never filled: the contract defines no default-fill policy for omitted keys. [R095] |
| `normalize(ws, allowed) -> NormalizedWeights` | Divides each value by its own set's total; raises `InvalidWeights(issues)` listing every issue at once. Each set is validated alone; neither set reads the other. [R095] |
| `Measurement` | `value: Fraction \| None`, `basis` (M10's cost basis: `reported`, `verified_zero`, `estimate` (API-equivalent, with `price_source` and `price_date`), `energy_estimate` (with `scope` and `tariff_source: recorded \| analysis`), `unknown`, `mixed`; time has none) and `coverage` (M10: `complete`, `partial` with covered and total task counts, `unknown`). `value is None` is unknown and never becomes zero; only `basis == verified_zero` triggers the verified-zero minimum rule. Which basis applies (verified $0 conditions, sequential-run energy estimate for a local endpoint) is decided by M10; M06 consumes it. [R101, R114] |
| `ScoringEntry` | One trial: `result_id`, `run_id`, `configuration_id`, `trial_index`, `trial_count`, `status`, check counts (passed / failed / unverified of required), `grades: Mapping[CategoryKey, Fraction] \| None`, `grades_valid`, `judge_group: JudgeGroupId`, `cost`, `time: Measurement`, `original_quality: WeightSet`, `original_ranking: WeightSet`, comparison dimensions (machine, harness, model, effort, environment policy, concurrency, origin local/imported). |
| `ConfigurationSubject` | The unit that is ranked: `run_id`, `configuration_id`, `trials: tuple[ScoringEntry, ...]` in trial order (one for a single-trial configuration), `stable_id` = the `result_id` of its lowest trial index, used for exact tie-breaks. Built by `subjects(entries)`; distinct runs never share a subject. [R077, R131] |
| `quality(grades, weights) -> Fraction` | Q = Σ aᵢ × gᵢ over normalized category weights. [R097] |
| `trial_summary(subject, measured) -> ConfigurationSummary` | Cost and time come unchanged from M10's `TrialSummary` (`measured`): mean, min–max, basis and coverage under M10's single trial rule (unknown when any trial is unknown, partial when any is partial). M06 adds only the quality mean and min–max over the trials as exact `Fraction`s (unknown when any trial is ungraded or its grades are invalid) and the subject's eligibility (every trial eligible, see `gates`). M06 has no cost or time aggregation rule of its own. [R077] |
| `ExclusionReason` | Enum: `not_completed`, `check_failed`, `check_unverified`, `ungraded`, `grades_invalid`, `business_grade_below_4`, `cost_missing`, `cost_partial`, `time_missing`, `time_partial`, `zero_time_unresolved`, `trial_ineligible`. Each carries the detail needed for its message: `cost_partial` and `time_partial` carry covered and total tasks ("cost covers 6 of 7 tasks"); `trial_ineligible` carries the trial index and that trial's own reasons. [R077, R100] |
| `gates(subject, ranking, rw) -> tuple[ExclusionReason, ...]` | Default gates (completed, every required check verified, valid grades, raw business grade ≥ 4) applied to every trial; any failing trial yields `trial_ineligible` for a multi-trial subject (the plain reason for a single trial). Then the measurement each ranking needs, on the trial means: combined needs cost if w꜀ > 0 and time if wₜ > 0; lowest-cost needs cost; shortest-time needs time; highest-quality needs nothing further. A needed measurement that is unknown is `*_missing`; one that is partial is `*_partial`. Weights are never redistributed. [R077, R100] |
| `RankingKind` | `COMBINED`, `LOWEST_COST`, `SHORTEST_TIME`, `HIGHEST_QUALITY`. |
| `minima(eligible) -> Minima` | Minimum mean cost and mean time over the subjects eligible for that ranking within one judge group after filters; records whether the cost minimum is a verified zero. [R099, R101] |
| `combined_score(subject, q, minima, rw) -> Contributions` | `cost_points`, `time_points`, `quality_points`, `score`, `cost_rule` (`ratio`, `verified_zero_minimum`, `zero_weight`). Verified-zero minimum: verified $0 entries get 100 × w꜀, positive costs get 0. A zero time minimum with wₜ > 0 marks the ranking `zero_time_unresolved` instead of producing a ratio. [R098, R099, R101] |
| `order(rows)` | Sort key `(-score, stable_id)` on exact values; shortlists use `(cost, stable_id)`, `(time, stable_id)`, `(-q, stable_id)` on trial means and keep at most five. Separate runs of one configuration are separate subjects with separate ids. [R099, R131] |
| `analyse(population, selection, group) -> Analysis` | Runs the above for one judge group: per-trial Q, per-subject trial summaries and exclusions per ranking, the four rankings with qualifying counts and empty-ranking explanations, minima, full-table default orders (highest known cost first, unknown last; quality descending within the group). Judge groups are never merged. [R077, R100, R124, R131] |
| `resolve_original(group_entries, profile) -> AppliedWeights` | For each set independently: when every entry of the group in the current population froze the same weights, `source = ORIGINAL`, label "original"; otherwise the profile's default weights (`ProfileSpec.default_quality`, ranking 1:1:1), `source = PROFILE_DEFAULTS`, label "Profile defaults: original weights differ across results". Never refuses. Also returns the distinct frozen sets with the result ids that froze each. [R096, R124] |
| `WeightSelection` | `ORIGINAL` (the common weights from `resolve_original`, applied to every entry, so quality uses one set of category weights in a ranking) or `ALTERNATIVE(quality, ranking, label, origin)` applied to every entry in the comparison, where `origin` is `custom`, `preset(name)` or `result_original(result_id)` (one result's frozen weights chosen in the editor). [R096, R124] |

**Ports** (`engine/scoring/ports.py`):

```python
class ResultPopulation(Protocol):
    async def load(self, template_sha: str, filters: ResultFilter, tariff: Tariff | None) -> Population: ...   # M02's domain ResultFilter
    # Population: profile_id, entries: tuple[ScoringEntry, ...] (one per trial, comparable results only),
    # measured: Mapping[(run_id, configuration_id), TrialSummary] from M10 (cost and time trial means and ranges),
    # judge_groups: tuple[JudgeGroup, ...], notices; tariff None means each run's recorded tariff

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
| `ComputeRankings` | `scoring.rank` | Load population (with the analysis tariff, if any), resolve profile, `resolve_original` or validate an alternative selection, `analyse`, attach notices and capabilities. |
| `ExplainScore` | `scoring.breakdown` | As `ComputeRankings`, then project one entry's gates, quality rows and contribution rows, with previous/next ranked ids. |
| `PreviewWeights` | `scoring.preview_weights` | `normalize` both sets independently; return percentages or issues without raising. [R095] |
| `ValidateWeights` | `scoring.validate_weights` | `normalize` both sets; raise `InvalidWeights` on any issue. Also the in-engine `WeightValidation` Protocol used by M07 at launch. |
| `ListWeightChoices` | `scoring.weight_choices` | The common weights the original analysis uses (from `resolve_original`), each distinct frozen original set with the results that froze it, profile defaults with 1:1:1, and M07 presets for the template. |
| `ExportWeights` | `scoring.export_weights` | Validate, then write the alternative configuration through `WeightExportSink`. [R096] |

The engine exposes `ComputeRankings` and `ValidateWeights` to other modules as application Protocols (`RankingService`, `WeightValidation`), so [M07](07-run-configuration.md) launch validation and [M13](13-standalone-html-report.md) report generation run the same code as the API. It also offers `ScoringRules`, the pure rules other modules apply to retained data without restating them:

```python
class RankingService(Protocol):          # M13
    async def analyse(self, template_sha: str, filters: ResultFilter, group: JudgeGroupId, selection: WeightSelection,
                      tariff: Tariff | None = None) -> Analysis: ...   # tariff None: each run's recorded tariff
    def scoring_messages(self) -> Mapping[str, str]: ...      # reason code -> message template, for the report's in-page recomputation
class WeightValidation(Protocol):        # M07
    def validate(self, profile_id: str, quality: WeightSet, ranking: WeightSet) -> tuple[NormalizedWeights, NormalizedWeights]: ...  # raises InvalidWeights
class ScoringRules(Protocol):            # M02 (results order, Q, notes, trial summaries), M08 (not-passed effect text), M12 (Q on a review)
    def measured_order_key(self, r: ScoringEntry) -> SortKey: ...             # highest known cost first, unknown last
    def weighted_quality(self, grades: RawGrades, weights: WeightSet) -> QualityBreakdown: ...
    def eligibility_notes(self, r: ScoringEntry) -> tuple[EligibilityNote, ...]: ...
    def trial_summary(self, trials: Sequence[ScoringEntry], measured: TrialSummary) -> ConfigurationSummary: ...  # cost and time from M10's TrialSummary; adds Q mean and min–max (each trial's original weights) and eligibility
```

**Adapters** (`engine/scoring/adapters/`):

| Adapter | Implements |
|---|---|
| `results_population.py` | `ResultPopulation` over M02's `RetainedResultReader.for_template` (comparable retained results with trial refs, reviews, check outcomes, original weights, judge configuration), M10's `CostAnalysis.ranking_cost(result, tariff, display_currency)` (the cost that counts for rankings, with basis, coverage, price source or energy scope; ranked on its USD amount; `display_currency="USD"` only when M10's `display_currency_for` the population gives USD because the runs froze different display currencies) and M10's `MeasurementReader` (elapsed time with coverage, and `trial_summary(run_id, configuration_id, tariff)` for each subject's cost and time means and ranges). |
| `profiles.py` | `GradingProfiles` over M12's application interface. |
| `presets.py` | `WeightPresets` over M07's application interface. |
| `yaml_export.py` | `WeightExportSink`; writes the M07 preset YAML schema so an export can be reused as a preset. |
| `rpc.py` | DTO ↔ domain mapping. Weight maps are `dict[str, float \| str]` with `allow_inf_nan=True`: a number or the raw input text, so negative, nonfinite, unparsable and unknown inputs reach the domain and come back as `scoring.invalid_weights` rather than transport errors. Values convert with `Fraction(Decimal(str(v)))`; text that does not parse is `not_a_number`. Responses carry floats plus an exact rational string where ties matter. |

### 2. API surface (`scoring.*`)

Common request fragments: `template_sha: str`; `filters: ResultFilters` (M02's DTO: machine, configuration, environment policy, concurrency, judge); `judge_group: str | None` (first group when omitted); `weights: WeightSelectionDTO` = `{source: "original" | "alternative", quality: dict[str, float | str] | None, ranking: dict[str, float | str] | None, label: str | None, origin: {kind: "custom" | "preset" | "result_original", name?, result_id?} | None}`; `tariff: TariffDTO | None` (M10's DTO; an analysis tariff, omitted for each run's recorded tariff).

Queries (safety `read`):

| Method | Request | Response | Errors |
|---|---|---|---|
| `scoring.rank` | `template_sha`, `filters`, `judge_group`, `weights`, `tariff` | `RankingView` | `scoring.unknown_template`, `scoring.unknown_judge_group`, `scoring.invalid_weights`, `scoring.invalid_tariff` (M10's issues with `field`) |
| `scoring.breakdown` | as `scoring.rank` + `result_id` (any trial of the configuration) | `ScoreBreakdown` | as above + `scoring.unknown_result` |
| `scoring.preview_weights` | `profile_id`, `quality: dict[str, float \| str]`, `ranking: dict[str, float \| str]` | `WeightPreview` (invalid input is data here, not an error) | `scoring.unknown_profile` |
| `scoring.validate_weights` | as `scoring.preview_weights` | `ValidatedWeights` (raw and normalized for both sets) | `scoring.invalid_weights`, `scoring.unknown_profile` |
| `scoring.weight_choices` | `template_sha`, `judge_group: str \| None` | `WeightChoices` | `scoring.unknown_template` |

Commands:

| Method | Request | Response | Errors | Safety |
|---|---|---|---|---|
| `scoring.export_weights` | `template_sha`, `profile_id`, `quality`, `ranking`, `label`, `path: str`, `overwrite: bool = False` | `WeightExportResult {path}` | `scoring.invalid_weights`, `scoring.export_target_exists`, `scoring.export_failed` | `write` |

Jobs: none; every computation is a synchronous query. Events: none; M06 holds no state that changes. Screens refresh on M02 events (section 4).

Response models (pydantic, `axbenchmark.api.scoring`):

| Model | Fields |
|---|---|
| `RankingView` | `template_sha`, `profile_id`, `categories: list[CategoryDTO]`, `judge_groups: list[JudgeGroupDTO]` (id, label, judge harness/model/effort, entry count), `judge_group`, `weights: AppliedWeightsDTO`, `tariff: AppliedTariffDTO` (source recorded or analysis, label), `combined: RankingDTO`, `lowest_cost`, `shortest_time`, `highest_quality: ShortlistDTO`, `configurations: list[ConfigurationDTO]`, `entries: list[EntryDTO]`, `notices: list[NoticeDTO]`, `capabilities: RankingCapabilities` |
| `AppliedWeightsDTO` | `source: "original" \| "alternative"`, `label` (e.g. "original", "Profile defaults: original weights differ across results", or the alternative's label), `quality`, `ranking: AppliedSetDTO {source: "original" \| "profile_defaults" \| "alternative", label, weights: list[WeightDTO]}`; `WeightDTO = {key, label, raw, normalized}`. Both sets are always present: one common set applies to every entry. |
| `RankingDTO` | `kind`, `rows: list[RankedRowDTO]`, `qualifying`, `population`, `minima: MinimaDTO`, `computable: bool`, `explanation: str \| None` |
| `RankedRowDTO` | `rank`, `result_id` (the subject's `stable_id`), `run_id`, `configuration_id`, `trial_result_ids`, `harness`, `model`, `effort`, `score`, `score_exact`, `cost_points`, `time_points`, `quality_points`, `quality`, `cost`, `time: MeasurementDTO` (trial means), `ranges: {cost, time, quality: {min, max}} \| None` (multi-trial only), `tie_broken_by_id: bool` |
| `ShortlistDTO` | `rows` (≤ 5: rank, result_id, model, effort, value, `trials`), `qualifying`, `explanation: str \| None` |
| `ConfigurationDTO` | `run_id`, `configuration_id`, `stable_id`, `result_ids` in trial order, `trial_count`, `cost`, `time`, `quality: {mean: MeasurementDTO, min, max}`, `rankings: dict[RankingKind, InclusionDTO]` (a multi-trial exclusion names the ineligible trial and its reasons) |
| `EntryDTO` | One per trial: `result_id`, `configuration_id`, `trial {index, count}`, `harness`, `model`, `effort`, `machine`, `origin`, `status`, `checks {passed, failed, unverified, required}`, `business_grade`, `quality`, `cost`, `time`, `original_weights_label`, `rankings: dict[RankingKind, InclusionDTO]` where `InclusionDTO = {included: bool, reasons: list[ReasonDTO {code, message}]}` (the configuration's inclusion) |
| `MinimaDTO` | `cost: MeasurementDTO \| None`, `cost_result_id`, `cost_rule`, `time: MeasurementDTO \| None`, `time_result_id` |
| `MeasurementDTO` | `value: float \| None`, `basis`, `coverage`, `covered_tasks?`, `total_tasks?`, `price_source?`, `price_date?` (API-equivalent estimate), `scope?`, `tariff_source?` (energy estimate) |
| `NoticeDTO` | `code`, `severity` (info, warning), `message`, e.g. `scoring.verified_zero_minimum`, `scoring.alternative_active`, `scoring.profile_defaults_used` ("Profile defaults: original weights differ across results"), `scoring.mixed_cost_bases`, `scoring.estimated_costs` (API-equivalent estimates with price source and date), `scoring.energy_estimate_costs` (energy estimates with their scope), `scoring.analysis_tariff_active`, `scoring.partial_measurements`, `scoring.telemetry_limited`, `scoring.imported_entries` |
| `RankingCapabilities` | `can_reset`, `can_export_weights`, `can_save_preset` (true only for an alternative), `can_edit_weights`, `can_breakdown`, each with `reason: str \| None` |
| `ScoreBreakdown` | `result_id`, `configuration_id`, `harness`, `model`, `effort`, `judge_group`, `weights_label`, `trials: list {result_id, index, gates: list[GateDTO], quality, cost, time}` (one row for a single trial), `gates: list[GateDTO {name, passed, detail}]`, `quality_rows: list {key, label, raw_grade (trial mean for several trials), weight_raw, normalized, contribution}`, `quality`, `combined_rows: list {component, measured (trial mean, with basis and scope), eligible_min, rule, weight_normalized, points}`, `score`, `score_exact`, `rank \| None`, `of`, `previous_result_id`, `next_result_id`, `exclusions: list[ReasonDTO]` |
| `WeightPreview` | `quality`, `ranking: SetPreviewDTO {rows: list {key, label, raw, normalized \| None, issue \| None}, total, valid, issues: list[WeightIssueDTO]}`, `capabilities {can_apply, can_save_preset}` |
| `ValidatedWeights` | `profile_id`, `quality`, `ranking: list[WeightDTO]` |
| `WeightChoices` | `common: AppliedWeightsDTO` (what the original analysis uses), `original_differs: bool`, `originals: list[{label, result_ids, weights: ValidatedWeights}]` (each distinct frozen set, selectable as an alternative), `defaults: ValidatedWeights`, `presets: list[{name, weights: ValidatedWeights}]` |

Error codes: `scoring.unknown_template`, `scoring.unknown_judge_group`, `scoring.unknown_result`, `scoring.unknown_profile`, `scoring.invalid_weights`, `scoring.invalid_tariff`, `scoring.export_target_exists`, `scoring.export_failed`. `scoring.invalid_weights` carries one `field` path per issue (`quality.ux`, `ranking.time`, `quality`) and its reason, so the editor marks the exact input. Differing original weights are not an error: the original analysis uses profile defaults and says so in `weights.label` and `scoring.profile_defaults_used`. [R095, R096, R145]

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `RetainedResultReader.for_template` (the application interface behind `results.list`; scoring inputs: status, required-check counts, raw grades and validity, judge configuration, cost/time measurements with availability and basis, original weights, comparison dimensions, origin) | M02 | `ResultPopulation` adapter. |
| `ResultFilters` API DTO and the domain `ResultFilter` it maps to | M02 | Shared filter model for `scoring.rank`. |
| `results.result.sealed`, `results.import.registered`, `results.review.added` events | M02 | Rankings tab refreshes after imports, new runs and rejudging. |
| `judging.get_profile` and `ProfileCatalog.get` | M12 | Category keys, labels, business category and default weights for a profile. |
| `configs.list_presets`, `configs.save_preset` | M07 | Preset choices in the editor; Save preset… issues `configs.save_preset`. |
| Required-check outcome states (passed, failed, unverified) | M08 | Verification gate, via M02 records. |
| `CostAnalysis.ranking_cost(result, tariff)` (cost that counts for rankings: reported, verified $0 per SPEC §5, API-equivalent estimate with price source and date, or sequential-run energy estimate for a local endpoint with scope and tariff source; unknown otherwise), `MeasurementReader` (elapsed time with coverage; `trial_summary(run_id, configuration_id, tariff)` → `TrialSummary`, the single cost and time trial rule), `TariffDTO` and its validation behind `scoring.invalid_tariff` | M10 | `Measurement.basis`, `.coverage` and labels; verified-zero detection; analysis tariff. |
| Trial refs (`configuration_id`, trial index and count) on retained results; `for_template` returning comparable results only | M02 | Building `ConfigurationSubject`s; results halted by a template change never enter. |
| `reports.generate` accepting `weights: WeightSelectionDTO`, `filters`, `judge_group`, `tariff` | M13 | `h` from Rankings writes the report with the current weights and analysis tariff. |
| `PromptScreen` (shared single-input prompt) | M15 | Name for Save preset…, path for Export configuration. |
| `events.subscribe` | M11 | Subscriptions for the Rankings tab. |

M07 consumes `WeightValidation` / `scoring.validate_weights` and `scoring.weight_choices`; M13 consumes `RankingService` and the conformance vectors in section 6.

### 4. Screens

Owned artboards: Rankings, RankingsAlternative, ScoreBreakdown, WeightsEditor, WeightsInvalid ([navigation §11](../design/wireframe-tui/navigation.md)). Each screen is a view over `scoring.*` responses. No screen normalizes, gates, ranks, picks a minimum or decides whether an action is allowed; it renders rows, messages and capability flags from the engine and shows typed errors verbatim.

**Rankings tab** — `RankingsPane`, the content of `TabPane #tab-rankings` in `ResultsScreen` (`tui/screens/results.py`, screen owned with M02). View model `tui/viewmodels/rankings.py`:

```python
@dataclass(frozen=True)
class RankingsVM:
    group_options: list[tuple[str, str]]; group_id: str
    weights_label: str; is_alternative: bool          # "original · quality web v1 · ranking 1:1:1" or "Profile defaults: original weights differ across results"
    tariff_label: str | None                          # from view.tariff; class -alternative for an analysis tariff
    combined_title: str; combined_subtitle: str       # "Combined · cost 33.3% …", "3 of 8 qualify"
    combined_rows: list[RowVM]                        # key = result_id (stable_id); cells pre-formatted; "× 3 trials", "mean (min–max)" when ranges are present
    shortlists: dict[str, ShortlistVM]                # title, rows, subtitle "4 qualify" | "top 5", explanation
    entries: list[RowVM]                              # one per trial, "trial 2/3"; last cell "✓ ranked" | "✗ " + engine reason messages
    excluded_compact: list[tuple[str, str]]           # compact #excluded lines
    minimums_text: str; notices: list[NoticeVM]
    capabilities: RankingCapabilities
    selection: AnalysisSelection                      # template_sha, filters, judge_group, weights, tariff, as last sent

def build_rankings_vm(view: RankingView, selection: AnalysisSelection, compact: bool) -> RankingsVM
```

Formatting only: score and points to one decimal, Q to two, cost as `$x.xx` or `unknown` when `value is None`, a partial value with `▲` and the engine's coverage text, the basis label beside a cost (`estimate · <price source>, <date>`, `energy estimate · <scope>`), durations. Order comes from the response; the view model never re-sorts. Column sorting chosen by the user sorts on the full-precision fields.

| Item | Behavior |
|---|---|
| Load | On first activation of the tab: `scoring.rank(template_sha, filters, judge_group=None, weights={source: "original"}, tariff)` in a worker, where `tariff` is the ResultsScreen's analysis tariff (M02's `e`), if any. |
| Subscriptions | On mount `events.subscribe(["results"])`, handling `results.result.sealed`, `results.import.registered` and `results.review.added` filtered to the template by `template_sha256`; each event re-issues `scoring.rank` with the current selection. Unsubscribe on unmount. |
| ContentSwitcher | `#combined` / `#combined-loading` / `#combined-empty` (shows `combined.explanation`) / `#combined-error` (error message + Retry). Each shortlist DataTable (`#lowest-cost`, `#shortest-time`, `#highest-quality`) shows its `explanation` when empty. `#all-entries` is empty only when the template has no results. |
| Widgets | `Select #judge-group` from `judge_groups`; `Static #weights-label` (class `-alternative` when `is_alternative`; shows "Profile defaults: original weights differ across results" from `weights.label` when the engine used them); `#minimums` from `minimums_text`; alternative notice from `scoring.alternative_active`; tariff label from `view.tariff`; compact (`Screen.-compact`): `#shortlists` one line each and `#excluded`. |
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

**ScoreBreakdownScreen** — `ModalScreen[None]` in `tui/screens/results.py`; view model `tui/viewmodels/score_breakdown.py` (`BreakdownVM`: header line with the weights label, one line per trial with its gates and values when there are several, gate lines with ✓/✗ and engine detail, `#quality-breakdown` rows, `#combined-breakdown` rows with the engine's `rule` rendered as text, score line `rank n of m`, `prev_id`, `next_id`).

| Item | Behavior |
|---|---|
| Load | `scoring.breakdown(selection, result_id)`. |
| ContentSwitcher | `#breakdown` / `#breakdown-loading` / `#breakdown-error`. |
| `esc` | `dismiss(None)`, no call. |
| `←` / `→` | `scoring.breakdown(result_id=previous_result_id / next_result_id)`; disabled when the id is None. |

**WeightsScreen** — `ModalScreen[ValidatedWeights | None]` in `tui/screens/weights.py` (the wireframe's `WeightSet` result type is `ValidatedWeights`). Constructor `WeightsScreen(context: Literal["analysis", "setup"], template_sha: str, profile_id: str, judge_group: str | None, initial: ValidatedWeights)`. It is a pure editor: it never applies weights. The caller does: Rankings issues `scoring.rank`, SetupScreen (M07) issues its `configs.*` call, ProfilesScreen (M12) opens it in analysis context. In `setup` context the primary button reads "Use weights" instead of "Apply as alternative". View model `tui/viewmodels/weights.py`:

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
| Load | `scoring.weight_choices(template_sha, judge_group)`; inputs start from `initial`, then `scoring.preview_weights`. |
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

States map to artboards: WeightsEditor is a valid preview; WeightsInvalid is a preview with issues (Apply and Save preset disabled, percentages `—`); RankingsAlternative is `RankingView` with `weights.source == "alternative"`.

### 5. CLI

The source names no ranking command. Under the architecture rule that every API method is reachable from the CLI, the registry-generated `scoring` group exposes them; these are implementation-level commands owned by [M14](14-command-line-interface.md), not new product requirements.

| Command | Method |
|---|---|
| `axbenchmark scoring rank --template SHA [--judge-group ID] [filters] [--weights FILE] [--tariff AMOUNT_PER_KWH] [--json]` | `scoring.rank` (`--weights` reads a preset/export YAML as an alternative; `--tariff` is an analysis tariff) |
| `axbenchmark scoring explain RESULT_ID --template SHA [--weights FILE] [--tariff AMOUNT_PER_KWH] [--json]` | `scoring.breakdown` |
| `axbenchmark scoring check-weights FILE --profile ID [--json]` | `scoring.validate_weights` |
| `axbenchmark scoring choices --template SHA [--json]` | `scoring.weight_choices` |
| `axbenchmark scoring export-weights FILE --template SHA --output PATH [--overwrite]` | `scoring.export_weights` |

`scoring.invalid_weights` and `scoring.invalid_tariff` exit 1 and print each field path with its reason. Human output prints the weights label, including "Profile defaults: original weights differ across results". Unattended launch reaches `scoring.validate_weights` through M07's launch validation.

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain (`tests/engine/scoring/domain/`) | Every acceptance scenario with exact `Fraction` results: 2:1:1 → ½, ¼, ¼; web grades UX 4, others 5 → 19/4; UX weight 0 → 5 with raw UX 4 retained; A/B → 230/3 and 250/3; B alone → 100; ½:¼:¼ with verified $0 → 50 and 0 cost points; unknown cost excluded only while w꜀ > 0; business 3.5 fails; two qualify → two rows; none → explanation; zero time minimum → `zero_time_unresolved`. Partial cost (6 of 7 tasks) → `cost_partial` with that detail in lowest-cost and in combined only while w꜀ > 0; partial time likewise. `energy_estimate` cost is a known cost and ranks; `unknown` (parallel run, no tariff, no energy) excludes. Three trials → means and min–max as exact fractions; one ineligible trial → `trial_ineligible` naming it; ties use `stable_id`. `resolve_original`: identical frozen sets → `ORIGINAL`; differing sets → `PROFILE_DEFAULTS` with its label, one common category set for every entry, ranking and quality sets resolved independently. Rejection of negative, nonfinite, unknown and all-zero inputs with field paths. Property tests (hypothesis): scaling a weight set leaves normalized weights and order unchanged; input order never changes output order; displayed-equal scores that differ exactly keep their exact order; exact ties order by result id; groups never mix. |
| Use cases (`tests/engine/scoring/application/`) | Fake `ResultPopulation`, `GradingProfiles`, `WeightPresets`, `WeightExportSink`. Alternative analysis leaves the fake population's frozen records identical; filters change minima; differing originals produce a ranking under profile defaults with `scoring.profile_defaults_used`, and a result's original set chosen as alternative is labelled as such; an analysis tariff reaches the fake `ResultPopulation` and sets `scoring.analysis_tariff_active` without changing records; export writes only through the sink. |
| API (`tests/api/scoring/`) | `InProcessClient` against the composed engine with fake adapters, no interface: request/response JSON round trips, typed error codes and field paths, `allow_inf_nan` inputs reach the domain, registry kinds and safety classes, JSON Schema snapshot. `import-linter` contracts for the four layers. |
| Conformance vectors | The domain tests export `tests/fixtures/scoring_vectors.json` (inputs, weights, expected exact results, including multi-trial subjects, partial measurements, energy-estimate costs and differing originals). M13's report JavaScript is tested against the same file so no report formula disagrees with M06. [R132] |
| Screens (`tests/tui/`) | View-model unit tests from canned `RankingView`, `ScoreBreakdown`, `WeightPreview` (formatting, `unknown` cost, labels). Textual `Pilot` against a fake client: each binding issues exactly the call in section 4; `r`, Apply and Save preset follow capability flags; engine errors render verbatim in `#…-error`; compact layout at 80×24; filter change re-requests; no screen imports `axbenchmark.engine`. |
