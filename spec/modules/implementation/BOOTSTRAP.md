# Bootstrap — publish contracts and the test scaffold

Status: proposed coding task. This document prepares [the 65 implementation children](dependencies.json); it does not assert that runtime code or tests already exist. Product authority is [SPEC](../../SPEC.md); layout, shared invariants and layer rules come from [ARCHITECTURE](../ARCHITECTURE.md). Addresses F15 and establishes the shared boundaries for F01–F14/F18/F19. Cross-cutting requirements: R067–R068, R134, R139–R141, R150, R153–R157; each feature's behavior remains with its parent and children.

**Next coding action:** implement this Bootstrap task in the application checkout root, the directory containing `spec/`, then run the acceptance commands below. All proposed implementation paths in this document are relative to that root; Markdown and manifest paths are relative to `spec/`. Preserve the historical benchmark outputs and source artifacts. This specification change itself creates no application implementation.

## Entry and bounded outcome

Entry requires the reconciled source, architecture, parent schemas and child interfaces. No completed engine module, model call, browser, collector or TUI is needed. Read [the development sequence](../DEVELOPMENT-SEQUENCE.md) and the owner entry conditions before declaring a field or Protocol. The machine graph has one Bootstrap node; do not create extra implementation IDs for these preparation steps.

Finish five steps, in order:

1. Establish package metadata, importable package directories and a deterministic test environment.
2. Publish shared identity/value types and the complete consumed schema/Protocol closure at the owners' paths below.
3. Publish API/client/registry declarations and export their schemas without executing providers.
4. Add schema-valid fixture builders, strict Protocol fakes and import-boundary tests.
5. Run smoke/schema/import acceptance and hand off the six ready children. The recommended next child is [M11.1](M11/01-engine-client-api.md).

Publication means typed data, structural validation, declared signatures and valid/invalid examples. Feature algorithms, canonical writing/hashing, storage, transaction durability, dispatch, sockets, event replay, job execution, launch, judging, scoring, collectors and screens are implemented by their children. An interface declaration or unconditional success stub cannot satisfy a child acceptance criterion. Contract fakes live only in tests; no production provider silently substitutes them.

## Scaffold ownership

| Proposed paths | Bootstrap responsibility and later owner |
|---|---|
| `pyproject.toml` | Python ≥3.12 package `axbenchmark`; pydantic v2 runtime dependency; a `test` extra with pytest, pytest-asyncio, import-linter and a JSON Schema validator; pytest asyncio/marker configuration. Resolve and record exact versions in `requirements-test.lock`. M11/M14 later add working daemon/client console scripts; M15 adds Textual and M14 adds Typer when implemented. Do not point console scripts at absent entry functions. |
| `axbenchmark/__init__.py`; `api/`, `client/`, `engine/`, `engine/shared/`, `engine/shared/domain/`, `engine/daemon/`; owner module packages below, each with `__init__.py` | Importable, side-effect-free package structure. Package initializers export contracts explicitly; they never discover/import adapters. Only create layer directories needed for the published contracts. M09's package is `engine/library/builtin/`. |
| `.importlinter` | Encode the architecture's API/client/interface boundaries, inward module layers and explicit cross-domain vocabulary allowlist. Preserve these rules as owner implementations arrive. |
| `tests/conftest.py`, `tests/contracts/conftest.py`, `tests/contracts/fixtures/__init__.py` | Temporary storage roots, deterministic time/IDs, no real home directory access, explicit fixture registration. No root conftest imports feature adapters. |
| `tests/contracts/test_bootstrap_imports.py`, `test_bootstrap_schemas.py`, `test_bootstrap_protocols.py`, `test_bootstrap_boundaries.py` | Bootstrap acceptance only. M11's later `test_foundation_imports.py`, registry and client tests remain M11-owned. |
| `tests/contracts/fixtures/ids.py`, `clock.py`, `publication.py`, `builders.py`, `invalid_cases.json`, `contract_inventory.json` | Shared deterministic builders and strict fakes; inventory lists each published symbol, authoritative owner/file, consuming children, schema/fixture paths and deferred real-provider gate. Owner-specific vectors remain in child-owned fixture directories. |
| `schemas/api/` | Deterministic exported JSON Schemas for every published DTO plus method/event/topic declaration data. Model source is `axbenchmark/api/`, not generated files. `python -m axbenchmark.api.schema_export --check` checks drift. |
| `axbenchmark/api/schema_export.py` | Pure offline export/check command that imports only API models/declarations and writes only the explicitly requested schema output directory. No runtime registrations or provider discovery. |

