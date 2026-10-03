# Selectable decision engines and grading backends

Status: binding implementation extension; proposed behavior, not a claim of implemented integrations. Audience: engineers implementing decision runtime, monitoring, grading and their clients. Implementers must be able to add a configured System One server without duplicating transport, weakening evidence validation or contaminating competitor measurements.

This contract adds child **M12.4 — decision-engines-runtime**, not a new parent module. It supersedes TypeSafe-only observer transport/selection ownership in [context monitoring](CONTEXT-MONITORING.md); all capture, counting, membership, retention and analysis rules there remain binding. It extends [M12](reference/modules/12-quality-judging.md) with a typed decision grading backend while preserving its strict review validity and durable settlement.

## Scope and ownership

Users select decision profiles independently for context classification and grading. The initial runtime has **one `SystemOneAdapter`**, configured for TypeSafe's remote service or a directly addressed compatible local server, initially Ollama. Both use `/v1/systemone`. Shared API shape does not establish equal model capabilities, limits, confidence semantics or artifact identity.

Laya is architectural inspiration for explicit model roles and configurable providers. AxBenchmark does not invoke, install, automate or depend on the Laya application. Local profiles call the model server directly. An OpenAI-compatible chat endpoint or JSON-output feature alone is not System One compatibility; LM Studio and other servers are eligible only if the actual deployed endpoint independently satisfies this contract. No chat/structured-JSON adapter belongs to this initial scope.

| Owner | Binding responsibility |
|---|---|
| Bootstrap | Publish decision IDs, profile/capability/request/receipt protocols, resource-lease and auxiliary-accounting ports, grading selection union and registry placeholders before consumer implementations. |
| M12.4 | Own shared `axbenchmark.engine.decisions`: versioned profiles, capabilities, System One HTTP adapter, bounded work queue, protocol normalization, `DecisionCall` receipts and `decisions.*` APIs. |
| M10.1 | Own context capture, deterministic segmentation/counting and context domain rules; decision models never count tokens or establish membership. |
| M10.2 | Own `ContextClassifier` bridge, label acceptance, context analysis retention and separate observer accounting; consume M12.4 and own no private TypeSafe HTTP client or transport worker. |
| M12.1 | Own pure grading contracts, approved profiles/rubrics, evidence projection, question-pack validation, exact grade normalization and strict `RawReview` validation. |
| M12.2 | Own `GradingEngine`, harness/decision backend bridges, assessment scheduling, separate grading accounting, review persistence and original/additional settlement. |
| M12.3 | Own grading backend/profile presentation, capability reasons, progress and review provenance; M07 retains setup ownership. |
| M04 / M03 | Supply model catalog, pricing and capability metadata / readiness diagnostics through published interfaces; neither owns decision HTTP transport. |
| M07 | Own independent role selection, launch review and frozen configuration; retain harness judging as the existing default. |
| M11 / M02 / M14 | Own cross-run resource admission and jobs / retained evidence and archives / generated and curated CLI surfaces respectively. |

M12.4's completed prerequisites are **Bootstrap, M11.1 and M11.2 only**. M10.2 and M12.2 require M12.4. M12.1 remains pure and independent of the runtime. M04, M03, M10 accounting, M11 scheduler and M02 storage enter runtime development through published ports and fixtures, followed by real integration gates; no hidden prerequisite or import cycle is permitted.

M12.4 owns these exact proposed files under `solution/`:

- `axbenchmark/engine/decisions/domain/{ids,profiles,capabilities,requests,answers,calls,errors}.py` and `__init__.py`.
- `axbenchmark/engine/decisions/ports.py`, `application/{interfaces,profiles,probe,evaluate,queue}.py`.
- `axbenchmark/engine/decisions/adapters/{systemone,profile_store,call_journal,rpc}.py` and additive daemon composition registration.
- `axbenchmark/api/decisions.py`; additive registry entries through M11.1's existing codec/client boundary.
- `tests/engine/decisions/test_{profiles,capabilities,systemone,normalization,queue,receipts,cancellation,resource_lease}.py`, `tests/api/test_decisions.py`, `tests/integration/test_decision_runtime.py`.
- `tests/fixtures/decisions/{typesafe,ollama,profiles,malformed,cancellation}/` with sanitized request/response and runtime-capability fixtures.

