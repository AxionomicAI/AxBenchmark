# M04.2 — catalog-discovery

Parent: [M04 engine/API contract](../reference/modules/04-model-catalog.md#1-engine-component). Requirements: R010, R061–R065, R137, R152, R156, R157. Findings: F16 scope, F04/F05 events/jobs, F15 ordering and F18 error envelope.

Outcome: durable catalog queries/overrides and read-only harness discovery through the engine API, with honest fallback and refresh outcomes. Proposed work; injected sources are not evidence of live provider support.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M04.1](01-catalog-resolution.md), [M03.1](../M03/01-readiness-service.md), M11.1 `engine-client-api` and M11.2 `events-jobs-lifecycle` from the [foundation contract](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries). Real dispatch, job ownership, serialization and typed-cursor subscriptions must be executable.

**Bootstrap-published contracts, allowed as injected fixtures:** M05 `HarnessInspection.list_models(context, timeout) -> ModelListOutcome` including default-model readings/failures; M04 `PriceSource`, `ExchangeRateSource`, `PriceStore`, `RateStore`, `ExchangeRates` and rate-command use-case inputs; M07/M12/M16 selection consumers. Real M05 adapters and M04.3 HTTP sources/rate services are later integration gates.

M03 inventory is a saved observation, never an invitation to probe recursively. Before initial inspection, selection/refresh returns `environment.not_inspected`; after inspection, a missing supported harness gives `catalog.no_supported_harness`. Data queries and override inspection remain available.

