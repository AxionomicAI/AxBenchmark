# M15 — Terminal user interface

Status: proposed requirements. [SPEC.md](../SPEC.md) is authoritative. This contract describes observable behavior, not an implemented interface. How the TUI is built follows [the architecture decision](ARCHITECTURE.md) and is specified under Implementation.

## Purpose and interaction contract

The primary interface for AxBenchmark's Python terminal application is a TUI; the product neither requires nor uses tmux. It connects reusable or prompt-created benchmarks, selected harness/model configurations, measurements, independent LLM quality reviews, and interactive reporting. Other machines' results can join comparisons only against a matching template SHA-256. [R002, R011]

The TUI holds no benchmark logic or state. All of it lives in the headless engine; the TUI presents what the engine returns and requests operations from it, and the CLI and a later MCP server are interchangeable clients of the same engine. No behavior depends on which interface started work or whether one is attached. [R150]

Users must be able to complete setup, approve custom tasks, observe every selected harness, inspect results, and export the report through the TUI. Provide keyboard navigation, visible shortcuts, mouse interaction, clear validation messages, and layouts that adapt to terminal size. Exact bindings, breakpoint dimensions, colors, and libraries are implementation choices; the [wireframes](../design/wireframe-tui/navigation.md) and the Implementation section record the ones made. [R038, R135]

## Required views and actions

| View | Inputs, actions, and observable output |
|---|---|
| Home/library | Present the seven-task inventory benchmark as the default choice. Let users select templates, create or import them, manage revisions and revision-scoped saved configurations, reconnect to active runs, and inspect accumulated results. Use [M01](01-template-library-identity.md), [M09](09-default-inventory-benchmark.md), and [M17](17-zip-exchange.md) for these operations. [R029, R039] |
| Environment | Display discovered harnesses, model information, authentication readiness, runtimes, browser support, and hardware collectors. Identify unavailable prerequisites, provide installation/setup guidance, and expose recheck. Consume readiness from [M03](03-environment-readiness.md), catalog information from [M04](04-model-catalog.md), and collector availability from [M18](18-hardware-monitoring.md). [R029, R040] |
| Setup | Load and edit the selected template revision's run configurations and independent judge/weight selections. Keep task-template creation or revision separate from execution-setting edits, through [M16](16-custom-template-planning.md). [M07](07-run-configuration.md) supplies saved settings, launch validation, and freezing. [R041] |
| Execution | Show harness panels and queued, running, and completed configuration states, current tasks, elapsed time, logs, and available measurements, plus a live view of a selected configuration's current task. Run against the pinned template revision, execute its approved checks, and preserve evidence through the execution dependencies below. [R034, R042] |
| Results | Inspect local and imported results with machine and judge filters, task evidence, rankings, alternative weights, and ZIP/HTML export actions. Preserve template compatibility and judge grouping through [M02](02-retained-results-comparability.md); expose analysis through [M06](06-scoring-rankings.md). [R002, R043] |

## Setup and launch boundary

Selecting an already approved template reuses its frozen tasks without planner invocation or task regeneration. Custom authoring accepts the project prompt, project type, and empty-project or committed-repository baseline, then supports reviewing, editing, regenerating, approving, and saving tasks under M16. These are authoring actions, not edits to an active comparison. [R039, R041, R135]

Before launch, display the full setup from M07: pinned template identity, competitor harness/provider/model/effort entries, environment choices, independent judge, rubric, both weight sets, and execution settings. Complete validation and separately freeze the template and resolved launch configuration/original weights before execution. Multiple configurations per harness remain distinct. [R041, R034; M07 integration]

Expose the sequential setting corresponding to the CLI's `--jobs 1` through [M11](11-run-orchestration.md) and [M14](14-command-line-interface.md). M11 owns the default of one configuration per selected harness concurrently, up to four, same-harness queues, sequential tasks, and retained concurrency information. The TUI presents that policy consistently. [R042; R045 dependency]

## Live observation and lifecycle

When all four harnesses are selected and the terminal is sufficiently large, show four live panels in a 2×2 arrangement. On smaller terminals use a list/detail layout. Logs are scrollable and searchable; selecting a configuration reveals its task-level details. Resizing must leave those observation functions usable in the appropriate layout. [R038, R044]

From a selected configuration, in either layout, a live view shows its current task process: task, model, and effort as requested and as observed; the code being written in the configuration's workspace as it changes; the reasoning or reasoning summary the harness exposes, labelled as such; its actions; output tokens per second; and context use of the current conversation. Each value names its source: reported by the harness or endpoint, or measured from the output stream. Values the harness does not expose remain unavailable and are never estimated or filled in. Context use restarts with each task because every task is a new conversation. The live view is read-only: it sends no input, cannot pause or slow the process, and leaving it changes nothing in the run. Live rates and context use are observation aids, not retained [M10](10-measurements-cost.md) measurements. [R042, R044, R047]

