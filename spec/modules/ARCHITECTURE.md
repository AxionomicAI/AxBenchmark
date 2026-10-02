# Headless engine and interface architecture

Status: implementation decision. [SPEC.md](../SPEC.md) remains authoritative for product behavior; this document fixes how that behavior is structured in code. Every module's **Implementation** section follows it.

## Decision

All benchmark logic and state live in a **headless engine**. The TUI and the CLI are clients of the engine's API and contain no domain logic; an MCP server is a planned third client and must need nothing beyond what the API already offers. A run, a planning session, an import or a report generation behaves identically whether it was started from the TUI, from the CLI, from an MCP tool call or by a script, and it keeps going when every client is gone.

Inside the engine, each module follows clean architecture adapted to Python: pure domain code at the centre, use cases around it, and every side effect (filesystem, subprocesses, harness CLIs, Playwright, sensors, the clock) behind a port that an adapter implements.

Consequences:

- No rule from a module contract is evaluated in an interface. Eligibility, validation, readiness, compatibility, scoring and lifecycle decisions come back from the engine as data; interfaces only present them.
- An interface never reads or writes `~/.axbenchmark/` directly. The engine is its only writer and reader.
- Anything a screen can do has an API method; anything the API exposes can be reached from the CLI.
- The standalone HTML report ([M13](13-standalone-html-report.md)) is an artifact the engine writes, not a client.

## Stack

| Concern | Choice |
|---|---|
| Language | Python ≥ 3.12, asyncio throughout the engine and clients. |
| API models | pydantic v2 models in `axbenchmark.api`; JSON Schema exported from them is the published contract. |
| Transport | JSON-RPC 2.0 over a Unix domain socket, newline-delimited JSON, at `~/.axbenchmark/run/engine.sock` (directory mode 0700, socket 0600). |
| Future MCP client | Official `mcp` Python SDK, stdio transport, tools generated from the API registry. |
| Engine process | `axbenchmarkd`, one per user, started on demand by any client (`axbenchmark.client.connect(autostart=True)`). |
| TUI | Textual, following the [wireframes](../design/wireframe-tui/navigation.md): screen classes, widget ids, TCSS and bindings named there are the target. |
| CLI | Typer. |
| Tests | pytest + pytest-asyncio; Textual `App.run_test()` / `Pilot` for screens; `import-linter` for layer rules. |

## Package layout

```
axbenchmark/
  api/             DTOs, method registry, event types, error codes. Depends on pydantic only.
  engine/
    <module>/      one package per module (see Ownership), each with the four layers below.
    shared/        cross-module domain types (ids, SHA-256 identity, money, durations, clock port).
    daemon/        composition root, socket server, sessions, job and run supervision.
  client/          EngineClient (socket) and InProcessClient (tests, embedding). Same Protocol. Owned by M11.
  launcher.py      Client composition root: the `axbenchmark` console script; binds the CLI's TuiLauncher to tui (M14).
  tui/             Textual App, screens/, widgets/, viewmodels/.
  cli/             Typer app; one command module per command group.
  mcp/             (future) MCP server exposing registry methods as tools; a client like tui and cli.
```

### Layers inside an engine module