These paths are a bootstrap allowance for contract declarations only. The child named as owner takes over its files and extends those declarations additively; ownership does not move into a second shared implementation. Shared-file edits must preserve other owners' symbols. Feature API declarations go in `api/<namespace>.py`; feature registration contributions go in `api/registrations/<namespace>.py`, under an inert `api/registrations/__init__.py`. M11 owns the global `api/registry.py`; there is no competing `api/registry/` package.

## Publish the shared contracts first

| Proposed paths | Required contract content |
|---|---|
| `axbenchmark/engine/shared/domain/ids.py` | RunUid, RunLabel, ConfigurationId, TrialRef, ResultId, InvocationId, JobId and Sha256. Keep UUID identity separate from display label; TrialRef has a 1-based index bounded by the frozen context, not a mutable active-trial default. |
| `axbenchmark/engine/shared/domain/values.py`, `errors.py` | Exact rational/finite-decimal representation, duration/instant values and shared error vocabulary. Domain remains stdlib-only, frozen/slotted and I/O-free; pricing, energy and score calculations stay with M10/M18/M06. |
| `axbenchmark/engine/shared/domain/publication.py`, `events.py`; `axbenchmark/engine/shared/ports.py` | PublicationView, transaction/participant tokens, leases, stable operation IDs/digests, domain event envelope; PublicationTransactions, Clock, IdGenerator and EventPublisher Protocols. Declare single-marker visibility, same-intent prepare retry and read-lease lifetime explicitly. The durable marker adapter `engine/shared/publication.py` is M17.2 work, coordinated with M11 composition. |
| `axbenchmark/api/common.py`, `errors.py` | Wire ID/value counterparts, ActionState, exact values, application error envelope and separate protocol errors. Domain↔DTO conversion belongs to adapters, never domain or clients. Application JSON-RPC errors have integer `-32000` plus `data.code`; preserve field/remedy/details. |
| `axbenchmark/api/events.py`, `jobs.py`, `engine.py`, `registry.py`; `axbenchmark/client/protocol.py`, `errors.py` | M11-owned API/client declarations detailed below. Publish before M15.1 and every feature API test. M11.1 implements clients/dispatch; M11.2 implements event/job/subscription behavior. |

### M11 client and registry publication

`client/protocol.py` publishes the parent's exact `EngineClient` methods: async `call(method, params)`, `subscribe(topics, cursor: EventCursor | None)`, `close()`, and `connection_lost`. Annotate responses/errors against API models only. `client/errors.py` declares `EngineError(code, message, field, remedy, data)` and `ProtocolError(rpc_code, message, data)`; M11.1 supplies codec/transport parity. The connection-loss signal contract accepts a callback and returns an unsubscribe callable; closing a client removes its observers. No engine import is permitted.

`api/events.py` publishes `EventCursor {epoch, seq}`, revisioned changes/tombstones, `Subscription {subscription_id, cursor, mode, reason?, snapshots}`, and `EventEnvelope {subscription_id, cursor, at, name, topic_keys, changes, payload}`. Publish `SubscriptionStream` with `initial: Subscription`, asynchronous iteration over EventEnvelope and async `aclose()`. A resync envelope carries the full replacement Subscription and is applied before any new-generation event. M11.2 implements this stream; M15.1's fake implements the identical interface. Keep the last fully applied cursor, object revisions and subscription generation distinct.

`api/registry.py` publishes MethodSpec, EventSpec, TopicSpec and the API-only Dispatcher Protocol, including typed request/response/payload/snapshot fields, method kind/safety, event routes/coalescing and topic key schemas. Publish `job.progress`, `job.finished`, `run.phase.started`, `run.phase.finished`, `run.state.changed`, and the owner-named event/topic declarations consumed by the first children. Include `job:<job_id>`, `run:<run_uid>`, configuration/live topic patterns and explicit event-only topics. Unknown names are rejected by contract fixture validation; a method declaration never invents an event. Runtime registries and dispatch remain M11.1–2 work.

