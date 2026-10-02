# M08 — Acceptance verification and evidence

Status: proposed required contract. This module defines how AxBenchmark establishes observable task outcomes and retains supporting evidence. It does not assert that verification is implemented. [SPEC.md](../SPEC.md) remains authoritative.

## Purpose and boundaries

The frozen executable acceptance checks determine task success. Agent completion statements, process exit codes, and independent judge grades are separate observations and cannot substitute for those checks. Checks assess the approved observable requirements without imposing an unnecessary source layout, internal design, or implementation technique. **[R073, R144]**

Verification participates in execution of the pinned template revision: approved checks run, evidence is preserved, and progress and measurement information remain available through the execution workflow. M11 owns orchestration, M10 owns measurements, and M15 owns their presentation; this module supplies verification progress, outcomes, and evidence to those collaborators. **[R034]**

## Inputs, operations, and outputs

Conceptual inputs are the pinned template's specification and approved executable checks, the task identity and resulting snapshot, the delivered artifact for final regression, and independently recorded process outcomes. Browser or backend setup uses the template's approved execution instructions and available prerequisites. These inputs identify what is being verified; they do not authorize revising acceptance requirements after seeing a competitor's output. **[R034, R073, R074, R076, R144]**

For each task, run the applicable approved checks against a disposable copy of its snapshot. Keep verification tooling outside competitor source. Preserve the task snapshot as evidence while allowing the disposable copy to absorb test activity. Verification must not manually repair generated application code, whether a check fails or setup exposes an application defect. The delivered artifact receives a final regression check, also through a disposable copy, so earlier successful observations cannot stand in for its final behavior. **[R074]**

Outputs comprise independently recorded process and verification outcomes plus task-associated evidence, snapshots, logs, and available commit identities. A missing commit identity remains unavailable rather than being invented. Evidence must remain attributable to the task and snapshot it describes; final regression evidence describes the delivered artifact. These are conceptual information requirements, not a prescribed storage format or check schema. **[R074, R076]**

Browser verification uses Python Playwright. Exercise meaningful workflows and keyboard behavior, observe browser errors, and capture desktop screenshots at 1440×1000 and mobile screenshots at 390×844. Screenshots support inspection; producing images alone does not establish workflow success. Backend verification exercises the approved interface contract. Fullstack artifacts require the applicable browser and backend behavior to be observable through that contract. **[R073, R075, R149]**

Provide the resulting acceptance evidence to the independent judge separately from measured execution statistics. The handoff includes the relevant check results and browser evidence without conflating behavioral verification with cost, timing, or other execution measurements. A later judge grade must not rewrite a check outcome. **[R075, R144]**

## Outcomes, failures, and invariants

Record each check as passed, failed, or unverified. Passed means the executable check established its required observable behavior; failed means it established a requirement failure; unverified means verification could not establish whether the requirement passed or failed. Missing prerequisites and broken verification infrastructure must be distinguishable from observed application failures and from each other, with their reasons retained. An inability to run a check cannot produce a pass. **[R073, R076, R144]**

Keep process completion, process failure, failed checks, unverified checks, and judge grades distinct throughout retention and presentation. For example, successful process termination can coexist with a failed check, and an interrupted process can coexist with whatever checks were actually established against its snapshot. Neither example permits missing verification to be inferred. Logs and available evidence remain attached to the affected task even when verification cannot complete. **[R076, R144]**

## Dependencies and integration

[M01](01-template-library-identity.md) and [M16](16-custom-template-planning.md) supply approved template inputs and the baseline context. [M05](05-harness-execution-isolation.md) and [M11](11-run-orchestration.md) supply execution outcomes and task artifacts; [M03](03-environment-readiness.md) exposes prerequisite availability. [M02](02-retained-results-comparability.md) retains task evidence and commit identities. [M12](12-quality-judging.md) consumes evidence for judging, while [M10](10-measurements-cost.md) retains statistics separately. [M06](06-scoring-rankings.md), [M15](15-terminal-interface.md), and [M13](13-standalone-html-report.md) consume verification outcomes without merging them with grades or process status. **[R034, R074, R075, R076, R144]**

Product integration verification must exercise frontend and backend workflows end to end, including an existing-repository baseline. Collaborate with M16, M06, and M15 to make TUI navigation, terminal resizing, failure states, and score calculations verifiable. Python Playwright is mandated for browser verification; this contract does not prescribe a framework for terminal or scoring checks. **[R149]**

## Testable acceptance criteria

- A process reports success while an observable requirement fails: the approved check records failure. A favorable judge review does not change it. Unexecuted checks remain unverified. **[R073, R144]**
- Task checks use disposable snapshot copies, verification tooling remains outside competitor source, and verification introduces no manual application fixes. Final regression tests the delivered artifact and preserves earlier task evidence. **[R074, R076]**
- Python Playwright evidence demonstrates meaningful browser workflows, keyboard behavior, browser-error observations, and screenshots at both required dimensions. Backend evidence exercises the approved interface, and the judge receives evidence separately from measured statistics. **[R075]**
- Missing prerequisites, broken verification infrastructure, application-check failures, and process failures remain distinguishable in retained task outcomes, logs, snapshots, and available commit identities. **[R076, R144]**
- End-to-end frontend and backend scenarios include an existing-repository baseline, expose progress and measurements alongside preserved evidence, and verify navigation, resizing, failure handling, and score calculation integration. **[R034, R149]**
