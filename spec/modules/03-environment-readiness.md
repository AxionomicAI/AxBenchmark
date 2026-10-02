# M03 — Environment discovery and readiness

Status: proposed module specification. This document defines required behavior, not implemented capabilities. It derives from [SPEC.md](../SPEC.md); requirement IDs identify the assigned source contracts.

## Purpose and scope

Engineers implementing this module must provide an honest, actionable account of the local prerequisites for planning, execution, verification, and optional measurement. Environment inspection must work on macOS and Linux. It must detect locally installed Claude Code, Codex, Grok CLI, and Pi without assuming that every detected installation is usable for every configuration. **[R005, R006]**

On opening the library, present the inventory benchmark as the default choice while exposing discovered harnesses, model information, authentication readiness, runtimes, browser support, and hardware collectors. Discovery supplies readiness information; the default template choice belongs to the library ([M01](01-template-library-identity.md)) and is presented by the TUI ([M15](15-terminal-interface.md)). **[R029]**

## Required readiness behavior

Report each prerequisite independently, including what was established and what remains unknown. Finding an executable does not establish authentication, model compatibility, supported effort settings, or successful headless operation. Authentication failures must appear as authentication failures; an inconclusive check must remain unknown. Unsupported settings must remain visibly unsupported rather than being silently substituted. Model discovery and offline catalog fallback follow [M04 — Model catalog](04-model-catalog.md), and harness readiness follows [M05 — Headless execution](05-harness-execution-isolation.md). **[R029, R137]**

Offline discovery must distinguish unavailable live information from known local findings and cached model information. Cached or bundled catalog entries retain M04's source and age information; they do not prove current account access. Likewise, inability to verify access while offline must not be presented as a confirmed authentication rejection. A readiness display must preserve these distinctions wherever users inspect the environment or choose configurations. **[R137]**

When no supported harness is installed, show an actionable error and prevent local planning and execution. This condition must leave library browsing, template and result ZIP import/export, saved-result access, and reporting from retained results available. Do not turn the absent execution prerequisite into an application-wide failure. When a harness is installed but a selected operation is unusable, communicate the specific prerequisite failure to launch validation rather than describe the installation as absent. **[R029, R137]**

Hardware readiness must distinguish missing tools, insufficient permissions, missing drivers or kernel interfaces, unsupported hardware, and collector failures. These are different causes with different possible remedies. An unavailable sensor or permission failure cannot prevent an otherwise valid benchmark; users can continue with unavailable metrics explicitly identified. Available measurements retain their actual scope through [M18 — Hardware monitoring](18-hardware-monitoring.md). **[R103, R146]**

The Environment view and doctor inspection must provide macOS/Linux installation or setup guidance appropriate to the detected condition, supporting documentation, and a recheck action. Guidance must not suggest that installing a tool resolves unsupported hardware. Collector-specific capability checks and verified platform guidance belong to M18; this module must surface their findings faithfully. Neither inspection nor recheck may automatically install tools or change system permissions. **[R103, R146]**

## Conceptual operation contracts

