# M11 — Run scheduling and persistent lifecycle

Status: proposed requirements. Engineers use this module to connect launch validation, execution scheduling, observation, stopping, and retained results while keeping execution independent of every interface. Runs belong to the headless engine; the TUI, the CLI and a later MCP server observe and control them through the same API, and no behavior depends on which interface started a run or whether one is attached. [R150] The [product specification](../SPEC.md) is authoritative; requirement IDs identify its assigned source contracts. [ARCHITECTURE.md](ARCHITECTURE.md) fixes the engine structure; the Implementation section below applies it.

## Launch boundary and invariants

Execute selected configurations against the pinned template revision, expose progress and measurements, preserve evidence, and execute the approved checks. [R034]

Before execution, the approved specification, task prompts, acceptance checks, grading rubric, execution protocol, and starting snapshot form an immutable template revision. Recompute its SHA-256 and bind each result to that identity. Separately freeze the run configuration and original scoring weights before launch. Template inputs must not change during execution. A detected mutation invalidates the result's claim to that template; it must not silently receive a replacement identity. [R067]

During active execution, permitted user actions are inspection, detachment, reconnection, and explicit stopping. Frozen prompts, selected models, and original weights cannot be edited, and implementation hints cannot be injected into the active comparison. These restrictions apply regardless of which interface exposes the run. [R047]

Unattended execution requires a complete configuration and does not pause for interactive questions. All model work runs headlessly, including work reached through the orchestration workflow. [R060, R138]

## Scheduling contract

By default, run one configuration per selected harness concurrently, with at most four configurations active. Additional configurations for the same harness queue and execute sequentially. Tasks within each configuration always execute sequentially. [R045, R138]

Provide sequential execution through `--jobs 1` and an equivalent TUI setting. In that mode, configurations execute one at a time while retaining their sequential task order. Record scheduling and concurrency in results so later inspection can identify the execution conditions. The specification does not prescribe how to choose between eligible queued configurations. [R045, R138]

Default to one trial per configuration and a three-hour timeout for each task. A failed task must not automatically be rerun to improve its result. Observable retries performed internally by a harness remain part of the recorded execution; they do not justify an additional orchestrator retry. [R077]

## Persistent lifecycle and observation

The following are conceptual lifecycle boundaries, not required status names or storage fields. The process architecture is the headless engine of [ARCHITECTURE.md](ARCHITECTURE.md): runs execute under the engine process, never under an interface. [R150] The states and records that implement these boundaries are implementation decisions listed under Implementation.

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

The orchestration result contract includes the bound template identity, frozen launch configuration and original weights, scheduling and concurrency, and preserved execution outcomes and evidence. Progress and measurement information must support observation of the pinned run. These are conceptual obligations; this module does not establish an exact result schema. [R034, R045, R060, R067, R077, R139]

## Dependencies and integration boundaries

| Module boundary | Required integration |
|---|---|
| [M01 template identity](01-template-library-identity.md) and [M07 launch configuration](07-run-configuration.md) | Supply the immutable approved definition and separately frozen launch choices; orchestration recomputes and binds template identity before execution. [R067] |
| [M05 harness execution](05-harness-execution-isolation.md) | Execute model work headlessly, expose task outcomes and observable internal retries, and support cleanup of child processes and application services on explicit stop. [R046, R077, R138] |
| [M08 verification](08-verification-evidence.md), [M10 measurements](10-measurements-cost.md), and [M02 retained results](02-retained-results-comparability.md) | Execute approved checks, preserve evidence, expose measurements, and retain scheduling and actual execution failures. [R034, R045, R060, R139] |
| [M15 TUI](15-terminal-interface.md) and [M14 CLI](14-command-line-interface.md) | Present the scheduling and lifecycle behavior that this module owns in the engine, including sequential mode, unattended execution, attachment without restart, restricted active controls, and explicit stopping. Both are clients of the same API and evaluate none of these rules. This module provides the live observations of each active task process to an attached interface; attaching, watching, or leaving a live view never changes execution. [R044, R045, R046, R047, R060, R138, R150] |

## Acceptance criteria

- Select all four harnesses with extra configurations for one harness: observe at most one active configuration per harness, up to four total, sequential same-harness queuing, sequential tasks, and recorded scheduling. Repeat using each interface's sequential setting and observe one configuration at a time. [R045, R138]
- Launch with complete unattended configuration: observe headless execution, progress, measurements, approved checks, and retained evidence without interactive questions. [R034, R060, R138]
- Detach, close, and reconnect during a task: execution continues and attachment does not restart it. Explicitly stop a configuration and a whole run in separate cases; their child processes and application services are cleaned up. [R046, R138, R139]
- Attempt active prompt, model, or original-weight edits and hint injection: none changes the comparison. Verify separate launch freezes, recomputed identity binding, and invalidation of the identity claim on template mutation. [R047, R067]
- Verify the one-trial and three-hour per-task defaults. Exercise ordinary failure and timeout: later tasks use the resulting workspace without automatic reruns. Exercise authentication/configuration failure: only that configuration halts. Actual interruptions, failures, and observable internal retries remain saved. [R060, R077, R139]

## Implementation

This section applies [ARCHITECTURE.md](ARCHITECTURE.md). Everything here is an implementation decision; the product contract above and [SPEC.md](../SPEC.md) are unchanged by it. M11 is where the headless engine itself lives: the daemon process, its socket API, sessions, subscriptions and jobs, plus the run lifecycle that every interface observes. [R150]

### 1. Engine component

Two packages:

- `axbenchmark.engine.runs`: run launch, scheduling, the per-configuration task loop, stop, reconciliation and run queries.
- `axbenchmark.engine.daemon`: composition root, JSON-RPC socket server, sessions, the event bus and subscriptions, the job runner, engine lifecycle. It follows the same four layers, with `composition.py` as the only module that imports every other module's adapters.

M11 never spawns a harness process itself. Every competitor process is started, observed and ended through M05's `HarnessExecution`; checks through M08; measurements through M10; result records through M02.

#### Domain (`engine/runs/domain/`, `engine/daemon/domain/`)

Frozen slotted dataclasses and enums; no I/O, no asyncio, no pydantic.

