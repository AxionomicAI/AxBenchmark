# M16.4 — planner-screens

Parent: [M16 planner screens](../../16-custom-template-planning.md#4-screens). Requirements: R030, R031, R046, R054, R068, R137, R140, R149, R150. Findings: F05; shared F04/F15.

Outcome: select a confirmed planner, obtain actual verification consent, follow durable progress and reopen failed/interrupted work without repeated calls.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M16.2](02-planning-jobs.md), [M15.1](../M15/01-tui-foundation.md) and [M15.2](../M15/02-tui-shell.md). M16.2 includes API/job foundations and readiness/catalog services.

**Bootstrap-published contracts, allowed as injected fixtures:** M16.3 unfinished/draft records, M01 entry/reopen screen factories and M16.5 PlanReview destination. Use real providers before parent acceptance, without cyclic screen entry dependencies.

Reuse shared EngineClient, cursor manager, widgets, worker generation tokens and ConfirmScreen. No engine imports, private file reads, custom transport or replacement job manager.

## Exact proposed ownership

- PlannerScreen, PlanningScreen and PlanningFailedScreen sections of `axbenchmark/tui/screens/planning.py` only.
- PlannerVM/SessionVM and builders in `axbenchmark/tui/viewmodels/planning.py`; planner/progress/failure selectors in `axbenchmark/tui/styles/planning.tcss`.
- Their factory registrations through `axbenchmark/tui/screen_registry.py` M15 hook, coordinated with M16.5; no shell implementation edits.
- `tests/tui/test_planner_selection.py`, `test_planner_consent.py`, `test_planning_progress.py`, `test_planning_failure.py`, `test_planning_reconnect.py`.
- Planner/Session builder cases in `tests/tui/test_planning_viewmodels.py`; `tests/tui/fixtures/planning/planner/` named board and loading/error fixtures.
- `tests/integration/test_planner_screen_flow.py` with actual client/registry and temporary persisted owner state.

M01 owns NewTemplateScreen and Library draft rows; M03 owns consent plan/verification outcomes; M15 owns ConfirmScreen. This child wires those interfaces, not duplicate screens.

## Exact board/state matrix

| Board | Screen and required state |
|---|---|
| PlannerPicker | Prior valid/invalid choice, fixed-order candidates, context/default evidence, explicit model/effort and can_start. |
| PlannerUnknownModel | Empty model, Pick a model, disabled Start with engine reason; no invented default. |
| PlannerNoUsable | No selected planner, unusable/undetermined reasons, disabled fields/Start and can_verify. |
| PlannerVerify | Shared ConfirmScreen with M03 target names/versions and exact consent note; decline/escape calls nothing. |
| PlanningProgress | Capture/plan/check/open steps, source/exclusion data, determinate/indeterminate progress, Hide and explicit Cancel. |
| PlanningFailed | Engine cause, failed step, retry/switch/discard capabilities and available invocation log. |
| PlanningInterrupted | Same failed screen reopened after engine loss, retained snapshot and explicit retry; no silent restart. |

All named boards have loading/error/capability states at 120×40 and 80×24 tests even where the prototype declares only wide. NewTemplate/NewTemplateRepo/Invalid and LibraryDrafts are M01 host integration states.

## API actions and consent

Load planning.planner_options(request_id), keeping harness/target/account context. Harness changes reload context options; model/effort changes query with selection=shown fields so engine can_start updates without replacing input. Reject stale validation replies; command validation remains authoritative.

Start sends exactly planning.start(request_id, selection); retry selection sends planning.retry(session_id, selection). Return JobRef; never assume JobId equals SessionId.

For a newly returned job, open progress with job id and discover session_id from typed progress or the planning snapshot's job binding. Reopened progress starts with session_id and reads planning.session.

Verify now first calls environment.verification_plan(undetermined). Render its target/version lines and note verbatim through ConfirmScreen; only True sends environment.verify(consent=true, harnesses=plan targets).

Follow the verification job and environment changes; refresh candidates from engine data. Readiness never becomes usable merely because a job finished—individual outcomes remain distinct and may stay unknown.

Verification diagnostics retain M03 JobId and M05 VerificationScope/InvocationId. Planning uses PlanningScope; do not invent a benchmark run/trial or charge diagnostics as competitor work.

Failure retry calls planning.retry; choosing another planner opens PlannerScreen with session context. Discard opens shared confirmation using the engine effect; only confirmation issues planning.discard.

Open log uses the actual last attempt InvocationId and harness.invocation.log with invocation-local pagination. Missing invocation/log yields explicit unavailable state; log seq is not EventCursor.seq.

## Progress, reconnect and state preservation

Subscribe through M15 to planning plus job:<job_id>, with full EventCursor(epoch, seq); verification uses environment plus its own job:<job_id>. Never subscribe to bare job or event-name wildcard topics.

Use M11 snapshots/replay, revisioned upserts/tombstones and replacement generations. Topic switches start a fresh handoff; stale epoch/load responses cannot replace a new session or candidate context.

Render terminal JobStatus from either initial snapshot or event, using typed result/error. Durable session state recovers completion/failure after missed events or expired job cache; navigate once per session/draft outcome.

Hide, escape, unmount and disconnect only release client subscriptions. Cancel explicitly calls jobs.cancel, stays pending through cleanup, then renders the terminal owner failure/cancel outcome.

Preserve focus/selected planner/scroll through resize and reload where compatible with engine choices. No screen reselects fallback order, creates a model default or starts a job during reattach.

## Acceptance and faults

```sh
pytest tests/tui/test_planner_selection.py tests/tui/test_planner_consent.py tests/tui/test_planning_progress.py tests/tui/test_planning_failure.py tests/tui/test_planning_reconnect.py tests/tui/test_planning_viewmodels.py tests/integration/test_planner_screen_flow.py
```

1. Pilot every matrix state at both sizes; keyboard/palette/click Start invokes once. Disabled unknown/unconfirmed choices submit zero calls and keep engine reasons visible.
2. Assert exact verification-plan text/targets, decline/escape zero verify calls, acceptance exactly one; mixed diagnostic outcomes refresh without assuming success.
3. Follow newly started job before a session id arrives, complete before subscription, fail before first render and reopen from Library; each reaches one correct destination from snapshots.
4. Interleave updates between snapshots, replay older revisions, restart with lower seq, overflow/compact and change jobs mid-load. No lost terminal state, duplicate navigation or repeated model call.
5. Hide/detach preserves live invocation; Cancel awaits durable outcome. Retry reuses pin/snapshot, interrupted reopening invokes nothing and discard cancellation preserves records.
6. Failure log pagination passes InvocationId/after_seq only; diagnostics and planning never call run-scoped log APIs. Check all requests/topics against the actual registry.

## Real gate and pending parent work

Run M01 entry/library → real planning/verification services → this UI → M16.5 review through M11 socket clients. Verify M14 consent parity, actual M05 cleanup and unchanged source repository.

**Pending parent obligations:** review/edit/approval UI, canonical/transaction gates, full supported-harness/platform journeys, approved-template reuse and prototype/ledger parity with the named states.
