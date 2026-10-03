# M07.2 — launch-preparation

Parent: [M07 launch contracts](../reference/modules/07-run-configuration.md#1-engine-component). Requirements: R032, R033, R037, R066, R067, R077, R080, R081, R106, R114, R145, R154, R156–R158. Findings: F02/F06 identity, F07 frozen currency, F15 foundations, F18 errors; preserve R158 without changing its policy.

Outcome: one owner-backed validation/resolution path for setup, review and unattended launch, producing immutable UID-bound configuration, original weights and accounting evidence. No competitor or judge process starts in this child.

## Entry conditions

**Completed implementation prerequisites:** [M07.1](01-configuration-drafts.md), [M03.1](../M03/01-readiness-service.md), [M04.1](../M04/01-catalog-resolution.md), [M04.2](../M04/02-catalog-discovery.md), [M04.3](../M04/03-price-rate-sources.md), [M06.1](../M06/01-scoring-service.md), and their Bootstrap/M11 foundation gates. Use real stored readiness/catalog/weight services in acceptance.

**Bootstrap-published contracts, allowed as injected fixtures:** M01 verified revision reader; M05 `HarnessInspection.assess_policy`; M10 `AccountingValidation`; M11 `SchedulingVocabulary`, `ExecutionDefaults`, UID reservation and launch-job coordinator; M12 `JudgeRequirements`/profile/backend-aware assessment totals; M16 `PlannerRecord`; M18 `MonitoringOptions`; M02 `RunBinding`/`ResultRecorder`. The scheduler, judging worker and collectors are later integrations, preventing dependency cycles.

Resolve native context capture independently from classification and the tagged grading branch. Freeze exact decision profile/pack/version/digest, capability/source/model/runtime/locality evidence, accepted content, threshold, budgets and deferred/overlap resource policy in `ResolvedLaunch`, `LaunchPreview` and launch digests. Recheck them before dispatch; changed bindings invalidate review. Expose `can_enable_context_analysis` and `can_choose_decision_grading`, each requiring a configured compatible READY native System One profile and explicit role selection. Unavailable classification returns its typed disabled reason/setup route without invalidating competitors or native metrics. Generic OpenRouter/LiteLLM access never satisfies this gate. Human requires host/renderer readiness; harness retains its own requirements and default preselection only within its branch.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/configs/domain/validation.py`, `judge_selection.py`, `launch.py`, `snapshots.py`, `budget.py`, `digests.py`.
- `axbenchmark/engine/configs/application/setup.py`, `review.py`, `launch.py`, `revalidate.py`; extend M07.1 DTOs/ports/RPC/composition with the parent's launch and fact contracts.
- `axbenchmark/engine/configs/adapters/launch_store.py`; `facts/readiness.py`, `catalog.py`, `rates.py`, `policy.py`, `weights.py`, `judging.py`, `planning.py`, `scheduling.py`, `monitoring.py`, `template.py` in the same adapters package.
- `tests/configs/test_setup_validation.py`, `test_judge_selection.py`, `test_launch_snapshots.py`, `test_launch_freeze.py`, `test_stale_review.py`, `test_trial_budget.py`, `test_launch_integration.py`.
- `tests/configs/fixtures/launch/` snapshots for known/unknown prices, COP/EUR/missing rates, declared-unknown billing, multiple same-harness entries and two same-label run UIDs.

Gather one coherent set of owner facts. Call M03 `AssessOperation.assess` and read `InstalledHarnesses.list`/`MachineIdentitySource.current`; before inspection preserve `environment.not_inspected`. Read M01 revision/identity under the publication view. Neither a fact read nor a launch triggers inspection, authentication verification or model discovery.

Use exact M04 `CatalogSelections.check(selection, required_capabilities)`, `CatalogOptions.get(harness, target, account_id)` and `ExchangeRates.snapshot(currencies) -> RateSet`. Subscribe to published `catalog.refresh.finished`, `catalog.prices.refreshed`, `catalog.rates.refreshed` and override events. No lookup alias or invented rate event is registered.

Resolve presets through M06 `WeightValidation.validate`. Apply M05 policy, M10 accounting, M11 trials/concurrency and M18 interval validation with unchanged owner codes. A rejected setter stores none of its patch; save can still retain structurally valid incomplete setups. Apply saved/planner/first-usable preselection only to the harness-review branch; report skipped reasons and never replace an explicit decision or human selection.

The M12 bridge calls async `JudgeRequirements.check(template: Sha256, judge: JudgeSelection) -> JudgeCheck`. Preserve backend, usable, exact profile/version/rubric, ordered default quality weights, frozen evidence plan/coverage and required modalities, capability/source and readiness reasons. Automated image requirements map to image_input and retain typed unsupported/unknown reasons; human uses host/renderer evidence without a model capability receipt. `execution_totals(selection, configurations, trials) -> AssessmentTotals` validates positive integers and returns logical_assessments, judge_sessions, decision_call_bound and human_cases under M12 branch semantics; legacy session_count applies only to harness review. No invocation or trial cap occurs.

Review resolves exclusions/policy adjustments before totals, facts and digests. `configs.review` returns complete `LaunchPreview`; missing rates are limitations and warnings never disable Launch. Draft launches require this preview digest. Re-resolve before staging; changed content, preset values, price/rate/billing/readiness evidence or adjustments yields `configs.review_stale` and zero committed records.

Freeze the catalog's complete pricing fields, billing kind/source/declaration/observation/label and needed rates, including the independent machine judge when applicable; Human freezes cost applicability as not applicable without a fabricated price row. Needed non-USD currencies are price currencies ∪ display currency ∪ tariff currency. Preserve unknown override provenance, source date, retrieval date and refresh evidence. COP `4000` means units per USD. No cost calculation, rate fetch or guessed value belongs here.

Display currency defaults to USD and is immutable with rates after launch. Later analysis may change tariff/weights only; M10/M06 own conversions and mixed-currency USD presentation. Preset/rate refreshes after commit cannot modify the frozen documents or their digests.

Keep separate configuration/weights digests and the complete M02 `RunBinding` digest. Use `freeze_configuration(run_uid, resolved, identity, run_label, launched_at)`, `freeze_weights(run_uid, resolved)`, `commit(run_uid)`, `discard(run_uid)`. Each stage binds the same resolved digest/identity; commit requires all parts and returns `FrozenLaunch`.

The complete binding records origin, verified template/baseline, all competitor ConfigurationIds, trial counts/settings, judge and accounting/weight evidence. Allocate the full shared `TrialRef {run_uid, configuration_id, trial_index}` roster, with 1-based indices; run labels and saved setup IDs are never trial/group keys. `LaunchRecords.get(run_uid)` returns exactly that immutable evidence to M02.

Identical staged/committed retries are idempotent; missing/mismatched parts return `configs.freeze_incomplete`, UID conflicts `configs.launch_conflict`. Discard deletes unpublished staging only; committed evidence returns `configs.launch_committed`. M11 must journal post-commit binding recovery and create every result through `ResultRecorder.open_result(TrialRef)` before launch success/execution.

R158 is exact: trials default 1, every positive whole number allowed without a ceiling; task timeout stays 3 h. Both Setup and Review always return task runs plus backend-aware AssessmentTotals. Only `trials > 5` plus at least one competitor with remote, mixed or unknown inference locality raises the warning; an independent cloud judge does not defeat the evidenced all-local competitor exception. A loopback LiteLLM proxy forwarding remote inference still raises it. Connection URL and `EndpointRef` do not establish inference locality.

For the fixture 4 configurations × 6 trials × 7 tasks, show 168 task runs and 24 logical assessments: 24 harness sessions, the frozen decision-call upper bound, or 24 human cases according to the selected branch. TUI confirms that digest's warning; unattended launch emits its final resolved warning/totals and continues without prompting. Adjustments/stale re-review invalidate prior confirmation.

Revalidation changes draft projections atomically with revisioned events. Use typed cursors and the shared error envelope. `configs.launch.frozen` publishes only after durable complete freeze and does not itself announce a started run. Scrub all diagnostic text before any persisted/API/event/log output.

**Frozen domain contract.** PrepareLaunch resolves and freezes the exact rubric/category/comment contract and approved DomainEvidencePlan reference with target/case/mode/authority/budget/required-modality summary. Use M03 verify_artifact prerequisites for native tools/devices, product model/tools or trusted document parsers, independently from M12 backend readiness. Capture current availability/provenance; unknown/unsupported required coverage is an owner issue, never a browser default or a silent downgrade. All competitors use the same obligations; frozen plan or readiness changes invalidate preview_digest.

## States supplied to screens

| Exact board/state | Resolution supplied |
|---|---|
| Setup / SetupInvalid | Owner issues/limitations, totals, selected judge/weights, disabled review reasons. |
| JudgePicker / JudgeFallback | Ordered branch outcomes, engine fallback notice, independent explicit choice and supported options. |
| ReviewLaunch / TrialBudgetWarning | Resolved evidence and digest; exact task/judge totals and non-blocking budget payload. |
| LaunchRecord | UID/label, full roster/binding, original configuration/weights, redacted evidence and path. |
| Parent fault states | Incomplete setup, stale review, no inspection/harness, unknown/unsupported capability, clean-policy refusal and failed freeze. |

Resolve presets to complete M06 `RankingWeightsV2`/`RankingPlan` and freeze original raw exact values, normalized preview, every direction and selected metric-policy ID/version/digest/basis/scope in `ResolvedLaunch`, `LaunchPreview`, `OriginalWeights` and the existing weights/configuration/RunBinding digests. Call `WeightValidation.validate(profile_id, quality, ranking, metric_policies, rubric_ref=frozen_rubric_ref)` before freeze; direction/policy changes stale a reviewed launch like weight changes. Measurement availability is an execution observation, so a valid chosen factor is not a claim of native adapter support; disclose known capability limits without fabricating values or requiring decision-engine readiness. Preserve source schema provenance for accepted archive/config inputs without changing original bytes.

Freeze `FrozenVariantSelectionV1 {requested_ref, descriptor_snapshot, resolved_manifest, identity_evidence: VariantEvidenceV1, controls: VariantControlSnapshotV1, review_notices}` per entry in `ResolvedLaunch`, `LaunchPreview`, configuration snapshot and RunBinding. Preserve descriptor/normalization versions, required creator/date/source claims and requested versus resolved proof independently. Full configuration fingerprint still binds harness/version, effort, account/route, environment and serving controls; content fingerprint alone never merges launches. Every required comparison control has evidence or an explicit unavailable reason; runtime observations arrive later from M05.

`CatalogSelections.check` validates the ref; a known requested/resolved mismatch returns `catalog.variant_mismatch` before freeze. Changed descriptor, manifest, alias resolution, claims or control evidence invalidates `preview_digest` under `configs.review_stale`. Missing metadata/effective proof is a visible unverified limitation, allowing otherwise usable execution without a strict Matched promise. Freeze comparison mode/policy/variation fields separately from the R192 harness axis; no lineage price/billing inheritance.

**Route, comparison and profile interfaces.** Extend SetupFacts, SetupView, ResolvedLaunch, LaunchPreview, FrozenLaunch and RunBinding with optional comparison plan/frozen reference, per-cell ResolvedAccessPlanV1/ResolvedExistingAgentPlanV1, complete selected entry/trial roster, coverage and common-control digest. Resolve under one coherent catalog/publication/capability view and validate exact required controls, all_competitor_inference, headless/tools/isolation and mapping. Strict requires Contract and jobs=1; explicit subset changes coverage only, exploratory never bypasses executable transport/model/isolation readiness. Preview digest closes over profile/source/executable/asset/config/binding/mapping/qualification versions, grading/weights/baseline, trials and scheduling policy. Immediately revalidate all selected cells before the single freeze/commit; stale/blocked input publishes no partial matrix. Reusable imported profile refs require independent local registration/credential binding. Freeze ordinary existing inheritance without inventing optional settings proof; unreviewed target conflicts block. Trial warnings and resource policy follow actual inference location, not loopback.

**Controlled comparison preparation — R192–R193.**

Consume [CROSS-HARNESS-COMPARISON.md](../CROSS-HARNESS-COMPARISON.md) readiness/equivalence evidence at review and recheck it before freeze. Strict all-harness mode admits only a full ready registry roster; a subset/exploratory selection must be explicit and retained with its coverage. Bind the frozen matrix and each cell's route/model/effort mapping to the complete launch/TrialRefs under existing atomic publication. Changed capabilities, alias targets, serving policies or effort mappings return stale-review errors. Count probes outside benchmark task totals and use actual inference locality for trial-budget warnings. Unknown gateway upstream does not earn the local-only exception.

**Existing-profile freeze — R194.**

Revalidate the [existing launcher profile](../CROSS-HARNESS-COMPARISON.md) source/version/behavior bindings and its reviewed treatment before preparing a launch. Changed alias/env declarations/settings or override intent returns a stale preview with zero spawn. Build the effective isolated plan once; preserve inherited, explicit and imposed role-control sources in the frozen digest. Required route, secret-resolution, isolation or comparison conflicts block; unknown optional settings remain disclosed. Never substitute the normal global Claude configuration when a named profile fails. Actual model/effort evidence remains an execution observation, not a registration side effect.

## Integrated requirements

R192, R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R189 — [human review](../M12/05-human-review-web.md).

R184, R185, R186, R187, R188 — frozen domain profile/evidence contracts: [R184](../quality-judges/BACKEND.md); [R185](../quality-judges/MOBILE.md); [R186](../quality-judges/DEVOPS.md); [R187](../quality-judges/AGENTIC.md); [R188](../quality-judges/SPECIFICATION.md).

R175, R176 — [benchmark statistics](../BENCHMARK-STATISTICS.md).

R165, R167, R168 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

R177, R178, R179, R183, R181, R182 — [benchmark modes](../BENCHMARK-MODES.md); [Cursor](../M05/08-cursor-adapter.md) and [OpenCode](../M05/09-opencode-adapter.md) registry contracts.

Extend `SetupFacts`, `ResolvedLaunch`, `LaunchPreview` and configuration snapshots with M01 format/benchmark type/project type/derived target mode/legacy marker, ordered task/input refs and baseline digest/flags, plus frozen `TaskCommitProtocolRef`. These are derived facts bound to the approved template; no configuration override may replace authored input or protocol. Include them and six-registry scheduling evidence in preview/configuration/RunBinding digests. Revalidation rejects changed policy/check/scope/input/capture facts as stale.

Require M03 Git/runtime assessment and M05 setup capability before spawn; incompatible legacy commit declarations require a reviewed revision, while the built-in's existing branch remains valid. One-shot task totals use N=1; multi-step uses frozen N>=2, with C×T logical assessments. Manual authoring does not depend on this execution gate. Add freeze/budget fixtures for all seven domains, both modes×targets, six adapters/subsets, missing Git, protocol mismatch, empty authored checks, deleted source and explicit jobs=4/5 under the registry-derived default.

**Human launch acceptance:** Freeze reviewer/form-policy identity and form bounds with exact rubric/evidence/scope bindings; no price/call/model identity is synthesized for Human. `AssessmentTotals` travels unchanged through SetupView, LaunchPreview, TrialBudgetWarning and LaunchStep: logical assessments C×T for every branch, human_cases=C×T only for Human, judge_sessions=0 and decision_call_bound=0 for Human. Launch review states that one local anonymous queue opens after all execution/verification/accounting seals, one case per expected trial, and quality completion awaits actual dispositions. Test all six families, source profile edits/stale previews, no decision engine, stopped-before-admission and zero grading calls.

## Acceptance and faults

**Route/profile acceptance:** Race every profile/config/source/mapping/capability edit against freeze and assert zero spawn/partial publication. Reject same-label different revision/quant, default/omitted/approximate effort, unknown required helper scope and strict jobs>1. Preserve full expected roster after real failed attempts; missing/unselected cells create no trial. Judge bindings remain independent JudgeGroup scope, Human/System One unchanged.

**Variant acceptance:** Review then edit a creator claim, artifact, adapter order or required control: stale review yields no freeze/spawn. Opaque providers remain explicitly unverified; known contradiction blocks. All repeated trials bind the same requested snapshot/control policy; post-launch catalog edits cannot alter retained hashes, and a separate harness-comparison choice never waives fixed-harness quant/fine-tune controls.

**Domain acceptance:** Exercise backend text without browser, mobile matrix missing one required cell, DevOps simulation unable to satisfy an applied claim, unapproved/live-unready agent case and missing supplied brief/parser. Every failure starts zero grading/evaluation calls and writes no partial freeze; fullstack stays web.

Extend launch snapshot/freeze/stale-review cases to all eight weights, null zero-factor directions, explicit positive directions, changed selected policy digest, exact Fraction values and v1 normalized originals. Invalid v2 plans cannot freeze; later preset or policy edits cannot rewrite the committed launch. Native metrics remain usable with classifier/grader configuration absent, and full frozen TrialRefs remain unchanged.

Test independent monitor/grader selections, READY-to-stale transition, no implicit engine choice, disabled optional observer with runnable competitors, generic chat route rejection and human/harness availability without a decision engine. Launch snapshots disclose destination/content/budget/locality and remain immutable after reusable-profile edits.

```sh
pytest tests/configs/test_setup_validation.py tests/configs/test_judge_selection.py tests/configs/test_launch_snapshots.py tests/configs/test_launch_freeze.py tests/configs/test_stale_review.py tests/configs/test_trial_budget.py tests/configs/test_launch_integration.py
```

1. Cover all judge branches, no usable candidate, saved versus USER origin and common rubric/profile; assert the M12 bridge signature, full JudgeCheck/default-weight mapping and exact session-count product; repeated same-harness entries remain distinct. Invalid efforts, weights, trials, tariff and interval return owner field errors without substitution.
2. Freeze USD/EUR prices, COP display and tariff-only GBP; include cached/reasoning prices, explicit unknown rate override and declared-unknown billing. Assert exact provenance/labels and no source/probe/model calls from review or freeze.
3. Refresh rates/edit presets after freeze; compare every immutable document/digest. Mixed-currency fixtures retain separate currencies for M10; no API accepts analysis display currency/rates.
4. Change each digest input between review and resolve, including file content and clean-policy adjustments; reject before staging. A transient gather timestamp alone leaves the digest stable; changed source dates/provenance do not.
5. Test trials 1/5/6/50/1000, invalid scalar inputs, one provider among local entries, all-local competitors with cloud judge, and exclusion of the last provider. Verify totals at all counts, warnings only at the specified boundary and no trial ceiling.
6. Fail identity check, each stage/write and commit; no partial launch is readable. Retry identical steps, mismatch weights to configuration, conflict a UID, and attempt discard after commit. Verify two same-label UIDs have disjoint TrialRefs and complete binding digests.
7. Exercise real clients and owner services with deterministic clock/IDs; inject catalog updates during subscription handoff, stale draft workers and restart. Scrub seeded diagnostics and assert no credential value leaks through files, errors or events.

## Real integration gate

Compose real M01 identity, M05 policy, M10 accounting, M11 scheduler, M12 judge requirements and M18 monitoring. Review/launch through TUI and M14 CLI; inspect M02's exact per-trial frozen binding and M17 round-trip. Crash after commit and midway through result binding: recover the same UID/roster without execution before completeness or deletion of frozen evidence.

**Pending parent obligations:** M07.3 rendering/confirmation, M11 bind recovery and warning delivery, M01/M16 atomic revision integration, M10 currency/tariff analysis and M02/M17 provenance preservation. Fake launch jobs and policy/judge/collector ports do not establish real provider execution.