The registry's schema metadata must be sufficient for fixture request/response validation and later CLI generation. Declarations register no handler and report no provider as available. M11 foundation tests inject their own declared fixture handlers; loading this package never starts a daemon.

## Owner contract publication map

In this table `engine/` and `api/` paths are under `axbenchmark/`. Publish only declarations/data structures and structural schemas at these exact paths; the listed children implement their rules and providers. Use their parent definitions as the authority for all fields, enum members, signatures and errors. `application/interfaces.py` carries public in-engine Protocols; `ports.py` carries injected side-effect ports. A data schema required to annotate one of these interfaces is part of its publication closure, even when its runtime producer is later.

| Owner and implementation children | Exact declaration/schema paths | Publish before consumers |
|---|---|---|
| M01.1–3 | `engine/library/domain/paths.py`, `definition.py`, `manifest.py`; `engine/library/ports.py`, `application/interfaces.py`; `api/templates.py`; `engine/library/schemas/definition-v1.schema.json`, `manifest-v1.schema.json` | RelPath/semantic BaselineFile/definition inputs, FrozenRevision, RevisionReader/Registry/Permissions, TemplateDirectory, publication participant contracts. M01.1 supplies actual canonical codec and vectors. |
| M02.1–2 | `engine/results/domain/records.py`, `bindings.py`, `facts.py`, `reviews.py`, `invalidation.py`, `comparison.py`; `ports.py`, `application/interfaces.py`; `api/results.py`; `engine/results/schemas/retained-result-v1.schema.json`, `run-binding-v1.schema.json`, `run-invalidation-v1.schema.json` | RunBinding/EffectiveResult/TrialGroup, immutable execution facts and append-only review/invalidation shapes; ResultRecorder/RevisionResults/reader, MeasurementFinalizationReceipt/TerminalRetention, prepared registration and guarded ExportBundle/read leases. |
| M03.1 | `engine/readiness/domain/inventory.py`, `findings.py`, `verification.py`; `ports.py`, `application/interfaces.py`; `api/environment.py` | InstalledHarness/AccountObservation and fingerprints, ReadinessReport/ReadinessGate/AssessOperation, InstalledHarnesses/MachineIdentitySource. M04.1 consumes this schema without requiring M03.1's implementation. |
| M04.1–3 | `engine/catalog/domain/context.py`, `entries.py`, `pricing.py`, `billing.py`, `rates.py`, `defaults.py`; `ports.py`, `application/interfaces.py`; `api/catalog.py` | Scoped catalog selection/options, model/default/effort/billing evidence, price/rate snapshots, source/store/rate Protocols; `per_usd` means currency units per USD. |
| M05.1–2, M05.7 | `engine/harness/domain/identity.py`, `invocations.py`, `observations.py`, `outcomes.py`, `environment.py`, `policy.py`, `workspace.py`, `protocol.py`; `ports.py`, `application/interfaces.py`; `api/harness.py` | HarnessInspection/Execution/Resources/Live, typed role scopes (diagnostic JobId vs competitor TrialRef), observation sink/receipt, baseline/protocol/dependency reference shapes, protected judging inputs and snapshot leases. |
| M06.1 | `engine/scoring/domain/weights.py`, `subjects.py`, `models.py`; `ports.py`, `application/interfaces.py`; `api/scoring.py` | WeightValidation/ScoringRules, Population/Analysis with resolved ProfileSpec and full TrialGroups, RankingService and preset contracts. Expected arithmetic stays in M06's reviewed vectors. |
| M07.1–2 | `engine/configs/domain/configuration.py`, `drafts.py`, `presets.py`, `launch.py`, `snapshots.py`; `ports.py`, `application/interfaces.py`; `api/configs.py` | Credential-free frozen launch, draft/setup and price/rate/billing evidence, LaunchRecords, RevisionConfigs prepare/copy/remove, WeightPresets/SavedJudges; published scheduling/judge/monitoring inputs. |
| M08.1–2 | `engine/verification/domain/checks.py`, `observations.py`, `evidence.py`, `regression.py`; `ports.py`, `application/interfaces.py`; `api/verification.py`; `engine/verification/schemas/acceptance-v1.schema.json`, `observation-v1.schema.json` | CheckFormat/CheckIndex, CheckPhase/CheckResult, CheckSummaries/VerificationObservation, EvidenceRef/JudgeEvidence, TaskVerifier and service/reference schemas. Publish requirement/phase/observation/failure-rule structure now; M08.1's runtime still waits for M01/M02/M05. |
| M09.1 | `engine/library/builtin/ports.py`, `application/interfaces.py` | BuiltinCatalog/ContractDescriber and package-description types. Fixture check bytes are test data; executable check sources and a releasable default pin wait for M09.2–3. |
| M10.1–2 | `engine/measurements/domain/observations.py`, `costs.py`, `currency.py`, `accounting.py`, `models.py`, `aggregates.py`, `trials.py`, `finalization.py`; `ports.py`, `application/interfaces.py`; `api/measurements.py` | ObservationReceipt, exact cost/time/coverage/basis/display/rate DTOs, CostAnalysis, MeasurementReader/Finalizer, VerificationObservations and terminal finalizer inputs. No DTO invents complete coverage or turns an estimate zero into verified zero. |
| M11.1–4 | `engine/daemon/ports.py`; `engine/runs/domain/scheduling.py`, `execution.py`, `launch.py`, `state.py`; `engine/runs/ports.py`, `application/interfaces.py`; `api/runs.py`; client/events/registry files above | RunContext/Timeline/ActiveRuns, SchedulingVocabulary/ExecutionDefaults, startup hooks, RunInvalidationCoordinator and terminal coordinator; launch/status/report disposition declarations. No scheduler implementation during Bootstrap. |
| M12.1–2 | `engine/judging/domain/profiles.py`, `rubric.py`, `grades.py`, `requirements.py`, `inputs.py`, `reviews.py`, `settlement.py`; `application/interfaces.py`, `ports.py`; `api/judging.py`; `engine/judging/adapters/prompts/review.schema.json` | ProfileSpec/RubricSource/ProfileCatalog/RubricIndex/JudgeRequirements, review/raw grade and OriginalJudgingSettlement, RunJudging `judge_run/wait/stop/recover/batch_for_run`. The JSON schema is inert data; strict parsing/projection rules are M12.1 and sessions are M12.2. |
| M13.1–4 | `engine/reports/ports.py`, `application/interfaces.py`; `api/reports.py` | CompletionReports.ensure/get/wait, durable report status/outcomes and guarded publication/selection inputs. Fixtures represent pending/failure/skip; no renderer or report job. |
| M14.1, M15.1–2 | `api/registrations/<namespace>.py` declarations owned by the corresponding engine module; `client/protocol.py` above | Registry CLI hints and API request/response/route parameter schemas. Bootstrap creates no screen/widget implementation or fake EngineClient; M15.1 owns that exact fake, compact RunListDetail and test harness. TuiLauncher and navigation implementations remain M14/M15 work. |
| M16.1–3 | `engine/planning/domain/baseline.py`, `requests.py`, `drafts.py`, `definition_input.py`; `ports.py`, `application/interfaces.py`; `api/planning.py` | BaselineSnapshot/reference, versioned DraftStore/DraftApprovalInput/FrozenDraft, prepared approval marker, PlannerRecord and draft-sink Protocol. M16.2 may inject the sink before M16.3 implements it. |
| M17.1–2 | `engine/exchange/ports.py`, `application/interfaces.py`; `api/exchange.py` | Prepared-package/import/export intent and journal interfaces, explicit selected ResultIds and publication participant receipt shapes; reuse M01/M02 schemas and the single publication port. |
| M18.1–2 | `engine/telemetry/domain/capabilities.py`, `guidance.py`, `intervals.py`, `samples.py`, `energy.py`, `sources.py`, `windows.py`, `receipts.py`; `ports.py`, `application/interfaces.py`; `api/telemetry.py` | One CollectorCause enum, capability/guidance/MonitoringChoice, explicit experiment/TrialRef windows, TelemetryFinalizationReceipt, CollectorCapabilities/MonitoringOptions/ExperimentTelemetry/ProcessTracking/EnergySource/TelemetryDescriber. Counter arithmetic is M18.1; sampling/close is M18.2. |

