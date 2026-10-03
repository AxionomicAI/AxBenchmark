# M04.1 — catalog-resolution

Parent: [M04 engine contract](../reference/modules/04-model-catalog.md#1-engine-component). Requirements: R010, R061–R065, R080, R081, R137, R152, R156, R157. Findings: F07/F08 accounting boundaries, F16 account scope, F19 units; consumes F15 contract-first ordering.

Outcome: pure catalog rules and published schemas that preserve scope, uncertainty and provenance. This is proposed implementation work; the acceptance commands below are not recorded test results.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap's importable layout, shared identities/value types, fixture builders and import-boundary checks from the [foundation contract](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries). No running engine, harness or screen is required for pure rules.

**Bootstrap-published contracts, allowed as injected fixtures:** M03 `InstalledHarness`/`AccountObservation`, account fingerprints and inventory status; M05 `DefaultModelReading`, billing observations and requested/effective vocabulary; M07 selection/frozen-evidence inputs; M10/M06 accounting boundary fixtures. M03.1 and M05 adapters need not be implemented to exercise their exact published shapes.

Publish M04's `CatalogSelections`, `CatalogOptions`, `ExchangeRates` and DTOs before their consumers start. Publishing a Protocol does not establish its provider or a working catalog service.

Expose catalog metadata as evidence for M12.4's `DecisionEngineProfile`: requested/resolved identity, available artifact revision/digest, quantization/runtime, pricing/usage semantics and supported/unsupported/unknown capability with source/version/time. Keep native decision capability separate from chat, image-name or endpoint heuristics. Catalog evidence cannot override a tested incompatibility or turn a moving alias into a frozen identity. Decision profile refs are independent of normal API-access and harness selections.

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
| Billing | AccountKey excludes harness version; declaration › evidenced inference locality or route/account status reading › unknown. Value and unknown declarations retain `declared_by_user` and label. Cloud `local` is invalid. |
| Rates | Positive finite `per_usd`, currency units per 1 USD. USD identity is 1 and cannot be overridden. No bundled/historical rate; missing/explicit-unknown remains unknown. |
| Defaults/effort | Context default retains source/date; absent stays unknown. Unknown efforts give only `HarnessDefault`/`OMIT`; requested and effective settings remain distinct. |
| Public evidence/forms | `SelectionEvidence`/`RateSet` are frozen-ready reads, never authentication evidence. Billing/rate forms separately retain mode/value/inherited fields; resolved values cannot reconstruct override intent. |

`validate_override` reports field paths, rejects non-finite/negative prices, inconsistent effort defaults and all-inherit entry drafts. `validate_rate_override` rejects zero/negative/non-finite rates, USD edits, unknown codes and future dates. Inherit removes account/rate declarations. No rule mutates a lower layer.

Schema fixtures include the shared numeric error envelope and `ActionState`; no local copies of shared types. M10 owns cost basis/coverage and frozen conversion; M06 owns `cost_zero_unverified` eligibility. A zero price is permitted metadata, never evidence of a verified zero charge.

**Frozen domain contract.** Catalog capability requirements remain explicitly evidenced keys: image_input for web/native or other declared images; unknown/unsupported modality mapping remains unusable, never inferred from model/framework names. Preserve requested/resolved/source/version scope in SelectionEvidence and separate product-agent dependency model references from competitor and grading identities. Human renderer readiness is outside M04 model capability checks.

Extend owned `domain/variants.py`, `lineage.py`, `provenance.py` and `api/catalog.py` with `ModelVariantV1`, `ModelVariantRefV1`, `CheckpointRefV1`, `LineageNodeV1`, `ArtifactManifestV1`, `AdapterCompositionV1`, `QuantizationV1`, `VariantEvidenceV1`, `ClaimV1` and `DateClaimV1`. `SelectionEvidence` carries requested ref, immutable descriptor, resolved manifest, proof coverage, creator/date/source claims and nonblocking review notices. A descriptor is distinct from EntryKey, model selector and execution fingerprint; opaque/partial identity has no complete fingerprint.

Validate the ordered multi-parent DAG and per-node creator roles/date kinds/precision with explicit unknown/unavailable/conflict. Canonical execution identity hashes complete required files, active adapter order/scales/config and execution support configuration; metadata claims have their own snapshot digest. Layered variant overrides retain inherit/value/unknown and alternatives. Never inherit base-model prices/billing or treat a content hash as ancestry, authorship or loaded-model proof.

**Route, comparison and profile interfaces.** Own `domain/access_profiles.py`, `effort_contracts.py`, `existing_profiles.py` and their schema/codec fixtures alongside `api/catalog.py`. Publish immutable `ApiAccessProfileV1`, `ApiRouteHopV1`, `ModelBindingV1`, `EffortContractV1`, `HarnessEffortMappingV1`, `HarnessRouteCapabilityV1`, `RoutedAccessSelectionV1`, `ResolvedAccessPlanV1`, `ExistingAgentProfileRef/V1`, `ExistingAgentProfileInspectionV1`, `ExistingAgentSelectionV1` and `ResolvedExistingAgentPlanV1`. Each exact ref binds ID/version/digest; aliases, transport protocols, upstream model/revision/variant, route hops and inference/gateway locality remain separate fields. `EffortRequest.Contract(ref)` resolves to `EffortArgument.Mapped(mapping_ref)`; native Explicit/HarnessDefault remain unchanged. `SelectionEvidence` gains optional resolved access/existing plans and required-control coverage; unsupported Contract never becomes OMIT. Reject duplicated selector/route/effort conflicts and mismatched harness/role/version. Ordinary existing treatment permits unverified optional inherited declarations and HarnessDefault without a route profile; strict comparison requires a qualified Contract. A profile ID is never a HarnessId or decision-engine profile.

**Access and effort contracts — R192–R193.**

Implement M04's pure profile/model/effort types and rules from [CROSS-HARNESS-COMPARISON.md](../CROSS-HARNESS-COMPARISON.md). Scope resolution/capability caches by immutable route, model binding, harness distribution/version and account evidence. Extend billing resolution with evidenced inference locality; `EndpointRef` and loopback transport cannot imply LOCAL. Exact effort mappings preserve requested native units/levels and emitted fields; unknown and not-applicable differ from default/low/zero. Add typed mapping, independent provider alias, profile version, credential-redaction and local-gateway/remote-inference vectors.

## Integrated requirements

R192, R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R185, R187 — frozen domain profile/evidence contracts: [R185](../quality-judges/MOBILE.md); [R187](../quality-judges/AGENTIC.md).

R167, R168 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

R181, R182 — [benchmark modes](../BENCHMARK-MODES.md); [Cursor](../M05/08-cursor-adapter.md) and [OpenCode](../M05/09-opencode-adapter.md) registry contracts.

Consume all six shared HarnessId values and retain distribution/generation/version in catalog context and capability provenance. Cursor `agent` provenance and OpenCode V1/V2 context cannot be inferred from executable names; unknown defaults, effort/image/role capabilities, usage and billing remain unknown. Fixture data uses fictional models/accounts only. Extend this child's resolution/discovery/picker tests to both new adapters and all six registry entries, including absent/unusable/unsupported-version cases; model-free reads never invoke inference or substitute a default.

## Acceptance and faults

**Route/profile acceptance:** Codec-round-trip all new refs/plans through both client schemas, including native budget versus level versus disabled, wrong-role/harness, unknown required controls, model-alias collision, independent direct/OpenRouter/LiteLLM/chained profiles and immutable version reuse. Preserve unknown optional inherited settings, explicit empty/unset declarations and independent dual credential presence without a fabricated conflict. Reject secrets/private locators in portable projections.

**Variant acceptance:** Add codec/resolution vectors for cycles, unknown parents, multi-root merges, reordered adapters, missing shards/support files, QLoRA versus inference quantization and KV-cache precision. Metadata-only correction preserves execution fingerprint while changing descriptor digest; alias collision and changed required bytes remain distinct. Round-trip role-specific creators and partial/offset dates; explicit unknown stops inference and conflicting claims survive overrides.

**Domain acceptance:** Round-trip native-image supported/unknown/unsupported metadata with source and no browser-viewport assumption; product model names cannot identify the builder or mark an untested native tool/device/evaluation route READY.

Add decision metadata fixtures for unknown native capabilities, discovery versus execution identity, changed artifact bindings and independent role/profile selection. Existing API-access profile success must leave both decision-role enable flags false until their explicit READY System One selection exists.

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
