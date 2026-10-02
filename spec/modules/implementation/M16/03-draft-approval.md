# M16.3 — draft-approval

Parent: [M16 draft domain and services](../../16-custom-template-planning.md#1-engine-component). Requirements: R030, R031, R068, R085, R118–R120, R136, R140, R149. Findings: F01, F10; shared F11/F14/F15.

Outcome: persistent editable drafts become approved revisions only through validated canonical conversion and one transaction publication boundary.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M16.2](02-planning-jobs.md), M01.1–3, [M08.1](../M08/01-verification-runtime.md) CheckFormat and [M12.1](../M12/01-review-contract.md) RubricSource/profile validators. Their real domain validators suffice; full verification/judging workers are not entry dependencies.

**Bootstrap-published contracts, allowed as injected fixtures:** M07 RevisionConfigs prepared copy operations, M09 canonical-equivalence fixtures, M17 canonical import/export and M05/M08 restored workspaces. Complete those providers for the real parent gates.

Use M01 PublicationTransactions/read views/tokens; no separate local commit flag may expose approved draft state before the revision/configuration transaction.

## Exact proposed ownership

- `axbenchmark/engine/planning/domain/drafts.py`, `edits.py`, `draft_validation.py`, `definition_input.py`, `unfinished.py` and draft errors.
- `axbenchmark/engine/planning/application/draft_queries.py`, `edit_draft.py`, `discard.py`, `to_frozen.py`, `approval.py`, `draft_store.py`, `planner_record.py`.
- `axbenchmark/engine/planning/adapters/json_drafts.py`, `draft_transactions.py`; approved-provenance section of `yaml_preferences.py`.
- DraftStore/PlannerRecord/draft-sink declarations in `application/interfaces.py` and `ports.py`; draft RPC/DTO sections in `adapters/rpc.py` and `api/planning.py`.
- `tests/engine/planning/test_draft_edits.py`, `test_draft_reopen.py`, `test_canonical_conversion.py`, `test_draft_approval.py`, `test_draft_transactions.py`.
- `tests/api/test_planning_drafts.py`, `tests/integration/test_planning_approval_publication.py`, `test_planning_canonical_roundtrip.py` and `tests/fixtures/planning/canonical/`.

M01 owns revision/duplicate command coordination and RevisionRegistry; M07 owns config copies; M16 supplies the draft participant. This child may not edit their stores or publish their local indexes directly.

## Draft and canonical contracts

Persist generated/current text, name, services, checks, dependencies/protocol, rubric/baseline refs, source origin, planner selection, last_task_id, version and regeneration status. Atomic edits retain the generated text and increment version.

Implement all parent DraftEdit variants, SetName with M01 validation, service field validation and conflict errors. Reopen planned drafts at review with selected task; revision/duplicate drafts at the saved task editor. Approved drafts are read-only and excluded from unfinished rows.

Checks preserve the full M08 requirement/phase/observation/failure-rule contract and declared support closure; incomplete edit rows remain explicit approval issues. Validate M12 rubric profile/applicability and web screenshot-inspection requirement from M12 requirement_for(rubric) and M08 final-regression capture declarations, never supply silent defaults.

`definition_input` is pure; application `to_frozen` calls M01 DefinitionCodec.write(input, files) for the complete axbenchmark-definition/1 descriptor. Read it back through the same codec; no independent definition accompanies FrozenDraft.

Required metadata covers specification, ordered task/prompt/check ids, suite and support files, execution protocol, services, dependencies, rubric path/profile and baseline. Empty baseline is explicit; repository entries each carry baseline/ path plus executable bool.

Use exact defining bytes; include supplied support fixtures/helpers. Exclude plan.json, generated/current edit history, display name/task titles, source path/commit/time, planner selection, costs and saved configurations from the payload.

Return FrozenDraft(display: DisplayMetadata, payload: CanonicalPayload); M01 computes manifest/digest. Renaming name/title alone changes display metadata, not identity; task order, defining text/protocol/rubric/checks and executable flag do change it.

