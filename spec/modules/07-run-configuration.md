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

Execution settings include the number of trials per configuration (default 1; any positive whole number is accepted, with no upper limit, and anything else is rejected), the hardware sampling interval (0.5–10 s, default 1 s, validated by [M18](18-hardware-monitoring.md)), the display currency (default USD) and an optional electricity tariff per kWh with its currency (both validated by [M10](10-measurements-cost.md)). All of them are set in Setup or in the configuration YAML before launch and are frozen with the run; none of them is part of the template identity. Later analysis may choose alternative tariffs and weights; it cannot choose another display currency or refresh the run's rates. M10 uses each run's frozen rates and displays mixed-currency comparisons in USD with an explicit notice. **[R066, R081, R106, R114, R154; F07]**

The configuration holds no exchange rates. At launch, the catalog ([M04](04-model-catalog.md)) supplies stored rates for every competitor/judge price currency, display currency and tariff currency. Freeze them beside the prices, preserving source URL, source date, retrieval date, supplied/unknown state and labels. `per_usd` means currency units per 1 USD (COP `4000`), never its reciprocal. A missing rate remains missing and any conversion requiring it is unknown; no rate is guessed, and the historical README exchange rate is never used. Rates are never collected during review, launch or a run. **[R081, R156]**

Each selection's billing kind (`api`, `subscription`, `local`, `unknown`) is taken from M04 at launch with its source, observation origin/date, declaration flag and engine label. Preserve an explicit unknown declaration as well as a known declaration; both remain labelled "declared by user" wherever the launch shows a cost basis. Unknown billing is frozen as unknown and never supports a verified $0 ([M10](10-measurements-cost.md)); positive amounts retain the limitation. **[R080, R157]**

Setup and review always show configurations × trials × tasks task runs and the number of judge sessions ([M12](12-quality-judging.md)). When a launch requests more than 5 trials and at least one configuration is not on a local endpoint, launch validation returns a non-blocking trial budget warning with those totals. The launch review asks for confirmation in a dialog stating that the extra trials will consume budget and subscription usage. The warning is not raised when every configuration is on a local endpoint, regardless of the independent judge's endpoint. An unattended launch prints the warning and continues; it never prompts. **[R077, R158]**

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
- Launch with 6 trials and one cloud configuration: review shows the trial budget warning with task-run and judge-session totals and the TUI asks for confirmation before launching; `run --no-tui` prints the warning and continues. With 6 trials and only local-endpoint configurations, or with 5 trials, no warning is raised. **[R077, R158]**
- Launch with prices in USD and EUR and display currency COP: the frozen rate snapshot holds EUR and COP with source and date (USD needs none), and a user-supplied rate is labelled as such. Without a catalog rate for EUR, the snapshot records EUR as missing and the launch proceeds. Refreshing rates after launch leaves the frozen snapshot unchanged. **[R081, R156]**
- Declare an account's billing kind in the catalog: review shows it labelled "declared by user" and the frozen record keeps the declared kind and its source; an account with no reading and no declaration is frozen as `unknown`. **[R080, R157]**
- Edit a setup, close the interface and restart the engine: the draft reopens with its unsaved edits until it is saved or discarded. **[R019]**
- Exercise each judge-preselection branch, independent judge editing, common suite/profile, and completed weight selection; defaults make no quality claim. **[R033, R037]**
- Verify launch records preserve machine/catalog metadata, the price snapshot with source and date, billing kinds with their source and the rate snapshot, exclude credentials from exports/logs/reports, and freeze configuration and original weights before execution. A mismatched or mutated template cannot retain a verified matching claim. **[R066, R067, R080]**
- Save, reload, validate, reset, and export both weight sets; alternative calculations preserve raw grades and original results and require no judge calls. **[R096, R145]**

## Implementation

This section applies [the architecture decision](ARCHITECTURE.md) to run configuration. Everything below is an implementation decision; the product behavior above stays authoritative. All validation, judge preselection, preset resolution and freezing run in the engine; Setup, review and the CLI only present what the `configs.*` methods return.

Delivery is split into [M07.1 configuration-drafts](implementation/M07/01-configuration-drafts.md), [M07.2 launch-preparation](implementation/M07/02-launch-preparation.md) and [M07.3 setup-review-screens](implementation/M07/03-setup-review-screens.md). Their foundation gates separate completed implementation prerequisites from published contracts used as fakes; parent completion also requires the real integration gates. **F15**

### 1. Engine component

Package `axbenchmark.engine.configs`, API namespace `configs.*`. The module owns saved configurations, scoring presets, persisted setup drafts and the frozen launch records. It starts no processes; the launch itself is M11's `runs.launch` job, which calls this module's `LaunchPreparation` Protocol for resolution and the two freeze steps.

Three record kinds stay separate types, files and digests, as required above: the reusable `RunConfiguration`, the reusable `ScoringPreset`, and the `FrozenLaunch`. A fourth, the `Draft`, is the engine-held working copy that Setup edits; it is never a launch input until resolved. **[R017, R066]**

**Domain** (`engine/configs/domain/`, frozen dataclasses, no I/O):

