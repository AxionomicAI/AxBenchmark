# M13 — Standalone interactive HTML report

Authority: [the product specification](../SPEC.md). This proposed module defines report generation, offline presentation, and interactive analysis; it does not claim an existing implementation. Use the repository [README](../../README.md) presentation as the starting point for measured comparisons, separate quality assessment, and priority rankings. Users review delivered artifacts and accumulated results for one template, including compatible imports, then generate and open a report. [R035, R131] The [Implementation](#implementation) section places generation in the headless engine fixed by [the architecture decision](ARCHITECTURE.md); the TUI and CLI request a report and present its outcome, and the generated file is an artifact the engine writes, not an interface.

## Inputs and integration boundaries

[M02](02-retained-results-comparability.md) retains the approved template and full SHA-256, baseline identity, resolved configuration, originating machine and provenance, original weights, raw grades, normalized measurements, task evidence, logs, snapshots, and hardware samples. M13 consumes these saved records so report regeneration and alternative weighting require no model calls; the same retained material supports ZIP exchange through [M17](17-zip-exchange.md). Report generation must not overwrite original measurements, grades, or weights. [R134]

[M08](08-verification-evidence.md) supplies task outcomes and evidence; [M10](10-measurements-cost.md) supplies measurements and cost bases; [M18](18-hardware-monitoring.md) supplies optional telemetry; [M12](12-quality-judging.md) supplies raw reviews and judge metadata. [M06](06-scoring-rankings.md) owns normalization, eligibility, scoring, and deterministic rankings. The [TUI](15-terminal-interface.md) and [CLI](14-command-line-interface.md), as clients of the engine API, request generation from saved results and receive the report location. These boundaries preserve evidence and measurement meaning through presentation. [R126, R127, R133, R134]

Only results with matching template identities enter one comparison; a result halted because its template identity was invalidated during the run never enters a report. Preserve imported machine, configuration, judge details, and evidence. Display local/imported provenance and measurement conditions, including environment policy, concurrency, cost basis, and telemetry limits. Keep quality and combined rankings separated by judge configuration; matching hashes do not establish equivalent judging or measurement conditions. [R143]

## Generation and output

Produce one standalone HTML5 file containing vanilla JavaScript, CSS, chart/data assets, and the screenshots needed to understand reviews. It must open by double-click and operate offline through direct-file loading, without a server, CDN, external fonts, framework, or runtime data fetch. Moving the HTML alone must preserve the report and its review evidence. Identify the benchmark template and full SHA-256 in every original or alternatively weighted report. [R014, R125, R131, R148]

The dependency restriction applies to the exported report. It does not prohibit Python application dependencies or technologies allowed by generated projects' task specifications. At benchmark completion, attempt to open the generated report and always display its location; inability to open a browser must not hide the saved file. Regeneration reads retained results without invoking a planner, competitor, or judge. [R016, R134]

## Required presentation and operations

Every report includes both tables and all three chart groups below. [R148]

| Element | Required contents |
|---|---|
| Measured comparison table | Configuration/artifact, trial, model and effort, originating machine, local/imported provenance, execution environment, verified tasks, elapsed time, output tokens, and cost with its basis. Hardware details are available where collected. [R126] |
| Quality table | Raw rubric-category grades, weighted overall grade, judge identity, review evidence, and limitations. [R127] |
| Direct top-five chart group | Lowest cost, shortest elapsed time, and highest quality rankings. [R128] |
| Cost/time/quality scatterplot | Logarithmic cost axis, elapsed time, quality color, and an environment legend appropriate to the actual configurations. [R129] |
| Combined ranking chart | Stacked cost, time, and quality contributions using the selected ranking weights. [R130] |

Every trial of a configuration appears as its own row in both tables, followed by the configuration's mean of cost, time and quality with the min–max range; rankings, charts and minima use the means, and a configuration ranks only when every trial is eligible, as M06 decides. A cost basis is always labelled: reported, verified $0, API-equivalent estimate with its price source and date, or energy estimate with its measurement scope and whether the tariff is the recorded one or an analysis tariff chosen in Results. A partial cost or time is shown with its coverage and the explanation of its exclusion from rankings where it carries positive weight (for example "cost covers 6 of 7 tasks"). [R077, R126, R132, R154]

Costs are shown in the display currency the scoped runs froze at launch, converted by [M10](10-measurements-cost.md) with each run's frozen rates; a missing rate shows the value as unknown (no rate conversion). When the scoped runs froze different display currencies, every cost is shown in USD and the header says so. Rankings and charts compute in USD. The report has no currency option; only the tariff is an analysis setting. [R081]

Default the measured table to highest known cost first, with unknowns last. Default the quality table to descending unrounded quality within judge groups. Support sorting, machine/configuration/judge filtering, and inspection of task details and evidence. Break exact ranking ties deterministically with stable result identifiers, keeping separate runs of the same configuration distinguishable; displayed rounding must not create artificial ties. [R131]

Show frozen original weights and independent controls for alternative quality-category and cost/time/quality weights. The original analysis uses M06's common weights: the shared originals labelled "original" when every result froze the same weights, otherwise the profile defaults labelled "Profile defaults: original weights differ across results". Each result's own original weights stay visible and can be chosen through the alternative controls. Apply M06 validation: finite nonnegative values, a positive total per set, independent normalization, and rejection of unknown categories. Clearly label alternatives, provide reset to the original analysis, and allow export of the alternative configuration/report. Recalculate from retained raw grades and measurements without new model calls or original-record changes. [R132, R134; M06]

Use M06's weighted quality, normalized ranking contributions, eligible reference minima, missing-measurement rules, and judge grouping consistently. Changes to weights or applicable filters update dependent tables, rankings, quality colors, and stacked contributions together. No report-specific scoring formula may disagree with M06. Preserve original weights for imported results while applying common selected analysis weights within each comparison group. [R130, R132, R143; M06]

## Exceptional data, safety, and invariants

Exclude zero costs, and partial or unknown costs and times, from the logarithmic plot and explain each omission. Retain verified zero-cost entries in applicable tables and rankings using M06's zero-cost rule. Never interpret unavailable cost as zero. Missing data, no eligible entries, or fewer than five eligible entries must produce useful explanations and appropriately limited rankings, rather than broken charts or fabricated values. Failed and excluded results remain inspectable in full tables under the selected filters. [R132; M06]

Include optional hardware timelines, actual measurement scopes, coverage, and setup limitations when relevant. Missing or partial telemetry remains labeled accordingly. Scope labels preserve the distinction between client-machine measurements and cloud inference hardware, and between shared experiment energy and configuration-attributable observations, following M18. Essential measured and quality tables remain readable without JavaScript. [R133]

Render all generated text and embedded data safely: prompts, logs, reviews, imported labels, and evidence must not become executable HTML. Displaying or inspecting competitor material must not execute its source or embedded instructions. Preserve sanitized reporting inputs and exclude credentials in accordance with M02. The export remains self-contained even when evidence contains hostile markup or strings resembling executable content. [R125, R133]

## Acceptance scenarios

- Generate from retained results with no model access, move only the HTML, disable networking, and open it directly. Verify both tables, all three chart groups, embedded review screenshots, full template identity, and alternative weighting. Disable JavaScript and confirm essential tables remain readable. [R014, R125, R133, R134, R148]
- Check every required table field and chart dimension, default cost/quality ordering, machine/configuration/judge filters, task evidence inspection, and deterministic exact ties between distinct result identifiers. [R126, R127, R128, R129, R130, R131]
- Change both weight sets, reject invalid inputs through M06, verify synchronized recalculation, reset, and export. Confirm original records remain unchanged; exercise zero cost, unknown measurements, empty rankings, and fewer than five eligible entries with explanations. [R132, R134]
- Show every trial with the configuration's mean and min–max and rank on means; label API-equivalent and energy estimates with their source or scope and an analysis tariff as alternative; show partial measurements with coverage and their exclusion explanation; label the original analysis "Profile defaults: original weights differ across results" when frozen weights differ. [R077, R126, R132, R154]
- Combine same-template local/imported results while retaining evidence, provenance, measurement conditions, and separate judge groups; exclude mismatched templates and results halted by a template change. Inspect optional telemetry coverage and submit hostile generated text to confirm inert rendering. Verify the completion open attempt and visible report path even when browser opening fails. [R133, R134, R143]

The source does not prescribe chart layouts, colors, or a rendering algorithm. Those implementation choices must satisfy these contracts; unresolved calculation cases remain governed by M06 rather than invented in presentation.

## Implementation

Implementation decisions under [the architecture decision](ARCHITECTURE.md). They fix how the contract above is built; they add no product behavior. M13 reads retained results only through [M02](02-retained-results-comparability.md)'s application interfaces and computes every score, eligibility decision and ranking through [M06](06-scoring-rankings.md)'s `RankingService`. Its own rules are presentation rules: which parts a report contains, which points the logarithmic axis can show, how text is made inert, and where the file goes. The generated file is an artifact, not a client: it holds a copy of the analysis inputs and never contacts the engine.

### 1. Engine component

Package `axbenchmark.engine.reports`.

#### Domain (`engine/reports/domain/`)

Frozen slotted dataclasses and pure functions; no I/O, no pydantic.

| Type / function | Contents and rules |
|---|---|
| `ReportScope` | `template_sha256` (full SHA-256), `origin_run: RunId \| None` (set when the request named a run), `filters: ResultFilter` (M02's domain type), `focus_group: JudgeGroupId \| None`, `tariff: Tariff \| None` (an analysis tariff from Results; `None` uses each run's recorded tariff). A run resolves to its template; the scope is every comparable retained result of that template that passes the filters, local and imported. Admission goes through M02's `ComparisonScope`, so a result with another hash or one halted by a template change cannot enter. [R035, R067, R143] |
| `WeightPlan` | `original` (always present: M06's common original weights, labelled "original" or "Profile defaults: original weights differ across results") and `alternative: ValidatedAlternative \| None` (quality and ranking sets already validated by M06, plus label), `opens_with: ORIGINAL \| ALTERNATIVE`. `opens_with = ALTERNATIVE` without an alternative raises `NoAlternative`. Both analyses go into the file; `opens_with` only decides which one the page shows first. [R132] |
| `ReportPart` | Enum `MEASURED_TABLE`, `QUALITY_TABLE`, `TOP_FIVE`, `SCATTER`, `COMBINED`, `TASK_EVIDENCE`, `REVIEW_SCREENSHOTS`, `HARDWARE_TIMELINES`. |
| `plan_contents(inputs) -> tuple[PartPlan, ...]` | Every part is always included (`locked=True`); the function only adds counts and notes: screenshots to embed, zero-cost and unknown-cost results kept off the log axis, results with hardware samples. With no samples, `HARDWARE_TIMELINES` is still listed and its note says nothing was collected. [R125, R133, R148] |
| `scatter_partition(subjects) -> Scatter` | One point per configuration, at M06's trial means. `points`: configurations with a known, complete mean cost > 0, a known, complete mean elapsed time and a quality value; `omitted`: every other configuration with `ZERO_COST`, `UNKNOWN_COST`, `PARTIAL_COST`, `UNKNOWN_TIME`, `PARTIAL_TIME` or `UNGRADED`. A verified $0 entry is omitted from the axis only; it keeps its table rows and its M06 ranking contribution. Unknown cost is never treated as zero; a partial value is never plotted as if complete. [R077, R129, R132] |
| `environment_legend(entries)` | The distinct environment policies actually present in the scope, in first-appearance order; the legend never lists a policy no result used. [R129] |
| `ReportModel` | The complete document as data: `Header` (template name, revision, built-in flag, full SHA-256, generated-at, counts total/local/imported, judge groups, weights label, tariff label when an analysis tariff applies, currency label from M10's `display_currency_for` (the runs' shared frozen display currency, or USD with the `measurements.mixed_display_currency` note), "no model calls"), `measured_rows` (one per trial, each followed by its configuration's mean and min–max row from M06), `quality_groups` (one per judge group, never merged; trial rows and mean rows likewise), `analyses: Mapping[JudgeGroupId, GroupAnalyses]` (original and optional alternative M06 results), `scoring_inputs` (per trial, the weight-independent facts the page needs to recompute M06 rules: run and configuration id, trial index, exact grades, original Q and original weights, cost and time with availability, basis, coverage with covered and total tasks, price source or energy scope, default-gate reasons), `scatter`, `legend`, `task_details`, `screenshots`, `timelines`, `notices`. Numbers that order or tie are carried as exact rationals (`Fraction`) beside their display values. [R126–R133] |
| `default_report_name(label, sha, date)` | `<template-slug>-r<revision>-<sha8>-<yyyy-mm-dd>.html` under the reports directory, as on the ReportGenerate artboard. A user-supplied path replaces it. |
| `GenerationStep` | `READ`, `SCORE`, `ESCAPE`, `EMBED`, `WRITE`, `OPEN`, each with a state and optional `done/total`. |
| `OpenAttempt` | `attempted: bool`, `opened: bool`, `command`, `message`. A failed attempt never removes or hides the path. [R016, R134] |

Domain errors: `NoResults`, `NoAlternative`, `TargetExists`, `InvalidTarget`, `UnknownReport`.

M13's domain imports M02's `ComparisonScope` and `ResultFilter` and M06's result types (it consumes them, as the Ownership table allows). It defines no weighting, eligibility, minimum, contribution or ordering rule; table default orders and every ranking come from M06's `Analysis`.

#### Ports (`engine/reports/ports.py`)

```python
class ResultSource(Protocol):            # bound to M02 RetainedResultReader
    async def resolve_run(self, run: RunId | Path) -> RetainedRun: ...
    async def for_scope(self, sha: Sha256, f: ResultFilter | None) -> ScopedResults: ...   # results + excluded-other-hash count
    async def evidence(self, rid: ResultId, task: TaskId | None) -> Sequence[EvidenceItem]: ...
    async def read_evidence(self, rid: ResultId, evidence_id: str) -> bytes: ...
class TemplateFacts(Protocol):           # bound to M01 RevisionReader + M08 CheckIndex
    async def label(self, sha: Sha256) -> TemplateLabel: ...                # name, revision, built-in
    async def check_titles(self, sha: Sha256) -> Mapping[TaskId, Sequence[CheckTitle]]: ...
class Analysis(Protocol):                # bound to M06 RankingService / WeightValidation
    async def analyse(self, sha: Sha256, f: ResultFilter | None, group: JudgeGroupId,
                      selection: WeightSelection, tariff: Tariff | None) -> GroupAnalysis: ...
    async def validate(self, profile_id: str, quality: WeightSet, ranking: WeightSet) -> ValidatedAlternative: ...
    def scoring_messages(self) -> ScoringMessages: ...                      # reason code -> message template
class TimelineFacts(Protocol):           # bound to M18's application interface
    def describe(self, samples: HardwareSamples) -> TimelineDescription: ...  # scope, source, coverage, limitations
class ReportRenderer(Protocol):
    def render(self, model: ReportModel, initial: WeightChoice) -> Iterator[bytes]: ...
class ReportSink(Protocol):
    async def check_target(self, path: Path, overwrite: bool) -> Path: ...   # resolved absolute path or InvalidTarget/TargetExists
    async def begin(self, path: Path) -> PendingFile: ...                     # temp file in the target directory
    async def commit(self, pending: PendingFile, overwrite: bool) -> WrittenFile: ...   # fsync + rename; size, sha256
    async def discard(self, pending: PendingFile) -> None: ...
class SystemOpener(Protocol):
    async def open(self, path: Path) -> OpenAttempt: ...
    async def reveal(self, path: Path) -> OpenAttempt: ...
class ReportLedger(Protocol):
    async def record(self, entry: LedgerEntry) -> None: ...
    async def find(self, path: Path) -> LedgerEntry | None: ...
```

Plus `Clock`, `EventPublisher` and `JobProgress` from `engine/shared` and the daemon. There is no harness, judge, planner or result-writing port: report generation cannot call a model or change a retained record because the module has no way to. [R016, R134]

#### Application (`engine/reports/application/`)

| Use case | Reached through | Behavior |
|---|---|---|
| `PlanReport` | `reports.plan` | Resolves the scope (run → template), loads the template label and scoped results, validates an alternative through `Analysis.validate` and an analysis tariff through M10's tariff validation, runs `plan_contents`, proposes the default path, and returns counts, judge groups, weight options, parts and capabilities. Reads only. |
| `GenerateReport` | `reports.generate` (job) | Steps in order, each reported through `JobProgress`: `READ` (scoped results, excluded-other-hash count); `SCORE` (`Analysis.analyse` per judge group for the original selection and, when present, the alternative, both with the scope's tariff; `scoring_messages`); `ESCAPE` (build `ReportModel`; every text field is carried as data, never as markup); `EMBED` (screenshots read through `ResultSource.read_evidence`, counted `done/total`); `WRITE` (`ReportSink.begin`, stream `ReportRenderer.render`, `commit`); `OPEN` (`SystemOpener.open`, result kept in the outcome). Records a `LedgerEntry` and publishes `reports.report.written`. Cancellation or failure before `commit` calls `discard`, so nothing is written. [R014, R016, R125, R134] |
| `RevealReport` | `reports.reveal` | Accepts only a path in the ledger, then `SystemOpener.reveal`. |
| `GenerateOnCompletion` | in-engine subscriber to M11's completion event | When a run completes, starts `GenerateReport` for the run's template with original weights, no filters and the default path, as a job with `trigger="completion"`. Interfaces show the path from `reports.report.written`. [R134] |

`ScoringMessages` and the exact scoring inputs let the page recompute M06's weight-dependent steps when a reader enters alternative weights in the browser (section 6, conformance). The engine-side analyses embedded in the file are M06's own output; the page uses them unchanged for the original weights and for the alternative chosen at generation.

#### Adapters (`engine/reports/adapters/`)

| Adapter | Implements |
|---|---|
| `results_source.py` | `ResultSource` over M02's `RetainedResultReader` (plus the evidence reads listed in section 3). |
| `template_facts.py` | `TemplateFacts` over M01's `RevisionReader` and M08's `CheckIndex.titles`. |
| `scoring_analysis.py` | `Analysis` over M06's `RankingService` and `WeightValidation`. |
| `timeline_facts.py` | `TimelineFacts` over M18's application interface. |
| `html/renderer.py` | `ReportRenderer` with Jinja2 (`autoescape=True`, `StrictUndefined`) and the files in `html/assets/`: `report.html.j2`, `report.css`, `report.js` (filters, sorting, weight controls, export), `charts.js` (inline SVG via `createElementNS`), `scoring.js` (M06's weight-dependent steps in exact BigInt rational arithmetic). Assets are inlined; the output contains no `http:`, `https:` or protocol-relative URL, no external font and no framework. |
| `fs_sink.py` | `ReportSink`: temp file in the target directory, `fsync`, `os.replace`; refuses directories, missing parents and paths under `~/.axbenchmark/results/`. |
| `system_opener.py` | `SystemOpener`: macOS `open` / `open -R`, Linux `xdg-open` (reveal opens the parent directory); `asyncio.create_subprocess_exec` without a shell, 10 s timeout; exit status and stderr become `OpenAttempt.message`. |
| `yaml_ledger.py` | `ReportLedger` on `~/.axbenchmark/reports/ledger.yaml` (temp file + `os.replace`). |
| `rpc.py` | Maps `reports.*` DTOs to use-case inputs and domain results and errors to DTOs and error codes. The only module file that imports `axbenchmark.api`. |

How the file is built (renderer decisions that carry the safety and offline contracts):

| Concern | Decision |
|---|---|
| Inert text [R125, R133] | Static HTML (header, both tables in default order, task details, screenshot captions, notes) is rendered with autoescaping. All data for interactive parts sits in one `<script type="application/json" id="report-data">` island, serialized with `json.dumps(ensure_ascii=True)` and `<`, `>`, `&` written as `<`, `>`, `&`, so no string can close the element. `report.js` reads it with `JSON.parse(textContent)` and builds the DOM only with `createElement` and `textContent`. |
| Content Security Policy | A `<meta http-equiv="Content-Security-Policy">` with `default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'sha256-<inline script digest>'; base-uri 'none'; form-action 'none'`. Injected script cannot run and the page cannot fetch anything, which also enforces "no runtime data fetch". [R125] |
| Screenshots [R125] | Embedded in full as `data:` URIs on `<img>` elements in the static task-detail markup, so they show without JavaScript. Only PNG, JPEG and WebP verified by magic bytes are embedded as images; any other evidence is embedded as escaped text. An unreadable screenshot becomes a labeled placeholder and an outcome warning, never a silent gap. |
| No-JavaScript reading [R133] | Measured and quality tables, task outcomes and screenshots are static markup under the original weights and labeled as such. Charts, filters and weight controls are built by script; a `<noscript>` note says so. |
| Alternative weights in the page [R132] | Inputs for both sets, with a choice that fills them from each distinct original set (the results that froze it are named), from the profile defaults or from the original analysis; Apply runs `scoring.js` validation (same reason codes and messages as M06's `scoring.invalid_weights`) and, if valid, recomputes Q, trial means, measurement gates (partial counts as missing where weighted), every-trial eligibility, minima, contributions, shortlists and order for the visible judge group and filters, then relabels the page "Alternative weights". Reset restores the embedded original analysis. Filter changes recompute with the active weights, because minima depend on the filtered population (M06). |
| Export from the page [R132] | "Export alternative configuration" downloads a YAML file in M07's preset schema (the format `scoring.export_weights` writes); "Export alternative report" downloads a copy of the file whose separate `<script type="application/json" id="report-initial">` names the alternative to open with. Both use a `Blob` and an `a[download]` element, which work from `file://`. Original records are untouched. |
| Determinism | With a fixed `Clock`, identical inputs produce byte-identical files, which the tests rely on. |

#### Persisted state

```
~/.axbenchmark/reports/
  <template-slug>-r<rev>-<sha8>-<date>.html   default location of generated reports
  ledger.yaml                                 one row per written report: path, file sha256, size, template SHA-256,
                                              scope, weights label, trigger (user | completion), generated at, open attempt
```

A report written to a user-chosen path is recorded in the ledger but lives where the user put it. M13 writes nothing under `~/.axbenchmark/results/`; analysis and alternative weighting never change original measurements, grades or weights. [R134]

#### Owned processes

Only the short-lived opener subprocess of `SystemOpener` (one per open or reveal, 10 s timeout, never a shell). No long-running process.

### 2. API surface (`reports.*`)

Common request fragments: `scope: {template_sha256: str} | {run: str}` (run id or run directory path, passed as given); `filters: ResultFilters` (M02's DTO); `judge_group: str | None`; `weights: WeightSelectionDTO` (M06's DTO); `tariff: TariffDTO | None` (M10's DTO; the analysis tariff set in Results, omitted for each run's recorded tariff); `opens_with: "original" | "alternative"`.

#### Queries (safety `read`)

| Method | Request | Response | Errors |
|---|---|---|---|
| `reports.plan` | `scope`, `filters?`, `judge_group?`, `weights?`, `tariff?` | `ReportPlan` | `reports.unknown_template`, `reports.unknown_run`, `reports.invalid_weights` (M06's issues with `field` paths), `reports.invalid_tariff` (M10's issues with `field` paths), `reports.store_unreadable` |

`ReportPlan`: `template: TemplateScopeDTO` (name, revision, built-in, full SHA-256), `counts` (total, local, imported, excluded_other_sha), `filters_summary`, `judge_groups: list[JudgeGroupDTO]` (label, judge description, entry count), `weight_options: list[{key: "original" | "alternative", label, available, reason}]` (the original option's label is M06's, e.g. "Profile defaults: original weights differ across results"), `tariff_label: str | None` (set for an analysis tariff, labelled alternative), `parts: list[PartPlanDTO {part, label, locked, note}]`, `screenshot_count`, `zero_cost_count`, `unknown_cost_count`, `default_path`, `capabilities: ReportCapabilities`.

#### Jobs and commands

| Method | Kind | Request | Response | Errors | Safety |
|---|---|---|---|---|---|
| `reports.generate` | job | `scope`, `filters?`, `judge_group?`, `weights?`, `tariff?`, `opens_with = "original"`, `path?` (default from plan), `overwrite = false` | `JobRef` at once; `job.finished` carries `ReportOutcome` | Synchronous, before the job starts: `reports.unknown_template`, `reports.unknown_run`, `reports.no_results`, `reports.invalid_weights`, `reports.invalid_tariff`, `reports.no_alternative`, `reports.invalid_path` (`field: "path"`), `reports.target_exists` (`field: "path"`). In the job: `reports.write_failed`, `reports.store_unreadable`; a cancelled job finishes with state `cancelled` | `write` |
| `reports.reveal` | command | `path` | `RevealOutcome {path, opened, message}` | `reports.unknown_report` | `write` |

`ReportOutcome`: `path` (absolute), `size_bytes`, `file_sha256`, `template_sha256`, `result_count`, `local_count`, `imported_count`, `judge_groups: list[str]`, `weights_label` ("original weights", "Profile defaults: original weights differ across results", or the alternative's label), `tariff_label: str | None`, `screenshots_embedded`, `warnings: list[NoticeDTO]`, `trigger: "user" | "completion"`, `open_attempt: OpenAttemptDTO {attempted, opened, command, message}`. A failed open is data in the outcome, not an error. [R016, R134]

Progress payload (`job.progress` for this job): `ReportProgressDTO {steps: list[{key, label, state: "done" | "now" | "todo", done?, total?}], percent}`. Labels are composed by the engine ("Read 12 retained results · 0 excluded for another SHA-256", "Embedding review screenshots · 104 of 168").

#### Capability flags

| Flag | On | Reasons when false |
|---|---|---|
| `can_generate` | plan | `reports.no_results`, `reports.store_unreadable` |
| `can_use_alternative` | plan | `reports.no_alternative` (no alternative was passed), `reports.invalid_weights` |
| `locked` | each part | always true under the current contract; parts are listed, not chosen [R148] |

#### Events (topic `reports`)

| Event | Payload | Emitted when |
|---|---|---|
| `reports.report.written` | `job_id`, `path`, `template_sha256`, `run_id?`, `trigger`, `open_attempt` | A report file is committed, by a user request or at run completion. |

Job progress and completion use M11's generic `job.progress` / `job.finished`.

#### Error codes

`reports.unknown_template`, `reports.unknown_run`, `reports.no_results`, `reports.invalid_weights`, `reports.invalid_tariff`, `reports.no_alternative`, `reports.invalid_path`, `reports.target_exists`, `reports.write_failed`, `reports.store_unreadable`, `reports.unknown_report`. `reports.target_exists` carries a `remedy` offering overwrite; the client re-issues with `overwrite=true`.

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `RetainedResultReader.for_template` (comparable results only, with trial refs), `.run`, `.get` (application interface); `ComparisonScope` (refusing other hashes and results halted by a template change), `ResultFilter` (domain); `ResultFilters` DTO | M02 | Scoped retained results, run resolution, template admission, shared filter model. |
| `RetainedResultReader.evidence(rid, task_id)` and `.read_evidence(rid, evidence_id) -> bytes` (application interface) | M02 | Screenshots, review evidence and log excerpts for embedding. |
| `RankingService` (`analyse` per judge group, `WeightSelection` and tariff; its trial summaries, common original weights and labels), `WeightValidation`; `WeightSelectionDTO`; `scoring_vectors.json` fixture | M06 | Every score, gate, trial mean and range, minimum, ranking and table default order in the file; the original-weights label; validation of the alternative; conformance of `scoring.js`. |
| `RankingService.scoring_messages()` (reason code → message template for gates, empty-ranking explanations and weight issues) | M06 | The page shows M06's own wording when it recomputes alternative weights. |
| `RevisionReader.open` (template name, revision, built-in flag) | M01 | Header identity. |
| `CheckIndex.titles` | M08 | Check titles from the frozen suite in task details. |
| `TelemetryDescriber.describe(samples)` (scope client machine vs cloud inference, shared experiment energy vs configuration-attributable, source, coverage, limitations) | M18 | Timeline labels without restating M18's attribution rules. [R133] |
| Cost basis (`reported`, `verified_zero`, `estimate` with price source and date, `energy_estimate` with scope and tariff source, `unknown`, `mixed`) and coverage enums with covered and total tasks; `TariffDTO` and its validation; `display_currency_for(runs)` and `CostAnalysis.ranking_cost(result, tariff, display_currency)` (USD only when the scoped runs froze different display currencies) | M10 | Basis labels in the measured table; a new enum value fails a renderer test until labeled. |
| `run.state.changed` with `state: ended` and `outcome: completed` (published after judging; the run's template from `runs.status`) | M11 | `GenerateOnCompletion`. |
| `jobs.get`, `jobs.cancel`, `job.progress`, `job.finished`, `events.subscribe` | M11 | Progress screen, cancellation, CLI streaming. |
| ReportScreen (artboard ReportReady) consuming `ReportOutcome`; `h` on ResultsScreen enabled by `can_report` | M02 | Shows the path and the open attempt after generation. |
| `h` on RankingsPane passing `AnalysisSelection` (template, filters, judge group, weights, tariff); `h` on ResultsScreen passing its analysis tariff | M06, M02 | Prefills ReportGenerateScreen with the current alternative and tariff. |
| Forwarding `reports.report.written` (and the completion report job's `job.finished`) on topic `run:<id>`; run overview showing it | M11 / M15 | Path at benchmark completion in the TUI. |
| `axbenchmark report` command module and `run --no-tui` completion output | M14 | CLI access. |

### 4. Screens

Owned artboards: ReportGenerate and ReportProgress ([navigation §18](../design/wireframe-tui/navigation.md)). ReportReady is M02's `ReportScreen`; ReportPage is a wireframe of the generated file, not a Textual screen. Both screens live in `tui/screens/results.py` (as the legends state) with view models in `tui/viewmodels/report.py`. Neither evaluates a module rule: counts, part notes, weight options, the default path and every enabled state come from `reports.plan`; step labels come from `job.progress`; errors are shown verbatim with their `remedy`.

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

`ModalScreen[Path]`, constructor `ReportProgressScreen(job: JobRef)`. Tree as in the legend: `Vertical #report-progress .dialog` with `Vertical #report-steps` (step lines and `ProgressBar`), `Horizontal .dialog-actions`, `Footer`. `#report-steps` sits in a `ContentSwitcher` with `#report-steps-loading` (before the first snapshot) and `#report-steps-error`.

```python
@dataclass(frozen=True, slots=True)
class ReportProgressVM:
    steps: tuple[StepVM, ...]          # glyph from state (done ✓, now ●, todo ○), engine label
    percent: int | None
    note: str                          # fixed text: originals only read, competitor text inert
    state: Literal["running", "error", "cancelled"]
    error: ErrorVM | None
def build_report_progress_vm(progress: ReportProgressDTO | None, error: RpcError | None) -> ReportProgressVM: ...
```

| Event or binding | API call | Result |
|---|---|---|
| mount | `jobs.get(job.id)` for the snapshot, then `events.subscribe(["job"], since_seq)` filtered to this job; unsubscribe on unmount | Renders steps and the bar. Leaving the screen does not cancel the job. |
| `job.progress` | none | Rebuilds the view model. |
| `job.finished` with `ReportOutcome` | none | `dismiss(outcome.path)`; the callback pushes M02's `ReportScreen(outcome)`, which always shows the path and the open warning when `open_attempt.opened` is false. |
| `job.finished` with an error | none | `#report-steps-error` with the engine message; Close dismisses. |
| `esc`, Cancel | `jobs.cancel(job.id)` | The engine discards the temp file; on `job.finished` with state `cancelled` the screen dismisses with `None`. Nothing is written. |

#### Screens owned elsewhere that consume M13

ResultsScreen and ReportScreen (M02), RankingsPane (M06), the run overview (M11/M15, path from `reports.report.written`). The generated file's page (artboard ReportPage) is specified by the renderer decisions in section 1 and verified in section 6.

### 5. CLI

| Command | API methods |
|---|---|
| `axbenchmark report RUN_DIR` | `reports.generate(scope={run: RUN_DIR})` and the job's event stream; the engine resolves `RUN_DIR` through M02. Prints each step, then the path and the open attempt from `ReportOutcome`. A failed open prints a warning and exits 0; a typed error exits 1. [R055, R134] |
| `axbenchmark run … --no-tui` | On completion prints the path and open attempt from `reports.report.written` for the run (M14 owns the command). |

Implementation-level options owned by [M14](14-command-line-interface.md), which map to request fields and add no product behavior: `--output PATH` (`path`), `--overwrite`, `--weights FILE` (an alternative from a preset or exported YAML, sent as `weights` with `opens_with="alternative"`), `--tariff AMOUNT_PER_KWH` (`tariff`, an analysis tariff), `--json` (prints `ReportOutcome` or the job events as JSON lines). `reports.plan` and `reports.reveal` are reachable through M14's generic registry access.

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain unit | `plan_contents` always lists both tables and the three chart groups, locked, with or without telemetry. `scatter_partition` over the 12-result fixture of `design/wireframe-tui/src/results-data.mjs`: verified $0, unknown and partial cost omitted from points with their reasons, still present in measured rows; a three-trial configuration is one point at its means. `environment_legend` lists only present policies. `default_report_name` matches the artboard. `WeightPlan` refuses `opens_with=ALTERNATIVE` without an alternative. The header always carries the full SHA-256. |
| Use case (fake ports) | `GenerateReport` with fake `ResultSource`, `TemplateFacts`, `Analysis`, `ReportSink`, `SystemOpener`, `ReportLedger`: steps are reported in order with embed counts; the fake source is unchanged afterwards and exposes no write method; a result with another hash is counted as excluded and an identity-invalidated result never reaches the model; an analysis tariff reaches the fake `Analysis` and the header carries its alternative label; differing originals give the "Profile defaults: original weights differ across results" weights label; judge groups stay separate; cancellation and a renderer failure call `discard` and record nothing; a failing opener still yields an outcome with the path; `GenerateOnCompletion` starts one job per completed run. `RevealReport` refuses a path missing from the ledger. |
| Renderer and safety | A hostile fixture (`</script><script>…`, `<img src=x onerror=…>`, `javascript:` links, U+2028, template braces, a competitor SVG with script) in prompts, logs, reviews, labels and machine names: parse the output with html5lib and assert no element or attribute comes from data; the CSP hash matches the inline script; the output contains no `http:`, `https:` or `//` URL. A static scan of `html/assets/*.js` forbids `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `Function(`, `fetch`, `XMLHttpRequest`, `import(` and `WebSocket`. Byte-identical output for identical inputs. Every M10 cost-basis value has a label; estimates show price source and date, energy estimates their scope. Each trial has its own row followed by a mean and min–max row; partial values carry their coverage text. [R077, R125, R133] |
| Conformance with M06 | `scoring.js` runs under QuickJS (the `quickjs` Python package, a test-only dependency) against M06's `tests/fixtures/scoring_vectors.json`: identical normalized weights, Q, trial means and ranges, every-trial eligibility, partial-as-missing exclusions, exclusions with reason codes, minima, contributions, order and tie-breaks, compared as exact rationals. Validation of negative, nonfinite, unknown and all-zero inputs returns M06's codes and field paths. [R132; M06] |
| API (`InProcessClient`, no interface) | `reports.plan`, `reports.generate`, `reports.reveal` against the composed engine with fake producers and a fake opener: response models validate against the exported JSON Schema; synchronous typed errors carry stable codes and `field`; job progress and `reports.report.written` arrive in order and replay with `since_seq`; `jobs.cancel` leaves no file. With model access disabled and no harness installed, generation succeeds and no harness or judge port is called. [R016, R029, R134] |
| Browser (Playwright, as already used by M08) | Copy only the generated HTML to an empty directory; open it via `file://` in a context with `offline=True` and every request routed to abort, and assert zero requests. Check the full SHA-256, both tables with every required column, the three chart groups, the log-cost scatter with omitted entries explained, embedded screenshots loaded (`naturalWidth > 0`), default orders, filters, task evidence, ties broken by result id. Enter invalid weights (rejected with M06's messages), valid alternatives for both sets (tables, rankings, colors and stacks change together, label switches), reset, and both exports (download events; the exported report opens with the alternative). With `java_script_enabled=False`, both tables are readable. No `dialog` event fires for the hostile fixture. [R014, R125–R133, R148] |
| Screen (fake client, `App.run_test()` / `Pilot`) | View models built from canned `ReportPlan` and `ReportProgressDTO` without Textual. ReportGenerateScreen renders loading, empty, error and form states; the alternative radio is disabled from `weight_options` only; `ctrl+s` issues exactly `reports.generate` with the edited path and dismisses on `JobRef`; `reports.target_exists` marks `#report-path` and the overwrite re-issue sets `overwrite=True`. ReportProgressScreen follows job events, `esc` issues exactly `jobs.cancel`, and completion pushes ReportScreen with the outcome. No screen imports `axbenchmark.engine`. |
