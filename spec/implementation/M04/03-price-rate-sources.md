# M04.3 — price-rate-sources

Parent: [M04 pricing/rate contract](../reference/modules/04-model-catalog.md#catalog-information-contract). Requirements: R062–R064, R080, R081, R152, R156, R157. Findings: F07 frozen currency, F08 zero-price boundary, F19 rate units.

Outcome: explicit-refresh price/rate sources and stored, frozen-ready snapshots with preserved fallback/provenance. This document specifies proposed work; it does not claim current external formats or live compatibility have been verified.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M04.1](01-catalog-resolution.md), [M04.2](02-catalog-discovery.md) and their M11 foundations. The real refresh coordinator, injection hooks, override persistence and query/error schemas must run first.

**Bootstrap-published contracts, allowed as injected fixtures:** M07 frozen `PriceSnapshot`/`RateSnapshot`, M10 conversion/accounting inputs and M02/M17 retention/export schemas. Their implementations are later gates; use exact owner types, not a second snapshot format.

**Source-format gate before adapter implementation:** inspect current official Anthropic/OpenAI/xAI pricing documentation and the chosen exchange-rate source documentation/response; record source URL, retrieval date, formats, units, coverage and parser expectations. The parent's named source is the proposed binding, not a guarantee of permanent response shape. Verify any changed source choice with the same gate. Do not infer prices from model names or invent missing tiers.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/catalog/adapters/pricing/anthropic.py`, `openai.py`, `xai.py`; `axbenchmark/engine/catalog/adapters/rates/open_er_api.py`.
- `axbenchmark/engine/catalog/adapters/prices_yaml.py`, `rates_yaml.py`, `exchange_rates.py`.
- `axbenchmark/engine/catalog/application/rates.py` (`GetRates`, `SaveRateOverride`) and `snapshots.py` (`ExchangeRates` read-only implementation).
- Source/store/rate-handler bindings only in `axbenchmark/engine/catalog/adapters/composition.py`; reuse M04.2's RPC registrations, refresh coordinator and shared override writer.
- `tests/catalog/test_price_sources.py`, `test_rate_source.py`, `test_price_rate_storage.py`, `test_rate_service.py`, `test_frozen_catalog_inputs.py`.
- `tests/catalog/fixtures/pricing/anthropic.html`, `openai.html`, `xai.html`, `changed_format.html`; `tests/catalog/fixtures/rates/success.json`, `changed_format.json`; `tests/catalog/fixtures/source-manifest.json` records real origins/dates and declared synthetic cases.

`PriceSource.fetch(timeout)` returns provider/model prices or a classified failure. `ExchangeRateSource.fetch(timeout)` returns positive `per_usd` plus the source date or a classified failure. Real adapters make bounded HTTP reads, never model invocations. Provider-source absence is `NO_PRICE_SOURCE`; transport/parse failure is not source absence.

`GetRates`/`catalog.rates` returns every requested code once, with known/unknown state, provenance, override form and action state. `SaveRateOverride`/`catalog.save_rate_override` sends one shared-store mutation for that currency. USD is immutable identity; unknown codes, invalid dates and nonpositive/non-finite values retain the parent's typed field errors.

`ExchangeRates.snapshot(currencies)` resolves stored data and overrides only. M07 owns the union of price currencies and display currency and freezing; M10 owns price→USD→display conversion and ranking amounts. Snapshots preserve unknown rates and supplied/declared labels without consulting a source.

Store prices in their published currency as finite nonnegative decimals; explicit zero remains permitted metadata. Store rates as **currency units per 1 USD**, with COP `4000` as the contract fixture. No reciprocal edit/storage, bundled rate, historical default, float round-trip or missing-value substitution is permitted.

Successful refresh replaces the validated provider price set or discovered rate set. Unparseable/empty/structurally inconsistent responses fail before replacement; do not publish a guessed partial table. Failure preserves valid records and supplied overrides with their age. Missing covered-model prices/currencies remain unknown and `missing_price_currencies` names absent required rates.

Automatic discovery and every run/selection/snapshot path perform zero price/rate fetches. Manual refresh calls each selected provider source once and the exchange-rate source once, through M04.2's job. Rates/source statuses and durable events use its existing publication/error rules.

