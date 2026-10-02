# M04 — Model, effort, and capability catalog

Status: proposed requirements derived from [SPEC.md](../SPEC.md). This module defines required catalog behavior; it does not assert that any particular model, effort, provider, or harness capability currently exists.

## Purpose and boundary

Provide a versioned YAML catalog organized by harness and provider so planner, competitor, and judge selections use explicit compatibility information. Availability and effort support depend on the installed harness version, provider, and account. Matching a model name is insufficient evidence that a configuration works. Allow configured cloud providers and local model endpoints only through harnesses that support them; a reachable endpoint alone does not establish harness compatibility. **[R010, R061]**

The catalog describes evidence available for a selection, while environment discovery and execution establish other readiness conditions. Discovery, offline fallback, unsupported settings, and authentication failures must remain distinguishable. Catalog presence must never be presented as successful authentication or guaranteed execution. **[R137]**

## Catalog information contract

Each entry identifies its model and display name, supported effort values, known default effort, relevant capabilities such as image input, and optional pricing. Include the metadata source, retrieval date, and applicable harness version. Unknown defaults, capabilities, or prices remain unknown; absence of metadata must not manufacture a value. Expose known support, explicit lack of support, and unknown information as different states. **[R062]**

For each harness, provider or endpoint, and account context, the catalog also records the harness's own default model, read from the harness's configuration or status output during refresh without a model call, with its source and retrieval date. It follows the same layer precedence as other fields and stays unknown when the harness does not reveal it. The planner preselects it ([M16](16-custom-template-planning.md)); when it is unknown no model is preselected. A recorded default model never replaces an explicit selection: planner and competitor invocations always name their model. **[R061, R062, R152]**

Pricing comes from each provider's published pricing. During a catalog refresh the user requests, one price source per provider collects the published prices and records them as discovered pricing with the source URL and retrieval date. Bundled prices are the fallback and user overrides take priority, in the same precedence order as other fields. Prices are never fetched during a run; the prices that apply at launch are recorded in the frozen launch evidence through [M07](07-run-configuration.md), so [M10](10-measurements-cost.md) can compute an API-equivalent estimate, labelled with its price source and date, when the harness reports no cost. A failed price refresh keeps the last valid prices and exposes the failure; offline operation uses cached or bundled prices with source and age visible. A provider without a known price, or with a price overridden as unknown, has no price; it is never treated as free. **[R062, R063, R064, R152]**

The first version ships price sources for Anthropic, OpenAI and xAI, the providers behind the supported harnesses. An aggregator gets a price source only if a supported harness uses one as its provider. Every other provider relies on bundled prices and user overrides, and a refresh reports it as having no price source rather than as failed. A failing price source keeps the last valid prices and says so, with the cause and the age of the prices kept. **[R063, R152]**

Each price records its currency. Exchange rates come from an exchange-rate source collected during the same user-requested catalog refresh, never during a run: rates to USD for the currencies the source publishes, stored with the source URL, the source's own date and the retrieval date. A failed rate refresh keeps the last valid rates and exposes the failure; offline operation uses the cached rates with source and age visible. The user may supply a rate per currency through the same override mechanism (inherit, a value, or unknown); a supplied rate takes priority over the collected one and is labelled "supplied by user". The catalog ships no bundled exchange rate, and the historical README rate is never used. At launch [M07](07-run-configuration.md) freezes the rates the catalog resolves for every price currency and the run's display currency; [M10](10-measurements-cost.md) converts with those frozen rates, and a currency without a rate leaves the converted value unknown, never guessed. **[R063, R064, R081]**

Each account context also carries a billing kind: `api`, `subscription`, `local` or `unknown`. The discovered value is what the harness's status output reveals without a model call, as [M05](05-harness-execution-isolation.md)'s probe reads it; a local endpoint is `local`. The user may declare the billing kind per account through the same override mechanism (inherit, a value, or unknown). Precedence is the declaration, then the discovered value, then unknown. A declared kind is labelled "declared by user" wherever a cost basis is shown, and it is user-supplied metadata, not an observation. The resolved kind and its source are part of the selection evidence that [M07](07-run-configuration.md) freezes at launch. Unknown billing never yields a verified $0 ([M10](10-measurements-cost.md)). **[R064, R080, R137]**

Compatibility lookup receives the selected harness and installed version, provider or configured endpoint, account context, and model. Its result carries the applicable catalog information and its support status, rather than resolving solely by display name. Account context establishes the scope of availability information; entries discovered for one context must not become evidence of another account's access. Local endpoints receive the same compatibility treatment as cloud providers. **[R010, R061]**

Maintain three separate sources: a bundled baseline, a discovered cache, and user overrides. Resolve overlapping information in that precedence order, so discovered data supersedes the baseline and explicit overrides take priority. Preserve each source independently; refresh must not overwrite overrides. The resulting selection must retain enough provenance to show which source supplied its information. An override is user-supplied metadata, not evidence that authentication or effective settings were observed. **[R062, R064, R065, R137]**

Each override field has three states: inherit (empty, the lower sources apply), a value, or unknown. Unknown is an explicit statement that stops resolution: the field resolves to unknown with the override as its source, whatever the lower sources say. Unknown efforts leave only the harness-default choice; unknown image input means the model is not accepted as a UI judge; an unknown price means no API-equivalent estimate; an unknown exchange rate means no converted value for that currency; a billing kind declared unknown stays unknown even when the harness reports one. **[R062, R064, R065]**

## Discovery and resolution operations

On first launch, attempt automatic discovery through available harness/provider interfaces. Thereafter use cached catalog data, refreshing when the installed harness version changes or the user explicitly requests refresh. A refresh obtains information applicable to the discovered installation and provider/account context; it must not silently recast old version metadata as newly verified support. **[R061, R063]**

A failed refresh preserves the last valid catalog data and exposes the failure alongside the usable fallback. Offline operation may use cached or bundled entries, with source and age visible. If discovery supplies no information for a capability, preserve that uncertainty instead of inventing support. Refresh success for metadata does not certify account authentication or readiness for a model invocation. **[R062, R063, R137]**

Effort selection offers only values known to be supported for the chosen combination. When effort support is unknown, offer a harness-default option and instruct execution to omit an explicit effort argument. Do not guess a list from another model, provider, account, or harness version. A known catalog default is metadata; it is not proof of the effort an invocation actually used. **[R061, R062, R065]**

Keep requested model and effort settings separate from effective settings. Execution may populate effective settings only when the harness exposes them; otherwise mark them unverified or unknown. A failed invocation must not silently substitute a different model. A refresh or fallback must not turn a rejected request into an apparent successful run under another selection. **[R065]**

## Dependencies and failure behavior

[M03](03-environment-readiness.md) supplies installed harness/version and readiness observations. [M07](07-run-configuration.md) consumes compatibility results for setup and launch validation, and freezes the resolved prices, exchange rates and billing kinds at launch. [M05](05-harness-execution-isolation.md) also supplies, through M03's inventory, the billing kind read from each harness's status output. [M05](05-harness-execution-isolation.md) applies supported endpoint/model selections, omission of unknown effort arguments, and requested/effective reporting. [M15](15-terminal-interface.md) and [M14](14-command-line-interface.md) present metadata, refresh, and failure states as the engine reports them, without evaluating catalog rules themselves. The engine package, API and screens that realize these boundaries follow [the architecture decision](ARCHITECTURE.md) and are specified under Implementation. **[R010, R061, R063, R065, R137]**

