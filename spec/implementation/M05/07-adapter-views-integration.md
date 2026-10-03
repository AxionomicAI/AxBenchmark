# M05.7 — adapter-views-integration

Parent: [M05 API/screens](../reference/modules/05-harness-execution-isolation.md#2-api-surface-harness). Requirements: R010, R044, R047, R065, R068–R072, R076–R078, R134, R137, R138, R140, R153, R154. Findings: F06 historical addressing, F09 invalidation, F10 restoration and F04/F05/F18 client transport.

Outcome: four verified adapters are reachable through one engine API and pure policy/configuration/log/isolation views. Proposed implementation; parent acceptance requires recorded real-platform evidence, not fixture-only green tests.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap; [M05.3](03-claude-adapter.md), [M05.4](04-codex-adapter.md), [M05.5](05-grok-adapter.md), [M05.6](06-pi-adapter.md); [M03.1](../M03/01-readiness-service.md), [M04.2](../M04/02-catalog-discovery.md); M15.1 `tui-foundation` / M15.2 `tui-shell` from [ARCHITECTURE](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries).

**Bootstrap-published contracts, allowed as injected fixtures:** M07 setup/frozen launch, M08 progress/evidence, M11 scheduler/stop/live screens, M12 judge and M16 planner callers, M14 CLI bindings; M18 awaited `ProcessTracking` interface. Inject these for view tests; actual parent integration cannot stop at that seam.

All four adapter official-documentation/installed-version matrices are required inputs. A recorded unsupported capability renders as such; an unexecuted platform remains unverified.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/harness/application/queries.py`, `inspection.py`; `axbenchmark/engine/harness/adapters/rpc.py`, `composition.py`; `axbenchmark/api/registrations/harness.py`.
- `axbenchmark/tui/screens/run_config.py`; `EnvPolicyScreen` in `tui/screens/setup.py` and `CleanBlockedScreen` in `tui/screens/launch_check.py` only (coordinate shared-file edits with M07/M01 owners).
- `axbenchmark/tui/viewmodels/run_config.py`, `env_policy.py`, `clean_blocked.py`; `axbenchmark/tui/styles/harness.tcss`.
- `tests/harness/test_harness_api.py`, `test_harness_events.py`, `test_harness_integration.py`; `tests/tui/test_run_config.py`, `test_env_policy.py`, `test_clean_blocked.py`; `tests/harness/fixtures/views/`.

Use M05.1 DTOs and M05.2 policy/live services. The owned composition hook injects M18’s `ProcessTracking` into process use cases and M10’s acknowledged sink, never substitutes public subscriptions. Supply a composition registration hook; M11 owns daemon wiring. Do not implement M11 HarnessLiveScreen or duplicate M07 SetupScreen/M01 launch checks.

Register every parent query with read safety class, typed request/response/error schemas and exact event/topic metadata. No M05 public spawn command/job exists; M03/M11/M12/M16 own invocation requests and consent/lifecycle.

Configuration/log/diff queries require `TrialRef` or `ResultId`, resolve/validate the frozen binding, and return that scope. `harness.live.get` alone may resolve an omitted trial to an active trial; no active process returns `harness.no_active_task`, never the last trial.

Isolation is a run-wide query returning explicitly scoped trial rows. Selecting a row passes its `TrialRef`. A retained-result log remains pinned if a later trial starts; live diffs also pin the scope returned by the live snapshot.

Use shared `EngineError` and integer JSON-RPC envelope, `ActionState` gates, `EventCursor {epoch, seq}`, object revisions and subscription generations. Log `after_seq` is invocation-local pagination, not an event cursor.

Register bare `harness` and contribute projections to M11-owned run/live topics. Retained logs/transitions never coalesce. On overflow/reconnect/topic change, M15’s manager performs the shared snapshot/replay handoff and discards old-generation or stale query responses.

Probe/list-models/default lookup performs no model call. M03 verification alone passes consented targets, `JobId` and record directory; display `VerificationScope`/`InvocationId` logs without fabricated benchmark scope. Follow M03’s `JobRef` through `job:<job_id>`.

## Exact UI boundary

| Owned artboard | States and calls |
|---|---|
| RunConfig | Wide/compact, loading/error, tasks, requested/effective settings, log loading/not-started/running/finished/search/stream error; explicit-target describe/log plus M11 status. |
| TaskBlocked | RunConfig with the returned blocked line focused; no permission retry or input to process. |
| ModelRejected | Returned failure notice, unverified values and `can_live_view`/`can_stop` flags; no model substitution. |
| RunIsolation | Loading/error and trial/resource/blocked rows; `harness.isolation.get(run_uid)`, row opens exact-trial RunConfig. |
| EnvPolicy | Loading/error, five-category matrix, clean/current choice; save through M07 `configs.update_entry`, no local policy rule. |
| CleanModeBlocked | Error-payload assessment and remove-entry/use-current/cancel choices; explicit launch overrides only, no automatic fallback. |

Bind parent keys exactly, including `/`, `i`, `v`, `s`, `d`, `p`, escape and save. `p` passes the resolved `TrialRef` to M08. Unmount unsubscribes without stopping work. Keep wireframe/navigation source changes with the later navigation owner.

## Acceptance and faults

Run:

```sh
pytest tests/harness/test_harness_api.py tests/harness/test_harness_events.py tests/harness/test_harness_integration.py tests/tui/test_run_config.py tests/tui/test_env_policy.py tests/tui/test_clean_blocked.py
```

1. Both socket and in-process clients round-trip every query, typed failure and schema. Missing trial, wrong result/trial binding and same-label distinct runs never select unrelated historical data.
2. Snapshot midway through updates, replay an older event, restart epoch, overflow a queue and change selected trial/topic. Newer revisions survive; log pagination fills retained entries without duplicate lines or process restart.
3. Pilot/fake-client tests cover every board/state wide and compact, unknown effective effort, blocked lines, verbatim remedies and capability-disabled keys. Each binding issues only its declared call; cancel/escape neither spawns nor stops.
4. Compose real M03/M04 and four adapters: inventory/default/model discovery makes zero model calls; unsupported/offline/auth states remain distinct. Verification retains only diagnostic identities and one call per consented target.
5. Real macOS/Linux integration records exact installed versions and current official sources for each adapter. Exercise clean/current, blocked permissions, separate same-harness configurations, sequential/parallel scheduling, fresh tasks, detach/reconnect, timeout/stop and service cleanup; untested combinations stay unverified.
6. With real M01/M02/M11 integration, restore executable/regular baseline locally and after M17 import, preserve approved modes, and retain two trials’ outcomes/logs with idempotent operation ids. Fault durable writes and verify no false completion/export readiness.
7. Compose M12’s exact `EnvironmentSpec.judge` inputs and M02 delivered artifact through the same M05 runtime; protected artifact/input writes and repairs fail, scratch writes succeed, unsupported protection blocks launch and authoritative bytes remain unchanged.
8. M18 spies/real handoffs confirm awaited competitor start/exit and process-start identity across immediate exit, stop/recovery and UI overflow. OFF/collector failures are nonfatal with gaps; storage failure prevents false finalization. Planner/judge/verification make no competitor tracking calls. M10 retains explicit/documented currency provenance and unknown raw cost without guessing USD.
9. Inject identity change during baseline access and a later run read; M11 coordinator retains original digests/paths, cancels active work/judging, preserves partial evidence and invalidates every trial including sealed results. A view must not downgrade this to an ordinary task error.

**Pending parent obligations:** real M07/M08/M10/M11/M12/M16 end-to-end scheduling, verification, accounting, finalization and role behavior; M14 CLI parity and M15 cross-screen navigation. Integration fixtures cannot certify absent provider services or a missing installed-platform test.