Recorded-response fixtures exercise published data only; they contain no credentials. Price/rate refresh success certifies neither harness compatibility nor account authentication.

Price resolution remains keyed to the selected provider/model and applicable route/account scope. `ModelVariantRefV1`, lineage ancestors, public-weight licenses and equal execution fingerprints confer no inherited price or billing state. `SelectionEvidence.pricing` and M07 `PriceSnapshot` preserve the selected variant's independently evidenced price or Unknown; M10 alone evaluates cost basis/coverage.

**Route, comparison and profile interfaces.** Extend owned price-source resolution with `AccessPriceScope(profile_ref, ordered_route_digest, account_fingerprint, model_binding_ref, deployment, tier, source_date)`. `SelectionEvidence.pricing` returns that exact scope and provenance or unknown. Direct-provider tables do not fill a gateway charge; an exposed independent gateway fee is a separate price item, while an inclusive gateway amount is an alternative cost basis. Price refresh never qualifies transport/effort or starts a gateway; remote inference behind loopback remains priceable remote work.

## Integrated requirements

R193 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

## Acceptance and faults

**Route/profile acceptance:** Test equal aliases on two routes/accounts, inclusive upstream charge versus separately evidenced fee, missing route prices/currency, unknown inference locality and stale config. No base-model/direct-provider price substitution and no localhost free-price assumption.

**Variant acceptance:** A priced base and an unpriced fine-tune/quantized descendant retain different pricing states; no ancestry traversal supplies the missing price. Equal artifact bytes across accounts preserve distinct billing and route evidence. Unknown price never becomes free hosting or verified zero.

Run offline:

```sh
pytest tests/catalog/test_price_sources.py tests/catalog/test_rate_source.py tests/catalog/test_price_rate_storage.py tests/catalog/test_rate_service.py tests/catalog/test_frozen_catalog_inputs.py
```

1. Parse recorded, dated responses for all three providers and the rate source. Assert exact decimals, currency/model ids, source URL, source date where applicable and retrieval date. Version the fixtures; synthetic changed-format fixtures must be explicitly marked synthetic.
2. Inject timeout, offline/HTTP failure, empty response, changed markup/schema, malformed amount and invalid rate. No partial replacement or fabricated zero occurs; fallback dates/records and all user overrides remain unchanged. Storage failure emits no refreshed success.
3. Refresh providers with and without registered adapters. Missing adapter yields `NO_PRICE_SOURCE`; a failing adapter yields its actual cause. Override › discovered › bundled price resolution and supplied › discovered › unknown rate resolution remain intact.
4. Save COP `4000`, reopen from YAML/API, inherit, declare unknown, and save again. USD stays 1/noneditable; invalid currency, zero/negative/non-finite rate and future date fail by field. Query EUR and missing currency-rate fixtures without reciprocal guessing.
5. Snapshot price currencies plus display currency, then refresh sources/change overrides. Earlier snapshots retain exact prices, rates and declaration labels. `CheckSelection`, automatic refresh and snapshots fail the test if an HTTP fetch occurs.
6. Include zero prices, positive prices with unknown billing and absent prices. Preserve the inputs distinctly; assert this service produces no verified-zero classification or eligibility decision. M10/M06 determine those outcomes at their gate.
7. Through real clients exercise rate forms and errors, source-status events, repeated save and refresh cancellation. Concurrent account/entry/rate saves retain every scope via the existing writer.

**Exact screen states supplied:** Catalog source summaries, CatalogRefreshFailed retained-source banner, CatalogRates known/supplied/unknown/USD/error states, CatalogBilling declared labels and CatalogOverride price-currency fields. Screens and CLI only display returned values.

**Real-source/provider integration gate:** perform a controlled explicit refresh against the verified current sources and retain URL/date/parser evidence; repeat with network disabled and a deliberately invalid recorded response. Separately compose M07/M10/M02/M17: save/freeze/export/import COP `4000`, convert 4000 COP↔1 USD, cover EUR/missing rates, preserve billing labels and prove later refresh cannot alter frozen evidence. M06 verifies unverified-zero exclusion and positive unknown-billing costs using real M10 results.

**Pending parent obligations:** source documentation/format review, each actually exercised live source, M04.4/M14 presentation and all downstream freeze/accounting/export gates. Offline parser fixtures alone do not establish current source availability or supported harness/provider combinations.