A consumed name absent from the parent's exact schema is an owner-contract defect: record the owner/path/signature, resolve it there, and update affected fixtures before continuing. Do not create a permissive private copy or silently add a completed-provider edge. Cross-domain imports follow the explicit vocabulary allowlist; annotations/Protocol placement must keep domain imports acyclic. API models never import these engine types.

## Deterministic fixtures and acceptance

Bootstrap owns only `tests/contracts/fixtures/`; feature children own their production vectors. `contract_inventory.json` maps every child manifest `contracts` entry to its owner symbols, schema source and at least one valid plus one invalid fixture or strict fake. Avoid snapshotting external live data as an undocumented assumption. Builders include:

- Two different RunUids sharing one label/configuration id; two TrialRefs/results each; wrong/missing scope, out-of-range index and immutable binding conflicts.
- Empty and executable-file baseline/reference closure shapes; a check suite with requirement/phase/observation/failure rule; web/backend profile and raw-review shapes. Reference parser fakes validate actual schemas, declared IDs and missing references.
- Exact USD/COP `per_usd=4000`, reported/estimate/unknown/partial cost and zero bases; telemetry absent/denied/partial receipt shapes. These test field preservation; arithmetic belongs to the owners.
- Prepared/publication tokens, pinned read views and deterministic pause/failure hooks; observation/measurement/telemetry receipts and pending seal/review/retention states. A fake durable acknowledgement is explicitly fixture evidence.
- Cursor epochs/sequences, snapshots, newer/older revisions, tombstones, replacement subscription generations and job initial/latest progress; bad method/event/topic names, application error and protocol error envelopes.

