# M06 — Weighting, eligibility, and rankings

Authority: [the product specification](../SPEC.md). This module defines required analysis behavior. Its [Implementation](#implementation) section places that behavior in the headless engine fixed by [the architecture decision](ARCHITECTURE.md); every interface presents the engine's results and never computes scores, eligibility or normalization itself.

This proposed contract defines application-computed scores and rankings, extending the repository README's separate measured cost/time and quality assessments. Rankings compare priorities across complete harness/model/environment configurations; they do not establish isolated model capability. These are required behaviors, not claims of existing implementation. [R004]

## Inputs, outputs, and boundaries

Analysis consumes matching-template results: stable result identifiers, execution status, required-check outcomes, raw rubric grades and validity, judge configuration, cost and elapsed-time measurements with availability and provenance, original weights, and current filters. It produces normalized weights, weighted quality, ranking eligibility and exclusion explanations, eligible reference minima, component contributions, and deterministic ordered results. Original records remain separately inspectable. [R096, R097, R098, R099, R100, R124, R131]

[M07](07-run-configuration.md) completes setup before launch: independently select judge harness/model/effort, preselecting a valid saved choice, then the planner configuration when used, otherwise the first selected usable configuration. Use the template rubric and finish both weight choices before execution. [M12](12-quality-judging.md) supplies validated raw grades; [M08](08-verification-evidence.md) supplies required-check outcomes; [M10](10-measurements-cost.md) supplies measurements; [M02](02-retained-results-comparability.md) preserves originals and provenance. M06 computes totals rather than accepting judge-calculated totals as authoritative. [R033, R096, R100]

## Weight operations and validation

Expose two independently editable weight sets in the TUI and YAML. Quality-category weights determine the overall application grade; cost/time/quality weights determine the combined decision score and default to equal thirds. Neither set changes the other's normalization. [R092, R093, R094]

Quality defaults follow the template profile: frontend/fullstack uses UX 25%, visual quality 15%, code quality 20%, business rules/specification 25%, robustness 10%, and accessibility 5%. Backend substitutes developer experience, API/interface design, and operability/documentation in the corresponding positions. M12 defines these profiles; use the same template profile throughout a comparison. [R033, R093, R095]

Support editing, named preset saving/loading, restoring defaults, and previewing normalized percentages. Every supplied weight must be finite and nonnegative, and each set must have a positive total. Divide each weight by its own set's total. Reject unknown categories/components, negative or nonfinite values, and all-zero sets with an explanation identifying the invalid input. Zero removes that component's contribution while retaining raw category grades for later analysis. Both sets must remain saved and reproducible. The source does not specify how omitted weight keys are handled; this contract does not invent a default-fill policy. [R095, R145]

Freeze original weights before execution and retain raw grades separately. Exploring either alternative set in results or HTML recomputes totals without judge calls or overwriting original results. Label alternatives, provide reset to the original analysis, and permit alternative configuration/report export. Restoring product/profile defaults and resetting an alternative to frozen originals are distinct operations. [R096, R145]

## Calculations

For valid raw category grades gᵢ on the 1–5 scale and normalized category weights aᵢ, quality Q = Σ(aᵢ × gᵢ). Equivalently, multiply each grade by its original category weight, sum those products, and divide by the original category-weight total. The application performs this weighted mean from retained grades. [R096, R097]

For normalized ranking weights w꜀, wₜ, wᵩ summing to one, the combined score is exactly 100 × (w꜀ × minEligibleCost / cost + wₜ × minEligibleTime / time + wᵩ × Q / 5), subject to the zero-weight and verified-zero-cost rules below. The three displayed contributions are the corresponding terms multiplied by 100. [R098, R099]

Compute each minimum from configurations eligible for that particular ranking, after applicable filters and judge grouping; recompute when that eligible population changes. Preserve numerical precision throughout normalization, quality, minima, contributions, scoring, and comparison; round only for display. A displayed tie is not an exact numerical tie. Exact ties use a stable result identifier deterministically, keeping separate runs of one configuration distinct. [R099, R124, R131]

## Eligibility and exceptional data

Default shortlists require completed execution, verified required checks, valid required grades, and a raw business rules/specification grade of at least 4/5. Failed or unverified required checks cannot satisfy verification. A high weighted quality score cannot bypass these gates. [R100]

Exclude an entry missing a positively weighted measurement from the affected ranking and explain why; never redistribute its weights across available components. A zero-weight component contributes nothing and requires no measurement for that component. This does not waive the separate required-grade and business-grade eligibility gates. Keep failed, incomplete, and excluded entries in full tables with their status visible. Direct lowest-cost, shortest-time, and highest-quality shortlists apply the eligibility and measurement requirements relevant to their ranking. [R100]

When a verified eligible minimum cost is zero, every verified zero-cost entry receives its full cost contribution, 100 × w꜀; positive-cost entries receive zero cost contribution. Unknown cost never becomes zero. If fewer than five qualify, show only that number; if none qualify or no ranking can be computed, explain the cause. The source gives no corresponding zero-elapsed-time convention; treat that as an unresolved calculation case rather than inventing a ratio or copying the cost exception. [R101]

## Comparison and presentation contract

Within a matching template, display and filter by originating machine, harness/model/effort, environment policy, concurrency, and judge configuration. Machine differences are intentional inputs, not hash mismatches. Apply common selected weights to a combined report while retaining each result's original weights and grades. Keep quality and combined rankings separate by judge configuration. Expose local/imported provenance, cost bases, and telemetry limitations so template compatibility never implies identical measurement conditions; the source does not mandate automatic exclusion solely for differing cost bases. [R124]

[M13](13-standalone-html-report.md) uses the README presentation as its starting point and identifies the template and full SHA-256 in every report. Measured tables default to highest known cost first, unknowns last; quality tables default to descending unrounded quality within judge groups. Support sorting, machine/configuration/judge filtering, and task-detail/evidence inspection. [M15](15-terminal-interface.md) and M13 consume the same scoring contracts, served by the engine. [R131]

## Acceptance scenarios

- Save and reload both sets through YAML/TUI. Ranking inputs 2:1:1 preview 50%:25%:25%, independently of category weights. Reject negative, nonfinite, unknown-category, and all-zero inputs. With web grades UX 4 and all others 5, default quality is 4.75; zero UX weight yields 5 while retaining raw UX 4. Exercise defaults, alternatives, reset, and export without judge calls or original-record changes. [R092, R093, R094, R095, R096, R097, R145]
- Two eligible same-judge entries A/B have costs 2/4, times 20/10, and quality 4/5. Equal ranking weights produce A = 76⅔ and B = 83⅓. Filtering out A recomputes B's score to 100. Verify unrounded comparisons and deterministic exact ties across repeated calculations. [R098, R099, R124, R131]
- With weights ½:¼:¼, verified zero cost receives 50 cost points and positive cost receives zero. Unknown cost excludes an entry; selecting zero cost weight removes that measurement requirement. Business grade 3.5 still fails eligibility. Retain all entries in tables, show two when only two qualify, and explain an empty shortlist. [R100, R101]
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
| `Measurement` | `value: Fraction \| None`, `basis` (M10's cost basis: `reported`, `estimate`, `verified_zero`, `unknown`, `mixed`; time has none) and `coverage` (M10: `complete`, `partial`, `unknown`). `value is None` is unknown and never becomes zero; only `basis == verified_zero` triggers the verified-zero minimum rule. [R101] |
| `ScoringEntry` | `result_id`, `status`, check counts (passed / failed / unverified of required), `grades: Mapping[CategoryKey, Fraction] \| None`, `grades_valid`, `judge_group: JudgeGroupId`, `cost`, `time: Measurement`, `original_quality: WeightSet`, `original_ranking: WeightSet`, comparison dimensions (machine, harness, model, effort, environment policy, concurrency, origin local/imported). |
| `quality(grades, weights) -> Fraction` | Q = Σ aᵢ × gᵢ over normalized category weights. [R097] |
| `ExclusionReason` | Enum: `not_completed`, `check_failed`, `check_unverified`, `ungraded`, `grades_invalid`, `business_grade_below_4`, `cost_missing`, `time_missing`, `zero_time_unresolved`. Each carries the detail needed for its message. [R100] |
| `gates(entry, ranking, rw) -> tuple[ExclusionReason, ...]` | Default gates (completed, every required check verified, valid grades, raw business grade ≥ 4) for every ranking, plus the measurement each ranking needs: combined needs cost if w꜀ > 0 and time if wₜ > 0; lowest-cost needs cost; shortest-time needs time; highest-quality needs nothing further. Weights are never redistributed. [R100] |
| `RankingKind` | `COMBINED`, `LOWEST_COST`, `SHORTEST_TIME`, `HIGHEST_QUALITY`. |
| `minima(eligible) -> Minima` | Minimum cost and time over the entries eligible for that ranking within one judge group after filters; records whether the cost minimum is a verified zero. [R099, R101] |
| `combined_score(entry, q, minima, rw) -> Contributions` | `cost_points`, `time_points`, `quality_points`, `score`, `cost_rule` (`ratio`, `verified_zero_minimum`, `zero_weight`). Verified-zero minimum: verified $0 entries get 100 × w꜀, positive costs get 0. A zero time minimum with wₜ > 0 marks the ranking `zero_time_unresolved` instead of producing a ratio. [R098, R099, R101] |
| `order(rows)` | Sort key `(-score, result_id)` on exact values; shortlists use `(cost, result_id)`, `(time, result_id)`, `(-q, result_id)` and keep at most five. Separate runs of one configuration keep separate result ids. [R099, R131] |
| `analyse(population, selection, group) -> Analysis` | Runs the above for one judge group: per-entry Q and exclusions per ranking, the four rankings with qualifying counts and empty-ranking explanations, minima, full-table default orders (highest known cost first, unknown last; quality descending within the group). Judge groups are never merged. [R100, R124, R131] |
| `WeightSelection` | `ORIGINAL` (each result's frozen category weights for Q; the group's frozen ranking weights) or `ALTERNATIVE(quality, ranking, label)` applied to every entry in the comparison. [R096, R124] |

**Ports** (`engine/scoring/ports.py`):

```python
class ResultPopulation(Protocol):
    async def load(self, template_sha: str, filters: ResultFilters) -> Population: ...
    # Population: profile_id, entries: tuple[ScoringEntry, ...], judge_groups: tuple[JudgeGroup, ...], notices

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
| `ComputeRankings` | `scoring.rank` | Load population, resolve profile, validate an alternative selection, `analyse`, attach capabilities. |
| `ExplainScore` | `scoring.breakdown` | As `ComputeRankings`, then project one entry's gates, quality rows and contribution rows, with previous/next ranked ids. |
| `PreviewWeights` | `scoring.preview_weights` | `normalize` both sets independently; return percentages or issues without raising. [R095] |
| `ValidateWeights` | `scoring.validate_weights` | `normalize` both sets; raise `InvalidWeights` on any issue. Also the in-engine `WeightValidation` Protocol used by M07 at launch. |
| `ListWeightChoices` | `scoring.weight_choices` | Original weights of the group, profile defaults with 1:1:1, and M07 presets for the template. |
| `ExportWeights` | `scoring.export_weights` | Validate, then write the alternative configuration through `WeightExportSink`. [R096] |

The engine exposes `ComputeRankings` and `ValidateWeights` to other modules as application Protocols (`RankingService`, `WeightValidation`), so [M07](07-run-configuration.md) launch validation and [M13](13-standalone-html-report.md) report generation run the same code as the API. It also offers `ScoringRules`, the pure rules other modules apply to retained data without restating them:

```python
class RankingService(Protocol):          # M13
    async def analyse(self, template_sha: str, filters: ResultFilters, group: JudgeGroupId, selection: WeightSelection) -> Analysis: ...
    def scoring_messages(self) -> Mapping[str, str]: ...      # reason code -> message template, for the report's in-page recomputation
class WeightValidation(Protocol):        # M07
    def validate(self, profile_id: str, quality: WeightSet, ranking: WeightSet) -> tuple[NormalizedWeights, NormalizedWeights]: ...  # raises InvalidWeights
class ScoringRules(Protocol):            # M02 (results order, Q, notes), M08 (not-passed effect text), M12 (Q on a review)
    def measured_order_key(self, r: ScoringEntry) -> SortKey: ...             # highest known cost first, unknown last
    def weighted_quality(self, grades: RawGrades, weights: WeightSet) -> QualityBreakdown: ...
    def eligibility_notes(self, r: ScoringEntry) -> tuple[EligibilityNote, ...]: ...
```

**Adapters** (`engine/scoring/adapters/`):

| Adapter | Implements |
|---|---|
| `results_population.py` | `ResultPopulation` over M02's `RetainedResultReader.for_template` (retained results, reviews, check outcomes, original weights, judge configuration) and M10's `MeasurementReader` (cost and time with basis and coverage). |
| `profiles.py` | `GradingProfiles` over M12's application interface. |
| `presets.py` | `WeightPresets` over M07's application interface. |
| `yaml_export.py` | `WeightExportSink`; writes the M07 preset YAML schema so an export can be reused as a preset. |
| `rpc.py` | DTO ↔ domain mapping. Weight maps are `dict[str, float \| str]` with `allow_inf_nan=True`: a number or the raw input text, so negative, nonfinite, unparsable and unknown inputs reach the domain and come back as `scoring.invalid_weights` rather than transport errors. Values convert with `Fraction(Decimal(str(v)))`; text that does not parse is `not_a_number`. Responses carry floats plus an exact rational string where ties matter. |

### 2. API surface (`scoring.*`)

Common request fragments: `template_sha: str`; `filters: ResultFilters` (M02's DTO: machine, configuration, environment policy, concurrency, judge); `judge_group: str | None` (first group when omitted); `weights: WeightSelectionDTO` = `{source: "original" | "alternative", quality: dict[str, float | str] | None, ranking: dict[str, float | str] | None, label: str | None}`.

Queries (safety `read`):

| Method | Request | Response | Errors |
|---|---|---|---|
| `scoring.rank` | `template_sha`, `filters`, `judge_group`, `weights` | `RankingView` | `scoring.unknown_template`, `scoring.unknown_judge_group`, `scoring.invalid_weights`, `scoring.original_weights_differ` |
| `scoring.breakdown` | as `scoring.rank` + `result_id` | `ScoreBreakdown` | as above + `scoring.unknown_result` |
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
| `RankingView` | `template_sha`, `profile_id`, `categories: list[CategoryDTO]`, `judge_groups: list[JudgeGroupDTO]` (id, label, judge harness/model/effort, entry count), `judge_group`, `weights: AppliedWeightsDTO`, `combined: RankingDTO`, `lowest_cost`, `shortest_time`, `highest_quality: ShortlistDTO`, `entries: list[EntryDTO]`, `notices: list[NoticeDTO]`, `capabilities: RankingCapabilities` |
| `AppliedWeightsDTO` | `source`, `label`, `quality: list[WeightDTO] \| None` (None when originals differ per result; each entry then reports its own), `ranking: list[WeightDTO]`; `WeightDTO = {key, label, raw, normalized}` |
| `RankingDTO` | `kind`, `rows: list[RankedRowDTO]`, `qualifying`, `population`, `minima: MinimaDTO`, `computable: bool`, `explanation: str \| None` |
| `RankedRowDTO` | `rank`, `result_id`, `harness`, `model`, `effort`, `score`, `score_exact`, `cost_points`, `time_points`, `quality_points`, `quality`, `cost`, `time: MeasurementDTO`, `tie_broken_by_id: bool` |
| `ShortlistDTO` | `rows` (≤ 5: rank, result_id, model, effort, value), `qualifying`, `explanation: str \| None` |
| `EntryDTO` | `result_id`, `harness`, `model`, `effort`, `machine`, `origin`, `status`, `checks {passed, failed, unverified, required}`, `business_grade`, `quality`, `cost`, `time`, `rankings: dict[RankingKind, InclusionDTO]` where `InclusionDTO = {included: bool, reasons: list[ReasonDTO {code, message}]}` |
| `MinimaDTO` | `cost: MeasurementDTO \| None`, `cost_result_id`, `cost_rule`, `time: MeasurementDTO \| None`, `time_result_id` |
| `MeasurementDTO` | `value: float \| None`, `basis`, `coverage` |
| `NoticeDTO` | `code`, `severity` (info, warning), `message`, e.g. `scoring.verified_zero_minimum`, `scoring.alternative_active`, `scoring.mixed_cost_bases`, `scoring.telemetry_limited`, `scoring.imported_entries` |
| `RankingCapabilities` | `can_reset`, `can_export_weights`, `can_save_preset` (true only for an alternative), `can_edit_weights`, `can_breakdown`, each with `reason: str \| None` |
| `ScoreBreakdown` | `result_id`, `harness`, `model`, `effort`, `judge_group`, `gates: list[GateDTO {name, passed, detail}]`, `quality_rows: list {key, label, raw_grade, weight_raw, normalized, contribution}`, `quality`, `combined_rows: list {component, measured, eligible_min, rule, weight_normalized, points}`, `score`, `score_exact`, `rank \| None`, `of`, `previous_result_id`, `next_result_id`, `exclusions: list[ReasonDTO]` |
| `WeightPreview` | `quality`, `ranking: SetPreviewDTO {rows: list {key, label, raw, normalized \| None, issue \| None}, total, valid, issues: list[WeightIssueDTO]}`, `capabilities {can_apply, can_save_preset}` |
| `ValidatedWeights` | `profile_id`, `quality`, `ranking: list[WeightDTO]` |
| `WeightChoices` | `original: ValidatedWeights \| None` with `original_differs: bool`, `defaults: ValidatedWeights`, `presets: list[{name, weights: ValidatedWeights}]` |

Error codes: `scoring.invalid_weights` carries one `field` path per issue (`quality.ux`, `ranking.time`, `quality`) and its reason, so the editor marks the exact input. [R095, R145]

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `RetainedResultReader.for_template` (the application interface behind `results.list`; scoring inputs: status, required-check counts, raw grades and validity, judge configuration, cost/time measurements with availability and basis, original weights, comparison dimensions, origin) | M02 | `ResultPopulation` adapter. |
| `ResultFilters` DTO | M02 | Shared filter model for `scoring.rank`. |
| `results.result.sealed`, `results.import.registered`, `results.review.added` events | M02 | Rankings tab refreshes after imports, new runs and rejudging. |
| `judging.get_profile` and `ProfileCatalog.get` | M12 | Category keys, labels, business category and default weights for a profile. |
| `configs.list_presets`, `configs.save_preset` | M07 | Preset choices in the editor; Save preset… issues `configs.save_preset`. |
| Required-check outcome states (passed, failed, unverified) | M08 | Verification gate, via M02 records. |
| `MeasurementReader` with cost basis and coverage | M10 | `Measurement.basis` and `.coverage`; verified-zero detection. |
| `reports.generate` accepting `weights: WeightSelectionDTO`, `filters`, `judge_group` | M13 | `h` from Rankings writes the report with the current weights. |
| `events.subscribe` | M11 | Subscriptions for the Rankings tab. |

M07 consumes `WeightValidation` / `scoring.validate_weights` and `scoring.weight_choices`; M13 consumes `RankingService` and the conformance vectors in section 6.

### 4. Screens

Owned artboards: Rankings, RankingsAlternative, ScoreBreakdown, WeightsEditor, WeightsInvalid ([navigation §11](../design/wireframe-tui/navigation.md)). Each screen is a view over `scoring.*` responses. No screen normalizes, gates, ranks, picks a minimum or decides whether an action is allowed; it renders rows, messages and capability flags from the engine and shows typed errors verbatim.

**Rankings tab** — `RankingsPane`, the content of `TabPane #tab-rankings` in `ResultsScreen` (`tui/screens/results.py`, screen owned with M02). View model `tui/viewmodels/rankings.py`:

```python
@dataclass(frozen=True)
class RankingsVM:
    group_options: list[tuple[str, str]]; group_id: str
    weights_label: str; is_alternative: bool          # "original · quality web v1 · ranking 1:1:1"
    combined_title: str; combined_subtitle: str       # "Combined · cost 33.3% …", "3 of 8 qualify"
    combined_rows: list[RowVM]                        # key = result_id; cells pre-formatted
    shortlists: dict[str, ShortlistVM]                # title, rows, subtitle "4 qualify" | "top 5", explanation
    entries: list[RowVM]                              # last cell "✓ ranked" | "✗ " + engine reason messages
    excluded_compact: list[tuple[str, str]]           # compact #excluded lines
    minimums_text: str; notices: list[NoticeVM]
    capabilities: RankingCapabilities
    selection: AnalysisSelection                      # template_sha, filters, judge_group, weights, as last sent

def build_rankings_vm(view: RankingView, selection: AnalysisSelection, compact: bool) -> RankingsVM
```

Formatting only: score and points to one decimal, Q to two, cost as `$x.xx` or `unknown` when `value is None`, durations. Order comes from the response; the view model never re-sorts. Column sorting chosen by the user sorts on the full-precision fields.

| Item | Behavior |
|---|---|
| Load | On first activation of the tab: `scoring.rank(template_sha, filters, judge_group=None, weights={source: "original"})` in a worker. |
| Subscriptions | On mount `events.subscribe(["results"])`, handling `results.result.sealed`, `results.import.registered` and `results.review.added` filtered to the template by `template_sha256`; each event re-issues `scoring.rank` with the current selection. Unsubscribe on unmount. |
| ContentSwitcher | `#combined` / `#combined-loading` / `#combined-empty` (shows `combined.explanation`) / `#combined-error` (error message + Retry). Each shortlist DataTable (`#lowest-cost`, `#shortest-time`, `#highest-quality`) shows its `explanation` when empty. `#all-entries` is empty only when the template has no results. |
| Widgets | `Select #judge-group` from `judge_groups`; `Static #weights-label` (class `-alternative` when `is_alternative`); `#minimums` from `minimums_text`; alternative notice from `scoring.alternative_active`; compact (`Screen.-compact`): `#shortlists` one line each and `#excluded`. |
| Filters | `#filters` changes (M02 widgets) re-issue `scoring.rank` while the tab is active. |

| Binding | Action | API call |
|---|---|---|
| `1 · 2` | `show_tab` | none (M02); first show triggers the load above |
| `g` / `Select #judge-group` changed | `judge_group` | `scoring.rank(judge_group=<next id in judge_groups>)` |
| `b` / `enter` / `Button #breakdown` | `breakdown` | push `ScoreBreakdownScreen(selection, result_id)`; enabled by `can_breakdown` |
| `w` / `Edit weights…` | `weights` | push `WeightsScreen(context="analysis", …)`; on dismiss with `ValidatedWeights`: `scoring.rank(weights={source: "alternative", …})` |
| `r` / `Button #reset` | `reset` | `scoring.rank(weights={source: "original"})`; `check_action` returns `capabilities.can_reset` |
| `Save preset…` (alternative) | `save_preset` | `configs.save_preset(name, weights)` (M07) after M15's `PromptScreen` returns a name; enabled by `can_save_preset` |
| `Export configuration` (alternative) | `export_weights` | `scoring.export_weights(…, path)` after M15's `PromptScreen` returns a path; enabled by `can_export_weights`; `scoring.export_target_exists` offers overwrite, which re-issues with `overwrite=True` |
| `h` / `HTML report` | `report` | push `ReportGenerateScreen` (M13) prefilled with `selection`; its generate issues `reports.generate` |

**ScoreBreakdownScreen** — `ModalScreen[None]` in `tui/screens/results.py`; view model `tui/viewmodels/score_breakdown.py` (`BreakdownVM`: header line, gate lines with ✓/✗ and engine detail, `#quality-breakdown` rows, `#combined-breakdown` rows with the engine's `rule` rendered as text, score line `rank n of m`, `prev_id`, `next_id`).

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
    preset_options: list[tuple[str, str]]            # original · defaults · saved, from WeightChoices
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
| `Select #preset` changed | `load_preset` | fills inputs from the chosen `WeightChoices` entry; the resulting change issues `scoring.preview_weights` |
| `ctrl+r` / `Restore defaults` | `restore_defaults` | fills inputs from `WeightChoices.defaults`, then `scoring.preview_weights`. Distinct from Reset to original on Rankings. [R096] |
| `ctrl+s` / `Button #apply` | `apply` | `scoring.validate_weights`; on success `dismiss(ValidatedWeights)`; `scoring.invalid_weights` marks fields and stays open. `check_action` returns `preview.capabilities.can_apply`. |
| `Save preset…` | `save_preset` | `configs.save_preset` (M07); enabled by `can_save_preset` |

States map to artboards: WeightsEditor is a valid preview; WeightsInvalid is a preview with issues (Apply and Save preset disabled, percentages `—`); RankingsAlternative is `RankingView` with `weights.source == "alternative"`.

### 5. CLI

The source names no ranking command. Under the architecture rule that every API method is reachable from the CLI, the registry-generated `scoring` group exposes them; these are implementation-level commands owned by [M14](14-command-line-interface.md), not new product requirements.

| Command | Method |
|---|---|
| `axbenchmark scoring rank --template SHA [--judge-group ID] [filters] [--weights FILE] [--json]` | `scoring.rank` (`--weights` reads a preset/export YAML as an alternative) |
| `axbenchmark scoring explain RESULT_ID --template SHA [--weights FILE] [--json]` | `scoring.breakdown` |
| `axbenchmark scoring check-weights FILE --profile ID [--json]` | `scoring.validate_weights` |
| `axbenchmark scoring choices --template SHA [--json]` | `scoring.weight_choices` |
| `axbenchmark scoring export-weights FILE --template SHA --output PATH [--overwrite]` | `scoring.export_weights` |

`scoring.invalid_weights` exits 1 and prints each field path with its reason. Unattended launch reaches `scoring.validate_weights` through M07's launch validation.

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain (`tests/engine/scoring/domain/`) | Every acceptance scenario with exact `Fraction` results: 2:1:1 → ½, ¼, ¼; web grades UX 4, others 5 → 19/4; UX weight 0 → 5 with raw UX 4 retained; A/B → 230/3 and 250/3; B alone → 100; ½:¼:¼ with verified $0 → 50 and 0 cost points; unknown cost excluded only while w꜀ > 0; business 3.5 fails; two qualify → two rows; none → explanation; zero time minimum → `zero_time_unresolved`. Rejection of negative, nonfinite, unknown and all-zero inputs with field paths. Property tests (hypothesis): scaling a weight set leaves normalized weights and order unchanged; input order never changes output order; displayed-equal scores that differ exactly keep their exact order; exact ties order by result id; groups never mix. |
| Use cases (`tests/engine/scoring/application/`) | Fake `ResultPopulation`, `GradingProfiles`, `WeightPresets`, `WeightExportSink`. Alternative analysis leaves the fake population's frozen records identical; filters change minima; `original_weights_differ` surfaces; export writes only through the sink. |
| API (`tests/api/scoring/`) | `InProcessClient` against the composed engine with fake adapters, no interface: request/response JSON round trips, typed error codes and field paths, `allow_inf_nan` inputs reach the domain, registry kinds and safety classes, JSON Schema snapshot. `import-linter` contracts for the four layers. |
| Conformance vectors | The domain tests export `tests/fixtures/scoring_vectors.json` (inputs, weights, expected exact results). M13's report JavaScript is tested against the same file so no report formula disagrees with M06. [R132] |
| Screens (`tests/tui/`) | View-model unit tests from canned `RankingView`, `ScoreBreakdown`, `WeightPreview` (formatting, `unknown` cost, labels). Textual `Pilot` against a fake client: each binding issues exactly the call in section 4; `r`, Apply and Save preset follow capability flags; engine errors render verbatim in `#…-error`; compact layout at 80×24; filter change re-requests; no screen imports `axbenchmark.engine`. |