M10.2's former `adapters/typesafe_context.py` assignment becomes `adapters/decision_context.py`. M12.1 adds `domain/{grading_plan,question_packs}.py` and frozen rubric question-pack fixtures; M12.2 adds `application/grading_engine.py` and `adapters/decision_grader.py`. Existing owners extend their ports/tests; these assignments do not transfer capture, result serialization, process protection or TUI foundations to M12.4.

## Profiles, capabilities and selection

`DecisionEngineProfile` is reusable application configuration: stable profile ID, immutable version and canonical digest; `protocol: systemone/1`; endpoint; transport dialect (`typesafe` or `ollama`); authentication mode and credential reference; requested model; resolved revision/artifact digest where exposed; runtime/server version, quantization and context configuration; locality evidence; capabilities; limits; residency, scheduling and retry policy. Credentials never enter profile exports, payloads or logs.

`endpoint` means the server base URL, including any deployment prefix, without the terminal `/v1` or `/v1/systemone`. Normalize a trailing slash and join `/v1/systemone` exactly once; reject a supplied evaluation/version URL with a field-specific correction. Presets use `https://api.typesafe.ai` or a configured local server origin. Authentication remains separate from the URL.

Each capability has `supported | unsupported | unknown`, source, version and observation time. Record Choice/Score/Noul support, per-type option bounds, modalities/image formats, payload/context limits, usage semantics and probability/confidence semantics. A familiar model name, URL or successful HTTP response does not establish a capability. M04 metadata and M03 diagnostics retain their provenance instead of silently overriding observed incompatibility.

Locality is `local | remote | unknown` plus declared/verified provenance. Verify deployment configuration and actual tested routing; localhost alone does not prove local inference, exclusive hardware, no proxy or no unrelated server work. Do not promise privacy from a URL. Unverified profiles use the conservative local-resource gate until routing is resolved and show destination uncertainty before submission.

Pin explicit model revisions where available. TypeSafe moving aliases are not valid frozen benchmark selections. For local models retain artifact digest/quantization when exposed; if unavailable, record identity uncertainty and a distinct opaque identity rather than presenting the response model name as a digest. Runtime/model changes create a new profile version and assessment group; historical profiles remain readable.