Future Bootstrap acceptance commands, run from the application checkout root after creating the above files:

```sh
python -m pip install -r requirements-test.lock
python -m pip install --no-deps -e .
python -m pytest tests/contracts/test_bootstrap_imports.py tests/contracts/test_bootstrap_schemas.py tests/contracts/test_bootstrap_protocols.py tests/contracts/test_bootstrap_boundaries.py
python -m axbenchmark.api.schema_export --check
lint-imports --config .importlinter
```

The first command uses the exact dependency lock produced in step 1; retain Python/tool versions with the output. The import test uses a fresh interpreter and imports every `contract_inventory.json` symbol plus `client.protocol` and `api.events`. Assert no loaded feature adapter, subprocess/socket/network call, home-directory access, provider registration, GUI or daemon starts. Review-schema JSON is data, never an adapter import. Schema export must be byte-stable and reject malformed scope/envelope examples. Protocol tests make wrong method signatures and DTO shapes fail; fixture providers raise on unexpected methods instead of returning default success.

The boundary test checks `.importlinter` has the API/client/interface and engine-layer rules; a temporary negative-import probe must fail so an empty package tree cannot provide a vacuous pass. Test the exception allowlist for named shared owner domain vocabularies; no blanket cross-module adapter exception is permitted. Restore/remove only the temporary test tree, never application files.

**Exit evidence:** record the file/symbol inventory, exact command output, dependency versions, schema hashes and open owner-contract issues. All five acceptance commands must pass; unresolved contract defects keep Bootstrap pending. M11.1, M15.1, M01.1, M04.1, M12.1 and M18.1 can then begin under the [ready-child rules](../DEVELOPMENT-SEQUENCE.md#selecting-and-finishing-a-child). Prioritize M11.1 → M11.2 → M15.1 → M15.2 for working APIs and screen tests, then follow the graph.

**Remaining real gates:** M11.1–2 must prove actual dispatch/client/jobs/events, M15.1–2 shared widgets/shell and fake-client tests, and each feature its named real provider/platform integrations. Bootstrap establishes no harness, sensor, completed benchmark, parent completion or model/session-capacity guarantee.
