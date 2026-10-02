# M12 — Independent quality judging

Authority: [the product specification](../SPEC.md). This module organizes its required behavior without prescribing internal architecture.

This proposed contract enables engineers to implement independent reviews of delivered benchmark artifacts. Quality complements the repository README's measured cost/time comparison and rankings for different priorities. It evaluates a complete harness/model/environment configuration on the defined work; it does not establish isolated model capability. These requirements describe intended behavior, not an existing implementation. [R004]

## Judge selection and launch agreement

Users independently choose the judge harness, model, and effort during setup. Preselect a valid saved choice; otherwise preselect the planner configuration if planning was used; otherwise preselect the first selected usable configuration. Preselection remains editable and does not recommend a model's quality. An unusable choice requires resolution before launch rather than silent replacement. [R033, R037]

Use the approved template's rubric and grading profile. Users complete the judge selection, quality-category weights, and cost/time/quality ranking weights before launching. M07 freezes the launch configuration and M06 validates the weights. Every competitor receives the same approved task suite and grading profile; the chosen judge and rubric remain common throughout the local comparison. A competitor's failure does not justify changing its rubric or granting additional repair opportunities during judging. [R033, R037, R082]

## Review inputs and execution

The review operation consumes an identified delivered artifact, its approved specification and source, the template rubric, acceptance results, screenshots, relevant evidence, and the resolved judge configuration. Evidence must remain associated with that artifact so a reader can follow a review's references. These are conceptual inputs; this contract does not prescribe a transport format or review schema. [R083, R084]

Review configurations sequentially, with one fresh headless judge session per delivered artifact. A session receives no earlier artifact's conversation or review. Use anonymous configuration labels where practical. Exclude measured cost, speed, and other competitors' reviews from judge inputs, including evidence excerpts supplied for assessment. Keep the label-to-result association outside the judge's assessment so the application can attach the review to the correct result. [R082, R083]

The judge inspects and assesses; it must never repair the application. UI judging requires a configuration capable of inspecting screenshots. M04 supplies capability information and M07 checks readiness; neither a model name nor unsupported capability assumptions establish screenshot support. If the required capability is unavailable, setup must identify the issue. If inspection or invocation fails during judging, retain the failure and avoid inventing an assessment. [R083, R084]

## Raw review contract and validity

A complete review contains a grade for every rubric category, evidence references, limitations, and comments on code quality, usability or developer experience, and specification adherence. Grades range from 1 through 5 in half-point increments. Apply these anchors consistently: 1 means missing or largely broken, 3 means usable with material gaps, and 5 means excellent for the defined scope. Intermediate grades use the same scope and evidence. [R084]

The application validates the returned review before treating it as graded. Missing categories, out-of-range values, unsupported increments, absent required commentary or evidence references, and otherwise malformed or incomplete responses remain ungraded. Preserve the available review and explain the deficiency; do not fill gaps with averages, zeroes, guesses, or a score inferred from process success. A reported limitation must remain visible with the review. [R084]

Raw category grades are M12's scoring output. M06 computes weighted quality and combined decision scores in the application, using the selected weights. Reweighting consumes retained grades without another judge session or alteration of the original review. Frozen acceptance checks determine task success; passed, failed, and unverified checks remain distinct from process outcomes and judge grades. A favorable quality review cannot turn a failed check or process failure into success. [R004, R144]

## Quality profiles

Frontend and fullstack projects use the web profile preserving the README's categories and defaults. Backend-only projects use the backend profile below. Apply one profile to every configuration within a comparison. The six rows implement R086, R087, R088, R089, R090, and R091 respectively; these default weights are editable through M06. [R085]

| Frontend/fullstack category | Default weight | Backend category | Default weight |
|---|---:|---|---:|
| UX | 25% | Developer experience | 25% |
| Visual quality | 15% | API/interface design | 15% |
| Code quality | 20% | Code quality | 20% |
| Business rules/specification | 25% | Business rules/specification | 25% |
| Robustness | 10% | Robustness | 10% |
| Accessibility | 5% | Operability/documentation | 5% |

## Accumulation, imports, and dependencies

Review each delivered artifact and make reviews available alongside accumulated results for the same template, including compatible imports from other machines. M02 retains the association between template, result, artifact, judge configuration, raw grades, evidence, and limitations. M13 uses those records to generate and open the HTML report; M12 does not need a model call merely to display a saved review. [R035]

Preserve an imported result's original judge configuration and review evidence. Different judge configurations form separate assessment groups for both quality and combined rankings; a matching template does not make different judges equivalent. M06 and M13 must receive the grouping information rather than flattening grades into a single assessment. [R082]

An explicit user request can rejudge an imported artifact with the selected judge. This creates an additional retained review, leaving the original intact. Apply the same fresh-session and evidence rules to the new review. Record its judging cost separately through M10; importing or viewing the artifact does not itself authorize rejudging. [R082]

[M01](01-template-library-identity.md) supplies the frozen rubric and template identity; [M07](07-run-configuration.md) supplies launch choices; [M05](05-harness-execution-isolation.md) supplies headless execution; [M08](08-verification-evidence.md) supplies acceptance evidence; [M02](02-retained-results-comparability.md) supplies retained artifacts and reviews. [M06](06-scoring-rankings.md) computes scores, [M10](10-measurements-cost.md) records separate judging costs, and [M13](13-standalone-html-report.md) presents retained assessments. M12 returns a valid raw review or an explicit ungraded outcome with available evidence and limitations. These boundaries keep review opinions, executable verification, and measured performance independently inspectable. [R004, R082–R084, R144]

## Acceptance criteria

- Exercise saved-choice, planner-choice, and first-selected-usable preselection; confirm user overrides and completed weights before launch. [R033]
- Review multiple artifacts with sequential fresh sessions, identical rubric/profile, practical anonymity, excluded performance/competitor-review inputs, and no application repair. Reject unsupported UI judging. [R037, R082, R083, R085]
- Accept complete half-point grades; leave malformed or incomplete reviews ungraded with their deficiencies visible. Confirm all required commentary and evidence references survive retention. [R084]
- Confirm both profiles match all six category/weight pairs above. Reweighting preserves raw reviews and never changes verification or process outcomes. [R086–R091, R144]
- Inspect compatible imported results, distinct judge groups, and an explicitly added review with its original preserved and additional cost separate; generate the report from retained evidence. [R035, R082]
