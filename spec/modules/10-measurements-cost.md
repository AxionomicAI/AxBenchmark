# M10 — Execution measurements and cost accounting

Status: proposed contract, derived from [SPEC.md](../SPEC.md). This module defines measurement meaning and accounting boundaries; it does not claim an implementation exists.

M10 provides measured cost and time for comparisons following the repository README's methodology and presentation, alongside a separate quality assessment. Every result describes a complete harness/model/environment configuration, including its execution conditions. Measurements must not be presented as evidence of isolated model capability. Rankings may support different user priorities, but their quality component comes from independent judging. [R004]

## Inputs, outputs, and dependencies

| Boundary | Conceptual contract |
|---|---|
| Execution inputs | [M05](05-harness-execution-isolation.md) supplies task process observations and available harness/provider usage and cost reports. [M11](11-run-orchestration.md) supplies task/configuration identities, execution status, scheduling context, and phase timing. Observations must remain associated with the task and complete configuration they describe. [R004, R078, R079] |
| Accounting inputs | The price table snapshot recorded in the frozen launch evidence ([M07](07-run-configuration.md), prices from [M04](04-model-catalog.md) with source and retrieval date) supports estimates where usage is known. The same evidence records each account's billing kind (`api`, `subscription`, `local`, `unknown`) and whether it was read from the harness or declared by the user. The exchange-rate snapshot frozen at launch (M07; rates to USD that M04 collected during an explicit catalog refresh or that the user supplied, each with its source and date) covers every price currency, the display currency and the tariff currency. The display currency (default USD) and an optional electricity tariff (per kWh, with currency), both frozen with the run, are distinct inputs. [M18](18-hardware-monitoring.md) supplies energy observations with their actual scope and coverage, including each configuration's energy in its execution windows during sequential runs. No rate or complete measurement is assumed when absent. [R080, R081, R114, R147, R152] |
| Verification inputs | [M08](08-verification-evidence.md) supplies task verification results. M10 records them alongside execution status without deriving verification success from timing, token counts, or cost. Quality assessment belongs to [M12](12-quality-judging.md). [R004, R078] |
| Measurement outputs | Produce per-task records and configuration aggregates containing wall time, available input/cached/output/reasoning tokens, cost, verification results, and execution status. Each trial of a configuration is its own result with its own measurements; across the trials of one configuration, also provide the mean and the min–max range of cost and elapsed time. Include measurement source, coverage, and cost basis so [M02](02-retained-results-comparability.md), [M06](06-scoring-rankings.md), the TUI and CLI (as clients of the engine API), and the report can preserve their meaning. [R077, R078, R080, R081] |

## Collection and aggregation

Accept available measurements, associate them with the relevant task, and derive aggregates without double-counting cumulative events. A stream containing intermediate cumulative usage and a final total must not turn both into additional consumption. Retain the meaning of token categories: cached tokens may overlap input tokens, and reasoning tokens may overlap output tokens. Exposing those categories separately does not authorize adding them into an inflated total or charging for the same usage twice. This contract specifies the accounting outcome rather than a harness-specific reconciliation algorithm. [R078]

Benchmark elapsed time is the sum of task process durations for the configuration. Each duration includes the harness's tool work. Queueing, planning, external verification, and independent judging are excluded from benchmark elapsed time; report each of those phases and total experiment duration separately. The configuration's summed task durations and the experiment's overall duration are distinct measures, including when configurations run concurrently. A competitor performing its own tool-based testing remains within its task process duration. [R079]

Live output rates and context use shown while a task runs ([M15](15-terminal-interface.md)) are observation aids, not measurements of this module: they do not enter per-task records, aggregates, cost, elapsed time, or rankings, and a live stream count never replaces the harness's final usage report. [R044]

Missing observations must remain unknown; usable but incomplete observations remain partial. Display their source and coverage at task and aggregate levels, with an explanation such as "cost covers 6 of 7 tasks". An aggregate containing incomplete measurements cannot silently become a complete total. A partial measurement stays visible in every table with its value, coverage and explanation; whether it counts for a ranking is [M06](06-scoring-rankings.md)'s eligibility rule. Failure, interruption, or unavailable reporting does not justify replacing missing time, usage, or cost with zero, and recorded execution status remains visible alongside the measurements. [R078, R080, R147]

A trial mean and min–max range are taken over every trial of the configuration: when any trial's value is unknown the mean is unknown, and when any is partial the mean is partial, each with the trial it comes from named. Trial aggregates never fill or skip a missing trial. [R077, R078, R147, R154]

## Cost basis and currency

Prefer reported cost. When it is unavailable, including under subscription billing, calculate an explicitly labeled API-equivalent estimate only from known usage and the rates in the price table recorded at launch, labelled with its price source and retrieval date. Keep reported amounts and estimates identifiable, including their coverage; do not add an estimate to a reported amount covering the same usage. A configuration's cost is verified $0 only when the provider or harness reports $0, usage coverage is complete for every task, and the billing basis is known and is not a subscription. A subscription does not establish zero cost (a $0 reported under a subscription is treated as no reported cost), unknown billing does not establish zero cost (a $0 reported under unknown billing is likewise treated as no reported cost, so an API-equivalent estimate is computed where usage and prices allow), and missing pricing does not establish zero cost. If the available evidence supports only a partial estimate or no estimate, retain that limitation instead of inventing the missing usage or rate. [R078, R080]

The billing kind is the one frozen at launch from [M04](04-model-catalog.md): a user declaration for the account takes precedence over the harness reading, which takes precedence over unknown. Wherever a cost basis is shown, a billing kind declared by the user is labelled "declared by user", so a verified $0 or an estimate that rests on a declaration is identifiable as such. [R080]

Costs are computed, aggregated and ranked in USD. An API-equivalent estimate from a price published in another currency is converted price currency → USD with the run's frozen rate for that currency; without a frozen rate the estimate is unknown (no rate conversion) rather than computed with an assumed rate. Values are shown in the run's display currency (default USD), converted USD → display currency with the frozen rate for that currency; a missing rate leaves the converted value unknown (no rate conversion), never guessed, and the USD value remains available. Rates are never looked up during a run or while recording measurements, and the historical README exchange rate is never used. A converted value names the rate it used with that rate's source and date, and a supplied by user rate is labelled as such. Preserve cost basis and estimate labels wherever rankings could otherwise suggest equivalent accounting; currency conversion does not turn an estimate into a reported charge, change a cost basis, resolve incomplete coverage or change a ranking. [R080, R081]

An optional electricity tariff may produce a clearly labeled energy-cost estimate: measured kWh × tariff, converted to USD with the frozen rate for the tariff's currency (without that rate the estimate is unknown). Preserve the scope of the energy observation: CPU-package or GPU-only measurements cannot establish whole-system electricity cost, and the label says so. In sequential runs only, a configuration on a local endpoint (no API cost) takes the energy-cost estimate for its own execution windows as its cost, labelled "energy estimate" with its measurement scope (for example "GPU + CPU package · not whole-system"). In parallel runs shared experiment energy is never divided among configurations, so a local configuration's cost stays unknown; the experiment's energy estimate stays separate from every configuration. No tariff or no energy measurement also leaves a local configuration's cost unknown. Do not add energy charges to reported provider costs or to API-equivalent estimates. Partial or missing energy data remains partial or unknown in any associated estimate. [R110, R114, R147, R155]

The tariff frozen with the run is the original. A different tariff can be entered later in Results as an analysis setting: it recalculates energy-cost estimates for display and ranking as a labelled alternative, like alternative weights, with a reset to the original, and never changes the recorded run. Its currency converts to USD with the run's frozen rates; a currency the run has no rate for leaves the alternative estimate unknown (no rate conversion). [R096, R114]

The display currency is chosen before launch and cannot be changed afterwards: there is no analysis-time currency choice in Results, rankings ([M06](06-scoring-rankings.md)), measurements or the report ([M13](13-standalone-html-report.md)). Values from one run are shown in that run's frozen display currency. A comparison, ranking or report spanning runs whose frozen display currencies differ shows every value in USD and says so. [R081]

## Acceptance criteria

