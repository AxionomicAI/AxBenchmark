# M07.1 — configuration-drafts

Parent: [M07 reusable configuration](../reference/modules/07-run-configuration.md#1-engine-component). Requirements: R009, R017, R019, R032, R033, R066, R067, R136, R145. Findings: F14 atomic approval/deletion, F15 foundations, F18 error envelope.

Outcome: revision-scoped YAML configurations, restart-safe setup drafts and reusable weight presets, exposed through the real client without starting a harness. This is proposed implementation work, not a completion claim.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M01.1 identity](../M01/01-canonical-definition.md), M11.1 `engine-client-api` and M11.2 `events-jobs-lifecycle` from the [foundation contract](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries). Shared publication views/transactions, typed IDs, registry, clients, errors and event revision rules must be executable.

**Bootstrap-published contracts, allowed as injected fixtures:** M01 `RevisionReader` and approval/deletion coordinator; M03 `AssessOperation`; M04 `CatalogSelections`/`CatalogOptions`; M05 policy vocabulary; M06 `WeightValidation.validate(profile_id, quality, ranking: RankingWeightsV2, metric_policies, rubric_ref=frozen_rubric_ref)`; M10 accounting, M11 scheduling, M12 profiles and `JudgeRequirements.check(template: Sha256, judge: JudgeSelection) -> JudgeCheck`/`execution_totals(selection, configurations, trials) -> AssessmentTotals`, M16 planner and M18 monitoring inputs. Their complete implementations are not prerequisites. M07.2 replaces fact-source fakes.

