# M04 — Model, effort, and capability catalog

Status: proposed requirements derived from [SPEC.md](../SPEC.md). This module defines required catalog behavior; it does not assert that any particular model, effort, provider, or harness capability currently exists.

## Purpose and boundary

Provide a versioned YAML catalog organized by harness and provider so planner, competitor, and judge selections use explicit compatibility information. Availability and effort support depend on the installed harness version, provider, and account. Matching a model name is insufficient evidence that a configuration works. Allow configured cloud providers and local model endpoints only through harnesses that support them; a reachable endpoint alone does not establish harness compatibility. **[R010, R061]**

The catalog describes evidence available for a selection, while environment discovery and execution establish other readiness conditions. Discovery, offline fallback, unsupported settings, and authentication failures must remain distinguishable. Catalog presence must never be presented as successful authentication or guaranteed execution. **[R137]**

## Catalog information contract

Each entry identifies its model and display name, supported effort values, known default effort, relevant capabilities such as image input, and optional pricing. Include the metadata source, retrieval date, and applicable harness version. Unknown defaults, capabilities, or prices remain unknown; absence of metadata must not manufacture a value. Expose known support, explicit lack of support, and unknown information as different states. **[R062]**

Compatibility lookup receives the selected harness and installed version, provider or configured endpoint, account context, and model. Its result carries the applicable catalog information and its support status, rather than resolving solely by display name. Account context establishes the scope of availability information; entries discovered for one context must not become evidence of another account's access. Local endpoints receive the same compatibility treatment as cloud providers. **[R010, R061]**

Maintain three separate sources: a bundled baseline, a discovered cache, and user overrides. Resolve overlapping information in that precedence order, so discovered data supersedes the baseline and explicit overrides take priority. Preserve each source independently; refresh must not overwrite overrides. The resulting selection must retain enough provenance to show which source supplied its information. An override is user-supplied metadata, not evidence that authentication or effective settings were observed. **[R062, R064, R065, R137]**

## Discovery and resolution operations

On first launch, attempt automatic discovery through available harness/provider interfaces. Thereafter use cached catalog data, refreshing when the installed harness version changes or the user explicitly requests refresh. A refresh obtains information applicable to the discovered installation and provider/account context; it must not silently recast old version metadata as newly verified support. **[R061, R063]**

A failed refresh preserves the last valid catalog data and exposes the failure alongside the usable fallback. Offline operation may use cached or bundled entries, with source and age visible. If discovery supplies no information for a capability, preserve that uncertainty instead of inventing support. Refresh success for metadata does not certify account authentication or readiness for a model invocation. **[R062, R063, R137]**

Effort selection offers only values known to be supported for the chosen combination. When effort support is unknown, offer a harness-default option and instruct execution to omit an explicit effort argument. Do not guess a list from another model, provider, account, or harness version. A known catalog default is metadata; it is not proof of the effort an invocation actually used. **[R061, R062, R065]**

Keep requested model and effort settings separate from effective settings. Execution may populate effective settings only when the harness exposes them; otherwise mark them unverified or unknown. A failed invocation must not silently substitute a different model. A refresh or fallback must not turn a rejected request into an apparent successful run under another selection. **[R065]**

## Dependencies and failure behavior

[M03](03-environment-readiness.md) supplies installed harness/version and readiness observations. [M07](07-run-configuration.md) consumes compatibility results for setup and launch validation. [M05](05-harness-execution-isolation.md) applies supported endpoint/model selections, omission of unknown effort arguments, and requested/effective reporting. [M15](15-terminal-interface.md) and [M14](14-command-line-interface.md) present metadata, refresh, and failure states as the engine reports them, without evaluating catalog rules themselves. The engine package, API and screens that realize these boundaries follow [the architecture decision](ARCHITECTURE.md) and are specified under Implementation. **[R010, R061, R063, R065, R137]**

When no supported harness is installed, contribute an actionable error that prevents local planning and execution while preserving library browsing, import/export, and saved-result access. Cached models must not bypass that restriction. Explicitly unsupported settings, unknown support, discovery failure, offline fallback, and authentication failure require honest explanations rather than a generic ready indicator. **[R137]**

## Acceptance criteria

