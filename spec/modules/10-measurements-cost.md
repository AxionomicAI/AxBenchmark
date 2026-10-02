# M10 — Execution measurements and cost accounting

Status: proposed contract, derived from [SPEC.md](../SPEC.md). This module defines measurement meaning and accounting boundaries; it does not claim an implementation exists.

M10 provides measured cost and time for comparisons following the repository README's methodology and presentation, alongside a separate quality assessment. Every result describes a complete harness/model/environment configuration, including its execution conditions. Measurements must not be presented as evidence of isolated model capability. Rankings may support different user priorities, but their quality component comes from independent judging. [R004]

## Inputs, outputs, and dependencies

| Boundary | Conceptual contract |
|---|---|
| Execution inputs | [M05](05-harness-execution-isolation.md) supplies task process observations and available harness/provider usage and cost reports. [M11](11-run-orchestration.md) supplies task/configuration identities, execution status, scheduling context, and phase timing. Observations must remain associated with the task and complete configuration they describe. [R004, R078, R079] |
| Accounting inputs | Recorded pricing metadata from [M04](04-model-catalog.md) supports estimates where usage is known. An optional supplied COP exchange rate and optional electricity tariff are distinct inputs. [M18](18-hardware-monitoring.md) supplies energy observations with their actual scope and coverage. No rate or complete measurement is assumed when absent. [R080, R081, R114, R147] |
| Verification inputs | [M08](08-verification-evidence.md) supplies task verification results. M10 records them alongside execution status without deriving verification success from timing, token counts, or cost. Quality assessment belongs to [M12](12-quality-judging.md). [R004, R078] |
| Measurement outputs | Produce per-task records and configuration aggregates containing wall time, available input/cached/output/reasoning tokens, cost, verification results, and execution status. Include measurement source, coverage, and cost basis so [M02](02-retained-results-comparability.md), [M06](06-scoring-rankings.md), the TUI, and the report can preserve their meaning. [R078, R080, R081] |

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
