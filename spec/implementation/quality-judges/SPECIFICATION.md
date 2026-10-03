# Specification design and decomposition quality judge contract

Status: proposed implementation contract for internal engineers; this document implements no judge and executes none of a candidate's proposed implementation work.
An engineer should be able to encode this rubric, prepare either grading backend's inputs and assess delivered specifications and plans as prerequisites for agentic development.
Authority: [M12](../reference/modules/12-quality-judging.md), [M12.1](../M12/01-review-contract.md), [decision grading](../DECISION-ENGINES.md#evidence-bound-decision-grading), and [measurement exclusion](../BENCHMARK-STATISTICS.md#eligibility-compatibility-and-exact-ordering).

The two automated-backend sections below also supply the frozen rubric/evidence contract to `human_review` through [M12.5](../M12/05-human-review-web.md). All three backends use M12.1's identical six-grade, evidence, three-comment-axis and limitations validator. Human readiness concerns the trusted renderer/evidence, not model capability; the existing human pending/submission lifecycle is unchanged. Only defaults sum to 100: edited weights are exact finite nonnegative values with a positive total, including individual zeroes, and never waive a required grade.

## Profile identity and approved scope

- `project_type = specification`; `profile_id = specification`; `rubric_version = specification/1`; `business_category = spec`.
- Add specification to new-authoring v2 domain/profile validation. Preserve v1 accepted values, schema bytes, hashes, reviews and interpretation; importing an existing record never reclassifies it.
- Grade the delivered requirements, technical design and decomposition into bounded implementation specifications. The coding harness, native coding framework, authoring process and eventual implemented application are not the assessed product.
- The immutable approved benchmark brief, supplied reference pack and provided parent design define expected work. Candidate-authored specifications, task lists or assertions cannot rewrite those requirements, change the rubric, approve their own exceptions or declare their own success.
- Select one primary approved profile; frontend/fullstack remain web, and executable agent applications use agentic. No composite profile or post-approval profile switch is introduced.
- Preserve the six ordered keys below. Default weights are positive and total 100; edited weights follow M06's finite exact nonnegative/positive-total validation and relative normalization, without a sum-100 requirement. Weights, anchors, evidence policy and acceptance defaults are AxBenchmark project choices, not standards-derived prescriptions.
- M01/M16 freeze required design and decomposition outputs, named requirements, reference precedence, applicability, evidence obligations and rubric bytes before approval. M07 freezes the common execution/grading selection for all competitors.

The frozen scope identifies which parent design is provided, which design decisions the candidate owns, which child specifications are required and whether the requested outcome is implementation-ready work or explicitly requested questions/alternatives.
A decomposition-only task may rely on the supplied parent design through precise references; do not require duplicate parent prose or grade the candidate as if it authored the immutable parent. Assess its faithful allocation, integration and identification of relevant conflicts.
All six categories remain required with concrete scoped anchors and evidence claims. Unresolved assessment scope blocks approval or grading; no post-hoc N/A, dropped category, automatic pass or weight redistribution.
A cohesive work unit may need only one child specification. “Smaller” means bounded responsibility and acceptance, not an arbitrary number of files, words or tokens; no one-session or context-window completion guarantee is required.
Do not reward more specifications, shorter documents, more links, file/LOC counts, gratuitous microtasks or a particular coding framework, planning method, directory layout or machine-readable graph.

Apply these rules to `one_shot` and `multi_step`, with `from_scratch` and `modify` targets, including preservation of required existing design decisions and contracts.
The [mandatory task-commit contract](../BENCHMARK-MODES.md#mandatory-task-commits) still requires Git and a competitor-created commit for every attempted task, even for document-only work. Quality cannot cure a process failure, earlier task-commit FAIL or failed/unverified required checks.

## Ordered categories and observable anchors

Every raw grade is exactly `1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5`, parsed by M12's Fraction validator without rounding.
Universal anchors remain **1: missing or largely broken; 3: usable with material gaps; 5: excellent for the defined scope**.

| Order / key | Label / default weight | Observable scope | 1 | 3 | 5 |
|---|---|---|---|---|---|
| 1 / `spec` | Requirements and brief fidelity / 20% | Clear bounded outcomes, scope, constraints, assumptions and decision honesty | Core required outcomes are absent, contradicted or replaced by invented requirements; material uncertainty is presented as settled fact. | Main outcomes and boundaries are usable, with material ambiguity, omitted constraints or poorly resolved assumptions. | Required outcomes and constraints are explicit and observable; exclusions, assumptions and unresolved questions faithfully reflect the original brief and its requested completion state. |
| 2 / `design_contracts` | Technical design and contracts / 20% | Consistent interfaces, data, errors, versions, ownership and lifecycle | Required contracts materially conflict or leave core interactions undefined, preventing a coherent design. | Main interactions are defined, with material gaps in interface/data/error semantics, compatibility or state ownership. | Required contracts are coherent across the parent and children; inputs, outputs, errors, applicable version/migration and lifecycle boundaries have clear ownership and supported decisions. |
| 3 / `decomposition` | Bounded and cohesive work units / 20% | Implementable slices, exact responsibilities, inputs, outputs and non-goals | Work is fragmented or entangled so core responsibilities and acceptance cannot be assigned without redesign. | Main work units are usable, with material overlap, mixed responsibilities or weak acceptance boundaries. | Each unit has coherent responsibility, explicit inputs/outputs and non-goals, with an observable acceptance boundary; divisions fit the work, including a single child when sufficient. |
| 4 / `dependency_traceability` | Dependencies and end-to-end traceability / 15% | Correct prerequisite DAG and requirement-to-design-to-child-to-acceptance links | Core work has cycles, hidden prerequisites, false independence or material coverage/ownership gaps. | Main ordering and requirement allocation are usable, with material missing edges, ambiguous ownership or incomplete acceptance links. | Implementation prerequisites form a coherent DAG; contracts/fixtures and later integration gates are distinguished, and every required outcome has a justified owner and acceptance path without orphaned or duplicate responsibilities. |
| 5 / `verification` | Validation and acceptance design / 15% | Feasible methods, observable expected results, negative/boundary and integration cases | Core completion claims have no usable verification method or rely on circular/self-approved success assertions. | Main outcomes are testable, with material gaps in expected results, negative/boundary coverage or integration evidence. | Planned checks can distinguish required success from relevant failure at the proper level; preconditions, expected observations and integration/baseline obligations are concrete and feasible within supported constraints. |
| 6 / `implementation_readiness` | Implementation-agent and developer usability / 10% | Unambiguous entry/completion states, proposed locations, dependencies and handoffs | Claimed ready work requires material invention before an implementer can start or determine completion. | Main work is actionable, with material missing setup, handoff, decision-resolution or completion guidance. | An implementer can locate authoritative inputs, begin at the declared state and establish completion; required dependency, migration and validation instructions are concrete, and any permitted unresolved work has a clear owner and resolution gate. |

Use 2 for substantial useful content below usable-with-material-gaps; use 4 for sound usable content with specific shortcomings below excellent-for-scope.
Use half steps only when evidence places the category between adjacent integer anchors; identify achieved content and the concrete shortfall preventing the higher anchor.
Never average criterion answers, convert check/link/requirement counts into grades or use document size as a quality proxy. Account for every admitted material contradiction.
An implementation-ready claim with material unresolved design decisions cannot meet the relevant ready/excellent anchors; an explicitly scoped questions/alternatives deliverable can be complete without pretending those decisions are resolved.
For a questions/alternatives brief, readiness assesses usable decision inputs, options, owners and the next resolution gate; it does not assert that coding can begin. Freeze that interpretation before approval.

## Frozen criterion and evidence map

These twelve IDs are stable within `specification/1`. Before approval instantiate claims against named brief requirements, supplied/owned design responsibilities, required work units and acceptance obligations.
Freeze evidence classes, selection rules and M08 structural-check IDs; deterministically resolve source ranges and evidence aliases into the assessment manifest without imposing an unapproved document format.

| Category | Criterion ID and affirmative claim | Required evidence gate |
|---|---|---|
| `spec` | `sp_spec_outcomes`: required outcomes, constraints and scope are clear, bounded and faithful to the approved brief. | Original brief/reference requirements and corresponding candidate statements, including exclusions and preserved baseline obligations. |
| `spec` | `sp_spec_decisions`: requirements, assumptions, decisions and open questions are distinguished honestly under the requested completion scope. | Approved ambiguity/decision policy, supplied conflicts/unknowns, candidate assumptions and decision records with rationale and resolution ownership where required. |
| `design_contracts` | `sp_design_interfaces`: required input/output, data and error contracts agree across the supplied or authored parent and consuming children. | Relevant parent/child contract passages, interface/data definitions and examples, including invalid/error cases and declared integration boundaries. |
| `design_contracts` | `sp_design_lifecycle`: applicable state, ownership, version/compatibility and migration semantics are consistent and supported. | State/lifecycle/ownership decisions, dependency constraints and relevant version/migration passages; a stateless scope still identifies invocation and data ownership boundaries. |
| `decomposition` | `sp_decomp_cohesion`: work units are coherent vertical slices or justified bounded acceptance units that fit the required design. | Parent allocation and complete child contents showing each unit's purpose, observable outcome and rationale for any contract/foundation-only unit. |
| `decomposition` | `sp_decomp_boundaries`: every unit has exact responsibility, inputs, outputs, ownership and non-goals without avoidable overlap. | Child assignments and handoff/interface passages cross-checked against adjacent units and the original required deliverables. |
| `dependency_traceability` | `sp_trace_dependencies`: declared ordering correctly distinguishes completed prerequisites, supplied contracts/fixtures and later integration gates. | All required work-unit dependency declarations and referenced contracts, entry conditions and integration gates; retained M08 graph/reference checks where declared. |
| `dependency_traceability` | `sp_trace_coverage`: each required outcome traces through parent design and child ownership to meaningful acceptance, with no gaps, orphans or duplicate responsibility. | Original requirement map, parent/child allocation and acceptance references in both directions; semantic comparison of content, not merely valid IDs or counts. |
| `verification` | `sp_verify_observable`: acceptance methods have concrete preconditions and expected observations that can establish the required outcomes. | Requirement-linked validation plan, proposed fixtures/commands or inspection methods, expected outcomes and supported prerequisites. |
| `verification` | `sp_verify_boundaries`: relevant failure, boundary, integration and preserved-behavior cases test the actual contracts at the proper level. | Scoped negative/boundary scenarios, cross-unit integration and baseline checks, with expected failure/recovery behavior and limits of fixture-only evidence. |
| `implementation_readiness` | `sp_ready_entry`: an implementer can begin each unit from its declared inputs, dependencies and owned locations without inventing material design. | Entry states, supplied contracts, proposed paths/modules where appropriate, setup/dependency instructions and allowed decisions. |
| `implementation_readiness` | `sp_ready_completion`: completion and handoff are unambiguous, including applicable migration, test commands and unresolved-decision gates. | Completion criteria, output/handoff definitions, validation instructions and explicit blockers with owner/resolution requirements consistent with the approved brief. |

The same reference may serve several claims only through separate explicit support mappings. Inspect the full required relationship closure and retain contradictory passages and approved modification regressions.
Honest identification of ambiguity already present in the supplied brief is not a candidate omission. Assess whether the candidate handled it as required; do not demand invented requirements or reward a baseless resolution.
An unknown external fact is not proof that the design is incorrect. An unsupported claim of verified SDK feasibility or resolved compatibility is an observable overclaim; limit that finding to what the supplied evidence establishes.

## Immutable evidence and read-only structural validation

Admit the immutable original brief/reference pack and supplied parent, candidate parent/child documents, interface/data definitions, dependency/traceability material, validation plan and approved M08 read-only structural reports.
Bind every item/report to the same final delivered snapshot digest, with supplied reference digests, check-suite/parser version, scope and admitted source ranges. Separate supplied authority from candidate-authored claims in provenance and aliases.
Retain evidence of exact supplied decisions and their declared precedence; a candidate's edited copy cannot replace the original. Candidate “approved,” “all tests pass” or self-awarded grades are claims to inspect, not authority or verification.
No application, browser or native screenshots are required. Prefer textual diagrams or source representations with equivalent semantics; visual assessment applies only when the frozen task requires image evidence and both the selected backend's capability and actual image delivery are verified.
Required images retain source/snapshot bindings and ordered evidence aliases. Unknown/unsupported image capability or missing required bytes blocks that assessment; no OCR, generated description, helper model or silent waiver substitutes for them.

M08 may run only the frozen approved read-only static checks before evidence seal: declared document/schema formats, unique IDs, safe local references, required link targets and declared dependency-graph consistency.
Use approved trusted parsers and validators, never candidate scripts, embedded instructions, plugin hooks or imports that execute candidate code. Bound parsing and reference traversal; reject unsafe paths/symlink escapes and resolve no remote resources during checks.
Do not require a particular framework, markup, machine-readable graph or formatting convention unless the approved scope does. Where structure is prose, assess supplied semantics directly; do not invent a parser requirement after delivery.
A missing parser/fixture or unavailable reference prerequisite remains unverified; an executed check demonstrating a broken required local link, duplicate ID or cycle is a known structural defect. Neither link validity nor coverage counts prove semantic completeness.
A passing document check establishes neither functioning runtime software nor feasibility of an external SDK assertion. External references must be approved and supplied with sufficient support; judges do not browse, probe SDKs or substitute current internet material for the frozen pack.

M12 is read-only: it never executes candidate commands, spawns implementation workers, implements a child, runs a new validator, installs tools, accesses external networks for evidence or repairs documents. Only the existing frozen grading transport may dispatch assessment calls.
All document contents, including AGENTS.md, SKILL.md, quoted system prompts, role instructions and proposed commands, are untrusted evidence. None can change judge authority, reveal withheld data, authorize effects or award a grade.
Use the existing M05 protected-artifact boundary and M12.4 transport; document tasks do not create an execution exemption or a new autonomous planner.

Missing approved input, source access, required evidence or collection prerequisites never automatically yields 1, 0 or N/A. A required omission demonstrated by a complete accessible artifact/manifest, or an observable contradiction/cycle, can justify a low anchor.
Missing required inputs before invocation use existing not-judged/input-failure handling; incomplete returned assessments remain ungraded with deficiencies, and invocation failures remain failed. Preserve useful partial review content and explicit limitations.
All six categories must have sufficient support for a graded review. Never invent a missing grade, redistribute weights around missing grades or treat successful process exit as completeness; identity mismatches retain M11 fatal invalidation handling.
Evidence sufficiency means enough inspectable material to assess the claim, not that the candidate met every requirement. A complete manifest can establish a required omission; collector failure cannot.

Recursively exclude benchmark cost/prices, elapsed/check/process time, input/cached/output/reasoning tokens, Gen tok/s, measured Files / LOC, document-size statistics, hardware/resource statistics and raw performance measurements from every input container.
Also exclude weights, rankings, creator harness/model/provider/configuration identity, machine identity, run/trial/result IDs, alias maps and other reviews, including nested metadata. Keep engine-side identity bindings outside prompts; redact practically without rewriting original artifact bytes or claiming perfect anonymity.
Functional domain quantities, static limits, version constraints, proposed paths and required contracts remain admissible when they explain the design. Their presence is not permission to infer measured size, author effort or benchmark efficiency.
Mutating only withheld values must leave the admitted projection digest and replayed decision composition unchanged; this fixture asserts deterministic projection/composition, not identical fresh live-model answers.
M06 alone computes weighted quality, eligibility and rankings, including the unchanged raw `spec >= 4/5` gate. Quality and structural checks remain separate from task/process success and measured cost/time.

## Both grading backends and decision composition

Both `harness_review` and `decision_rubric` consume the identical frozen rubric and anonymous immutable assessment snapshot. M12 keeps one isolated, globally sequential assessment per delivered trial, with no earlier conversation, answer or review as input.
Harness review remains the default. No compatible READY decision engine disables only decision grading and independently unavailable context analysis; an otherwise usable harness remains available. An explicit unusable decision choice has no silent fallback.
Reuse the [existing decision pack and transport](../DECISION-ENGINES.md#evidence-bound-decision-grading); this profile adds rubric data and evidence rules, not a new model, provider dialect or helper service.

| Question family | Specification pack binding and acceptance |
|---|---|
| `coverage/category` | Frozen requirements, supplied/owned responsibilities, work units and evidence classes; `sufficient`, `insufficient`, `abstain`. Only accepted sufficient permits a grade. |
| `grade/category` | Exactly nine Choice labels `1`, `1.5`, `2`, `2.5`, `3`, `3.5`, `4`, `4.5`, `5` with these scoped anchors and intermediate rules. Never round a Score expectation. |
| `reason/category/criterion` | Each concrete criterion above and its frozen requirement/evidence assignments; `supported`, `contradicted`, `not_established`, `abstain`. |
| `support/category/evidence` | An admitted evidence ID and explicit criterion relationship; `supports`, `contradicts`, `irrelevant`, `insufficient`. Only accepted relevant support/contradiction supplies attached refs. |
| `comment/axis/criterion` | Preserve `code_quality`, `developer_experience`, `specification`: respectively map to `sp_design_interfaces`/`sp_design_lifecycle`, `sp_ready_entry`/`sp_ready_completion`, `sp_spec_outcomes`/`sp_spec_decisions`. Concrete achievement/defect options include `insufficient`/`abstain`. |
| `limitation/code` | `required_evidence_missing`, `prerequisite_unavailable`, `scope_uncertain`, `external_claim_unverified`, `inspection_incomplete`, `context_bound_exceeded`, `conflicting_evidence`; `present`, `absent`, `unknown`. Include known acquisition limitations independently. |

Preserve RawReview's three comment keys. For this profile, `code_quality` means technical-design maintainability, never a claim about implemented code; `developer_experience` means implementation-agent/developer usability; `specification` means original-brief coverage. Label these semantics in UI and retained provenance.
Pack compilation freezes exact claim/question/anchor text and IDs, scope assignments, selection order, support mappings, comment choices, consistency predicates and acceptance/composition versions and digests.
For `specification/1`, default mandatory Choice acceptance uses the decision contract's `native_confidence` policy with provisional threshold `0.8`; freeze any approved change with the pack. This project setting requires evaluation and promises no accuracy. Rejected/unknown confidence, ties and abstention supply no default grade.
All questions independently evaluate the same fixed supplied evidence; earlier answers never become hidden context. Account for every required criterion, even when one informative accepted reason suffices to compose a category rationale.
Before launch deterministically partition finite question/evidence assignments into frozen batches; publish positive `max_calls_per_assessment`, byte/context limits, batch sizes and allowed attempts. Default to one dispatched attempt per batch; every attempt consumes the bound.
M12 totals multiply the bound by assessment count, without predicting actual calls. Any approved pre-dispatch retry budget is included; no ambiguous dispatched retry, adaptive investigation or extra call repairs missing evidence or answers.
Packing retains the full manifest, included/excluded IDs/ranges and coverage. Required relationships and evidence cannot disappear to fit context: report insufficient input/context limits rather than truncate, summarize, substitute a model or use a hidden helper LLM.

A category needs accepted sufficient coverage, an exact grade, an informative accepted reason and an admitted reference explicitly supporting or contradicting it. Required scope coverage precedes completeness claims.
Frozen predicates reject grade 5 with a material required-scope defect, grade 1 contradicted by established category-wide usable content, any grade with insufficient coverage, unsupported comments and limitation-free output with known deficiencies.
Intermediate predicates require achieved content and the shortfall blocking the higher anchor. Retain rejected/contradictory answers as deficiencies; never repair by lowering/averaging grades or supplying boilerplate.
Code composes rationales and all three substantive comments from accepted criterion text, conclusions and evidence aliases. Retain question/answer/anchor IDs and support/composition provenance as `code_composed_from_decisions`; harness prose remains `model_authored`.
Require explicit limitations; empty is valid only when mandatory limitation decisions and input checks establish none. Apply unchanged M12.1 RawReview validation: six categories once, exact grades, nonempty rationales, resolving `evidenceRefs`, three comments and valid provenance.

## Guidance, retention and implementation ownership

The following primary sources inform requirement clarity, traceability and verification planning; they do not prescribe this rubric's weights, grading algorithm, document format or a compliance certification:

- NASA's checklist addresses ambiguity, assumptions, consistent interfaces and requirements that can be tested, demonstrated, inspected or analyzed. Use these as evidence questions within the approved scope. [NASA requirements checklist](https://www.nasa.gov/reference/appendix-c-how-to-write-a-good-requirement/)
- NASA's design process describes bidirectional traceability to stakeholder expectations and consistency of design decisions and assumptions with constraints. Assess the actual meaning of links, not only their presence. [NASA system design processes](https://www.nasa.gov/reference/4-0-system-design-processes/)
- RFC 8174 clarifies uppercase BCP 14 keywords and also explains that normative text need not use those keywords. Do not impose capitalization or keyword counts as quality requirements. [IETF RFC 8174](https://www.rfc-editor.org/rfc/rfc8174.html)

Freeze profile/rubric/version/digest, original brief/reference and applicability bindings, pack/evidence/mapping/composition/acceptance policies and requested/resolved judge identity in existing assessment/group identity.
M02 retains original reviews, raw decisions, deficiencies and bound source evidence. M06/M13/M17 preserve separate fingerprints; shared category names or model labels never merge this profile with software profiles, another rubric version or another backend.
Import, viewing, reporting and reweighting invoke no model, probe, validator or candidate command. Explicit rejudge adds a separate retained review/cost/group using approved retained artifact/rubric evidence; it never overwrites originals or reopens sealed checks. New semantics require a newly approved revision.

| Existing owner | Specification extension |
|---|---|
| [M12.1](../M12/01-review-contract.md) | Pure versioned profile/rubric/pack, source-evidence projection and strict validation; preserve legacy readers. |
| [M12.2](../M12/02-judging-worker.md) / [M12.3](../M12/03-judging-screens.md) | Existing protected assessment, settlement and views of scope, coverage, limitations, comment semantics, provenance and rejudge groups. |
| [M08.1](../M08/01-verification-runtime.md) / [M08.2](../M08/02-verification-adapters.md) | Approved bounded read-only static checks, parser availability, final-snapshot binding and measurement-free structural-evidence handoff. |
| [M01.1](../M01/01-canonical-definition.md) / [M16.3](../M16/03-draft-approval.md) / [M07.2](../M07/02-launch-preparation.md) | Versioned authoring/approval, immutable brief/reference precedence and scope map, common launch selection and evidence/capability readiness; v1 remains unchanged. |
| [M02.1](../M02/01-retained-records.md) / [M06.1](../M06/01-scoring-service.md) / [M13.1](../M13/01-offline-report-artifact.md) / [M17.1](../M17/01-archive-contract.md) | Retain/export/import documents, reports, exact grades and group identities; existing owners retain scoring and offline presentation. |

Extend existing children and ports using M12.4 transport and M05 protection; add no DAG node, alternate verification/scoring service, document-authoring agent or implementation runner.
Proposed paths below are future work under `solution/`, not implementation delivered by this specification:

- `solution/axbenchmark/engine/judging/adapters/prompts/rubrics/specification-v1.json` and `solution/axbenchmark/engine/judging/adapters/prompts/question_packs/specification-v1.json`.
- Existing `solution/axbenchmark/engine/judging/domain/{profiles,rubric,requirements,inputs,reviews,question_packs,grading_plan}.py` gains versioned data and projection; M08's existing verification contracts/adapters gain the approved static checks through owned ports.
- `solution/tests/fixtures/judging/specification_v1/` holds original briefs, supplied parents, candidate document packs, requirement/dependency maps, static reports, contradictory evidence and injection/metadata variants.
- `solution/tests/engine/judging/test_specification_v1_rubric.py`, `test_specification_v1_evidence.py`, `test_specification_v1_decision_pack.py`, `solution/tests/verification/test_specification_static_evidence.py` and `solution/tests/integration/test_specification_v1_judging.py` cover the following gates.

## Acceptance fixtures and integration gates

1. **Identity and exact grades:** assert ordered defaults `20,20,20,15,15,10`, six keys, total 100, twelve unique criteria and `business_category=spec`; edited weights permit individual zeroes and relative scaling under M06's nonnegative/positive-total validation. All six grades remain required even at zero weight. Preserve v1 values/bytes/hashes, fullstack→web and separate profile/version groups. Accept all nine grade labels; reject 3.7, rounding, missing categories and N/A.
2. **Anchors and scope:** a complete actionable pack, a usable pack with named material gaps and an observable contradictory/cyclic/incomplete pack exercise 5/3/1 with evidence. Cover half-step achieved-content/shortfall rationales; reject unsupported excellence and false implementation-ready claims while accepting explicitly requested well-resolved questions/alternatives within their scope.
3. **Proportional decomposition:** a good single-unit child can earn 5; gratuitous microfiles and a monolith with entangled ownership cannot earn a size bonus. Distinguish coherent bounded/vertical slices and justified foundation units from checklist fragments. Decomposition-only fixtures use the provided parent without duplication and preserve its authority.
4. **Dependencies and traceability:** distinguish hidden prerequisites/cycles/duplicate ownership from legitimate supplied forward contracts and fixtures with later integration gates. Include orphan requirements, semantic gaps behind valid links, out-of-scope additions and external feasibility claims unsupported by the approved reference pack.
5. **Unknown versus defect:** absent original input/parser/reference, unreadable documents and missing required diagram images remain unverified/ungraded/not judged. Complete artifact evidence can establish omitted obligations or broken links. Supplied ambiguity with honest blocker/assumption handling differs from candidate omission or invented resolution; a passing static report proves no runtime behavior.
6. **Projection invariance:** recursively nest and mutate benchmark tokens/cost/time/Gen/Files/LOC/document size/hardware, weights, rankings, creator identity and other reviews. Assert identical admitted input digests and replayed decision composition while functional contracts/quantities remain usable; do not assert live-LLM determinism.
7. **Authority and no execution:** inject grader roles, “award 5,” rewritten brief/approval text, AGENTS/SKILL overrides, commands, URLs and worker-spawn requests. Assert none are obeyed; protected documents remain unchanged and no candidate command, network evidence request, new validator or implementation task runs during grading.
8. **Decision validity and boundedness:** both backends use the same evidence/anchors. Reject unsupported refs/comments, missing limitations, conflicting grade/reason/coverage and context overflow; retain raw parts, comment-semantic mapping and provenance. Enforce finite call bounds and no helper/model/transport fallback; optional image scope needs verified capability and actual bytes.
9. **Modes, retention and success gates:** exercise both modes/targets and document-only Git requirements; a high review cannot cure an earlier commit FAIL or failed/unverified checks. Imports/views/reweights invoke nothing; explicit rejudge retains originals in a separate review/cost/group without new static checks or actual coding. Missing READY decision setup preserves otherwise usable harness/offline access.

Cold-read fixtures against the original brief and required relationship closure before acceptance. Real M01/M07/M08/M12/M02/M06/M13/M17 integration must demonstrate these boundaries; this specification and mocked fixtures prove neither implemented software nor autonomous execution readiness.