- A versioned YAML catalog distinguishes identical model names across harness/provider/account contexts and applicable installed versions, including supported local and cloud configurations. **[R010, R061]**
- Entry inspection exposes every required metadata item and represents known, unsupported, and unknown states without fabricated defaults or pricing. **[R062]**
- First launch attempts discovery; later launches use cache; version changes and manual requests refresh. Failed refresh preserves last-good data; offline fallback shows source and age. **[R063]**
- Overlapping baseline, cache, and override information resolves with overrides highest, and refresh leaves overrides intact. **[R064]**
- Unknown effort support offers harness-default and produces no explicit effort argument. Unsupported efforts are not offered, failures do not substitute models, and requested settings never masquerade as verified effective settings. **[R065]**
- Missing harnesses block local model work while retained-data operations remain accessible; authentication and metadata uncertainty remain visible independently. **[R137]**

## Implementation

This section applies [the architecture decision](ARCHITECTURE.md) to the catalog. Everything below is an implementation decision; the product behavior above stays authoritative.

### 1. Engine component

Package `axbenchmark.engine.catalog`, API namespace `catalog.*`. The catalog is a pure resolver over three independently stored layers plus a discovery job; it holds no long-lived processes.

**Domain** (`engine/catalog/domain/`, frozen dataclasses, no I/O):

| Type or rule | Shape and behavior |
|---|---|
| `CatalogContext` | `harness: HarnessId`, `harness_version: str` (installed), `target: ProviderRef \| EndpointRef`, `account: AccountRef`. `AccountRef` is a non-secret label and fingerprint supplied by M03/M05; it never holds credentials. Local endpoints are `EndpointRef` and go through the same rules as cloud providers. **[R010, R061]** |
| `EntryKey` | `context: CatalogContext`, `model_id: str`. The only lookup key; display names are never used for lookup. **[R061]** |
| `Layer` | Enum `OVERRIDE > DISCOVERED > BUNDLED` (ordering is the precedence). **[R064]** |
| `Support` | Enum `SUPPORTED`, `UNSUPPORTED`, `UNKNOWN`. **[R062]** |
| `LayerRecord` | What one layer states about one entry: `layer`, `key`, `applies_to: VersionSpec` (bundled: a declared range such as `3.4.x`; discovered: the exact version probed; override: the version range the user saved it for), `retrieved_at`, `source_ref` (catalog version, harness version or file), and optional fields `display_name`, `efforts: tuple[EffortSupport, ...]`, `default_effort`, `image_input: Support`, `pricing: Pricing`. An absent field means "this layer says nothing", never a value. |
| `ResolvedField[T]` | `state: Support` (or known/unknown for scalar fields), `value: T \| None`, `source: Layer \| None`, `retrieved_at`, `applies_to`. `value` is `None` whenever `state` is `UNKNOWN`. |
| `resolve_entry(records, installed_version) -> ResolvedEntry` | Per field: the highest layer that states the field and whose `applies_to` matches `installed_version` wins; if none does, the field is `UNKNOWN` with no value. Records whose version does not match stay attached as provenance (`stale_for_version`) but are not evidence. Absence of metadata never produces a value. **[R062, R063, R064]** |
| `effort_choices(entry) -> EffortChoices` | Known effort list: only `SUPPORTED` values, with the known default marked. Unknown effort support: exactly one choice, `HarnessDefault`, with `effort_argument = OMIT`. Never derived from another key. **[R065]** |
| `EffortRequest` | `Explicit(value)` or `HarnessDefault`. `check_effort(entry, request)` returns the `EffortArgument` (`Pass(value)` or `OMIT`) or raises `EffortUnsupported` / `EffortSupportUnknown`. **[R065]** |
| `SelectionEvidence` | Frozen snapshot of a resolved entry for one selection: key, every `ResolvedField` with provenance, `effort_request`, `effort_argument`, catalog version, refresh status of the context. This is the "catalog metadata used at launch" that M07 freezes and M02 retains; it contains no credentials and never asserts authentication. **[R065, R137]** |
| `EffectiveSetting[T]` | `requested: T`, `effective: T \| None`, `state: OBSERVED \| UNVERIFIED \| UNKNOWN`. Vocabulary only; M05 fills it from what the harness exposes. **[R065]** |
| `RefreshStatus` | Per context: `last_attempt_at`, `outcome: OK \| FAILED \| OFFLINE \| NOT_ATTEMPTED`, `cause: DiscoveryFailure \| None`, `last_valid_at`, `last_valid_version`. `DiscoveryFailure` kinds stay distinct: `OFFLINE`, `TIMEOUT`, `AUTH_REJECTED`, `NO_DISCOVERY_INTERFACE`, `HARNESS_MISSING`, `PROBE_ERROR`. **[R063, R137]** |
| `refresh_needed(context, status, cache) -> RefreshReason \| None` | `FIRST_LAUNCH` when the context has never been attempted, `VERSION_CHANGED` when the installed version differs from `last_valid_version`, else `None`. **[R063]** |
| `apply_discovery(cache, context, result) -> Cache` | On success replaces only that context's discovered records; on failure returns the cache unchanged. Never touches overrides. **[R063, R064]** |
| `validate_override(draft) -> Override` | Efforts parse to a non-empty set or stay unset; a default effort must be one of the stated efforts; prices are non-negative decimals or unset. Errors carry field paths. Empty fields stay unset (the lower layers or unknown apply). |

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