| Type or rule | Shape and behavior |
|---|---|
| `RevisionRef` | `template_sha256` (M01's revision key) plus display `label` (`r1`). The only link from a configuration to a template; there is no global selection. **[R019]** |
| `ConfigEntry` | `entry_id: ConfigurationId`, `harness: HarnessId`, `target: ProviderRef \| EndpointRef`, `account: AccountRef` (non-secret, from M04/M03), `model_id: str`, `effort: EffortRequest` (M04 vocabulary: `Explicit(value)` or `HarnessDefault`), `policy: EnvPolicy` (`CLEAN` default, `CURRENT`). Two entries may share every field except `entry_id`; they are distinct competitors. Freeze `entry_id` as the shared `configuration_id` in each `TrialRef`; the enclosing saved `config_id` identifies the reusable setup, never a trial subject. **[R017, R032, R154]** |
| `JudgeSelection` | `harness`, `target`, `account`, `model_id`, `effort`, `origin: SAVED \| PLANNER \| FIRST_USABLE \| USER`. Stored apart from `entries`; editing one never edits the other. **[R033]** |
| `WeightChoice` | Per set: `PresetRef(preset_id)` or `ExplicitWeights(mapping)`. `WeightChoices(quality, ranking)`. |
| `ExecutionSettings` | `concurrency: ConcurrencyChoice` (M11 vocabulary, default from M11), `trials: int` (M11 vocabulary, default 1 from M11's `ExecutionDefaults`, validated by `SchedulingVocabulary.validate_trials`), `monitoring: MonitoringChoice` (M18 vocabulary: `mode`, default automatic, and `sampling_interval_s`, default 1, validated by `MonitoringOptions.validate`), `accounting: Accounting` (M10 vocabulary: `display_currency`, an ISO 4217 code, default `USD`, and an optional electricity tariff per kWh with currency, validated through M10's `AccountingValidation`; it holds no exchange rate), `task_timeout` (M11's `ExecutionDefaults`: 3 h, as SPEC fixes it). All are frozen with the launch and none enters the template identity. Values are opaque here and validated by their owners; `trials` has no upper limit. **[R066, R077, R081, R106, R114]** |
| `RunConfiguration` | `config_id`, `name`, `revision: RevisionRef` (the pin), `entries: tuple[ConfigEntry, ...]`, `judge: JudgeSelection \| None`, `weights: WeightChoices`, `execution: ExecutionSettings`, `schema: int`. Contains no credential field. **[R019, R066]** |
| `ScoringPreset` | `preset_id`, `kind: QUALITY \| RANKING`, `name`, `weights: mapping`, `profile_id` (quality presets only, so categories match a grading profile), `builtin: bool`. Built-ins are the profile defaults (M12) and equal ranking weights (M06); they cannot be edited or deleted. **[R145]** |
| `Draft` | `draft_id`, `base: StoredConfigRef \| None` (config id + file digest), `current: RunConfiguration`, `dirty: bool` (structural comparison with the base), `updated_at`. Persisted after every successful draft command, so it survives client disconnects and engine exits. |
| `SetupFacts` | Everything gathered from other modules for one draft: template revision facts, readiness assessment per entry and judge (M03), `SelectionEvidence` or catalog problem per entry and judge (M04, with billing kind and its source), the catalog's exchange rates for the currencies the setup needs (M04 `RateSet` from `ExchangeRates.snapshot`, preserving known/unknown provenance), clean-policy assessment per entry (M05), weight validation per set (M06), M12 `JudgeCheck` per candidate (`usable`, `profile_id`, ordered default quality weights, `requirement`, capability state/source, readiness and reasons) plus `JudgeRequirements.session_count(configurations, trials)`, task count of the revision (M01), planner selection if planning was used (M16), scheduling notes (M11), monitoring limitations (M18), machine record (M03). Use cases build it; domain rules only read it. |
| `Issue` | `code` (the owning module's error code, e.g. `catalog.effort_unsupported`, `environment.auth_rejected`, `scoring.invalid_weights`, `configs.judge_unresolved`), `source` (`M01`…`M18`), `field?`, `subject` (`entry` + `entry_id` \| `judge` \| `quality_weights` \| `ranking_weights` \| `execution` \| `template`), `message`, `remedy`, `fix: EDIT_ENTRY \| ENVIRONMENT \| JUDGE \| WEIGHTS \| REMOVE_ENTRY \| None`. Blocking. |
| `Limitation` | Same shape, non-blocking (missing optional power metrics, isolation limitations reported by M05, `configs.rate_missing` for a needed currency the catalog has no rate for, naming the currency and that converted values will be unknown). |
| `validate_setup(config, facts) -> SetupValidation` | Pure. Issues: pin differs from the opened revision (`configs.pin_mismatch`); no entries (`configs.no_entries`); any entry not ready, not resolvable in the catalog or with an unsupported or unknown-but-explicit effort; judge unresolved or lacking a required capability; either weight set unresolved (missing preset, invalid values); execution values rejected by their owner. Nothing is replaced: an issue names the input and its source and the value stays as entered. **[R032, R033, R066]** |
| `preselect_judge(saved, planner, entries, facts) -> JudgePreselection` | Pure. Candidates in order: valid saved judge, then the planner selection when planning was used for this revision, then the first entry (in entry order) that is usable as a judge. Each candidate is checked against `facts` (readiness, catalog, judge requirements); a failed candidate is recorded with its reason and skipped. No usable candidate → `None` and `configs.judge_unresolved`. Applied while `judge.origin != USER`; a user choice is never replaced by preselection. **[R033, R037]** |
| `resolve_launch(config, facts, presets, adjustments) -> ResolvedLaunch` | Pure. Requires an empty issue list. Copies each preset's values into actual weights (`OriginalWeights`), attaches `SelectionEvidence` per entry and judge (including M04's `Pricing` with source URL, layer and retrieval date, or its unknown state, and the billing kind with its source), the `RateSnapshot` built by `rate_snapshot`, the `trial_budget_warning` from `trial_budget`, the template's rubric and single grading profile, execution settings (trials, sampling interval, accounting with display currency and tariff), scheduling notes, machine record and `CredentialPresence(name, is_set)` per entry. `adjustments` (`exclude_entries`, `policy_overrides` from the clean-mode dialog) are applied and recorded as such. **[R033, R037, R066, R080]** |
| `digest(resolved) -> PreviewDigest`, `configuration_digest`, `weights_digest` | SHA-256 over canonical sorted-key documents with exact decimal text. The preview covers the effective entries/adjustments, source-file or draft content, identity, preset values, readiness/capability outcomes and all price/rate/billing provenance; exclude transient gather times, not source/retrieval dates. Configuration and weights have separate digests; a final complete launch digest binds both and all frozen evidence. |
| `PriceSnapshot` | One row per entry and judge, copied from M04 `SelectionEvidence.pricing`: all `Pricing` fields (including cached-input/reasoning rates when present), currency, known/unknown state, resolving layer, source URL and retrieval date. Retain `billing: ResolvedBilling` intact: kind, optional source `override` or `discovered`, `declared_by_user`, `observed_from` (`endpoint` or `status_output`), `observed_at` and `label`. An unknown declaration keeps its override source; endpoint is an observation origin, not a new source layer. Use the returned label verbatim. No refresh, cost calculation or verified-zero claim occurs here. **[R080, R157]** |
| `RateSnapshot` | `display_currency`, one `RateRow` per needed non-USD currency, plus the `RateSet.refresh` and `resolved_at` evidence. Copy M04 `ResolvedRate` fields: `currency`, `per_usd` (currency units per 1 USD, COP `4000`), `source`, `as_of`, `retrieved_at`, `source_url`, `label`; a `MissingRate` preserves those provenance fields with no numeric value, including an explicit unknown override. `supplied_by_user` follows `source=override`. Needed currencies are every known competitor/judge price currency, display currency and tariff currency. USD uses identity and needs no stored row. Freeze once; no rate constant or later collection. **[R081, R156]** |
| `rate_snapshot(prices, accounting, rates) -> RateSnapshot` | Pure. Collects the needed currencies, copies each rate M04 returned and records each absent one as `MissingRate`; a missing rate is a `configs.rate_missing` limitation, never an issue. **[R081, R156]** |
| `TrialBudgetWarning` | `code = "configs.trial_budget_warning"`, `trials`, `threshold` (5), `configurations` (entry count), `tasks` (revision task count), `task_runs` (`configurations × trials × tasks`), `judge_sessions` (M12's count), `affected: tuple[entry_id, ...]` (entries not on a local endpoint), `message` (the engine's text: the extra trials will consume budget and subscription usage, with the totals). Non-blocking; not an `Issue` or a `Limitation`. **[R077, R158]** |
| `trial_budget(config, facts) -> TrialBudgetWarning \| None` | Pure. A warning when `execution.trials > TRIAL_BUDGET_THRESHOLD` (5) and at least one entry's target is not an `EndpointRef` (local endpoint); `None` otherwise, including when every entry is on a local endpoint. There is no upper limit on trials. **[R077, R158]** |
| `FrozenLaunch` | `run_uid: RunUid`, `run_label: RunLabel`, `launched_at`, `template: VerifiedIdentity`, `configuration: ResolvedConfiguration` + digest, `weights: OriginalWeights` + digest, machine/catalog/prices/rates and warning evidence, `frozen_at`, complete `RunBinding` (M02), and the full `trial_refs: tuple[TrialRef, ...]` roster. Bind every frozen entry and each 1-based trial index to this UID; the label is display-only. The binding includes origin, launch time, template/baseline and a digest of the complete credential-free launch, excluding local paths/import state/later outcomes. Immutable once committed. **[R067, R077, R080, R081, R154, R158]** |
| `redact(value)` | Credentials never enter the domain: accounts are labels and fingerprints, credentials are `CredentialPresence`. `redact` additionally applies the `SecretScrubber` result to any diagnostic text derived from configuration before it is persisted or returned. **[R066]** |

**Ports** (`engine/configs/ports.py`):

```python
class ConfigRepository(Protocol):
    async def list(self, sha: Sha256, view: PublicationView) -> Sequence[StoredConfig]: ...
    async def load(self, config_id: ConfigId, view: PublicationView) -> StoredConfig: ...  # raises ConfigFileInvalid
    async def load_path(self, path: Path) -> RunConfiguration: ...          # unattended --config FILE
    async def save(self, cfg: RunConfiguration, expected: FileDigest | None) -> StoredConfig: ...  # atomic; FileChanged, NameTaken
    async def prepare_copy(self, tx: TransactionId, from_sha: Sha256, to_sha: Sha256) -> PreparedConfigs: ...
    async def prepare_remove(self, tx: TransactionId, sha: Sha256) -> PreparedConfigs: ...
    async def commit_view(self, tx: TransactionId) -> None: ...             # durable readiness, never publication
    async def rollback(self, tx: TransactionId, token: RegistrationToken) -> None: ...

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
    async def stage(self, run_uid: RunUid, part: FrozenPart) -> None: ...     # configuration, weights, template binding, machine/catalog
    async def commit(self, run_uid: RunUid) -> LaunchLocation: ...            # validates all parts + binding; durable atomic rename
    async def discard(self, run_uid: RunUid) -> None: ...                    # unpublished staging only
    async def load(self, run_uid: RunUid) -> FrozenLaunch: ...

class SetupFactsSource(Protocol):           # one adapter per owner module, combined by GatherSetupFacts
    async def gather(self, cfg: RunConfiguration) -> SetupFacts: ...

class SecretScrubber(Protocol):
    def scrub(self, text: str) -> str: ...
```

Plus shared `PublicationTransactions`, `PublicationView`, `Clock`, `IdGenerator` and `EventPublisher`. `PreparedConfigs {transaction_id, token, count, config_ids}` identifies the exact prepared overlay; retries under the same transaction return it unchanged. Reads spanning revision/configuration state capture one publication view. Save/duplicate/edit and transaction preparation share the mutation boundary; a pending reservation cannot be bypassed by a direct YAML write.

**Application** (`engine/configs/application/`, one class each, ports injected in `__init__`):

| Use case | Method | Does |
|---|---|---|
| `ListConfigurations` | `configs.list` | Saved configurations of one revision with pin status and summaries, plus the revision's drafts (unsaved edits of a saved configuration, and never-saved drafts). |
| `GetConfiguration` | `configs.get` | One saved configuration, read-only. |
| `OpenDraft` | `configs.open` | Loads a persisted draft by `draft_id`, or a saved configuration (or the revision's most recently saved one, or a new empty configuration) into a draft, gathers facts, applies `preselect_judge`, persists the draft, returns the `SetupView`. Reopening a configuration that already has a draft returns that draft, also after an engine restart. |
| `GetSetupView` | `configs.setup` | Re-gathers facts and returns the current `SetupView` of a draft. |
| `AddEntry`, `UpdateEntry`, `RemoveEntry` | `configs.add_entry`, `configs.update_entry`, `configs.remove_entry` | Edit draft entries. `AddEntry`/`UpdateEntry` reject a selection M04 rejects (`catalog.*` codes verbatim); readiness problems do not reject the edit, they become issues. |
| `GetJudgeCandidates` | `configs.judge_candidates` | The preselection branches with their outcomes and the judge requirements. |
| `SetJudge` | `configs.set_judge` | Checks selection/effort with M04 and calls M12 `JudgeRequirements.check(template_sha256, judge)` for the combined requirement/capability/readiness verdict. Rejects an unusable choice with the returned reason code and `JudgeCheckDTO`; stores a usable choice with `origin = USER`. |
| `SetWeights` | `configs.set_weights` | Stores a preset reference or explicit values per set after M06 validation. |
| `SetExecution` | `configs.set_execution` | Stores concurrency and trials (no upper limit), monitoring (mode and sampling interval) and accounting (display currency, tariff) after M11 / M18 / M10 accept the values. Rejected values are not stored and the owner's code is returned. |
| `SaveConfiguration` | `configs.save` | Validates structure (not readiness), writes YAML; `as_name` creates a new file ("Save as…"). Never touches the template or results. **[R019]** |
| `DuplicateConfiguration` | `configs.duplicate` | Copies a saved configuration within its revision under a new name. |
| `DiscardDraft` | `configs.discard` | Deletes a draft and its file. |
| `ListPresets`, `SavePreset`, `DeletePreset` | `configs.list_presets`, `configs.save_preset`, `configs.delete_preset` | Preset YAML; values validated by M06 before writing. **[R145]** |
| `ReviewLaunch` | `configs.review` | Gathers facts, runs `validate_setup`, then `resolve_launch`; returns the `LaunchPreview` and its digest (including the rate snapshot and any `trial_budget_warning`), or `configs.incomplete` with every issue. The warning never blocks and never makes the setup incomplete. |
| `GetLaunchRecord` | `configs.launch_record` | The frozen records of a run (template, configuration, weights, machine, prices, rates) and the redacted resolved YAML. |
| `RevalidateDrafts` | internal | On readiness, catalog (including price, exchange-rate and billing-declaration overrides), preset or template events: re-gather facts for drafts with a subscriber, re-apply preselection where allowed, publish `configs.draft.updated`. Other drafts are revalidated when they are next opened. |
| `PrepareLaunch` | internal, `LaunchPreparation` | M11 calls `resolve` as review, then compares the effective source/adjustments and gathered facts against the supplied digest (`configs.review_stale` before staging on mismatch). `freeze_configuration` stages identity, roster and price/rate/billing evidence; `freeze_weights` stages separately from the same resolved value; `commit` validates completeness and makes one immutable launch; `discard` removes unpublished staging only. The non-blocking warning is retained. **[R067, R077, R080, R081, R156–R158]** |

Application Protocols this module offers to others:

```python
class LaunchPreparation(Protocol):          # M11 runs.launch
    async def resolve(self, source: LaunchSource, adjustments: LaunchAdjustments,
                      preview_digest: PreviewDigest | None) -> ResolvedLaunch: ...   # SetupIncomplete, ReviewStale
    async def freeze_configuration(self, run_uid: RunUid, resolved: ResolvedLaunch,
                                   identity: VerifiedIdentity, run_label: RunLabel,
                                   launched_at: datetime) -> FrozenRef: ...
    async def freeze_weights(self, run_uid: RunUid, resolved: ResolvedLaunch) -> FrozenRef: ...
    async def commit(self, run_uid: RunUid) -> FrozenLaunch: ...
    async def discard(self, run_uid: RunUid) -> None: ...

class LaunchRecords(Protocol):              # M02, M05, M10, M11, M12, M17
    async def get(self, run_uid: RunUid) -> FrozenLaunch: ...

class RevisionConfigs(Protocol):            # M01
    async def summaries(self, sha: Sha256, view: PublicationView) -> Sequence[ConfigSummary]: ...
    async def prepare_copy(self, tx: TransactionId, from_sha: Sha256, to_sha: Sha256) -> PreparedConfigs: ...
    async def prepare_remove(self, tx: TransactionId, sha: Sha256) -> PreparedConfigs: ...
    async def commit_view(self, tx: TransactionId) -> None: ...              # acknowledges durable overlay only
    async def rollback(self, tx: TransactionId, token: RegistrationToken) -> None: ...

class WeightPresets(Protocol):              # M06
    async def list(self, profile_id: str | None) -> Sequence[ScoringPreset]: ...

class SavedJudges(Protocol):                # M12 judging.rejudge_options
    async def for_template(self, sha: Sha256) -> Sequence[JudgeSelection]: ...   # judge selections of the revision's saved configurations
```

`LaunchSource` is exactly one of `draft_id`, `config_id` or `config_path`, with the optional execution override included before resolution. A draft launch requires its reviewed digest; unattended sources may omit it. Source edits, owner facts and adjustments must match that digest. If a clean-mode decision changes entries/policies, request a new review with those adjustments and confirm its new totals before retrying; a confirmation cannot carry to a different digest. Unattended M11 prints any warning from its final resolved launch once and continues without prompting. **[R033, R066, R158]**

`RevisionConfigs` participates in M01's approval/deletion transaction. Copies get fresh saved configuration IDs and pin `to_sha`; sources remain intact. Prepared copies/removals are invisible until M01 publishes the shared marker with the revision/draft changes. `commit_view` never exposes them. Rollback removes only token-owned unpublished changes; published work rolls forward cleanup/events, preserving pre-existing records and earlier pinned views. Deleted-revision drafts cannot launch or save against a missing revision, but remain explicitly discardable. **F14**

Both freeze steps use one resolved value, checked template/baseline and UID reservation. `commit` rejects missing/mismatched parts (`configs.freeze_incomplete`) and conflicting reuse of a UID (`configs.launch_conflict`); an identical retry returns the same launch. After commit, `discard` cannot delete evidence (`configs.launch_committed`). M11 binds every `TrialRef` through M02 `ResultRecorder.open_result(trial)` and records its run state before advertising launch success or starting execution. It journals this bind: a pre-commit failure discards staging; a post-commit crash/failure resumes the same binding, never manufactures a new UID or removes committed evidence. This changes M11's former unconditional discard-after-bind-error behavior; scheduler integration is a required later gate. **F02, F06**

**Adapters** (`engine/configs/adapters/`):

| Adapter | Implements |
|---|---|
| `config_yaml.py` | `ConfigRepository` under `~/.axbenchmark/configs/<template_sha256>/<slug>.yaml`; temp-file-and-rename single-store writes plus durable `.transactions/<tx>/` copy/removal overlays. Reads resolve the captured shared publication view; overlay compaction retains data needed by older views. A malformed or foreign file is reported (`configs.file_invalid`, `configs.pin_mismatch`) and never rewritten. `load_path` reads user YAML and validates its revision against the same captured view. |
| `preset_yaml.py` | `PresetRepository` under `~/.axbenchmark/presets/{quality,ranking}/<slug>.yaml`; built-ins come from M12 profile defaults and M06 defaults and are not files. |
| `fs_drafts.py` | `DraftStore` under `~/.axbenchmark/drafts/setup/<draft_id>.yaml` (directory 0700), temp-file-and-rename writes. A draft file that cannot be parsed is reported as `configs.draft_invalid` and left in place; it is never rewritten silently. Planning drafts of M16 live beside it under `drafts/planning/` and are not read by this module. |
| `launch_store.py` | `LaunchRecordStore` under `~/.axbenchmark/launches/<run_uid>/`, staged in `.staging-<run_uid>/` and renamed on commit; files are written once with mode 0444. |
| `facts/readiness.py`, `catalog.py`, `rates.py`, `policy.py`, `weights.py`, `judging.py`, `planning.py`, `scheduling.py`, `monitoring.py`, `template.py` | `SetupFactsSource` parts over the owner modules' application Protocols listed in part 3. Each converts the owner's result into `SetupFacts` without reinterpreting its codes. `rates.py` reads M04's cached rates only (`ExchangeRates.snapshot`); it never triggers a rate collection. |
| `scrubber.py` | `SecretScrubber` uses the shared diagnostic sanitizer supplied at composition. M03 supplies credential names/presence only; M07 never requests or reconstructs credential values. Opaque account labels and sanitized diagnostics are checked again before persistence/API/logging. |
| `rpc.py` | Registers `configs.*`, maps DTOs to use-case inputs and domain errors to the codes below. |

**Persisted state** (the engine is the only reader and writer):

| File | Content | Written by |
|---|---|---|
| `~/.axbenchmark/configs/<template_sha256>/<slug>.yaml` | `schema: 1`, `name`, `template: {sha256, label}`, `entries: [{id, harness, provider \| endpoint, account, model, effort: <value> \| harness_default, policy: clean \| current}]`, `judge: {…} \| null`, `weights: {quality: {preset: id} \| {values: {…}}, ranking: …}`, `execution: {concurrency, trials, monitoring: {mode, sampling_interval_s}, accounting: {display_currency, tariff: {per_kwh, currency} \| null}}` (`display_currency` defaults to `USD` when absent; no exchange rate is stored in a configuration). No credentials. **[R019, R066, R081]** | `configs.save`, `configs.duplicate`, `RevisionConfigs.prepare_copy` |
| `~/.axbenchmark/configs/.transactions/<tx>/` | Durable copy/removal overlays, exact tokens/counts and old/new config references; one shared marker determines visibility. | `RevisionConfigs.prepare_copy`, `prepare_remove`, `commit_view`, rollback/cleanup coordinated by M01 |
| `~/.axbenchmark/drafts/setup/<draft_id>.yaml` | `schema: 1`, `draft_id`, `base: {config_id, file_digest} \| null`, `updated_at`, `configuration` (same schema as above). No credentials. | every draft command; removed by `configs.discard` and by a save that leaves the draft clean |
| `~/.axbenchmark/presets/quality/<slug>.yaml`, `presets/ranking/<slug>.yaml` | `schema: 1`, `name`, `profile_id` (quality), `weights`. | `configs.save_preset`, `configs.delete_preset` |
| `~/.axbenchmark/launches/<run_uid>/template-binding.yaml` | Approved and recomputed SHA-256 (equal), revision label, checked time. | `LaunchPreparation.freeze_configuration` |
| `…/run-binding.yaml` | UID, display label, launch timestamp, originating machine, template/baseline, complete launch digest and full `TrialRef` roster with frozen trial counts. No local paths in the binding digest. | `LaunchPreparation.commit`, after both staged freeze parts agree |
| `…/configuration.resolved.yaml` | Resolved entries, judge, rubric and grading profile, policies and adjustments, execution settings (including display currency), the `trial_budget_warning` if one was raised, `CredentialPresence` per entry; its digest. | `freeze_configuration` |
| `…/weights.original.yaml` | Resolved quality and ranking weights with the preset names they came from; its digest. | `freeze_weights` |
| `…/machine.yaml` | Machine identity and details, `SelectionEvidence` per entry and judge (catalog version, sources, billing kind and its source). | `freeze_configuration` |
| `…/prices.yaml` | `PriceSnapshot`: per entry and judge, prices and their currency, source layer, source URL, retrieval date and complete resolved billing provenance/label. Read by M10 for every estimate of the run. | `freeze_configuration` |
| `…/rates.yaml` | `RateSnapshot`: display currency; per needed currency `per_usd`, source, source date, retrieval date, source URL and label, or `MissingRate` with the same available provenance; catalog refresh evidence. Read by M10 for every conversion of the run; carried in result ZIPs by M17. **[R081, R156]** | `freeze_configuration` |

Drafts survive client disconnects and engine exits; the engine's idle exit does not wait for them. Setup still shows the unsaved state against the saved file. Later edits to configurations or presets never touch `launches/`. **[R067]**

**Owned processes**: none.

### 2. API surface

DTOs live in `axbenchmark.api.configs`. Every capability uses shared `ActionState {enabled: bool, reason: str | None}` from `api.common`. An `IssueDTO` is `{code, source, subject: {kind, entry_id?, label}, field?, message, remedy?, fix?}`; a `LimitationDTO` has the same fields without `fix`. Codes from other namespaces are passed through unchanged. Application errors use JSON-RPC integer `-32000` with namespaced `error.data.code`, optional field/remedy/data, decoded as shared `EngineError`; malformed protocol requests retain protocol codes. Domain-invalid raw trials/weight text crosses a decodable draft input type and returns the owner's typed error; clients do not invent a fallback value. **F18**

`LaunchTotalsDTO {configurations, trials, tasks, task_runs, judge_sessions, label}` is returned in both setup and review even when no warning applies. Totals use the effective configuration after adjustments. An adjusted review offers Copy CLI only when the generated command reproduces all adjustments. **[R158]**

`SetupView` (returned by `configs.open`, `configs.setup` and every draft command):

| Field | Content |
|---|---|
| `draft_id`, `config_id?`, `config_name`, `dirty`, `dirty_summary` | `dirty_summary` is the engine's text, e.g. "5 entries, saved file has 4". |
| `configurations` | `[{config_id, name, draft_id?}]` of this revision plus `[{draft_id, name, updated_at}]` for never-saved drafts, for `#configuration`. |
| `identity` | `{template_name, revision_label, sha256, builtin, planner_note}` (e.g. "approved tasks reused, no planner call"). |
| `entries` | `[EntryRowDTO {entry_id, ordinal, harness_label, provider_label, model_id, effort_label, policy, readiness: {state: ready \| blocked \| unknown, text}, schedule_note?, issue_codes}]` |
| `judge` | `{selection?, label, chosen_by: saved \| planner \| first_usable \| user \| unresolved, readiness_text, rubric_label, profile_label}` |
| `weights` | `{quality: WeightPaneDTO, ranking: WeightPaneDTO, preset_options: {quality: [...], ranking: [...]}}`; `WeightPaneDTO {choice: {preset_id} \| "explicit", label, summary, state: resolved \| missing \| invalid}` |
| `execution` | `{totals: {configurations, trials, tasks, task_runs, judge_sessions, label}, concurrency, concurrency_options: [{value, label}], trials, monitoring: {mode, sampling_interval_s, label}, accounting: AccountingDTO, accounting_label, notes: [[label, text]]}`; `accounting_label` is the engine's text, e.g. "display COP · 1 USD = 4,050 COP (catalog, 2026-09-30) · tariff 0.18 USD/kWh" or "display EUR · no rate, converted values unknown". |
| `issues`, `limitations` | `[IssueDTO]`, `[LimitationDTO]` |
| `capabilities` | `can_save`, `can_save_as`, `can_review` (`enabled=false` with `configs.incomplete` while issues exist), `can_add_entry`, per-entry `can_edit` / `can_remove`, `can_edit_judge`, `can_edit_weights`, `can_edit_execution` |

**Queries** (safety `read`):

| Method | Request | Response | Errors | Capability flags |
|---|---|---|---|---|
| `configs.list` | `template_sha256` | `ConfigList {revision, configs: [ConfigSummaryDTO {config_id, name, entry_count, entries: [EntryRowDTO], judge_label, pin_matches, updated_at, draft_id?}], drafts: [{draft_id, name, updated_at}]}` (`drafts`: never-saved drafts) | `templates.not_found` (pass-through), `configs.file_invalid` (per row, not raised) | `can_create`, per row `can_edit`, `can_duplicate` |
| `configs.get` | `config_id` | `ConfigDetail {summary, yaml_text}` | `configs.unknown_config`, `configs.file_invalid` | — |
| `configs.setup` | `draft_id` | `SetupView` | `configs.unknown_draft` | in `SetupView` |
| `configs.judge_candidates` | `draft_id` | `JudgeCandidates {branches: [{rank, kind: saved \| planner \| first_usable, selection?, outcome: chosen \| skipped \| not_used \| not_reached, reason?, check?: JudgeCheckDTO}], current?, check?: JudgeCheckDTO, fallback: bool, required_capabilities, rubric_label, harness_options: [{harness, target, account_id, label, readiness_text}]}` | `configs.unknown_draft` | `can_set_judge` |
| `configs.list_presets` | `kind?`, `profile_id?` | `PresetList {presets: [{preset_id, kind, name, weights, builtin, profile_id?}]}` | — | per preset `can_delete` |
| `configs.review` | `draft_id \| config_id \| config_path`, `execution?` (CLI `--jobs`), `exclude_entries?`, `policy_overrides?` | `LaunchPreview {preview_digest, totals: LaunchTotalsDTO, template, entries: [ReviewEntryDTO {ordinal, harness, provider, model_id, effort_requested, policy, note}], judging: {judge_label, chosen_by, readiness, rubric, profile, quality: {preset, weights, percentages}, ranking: {…}}, execution: [[label, text]] (concurrency, trials, totals "4 configurations × 6 trials × 7 tasks = 168 task runs, 24 judge sessions", task timeout, monitoring with sampling interval, display currency and tariff), trial_budget_warning: TrialBudgetWarningDTO {code, trials, threshold, configurations, tasks, task_runs, judge_sessions, affected: [entry_id], message} \| null, limitations, recorded: {machine, catalog, prices: [[selection, text]] (price, source and date, or unknown; billing kind with "declared by user" when its source is `override`), rates: [[currency, text]] ("1 USD = 4,050 COP · catalog, 2026-09-30", "supplied by user" for an override, or "no rate: converted values unknown"), credentials_note}, cli_command?}` | `configs.incomplete {issues, checks: [{area, ok, text, source?}]}` (every check in order, passing ones included, for the CLI), `configs.unknown_draft`, `configs.unknown_config`, `configs.file_invalid`, `configs.pin_mismatch`, `environment.no_harness` | `can_launch` (not affected by `trial_budget_warning`), `can_copy_cli` (`enabled=false` with `configs.unsaved_changes` when the draft differs from its file, since the command names the file) |
| `configs.launch_record` | `run_uid` | `LaunchRecordDTO {run_uid, run_label, binding_digest, trial_refs, frozen_at, records: [{kind: template \| configuration \| weights \| machine \| prices \| rates, digest?, summary}], resolved_yaml: str (redacted), path}` | `configs.launch_not_found` | — |

**Commands**:

| Method | Request | Response | Errors | Safety |
|---|---|---|---|---|
| `configs.open` | `template_sha256`, `config_id? \| draft_id?`, `replace_draft_id?`, `discard_changes: bool = false` | `SetupView` | `configs.unknown_config`, `configs.unknown_draft`, `configs.file_invalid`, `configs.draft_invalid`, `configs.pin_mismatch {pinned_sha256, pinned_label?}`, `configs.unsaved_changes` (replacing a dirty draft without `discard_changes`) | write (draft files only) |
| `configs.add_entry` | `draft_id`, `harness`, `target`, `account_id`, `model_id`, `effort: {explicit: str} \| "harness_default"`, `policy?` | `EntryResult {entry: EntryRowDTO, setup: SetupView}` | `configs.unknown_draft`, `catalog.*` from `catalog.check_selection` (with `field`, `remedy`) | write |
| `configs.update_entry` | `draft_id`, `entry_id`, any of the `add_entry` fields, `policy?: "clean" \| "current"` | `EntryResult` | as `add_entry`, `configs.unknown_entry` | write |
| `configs.remove_entry` | `draft_id`, `entry_id` | `SetupView` | `configs.unknown_draft`, `configs.unknown_entry` | write |
| `configs.set_judge` | `draft_id`, `harness`, `target`, `account_id`, `model_id`, `effort` | `SetupView` | `catalog.effort_unsupported`, `catalog.capability_unsupported`, `catalog.capability_unknown`, `judging.screenshot_inspection_unsupported`, `judging.screenshot_inspection_unknown` (with `JudgeCheckDTO`), `judging.rubric_invalid`, `environment.*` readiness codes, `configs.unknown_draft` | write |
| `configs.set_weights` | `draft_id`, `quality?: {preset_id} \| {values}`, `ranking?: …` | `SetupView` | `scoring.invalid_weights` (field paths), `configs.unknown_preset` | write |
| `configs.set_execution` | `draft_id`, `concurrency?`, `trials?: RawTrialCount` (JSON scalar, no coercion; owner rejects invalid values), `monitoring?: {mode, sampling_interval_s}`, `accounting?: AccountingDTO` (`display_currency`, `tariff \| null`) | `SetupView` | `runs.invalid_jobs`, `runs.invalid_trials` (only for a value that is not a whole number ≥ 1; there is no upper limit), `telemetry.invalid_mode`, `telemetry.invalid_interval`, `measurements.invalid_accounting` (owners' codes, with `field`) | write |
| `configs.save` | `draft_id`, `as_name?` | `SetupView` (clean, with `config_id`) | `configs.file_changed` (file changed on disk since the draft opened), `configs.name_taken`, `configs.invalid_name` | write |
| `configs.duplicate` | `config_id`, `name?` | `ConfigSummaryDTO` | `configs.unknown_config`, `configs.name_taken` | write |
| `configs.discard` | `draft_id` | `{}` | `configs.unknown_draft` | destructive (deletes the draft file) |
| `configs.save_preset` | `kind`, `name`, `weights`, `profile_id?`, `overwrite: bool = false` | `PresetDTO` | `scoring.invalid_weights`, `configs.name_taken`, `configs.preset_builtin` | write |
| `configs.delete_preset` | `preset_id` | `{}` | `configs.unknown_preset`, `configs.preset_builtin` | destructive |

`configs.save` does not require a launchable setup: incomplete configurations can be saved and reopened. Readiness, catalog and weight problems are reported as issues, never as save failures. **[R019, R032]**

**Jobs**: none. Launching is `runs.launch` (M11); this module contributes the `config` and `weights` steps through `LaunchPreparation`.

M11's launch progress additionally carries `totals: LaunchTotalsDTO` and `trial_budget_warning: TrialBudgetWarningDTO | None` on its initial `LaunchStep`, retained in job status for snapshot/reconnect. These values come from the final M07 resolution; M14 deduplicates warning output by job ID and does not compute totals. This producer/consumer extension is part of the M11/M14 integration gate. **[R158]**

**Events**:

| Event | Payload | Emitted when |
|---|---|---|
| `configs.draft.updated` | `draft_id`, `reason: edited \| revalidated \| saved \| discarded`, `dirty` | A draft command succeeds or `RevalidateDrafts` changes its facts |
| `configs.configuration.saved` | `template_sha256`, `config_id`, `name` | `configs.save`, `configs.duplicate`, a published `RevisionConfigs.prepare_copy` transaction (never prepare/commit_view itself) |
| `configs.configuration.removed` | `template_sha256`, `config_id` | Published revision-removal transaction; revisioned tombstone and count update |
| `configs.preset.saved` | `preset_id`, `kind` | `configs.save_preset` |
| `configs.preset.deleted` | `preset_id`, `kind` | `configs.delete_preset` |
| `configs.launch.frozen` | `run_uid`, `run_label`, `template_sha256`, `binding_digest`, `configuration_digest`, `weights_digest` | `LaunchPreparation.commit`, after complete durable freeze; not evidence that M11 bind/execution has succeeded |

Register bare topics `configs.draft` (snapshot map of draft IDs to `SetupView`) and `configs` (revision configuration counts plus preset/launch event notifications). Each snapshot object/event has the shared stable key and monotonic revision; discard/removal emits tombstones. State and revisioned events enter M11's publication boundary together, after durable writes or the cross-store marker. Clients select their draft key, keep `EventCursor {epoch, seq}`, replace projections on resync and reject older revisions/obsolete subscription generations. Published transaction event outboxes replay idempotently after restart. **F04, F05**

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `TemplateIdentity.check(sha)`, `RevisionReader` (revision facts: name, label, approved, built-in, task count, rubric and profile ids, baseline digest), `templates.restore`, event `templates.revision.restored` | M01 | Identity facts for Setup and review; task count for the trial totals; identity check inside `runs.launch`; revalidation after a restore **[R067]** |
| `AssessOperation` / `environment.assess`, `MachineIdentitySource.current()` (machine identity and details), `InstalledHarnesses.list()` (credential presence per harness/provider, by name only), events `environment.report.updated`, `environment.harness.changed` | M03 | Entry and judge readiness, machine record, redaction input, revalidation **[R032, R066]** |
| `CatalogSelections.check(selection, required_capabilities) -> SelectionEvidence`, `CatalogOptions.get(harness, target, account_id) -> EffortOptions`; API equivalents `catalog.check_selection` and `catalog.options`; `ExchangeRates.snapshot(currencies) -> RateSet`, `ExchangeRates.parse_currency`; events `catalog.refresh.finished`, `catalog.prices.refreshed`, `catalog.rates.refreshed`, `catalog.override.saved`, `catalog.override.removed` | M04 | Stored-state validation and options; preserve full pricing, resolved billing and rate provenance. Account/rate overrides revalidate affected drafts. These ports never fetch or run a model. **[R065, R066, R080, R081, R156, R157]** |
| `HarnessInspection.assess_policy(entries)`, `harness.policy.matrix` | M05 | Clean-policy assessments and isolation limitations for Setup, review and launch **[R032]** |
| `WeightValidation` / `scoring.validate_weights`, `scoring.preview_weights`, `scoring.weight_choices`, `WeightsScreen(context="setup")` | M06 | Weight validation and normalized preview; the weights editor **[R033, R145]** |
| `runs.launch` (job; request `draft_id \| config_id \| config_path`, `preview_digest?`, `execution?`, `exclude_entries?`, `policy_overrides?`; steps `identity`, `config`, `weights`, `bind`), `SchedulingVocabulary` (default, `validate`, `validate_trials` raising `runs.invalid_trials`, queue notes), `ExecutionDefaults` (trials 1, task timeout 3 h), `RunUid`/`RunLabel` reservation and durable bind journal, `events.subscribe`, `job.progress`, `job.finished` | M11 | Launch, concurrency and trial vocabulary and "queued after #1" notes, subscriptions **[R045, R067, R077]** |
| `JudgeRequirements.check(template: Sha256, judge: JudgeSelection) -> JudgeCheck` (async); `session_count(configurations: int, trials: int) -> int`; `JudgeCapabilityScreen` factory from `tui/screens/judge_capability.py` | M12 | `JudgeCheck` supplies `usable`, `profile_id`, ordered default quality weights (`default_quality_weights` on `JudgeCheckDTO`), `requirement {screenshot_inspection, reason}`, capability state/source, M03 readiness and reasons. Map screenshot inspection to required `image_input` in the engine. Session count is the exact product after positive-integer validation; it starts no session and applies no trial cap. M12 owns the capability modal; M07 owns Setup/JudgeScreen navigation. **[R033, R037, R077, R158]** |
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
- Subscriptions: `events.subscribe(["configs.draft"], cursor?)` after opening the draft; apply that draft's snapshot/revisioned updates through M15's shared manager. Updated events reissue `configs.setup(draft_id)`; discard tombstones leave the editor, resync replaces its projection, and stale query workers cannot restore earlier data. Unsubscribe on unmount; leaving the screen does not discard the draft.
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
| `Input #trials` submitted | — | `configs.set_execution(draft_id, trials=<raw text>)`; text that is not a whole number is sent as entered and comes back as `runs.invalid_trials` | `#execution-pane`; the error is shown under `#trials` |
| Monitoring row (Execution pane) | — | none on press; pushes `MonitoringScreen(draft_id, current)` (M18), which issues `configs.set_execution(monitoring={mode, sampling_interval_s})` | `#execution-pane` (mode and interval), `#limitations` |
| `c`, Currency row (Execution pane) | `currency` | none on press; pushes `CurrencyEnergyScreen(mode="setup", initial=accounting)` (M10); on dismiss with an `AccountingDTO`: `configs.set_execution(draft_id, accounting=…)`; enabled from `can_edit_execution` | `#execution-pane` currency and tariff text |
| `Select #configuration` change | — | `configs.open(template_sha256, config_id \| draft_id, replace_draft_id=draft_id)`; on `configs.unsaved_changes` a confirm dialog repeats it with `discard_changes=True` | whole screen |
| `ctrl+s`, "Save configuration" | `save` | `configs.save(draft_id)` | `#dirty` cleared; `configs.file_changed` shown with remedy |
| "Save as…" | `save_as` | `configs.save(draft_id, as_name)` after a name prompt | `#configuration` |
| `enter`, `Button #review` | `review` | none on press; pushes `ReviewLaunchScreen(draft_id)`; disabled while `can_review.enabled` is false | — |
| `tab` | `focus_next` | none | — |

**`JudgeScreen(ModalScreen[JudgeChoice | None])`** — same file; artboards JudgePicker and JudgeFallback.

- View model `JudgeVM {branches: list[BranchVM], fallback_notice: str | None, harness_options, model_options, efforts: list[RadioVM], selected, checked_text, rubric_text, can_use: ActionState}` built from `JudgeCandidates` and `catalog.options`. `#preselection` lists the branches with their engine outcome marks (✓ chosen, ✗ skipped with reason, ○ not used or not reached); `.notice.-warning` appears only when `fallback` is true.
- Loads: `configs.judge_candidates(draft_id)` on mount, then `catalog.options(harness, target, account_id)` for the selected harness and whenever `Select #judge-harness` changes. `RadioSet #judge-effort` shows only the returned choices. ContentSwitcher on `#judge-fields`: loading, fields, error (`catalog.no_supported_harness` and others with remedy). No subscriptions.

| Binding / control | API call | Result |
|---|---|---|
| `Select #judge-model`, `RadioSet #judge-effort` | none (choices already loaded) | local selection |
| `ctrl+s`, `Button #use` | `configs.set_judge(draft_id, …)` | dismiss with the choice; `judging.screenshot_inspection_unsupported` / `judging.screenshot_inspection_unknown` open M12’s `JudgeCapabilityScreen` through the injected factory; other owner codes remain inline |
| `esc`, Cancel | none | `dismiss(None)` |

Setup opens the same M12-owned capability factory when validation reports either screenshot-inspection reason for its judge. The modal is implemented only in `axbenchmark/tui/screens/judge_capability.py`; it refreshes `judging.check_judge` itself. M07 handles its `Action.CHOOSE_JUDGE` by opening/returning to JudgeScreen, `Action.OVERRIDE_CATALOG` by opening M04’s override screen then revalidating, `Action.RECHECK` by revalidating, and `Action.BACK` by retaining the current draft. No modal implementation or capability rule is copied into `setup.py`.

**`ReviewLaunchScreen(Screen)`** — same file; artboards ReviewLaunch and TrialBudgetWarning (wide, compact). Constructor `ReviewLaunchScreen(draft_id, adjustments=None)`.

- View model `tui/viewmodels/review_launch.py`: `ReviewVM {bar, template_kv, entries: list[ReviewRowVM], judging_kv, execution_kv, recorded_kv, compact_lines, cli_command: str | None, preview_digest, budget_confirm: ConfirmVM | None, can_launch: ActionState, can_copy_cli: ActionState}` from `LaunchPreview`. `recorded_kv` carries the price, billing (with "declared by user") and rate lines as returned; `budget_confirm` is built from `trial_budget_warning` (title "More than 5 trials", the engine's `message`, the task-run and judge-session totals, buttons Launch and Back) and is `None` when no warning was returned. The screen renders the resolved launch, not the editable configuration.
- Loads: `configs.review(draft_id, **adjustments)` on mount; each returned digest replaces any prior confirmation. ContentSwitcher on `#review`: `#review-loading`, `#review`, `#review-error` (`configs.incomplete` lists the issues and offers `esc` back to Setup; other codes verbatim).
- Subscriptions: `configs.draft`; select this draft by object key. Any edited/revalidated/saved update clears confirmation, disables Launch while refreshing, and reissues `configs.review`; a discarded tombstone returns to Setup. Snapshot replacement does the same. Ignore stale worker replies; re-resolution at launch remains the final race check.

| Binding / control | Action | API call | Result |
|---|---|---|---|
| `esc`, "Back to setup" | `app.pop_screen` | none | — |
| `c`, "Copy as CLI command" | `copy_cli` | none; copies `cli_command`; disabled from `can_copy_cli` with its reason | footer message |
| `ctrl+l`, `Button #launch` | `launch` | With `budget_confirm`: none on press; pushes M15's `ConfirmScreen(budget_confirm)` and continues only on `True` (`False` stays on the review). Then `runs.launch(draft_id=…, preview_digest=…, **adjustments)` (M11); disabled from `can_launch` | pushes `LaunchCheckScreen(job_ref)` (M01); `configs.review_stale` reloads the preview and requires a fresh warning confirmation; `harness.clean_unavailable` pushes `CleanBlockedScreen` (M05) per entry |

**`LaunchRecordScreen(ModalScreen[None])`** — `axbenchmark/tui/screens/run_config.py`; artboard LaunchRecord. Pushed from the run screens (M11, M05) for a run UID.

- View model `LaunchRecordVM {run_uid, run_label, binding_digest, trial_refs, title, frozen_text, records: list[RecordVM], resolved_yaml: str, path}` from `LaunchRecordDTO`; `TextArea #resolved-yaml` is `read_only=True` and shows the engine's redacted text.
- Loads: `configs.launch_record(run_uid)`. States: loading, record, error (`configs.launch_not_found`). No subscriptions: the record is immutable.

| Binding | API call | Result |
|---|---|---|
| `esc`, Close | none | `dismiss()` |
| `c`, "Copy path" | none; copies `path` | footer message |

Screens of other modules that issue `configs.*` calls: `EntryPickerScreen` (M04, `configs.add_entry` / `configs.update_entry`), `EnvPolicyScreen` (M05, `configs.update_entry`), `WeightsScreen` (M06, `configs.list_presets` / `configs.save_preset`), `MonitoringScreen` (M18, `configs.set_execution`); `CurrencyEnergyScreen` (M10) issues none and returns its value to SetupScreen; the Configurations tab of `TemplateScreen` (M01, `configs.list`, `configs.duplicate`), and `LaunchCheckScreen` (M01, which shows the `config` and `weights` steps).

### 5. CLI

| Command | API |
|---|---|
| `axbenchmark run --config FILE --no-tui [--jobs N]` | One `runs.launch(config_path=FILE, execution)` call and its `job:<job_id>`/run streams (M11). Its synchronous M07 resolution returns every `configs.incomplete` issue before staging. M11 includes final `totals` and `trial_budget_warning` in the initial `LaunchStep` progress; M14 prints that warning/message/totals once to stderr and continues without reading stdin. No preliminary CLI preview is required. Trials (no upper limit), sampling interval, display currency and tariff use the same owner validation as Setup. **[R050, R060, R077, R158]** |
| `axbenchmark configs list --template SHA` | `configs.list` |
| `axbenchmark configs show CONFIG_ID` | `configs.get` |
| `axbenchmark configs validate (--config FILE \| CONFIG_ID)` | `configs.review`; prints the preview (with its rate lines and any trial budget warning) or the issues |
| `axbenchmark configs duplicate CONFIG_ID [--name NAME]` | `configs.duplicate` |
| `axbenchmark presets list [--kind quality\|ranking]` / `presets save --kind K --name N --weights FILE` / `presets delete PRESET_ID` | `configs.list_presets` / `configs.save_preset` / `configs.delete_preset` |
| `axbenchmark run record RUN_REF` | M14 resolves UID/unique label via `results.resolve_run`, then `configs.launch_record(run_uid)`; ambiguous labels show UID/origin candidates. |

Only `run --config … --no-tui` comes from [SPEC.md](../SPEC.md); the others exist because every API method must be reachable from the CLI and are owned by [M14](14-command-line-interface.md). The draft methods (`configs.open`, entry, judge, weight and execution edits, `configs.save`, `configs.discard`) are interactive editing steps on persisted drafts; the CLI reaches the same result by passing a complete YAML file to `run`, `validate` or a registry-driven method call if M14 provides one. All commands accept `--json`.

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain (`tests/engine/configs/domain/`) | `validate_setup` produces one issue per problem with the owner's code and never alters the entry, effort, judge or preset; pin mismatch, no entries, missing preset and unresolved judge are blocking. `preselect_judge` covers each branch: valid saved judge; unusable saved judge skipped with its reason then planner; no planning then first usable entry in entry order; nothing usable → unresolved; a `USER` judge is never replaced. `resolve_launch` copies preset values (editing the preset afterwards leaves the resolved weights and digests unchanged); two entries for one harness stay distinct; adjustments are recorded; the same grading profile applies to every entry; trials, sampling interval and tariff are copied as entered and the template identity is unaffected by them; each entry's and the judge's `Pricing` lands in the `PriceSnapshot`, an unknown price stays unknown; billing preserves optional source (`override`, `discovered`), declaration flag, `observed_from` (`endpoint`/`status_output`), date and label, including declared unknown and an account with neither reading nor declaration stays `unknown`. `rate_snapshot` with prices in USD, EUR and COP, display currency GBP and a EUR tariff lists EUR, COP and GBP (never USD), copies a user-supplied rate with layer `override`, records an absent rate as `MissingRate` with a `configs.rate_missing` limitation and no issue. `trial_budget`: trials 5 → `None`; trials 6 with one provider entry → warning with `task_runs = configurations × 6 × tasks`, the fake M12 session count and that entry in `affected`; trials 6 with only `EndpointRef` entries → `None`; trials 1000 is valid. Digests are stable across key order. No domain type has a credential value field. **[R017, R032, R033, R037, R066, R067, R077, R080, R081, R145, R156–R158]** |
| Use cases (fake ports) | Save two configurations for two revisions with an in-memory `ConfigRepository`: each pins its own SHA-256, and a fake M01 and M02 record no change. Imported-revision configuration with only local harnesses validates. Fake readiness turns an entry `blocked` → `configs.draft.updated` with an issue, no substitution. `SetExecution` with trials 0, sampling interval 0.2 s or a negative tariff stores nothing and returns `runs.invalid_trials`, `telemetry.invalid_interval` and `measurements.invalid_accounting` from fake owners. A draft written by one `fs_drafts` store is returned with its edits by a fresh store over the same directory (engine restart); `configs.discard` removes the file. `PrepareLaunch` with a changed fact after review → `configs.review_stale`; with a fake M01 mismatch nothing is committed and `discard` removes staging; success writes configuration and weights as separate records with machine and catalog evidence, `prices.yaml` and `rates.yaml`; a fake M04 rate change after commit leaves `rates.yaml` unchanged; a resolved launch with a `trial_budget_warning` commits and records the warning. The rates fact source never calls a collecting method of the fake M04. A fake secret in upstream diagnostic text never appears in any record, DTO, error message or log line. **[R009, R019, R032, R066, R067, R136]** |
| API (`InProcessClient`, no interface) | Every `configs.*` method round-trips its DTOs; error codes, pass-through codes and `field` paths are stable; `SetupView.capabilities.can_review.enabled` is false exactly when `issues` is non-empty; subscribe to `configs.draft`, emit a fake `environment.report.updated`, receive `configs.draft.updated`, and replay it with `EventCursor {epoch, seq}`; `configs.review` followed by `runs.launch` through a fake M11 freezes records that equal the preview, including rates; `trial_budget_warning` is present in `LaunchPreview` without changing `can_launch`; registry metadata gives `configs.delete_preset` the `destructive` class; JSON Schema export includes `configs.*`; `import-linter` contract for `engine.configs` layers. |
| Screens (fake client, `App.run_test(size=(120, 40))` and `(80, 24)`) | Setup renders a fake `SetupView` with five entries, two for one harness; a view with issues sets `.-invalid`, shows `#validation` lines with the fake's keys and disables `enter` through `check_action`; `del`, `ctrl+s`, preset and concurrency changes each issue exactly one call; `#entries-empty` and `#entries-error` (pin mismatch) render from fakes. `c` pushes CurrencyEnergyScreen and, on dismiss with a value, issues exactly one `configs.set_execution(accounting=…)`; submitting `#trials` issues one `configs.set_execution(trials=…)` and shows `runs.invalid_trials` verbatim. JudgeScreen shows fallback marks and the warning from `fallback: true` and issues one `configs.set_judge` on `ctrl+s`. ReviewLaunch renders the fake preview, including "declared by user" billing and rate lines as returned, and `ctrl+l` issues one `runs.launch` with the preview digest; `can_launch: {enabled: false}` disables it. With a `trial_budget_warning`, `ctrl+l` pushes `ConfirmScreen` showing the totals and issues `runs.launch` only on `True`; without one, no dialog appears. LaunchRecord shows the redacted YAML read-only. View-model builders are tested as pure functions without Textual. |
