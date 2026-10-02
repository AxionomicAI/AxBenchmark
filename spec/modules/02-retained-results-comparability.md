# M02 — Retained results, provenance, and comparability

Status: proposed feature contract derived from [the product specification](../SPEC.md). This module specifies behavior to implement, not existing functionality.

## Purpose and boundary

AxBenchmark is a Python terminal application for comparing coding-agent harnesses on multi-step software work. Users reuse a template or create one from a project prompt, run selected harness/model configurations, collect measurements, obtain independent LLM reviews, and generate an interactive report. M02 preserves those outcomes and admits other machines' results only to comparisons with matching template SHA-256 identities. **R002**

Results extend the README methodology: measured cost and time, separate quality assessment, and rankings for different priorities. They describe complete harness/model/environment configurations, not isolated model capability. Independent execution on another machine and ZIP exchange are supported; remote orchestration, hardware provisioning, and native Windows support are outside initial scope. Preserve historical applications, results, and reviews. **R004, R015**

Engineers implementing retention should use this contract to preserve enough information for subsequent inspection, exchange, and analysis. It specifies conceptual information and operations, without choosing a persistence technology, record schema, or deletion policy.

## Retained information contract

A template defines the specification, ordered tasks, starting files, acceptance checks, execution protocol, and rubric. A run configuration selects harnesses, providers, models, efforts, environment settings, judge, and weights. Each result records **one configuration on one machine**, linked to its exact template revision. A run identifier identifies the experiment used by run-level operations; a result identifier identifies an individual outcome within it. Distinct runs of an unchanged configuration remain distinct outcomes. **R017, R122**

Retain these linked information groups; they are not a mandated storage schema:

| Group | Required retained information |
|---|---|
| Definition and launch | Approved exact template and full SHA-256; packaged baseline and its identity; resolved configuration; catalog metadata used at launch; original scoring weights. Reusable configurations remain associated with their pinned template revision, with configurations and scoring presets persisted in YAML by [M07](07-run-configuration.md). **R066, R134** |
| Origin and execution | Source result identifier, originating machine identity and label, hardware/OS details, local/imported provenance, harness versions, timestamps, and configuration details sufficient to expose model/effort, environment policy, concurrency, and judge selection. **R066, R116, R124, R143** |
| Measurements and outcomes | Normalized measurements, sources and coverage, cost bases, telemetry limitations, hardware samples, and task outcomes. Preserve process outcomes separately from passed, failed, or unverified acceptance checks, including missing prerequisites and broken verification infrastructure. **R076, R116, R124, R134** |
| Reviews and evidence | Original judge configuration and metadata, raw grades, review evidence and limitations, task evidence, logs, generated artifact/task snapshots, and available commit identities. Keep review grades distinct from process and verification outcomes. **R076, R082, R116, R134, R143** |

Credentials must not appear in exported settings, logs, or reports. Export only the selected run's required records and supporting material, excluding raw credentials and unrelated machine files. Preservation requirements do not authorize copying unrelated directories. **R066, R116**

## Operations and invariants

**Record and inspect.** Accept the frozen launch information and subsequent outcomes from execution, verification, measurement, and judging owners. Retain unavailable or incomplete observations with their coverage rather than inventing values. Every competitor receives identical approved inputs and an independent baseline; retaining or inspecting results must leave the source repository and historical benchmark artifacts untouched. Later analysis uses retained snapshots and the packaged baseline. **R076, R124, R134, R140**

**Import and re-export.** [M17](17-zip-exchange.md) validates packages before results join retained collections. A result ZIP contains the exact template, selected run's records and configuration, machine label and hardware/OS details, harness versions, timestamps, outcomes, measurements with coverage, original weights, judge metadata/grades, snapshots, and evidence, covered by a result-payload file-integrity manifest. Source result identifiers and provenance survive subsequent exports. **R116**

Reimporting the same template or identical result is idempotent. An identical import creates no duplicate; a different payload reusing an existing result identifier is rejected without overwriting the original. Distinct runs are retained even when their configuration matches. Different template hashes never enter one comparison or ranking. Integrity failures are surfaced through M17's rejection behavior without partially adding records. **R122**

Label results as locally produced or imported and retain execution evidence. Matching SHA-256 proves identity of the packaged benchmark definition; payload checks verify packaged data integrity. Neither certifies faithful third-party execution nor authentic measurements. Do not describe validated imports as execution certification. **R123**

**Compare.** Accumulate results for the same template, including compatible imports, and expose machine, harness/model/effort, environment policy, concurrency, and judge filters. Machine differences are intentional comparison inputs, not hash mismatches. Apply one common selected weight set to a combined report while retaining each result's original weights and grades. Keep cost bases, telemetry limitations, measurement conditions, and imported provenance visible; matching hashes do not establish equivalent conditions. **R035, R124, R143**

**Review again explicitly.** [M12](12-quality-judging.md) uses one fresh headless session per artifact, reviews configurations sequentially, and applies the same judge configuration and template rubric throughout a local comparison. Imported reviews retain their original judge details and evidence. An explicit request may add a fresh review with the selected judge, preserving the original and recording additional judging cost separately. Quality and combined rankings remain separate across different judge configurations. **R082, R143**

**Derive outputs.** Reporting, ZIP exchange, and alternative weighting operate from retained data without new model calls. Alternative analysis does not overwrite original results, grades, or weights. Hand accumulated artifact reviews and compatible results to [M13](13-standalone-html-report.md) for report generation; at completion, attempt to open the report and always display its location, including when opening fails. **R035, R124, R134**

## Integration dependencies

[M01](01-template-library-identity.md) supplies immutable template identity; [M16](16-custom-template-planning.md) supplies baseline capture; [M05](05-harness-execution-isolation.md) and [M11](11-run-orchestration.md) supply execution and lifecycle facts. [M08](08-verification-evidence.md), [M10](10-measurements-cost.md), and [M18](18-hardware-monitoring.md) supply evidence and measurement semantics. [M06](06-scoring-rankings.md) computes derived scores; [M15](15-terminal-interface.md) and [M14](14-command-line-interface.md) expose retained-result operations. M02 preserves these distinctions for every consumer.

## Acceptance criteria

- A saved result exposes every retained information group above, including launch catalog metadata, evidence, and independent process/check outcomes. **R066, R076, R116, R134**
- Import/re-export preserves origin and source identifiers; repeated identical imports add nothing, conflicts never overwrite, and separate runs remain distinguishable. **R116, R122, R123**
- Same-template comparisons filter all required dimensions and preserve judge groups, original weights/grades, cost bases, and telemetry limitations. Different hashes cannot mix. **R082, R122, R124, R143**
- With model access unavailable, saved results still support reports, ZIP exchange, and reweighting. Rejudging requires an explicit action, preserves the original review, and accounts for extra cost separately. Report completion attempts opening and always shows the location. **R035, R082, R134**
- Existing repositories and historical applications, results, and reviews remain unchanged after retention, analysis, or exchange. **R015, R140**
