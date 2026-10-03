# Model variants, lineage and benchmark comparison

Status: binding implementation supplement; proposed contracts and acceptance, not an implemented feature or certified provider capability. Requirement: R190. Extends existing children; adds no dependency-graph node. Reader: implementers of catalog, launch, retention and analysis who must register a model variant and compare its retained benchmark results without inventing identity or provenance.

Open-weight/open-source model results must expose **QUANT**, **FINETUNE**, their combination, creators and dates. These are independent facets, not an exclusive model-type enum. Registration records an existing model; it must never train, quantize, download weights, load/unload models, manage a server or invoke inference. Optional factual license references do not certify that publicly downloadable weights are open source.

The [catalog](M04/01-catalog-resolution.md), [frozen launch](M07/02-launch-preparation.md), [retained results](M02/01-retained-records.md), [rankings](M06/01-scoring-service.md) and [statistics](BENCHMARK-STATISTICS.md) contracts remain authoritative. M10 measurements, token/weight/score arithmetic, all eight ranking factors, six-category domain grades and required-check gates are unchanged. Preserve every current domain rubric and automated/`human_review` backend.

Variant lineage never inherits base-model prices or billing onto a fine-tune/quantization. M04's existing context/account pricing and M10's cost evidence remain authoritative; public weights imply neither zero hosting charges nor zero energy cost. This contract primarily describes competitors; automated judge variants, if recorded, remain role-separated in the frozen JudgeGroup identity. Human judges receive no invented model-variant fields.

## Identity and ordered lineage

Publish versioned `ModelVariantV1`, `ModelVariantRefV1`, `ArtifactManifestV1`, `VariantEvidenceV1` and `VariantComparisonV1` DTOs through the existing owner schemas. A descriptor is metadata about a variant, not proof that it was executed. Retain the descriptor version and normalization-policy version with every projection.

| Contract | Required fields and meaning |
|---|---|
| `CheckpointRefV1` | Source kind/namespace, model/repository ID, requested revision, immutable resolved revision, artifact-manifest reference/digest and identity evidence; unknown fields remain explicit. A local checkpoint may have known content but unknown upstream source. |
| `ModelVariantV1` | `schema_version: 1`, opaque portable unique `variant_id`, descriptor revision, display label, family claim, lineage nodes/edges, root checkpoint set/completeness, selected output artifact, inference adapter composition, quantization facets, creators/dates, evidence references and optional licenses. |
| `ModelVariantRefV1` | Version, `variant_id`, immutable descriptor snapshot digest, nullable execution fingerprint and fingerprint coverage/status. Distinct metadata snapshots can refer to the same execution content. |
| `LineageNodeV1` | Stable node ID; `base`, `fine_tune`, `adapter`, `merge`, `conversion`, `quantization` or `unknown`; ordered parent edges with pinned checkpoint/artifact refs; output refs; operation/tool/version/recipe claims; creators/dates and evidence. |
| `ArtifactManifestV1` | Version/policy, completeness, required file roster, safe logical relative names, roles, byte sizes, digest algorithm/value and evidence basis; roles cover weights/shards/index, adapters/configs, tokenizer, chat template and model execution config as applicable. |
| `AdapterCompositionV1` | Ordered active adapter references, exact scales, application/combination mode and configuration refs/digests; explicit known-empty, unknown and unavailable states. Merged weights are a different output artifact, not an active adapter list. |
| `VariantEvidenceV1` | Requested ref; resolved artifact/ref and time; effective served observations and effective control claims by invocation/request/TrialRef, proof scope, evidence refs, limitations and `confirmed`, `reported`, `declared`, `unverified` or `mismatch` status. |

Lineage is an acyclic graph with deterministic topological serialization and explicit edge order; it is not a flat list that loses merge parents. Preserve each transformation's immediate parent revision/artifacts and transitive roots. Reject cycles, duplicate conflicting node IDs and dangling references unless the edge explicitly terminates at an unknown parent boundary. Preserve transformation order; quantize→adapt is not adapt→quantize.

