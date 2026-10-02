# M07 — Run configuration and launch validation

Status: proposed requirements. This module defines reusable setup and the immutable settings handed to execution; it does not describe implemented functionality. [SPEC.md](../SPEC.md) remains authoritative.

## Purpose and scope

A template defines the specification, ordered tasks, starting files, acceptance checks, execution protocol, and grading rubric. A run configuration selects harnesses, providers, models, efforts, environment settings, judge, and scoring weights for that definition. A result records one configuration's outcome on one machine against the exact template revision. Keep these concepts distinct so users can vary execution choices without redefining benchmark work. **[R017]**

Persist reusable configurations per template revision and scoring presets in YAML. Save harness/model/effort choices for each benchmark, with every configuration pinning its template SHA-256. Users may add or edit configurations for a future run without changing that hash or overwriting previous results. ZIP exchange carries templates and results through [M17](17-zip-exchange.md). Imported templates can use destination-machine harnesses; originating executable paths, credentials, and hardware are not template prerequisites. **[R009, R019, R066]**

The library's existing seven-task inventory benchmark is the default and runs without generating tasks. Templates created, duplicated, revised, or imported through the library and planning modules also support their own saved configurations. Selecting an approved revision must preserve its approved task suite. **[R136, R037]**

## Configuration behavior

Load the selected revision's saved configurations or let users select harness/provider/model/effort combinations. Allow multiple entries for the same harness so distinct configurations can be compared. Default environment policy to clean settings and offer current settings. Apply the isolation semantics and limitations of [M05](05-harness-execution-isolation.md); do not silently change an unavailable clean policy to current settings. **[R032]**

Judge selection is independent of competitor selection. Preselect a valid saved judge harness/model/effort selection first, otherwise the planner configuration if planning was used, otherwise the first selected usable configuration. Resolve and validate the candidate using current readiness and capability information; an unusable candidate must not become an executable choice by assumption. Explain any unresolved selection before launch. The user can change the judge independently. Apply the template's rubric and one grading profile to every configuration in the comparison. Defaults are selection conveniences, never model-quality recommendations. **[R033, R037]**

Provide editable quality-category and cost/time/quality ranking weights, reusable presets, and restoration of defaults. Validate, normalize, and preview both sets using [M06](06-scoring-rankings.md), which owns numeric weight constraints and scoring and consumes the rubric categories and profile defaults defined in [M12](12-quality-judging.md). Both sets must be saved and reproducible; neither can remain unresolved when launching. Resolve the selected preset into the launch's actual weights so later preset edits cannot alter the run. **[R033, R066, R145]**

Execution settings include the number of trials per configuration (default 1; any positive whole number is accepted, with no upper limit, and anything else is rejected), the hardware sampling interval (0.5–10 s, default 1 s, validated by [M18](18-hardware-monitoring.md)), the display currency (default USD) and an optional electricity tariff per kWh with its currency (both validated by [M10](10-measurements-cost.md)). All of them are set in Setup or in the configuration YAML before launch and are frozen with the run; none of them is part of the template identity. A tariff or display currency chosen later in Results is an analysis setting of M10 and never changes the frozen record. **[R066, R081, R106, R114, R154]**

The configuration holds no exchange rates. At launch, the exchange rates to USD that the catalog ([M04](04-model-catalog.md)) holds for every price currency of the selections, for the display currency and for the tariff currency are frozen as a rate snapshot beside the price snapshot, each with its source URL, retrieval date and whether the user supplied it. This replaces the former single COP rate; COP is one currency among others. A currency the catalog has no rate for is recorded as missing, and every value converted with it is unknown; no rate is guessed, and the historical README exchange rate is never used. Rates are never collected during a run. **[R081]**

Each selection's billing kind (`api`, `subscription`, `local`, `unknown`) is taken from M04 at launch with its source: read from the harness, declared by the user per account through the catalog override, or unknown. A declared kind is frozen as declared and labelled "declared by user" wherever the launch shows a cost basis. Unknown billing is frozen as unknown and never supports a verified $0 ([M10](10-measurements-cost.md)). **[R080]**

When a launch requests more than 5 trials and at least one configuration is not on a local endpoint, launch validation returns a non-blocking trial budget warning with the totals: configurations × trials × tasks task runs and the number of judge sessions ([M12](12-quality-judging.md)). The launch review asks for confirmation in a dialog stating that the extra trials will consume budget and subscription usage, with those totals. The warning is not raised when every configuration is on a local endpoint. An unattended launch prints the warning and continues; it never prompts. **[R077]**

Before execution, show the complete setup: template identity, all competitor entries and their providers/models/efforts, environment policies, judge selection, grading profile, both weight sets, and execution settings supplied by the scheduling and isolation modules. Show relevant readiness and isolation limitations. The displayed setup and resolved launch settings must agree. **[R032, R033, R037]**

## Conceptual data and operations

Maintain three distinct records: reusable revision-scoped configuration choices, reusable scoring presets, and the resolved launch configuration. The resolved configuration includes all selections actually authorized for that launch and its original weights. Preserve the requested choices and capability evidence under the [M04 catalog contract](04-model-catalog.md); this module introduces no model identifiers, effort values, or catalog schema. **[R017, R066]**

Loading, adding, editing, and saving operate on reusable choices. Unsaved setup edits are kept as a draft on disk under `~/.axbenchmark/drafts/`, so a draft survives a closed interface and an engine exit until it is saved or discarded. Resolving and validating operate on a prospective launch. Freezing produces the immutable execution input; later configuration edits affect future runs only. Capture the pinned hash, resolved configuration, originating machine identity/details, and catalog metadata used at launch, including a snapshot of the provider prices used for each selection with their source and retrieval date, each selection's billing kind with its source, and the snapshot of exchange rates with their source and retrieval date, for [M02](02-retained-results-comparability.md) to retain with each result. Redact credentials from exported settings, logs, and reports, including diagnostic descriptions derived from configuration. **[R019, R066, R067, R080]**

## Validation, failures, and invariants

Before execution, ask [M01](01-template-library-identity.md) to recompute the selected template's SHA-256 and verify the configuration's pin. Its immutable definition includes the approved specification, prompts, checks, rubric, execution protocol, and starting snapshot. A mismatched pin cannot launch as that claimed revision. Bind each result to the verified identity, then separately freeze the resolved configuration and original weights before execution begins. **[R067]**

All competitors use the same approved suite and grading profile. Configuration changes cannot alter those inputs. During execution, detected mutation of template inputs invalidates the result's claim to that template and halts the whole run ([M11](11-run-orchestration.md)); never silently relabel the result with a newly computed identity. The execution lifecycle must preserve this invalidation and the original launch record. **[R037, R067]**

Use M03 readiness, M04 compatibility, M05 environment controls, M12 judge requirements, and M06 weight validation when determining launch readiness. Explain invalid or incomplete settings at setup; do not claim compatibility from a model name or invent effort choices. Unattended launch uses the same contracts through M14 without waiting for interactive configuration. **[R032, R033, R066]**

The application computes totals from separately retained raw judge grades. Alternative weights in results or HTML recalculate totals without judge calls or overwriting original results. Label alternatives, allow reset to original weights, and support exporting the alternative configuration/report through M06, M15, and M13. Original weights, grades, and outcomes survive every analysis change. **[R096, R145]**

## Acceptance criteria

