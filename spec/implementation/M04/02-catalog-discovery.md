# M04.2 — catalog-discovery

Parent: [M04 engine/API contract](../reference/modules/04-model-catalog.md#1-engine-component). Requirements: R010, R061–R065, R137, R152, R156, R157. Findings: F16 scope, F04/F05 events/jobs, F15 ordering and F18 error envelope.

Outcome: durable catalog queries/overrides and read-only harness discovery through the engine API, with honest fallback and refresh outcomes. Proposed work; injected sources are not evidence of live provider support.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M04.1](01-catalog-resolution.md), [M03.1](../M03/01-readiness-service.md), M11.1 `engine-client-api` and M11.2 `events-jobs-lifecycle` from the [foundation contract](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries). Real dispatch, job ownership, serialization and typed-cursor subscriptions must be executable.

**Bootstrap-published contracts, allowed as injected fixtures:** M05 `HarnessInspection.list_models(context, timeout) -> ModelListOutcome` including default-model readings/failures; M04 `PriceSource`, `ExchangeRateSource`, `PriceStore`, `RateStore`, `ExchangeRates` and rate-command use-case inputs; M07/M12/M16 selection consumers. Real M05 adapters and M04.3 HTTP sources/rate services are later integration gates.

M03 inventory is a saved observation, never an invitation to probe recursively. Before initial inspection, selection/refresh returns `environment.not_inspected`; after inspection, a missing supported harness gives `catalog.no_supported_harness`. Data queries and override inspection remain available.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/catalog/application/overview.py`, `entries.py`, `options.py`, `selection.py`, `overrides.py`, `refresh.py`, `ensure_fresh.py`, `files.py`, `publication.py`.
- `axbenchmark/engine/catalog/adapters/baseline_yaml.py`, `cache_yaml.py`, `overrides_yaml.py`, `refresh_state_yaml.py`, `readiness_bridge.py`, `rpc.py`, `composition.py`.
- `axbenchmark/engine/catalog/adapters/discovery/claude_code.py`, `codex.py`, `grok.py`, `pi.py`; `axbenchmark/engine/catalog/data/baseline.yaml`.
- `axbenchmark/api/registrations/catalog.py` method/event/topic registrations; this child's implementations use M04.1's `axbenchmark/api/catalog.py` schemas.
- `tests/catalog/test_discovery.py`, `test_catalog_persistence.py`, `test_catalog_queries.py`, `test_catalog_commands.py`, `test_catalog_jobs.py`, `test_catalog_api.py`, `test_catalog_events.py`; `tests/catalog/fixtures/discovery/`.

M11 owns global composition; supply the catalog registration hook. `composition.py` exposes source/store/rate-service injection seams for M04.3, not a private dispatcher. Register all parent methods, with schema-valid injected rate handlers until M04.3 supplies them; claiming complete rate behavior is deferred to that child.

Public API: parent's `catalog.overview/entries/entry/options/check_selection/files`, entry/context/account override commands, and `catalog.refresh` job. Internal interfaces: `CatalogSelections`, `CatalogOptions`; store/clock/event/job ports; `EnsureCatalogFresh`; adapters over the published M03/M05 application interfaces only.

Implement first-launch/version-change discovery with `prices=False`. An explicit refresh includes price/rate steps through injected ports. Queries, run selection and automatic discovery never call HTTP price/rate sources or a model. Missing discovery interfaces, timeout, offline and authentication rejection remain distinct.

An identical normalized context set plus price/rate scope shares a queued/active `JobRef`; a different scope queues separately. Never satisfy a manual refresh with a models-only job or omit newly requested contexts. Cancellation cleans probes/fetches through M11/M05 and retains completed durable steps; disconnect only stops observation.

Serialize each catalog mutation against latest state. Atomic store replacement, classified failure status and provenance dates preserve last-good records/overrides. A malformed override file is reported, never rewritten. Storage failure returns `catalog.persistence_failed` and publishes no success for the failed write; reload never restamps old records as current.

Register `catalog` with the `catalog:overview` revisioned snapshot and all six parent catalog events. Publish durable changes under M11's shared boundary. Follow `job:<job_id>` for progress/terminal events. Test both real clients' integer error envelope, typed cursor, replay, resync, generation and revision handling.

The catalog registration exposes all `can_*` values as shared `ActionState`, and maps domain errors into the numeric JSON-RPC envelope. Entry/account save responses include their returned forms, so clients do not infer saved intent from resolved state.

Real rate-source registration is a composition gate in M04.3; M04.2 fixtures exercise only the source contract and coordinator failure paths.

## Acceptance and faults

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

**Real-provider integration gate:** compose all four M05 adapters with M03.1 on macOS/Linux; record installed versions and inspect actual model/default/billing outputs without model calls. Absent output stays unknown. Compose M04.3 real sources/stores, test offline and failed refresh after valid data, and verify shutdown/cancellation cleanup. Record unsupported/unverified combinations explicitly.

**Pending parent obligations:** M04.3 rates/prices, M04.4 screens, M14 CLI, M07 launch freezing and M10 accounting, plus actual M05 version/provider coverage. Full API registration using injected handlers does not complete these obligations.
