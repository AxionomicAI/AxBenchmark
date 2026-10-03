# Mobile quality judge contract

Status: proposed implementation contract for internal engineers; this document implements no judge, native runner, fixture or device capability.
An engineer should be able to encode the mobile rubric, prepare either grading backend's inputs, and reject unsupported assessments without inventing grades.
Authority: [M12](../reference/modules/12-quality-judging.md), [M12.1](../M12/01-review-contract.md), [decision grading](../DECISION-ENGINES.md#evidence-bound-decision-grading), and [measurement exclusion](../BENCHMARK-STATISTICS.md#eligibility-compatibility-and-exact-ordering).

## Profile identity and approved scope

- `project_type = mobile`; `profile_id = mobile`; `rubric_version = mobile/1`; `business_category = spec`.
- Add mobile to new-authoring v2 domain/profile validation. Preserve v1 accepted values, schema bytes, hashes, reviews and interpretation; importing an old web/backend record never reclassifies it as mobile.
- Native and cross-platform Android/iOS applications with a primary mobile UI use this profile. Fullstack retains the web profile; a native client needs an explicitly mobile-scoped approved revision rather than an inferred profile switch.
- A headless SDK, library or service cannot satisfy this UI profile. It needs a separate appropriate approved profile/scope; removing visual or accessibility obligations after launch is prohibited.
- Preserve the six ordered categories below. Positive default weights sum to 100 and remain editable through M06; weights and anchors are AxBenchmark project choices, not an industry standard or platform certification.
- M01/M16 freeze rubric bytes, required features, applicability and evidence obligations before approval; M07 uses the same approved selection and native matrix for every competitor. Rejudge cannot change approved scope or silently upgrade rubric semantics.

Apply the same contract to `one_shot` and `multi_step`, with `from_scratch` and `modify` targets. Grade delivered behavior and required baseline preservation; neither mode receives a bonus.
The [mandatory task-commit contract](../BENCHMARK-MODES.md#mandatory-task-commits) is unchanged. A favorable grade cannot cure process failure, a failed/unverified required check, or an earlier task-commit FAIL.
No preferred language, framework, native-versus-cross-platform architecture, commercial component or dependency count is required. More LOC, premium tooling, extra screens and unrequested features earn no quality credit.

Before approval, derive a finite feature map: requirement/feature ID, required platform targets, criterion IDs, expected observations, evidence classes/selectors and M08 check IDs.
Mark conditional branches with a requirement reference and in-scope/out-of-scope reason: deep links, authentication, sensitive storage, permissions, notifications, background work, offline sync and external services apply where approved.
Out-of-scope branches remove no category, introduce no N/A grade and redistribute no weight. Freeze a narrower assessable claim; unresolved scope that prevents assessment blocks approval or grading as appropriate.
All mobile UI scopes require meaningful navigation, visual adaptation, accessibility and applicable security assessment. A scope without permissions still needs evidence that it requests no unnecessary access and handles its actual data safely.

## Ordered categories and observable anchors

Every raw grade is exactly `1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5`, parsed by M12's Fraction validator without rounding.
Universal anchors remain **1: missing or largely broken; 3: usable with material gaps; 5: excellent for the defined scope**.

| Order / key | Label / default weight | Observable scope | 1 | 3 | 5 |
|---|---|---|---|---|---|
| 1 / `ux_platform` | UX/platform interaction / 25% | Task flows, navigation/back, input, feedback and platform conventions | Observed core tasks are blocked or largely unusable through broken navigation, controls or feedback. | Main tasks are usable, with material friction in navigation, input, state feedback or required platform interactions. | Required flows are clear and coherent; navigation/back, inputs and applicable deep links follow the approved platform behavior with actionable feedback. |
| 2 / `visual_adaptation` | Visual/adaptive UI / 15% | Hierarchy, legibility, layout, native insets and required display variations | Captures show essential content or controls unreadable, clipped or obscured across core required states. | Main screens are readable, but required sizes, orientation, font scale, locale or state layouts have material inconsistencies. | Every required state and matrix cell has coherent hierarchy, readable content and usable layout, including approved font/locale changes and system/keyboard insets. |
| 3 / `code_quality` | Code quality / 20% | Responsibility boundaries, state ownership, maintainability and meaningful tests | Retained source/test evidence makes core rules or state changes opaque or materially unsafe to modify. | Main implementation is understandable, with material coupling, duplicated rules or missing meaningful behavioral tests. | Responsibilities and state ownership are traceable, complexity fits the scope, and focused delivered tests demonstrate important behaviors and failure paths. |
| 4 / `spec` | Business rules/specification / 25% | Named features, domain rules, transitions and baseline preservation | Required core features or business invariants are absent or demonstrably largely broken. | Main features work, but required rules, boundaries or preserved baseline behaviors have material gaps. | Every named required feature, invariant and preserved behavior is supported by source and executed observations, including relevant boundaries. |
| 5 / `lifecycle_reliability` | Lifecycle/reliability and security / 10% | Interruptions, restart/state, failures/offline sync, permissions, privacy and local-data boundaries | Observed ordinary failures lose required data or make core workflows unrecoverable, or required permission/data protections are materially broken. | Main use and protections work, but interruption/restart, offline/retry recovery or required privacy/access boundaries have material gaps. | Required interruption/restart, failure and applicable sync cases preserve invariants and recover coherently; permissions and sensitive-data boundaries hold under grant, denial and failure. |
| 6 / `accessibility` | Accessibility / 5% | Semantics, screen readers, focus/touch controls and approved alternate input | Observations establish that required core controls or content are largely inaccessible through approved assistive/input paths. | Main tasks are accessible, but meaningful semantics, focus order, controls, enlarged text or alternate-input paths have material gaps. | Required tasks remain understandable and operable through approved screen-reader, focus/touch and alternate-input paths across required accessibility settings. |

Use 2 for substantial working portions below usable-with-material-gaps; use 4 for a sound usable category with specific remaining shortcomings below excellent-for-scope.
Use half steps only when evidence places behavior between the adjacent integer anchors. Cite both achieved behavior and the shortfall preventing the higher anchor.
Never average criterion statuses, translate pass counts into grades, round a Score expectation, or infer excellence from one attractive screen or a happy path.
Account for every admitted material contradiction. Successful lifecycle recovery cannot hide security failures within the fifth category; applicable business access rules also remain requirements of `spec`.

## Frozen criterion and evidence map

These twelve criterion IDs are stable within `mobile/1`. Instantiate affirmative claims with approved feature/state/target IDs; retain supported, contradicted, not-established or abstained status.
Freeze selection rules and required branches before approval; resolve actual source ranges and artifact aliases deterministically into the assessment manifest without imposing a competitor file layout.

| Category | Criterion ID and affirmative claim | Required evidence gate |
|---|---|---|
| `ux_platform` | `mo_ux_flows`: required tasks are discoverable and complete through coherent controls, input and feedback. | Required flow map, UI/state source, final native images and executed task/input outcomes including loading, empty and error states. |
| `ux_platform` | `mo_ux_navigation`: required navigation/back and applicable deep links preserve the intended destination and user context. | Navigation/entrypoint code, platform expectations and executed forward/back/dismiss/link outcomes with before/after state. |
| `visual_adaptation` | `mo_visual_hierarchy`: required screens/states consistently communicate hierarchy and readable actionable content. | Real final-artifact native images for declared capture states, UI/assets source and explicit state aliases. |
| `visual_adaptation` | `mo_visual_matrix`: approved device, orientation, scale, font and locale variations keep required content and controls usable. | Images and layout observations covering every required matrix cell, including declared system/keyboard insets and large-text states. |
| `code_quality` | `mo_code_structure`: UI, domain and platform responsibilities and important state ownership are traceable and proportionate. | Relevant delivered source ranges, dependency/configuration manifests and build/setup documentation. |
| `code_quality` | `mo_code_tests`: delivered tests meaningfully assert required behavior and relevant failure paths. | Test source/fixtures and retained M08 execution outcomes; names, counts and exit success alone are insufficient. |
| `spec` | `mo_spec_features`: every named feature and required baseline behavior is implemented on its declared targets. | Requirement-to-source mapping and executed feature/baseline-regression evidence for required target coverage. |
| `spec` | `mo_spec_invariants`: required rules, validation, transitions and persistence invariants hold at relevant boundaries. | Domain/storage code and executed valid/invalid transition, boundary and persisted-state observations. |
| `lifecycle_reliability` | `mo_life_state`: required interruption/restart and offline/error/retry/sync cases preserve declared state and recover without duplicate or corrupt effects. | Lifecycle/state/failure/sync code and executed interruption/restart/reconnection traces with initial/resulting state, restart mechanism and controlled dependency conditions. |
| `lifecycle_reliability` | `mo_security_boundaries`: declared permissions, privacy and local-data protections preserve required access and data boundaries. | Manifest/entitlements/storage/network/access-control source and executed relevant grant/denial/revocation, unauthorised access or sensitive-data observations. |
| `accessibility` | `mo_access_semantics`: required controls/content expose accurate labels, roles, values, states and actions to approved assistive technologies. | Accessibility/semantic tree, relevant UI source and executed screen-reader outcomes, including state changes and errors. |
| `accessibility` | `mo_access_interaction`: required tasks remain operable through approved touch/focus and alternate-input paths across required accessibility settings. | UI automation and executed focus, target-activation and alternate-input outcomes; real images for contrast, focus and enlarged-text context. |

Static claims require readable relevant source. Behavioral claims require executed observations plus enough source/requirement context; screenshots cannot prove lifecycle, permission, data-protection or screen-reader behavior.
An absence proved by a complete source/manifest inspection may support a missing-deliverable finding. Missing collection, an unreadable tree or a README claim cannot establish observed absence or execution.
For an app with no permission/sensitive-data branch, freeze a concrete minimal-access/storage claim and inspect its actual manifest, local state and executed workflow; never mark the security criterion automatically passed.
One reference may support multiple claims only through explicit separate mappings. Retain contradictory observations and required modification regressions; raw diff size has no grading meaning.

## Native evidence, matrix and platform interpretation

M01/M16 freeze the required native matrix before approval; M07 validates and pins it before launch. Declare platform, OS/API version, device class, real-device/emulator/simulator kind, orientation, native pixel dimensions, display density/scale, font setting, locale and required capture states.
Record logical dimensions and native pixel conversion/context where needed. The web `1440×1000`/`390×844` pair is not imposed on mobile; native matrix requirements replace that web-only obligation for `mobile/1`.
Require only approved targets: Android-only does not imply iOS coverage. A cross-platform app must cover every declared required platform/matrix cell; one successful Android capture cannot prove an iOS claim.
Do not silently widen the matrix to every device, nor shrink it after a competitor failure. Unsupported requirements must be resolved before approval; a later lost prerequisite remains unverified/missing evidence.

M08 captures approved behavioral cases and native screenshots against the final delivered artifact on isolated approved test devices or simulators, before execution evidence is sealed and M12 starts.
The retained manifest binds immutable source snapshot, build/package digest, target/configuration, matrix cell, check/step/state and observation/image digest. Retain build-to-source provenance; debug/alternate builds cannot substitute without the frozen build policy explicitly authorizing that artifact.
M12 admits final-regression images only. Per-task, historical, marketing, preview/mockup, wrong-build and wrong-target images remain excluded even when visually similar.
Actual image bytes and their ordered evidence aliases must reach either selected grader. Verified `image_input` and readiness are mandatory for both `harness_review` and `decision_rubric`; names or catalog guesses are not capability evidence.
No text-only fallback, OCR, image description, hidden helper model or silent waiver can replace mandatory images. Unknown/unsupported vision blocks the selected assessment with its reason.
Semantic trees, control labels/roles/states, focus order, input actions and executed screen-reader outcomes complement pixels. Capture initial conditions, steps, expected/observed state and check status without benchmark measurements.
Lifecycle evidence distinguishes background/resume, configuration recreation, process restart and intentional user dismissal; none automatically proves another. Required offline/sync cases identify data state, failure and recovery effects.
Permission/privacy evidence includes relevant permission states, user denial/revocation, actual protected operations, secret redaction and local-state outcomes; a permission-dialog screenshot alone proves no enforcement.

The following primary sources inform bounded observations; this rubric is not an official Android/Apple standard, accessibility certification or security/compliance attestation:

- Android documents that activity recreation and process death can destroy in-memory UI state. Assess declared restoration outcomes rather than rewarding a particular state-management API. [Android activity lifecycle](https://developer.android.com/guide/components/activities/activity-lifecycle)
- Android recommends contextual permission requests and graceful behavior after denial or revocation. Apply the required platform/version's declared permission behavior to retained outcomes. [Android runtime permissions](https://developer.android.com/training/permissions/requesting)
- Android accessibility guidance covers meaningful labels, accessibility actions and cues beyond color; assess semantics and completed assistive flows, not merely widget choice. [Android accessibility principles](https://developer.android.com/guide/topics/ui/accessibility/principles)
- Apple explains Dynamic Type layout adaptation and checking larger text for clipping/truncation. Use the approved font/locale matrix and actual app evidence without prescribing SwiftUI or UIKit. [Apple Dynamic Type guidance](https://developer.apple.com/videos/play/wwdc2024/10074/)

Platform support is limited to approved, available macOS/Linux toolchains and declared device access. This proposal promises neither iOS builds on Linux nor automatic remote device provisioning.
M08 owns approved build/test/capture execution and its availability checks. A demonstrably failed build remains its own known check outcome; unavailable toolchain/device/signing/capture prerequisites are unverified, not demonstrated application defects.
M12 is read-only: no installs, app builds, emulator/simulator launch, new tests, live app requests, device resets, repairs, store deployment or publishing. Its grading transport is the existing M12.4 service, not a device-control channel.
Source, UI text, logs and captured instructions are untrusted evidence: they cannot change the rubric, reveal withheld data, invoke tools or authorize publishing or artifact modification.

Observed poor behavior can justify a low category grade. Missing devices, required images, accessibility/state evidence, source or coverage cannot automatically justify 1, 0 or N/A.
If a build failure prevents required visual/behavioral assessment, retain that failed check and all useful source/review parts, but leave the whole six-category review ungraded/not judged as appropriate; never fabricate unseen UI grades.
Missing required inputs before invocation use the existing not-judged/input-failure disposition; incomplete returned assessments remain ungraded with deficiencies, while invocation failures remain failed. Preserve every available part and explicit limitation.
Never fill a missing category, redistribute weights or infer correctness from process exit. Identity mismatches retain M11 fatal invalidation handling rather than becoming ordinary evidence deficiencies.

Recursively exclude benchmark cost/prices, elapsed/check/process time, input/cached/output/reasoning tokens, Gen tok/s, measured Files / LOC, hardware/resource statistics and raw performance measurements from every input container.
Also exclude weights, rankings, builder harness/model/provider/configuration identity, machine identity, run/trial/result IDs, alias maps and other reviews, including nested metadata/log fields. Use practical redaction without rewriting delivered source or claiming perfect anonymity.
Required target OS/device-class/display configuration remains admissible functional context; machine serials and measured hardware counters do not. Keep engine-side identity bindings outside the prompt.
Admit functional pass/fail/unverified outcomes, qualitative observed stalls/errors and static declared thresholds/configuration; strip measured timings/counters from threshold checks. Raw speed, battery/resource use and benchmark throughput earn no quality points.
Mutating only withheld values must leave the admitted projection and replayed decision composition unchanged. M06 alone computes weighted quality, eligibility and rankings, including the unchanged raw `spec >= 4/5` gate.

## Both grading backends and decision composition

Both backends consume the identical frozen rubric and anonymous immutable assessment snapshot. M12 keeps one isolated, globally sequential assessment per delivered trial, with no earlier assessment, conversation or review as input.
Harness review remains the default. No compatible READY decision engine disables only decision grading and independently unavailable context analysis; an otherwise usable harness grader remains available. An explicit unusable decision choice has no silent fallback.
Reuse the [existing decision pack and transport](../DECISION-ENGINES.md#evidence-bound-decision-grading); add rubric data and native evidence requirements, not a new engine/provider dialect.

| Question family | Mobile pack binding and acceptance |
|---|---|
| `coverage/category` | Named required features, targets/matrix cells and evidence classes; `sufficient`, `insufficient`, `abstain`. Only accepted sufficient permits a grade. |
| `grade/category` | Exactly nine Choice labels `1`, `1.5`, `2`, `2.5`, `3`, `3.5`, `4`, `4.5`, `5` with these anchors/intermediate rules. No rounded Score expectation. |
| `reason/category/criterion` | Each concrete criterion above, instantiated for approved scope and evidence; `supported`, `contradicted`, `not_established`, `abstain`. |
| `support/category/evidence` | An admitted evidence ID and explicit criterion relationship; `supports`, `contradicts`, `irrelevant`, `insufficient`. Only accepted relevant support/contradiction supplies attached refs. |
| `comment/axis/criterion` | Code quality maps to `mo_code_structure`/`mo_code_tests`; usability to `mo_ux_flows`/`mo_ux_navigation`; specification to `mo_spec_features`/`mo_spec_invariants`. Concrete supported achievements/evidenced defects plus `insufficient`/`abstain`. |
| `limitation/code` | `required_evidence_missing`, `prerequisite_unavailable`, `matrix_incomplete`, `inspection_incomplete`, `context_bound_exceeded`, `conflicting_evidence`, `scope_uncertain`; `present`, `absent`, `unknown`. Include known acquisition limitations independently. |

Pack compilation freezes claim/question/anchor IDs, exact text, feature/target assignments, selection order, support relationships, comment options, consistency predicates, acceptance policy and composition version/digests.
For `mobile/1`, default mandatory Choice acceptance uses the decision contract's `native_confidence` policy with provisional threshold `0.8`; freeze any approved policy change with the pack. This is a project setting requiring evaluation, not a provider accuracy guarantee. Rejected/unknown confidence, ties or abstention supply no default grade.
All questions evaluate the same fixed supplied evidence independently; prior answers never become hidden model input. Every required criterion is accounted for, even when one accepted informative reason is sufficient to compose a rationale.
Before launch, deterministically partition finite question/evidence assignments into frozen batches and publish positive `max_calls_per_assessment`, byte/context limits, batch sizes and allowed attempts. Default to one dispatched attempt per batch; every attempt consumes the bound. M12 totals multiply this bound by assessment count, without predicting actual calls.
Any approved pre-dispatch retry budget is explicit and included in that bound. No ambiguous dispatched retry, adaptive exploration or extra call may repair insufficient evidence or answers; the decision contract governs transport settlement.
Packing retains full manifest, included/excluded IDs/ranges and coverage. Required images/source/observations cannot disappear to fit context; report insufficient input/context limits rather than truncate, summarize, OCR or invoke a compression helper.

A category needs accepted sufficient coverage, exact grade, an informative accepted reason and an admitted reference explicitly supporting or contradicting it. All required target coverage must be established before a completeness claim.
Frozen predicates reject grade 5 with a material required-scope defect, grade 1 contradicted by its established category-wide usable behavior, any grade with insufficient coverage, unsupported comments, and limitation-free output with known missing evidence.
Intermediate predicates require achieved behavior and the shortfall blocking the higher anchor. Preserve rejected/contradictory answers as deficiencies; never repair by lowering/averaging grades or supplying boilerplate.
Code composes rationales and all three informative comments from accepted criterion text, conclusions and evidence aliases. Retain question/answer/anchor IDs, support decisions and composition provenance as `code_composed_from_decisions`; harness prose remains `model_authored`.
Require explicit limitations; empty is valid only when mandatory limitation decisions and input checks establish none. Apply unchanged M12.1 `RawReview` validation: six categories once, exact grades, nonempty rationale, resolving `evidenceRefs`, three comments and valid provenance.

## Retention, implementation ownership and acceptance

Freeze profile/rubric/version/digest, approved matrix and applicability, pack/evidence/mapping/composition/acceptance policies and requested/resolved judge identity in existing assessment/group identity.
M02 retains original reviews, raw decisions, deficiencies and binding evidence. M06/M13/M17 preserve separate fingerprints; a shared category label or model name cannot merge mobile with web/backend or another mobile rubric.
Import, viewing, reporting and reweighting make no model/probe/device calls. Explicit rejudge adds a separate retained review/cost/group against approved artifact/rubric evidence; it never overwrites originals or reopens sealed verification. New semantics require a new approved revision.

| Existing owner | Mobile extension |
|---|---|
| [M12.1](../M12/01-review-contract.md) | Pure mobile profile/rubric/pack, native evidence requirements, projection and exact validation; preserve legacy readers. |
| [M12.2](../M12/02-judging-worker.md) / [M12.3](../M12/03-judging-screens.md) | Existing protected harness/decision assessment, settlement, provenance and retained deficiencies; expose matrix coverage and explicit rejudge groups. |
| [M08.1](../M08/01-verification-runtime.md) / [M08.2](../M08/02-verification-adapters.md) | Frozen native observation/capture contracts, approved device/toolchain availability, immutable build binding and measurement-free final-artifact handoff. |
| [M01.1](../M01/01-canonical-definition.md) / [M16.3](../M16/03-draft-approval.md) / [M07.2](../M07/02-launch-preparation.md) | Versioned mobile authoring/approval, required matrix and feature map, common launch selection and capabilities; legacy v1 remains unchanged. |
| [M02.1](../M02/01-retained-records.md) / [M06.1](../M06/01-scoring-service.md) / [M13.1](../M13/01-offline-report-artifact.md) / [M17.1](../M17/01-archive-contract.md) | Retain/export/import native evidence, exact grades and group identities; weights/rankings and offline presentation stay with existing owners. |

Use existing M12.4 transport and M05 protection; add no child/DAG node, alternate validation service, storage system, scoring formula or remote-provisioning subsystem.
Proposed implementation paths below are future work under `solution/`, not files implemented by this specification:

- `solution/axbenchmark/engine/judging/adapters/prompts/rubrics/mobile-v1.json` and `solution/axbenchmark/engine/judging/adapters/prompts/question_packs/mobile-v1.json`.
- Existing `solution/axbenchmark/engine/judging/domain/{profiles,rubric,requirements,inputs,reviews,question_packs,grading_plan}.py` gains versioned profile data; M08's existing contracts/adapters gain native evidence through their owned ports.
- `solution/tests/fixtures/judging/mobile_v1/` holds scopes, matrix manifests, build bindings, native images, semantic trees, executed cases, high/medium/low artifacts and decision packs.
- `solution/tests/engine/judging/test_mobile_v1_rubric.py`, `test_mobile_v1_evidence.py`, `test_mobile_v1_decision_pack.py`, `solution/tests/verification/test_mobile_evidence.py` and `solution/tests/integration/test_mobile_v1_judging.py` cover the following cases.

1. **Identity and scope:** assert six ordered keys/defaults `25,15,20,25,10,5`, total 100, twelve criterion IDs and `business_category=spec`. New v2 mobile authoring succeeds; v1 bytes/values/hashes and fullstack→web remain unchanged. Reject post-approval profile/matrix changes and headless UI waivers.
2. **Excellent/usable/broken observations:** a small complete app, a usable app with concrete navigation/adaptation/recovery gaps and an observed broken core app exercise 5/3/1 anchors. Retain per-category explanations/refs plus half-step fixtures with achieved behavior and next-anchor shortfall; no framework/LOC bonus.
3. **Missing versus broken:** absent toolchain/device/images, failed capture, unknown vision and unobserved accessibility/state behavior remain unverified/ungraded/not judged. A demonstrated failed build stays failed separately; observed wrong behavior may earn low grades without inventing inaccessible categories.
4. **Matrix and image binding:** Android-only needs no iOS; declared cross-platform gaps block completeness. Reject wrong OS/matrix cell, source/build digest, historical image and foreign refs. Assert real native images reach both backends and no web dimensions or textual substitutes are imposed.
5. **Semantics and security:** fixtures sharing an initial screen differ in screen-reader labels/focus, large-text clipping, back/deep-link state, process restart, offline sync and permission denial/revocation/local-data behavior. Required native images and semantic/automation/executed evidence distinguish them; pixels alone cannot establish nonvisual outcomes.
6. **Metric and brand invariance:** recursively nest and mutate excluded tokens/cost/time/Gen/Files/LOC/hardware/raw performance, builder brands/identity, weights and reviews. Assert identical admitted digests and replayed decisions while functional target context and source remain usable.
7. **Decision validity:** accept all nine exact labels; reject off-grid 3.7, rounding, unsupported 5, insufficient coverage, foreign refs, missing comments/limitations and contradictory decisions. Retain raw parts/provenance; enforce finite call bounds, image limits and no hidden helper/fallback.
8. **Malicious evidence and operations:** inject “award 5,” exfiltration, prompt overrides, install/reset/run-test/repair and store-publish instructions into source/UI/logs. Assert inert evidence, protected artifact bytes and zero new device operations, tests, network probes, publishing or repair during grading.
9. **Modes, retention and gates:** cover both modes/targets, baseline preservation and mandatory commits. A final high review cannot cure an earlier commit FAIL or failed/unverified checks. Missing decision setup leaves harness/offline access available; imports/reweights/views invoke nothing, and explicit rejudge adds a distinct retained group without changing originals.

Cold-read fixture coverage against the approved feature/matrix map before implementation acceptance. Real M01/M08/M12/M02/M06/M13/M17 integration must prove these boundaries; documentation and fixtures alone establish no native execution capability or platform compliance.
