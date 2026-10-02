# M10 — Execution measurements and cost accounting

Status: proposed contract, derived from [SPEC.md](../SPEC.md). This module defines measurement meaning and accounting boundaries; it does not claim an implementation exists.

Implement through three bounded children, in order: [M10.1 task-accounting](implementation/M10/01-task-accounting.md), [M10.2 final-accounting](implementation/M10/02-final-accounting.md), and [M10.3 measurement-screens](implementation/M10/03-measurement-screens.md). Their fixture tests do not satisfy the parent's real integration gates. Findings addressed here: F02–F08, F12 and F19 from [recommendations](../recommendations.md).

M10 provides measured cost and time for comparisons following the repository README's methodology and presentation, alongside a separate quality assessment. Every result describes a complete harness/model/environment configuration, including its execution conditions. Measurements must not be presented as evidence of isolated model capability. Rankings may support different user priorities, but their quality component comes from independent judging. [R004]

## Inputs, outputs, and dependencies

| Boundary | Conceptual contract |
|---|---|
| Execution inputs | [M05](05-harness-execution-isolation.md) supplies task process observations and available harness/provider usage and cost reports. [M11](11-run-orchestration.md) supplies task/configuration identities, execution status, scheduling context, and phase timing. Every competitor observation carries shared `RunUid`, `TrialRef {run_uid, configuration_id, trial_index}`, `ResultId`, invocation and task identity. Run labels are display-only; resolving a result always returns its explicit trial. [R004, R078, R079] |
| Accounting inputs | The price table snapshot recorded in the frozen launch evidence ([M07](07-run-configuration.md), prices from [M04](04-model-catalog.md) with source and retrieval date) supports estimates where usage is known. The same evidence records each account's billing kind (`api`, `subscription`, `local`, `unknown`) and whether it was read from the harness or declared by the user. The exchange-rate snapshot frozen at launch (M07; rates for USD conversion that M04 collected during an explicit catalog refresh or that the user supplied, each with its source and date) covers every price currency, the display currency and the tariff currency. The display currency (default USD) and an optional electricity tariff (per kWh, with currency), both frozen with the run, are distinct inputs. [M18](18-hardware-monitoring.md) supplies energy observations with their actual scope and coverage, including each configuration's energy in its execution windows during sequential runs. No rate or complete measurement is assumed when absent. [R080, R081, R114, R147, R152] |
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

**Unverified zero policy (F08):** a numeric API-equivalent or energy estimate of zero remains zero with its original basis and coverage; it is never promoted to verified zero. The same applies to any other numeric zero lacking complete verified-zero evidence. M10 exposes `cost_zero_unverified` eligibility information; M06 excludes it from lowest-cost and positive-cost-weight rankings and skips this measurement gate when the cost weight is zero. Unknown billing preserves a valid positive reported/estimated aggregate with `billing_unknown`; it does not discard a usable amount. [R080, R100, R101, R155]

The billing kind is the one frozen at launch from [M04](04-model-catalog.md): a user declaration for the account takes precedence over the harness reading, which takes precedence over unknown. Wherever a cost basis is shown, a billing kind declared by the user is labelled "declared by user", so a verified $0 or an estimate that rests on a declaration is identifiable as such. [R080]

Costs are computed, aggregated and ranked in USD. An API-equivalent estimate from a price published in another currency is converted price currency → USD with the run's frozen rate for that currency; without a frozen rate the estimate is unknown (no rate conversion) rather than computed with an assumed rate. Values are shown in the run's display currency (default USD), converted USD → display currency with the frozen rate for that currency; a missing rate leaves the converted value unknown (no rate conversion), never guessed, and the USD value remains available. Rates are never looked up during a run or while recording measurements, and the historical README exchange rate is never used. A converted value names the rate it used with that rate's source and date, and a supplied by user rate is labelled as such. Preserve cost basis and estimate labels wherever rankings could otherwise suggest equivalent accounting; currency conversion does not turn an estimate into a reported charge, change a cost basis, resolve incomplete coverage or change a ranking. [R080, R081]

An optional electricity tariff may produce a clearly labeled energy-cost estimate: measured kWh × tariff, converted to USD with the frozen rate for the tariff's currency (without that rate the estimate is unknown). Preserve the scope of the energy observation: CPU-package or GPU-only measurements cannot establish whole-system electricity cost, and the label says so. In sequential runs only, a configuration on a local endpoint (no API cost) takes the energy-cost estimate for its own execution windows as its cost, labelled "energy estimate" with its measurement scope (for example "GPU + CPU package · not whole-system"). In parallel runs shared experiment energy is never divided among configurations, so a local configuration's cost stays unknown; the experiment's energy estimate stays separate from every configuration. No tariff or no energy measurement also leaves a local configuration's cost unknown. Do not add energy charges to reported provider costs or to API-equivalent estimates. Partial or missing energy data remains partial or unknown in any associated estimate. [R110, R114, R147, R155]

The tariff frozen with the run is the original. A different tariff can be entered later in Results as an analysis setting: it recalculates energy-cost estimates for display and ranking as a labelled alternative, like alternative weights, with a reset to the original, and never changes the recorded run. Its currency converts to USD with the run's frozen rates; a currency the run has no rate for leaves the alternative estimate unknown (no rate conversion). [R096, R114]

The display currency is chosen before launch and cannot be changed afterwards: there is no analysis-time currency choice in Results, rankings ([M06](06-scoring-rankings.md)), measurements or the report ([M13](13-standalone-html-report.md)). Values from one run are shown in that run's frozen display currency. A comparison, ranking or report spanning runs whose frozen display currencies differ shows every value in USD and says so. [R081]

## Durable completion boundary

