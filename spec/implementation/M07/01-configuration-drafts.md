# M07.1 — configuration-drafts

Parent: [M07 reusable configuration](../reference/modules/07-run-configuration.md#1-engine-component). Requirements: R009, R017, R019, R032, R033, R066, R067, R136, R145. Findings: F14 atomic approval/deletion, F15 foundations, F18 error envelope.

Outcome: revision-scoped YAML configurations, restart-safe setup drafts and reusable weight presets, exposed through the real client without starting a harness. This is proposed implementation work, not a completion claim.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M01.1 identity](../M01/01-canonical-definition.md), M11.1 `engine-client-api` and M11.2 `events-jobs-lifecycle` from the [foundation contract](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries). Shared publication views/transactions, typed IDs, registry, clients, errors and event revision rules must be executable.

**Bootstrap-published contracts, allowed as injected fixtures:** M01 `RevisionReader` and approval/deletion coordinator; M03 `AssessOperation`; M04 `CatalogSelections`/`CatalogOptions`; M05 policy vocabulary; M06 `WeightValidation.validate(profile_id, quality, ranking)`; M10 accounting, M11 scheduling, M12 profiles and `JudgeRequirements.check(template: Sha256, judge: JudgeSelection) -> JudgeCheck`/`session_count(configurations, trials)`, M16 planner and M18 monitoring inputs. Their complete implementations are not prerequisites. M07.2 replaces fact-source fakes.

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

## States supplied to screens

| Exact board/state | Delivered behavior |
|---|---|
| Setup / SetupInvalid | Saved/dirty/never-saved choices, distinct entry rows, engine issues, disabled review and returned action states. |
| WeightsEditor / WeightsInvalid (M06) | Profile-scoped preset list, immutable defaults, typed save/delete errors. |
| TemplateConfigs (M01) | Revision-scoped saved summaries/counts from one publication view; approval/deletion changes appear atomically. |
| Parent states without separate boards | Loading, no entries, corrupt YAML, pin mismatch, external file change, unsaved-change confirmation and discarded draft. |

No Textual screen is implemented here; [M07.3](03-setup-review-screens.md) consumes these DTOs.

## Acceptance and faults

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
