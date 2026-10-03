# M03.1 — readiness-service

Parent: [M03](../reference/modules/03-environment-readiness.md#1-engine-component). Requirements: R005, R006, R029, R054, R067, R103, R137, R146, R150. Findings: M03 aligned; resolves F15 ordering and consumes F04/F05/F18 shared contracts.

Outcome: an implementer can deliver truthful local readiness, explicit consented verification and the complete `environment.*` API without requiring later provider implementations. This is proposed work; the commands below are future acceptance commands, not recorded passing tests.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap importable package/test layout, contract fixtures and import boundaries; M11.1 `engine-client-api` and M11.2 `events-jobs-lifecycle` from the [foundation contract](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries). Real `InProcessClient`, socket serialization, registry, jobs and typed-cursor subscriptions must run before this child starts.

**Bootstrap-published contracts, allowed as injected fixtures:** M01 `RevisionPermissions.audit` and mode-drift schema; M05 `HarnessInspection.probe/verify`, `HarnessProbe`, `VerificationOutcome`, verification invocation scope and log identity; M04 context-scoped catalog overview/refresh event; M18 capability/guidance schema and its single `CollectorCause` enum. M03 publishes `InstalledHarness`/`AccountObservation`, `ReadinessGate`, `ReadinessReport`, `AssessOperation`, `InstalledHarnesses` and `MachineIdentitySource` before M04's domain work. Publication is not implementation of their providers.

Contract fixtures must include timeouts, unavailable/unknown values, sanitized accounts with distinct fingerprints, every collector cause and drifted revisions. They must fail on unexpected model calls or writes to credentials, tools and revision files. Use the owning modules' schema fixtures, not parallel local DTOs.

Extend operation assessments with decision-role prerequisites keyed by immutable `DecisionProfileRef` (ID/version/digest), capability evidence, credential presence and actual routing/locality. Consume the published M12.4 `capabilities`/`probe` port; M03 owns diagnostics, never System One transport. Metadata checks make zero inference calls; an explicit inference test is a bounded M12.4 job with separate accounting/resource admission. A generic OpenRouter/LiteLLM route or successful chat probe cannot mark System One READY. Missing observer readiness disables classification only; native capture, competitor readiness and eligible harness/human grading remain independent.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/readiness/domain/inventory.py`, `findings.py`, `rules.py`, `verification.py`, `errors.py`; `axbenchmark/engine/readiness/ports.py`.
- `axbenchmark/engine/readiness/application/inspect.py`, `queries.py`, `verify.py`, `interfaces.py`, `publication.py`.
- `axbenchmark/engine/readiness/adapters/subprocess_probe.py`, `playwright_probe.py`, `platform_host.py`, `packaged_guides.py`, `catalog_summaries.py`, `harness_checks.py`, `harness_verifier.py`, `collector_capabilities.py`, `revision_audit.py`, `json_report_repository.py`, `rpc.py`, `composition.py`.
- M03 declarations in `axbenchmark/api/environment.py`, `axbenchmark/api/registrations/environment.py`; guide packaging in `docs/harnesses/claude-code.md`, `codex.md`, `grok-cli.md`, `pi.md`, `cursor-cli.md`, `opencode.md` and `docs/runtimes/macos.md`, `linux.md` (provider owners verify command text).
- `tests/readiness/test_rules.py`, `test_inventory.py`, `test_inspection.py`, `test_verification.py`, `test_probes.py`, `test_report_repository.py`, `test_environment_api.py`, `test_environment_events.py`; fixture records in `tests/readiness/fixtures/`.

M11 owns global composition/dispatch; supply a registration function through its hook. Do not create a private client, job runner, event bus, collector or harness process manager.

The parent's API tables and Protocols are normative: queries `report`, `explain`, `assess`, `verification_plan`; jobs `recheck`, `verify`; `JobRef` results and registered environment/job events. Round-trip DTOs and the numeric JSON-RPC error envelope through both clients. Every capability is `ActionState`, and every finding retains source/time/cause. Before harness inspection, harness-dependent assessment/verification planning return `environment.not_inspected`; native decision-role assessments use their own exact profile prerequisites without inventing a harness dependency. A query never initiates inspection.

Reports are host-local observations. Model summaries retain harness/version/provider-or-endpoint/account fingerprint; an observed billing reading passes through unchanged. Collector rows retain M18's actual measurement scope. A diagnostic verification belongs to an M11 job/M05 verification invocation, with `invocation_id` for logs; it has no `RunUid`, `TrialRef`, result, task evidence or benchmark cost.

Inspect only read-only probes. `verification_plan` calls nothing. `verify(consent=false)` fails before dispatch; after explicit consent, call M05 once per target with its record directory and required keyword `job_id: JobId`, taken unchanged from the actual M11 job context through `HarnessVerifier.verify(..., record_dir, job_id=job_id)`. Preserve M05's returned `job_id`, `VerificationScope` and `InvocationId`; never substitute a run/trial identity or parse a directory name to obtain the job. Never retry automatically. Only confirmed responses establish authentication/headless readiness. Offline, rejection, timeout, unsupported and unknown remain distinct; version changes invalidate previous version-specific verification.

Persist `last-report.json` atomically. Merge partial inspection, verification and catalog changes against the latest state under the shared publication boundary; save before publishing. A provider failure creates an explicit row; a repository failure keeps the previous visible report and fails the job. Environment snapshots use `environment:report` revisions and `EventCursor`; jobs use `job:<job_id>`. Disconnecting a client never cancels work.

| Boundary | Contract check |
|---|---|
| Same-scope concurrent recheck | Returns the existing job; another scope queues its own inspection and cannot inherit an incomplete scope. |
| Concurrent verification | Same distinct targets share one job; different targets return `environment.verification_running` and dispatch nothing. |
| Report before first inspection | `NOT_INSPECTED`, six unknown rows and disabled plan/execute capabilities; never pretend the installation inventory is empty. |

**Frozen domain contract.** Extend Prerequisite and environment.assess with DomainVerificationRequirement and operation verify_artifact from the parent. Resolve only M08 approved plan/runner/target refs: native toolchain/device/build/capture and agent product model/tool authority/access are separately evidenced, with supported/unsupported/unknown sources. No generic harness/browser/model probe establishes a native cell or live product capability. Metadata checks launch no device/deployment/inference; missing access is a prerequisite limitation, not candidate failure.

**Route, comparison and profile interfaces.** Own `application/qualify_route.py` and route DTO/fixture extensions in existing environment schemas. Add `Operation.qualify_route` and `RouteRequirement(plan_digest, harness, profile_ref, binding_ref, effort_contract_ref, mapping_ref, capability_digest)` to `Prerequisite`; this read-only assessment checks stored exact inputs and never qualifies them. `environment.qualify_route(plan: RouteQualificationPlanV1) -> JobRef` persists diagnostic intent and explicit consent/budget before admission. Invoke `HarnessInspection.qualify_route(plan, record_dir, *, job_id, cancellation) -> RouteQualificationOutcomeV1`, independently of unchanged verify/default-model smoke. The exact installed adapter gets a disposable session and one fixed read-only fixture tool with correlated call/result and streamed completion; no shell/network/user-workspace tools or user prompt. Outcome records verification scope, all exposed attempts, coverage and settlement, typed tool/stream/model/effort/route states, immutable input/fixture digests and limitations. Acquire the existing M11 lease only for local/mixed/unknown actual inference using route_qualification scope; use M10 diagnostic receipts without a fake result/trial/decision call. A changed plan needs new consent; metadata inspection never schedules this job.

**Exact-route qualification — R192–R193.**

[CROSS-HARNESS-COMPARISON.md](../CROSS-HARNESS-COMPARISON.md) adds `RouteQualificationPlanV1`, `RouteQualificationOutcomeV1` and `environment.qualify_route -> JobRef`. M03 owns explicit consent/budget, job admission/status/cancellation and structured capability evidence; M04 supplies immutable profile/model/effort facts and M05 owns installed adapter/process/isolation/tool-loop execution. Publish those protocols at Bootstrap and use fixtures until the real producer integration; add no cyclic child dependency. No probe executes on catalog discovery, matrix generation or ordinary setup refresh. This separate targeted probe uses the exact chosen route/model/effort, unlike the existing default-model auth smoke test. Charge/usage belongs to verification accounting, with no synthetic ResultId or benchmark score.

## Integrated requirements

R192, R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R185, R187 — frozen domain profile/evidence contracts: [R185](../quality-judges/MOBILE.md); [R187](../quality-judges/AGENTIC.md).

R167, R172 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

R179, R183, R181, R182 — [benchmark modes](../BENCHMARK-MODES.md); [Cursor](../M05/08-cursor-adapter.md) and [OpenCode](../M05/09-opencode-adapter.md) registry contracts.

`inventory.py` consumes the shared ordered registry `claude_code,codex,grok_cli,pi,cursor_cli,opencode`; every report contains all six rows even when absent/uninspected. Preserve executable vendor/distribution/generation/version evidence: an unrelated `agent` is not Cursor, and the `opencode` name alone does not select V1/V2. Probes remain model-free and never install or mutate personal settings.

`AssessOperation(execute)` requires Git and the frozen commit policy's setup capabilities before any competitor spawn, for both target modes. Manual inspection/current-folder capture/edit/approval bypass model/Git execution gates. Fixture and client tests cover missing Git with successful manual creation, six registry rows, unavailable Cursor/OpenCode capabilities and no false usable defaults. Verify no source-folder Git initialization occurs during inspection.

## Acceptance and faults

**Route/profile acceptance:** Fixtures reject chat-only transport where Responses is required, wrong effort/model, malformed tool correlation, missing stream completion, unbounded known retries, unavailable isolation and changed profile/version consent. Unknown internal attempt/charge coverage stays partial, never falsely capped. Cancel/crash drains and settles or retains server_state_unknown; no benchmark results, grades or automatic retry. Default auth smoke still omits model/effort and denies all tools.

**Domain acceptance:** Add Android-only and declared cross-platform incomplete matrices, text-only static checks with no browser, authorized-but-unavailable agent model/tool access and shared-server uncertainty. Setup/readiness remains model-free and preserves independent competitor, observer and grading gates.

Add fixtures for missing credentials, unknown/unsupported native capabilities, stale profile/model binding and local gateway with remote/unknown upstream. Require explicit READY profile per decision role; metadata inspection starts no model/server, and optional observer failure cannot block competitor launch.

Run:

```sh
pytest tests/readiness/test_rules.py tests/readiness/test_inventory.py tests/readiness/test_inspection.py tests/readiness/test_verification.py tests/readiness/test_probes.py tests/readiness/test_report_repository.py tests/readiness/test_environment_api.py tests/readiness/test_environment_events.py
```

1. Use macOS/Linux host fixtures with all six, absent and unsupported-version harnesses. Found executable plus unknown checks stays undetermined; no harness blocks plan/execute, while injected library/exchange/results/report API services remain callable. A selected rejected login reports that cause, not absence.
2. Offline fixtures keep last-known verification time and cached/bundled source/age without claiming account access. Two same-name accounts/endpoints remain distinct. Missing billing stays unknown and never becomes API or free. Every collector cause has matching guidance; unavailable metrics block no otherwise valid benchmark.
3. Opening/querying/rechecking/planning calls the verifier zero times. Verify without consent calls zero times; consent calls exactly once per included harness, excludes absent/unsupported ones, retains timestamps/log ids, and produces confirmed/auth-rejected/headless-failed/offline/timed-out outcomes. Strict fake M03/M05 verifier signatures require keyword-only `job_id`; assert each target receives the actual returned `JobRef`'s job id unchanged, and record/repository/DTO round trips preserve that id plus M05's scope/invocation id without run/trial fields. Disconnect/cancel/timeout never causes a second call.
4. Read-only version-probe allowlists reject mutating arguments. Inject subprocess timeout/crash and browser metadata failure: show unknown at the failing step and clean up processes. No tests download a browser, install a tool or escalate permissions.
5. Audit a drift fixture: report expected/found modes, SHA-256, folder, template/label and restore/delete remedy without changing modes or the readiness gate. Audit failure is unknown. A collectors-only recheck retains prior revision/harness rows and never invokes the audit.
6. Concurrent partial inspection, verification and catalog update preserve all newer unrelated fields. Inject write/rename failure: no report-update event exposes unsaved state; reload the previous report. Corrupt stored JSON produces a typed inspection failure/recheck path without upgrading any unknown state to usable.
7. Through real clients, round-trip every method/error and registered event. Inject update during snapshot collection, older replay, epoch restart, changed job topic and overflow; no stale report restores a capability. Verify job progress is observed only on the registered job topics and completed verification survives client reconnect.

**Wireframes served, no UI ownership:** Environment, EnvironmentAuthFailed, EnvironmentRechecked, EnvironmentOffline, EnvironmentNoHarness, EnvironmentCollectors; CollectorGuide on M18's page. Supply schema-valid DTO fixtures for all six boards plus first-load, read failure and revision-permission warning.

**Real-provider integration gate:** compose M01 revision storage/restore, M04 catalog discovery, all six M05 adapters and M18 collector probes/guides on macOS and Linux. With controlled test credentials and explicit test-user consent, prove one real minimal verification call per tested harness, process cleanup and outcome/log mapping. Run a temporary approved-revision mode drift/restore cycle; prove no-harness library/ZIP/retained-report flows with real M01/M02/M13/M17 providers. Record untested platform/provider/hardware combinations; fakes never establish support.

**Pending parent obligations:** M03.2 UI; M14 doctor prompt/noninteractive/JSON parity; M16 planner confirmation and candidate refresh; M07 launch gating; all real-provider gates above. M03 is not complete merely because this child passes with fixtures.