Execution controls permit inspection, detachment, reconnection, and explicit stopping. They cannot change frozen prompts, selected models, or original weights, or inject implementation hints into an active comparison. Closing or detaching the TUI leaves execution running independently. Reconnecting observes existing work without restarting tasks; explicit stop targets a configuration or the whole benchmark and invokes M11 cleanup of child processes and application services. [R047; R046 dependency]

[M05](05-harness-execution-isolation.md) supplies headless harness execution; [M11](11-run-orchestration.md) supplies persisted lifecycle; [M08](08-verification-evidence.md) supplies approved-check outcomes and evidence; [M10](10-measurements-cost.md) and [M18](18-hardware-monitoring.md) supply measurements with scope and coverage. Present process outcomes, passed/failed/unverified checks, missing measurements, and [M12](12-quality-judging.md) grades distinctly. [R034, R042, R149]

## Validation, results, and failure behavior

With no supported harness installed, show an actionable error and block local planning/execution only. Library browsing, ZIP exchange, and saved-result reporting remain available. Environment recheck updates displayed readiness; unavailable collectors remain visible without becoming mandatory sensors. M03/M04 determine readiness and compatibility rather than the interface guessing support. [R029, R040]

Surface launch, authentication, verification, import-integrity, and scoring failures with the relevant dependency's explanation. Actual execution failures remain inspectable after reconnection; a disconnected interface alone is not an interruption. Invalid settings must not silently become valid substitutes. [R038, R042, R149]

Results consume retained records from M02. Both alternative weight sets use M06's validation, normalized preview, labeled alternatives, reset, and export behavior without replacing original weights or raw grades. ZIP actions invoke M17 validation; report generation/opening invokes [M13](13-standalone-html-report.md), displaying the report location. Reporting, exchange, and reweighting use retained data without additional model calls. [R043, R135; R096, R134 dependencies]

## Acceptance criteria

- Complete frontend and backend workflows, including an existing-repository baseline: author/approve when needed, configure, launch, observe all selected harnesses, inspect evidence/results, and export HTML. Reusing inventory or another approved template causes no planning call. [R002, R039, R041, R135, R149]
- Navigate all five views by keyboard with visible shortcuts and exercise mouse interaction. Resize a four-harness run between 2×2 and list/detail layouts; search and scroll logs and select task details in both. [R038, R040, R042, R043, R044]
- With no harness, verify the actionable block and continued library/exchange/saved-report access. Recheck after readiness changes; exercise invalid setup, authentication, failed/unverified checks, unavailable measurements, and rejected import states. [R029, R038, R040, R149]
- Open the live view of a running configuration in both layouts: the task header, code changes, exposed reasoning, actions, output tokens per second, and context use update while the task runs, each with its source. With a harness that reports no context or reasoning, those values show as unavailable. Leaving the view leaves the process, its timing, and its measurements unchanged. [R042, R044, R047]
- Detach, close, and reconnect without restarting tasks. Explicitly stop work and verify cleanup. Attempt prompt/model/original-weight edits and hint injection; none changes active inputs. [R034, R047]
- Filter matching local/imported results by machine and judge; verify displayed scores against M06 fixtures, alternative/reset behavior, preserved originals, and ZIP/HTML outputs without model calls. Verify primary operation requires no tmux. [R002, R011, R043, R135, R149]

## Implementation

This section applies [the architecture decision](ARCHITECTURE.md). Everything below is an implementation choice; the product behavior above stays authoritative. Thresholds, key assignments and file names come from the [wireframes](../design/wireframe-tui/navigation.md) and are engineering defaults, not product requirements.

M15 is a client, not an engine module. It owns the package `axbenchmark.tui` apart from the module screens: the Textual App shell, the engine connection seen from the TUI, app-wide subscriptions, navigation between the five views, the design system as shared widgets and view-model helpers, the command palette, the help screen, the small-terminal run layout, and the fake-client harness every screen test uses. The module screens themselves (Library, Environment, Setup, Run, Results and their dialogs) are specified by their owners (M01–M13, M16–M18) and built on what this section provides. **[R150]**

### 1. Engine component

None. M15 owns no engine package, no API namespace, no persisted state and no processes (ARCHITECTURE, Ownership). It never reads or writes `~/.axbenchmark/`, never imports `axbenchmark.engine`, and evaluates no module rule: eligibility, readiness, validation, lifecycle and capability decisions arrive as data. Autostarting the engine goes through `axbenchmark.client.connect(autostart=True)`, which starts `axbenchmarkd` detached from the terminal; the engine is never a child of the TUI, so quitting, closing the terminal or losing the socket cannot end a run. **[R046, R047, R150]**

The TUI package is layered like an engine module, with the API client in the place of ports:

