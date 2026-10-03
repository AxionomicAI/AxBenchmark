# M11 — Run scheduling and persistent lifecycle

Status: proposed requirements. Engineers use this module to connect launch validation, execution scheduling, observation, stopping, and retained results while keeping execution independent of every interface. Runs belong to the headless engine; the TUI, the CLI and a later MCP server observe and control them through the same API, and no behavior depends on which interface started a run or whether one is attached. [R150] The [product specification](../SPEC.md) is authoritative; requirement IDs identify its assigned source contracts. [ARCHITECTURE.md](../../../ARCHITECTURE.md) fixes the engine structure; the Implementation section below applies it.

## Launch boundary and invariants

Execute selected configurations against the pinned template revision, expose progress and measurements, preserve evidence, and execute the approved checks. [R034]

Before execution, the approved specification, task prompts, acceptance checks, grading rubric, execution protocol, and starting snapshot form an immutable template revision. Recompute its SHA-256 and bind each result to that identity. Separately freeze the run configuration and original scoring weights before launch. Template inputs must not change during execution. The first detected mutation halts the whole run with the same cleanup as an explicit stop: every result of the run has an effective interrupted/non-comparable status through an append-only run invalidation (sealed execution facts remain intact) with the reason "template identity invalidated", the approved and computed SHA-256 and the changed paths, keeps its evidence, never enters a comparison, and never silently receives a replacement identity. [R067, R139]

During active execution, permitted user actions are inspection, detachment, reconnection, and explicit stopping. Frozen prompts, selected models, and original weights cannot be edited, and implementation hints cannot be injected into the active comparison. These restrictions apply regardless of which interface exposes the run. [R047]

Unattended execution requires a complete configuration and does not pause for interactive questions. All model work runs headlessly, including work reached through the orchestration workflow. [R060, R138]

## Scheduling contract

By default, run one configuration per selected harness concurrently. Resolve the default `jobs` from the registered harness count (currently six), validate explicit values from 1 through that count, and use `max_active = min(jobs, distinct_selected_harnesses)`. Registry membership does not imply installed usability; M07 still validates selected configurations. Additional configurations for the same harness queue and execute sequentially. Tasks within each configuration always execute sequentially. [R045, R138]

Provide sequential execution through `--jobs 1` and an equivalent TUI setting. In that mode, configurations execute one at a time while retaining their sequential task order. Record scheduling and concurrency in results so later inspection can identify the execution conditions. The specification does not prescribe how to choose between eligible queued configurations. [R045, R138]

Resolve an omitted concurrency choice from the registry only before launch; preserve explicitly saved `jobs=4` and `jobs=5` as 4 and 5. Freeze the effective policy, registry-count basis and selected harness set with the launch, and retain that policy unchanged through execution, reconnection and recovery. Registry changes never resize an active or retained run's policy.

Default to one trial per configuration and a three-hour timeout for each task. When the configuration asks for N trials, the trials of a configuration run one after another inside that configuration's slot, each from a fresh copy of the packaged baseline, and each produces a separate result linked to its configuration and trial index. A trial is not a retry: a failed task must not automatically be rerun to improve its result, and no trial is added or repeated because another failed. Observable retries performed internally by a harness remain part of the recorded execution; they do not justify an additional orchestrator retry. [R077]

The binding [benchmark modes contract](../../BENCHMARK-MODES.md) determines the frozen task sequence. A new one-shot definition has exactly one logical competitor task `T1` per trial, preserving its exact prompt bytes; the fresh task session may make multiple model/tool calls and existing transport retries. New multi-step definitions have at least two explicitly ordered primary specification files, one per task. Each step starts a fresh process/conversation with approved common context and the introduced file prefix through that step; future primary files are withheld from the supplied pack, while prior workspace output persists. Information already in the baseline or generated workspace remains visible. Legacy v1 definitions retain their approved input protocol, task count and legacy multi-step marker, including one-task v1 definitions.

Every configuration/trial uses an isolated writable copy of the same immutable approved current-folder capture, including its bytes and executable flags; legacy packaged baselines retain their existing semantics. Never refresh from or write into the original folder, invoke an automatic planner, or add a fix/post-check repair task. Authored repair tasks remain binding; baseline and evidence behavior follow the benchmark modes contract. With `C` configurations, `T` trials and `N` frozen tasks, derive `C × T × N` logical competitor tasks (`N=1` for one shot). Task checks, final capture/regression and grading are separate engine phases; they do not add tasks or change the one logical grading assessment per trial.

## Persistent lifecycle and observation

The following are conceptual lifecycle boundaries, not required status names or storage fields. The process architecture is the headless engine of [ARCHITECTURE.md](../../../ARCHITECTURE.md): runs execute under the engine process, never under an interface. [R150] The states and records that implement these boundaries are implementation decisions listed under Implementation.

| Boundary | Observable contract |
|---|---|
| Launch | Work uses the recomputed template identity and separately frozen run configuration and original weights. [R067] |
| Queue to execution | A configuration starts according to the selected concurrency policy; its tasks remain sequential. [R045] |
| Active observation | Progress and measurements are visible while approved checks and evidence preservation participate in the execution workflow. A selected configuration's current task can be watched live (workspace changes, exposed reasoning, actions, output rate, context use) without affecting its execution. [R034, R044] |
| Detach or close | Execution continues independently of the TUI and of any other interface; disconnecting is not an interrupted benchmark. [R046, R060, R139, R150] |
| Reconnect | Attachment observes existing work without restarting tasks. Reconnection is observation, not a new trial. [R046, R138] |
| Explicit stop | Stopping one configuration or the whole benchmark also cleans up its child processes and application services. [R046, R139] |
| Actual interruption or failure | Preserve interrupted outcomes and failures; an actual execution failure remains visible in saved state. [R060, R077, R139] |

Closing a terminal interface must not implicitly invoke the stop behavior. Conversely, an explicit stop cannot be implemented solely by dismissing the interface while its associated processes and application services continue running. [R046, R139]

## Failure and result contracts

After an ordinary task failure or timeout, continue later tasks in that configuration from the resulting workspace. Do not substitute an earlier successful workspace or create another attempt to improve the failed task's outcome. Authentication or configuration failures halt the affected configuration while other configurations continue. [R077]

Retained outcomes must reflect what happened: ordinary failures, timeouts, actual interruptions, and observable harness-internal retries remain recorded. Interface disconnection alone must not manufacture an interruption, and subsequent observation must not conceal an actual execution failure. [R060, R077, R139]

The run's own outcome is separate from its task outcomes. A run that executed every configuration to its end is completed, even when tasks failed, checks did not pass, or a configuration halted on an authentication or configuration failure; those remain visible in its status. Only an explicit stop or an actual interruption (including a halt for template mutation) gives a stopped or interrupted run. Unattended execution reports a completed run as success and a stopped or interrupted run as failure, and task-level failures are read from the run's status. [R060, R077]

The orchestration result contract includes the bound template identity, frozen launch configuration and original weights, scheduling and concurrency, and preserved execution outcomes and evidence. Progress and measurement information must support observation of the pinned run. M02 owns the retained schema; the implementation below fixes its lifecycle handoffs and explicit trial addressing. [R034, R045, R060, R067, R077, R139]

## Dependencies and integration boundaries

| Module boundary | Required integration |
|---|---|
| [M01 template identity](01-template-library-identity.md) and [M07 launch configuration](07-run-configuration.md) | Supply the immutable approved definition and separately frozen launch choices; orchestration recomputes and binds template identity before execution. [R067] |
| [M05 harness execution](05-harness-execution-isolation.md) | Execute model work headlessly, expose task outcomes and observable internal retries, and support cleanup of child processes and application services on explicit stop. [R046, R077, R138] |
| [M08 verification](08-verification-evidence.md), [M10 measurements](10-measurements-cost.md), and [M02 retained results](02-retained-results-comparability.md) | Execute approved checks, preserve evidence, expose measurements, and retain scheduling and actual execution failures. [R034, R045, R060, R139] |
| [M15 TUI](15-terminal-interface.md) and [M14 CLI](14-command-line-interface.md) | Present the scheduling and lifecycle behavior that this module owns in the engine, including sequential mode, unattended execution, attachment without restart, restricted active controls, and explicit stopping. Both are clients of the same API and evaluate none of these rules. This module provides the live observations of each active task process to an attached interface; attaching, watching, or leaving a live view never changes execution. [R044, R045, R046, R047, R060, R138, R150] |

## Acceptance criteria

- Select all six registered harnesses with an extra configuration for one harness: observe six active configurations under the registry-derived default, at most one per harness, sequential same-harness queuing, sequential tasks, and the frozen recorded policy. Repeat with a selected subset, explicitly saved `jobs=4`/`jobs=5`, and each interface's sequential setting; observe the selected-harness bound, explicit saved limit, and one-at-a-time execution respectively. Reject jobs outside the registry-derived range. [R045, R138]
- Launch with complete unattended configuration: observe headless execution, progress, measurements, approved checks, and retained evidence without interactive questions. [R034, R060, R138]
- Detach, close, and reconnect during a task: execution continues and attachment does not restart it. Explicitly stop a configuration and a whole run in separate cases; their child processes and application services are cleaned up. [R046, R138, R139]
- Attempt active prompt, model, or original-weight edits and hint injection: none changes the comparison. Verify separate launch freezes, recomputed identity binding, and invalidation of the identity claim on template mutation. [R047, R067]
- Verify the one-trial and three-hour per-task defaults. With three trials, one configuration produces three results with trial indexes 1–3, run one after another, each from a fresh baseline. Exercise ordinary failure and timeout: later tasks use the resulting workspace without automatic reruns. Exercise authentication/configuration failure: only that configuration halts. Actual interruptions, failures, and observable internal retries remain saved. [R060, R077, R139, R154]
- Exercise both benchmark modes against empty and populated captures: exact one-shot `T1`, ordered multi-step primary files, byte/flag-identical initial copies, carried workspace and fresh per-step sessions, introduced prefixes without future supplied files, and derived task totals. Change/remove the original folder after approval; runs still consume the packaged capture. Checks/grading add no competitor tasks or repair invocation. Manual authoring/inspection/capture/approval remains available with no harness installed; only model-dependent work requires a usable harness.
- Change a template file during a run: the whole run halts with stop cleanup, every result is interrupted with "template identity invalidated" and both digests, and nothing is rebound. A run with failed tasks that reaches its end is completed; `run --no-tui` exits 0 for it and 1 for a stopped or interrupted run. [R060, R067, R139, R153]

## Implementation

This section applies [ARCHITECTURE.md](../../../ARCHITECTURE.md). Everything here is an implementation decision; the product contract above and [SPEC.md](../SPEC.md) are unchanged by it. M11 is where the headless engine itself lives: the daemon process, its socket API, sessions, subscriptions and jobs, plus the run lifecycle that every interface observes. [R150]

### Delivery children and prerequisites

All children require [Bootstrap contracts](../../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries); contract availability is not completed provider implementation. Findings are from [recommendations](../recommendations.md). This module resolves F02–F06, F09, F13, F15 and F18 at its owned boundaries.

The [context-monitoring supplement](../../CONTEXT-MONITORING.md) is binding on these existing children, including its capture barrier, observer isolation and scoped API/events; it adds no child or dependency-graph node. [R161–R166]

