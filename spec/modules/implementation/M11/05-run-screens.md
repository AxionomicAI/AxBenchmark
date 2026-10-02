# M11.5 — run-screens

Parent: [M11 screens](../../11-run-orchestration.md#4-screens). Requirements: R034, R044–R047, R049–R052, R060, R139, R150, R153, R154. Findings: F02, F04, F06, F09, F13, F15, F18.

Outcome: passive run/live observation, explicit scoped stop, safe detach/reattach and frozen-input explanations through the shared client and TUI infrastructure.

## Entry conditions

**Completed prerequisites:** Bootstrap, [M11.4](04-stop-recovery-invalidation.md), M05 observation/query service, M15.1 widgets/bases (including its presentation-only RunListDetail component/VM) and M15.2 shell/SubscriptionHub. M15.3 is later cross-module integration, not a prerequisite. M11.1–2 clients/bus are real in integration tests.

**Published consumer contracts injected during screen tests:** M12 JudgingScreen routing, M13 report disposition/open actions, M14 command presentation and M01 Library navigation. Their real navigation/report/CLI gates remain parent obligations, not duplicate implementations here.

## Exact proposed ownership

- `axbenchmark/tui/screens/run.py`: RunScreen, DetachScreen, StopScreen, StoppingScreen and LockedScreen.
- `axbenchmark/tui/screens/live.py`: HarnessLiveScreen.
- `axbenchmark/tui/viewmodels/run.py`, `live.py`, `stop.py`: pure builders/reducers and local presentation state.
- `axbenchmark/tui/styles/run.tcss`, `live.tcss`; consume M15.1’s `tui/widgets/run_list_detail.py` and `tui/viewmodels/run_list_detail.py` plus shared theme/widgets; neither component file is owned here.
- `tests/tui/test_run_screen.py`, `test_run_compact.py`, `test_live_screen.py`, `test_stop_detach.py`, `test_run_resync.py`.
- `tests/tui/viewmodels/test_run.py`, `test_live.py`, `test_stop.py`.
- `tests/integration/test_run_client_screens.py`; `tests/fixtures/tui/run_states.py`, `live_states.py`, `stop_states.py`.

M05 owns RunConfigScreen, M08 VerifyProgressScreen, M12 judging screens and M15 shell/navigation/palette. Add route registrations only where M15's published extension seam requires them.

## Board-to-state ledger

| Existing board | Implementation/state contract |
|---|---|
| RunOverview | RunScreen four harness lanes, #run-bar, #frozen, #events; loading/error/unselected lane and server capabilities. |
| RunQueued, RunSequential | Same screen, queued entries/jobs=1 DTO variants; no client scheduler or separate command. |
| RunFailures | Actual task/check/halt statuses; effective identity interruption carries both digests and paths without hiding original facts. |
| RunReattached | Snapshot plus observation gap; no restart, finalizing/retention/error/report outcome available immediately. |
| RunListDetail | Consume M15.1 presentation-only RunListDetailVM/widget: #lane-list plus detail, #log and #log-search; no lanes table. M11 maps data/handles messages; M15.3 only later integrates/tests it. |
| HarnessLive, HarnessLiveStreaming, HarnessLiveLimited | Active TrialRef task/output/context/reasoning/files; streaming/final diff, unavailable/unverified observations and no-active-task states. |
| RunDetach | Modal with display label and unambiguous UID attach/status commands; detach closes subscriptions only. |
| StopConfirm | Run/configuration preview, cleanup/outcome and server gate; run-level judging/finalizing enabled while completed configuration disabled. |
| StopCleanup | Persisted stop receipt/progress; cleanup completed separate from pending/error retention and report disposition. Hide leaves engine work running. |
| ActiveLocked | Render engine restriction rows; frozen edit key opens explanation, never mutates a run. |

Pending wireframe variants: RunOverview/RunReattached finalizing/retention-pending/report outcomes; StopConfirm judging/finalizing scope; StopCleanup retention error; HarnessLive/RunListDetail explicit trial identity and historical selection. Keep existing names/layout. This child specifies the changes but does not edit boards.

## Data, navigation and command boundaries

Construct RunScreen with RunUid (RunLabel is display only). Subscribe through SubscriptionHub to `run:<run_uid>`; snapshot initializes status, then load run log. Compact highlighted configuration also subscribes to its keyed topic.

Map RunVM to RunListDetailVM (stable row keys/labels/status, selected key, explicit scope, detail/log state); handle Selected(key), Search(text), Page(after_seq), Action(name). M15.1’s widget imports no M11 VM, issues no API calls and needs no M15.3 code.

M11 returns resolved current/last selected TrialRef in status. Opening M05 configuration or M08 verification passes that explicit trial; historical task/log/diff requests always use TrialRef or ResultId. An active live view may ask for active trial but binds subsequent requests to the returned scope.

On highlighted trial/task/file change cancel obsolete workers and discard stale responses by selection/generation/revision. Trial 2 activity must not rewrite trial 1's retained log, screenshots or checks.

Use typed EventCursor and M15's last-fully-applied cursor only. Snapshot/resync replaces projection and clears old revision/entry dedup state, including same-epoch overflow; ignore old-generation events. Newer object revisions/tombstones defeat delayed event/query data.

Subscription topics are exact keys, never event prefixes. Reducers consume registered names only. Logs deduplicate by stable entry ID/offset distinct from the subscription cursor. Event-only feature topics re-query on resync when used.

All bindings come from ActionState. `s` previews configuration stop, `S` run stop, `v` live view, enter opens explicit trial configuration, `d` detach, `e` restriction explanation. Clients never derive stop permission from a locally guessed state name.

StopScreen changing scope issues one read preview; confirm issues exactly one runs.stop and opens its StopReceipt. Command races are handled by typed error and refreshed preview. No dedicated subscription is needed for the confirming modal's revalidation.

StoppingScreen subscribes to the run and finds its receipt in the snapshot; an already completed snapshot resolves it without waiting for a missed event. Render cleanup and retention status separately; pending storage failure displays its remedy and settles waiting callers honestly.

Run stop during judging remains available through shared navigation; M12 retains its own judging-screen stop controls. Judging navigation reacts to snapshot state as well as judging.batch.started, deduplicated by batch ID.

RunStatus completion_report/retention and M13 reports.status(completion_run_uid=run_uid) settle report waits after reconnect/cache expiry. M11 maps M13 succeeded to written; failed/cancelled/skipped preserve reasons and retention/persistence pending stays a typed pending error. Success opens only the returned path; M13 owns report generation and external open/reveal commands.

Live view displays source/coverage and requested versus observed settings; unknown renders “? not reported”, unverified stays “? unverified”. No local cost/currency conversions, model invocation, stdin writes or execution edits.

Unmount/esc/detach sends only unsubscribe/close as applicable; none stops work. Detach/status command text uses UID so same-label imported runs cannot select another run. Render messages/field/remedy from EngineError without parsing prose.

## Acceptance and races

```sh
pytest tests/tui/test_run_screen.py tests/tui/test_run_compact.py tests/tui/test_live_screen.py tests/tui/test_stop_detach.py tests/tui/test_run_resync.py tests/tui/viewmodels/test_run.py tests/tui/viewmodels/test_live.py tests/tui/viewmodels/test_stop.py tests/integration/test_run_client_screens.py
```

1. Pilot every ledger board in wide/compact loading/empty/error/content states. Assert four wide lanes, compact list/detail without lanes table, task/trial labels and dimmed engine-supplied actions.
2. Select trial 1 while trial 2 is active; inspect T1 log/diff/check navigation, then rapidly switch selection. Late responses never cross scopes, and only matching TrialRef events reload historical views.
3. Compose compact RunScreen with the real M15.1 widget and fixture M15.2 shell while M15.3 is unavailable; Selected/Search/Page/Action route once through M11 and the widget issues no API calls.
4. Inject update between snapshots, stale revision, tombstone/recreate, lower-sequence restart and same-epoch overflow through the actual client/bus. Final UI projection equals newest snapshot/events with no duplicate log or wrong-generation update.
5. Stop during verification, finalization and judging from RunScreen; completed configuration gate is disabled but run gate enabled. Preview-to-confirm terminal race shows typed error; one confirm means one runs.stop.
6. Open StopCleanup after completion event was missed; snapshot resolves it. Hide modal while cleanup continues, then reattach to retention failure and assert it is not rendered as retained success.
7. Disconnect during work and during report completion/failure. Reattach without any launch/invoke calls; show original observation gap, immutable status, report path or explicit failure/skipped/pending reason.
8. Live limited fields have source labels, no invented zero/bar; every file/log query includes resolved TrialRef. Esc, detach, locked close and screen unmount never issue a mutation.
9. Same-label different-UID runs show origins/UIDs and route separately. Incompatible-version and application errors render the shared message/remedy unchanged; reducers run without Textual or filesystem access.

## Real integration and pending parent work

Compose actual M11 services/client subscriptions with M15 shell and M05 observation. Run repeated trials, detach/reattach, stop during real judging, invalidate after seal and recover pending retention. Exercise M14 CLI alongside the TUI: controls and waits must agree while either client disconnects.

**Pending parent obligations:** named wireframe variants; real M12/M13/M17 navigation/report/export gates; macOS/Linux cleanup/socket evidence and no execution dependence on either interface. Fake-client screenshots prove rendering only, not lifecycle correctness.
