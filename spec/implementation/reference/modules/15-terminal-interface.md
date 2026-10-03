# M15 — Terminal user interface

Status: proposed requirements. [SPEC.md](../SPEC.md) is authoritative. This contract describes observable behavior, not an implemented interface. How the TUI is built follows [the architecture decision](../../../ARCHITECTURE.md) and is specified under Implementation.

## Implementation children

| Child | Independently runnable scope | Completed prerequisites |
|---|---|---|
| [M15.1 — tui-foundation](../../M15/01-tui-foundation.md) | Shared widgets/theme, base screens/modals, pure helpers, registry-validating fake client and wide/compact harness | Bootstrap API/registry/EngineClient contracts; no feature engine or screen implementation |
| [M15.2 — tui-shell](../../M15/02-tui-shell.md) | Connection, revisioned subscriptions, navigation/palette/focus and state lifecycle with injected fixture screens | M15.1 and M11.1–M11.2 executable client/events foundations |
| [M15.3 — tui-integration](../../M15/03-tui-integration.md) | Register feature-owned screens, compact run component, real launcher and cross-module journeys | M15.2 and relevant completed feature engine/screen children |

These are proposed implementation packages. Bootstrap publishes M11-owned `axbenchmark/client/protocol.py:EngineClient` and `axbenchmark/api/events.py:EventCursor/Subscription/EventEnvelope`; M11.1 later supplies real socket/in-process clients and M11.2 their subscription execution. Bootstrap contract availability is not provider completion. M15.1–M15.2 run early without the full scheduler, harnesses, collectors or feature screens; M15.3 and the parent's real-provider gates remain required. [F15]

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
| Results | Inspect local and imported results with machine and judge filters, task evidence, rankings, alternative weights, and ZIP/HTML export actions. Preserve template compatibility and judge grouping through [M02](02-retained-results-comparability.md); expose analysis through [M06](06-scoring-rankings.md). Show every trial of a configuration as its own row beside the configuration's mean and min–max, as the engine returns them. [R002, R043, R154] |

## Setup and launch boundary

Selecting an already approved template reuses its frozen tasks without planner invocation or task regeneration. The binding [benchmark design handoff](../../BENCHMARK-DESIGN-SPEC.md) governs M01/M16 authoring: one shot preserves one exact prompt as `T1`; new multi-step definitions use at least two explicitly ordered primary specification files. Current-folder inspection/capture supplies the derived target mode and approved snapshot, including eligible dirty or non-Git files. Manual creation, capture, editing and approval remain enabled without a harness; optional planner generation is an explicit separate branch. Render owner DTOs and capabilities without local filesystem inspection, input normalization or mode inference. These are authoring actions, not edits to an active comparison. [R039, R041, R135]

Before launch, display the full setup from M07: pinned template identity, competitor harness/provider/model/effort entries, environment choices, independent judge, rubric, both weight sets, and execution settings. Complete validation and separately freeze the template and resolved launch configuration/original weights before execution. Multiple configurations per harness remain distinct. [R041, R034; M07 integration]

The handoff's [mandatory commit review and evidence](../../BENCHMARK-DESIGN-SPEC.md#mandatory-commit-review-and-evidence) also binds these owner screens: display the locked **Every task must commit** policy, version/digest and common instruction separately from exact inputs. Git readiness gates execution, not manual authoring/capture/approval. Present setup-versus-competitor Git provenance and commit evidence bound to the selected `TrialRef`/`ResultId`, task and invocation; keep process outcome, protocol checks, application checks and grading distinct. Owners supply totals, verdicts, evidence and action states; M15 executes no Git, domain calculations or filesystem logic. Legacy inputs/results retain their owner-defined semantics.

When M07's launch validation returns a trial budget warning (more than 5 trials for a configuration not on a local endpoint), launching from the review first opens a confirmation dialog. It states clearly that the extra trials will consume budget and subscription usage and shows the totals the engine returned: task runs (configurations × trials × tasks) and judge sessions. Confirming launches; going back returns to the review without launching or changing the setup. The dialog appears exactly when the engine returns the warning, so it is not shown when every such configuration is on a local endpoint; the TUI applies no threshold of its own, and there is no upper limit on trials. [R158]

Expose the sequential setting corresponding to the CLI's `--jobs 1` through [M11](11-run-orchestration.md#scheduling-contract) and [M14](14-command-line-interface.md). M11 owns registry-derived defaults/ranges, the selected-distinct-harness concurrency bound, same-harness queues, sequential tasks and frozen retained policy. Render its projections in registry order: Claude Code, Codex, Grok CLI, Pi, Cursor CLI, OpenCode (`cursor_cli` after `pi`, `opencode` after `cursor_cli`). Preserve explicitly saved `jobs=4`/`jobs=5`; registry support never implies usability or increases a saved/active policy. The TUI computes no scheduling rule. [R042; R045 dependency]

## Live observation and lifecycle

Render every selected harness and queued configuration from M11's registry-derived projection. Four selected harnesses remain a valid 2×2 subset. At 120×40, six harness lanes use a scrollable two-column, three-row region with reachable title/state/trial/task summaries and actions; the run header/frozen identity and footer remain fixed, with detailed logs in the selected detail view. Expose the same list/detail layout at wide sizes when content pressure requires it. At 80×24, list/detail is the only compact run layout, with all six harnesses and queued configurations scroll/keyboard reachable. Logs stay searchable and scrollable; resize/layout switches preserve selected configuration, explicit trial, task, focus and scroll position. M11 owns data/actions; M15 supplies the presentation-only shared widget. [R038, R044]

From a selected configuration, in either layout, a live view shows its current task process: task, model, and effort as requested and as observed; the code being written in the configuration's workspace as it changes; the reasoning or reasoning summary the harness exposes, labelled as such; its actions; output tokens per second; and scoped context use. Each value names its source: reported by the harness or endpoint, or measured from the output stream. Missing native values remain unavailable, never filled in by inference. Output rates remain live-only observation aids. [R042, R044, R047]

Context evidence is retained under [M10](10-measurements-cost.md) and the binding [context-monitoring supplement](../../CONTEXT-MONITORING.md). Native counters, exact retokenized-input counts, code-derived labelled text-token estimates and TypeSafe classifications remain distinct, with independent count, classification and input-membership provenance. A classification never proves current-context membership. Each task still starts a fresh conversation; context windows belong to their scoped invocation/session/agent and request phase, with explicit reset/compaction transitions, never a sum across subagents or observed history. [R161–R166]

The live view is passive: it sends no process input, does not pause execution or deliberately block or wait on the classifier, and leaving it only detaches observation. Capture/observer resource use and possible timing overhead are disclosed. M10.3 owns ContextDetail, M11.5 owns its HarnessLive route, and M15 supplies only shell, subscription and route primitives. These additional screens, routes and states are contracts pending design acceptance; existing wireframes do not already depict them. [R047, R150, R161–R166]

