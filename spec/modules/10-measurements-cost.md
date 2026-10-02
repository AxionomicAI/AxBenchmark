# M10 — Execution measurements and cost accounting

Status: proposed contract, derived from [SPEC.md](../SPEC.md). This module defines measurement meaning and accounting boundaries; it does not claim an implementation exists.

M10 provides measured cost and time for comparisons following the repository README's methodology and presentation, alongside a separate quality assessment. Every result describes a complete harness/model/environment configuration, including its execution conditions. Measurements must not be presented as evidence of isolated model capability. Rankings may support different user priorities, but their quality component comes from independent judging. [R004]

## Inputs, outputs, and dependencies

| Boundary | Conceptual contract |
|---|---|
| Execution inputs | [M05](05-harness-execution-isolation.md) supplies task process observations and available harness/provider usage and cost reports. [M11](11-run-orchestration.md) supplies task/configuration identities, execution status, scheduling context, and phase timing. Observations must remain associated with the task and complete configuration they describe. [R004, R078, R079] |
| Accounting inputs | Recorded pricing metadata from [M04](04-model-catalog.md) supports estimates where usage is known. An optional supplied COP exchange rate and optional electricity tariff are distinct inputs. [M18](18-hardware-monitoring.md) supplies energy observations with their actual scope and coverage. No rate or complete measurement is assumed when absent. [R080, R081, R114, R147] |
| Verification inputs | [M08](08-verification-evidence.md) supplies task verification results. M10 records them alongside execution status without deriving verification success from timing, token counts, or cost. Quality assessment belongs to [M12](12-quality-judging.md). [R004, R078] |
| Measurement outputs | Produce per-task records and configuration aggregates containing wall time, available input/cached/output/reasoning tokens, cost, verification results, and execution status. Include measurement source, coverage, and cost basis so [M02](02-retained-results-comparability.md), [M06](06-scoring-rankings.md), the TUI and CLI (as clients of the engine API), and the report can preserve their meaning. [R078, R080, R081] |

## Collection and aggregation

Accept available measurements, associate them with the relevant task, and derive aggregates without double-counting cumulative events. A stream containing intermediate cumulative usage and a final total must not turn both into additional consumption. Retain the meaning of token categories: cached tokens may overlap input tokens, and reasoning tokens may overlap output tokens. Exposing those categories separately does not authorize adding them into an inflated total or charging for the same usage twice. This contract specifies the accounting outcome rather than a harness-specific reconciliation algorithm. [R078]

Benchmark elapsed time is the sum of task process durations for the configuration. Each duration includes the harness's tool work. Queueing, planning, external verification, and independent judging are excluded from benchmark elapsed time; report each of those phases and total experiment duration separately. The configuration's summed task durations and the experiment's overall duration are distinct measures, including when configurations run concurrently. A competitor performing its own tool-based testing remains within its task process duration. [R079]

Live output rates and context use shown while a task runs ([M15](15-terminal-interface.md)) are observation aids, not measurements of this module: they do not enter per-task records, aggregates, cost, elapsed time, or rankings, and a live stream count never replaces the harness's final usage report. [R044]

Missing observations must remain unknown; usable but incomplete observations remain partial. Display their source and coverage at task and aggregate levels. An aggregate containing incomplete measurements cannot silently become a complete total. Failure, interruption, or unavailable reporting does not justify replacing missing time, usage, or cost with zero, and recorded execution status remains visible alongside the measurements. [R078, R080, R147]

## Cost basis and currency

Prefer reported cost. When it is unavailable, calculate an explicitly labeled API-equivalent estimate only from known usage and recorded rates. Keep reported amounts and estimates identifiable, including their coverage; do not add an estimate to a reported amount covering the same usage. A subscription does not establish zero cost, and missing pricing does not establish zero cost. If the available evidence supports only a partial estimate or no estimate, retain that limitation instead of inventing the missing usage or rate. [R078, R080]

USD is the primary display currency. COP conversion is optional and requires a supplied exchange rate recorded with the benchmark. The historical README exchange rate must not be treated as current. Preserve cost basis and estimate labels wherever rankings could otherwise suggest equivalent accounting; currency conversion does not turn an estimate into a reported charge or resolve incomplete coverage. [R080, R081]

An optional electricity tariff may produce a clearly labeled energy-cost estimate. Preserve the scope of the energy observation: CPU-package or GPU-only measurements cannot establish whole-system electricity cost. Keep shared experiment energy separate from per-configuration rankings, without fabricated per-harness allocations during parallel execution. Do not add overlapping energy charges to reported provider costs. Partial or missing energy data remains partial or unknown in any associated estimate. [R114, R147]

## Acceptance criteria

- A task and its aggregate expose every required measurement category, verification result, and execution status, with unavailable fields identifiable. Cumulative usage events and overlapping token categories never inflate usage or cost. [R078, R080, R147]
- A run containing queueing, planning, tool work, external checks, and judging includes only task process durations, with tool work, in benchmark elapsed time; excluded phases and total experiment duration remain separately inspectable. [R079]
- Reported cost takes precedence; known usage with recorded rates produces a labeled estimate. Subscription, absent pricing, and incomplete usage cases never manufacture zero or complete cost. [R080, R147]
- USD remains primary. COP appears only with the supplied, recorded rate, and ranking presentations retain accounting bases and estimate labels. [R081]
- Optional tariff estimates preserve measurement scope. Shared energy is not allocated arbitrarily to concurrent configurations, package/GPU readings do not imply whole-system cost, and provider charges do not receive overlapping energy additions. [R114, R147]
- Comparison consumers retain full configuration context and the distinction between measured execution statistics and independent quality assessment. [R004]

## Implementation

