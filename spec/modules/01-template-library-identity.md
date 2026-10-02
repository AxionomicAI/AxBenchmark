# M01 — Template library and immutable identity

## Purpose and authority

This proposed contract gives implementers and reviewers the reusable benchmark definition and identity rules for AxBenchmark, a Python terminal application for developers and teams comparing coding-agent harnesses on representative, multi-step work. Users select or create work, execute harness/model configurations, collect measurements, obtain independent LLM reviews, and produce interactive reports; matching template identities enable results from other machines to join comparisons. This document describes required future behavior, not implemented functionality. [SPEC.md](../SPEC.md) remains authoritative, and these module boundaries do not prescribe internal architecture. **R001, R002, R003**

The library supports built-in, user-created, and imported templates, with the existing inventory application as its default. Independent execution on other machines and ZIP exchange are supported. Remote orchestration, hardware provisioning, and native Windows support are outside initial scope. Historical applications, results, and reviews remain preserved. **R008, R015**

## Conceptual data contracts

These are semantic contracts, not serialized schemas. **R017, R018, R115**

| Concept | Required information and relationship |
|---|---|
| Library entry | Name, description, project type, task count, revision/SHA-256, saved configurations, and available results; includes built-in, custom, and imported entries. |
| Template revision | Approved project specification, ordered task prompts, starting files/fixtures, acceptance checks, execution protocol/rules, setup/start/stop instructions, and grading rubric. It is the reusable definition of the work. |
| Baseline | Actual starting content, including the captured snapshot for an existing repository; an origin-machine path cannot substitute for packaged content. |
| Dependency declaration | Required runtime dependencies; installed dependency directories and credentials are excluded from the portable definition. |
| Run configuration | Harnesses, providers, models, efforts, environment settings, judge, and scoring weights associated with one exact template revision. |
| Result reference | Recorded outcome of one configuration on one machine, bound to the exact revision it ran. |
| Identity manifest | Versioned canonical representation of benchmark-defining metadata and payload, normalized relative paths, and each payload file's content digest. |

The manifest and full frozen definition must be available to portable exchange; template ZIPs carry them together. This module supplies their identity semantics, while package handling belongs to [M17](17-zip-exchange.md). **R115, R118**

## Library and revision operations

**Browse and select.** Present every required library field and allow selection of an approved built-in, imported, or custom template. Executing that selection reuses its frozen tasks without invoking a planner or regenerating them. The default is the existing seven-task inventory benchmark, runnable without planning. **R018, R030, R136**

**Create.** Accept a multiline project prompt, frontend/backend/fullstack choice, and empty-project or existing-repository-revision baseline choice through [M16](16-custom-template-planning.md). Approval supplies the frozen definition to this module. **R030**

**Duplicate and revise.** Users can duplicate or edit templates into revisions without modifying the approved original. Task, check, baseline, and rubric edits produce a new template revision; identity changes follow the content rules below. Preserve existing inventory task prompt text and its bundled versioned acceptance checks and web rubric. A six-task variant is a different template, not the default seven-task benchmark. [M09](09-default-inventory-benchmark.md) defines that default's task behavior. **R018, R028, R136**

**Configure.** Store selections per template revision rather than as one global harness selection. Users can add or change configurations before a new run without changing template content or overwriting previous results. Imported work can use available destination harnesses: originating executable paths, credentials, and hardware are not requirements of the template. Selection defaults express convenience rather than model-quality recommendations. **R019, R037, R136**

**Exchange and inspect results.** Expose import/export and the results associated with a revision. Delegate package validation to [M17](17-zip-exchange.md) and result retention to [M02](02-retained-results-comparability.md). Preserve historical material; matching names or reported task counts cannot establish a verified matching hash for historical runs. **R015, R018, R028**

## Identity and launch invariants

Define one versioned, deterministic canonical-manifest serialization and compute its SHA-256. Identical definitions must hash identically on macOS and Linux. ZIP compression, entry order, timestamps, local absolute paths, machine identity, and display-only naming do not determine identity. **R118, R141**

The hash covers benchmark-defining metadata and payload, specifically the approved specification, ordered prompts, acceptance checks, required baseline files, execution protocol, and rubric definitions. Changing task order or any covered content creates a new revision. **R067, R118, R119**

Harness/model/effort selections, clean/current settings, concurrency, judge selection, pricing, and adjustable scoring weights belong to run or analysis configuration and do not change the template hash. They remain recorded and visible as comparison differences. Different machines also leave template identity unchanged. **R119, R141**

Before execution, recompute the approved template's SHA-256 and bind each result to that identity. Freeze the run configuration and original scoring weights separately before launch. Every configuration in a comparison receives the same approved task suite and grading profile. If template inputs change during execution, invalidate the result's claim to that template; do not silently assign a different identity to make the run appear valid. **R037, R067**

## Integration and unresolved choices

[M07](07-run-configuration.md) owns revision-scoped launch selections and their freeze. [M11](11-run-orchestration.md) enforces active-run immutability and records detected identity violations. [M15](15-terminal-interface.md) exposes the library workflow. [M02](02-retained-results-comparability.md) retains result links, and [M17](17-zip-exchange.md) verifies cross-machine packages against the canonical identity. These contracts jointly support the selection-to-report workflow. **R002, R017, R018, R019, R067, R141**

The source does not specify the manifest's exact fields or serialization, path-normalization details, revision naming, storage layout, or representation of a duplicate with unchanged benchmark content. Those choices require a documented design that satisfies deterministic identity and immutable revisions; no additional schema or duplicate-hash policy is imposed here. **R003, R018, R118**

## Acceptance criteria

- The library shows all required fields for built-in, custom, and imported templates; the default seven-task inventory template runs without planner calls. **R008, R018, R028, R136**
- Creating, duplicating, revising, importing, and exporting work preserves existing revisions and historical artifacts; independent saved configurations do not overwrite results. **R015, R018, R019, R136**
- Changing each benchmark-defining input, including task order, changes its digest; changing only excluded run settings, machine, or display-only name does not. **R118, R119, R141**
- Identical template content retains its SHA-256 across macOS/Linux and ZIP repackaging; the package contains the complete baseline and dependency declarations without installed dependency directories or credentials. **R115, R118, R141**
- Launch recomputes identity, freezes inputs and separate configuration/weights, and binds results accordingly. A detected input mutation invalidates its template claim without relabeling it. **R067**
- Imported templates can be configured for destination harnesses without origin-machine paths, credentials, or hardware, while historical names/task counts alone never confer verified identity. **R019, R028**
