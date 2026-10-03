# M15.2 — tui-shell

Parent: [M15 shell and subscription contract](../reference/modules/15-terminal-interface.md#1-engine-component). Requirements: R029, R038, R044, R046, R047, R049, R139, R150, R153. Findings: F04, F15, F18; shared F02/F06/F13.

Outcome: executable app connection, navigation and lossless UI state lifecycle with fixture screens, independently of the complete feature engine.

## Entry conditions

**Completed prerequisites:** [M15.1](01-tui-foundation.md), [M11.1](../M11/01-engine-client-api.md) and [M11.2](../M11/02-events-jobs-lifecycle.md). Require their DTO/error/registry and real socket subscription acceptance.

**Bootstrap contracts injected as fixtures:** templates.list, environment.recheck, runs projections, job/report owner recovery responses and all five view factories. No scheduler, harness, collector, planning/report engine or actual feature screen is needed. Real owner recovery is the M15.3 gate.

## Exact proposed ownership

- `axbenchmark/tui/shell/connection.py`, `subscriptions.py`, `projection.py`, `state.py`, `navigation.py`, `jobs.py`.
- `axbenchmark/tui/app.py`, `commands.py`, `__main__.py`; injectable factory contract in `tui/screen_registry.py` without production feature imports yet.
- `axbenchmark/tui/screens/help.py`, `viewmodels/help.py`; lifecycle additions to M15.1 `screens/base.py`/`ports.py` only.
- Shell/Help/CommandPalette sections of `tui/axbenchmark.tcss`; fixture-only view factories in `tui/testing/screens.py`.
- `tests/tui/test_connection.py`, `test_subscriptions.py`, `test_query_races.py`, `test_navigation.py`, `test_palette_help.py`, `test_job_watchers.py`, `test_shell_lifecycle.py`.
- `tests/integration/test_tui_shell_clients.py`; `tests/tui/fixtures/shell/` registered fixture services, screens and deterministic histories.

Do not implement another transport, registry, scheduler or feature screen. Navigator accepts a view-activation callback; shell imports no Textual screen/widget classes. The app holds modes/stacks and factories.

## Client, subscriptions and load generations

ConnectionSupervisor calls injected connect; production uses M11 connect(autostart=True), which performs hello. Use its typed incompatibility/transport errors and exact EngineClient Protocol. Reconnect backoff is 0.5 s doubling to 5 s; quit cancels it. Never retry a command/job because a connection changed.

Hub calls EngineClient.subscribe(topics, cursor: EventCursor | None) for each unchanged topic set. Each handle retains subscription_id, epoch+seq cursor, projection, revision/tombstone map and append-entry IDs. No shared bare sequence cursor across handles.

Consume M11's S-before-snapshot handoff: queue registration/capture of S precedes provider reads; install returned snapshots and cursor S before replaying all envelopes after S. A snapshot may already cover an event: apply only newer object revisions, but advance the cursor for every processed envelope.

Retain tombstones for the generation so older upserts cannot resurrect objects. Deduplicate append-only entries by stable IDs. Membership removal in runs/jobs is not deletion of the durable object. Global sequence gaps from topic filtering are valid.

Same-epoch covered replay retains projection/revisions. Snapshot/resync for epoch change, compaction, overflow, changed topics, lost state or invalid/future cursor replaces projection and dedup maps, including same-epoch cases. Install new subscription_id before its events; ignore late old-generation messages.

On a fresh epoch accept low seq values. Never use an object revision or the sequence at snapshot completion as resume cursor. Event-only topics invoke their declared query on load/resync; unknown names/routes fail contract validation.

Base screen load tokens bind mount generation, connection epoch/subscription generation, exact target/query arguments and incrementing request number. First establish subscription state, then fetch required projections. Scope change, unmount, disconnect or replacement invalidates prior tokens; reject stale success AND error responses despite late cancellation.

Revisioned query results use the same reducer as snapshots/events. For an event-only projection, a relevant event racing a query marks it dirty and requires a fresh read rather than installing an unversioned stale response.

Call-issuing actions dim while disconnected; navigation/help/quit stay available. Recovered capabilities come only from engine projections. Pending submit guards prevent duplicate gesture calls without inferring business rules.

## Shell, launcher and durable outcomes

AxBenchmarkApp injects client/state/hub/supervisor and screen factories. Modes library/environment/setup/run/results keep their stacks; F1/F2/F3/F4/F6, ?, ctrl+p, q and tab/reverse-tab match the parent. F5 remains screen-owned.

main(*, attach: RunUid | None) -> int matches M14's TuiLauncher keyword-only contract. M14 resolves RUN_REF before this entry; M15 never interprets labels. Query attached UID status once and open its factory, or show unknown/deleted UID on Library. A launch-provided UID never triggers another launch.

App subscribes runs/jobs first; active RunUid membership drives reconnect choices, with run_label+origin display and each engine can_attach. templates.list supplies default revision; request environment.recheck once per startup and watch its JobRef. Fixture services satisfy these calls in this child.

Retain previously observed/attached RunUids across active-list removal; reconnect/resync reads their run snapshots/status to recover missed offscreen terminal outcomes once.

Watch each started JobRef across navigation using job:<job_id> and jobs.get, since active jobs snapshots omit finished jobs. Inspect JobStatus.initial_progress before settling even an already-terminal launch snapshot: this immutable final-preparation LaunchStep survives finish/cache expiry/restart separately from latest progress. Display final totals and its optional warning once per job ID per app instance, with shown-job IDs outside the subscription dedup/revision maps. Recovery reopens no prelaunch confirmation and never repeats launch. Render each watched outcome once; jobs.unknown surfaces a typed result unless an owner recovery callback is registered.

Report recovery callback calls public reports.status; run watches use durable RunStatus.stops/retention/completion_report. Terminal success/failure/cancel/skip and typed pending error settle local waits; no dependence on seeing job.finished or reports.report.written live. This child uses fixtures for these owner contracts.

Separate can_stop_run from configuration can_stop; display supplied judging/finalizing/retention_pending run capability even when every configuration is completed. Never recompute state eligibility, cleanup targets or retention readiness in the shell.

q, terminal close, unmount and detach unsubscribe/close only. Explicit job cancel/stop stays in feature-owned handlers/confirmations. Watched outcomes cannot cause a repeated launch, cancel, stop or navigation after resync.

## Exact boards and states

| Board/state | Required shell behavior |
|---|---|
| HelpKeys | Five view rows, visible global keys/mouse/size rules; dimmed Run reason, Enter/navigation, Escape restores focus. |
| CommandPalette (M15) | M15 owns the shared board/behavior; features contribute entries/providers only. All footer actions, reconnect choices with UID/origin, disabled hits with reason; same callback/capability as keyboard/mouse. |
| WidgetStates (M15) / five fixture views | Shared board/widget infrastructure stays M15-owned; features contribute fixtures. Loading/empty/error/content/retry, preserved stacks and focus, connecting/reconnecting/incompatible, interrupted offscreen toast. |
| Subscription/job states | Replay/snapshot/resync, old generation, lower-seq epoch, terminal-before-mount, expired job, report skipped/cancelled/failed/pending error. |

At 120×40 and 80×24 resize toggles compact without reconstructing widgets; explicitly map logical focus to the visible counterpart when hiding a lane/detail widget. Use fixture lane/list views here; real RunScreen/RunListDetail integration and feature flows belong to M15.3.

## Acceptance and faults

```sh
pytest tests/tui/test_connection.py tests/tui/test_subscriptions.py tests/tui/test_query_races.py tests/tui/test_navigation.py tests/tui/test_palette_help.py tests/tui/test_job_watchers.py tests/tui/test_shell_lifecycle.py tests/integration/test_tui_shell_clients.py tests/contracts/test_tui_imports.py
```

1. Real Unix-socket and InProcessClient with fixture services produce identical snapshots/errors. Inject an event between two snapshots; return S and preserve it through queued older/equal/newer revisions and delete/recreate.
2. Reconnect replay, compact, overflow, change topics and restart at lower seq. Reject old-generation events; stale queries after selection/epoch/resync/unmount cannot install data/errors. Event-only query races converge after refresh.
3. End fixture jobs before subscribe/during navigation; miss completion events, expire job cache and recover registered report outcomes. Recover launch initial_progress after later progress/completion/cache expiry/engine restart; totals/warning remain exact, an absent warning emits none, and a present warning appears once across replay/resync. Show one terminal notification; every terminal/pending fixture resolves a success-only wait.
4. Pilot both sizes: F-keys/Help/palette, tab order, click/double-click/wheel and disabled reasons. Resize preserves stack, focus, selected UID/trial and scroll; disconnected call actions make zero requests.
5. Close/reconnect with fixture work running: no repeated startup recheck or command/job, no cancellation, work remains owned by engine. Incompatible versions exit 3 with remedy; detach exits 0.

## Real integration and pending parent work

Gate on actual M11.1–2 clients/daemon/bus plus fixture providers and the runnable fixture app, not FakeEngineClient alone. Early M01/M03 API and screen children can now use checked-in foundations without completing orchestration.

**Pending parent obligations:** M15.3 registers real screens/launcher and tests durable feature outcomes, process survival, explicit trials, compact real runs and complete no-harness/creation/import/report journeys. Foundation acceptance cannot substitute for those providers or wireframe updates.