- A task and its aggregate expose every required measurement category, verification result, and execution status, with unavailable fields identifiable. Cumulative usage events and overlapping token categories never inflate usage or cost. [R078, R080, R147]
- A run containing queueing, planning, tool work, external checks, and judging includes only task process durations, with tool work, in benchmark elapsed time; excluded phases and total experiment duration remain separately inspectable. [R079]
- Reported cost takes precedence; known usage with the recorded price table produces an estimate labelled with its price source and date, also under subscription billing. Verified $0 requires a reported $0, complete coverage for every task and billing known not to be a subscription. Subscription, unknown billing, absent pricing, and incomplete usage cases never manufacture zero or complete cost. A billing kind declared by the user is labelled "declared by user" beside every cost basis that depends on it. [R080, R147, R152]
- Three trials of one configuration produce three results with their own measurements, plus a mean and min–max of cost and time; a trial with partial cost makes the mean partial and a trial with unknown cost makes it unknown, naming that trial. [R077, R078, R147, R154]
- Costs are computed and ranked in USD. A price in another currency converts to USD only with the run's frozen rate, otherwise its estimate is unknown with no rate conversion. Values in the display currency use only the frozen rate, a missing rate leaves them unknown, and the historical README rate is never used. No query, screen or command offers a display currency other than the run's frozen one; a comparison of runs with different frozen display currencies shows USD with a notice saying so. Ranking presentations retain accounting bases and estimate labels. [R081]
- Optional tariff estimates preserve measurement scope. A local configuration in a sequential run has an "energy estimate" cost with scope; in a parallel run its cost is unknown. Shared energy is not allocated to concurrent configurations, package/GPU readings do not imply whole-system cost, and provider charges do not receive energy additions. A tariff changed in Results is labelled alternative, converts with the run's frozen rates and leaves the recorded run unchanged. [R110, R114, R147]
- Comparison consumers retain full configuration context and the distinction between measured execution statistics and independent quality assessment. [R004]

## Implementation

Implementation decisions under [the architecture decision](ARCHITECTURE.md). They fix where the accounting rules above run and how interfaces reach them; they add no product behavior. File names, token-count formatting and debounce intervals are engineering defaults, not product requirements.

### 1. Engine component

Package `axbenchmark.engine.measurements`. M10 turns execution observations into retained measurement records and serves them, with their source, coverage and cost basis, to every consumer. It is the only code that folds usage, picks a cost basis, sums task durations, converts currency or prices energy. Interfaces, M06 and M13 receive the results; none of them recomputes a total, a basis or a coverage state.

#### Domain (`engine/measurements/domain/`, no I/O)

Money is `decimal.Decimal`. Every stored amount, aggregate, trial summary and ranking value is in USD; amounts in the display currency are derived on read and never stored. A conversion divides or multiplies by a rate in the decimal context's 28 significant digits; amounts are rounded only for display. Currency codes are ISO 4217 (`CurrencyCode`). Token counts are `int`; durations are integer milliseconds. Floats never appear in the domain.

