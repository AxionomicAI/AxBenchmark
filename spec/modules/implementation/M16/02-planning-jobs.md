# M16.2 — planning-jobs

Parent: [M16 jobs](../../16-custom-template-planning.md#2-api-surface-planning). Requirements: R007, R030, R031, R068, R137, R140, R149, R150. Findings: F05; shared F04/F10/F15.

Outcome: persisted generation/regeneration jobs with explicit planner selection, fresh invocations, durable outcomes and safe recovery after disconnect or engine loss.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M16.1](01-repository-capture.md), M03.1, M04.1–2, M05.1–2 and M11.1–2 from the [parent child table](../../16-custom-template-planning.md#implementation-children-and-completion-gate).

**Bootstrap-published contracts, allowed as injected fixtures:** M08 CheckFormat and M12 RubricSource; M16.3 draft sink with optimistic versioning; M10 invocation accounting; concrete M05 harness adapters. Fixture validators enforce actual schemas, not unconditional acceptance.

The draft sink breaks the jobs/persistence cycle. Real M16.3 and M08/M12/M10 plus each claimed supported harness remain explicit integration gates.

## Exact proposed ownership

- `axbenchmark/engine/planning/domain/selection.py`, `sessions.py`, `generation.py`, `regeneration.py` and their errors.
- `axbenchmark/engine/planning/application/defaults.py`, `planner_options.py`, `start.py`, `retry.py`, `cancel.py`, `regenerate.py`, `recover.py`, `session_queries.py`.
- `axbenchmark/engine/planning/adapters/harness_planner.py`, `planner_output.py`, `json_sessions.py`, `yaml_preferences.py` previous-choice section only.
- Job/session sections of `ports.py`, `application/interfaces.py`, `api/planning.py`, `adapters/rpc.py`; planning registration hook into M11 composition.
- `tests/engine/planning/test_selection.py`, `test_planning_jobs.py`, `test_regeneration.py`, `test_planning_recovery.py`, `test_planner_output.py`.
- `tests/api/test_planning_jobs.py`, `tests/integration/test_planning_job_events.py`, `tests/fixtures/planning/output/` complete/invalid scripted output.

Do not change M03 verification, M04 resolution, M05 process management or M11 job/event implementations. M16.3 owns draft storage and approval publication.

## Selection and generation contracts

Use M03 usability and fixed Claude Code → Codex → Grok → Pi display order. Keep a previous valid usable selection; otherwise choose the first confirmed usable candidate.

Use M04 CatalogOptions.get/CatalogSelections.check with context `(harness, target/provider, account)` for recorded default model and effort evidence. Unknown default leaves model empty and blocks Start; optional planner_options.selection validates shown input and returns shown_selection/can_start; explicit unknown/unsupported effort follows CatalogSelections.check, never an invented fallback.

Readiness inspection/options/defaults make no model calls. No usable candidate returns no preselection and the verification remedy; verification itself belongs to M03 after UI/CLI consent.

Start revalidates selection/readiness, remembers the choice, persists the session and captures the pinned baseline through M16.1. Step ids/states match the parent, including not_applicable repository steps for empty projects.

Every planning/regeneration attempt allocates a new InvocationId and disposable environment, uses Role.planner plus PlanningScope(session_id, step), and invokes through HarnessExecution.establish/invoke/release. No prior conversation/session is reused.

The brief preserves the multiline request and default seven ordered tasks ending in verification/fixes. Five/seven/other nonempty task counts remain valid when complete.

Read plan.json, specification, ordered prompts, full acceptance suite/support files, execution protocol, services and dependencies. Rubric comes from M12. Invalid or absent defining output produces no partial draft and no registration.

A zero process exit is only ExitClassification.exited; draft/schema validation must also pass. Preserve launch/model/auth/config/timeout/stopped causes and requested/effective settings without substituting a model.

## Persistence, cancellation and event handoff

Preflight refusal returns a typed error; accepted JobRef is exposed only after durable session/request/job binding. Persist InvocationId before publishing invocation progress. Typed JobRef/JobStatus are M11 types; session progress/result/error records remain readable after generic job-cache expiry.

Retry reuses a complete snapshot; failed incomplete capture retries the original commit only. Engine recovery changes capturing/planning sessions to failed(planning.interrupted), preserving completed snapshot and diagnostic output; it never restarts a model.

Regeneration previews exact kept/replaced edits, invokes the saved planner and validates before optimistic base_version save. Concurrent edits, failure or cancellation leave the previous complete draft unchanged.

Persist regeneration job/status/result_version/error on the draft through its sink. On recovery an unfinished regeneration becomes interrupted; valid existing draft edits survive.

Cancel stops the exact InvocationId and awaits process/output drain, separate invocation accounting and environment release before durable session failure and terminal JobStatus. Partial output is diagnostics only.

Register planning event names and planning snapshot topic separately; job.progress/job.finished route to job:<job_id> and jobs only. Bare job and wildcard event prefixes are not subscriptions.

Snapshots carry revisioned session/draft projections and tombstones; subscribe uses full EventCursor through M11's S-before-snapshot/replay rule. State transitions are durable before events, not dependent on a UI consumer.

Verification diagnostics are M03 JobId + M05 VerificationScope; planning is PlanningScope + InvocationId. Neither receives invented RunUid/TrialRef or competitor benchmark measurements.

## Board/state data

Serve PlannerPicker/UnknownModel/NoUsable, PlannerVerify, PlanningProgress, PlanningFailed/Interrupted and regeneration progress. M16.4/5 own presentation; this child returns steps, capabilities, exact causes and reopen targets.

## Acceptance and faults

```sh
pytest tests/engine/planning/test_selection.py tests/engine/planning/test_planning_jobs.py tests/engine/planning/test_regeneration.py tests/engine/planning/test_planning_recovery.py tests/engine/planning/test_planner_output.py tests/api/test_planning_jobs.py tests/integration/test_planning_job_events.py
```

1. Exercise prior-choice valid/invalid, every usability ordering, unknown model/default effort and no-harness cases. Prove no option/readiness read invokes a model.
2. Script frontend/backend/fullstack × empty/repository output; validate steps, exactly one fresh invocation per attempt, complete draft publication and typed malformed-output/process failures.
3. Disconnect during planning, reconnect with retained session/job; inject inter-snapshot update, older revision, epoch restart, compaction and overflow. No lost final state, duplicate draft or new invocation.
4. Cancel/timeout/fail capture or planner; assert cleanup/drain before terminal status, snapshot retained only if complete and no partial registered revision.
5. Crash at session write, invocation exit and draft save; recover without model work. Regeneration cancel/conflict/interruption preserves previous draft and reports its durable outcome.
6. Validate exact registry topics; stale bare job is rejected. Job-cache expiry still exposes final session/draft result without polling private stores.

## Real gate and pending parent work

Compose real M03/M04 readiness/catalog, M05 adapters, M08/M12 validators, M10 accounting and M16.3 storage over actual M11 clients. Record real supported-harness generation/cancel/cleanup checks; scripted adapters do not certify vendor support.

**Pending parent obligations:** canonical approval/config publication, all editor screens, planner-free approved reuse, source/ZIP/executable parity and M15/M14 consent/navigation journeys.