Extend draft/YAML/DTO schemas with `context_monitoring={capture_enabled, enabled: false, decision_profile_ref?, question_pack_ref, acceptance_policy, budget, resource_policy}`; native capture defaults on, absent profile keeps classification disabled. Persist the M12 tagged `JudgeSelection`/`GradingSelection` union: `harness_review`, `decision_rubric {profile_ref, question_pack_ref, acceptance_policy, evidence_policy}`, `human_review {reviewer_ref, form_policy_ref}`. Role selections are independent and refs pin immutable ID/version/digest. Store credentials only as references; a profile edit creates a new version, never rewrites saved frozen launches. Saving incomplete config never enables or starts inference.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/configs/domain/configuration.py`, `drafts.py`, `presets.py`; persistence structures and structural validation only.
- `axbenchmark/engine/configs/ports.py` and `application/interfaces.py`; establish repository/draft/preset and `RevisionConfigs`, `WeightPresets`, `SavedJudges` contracts; M07.2 extends these files with launch ports.
- `axbenchmark/engine/configs/application/drafts.py`, `configurations.py`, `presets.py`, `revision_configs.py` for the parent's corresponding use cases.
- `axbenchmark/engine/configs/adapters/config_yaml.py`, `preset_yaml.py`, `fs_drafts.py`, `scrubber.py`, `rpc.py`, `composition.py`; M07.2 extends the last two registrations/bindings.
- `axbenchmark/api/configs.py` draft/config/preset DTOs; reuse Bootstrap owner types and shared `ActionState`/`EngineError` rather than redefine them.
- `tests/configs/test_config_yaml.py`, `test_drafts.py`, `test_presets.py`, `test_revision_transactions.py`, `test_draft_api.py`, `test_draft_events.py` and `fixtures/saved.yaml`, `fixtures/invalid.yaml` under `tests/configs/`.

Implement `configs.list/get/open/setup`, entry edits, judge/weights/execution setters, save/duplicate/discard and preset list/save/delete. Inject the parent fact-gathering seam for returned `SetupView`; validation/preselection logic itself is M07.2. Successful commands persist before returning/publishing. Saving an incomplete but structurally valid setup is permitted.

Keep saved `config_id` separate from competitor `entry_id: ConfigurationId`. Multiple entries may choose the same harness/model. Configuration YAML pins exactly one revision SHA; no edit changes template payload or an earlier launch. Account labels/fingerprints and credential presence are the only credential-related fields.

Drafts store base config ID/file digest, current content and dirty state under `drafts/setup/`. Reopen returns existing unsaved edits. Save validates the expected file digest; external changes return `configs.file_changed` without overwriting either version. Discard removes only its draft; interface exit does not discard. Malformed files remain untouched with typed errors.

Presets distinguish quality/profile and ranking sets; built-ins remain immutable. Validate both sets through M06's port before saving, preserving exact values and owner field errors. Configurations store preset references; M07.2 resolves values before freeze, so editing a preset cannot rewrite history.

`RevisionConfigs.summaries(sha, view)` shares M01's captured `PublicationView`. Implement exact `prepare_copy(tx, from_sha, to_sha)`, `prepare_remove(tx, sha)`, `commit_view(tx)` and `rollback(tx, token)` signatures from the parent; preparation returns `PreparedConfigs {transaction_id, token, count, config_ids}`.

Prepare invisible durable overlays; copies have fresh config IDs and the destination pin. `commit_view` acknowledges readiness only. M01 publishes revision/configuration/draft approval or revision/configuration deletion together. Rollback touches token-owned unpublished rows only; published transactions roll forward. Preserve prior pinned views during overlay compaction and cleanup.

Ordinary saves/duplicates and transaction preparation share the mutation boundary and reservations. A guessed staged ID cannot be loaded/launched. Deleted-revision drafts refuse save/launch with `templates.not_found` but can be discarded. Restart recovery finishes before readers and resumes the durable event outbox without duplicate visible effects.

Register parent configuration/preset/draft events and snapshots through M11. Use revisioned upserts/tombstones and full `EventCursor`; a failed write publishes nothing. `configs.discard` and `configs.delete_preset` carry destructive registry metadata; no feature defines a second error envelope.

**Frozen domain contract.** Draft/config/preset codecs preserve exact rubric_ref/profile version/digest/category signature and DomainEvidencePlan reference from the selected approved template. Quality presets bind that signature; changed family/version is an explicit new template/draft choice, never an automatic category-key remap. SetupFacts and SetupView carry M12 modality/coverage/default data and M03 domain-verification requirements separately. All weight validations pass rubric_ref; save/reset/reload preserves zero weights and complete category maps.

**Storage authority.** Reusable YAML configurations, presets and setup drafts remain M07-owned working state. Frozen launch/configuration/weight copies consumed as retained benchmark facts are normalized by M02. Revision copy/removal prepares durable files first and resolves visibility against the shared SQLite marker/receipt/outbox; no YAML rename independently publishes a transaction. Do not replace ordinary editable configuration state with result rows or add an old-install migration.

## States supplied to screens

| Exact board/state | Delivered behavior |
|---|---|
| Setup / SetupInvalid | Saved/dirty/never-saved choices, distinct entry rows, engine issues, disabled review and returned action states. |
| WeightsEditor / WeightsInvalid (M06) | Profile-scoped preset list, immutable defaults, typed save/delete errors. |
| TemplateConfigs (M01) | Revision-scoped saved summaries/counts from one publication view; approval/deletion changes appear atomically. |
| Parent states without separate boards | Loading, no entries, corrupt YAML, pin mismatch, external file change, unsaved-change confirmation and discarded draft. |

No Textual screen is implemented here; [M07.3](03-setup-review-screens.md) consumes these DTOs.

Extend `WeightChoice`, `ScoringPreset`, `configs.set_weights`/`save_preset` and YAML/JSON codecs with complete `RankingWeightsV2 {schema_version: 2, weights, directions}` plus selected `metric_policies`. Both maps have cost,time,quality,generation_rate,input_tokens,output_tokens,file_count,loc; preserve exact supplied decimal/rational strings through validation. Built-in ranking defaults keep the first three equal and all five extras zero, with null extra directions. Delegate finite/nonnegative/positive-total, fixed/required-direction and policy validation to M06. Explicit valid v1 three-key input normalizes in memory with retained original bytes/version/digest; incomplete v2 input is rejected, never filled. This import/read compatibility does not require migrating installed stores.

Add `ConfigEntry.model_variant_ref: ModelVariantRefV1 | None` and optional `variant_comparison: VariantComparisonSelectionV1` to saved draft/configuration schemas and `configs.add_entry/update_entry`; preserve these through save/reopen/copy and entry DTOs. Null means no registered descriptor with explicit Unknown evidence, never a fabricated base identity; malformed explicit refs fail by field. Variation mode/policy/allowed fields remain independent of the harness-comparison plan and cannot relax its controls. These are launch/configuration metadata, not template defining payloads or alternate ConfigurationIds.

**Route, comparison and profile interfaces.** Own `domain/comparisons.py`, `application/comparisons.py` and extensions to `config_yaml`/existing API DTOs. ConfigEntry and entry edits carry optional RoutedAccessSelectionV1, ExistingAgentSelectionV1 and effort Contract; selection field conflicts remain visible validation issues. `HarnessComparisonPlanV1` persists the ordered six-cell registry snapshot, selected flags, common exact upstream model/variant+EffortContract, per-harness binding/mapping/profile refs, common controls, positive trials, strict/exploratory policy and exclusions. `configs.comparison_create/update/preview/export` operate on the existing Setup draft/revision; create defaults to all six and strict jobs=1, update is atomic and explicit subset stays N/6. A common model-binding request identifies upstream semantics; each cell resolves its own harness-selectable binding, never reuses one alias across protocols blindly. `configs.existing_agent_select` accepts target competitor{configuration_id} or harness_judge{}, exact profile ref/treatment/override ref and expected draft revision. Planner profile selection stays M16-owned. No registration/selection/export implies qualification, fallback or a run.

**Cross-harness plan authoring — R192–R193.**

Implement the draft and expansion portions of [CROSS-HARNESS-COMPARISON.md](../CROSS-HARNESS-COMPARISON.md). Persist every registry cell and explicit selection/coverage mode, chosen immutable access/model/effort contracts and materialized configuration IDs. Saving an incomplete plan remains possible; launching requires M07.2 validation. Repeated expansion is idempotent for unchanged plan/cell identity, while explicit edits create a new reviewed version. Never silently remove unsupported cells or change benchmark identity. Keep credentials and live gateway secrets out of YAML, DTOs and digests.

`configs.comparison_export` belongs to this child: serialize the exact revision-checked draft through `config_yaml`, then use the engine-owned guarded atomic output sink and return path/content digest/readiness. `--output` never makes the CLI import an engine codec or mutate the saved source. Test existing/protected paths, stale drafts, incomplete structural exports and unchanged source/profile data.

**Existing agent selection — R194.**

Implement `configs.existing_agent_select` and persisted optional `existing_agent_selection` from [CROSS-HARNESS-COMPARISON.md](../CROSS-HARNESS-COMPARISON.md). Store profile ref, existing/clean treatment and explicit override set separately from the API route and model alias. Respect expected draft revisions, reuse the same entry identity on a repeated identical selection, and retain conflicts/unresolved inputs as editable state. Do not mutate source profiles. Preserve no-override ordinary inheritance without converting optional unknown settings into verified model support or defaults.

## Integrated requirements

R192, R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R191 — [authoritative SQLite results and analyses](../RESULTS-DATABASE.md).
R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R189 — [human review](../M12/05-human-review-web.md).

R184, R185, R186, R187, R188 — frozen domain profile/evidence contracts: [R184](../quality-judges/BACKEND.md); [R185](../quality-judges/MOBILE.md); [R186](../quality-judges/DEVOPS.md); [R187](../quality-judges/AGENTIC.md); [R188](../quality-judges/SPECIFICATION.md).

R175, R176 — [benchmark statistics](../BENCHMARK-STATISTICS.md).

R165, R167, R168 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

R177, R178, R179, R180, R181, R182, R183 — [benchmark modes](../BENCHMARK-MODES.md); [Cursor](../M05/08-cursor-adapter.md) and [OpenCode](../M05/09-opencode-adapter.md) registry contracts.

Structural YAML/ConfigEntry validation accepts all six shared HarnessId values, preserving repeated same-harness entries and unknown capability facts for M07.2 resolution. Consume the pinned M01 v1/v2 definition and expose mode/project/target/legacy facts through SetupView; no editable configuration field redefines task order, baseline or mandatory protocol. Extend save/copy/reopen fixtures to one-shot and multi-step across seven project types, Cursor/OpenCode entries and explicit saved jobs=4/5; copying configs to an explicitly reviewed new revision changes the SHA pin and IDs only as the existing transaction requires.

**Human selection acceptance:** Save/reopen/copy an explicit Human choice independently from competitor and context selections; freeze reviewer/form-policy UUID/version/digests without model/account/effort/confidence fields. Human requires host/renderer support for the frozen evidence plan, never a context or grading model. Editing a reviewer profile affects only future selection and stales an affected preview; it cannot rewrite a launch. Reject branch-confused fields and preserve all six rubric families with unchanged harness defaults.

## Acceptance and faults

**Route/profile acceptance:** Create six cells and three trials with six stable ConfigurationIds/18 expected TrialRefs at freeze, not six extra harnesses. Round-trip native/existing/routed selections and full blocked/not_selected rows in credential-free YAML; repeated same edit is idempotent, stale revisions publish nothing. Explicit subsets and saved jobs differ only through reviewed updates; strict jobs other than 1 blocks, exploratory discloses concurrency. Export cannot overwrite/protect-bypass or mark unready rows ready.

**SQLite acceptance:** Race file persistence and SQLite publication with pinned library/configuration readers; no partial approval or guessed staged configuration appears. Later preset/YAML edits do not change frozen SQLite launch weights or saved analysis digests.

**Variant acceptance:** Round-trip absent identity, complete/partial refs, same-label different variants, repeated equal variants with distinct entry IDs and quant/fine-tune package selections. Invalid explicit refs/allowlists reject atomically; copy/save neither edits approved template bytes nor borrows ancestor pricing. Existing archived bytes remain unchanged.

**Domain acceptance:** Save/reload six-family drafts and presets, reject cross-signature reuse and incompatible profile substitutions, and verify changed approved native matrix/agent authority/brief bindings cannot reuse a stale launch preview.

Extend preset/draft/YAML and both-client tests for all eight keys and directions, exact large fractions, independent six-category quality weights, v1 provenance, missing/extra v2 keys, all-zero/negative/nonfinite values and positive factor without direction. Save/reopen/copy/export preserves policy/version/digest and does not mutate frozen launch originals; invalid maps publish no write/event.

Round-trip all three grading selections with capture on/off and independently selected/absent context profile; reject schema-confused branch fields, preserve immutable refs and profile edits. Existing archival fixtures remain byte-preserved, without an old-install migration/backfill feature.

Run the proposed suite:

```sh
pytest tests/configs/test_config_yaml.py tests/configs/test_drafts.py tests/configs/test_presets.py tests/configs/test_revision_transactions.py tests/configs/test_draft_api.py tests/configs/test_draft_events.py
```

1. Save independent setups for two revisions, including an imported revision with destination-local selections. Edit/duplicate one; assert template payload/hash, other setup and historical records remain byte-identical.
2. Edit entries/judge/weights/execution, restart with fresh stores over the same directory, and reopen the same draft. Save clears dirty state; discard survives restart; interrupted temp-file write preserves the last complete draft and emits no success.
3. Inject malformed/foreign YAML, missing draft/preset, duplicate name, changed base digest and rejected owner validation. Assert the exact typed code/field/remedy, unchanged durable state and preserved editable input.
4. Save profile-valid presets; reject negative/nonfinite/all-zero/unknown-category values using M06 fixtures. Refuse built-in mutation/deletion; deleting a referenced user preset leaves an explicit unresolved issue, never replacement weights.
5. Prepare copies/removals and interrupt after each durable step, before/after the shared marker. Cross-store reads see entirely old or entirely new state; pinned old views remain readable; rollback cannot remove pre-existing or another transaction's records.
6. Race save/delete and duplicate/approval under reservations; retry preparation/cleanup. Verify exact counts/IDs, destination pins, no staged rows by guessed ID, and recovery-before-reader behavior when rollback fails.
7. Through both real clients verify DTO/error/safety round trips. Inject updates during snapshot handoff, discard tombstones, old revisions, new epoch and overflow; no lost edit or resurrected draft. Scrub synthetic upstream diagnostic secrets from YAML/errors/events/logs.

## Real integration gate

Compose real M01 approval/deletion with this store and M16's transaction-aware draft approval marker. Inject failure at each participant boundary and verify library counts/config lists/draft state in one read view. Connect real M06 validation/preset callers and reopen persisted drafts through M07.3 after an engine restart.

**Pending parent obligations:** M07.2 owner-backed readiness, judge/preselection and immutable launch resolution; M07.3 wide/compact flows; M01/M16 real approval/deletion recovery; M14 CLI parity. Faked revision/fact providers and persistence tests do not establish runnable launches.
