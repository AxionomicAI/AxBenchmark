# M03 — Environment discovery and readiness

Status: proposed module specification. This document defines required behavior, not implemented capabilities. It derives from [SPEC.md](../SPEC.md); requirement IDs identify the assigned source contracts.

## Implementation children

Implementers start with one bounded child after its entry conditions are met. [Recommendations](../recommendations.md) finds M03's product behavior aligned; this split resolves foundation ordering (F15) and consumes the shared event/error corrections (F04/F05/F18).

| Child | Completion boundary | Completed prerequisites |
|---|---|---|
| [M03.1 — readiness-service](implementation/M03/01-readiness-service.md) | Inventory, operation gates, consent plan/verification, persistence and `environment.*` through real clients | Bootstrap; M11.1–M11.2 API/jobs foundations |
| [M03.2 — readiness-screens](implementation/M03/02-readiness-screens.md) | Environment and CollectorGuide states, guidance actions and readiness navigation | M03.1; M15.1–M15.2 screen/shell foundations |

These are implementation prerequisites, not claims of completed software. Bootstrap publishes the provider contracts below without importing their runtime adapters. M01/M04/M05/M18 implementations are real-provider gates, not cyclic entry dependencies. M14 owns doctor and M16 owns planner consent UI; parent completion still requires their parity and the cross-platform integrations in both children.

## Purpose and scope

Engineers implementing this module must provide an honest, actionable account of the local prerequisites for planning, execution, verification, and optional measurement. Environment inspection must work on macOS and Linux. It must detect locally installed Claude Code, Codex, Grok CLI, and Pi without assuming that every detected installation is usable for every configuration. **[R005, R006]**

On opening the library, present the inventory benchmark as the default choice while exposing discovered harnesses, model information, authentication readiness, runtimes, browser support, and hardware collectors. Discovery supplies readiness information; the default template choice belongs to the library ([M01](01-template-library-identity.md)) and is presented by the TUI ([M15](15-terminal-interface.md)). **[R029]**

## Required readiness behavior

Report each prerequisite independently, including what was established and what remains unknown. Finding an executable does not establish authentication, model compatibility, supported effort settings, or successful headless operation. Authentication failures must appear as authentication failures; an inconclusive check must remain unknown. Unsupported settings must remain visibly unsupported rather than being silently substituted. Model discovery and offline catalog fallback follow [M04 — Model catalog](04-model-catalog.md), and harness readiness follows [M05 — Headless execution](05-harness-execution-isolation.md). **[R029, R137]**

A harness whose authentication or headless operation cannot be established without a model call remains undetermined until the user asks to verify it. Verification is a separate, consented operation: with the user's explicit consent, it makes one minimal headless call per harness through [M05](05-harness-execution-isolation.md) to confirm login and headless operation, and records each outcome, with its time, in readiness. It never runs as a side effect of opening the library, inspecting, rechecking or planning, and a failed or inconclusive verification stays a failure or an unknown; it is never rounded up to usable. [M16](16-custom-template-planning.md) offers it as "Verify now" when no harness is usable for planning. **[R029, R137]**

Consent is the user's explicit act and is asked with what will happen: the harnesses that would be called, each with its version, and that each makes one minimal model call, which may use budget or subscription usage. This module supplies that list and statement as a verification plan, so every interface asks with the same engine text; the verification itself refuses to run without consent. In the TUI, consent is accepting the shared confirmation dialog of [M15](15-terminal-interface.md); declining calls nothing. In the CLI ([M14](14-command-line-interface.md) owns the details), `doctor --verify` asks a `[y/N]` prompt (default No) on an interactive terminal, `--yes` gives consent without a prompt, and without a terminal and without `--yes` it exits 2 with a message naming `--yes` and calls nothing. No interface sends consent on the user's behalf. **[R054, R137]**

Offline discovery must distinguish unavailable live information from known local findings and cached model information. Cached or bundled catalog entries retain M04's source and age information; they do not prove current account access. Likewise, inability to verify access while offline must not be presented as a confirmed authentication rejection. A readiness display must preserve these distinctions wherever users inspect the environment or choose configurations. **[R137]**

When no supported harness is installed, show an actionable error and prevent local planning and execution. This condition must leave library browsing, template and result ZIP import/export, saved-result access, and reporting from retained results available. Do not turn the absent execution prerequisite into an application-wide failure. When a harness is installed but a selected operation is unusable, communicate the specific prerequisite failure to launch validation rather than describe the installation as absent. **[R029, R137]**

Hardware readiness must distinguish missing tools, insufficient permissions, missing drivers or kernel interfaces, unsupported hardware, and collector failures. These are different causes with different possible remedies. Insufficient permission is reported as such, with the permission fix from M18's collector guide; AxBenchmark has no root or elevated mode, and no guidance suggests running AxBenchmark itself with elevated privileges. An unavailable sensor or permission failure cannot prevent an otherwise valid benchmark; users can continue with unavailable metrics explicitly identified. Available measurements retain their actual scope through [M18 — Hardware monitoring](18-hardware-monitoring.md). **[R103, R146]**

The Environment view and doctor inspection must provide macOS/Linux installation or setup guidance appropriate to the detected condition, supporting documentation, and a recheck action. Guidance must not suggest that installing a tool resolves unsupported hardware. Collector-specific capability checks and verified platform guidance belong to M18; this module must surface their findings faithfully. Neither inspection nor recheck may automatically install tools or change system permissions. **[R103, R146]**

