# M11.2 — events-jobs-lifecycle

Parent: [M11 lifecycle and subscriptions](../reference/modules/11-run-orchestration.md#1-engine-component). Requirements: R034, R044, R046, R060, R139, R150. Findings: F04, F05, F15, F18.

Outcome: correct observational subscriptions, engine-owned jobs and daemon lifecycle, runnable with fixture feature work independently of the scheduler.

## Entry conditions

**Completed prerequisites:** Bootstrap and [M11.1](01-engine-client-api.md). Require socket/in-process DTO/error parity and contract import checks.

**Injected published contracts:** TopicProvider snapshots, feature registrations, activity counters, startup/shutdown/reconciliation hooks and fake job work. No M11.3 scheduler or real M05/M12/M18 provider is required. The later composition wires those hooks without replacing this infrastructure.

## Exact proposed ownership

- `axbenchmark/engine/daemon/domain/events.py`, `jobs.py`, `lifecycle.py`.
- `axbenchmark/engine/daemon/application/subscriptions.py`, `jobs.py`, `lifecycle.py`, `sessions.py`.
- `axbenchmark/engine/daemon/adapters/event_bus.py`, `job_runner.py`, `job_store.py`; lifecycle entry in `daemon/main.py`.
- Add event/topic registries to `axbenchmark/api/registry.py`; models in `api/events.py`, `api/jobs.py`.
- `axbenchmark/client/subscriptions.py`, `connect.py`; additive typed subscribe/reconnect methods in M11.1 clients.
- Add EventPublisher/TopicProvider/JobRunner ports and injected lifecycle registrations in daemon ports/composition.
- `tests/engine/daemon/test_subscription_handoff.py`, `test_replay_resync.py`, `test_jobs.py`, `test_lifecycle.py`, `test_slow_subscriber.py`.
- `tests/client/test_subscription_parity.py`, `test_autostart.py`; `tests/contracts/test_event_topic_registry.py`.
- `tests/fixtures/daemon/revisioned_topics.py`, `job_work.py`: deterministic barriers, tombstones and controllable clock.

Feature owners supply their own event payloads and snapshot providers. M15 owns the SubscriptionHub UI integration; do not duplicate it here.

## Cursor, snapshots and exact registries

Implement shared `EventCursor(epoch, seq)` end to end. Cursor validity also requires unchanged topic set and a retained client projection; bare sequence APIs are forbidden.

Under one state-publication boundary register the queue and capture S atomically. Committed projection revisions and their events enter the same boundary. Release it before reading each provider's atomic snapshot.

Return snapshots and S, never the sequence observed after the last snapshot. Queue and deliver every matching event with sequence greater than S, then continue live delivery in order.

Upserts/tombstones use stable object_key and increasing revision per epoch; shared objects use the same key across topics. Append-only entries deduplicate by stable entry IDs. Older/equal revisions cannot replace newer snapshot data; processed envelopes still advance the cursor.

Replay requires matching epoch, covered/nonfuture cursor, unchanged topics and retained state. Otherwise perform the snapshot handoff with reason initial/epoch_changed/compacted/overflow/topics_changed/invalid_cursor.

Snapshot mode clears old projection/dedup/revision state before installing the snapshot, even within the same epoch. Overflow abandons the old generation, returns a new subscription_id and orders replacement control before new-generation events; ignore late old-generation delivery.

Keep revisioned tombstones for a subscription generation. Active-list membership removal is distinct from deleting its persistent entity. Event-only topics explicitly return no snapshot and require consumer query refresh on resync.

EventRegistry names, owner/payload/change schema, allowed routes and coalescing declarations are separate from TopicRegistry keys/provider/snapshot/routed names. Validate exact publisher and consumer names at startup. Reject plural run/job event names, bare `job` topic and unregistered wildcard routes.

Only registered replaceable observations coalesce, keeping latest revision; never coalesce transitions, logs, retained facts or job outcomes. UI queues are bounded and observational. Required accounting/persistence uses awaited ports or durable acknowledged delivery outside this bus.

## Jobs and daemon ownership

JobRunner starts owned work with job_id, write-once initial_progress, replaceable latest progress, result/error, dedupe key and cancellation gate; jobs outlive client sessions. `jobs.get/list/cancel` and exact `job.progress`/`job.finished` use the same dispatcher as every feature.

Cancellation signals the work and awaits its owner cleanup before cancelled completion. JobContext.claim_commit(run_uid) atomically checks cancellation and marks the job noncancellable; protected stages return jobs.not_cancellable. The feature coordinates that gate with its durable commit intent. Session loss never becomes job cancellation.

JobContext.retain_initial_progress(payload) awaits durable write-once storage by (job_id, initial); repeats with equal payload deduplicate and conflicts fail. Runs.launch retains its final-preparation LaunchStep before progress publication. JobStatus.initial_progress survives later progress/completion and is returned by jobs.get and job-topic snapshots after cache expiry/restart; the retained JobStatus summary includes terminal result/error. Store at ~/.axbenchmark/jobs/<job_id>.json via atomic durable replace.

Persisted feature outcomes survive the one-hour finished-job cache; owners reconcile interrupted jobs on restart without replaying model work. Frozen setup/planning drafts do not count as active jobs.

Autostart acquires the engine instance lock and spawns detached axbenchmarkd with closed stdin/log files. Concurrent clients converge on one engine. Idle exit requires no runs, jobs or sessions for ten minutes; injected counters include pending retention. SIGHUP is ignored; SIGTERM invokes owner cleanup/checkpoint hooks.

## Boards and supplied states

No feature screen files. Supply job running/progress/succeeded/failed/cancelled, noncancellable commit, connection loss/reconnect and resync fixtures for all job-driven screens. M15 tests loading/content/error/replacement state; M16 uses `planning` plus `job:<job_id>`.

## Acceptance and faults

```sh
pytest tests/engine/daemon/test_subscription_handoff.py tests/engine/daemon/test_replay_resync.py tests/engine/daemon/test_jobs.py tests/engine/daemon/test_lifecycle.py tests/engine/daemon/test_slow_subscriber.py tests/client/test_subscription_parity.py tests/client/test_autostart.py tests/contracts/test_event_topic_registry.py
```

1. Capture S=10; snapshot A, commit A update at 11 while snapshot B is blocked. Return cursor 10 and replay 11; no missing update on either client.
2. Snapshot contains object revision 5; deliver queued revision 4 and equal revision 5, then 6. Only 6 replaces it, while all envelope cursors advance. Delete/recreate preserves tombstone ordering.
3. Restart epoch with sequence 1, compact replay history, change topics and send future cursors: each replaces state/dedup maps and accepts new events. Covered same-epoch replay keeps projection.
4. Overflow one slow queue repeatedly while another subscriber reads. Each replacement is generation-safe; no old-generation update enters it and publisher/output drain remains unblocked.
5. Duplicate append-only entry IDs do not duplicate logs. Registered replaceable meters coalesce correctly by object/TrialRef; transitions/job outcomes do not coalesce. Unknown publishers/routes/consumers fail validation.
6. A job survives initiating-client disconnect; cancel at each owner checkpoint, retain cleanup failure, and never report cancelled before cleanup. Race cancellation with protected commit: exactly one wins.
7. Concurrent autostart produces one daemon; drop all sessions during active fixture work and no idle exit occurs. Complete work, advance fake clock ten minutes and verify idle stop; persisted draft alone does not block exit.
8. Finish a launch fixture before subscribing, advance beyond cache/replay retention, restart and query jobs.get/job snapshot: identical initial totals/warning remain independently of latest progress. A follower prints once by job ID despite snapshot plus duplicate events; failure/cancellation after preparation retains it. Crash during initial write publishes no unretained preparation.
9. Send SIGTERM during fixture work and verify cleanup/recovery hook acknowledgement; kill the daemon to exercise interrupted-owner reconciliation. Reconnect never silently restarts the fixture job.

## Real integration and pending parent work

Run early M01/M03 jobs with real dispatcher/bus and injected expensive providers. M10 required phase handlers must execute from durable timeline handoff; M16 planning finishes with registered planning/job topics. M15 applies cursor/generation rules through its actual hub.

**Pending parent obligations:** M11.3–5, real process cleanup, launch binding, finalizer receipts and report/export readiness. Foundation acceptance is independent of those implementations; parent completion is not.
