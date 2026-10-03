# Agentic application quality judge contract

Status: proposed implementation contract for internal engineers; this document implements no judge, agent framework, model integration or evaluation runner.
An engineer should be able to encode this rubric, prepare either grading backend's inputs and reject unsupported assessments without inventing grades or agent successes.
Authority: [M12](../reference/modules/12-quality-judging.md), [M12.1](../M12/01-review-contract.md), [decision grading](../DECISION-ENGINES.md#evidence-bound-decision-grading), and [measurement exclusion](../BENCHMARK-STATISTICS.md#eligibility-compatibility-and-exact-ordering).

## Profile identity and approved scope

- `project_type = agentic`; `profile_id = agentic`; `rubric_version = agentic/1`; `business_category = spec`.
- Add agentic to new-authoring v2 domain/profile validation. Preserve v1 accepted values, schema bytes, hashes, reviews and interpretation; importing an existing record never reclassifies it as agentic.
- This profile grades a delivered agent application or workflow: its task outcomes, tools, orchestration, state and operating behavior. Google ADK, LangGraph and LangChain are examples; equivalent frameworks or direct implementations are equally eligible.
- Building an agent from scratch is the primary use case. The same contract also applies to an approved modification of an existing agent; it does not grade the coding harness's reasoning, delegation, editing process or efficiency.
- A specification/design/decomposition deliverable is a separate domain, not an agent application merely because its author uses an agent. This profile requires delivered executable agent behavior and does not define that separate rubric.
- Select one primary approved profile. Fullstack remains web; an agent component requires an explicitly agentic-scoped revision. No composite, implied UI coverage or post-approval profile switch is introduced.
- Preserve the six ordered keys below. Default weights are positive, total 100 and remain editable through M06 as finite exact nonnegative relative weights with a positive total; M06 normalizes them. Weights, anchors, evidence policy and acceptance defaults are AxBenchmark choices, not vendor recommendations or certification.
- M01/M16 freeze rubric bytes, named requirements, applicability, evaluation cases and evidence obligations before approval. M07 freezes the common approved execution/grading selection for every competitor; rejudge cannot silently change scope or semantics.

Apply the same rules to `one_shot` and `multi_step`, with `from_scratch` and `modify` targets. Grade the final delivery and required baseline preservation; neither mode earns a bonus.
The [mandatory task-commit contract](../BENCHMARK-MODES.md#mandatory-task-commits) remains binding. Quality cannot cure process failure, failed/unverified required checks or an earlier task-commit FAIL.
Do not reward more agents, tools, autonomy, chains, prompt length, files/LOC, model prestige or framework brand. Complexity must fit the task; a small stateless agent can earn 5 in every category.

Before approval derive a finite map of requirement/feature IDs, task scenarios, expected outcomes/invariants, criterion IDs, evidence classes/selectors and M08 observation/check IDs.
Mark conditional branches with a requirement reference and applicability reason: retrieval/citations, structured output, tools, effects, persistence/memory, multiple sessions, delegation, approvals and deployment apply only when required or inherent in declared behavior.
A stateless agent needs no database or memory; a read-only task needs no invented human approval gate. Freeze concrete input/output, no-unintended-effect and invocation-isolation claims for the narrower scope.
All six categories remain required; no N/A, omitted category or weight redistribution. Unresolved required scope blocks approval or grading; never narrow it after observing a competitor failure.

## Ordered categories and observable anchors

Every raw grade is exactly `1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5`, parsed by M12's Fraction validator without rounding.
Universal anchors remain **1: missing or largely broken; 3: usable with material gaps; 5: excellent for the defined scope**.

| Order / key | Label / default weight | Observable scope | 1 | 3 | 5 |
|---|---|---|---|---|---|
| 1 / `tool_contracts` | Tool and interface contracts / 20% | Agent inputs/outputs, tool schemas, validation and declared effect boundaries | Required interfaces or tool arguments/results are materially wrong, making core interactions largely unusable or crossing declared effect boundaries. | Main interactions work, with material inconsistencies in schemas, validation, result handling or exposed effect semantics. | Required inputs, outputs and tool interactions are predictable and validated; permitted effects and result semantics are explicit and supported across relevant boundaries. |
| 2 / `orchestration_state` | Orchestration and state / 15% | Routing, transitions, termination and applicable session/checkpoint ownership | Observed control flow cannot complete core tasks or loses/crosses required state boundaries. | Main flows complete, with material gaps in routing, stop conditions or applicable state, resume and session isolation. | Required branches and stop conditions behave coherently; state ownership and applicable persistence/resume/isolation preserve declared invariants. |
| 3 / `code_quality` | Maintainability, tests and developer experience / 15% | Traceable rules, prompts/configuration, meaningful tests and reproducible use | Core behavior is opaque or materially unsafe to change, or required setup/tests are largely absent or broken. | Main implementation and setup are usable, with material coupling, unclear rules, weak behavioral tests or integration guidance gaps. | Responsibilities and prompt/tool rules are clear and proportional; setup is reproducible and focused delivered tests support required behavior and failure paths. |
| 4 / `spec` | Task success, grounding and specification / 25% | Named outcomes, domain rules, supported answers/citations and preserved behavior | Core tasks are absent or demonstrably largely wrong, including materially fabricated answers or falsely claimed effects. | Main tasks succeed, with material gaps in required rules, grounding, uncertainty handling or baseline preservation. | Every required task and invariant is evidenced across declared scenarios; answers and effect claims agree with available evidence and limitations, including required citations and preserved behavior. |
| 5 / `safety_recovery` | Failure handling, recovery and safety / 15% | Authority, untrusted inputs, approvals, fault containment, retry and side-effect safety | Ordinary failures or adversarial inputs breach required authority/data boundaries or leave core work dangerously unrecoverable. | Main protections and recovery work, with material gaps in approval enforcement, failure classification, retries or safe escalation. | Required trust/authority boundaries hold; faults, duplicates and applicable interruptions recover or escalate safely within declared bounds without unauthorized or duplicate effects. |
| 6 / `evaluation_operability` | Evaluation and operability / 10% | Reproducible cases, observable outcomes, diagnostics and operating guidance | Delivered case assertions or operational statuses are proved absent or materially misleading, preventing diagnosis of core outcomes. | Main evaluation and operation are usable, with material scenario coverage, trace interpretation or diagnostic/runbook gaps. | Required cases are reproducible and meaningfully asserted; observable traces, statuses and accurate instructions support diagnosis, operation and declared recovery. |

Use 2 for substantial working portions below usable-with-material-gaps; use 4 for a sound usable category with specific shortcomings below excellent-for-scope.
Use half steps only when evidence places behavior between adjacent integer anchors; identify achieved behavior and the concrete shortfall preventing the higher anchor.
Never average criterion answers, convert case pass counts or model-generated evaluation scores into grades, or infer excellence from one successful conversation. Account for every admitted material contradiction.
Good recovery cannot conceal an authorization failure; schema-valid output cannot establish a correct answer. Inspect observable behavior, not hidden chain-of-thought; no private reasoning disclosure is required.

## Frozen criterion and evidence map

These twelve IDs are stable within `agentic/1`. Instantiate affirmative claims with approved feature/case/interface IDs and retain supported, contradicted, not-established or abstained status.
Freeze required branches and selection rules before approval; deterministically resolve source ranges and evidence aliases into the assessment manifest without imposing a competitor file layout.

| Category | Criterion ID and affirmative claim | Required evidence gate |
|---|---|---|
| `tool_contracts` | `ag_tool_schema`: required agent/tool inputs and outputs honor declared types, validation and error contracts. | Interface/tool schemas, relevant source and final-artifact valid/invalid argument, malformed-result and output-shape observations as applicable. |
| `tool_contracts` | `ag_tool_effects`: exposed tool semantics and dispatch preserve the declared permitted-effect boundary. | Tool inventory/dispatch/access code or explicit no-tool implementation, operation/effect contract and relevant allowed/denied or no-unintended-effect observations, with actual or explicitly simulated effects. |
| `orchestration_state` | `ag_flow_control`: required routes, handoffs and terminal/stop conditions implement the intended workflow. | Orchestration source/configuration and retained case traces covering required branches, stop/budget outcomes and terminal states. |
| `orchestration_state` | `ag_state_isolation`: state ownership and applicable checkpoint, replay/resume and session behavior preserve required invariants. | State/session/checkpoint source and retained initial/resulting state, restart/resume or isolation observations; stateless scopes demonstrate clean invocation boundaries. |
| `code_quality` | `ag_code_structure`: responsibilities, prompts/configuration and domain/tool rule ownership are traceable and proportionate. | Relevant delivered source/prompt/configuration ranges, dependency declarations and requirement-to-rule mapping. |
| `code_quality` | `ag_code_dx_tests`: documented setup and meaningful delivered tests reproduce and assert required user/developer tasks. | Setup/examples, test/fixture source and approved M08 setup/test outcomes; names, counts or exit success alone are insufficient. |
| `spec` | `ag_spec_outcomes`: required task results, business rules and baseline behavior hold across the approved cases. | Requirement-to-source/case map, expected conditions and retained final-artifact outputs/effects and baseline regressions in their declared evidence modes. |
| `spec` | `ag_spec_grounding`: answers, citations and success/uncertainty claims are supported by available inputs, retrieved material and actual tool outcomes. | Case inputs, approved reference material, relevant source and retained outputs/tool results, including unavailable/conflicting evidence, unsupported-answer and false-success cases as applicable. |
| `safety_recovery` | `ag_safety_authority`: untrusted input/tool content cannot expand declared authority or bypass required sensitive-effect approvals. | Trust/access/approval policy and source plus scoped injection, denied-operation, approval/rejection and secret/data-boundary observations. |
| `safety_recovery` | `ag_recovery_failures`: errors, timeouts, duplicates and applicable interruptions terminate, recover or escalate safely within declared bounds. | Error/retry/idempotency/cancellation source and retained approved fault, duplicate-request and interruption outcomes with resulting state/effects. |
| `evaluation_operability` | `ag_eval_cases`: reproducible evaluation cases assert the required behaviors and expose their evidence-mode and coverage limits. | Versioned delivered case/fixture/assertion definitions, pinned conditions and M08 outcomes mapped to required scenarios; self-awarded scores are not proof. |
| `evaluation_operability` | `ag_ops_diagnostics`: status, observable decisions and instructions accurately support setup, diagnosis, escalation and required recovery. | Runbook/configuration guidance, redacted trace/status definitions and retained success/failure/approval/resume or terminal observations for required operator tasks. |

Static claims require readable relevant source. Behavioral claims require corresponding retained observations plus enough source/requirement context; a README, prompt instruction or schema is not proof of execution or task competence.
A proved absence in a complete artifact/manifest may establish a missing-deliverable defect. An unavailable collector, inaccessible source or missing model cannot establish absence or incorrect behavior.
One reference may serve several claims only through explicit separate support mappings. Retain contradictory cases and approved modification regressions; no favorable-case cherry-picking or raw-diff-size proxy.
Required scenario coverage precedes claims of completeness. Sufficient direct evidence of largely broken behavior may support a low anchor; unknown infrastructure or unobserved behavior never becomes an invented low grade.

## Final-product evidence and approved evaluation

Admit the approved specification/tasks, pinned final artifact/source, prompts, dependency/configuration manifests, delivered tests/evaluation cases, documentation and M08's measurement-free final-artifact projection.
Product-agent traces are evidence from approved evaluation of that delivered application: case inputs/outputs, tool arguments/results, observable routing/decisions, state/checkpoints, human approval/resume events and terminal outcomes.
They are distinct from withheld coding-harness conversations, editing/delegation history and grader history. Do not request hidden reasoning or expose either history under a product-trace label.

Each observation binds the same final artifact digest, approved check-suite version/digest, case/fixture version, input/initial-state digest, product model/provider revision and configuration, tool/fixture version, evidence mode and available seeds.
Record `simulation`, `replay` or `live` per relevant model/tool boundary, including mixed cases; a live model with mocked tools is not proof of real tool effects. Record unavailable revision/seed metadata as an explicit reproducibility limitation.
Retain case/check/step aliases, expected and observed semantic conditions, resulting state, evidence digests and readable source ranges. Engine-side mappings retain real result/trial/session identities; prompt aliases preserve necessary within-case relationships without exposing those identities.
Only approved final-artifact observations satisfy these gates. Earlier task snapshots, stale traces, sample demonstrations, foreign model/tool conditions and prior reviews cannot substitute for the final case matrix.
Mock/replay evidence establishes wiring and control flow within its declared fixture, not live LLM task competence. A simulated write/send/deployment never becomes a real action; recorded replay outcomes are not fresh model responses.
If a required claim depends on live inference and suitable authorized evidence is missing, retain its deficiency and leave the review ungraded/not judged as appropriate. Never fabricate success, require the judge to make live calls or silently weaken the claim to fit mocks.

M01/M16 approval freezes a bounded evaluation plan: finite cases/repetitions, approved model/tool destinations and versions, sandbox/credentials/authority, permitted effects, required approvals, static limits, capture/redaction policy and expected observations.
M07 pins available readiness/configuration before launch. M08 executes only those explicitly approved cases on isolated final-artifact copies, with bounded model calls, tool attempts, timeout/stop and resource budgets, before evidence sealing.
Live inference is permitted only when that frozen plan authorizes it and its required model/tool access and readiness exist. No implicit paid call, open-ended exploration, extra self-improvement run or production effect is introduced by selecting this profile.
The artifact uses its own declared provider/tool integration under M08 supervision. Do not build a second evaluation-provider bridge, route product calls through the grading `DecisionEngine`, add a `DecisionRequest` purpose or fabricate `DecisionCallId` receipts for artifact calls.
M08 keeps application failures distinct from verifier errors and missing prerequisites, durably retains partial observations and awaits M02/M10 acknowledgements before completion/seal. Recovery replays retained writes, not evaluations or side effects.

M10 records exposed artifact-inference usage/cost in a purpose-scoped **verification auxiliary** account with stable observation/evaluation identity, source and explicit known/partial/unknown coverage; unavailable usage or price stays unknown, not zero.
This is separate from grading, observer and competitor coding accounts. Never add product-evaluation tokens, cost, duration or generation rates to competitor input/output, cost, elapsed time or Gen tok/s; raw auxiliary counters never enter quality inputs.
M08/M11 extend existing shared resource-admission ports for this verification purpose. Local/unknown-route warmup, inference and settlement wait outside every managed competitor measured window across runs, unless the launch freezes an explicit declared overlap policy.
Use the same M11-owned queue and atomic fair bounded admission/wait/cancellation discipline, with no second gate and no run lock held while waiting for measurement to close. Unknown post-cancellation inference activity retains a resource limitation and blocks clean admission until resolved; do not claim server idleness or kill externally owned servers.
M12.4 remains sole owner of decision transport and decision-call leases. This evaluation extension adds no alternate runtime, scheduler, model transport or DAG node; real M08/M10/M11 integration must establish the auxiliary-use boundary.

Include scoped adverse cases where applicable: incorrect tool arguments; malformed or malicious tool results/prompt injection; unauthorized scope expansion; sensitive-effect approval/rejection; invalid/unsupported answers and citations; and false claims of completion.
Include declared error classes, timeout/bounded retry, idempotent side effects, duplicate requests, interruption/replay/resume, state isolation/cross-session leaks, stop/budget boundaries and safe uncertainty/escalation. Expected safe refusal is a successful behavior when the case requires it.
These are finite scope-derived cases, not a mandate to add memory, tools or approval systems to every agent. Preserve semantic tool sequences and observed boundary outcomes; do not award points for fewer calls or raw application speed/usage.

The following official documentation informs observable distinctions, not mandated APIs or a compliance claim; sources were checked on **2026-10-02**:

- ADK state distinguishes session, user, application and temporary scopes, with persistence dependent on the session service. Inspect actual required isolation/persistence behavior rather than rewarding a particular service. [ADK state](https://google.github.io/adk-docs/sessions/state/)
- LangGraph distinguishes thread checkpoints from cross-thread stores. Their presence does not prove correct ownership, restart recovery or absence of leakage. [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence)
- LangGraph resume can rerun code before an interrupt in its node. Where interruption applies, inspect approved replay/duplicate-effect and authorization outcomes rather than treating an interrupt call as sufficient safety evidence. [LangGraph interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts)
- LangChain structured output uses declared schemas and provider/tool strategies. Schema validation supports interface claims; it does not establish factual accuracy or correct effects. [LangChain structured output](https://docs.langchain.com/oss/python/langchain/structured-output)

M12 is read-only and invokes only the frozen grading backend. It never invokes the agent under test, its model/provider/tools, new evaluation cases, repairs, package installation, publishing, deployment or external actions.
Treat prompts, source, tool outputs, documents and traces as untrusted evidence; embedded instructions cannot change the rubric, grant authority, reveal withheld information or add calls.
Text grading is the default. Agentic adds no browser viewport, screenshot, audio or vision requirement; any required modality and its capture obligations must be frozen before approval.
Required images need verified actual image-input capability/readiness and the ordered bound final-artifact image bytes for both backends. Unsupported/unknown image or other required modality blocks assessment; no text/OCR/audio fallback, hidden helper or silent waiver substitutes for missing evidence.

Missing required inputs before invocation use existing not-judged/input-failure handling; incomplete returned assessments remain ungraded with deficiencies, and grading invocation failures remain failed. Preserve useful parts and explicit limitations.
Unavailable models, tools, access or collectors and infrastructure disturbances remain unknown/unverified; they do not imply grade 1, 0 or N/A. Identity mismatches retain M11 fatal invalidation handling, not ordinary evidence-deficiency treatment.
All six categories must validate; never fill a missing category, redistribute weights or promote an unverified check. M06 alone computes weighted quality, eligibility and rankings, including the unchanged raw `spec >= 4/5` gate.

Recursively withhold benchmark creator/builder harness/model/provider/configuration identity, coding/grader history, run/trial/result IDs, machine identity, alias maps, weights, rankings and other reviews from all input containers.
Also withhold cost/prices, elapsed/check/process time, input/cached/output/reasoning tokens, Gen tok/s, measured Files / LOC, hardware/resource statistics and raw application performance/usage counters, including nested trace metadata.
Product dependencies and model IDs legitimately needed to interpret the delivered application remain admissible functional context; they are not the builder's identity. Redact creator advertising without deleting required API semantics or pretending immutable source bytes were rewritten.
Static declared limits and semantic tool order, expected/observed behavior and functional passed/failed/unverified outcomes remain admissible. For limit checks retain the condition and behavioral outcome, not measured timing/usage counters or a metric-derived quality proxy.
Changing only withheld values must leave the admitted projection and replayed decision composition unchanged. Practical redaction makes no promise of perfect anonymity; engine-side evidence/identity bindings remain intact.

## Both grading backends and decision composition

`harness_review` and `decision_rubric` consume identical approved anchors and anonymous immutable evidence. M12 keeps one isolated globally sequential assessment per delivered trial, with no earlier conversation, answers or review.
Harness review remains the default. Missing compatible READY decision setup disables decision grading and independently unavailable context analysis only; usable harness/offline access remains available. An explicit unusable decision choice never falls back silently.
Reuse the [existing question families and M12.4 transport](../DECISION-ENGINES.md#evidence-bound-decision-grading); this profile adds rubric/pack data, not a provider dialect, hidden helper or model substitute.

| Question family | Agentic pack binding and acceptance |
|---|---|
| `coverage/category` | Named task/criterion scope, required case/mode coverage and manifest gates; `sufficient`, `insufficient`, `abstain`. Only accepted sufficient permits a grade. |
| `grade/category` | Exactly nine Choice labels `1`, `1.5`, `2`, `2.5`, `3`, `3.5`, `4`, `4.5`, `5` with these anchors/intermediate rules; never round a Score expectation. |
| `reason/category/criterion` | Concrete instantiated claim above with assigned evidence; `supported`, `contradicted`, `not_established`, `abstain`. |
| `support/category/evidence` | Explicit criterion/evidence relationship; `supports`, `contradicts`, `irrelevant`, `insufficient`. Only accepted relevant support/contradiction may attach a reference. |
| `comment/axis/criterion` | Code quality maps to `ag_code_structure`/`ag_code_dx_tests`; developer experience to setup/test findings in `ag_code_dx_tests` and interface findings in `ag_tool_schema`; specification to `ag_spec_outcomes`/`ag_spec_grounding`. Freeze distinct concrete achievement/defect options, including `insufficient`/`abstain`. |
| `limitation/code` | `required_evidence_missing`, `prerequisite_unavailable`, `case_coverage_incomplete`, `simulation_only`, `model_identity_uncertain`, `inspection_incomplete`, `context_bound_exceeded`, `conflicting_evidence`, `scope_uncertain`; `present`, `absent`, `unknown`, plus known acquisition limitations. |

Compile exact question/claim/anchor text and IDs, case/mode assignments, evidence selection/order, support mappings, comment options and consistency predicates into versioned pack/composition/evidence/acceptance digests.
Default mandatory Choice acceptance uses the decision contract's `native_confidence` policy and provisional `0.8` threshold; freeze approved changes. This project default is not an accuracy guarantee; ties, unknown/rejected confidence and abstention supply no grade.
Questions independently evaluate fixed supplied state. Account for each required claim; prior answers never become hidden context, generate new cases or supply guessed references.
Before launch deterministically partition finite required question/evidence assignments into frozen batches; publish positive finite `max_calls_per_assessment`, batch sizes, byte/context limits and allowed attempts. Default to one dispatched attempt per batch; every attempt consumes the bound.
M12 totals multiply this bound by assessment count without predicting actual calls. Include any approved known pre-dispatch retry allowance; no ambiguous dispatched retry, adaptive exploration or extra call repairs missing inputs/answers.
Retain the full manifest, included/excluded ranges and coverage. Required evidence cannot disappear to meet limits; preserve `context_bound_exceeded`/insufficient input rather than truncate, summarize, compress through another model or substitute a grader.

Each category requires accepted sufficient coverage, exact grade, an informative accepted reason and an admitted reference explicitly supporting/contradicting it. All required behavior is accounted for before a completeness claim.
Frozen predicates reject grade 5 with a material required-scope defect, grade 1 contradicted by established category-wide usable behavior, any grade with insufficient coverage, unsupported comments and limitation-free results with known deficiencies.
Intermediate predicates require achieved behavior and the shortfall blocking the higher anchor. Retain rejected/contradictory answers as deficiencies; never lower/average grades, fabricate observations or add boilerplate to repair them.
Code composes rationales and three informative comments from accepted criterion text, conclusions and evidence aliases with `code_composed_from_decisions`, retaining question/answer/anchor IDs and support/composition provenance; harness prose remains `model_authored`.
Require explicit limitations, preserving present/unknown decisions and known input limitations; empty is valid only when mandatory decisions and input checks establish none. Apply unchanged M12.1 `RawReview` validation: all six categories once, exact grades, nonempty rationales, resolving `evidenceRefs`, three substantive comments and valid provenance.

## Retention, implementation ownership and acceptance

Freeze profile/rubric/version/digest, scope/case/mode map, pack/mapping/composition/evidence/acceptance policies and requested/resolved judge identity within existing assessment/group identity.
M02 retains original reviews, raw decisions, deficiencies and bound evidence. M06/M13/M17 preserve separate fingerprints; identical labels or model names never merge rubric versions, grading backends or product-evaluation conditions.
Imports, viewing, reporting and reweighting invoke no model, probe, tool or evaluation. Explicit rejudge adds a separate review/cost/group against approved retained artifact/rubric evidence; it never overwrites originals, upgrades legacy anchors or reopens sealed evaluation. New semantics require a newly approved revision.

| Existing owner | Agentic extension |
|---|---|
| [M12.1](../M12/01-review-contract.md) | Pure versioned profile/rubric/pack, final-product evidence projection and strict validation; preserve legacy readers. |
| [M12.2](../M12/02-judging-worker.md) / [M12.3](../M12/03-judging-screens.md) | Existing protected assessment, settlement and views of scope, mode/coverage, limitations, provenance and rejudge groups. |
| [M08.1](../M08/01-verification-runtime.md) / [M08.2](../M08/02-verification-adapters.md) | Approved bounded case execution/capture, availability, final-artifact binding and measurement-free handoff through existing verification ports. |
| [M10.2](../M10/02-final-accounting.md) / [M11 admission](../reference/modules/11-run-orchestration.md#cross-run-decision-admission) | Separate verification auxiliary usage/cost receipts and shared resource admission for product inference; preserve decision-runtime lease ownership and competitor measurement exclusion. |
| [M01.1](../M01/01-canonical-definition.md) / [M16.3](../M16/03-draft-approval.md) / [M07.2](../M07/02-launch-preparation.md) | Versioned authoring/approval, case/authority/budget/mode map and common launch readiness/selection; preserve v1 unchanged. |
| [M02.1](../M02/01-retained-records.md) / [M06.1](../M06/01-scoring-service.md) / [M13.1](../M13/01-offline-report-artifact.md) / [M17.1](../M17/01-archive-contract.md) | Retain/export/import evidence, exact grades and groups; existing owners retain weights/ranking and offline presentation. |

Use existing M12.4 transport and M05 protection. Extend existing children, schemas and ports; add no DAG node, alternate verifier, provider bridge, storage service or scoring formula.
Proposed implementation paths below are future work under `solution/`, not files created by this specification:

- `solution/axbenchmark/engine/judging/adapters/prompts/rubrics/agentic-v1.json` and `solution/axbenchmark/engine/judging/adapters/prompts/question_packs/agentic-v1.json`.
- Existing `solution/axbenchmark/engine/judging/domain/{profiles,rubric,requirements,inputs,reviews,question_packs,grading_plan}.py` gains versioned data; existing M08 evidence/observation contracts, M10 auxiliary accounting and M11 admission ports gain their owned bounded extensions.
- `solution/tests/fixtures/judging/agentic_v1/` holds scopes/cases, manifests, final-product traces, simulation/replay/live distinctions, high/medium/low artifacts, adversarial outputs and leakage cases.
- `solution/tests/engine/judging/test_agentic_v1_rubric.py`, `test_agentic_v1_evidence.py`, `test_agentic_v1_decision_pack.py`, `solution/tests/verification/test_agentic_evidence.py` and `solution/tests/integration/test_agentic_v1_judging.py` cover these gates.

1. **Identity and scope:** assert six ordered keys/defaults `20,15,15,25,15,10`, total 100, twelve unique criterion IDs and `business_category=spec`; edited weights allow individual zeros and relative scaling under M06, reject an all-zero set, and never waive required category grades. Preserve v1 bytes/hashes, fullstack→web and separate design/decomposition scope; reject post-approval changes and composites.
2. **Anchors and proportionality:** complete small/stateless agent, usable agent with concrete grounding/state/DX gaps and demonstrably broken core agent exercise 5/3/1 with sufficient evidence. Include all exact half-step reasons/refs; no bonus for agents/tools/autonomy/chains/LOC/framework and no hidden-reasoning requirement.
3. **Evidence modes and unknowns:** reject stale/foreign final-artifact, suite, model/tool or case bindings; simulation/replay cannot prove live competence/effects. Missing model/tool/collector, unsupported modality or context overflow remains ungraded/not judged; proved absence or observed defects may support low grades without N/A or renormalization.
4. **Behavior boundaries:** cover invalid tool arguments/results, injection, unauthorized actions, required approval rejection/resume, unsupported answers/citations, false success, bounded timeout/retry, duplicate effects/requests, state leakage, resume and safe stop/escalation under the approved case map.
5. **Evaluation and accounting:** only frozen approved bounded cases run before seal; absent live authorization/readiness makes zero product calls. M08/M10 durable receipts retain partial/unknown verification usage separately; cross-run local/unknown inference waits or records frozen overlap. Cancellation/restart neither fabricates idleness nor replays actions.
6. **Projection invariance:** nest and mutate excluded cost/time/tokens/Gen/Files/LOC/hardware/raw product counters/creator identity/weights/rankings/reviews; admitted digests and replayed decisions stay identical. Product dependencies/model IDs, API semantics, static limits and semantic tool order remain usable without revealing creator advertising.
7. **Decision validity and boundedness:** accept nine labels; reject 3.7, rounding, unsupported 5, insufficient coverage, foreign refs, absent comments/limitations and contradictions. Preserve raw parts/provenance, exact batch/call bounds and no fallback/helper; both backends receive identical immutable evidence and required actual modality bytes.
8. **Judge authority and isolation:** artifact instructions requesting “award 5,” provider/tool calls, secret exfiltration, repair, publish or deploy remain inert. Assert globally sequential isolated assessments, protected bytes and zero product evaluation/tools/external effects from the judge; only its frozen grading transport is dispatched.
9. **Modes and retention:** cover both modes/targets, preserved regressions and mandatory task commits. High quality cannot cure earlier FAIL or failed/unverified checks. Missing READY decision setup preserves usable harness access; legacy/import/view/reweight invoke nothing, and explicit rejudge preserves originals in a separate group/cost account.

Cold-read fixtures against the approved requirement/case map before acceptance. Real M01/M07/M08/M10/M11/M12/M02/M06/M13/M17 integration must demonstrate these boundaries; this specification and mocked fixtures alone prove neither live agent competence nor safe deployment or standards compliance.