Approved revision files are kept read-only on disk by [M01](01-template-library-identity.md) (files 0444, folders 0555), so accidental edits fail. A full inspection (doctor, recheck of everything, startup) also reports each approved revision folder in which any file or folder no longer has those modes, for example after a backup, sync or cleaning tool or a manual `chmod`. Each finding names the folder, the template name, revision label and SHA-256, the expected and found modes of the deviating entries, and the fix: restore the revision through AxBenchmark (M01's restore), which rewrites the folder read-only from the stored content and re-checks its identity; to remove the template instead, delete it through AxBenchmark, which restores write permission only for the removal. The finding is a warning and never blocks planning or execution: changed modes alone do not change identity, and a launch still recomputes the template SHA-256 and blocks a revision whose content changed (M01). Inspection reads modes only; it never changes them. **[R054, R067]**

## Conceptual operation contracts

These contracts define observable inputs and outcomes. The [Implementation](#implementation) section maps them onto the engine component and `environment.*` API fixed by [the architecture decision](ARCHITECTURE.md); the exact probe commands remain adapter details.

| Operation | Input and required outcome |
|---|---|
| Inspect environment | Given the local macOS/Linux environment, report discovery findings for the four named harnesses and readiness findings for models, authentication, runtimes, browser support, and collectors. Include limitations instead of inferring availability. A full inspection also reports approved revision folders whose read-only modes were changed, with the fix; it never changes a mode. **[R005, R006, R029, R067, R137]** |
| Assess an intended operation | Given the relevant template/configuration prerequisites and discovery findings, expose unmet requirements to the consuming module. Preserve the no-harness planning/execution block while keeping library, exchange, and retained-result functions available. Optional collector deficiencies remain nonblocking. **[R029, R137, R146]** |
| Explain an unavailable capability | Return the affected capability, established cause or unresolved uncertainty, effect on the intended operation, and actionable guidance. For collectors, preserve all five failure distinctions and supporting platform documentation. **[R103, R137]** |
| Recheck | Repeat the relevant readiness inspection after user-managed setup and display the resulting findings. A continuing or newly discovered failure remains explicit; requesting recheck is not permission to install software or change permissions. **[R103]** |
| Plan a verification | Given the harnesses the user asks to verify (by default every installed harness of a supported version), return the harnesses that would be called, with version, the ones excluded and why, and the statement that each makes one minimal model call. Makes no call; interfaces ask for consent with this content. **[R054, R137]** |
| Verify harnesses | Given the user's explicit consent and the harnesses to verify (by default every installed harness of a supported version), make one minimal headless call per harness through M05 and record whether login and headless operation were confirmed, rejected, failed or remained inconclusive. Without consent nothing is called. **[R029, R137]** |

## Dependencies and handoffs

[M04](04-model-catalog.md) supplies model/effort capability and offline-fallback information; [M05](05-harness-execution-isolation.md) supplies supported harness and authentication outcomes; [M18](18-hardware-monitoring.md) supplies collector availability and metric scope. [M01](01-template-library-identity.md) supplies the mode audit of approved revision folders. M03 combines their findings into one readiness report, which interfaces present without reinterpreting, and never strengthens unknown findings into verified capabilities. **[R029, R067, R103, R137, R146]**

[M07 — Run configuration](07-run-configuration.md) consumes prerequisite findings for the selected launch. [M15 — TUI](15-terminal-interface.md) exposes the library/default-template and Environment experiences; [M14 — CLI](14-command-line-interface.md) exposes doctor. [M17 — ZIP exchange](17-zip-exchange.md) and [M13 — HTML report](13-standalone-html-report.md) remain reachable when no harness is installed. **[R029, R103, R137]**

## Acceptance criteria

- On both supported operating systems, inspection distinguishes installed and absent instances of all four harnesses and exposes runtime, browser, authentication, model, and collector findings. The library initially offers the inventory benchmark. **[R005, R006, R029]**
- With no supported harness, local planning/execution is blocked with corrective guidance, while library browsing, ZIP exchange, saved-result inspection, and saved-result reporting remain usable. **[R029, R137]**
- Offline, unsupported, authentication-failed, and unknown cases remain distinguishable; executable discovery alone cannot produce a verified authentication or model-support claim. **[R137]**
- Each collector failure category produces appropriate macOS/Linux guidance and documentation in Environment and doctor. Recheck reflects subsequent user changes without installing tools or changing permissions itself. **[R103]**
- Missing sensors, permissions, or collectors leave benchmarking available; unavailable metrics are labeled, and available metrics retain M18's measurement scope. **[R103, R146]**
- Insufficient collector permission appears as that cause with its permission fix; no guidance in Environment or doctor suggests running AxBenchmark with elevated privileges. **[R103]**
- Without consent, no inspection makes a model call. With consent, verification makes exactly one minimal headless call per selected harness and records each outcome with its time; a rejected login appears as an authentication failure and an inconclusive call stays unknown. **[R029, R137]**
- The TUI asks for verification consent in the confirmation dialog and the CLI in a `[y/N]` prompt, both listing the harnesses from the verification plan and stating that each makes one minimal model call; declining calls nothing. `doctor --verify --yes` calls without a prompt; without a terminal and without `--yes` it exits 2 naming `--yes` and calls nothing. **[R054, R137]**
- After a test makes an approved revision folder or one of its files writable, a full inspection and `doctor` report that folder with template, SHA-256, expected and found modes and the restore fix; the finding blocks nothing, and inspection leaves the modes as found. After the restore, the next inspection reports no finding for it. **[R054, R067]**

## Implementation

This section applies [the architecture decision](ARCHITECTURE.md). Everything below is an implementation choice; the product behavior above stays authoritative. Defaults named here (timeouts, file paths) are engineering defaults, not product requirements.

### 1. Engine component

Package `axbenchmark.engine.readiness`. It owns the readiness report: executable discovery for the four named harnesses, runtime and browser checks, and the combination of M05 harness checks, M04 model summaries, M18 collector findings and M01's revision mode audit into one report. It never installs software, edits credentials or changes permissions; no port it declares can do so.

**Domain** (`engine/readiness/domain/`, frozen dataclasses and pure functions):

| Type or rule | Content |
|---|---|
| `HarnessId` | Enum in display order: `CLAUDE_CODE`, `CODEX`, `GROK_CLI`, `PI`. M16 uses this order for its planner fallback. **[R006]** |
| `FindingState` | `ESTABLISHED` ✓, `FAILED` ✗, `UNKNOWN` ?, `LIMITED` ▲, `NOT_APPLICABLE` ○, `CACHED` ◷ — the readiness glyph set of the wireframe design system. |
| `Finding` | `state`, `text`, `observed_at`, `source` (`local`, `harness`, `verification`, `catalog`, `collector`), optional `last_established_at`. |
| `AuthState` | `VERIFIED`, `REJECTED`, `UNKNOWN_OFFLINE`, `UNKNOWN_INCONCLUSIVE`, `NOT_APPLICABLE` (local endpoint), `NOT_CHECKED` (no executable). **[R137]** |
| `CollectorCause` | `MISSING_TOOL`, `INSUFFICIENT_PERMISSION`, `MISSING_DRIVER_OR_KERNEL_INTERFACE`, `UNSUPPORTED_HARDWARE`, `COLLECTOR_FAILURE`. Defined once in [M18](18-hardware-monitoring.md)'s `engine.telemetry.domain` and imported here, so the five-cause vocabulary has one owner. **[R103]** |
| `Host` | OS, OS version, distribution (Linux), architecture, hostname. Only macOS and Linux are accepted. **[R005]** |
| `HarnessReadiness` | Harness, executable path, version, `version_supported` (`True`/`False`/`None`), auth, models summary, headless probe, clean-mode controls, account label (sanitized), last verification (`VerificationRecord \| None`), usability. |
| `InstalledHarness` | `harness`, `executable_path`, `version`, `version_supported`, `contexts: tuple[AccountObservation, ...]`, `credential_presence: tuple[str, ...]`. `AccountObservation` identifies a provider or configured endpoint, sanitized account label and non-secret fingerprint, and optional observed billing kind (`api`, `subscription`, `unknown`) with its observation time/source. Absence stays unknown; no credential values. This is the Bootstrap-published M03 inventory schema consumed by M04/M05/M07. |
| `VerificationRecord` | Outcome of one consented verification call: `job_id: JobId`, M05 `scope: VerificationScope`, `outcome` (`CONFIRMED`, `AUTH_REJECTED`, `HEADLESS_FAILED`, `OFFLINE`, `TIMED_OUT`), harness version it ran against, `verified_at`, M05 `invocation_id`, message. Preserve the job/scope/identity returned by M05. **[R137]** |
| `apply_verification(row, record)` | `CONFIRMED` sets auth `VERIFIED` and headless `ESTABLISHED` with source `verification`; `AUTH_REJECTED` sets auth `REJECTED`; `HEADLESS_FAILED` sets headless `FAILED`; `OFFLINE` and `TIMED_OUT` leave both unknown (`UNKNOWN_OFFLINE` / `UNKNOWN_INCONCLUSIVE`) and name the cause. A later inspection keeps a verification finding with its `verified_at` until the harness version changes or a non-model status check reports a definite contrary result. **[R137]** |
| `RuntimeReadiness`, `CollectorReadiness` | One row each: Python, Git, Node.js, Playwright for Python, Chromium (Playwright), with "needed for"; collectors as M18 reports them, with cause and scope. |
| `RevisionPermissionFinding` | One approved revision folder whose modes differ from M01's read-only modes: `ref` (`revision:<sha256>`), `folder`, `sha256`, template name and revision label (from M01), `deviations: tuple[ModeDeviation(path, kind: file \| directory, expected_mode, found_mode), ...]` (the first 20), `deviation_count`, `observed_at`, `remedy`. State `LIMITED` ▲, reason `environment.revision_permissions_changed`. **[R067]** |
| `EnvironmentReport` | Host, `checked_at`, installed inventory, the three row groups, revision permission findings (empty when every folder has its modes), model summaries, summary kind, ready count. Revision findings never change `summary_kind` or `ready_count`. |
| `Prerequisite` | Discriminated value `HarnessRequirement(harness)`, `RuntimeRequirement(runtime: RuntimeId)` or `BrowserRequirement(browser: chromium)`. M07/M12/M16 supply the requirements of their selected operation; model/effort compatibility stays M04-owned. `Operation` is `plan`, `execute` or `judge`; `Assessment(blocked, unmet)` retains the exact subject and uncertainty of each requirement. |
| `classify_auth(check, previous)` | `VERIFIED` only when the harness reported a passing check or a `CONFIRMED` verification applies (`apply_verification`); `REJECTED` only when it reported a rejection; offline yields `UNKNOWN_OFFLINE` carrying the previous `last_established_at`; a found executable alone yields `UNKNOWN_INCONCLUSIVE`, never `VERIFIED`. **[R137]** |
| `usability(row)` | `USABLE` when the executable is found, the version is not known unsupported, auth is `VERIFIED` or `NOT_APPLICABLE`, and the headless probe is established; `UNUSABLE` when any of these is an established failure; otherwise `UNDETERMINED`. |
| `no_supported_harness(report)` | True when none of the four has a found executable whose version is not known unsupported. **[R029, R137]** |
| `summary_kind(report)` | `READY`, `PARTIAL`, `OFFLINE` (every network-dependent check reported offline), `NO_HARNESS`; plus `ready_count` of 4. Before an inspection exists, the query projection uses `NOT_INSPECTED`, four unknown harness rows and zero ready, never a claim of absent installations. |
| `assess(operation, prerequisites, report)` | Returns `Assessment(blocked, unmet)`. `plan` and `execute` are blocked when `no_supported_harness`. Each unmet prerequisite carries its code, cause and remedy; an established failure is `blocking=True`, an unknown is `blocking=False, uncertain=True`, and a collector finding is always `blocking=False`. **[R029, R137, R146]** |
| `diff(previous, current)` | List of `Change(ref, before, after)` for the recheck toast and the `changes` field. **[R103]** |
| `revision_remedy(finding)` | Pure. The fix text for a revision finding: "Restore this revision in AxBenchmark (Template → Identity → "Restore files", or `axbenchmark templates restore <sha256> --yes`): it rewrites the folder read-only from the stored content and re-checks its identity. To remove the template instead, delete it in AxBenchmark (`axbenchmark templates delete <sha256> --yes`), which restores write permission only for the removal." It never offers a `chmod`, `sudo` or a remedy that loosens modes. **[R067]** |
| `remedy_for(subject, cause, platform)` | Harness and runtime guidance per macOS/Linux with a guide path. Collector guidance is passed through from M18 unchanged; for `INSUFFICIENT_PERMISSION` it is the permission fix of M18's collector guide. The rule rejects (domain error) any install remedy attached to `UNSUPPORTED_HARDWARE`, and any remedy that runs AxBenchmark with elevated privileges (`sudo axbenchmark …` or a root session): there is no root mode. **[R103]** |
| `verification_targets(report, requested)` | The harnesses a verification may call: the requested ones (default all) that have a found executable whose version is not known unsupported. Empty → `environment.no_harness`. |
| `verification_plan(report, requested)` | Pure. `VerificationPlan(targets, excluded, note)`: `targets` from `verification_targets` with display name, version and executable path; `excluded` the other requested harnesses with their reason (`environment.harness_not_found`, `environment.version_unsupported`); `note` the fixed consent statement "Each listed harness makes one minimal model call to confirm login and headless operation. It may use API budget or subscription usage." Interfaces ask consent with these lines and compose none. **[R054, R137]** |

**Ports** (`engine/readiness/ports.py`, `typing.Protocol`). Bootstrap publishes these shapes and deterministic fixtures before M03.1 starts. Provider-owned vocabulary remains in its owner's domain contract: M01 `RevisionModeDrift`/`ModeDeviation`, M05 `HarnessProbe`/`VerificationOutcome` and verification invocation scope, M18 `CollectorCause`/capability/guidance, and M04 context-scoped catalog summaries. M03's adapters map those public application responses into the minimal types below; there is no cross-module adapter or storage import. Global composition injects the real providers only at their integration gate.

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

class HarnessVerifier(Protocol):        # adapter over M05's HarnessInspection.verify(..., record_dir, job_id=job_id)
    async def verify(self, harness: HarnessId, executable: Path, version: str | None,
                     record_dir: Path, *, job_id: JobId) -> VerificationRecord: ...

class ModelSummaries(Protocol):         # adapter over M04's catalog overview; never refreshes or invokes a model
    async def summary(self, installed: InstalledHarness) -> Sequence[ModelSummary]: ...
    # One per provider/endpoint/account context, retaining exact version, source, time and age.

class CollectorCapabilities(Protocol):  # satisfied by M18's application interface
    async def detect(self) -> Sequence[CollectorFinding]: ...
    async def guidance(self, metric_ref: str) -> CollectorGuidance: ...

class RevisionPermissionAudit(Protocol):  # adapter over M01's RevisionPermissions.audit()
    async def changed(self) -> Sequence[RevisionModeDrift]: ...   # read-only lstat walk; never changes a mode

class GuideCatalog(Protocol):
    def harness_guide(self, harness: HarnessId, platform: Platform) -> DocRef: ...
    def runtime_guide(self, runtime: RuntimeId, platform: Platform) -> DocRef: ...

class ReportRepository(Protocol):
    async def load_last(self) -> EnvironmentReport | None: ...
    async def save(self, report: EnvironmentReport) -> None: ...
```

`Clock`, shared IDs, publication interfaces and `EventPublisher` come from the shared foundation; M11 supplies the real job supervisor and event registry. Environment reports are local host observations, not benchmark results. Verification records use the M11 `JobId`, M05 `VerificationScope(verification_id, harness)` and `InvocationId`; M05 assigns the invocation/verification identifiers and returns the invocation id for retained log lookup. Never invent a `RunUid`, `TrialRef`, task id or benchmark measurement for this diagnostic call. Collector measurement scopes pass through unchanged from M18; model/account contexts never collapse to display names.

**Application** (`engine/readiness/application/`):

| Use case | Kind | Behavior |
|---|---|---|
| `InspectEnvironment(scope)` | job | Runs the checks for `scope` (`all`, `harnesses`, `runtimes`, `collectors`, or one harness) concurrently with `asyncio.gather`. Per harness: `ToolProbe.locate` → `ToolProbe.version` → `HarnessChecks.check` → `ModelSummaries.summary`; a timeout or crash of any step becomes an `UNKNOWN` finding naming the step, never a guess. With scope `all` it also calls `RevisionPermissionAudit.changed()` and builds one `RevisionPermissionFinding` per drifted folder with `revision_remedy`; an audit failure becomes one `UNKNOWN` row naming the step, and other scopes keep the previous revision findings. Reports `job.progress` per finished check, merges into the previous report for partial scopes, computes `diff`, saves, then publishes `environment.harness.changed` for each harness whose executable presence or version differs from the previous report, and `environment.report.updated`. A concurrent request for the same normalized scope returns the running job's `JobRef`; a different scope queues a separate inspection, so an `all` request cannot silently become collectors-only. |
| `GetReport` | query | Returns the last report, the running inspection if any, and capability flags. |
| `ExplainFinding(ref)` | query | Builds the detail for one row: failed, established, unknown and cached items, effect on planning/execution, fix, guide references, and for collectors M18's guidance and the remedies of the other causes; for a revision finding, the deviating entries with expected and found modes, the effect (nothing blocked; launch still checks identity) and `revision_remedy`. **[R067, R103, R137]** |
| `AssessOperation(operation, prerequisites)` | query | Applies `assess` to the last report. Used in-engine by M07, M16 and M12 through this Protocol, and over the API. |
| `PlanVerification(harnesses)` | query | Applies `verification_plan` to the last report. Makes no call and never runs a probe. Empty `targets` raises `environment.no_harness`. **[R054, R137]** |
| `VerifyHarnesses(harnesses, consent)` | job | Refuses with `environment.consent_required` unless `consent` is true. Computes distinct `verification_targets`, then calls `HarnessVerifier.verify` once per target, concurrently, each with a record directory under `~/.axbenchmark/environment/verifications/<job_id>/<harness>/` and keyword `job_id` set to this running job's actual M11 `JobId`. The bridge forwards that same keyword to M05; it never manufactures a run/trial identity or derives identity from a path. Never retries a call. Applies each `VerificationRecord` with `apply_verification`, reports `job.progress` per harness, saves the report, publishes `environment.report.updated` with `changes`. An identical in-flight target request returns that job's `JobRef`; a different set returns `environment.verification_running` without starting or extending calls. **[R029, R137]** |

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

The inventory includes every observed account context and its optional billing reading, so `InstalledHarnesses.list()` can satisfy M04 without fetching catalog data or calling back into inspection. Before the first report, `ReadinessReport.last()` returns `None`; `assess` and verification planning return `environment.not_inspected`. Global planning/execution capabilities remain disabled with that reason until inspection establishes inventory; data workflows remain available.

Readiness report writes (inspection, verification and catalog-summary updates) merge against the latest published report under one serialized publication boundary. A slower partial recheck must not overwrite a newer verification or discard unrelated rows. Publish `environment.report.updated` only after saving the merged report; a save failure returns `environment.inspection_failed` and leaves the previous visible report intact. Individual probe failures instead become explicit rows. M11 owns cancellation and terminal job state; cancellation cleans up owned probes and never retries or resumes a model call automatically. Verification records already produced by M05 remain available even if report publication fails.

Triggers: the daemon runs `InspectEnvironment(all)` once at start; the TUI requests one at launch so opening the library inspects the environment (**[R029]**); `doctor` and the recheck bindings request one explicitly. There is no periodic polling. `InspectEnvironment` never makes a model call; `VerifyHarnesses` runs only on an explicit `environment.verify` with `consent: true`, which an interface sends only after the user's consent to the plan from `environment.verification_plan`: M16's "Verify now" after M15's `ConfirmScreen` returns `True`, and `doctor --verify` after a "yes" at the `[y/N]` prompt or with `--yes` (M14). The engine cannot tell how consent was obtained; this rule binds the interfaces, and their tests check it. M03 also listens in-engine to `catalog.refresh.finished` and republishes `environment.report.updated` with fresh model summaries, without rerunning probes.

**Adapters** (`engine/readiness/adapters/`):

| Adapter | Implements | Notes |
|---|---|---|
| `subprocess_probe.py` | `ToolProbe` | `shutil.which` and `asyncio.create_subprocess_exec` with an allowlist of read-only arguments (`--version` and equivalents); default timeout 10 s; the process group is killed on timeout. |
| `playwright_probe.py` | `BrowserProbe` | Reads the installed Playwright version from package metadata and checks the Chromium build in the Playwright registry without launching a download. |
| `platform_host.py` | `HostInfo` | `platform`, `/etc/os-release` on Linux, `sw_vers` on macOS. |
| `packaged_guides.py` | `GuideCatalog` | Resolves `docs/harnesses/*.md` and runtime guides shipped with the package. |
| `catalog_summaries.py` | `ModelSummaries` | Maps M04's catalog overview to one `ModelSummary` per harness/version/target/account context, retaining model count, refresh status, source, age and sanitized account label. |
| `json_report_repository.py` | `ReportRepository` | `~/.axbenchmark/environment/last-report.json`, written atomically (temp file and rename). Holds no credentials; account labels are the sanitized labels M05 returns. |
| `harness_verifier.py` | `HarnessVerifier` | Thin adapter over M05's `HarnessInspection.verify(..., record_dir, job_id=job_id)`; forwards the actual M11 job identity unchanged and maps `VerificationOutcome` to `VerificationRecord`, preserving its `job_id`, `scope` and `invocation_id`. |
| `revision_audit.py` | `RevisionPermissionAudit` | Thin adapter over M01's `RevisionPermissions.audit()`; M03 never reads `~/.axbenchmark/library/` itself. |
| `rpc.py` | — | Maps `EnvironmentReport`, `Explanation` and `Assessment` to DTOs in `axbenchmark.api.environment`; maps domain errors to the codes below. |

**Persisted state:** `last-report.json`, including each harness's last `VerificationRecord`. It supplies "last verified" times when offline and the baseline for `diff`. Under `verifications/<job_id>/` M05 writes the verification invocation records and logs. **Owned processes:** short-lived version probes only. Authentication, headless and verification calls run under M05's process management; collector probes under M18's.

### 2. API surface (`environment.*`)

DTOs live in `axbenchmark.api.environment`. Every row cell is a `CellDTO(state: FindingState, text: str, source: str, observed_at: datetime | None, last_established_at: datetime | None)`, so interfaces render state, provenance and age without inferring readiness. All `can_*` values, including explanation actions, are the shared `ActionState {enabled, reason}`. Errors use the architecture's numeric JSON-RPC envelope (`-32000`, namespaced `data.code`), decoded identically by socket and in-process clients.

| DTO | Fields |
|---|---|
| `EnvironmentReportDTO` | `object_key: "environment:report"`, `revision: int` (epoch-scoped), `host: HostDTO`, `checked_at: datetime \| None`, `inspection: JobRef \| None`, `verification_job: JobRef \| None`, `summary: SummaryDTO(kind, ready_count, total, headline)`, `harnesses: list[HarnessRowDTO]` (always four, display order), `runtimes: list[RuntimeRowDTO]`, `collectors: list[CollectorRowDTO]`, `revision_permissions: list[RevisionPermissionRowDTO]` (empty when no folder drifted), `models: list[ModelSummaryDTO]`, `capabilities: EnvironmentCapabilities`, `changes: list[ChangeDTO]` |
| `RevisionPermissionRowDTO` | `ref`, `code: "environment.revision_permissions_changed"`, `status: CellDTO` (▲, "Read-only modes changed"), `folder`, `sha256`, `template_name`, `revision_label`, `deviations: list[{path, kind, expected_mode, found_mode}]` (modes as octal strings, e.g. `"0444"`, `"0644"`), `deviation_count`, `remedy` |
| `VerificationPlanDTO` | `targets: list[{harness, display_name, version, executable_path}]`, `excluded: list[{harness, display_name, reason}]`, `note: str` |
| `HarnessRowDTO` | `ref`, `harness`, `display_name`, `executable_path \| None`, `version: CellDTO`, `authentication: CellDTO`, `models: CellDTO`, `headless: CellDTO`, `usability`, `verification: VerificationDTO \| None` (`job_id`, `scope: VerificationScope`, `outcome`, `verified_at`, `invocation_id`, `message`), `remedy \| None` |
| `RuntimeRowDTO` | `ref`, `name`, `status: CellDTO`, `needed_for`, `remedy \| None` |
| `CollectorRowDTO` | `ref`, `name`, `status: CellDTO`, `cause: CollectorCause \| None`, `scope_or_cause`, `remedy \| None` |
| `ModelSummaryDTO` | `harness`, `harness_version`, `target`, `account_fingerprint`, `account_label`, `cell: CellDTO` (count, source live/cache/bundled/endpoint, time and age). One account's cached availability never certifies another's access. |
| `EnvironmentCapabilities` | `can_plan`, `can_execute`, `can_recheck`, `can_verify`: shared `ActionState` values. Global plan/execute gates cover inventory only, not permission to invoke an undetermined selected harness; consumers also apply `environment.assess` and their module's selection rules. Reasons include `environment.not_inspected`, `environment.no_harness` and `environment.verification_running`. |
| `ExplanationDTO` | `ref`, `title`, `failed`, `established`, `unknown`, `cached` (lists of `CellDTO`), `effect`, `fix \| None`, `commands: CommandsDTO \| None` (text, `verified_for`), `guides: list[DocRefDTO]`, `still_available: list[str]`, `other_causes: list[CauseRemedyDTO]`, `actions: ExplanationActions(can_open_guide, can_open_catalog, can_copy)` |
| `AssessmentDTO` | `operation`, `blocked`, `reason \| None`, `unmet: list[UnmetDTO(subject, code, cause, remedy, blocking, uncertain)]` |

**Queries**

| Method | Request | Response | Errors | Safety |
|---|---|---|---|---|
| `environment.report` | — | `EnvironmentReportDTO` | `environment.inspection_failed` (unreadable stored report; offers recheck) | read |
| `environment.explain` | `ref: str` | `ExplanationDTO` | `environment.unknown_ref` | read |
| `environment.assess` | `operation: plan \| execute \| judge`, `prerequisites: list[PrerequisiteDTO]` (harnesses, runtimes, browser) | `AssessmentDTO` | `environment.invalid_operation`, `environment.not_inspected` | read |
| `environment.verification_plan` | `harnesses?: list[HarnessId]` (default: every installed harness of a supported version) | `VerificationPlanDTO` | `environment.no_harness`, `environment.not_inspected` | read (no model call) |

**Jobs**

| Method | Request | Result | Errors | Safety |
|---|---|---|---|---|
| `environment.recheck` | `scope: all \| harnesses \| runtimes \| collectors \| harness:<id>` | `JobRef`; `job.finished` carries `EnvironmentReportDTO` with `changes` | `environment.invalid_scope`, `environment.unsupported_platform`, `environment.inspection_failed` | write (updates the stored report only) |
| `environment.verify` | `consent: bool` (must be true), `harnesses?: list[HarnessId]` (default: every installed harness of a supported version) | `JobRef`; `job.progress` per harness; `job.finished` carries `EnvironmentReportDTO` with `changes` and the `verification` of each called harness | `environment.consent_required`, `environment.not_inspected`, `environment.no_harness`, `environment.verification_running`, `environment.inspection_failed` | write (one model call per harness; the registry description says so) |

**Events** (topic `environment`)

Register this topic with a revisioned `EnvironmentReportDTO` snapshot provider under M11's atomic handoff contract. `environment.report.updated` replaces `environment:report` only at a higher revision. Job start/termination updates the projection's active `JobRef` fields and revision at that same boundary, so a reconnect snapshot cannot miss running work. Started/harness-change events are non-coalescible transitions; report replacements are also delivered without coalescing in this module. Each envelope uses `EventCursor {epoch, seq}`; there is no `since_seq` argument. Job progress/outcomes use M11's `job:<job_id>` topics, not an implicit route through `environment`. Startup tests validate these names, topic routes and consumers. Reconnect/resync follows the shared snapshot replacement rule and rebinds active job subscriptions from the report.

| Event | Payload |
|---|---|
| `environment.inspection.started` | `JobRef`, `scope` |
| `environment.verification.started` | `JobRef`, `harnesses` |
| `environment.harness.changed` | `harness`, `version_before \| None`, `version_after \| None`, `found: bool`. Consumed in-engine by M04 to refresh the catalog on a version change. |
| `environment.report.updated` | `EnvironmentReportDTO` including `changes` |

Reason codes used in `unmet` and capability flags, displayed verbatim by interfaces: `environment.no_harness`, `environment.harness_not_found`, `environment.version_unsupported`, `environment.auth_rejected`, `environment.auth_unknown_offline`, `environment.auth_unknown`, `environment.headless_probe_failed`, `environment.headless_unverified` (headless operation not yet established; `environment.verify` can establish it), `environment.runtime_missing`, `environment.browser_missing`, `environment.collector_unavailable`, `environment.revision_permissions_changed` (an approved revision folder whose read-only modes were changed; never in `unmet` and never blocking). Data-only methods (`templates.*` browsing, `exchange.*`, `results.*`, `reports.*`) never consult this module, so a missing harness cannot reach them. **[R029, R137]**

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `HarnessInspection.probe(harness, executable, version)` (application interface; M03's `HarnessChecks` port is a thin adapter over it) | M05 | Authentication outcome (verified, rejected with reason, offline, inconclusive, not applicable), headless probe, clean-mode controls, supported-version verdict, sanitized account label. No model call. |
| `HarnessInspection.verify(harness, executable, version, record_dir, *, job_id: JobId) -> VerificationOutcome` (application interface; behind `HarnessVerifier`) | M05 | The one minimal headless verification call per harness, linked to the actual M03 verification job and classified as confirmed, auth rejected, headless failed, offline or timed out. |
| `catalog.overview` (through the `ModelSummaries` adapter) | M04 | Per context (harness, version, target, account): model count, refresh status with source (live, cache, bundled, endpoint), retrieval time and age. |
| `catalog.refresh.finished` | M04 | Republish model summaries after a refresh. M04 in turn consumes `environment.harness.changed`. |
| `CollectorCapabilities` (application interface behind `telemetry.capabilities` / `telemetry.detect`), `CollectorCause` (domain type) | M18 | Collector rows with one of the five causes, scope and collector version. |
| `RevisionPermissions.audit() -> Sequence[RevisionModeDrift]` (application interface; behind `RevisionPermissionAudit`) | M01 | Approved revision folders whose files are not 0444 or folders not 0555: SHA-256, folder, template name and label, deviating entries with expected and found modes. Read only. **[R067]** |
| `templates.restore`, `templates.delete` (named in `remedy`, not called) | M01 | The restore fix and the removal path for a revision finding. |
| `telemetry.guidance` | M18 | Verified per-platform commands and documentation for a collector finding; for insufficient permission, the permission fix, never an elevated AxBenchmark command. |
| `jobs.get`, `jobs.cancel`, `job.progress`, `job.finished`, `events.subscribe`, `engine.hello` | M11 | Job supervision, subscriptions, version negotiation. |

### 4. Screens

Both screens live in `axbenchmark/tui/screens/environment.py`; view models in `axbenchmark/tui/viewmodels/environment.py`.

```python
@dataclass(frozen=True)
class EnvironmentVM:
    summary_glyph: str; summary_text: str; summary_class: str     # #env-summary
    harness_rows: list[RowVM]; runtime_rows: list[RowVM]; collector_rows: list[RowVM]
    revision_rows: list[RowVM]                                   # #revision-permissions; empty hides it
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
| Subscription | M15's subscription manager mounts `environment`, installs its snapshot, and follows `job:<job_id>` for each active inspection/verification job. Resume uses the last applied `EventCursor` for the same topic set; adding/removing a job topic uses a new handoff. `environment.inspection.started` switches `#harnesses` to `#harnesses-loading` only when no report exists yet; otherwise the bar shows progress from `job.progress`. Apply only newer report revisions, rebuild the view model and re-explain the selected row; ignore stale explanation responses after selection/unmount. Drop subscriptions on unmount without cancelling engine work. |
| `#env-summary` | `summary.kind` selects glyph and class; `headline`, host and `checked_at` are rendered as given. |
| Tables | `#harnesses` (Harness, Version, Authentication, Models, Headless), `#runtimes` (Runtime, Status, Needed for), `#collectors` (Collector, Status, Scope or cause), `#models-summary`, and `#revision-permissions` (Template, Revision, Folder, Found) under the heading "Approved revisions", shown only when `revision_permissions` is non-empty. Row keys are the DTO `ref`s. A revision row's detail pane shows the deviating entries with expected and found modes, the effect ("Approved files can be edited by accident. Launch still checks identity.") and `remedy` verbatim. |
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
| `c` | `copy_path` | none; copies `executable_path` or the guide path; on a revision row, the folder path |
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

**Consumers elsewhere:** `LibraryScreen` (`#env-bar`, LibraryNoHarness state; M01/M15) reads `environment.report` summary and capabilities and subscribes to `environment`; it dims planning and run actions from `can_plan` / `can_execute`. Setup and launch review (M07) and `PlannerScreen` (M16) show `environment.assess` results and reason codes verbatim. `PlannerScreen`'s "Verify now" action (M16), shown when no harness is usable, calls `environment.verification_plan(harnesses)` and opens M15's `ConfirmScreen` with the plan's harness lines (display name and version) and `note` as the engine's text; only `True` issues `environment.verify(consent=true, harnesses=<plan targets>)`, and `False` or `esc` issues nothing. It follows the job and re-reads its candidates from the updated report. **[R137]** The Environment and CollectorGuide screens render a verification finding like any other cell, with its source and time.

### 5. CLI

| Command | API |
|---|---|
| `axbenchmark doctor` | `environment.recheck(scope="all")`, streams `job.progress`, prints the resulting report: harness rows, runtimes, collectors with cause and `remedy`, each changed approved revision folder as a `▲` line with template, label, folder, expected and found modes and `remedy`, and the summary line. `--json` prints the report DTO. Exit 0 when the inspection ran, whatever it found; 1 on a typed job error; 3 when the engine is unreachable. **[R054, R103]** |
| `axbenchmark doctor --collectors` | `environment.recheck(scope="collectors")`, same output limited to collectors. An insufficient-permission row prints the permission fix from M18's guide; no line suggests running AxBenchmark with `sudo` or as root. **[R103]** |
| `axbenchmark doctor --verify [--harness H …] [--yes]` | With `--yes`: `environment.verify(consent=true, harnesses)` without a prompt. Without `--yes` on an interactive terminal: `environment.verification_plan(harnesses)`, then a `[y/N]` prompt (default No) listing the plan's harnesses and its `note`; "yes" sends `environment.verify(consent=true, harnesses)`, anything else prints "No verification call was made." and exits 0. Without `--yes` and without a terminal: exit 2 with a message naming `--yes`, nothing sent. Streams `job.progress` and prints each harness's verification outcome and the resulting report. Prompt wording, stdin handling and exit codes are M14's. **[R054, R137]** |
| `axbenchmark` (TUI launch) | `environment.recheck(scope="all")` once at startup. |
| `axbenchmark run …` | Reaches M03 through M07's launch validation, which calls `AssessOperation`; a no-harness launch fails with `environment.no_harness`. |

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain | `classify_auth` never yields `VERIFIED` without a passing harness check or a `CONFIRMED` verification; `apply_verification` maps each outcome, keeps `OFFLINE`/`TIMED_OUT` unknown and is superseded by a version change; `verification_targets` excludes absent and unsupported-version harnesses; `verification_plan` lists the targets with version, the excluded ones with their reason, and the fixed `note`; `revision_remedy` names restore and delete and never a `chmod` or `sudo` command; `remedy_for` rejects a remedy that runs AxBenchmark with elevated privileges; offline yields `UNKNOWN_OFFLINE` with the previous time; `usability` covers each state; `no_supported_harness` for zero, one and unsupported-version installs; `assess` blocks only `plan`/`execute` on no harness and never marks a collector finding blocking; all five causes stay distinct; `remedy_for` rejects install guidance for unsupported hardware; `diff`. |
| Use cases (fake ports) | `InspectEnvironment` with a `FakeToolProbe` (found, absent, timeout), `FakeHarnessChecks` (verified, 401, offline, local endpoint), `FakeModelSummaries` (live, cached, bundled), `FakeCollectorCapabilities` (the Linux and macOS board rows); concurrent recheck returns the running `JobRef`; `InspectEnvironment` never calls `FakeHarnessVerifier`; `VerifyHarnesses` without consent calls nothing and raises `environment.consent_required`, and with consent calls the fake verifier exactly once per target (confirmed, 401, offline) and records each outcome with its time; `PlanVerification` calls no verifier and no probe; `InspectEnvironment(all)` with a fake `RevisionPermissionAudit` returning one drifted folder yields one `LIMITED` revision finding with `environment.revision_permissions_changed` and leaves `summary_kind` and `assess` unchanged, a failing audit yields one `UNKNOWN` row, and `InspectEnvironment(collectors)` keeps the previous revision findings without calling the audit; partial scope keeps other rows; `changes` lists the auth transition; the probe adapter's argument allowlist rejects anything but version queries. |
| API (`InProcessClient`, no interface) | `environment.report`, `explain`, `assess`, `recheck` against fixtures for each board; no-harness fixture: `assess(plan)` and `assess(execute)` return `environment.no_harness` while `templates.list`, `exchange` imports, `results` queries and `reports` generation succeed; offline fixture: auth is `UNKNOWN`, models `CACHED`; `environment.verify(consent=false)` returns `environment.consent_required`; `environment.verification_plan` returns the plan and the fake verifier records no call; with a composed M01 library on a temporary home, `chmod u+w` on one file of an approved revision makes `environment.recheck(scope="all")` report that folder with found mode `0644`, the file's mode is unchanged afterwards, and after `templates.restore` the next recheck reports none; insufficient-permission collector rows carry the permission fix and no `sudo axbenchmark …` remedy; typed error parity holds over both clients; inject a report change during snapshot collection, replay an older report, restart the epoch and overflow the queue: shared cursor/revision rules prevent lost or stale state. |
| Screens (fake client, `Pilot`) | One test per board: rendered rows and `#env-summary` match the fixture; `f5` issues exactly `environment.recheck(scope="all")`; `enter` issues `environment.explain`; `d`/`c` dimmed when the explanation disallows them; loading and error switcher states; compact layout; CollectorGuide `f5` issues `environment.recheck(scope="collectors")`; a report with `revision_permissions` renders `#revision-permissions` and one without hides it. PlannerScreen "Verify now" (M16 fixture): issues `environment.verification_plan`, opens `ConfirmScreen` with the plan's lines; `False` issues no `environment.verify`, `True` exactly one with `consent=true`. View-model builders are unit-tested without Textual. |