| Layer | Path | Contains | May import |
|---|---|---|---|
| View models | `tui/viewmodels/` | Frozen dataclasses and pure builder functions from API DTOs to display values; shared helpers `common.py` (`ActionState`, `ErrorVM`), `format.py` (SHA, durations, money as given), `glyphs.py` (engine enum → glyph and word). No Textual, no I/O. | `api` |
| Shell | `tui/shell/` | `connection.py` (`ConnectionSupervisor`), `subscriptions.py` (`SubscriptionHub`), `navigation.py` (`Navigator`), `state.py` (`ShellState`). Async, no widgets. | `api`, `client`, `viewmodels` |
| Widgets | `tui/widgets/`, `tui/axbenchmark.tcss`, `tui/theme.py` | The design system: shared widgets, one stylesheet, the `axbenchmark` Textual theme. | Textual, `viewmodels` |
| Screens | `tui/screens/`, `tui/commands.py`, `tui/app.py` | `EngineScreen` and `AxModal` base classes, every Screen and ModalScreen, palette providers, `AxBenchmarkApp`. | all of the above |
| Test harness | `tui/testing/` | `FakeEngineClient`, fixture loader, `run_screen` helper. Imported by tests only. | `api`, `client`, Textual |

`import-linter` contracts: `tui` imports only `api`, `client`, Textual and the stdlib; inside `tui`, `viewmodels` imports no Textual and nothing else in `tui`, `shell` imports no widgets or screens, and `tui.testing` is imported by no production module. `tui` imports neither `subprocess` nor any terminal multiplexer library; the app runs in one terminal without tmux. **[R011]**

**Shell components**

```python
class ConnectionSupervisor:
    def __init__(self, connect: Callable[[], Awaitable[EngineClient]], state: ShellState,
                 hub: SubscriptionHub, clock: Callable[[], float]) -> None: ...
    async def start(self) -> HelloResult: ...          # connect, engine.hello, raise IncompatibleEngine
    async def run_reconnect_loop(self) -> None: ...    # on ConnectionLost: backoff, connect, hello, hub.resume()

class SubscriptionHub:
    async def subscribe(self, topics: Sequence[str], handler: EventHandler,
                        on_snapshot: SnapshotHandler) -> SubscriptionHandle: ...
    async def unsubscribe(self, handle: SubscriptionHandle) -> None: ...
    async def resume(self) -> None: ...                # re-subscribe every live handle with since_seq

class Navigator:
    def __init__(self, app: "AxBenchmarkApp", state: ShellState) -> None: ...
    def view_state(self, view: View) -> ActionState: ...   # from ShellState data, no rule
    async def switch_view(self, view: View) -> None: ...

@dataclass
class ShellState:                                      # observable by screens through Textual reactives
    connection: Literal["connecting", "connected", "reconnecting", "incompatible"]
    hello: HelloResult | None
    active_runs: tuple[RunSummaryDTO, ...]             # runs.list(active=True), kept by run.state.changed
    selected_sha256: str | None                        # last revision highlighted in Library or Template
    default_sha256: str | None                         # from templates.list
```

| Component | Behavior |
|---|---|
| `ConnectionSupervisor.start` | `connect(autostart=True)`, then `engine.hello(client="tui", client_version, api_version)`. A different major `api_version` raises `IncompatibleEngine` carrying the engine's version and the restart instruction the engine returns; the entry point prints it and exits with code 3 before Textual starts. An unreachable socket after autostart also exits 3. |
| Reconnect | When the client reports `ConnectionLost`, `ShellState.connection` becomes `reconnecting`, every `EngineScreen.check_action` returns `None` for actions that issue a call (dimmed, never hidden), and the app shows one `notify(severity="warning")` with the client's message. The supervisor retries `connect(autostart=True)` with backoff (0.5 s doubling to 5 s), repeats `engine.hello`, then `SubscriptionHub.resume()`. A replay delivers the missed events in `seq` order; a compacted gap delivers a fresh snapshot and the screen rebuilds its view model from it. Nothing is re-sent except subscriptions: no command is retried automatically. A major-version change after reconnect exits the app with the same message and code 3. **[R046, R047]** |
| `SubscriptionHub` | One stream per client connection, demultiplexed to handles; tracks the last `seq` per handle; drops events with `seq` at or below it. Handlers run on the Textual message loop (`App.call_from_thread` is not needed: the client is asyncio). |
| `Navigator` | Owns the five views as Textual modes (`App.MODES`): `library`, `environment`, `setup`, `run`, `results`, each with its own screen stack so switching views keeps where each one was. `view_state(run)` is disabled with the wireframe reason "no active run" when `active_runs` from `runs.list(active=True)` is empty; this reads the presence of data and decides nothing about a run. The other views are always enabled. |
| App-wide subscription | On mount, topics `runs` and `jobs`: `run.state.changed` maintains `ShellState.active_runs`; `job.finished` for a `JobRef` started by a screen that is no longer mounted becomes a toast with the job's result summary or typed error, so the outcome of a job is never lost by navigating away. |
| Startup calls | `runs.list(active=True)` and `templates.list()` (for `default_sha256`) fill `ShellState`; `environment.recheck(scope="all")` is requested once, so opening the library inspects the environment (M03, **[R029]**). |

