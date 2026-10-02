# AxBenchmark module specifications

These proposed module contracts decompose [the product specification](../SPEC.md) for engineers implementing AxBenchmark. They describe required behavior, not existing implementation. Module boundaries are a documentation organization choice, not a prescribed architecture.

Read the relevant module to implement its behavior and integration contracts, then use its acceptance criteria to verify the result. The original specification remains authoritative; unresolved implementation choices must not be presented as new product requirements.

## Modules

| Module | Contract |
|---|---|
| M01 | [Template library and immutable identity](01-template-library-identity.md) |
| M02 | [Retained results, provenance, and comparability](02-retained-results-comparability.md) |
| M03 | [Environment discovery and readiness](03-environment-readiness.md) |
| M04 | [Model, effort, and capability catalog](04-model-catalog.md) |
| M05 | [Headless harness execution and isolation](05-harness-execution-isolation.md) |
| M06 | [Weighting, eligibility, and rankings](06-scoring-rankings.md) |
| M07 | [Run configuration and launch validation](07-run-configuration.md) |
| M08 | [Acceptance verification and evidence](08-verification-evidence.md) |
| M09 | [Default seven-task inventory benchmark](09-default-inventory-benchmark.md) |
| M10 | [Execution measurements and cost accounting](10-measurements-cost.md) |
| M11 | [Run scheduling and persistent lifecycle](11-run-orchestration.md) |
| M12 | [Independent quality judging](12-quality-judging.md) |
| M13 | [Standalone interactive HTML report](13-standalone-html-report.md) |
| M14 | [Command-line and unattended access](14-command-line-interface.md) |
| M15 | [Terminal user interface](15-terminal-interface.md) |
| M16 | [Custom template planning and baseline capture](16-custom-template-planning.md) |
| M17 | [Portable ZIP exchange and validation](17-zip-exchange.md) |
| M18 | [Optional CPU and GPU monitoring](18-hardware-monitoring.md) |

## Coverage and delivery

- [Requirement coverage](TRACEABILITY.md) maps every source unit to its module owners.
- [Suggested development sequence](DEVELOPMENT-SEQUENCE.md) orders implementation and integration checks.

Module IDs and filename prefixes follow the recommended development order, from M01 through M18. Specifications contain prose, contract tables, and optional Mermaid diagrams only.

## Shared boundaries

- M01 owns frozen template identity; M07 owns separately frozen launch settings; M02 retains results and provenance. Changing analysis weights cannot rewrite any original record.
- M03 reports local prerequisites; M04 reports model/effort capabilities; M05 executes supported headless harness invocations. Discovery does not establish successful authentication or verify effective settings by assumption.
- M11 owns scheduling and persistent lifecycle; M05 supplies invocation and process-isolation behavior. TUI/CLI attachment observes execution without owning its lifetime.
- M08 determines observable task verification; M10 records execution measurements; M12 supplies independent raw quality reviews. Process success, verified behavior, and quality grades remain distinct.
- M06 computes eligibility and scores; M15 and M13 expose the same analysis contracts. Template identity, judge groups, missing-data rules, and original weights survive presentation and filtering.
- M17 validates portable data against M01 and M02. Importing data cannot implicitly execute scripts, run models, or certify that an external execution was faithful.
- M18 contributes optional measurements with explicit scope and coverage. Collector failure cannot make an otherwise valid benchmark unavailable.
