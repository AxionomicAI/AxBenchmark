# M07.3 — setup-review-screens

Parent: [M07 screens](../reference/modules/07-run-configuration.md#4-screens). Requirements: R017, R019, R032, R033, R037, R066, R067, R077, R080, R081, R106, R114, R145, R154, R156–R158. Findings: F07 immutable currency, F04 subscriptions, F15 foundations, F18 errors.

Outcome: editable Setup, independent judge choice, complete launch review, exact budget confirmation and immutable launch inspection at both terminal sizes. Engine DTOs own every validity, total, provenance and action-state decision.

## Entry conditions

**Completed implementation prerequisites:** [M07.2](02-launch-preparation.md), M15.1 `tui-foundation` and M15.2 `tui-shell` from the [foundation contract](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries). Reuse workers, widgets, prompts, typed cursor subscriptions, navigation, focus and wide/compact harness.

**Bootstrap-published contracts, allowed as injected fixtures:** M01 `LaunchCheckScreen`; M04 `EntryPickerScreen`; M05 environment/clean-policy screens; M06 `WeightsScreen`; M10 `CurrencyEnergyScreen(mode="setup")`; M12 `JudgeCapabilityScreen` factory from `axbenchmark/tui/screens/judge_capability.py`; M18 `MonitoringScreen`; M11 launch-job responses. Use injected screen factories/client responses until real owners integrate; do not duplicate their screens or make every parent a prerequisite.

Add owned `tui/screens/decision_engines.py`, `tui/viewmodels/decision_engines.py`, `tui/styles/decision_engines.tcss` and `tests/tui/test_decision_engines.py`. `DecisionEnginesScreen` uses `decisions.profiles.list/get/save/test` and `decisions.capabilities`; save creates an immutable version, test distinguishes metadata-only from explicit bounded inference. Setup's context role and JudgePicker's three backend choices use separate owner mutations (`configs.set_execution` context settings; `configs.set_grading_selection` tagged grading selection), never implicit selection on save/test.

Show profile/version, destination/auth presence, capability reasons, requested/resolved identity, actual locality, admitted content, confidence policy, limits and deferred/overlap policy in setup and review. READY plus explicit selection controls decision actions; disabled states link back to this screen. Harness/human selection and native capture remain usable without System One. Keep four root destinations and all actions within feature routes.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/tui/screens/setup.py` (`SetupScreen`, `JudgeScreen`, `ReviewLaunchScreen`) and `run_config.py` (`LaunchRecordScreen`).
- `axbenchmark/tui/viewmodels/setup.py`, `judge.py`, `review_launch.py`, `launch_record.py`; pure DTO-to-view mappings.
- `axbenchmark/tui/styles/setup.tcss`, `review_launch.tcss`, `launch_record.tcss`; register factories through the existing M15 navigation seam.
- `tests/tui/test_setup_viewmodels.py`, `test_setup_screen.py`, `test_judge_screen.py`, `test_review_launch.py`, `test_launch_record.py`, `test_setup_subscriptions.py`, `test_setup_navigation.py`.
- `tests/tui/fixtures/configs/` schema-valid JSON fixtures for each named board and loading/empty/error/stale variants.

Use only parent's `configs.*`, `catalog.options`, `runs.launch` and shared navigation. No screen imports engine validators, computes totals/weights, infers effort support or converts money. Use `ActionState.enabled/reason`; shared `EngineError` message/field/remedy renders unchanged.

Mount Setup with `configs.open`; reopen never-saved drafts by draft ID. Persist each successful edit via its one command; plain Escape/disconnect only ends observation. Configuration switching uses the shared unsaved-change confirmation and retries the same request with explicit discard only after acceptance.

Judge candidates come from `configs.judge_candidates`; selected harness options from `catalog.options`. `configs.set_grading_selection` authorizes the tagged choice; legacy configs.set_judge remains harness-only. The successful command applies the explicit selection. Saved/planner/first-usable branch marks and fallback notice come from the engine; user choices stay independent of competitors.

On `judging.screenshot_inspection_unsupported`, `judging.screenshot_inspection_unknown`, `judging.modality_unsupported`, `judging.modality_unknown` or `judging.required_evidence_unavailable`, Setup/JudgeScreen opens that M12 factory. M12 owns the modal, its `judging.check_judge` refresh and Action result; M07 handles CHOOSE_JUDGE, OVERRIDE_CATALOG then revalidate, RECHECK, or BACK without changing the judge implicitly. `setup.py` owns no JudgeCapabilityScreen implementation.

WeightsScreen returns validated values to one `configs.set_weights` call. CurrencyEnergyScreen setup mode returns accounting to one `configs.set_execution`; monitoring/environment pickers issue their owned mutation. Use engine limits/defaults and preserve raw invalid input beside its field error.

Review mounts `configs.review(draft_id, **adjustments)`. Launch issues `runs.launch(draft_id, preview_digest, **adjustments)` and hands its `JobRef` to M01 LaunchCheckScreen. Subscribe through M15 to `job:<job_id>` for that job; no bare `job` topic or `jobs.*` event is invented. Cancel uses the shared jobs flow, never deleting a frozen launch from the UI.

Budget confirmation belongs to the current preview digest. Launch/Back show the engine message and exact totals; cancel issues no launch. A new preview, draft change, stale-review error or clean-policy adjustment clears confirmation and requires a new review before another launch attempt.

Unattended warning behavior is M11/M14's path: print final resolved warning/totals and continue without prompting. Screen tests do not substitute for that CLI integration.

**Frozen domain contract.** Setup/JudgePicker/ReviewLaunch/LaunchRecord show exact family/version/digest/category labels, required modalities, domain coverage and source/authority limitations from owner DTOs. Include native matrix, DevOps plan/dry-run versus applied claims, agent evaluation bounds/modes and specification brief/reference precedence in launch review. The existing M12 capability modal handles image, generic modality and required-evidence errors; verification-tool/device/model-access issues route to M03 explanations. No profile/coverage waiver is a view action.

## Boards, states and actions

| Exact board/state | Required content and action |
|---|---|
| Setup | Revision pin, saved/draft selector, distinct entries, judge, both weight sets, concurrency/trials, monitoring, display currency/tariff and totals even with one trial. |
| SetupInvalid | `.-invalid`, owner issues and fix keys, disabled review; preserve inputs and optional non-blocking limitations. |
| JudgePicker | Engine backend choices with harness/model/effort, decision profile or human reviewer/form policy as applicable, rubric/capabilities; Use issues one `configs.set_grading_selection`. |
| JudgeFallback | Same picker with exact skipped-branch reasons and engine fallback warning; no quality recommendation. |
| JudgeCapability (M12-owned) | Injected capability modal; M07 handles its Action result and preserves the draft; implementation stays in `judge_capability.py`. |
| ReviewLaunch | Effective configuration/adjustments, frozen-ready prices/rates, source/date, billing declaration labels, totals, digest and Copy CLI capability. |
| TrialBudgetWarning | M15 ConfirmScreen, title “More than 5 trials”, budget/subscription message, task-run and backend-aware assessment totals, Launch/Back. |
| LaunchRecord | Read-only redacted YAML, UID plus display label, full TrialRef roster, binding digest, original weights/prices/rates; Copy path only. |
| Parent states without separate boards | Loading, no entries, file/pin error, invalid trials, missing capability, stale review, no rate, failed launch and unavailable launch record. |

Use parent widget IDs `#entries-*`, `#validation`, `#dirty`, `#execution-pane`, `#judge-pane`, `#weights-pane`, `#preselection`, `#review-*`, `#launch` and `#resolved-yaml`. Wide is 120×40; compact is 80×24, retaining currency, provenance, totals and identity with scrolling.

Bindings remain parent `a/e/del/p/j/w/c`, configuration/preset/concurrency selectors, `ctrl+s`, Enter review, `ctrl+l` launch and Escape. Tests assert each accepted action's exact API call; cancelled prompts issue none. Copy CLI/path copies only engine-returned text/path.

Setup/Review subscribe to `configs.draft`, selecting the current draft key. Apply revisioned snapshots/upserts/tombstones with full `EventCursor`; replace on resync and ignore old generation events. Relevant edits/revalidation disable Launch pending refreshed review; discard leaves the editor. Ignore late workers from a previous draft/preview.

Render billing labels including “declared by user” for known and unknown declarations. Rate lines use units per USD, source date/retrieval date and “supplied by user” where returned. No analysis display-currency/rate selector exists; LaunchRecord cannot edit any frozen field.

Setup's M06 WeightsScreen handoff and `configs.set_weights` retain the complete eight-factor versioned ranking envelope and selected policies. Setup/ReviewLaunch/LaunchRecord display original exact values, normalized previews, enabled directions/policy/basis and defaults with five extras zero, separately from the six quality-category weights. Do not drop null disabled directions when serializing. A positive new factor without direction shows M06's field issue and remains unapplied; unknown native support is a disclosed source limitation, not fabricated readiness or an inferred higher-is-better preference.

Setup entry VMs carry `model_variant_ref`, `FrozenVariantSelectionV1` preview and comparison selection. Open M04's `SetupVariantDetailEditor` by context/model/ref; successful save refreshes and revalidates the draft via owner APIs. ReviewLaunch/LaunchRecord render requested and resolved identities, ordered FINETUNE+QUANT path, creator roles, separate creation/publication/upload dates, precision/basis/conflicts, control-policy/variation fields and proof gaps. Retain native selector, variant ID, descriptor digest and configuration ID as distinct values.

Select variant mode and fine-tune weights-only/package scope through revisioned configuration commands; show strict eligibility as unknown until effective evidence exists. Unverified metadata is a notice; `catalog.variant_mismatch` blocks review/launch with expected/observed refs and remedy. Metadata/control drift clears prior confirmation. No client comparison calculation or current catalog lookup rewrites LaunchRecord.

**Route, comparison and profile interfaces.** Extend Setup/ModelPicker/EffortPicker/ReviewLaunch/LaunchRecord VMs with the full HarnessComparisonPlanV1 projection and existing-profile choice per native cell. Bind create/update/preview/export to `configs.comparison_*`, entry/profile selection to `configs.existing_agent_select`, profile editors to M04 factories and targeted diagnostics to M03. Show native effort contract units plus exact mapping, full six-row status/reasons, all_registry/subset N/6, strict/exploratory/helper scope, strict jobs=1, route translation, actual inference locality/budget and separately selected grading. Review uses engine preview_digest; launch calls only runs.launch with the existing reviewed draft. Inherited, clean and explicitly overridden treatments show profile/version/source/evidence and unresolved conflicts; do not auto-select a registered profile.

**Cross-harness setup and review — R192–R193.**

Implement [the comparison design contract](../CROSS-HARNESS-COMPARISON.md#apis-cli-and-design-engine-handoff): choose the common model/effort/profile, show all six ordered cells with route/mapping/evidence, require explicit subset/exploratory selection and use engine readiness/preview digests. Review includes coverage, helper scope, true inference locality, cost assumptions and unavoidable harness/protocol differences. No closest-effort substitution, automatic removal of blocked cells or inference during screen loading. A stale preview preserves choices and requires a new engine review; launch stays the existing M11 operation.

**Select an existing alias/profile — R194.**

Add the existing-agent picker and common-target conflict review from [CROSS-HARNESS-COMPARISON.md](../CROSS-HARNESS-COMPARISON.md#existing-agent-aliases-and-launcher-profiles). A profile fills the chosen underlying-harness entry/cell; all six registry rows remain unchanged. Default to the named existing treatment and display inherited declarations distinctly from verified effective controls. Use profile values or benchmark-only overrides only through the explicit revision-checked command. Show source/profile drift and transformed treatment, preserving draft inputs after validation errors.

## Integrated requirements

R192, R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R189 — [human review](../M12/05-human-review-web.md).

R184, R185, R186, R187, R188 — frozen domain profile/evidence contracts: [R184](../quality-judges/BACKEND.md); [R185](../quality-judges/MOBILE.md); [R186](../quality-judges/DEVOPS.md); [R187](../quality-judges/AGENTIC.md); [R188](../quality-judges/SPECIFICATION.md).

R175, R176 — [benchmark statistics](../BENCHMARK-STATISTICS.md).

R165, R167, R168, R172 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

R183, R181, R182 — [benchmark modes](../BENCHMARK-MODES.md); [Cursor](../M05/08-cursor-adapter.md) and [OpenCode](../M05/09-opencode-adapter.md) registry contracts.

Setup/Review/LaunchRecord VMs render engine benchmark/project/target mode, primary order/count, baseline identity/provenance and the locked “Every task must commit” instruction/version/check digest separately from prompt text. Use all six registry entries for competitor and harness-review pickers, preserving vendor/version/generation and unavailable-role reasons. Show typed missing-Git and incompatible legacy-revision blockers; no client Git inspection, protocol override or planner call.

Add wide/compact fixtures for one-shot totals, reordered multi-step primaries, empty/populated capture and source-removed reuse; reach Cursor/OpenCode and queued same-harness entries without dropping rows. Confirm stale mode/order/policy preview invalidates launch confirmation, and no-harness manual-authoring navigation stays available.

**Human picker/review acceptance:** JudgePicker offers Human for every frozen rubric with local self-declared reviewer/form-policy and host/renderer readiness. Hide inapplicable model/effort/API-key/confidence controls, preserving the independently selected context role. Setup/ReviewLaunch/LaunchRecord render owner logical_assessments/human_cases and zero machine counts; disclose one post-seal queue and pending quality completion without counting human wait as benchmark time. Test saved Human restore, missing renderer remedy, profile drift/stale preview and all six families at both sizes; Use issues only configs.set_grading_selection, with no browser opening before execution seals.

## Acceptance and faults

**Route/profile acceptance:** Wide/compact flows preserve editable state on stale/blocked results, unsupported effort is disabled without closest replacement, explicit deselection retains rows/reason, register alone never selects/launches, and source changes force review. Back/navigation is model-free; inherited optional unknowns do not render ordinary profile unusable while strict qualification gaps block.

**Variant acceptance:** At both sizes render combined facets, Unknown/conflicts, opaque remote unverified state, known mismatch and stale review. Editor handoff saves once/revalidates and retains draft scope; frozen LaunchRecord remains unchanged after catalog edits. Harness-comparison and fixed-harness variant controls show separate labels.

**Domain acceptance:** Add six-family wide/compact fixtures and typed generic-modality/missing-evidence routes; selecting Human preserves renderer readiness and no model gate. Verify profile/version and coverage survive save/reopen/review without client recomputation.

Extend setup/review/launch-record Pilot fixtures at both sizes for all eight controls via M06, a missing positive direction, exact values, mixed policy choices, distinct defaults versus originals, and changed direction/policy causing stale review. Each successful handoff emits one complete `configs.set_weights`; report/save/export retains directions and policy refs without screen arithmetic.

Add wide/compact fixtures for no profile, incompatible/unknown native capability, READY but unselected, distinct monitor/grader profiles, stale profile version, deferred local work and server-state-unknown. Assert navigation/save/test never enables a role; inference test is explicit and cancellable, and selection uses exactly its owner command.

```sh
pytest tests/tui/test_setup_viewmodels.py tests/tui/test_setup_screen.py tests/tui/test_judge_screen.py tests/tui/test_review_launch.py tests/tui/test_launch_record.py tests/tui/test_setup_subscriptions.py tests/tui/test_setup_navigation.py
```

1. Render every board/state through pure view-model tests and Textual Pilot at both sizes; exercise keyboard/mouse, focus, resize, scrolling and Escape. Check full totals, source/date/billing and UID/trial labels survive compact layouts.
2. Drive every edit/select/save/discard/judge/preset/navigation action once and assert exact call arguments. Returned invalid raw trials stay visible; no client normalization, fallback selection, total recomputation or currency conversion occurs.
3. Show four configurations, six trials, seven tasks: 168 task runs and 24 logical assessments, with 24 harness sessions or 24 human cases or the decision-call bound as selected. Launch opens warning; Back/Escape call nothing; Launch calls once with the exact digest. At five trials/all-local competitors the engine gives no warning and no modal appears, even with a cloud judge.
4. Change a draft/rate/preset while review or confirmation is open; reject stale confirmation. Delay A then load B and return A last; keep B. Clean-policy adjustments obtain a new digest/totals and cannot reuse earlier consent.
5. Test epoch change, replayed older revision, discard tombstone, queue overflow and unmount/remount. No discarded draft/old review returns; unmount issues no mutating command and engine restart restores persisted edits.
6. Render missing conversion, explicit unknown declarations, source failure, unresolved judge, clean-policy refusal and typed RPC error. The remedy remains visible, retries are scoped, and optional limitations/warnings do not disable launch. Assert the M12 factory receives template/judge context and each capability-modal Action produces only the documented navigation/revalidation.
7. Inspect two runs with the same display label and different UIDs/rosters; requests use UID and read-only text remains immutable. Failed `runs.launch`/`configs.launch_record` leaves a recoverable error state with no invented success.

## Real integration gate

Through real EngineClient/M07 and integrated M01/M04/M05/M06/M10/M12/M18 screens (including the real M12 capability factory and all four Action returns), save/restart/reopen, adjust setup, review and launch with M11. Compare frozen M02 records against the approved preview. Run the same YAML via M14 with six provider trials: stderr shows warning/totals, stdin is never read, execution continues; repeat all-local and five-trial exceptions.

**Pending parent obligations:** M07.1 transactional approval/deletion and M07.2 real bind/recovery/accounting gates; M15.3 full navigation; M14 CLI parity; M02/M17 frozen evidence. Wireframe owners must maintain the seven-board/state ledger, add immutable UID/provenance fields and verify totals/confirmation freshness at both sizes; this child does not edit wireframe source.