Implementation decisions under [the architecture decision](ARCHITECTURE.md). They fix where the accounting rules above run and how interfaces reach them; they add no product behavior. File names, token-count formatting and debounce intervals are engineering defaults, not product requirements.

### 1. Engine component

Package `axbenchmark.engine.measurements`. M10 turns execution observations into retained measurement records and serves them, with their source, coverage and cost basis, to every consumer. It is the only code that folds usage, picks a cost basis, sums task durations, converts currency or prices energy. Interfaces, M06 and M13 receive the results; none of them recomputes a total, a basis or a coverage state.

#### Domain (`engine/measurements/domain/`, no I/O)

Money is `decimal.Decimal` in USD; token counts are `int`; durations are integer milliseconds. Floats never appear in the domain.

| Type / function | Contents |
|---|---|
| `Coverage` | Enum `COMPLETE`, `PARTIAL`, `UNKNOWN`. [R078, R147] |
| `Limitation` | `code` and detail: `not_exposed` (the harness version does not report the category), `not_observed` (no observation, e.g. task never ran), `final_total_missing`, `no_rate`, `no_usage`, `no_cache_discount`, `subscription_billing`, `interrupted`, `mixed_usage_stream`. |
| `Measured[T]` | `value: T \| None`, `coverage`, `source` (`harness`, `provider`, `engine_clock`, `estimate`, `imported`), `limitations: tuple[Limitation, ...]`. Invariant: `coverage is UNKNOWN` ⇔ `value is None`; no constructor or operation turns `None` into zero. [R078, R147] |
| `TokenUsage` | `input`, `cached`, `output`, `reasoning: Measured[int]`. `cached` is a subset of `input` and `reasoning` a subset of `output`; the type has no total-tokens field and no operation adds categories together. [R078] |
| `UsageReport` | One `harness.usage.reported` observation: `seq`, the four categories (each `int \| None`), `reported_cost: Decimal \| None`, `cumulative: bool`, `final: bool`. |
| `fold_usage(reports, exposure) -> UsageFold` | Cumulative reports replace earlier cumulative values per category (counted once, from the latest); delta reports are summed. A stream mixing both kinds for one invocation keeps only what can be counted once and is `PARTIAL` with `mixed_usage_stream`. Coverage is `COMPLETE` only when a final report arrived, `PARTIAL` when only intermediate reports arrived, `UNKNOWN` when none did. A category the adapter's `ExposureProfile` does not expose is `UNKNOWN` with `not_exposed`. Reported cost folds by the same rule. Records `report_count`, `cumulative_count`, `counted_from` (`final_total`, `sum_of_deltas`). [R078] |
| `Pricing` | From the frozen [M04](04-model-catalog.md) evidence in the launch record: `price_in`, `price_out` per million tokens (`Decimal \| None`), `provider`, `source_layer`, `retrieved_at`. No cache-read rate exists in the M04 contract, so an estimate never applies a cache discount and carries `no_cache_discount` when cached tokens are reported or unexposed. |
| `CostBasis` | Enum `REPORTED`, `ESTIMATE` (API-equivalent), `VERIFIED_ZERO`, `UNKNOWN`; aggregates add `MIXED`. [R080] |
| `TaskCost` | `amount: Measured[Decimal]`, `basis`, `estimate_terms: tuple[EstimateTerm, ...]` (`tokens`, `rate`, `amount` per category charged). |
| `cost_for_task(fold, pricing, billing) -> TaskCost` | Reported cost present → `REPORTED` with the fold's coverage, and no estimate is computed for the same usage. Otherwise input and output usage known and both rates known → `ESTIMATE` = input × `price_in` + output × `price_out` (cached and reasoning are subsets, never charged again), coverage from the fold. Missing rate or usage → `UNKNOWN` with `no_rate` / `no_usage`. A subscription account adds `subscription_billing` and never yields zero. `VERIFIED_ZERO` only from the explicit source named in open question 1. [R080, R147] |
| `TaskTime` | `Measured[int]` process duration from `harness.task.exited` (start to exit, tool work included). A task whose engine died before exit is `PARTIAL` with `interrupted`, measured to the last observation. A task that never started is `UNKNOWN` with `not_observed`. [R079] |
| `ProcessOutcome`, `CheckSummary` | Recorded as received from [M05](05-harness-execution-isolation.md) / [M11](11-run-orchestration.md) and [M08](08-verification-evidence.md) (status label, exit classification; passed, failed, unverified, not run counts). No function in this package derives either from time, tokens or cost. [R004, R078] |
| `TaskMeasurement` | `scope` (run, configuration, task id, title, index), `process`, `checks`, `usage: TokenUsage`, `time: TaskTime`, `cost: TaskCost`, `fold` facts, `limitations`. |
| `aggregate(tasks, expected) -> ConfigurationAggregate` | Per category: sum of known values; `COMPLETE` only when every expected task is complete for that category, `UNKNOWN` when none is known, else `PARTIAL`, with `covered: int` of `expected: int`. Cost: one basis when all tasks share it, otherwise `MIXED` with `by_basis: Mapping[CostBasis, Decimal]` so reported amounts and estimates stay identifiable. Never adds an estimate and a reported amount for the same task. [R078, R080, R147] |
| `PhaseKind` | `QUEUE`, `PLANNING`, `VERIFICATION`, `JUDGING`, each with its intervals; plus `TASK_PROCESS`. |
| `RunTiming` | Per configuration: `benchmark_elapsed = Σ TaskTime` (only task processes), and each excluded phase as its own `Measured[int]`; run-level `experiment: Measured[int]` = clock time from launch to the end of the last phase. No function adds an excluded phase to benchmark elapsed, and the experiment duration is never derived from the sum of configurations. [R079] |
| `Accounting` | `cop_rate: Decimal \| None`, `cop_as_of: date \| None`, `tariff_usd_per_kwh: Decimal \| None`. The package contains no exchange rate constant; the README's historical rate exists nowhere in code. [R081] |
| `validate_accounting(draft) -> Accounting` | Raises `InvalidAccounting(issues)` listing every issue: `not_a_number`, `nonfinite`, `not_positive`, `missing_rate` (COP enabled without a rate), `missing_tariff`, `invalid_date`. Invalid input is never replaced. [R081, R114] |
| `to_cop(amount, accounting) -> Measured[Decimal] \| None` | `None` without a recorded rate; otherwise the converted value keeps the source's basis, coverage and limitations. [R081] |
| `EnergyCost` | `energy_kwh: Measured[Decimal]`, `scope` (M18's scope label and measured / not-measured domains), `window` (`EXPERIMENT`, or `SEQUENTIAL_WINDOW(configuration_id)` with `includes_background=True`), `usd: Measured[Decimal]`, basis always `ESTIMATE`. [R114, R147] |
| `energy_cost(observation, tariff) -> EnergyCost` | Tariff × observed energy, coverage and scope carried from the observation. Not a field of `TaskMeasurement` or `ConfigurationAggregate`; no function allocates experiment energy to a configuration or adds it to a provider cost. [R114, R147] |
| `InvocationAccount` | Usage and cost of a judging or planning invocation (`role`, `invocation_id`), built with the same fold and basis rules, kept outside every benchmark aggregate. [R082] |

#### Ports (`engine/measurements/ports.py`)

```python
class MeasurementStore(Protocol):
    async def append_usage(self, scope: InvocationScope, report: UsageReport) -> None: ...
    async def save_task(self, record: TaskMeasurement) -> None: ...
    async def save_invocation(self, account: InvocationAccount) -> None: ...
    async def save_energy(self, run_id: str, costs: Sequence[EnergyCost]) -> None: ...
    async def load_configuration(self, ref: ResultRef) -> Sequence[TaskMeasurement]: ...
    async def load_usage(self, scope: InvocationScope) -> Sequence[UsageReport]: ...
    async def load_invocation(self, invocation_id: str) -> InvocationAccount: ...
    async def load_energy(self, run_id: str) -> Sequence[EnergyCost]: ...

class ResultIndex(Protocol):            # adapter over M02's RetainedResultReader (get, for_template)
    async def resolve(self, result_id: str) -> ResultRef: ...     # run, configuration, record dir, origin, header facts
    async def list(self, template_sha: str, filters: ResultFilters) -> Sequence[ResultRef]: ...

class LaunchFacts(Protocol):            # M07 frozen launch record, via M11
    async def configuration(self, run_id: str, configuration_id: str) -> ConfigurationFacts: ...
    # ConfigurationFacts: task ids and titles in order, Pricing, billing (subscription | api | local), ExposureProfile.usage
    async def accounting(self, run_id: str) -> Accounting: ...

class RunTimeline(Protocol):            # M11 application interface
    async def intervals(self, run_id: str) -> Timeline: ...       # phase intervals per configuration, launch and end times, jobs

class CheckSummaries(Protocol):         # adapter over M02's RetainedResultReader (check outcomes M08 recorded)
    async def for_configuration(self, run_id: str, configuration_id: str) -> Mapping[str, CheckSummary]: ...

class EnergySource(Protocol):           # M18 application interface
    async def observations(self, run_id: str) -> Sequence[EnergyObservation]: ...
    async def host_scope(self) -> EnergyScope: ...
```

Plus the shared `EventPublisher`, `EventSource` (in-engine subscription to other modules' events) and `Clock`.

#### Application (`engine/measurements/application/`)

| Use case | Trigger | Steps |
|---|---|---|
| `RecordUsage` | `harness.usage.reported` (any role) | `append_usage` to the invocation's usage log before anything else. No total is published from a non-final report. [R044, R078] |
| `FinalizeTask` | `harness.task.exited` for a `TaskScope` | Load usage, `fold_usage`, `cost_for_task` with `LaunchFacts`, take the duration from the exit, attach the process outcome; `save_task`; publish `measurements.task.recorded` and `measurements.configuration.aggregated`. |
| `RecordChecks` | `verification.task.completed` (counts by status and cause) | Update the task record's `CheckSummary` only; publish `measurements.task.recorded`. |
| `RecordPhase` | `run.phase.started` / `run.phase.finished`, `run.state.changed` | Publish `measurements.timing.updated`; timing itself is read from `RunTimeline` on query, so M10 stores no duplicate clock. [R079] |
| `FinalizeInvocation` | `harness.task.exited` for a `JudgingScope` or `PlanningScope` | Fold and cost as above into an `InvocationAccount`; `save_invocation`; publish `measurements.invocation.recorded`. [R082] |
| `ReconcileInterrupted` | `run.state.changed` with `outcome: interrupted` (engine restart) | For each started task without an exit: record `PARTIAL` time to the last observation and partial usage, `interrupted`. Never resumes or fills in values. |
| `PriceEnergy` | `run.state.changed` with `state: ended` | If the frozen accounting has a tariff, `energy_cost` for each M18 observation; `save_energy`. |
| `GetResultMeasurements` | `measurements.result` | Resolve the result, load task records, `aggregate`, timing from `RunTimeline` (local results) or the record (imported), COP from recorded accounting, capabilities. |
| `ExplainTask` | `measurements.task` | One task's fold facts, estimate terms, rate source, time window and limitations. |
| `GetRunTiming` | `measurements.timing` | `RunTimeline` + task records → `RunTiming` with intervals. |
| `ListCostBases` | `measurements.cost_bases` | `ResultIndex.list`, aggregate cost per result. |
| `GetAccounting` | `measurements.accounting` | Recorded accounting and energy costs of a run, read-only. |
| `PreviewAccounting`, `ValidateAccounting` | `measurements.preview_accounting`, `measurements.validate_accounting` | `validate_accounting` plus `EnergySource.host_scope`; preview returns issues as data, validate raises. M07 calls `ValidateAccounting` through the in-engine `AccountingValidation` Protocol when saving or launching, so the same rules apply to CLI configs. |
| `GetInvocationAccount` | `measurements.invocation` | Load one judging or planning account. |

Application Protocols exposed to other modules: `MeasurementReader` (per-result `ConfigurationAggregate`, `TaskMeasurement`s, `RunTiming`, energy costs) for [M02](02-retained-results-comparability.md), [M06](06-scoring-rankings.md), [M13](13-standalone-html-report.md), [M17](17-zip-exchange.md) and [M18](18-hardware-monitoring.md); `AccountingValidation` for [M07](07-run-configuration.md); `MeasurementSummary.for_configuration(run_id, configuration_id) -> (elapsed, cost)` (each with basis and coverage) for [M11](11-run-orchestration.md) lanes and `runs.status`; `JudgingCostAccounting` (`measure(invocation_id) -> InvocationAccount`, `estimate(selection, result_id) -> CostDTO` from frozen `Pricing`, unknown when no rate exists) for [M12](12-quality-judging.md).

#### Adapters (`engine/measurements/adapters/`)

| Adapter | Implements |
|---|---|
| `json_store.py` | `MeasurementStore` as files in directories handed over by M11 / M02 / M12 / M16 (see Persisted state). Writes are atomic (temp file + rename). |
| `results_index.py`, `launch_facts.py`, `timeline.py`, `checks.py`, `energy.py` | The ports above over the M02, M07/M11, M11, M08 and M18 application interfaces. |
| `event_wiring.py` | Subscribes the trigger use cases to `harness.*`, `runs.*` and `verification.*` events at composition time. |
| `rpc.py` | `measurements.*` methods: DTO ↔ domain. Decimal amounts travel as decimal strings plus a float for sorting; accounting inputs arrive as `str \| None` so unparsable text reaches the domain and returns as `measurements.invalid_accounting` with a field path. Registers the topic snapshot provider for `measurements.*` events with M11's subscription service. |

#### Persisted state

M10 writes only into directories its callers hand it.

| Path | Content |
|---|---|
| `<configuration dir>/tasks/<task_id>/usage.jsonl` | Usage reports as received, append-only, with `seq`. Written before any fold. |
| `<configuration dir>/tasks/<task_id>/measurements.json` | `TaskMeasurement` (schema-versioned). |
| `<run dir>/energy-cost.json` | `EnergyCost` records, only when a tariff was recorded. |
| `<invocation dir>/usage.jsonl`, `<invocation dir>/measurements.json` | Judging and planning accounts, in the directories M12 and M16 allocate. |

Configuration aggregates and run timing are derived on read and never stored, so they cannot diverge from task records. Imported results carry the same files from their package; M10 reads them through `ResultIndex` and never recomputes or upgrades them (an imported estimate stays an estimate; source `imported`). Accounting inputs are part of the launch record frozen by M07, not of M10's files.

#### Owned processes

None. M10 runs inside `axbenchmarkd` and reacts to events; it starts no subprocess.

### 2. API surface (`measurements.*`)

Common DTO: `MeasuredDTO = {value: str | int | None, sort: float | None, coverage: "complete" | "partial" | "unknown", source, limitations: list[{code, message}]}`. Money values are USD decimal strings; `cop: MeasuredDTO | None` sits beside each money value when a rate is recorded.

#### Queries (safety `read`)

| Method | Request | Response | Errors | Capabilities |
|---|---|---|---|---|
| `measurements.result` | `result_id` | `ResultMeasurements` | `measurements.unknown_result`, `measurements.record_unreadable` | `can_timing`, `can_cost_basis`, `can_currency`, per row `can_open_task`, each with `reason` |
| `measurements.task` | `result_id`, `task_id` | `TaskFormation` | `measurements.unknown_result`, `measurements.unknown_task`, `measurements.record_unreadable` | — |
| `measurements.timing` | `run_id` | `RunTimingView` | `measurements.unknown_run` | per row `can_open` |
| `measurements.cost_bases` | `template_sha`, `filters: ResultFilters` (M02) | `CostBasisTable` | `measurements.unknown_template` | per row `can_open`, `can_currency` |
| `measurements.accounting` | `run_id` | `AccountingView` | `measurements.unknown_run` | `editable: false`, `reason: "measurements.frozen_at_launch"` |
| `measurements.preview_accounting` | `AccountingDraft {cop_enabled: bool, cop_rate: str \| None, cop_as_of: str \| None, tariff_enabled: bool, tariff_usd_kwh: str \| None}` | `AccountingPreview` (issues are data here) | — | `can_save` |
| `measurements.validate_accounting` | `AccountingDraft` | `AccountingDTO {cop_rate, cop_as_of, tariff_usd_kwh}` | `measurements.invalid_accounting` (field paths `cop_rate`, `cop_as_of`, `tariff_usd_kwh`) | — |
| `measurements.invocation` | `invocation_id` | `InvocationAccountDTO {invocation_id, role, usage: TokenUsageDTO, cost: CostDTO}` | `measurements.unknown_invocation` | — |

Commands: none. Recording is driven by engine events, and accounting inputs are stored by M07 with the configuration. Jobs: none; every query reads stored records.

Response models (`axbenchmark.api.measurements`):

| Model | Fields |
|---|---|
| `ResultMeasurements` | `result_id`, `run_id`, `configuration_id`, `origin` (local, imported), `header {machine, run, harness, model, effort, environment_policy, jobs, template_sha, status, failed_at}`, `live: bool` (run still active), `tasks: list[TaskRowDTO]`, `total: TotalRowDTO`, `phases: PhasesDTO`, `halt: HaltDTO \| None`, `sources: SourcesDTO`, `currency {primary: "USD", cop_rate, cop_as_of}`, `notices: list[NoticeDTO]`, `capabilities` |
| `TaskRowDTO` | `task_id`, `index`, `title`, `process {status, label}` (e.g. `exit 0`, `auth 401`, `not run`), `checks {passed, failed, unverified, not_run}`, `time`, `input`, `cached`, `output`, `reasoning: MeasuredDTO`, `cost: CostDTO`, `can_open_task` |
| `CostDTO` | `amount: MeasuredDTO`, `basis` (`reported`, `estimate`, `verified_zero`, `unknown`, `mixed`), `by_basis: dict[str, str] \| None`, `cop: MeasuredDTO \| None` |
| `TotalRowDTO` | As `TaskRowDTO` without `task_id`, plus `covered`, `expected`, `status` (configuration outcome from M11) |
| `PhasesDTO` | `benchmark_elapsed: MeasuredDTO`, `task_count`, `queue`, `planning`, `verification`, `judging: MeasuredDTO` (`planning` carries `not_observed` with reason `built_in_template` when no planning ran), `experiment: MeasuredDTO`, `configurations_in_run`, `jobs` |
| `HaltDTO` | `code` (e.g. `harness.auth_failed`), `message`, `at`, `task_id`, `last_usage_at` |
| `SourcesDTO` | `cost_source {harness, version, basis}`, `token_source`, `coverage_by_task: list[{task_id, coverage}]`, `status_label` |
| `NoticeDTO` | `code`, `severity`, `message`; codes include `measurements.overlapping_categories`, `measurements.partial_total`, `measurements.no_cache_discount`, `measurements.subscription_billing`, `measurements.mixed_basis` |
| `TaskFormation` | `task_id`, `title`, `usage_reports {count, cumulative_count, final_present, counted_from}`, `usage: TokenUsageDTO`, `reasoning_within_output: bool`, `cached_exposed: bool`, `harness_version`, `reported_cost: MeasuredDTO`, `estimate: {terms: list[{category, tokens, rate_per_million, amount}], amount} \| None`, `rates {provider, source_layer, retrieved_at} \| None`, `time {value_ms, started_at, ended_at, includes_tool_work: true}`, `limitations` |
| `RunTimingView` | `run_id`, `template {label, sha}`, `machine`, `launched_at`, `jobs`, `live`, `configurations: list[{result_id, configuration_id, harness, model, effort, benchmark_elapsed, queue, planning, verification, judging: MeasuredDTO, status, intervals: list[{kind, start_ms, end_ms, task_id}], can_open}]`, `sum_row`, `judging_intervals`, `experiment: MeasuredDTO`, `notices` (e.g. `measurements.no_queue`, `measurements.no_planning`, `measurements.concurrent_overlap`) |
| `CostBasisTable` | `template_sha`, `rows: list[{result_id, run_id, origin, harness, model, cost: CostDTO, coverage_detail {covered, expected, missing_task_ids}, limitations, can_open, can_currency}]` |
| `AccountingView` | `run_id`, `accounting: AccountingDTO`, `energy: list[EnergyCostDTO {window, configuration_id, includes_background, energy_kwh, usd: MeasuredDTO, scope {label, measured, not_measured, source, requires}}]`, `capabilities` |
| `AccountingPreview` | `issues: list[{field, reason, message}]`, `accounting: AccountingDTO \| None`, `energy_scope {label, measured, not_measured, source, requires}`, `capabilities {can_save}` |

#### Events

| Event | Payload | Consumers |
|---|---|---|
| `measurements.task.recorded` | `result_id`, `run_id`, `configuration_id`, `TaskRowDTO` | MeasurementsScreen, M02 Outcomes tab, CLI `--json` streams |
| `measurements.configuration.aggregated` | `result_id`, `TotalRowDTO` | MeasurementsScreen, CostBasisScreen, M06 / M02 refresh |
| `measurements.timing.updated` | `run_id`, `configuration_id \| None` | TimingScreen, MeasurementsScreen `#phases` |
| `measurements.invocation.recorded` | `invocation_id`, `role`, `CostDTO` | M12 review detail, M16 planning screens |

No event is published from a non-final usage report; live rates and context use stay in `harness.*`. [R044]

#### Error codes

| Code | Meaning |
|---|---|
| `measurements.unknown_result`, `measurements.unknown_task`, `measurements.unknown_run`, `measurements.unknown_template`, `measurements.unknown_invocation` | The target does not exist. |
| `measurements.record_unreadable` | A stored usage log or record cannot be parsed; `data` names the file and line. Affected values are never estimated in its place. |
| `measurements.invalid_accounting` | One `field` path per issue with its reason. [R081, R114] |

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `harness.usage.reported` with `seq` and a new `final: bool` (the adapter saw the harness's terminal usage record), for all roles | M05 | `RecordUsage`; coverage `COMPLETE` needs a final report. Defined in M05. |
| `harness.task.exited` (start/end timestamps, duration, `ExitClassification`), `ExposureProfile.usage` per harness version | M05 | Task time, process outcome, `not_exposed`. |
| `run.phase.started`, `run.phase.finished` (kind queue, verification, judging; scope), `run.state.changed` (`state: ended` with `outcome` completed, stopped or interrupted) | M11 | Timing updates, energy pricing, reconciliation. |
| `RunTimeline` application interface (phase intervals, launch and end time, jobs) and run/configuration directory allocation | M11 | `GetRunTiming`, persisted state. |
| `events.subscribe` with snapshot providers per namespace | M11 | Screen subscriptions to `measurements.*`. |
| Frozen launch record: per configuration task list, frozen M04 `Pricing`, billing kind, endpoint kind; the run's `Accounting` | M07 (via M11) | `LaunchFacts`. |
| `execution.accounting: AccountingDTO` in the configuration draft, set with `configs.set_execution(draft_id, accounting=…)`, saved with the configuration and frozen at launch; a SetupScreen binding that pushes `CurrencyEnergyScreen` (key not yet assigned in the wireframe) | M07 | Setup entry point of CurrencyEnergy. |
| `Pricing` value object (`price_in`, `price_out`, provider, source layer, retrieved_at) inside `SelectionEvidence` | M04 | Estimates. |
| `verification.task.completed` (counts by status and cause); recorded check outcomes through M02's `RetainedResultReader` | M08 / M02 | Check columns, recorded only. |
| `EnergySource` application interface (observations with scope, window, coverage, source; host energy scope) | M18 | Energy cost, CurrencyEnergy `#energy-scope`. |
| `RetainedResultReader` (`get`, `for_template`), `ResultFilters` DTO, `results.result.sealed`, `results.import.registered` | M02 | Resolve results; cost-basis list. |
| `m` binding on ResultScreen's Outcomes tab → `MeasurementsScreen(result_id)`; `b` binding on ResultsScreen → `CostBasisScreen(template_sha, filters)` | M02 | Entry points named in the wireframe trees ("m from Result › Outcomes", "b from Results"). |
| `TaskChecksScreen(result_id, task_id)` | M08 | `enter` on a task row. |
| `ContentSwitcher` state widgets, `-compact` screen class | M15 | Loading, empty, error states; 80×24 layout. |

Consumers of this namespace: M02 (Outcomes tab `#task-outcomes`, `#coverage` through `measurements.result`), M06 (`MeasurementReader`: cost and time as `Measured` with basis and coverage), M13 (`MeasurementReader`), M17 (records travel unchanged in result ZIPs), M12 and M16 (`measurements.invocation`).

### 4. Screens

Owned artboards: Measurements (wide and compact), MeasurementsPartial, TimingPhases, CostBasis, CurrencyEnergy ([navigation §15](../design/wireframe-tui/navigation.md)). Every screen is a view over `measurements.*` responses. No screen sums a column, picks a basis, decides coverage, converts currency or prices energy; it formats engine values, renders capability flags with `check_action`, and shows typed errors verbatim.

Formatting rules shared by the view models (presentation only): `coverage == "unknown"` renders `—` with class `-unknown`, or `?` when the limitation is `not_exposed`; `partial` renders the value plus ` ▲` with class `-partial`; money `$0.21`, tokens `702k` / `1.23M`, durations `m:ss` / `h:mm:ss`; basis text `estimate · complete`, `reported · 5/7 ▲` from `basis`, `coverage`, `covered`, `expected`. Order of rows comes from the response.

#### MeasurementsScreen — artboards Measurements, MeasurementsPartial

`MeasurementsScreen(Screen)` in `tui/screens/measurements.py`, constructor `MeasurementsScreen(result_id: str)`. View model `tui/viewmodels/measurements.py`:

```python
@dataclass(frozen=True)
class MeasurementsVM:
    result_bar: str; halted: bool                    # #result-bar, class -halted when status is not complete
    rows: list[MeasureRowVM]                         # key = task_id; cells + per-cell class "", "-partial", "-unknown"
    total: MeasureRowVM                              # Σ row, bold
    overlap_hint: str                                # from measurements.overlapping_categories notice
    formation: list[tuple[str, str]] | None          # #formation, selected task (wide only)
    phases: list[tuple[str, str]]                    # #phases
    halt: NoticeVM | None                            # #halt (MeasurementsPartial)
    coverage: list[tuple[str, str]] | None           # #coverage, shown when total coverage is not complete
    accounting: list[tuple[str, str]]                # #accounting (compact only)
    capabilities: MeasurementCapabilities

def build_measurements_vm(m: ResultMeasurements, f: TaskFormation | None, compact: bool) -> MeasurementsVM
```

| Item | Behavior |
|---|---|
| Load | On mount, in a worker: `measurements.result(result_id)`; then `measurements.task(result_id, <highlighted task>)` for `#formation` (wide only). |
| Subscriptions | When `live`: `events.subscribe(["measurements.task.recorded", "measurements.configuration.aggregated"])` filtered to `result_id` and `["measurements.timing.updated"]` filtered to `run_id`; each event re-issues `measurements.result`. Unsubscribe on unmount. |
| ContentSwitcher | `#measurements` / `#measurements-loading` / `#measurements-empty` (no task has finished: "No measurements yet") / `#measurements-error` (typed error, e.g. `measurements.record_unreadable`, message verbatim; nothing is estimated in its place). |
| Widgets | `Static #result-bar`; `DataTable #measurements` (columns `#`, Task, Process, Checks, Time, Input, Cached, Output, Reason., Cost, Basis · coverage; compact: `#`, Task, Process, Time, In, Out, Cost, Basis); `Static #overlap-hint`; `Static #formation`, `Static #phases` (hidden in `Screen.-compact`); `Static #halt .notice.-error` from `halt`; `Static #coverage .kv` from `sources`; `Static #accounting` (compact); `Horizontal .actions` with `Button #timing` and `Button #cost-basis`. |
| `DataTable.RowHighlighted` | Debounced `measurements.task(result_id, task_id)`; updates `#formation` only. The Σ row issues no call. |

| Binding | Action | API call |
|---|---|---|
| `esc` | `app.pop_screen` | none |
| `t` / `Button #timing` | `timing` | push `TimingScreen(run_id)`; `check_action` returns `capabilities.can_timing` |
| `b` / `Button #cost-basis` | `cost_basis` | push `CostBasisScreen(template_sha, filters=None)`; enabled by `can_cost_basis` |
| `u` | `currency` | push `CurrencyEnergyScreen(mode="recorded", run_id=run_id)`; enabled by `can_currency` |
| `enter` | `open_task` | push `TaskChecksScreen(result_id, task_id)` (M08); enabled by the row's `can_open_task` |
| `tab` | `focus_next` | none |

The two artboards are one screen: MeasurementsPartial is a `ResultMeasurements` with `halt` set and total coverage `partial`.

#### TimingScreen — artboard TimingPhases

`TimingScreen(Screen)` in `tui/screens/measurements.py`, constructor `TimingScreen(run_id: str)`. View model `tui/viewmodels/timing.py`: `TimingVM {run_bar, ticks: list[tuple[float, str]], lanes: list[LaneVM(label, segments: list[(start_frac, end_frac, kind)])], judging_lane, rows: list[PhaseRowVM], sum_row, experiment_row, notes: list[str]}`, built by `build_timing_vm(view: RunTimingView, width: int)`. Fractions are interval offsets divided by the experiment duration from the engine; drawing █ (task process), ▒ (verification) and ░ (judging) in `Static #timeline` is rendering, not measurement.

| Item | Behavior |
|---|---|
| Load | `measurements.timing(run_id)`. |
| Subscriptions | When `live`: `measurements.timing.updated` filtered to `run_id` re-issues `measurements.timing`. |
| ContentSwitcher | `#phase-table` / `#phase-table-loading` / `#phase-table-error`. |
| Widgets | `Static #run-bar`, `Static #timeline .pane`, `DataTable #phase-table .bordered` (Configuration, Benchmark elapsed, Queue, Planning, Verification, Judging, Status; Σ row and Experiment row last), `Static #phase-note` from `notices`. |

| Binding | Action | API call |
|---|---|---|
| `esc` | `app.pop_screen` | none |
| `enter` | `open_result` | push `MeasurementsScreen(row.result_id)`; enabled by the row's `can_open` (false on Σ and Experiment rows) |
| `tab` | `focus_next` | none |

#### CostBasisScreen — artboard CostBasis

`CostBasisScreen(ModalScreen[None])` in `tui/screens/results.py`, constructor `CostBasisScreen(template_sha: str, filters: ResultFilters | None)`, pushed by `b` from ResultsScreen (M02) or MeasurementsScreen. View model `tui/viewmodels/cost_basis.py`: `CostBasisVM {rows: list[BasisRowVM(result_id, model with ↓ for imported, cost text, basis text, coverage text, classes)], legend: list[tuple[str, str]]}`. The `#basis-legend` text describes the five basis labels and is static presentation.

| Item | Behavior |
|---|---|
| Load | `measurements.cost_bases(template_sha, filters)`. |
| Subscriptions | `results.result.sealed` and `results.import.registered` for the template and `measurements.configuration.aggregated` re-issue the query. |
| ContentSwitcher | `#basis-table` / `#basis-table-loading` / `#basis-table-empty` / `#basis-table-error`. |

| Binding | Action | API call |
|---|---|---|
| `esc` / `Button #close` | `dismiss(None)` | none |
| `tab / shift+tab` | `focus_next / previous` | none |
| `enter` | `open` | `dismiss(None)`, then push `MeasurementsScreen(row.result_id)`; enabled by `can_open` |
| `u` / `Currency and energy…` | `currency` | push `CurrencyEnergyScreen(mode="recorded", run_id=row.run_id)`; enabled by `can_currency` |

#### CurrencyEnergyScreen — artboard CurrencyEnergy

`CurrencyEnergyScreen(ModalScreen[AccountingDTO | None])` in `tui/screens/setup.py` (the wireframe's `Accounting` result type is `AccountingDTO`). Constructor `CurrencyEnergyScreen(mode: Literal["setup", "recorded"], initial: AccountingDTO | None = None, run_id: str | None = None)`. Like `WeightsScreen` (M06) it is a pure editor: in `setup` mode SetupScreen (M07) stores the returned value through its own configuration command; in `recorded` mode it shows the frozen values of a run read-only. View model `tui/viewmodels/currency_energy.py`:

```python
@dataclass(frozen=True)
class CurrencyEnergyVM:
    cop_enabled: bool; cop_rate: str; cop_as_of: str           # input text as typed or as recorded
    tariff_enabled: bool; tariff: str
    field_errors: dict[str, str]                               # field path -> engine message
    energy_scope: list[tuple[str, str]]                        # Measured, Not measured, Scope label, Concurrency, Provider cost
    energy_costs: list[tuple[str, str]] | None                 # recorded mode: per window, with coverage
    editable: bool; can_save: bool

def build_currency_energy_vm(src: AccountingPreview | AccountingView, inputs: Inputs | None) -> CurrencyEnergyVM
```

| Item | Behavior |
|---|---|
| Load | `setup`: `measurements.preview_accounting(<initial as draft>)`. `recorded`: `measurements.accounting(run_id)`. |
| Widgets | `Static #primary` (USD, fixed); `Vertical #cop` with `Checkbox #cop-enabled`, `Input #cop-rate`, `Input #cop-date`; `Static .notice.-warning` (historical README rate); `Vertical #tariff` with `Checkbox #tariff-enabled`, `Input #tariff-usd-kwh`; `Static #energy-scope .kv`; `.dialog-actions` with Cancel and `Button #save`. The two checkbox ids are additions; the wireframe leaves them unnamed. In `recorded` mode inputs are disabled and `#save` is hidden. |
| `Input.Changed`, `Checkbox.Changed` | `setup` only: debounced `measurements.preview_accounting` with the raw text of every input; issues set `Input.-invalid` on the named field. |
| ContentSwitcher | `#currency-energy` / `#currency-energy-loading` / `#currency-energy-error`. |

| Binding | Action | API call |
|---|---|---|
| `esc` / Cancel | `dismiss(None)` | none |
| `tab / shift+tab` | `focus_next / previous` | none |
| `ctrl+s` / `Button #save` | `save` | `measurements.validate_accounting(draft)`; on success `dismiss(AccountingDTO)`; `measurements.invalid_accounting` marks fields and stays open. `check_action` returns `True` or `None` (dimmed) from `capabilities.can_save` in `setup` mode and `None` in `recorded` mode. |

#### Screens owned elsewhere that consume M10

| Screen | Owner | Calls |
|---|---|---|
| ResultScreen, Outcomes tab (`#task-outcomes`, `#coverage`) | M02 | `measurements.result` for the measurement columns and coverage text, same formatting rules. |
| RankingsPane, ScoreBreakdownScreen | M06 | Cost and time arrive inside `scoring.*` responses, read by M06 through `MeasurementReader`. |
| Review detail, planning screens | M12, M16 | `measurements.invocation` for judging and planning cost, labelled as outside the benchmark. |

### 5. CLI

The source names no measurement command. Under the architecture rule that every API method is reachable from the CLI, the registry-generated `measurements` group exposes them; these are implementation-level commands owned by [M14](14-command-line-interface.md), not new product requirements.

| Command | Method |
|---|---|
| `axbenchmark measurements show RESULT_ID [--task ID] [--json]` | `measurements.result` (`--task`: `measurements.task`) |
| `axbenchmark measurements timing RUN_ID [--json]` | `measurements.timing` |
| `axbenchmark measurements cost-basis --template SHA [filters] [--json]` | `measurements.cost_bases` |
| `axbenchmark measurements accounting RUN_ID [--json]` | `measurements.accounting` |
| `axbenchmark measurements check-accounting [--cop-rate R --cop-as-of DATE] [--tariff USD_PER_KWH] [--json]` | `measurements.validate_accounting` |

Human output prints `—` for unknown, `?` for not exposed and `▲` for partial, with the basis column, exactly like the screens. Unattended runs carry accounting in the configuration YAML, which M07 validates through `AccountingValidation` at launch; `axbenchmark run --no-tui` streams `measurements.task.recorded` as progress lines.

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain (`tests/engine/measurements/domain/`) | Six cumulative reports plus a final total count once, from the final (702k / 44k); delta streams sum; mixed streams are partial; reasoning 17k inside output 44k is never added; unexposed cached is `UNKNOWN`/`not_exposed`, never 0. Reported cost wins and suppresses the estimate; estimate 702k × $0.25/M + 44k × $0.80/M = $0.21 exactly; missing rate or usage → `UNKNOWN`; subscription never zero. Halted run (R-0925b-2 shape): T5 partial, T6–T7 unknown, total partial 5 of 7. Benchmark elapsed sums task processes only; excluded phases and experiment duration stay separate, and four concurrent configurations give an experiment shorter than their summed elapsed. COP absent without a rate, conversion keeps basis and coverage; invalid accounting reports every field. Energy cost keeps scope, is never a configuration field, never added to provider cost. Property tests (hypothesis): fold is order-independent given `seq`; aggregate coverage is `COMPLETE` only if every task is; no input yields zero from `None`. |
| Use cases (`tests/engine/measurements/application/`) | Fakes for `MeasurementStore`, `ResultIndex`, `LaunchFacts`, `RunTimeline`, `CheckSummaries`, `EnergySource`, `EventSource`. Usage is appended before folding; non-final reports publish nothing; `ReconcileInterrupted` marks partial without filling; judging and planning accounts never enter aggregates; imported records are returned unchanged. |
| API (`tests/api/measurements/`) | `InProcessClient` against the composed engine with fake adapters and no interface: replay a canned `harness.*` / `runs.*` event script, then query `measurements.result`, `measurements.timing`, `measurements.cost_bases`; JSON round trips; decimal strings; typed error codes and field paths; registry kinds and `read` safety classes; JSON Schema snapshot; `import-linter` layer contracts. |
| Screens (`tests/tui/`) | View-model unit tests from canned responses for the five artboards (`—`, `?`, `▲`, basis text, compact `#accounting`). Textual `Pilot` against a fake client: each binding issues exactly the call in section 4; `t`, `b`, `u`, `enter` and Save follow capability flags; `recorded` mode cannot save; `measurements.invalid_accounting` marks the named input; errors render verbatim in `#…-error`; compact layout at 80×24; no screen imports `axbenchmark.engine`. |

Open questions for reconciliation (not product decisions):

1. Source of `VERIFIED_ZERO`. R101 and the CostBasis artboard ("$0 verified · local endpoint with no provider charge") need a verified zero, but no module states what verifies it. Proposed: a local `EndpointRef` with no provider in the frozen launch evidence, or a reported cost of exactly zero with complete coverage. To settle with M04, M06 and M07.
2. Settled: M06 reads `CostBasis` and `Coverage` from `MeasurementReader` (M06 `Measurement.basis` / `.coverage`); whether a partial measurement counts as missing for eligibility is M06's rule.
3. Settled: `harness.usage.reported` carries `final` (M05).
4. Which key on SetupScreen (M07) opens CurrencyEnergyScreen; the wireframe shows the dialog over Setup but `SETUP_KEYS` names no binding.
