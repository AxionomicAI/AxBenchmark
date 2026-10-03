# M16.2 — planning-jobs

Parent: [M16 jobs](../reference/modules/16-custom-template-planning.md#2-api-surface-planning). Requirements: R007, R030, R031, R068, R137, R140, R149, R150. Findings: F05; shared F04/F10/F15.

Outcome: persisted generation/regeneration jobs with explicit planner selection, fresh invocations, durable outcomes and safe recovery after disconnect or engine loss.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M16.1](01-repository-capture.md), M03.1, M04.1–2, M05.1–2 and M11.1–2 from the [parent child table](../reference/modules/16-custom-template-planning.md#implementation-children-and-completion-gate).

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

Use M03 usability and the shared Claude Code → Codex → Grok CLI → Pi → Cursor CLI → OpenCode registry order, requiring version-proven planner-role capability. Keep a previous valid usable selection; otherwise choose the first confirmed usable candidate.

Use M04 CatalogOptions.get/CatalogSelections.check with context `(harness, target/provider, account)` for recorded default model and effort evidence. Unknown default leaves model empty and blocks Start; optional planner_options.selection validates shown input and returns shown_selection/can_start; explicit unknown/unsupported effort follows CatalogSelections.check, never an invented fallback.

Readiness inspection/options/defaults make no model calls. No usable candidate returns no preselection and the verification remedy; verification itself belongs to M03 after UI/CLI consent.

Start revalidates selection/readiness, remembers the choice, persists the session and captures the reviewed current-folder baseline through M16.1. Step ids/states match the parent, including an explicit empty capture rather than required Git resolution.

Every planning/regeneration attempt allocates a new InvocationId and disposable environment, uses Role.planner plus PlanningScope(session_id, step), and invokes through HarnessExecution.establish/invoke/release. No prior conversation/session is reused.

The brief preserves the multiline request and default seven ordered tasks ending in verification/fixes. New generated definitions are v2 multi-step with at least two primary task files; five/seven/other counts >=2 remain valid when complete.

Read plan.json with explicit primary-file order and optional shared specification refs, ordered primary prompts, full acceptance suite/support files, execution protocol, services and dependencies. Rubric comes from M12. Invalid or absent defining output produces no partial draft and no registration.

A zero process exit is only ExitClassification.exited; draft/schema validation must also pass. Preserve launch/model/auth/config/timeout/stopped causes and requested/effective settings without substituting a model.

## Persistence, cancellation and event handoff

Preflight refusal returns a typed error; accepted JobRef is exposed only after durable session/request/job binding. Persist InvocationId before publishing invocation progress. Typed JobRef/JobStatus are M11 types; session progress/result/error records remain readable after generic job-cache expiry.

Retry reuses a complete snapshot; failed incomplete current-folder capture retries only against its reviewed inventory/token, with changed facts requiring explicit recapture/review; legacy requests retain their original pin. Engine recovery changes capturing/planning sessions to failed(planning.interrupted), preserving completed snapshot and diagnostic output; it never restarts a model.

Regeneration previews exact kept/replaced edits, invokes the saved planner and validates before optimistic base_version save. Concurrent edits, failure or cancellation leave the previous complete draft unchanged.

Persist regeneration job/status/result_version/error on the draft through its sink. On recovery an unfinished regeneration becomes interrupted; valid existing draft edits survive.

Cancel stops the exact InvocationId and awaits process/output drain, separate invocation accounting and environment release before durable session failure and terminal JobStatus. Partial output is diagnostics only.

Register planning event names and planning snapshot topic separately; job.progress/job.finished route to job:<job_id> and jobs only. Bare job and wildcard event prefixes are not subscriptions.

Snapshots carry revisioned session/draft projections and tombstones; subscribe uses full EventCursor through M11's S-before-snapshot/replay rule. State transitions are durable before events, not dependent on a UI consumer.

Verification diagnostics are M03 JobId + M05 VerificationScope; planning is PlanningScope + InvocationId. Neither receives invented RunUid/TrialRef or competitor benchmark measurements.

## Board/state data

Serve PlannerPicker/UnknownModel/NoUsable, PlannerVerify, PlanningProgress, PlanningFailed/Interrupted and regeneration progress. M16.4/5 own presentation; this child returns steps, capabilities, exact causes and reopen targets.

**Frozen domain contract.** Planner briefs and output validation preserve the selected project domain and M12 rubric family/version/digest, deriving the complete approved evidence map from rubric/check/support bytes. Generate scoped backend interfaces/data/recovery, native target/lifecycle/accessibility matrix, DevOps allowed targets/modes, bounded agent software cases/effects or specification brief/reference/decomposition obligations as applicable. A specification benchmark generates tasks to produce inert design documents, not an instruction to implement their proposed software. Domain choice grants no live test/provider/device authority during planning.

**Route, comparison and profile interfaces.** Extend PlannerSelection/PlannerCatalog checks and planning session/request/attempt records with optional RoutedAccessSelectionV1, ExistingAgentSelectionV1 and resolved access/profile plans independently selected for role planner. M04 resolves stored facts, M03 assess(plan) checks prerequisites and M05 invokes the qualified native adapter under PlanningScope(session_id,step); no RunUid/ConfigurationId/TrialRef is created. Persist sanitized requested/resolved/effective route/profile evidence and planner accounting in the existing session/attempt journal. Static registration is not planner selection; source drift/conflicts block a fresh attempt. Manual authoring remains planner-free and never constructs these adapters.

## Integrated requirements

R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R184, R185, R186, R187, R188 — frozen domain profile/evidence contracts: [R184](../quality-judges/BACKEND.md); [R185](../quality-judges/MOBILE.md); [R186](../quality-judges/DEVOPS.md); [R187](../quality-judges/AGENTIC.md); [R188](../quality-judges/SPECIFICATION.md).

R180, R181, R182, R183 — [benchmark modes](../BENCHMARK-MODES.md).

Optional idea→planner generation produces the same v2 draft sink as manual authoring: `benchmark_type=multi_step`, >=2 ordered primary files and all seven project domains, with the existing seven-task default and its authored final verification/fixes task. No planner route is entered for one-shot, supplied specs, reuse or import. Freeze/validate mandatory commit policy/instruction/check/scope through M16.3 rather than inserting new competitor tasks. Extend output/selection tests to optional shared context, invalid one-file output, exact generated bytes and both new adapters with unsupported roles preserved; scripted support never certifies installed versions.

## Acceptance and faults

**Route/profile acceptance:** Test separately selected planner and competitor profiles, same alias different bindings, missing planner role, source drift, ordinary inherited optional unknowns and no fake trial. Existing job cancel/recovery never redispatches or activates imported profiles.

**Domain acceptance:** Add scripted complete/incomplete output for every family, wrong profile and unsupported scope refs. Planner output cannot self-approve an exception, remove a required category or replace the original brief; manual authoring continues to bypass this optional planner.

```sh
pytest tests/engine/planning/test_selection.py tests/engine/planning/test_planning_jobs.py tests/engine/planning/test_regeneration.py tests/engine/planning/test_planning_recovery.py tests/engine/planning/test_planner_output.py tests/api/test_planning_jobs.py tests/integration/test_planning_job_events.py
```

1. Exercise prior-choice valid/invalid, every usability ordering, unknown model/default effort and no-harness cases. Prove no option/readiness read invokes a model.
2. Script all seven project types × empty/populated current-folder output; validate steps, exactly one fresh invocation per attempt, complete draft publication and typed malformed-output/process failures.
3. Disconnect during planning, reconnect with retained session/job; inject inter-snapshot update, older revision, epoch restart, compaction and overflow. No lost final state, duplicate draft or new invocation.
4. Cancel/timeout/fail capture or planner; assert cleanup/drain before terminal status, snapshot retained only if complete and no partial registered revision.
5. Crash at session write, invocation exit and draft save; recover without model work. Regeneration cancel/conflict/interruption preserves previous draft and reports its durable outcome.
6. Validate exact registry topics; stale bare job is rejected. Job-cache expiry still exposes final session/draft result without polling private stores.

## Real gate and pending parent work

Compose real M03/M04 readiness/catalog, M05 adapters, M08/M12 validators, M10 accounting and M16.3 storage over actual M11 clients. Record real supported-harness generation/cancel/cleanup checks; scripted adapters do not certify vendor support.

**Pending parent obligations:** canonical approval/config publication, all editor screens, planner-free approved reuse, source/ZIP/executable parity and M15/M14 consent/navigation journeys.
