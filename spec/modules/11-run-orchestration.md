# M11 — Run scheduling and persistent lifecycle

Status: proposed requirements. Engineers use this module to connect launch validation, execution scheduling, observation, stopping, and retained results while keeping execution independent of the TUI. The [product specification](../SPEC.md) is authoritative; requirement IDs identify its assigned source contracts.

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

The following are conceptual lifecycle boundaries, not required status names, storage fields, or a prescribed process architecture.

| Boundary | Observable contract |
|---|---|
| Launch | Work uses the recomputed template identity and separately frozen run configuration and original weights. [R067] |
| Queue to execution | A configuration starts according to the selected concurrency policy; its tasks remain sequential. [R045] |
| Active observation | Progress and measurements are visible while approved checks and evidence preservation participate in the execution workflow. A selected configuration's current task can be watched live (workspace changes, exposed reasoning, actions, output rate, context use) without affecting its execution. [R034, R044] |
| Detach or close | Execution continues independently of the TUI; disconnecting is not an interrupted benchmark. [R046, R060, R139] |
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
| [M15 TUI](15-terminal-interface.md) and [M14 CLI](14-command-line-interface.md) | Share scheduling and lifecycle behavior, including sequential mode, unattended execution, attachment without restart, restricted active controls, and explicit stopping. Provide the live observations of each active task process to an attached interface; attaching, watching, or leaving a live view never changes execution. [R044, R045, R046, R047, R060, R138] |

## Acceptance criteria

- Select all four harnesses with extra configurations for one harness: observe at most one active configuration per harness, up to four total, sequential same-harness queuing, sequential tasks, and recorded scheduling. Repeat using each interface's sequential setting and observe one configuration at a time. [R045, R138]
- Launch with complete unattended configuration: observe headless execution, progress, measurements, approved checks, and retained evidence without interactive questions. [R034, R060, R138]
- Detach, close, and reconnect during a task: execution continues and attachment does not restart it. Explicitly stop a configuration and a whole run in separate cases; their child processes and application services are cleaned up. [R046, R138, R139]
- Attempt active prompt, model, or original-weight edits and hint injection: none changes the comparison. Verify separate launch freezes, recomputed identity binding, and invalidation of the identity claim on template mutation. [R047, R067]
- Verify the one-trial and three-hour per-task defaults. Exercise ordinary failure and timeout: later tasks use the resulting workspace without automatic reruns. Exercise authentication/configuration failure: only that configuration halts. Actual interruptions, failures, and observable internal retries remain saved. [R060, R077, R139]