Supply model/pricing/capability metadata through published ports to M12.4; it owns immutable decision profiles, probes and the single native System One adapter. Preserve available local artifact binding and discovery source/time without claiming execution attestation. Discovery/profile listing remain model-free, never start/download a server and never mark a generic OpenRouter/LiteLLM route System One-ready. Observed model/runtime drift requires a new profile version before decision dispatch.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/catalog/application/overview.py`, `entries.py`, `options.py`, `selection.py`, `overrides.py`, `refresh.py`, `ensure_fresh.py`, `files.py`, `publication.py`.
- `axbenchmark/engine/catalog/adapters/baseline_yaml.py`, `cache_yaml.py`, `overrides_yaml.py`, `refresh_state_yaml.py`, `readiness_bridge.py`, `rpc.py`, `composition.py`.
- `axbenchmark/engine/catalog/adapters/discovery/claude_code.py`, `codex.py`, `grok.py`, `pi.py`, `cursor.py`, `opencode.py`; `axbenchmark/engine/catalog/data/baseline.yaml`.
- `axbenchmark/api/registrations/catalog.py` method/event/topic registrations; this child's implementations use M04.1's `axbenchmark/api/catalog.py` schemas.
- `tests/catalog/test_discovery.py`, `test_catalog_persistence.py`, `test_catalog_queries.py`, `test_catalog_commands.py`, `test_catalog_jobs.py`, `test_catalog_api.py`, `test_catalog_events.py`; `tests/catalog/fixtures/discovery/`.

M11 owns global composition; supply the catalog registration hook. `composition.py` exposes source/store/rate-service injection seams for M04.3, not a private dispatcher. Register all parent methods, with schema-valid injected rate handlers until M04.3 supplies them; claiming complete rate behavior is deferred to that child.

Public API: parent's `catalog.overview/entries/entry/options/check_selection/files`, entry/context/account override commands, and `catalog.refresh` job. Internal interfaces: `CatalogSelections`, `CatalogOptions`; store/clock/event/job ports; `EnsureCatalogFresh`; adapters over the published M03/M05 application interfaces only.

Implement first-launch/version-change discovery with `prices=False`. An explicit refresh includes price/rate steps through injected ports. Queries, run selection and automatic discovery never call HTTP price/rate sources or a model. Missing discovery interfaces, timeout, offline and authentication rejection remain distinct.

An identical normalized context set plus price/rate and explicit variant-metadata scope/limits shares a queued/active `JobRef`; a different scope queues separately. Never satisfy a manual refresh with a models-only job or omit newly requested contexts. Cancellation cleans probes/fetches through M11/M05 and retains completed durable steps; disconnect only stops observation.

Serialize each catalog mutation against latest state. Atomic store replacement, classified failure status and provenance dates preserve last-good records/overrides. A malformed override file is reported, never rewritten. Storage failure returns `catalog.persistence_failed` and publishes no success for the failed write; reload never restamps old records as current.

Register `catalog` with the `catalog:overview` revisioned snapshot and all six parent catalog events. Publish durable changes under M11's shared boundary. Follow `job:<job_id>` for progress/terminal events. Test both real clients' integer error envelope, typed cursor, replay, resync, generation and revision handling.

The catalog registration exposes all `can_*` values as shared `ActionState`, and maps domain errors into the numeric JSON-RPC envelope. Entry/account save responses include their returned forms, so clients do not infer saved intent from resolved state.

Real rate-source registration is a composition gate in M04.3; M04.2 fixtures exercise only the source contract and coordinator failure paths.

Implement `VariantMetadataSource.inspect(scope, limits, cancellation) -> VariantDiscoveryResultV1` through optional bounded source adapters in `adapters/discovery/`; M04.1 owns normalization. Extend `catalog.entries/entry/options/check_selection`, `save_override` and `refresh` with versioned refs/forms, bounded candidate/lineage/evidence cursors and explicit metadata scope. Cursor identity binds context, filter/sort and descriptor/publication revision; save checks `expected_descriptor_revision`, preserves omitted nonvariant fields and returns the new ref after durable publication. Known requested/resolved contradiction returns `catalog.variant_mismatch`; absent proof returns labelled unverified evidence and review notices.

Discovery uses already-present safe regular files or explicitly configured bounded metadata endpoints only. It cannot download weights, import model code/pickle, load/unload a model, follow arbitrary card URLs or invoke inference. Hash complete required rosters with change-during-read checks; stat-only caching cannot certify unchanged content. Persist safe source pointers/parser/version/retrieval evidence and redaction, retaining last-good observations and conflicting alternatives on failure.

**Route, comparison and profile interfaces.** Own `application/access_profiles.py`, `existing_profiles.py`, `adapters/profile_store.py` and `adapters/launcher_inspection.py` with the existing job/publication registration. Provide `AccessPlanResolver.resolve(selection, role) -> ResolvedAccessPlanV1` and `ExistingAgentResolver.resolve(selection, harness, role) -> ResolvedExistingAgentPlanV1`; reads resolve saved facts without probing. Register `catalog.access_profiles.list/get/save/inspect/capabilities` and `catalog.existing_agent_profiles.list/get/inspect/register`. Save uses expected profile version; static inspect binds explicit source+alias, bounded dependencies/parser digest and JobRef; register requires that exact inspection ID/digest, expected version, reviewed treatment and private local resolution bindings. Revalidate source/dependency/executable digests at registration; publish immutable sanitized version and owner events only after durable success. Inspect only the independently selected source and its explicitly approved dependencies, never enumerate personal shell startup/auth/history. Compile accepted constant argv/env/settings declarations without shell sourcing/eval; dynamic syntax, alias cycles, unknown wrappers and ambiguous sources return typed errors. Registration is separate from benchmark selection and from diagnostics consent.

**Routed access discovery and qualification — R192–R193.**

Implement the M04-owned `catalog.access_profiles.*` operations in [CROSS-HARNESS-COMPARISON.md](../CROSS-HARNESS-COMPARISON.md), including versioned safe profile persistence and model/route metadata discovery. Supply selected immutable inputs to the separate M03 `environment.qualify_route` job; catalog inspection never dispatches inference. Keep model-free discovery separate from bounded consented route/tool-loop probes. Reuse M03/M05/M11 ports and preserve cancellation, idempotence, last-good evidence and exact credential boundaries; do not install or start gateways. Qualify the actual selected model/effort through the selected protocol, not a generic ping or default model. API tests use injected owners; real installed client/gateway/upstream evidence remains a separate gate.

**Existing launcher inspection and registration — R194.**

Implement `catalog.existing_agent_profiles.list/get/inspect/register` and static source handling from [CROSS-HARNESS-COMPARISON.md](../CROSS-HARNESS-COMPARISON.md). Keep local source/credential-resolution records separate from portable snapshots. Parse only the supported declarative shell subset; do not execute aliases, functions, wrappers, substitutions, startup files or provider calls while inspecting. Register immutable sanitized profile versions, effective source precedence evidence and unsupported/unresolved reasons; use explicit source selection and bounded file reads. Test an independently authored fictional alias fixture, unset versus empty variables, credential redaction, nested/dynamic syntax refusal, changed sources and noninteractive alias absence. No installed-provider success is implied by static parsing.

## Integrated requirements

R192, R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R167, R168 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

R181, R182 — [benchmark modes](../BENCHMARK-MODES.md); [Cursor](../M05/08-cursor-adapter.md) and [OpenCode](../M05/09-opencode-adapter.md) registry contracts.

Consume all six shared HarnessId values and retain distribution/generation/version in catalog context and capability provenance. Cursor `agent` provenance and OpenCode V1/V2 context cannot be inferred from executable names; unknown defaults, effort/image/role capabilities, usage and billing remain unknown. Fixture data uses fictional models/accounts only. Extend this child's resolution/discovery/picker tests to both new adapters and all six registry entries, including absent/unusable/unsupported-version cases; model-free reads never invoke inference or substitute a default.

## Acceptance and faults

**Route/profile acceptance:** Fictional temporary aliases/fake executables cover noninteractive alias absence, source drift, unsupported_dynamic, profile_source_ambiguous, profile_control_conflict, credential_precedence_unverified and profile_isolation_unsupported. Fresh installation has no preseeded private-example registration or default. List/get/save/inspect/register make zero inference calls; event/replay/stale-write and local-only credential binding tests use both clients.

**Variant acceptance:** Use fictional Hub/GGUF/adapter metadata plus missing-shard, alias collision, malicious URL/link, oversized and changed-during-hash fixtures. Disable inference/model lifecycle/download ports. Both clients test revision-checked variant-only saves, stale pagination, cancellation/last-good state, explicit unknown and zero-spawn mismatch without an installed-provider claim.

Add decision metadata fixtures for unknown native capabilities, discovery versus execution identity, changed artifact bindings and independent role/profile selection. Existing API-access profile success must leave both decision-role enable flags false until their explicit READY System One selection exists.

Run:

```sh
pytest tests/catalog/test_discovery.py tests/catalog/test_catalog_persistence.py tests/catalog/test_catalog_queries.py tests/catalog/test_catalog_commands.py tests/catalog/test_catalog_jobs.py tests/catalog/test_catalog_api.py tests/catalog/test_catalog_events.py
```

1. First inventory publication starts discovery once; unchanged later startup uses cache; a version change re-probes that context. Exact defaults come only from M05 configuration/status readings. Model invocation ports fail the test if called.
2. Seed valid data and overrides, then inject each discovery failure and a changed harness version. Preserve bytes/source dates, record distinct causes, and expose stale metadata without claiming authentication/support. Refresh for A cannot update B.
3. Save account billing while another client saves model fields or rates through a fixture handler. No scope is lost. Billing declaration survives version change and affects all account models only; model save contains no billing operation. Malformed YAML and write/rename failure preserve visible state and typed remedies.
4. Submit identical, overlapping and manual-versus-automatic refreshes. Only identical complete scopes share a job; queued jobs perform all their requested steps. Cancel during a probe and reconnect: no duplicate work, leaked process, invented completion or automatic retry.
5. Automatic startup, `catalog.check_selection` and options perform zero price/rate fetches. Manual refresh calls each selected provider once and the rate source once; an unconfigured provider yields `NO_PRICE_SOURCE`, while source failures remain outcomes with last-good fallback.
6. Through socket and in-process clients, round-trip every implemented method and registered schema/error. Inject updates between snapshot collection, older replay, epoch restart, overflow and changed topic sets; the newest projection survives and subscriptions observe only registered topics.
7. Before inspection show undetermined readiness; after an empty inventory, selection blocks despite cached entries. Catalog inspection and other injected data workflows remain callable. Discovery cancellation/storage failure never upgrades a capability.

**Exact screen states supplied:** Catalog, CatalogRefreshFailed, CatalogOverride, CatalogBilling, CatalogRates, ModelPicker, ModelPickerUnknown; also first-load, empty context, malformed-override error, unknown capability, stale version, active refresh and cancelled/failed job. UI code belongs to M04.4.

**Real-provider integration gate:** compose all six M05 adapters with M03.1 on macOS/Linux; record installed versions and inspect actual model/default/billing outputs without model calls. Absent output stays unknown. Compose M04.3 real sources/stores, test offline and failed refresh after valid data, and verify shutdown/cancellation cleanup. Record unsupported/unverified combinations explicitly.

**Pending parent obligations:** M04.3 rates/prices, M04.4 screens, M14 CLI, M07 launch freezing and M10 accounting, plus actual M05 version/provider coverage. Full API registration using injected handlers does not complete these obligations.
