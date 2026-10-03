# M13 — Standalone interactive HTML report

Authority: [the product specification](../SPEC.md). This proposed module defines report generation, offline presentation, and interactive analysis; it does not claim an existing implementation. Use the repository [README](../../../../legacy/README.md) presentation as the starting point for measured comparisons, separate quality assessment, and priority rankings. Users review delivered artifacts and accumulated results for one template, including compatible imports, then generate and open a report. [R035, R131] The [Implementation](#implementation) section places generation in the headless engine fixed by [the architecture decision](../../../ARCHITECTURE.md); the TUI and CLI request a report and present its outcome, and the generated file is an artifact the engine writes, not an interface.

Binding extensions: [benchmark statistics](../../BENCHMARK-STATISTICS.md), [decision engines](../../DECISION-ENGINES.md) and [context monitoring](../../CONTEXT-MONITORING.md). M13 consumes their retained contracts through M02/M06/M10/M12; it introduces no scoring formula, grading backend or analysis service. [R166, R169–R176]

## Inputs and integration boundaries

[M02](02-retained-results-comparability.md) retains the approved template and full SHA-256, baseline identity, resolved configuration, originating machine and provenance, original weights, raw grades, normalized measurements, task evidence, logs, snapshots, and hardware samples. M13 consumes these saved records so report regeneration and alternative weighting require no model calls; the same retained material supports ZIP exchange through [M17](17-zip-exchange.md). Report generation must not overwrite original measurements, grades, or weights. Capture one M02 PublicationView and retain its run bindings, finalization receipts, original-review dispositions, review versions and invalidation versions through scoring, evidence reads and artifact publication. Only terminal-retention-ready, comparable scopes may publish; pending accounting, seals or original judging return `reports.retention_pending`. Recheck readiness and invalidation under the shared publication/lifecycle gate immediately before committing the artifact. [R134, R153; F02, F03, F09]

[M08](08-verification-evidence.md) supplies task outcomes and evidence; [M10](10-measurements-cost.md) supplies measurements and cost bases; [M18](18-hardware-monitoring.md) supplies optional telemetry; [M12](12-quality-judging.md) supplies raw reviews and judge metadata. [M06](06-scoring-rankings.md) owns normalization, eligibility, scoring, and deterministic rankings. The [TUI](15-terminal-interface.md) and [CLI](14-command-line-interface.md), as clients of the engine API, request generation from saved results and receive the report location. These boundaries preserve evidence and measurement meaning through presentation. [R126, R127, R133, R134]

Only results with matching template identities enter one comparison; any durable run invalidation excludes every associated trial, including already sealed/completed trials with retained reviews. Preserve original execution status, effective status, invalidation evidence and original review/fact bytes in M02; reporting must not rebind or repair them. Use RunUid and explicit TrialRef throughout, grouping by `(run_uid, configuration_id)`; human run/configuration labels may collide and remain distinguishable by origin and UID. Preserve imported machine, configuration, judge details, and evidence. Display local/imported provenance and measurement conditions, including environment policy, concurrency, cost basis, and telemetry limits. Keep quality and combined rankings separated by judge configuration; matching hashes do not establish equivalent judging or measurement conditions. [R143]

Preserve the full M12 judge fingerprint: backend, profile/version/digest, requested/resolved model, runtime identity, rubric/pack/mapping/evidence-policy and acceptance-policy identifiers. TypeSafe and local System One groups remain distinct even with equal model names. Show `code_composed_from_decisions` commentary with its question/answer/anchor/evidence provenance separately from `model_authored` commentary. Reports may display measurements beside saved reviews, but no measured statistics, weights or rankings enter judge evidence. Saved reviews, context history and deterministic ranking require no configured decision engine; opening, reweighting and exporting make zero grading/classification/model calls and no engine connection.

## Generation and output

Produce one standalone HTML5 file containing vanilla JavaScript, CSS, chart/data assets, and the screenshots needed to understand reviews. It must open by double-click and operate offline through direct-file loading, without a server, CDN, external fonts, framework, or runtime data fetch. Moving the HTML alone must preserve the report and its review evidence. Identify the benchmark template and full SHA-256 in every original or alternatively weighted report. [R014, R125, R131, R148]

The dependency restriction applies to the exported report. It does not prohibit Python application dependencies or technologies allowed by generated projects' task specifications. At benchmark completion, attempt to open the generated report and always display its location; inability to open a browser must not hide the saved file. Regeneration reads retained results without invoking a planner, competitor, or judge. [R016, R134]

## Required presentation and operations

Every report includes both tables and all three chart groups below. [R148]

| Element | Required contents |
|---|---|
| Measured comparison table | Configuration/artifact, full trial identity, model and effort, originating machine, local/imported provenance, execution environment, verified tasks, elapsed time, **Gen tok/s**, **In tok (cached)**, **Out tok (reasoning)**, **Files / LOC**, and cost with its basis. All statistics retain raw values, units, known/partial/unknown states, source/basis, coverage, metric policy/version/digest and evidence inspection; cached/reasoning detail has independent availability. Hardware details are available where collected. [R126, R173–R176] |
| Quality table | Raw grades in the frozen family/version/category order, profile business gate and comment labels, weighted overall grade, separate judge groups, bound domain evidence/coverage/modality limitations. No latest-profile lookup or file/LOC-derived quality. [R127] |
| Direct top-five chart group | Lowest cost, shortest elapsed time, and highest quality rankings. [R128] |
| Cost/time/quality scatterplot | Logarithmic cost axis, elapsed time, quality color, and an environment legend appropriate to the actual configurations. [R129] |
| Combined ranking chart | Dynamic stacked contributions for the enabled set of M06's eight components: cost, time, quality, generation rate, input tokens, output tokens, file count and LOC, with directions, selected policies, references and exclusion reasons. Defaults retain the existing three contributions. Direct top-five components and cost/time/quality scatter dimensions are unchanged; extra combined factors never impose their gates on those specialized rankings or scatter. [R130, R173–R176] |

Every trial of a configuration appears as its own row in both tables, followed by full-roster summaries: cost, time, quality, input/output tokens, files and LOC use means and min–max; generation rate is explicitly **pooled**, with M10's summed matched-output numerator / matched-generation-seconds denominator and per-trial min–max, never a mean of rates. M10 supplies measurement summaries unchanged; M06 supplies quality summaries and all-trial eligibility. Rankings use these means/pooled values. Missing/legacy statistics stay unknown, never zero; partial/subset ranges cannot masquerade as complete, and failed/excluded rows remain inspectable. A cost basis is always labelled: reported, verified $0, API-equivalent estimate with its price source and date, or energy estimate with its measurement scope and whether the tariff is the recorded one or an analysis tariff chosen in Results. A partial cost or time is shown with its coverage and the explanation of its exclusion from rankings where it carries positive weight (for example "cost covers 6 of 7 tasks"). [R077, R126, R132, R154, R173–R176]

Costs are shown in the display currency the scoped runs froze at launch, converted by [M10](10-measurements-cost.md) with each run's frozen rates; a missing rate shows the value as unknown (no rate conversion). When the scoped runs froze different display currencies, every cost is shown in USD and the header says so. Rankings and charts compute in USD. The report has no currency option; only the tariff is an analysis setting. [R081]

Default the measured table to highest known cost first, with unknowns last. Default the quality table to descending unrounded quality within judge groups. Support sorting, machine/configuration/judge filtering, and inspection of task details and evidence. Break exact ranking ties deterministically with stable result identifiers, keeping separate runs of the same configuration distinguishable; displayed rounding must not create artificial ties. [R131]

Show frozen original weights and independent controls for the six quality categories and complete `RankingWeightsV2` eight-key weights/directions plus M06's selected metric policies. Require explicit higher/lower direction before enabling a new factor; fixed cost/time/quality directions and validation remain M06-owned. Original-ranking agreement compares the whole effective normalized plan, enabled directions and policies after valid legacy migration; quality resolves independently. Differences use M06's labelled profile defaults/explanation, with the five new factors zero. Each result's originals, directions, policies and schema provenance remain visible/selectable. Normalize all eight ranking weights together, independently from quality; reject missing/unknown keys, invalid directions, nonfinite/negative values and all-zero sets with M06 field errors. Clearly label alternatives, reset and export complete plans without changing originals or calling models. Zero new weights preserve legacy three-component scores and eligibility exactly. [R132, R134, R173–R176; M06]

Use M06's weighted quality, exact contributions, enabled references and metric-policy-compatible cohort consistently. Skip zero-weight factors before lookup, compatibility, extrema or division; missing/partial/incompatible positive factors exclude the whole subject with full TrialRefs and no per-entry weight renormalization. Compute all enabled references from the same eligible cohort; absent a common selected policy, show M06's uncomputable reason. Native model/tokenizer identities remain provenance, not equality gates. Apply M06's complete-zero conventions for new factors, positive generation denominator, existing verified-zero-cost rule and guarded-zero-time behavior unchanged. Weights/directions/policies/filters update dependent tables, rankings, quality colors and dynamic stacks together; raw columns remain visible. [R130, R132, R143, R173–R176; M06]

## Exceptional data, safety, and invariants

Exclude zero costs, and partial or unknown costs and times, from the logarithmic plot and explain each omission. Retain verified zero-cost entries in applicable tables and rankings using M06's zero-cost rule. Retain an unverified numeric zero with its original basis but exclude it from lowest-cost and positive-cost-weight combined rankings with `cost_zero_unverified`; zero cost weight removes only that measurement requirement. Apply this gate to every expected trial even when a mean is positive, and retain M06's guarded zero-time behavior. Never interpret unavailable cost as zero. Missing data, no eligible entries, or fewer than five eligible entries must produce useful explanations and appropriately limited rankings, rather than broken charts or fabricated values. Failed and excluded results remain inspectable in full tables under the selected filters. [R132; M06]

Include optional hardware timelines, actual measurement scopes, coverage, and setup limitations when relevant. Missing or partial telemetry remains labeled accordingly. Scope labels preserve the distinction between client-machine measurements and cloud inference hardware, and between shared experiment energy and configuration-attributable observations, following M18. Essential measured and quality tables remain readable without JavaScript. [R133]

Place prepared context tables, scoped history/partition and timelines under existing `TASK_EVIDENCE`, with native/classified labels, independent count/membership provenance, gaps, threshold/model and selected analysis status; unavailable/native-only states are explicit. Pin each capture using M17's `results/<result_id>/evidence/context/analysis-selection.json` descriptor (`axbenchmark-context-analysis-selection/1`): source digest plus null analysis or analysis ID, ledger cutoff/digest, status and selected file closure. Preserve full TrialRefs and source cutoffs; later annotations never enter the artifact, and pending/partial classification does not delay report readiness. Offline context history is read-only: no new-analysis/reclassification action or engine connection exists.

Render all generated text and embedded data safely: prompts, logs, reviews, imported labels, and evidence must not become executable HTML. Displaying or inspecting competitor material must not execute its source or embedded instructions. Preserve sanitized reporting inputs and exclude credentials in accordance with M02. The export remains self-contained even when evidence contains hostile markup or strings resembling executable content. [R125, R133]

**Bounded child delivery.** M13.1 embeds exact retained statistics, policy/receipt/inventory closure and complete plans in static/no-JS tables and the saved engine analysis pin. M13.2 implements the production eight-factor BigInt scorer and complete direction/policy exports; M13.3 renders enabled-key stacks from the same analysis revision, keeping specialized ranks/scatter independent; M13.4 forwards the full plan and pins it in job/API metadata. Add shared vectors for paired subset 400/5 versus full output 600, pooled 200 versus 50–300 trial range, 7/2 count means and independent files/LOC states to existing suites. A source-machine/workspace deletion cannot change an offline artifact. **R173–R176**

Human report acceptance covers pending original queue → actual graded/ungraded/skip/cancel receipts → M02 retention → automatic report. M13.1 rejects incomplete originals and embeds committed raw grades/comments/limitations plus self-declared human/form-policy provenance offline, with no draft/credential/controller or fake machine identity. M13.2 runs unchanged exact score vectors across separate human groups. M13.4 distinguishes human waiting from persistence failure and extends only the existing typed SystemOpener seam. Additional pending human work cannot reopen original report readiness; viewing file:// never opens a form. **R189**

## Acceptance scenarios

- Generate from retained results with no model access, move only the HTML, disable networking, and open it directly. Verify both tables, all three chart groups, embedded review screenshots, full template identity, and alternative weighting. Disable JavaScript and confirm essential tables remain readable. [R014, R125, R133, R134, R148]
- Check every required table field and chart dimension, default cost/quality ordering, machine/configuration/judge filters, task evidence inspection, and deterministic exact ties between distinct result identifiers. [R126, R127, R128, R129, R130, R131]
- Change both sets, all eight ranking weights/directions and selected policies; verify M06 validation, synchronized stacks, reset/export, original-plan agreement and legacy three-factor equivalence with unknown zero-weight extras. Test compatible-cohort exclusions, no per-entry renormalization, new-factor zero extrema and unchanged specialized rankings, scatter and cost/time rules. [R132, R134, R173–R176]
- Show full trial rosters, M10-prepared count means/ranges and pooled generation N/D/ranges without browser measurement aggregation; label estimates, partial/unknown states, source/basis/policies and M06 original-plan fallback explanations. [R077, R126, R132, R154, R173–R176]
- With no decision engine configured and all network/model access disabled, inspect distinct same-name TypeSafe/local System One reviews and commentary provenance plus multiple captures with different analysis cutoffs/native-only selections. Opening, reweighting, reset/export and read-only context history preserve pinned bytes/status and make zero engine, classifier or grading calls.
- Combine same-template local/imported results while retaining evidence, provenance, measurement conditions, and separate judge groups; exclude mismatched templates and results halted by a template change. Inspect optional telemetry coverage and submit hostile generated text to confirm inert rendering. Verify the completion open attempt and visible report path even when browser opening fails. [R133, R134, R143]

The source does not prescribe chart layouts, colors, or a rendering algorithm. Those implementation choices must satisfy these contracts; unresolved calculation cases remain governed by M06 rather than invented in presentation.

## Child implementation specs

These proposed children are bounded implementation work, not evidence of an existing report runtime. All require Bootstrap; completed implementation prerequisites and allowed published-contract fakes are separated in each child. Parent acceptance requires all four children and their real integration gates. Findings refer to [recommendations](../recommendations.md).

| Child | Scope |
|---|---|
| [M13.1 — offline-report-artifact](../../M13/01-offline-report-artifact.md) | Pinned retained inputs and embedded M10 statistics/N/D/policies, complete decision/group/commentary provenance and per-capture context selections; safe file, no-JS tables and publication. |
| [M13.2 — browser-analysis](../../M13/02-browser-analysis.md) | Production exact BigInt/rational eight-factor scoring under M06, directions/policy alternatives/reset/export, full shared statistics vectors; no measurement reaggregation or engine/model access. |
| [M13.3 — report-charts](../../M13/03-report-charts.md) | Primary statistics columns, dynamic enabled-factor stacks within the existing three chart groups, unchanged specialized/scatter dimensions, read-only context panels, omissions, grouping and currency/provenance/timelines. |
| [M13.4 — report-jobs-screens](../../M13/04-report-jobs-screens.md) | Durable jobs/completion outcomes, plan/open/reveal, TUI dialogs and reconnect/cancel behavior. |

## Implementation

Implementation decisions under [the architecture decision](../../../ARCHITECTURE.md). They fix how the contract above is built; they add no product behavior. M13 reads retained results only through [M02](02-retained-results-comparability.md)'s application interfaces and computes every score, eligibility decision and ranking through [M06](06-scoring-rankings.md)'s `RankingService`. Its own rules are presentation rules: which parts a report contains, which points the logarithmic axis can show, how text is made inert, and where the file goes. The generated file is an artifact, not a client: it holds a copy of the analysis inputs and never contacts the engine.

### 1. Engine component

Package `axbenchmark.engine.reports`.

#### Domain (`engine/reports/domain/`)

Frozen slotted dataclasses and pure functions; no I/O, no pydantic.

| Type / function | Contents and rules |
|---|---|
| `ReportScope` | `template_sha256`, `origin_run_uid: RunUid \| None`, `filters: ResultFilter`, `focus_group: JudgeGroupId \| None`, `tariff: Tariff \| None` (None uses recorded tariffs). Resolve a UID/path/unambiguous label through M02; ambiguous labels return candidate UIDs/origins. A named run resolves its template; select all comparable retained results passing the filters, keeping complete frozen trial rosters and missing indices. An explicitly invalidated origin or selected run is rejected. [R035, R067, R143] `filters.variants` retains full VariantFilterV1 comparison selection/metadata view; no model-only filter adapter may discard it. **R190** |
| `ReportSnapshot` | One pinned `PublicationView`, selected RunUid bindings/retention receipts/original-review dispositions/review and invalidation versions, `EffectiveResult` records, `TrialGroup`s, M10-prepared exact measurement/display/statistics/context projections, original complete weight/direction/policy plans, full decision/profile/backend/pack/group and commentary provenance, explicit ResultId/TrialRef evidence references, and per-capture source digests/cutoffs plus optional analysis IDs/ledger cutoffs/digests/status/file closures matching M17. No measurement/judging working-store reads. Invalidation or retention-version change before publication rejects the job; new unrelated results do not enter an existing pin. Pin `VariantResultProjectionV1`, ordered descriptor/manifest/creator/date/source evidence, every trial control, comparison policy and annotation/exclusion revisions from M02 SQLite. Guard selected annotation/exclusion changes at publication. **R190** |
| `WeightPlan` | `original` (always present: M06's common original quality set and complete ranking plan, labelled "original" or its profile-default explanation for weight/direction/policy disagreement) and `alternative: ValidatedAlternative \| None` (quality and complete schema-2 ranking weights/directions/metric policies already validated by M06, plus label), `opens_with: ORIGINAL \| ALTERNATIVE`. `opens_with = ALTERNATIVE` without an alternative raises `NoAlternative`. Both analyses go into the file; `opens_with` only decides which one the page shows first. [R132] |
| `ReportPart` | Enum `MEASURED_TABLE`, `QUALITY_TABLE`, `TOP_FIVE`, `SCATTER`, `COMBINED`, `TASK_EVIDENCE`, `REVIEW_SCREENSHOTS`, `HARDWARE_TIMELINES`. |
| `plan_contents(inputs) -> tuple[PartPlan, ...]` | Every part is always included (`locked=True`); the function only adds counts and notes: screenshots to embed, zero-cost and unknown-cost results kept off the log axis, results with hardware samples. With no samples, `HARDWARE_TIMELINES` is still listed and its note says nothing was collected. [R125, R133, R148] |
| `scatter_partition(subjects) -> Scatter` | One point per `(RunUid, configuration_id, JudgeGroupId)`, at the M10 cost/time and M06 quality means, with existing every-trial check/cost/time/quality gates retained, independent of combined-only extra factors; distinct runs never collapse. `points`: configurations with a known, complete mean cost > 0, a known, complete mean elapsed time and a quality value; `omitted`: every other configuration with `ZERO_COST`, `COST_ZERO_UNVERIFIED`, `UNKNOWN_COST`, `PARTIAL_COST`, `UNKNOWN_TIME`, `PARTIAL_TIME`, `UNGRADED` or the M06 all-trial exclusion reason. A verified $0 entry is omitted from the axis only; it keeps its table rows and its M06 ranking contribution. Unknown cost is never treated as zero; a partial value is never plotted as if complete. [R077, R129, R132] |
| `environment_legend(entries)` | The distinct environment policies actually present in the scope, in first-appearance order; the legend never lists a policy no result used. [R129] |
| `ReportModel` | The complete document as data: `Header` (template name, revision, built-in flag, full SHA-256, generated-at, counts total/local/imported, judge groups, weights label, tariff label when an analysis tariff applies, currency label from M10's `display_currency_for` (the runs' shared frozen display currency, or USD with the `measurements.mixed_display_currency` note), "no model calls"), `measured_rows` (one per trial, then full-roster mean/min–max and explicitly pooled generation N/D/range summaries from M06/M10), `quality_groups` (one per judge group, never merged; trial rows and mean rows likewise), `analyses: Mapping[JudgeGroupId, GroupAnalyses]` (original and optional alternative M06 results), `snapshot` (pinned provenance/version descriptor), `scoring_inputs` (complete frozen TrialRef rosters and M10-prepared summaries; per trial, the weight-independent facts the page needs to recompute M06 rules: RunUid, RunLabel, origin, ResultId and TrialRef, original/effective status, exact grades, original Q, original schema/weights/directions/metric policies, full backend/profile/pack/group or human reviewer/form-policy fingerprints and commentary provenance, M10 statistics with generation N/D and independent cached/reasoning detail, cost and time with availability, basis, coverage with covered and total tasks, price source or energy scope, default-gate reasons), `scatter`, `legend`, `task_details` (including pinned per-capture context source/analysis descriptors and prepared read-only projections), `screenshots` with tagged web/native/declared-image context, `domain_evidence` with coverage/modes/source roles, `timelines`, `notices`. Numbers that order or tie are exact Python `Fraction`, serialized as reduced `n/d`, beside display values. Every statistical trial/summary keeps M10 `M10Statistic`/`GenerationAggregate`/`ArtifactStats`/`Policy` and `TrialSummaryDTO` projections, operators, complete rosters, exact N/D, source/evidence/policy/snapshot digests and independent native detail states. No browser measurement aggregation occurs. Every trial/mean/min/max and cost reference keeps full M10 `CostDTO`/`MeasuredDTO`/`RateUseDTO`/`BillingDTO`, contributor coefficients, price/energy evidence, basis/coverage/limitations, engine display strings and `DisplayCurrencyDTO`. For a mixed scope embed M10's mixed-USD projection plus each run's frozen-currency projection (requested with the normal None default); for a single-currency scope its frozen projection suffices. Browser filters select these prepared projections without exchange arithmetic or arbitrary currency overrides. No alternate currency/rate control exists. [R126–R133] Header/template facts additionally preserve format, benchmark/project/target mode, legacy marker, primary order/count and baseline provenance. Task details contain frozen commit-policy/check refs plus M02 scoped start/end trees/history/ancestry, setup origin, dirty-path/scope evidence and protocol verdict separately from process/behavioral checks. **R177–R180, R183** Include variant comparison/filter state, strict/exploratory/signature outcomes and all safe descriptor/evidence/annotation history needed for offline views, never model weight binaries. Static rows retain FINETUNE+QUANT and creator/date precision/proof labels. **R190** |
| `default_report_name(label, sha, date, completion_run_uid=None)` | `<template-slug>-r<revision>-<sha8>-<yyyy-mm-dd>.html` under the reports directory for user plans. Automatic completion appends `-<RunUid>` before `.html` so different runs never contend for the same default; an idempotent retry retains its recorded path. A user-supplied path replaces the default and never silently overwrites. |
| `GenerationStep` | `READ`, `SCORE`, `ESCAPE`, `EMBED`, `WRITE`, `OPEN`, each with a state and optional `done/total`. |
| `OpenAttempt` | `attempted: bool`, `opened: bool`, `command`, `message`. A failed attempt never removes or hides the path. [R016, R134] |

Domain errors: `NoResults`, `NoAlternative`, `TargetExists`, `InvalidTarget`, `UnknownReport`, `AmbiguousRun`, `RetentionPending`, `IdentityInvalidated`, `SnapshotChanged`. Failures preserve typed reasons and pinned identity; never silently drop a newly invalidated selected run.

Domain/application objects use the corresponding domain money/provenance types; DTO names above describe their serialized adapter shape, never imports from `axbenchmark.api`. M13's domain imports M02's `ComparisonScope` and `ResultFilter` and M06's result types (it consumes them, as the Ownership table allows). It defines no weighting, eligibility, minimum, contribution or ordering rule; table default orders and every ranking come from M06's `Analysis`.

#### Ports (`engine/reports/ports.py`)

M06 owns `Population` in `engine/scoring/domain/models.py`: `view: PublicationView`, `profile_id`, resolved `profile: ProfileSpec`, `entries: Mapping[TrialRef, EffectiveResult]`, `groups: tuple[TrialGroup, ...]` with complete frozen counts/expected refs and missing indices, `measured: Mapping[tuple[RunUid, ConfigurationId], TrialSummary]`, available metric-policy/basis choices, prepared currency and applied tariff context, full judge-group fingerprints and notices. Entries retain every selected-judge review possibility; missing trials/reviews remain explicit data. During snapshot preparation M13 resolves the frozen rubric's ProfileSpec through the published M06 GradingProfiles port, verifies profile ID, exact rubric version/digest and ordered category signature against the pinned review/template, and completes all M10 tariff validation/cost/time/statistics/context/display projections from the same captured records. `RankingService.analyse_population(population, group, selection) -> Analysis` then uses M06's existing pure rules with no fresh result/profile query, aggregation, conversion or tariff application. In-memory members are domain values; serialization/DTO mapping belongs to adapters.

```python
class ResultSource(Protocol):            # M02 reader + shared publication boundary
    async def resolve_run(self, reference: str, view: PublicationView) -> RunUid: ...
    async def capture(self, scope: ReportScope) -> ReportSnapshot: ...
    async def evidence(self, snapshot: ReportSnapshot, rid: ResultId, task: TaskId | None) -> Sequence[EvidenceItem]: ...
    async def read_evidence(self, snapshot: ReportSnapshot, rid: ResultId, evidence_id: str) -> bytes: ...
class ReportPublication(Protocol):
    async def publish(self, snapshot: ReportSnapshot, pending: PendingFile,
                      intent: PublicationIntent, overwrite: bool) -> WrittenFile: ...
    # Atomically serialize readiness/version/invalidation recheck, cancellation admission,
    # target collision check and commit under shared publication/lifecycle gate.
class TemplateFacts(Protocol):           # bound to M01 RevisionReader + M08 CheckIndex
    async def label(self, sha: Sha256) -> TemplateLabel: ...                # name, revision, built-in
    async def check_titles(self, sha: Sha256) -> Mapping[TaskId, Sequence[CheckTitle]]: ...
class ReportAnalysis(Protocol):          # bound to M06 RankingService / WeightValidation
    async def analyse_population(self, population: Population, group: JudgeGroupId,
                                 selection: WeightSelection) -> Analysis: ...  # M06 domain Analysis, existing pure rules
    # Authoritative M06 entry; Population includes resolved ProfileSpec and prepared M10 values.
    # No fresh result/profile query or accounting occurs in analyse_population.
    async def validate(self, profile_id: str, quality: WeightSet, ranking: RankingWeightsV2, metric_policies: MetricPolicySelection) -> ValidatedAlternative: ...
    def scoring_messages(self) -> ScoringMessages: ...                      # reason code -> message template
class TimelineFacts(Protocol):           # bound to M18's application interface
    def describe(self, samples: HardwareSamples) -> TimelineDescription: ...  # scope, source, coverage, limitations
class ReportRenderer(Protocol):
    def render(self, model: ReportModel, initial: WeightChoice) -> Iterator[bytes]: ...
class ReportSink(Protocol):
    async def check_target(self, path: Path, overwrite: bool) -> Path: ...   # resolved absolute path or InvalidTarget/TargetExists
    async def begin(self, path: Path) -> PendingFile: ...                     # temp file in the target directory
    async def commit(self, pending: PendingFile, overwrite: bool) -> WrittenFile: ...   # only ReportPublication calls under guard; fsync + rename
    async def discard(self, pending: PendingFile) -> None: ...
class SystemOpener(Protocol):
    async def open(self, path: Path) -> OpenAttempt: ...
    async def reveal(self, path: Path) -> OpenAttempt: ...
    async def open_review_url(self, url: LocalReviewUrl) -> OpenAttempt: ...  # M12.5 exact loopback scope; private/redacted credential handoff
class ReportLedger(Protocol):
    async def begin(self, intent: PublicationIntent) -> None: ...
    async def settle(self, report_id: ReportId, disposition: ReportDisposition) -> None: ...
    async def status(self, report_id: ReportId) -> ReportStatus: ...
    async def find(self, path: Path) -> LedgerEntry | None: ...
```

Add `CompletionReports.ensure(run_uid) -> ReportStatus` (idempotent original completion key), `.get(run_uid) -> ReportStatus` and `.wait(run_uid) -> ReportDisposition`; these are awaited M11 ports, backed by durable records, not UI events. `ReportDisposition` is `succeeded(ReportOutcome) | failed(ReportError) | cancelled(reason) | skipped(reason)` (ReportError is a domain value mapped to ErrorDTO). Pending retention/persistence returns a typed pending error, never an endless wait. M11 maps succeeded to `completion_report.state=written` and preserves the other states in RunStatus before notification.

Plus `Clock`, `EventPublisher` and `JobProgress` from `engine/shared` and the daemon. There is no harness, judge, planner or result-writing port: report generation cannot call a model or change a retained record because the module has no way to. [R016, R134]

M13.1 acquires all context per-capture selections and decision review/group evidence through pinned M02/M10 ports, M13.2 preserves those group/snapshot identities through offline alternatives, and M13.3 renders context inside TASK_EVIDENCE without a new ReportPart. Native-only/pending/partial/unknown membership and count-basis states remain visible, with used-percent only for compatible native used/limit readings. All observer/grader costs remain separate and no classifier completion barrier is added. Offline fixtures freeze a report before late analysis, compare byte identity afterward and reject any model/network call. **R164, R166, R171**

#### Application (`engine/reports/application/`)

| Use case | Reached through | Behavior |
|---|---|---|
| `PlanReport` | `reports.plan` | Resolves the scope (run → template) through one pinned view, maps resolvable pending/invalidated scope to a disabled capability with its reason (fatal unreadable/unknown scope is a typed error), loads the template label and scoped results, validates an alternative through `ReportAnalysis.validate` and an analysis tariff through M10's tariff validation, runs `plan_contents`, proposes the default path, and returns counts, judge groups, weight options, parts and capabilities. Reads only. |
| `GenerateReport` | `reports.generate` (job) | Persist report intent/id first; `READ` captures the eligible snapshot (revalidate any earlier plan); `SCORE` calls M06 `analyse_population` for each original/alternative judge group using the same pin and M10 projections; `ESCAPE`/`EMBED` render inert text and explicit-trial evidence; `WRITE` streams a temp file then calls guarded `ReportPublication.publish`; `OPEN` records its bounded attempt. Persist outcome before notifications. A precommit failure/cancel discards only this temp file and settles failed/cancelled. A committed artifact wins a late cancel, remains addressable by path/digest, and recovers to succeeded without rebuilding from new data. [R014, R016, R125, R134] |
| `RevealReport` | `reports.reveal` | Accepts only a path in the durable ledger, then calls `SystemOpener.reveal`; failure keeps the known artifact path. |
| `GenerateOnCompletion` | M11 awaited `CompletionReports.ensure` after M02 terminal retention | Persist a unique completion key by RunUid; start/return its report with original weights, no filters and its UID-suffixed default target. Stopped/interrupted/invalidated runs settle skipped with their reason. Pending retention returns the typed error. Reconcile intents on restart; never depend on receiving `run.state.changed`, regenerate a committed artifact, or invoke a model. [R134] |


`ScoringMessages` and the exact scoring inputs let the page recompute M06's weight-dependent steps when a reader enters alternative weights in the browser (section 6, conformance). The engine-side analyses embedded in the file are M06's own output; the page uses them unchanged for the original weights and for the alternative chosen at generation.

#### Adapters (`engine/reports/adapters/`)

| Adapter | Implements |
|---|---|
| `results_source.py` | `ResultSource` over M02's reader/evidence APIs with one captured PublicationView and exact per-run readiness/version descriptor; admission uses ComparisonScope. |
| `template_facts.py` | `TemplateFacts` over M01's `RevisionReader` and M08's `CheckIndex.titles`. |
| `scoring_analysis.py` | `ReportAnalysis` over the authoritative M06 `RankingService.analyse_population` and existing `WeightValidation`; prepare Population from pinned M02 records, resolved ProfileSpec and complete M10 projections. The prepared-input call never re-queries results or profiles. |
| `timeline_facts.py` | `TimelineFacts` over M18's application interface. |
| `html/renderer.py` | `ReportRenderer` with Jinja2 (`autoescape=True`, `StrictUndefined`) and the files in `html/assets/`: `report.html.j2`, `report.css`, `report.js` (filters, sorting, weight controls, export), `charts.js` (inline SVG via `createElementNS`), `scoring.js` (M06's complete eight-factor weight/direction/policy-dependent steps in exact BigInt rational arithmetic, without M10 measurement reaggregation). Assets are inlined; the output has no external resource/navigation target, font or framework. Price/rate provenance URLs remain inert escaped text; banning literal URL text would erase required evidence. |
| `fs_sink.py`, `publication.py` | `ReportSink` temp/fsync/rename and `ReportPublication` shared guarded version/readiness/cancellation commit; recheck target existence at commit, require overwrite consent, refuse protected retained-result destinations including resolved aliases. Journal intended final path/digest before rename. |
| `system_opener.py` | `SystemOpener`: macOS `open` / `open -R`, Linux `xdg-open` (reveal opens the parent directory); `asyncio.create_subprocess_exec` without a shell, 10 s timeout; exit status and stderr become `OpenAttempt.message`. |
| `yaml_ledger.py` | Durable report intents/dispositions plus ledger (temp/fsync/replace); restart resolves precommit intents as cancelled/failed and committed files by stored path/digest as succeeded. A ledger write failure surfaces typed pending persistence with the artifact path and retries settlement, not rendering. |
| `rpc.py` | Maps `reports.*` DTOs to use-case inputs and domain results and errors to DTOs and error codes. The only module file that imports `axbenchmark.api`. |

How the file is built (renderer decisions that carry the safety and offline contracts):

| Concern | Decision |
|---|---|
| Inert text [R125, R133] | Static HTML (header, both tables in default order, task details, screenshot captions, notes) is rendered with autoescaping. All data for interactive parts sits in one `<script type="application/json" id="report-data">` island, serialized with `json.dumps(ensure_ascii=True)` and `<`, `>`, `&` written as literal JSON escapes `\u003c`, `\u003e`, `\u0026`, so no string can close the element. `report.js` reads it with `JSON.parse(textContent)` and builds the DOM only with `createElement` and `textContent`. |
| Content Security Policy | A `<meta http-equiv="Content-Security-Policy">` with `default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'sha256-<inline script digest>'; base-uri 'none'; form-action 'none'`. Injected script cannot run and the page cannot fetch anything, which also enforces "no runtime data fetch". [R125] |
| Screenshots [R125] | Embedded in full as `data:` URIs on `<img>` elements in the static task-detail markup, so they show without JavaScript. Only PNG, JPEG and WebP verified by magic bytes are embedded as images; any other evidence is embedded as escaped text. An unreadable screenshot becomes a labeled placeholder and an outcome warning, never a silent gap. |
| No-JavaScript reading [R133] | Measured and quality tables, task outcomes and screenshots are static markup under the original weights and labeled as such. Charts, filters and weight controls are built by script; a `<noscript>` note says so. |
| Alternative weights in the page [R132] | Inputs for the six quality weights and complete eight-factor ranking weights/directions/selected metric policies, with a choice that fills them from each distinct original plan (the results that froze it are identified by RunUid/TrialRef and origin), from the profile defaults or from the original analysis; Apply runs `scoring.js` validation (same reason codes and messages as M06's `scoring.invalid_weights`) and, if valid, recomputes Q and quality summaries, consumes M10-prepared measurement summaries unchanged, then applies M06 measurement/policy gates, every-trial eligibility, one coherent eligible cohort, enabled references/contributions, specialized shortlists and exact order (zero-weight skip before lookup, new-metric zero extrema and unchanged verified-zero-cost/guarded-zero-time rules) for the visible judge group and filters, then relabels the page "Alternative weights". Reset restores the embedded original analysis. Filter changes recompute with the active weights, because enabled references depend on the filtered eligible population (M06); selection never shrinks a subject's frozen roster. |
| Export from the page [R132] | "Export alternative configuration" downloads a YAML file in M07's preset schema (the format `scoring.export_weights` writes); "Export alternative report" downloads a copy of the file whose separate `<script type="application/json" id="report-initial">` names the alternative to open with. Both use a `Blob` and an `a[download]` element, verified in direct-file acceptance. Rebuild from immutable trusted document segments and escaped JSON islands, never `innerHTML`/`outerHTML` serialization or untrusted template evaluation; recompute any affected script CSP digest. The exported file preserves static original tables and embedded evidence. Original records are untouched. |
| Determinism | With a fixed `Clock`, identical inputs produce byte-identical files, which the tests rely on. |

**R191 saved analysis boundary.** `scoring_analysis.py` calls pure M06 on one pinned population; the report application then awaits M02 AnalysisSnapshotSink.retain with that exact input digest before guarded output publication. Embed AnalysisSnapshotRef plus exact ranks/components. Report YAML ledgers own output lifecycle only, never score authority. Failed/stale persistence cannot publish saved-score success; downloaded offline alternatives remain unsaved derivations tied to the original ref. Tests compare initial tables/charts to normalized rows and changed offline state to the same BigInt vectors.

#### Persisted state

```
~/.axbenchmark/reports/
  <template-slug>-r<rev>-<sha8>-<date>[-<run_uid>].html   user/completion defaults
  jobs/<report_id>.yaml                        durable intent, commit checkpoint, disposition/error, completion RunUid key
  ledger.yaml                                 one row per written report: path, file sha256, size, template SHA-256,
                                              RunUid/TrialRefs, pinned versions, scope, weights label, trigger, generated at, open attempt
```

A report written to a user-chosen path is recorded in the ledger but lives where the user put it. M13 writes nothing under `~/.axbenchmark/results/`; analysis and alternative weighting never change original measurements, grades or weights. [R134]

#### Owned processes

Only the short-lived opener subprocess of `SystemOpener` (one per open or reveal, 10 s timeout, never a shell). No long-running process.

#### Integrated route/profile contracts (R192–R194)

Extend ReportSnapshot and existing reports.plan/generate/status DTOs with full frozen comparison matrix, selected harness-comparison policy, HarnessComparisonV1 classification/coverage, exact model/native-effort/route/profile/treatment refs and source/annotation cutoffs under the same PublicationView/analysis pin. Snapshot-change publication guards include late contradictory evidence; no current catalog lookup reinterprets retained facts. Default static no-JS table shows all six cells/reasons, including absent/blocked rows without zero scores.

Browser AnalysisState and CSV/JSON exports carry independent harness and variant axes, exact selected controls and N/6 coverage. Local what-if mirrors M06 whole-subject eligibility and unchanged exact arithmetic, remains unsaved, and never promotes declarations to proof. Charts use one row per declared subject/analysis grain; hops/assets/reasons appear only as detail, never fan-out. ReportGenerate/Progress/Ready preserve saved analysis ID/freshness, selected policy and inert profile provenance. Test confirmed subsets, exploratory/unknown helpers, mismatch with retained cost, same-harness treatments, factorial selections, late-stale pins and offline/no-network rendering.

### 2. API surface (`reports.*`)

Common request fragments: `scope: {template_sha256: str} | {run_uid: RunUid}`; CLI UID/path/label resolution uses M02 before this call; `filters: ResultFilters` (M02's DTO); `judge_group: str | None`; `weights: WeightSelectionDTO` (M06's DTO); `tariff: TariffDTO | None` (M10's DTO; the analysis tariff set in Results, omitted for each run's recorded tariff); `opens_with: "original" | "alternative"`.

#### Queries (safety `read`)

| Method | Request | Response | Errors |
|---|---|---|---|
| `reports.plan` | `scope`, `filters?`, `judge_group?`, `weights?`, `tariff?` | `ReportPlan` | `reports.unknown_template`, `reports.unknown_run`, `reports.invalid_weights` (M06's issues with `field` paths), `reports.invalid_tariff` (M10's issues with `field` paths), `reports.store_unreadable` |
| `reports.status` | exactly one `report_id` or `completion_run_uid` | `ReportStatus` (durable pending/running/disposition, job_id, outcome/path when committed, error, revision) | `reports.unknown_report` |

`ReportPlan`: `template: TemplateScopeDTO` (name, revision, built-in, full SHA-256), `counts` (total, local, imported, excluded_other_sha), `filters_summary`, `variant_selection: VariantFilterV1`, `variant_comparisons: [VariantComparisonV1]`, metadata/annotation/publication pin, `judge_groups: list[JudgeGroupDTO]` (label, judge description, entry count), `weight_options: list[{key: "original" | "alternative", label, available, reason}]` (the original option's label is M06's, e.g. "Profile defaults: original weights differ across results"), `tariff_label: str | None` (set for an analysis tariff, labelled alternative), `parts: list[PartPlanDTO {part, label, locked, note}]`, `screenshot_count`, `zero_cost_count`, `unknown_cost_count`, `default_path`, selected RunUid/TrialRefs and pin descriptor, `retention_state`, `wait_reason?`, `human_pending_count?` (owner projections, never drafts/credentials), `capabilities: ReportCapabilities`. A plan is advisory; generate recaptures/revalidates and cannot trust stale capabilities.

#### Jobs and commands

| Method | Kind | Request | Response | Errors | Safety |
|---|---|---|---|---|---|
| `reports.generate` | job | `scope`, `filters?`, `judge_group?`, `weights?`, `tariff?`, `opens_with = "original"`, `path?` (default from plan), `overwrite = false` | `JobRef` at once (report_id = job_id); successful `job.finished` carries `ReportOutcome`, every terminal state also persists in reports.status | Synchronous, before the job starts: `reports.unknown_template`, `reports.unknown_run`, `reports.no_results`, `reports.invalid_weights`, `reports.invalid_tariff`, `reports.no_alternative`, `reports.invalid_path` (`field: "path"`), `reports.target_exists` (`field: "path"`). Readiness/admission or in-job errors: `reports.retention_pending`, `reports.identity_invalidated`, `reports.snapshot_changed`, `reports.write_failed`, `reports.store_unreadable`, `reports.persistence_pending`; cancellation is terminal only if it wins before guarded publication | `write` |
| `reports.reveal` | command | `path` | `RevealOutcome {path, opened, message}` | `reports.unknown_report` | `write` |

`ReportOutcome`: `report_id`, `origin_run_uid?`, selected `run_uids`/TrialRefs, pinned descriptor, `path` (absolute), `size_bytes`, `file_sha256`, `template_sha256`, `result_count`, `local_count`, `imported_count`, `judge_groups: list[str]`, `weights_label` ("original weights", "Profile defaults: original weights differ across results", or the alternative's label), `tariff_label: str | None`, `screenshots_embedded`, `warnings: list[NoticeDTO]`, `trigger: "user" | "completion"`, `open_attempt: OpenAttemptDTO {attempted, opened, command, message}`. A failed open is data in the outcome, not an error. [R016, R134]

Progress payload (`job.progress` for this job): `ReportProgressDTO {steps: list[{key, label, state: "done" | "now" | "todo", done?, total?}], percent}`. Labels are composed by the engine ("Read 12 retained results · 0 excluded for another SHA-256", "Embedding review screenshots · 104 of 168").

#### Capability flags

| Flag | On | Reasons when false |
|---|---|---|
| `can_generate` | plan | `reports.no_results`, `reports.store_unreadable`, `reports.retention_pending`, `reports.identity_invalidated` |
| `can_use_alternative` | plan | `reports.no_alternative` (no alternative was passed), `reports.invalid_weights` |
| `locked` | each part | always true under the current contract; parts are listed, not chosen [R148] |

#### Events (topic `reports`)

| Event | Payload | Emitted when |
|---|---|---|
| `reports.report.written` | `job_id`, `report_id`, `path`, `template_sha256`, `origin_run_uid?`, selected RunUids, `trigger`, `open_attempt`, `revision` | Artifact and successful disposition are durable, by user request or at completion. |

Job progress and completion use M11's `job.progress` / `job.finished` on `job:<job_id>`/`jobs`. Register reports as an event-only topic; query `reports.status` on resync. Forward completion disposition into revisioned RunStatus before events, including failed/cancelled/skipped; consumers use full EventCursor and replacement snapshots. Expiring the generic job cache cannot erase report status.

#### Error codes

`reports.unknown_template`, `reports.unknown_run`, `reports.no_results`, `reports.invalid_weights`, `reports.invalid_tariff`, `reports.no_alternative`, `reports.invalid_path`, `reports.target_exists`, `reports.write_failed`, `reports.store_unreadable`, `reports.unknown_report`, `reports.retention_pending`, `reports.identity_invalidated`, `reports.snapshot_changed`, `reports.persistence_pending`. CLI ambiguity uses M02's typed resolver error. Numeric JSON-RPC `error.code=-32000` carries the namespaced application code in `error.data.code`, with field/remedy/data; both clients decode the same envelope (F18). `reports.target_exists` carries a `remedy` offering overwrite; the client re-issues with `overwrite=true`.

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `RetainedResultReader.for_template`, `.resolve_run`, `.run`, `.get` (all with one PublicationView and explicit UID/trial bindings); `ComparisonScope` (refusing other hashes and results halted by a template change), `ResultFilter` (domain); `ResultFilters` DTO | M02 | Scoped retained results, run resolution, template admission, shared filter model. |
| `RetainedResultReader.evidence(rid, task_id, view)` and `.read_evidence(rid, evidence_id, view) -> bytes` (application interface) | M02 | Screenshots, review/commentary provenance and log excerpts; pinned context source/analysis descriptor and selected sidecar bytes through M02 openers for offline embedding. |
| `RankingService.analyse_population(population, group, selection) -> Analysis` over M06's domain Population with resolved ProfileSpec and complete pinned M10 projections; `GradingProfiles.for_profile(profile_id, rubric_ref=frozen_rubric_ref) -> ProfileSpec` during preparation only; `WeightValidation`; `RankingWeightsV2`/`RankingPlan`, `WeightSelectionDTO`, `ReferenceValuesDTO`/`ContributionDTO`; extended `scoring_vectors.json` fixture | M06 | Every score/gate, quality summary, M10 cost/time/statistics passthrough, enabled reference/contribution/ranking and table default order; whole original-plan agreement and labels; validation of the alternative; conformance of `scoring.js`. |
| `RankingService.scoring_messages()` (reason code → message template for gates, empty-ranking explanations and weight issues) | M06 | The page shows M06's own wording when it recomputes alternative weights. |
| `RevisionReader.open` (template name, revision, built-in flag) | M01 | Header identity. |
| `CheckIndex.titles` | M08 | Check titles from the frozen suite in task details. |
| `TelemetryDescriber.describe(samples)` (scope client machine vs cloud inference, shared experiment energy vs configuration-attributable, source, coverage, limitations) | M18 | Timeline labels without restating M18's attribution rules. [R133] |
| Full `M10Statistic`, `GenerationAggregate`, `ArtifactStats`, `Policy`, `TrialSummaryDTO`, prepared context projections, `CostDTO`, `MeasuredDTO`, `RateUseDTO`, `BillingDTO`, `CostContributorDTO`, `DisplayCurrencyDTO`; exact USD rational values, frozen-currency/USD projections, coverage/source/price/energy/rate/declaration provenance; `TariffDTO` validation, `display_currency_for(pinned_runs)`, `ranking_cost`, `trial_summary` on pinned records | M10 | Exact full-roster statistics/N/D, independent native token detail, coverage/policy/source evidence and basis labels; a new enum value fails a renderer test until labeled. |
| M11 awaited `CompletionReports.ensure/get/wait` after M02 terminal retention and M12 original-review settlement; durable RunStatus completion_report projection | M11/M02/M12 | Completion scheduling/settlement, unique RunUid key, no event dependency. Shared lifecycle/publication gate rechecks the snapshot before artifact publication. |
| `jobs.get`, `jobs.cancel`, `job.progress`, `job.finished`, `events.subscribe(cursor=EventCursor)` and durable owner-status recovery | M11 | Progress screen, cancellation, CLI streaming. |
| ReportScreen (artboard ReportReady) consuming `ReportOutcome`; `h` on ResultsScreen enabled by `can_report` | M02 | Shows the path and the open attempt after generation. |
| `h` on RankingsPane passing `AnalysisSelection` (template, filters, judge group, weights, tariff); `h` on ResultsScreen passing its analysis tariff | M06, M02 | Prefills ReportGenerateScreen with the current alternative and tariff. |
| Forwarding `reports.report.written` (and the completion report job's `job.finished`) on topic `run:<run_uid>`; run overview showing it | M11 / M15 | Path at benchmark completion in the TUI. |
| `axbenchmark report` command module and `run --no-tui` completion output | M14 | CLI access. |

M13.2 `AnalysisState` and the existing production offline scorer consume the same versioned variant policy/evidence/controls as M06 before unchanged score normalization. Preserve full subjects, explicit control-signature selection, strict definite date matches, separate judge groups and mandatory exclusions in both metadata views. No filtered subset can invent missing trials or confirmed identity. M13.3 ChartProjection uses that one analysis revision for tables, legends, omissions and exact subject details. M13.4 ReportGenerate/Defaults forwards the complete selection and exposes mode/scope/signature/confounds at both sizes; report intent and outcome pin it. No runtime metadata/network/model lookup occurs. **R190**

### 4. Screens

Owned artboards: ReportGenerate, ReportGenerateDefaults and ReportProgress ([navigation §18](../design/wireframe-tui/navigation.md)). ReportReady is M02's `ReportScreen`; ReportPage is a wireframe of the generated file, not a Textual screen. Both screens live in `tui/screens/results.py` (as the legends state) with view models in `tui/viewmodels/report.py`. Neither evaluates a module rule: counts, part notes, weight options, the default path and every enabled state come from `reports.plan`; step labels come from `job.progress`; errors are shown verbatim with their `remedy`.

#### ReportGenerateScreen — artboard ReportGenerate

`ModalScreen[ReportRequest | None]`, constructor `ReportGenerateScreen(scope: ScopeDTO, filters: ResultFilters | None = None, judge_group: str | None = None, weights: WeightSelectionDTO | None = None, tariff: TariffDTO | None = None)`. Pushed by `h` on ResultsScreen (M02, scope and current filters) and on RankingsPane (M06, its `AnalysisSelection`). Tree as in the legend: `Vertical #report-generate .dialog` with `Static #report-scope .kv`, `RadioSet #report-weights`, `SelectionList #report-contents` (`height: 7; border: none;`), `Input #report-path`, `Horizontal .dialog-actions` (Cancel, `Button #generate`), `Footer`. The dialog body is a `ContentSwitcher` with `#report-form`, `#report-form-loading`, `#report-form-empty` (shows the `can_generate` reason) and `#report-form-error` (engine message, remedy, Retry).

```python
@dataclass(frozen=True, slots=True)
class ReportGenerateVM:
    title_line: str                    # "★ Inventory web app r1 · built-in · printed in full in the report"
    sha256: str                        # full, never shortened
    scope_rows: tuple[tuple[str, str], ...]   # Results, Filters, Judges, Tariff (only for an analysis tariff)
    weight_options: tuple[RadioVM, ...]       # label, enabled, reason; from plan.weight_options
    parts: tuple[PartVM, ...]                 # label with engine note, selected=True, disabled=locked
    path: str                                 # plan.default_path until the user edits it
    body_state: Literal["form", "loading", "empty", "error"]
    can_generate: ActionState
def build_report_generate_vm(plan: ReportPlan, path_input: str | None) -> ReportGenerateVM: ...

@dataclass(frozen=True, slots=True)
class ReportRequest:                   # dismiss value
    job: JobRef; path: str; opens_with: str
```

| Event or binding | API call | Result |
|---|---|---|
| mount | `reports.plan(scope, filters, judge_group, weights, tariff)` | Fills `#report-scope`, `#report-weights` (alternative radio disabled with its reason when `available` is false), `#report-contents` (all selected, locked items not toggleable), `#report-path`. |
| `esc`, Cancel | none | `dismiss(None)`; nothing is written. |
| `tab / shift+tab` | none | `focus_next / previous`. |
| `ctrl+s`, `Button #generate` | `reports.generate(scope, filters, judge_group, weights, tariff, opens_with, path)` | On `JobRef`: `dismiss(ReportRequest(...))`; the opener's callback pushes `ReportProgressScreen(job)` with no further call. `reports.invalid_path` / `reports.target_exists` mark `#report-path` (`-invalid`) and keep the dialog open; for `target_exists` the remedy offers overwrite, which re-issues `reports.generate(..., overwrite=True)`. `check_action` returns `plan.capabilities.can_generate`. |

`#report-weights` and `#report-path` changes issue no call; their values are sent with `reports.generate`.

#### ReportProgressScreen — artboard ReportProgress

`ModalScreen[ReportOutcome | None]`, constructor `ReportProgressScreen(job: JobRef)`. Tree as in the legend: `Vertical #report-progress .dialog` with `Vertical #report-steps` (step lines and `ProgressBar`), `Horizontal .dialog-actions`, `Footer`. `#report-steps` sits in a `ContentSwitcher` with `#report-steps-loading` (before the first snapshot) and `#report-steps-error`.

```python
@dataclass(frozen=True, slots=True)
class ReportProgressVM:
    steps: tuple[StepVM, ...]          # glyph from state (done ✓, now ●, todo ○), engine label
    percent: int | None
    note: str                          # fixed text: originals only read, competitor text inert
    state: Literal["loading", "running", "succeeded", "error", "cancelled", "skipped", "pending"]
    error: ErrorVM | None
    artifact_path: str | None             # retained even for pending postcommit persistence
def build_report_progress_vm(status: ReportStatus, progress: ReportProgressDTO | None) -> ReportProgressVM: ...
```

| Event or binding | API call | Result |
|---|---|---|
| mount | `events.subscribe(["job:<job.id>"], cursor=cursor)` via M15's manager for the job snapshot/replay; use `reports.status(report_id=job.id)` on expired job, owner resync or reconnect; unsubscribe on unmount | Renders steps/bar or durable terminal/pending outcome. Apply object revisions and replacement generations; never let an older event overwrite a newer snapshot. Leaving/unmounting does not cancel the job. |
| `job.progress` | none | Rebuilds the view model. |
| `job.finished` with `ReportOutcome` | none | `dismiss(outcome)`; the callback pushes M02's `ReportScreen(outcome)`, which always shows the path and the open warning when `open_attempt.opened` is false. |
| durable status or `job.finished` with failure/cancel/skip/pending error | `reports.status(report_id=job.id)` only when owner state must be recovered | Render the engine disposition/reason/path; success-only waits end, Close dismisses. A recovered succeeded outcome navigates once just like the live event. |
| `esc`, Cancel | `jobs.cancel(job.id)` | Request cancellation; on durable cancelled status dismiss with None. A commit that already won finishes succeeded with its path; pending persistence shows its typed reason/path and cannot falsely claim cancellation. |

#### Screens owned elsewhere that consume M13

ResultsScreen and ReportScreen (M02), RankingsPane (M06), the run overview (M11/M15, path/disposition from durable RunStatus/reports.status and notifications). The generated file's page (artboard ReportPage) is specified by the renderer decisions in section 1 and verified in section 6.

### 5. CLI

| Command | API methods |
|---|---|
| `axbenchmark report RUN_DIR [--tariff AMOUNT_PER_KWH --tariff-currency CODE]` | `results.resolve_run(RUN_DIR)` then `reports.generate(scope={run_uid}, tariff?)` and the typed job stream plus durable reports.status; ambiguity returns UIDs/origins. Prints each step, then the path and the open attempt from `ReportOutcome`. A failed open prints a warning and exits 0; a typed error exits 1. [R055, R134] |
| `axbenchmark run … --no-tui` | Waits on durable RunStatus retention/completion_report and reports.status, not only report-written; succeeded prints path/open attempt, failed/cancelled/skipped or typed retention-pending terminates with its reason. Reconnect/cache expiry preserves outcomes (M14 owns exit mapping). |

Implementation-level options owned by [M14](14-command-line-interface.md), which map to request fields and add no product behavior: `--output PATH` (`path`), `--overwrite`, `--weights FILE` (an alternative from a preset or exported YAML, sent as `weights` with `opens_with="alternative"`), `--tariff AMOUNT_PER_KWH --tariff-currency CODE` (paired flags passed unchanged as `TariffDTO {per_kwh, currency}`), `--json` (prints `ReportOutcome` or the job events as JSON lines). Both tariff flags absent means recorded tariff; either alone is an actionable parser error (exit 2, zero requests) naming the missing partner. Tariff currency denominates the per-kWh amount and does not change the frozen display currency; do not infer currency or fetch rates. `reports.plan` and `reports.reveal` are reachable through M14's generic registry access.

M13.1 no-JS/offline fixtures include one-shot/multi-step, seven domains, deleted source/workspace, missing/dirty/unreadable task-commit proof and historical `not_recorded` fields. The report uses M02 retained proofs and exact task cutoffs, never rescans a source or creates live Git state; later commits do not repair prior verdicts. Preserve existing scoring, complete-trial grouping and all arithmetic. **R177–R180, R183**

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain unit | `plan_contents` always lists both tables and the three chart groups, locked, with or without telemetry. `scatter_partition` over the 12-result fixture of `implementation/reference/design/wireframe-tui/src/results-data.mjs`: verified $0, unknown and partial cost omitted from points with their reasons, still present in measured rows; a three-trial configuration is one point at its means. `environment_legend` lists only present policies. `default_report_name` matches the artboard. `WeightPlan` refuses `opens_with=ALTERNATIVE` without an alternative. The header always carries the full SHA-256. |
| Use case (fake ports) | `GenerateReport` with fake `ResultSource`, `TemplateFacts`, `ReportAnalysis`, `ReportSink`, `SystemOpener`, `ReportLedger`: steps are reported in order with embed counts; the fake source is unchanged afterwards and exposes no write method; a result with another hash is counted as excluded and an identity-invalidated result never reaches the model; an analysis tariff reaches M10 preparation and its prepared values reach the fake `ReportAnalysis` and the header carries its alternative label; differing originals give the "Profile defaults: original weights differ across results" weights label; judge groups stay separate; precommit cancellation and renderer failure call `discard`, create no artifact and retain cancelled/failed dispositions; a failing opener still yields an outcome with the path; `GenerateOnCompletion` creates one durable completion key per RunUid and settles every outcome after restart. `RevealReport` refuses a path missing from the ledger. |
| Renderer and safety | A hostile fixture (`</script><script>…`, `<img src=x onerror=…>`, `javascript:` links, U+2028, template braces, a competitor SVG with script) in prompts, logs, reviews, labels and machine names: parse the output with html5lib and assert no element or attribute comes from data; the CSP hash matches the inline script; no external resource/navigation URL exists; required provenance URLs remain escaped text. A static scan of `html/assets/*.js` forbids `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `Function(`, `fetch`, `XMLHttpRequest`, `import(` and `WebSocket`. Byte-identical output for identical inputs. Every M10 cost-basis value has a label; estimates show price source and date, energy estimates their scope. Each trial has its own row; configuration summaries distinguish count means/ranges from pooled generation N/D/ranges, using M10-prepared projections only; partial/unknown values and native detail retain independent coverage/policy/source text. [R077, R125, R133] |
| Conformance with M06 | `scoring.js` runs under QuickJS (the `quickjs` Python package, a test-only dependency) against M06's `tests/fixtures/scoring_vectors.json`: identical eight-factor normalized plans/directions/policies, Q/quality summaries, unchanged M10 means/pooled N/D/ranges, every-trial eligibility, compatible-cohort exclusions/references, enabled contributions, order and tie-breaks as exact rationals. Include higher/lower zero extrema, missing denominator, policy incompatibility, cross-model tokenizer provenance without equality gates, legacy equivalence with unknown disabled factors, whole original-plan disagreement and unchanged specialized rankings. Schema/direction/weight validation returns M06's codes and field paths; execute production `scoring.js`, not a test substitute. [R132; M06] |
| API (`InProcessClient`, no interface) | `reports.plan`, `reports.generate`, `reports.status`, `reports.reveal` against the composed engine with fake producers and a fake opener: response models validate against the exported JSON Schema; synchronous typed errors carry stable codes and `field`; job progress and `reports.report.written` arrive in order and replay with the typed `(epoch, seq)` cursor; `jobs.cancel` before commit leaves no final file; after commit it retains the successful path. With model access disabled and no harness installed, generation succeeds and no harness or judge port is called. [R016, R029, R134] |
| Browser (Playwright, as already used by M08) | Copy only the generated HTML to an empty directory; open it via `file://` in a context with `offline=True` and external-network requests routed to abort; allow the local document/data resources and assert zero external requests. Check the full SHA-256, both tables with every required column, the three chart groups, the log-cost scatter with omitted entries explained, embedded screenshots loaded (`naturalWidth > 0`), default orders, filters, task evidence, ties broken by exact M06 stable result keys with RunUid/origin labels. Enter invalid weights (rejected with M06's messages), valid alternatives for both sets (tables, rankings, colors and stacks change together, label switches), reset, and both exports (download events; the exported report opens with the alternative). With `java_script_enabled=False`, both tables are readable. Inspect all eight enabled contributions and direction/policy edits against shared M06 vectors, distinct same-name backend/profile groups and commentary provenance, and pinned read-only multi-capture context history with native-only/pending/partial states. No configured decision engine is required; assert zero grading/classification calls or engine connections, no new-analysis action, and unchanged source/analysis cutoff digests after reset/export. No `dialog` event fires for the hostile fixture. [R014, R125–R133, R148] |
| Screen (fake client, `App.run_test()` / `Pilot`) | View models built from canned `ReportPlan` and `ReportProgressDTO` without Textual. ReportGenerateScreen renders loading, empty, error and form states; the alternative radio is disabled from `weight_options` only; `ctrl+s` issues exactly `reports.generate` with the edited path and dismisses on `JobRef`; `reports.target_exists` marks `#report-path` and the overwrite re-issue sets `overwrite=True`. ReportProgressScreen follows job events, `esc` issues exactly `jobs.cancel`, and completion pushes ReportScreen with the outcome. No screen imports `axbenchmark.engine`. |

### 7. Required integration and wireframe follow-up

Pin real M02/M06/M10 inputs and M12 original settlement through M11 completion; delay accounting/evidence/review writes, stop during judging, and invalidate after seal/during render/immediately before guarded rename. Assert no early or invalidated report, no post-seal measurement append and no hanging waiter. Recover before/after artifact rename and ledger settlement; generic job expiry must preserve terminal/pending owner status and any committed path. Compare immediate report with M17 imported retained facts, including duplicate human labels and distinct trial evidence.

Python and production browser conformance must consume every current M06 vector, including the [statistics vectors](../../BENCHMARK-STATISTICS.md#concrete-acceptance-and-integration-gate) for all eight components/directions/policies and unverified-zero/all-trial gates, invalidated sealed trials, cross-UID labels, COP/EUR/missing/mixed display cases, per-run rates, billing provenance and exact display-only ties. Add M10 final-accounting projections: costs 1,2,2 mean `5/3`; energy `0.5 kWh × 800 COP/kWh ÷ 4000 COP/USD = 1/10 USD`, alternative 1000 tariff gives `1/8`; ranges/contributor metadata remain complete. No float-tolerance comparison or JS exchange-rate calculation. Prepared-population fixtures include resolved ProfileSpec; disable result/profile/accounting ports before scoring and compare exact output with M06. CLI fixtures exercise both tariff flags forwarding `{per_kwh, currency}`, both absent using recorded tariff, and either alone exiting 2 with zero requests; display-currency switching remains forbidden.

Wireframes are unchanged here. ReportGenerate/ReportGenerateDefaults need UID/origin scopes, retention-pending/invalidated reasons and frozen/mixed currency notices; ReportProgress needs pending persistence, skipped/cancelled/failed and commit-won-cancel states; ReportReady (M02) must retain path/open warning; ReportPage needs primary statistics columns, pooled/mean labels, eight-factor direction/policy controls and dynamic stacks, read-only context history/selection states, full backend/profile/pack/group/commentary provenance, zero-unverified omissions, complete currency/billing/rate provenance and distinct same-label subjects. These new controls/panels remain planned design follow-up; M13.4 job lifecycle and existing ReportPart enum stay unchanged. Real M14 CLI/M15 navigation, M18 telemetry and M17 portability gates remain pending parent obligations. Updating these specs does not claim runtime, browser or screen tests exist or pass.

## Human reviews and offline reporting

[M12.5](../../M12/05-human-review-web.md) owns the active engine-backed local form. This module keeps its standalone, portable, offline report: no writable review API, local credentials, draft controller or live engine dependency is embedded. The existing SystemOpener seam gains a narrowly validated `open_review_url` operation for M12.5's exact engine-owned loopback origin; it does not become an arbitrary URL opener or a prerequisite cycle.

While original human cases remain pending, suppress automatic opening of the statistics report alongside the form. Normal automatic completion reporting follows all durable submitted/ungraded/skipped/cancelled dispositions and M02 retention. Render committed `human_authored` commentary, self-declared reviewer/form-policy provenance and their own JudgeGroups without fake model/effort/confidence/cost data. Human wait/entry duration is separate from competitor elapsed and is not a labor-cost estimate. Drafts never appear as valid reviews; imports or offline report opening never create a human session, submit grades or reopen a browser form.

## Variant comparison and provenance

[Model variants](../../MODEL-VARIANTS.md) extends retained ReportModel/scoring inputs with pinned descriptor/manifests, creator-role/date-kind claims, requested/effective evidence, annotation view, comparison mode/control policy, stable facets and whole-subject cohort signatures. Offline rendering may show quant-only, fine-tune/package, joint and exploratory views without fetching metadata or model files. M06 owns eligibility and comparison-control rules; the production offline implementation and parity vectors must apply those same rules before existing score normalization, never a second scoring formula. Keep complete expected trial rosters and judge groups; metadata filters cannot turn partial exports into complete subjects or pool different runs.

Show creators and dates by role/kind, Unknown/declared/conflicting states, date precision, actual evidence and confounds. Pin as-recorded versus explicit annotation selection with the report; do not silently refresh it from a live Hub. Model weights, source-machine absolute paths, credentials and private endpoint locations are not report assets. Explanations describe configurations, not a certified causal effect of quantization or fine-tuning.

## Persisted analysis and offline derivations — R191

[RESULTS-DATABASE.md](../../RESULTS-DATABASE.md) requires engine-generated score results to be retained as immutable normalized analysis snapshots. After pure M06 prepared-population calculation, the report wrapper calls the M02-owned sink and embeds the returned analysis ID/input digest with exact values and comparison metadata. Guard the same input versions at final report publication. Storage failure cannot yield a report claiming saved scores. Offline browser what-if computations remain available without the engine and are labelled unsaved local previews; downloading an alternative HTML/weight file preserves that provenance and does not write the database. Existing canonical package formats, score vectors and immutable facts remain unchanged.