**Composition.** `axbenchmark/tui/__main__.py:main(attach_run_id: str | None)` is called through the `TuiLauncher` that `axbenchmark/launcher.py` (M14's client composition root) binds, so `cli` never imports `tui`. It builds the client, `ShellState`, `SubscriptionHub`, `ConnectionSupervisor`, runs `start()`, then constructs `AxBenchmarkApp(client, state, hub, supervisor, initial=attach_run_id)` and calls `run()`. Screens obtain the client and shell objects from the app (`self.app.client`, `self.app.hub`, `self.app.shell`); there is no global or service locator, and tests pass a `FakeEngineClient` to the same constructor.

### 2. API surface

M15 defines no queries, commands, jobs or events. Every call it or any screen makes is a public registry method of the owning namespace, so the future MCP server and the CLI can reach everything the TUI does without TUI-specific methods, private parameters or direct file access. A test enforces this (section 6). **[R150]**

How the TUI consumes the API, for every screen:

| API element | TUI rule |
|---|---|
| Query | Issued from a Textual worker (`exclusive=True`, group per widget) by `EngineScreen.load`; the result goes through the screen's view-model builder; the widget's `StateSwitcher` shows `-loading` while it runs. |
| Command | One action handler issues exactly one command and renders its returned model or typed error. On error the handler changes nothing locally. |
| Job | The handler issues the job method, keeps the `JobRef`, and follows `job.progress` / `job.finished` through the screen's subscription; cancel buttons issue `jobs.cancel(job_id)`. |
| Subscription | Declared per screen in `TOPICS`; subscribed on mount and unsubscribed on unmount through `SubscriptionHub`. Leaving a screen never sends a command. |
| Typed error | Rendered by `ErrorVM.from_dto`: `message` and `remedy` verbatim, `field` paths mapped to widget ids by the screen; the `code` is shown dimmed for reference. Never reworded, never replaced by a default value. **[R038, R149]** |
| Capability flags | Copied into the view model as `ActionState(enabled, reason)` per action name; `check_action` returns `None` (dimmed; Textual hides a binding on `False`, which no screen uses for a capability) when `enabled` is false and the reason is shown in the palette and as the footer tooltip. No screen computes a flag. |
| Registry metadata | `safety == "destructive"` methods (for example `runs.stop`) are only issued from a confirming `AxModal` owned by the method's module (M11 `StopScreen`). |

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `axbenchmark.client.connect(autostart=True)`, the `EngineClient` Protocol (`call`, `subscribe`, `close`, a `ConnectionLost` signal), `InProcessClient` | M11 (`engine.daemon` and its client package) | Connection, autostart of a detached engine, reconnect detection, in-process tests. |
| `engine.hello` returning `api_version`, `engine_version` and a restart instruction for incompatible clients | M11 | Version handshake on connect and reconnect. |
| `events.subscribe(topics, since_seq?)` with per-namespace snapshots, `events.unsubscribe(subscription_id)`, `events.subscription.resynced` | M11 | Screen and app-wide subscriptions; replay or fresh snapshot after reconnect. |
| `runs.list(active=True)`, `runs.status(run_id)`, event `run.state.changed`, topic `runs` | M11 | `ShellState.active_runs`, F4 availability, `--attach RUN_ID`, RunScreen data for the compact layout. |
| `job.progress`, `job.finished`, `jobs.get`, `jobs.cancel`, topic `jobs` | M11 | Job outcome toasts after navigation; cancel. |
| RunScreen view model with per-lane `ActionState` (`live_view`, `stop`, `detach`, `open_configuration`), `StopScreen`, `DetachScreen` | M11 | The RunListDetail layout reuses them unchanged. |
| `harness.task.log(run_id, configuration_id, task_id, after_seq?, limit, query?)`, event `harness.log.appended` | M05 | Searchable log of the selected configuration in RunListDetail. |
| `templates.list` (`default_sha256`) | M01 | Fallback revision for F3 and F6 before one is selected. |
| `environment.recheck(scope="all")` | M03 | One inspection at TUI startup. |
| Screens built on `EngineScreen`, `AxModal`, `StateSwitcher` and the TCSS selectors of their legends; per-screen `COMMANDS` providers for extra palette entries (M01 `LibraryCommands`) | M01–M13, M16–M18 | Uniform loading, states, capability dimming and palette coverage. |

### 4. Screens

**Design system as shared code.** The `DesignSystem` artboard and the rules table in [navigation.md](../design/wireframe-tui/navigation.md) map to:

| Element | Implementation |
|---|---|
| Theme | `tui/theme.py` registers Textual `Theme("axbenchmark-dark")` and `Theme("axbenchmark-light")` with the tokens of the DesignSystem artboard: `$background`, `$surface`, `$panel`, `$foreground`, `$primary` (= `$accent`); `$success`, `$warning`, `$error` stay grayscale and meaning is carried by glyph and wording. |
| Stylesheet | `tui/axbenchmark.tcss` is the app's single `CSS_PATH`. M15 writes the foundation block of the DesignSystem artboard (`Screen`, `.pane`, `.pane:focus-within`, `.bordered`, `Input`, `Button`, `Button.-primary`, `.kv`, `.notice`, `.notice.-error`, `ModalScreen`, `.dialog`, `.dialog-actions`, `Screen.-compact #detail-pane, #revisions-pane`, `Screen.-compact #summary`). Each screen owner appends one section with the selectors from its legend. |
| `StateSwitcher(ContentSwitcher)` | `tui/widgets/states.py`. Constructed with a base id `x` and the data widget; composes `#x`, `#x-loading` (`LoadingIndicator`), `#x-empty` (`Static.empty`), `#x-error` (`Vertical.notice.-error` with `Button #retry`). Methods `show_data()`, `show_loading()`, `show_empty(text, hint)`, `show_error(error: ErrorVM, retry: bool)`; posts `StateSwitcher.Retry` when `#retry` is pressed. |
| `Notice(Static)` | Classes `-error`, `-warning`, `-success`, info; text always starts with ✗ ▲ ✓ or none, followed by words. |
| `Pane(Vertical)` | Class `.pane` with `border_title` and `border_subtitle`. |
| `KeyValue(Static)` | Class `.kv`; renders `Sequence[tuple[str, str]]` with a fixed label width. |
| `Sha(Static)` | Renders a digest from `format.sha_full` (64 cells), `sha_short8`, or `sha_mid` (`first16…last8`); never truncates without the ellipsis. |
| `SearchableLog(Vertical)` | `RichLog #log .bordered` with `Input #log-search`; matches get class `.-match` (`background: $primary 24%`); `n` moves to the next match. Shared by RunListDetail and M05's RunConfigScreen. |
| `AxModal(ModalScreen[T])` | `tui/screens/base.py`. `align: center middle`, `background: $background 60%`, dialog `Vertical .dialog` of fixed width (72–86 cells, `max-width: 100%`), `Horizontal .dialog-actions` right-aligned; `esc` → `dismiss(None)` without changes. |
| `FileViewScreen(AxModal[None])` | `tui/screens/file_view.py`. Read-only `TextArea(read_only=True)` with a title, the text and its digest from an API response the caller already holds (`templates.file`, `catalog.files`, `launch.frozen_config_yaml`, `configs.launch_record`); `c` copies. It never opens a path itself. Used by M01, M02, M04, M07, M09. |
| `PromptScreen(AxModal[str \| None])` | `tui/screens/prompt.py`. One labelled `Input` with an optional default (a preset name, an export path); `enter` dismisses with the text, `esc` with `None`. It issues no call and validates nothing: the caller sends the value in its one API call and shows that call's typed error (`field` marks the input). Used by M06 (Save preset…, Export configuration), M18 (Export CSV). |
| `ConfirmScreen(AxModal[bool])` | `tui/screens/confirm.py`. Title, the engine's description of the effect and two buttons; returns `True` or `False` and issues no call. For destructive methods whose owner draws no dedicated confirmation (for example `judging.stop`, `catalog.remove_override`, `configs.delete_preset`). |
| `glyphs.py` | Status ✓ ▲ ✗ ● ○; readiness ✓ ✗ ? ▲ ○ ◷; checks ✓ ✗ ? ○; source ★ ◆ ↓; change ~ + = ↔. A lookup from an engine enum value to `(glyph, word, css_class)`; an unknown value renders `?` and the raw value, never a guessed state. |

**`EngineScreen(Screen)`** — base class in `tui/screens/base.py` for every module screen. It is how a screen stays a pure view over API data:

```python
class EngineScreen(Screen, Generic[VM]):
    TOPICS: ClassVar[Sequence[str]] = ()             # e.g. ("environment",)
    vm: reactive[VM | None]

    async def fetch(self) -> VM: ...                  # subclass: call queries, return build_vm(...)
    def render_vm(self, vm: VM) -> None: ...          # subclass: push values into widgets, no logic
    def actions(self, vm: VM) -> Mapping[str, ActionState]: ...   # copied from capability flags
    async def on_event(self, event: EventDTO) -> None: ...        # subclass: patch DTO, rebuild vm
    async def call(self, method: str, request: BaseModel, *, error_into: StateSwitcher | None = None) -> BaseModel | None: ...
```

| Hook | Behavior |
|---|---|
| `on_mount` | Starts the `fetch` worker (switchers to `-loading` on first load), then `hub.subscribe(TOPICS)`; a snapshot from the subscription replaces the fetched DTOs. |
| `on_unmount` | `hub.unsubscribe`; cancels its workers. Sends nothing else. |
| `check_action(action, params)` | `None` (dimmed) when `ShellState.connection != "connected"` and the action issues a call, or when `actions(vm)[action].enabled` is false; `True` otherwise. Pure navigation actions stay enabled while reconnecting. |
| `call` | Issues exactly one method; on a typed error shows it in `error_into` or as `notify(severity="error")` and returns `None`. Used by every action handler. |
| Compact | Nothing per screen: the app sets `-compact`; the screen's TCSS section hides or shows widgets. |

**App shell — `AxBenchmarkApp(App)`** in `tui/app.py`.

| Aspect | Specification |
|---|---|
| Construction | `AxBenchmarkApp(client, shell, hub, supervisor, initial: str \| None)`; `MODES` as in `Navigator`; `COMMANDS = {ViewCommands, ScreenCommands}`; theme `axbenchmark-dark` by default; Textual's theme command switches to `axbenchmark-light`. |
| Mount | App-wide subscription and startup calls (section 1). Mode `library` with `LibraryScreen` (M01) on top. With `initial` set (from `--attach RUN_ID`), `runs.status(run_id)`, then mode `run` with `RunScreen(run_id)` (M11); a typed error stays on the Library and is shown as an error toast. Attaching restarts nothing. **[R046, R138]** |
| Reflow | `on_resize` and `on_screen_resume` call `screen.set_class(is_compact(size), "-compact")` with `is_compact(w, h) = w < 100 or h < 30`. Layout changes are CSS only: widgets are not recomposed, so focus, cursor rows, scroll positions and the selected configuration survive a resize. **[R038, R044]** |
| Mouse | Textual defaults: click focuses and activates rows, tabs, buttons and footer keys; double-click on a `DataTable` row runs the screen's `enter` action; the wheel scrolls tables, logs and text. |
| Quit | `q` → `action_quit`: unsubscribes, closes the client, exits. It issues no `runs.*` call; active runs keep running in the engine and remain reattachable (`ctrl+r` in the Library, `axbenchmark --attach RUN_ID`). **[R046, R047]** |

| Binding (App) | Action | API call |
|---|---|---|
| `f1` | `switch_view("library")` | none |
| `f2` | `switch_view("environment")` | none; `EnvironmentScreen` (M03) loads itself |
| `f3` | `switch_view("setup")` | none; an empty `setup` stack opens `SetupScreen(shell.selected_sha256 or shell.default_sha256)` (M07) |
| `f4` | `switch_view("run")` | none; dimmed by `Navigator.view_state(run)`; an empty `run` stack opens `RunScreen` for the most recently launched entry of `shell.active_runs` |
| `f6` | `switch_view("results")` | none; an empty `results` stack opens `ResultsScreen` (M02) for the selected or default revision |
| `?` | `push_screen(HelpScreen())` | none |
| `ctrl+p` | `command_palette` | none until a command runs; the command's action issues its own call |
| `q` | `quit` | none (unsubscribe and close only) |
| `tab` / `shift+tab` | `focus_next` / `focus_previous` | none |

F5 is not bound by the app; Environment (Recheck) and the catalog (Refresh) bind it.

**Command palette** — `tui/commands.py`.

| Provider | Hits |
|---|---|
| `ViewCommands(Provider)` | "Go to Library / Environment / Setup / Run / Results", "Keys and views", "Quit"; Run carries `Navigator.view_state(run)`. |
| `ScreenCommands(Provider)` | One hit per binding of the active screen (`screen.active_bindings`, footer description as the title, the binding's key as help). A binding whose `check_action` is false is still listed with its `ActionState.reason`; selecting it runs nothing and shows the reason as a toast. So every footer action is a command, also when a compact footer drops it. |
| Screen providers | A screen may add `COMMANDS` (Textual merges them), e.g. M01 `LibraryCommands` adding "Recheck environment" → `environment.recheck`. Their hits follow the same disabled-hit rule. |

TCSS: `CommandPalette > .command-palette--highlight { text-style: bold underline; }`; otherwise Textual defaults with the theme variables (board CommandPalette).

**`HelpScreen(ModalScreen[str | None])`** — board HelpKeys; file `axbenchmark/tui/screens/help.py`; view model `axbenchmark/tui/viewmodels/help.py`.

```python
@dataclass(frozen=True)
class ViewRowVM:
    view: View; label: str; key: str; purpose: str; state: ActionState

@dataclass(frozen=True)
class HelpVM:
    views: tuple[ViewRowVM, ...]                       # Library F1 … Results F6, wireframe copy
    global_keys: tuple[tuple[str, str], ...]           # ctrl+p, tab · shift+tab, esc, ?, q
    mouse: tuple[tuple[str, str], ...]
    sizes: tuple[tuple[str, str], ...]                 # 100×30 or larger · 80×24 to 100×30

def build_help_vm(view_states: Mapping[View, ActionState]) -> HelpVM: ...
```

| Aspect | Specification |
|---|---|
| Widget tree | `Vertical #help .dialog` (width 86) → `DataTable #views` (height 6, `cursor_type="row"`), `Static #global-keys .kv`, `Static #mouse .kv`, `Static #sizes .kv`, `Horizontal .dialog-actions` (`Button #close`); `Footer`. Focus order `#views`, `#close`. |
| Load | No API call: the only dynamic value is `Navigator.view_state` for each view, from `ShellState`. The Run row shows "dimmed without a run" from that state. |
| Subscriptions | None of its own; it re-renders when `ShellState.active_runs` changes. |
| States | Static content; no `ContentSwitcher`. |

| Binding | Action | API call |
|---|---|---|
| `enter` on `#views` | `dismiss(view)`; the app then `switch_view(view)` | none |
| `f1`–`f4`, `f6` | `app.switch_view` (closes the dialog first) | none |
| `esc`, `#close` | `dismiss(None)` | none |
| `tab` / `shift+tab` | focus next / previous | none |

`enter` on a disabled view row is dimmed through `check_action` from the row's `ActionState`.

**RunListDetail — the compact layout of `RunScreen`** — board RunListDetail; file `axbenchmark/tui/screens/run.py` (screen and its view model `tui/viewmodels/run.py` are specified by M11). M15 specifies the compact composition, which RunScreen composes alongside `#lanes` and shows under `Screen.-compact`:

| Aspect | Specification |
|---|---|
| Widget tree | `Header`, `Static #run-bar`, `Horizontal` → `ListView #lane-list .pane` (width 26, one `ListItem` per configuration from the same lanes as `#lanes`) and `Vertical #detail` (width `1fr`) → `Vertical #lane-detail .pane` (task strip T1…T7 with glyphs, `KeyValue` Now · Elapsed · Checks) and `SearchableLog` (`RichLog #log .bordered` with `Input #log-search`); `Footer`. Focus order `#lane-list`, `#lane-detail`, `#log-search`, `#log`. |
| TCSS | `Screen.-compact #lanes { display: none; }`, `#lane-list { width: 26; }`, `#detail { width: 1fr; }`, `#log .-match { background: $primary 24%; }`; outside compact, `#lane-list` and `#detail` are `display: none`. |
| Data | `#lane-list` and `#lane-detail` render the RunScreen view model (from `runs.status` and its subscription); the selected configuration id is one attribute of RunScreen shared by `#lanes` focus and `#lane-list` cursor, so a resize keeps it. **[R044]** |
| Log | On selection, a worker calls `harness.task.log(run_id, configuration_id, current_task_id, limit=500)` into `#log`; live lines come from `harness.log.appended` filtered by `configuration_id` on RunScreen's subscription. Scrolling to the top pages earlier lines with `after_seq`. Log title from the view model (`Log · T4–T5`, match count). |
| Search | `Input.Submitted` on `#log-search` calls `harness.task.log(..., query=text)`; the returned `matches` are highlighted and `n` steps through them without a call. Search does not filter or reorder the log. **[R038, R044]** |
| States | `#log` sits in `StateSwitcher` `log` (`-loading` while the first page loads, `-empty` before the task writes output, `-error` with the engine's message, e.g. `harness.log_unavailable`). |

| Binding | Action | API call |
|---|---|---|
| `↑` / `↓` | cursor on `#lane-list` | `harness.task.log` for the newly selected configuration |
| `enter` | `open_configuration` | none; push `RunConfigScreen` (M05), which loads itself |
| `v` | `live_view` | none; push `HarnessLiveScreen` (M11), dimmed from the lane's `live_view` ActionState |
| `/` | `focus("#log-search")` | none; submit issues `harness.task.log(query=…)` |
| `n` | next match | none |
| `s` | `stop_configuration` | none; push M11 `StopScreen`, which issues `runs.stop` after confirmation |
| `d` | `detach` | none; push M11 `DetachScreen`; detaching sends no `runs.*` call |

`e` and any other edit action stay dimmed from the run's capability flags in both layouts; no binding can change frozen prompts, models or original weights, or send input to a harness. **[R047]**

**Screens built on the shell.** Library (M01), Environment (M03), Setup (M07), Run (M11) and Results (M02, M06) are the five views; their owners' Implementation sections give classes, view models, calls and bindings. All of them subclass `EngineScreen` or `AxModal`, put every data widget in a `StateSwitcher`, take `-compact` from the app, and are reachable by the F-keys and the palette above.

### 5. CLI

| Command | Reaches M15 |
|---|---|
| `axbenchmark` | M14's Typer default command calls its `TuiLauncher`, which `launcher.py` binds to `axbenchmark.tui.__main__.main(None)`. Exit 0 after `q`; 3 when the engine is unreachable or incompatible. **[R048]** |
| `axbenchmark --attach RUN_ID` | `main(run_id)`: the app opens `RunScreen(run_id)` after `runs.status(run_id)`; observation only. **[R049]** |

No other command reaches M15; every other CLI command calls the owning namespace directly (M14).

### 6. Headless verification

| Level | Tests |
|---|---|
| Pure units (no Textual) | `is_compact` at 120×40, 100×30, 99×40, 120×29, 80×24; `format.sha_*` widths (64, 8, `first16…last8`); `glyphs` for every enum value of the API plus an unknown value; `ErrorVM.from_dto` keeps message, remedy and fields verbatim; `build_help_vm` with and without active runs; `ScreenCommands` hit list from a binding table and `ActionState` map, including disabled hits with reasons. |
| Shell with fake client | `ConnectionSupervisor`: same major version connects; different major raises `IncompatibleEngine` with the engine's instruction; `ConnectionLost` sets `reconnecting`, reconnects, repeats `engine.hello` and re-subscribes each handle with its last `seq`; a compacted gap delivers a snapshot; no command is re-sent. `SubscriptionHub` drops duplicate `seq`. `Navigator` disables Run with no active runs and resolves F3/F6 to the selected or default revision. |
| API through `InProcessClient` (no interface) | The workflow the TUI drives, scripted as API calls only, against an engine wired with fake harness adapters: library → setup → `runs.launch` → subscribe → detach (close client) → reconnect with `since_seq` → results → report, for an inventory run and an existing-repository custom template (**[R002, R039, R041, R135, R149]**). After the client closes mid-task the run continues and records no interruption (**[R046]**). Parity check: every method name recorded by the screen tests below is present in `axbenchmark.api` registry, so an MCP or CLI client needs nothing the TUI uses privately (**[R150]**). |
| Screens (`FakeEngineClient`, `App.run_test()` / `Pilot`) | `HelpScreen` at 120×40: rows and dimmed Run without active runs; `enter` switches view; `esc` dismisses with no call. F1–F4, F6 switch modes and keep each mode's stack. `ctrl+p` lists every footer binding of the active screen, with disabled hits and reasons. Resize 120×40 → 80×24 → 120×40 on RunScreen keeps focus and the selected configuration and switches `#lanes` ↔ `#lane-list`; `/` + submit issues exactly one `harness.task.log` with `query`; `v`, `s`, `d`, `enter` push their screens and issue no call. `q` with an active run issues no `runs.*` call. Disconnect: call-issuing bindings dim, a toast appears, bindings re-enable after reconnect. Typed error from any call lands verbatim in the target `#x-error`. `--attach` with an unknown run id stays on the Library with the error toast. |
| Contracts | `import-linter`: `tui` imports only `api`, `client`, Textual and stdlib; no `axbenchmark.engine`, no `subprocess`; `tui.testing` unused by production code. **[R011, R150]** |

**Fake-client harness** (`axbenchmark/tui/testing/`), used by every module's screen tests:

```python
class FakeEngineClient:                               # satisfies the EngineClient Protocol
    def __init__(self, fixtures: Mapping[str, Any] | None = None) -> None: ...
    def respond(self, method: str, response: BaseModel | ErrorDTO | Callable[[BaseModel], BaseModel]) -> None: ...
    def job(self, method: str, events: Sequence[EventDTO], result: BaseModel | ErrorDTO) -> None: ...
    async def emit(self, event: EventDTO) -> None: ...  # deliver to matching subscriptions with the next seq
    def drop_connection(self) -> None: ...             # raise ConnectionLost on the next await
    calls: list[RecordedCall]                          # method, request model, time

async def run_screen(screen_factory: Callable[[], Screen], client: FakeEngineClient,
                     size: tuple[int, int] = (120, 40)) -> AsyncContextManager[Pilot]: ...
def load_fixture(name: str) -> Mapping[str, Any]: ...  # tests/fixtures/tui/<board>.json, one per artboard
```

`respond` and `call` validate requests and responses against the request and response models in the API registry, and reject a method the registry does not contain, so a fake cannot drift from the published contract. Each artboard has one fixture file named after its board, built from the wireframe example data, so a screen test renders the same state the board shows.
