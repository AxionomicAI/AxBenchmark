# M07 — Run configuration and launch validation

Status: proposed requirements. This module defines reusable setup and the immutable settings handed to execution; it does not describe implemented functionality. [SPEC.md](../SPEC.md) remains authoritative.

## Purpose and scope

A template defines the specification, ordered tasks, starting files, acceptance checks, execution protocol, and grading rubric. A run configuration selects harnesses, providers, models, efforts, environment settings, judge, and scoring weights for that definition. A result records one configuration's outcome on one machine against the exact template revision. Keep these concepts distinct so users can vary execution choices without redefining benchmark work. **[R017]**

Persist reusable configurations per template revision and scoring presets in YAML. Save harness/model/effort choices for each benchmark, with every configuration pinning its template SHA-256. Users may add or edit configurations for a future run without changing that hash or overwriting previous results. ZIP exchange carries templates and results through [M17](17-zip-exchange.md). Imported templates can use destination-machine harnesses; originating executable paths, credentials, and hardware are not template prerequisites. **[R009, R019, R066]**

The library's existing seven-task inventory benchmark is the default and runs without generating tasks. Templates created, duplicated, revised, or imported through the library and planning modules also support their own saved configurations. Selecting an approved revision must preserve its approved task suite. **[R136, R037]**

## Configuration behavior

Load the selected revision's saved configurations or let users select harness/provider/model/effort combinations. Allow multiple entries for the same harness so distinct configurations can be compared. Default environment policy to clean settings and offer current settings. Apply the isolation semantics and limitations of [M05](05-harness-execution-isolation.md); do not silently change an unavailable clean policy to current settings. **[R032]**

Judge selection is independent of competitor selection. Preselect a valid saved judge harness/model/effort selection first, otherwise the planner configuration if planning was used, otherwise the first selected usable configuration. Resolve and validate the candidate using current readiness and capability information; an unusable candidate must not become an executable choice by assumption. Explain any unresolved selection before launch. The user can change the judge independently. Apply the template's rubric and one grading profile to every configuration in the comparison. Defaults are selection conveniences, never model-quality recommendations. **[R033, R037]**

Provide editable quality-category and cost/time/quality ranking weights, reusable presets, and restoration of defaults. Validate, normalize, and preview both sets using [M06](06-scoring-rankings.md), which owns numeric weight constraints and scoring and consumes the rubric categories and profile defaults defined in [M12](12-quality-judging.md). Both sets must be saved and reproducible; neither can remain unresolved when launching. Resolve the selected preset into the launch's actual weights so later preset edits cannot alter the run. **[R033, R066, R145]**

Before execution, show the complete setup: template identity, all competitor entries and their providers/models/efforts, environment policies, judge selection, grading profile, both weight sets, and execution settings supplied by the scheduling and isolation modules. Show relevant readiness and isolation limitations. The displayed setup and resolved launch settings must agree. **[R032, R033, R037]**

## Conceptual data and operations

Maintain three distinct records: reusable revision-scoped configuration choices, reusable scoring presets, and the resolved launch configuration. The resolved configuration includes all selections actually authorized for that launch and its original weights. Preserve the requested choices and capability evidence under the [M04 catalog contract](04-model-catalog.md); this module introduces no model identifiers, effort values, or catalog schema. **[R017, R066]**

Loading, adding, editing, and saving operate on reusable choices. Resolving and validating operate on a prospective launch. Freezing produces the immutable execution input; later configuration edits affect future runs only. Capture the pinned hash, resolved configuration, originating machine identity/details, and catalog metadata used at launch for [M02](02-retained-results-comparability.md) to retain with each result. Redact credentials from exported settings, logs, and reports, including diagnostic descriptions derived from configuration. **[R019, R066, R067]**

## Validation, failures, and invariants

Before execution, ask [M01](01-template-library-identity.md) to recompute the selected template's SHA-256 and verify the configuration's pin. Its immutable definition includes the approved specification, prompts, checks, rubric, execution protocol, and starting snapshot. A mismatched pin cannot launch as that claimed revision. Bind each result to the verified identity, then separately freeze the resolved configuration and original weights before execution begins. **[R067]**

All competitors use the same approved suite and grading profile. Configuration changes cannot alter those inputs. During execution, detected mutation of template inputs invalidates the result's claim to that template; never silently relabel the result with a newly computed identity. The execution lifecycle must preserve this invalidation and the original launch record. **[R037, R067]**

Use M03 readiness, M04 compatibility, M05 environment controls, M12 judge requirements, and M06 weight validation when determining launch readiness. Explain invalid or incomplete settings at setup; do not claim compatibility from a model name or invent effort choices. Unattended launch uses the same contracts through M14 without waiting for interactive configuration. **[R032, R033, R066]**

The application computes totals from separately retained raw judge grades. Alternative weights in results or HTML recalculate totals without judge calls or overwriting original results. Label alternatives, allow reset to original weights, and support exporting the alternative configuration/report through M06, M15, and M13. Original weights, grades, and outcomes survive every analysis change. **[R096, R145]**

## Acceptance criteria

- Save distinct YAML configurations for two revisions; changing one leaves both template hashes and historical results intact. Repeat with an imported revision using local harnesses. **[R009, R019, R066, R136]**
- Configure multiple entries for one harness, switch clean/current settings, and verify the complete setup matches the resolved launch. **[R017, R032]**
- Exercise each judge-preselection branch, independent judge editing, common suite/profile, and completed weight selection; defaults make no quality claim. **[R033, R037]**
- Verify launch records preserve machine/catalog metadata, exclude credentials from exports/logs/reports, and freeze configuration and original weights before execution. A mismatched or mutated template cannot retain a verified matching claim. **[R066, R067]**
- Save, reload, validate, reset, and export both weight sets; alternative calculations preserve raw grades and original results and require no judge calls. **[R096, R145]**
