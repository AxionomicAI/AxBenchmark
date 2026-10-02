# M14 — Command-line and unattended access

Status: proposed requirements. [SPEC.md](../SPEC.md), especially Command-line access and the execution acceptance criteria, remains authoritative. This module defines the CLI contract for engineers implementing terminal entry points; it does not describe existing functionality.

## Purpose and command contracts

The CLI opens the primary TUI and exposes unattended execution, observation, discovery, reporting, and exchange. The CLI and the TUI are interchangeable clients of one headless engine ([ARCHITECTURE.md](ARCHITECTURE.md)); every CLI action calls the same engine API method the TUI uses, and no behavior depends on which interface started it or whether one is attached. [R150] The signatures below are required interface contracts, not executable examples; their placeholders identify the requested run, retained directory, template revision, or package. [R048–R059, R138]

| Required signature | Input, outcome, and delegated validation |
|---|---|
| `axbenchmark` | Open [M15's TUI](15-terminal-interface.md), including library/setup access and readiness feedback. No subcommand is required to choose this default interface. [R048] |
| `axbenchmark --attach RUN_ID` | Select an existing running benchmark and observe its current work through M11. Reconnection does not launch another run or restart tasks. [R049; R046 dependency] |
| `axbenchmark run --config benchmark.yaml --no-tui` | Read the fully specified run configuration, apply M07 launch validation, and execute with plain terminal progress. Missing choices cannot cause interactive questions. [R050, R060] |
| `axbenchmark status RUN_ID` | Select a run and display its persisted status, including saved execution failures; status must not depend on an attached TUI. [R051, R060] |
| `axbenchmark stop RUN_ID` | Explicitly stop the identified run through M11, cleaning up its child processes and application services. Closing an interface is a separate action. [R052; R046 dependency] |
| `axbenchmark models refresh` | Request model and effort discovery through M04, preserving its last valid catalog on refresh failure and preserving user overrides. [R053; R063, R064 dependencies] |
| `axbenchmark doctor` | Inspect prerequisites through M03 and display actionable setup guidance, including distinct collector availability failures without making optional sensors mandatory. [R054; R103 dependency] |
| `axbenchmark report RUN_DIR` | Regenerate the report from the selected saved results through M02/M13, without model calls. The output is the standalone offline HTML report. [R055; R125, R134 dependencies] |
| `axbenchmark templates export TEMPLATE_SHA --output template.zip` | Select the exact template revision by SHA-256 and export its complete portable definition through M01/M17. [R056; R115 dependency] |
| `axbenchmark templates import template.zip` | Validate the package and recompute template identity before adding it to the library through M17; invalid packages produce no partial registration. [R057; R117, R120 dependencies] |
| `axbenchmark results export RUN_ID --output results.zip` | Export the selected run's records, required evidence, provenance, and exact referenced template through M02/M17. [R058; R116 dependency] |
| `axbenchmark results import results.zip --template TEMPLATE_SHA` | Select the local revision and add results only after M17 recomputes and validates both embedded and local template identities, declared identity, payload digests, references, and task identifiers. [R059; R120 dependency] |

## Unattended execution and lifecycle

[M07](07-run-configuration.md) supplies complete resolved launch settings: pinned template, competitor configurations, environment settings, judge, and both weight sets. The engine validates and freezes these using the same contracts as interactive launch; the CLI only submits the file and presents the result. Incomplete or invalid unattended settings require a useful explanation instead of a prompt or execution with unresolved choices. [R050, R060; R033, R066, R067 dependencies]

[M05](05-harness-execution-isolation.md) runs every planner, competitor, and judge invocation headlessly. Multiple configurations per harness remain supported. [M11](11-run-orchestration.md) defaults to one configuration per selected harness concurrently, up to four; additional configurations within a harness queue sequentially, and tasks within each configuration always remain sequential. Expose the source option `--jobs 1` and its equivalent TUI setting through M11, with scheduling and concurrency retained in results. [R138; R012, R045 dependencies]

Execution outlives its observing interface. Closing, detaching, or disconnecting must not stop work or manufacture an interruption. Reattachment observes existing execution without replay; actual execution failures remain visible in saved state and subsequent status. Explicit stopping invokes lifecycle cleanup. These actions do not add automatic retry or resume behavior. [R049, R051, R052, R060, R138; R046, R077 dependencies]

## Shared validation and failure boundaries

[M03](03-environment-readiness.md) determines readiness: with no supported harness, block local planning/execution with actionable guidance while retaining library, package exchange, and saved-result reporting. [M04](04-model-catalog.md) owns discovery, supported efforts, offline catalog fallback, and refresh failures; the CLI must not invent compatibility or substitute models after failure. [R050, R053, R054, R055–R059; R029, R063–R065 dependencies]

[M01](01-template-library-identity.md) owns immutable identity and [M17](17-zip-exchange.md) owns package safety and atomic validation. Imports are data operations: no scripts, dependency installation, model calls, or modification of existing results. Reject unsafe, corrupt, incomplete, unsupported, mismatched, or conflicting packages without partial additions. Show expected and received identities on mismatch; identical reimports remain idempotent. [R057, R059; R117, R120–R122 dependencies]

[M02](02-retained-results-comparability.md) supplies preserved results and provenance for status, exports, and reporting. [M13](13-standalone-html-report.md) regenerates offline HTML from that evidence without fresh judging, attempts to open the report, and always displays its location. Preserve unknown measurements and original records rather than inventing missing results. [R051, R055, R058; R080, R116, R125, R134 dependencies]

## Acceptance criteria

- Exercise all twelve signatures: each selects its documented target and delegates to its named operation. Bare invocation opens the TUI; fully specified unattended invocation presents plain progress without interactive questions. Incomplete configuration receives validation feedback. [R048–R060]
- Run multiple configurations across harnesses, then use sequential mode: observe M11's concurrency, same-harness queues, sequential tasks, recorded scheduling, and headless model work in both interface paths. [R138; R045 dependency]
- Close and reconnect during execution without restarting tasks. Inspect persisted status after a real failure; distinguish it from disconnection. Explicitly stop a run and verify child-process and application-service cleanup. [R049, R051, R052, R060, R138]
- Refresh discovery with a failing provider and inspect prerequisites without a harness; verify retained catalog/overrides, actionable guidance, and continuing data-only access. [R053, R054; R029, R063, R064 dependencies]
- Export/import an exact template and its run results; validate recomputed identities and payloads, rejection without partial additions, idempotence, and absence of execution during import. Regenerate saved HTML without model calls and open it offline. [R055–R059; R117, R120–R122, R125 dependencies]

## Implementation

This section applies [the architecture decision](ARCHITECTURE.md) to the command line. Everything below is an implementation choice; the product behavior above stays authoritative. The CLI is a client: it parses arguments, issues API calls, follows event streams and prints what comes back. It evaluates no module rule, reads or writes nothing under `~/.axbenchmark/`, and never stops work it did not explicitly ask to stop. **[R150]**

### 1. Engine component

M14 has no engine package, owns no API namespace, persists nothing and owns no processes. The only process a CLI invocation causes is the engine itself: `axbenchmark.client.connect(autostart=True)` ([M11](11-run-orchestration.md)) starts `axbenchmarkd` detached when no engine answers, and that engine is never a child of the CLI. Runs, jobs and their cleanup belong to the engine ([M05](05-harness-execution-isolation.md), [M11](11-run-orchestration.md)).

The client side keeps the same inward-pointing layers as an engine module, adapted to a client package:

| Layer | Path | Contains | May import |
|---|---|---|---|
| Presenters | `axbenchmark/cli/presenters/` | Pure functions from API models and event payloads to `Line` sequences, one module per command group (`run.py`, `status.py`, `doctor.py`, `catalog.py`, `exchange.py`, `report.py`, `engine.py`, `generic.py`). The only formatting logic is layout: column widths, SHA display forms (full 64, `short8`, `first16…last8`), and glyphs paired with words as in the TUI. Every state word, reason, remedy and outcome is the engine's text. | `api`, stdlib |
| Ports | `axbenchmark/cli/ports.py` | `Output` (human or JSON writer), `TuiLauncher`, `Interrupts` (Ctrl-C as a detach signal). The engine connection is the `EngineClient` Protocol from `axbenchmark.client`. | `api`, presenters |
| Interactions | `axbenchmark/cli/interactions/` | One async class per command (`RunUnattended`, `ShowStatus`, `StopRun`, `RefreshModels`, `Doctor`, `RegenerateReport`, `ExportTemplate`, `ImportTemplate`, `ExportResults`, `ImportResults`, `EngineStatus`, `EngineStop`, `CallMethod`). Each takes `EngineClient`, `Output` and `Interrupts` in `__init__`, issues the calls in the tables below, and returns an `ExitCode`. Shared stream following lives in `interactions/streams.py`. | ports, presenters, `api`, `client` (Protocol only) |
| Adapters | `axbenchmark/cli/app.py`, `axbenchmark/cli/commands/`, `axbenchmark/cli/output.py`, `axbenchmark/cli/registry_commands.py` | Typer apps and command functions (argument parsing, path resolution, `asyncio.run`), `HumanOutput` and `JsonOutput`, SIGINT handling, and the registry-generated command groups. | everything above, `typer`, `rich` |

The wireframe legends name `axbenchmark/cli.py`; it becomes the package `axbenchmark/cli/` above, with `app.py` holding the root Typer app.

Entry point. The `axbenchmark` console script is `axbenchmark/launcher.py:main`, the composition root of the clients. It builds the Typer app with a `TuiLauncher` bound to `axbenchmark.tui.__main__.main` ([M15](15-terminal-interface.md)), so `cli` never imports `tui`. `launcher` is the only module allowed to import both; an `import-linter` contract keeps it out of `engine`, `cli`, `tui` and `mcp`, and keeps `cli` importing only `api` and `client` as ARCHITECTURE.md requires.

```python
class ExitCode(IntEnum):
    OK = 0           # success
    FAILED = 1       # the operation failed: a typed engine error, or a followed run that ended stopped or interrupted
    USAGE = 2        # invalid usage detected by the CLI parser; nothing was sent
    ENGINE = 3       # engine unreachable, or api_version major mismatch

@dataclass(frozen=True, slots=True)
class Line:
    text: str
    style: Literal["plain", "bold", "muted", "ok", "fail", "warn"] = "plain"
    stream: Literal["out", "err"] = "out"

class Output(Protocol):
    json_mode: bool
    def result(self, model: BaseModel, human: Sequence[Line]) -> None: ...
    def event(self, envelope: EventEnvelope, human: Sequence[Line]) -> None: ...
    def error(self, err: ApiError) -> None: ...          # code, message, field paths, remedy, data
    def notice(self, lines: Sequence[Line]) -> None: ...  # human mode only; dropped in JSON mode

class TuiLauncher(Protocol):
    def __call__(self, *, attach: RunId | None) -> int: ...   # returns the TUI's exit code

class Interrupts(Protocol):
    def detach_requested(self) -> asyncio.Event: ...          # set by SIGINT; never sends a call

async def follow_job(client: EngineClient, job: JobRef, out: Output, interrupts: Interrupts,
                     on_progress: Callable[[JobProgress], Sequence[Line]],
                     on_event: Callable[[EventEnvelope], Sequence[Line]] | None = None) -> JobFinished | Detached: ...

async def follow_run(client: EngineClient, run_id: RunId, out: Output, interrupts: Interrupts,
                     topics: Sequence[str]) -> RunFinished | Detached: ...
```

`follow_job` subscribes with `events.subscribe(["job:<job_id>"])`; the snapshot holds the job's current state, so a job that finished before the subscription is reported from the snapshot and no event is missed. `follow_run` subscribes with `events.subscribe(["run:<run_id>", …])`, renders the snapshot first (the current state of every configuration), then each event in `seq` order. On a dropped socket both reconnect once with `since_seq` and continue; a second failure exits 3 and leaves the work running.

Detach. SIGINT while following sets `Interrupts`; the interaction closes its subscription, prints the follow-up commands built from the ids it already holds (`axbenchmark --attach RUN_ID`, `axbenchmark status RUN_ID`, `axbenchmark stop RUN_ID` for runs; `axbenchmark jobs get JOB_ID` and `axbenchmark jobs cancel JOB_ID` for jobs) and exits 0. SIGHUP, SIGTERM and a closed terminal end the CLI process the same way without printing. No signal path issues `runs.stop`, `jobs.cancel` or any other command. **[R049, R060, R138]**

Paths. The engine runs with its own working directory, so every path argument (`--config`, `RUN_DIR`, ZIP paths, `--output`) is resolved to an absolute path against the CLI's working directory with `Path.absolute()` before it is sent. The CLI does not open, stat or read these files; existence, format and safety errors come back from the owning module.

### 2. API surface

None. M14 defines no methods and no events. It relies on the shared API contract from ARCHITECTURE.md: JSON-RPC errors with a stable `code`, `message`, optional `field` paths and `remedy`; `JobRef`, `job.progress`, `job.finished`; `events.subscribe` snapshots and `seq`; the method registry in `axbenchmark.api` with kind, request and response models, description and safety class.

Output contract (all commands):

| Mode | stdout | stderr |
|---|---|---|
| Human (default) | Results and progress, one line per event, glyphs `✓ ✗ ▲ ● ○ ?` always paired with words. No colour when stdout is not a TTY or `NO_COLOR` is set. Never prompts: no command reads stdin. | Typed errors as `✗ <message>`, then `field` paths, then `remedy`, verbatim; transport problems. |
| `--json` | A query or command prints one JSON document: the response model (`model_dump(mode="json")`). A job or stream prints JSON lines: each event as `{"seq", "event", "data"}`, then a final `{"result": …}` or `{"error": {"code", "message", "field", "remedy", "data"}}`. Detach ends with `{"detached": {"run_id" \| "job_id"}}`. | Nothing except transport problems that occur before a JSON writer exists. |

Exit codes follow ARCHITECTURE.md and are the same for every command, including registry-generated ones:

| Code | Meaning |
|---|---|
| 0 | The operation succeeded, a followed operation was detached by Ctrl-C, or an inspection ran whatever it found (`doctor`, `models refresh` with per-context failures reported as outcomes). |
| 1 | A typed engine error (validation, not found, rejected package, conflict, refused stop), or a followed run that ends (`run.state.changed` with `state: ended`) with an `outcome` other than `completed` (`stopped`, `interrupted`). The CLI does not decide success; it reads the engine's outcome. |
| 2 | Invalid usage found by the parser (missing argument, unknown option, malformed `--params`, a destructive generic call without `--yes`). Nothing is sent to the engine. |
| 3 | The engine cannot be reached or started, or `engine.hello` reports a different `api_version` major; the message names `axbenchmark engine stop` and the restart that follows. |

The proposal on the CliHelp board (3 for a rejected package, 4 for not found, 2 for an incomplete configuration) is replaced by this table: a rejected package, a missing run and an incomplete configuration are typed engine errors and exit 1 with their `code` printed.

### 3. Requires from other modules

| Method or event | Owner | Purpose |
|---|---|---|
| `axbenchmark.client.connect(autostart=True)`, `EngineClient` Protocol, `InProcessClient` | M11 | Connection, engine autostart, test client |
| `engine.hello` | M11 | Version negotiation on every connection |
| `engine.status` (query → `EngineStatus {pid, instance_id, started_at, socket_path, active_runs, active_jobs, sessions, idle_exit_at?}`; versions from `engine.hello`) | M11 | `axbenchmark engine status` |
| `engine.stop` (command; refuses with `engine.runs_active {run_ids}` while runs are active) | M11 | `axbenchmark engine stop` |
| `events.subscribe(topics, since_seq?)` with topics `run:<id>`, `job:<id>` (snapshot + `seq`), `job.progress`, `job.finished`, `jobs.get`, `jobs.cancel` | M11 | Following jobs and runs; reconnect with `since_seq` |
| `runs.launch(config_path, execution={concurrency: {jobs}}?)` (job; `job.finished` carries `LaunchResult` with `run_id`) | M11 | `run --config … --no-tui` |
| `runs.status(run_id)` → `RunStatus` (template, scheduling summary, observation, `configurations: [ConfigurationStatusDTO]` with tasks, elapsed, cost with basis, `state_reason`, engine-composed `notes`) | M11 | `status RUN_ID`, from persisted state with no client attached |
| `runs.stop(run_id, scope="run")` (destructive) → `StopReceipt`; then `run.stop.progressed` and `run.stop.completed` (`StopProgressDTO` with M05's `CleanupReport`) on `run:<id>` | M11 | `stop RUN_ID` |
| Run events `run.log.appended` (`RunLogEntryDTO`, text composed by the engine), `run.configuration.changed`, `run.task.started`, `run.task.ended`, `run.state.changed {state, outcome?}` on `run:<id>` | M11 | Plain progress lines without the CLI joining events from M05, M08 and M10; `run.log.appended` is the line source. |
| `configs.review(config_path, execution={concurrency: {jobs}}?)` → `LaunchPreview`; error `configs.incomplete {issues, checks}` | M07 | Validation output before launch; `checks` lists passing and failing checks in order for the CliInvalid frame. |
| `environment.recheck(scope)` job → `EnvironmentReportDTO`; `environment.report.updated` | M03 | `doctor`, `doctor --collectors` |
| `catalog.refresh(context_ids?, harness?, provider?)` job → `RefreshReport`; `catalog.refresh.started`, `catalog.refresh.finished` | M04 | `models refresh`; M04 resolves the filters, so the CLI never derives context ids. |
| `results.get_run(run)` (run id or run directory) | M02 | `report RUN_DIR` target resolution |
| `reports.generate(scope={run: RUN_DIR})` job → `ReportOutcome {path, size, result_count, judge_groups, weights_label, open_attempt {attempted, opened, detail}}` | M13 | `report RUN_DIR`; the engine attempts to open the file and the CLI always prints `path` |
| `exchange.export_template(sha256, path)` job, `exchange.import_template(path)` job → `TemplateImportOutcome`; errors `exchange.digest_mismatch {declared, computed, differing_paths}` and the other `exchange.*` codes | M17 | `templates export`, `templates import` |
| `exchange.export_results(run_id, result_ids?, path)` job; `exchange.inspect_results(path, template_sha256)` job → `ResultImportPreview {staging_id, …}`; `exchange.import_results(staging_id)` → `ImportOutcome` | M17 | `results export`, `results import` |
| `judging.status(run_id)`, events `judging.batch.started`, `judging.review.finished`, `judging.batch.finished` | M12 | Judging lines in `run --no-tui` and `status` |
| `harness.configuration.describe(run_id, configuration_id)` | M05 | `status RUN_ID --details`: requested vs effective settings per configuration |
| `axbenchmark.tui.__main__.main(attach_run_id: str \| None)` (bound by `launcher.py`, never imported by `cli`) | M15 | Bare `axbenchmark` and `--attach RUN_ID` through `TuiLauncher` |
| Registry CLI hints in `axbenchmark.api` (`cli_name`, positional fields) | M11 (registry), each owning module for its own methods | Generated command names such as `templates show` (M01) and `models list` (M04) |

### 4. Screens

M14 owns no Textual screens. Its artboards on the M14 page are plain terminal output; each maps to an interaction, a presenter and the calls below. Glyph lines, column layouts and wording on the boards are the presenter targets.

| Artboard | Command module · interaction · presenter | Calls, in order | Events followed | Exit |
|---|---|---|---|---|
| CliHelp | `cli/app.py` root help | none: Typer help is generated from the command definitions and, for generated groups, from registry descriptions. The twelve signatures are listed first in the order of the board. | — | 0 |
| CliRun (wide, compact) | `commands/run.py` · `RunUnattended` · `presenters/run.py` | `configs.review(config_path, execution)` → validation lines and the "Frozen … / Scheduling …" lines from `LaunchPreview`; `runs.launch(config_path, execution)` job → `run_id`; `events.subscribe(["run:<run_id>"])` (M11 routes `judging.batch.started` for the run there; `judging.*` is added for review lines) | `run.*`, `judging.batch.*`, `judging.review.finished`; compact layout when the terminal is narrower than 100 columns | 0 on outcome `completed` or detach; 1 on `stopped`, `interrupted` or a typed error |
| CliInvalid | same | `configs.review` fails with `configs.incomplete`: every issue printed with its source and remedy, then the engine's summary; `runs.launch` is not called | — | 1 |
| CliStatusStop | `commands/runs.py` · `ShowStatus`, `StopRun` · `presenters/status.py` | status: `runs.status(run_id)`, `judging.status(run_id)`; with `--details`, `harness.configuration.describe` per configuration. stop: `runs.stop(run_id, scope="run")`, then follows `run.stop.completed` | — | 0; 1 with `runs.unknown_run` or another typed error |
| CliDoctor | `commands/doctor.py`, `commands/models.py` · `Doctor`, `RefreshModels` · `presenters/doctor.py`, `presenters/catalog.py` | `environment.recheck(scope="all" \| "collectors")` job; `catalog.refresh(harness?, provider?)` job | `job.progress`; `catalog.refresh.finished` per context | 0 when the job finished, whatever it found; 1 on a job error |
| CliExchange | `commands/templates.py`, `commands/results.py`, `commands/report.py` · `ExportTemplate`, `ImportTemplate`, `ImportResults`, `ExportResults`, `RegenerateReport` · `presenters/exchange.py`, `presenters/report.py` | see the CLI table in part 5 | `job.progress` | 0; 1 on any `exchange.*`, `results.*` or `reports.*` error, with expected and received identities printed in full from the error data |

Consumers in the TUI. `ReviewLaunchScreen` (`tui/screens/setup.py`, binding `c` → `copy_cli`) copies `LaunchPreview.cli_command` from M07; M14 code is not involved, and the copied text must match the `run` signature here. `DetachScreen` (`tui/screens/run.py`) names `axbenchmark --attach RUN_ID` in its notice. `--attach RUN_ID` opens `AxBenchmarkApp` ([M15](15-terminal-interface.md)) on `RunScreen` ([M11](11-run-orchestration.md)), which loads with `runs.status` and subscribes; the RunReattached board is that state.

### 5. CLI

The twelve signatures and the engine commands. Each row is one interaction; "then" means the second call uses the first call's result.

| Command | API methods and stream | Human output | Requirement |
|---|---|---|---|
| `axbenchmark` | `TuiLauncher(attach=None)`; the TUI connects and loads itself (M15). The CLI issues no call. | The TUI. When stdin or stdout is not a terminal, exit 2 with a message naming `run --no-tui` and `status`. | **R048** |
| `axbenchmark --attach RUN_ID` | `TuiLauncher(attach=RUN_ID)`; `RunScreen` calls `runs.status` and `events.subscribe(["run:<run_id>"])`. No launch, restart or new trial is requested. | The TUI on the run. | **R049; R046** |
| `axbenchmark run --config FILE --no-tui [--jobs N]` | `configs.review(config_path, execution)` then `runs.launch(config_path, execution)` job, then `follow_run(run_id, ["run:<run_id>", "judging"])` | Validation lines, frozen record locations, scheduling line, one line per event, detach hints on Ctrl-C | **R050, R060, R138; R045, R067** |
| `axbenchmark status RUN_ID [--details]` | `runs.status` and `judging.status`; `--details` adds `harness.configuration.describe` | Run header, one row per configuration with the engine's state text, failures kept visible after a stop | **R051, R060** |
| `axbenchmark stop RUN_ID` | `runs.stop(run_id, scope="run")` (destructive), then follows `run.stop.progressed` / `run.stop.completed`. The signature itself is the explicit request, so no `--yes` is needed and nothing is asked. | Cleanup lines per configuration, saved outcome lines, summary | **R052; R046, R139** |
| `axbenchmark models refresh [--harness H] [--provider P]` | `catalog.refresh` job; `follow_job` with `catalog.refresh.finished` lines | One line per context: outcome, cause, last-valid age; overrides kept; catalog version | **R053; R063, R064** |
| `axbenchmark doctor [--collectors]` | `environment.recheck(scope)` job; `follow_job` | Harness rows, runtimes, collectors with cause and `remedy`, summary line | **R054; R103** |
| `axbenchmark report RUN_DIR` | `results.get_run(RUN_DIR)` then `reports.generate(scope={run: run_id})` job | Read line, written path (always), open-attempt warning when `opened` is false | **R055; R125, R134** |
| `axbenchmark templates export TEMPLATE_SHA --output template.zip` | `exchange.export_template(sha256, path)` job | Written path, file count, size, identity confirmation | **R056; R115** |
| `axbenchmark templates import template.zip` | `exchange.import_template(path)` job | Added or identical-skipped with SHA-256; on rejection the declared and computed digests in full and the differing paths | **R057; R117, R120, R122** |
| `axbenchmark results export RUN_ID --output results.zip` | `exchange.export_results(run_id, path)` job | Written path, result count, contents line | **R058; R116** |
| `axbenchmark results import results.zip --template TEMPLATE_SHA` | `exchange.inspect_results(path, template_sha256)` job then `exchange.import_results(staging_id)`. The CLI does not inspect the preview for permission; a conflict or mismatch is the engine's typed error. | Package, template and reference check lines, added and skipped-identical counts | **R059; R117, R120–R122** |
| `axbenchmark engine status` | `engine.status`, connecting with `autostart=False` | Pid, versions, socket, active runs and jobs, connected clients; "engine not running" and exit 3 when nothing answers | **R150** |
| `axbenchmark engine stop` | `engine.stop`; `engine.runs_active` exits 1 and prints the run ids with their `stop` commands | Confirmation that the engine exited | **R150** |

`TEMPLATE_SHA` is passed to the engine as given; M01 and M17 decide what they accept.

Registry access. Every API method is reachable from the CLI, as ARCHITECTURE.md requires, without per-method plumbing:

- `cli/registry_commands.py` builds one Typer group per namespace from the registry in `axbenchmark.api` (for example `axbenchmark catalog entries`, `axbenchmark jobs get JOB_ID`). Command names are the method verb with `_` → `-`, or the `cli_name` the owning module registers (`templates show` for `templates.get`, `models list` for `catalog.overview`). Options come from the request model: scalar, enum, path and boolean fields become `--field-name` options, positional fields named in the registry hints become arguments, and any request can be given whole with `--params JSON` or `--params-file PATH`. Hand-written commands in `cli/commands/` take precedence over generated ones with the same name.
- `axbenchmark api list [--namespace NS]` prints the registry (method, kind, safety class, description); `axbenchmark api schema METHOD` prints its request and response JSON Schema; `axbenchmark api call METHOD [--params JSON] [--yes]` calls any method and, for a job, follows it.
- A generated or `api call` invocation of a method whose safety class is `destructive` requires `--yes` and otherwise exits 2 without sending anything; there is no prompt. Queries print the response; commands print the result; jobs are followed with `follow_job`. All accept `--json`.
- The commands other modules list as owned by M14 (M01 `templates list|show|tasks|manifest|verify|revisions|revise|approve|restore`, M04 `models list|show|override`, M05 `harness …` and `run log|isolation`, M06 `scoring …`, M07 `configs …`, `presets …`, `run record`, M08 `checks …`, M09 `templates prompts|checks`, M10 `measurements …`) are registry-generated commands with those modules' `cli_name` hints. They are implementation-level access, not product signatures.

### 6. Headless verification

| Level | Tests |
|---|---|
| Presenters (pure, no Typer, no client) | Golden-line tests per board: the fixture DTOs and events behind CliRun (wide and compact), CliInvalid, CliStatusStop, CliDoctor and CliExchange render the boards' lines. Unknown, partial and not-exposed values print the engine's text and glyph; no presenter computes a state, cost basis, readiness or identity verdict. |
| Interactions (fake `EngineClient`, fake `Output`, scripted `Interrupts`) | Each command issues exactly the method sequence in part 5 and nothing else. `run`: `configs.incomplete` → no `runs.launch`, exit 1, every issue printed in order; a scripted run stream ending with outcome `completed` → 0 and `stopped` or `interrupted` → 1. Ctrl-C during `run`, `models refresh`, `doctor` and `report` sends no further call (in particular no `runs.stop` or `jobs.cancel`), prints the follow-up commands and exits 0. A snapshot showing a job already finished ends `follow_job` without waiting. A dropped connection resumes with `since_seq`. Typed errors print `message`, `field` and `remedy` verbatim and exit 1; `--json` output validates against the exported JSON Schema line by line. Path arguments arrive absolute. |
| CLI with `InProcessClient` (Typer `CliRunner`, composed engine with fake harness, browser and sensor adapters, no TUI) | All twelve signatures plus `engine status|stop` against one engine. `run --no-tui` completes without reading stdin; `--jobs 1` is recorded in the run's scheduling. `status` after a scripted authentication failure shows it; after `stop` it still shows it and the stopped configurations as interrupted. `models refresh` with a failing fake provider keeps the last valid entries and exits 0. `doctor` with no harness reports guidance while `templates export|import`, `results export|import` and `report` still succeed. A tampered template ZIP exits 1 with `exchange.digest_mismatch` and adds nothing; re-importing an identical package reports it skipped. `report` runs with the model ports set to fail on any call. **[R048–R060, R138]** |
| Process level (real socket, `axbenchmarkd` with fake harness adapters) | Start `run --no-tui` in a subprocess, kill it with SIGINT and with SIGKILL: the run continues, `status` shows it running and no interruption is recorded; `--attach` observation resumes with no task restarted; `stop` reports cleanup and leaves no child process of the run alive. With no engine running, `engine status` exits 3 and any other command autostarts the engine. An engine reporting a different `api_version` major makes every command exit 3. **[R049, R052, R060, R138, R150]** |
| Launcher and registry | Bare `axbenchmark` calls `TuiLauncher(attach=None)` and `--attach X` calls it with `X`, with a fake launcher. Every method in the registry is reachable through a generated command or `api call`; a destructive method without `--yes` exits 2 with zero calls. `import-linter`: `cli` imports only `api` and `client`; `cli.presenters` imports neither `client`, `typer` nor `rich`; only `launcher` imports `tui`. |
