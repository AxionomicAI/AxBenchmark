# M03.1 — readiness-service

Parent: [M03](../../03-environment-readiness.md#1-engine-component). Requirements: R005, R006, R029, R054, R067, R103, R137, R146, R150. Findings: M03 aligned; resolves F15 ordering and consumes F04/F05/F18 shared contracts.

Outcome: an implementer can deliver truthful local readiness, explicit consented verification and the complete `environment.*` API without requiring later provider implementations. This is proposed work; the commands below are future acceptance commands, not recorded passing tests.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap importable package/test layout, contract fixtures and import boundaries; M11.1 `engine-client-api` and M11.2 `events-jobs-lifecycle` from the [foundation contract](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries). Real `InProcessClient`, socket serialization, registry, jobs and typed-cursor subscriptions must run before this child starts.

**Bootstrap-published contracts, allowed as injected fixtures:** M01 `RevisionPermissions.audit` and mode-drift schema; M05 `HarnessInspection.probe/verify`, `HarnessProbe`, `VerificationOutcome`, verification invocation scope and log identity; M04 context-scoped catalog overview/refresh event; M18 capability/guidance schema and its single `CollectorCause` enum. M03 publishes `InstalledHarness`/`AccountObservation`, `ReadinessGate`, `ReadinessReport`, `AssessOperation`, `InstalledHarnesses` and `MachineIdentitySource` before M04's domain work. Publication is not implementation of their providers.

Contract fixtures must include timeouts, unavailable/unknown values, sanitized accounts with distinct fingerprints, every collector cause and drifted revisions. They must fail on unexpected model calls or writes to credentials, tools and revision files. Use the owning modules' schema fixtures, not parallel local DTOs.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/readiness/domain/inventory.py`, `findings.py`, `rules.py`, `verification.py`, `errors.py`; `axbenchmark/engine/readiness/ports.py`.
- `axbenchmark/engine/readiness/application/inspect.py`, `queries.py`, `verify.py`, `interfaces.py`, `publication.py`.
- `axbenchmark/engine/readiness/adapters/subprocess_probe.py`, `playwright_probe.py`, `platform_host.py`, `packaged_guides.py`, `catalog_summaries.py`, `harness_checks.py`, `harness_verifier.py`, `collector_capabilities.py`, `revision_audit.py`, `json_report_repository.py`, `rpc.py`, `composition.py`.
- M03 declarations in `axbenchmark/api/environment.py`, `axbenchmark/api/registrations/environment.py`; guide packaging in `docs/harnesses/claude-code.md`, `codex.md`, `grok-cli.md`, `pi.md` and `docs/runtimes/macos.md`, `linux.md` (provider owners verify command text).
- `tests/readiness/test_rules.py`, `test_inventory.py`, `test_inspection.py`, `test_verification.py`, `test_probes.py`, `test_report_repository.py`, `test_environment_api.py`, `test_environment_events.py`; fixture records in `tests/readiness/fixtures/`.

M11 owns global composition/dispatch; supply a registration function through its hook. Do not create a private client, job runner, event bus, collector or harness process manager.

The parent's API tables and Protocols are normative: queries `report`, `explain`, `assess`, `verification_plan`; jobs `recheck`, `verify`; `JobRef` results and registered environment/job events. Round-trip DTOs and the numeric JSON-RPC error envelope through both clients. Every capability is `ActionState`, and every finding retains source/time/cause. Before inspection, assessment/verification planning return `environment.not_inspected`; a query never initiates inspection.

Reports are host-local observations. Model summaries retain harness/version/provider-or-endpoint/account fingerprint; an observed billing reading passes through unchanged. Collector rows retain M18's actual measurement scope. A diagnostic verification belongs to an M11 job/M05 verification invocation, with `invocation_id` for logs; it has no `RunUid`, `TrialRef`, result, task evidence or benchmark cost.

Inspect only read-only probes. `verification_plan` calls nothing. `verify(consent=false)` fails before dispatch; after explicit consent, call M05 once per target with its record directory and required keyword `job_id: JobId`, taken unchanged from the actual M11 job context through `HarnessVerifier.verify(..., record_dir, job_id=job_id)`. Preserve M05's returned `job_id`, `VerificationScope` and `InvocationId`; never substitute a run/trial identity or parse a directory name to obtain the job. Never retry automatically. Only confirmed responses establish authentication/headless readiness. Offline, rejection, timeout, unsupported and unknown remain distinct; version changes invalidate previous version-specific verification.

Persist `last-report.json` atomically. Merge partial inspection, verification and catalog changes against the latest state under the shared publication boundary; save before publishing. A provider failure creates an explicit row; a repository failure keeps the previous visible report and fails the job. Environment snapshots use `environment:report` revisions and `EventCursor`; jobs use `job:<job_id>`. Disconnecting a client never cancels work.

| Boundary | Contract check |
|---|---|
| Same-scope concurrent recheck | Returns the existing job; another scope queues its own inspection and cannot inherit an incomplete scope. |
| Concurrent verification | Same distinct targets share one job; different targets return `environment.verification_running` and dispatch nothing. |
| Report before first inspection | `NOT_INSPECTED`, four unknown rows and disabled plan/execute capabilities; never pretend the installation inventory is empty. |

## Acceptance and faults

Run:

```sh
pytest tests/readiness/test_rules.py tests/readiness/test_inventory.py tests/readiness/test_inspection.py tests/readiness/test_verification.py tests/readiness/test_probes.py tests/readiness/test_report_repository.py tests/readiness/test_environment_api.py tests/readiness/test_environment_events.py
```

1. Use macOS/Linux host fixtures with all four, absent and unsupported-version harnesses. Found executable plus unknown checks stays undetermined; no harness blocks plan/execute, while injected library/exchange/results/report API services remain callable. A selected rejected login reports that cause, not absence.
2. Offline fixtures keep last-known verification time and cached/bundled source/age without claiming account access. Two same-name accounts/endpoints remain distinct. Missing billing stays unknown and never becomes API or free. Every collector cause has matching guidance; unavailable metrics block no otherwise valid benchmark.
3. Opening/querying/rechecking/planning calls the verifier zero times. Verify without consent calls zero times; consent calls exactly once per included harness, excludes absent/unsupported ones, retains timestamps/log ids, and produces confirmed/auth-rejected/headless-failed/offline/timed-out outcomes. Strict fake M03/M05 verifier signatures require keyword-only `job_id`; assert each target receives the actual returned `JobRef`'s job id unchanged, and record/repository/DTO round trips preserve that id plus M05's scope/invocation id without run/trial fields. Disconnect/cancel/timeout never causes a second call.
4. Read-only version-probe allowlists reject mutating arguments. Inject subprocess timeout/crash and browser metadata failure: show unknown at the failing step and clean up processes. No tests download a browser, install a tool or escalate permissions.
5. Audit a drift fixture: report expected/found modes, SHA-256, folder, template/label and restore/delete remedy without changing modes or the readiness gate. Audit failure is unknown. A collectors-only recheck retains prior revision/harness rows and never invokes the audit.
6. Concurrent partial inspection, verification and catalog update preserve all newer unrelated fields. Inject write/rename failure: no report-update event exposes unsaved state; reload the previous report. Corrupt stored JSON produces a typed inspection failure/recheck path without upgrading any unknown state to usable.
7. Through real clients, round-trip every method/error and registered event. Inject update during snapshot collection, older replay, epoch restart, changed job topic and overflow; no stale report restores a capability. Verify job progress is observed only on the registered job topics and completed verification survives client reconnect.

**Wireframes served, no UI ownership:** Environment, EnvironmentAuthFailed, EnvironmentRechecked, EnvironmentOffline, EnvironmentNoHarness, EnvironmentCollectors; CollectorGuide on M18's page. Supply schema-valid DTO fixtures for all six boards plus first-load, read failure and revision-permission warning.

**Real-provider integration gate:** compose M01 revision storage/restore, M04 catalog discovery, all four M05 adapters and M18 collector probes/guides on macOS and Linux. With controlled test credentials and explicit test-user consent, prove one real minimal verification call per tested harness, process cleanup and outcome/log mapping. Run a temporary approved-revision mode drift/restore cycle; prove no-harness library/ZIP/retained-report flows with real M01/M02/M13/M17 providers. Record untested platform/provider/hardware combinations; fakes never establish support.

**Pending parent obligations:** M03.2 UI; M14 doctor prompt/noninteractive/JSON parity; M16 planner confirmation and candidate refresh; M07 launch gating; all real-provider gates above. M03 is not complete merely because this child passes with fixtures.