`base_family`, exact root checkpoint(s), immediate fine-tuned parent and adaptation path are separate facets. Matching basename, architecture, parameter count, family, provider alias or repository name without its revision/artifacts never establishes an exact common base. A merge with multiple roots remains multi-base; an unknown parent prevents a complete-root claim. Never select one convenient ancestor to make two models appear comparable.

A single canonical root requires complete, nonconflicting lineage and matching source-qualified pinned checkpoint/artifact references. Same-base browsing may use source-attested or user-declared parent references with those evidence tiers visibly attached; unknown revisions/artifacts prevent an exact-checkpoint claim. Content-equivalent root manifests may link mirrors without treating their uploaders as base authors.

Hashing verifies bytes, not truthful ancestry or authorship. Keep root-reference equality, ancestry evidence and actual served-content evidence as separate checks. Card/header text alone cannot yield a verified-lineage or strict Matched label: the latter requires corroborating transformation records binding each input/output manifest plus confirmed effective execution. This verifies the documented evidence chain, not an absolute guarantee about undocumented training history. Absent such corroboration, retain a source-attested/user-declared same-base view without upgrading its tier.

Canonical execution identity and provenance identity have separate purposes:

1. Canonicalize a versioned execution payload as UTF-8 JSON with sorted object keys, ordered semantic arrays, explicit null/state tags and exact numeric strings; reject duplicate keys/nonfinite numbers. Hash complete manifest content projections (files ordered by role/logical path, excluding provenance), active adapter order/scales/config and model-level tokenizer/chat-template/runtime-precision configuration. Preserve each digest's algorithm and source semantics; a Git object ID is not relabelled a file SHA-256.
2. Exclude label, creator/date/ancestry claims, README/card contents, retrieval time, source-machine path, account and endpoint from that execution payload. Correcting ancestry, a card date or creator leaves unchanged model bytes/composition with the same execution fingerprint; it changes the descriptor/provenance snapshot digest. Changed weights, required support files or adapter composition change execution identity.
3. A digest of an incomplete manifest is only an incomplete-manifest digest, never a complete execution fingerprint; unknown adapter composition or required model-level runtime configuration also prevents a complete execution fingerprint. For opaque remote APIs, keep the fingerprint null and retain reported/declared identity; never hash an alias to manufacture a content identity or equate two unknown fingerprints.
4. Keep M07's full managed configuration fingerprint/binding separate: it additionally records harness/version, endpoint/account scope, requested/effective effort, environment and serving settings. Equal execution fingerprints do not merge configurations, accounts, runs or trials.

Local paths and display aliases are lookup locations, not universal model identities. Copying identical complete execution content to another path can preserve content identity; identical aliases resolving to different bytes must remain distinct. A changed file that also changes an embedded metadata header changes file bytes and its artifact digest even if a human considers its tensors equivalent.

## Quantization and adaptation semantics

| Case | Required representation |
|---|---|
| Fully fine-tuned model, then quantized | Fine-tune output is the quantization parent; expose both FINETUNE and QUANT, retaining both creators and dates. |
| Separate LoRA at inference | Base artifacts plus ordered active adapter artifacts/scales/config; distinguish training lineage from runtime application order and from merged fine-tuned weights. |
| Sequential fine-tunes/adapters or multiple-parent merge | Preserve all stages and ordered parent contributions/merge recipe when known; unknown recipe/parent stays unknown. No flattened “one fine-tune” identity. |
| QLoRA training | Record training method and training precision separately; it does not establish stored or effective inference-weight quantization. |
| KV-cache quantization | Record serving/cache precision separately; never classify the model's weights as quantized from cache precision. |
| No weight quantization / unknown | Explicit evidence-backed `none` differs from unknown/unavailable. “Full precision” is a reported label until the actual dtype/scope is known; FP16/BF16/FP32 remain distinct. |
| Mixed/per-tensor quantization | Preserve native method, format/version, exact preset, tensor/group overrides, recipe/config digest and coverage; never reduce mixed bits to one invented bit count. |
| Stored versus runtime precision | Separate stored-weight type, runtime weight representation, compute/accumulator dtype and KV-cache dtype, with source and effective-evidence status for each. |