Follow the [shared finalization barrier](ARCHITECTURE.md#finalization-and-immutable-retention). M05 competitor usage/exits and M08 verification summaries use acknowledged application ports, never a client subscription queue. M11 finishes or cancels producers and evidence writes, awaits M10 `drain_run`, awaits M18 close and its telemetry receipt, then awaits M10 `finalize_run`. M10 appends every trial's final cost/time/usage, billing/price/rate evidence, energy and coverage through M02 and obtains its `MeasurementFinalizationReceipt` before M02 seals. `run.state.changed(ended)` never triggers energy pricing. [R078–R081, R114, R134, R147, R155; F03–F06]

Stop, interruption, identity invalidation and startup recovery use the same barrier with partial/unknown facts preserved. Identical retries use stable operation IDs; conflicts fail. Storage failure leaves finalization pending and export/report readiness false. Sealed results retain their receipt and accept no further measurement writes. Later judging cost/time is separate append-only invocation/run-lifecycle data. Retained local, exported, imported and report views consume the same M02 facts. [R082, R134, R153]

## Acceptance criteria

- Delayed usage/check acknowledgements and telemetry closure block finalization and sealing. Recovery retries identical writes, rejects conflicts and never appends measurements after seal, including stop/interruption paths. [R134, R147; F03]
- Same-label runs on two machines and two trials with different T1 observations remain separate in paths, checks, means and exports. [R077, R122, R154; F02, F06]
- A task and its aggregate expose every required measurement category, verification result, and execution status, with unavailable fields identifiable. Cumulative usage events and overlapping token categories never inflate usage or cost. [R078, R080, R147]
- A run containing queueing, planning, tool work, external checks, and judging includes only task process durations, with tool work, in benchmark elapsed time; excluded phases and total experiment duration remain separately inspectable. [R079]
- Reported cost takes precedence; known usage with the recorded price table produces an estimate labelled with its price source and date, also under subscription billing. Verified $0 requires a reported $0, complete coverage for every task and billing known not to be a subscription. Subscription, unknown billing, absent pricing, and incomplete usage cases never manufacture verified zero or complete cost. Numeric zero estimates keep their basis and `cost_zero_unverified` information, while positive unknown-billing costs remain usable with their limitation. A billing kind declared by the user is labelled "declared by user" beside every cost basis that depends on it. [R080, R147, R152]
- Three trials of one configuration produce three results with their own measurements, plus a mean and min–max of cost and time; a trial with partial cost makes the mean partial and a trial with unknown cost makes it unknown, naming that trial. [R077, R078, R147, R154]
- Costs are computed and ranked in USD. A price in another currency converts to USD only with the run's frozen rate, otherwise its estimate is unknown with no rate conversion. Values in the display currency use only the frozen rate, a missing rate leaves them unknown, and the historical README rate is never used. No retained-analysis query, screen or command offers a display currency other than the run's frozen one; a comparison of runs with different frozen display currencies shows USD with a notice saying so. Ranking presentations retain accounting bases and estimate labels. [R081]
- Optional tariff estimates preserve measurement scope. A local configuration in a sequential run has an "energy estimate" cost with scope; in a parallel run its cost is unknown. Shared energy is not allocated to concurrent configurations, package/GPU readings do not imply whole-system cost, and provider charges do not receive energy additions. A tariff changed in Results is labelled alternative, converts with the run's frozen rates and leaves the recorded run unchanged. [R110, R114, R147]
- Comparison consumers retain full configuration context and the distinction between measured execution statistics and independent quality assessment. [R004]

## Implementation

Implementation decisions under [the architecture decision](ARCHITECTURE.md). They fix where the accounting rules above run and how interfaces reach them; they add no product behavior. File names, token-count formatting and debounce intervals are engineering defaults, not product requirements.

### 1. Engine component

Package `axbenchmark.engine.measurements`. M10 alone folds usage, selects cost basis, aggregates cost/time, converts frozen currencies and prices energy. M06 owns ranking gates; M18 owns physical energy collection/normalization; M02 owns retained facts. UI, CLI and report consumers receive complete projections rather than duplicating accounting.

#### Domain (`engine/measurements/domain/`, no I/O)

Parse finite price/rate/amount inputs as exact decimal strings and convert to `fractions.Fraction` before arithmetic. USD is the calculation unit; exact costs, conversions and trial means use rationals, serialized as reduced `n/d`. Display rounding never feeds a later calculation. Token counts and observed durations in milliseconds are integers; duration means may be rational. No binary float or fixed Decimal precision determines a ranking value. **[R077, R080, R081; F07, F19]**

| Type / function | Contract |
|---|---|
| `Coverage`, `Measured[T]`, `Limitation` | `COMPLETE`, `PARTIAL`, `UNKNOWN`; `{value, coverage, source, limitations, covered, expected, explanation}`. Unknown iff value is absent. Limits include `not_exposed`, `not_observed`, `final_total_missing`, `mixed_usage_stream`, `no_rate`, `no_usage`, `no_cache_discount`, `no_rate_conversion`, `subscription_billing`, `subscription_zero_ignored`, `billing_unknown`, `unknown_billing_zero_ignored`, `cost_zero_unverified`, `interrupted`, `local_endpoint`, `parallel_energy_shared`, `no_tariff`, `no_energy`. Scope/detail identifies the affected trial/task/currency. Known partial zero remains partial, not unknown. |
| `TokenUsage`, `UsageReport` | Separate input/cached/output/reasoning categories. Cached is a subset of input; reasoning a subset of output. Usage report includes invocation/scope, stable entry ID, `seq`, available categories/cost evidence, cumulative/final flags. Preserve the original report and adapter exposure evidence. A reported amount needs its documented currency; absent currency remains unavailable rather than assuming USD. |
| `fold_usage(reports, exposure) -> UsageFold` | Deduplicate stable entries, sort by invocation sequence, replace cumulative observations with the latest cumulative total or sum delta-only reports. Mixed cumulative/delta streams retain only provably non-overlapping amounts, partial with `mixed_usage_stream`. A final total is not an additional delta. Complete requires terminal report and complete category exposure; intermediate-only is partial; absent/unexposed is unknown. Record report count, counted entries and final-total/delta basis. Never add cached/reasoning subsets again. |
| `Pricing`, `Billing` | Use only M07 frozen `PriceSnapshot`. Preserve M04 known/unknown price state, currency, provider, layer, source URL/date and complete `ResolvedBilling` (kind, optional source `override`/`discovered`, declaration flag, observation origin/date, label). Endpoint is an observation origin, not a new billing source layer. Never re-resolve billing; use M04's label including "declared by user". |
| `ConversionRate`, `FrozenRates`, `RateUse` | Copy M07 `RateSnapshot` including missing rows, source, `as_of`, `retrieved_at`, URL and label. `per_usd` is positive finite currency units per 1 USD: fixture COP `4000`. USD identity needs no stored row. Rates are immutable; no live lookup, historical constant or reciprocal editor convention. |
| `to_usd`, `to_display` | Exact `amount / per_usd` and `amount_usd * per_usd`. Preserve basis/coverage and emit rate provenance. A missing rate makes that projection unknown with `no_rate_conversion`; a missing display rate leaves the USD value intact. A reported non-USD amount follows the same rule. |
| `CostBasis`, `TaskCost` | `REPORTED`, `ESTIMATE`, `VERIFIED_ZERO`, `ENERGY_ESTIMATE`, `UNKNOWN`; aggregates may be `MIXED`. Include exact USD amount, price terms/source or energy scope, conversion, frozen billing and limitations. |
| `cost_for_task(fold, pricing, billing, rates)` | Local endpoint → unknown API cost with `local_endpoint`. Ignore reported zero as a charge under subscription/unknown billing, retaining its raw evidence and zero-ignored limitation; estimate where usage/prices permit. Otherwise reported cost wins, preserving coverage. Reported zero is verified only with complete usage coverage and known non-subscription billing; local configuration pricing follows the energy rule below. Estimate = `(input * price_in + output * price_out) / 1_000_000`, then convert price currency to USD. No cached discount or extra reasoning charge; retain `no_cache_discount` when cached tokens are present/unexposed. Missing input/output or either rate gives unknown; incomplete usage remains partial. All subscription/unknown amounts carry their billing limitation. A numeric unverified zero keeps its original basis plus `cost_zero_unverified`; M06 decides eligibility. |
| `TaskMeasurement` | `result_id`, `trial: TrialRef`, `invocation_id`, task id/title/index, process outcome, phase-keyed `checks`, token usage, task process duration, task cost, fold facts and source/evidence refs. Validate result/trial binding before accepting. Never infer check success from exit/time/cost. |
| `TaskTime`, `RunTiming` | Competitor benchmark elapsed is only the sum of task process durations, including their tool work. Queue/planning/external verification/judging remain separate. Interrupted time reaches only the last observed instant and is partial; never-started time is unknown. Run experiment wall time is not a sum across concurrent configurations. Judging/experiment-end timing after seal comes from retained append-only M11 lifecycle data. |
| `aggregate(tasks, expected)` | Sum known values per category; complete iff every frozen expected task is complete, unknown iff no value exists, otherwise partial with task coverage. Verified zero requires every task verified zero. Reported plus verified-zero basis is reported; otherwise preserve one basis or mixed with `by_basis`. No duplicated charge for a task. |
| `configuration_cost(aggregate, billing, energy, scheduling)` | API/subscription/unknown billing keeps the aggregate unchanged (unknown retains `billing_unknown`, including valid positive amounts). A local endpoint uses scoped energy estimate only for sequential `jobs == 1` trial windows with energy and tariff; otherwise unknown with the precise reason. Never add energy to a reported/API estimate or divide parallel experiment energy among configurations. |
| `TrialSummary`, `summarize_trials(group, per_trial)` | Use M02 `TrialGroup` keyed by `(RunUid, configuration_id)` and its frozen trial count. Emit explicit expected TrialRefs, observed/missing counts and cost/time mean/min/max. Any missing/unknown trial makes all that metric's summary values unknown; any partial makes them partial, naming limiting trials. No trial is skipped or filled. Every cost mean/min/max has full `CostDTO` metadata. A mean's `by_basis` amounts and contributor weights follow the same division by frozen trial count; their exact amounts sum to the mean. Min/max retain the selected trial's full cost provenance (tie-break by trial index); if any trial is partial their coverage/limitations still describe the whole group. Unknown projections keep available provenance without claiming a numeric total. One-trial ranges equal the trial value. |
| `Accounting`, `Tariff`, `TariffChoice` | Frozen display currency (default USD), optional positive finite per-kWh tariff and currency. Analysis may choose only original or alternative tariff; weights are M06's separate choice. Alternatives never mutate retained facts. `validate_accounting`/`validate_tariff` report all invalid fields (`not_a_number`, `nonfinite`, `not_positive`, `missing_tariff`, `unsupported_currency`); missing conversion rates are limitations, not invalid input. |
| `display_currency_for(pinned_runs)` | Shared frozen display currency, or USD and `measurements.mixed_display_currency` when the shown runs differ. Return `DisplayCurrencyDTO`, not a bare code. Choose across the pinned population before ranking eligibility; each same-currency run uses its own frozen rate. |
| `EnergyCost`, `energy_cost(observation, tariff, rates)` | Exact kWh × tariff, converted with frozen rates; preserve `EXPERIMENT` or `SEQUENTIAL_WINDOW(trial: TrialRef)`, source, scope, coverage and `includes_background`. Keep kWh even with no tariff for later analysis. Accept M18's deduplicated physical-domain observations; ambiguous resets/gaps stay uncovered, never repaired by M10 or priced as complete. |
| `InvocationAccount` | Planning/judging usage and cost by explicit role/invocation, outside every competitor aggregate. Diagnostic verification usage is not benchmark measurement. Later judge accounts do not append to sealed execution facts. |

#### Ports and application interfaces

Imports use Bootstrap-published shared schemas; consumers do not import another feature's adapters. M08 owns `VerificationObservation`/`CheckSummary` schemas; its observation is `{observation_id, verification_id, result_id, trial, phase, artifact_task_id, summaries: tuple[TaskCheckSummary], started_at, finished_at, terminal_cause, evidence_ids}`, with each summary carrying defining task/phase/check IDs and passed/failed/unverified/not-run counts. M10 owns durable `ObservationReceipt(observation_id, payload_digest)`. M05's `InvocationObservationSink` is implemented here with the same durable acknowledgement rule.

Import the Bootstrap-published M18 `TelemetryFinalizationReceipt` from [M18's ports contract](18-hardware-monitoring.md#ports-enginetelemetryportspy); M10 defines no substitute receipt schema. Preserve the complete value unchanged: `{schema_version: 1, run_uid, collection_id, input_digest, collection_digest, windows_digest, cutoff: {wall_time, monotonic_offset, clock_epoch, last_persisted_sample_id?}, status: complete | partial | unavailable | off, limitations, results: [{result_id, trial: TrialRef, hardware_digest, operation_id}]}`. Result rows remain sorted by ResultId. `complete` describes the enabled/measured scope only; `off`/`unavailable` retain reasons and every expected trial envelope, never fabricated energy.

```python
class InvocationObservationSink(Protocol):       # exact M05 port
    async def accept(self, invocation_id: InvocationId, entry_id: str, scope: InvocationScope, fact: InvocationFact) -> ObservationReceipt: ...
class VerificationObservations(Protocol):        # called and awaited by M08
    async def record_verification(self, observation: VerificationObservation) -> ObservationReceipt: ...
class CheckSummaries(Protocol):                  # M08 adapter over M02
    async def for_trial(self, trial: TrialRef, phase: CheckPhase) -> Mapping[TaskId, CheckSummary]: ...
class MeasurementFinalizer(Protocol):            # called and awaited by M11
    async def drain_run(self, run_uid: RunUid) -> None: ...
    async def finalize_run(self, run_uid: RunUid, telemetry_receipt: TelemetryFinalizationReceipt, terminal_cause: TerminalCause) -> MeasurementFinalizationReceipt: ...
class CostAnalysis(Protocol):                   # pure, pinned retained inputs
    def display_currency_for(self, pinned_runs: Sequence[RetainedRun]) -> DisplayCurrencyDTO: ...
    def ranking_cost(self, result: EffectiveResult, tariff: Tariff | None, display_currency: CurrencyCode | None = None) -> CostObservation: ...
    def validate_tariff(self, draft: TariffDraft) -> Tariff: ...
class MeasurementReader(Protocol):
    def trial_summary(self, group: TrialGroup, tariff: Tariff | None, display_currency: CurrencyCode | None = None) -> TrialSummary: ...
class MeasurementSummary(Protocol):              # M11 live lanes
    async def for_trial(self, trial: TrialRef) -> tuple[Measured, CostObservation]: ...
```

`ranking_cost` and `trial_summary` consume pinned M02 facts from the caller's publication view, never reload live working state. `tariff=None` uses the recorded tariff. Internal `display_currency=None` uses the frozen currency; the only override is USD selected by `display_currency_for` for a mixed-currency view. Reject any arbitrary override. No public result/ranking/report query accepts currency or rates. **[F02, F07]**

Additional ports: `MeasurementJournal.accept(entry_id, scope, payload) -> ObservationReceipt`, `.drain(run_uid)`, `.load(run_uid)`, `.checkpoint_finalization(run_uid, progress)` (durable IDs/digests and recovery); M02 `RetainedResultReader`, `ResultRecorder.append_measurements(rid, set, operation_id)`, `.attach_evidence(rid, ref, operation_id)`, `.finalization_receipt(run_uid, rids)`; M07 `LaunchRecords.get(run_uid) -> FrozenLaunch`; M11 `RunTimeline.intervals(run_uid)` with durable execution intervals plus later lifecycle timing; M18 `EnergySource.observations(run_uid)`, `.window_energy(run_uid)` return closed receipt-bound observations; `.host_scope()` is setup guidance only. Validate those observations against the unchanged close receipt and pinned M02 `HardwareSamples`/source evidence before pricing; M04 `ExchangeRates.snapshot(currencies)`/`parse_currency` for setup preview/validation only. Result resolution validates full TrialRef before every journal/retention write. `AccountingValidation` exposes `validate_accounting` to M07; `JudgingCostAccounting.measure(invocation_id)`/`.estimate(selection, result_id)` serves M12 outside benchmark aggregates.

#### Application and finalization

| Use case | Awaited behavior |
|---|---|
| `RecordUsage`, `FinalizeTask` | M05 calls `accept` for competitor facts. Journal the stable entry and digest durably before returning a receipt; fold usage/exit under the scoped projection lock. Non-final usage emits no measured total. Publish task/aggregate notifications only after acceptance/projection commit. |
| `RecordChecks` | `record_verification` journals M08's `verification:<id>:summary` observation before acknowledging. Preserve result/trial/phase, artifact task, defining task summaries and evidence IDs. Post-task and final-regression summaries are separate, never added as duplicate checks. |
| `RecordPhase` | Consume exact `run.phase.started`, `run.phase.finished`, `run.state.changed` through an awaited in-engine handler after M11 durably records its timeline. Refresh timing projections; ended is notification only. Required persistence never depends on client event delivery. |
| `ReconcileInterrupted`, `DrainRun` | After M11 joins/cancels all producers, finish accepted usage/exit/check/execution-phase work and pending projection commits. Mark genuinely unfinished observations partial/unknown at their last durable instant. Do not resume a task or invent an exit. Drain failure blocks closure/sealing. |
| `FinalizeRun` | Validate the complete M18 receipt, closed-source digests and run/trial/result bindings under the receipt-consumption contract below; drain again; fix the accounting cutoff under the acceptance lock. Derive final `MeasurementSet` for every unsealed trial with task and phase summaries, exact aggregates, original energy, the unchanged complete M18 receipt in `energy_evidence.telemetry_receipt`, and billing/price/rate/source evidence. Await evidence attachments and M02 `append_measurements`; obtain M02 `finalization_receipt` only after every final write. Persist/return it to M11. M10 never seals. |
| `FinalizeInvocation` | Planning/judging owners return usage/exit observations for separate durable accounts. No benchmark result write; verify diagnostic scopes are excluded. |
| Result/task/timing/trial/cost-basis/accounting queries | Live results may show journal projections labelled provisional. Once finalized/sealed, resolve/pin M02 records for all original facts, with retained M11 lifecycle timing for later phases. Trial summaries use frozen rosters; imported facts are never reinterpreted as newly measured. Analysis tariffs/display projections derive only from those retained inputs. |
| `PreviewAccounting`, `ValidateAccounting` | Validate draft, show current cached rates/host scope for setup only; never refresh rates. Analysis accounting reads frozen rates exclusively. |

**Receipt consumption before finalization.** Pin the closed collection/windows and M02 hardware envelopes referenced by M18's receipt. Require supported `schema_version`, matching RunUid/collection identity, and exactly one receipt row per frozen expected ResultId with its bound TrialRef (including previously sealed rows); reject missing, duplicate, extra or cross-trial rows. Validate `input_digest`, `collection_digest`, `windows_digest` and every `hardware_digest` against the closed source/evidence using M18's canonical SHA-256 definition, which excludes receipt/checkpoint bookkeeping. `input_digest` must bind the frozen launch/roster/windows, persisted sample/gap cutoff and derivation policy; cutoff clock epoch/offset and last persisted sample identity must agree with that source. Each row's `operation_id` is the retained stable `telemetry:<run_uid>:<result_id>:hardware:v1`, never a new M10 ID. A changed selected-source payload, window, cutoff, hardware envelope or binding is `measurements.telemetry_receipt_mismatch`: do not price it, append a final MeasurementSet or request M02's finalization receipt. Never validate against a live sampler, host preview or newly reconstructed/rounded energy projection. After validation, retain M18's receipt without projecting away fields, sorting anew or synthesizing a local shape. **[F03, F06, F12]**

**Retry/recovery contract.** Journal acceptance is atomic by `(producer, entry_id)` and payload digest; identical retries return the existing receipt, conflicting scope/bytes return `measurements.observation_conflict`. Freeze finalizer inputs once (run, selected unsealed result IDs, observation cutoff/digest, telemetry receipt/digest, frozen launch digest and terminal cause). Use stable `measurements:<result_id>:final` and `measurements:<result_id>:evidence:<id>` operation IDs. A failed append leaves its progress pending; recovery repeats the exact operation before export/report readiness. Recovery reuses that checkpoint's frozen terminal cause and inputs; any later run interruption is retained separately in lifecycle/status data. If no finalizer checkpoint exists, interrupted recovery creates its own partial-data checkpoint once. A conflicting repeated finalizer call is `measurements.finalization_conflict`, never an overwrite. Repeating a finished call returns the stored receipt; M02 validates current digests. A partial multi-result seal resumes remaining seals with their existing receipts. Already sealed trials skip all fact writes, even if a later judging stop changes the run's eventual outcome. New observations beyond the cutoff are rejected as `measurements.finalized`; identical acknowledged retries remain idempotent. Do not release a success notification while persistence is pending. **[F03, F04]**

`MeasurementSet` is the schema-versioned M10 payload accepted by M02: `result_id`, explicit `trial`, frozen expected task roster, normalized task measurements with raw observation/evidence refs and phase-keyed check summaries, exact cost/time aggregates, frozen billing/pricing/rate/accounting evidence, original tariff/energy and scope/coverage/window evidence, `energy_evidence.telemetry_receipt: TelemetryFinalizationReceipt` containing M18's complete unchanged receipt (not only this trial's row or selected digests), execution timing cutoff and finalizer input digest. Experiment energy is referenced as experiment scope, never allocated to a trial; M18 supplies durable hardware evidence. M02's `MeasurementFinalizationReceipt` covers the sorted `(result_id, individual facts_digest)` entries exactly as M02 defines; it is distinct from the retained M18 telemetry receipt. All original facts needed offline travel in M02's retained record/bundle; working journal paths are not an export dependency.

#### Adapters, storage and process ownership

| Adapter / storage | Responsibility |
|---|---|
| `adapters/json_journal.py` | Append-only durable observations/receipts and atomic projection/finalization checkpoints at `<run dir>/measurements/journal.jsonl`, `finalization.json`; task projections under `<run dir>/configurations/<cfg>/trial-<n>/tasks/<task_id>/measurements.json`. Directory key is RunUid. Recovery distinguishes pending, durable and finalized writes. |
| `adapters/results.py`, `launch_facts.py`, `timeline.py`, `checks.py`, `energy.py`, `current_rates.py` | M02 pinned reader/recorder, M07 frozen inputs, M11 durable timeline, M08 phase-scoped summaries, M18 closed receipt-bound observations validated against its complete receipt and M02 source digests, and M04 cached preview respectively. Retained record layout belongs to M02. |
| `adapters/event_wiring.py` | Bind M05/M08 acknowledged ports and the three singular run events. Publish observational `measurements.*` events; register bare `measurements` topic/snapshot provider with M11. No `runs.*` event or event-name-as-topic subscription. |
| `adapters/rpc.py` | Exact DTO mapping and method/topic registration; shared numeric JSON-RPC envelope with namespaced `data.code`. No float sort key substitutes for an authoritative exact value. |
| `<invocation dir>/usage.jsonl`, `measurements.json` | Planning/judging accounts in M12/M16 allocated directories; distinct from sealed competitor records. |

M10 owns no subprocess. Its journal is recoverable working state; M02 is authoritative for finalized/exported facts. Pure projections, alternative tariffs and display conversions write nothing to a retained record. Rate snapshots are never upgraded from the current catalog on import/read.

### 2. API surface (`measurements.*`)

Every listed method is a read query; there are no public recording commands/jobs. Setup draft validation accepts display currency before launch; retained analysis requests do not. Run methods take `run_uid: RunUid`; CLI labels are resolved unambiguously through M02 before invocation. All task/trial responses carry explicit ResultId/TrialRef.

| Method | Request → response | Errors / capabilities |
|---|---|---|
| `measurements.result` | `result_id, tariff?` → `ResultMeasurements` | unknown/unreadable result, invalid tariff; `can_timing`, `can_cost_basis`, `can_accounting`, row `can_open_task` |
| `measurements.task` | `result_id, task_id` → `TaskFormation` | unknown result/task, record unreadable |
| `measurements.timing` | `run_uid` → `RunTimingView` | unknown run; row `can_open` |
| `measurements.cost_bases` | `template_sha, filters: ResultFilters, tariff?` → `CostBasisTable` | unknown template, invalid tariff; row `can_open`, `can_accounting` |
| `measurements.trials` | `run_uid, configuration_id, tariff?` → `TrialSummaryDTO` | unknown run/configuration, invalid tariff; trial `can_open` |
| `measurements.accounting` | `run_uid, tariff?` → `AccountingView` | unknown run, invalid tariff; frozen currency/rates `editable=false`, `can_alternative_tariff` |
| `measurements.preview_accounting` | `AccountingDraft` → `AccountingPreview` | issues returned as data; `can_save` |
| `measurements.validate_accounting` | `AccountingDraft` → `AccountingDTO` | `measurements.invalid_accounting` with every field issue |
| `measurements.invocation` | `invocation_id` → `InvocationAccountDTO` | unknown invocation |

`AccountingDraft` is `{display_currency?: str, tariff_enabled: bool, tariff_per_kwh?: str, tariff_currency?: str}`; absent display currency means USD. `AccountingDTO={display_currency, tariff: TariffDTO | None}`. `TariffDTO={per_kwh: str, currency: str}`; omitted analysis tariff means recorded, supplied means alternative. `TariffChoiceDTO={alternative: TariffDTO | None}` uses null to reset. Unknown/invalid errors use `measurements.unknown_result`, `.unknown_task`, `.unknown_run`, `.unknown_configuration`, `.unknown_template`, `.unknown_invocation`, `.record_unreadable`, `.invalid_accounting`; records are never silently repaired. Internal faults also include `.scope_mismatch`, `.observation_conflict`, `.finalization_conflict`, `.finalized`, `.persistence_failed`, `.invalid_display_override` and `.telemetry_receipt_mismatch`. All travel through the shared typed error contract.

#### Shared DTOs (`axbenchmark.api.measurements`)

These are M10's authoritative types consumed intact by M02/M06/M13. API models preserve rational strings; a decimal display string is not an alternate accounting value.

| Model | Fields / invariant |
|---|---|
| `MeasuredDTO` | `exact: str \| None` reduced `n/d` (authoritative), `value: str \| int \| None` display-friendly, `unit`, `currency: str \| None`, `coverage`, `covered`, `expected`, `source`, `explanation`, `limitations: list[{code, message, trial?, task_id?}]`. No `sort: float`. Covered/expected counts state their task coverage; TrialSummary separately names expected/observed trials. Unknown has null exact/value; durations have a duration unit. |
| `RateUseDTO` | `currency`, `per_usd: str`, source `discovered`/`override`, `as_of`, `retrieved_at`, `source_url`, engine `label`; preserve missing-row provenance separately. USD identity has no conversion row. |
| `DisplayCurrencyDTO` | `{computed_in: "USD", display_currency, mixed: bool, label, missing_rates: list[str]}`. Mixed currency carries `measurements.mixed_display_currency`; never select a currency in the client. |
| `CostDTO` | `amount: MeasuredDTO` in USD, `display: MeasuredDTO` with explicit currency (present also for USD), `basis`, `basis_label`, `billing: BillingDTO`, `price_source`/date, `energy_scope`, `tariff_source: recorded \| analysis \| None`, `alternative`, `by_basis`, `conversion`, `display_rate: RateUseDTO \| None`, `limitations`. Billing is M04's frozen DTO including declarations; estimate labels never disappear. Aggregates add `contributors: list[CostContributorDTO]` when singular fields cannot represent all contributors. `by_basis` maps basis to reduced rational USD amount, not rounded text. |
| `CostContributorDTO` | ResultId/TrialRef/task if applicable, exact rational coefficient and USD amount, basis, billing, price/rate or energy evidence refs. Mean coefficients are `1/trial_count`; task sums use `1/1`. Preserve evidence when an aggregate singular source field is null or mixed. |
| `DurationDTO` | Same measured shape with exact duration, unit, coverage and sources; no cost basis. |
| `TrialSummaryDTO` | `run_uid`, `run_label`, configuration id, frozen `trial_count`, observed count/missing indices, ordered `{trial: TrialRef, result_id?, time: DurationDTO, cost: CostDTO, can_open}`; `cost: {mean, min, max: CostDTO}`, `time: {mean, min, max: DurationDTO}`, limiting TrialRefs and `currency: DisplayCurrencyDTO`. Unknown ranges are full unknown projections, never ranges computed from a surviving subset. |
| `TaskRowDTO`, `TotalRowDTO` | Explicit result/trial; task id/index/title (absent for total), independent process status/label, phase-keyed checks and selected check phase, time/input/cached/output/reasoning, `cost: CostDTO`, coverage, capabilities. Total has covered/expected tasks and configuration status; local configuration cost is shown separately from unknown API task costs. |
| `ResultMeasurements` | ResultId, RunUid/label, TrialRef, origin, full configuration header/frozen count, provisional/live flag, tasks/total, `configuration_cost`, optional trial summary, `PhasesDTO`, halt details, per-task sources/coverage, `currency: DisplayCurrencyDTO`, frozen rates/missing rates/tariff/alternative in `accounting`, `retention_state`, `finalization_error: ErrorDTO \| None`, notices/capabilities. |
| `TaskFormation` | ResultId/TrialRef/task, exposure/version, counted report entries and final flag, usage, reported cost, estimate terms in original currency and exact USD conversion, billing, task interval, phase-keyed checks, source/evidence refs and limitations. |
| `RunTimingView`, `PhasesDTO` | Run UID/label/template/machine, jobs, live flag, lanes keyed by TrialRef/ResultId with process/check/judging intervals and separate totals; experiment time and notices. Sealed execution timing and later retained lifecycle timing remain distinguishable. |
| `CostBasisTable` | Template, tariff choice, `currency: DisplayCurrencyDTO`, notices and rows with ResultId/TrialRef, run label/origin, frozen trial count, harness/model, full `CostDTO`, coverage explanation and capabilities. |
| `AccountingView` | Run UID/label, frozen AccountingDTO, recorded/missing rate rows (uses: price/display/tariff), used tariff/alternative flag, currency options and host/retained energy scope for the editor (static currency-code validation only; no current rate lookup in analysis), experiment/trial energy rows with exact kWh and CostDTO, includes-background/scope/source/coverage, currency/capabilities. |
| `AccountingPreview` | Issues, validated AccountingDTO if valid, currency options, cached current/missing rates and notices, host energy scope, `can_save`. No source refresh. |
| `InvocationAccountDTO` | Invocation/role/scope, usage and CostDTO, clearly labelled outside benchmark. |

Notices include `measurements.overlapping_categories`, `.partial_total`, `.no_cache_discount`, `.subscription_billing`, `.billing_unknown`, `.declared_billing`, `.mixed_basis`, `.energy_cost_basis`, `.parallel_energy_shared`, `.alternative_tariff`, `.no_rate_conversion`, `.mixed_display_currency` and `.historical_rate_unused`; eligibility information `cost_zero_unverified` does not itself choose ranking membership.

#### Events and subscriptions

Register the bare `measurements` topic and its revisioned projection snapshot. `measurements.task.recorded` carries ResultId/TrialRef/task and TaskRowDTO; `measurements.configuration.aggregated` carries ResultId/TrialRef/TotalRowDTO; `measurements.timing.updated` carries RunUid and optional TrialRef; `measurements.invocation.recorded` carries invocation/role/account. Payloads have stable object keys/revisions. No non-final usage total or live output-rate count is a measurement event. Required accounting is acknowledged through ports before these optional client notifications.

Use M11's typed `(epoch, seq)` cursor, watermark-before-snapshot handoff, revision upserts and replacement snapshots for resync/overflow. Filter matching result/trial after subscription; event names are not topic names. M10's snapshot and publication share the engine boundary so a stale replay cannot overwrite a newer projection. **[F04, F05]**

### 3. Requires from other modules

| Owner | Required contract and integration obligation |
|---|---|
| M02 | Pinned `EffectiveResult`/`TrialGroup`/`RetainedRun`, readers and PublicationView; durable measurement/evidence append and finalization receipt, rejection after seal, UID/label resolver, results topic/events and exported launch/evidence bundle. |
| M04 / M07 | Frozen pricing/billing/rates/accounting/roster through `LaunchRecords.get(run_uid)`; cached `ExchangeRates` only in setup. Setup stores CurrencyEnergy's validated draft through `configs.set_execution`. |
| M05 | Awaited `InvocationObservationSink.accept`, stable invocation entry IDs, documented usage/cost currency/exposure, scoped exit/duration facts; caller-supplied separate planner/judge accounts. |
| M08 | Exact `VerificationObservation` with `verification:<id>:summary`, await/persist M10 receipt before completion; `CheckSummaries.for_trial(trial, phase)` reads retained checks. TaskChecks navigation carries result/trial/task/phase. |
| M11 | Finish/join producers; durable singular run-phase/state events and timeline; await drain → M18 close → finalize → M02 seal; terminal readiness/recovery and later append-only judging timing. Shared client/topic registry/cursor infrastructure. |
| M18 | Its exact published `TelemetryFinalizationReceipt` schema, retained unchanged in MeasurementSet energy evidence; closed receipt-bound observations and canonical input/collection/windows/hardware digest definitions, stable hardware operation IDs and frozen run/trial/result bindings. Validate before final accounting; reset/wrap/gap coverage stays partial. Host scope is preview only; M10 does not implement collectors or a receipt substitute. |
| M06 | Consume `CostAnalysis.display_currency_for(pinned_runs)`, `ranking_cost(EffectiveResult, tariff, display_currency=None)` and `MeasurementReader.trial_summary(TrialGroup, tariff, display_currency=None)` exactly; retain DTO metadata and apply all-trial zero/coverage eligibility gates. |
| M12 / M16 | Separate invocation accounts outside benchmark totals; later judge accounts never reopen sealed execution facts. |
| M13 / M17 | Report and ZIP consume M02 retained facts, frozen rates and original scope/coverage; imported analysis projects those facts without rerunning collection. |
| M14 / M15 | UID-resolving CLI, common typed errors; TUI foundations/subscription manager, feature navigation and wide/compact harness. |

### 4. Screens

Owned artboards: Measurements (wide and compact), MeasurementsPartial, TimingPhases, CostBasis, CurrencyEnergy ([navigation §15](../design/wireframe-tui/navigation.md)). Wireframe sources/previews remain unchanged by this spec task; missing-rate, exact-zero, phase/trial and finalization-pending states need design reconciliation before screen acceptance. Every screen is a view over `measurements.*` responses. No screen sums a column, picks a basis, decides coverage, converts currency or prices energy; it formats engine values, renders capability flags with `check_action`, and shows typed errors verbatim.

Formatting rules shared by the view models (presentation only): `coverage == "unknown"` renders `—` with class `-unknown`, or `?` when the limitation is `not_exposed`; `partial` renders the value plus ` ▲` with class `-partial` and the engine's `explanation`; money from `CostDTO.display` with its currency code (`$0.21` only for USD), tokens `702k` / `1.23M`, durations `m:ss` / `h:mm:ss`; basis text `estimate · complete`, `reported · 5/7 ▲`, `energy estimate · GPU + CPU package` from `basis`, `basis_label`, `coverage`, `covered`, `expected`; a value with `alternative: true` carries class `-alternative` and the label "alternative tariff"; a cost whose `billing.declared_by_user` is true shows `billing.label` after the basis text (e.g. `verified $0 · api · declared by user`); money is shown in the display currency from `display` with its ISO code (`$0.21` for USD, otherwise the code and amount, e.g. `COP 850`, `EUR 0.19`), and the USD value from `amount` beside it in detail panes; an unknown `display` renders `—` with the `no_rate_conversion` message. Order of rows comes from the response.

#### MeasurementsScreen — artboards Measurements, MeasurementsPartial

`MeasurementsScreen(Screen)` in `tui/screens/measurements.py`, constructor `MeasurementsScreen(result_id: str)`. View model `tui/viewmodels/measurements.py`:

```python
@dataclass(frozen=True)
class MeasurementsVM:
    result_bar: str; halted: bool                    # #result-bar ("trial 2 of 3" when trial_count > 1), class -halted when status is not complete
    rows: list[MeasureRowVM]                         # key = (TrialRef, task_id); cells + per-cell class "", "-partial", "-unknown"
    total: MeasureRowVM                              # Σ row, bold
    overlap_hint: str                                # from measurements.overlapping_categories notice
    formation: list[tuple[str, str]] | None          # #formation, selected task (wide only)
    phases: list[tuple[str, str]]                    # #phases
    halt: NoticeVM | None                            # #halt (MeasurementsPartial)
    coverage: list[tuple[str, str]] | None           # #coverage, shown when total coverage is not complete
    accounting: list[tuple[str, str]]                # #accounting (compact only): display currency, rate label, tariff
    trials: list[tuple[str, str]] | None             # #trial-summary (wide): explicit trials and `trials.cost/time` mean/min/max
    tariff_alternative: bool                         # alternative-tariff notice
    capabilities: MeasurementCapabilities

def build_measurements_vm(m: ResultMeasurements, f: TaskFormation | None, compact: bool) -> MeasurementsVM
```

| Item | Behavior |
|---|---|
| Load | On mount, in a worker: `measurements.result(result_id, tariff?)`; then `measurements.task(result_id, <highlighted task>)` for `#formation` (wide only). An analysis tariff, when set, is screen state passed back by CurrencyEnergyScreen and reissued with `measurements.result`. Money is always in the run's frozen display currency. |
| Subscriptions | When `live`: `events.subscribe(["measurements"])` using M15’s typed cursor/revision manager, matching task/aggregate events by ResultId/TrialRef and timing events by RunUid; each event re-issues `measurements.result`. Unsubscribe on unmount. |
| ContentSwitcher | `#measurements` / `#measurements-loading` / `#measurements-empty` (no task has finished: "No measurements yet") / `#measurements-error` (typed error, e.g. `measurements.record_unreadable`, message verbatim; nothing is estimated in its place). |
| Widgets | `Static #result-bar`; `DataTable #measurements` (columns `#`, Task, Process, Checks, Time, Input, Cached, Output, Reason., Cost, Basis · coverage; compact: `#`, Task, Process, Time, In, Out, Cost, Basis); `Static #overlap-hint`; `Static #formation`, `Static #phases`, `Static #trial-summary` (hidden in `Screen.-compact`; `#trial-summary` only when `trials` is present); `Static #halt .notice.-error` from `halt`; `Static #coverage .kv` from `sources`; `Static #accounting` (compact); `Horizontal .actions` with `Button #timing` and `Button #cost-basis`. For a local endpoint the Σ row's Cost cell shows `configuration_cost`. |
| `DataTable.RowHighlighted` | Debounced `measurements.task(result_id, task_id)`; updates `#formation` only. The Σ row issues no call. |

| Binding | Action | API call |
|---|---|---|
| `esc` | `app.pop_screen` | none |
| `t` / `Button #timing` | `timing` | push `TimingScreen(run_uid)`; `check_action` returns `capabilities.can_timing` |
| `b` / `Button #cost-basis` | `cost_basis` | push `CostBasisScreen(template_sha, filters=None)`; enabled by `can_cost_basis` |
| `u` | `accounting` | push `CurrencyEnergyScreen(mode="analysis", run_uid=run_uid, alternative=<current tariff>)` (recorded display currency and rates read-only, analysis tariff only); on dismiss with a `TariffChoiceDTO` re-issue `measurements.result(result_id, tariff=…)` (omitting `tariff` when the choice resets it); enabled by `can_accounting` |
| `enter` | `open_task` | push `TaskChecksScreen(result_id, trial, task_id, phase)` (M08); enabled by the row's `can_open_task` |
| `tab` | `focus_next` | none |

The two artboards are one screen: MeasurementsPartial is a `ResultMeasurements` with `halt` set and partial/unknown coverage. Finalization-pending/error notices come from its explicit retention state/error; task values alone never imply completion.

#### TimingScreen — artboard TimingPhases

`TimingScreen(Screen)` in `tui/screens/measurements.py`, constructor `TimingScreen(run_uid: str)`. View model `tui/viewmodels/timing.py`: `TimingVM {run_bar, ticks: list[tuple[float, str]], lanes: list[LaneVM(label, segments: list[(start_frac, end_frac, kind)])], judging_lane, rows: list[PhaseRowVM], sum_row, experiment_row, notes: list[str]}`, built by `build_timing_vm(view: RunTimingView, width: int)`. Fractions are interval offsets divided by the experiment duration from the engine (zero/unknown duration renders an empty labelled timeline without division); drawing █ (task process), ▒ (verification) and ░ (judging) in `Static #timeline` is rendering, not measurement.

| Item | Behavior |
|---|---|
| Load | `measurements.timing(run_uid)`. |
| Subscriptions | When `live`: subscribe to topic `measurements`; matching `measurements.timing.updated` filtered to `run_uid` re-issues `measurements.timing`. |
| ContentSwitcher | `#phase-table` / `#phase-table-loading` / `#phase-table-error`. |
| Widgets | `Static #run-bar`, `Static #timeline .pane`, `DataTable #phase-table .bordered` (Configuration, Benchmark elapsed, Queue, Planning, Verification, Judging, Status; Σ row and Experiment row last), `Static #phase-note` from `notices`. |

| Binding | Action | API call |
|---|---|---|
| `esc` | `app.pop_screen` | none |
| `enter` | `open_result` | push `MeasurementsScreen(row.result_id)`; enabled by the row's `can_open` (false on Σ and Experiment rows) |
| `tab` | `focus_next` | none |

#### CostBasisScreen — artboard CostBasis

`CostBasisScreen(ModalScreen[None])` in `tui/screens/results.py`, constructor `CostBasisScreen(template_sha: str, filters: ResultFilters | None)`, pushed by `b` from ResultsScreen (M02) or MeasurementsScreen. View model `tui/viewmodels/cost_basis.py`: `CostBasisVM {rows: list[BasisRowVM(result_id, model with ↓ for imported, cost text, basis text, billing text, coverage text, classes)], currency_note: str | None, legend: list[tuple[str, str]]}`. `currency_note` shows `CostBasisTable.currency.label` with the frozen rate labels, or the `measurements.mixed_display_currency` message (values in USD because the runs froze different display currencies). The `#basis-legend` text describes the basis labels, including mixed and unverified-zero estimate states, plus "declared by user", and is static presentation.

| Item | Behavior |
|---|---|
| Load | `measurements.cost_bases(template_sha, filters, tariff?)`. Rows show `trial_index` of `trial_count` when greater than 1, the cost in the display currency and, for a declared billing kind, `billing.label`. |
| Subscriptions | Subscribe to topics `results` and `measurements`; matching `results.result.sealed`, `results.import.registered` and `measurements.configuration.aggregated` re-issue the query. Typed cursor/revision resync replaces state. |
| ContentSwitcher | `#basis-table` / `#basis-table-loading` / `#basis-table-empty` / `#basis-table-error`. |

| Binding | Action | API call |
|---|---|---|
| `esc` / `Button #close` | `dismiss(None)` | none |
| `tab / shift+tab` | `focus_next / previous` | none |
| `enter` | `open` | `dismiss(None)`, then push `MeasurementsScreen(row.result_id)`; enabled by `can_open` |
| `u` / `Currency and energy…` | `accounting` | push `CurrencyEnergyScreen(mode="analysis", run_uid=row.run_uid, alternative=<current tariff>)`; on dismiss with a `TariffChoiceDTO` re-issue `measurements.cost_bases(…, tariff=…)`; enabled by `can_accounting` |

#### CurrencyEnergyScreen — artboard CurrencyEnergy

`CurrencyEnergyScreen(ModalScreen[AccountingDTO | TariffChoiceDTO | None])` in `tui/screens/setup.py` (the wireframe's `Accounting` result type is `AccountingDTO`). Constructor `CurrencyEnergyScreen(mode: Literal["setup", "analysis"], initial: AccountingDTO | None = None, run_uid: str | None = None, alternative: TariffDTO | None = None)`. It holds the display currency and the electricity tariff, and shows the exchange rates that will be (setup) or were (analysis) frozen; it never edits a rate (rates are supplied in M04's catalog, `RatesScreen`). Like `WeightsScreen` (M06) it is a pure editor. In `setup` mode, pushed by `c` from SetupScreen (M07), it edits the display currency and the tariff, and SetupScreen stores the returned `AccountingDTO` through `configs.set_execution`. In `analysis` mode, pushed by `e` from ResultsScreen (M02) and `u` from MeasurementsScreen and CostBasisScreen, it shows the run's frozen display currency, rates and tariff read-only and lets the user enter an alternative tariff only, returning `TariffChoiceDTO {alternative: TariffDTO | None}` (`None` resets to the recorded tariff) to its caller, which re-issues its query. Analysis mode has no display-currency or rate input. View model `tui/viewmodels/currency_energy.py`:

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
| Load | `setup`: `measurements.preview_accounting(<initial as draft>)`. `analysis`: `measurements.accounting(run_uid, tariff=alternative)`. |
| Widgets | `Static #primary` ("Costs are computed and ranked in USD"); `Select #display-currency` from `currency_options` (default `USD`); `DataTable #rates` (Currency, Rate, Source, Date, Used for) from `current_rates` (setup, "current catalog rates · frozen at launch") or `recorded_rates` and `missing_rates` (analysis, "frozen at launch"), unknown rows as `? unknown`; `Static #rate-notices .notice.-warning` (currencies without a rate, so their converted values will be unknown; the historical README rate is not used; rates are supplied in the catalog); `Vertical #tariff` with `Checkbox #tariff-enabled`, `Input #tariff-per-kwh`, `Select #tariff-currency` (ISO 4217 codes from `currency_options`); `Static #energy-scope .kv` (what is measured, what is not, and that a local configuration's cost is the energy estimate only in sequential runs); `Static #energy-costs` (analysis); `.dialog-actions` with Cancel and `Button #save`. In `analysis` mode `#display-currency` is disabled and shows the frozen value, the tariff inputs hold the alternative (prefilled with the recorded tariff), `#save` reads "Apply as alternative" and a `Button #reset` "Reset to recorded" appears. |
| `Input.Changed`, `Checkbox.Changed`, `Select.Changed` | `setup`: debounced `measurements.preview_accounting` with the raw text of every input (the rates table follows the chosen display and tariff currencies). `analysis`: debounced `measurements.accounting(run_uid, tariff=<raw text>)`. Issues set `-invalid` on the named field. |
| ContentSwitcher | `#currency-energy` / `#currency-energy-loading` / `#currency-energy-error`. |

| Binding | Action | API call |
|---|---|---|
| `esc` / Cancel | `dismiss(None)` | none |
| `tab / shift+tab` | `focus_next / previous` | none |
| `ctrl+s` / `Button #save` | `save` | `setup`: `measurements.validate_accounting(draft)`; on success `dismiss(AccountingDTO)`. `analysis`: `measurements.accounting(run_uid, tariff=…)`; on success `dismiss(TariffChoiceDTO(alternative=tariff))`. `measurements.invalid_accounting` marks fields and stays open. `check_action` returns `True` or `None` (dimmed) from `can_save` in `setup` mode and from `can_alternative_tariff` in `analysis` mode. |
| `Button #reset` (analysis) | `reset` | none; `dismiss(TariffChoiceDTO(alternative=None))`. |

#### Screens owned elsewhere that consume M10

| Screen | Owner | Calls |
|---|---|---|
| ResultScreen, Outcomes tab (`#task-outcomes`, `#coverage`) | M02 | `measurements.result` for the measurement columns and coverage text, same formatting rules; `measurements.trials` for per-trial rows with mean and min–max. |
| RankingsPane, ScoreBreakdownScreen | M06 | Cost and time arrive inside `scoring.*` responses, read by M06 through `MeasurementReader`. |
| Review detail, planning screens | M12, M16 | `measurements.invocation` for judging and planning cost, labelled as outside the benchmark. |

All screen queries discard stale responses after selection changes. Subscriptions unmount without mutation; resync/epoch changes replace projections before replay. Timing uses interval fractions solely for drawing. Neither a view model nor a widget computes currency, eligibility, totals, minima or trial summaries. Finalization-pending and typed persistence errors remain visible; they never show a completed/export-ready result.

### 5. CLI

M14's registry-generated `measurements` group exposes the read API; no new scheduling command belongs to M10.

| Command | Method |
|---|---|
| `axbenchmark measurements show RESULT_ID [--task ID] [--tariff AMOUNT --tariff-currency CODE] [--json]` | `measurements.result` or `measurements.task` |
| `axbenchmark measurements trials RUN_REF --config ID [--json]` | `measurements.trials` after explicit UID resolution |
| `axbenchmark measurements timing RUN_REF [--json]` | `measurements.timing` |
| `axbenchmark measurements cost-basis --template SHA [filters] [--tariff AMOUNT --tariff-currency CODE] [--json]` | `measurements.cost_bases` |
| `axbenchmark measurements accounting RUN_REF [--tariff AMOUNT --tariff-currency CODE] [--json]` | `measurements.accounting` |
| `axbenchmark measurements check-accounting [--display-currency CODE] [--tariff AMOUNT --tariff-currency CODE] [--json]` | `measurements.validate_accounting`, before launch |

`RUN_REF` accepts a UID or unambiguous label; collisions expose origin/UID and never select silently. Human output preserves unknown/partial values, exact basis/billing/rate labels, full trial scope and mixed-currency notice. JSON preserves authoritative rational strings and typed errors. Analysis commands have no currency/rate option; only prelaunch validation accepts display currency. Alternative tariff is labelled and leaves records unchanged. CLI event following uses registered topics/cursors, never supplies accounting persistence.

### 6. Headless verification and parent gate

All tests below are proposed implementation acceptance, not claims of existing runtime tests. The [children](implementation/M10/01-task-accounting.md) name owned source/test files and executable target commands.

| Level | Required checks |
|---|---|
| Domain | Cumulative 100/200/300 then final 300 counts 300 once; delta 100+200=300; duplicates deduplicate, conflicting entry fails, mixed unresolvable stream stays partial. 702000 input × 0.25/M + 44000 output × 0.80/M = exact `2107/10000` USD (display 0.21); reasoning 17000 is inside output. Unknown/unexposed categories never become zero. Reported amount wins; subscription/unknown zero reports estimate where possible; positive unknown-billing cost survives. Zero price and zero energy remain unverified zero with original basis; verified reported zero needs complete known non-subscription evidence. |
| Currency/trials | COP `4000`: 4000 COP → `1/1` USD → `4000/1` COP. EUR rate `0.8`: EUR 0.80 → USD 1 → EUR 0.80. Different frozen same-currency rates affect display only; mixed currencies force USD notice. Missing display rate leaves USD known; missing price/tariff rate makes cost unknown. Three trial costs 1,2,2 have mean `5/3`, min 1, max 2; any missing/unknown trial makes summaries unknown; any partial makes them partial, naming full TrialRefs. Same-label U/c and V/c never combine. |
| Energy/timing | 0.5 kWh × 800 COP/kWh ÷ 4000 = exact USD `1/10`, with CPU/GPU scope and coverage intact. Partial reset/gap evidence remains partial; parallel energy never enters local configuration cost. Tariff absence then alternative 1000 COP gives USD `1/8` without a write. Task durations 1000+2000=3000 ms exclude 500 ms verification and 700 ms judging. Concurrent experiment duration is independently observed. |
| Durable application | Delay usage, M08 acknowledgement, phase commit, telemetry close, M02 append and receipt independently; no seal/export/report readiness overtakes them. Stop/interruption/invalidation use same barrier. Crash after each journal/evidence/measurement/receipt/seal boundary; exact retry deduplicates, changed bytes fail, earlier sealed trials stay unchanged. Late new observation is rejected; no measurement append after seal. Phase-keyed T1 checks remain distinct across trial 1/2 and final verification. Retain M18 receipt unchanged through M02/export/import; verify all input/collection/windows/hardware digests and stable operation IDs. Mutated sources, cutoff, roster/trial/result bindings or receipt fields fail before final measurement append/receipt; off/unavailable receipts keep every expected envelope and unknown energy. |
| API/registry | Both real clients with fake producers round-trip exact values/full DTOs/errors. Topic `measurements` and exact singular run events validate; stale plural events fail registration. Snapshot race, epoch restart and overflow preserve latest projections. Analysis request schemas reject currency/rates; preview/validate permit the prelaunch display field. Declared billing/source/rate metadata survives every mean/min/max/minimum projection handed to M06. |
| Screens | Pure view models plus Textual Pilot for all five board families, wide and 80×24: loading/empty/error/complete/partial/unknown/provisional; capability bindings; explicit historical trial/phase navigation; frozen currency and read-only `1 USD = 4000 COP` rates; tariff apply/reset once; no client arithmetic or engine imports. |

**Real integration gate:** compose real M02 retention, M04/M07 frozen evidence, M05 acknowledged usage, M08 checks, M10 finalizer, M11 scheduling/recovery and M18 closed telemetry. Run repeated trials with delayed observations and scoped sequential energy, immediately export/report after readiness, import through M17 and compare exact accounting, billing/rate provenance, trial means, scopes and retained digests. Repeat stop/interruption and parallel-local cases. Real M06 rankings must exercise verified/unverified zero and mixed display currencies; M13 must preserve these values offline. Fixture-only ports cannot satisfy this gate.

Parent completion also requires M10.3 screens through M15, M14 CLI and real M13/M17 consumers. Harness versions, public pricing/rate sources and real macOS/Linux collectors require their owners' current-source/platform verification before claiming support; this spec edit certifies none. If unavailable, record that integration as pending/unsupported with its evidence, rather than declaring M10 complete.
