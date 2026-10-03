# Backend quality judge contract

Status: proposed implementation contract for internal engineers; no judge, fixture or runtime capability is implemented by this document.
An engineer should be able to encode the backend rubric, construct either grading backend's evidence input, and reject an unsupported assessment without inventing a grade.
Authority: [M12](../reference/modules/12-quality-judging.md), [M12.1](../M12/01-review-contract.md), [decision grading](../DECISION-ENGINES.md#evidence-bound-decision-grading), and [measurement exclusion](../BENCHMARK-STATISTICS.md#eligibility-compatibility-and-exact-ordering).

The two automated-backend sections below also supply the frozen rubric/evidence contract to `human_review` through [M12.5](../M12/05-human-review-web.md). All three backends use M12.1's identical six-grade, evidence, three-comment-axis and limitations validator. Human readiness concerns the trusted renderer/evidence, not model capability; the existing human pending/submission lifecycle is unchanged. Only defaults sum to 100: edited weights are exact finite nonnegative values with a positive total, including individual zeroes, and never waive a required grade.

## Profile identity and approved scope

- `profile_id = backend`; `rubric_version = backend/2`; `business_category = spec`.
- Preserve the six labels, order and default weights below. The weights and grading policies are AxBenchmark project choices, not requirements imposed by an external standard.
- Backend projects select this profile by default; fullstack projects keep the web profile. A backend component benchmark must explicitly author a backend-scoped benchmark/revision before approval, with that boundary visible in its specification.
- A backend-scoped revision adds no UI, visual or accessibility coverage, composite score or second profile. It cannot silently omit existing UI requirements. Future mixed-domain/custom profiles require their own frozen contract; this contract cannot satisfy a request to grade UI.
- M01/M16 freeze named required features, rubric bytes, criterion applicability and evidence obligations with the template revision. M07 uses that approved selection for every competitor; launch or rejudge cannot swap the profile after approval.
- This enriched rubric is a new version. Existing backend and web payloads, keys, reviews and grade meanings remain as retained; never rewrite an old rubric as `backend/2`. Loading legacy evidence does not trigger new judging.

Apply the same rules to `one_shot` and `multi_step`, from scratch and modification of an existing repository. Judge the delivered artifact against the approved scope, including required baseline preservation; neither mode earns a bonus.
The [mandatory task-commit contract](../BENCHMARK-MODES.md#mandatory-task-commits) remains binding. A grade never repairs a missing task commit, process failure, or failed/unverified required check.

Before approval, derive a finite feature map from the approved specifications: feature ID, exact requirement reference, relevant criterion IDs, required evidence classes/selectors, and M08 observation/check IDs.
Record conditional branches as in-scope or out-of-scope with a requirement reference and reason. Authentication, authorization, tenants, databases, queues, pagination, migrations, concurrency and deployment infrastructure apply only when required by that scope.
Do not invent enterprise features or require a preferred framework, architecture pattern, SQL database, cloud service, container, or dependency count. A small service can earn 5 in every category.
An out-of-scope branch removes no category and redistributes no weight. Freeze the narrower observable claim before approval; ambiguity that prevents a required claim being evaluated blocks approval or later grading as appropriate.

## Ordered categories and observable anchors

Every grade is an exact value in `1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5`, parsed by M12's Fraction-based validator without rounding.
The universal anchors remain **1: missing or largely broken; 3: usable with material gaps; 5: excellent for the defined scope**. These category anchors specialize those meanings.

| Order / key | Label / default weight | Observable scope | 1 | 3 | 5 |
|---|---|---|---|---|---|
| 1 / `developer_experience` | Developer experience / 25% | Consumer setup, invocation, examples and diagnosable integration | Retained observations show the required setup or first usable interaction is missing or largely broken. | A consumer can complete the main interaction, but reproducible setup, examples or actionable diagnostics have material gaps. | Required setup and representative interactions are reproducible, clear and consistent; examples and diagnostics support the defined consumer tasks. |
| 2 / `api_interface_design` | API/interface design / 15% | Declared HTTP, RPC, library, command or message contract; validation and errors | Core operations or their shapes/semantics contradict the required interface, making integration largely unusable. | Main operations are usable, with material inconsistencies in validation, errors, boundary values or declared compatibility. | Required operations, types, validation, error semantics and applicable compatibility rules form a coherent, predictable contract with demonstrated boundary behavior. |
| 3 / `code_quality` | Code quality / 20% | Traceable behavior, responsibilities, maintainability and meaningful delivered tests | Core behavior is opaque or materially inconsistent; retained source/test evidence shows changes cannot be reasoned about safely. | The main implementation is understandable, but coupling, duplicated rules or missing meaningful tests create material maintenance gaps. | Responsibilities and invariants are clear, complexity fits the scope, and focused delivered tests exercise the important behaviors and failure paths. |
| 4 / `spec` | Business rules/specification / 25% | Named features, transitions, validation, permissions and persistence invariants | Required core features or business invariants are absent or demonstrably largely broken. | Main features work, but required rules, edge cases or baseline preservation have material gaps. | Every named required feature and applicable invariant is supported by implementation and retained behavioral evidence, including relevant boundaries and preserved baseline behavior. |
| 5 / `robustness` | Robustness / 10% | Failure containment, invalid inputs, retry/concurrency behavior and recovery | Demonstrated ordinary failures corrupt required state, violate boundaries or leave the principal workflow unrecoverable. | Ordinary use succeeds, but required failure, duplicate/concurrent-operation or recovery scenarios have material gaps. | Required failure scenarios preserve invariants, contain errors and recover predictably; applicable retry, concurrency, shutdown and cancellation behavior is evidenced. |
| 6 / `operability_documentation` | Operability/documentation / 5% | Configuration, safe lifecycle, diagnostics, recovery guidance and accurate documentation | Required startup/configuration or operating instructions are absent or dangerously contradicted by observed behavior. | The service can be operated in the intended environment, with material gaps in diagnostics, lifecycle or accurate recovery/configuration guidance. | Required configuration, lifecycle and recovery are documented and evidenced; diagnostics are actionable, secrets are handled safely, and operational instructions match delivery. |

Use 2 for substantial working portions that remain below usable-with-material-gaps, and 4 for a sound usable category with specific remaining shortcomings below excellent-for-scope.
Use 1.5, 2.5, 3.5 or 4.5 only when cited evidence places the category between its adjacent integer anchors. Identify the achieved behaviors and the concrete shortfall preventing the higher anchor.
Do not average criterion answers into a category grade, infer a grade from pass counts, or award points for verbosity, more files/LOC, dependencies, framework prestige or unrequested sophistication.
High grades require evidence across the category's required scope; one attractive endpoint or a passing happy path does not establish excellence. Anchor selection must account for every admitted material contradiction.

## Frozen criterion and evidence map

The following IDs are stable within `backend/2`. Each row supplies a concrete affirmative claim; the pack retains its supported, contradicted, not-established or abstained status.
Instantiate claims with the approved feature/interface/invariant IDs, not vague statements that the artifact is “good.” Required branches and selection rules freeze at approval; actual artifact ranges/evidence aliases resolve deterministically and freeze in the assessment manifest without imposing a competitor file layout.

| Category | Criterion ID and affirmative claim | Required evidence gate |
|---|---|---|
| `developer_experience` | `be_dx_setup`: the documented setup and first interaction reproduce the required consumer workflow. | Setup/configuration instructions and examples, corresponding entrypoints, retained M08 setup and representative interface observations. |
| `developer_experience` | `be_dx_diagnostics`: required consumer mistakes produce actionable, consistent guidance. | Declared error/help contract, implementation and retained invalid-input or missing-configuration observations. |
| `api_interface_design` | `be_api_contract`: declared operations, representations and state effects agree at the required boundaries. | Interface schema/signatures, handlers and retained success/boundary request-response or invocation evidence. |
| `api_interface_design` | `be_api_errors`: validation, errors, permissions and applicable retry/compatibility semantics are coherent. | Contract and validation/error/access-control code; relevant malformed, denied, duplicate or version-compatibility observations. |
| `code_quality` | `be_code_structure`: responsibilities and important rule ownership are traceable and proportional to the scope. | Delivered source covering entrypoints, domain rules and applicable persistence/external adapters, with exact ranges. |
| `code_quality` | `be_code_tests`: delivered tests meaningfully assert required behavior and relevant failure paths. | Test source and fixtures plus M08 outcomes for the approved test execution; test names or counts alone are insufficient. |
| `spec` | `be_spec_features`: each named feature and required baseline behavior is implemented as specified. | Requirement-to-source map and retained observations covering each named feature and required baseline regression. |
| `spec` | `be_spec_invariants`: required transitions, authorization and data invariants hold at relevant boundaries. | Rule/storage code and retained invalid-transition, boundary, permission or integrity observations as applicable. |
| `robustness` | `be_robust_failures`: expected input/dependency failures are contained without invalid required state or leaked secrets. | Error/recovery code and retained approved fault/invalid-input observations with resulting state. |
| `robustness` | `be_robust_recovery`: required retry, concurrency, migration and lifecycle recovery preserve invariants. | Applicable coordination/transaction/lifecycle code and retained duplicate/concurrent, rollback, restart or shutdown observations. |
| `operability_documentation` | `be_ops_config`: required startup, configuration, secrets and operational controls behave as documented. | Configuration schema/examples, startup/management code, redacted retained configuration and lifecycle observations. |
| `operability_documentation` | `be_ops_guidance`: diagnostics and recovery instructions accurately support the defined operator tasks. | README/runbook, log/error definitions and retained health/failure/recovery observations for required operator tasks. |

Static claims require readable relevant source. Behavioral claims require the corresponding retained observation plus enough contract/source context to interpret it; a source comment or README assertion is not proof of execution.
An absence established by a complete manifest/source inspection can satisfy the gate for an evidenced missing-deliverable finding; an unavailable collector cannot. Required test coverage derives from the approved rubric/scope, not a new test-count target.
One artifact reference may support several claims only with an explicit mapping and separate support decision for each relationship. Preserve contradictory evidence; selection cannot keep only favorable examples.
For modification tasks, use approved baseline/specification context and retained regressions to assess required preserved behavior. Do not reward or penalize a raw diff size.

## Backend evidence and bounded technical interpretation

Admit the pinned delivered artifact/source, interface definitions, dependency/configuration manifests, delivered test source, documentation, the approved specifications/tasks, and M08's measurement-free behavioral projection.
Bind every excerpt, observation and reference to the same immutable delivered snapshot. Keep safe relative paths, content digests, check/feature aliases and readable ranges; engine-side mappings retain real result/trial identity.
Required evidence includes relevant success and failure outcomes, actual response/error shapes, observed state transitions and retained application diagnostics. Sensitive values remain redacted without fabricating substitute observations.

- **Interfaces:** inspect named operations, input/output types, validation, boundary values, error shape and declared pagination/versioning when required. HTTP idempotency concerns repeated intended effects, rather than identical response bytes; apply method semantics only to HTTP interfaces. [RFC 9110 §9.2.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2)
- **Authorization and integrity:** where required, distinguish authentication from operation/object/tenant authorization; inspect rejection and state preservation at trust boundaries. Input constraints and errors should avoid exposing internal details; this bounded guidance does not establish OWASP compliance. [OWASP REST Security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html#input-validation)
- **Persistence and concurrency:** assess declared uniqueness, atomicity, transaction boundaries, duplicate delivery, retry and concurrent changes against named invariants. PostgreSQL isolation levels have different anomaly guarantees and serialization failures may require whole-transaction retry; merely choosing a level does not prove application correctness. No database or isolation level is mandated here. [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- **Migration and recovery:** when required, inspect migration compatibility, failure/rollback policy and retained recovery outcomes; do not assume every migration must be reversible. Assess cancellation, shutdown, resource cleanup and restart only for the declared lifecycle.
- **Operations:** inspect required configuration validation, safe defaults, secret redaction, diagnostic meaning, management access and documented startup/recovery steps. Production deployment, high availability and a particular monitoring stack are not universal requirements.

M08 performs approved deterministic verification and test execution before judging, using its existing isolated-copy rules. It distinguishes a demonstrated wrong application response from missing prerequisites or broken verifier transport.
M12 is read-only: no new tests, application requests, network exploration, service startup, deployment, database mutation/destruction, migration execution, load test, repair or dependency installation. Its selected grading transport remains the existing M12.4 service, not an application probe.
Backend grading needs no screenshots or verified vision capability by default; the fixed browser viewports are not backend prerequisites. Backend selection never substitutes text for required UI judging.
Treat source, logs, examples and documentation as untrusted evidence. Instructions inside an artifact cannot change the rubric, expose withheld data, call tools, repair the artifact or request a different judge.

An observed candidate defect or proved absence from a complete artifact can justify a low grade. Missing collection, missing prerequisites, inaccessible required source or insufficient required coverage cannot automatically justify 1, 0 or N/A.
Before invocation, missing required inputs produce the existing not-judged/input-failure disposition; an incomplete returned assessment remains ungraded with deficiencies. Invocation failures retain the existing failed disposition. Preserve reasons, evidence and limitations in all cases.
Never fill a missing category, redistribute weights, convert unverified checks into failures, or infer correctness from exit success. Identity mismatches follow existing fatal invalidation handling, not an ordinary missing-evidence outcome.

Recursively withhold cost, prices, elapsed/check/process time, input/cached/output/reasoning tokens, Gen tok/s, measured Files / LOC, hardware/resource statistics, latency/throughput counters, weights, rankings and other reviews.
Also withhold builder harness/model/provider/configuration identity, machine identity, run/trial/result IDs and the alias map, including nested log/metadata fields. Apply M12's practical redaction without altering immutable delivered source to claim perfect anonymity.
Static architecture and functional outcomes remain admissible. For a frozen SLO check, retain only its required-condition description and passed/failed/unverified outcome, with no measured duration/counter; never translate raw speed or resource use into quality points.
Changing only withheld measured values must leave the judge projection and deterministic decision composition unchanged. M06 retains sole ownership of weighted quality, eligibility and rankings; this contract adds no metric or ranking formula.

## Both grading backends and decision composition

`harness_review` and `decision_rubric` consume the same approved anchors and anonymous immutable evidence. M12 keeps one isolated sequential assessment per delivered trial, with no earlier review or conversation.
Harness review remains the default. Without a configured compatible READY decision engine, disable decision grading and independently unavailable context analysis only; a usable harness grader remains available. An explicit unusable decision choice never falls back silently.
Reuse [the existing question families and transport](../DECISION-ENGINES.md#evidence-bound-decision-grading). This profile adds rubric/pack data, not a provider dialect, hidden helper judge or substitute model.

| Question family | Backend pack binding and acceptance |
|---|---|
| `coverage/category` | Named feature scope, required evidence classes and manifest coverage; `sufficient`, `insufficient`, `abstain`. Only accepted sufficient permits a grade. |
| `grade/category` | Exactly nine Choice labels `1`, `1.5`, `2`, `2.5`, `3`, `3.5`, `4`, `4.5`, `5`, each carrying these anchors and intermediate rules. Never round a Score expectation. |
| `reason/category/criterion` | Each applicable concrete criterion above and its frozen evidence assignment; `supported`, `contradicted`, `not_established`, `abstain`. |
| `support/category/evidence` | One explicit criterion/evidence relationship; `supports`, `contradicts`, `irrelevant`, `insufficient`. Only relevant accepted support/contradiction supplies an attached reference. |
| `comment/axis/criterion` | Code quality maps to `be_code_structure` and `be_code_tests`; developer experience to `be_dx_setup` and `be_dx_diagnostics`; specification to `be_spec_features` and `be_spec_invariants`. Use concrete supported-achievement or evidenced-defect conclusions, plus `insufficient`/`abstain`. |
| `limitation/code` | `required_evidence_missing`, `prerequisite_unavailable`, `inspection_incomplete`, `context_bound_exceeded`, `conflicting_evidence`, `scope_uncertain`; `present`, `absent`, `unknown`. Include known acquisition limitations independently. |

Pack compilation freezes exact claim text, applicable feature IDs, evidence-selection order, input/context limits, question IDs, concrete comment options, and grade/reason consistency predicates. Every instruction names its actual target and assigned evidence; IDs alone carry no semantics.
All questions evaluate fixed supplied state independently. A prior answer is not hidden context for another question. No accepted reason or evidence reference may be guessed from the chosen grade.
Publish a positive finite `max_calls_per_assessment` with the grading plan before launch: deterministically partition the complete required question/evidence assignments into frozen batches and sum their frozen allowed attempts.
Publish batch sizes, byte/context limits and per-batch attempt bounds alongside that integer; every dispatched attempt consumes the bound. There are no adaptive exploration calls. Reject a plan that cannot cover the required scope within the selected engine limits.
If runtime packing cannot preserve required inputs, retain `context_bound_exceeded` and the existing ungraded/not-judged outcome. Keep full manifest, included/excluded ranges and coverage; no silent truncation, generated summary, hidden compression or extra calls.

For each category require accepted sufficient coverage, exact grade, at least one informative concrete reason and a resolving admitted reference that explicitly supports or contradicts that reason. Every required claim must be accounted for; unresolved required behavior prevents a high-grade completeness claim.
The frozen consistency predicates reject grade 5 with an established material required-scope defect, grade 1 with reasons establishing the category's usable main behavior and no largely-broken claim, or any grade with insufficient/abstained coverage.
Also reject a positive comment contradicted by its selected evidence and a limitation-free result with known missing required evidence. Preserve the contradictory raw answers as ungraded; never lower, average, retry beyond bounds or silently repair the grade.
Intermediate-grade predicates require both an achieved anchor element and the cited shortfall blocking its next higher anchor. Unsupported/default answers cannot produce a complete review.

Code composes rationales and all three comments from accepted criterion text, conclusion and evidence aliases. Retain question/answer/anchor IDs, support decisions and pack/composition digests with `code_composed_from_decisions`; harness commentary remains `model_authored`.
Each of code quality, developer experience and specification needs at least one informative supported conclusion. Generic anchor repetition is insufficient. Include an explicit limitations list; empty is valid only after all mandatory limitation decisions and input checks establish none.
Run the composed or harness-produced `RawReview` through unchanged M12.1 validation: all six categories once, exact grades, nonempty rationales, resolving `evidenceRefs`, the three comment axes, explicit limitations and valid provenance.

## Retention, implementation ownership and acceptance

Freeze rubric/profile/version/digest, criterion/applicability map, question pack, mapping/composition/evidence policies and acceptance policy in the existing assessment/group identity, alongside backend and requested/resolved judge identity.
M02 retains original reviews and deficiencies; M06/M13/M17 keep different fingerprints separate. Reweighting, viewing, report generation and importing perform no assessment, probe or new evidence collection.
Explicit rejudging adds a separately retained review/cost/group against the approved artifact/rubric; it never overwrites the original or upgrades legacy anchors. Changing rubric semantics requires a newly approved template revision.

| Existing owner | Backend extension |
|---|---|
| M12.1 | Pure profile/version/rubric, criterion pack, projection, exact validation and fixtures; preserve legacy readers. |
| M12.2 / M12.3 | Existing protected harness/decision assessment, settlement and retention; display scope, evidence deficiencies, provenance and rejudge groups. |
| M08.1–2 | Approved deterministic interface/repository/test observations and measurement-free handoff; no judge-owned verifier. |
| M01 / M16 / M07 | Canonical frozen rubric/applicability, draft approval and common launch selection; a backend component requires an explicitly backend-scoped revision before approval. |
| M02 / M06 / M13 / M17 | Retain/export evidence and identities, compute weights/rankings and render offline without reinterpretation. |

Use the existing M12.4 decision runtime and M05 protection contract. These are extensions within existing children; add no DAG node or alternate validation, transport, storage or scoring service.
Proposed implementation paths below are future work under `solution/`, not files created by this specification:

- `solution/axbenchmark/engine/judging/adapters/prompts/rubrics/backend-v2.json` and `solution/axbenchmark/engine/judging/adapters/prompts/question_packs/backend-v2.json`; retain the existing `backend.json` payload unchanged.
- Existing `solution/axbenchmark/engine/judging/domain/{profiles,rubric,inputs,reviews,question_packs,grading_plan}.py` and M12.2 adapters gain versioned data handling.
- `solution/tests/fixtures/judging/backend_v2/` holds approved scopes, manifests, high/medium/low artifacts, response packs and leakage/unsafe-input cases.
- `solution/tests/engine/judging/test_backend_v2_rubric.py`, `test_backend_v2_evidence.py`, `test_backend_v2_decision_pack.py` and `solution/tests/integration/test_backend_v2_judging.py` cover the following acceptance cases.

1. **Identity and scope:** assert six ordered keys/labels, defaults `25,15,20,25,10,5` totaling 100 and `business_category=spec`; reject category/version mismatch. Approve backend and explicit backend-scoped component revisions; fullstack retains web. Reject post-approval profile changes and implied UI coverage.
2. **High/medium/low anchors:** a small complete service, usable service with concrete material boundary/documentation gaps, and service with observed broken core behavior exercise 5/3/1 anchors. Store per-category expected explanations/refs, and intermediate fixtures showing both achieved behavior and next-anchor shortfall; passing checks alone cannot dictate grades.
3. **Evidence distinction:** missing collector output, unavailable database prerequisite, unreadable source and context overflow remain ungraded/not judged; proved missing required behavior and observed corruption can justify low grades. Assert no 0/1/N/A substitution or weight redistribution.
4. **Counter leakage and invariance:** nest token/price/time/Gen tok/s/Files/LOC/hardware/resource/latency/identity/ranking/other-review values in every supported container. Project them out recursively; mutate only those values and assert identical admitted payload digests and replayed decision grades/comments.
5. **Contradictory decisions:** accept all nine exact labels; reject 3.7, rounding, unsupported grade 5, grade with insufficient coverage, unsupported comments, foreign refs, missing rationale/limitations and conflicting support. Keep raw decisions and provenance without a guessed replacement.
6. **Injection and operations:** seed source/logs/docs with instructions to award 5, contact a host, run a migration, destroy a database or repair code. Assert inert evidence, protected roots, zero application requests/network probes/new verification/repairs and no grading dispatch beyond the frozen call bound.
7. **Modes and checks:** run scratch/modify fixtures under both one-shot and multi-step, including preserved baseline regressions and mandatory task commits. A favorable review never overrides failed/unverified checks, failed processes or an earlier task-commit FAIL; no automatic commit or retry appears.
8. **Backends and retention:** same anchors/evidence reach both backends; missing READY decision setup disables only its applicable roles. Retain new/legacy/imported reviews separately, export/report offline, explicitly add a rejudge, and change weights with zero model calls and unchanged original bytes.

Cold-review the fixtures against the approved feature map before accepting implementation. Real M01/M08/M12/M02/M06/M13/M17 integration must demonstrate these boundaries; rubric fixtures alone do not prove judge capability, successful deployment or standards compliance.