When no supported harness is installed, contribute an actionable error that prevents local planning and execution while preserving library browsing, import/export, and saved-result access. Cached models must not bypass that restriction. Explicitly unsupported settings, unknown support, discovery failure, offline fallback, and authentication failure require honest explanations rather than a generic ready indicator. **[R137]**

## Acceptance criteria

- A versioned YAML catalog distinguishes identical model names across harness/provider/account contexts and applicable installed versions, including supported local and cloud configurations. **[R010, R061]**
- Entry inspection exposes every required metadata item and represents known, unsupported, and unknown states without fabricated defaults or pricing. **[R062]**
- First launch attempts discovery; later launches use cache; version changes and manual requests refresh. Failed refresh preserves last-good data; offline fallback shows source and age. **[R063]**
- Overlapping baseline, cache, and override information resolves with overrides highest, and refresh leaves overrides intact. An override field set to unknown resolves to unknown with source override; an empty override field inherits. **[R064]**
- A requested refresh collects published prices per provider with source URL and retrieval date; a failed or offline price refresh keeps the last valid or bundled prices with their age; no run fetches prices, and a missing price is never $0. **[R062, R063, R152]**
- Price sources exist for Anthropic, OpenAI and xAI (and an aggregator only when a supported harness uses one); other providers report no price source and resolve from bundled prices and overrides. **[R152]**
- A requested refresh collects exchange rates to USD with source URL, source date and retrieval date; a failed or offline rate refresh keeps the last valid rates with their age; no run fetches rates; a supplied rate overrides the collected one and is labelled; no bundled or historical rate exists; the rates for every price currency and a requested display currency are available for M07 to freeze, and a currency without a rate resolves to unknown. **[R063, R064, R081]**
- Billing kind per account resolves declaration › discovered › unknown; a local endpoint is `local`; a declared kind carries the "declared by user" label into selection evidence; a declaration of unknown hides a discovered kind. **[R064, R080]**
- The harness's own default model per context is recorded with source and date when the harness's configuration or status output reveals it, without a model call, and stays unknown otherwise. **[R061, R062, R152]**
- Unknown effort support offers harness-default and produces no explicit effort argument. Unsupported efforts are not offered, failures do not substitute models, and requested settings never masquerade as verified effective settings. **[R065]**
- Missing harnesses block local model work while retained-data operations remain accessible; authentication and metadata uncertainty remain visible independently. **[R137]**

## Implementation

This section applies [the architecture decision](ARCHITECTURE.md) to the catalog. Everything below is an implementation decision; the product behavior above stays authoritative.

### 1. Engine component

Package `axbenchmark.engine.catalog`, API namespace `catalog.*`. The catalog is a pure resolver over three independently stored layers plus a discovery job; it holds no long-lived processes.

**Domain** (`engine/catalog/domain/`, frozen dataclasses, no I/O):