`QuantizationV1` carries availability plus `none | quantized` when known; method namespace/name/version, native preset, optional exact bit/group parameters, tensor-policy/config refs, storage format/version and precision facets. Preserve `Q4_K_M`, AWQ, GPTQ and NF4 in their source-specific roles; a preset, algorithm, data type and container format are not interchangeable values. Unrecognized native metadata is retained as raw claims, not coerced to a familiar preset.

The same preset can have different recipes, calibration data/configuration, tool versions or output bytes. Do not collapse them into one variant. Recipe provenance may be unavailable even when output bytes are fully identified; comparison must disclose that limit rather than infer a recipe. A filename such as `Foo-Q4_K_M.gguf` supplies a parsing hint only until supported by inspected metadata or an explicit user declaration.

## Creator, date and source evidence

Creator and date fields are required schema slots, not required invented values. Every lineage node exposes applicable roles `base_author`, `fine_tune_creator`, `trainer`, `quantizer`, `converter`, `distributor` and `uploader` separately; unrecorded applicable roles remain Unknown. Record public handle/organization, source namespace/URL and role evidence, never infer a person's real identity. A repository owner or commit author is not automatically the quantizer, trainer or base author.

Use `ClaimV1<T> {state, value, basis, evidence_refs, alternatives, reason}`: `state=known|unknown|unavailable|conflicting`; `basis=observed|reported|user_declared`. Unknown/unavailable have null values and reasons; conflicting claims preserve every alternative and source, with no silently chosen truth. Reported/user-declared values display those labels even when syntactically known. “Observed” attests only to the named observation, not all upstream claims.

`DateClaimV1` adds `kind=created|published|uploaded|observed`, `subject_ref`, raw value, precision (`instant|day|month|year`), timezone/offset if supplied and normalized value at the same precision. Each node exposes these slots with Unknown/unavailable reasons when unrecorded or inapplicable. Creation describes a particular base/transformation artifact; publication and upload describe their own events. Hub repository creation and last modification are source events, never substituted for model creation. Record observation/retrieval times independently.

Preserve `2026-09` as a month and `2026-09-12` as a day; neither becomes midnight UTC. Offset-bearing instants may normalize to UTC while retaining raw offset; absent timezone is explicit unknown, not the viewer's zone. Reject impossible dates without guessing. Date-range filtering returns `definite|possible|unknown` matches against the recorded precision; strict filters admit only definite matches, and partial overlap/unknown remain disclosed. Stable date sorting keeps unknowns separate, never at epoch zero.

Each source observation retains bounded raw claims, sanitized source URI, resolved source revision, `retrieved_at`, content digest with algorithm, parser/version and an evidence pointer (JSON field/header key/card section). Where raw input contains credentials or local paths, retain only the safe projection and record redaction; preserve an original-content digest only if safe, separately from the retained safe-content digest. Never retain a secret merely to satisfy provenance completeness.

Metadata resolution extends M04's source-aware override › discovered › bundled layers per field: inherit removes a declaration, value records `user_declared`, explicit unknown stops lower-layer inference. Preserve contradictory discovered evidence beside the chosen override. Missing creator/date prompts nonblocking Setup metadata review; otherwise usable runs and basic results remain available as unclassified/claimed/unverified.

Freeze provenance snapshots at launch and effective observations during execution. Later Hub edits cannot rewrite sealed results, creator/date fields, default filtering or sorting. Corrections are append-only annotations with stable operation ID, author/source, timestamp, prior snapshot ref and replacement claim; identical retries deduplicate and conflicting reuse fails. Default historical view is **As recorded**; **With annotations** is an explicit view choice with visible differences and retained history, never a silent backfill.

## Read-only discovery and effective execution evidence

M04.2 may add optional source adapters for official Hub card/revision/file metadata, bounded GGUF headers/tensor descriptors, adapter JSON configuration and documented native server introspection. M05 adapters supply actual serving observations through the existing inspection/observation seams. Support is recorded by adapter/version; unsupported or unexposed fields remain unavailable, not inferred from model response content.

These primary sources were opened and reviewed on 2026-10-03; they support only the bounded format facts below, not benchmark quality or loaded-model proof:

| Primary source | Verified format fact and implementation boundary |
|---|---|
| [Hugging Face model cards](https://huggingface.co/docs/hub/model-cards#specifying-a-base-model) | `base_model` supports one or multiple parents and relationship metadata. Treat card assertions as reported lineage; inferred Hub relationships do not establish exact checkpoint bytes. |
| [Hugging Face HfApi](https://huggingface.co/docs/huggingface_hub/package_reference/hf_api#huggingface_hub.HfApi.model_info) | `model_info` accepts revision and optional file metadata; repository/file fields are optional and carry distinct revision/OID/LFS semantics. Repository `created_at` is repository creation, not a transformation creation date. |
| [GGUF specification](https://github.com/ggml-org/ggml/blob/master/docs/gguf.md) | Quantization format version is separate from tensor scheme; `general.file_type` describes the majority of tensors. Parse native values and tensor coverage without turning a majority preset into uniform bit depth. |
| [PEFT checkpoint format](https://huggingface.co/docs/peft/developer_guides/checkpoint) | Adapter weights/configuration are separate from base weights; base/revision fields may be null. Merged storage contains base weights and differs from a separately active adapter. |
| [PEFT quantization](https://huggingface.co/docs/peft/developer_guides/quantization) | QLoRA combines quantized-base training with LoRA. Retain training claims separately from the inference artifact and effective precision; do not infer the eventual deployment. |

Local inspection hashes already-present bytes with bounded memory, deadlines/progress/cancellation, safe regular-file reads and manifest limits. Hash every required shard/index/adapter/support file under a versioned manifest policy; missing or changed-during-read files prevent completeness. Never execute model code, import custom model modules, deserialize pickle or follow unsafe symlinks. A stat-only cache hit is not proof of unchanged bytes; use verified immutable content storage or rehash before making a current complete-content claim.

Network discovery is explicit and bounded through configured source adapters; no arbitrary URL fetch follows a card, imported archive or lineage link. Validate destinations/redirects, redact credentials, keep private/local endpoint locations out of portable evidence and treat fetched text as inert data. Discovery, registration, queries, comparison and report generation make zero model calls. Normal M04 refresh scope/cancellation and last-good evidence rules remain intact.

Keep requested selection, resolved on-disk/source artifact and effective served evidence separate. A Hub card, file digest or local file header proves something about that source/file only; it does not prove the server loaded it. `confirmed` requires supported invocation-bound evidence connecting actual loaded artifacts and full adapter/runtime composition to the frozen request; a returned alias alone is `reported`, not confirmed. Preserve proof coverage and gaps, including hidden routing or unobserved requests.

Before freeze, a known requested/resolved contradiction returns typed `catalog.variant_mismatch` with expected/observed refs and remedy. Before each dispatch, M05 validates available effective evidence against the frozen selection: a known mismatch prevents that dispatch and produces existing `harness.model_rejected` lifecycle data with `reason=variant_mismatch`. Never silently substitute, retry, load another model or continue as the requested variant.

If drift is discovered during a task, preserve observations/output, stop/drain that affected invocation through M05 and halt its configuration through M11's existing model-selection failure path; later tasks/trials are `not_run`, other configurations continue. Identify unreliable TrialRefs/request intervals since the last reliable observation, conservatively the whole affected trial when unknown; exclude them from exact-variant cohorts. Required complete-trial/failed-execution ranking gates remain in force.

Detection after sealing appends an identity-evidence annotation/effective exclusion without mutating original facts; the affected full subject cannot retain a qualified exact-variant result. This exclusion applies in both metadata views and cannot be disabled by choosing As recorded. Do not recast this as M01 `IdentityMismatch`/template corruption or invoke run-wide template invalidation. An otherwise usable but unverified provider may run with an explicit unverified label; lack of proof differs from evidence of mismatch.

## Frozen launch and retained data

M07.1 adds optional `model_variant_ref: ModelVariantRefV1` to competitor configuration entries. A new unclassified selection may omit a registered descriptor and retains explicit Unknown identity; genuinely absent archived metadata also reads Unknown without rewriting its bytes. Explicit v1 refs must validate. This is a fresh implementation, with no old-installation migration or backfill requirement. M07.2 freezes requested descriptor, resolved artifact manifest/proof coverage, creator/date/source snapshots and comparison-control evidence in the immutable launch/binding before dispatch; changed material evidence invalidates a reviewed preview under existing stale-review rules.

M05 observations retain full `TrialRef`, invocation/request scope, requested/effective linkage, observed time and redacted evidence. M02 stores them through its existing durable append/finalization barrier; evidence persistence failure remains pending and cannot report a complete seal. Missing capability can settle as unavailable. Late observations/corrections follow append-only semantics, never alter `facts_digest` or the original binding.

Keep `variant_id`, descriptor snapshot digest, execution fingerprint, catalog context key, ConfigurationId and `(RunUid, ConfigurationId)` distinct in every codec. Reuse of a variant ID/descriptor revision with different immutable content is an import conflict, never last-writer-wins. Multiple configurations may execute equal variants; repeated trials remain attached to their frozen configuration. Imported runs from anyone/machine remain browseable under the same exact benchmark SHA, preserving origin and complete roster.

## Comparison modes and controls

Every variant comparison requires the exact approved template SHA, never its label or a “similar benchmark” claim. Filters select whole immutable `ConfigurationSubject=(run_uid, configuration_id)` groups; retain every expected TrialRef. Do not pool means, counts or grades across runs, machines, harnesses or variant labels, even when execution fingerprints match.

| Comparison mode | Declared changing axis / fixed relationship |
|---|---|
| `quantization` | Same exact root and complete adaptation/fine-tuned parent; vary quantization recipe/preset/storage and resulting bytes. Hold active adaptation composition fixed and disclose each allowed change. |
| `fine_tune` | Same exact root; vary adaptation path/output, with `scope=weights_only\|package`. Hold quantization method/recipe settings, runtime precision and serving conditions equal; package scope may explicitly vary supplied tokenizer/chat-template artifacts and labels those components. |
| `joint_variant` | Same exact root with both adaptation and quantization changes allowed; label the result a combined variant comparison, never isolate either effect. |
| `exploratory` | Browse claimed families/roots, multi-base or unknown variants with visible uncertainties/confounds; this does not assert a controlled same-base experiment. |

Publish `VariantComparisonSelectionV1 {schema_version: 1, mode, view: matched|exploratory, fine_tune_scope: weights_only|package|null, control_policy_ref, variation_fields, cohort_signature?}` through M02 shared filters. `variation_fields` must be members of the selected versioned mode policy, never a caller-supplied waiver; exploratory mode cannot request a Matched label. M07 freezes `VariantControlSnapshotV1 {schema_version: 1, policy_ref, requested_controls, observed_controls, evidence_refs, coverage}` with explicit claim states for every required field. M06 returns `VariantComparisonV1 {schema_version: 1, selection, subject: (run_uid, configuration_id), expected_trials, status: matched|exploratory|excluded|selection_required, root_refs, adaptation_ref, control_signature?, candidate_signatures, exclusions}`. Each exclusion includes code, field_path, expected/observed claims, evidence refs and affected full TrialRefs; this is classification metadata, never another score.

Each nonexploratory mode has a versioned explicit variation allowlist and control policy. **Matched** requires confirmed effective variant evidence, the corroborated exact-root evidence chain above and known/equal required controls across every selected trial: harness/version, requested/effective effort, environment policy/settings, tokenizer/chat-template content, serving software/version/config, context limits, generation/sampling settings, hardware/resource allocation and concurrency, except the mode's explicitly allowed changing components. Freeze controls or explicit unavailable reasons; do not equate two unknown values.

The allowlist may name only the chosen mode's transformation artifacts and explicitly declared associated precision settings; it cannot waive unrelated harness/hardware/environment controls to obtain a match. Quantization output differences are expected; a changed runtime dtype must be named as an allowed quantization condition or remains a confound. Fine-tune mode keeps quantization/runtime conditions fixed; package scope discloses tokenizer/template changes as a package comparison, never weight-only isolation. Joint mode discloses both sets of changes.

Unknown/different controls produce field-level confounds and exclude the subject from strict Matched view while preserving exploratory inspection. User-selectable cross-machine browsing remains available; a similar hardware label alone cannot prove matched allocation/environment. Even matched observational results describe tested configurations, not an unqualified causal model-quality claim.

Return typed `variant_identity_unknown`, `variant_lineage_unverified`, `variant_control_unknown`, `variant_control_mismatch` and `variant_effective_mismatch` exclusions with field path, compared values/evidence and affected TrialRefs. Multiple incompatible control signatures require an explicit cohort/signature selection before strict ranking; expose candidate groups rather than silently choose a favorable subset.

M06 first applies template/filter/variant-mode/control selection, then its unchanged per-trial quality/check/measurement gates, judge groups, complete-roster means, common weights, exact rational normalization and eligible-population extrema. Preserve the statistics supplement's eight-factor policies, zero/unknown rules and deterministic tie key. Variant metadata adds no score component or grade bonus.

Never pool reviews across different judge fingerprints, rubric versions or backend identities, including `human_review`; use the existing explicit review/group selection. Missing a selected review in any trial still excludes the whole subject. Comparison/filter/annotation changes trigger no rerun, regrade or model call. Original raw counts, costs, coverage, grades and review history remain inspectable with their existing meanings.

Builder base/fine-tune/quantization, creator/date and provenance facets MUST NOT enter automated or human judge inputs, anonymous evidence metadata, browser form data or identity-revealing labels. Extend M12's recursive projection tests for all backends and domain profiles. Preserve legitimate artifact model/API terms and approved domain evidence; do not alter delivered source bytes to hide them.

## API, UI and portable output

Extend existing `catalog.entry/entries/options/check_selection`, `catalog.save_override` and explicit discovery DTOs with variant detail, per-field source-aware forms, coverage and review notices. Variant registration/edits use the existing catalog metadata mutation boundary; no model lifecycle API is introduced. Lists/evidence pages use bounded cursor pagination and stable IDs; never group/select by a display label. Return shared ActionState and typed numeric error envelopes.

M02 owns shared `VariantFilterV1`/comparison-selection DTOs consumed by existing `results.*`, `scoring.*` and report requests: exact root/family; lineage path/adaptation; quant method/preset/storage/runtime precision; creator **role** plus handle; date **kind**/range/precision; provenance/effective-proof state; annotation view; comparison mode/control-policy ref. Pin selection, metadata view and publication revision in cursors and report snapshots; stale cursors use the existing resync/error behavior.

Use stable facet IDs independent of labels, deterministic null handling and exact engine sort keys. Creator/date filters must identify their lineage node/role or kind, not search a flattened author/date string. Selecting As recorded restores the metadata-derived cohort/order, subject to mandatory integrity/effective-mismatch exclusions. APIs expose each strict exclusion/confound and original TrialRefs; clients never infer matching or recompute eligibility.

| Surface/state | Required behavior |
|---|---|
| Catalog / ModelPicker | Label base/family, FINETUNE + QUANT together, exact native preset and effective-proof limitation; resolve ambiguous aliases by source/ref, never silently choose one. |
| `SetupVariantDetailEditor` / metadata review | Inspect ordered lineage, required creator/date Unknown slots, raw/source evidence and inherit/value/unknown controls; save through catalog, then revalidate Setup. Missing metadata is a visible nonblocking review notice. |
| ReviewLaunch / LaunchRecord | Show requested/resolved identity, separate creation/publication dates and source/declared badges; freeze reviewed snapshot. Known mismatch blocks dispatch; unverified remains explicitly unverified. |
| Results / Rankings / compare picker | Select exact benchmark, mode/axes, strict Matched or exploratory view; expose base/adaptation/quant, creator-role/date-kind filters, counts, confounds and proof badges without replacing original statistics. |
| Result detail / imported legacy | Inspect requested/resolved/effective evidence and annotation history; legacy fields read Unknown. Mismatch shows affected trials and the retained failure/remedy, never a successful requested-model label. |
| CLI / standalone HTML / ZIP | Same versioned refs, filters, provenance, distinctions and stable subject IDs; retain offline creator/date/lineage evidence and comparison controls without fetching live Hub data. |

M13 pins As recorded or explicit annotation view, complete selected subjects, policy, exclusions and source evidence in offline HTML. Its production offline scorer consumes unchanged shared vectors; filter changes cannot invent omitted trials or contacts with servers. M17 preserves descriptor/manifest snapshots, creator/date claims, effective evidence and annotation history with digest/binding checks; package model metadata, not model weight files. Credentials, source-machine absolute paths and private local endpoint locations never enter portable artifacts.

These are new state contracts for later owners, not instructions to edit the prototype in this supplement. At 120×40 and 80×24, use detail/scroll views while retaining mode, provenance, Unknown fields and mismatch/confound notices. M14 exposes equivalent catalog metadata forms and comparison selections through registry-driven commands and validates fields before requests.

## Representative identity cases

The names below are hypothetical fixture labels, not existing models or computed hashes. `<…>` denotes fixture-supplied values; implementation tests compute real digests from fixture bytes.

```json
{
  "schema_version": 1,
  "variant_id": "fixture-bob-q4",
  "root": {"source": "hub", "namespace": "example", "model": "Foo-base", "revision": "<pinned-base-revision>", "manifest_ref": "base-manifest"},
  "lineage": [{"id": "base", "kind": "base", "parents": []}, {"id": "ada-ft", "kind": "fine_tune", "parents": ["base"]}, {"id": "bob-q4", "kind": "quantization", "parents": ["ada-ft"], "preset": "Q4_K_M"}],
  "output_manifest_ref": "q4-manifest",
  "execution_fingerprint": "<computed-from-complete-execution-payload>",
  "provenance_snapshot_digest": "<computed-separately>"
}
```

This is an abbreviated identity projection, not a complete DTO; fixtures must include required per-node creator/date claim slots, manifest files and evidence. `Foo-base → AdaFT → BobQ4` versus `Foo-base → AdaFT → BobQ8` permits quantization comparison when controls pass. `Foo-base → CiaFT → BobQ4` changes adaptation too, requiring fine-tune mode with equal quantization conditions or a labelled joint comparison.

Two BobQ4 outputs with the same preset but different recipe/bytes remain distinct. `Foo-base + [LoRA-A@1, LoRA-B@1/2]` differs from reversed adapters, different scales or a merged output; use exact rational scales and preserve order even if a particular runtime claims commutativity. A Hub `Foo` parent without a pinned checkpoint stays claimed; a server reporting another actual artifact is mismatch, not confirmation supplied by that Hub claim.

## Ownership and acceptance

Publish additive DTO/port fixtures through Bootstrap under the existing dependency boundaries; no new child is required. Proposed runtime paths below live under `solution/` and are not present implementation/test claims.

| Existing owner | Binding implementation and test ownership |
|---|---|
| [M04.1](M04/01-catalog-resolution.md) / [M04.2](M04/02-catalog-discovery.md) | Catalog `domain/variants.py`, `lineage.py`, `provenance.py`, canonical manifest policy, source/override normalization and safe optional discovery adapters; catalog schema/codec/source fixtures. |
| [M04.4](M04/04-catalog-screens.md) / [M07.1–3](M07/01-configuration-drafts.md) | Variant detail editor; saved refs/legacy states; launch-control snapshots, stale review and freeze; catalog/setup/review view-model, API and Pilot tests. |
| [M05.2](M05/02-isolation-observation.md), supported M05 adapters / [M11.3](M11/03-run-scheduler.md) | Requested/resolved/effective observation/proof, no-inference inspection, before-dispatch mismatch and in-run drift using existing halt/drain semantics; adapter transcripts and lifecycle integration. |
| [M02.1–3](M02/01-retained-records.md) | Immutable provenance/effective records, append-only annotations, shared filters, durable indexes/cursors and Results detail; codec/history/import/query tests. |
| [M06.1–2](M06/01-scoring-service.md) | Mode/control matching, typed exclusions, whole-subject filtering and comparison UI; existing eligibility, grouping and Python/offline parity vectors unchanged. |
| [M12](M12/01-review-contract.md), [human review](M12/05-human-review-web.md) | Recursive anonymity tests across all domain rubrics and three backend kinds; no grading formula/schema change. |
| [M13](M13/01-offline-report-artifact.md), [M14](M14/01-registry-cli.md), [M17](M17/01-archive-contract.md) | Pinned offline evidence/views, CLI forms/filters and complete portable round trips; original grades, metric values and digest boundaries preserved. |

The acceptance matrix is mandatory planned work; fixture success does not establish actual server support. Extend owner suites with reviewed fixtures and exercise both engine clients plus production offline JavaScript where applicable.

| Fixture / failure | Required assertion |
|---|---|
| Normalization and unknowns | Parse Hub, GGUF and adapter fixtures into independent fine-tune/quant facets; unknown is never none/zero/full precision. Preserve Q4_K_M/AWQ/GPTQ/NF4 native distinctions, mixed tensors, QLoRA training and KV-cache separation. |
| Canonical identity | Permuted object keys preserve fingerprints; changed shard/support file/adapter order/scale changes them. Equal complete bytes with creator/date/ancestry/card corrections keep execution identity but change provenance digest; alias collisions never merge variants. Matching hashes do not validate ancestry or creators. |
| Graph and roles | Reject cycles/conflicting IDs; preserve sequential adaptations, exact parent revisions, multi-parent merges and unknown boundaries. Uploader/commit author does not become quantizer; multiple roots cannot pass single-root matching. |
| Dates and claims | Round-trip day/month/year/offset/unknown-timezone values and conflicting sources; creation/publication/upload remain separate, precision-aware filters disclose possible matches, Unknown sorts without fabricated instants. |
| Safe discovery | Disable inference/download/load/unload/server-management ports; metadata work still succeeds. Malicious card URLs, redirects, pickle/custom code, oversized headers, path escapes, missing shards and changed-during-hash inputs cannot execute/fetch/claim completeness. Cancellation leaves last-good evidence; stat-only cache is insufficient. |
| Frozen history | Freeze, edit live Hub metadata/overrides and compare sealed bytes/default cohort order. Append an annotation twice, conflict its ID, select/reset annotation view: history is retained, identical retry is a no-op, conflicting retry fails, As recorded is unchanged. |
| Effective mismatch | Before freeze reject known contradiction; before dispatch assert zero competitor spawn; during execution stop/drain affected lane, preserve evidence, mark later work not_run and other lanes continue. Post-seal detection appends affected-trial exclusion without rewriting facts or template invalidation. Unexposed provider runs only as unverified. |
| Comparison controls | BobQ4/BobQ8 with AdaFT match quant mode only with allowed known controls; different FT+quant is joint. Declared/card-only parents stay visibly tiered, never strict Matched. Unknown tokenizer or different harness/effort/hardware/concurrency excludes strict matching; an explicitly varied FT-package tokenizer is labelled package variation, not weight-only evidence. |
| Whole subjects and grades | Same-label/different-UID or equal-variant runs stay distinct; missing/failed trial or selected review excludes its whole subject. Judge fingerprints/backend/rubric groups stay separate; human judges have no model variant. All eight-factor/zero/quality/statistics vectors and raw grades retain exact values; base prices/billing never propagate by lineage. |
| UI/API and pagination | Both clients round-trip forms, filters, proof and typed mismatch errors; bounded cursor pages keep stable subject/facet IDs under label collisions. Stale views resync; compact/wide editors/compare picker expose roles, date kinds, Unknown and conflicts without recalculating eligibility. |
| Judge isolation | Inspect nested automated payloads and human-review form/evidence trees for every domain: no added builder variant/creator/date/provenance fields; legitimate artifact semantics and original artifacts remain intact. |
| Portable integration | Freeze → execute/observe → seal → ZIP export/import → offline HTML with network/model access disabled. Preserve creators/dates, lineage/manifests, effective proof, annotations, full rosters, original grades/statistics/weights and as-recorded digests; redact credentials/absolute local paths and include no weight binaries. |

## Separate harness-comparison axis

[CROSS-HARNESS-COMPARISON.md](CROSS-HARNESS-COMPARISON.md) holds model/variant and effort fixed while intentionally varying the harness. Its controlled label belongs to that separate axis; it does not relax this spec's fixed-harness requirement for strict quantization/fine-tune comparisons. Changing both harness and quant/fine-tune is explicitly multi-factor/exploratory unless analyzed as separate controlled cohorts. Preserve exact variant identity and provenance in either view; aliases and generic effort labels do not establish equality.
