# DevOps quality judge contract

Status: proposed implementation contract for internal engineers; this document implements no judge, deployment runner, cloud access or infrastructure capability.
An engineer should be able to encode the DevOps rubric, prepare either grading backend's inputs, and reject unsupported assessments without inventing grades.
Authority: [M12](../reference/modules/12-quality-judging.md), [M12.1](../M12/01-review-contract.md), [decision grading](../DECISION-ENGINES.md#evidence-bound-decision-grading), and [measurement exclusion](../BENCHMARK-STATISTICS.md#eligibility-compatibility-and-exact-ordering).

The two automated-backend sections below also supply the frozen rubric/evidence contract to `human_review` through [M12.5](../M12/05-human-review-web.md). All three backends use M12.1's identical six-grade, evidence, three-comment-axis and limitations validator. Human readiness concerns the trusted renderer/evidence, not model capability; the existing human pending/submission lifecycle is unchanged. Only defaults sum to 100: edited weights are exact finite nonnegative values with a positive total, including individual zeroes, and never waive a required grade.

## Profile identity and approved scope

- `project_type = devops`; `profile_id = devops`; `rubric_version = devops/1`; `business_category = spec`.
- Add DevOps to new-authoring v2 domain/profile validation. Preserve v1 accepted values, schema bytes, hashes, reviews and interpretation; importing existing records never reclassifies them as DevOps.
- This profile grades delivered infrastructure as code, configuration, CI/CD workflows, deployment automation and operational runbooks. It does not grade the developer harness, its execution efficiency, infrastructure price or benchmark performance.
- Select one primary profile for the approved domain. Fullstack remains web; a DevOps component needs an explicitly DevOps-scoped approved revision. No custom composite, implied UI coverage or post-approval profile switch is introduced.
- Preserve the six ordered keys below. Positive default weights sum to 100 and remain editable through M06; defaults, anchors and grading policies are AxBenchmark project choices, not an external standard or certification.
- M01/M16 freeze rubric bytes, named requirements, applicability, target environments and evidence obligations before approval. M07 uses that same approved selection for every competitor; rejudge cannot silently change its semantics.

Apply the same contract to `one_shot` and `multi_step`, with `from_scratch` and `modify` targets. Judge delivered behavior and required baseline preservation; neither mode receives a bonus.
The [mandatory task-commit contract](../BENCHMARK-MODES.md#mandatory-task-commits) remains binding. A favorable review cannot cure process failure, a failed/unverified required check, or an earlier task-commit FAIL.
No minimum LOC, file count, enterprise scale, cloud service, Kubernetes, Terraform, container, paid service or preferred stack is required. Small local automation or a scoped runbook can earn 5 throughout; extra features and stack prestige earn no credit.

Before approval, derive a finite feature map: requirement/feature ID, desired state or operating task, criterion IDs, target/environment matrix, expected conditions, evidence classes/selectors and M08 observation/check IDs.
Mark conditional branches with a requirement reference and in-scope/out-of-scope reason: persistent state, approval gates, promotion, rollback, drift, secrets, cloud permissions and external dependencies apply only where authored or inherent in the declared operations.
Freeze a narrower observable claim for an absent branch; no category disappears, receives N/A or redistributes weight. A no-cloud scope still requires evidence of its actual local permissions, state boundary and data handling.
Runbook-only scopes map source/design claims to the delivered instructions, examples and verification steps, and behavioral claims to approved disposable rehearsals. They do not acquire an unrequested executable application requirement.
Unresolved scope or unsupported required targets block approval; later lost tooling/access/capture remains an explicit evidence deficiency. Never narrow scope after observing a competitor's failure.

## Ordered categories and observable anchors

Every raw grade is exactly `1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5`, parsed by M12's Fraction validator without rounding.
Universal anchors remain **1: missing or largely broken; 3: usable with material gaps; 5: excellent for the defined scope**.

| Order / key | Label / default weight | Observable scope | 1 | 3 | 5 |
|---|---|---|---|---|---|
| 1 / `developer_experience` | Developer experience/reproducibility / 20% | Setup, declared inputs, dependency/version pinning and repeatable invocation | Retained observations show required setup or first intended operation is absent or largely unusable. | Main use succeeds, with material gaps in instructions, input resolution or reproducible dependency/environment setup. | Required setup and operations reproduce from declared inputs; applicable versions/dependencies are controlled and examples support the intended user tasks. |
| 2 / `change_interface_design` | Change/interface design / 15% | Configuration/command contracts, readable changes and environment promotion | Required inputs, change semantics or environment selection are materially misleading or largely broken. | Main changes are usable, but validation, change review or required promotion boundaries have material inconsistencies. | Inputs, outputs and changes are coherent and reviewable; required promotion preserves the intended artifact/configuration and exposes consequential differences. |
| 3 / `code_quality` | Code/configuration quality / 20% | Traceable responsibilities, maintainable rules and meaningful verification | Core configuration, code or instructions are opaque or materially contradictory, preventing safe reasoning about changes. | Main logic is understandable, with material duplication, coupling or weak verification of important behavior. | Responsibilities and important rules are traceable, complexity fits the scope, and delivered checks or rehearsal steps meaningfully cover behavior and failure paths. |
| 4 / `spec` | Business rules/specification / 25% | Named requirements, desired state, convergence and baseline preservation | Required core operations or desired-state invariants are absent or demonstrably largely broken. | Main requirements work, but required boundaries, convergence/drift handling or baseline preservation have material gaps. | Every named requirement and applicable state invariant is supported, including repeated execution, drift handling and preserved behavior where required. |
| 5 / `safety_recovery` | Safety/recovery / 15% | Secrets, least privilege, approvals, state isolation and failure recovery | Observed behavior exposes secrets, breaches required authority/state boundaries or leaves core changes dangerously unrecoverable. | Main protections and recovery are usable, with material gaps in permissions, approval enforcement, failure containment or required restoration. | Actual authority and secrets are bounded; required approvals/state isolation hold, and evidenced failure handling and rollback or roll-forward preserve declared invariants. |
| 6 / `operability_documentation` | Operability/documentation / 5% | Diagnostics, declared health conditions and accurate operational guidance | Required operational status or instructions are missing or dangerously contradicted by observed outcomes. | Main operations are supportable, with material gaps in diagnostic meaning, health interpretation or runbook accuracy. | Required status and failures are diagnosable; concise instructions support operation, escalation and recovery with observable conditions matching the delivered artifact. |

Use 2 for substantial working portions below usable-with-material-gaps; use 4 for a sound usable category with specific remaining shortcomings below excellent-for-scope.
Use half steps only when evidence places behavior between adjacent integer anchors; cite achieved behavior and the concrete shortfall preventing the higher anchor.
Never average criterion statuses, translate pass counts into grades, round a Score expectation or infer excellence from a clean lint/plan or a successful happy path.
Account for every admitted material contradiction. Successful recovery cannot conceal a secret leak, excessive authority or broken approval boundary within `safety_recovery`.

## Frozen criterion and evidence map

These twelve criterion IDs are stable within `devops/1`. Instantiate affirmative claims with approved feature/state/target IDs; retain supported, contradicted, not-established or abstained status.
Freeze required branches and selection rules before approval; resolve actual artifact ranges and evidence aliases deterministically into the assessment manifest without imposing a competitor file layout.

| Category | Criterion ID and affirmative claim | Required evidence gate |
|---|---|---|
| `developer_experience` | `do_dx_setup`: documented setup and invocation reproduce the required user/operator task. | Setup instructions, configuration examples and entrypoints plus retained M08 setup/invocation or runbook-rehearsal outcomes. |
| `developer_experience` | `do_dx_inputs`: declared inputs and applicable dependency/tool versions are reproducible across the approved environments. | Dependency/lock/version manifests or explicit dependency-free scope, input contract, resolved safe configuration and retained approved environment/repeat observations. |
| `change_interface_design` | `do_change_contract`: inputs, validation, outputs and proposed changes expose the intended effects and relevant hazards. | Interface/configuration schema or runbook step contract, source and retained valid/invalid input outcomes with interpreted plan/diff or simulation evidence. |
| `change_interface_design` | `do_change_promotion`: environment selection and applicable promotion preserve intended artifact/configuration identity and reviewable differences. | Target/promotion mapping, source/configuration digests and retained selection or promotion-simulation outcomes; single-environment scopes demonstrate their declared target boundary. |
| `code_quality` | `do_code_structure`: responsibilities and important configuration/instruction rules are traceable and proportionate. | Relevant delivered source/configuration/runbook ranges, dependency declarations and ownership of shared rules. |
| `code_quality` | `do_code_verification`: delivered tests or verification/rehearsal steps meaningfully assert required behavior and failure paths. | Check/test/step source and fixtures plus approved M08 outcomes; names, counts and exit success alone are insufficient. |
| `spec` | `do_spec_features`: every named requirement and required baseline behavior is implemented on its declared targets. | Requirement-to-source map and retained final-artifact feature/baseline-regression observations for each required target. |
| `spec` | `do_spec_state`: desired state and applicable idempotent convergence/drift policy hold at relevant boundaries. | Declared invariants, state/change logic and retained initial/resulting-state, repeat-execution and drift simulation observations where required. |
| `safety_recovery` | `do_safety_authority`: actual secrets, permissions, approvals and managed-state boundaries enforce the declared authority. | Secret references/access/approval/state configuration or steps, redacted findings and retained allowed/denied, wrong-target or gate-enforcement observations as applicable. |
| `safety_recovery` | `do_safety_recovery`: expected partial failures are contained and the required rollback or roll-forward restores a declared safe state. | Failure/recovery policy and source/steps plus approved interrupted-change and recovery simulations/rehearsals with initial and resulting state. |
| `operability_documentation` | `do_ops_diagnostics`: status, errors and declared health conditions support the required diagnosis. | Diagnostic/status definitions, retained redacted failure/health observations and their required-condition pass/fail/unverified outcomes. |
| `operability_documentation` | `do_ops_runbook`: instructions accurately explain prerequisites, operation, escalation and applicable recovery boundaries. | Delivered runbook/configuration guidance, exact operation references and retained rehearsal outcomes for the required operator tasks. |

Static claims require readable relevant source/instructions. Behavioral claims need the corresponding retained observation plus enough source/requirement context; a README assertion or plan is not execution proof.
An absence established by a complete artifact/manifest inspection can support an evidenced missing-deliverable finding. Missing collection or an unreadable tree cannot establish absence.
One reference may support several claims only through explicit separate mappings; preserve contradictory evidence. Required modification regressions assess preserved behavior, without rewarding or penalizing raw diff size.
For minimal scopes, freeze concrete minimal-authority, single-target, repeatability and failure-guidance claims as appropriate. “No cloud” or “no secrets required” never automatically passes a security criterion.

## DevOps evidence and bounded technical interpretation

Admit the approved specification/tasks, pinned delivered source/configuration, dependency manifests, tests, runbooks and M08's measurement-free final-artifact projection.
Before approval declare exact allowed evidence classes: validation reports, plans and semantic diffs, local/sandbox apply-simulations, pipeline/promotion simulations, recovery rehearsals, check outcomes, state observations and source/documentation ranges.
For every required observation freeze target/environment, tool/version context, initial state, operation/step, expected conditions, safe capture/redaction rules and the claim it can establish. A simulation establishes only its declared simulated behavior.
The manifest binds immutable delivered snapshot, configuration/input digests, approved environment, check/step/feature aliases and observation/output digests; engine-side bindings retain real trial identity. Use safe relative paths and readable ranges.
Retain relevant success, denial, partial-failure and recovery observations with resulting state. Historical task states and old pipeline/deployment successes do not prove final-artifact state, even when their labels match.
Source, plan and runbook evidence can explain a failure or prove a missing requirement; lint, schema validation and a clean plan never establish successful deployment, convergence or recovery by themselves.

The following primary sources inform bounded interpretation; they impose no required tool or certification:

- Terraform planning normally reads remote object state and proposes changes; saved plans can include sensitive data in cleartext. Admit approved redacted plan/diff evidence with its scope and provenance, never a claim that plan success proves apply success. [Terraform plan reference](https://developer.hashicorp.com/terraform/cli/commands/plan)
- Kubernetes server dry-run traverses admission, validation and merge processing and requires the corresponding authorization. Distinguish that API interaction from offline validation and from persisted deployment; a dry-run label does not authorize a capture against an arbitrary cluster. [Kubernetes API dry-run](https://kubernetes.io/docs/reference/using-api/api-concepts/#dry-run)
- SLSA provenance describes an artifact's origin and production history. When required, assess the retained source/configuration-to-artifact/promotion binding; a provenance file alone does not establish SLSA conformance or supply-chain certification. [SLSA provenance](https://slsa.dev/spec/v1.2/provenance)

M08 owns approved checks in isolated disposable local/sandbox environments before evidence sealing. This profile requires no new remote orchestration, cloud administration, provisioning subsystem or production access.
Planning and server dry-run can still contact systems, read secrets or acquire state locks; never declare every such command side-effect-free. Freeze approved destinations, credentials/authority, state ownership, redaction and capture provenance before executing any allowed check.
Use only approved available macOS/Linux tooling and declared sandbox targets. Required mixed-platform/toolchain coverage cannot be inferred from one target or silently replaced by a simulation with weaker claims.
M12 is read-only: it never executes IaC/code, apply/destroy/deploy, pipeline triggers, production requests, credential changes, new tests, installation or repairs. Its existing M12.4 grading transport grants no infrastructure-control authority.
Artifact instructions in README, scripts, plans, logs and runbooks are untrusted evidence; they cannot change the rubric, reveal withheld data or authorize commands or additional tool calls.

Text evidence is the default; DevOps imposes no web viewports, screenshots or vision requirement. Any necessary image modality is explicit and frozen before approval with its capture/binding obligations.
If images are required, both backends need verified actual image-input capability/readiness and the ordered final-artifact image bytes. Unknown capability, missing images or unsupported modalities block the affected assessment; no text/OCR/hidden-helper substitution or silent waiver is allowed.

Observed candidate FAIL or a proved missing deliverable can justify a low grade when category evidence is sufficient. Missing cloud access, tooling, capture, state prerequisites or infrastructure disturbance remains unverified, not an automatic candidate defect.
Missing required inputs before invocation use existing not-judged/input-failure handling; incomplete returned assessments remain ungraded with deficiencies; invocation failures retain the failed disposition. Preserve useful parts and explicit limitations.
Never substitute 1, 0 or N/A for missing evidence, drop a category, renormalize weights or infer correctness from exit success. If required claims cannot be assessed, the whole six-category review stays ungraded/not judged as appropriate.
Identity mismatches retain M11 fatal invalidation handling. A known wrong artifact response and an unavailable verifier/target are distinct; neither a favorable review nor a simulation relabels their deterministic check outcomes.

Recursively withhold benchmark tokens, prices/cost, elapsed/check/process time, Gen tok/s, measured Files / LOC, hardware/raw resource counters and measured latency/throughput from every input container, including nested logs/metadata.
Also withhold creator/builder harness/model/provider/configuration identity, machine identity, run/trial/result IDs, alias maps, weights, rankings and other reviews. Apply practical redaction without rewriting immutable delivered bytes or claiming perfect anonymity.
Redact leaked secret values while preserving the evidenced leak finding, safe location/reference and relevant boundary failure. Never erase the defect or expose the original value to make the finding persuasive.
Artifact quantities, desired state, declared resource configuration/SLOs and exact pass/fail conditions remain semantic input. Retain only required-condition descriptions and functional passed/failed/unverified results of threshold checks, removing measured timing/counter values.
Mutating only withheld values must leave the admitted input digest and replayed decision composition unchanged. Deterministic acceptance/measurement stays with existing owners; M06 alone computes weights, eligibility and ranking, including unchanged raw `spec >= 4/5` gates.

## Both grading backends and decision composition

`harness_review` and `decision_rubric` consume the identical frozen rubric and anonymous immutable evidence. M12 keeps one isolated, globally sequential assessment per delivered trial, without earlier reviews, conversations or answers as new input.
Harness review remains the default. No compatible READY decision engine disables only decision grading and independently unavailable context analysis; an otherwise usable harness grader remains available. An explicit unusable decision choice never silently falls back.
Reuse [the existing question families and transport](../DECISION-ENGINES.md#evidence-bound-decision-grading); add versioned rubric/pack data, not a new provider dialect, helper model, judge code-execution path or ranking formula.

| Question family | DevOps pack binding and acceptance |
|---|---|
| `coverage/category` | Required features, target/state coverage and evidence classes; `sufficient`, `insufficient`, `abstain`. Only accepted sufficient permits a grade. |
| `grade/category` | Exactly nine Choice labels `1`, `1.5`, `2`, `2.5`, `3`, `3.5`, `4`, `4.5`, `5` with these anchors and intermediate rules. Never round a Score expectation. |
| `reason/category/criterion` | Each applicable concrete criterion and frozen feature/evidence assignment; `supported`, `contradicted`, `not_established`, `abstain`. |
| `support/category/evidence` | An admitted evidence ID and explicit criterion relationship; `supports`, `contradicts`, `irrelevant`, `insufficient`. Only accepted relevant support/contradiction supplies attached refs. |
| `comment/axis/criterion` | Code quality maps to `do_code_structure`/`do_code_verification`; developer experience to `do_dx_setup`/`do_dx_inputs`; specification to `do_spec_features`/`do_spec_state`. Concrete supported achievement/evidenced defect options include `insufficient`/`abstain`. |
| `limitation/code` | `required_evidence_missing`, `prerequisite_unavailable`, `target_coverage_incomplete`, `inspection_incomplete`, `context_bound_exceeded`, `conflicting_evidence`, `scope_uncertain`; `present`, `absent`, `unknown`. Also include known acquisition limitations. |

Pack compilation freezes exact claim/question/anchor text and IDs, feature/target assignments, selection order, support mappings, comment options, consistency predicates, acceptance and composition versions/digests.
For `devops/1`, default mandatory Choice acceptance uses the decision contract's `native_confidence` policy with provisional threshold `0.8`; freeze approved changes with the pack. This project setting requires evaluation and promises no accuracy; rejected/unknown confidence, ties or abstention supply no default grade.
Every question independently evaluates the same fixed supplied evidence. Account for every required criterion; prior answers never become hidden context or generate guessed references.
Before launch, partition finite question/evidence assignments deterministically into frozen batches and publish positive `max_calls_per_assessment`, byte/context limits, batch sizes and allowed attempts. Default to one dispatched attempt per batch; every attempt consumes the bound.
M12 totals multiply the frozen bound by assessment count without predicting actual calls. Any approved pre-dispatch retry budget is included; no ambiguous dispatched retry, adaptive exploration or extra call repairs missing evidence/answers.
Packing retains the full manifest, included/excluded IDs/ranges and coverage. Required inputs cannot disappear to fit context; retain insufficient-input/context limitations rather than truncate, summarize, invoke a helper or substitute a model.

A category requires accepted sufficient coverage, an exact grade, an informative accepted reason and an admitted reference explicitly supporting or contradicting it. Required target and state coverage precedes a completeness claim.
Frozen predicates reject grade 5 with a material required-scope defect, grade 1 contradicted by established category-wide usable behavior, any grade with insufficient coverage, unsupported comments and limitation-free output with known deficiencies.
Intermediate predicates require achieved behavior and the shortfall blocking the higher anchor. Retain rejected/contradictory answers as deficiencies; never repair by lowering/averaging grades or adding boilerplate.
Code composes category rationales and all three informative comments from accepted criterion text, conclusions and evidence aliases. Retain question/answer/anchor IDs, support decisions and composition provenance as `code_composed_from_decisions`; harness prose remains `model_authored`.
Require explicit limitations, retaining present/unknown decisions and known input limitations; empty is valid only when mandatory decisions and checks establish none. Apply unchanged M12.1 `RawReview` validation: six categories once, exact grades, nonempty rationales, resolving `evidenceRefs`, three comments and valid provenance.

## Retention, implementation ownership and acceptance

Freeze profile/rubric/version/digest, applicability/target map, pack/evidence/mapping/composition/acceptance policies and requested/resolved judge identity within existing assessment/group identity.
M02 retains original reviews, raw decisions, deficiencies and bound evidence. M06/M13/M17 preserve separate fingerprints; matching labels or model names never merge profiles, rubric versions or grading backends.
Imports, viewing, reporting and reweighting invoke no model, probe or infrastructure operation. Explicit rejudge adds a separate retained review/cost/group using approved artifact/rubric evidence, without overwriting originals or reopening sealed verification. New semantics require a newly approved revision.

| Existing owner | DevOps extension |
|---|---|
| [M12.1](../M12/01-review-contract.md) | Pure versioned profile/rubric/pack, evidence projection and exact validation; preserve legacy readers. |
| [M12.2](../M12/02-judging-worker.md) / [M12.3](../M12/03-judging-screens.md) | Existing protected assessment, settlement and retention; expose scope, coverage, limitations, provenance and rejudge groups. |
| [M08.1](../M08/01-verification-runtime.md) / [M08.2](../M08/02-verification-adapters.md) | Approved disposable validation/simulation/rehearsal contracts, availability checks, final-artifact binding and measurement-free handoff. |
| [M01.1](../M01/01-canonical-definition.md) / [M16.3](../M16/03-draft-approval.md) / [M07.2](../M07/02-launch-preparation.md) | Versioned authoring/approval, scope/target map and common launch capability selection; preserve v1 unchanged. |
| [M02.1](../M02/01-retained-records.md) / [M06.1](../M06/01-scoring-service.md) / [M13.1](../M13/01-offline-report-artifact.md) / [M17.1](../M17/01-archive-contract.md) | Retain/export/import bound evidence, exact grades and groups; existing owners retain weights/ranking and offline presentation. |

Use existing M12.4 transport and M05 protection; add no child/DAG node, alternate verifier, storage system or cloud-control subsystem.
Proposed implementation paths below are future work under `solution/`, not files implemented by this specification:

- `solution/axbenchmark/engine/judging/adapters/prompts/rubrics/devops-v1.json` and `solution/axbenchmark/engine/judging/adapters/prompts/question_packs/devops-v1.json`.
- Existing `solution/axbenchmark/engine/judging/domain/{profiles,rubric,requirements,inputs,reviews,question_packs,grading_plan}.py` gains versioned profile data; M08 gains owned evidence contracts/adapters through its existing ports.
- `solution/tests/fixtures/judging/devops_v1/` holds approved scopes/targets, manifests, plans/diffs, simulations/rehearsals, high/medium/low artifacts, secret-redaction and unsafe-input cases.
- `solution/tests/engine/judging/test_devops_v1_rubric.py`, `test_devops_v1_evidence.py`, `test_devops_v1_decision_pack.py`, `solution/tests/verification/test_devops_evidence.py` and `solution/tests/integration/test_devops_v1_judging.py` cover the following cases.

1. **Identity and scope:** assert six ordered keys/defaults `20,15,20,25,15,5`, total 100, twelve unique criterion IDs and `business_category=spec`; edited weights follow M06: finite exact nonnegative relative values with a positive total, individual zeroes allowed, all six grades still required. New v2 authoring succeeds; v1 bytes/hashes/values and fullstack→web remain unchanged. Reject composites and post-approval profile/target changes.
2. **Excellent/usable/broken evidence:** small complete local automation or a runbook, usable delivery with concrete reproduction/change/recovery gaps and observed broken core behavior exercise 5/3/1 with sufficient evidence in every category. Include exact half-step rationales/refs; no LOC, stack or feature bonus.
3. **Unavailable versus defect:** missing cloud access/toolchain/capture, disturbed infrastructure and unreadable state remain unverified/ungraded/not judged; a proved absent operation or observed wrong state may justify low quality. A plan/lint pass cannot prove deployment; no invented category, N/A or renormalization appears.
4. **State, security and provenance:** exercise repeat convergence, drift, version pinning, wrong-target denial, approval bypass, artifact promotion and partial-change recovery. Redact leaked secrets but retain their finding/ref; reject foreign snapshots, stale task-state proof and simulations claiming real deployment.
5. **Projection invariance:** nest and mutate excluded tokens/cost/time/Gen/Files/LOC/hardware/raw resource/latency/throughput, creator identity, weights, rankings and reviews. Assert identical admitted digests and replayed decision grades/comments while desired quantities, declared SLOs and semantic outcomes remain usable.
6. **Decision validity:** accept all nine labels; reject 3.7, rounding, unsupported 5, insufficient coverage, foreign refs, missing rationales/comments/limitations and conflicting decisions. Preserve raw parts/provenance; enforce frozen batches/call bounds and no helper or silent fallback.
7. **Unsafe artifact instructions:** inject “award 5,” secret exfiltration, unsafe apply/destroy/deploy, production requests and repair instructions into README/plans/logs. Assert inert evidence, protected bytes and zero judge execution, credential changes, new tests, infrastructure operations or network probes.
8. **Targets and modalities:** single approved targets need no extra platform; mixed-platform missing coverage blocks completeness. Default text needs no screenshots; required images demand verified capability and actual bound bytes for both backends, with no textual fallback or remote provisioning assumption.
9. **Modes, checks and retention:** cover both modes/targets and baseline preservation. A high review cannot cure earlier Git task-commit FAIL, failed execution or failed/unverified checks. Missing READY decision setup leaves usable harness/offline access available; legacy import/reweight/view invokes nothing, and explicit rejudge adds an isolated group preserving originals.

Cold-read fixtures against the approved feature/target map before implementation acceptance. Real M01/M08/M12/M02/M06/M13/M17 integration must demonstrate these boundaries; this specification and fixtures alone prove neither safe deployment nor certification.