| Type or rule | Content |
|---|---|
| `RunId` | `YYYY-MM-DD-<suffix>` from the local launch date and the next free letter suffix (`a`…`z`, then `aa`…). The run directory name; shared through `engine/shared` because M02, M05 and M10 key records by it. |
| `ConfigurationId`, `EntryIndex` | Stable id of one competitor entry of the frozen launch and its 1-based position in entry order (`#1`…`#n`). Several entries of one harness are distinct configurations. [R017, R045] |
| `SchedulingPolicy` | `jobs: int` (1–4), `max_active = jobs`, `per_harness_limit = 1`, `queue_order = ENTRY_ORDER`. `DEFAULT = SchedulingPolicy(jobs=4)`; `--jobs 1` and the TUI sequential setting give `jobs=1`. M07 stores the choice as `execution.concurrency` (`ConcurrencyChoice`, M11's vocabulary: the `jobs` value). Entry order is the chosen tie-break; the SPEC does not prescribe one. [R045, R138] |
| `next_starts(state: ScheduleState, policy) -> tuple[ConfigurationId, ...]` | Pure scheduler. Starts queued configurations in entry order while `active < max_active` and the configuration's harness has no active configuration. Called after launch and after every configuration end. Tasks inside a configuration are never scheduled here; they are a sequential loop. [R045] |
| `SchedulingRecord` | Policy, queue position, start and end time, and the configurations active at the same time. Handed to M02 for every result. [R045] |
| `ExecutionDefaults` | `trials = 1`, `task_timeout = 3 h`. The frozen launch carries the effective values; M11 adds no retry field anywhere. [R077] |
| `ConfigurationState` | `queued`, `preparing`, `running`, `verifying`, `complete`, `halted`, `interrupted`, `not_run`. Transitions are a pure function `transition(state, event) -> state` that rejects any edge not in the table below. |
| `TaskState` | `pending`, `running`, `verifying`, `exited(ExitClassification)`, `interrupted(InterruptionCause)`, `not_run`. Process outcome and check outcome stay separate fields. [R076, R077] |
| `continuation(exit: ExitClassification) -> Continue \| Halt` | `exited` (any exit code) and `timed_out` → `Continue` from the resulting workspace. `auth_failed`, `config_failed`, `model_rejected` and `launch_failed` (the harness could not start with the frozen configuration) → `Halt` this configuration; the others continue. `stopped` never reaches this rule (stop handles it). There is no rule that returns "retry". [R077] |
| `InterruptionCause` | `stopped_by_user(scope)`, `engine_terminated`, `engine_lost` (found at reconciliation). There is no member for a client disconnecting, so a detach cannot be recorded as an interruption by construction. [R046, R060, R139] |
| `RunState` | `launching`, `active`, `judging` (all configurations ended, M12 judging in progress), `ended` with `RunOutcome` `completed`, `stopped` or `interrupted` (engine terminated or lost). Plus a `stopping` overlay per scope while cleanup runs. |
| `allowed_actions(run, configuration?) -> ActionSet` | The capability rule for interfaces: inspect, detach, reconnect always; stop while the scope is `queued`, `preparing`, `running` or `verifying`; live view while a task process runs; edit of prompts, models, efforts, original weights and hint injection never while `active` (reason `runs.frozen_while_active`). The `restrictions` table drawn on ActiveLocked is `allowed_actions` rendered as rows. [R047] |
| `ObservationLog` | Intervals during which no session subscribed to the run's topic, from session events. Lets RunReattached show the detached interval; it is presentation data and never an execution fact. [R046] |
| `RunLogEntry` | `entry_no`, `at`, `source` (`run`, a harness id, `verify`, `judge`), `kind`, `text`, `severity` (`info`, `failure`). The human run log (`#events`); text is composed in the engine so every interface shows the same sentence. |
| `StopPlan` / `StopProgress` | Scope, target configurations, cleanup items from M05, recorded-outcome preview; progress steps `terminate`, `cleanup`, `save_interrupted`, `mark_not_run`, each `todo`, `now` or `done`. [R046, R139] |

`ConfigurationState` transitions: `queued → preparing → running ⇄ verifying → complete`; `running|verifying → halted` (continuation `Halt`); any non-final state `→ interrupted` (stop or engine loss); `queued → not_run` (run stopped before it started). `complete`, `halted`, `interrupted` and `not_run` are final.

Daemon domain (`engine/daemon/domain/`):

| Type or rule | Content |
|---|---|
| `EventEnvelope` | `epoch` (engine instance id), `seq` (monotonic per epoch), `at`, `name` (`<namespace>.<noun>.<verb>`), `topic_keys`, `payload` (a domain event). |
| `Topic` | Parsed form of a topic string: `run:<run_id>`, `run:<run_id>/<configuration_id>`, `live:<run_id>/<configuration_id>`, `job:<job_id>`, `engine`, or a bare namespace (`templates`, `results`, `catalog`, …). Other modules may register further prefixes (for example M16 `planning:<session_id>`). `parse_topic(str) -> Topic` raises `InvalidTopic`. |
| `ReplayWindow` | Rule `can_replay(since_seq, oldest_retained_seq, epoch) -> bool`. False across epochs or after compaction; the subscriber then gets a fresh snapshot. |
| `JobState` | `running`, `succeeded`, `failed`, `cancelled`; `JobRecord(job_id, method, state, progress, result, error, started_at, finished_at, dedupe_key)`. |
| `ApiVersion` | Semver; `compatible(client, engine)` is equality of the major component. |
| `IdlePolicy` | `idle_after = 10 min`; `should_exit(active_runs, active_jobs, sessions, idle_since, now)`. |

Domain errors: `UnknownRun`, `UnknownConfiguration`, `NotActive`, `InvalidJobs`, `NoEntries`, `RunStateUnreadable`, `InvalidTopic`, `UnknownSubscription`, `UnknownJob`, `JobNotCancellable`, `IncompatibleVersion`, `EngineBusy(run_ids, job_ids)`.

#### Ports (`engine/runs/ports.py`, `engine/daemon/ports.py`)

```python
class RunRepository(Protocol):
    async def reserve(self, launch_date: date) -> RunId: ...                   # under runs/.lock
    async def release(self, run: RunId) -> None: ...                          # launch failed or cancelled before bind
    async def save_state(self, run: RunId, state: RunRecord) -> None: ...      # temp + fsync + rename
    async def load_state(self, run: RunId) -> RunRecord: ...                   # raises RunStateUnreadable
    async def list(self, active: bool | None) -> Sequence[RunRecord]: ...
    async def append_log(self, run: RunId, entry: RunLogEntry) -> None: ...
    async def read_log(self, run: RunId, after: int | None, limit: int) -> Sequence[RunLogEntry]: ...
    def configuration_dir(self, run: RunId, cfg: ConfigurationId) -> Path: ...  # handed to M05 as record dir

class EventPublisher(Protocol):          # engine/shared; implemented by the daemon's EventBus
    def publish(self, event: DomainEvent) -> None: ...

class JobRunner(Protocol):               # offered to every module that registers a job
    def start(self, method: str, work: Callable[[JobContext], Awaitable[object]],
              *, dedupe_key: str | None = None, cancellable: bool = True) -> JobRef: ...
class JobContext(Protocol):
    job_id: JobId
    def report(self, progress: object) -> None: ...      # mapped to job.progress by the owner's rpc mapper
    def raise_if_cancelled(self) -> None: ...

class TopicRegistry(Protocol):           # each module's adapters/rpc.py registers its topics
    def register(self, prefix: str, provider: TopicProvider) -> None: ...
class TopicProvider(Protocol):
    def matches(self, topic: Topic, event: DomainEvent) -> bool: ...
    async def snapshot(self, topic: Topic) -> object | None: ...          # DTO, or None for event-only topics
```

| Port | Purpose |
|---|---|
| `RunRepository` | Run directory, id reservation, run state, run log. |
| `HarnessExecution` | M05 application interface: `establish`, `invoke`, `stop`, `release`, `reconcile`, plus `cleanup_plan` (see Requires). |
| `HarnessLive` | M05 application interface behind `harness.live.get`; used for the lane "Live" line and the `live:` topic snapshot. |
| `LaunchPreparation`, `LaunchRecords` | M07 application interfaces: `resolve` a launch source, `freeze_configuration`, `freeze_weights`, `commit`, `discard`; read the frozen launch of a run. |
| `TemplateIdentity`, `RevisionReader` | M01 application interfaces: recompute identity at launch and at task boundaries; read the frozen task list and titles. |
| `ResultRecorder` | M02 application interface: open, append, seal, mark interrupted. |
| `TaskVerifier` | M08 application interface: `verify_task`, `verify_final`, `cancel`, `reconcile`. |
| `MeasurementSummary` | M10 application interface: elapsed (sum of task processes) and cost with basis per configuration, for lanes and status. |
| `RunJudging` | M12 application interface: `judge_run` when every configuration has ended, `stop`, `batch_for_run`. |
| `Clock`, `IdGenerator` | `engine/shared`. |
| `SocketServer`, `SessionTransport` | Daemon: accept connections, read and write newline-delimited JSON-RPC frames. |
| `InstanceLock` | Daemon: exclusive per-user lock so only one `axbenchmarkd` runs. |

#### Application (`engine/runs/application/`, `engine/daemon/application/`)

Interface offered to other engine modules (`engine/runs/application/interfaces.py`):

```python
class RunContext(Protocol):              # M08, M10, M12, M18
    async def configuration(self, run: RunId, cfg: ConfigurationId) -> ConfigurationContext: ...  # frozen entry, task order, record dir
    async def scheduling(self, run: RunId, cfg: ConfigurationId) -> SchedulingRecord: ...
    async def windows(self, run: RunId) -> Sequence[ExecutionWindow]: ...   # M18: per-configuration execution windows
    def run_dir(self, run: RunId) -> Path: ...                              # M18: <run dir>/telemetry/

class RunTimeline(Protocol):             # M10, M18
    async def intervals(self, run: RunId) -> Timeline: ...   # phase intervals per configuration and task, launch and end time, jobs

class SchedulingVocabulary(Protocol):    # M07 setup and launch review
    def default(self) -> ConcurrencyChoice: ...                                    # jobs 4
    def validate(self, choice: ConcurrencyChoice) -> None: ...                     # raises InvalidJobs
    def queue_notes(self, entries: Sequence[EntryRef], choice: ConcurrencyChoice) -> Mapping[EntryId, str]: ...  # "queued after #1"
```

| Use case | Kind | Behavior |
|---|---|---|
| `LaunchRun` | job `runs.launch` | Synchronously: `LaunchPreparation.resolve(source, adjustments, preview_digest)` (typed `configs.*` errors such as `configs.incomplete` or `configs.review_stale`; nothing written), `SchedulingVocabulary.validate`, at least one entry after `exclude_entries`. Then as a job with steps `identity` (`TemplateIdentity.check`; mismatch fails the job with `templates.identity_mismatch`), `config` (reserve the `RunId`, then `LaunchPreparation.freeze_configuration` with `policy_overrides` applied; an unestablishable clean entry fails with `harness.clean_unavailable`), `weights` (`freeze_weights`), `bind` (`commit`, `ResultRecorder.open_result` and `append_scheduling` per configuration, initial `RunRecord`, then `ExperimentTelemetry.open(run, monitoring)` of M18). A failure or `jobs.cancel` before `bind` completes calls `discard(run_id)` and releases the reservation, so no run directory, frozen record or result remains. After `bind`, hands the run to `SuperviseRun` and finishes with `LaunchResult`. [R034, R060, R067, R138] |
| `SuperviseRun` | internal | One asyncio task per active run. Applies `next_starts`, starts an `ExecuteConfiguration` task per started configuration, persists every transition before publishing it, publishes `run.phase.started` / `run.phase.finished` for queue and verification intervals, when all configurations are final calls `ExperimentTelemetry.close(run)` (M18 appends hardware samples to each result) and then `ResultRecorder.seal` for every result, moves the run to `judging` and calls `RunJudging.judge_run`, then to `ended` when M12 reports the batch finished. [R045] |
| `ExecuteConfiguration` | internal | `HarnessExecution.establish`; then for each task in frozen order: `TemplateIdentity.check` (a mismatch records invalidation through M02 and never rebinds), `HarnessExecution.invoke` with role `competitor`, `TaskScope`, the frozen settings and `deadline = start + task_timeout`; `ResultRecorder.append_task_outcome` with M05's outcome and observed internal retries; `TaskVerifier.verify_task` on the task snapshot before the next task starts (as drawn: "T1 exit 0 · checks 2✓ · T2 started"); then `continuation`. On `Halt` the remaining tasks become `not_run`. After the last task, `TaskVerifier.verify_final` and `HarnessExecution.release`; the result is sealed by `SuperviseRun` once the experiment's telemetry is closed. No code path invokes the same task twice. [R034, R067, R069, R077] |
| `StopRun` | command `runs.stop` | Persists the stop request first, cancels the affected `ExecuteConfiguration` tasks, calls `TaskVerifier.cancel` and `HarnessExecution.stop(run, cfg \| None)` and waits for the `CleanupReport`; a run stopped in its `judging` phase calls `RunJudging.stop(batch_id)`; records the running task as `interrupted(stopped_by_user)`, later tasks and queued configurations as `not_run`, and, once no configuration of the run is still active, closes M18's collection (`ExperimentTelemetry.close`) and seals results as interrupted; publishes `run.stop.progressed` per step and `run.stop.completed` only after cleanup is reported. A repeated stop of the same scope returns the existing `stop_id`. [R046, R139] |
| `PreviewStop` | query `runs.stop_preview` | Builds the `StopPlan` from run state and `HarnessExecution.cleanup_plan`; changes nothing. |
| `ReconcileRuns` | engine start | For every run whose `RunRecord.engine_instance` differs from the current one and is not final: `HarnessExecution.reconcile` and `TaskVerifier.reconcile` end orphan process groups; running tasks become `interrupted(engine_lost)`, queued configurations `not_run`; `ExperimentTelemetry.close` for the run (coverage ends at the last stored sample), `ResultRecorder.mark_interrupted`; a log entry and events. Never resumes or restarts a task. [R060, R139] |
| `TerminateForShutdown` | engine `SIGTERM` | With active runs, stops their process groups through `HarnessExecution.stop` and records `interrupted(engine_terminated)` before exit, so a terminated engine is an actual, recorded interruption. |
| `TrackObservation` | internal | Consumes session subscribe and drop events for `run:` topics, maintains `ObservationLog`, publishes `run.observation.changed`. Never touches execution. [R046] |
| `ListRuns`, `GetRunStatus`, `ReadRunLog`, `GetLaunchRecord` | query | Back the queries below; status combines `RunRecord`, `MeasurementSummary`, `HarnessLive` and `allowed_actions`. Work for ended runs from saved state, so `status` never needs an attached interface. [R051, R060] |
| `Hello`, `EngineStatus`, `StopEngine`, `ListMethods` | daemon | `engine.*`. `StopEngine` raises `EngineBusy` while runs or jobs are active. |
| `Subscribe`, `Unsubscribe` | daemon | Register the session's bounded queue first, then take snapshots, then return the current `seq`; events after that `seq` are delivered even if a snapshot already reflects them (payloads are full replacement models or keyed upserts, so re-applying is safe). With `since_seq` inside the `ReplayWindow` the missed events are replayed instead of a snapshot. |
| `GetJob`, `ListJobs`, `CancelJob` | daemon | `jobs.*`; cancellation sets the context flag and the job's work observes it at its next `raise_if_cancelled`. |

#### Adapters (`engine/runs/adapters/`, `engine/daemon/adapters/`)

| Adapter | Implements |
|---|---|
| `runs/adapters/fs_runs.py` | `RunRepository` on the layout below: JSON state with write-to-temp, fsync and rename, `fcntl` lock on `runs/.lock` for id allocation, JSON-lines run log. |
| `runs/adapters/rpc.py` | Maps `runs.*` DTOs to use cases and back, domain errors to `runs.*` codes; registers the `run:` and `live:` topic providers (the `live:` snapshot is `HarnessLive.snapshot`, the `run:<id>/<cfg>` snapshot is M05's configuration description plus `ConfigurationStatus`). |
| `daemon/adapters/unix_server.py` | `SocketServer` on `asyncio.start_unix_server` at `~/.axbenchmark/run/engine.sock` (directory 0700, socket 0600), peer uid checked with `SO_PEERCRED` / `getpeereid`, newline-delimited JSON frames up to 16 MiB, concurrent requests per connection, responses matched by id. |
| `daemon/adapters/jsonrpc.py` | JSON-RPC 2.0 dispatch through the `MethodRegistry` in `axbenchmark.api`; typed errors as `{code: -32000, message, data: {code: "<namespace>.<reason>", field?, remedy?, ...}}`. Server-to-client events are JSON-RPC notifications whose `method` is the event name and whose `params` is the `EventEnvelope` DTO. |
| `daemon/adapters/event_bus.py` | `EventPublisher` and subscription fan-out: in-memory ring of the last 50 000 envelopes (or 30 minutes), per-session queues of 1 000 envelopes. High-rate M05 events (`harness.output.measured`, `harness.context.reported`) are coalesced per configuration. A full queue is dropped and replaced by one `events.subscription.resynced` notification carrying fresh snapshots; a slow client never delays a publisher. [R044, R047] |
| `daemon/adapters/job_runner.py` | `JobRunner` on asyncio tasks; finished jobs kept for one hour for `jobs.get`. Jobs outlive the session that started them but not the engine. |
| `daemon/adapters/instance.py` | `InstanceLock` on `fcntl.flock` of `~/.axbenchmark/run/engine.lock`, pid file, stale-socket removal only by the lock holder. |
| `daemon/main.py` | `axbenchmarkd` entry point: acquire the lock, build the engine, run `ReconcileRuns` and the other modules' start-up use cases, serve, exit on `IdlePolicy` or `engine.stop`. Ignores `SIGHUP`; handles `SIGTERM` with `TerminateForShutdown`. |
| `daemon/composition.py` | Composition root: builds every module's adapters and use cases by constructor injection, the `MethodRegistry`, the `TopicRegistry` and the `EventBus`; returns an `Engine` object that both the socket server and `InProcessClient` dispatch into. |

The client package (`axbenchmark/client/`, importing only `api`) is part of this component:

```python
class EngineClient(Protocol):
    async def call(self, method: str, params: BaseModel) -> BaseModel: ...           # typed error → EngineError(code, message, field, remedy, data)
    async def subscribe(self, topics: Sequence[str], since_seq: int | None = None) -> SubscriptionStream: ...
    async def close(self) -> None: ...
    connection_lost: Signal                                                          # TUI and CLI re-subscribe with since_seq
async def connect(*, autostart: bool = True) -> EngineClient: ...                     # socket client; performs engine.hello
class InProcessClient(EngineClient): ...                                             # dispatches into an Engine from composition.py, with DTO JSON round-trip
```

`axbenchmark.client.connect(autostart=True)` starts the daemon when the socket is absent or refuses connections: it spawns `axbenchmarkd` with `start_new_session=True`, stdin from `/dev/null` and output to `~/.axbenchmark/run/engine.log`, then waits for the socket. The engine is therefore never in a client's process group or session, and closing the terminal that started it does not signal it. [R046, R139, R150]

#### Persisted state

The engine is the only reader and writer; no interface opens these files.

```
~/.axbenchmark/run/                      engine.sock, engine.lock, engine.pid, engine.log
~/.axbenchmark/runs/
  .lock
  <run_id>/
    state.json           RunRecord: engine instance, run state, per-configuration state, task states,
                         queue order, scheduling records, stop requests, observation intervals
    events.jsonl         run log entries (append-only), source of #events and CLI progress
    <configuration_slug>/  M05 records (workspace, task invocation records and logs), see M05
```

The frozen launch records (template binding, resolved configuration, original weights, machine) are written by M07 under `~/.axbenchmark/launches/<run_id>/` during the `config` and `weights` steps; M11 reads them through `LaunchRecords` and never rewrites them. Every state transition is written to `state.json` before its event is published, so a snapshot never lags an event the client has already seen. Result records live under `~/.axbenchmark/results/` and belong to M02; M11 writes them only through `ResultRecorder`.

#### Owned processes

`axbenchmarkd` itself, one per user, detached from every client. M11 owns no other process directly: harness process groups are children of `axbenchmarkd` created through M05, and their lifetime is ended only by `runs.stop`, a task timeout (enforced by M05 with the deadline M11 passes), normal completion, engine termination or reconciliation. A client closing, a socket dropping or a subscription ending never reaches them. [R046, R138, R139]

### 2. API surface (`runs.*`, `events.*`, `jobs.*`, `engine.*`)

Run events use the `run.` prefix, job events `job.`, engine events `engine.`, matching the names already used in [ARCHITECTURE.md](ARCHITECTURE.md).

#### Shared DTOs

| DTO | Fields |
|---|---|
| `ConfigurationRef` | `configuration_id`, `entry_index`, `harness`, `model`, `effort_label` (requested; "harness default" when no effort is passed). |
| `SchedulingDTO` | `jobs`, `max_active`, `per_harness_limit`, `queue_order`, `summary` (engine text such as "one configuration per harness, up to 4 at once (jobs 4) · tasks sequential"). |
| `TaskStatusDTO` | `task_id`, `label` (`T1`…), `title`, `state` (`pending`, `running`, `verifying`, `exited`, `interrupted`, `not_run`), `exit?` (M05 outcome and code), `checks?` (`ChecksSummaryDTO` from M08), `started_at?`, `ended_at?`, `internal_retries`. |
| `ConfigurationStatusDTO` | `ConfigurationRef`, `state`, `state_reason?: ErrorDTO` (for example `harness.auth_failed` with message), `tasks: list[TaskStatusDTO]`, `tasks_finished`, `tasks_total`, `current_task?: {task_id, title, started_at}`, `queue_position?`, `elapsed?: DurationObservationDTO`, `cost?: MoneyObservationDTO` (with basis and coverage; unknown is `null` with reason), `notes: list[NoteDTO(code, text)]`, `capabilities: {can_open, can_live_view, can_stop}` each with `reason?`. |
| `LaneDTO` | `lane_index` (harness display order: Claude Code, Codex, Grok CLI, Pi), `harness`, `selected: bool`, `active?: configuration_id`, `queue: list[ConfigurationRef + queue_text]`, `configurations: list[configuration_id]`. |
| `RunStatus` | `run_id`, `template: {sha256, name, label}`, `state`, `counts: {running, queued, waiting, complete, halted, interrupted, not_run}`, `scheduling`, `frozen: {template_sha256, configuration_digest, weights_digest, launched_at}`, `lanes`, `configurations`, `restrictions: list[RestrictionDTO(action, available, text)]`, `observation: {observed_now, last_unobserved?: {from, to}}`, `stops: list[StopProgressDTO]`, `capabilities: {can_stop_run, can_detach, can_edit (always false while active, reason runs.frozen_while_active)}`, `seq`. |
| `StopProgressDTO` | `stop_id`, `scope`, `targets`, `steps: list[{step, state, text}]`, `cleanup?: CleanupReport` (M05), `completed_at?`. |

#### Queries (`read`)

| Method | Request | Response | Errors | Capability flags |
|---|---|---|---|---|
| `runs.list` | `active?: bool`, `template_sha256?`, `limit = 50`, `cursor?` | `RunList`: `rows: [RunSummaryDTO(run_id, template, state, started_at, ended_at?, counts, scheduling.summary)]`, `next_cursor` | `runs.state_unreadable` (per row, as `read_failures`) | `can_attach`, `can_stop` per row |
| `runs.status` | `run_id` | `RunStatus` | `runs.unknown_run`, `runs.state_unreadable` | as in `RunStatus` |
| `runs.log` | `run_id`, `after?: int`, `before?: int`, `limit = 200` | `RunLogPage`: `entries: [RunLogEntryDTO(entry_no, at, source, kind, text, severity)]`, `complete` | `runs.unknown_run` | — |
| `runs.stop_preview` | `run_id`, `scope: configuration \| run`, `configuration_id?` | `StopPreview`: `scope`, `targets: [ConfigurationRef]`, `cleanup: [CleanupItemDTO(kind: process\|service\|browser\|ports, item, action)]`, `outcome: [{subject, text}]`, `unaffected: [ConfigurationRef]`, `button_label` | `runs.unknown_run`, `runs.unknown_configuration` | `can_stop` with `reason` (`runs.not_active`, `runs.configuration_not_active`) |
| `jobs.get` | `job_id` | `JobStatus(job_id, method, state, progress?, result?, error?, started_at, finished_at?)` | `jobs.unknown` | `can_cancel` |
| `jobs.list` | `active?: bool`, `method?` | `list[JobStatus]` | — | `can_cancel` per job |
| `engine.hello` | `api_version`, `client: {kind: tui\|cli\|mcp\|script, version, pid}` | `Hello(api_version, engine_version, instance_id, session_id, started_at, namespaces)` | `engine.incompatible_version{engine_api_version, remedy}` | — |
| `engine.status` | — | `EngineStatus(pid, instance_id, started_at, socket_path, active_runs, active_jobs, sessions, idle_exit_at?)` | — | `can_stop` with `reason: engine.runs_active \| engine.jobs_active` |
| `engine.methods` | — | `list[MethodInfo(name, kind, safety, description, request_schema, response_schema)]` from the registry | — | — |

#### Commands and subscriptions

| Method | Request | Response | Errors | Safety |
|---|---|---|---|---|
| `runs.stop` | `run_id`, `scope: configuration \| run`, `configuration_id?` (required for `configuration`) | `StopReceipt(stop_id, scope, targets)`; progress follows as events | `runs.unknown_run`, `runs.unknown_configuration`, `runs.not_active`, `runs.configuration_not_active` | `destructive` |
| `jobs.cancel` | `job_id` | `JobStatus` (state `cancelled` once the work observes it) | `jobs.unknown`, `jobs.not_cancellable`, `jobs.already_finished` | `write` |
| `engine.stop` | — | `{stopping: true}` | `engine.runs_active{run_ids}`, `engine.jobs_active{job_ids}` | `write` |
| `events.subscribe` | `topics: list[str]`, `since_seq?`, `epoch?` | `Subscription(subscription_id, epoch, seq, replayed: bool, snapshots: {topic: DTO \| null})` | `events.invalid_topic{topic}`, `events.unknown_topic{topic}` (for example an unknown run) | `read` |
| `events.unsubscribe` | `subscription_id` | `{}` | `events.unknown_subscription` | `read` |

`runs.stop` is the only method that ends work. There is no detach method: detaching is closing subscriptions, which every client does by unsubscribing or disconnecting. [R046]

#### Jobs

| Method | Request | Progress payload | Result | Errors (synchronous / job) | Safety |
|---|---|---|---|---|---|
| `runs.launch` | exactly one of `draft_id`, `config_id`, `config_path` (absolute path of a complete configuration file), `preview_digest?` (interactive path), `execution?: {concurrency?: {jobs}}` (`--jobs N` overrides the saved setting), `exclude_entries: list[entry_id] = []`, `policy_overrides: {entry_id: "current"} = {}` | `LaunchStep(step: identity \| config \| weights \| bind, state: running \| done \| failed, digest?)` | `LaunchResult(run_id, template_sha256, configuration_digest, weights_digest, scheduling, configurations: [ConfigurationRef + queued: bool])` | Synchronous: `configs.*` from M07 (`configs.incomplete` with every issue, `configs.review_stale`), `runs.invalid_jobs{field: execution.concurrency.jobs}`, `runs.no_entries`. Job: `templates.identity_mismatch` (step `identity`), `harness.clean_unavailable` with `data.assessments` (step `config`), `runs.state_unreadable` (step `bind`). | `write` |

A second launch of the same source while the first is still freezing returns the running job's `JobRef` (dedupe key: source and overrides). Unattended launch uses exactly this method; there is no interactive variant. [R060, R138]

#### Events

| Event | Payload | Topics | Consumers |
|---|---|---|---|
| `run.state.changed` | `run_id`, `state`, `outcome?` (`completed`, `stopped`, `interrupted`), `counts` | `run:<id>`, `runs` | RunScreen, Library `#env-bar` (M01/M15), M10, M18, CLI |
| `run.phase.started`, `run.phase.finished` | `run_id`, `configuration_id?`, `task_id?`, `kind: queue \| verification \| judging`, `at` | `run:<id>` | M10 timing, M18 windows |
| `run.configuration.changed` | `ConfigurationStatusDTO` (full replacement) | `run:<id>`, `run:<id>/<cfg>` | RunScreen lanes, RunConfigScreen run bar, M10, M18 |
| `run.task.started` | `ConfigurationRef`, `TaskStatusDTO`, `from_workspace` (previous task commit or baseline) | `run:<id>`, `run:<id>/<cfg>` | lanes, CLI progress |
| `run.task.ended` | `ConfigurationRef`, `TaskStatusDTO`, `decision: continue \| halt \| last` | `run:<id>`, `run:<id>/<cfg>` | lanes, CLI progress |
| `run.retry.recorded` | `ConfigurationRef`, `task_id`, reason (from `harness.retry.observed`) | `run:<id>` | `#events`, M02 via the task outcome |
| `run.identity.invalidated` | `ConfigurationRef?`, `IdentityCheckDTO` | `run:<id>` | `#events`, M02 |
| `run.log.appended` | `RunLogEntryDTO` | `run:<id>` | RunScreen `#events`, `run --no-tui`, `--attach --no-tui` |
| `run.stop.progressed` | `StopProgressDTO` | `run:<id>` | StoppingScreen, CLI `stop` |
| `run.stop.completed` | `StopProgressDTO` with `CleanupReport` | `run:<id>`, `runs` | StoppingScreen, CLI `stop` |
| `run.observation.changed` | `run_id`, `observed_now`, `last_unobserved?` | `run:<id>` | RunScreen reattach bar |
| `job.progress` | `job_id`, `method`, progress payload of that method | `job:<id>`, `jobs` | every job-driven screen and command |
| `job.finished` | `JobStatus` (result or typed error) | `job:<id>`, `jobs` | same |
| `events.subscription.resynced` | `subscription_id`, `seq`, `snapshots` | the subscription | every subscriber; replaces its state |
| `engine.stopping` | `reason: idle \| requested \| terminated` | `engine` | clients print how to restart |

Topic contents: `run:<id>` carries the `run.*` events, M12's `judging.batch.started` for that run, and coalesced `harness.output.measured` and `harness.context.reported` for the lane "Live" line; snapshot `RunStatus`. `runs` carries `run.state.changed` and `run.stop.completed` for every run; snapshot the active `runs.list`. `jobs` carries every `job.*` event; snapshot the active `jobs.list`. `run:<id>/<cfg>` carries that configuration's `run.*` events and M05's `harness.task.*`, `harness.log.appended`, `harness.settings.observed`, `harness.permission.decided`, `harness.environment.released`; snapshot `{status: ConfigurationStatusDTO, execution: ConfigurationExecution}`. `live:<id>/<cfg>` carries M05's `harness.task.started`, `harness.task.exited`, `harness.output.measured`, `harness.context.reported`, `harness.reasoning.observed`, `harness.action.observed`, `harness.file.changed`, `harness.settings.observed`; snapshot `LiveTaskSnapshot` or `null` when no task process runs. `job:<id>` snapshot is `JobStatus`. A bare namespace topic carries that namespace's events with no snapshot.

#### Error codes

| Code | Raised when |
|---|---|
| `runs.unknown_run`, `runs.unknown_configuration` | No such run or configuration in that run. |
| `runs.not_active`, `runs.configuration_not_active` | Stop on a run or configuration that is already final. |
| `runs.invalid_jobs` | `jobs` outside 1–4. |
| `runs.no_entries` | `exclude_entries` removes every entry. |
| `runs.state_unreadable` | `state.json` cannot be read or is locked; message names the path and states that the run itself is unaffected. |
| `runs.frozen_while_active` | Capability reason only: editing frozen inputs or injecting hints while active. No method mutates them, so it is never raised by a call. [R047] |
| `events.invalid_topic`, `events.unknown_topic`, `events.unknown_subscription` | Subscription errors. |
| `jobs.unknown`, `jobs.not_cancellable`, `jobs.already_finished` | Job errors. |
| `engine.incompatible_version`, `engine.runs_active`, `engine.jobs_active` | Version negotiation and refused engine stop. |

Task outcomes (timeout, ordinary failure, authentication or configuration failure, model rejection, interruption) are data in `TaskStatusDTO` and `state_reason`, not RPC errors.

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `HarnessExecution.establish`, `.invoke`, `.stop`, `.release`, `.reconcile` | M05 | Environment, one process per task, stop with cleanup, orphan reconciliation. |
| `HarnessExecution.cleanup_plan(run_id, configuration_id \| None) -> Sequence[CleanupItem]` | M05 | StopScreen `#cleanup` preview before anything is stopped. |
| `HarnessLive.snapshot(run_id, configuration_id)` (application interface of `harness.live.get`) | M05 | `live:` topic snapshot and lane live line. |
| Events `harness.task.started`, `harness.task.exited`, `harness.retry.observed`, `harness.output.measured`, `harness.context.reported`, `harness.environment.released`, and the other `harness.*` events routed to `run:<id>/<cfg>` and `live:` topics | M05 | Lane state, run log, topic contents. |
| `harness.live.get`, `harness.workspace.diff`, `harness.task.log`, `harness.configuration.describe` | M05 | HarnessLiveScreen and RunScreen compact `#log` (called by the screens). |
| `LaunchPreparation.resolve`, `.freeze_configuration`, `.freeze_weights`, `.commit`, `.discard`; `LaunchRecords.get` (application interfaces) | M07 | Launch validation, the separate freezes of configuration and original weights, frozen task list, `task_timeout` and concurrency for the task loop. |
| `execution.task_timeout` and `trials` in the resolved configuration (default 3 h and 1, M11's `ExecutionDefaults`) | M07 | Frozen per-task deadline and trial count. [R077] |
| `configs.*` error codes (`configs.incomplete`, `configs.review_stale`), `configs.launch_record` | M07 | Returned unchanged by `runs.launch`; LaunchRecordScreen data. |
| `TemplateIdentity.check(sha)`, `RevisionReader.open(sha)` | M01 | Identity step, in-run mutation detection, task order and titles. |
| `ResultRecorder.open_result`, `.append_task_outcome`, `.seal`, `.mark_interrupted` | M02 | Result per configuration. |
| `ResultRecorder.append_scheduling(rid, SchedulingRecord)` | M02 | Scheduling and concurrency retained with each result. [R045] |
| `ResultRecorder.mark_identity_invalidated(rid, IdentityCheck)` | M02 | Invalidated template claim without a replacement identity. [R067] |
| `internal_retries` on `TaskOutcome.process` | M02 | Observable harness-internal retries stay recorded. [R077] |
| `TaskVerifier.verify_task`, `.verify_final`, `.cancel`, `.reconcile` (application interface); events `verification.task.completed` | M08 | Approved checks inside the task loop, stop and reconciliation; lane check counts. [R034] |
| `MeasurementSummary.for_configuration(run_id, cfg) -> (elapsed, cost)` (application interface) | M10 | Lane elapsed and cost with basis; never zero for unknown. |
| `RunJudging.judge_run`, `.stop`, `.batch_for_run` (application interface); event `judging.batch.started`, batch finished event | M12 | Judging after every configuration has ended; stop in the judging phase; RunScreen switches to JudgingScreen. |
| Topic providers registered through `TopicRegistry` (`templates`, `results`, `catalog`, `environment`, `configs`, `verification`, `measurements`, `judging`, `planning`, `exchange`, `reports`, `telemetry`; M18 also routes `telemetry.collection.*` and `telemetry.collector.failed` to `run:<id>`) | each owner | Bare namespace topics and any snapshots they define. |
| `ExperimentTelemetry.open(run, mode)` after `bind`, `.close(run)` after the last configuration ends (also on stop and reconciliation) and before results are sealed | M18 | One host collection per experiment, retained with every result. |
| App shell: `app.client`, `.-compact` class, Library `ctrl+r` and palette "Reconnect to run", `#env-bar` | M15 / M01 | Hosting the run screens and reaching them. |
| RunConfigScreen | M05 | `enter` on a lane, `enter` in HarnessLiveScreen. |
| LaunchCheckScreen, ReviewLaunchScreen, LaunchRecordScreen | M01 / M07 | Launch flow before RunScreen; LaunchRecordScreen loads `configs.launch_record`. |
| `JudgingScreen` | M12 | Pushed by RunScreen on `judging.batch.started`. |
| `ActionState`, `ErrorVM`, `SubscriptionHub`, `AxModal` | M15 | Shared view-model and widget types used by the screens below. |

### 4. Screens

Shared rules, as in M01 and M05: each screen loads in an `exclusive=True` worker through the injected `EngineClient`; data widgets sit in `ContentSwitcher`s with `#x`, `#x-loading`, `#x-empty`, `#x-error`; `check_action` dims bindings from the view model's `ActionState` (M15's shared type) and never from a local rule; subscriptions go through M15's `SubscriptionHub`; `StopScreen` is the confirming modal for the destructive `runs.stop`; error notices print the engine's `message` and `remedy` verbatim. View models are frozen dataclasses built by pure functions; live updates go through a pure reducer `apply(state, envelope) -> state` followed by the builder. Glyphs (✓ ✗ ● ○ –) are a presentation mapping of `TaskStatusDTO.state` and `exit`, not a rule.

```python
@dataclass(frozen=True)
class LaneVM:
    slot: int                                  # 1..4, #lane-<slot>
    view: Literal["body", "empty", "error"]
    harness: str
    state_glyph: str; state_word: str; config_label: str
    tasks: tuple[tuple[str, str], ...]         # ("T5", "●")
    progress: float                            # tasks_finished / tasks_total
    kv: tuple[tuple[str, str], ...]            # Now, Elapsed, Cost, Queue, Live
    note: str | None
    configuration_id: str | None
    actions: Mapping[str, ActionState]         # open_configuration, live_view, stop  (names M15 reuses)

@dataclass(frozen=True)
class RunVM:
    title: str; bar: str; bar_failure: bool; frozen: str
    lanes: tuple[LaneVM, ...]                  # always four, harness display order
    table_rows: tuple[LaneRowVM, ...]          # #lanes-table and #lane-list
    actions: Mapping[str, ActionState]         # stop_run, detach, edit
    restrictions: tuple[tuple[str, str, bool], ...]
    reattached: ReattachVM | None

def build_run_vm(status: RunStatus, meters: Mapping[str, LiveMeterDTO], focused: int) -> RunVM: ...
def apply_run_event(status: RunStatus, env: EventEnvelope) -> RunStatus: ...
def build_live_vm(snap: LiveTaskSnapshot | None, view: LiveViewState) -> LiveVM: ...
def build_stop_vm(preview: StopPreview) -> StopVM: ...
def build_stopping_vm(progress: StopProgressDTO) -> StoppingVM: ...
```

#### RunScreen — artboards RunOverview, RunQueued, RunSequential, RunFailures, RunReattached (and RunListDetail on the M15 page)

| Item | Specification |
|---|---|
| Class and file | `RunScreen(Screen)` in `axbenchmark/tui/screens/run.py`, constructed with `run_id` and `reattached: bool`. Widget tree and TCSS as in the M11 board: `Static #run-bar`, `Static #frozen`, `Grid #lanes` (2×2) of `Vertical #lane-1`…`#lane-4 .pane` each with `.lane-state`, `.task-strip`, `ProgressBar`, `.kv`; `RichLog #events`; `DataTable #lanes-table` shown only under `Screen.-compact`. Below 100×30 (RunListDetail): `ListView #lane-list`, `Vertical #detail` with `#lane-detail` and `RichLog #log` with `Input #log-search`. |
| View model | `tui/viewmodels/run.py`: `RunVM`, `LaneVM`, `build_run_vm`, `apply_run_event`. Lane text comes from DTO fields (`notes`, `state_reason.message`, `scheduling.summary`, queue text); durations and tokens are formatted, never computed beyond `tasks_finished / tasks_total`. |
| Load | `events.subscribe(["run:<run_id>"])` on mount; its `RunStatus` snapshot is the initial data, so no separate `runs.status` call is needed. Then `runs.log(run_id, limit=200)` fills `#events`. |
| Subscriptions | `run:<run_id>` (all `run.*`, coalesced `harness.output.measured` / `harness.context.reported` for the Live line). In the compact list/detail layout, also `run:<run_id>/<cfg>` for the highlighted configuration, replaced when the highlight moves; `#log` loads `harness.task.log` for its current task. `judging.batch.started` for this run pushes M12's `JudgingScreen(run_id, batch_id)` (navigation, no call). Unsubscribe everything on unmount; nothing else happens on unmount. |
| States | `ContentSwitcher #run-switch` with `#run`, `#run-loading` ("Attaching to run …"), `#run-error` (`runs.unknown_run`, `events.unknown_topic`). Each lane has `ContentSwitcher #lane-<n>-switch` with `#lane-<n>`, `#lane-<n>-loading`, `#lane-<n>-empty` (`LaneDTO.selected == false`: "No configuration in this lane"), `#lane-<n>-error` (`runs.state_unreadable` message verbatim; the screen re-subscribes after a back-off, which is a query retry, not a run action). `events.subscription.resynced` replaces the whole `RunStatus`. |
| Variants | RunQueued and RunSequential are `RunStatus` with a non-empty lane `queue` or `scheduling.jobs == 1`; RunFailures renders `state_reason` and `notes` (`.-failure` style when `severity` is failure); RunReattached is `reattached=True` plus `observation.last_unobserved`, shown in `#run-bar` and a toast ("Reattached … No task was restarted"). None of them is a separate screen or call. |

| Binding | Action | API call |
|---|---|---|
| `enter` | `open_configuration`: push `RunConfigScreen(run_id, cfg)` (M05) for the focused lane; enabled from the `open_configuration` ActionState | none here (RunConfigScreen loads `harness.configuration.describe`) |
| `s` | `stop_configuration`: push `StopScreen(run_id, scope="configuration", cfg)`; enabled from the lane's `stop` ActionState | none here (StopScreen issues `runs.stop`) |
| `S` | `stop_run`: push `StopScreen(run_id, scope="run")`; enabled from the `stop_run` ActionState | none here |
| `v` | `live_view`: push `HarnessLiveScreen(run_id, cfg)`; enabled from the lane's `live_view` ActionState | none here |
| `d` | `detach`: push `DetachScreen(run_id)` | none |
| `e` | `edit`: push `LockedScreen(vm.restrictions)`. The footer key is rendered dimmed from the `edit` ActionState (`runs.frozen_while_active`); the key stays pressable so the reason can be shown | none |
| `tab` | `focus_next`: next lane, then `#events` | none |
| `↑ ↓` (compact) | move `#lane-list` / `#lanes-table` cursor; detail follows | `events.subscribe` / `events.unsubscribe` for the highlighted configuration topic, `harness.task.log` |
| `/`, `n` (compact) | focus `#log-search`; submit | `harness.task.log(query=…)`; `n` steps through returned `matches` without a call |

#### HarnessLiveScreen — artboards HarnessLive, HarnessLiveStreaming, HarnessLiveLimited

| Item | Specification |
|---|---|
| Class and file | `HarnessLiveScreen(Screen)` in `axbenchmark/tui/screens/live.py`, constructed with `run_id`, `configuration_id`. Tree as in the board: `Static #live-task`, `Vertical #live-meters .pane` (`Sparkline #live-rate`, `ProgressBar #live-context`), `RichLog #live-activity` (thinking in a `Collapsible`, actions), `Vertical #live-code .pane` (`Tabs #live-files`, `TextArea #live-diff`, read-only). Under `.-compact`, `#live-activity` is hidden and `a` shows it as an overlay. |
| View model | `tui/viewmodels/live.py`: `LiveVM(task_line, requested_vs_observed: tuple[ObservedVM, ...], rate_text, rate_source, spark: tuple[float, ...], context_text, context_ratio: float \| None, context_source, usage_line, activity: tuple[ActivityVM, ...], thinking_label, files: tuple[FileTabVM, ...], diff: DiffVM, actions)` built by `build_live_vm(snapshot, view_state)`. `LiveViewState(show_thinking, follow, file_index, compact_activity)` is local presentation state. An `Observed` value with status `unavailable` renders "? not reported" and no bar; `unverified` renders "? unverified"; each value shows its `source`. [R044] |
| Load | `events.subscribe(["live:<run_id>/<cfg>"])`; the snapshot is `LiveTaskSnapshot`. Then `harness.workspace.diff(run_id, cfg, task_id, path)` for the first changed file. |
| Subscriptions | `live:<run_id>/<cfg>`. `harness.file.changed` updates `#live-files` and, for the shown file, reloads `harness.workspace.diff` (debounced to one call per second while following). `harness.task.started` resets the view from a fresh `harness.live.get` (context restarts with every task). `harness.task.exited` with no next task switches to `#live-empty`. Unsubscribe on unmount. The screen never issues a command. [R044, R047] |
| States | `ContentSwitcher #live-switch` with `#live`, `#live-loading`, `#live-empty` (snapshot `null` or `harness.no_active_task`: "No task process is running in this configuration"), `#live-error`. HarnessLiveStreaming is `#live-diff` with `final == false` and the caret on the newest added line; HarnessLiveLimited is `can_show_reasoning == false` and `has_context == false`. |

| Binding | Action | API call |
|---|---|---|
| `esc` | `app.pop_screen`; nothing in the run changes | none (unsubscribe only) |
| `t` | `toggle_thinking`; dimmed unless `can_show_reasoning` | none |
| `f` | `toggle_follow` | none |
| `[`, `]` | `previous_file` / `next_file` | `harness.workspace.diff` for the selected path |
| `/` | `search` thinking and actions | `harness.task.log(run_id, cfg, task_id, query=…)` |
| `enter` | `open_configuration`: push `RunConfigScreen(run_id, cfg)` | none here |
| `a` (compact) | toggle `#live-activity` overlay | none |
| `tab` | `focus_next`: code, then thinking and actions | none |

#### DetachScreen — artboard RunDetach

`DetachScreen(ModalScreen[bool])` in `tui/screens/run.py`; tree `Vertical #detach .dialog` with `Static .notice`, `Static #reattach .kv`, `.dialog-actions`. View model `DetachVM(run_id, reattach_rows)` from `build_detach_vm(run_id)`: the three rows (Library `ctrl+r`, `axbenchmark --attach RUN_ID`, `axbenchmark status RUN_ID`) are formatted from the run id. No load call and no subscription.

| Binding | Action | API call |
|---|---|---|
| `esc`, `Cancel` | `dismiss(False)` | none |
| `Stop instead…` | dismiss and push `StopScreen(run_id, scope="run")` | none here |
| `enter`, `Detach` | `dismiss(True)`; the app pops RunScreen (its unmount unsubscribes) and switches to the Library | none. Detach sends no command; the engine sees only subscriptions ending. [R046, R060, R139] |
| `tab` / `shift+tab` | focus | none |

#### StopScreen — artboard StopConfirm

| Item | Specification |
|---|---|
| Class and file | `StopScreen(ModalScreen[StopRequest \| None])` in `tui/screens/run.py`; tree `Vertical #stop .dialog` with `RadioSet #stop-scope`, `DataTable #cleanup`, `Static #stop-outcome .kv`, `.dialog-actions` (`Button #cancel`, `Button #stop`). |
| View model | `StopVM(scope_options, scope, cleanup_rows, outcome_rows, button_label, can_stop: ActionState)` from `build_stop_vm(StopPreview)`. |
| Load | `runs.stop_preview(run_id, scope, configuration_id)`. Changing `#stop-scope` reloads it with the new scope. No subscription; a `run.configuration.changed` while open is not needed because `runs.stop` re-validates. |
| States | `ContentSwitcher #stop-switch` with `#stop`, `#stop-loading`, `#stop-error`. When `can_stop` is false, `#stop` is disabled and the reason is shown. |

| Binding | Action | API call |
|---|---|---|
| `esc`, `#cancel` | `dismiss(None)` | none |
| `tab` / `shift+tab` | focus | none |
| scope change | reload preview | `runs.stop_preview` |
| `enter`, `#stop` | stop the chosen scope; on success `dismiss(StopRequest(stop_id))` and push `StoppingScreen(run_id, stop_id)`; a typed error (`runs.not_active`, …) is shown in the dialog | `runs.stop(run_id, scope, configuration_id)` |

#### StoppingScreen — artboard StopCleanup

`StoppingScreen(ModalScreen[None])` in `tui/screens/run.py`; tree `Vertical #stopping .dialog` with `Vertical #stop-steps` and `.dialog-actions` (`Button #hide`). View model `StoppingVM(title, steps: tuple[StepVM, ...], note, completed)` from `build_stopping_vm(StopProgressDTO)`. Load and subscription: `events.subscribe(["run:<run_id>"])`, taking the `stops` entry with this `stop_id` from the snapshot and following `run.stop.progressed` and `run.stop.completed`. States `#stopping`, `#stopping-loading`, `#stopping-error`. The stop is shown as finished only on `run.stop.completed`, which the engine publishes after M05 reports cleanup. [R139] Bindings: `esc`, `#hide` → `dismiss()`; cleanup continues in the engine; no call.

#### LockedScreen — artboard ActiveLocked

`LockedScreen(ModalScreen[None])` in `tui/screens/run.py`; tree `Vertical #locked .dialog` with `DataTable #allowed` and `.dialog-actions`. Data is `RunVM.restrictions` from `RunStatus.restrictions`, passed in by RunScreen; no load, no subscription, no call. States: a single `#locked` view. `esc`, `Close` → `dismiss()`. The rows are rendered as returned; the screen does not decide what is frozen. [R047]

#### Reaching a run

| Entry point | Behavior | API call |
|---|---|---|
| LaunchCheckScreen success (M01) | Push `RunScreen(run_id)` from `LaunchResult.run_id`. | none beyond RunScreen's own load |
| Library `ctrl+r`, palette "Reconnect to run" (M15/M01) | One active run: push `RunScreen(run_id, reattached=True)`. Several: the palette lists them. None: the binding is dimmed. | `runs.list(active=True)` |
| `axbenchmark --attach RUN_ID` | Opens the TUI directly on `RunScreen(run_id, reattached=True)`. | `runs.status` to confirm the id, then RunScreen's load |

#### Screens owned elsewhere that consume M11

| Screen (owner) | M11 data |
|---|---|
| `RunConfigScreen` (M05) | `run:<id>/<cfg>` topic; `#run-bar` from `ConfigurationStatusDTO`; `s` → StopScreen, `d` → DetachScreen, `v` → HarnessLiveScreen. |
| `LaunchCheckScreen` (M01), `CleanBlockedScreen` (M05) | `runs.launch` job progress and errors; `jobs.cancel`. |
| Library `#env-bar` (M01/M15) | `runs.list(active=True)`, `run.state.changed` on topic `runs`. |
| Every job-driven screen (M01, M02, M03, M04, M12, M13, M16, M17) | `jobs.get`, `jobs.cancel`, `job.progress`, `job.finished`, `events.subscribe`. |
| App shell (M15) | `engine.hello` on start; `engine.incompatible_version` shown with its remedy; `engine.stopping` notice. |

### 5. CLI

M14 owns the commands; these reach M11. Exit codes follow ARCHITECTURE.md (0 success, 1 typed failure, 2 invalid usage, 3 engine unreachable or incompatible); M14 reconciles the run-specific codes drawn on its boards.

| Command | Methods |
|---|---|
| `axbenchmark run --config FILE [--jobs N] [--no-tui]` | `engine.hello`; `runs.launch(source={config_path}, jobs)`; `events.subscribe(["job:<id>"])` prints the four launch steps; `configs.*`, `runs.invalid_jobs`, `templates.identity_mismatch` and `harness.clean_unavailable` are printed verbatim, nothing starts, exit 1 or 2. Without `--no-tui` the TUI opens on RunScreen. With `--no-tui`, `events.subscribe(["run:<id>"])` prints `run.log.appended` and `run.task.*` lines. Ctrl-C closes the subscription and prints the `--attach`, `status` and `stop` commands; the run continues. [R050, R060, R138] |
| `axbenchmark --attach RUN_ID [--no-tui]` | `runs.status`, then RunScreen or, with `--no-tui`, `events.subscribe(["run:<id>"])` plus `runs.log` for recent lines. Never launches or restarts. [R049] |
| `axbenchmark status RUN_ID` | `runs.status` (saved state, works for ended runs and with no interface attached); `--json` prints `RunStatus`. [R051] |
| `axbenchmark stop RUN_ID [--config ID]` | `runs.stop(scope=run \| configuration)`, then `events.subscribe(["run:<id>"])` until `run.stop.completed`; prints the `CleanupReport` and recorded outcomes. [R052, R139] |
| `axbenchmark engine status`, `axbenchmark engine stop` | `engine.status`, `engine.stop` (`engine.runs_active` lists the runs to stop first). |
| Proposed for M14: `axbenchmark runs [--active]`, `axbenchmark jobs [--active]`, `axbenchmark jobs cancel JOB_ID`, `axbenchmark events TOPIC…` | `runs.list`, `jobs.list`, `jobs.cancel`, `events.subscribe` (JSON lines; a debugging aid and the model for the future MCP client). |

Every CLI command starts with `engine.hello` through `connect(autostart=True)`; an incompatible major version exits 3 with the restart instruction.

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain | `next_starts`: four harnesses start together; a second entry of one harness waits until the first is final; never more than `max_active`; `jobs=1` starts one at a time in entry order; nothing starts after a run stop. `continuation`: `exited` with non-zero code and `timed_out` continue; `auth_failed`, `config_failed`, `model_rejected`, `launch_failed` halt; no input yields a retry. `transition` rejects every edge outside the table (for example `complete → running`). `InterruptionCause` has no disconnect member. `allowed_actions` gives stop, detach and inspect while active and never an edit. `ReplayWindow` refuses across epochs. `IdlePolicy` never exits with an active run or job. `compatible` on major versions. |
| Use cases with fakes | `FakeHarnessExecution` scripts task exits and records calls; fake M01, M02, M07, M08, M10, M12 interfaces; `FakeClock`. Default policy with five entries yields the queue drawn in RunQueued and the recorded `SchedulingRecord`s. A timeout in T4 starts T5 with the T4 workspace reference and no second `invoke` for T4. An authentication failure halts only that configuration and seals it; others finish. Every `invoke` deadline is start + 3 h by default. A template mismatch before T3 calls `mark_identity_invalidated` and never rebinds. `StopRun(configuration)` ends only that configuration, marks the running task interrupted and later tasks `not_run`, and publishes `run.stop.completed` only after the fake `CleanupReport`. `ReconcileRuns` with a state file from another engine instance marks the run interrupted (`engine_lost`) and starts nothing. Launch cancelled at step `weights` leaves no run directory and no result; `templates.identity_mismatch` at step `identity` writes nothing. |
| Daemon | Subscribe with `since_seq` inside the window replays exactly the missed events; outside it, or with another epoch, returns a fresh snapshot with `replayed: false`. A subscriber that stops reading gets `events.subscription.resynced` while a fast publisher is never blocked. A job outlives the session that started it; `jobs.cancel` reaches `cancelled`. `engine.stop` with an active run returns `engine.runs_active`. A second `axbenchmarkd` fails to take the instance lock. The socket is created 0600 in a 0700 directory and rejects another uid. |
| API via `InProcessClient` | All modules wired with fake ports, no interface: `runs.launch` → `job.finished` with `run_id`; subscribe to `run:<id>`; drop the client mid-task; reconnect with `since_seq`: same pids, no new `harness.task.started` for the running task, no interruption recorded, `run.observation.changed` reports the gap. `runs.stop` is the only call that changes execution state; `events.unsubscribe`, disconnect and every query leave `state.json` byte-identical. `runs.status` works for an ended run after an engine restart. Each error code in part 2 is reachable, serializes with `data.code`, and registry metadata gives each method its kind and safety class. `import-linter` contracts for `engine.runs` and `engine.daemon` layers and for `tui`/`cli` importing only `api` and `client`. |
| Screens with a fake client | `RunScreen` via `App.run_test()` / `Pilot` with fixtures for RunOverview, RunQueued, RunSequential, RunFailures and RunReattached: lane text, glyphs, empty lane, `#lanes-table` under `.-compact`, `#lane-n-error` from `runs.state_unreadable`; `s`, `v`, `enter` dimmed from flags; `e` opens LockedScreen with the returned rows; leaving the screen issues only `events.unsubscribe`. `HarnessLiveScreen` for the three live artboards: "? not reported", "? unverified", `t` dimmed, `[`/`]` each issue one `harness.workspace.diff`, `esc` issues no command. `DetachScreen` `enter` issues no call. `StopScreen` scope change issues one `runs.stop_preview`; `enter` issues exactly one `runs.stop`. `StoppingScreen` shows completion only after `run.stop.completed`. View-model builders and `apply_run_event` are unit-tested without Textual. |