- Save distinct YAML configurations for two revisions; changing one leaves both template hashes and historical results intact. Repeat with an imported revision using local harnesses. **[R009, R019, R066, R136]**
- Configure multiple entries for one harness, switch clean/current settings, and verify the complete setup matches the resolved launch. **[R017, R032]**
- Set trials, sampling interval, display currency and tariff in Setup and in YAML: invalid values are rejected with the owner's explanation and never replaced; valid values appear in review and in the frozen record, and the template hash is unchanged. A trial count of 50 is accepted. **[R066, R077, R106, R114]**
- Launch with 6 trials and one cloud configuration: review shows the trial budget warning with task-run and judge-session totals and the TUI asks for confirmation before launching; `run --no-tui` prints the warning and continues. With 6 trials and only local-endpoint configurations, or with 5 trials, no warning is raised. **[R077]**
- Launch with prices in USD and EUR and display currency COP: the frozen rate snapshot holds EUR and COP with source and date (USD needs none), and a user-supplied rate is labelled as such. Without a catalog rate for EUR, the snapshot records EUR as missing and the launch proceeds. Refreshing rates after launch leaves the frozen snapshot unchanged. **[R081]**
- Declare an account's billing kind in the catalog: review shows it labelled "declared by user" and the frozen record keeps the declared kind and its source; an account with no reading and no declaration is frozen as `unknown`. **[R080]**
- Edit a setup, close the interface and restart the engine: the draft reopens with its unsaved edits until it is saved or discarded. **[R019]**
- Exercise each judge-preselection branch, independent judge editing, common suite/profile, and completed weight selection; defaults make no quality claim. **[R033, R037]**
- Verify launch records preserve machine/catalog metadata, the price snapshot with source and date, billing kinds with their source and the rate snapshot, exclude credentials from exports/logs/reports, and freeze configuration and original weights before execution. A mismatched or mutated template cannot retain a verified matching claim. **[R066, R067, R080]**
- Save, reload, validate, reset, and export both weight sets; alternative calculations preserve raw grades and original results and require no judge calls. **[R096, R145]**

## Implementation

This section applies [the architecture decision](ARCHITECTURE.md) to run configuration. Everything below is an implementation decision; the product behavior above stays authoritative. All validation, judge preselection, preset resolution and freezing run in the engine; Setup, review and the CLI only present what the `configs.*` methods return.

### 1. Engine component

Package `axbenchmark.engine.configs`, API namespace `configs.*`. The module owns saved configurations, scoring presets, persisted setup drafts and the frozen launch records. It starts no processes; the launch itself is M11's `runs.launch` job, which calls this module's `LaunchPreparation` Protocol for resolution and the two freeze steps.

Three record kinds stay separate types, files and digests, as required above: the reusable `RunConfiguration`, the reusable `ScoringPreset`, and the `FrozenLaunch`. A fourth, the `Draft`, is the engine-held working copy that Setup edits; it is never a launch input until resolved. **[R017, R066]**

**Domain** (`engine/configs/domain/`, frozen dataclasses, no I/O):