When the engine halts a run, for example because the template's identity was invalidated during execution, the TUI shows the run as interrupted with the engine's reason, also when the user is on another view. Execution controls permit inspection, detachment, reconnection, and explicit stopping. They cannot change frozen prompts, selected models, or original weights, or inject implementation hints into an active comparison. Closing or detaching the TUI leaves execution running independently. Reconnecting observes existing work without restarting tasks; explicit stop targets a configuration or the whole benchmark and invokes M11 cleanup of child processes and application services. [R047; R046 dependency]

[M05](05-harness-execution-isolation.md) supplies headless harness execution; [M11](11-run-orchestration.md) supplies persisted lifecycle; [M08](08-verification-evidence.md) supplies approved-check outcomes and evidence; [M10](10-measurements-cost.md) and [M18](18-hardware-monitoring.md) supply measurements with scope and coverage. Present process outcomes, passed/failed/unverified checks, missing measurements, and [M12](12-quality-judging.md) grades distinctly. [R034, R042, R149]

## Validation, results, and failure behavior

With no supported harness installed, show actionable reasons for unavailable model-dependent planning/execution. Manual prompt/spec authoring, folder inspection/capture, editing and approval, library browsing, ZIP exchange and saved-result reporting remain available. Environment recheck updates displayed readiness; unavailable collectors remain visible without becoming mandatory sensors. M03/M04 determine readiness and compatibility rather than the interface guessing support. [R029, R040]

Surface launch, authentication, verification, import-integrity, and scoring failures with the relevant dependency's explanation. Actual execution failures remain inspectable after reconnection; a disconnected interface alone is not an interruption. Invalid settings must not silently become valid substitutes. [R038, R042, R149]

Verifying harnesses (M03's consented verification, offered as M16's "Verify now") is never started by a single key press. A confirmation dialog first lists the harnesses to verify, as the engine returns them, and states that each makes one minimal model call; only confirming starts the verification, and declining or dismissing makes no call. [R031, R040]

Results consume retained records from M02. Both alternative weight sets use M06's validation, normalized preview, labeled alternatives, reset, and export behavior without replacing original weights or raw grades. ZIP actions invoke M17 validation; report generation/opening invokes [M13](13-standalone-html-report.md), displaying the report location. Display account billing kind and declared/inherited/unknown provenance exactly as M04/M10 return them, including subscription/local cost limitations; editing routes to M04’s separate account billing screen. [R157] Reporting, exchange, and reweighting use retained data without additional model calls. [R043, R135; R096, R134 dependencies]

Preserve the existing [context](../../CONTEXT-DESIGN-HANDOFF.md), [decision-engine](../../DECISION-ENGINES.md) and [statistics](../../BENCHMARK-STATISTICS.md) surfaces and owner states. Without a compatible configured READY decision engine, disable only new context analysis/reclassification and decision-model grading through returned capabilities. Keep decision-engine setup, native measurements, deterministic statistics/ranking, ordinary harness grading and saved/offline analysis available according to their own capabilities; retain independent monitoring/grading selection and Gen/In/Out/Files/LOC columns and weight controls.

**Statistics integration.** M15.3 wires M02/M10 primary Gen tok/s, In tok (cached), Out tok (reasoning), Files / LOC rows/detail and M06's eight-factor editor/reference/breakdown to M07 freeze/presets and M13 reports. Wide/compact states retain pooled generation versus count means, full TrialRefs, baseline inclusion, independent file/LOC/detail nulls and policy/source coverage. Five extras default to zero; enabled factors require explicit direction and selected compatible policy. Preserve engine exclusions and dynamic contributions through resize/filter/reconnect/export without shell-owned arithmetic. Test the same exact retained two-trial vectors across real owner screens and offline HTML. **R173–R176**

M15.3 composes the Human picker and post-seal M11 wait status with M12 progress/reopen and the M12.5 browser, then committed M02/M06/M13/M17 inspection. Wide/compact fixtures cover empty/draft/save-failed/conflict/submitting/storage-pending/submitted/ungraded/skipped/cancelled/invalidated/recovered/opener-failed states and original versus additional stop semantics. Existing shell navigation/attach/resize/detach sends no submit, cancel, browser open or model call; only explicit judging.human.reopen opens the scoped queue. Preserve owner counts/wait reasons and defer automatic reporting until original receipts settle. **R189**

## Acceptance criteria