These contracts define observable inputs and outcomes. The [Implementation](#implementation) section maps them onto the engine component and `environment.*` API fixed by [the architecture decision](ARCHITECTURE.md); the exact probe commands remain adapter details.

| Operation | Input and required outcome |
|---|---|
| Inspect environment | Given the local macOS/Linux environment, report discovery findings for the four named harnesses and readiness findings for models, authentication, runtimes, browser support, and collectors. Include limitations instead of inferring availability. **[R005, R006, R029, R137]** |
| Assess an intended operation | Given the relevant template/configuration prerequisites and discovery findings, expose unmet requirements to the consuming module. Preserve the no-harness planning/execution block while keeping library, exchange, and retained-result functions available. Optional collector deficiencies remain nonblocking. **[R029, R137, R146]** |
| Explain an unavailable capability | Return the affected capability, established cause or unresolved uncertainty, effect on the intended operation, and actionable guidance. For collectors, preserve all five failure distinctions and supporting platform documentation. **[R103, R137]** |
| Recheck | Repeat the relevant readiness inspection after user-managed setup and display the resulting findings. A continuing or newly discovered failure remains explicit; requesting recheck is not permission to install software or change permissions. **[R103]** |

## Dependencies and handoffs

[M04](04-model-catalog.md) supplies model/effort capability and offline-fallback information; [M05](05-harness-execution-isolation.md) supplies supported harness and authentication outcomes; [M18](18-hardware-monitoring.md) supplies collector availability and metric scope. M03 combines their findings into one readiness report, which interfaces present without reinterpreting, and never strengthens unknown findings into verified capabilities. **[R029, R103, R137, R146]**

[M07 — Run configuration](07-run-configuration.md) consumes prerequisite findings for the selected launch. [M15 — TUI](15-terminal-interface.md) exposes the library/default-template and Environment experiences; [M14 — CLI](14-command-line-interface.md) exposes doctor. [M17 — ZIP exchange](17-zip-exchange.md) and [M13 — HTML report](13-standalone-html-report.md) remain reachable when no harness is installed. **[R029, R103, R137]**

## Acceptance criteria

- On both supported operating systems, inspection distinguishes installed and absent instances of all four harnesses and exposes runtime, browser, authentication, model, and collector findings. The library initially offers the inventory benchmark. **[R005, R006, R029]**
- With no supported harness, local planning/execution is blocked with corrective guidance, while library browsing, ZIP exchange, saved-result inspection, and saved-result reporting remain usable. **[R029, R137]**
- Offline, unsupported, authentication-failed, and unknown cases remain distinguishable; executable discovery alone cannot produce a verified authentication or model-support claim. **[R137]**
- Each collector failure category produces appropriate macOS/Linux guidance and documentation in Environment and doctor. Recheck reflects subsequent user changes without installing tools or changing permissions itself. **[R103]**
- Missing sensors, permissions, or collectors leave benchmarking available; unavailable metrics are labeled, and available metrics retain M18's measurement scope. **[R103, R146]**

## Implementation

This section applies [the architecture decision](ARCHITECTURE.md). Everything below is an implementation choice; the product behavior above stays authoritative. Defaults named here (timeouts, file paths) are engineering defaults, not product requirements.

### 1. Engine component

Package `axbenchmark.engine.readiness`. It owns the readiness report: executable discovery for the four named harnesses, runtime and browser checks, and the combination of M05 harness checks, M04 model summaries and M18 collector findings into one report. It never installs software, edits credentials or changes permissions; no port it declares can do so.

**Domain** (`engine/readiness/domain/`, frozen dataclasses and pure functions):

| Type or rule | Content |
|---|---|
| `HarnessId` | Enum in display order: `CLAUDE_CODE`, `CODEX`, `GROK_CLI`, `PI`. M16 uses this order for its planner fallback. **[R006]** |
| `FindingState` | `ESTABLISHED` ✓, `FAILED` ✗, `UNKNOWN` ?, `LIMITED` ▲, `NOT_APPLICABLE` ○, `CACHED` ◷ — the readiness glyph set of the wireframe design system. |
| `Finding` | `state`, `text`, `observed_at`, `source` (`local`, `harness`, `catalog`, `collector`), optional `last_established_at`. |
| `AuthState` | `VERIFIED`, `REJECTED`, `UNKNOWN_OFFLINE`, `UNKNOWN_INCONCLUSIVE`, `NOT_APPLICABLE` (local endpoint), `NOT_CHECKED` (no executable). **[R137]** |
| `CollectorCause` | `MISSING_TOOL`, `INSUFFICIENT_PERMISSION`, `MISSING_DRIVER_OR_KERNEL_INTERFACE`, `UNSUPPORTED_HARDWARE`, `COLLECTOR_FAILURE`. Defined once in [M18](18-hardware-monitoring.md)'s `engine.telemetry.domain` and imported here, so the five-cause vocabulary has one owner. **[R103]** |
| `Host` | OS, OS version, distribution (Linux), architecture, hostname. Only macOS and Linux are accepted. **[R005]** |
| `HarnessReadiness` | Harness, executable path, version, `version_supported` (`True`/`False`/`None`), auth, models summary, headless probe, clean-mode controls, account label (sanitized), usability. |
| `RuntimeReadiness`, `CollectorReadiness` | One row each: Python, Git, Node.js, Playwright for Python, Chromium (Playwright), with "needed for"; collectors as M18 reports them, with cause and scope. |
| `EnvironmentReport` | Host, `checked_at`, the three row groups, model summaries, summary kind, ready count. |
| `classify_auth(check, previous)` | `VERIFIED` only when the harness reported a passing check; `REJECTED` only when it reported a rejection; offline yields `UNKNOWN_OFFLINE` carrying the previous `last_established_at`; a found executable alone yields `UNKNOWN_INCONCLUSIVE`, never `VERIFIED`. **[R137]** |
| `usability(row)` | `USABLE` when the executable is found, the version is not known unsupported, auth is `VERIFIED` or `NOT_APPLICABLE`, and the headless probe is established; `UNUSABLE` when any of these is an established failure; otherwise `UNDETERMINED`. |
| `no_supported_harness(report)` | True when none of the four has a found executable whose version is not known unsupported. **[R029, R137]** |
| `summary_kind(report)` | `READY`, `PARTIAL`, `OFFLINE` (every network-dependent check reported offline), `NO_HARNESS`; plus `ready_count` of 4. |
| `assess(operation, prerequisites, report)` | Returns `Assessment(blocked, unmet)`. `plan` and `execute` are blocked when `no_supported_harness`. Each unmet prerequisite carries its code, cause and remedy; an established failure is `blocking=True`, an unknown is `blocking=False, uncertain=True`, and a collector finding is always `blocking=False`. **[R029, R137, R146]** |
| `diff(previous, current)` | List of `Change(ref, before, after)` for the recheck toast and the `changes` field. **[R103]** |
| `remedy_for(subject, cause, platform)` | Harness and runtime guidance per macOS/Linux with a guide path. Collector guidance is passed through from M18 unchanged; the rule rejects (domain error) any install remedy attached to `UNSUPPORTED_HARDWARE`. **[R103]** |

**Ports** (`engine/readiness/ports.py`, `typing.Protocol`). Ports onto another module are declared here with the minimal shape M03 needs; `composition.py` passes that module's application object when it satisfies the Protocol structurally, or a thin adapter over it in `adapters/` when the shapes differ.

```python
class ToolProbe(Protocol):
    async def locate(self, executable: str) -> Path | None: ...
    async def version(self, path: Path, args: Sequence[str], timeout_s: float) -> ProbeOutcome: ...

class BrowserProbe(Protocol):
    async def playwright(self) -> ProbeOutcome: ...
    async def chromium(self) -> ProbeOutcome: ...

class HostInfo(Protocol):
    def describe(self) -> Host: ...

class HarnessChecks(Protocol):          # adapter over M05's HarnessInspection.probe(harness, executable, version)
    async def check(self, harness: HarnessId, executable: Path, version: str | None) -> HarnessCheck: ...

class ModelSummaries(Protocol):         # adapter over M04's catalog overview
    async def summary(self, harness: HarnessId, version: str | None, account: str | None) -> ModelSummary: ...

class CollectorCapabilities(Protocol):  # satisfied by M18's application interface
    async def detect(self) -> Sequence[CollectorFinding]: ...
    async def guidance(self, metric_ref: str) -> CollectorGuidance: ...

class GuideCatalog(Protocol):
    def harness_guide(self, harness: HarnessId, platform: Platform) -> DocRef: ...
    def runtime_guide(self, runtime: RuntimeId, platform: Platform) -> DocRef: ...

class ReportRepository(Protocol):
    async def load_last(self) -> EnvironmentReport | None: ...
    async def save(self, report: EnvironmentReport) -> None: ...
```

`Clock` and `EventPublisher` come from `engine/shared`.

**Application** (`engine/readiness/application/`):

| Use case | Kind | Behavior |
|---|---|---|
| `InspectEnvironment(scope)` | job | Runs the checks for `scope` (`all`, `harnesses`, `runtimes`, `collectors`, or one harness) concurrently with `asyncio.gather`. Per harness: `ToolProbe.locate` → `ToolProbe.version` → `HarnessChecks.check` → `ModelSummaries.summary`; a timeout or crash of any step becomes an `UNKNOWN` finding naming the step, never a guess. Reports `job.progress` per finished check, merges into the previous report for partial scopes, computes `diff`, saves, then publishes `environment.harness.changed` for each harness whose executable presence or version differs from the previous report, and `environment.report.updated`. A second request while one runs returns the running job's `JobRef`. |
| `GetReport` | query | Returns the last report, the running inspection if any, and capability flags. |
| `ExplainFinding(ref)` | query | Builds the detail for one row: failed, established, unknown and cached items, effect on planning/execution, fix, guide references, and for collectors M18's guidance and the remedies of the other causes. **[R103, R137]** |
| `AssessOperation(operation, prerequisites)` | query | Applies `assess` to the last report. Used in-engine by M07, M16 and M12 through this Protocol, and over the API. |

Application interfaces offered to other engine modules (`engine/readiness/application/interfaces.py`):

```python
class AssessOperation(Protocol):        # M04, M07, M08, M12, M16
    async def assess(self, operation: Operation, prerequisites: Sequence[Prerequisite]) -> Assessment: ...
class ReadinessGate(Protocol):          # M01 configure/create flags, M04 catalog.no_supported_harness
    async def has_supported_harness(self) -> bool: ...          # not no_supported_harness(last report)
class ReadinessReport(Protocol):        # M16 planner candidates
    async def last(self) -> EnvironmentReport | None: ...
class InstalledHarnesses(Protocol):     # M04 catalog contexts, M05 policy matrix, M07 credential presence
    async def list(self) -> Sequence[InstalledHarness]: ...
    # harness, executable path, version, version_supported, providers/endpoints, sanitized account label and
    # non-secret account fingerprint, credential presence by name (never a value); empty when no harness is found
class MachineIdentitySource(Protocol):  # M07 frozen machine record, M17 exported_by
    def current(self) -> MachineIdentity: ...                   # stable machine id, label, host details from HostInfo
```

None of these runs a probe: they read the last saved report, so a caller never triggers an inspection as a side effect.

Triggers: the daemon runs `InspectEnvironment(all)` once at start; the TUI requests one at launch so opening the library inspects the environment (**[R029]**); `doctor` and the recheck bindings request one explicitly. There is no periodic polling. M03 also listens in-engine to `catalog.refresh.finished` and republishes `environment.report.updated` with fresh model summaries, without rerunning probes.

**Adapters** (`engine/readiness/adapters/`):

| Adapter | Implements | Notes |
|---|---|---|
| `subprocess_probe.py` | `ToolProbe` | `shutil.which` and `asyncio.create_subprocess_exec` with an allowlist of read-only arguments (`--version` and equivalents); default timeout 10 s; the process group is killed on timeout. |
| `playwright_probe.py` | `BrowserProbe` | Reads the installed Playwright version from package metadata and checks the Chromium build in the Playwright registry without launching a download. |
| `platform_host.py` | `HostInfo` | `platform`, `/etc/os-release` on Linux, `sw_vers` on macOS. |
| `packaged_guides.py` | `GuideCatalog` | Resolves `docs/harnesses/*.md` and runtime guides shipped with the package. |
| `catalog_summaries.py` | `ModelSummaries` | Maps the contexts of M04's catalog overview (model count, refresh status, account label) to one `ModelSummary` per harness. |
| `json_report_repository.py` | `ReportRepository` | `~/.axbenchmark/environment/last-report.json`, written atomically (temp file and rename). Holds no credentials; account labels are the sanitized labels M05 returns. |
| `rpc.py` | — | Maps `EnvironmentReport`, `Explanation` and `Assessment` to DTOs in `axbenchmark.api.environment`; maps domain errors to the codes below. |

**Persisted state:** only `last-report.json`. It supplies "last verified" times when offline and the baseline for `diff`. **Owned processes:** short-lived version probes only. Authentication and headless probes run under M05's process management; collector probes under M18's.

### 2. API surface (`environment.*`)

DTOs live in `axbenchmark.api.environment`. Every row cell is a `CellDTO(state: FindingState, text: str)`, so interfaces render state and text without computing either.

| DTO | Fields |
|---|---|
| `EnvironmentReportDTO` | `host: HostDTO`, `checked_at: datetime \| None`, `inspection: JobRef \| None`, `summary: SummaryDTO(kind, ready_count, total, headline)`, `harnesses: list[HarnessRowDTO]` (always four, display order), `runtimes: list[RuntimeRowDTO]`, `collectors: list[CollectorRowDTO]`, `models: list[ModelSummaryDTO]`, `capabilities: EnvironmentCapabilities`, `changes: list[ChangeDTO]` |
| `HarnessRowDTO` | `ref`, `harness`, `display_name`, `executable_path \| None`, `version: CellDTO`, `authentication: CellDTO`, `models: CellDTO`, `headless: CellDTO`, `usability`, `remedy \| None` |
| `RuntimeRowDTO` | `ref`, `name`, `status: CellDTO`, `needed_for`, `remedy \| None` |
| `CollectorRowDTO` | `ref`, `name`, `status: CellDTO`, `cause: CollectorCause \| None`, `scope_or_cause`, `remedy \| None` |
| `ModelSummaryDTO` | `harness`, `cell: CellDTO` (count, source live/cache/bundled/endpoint, time, age, provider) |
| `EnvironmentCapabilities` | `can_plan`, `can_execute`, `reason: str \| None` (`environment.no_harness`), `can_recheck` |
| `ExplanationDTO` | `ref`, `title`, `failed`, `established`, `unknown`, `cached` (lists of `CellDTO`), `effect`, `fix \| None`, `commands: CommandsDTO \| None` (text, `verified_for`), `guides: list[DocRefDTO]`, `still_available: list[str]`, `other_causes: list[CauseRemedyDTO]`, `actions: ExplanationActions(can_open_guide, can_open_catalog, can_copy)` |
| `AssessmentDTO` | `operation`, `blocked`, `reason \| None`, `unmet: list[UnmetDTO(subject, code, cause, remedy, blocking, uncertain)]` |

**Queries**

| Method | Request | Response | Errors | Safety |
|---|---|---|---|---|
| `environment.report` | — | `EnvironmentReportDTO` | — | read |
| `environment.explain` | `ref: str` | `ExplanationDTO` | `environment.unknown_ref` | read |
| `environment.assess` | `operation: plan \| execute \| judge`, `prerequisites: list[PrerequisiteDTO]` (harnesses, runtimes, browser) | `AssessmentDTO` | `environment.invalid_operation`, `environment.not_inspected` | read |

**Jobs**

| Method | Request | Result | Errors | Safety |
|---|---|---|---|---|
| `environment.recheck` | `scope: all \| harnesses \| runtimes \| collectors \| harness:<id>` | `JobRef`; `job.finished` carries `EnvironmentReportDTO` with `changes` | `environment.invalid_scope`, `environment.unsupported_platform`, `environment.inspection_failed` | write (updates the stored report only) |

**Events** (topic `environment`)

| Event | Payload |
|---|---|
| `environment.inspection.started` | `JobRef`, `scope` |
| `environment.harness.changed` | `harness`, `version_before \| None`, `version_after \| None`, `found: bool`. Consumed in-engine by M04 to refresh the catalog on a version change. |
| `environment.report.updated` | `EnvironmentReportDTO` including `changes` |

Reason codes used in `unmet` and capability flags, displayed verbatim by interfaces: `environment.no_harness`, `environment.harness_not_found`, `environment.version_unsupported`, `environment.auth_rejected`, `environment.auth_unknown_offline`, `environment.auth_unknown`, `environment.headless_probe_failed`, `environment.runtime_missing`, `environment.browser_missing`, `environment.collector_unavailable`. Data-only methods (`templates.*` browsing, `exchange.*`, `results.*`, `reports.*`) never consult this module, so a missing harness cannot reach them. **[R029, R137]**

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `HarnessInspection.probe(harness, executable, version)` (application interface; M03's `HarnessChecks` port is a thin adapter over it) | M05 | Authentication outcome (verified, rejected with reason, offline, inconclusive, not applicable), headless probe, clean-mode controls, supported-version verdict, sanitized account label. |
| `catalog.overview` (through the `ModelSummaries` adapter) | M04 | Per context (harness, version, target, account): model count, refresh status with source (live, cache, bundled, endpoint), retrieval time and age. |
| `catalog.refresh.finished` | M04 | Republish model summaries after a refresh. M04 in turn consumes `environment.harness.changed`. |
| `CollectorCapabilities` (application interface behind `telemetry.capabilities` / `telemetry.detect`), `CollectorCause` (domain type) | M18 | Collector rows with one of the five causes, scope and collector version. |
| `telemetry.guidance` | M18 | Verified per-platform commands and documentation for a collector finding. |
| `jobs.get`, `jobs.cancel`, `job.progress`, `job.finished`, `events.subscribe`, `engine.hello` | M11 | Job supervision, subscriptions, version negotiation. |

### 4. Screens

Both screens live in `axbenchmark/tui/screens/environment.py`; view models in `axbenchmark/tui/viewmodels/environment.py`.

```python
@dataclass(frozen=True)
class EnvironmentVM:
    summary_glyph: str; summary_text: str; summary_class: str     # #env-summary
    harness_rows: list[RowVM]; runtime_rows: list[RowVM]; collector_rows: list[RowVM]
    model_lines: list[tuple[str, str]]                           # #models-summary
    readiness_strip: list[str]                                   # compact only
    checking: str | None                                         # "Checking 4 harnesses · 2 of 4…"
    toast: tuple[str, str] | None                                # from changes

def build_environment_vm(report: EnvironmentReportDTO, progress: JobProgress | None) -> EnvironmentVM: ...
def build_detail_vm(explanation: ExplanationDTO) -> DetailVM: ...
def build_collector_guide_vm(explanation: ExplanationDTO) -> CollectorGuideVM: ...
```

The view models map `FindingState` to glyph and TCSS class and copy text; they make no readiness decision.

**`EnvironmentScreen(Screen)`** — boards Environment, EnvironmentAuthFailed, EnvironmentRechecked, EnvironmentOffline, EnvironmentNoHarness, EnvironmentCollectors; pushed by F2 from any screen (M15 app binding).

| Aspect | Specification |
|---|---|
| Load | On mount, a worker calls `environment.report`; when the cursor rests on a row, a worker calls `environment.explain(ref)` to fill `#detail-pane` (compact: `#summary`). |
| Subscription | `events.subscribe(["environment"])` on mount, dropped on unmount. `environment.inspection.started` switches `#harnesses` to `#harnesses-loading` only when no report exists yet; otherwise the bar shows progress from `job.progress`. `environment.report.updated` rebuilds the view model and re-explains the selected row. |
| `#env-summary` | `summary.kind` selects glyph and class; `headline`, host and `checked_at` are rendered as given. |
| Tables | `#harnesses` (Harness, Version, Authentication, Models, Headless), `#runtimes` (Runtime, Status, Needed for), `#collectors` (Collector, Status, Scope or cause), `#models-summary`. Row keys are the DTO `ref`s. |
| Detail pane | `DetailVM` sections in the wireframe order: Failed, Established, Unknown (or "Not established here"), Cached, Effect, Fix, `.doc-link`, `.actions`. No-harness shows `still_available`; collectors show `other_causes`. |
| ContentSwitcher | `#harnesses` once a report exists; `#harnesses-loading` while the first inspection runs; `#harnesses-error` when `environment.recheck` fails with a typed error and no report exists (notice text from the error, Recheck button). A single timed-out check is a `?` row with the notice in the detail pane, not the error state. The engine always returns four harness rows, so the no-harness case renders the EnvironmentNoHarness board. |
| Compact | M15 sets `Screen.-compact` below 100×30; `#readiness-strip` and `#summary` are built from the same view model. |
| Toast | After `environment.report.updated` with `changes` from a recheck this client requested: "Recheck complete · N change(s)" with each before → after, and the statement that nothing was installed or changed. **[R103]** |

| Binding | Action | API call |
|---|---|---|
| `esc` | `app.pop_screen` | none |
| `f5` | `recheck` | `environment.recheck(scope="all")`; result arrives through the subscription |
| `enter` | `details` | `environment.explain(ref)` |
| `m` | `catalog` | none; pushes `CatalogScreen`, which loads itself (M04) |
| `d` | `docs` | none; opens the first `guides` entry of the current `ExplanationDTO` |
| `c` | `copy_path` | none; copies `executable_path` or the guide path |
| Button `#recheck` | same as `f5` | `environment.recheck(scope="all")` |

`check_action` dims `d` and `c` from `ExplanationDTO.actions`; `f5` from `capabilities.can_recheck`. The screen never infers authentication, usability or blocking from row text.

**`CollectorGuideScreen(ModalScreen[None])`** — board CollectorGuide (drawn on the M18 page), opened from a `#collectors` row whose explanation has `commands` or guides.

| Aspect | Specification |
|---|---|
| Load | Receives the `ExplanationDTO` of the row; renders `#collector-cause` (host, source, found, cause), `#guide-commands` (`TextArea`, `read_only=True`, only when `commands.verified_for` matches the host), `#guide-links`. |
| Subscription | Shares the parent screen's subscription; on `environment.report.updated` it re-requests `environment.explain(ref)`. |

| Binding | Action | API call |
|---|---|---|
| `esc` | close | none |
| `f5` / Button Recheck | `recheck` | `environment.recheck(scope="collectors")` |
| `c` / Button Copy commands | `copy` | none |
| Button Open guide | open guide | none |

**Consumers elsewhere:** `LibraryScreen` (`#env-bar`, LibraryNoHarness state; M01/M15) reads `environment.report` summary and capabilities and subscribes to `environment`; it dims planning and run actions from `can_plan` / `can_execute`. Setup and launch review (M07) and `PlannerScreen` (M16) show `environment.assess` results and reason codes verbatim.

### 5. CLI

| Command | API |
|---|---|
| `axbenchmark doctor` | `environment.recheck(scope="all")`, streams `job.progress`, prints the resulting report: harness rows, runtimes, collectors with cause and `remedy`, and the summary line. `--json` prints the report DTO. Exit 0 when the inspection ran, whatever it found; 1 on a typed job error; 3 when the engine is unreachable. **[R054, R103]** |
| `axbenchmark doctor --collectors` | `environment.recheck(scope="collectors")`, same output limited to collectors. |
| `axbenchmark` (TUI launch) | `environment.recheck(scope="all")` once at startup. |
| `axbenchmark run …` | Reaches M03 through M07's launch validation, which calls `AssessOperation`; a no-harness launch fails with `environment.no_harness`. |

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain | `classify_auth` never yields `VERIFIED` without a passing harness check; offline yields `UNKNOWN_OFFLINE` with the previous time; `usability` covers each state; `no_supported_harness` for zero, one and unsupported-version installs; `assess` blocks only `plan`/`execute` on no harness and never marks a collector finding blocking; all five causes stay distinct; `remedy_for` rejects install guidance for unsupported hardware; `diff`. |
| Use cases (fake ports) | `InspectEnvironment` with a `FakeToolProbe` (found, absent, timeout), `FakeHarnessChecks` (verified, 401, offline, local endpoint), `FakeModelSummaries` (live, cached, bundled), `FakeCollectorCapabilities` (the Linux and macOS board rows); concurrent recheck returns the running `JobRef`; partial scope keeps other rows; `changes` lists the auth transition; the probe adapter's argument allowlist rejects anything but version queries. |
| API (`InProcessClient`, no interface) | `environment.report`, `explain`, `assess`, `recheck` against fixtures for each board; no-harness fixture: `assess(plan)` and `assess(execute)` return `environment.no_harness` while `templates.list`, `exchange` imports, `results` queries and `reports` generation succeed; offline fixture: auth is `UNKNOWN`, models `CACHED`; events arrive in `seq` order and replay with `since_seq`. |
| Screens (fake client, `Pilot`) | One test per board: rendered rows and `#env-summary` match the fixture; `f5` issues exactly `environment.recheck(scope="all")`; `enter` issues `environment.explain`; `d`/`c` dimmed when the explanation disallows them; loading and error switcher states; compact layout; CollectorGuide `f5` issues `environment.recheck(scope="collectors")`. View-model builders are unit-tested without Textual. |