| Type or rule | Shape and behavior |
|---|---|
| `RevisionRef` | `template_sha256` (M01's revision key) plus display `label` (`r1`). The only link from a configuration to a template; there is no global selection. **[R019]** |
| `ConfigEntry` | `entry_id`, `harness: HarnessId`, `target: ProviderRef \| EndpointRef`, `account: AccountRef` (non-secret, from M04/M03), `model_id: str`, `effort: EffortRequest` (M04 vocabulary: `Explicit(value)` or `HarnessDefault`), `policy: EnvPolicy` (`CLEAN` default, `CURRENT`). Two entries may share every field except `entry_id`; they are distinct configurations. **[R017, R032]** |
| `JudgeSelection` | `harness`, `target`, `account`, `model_id`, `effort`, `origin: SAVED \| PLANNER \| FIRST_USABLE \| USER`. Stored apart from `entries`; editing one never edits the other. **[R033]** |
| `WeightChoice` | Per set: `PresetRef(preset_id)` or `ExplicitWeights(mapping)`. `WeightChoices(quality, ranking)`. |
| `ExecutionSettings` | `concurrency: ConcurrencyChoice` (M11 vocabulary, default from M11), `trials: int` (M11 vocabulary, default 1 from M11's `ExecutionDefaults`, validated by `SchedulingVocabulary.validate_trials`), `monitoring: MonitoringChoice` (M18 vocabulary: `mode`, default automatic, and `sampling_interval_s`, default 1, validated by `MonitoringOptions.validate`), `accounting: Accounting` (M10 vocabulary: `display_currency`, an ISO 4217 code, default `USD`, and an optional electricity tariff per kWh with currency, validated through M10's `AccountingValidation`; it holds no exchange rate), `task_timeout` (M11's `ExecutionDefaults`: 3 h, as SPEC fixes it). All are frozen with the launch and none enters the template identity. Values are opaque here and validated by their owners; `trials` has no upper limit. **[R066, R077, R081, R106, R114]** |
| `RunConfiguration` | `config_id`, `name`, `revision: RevisionRef` (the pin), `entries: tuple[ConfigEntry, ...]`, `judge: JudgeSelection \| None`, `weights: WeightChoices`, `execution: ExecutionSettings`, `schema: int`. Contains no credential field. **[R019, R066]** |
| `ScoringPreset` | `preset_id`, `kind: QUALITY \| RANKING`, `name`, `weights: mapping`, `profile_id` (quality presets only, so categories match a grading profile), `builtin: bool`. Built-ins are the profile defaults (M12) and equal ranking weights (M06); they cannot be edited or deleted. **[R145]** |
| `Draft` | `draft_id`, `base: StoredConfigRef \| None` (config id + file digest), `current: RunConfiguration`, `dirty: bool` (structural comparison with the base), `updated_at`. Persisted after every successful draft command, so it survives client disconnects and engine exits. |
| `SetupFacts` | Everything gathered from other modules for one draft: template revision facts, readiness assessment per entry and judge (M03), `SelectionEvidence` or catalog problem per entry and judge (M04, with billing kind and its source), the catalog's exchange rates for the currencies the setup needs (M04 `ExchangeRates`, or missing per currency), clean-policy assessment per entry (M05), weight validation per set (M06), judge requirements, grading profile and judge-session count (M12), task count of the revision (M01), planner selection if planning was used (M16), scheduling notes (M11), monitoring limitations (M18), machine record (M03). Use cases build it; domain rules only read it. |
| `Issue` | `code` (the owning module's error code, e.g. `catalog.effort_unsupported`, `environment.auth_rejected`, `scoring.invalid_weights`, `configs.judge_unresolved`), `source` (`M01`…`M18`), `subject` (`entry` + `entry_id` \| `judge` \| `quality_weights` \| `ranking_weights` \| `execution` \| `template`), `message`, `remedy`, `fix: EDIT_ENTRY \| ENVIRONMENT \| JUDGE \| WEIGHTS \| REMOVE_ENTRY \| None`. Blocking. |
| `Limitation` | Same shape, non-blocking (missing optional power metrics, isolation limitations reported by M05, `configs.rate_missing` for a needed currency the catalog has no rate for, naming the currency and that converted values will be unknown). |
| `validate_setup(config, facts) -> SetupValidation` | Pure. Issues: pin differs from the opened revision (`configs.pin_mismatch`); no entries (`configs.no_entries`); any entry not ready, not resolvable in the catalog or with an unsupported or unknown-but-explicit effort; judge unresolved or lacking a required capability; either weight set unresolved (missing preset, invalid values); execution values rejected by their owner. Nothing is replaced: an issue names the input and its source and the value stays as entered. **[R032, R033, R066]** |
| `preselect_judge(saved, planner, entries, facts) -> JudgePreselection` | Pure. Candidates in order: valid saved judge, then the planner selection when planning was used for this revision, then the first entry (in entry order) that is usable as a judge. Each candidate is checked against `facts` (readiness, catalog, judge requirements); a failed candidate is recorded with its reason and skipped. No usable candidate → `None` and `configs.judge_unresolved`. Applied while `judge.origin != USER`; a user choice is never replaced by preselection. **[R033, R037]** |
| `resolve_launch(config, facts, presets, adjustments) -> ResolvedLaunch` | Pure. Requires an empty issue list. Copies each preset's values into actual weights (`OriginalWeights`), attaches `SelectionEvidence` per entry and judge (including M04's `Pricing` with source URL, layer and retrieval date, or its unknown state, and the billing kind with its source), the `RateSnapshot` built by `rate_snapshot`, the `trial_budget_warning` from `trial_budget`, the template's rubric and single grading profile, execution settings (trials, sampling interval, accounting with display currency and tariff), scheduling notes, machine record and `CredentialPresence(name, is_set)` per entry. `adjustments` (`exclude_entries`, `policy_overrides` from the clean-mode dialog) are applied and recorded as such. **[R033, R037, R066, R080]** |
| `digest(resolved) -> PreviewDigest`, `configuration_digest`, `weights_digest` | SHA-256 over a canonical serialization (sorted keys, no timestamps). The configuration and weights digests are computed over separate documents so the two frozen records are independent. |
| `PriceSnapshot` | One row per entry and judge, mapped from M04's `SelectionEvidence`: selection, `price_in` ← `Pricing.input_per_mtok`, `price_out` ← `Pricing.output_per_mtok` per million tokens (`Decimal \| None`), `currency` ← `Pricing.currency`, `source_layer` ← the resolving `PriceRecord.layer` (`discovered`, `bundled`, `override`, `unknown`), `source_url`, `retrieved_at`, `billing` (`api`, `subscription`, `local`, `unknown`) and `billing_source` (`endpoint` for an `EndpointRef`, `discovered` when M05's probe read it from the harness, `override` when the user declared it for the account, `unknown`), both ← `SelectionEvidence.billing`. `billing_source = override` is displayed as "declared by user". Taken from the `SelectionEvidence` M04 returned during resolution; never refreshed during a run. **[R080]** |
| `RateSnapshot` | `display_currency` and one `RateRow` per needed currency other than USD: `currency`, `per_usd` (`Decimal`, units of the currency for 1 USD, e.g. COP 4050) ← M04 `ExchangeRate`, `source_layer` (`discovered` for a rate collected during a catalog refresh, `override` for a user-supplied rate, labelled "supplied by user"), `source_url`, `retrieved_at`; or `MissingRate(currency)` when the catalog has none. Needed currencies are every `PriceSnapshot.currency`, the display currency and the tariff currency. Taken during resolution; never refreshed during a run, and no rate constant exists in the package. **[R081]** |
| `rate_snapshot(prices, accounting, rates) -> RateSnapshot` | Pure. Collects the needed currencies, copies each rate M04 returned and records each absent one as `MissingRate`; a missing rate is a `configs.rate_missing` limitation, never an issue. **[R081]** |
| `TrialBudgetWarning` | `code = "configs.trial_budget_warning"`, `trials`, `threshold` (5), `configurations` (entry count), `tasks` (revision task count), `task_runs` (`configurations × trials × tasks`), `judge_sessions` (M12's count), `affected: tuple[entry_id, ...]` (entries not on a local endpoint), `message` (the engine's text: the extra trials will consume budget and subscription usage, with the totals). Non-blocking; not an `Issue` or a `Limitation`. **[R077]** |
| `trial_budget(config, facts) -> TrialBudgetWarning \| None` | Pure. A warning when `execution.trials > TRIAL_BUDGET_THRESHOLD` (5) and at least one entry's target is not an `EndpointRef` (local endpoint); `None` otherwise, including when every entry is on a local endpoint. There is no upper limit on trials. **[R077]** |
| `FrozenLaunch` | `run_id`, `template: VerifiedIdentity` (from M01), `configuration: ResolvedConfiguration` + digest, `weights: OriginalWeights` + digest, `machine`, `catalog: tuple[SelectionEvidence, ...]`, `prices: PriceSnapshot`, `rates: RateSnapshot`, `trial_budget_warning: TrialBudgetWarning \| None` (as raised at launch), `frozen_at`. Immutable once written. **[R067, R077, R080, R081]** |
| `redact(value)` | Credentials never enter the domain: accounts are labels and fingerprints, credentials are `CredentialPresence`. `redact` additionally applies the `SecretScrubber` result to any diagnostic text derived from configuration before it is persisted or returned. **[R066]** |

**Ports** (`engine/configs/ports.py`):

```python
class ConfigRepository(Protocol):
    async def list(self, sha: Sha256) -> Sequence[StoredConfig]: ...
    async def load(self, config_id: ConfigId) -> StoredConfig: ...          # raises ConfigFileInvalid
    async def load_path(self, path: Path) -> RunConfiguration: ...          # unattended --config FILE
    async def save(self, cfg: RunConfiguration, expected: FileDigest | None) -> StoredConfig: ...  # atomic; FileChanged, NameTaken

class PresetRepository(Protocol):
    async def list(self) -> Sequence[ScoringPreset]: ...
    async def save(self, preset: ScoringPreset) -> ScoringPreset: ...
    async def delete(self, preset_id: PresetId) -> None: ...

class DraftStore(Protocol):                 # on disk; drafts outlive clients and engine exits
    async def get(self, draft_id: DraftId) -> Draft: ...                    # raises UnknownDraft, DraftInvalid
    async def find(self, config_id: ConfigId) -> Draft | None: ...
    async def unsaved(self, sha: Sha256) -> Sequence[Draft]: ...            # drafts of the revision with no saved file
    async def put(self, draft: Draft) -> None: ...                          # atomic
    async def remove(self, draft_id: DraftId) -> None: ...

class LaunchRecordStore(Protocol):
    async def stage(self, run_id: RunId, part: FrozenPart) -> None: ...     # configuration, weights, template binding, machine/catalog
    async def commit(self, run_id: RunId) -> LaunchLocation: ...            # rename staging dir; files become read-only
    async def discard(self, run_id: RunId) -> None: ...
    async def load(self, run_id: RunId) -> FrozenLaunch: ...

class SetupFactsSource(Protocol):           # one adapter per owner module, combined by GatherSetupFacts
    async def gather(self, cfg: RunConfiguration) -> SetupFacts: ...

class SecretScrubber(Protocol):
    def scrub(self, text: str) -> str: ...
```

Plus the shared `Clock`, `IdGenerator` and `EventPublisher` ports.

**Application** (`engine/configs/application/`, one class each, ports injected in `__init__`):

| Use case | Method | Does |
|---|---|---|
| `ListConfigurations` | `configs.list` | Saved configurations of one revision with pin status and summaries, plus the revision's drafts (unsaved edits of a saved configuration, and never-saved drafts). |
| `GetConfiguration` | `configs.get` | One saved configuration, read-only. |
| `OpenDraft` | `configs.open` | Loads a persisted draft by `draft_id`, or a saved configuration (or the revision's most recently saved one, or a new empty configuration) into a draft, gathers facts, applies `preselect_judge`, persists the draft, returns the `SetupView`. Reopening a configuration that already has a draft returns that draft, also after an engine restart. |
| `GetSetupView` | `configs.setup` | Re-gathers facts and returns the current `SetupView` of a draft. |
| `AddEntry`, `UpdateEntry`, `RemoveEntry` | `configs.add_entry`, `configs.update_entry`, `configs.remove_entry` | Edit draft entries. `AddEntry`/`UpdateEntry` reject a selection M04 rejects (`catalog.*` codes verbatim); readiness problems do not reject the edit, they become issues. |
| `GetJudgeCandidates` | `configs.judge_candidates` | The preselection branches with their outcomes and the judge requirements. |
| `SetJudge` | `configs.set_judge` | Checks the selection with M04 (`require` from M12) and M03; rejects with their codes; stores with `origin = USER`. |
| `SetWeights` | `configs.set_weights` | Stores a preset reference or explicit values per set after M06 validation. |
| `SetExecution` | `configs.set_execution` | Stores concurrency and trials (no upper limit), monitoring (mode and sampling interval) and accounting (display currency, tariff) after M11 / M18 / M10 accept the values. Rejected values are not stored and the owner's code is returned. |
| `SaveConfiguration` | `configs.save` | Validates structure (not readiness), writes YAML; `as_name` creates a new file ("Save as…"). Never touches the template or results. **[R019]** |
| `DuplicateConfiguration` | `configs.duplicate` | Copies a saved configuration within its revision under a new name. |
| `DiscardDraft` | `configs.discard` | Deletes a draft and its file. |
| `ListPresets`, `SavePreset`, `DeletePreset` | `configs.list_presets`, `configs.save_preset`, `configs.delete_preset` | Preset YAML; values validated by M06 before writing. **[R145]** |
| `ReviewLaunch` | `configs.review` | Gathers facts, runs `validate_setup`, then `resolve_launch`; returns the `LaunchPreview` and its digest (including the rate snapshot and any `trial_budget_warning`), or `configs.incomplete` with every issue. The warning never blocks and never makes the setup incomplete. |
| `GetLaunchRecord` | `configs.launch_record` | The frozen records of a run (template, configuration, weights, machine, prices, rates) and the redacted resolved YAML. |
| `RevalidateDrafts` | internal | On readiness, catalog (including price, exchange-rate and billing-declaration overrides), preset or template events: re-gather facts for drafts with a subscriber, re-apply preselection where allowed, publish `configs.draft.updated`. Other drafts are revalidated when they are next opened. |
| `PrepareLaunch` | internal, `LaunchPreparation` | Used by M11's `runs.launch`: `resolve` (as `ReviewLaunch`, then compare with `preview_digest` when one is given; mismatch → `configs.review_stale`), `freeze_configuration` (also writes the `PriceSnapshot` and the `RateSnapshot`), `freeze_weights`, `commit`, `discard`. A `trial_budget_warning` in the resolved launch does not stop it: the interactive path confirmed it in the review dialog and the unattended path prints it. Publishes `configs.launch.frozen`. **[R067, R077, R080, R081]** |

Application Protocols this module offers to others:

```python
class LaunchPreparation(Protocol):          # M11 runs.launch
    async def resolve(self, source: LaunchSource, adjustments: LaunchAdjustments,
                      preview_digest: PreviewDigest | None) -> ResolvedLaunch: ...   # SetupIncomplete, ReviewStale
    async def freeze_configuration(self, run_id: RunId, resolved: ResolvedLaunch,
                                   identity: VerifiedIdentity) -> FrozenRef: ...
    async def freeze_weights(self, run_id: RunId, resolved: ResolvedLaunch) -> FrozenRef: ...
    async def commit(self, run_id: RunId) -> FrozenLaunch: ...
    async def discard(self, run_id: RunId) -> None: ...

class LaunchRecords(Protocol):              # M02, M05, M10, M11, M12, M17
    async def get(self, run_id: RunId) -> FrozenLaunch: ...

class RevisionConfigs(Protocol):            # M01
    async def summaries(self, sha: Sha256) -> Sequence[ConfigSummary]: ...
    async def copy(self, from_sha: Sha256, to_sha: Sha256) -> int: ...   # all or nothing, re-pinned to to_sha
    async def remove(self, sha: Sha256) -> int: ...   # deletes the revision's saved configurations when M01 deletes the revision; returns the count

class WeightPresets(Protocol):              # M06
    async def list(self, profile_id: str | None) -> Sequence[ScoringPreset]: ...

class SavedJudges(Protocol):                # M12 judging.rejudge_options
    async def for_template(self, sha: Sha256) -> Sequence[JudgeSelection]: ...   # judge selections of the revision's saved configurations
```

`LaunchSource` is exactly one of `draft_id`, `config_id` or `config_path`. A draft source is the interactive path; `config_id` and `config_path` are the unattended path and need no preview digest. **[R033, R066]**

**Adapters** (`engine/configs/adapters/`):

| Adapter | Implements |
|---|---|
| `config_yaml.py` | `ConfigRepository` under `~/.axbenchmark/configs/<template_sha256>/<slug>.yaml`; temp-file-and-rename writes; a malformed or foreign file is reported (`configs.file_invalid`, `configs.pin_mismatch`) and never rewritten by the engine. `load_path` reads a user-supplied YAML of the same schema. |
| `preset_yaml.py` | `PresetRepository` under `~/.axbenchmark/presets/{quality,ranking}/<slug>.yaml`; built-ins come from M12 profile defaults and M06 defaults and are not files. |
| `fs_drafts.py` | `DraftStore` under `~/.axbenchmark/drafts/setup/<draft_id>.yaml` (directory 0700), temp-file-and-rename writes. A draft file that cannot be parsed is reported as `configs.draft_invalid` and left in place; it is never rewritten silently. Planning drafts of M16 live beside it under `drafts/planning/` and are not read by this module. |
| `launch_store.py` | `LaunchRecordStore` under `~/.axbenchmark/launches/<run_id>/`, staged in `.staging-<run_id>/` and renamed on commit; files are written once with mode 0444. |
| `facts/readiness.py`, `catalog.py`, `rates.py`, `policy.py`, `weights.py`, `judging.py`, `planning.py`, `scheduling.py`, `monitoring.py`, `template.py` | `SetupFactsSource` parts over the owner modules' application Protocols listed in part 3. Each converts the owner's result into `SetupFacts` without reinterpreting its codes. `rates.py` reads M04's cached rates only (`ExchangeRates.lookup`); it never triggers a rate collection. |
| `scrubber.py` | `SecretScrubber` over M03's credential presence data (names and set/unset only; values are matched in memory and never stored). |
| `rpc.py` | Registers `configs.*`, maps DTOs to use-case inputs and domain errors to the codes below. |

**Persisted state** (the engine is the only reader and writer):

| File | Content | Written by |
|---|---|---|
| `~/.axbenchmark/configs/<template_sha256>/<slug>.yaml` | `schema: 1`, `name`, `template: {sha256, label}`, `entries: [{id, harness, provider \| endpoint, account, model, effort: <value> \| harness_default, policy: clean \| current}]`, `judge: {…} \| null`, `weights: {quality: {preset: id} \| {values: {…}}, ranking: …}`, `execution: {concurrency, trials, monitoring: {mode, sampling_interval_s}, accounting: {display_currency, tariff: {per_kwh, currency} \| null}}` (`display_currency` defaults to `USD` when absent; no exchange rate is stored in a configuration). No credentials. **[R019, R066, R081]** | `configs.save`, `configs.duplicate`, `RevisionConfigs.copy` |
| `~/.axbenchmark/drafts/setup/<draft_id>.yaml` | `schema: 1`, `draft_id`, `base: {config_id, file_digest} \| null`, `updated_at`, `configuration` (same schema as above). No credentials. | every draft command; removed by `configs.discard` and by a save that leaves the draft clean |
| `~/.axbenchmark/presets/quality/<slug>.yaml`, `presets/ranking/<slug>.yaml` | `schema: 1`, `name`, `profile_id` (quality), `weights`. | `configs.save_preset`, `configs.delete_preset` |
| `~/.axbenchmark/launches/<run_id>/template-binding.yaml` | Approved and recomputed SHA-256 (equal), revision label, checked time. | `LaunchPreparation.freeze_configuration` |
| `…/configuration.resolved.yaml` | Resolved entries, judge, rubric and grading profile, policies and adjustments, execution settings (including display currency), the `trial_budget_warning` if one was raised, `CredentialPresence` per entry; its digest. | `freeze_configuration` |
| `…/weights.original.yaml` | Resolved quality and ranking weights with the preset names they came from; its digest. | `freeze_weights` |
| `…/machine.yaml` | Machine identity and details, `SelectionEvidence` per entry and judge (catalog version, sources, billing kind and its source). | `freeze_configuration` |
| `…/prices.yaml` | `PriceSnapshot`: per entry and judge, prices and their currency, source layer, source URL, retrieval date, billing kind and billing source. Read by M10 for every estimate of the run. | `freeze_configuration` |
| `…/rates.yaml` | `RateSnapshot`: display currency; per needed currency `per_usd`, source layer, source URL, retrieval date, or `missing`. Read by M10 for every conversion of the run; carried in result ZIPs by M17. **[R081]** | `freeze_configuration` |

Drafts survive client disconnects and engine exits; the engine's idle exit does not wait for them. Setup still shows the unsaved state against the saved file. Later edits to configurations or presets never touch `launches/`. **[R067]**

**Owned processes**: none.

### 2. API surface

DTOs live in `axbenchmark.api.configs`. A `CapabilityDTO` is `{allowed: bool, reason?: str}` where `reason` is an error code. An `IssueDTO` is `{code, source, subject: {kind, entry_id?, label}, message, remedy?, fix?}`; a `LimitationDTO` has the same fields without `fix`. Codes from other namespaces are passed through unchanged.

`SetupView` (returned by `configs.open`, `configs.setup` and every draft command):

| Field | Content |
|---|---|
| `draft_id`, `config_id?`, `config_name`, `dirty`, `dirty_summary` | `dirty_summary` is the engine's text, e.g. "5 entries, saved file has 4". |
| `configurations` | `[{config_id, name, draft_id?}]` of this revision plus `[{draft_id, name, updated_at}]` for never-saved drafts, for `#configuration`. |
| `identity` | `{template_name, revision_label, sha256, builtin, planner_note}` (e.g. "approved tasks reused, no planner call"). |
| `entries` | `[EntryRowDTO {entry_id, ordinal, harness_label, provider_label, model_id, effort_label, policy, readiness: {state: ready \| blocked \| unknown, text}, schedule_note?, issue_codes}]` |
| `judge` | `{selection?, label, chosen_by: saved \| planner \| first_usable \| user \| unresolved, readiness_text, rubric_label, profile_label}` |
| `weights` | `{quality: WeightPaneDTO, ranking: WeightPaneDTO, preset_options: {quality: [...], ranking: [...]}}`; `WeightPaneDTO {choice: {preset_id} \| "explicit", label, summary, state: resolved \| missing \| invalid}` |
| `execution` | `{concurrency, concurrency_options: [{value, label}], trials, monitoring: {mode, sampling_interval_s, label}, accounting: AccountingDTO, accounting_label, notes: [[label, text]]}`; `accounting_label` is the engine's text, e.g. "display COP · 1 USD = 4,050 COP (catalog, 2026-09-30) · tariff 0.18 USD/kWh" or "display EUR · no rate, converted values unknown". |
| `issues`, `limitations` | `[IssueDTO]`, `[LimitationDTO]` |
| `capabilities` | `can_save`, `can_save_as`, `can_review` (false with `configs.incomplete` while issues exist), `can_add_entry`, per-entry `can_edit` / `can_remove`, `can_edit_judge`, `can_edit_weights`, `can_edit_execution` |

**Queries** (safety `read`):

| Method | Request | Response | Errors | Capability flags |
|---|---|---|---|---|
| `configs.list` | `template_sha256` | `ConfigList {revision, configs: [ConfigSummaryDTO {config_id, name, entry_count, entries: [EntryRowDTO], judge_label, pin_matches, updated_at, draft_id?}], drafts: [{draft_id, name, updated_at}]}` (`drafts`: never-saved drafts) | `templates.not_found` (pass-through), `configs.file_invalid` (per row, not raised) | `can_create`, per row `can_edit`, `can_duplicate` |
| `configs.get` | `config_id` | `ConfigDetail {summary, yaml_text}` | `configs.unknown_config`, `configs.file_invalid` | — |
| `configs.setup` | `draft_id` | `SetupView` | `configs.unknown_draft` | in `SetupView` |
| `configs.judge_candidates` | `draft_id` | `JudgeCandidates {branches: [{rank, kind: saved \| planner \| first_usable, selection?, outcome: chosen \| skipped \| not_used \| not_reached, reason?}], current?, fallback: bool, required_capabilities, rubric_label, harness_options: [{harness, target, account_id, label, readiness_text}]}` | `configs.unknown_draft` | `can_set_judge` |
| `configs.list_presets` | `kind?`, `profile_id?` | `PresetList {presets: [{preset_id, kind, name, weights, builtin, profile_id?}]}` | — | per preset `can_delete` |
| `configs.review` | `draft_id \| config_id \| config_path`, `execution?` (CLI `--jobs`) | `LaunchPreview {preview_digest, template, entries: [ReviewEntryDTO {ordinal, harness, provider, model_id, effort_requested, policy, note}], judging: {judge_label, chosen_by, readiness, rubric, profile, quality: {preset, weights, percentages}, ranking: {…}}, execution: [[label, text]] (concurrency, trials, totals "4 configurations × 6 trials × 7 tasks = 168 task runs, 24 judge sessions", task timeout, monitoring with sampling interval, display currency and tariff), trial_budget_warning: TrialBudgetWarningDTO {code, trials, threshold, configurations, tasks, task_runs, judge_sessions, affected: [entry_id], message} \| null, limitations, recorded: {machine, catalog, prices: [[selection, text]] (price, source and date, or unknown; billing kind with "declared by user" when its source is `override`), rates: [[currency, text]] ("1 USD = 4,050 COP · catalog, 2026-09-30", "supplied by user" for an override, or "no rate: converted values unknown"), credentials_note}, cli_command?}` | `configs.incomplete {issues, checks: [{area, ok, text, source?}]}` (every check in order, passing ones included, for the CLI), `configs.unknown_draft`, `configs.unknown_config`, `configs.file_invalid`, `configs.pin_mismatch`, `environment.no_harness` | `can_launch` (not affected by `trial_budget_warning`), `can_copy_cli` (false with `configs.unsaved_changes` when the draft differs from its file, since the command names the file) |
| `configs.launch_record` | `run_id` | `LaunchRecordDTO {run_id, frozen_at, records: [{kind: template \| configuration \| weights \| machine \| prices \| rates, digest?, summary}], resolved_yaml: str (redacted), path}` | `configs.launch_not_found` | — |

**Commands**:

| Method | Request | Response | Errors | Safety |
|---|---|---|---|---|
| `configs.open` | `template_sha256`, `config_id? \| draft_id?`, `replace_draft_id?`, `discard_changes: bool = false` | `SetupView` | `configs.unknown_config`, `configs.unknown_draft`, `configs.file_invalid`, `configs.draft_invalid`, `configs.pin_mismatch {pinned_sha256, pinned_label?}`, `configs.unsaved_changes` (replacing a dirty draft without `discard_changes`) | write (draft files only) |
| `configs.add_entry` | `draft_id`, `harness`, `target`, `account_id`, `model_id`, `effort: {explicit: str} \| "harness_default"`, `policy?` | `EntryResult {entry: EntryRowDTO, setup: SetupView}` | `configs.unknown_draft`, `catalog.*` from `catalog.check_selection` (with `field`, `remedy`) | write |
| `configs.update_entry` | `draft_id`, `entry_id`, any of the `add_entry` fields, `policy?: "clean" \| "current"` | `EntryResult` | as `add_entry`, `configs.unknown_entry` | write |
| `configs.remove_entry` | `draft_id`, `entry_id` | `SetupView` | `configs.unknown_draft`, `configs.unknown_entry` | write |
| `configs.set_judge` | `draft_id`, `harness`, `target`, `account_id`, `model_id`, `effort` | `SetupView` | `catalog.effort_unsupported`, `catalog.capability_unsupported`, `catalog.capability_unknown`, `environment.*` readiness codes, `configs.unknown_draft` | write |
| `configs.set_weights` | `draft_id`, `quality?: {preset_id} \| {values}`, `ranking?: …` | `SetupView` | `scoring.invalid_weights` (field paths), `configs.unknown_preset` | write |
| `configs.set_execution` | `draft_id`, `concurrency?`, `trials?: int`, `monitoring?: {mode, sampling_interval_s}`, `accounting?: AccountingDTO` (`display_currency`, `tariff \| null`) | `SetupView` | `runs.invalid_jobs`, `runs.invalid_trials` (only for a value that is not a whole number ≥ 1; there is no upper limit), `telemetry.invalid_mode`, `telemetry.invalid_interval`, `measurements.invalid_accounting` (owners' codes, with `field`) | write |
| `configs.save` | `draft_id`, `as_name?` | `SetupView` (clean, with `config_id`) | `configs.file_changed` (file changed on disk since the draft opened), `configs.name_taken`, `configs.invalid_name` | write |
| `configs.duplicate` | `config_id`, `name?` | `ConfigSummaryDTO` | `configs.unknown_config`, `configs.name_taken` | write |
| `configs.discard` | `draft_id` | `{}` | `configs.unknown_draft` | destructive (deletes the draft file) |
| `configs.save_preset` | `kind`, `name`, `weights`, `profile_id?`, `overwrite: bool = false` | `PresetDTO` | `scoring.invalid_weights`, `configs.name_taken`, `configs.preset_builtin` | write |
| `configs.delete_preset` | `preset_id` | `{}` | `configs.unknown_preset`, `configs.preset_builtin` | destructive |

`configs.save` does not require a launchable setup: incomplete configurations can be saved and reopened. Readiness, catalog and weight problems are reported as issues, never as save failures. **[R019, R032]**

**Jobs**: none. Launching is `runs.launch` (M11); this module contributes the `config` and `weights` steps through `LaunchPreparation`.

**Events**:

| Event | Payload | Emitted when |
|---|---|---|
| `configs.draft.updated` | `draft_id`, `reason: edited \| revalidated \| saved \| discarded`, `dirty` | A draft command succeeds or `RevalidateDrafts` changes its facts |
| `configs.configuration.saved` | `template_sha256`, `config_id`, `name` | `configs.save`, `configs.duplicate`, `RevisionConfigs.copy` |
| `configs.preset.saved` | `preset_id`, `kind` | `configs.save_preset` |
| `configs.preset.deleted` | `preset_id`, `kind` | `configs.delete_preset` |
| `configs.launch.frozen` | `run_id`, `template_sha256`, `configuration_digest`, `weights_digest` | `LaunchPreparation.commit` |

Subscription snapshots: topic `configs.draft` with a `draft_id` filter → the current `SetupView`; topic `configs` → `{template_sha256: config_count}` for open revisions.

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `TemplateIdentity.check(sha)`, `RevisionReader` (revision facts: name, label, approved, built-in, task count, rubric and profile ids, baseline digest), `templates.restore`, event `templates.revision.restored` | M01 | Identity facts for Setup and review; task count for the trial totals; identity check inside `runs.launch`; revalidation after a restore **[R067]** |
| `AssessOperation` / `environment.assess`, `MachineIdentitySource.current()` (machine identity and details), `InstalledHarnesses.list()` (credential presence per harness/provider, by name only), events `environment.report.updated`, `environment.harness.changed` | M03 | Entry and judge readiness, machine record, redaction input, revalidation **[R032, R066]** |
| `CheckSelection` / `catalog.check_selection` (with `require`), `catalog.options`, events `catalog.refresh.finished`, `catalog.override.saved`, `catalog.override.removed`; `SelectionEvidence.pricing` (M04's `Pricing`: `currency`, `input_per_mtok`, `output_per_mtok`, `source_url`, `retrieved_at`, with the `PriceRecord.layer` it resolved from, or unknown) and `SelectionEvidence.billing` (kind `api` \| `subscription` \| `local` \| `unknown` with its source `endpoint` \| `discovered` \| `override` \| `unknown`, precedence override > discovered > unknown); `ExchangeRates.lookup(currencies) -> Sequence[ExchangeRate \| MissingRate]` over the cached rates to USD (`ExchangeRate`: `currency`, `per_usd`, `layer` `discovered` \| `override`, `source_url`, `retrieved_at`; no collection is triggered); events `catalog.rates.updated` and the override events for rates and billing declarations | M04 | Validate entries and judge, freeze `SelectionEvidence`, the `PriceSnapshot` and the `RateSnapshot`; JudgeScreen model and effort choices **[R065, R066, R080, R081]** |
| `HarnessInspection.assess_policy(entries)`, `harness.policy.matrix` | M05 | Clean-policy assessments and isolation limitations for Setup, review and launch **[R032]** |
| `WeightValidation` / `scoring.validate_weights`, `scoring.preview_weights`, `scoring.weight_choices`, `WeightsScreen(context="setup")` | M06 | Weight validation and normalized preview; the weights editor **[R033, R145]** |
| `runs.launch` (job; request `draft_id \| config_id \| config_path`, `preview_digest?`, `execution?`, `exclude_entries?`, `policy_overrides?`; steps `identity`, `config`, `weights`, `bind`), `SchedulingVocabulary` (default, `validate`, `validate_trials` raising `runs.invalid_trials`, queue notes), `ExecutionDefaults` (trials 1, task timeout 3 h), run-id reservation, `events.subscribe`, `job.progress`, `job.finished` | M11 | Launch, concurrency and trial vocabulary and "queued after #1" notes, subscriptions **[R045, R067, R077]** |
| `JudgeRequirements.check` (grading profile id, default quality weights, required capabilities such as `image_input`), `JudgeRequirements.session_count(configurations, trials) -> int` (one fresh session per delivered artifact), `JudgeCapabilityScreen` | M12 | Judge validation and quality defaults; judge-session total of the trial budget warning **[R033, R037, R077]** |
| `PlannerRecord.planner_selection(sha) -> Selection \| None` | M16 | Second judge-preselection branch **[R033]** |
| `MonitoringOptions` (options and limitations by mode, `validate(mode, sampling_interval_s)` raising `telemetry.invalid_mode` / `telemetry.invalid_interval`, effective interval per collector), `MonitoringScreen` | M18 | Monitoring row, sampling interval and its limitations **[R102, R106]** |
| `AccountingValidation` (display currency, default USD, and tariff with currency), `CurrencyEnergyScreen(mode="setup")` (pushed by `c` from Setup; its result is applied with `configs.set_execution(accounting=…)`) | M10 | Execution pane and limitations **[R081, R114]** |
| `EntryPickerScreen` | M04 | Add and edit entries |
| `EnvPolicyScreen`, `CleanBlockedScreen` | M05 | Policy dialog; clean-mode-unavailable decision during launch |
| `LaunchCheckScreen` | M01 | Shows the `runs.launch` job |
| App shell, `ContentSwitcher` state widgets, global `F2` (Environment), `ConfirmScreen` | M15 | Shared states and navigation; the trial budget confirmation in ReviewLaunch |

Consumers of this namespace: M01 (`configs.list`, `configs.duplicate`, `RevisionConfigs`, `configs.configuration.saved`), M04 (`configs.add_entry`), M05 (`configs.update_entry` with `policy`; `LaunchRecords` for invocation inputs), M06 (`WeightPresets`, `configs.list_presets`, `configs.save_preset`), M11 (`LaunchPreparation`), M12 (`SavedJudges`), M18 (`configs.set_execution(monitoring=…)` from MonitoringScreen), M02, M10 (`LaunchRecords`: accounting with display currency, `PriceSnapshot` with billing source, `RateSnapshot`), M17 (`LaunchRecords`, including `rates.yaml` for result ZIPs), M12 and M18 (`LaunchRecords`).

### 4. Screens

Every screen below is a view over `SetupView`, `JudgeCandidates`, `LaunchPreview` or `LaunchRecordDTO`. It renders issues, limitations, readiness text and capability flags exactly as returned, displays typed errors verbatim, and never decides validity, preselection, normalization or what will be frozen.

**`SetupScreen(Screen)`** — `axbenchmark/tui/screens/setup.py`; artboards Setup (wide, compact) and SetupInvalid. Constructor `SetupScreen(template_sha256: str, config_id: str | None = None)`.

- View model `tui/viewmodels/setup.py`:
  ```python
  @dataclass(frozen=True)
  class SetupVM:
      identity_bar: str                     # #identity-bar
      config_options: list[tuple[str, str]] # #configuration (label, config_id)
      selected_config: str | None
      dirty_text: str | None                # #dirty, from dirty_summary
      entries: list[EntryRowVM]             # #entries; blocked cells carry class "-issue"
      judge: list[tuple[str, str]]          # #judge-pane .kv rows
      quality: WeightPaneVM; ranking: WeightPaneVM   # #quality-preset, #ranking-preset + summaries
      concurrency: list[RadioVM]; trials: str                          # #trials
      monitoring_text: str; accounting_text: str                       # Monitoring and Currency rows of #execution-pane
      execution_notes: list[tuple[str, str]]
      issues: list[IssueVM]                 # #validation lines: subject, message, fix key
      limitations: list[str]                # #limitations
      summary: list[tuple[str, str]]        # compact #setup-summary
      invalid: bool                         # sets SetupScreen.-invalid
      caps: SetupCaps
  def build_setup_vm(view: SetupView) -> SetupVM: ...
  ```
  `IssueVM.key` is a lookup of `IssueDTO.fix` (`EDIT_ENTRY → "e"`, `ENVIRONMENT → "F2"`, `WEIGHTS → "w"`, `JUDGE → "j"`), not a rule.
- Loads: on mount `configs.open(template_sha256, config_id)` (or `draft_id` when the screen is opened on a never-saved draft) in a worker. ContentSwitcher on `#entries`: `#entries-loading` (while `configs.open` runs, "Resolving N entries against readiness…"), `#entries` (rows), `#entries-empty` (no entries; `a Add entry`), `#entries-error` (`configs.pin_mismatch`, `configs.file_invalid` with message and remedy).
- Subscriptions: `events.subscribe(["configs.draft"], draft_id)` on mount; each `configs.draft.updated` re-renders from the snapshot or re-issues `configs.setup(draft_id)`. Unsubscribe on unmount. Leaving the screen does not discard the draft.
- `check_action` enables `review` from `caps.can_review`, `save` from `can_save`, `edit_entry`/`remove_entry` from the highlighted row, `judge` and `weights` from their flags. `SetupScreen.-invalid` follows `vm.invalid`; compact `v` toggles `#validation` (no call).

| Binding / control | Action | API call | Result shown |
|---|---|---|---|
| `esc` | `app.pop_screen` | none | — |
| `a` | `add_entry` | none on press; pushes `EntryPickerScreen(draft_id)`, which issues `configs.add_entry` | refresh from `EntryResult.setup` on dismiss |
| `e` | `edit_entry` | none on press; pushes `EntryPickerScreen(draft_id, entry_id)`, which issues `configs.update_entry` | as above |
| `del` | `remove_entry` | `configs.remove_entry(draft_id, entry_id)` | `#entries`, issues |
| `p` | `policy` | none on press; pushes `EnvPolicyScreen(draft_id, entry_id)` (M05), which issues `configs.update_entry(policy=…)` | `#entries` Env column |
| `j`, `Button #change-judge` | `judge` | none on press; pushes `JudgeScreen(draft_id)` | `#judge-pane` |
| `w`, `Button #edit-weights` | `weights` | none on press; pushes `WeightsScreen(context="setup", …)` (M06); on dismiss with `ValidatedWeights`: `configs.set_weights(draft_id, quality={values}, ranking={values})` | `#weights-pane`; `scoring.invalid_weights` shown verbatim |
| `Select #quality-preset` / `#ranking-preset` change | — | `configs.set_weights(draft_id, quality={preset_id})` or `ranking=…` | `#weights-pane` |
| `RadioSet #concurrency` change | — | `configs.set_execution(draft_id, concurrency=value)` | `#execution-pane` |
| `Input #trials` submitted | — | `configs.set_execution(draft_id, trials=<text as int>)`; text that is not a whole number is sent as entered and comes back as `runs.invalid_trials` | `#execution-pane`; the error is shown under `#trials` |
| Monitoring row (Execution pane) | — | none on press; pushes `MonitoringScreen(draft_id, current)` (M18), which issues `configs.set_execution(monitoring={mode, sampling_interval_s})` | `#execution-pane` (mode and interval), `#limitations` |
| `c`, Currency row (Execution pane) | `currency` | none on press; pushes `CurrencyEnergyScreen(mode="setup", initial=accounting)` (M10); on dismiss with an `AccountingDTO`: `configs.set_execution(draft_id, accounting=…)`; enabled from `can_edit_execution` | `#execution-pane` currency and tariff text |
| `Select #configuration` change | — | `configs.open(template_sha256, config_id \| draft_id, replace_draft_id=draft_id)`; on `configs.unsaved_changes` a confirm dialog repeats it with `discard_changes=True` | whole screen |
| `ctrl+s`, "Save configuration" | `save` | `configs.save(draft_id)` | `#dirty` cleared; `configs.file_changed` shown with remedy |
| "Save as…" | `save_as` | `configs.save(draft_id, as_name)` after a name prompt | `#configuration` |
| `enter`, `Button #review` | `review` | none on press; pushes `ReviewLaunchScreen(draft_id)`; disabled while `can_review` is false | — |
| `tab` | `focus_next` | none | — |

**`JudgeScreen(ModalScreen[JudgeChoice | None])`** — same file; artboards JudgePicker and JudgeFallback.

- View model `JudgeVM {branches: list[BranchVM], fallback_notice: str | None, harness_options, model_options, efforts: list[RadioVM], selected, checked_text, rubric_text, can_use: Capability}` built from `JudgeCandidates` and `catalog.options`. `#preselection` lists the branches with their engine outcome marks (✓ chosen, ✗ skipped with reason, ○ not used or not reached); `.notice.-warning` appears only when `fallback` is true.
- Loads: `configs.judge_candidates(draft_id)` on mount, then `catalog.options(harness, target, account_id)` for the selected harness and whenever `Select #judge-harness` changes. `RadioSet #judge-effort` shows only the returned choices. ContentSwitcher on `#judge-fields`: loading, fields, error (`catalog.no_supported_harness` and others with remedy). No subscriptions.

| Binding / control | API call | Result |
|---|---|---|
| `Select #judge-model`, `RadioSet #judge-effort` | none (choices already loaded) | local selection |
| `ctrl+s`, `Button #use` | `configs.set_judge(draft_id, …)` | dismiss with the choice; `catalog.capability_unsupported` / `catalog.capability_unknown` push `JudgeCapabilityScreen` (M12), whose `j` returns here; other codes inline |
| `esc`, Cancel | none | `dismiss(None)` |

**`ReviewLaunchScreen(Screen)`** — same file; artboard ReviewLaunch (wide, compact). Constructor `ReviewLaunchScreen(draft_id)`.

- View model `tui/viewmodels/review_launch.py`: `ReviewVM {bar, template_kv, entries: list[ReviewRowVM], judging_kv, execution_kv, recorded_kv, compact_lines, cli_command: str | None, preview_digest, budget_confirm: ConfirmVM | None, can_launch: Capability, can_copy_cli: Capability}` from `LaunchPreview`. `recorded_kv` carries the price, billing (with "declared by user") and rate lines as returned; `budget_confirm` is built from `trial_budget_warning` (title "More than 5 trials", the engine's `message`, the task-run and judge-session totals, buttons Launch and Back) and is `None` when no warning was returned. The screen renders the resolved launch, not the editable configuration.
- Loads: `configs.review(draft_id)` on mount. ContentSwitcher on `#review`: `#review-loading`, `#review`, `#review-error` (`configs.incomplete` lists the issues and offers `esc` back to Setup; other codes verbatim).
- Subscriptions: `configs.draft` for this `draft_id`; on `configs.draft.updated` with reason `revalidated` re-issue `configs.review`, so the screen never shows a stale preview.

| Binding / control | Action | API call | Result |
|---|---|---|---|
| `esc`, "Back to setup" | `app.pop_screen` | none | — |
| `c`, "Copy as CLI command" | `copy_cli` | none; copies `cli_command`; disabled from `can_copy_cli` with its reason | footer message |
| `ctrl+l`, `Button #launch` | `launch` | With `budget_confirm`: none on press; pushes M15's `ConfirmScreen(budget_confirm)` and continues only on `True` (`False` stays on the review). Then `runs.launch(draft_id=…, preview_digest=…)` (M11); disabled from `can_launch` | pushes `LaunchCheckScreen(job_ref)` (M01); `configs.review_stale` reloads the preview and says why; `harness.clean_unavailable` pushes `CleanBlockedScreen` (M05) per entry |

**`LaunchRecordScreen(ModalScreen[None])`** — `axbenchmark/tui/screens/run_config.py`; artboard LaunchRecord. Pushed from the run screens (M11, M05) for a run id.

- View model `LaunchRecordVM {title, frozen_text, records: list[RecordVM], resolved_yaml: str, path}` from `LaunchRecordDTO`; `TextArea #resolved-yaml` is `read_only=True` and shows the engine's redacted text.
- Loads: `configs.launch_record(run_id)`. States: loading, record, error (`configs.launch_not_found`). No subscriptions: the record is immutable.

| Binding | API call | Result |
|---|---|---|
| `esc`, Close | none | `dismiss()` |
| `c`, "Copy path" | none; copies `path` | footer message |

Screens of other modules that issue `configs.*` calls: `EntryPickerScreen` (M04, `configs.add_entry` / `configs.update_entry`), `EnvPolicyScreen` (M05, `configs.update_entry`), `WeightsScreen` (M06, `configs.list_presets` / `configs.save_preset`), `MonitoringScreen` (M18, `configs.set_execution`); `CurrencyEnergyScreen` (M10) issues none and returns its value to SetupScreen; the Configurations tab of `TemplateScreen` (M01, `configs.list`, `configs.duplicate`), and `LaunchCheckScreen` (M01, which shows the `config` and `weights` steps).

### 5. CLI

| Command | API |
|---|---|
| `axbenchmark run --config FILE --no-tui [--jobs N]` | `configs.review(config_path=FILE, execution)`; on `configs.incomplete` print every issue with its source and remedy and exit without freezing or starting anything; otherwise, when the preview has a `trial_budget_warning`, print its message and totals to stderr and continue without prompting, then `runs.launch(config_path=FILE, execution)` and its event stream (M11). Trials (no upper limit), sampling interval, display currency and tariff come from the file's `execution` block and are validated by the same owners as in Setup. **[R050, R060, R077]** |
| `axbenchmark configs list --template SHA` | `configs.list` |
| `axbenchmark configs show CONFIG_ID` | `configs.get` |
| `axbenchmark configs validate (--config FILE \| CONFIG_ID)` | `configs.review`; prints the preview (with its rate lines and any trial budget warning) or the issues |
| `axbenchmark configs duplicate CONFIG_ID [--name NAME]` | `configs.duplicate` |
| `axbenchmark presets list [--kind quality\|ranking]` / `presets save --kind K --name N --weights FILE` / `presets delete PRESET_ID` | `configs.list_presets` / `configs.save_preset` / `configs.delete_preset` |
| `axbenchmark run record RUN_ID` | `configs.launch_record` |

Only `run --config … --no-tui` comes from [SPEC.md](../SPEC.md); the others exist because every API method must be reachable from the CLI and are owned by [M14](14-command-line-interface.md). The draft methods (`configs.open`, entry, judge, weight and execution edits, `configs.save`, `configs.discard`) are interactive editing steps on persisted drafts; the CLI reaches the same result by passing a complete YAML file to `run`, `validate` or a registry-driven method call if M14 provides one. All commands accept `--json`.

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain (`tests/engine/configs/domain/`) | `validate_setup` produces one issue per problem with the owner's code and never alters the entry, effort, judge or preset; pin mismatch, no entries, missing preset and unresolved judge are blocking. `preselect_judge` covers each branch: valid saved judge; unusable saved judge skipped with its reason then planner; no planning then first usable entry in entry order; nothing usable → unresolved; a `USER` judge is never replaced. `resolve_launch` copies preset values (editing the preset afterwards leaves the resolved weights and digests unchanged); two entries for one harness stay distinct; adjustments are recorded; the same grading profile applies to every entry; trials, sampling interval and tariff are copied as entered and the template identity is unaffected by them; each entry's and the judge's `Pricing` lands in the `PriceSnapshot`, an unknown price stays unknown; billing kinds keep their source (`override` from a user declaration, `discovered`, `endpoint`, `unknown`) and an account with neither reading nor declaration stays `unknown`. `rate_snapshot` with prices in USD, EUR and COP, display currency GBP and a EUR tariff lists EUR, COP and GBP (never USD), copies a user-supplied rate with layer `override`, records an absent rate as `MissingRate` with a `configs.rate_missing` limitation and no issue. `trial_budget`: trials 5 → `None`; trials 6 with one provider entry → warning with `task_runs = configurations × 6 × tasks`, the fake M12 session count and that entry in `affected`; trials 6 with only `EndpointRef` entries → `None`; trials 1000 is valid. Digests are stable across key order. No domain type has a credential value field. **[R017, R032, R033, R037, R066, R067, R077, R080, R081, R145]** |
| Use cases (fake ports) | Save two configurations for two revisions with an in-memory `ConfigRepository`: each pins its own SHA-256, and a fake M01 and M02 record no change. Imported-revision configuration with only local harnesses validates. Fake readiness turns an entry `blocked` → `configs.draft.updated` with an issue, no substitution. `SetExecution` with trials 0, sampling interval 0.2 s or a negative tariff stores nothing and returns `runs.invalid_trials`, `telemetry.invalid_interval` and `measurements.invalid_accounting` from fake owners. A draft written by one `fs_drafts` store is returned with its edits by a fresh store over the same directory (engine restart); `configs.discard` removes the file. `PrepareLaunch` with a changed fact after review → `configs.review_stale`; with a fake M01 mismatch nothing is committed and `discard` removes staging; success writes configuration and weights as separate records with machine and catalog evidence, `prices.yaml` and `rates.yaml`; a fake M04 rate change after commit leaves `rates.yaml` unchanged; a resolved launch with a `trial_budget_warning` commits and records the warning. The rates fact source never calls a collecting method of the fake M04. A fake secret in the M03 credential source never appears in any record, DTO, error message or log line. **[R009, R019, R032, R066, R067, R136]** |
| API (`InProcessClient`, no interface) | Every `configs.*` method round-trips its DTOs; error codes, pass-through codes and `field` paths are stable; `SetupView.capabilities.can_review` is false exactly when `issues` is non-empty; subscribe to `configs.draft`, emit a fake `environment.report.updated`, receive `configs.draft.updated`, and replay it with `since_seq`; `configs.review` followed by `runs.launch` through a fake M11 freezes records that equal the preview, including rates; `trial_budget_warning` is present in `LaunchPreview` without changing `can_launch`; registry metadata gives `configs.delete_preset` the `destructive` class; JSON Schema export includes `configs.*`; `import-linter` contract for `engine.configs` layers. |
| Screens (fake client, `App.run_test(size=(120, 40))` and `(80, 24)`) | Setup renders a fake `SetupView` with five entries, two for one harness; a view with issues sets `.-invalid`, shows `#validation` lines with the fake's keys and disables `enter` through `check_action`; `del`, `ctrl+s`, preset and concurrency changes each issue exactly one call; `#entries-empty` and `#entries-error` (pin mismatch) render from fakes. `c` pushes CurrencyEnergyScreen and, on dismiss with a value, issues exactly one `configs.set_execution(accounting=…)`; submitting `#trials` issues one `configs.set_execution(trials=…)` and shows `runs.invalid_trials` verbatim. JudgeScreen shows fallback marks and the warning from `fallback: true` and issues one `configs.set_judge` on `ctrl+s`. ReviewLaunch renders the fake preview, including "declared by user" billing and rate lines as returned, and `ctrl+l` issues one `runs.launch` with the preview digest; `can_launch: false` disables it. With a `trial_budget_warning`, `ctrl+l` pushes `ConfirmScreen` showing the totals and issues `runs.launch` only on `True`; without one, no dialog appears. LaunchRecord shows the redacted YAML read-only. View-model builders are tested as pure functions without Textual. |