Ollama model discovery exposes digest and quantization metadata. Freeze and recheck that binding before dispatch; a mismatch blocks the call pending a new profile version. Retain discovery source/time and binding strength: discovery metadata is not an attestation of the exact weights executed by a later request. [Ollama model listing](https://docs.ollama.com/api/tags).

`probe(profile)` defaults to metadata/connectivity/capability inspection without inference. An explicit, bounded inference smoke check has its own purpose, cancellation, resource lease and budget receipt; UI/CLI state that it consumes resources. No probe or selection automatically downloads weights, starts/kills a server, changes GPU settings or falls back to a cloud provider. Local auth defaults to none unless that deployment requires credentials; never forward a TypeSafe key to a local endpoint.

M07 freezes independent `context_monitoring.decision_profile_ref?` and `grading_selection`. The latter is a tagged union: `harness_review {existing judge config}` or `decision_rubric {profile_ref, question_pack_ref, acceptance_policy, evidence_policy}`. Profile refs include version and digest; launch/rejudge snapshots retain resolved capability evidence, model identity and resource policy. Editing a reusable profile creates a new version, never mutates an active run or retained review.

A decision engine must be configured and ready before new context-window analysis or the decision-model grading option can be enabled. Setup exposes `can_enable_context_analysis` and `can_choose_decision_grading` from compatible ready profiles; each operation additionally requires an explicitly selected ready profile for its role. Missing/unready setup returns a typed disabled reason and a Decision engines setup entry, enforced again by API/CLI before dispatch. No engine is implicitly selected or called. Native capture/usage observations, harness-based grading, deterministic combined rankings and read-only saved analyses/reviews remain available.

Keep native capture independently enabled and the observer explicitly disabled when unconfigured. Selecting a grading decision profile does not enable context classification, and disabling classification does not disable grading. Launch review shows role, destination, model identity, image capability, admitted content, budget, confidence policy, deferred/overlap behavior and missing readiness. Competitor readiness remains independent of optional observer availability.

## One System One transport, explicit dialects

`SystemOneAdapter` sends `POST {base_url}/v1/systemone` with `{model, state, questions}` and only profile-supported optional fields. TypeSafe uses its configured bearer credential; direct Ollama commonly requires none. No chat history, tool definitions, generation controls or provider-specific fallback is inserted. Request state is sanitized supplied evidence; instructions carry the actual target/category/evidence IDs because question-map IDs alone do not communicate semantics to the model.

The portable question subset is Choice with named descriptions, Score with ordered level descriptions, and Noul with explicit true/false criteria. Initial rubric/context packs use string instructions/criteria and at most 26 Choice options; narrower per-profile limits still apply. Every question in a batch evaluates the same fixed state independently; an answer is never implicitly input to another question. The code, not provider question order, composes decisions.

Ollama's documented native path requires v0.35.0 or later; Clef/Clef Flash vision requires v0.35.1 or later and vision weights. Choice/Score allow 2–26 options/levels; Score is a probability-weighted zero-based level value. Image inputs are ordered base64 PNG/JPEG/WebP bytes, with no URLs or data URLs. Confidence measures concentration, not correctness. These are retrieved capabilities, not inferred from the shared endpoint. [Ollama decision guide](https://docs.ollama.com/capabilities/decision).

Ollama returns one nonstreaming response, needs compatible local GGUF/scoring runtime, and excludes cloud/MLX/Safetensors models for this endpoint. Requests are capped at 64 KiB without images or 32 MiB including images/base64/JSON; the loaded model context is an additional limit and input is not truncated. Record configured `keep_alive` and resulting residency. Its response `model` echoes the requested name; it does not attest weights. [Ollama API](https://docs.ollama.com/api/systemone).

TypeSafe Choice returns the selected label, distribution and confidence, and accepts up to 255 options. Its model documentation currently describes Jev as text-only; versioned model identity, per-type bounds and context budgets come from the selected profile's verified API/model contract. Text-only Jev cannot satisfy screenshot inspection. [TypeSafe Choice](https://docs.typesafe.ai/primitives/choice), [API](https://docs.typesafe.ai/api), [models](https://docs.typesafe.ai/models).

Endpoint error/status shapes, request limits, optional fields, usage meanings and probability tolerances are dialect data within the same adapter. Fixture tests must cover both paths. A same-path server with an unsupported protocol revision or shape is `capability_mismatch`, not permission to guess another API.

## Typed calls, normalization and confidence

```python
class DecisionEngine(Protocol):
    async def capabilities(self, profile_ref) -> DecisionCapabilities: ...
    async def probe(self, profile_ref, probe_plan) -> DecisionProbe: ...
    async def evaluate(self, request: DecisionRequest, purpose: DecisionPurpose,
                       cancellation: Cancellation) -> DecisionBatch: ...
class GradingEngine(Protocol):
    async def assess(self, immutable_input: AssessmentInput,
                     plan: MachineGradingPlan) -> AssessmentOutcome: ...
    async def prepare_human(self, plan: HumanBatchPlan) -> AwaitingHuman: ...
```

`DecisionRequest` binds scope, fixed state digest, admitted evidence IDs/digests, question IDs/types/instructions/criteria or ordered levels, optional ordered image identities, question-pack/schema digest and exact profile ref. Purpose is `context_classification | grading | connection_test`. Scope identity stays in the engine receipt; provider state receives only the consumer-approved anonymous projection.

`DecisionBatch` retains raw sanitized provider result and discriminated `ChoiceDecision | ScoreDecision | BooleanDecision`, requested/resolved model metadata, normalized answer, optional native distribution/confidence, their semantics/source, usage, validation deficiencies and abstentions. BooleanDecision preserves Noul's true probability; no implicit threshold invents a Boolean judgment. Missing optional confidence is `null`, never zero or a fabricated distribution.

Validate strict JSON, unique/exact expected answer IDs, matching types, finite numeric values, bounds, exact option keys/counts/order where applicable and selected Choice consistency with the maximum. Reject missing/extra/duplicate answers and inconsistent winners. Preserve raw numeric values; never silently normalize distributions or recompute provider confidence using another engine's formula. Ties use the frozen tolerance and become explicit ambiguity for consumers requiring one accepted label.

Distribution sum tolerance is versioned dialect policy: initial project fixture defaults are `1e-6` for TypeSafe and `1e-3` for Ollama. Ollama documents rounded examples, not a universal wire precision guarantee; validate these tolerances against fixtures/runtime evidence and retain them in every call. Tolerance does not authorize clamping, rounding grades or hiding a malformed response.

Initial context classification requires valid native Choice probabilities and confidence plus an explicit `native_confidence` acceptance policy. The provisional threshold is `0.8`, frozen per engine profile/question pack; it is a project setting requiring evaluation, not a provider accuracy guarantee. Low/unknown confidence, ties, malformed answers or abstention produce unclassified with a reason. Different engines' confidence statistics are never pooled as calibrated accuracy.

Decision grading likewise freezes acceptance requirements for every mandatory Choice decision; incomplete/rejected decisions remain deficiencies. The runtime may retain Score/Noul results with absent confidence where their capability permits it, but that does not make them eligible for a mandatory Choice confidence gate. No acceptance-policy fallback silently lowers requirements.

`DecisionCallId` is distinct from M05 `InvocationId`. A receipt binds purpose, run/result/trial or observer scope, assessment/analysis ID, profile/model/schema/input digests, resource-lease provenance, attempt IDs, timestamps, request/response evidence refs, raw usage/cost and terminal state. Never manufacture a harness invocation ID, PID, conversation or process transcript for HTTP inference.

The runtime journals intent before dispatch and terminal/unknown state after response, timeout or cancellation. Only durable receipt acknowledgement completes a call. M10 consumes a typed auxiliary-accounting port keyed by DecisionCallId/observation ID; observer and grading charges stay separate from each other and from competitor measurements. Known local API charge zero is distinct from unknown host energy or operating cost.

The queue has bounded concurrency, outstanding calls, bytes, retries, timeouts and per-purpose/run budgets. Saturation returns durable pending/deferred or a typed exhausted outcome without blocking capture. Never retry an ambiguous dispatched grading call as though it had not run; explicit policy may retry known pre-dispatch failures within budget. Stop closes admission and cancels/drains active transport before terminal acknowledgement.

Cache reuse requires identical purpose, scope, input/evidence/schema/profile/model digests and acceptance policy; retain the original call reference and cache provenance. Default grading cache reuse across artifacts/trials is disabled. No conversation, previous grade or other artifact response may enter a new assessment; byte equality alone without identical scope does not authorize cross-artifact reuse.

## Context monitoring bridge

M10 retains the eleven-label vocabulary, native-label priority, deterministic segments, exact/nonadditive token rules, membership provenance and append-only analysis overlay from the context contract. The bridge builds bounded questions over ambiguous sanitized segments and consumes DecisionEngine results; the shared runtime owns transport and workers. Counts and observed native snapshots remain available while local classification is deferred.

Persist the profile version/digest, question pack, native answer/distribution, acceptance reason and DecisionCall receipt with each analysis. Classification cannot promote an estimate to an exact count, infer hidden instructions/thinking, allocate unexplained token residuals or establish actual window membership. Changing decision engines changes an explicit analysis version, never immutable captured evidence or sealed execution facts.

Existing `typesafe | disabled` saved configurations migrate losslessly to an equivalent versioned TypeSafe profile reference or disabled state, retaining threshold/model/budget/destination/credential reference and original schema provenance. Historical raw responses/analysis remain readable. Migration, import, viewing and changing defaults never trigger historical reclassification; explicit reanalysis creates a separate overlay and auxiliary account.

## Evidence-bound decision grading

`harness_review` remains the existing default: M05 protects the delivered artifact and uses one fresh headless session per artifact, sequentially. `decision_rubric` performs one logical isolated assessment per artifact through a bounded set of stateless System One batches. M12.2 serializes assessments globally for both backends; no prior assessment's state, answers or reviews are reused as model input.

Both backends receive the same M12.1 immutable anonymous assessment projection: approved specification/tasks, frozen rubric, delivered source/artifact and M08 behavioral evidence. Recursively exclude performance/cost/time/tokens/hardware and retained Files/LOC statistic fields, competitor identity and other reviews, including nested metadata. Keep alias-to-result mappings outside requests. Decisions never repair artifacts, run new acceptance checks or turn failed/unverified checks into success.

Launch totals distinguish logical assessments, harness sessions and a decision-call upper bound through M12 `AssessmentTotals`. Every decision plan freezes a positive `max_calls_per_assessment`; the total bound is its product with the expected assessment count, never a prediction of actual calls.

M12.1 owns a versioned `DecisionRubricPack` for each approved versioned six-category profile. It contains explicit rubric anchors, stable criterion/reason texts, evidence-selection rules, required input types, comment axes, limitation codes, question templates, batching/context limits and deterministic composition rules. Freeze pack version/digest with the rubric, evidence policy and grade mapping. The pack must reference and preserve the approved template rubric; changing benchmark requirements or rubric semantics requires the existing template-revision process. Question format, evidence composition and mapping versions also distinguish judge groups. A new engine never receives different weights, scope or rubric for one competitor.

The initial grade question is Choice with exactly nine grade labels `1`, `1.5`, `2`, `2.5`, `3`, `3.5`, `4`, `4.5`, `5` and rubric-specific descriptions. A separate sufficiency/abstention question prevents forcing missing evidence into grade 1. Parse accepted labels with the existing exact Fraction-based Grade rules; never round a Score expectation to a half-point raw grade. Score remains diagnostic unless a future explicitly versioned ordered-level/argmax mapping passes the same exact-grade validation.

The following core pack structure makes typed decisions sufficient to form a review without pretending the model generates prose:

| Required question family | State, options and deterministic use |
|---|---|
| `coverage/category` | Category scope, required evidence types and manifest coverage; Choice `sufficient`, `insufficient`, `abstain`. Only accepted sufficient permits that category's grade. |
| `grade/category` | Supplied category evidence plus frozen rubric anchors; the nine explicit grade labels. Grade question instructions identify the category and exact evidence subset. |
| `reason/category/criterion` | A finite rubric-specific claim and assigned evidence; Choice `supported`, `contradicted`, `not_established`, `abstain`. Retain selected claim/status as the rationale basis. |
| `support/category/evidence` | An admitted evidence ID and the explicit category/claim; Choice `supports`, `contradicts`, `irrelevant`, `insufficient`. Only accepted relevant answers may attach that evidence to the claim. |
| `comment/axis/criterion` | For each of code quality, usability/developer experience, specification: frozen concrete criterion, evidence assignment and Choice conclusion/reason options including insufficient/abstain. At least one supported informative conclusion is required per axis. |
| `limitation/code` | Enumerated evidence/inspection limitation and source facts; Choice `present`, `absent`, `unknown`. Preserve present and unknown limitations; code also includes known acquisition/coverage limitations. |

All question families carry target and criterion semantics in instructions/state, not only keys. Separate support questions run against the same fixed evidence, never a guessed reference or hidden conversation. A category needs an accepted grade, sufficient coverage, at least one accepted informative reason and an admitted reference explicitly supporting or contradicting that reason. Detect contradictory grade/reason/coverage combinations through frozen pack validation; return a deficiency rather than silently repairing the result.

**Prose policy extension:** code may compose category rationales and the three required comments from accepted criterion texts, selected answers and evidence aliases. Label each as `code_composed_from_decisions`, retain answer/question/anchor IDs, and distinguish these summaries from `model_authored` harness commentary. For example, an accepted concrete keyboard-access claim can produce a labelled statement citing its supplied keyboard observation. Generic anchor repetition alone is insufficient rationale; missing answers, references or comments cannot be filled with boilerplate.

Produce an explicit limitations list, including uncertainty/coverage statements and an empty list only when all mandatory limitation questions and known input checks establish none. Run the resulting `RawReview` through unchanged M12.1 category, grade-grid, rationale, reference, three-comment and limitations validation. Preserve all raw answers and deficiencies when the result is ungraded; runtime/provider errors never become competitor failure or fallback grades.

Evidence packing is deterministic and bounded per category: retain full manifest, included/excluded IDs/ranges, coverage and rule version. Required input cannot disappear to meet a context limit. If the complete required scope cannot fit under the frozen batching policy, report insufficient input/context limit and leave affected review ungraded or not judged. No silent truncation, OCR, generated summary, model substitution or hidden compression model is allowed.

Web/fullstack grading requires verified vision support and actual delivery of M08 final-regression images for the delivered artifact at both 1440×1000 and 390×844 viewports for each included capture. Bind ordered image positions to admitted evidence IDs/digests. Never substitute per-task screenshots or textual image descriptions. Text-only Jev is blocked for these profiles; it may grade backend artifacts only when every backend requirement and evidence bound is satisfied.

`JudgeGroup` includes backend kind, decision profile/version/digest, requested/resolved model identity, runtime/quantization where relevant, rubric/pack/mapping/evidence-policy digests and acceptance policy. Harness and decision groups never merge merely because labels, model names or templates match. M06 reweights retained raw grades without inference; M13/M17 preserve group identity and commentary provenance offline.

## Local resource admission and fairness

The concrete injected lease methods and receipt schema are owned by [M11 cross-run decision admission](reference/modules/11-run-orchestration.md#cross-run-decision-admission); M12.4 declares the port and M11 implements it. All mutating calls use stable scoped IDs and idempotent retries.

Default local decision execution is **deferred until no managed competitor measured window is active across any run**. M11 supplies `DecisionResourceLease`: acquisition atomically excludes new competitor measurement admission, covers warmup/model load and inference, and releases only after transport/resource settlement. M10 capture remains durable/nonblocking while waiting; neither the TUI nor a timer observing an idle screen owns this gate.

M11's scheduler and runtime use one admission handshake, bounded wait, cancellation and fair ordering. Do not acquire a local inference lease while holding a run lock needed to end a measured window. Original grading occurs after its execution seal, but still waits for competitors in other runs. Cancellation can remove queued work immediately; it cannot claim a clean resource release while a server may still be computing.

Transport cancellation does not prove remote/local server inference stopped. If bounded drain cannot establish termination, durably settle the call/lease as `server_state_unknown` and return a typed cleanup limitation. Default new clean measurement admission remains deferred until independent readiness evidence resolves activity; an already selected `live_local_overlap` policy may admit explicitly contaminated measurements. Neither path holds a worker/run lock indefinitely or reports a clean release. Server process ownership remains external; do not kill it. Restart reconciles leases/calls before permitting clean measurement admission.

An explicit opt-in `live_local_overlap` policy permits concurrent local analysis; freeze it in launch config and expose it in comparison filters/reports. Record actual lease/measurement intervals, host/runtime/model/quantization/residency, unknown ownership and known concurrent work. Remote classification may run live within its bounds, while its local transport/capture overhead remains disclosed. Unknown routing receives conservative scheduling.

Do not subtract a guessed observer share from whole-host energy or claim local decisions are free benchmark competitors. Capture I/O, warm residency, GPU contention and unrelated server work may affect measurements even outside an inference call. Report known overlap and unknown attribution separately; M18 retains its actual measurement scope. No automatic GPU reconfiguration or performance correction belongs here.

## Durable grading, cancellation and recovery

Original grading starts only after M11's evidence/accounting finalization and execution seal. Decision calls, usage and review evidence append through review/analysis paths; no backend appends execution facts after seal. Every expected ResultId/TrialRef receives one durable original disposition before `finish_run_retention`, terminal publication and completion reports, including missing input, unusable engine and cancellation.

M12.2 persists stable review/assessment IDs and DecisionCall intents, validates identity before and after assessment, awaits auxiliary accounting, prepares immutable review bytes, and calls M02's idempotent atomic review append. Lost storage acknowledgement replays identical prepared bytes/digests, never inference. Cancellation versus preparation/commit uses the existing lifecycle gate; committed outcomes survive and pending storage prevents a false settled claim.

Harness cancellation retains M05 process-tree drain/protection semantics. Decision cancellation uses runtime transport drain/receipts/resource lease; no fake process cleanup is invented. Both unwind into the same M12 durable disposition/settlement rules. IdentityMismatch reaches M11 invalidation before worker unwind and is never converted into ordinary ungraded/provider failure.

Recovery **never invokes a grading model**, for either backend. Replay only complete immutable prepared writes and committed outcomes; unfinished assessments settle NOT_JUDGED(engine_lost/stopped/identity_invalidated as applicable). A configurable context-observer resume policy cannot resume grading. Rejudge is explicit additional work, independently cancellable, with a new frozen selection/group and separate account; it cannot reopen original retention.

## API, UI, CLI and portability

Registry methods are `decisions.profiles.list`, `decisions.profiles.get`, `decisions.profiles.save` (new immutable version), `decisions.profiles.test` (probe mode explicit), `decisions.capabilities`, and `decisions.calls.get`. Save/test use M11's typed authorization/job/error conventions; inference tests return cancellable jobs. Profile reads/listing do not contact a model. M14 generates registry coverage and curated `decisions profiles list/save/test` commands with version/digest output and role-independent selection.

M07 setup presents separate monitor and grader choices, profile editing/testing, destination/auth state, capability reasons and local scheduling policy. M12.3 progress shows backend, profile and logical assessment/call state; HTTP calls do not display fake PID/session activity. Review screens show raw typed answers, code-composed commentary, evidence coverage, unknown confidence/cost and complete failure/ungraded/not-judged reasons. Existing saved harness configurations deserialize to `harness_review` without changing behavior.

M02 retention and M17 archive formats add versioned profile snapshots, capability evidence, DecisionCall/raw-answer refs, pack/composition provenance and group identity, excluding credentials. M13 reports and M14 queries read these offline. Imported unknown future protocol/profile versions remain inspectable with explicit unsupported re-execution; no import/view triggers inference, profile overwrite or historical migration of raw evidence.

## Acceptance gates and source boundaries

1. Fixture-test both System One dialects through one adapter: native Choice/Score/Noul, exact IDs/types, model-name echo versus revision, image order/limits, usage/errors, malformed distributions, nullable capability fields and recorded tolerances. No synthetic probabilities or confidence formula substitution.
2. Switch independent monitor/grader profiles and migrate legacy TypeSafe/harness settings; immutable versions, frozen groups and credential destinations survive reload/export/import. Metadata tests make zero inference calls; explicit smoke tests are bounded and accounted.
3. Re-run context nonadditive counting, membership, durable capture/closure and unknown-count fixtures unchanged; a deferred, failed or low-confidence classifier changes only its analysis overlay.
4. Verify every allowed half-point, all six categories, required evidence/rationales, three substantive comment axes, limitation completeness, missing/oversize evidence and provenance. Reject expected-score rounding, boilerplate completion, foreign references and text-only web grading.
5. Run two configurations × three trials through sequential isolated assessment plans; inspect anonymous payloads recursively for performance/history leakage, final screenshot identity, deterministic evidence coverage and distinct harness/decision groups. Reweight with zero calls.
6. Race local warmup/inference against competitor starts across runs; verify atomic leases, deferred capture, bounded cancellation, fairness, unknown server settlement and explicit overlap filtering without deadlock or false clean energy attribution.
7. Inject transport timeout, cancellation, crash before/after prepared review, accounting delay and M02 lost acknowledgement. Original settlement remains complete/idempotent, recovery makes zero grading calls, identity invalidation persists and sealed facts never change.
8. Exercise real M03/M04/M07/M10/M11/M12/M02 integrations through published ports, M14 registry/CLI parity, M13 offline reporting and M17 archive round trips with network disabled. Fixtures prove contracts, not hardware/model compatibility; record a deployment's actual compatibility evidence before enabling its capabilities.

Primary-source facts above were checked on **2026-10-02**: [Laya documentation](https://laya.aay.sh/docs.html), [TypeSafe API](https://docs.typesafe.ai/api), [Ollama API](https://docs.ollama.com/api/systemone). The package boundaries, immutable profiles, acceptance thresholds/tolerances, evidence composition and resource policies are AxBenchmark design decisions. Source retrieval establishes documented behavior, not a completed local inference test or a promise of assessment accuracy.

Domain packs follow the [versioned quality registry](reference/modules/12-quality-judging.md#quality-profiles) and its five new domain contracts. Web capture requirements stay unchanged, native mobile uses its frozen matrix, and text-domain evidence has no invented image prerequisite. Resolve the exact approved rubric/evidence plan and required modalities; adding a domain never adds a new grading transport or enables decision grading without a compatible READY profile. Product-agent inference belongs to separate M08 verification, not this runtime's DecisionRequest purposes.

[Human review](M12/05-human-review-web.md) is a third M12 grading backend that bypasses this model transport, DecisionRequest purposes and resource leases. It requires no decision-engine configuration and uses explicit `human_authored` form submissions with the shared validator; it is not a fallback for failed/unready decision grading. `GradingEngine.assess(AssessmentInput, MachineGradingPlan)` remains the automated interface; `prepare_human(HumanBatchPlan)` returns durable pending case references promptly. Existing purpose-scoped model accounting and both automated strategies remain unchanged.