## Approval and publication

PreviewApproval returns version, digest, issues/check flags and verdict. Command receives base_version, inspects the same version under the shared mutation lock and rechecks completeness/identity before publication; duplicate identity is blocked, including a display-only rename.

DraftStore exports seed/inspect/prepare_approved(tx, draft_id, version, sha)/commit_view(tx)/rollback(tx, token) exactly as M01 consumes. `inspect(draft_id) -> DraftApprovalInput(version, frozen: FrozenDraft)` captures the approval input atomically; seed preserves source definition/baseline for revision/duplicate editing.

prepare_approved stages expected version, approved marker and approved planner provenance together, returning a token. commit_view is durable readiness only. All reads—including PlannerRecord and unfinished—resolve the captured PublicationView.

M16 coordinates planned approval through public RevisionRegistry/DraftStore/PublicationTransactions: prepare revision/lineage plus this participant, acknowledge both and publish one marker. No private adapter/store access or independent commit is allowed. M01's revision/duplicate coordinator additionally prepares M07 copies only after the user's copy choice.

Copied configurations get new IDs and new SHA pin through M07; source configurations/results remain untouched. No participant emits an approval/config/revision event during prepare or commit_view.

Before-marker failure rolls back only token-owned changes; pre-existing same-content storage is never deleted. After-marker failure rolls forward cleanup/outbox and returns/reconciles the same committed identity on response loss.

A journal retains transaction/draft/version/SHA and cleanup state. Recovery completes rollback or roll-forward before readers enter; unresolved rollback stays hidden with an actionable error, never half approval.

Discard refuses running work/approved drafts; confirmed discard removes only M16-owned unfinished state. PlannerRecord returns the explicit selection only for published planned provenance; drafts/imports without that record return None.

## Board/data boundary

Serve PlanReview/Reopened/Services/Edit/ServiceEdit/Regenerate/Approve/ApproveIdentical and M01 LibraryDrafts/Revise flows. GetDraftTask returns task id, same-task checks and engine snapshot_label; T4 maps to after T4 in both review states.

## Acceptance and faults

```sh
pytest tests/engine/planning/test_draft_edits.py tests/engine/planning/test_draft_reopen.py tests/engine/planning/test_canonical_conversion.py tests/engine/planning/test_draft_approval.py tests/engine/planning/test_draft_transactions.py tests/api/test_planning_drafts.py tests/integration/test_planning_approval_publication.py tests/integration/test_planning_canonical_roundtrip.py
```

1. Persist/restart/edit/reset/conflict/reopen/discard planned/revision/duplicate drafts; five and seven tasks are valid. Preserve saved task, generated text and regeneration-outside-scope edits.
2. Reject each missing descriptor part, orphan/support/check/rubric mismatch, invalid service field and stale approval version. Block identical content; explicit approval alone registers.
3. Equal M09/M16/M17 definition fixtures produce identical full canonical bytes/manifests/digest. Rename/source metadata is stable; task order/protocol/executable changes differ.
4. Fault every prepare/acknowledge/marker/outbox boundary with concurrent library/config/draft/planner readers. Before marker see old state; after marker see complete approval and optional copies, with no partial visibility.
5. Crash/retry response loss before/after publication; old revision/results/configs stay intact, no duplicate copy or approval event, and planner preselection provenance remains available.
6. M01 revise/duplicate uses real DraftStore, explicit copy choice and M07 provider; stale regeneration/edits cannot race approval into a different digest.

## Real gate and pending parent work

Require real M01/M07/M16 transaction participants and M09/M17 canonical round trip, plus M05/M08 executable restoration from approved/imported flags. Launch saved templates through M07/M11 and assert zero planner calls.

**Pending parent obligations:** M16.4–5 UI, real supported-harness generation, M10 cost presentation, consent/reconnect journeys, cross-platform source preservation and all project-type end-to-end execution/verification.