class InstalledHarnesses(Protocol):                       # adapter over M03's InstalledHarnesses.list() and ReadinessGate
    async def contexts(self) -> Sequence[CatalogContext]: ...
    async def any_supported_installed(self) -> bool: ...
```

Plus the shared `Clock`, `EventPublisher` and `JobRunner` ports from `engine/shared` and `engine/daemon`.

**Use cases** (`engine/catalog/application/`, one class each, ports injected in `__init__`):

| Use case | Kind | Does |
|---|---|---|
| `GetCatalogOverview` | query | Lists contexts (harness › provider/endpoint · account) with installed version, catalog version, refresh status, override count and capability flags. |
| `ListEntries` | query | Resolves every entry of one context, optionally filtered by model-id substring. |
| `GetEntry` | query | One resolved entry with its per-layer records (the sources table), effort choices and override form values. |
| `GetEffortChoices` | query | For a harness + target + account: models with their `EffortChoices`. Raises `catalog.no_supported_harness` when M03 reports none installed, so cached data cannot bypass the block. **[R137]** |
| `CheckSelection` | query | Resolves a selection and an `EffortRequest` into `SelectionEvidence` or a typed error. Used by M07 validation, M12 capability checks and M16 preselection. |
| `SaveOverride` / `RemoveOverride` | command | Validate and write the override layer only. |
| `RefreshCatalog` | job | For each requested context: probe via `ModelDiscoverer`, `apply_discovery`, persist cache and status, emit events. One running refresh per context; a second request returns the running job's `JobRef`. |
| `EnsureCatalogFresh` | internal | Run at engine start and on `environment.harness.changed`: starts `RefreshCatalog` for every context where `refresh_needed` is not `None`. Not exposed as an API method. **[R063]** |
| `GetCatalogFiles` | query | Returns the paths and text of the baseline, cache and override YAML for read-only display. |

**Adapters** (`engine/catalog/adapters/`):

| Adapter | Implements |
|---|---|
| `baseline_yaml.py` | `BaselineSource` over the packaged resource `engine/catalog/data/baseline.yaml`, which carries `catalog_version` (e.g. `2026.09.2`) and `retrieved_at`. |
| `cache_yaml.py`, `overrides_yaml.py`, `refresh_state_yaml.py` | YAML stores under `~/.axbenchmark/catalog/`, written by temp-file-and-rename. A malformed override file is reported as `catalog.override_file_invalid` and never rewritten by the engine. |
| `discovery/claude_code.py`, `codex.py`, `grok.py`, `pi.py` | `ModelDiscoverer`, each delegating to M05's `HarnessInspection.list_models` so harness invocation stays in M05. They map probe outcomes to `DiscoveryResult` with the failure kinds above; only what the harness reports is recorded (unreported efforts stay absent). Default probe timeout 20 s. |
| `readiness_bridge.py` | `InstalledHarnesses` over M03's `InstalledHarnesses` and `ReadinessGate`. |
| `rpc.py` | Registers the `catalog.*` methods, maps DTOs to use-case inputs and domain errors to the codes below. |

**Persisted state** (engine is the only reader and writer):

| File | Content | Written by |
|---|---|---|
| `~/.axbenchmark/catalog/discovered.yaml` | `schema: 1`; discovered `LayerRecord`s per context with exact harness version and `retrieved_at`. | `RefreshCatalog` on success only |
| `~/.axbenchmark/catalog/overrides.yaml` | `schema: 1`; override `LayerRecord`s per `EntryKey` and version range. | `SaveOverride`, `RemoveOverride` |
| `~/.axbenchmark/catalog/refresh-state.yaml` | `RefreshStatus` per context. | `RefreshCatalog` |

**Owned processes**: none persistent. Discovery probes are short-lived subprocesses started through M05 inside the `RefreshCatalog` job and supervised by the daemon's job runner (M11); cancelling the job terminates them.

### 2. API surface

DTOs live in `axbenchmark.api.catalog`. Every resolved field crosses the API as `FieldDTO {state: "supported"|"unsupported"|"unknown"|"known", value?, source?: "override"|"discovered"|"bundled", retrieved_at?, applies_to?}`; an unknown field has no `value`.

**Queries** (safety `read`):

| Method | Request | Response | Errors | Capability flags |
|---|---|---|---|---|
| `catalog.overview` | — | `CatalogOverview {catalog_version, bundled_at, precedence, contexts: [ContextDTO {context_id, harness, harness_version, target, account_label, applies_label, refresh: RefreshStatusDTO, model_count, override_count}]}` | `catalog.override_file_invalid` (returned as a field, not raised, so the overview still renders) | per context: `can_refresh` + `reason` (`environment.no_harness`, `catalog.refresh_running`) |
| `catalog.entries` | `context_id`, `name_filter?` | `EntryList {context, rows: [EntryRowDTO {model_id, display_name, efforts, default_effort, image_input, pricing, top_source}]}` | `catalog.unknown_context` | — |
| `catalog.entry` | `context_id`, `model_id` | `EntryDetail {key, fields, effort_choices, run_effect ("pass" \| "omit"), layers: [LayerRowDTO {layer, says, retrieved_at, source_ref, stale_for_version}], override_form: OverrideDraftDTO}` | `catalog.unknown_context`, `catalog.entry_not_found` | `can_override`, `can_remove_override` |
| `catalog.options` | `harness`, `target`, `account_id` | `EffortOptions {context, models: [ModelOptionDTO {model_id, summary, top_source, choices: [EffortChoiceDTO {value \| "harness_default", is_catalog_default}], effort_support: "known"\|"unknown"}]}` | `catalog.no_supported_harness`, `catalog.harness_not_installed`, `catalog.unknown_context` | per model: `can_select` + `reason` |
| `catalog.check_selection` | `harness`, `target`, `account_id`, `model_id`, `effort: {explicit: str} \| "harness_default"`, `require?: ["image_input"]` | `SelectionEvidenceDTO {key, fields, effort_argument: {pass: str} \| "omit", catalog_version, refresh}` | `catalog.no_supported_harness`, `catalog.model_not_in_catalog`, `catalog.effort_unsupported`, `catalog.effort_support_unknown`, `catalog.capability_unsupported`, `catalog.capability_unknown` (each with `field` and `remedy`) | — |
| `catalog.files` | — | `CatalogFiles {files: [{layer, path, text}]}` | — | — |

**Commands**:

| Method | Request | Response | Errors | Safety |
|---|---|---|---|---|
| `catalog.save_override` | `context_id`, `model_id`, `efforts?`, `default_effort?`, `image_input?: "supported"\|"unsupported"`, `price_in?`, `price_out?` | `EntryDetail` | `catalog.override_invalid` (field paths `efforts`, `default_effort`, `price_in`, `price_out`), `catalog.unknown_context`, `catalog.override_file_invalid` | write |
| `catalog.remove_override` | `context_id`, `model_id` | `EntryDetail` | `catalog.override_not_found`, `catalog.override_file_invalid` | destructive |

**Jobs**:

| Method | Request | Returns | Progress and result | Errors | Safety |
|---|---|---|---|---|---|
| `catalog.refresh` | `context_ids?`, `harness?`, `provider?` (filters resolved by the engine; all contexts when none is given) | `JobRef` (the running job's ref if one already covers the contexts) | `job.progress` per context probed; `job.finished` with `RefreshReport {contexts: [{context_id, outcome, cause?, entries_changed, last_valid_at}]}`. A per-context failure is an outcome, not a job error. | `catalog.no_supported_harness` (at submit) | write |

**Events**:

| Event | Payload | Emitted when |
|---|---|---|
| `catalog.refresh.started` | `context_id`, `reason: "manual" \| "first_launch" \| "version_changed"`, `job_id` | A context probe starts |
| `catalog.refresh.finished` | `context_id`, `outcome`, `cause?`, `last_valid_at`, `entries_changed` | A context probe ends (success, failure or offline) |
| `catalog.override.saved` | `context_id`, `model_id` | `catalog.save_override` succeeds |
| `catalog.override.removed` | `context_id`, `model_id` | `catalog.remove_override` succeeds |

Subscription snapshot for topic `catalog`: the `CatalogOverview`.

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `InstalledHarnesses.list()` (installed harnesses, versions, providers/endpoints, non-secret account fingerprints) and `ReadinessGate.has_supported_harness()` (no-harness state, M03's own rule) | M03 | Build `CatalogContext`s; enforce the no-harness block **[R137]** |
| `environment.harness.changed` event | M03 | Trigger `EnsureCatalogFresh` on version change **[R063]** |
| `HarnessInspection.list_models(context, timeout) -> ModelListOutcome` (classifies offline, timeout and authentication rejection) | M05 | Discovery without M04 invoking harness CLIs itself |
| `JobRunner` port, `jobs.get`, `jobs.cancel`, `events.subscribe`, `job.progress`, `job.finished` | M11 | Run and observe `catalog.refresh` |
| `configs.add_entry` | M07 | Issued by `EntryPickerScreen` to add the chosen entry |
| `FileViewScreen` (read-only text viewer) and `StateSwitcher` | M15 | `y` / Open catalog YAML; loading/empty/error states |

Consumers of this namespace: M07 (`catalog.options`, `catalog.check_selection`, freezes `SelectionEvidence`), M12 (`catalog.check_selection` with `require: ["image_input"]`), M16 (`catalog.options` for planner defaults), M10 (pricing from frozen evidence), M02 (retains frozen evidence), M05 (consumes `effort_argument` and the `EffectiveSetting` vocabulary), M03 (`catalog.overview` refresh status in Environment).

### 4. Screens

All three artboard groups are pure views: they show `FieldDTO` states, sources and capability flags exactly as returned and display typed errors verbatim. None resolves precedence, filters efforts or decides whether a model is usable.

**`CatalogScreen(Screen)`** — `axbenchmark/tui/screens/catalog.py`; artboards Catalog (wide, compact) and CatalogRefreshFailed.

- View model `tui/viewmodels/catalog.py`:
  ```python
  @dataclass(frozen=True)
  class CatalogVM:
      bar: str                          # #catalog-bar text, from overview + selected context refresh
      bar_failed: bool                  # refresh.outcome in {failed, offline}
      tree: list[ContextNodeVM]         # #providers / compact #provider options
      provider_facts: list[tuple[str, str]]   # account, harness, applies_label, source + age
      rows: list[EntryRowVM]            # #models; unknown cells carry class "unknown"
      detail: EntryDetailVM | FailureVM | None   # #entry-detail
      can_refresh: Capability; can_override: Capability
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
| `y`, Open catalog YAML button | `open_yaml` | `catalog.files` | pushes the M15 read-only viewer |
| Show error log button | — | `jobs.get(job_id)` of the failed refresh | error detail in the viewer |
| `Tree #providers` / `Select #provider` change | — | `catalog.entries(context_id)` | `#models` |
| `tab` | `focus_next` | none | — |