| Type / function | Contents |
|---|---|
| `Coverage` | Enum `COMPLETE`, `PARTIAL`, `UNKNOWN`. [R078, R147] |
| `Limitation` | `code` and detail: `not_exposed` (the harness version does not report the category), `not_observed` (no observation, e.g. task never ran), `final_total_missing`, `no_rate`, `no_usage`, `no_cache_discount`, `no_rate_conversion` (no frozen exchange rate for the price, display or tariff currency involved; detail names the currency), `subscription_billing`, `subscription_zero_ignored` (a $0 reported under a subscription), `billing_unknown`, `unknown_billing_zero_ignored` (a $0 reported under unknown billing), `interrupted`, `mixed_usage_stream`, `local_endpoint` (no API cost), `parallel_energy_shared`, `no_tariff`, `no_energy`. |
| `Measured[T]` | `value: T \| None`, `coverage`, `source` (`harness`, `provider`, `engine_clock`, `estimate`, `imported`), `limitations: tuple[Limitation, ...]`. Invariant: `coverage is UNKNOWN` ⇔ `value is None`; no constructor or operation turns `None` into zero. [R078, R147] |
| `TokenUsage` | `input`, `cached`, `output`, `reasoning: Measured[int]`. `cached` is a subset of `input` and `reasoning` a subset of `output`; the type has no total-tokens field and no operation adds categories together. [R078] |
| `UsageReport` | One `harness.usage.reported` observation: `seq`, the four categories (each `int \| None`), `reported_cost: Decimal \| None`, `cumulative: bool`, `final: bool`. |
| `fold_usage(reports, exposure) -> UsageFold` | Cumulative reports replace earlier cumulative values per category (counted once, from the latest); delta reports are summed. A stream mixing both kinds for one invocation keeps only what can be counted once and is `PARTIAL` with `mixed_usage_stream`. Coverage is `COMPLETE` only when a final report arrived, `PARTIAL` when only intermediate reports arrived, `UNKNOWN` when none did. A category the adapter's `ExposureProfile` does not expose is `UNKNOWN` with `not_exposed`. Reported cost folds by the same rule. Records `report_count`, `cumulative_count`, `counted_from` (`final_total`, `sum_of_deltas`). [R078] |
| `Pricing` | From the `PriceSnapshot` M07 froze in the launch record, which carries M04's `Pricing`: `price_in`, `price_out` per million tokens (M04 `input_per_mtok`, `output_per_mtok`; `Decimal \| None`), `provider`, `source_layer` (`discovered`, `bundled`, `override`, `unknown`), `source_url`, `retrieved_at`, `currency: CurrencyCode` (M04's `Pricing.currency`). Never read from the live catalog. An override set to `unknown` (M04) gives no rate. Estimates are computed in the price currency and converted to USD with `to_usd` and the run's frozen `FrozenRates`: a USD price needs no rate; a price in any other currency without a frozen rate gives `UNKNOWN` with `no_rate_conversion`. No other exchange rate is ever looked up or assumed. [R080, R081] The estimate does not use M04's optional cached-input and reasoning rates: it never applies a cache discount and carries `no_cache_discount` when cached tokens are reported or unexposed. |
| `Billing` | `kind`: `API`, `SUBSCRIPTION`, `LOCAL` (local endpoint, no provider charge), `UNKNOWN`; `source`: `OVERRIDE` (declared by the user in M04's catalog), `DISCOVERED` (read by M05's probe from the harness's status output), `ENDPOINT` (a local endpoint), `UNKNOWN`. Both from the frozen launch record (M04's `SelectionEvidence.billing`, copied into M07's `PriceSnapshot` as `billing` and `billing_source`); M04 applies the precedence override > discovered > unknown, M10 never re-resolves it. `label()` gives the engine text in M04's form, e.g. "subscription · declared by user"; a declared kind always carries "declared by user". `UNKNOWN` never yields `VERIFIED_ZERO` and adds `billing_unknown`. [R080] |
| `ConversionRate` | `currency: CurrencyCode`, `per_usd: Decimal` (units of the currency for 1 USD, e.g. COP 4,050), `source` (`DISCOVERED`: collected by M04's `ExchangeRateSource` during a catalog refresh; `OVERRIDE`: supplied by the user in the catalog), `source_url \| None`, `retrieved_at`, `label()` ("1 USD = 4,050 COP · open.er-api.com, 2026-09-28" or "1 USD = 4,050 COP · supplied by user"). [R081] |
| `FrozenRates` | Mapping `CurrencyCode → ConversionRate`, built from the `RateSnapshot` M07 froze at launch (a `RateRow` for every price currency, the display currency and the tariff currency as M04 held them at launch, or `MissingRate`), plus the frozen `display_currency`. USD is implicit with `per_usd = 1` and never needs a rate. It is the only rate source for every conversion of the run, including an alternative tariff; it has no operation that adds or replaces a rate. No constant rate exists in the package; the README's historical rate exists nowhere in code. [R081] |
| `to_usd(amount, currency, rates) -> Measured[Decimal]` / `to_display(amount_usd, currency, rates) -> Measured[Decimal]` | Price currency → USD (`amount / per_usd`) and USD → display currency (`amount × per_usd`). The result keeps the source's basis, coverage and limitations and records the `ConversionRate` it used (`RateUse`: currency, `per_usd`, source, date). A missing rate gives `UNKNOWN` with `no_rate_conversion` naming the currency; no conversion turns `None` into a value or changes a basis. [R081] |
| `CostBasis` | Enum `REPORTED`, `ESTIMATE` (API-equivalent), `VERIFIED_ZERO`, `ENERGY_ESTIMATE` (configuration level only), `UNKNOWN`; aggregates add `MIXED`. [R080, R114] |
| `TaskCost` | `amount: Measured[Decimal]`, `basis`, `estimate_terms: tuple[EstimateTerm, ...]` (`tokens`, `rate`, `amount` per category charged), `price_source: PriceSource \| None` (`source_layer`, `source_url`, `retrieved_at`) on every estimate, `conversion: RateUse \| None` (the frozen rate that converted a non-USD price; estimate terms keep the price currency), `billing: Billing` (kind and source, so a declared kind is labelled wherever the basis is shown). Amounts are USD. |
| `cost_for_task(fold, pricing, billing, rates) -> TaskCost` | `LOCAL` → `UNKNOWN` with `local_endpoint`; the configuration's cost comes from `configuration_cost`. A reported $0 under `SUBSCRIPTION` is dropped as a charge (`subscription_zero_ignored`), and under `UNKNOWN` billing likewise (`unknown_billing_zero_ignored`). Remaining reported cost present → `REPORTED` with the fold's coverage, and no estimate is computed for the same usage; a reported $0 with complete coverage and `API` billing (discovered or declared) → `VERIFIED_ZERO` with amount 0. Otherwise input and output usage known and both rates known → `ESTIMATE` = input × `price_in` + output × `price_out` in the price currency (cached and reasoning are subsets, never charged again), converted with `to_usd(…, pricing.currency, rates)`, coverage from the fold, with its `price_source` and `conversion`. Missing rate or usage → `UNKNOWN` with `no_rate` / `no_usage`; no frozen exchange rate for a non-USD price → `UNKNOWN` with `no_rate_conversion`. `SUBSCRIPTION` always adds `subscription_billing` and `UNKNOWN` billing `billing_unknown`; neither ever yields zero. [R080, R081, R147] |
| `TaskTime` | `Measured[int]` process duration from `harness.task.exited` (start to exit, tool work included). A task whose engine died before exit is `PARTIAL` with `interrupted`, measured to the last observation. A task that never started is `UNKNOWN` with `not_observed`. [R079] |
| `ProcessOutcome`, `CheckSummary` | Recorded as received from [M05](05-harness-execution-isolation.md) / [M11](11-run-orchestration.md) and [M08](08-verification-evidence.md) (status label, exit classification; passed, failed, unverified, not run counts). No function in this package derives either from time, tokens or cost. [R004, R078] |
| `TaskMeasurement` | `scope` (run, configuration, task id, title, index), `process`, `checks`, `usage: TokenUsage`, `time: TaskTime`, `cost: TaskCost`, `fold` facts, `limitations`. |
| `aggregate(tasks, expected) -> ConfigurationAggregate` | Per category: sum of known values; `COMPLETE` only when every expected task is complete for that category, `UNKNOWN` when none is known, else `PARTIAL`, with `covered: int` of `expected: int` and an explanation ("cost covers 6 of 7 tasks"). Cost: `VERIFIED_ZERO` only when every expected task is `VERIFIED_ZERO`; a mix of `VERIFIED_ZERO` and `REPORTED` is `REPORTED`; otherwise one basis when all tasks share it, else `MIXED` with `by_basis: Mapping[CostBasis, Decimal]` so reported amounts and estimates stay identifiable. Never adds an estimate and a reported amount for the same task. [R078, R080, R147] |
| `configuration_cost(aggregate, billing, energy, scheduling) -> ConfigurationCost` | For `API` and `SUBSCRIPTION` billing: the aggregate's cost unchanged. For `LOCAL`: `ENERGY_ESTIMATE` from the configuration's `EnergyCost` when the run was sequential (`jobs == 1`), a tariff is set and window energy exists, with the energy's coverage and scope label; `UNKNOWN` with `parallel_energy_shared`, `no_tariff` or `no_energy` otherwise. Energy is never added to a provider amount or an API-equivalent estimate. [R110, R114, R147] |
| `TrialSummary` | Per configuration of a run: `trials: tuple[(trial_index, result_id, time, cost)]`, `mean_time`, `mean_cost: Measured[Decimal]` with basis (`MIXED` when trials differ; `VERIFIED_ZERO` only when every trial is), `range_time`, `range_cost: (min, max) \| None`, `limiting_trials` (indexes whose value is partial or unknown). |
| `summarize_trials(per_trial) -> TrialSummary` | Mean and min–max over every trial: `UNKNOWN` when any trial's value is unknown, `PARTIAL` when any is partial, else `COMPLETE`. No missing trial is filled, skipped or counted as zero. This is the single cost and time trial rule; M06's `trial_summary` takes cost and time from it and adds quality. [R077, R078, R147] |
| `PhaseKind` | `QUEUE`, `PLANNING`, `VERIFICATION`, `JUDGING`, each with its intervals; plus `TASK_PROCESS`. |
| `RunTiming` | Per configuration: `benchmark_elapsed = Σ TaskTime` (only task processes), and each excluded phase as its own `Measured[int]`; run-level `experiment: Measured[int]` = clock time from launch to the end of the last phase. No function adds an excluded phase to benchmark elapsed, and the experiment duration is never derived from the sum of configurations. [R079] |
| `Tariff` | `per_kwh: Decimal`, `currency: CurrencyCode` (any ISO 4217 code). Converted to USD with `to_usd` and the run's `FrozenRates`, for the recorded tariff and an alternative tariff alike. |
| `Accounting` | `display_currency: CurrencyCode` (default `USD`), `tariff: Tariff \| None`. The exchange rates themselves are not part of `Accounting`: they come from M04 and are frozen by M07 as the run's `RateSnapshot`. [R081, R114] |
| `validate_accounting(draft) -> Accounting` | Raises `InvalidAccounting(issues)` listing every issue: `not_a_number`, `nonfinite`, `not_positive`, `missing_tariff` (tariff enabled without an amount), `unsupported_currency` (not an ISO 4217 code, for `display_currency` or `tariff_currency`). Invalid input is never replaced. A currency without a current rate is not an issue: `rate_notices(accounting, rates)` reports it as a `no_rate_conversion` notice, and the affected converted values are unknown. [R081, R114] |
| `TariffChoice` | `ORIGINAL` (the frozen tariff) or `ALTERNATIVE(Tariff)` (analysis setting from Results, rankings or the report). Every value derived from an alternative carries `alternative=True`; nothing derived from it is stored. There is no corresponding currency choice: the display currency is always the run's frozen one. [R081, R096, R114] |
| `display_currency_for(runs) -> CurrencyCode` | The currency a multi-run view (cost-basis list, results, rankings, report) shows: the frozen display currency shared by every run, or `USD` with notice `measurements.mixed_display_currency` when the runs froze different ones. A single-run view always uses its run's frozen display currency. [R081] |
| `EnergyCost` | `energy_kwh: Measured[Decimal]`, `scope` (M18's scope label and measured / not-measured domains), `window` (`EXPERIMENT`, or `SEQUENTIAL_WINDOW(configuration_id, trial_index)` with `includes_background=True`), `tariff`, `usd: Measured[Decimal]`, `conversion: RateUse \| None`, `alternative: bool`, basis always an estimate. [R114, R147] |
| `energy_cost(observation, tariff, rates) -> EnergyCost` | kWh × tariff in the tariff currency, converted with `to_usd` (`UNKNOWN` with `no_rate_conversion` when the tariff currency has no rate), coverage and scope carried from the observation. Experiment-window energy is never allocated to a configuration; only a `SEQUENTIAL_WINDOW` observation, which M18 provides only for `jobs == 1` runs, can feed `configuration_cost`. No function adds energy cost to a provider cost. [R110, R114, R147] |
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
    async def list(self, template_sha: str, filters: ResultFilter) -> Sequence[ResultRef]: ...   # M02's domain ResultFilter

class LaunchFacts(Protocol):            # M07 frozen launch record, via M11
    async def configuration(self, run_id: str, configuration_id: str) -> ConfigurationFacts: ...
    # ConfigurationFacts: task ids and titles in order, Pricing from the PriceSnapshot, Billing (kind and source),
    # ExposureProfile.usage, trial_count, scheduling jobs
    async def accounting(self, run_id: str) -> Accounting: ...      # display currency and tariff
    async def rates(self, run_id: str) -> FrozenRates: ...              # the frozen RateSnapshot

class CurrentRates(Protocol):           # over M04's ExchangeRates.snapshot (stored table and supplied rates; never fetches); setup preview only
    async def current(self, currencies: Sequence[CurrencyCode]) -> Mapping[CurrencyCode, ConversionRate]: ...   # absent when no rate

class RunTimeline(Protocol):            # M11 application interface
    async def intervals(self, run_id: str) -> Timeline: ...       # phase intervals per configuration, launch and end times, jobs

class CheckSummaries(Protocol):         # adapter over M02's RetainedResultReader (check outcomes M08 recorded)
    async def for_configuration(self, run_id: str, configuration_id: str) -> Mapping[str, CheckSummary]: ...

class EnergySource(Protocol):           # M18 application interface
    async def observations(self, run_id: str) -> Sequence[EnergyObservation]: ...          # experiment window
    async def window_energy(self, run_id: str) -> Sequence[WindowEnergyObservation]: ...   # per configuration and trial, jobs == 1 only; empty otherwise
    async def host_scope(self) -> EnergyScope: ...
```

Plus the shared `EventPublisher`, `EventSource` (in-engine subscription to other modules' events) and `Clock`.

#### Application (`engine/measurements/application/`)

| Use case | Trigger | Steps |
|---|---|---|
| `RecordUsage` | `harness.usage.reported` (any role) | `append_usage` to the invocation's usage log before anything else. No total is published from a non-final report. [R044, R078] |
| `FinalizeTask` | `harness.task.exited` for a `TaskScope` | Load usage, `fold_usage`, `cost_for_task` with `LaunchFacts` (pricing, billing and the frozen `FrozenRates`), take the duration from the exit, attach the process outcome; `save_task`; publish `measurements.task.recorded` and `measurements.configuration.aggregated`. |
| `RecordChecks` | `verification.task.completed` (counts by status and cause) | Update the task record's `CheckSummary` only; publish `measurements.task.recorded`. |
| `RecordPhase` | `run.phase.started` / `run.phase.finished`, `run.state.changed` | Publish `measurements.timing.updated`; timing itself is read from `RunTimeline` on query, so M10 stores no duplicate clock. [R079] |
| `FinalizeInvocation` | `harness.task.exited` for a `JudgingScope` or `PlanningScope` | Fold and cost as above into an `InvocationAccount`; `save_invocation`; publish `measurements.invocation.recorded`. [R082] |
| `ReconcileInterrupted` | `run.state.changed` with `outcome: interrupted` (engine restart) | For each started task without an exit: record `PARTIAL` time to the last observation and partial usage, `interrupted`. Never resumes or fills in values. |
| `PriceEnergy` | `run.state.changed` with `state: ended` | If the frozen accounting has a tariff, `energy_cost` with the frozen `FrozenRates` for each M18 experiment observation and each sequential window observation; `save_energy`. Window energy is kept as kWh even without a tariff, so an analysis tariff can price it later. |
| `GetResultMeasurements` | `measurements.result` | Resolve the result, load task records, `aggregate`, `configuration_cost` with the frozen or the requested alternative tariff, `summarize_trials` over the configuration's trial results, timing from `RunTimeline` (local results) or the record (imported), then `to_display` for every money value with the run's frozen display currency and `FrozenRates`, capabilities. |
| `ExplainTask` | `measurements.task` | One task's fold facts, estimate terms in the price currency, the conversion rate used, price source, billing kind and source (with the "declared by user" label), time window and limitations. |
| `GetRunTiming` | `measurements.timing` | `RunTimeline` + task records → `RunTiming` with intervals. |
| `ListCostBases` | `measurements.cost_bases` | `ResultIndex.list`, `configuration_cost` per result (frozen or alternative tariff), the same rule `CostAnalysis.ranking_cost` applies; `display_currency_for` the listed runs, each row converted with its own run's `FrozenRates` (USD needs no rate). |
| `GetTrials` | `measurements.trials` | `summarize_trials` for one configuration of a run, then `to_display` with the run's frozen display currency. |
| `GetAccounting` | `measurements.accounting` | Recorded accounting (display currency, tariff), the frozen `FrozenRates` with the `MissingRate` currencies, and energy costs of a run, read-only; with an alternative tariff, also the energy costs recalculated with the frozen rates, labelled alternative. |
| `PreviewAccounting`, `ValidateAccounting` | `measurements.preview_accounting`, `measurements.validate_accounting` | `validate_accounting` plus `EnergySource.host_scope` and `CurrentRates.current` for the display and tariff currencies (with `rate_notices`); preview returns issues as data, validate raises. M07 calls `ValidateAccounting` through the in-engine `AccountingValidation` Protocol when saving or launching, so the same rules apply to CLI configs. |
| `GetInvocationAccount` | `measurements.invocation` | Load one judging or planning account. |

Application Protocols exposed to other modules: `MeasurementReader` (per-result `ConfigurationAggregate`, `TaskMeasurement`s, `RunTiming`, `trial_summary(run_id, configuration_id, tariff: Tariff \| None = None) -> TrialSummary` over each trial's `ranking_cost` and elapsed time, energy costs, `rates(run_id) -> FrozenRates`) for [M02](02-retained-results-comparability.md), [M06](06-scoring-rankings.md), [M13](13-standalone-html-report.md), [M17](17-zip-exchange.md) and [M18](18-hardware-monitoring.md); `CostAnalysis.ranking_cost(result, tariff: Tariff \| None, display_currency: CurrencyCode \| None = None) -> CostObservation` (`configuration_cost` under the recorded tariff when `tariff` is `None`, otherwise under the analysis tariff labelled alternative; the USD amount that rankings use, basis, coverage, price source or energy scope, billing kind and source with its label, and `display: Measured[Decimal]` with the `RateUse` it came from, in the run's frozen display currency; `display_currency` is not a user choice: callers pass only `USD`, the value `display_currency_for` gives a multi-run view whose runs froze different currencies), `display_currency_for(runs)`, and `validate_tariff(draft) -> Tariff` (raises `InvalidAccounting`) for M02, M06 and M13; `AccountingValidation` for [M07](07-run-configuration.md); `MeasurementSummary.for_configuration(run_id, configuration_id, trial_index) -> (elapsed, cost)` (each with basis and coverage) for [M11](11-run-orchestration.md) lanes and `runs.status`; `JudgingCostAccounting` (`measure(invocation_id) -> InvocationAccount`, `estimate(selection, result_id) -> CostDTO` from frozen `Pricing`, unknown when no rate exists) for [M12](12-quality-judging.md).

#### Adapters (`engine/measurements/adapters/`)

| Adapter | Implements |
|---|---|
| `json_store.py` | `MeasurementStore` as files in directories handed over by M11 / M02 / M12 / M16 (see Persisted state). Writes are atomic (temp file + rename). |
| `results_index.py`, `launch_facts.py`, `timeline.py`, `checks.py`, `energy.py`, `current_rates.py` | The ports above over the M02, M07/M11, M11, M08, M18 and M04 application interfaces. `launch_facts.py` maps M07's `PriceSnapshot` (billing kind and source) and `RateSnapshot`; for an imported result the same files come from its package. `current_rates.py` reads M04's cached rate table and never triggers a refresh. |
| `event_wiring.py` | Subscribes the trigger use cases to `harness.*`, `runs.*` and `verification.*` events at composition time. |
| `rpc.py` | `measurements.*` methods: DTO ↔ domain. Decimal amounts travel as decimal strings plus a float for sorting; accounting inputs arrive as `str \| None` so unparsable text reaches the domain and returns as `measurements.invalid_accounting` with a field path. Registers the topic snapshot provider for `measurements.*` events with M11's subscription service. |

#### Persisted state

M10 writes only into directories its callers hand it.

| Path | Content |
|---|---|
| `<configuration dir>/tasks/<task_id>/usage.jsonl` | Usage reports as received, append-only, with `seq`. Written before any fold. |
| `<configuration dir>/tasks/<task_id>/measurements.json` | `TaskMeasurement` (schema-versioned). |
| `<run dir>/energy-cost.json` | Original `EnergyCost` records (experiment and sequential windows) from the frozen tariff, only when a tariff was recorded. Alternative tariffs are computed on read and never written. |
| `<invocation dir>/usage.jsonl`, `<invocation dir>/measurements.json` | Judging and planning accounts, in the directories M12 and M16 allocate. |

Configuration aggregates, configuration cost, trial summaries and run timing are derived on read and never stored, so they cannot diverge from task records. Imported results carry the same files from their package; M10 reads them through `ResultIndex` and never recomputes or upgrades them (an imported estimate stays an estimate; source `imported`). Accounting inputs (display currency, tariff) and the `RateSnapshot` are part of the launch record frozen by M07, not of M10's files; result ZIPs carry it with the rest of the frozen launch record ([M17](17-zip-exchange.md)), so an imported result converts with the rates and display currency its own run recorded. Amounts in the display currency and anything derived from an analysis tariff are computed on read and never written.

#### Owned processes

None. M10 runs inside `axbenchmarkd` and reacts to events; it starts no subprocess.

### 2. API surface (`measurements.*`)

Common DTO: `MeasuredDTO = {value: str | int | None, sort: float | None, coverage: "complete" | "partial" | "unknown", source, limitations: list[{code, message}], explanation: str | None}` (`explanation` is the engine's coverage text, e.g. "cost covers 6 of 7 tasks"). Money values are USD decimal strings; `display: MeasuredDTO | None` sits beside each money value when the display currency in effect is not USD (unknown with `no_rate_conversion` when that currency has no frozen rate). The display currency in effect is the run's frozen one, or USD for a multi-run view whose runs froze different ones; no query accepts a display currency or an exchange rate. `RateUseDTO = {currency, per_usd: str, source: "discovered" | "override", source_url: str | None, retrieved_at: str | None, label}` (`label` is engine text, e.g. "1 USD = 4,050 COP · open.er-api.com, 2026-09-28" or "1 USD = 4,050 COP · supplied by user"). `TariffDTO = {per_kwh: str, currency: str}` (ISO 4217). Billing travels as M04's `BillingDTO` (`kind`, `source`, `declared_by_user`, `label`, e.g. "subscription · declared by user"), built from the frozen `PriceSnapshot`. Queries that price energy accept `tariff?: TariffDTO`: absent means the frozen tariff; present means an alternative analysis tariff, converted to USD with the run's frozen rates, and every value derived from it carries `alternative: true`.

#### Queries (safety `read`)

| Method | Request | Response | Errors | Capabilities |
|---|---|---|---|---|
| `measurements.result` | `result_id`, `tariff?` | `ResultMeasurements` | `measurements.unknown_result`, `measurements.record_unreadable`, `measurements.invalid_accounting` (analysis tariff) | `can_timing`, `can_cost_basis`, `can_accounting`, per row `can_open_task`, each with `reason` |
| `measurements.task` | `result_id`, `task_id` | `TaskFormation` | `measurements.unknown_result`, `measurements.unknown_task`, `measurements.record_unreadable` | — |
| `measurements.timing` | `run_id` | `RunTimingView` | `measurements.unknown_run` | per row `can_open` |
| `measurements.cost_bases` | `template_sha`, `filters: ResultFilters` (M02), `tariff?` | `CostBasisTable` | `measurements.unknown_template`, `measurements.invalid_accounting` (analysis tariff) | per row `can_open`, `can_accounting` |
| `measurements.trials` | `run_id`, `configuration_id`, `tariff?` | `TrialSummaryDTO` | `measurements.unknown_run`, `measurements.unknown_configuration`, `measurements.invalid_accounting` (analysis tariff) | per trial `can_open` |
| `measurements.accounting` | `run_id`, `tariff?` | `AccountingView` | `measurements.unknown_run`, `measurements.invalid_accounting` (alternative tariff) | `editable: false`, `reason: "measurements.frozen_at_launch"`; `can_alternative_tariff` |
| `measurements.preview_accounting` | `AccountingDraft {display_currency: str \| None, tariff_enabled: bool, tariff_per_kwh: str \| None, tariff_currency: str \| None}` (`display_currency` absent means `USD`) | `AccountingPreview` (issues are data here) | — | `can_save` |
| `measurements.validate_accounting` | `AccountingDraft` | `AccountingDTO {display_currency, tariff: TariffDTO \| None}` | `measurements.invalid_accounting` (field paths `display_currency`, `tariff_per_kwh`, `tariff_currency`) | — |
| `measurements.invocation` | `invocation_id` | `InvocationAccountDTO {invocation_id, role, usage: TokenUsageDTO, cost: CostDTO}` | `measurements.unknown_invocation` | — |

Commands: none. Recording is driven by engine events, and accounting inputs are stored by M07 with the configuration. Jobs: none; every query reads stored records.

Response models (`axbenchmark.api.measurements`):

| Model | Fields |
|---|---|
| `ResultMeasurements` | `result_id`, `run_id`, `configuration_id`, `origin` (local, imported), `header {machine, run, harness, model, effort, environment_policy, jobs, template_sha, status, failed_at, trial_index, trial_count}`, `live: bool` (run still active), `tasks: list[TaskRowDTO]`, `total: TotalRowDTO`, `configuration_cost: CostDTO` (equals `total.cost` except for local endpoints), `trials: TrialSummaryDTO \| None` (when `trial_count > 1`), `phases: PhasesDTO`, `halt: HaltDTO \| None`, `sources: SourcesDTO`, `currency {computed_in: "USD", display_currency (the run's frozen one), rates: list[RateUseDTO] (the frozen rates for the price, display and tariff currencies), missing_rates: list[str], tariff: TariffDTO \| None, tariff_alternative: bool}`, `notices: list[NoticeDTO]`, `capabilities` |
| `TaskRowDTO` | `task_id`, `index`, `title`, `process {status, label}` (e.g. `exit 0`, `auth 401`, `not run`), `checks {passed, failed, unverified, not_run}`, `time`, `input`, `cached`, `output`, `reasoning: MeasuredDTO`, `cost: CostDTO`, `can_open_task` |
| `CostDTO` | `amount: MeasuredDTO`, `basis` (`reported`, `estimate`, `verified_zero`, `energy_estimate`, `unknown`, `mixed`), `basis_label` (engine text, e.g. "estimate · prices from openai.com/api/pricing, 2026-09-28", "verified $0 · api · declared by user", "energy estimate · GPU + CPU package · not whole-system"), `price_source: {source_layer, source_url, retrieved_at} \| None`, `energy_scope: str \| None`, `alternative: bool`, `by_basis: dict[str, str] \| None`, `billing: BillingDTO \| None` (the configuration's billing kind and source; a declared kind's "declared by user" also appears in `basis_label`), `conversion: RateUseDTO \| None` (the frozen rate that converted a non-USD price or tariff to USD), `display: MeasuredDTO \| None` with `display_rate: RateUseDTO \| None` |
| `TrialSummaryDTO` | `run_id`, `configuration_id`, `trial_count`, `trials: list[{trial_index, result_id, time: MeasuredDTO, cost: CostDTO, can_open}]`, `mean_time: MeasuredDTO`, `mean_cost: CostDTO`, `range_time`, `range_cost: {min, max} \| None`, `limiting_trials` |
| `TotalRowDTO` | As `TaskRowDTO` without `task_id`, plus `covered`, `expected`, `status` (configuration outcome from M11) |
| `PhasesDTO` | `benchmark_elapsed: MeasuredDTO`, `task_count`, `queue`, `planning`, `verification`, `judging: MeasuredDTO` (`planning` carries `not_observed` with reason `built_in_template` when no planning ran), `experiment: MeasuredDTO`, `configurations_in_run`, `jobs` |
| `HaltDTO` | `code` (e.g. `harness.auth_failed`), `message`, `at`, `task_id`, `last_usage_at` |
| `SourcesDTO` | `cost_source {harness, version, basis}`, `token_source`, `coverage_by_task: list[{task_id, coverage}]`, `status_label` |
| `NoticeDTO` | `code`, `severity`, `message`; codes include `measurements.overlapping_categories`, `measurements.partial_total`, `measurements.no_cache_discount`, `measurements.subscription_billing`, `measurements.mixed_basis`, `measurements.energy_cost_basis`, `measurements.parallel_energy_shared`, `measurements.alternative_tariff`, `measurements.no_rate_conversion` (names the currency), `measurements.declared_billing` (names the accounts whose billing kind is declared by user), `measurements.billing_unknown`, `measurements.mixed_display_currency` (the runs shown froze different display currencies, so values are in USD) |
| `TaskFormation` | `task_id`, `title`, `usage_reports {count, cumulative_count, final_present, counted_from}`, `usage: TokenUsageDTO`, `reasoning_within_output: bool`, `cached_exposed: bool`, `harness_version`, `reported_cost: MeasuredDTO`, `estimate: {currency, terms: list[{category, tokens, rate_per_million, amount}], amount, conversion: RateUseDTO \| None, amount_usd} \| None` (terms in the price currency), `rates {provider, source_layer, source_url, retrieved_at} \| None`, `billing: BillingDTO`, `time {value_ms, started_at, ended_at, includes_tool_work: true}`, `limitations` |
| `RunTimingView` | `run_id`, `template {label, sha}`, `machine`, `launched_at`, `jobs`, `live`, `configurations: list[{result_id, configuration_id, harness, model, effort, benchmark_elapsed, queue, planning, verification, judging: MeasuredDTO, status, intervals: list[{kind, start_ms, end_ms, task_id}], can_open}]`, `sum_row`, `judging_intervals`, `experiment: MeasuredDTO`, `notices` (e.g. `measurements.no_queue`, `measurements.no_planning`, `measurements.concurrent_overlap`) |
| `CostBasisTable` | `template_sha`, `tariff_alternative: bool`, `display_currency: str` (from `display_currency_for`: the frozen display currency shared by every row's run, or `USD` with notice `measurements.mixed_display_currency` when the runs froze different ones), `notices`, `rows: list[{result_id, run_id, origin, harness, model, trial_index, trial_count, cost: CostDTO (with billing; converted with the row's own run's frozen rates), coverage_detail {covered, expected, missing_task_ids, explanation}, limitations, can_open, can_accounting}]` |
| `AccountingView` | `run_id`, `accounting: AccountingDTO` (frozen display currency and tariff), `recorded_rates: list[RateUseDTO & {uses: list["price" \| "display" \| "tariff"]}]` (the frozen `RateSnapshot`), `missing_rates: list[{currency, uses}]` (M07's `MissingRate` rows), `tariff_used: TariffDTO \| None`, `tariff_alternative: bool`, `energy: list[EnergyCostDTO {window, configuration_id, trial_index, includes_background, energy_kwh, usd: MeasuredDTO, display: MeasuredDTO \| None, conversion: RateUseDTO \| None, alternative, scope {label, measured, not_measured, source, requires}}]`, `capabilities` |
| `AccountingPreview` | `issues: list[{field, reason, message}]`, `accounting: AccountingDTO \| None`, `currency_options: list[str]` (ISO 4217 codes, those with a current rate first), `current_rates: list[RateUseDTO]` (display and tariff currencies, from M04's table with source, date and "supplied by user" where applicable; read-only here, supplied in M04's catalog, frozen at launch by M07), `notices: list[NoticeDTO]` (`measurements.no_rate_conversion` per currency without a rate, `measurements.historical_rate_unused`), `energy_scope {label, measured, not_measured, source, requires}`, `capabilities {can_save}` |

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
| `measurements.unknown_result`, `measurements.unknown_task`, `measurements.unknown_run`, `measurements.unknown_configuration`, `measurements.unknown_template`, `measurements.unknown_invocation` | The target does not exist. |
| `measurements.record_unreadable` | A stored usage log or record cannot be parsed; `data` names the file and line. Affected values are never estimated in its place. |
| `measurements.invalid_accounting` | One `field` path per issue with its reason, for a configuration's accounting (`display_currency`, `tariff_per_kwh`, `tariff_currency`) or an alternative tariff (`tariff.per_kwh`, `tariff.currency`). A currency without a rate is never an error; its converted values are unknown with `no_rate_conversion`. [R081, R114] |

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `harness.usage.reported` with `seq` and a new `final: bool` (the adapter saw the harness's terminal usage record), for all roles | M05 | `RecordUsage`; coverage `COMPLETE` needs a final report. Defined in M05. |
| `harness.task.exited` (start/end timestamps, duration, `ExitClassification`), `ExposureProfile.usage` per harness version | M05 | Task time, process outcome, `not_exposed`. |
| `run.phase.started`, `run.phase.finished` (kind queue, verification, judging; scope), `run.state.changed` (`state: ended` with `outcome` completed, stopped or interrupted) | M11 | Timing updates, energy pricing, reconciliation. |
| `RunTimeline` application interface (phase intervals, launch and end time, jobs) and run/configuration directory allocation | M11 | `GetRunTiming`, persisted state. |
| `events.subscribe` with snapshot providers per namespace | M11 | Screen subscriptions to `measurements.*`. |
| Frozen launch record: per configuration task list, `PriceSnapshot` (`prices.yaml`, with `billing` and `billing_source` per entry and judge), endpoint kind, trial count, scheduling; the run's `Accounting` (`display_currency`, tariff); the `RateSnapshot` (`rates.yaml`: `display_currency`, a `RateRow` per needed currency other than USD — every price currency, the display currency and the tariff currency — or `MissingRate`) | M07 (via M11) | `LaunchFacts`, `FrozenRates`. |
| `execution.accounting: AccountingDTO` (`display_currency`, tariff with currency) in the configuration draft, set with `configs.set_execution(draft_id, accounting=…)`, saved with the configuration and frozen at launch; SetupScreen `c` pushes `CurrencyEnergyScreen(mode="setup")` | M07 | Setup entry point of CurrencyEnergy. |
| `Pricing` value object (`currency`, `input_per_mtok`, `output_per_mtok`, `source_url`, `retrieved_at`, with its `PriceRecord` provider and layer, or unknown) inside `SelectionEvidence`, from the catalog's price table; M07's `PriceSnapshot` maps it to `price_in`, `price_out`, `source_layer` | M04 (via M07) | Estimates and their price-source label. |
| `SelectionEvidence.billing` with its source (precedence override > discovered > unknown; `BillingDTO` and its "declared by user" label) | M04 (via M07) | `Billing`, the verified $0 rule and the declared-billing label beside every cost basis. |
| `ExchangeRates.snapshot(currencies) -> RateSet` (stored rates and supplied rates, resolved with source, date and label; never fetches) and `ExchangeRates.parse_currency` | M04 | `CurrentRates` for the setup preview only; `unsupported_currency` checks. |
| Trial index on every result and on `harness.task.exited` scopes; `RunContext` trial count | M11 / M02 | Trial summaries. |
| `verification.task.completed` (counts by status and cause); recorded check outcomes through M02's `RetainedResultReader` | M08 / M02 | Check columns, recorded only. |
| `EnergySource` application interface (experiment observations and, for `jobs == 1` runs, per configuration and trial window energy, each with scope, coverage and source; host energy scope) | M18 | Energy cost, local configuration cost, CurrencyEnergy `#energy-scope`. |
| Calls to `CostAnalysis.ranking_cost(result, tariff)` with the analysis tariff of `scoring.rank`, `results.list` and `reports.*` (and `display_currency="USD"` only when `display_currency_for` the compared runs gives USD because their frozen display currencies differ); `MeasurementReader.trial_summary(run_id, configuration_id, tariff)`, whose cost and time M06's `ScoringRules.trial_summary` passes through unchanged (adding only quality and eligibility). Rankings use the USD amount; the display amount is presentation only. No analysis currency or rate is passed | M06 / M02 / M13 | Rankings, results and the report with an alternative tariff; one trial rule for cost and time. |
| Entry point in Results for the analysis tariff (`e` on ResultsScreen pushing `CurrencyEnergyScreen(mode="analysis")`, then re-issuing `results.list` with `tariff` from the returned `TariffChoiceDTO`), and `results.invalid_tariff` carrying M10's issues | M02 | Analysis tariff in Results. |
| Result ZIPs carry the run's frozen launch record, `rates.yaml` included | M17 | Imported results convert with their own frozen rates and display currency. |
| `RetainedResultReader` (`get`, `for_template`), `ResultFilters` API DTO and domain `ResultFilter`, `results.result.sealed`, `results.import.registered` | M02 | Resolve results; cost-basis list. |
| `m` binding on ResultScreen's Outcomes tab → `MeasurementsScreen(result_id)`; `b` binding on ResultsScreen → `CostBasisScreen(template_sha, filters)` | M02 | Entry points named in the wireframe trees ("m from Result › Outcomes", "b from Results"). |
| `TaskChecksScreen(result_id, task_id)` | M08 | `enter` on a task row. |
| `ContentSwitcher` state widgets, `-compact` screen class | M15 | Loading, empty, error states; 80×24 layout. |

Consumers of this namespace: M02 (Outcomes tab `#task-outcomes`, `#coverage` through `measurements.result`; per-trial rows with mean and min–max through `measurements.trials`), M06 (`CostAnalysis.ranking_cost` and `MeasurementReader`: cost and time as `Measured` with basis and coverage, trial means), M13 (`MeasurementReader`, `CostAnalysis` with the report's analysis tariff; values in the run's frozen display currency, or USD when the report spans runs with different ones), M17 (records travel unchanged in result ZIPs), M12 and M16 (`measurements.invocation`).

### 4. Screens

Owned artboards: Measurements (wide and compact), MeasurementsPartial, TimingPhases, CostBasis, CurrencyEnergy ([navigation §15](../design/wireframe-tui/navigation.md)). Every screen is a view over `measurements.*` responses. No screen sums a column, picks a basis, decides coverage, converts currency or prices energy; it formats engine values, renders capability flags with `check_action`, and shows typed errors verbatim.

Formatting rules shared by the view models (presentation only): `coverage == "unknown"` renders `—` with class `-unknown`, or `?` when the limitation is `not_exposed`; `partial` renders the value plus ` ▲` with class `-partial` and the engine's `explanation`; money `$0.21`, tokens `702k` / `1.23M`, durations `m:ss` / `h:mm:ss`; basis text `estimate · complete`, `reported · 5/7 ▲`, `energy estimate · GPU + CPU package` from `basis`, `basis_label`, `coverage`, `covered`, `expected`; a value with `alternative: true` carries class `-alternative` and the label "alternative tariff"; a cost whose `billing.declared_by_user` is true shows `billing.label` after the basis text (e.g. `verified $0 · api · declared by user`); money is shown in the display currency from `display` with its ISO code (`$0.21` for USD, otherwise the code and amount, e.g. `COP 850`, `EUR 0.19`), and the USD value from `amount` beside it in detail panes; an unknown `display` renders `—` with the `no_rate_conversion` message. Order of rows comes from the response.

#### MeasurementsScreen — artboards Measurements, MeasurementsPartial

`MeasurementsScreen(Screen)` in `tui/screens/measurements.py`, constructor `MeasurementsScreen(result_id: str)`. View model `tui/viewmodels/measurements.py`:

```python
@dataclass(frozen=True)
class MeasurementsVM:
    result_bar: str; halted: bool                    # #result-bar ("trial 2 of 3" when trial_count > 1), class -halted when status is not complete
    rows: list[MeasureRowVM]                         # key = task_id; cells + per-cell class "", "-partial", "-unknown"
    total: MeasureRowVM                              # Σ row, bold
    overlap_hint: str                                # from measurements.overlapping_categories notice
    formation: list[tuple[str, str]] | None          # #formation, selected task (wide only)
    phases: list[tuple[str, str]]                    # #phases
    halt: NoticeVM | None                            # #halt (MeasurementsPartial)
    coverage: list[tuple[str, str]] | None           # #coverage, shown when total coverage is not complete
    accounting: list[tuple[str, str]]                # #accounting (compact only): display currency, rate label, tariff
    trials: list[tuple[str, str]] | None             # #trial-summary (wide): each trial, mean, min–max, from `trials`
    tariff_alternative: bool                         # alternative-tariff notice
    capabilities: MeasurementCapabilities

def build_measurements_vm(m: ResultMeasurements, f: TaskFormation | None, compact: bool) -> MeasurementsVM
```

| Item | Behavior |
|---|---|
| Load | On mount, in a worker: `measurements.result(result_id, tariff?)`; then `measurements.task(result_id, <highlighted task>)` for `#formation` (wide only). An analysis tariff, when set, is screen state passed back by CurrencyEnergyScreen and reissued with `measurements.result`. Money is always in the run's frozen display currency. |
| Subscriptions | When `live`: `events.subscribe(["measurements.task.recorded", "measurements.configuration.aggregated"])` filtered to `result_id` and `["measurements.timing.updated"]` filtered to `run_id`; each event re-issues `measurements.result`. Unsubscribe on unmount. |
| ContentSwitcher | `#measurements` / `#measurements-loading` / `#measurements-empty` (no task has finished: "No measurements yet") / `#measurements-error` (typed error, e.g. `measurements.record_unreadable`, message verbatim; nothing is estimated in its place). |
| Widgets | `Static #result-bar`; `DataTable #measurements` (columns `#`, Task, Process, Checks, Time, Input, Cached, Output, Reason., Cost, Basis · coverage; compact: `#`, Task, Process, Time, In, Out, Cost, Basis); `Static #overlap-hint`; `Static #formation`, `Static #phases`, `Static #trial-summary` (hidden in `Screen.-compact`; `#trial-summary` only when `trials` is present); `Static #halt .notice.-error` from `halt`; `Static #coverage .kv` from `sources`; `Static #accounting` (compact); `Horizontal .actions` with `Button #timing` and `Button #cost-basis`. For a local endpoint the Σ row's Cost cell shows `configuration_cost`. |
| `DataTable.RowHighlighted` | Debounced `measurements.task(result_id, task_id)`; updates `#formation` only. The Σ row issues no call. |

| Binding | Action | API call |
|---|---|---|
| `esc` | `app.pop_screen` | none |
| `t` / `Button #timing` | `timing` | push `TimingScreen(run_id)`; `check_action` returns `capabilities.can_timing` |
| `b` / `Button #cost-basis` | `cost_basis` | push `CostBasisScreen(template_sha, filters=None)`; enabled by `can_cost_basis` |
| `u` | `accounting` | push `CurrencyEnergyScreen(mode="analysis", run_id=run_id, alternative=<current tariff>)` (recorded display currency and rates read-only, analysis tariff only); on dismiss with a `TariffChoiceDTO` re-issue `measurements.result(result_id, tariff=…)` (omitting `tariff` when the choice resets it); enabled by `can_accounting` |
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

`CostBasisScreen(ModalScreen[None])` in `tui/screens/results.py`, constructor `CostBasisScreen(template_sha: str, filters: ResultFilters | None)`, pushed by `b` from ResultsScreen (M02) or MeasurementsScreen. View model `tui/viewmodels/cost_basis.py`: `CostBasisVM {rows: list[BasisRowVM(result_id, model with ↓ for imported, cost text, basis text, billing text, coverage text, classes)], currency_note: str | None, legend: list[tuple[str, str]]}`. `currency_note` shows the display currency with the frozen rate labels, or the `measurements.mixed_display_currency` message (values in USD because the runs froze different display currencies). The `#basis-legend` text describes the five basis labels and "declared by user", and is static presentation.

| Item | Behavior |
|---|---|
| Load | `measurements.cost_bases(template_sha, filters, tariff?)`. Rows show `trial_index` of `trial_count` when greater than 1, the cost in the display currency and, for a declared billing kind, `billing.label`. |
| Subscriptions | `results.result.sealed` and `results.import.registered` for the template and `measurements.configuration.aggregated` re-issue the query. |
| ContentSwitcher | `#basis-table` / `#basis-table-loading` / `#basis-table-empty` / `#basis-table-error`. |

| Binding | Action | API call |
|---|---|---|
| `esc` / `Button #close` | `dismiss(None)` | none |
| `tab / shift+tab` | `focus_next / previous` | none |
| `enter` | `open` | `dismiss(None)`, then push `MeasurementsScreen(row.result_id)`; enabled by `can_open` |
| `u` / `Currency and energy…` | `accounting` | push `CurrencyEnergyScreen(mode="analysis", run_id=row.run_id, alternative=<current tariff>)`; on dismiss with a `TariffChoiceDTO` re-issue `measurements.cost_bases(…, tariff=…)`; enabled by `can_accounting` |

#### CurrencyEnergyScreen — artboard CurrencyEnergy

`CurrencyEnergyScreen(ModalScreen[AccountingDTO | TariffChoiceDTO | None])` in `tui/screens/setup.py` (the wireframe's `Accounting` result type is `AccountingDTO`). Constructor `CurrencyEnergyScreen(mode: Literal["setup", "analysis"], initial: AccountingDTO | None = None, run_id: str | None = None, alternative: TariffDTO | None = None)`. It holds the display currency and the electricity tariff, and shows the exchange rates that will be (setup) or were (analysis) frozen; it never edits a rate (rates are supplied in M04's catalog, `RatesScreen`). Like `WeightsScreen` (M06) it is a pure editor. In `setup` mode, pushed by `c` from SetupScreen (M07), it edits the display currency and the tariff, and SetupScreen stores the returned `AccountingDTO` through `configs.set_execution`. In `analysis` mode, pushed by `e` from ResultsScreen (M02) and `u` from MeasurementsScreen and CostBasisScreen, it shows the run's frozen display currency, rates and tariff read-only and lets the user enter an alternative tariff only, returning `TariffChoiceDTO {alternative: TariffDTO | None}` (`None` resets to the recorded tariff) to its caller, which re-issues its query. Analysis mode has no display-currency or rate input. View model `tui/viewmodels/currency_energy.py`:

```python
@dataclass(frozen=True)
class CurrencyEnergyVM:
    display_currency: str                                      # input text as typed (setup) or the frozen value (analysis)
    currency_options: list[str]                                # setup: ISO 4217 codes from the preview, those with a rate first
    rates: list[RateRowVM]                                     # currency, "1 USD = …", source label (incl. "supplied by user"), date, uses; or "? unknown"
    rate_notices: list[str]                                    # no_rate_conversion per currency, historical-rate notice
    tariff_enabled: bool; tariff: str; tariff_currency: str    # input text as typed, or the alternative (analysis)
    recorded_tariff: str | None                                # analysis mode: the frozen tariff, or "none recorded"
    field_errors: dict[str, str]                               # field path -> engine message
    energy_scope: list[tuple[str, str]]                        # Measured, Not measured, Scope label, Concurrency, Provider cost, Local cost
    energy_costs: list[tuple[str, str]] | None                 # analysis mode: per window, with coverage, original or alternative
    currency_editable: bool; tariff_editable: bool; can_save: bool

def build_currency_energy_vm(src: AccountingPreview | AccountingView, inputs: Inputs | None) -> CurrencyEnergyVM
```

| Item | Behavior |
|---|---|
| Load | `setup`: `measurements.preview_accounting(<initial as draft>)`. `analysis`: `measurements.accounting(run_id, tariff=alternative)`. |
| Widgets | `Static #primary` ("Costs are computed and ranked in USD"); `Select #display-currency` from `currency_options` (default `USD`); `DataTable #rates` (Currency, Rate, Source, Date, Used for) from `current_rates` (setup, "current catalog rates · frozen at launch") or `recorded_rates` and `missing_rates` (analysis, "frozen at launch"), unknown rows as `? unknown`; `Static #rate-notices .notice.-warning` (currencies without a rate, so their converted values will be unknown; the historical README rate is not used; rates are supplied in the catalog); `Vertical #tariff` with `Checkbox #tariff-enabled`, `Input #tariff-per-kwh`, `Select #tariff-currency` (ISO 4217 codes from `currency_options`); `Static #energy-scope .kv` (what is measured, what is not, and that a local configuration's cost is the energy estimate only in sequential runs); `Static #energy-costs` (analysis); `.dialog-actions` with Cancel and `Button #save`. In `analysis` mode `#display-currency` is disabled and shows the frozen value, the tariff inputs hold the alternative (prefilled with the recorded tariff), `#save` reads "Apply as alternative" and a `Button #reset` "Reset to recorded" appears. |
| `Input.Changed`, `Checkbox.Changed`, `Select.Changed` | `setup`: debounced `measurements.preview_accounting` with the raw text of every input (the rates table follows the chosen display and tariff currencies). `analysis`: debounced `measurements.accounting(run_id, tariff=<raw text>)`. Issues set `-invalid` on the named field. |
| ContentSwitcher | `#currency-energy` / `#currency-energy-loading` / `#currency-energy-error`. |

| Binding | Action | API call |
|---|---|---|
| `esc` / Cancel | `dismiss(None)` | none |
| `tab / shift+tab` | `focus_next / previous` | none |
| `ctrl+s` / `Button #save` | `save` | `setup`: `measurements.validate_accounting(draft)`; on success `dismiss(AccountingDTO)`. `analysis`: `measurements.accounting(run_id, tariff=…)`; on success `dismiss(TariffChoiceDTO(alternative=tariff))`. `measurements.invalid_accounting` marks fields and stays open. `check_action` returns `True` or `None` (dimmed) from `can_save` in `setup` mode and from `can_alternative_tariff` in `analysis` mode. |
| `Button #reset` (analysis) | `reset` | none; `dismiss(TariffChoiceDTO(alternative=None))`. |

#### Screens owned elsewhere that consume M10

| Screen | Owner | Calls |
|---|---|---|
| ResultScreen, Outcomes tab (`#task-outcomes`, `#coverage`) | M02 | `measurements.result` for the measurement columns and coverage text, same formatting rules; `measurements.trials` for per-trial rows with mean and min–max. |
| RankingsPane, ScoreBreakdownScreen | M06 | Cost and time arrive inside `scoring.*` responses, read by M06 through `MeasurementReader`. |
| Review detail, planning screens | M12, M16 | `measurements.invocation` for judging and planning cost, labelled as outside the benchmark. |

### 5. CLI

The source names no measurement command. Under the architecture rule that every API method is reachable from the CLI, the registry-generated `measurements` group exposes them; these are implementation-level commands owned by [M14](14-command-line-interface.md), not new product requirements.

| Command | Method |
|---|---|
| `axbenchmark measurements show RESULT_ID [--task ID] [--tariff AMOUNT --tariff-currency CODE] [--json]` | `measurements.result` (`--task`: `measurements.task`) |
| `axbenchmark measurements trials RUN_ID --config ID [--json]` | `measurements.trials` |
| `axbenchmark measurements timing RUN_ID [--json]` | `measurements.timing` |
| `axbenchmark measurements cost-basis --template SHA [filters] [--tariff AMOUNT --tariff-currency CODE] [--json]` | `measurements.cost_bases` |
| `axbenchmark measurements accounting RUN_ID [--tariff AMOUNT --tariff-currency CODE] [--json]` | `measurements.accounting` |
| `axbenchmark measurements check-accounting [--display-currency CODE] [--tariff AMOUNT --tariff-currency CODE] [--json]` | `measurements.validate_accounting` |

Human output prints `—` for unknown, `?` for not exposed and `▲` for partial, with the basis column and its label, exactly like the screens; values from `--tariff` are marked "alternative tariff". Money prints in the run's frozen display currency (USD, with the `measurements.mixed_display_currency` notice, for `cost-basis` over runs that froze different ones); no measurements command takes a display currency or a rate (`check-accounting --display-currency` only validates a configuration's setting before launch). Unattended runs carry accounting in the configuration YAML, which M07 validates through `AccountingValidation` at launch; `axbenchmark run --no-tui` streams `measurements.task.recorded` as progress lines.

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain (`tests/engine/measurements/domain/`) | Six cumulative reports plus a final total count once, from the final (702k / 44k); delta streams sum; mixed streams are partial; reasoning 17k inside output 44k is never added; unexposed cached is `UNKNOWN`/`not_exposed`, never 0. Reported cost wins and suppresses the estimate; estimate 702k × $0.25/M + 44k × $0.80/M = $0.21 exactly, carrying its price source and date; missing rate, an `unknown` override or missing usage → `UNKNOWN`; subscription never zero, and a $0 reported under subscription yields an API-equivalent estimate. Verified zero: reported $0 on every task with complete coverage and `API` billing → `VERIFIED_ZERO`; one task partial, one subscription or one task unreported → not verified. Local endpoint: `jobs 1` with tariff and window energy → `ENERGY_ESTIMATE` with scope label and the window's coverage; `jobs 4` → `UNKNOWN`/`parallel_energy_shared`; no tariff → `UNKNOWN`/`no_tariff`; an API configuration never gets energy added. A COP tariff converts with the frozen rate and without one is `UNKNOWN`/`no_rate_conversion`; an alternative EUR tariff on a run whose `RateSnapshot` has no EUR rate is likewise unknown, never converted with a current or assumed rate. A EUR price converts to USD with the frozen EUR rate (estimate terms stay in EUR, `conversion` names the rate) and without one is `UNKNOWN`/`no_rate_conversion`; a COP display currency converts USD → COP with the frozen rate, and without one `display` is unknown while the USD amount stays. A declared `API` billing with a reported $0 and complete coverage is `VERIFIED_ZERO` and its label carries "declared by user"; a declared `SUBSCRIPTION` never yields zero; `UNKNOWN` billing never yields zero. `display_currency_for` returns the shared currency for runs that froze the same one and `USD` with `mixed_display_currency` otherwise. Trials: three trials with complete cost give mean and min–max; one partial trial makes the mean `PARTIAL` and one unknown trial makes it `UNKNOWN`, each naming the trial; no trial is filled with zero. Halted run (R-0925b-2 shape): T5 partial, T6–T7 unknown, total partial 5 of 7. Benchmark elapsed sums task processes only; excluded phases and experiment duration stay separate, and four concurrent configurations give an experiment shorter than their summed elapsed. Conversion keeps basis and coverage; invalid accounting reports every field (`display_currency`, `tariff_per_kwh`, `tariff_currency`). Energy cost keeps scope; experiment energy is never allocated to a configuration and energy is never added to a provider cost or an API-equivalent estimate. Property tests (hypothesis): fold is order-independent given `seq`; aggregate coverage is `COMPLETE` only if every task is; no input yields zero from `None`. |
| Use cases (`tests/engine/measurements/application/`) | Fakes for `MeasurementStore`, `ResultIndex`, `LaunchFacts`, `RunTimeline`, `CheckSummaries`, `EnergySource`, `EventSource`. Usage is appended before folding; non-final reports publish nothing; `ReconcileInterrupted` marks partial without filling; judging and planning accounts never enter aggregates; imported records are returned unchanged; estimates use the fake launch record's `PriceSnapshot` even after the fake catalog's prices change; an alternative tariff changes the returned energy cost and leaves `energy-cost.json` byte-identical. |
| API (`tests/api/measurements/`) | `InProcessClient` against the composed engine with fake adapters and no interface: replay a canned `harness.*` / `runs.*` event script, then query `measurements.result`, `measurements.timing`, `measurements.cost_bases`; JSON round trips; decimal strings; typed error codes and field paths; the JSON Schema of every `measurements.*` request has no `display_currency`, `currency` or rate field; `measurements.cost_bases` over two runs that froze COP and EUR returns `display_currency: "USD"` with `measurements.mixed_display_currency`; registry kinds and `read` safety classes; JSON Schema snapshot; `import-linter` layer contracts. |
| Screens (`tests/tui/`) | View-model unit tests from canned responses for the five artboards (`—`, `?`, `▲`, basis text, compact `#accounting`). Textual `Pilot` against a fake client: each binding issues exactly the call in section 4; `t`, `b`, `u`, `enter` and Save follow capability flags; `analysis` mode cannot edit the display currency and has no rate input, Apply returns the alternative and Reset returns `None`, and the caller re-issues its query once with or without `tariff` and never with a currency; `c` on SetupScreen opens `setup` mode; `measurements.invalid_accounting` marks the named input; errors render verbatim in `#…-error`; compact layout at 80×24; no screen imports `axbenchmark.engine`. |

