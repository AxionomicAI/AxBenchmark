# M04.1 — catalog-resolution

Parent: [M04 engine contract](../../04-model-catalog.md#1-engine-component). Requirements: R010, R061–R065, R080, R081, R137, R152, R156, R157. Findings: F07/F08 accounting boundaries, F16 account scope, F19 units; consumes F15 contract-first ordering.

Outcome: pure catalog rules and published schemas that preserve scope, uncertainty and provenance. This is proposed implementation work; the acceptance commands below are not recorded test results.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap's importable layout, shared identities/value types, fixture builders and import-boundary checks from the [foundation contract](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries). No running engine, harness or screen is required for pure rules.

**Bootstrap-published contracts, allowed as injected fixtures:** M03 `InstalledHarness`/`AccountObservation`, account fingerprints and inventory status; M05 `DefaultModelReading`, billing observations and requested/effective vocabulary; M07 selection/frozen-evidence inputs; M10/M06 accounting boundary fixtures. M03.1 and M05 adapters need not be implemented to exercise their exact published shapes.

Publish M04's `CatalogSelections`, `CatalogOptions`, `ExchangeRates` and DTOs before their consumers start. Publishing a Protocol does not establish its provider or a working catalog service.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/catalog/domain/context.py`, `entries.py`, `overrides.py`, `pricing.py`, `billing.py`, `rates.py`, `defaults.py`, `resolution.py`, `errors.py`.
- `axbenchmark/engine/catalog/ports.py`, `axbenchmark/engine/catalog/application/interfaces.py` for the parent's store/source/selection/options/rate Protocols.
- Schema-only declarations in `axbenchmark/api/catalog.py`; `axbenchmark/engine/catalog/data/iso4217.yaml` (codes/names only).
- `tests/catalog/test_resolution.py`, `test_override_rules.py`, `test_billing_rules.py`, `test_rate_rules.py`, `test_selection_evidence.py`, `test_catalog_schemas.py`.
- `tests/catalog/fixtures/resolution.json`, `billing.json`, `rates.json`, `selection_evidence.json`.

Keep domain objects free of I/O and API imports. M04.2 owns persistence, application use cases and registrations; M04.3 owns sources/rate services; M04.4 owns presentation. Do not implement cost conversion, verified-zero classification or scoring here.

| Contract | Required behavior |
|---|---|
| Entry/context identity | Harness/version/target/account fingerprint/model distinguish entries. Display labels and changing billing observations never alter keys. |
| Three layers | Applicable override › discovered › bundled, per field. Absence inherits; explicit unknown stops resolution and keeps override provenance. Stale versions remain evidence history only. |
| Prices | Finite nonnegative decimal values and explicit currency; discovered/bundled provider-model prices are shared, entry overrides retain their entry/version scope. Missing prices remain unknown. |
| Billing | AccountKey excludes harness version; declaration › endpoint/status reading › unknown. Value and unknown declarations retain `declared_by_user` and label. Cloud `local` is invalid. |
| Rates | Positive finite `per_usd`, currency units per 1 USD. USD identity is 1 and cannot be overridden. No bundled/historical rate; missing/explicit-unknown remains unknown. |
| Defaults/effort | Context default retains source/date; absent stays unknown. Unknown efforts give only `HarnessDefault`/`OMIT`; requested and effective settings remain distinct. |
| Public evidence/forms | `SelectionEvidence`/`RateSet` are frozen-ready reads, never authentication evidence. Billing/rate forms separately retain mode/value/inherited fields; resolved values cannot reconstruct override intent. |

`validate_override` reports field paths, rejects non-finite/negative prices, inconsistent effort defaults and all-inherit entry drafts. `validate_rate_override` rejects zero/negative/non-finite rates, USD edits, unknown codes and future dates. Inherit removes account/rate declarations. No rule mutates a lower layer.

Schema fixtures include the shared numeric error envelope and `ActionState`; no local copies of shared types. M10 owns cost basis/coverage and frozen conversion; M06 owns `cost_zero_unverified` eligibility. A zero price is permitted metadata, never evidence of a verified zero charge.

## Acceptance and faults

Run:

```sh
pytest tests/catalog/test_resolution.py tests/catalog/test_override_rules.py tests/catalog/test_billing_rules.py tests/catalog/test_rate_rules.py tests/catalog/test_selection_evidence.py tests/catalog/test_catalog_schemas.py
```

1. Resolve the same model id under two accounts, providers/endpoints and harness versions. No metadata leaks across keys; a new observed timestamp changes provenance, not identity. Nonapplicable records never become supported defaults.
2. Cover every field's inherit/value/unknown states. Unknown efforts yield one omit choice; unknown image input rejects a UI-judge capability request; unknown pricing yields no estimate input. A missing model never silently substitutes the default.
3. Declare subscription, unknown, then inherit for account A with two models and two versions. All A selections change together; account B and entry overrides stay unchanged. Cloud `local` is rejected; endpoint-derived local remains distinguishable from a declaration.
4. Resolve COP `4000`, EUR fixture, USD identity and a missing rate. Preserve source URL/source date/retrieval date and supplied labels. Reject editable USD, zero, negative, NaN/infinity and future dates. The package contains no exchange-rate data constant.
5. Accept an explicit zero price, preserve its exact decimal and original provenance in selection evidence, and distinguish it from missing/unknown. Reject invalid prices; assert no catalog field claims `VERIFIED_ZERO`, a converted display amount or ranking eligibility.
6. Round-trip default/billing/rate override forms before and after lower-layer updates. Inherit never becomes a saved copy of a lower value; declared unknown remains labelled as declared. Run schema imports with source/probe adapters unavailable.

**Exact screen states supplied, no screen ownership:** Catalog, CatalogRefreshFailed, CatalogOverride, CatalogBilling, CatalogRates, ModelPicker and ModelPickerUnknown; include unknown capability, stale version, declared-unknown billing and missing-rate fixtures. Load/error/refreshing presentation belongs to M04.4.

**Real-source/provider integration gate:** M04.2–3 must map real M03/M05 inventory/default observations and verified price/rate responses into these exact types. M07/M10/M02/M17 must preserve COP `4000` through launch/retention/export/import and prove conversion; M06 must exercise zero-price eligibility with real accounting. Fixture-only rule tests establish none of those integrations.

**Pending parent obligations:** application/persistence/discovery, live source verification, catalog editors, CLI parity, frozen evidence and accounting/scoring integration. No passing pure test is a claim that a provider, account or effort works.
