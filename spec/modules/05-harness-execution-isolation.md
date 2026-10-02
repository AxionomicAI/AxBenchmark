# M05 — Headless harness execution and isolation

Status: proposed requirements derived from [SPEC.md](../SPEC.md), not a description of implemented behavior.

## Purpose and boundary

This module enables engineers to implement comparable, unattended planner, competitor, and judge invocations through supported locally installed harnesses. Every model invocation runs headlessly. Configured cloud providers and local model endpoints are usable through harnesses that support them; endpoint location does not change the execution protocol. These contracts prescribe observable behavior, not harness switches or a supported version matrix. Code structure follows the [headless engine architecture](ARCHITECTURE.md): execution and isolation live in the engine, and interfaces only observe them; see [Implementation](#implementation). [R010, R012]

## Implementation sequence

The following children are proposed implementation work, not completed software. Follow the [foundation dependency contract](ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries); Bootstrap publishes shared contracts before any child starts.

| Child | Owned acceptance boundary | Completed implementation prerequisites |
|---|---|---|
| [M05.1 — process-runtime](implementation/M05/01-process-runtime.md) | Process lifetime, drainage, scoped durable records, cancellation and recovery | Bootstrap; M11.1–M11.2 |
| [M05.2 — isolation-observation](implementation/M05/02-isolation-observation.md) | Semantic baseline restoration, policy/resources, snapshots and passive observations | M05.1; M01.1–M01.2 |
| [M05.3 — claude-adapter](implementation/M05/03-claude-adapter.md) | Claude Code contract and installed-version evidence | M05.1–M05.2 |
| [M05.4 — codex-adapter](implementation/M05/04-codex-adapter.md) | Codex contract and installed-version evidence | M05.1–M05.2 |
| [M05.5 — grok-adapter](implementation/M05/05-grok-adapter.md) | Grok CLI contract and installed-version evidence | M05.1–M05.2 |
| [M05.6 — pi-adapter](implementation/M05/06-pi-adapter.md) | Pi contract and installed-version evidence | M05.1–M05.2 |
| [M05.7 — adapter-views-integration](implementation/M05/07-adapter-views-integration.md) | API/views and four-adapter macOS/Linux integration | M05.3–M05.6; M03.1; M04.2; M15.1–M15.2 |

Later M02/M07/M08/M10/M11/M12/M16 providers are injected through Bootstrap-published Protocols until their integration gates. Parent acceptance requires real lifecycle/retention integrations and current official-documentation plus installed-version/platform checks for every adapter; transcript fixtures alone do not establish support. Findings **F06, F09, F10** are resolved below, with the shared F04/F05/F18 transport contracts.

## Invocation behavior

Each competitor task starts a fresh process and conversation. Supply the shared approved specification and that task's prompt; do not resume or replay an earlier task's conversation. The configuration's workspace files carry state between tasks. Every configuration receives the same approved sequence, including final QA when present. Cloud and local configurations receive equal opportunities to implement, verify, and fix their work. [R069, R140]

Planner requests carry the planning inputs defined by [M16](16-custom-template-planning.md). Judge requests carry the artifact and evidence defined by [M12](12-quality-judging.md), including its fresh-session requirement. Their distinct payloads do not create exceptions to headless execution. Planner and competitor requests always name an explicit model; a harness's own default model is only a preselection offered by [M04](04-model-catalog.md). [R012]

Readiness inspection and catalog discovery make no model call. The harness's own default model is read from its configuration or status output, never by invoking a model. The only readiness model call is the verification requested with the user's consent through [M03](03-environment-readiness.md): one minimal headless invocation per harness, with a fixed minimal prompt, no file access and a short deadline, that confirms login and headless operation and reports confirmed, authentication rejected, headless failed, offline or timed out. It produces no benchmark data. [R029, R137, R152]

Honor the selected harness, provider, model, and effort. Explicit effort choices must be known supported choices supplied by [M04](04-model-catalog.md). Unknown effort support permits a harness-default choice: omit an explicit effort argument instead of guessing a value or supported list. Preserve requested settings separately from effective settings exposed by the harness. Unexposed effective effort remains unverified; successful process startup does not verify it. A failed request must not silently switch models. [R010, R065]

## Environment and baseline contract

Each configuration starts from an independent copy of the same packaged baseline. M01’s hashed `BaselineFile(path, executable)` declaration controls restoration: strip exactly `baseline/`, write regular files as `0644` or `0755` according to the flag, and directories as `0755`. Approved files remain `0444` and approved directories `0555`; neither their physical modes nor ZIP permissions determine executable intent. Reject unsafe/colliding paths, symlinks and unsupported file kinds before provisioning. [F10] For existing-repository templates, M16 captures the selected committed revision, defaulting to HEAD, explains that uncommitted changes are excluded, and leaves the original repository untouched. Execution, including later runs and imported templates, consumes that packaged snapshot; it never resolves HEAD or another moving branch again. Existing sources and historical benchmark applications, results, and reviews remain untouched. [R068, R140]

Provide independent workspaces, service ports, test data, and browser contexts for configurations, including different configurations of the same harness. Configure headless permission handling before launch. A blocked action must produce an explicit outcome, never an unanswered prompt that hangs execution. Isolation applies during both parallel and sequential scheduling. [R072, R138]

Clean mode is the default. Retain required authentication and provider access while disabling personal instructions, memories, plugins, hooks, and MCP integrations through supported controls. Preserve native harness behavior; do not selectively block a harness's native capabilities as an undocumented comparison adjustment. Record managed settings and isolation limitations. When clean mode cannot be established, explain the limitation explicitly and never silently fall back to current mode or describe incomplete isolation as clean. [R070]

Current mode uses the user's existing harness configuration, with explicit benchmark model and effort selections taking precedence. Record a sanitized description or fingerprint of relevant settings so readers can identify the configured harness being measured without exposing credentials. Current mode must be an explicit selected policy. [R065, R071]

## Conceptual request and result contracts

These are information contracts. [Implementation](#implementation) maps them to engine domain types and API models; the product requirement is the information, not a particular field layout.

| Contract | Required information and behavior |
|---|---|
| Invocation request | Role; explicit `TrialRef`/`ResultId` and task identity for competitor or retained-artifact work; role-specific identity for planning/diagnostics; approved role-specific inputs; selected harness/provider/model/effort; environment policy; configuration workspace and runtime resources; preconfigured permission behavior. The caller supplies frozen selections from [M07](07-run-configuration.md). [R010, R012, R065, R069, R072] |
| Established environment | Packaged baseline identity, independent resources, selected clean/current policy, sanitized relevant settings, and managed or isolation limitations. State what was established rather than implying unsupported guarantees. [R068, R070, R071, R072] |
| Live observation | While a task process runs, expose what the harness makes observable: workspace changes, actions, reasoning or reasoning summaries (identified as summaries), output stream timing for a measured output rate, and context use when the harness or endpoint reports it. Values a harness does not expose remain unavailable. Observation is passive: it sends no input to the process and does not change its permissions, timing, or outputs. [R044, R047] |
| Invocation result | Process outcome and diagnostic evidence, requested settings, observable effective settings, environment description, logs, and artifact/snapshot references. Keep unavailable effective settings explicit. Supply process ownership and lifecycle observations needed for cleanup and persistence. [R065, R137, R138] |

Process results are separate from executable acceptance outcomes owned by [M08](08-verification-evidence.md), measurements owned by [M10](10-measurements-cost.md), and quality reviews owned by M12. A zero exit status alone does not establish task success. Cost appears in an invocation result only with its raw harness observation and documented currency provenance: an explicit harness currency or a version-applicable documented adapter contract. Missing provenance leaves currency/usable reported cost unknown; never guess USD from a number, symbol, provider or model. M05 never prices or converts the amount; pricing and accounting belong to M04/M10.

## Failures and lifecycle integration

[M03](03-environment-readiness.md) and M04 provide readiness and capability evidence. With no supported harness installed, prevent local planning/execution and surface an actionable error while retaining library browsing, import/export, and saved-result access. Preserve honest distinctions between discovery, cached or bundled offline information, unsupported settings, and authentication failures; discovery is not proof of successful authentication. [R137]

[M11](11-run-orchestration.md) schedules one configuration per selected harness concurrently by default, up to four; additional configurations within each harness and tasks within a configuration run sequentially. M05 must also support the sequential setting and fully specified unattended launches from [M14](14-command-line-interface.md). Interface detachment or closure does not terminate invocation processes, and reconnecting observes existing work without restarting tasks. Explicitly stopping a configuration or benchmark cleans up its child processes and application services. An in-run `IdentityMismatch` propagates to M11’s `RunInvalidationCoordinator` with the original identity check and source; it is never an ordinary process failure, failed check or invalid judge response. Drain and preserve partial evidence during the coordinator’s cleanup/finalization barrier. Report other failures, interruption, and cleanup outcomes to persistent lifecycle state; apply M11's continuation and timeout rules. [R138]

## Acceptance criteria

- Planner, competitor, and judge invocations complete or fail without interactive sessions. Cloud and local endpoint configurations follow the same approved task and QA sequence. [R010, R012, R069, R138]
- Two successive tasks use distinct processes and conversations; the second receives shared specification, current prompt, and accumulated workspace files. Two configurations start from equivalent independent baseline copies. [R068, R069, R140]
- Unknown effort support produces no explicit effort argument. Requested and exposed effective values remain distinguishable, and failures never substitute another model. [R065]
- Clean mode disables all listed personal integration categories through supported controls, preserves authentication/native behavior, and reports limitations. Current mode honors explicit model/effort overrides and retains sanitized settings evidence. [R070, R071]
- Concurrent configurations cannot share application ports, mutable test data, or browser contexts. Blocked permissions return explicit outcomes without pending prompts. [R072]
- Parallel defaults, additional configurations, sequential mode, unattended execution, detach/reconnect, and explicit-stop cleanup satisfy M11/M14 integration behavior. Missing harnesses block execution while data-only functions remain available. [R137, R138]
- A later or imported run restores equal-byte regular/executable baseline files with their distinct semantic modes while approved storage stays read-only; advancing the original branch does not change the run. [R068, R115, R119, R140; F10]
- Historical configuration, log, diff, evidence and snapshot requests require explicit `TrialRef` or `ResultId`; no missing trial silently selects the latest. Diagnostic verification uses `JobId`, `VerificationScope` and `InvocationId`, never a fabricated run/trial. [R076–R078, R134, R154; F06]
- A baseline/revision mismatch during any in-run M05 read reaches the run invalidation coordinator, retains its digests/paths and triggers cleanup of the whole run, including active judging. [R067, R153; F09]

## Implementation

This section applies the [headless engine architecture](ARCHITECTURE.md). It records implementation decisions; the requirements above remain the product contract. Names of paths, environment variables and constants below are proposed implementation choices. No runtime tests or supported harness versions are claimed by this document.

### 1. Engine component

Package `axbenchmark.engine.harness`. M05 never decides when work runs: [M11](11-run-orchestration.md) schedules competitor tasks, [M16](16-custom-template-planning.md) starts planner invocations and [M12](12-quality-judging.md) starts judge invocations, all through the application interfaces below. M05 owns the harness process, its isolated environment, its live observation stream and its cleanup.

#### Domain (`engine/harness/domain/`)

Frozen dataclasses and enums; no I/O, no asyncio.

| Type or rule | Content |
|---|---|
| `HarnessId` | Enum `claude_code`, `codex`, `grok_cli`, `pi`. Display order follows SPEC: Claude Code, Codex, Grok CLI, Pi. |
| `Role` | Enum `planner`, `competitor`, `judge`, `verification` (M03's consented readiness call; no benchmark data). [R012] |
| `InvocationScope` | Union of `TaskScope(trial: TrialRef, result_id: ResultId, task_id, task_index, task_title)`, `PlanningScope(session_id, step)`, `JudgingScope(review_id, result_id: ResultId, trial: TrialRef, artifact_label)`, `VerificationScope(verification_id, harness)`. Every invocation record, event and log line carries the matching scope and `InvocationId`. Result/trial bindings must agree before any write; labels are display only. Diagnostic records additionally carry their M03 `JobId`, never a `RunUid` or `TrialRef`. |
| `EffortSelection` | `Explicit(value: str, supported: tuple[str, ...])` or `HarnessDefault()`, both taken from the frozen M07 launch record with the M04 evidence frozen in it. |
| `effort_argument(sel) -> str \| None` | `HarnessDefault` → `None` (no effort argument at all). `Explicit` whose value is not in `supported` → `EffortNotSupported`; the value is never guessed or replaced. [R065] |
| `RequestedSettings` | harness, installed version, executable path, provider or endpoint, account context reference, model, `EffortSelection`, catalog source (`override`, `discovered`, `bundled`). Exactly one model; there is no fallback field. [R010, R065] |
| `Observed[T]` | `value: T \| None`, `status` (`verified`, `unverified`, `unavailable`), `source` (`process`, `harness_report`, `harness_log`, `endpoint`, `measured_stream`, `not_exposed`). Output rate/context and effective-setting display projections use `Observed`; domain effective settings use M04’s vocabulary below. Successful startup never produces `verified` for effort. [R044, R065] |
| `EffectiveSettings` | Uses M04 `EffectiveSetting` for each requested/effective setting, with provenance alongside it: `OBSERVED` only from exposed evidence, `UNVERIFIED` when requested but unconfirmed, `UNKNOWN` when unavailable. Observation DTOs map these to `Observed` display states without strengthening evidence. |
| `EnvironmentPolicy` | Enum `clean` (default), `current`. [R070, R071] |
| `IntegrationCategory` / `ControlStatus` | Categories `instructions`, `memories`, `plugins`, `hooks`, `mcp`. Status `disabled` (✓), `absent` (○, the harness has none), `cannot_disable` (✗). |
| `CleanAssessment` | Per harness and version: status per category, `establishable` (true only when no category is `cannot_disable`), cause and sanitized evidence (`found`), managed settings description, limitations. Rule `assess_clean(controls) -> CleanAssessment`. There is no rule that turns an unestablishable clean policy into `current`. [R070] |
| `SettingsFingerprint` | Sanitized description of relevant current-mode settings plus a SHA-256 over their canonical form. Rule `sanitize(raw) -> SettingsFingerprint` drops credential-shaped keys and values before hashing; the raw view never leaves the adapter layer. [R071] |
| `PortRange` / `ResourceAllocation` | Per `TrialRef` (or explicit non-benchmark environment scope): workspace path, port range, test data path, browser context id and profile path, baseline SHA-256. Rule `overlaps(a, b)`; an allocation that overlaps a live one is rejected. [R072] |
| `PermissionProfile` | Role-specific allowed/protected roots and actions. Competitors may write inside their workspace, test data and temp dir and bind inside their port range. Judges have protected read-only artifact/input roots; writes are limited to distinct scratch and engine-owned record roots. Deny protected-root repairs, writes and traversal/symlink escapes. Failure to establish these protections blocks launch; the competitor writable-workspace default never applies to a judge. Rule `decide(action) -> PermissionDecision(allowed \| blocked, reason)` for actions the adapter can observe. [R072] |
| `EnvironmentSpec` | What `establish` is given: a scope (`TrialEnvironment(trial: TrialRef, result_id: ResultId)` for competitors, `PlanningScope` or `JudgingScope`), the role-specific source (competitor packaged baseline from a registered revision; M16 unregistered `BaselineSnapshot` carrying validated semantic entries; judge delivered `SnapshotRef` and protected roots from the constructor below), the frozen entry (harness, policy) and the record directory. A competitor environment is established once per trial from a fresh copy of the packaged baseline; two trials never share a workspace, ports, test data or browser profile. [R068, R077] |
| `EstablishedEnvironment` | Role/source identity (baseline or delivered artifact), protected/readable/writable roots and established protection evidence, `ResourceAllocation`, policy, `CleanAssessment` or `SettingsFingerprint`, managed settings, limitations, permission profile summary. States what was established, nothing more. [R068, R070, R071, R072] |
| `InvocationRequest` | `InvocationId` allocated before spawn, `Role`, `InvocationScope`, `RequestedSettings`, inputs (`CompetitorInputs(spec_path, prompt_path)`, or the opaque planner/judge payload paths from M16/M12), `EstablishedEnvironment`, deadline, record directory. Constructing a competitor request with a conversation or session id from an earlier task is impossible: the type has no such field. [R069] |
| `HarnessSignal` | Union produced by adapters from process output: `ActionObserved(kind, summary, paths)`, `ReasoningObserved(text, is_summary)`, `OutputDelta(tokens: int \| None)`, `ContextReported(used, limit)`, `SettingObserved(name, value)`, `PermissionObserved(action, decision, reason)`, `UsageReported(input, cached, output, reasoning, cost: ReportedCost \| None, cumulative: bool, final: bool)` (`final` when the adapter saw the harness's terminal usage record), `RetryObserved(reason)`, `LogLine(source, text)`. |
| `ReportedCost` | Raw sanitized amount/record reference; parsed `amount_decimal: str \| None` (never a float); `currency: str \| None`; `currency_source: explicit_harness \| documented_adapter_contract \| unknown`; currency evidence reference. An adapter-contract source includes official source/version applicability. Without explicit/documented provenance currency remains unknown and no usable reported charge is asserted; retain the raw observation for M10. |
| `OutputRateMeter` | Pure accumulator: output tokens per second over the last second. Uses a harness-reported rate when present, else `OutputDelta.tokens` from the stream (`source=measured_stream`); with neither, the rate is `unavailable`, never estimated. [R044] |
| `ExitClassification` | `outcome` (`exited`, `launch_failed`, `model_rejected`, `auth_failed`, `config_failed`, `timed_out`, `stopped`), exit code, blocked action count, harness message. A zero exit is `exited`, not task success. [R065, R137, R138] |
| `InvocationResult` | `InvocationId`, scope, stable process-outcome/evidence operation IDs, requested and effective settings, `ExitClassification`, start/end timestamps and process duration, pid and process group, environment reference, log path, start and end workspace snapshot references, usage reports as received. Process identifiers are absent when spawn never occurred; snapshot references are explicit unavailable values when no workspace snapshot exists. [R065, R137, R138] |
| `CleanupReport` | Processes ended, services ended, ports released, browser context disposed, each with outcome; incomplete cleanup is reported as such. [R138] |
| `DefaultModelReading` | `model_id`, `observed_from` (`harness_config` with the file it came from, or `status_output` with the non-model command), `read_at`. Produced only by `HarnessAdapter.default_model`; absent when the harness reveals none. [R061] |
| `VerificationOutcome` | `job_id: JobId`, `scope: VerificationScope`, `outcome` (`confirmed`, `auth_rejected`, `headless_failed`, `offline`, `timed_out`), `invocation_id`, harness version, observed model (`Observed[str]`, harness default since no model argument is passed), policy used, duration, message. `classify_verification(exit, signals)`: `confirmed` only when the exit is `exited` and the harness produced a model response (a parsed reply or final usage record); `auth_failed` → `auth_rejected`; `model_rejected`, `config_failed`, `launch_failed` or `exited` without a response → `headless_failed`; `timed_out` → `timed_out`, or `offline` when the adapter recognised a network failure. The reply content is not graded. [R137] |

Domain errors: `EffortNotSupported`, `CleanModeUnavailable(assessments)`, `ResourceConflict`, `HarnessNotInstalled`, `UnsupportedHarness`, `ScopeMismatch`, `UnsafeWorkspacePath`, `PersistenceFailed`, `InvocationConflict`, `JudgeProtectionUnavailable`. M01 `IdentityMismatch(check)` is propagated unchanged to the owning run operation and coordinator, outside exit classification.

The judge factory is part of the same M05 environment contract; M12 supplies the materialized delivered artifact, never a competitor baseline or live workspace:

```python
EnvironmentSpec.judge(scope: JudgingScope, artifact: SnapshotRef, artifact_root: Path,
                      input_root: Path, scratch_root: Path, settings: RequestedSettings,
                      policy: EnvironmentPolicy, record_dir: Path) -> EnvironmentSpec
```

`artifact_root` and `input_root` are protected read-only; scratch and engine-owned record roots are disjoint from them and are the only writable roots. Establish supported protections before invoking through the existing `HarnessExecution.establish/invoke/release/stop_invocation` path. If protection is unavailable, return `harness.judge_protection_unavailable` before spawn; never repair or substitute the authoritative artifact, silently relax protection, or create a private M12 process API.

#### Ports (`engine/harness/ports.py`)

```python
class HarnessAdapter(Protocol):
    harness: HarnessId
    def exposure(self, version: str) -> ExposureProfile: ...          # effort, reasoning (none|summary|full), context, rate, usage
    def clean_controls(self, version: str, settings: UserSettingsView) -> CleanControls: ...
    def relevant_settings(self, settings: UserSettingsView) -> RawSettings: ...  # input to domain sanitize()
    def managed_config(self, req: InvocationRequest) -> ManagedConfig: ...       # files for the managed config dir
    def launch_spec(self, req: InvocationRequest, managed_dir: Path) -> LaunchSpec: ...
    def parse(self, record: OutputRecord) -> Sequence[HarnessSignal]: ...
    def classify_exit(self, exit: ProcessExit, tail: Sequence[HarnessSignal]) -> ExitClassification: ...
    def auth_status_spec(self) -> LaunchSpec | None: ...                # non-model status command, if the harness has one
    def default_model(self, settings: UserSettingsView, status: Sequence[OutputRecord] | None) -> DefaultModelReading | None: ...
    # from the harness's configuration or the status command's output; never a model call
    def verification_spec(self, version: str, workspace: Path, managed_dir: Path | None) -> LaunchSpec: ...
    # fixed minimal prompt, headless mode, no model and no effort argument, every tool permission denied

class ProcessRunner(Protocol):
    async def spawn(self, spec: LaunchSpec) -> ProcessHandle: ...      # new session/process group, stdin=/dev/null

class ProcessHandle(Protocol):
    pid: int; pgid: int; process_start: str
    def records(self) -> AsyncIterator[OutputRecord]: ...             # stdout/stderr, timestamped
    async def wait(self) -> ProcessExit: ...
    async def terminate_tree(self, grace: timedelta) -> TreeTermination: ...
```

| Port | Purpose |
|---|---|
| `HarnessAdapter` | One implementation per harness; translates between domain requests/signals and that harness's CLI. Adapters do no I/O themselves, so they are tested against recorded transcripts. |
| `ProcessRunner`, `ProcessHandle` | Spawn the harness in its own process group with closed stdin, stream output, wait, terminate the tree. |
| `ServiceSweeper` | Find and end escaped services only after checking recorded ownership (pid/start identity and allocation lineage); a port or working directory alone is insufficient to kill a process. Used by stop and cleanup. [R138] |
| `HarnessSettingsReader` | Read-only `UserSettingsView` of a harness's user configuration locations, for clean assessment and current-mode fingerprints. Never writes user files. [R070, R071] |
| `ManagedConfigWriter` | Write the managed configuration directory used in clean mode (and the permission rules used in both modes). [R070, R072] |
| `WorkspaceProvisioner` | Restore only validated M01 semantic baseline entries into a fresh workspace, never `copytree` approved physical modes; copy test data; record workspace tree identity at task start and exit. [R068, R140] |
| `PortAllocator` | Reserve and release a non-overlapping `PortRange` per configuration; verifies free ports by bind probe. [R072] |
| `BrowserContextProvisioner` | Create and dispose the per-configuration browser profile and context id. [R072] |
| `WorkspaceWatcher` | Stream file changes in a workspace for the live view and compute a file diff against the task's start snapshot. [R044] |
| `InvocationObservationSink` | `accept(invocation_id, entry_id, scope, fact) -> ObservationReceipt`; await accepted competitor usage/exit facts and M10’s durable `{observation_id, payload_digest}` receipt. |
| M18 `ProcessTracking` | Inject its published application interface unchanged: await `started(scope: TaskScope, invocation_id: InvocationId, pid: int, pgid: int, process_start: str) -> None` and `exited(scope: TaskScope, invocation_id: InvocationId) -> None`; never deliver through the public event queue. |
| `InvocationStore` | Persist scoped invocation records, environments, cleanup reports and append-only logs durably before acknowledgement; deduplicate by operation ID + content digest, reject conflicting repeats. Read explicit scope/InvocationId for queries and reconciliation. |
| `BaselineSource` | Adapter over M01's `RevisionReader.open(sha)` (which verifies identity before handing out files) for a pinned revision, holding its publication lease through copying, or M16’s typed unregistered snapshot with the same semantic entries; never infer flags from source filesystem modes. |
| `InstalledHarnesses` | Application Protocol of M03 (`InstalledHarnesses.list()`): installed harnesses with version and executable path. |
| `EventPublisher`, `Clock`, `IdGenerator` | Shared ports from `engine/shared`. |

#### Application (`engine/harness/application/`)

Interfaces offered to other engine modules (`application/interfaces.py`), implemented by the use cases below:

```python
class HarnessExecution(Protocol):            # used by M11 (competitor), M16 (planner), M12 (judge)
    async def establish(self, spec: EnvironmentSpec) -> EstablishedEnvironment: ...   # raises CleanModeUnavailable; M11 passes
    #   EnvironmentSpec.trial(trial: TrialRef, result_id: ResultId) once per trial (fresh baseline copy each time)
    async def invoke(self, req: InvocationRequest) -> InvocationResult: ...
    async def stop(self, run_uid: RunUid, configuration_id: ConfigurationId | None) -> CleanupReport: ...
    async def stop_invocation(self, invocation_id: InvocationId) -> CleanupReport: ...  # M16 jobs.cancel, M12 judging.stop
    async def cleanup_plan(self, run_uid: RunUid, configuration_id: ConfigurationId | None) -> Sequence[CleanupItem]: ...  # M11 runs.stop_preview; changes nothing
    async def release(self, environment_id: EnvironmentId) -> CleanupReport: ...
    async def reconcile(self) -> Sequence[OrphanReport]: ...                         # engine start
    async def task_snapshot(self, trial: TrialRef, task: TaskId) -> SnapshotRef | None: ...  # M08
    async def materialize(self, ref: SnapshotRef, into: Path) -> None: ...          # M08: read-only source, copy target

class HarnessResources(Protocol):            # used by M08 verification
    async def lease_verification(self, trial: TrialRef) -> VerificationLease: ...  # ports and empty browser profile disjoint from live allocations
    async def release_verification(self, lease: VerificationLease) -> None: ...

class HarnessLive(Protocol):                 # used by M11; omitted trial selects active only, response carries resolved TrialRef
    async def snapshot(self, run_uid: RunUid, cfg: ConfigurationId, trial_index: int | None = None) -> LiveTaskSnapshot | None: ...

class HarnessInspection(Protocol):           # used by M03 (readiness) and M07 (validation, launch)
    async def assess_policy(self, entries: Sequence[EntryRef]) -> Sequence[PolicyAssessment]: ...
    async def probe(self, harness: HarnessId, executable: Path, version: str | None) -> HarnessProbe: ...
    # M03: adapter support, supported-version verdict, exposure, auth outcome (verified | rejected | offline | inconclusive | not_applicable),
    # headless probe, clean-mode controls, sanitized account label and billing kind (api | subscription | unknown, read from the
    # non-model status output, never guessed). M03 passes the executable it located, so no call back into M03.
    async def list_models(self, context: CatalogContext, timeout: timedelta) -> ModelListOutcome: ...
    # M04 discovery: models plus default_model: DefaultModelReading | None, or a classified failure
    # (offline | timeout | auth_rejected | unsupported | failed); never a guess, never a model call
    async def verify(self, harness: HarnessId, executable: Path, version: str | None,
                     record_dir: Path, *, job_id: JobId) -> VerificationOutcome: ...
    # M03 environment.verify, only after the user's consent: one minimal headless invocation
```

| Use case | Kind | Behavior |
|---|---|---|
| `EstablishEnvironment` | internal | For competitor trials allocate ports, browser context, semantic baseline workspace and test data; for judges bind the delivered snapshot plus protected artifact/input roots and separate scratch/record roots; for `clean`, assess and write the managed config, raising `CleanModeUnavailable` when not establishable; for `current`, record the sanitized fingerprint. Persist and publish `harness.environment.established`. Competitor establishment runs once per trial from a fresh baseline, in parallel and sequential scheduling alike. Judge establishment uses `EnvironmentSpec.judge` and must establish declared read-only protection or fail before launch. [R068, R070–R072, R077, R140] |
| `InvokeHarness` | internal | Compute `effort_argument`, build the launch spec, spawn, start draining output into the log before fan-out, await M18 process registration for competitor scope, translate signals to events, enforce the caller's deadline, classify the exit, persist and return `InvocationResult` only after complete drainage and durable scoped log/snapshot writes. For competitor scope, await M18 exit/flush and the critical observation sink for accepted usage/exit facts; client event queues are not accounting transport. Never re-invokes, never resumes a conversation, never changes the model. [R012, R065, R069] |
| `StopInvocations` | internal | Terminate process groups for a configuration or run (or one planner or judge invocation), sweep escaped services, release ports and browser contexts; return and publish `CleanupReport`. Called only by M11's stop and timeout handling, M16's planning cancel and M12's `judging.stop`. [R138] |
| `ReleaseEnvironment` | internal | Same cleanup after normal completion of a configuration. |
| `ReconcileOrphans` | internal | At engine start, find recorded process groups still alive from a previous engine; end them and report to M11, which records the interruption. |
| `AssessPolicy` | internal + query | Clean assessments for entries (M07 launch validation) and the policy matrix query. |
| `ProbeHarness`, `ListModels` | internal | Adapter support and exposure for the installed version; model listing for M04 through the harness's own model-list command, and the default model through `HarnessAdapter.default_model` over the read-only settings view and the status command's output; authentication outcome only from a non-model status command or from recorded invocation failures, otherwise `unknown`. Neither makes a model call. [R061, R137] |
| `VerifyHarness` | internal | Called once per harness by M03's `VerifyHarnesses` job, which holds the user's consent. Allocates `VerificationScope`/`InvocationId`, links M03’s `JobId`, creates an empty temporary workspace, writes the managed clean config when clean mode is establishable (otherwise records the diagnostic exception as `current`; this never approves current mode for a benchmark), builds `verification_spec`, spawns through `ProcessRunner` with closed stdin and a 60 s deadline, drains the output into the record directory M03 hands it, classifies with `classify_verification`, terminates the tree on deadline, removes the workspace and returns `VerificationOutcome`. Job cancellation terminates/drains the invocation and retains a stopped diagnostic record; it does not fabricate a verification confirmation. Exactly one spawn when supported; never retried, never given a model argument, never part of a run. If supported controls cannot deny every tool/file action or establish noninteractive execution, return `headless_failed` before spawn; consent never authorizes a less-restricted probe. [R137] |
| `ListAdapters`, `GetPolicyMatrix`, `DescribeConfiguration`, `ReadTaskLog`, `ReadInvocationLog`, `GetIsolation`, `GetLiveSnapshot`, `DiffWorkspaceFile`, `GetInvocation` | query | Back the queries in the API table. Each returns capability flags computed here. |

#### Adapters (`engine/harness/adapters/`)

| Adapter | Implements |
|---|---|
| `harnesses/claude_code.py`, `codex.py`, `grok_cli.py`, `pi.py` | `HarnessAdapter`. Each maps clean controls, permission rules, effort omission and output parsing for its CLI. Any harness option that selects a fallback model is never set. |
| `process.py` | `ProcessRunner` on `asyncio.create_subprocess_exec` with `start_new_session=True`, `stdin=DEVNULL`; `ServiceSweeper` on psutil. |
| `fs_workspace.py` | `WorkspaceProvisioner`, `WorkspaceWatcher` (watchfiles), diff via git against the start snapshot. |
| `ports_local.py`, `browser_profiles.py` | `PortAllocator`, `BrowserContextProvisioner`. |
| `settings_files.py` | `HarnessSettingsReader`, `ManagedConfigWriter`. |
| `store_fs.py` | `InvocationStore` (JSON records, JSON-lines log). |
| `rpc.py` | Maps the `harness.*` methods to use cases, domain results to DTOs, domain errors to `harness.*` error codes; registers exact `harness.*` event names and a bare `harness` topic provider with M11; contributes run/live projections through M11-owned topic providers, never wildcard topics. |

Composition (`engine/daemon/composition.py`) builds `{HarnessId: HarnessAdapter}` with all four adapters and injects it, with the other port implementations, into the use cases.

Observation is passive by construction: one reader task per process drains stdout and stderr continuously into the log file and then into an in-memory fan-out; subscriber queues are bounded. Only registered replaceable observations may coalesce; logs, transitions and retained facts never drop silently. Overflow triggers the shared replacement-snapshot handoff using `EventCursor {epoch, seq}`. Per-invocation log offsets are distinct from subscription cursors. Required accounting/persistence delivery is awaited before success, independent of UI queues. No path writes to the process's stdin, signals it, or waits on a client. [R044, R047]

For a spawned competitor `TaskScope`, start output drainage immediately and directly await `ProcessTracking.started(scope, invocation_id, pid, pgid, process_start)` before publishing its start transition. After process exit/stop and drainage, await `ProcessTracking.exited(scope, invocation_id)` before acknowledging invocation completion; recovery repeats the same idempotent handoffs and validates process-start identity against PID reuse. These calls never depend on subscriber delivery. Monitoring OFF, missing collectors, denied observations and collector failure remain nonfatal: M18 acknowledges explicit unavailable/partial coverage and gaps. Durable telemetry storage failures remain typed pending-recovery/finalization failures, not optional collector failures to swallow. Planner, judge and verification scopes never enter competitor process tracking or measurements.

#### Persisted state

M05 writes only into directories its callers hand it; M02 and M11 own the surrounding layout. Every durable task record/log/snapshot includes `InvocationId`, `ResultId`, `TrialRef` and task id. InvocationStore allocates stable operation IDs (`invocation:<id>:outcome`, `invocation:<id>:evidence:<kind>`, and log entry ids); identical recovery writes are no-ops, conflicting bytes fail. M11 awaits the returned facts, calls M02 `append_task_outcome(..., operation_id)` and `attach_evidence(..., operation_id)`, and completes this before the shared finalization barrier. M05 does not seal results. Failure to persist is `harness.persistence_failed`, never a completed invocation with missing logs.

| Path (under the caller's per-trial directory, `~/.axbenchmark/runs/<run_uid>/<configuration_id>/trial-<n>/` for competitors) | Content |
|---|---|
| `ws/` | Trial workspace, a fresh copy of the packaged baseline for each trial. |
| `testdata/`, `browser/` | Independent test data copy and browser profile. |
| `managed/<harness>/` | Managed harness configuration (clean mode) and permission rules. |
| `environment.json` | `EstablishedEnvironment`, then `CleanupReport`. |
| `tasks/<task_id>/invocation.json` | Request summary, requested and effective settings, exit classification, pid/pgid, timestamps, snapshot references. |
| `tasks/<task_id>/log.jsonl` | Append-only log lines with stable entry id, invocation-local `seq`, full scope, timestamp, source, kind; written before any event is published. |

Planner and judge invocations use their typed scopes and the same record files under the directory given by M16 or M12; verification invocations under the directory given by M03 (`~/.axbenchmark/environment/verifications/<job_id>/<harness>/`). No credential is written to any of these files, consistent with M07's redaction rule. [R071]

#### Owned processes

Every harness process is a child of `axbenchmarkd`, never of a client, in its own process group. Application services the harness starts belong to that group or are found by `ServiceSweeper`. Detaching or closing a client never reaches these processes; only engine-owned stop/cancel/timeout/cleanup paths end them, including M03 diagnostic cancellation, M16 planning cancellation and M12 judging cancellation. [R138]

### 2. API surface (`harness.*`)

All methods are queries with safety class `read`. Requests/DTOs use `api.common` ids, `ActionState`, `JobRef` and `EventCursor`; application errors use the shared integer JSON-RPC envelope decoded as `EngineError(code, message, field, remedy, data)`. A diagnostic parent job remains M03-owned and is queried/cancelled via M11 `jobs.*`. M05 registers no client command or job: competitor execution starts only through M11's launch, planner work through `planning.*`, judging through `judging.*`, and stopping through `runs.stop`, so no interface can spawn a harness outside frozen inputs.

#### Queries

| Method | Request | Response | Errors | Capability flags |
|---|---|---|---|---|
| `harness.adapters.list` | — | `list[HarnessAdapterInfo]`: harness, display name, supported controls, `ExposureProfile` (effort, reasoning `none\|summary\|full`, context, rate, usage). | — | — |
| `harness.policy.matrix` | `harnesses?: list[HarnessId]` (all installed when omitted; Setup passes the harnesses of its draft's entries) | `PolicyMatrix`: rows `harness, version, categories: {instructions…mcp: disabled\|absent\|cannot_disable}, clean_establishable, cause?, found?, current_fingerprint?` | `harness.unsupported`, `harness.not_installed` | `clean_establishable` per row with `reason` code |
| `harness.configuration.describe` | `target: TrialRef \| {result_id: ResultId}` | `ConfigurationExecution`: `result_id`, resolved `trial: TrialRef`, `tasks: [TaskRow(task_id, title, pid?, outcome, blocked_count, failure?)]`, `current_task_id?`, `task_contract` (fixed facts: new conversation, inputs, carried state), `invocation: [SettingRow(setting, requested, effective: Observed, evidence)]`, `established: EstablishedEnvironmentDTO`, `failure?: ErrorDTO` (e.g. `harness.model_rejected` with message and remedy). | `harness.unknown_run`, `harness.unknown_configuration` | `can_live_view` (a task process is running), `can_search_log` |
| `harness.task.log` | `target: TrialRef \| {result_id: ResultId}`, `task_id`, `after_seq?`, `limit` (default 500), `query?` | `LogPage`: `invocation_id?` (absent before start), scope, `result_id`/`TrialRef` for task logs, `lines: [LogLine(seq, ts, source, text, kind: normal\|blocked\|error\|continuation)]`, `next_seq`, `matches: list[int]`, `complete: bool`, `state: not_started\|running\|finished` | `harness.unknown_task`, `harness.log_unavailable` | — |
| `harness.isolation.get` | `run_uid` | `IsolationReport`: summary counts, rows `trial: TrialRef, result_id, harness, workspace, ports, browser_context, test_data, baseline_sha, baseline_matches: bool`, `permissions` text, `blocked: [BlockedRef(trial: TrialRef, result_id, task_id, count)]` | `harness.unknown_run` | — |
| `harness.live.get` | `run_uid`, `configuration_id`, `trial_index?` (omitted selects active trial only; no last-trial fallback) | `LiveTaskSnapshot`: resolved `TrialRef`, `result_id`, `invocation_id`, task, requested and observed model and effort, `rate: Observed[float]`, `context: Observed[ContextUse]`, recent activity, reasoning tail with `is_summary`, files changed in this task, object key/revision, invocation-local log offset | `harness.unknown_configuration`, `harness.no_active_task` | `can_show_reasoning`, `has_context`, `has_rate` |
| `harness.workspace.diff` | `target: TrialRef \| {result_id: ResultId}`, `task_id`, `path` | `FileDiff`: resolved `TrialRef`, `result_id`, `invocation_id`, task id, path, base snapshot, hunks, `final: bool` (saved by the harness) | `harness.diff_unavailable` | — |
| `harness.invocation.get` | `invocation_id` | `InvocationRecordDTO` for any role (planner and judge screens show requested vs effective with it; Environment shows a verification call's record). | `harness.unknown_invocation` | — |
| `harness.invocation.log` | `invocation_id`, `after_seq?`, `limit` (default 500), `query?` | `LogPage` as `harness.task.log`, for any role (M16 "Open log", M12 session log) | `harness.unknown_invocation`, `harness.log_unavailable` | — |

#### Events

Invocation events carry `InvocationScope`, `invocation_id`, `role`, `harness` and sources; competitor/judge scopes include their exact result/trial binding. Environment events carry `environment_id` and its typed scope, without inventing an invocation id before launch. All four roles use the shared `EventEnvelope` and typed cursor. Register bare topic `harness` with revisioned adapter/policy observations; M11 owns `run:<run_uid>`, `run:<run_uid>/<configuration_id>` and `live:<run_uid>/<configuration_id>` snapshots and routes these exact events into them. Diagnostic progress routes through M03’s `job:<job_id>`; historical logs use explicit queries. No wildcard `harness.*` or private log topic exists. Run consumers ignore non-task scopes; diagnostic events never create run lanes or benchmark records.

| Event | Payload | Consumers |
|---|---|---|
| `harness.environment.established` | `EstablishedEnvironmentDTO` | M11, M08 (workspace, ports, browser context), M02 |
| `harness.environment.released` | `CleanupReport` | M11 (stop is reported only after this), StopScreen |
| `harness.task.started` | pid, pgid, new conversation, input names, start snapshot | M11 lanes, M15, RunConfigScreen, HarnessLiveScreen (resets context) |
| `harness.task.exited` | `ExitClassification`, duration, end snapshot, blocked count | M11 (continuation, halt on auth/config), M10 (process duration), M08 |
| `harness.log.appended` | `LogLine` | RunConfigScreen `#log`, RunScreen `#events`, CLI `--attach` |
| `harness.action.observed` | kind, summary, paths | HarnessLiveScreen `#live-activity` |
| `harness.reasoning.observed` | text, `is_summary` | HarnessLiveScreen |
| `harness.output.measured` | `rate: Observed[float]`, at most once per second | HarnessLiveScreen `#live-rate`, M15 lanes |
| `harness.context.reported` | `Observed[ContextUse]` | HarnessLiveScreen `#live-context`, M15 lanes |
| `harness.file.changed` | path, added/removed lines, `final` | HarnessLiveScreen `#live-files`, `#live-diff` |
| `harness.settings.observed` | setting, `Observed` value | RunConfigScreen `#invocation`, HarnessLiveScreen `#live-task` |
| `harness.permission.decided` | action, `allowed\|blocked`, reason | RunConfigScreen `#log` (`.-blocked`), IsolationScreen |
| `harness.usage.reported` | `seq`, usage categories, `ReportedCost` with currency provenance/raw reference, `cumulative`, `final` | M10 critical acknowledged sink; optional event observation, never live display |
| `harness.retry.observed` | reason | M11 (recorded, never an orchestrator retry) |

Live rate/context events are observation aids. M10 accepts competitor usage and exit facts through an awaited `InvocationObservationSink.accept(invocation_id, entry_id, scope, fact)` port; repeated identical entry ids deduplicate and conflicting facts fail. Those facts may also publish the listed events, but final accounting never depends on a lossy client subscription. Planner/judge usage is returned to its owning caller for separate accounting; verification usage stays diagnostic and never enters benchmark measurements. [R044]

#### Error codes

| Code | Raised when |
|---|---|
| `harness.clean_unavailable` | Clean mode cannot be established for one or more entries. Raised by M11's `runs.launch` (step `config`, through M07's `freeze_configuration` and `HarnessInspection`); `data.assessments` holds `CleanAssessment` per entry. [R070] |
| `harness.effort_unsupported` | An explicit effort is not in the frozen supported list. [R065] |
| `harness.not_installed`, `harness.unsupported` | The selected harness is absent or has no adapter. [R137] |
| `harness.scope_mismatch`, `harness.invalid_trial`, `harness.unsafe_workspace_path`, `harness.persistence_failed`, `harness.invocation_conflict` | Invalid scope/path, durable-write failure or conflicting recovery record; nothing is silently redirected or overwritten. |
| `harness.judge_protection_unavailable` | Declared judge artifact/input protection cannot be established; fails before invocation with its limitation/remedy. |
| `harness.resource_conflict` | A port range or browser context would be shared. [R072] |
| `harness.unknown_run`, `harness.unknown_configuration`, `harness.unknown_result`, `harness.unknown_task`, `harness.unknown_invocation`, `harness.no_active_task`, `harness.log_unavailable`, `harness.diff_unavailable` | Query targets that do not exist or have no data. |

Invocation outcomes (`model_rejected`, `auth_failed`, `config_failed`, `launch_failed`, `timed_out`, `stopped`) are data in `ExitClassification`, not RPC errors; they are rendered from `ConfigurationExecution.failure` and `harness.task.exited` with codes `harness.model_rejected`, `harness.auth_failed`, `harness.config_failed`, `harness.launch_failed`.

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `RevisionReader.open(sha)` (in-engine) | M01 | Packaged baseline to copy into each workspace, identity verified first. [R068] |
| `InstalledHarnesses.list()` (in-engine) | M03 | Installed version and executable path for the policy matrix and probes. |
| `VerifyHarnesses` job behind `environment.verify(consent=true)` (in-engine caller of `HarnessInspection.verify`, with the record directory and `JobId`) | M03 | The only path to a verification invocation; consent is checked there. |
| Frozen launch record (passed in `InvocationRequest` by M11) | M07 | Requested settings, `EffortSelection` with frozen M04 evidence, policy per entry. |
| `configs.update_entry(draft_id, entry_id, policy=…)` | M07 | EnvPolicyScreen save. |
| `runs.launch` with `exclude_entries` and `policy_overrides` | M11 | CleanBlockedScreen continue options. |
| `runs.status` | M11 | Run bar on RunConfigScreen: position of this configuration, other configurations continuing, the configuration's `can_stop` (from its `ConfigurationStatusDTO.capabilities`) and the run's `can_detach` (`RunStatus.capabilities`). |
| `runs.stop` (scope configuration or run) | M11 | `s` on RunConfigScreen, via M11's StopScreen. |
| `events.subscribe(topics, cursor: EventCursor \| None)` with registered snapshot providers | M11 | Live log, settings and permission events; snapshot hook for bare `harness` and M11-owned run/live topics. |
| `RunInvalidationCoordinator.invalidate(run_uid, identity_check, detected_at, source)` | M11 | Required route for any in-run M05 `IdentityMismatch`; caller awaits the coordinator outside the failing invocation, avoiding cleanup waiting on itself. |
| `ResultRecorder.append_task_outcome` / `attach_evidence` | M02, called by M11 | Durably retain returned M05 facts/evidence with stable operation IDs and explicit result/trial binding before finalization. |
| `InvocationObservationSink` | M10 implements M05 port | Acknowledged competitor usage/exit delivery with `ObservationReceipt`, retaining cost currency provenance; must not use the UI event queue. |
| `ProcessTracking.started(TaskScope, InvocationId, pid, pgid, process_start)` / `.exited(TaskScope, InvocationId)` | M18 | Direct awaited competitor registration/flush, idempotent by invocation/scope; collector unavailability stays nonfatal and coverage remains explicit. |
| `EnvironmentSpec.judge(...)` inputs | M12 / M02 artifact reader | Delivered `SnapshotRef`, protected artifact/input roots, distinct scratch/record roots and typed judge settings/scope; no alternate process API. |
| Run and configuration directory allocation | M11 / M02 | Record directory for `InvocationRequest` and `EnvironmentSpec`. |
| Planning and judging record directories; a validated semantic snapshot as planner baseline | M16 / M12 | Same, for planner and judge invocations. |

### 4. Screens

All M05 screens are pure views: they render view models built from the responses above, enable bindings from capability flags with `check_action`, and show `harness.*` error messages verbatim. Glyphs (✓ ✗ ● ○ ?) are a presentation mapping of the enums (`outcome`, `ControlStatus`, `Observed.status`), not a rule.

#### RunConfigScreen — artboards RunConfig, TaskBlocked, ModelRejected

| Item | Specification |
|---|---|
| Class and file | `RunConfigScreen(Screen)` in `axbenchmark/tui/screens/run_config.py`; widget tree and TCSS as in the M05 board (`#run-bar`, `#run-tasks`, `#task-contract`, `#invocation`, `#established`, `#log-pane` with `#log-search` and `#log`, `#invocation-summary` for `.-compact`). |
| View model | `tui/viewmodels/run_config.py`: `RunConfigVM(run_bar, tasks: list[TaskRowVM], cursor_task_id, task_contract: list[KV], invocation: list[SettingRowVM], established: list[KV], failure: NoticeVM \| None, log_title, can_live_view, can_stop)`, built by `build_run_config_vm(desc: ConfigurationExecution, run: RunStatus) -> RunConfigVM`. `LogVM` from `build_log_vm(page: LogPage)`; `.-blocked` from `LogLine.kind`. |
| Load | Constructor requires `TrialRef` or `ResultId`. Worker loads `harness.configuration.describe(target)` and `runs.status(run_uid)`, then `harness.task.log(target, task_id)` for that explicit trial. A live lane first resolves its active trial and passes it; retained-result navigation never resolves current/last. |
| Subscriptions | On mount `events.subscribe` for this configuration: `harness.log.appended`, `harness.task.started`, `harness.task.exited`, `harness.settings.observed`, `harness.permission.decided`, `harness.environment.released`, plus M11 run status events. Unsubscribe on unmount. Only matching resolved `TrialRef` task events reload the description. Use M15’s subscription manager, typed cursors/revisions and replacement snapshots; discard stale query responses after selection changes. |
| States | `ContentSwitcher #run-config` with `#run-config`, `#run-config-loading`, `#run-config-error`; the log pane has `ContentSwitcher #log-switcher` with `#log`, `#log-loading` (“Attaching to process …”), `#log-empty` (task not started: `LogPage.state == not_started`), `#log-error` (stream interrupted; reconnects with shared `EventCursor`, then fetches missing log entries by invocation-local `after_seq`). TaskBlocked is RunConfig with a `blocked` log line focused; ModelRejected is RunConfig with `failure` rendered as `.notice.-error` above the log and `can_live_view`/`can_stop` false. |

| Binding | Action | API call |
|---|---|---|
| `esc` | `app.pop_screen` | none (unsubscribe only) |
| `/` | focus `#log-search`; submit | `harness.task.log(target, query=…)`; `n` steps through the returned `matches` without a call |
| row highlight in `#run-tasks` | show that task's log | `harness.task.log(target, task_id=…)` |
| `i` | push `IsolationScreen` | `harness.isolation.get` (in that screen) |
| `v` | push M11 `HarnessLiveScreen`; disabled unless `can_live_view` | `harness.live.get` (in that screen) |
| `s` | push M11 `StopScreen` with scope configuration; disabled unless the configuration's `can_stop` (`ConfigurationStatusDTO.capabilities`) | `runs.stop` (issued by StopScreen) |
| `d` | push M11 `DetachScreen` | none; the run continues |
| `p` | push M08 `VerifyProgressScreen(trial: TrialRef)` (key in the wireframe's `RUN_KEYS`); always enabled, the screen shows its empty state when no verification is running | none; that screen loads `verification.progress.get` itself |
| `tab` | `focus_next` | none |

#### IsolationScreen — artboard RunIsolation

`IsolationScreen(ModalScreen[None])` in `tui/screens/run_config.py`; view model `IsolationVM(summary, rows: list[IsolationRowVM], permissions, blocked)` from `build_isolation_vm(IsolationReport)`. Load `harness.isolation.get(run_uid)`; subscribe to `harness.permission.decided` and `harness.environment.released` for the run. States `#isolation`, `#isolation-loading`, `#isolation-error`. Bindings: `esc` → dismiss (no call); `enter` on `#isolation-table` → dismiss and push `RunConfigScreen(row.trial)` (its load issues `harness.configuration.describe`). A `baseline_matches: false` row is rendered as returned; the screen does not compare hashes.

#### EnvPolicyScreen — artboard EnvPolicy

`EnvPolicyScreen(ModalScreen[EnvPolicy | None])` in `tui/screens/setup.py` (opened by `p` from M07's SetupScreen for the focused entry). View model `EnvPolicyVM(selected: EnvironmentPolicy, matrix: list[PolicyRowVM], hint)` from `build_env_policy_vm(PolicyMatrix, entry)`. Load `harness.policy.matrix(harnesses=[entry.harness])`. No subscriptions. States `#env-policy`, `#env-policy-loading`, `#env-policy-error`. Bindings: `esc` → dismiss(None); `tab`/`shift+tab` → focus; `ctrl+s` (and `#save`) → `configs.update_entry(draft_id, entry_id, policy=…)`, dismiss with the saved policy on success, show the typed error otherwise. `RadioSet #policy` starts at the entry's stored policy (default clean). A row with `clean_establishable: false` is shown with its `cause`; the screen does not block or rewrite the choice, because launch handles it.

#### CleanBlockedScreen — artboard CleanModeBlocked

`CleanBlockedScreen(ModalScreen[CleanDecision])` in `tui/screens/launch_check.py`, pushed by the launch flow when `runs.launch` returns `harness.clean_unavailable`. View model `CleanBlockedVM(harness_label, cause, found, isolated, choices)` from `build_clean_blocked_vm(error.data.assessments[i])`; one dialog per blocked entry. No load call and no subscription: the error payload is the data. Bindings: `esc` → dismiss back to Setup (no call); `enter`/`#continue` with `RadioSet #clean-choice`:

| Choice | API call |
|---|---|
| Remove this entry from the launch | `runs.launch(…, exclude_entries=[entry_id])` |
| Use current for this entry only | `runs.launch(…, policy_overrides={entry_id: "current"})`; the entry is recorded as current with its fingerprint |
| Cancel the launch | none |

#### Screens owned elsewhere that consume M05

| Screen (owner) | M05 data |
|---|---|
| `HarnessLiveScreen` (M11, `tui/screens/live.py`) | `harness.live.get`; events `harness.task.started/exited`, `harness.output.measured`, `harness.context.reported`, `harness.reasoning.observed`, `harness.action.observed`, `harness.file.changed`, `harness.settings.observed`; `harness.workspace.diff(target=resolved_trial, task_id, path)` for `#live-diff`; pin the trial returned by the live snapshot before fetching. `t` is enabled from `can_show_reasoning`; each value shows its `source`; unavailable values render as “? not reported”. |
| `RunScreen` lanes and `#events` (M11/M15) | `harness.log.appended`, `harness.output.measured`, `harness.context.reported`, `harness.task.*`. |
| Planning and judging screens (M16, M12) | `harness.invocation.get` and the same events with `PlanningScope`/`JudgingScope`. |
| SetupScreen / ReviewLaunchScreen (M07) | `harness.policy.matrix` for policy columns and isolation limitations. |
| EnvironmentScreen and `doctor` (M03) | `HarnessProbe` and `VerificationOutcome` through `environment.*`; a verification's log through `harness.invocation.log`. |
| `PlannerScreen` (M16) | The harness default model via M04's `catalog.options` (from `DefaultModelReading`); "Verify now" via M03's `environment.verify`. |

### 5. CLI

M14 owns the commands; these are the ones that reach M05 and the methods they use.

| Command | Methods |
|---|---|
| `axbenchmark run --config … [--no-tui] [--jobs N]` | `runs.launch` (M11); `harness.clean_unavailable` prints each assessment and exits 1, since no silent fallback exists; progress lines from `harness.task.*`, `harness.log.appended`, `harness.permission.decided`. |
| `axbenchmark --attach RUN_REF` | `results.resolve_run` for a UID/unique label, then registered M11 run/live topics with `EventCursor`; ambiguous labels fail. |
| `axbenchmark status RUN_REF` | `runs.status` (M11) plus `harness.configuration.describe` for explicit trial refs from status per configuration for requested vs effective settings and process outcomes. |
| `axbenchmark doctor [--verify]` | `environment.*` (M03), which includes `HarnessProbe` results; `--verify` reaches `HarnessInspection.verify` through `environment.verify`. |
| Proposed for M14: `axbenchmark harness list`, `axbenchmark harness policy [--harness H]`, `axbenchmark run log RUN_REF --config ID --trial N --task ID [--follow] [--search Q]`, `axbenchmark run isolation RUN_REF` | `harness.adapters.list`, `harness.policy.matrix`, `harness.task.log` with required trial (+ registered run subscription for `--follow`; log reads remain pinned), `harness.isolation.get`. `--json` prints the response models. |

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain | `effort_argument`: harness default and unknown support give `None`; explicit unsupported raises. `assess_clean`: any `cannot_disable` makes clean unestablishable; no code path yields `current`. `sanitize`: credential keys and token-shaped values never reach the fingerprint; equal relevant settings give equal hashes. `overlaps` on port ranges. `OutputRateMeter`: reported rate preferred, stream-measured otherwise, `unavailable` with neither. `InvocationRequest` has no field for a previous conversation. `classify_verification`: `confirmed` only with a model response and a normal exit; each failure class maps as specified. |
| Adapters (contract tests) | For each of the four `HarnessAdapter`s, recorded transcripts parse into the expected signals; `launch_spec` omits the effort argument for `HarnessDefault`, never sets a fallback model, points to the managed dir in clean mode and leaves user config in current mode; `classify_exit` maps recorded model-rejection and authentication failures. `default_model` reads recorded settings files and status output and returns `None` when neither names a model; `verification_spec` carries no model or effort argument, denies every tool and points to the managed dir when given. A shared suite runs against every adapter. |
| Use cases with fakes | `FakeProcessRunner` scripts output and exits. Two successive tasks get distinct pids and no shared session; the second receives spec, its prompt and the first task's workspace. Two configurations of the same harness get disjoint ports, browser contexts and test data and equal baseline hashes, in parallel and sequential order. A blocked permission produces `harness.permission.decided(blocked)` and the process still finishes; a process that waits on stdin sees EOF. A model rejection returns `model_rejected` and no second spawn. A slow subscriber never delays draining (fake process emits faster than the subscriber reads; exit time is unchanged). `StopInvocations` ends the group and a swept service and reports released ports. `ReconcileOrphans` finds a recorded live group. Clean unestablishable raises `CleanModeUnavailable` without writing a managed config. `ListModels` and `ProbeHarness` spawn no model invocation (the fake runner fails on one). `VerifyHarness` spawns exactly once, kills the tree at the deadline (`timed_out`), maps a recorded 401 to `auth_rejected` and removes its temporary workspace. |
| API via `InProcessClient` | With fake ports and no interface: launch a run (M11 use case with this module wired), subscribe, drop the client, reconnect with `EventCursor {epoch, seq}`, and observe the same pids and no new `harness.task.started`. `harness.configuration.describe` returns `effective.effort.status == "unverified"` for a harness that does not expose effort. `harness.task.log(target, query=…)` returns match positions. Error codes and `data.assessments` serialize as specified. |
| Screens with a fake client | `RunConfigScreen` via `App.run_test()`/`Pilot` for RunConfig, TaskBlocked and ModelRejected fixtures: rows, `? unverified`, `.-blocked` line, notice text verbatim, `v` and `s` disabled from flags; `p` pushes `VerifyProgressScreen` with no call; each binding issues exactly the listed call; `esc` issues none. `IsolationScreen` `enter` pushes the right configuration. `EnvPolicyScreen` `ctrl+s` issues one `configs.update_entry`. `CleanBlockedScreen` maps each choice to its single `runs.launch` call or none. View-model builders are unit-tested without Textual. |


Additional acceptance gates: equal-byte regular/executable baseline entries restore as `0644`/`0755` locally and after M17 import; approved storage remains `0444`/`0555`. Reject path traversal, NFC/case-fold and file/directory collisions, symlinks and special files before copying. Two trials with identical task ids and two runs with identical labels retain separate logs/snapshots; omitted historical trial and result/trial mismatch fail. Crash after each durable append then replay the same operation ids without duplicate outcomes/evidence. Inject M01 mismatch at provisioning and later snapshot reads: forward the unchanged check to M11, never classify it as `config_failed`; partial evidence survives and every result becomes ineligible through M02. These are proposed executable gates, not checks performed by this documentation change.

Each adapter child requires current official documentation, exact executable provenance/version, and real macOS/Linux checks for supported headless, permission, clean/current, inspection, parsing and cleanup behavior. Record unsupported or unverified combinations rather than invent switches or support. Actual model-call checks are separately consented test operations; document-only refinement makes no model call. Parent completion also requires M11 scheduling/stop/recovery, M02 retention, M08 verification copies, M10 accounting, M12/M16 role integration and M14/M15 client parity.


Focused handoff acceptance: adapter fixtures preserve explicit non-USD currency, version-documented currency and currency-less raw amounts without a USD assumption; M10 alone evaluates/converts charges. Judge fixtures attempt direct writes, repairs and traversal/symlink escapes against artifact/input roots, verify unchanged authoritative bytes, allow scratch/record writes, and block unsupported protection before any spawn through the normal M05 runtime. Competitor tracking fixtures assert awaited M18 start/exit ordering and replay-safe identities under UI overflow, immediate exit, cancellation and PID reuse; OFF/collector failure retains unavailable/partial coverage without stopping execution, while telemetry persistence failure prevents false finalization. Judge/planner/verification invocations emit no competitor tracking/accounting handoffs.