The [decision-engine contract](../../DECISION-ENGINES.md#local-resource-admission-and-fairness) and [statistics contract](../../BENCHMARK-STATISTICS.md) also bind these children: M11 owns cross-run admission and lifecycle; M12.4 owns shared decision dispatch; M10 owns statistical preparation. Bootstrap publishes the injected protocols, M12.4 first verifies fixtures, and M11.3–4 later supply the real gate; no hidden scheduler prerequisite, private HTTP client or new graph node is introduced.

The [benchmark modes contract](../../BENCHMARK-MODES.md) binds M11.3's configuration loop, launch totals and status/timeline projections. The [benchmark design handoff](../../BENCHMARK-DESIGN-SPEC.md#cursoropencode-selection-and-run-layouts) binds M11.5's run/live view models and M15.1 widget integration. **Binding override for earlier M11.3/M11.5 fixtures:** their four-harness/four-wide-lane assertions and subsequent five-harness fixtures are subset regression cases, not a ceiling or completeness gate. Replace fixed defaults/ranges and lane counts with the shared M05 registry, currently `claude_code`, `codex`, `grok_cli`, `pi`, `cursor_cli`, `opencode`; extend acceptance to all six plus queued same-harness entries and both benchmark modes. Existing child numbers, prerequisites and source/test ownership stay unchanged; no new scheduler or UI owner is introduced.

| Child | Completed prerequisites and scope |
|---|---|
| [M11.1 — engine-client-api](../../M11/01-engine-client-api.md) | Bootstrap only. Runnable dispatch, transport, composition seam and both clients with injected feature use cases; typed registry/client contracts for the supplement's `measurements.context.sessions`, `.snapshot`, `.history`, `.segments`, `.analysis` queries and `.reclassify` job. |
| [M11.2 — events-jobs-lifecycle](../../M11/02-events-jobs-lifecycle.md) | M11.1. Replay/snapshots, jobs, autostart and idle lifecycle; context event registration and separate observer-job lifecycle/cancellation; durable decision-admission journal and fixture work, no scheduler prerequisite. |
| [M11.3 — run-scheduler](../../M11/03-run-scheduler.md) | M01/M02/M05/M07/M08/M10 services and M11.2; published M12/M18 ports injected until M11.4 integration; implement the shared cross-run decision/measurement admission coordinator; join capture producers and require M05 source closure through the M10 drain barrier. |
| [M11.4 — stop-recovery-invalidation](../../M11/04-stop-recovery-invalidation.md) | M11.3, M12.2 and M18.2. Every terminal path, cleanup, finalization and invalidation, including decision-grant/unknown-server startup reconciliation, partial context capture on stop/recovery and `tests/integration/test_context_lifecycle.py`. |
| [M11.5 — run-screens](../../M11/05-run-screens.md) | M11.4, M05 observation service, M15.1–2. Feature-owned run screens and real subscription integration; resolved HarnessLive → M10 `ContextDetail` route and stale trial/window/generation response rejection. |

The M11.1–2 composition root accepts registered feature providers; it must not import a completed scheduler or every feature adapter to become runnable. Full application composition adds the real providers later. Parent acceptance still requires all children, real services, both clients and the lifecycle/report gates below; fixtures establish no real harness or collector support.

### 1. Engine component

Two packages:

- `axbenchmark.engine.runs`: run launch, scheduling, the per-configuration task loop, stop, reconciliation and run queries.
- `axbenchmark.engine.daemon`: composition root, JSON-RPC socket server, sessions, the event bus and subscriptions, the job runner, engine lifecycle. It follows the same four layers, with `composition.py` as the only module that imports every other module's adapters.

M11 never spawns a harness process itself. Every competitor process is started, observed and ended through M05's `HarnessExecution`; checks through M08; measurements through M10; result records through M02.

#### Domain (`engine/runs/domain/`, `engine/daemon/domain/`)

Frozen slotted dataclasses and enums; no I/O, no asyncio, no pydantic.

| Type or rule | Content |
|---|---|
| `RunUid`, `RunLabel` | Shared ARCHITECTURE types: immutable UUID4 primary/directory key and a separately allocated local `YYYY-MM-DD-<suffix>` display label. Preserve origin and UID on import. API/internal calls use UID; CLI label resolution requires exactly one visible match through M02 `results.resolve_run`, otherwise `runs.ambiguous_run` with candidate UIDs/origins. Labels are never foreign/grouping keys. |
| `ConfigurationId`, `EntryIndex` | Stable id of one competitor entry of the frozen launch and its 1-based position in entry order (`#1`…`#n`). Several entries of one harness are distinct configurations. [R017, R045] |
| `TrialRef` | Shared `{run_uid, configuration_id, trial_index}`; index is 1-based within the frozen roster. One permanently bound `ResultId` per TrialRef. Stored tasks/checks/logs/measurements/windows carry this scope; historical queries never default to current/last trial. [R077, R154] |
| `SchedulingPolicy` | `jobs: int` from 1 through `registered_harness_count`, `max_active = min(jobs, distinct_selected_harnesses)`, `per_harness_limit = 1`, `queue_order = ENTRY_ORDER`. `SchedulingVocabulary.default()` supplies `jobs=registered_harness_count` (currently six) from the injected M05 registry; `--jobs 1` and the TUI sequential setting give `jobs=1`. M07 stores the choice as `execution.concurrency` (`ConcurrencyChoice`, M11's vocabulary: the `jobs` value); explicitly saved `jobs=4` and `jobs=5` stay 4 and 5. Resolve and freeze the effective policy, registry-count basis and selected harness set at launch; do not recalculate on reconnect/recovery. Entry order is the chosen tie-break; the SPEC does not prescribe one. [R045, R138] |
| `next_starts(state: ScheduleState, policy) -> tuple[ConfigurationId, ...]` | Pure scheduler. Starts queued configurations in entry order while `active < max_active` and the configuration's harness has no active configuration. Called after launch and after every configuration end. Tasks inside a configuration are never scheduled here; they are a sequential loop. [R045] |
| `SchedulingRecord` | `TrialRef`, policy, queue position, start and end time, and the configurations active at the same time. Handed to M02 for every result. [R045] |
| `ExecutionDefaults` | `trials = 1`, `task_timeout = 3 h`. `validate_trials(n)`: a whole number ≥ 1, otherwise `InvalidTrials`. The frozen launch carries the effective values; M11 adds no retry field anywhere. [R077] |
| `ConfigurationState` | `queued`, `preparing`, `running`, `verifying`, `complete`, `halted`, `interrupted`, `not_run`. Transitions are a pure function `transition(state, event) -> state` that rejects any edge not in the table below. A configuration with several trials stays in its slot from its first trial's `preparing` to its last trial's end; `preparing → running ⇄ verifying` repeats per trial, and the per-trial outcome is a `TrialState` with the same members. |
| `TaskState` | `pending`, `running`, `verifying`, `exited(ExitClassification)`, `interrupted(InterruptionCause)`, `not_run`. Process outcome and check outcome stay separate fields. [R076, R077] |
| `continuation(exit: ExitClassification) -> Continue \| Halt` | `exited` (any exit code) and `timed_out` → `Continue` from the resulting workspace. `auth_failed`, `config_failed`, `model_rejected` and `launch_failed` (the harness could not start with the frozen configuration) → `Halt` this configuration, including its remaining trials (`not_run`); the others continue. `stopped` never reaches this rule (stop handles it). There is no rule that returns "retry". [R077] |
| `InterruptionCause` | `stopped_by_user(scope)`, `template_invalidated(IdentityCheck)` (approved and computed SHA-256, changed paths), `engine_terminated`, `engine_lost` (found at reconciliation). There is no member for a client disconnecting, so a detach cannot be recorded as an interruption by construction. [R046, R060, R067, R139] |
| `RunState` | `launching` (binding journal), `active`, `finalizing`, `retention_pending` (typed persistence error and retry checkpoint), `judging` (all configurations ended, M12 judging in progress), `ended` with `RunOutcome` `completed`, `stopped` or `interrupted` (template identity invalidated, engine terminated or lost) and an optional `outcome_reason` code (`runs.template_identity_invalidated`, `runs.engine_terminated`, `runs.engine_lost`). Plus a `stopping` overlay per scope while cleanup runs. |
| `run_outcome(configurations, stop_requests, cause) -> RunOutcome` | `completed` when no run-scope stop was requested and no interruption occurred, whatever the task outcomes, check outcomes and `halted` configurations; `stopped` when a run-scope stop ended it; `interrupted` for any non-user interruption; template invalidation takes precedence over a concurrent user stop. A configuration-scope stop leaves the run `completed` once the others end. Exit codes are derived from it by the CLI, never from task outcomes. [R060, R077] |
| `allowed_actions(run, configuration?) -> ActionSet` | The capability rule for interfaces: inspect, detach, reconnect always; run stop after complete binding while active, finalizing, retention_pending or judging; configuration stop only for `queued`, `preparing`, `running` or `verifying`; completed configurations cannot be stopped during judging; repeated pending stop returns its receipt; live view while a task process runs; edit of prompts, models, efforts, original weights and hint injection never after binding (reason `runs.frozen_while_active`). The `restrictions` table drawn on ActiveLocked is `allowed_actions` rendered as rows. [R047] |
| `ObservationLog` | Intervals during which no session subscribed to the run's topic, from session events. Lets RunReattached show the detached interval; it is presentation data and never an execution fact. [R046] |
| `RunLogEntry` | stable `entry_id`, optional `trial: TrialRef`/`task_id` for scoped facts, `entry_no`, `at`, `source` (`run`, a harness id, `verify`, `judge`), `kind`, `text`, `severity` (`info`, `failure`). The human run log (`#events`); text is composed in the engine so every interface shows the same sentence. |
| `StopPlan` / `StopProgress` | Scope, target configurations, cleanup items from M05, recorded-outcome preview; progress steps `terminate`, `cleanup`, `save_interrupted`, `mark_not_run`, `retain` (run scope), each `todo`, `now`, `done`, `pending` or `error` with typed details. [R046, R139] |

`ConfigurationState` transitions: `queued → preparing → running ⇄ verifying`; after final verification/resource release of a nonfinal trial, `verifying → preparing` for the next trial, otherwise `verifying → complete`. `preparing|running|verifying → halted` on an establishment/continuation halt; any nonfinal state may become interrupted, and queued work may become not_run when stopped before starting. Per-trial state ends at its own complete/halted/interrupted/not_run; configuration terminal states never return to execution. Identity invalidation overlays even terminal states without rewriting their original execution facts.

Daemon domain (`engine/daemon/domain/`):

| Type or rule | Content |
|---|---|
| `EventCursor`, `EventEnvelope` | Cursor is indivisible `{epoch, seq}`. Wire envelope: `subscription_id`, cursor, `at`, exact registered `name`, `topic_keys`, `changes` (object-key/revision upserts or tombstones), `payload`. Append-only entries use stable entry IDs. Cross-topic objects keep one key/revision. |
| `Topic` | Parsed form of a topic string: `run:<run_uid>`, `run:<run_uid>/<configuration_id>`, `live:<run_uid>/<configuration_id>`, `job:<job_id>`, `engine`, or a bare namespace (`templates`, `results`, `catalog`, …). Other modules register only their documented exact bare topics (for example M16 `planning`) or explicit key patterns. `parse_topic(str) -> Topic` raises `InvalidTopic`. |
| `ReplayWindow` | Replay only for the same epoch and unchanged topic set with a retained client projection and a fully covered, nonfuture cursor; otherwise replace the subscription generation using the shared snapshot handoff. |
| `JobState` | `running`, `succeeded`, `failed`, `cancelled`; `JobRecord(job_id, method, state, initial_progress, progress, result, error, started_at, finished_at, dedupe_key)`. `initial_progress` is optional, write-once owner-typed preparation data, distinct from replaceable latest `progress`; runs.launch must retain its final-preparation LaunchStep there. |
| `ApiVersion` | Semver; `compatible(client, engine)` is equality of the major component. |
| `IdlePolicy` | `idle_after = 10 min`; `should_exit(active_runs, active_jobs, sessions, idle_since, now)`. Drafts are not an input: setup and planning drafts are persisted by M07 and M16 and survive an engine exit. |

Domain errors: `AmbiguousRun`, `BindingPending`, `RetentionPending`, `UnknownRun`, `UnknownConfiguration`, `NotActive`, `InvalidJobs`, `InvalidTrials`, `NoEntries`, `RunStateUnreadable`, `InvalidTopic`, `UnknownSubscription`, `UnknownJob`, `JobNotCancellable`, `IncompatibleVersion`, `EngineBusy(run_uids, job_ids)`.

#### Ports (`engine/runs/ports.py`, `engine/daemon/ports.py`)

```python
class RunRepository(Protocol):
    async def reserve(self, launch_date: date) -> RunReservation: ...          # RunUid + RunLabel, under runs/.lock
    async def release(self, run: RunUid) -> None: ...                          # only uncommitted launch staging may be released
    async def save_state(self, run: RunUid, state: RunRecord) -> None: ...      # temp + fsync + rename
    async def load_state(self, run: RunUid) -> RunRecord: ...                   # raises RunStateUnreadable
    async def list(self, active: bool | None) -> Sequence[RunRecord]: ...
    async def append_log(self, run: RunUid, entry: RunLogEntry) -> None: ...
    async def read_log(self, run: RunUid, after: int | None, limit: int) -> Sequence[RunLogEntry]: ...
    def trial_dir(self, trial: TrialRef) -> Path: ...                         # explicit M05 record scope
    async def checkpoint_binding(self, run: RunUid, checkpoint: BindingCheckpoint) -> None: ...
    async def checkpoint_finalization(self, run: RunUid, checkpoint: FinalizationCheckpoint) -> None: ...
    async def append_timeline(self, entry: PhaseEntry, operation_id: str) -> None: ...

class EventPublisher(Protocol):          # engine/shared; implemented by the daemon's EventBus
    def publish(self, event: DomainEvent) -> None: ...

class JobRunner(Protocol):               # offered to every module that registers a job
    def start(self, method: str, work: Callable[[JobContext], Awaitable[object]],
              *, dedupe_key: str | None = None, cancellable: bool = True) -> JobRef: ...
class JobContext(Protocol):
    job_id: JobId
    async def retain_initial_progress(self, progress: object) -> None: ...  # durable write-once by (job_id, "initial"); same payload deduplicates, conflict fails
    def report(self, progress: object) -> None: ...      # replaceable latest progress; mapped to job.progress by the owner's rpc mapper
    def raise_if_cancelled(self) -> None: ...
    async def claim_commit(self, run_uid: RunUid) -> None: ...  # atomic cancel check + noncancellable gate; launch-only metadata

class EventRegistry(Protocol):           # separate exact names, payload/change schema, routes, coalescing
    def register(self, event: EventRegistration) -> None: ...
class TopicRegistry(Protocol):           # exact bare names or parameterized key patterns, not event prefixes
    def register(self, topic: TopicRegistration, provider: TopicProvider) -> None: ...
class TopicProvider(Protocol):
    def matches(self, topic: Topic, event: DomainEvent) -> bool: ...
    async def snapshot(self, topic: Topic) -> RevisionedSnapshot | None: ...  # atomic provider view after S; None only if event-only
```

| Port | Purpose |
|---|---|
| `RunRepository` | Run directory, id reservation, run state, run log. |
| `HarnessExecution` | M05 application interface: `establish`, `invoke`, `stop`, `release`, `reconcile`, plus `cleanup_plan` (see Requires). |
| `HarnessLive` | M05 application interface behind `harness.live.get`; used for the lane "Live" line and the `live:` topic snapshot. |
| `LaunchPreparation`, `LaunchRecords` | M07 application interfaces: `resolve` a launch source, `freeze_configuration`, `freeze_weights`, `commit`, `discard`; read the frozen launch of a run. |
| `TemplateIdentity`, `RevisionReader` | M01 application interfaces: recompute identity at launch and at task boundaries; read the frozen task list and titles. |
| `ResultRecorder` | M02 application interface: open by TrialRef, operation-ID appends, receipt-backed seal, append run invalidation and finish retention. |
| `TaskVerifier` | M08 application interface: `verify_task`, `verify_final`, `cancel`, `reconcile`. |
| `MeasurementSummary` | M10 application interface: `for_trial(TrialRef)` elapsed/cost with basis; `MeasurementFinalizer.drain_run/finalize_run` is the awaited retention barrier. |
| `RunJudging` | M12 exact application interface below: judge_run → wait normally; internal stop(batch_id, cause) for an existing batch; recover(run_uid, cause) for engine loss or a terminal path without a batch. Each settled path returns the full durable OriginalJudgingSettlement. |
| `CompletionReports` | M13 awaited `ensure(run_uid) -> ReportStatus`, `get(run_uid) -> ReportStatus`, `wait(run_uid) -> ReportDisposition`; durable outcomes survive generic job-cache expiry. Public clients use `reports.status`. |
| `Clock`, `IdGenerator` | `engine/shared`. |
| `SocketServer`, `SessionTransport` | Daemon: accept connections, read and write newline-delimited JSON-RPC frames. |
| `InstanceLock` | Daemon: exclusive per-user lock so only one `axbenchmarkd` runs. |

#### Application (`engine/runs/application/`, `engine/daemon/application/`)

Interface offered to other engine modules (`engine/runs/application/interfaces.py`):

```python
class RunContext(Protocol):              # M08, M10, M12, M18
    async def configuration(self, trial: TrialRef) -> ConfigurationContext: ...  # frozen entry/roster, ResultId, task order, trial record dir
    async def scheduling(self, trial: TrialRef) -> SchedulingRecord: ...
    async def windows(self, run: RunUid) -> Sequence[ExecutionWindow]: ...   # M18: execution windows per configuration and trial
    def run_dir(self, run: RunUid) -> Path: ...                              # M18: <run dir>/telemetry/

class RunTimeline(Protocol):             # M10, M18
    async def intervals(self, run: RunUid) -> Timeline: ...   # durable intervals carrying TrialRef/task/phase; run-wide lifecycle intervals carry run_uid; launch/end/jobs

class RunInvalidationCoordinator(Protocol):  # M01/M05/M08/M12 run-scoped reads
    async def invalidate(self, run_uid: RunUid, identity_check: IdentityCheck,
                         detected_at: datetime, source: str) -> RunInvalidation: ...  # durable registration only; supervisor joins workers later

class ActiveRuns(Protocol):             # M01 (duplicate/revise warning on a revision with an active run, D9)
    async def for_revision(self, sha: Sha256) -> Sequence[ActiveRunRef]: ...  # ActiveRunRef(run_uid, run_label, origin); runs bound to sha that are not final

class SchedulingVocabulary(Protocol):    # M07 setup and launch review
    def default(self) -> ConcurrencyChoice: ...                                  # jobs = injected registry count (currently six)
    def validate(self, choice: ConcurrencyChoice) -> None: ...                     # whole-number jobs in 1..registry count, else InvalidJobs
    def validate_trials(self, trials: int) -> None: ...                           # raises InvalidTrials
    def queue_notes(self, entries: Sequence[EntryRef], choice: ConcurrencyChoice) -> Mapping[EntryId, str]: ...  # "queued after #1"
```

#### Cross-run decision admission

Publish this narrow injected application contract through Bootstrap in `engine/runs/application/interfaces.py`; [M12.4](../../M12/04-decision-engines-runtime.md) alone acquires decision leases around dispatch/warmup. Neither M12's grader nor M10's classifier bridge acquires a nested lease.

```python
class DecisionResourceLease(Protocol):
    async def acquire(self, request: DecisionLeaseRequest, cancellation: Cancellation) -> DecisionLeaseReceipt: ...
    async def cancel(self, request_id: DecisionLeaseRequestId) -> DecisionLeaseReceipt: ...
    async def settle(self, lease_id: DecisionLeaseId, evidence: ResourceSettlementEvidence) -> DecisionLeaseReceipt: ...
    async def admit_measurement(self, window: MeasuredWindowRequest, cancellation: Cancellation) -> MeasurementAdmissionReceipt: ...
    async def close_measurement(self, admission_id: MeasurementAdmissionId, evidence: WindowClosureEvidence) -> MeasurementAdmissionReceipt: ...
    async def reconcile(self, readiness: IndependentReadinessEvidence) -> LeaseReconciliation: ...
```

Requests bind stable request/operation/call or window IDs, scope, resource/route identity, frozen policy and deadline; settlement/closure evidence carries its stable operation ID. Durable receipts bind request/lease/admission IDs, DecisionCallId or TrialRef/task, policy, queue/grant/closure timestamps, actual intervals and overlap IDs, host/runtime/model/quantization/residency, unknown ownership, state (`queued`, `granted`, `cancelled`, `settled`, `server_state_unknown`), evidence digest and typed reason. Same-ID grant/settle/admit/close retries replay receipts without double grants or closes; conflicting inputs or cross-scope reuse fail. M11.3 owns `engine/runs/application/decision_resources.py`; M11.2 owns `engine/daemon/adapters/decision_resource_journal.py` with the cross-run durable journal; M11.4 wires startup reconciliation before fresh clean measurement admission.

Use one atomic, fair, bounded cross-run queue for measured-task admission and local/unknown-route warmup/load/inference through settlement. Default decisions defer until every managed measured window closes; remote classification may run live within its bounds. Never await another window's closure while holding its run lifecycle lock. Cancel queued requests without granting them; revalidate cancellation/stop at grant and task-start admission. Frozen opt-in `live_local_overlap` retains actual overlap and unknown attribution in receipts/comparison provenance. Transport cancellation is not proof of server idleness: bounded drain settles `server_state_unknown`, releases worker/run locks, and blocks new clean measurement until independent readiness evidence resolves activity; never kill an externally owned server. Reconcile crash-time grants and admissions before fresh measurement.

Both grading backends start only after execution seal and settle every original slot through M12; recovery never invokes either grading model. Observer completion is outside retention. No compatible ready profile means no analysis request; capture, native usage and statistics still work, and saved analysis remains readable.

| Use case | Kind | Behavior |
|---|---|---|
| `LaunchRun` | job `runs.launch` | Resolve the final effective source/adjustments/digest through M07; validate jobs/trials/nonempty entries. Before publishing any launch progress, await JobContext.retain_initial_progress with the first `LaunchStep(identity, running)`, containing final configuration/trial/task/task-run/logical-assessment totals (harness sessions only for `harness_review`) and M07’s optional trial_budget_warning. It remains in JobStatus.initial_progress after later progress, completion, cache expiry and restart; clients print it once by job ID without an unattended prompt. Check identity, reserve UID/label, freeze configuration and weights using one resolved value, and durably journal the commit intent. `commit(run_uid)` returns the immutable `FrozenLaunch` including the full M02 `RunBinding` and TrialRef roster. Open every result through `open_result(trial)`, append scoped scheduling with stable operation IDs, persist complete binding/state, then open M18 and hand off to supervision. No task, public launch success or active-run publication occurs before all expected result records exist. Cancellation/discard is allowed only before M07 commit; afterward roll forward the same UID/binding, expose `binding_pending` on failure, and use run stop once binding completes. A lost commit response is resolved through `LaunchRecords.get`, never by discard. [R034, R060, R067, R138, R158] |
| `SuperviseRun` | internal | One owned asyncio task per run; per-harness slots contain sequential configuration/trial loops. Persist transitions and timeline entries with stable IDs, await required M10 phase handlers, then publish observational events. Once all producers settle, enter `FinalizeRun`; after sealing and an identity check, await `batch_id = RunJudging.judge_run(run_uid)` then `RunJudging.wait(batch_id)` for the complete original settlement (terminal paths use stop/recover below), finish M02 retention, then publish terminal state and await M13 completion-report handling. Report generation waits on retention readiness and comparability, never on an undelivered UI event. |
| `ExecuteConfiguration` | internal | For each frozen TrialRef: establish `EnvironmentSpec.trial(trial, result_id)` from an isolated writable copy of the same approved immutable baseline bytes/flags, without consulting the original folder. Iterate only the frozen task order: one-shot `T1` once, or each ordered multi-step primary file with common context and its introduced prefix, withholding future supplied primary files. For each task, check identity, await atomic measured-window admission through `DecisionResourceLease`, then invoke once in a fresh process/conversation with a new InvocationId, competitor `TaskScope(trial, result_id, task_id, task_index, task_title)`, frozen settings and timeout; preserve exact input bytes and the continuing trial workspace. Legacy v1 keeps its approved task/input protocol. Await M05 output/usage/evidence drainage and close that measurement admission with durable window evidence; append task/evidence using M05's stable operation IDs. Await `TaskVerifier.verify_task(rid, trial, task, sha)` and its durable M02/M10 acknowledgements before `continuation`. Ordinary failures/timeouts keep the resulting workspace; halt classes mark remaining tasks/trials not_run. After the last task check identity, await `verify_final(rid, trial, sha)` (including its before/after identity checks) and release resources. No planner, extra fix/post-check repair invocation, retry or recovery path adds a task or invokes an already attempted task again. Normal harness model/tool calls and recorded transport retries within the task session do not increase logical task counts. [R034, R067, R069, R077] |
| `FinalizeRun` | internal | Join/cancel all task/check producers and durable evidence writes; check identity before finalization, routing a mismatch to the same coordinator while still finishing partial-data retention. Await M10 `drain_run(run_uid)` (including M05 context source closure, acknowledged capture work and durable gaps; capture/closure persistence failure blocks seal) → M18 `close(run_uid)` returning its durable telemetry receipt → M10 `finalize_run(run_uid, telemetry_receipt, terminal_cause)` durably retaining accepted request timing and pinned final-snapshot Files/LOC evidence/statistics before returning M02's measurement receipt → M02 `seal(rid, execution_status, receipt)` for every unsealed result. Missing timing/artifact evidence may close as partial/unknown; persistence failure remains pending. Journal each checkpoint. Once sealed, await the complete M12 OriginalJudgingSettlement → `finish_run_retention(run_uid, TerminalRetention)` → terminal status → `CompletionReports.ensure(run_uid)` and supervised report settlement. M18/M10 receipts and original checkpoint inputs pass unchanged through these awaits. Already sealed facts keep prior receipts. Failure before finish_run_retention leaves `retention_pending` with a typed error and readiness false; later report failure/pending never retracts settled execution retention or changes the terminal run outcome. |
| `RunInvalidationCoordinator.invalidate` | internal interface | M01/M05/M08/M12 identity failures propagate here from every run-scoped read, including final regression and judging after seal; never classify them as ordinary check/judge failures. Serialize by run, close admission and persist the first M02 `append_run_invalidation(RunInvalidation)`, register supervisor cleanup, then return the durable RunInvalidation without awaiting cleanup. After the originating worker unwinds, the independent supervisor stops/joins tasks, checks and active judging, awaits cleanup and the unsealed partial-data barrier, and ends interrupted. Every associated result/review is immediately effectively interrupted/non-comparable; original sealed facts and template binding remain unchanged. Duplicate detections return the first invalidation record; later evidence cannot overwrite its digests/paths. [R067, R139, R153] |
| `StopRun` | command `runs.stop` | Persist an idempotent scoped request under the run lifecycle lock before cancelling work. Configuration scope is limited to nonfinal configurations; remaining configurations continue. Run scope also covers finalization and judging: stop admission, cancel/join tasks/verifiers, await M05 cleanup/drain and `batch_for_run(run_uid)`; call internal `RunJudging.stop(batch_id, cause)` when a batch exists, otherwise `RunJudging.recover(run_uid, cause)` with zero model calls. Both return the durable complete settlement, retaining completed reviews and explicit remaining not-judged reasons. Record partial execution facts through the shared barrier; never reopen sealed results or cancel finalization persistence. A pending finalizer retains its original cause/digest; the later stop is separate lifecycle data. `run.stop.completed` acknowledges cleanup and durable scoped dispositions, with retention/report status or a typed pending error; it never falsely claims retention success. CLI/TUI stop/report waits settle on success, skipped/cancelled, failure or pending-error status, not only report-written. [R046, R139] |
| `PreviewStop` | query `runs.stop_preview` | Run and configuration gates use the same `allowed_actions` rules as status/commands; include judge cleanup in run scope and current finalization state. The command revalidates under the lifecycle lock. |
| `ReconcileRuns` | engine start | Before admitting readers, resolve M07 commit intents and roll forward all committed bindings with the original UID/full roster. Reconcile decision grants/admissions and unknown server state before fresh clean measurement, plus M05/M08/M12 orphan resources and retained invalidations; no task or judge invocation restarts. Runs lost before terminal settlement gain `engine_lost` lifecycle cause; accepted execution/measurement work and pending finalizer checkpoints finish with their original inputs/receipts. With no checkpoint, create one partial-data checkpoint. Await `RunJudging.recover(run_uid, engine_lost)` even when no batch exists, then finish retention with its full settlement; failures remain pending and block affected readiness, not fabricated completion. Recover report projections with CompletionReports.get/ensure/wait, never by replaying an original model call. |
| `TerminateForShutdown` | engine `SIGTERM` | Persist `engine_terminated`, stop/join owned process groups/checks/judges and run the partial-data barrier within shutdown time; durable unfinished checkpoints are recovered at startup. Do not treat a client disconnect or SIGHUP as shutdown. |
| `TrackObservation` | internal | Consumes session subscribe and drop events for `run:` topics, maintains `ObservationLog`, publishes `run.observation.changed`. Never touches execution. [R046] |
| `ListRuns`, `GetRunStatus`, `ReadRunLog`, `GetLaunchRecord` | query | Back the queries below; status combines `RunRecord`, `MeasurementSummary`, `HarnessLive` and `allowed_actions`. Work for ended runs from saved state, so `status` never needs an attached interface; `status --json` is how scripts read task failures of a completed run. [R051, R060] |
| `Hello`, `EngineStatus`, `StopEngine`, `ListMethods` | daemon | `engine.*`. `StopEngine` raises `EngineBusy` while runs or jobs are active. |
| `Subscribe`, `Unsubscribe` | daemon | Implement ARCHITECTURE’s exact handoff: atomically register queue and capture S under the state-publication boundary; read atomic provider snapshots after S; return S and deliver every queued event greater than S. Revisioned upserts/tombstones and entry IDs prevent stale replay overwrites. Replay requires matching epoch/topic set/retained projection/covered cursor. Snapshot resync clears dedup state and replaces subscription generation, including same-epoch overflow/compaction; ignore old-generation deliveries. |
| `GetJob`, `ListJobs`, `CancelJob` | daemon | `jobs.*`; cancellation sets the context flag under the same gate as claim_commit; work observes it at its next raise_if_cancelled, cleans up and only then becomes cancelled. A claimed commit returns jobs.not_cancellable. |

Finalization has one durable checkpoint containing selected unsealed result IDs, observation cutoff/digest, telemetry receipt/digest, complete launch digest and original terminal cause. Any retry—including engine loss or stop after a failed append—reuses those exact inputs and operation IDs. Later interruption is separate lifecycle/TerminalRetention data. No checkpoint means recovery may establish one partial-data checkpoint once. Fact mutations conflicting with a receipt are typed errors; sealed results never enter a new fact-writing checkpoint. M02 remains authoritative and `finish_run_retention` validates all expected trials and original-review dispositions before readiness. Judging duration/costs and later causes remain append-only outside competitor facts.

M12 publishes these exact signatures: `judge_run(run_uid: RunUid) -> BatchId`, `wait(batch_id: BatchId) -> OriginalJudgingSettlement`, `stop(batch_id: BatchId, cause: TerminalCause) -> OriginalJudgingSettlement`, `recover(run_uid: RunUid, cause: TerminalCause) -> OriginalJudgingSettlement`, and `batch_for_run(run_uid: RunUid) -> BatchId | None` (all async). `OriginalJudgingSettlement` binds the complete expected ResultId/TrialRef roster with roster/settlement digests, committed review IDs/digests and each GRADED/UNGRADED/FAILED/NOT_JUDGED disposition; pending slots are not settlement. Normal execution uses judge_run → wait. Stop/invalidation with a batch uses internal stop; no-batch terminal paths and engine-loss recovery use recover with the actual cause and zero model calls. Preserve the settlement/first accepted cause on retry; later causes stay M11 lifecycle data. Public RUN `judging.stop` delegates to `runs.stop`; the supervisor calls the internal port, never recursively dispatches the public command.

After finish_run_retention, await M13 `CompletionReports.ensure(run_uid) -> ReportStatus` exactly once logically (idempotent by RunUid), including stopped/interrupted/invalidated runs so they receive durable skipped reasons. A supervised completion task uses `get(run_uid) -> ReportStatus` for recovery/snapshots and `wait(run_uid) -> ReportDisposition` for settlement. Map `succeeded(ReportOutcome)` to RunStatus `completion_report.state=written`; preserve failed/cancelled/skipped reason/error and path/open-attempt data. M13 `reports.retention_pending` or `reports.persistence_pending` is a typed error stored as completion_report.state=pending with its unchanged error code and returned to waiters, never an endless wait. Report failure/cancellation/skip leaves the settled run outcome and M02 retention readiness unchanged. Persist revisioned RunStatus before notification; public clients can recover through `reports.status(completion_run_uid=run_uid)` or `reports.status(report_id=...)`. No receipt is modified and no UI event triggers required report work.

`RunInvalidationCoordinator.invalidate(run_uid, identity_check, detected_at, source)` is a published Bootstrap Protocol implemented by M11.4. Callers await its durable append/registration without joining their own cancelled task; the run supervisor performs cleanup after the originating producer has unwound. This avoids deadlock when an M08 or M12 worker reports the mismatch. A lifecycle lock serializes invalidation, stop, judge-start admission and terminal publication; a queued identity failure wins eligibility before any report becomes ready.

#### Adapters (`engine/runs/adapters/`, `engine/daemon/adapters/`)

| Adapter | Implements |
|---|---|
| `runs/adapters/fs_runs.py` | `RunRepository` on the layout below: JSON state with write-to-temp, fsync and rename, `fcntl` lock on `runs/.lock` for id allocation, JSON-lines run log. |
| `runs/adapters/rpc.py` | Maps `runs.*` DTOs to use cases and back, domain errors to `runs.*` codes; registers the `run:` and `live:` topic providers (the `live:` snapshot is `HarnessLive.snapshot`, the `run:<run_uid>/<cfg>` snapshot is M05’s explicitly resolved TrialRef configuration description (or null before selection) plus `ConfigurationStatus`). |
| `daemon/adapters/unix_server.py` | `SocketServer` on `asyncio.start_unix_server` at `~/.axbenchmark/run/engine.sock` (directory 0700, socket 0600), peer uid checked with `SO_PEERCRED` / `getpeereid`, newline-delimited JSON frames up to 16 MiB, concurrent requests per connection, responses matched by id. |
| `daemon/adapters/jsonrpc.py` | JSON-RPC 2.0 dispatch through the `MethodRegistry` in `axbenchmark.api`; typed errors as `{code: -32000, message, data: {code: "<namespace>.<reason>", field?, remedy?, ...}}`; protocol failures retain numeric JSON-RPC codes (-32700, -32600…-32603) and decode as ProtocolError. Undecodable DTO shape is -32602; a decoded domain rejection is a typed application error. Socket and in-process paths use the same codec. Server-to-client events are JSON-RPC notifications whose `method` is the event name and whose `params` is the `EventEnvelope` DTO. |
| `daemon/adapters/event_bus.py` | `EventPublisher` and subscription fan-out with the shared state-publication boundary: in-memory ring of the last 50 000 envelopes (or 30 minutes), per-session queues of 1 000 envelopes. Only registered replaceable observations (`harness.output.measured`, `harness.context.reported`) coalesce per TrialRef/invocation and object key, plus the latest context-snapshot projection keyed by full `ContextTarget={result_id,invocation_id,session_id,agent_id,window_id}`, retaining newest revision; logs, transitions, retained facts and job outcomes never coalesce. Durable context history, gaps, closure and analysis ledgers never rely on UI fan-out. Overflow abandons the old generation and performs the same S-before-snapshots handoff; `events.subscription.resynced` carries a full replacement Subscription ordered before its new-generation events; a slow client never delays a publisher. [R044, R047] |
| `daemon/adapters/job_runner.py` | `JobRunner` on asyncio tasks; ordinary finished-job cache lasts one hour; jobs with retained initial_progress have a durable JobStatus summary (including final result/error) loaded by jobs.get and job:<job_id> snapshots after finish/cache expiry/restart. Launch/report owner records remain durable too. Jobs outlive the initiating session; restart reconciles owner records as interrupted/dispositioned, never re-executes competitor or judge work. Classifiers are separate observer jobs writing analysis sidecars, never awaited by execution retention and never supplying competitor input; restart may reconcile only an already authorized observer job within its frozen remaining budget, with uncertain attempts retained and retries charged, never automatically resume imported jobs. |
| `daemon/adapters/job_store.py` | Durable retained preparation/JobStatus summaries at `~/.axbenchmark/jobs/<job_id>.json`, temp + fsync + replace. Retain initial preparation before progress publication; terminal state never clears it. Replay-window/job-cache compaction cannot delete this durable launch record. |
| `daemon/adapters/instance.py` | `InstanceLock` on `fcntl.flock` of `~/.axbenchmark/run/engine.lock`, pid file, stale-socket removal only by the lock holder. |
| `daemon/main.py` | `axbenchmarkd` entry point: acquire the lock, build the engine, run `ReconcileRuns` and the other modules' start-up use cases, serve, exit on `IdlePolicy` or `engine.stop`. Ignores `SIGHUP`; handles `SIGTERM` with `TerminateForShutdown`. |
| `daemon/composition.py` | Composition root: builds every module's adapters and use cases by constructor injection, the `MethodRegistry`, the `EventRegistry`, `TopicRegistry` and the `EventBus`; accepts injected feature registrations and returns an `Engine` object that both the socket server and `InProcessClient` dispatch into. |

The client package (`axbenchmark/client/`, importing only `api`) is part of this component:

```python
class EngineClient(Protocol):
    async def call(self, method: str, params: BaseModel) -> BaseModel: ...           # typed error → EngineError(code, message, field, remedy, data)
    async def subscribe(self, topics: Sequence[str], cursor: EventCursor | None = None) -> SubscriptionStream: ...
    async def close(self) -> None: ...
    connection_lost: Signal                                                          # resume last fully applied cursor; snapshot replaces projection/revisions
async def connect(*, autostart: bool = True) -> EngineClient: ...                     # socket client; performs engine.hello
class InProcessClient(EngineClient): ...                                             # accepts an injected API Dispatcher Protocol, same DTO codec; no import of engine adapters
```

`axbenchmark.client.connect(autostart=True)` starts the daemon when the socket is absent or refuses connections: it spawns `axbenchmarkd` with `start_new_session=True`, stdin from `/dev/null` and output to `~/.axbenchmark/run/engine.log`, then waits for the socket. The engine is therefore never in a client's process group or session, and closing the terminal that started it does not signal it. [R046, R139, R150]

#### Persisted state

The engine is the only reader and writer; no interface opens these files.

```
~/.axbenchmark/run/                      engine.sock, engine.lock, engine.pid, engine.log
~/.axbenchmark/runs/
  .lock
  <run_uid>/
    state.json           RunRecord: engine instance, run state and outcome with reason, per-configuration
                         and per-trial state, task states, queue order, scheduling records, stop requests,
                         identity invalidation, observation intervals
    binding.json         committed launch digest, complete roster, per-trial open/scheduling checkpoints
    finalization.json    durable barrier inputs/receipts, seals, original-review dispositions, later causes
    timeline.jsonl       revisioned phase records and required-handler acknowledgements
    events.jsonl         run log entries (append-only), source of #events and CLI progress
    configurations/<configuration_id>/trial-<n>/  per trial: M05 records (workspace, task invocation records and logs) and M08 verify/
```

The frozen launch records (template binding, resolved configuration, original weights, machine) are written by M07 under `~/.axbenchmark/launches/<run_uid>/` by the staged `config` and `weights` steps and immutable commit; M11 reads them through `LaunchRecords` and never rewrites them. Every transition/timeline entry is durably recorded before its awaited required handler and observational publication. Projection changes and their revisioned events cross the shared state-publication boundary together; recovery redelivers unacknowledged handlers by operation ID. Snapshots read that committed projection, never an unpublished repository version. Required accounting never subscribes to a bounded UI queue. Result records live under `~/.axbenchmark/results/` and belong to M02; M11 writes them only through `ResultRecorder`.

#### Owned processes

`axbenchmarkd` itself, one per user, detached from every client. M11 owns no other process directly: harness process groups are children of `axbenchmarkd` created through M05, and their lifetime is ended only by `runs.stop`, a task timeout (enforced by M05 with the deadline M11 passes), normal completion, engine termination or reconciliation. A client closing, a socket dropping or a subscription ending never reaches them. [R046, R138, R139]

### 2. API surface (`runs.*`, `events.*`, `jobs.*`, `engine.*`)

Run events use the `run.` prefix, job events `job.`, engine events `engine.`, matching the names already used in [ARCHITECTURE.md](../../../ARCHITECTURE.md).

#### Shared DTOs

| DTO | Fields |
|---|---|
| `ConfigurationRef` | `run_uid`, `configuration_id`, `entry_index`, `harness`, `model`, `effort_label` (requested; "harness default" when no effort is passed). |
| `SchedulingDTO` | `jobs`, `max_active`, `per_harness_limit`, `queue_order`, frozen `registered_harness_count` and selected harness set, `summary` (engine text derived from the effective policy, such as "one configuration per harness, up to 6 at once (jobs 6) · tasks sequential" for all six under the current default). |
| `TrialStatusDTO` | `trial: TrialRef`, `trial_count`, `result_id`, `state`, `tasks: list[TaskStatusDTO]`. Never omit run/configuration identity. |
| `TaskStatusDTO` | `trial: TrialRef`, `result_id`, `task_id`, `label` (`T1`…), `title`, approved `primary_file`, task index/count and current workspace snapshot reference, `state` (`pending`, `running`, `verifying`, `exited`, `interrupted`, `not_run`), `exit?` (M05 outcome and code), `checks?` (`ChecksSummaryDTO` from M08), `started_at?`, `ended_at?`, `internal_retries`. |
| `ConfigurationStatusDTO` | `ConfigurationRef`, `state`, `state_reason?: ErrorDTO` (for example `harness.auth_failed` or `runs.template_identity_invalidated` with message), `trial: TrialStatusDTO` (explicit current or last selected status, including its full TrialRef), `trials: list[TrialStatusDTO]`, `tasks: list[TaskStatusDTO]` (current or last trial), `tasks_finished`, `tasks_total`, `current_task?: {task_id, title, started_at}`, `queue_position?`, `elapsed: DurationDTO`, `cost: CostDTO` from M10 (full USD/display amounts, frozen currency/rates, billing/basis, coverage and unknown reasons; no client conversion), `notes: list[NoteDTO(code, text)]`, `capabilities: {can_open, can_live_view, can_stop}` each with `reason?`. |
| `LaneDTO` | `lane_index` (shared registry display order: currently Claude Code, Codex, Grok CLI, Pi, Cursor CLI, OpenCode), `harness`, `selected: bool`, `active?: configuration_id`, `queue: list[ConfigurationRef + queue_text]`, `configurations: list[configuration_id]`. Selected lanes and any unselected registry rows are derived from the run's registry projection, never a fixed-size list; every selected/queued configuration remains addressable. |
| `RunStatus` | `run_uid`, `run_label`, `origin`, `object_key`, `revision`, `template: {sha256, name, label}`, `state`, `outcome?: completed \| stopped \| interrupted`, `outcome_reason?: ErrorDTO` (for `runs.template_identity_invalidated`: approved and computed SHA-256 and changed paths in `data`), `trials: int` (frozen trial count), `counts: {running, queued, waiting, complete, halted, interrupted, not_run}`, `scheduling`, `frozen: {template_sha256, configuration_digest, weights_digest, launched_at}`, `lanes`, `configurations`, `restrictions: list[RestrictionDTO(action, available, text)]`, `observation: {observed_now, last_unobserved?: {from, to}}`, `stops: list[StopProgressDTO]`, `capabilities: {can_stop_run, can_detach, can_edit (always false while active, reason runs.frozen_while_active)}`, `judging_batch_id?`, `retention: {state, error?}`, `completion_report: {state: pending \| running \| written \| skipped \| cancelled \| failed, report_id?, job_id?, path?, open_attempt?, reason?, error?}`. |
| `StopProgressDTO` | `stop_id`, `scope`, `targets`, `steps: list[{step, state, text}]`, `cleanup?: CleanupReport` (M05), `retention: {state, error?}`, `completion_report`, `completed_at?`. |

`RunStatus.template` and launch/status projections carry the approved benchmark type, project type, derived target mode, legacy marker, ordered primary-file references and immutable baseline snapshot provenance from the frozen definition; the source path is never a runtime dependency or portable identity. Launch totals are engine-derived `C configurations × T trials × N tasks = C × T × N` logical competitor tasks, with `N=1` for one shot and the approved primary-file count for new multi-step definitions. Display task/check/final-regression/grading phases separately; model-request counts and grading-session/decision-call accounting keep their existing meanings. Live and retained details show the selected trial/task, ordered primary filename, workspace snapshot and “Task 1 of 1” for one shot; completion advances to final capture/checks and grading, never an invented `T2`.

#### Queries (`read`)

| Method | Request | Response | Errors | Capability flags |
|---|---|---|---|---|
| `runs.list` | `active?: bool`, `template_sha256?`, `limit = 50`, `cursor?` | `RunList`: `rows: [RunSummaryDTO(run_uid, run_label, origin, template, state, started_at, ended_at?, counts, scheduling.summary)]`, `next_cursor` | `runs.state_unreadable` (per row, as `read_failures`) | `can_attach`, `can_stop` per row |
| `runs.status` | `run_uid` | `RunStatus` | `runs.unknown_run`, `runs.state_unreadable` | as in `RunStatus` |
| `runs.log` | `run_uid`, `after?: int`, `before?: int`, `limit = 200` | `RunLogPage`: `entries: [RunLogEntryDTO(entry_id, entry_no, trial?, task_id?, at, source, kind, text, severity)]`, `complete` | `runs.unknown_run` | — |
| `runs.stop_preview` | `run_uid`, `scope: configuration \| run`, `configuration_id?` | `StopPreview`: `scope`, `targets: [ConfigurationRef]`, `cleanup: [CleanupItemDTO(kind: process\|service\|browser\|ports\|judge, item, action)]`, `outcome: [{subject, text}]`, `unaffected: [ConfigurationRef]`, `button_label`, `retention` | `runs.unknown_run`, `runs.unknown_configuration` | `can_stop` with `reason` (`runs.not_active`, `runs.configuration_not_active`) |
| `jobs.get` | `job_id` | `JobStatus(job_id, method, state, initial_progress?, progress?, result?, error?, started_at, finished_at?)` (runs.launch initial_progress is the immutable final-preparation LaunchStep) | `jobs.unknown` | `can_cancel` |
| `jobs.list` | `active?: bool`, `method?` | `list[JobStatus]` | — | `can_cancel` per job |
| `engine.hello` | `api_version`, `client: {kind: tui\|cli\|mcp\|script, version, pid}` | `Hello(api_version, engine_version, instance_id, session_id, started_at, namespaces)` | `engine.incompatible_version{engine_api_version, remedy}` | — |
| `engine.status` | — | `EngineStatus(pid, instance_id, started_at, socket_path, active_runs, active_jobs, sessions, idle_exit_at?)` | — | `can_stop` with `reason: engine.runs_active \| engine.jobs_active` |
| `engine.methods` | — | `list[MethodInfo(name, kind, safety, description, request_schema, response_schema)]` from the registry | — | — |

#### Commands and subscriptions

| Method | Request | Response | Errors | Safety |
|---|---|---|---|---|
| `runs.stop` | `run_uid`, `scope: configuration \| run`, `configuration_id?` (required for `configuration`) | `StopReceipt(stop_id, scope, targets)`; progress follows as events | `runs.unknown_run`, `runs.unknown_configuration`, `runs.not_active`, `runs.configuration_not_active` | `destructive` |
| `jobs.cancel` | `job_id` | `JobStatus` (state `cancelled` once the work observes it) | `jobs.unknown`, `jobs.not_cancellable`, `jobs.already_finished` | `write` |
| `engine.stop` | — | `{stopping: true}` | `engine.runs_active{run_uids}`, `engine.jobs_active{job_ids}` | `write` |
| `events.subscribe` | `topics: list[str]`, `cursor?: EventCursor` | `Subscription(subscription_id, cursor: EventCursor, mode: snapshot \| replay, reason?, snapshots)` | `events.invalid_topic{topic}`, `events.unknown_topic{topic}` (for example an unknown run) | `read` |
| `events.unsubscribe` | `subscription_id` | `{}` | `events.unknown_subscription` | `read` |

`runs.stop` explicitly stops run/configuration work (including run judging); public `judging.stop` delegates RUN batches to runs.stop (REJUDGE cancels only that additional batch), and `jobs.cancel` cancels pre-commit launch/jobs as documented by their owners. There is no detach method: detaching is closing subscriptions, which every client does by unsubscribing or disconnecting. [R046]

#### Jobs

| Method | Request | Progress payload | Result | Errors (synchronous / job) | Safety |
|---|---|---|---|---|---|
| `runs.launch` | exactly one of `draft_id`, `config_id`, `config_path` (absolute path of a complete configuration file), `preview_digest?` (interactive path), `execution?: {concurrency?: {jobs}}` (`--jobs N` overrides the saved setting), `exclude_entries: list[entry_id] = []`, `policy_overrides: {entry_id: "current"} = {}` | `LaunchStep(step: identity \| config \| weights \| bind, state: running \| done \| failed, digest?, totals: {configurations, trials, tasks, task_runs, logical_assessments, judge_sessions, decision_call_bound}, trial_budget_warning?)` (logical assessments count both grading backends; judge sessions count `harness_review` only; decision_call_bound is the frozen upper bound, not actual usage) | `LaunchResult(run_uid, run_label, origin, template_sha256, configuration_digest, weights_digest, scheduling, trials, configurations: [ConfigurationRef + queued: bool + result_ids per trial])` | Synchronous: `configs.*` from M07 (`configs.incomplete` with every issue, `configs.review_stale`), `runs.invalid_jobs{field: execution.concurrency.jobs}`, `runs.invalid_trials{field: execution.trials}`, `runs.no_entries`. Job: `templates.identity_mismatch` (step `identity`), `harness.clean_unavailable` with `data.assessments` (step `config`), `runs.state_unreadable`, `runs.binding_pending` (step `bind`, committed UID is retained for recovery). | `write` |

A second launch of the same effective source while freezing returns the running job’s JobRef (dedupe key includes resolved source/adjustment/preview digest). Cancellation and the commit-intent claim serialize under the job/lifecycle gate: cancellation that wins aborts staging; commit that wins makes the job noncancellable and later jobs.cancel returns jobs.not_cancellable with its run UID. A lost response/retry reads the binding journal and cannot allocate a second UID. Unattended launch uses exactly this method; there is no interactive variant. [R060, R138]

#### Events

Each registration declares the revisioned object changes needed to update its snapshot projection, including RunStatus retention/report/judging fields, independently of descriptive payload text. Append-only run logs retain entry IDs. Phase records require TrialRef whenever trial-specific; run-wide lifecycle intervals carry RunUid, and configuration-wide queue intervals carry its explicit ConfigurationId.

M11.2 registers the supplement's exact `measurements.context.snapshot.recorded`, `measurements.context.capture.closed`, `measurements.context.analysis.updated` and `measurements.context.gap.recorded` events on bare `measurements` with M10's revisioned scoped snapshot provider, and explicit `run:<run_uid>` / `live:<run_uid>/<configuration_id>` routes resolved from the full target. Keep `EventCursor={epoch,seq}`, the publication boundary and generation replacement unchanged; topic names are never inferred.

| Event | Payload | Topics | Consumers |
|---|---|---|---|
| `run.state.changed` | `run_uid`, `state`, `outcome?` (`completed`, `stopped`, `interrupted`), `outcome_reason?`, `counts`, `retention`, `completion_report` | `run:<run_uid>`, `runs` | RunScreen, Library `#env-bar` (M01/M15), M10, M18, CLI |
| `run.phase.started`, `run.phase.finished` | `run_uid`, `configuration_id?`, `trial?: TrialRef`, `task_id?`, `phase_id`, `operation_id`, `kind: queue \| verification \| judging`, `at` | `run:<run_uid>` | M10 timing, M18 windows |
| `run.configuration.changed` | `ConfigurationStatusDTO` (full replacement) | `run:<run_uid>`, `run:<run_uid>/<cfg>` | RunScreen lanes, RunConfigScreen run bar, M10, M18 |
| `run.task.started` | `TrialRef`, `result_id`, `TaskStatusDTO`, `from_workspace` (previous task's resulting snapshot, or the fresh immutable baseline copy for a trial's first task) | `run:<run_uid>`, `run:<run_uid>/<cfg>` | lanes, CLI progress |
| `run.task.ended` | `TrialRef`, `result_id`, `TaskStatusDTO`, `decision: continue \| halt \| last` | `run:<run_uid>`, `run:<run_uid>/<cfg>` | lanes, CLI progress |
| `run.retry.recorded` | `TrialRef`, `result_id`, `task_id`, reason (from `harness.retry.observed`) | `run:<run_uid>` | `#events`, M02 via the task outcome |
| `run.identity.invalidated` | `run_uid`, `invalidation_id`, `TrialRef?` (where detected), `source`, `IdentityCheckDTO` (approved and computed SHA-256, changed paths), `halting: true` | `run:<run_uid>`, `runs` | `#events`, RunScreen bar, CLI, M02 |
| `run.log.appended` | `RunLogEntryDTO` | `run:<run_uid>` | RunScreen `#events`, `run --no-tui`, `--attach --no-tui` |
| `run.stop.progressed` | `StopProgressDTO` | `run:<run_uid>` | StoppingScreen, CLI `stop` |
| `run.stop.completed` | `StopProgressDTO` with `CleanupReport` | `run:<run_uid>`, `runs` | StoppingScreen, CLI `stop` |
| `run.observation.changed` | `run_uid`, `observed_now`, `last_unobserved?` | `run:<run_uid>` | RunScreen reattach bar |
| `job.progress` | `job_id`, `method`, progress payload of that method | `job:<id>`, `jobs` | every job-driven screen and command |
| `job.finished` | `JobStatus` (result or typed error) | `job:<id>`, `jobs` | same |
| `events.subscription.resynced` | full replacement `Subscription` with new subscription_id, typed cursor, snapshot mode/reason and revisioned snapshots | the subscription | every subscriber; replaces its state |
| `engine.stopping` | `reason: idle \| requested \| terminated` | `engine` | clients print how to restart |

Exact topic routing (patterns are keys, not wildcard event selectors):

| Topic | Snapshot and registered event names |
|---|---|
| `run:<run_uid>` | Revisioned `RunStatus`; all run events named in the table above, `judging.batch.started`, `reports.report.written` selected by origin_run_uid/trigger, that run’s completion-report `job.finished`, `harness.output.measured`, `harness.context.reported`, `telemetry.collection.started`, `telemetry.collection.finished`, `telemetry.collector.failed`. |
| `runs` | Revisioned active `RunList`; `run.state.changed`, `run.stop.completed`, `run.identity.invalidated`. A run leaving the active list produces a revisioned membership tombstone; it does not delete the retained run object. |
| `run:<run_uid>/<configuration_id>` | `{status: ConfigurationStatusDTO, execution: ConfigurationExecution \| null}`; execution carries explicit TrialRef for the status-selected trial, null before any trial is selected. `run.configuration.changed`, `run.task.started`, `run.task.ended`, `harness.task.started`, `harness.task.exited`, `harness.log.appended`, `harness.settings.observed`, `harness.permission.decided`, `harness.environment.released`. Every scoped event carries TrialRef/ResultId, so a retained-trial screen filters exactly. |
| `live:<run_uid>/<configuration_id>` | Revisioned active `LiveTaskSnapshot` or tombstone/null; `harness.task.started`, `harness.task.exited`, `harness.output.measured`, `harness.context.reported`, `harness.reasoning.observed`, `harness.action.observed`, `harness.file.changed`, `harness.settings.observed`. Only active trial is implicit; response resolves its TrialRef. |
| `job:<job_id>`, `jobs` | `JobStatus` (including durable initial_progress after completion) and active job list respectively; `job.progress`, `job.finished` (active-list removal is a membership tombstone). |
| `engine` | `EngineStatus`; `engine.stopping`. |

`events.subscription.resynced` is subscription control, not a topic. Bare feature topics exist only when explicitly registered by their owner with a declared snapshot or event-only contract; event-only consumers re-query on resync. Registering methods creates no implicit events/topics. Validate exact names, payload/change schemas, key patterns, allowed routes and consumer declarations at startup; reject plural run/job event prefixes and bare `job` topic. Provider method/event additions require a registry change and contract test.

M10 receives `run.phase.started`, `run.phase.finished`, `run.state.changed` through the acknowledged in-engine path after timeline durability; ended is notification only. M18 windows use the same durable timeline/acknowledged boundary. Judging timing is append-only lifecycle data outside sealed execution facts. Client `run:` streams are never retention/accounting dependencies. Completion-report disposition is persisted in RunStatus before its UI notification, so expired job cache or disconnected observers cannot cause a hanging wait.

#### Error codes

| Code | Raised when |
|---|---|
| `runs.ambiguous_run` | CLI label resolution matched several visible runs; return candidate UIDs and origins, never choose silently. |
| `runs.binding_pending`, `runs.retention_pending` | A committed binding or finalization needs durable recovery; include UID, checkpoint and owning typed cause, readiness false. |
| `runs.unknown_run`, `runs.unknown_configuration` | No such run or configuration in that run. |
| `runs.not_active`, `runs.configuration_not_active` | Stop on a run or configuration that is already final. |
| `runs.invalid_jobs` | `jobs` is not a whole number from 1 through the current registered harness count; include that supported range in the typed error. |
| `runs.invalid_trials` | `trials` not a whole number ≥ 1. |
| `runs.template_identity_invalidated`, `runs.engine_terminated`, `runs.engine_lost` | Status reason codes only (`outcome_reason`, `state_reason`): why a run or configuration ended interrupted. Never raised by a call. |
| `runs.no_entries` | `exclude_entries` removes every entry. |
| `runs.state_unreadable` | Persisted run state cannot be read; message names the record and reason. Do not claim execution is unaffected when state cannot establish it. |
| `runs.frozen_while_active` | Capability reason only: editing frozen inputs or injecting hints while active. No method mutates them, so it is never raised by a call. [R047] |
| `events.invalid_topic`, `events.unknown_topic`, `events.unknown_subscription` | Subscription errors. |
| `jobs.unknown`, `jobs.not_cancellable`, `jobs.already_finished` | Job errors. |
| `engine.incompatible_version`, `engine.runs_active`, `engine.jobs_active` | Version negotiation and refused engine stop. |

Task outcomes (timeout, ordinary failure, authentication or configuration failure, model rejection, interruption) are data in `TaskStatusDTO` and `state_reason`, not RPC errors.

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `HarnessExecution.establish(EnvironmentSpec.trial(trial: TrialRef, result_id: ResultId))`, `.invoke`, `.stop`, `.release`, `.reconcile`; competitor `TaskScope(trial, result_id, task_id, task_index, task_title)` | M05 | Isolated copy of the same immutable baseline per trial, carried workspace with a fresh process/conversation per task, mode-specific exact input/prefix pack, stop with cleanup, orphan reconciliation. [R068, R077] |
| `HarnessExecution.cleanup_plan(run_uid, configuration_id \| None) -> Sequence[CleanupItem]` | M05 | StopScreen `#cleanup` preview before anything is stopped. |
| `HarnessLive.snapshot(run_uid, configuration_id)` (application interface of `harness.live.get`) | M05 | `live:` topic snapshot and lane live line. |
| Events `harness.task.started`, `harness.task.exited`, `harness.retry.observed`, `harness.output.measured`, `harness.context.reported`, `harness.environment.released`, and the exact other M05 event names in the routing table | M05 | Lane state, run log, topic contents. |
| `harness.live.get`, `harness.workspace.diff`, `harness.task.log`, `harness.configuration.describe` | M05 | HarnessLiveScreen and RunScreen compact `#log` (called by the screens). |
| `LaunchPreparation.resolve`, `.freeze_configuration`, `.freeze_weights`, `.commit`, `.discard`; `LaunchRecords.get` (application interfaces) | M07 | Launch validation, the separate freezes of configuration and original weights, frozen task list, `task_timeout` and concurrency for the task loop. |
| `execution.task_timeout`, `trials` and `monitoring` (mode and sampling interval) in the resolved configuration (default 3 h and 1, M11's `ExecutionDefaults`) | M07 | Frozen per-task deadline, trial count and the monitoring settings handed to M18. [R077] |
| `configs.*` error codes (`configs.incomplete`, `configs.review_stale`), `configs.launch_record` | M07 | Returned unchanged by `runs.launch`; LaunchRecordScreen data. |
| `TemplateIdentity.check(sha)`, `RevisionReader.open(sha)` | M01 | Identity step, in-run mutation detection, task order and titles. |
| `ResultRecorder.open_result(trial: TrialRef)`, `.append_task_outcome(rid, outcome, operation_id)`, `.attach_evidence(rid, evidence, operation_id)`, `.seal(rid, status, receipt)`, `.finish_run_retention(run_uid, TerminalRetention)` | M02 | One result per configuration and trial, linked by configuration id and trial index. [R077] |
| `ResultRecorder.append_scheduling(rid, SchedulingRecord, operation_id)` | M02 | Scheduling and concurrency retained with each result. [R045] |
| `ResultRecorder.append_run_invalidation(RunInvalidation)` (append-only run overlay, all trials including sealed, effective interruption and comparison exclusion) | M02 | Invalidated template claim without a replacement identity, for every result of a halted run. [R067] |
| `internal_retries` on `TaskOutcome.process` | M02 | Observable harness-internal retries stay recorded. [R077] |
| `TaskVerifier.verify_task`, `.verify_final`, `.cancel`, `.reconcile` (application interface); events `verification.task.completed` | M08 | Approved checks inside the task loop, stop and reconciliation; lane check counts. [R034] |
| `MeasurementSummary.for_trial(trial: TrialRef) -> (elapsed, cost)` and `MeasurementFinalizer.drain_run/finalize_run` (application interface) | M10 | Lane elapsed and cost with basis; never zero for unknown. |
| `RunJudging.judge_run(run_uid) -> BatchId`, `.wait(batch_id) -> OriginalJudgingSettlement`, `.stop(batch_id, cause) -> OriginalJudgingSettlement`, `.recover(run_uid, cause) -> OriginalJudgingSettlement`, `.batch_for_run(run_uid) -> BatchId \| None`; events `judging.batch.started`, `judging.batch.finished` | M12 | Judging only after every result seals and identity passes, one logical assessment per trial result for either backend (a fresh M05 session only for `harness_review`); no new judging after invalidation; stop/recovery returns durable remaining-not-judged reasons without restarting model calls; RunScreen switches to JudgingScreen. |
| `CompletionReports.ensure(run_uid) -> ReportStatus`, `.get(run_uid) -> ReportStatus`, `.wait(run_uid) -> ReportDisposition`; public `reports.status(report_id \| completion_run_uid)` | M13 | Durable completion projection and wait settlement; succeeded maps to written, failed/cancelled/skipped and typed retention/persistence-pending terminate waits. |
| Topic providers registered through `TopicRegistry` (`templates`, `results`, `catalog`, `environment`, `configs`, `verification`, `measurements`, `judging`, `planning`, `exchange`, `reports`, `telemetry`; M18 also routes `telemetry.collection.started`, `telemetry.collection.finished` and `telemetry.collector.failed` to `run:<run_uid>`) | each owner | Bare namespace topics and any snapshots they define. |
| `ExperimentTelemetry.open(run_uid, MonitoringChoice(mode, sampling_interval_s))` after complete binding; awaited idempotent `.close(run_uid) -> TelemetryFinalizationReceipt` after producers/drain, before M10 finalize and M02 seal | M18 | One host collection per experiment, retained with every result. |
| App shell: `app.client`, `.-compact` class, Library `ctrl+r` and palette "Reconnect to run", `#env-bar` | M15 / M01 | Hosting the run screens and reaching them. |
| RunConfigScreen, with `p` (push M08's `VerifyProgressScreen(trial: TrialRef)`) and `v` (push `HarnessLiveScreen(run_uid, cfg)`) in its key list | M05 | `enter` on a lane, `enter` in HarnessLiveScreen; verification progress and live view from the configuration detail. |
| `VerifyProgressScreen` | M08 | Verification progress over RunConfigScreen. |
| RunListDetail presentation-only widget/RunListDetailVM (`ListView #lane-list`, `Vertical #detail` with `#lane-detail`, `RichLog #log`, `Input #log-search`) | M15.1 | M11.5 consumes the widget, maps its VM and handles Selected/Search/Page/Action messages; M15.3 is later integration, never a prerequisite. |
| LaunchCheckScreen, ReviewLaunchScreen, LaunchRecordScreen | M01 / M07 | Launch flow before RunScreen; LaunchRecordScreen loads `configs.launch_record`. |
| `JudgingScreen` | M12 | Pushed by RunScreen on `judging.batch.started`. |
| `ActionState`, `ErrorVM`, `SubscriptionHub`, `AxModal` | M15 | Shared view-model and widget types used by the screens below. |

### 4. Screens

Shared rules, as in M01 and M05: each screen loads in an `exclusive=True` worker through the injected `EngineClient`; data widgets sit in `ContentSwitcher`s with `#x`, `#x-loading`, `#x-empty`, `#x-error`; `check_action` dims bindings from the view model's `ActionState` (M15's shared type) and never from a local rule; subscriptions go through M15's `SubscriptionHub`; `StopScreen` is the confirming modal for the destructive `runs.stop`; error notices print the engine's `message` and `remedy` verbatim. View models are frozen dataclasses built by pure functions; live updates go through a pure reducer `apply(state, envelope) -> state` followed by the builder. Glyphs (✓ ✗ ● ○ –) are a presentation mapping of `TaskStatusDTO.state` and `exit`, not a rule.

```python
@dataclass(frozen=True)
class LaneVM:
    slot: int                                  # registry-derived display position, #lane-<slot>
    view: Literal["body", "empty", "error"]
    harness: str
    state_glyph: str; state_word: str; config_label: str
    tasks: tuple[tuple[str, str], ...]         # ("T5", "●")
    progress: float                            # tasks_finished / tasks_total
    kv: tuple[tuple[str, str], ...]            # Now, Elapsed, Cost, Queue, Live
    note: str | None
    configuration_id: str | None
    selected_trial: TrialRef | None
    actions: Mapping[str, ActionState]         # open_configuration, live_view, stop  (names M15 reuses)

@dataclass(frozen=True)
class RunVM:
    title: str; bar: str; bar_failure: bool; frozen: str    # bar carries outcome_reason when interrupted
    lanes: tuple[LaneVM, ...]                  # dynamic run registry projection, harness display order
    list_rows: tuple[LaneRowVM, ...]           # all selected configurations, including queued siblings; #lane-list (M15)
    actions: Mapping[str, ActionState]         # stop_run, detach, edit
    restrictions: tuple[tuple[str, str, bool], ...]
    reattached: ReattachVM | None

def build_run_vm(status: RunStatus, meters: Mapping[str, LiveMeterDTO], focused: int) -> RunVM: ...
def apply_run_event(status: RunStatus, env: EventEnvelope) -> RunStatus: ...
def build_live_vm(snap: LiveTaskSnapshot | None, view: LiveViewState) -> LiveVM: ...
def build_stop_vm(preview: StopPreview) -> StopVM: ...
def build_stopping_vm(progress: StopProgressDTO) -> StoppingVM: ...
```

#### RunScreen — artboards RunOverview, RunQueued, RunSequential, RunFailures, RunReattached (compact layout: M15.1 RunListDetail component)

| Item | Specification |
|---|---|
| Class and file | `RunScreen(Screen)` in `axbenchmark/tui/screens/run.py`, constructed with `run_uid` and `reattached: bool`. Keep `Static #run-bar`, `Static #frozen` and the footer fixed. At 120×40 use a scrollable adaptive `Grid #lanes` with two columns and a third row for five/six harness lanes, creating `Vertical #lane-<slot> .pane` from the registry projection; each has `.lane-state`, `.task-strip`, `ProgressBar`, `.kv` (including "trial 2 of 3" when trials > 1). Keep lane title/state/trial/task and actions reachable; detailed logs belong to the selected configuration/detail view, with `RichLog #events` for the run log. Under `Screen.-compact` at 80×24 use the M15.1-owned presentation-only RunListDetail widget: scrollable `ListView #lane-list`, `Vertical #detail` with `#lane-detail`, `RichLog #log` and `Input #log-search`; there is no lanes table. All selected configurations, including all six harnesses and queued siblings, remain reachable. Wide content pressure may use this same list/detail widget through an exposed layout switch. M11 maps RunListDetailVM and handles Selected(key), Search(text), Page(after_seq), Action(name); the widget issues no API calls or scheduling decisions and requires no M15.3 implementation. |
| View model | `tui/viewmodels/run.py`: `RunVM`, `LaneVM`, `build_run_vm`, `apply_run_event`. Lane text comes from DTO fields (`notes`, `state_reason.message`, `scheduling.summary`, queue text); durations and tokens are formatted, never computed beyond `tasks_finished / tasks_total`. Counts/mode/stages come from the frozen engine projections. Preserve selected configuration, explicit trial, task, focus and scroll position across resize/layout switches; use stable identities across dynamic lane counts. Unknown usage/context/cost keeps its cause and never becomes zero. |
| Load | `events.subscribe(["run:<run_uid>"])` through the typed cursor/generation manager on mount; its `RunStatus` snapshot is the initial data, so no separate `runs.status` call is needed; a pending/final/failed report outcome comes from this snapshot as well as live events. Then `runs.log(run_uid, limit=200)` fills `#events`. |
| Subscriptions | `run:<run_uid>` (all `run.*`, coalesced `harness.output.measured` / `harness.context.reported` for the Live line). For the selected detail in either layout, also `run:<run_uid>/<cfg>` for the highlighted configuration, replaced when the highlight moves; `#log` loads `harness.task.log(target=selected_trial, task_id)`; current/last trial is selected explicitly from status, and switching trials cancels stale responses. `judging.batch.started` (or a reattached snapshot already in judging) for this run pushes M12's `JudgingScreen(run_uid, batch_id)` (navigation, no call). Unsubscribe everything on unmount; nothing else happens on unmount. |
| States | `ContentSwitcher #run-switch` with `#run`, `#run-loading` ("Attaching to run …"), `#run-error` (`runs.unknown_run`, `events.unknown_topic`). Each lane has `ContentSwitcher #lane-<n>-switch` with `#lane-<n>`, `#lane-<n>-loading`, `#lane-<n>-empty` (`LaneDTO.selected == false`: "No configuration in this lane"), `#lane-<n>-error` (`runs.state_unreadable` message verbatim; the screen re-subscribes after a back-off, which is a query retry, not a run action). `events.subscription.resynced` installs the replacement Subscription, clears old revision/entry dedup state, replaces RunStatus and ignores old-generation events. A newer object revision or tombstone wins over delayed replay/query data. |
| Variants | RunQueued and RunSequential are `RunStatus` with a non-empty lane `queue` or `scheduling.jobs == 1`; RunFailures renders `state_reason` and `notes` (`.-failure` style when `severity` is failure); a run halted for template identity renders `outcome_reason` (both digests and changed paths) in `#run-bar` and every lane as interrupted; RunReattached is `reattached=True` plus `observation.last_unobserved`, shown in `#run-bar` and a toast ("Reattached … No task was restarted"). None of them is a separate screen or call. |

| Binding | Action | API call |
|---|---|---|
| `enter` | `open_configuration`: push `RunConfigScreen(target=focused_trial)` (M05) for the focused lane; enabled from the `open_configuration` ActionState | none here (RunConfigScreen loads `harness.configuration.describe`) |
| `s` | `stop_configuration`: push `StopScreen(run_uid, scope="configuration", cfg)`; enabled from the lane's `stop` ActionState | none here (StopScreen issues `runs.stop`) |
| `S` | `stop_run`: push `StopScreen(run_uid, scope="run")`; enabled from the `stop_run` ActionState | none here |
| `v` | `live_view`: push `HarnessLiveScreen(run_uid, cfg)`; enabled from the lane's `live_view` ActionState | none here |
| `d` | `detach`: push `DetachScreen(run_uid)` | none |
| `e` | `edit`: push `LockedScreen(vm.restrictions)`. The footer key is rendered dimmed from the `edit` ActionState (`runs.frozen_while_active`); the key stays pressable so the reason can be shown | none |
| `tab`, `shift+tab` | next/previous reachable lane/action, then `#events`; scroll the focused lane into view, including the third row and queued configuration selectors | none |
| `↑ ↓` (list/detail) | move `#lane-list` cursor; detail follows, including every queued configuration | `events.subscribe` / `events.unsubscribe` for the highlighted configuration topic, `harness.task.log` |
| `/`, `n` (selected detail) | focus `#log-search`; submit | `harness.task.log(target=selected_trial, task_id, query=…)`; `n` steps through returned `matches` without a call |

#### HarnessLiveScreen — artboards HarnessLive, HarnessLiveStreaming, HarnessLiveLimited

| Item | Specification |
|---|---|
| Class and file | `HarnessLiveScreen(Screen)` in `axbenchmark/tui/screens/live.py`, constructed with `run_uid`, `configuration_id`. Tree as in the board: `Static #live-task`, `Vertical #live-meters .pane` (`Sparkline #live-rate`, `ProgressBar #live-context`), `RichLog #live-activity` (thinking in a `Collapsible`, actions), `Vertical #live-code .pane` (`Tabs #live-files`, `TextArea #live-diff`, read-only). Under `.-compact`, `#live-activity` is hidden and `a` shows it as an overlay. |
| View model | `tui/viewmodels/live.py`: `LiveVM(task_line, requested_vs_observed: tuple[ObservedVM, ...], rate_text, rate_source, spark: tuple[float, ...], context_text, context_ratio: float \| None, context_source, usage_line, activity: tuple[ActivityVM, ...], thinking_label, files: tuple[FileTabVM, ...], diff: DiffVM, actions)` built by `build_live_vm(snapshot, view_state)`. `LiveViewState(show_thinking, follow, file_index, compact_activity)` is local presentation state. An `Observed` value with status `unavailable` renders "? not reported" and no bar; `unverified` renders "? unverified"; each value shows its `source`. [R044] |
| Load | `events.subscribe(["live:<run_uid>/<cfg>"])`; the snapshot is `LiveTaskSnapshot`. Then `harness.workspace.diff(target=resolved_trial, task_id, path)` for the first changed file. |
| Subscriptions | `live:<run_uid>/<cfg>`. `harness.file.changed` updates `#live-files` and, for the shown file, reloads `harness.workspace.diff` (debounced to one call per second while following). `harness.task.started` resets the view from a fresh `harness.live.get` (context restarts with every task); all diff/log calls use its resolved TrialRef and discard responses for an older selection/generation. `harness.task.exited` with no next task switches to `#live-empty`. Unsubscribe on unmount. The screen never issues a command. [R044, R047] |
| States | `ContentSwitcher #live-switch` with `#live`, `#live-loading`, `#live-empty` (snapshot `null` or `harness.no_active_task`: "No task process is running in this configuration"), `#live-error`. HarnessLiveStreaming is `#live-diff` with `final == false` and the caret on the newest added line; HarnessLiveLimited is `can_show_reasoning == false` and `has_context == false`. |

| Binding | Action | API call |
|---|---|---|
| `esc` | `app.pop_screen`; nothing in the run changes | none (unsubscribe only) |
| `t` | `toggle_thinking`; dimmed unless `can_show_reasoning` | none |
| `f` | `toggle_follow` | none |
| `[`, `]` | `previous_file` / `next_file` | `harness.workspace.diff` for the selected path |
| `/` | `search` thinking and actions | `harness.task.log(target=resolved_trial, task_id, query=…)` |
| `enter` | `open_configuration`: push `RunConfigScreen(target=resolved_trial)` | none here |
| Open context detail | push M10 `ContextDetail` with resolved ResultId/TrialRef, task, invocation, session, agent and window; engine-projected capabilities supply analysis availability, disabled reason and M07 setup CTA when no engine is ready, while historical reads remain available; cancel/discard old-window responses and subscription generations on selection change; no frontend readiness or statistics math | supplement's scoped `measurements.context.*` read queries; navigation never dispatches classification |
| `a` (compact) | toggle `#live-activity` overlay | none |
| `tab` | `focus_next`: code, then thinking and actions | none |

#### DetachScreen — artboard RunDetach

`DetachScreen(ModalScreen[bool])` in `tui/screens/run.py`; tree `Vertical #detach .dialog` with `Static .notice`, `Static #reattach .kv`, `.dialog-actions`. View model `DetachVM(run_uid, reattach_rows)` from `build_detach_vm(run_uid)`: the three rows (Library `ctrl+r`, `axbenchmark --attach RUN_ID`, `axbenchmark status RUN_ID`) use the unambiguous RunUid; display the RunLabel/origin separately. No load call and no subscription.

| Binding | Action | API call |
|---|---|---|
| `esc`, `Cancel` | `dismiss(False)` | none |
| `Stop instead…` | dismiss and push `StopScreen(run_uid, scope="run")` | none here |
| `enter`, `Detach` | `dismiss(True)`; the app pops RunScreen (its unmount unsubscribes) and switches to the Library | none. Detach sends no command; the engine sees only subscriptions ending. [R046, R060, R139] |
| `tab` / `shift+tab` | focus | none |

#### StopScreen — artboard StopConfirm

| Item | Specification |
|---|---|
| Class and file | `StopScreen(ModalScreen[StopRequest \| None])` in `tui/screens/run.py`; tree `Vertical #stop .dialog` with `RadioSet #stop-scope`, `DataTable #cleanup`, `Static #stop-outcome .kv`, `.dialog-actions` (`Button #cancel`, `Button #stop`). |
| View model | `StopVM(scope_options, scope, cleanup_rows, outcome_rows, button_label, can_stop: ActionState)` from `build_stop_vm(StopPreview)`. |
| Load | `runs.stop_preview(run_uid, scope, configuration_id)`. Changing `#stop-scope` reloads it with the new scope. No dedicated subscription; stale previews are safe because `runs.stop` revalidates the same scope gate under the lifecycle lock, including a race into judging or terminal state. |
| States | `ContentSwitcher #stop-switch` with `#stop`, `#stop-loading`, `#stop-error`. When `can_stop` is false, `#stop` is disabled and the reason is shown. |

| Binding | Action | API call |
|---|---|---|
| `esc`, `#cancel` | `dismiss(None)` | none |
| `tab` / `shift+tab` | focus | none |
| scope change | reload preview | `runs.stop_preview` |
| `enter`, `#stop` | stop the chosen scope; on success `dismiss(StopRequest(stop_id))` and push `StoppingScreen(run_uid, stop_id)`; a typed error (`runs.not_active`, …) is shown in the dialog | `runs.stop(run_uid, scope, configuration_id)` |

#### StoppingScreen — artboard StopCleanup

`StoppingScreen(ModalScreen[None])` in `tui/screens/run.py`; tree `Vertical #stopping .dialog` with `Vertical #stop-steps` and `.dialog-actions` (`Button #hide`). View model `StoppingVM(title, steps: tuple[StepVM, ...], note, completed)` from `build_stopping_vm(StopProgressDTO)`. Load and subscription: `events.subscribe(["run:<run_uid>"])`, taking the `stops` entry with this `stop_id` from the snapshot and following `run.stop.progressed` and `run.stop.completed`. States `#stopping`, `#stopping-loading`, `#stopping-error`. Cleanup is shown finished only from the persisted completed stop state in a snapshot or `run.stop.completed`, after M05 cleanup and durable scoped dispositions; pending/failed retention is rendered separately, never as completed retention. [R139] Bindings: `esc`, `#hide` → `dismiss()`; cleanup continues in the engine; no call.

#### LockedScreen — artboard ActiveLocked

`LockedScreen(ModalScreen[None])` in `tui/screens/run.py`; tree `Vertical #locked .dialog` with `DataTable #allowed` and `.dialog-actions`. Data is `RunVM.restrictions` from `RunStatus.restrictions`, passed in by RunScreen; no load, no subscription, no call. States: a single `#locked` view. `esc`, `Close` → `dismiss()`. The rows are rendered as returned; the screen does not decide what is frozen. [R047]

#### Reaching a run

| Entry point | Behavior | API call |
|---|---|---|
| LaunchCheckScreen success (M01) | Push `RunScreen(run_uid)` from `LaunchResult.run_uid`. | none beyond RunScreen's own load |
| Library `ctrl+r`, palette "Reconnect to run" (M15/M01) | One active run: push `RunScreen(run_uid, reattached=True)`; labels remain display text. Several: the palette lists them. None: the binding is dimmed. | `runs.list(active=True)` |
| `axbenchmark --attach RUN_ID` | Opens the TUI directly on `RunScreen(run_uid, reattached=True)`. | `results.resolve_run(RUN_ID)` to obtain an unambiguous UID, then `runs.status` and RunScreen's load |

#### Screens owned elsewhere that consume M11

| Screen (owner) | M11 data |
|---|---|
| `RunConfigScreen` (M05) | Explicit TrialRef/ResultId constructor and `run:<run_uid>/<cfg>` topic; `#run-bar` from `ConfigurationStatusDTO`; `s` → StopScreen, `d` → DetachScreen, `v` → HarnessLiveScreen, `p` → M08's VerifyProgressScreen (both `p` and `v` in its key list). |
| `LaunchCheckScreen` (M01), `CleanBlockedScreen` (M05) | `runs.launch` job progress and errors; `jobs.cancel`. |
| Library `#env-bar` (M01/M15) | `runs.list(active=True)`, `run.state.changed` on topic `runs`. |
| Every job-driven screen (M01, M02, M03, M04, M12, M13, M16, M17) | `jobs.get`, `jobs.cancel`, `job.progress`, `job.finished`, `events.subscribe`. |
| App shell (M15) | `engine.hello` on start; `engine.incompatible_version` shown with its remedy; `engine.stopping` notice. |

### 5. CLI

M14 owns the commands; these reach M11. Exit codes follow M14/ARCHITECTURE: 0 completed operation, 1 typed application failure or stopped/interrupted run, 2 parser/input/consent misuse, 3 engine transport/version failure. A decoded invalid_jobs/invalid_trials domain error is exit 1, not usage exit 2.

| Command | Methods |
|---|---|
| `axbenchmark run --config FILE [--jobs N] [--no-tui] [--no-wait-report]` | `engine.hello`; `runs.launch(config_path=FILE, execution={concurrency: {jobs: N}})` (omit execution override when absent). Follow the launch job with `events.subscribe(["job:<id>"])`/`jobs.get`; read durable JobStatus.initial_progress for final totals/warning and deduplicate printing by launch job ID, even if the job already finished before subscribing. Print typed application errors verbatim and exit 1; local parser/input/consent misuse exits 2. Without `--no-tui` open RunScreen after complete binding. With `--no-tui`, follow revisioned RunStatus snapshots/events and print task/run logs. Completed run exits 0, including task failures and failed/cancelled/skipped completion reports; stopped/interrupted exits 1 with reason. Wait for durable report disposition unless `--no-wait-report`; typed binding/retention/report-persistence pending exits 1 without claiming terminal success. Ctrl-C detaches and prints UID-based attach/status/stop commands; the run continues. [R050, R060, R134, R138, R158] |
| `axbenchmark --attach RUN_ID [--no-tui]` | `runs.status`, then RunScreen or, with `--no-tui`, `events.subscribe(["run:<run_uid>"])` plus `runs.log` for recent lines. Never launches or restarts. [R049] |
| `axbenchmark status RUN_ID` | `runs.status` (saved state, works for ended engine-owned runs and with no interface attached); prints outcome, `outcome_reason`, and per configuration and trial the task and check outcomes; `--json` prints `RunStatus`. [R051] |
| `axbenchmark stop RUN_ID [--config ID]` | `runs.stop(scope=run \| configuration)`, then `events.subscribe(["run:<run_uid>"])` until its snapshot stop receipt is complete or `run.stop.completed` arrives; a pending/failed typed retention status exits with its reason rather than hanging; prints the `CleanupReport` and recorded outcomes. [R052, R139] |
| `axbenchmark engine status`, `axbenchmark engine stop` | `engine.status`, `engine.stop` (`engine.runs_active` lists the runs to stop first). |
| Proposed for M14: `axbenchmark runs [--active]`, `axbenchmark jobs [--active]`, `axbenchmark jobs cancel JOB_ID`, `axbenchmark events TOPIC…` | `runs.list`, `jobs.list`, `jobs.cancel`, `events.subscribe` (JSON lines; a debugging aid and the model for the future MCP client). |

CLI run arguments accept UID or an unambiguous local label resolved through `results.resolve_run`; all subsequent API requests and topic keys use the returned UID. `run --no-tui` also exits 1 on a typed binding/retention-pending persistence failure with its UID/checkpoint; this does not falsely mark the recovering run terminal. Completion-report waits inspect snapshot `completion_report` and `retention`, plus M13 `reports.status(completion_run_uid=run_uid)` as well as events; failed/skipped/cancelled/pending-error states terminate the wait with the typed reason, and reconnect cannot lose the outcome. The immutable initial LaunchStep lives in JobStatus.initial_progress independently of latest progress, job.finished and the replay cache; final totals and the optional warning remain available to print once even after a missed launch stream.

Every CLI command starts with `engine.hello` through `connect(autostart=True)`; an incompatible major version exits 3 with the restart instruction.

### 6. Headless verification

Children specify exact source/test ownership and runnable acceptance. Parent completion requires these real-provider checks in addition to child tests:

| Gate | Required evidence |
|---|---|
| Foundations | M01/M03 fixture feature runs through actual socket and InProcessClient dispatch, job and subscription code without scheduler imports. Numeric protocol/application errors round-trip equally. Validate exact publisher/event/topic/consumer registries and import boundaries. |
| Launch/scheduling | Crash or cancel before commit leaves no records; fail after commit at each result-open checkpoint and recover the same UID/full binding without execution until the full roster exists. Same-label imported runs stay distinct. M11.3 extends its existing four-harness queue fixture and five-harness subset coverage with all six registered harnesses plus a same-harness queued entry: default six active, one per harness, entry-order eligibility, selected-subset bound, explicit saved jobs=4/jobs=5 preserved, invalid range rejected, jobs=1 serialized. Registry changes/reconnect/recovery cannot alter the frozen effective policy. Repeated fresh trials, timeout continuation and halt classes preserve the frozen order and no task retries. Exercise both modes and target modes: exact T1 versus ordered primary files, fresh sessions with carried workspace and introduced-prefix inputs, identical approved baseline copies after source change/removal, C × T × N totals (N=1 for one shot), separate checks/grading and no planner/automatic repair. Preserve legacy v1/built-in task semantics and no-harness manual authoring boundaries. Final totals/warning are durably retained before launch progress; subscribe only after job completion/cache expiry/restart and still recover them from jobs.get/job snapshot exactly once. |
| Retention | Delay real M05 usage/output and M08 evidence acknowledgements; complete sequential M18 energy collection and M10 finalization. Assert M02 receipt-backed seals and original-review settlement precede finish retention, terminal events and report/export. Live, retained, immediate report and imported ZIP facts agree. Fault after each checkpoint and after some seals: preserve prior digest/cause/receipts, finish only pending work, never append facts after seal. |
| Identity/stop | Mutation during last task, final regression and judging routes M01/M05/M08/M12 errors to one coordinator. First durable overlay excludes every result/review, retains both digests/paths and original bindings, cancels judges and cleans resources. Race duplicate detections/run stop/config stop; one cleanup, deterministic effective status. Normal judge_run → wait and stop/recover return complete roster settlements. No-batch stop/invalidation/recovery creates no model call; public RUN judging.stop delegates once to runs.stop. TUI/CLI can stop during judging/finalization while final configurations cannot be separately stopped; ensure/get/wait and reports.status settle every report outcome/pending error after cache expiry. |
| Observation | Inject update between two snapshots; return captured S and replay it without loss. Deliver older snapshot-covered event, tombstone/recreate, lower-sequence restart, compaction, topic change and overflow; generations/revisions prevent stale overwrites. Slow/disconnected clients cannot delay process drain or required accounting. Reconnect never invokes a task. |
| Decision admission/statistics | [M11.3](../../M11/03-run-scheduler.md) owns `tests/engine/runs/test_decision_resources.py`: race cross-run task starts against warmup/inference, queue fairness, cancellation at grant, idempotent closure and recorded opt-in overlap. [M11.4](../../M11/04-stop-recovery-invalidation.md) owns `tests/integration/test_decision_lifecycle.py`: transport cancellation/unknown server state releases worker locks but blocks clean admission; crash grants reconcile, both grading backends recover without inference, and every original slot settles. Its `tests/integration/test_statistics_finalization.py` delays accepted timing/final-snapshot persistence to block receipts/seals, permits explicit unknown evidence and verifies the unchanged M18 → M10 → M02 → M12 → retention → terminal → report chain. |
| Context lifecycle | M11.4's `tests/integration/test_context_lifecycle.py` delays capture acknowledgements/closure and durable gaps to block premature seals; covers partial stop/recovery, late classifier sidecars without changed facts, headless retention with no UI dependency, and old-window response/generation rejection. |
| Screens | M11.5 extends its existing four-lane fixtures and five-harness subset coverage through M15 Pilot at 120×40 and 80×24: all six registry lanes plus queued configurations are keyboard/scroll reachable, adaptive two-column/third-row and shared list/detail views preserve configuration/trial/task/focus/scroll on resize, and no fixed lane count or client scheduling rule remains. Cover both modes' task/stage/count labels and separate final checks/grading, unknown measurements with causes, all boards/states, explicit trial navigation/logs during another active trial, dimmed server capabilities, run-level judging/finalization stop, hidden continuing cleanup, retention failure, report disposition, stale responses and same-epoch resync. Only explicit confirmation issues one runs.stop. |

Wireframe follow-up (no board edits in this change): `RunOverview`/`RunReattached` need registry-derived six-lane/queued variants, mode/stage progress, finalizing/retention-pending and durable report-disposition variants; `StopConfirm` needs run-level judging/finalization with completed configuration stop disabled; `StopCleanup` needs separate cleanup-complete versus retention-pending/error; `HarnessLive` and RunListDetail need explicit trial identity/selection for historical navigation. Keep existing artboard names and the shared compact list/detail pattern while applying the binding adaptive wide layout; M15 owns shell integration, M12 judging controls and M13 report states. These pending boards and real-provider gates prevent declaring the parent implemented from specs or fixture tests alone.

## Bounded artifact-evaluation admission

The [agentic quality contract](../../quality-judges/AGENTIC.md) adds an M08 verification consumer to the existing managed-inference admission gate; it does not add another queue, scheduler or System One transport. Extend the shared request union with a verification scope/budget/resource-policy branch bound to result/trial/check/scenario/attempt. Local or unknown-routing artifact inference defaults to waiting until no managed competitor measured window is active across runs, with bounded waiting, cancellation and settled/unknown resource evidence; any permitted overlap is explicit, frozen and disclosed. No admission wait holds a lock needed to close those windows. M08 owns the approved test and its processes, M10 records separate verification accounting, and M12 only reads final evidence. Never turn a product-model call into a DecisionRequest purpose or fabricate a grading invocation. This gate creates no new implementation node or dependency cycle; its declarations are Bootstrap contracts and real integration remains required.

## Pending human quality review

[M12.5](../../M12/05-human-review-web.md) adds human waiting within the existing `judging` RunState, exposed as `wait_reason=human_input`; it is not completed quality or `retention_pending` storage failure. Admission follows all expected trial execution, verification/accounting, execution sealing and the existing identity gate. The durable batch schedules one original browser-open attempt; user-selected Human is an explicit interactive grading phase even when competition used `--no-tui`.

M12 prepares human cases and releases automated FIFO slots, model/resource leases and run locks. `RunJudging.wait` can await a person without blocking other runs or machine grading. Do not finish original review settlement, M02 run retention, exports or the final completion report from drafts or disconnects. Actual submission/ungraded/skip/cancel receipts settle the expected roster. Stop/invalidation serialize against submit and revoke unfinished tickets; ordinary detach and browser failure do not cancel.

Extend recovery handling to match `RunJudging.recover -> OriginalJudgingSettlement | HumanRecoveryPending`: a recoverable sealed human-wait run remains in judging, resumes its durable drafts/case references and keeps required host activity without auto-opening a browser or invoking a model. SUBMITTING replays only immutable prepared review intents. The existing engine-lost interruption rules still apply to automated grading and interrupted execution; do not discard a persisted human draft as an unfinished model response. Identity invalidation always wins. Pending human sessions/additional reviews count as daemon activity so idle shutdown cannot remove their host; normal `engine.stop` still refuses active work, while process/system shutdown checkpoints and revokes credentials.

M11 status/CLI/TUI show the human wait distinctly, including local reopen route, durable batch/case references and stop action. Human form credentials never enter events/logs, permanent run bindings, report commands or exports; the explicit local open/reopen response is a private handoff only. Add crash/stop/idempotent-submit races and concurrent unrelated-run fixtures without introducing a new scheduler or measurement-admission lease.
