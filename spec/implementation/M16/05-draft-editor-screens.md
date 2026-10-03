# M16.5 — draft-editor-screens

Parent: [M16 review and editor screens](../reference/modules/16-custom-template-planning.md#4-screens). Requirements: R030, R031, R068, R118–R120, R136, R140, R149, R150. Findings: F17 selected-task correction; shared F01/F04/F05/F10/F14.

Outcome: review and edit saved drafts, preview scoped regeneration and approve exact reviewed content, with consistent selected-task details before and after reopening.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M16.3](03-draft-approval.md), M15.1–2 and inherited real client/job foundations. M16.4 planner screens are an injected navigation provider and later real integration gate for optional generation, not a prerequisite for manual review/edit/approval.

**Bootstrap-published contracts, allowed as injected fixtures:** M01 revise/duplicate/approved-template factories, M10 invocation accounting and M07 configuration-copy/judge-preselection views. Their real integration remains a parent gate.

Use shared screen loading/error widgets, typed subscription manager and scope/version load tokens. Screens render engine rules, never compute identity, canonical bytes, check validity or regeneration effects.

## Exact proposed ownership

- ManualCaptureScreen, ManualCaptureFailedScreen, PlanReviewScreen, TaskEditorScreen, ServiceEditScreen, RegenerateScreen and ApproveDraftScreen sections of `axbenchmark/tui/screens/planning.py`.
- DraftVM/TaskEditorVM/ServiceEditVM/RegenerateVM/ApproveVM and builders in `axbenchmark/tui/viewmodels/planning.py`.
- Review/editor selectors in `axbenchmark/tui/styles/planning.tcss`; corresponding factory registrations through M15's screen registry hook.
- `tests/tui/test_draft_review.py`, `test_task_editor.py`, `test_service_editor.py`, `test_regenerate_dialog.py`, `test_draft_approve.py`, `test_draft_selected_task.py`.
- Draft builder cases in `tests/tui/test_planning_viewmodels.py`; `tests/tui/fixtures/planning/drafts/` all named and fault variants.
- `tests/integration/test_draft_editor_journey.py`, `test_revision_editor_journey.py` for actual service/client/state integration.

M16.4 retains planner/progress/failure portions of shared files. M01 owns NewTemplate, Library rows, ApproveRevision and TemplateScreen; M15 owns shared confirmation/focus behavior.

## Exact board/state matrix

| Board | Screen and required state |
|---|---|
| PlanReview | Four tabs, editable name, generated/edited rows, selected task/checks, planner cost separate from benchmark. |
| PlanReopened | Same mapping/state as review, persisted name/edits and last_task_id from the last task edit; draft survives exit. |
| PlanServices | Setup/start/ready/stop/test rows, dependencies/protocol and service edit route. |
| PlanServiceEdit | Command/cwd/port/readiness fields, engine field errors, save/conflict/cancel. |
| PlanEdit | Title/prompt, generated/current diff, complete check-edit route, reset/undo and scoped regeneration. |
| PlanRegenerate | Scope/guidance and engine-kept/replaced edits; generation never approves content. |
| PlanApprove | Preview version/full SHA/notes/issues/check flags and explicit Approve/Back. |
| PlanApproveIdentical | Identical to label, disabled approval and Open existing; unfinished draft preserved. |

PlanReview has wide/compact prototype variants; test every screen/state at 120×40 and 80×24, including compact error/full-digest display. M01 Revise/ReviseActiveRun/ReviseConfirm/ReviseIdentical/RevisionSaved are host flows, not new owned screens.

**Frozen domain contract.** DraftVM/ApproveVM render exact family/version/digest, six category labels, comment meanings and derived DomainEvidencePlan/coverage issues from DraftDetail/ApprovePreview. Edit the existing rubric/check/support files through versioned DraftEdit; present backend features, native matrix/lifecycle, DevOps target/mode/authority, agent case/budget/effect boundaries and supplied-brief/reference precedence without creating a client-only plan. Empty services can be valid for specification documents; no always-code/build/server assumption blocks approval.

## Selected-task and edit contracts

Load planning.draft and choose persisted last_task_id if valid, else first task. One selected_task_id drives the highlighted row, detail query, check list, snapshot label, edit and regeneration actions.

planning.draft_task returns task_id, checks and snapshot_label together. In the fixture selected T4 renders T4 checks and “after T4” snapshot wording; never hard-code “T3”. PlanReview and PlanReopened use the same builder.

Check the response task/draft/version/load token before applying it. Delayed T3 response cannot overwrite current T4 detail, label or checks; refresh/resize keeps the selected task and scroll/focus.

Debounce name/title/prompt edits 500 ms with base_version; serialize local pending edits and wait for their acknowledgement before Done, regeneration preview or approval preview. Conflict reloads current data with notice, never silently overwrites.

Task reset/undo sends ordinary versioned edits; AddCheck/UpdateCheck retain full M08 fields and show incomplete rows as issues. RemoveCheck names the selected check. Specification editing uses exact-byte shared/primary-file edits and AddSpec/ReplaceSpec/ReorderSpecs/RemoveSpec for v2; SetSpecification remains only for the preserved v1 shape. All edits share the debounce/conflict contract.