| Layer | Path | Contains | May import |
|---|---|---|---|
| Domain | `engine/<module>/domain/` | Entities and value objects as `@dataclass(frozen=True, slots=True)`, enums, pure rules and calculations, domain errors. No I/O, no asyncio, no pydantic. | stdlib, `engine/shared/domain`, another module's `domain` only for a vocabulary that module owns and the importing module's Implementation section names (for example M08's check outcome in M02, M18's collector cause in M03, M01's `RelPath` in M17) |
| Ports | `engine/<module>/ports.py` | `typing.Protocol` interfaces for every side effect: repositories, process runners, harness adapters, browsers, sensors, clock, id generator. | domain |
| Application | `engine/<module>/application/` | One use-case class per command, query or job (`LaunchRun`, `ListTemplates`), taking ports in `__init__`. Orchestrates domain rules; emits domain events through an `EventPublisher` port. | domain, ports, other modules' application *interfaces* (Protocols), never their adapters |
| Adapters | `engine/<module>/adapters/` | Port implementations: filesystem/YAML repositories, subprocess and harness CLIs, Playwright, psutil, vendor tools; plus `rpc.py`, which maps API DTOs to use-case inputs and domain results/errors back to DTOs. | everything above, third-party libraries, `api` |

Dependencies point inward only. Domain objects never cross the API; `adapters/rpc.py` is the only place DTOs and domain types meet. Wiring happens once, in `engine/daemon/composition.py`, by constructor injection (no service locator, no DI framework). Tests replace adapters with in-memory fakes of the same Protocols.

Layer rules, enforced by `import-linter` contracts checked in the test suite:

- `tui`, `cli` and `mcp` import only `api` and `client`. `client` imports only `api`. `api` imports nothing from the other packages. `launcher` imports `cli` and `tui` and nothing from `engine`.
- `engine` never imports `tui`, `cli`, `mcp` or `client`.
- In every engine module, `domain` → `ports` → `application` → `adapters` is a layered contract: no inner layer imports an outer one, and only `adapters` import third-party I/O libraries or `api`.
- Modules talk to each other through application-layer Protocols or events, never by reaching into another module's adapters or persisted files.

## API shape

Every method is named `<namespace>.<name>`, where the name is a snake_case verb or noun phrase, optionally qualified by its subject (`templates.list`, `harness.task.log`, `verification.regression.get`), and belongs to exactly one module (see Ownership). Modules also offer in-engine application interfaces (Protocols) to each other; those are not API methods and are listed in the owner's Implementation section. There are four kinds:

| Kind | Contract |
|---|---|
| Query | Read-only and idempotent. Returns a pydantic model. Example: `templates.list`, `runs.status`. |
| Command | Validates and mutates. Returns the resulting model or a typed error; never partially applies. Example: `configs.save`, `runs.stop`. |
| Job | A long operation (planning, import, report generation, model refresh, environment recheck). The call returns a `JobRef` at once; progress arrives as `job.progress` / `job.finished` events, and `jobs.get` / `jobs.cancel` work for any job. A job outlives the client that started it. |
| Subscription | `events.subscribe(topics, since_seq?)` returns a snapshot of the subscribed state plus a sequence number, then streams events with increasing `seq`. Reconnecting with `since_seq` replays missed events, or returns a fresh snapshot when they have been compacted. This is how attach, detach and reconnect work, for TUI and CLI alike. |

Event names are `<namespace>.<noun>.<past-tense verb>`, for example `catalog.refresh.finished`. M11's events use the singular prefixes `run.`, `job.` and `engine.` (`run.task.started`, `run.state.changed`, `job.finished`); there are no `runs.*` or `jobs.*` events. Payloads are pydantic models in `axbenchmark.api`. Topic names (`run:<id>`, `run:<id>/<cfg>`, `live:<id>/<cfg>`, `job:<id>`, `runs`, `jobs`, `engine`, and one bare topic per namespace) are defined by [M11](11-run-orchestration.md); each module registers the provider for its own topic.

Errors are JSON-RPC errors with a stable `code` string (`<namespace>.<reason>`, e.g. `scoring.invalid_weights`), a human message, optional `field` paths and an optional `remedy`. Interfaces display these verbatim and never reinterpret them; invalid input is never silently replaced.

Capabilities: queries that back a screen return the actions currently allowed as fields named `can_<action>`, each an `ActionState {enabled, reason}` from `axbenchmark.api.common` where `reason` is an error or reason code (for example `can_launch: {enabled: false, reason: "environment.no_harness"}`). Interfaces dim or enable bindings from these flags and never compute them; in Textual, `check_action` returns `None` to dim a binding (`False` would hide it).

Registry metadata: each method is registered with its kind, request and response models, a one-line description, and a safety class (`read`, `write`, `destructive`, e.g. `runs.stop`). The CLI help, the JSON Schema export and the future MCP tool list are all generated from this registry, so adding a method never requires interface-specific plumbing beyond presentation.

`engine.hello` negotiates `api_version` (semver). A client refuses to talk to an engine with a different major version and tells the user how to restart the engine.

## Engine process lifecycle

- `axbenchmarkd` holds every active run, job and subscription. Runs execute in supervised child process groups owned by the engine ([M05](05-harness-execution-isolation.md), [M11](11-run-orchestration.md)); no run is a child of a client.
- Closing a client, killing a terminal or losing the socket only drops that client's subscriptions. Only explicit stop methods end work: `runs.stop` for runs (including their judging), `judging.stop` for a judging batch, `jobs.cancel` for a job.
- The engine exits on its own only when it has no active runs, jobs or clients for an idle period (default 10 minutes). `axbenchmark engine stop` refuses while runs are active unless they are stopped first.
- On start, the engine reconciles persisted run state ([M02](02-retained-results-comparability.md), [M11](11-run-orchestration.md)): a run whose engine died is recorded as actually interrupted, never resumed silently.
- `axbenchmark run --config … --no-tui` submits the run, streams events as plain progress, and on Ctrl-C detaches (printing the `--attach` and `stop` commands) rather than stopping.

## Interface rules

TUI screens:

- Each screen has a view model in `tui/viewmodels/`: a plain dataclass built by a pure function from API models. View models are unit-tested without Textual.
- Data loads in a Textual worker calling the client; results populate the screen's `ContentSwitcher` states (`#x`, `#x-loading`, `#x-empty`, `#x-error`) from the wireframe design system.
- Live data comes only from subscriptions. A screen subscribes on mount and unsubscribes on unmount; leaving a screen never sends a command.
- Every action handler issues exactly one API call (command or job) and renders its result or error.

CLI commands:

- Each command maps to one API method (or a job plus its event stream). Human output is the default; `--json` prints the API response or event stream as JSON lines.
- Exit codes: 0 success (including a followed run that completed with failed or unverified tasks; scripts read task outcomes from `status --json`), 1 operation failed (typed error, including a rejected package, an unknown id or an incomplete configuration, and a followed run that ended stopped or interrupted), 2 invalid usage, 3 engine unreachable or incompatible.

## Ownership of API namespaces

| Module | Engine package | API namespace | Interfaces |
|---|---|---|---|
| [M01](01-template-library-identity.md) | `engine.library` | `templates.*` | Library, Template screens |
| [M02](02-retained-results-comparability.md) | `engine.results` | `results.*` | Results screens |
| [M03](03-environment-readiness.md) | `engine.readiness` | `environment.*` | Environment screen, `doctor` |
| [M04](04-model-catalog.md) | `engine.catalog` | `catalog.*` | Catalog, model picker, `models refresh` |
| [M05](05-harness-execution-isolation.md) | `engine.harness` | `harness.*` (adapters, isolation, live task stream) | Run isolation, live view sources |
| [M06](06-scoring-rankings.md) | `engine.scoring` | `scoring.*` | Rankings, weights editor |
| [M07](07-run-configuration.md) | `engine.configs` | `configs.*` | Setup, launch review |
| [M08](08-verification-evidence.md) | `engine.verification` | `verification.*` | Checks, evidence, screenshots |
| [M09](09-default-inventory-benchmark.md) | `engine.library.builtin` | none (registered through `templates.*`) | Inventory screens |
| [M10](10-measurements-cost.md) | `engine.measurements` | `measurements.*` | Measurement panels |
| [M11](11-run-orchestration.md) | `engine.runs` + `engine.daemon`, and `client` | `runs.*`, `events.*`, `jobs.*`, `engine.*` (events `run.*`, `job.*`, `engine.*`) | Run overview, live view, stop, attach |
| [M12](12-quality-judging.md) | `engine.judging` | `judging.*` | Judging screens, rejudge |
| [M13](13-standalone-html-report.md) | `engine.reports` | `reports.*` | Report generation, `report` |
| [M14](14-command-line-interface.md) | `cli`, `launcher.py` | none (client) | All CLI commands |
| [M15](15-terminal-interface.md) | `tui` | none (client) | App shell, navigation, shared widgets |
| [M16](16-custom-template-planning.md) | `engine.planning` | `planning.*` | Planning screens |
| [M17](17-zip-exchange.md) | `engine.exchange` | `exchange.*` | Import/export dialogs, ZIP commands |
| [M18](18-hardware-monitoring.md) | `engine.telemetry` | `telemetry.*` | Telemetry panels |

A module that needs another module's data calls that module's namespace; it does not add methods to it. Missing methods are listed in the module's "Requires from other modules" table and reconciled in the owner's spec.

## Implementation section template

Each module spec ends with `## Implementation`, containing:

1. **Engine component**: package, and per layer: domain types and rules, ports, use cases, adapters; plus persisted state and the processes it owns.
2. **API surface**: tables of queries, commands, jobs and events in its namespace, giving request fields, response model, errors and capability flags.
3. **Requires from other modules**: the methods and events it consumes, by name.
4. **Screens**: for each wireframe artboard the module owns, the Textual screen class and file, its view model, the calls that load it, its subscriptions, and each binding with the API call it issues and the states it shows. Modules without screens say which screens consume them.
5. **CLI**: the commands that reach this module and their API methods.
6. **Headless verification**: domain unit tests, use-case tests with fake ports, API tests through `InProcessClient` with no interface attached, and screen tests against a fake client.