| Type or rule | Shape and behavior |
|---|---|
| `CatalogContext` | `harness: HarnessId`, `harness_version: str` (installed), `target: ProviderRef \| EndpointRef`, `account: AccountRef`. `AccountRef` is a non-secret label, fingerprint and `billing_reading: BillingReading \| None` supplied by M03/M05; it never holds credentials. Local endpoints are `EndpointRef` and go through the same rules as cloud providers. **[R010, R061]** |
| `AccountKey` | `harness`, `target`, `account_fingerprint`. Identifies an account across harness versions; billing declarations are keyed by it, so a harness update does not drop a declaration. `account_id` on the API is its stable string form. |
| `BillingKind` | Enum `API`, `SUBSCRIPTION`, `LOCAL`, `UNKNOWN` (wire values `api`, `subscription`, `local`, `unknown`). M10's `Billing` uses the same values. **[R080]** |
| `BillingReading` | `kind: API \| SUBSCRIPTION \| UNKNOWN`, `observed_at`, `observed_from: "status_output"`: what M05's probe read from the harness's non-model status output, passed through M03's inventory. Never guessed; a harness that does not reveal it gives `UNKNOWN`. |
| `BillingOverride` | `account: AccountKey`, `billing: OverrideField[BillingKind]` (value `API`, `SUBSCRIPTION` or `LOCAL`), `saved_at`. `LOCAL` is accepted only for an `EndpointRef` target; a cloud provider account declared `LOCAL` is `catalog.override_invalid` (field `billing`). **[R064]** |
| `resolve_billing(account, reading, override) -> ResolvedBilling` | Override `Value` wins (`source=OVERRIDE`, `declared_by_user=True`); override `Unknown` stops resolution (`UNKNOWN`, `source=OVERRIDE`); otherwise an `EndpointRef` target is `LOCAL` (`source=DISCOVERED`, `observed_from="endpoint"`); otherwise a `BillingReading` of `API` or `SUBSCRIPTION` (`source=DISCOVERED`, `observed_from="status_output"`, `observed_at`); otherwise `UNKNOWN` with no source. `ResolvedBilling` is a `ResolvedField[BillingKind]` plus `declared_by_user: bool` and `label` (engine text such as "subscription · declared by user", "api · harness status 2026-10-01", "local endpoint", "unknown"). Unknown never becomes `API`. **[R064, R080]** |
| `EntryKey` | `context: CatalogContext`, `model_id: str`. The only lookup key; display names are never used for lookup. **[R061]** |
| `Layer` | Enum `OVERRIDE > DISCOVERED > BUNDLED` (ordering is the precedence). **[R064]** |
| `Support` | Enum `SUPPORTED`, `UNSUPPORTED`, `UNKNOWN`. **[R062]** |
| `LayerRecord` | What one layer states about one entry: `layer`, `key`, `applies_to: VersionSpec` (bundled: a declared range such as `3.4.x`; discovered: the exact version probed; override: the version range the user saved it for), `retrieved_at`, `source_ref` (catalog version, harness version or file), and optional fields `display_name`, `efforts: tuple[EffortSupport, ...]`, `default_effort`, `image_input: Support`, `pricing: Pricing`. An absent field means "this layer says nothing", never a value. In an override record a field may also hold `Unknown` (see `OverrideField`). |
| `Pricing` | `currency: CurrencyCode` (the currency the provider publishes in; never converted in the catalog), `input_per_mtok`, `output_per_mtok`, optional `cached_input_per_mtok` and `reasoning_per_mtok` (decimals), `source_url \| None`, `retrieved_at`. Pricing is keyed by provider and model id, not by harness version or account: a `PriceRecord(layer, provider, model_id, pricing)` applies to every context whose target is that provider (`applies_to` any version). Local endpoints have no price records. **[R062]** |
| `PriceRefreshStatus` | Per provider: `last_attempt_at`, `outcome: OK \| FAILED \| OFFLINE \| NO_PRICE_SOURCE \| NOT_ATTEMPTED`, `cause` (`OFFLINE`, `TIMEOUT`, `HTTP_ERROR`, `PARSE_ERROR`), `source_url`, `last_valid_at`, `models_priced`. **[R063]** |
| `apply_prices(prices, provider, result) -> PriceTable` | On success replaces that provider's discovered price records as one set; on any failure, or a result that parses no price, returns the table unchanged, so the last valid prices stay. Never touches bundled or override prices. **[R063, R064]** |
| `CurrencyCode` | Three-letter ISO 4217 code, upper case. `parse_currency(text)` accepts only codes in the packaged ISO 4217 list (`engine/catalog/data/iso4217.yaml`, codes and names only, no rates) and raises `UnknownCurrency` otherwise. USD is the base. **[R081]** |
| `RateRecord` | `layer: DISCOVERED \| OVERRIDE`, `currency: CurrencyCode` (never USD), `per_usd: Decimal` (units of the currency per 1 USD, e.g. COP 4,050; positive and finite), `as_of: date` (the source's own date for a collected rate; the date the user gives for a supplied one), `retrieved_at`, `source_url \| None` (none for a supplied rate). There is no bundled layer: the package contains no exchange rate. **[R064, R081]** |
| `RateRefreshStatus` | One per exchange-rate source: `last_attempt_at`, `outcome: OK \| FAILED \| OFFLINE \| NOT_ATTEMPTED`, `cause` (`OFFLINE`, `TIMEOUT`, `HTTP_ERROR`, `PARSE_ERROR`), `source_url`, `last_valid_at`, `currencies_rated`, `missing_price_currencies` (price currencies in the price table the source did not publish). **[R063]** |
| `apply_rates(table, result) -> RateTable` | On success replaces the discovered rate records as one set; on any failure, or a result that parses no rate, returns the table unchanged, so the last valid rates stay. Never touches supplied rates. **[R063, R064]** |
| `resolve_rate(currency, table, overrides) -> ResolvedRate` | USD → `per_usd = 1`, `source="identity"`. Otherwise an override `Value` wins (`source=OVERRIDE`, label "supplied by user"); an override `Unknown` stops resolution (unknown, `source=OVERRIDE`); otherwise the discovered record; otherwise unknown with no source. `ResolvedRate` is `currency`, `state: KNOWN \| UNKNOWN`, `per_usd \| None`, `source`, `as_of`, `retrieved_at`, `source_url`, `label`. A rate is never derived from another currency's record, a stale default or a constant. **[R064, R081]** |
| `RateSet` | `rates: tuple[ResolvedRate, ...]` for the requested currencies (each requested currency appears once, known or unknown), `refresh: RateRefreshStatus`, `resolved_at`. What M07 freezes as its `RateSnapshot`; the catalog never converts amounts itself. **[R081]** |
| `validate_rate_override(currency, draft) -> RateOverride` | `currency` must parse and must not be USD (`catalog.override_invalid`, field `currency`); a value `per_usd` must be a positive finite decimal (field `per_usd`); `as_of` defaults to today and may not lie in the future (field `as_of`). `Inherit` removes the supplied rate. |
| `DefaultModelRecord` | Context-level: `layer`, `context`, `model_id \| Unknown`, `observed_from` (`harness_config`, `status_output`, `bundled`, `override`), `retrieved_at`, `applies_to`. Resolved with the same precedence as entry fields into `ResolvedField[str]` `default_model`; unknown when no layer states it. Never derived from a model call or from another context. **[R061, R062]** |
| `ResolvedField[T]` | `state: Support` (or known/unknown for scalar fields), `value: T \| None`, `source: Layer \| None`, `retrieved_at`, `applies_to`. `value` is `None` whenever `state` is `UNKNOWN`. |
| `OverrideField[T]` | `Inherit` (the override says nothing; stored as absence), `Value(T)`, or `Unknown`. Used for every override field: `efforts`, `default_effort`, `image_input`, `price_in`, `price_out`, the context-level `default_model`, the account-level `billing` and the per-currency exchange rate. Overridden prices carry `price_currency: CurrencyCode` (default USD), stated once for both price fields. **[R064]** |
| `resolve_entry(records, prices, installed_version) -> ResolvedEntry` | Per field: the highest layer that states the field and whose `applies_to` matches `installed_version` wins; if none does, the field is `UNKNOWN` with no value. An override stating `Unknown` wins like a value and stops resolution: the field is `UNKNOWN`, `value=None`, `source=OVERRIDE`, and lower layers are not consulted. `pricing` resolves from the price records of the context's provider in the same order (override › discovered price source › bundled); an override with an unknown price yields unknown pricing with source override. Records whose version does not match stay attached as provenance (`stale_for_version`) but are not evidence. Absence of metadata never produces a value. **[R062, R063, R064]** |
| `effort_choices(entry) -> EffortChoices` | Known effort list: only `SUPPORTED` values, with the known default marked. Unknown effort support (including efforts overridden as unknown): exactly one choice, `HarnessDefault`, with `effort_argument = OMIT`. Never derived from another key. **[R065]** |
| `EffortRequest` | `Explicit(value)` or `HarnessDefault`. `check_effort(entry, request)` returns the `EffortArgument` (`Pass(value)` or `OMIT`) or raises `EffortUnsupported` / `EffortSupportUnknown`. **[R065]** |
| `SelectionEvidence` | Frozen snapshot of a resolved entry for one selection: key, every `ResolvedField` with provenance, including `pricing` with its currency, layer, `source_url` and `retrieved_at` (or unknown), `billing: ResolvedBilling` (kind, source `override` or `discovered` or none, `declared_by_user`, `observed_at`, `label`), `effort_request`, `effort_argument`, catalog version, refresh status of the context and price refresh status of its provider. This is the "catalog metadata used at launch" that M07 freezes and M02 retains; it contains no credentials and never asserts authentication. **[R065, R137]** |
| `EffectiveSetting[T]` | `requested: T`, `effective: T \| None`, `state: OBSERVED \| UNVERIFIED \| UNKNOWN`. Vocabulary only; M05 fills it from what the harness exposes. **[R065]** |
| `RefreshStatus` | Per context: `last_attempt_at`, `outcome: OK \| FAILED \| OFFLINE \| NOT_ATTEMPTED`, `cause: DiscoveryFailure \| None`, `last_valid_at`, `last_valid_version`. `DiscoveryFailure` kinds stay distinct: `OFFLINE`, `TIMEOUT`, `AUTH_REJECTED`, `NO_DISCOVERY_INTERFACE`, `HARNESS_MISSING`, `PROBE_ERROR`. **[R063, R137]** |
| `refresh_needed(context, status, cache) -> RefreshReason \| None` | `FIRST_LAUNCH` when the context has never been attempted, `VERSION_CHANGED` when the installed version differs from `last_valid_version`, else `None`. **[R063]** |
| `apply_discovery(cache, context, result) -> Cache` | On success replaces only that context's discovered records; on failure returns the cache unchanged. Never touches overrides. **[R063, R064]** |
| `validate_override(draft, lower) -> Override` | Each field is `Inherit`, `Unknown` or a value. A value for efforts parses to a non-empty set; a default-effort value must be one of the efforts the entry resolves to with this override applied (`lower` supplies the inherited efforts), and is rejected when efforts resolve to unknown; price values are non-negative decimals and `price_currency` must parse as a `CurrencyCode` (field `price_currency`). Errors carry field paths. An all-`Inherit` draft is rejected with `catalog.override_empty` (removing is `catalog.remove_override`). |

**Ports** (`engine/catalog/ports.py`):

```python
class BaselineSource(Protocol):
    def load(self) -> Baseline: ...                       # bundled, read-only, carries catalog_version

class DiscoveredCache(Protocol):
    async def load(self) -> Cache: ...
    async def save(self, cache: Cache) -> None: ...         # atomic replace

class OverrideStore(Protocol):
    async def load(self) -> Overrides: ...
    async def save(self, overrides: Overrides) -> None: ...

class RefreshStateStore(Protocol):
    async def load(self) -> dict[CatalogContext, RefreshStatus]: ...
    async def save(self, states: dict[CatalogContext, RefreshStatus]) -> None: ...

class ModelDiscoverer(Protocol):                          # adapter over M05's HarnessInspection.list_models
    async def discover(self, ctx: CatalogContext, timeout: timedelta) -> DiscoveryResult: ...
    # DiscoveryResult carries the models and the harness's default model reading (model id, observed_from), if any

class PriceSource(Protocol):                              # one adapter per provider
    provider: ProviderId
    source_url: str
    async def fetch(self, timeout: timedelta) -> PriceFetchResult: ...   # prices per model id, or a classified failure

class PriceStore(Protocol):
    async def load(self) -> PriceTable: ...                 # discovered price records and PriceRefreshStatus per provider
    async def save(self, table: PriceTable) -> None: ...    # atomic replace

class ExchangeRateSource(Protocol):                       # one configured source
    source_url: str
    async def fetch(self, timeout: timedelta) -> RateFetchResult: ...    # per_usd per currency with the source's as_of, or a classified failure

class RateStore(Protocol):
    async def load(self) -> RateTable: ...                  # discovered RateRecords and the RateRefreshStatus
    async def save(self, table: RateTable) -> None: ...     # atomic replace

class InstalledHarnesses(Protocol):                       # adapter over M03's InstalledHarnesses.list() and ReadinessGate
    async def contexts(self) -> Sequence[CatalogContext]: ...   # AccountRef carries the BillingReading, if any
    async def any_supported_installed(self) -> bool: ...
```

Plus the shared `Clock`, `EventPublisher` and `JobRunner` ports from `engine/shared` and `engine/daemon`.

**Offered to other modules** (application interface, not an API method):

```python
class ExchangeRates(Protocol):                            # used by M07 (launch freeze, display-currency validation)
    async def snapshot(self, currencies: Iterable[CurrencyCode]) -> RateSet: ...   # reads the stored table and supplied rates; never fetches
    def parse_currency(self, text: str) -> CurrencyCode: ...                      # raises catalog.unknown_currency
```

**Use cases** (`engine/catalog/application/`, one class each, ports injected in `__init__`):

| Use case | Kind | Does |
|---|---|---|
| `GetCatalogOverview` | query | Lists contexts (harness › provider/endpoint · account) with installed version, catalog version, refresh status, resolved default model, resolved billing kind, override count and capability flags, plus the price refresh status per provider and the rate refresh status. |
| `GetRates` | query | Resolves `resolve_rate` for the requested currencies (default: USD, every price currency in the price table and every currency with a collected or supplied rate) with the rate refresh status. Backs `catalog.rates` and `ExchangeRates.snapshot`. **[R081]** |
| `ListEntries` | query | Resolves every entry of one context, optionally filtered by model-id substring. |
| `GetEntry` | query | One resolved entry with its per-layer records (the sources table), effort choices and override form values. |
| `GetEffortChoices` | query | For a harness + target + account: models with their `EffortChoices`, and the context's resolved `default_model`. Raises `catalog.no_supported_harness` when M03 reports none installed, so cached data cannot bypass the block. **[R137]** |
| `CheckSelection` | query | Resolves a selection and an `EffortRequest` into `SelectionEvidence` (billing through `resolve_billing` for the selection's `AccountKey`) or a typed error. Used by M07 validation, M12 capability checks and M16 preselection. |
| `SaveOverride` / `RemoveOverride` | command | Validate and write the override layer only. |
| `SaveContextOverride` | command | Validate and write the context-level `default_model` override (`Inherit` removes it, `Unknown`, or a model id). |
| `SaveAccountOverride` | command | Validate and write the account-level `billing` declaration for an `AccountKey` (`Inherit` removes it, `Unknown`, or `api` / `subscription` / `local`). Applies to every harness version of that account. **[R064]** |
| `SaveRateOverride` | command | `validate_rate_override`, then write or remove the supplied rate for one currency. **[R064, R081]** |
| `RefreshCatalog(contexts, prices)` | job | For each requested context: probe via `ModelDiscoverer`, `apply_discovery` (models and default-model reading), persist cache and status, emit events. With `prices` (every user-requested refresh), also runs the `PriceSource` of each distinct provider among those contexts, applies `apply_prices`, persists the price table and status, emits `catalog.prices.refreshed`; a provider without an adapter is recorded as `NO_PRICE_SOURCE`. With `prices` it also runs the `ExchangeRateSource` once, applies `apply_rates`, computes `missing_price_currencies` against the price table, persists the rate table and status, and emits `catalog.rates.refreshed`. One running refresh per context; a second request returns the running job's `JobRef`. **[R063, R081]** |
| `EnsureCatalogFresh` | internal | Run at engine start and on `environment.harness.changed`: starts `RefreshCatalog(prices=False)` for every context where `refresh_needed` is not `None`. Not exposed as an API method. Automatic refreshes never fetch prices or rates: price and rate sources run only in a refresh the user requested, and never from a run (M11 launches read the stored tables through `CheckSelection` and `ExchangeRates.snapshot`). **[R063]** |
| `GetCatalogFiles` | query | Returns the paths and text of the baseline, cache, price, rate and override YAML for read-only display. |

**Adapters** (`engine/catalog/adapters/`):

| Adapter | Implements |
|---|---|
| `baseline_yaml.py` | `BaselineSource` over the packaged resource `engine/catalog/data/baseline.yaml`, which carries `catalog_version` (e.g. `2026.09.2`) and `retrieved_at`, bundled per-harness default models where known, and bundled prices per provider with their `source_url` and `retrieved_at` (the fallback layer). |
| `pricing/anthropic.py`, `openai.py`, `xai.py` | `PriceSource`, the first-version set: the providers behind the supported harnesses. Each fetches the provider's published pricing page (`httpx`, default timeout 20 s) and parses per-model prices in the currency the page states; a page change that parses no price is `PARSE_ERROR`, never a guessed or partial table. Records `source_url` and `retrieved_at`. Makes no model call and needs no credentials. An aggregator adapter (for example `pricing/openrouter.py`) is added only when a supported harness uses that aggregator as its provider. Every other provider has no adapter: `RefreshCatalog` records it as `NO_PRICE_SOURCE` and its prices resolve from the bundled layer and overrides. **[R152]** |
| `prices_yaml.py` | `PriceStore` under `~/.axbenchmark/catalog/`, temp-file-and-rename. |
| `rates/open_er_api.py` | `ExchangeRateSource`, the default source: `GET https://open.er-api.com/v6/latest/USD` (`httpx`, default timeout 20 s, no credentials), which publishes units per 1 USD for every currency it covers and its own update time. Maps each published code that parses as a `CurrencyCode` to a `RateRecord` (`as_of` from the source's update time, `retrieved_at` now, `source_url` the request URL); a response that is not a success or parses no rate is `PARSE_ERROR`. The composition root binds exactly one `ExchangeRateSource`; another source is another adapter of the same port. **[R081]** |
| `rates_yaml.py` | `RateStore` under `~/.axbenchmark/catalog/`, temp-file-and-rename. |
| `cache_yaml.py`, `overrides_yaml.py`, `refresh_state_yaml.py` | YAML stores under `~/.axbenchmark/catalog/`, written by temp-file-and-rename. A malformed override file is reported as `catalog.override_file_invalid` and never rewritten by the engine. |
| `discovery/claude_code.py`, `codex.py`, `grok.py`, `pi.py` | `ModelDiscoverer`, each delegating to M05's `HarnessInspection.list_models` so harness invocation stays in M05. They map probe outcomes to `DiscoveryResult` with the failure kinds above; only what the harness reports is recorded (unreported efforts stay absent). The default model comes from the reading M05's `list_models` returns from the harness's configuration or status output; none is inferred. Default probe timeout 20 s. |
| `readiness_bridge.py` | `InstalledHarnesses` over M03's `InstalledHarnesses` and `ReadinessGate`; maps each account's billing kind reading (M05's probe, carried in M03's inventory) to `BillingReading`, or `None` when the inventory has none. |
| `exchange_rates.py` | `ExchangeRates` for other modules, over `GetRates` and `parse_currency`. |
| `rpc.py` | Registers the `catalog.*` methods, maps DTOs to use-case inputs and domain errors to the codes below. |

**Persisted state** (engine is the only reader and writer):

| File | Content | Written by |
|---|---|---|
| `~/.axbenchmark/catalog/discovered.yaml` | `schema: 1`; discovered `LayerRecord`s and `DefaultModelRecord` per context with exact harness version and `retrieved_at`. | `RefreshCatalog` on success only |
| `~/.axbenchmark/catalog/prices.yaml` | `schema: 1`; discovered `PriceRecord`s per provider with `source_url` and `retrieved_at`, and `PriceRefreshStatus` per provider. | `RefreshCatalog` with prices; the records only on success |
| `~/.axbenchmark/catalog/rates.yaml` | `schema: 1`; discovered `RateRecord`s (`currency`, `per_usd`, `as_of`, `retrieved_at`, `source_url`) and the `RateRefreshStatus`. | `RefreshCatalog` with prices; the records only on success |
| `~/.axbenchmark/catalog/overrides.yaml` | `schema: 1`; override `LayerRecord`s per `EntryKey` and version range, with `unknown` for fields overridden as unknown and `price_currency` beside overridden prices; context-level `default_model` overrides; `accounts:` billing declarations per `AccountKey` (`api`, `subscription`, `local` or `unknown`, `saved_at`); `rates:` supplied rates per currency (`per_usd` or `unknown`, `as_of`, `saved_at`). | `SaveOverride`, `RemoveOverride`, `SaveContextOverride`, `SaveAccountOverride`, `SaveRateOverride` |
| `~/.axbenchmark/catalog/refresh-state.yaml` | `RefreshStatus` per context. | `RefreshCatalog` |

**Owned processes**: none persistent. Discovery probes are short-lived subprocesses started through M05 inside the `RefreshCatalog` job and supervised by the daemon's job runner (M11); cancelling the job terminates them and any pending price or rate fetch.

### 2. API surface

DTOs live in `axbenchmark.api.catalog`. Every resolved field crosses the API as `FieldDTO {state: "supported"|"unsupported"|"unknown"|"known", value?, source?: "override"|"discovered"|"bundled", retrieved_at?, applies_to?, source_url?}`; an unknown field has no `value`, and one overridden as unknown carries `source: "override"`. Pricing is a `FieldDTO` whose value is `PricingDTO {currency, input_per_mtok, output_per_mtok, cached_input_per_mtok?, reasoning_per_mtok?}` and whose `source_url` names the published page; `currency` is any ISO 4217 code. Billing crosses as `BillingDTO {kind: "api"|"subscription"|"local"|"unknown", source?: "override"|"discovered", declared_by_user: bool, observed_from?: "status_output"|"endpoint", observed_at?, label}`; interfaces show `label` (e.g. "subscription · declared by user") verbatim wherever billing or a cost basis appears. A rate crosses as `RateDTO {currency, state: "known"|"unknown", per_usd?, source?: "identity"|"discovered"|"override", supplied_by_user: bool, as_of?, retrieved_at?, source_url?, label}`, and the rate refresh as `RateStatusDTO {outcome, cause?, source_url, retrieved_at?, last_valid_at?, currencies_rated, missing_price_currencies}`. Override inputs are `OverrideValue = "inherit" | "unknown" | {value: T}`.

**Queries** (safety `read`):

| Method | Request | Response | Errors | Capability flags |
|---|---|---|---|---|
| `catalog.overview` | — | `CatalogOverview {catalog_version, bundled_at, precedence, contexts: [ContextDTO {context_id, harness, harness_version, target, account_id, account_label, applies_label, refresh: RefreshStatusDTO, default_model: FieldDTO (value model id; `observed_from`), billing: BillingDTO, model_count, override_count}], prices: [PriceStatusDTO {provider, outcome, cause?, source_url, retrieved_at?, last_valid_at?, models_priced}], rates: RateStatusDTO}` | `catalog.override_file_invalid` (returned as a field, not raised, so the overview still renders) | per context: `can_refresh` + `reason` (`environment.no_harness`, `catalog.refresh_running`), `can_declare_billing` |
| `catalog.entries` | `context_id`, `name_filter?` | `EntryList {context, rows: [EntryRowDTO {model_id, display_name, efforts, default_effort, image_input, pricing, top_source}]}` | `catalog.unknown_context` | — |
| `catalog.entry` | `context_id`, `model_id` | `EntryDetail {key, fields, effort_choices, run_effect ("pass" \| "omit"), layers: [LayerRowDTO {layer, says, retrieved_at, source_ref, source_url?, stale_for_version}], override_form: OverrideDraftDTO {per field: mode ("inherit" \| "value" \| "unknown"), value?, inherited: FieldDTO (what the lower layers resolve to)}}` | `catalog.unknown_context`, `catalog.entry_not_found` | `can_override`, `can_remove_override` |
| `catalog.options` | `harness`, `target`, `account_id` | `EffortOptions {context, default_model: FieldDTO, models: [ModelOptionDTO {model_id, summary, top_source, is_harness_default, choices: [EffortChoiceDTO {value \| "harness_default", is_catalog_default}], effort_support: "known"\|"unknown"}]}` | `catalog.no_supported_harness`, `catalog.harness_not_installed`, `catalog.unknown_context` | per model: `can_select` + `reason` |
| `catalog.check_selection` | `harness`, `target`, `account_id`, `model_id` (required; no default-model shortcut), `effort: {explicit: str} \| "harness_default"`, `require?: ["image_input"]` | `SelectionEvidenceDTO {key, fields (including `pricing` with currency, source and date, or unknown), billing: BillingDTO, effort_argument: {pass: str} \| "omit", catalog_version, refresh, price_refresh}` | `catalog.no_supported_harness`, `catalog.model_not_in_catalog`, `catalog.effort_unsupported`, `catalog.effort_support_unknown`, `catalog.capability_unsupported`, `catalog.capability_unknown` (each with `field` and `remedy`) | — |
| `catalog.rates` | `currencies?: [str]` (default as in `GetRates`) | `RateTable {base: "USD", rates: [RateDTO], refresh: RateStatusDTO}`; every requested currency appears, unknown when no rate resolves | `catalog.unknown_currency` (field `currencies`) | per rate: `can_supply` |
| `catalog.files` | — | `CatalogFiles {files: [{layer, path, text}]}` | — | — |

**Commands**:

| Method | Request | Response | Errors | Safety |
|---|---|---|---|---|
| `catalog.save_override` | `context_id`, `model_id`, `efforts: OverrideValue[list[str]]`, `default_effort: OverrideValue[str]`, `image_input: OverrideValue["supported"\|"unsupported"]`, `price_in: OverrideValue[Decimal]`, `price_out: OverrideValue[Decimal]` (each defaults to `"inherit"`), `price_currency?: str` (default `USD`; used when a price is a value) | `EntryDetail` | `catalog.override_invalid` (field paths `efforts`, `default_effort`, `price_in`, `price_out`, `price_currency`), `catalog.override_empty`, `catalog.unknown_context`, `catalog.override_file_invalid` | write |
| `catalog.save_context_override` | `context_id`, `default_model: OverrideValue[str]` | `ContextDTO` | `catalog.override_invalid` (field `default_model`), `catalog.unknown_context`, `catalog.override_file_invalid` | write |
| `catalog.save_account_override` | `harness`, `target`, `account_id`, `billing: OverrideValue["api"\|"subscription"\|"local"]` | `AccountDTO {account_id, account_label, harness, target, billing: BillingDTO, contexts: [context_id]}` | `catalog.override_invalid` (field `billing`, e.g. `local` for a cloud provider), `catalog.unknown_account`, `catalog.override_file_invalid` | write |
| `catalog.save_rate_override` | `currency`, `rate: OverrideValue[Decimal]` (units per 1 USD), `as_of?: date` | `RateDTO` | `catalog.override_invalid` (fields `currency`, `per_usd`, `as_of`), `catalog.unknown_currency`, `catalog.override_file_invalid` | write |
| `catalog.remove_override` | `context_id`, `model_id` | `EntryDetail` | `catalog.override_not_found`, `catalog.override_file_invalid` | destructive |

**Jobs**:

| Method | Request | Returns | Progress and result | Errors | Safety |
|---|---|---|---|---|---|
| `catalog.refresh` | `context_ids?`, `harness?`, `provider?` (filters resolved by the engine; all contexts when none is given) | `JobRef` (the running job's ref if one already covers the contexts) | `job.progress` per context probed, per provider priced and for the rate source; `job.finished` with `RefreshReport {contexts: [{context_id, outcome, cause?, entries_changed, default_model_changed, last_valid_at}], prices: [PriceStatusDTO], rates: RateStatusDTO}`. A user-requested refresh always runs the price sources of the providers of the selected contexts and the exchange-rate source. A per-context, per-provider or rate failure is an outcome, not a job error. | `catalog.no_supported_harness` (at submit) | write |

**Events**:

| Event | Payload | Emitted when |
|---|---|---|
| `catalog.refresh.started` | `context_id`, `reason: "manual" \| "first_launch" \| "version_changed"`, `job_id` | A context probe starts |
| `catalog.refresh.finished` | `context_id`, `outcome`, `cause?`, `last_valid_at`, `entries_changed` | A context probe ends (success, failure or offline) |
| `catalog.prices.refreshed` | `provider`, `outcome`, `cause?`, `source_url`, `last_valid_at`, `models_priced` | A provider's price source ends (success, failure or offline) |
| `catalog.rates.refreshed` | `outcome`, `cause?`, `source_url`, `last_valid_at`, `currencies_rated`, `missing_price_currencies` | The exchange-rate source ends (success, failure or offline) |
| `catalog.override.saved` | `scope: "entry" \| "context" \| "account" \| "rate"`, `context_id?`, `model_id?`, `account_id?`, `currency?` | `catalog.save_override`, `catalog.save_context_override`, `catalog.save_account_override` or `catalog.save_rate_override` succeeds |
| `catalog.override.removed` | `context_id`, `model_id` | `catalog.remove_override` succeeds |

Subscription snapshot for topic `catalog`: the `CatalogOverview`.

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `InstalledHarnesses.list()` (installed harnesses, versions, providers/endpoints, non-secret account fingerprints, and per account the billing kind `api \| subscription \| unknown` with its observation time, as M05's `HarnessInspection.probe` read it from the non-model status output) and `ReadinessGate.has_supported_harness()` (no-harness state, M03's own rule) | M03 | Build `CatalogContext`s; enforce the no-harness block **[R137]** |
| `environment.harness.changed` event | M03 | Trigger `EnsureCatalogFresh` on version change **[R063]** |
| `HarnessInspection.list_models(context, timeout) -> ModelListOutcome` (classifies offline, timeout and authentication rejection; carries `default_model: DefaultModelReading \| None` read from the harness's configuration or status output without a model call) | M05 | Discovery without M04 invoking harness CLIs itself |
| `JobRunner` port, `jobs.get`, `jobs.cancel`, `events.subscribe`, `job.progress`, `job.finished` | M11 | Run and observe `catalog.refresh` |
| `configs.add_entry` | M07 | Issued by `EntryPickerScreen` to add the chosen entry |
| Freezing `SelectionEvidence` (with `pricing` including its `currency`, layer or unknown, `source_url`, `retrieved_at`, `billing: ResolvedBilling` with its source and `declared_by_user`, and price refresh status) into the launch record as `PriceSnapshot` | M07 | Prices and billing in frozen launch evidence for M10's API-equivalent estimate and verified-$0 rule |
| Freezing `ExchangeRates.snapshot(price currencies ∪ {display_currency})` as `RateSnapshot` beside `PriceSnapshot` at launch; validating `display_currency` with `ExchangeRates.parse_currency` | M07 | M10 converts price currency → USD → display currency with frozen rates only; a missing rate gives `no_rate_conversion`, never a guess **[R081]** |
| `FileViewScreen` (read-only text viewer) and `StateSwitcher` | M15 | `y` / Open catalog YAML; loading/empty/error states |

Consumers of this namespace: M07 (`catalog.options`, `catalog.check_selection`, freezes `SelectionEvidence` including pricing and billing, freezes `RateSnapshot` from `ExchangeRates.snapshot`), M14 (`models refresh` rate lines, `models rates`, `models rate`, `models billing`), M12 (`catalog.check_selection` with `require: ["image_input"]`; image input overridden as unknown returns `catalog.capability_unknown`, so the model is not accepted as UI judge), M16 (`catalog.options` `default_model` for planner preselection; an unknown default preselects nothing), M10 (pricing with currency, source and date, billing with its "declared by user" label, and rates, all from frozen evidence; unknown pricing means no estimate, unknown billing never verified $0), M02 (retains frozen evidence), M05 (consumes `effort_argument` and the `EffectiveSetting` vocabulary), M03 (`catalog.overview` refresh status in Environment).

### 4. Screens

All catalog screens are pure views: they show `FieldDTO`, `BillingDTO` and `RateDTO` states, sources and capability flags exactly as returned and display typed errors verbatim. None resolves precedence, filters efforts, converts currencies or decides whether a model is usable.

**`CatalogScreen(Screen)`** — `axbenchmark/tui/screens/catalog.py`; artboards Catalog (wide, compact) and CatalogRefreshFailed.

- View model `tui/viewmodels/catalog.py`:
  ```python
  @dataclass(frozen=True)
  class CatalogVM:
      bar: str                          # #catalog-bar text, from overview + selected context refresh
      bar_failed: bool                  # refresh.outcome in {failed, offline}
      tree: list[ContextNodeVM]         # #providers / compact #provider options
      provider_facts: list[tuple[str, str]]   # account, billing label (BillingDTO.label, e.g. "subscription · declared by user"),
                                              # harness, applies_label, source + age, default model + source, price source + age,
                                              # exchange rates source + age (RateStatusDTO)
      rows: list[EntryRowVM]            # #models; unknown cells carry class "unknown"
      detail: EntryDetailVM | FailureVM | None   # #entry-detail
      can_refresh: Capability; can_override: Capability; can_declare_billing: Capability
  def build_catalog_vm(overview, entries, detail) -> CatalogVM: ...
  ```
- Loads: on mount `catalog.overview`, then `catalog.entries(context_id)` for the first context; row highlight on `#models` loads `catalog.entry`. ContentSwitcher on `#models`: `#models-loading`, `#models` (rows), `#models-empty` (context has no entries), `#models-error` (typed error from `catalog.entries`).
- Refresh failed is not an error state: rows stay in `#models`, `#catalog-bar` shows the failure and last-valid age, and `#entry-detail` shows the failure notice with `#retry`, taken from `RefreshStatusDTO.cause` and `last_valid_at`.
- Subscriptions: `events.subscribe(["catalog"])` on mount; on `catalog.refresh.*` and `catalog.override.*` for the visible context, re-issue `catalog.entries` and `catalog.entry`. `job.progress` for a refresh started here updates `#catalog-bar`. Unsubscribe on unmount.
- Compact layout: `Screen.-compact` hides `#providers-pane` and shows `Select #provider`; same calls.

| Binding / control | Action | API call | Result shown |
|---|---|---|---|
| `esc` | `app.pop_screen` | none | — |
| `f5`, `Button #retry` | `refresh` | `catalog.refresh(context_ids=[selected])`; disabled via `check_action` when `can_refresh` is false, reason in footer | `#catalog-bar` progress; final state from `catalog.refresh.finished` |
| `o`, `Button #add-override` | `override` | none on press; pushes `OverrideScreen(context_id, model_id)`; disabled when `can_override` is false | — |
| `/` | `filter` | `catalog.entries(context_id, name_filter)` | `#models` |
| `b` | `billing` | none on press; pushes `BillingScreen(account_id)` for the selected context's account; disabled when `can_declare_billing` is false | — |
| `x` | `rates` | none on press; pushes `RatesScreen()` | — |
| `y`, Open catalog YAML button | `open_yaml` | `catalog.files` | pushes the M15 read-only viewer |
| Show error log button | — | `jobs.get(job_id)` of the failed refresh | error detail in the viewer |
| `Tree #providers` / `Select #provider` change | — | `catalog.entries(context_id)` | `#models` |
| `tab` | `focus_next` | none | — |

**`OverrideScreen(ModalScreen[Override | None])`** — same file; artboard CatalogOverride.

- View model `OverrideVM {subject, fields: list[OverrideFieldVM(name, mode, value_text, inherited_text)], default_options, can_remove, error_fields}`, built from `EntryDetail.override_form` (override layer only; lower layers are not copied in, so an untouched field stays `inherit`). `inherited_text` renders the `inherited` `FieldDTO` (value and source, or "? unknown") as the placeholder of an inheriting field.
- Each field row (efforts, default effort, image input, input price, output price) has a mode `Select` with the options Inherit · Value · Unknown next to its value widget (`#override-efforts`, `#override-default`, `#override-image`, `#override-price-in`, `#override-price-out`); the value widget is enabled only in Value mode. The price rows share `Select #override-price-currency` (default USD, sent as `price_currency`), enabled when either price is in Value mode. The screen sends the mode and value as typed; it does not decide what Unknown implies.
- Loads `catalog.entry` on mount for the given key. `#override-default` options are the comma-separated tokens currently typed in `#override-efforts` (or the inherited efforts when efforts inherit); this is input echo, not validation, which the engine performs.

| Binding / control | API call | Result |
|---|---|---|
| `ctrl+s`, `Button #save` | `catalog.save_override` with each field's `"inherit"`, `"unknown"` or `{value}` | dismiss with the returned entry; `catalog.override_invalid` marks `error_fields` and shows the message under the field; `catalog.override_empty` is shown in the dialog |
| Remove override button (enabled from `can_remove_override`) | `catalog.remove_override` after M15's `ConfirmScreen` returns `True` (destructive) | dismiss with the returned entry |
| `esc`, Cancel | none | `dismiss(None)` |

**`BillingScreen(ModalScreen[AccountDTO | None])`** — same file. No artboard yet; it is to be added to the wireframe generator next to CatalogOverride, with the same field-row pattern.

- View model `BillingVM {account_label, harness, target, mode ("inherit" | "value" | "unknown"), value, discovered_text, error}`, built from the selected `ContextDTO.billing`. `discovered_text` is what the harness reported (or "local endpoint", or "? unknown") and is the placeholder of an inheriting field.
- One row: mode `Select #billing-mode` (Inherit · Value · Unknown) and `Select #billing-kind` (`api`, `subscription`, `local`), enabled only in Value mode. A note states that a declared kind is shown as "declared by user" with every cost basis. The screen does not decide which kinds fit the account; the engine rejects `local` for a cloud provider.

| Binding / control | API call | Result |
|---|---|---|
| `ctrl+s`, `Button #save` | `catalog.save_account_override(harness, target, account_id, billing)` | dismiss with the returned `AccountDTO`; `catalog.override_invalid` shown under the row |
| `esc`, Cancel | none | `dismiss(None)` |

**`RatesScreen(ModalScreen[None])`** — same file. No artboard yet; to be added to the wireframe generator beside the Catalog group.

- View model `RatesVM {bar, rows: list[RateRowVM(currency, rate_text, source_label, as_of, unknown: bool)], selected: RateFormVM(mode, value_text, as_of_text, inherited_text), error_fields}`, built from `catalog.rates`. `bar` shows the rate source, retrieval date or the failure with the age of the rates kept, and `missing_price_currencies`. USD is listed as the base and is not editable.
- Loads `catalog.rates()` on mount; ContentSwitcher on `#rates`: loading, list, error. Subscribes to `catalog` and reloads on `catalog.rates.refreshed` and `catalog.override.saved` with `scope: "rate"`.

| Binding / control | API call | Result |
|---|---|---|
| `↑ ↓` on `#rates` | none | `#rate-form` shows the row's mode and value |
| `ctrl+s`, `Button #save` | `catalog.save_rate_override(currency, rate, as_of)` with the mode's `"inherit"`, `"unknown"` or `{value}` | row updated from the returned `RateDTO` (label "supplied by user"); `catalog.override_invalid` marks `error_fields` |
| `a` | none; opens `Input #rate-currency` for a currency not listed, then the same save | `catalog.unknown_currency` shown inline |
| `esc` | `app.pop_screen` | — |

**`EntryPickerScreen(ModalScreen[EntryResult | None])`** — `axbenchmark/tui/screens/setup.py` (pushed from M07's Setup with `a` as `EntryPickerScreen(draft_id)` or `e` as `EntryPickerScreen(draft_id, entry_id)`); artboards ModelPicker and ModelPickerUnknown. M04 defines the catalog-driven contents; M07 owns the screen's place in Setup.

- View model `tui/viewmodels/entry_picker.py`: `EntryPickerVM {harness_options, target_options, models: list[ModelOptionVM], efforts: list[EffortRadioVM], effort_hint, can_add: Capability}`, built from `catalog.options` and the Setup view model. When `effort_support == "unknown"`, `efforts` is the single `harness_default` choice the engine returned and `#effort-hint` states that no effort argument is passed.
- Loads: `catalog.options(harness, target, account_id)` on mount and whenever `Select #harness` or `Select #provider` changes. ContentSwitcher on `#model-options`: loading, list, empty (context has no catalog models), error (`catalog.no_supported_harness` and others, with remedy).
- `#effort` (RadioSet) is rebuilt from the highlighted model's `choices`; the catalog default is preselected only when `is_catalog_default` is set.
- The model whose `is_harness_default` is set is labelled "harness default" with the source of `default_model`; it is not preselected, and the saved entry always names its model explicitly (competitor configurations never rely on the harness default).

| Binding / control | API call | Result |
|---|---|---|
| `↑ ↓` on `#model-options` | none (choices are already in `EffortOptions`) | `#effort`, `#effort-hint` |
| `ctrl+s`, `Button #add-entry` | `configs.add_entry` (M07), or `configs.update_entry` when opened with an `entry_id`, with the selection and effort request; M07 validates through `catalog.check_selection` | dismiss with the returned `EntryResult`; typed errors such as `catalog.effort_unsupported` shown inline |
| `esc`, Cancel | none | `dismiss(None)` |

Other screens consume the catalog without owning artboards here: Environment (M03) shows `catalog.overview` refresh status and pushes `CatalogScreen` on `m`; JudgeScreen (M07/M12) and the planner selection (M16) use `catalog.options`; the planner preselects `default_model` when it is known and leaves the model empty otherwise.

### 5. CLI

| Command | API |
|---|---|
| `axbenchmark models refresh [--harness H] [--provider P]` | `catalog.refresh` job, streaming `job.progress`, `catalog.refresh.finished`, `catalog.prices.refreshed` and `catalog.rates.refreshed`; each failed context is printed with its cause and last-valid age, and each provider's prices with source URL and retrieval date, or with the failure cause and the age of the prices kept (a provider without a price source is printed as "no price source · bundled prices and overrides"). Rate lines follow the price lines: the rate source URL, the source's date, the retrieval date and the number of currencies, e.g. `rates  open.er-api.com/v6/latest/USD · as of 2026-10-02 · retrieved 2026-10-02 · 162 currencies`, or the failure cause and the age of the rates kept, e.g. `rates  failed (offline) · keeping rates retrieved 2026-09-28`; then one line naming any `missing_price_currencies`. Per-context, per-provider and rate failures are outcomes of a finished job, so the exit code is 0, and 1 only when the job itself fails with a typed error (ARCHITECTURE.md). **[R063, R064, R081]** |
| `axbenchmark models list [--harness H] [--provider P] [--filter TEXT]` | `catalog.overview`, `catalog.entries` |
| `axbenchmark models show MODEL --harness H --provider P` | `catalog.entry` |
| `axbenchmark models override MODEL --harness H --provider P [--efforts …] [--default …] [--image supported\|unsupported] [--price-in …] [--price-out …] [--price-currency CODE]` / `--remove` | `catalog.save_override` / `catalog.remove_override`. Every field option also accepts `inherit` and `unknown`; an omitted option is `inherit`; `--price-currency` defaults to USD. |
| `axbenchmark models default --harness H --provider P (MODEL \| inherit \| unknown)` | `catalog.save_context_override` |
| `axbenchmark models billing --harness H --provider P [--account A] (api \| subscription \| local \| inherit \| unknown)` | `catalog.save_account_override`; prints the resolved `BillingDTO.label`. `--account` is needed only when the harness has more than one account for that provider. |
| `axbenchmark models rates [--currency CODE …]` | `catalog.rates`; one line per currency with rate per USD, source label ("supplied by user" for a supplied rate), source date and retrieval date, or `? unknown` |
| `axbenchmark models rate CODE (PER_USD [--as-of DATE] \| inherit \| unknown)` | `catalog.save_rate_override` |

Only `models refresh` comes from [SPEC.md](../SPEC.md); `models billing`, `models rates` and `models rate` come from the round-3 decisions (R3-1, R3-2); the others exist because every API method must be reachable from the CLI, and are owned by [M14](14-command-line-interface.md). All accept `--json`; exit codes follow ARCHITECTURE.md.

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain (`tests/engine/catalog/domain/`) | `resolve_entry` precedence per field (override › discovered › bundled), absent fields fall through, nothing stated → `UNKNOWN` with no value; same model id under different harness, version, target or account resolves independently; records for another version are provenance only; `effort_choices` never offers `UNSUPPORTED` values and yields only `HarnessDefault` + `OMIT` when unknown; `check_effort` errors; `refresh_needed` for first launch and version change; `apply_discovery` leaves the cache unchanged on failure and never touches overrides; `validate_override` field errors; an override `Unknown` stops resolution with `source=OVERRIDE` for efforts (→ only `HarnessDefault`), image input and price, while `Inherit` falls through; pricing resolves override › price source › bundled per provider and never yields 0 from absence; `apply_prices` leaves the table unchanged on failure or an empty parse; `default_model` resolves by layer and stays unknown when no layer states it; `resolve_billing`: declared value wins with `declared_by_user` and its label, declared `Unknown` hides a discovered `subscription`, an `EndpointRef` without a declaration is `LOCAL`, a missing or `UNKNOWN` reading stays `UNKNOWN` and never becomes `API`, `LOCAL` declared for a cloud provider is rejected, and a declaration survives a harness version change; `resolve_rate`: USD is identity, a supplied rate wins with its label, a supplied `Unknown` hides a collected rate, a currency with no record is unknown, no rate is derived from another currency; `apply_rates` leaves the table unchanged on failure or an empty parse; `validate_rate_override` rejects USD, non-ISO codes, zero, negative, non-finite and future dates; the package contains no exchange-rate constant (a test scans `engine/catalog/data/` and the source for one). **[R061–R065, R080, R081]** |
| Use cases (fake ports) | `RefreshCatalog` with a timing-out, offline and auth-rejecting fake discoverer: cache and overrides byte-identical, status records the distinct cause, events emitted; a fake `PriceSource` that succeeds, fails, goes offline and returns an unparseable page: prices stored with source URL and date on success, last valid prices kept otherwise; a fake discoverer with a default-model reading records it with `observed_from`; `EnsureCatalogFresh` starts jobs only for first launch and version change and never calls a `PriceSource`; `CheckSelection` returns frozen-ready pricing provenance and never calls a `PriceSource`; `GetEffortChoices` and `CheckSelection` raise `no_supported_harness` when the fake inventory has none, even with a populated cache; a fake `ExchangeRateSource` that succeeds, fails, goes offline and returns an unparseable body: rates stored with source URL, `as_of` and retrieval date on success, last valid rates and supplied rates kept otherwise, `missing_price_currencies` computed against the price table; `EnsureCatalogFresh`, `CheckSelection` and `ExchangeRates.snapshot` never call the rate source; `snapshot(["EUR", "COP", "USD"])` returns each requested currency once, unknown where no rate resolves; `CheckSelection` carries a declared billing kind with `declared_by_user`; `RefreshCatalog` records a provider without an adapter (e.g. a provider other than Anthropic, OpenAI or xAI) as `NO_PRICE_SOURCE` and resolves its prices from bundled and override layers. **[R063, R081, R137, R152]** |
| API (`InProcessClient`, no interface) | Every `catalog.*` method round-trips its DTOs; error codes and `field` paths are stable; `catalog.refresh` returns the same `JobRef` for an overlapping request; subscription snapshot plus `since_seq` replay delivers `catalog.refresh.finished`; registry metadata has the safety classes above; JSON Schema export includes `catalog.*`; `catalog.save_account_override` and `catalog.save_rate_override` round-trip `inherit`, `unknown` and `{value}` and emit `catalog.override.saved` with their `scope`; `catalog.rates` with an unknown code returns `catalog.unknown_currency`. Adapter tests parse recorded pages of the Anthropic, OpenAI and xAI pricing sources and a recorded rate-source response, and a changed page or body yields `PARSE_ERROR`; they run offline against fixtures. |
| Screens (fake client, `App.run_test()` / `Pilot`) | `CatalogScreen` renders `? unknown` cells with class `unknown`, the refresh-failed bar and `#retry` from a fake `RefreshStatusDTO`, and `f5` issues exactly one `catalog.refresh`; `f5` is disabled when the fake returns `can_refresh: false`; `OverrideScreen` shows `catalog.override_invalid` field errors, sends `"inherit"`, `"unknown"` and `{value}` from the three modes and enables a value widget only in Value mode; `EntryPickerScreen` shows only the returned choices and a single “Harness default” when `effort_support` is `unknown`. `CatalogScreen` shows `BillingDTO.label` verbatim (including "declared by user") and the rate source line; `b` and `x` push `BillingScreen` and `RatesScreen`; `BillingScreen` sends the three modes and enables `#billing-kind` only in Value mode; `RatesScreen` renders unknown rates as `? unknown`, shows "supplied by user" from the label and sends exactly one `catalog.save_rate_override` per save. View-model builders are tested as pure functions without Textual. |