Service save issues exactly one SetService with command/cwd/port/readiness; invalid fields show engine messages beside each control. Escape/cancel does not apply unsaved service changes. Edit capabilities come from DTOs.

After approval, display-name changes route to M01 templates.rename. Revising/duplicating approved work uses the seeded draft and returns to M01 ApproveRevision; the original remains unchanged.

## Regeneration, approval and subscriptions

Query regenerate_preview when scope changes, not while typing guidance. Show exact kept/replaced edits and planner; submit regenerate with base_version, then follow its job:<job_id> through the shared manager.

Subscribe to planning for versioned draft changes, measurements for matching InvocationId cost records, and only the exact regeneration job topic. All use EventCursor and fresh handoff on topic changes; no bare job/private log subscription.

Owner draft regeneration state recovers after job-cache expiry/resync. Failure/cancel/conflict preserves previous draft; success reloads new version while keeping unaffected selection/focus. No terminal replay repeats regeneration or navigation.

Approval preview returns version and full SHA. Explicit Approve passes that base_version; stale version, duplicate identity and transaction errors stay in the dialog. Success navigation follows committed outcome only, never a prepare event.

Identical approval stays disabled with templates.identical_revision; Open existing leaves the draft unfinished. Back/escape sends no approve command. Generation or closing an editor never implies approval.

M16.3 publishes revision/draft/provenance together; M01 revision approval additionally publishes requested config copies. Reconnect sees either old open draft or whole approved state, not an intermediate screen success.

## Integrated requirements

R184, R185, R186, R187, R188 — frozen domain profile/evidence contracts: [R184](../quality-judges/BACKEND.md); [R185](../quality-judges/MOBILE.md); [R186](../quality-judges/DEVOPS.md); [R187](../quality-judges/AGENTIC.md); [R188](../quality-judges/SPECIFICATION.md).

R177, R178, R179, R180, R183 — [benchmark modes](../BENCHMARK-MODES.md).

Own manual capture/failure progress from `planning.operation` plus `job:<id>`, with import/capture/validate/persist labels, no planner cost/log and no planner-picker redirect. Hide only unsubscribes; cancel waits the durable owner result. Shared review handles manual/planned/revision origins, benchmark/project/derived target mode, exact prompt or numbered ordered primary files, original/generated byte provenance, baseline exclusions and capture version. One-shot has exactly T1; supplied multi-step has >=2 files. Reorder/removal/type changes are explicit versioned edits, and no rendering normalizes bytes.

Show locked “Every task must commit” policy/instruction/version/check digest separate from input text; missing protocol closure, sourceChanged, active recapture and stale preview block approval. `planning.recapture` uses base_version and reviewed inspection; preserve prior complete baseline on failure. Manual drafts have no regeneration/reset-to-generated action unless actual generated provenance exists. Add wide/compact no-harness/Git manual create→capture→edit→approve tests, CRLF byte preservation, invalid counts, seven domains, stale recapture, empty behavioral suite and no implicit planner/commit/repair calls.

## Acceptance and faults

**Domain acceptance:** Add all-six-family PlanReview/Services/Edit/Approve cases at both sizes; incomplete evidence scope stays an engine field issue, and saved profile edits invalidate approval version. Native matrix or brief changes never silently waive requirements or call a model.

```sh
pytest tests/tui/test_draft_review.py tests/tui/test_task_editor.py tests/tui/test_service_editor.py tests/tui/test_regenerate_dialog.py tests/tui/test_draft_approve.py tests/tui/test_draft_selected_task.py tests/tui/test_planning_viewmodels.py tests/integration/test_draft_editor_journey.py tests/integration/test_revision_editor_journey.py
```

1. Pilot matrix at both sizes via keyboard/mouse; preserve tab, task, focus, scroll and pending acknowledged edits across resize/reopen (T4 is the last edited task in persisted fixtures). Review/Reopened T4 fixture shows only T4 checks and T4 label.
2. Delay T3 response across selection/version/epoch change; prove it cannot replace T4. Compact hides summary only, not the selected task or validation errors.
3. Name/spec/task debounce, check mutations, reset/undo and service save issue exact versioned commands; conflicts/invalid fields preserve engine state and show precise errors.
4. Regeneration preview/submit respects scope; cancellation/failure/reconnect leaves edits outside scope and previous draft intact, with no repeated job or planner call.
5. Explicit approval passes preview version, full SHA is readable, duplicate/blocked/racing edit cannot approve and Back/Open existing behave exactly once.
6. Actual publication fault/recovery keeps old-open or complete-approved state; M01 revision/duplicate flow preserves original results/configs and copies only after explicit choice.

## Real gate and pending parent work

Require real M01/M07/M16 approval and M10 cost providers plus M11 cursor/socket behavior. Complete author → edit/regenerate → approve → saved reuse with zero planner calls on later runs, then M05/M08 execution and M17 canonical/executable round trip.

**Pending parent obligations:** real supported platforms/harnesses, all project/baseline combinations and M15/M14 journeys. F17 prototype source must derive snapshot label from selected task and regenerate PlanReview/PlanReopened previews in a separate wireframe change; no prototype files are edited here.