- Complete frontend and backend workflows, including an existing-repository baseline: author/approve when needed, configure, launch, observe all selected harnesses, inspect evidence/results, and export HTML. Reusing inventory or another approved template causes no planning call. [R002, R039, R041, R135, R149]
- Navigate all five views by keyboard with visible shortcuts and exercise mouse interaction. Resize all six registry harnesses plus queued configurations between the adaptive 120×40 layout and 80×24 list/detail, including focus on the sixth entry; preserve configuration/trial/task/focus/scroll, search logs and select task details. Repeat with selected subsets, including four-harness 2×2, and display M11's preserved `jobs=4`/`jobs=5` and sequential policies. [R038, R040, R042, R043, R044]
- With no harness, verify manual exact-prompt/ordered-spec creation, current-folder capture/edit/approval and continued library/exchange/saved-report access while model-dependent work is disabled. Missing Git blocks execution only. Render locked commit policy and trial/task-scoped evidence from owners. Recheck after readiness changes; exercise invalid setup, authentication, failed/unverified checks, unavailable measurements and rejected import states. With no READY decision engine, preserve native/statistics/saved flows while the governed analysis/grading actions alone are disabled. [R029, R038, R040, R149]
- Open the live view of a running configuration in both layouts: the task header, code changes, exposed reasoning, actions, output tokens per second, and scoped context use update while the task runs, each with its source. Missing native context or reasoning shows its unavailable reason; retained evidence, labelled estimates and classifications follow the [supplement's client acceptance contract](../../CONTEXT-MONITORING.md#acceptance-and-integration-gates). Verify scoped ContextDetail navigation and stale-response rejection. Leaving the view only detaches observation; capture never waits on classifier throughput, and observer overhead remains disclosed. [R042, R044, R047, R161–R166]
- Launch with 6 trials and one configuration not on a local endpoint: the confirmation dialog shows the budget and subscription usage statement with the task-run and judge-session totals; going back launches nothing, confirming launches once. With only local-endpoint configurations, or with 5 trials, launching shows no dialog. [R158]
- Choose "Verify now": the dialog lists each harness and states one minimal model call per harness; declining makes no verification call, confirming starts one verification. [R031, R040]
- Detach, close, and reconnect without restarting tasks. Explicitly stop work and verify cleanup. Attempt prompt/model/original-weight edits and hint injection; none changes active inputs. [R034, R047]
- Filter matching local/imported results by machine and judge; verify displayed scores against M06 fixtures, alternative/reset behavior, preserved originals, and ZIP/HTML outputs without model calls. Verify primary operation requires no tmux. [R002, R011, R043, R135, R149]

## Implementation

This section applies [the architecture decision](../../../ARCHITECTURE.md). Everything below is an implementation choice; the product behavior above stays authoritative. Thresholds, key assignments and file names come from the [wireframes](../design/wireframe-tui/navigation.md) and are engineering defaults, not product requirements.

M15 is a client, not an engine module. It owns the package `axbenchmark.tui` apart from the module screens: the Textual App shell, the engine connection seen from the TUI, app-wide subscriptions, navigation between the five views, the design system as shared widgets and view-model helpers, the command palette, the help screen, the small-terminal run layout, and the fake-client harness every screen test uses. The module screens themselves (Library, Environment, Setup, Run, Results and their dialogs) are specified by their owners (M01–M13, M16–M18) and built on what this section provides. **[R150]**

### 1. Engine component

None. M15 owns no engine package, no API namespace, no persisted state and no processes (ARCHITECTURE, Ownership). It never reads or writes `~/.axbenchmark/`, never imports `axbenchmark.engine`, and evaluates no module rule: eligibility, readiness, validation, lifecycle and capability decisions arrive as data. Autostarting the engine goes through `axbenchmark.client.connect(autostart=True)`, which starts `axbenchmarkd` detached from the terminal; the engine has a separate session/process group, and execution lifetime is engine-owned, so quitting, closing the terminal or losing the socket cannot end a run. **[R046, R047, R150]**

The TUI package is layered like an engine module, with the API client in the place of ports:

| Layer | Path | Contains | May import |
|---|---|---|---|
| View models | `tui/viewmodels/` | Frozen dataclasses and pure builder functions from API DTOs to display values; shared helpers `common.py` (`ActionState` re-exported from `api.common`, `ErrorVM`), `format.py` (SHA, durations, money as given), `glyphs.py` (engine enum → glyph and word). No Textual, no client errors/classes, no I/O. | `api` |
| Shell | `tui/shell/` | `connection.py` (`ConnectionSupervisor`), `subscriptions.py` (`SubscriptionHub`), `navigation.py` (`Navigator`), `state.py` (`ShellState`), `jobs.py` (watched job outcomes), `projection.py` (revision reducer). Async, no widgets. | `api`, `client`, `viewmodels` |
| Widgets | `tui/widgets/`, `tui/axbenchmark.tcss`, `tui/theme.py` | The design system: shared widgets/base stylesheet and the `axbenchmark` Textual theme; feature-owned styles retain their declared files. | Textual, `viewmodels` |
| Screens | `tui/screens/`, `tui/commands.py`, `tui/app.py` | `EngineScreen` and `AxModal` base classes, every Screen and ModalScreen, palette providers, `AxBenchmarkApp`. | all of the above |
| Test harness | `tui/testing/` | `FakeEngineClient`, fixture loader, `run_screen` helper. Imported by tests only. | `api`, `client`, Textual |

`import-linter` contracts: `tui` imports only `api`, `client`, Textual, pydantic API model types and the stdlib; inside `tui`, `viewmodels` imports no Textual and nothing else in `tui`, `shell` imports no widgets or screens, and `tui.testing` is imported by no production module. `tui` imports neither `subprocess` nor any terminal multiplexer library; the app runs in one terminal without tmux. **[R011]**

**Shell components**

```python
class ConnectionSupervisor:
    def __init__(self, connect: Callable[[], Awaitable[EngineClient]], state: ShellState,
                 hub: SubscriptionHub, clock: Callable[[], float]) -> None: ...
    async def start(self) -> EngineClient: ...         # connect performs engine.hello; incompatibility is a client error
    async def run_reconnect_loop(self) -> None: ...    # on ConnectionLost: backoff, connect, hello, hub.resume()

class SubscriptionHub:
    async def subscribe(self, topics: Sequence[str], handler: EventHandler,
                        on_snapshot: SnapshotHandler) -> SubscriptionHandle: ...
    async def unsubscribe(self, handle: SubscriptionHandle) -> None: ...
    async def resume(self) -> None: ...                # unchanged topics + retained projection: last fully applied EventCursor

class Navigator:
    def __init__(self, state: ShellState, activate: Callable[[View], Awaitable[None]]) -> None: ...
    def view_state(self, view: View) -> ActionState: ...   # from ShellState data, no rule
    async def switch_view(self, view: View) -> None: ...

@dataclass
class ShellState:                                      # observable by screens through Textual reactives
    connection: Literal["connecting", "connected", "reconnecting", "incompatible"]
    active_runs: tuple[RunSummaryDTO, ...]             # revisioned runs snapshot/events; keyed by RunUid
    selected_sha256: str | None                        # last revision highlighted in Library or Template
    default_sha256: str | None                         # from templates.list
```

| Component | Behavior |
|---|---|
| `ConnectionSupervisor.start` | Use the injected connector; production calls `connect(autostart=True)`, which performs M11's version handshake. Do not invent a second hello request shape. A typed incompatible version or unreachable engine is shown with its remedy and exits 3 before Textual starts. |
| Reconnect | On `connection_lost`, mark `reconnecting`, dim call-issuing actions, preserve navigation and show one warning. Retry the connector with 0.5 s doubling to 5 s backoff. After its handshake, resume retained handles with the full cursor; never reissue a command/job. A major-version incompatibility exits 3. Close cancels retries and detaches. [R046, R047] |
| `SubscriptionHub` | Maintain one logical stream per immutable topic set using `EngineClient.subscribe(topics, cursor: EventCursor \| None)`. Store projection, per-object revisions/tombstones, stable append-entry IDs and last fully applied `(epoch, seq)` per subscription generation. Never share a cursor between different topic sets. Deliver accepted state changes on the UI event loop. |
| `Navigator` | Own five logical views: `library`, `environment`, `setup`, `run`, `results`. The app's injected activation callback owns Textual modes/stacks and screen factories; shell code imports no screens/widgets. Run is dimmed with “no active run” when the active projection is empty; each listed run uses its engine `can_attach`. Other views stay available. |
| App-wide subscriptions | Register `runs` and `jobs` before installing their snapshots. Maintain active run membership by RunUid, preserving membership tombstones separately from retained run objects. Remember observed active/attached RunUids across membership removal. Recover each watched run with `run:<run_uid>` snapshots or `runs.status` after reconnect/resync, so an ended run missing from the active list still shows its offscreen interrupted/stopped reason once. Watched jobs retain JobRefs across screen navigation and recover via `job:<job_id>`/`jobs.get`; an active `jobs` snapshot alone cannot recover already finished work. Deduplicate outcome notifications by stable job/outcome identity. For watched launch jobs, inspect durable `JobStatus.initial_progress` before terminal handling, separately from latest `progress`; preserve final totals and the optional warning after finish/cache expiry/restart. [R153, R158] |
| Startup | The `runs` snapshot is authoritative for active runs. `templates.list()` supplies the default revision. Request `environment.recheck(scope="all")` once per app startup and follow its JobRef; reconnect never repeats it. M15.2 injects fixture registrations/responses for these calls, not actual feature engines. |

**Subscription handoff.** Consume [M11's exact algorithm](../../../ARCHITECTURE.md#subscription-handoff-and-replay). The engine registers the queue and captures S under its publication boundary **before** reading snapshots, returns S, then replays every queued event after S. Install snapshots before queued events; newer object revisions win, equal/older upserts or tombstones cannot regress state. Retain tombstone revisions for the generation and deduplicate append entries by stable IDs. Advance the cursor for every processed envelope even when its change is skipped; topic filtering can leave harmless global sequence gaps. Never resume from the newest object revision or from the sequence at snapshot completion. [F04]

Replay keeps projection/revisions only with unchanged topics, matching epoch, retained state and covered cursor. Snapshot mode (initial, epoch_changed, compacted, overflow, topics_changed, invalid_cursor) and `events.subscription.resynced` replace projection, revision/dedup maps and subscription generation, even within the same epoch. Install the replacement subscription_id before applying its events; discard old-generation deliveries. Overflow uses the same S-before-snapshot handoff. Event-only topics trigger their owner's public query on initial load/resync. A lower sequence in a fresh epoch must be accepted.

**Scoped loads.** Every query worker captures screen mount generation, subscription generation/epoch, exact target (RunUid/TrialRef/ResultId/task), arguments and a monotonically increasing load token. Unmount, changed scope, replacement snapshot or connection/epoch change invalidates old tokens; stale responses cannot install data or errors even if worker cancellation arrives late. Merge revisioned query data with the same object rules. For event-only projections, invalidate/refetch when a relevant event races the read, so an older response cannot overwrite newer observations. First subscribe/install state, then perform required queries; never race an unguarded fetch against a replacement snapshot.

**Composition.** `axbenchmark/tui/__main__.py:main(*, attach: RunUid | None) -> int` is bound by M14's `axbenchmark/launcher.py` to `TuiLauncher.__call__(*, attach: RunUid | None) -> int`. M14 resolves `RUN_REF` with `results.resolve_run` before invoking it; M15 receives only a UID or None. Bare invocation opens Library; successful launch may also pass its returned UID. M15 imports no CLI package. Build client/state/hub/supervisor, then `AxBenchmarkApp(client, state, hub, supervisor, screens, attach=attach)`. `screens` is an injected map of five view factories plus feature navigation factories: fixture factories in M15.2, owner factories in M15.3 (`tui/screen_registry.py`). Tests inject `FakeEngineClient` into this same composition; there is no service locator or private store access.

**Recovered launch preparation.** M11 retains the first final-preparation `LaunchStep` in `JobStatus.initial_progress`, exposed by `jobs.get` and `job:<job_id>` snapshots even after completion, generic-cache expiry and engine restart. Watched launch screens/shell read it as well as live progress. Render its optional warning once per job ID per TUI app instance, with the shown-job set separate from subscription revision/dedup maps; replay/resync cannot repeat it. This recovers engine totals/text without computing a threshold or re-opening prelaunch consent. M07 still owns the prelaunch warning confirmation; recovery never launches again. M14 uses the same durable field and per-invocation warning dedup rule. [R158]

#### Routed comparison and existing-profile navigation — R192–R194

M15.3 composes M04 access/existing-profile editors, M03 route-qualification review/progress, M07 comparison/entry selection and M06/M13/M17 retained evidence through the existing screen registry. Navigation carries exact harness/role/profile and draft revision; stale returning results cannot overwrite newer choices. Bind catalog.access_profiles.* and catalog.existing_agent_profiles.*, environment.qualify_route with explicit consent, configs.comparison_*/existing_agent_select and existing runs.launch, never a shell evaluator, private store or duplicate dispatcher. Full six-cell matrix/coverage, native effort mapping, inherited versus clean/overridden treatment and independent Human/System One choice remain owner DTOs. Back/loading never invokes inference. Wide/compact cross-screen acceptance covers static inspection→registration→selection, unknown optional inheritance, strict blocked mapping, subset/exploratory review, diagnostic cancellation/unknown settlement and inert imported profiles.

### 2. API surface

M15 defines no queries, commands, jobs or events. Every call it or any screen makes is a public registry method of the owning namespace, so the future MCP server and the CLI can reach everything the TUI does without TUI-specific methods, private parameters or direct file access. A test enforces this (section 6). **[R150]**

How the TUI consumes the API, for every screen:

| API element | TUI rule |
|---|---|
| Query | Issued by `EngineScreen.load` in a worker group per widget, guarded by the scoped load token above. Only accepted DTOs reach the pure view-model builder; first load shows `-loading`. Worker exclusivity alone is insufficient for scope/epoch races. |
| Command | One action handler issues exactly one command and renders its returned model or typed error. On error the handler changes nothing locally. |
| Job | Issue once, register its JobRef with the app watcher, and consume terminal initial snapshots as well as `job.progress` / `job.finished`. Recover with `jobs.get`; report owners use durable `reports.status(report_id=job_id)` after expiry/resync. Run stop/report waits read durable `RunStatus.stops`, retention and completion_report plus owner status; success, failed/cancelled/skipped or typed pending error settles the local wait. Explicit cancel invokes `jobs.cancel` only when its engine capability permits; navigation/close only detaches. |
| Subscription | Declared per screen in `TOPICS`; subscribed on mount and unsubscribed on unmount through `SubscriptionHub`. Leaving a screen never sends a command. |
| Typed error | M11 decodes application wire errors with numeric outer `-32000` and namespaced `data.code` into `EngineError(code, message, field, remedy, data)`. The screen/client boundary passes public error fields or embedded API `ErrorDTO` to the pure `ErrorVM` builder, which preserves them verbatim; `field` maps to widget IDs. `ProtocolError(rpc_code, message, data)` stays distinct. The TUI never parses prose or reparses JSON-RPC; socket/in-process/fake client must agree. [R038, R149; F18] |
| Capability flags | Copied into the view model as `ActionState(enabled, reason)` per action name; `check_action` returns `None` (dimmed; Textual hides a binding on `False`, which no screen uses for a capability) when `enabled` is false and the reason is shown in the palette and as the footer tooltip. No screen computes a flag. Run-level `can_stop_run` covers running/judging/finalizing/retention_pending as M11 decides; completed configurations have separate disabled `can_stop`. Frozen edit/hint prohibitions and retention/report readiness remain engine decisions. [F13] |
| Registry metadata | `safety == "destructive"` methods (for example `runs.stop`) are only issued from a confirming `AxModal` owned by the method's module (M11 `StopScreen`). |

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `axbenchmark.client.connect(autostart=True)`, the `EngineClient` Protocol (`call`, `subscribe`, `close`, the `connection_lost` signal), `InProcessClient` | M11 (`engine.daemon` and its client package) | Connection, autostart of a detached engine, reconnect detection, in-process tests. |
| `engine.hello(api_version, client={kind: "tui", version, pid})` performed by `connect`, with M11 `Hello`/typed incompatibility | M11 | Version handshake on connect and reconnect. |
| `EngineClient.subscribe(topics, cursor: EventCursor \| None)` / `events.subscribe(topics, cursor?)` with revisioned snapshots, `events.unsubscribe(subscription_id)`, `events.subscription.resynced` | M11 | Screen and app-wide subscriptions; replay or fresh snapshot after reconnect. |
| `runs.list(active=True)`, `runs.status(run_uid)`, event `run.state.changed {state, outcome?, outcome_reason?}`, topic `runs` | M11 | `ShellState.active_runs`, F4 availability, `--attach RUN_REF`, RunScreen data for the compact layout, the halted-run toast with the engine's reason. |
| `job.progress`, `job.finished`, `jobs.get`, `jobs.cancel`, topics `jobs` and `job:<job_id>`; `JobStatus.initial_progress?: LaunchStep` for launch | M11 | Snapshot/outcome recovery; immutable final-preparation totals/warning survives finish/cache expiry/restart separately from latest progress; explicit cancel. |
| `reports.status(report_id=job_id)` or `reports.status(completion_run_uid=run_uid)`; durable `RunStatus.retention`, `stops`, `completion_report` | M13, M11 | Recover final dispositions/pending errors after missed events, resync or expired generic jobs. |
| RunScreen view model with per-lane `ActionState` (`open_configuration`, `live_view`, `stop`) and run-level `RunVM.actions` (`stop_run`, `detach`, `edit`), `StopScreen`, `DetachScreen` | M11 | The RunListDetail layout reuses them unchanged. |
| `harness.task.log(target: TrialRef \| {result_id: ResultId}, task_id, after_seq?, limit, query?)`, event `harness.log.appended` | M05 | Trial-pinned searchable log; response resolves TrialRef/ResultId and invocation scope. `after_seq` is a log-page cursor, never an EventCursor. |
| `templates.list` (`default_sha256`) | M01 | Fallback revision for F3 and F6 before one is selected. |
| `environment.recheck(scope="all")` | M03 | One inspection at TUI startup. |
| Screens built on `EngineScreen`, `AxModal`, `StateSwitcher` and the TCSS selectors of their legends; per-screen `COMMANDS` providers for extra palette entries (M01 `LibraryCommands`) | M01–M13, M16–M18 | Uniform loading, states, capability dimming and palette coverage. |
| The duplicate/revise warning text for a revision with an active run, returned by the engine with the action (M01), and the Library's `a` about binding with `can_about` (M01/M09) | M01, M09 | `ConfirmScreen` content; `?` stays Help. |
| `PromptScreen` callers' `submit` callbacks issuing `configs.save_preset`, `scoring.export_weights`, `telemetry.export_csv` | M06, M07, M18 | The three prompt artboards. |
| `ReviewVM.budget_confirm: ConfirmVM \| None`, built by M07's review view model from `LaunchPreview.trial_budget_warning` (`message`, `task_runs`, `logical_assessments`, `judge_sessions`, `decision_call_bound`, `human_cases`, `trials`, `configurations`, `tasks`) and `None` when the engine returned no warning | M07 | Content of the trial budget `ConfirmScreen` before `runs.launch`. The TUI checks no trial count and no endpoint kind. **[R158]** |
| `environment.verification_plan(harnesses?)` → `VerificationPlanDTO {harnesses: [{harness, label, version}], note}` (the same query M14's `doctor --verify` prompt uses) | M03 | Content of the verification consent `ConfirmScreen` before `environment.verify(consent=true, harnesses)`; the caller (M16 `#verify-now`) builds the `ConfirmVM` from it. **[R031]** |

M15.3 wires M07.3 DecisionEnginesScreen within setup/environment/catalog remedies and M10.3 ContextDetail from HarnessLive/Measurements. Use existing navigation and SubscriptionHub; preserve four root destinations. Route arguments include exact result/full TrialRef/session/agent/window and selected analysis pin; stale generation/selection responses cannot cross scopes. Integration fixtures cover native-only inspection, disabled role with setup remedy, deferred/unknown-resource decisions and independent human/harness grading without an engine. Widget code performs no context/count/score math or profile inference. **R166, R172**

### 4. Screens

**Design system as shared code.** The `DesignSystem` artboard and the rules table in [navigation.md](../design/wireframe-tui/navigation.md) map to:

| Element | Implementation |
|---|---|
| Theme | `tui/theme.py` registers Textual `Theme("axbenchmark-dark")` and `Theme("axbenchmark-light")` with the tokens of the DesignSystem artboard: `$background`, `$surface`, `$panel`, `$foreground`, `$primary` (= `$accent`); `$success`, `$warning`, `$error` stay grayscale and meaning is carried by glyph and wording. |
| Stylesheet | `tui/axbenchmark.tcss` supplies the shared base/widget rules. The app loads feature-owned stylesheet files or sections from their owner contracts alongside it. M15 writes the foundation block of the DesignSystem artboard (`Screen`, `.pane`, `.pane:focus-within`, `.bordered`, `Input`, `Button`, `Button.-primary`, `.kv`, `.notice`, `.notice.-error`, `ModalScreen`, `.dialog`, `.dialog-actions`, `Screen.-compact #detail-pane, #revisions-pane`, `Screen.-compact #summary`). Each screen owner supplies its own section/file with the selectors from its legend; M15 integration loads it without duplicating those styles. |
| `StateSwitcher(ContentSwitcher)` | `tui/widgets/states.py`. Constructed with a base id `x` and the data widget; composes `#x`, `#x-loading` (`LoadingIndicator`), `#x-empty` (`Static.empty`), `#x-error` (`Vertical.notice.-error` with `Button #retry`). Methods `show_data()`, `show_loading()`, `show_empty(text, hint)`, `show_error(error: ErrorVM, retry: bool)`; posts `StateSwitcher.Retry` when `#retry` is pressed. |
| `Notice(Static)` | Classes `-error`, `-warning`, `-success`, info; text always starts with ✗ ▲ ✓ or none, followed by words. |
| `Pane(Vertical)` | Class `.pane` with `border_title` and `border_subtitle`. |
| `KeyValue(Static)` | Class `.kv`; renders `Sequence[tuple[str, str]]` with a fixed label width. |
| `Sha(Static)` | Renders a digest from `format.sha_full` (64 cells), `sha_short8`, or `sha_mid` (`first16…last8`); never truncates without the ellipsis. |
| `SearchableLog(Vertical)` | `RichLog #log .bordered` with `Input #log-search`; matches get class `.-match` (`background: $primary 24%`); `n` moves to the next match. Shared by RunListDetail and M05's RunConfigScreen. |
| `AxModal(ModalScreen[T])` | `tui/screens/base.py`. `align: center middle`, `background: $background 60%`, dialog `Vertical .dialog` of fixed width (72–86 cells, `max-width: 100%`), `Horizontal .dialog-actions` right-aligned; `esc` → `dismiss(None)` without changes. |
| `FileViewScreen(AxModal[None])` | `tui/screens/file_view.py`. Read-only `TextArea(read_only=True)` with a title, the text and its digest from an API response the caller already holds (`templates.file`, `catalog.files`, `launch.frozen_config_yaml`, `configs.launch_record`); `c` copies. It never opens a path itself. Used by M01, M02, M04, M07, M09. |
| `PromptScreen(AxModal[str \| None])` | `tui/screens/prompt.py`; the shared prompt artboards Save preset… (name), Export configuration (path) and Export CSV on the Telemetry screen (path). Constructed with `title`, `label`, `default` (a preset name, an export path) and `submit: Callable[[str], Awaitable[ErrorVM \| None]]` supplied by the caller. Tree `Vertical #prompt .dialog` (width 72) → `Label #prompt-label`, `Input #prompt-input`, `Static #prompt-error .notice.-error` (hidden until an error), `Horizontal .dialog-actions` (`Button #cancel`, `Button #ok .-primary`); `Footer`. `enter` / `#ok` awaits `submit(text)`: the caller's callback issues its one API call; `None` dismisses with the text, an `ErrorVM` stays open and shows `message` and `remedy` in `#prompt-error`, marking `#prompt-input` when `field` names it. `esc` / `#cancel` dismisses with `None`. PromptScreen itself issues no call and validates nothing. Used by M06 (Save preset…, Export configuration) and M18 (Export CSV). |
| `ConfirmScreen(AxModal[bool])` | `tui/screens/confirm.py`. Constructed with a `ConfirmVM` (`tui/viewmodels/common.py`: `title: str`, `message: str`, `lines: tuple[tuple[str, str], ...]`, `confirm_label: str`, `cancel_label: str`) that the caller's view model builds from an API response. Tree `Vertical #confirm .dialog` (width 72) → `Label #confirm-title`, `Static #confirm-message`, `KeyValue #confirm-lines` (hidden when `lines` is empty), `Horizontal .dialog-actions` (`Button #cancel`, `Button #ok .-primary`); `Footer`. Focus starts on `#cancel`. `enter` on `#ok` dismisses `True`; `#cancel` and `esc` dismiss `False`; it issues no call. Used for destructive methods whose owner draws no dedicated confirmation (for example `judging.stop`, `catalog.remove_override`, `configs.delete_preset`, Discard draft on the Library), for warnings the engine attaches to an action (M01's duplicate or revise on a revision with an active run: "This creates a new revision. The active run continues on <label>, and its results will not be comparable with the new revision."; M07's trial budget warning before `runs.launch`: title "More than 5 trials", the engine's `message` that the extra trials will consume budget and subscription usage, lines Task runs (`configurations × trials × tasks = task_runs`) and Judge sessions, buttons Back and Launch), and for consent before a call with side effects (M16's "Verify now" before `environment.verify`: one line per harness of `environment.verification_plan` with label and version, the plan's `note` that each makes one minimal model call, buttons Cancel and Verify). Message and values are the engine's; the screen composes none and decides nothing about when it is shown: the caller pushes it only when the API response calls for it (`budget_confirm` is `None` without a `trial_budget_warning`). **[R031, R158]** |
| `glyphs.py` | Status ✓ ▲ ✗ ● ○; readiness ✓ ✗ ? ▲ ○ ◷; checks ✓ ✗ ? ○; source ★ ◆ ↓; change ~ + = ↔. A lookup from an engine enum value to `(glyph, word, css_class)`; an unknown value renders `?` and the raw value, never a guessed state. |

**`EngineScreen(Screen)`** — base class in `tui/screens/base.py` for every module screen. It is how a screen stays a pure view over API data:

```python
class EngineScreen(Screen, Generic[VM]):
    TOPICS: ClassVar[Sequence[str]] = ()             # e.g. ("environment",)
    vm: reactive[VM | None]

    async def fetch(self) -> VM: ...                  # subclass: call queries, return build_vm(...)
    def render_vm(self, vm: VM) -> None: ...          # subclass: push values into widgets, no logic
    def actions(self, vm: VM) -> Mapping[str, ActionState]: ...   # copied from capability flags
    async def on_event(self, event: EventEnvelope) -> None: ...        # subclass: patch DTO, rebuild vm
    async def call(self, method: str, request: BaseModel, *, error_into: StateSwitcher | None = None) -> BaseModel | None: ...
```

| Hook | Behavior |
|---|---|
| `on_mount` | Establish the scoped subscription first, install its snapshot, then start any required query loads with scope/epoch/generation tokens; first data load shows `-loading`. Non-subscribing modals load directly with mount/scope tokens. Event-only topics load/refetch through public queries. |
| `on_unmount` | Invalidate load tokens, unsubscribe the handle and cancel workers. The app watcher may retain a started JobRef. Send no stop/cancel command. |
| `check_action(action, params)` | `None` (dimmed) when `ShellState.connection != "connected"` and the action issues a call, or when `actions(vm)[action].enabled` is false; `True` otherwise. Pure navigation actions stay enabled while reconnecting. |
| `call` | Issues exactly one method; on a typed error shows it in `error_into` or as `notify(severity="error")` and returns `None`. Used by every action handler. |
| Compact | Nothing per screen: the app sets `-compact`; the screen's TCSS section hides or shows widgets. |

**App shell — `AxBenchmarkApp(App)`** in `tui/app.py`.

| Aspect | Specification |
|---|---|
| Construction | `AxBenchmarkApp(client, shell, hub, supervisor, screens, *, attach: RunUid \| None)`; `MODES` as in `Navigator`; `COMMANDS = {ViewCommands, RunCommands, ScreenCommands}`; theme `axbenchmark-dark` by default; Textual's theme command switches to `axbenchmark-light`. |
| Mount | App-wide subscription and startup calls (section 1). Mode `library` uses its injected factory (M01 in production). With `attach` set, query `runs.status(run_uid=attach)`, then open `RunScreen(attach, reattached=True)` (M11); an unknown/deleted UID stays on Library with its typed error. M14 handles ambiguous labels before launch of the TUI. Attaching restarts nothing. **[R046, R138]** |
| Reflow | `on_resize` and `on_screen_resume` call `screen.set_class(is_compact(size), "-compact")` with `is_compact(w, h) = w < 100 or h < 30`. Layout visibility changes use CSS without recomposing widgets. Preserve logical focus and explicitly map it between the wide lane and its compact row/detail when the focused widget becomes hidden; preserve cursor rows, scroll positions, query text and the selected trial/task. **[R038, R044]** |
| Mouse | Bind and test click focus/activation on rows, tabs, buttons and footer actions; double-click on a data row invokes its existing `enter` action once. Wheel scrolling and keyboard activation must preserve the same selected target and capabilities; do not assume an unverified framework default. |
| Quit | `q` → `action_quit`: unsubscribes, closes the client, exits. It issues no `runs.*` call; active runs keep running in the engine and remain reattachable (`ctrl+r` in the Library, `axbenchmark --attach RUN_REF`). **[R046, R047]** |

| Binding (App) | Action | API call |
|---|---|---|
| `f1` | `switch_view("library")` | none |
| `f2` | `switch_view("environment")` | none; `EnvironmentScreen` (M03) loads itself |
| `f3` | `switch_view("setup")` | none; an empty `setup` stack opens `SetupScreen(shell.selected_sha256 or shell.default_sha256)` (M07) |
| `f4` | `switch_view("run")` | none; dimmed by `Navigator.view_state(run)`; an empty `run` stack opens `RunScreen` for the most recently launched entry of `shell.active_runs` |
| `f6` | `switch_view("results")` | none; an empty `results` stack opens `ResultsScreen` (M02) for the selected or default revision |
| `?` | `push_screen(HelpScreen())` | none; app-wide on every screen, and no screen binds `?` (the Library's inventory "about" screens use `a`, an M01/M09 binding dimmed unless the selected row is the built-in inventory template) |
| `ctrl+p` | `command_palette` | none until a command runs; the command's action issues its own call |
| `q` | `quit` | none (unsubscribe and close only) |
| `tab` / `shift+tab` | `focus_next` / `focus_previous` | none |

F5 is not bound by the app; Environment (Recheck) and the catalog (Refresh) bind it.

**Command palette** — M15 owns `tui/commands.py` and the shared CommandPalette behavior/board; feature children contribute registered entries/providers only. M15 also owns the shared WidgetStates board and state widgets/harness; feature children supply their own response/state fixtures rather than duplicate that infrastructure.

| Provider | Hits |
|---|---|
| `ViewCommands(Provider)` | "Go to Library / Environment / Setup / Run / Results", "Keys and views", "Quit"; Run carries `Navigator.view_state(run)`. |
| `RunCommands(Provider)` | "Reconnect to run": one hit per run in `ShellState.active_runs` (template label, run_label, origin, state; UID in details), each pushing M11's `RunScreen(run_uid, reattached=True)` with its returned can_attach; with no active run a single disabled hit with the reason. Library `ctrl+r` (M01) uses the same list. |
| `ScreenCommands(Provider)` | One hit per binding of the active screen (`screen.active_bindings`, footer description as the title, the binding's key as help). A binding whose `check_action` returns `None` is still listed with its `ActionState.reason`; selecting it runs nothing and shows the reason as a toast. So every footer action is a command, also when a compact footer drops it. |
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

**RunListDetail — the compact and optional wide list/detail layout of `RunScreen`** — boards RunListDetail and RunListDetail-80x24; shared component `axbenchmark/tui/widgets/run_list_detail.py` and presentation-only `tui/viewmodels/run_list_detail.py` are M15.1-owned and runnable with fixture rows. M15.3 connects/tests the actual owner screen. M11 owns `tui/screens/run.py` and `tui/viewmodels/run.py`, instantiates this component through the shared factory contract, and handles its selection/search/navigation messages. The component accepts `RunListDetailVM` (stable row keys/labels/status, selected key, explicit scope display, detail rows and log lines/matches/state) and emits `Selected(key)`, `Search(text)`, `Page(after_seq)` and `Action(name)` messages. M11 maps its own VM into this presentation contract; the component imports no M11 screen/VM, issues no API calls and duplicates no screen logic. RunListDetail is the only compact run layout: there is no compact table (`#lanes-table`) on RunScreen. M15 specifies the shared composition, which RunScreen composes alongside the adaptive wide `#lanes` grid and shows under `Screen.-compact` or the explicit wide list/detail switch:

| Aspect | Specification |
|---|---|
| Widget tree | `Header`, `Static #run-bar`, `Horizontal` → scrollable `ListView #lane-list .pane` (width 26, one `ListItem` per selected configuration including queued siblings; all six registry harnesses reachable) and `Vertical #detail` (width `1fr`) → `Vertical #lane-detail .pane` (owner-supplied task/stage strip and glyphs, `KeyValue` Now · Elapsed · Checks) and `SearchableLog` (`RichLog #log .bordered` with `Input #log-search`); `Footer`. Focus order `#lane-list`, `#lane-detail`, `#log-search`, `#log`. |
| TCSS | `Screen.-compact #lanes, Screen.-list-detail #lanes { display: none; }`, `#lane-list { width: 26; }`, `#detail { width: 1fr; }`, `#log .-match { background: $primary 24%; }`; hide `#lane-list` and `#detail` only when neither compact nor explicit list/detail mode is active. |
| Data | `#lane-list` and `#lane-detail` render M11's RunScreen view model (from `runs.status` and its subscription), without fixed lane/task counts or scheduling rules. Stable configuration identities connect `#lanes` focus and `#lane-list` cursor; resize/layout switches preserve configuration, explicit trial/task, logical focus and log/selector scroll. **[R044]** |
| Log | RunScreen takes the selected explicit TrialRef/ResultId and task_id from status, then calls `harness.task.log(target, task_id, limit=500)`. Filter appended lines by resolved trial/task/invocation, not configuration alone; page with M05 log `after_seq` (separate from event cursor). Historical evidence/log navigation always retains its explicit target even while another trial runs. Only genuinely live entry points may resolve active scope, and their response returns its TrialRef. Titles show trial/task and match count. Apply scoped-load guards on each selection/search change. [F02, F06] |
| Search | `Input.Submitted` on `#log-search` calls `harness.task.log(target, task_id, query=text)`; the returned `matches` are highlighted and `n` steps through them without a call. Search does not filter or reorder the log. **[R038, R044]** |
| States | `#log` sits in `StateSwitcher` `log` (`-loading` while the first page loads, `-empty` before the task writes output, `-error` with the engine's message, e.g. `harness.log_unavailable`). |

| Binding | Action | API call |
|---|---|---|
| `↑` / `↓` | cursor on `#lane-list` | `harness.task.log` for the newly selected configuration |
| `enter` | `open_configuration` | none; push `RunConfigScreen` (M05), which loads itself |
| `v` | `live_view` | none; push `HarnessLiveScreen` (M11), dimmed from the lane's `live_view` ActionState |
| `/` | `focus("#log-search")` | none; submit issues `harness.task.log(query=…)` |
| `n` | next match | none |
| `s` | `stop_configuration` | none; push M11 `StopScreen` from lane can_stop; confirmation calls `runs.stop(scope="configuration")` |
| `S` | `stop_run` | none; push M11 `StopScreen` from run can_stop_run, including judging/finalizing/retention_pending; confirmation calls `runs.stop(scope="run")` |
| `d` | `detach` | none; push M11 `DetachScreen`; detaching sends no `runs.*` call |

`e` and any other edit action stay dimmed from the run's capability flags in both layouts; no binding can change frozen prompts, models or original weights, or send input to a harness. **[R047]**

**Screens built on the shell.** Library (M01), Environment (M03), Setup (M07), Run (M11) and Results (M02, M06) are the five views; their owners' Implementation sections give classes, view models, calls and bindings. M12 retains `tui/screens/judge_capability.py` even when M07 opens it; M03 retains CollectorGuide even though its board is grouped under M18; M01 owns `NewTemplateScreen` in `tui/screens/new_template.py` and NewTemplate/NewTemplateRepo/NewTemplateInvalid; M16 supplies its planning/capture APIs and subsequent planner/editor screens. M17 owns every template/result ZIP screen and state in `tui/screens/exchange.py`, all exchange view models in `tui/viewmodels/exchange.py`, and `tui/widgets/zip_picker.py`/`validation_order.py`. M01/M02 own only Library/Results navigation entrypoints using injected M17 factories, with no exchange dialog fragments. M15 registers their factories without redesigning their implementations. All of them subclass `EngineScreen` or `AxModal`, put every data widget in a `StateSwitcher`, take `-compact` from the app, and are reachable by the F-keys and the palette above.

### 5. CLI

| Command | Reaches M15 |
|---|---|
| `axbenchmark` | M14's launcher binds `TuiLauncher(attach=None)` to `main(attach=None)`. Exit 0 after detach/quit; 3 for unreachable/incompatible engine. [R048] |
| `axbenchmark --attach RUN_REF` | M14 first calls `results.resolve_run(RUN_REF)`; only a resolved `RunUid` enters `main(attach=run_uid)`, then `runs.status`/RunScreen observe it. Ambiguity is a typed CLI error with candidate UIDs/origins, never an arbitrary TUI selection. [R049] |
| `axbenchmark run --config FILE` | After M14's launch job succeeds, the same launcher receives `LaunchResult.run_uid`. No second launch from M15. |

Other CLI commands reach their namespaces directly. UID is the internal key throughout navigation and subscriptions; run label plus origin are display values, with the UID available for disambiguation. Currency, eligibility and lifecycle remain engine-provided data.

### 6. Headless verification

| Level | Required verification |
|---|---|
| Pure foundation | `is_compact` boundaries at 120×40, 100×30, 99×40, 120×29 and 80×24; SHA widths/unknown enum glyphs; preserved money/currency/basis and error fields; no Textual import in helpers. Registry-valid fake rejects unknown names and invalid DTO shapes. |
| Shell with fake client | Same-epoch replay, event between snapshots, snapshot-covered older/equal revisions, tombstone/delete/recreate, stable log entry dedup; lower-sequence new epoch, changed topics, future cursor, compaction and overflow replace state/generation. Late old-generation deliveries and query responses after scope/epoch change cannot regress state. No reconnect command/job retry. |
| Early real foundations | M15.2 uses real M11.1–2 Unix-socket and InProcessClient with fixture feature registrations and screens. Compare DTOs/errors/snapshot projections; finished-before-subscribe jobs settle, navigation preserves watched outcomes and detach does not cancel fixture work. Recover a finished launch’s `initial_progress` after later progress/cache expiry/restart; final totals remain available and the warning appears once across replay/resync. No full scheduler required. |
| Shared Pilot harness | Wide 120×40/compact 80×24: loading/empty/error/content, retry, focus, click/double-click/wheel, keyboard and palette parity. Confirm cancel/escape never calls; caller confirm submits once. Prompt errors keep field/message/remedy; rapid Enter/click cannot duplicate its pending submit. Resize preserves selected target, focus and scroll. |
| Feature integration | All five real owner views, Help and palette; no-harness manual authoring/capture/approval and library/exchange/report access; exact one-shot/ordered multi-step inputs, empty/populated current-folder captures and approved-template reuse; locked commit policy/scoped evidence, budget warning/verification consent. All six registry lanes plus queued configurations and selected subsets (including four-lane 2×2) ↔ RunListDetail at 120×40/80×24 preserve configuration/trial/task/focus/scroll; M11 projections preserve saved jobs 4/5. Cover live source labels/unavailable values, log search, explicit two-trial navigation and decision-engine-only capability gates without losing context/statistics states. Same-label imported runs retain distinct UID/origin subjects and exports. |
| Lifecycle integration | Stop judging/finalization/retention_pending using engine run capability while completed-configuration stop stays dimmed. Stop/run/report snapshots settle success, failed/cancelled/skipped and typed pending errors even after missed events/cache expiry. Detach, q, terminal close and reconnect preserve pids/task counts; frozen inputs and passive live views remain unchanged. |
| Contracts | All calls/topics/events resolve in the API registries; numeric outer -32000 and namespaced application errors have socket/in-process/fake parity; ProtocolError remains separate. Import-linter prohibits engine/private stores/subprocess/tmux and production imports of testing. M14's keyword-only UID launcher signature matches exactly. |

**Fake-client harness** (`axbenchmark/tui/testing/`) implements Bootstrap's exact M11 `EngineClient` Protocol (`call`, `subscribe(topics, cursor: EventCursor | None)`, `close`, `connection_lost`). M15.1 owns `client.py`, `fixtures.py`, `harness.py` and `screens.py` with fixture-only screen factories. Test controls supply a full initial `Subscription`, `EventEnvelope`s and replacement Subscription/resync controls including subscription_id, epoch, revisions/tombstones and entry IDs; do not manufacture sequence-only events.

`respond(method, response_or_error)` validates against the published registry. `queue_subscription(topics, subscription, envelopes)` installs deterministic histories; `defer_response(method)` exposes controllable completion for query races; `drop_connection()` signals loss. Record method/request, subscriptions/cursors and closes separately, so “no command” assertions can allow observational subscribe/unsubscribe. Provide `run_screen(screen_factory, client, size=(120, 40))` with app-like injected shell seams and `load_fixture(name)`. Foundations ship only their owned board fixtures; feature owners supply their own registered DTO fixtures. Registry validation never imports feature adapters.

M15.3's concrete journey matrix covers M01 manual entry → M16.5 manual capture/review → M07/M11 execution, independent of M16.4 planner UI. Both modes and seven domains, empty/populated current folders, locked task-commit policy and M08 scoped evidence states pass through real owner routes. Reach every six-registry row and same-harness queued entry across adaptive wide/compact layouts; preserve selection/focus and explicit saved jobs limits. **R177–R183**

### 7. Integration and pending obligations

All three children and the real M11/M05/M08/M10/M12/M13/M18 lifecycle/retention pipeline plus M01/M02/M07/M16/M17 journeys must pass before parent acceptance. Record real supported-host/harness/collector verification and unavailable hardware limits; fixture results alone cannot claim those providers work. M15.3 owns cross-module acceptance and navigation, while each feature owner fixes its screen.

**Shell/board ledger follow-up (no wireframe edits here):** HelpKeys and CommandPalette need engine stop reasons, UID/origin labels and reconnect states; RunListDetail needs explicit trial/task/log scope and scope-change behavior. RunReattached/RunDetach launcher examples must say RUN_REF resolved to UID. Record WidgetStates loading/empty/error/content plus replay/resync, stale-query rejection, terminal-job recovery and typed pending-error cases in the artboard-to-screen/state ledger. M11 owns RunOverview/StopConfirm/StopCleanup judging/finalization/retention variants, M12 JudgeCapability, M03 CollectorGuide, M13 ReportProgress/ReportGenerate and M02 ReportReady; M01 owns NewTemplate/NewTemplateRepo/NewTemplateInvalid while M16 supplies their planning/capture calls. All template/result ZIP board/state legends target M17 `tui/screens/exchange.py` and `tui/viewmodels/exchange.py`, including `zip_picker.py`/`validation_order.py`; Library/Results legends show injected entrypoints only. CommandPalette/WidgetStates remain M15-owned, with feature entries/fixtures only. Add recovered launch final totals/warning from durable `initial_progress` with once-per-job display. Existing boards/previews do not prove these additions are implemented. [F04, F06, F13, F15, F18]