**`OverrideScreen(ModalScreen[Override | None])`** — same file; artboard CatalogOverride.

- View model `OverrideVM {subject, efforts_text, default_options, default_value, image_choice, price_in, price_out, can_remove, error_fields}`, built from `EntryDetail.override_form` (override layer only; lower layers are not copied in, so an untouched field stays unset).
- Loads `catalog.entry` on mount for the given key. `#override-default` options are the comma-separated tokens currently typed in `#override-efforts`; this is input echo, not validation, which the engine performs.

| Binding / control | API call | Result |
|---|---|---|
| `ctrl+s`, `Button #save` | `catalog.save_override` | dismiss with the returned entry; `catalog.override_invalid` marks `error_fields` and shows the message under the field |
| Remove override button (enabled from `can_remove_override`) | `catalog.remove_override` after M15's `ConfirmScreen` returns `True` (destructive) | dismiss with the returned entry |
| `esc`, Cancel | none | `dismiss(None)` |

**`EntryPickerScreen(ModalScreen[EntryResult | None])`** — `axbenchmark/tui/screens/setup.py` (pushed from M07's Setup with `a` as `EntryPickerScreen(draft_id)` or `e` as `EntryPickerScreen(draft_id, entry_id)`); artboards ModelPicker and ModelPickerUnknown. M04 defines the catalog-driven contents; M07 owns the screen's place in Setup.

- View model `tui/viewmodels/entry_picker.py`: `EntryPickerVM {harness_options, target_options, models: list[ModelOptionVM], efforts: list[EffortRadioVM], effort_hint, can_add: Capability}`, built from `catalog.options` and the Setup view model. When `effort_support == "unknown"`, `efforts` is the single `harness_default` choice the engine returned and `#effort-hint` states that no effort argument is passed.
- Loads: `catalog.options(harness, target, account_id)` on mount and whenever `Select #harness` or `Select #provider` changes. ContentSwitcher on `#model-options`: loading, list, empty (context has no catalog models), error (`catalog.no_supported_harness` and others, with remedy).
- `#effort` (RadioSet) is rebuilt from the highlighted model's `choices`; the catalog default is preselected only when `is_catalog_default` is set.

| Binding / control | API call | Result |
|---|---|---|
| `↑ ↓` on `#model-options` | none (choices are already in `EffortOptions`) | `#effort`, `#effort-hint` |
| `ctrl+s`, `Button #add-entry` | `configs.add_entry` (M07), or `configs.update_entry` when opened with an `entry_id`, with the selection and effort request; M07 validates through `catalog.check_selection` | dismiss with the returned `EntryResult`; typed errors such as `catalog.effort_unsupported` shown inline |
| `esc`, Cancel | none | `dismiss(None)` |

Other screens consume the catalog without owning artboards here: Environment (M03) shows `catalog.overview` refresh status and pushes `CatalogScreen` on `m`; JudgeScreen (M07/M12) and the planner selection (M16) use `catalog.options`.

### 5. CLI

| Command | API |
|---|---|
| `axbenchmark models refresh [--harness H] [--provider P]` | `catalog.refresh` job, streaming `job.progress` and `catalog.refresh.finished`; each failed context is printed with its cause and last-valid age; per-context failures are outcomes of a finished job, so the exit code is 0, and 1 only when the job itself fails with a typed error (ARCHITECTURE.md). **[R063, R064]** |
| `axbenchmark models list [--harness H] [--provider P] [--filter TEXT]` | `catalog.overview`, `catalog.entries` |
| `axbenchmark models show MODEL --harness H --provider P` | `catalog.entry` |
| `axbenchmark models override MODEL --harness H --provider P [--efforts …] [--default …] [--image supported\|unsupported] [--price-in …] [--price-out …]` / `--remove` | `catalog.save_override` / `catalog.remove_override` |

Only `models refresh` comes from [SPEC.md](../SPEC.md); the other three exist because every API method must be reachable from the CLI, and are owned by [M14](14-command-line-interface.md). All accept `--json`; exit codes follow ARCHITECTURE.md.

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain (`tests/engine/catalog/domain/`) | `resolve_entry` precedence per field (override › discovered › bundled), absent fields fall through, nothing stated → `UNKNOWN` with no value; same model id under different harness, version, target or account resolves independently; records for another version are provenance only; `effort_choices` never offers `UNSUPPORTED` values and yields only `HarnessDefault` + `OMIT` when unknown; `check_effort` errors; `refresh_needed` for first launch and version change; `apply_discovery` leaves the cache unchanged on failure and never touches overrides; `validate_override` field errors. **[R061–R065]** |
| Use cases (fake ports) | `RefreshCatalog` with a timing-out, offline and auth-rejecting fake discoverer: cache and overrides byte-identical, status records the distinct cause, events emitted; `EnsureCatalogFresh` starts jobs only for first launch and version change; `GetEffortChoices` and `CheckSelection` raise `no_supported_harness` when the fake inventory has none, even with a populated cache. **[R063, R137]** |
| API (`InProcessClient`, no interface) | Every `catalog.*` method round-trips its DTOs; error codes and `field` paths are stable; `catalog.refresh` returns the same `JobRef` for an overlapping request; subscription snapshot plus `since_seq` replay delivers `catalog.refresh.finished`; registry metadata has the safety classes above; JSON Schema export includes `catalog.*`. |
| Screens (fake client, `App.run_test()` / `Pilot`) | `CatalogScreen` renders `? unknown` cells with class `unknown`, the refresh-failed bar and `#retry` from a fake `RefreshStatusDTO`, and `f5` issues exactly one `catalog.refresh`; `f5` is disabled when the fake returns `can_refresh: false`; `OverrideScreen` shows `catalog.override_invalid` field errors; `EntryPickerScreen` shows only the returned choices and a single “Harness default” when `effort_support` is `unknown`. View-model builders are tested as pure functions without Textual. |
