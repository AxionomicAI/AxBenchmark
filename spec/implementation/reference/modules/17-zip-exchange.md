# M17 — Portable ZIP exchange and validation

## Purpose and authority

This proposed contract defines portable template and result exchange for AxBenchmark. It specifies future behavior, not implemented functionality; [SPEC.md](../SPEC.md) remains authoritative. Users export approved work, run AxBenchmark independently on another machine, and import its outcomes only after template and package integrity checks pass. Harness/model/effort selections remain saved per benchmark through [M07](07-run-configuration.md). **R009, R036**

The binding [context-monitoring supplement](../../CONTEXT-MONITORING.md#append-only-analysis-and-offline-behavior) defines retained capture and selected observer-analysis exchange; its [acceptance gates](../../CONTEXT-MONITORING.md#acceptance-and-integration-gates) apply here.

The binding [v2 migration](../../BENCHMARK-MODES.md#minimal-canonical-v2-migration) and [mandatory task commits](../../BENCHMARK-MODES.md#mandatory-task-commits) govern embedded definitions and retained commit evidence. The [design summary rows](../../BENCHMARK-DESIGN-SPEC.md#screen-and-state-change-matrix) and [commit evidence presentation](../../BENCHMARK-DESIGN-SPEC.md#mandatory-commit-review-and-evidence) extend M17's existing screens and child owners below.

Exchange supports macOS and Linux and preserves historical benchmark applications, results, and reviews. Remote orchestration, hardware provisioning, and native Windows support are outside initial scope. Transferring a ZIP does not provision or control the destination machine. **R015, R141**

## Package contracts

These contents describe required information. The serialization and archive layout are implementation decisions recorded under [Implementation](#implementation), not product requirements.

| Package | Required contents |
|---|---|
| Template ZIP | A versioned manifest and the complete frozen definition: M01's version-aware logical specification view (shared context plus ordered primary task files, each once), starting files/fixtures, acceptance checks, setup/start/stop instructions, execution rules/protocol, and grading rubric. V2 one shot stores its sole `T1` prompt once with empty shared context; multi step has at least two ordered primary files. A singular global specification is required only by v1. Required runtime dependencies are declared; installed dependency directories and credentials are excluded. **R115** |
| Frozen baseline | V2 carries an explicit empty baseline or the admitted current-folder bytes and executable flags captured by [M16](16-custom-template-planning.md); legacy v1 retains its empty or pinned-commit repository baseline, including a valid zero-file repository. Import, export and reuse use only the frozen payload, never inspect or reread the original filesystem or recapture from HEAD/index. Source location is provenance only and may be unavailable. **R068, R115** |
| Result ZIP | The exact template plus the selected run's result records, configuration, machine label and hardware/OS details, harness versions, timestamps, task outcomes, measurements with coverage, original weights, judge metadata and grades, generated artifact snapshots, and supporting evidence. A file-integrity manifest covers the result payload. **R116** |

Export only the selected template/run and its required supporting contents. Raw credentials and unrelated machine files must never enter the package. Globally unique run UIDs, explicit result-to-trial bindings, frozen launch/rate/billing evidence, and append-only run invalidations accompany every selected-result export. Human run labels are display fields and never grouping keys. Source result identifiers and provenance survive import and every subsequent export; relaying a result through another machine must not replace its origin with that machine. [M02](02-retained-results-comparability.md) supplies retained records and these provenance semantics. **R116**

## Operations and identity boundary

**Export template.** Select an exact library revision and package its complete definition and manifest. **Export results.** Select a retained run and package its required records, evidence, and the exact template they reference. These operations preserve existing templates, results, reviews, and historical applications. **R015, R036, R115, R116**

**Import template.** Validate the package, recompute identity from its extracted definition, and register only after the digest matches its manifest. **Import results.** Select a local template revision, validate the embedded definition and payload, and add compatible results atomically. Names, filenames, or a declared hash alone never establish compatibility. **R036, R120, R142**

[M01](01-template-library-identity.md) owns the versioned deterministic canonical manifest and SHA-256 computation, including normalized relative paths and content digests. M17 must use that same identity contract for exports and imports. Identical definitions retain their digest across macOS/Linux and ZIP repackaging, regardless of compression, entry order, timestamps, local absolute paths, machine identity, or display-only naming. Changing benchmark-defining content changes identity; selecting different harnesses or machines does not. **R118, R119, R141**

## Validation order and atomic registration

1. **Establish a safe package boundary.** Inspect archive paths and reject escaping paths and links. Enforce bounded extraction before accepting contents, keeping unvalidated material outside registered library state. Corrupt archives, missing required contents, and unsupported formats fail with actionable explanations. **R117, R142**
2. **Validate the definition.** Require the exact canonical `metadata.json` and manifest bytes, validate M01 reference closure and baseline executable flags, then recompute its canonical digest from extracted content. ZIP permissions cannot supply or change executable intent. For a template ZIP, require equality with the manifest's declared identity before registration. **R115, R120**
3. **Validate result compatibility.** For a result ZIP, independently recompute the embedded template and selected local template. Require the embedded recomputation, package-declared template hash, and local recomputation to agree. Verify result-payload digests, result-to-template references, and task identifiers against the validated template. **R116, R120**
4. **Resolve existing identities.** An already registered identical template or result snapshot is an idempotent success with no duplicate. Preserve distinct RunUids even when labels/configuration IDs match. Validate the complete immutable run binding, each TrialRef/result slot, and invalidation identity before merging any subset. Reject any conflicting binding, snapshot or invalidation; never overwrite or force-rebind the original. **R122, R142**
5. **Register the accepted collection.** Prepare all template/run/result registrations invisibly and publish one shared durable transaction marker only after every participant is ready. Every cross-store query/action captures one PublicationView, so only the prior or entire accepted collection is available. Any validation failure leaves library registration and existing results unchanged, with no partial additions. **R117, R142**

Throughout import, contents are data. Do not execute packaged scripts, install dependencies, invoke a model, or modify an existing result. Executing an imported benchmark or rejudging an artifact requires a separate explicit action. [M05](05-harness-execution-isolation.md) owns execution and [M12](12-quality-judging.md) owns judging; neither is implicitly triggered by exchange. **R117**

**Statistics payload closure.** M17.1 and M17.2 transport M02 canonical `M10Statistic`/`GenerationAggregate`/`ArtifactStats` values, exact request pairs/N/D/rosters, final delivered manifests/inventories, source clocks/receipts, retained policy bytes/digests and full eight-factor originals/directions/policies. Current-format structured fields map through M02's codec; declared evidence travels through pinned allowlisted file openers. Existing archive bytes and canonical identity/digest semantics remain intact; absent historical metrics stay unrecorded with no backfill or model/workspace reconstruction. M17.3 shows content coverage without asserting ranking eligibility. Round-trip independent file/LOC/cached/reasoning availability, partial timing, pooled and mean values; reject missing/escaping/cross-scope/digest-invalid references atomically and preserve complete frozen trial counts in subset packages. **R174–R176**

## Failure and comparison invariants

For a template mismatch, reject adding results to the selected benchmark and show the expected and received template identities. Offer the user the separate action of importing the embedded template as another library revision and associating results with that matching revision, subject to the same validation. Never force-merge different templates or overwrite a local template to manufacture compatibility. **R121**

Diagnostics identify the failed requirement and a useful next action: obtain a complete or uncorrupted export, use a supported package format, or select/import the matching revision. Rejection is atomic even when an earlier part of the package was valid. Data with different template hashes cannot enter one comparison or ranking; [M02](02-retained-results-comparability.md) enforces that retained-data boundary. **R117, R122, R142**

The engine performs every exchange operation and validation; [M15](15-terminal-interface.md) and [M14](14-command-line-interface.md) are clients of the `exchange.*` API that start these operations and present their outcomes. The source leaves exact format versions, manifest serialization, extraction limits, storage layout, and atomic-registration mechanism to implementation design; the choices under [Implementation](#implementation) are those design decisions and add no product requirement. **R036, R115, R117**

Human package acceptance extends M17.1–3 with finalized human-authored raw grades/comments/limitations/deficiencies and frozen self-declared reviewer/form-policy/group identity. Pending originals block full-run export even for a selected subset; pending additional human jobs leave original readiness intact. Preserve M02 receipt-bound dispositions while excluding drafts, working session/intent journals, credentials, loopback URLs and controller assets. Offline import/inspection creates no host, verified-person claim, model call or automatic browser reopen; malformed/foreign human fields reject through the M02 codec. **R189**

## Acceptance scenarios

- Export on macOS, repackage with different ZIP ordering/compression/timestamps, then import on Linux: identity is unchanged. A changed prompt, task order, check, baseline, protocol, or rubric changes it; different harnesses or machines do not. **R141**
- Export an existing-repository template and a selected run: the packages contain every required definition and result group, including the actual baseline, dependency declarations, and integrity manifest. The template excludes installed dependency directories; exports exclude credentials and unrelated files. **R115, R116**
- Import another machine's result ZIP: every required content group, source identifier, provenance, and payload digest is preserved. The result joins only the independently verified matching revision. **R116, R120, R142**
- Import scripts and dependency declarations: nothing executes or installs and no model is invoked. Corrupt, incomplete, unsupported, escaping-path, link, or extraction-bound violations leave no partial registration. **R117, R142**
- Present mismatched identities: show expected/received values, preserve the selected template, and allow a separately validated embedded revision with its matching results. **R121**
- Reimport identical packages twice: no duplicates. Import a distinct run: retain it. Reuse its result identifier with conflicting content: reject without mutation. Different template hashes remain separate in comparisons. **R122, R142**

PackageSummary, ResultImportPreview, ExportPreview and archive closure preserve exact profile/rubric/version/digest, six category keys/order, business/comment semantics, frozen evidence-plan and coverage/modality/target bindings from M01/M02. Validate native source/build/matrix refs, DevOps plan/dry-run/simulation/applied distinctions, agent case/mode and verification-auxiliary receipts, and immutable supplied brief/reference versus candidate documents. Missing declared files or conflicting digests/scopes reject atomically; an explicitly recorded unavailable collector stays an unavailable fact, never generated evidence. Import does not inspect a live device/cloud/model/workspace, execute document code, refresh a rubric, regrade or create runtime proof. Existing legacy payloads remain byte-identical. **R184–R188**

## Implementation

This section applies [ARCHITECTURE.md](../../../ARCHITECTURE.md). Everything here is an implementation decision: package format, manifest serialization, extraction bounds, staging layout and the registration mechanism are chosen here so engineers can build them; the product contract above and [SPEC.md](../SPEC.md) are unchanged.

### Bounded implementation children

These are proposed deliverables, not implemented functionality. Complete each child's real integration gates before accepting M17; Bootstrap contracts with fixtures do not establish real-provider support.

| Child | Bounded outcome |
|---|---|
| [M17.1 — archive-contract](../../M17/01-archive-contract.md) | Safe bounded archive I/O, M01 v1/v2 dispatch and logical completeness, exact shared payloads and integrity/reference validation, including M02's commit evidence and context-selection codec/mapped sidecar inventory. |
| [M17.2 — exchange-transactions](../../M17/02-exchange-transactions.md) | Pinned export, staged import, shared publication, recovery and `exchange.*`, including frozen capture/commit evidence, selected analysis cutoffs and atomic sidecar registration without live-source access. |
| [M17.3 — exchange-screens](../../M17/03-exchange-screens.md) | All template/result import/export screens, mode/stage/baseline/legacy and scoped commit summary rows, shared ZIP widgets and injected entrypoint integration. |

### 1. Engine component

Package `axbenchmark.engine.exchange`. It owns no template or result records: it reads revisions through [M01](01-template-library-identity.md) and retained results through [M02](02-retained-results-comparability.md), and registers through their application interfaces. It never starts a process; `import-linter` forbids `engine.exchange` from importing `subprocess`, `asyncio.subprocess`, `engine.harness`, `engine.judging` and `engine.runs`, so R117 is enforced by the build, not only by review.

**Package format** (implementation decision, version `axbenchmark-package/1`):

```
manifest.json                         exchange integrity envelope; exporter writes first
template/manifest.json               exact M01 axbenchmark-manifest/1 bytes
template/metadata.json               exact defining axbenchmark-definition/1 or /2 bytes
template/<RelPath>                   every remaining M01-listed payload file
runs/<run_uid>/binding.yaml          result ZIP: complete immutable M02 RunBinding
runs/<run_uid>/retention.yaml        terminal retention and finalization evidence
runs/<run_uid>/invalidations/…       append-only invalidation records, including evidence
results/<result_id>/record.yaml      selected M02 sealed records with explicit TrialRef
results/<result_id>/config.yaml      frozen launch/configuration and original weights
results/<result_id>/rates.yaml       complete frozen rates and missing-rate observations
results/<result_id>/reviews/…        pinned committed reviews, costs and evidence
results/<result_id>/evidence/…       measurements, hardware, checks, logs and snapshots
results/<result_id>/evidence/context/analysis-selection.json  M02 per-capture selection descriptor
results/<result_id>/evidence/context/analyses/<analysis_id>/…  selected analysis/observer-account bytes
results/<result_id>/snapshots/…      generated artifact snapshots
```

M02 emits `analysis-selection.json` as canonical JSON using schema `axbenchmark-context-analysis-selection/1`, with `result_id` and `selections` sorted by `capture_id`: each entry is `{capture_id, source_digest, analysis: null | {analysis_id, through_entry_id, ledger_digest, status, files}}`. Each file row contains relative path, SHA-256 and size. The frozen `context_capture/1` capability requires this descriptor and exactly one entry for every retained capture, including `analysis: null` for native-only evidence; genuine pre-protocol packages may omit it and retain unchanged legacy bytes/digests and native/unavailable semantics.

Only explicitly selected analysis/observer-account files supplied by M02's pinned openers may cross the outside-result exclusion, mapped beneath the matching `results/<result_id>/evidence/context/analyses/<analysis_id>/` directory. References close over the exact selected cutoff; missing, extra or escaping references fail. The descriptor and all selected bytes enter the exact manifest inventory and M02 `payload_digest`, never `facts_digest`; never rewrite sealed `record.yaml` or source facts. Later analysis entries cannot enter a pinned export, and pending/partial/no-analysis selections do not delay export readiness.

M02 `read_incoming(staged_result_dir, staged_run_dir)` consumes the descriptor beneath the staged result and validates result/trial/capture identity, source links, cutoff and digests. Its transaction registers selected sidecars at local `analyses/context/<result_id>/<analysis_id>/` under the same publication marker as the result; it does not install mutable analysis inside execution evidence. A different selected snapshot for the same ResultId follows the existing conflict policy, never implicit merging. Reading, exporting and importing invoke no model and never resume observer jobs automatically.

M01 owns **all** definition serialization, descriptor references/roles and template hashes. Preserve `metadata.json` and `template/manifest.json` exactly, reject noncanonical bytes/unknown fields/reference gaps through `TemplateIdentity.compute(payload)` and `parse_definition(payload)`, and compare the computed manifest bytes and digest. Never create an exchange-specific definition or hash authoring YAML. `baseline.files[].executable` is hashed defining metadata; ZIP mode bits can identify unsafe file kinds but cannot grant executable intent. Staging files stay 0600 and registered files/directories 0444/0555; later M05/M08 copies restore semantic 0644/0755 modes. **F01, F10**

Dispatch the embedded descriptor strictly through M01's `DefinitionCodec.read` for v1 or v2; `axbenchmark-package/1` and `axbenchmark-manifest/1` remain unchanged. Preserve all v1 bytes and golden hashes, reject unknown versions, and never auto-upgrade or relabel an approved definition. Use M01's derived `SpecificationView`: v2 `shared_specifications: []` is valid, one shot requires it and exactly `T1`, and multi step preserves at least two unique ordered primary files. V1 remains visibly legacy multi step even with one task. Validate v2 empty/folder versus v1 empty/repository baseline rules through M01, without consulting a source path.

For new-policy definitions, M01's canonical closure includes the frozen `required_per_task` policy/version and common instruction in `execution_protocol`, executable check source/version and deliverable-scope rules/references; exchange neither rewrites prompts nor adds a metadata field. Result packages retain M02's scoped immutable Git commit/tree/history and check evidence, bound to `ResultId`, `TrialRef`, task and `InvocationId`: start/end HEAD with absent/unborn states, new commits, prior tips/ancestry, setup-versus-competitor origin, snapshots/digests, scoped dirty/untracked paths and exclusion reasons, policy/check version/digest, classification and actual failure/unverified causes. These facts and sufficient referenced evidence survive source/workspace removal; Git IDs never replace template identity. M02 owns their schema, payload digest and reference validation, with no archive-owned Git codec. Do not package or materialize live `.git` directories/pointers, hooks, configuration, remotes or alternates; carry only M02's bounded immutable evidence as inert data. Import never runs Git, checks, commands or models. Genuine legacy absent evidence remains `not_recorded`; do not fabricate verification, retrofit checks, regrade outcomes or rehash legacy definitions into a new identity.

`manifest.json` is UTF-8 JSON with required `format`, `kind` (`template` | `result`), `exported_by` (machine id/label, app version), `exported_at`, `template` (`sha256`, display name/label), `dependencies` (display copy only), `integrity_digest`, and `files: [{path, sha256, size}]` covering every regular file except this envelope. Result packages additionally require `run: {run_uid, run_label, binding_digest}`, an explicit nonempty `selected_result_ids`, and `results: [{result_id, source_result_id, trial: {run_uid, configuration_id, trial_index}, template_sha256, payload_digest, origin, relays}]`, plus `inspection_only` and an `invalidation` summary (explicit null when absent). Origins/relays use M02 MachineIdentity fields; the invalidation summary uses RunInvalidation fields. Template packages prohibit these result-only fields. One package holds one run and one template; no run is selected by label. Envelope origin/relay/invalidation summaries are untrusted preview data and must equal the subsequently parsed M02 records; no capability indicates full validation until inspection completes. All record contents remain M02's serialization, including its snapshot `payload_digest`; this is distinct from the envelope `integrity_digest`. **F02, F06**

The envelope rejects duplicate/unknown keys, non-finite numbers, invalid UTF-8, noninteger/negative sizes and malformed IDs/digests. Canonical JSON uses sorted keys, compact separators, UTF-8 without ASCII escaping, and one LF. File rows sort by UTF-8 path bytes; result rows and selected IDs sort by ResultId. `integrity_digest` is a required lowercase SHA-256 and hashes these canonical bytes with only `integrity_digest` omitted. The file inventory must match extracted regular files exactly; optional directory entries may only be ancestors of inventoried files. Display/export fields do not affect **template** identity. Every result's frozen trial count and complete run binding survive subset export; missing trials remain missing, never renumbered or presented as a complete group. Freeze all prices, billing kinds/sources, rate sources/dates, `per_usd` (currency units per USD), missing-rate states, finalization receipts, original-review dispositions and invalidation overlays; do not consult current catalogs or working measurement stores. **F03, F09, R116**

The writer uses path order after the envelope, fixed ZIP timestamp 1980-01-01, regular-file mode 0644 and deflate. Given the same pinned payload **and the same envelope metadata**, it produces deterministic payload bytes and entry metadata; byte-for-byte compressed output is only promised with the same writer/compressor version. A later export may have a new `exported_at` or relay, so whole-archive equality is not an identity rule. Import ignores ZIP order/timestamps/compression and permission bits for identity. **R115, R116, R141**

Result record closure includes M02's immutable variant descriptors/manifests, ordered lineage/adapters, creator/date/source claims, requested/resolved/effective evidence, control snapshots, annotations and mandatory exclusions. External model-artifact file descriptions are typed metadata, not ZIP payload requirements or permission to package/download model weights. Only retained safe evidence sidecars supplied by ExportBundle are inventoried. Pin annotation/exclusion revisions in the bundle's existing guard; original approved/archive bytes and digest boundaries remain unchanged. Import uses M02 codecs and the single shared SQLite publication, preserving proof tiers offline without changing live catalog overrides. **R190**

**Domain** (`engine/exchange/domain/`, frozen slotted dataclasses, no I/O):

| Type or rule | Contents |
|---|---|
| `PackageKind` | `TEMPLATE`, `RESULT`. |
| `PackageFormat` | `SUPPORTED = ("axbenchmark-package/1",)`; `parse_manifest(bytes) -> PackageManifest` raises `UnsupportedFormat(found, supported)` or `ManifestInvalid(field)`. |
| `ArchiveEntry` | Raw central-directory row: `name: str`, `kind: file \| dir \| symlink \| hardlink \| special`, `size`, `compressed_size`, `encrypted`, `method`. |
| `ExtractionBounds` | `max_entries`, `max_manifest_bytes`, `max_entry_bytes`, `max_total_bytes`, `max_ratio`. Defaults, set in engine settings and overridable there: 50 000 entries, 16 MiB envelope, 1 GiB per entry, 4 GiB total, compression ratio 200. The values are implementation choices, not product limits. **R117** |
| `check_boundary(entries, bounds) -> BoundaryReport` | Pure. Each entry name must construct M01's `RelPath` (no absolute path, `..`, backslash, drive prefix, NUL); must be a regular file or directory (links and special files refused); no duplicate name, NFC/case-fold collision or file/directory-prefix collision; directory trailing slashes are removed only for boundary checks; non-NFC file paths are rejected, never silently renamed; no encryption; method stored or deflate; sizes and ratio within `bounds`. The report lists every violating entry with a `BoundaryProblem` (`escapes`, `absolute`, `link`, `special_file`, `duplicate`, `encrypted`, `method`, `over_bound`). Nothing is extracted unless the report is clean. **R117, R142** |
| `CompletenessReport` | Rows `(requirement, status: present \| missing \| unexpected, detail)` for manifest, M01's version-aware logical specification view, ordered primary files, checks, setup/start/stop, protocol, rubric, baseline and dependency declaration. Empty v2 shared context is valid, not a missing global specification; do not duplicate the one-shot prompt. Built by `check_listing(canonical_listing, extracted)` (every listed path extracted with its size; nothing extracted under `template/` that the listing omits) plus M01's canonical descriptor, semantic baseline and reference-closure checks, including declared mandatory policy/check/scope files; validate the complete envelope inventory, not only `template/`. **R115** |
| `IdentityAgreement` | `embedded_computed`, `declared`, `local_computed: Sha256 \| None`, `differing_paths`. `template_ok()` is `embedded_computed == declared`; `matches_selected()` additionally requires `local_computed == embedded_computed`. A declared hash, name or filename is never compared on its own. **R120, R121** |
| `check_references(batch, template) -> list[ReferenceProblem]` | M02 parses/validates each selected sealed snapshot and its complete run binding/terminal evidence, including declared commit/history/check evidence and task/invocation references. IDs equal `selected_result_ids`, every result/trial/evidence/review scope agrees with RunUid, configuration and frozen trial bounds, every task exists in M01, and every file hash/size and M02 snapshot digest recomputes. Invalidation matches the original approved identity and is never cleared. Duplicate human labels do not affect grouping. **F02, F03, F06, F09, R116, R120** |
| `ValidationRun` | The five ordered steps `BOUNDARY`, `DEFINITION`, `COMPATIBILITY`, `IDENTITIES`, `REGISTER` with state `pending \| running \| done \| failed \| skipped`. `advance(step)` refuses any step whose predecessors are not `done` or `skipped`; `REGISTER` is reachable only when boundary, definition and identities are done and compatibility is done (or skipped only for a template ZIP). A selected-template mismatch ends that attempt; an explicit embedded target starts a new compatibility/identities attempt over the same verified staging. A failure ends the run. This is the single place the order is enforced. **R117, R142** |
| `incoming_provenance(record, exported_by, package_name, integrity_digest, imported_at)` | Marks the record `IMPORTED` with `ImportOrigin`, and appends `exported_by` as a relay through M02's `Provenance.with_relay` when it differs from the record's origin and last relay. `origin` and `source_result_id` are never changed. **R116** |
| `ImportEffects` | Facts attached to every outcome and rejection: `extracted_files: int`, `registered: bool`, `executed: Literal[False]`, `staging_removed: bool`. Screens print these instead of asserting them. **R117** |
| `EXCLUSIONS` | Fixed descriptive list returned as data by the export previews: credentials and secrets, installed dependency directories, files outside the revision or result directories except the explicitly selected M02-pinned context sidecar mapping above, local absolute paths. All other outside-result files remain excluded. **R115, R116** |
| Domain errors | `UnsafePackage(report)`, `CorruptArchive(detail)`, `UnsupportedFormat`, `WrongPackageKind(expected, found)`, `IncompletePackage(report)`, `UnexpectedEntries(paths)`, `TemplateDigestMismatch(declared, computed, differing_paths)`, `PayloadDigestMismatch(paths)`, `ReferenceMismatch(problems)`, `SelectedTemplateMismatch(agreement)`, `StagingExpired(id)`, `RunBindingConflict`, `TrialBindingConflict`, `InvalidationConflict`, `ScopeMismatch`, `RetentionPending`, `SnapshotChanged`, `VariantDescriptorConflict`, `VariantAnnotationConflict`. The latter M02 errors map to `exchange.variant_descriptor_conflict`/`exchange.variant_annotation_conflict` with subject/ref IDs, both digests and differing paths. **R190** |

**Ports** (`engine/exchange/ports.py`):

```python
class ArchiveReader(Protocol):
    async def index(self, path: Path) -> ArchiveIndex: ...             # central directory only; CorruptArchive
    def read(self, path: Path, name: str, limit: int) -> AsyncIterator[bytes]: ...
    # streams one entry; raises OverBound as soon as more than `limit` bytes inflate (sizes in the index are not trusted)

class ArchiveWriter(Protocol):
    async def write(self, dest_tmp: Path, entries: AsyncIterator[PackEntry]) -> int: ...  # returns size

class StagingArea(Protocol):                                           # ~/.axbenchmark/exchange/staging
    async def create(self) -> StagingHandle: ...                       # id, expires_at
    async def write(self, h: StagingHandle, path: RelPath, data: AsyncIterator[bytes]) -> FileDigest: ...
    async def files(self, h: StagingHandle) -> Sequence[FileDigest]: ...
    async def open(self, staging_id: StagingId) -> StagedImport: ...   # StagingExpired
    async def save_verdict(self, h: StagingHandle, verdict: StagedVerdict) -> None: ...
    async def discard(self, staging_id: StagingId) -> None: ...
    async def sweep(self, now: datetime) -> int: ...

class OutputTarget(Protocol):
    async def prepare(self, path: Path) -> Path: ...    # OutputExists, OutputUnwritable; returns temp path beside it
    async def commit(self, tmp: Path, path: Path) -> None: ...         # durable no-clobber publication; OutputExists if destination appeared
    async def abandon(self, tmp: Path) -> None: ...

class RegistrationJournal(Protocol):                                   # ~/.axbenchmark/exchange/journal
    async def begin(self, entry: JournalEntry) -> None: ...  # durable tx + full immutable intent before first prepare
    async def record(self, tx: TransactionId, participant: str, registration: RegistrationReceipt) -> None: ...
    async def checkpoint(self, tx: TransactionId, phase: JournalPhase, outbox: Sequence[LogicalEvent]) -> None: ...
    async def complete(self, tx: TransactionId) -> None: ...  # only after reservations, staging and outbox settle
    async def pending(self) -> Sequence[JournalEntry]: ...

# Shared Bootstrap protocol consumed here; daemon owns wiring and the durable marker store.
class PublicationTransactions(Protocol):
    async def capture(self) -> PublicationView: ...   # fixed published-marker view; explicit lifetime
    def write_lock(self) -> AsyncContextManager[None]: ...
    async def publish(self, tx: TransactionId) -> PublicationView: ...  # durable idempotent sole visibility point
    async def is_published(self, tx: TransactionId) -> bool: ...
```

Plus `PublicationView`, transaction/token types, `Clock`, `IdGenerator`, `EventPublisher` from `engine/shared`, `JobRunner` from [M11](11-run-orchestration.md), and the other modules' application interfaces in part 3: `TemplateIdentity`, `RevisionRegistry`, `RevisionReader`, `TemplateDirectory` (M01), `ImportRegistrar`, `RetainedResultReader` (M02), `MachineIdentitySource` (M03).

**Application** (`engine/exchange/application/`, one class per use case):

| Use case | Kind | Behavior |
|---|---|---|
| `InspectPackage` | query | Reads the central directory and `manifest.json` only (bounded by `max_manifest_bytes`), extracts nothing, and returns kind, format support, declared template, content groups, per-result provenance and `importable_as`. A corrupt or unsupported file is returned as `problem`, not raised, so a file picker can label it. |
| `PreviewTemplateExport` | query | `TemplateDirectory.describe` and the revision's manifest roles → included groups with counts, `EXCLUSIONS`, a default file name `<name>-<label>-<sha8>.zip` in the user's working directory, `can_export` (false with `templates.identity_mismatch` when M01's last check failed). |
| `PlanResultExport` | query | `PlanResultExport(run_uid, result_ids=None)` uses `RetainedResultReader.run(run_uid, view)` from one captured view and returns terminal readiness, original/effective status, invalidation and frozen `selected_result_ids`; omitted subset means every retained result in that run, with all unavailable rows reported and the plan disabled if any selected row is unavailable. Explicit subsets must be nonempty and belong to that run. Default name `<run_label>-<uid8>-results.zip`; the caller submits exactly the engine-produced selection. |
| `ExportTemplate` | job | Capture a publication view and hold `RevisionReader.open(sha, view)` lease; prepare output, write exact canonical files and envelope, revalidate leased source integrity, then publish output. Release view/lease in every outcome; no unchecked raw paths. **R115** |
| `ExportResults` | job | Require nonempty explicit IDs; capture one view, call `export_bundle(run_uid, rids, view)` and `RevisionReader.open(bundle.template_sha256, view)`. Bundle pins finalized facts, selected result/review/invalidation versions and file openers through output completion. Validate all IDs belong to that run and preserve full binding/terminal evidence. Under the bundle's final publication guard, recheck run-binding digest, terminal retention revision/readiness, selected sealed fact versions/digests and run-invalidation revision before committing output; on change discard output and repin with the overlay or return `exchange.snapshot_changed`. Invalidated inspection exports remain non-comparable and still require the approved template bytes. A changed local revision fails identity; restore verified approved bytes and retry, never export the mutated revision or rebind results. **F03, F09, R066, R116** |
| `ImportTemplate` | job | Boundary, private staging, exact M01 completeness/identity, then shared transaction preparation/publication below using `RevisionRegistry.prepare_staged`. Identical templates are idempotent but still use token/reservation semantics. Discard staging only after resolution; never execute files. **R117, R120, R122** |
| `InspectResults` | job | Boundary and stage the whole inventory; M01 canonical completeness/identity; check selected revision independently; M02 `read_incoming(staged_result_dir, staged_run_dir)` parses each result and the shared run files, and `check_references` validates the complete batch. A valid selected-template mismatch ends this attempt at compatibility with no registration; otherwise `ImportRegistrar.classify(batch, view)` returns dispositions. Persist immutable staged bytes, their digest and verdict `ready`, `template_mismatch` or `conflict`; previews reserve/publish nothing. Errors discard nontransaction staging; actionable verdicts retain it until expiry. **R120, R121, R122** |
| `RegisterResults` | command | Reopen/revalidate frozen staging and its digests. `target=selected` requires ready compatibility; `target=embedded_revision` requires a valid mismatch verdict and recomputes compatibility for the embedded identity. Under one shared write lock reclassify run, trial, result and invalidation collisions; prepare the matching revision and M02 batch, then publish the single marker. Existing selected revisions receive a protective reservation too. Any conflict rejects the whole transaction. **R121, R142** |
| `RecoverRegistrations` | startup | Before admitting readers, resolve all journal entries by the durable marker: unpublished rolls back exact owned creations/reservations, published rolls forward cleanup/event delivery. Never withdraw a published revision. Only sweep expired unreserved inspection staging after recovery. |

**Publication and recovery protocol.** Follow [the shared visibility boundary](../../../ARCHITECTURE.md#atomic-publication-across-repositories). Persist `JournalEntry(transaction_id, import_id, staging_id, immutable intent/digests, phase, registrations, outbox)` before participant writes. Each receipt records exact revision, run-binding, trial/result and invalidation registration tokens with `created: true | false`, participant and owner transaction. The staging lease outlives preview expiry while a transaction needs it. **F14**

Under `PublicationTransactions.write_lock()`, capture one view and reclassify, call M01 `prepare_staged(tx, staged, origin)`, M02 `prepare(tx, batch)` for results, and durably journal both receipts. Same-tx/same-intent `prepare` must return the **original** tokens and created flags, never reinterpret its own prepared creation as pre-existing; a different intent fails. If a crash occurs after prepare persisted but before its receipt was journaled, startup repeats that same prepare from durable intent to recover the exact receipt before any rollback. Once receipts are recorded, recovery uses them directly; it must not reprepare rolled-back entries. Then call each participant's `commit_view(tx)` (durable readiness only), persist the prepared journal/outbox, and call `publish(tx)` once. No repository has an independent commit point and no success/change event precedes the marker.

A captured `PublicationView` controls all M01/M02 reads within a query or action, including list, guessed-ID lookup, launch, export and delete. Pre-existing reservations stay visible but protect their records from destructive changes until resolution. Newly prepared entries remain inaccessible even by guessed IDs. After publication, a disconnected client or cancellation cannot undo the collection; cleanup errors are recoverable committed work, never an import rejection claiming no additions. M01/M02 change events and `exchange.import.completed` come from durable idempotent outbox IDs after publication; replay may redeliver an envelope but cannot apply a logical change twice.

For an unpublished transaction, call participant `rollback(tx, token)` only for its exact receipt tokens: delete only `created=True` records; `created=False` releases reservations without deletion. Rollback is idempotent and never touches another transaction. A failed rollback keeps data hidden and blocks startup readiness with `exchange.recovery_required`. For a published transaction, finish participant housekeeping, release reservations, deliver the outbox, discard staging and complete the journal. Retrying a published import reclassifies identical data as skipped, preserving UID, source IDs, provenance and first invalidation. Cancellation before publication follows rollback; inspection cancellation only discards its staging. No imported setup/check/script/dependency is executed at any stage.

**Adapters** (`engine/exchange/adapters/`):

| Adapter | Implements |
|---|---|
| `zip_reader.py` | `ArchiveReader` on stdlib `zipfile`, run through `asyncio.to_thread`. `index` maps `ZipInfo` (`external_attr >> 16` for `S_IFLNK` and other non-regular types, flag bit 0 for encryption). One reader session retains the indexed archive file handle through its last read and closes it on every outcome; it never reopens a replaceable path between index and extraction. `read` checks local-header/central-directory agreement, counts actual compressed/inflated bytes against per-entry, running total and ratio budgets, and stops at the first violation; `extractall` is never used. `BadZipFile`, CRC errors and truncated archives become `CorruptArchive`. |
| `zip_writer.py` | `ArchiveWriter`: `ZipFile(mode="x")`, deterministic `ZipInfo` as described above, Zip64 allowed within the same bounds; consumes only lease-backed allowlisted file openers. Validate the completed archive against the configured reader/envelope bounds before output publication; `exchange.package_over_bound` identifies a limit requiring adjustment, so an exporter cannot silently produce an archive rejected by its own settings. |
| `fs_staging.py` | `StagingArea` under `~/.axbenchmark/exchange/staging/<staging_id>/` (dir 0700, files 0600, never executable), `os.open` with `O_CREAT \| O_EXCL \| O_NOFOLLOW`, resolved path checked to stay under the staging root; `verdict.json` beside `package/`. Inspection expiry is one hour after creation; transaction-held staging is never swept. Staged bytes are immutable after verdict and rehashed before prepare; retain the source archive handle through reads to prevent path replacement. |
| `fs_output.py` | `OutputTarget`: refuses an existing file, writes `<path>.axb-<id>.tmp` in the same directory, fsyncs bytes and directory, then atomically publishes with no-clobber semantics on macOS/Linux; a destination appearing after preview produces `OutputExists` without overwriting it. |
| `fs_journal.py` | `RegistrationJournal`: one JSON file per transaction, temp + fsync + rename and directory fsync; records exact receipts, recovery checkpoints and logical outbox IDs. Marker persistence belongs to shared `PublicationTransactions`, not this file. |
| `rpc.py` | Maps `axbenchmark.api.exchange` DTOs to use-case inputs and domain results and errors to the codes in part 2; maps M01's `IdentityMismatch` to `templates.identity_mismatch`, descriptor/canonical/reference errors to `exchange.invalid_definition`, and malformed envelope fields to `exchange.invalid_manifest` and M02's collision types to `exchange.result_id_conflict`, `exchange.run_binding_conflict`, `exchange.trial_binding_conflict`, `exchange.invalidation_conflict`; scope/retention failures remain typed. Registers the `exchange` event topic. |

**Persisted state** (engine-owned; no interface reads it):

```
~/.axbenchmark/exchange/
  staging/<staging_id>/package/       extracted, boundary-checked package contents
  staging/<staging_id>/verdict.json   StagedVerdict: package path, selected sha, agreement, dispositions
  journal/<transaction_id>.json       intent, exact receipts, phase, cleanup and outbox checkpoints
```

Registered templates live in M01's library and imported results in M02's store; nothing under `exchange/` is ever read as library or result state.

**Processes owned:** none. Hashing and ZIP I/O run in worker threads inside the engine.

M17.1 validates the required context_capture/1 envelope and per-result `axbenchmark-context-analysis-selection/1` descriptor with one sorted entry for every capture, including native-only null. Validate confined selected analysis files, immutable source links and exact ledger cutoff/status/digest/observer-account closure through M02; all selected portable bytes enter payload_digest without changing source facts_digest. M17.2 acquires only pinned M02 openers, uses the same SQLite publication marker for imported structured analyses and never resumes observer jobs or merges conflicting snapshots. Decision profiles/capability/model/call/pack/group/commentary evidence travels credential-free; unknown future versions stay inspectable with unsupported re-execution. Round-trip two different analysis cutoffs plus native-only and delayed classification with network disabled. **R164, R166, R171**

**R191 concrete import/export authority.** M02 generates current portable records from normalized SQLite and validates them into private staged rows; immutable evidence bytes precede publication. The final M17 publisher uses one shared connection/transaction for rows/dependency revisions/receipts/outbox/marker. `commit_view` is readiness only and no staged live-table rows may leak to raw SQL. Analytic SQLite backup is not a package input; never attach/execute an imported schema. Existing ZIP paths and portable digests remain unchanged. Raw-reader crash tests and offline codec round trips include new plan/context/snapshot/annotation and all grading branches.

#### Integrated route/profile contracts (R192–R194)

Canonical package projections include full frozen six-cell matrix/expected roster, sanitized immutable access/model/effort/mapping/capability/profile/control/asset/treatment snapshots, request-route observations/shared source facts and selected M06 analysis links/cutoffs. Owner codecs validate exact ID/version/digest closure, separate competitor and JudgeGroup bindings, source/variant links and exact numerical semantics. Partial result export preserves full comparison roster and missing-member coverage. Personal source locators, raw shell, secret resolution/auth/session stores and executable activation are absent.

M17.2 uses existing M02 preparation and one shared SQLite publication; imports are inactive provenance and never inspect/register profiles, resolve credentials, start gateways or invoke inference. Immutable ID/version conflicts and cross-scope bindings are typed exchange failures with all-or-none visibility and normal rollback/recovery. ResultImport/Export/Package DTOs and M17.3 views show N/6, axis/classification, profile treatment and inactive status; reuse routes to explicit independent local registration/qualification. Test chained routes, multiple controls/assets without score fan-out, cancelled/conflicting import and offline re-export with zero endpoint calls.

**Portable harness-comparison evidence — R192–R193.**

Carry the M02-owned normalized profile/hop/model/effort/capability snapshots, full comparison matrix and selected observed-evidence/analysis cutoffs defined in [CROSS-HARNESS-COMPARISON.md](../../CROSS-HARNESS-COMPARISON.md). Validate scope/digest/reference closure through owner codecs and publish atomically with results; no active provider connection or credential is imported. Partial selected-result exports keep the complete declared roster and missing-member coverage. Re-export and offline report views preserve exact comparison axes, unknowns and unsupported cells without model calls or implied endpoint readiness.

### 2. API surface (`exchange.*`)

DTOs live in `axbenchmark.api.exchange`. Templates are addressed by full 64-character SHA-256; result operations require RunUid after M02 resolution of a human reference. A colliding label returns candidate UIDs/origins, never an arbitrary run. `ActionState = {enabled: bool, reason: str | None}` as in M01.

Shared models:

| Model | Fields |
|---|---|
| `StepDTO` | `step: boundary \| definition \| compatibility \| identities \| register`, `state: pending \| running \| done \| failed \| skipped`, `detail: str` (for example "recomputed 7d2e4a10 = declared"). |
| `ValidationProgress` | `steps: list[StepDTO]`, `files_hashed: int`, `files_total: int` — the `job.progress` payload of every import job. |
| `ImportEffectsDTO` | `extracted_files`, `registered` (true only after publication; preparations do not count), `executed` (always false), `staging_removed`. Present in every import outcome and in the `data` of every import error. |
| `IdentityAgreementDTO` | `expected_sha256` (selected, recomputed locally), `received_sha256` (embedded, recomputed), `declared_sha256`, `declared_matches_received: bool`, `differing_paths: list[str]`, `expected_label`, `received_name`. |
| `ImportOutcome` | `kind: template \| results`, `transaction_id`, `run_uid?`, `selected_result_ids`, `inspection_only`, `invalidation?`, `template_sha256`, `template_name`, `template_label`, `template_created: bool`, `target: selected \| embedded_revision \| none`, `added: list[result_id]`, `skipped_identical: list[result_id]`, `steps`, `effects`. |
| `ExportOutcome` | `path`, `size`, `kind`, `template_sha256`, `run_uid?`, `selected_result_ids`, `inspection_only`, `invalidation?`, `excluded: list[str]`. |

**Queries** (safety `read`):

| Method | Request | Response | Errors |
|---|---|---|---|
| `exchange.inspect_package` | `path` | `PackageSummary{path, file_name, kind: template \| result \| unknown, format, format_supported, inspection_only, invalidation, verification: declared_only, template: {name, label, declared_sha256} \| None, contents: [ContentGroupDTO{label, detail, children}], results: [PackageResultDTO{source_result_id, run_uid, run_label, trial, result_count, origin{id, label}, relays: [{id, label}], exported_by}], excluded: [str], problem: ErrorInfo \| None, can_import_template: ActionState, can_import_results: ActionState}` | `exchange.file_not_found{field: path}` |
| `exchange.template_export_preview` | `sha256` | `TemplateExportPreview{sha256, name, label, default_path, included: [ContentLine{group, count, detail}], dependencies: [str], excluded: [str], can_export: ActionState}` | `templates.not_found` |
| `exchange.plan_result_export` | `run_uid: RunUid`, `result_ids: list[ResultId] \| None = None` | `ResultExportPlan{run_uid, run_label, selected_result_ids, binding_digest, retention_state, wait_reason?, human_pending_count?, invalidation, template: {name, label, sha256}, default_path, results: [ExportableResultDTO{result_id, trial, original_status, effective_status, machine, can_export}], included: [ContentLine], excluded: [str], can_export: ActionState}` | `results.unknown_run`, `exchange.scope_mismatch`, `exchange.nothing_selected` |

**Commands**:

| Method | Request | Response | Errors | Safety |
|---|---|---|---|---|
| `exchange.import_results` | `staging_id`, `target: selected \| embedded_revision = selected` | `ImportOutcome` | `exchange.staging_expired`, `exchange.template_mismatch` (target `selected` on a mismatch verdict), `exchange.not_applicable{target}` (target `embedded_revision` without a mismatch verdict), `exchange.result_id_conflict`, `exchange.run_binding_conflict`, `exchange.trial_binding_conflict`, `exchange.invalidation_conflict`, `exchange.registration_failed`, `exchange.recovery_required` | `write` |

**Jobs** (return `JobRef`; progress `ValidationProgress` unless stated; cancel through `jobs.cancel`; pre-publication cancellation rolls back, post-publication cancellation reports the committed outcome and completes cleanup):

| Method | Request | Result | Errors | Safety |
|---|---|---|---|---|
| `exchange.import_template` | `path` | `ImportOutcome` (`kind=template`; `template_created=false` is the idempotent duplicate) | `exchange.file_not_found`, `exchange.corrupt_archive`, `exchange.invalid_manifest{field, reason}`, `exchange.invalid_definition{field, paths, reason}`, `exchange.unsupported_format{found, supported}`, `exchange.wrong_package_kind{expected, found}`, `exchange.unsafe_package{entries: [{path, problem, detail}]}`, `exchange.incomplete_package{requirements: [{requirement, status, detail}]}`, `exchange.unexpected_entries{paths}`, `exchange.digest_mismatch{declared_sha256, computed_sha256, differing_paths}`, `exchange.registration_failed` | `write` |
| `exchange.inspect_results` | `path`, `template_sha256` (selected local revision) | `ResultImportPreview{staging_id, expires_at, package_name, steps, verdict: ready \| template_mismatch \| conflict, selected: {name, label, sha256}, identities: IdentityAgreementDTO, rows: [PreviewRowDTO{source_result_id, run_uid, run_label, trial, origin, relays, inspection_only, invalidation, variant_projection: VariantResultProjectionV1, variant_conflicts, disposition: add \| identical \| conflict, existing_digest, incoming_digest, differing_paths}], conflicts: [{code, run_uid, trial?, result_id?, invalidation_id?, existing_digest, incoming_digest, differing_paths, variant_ref?, annotation_id?}], embedded_option: {embedded_sha256, already_registered, result_count, can_import_embedded: ActionState} \| None, can_add: ActionState}` | the template-import errors above for the embedded template, plus `templates.not_found`, `templates.identity_mismatch` (selected revision's files changed locally), `exchange.payload_digest_mismatch{paths}`, `exchange.reference_mismatch{problems: [{result_id, kind: template \| run_binding \| trial \| task_id \| file \| retention \| invalidation, detail}]}` | `read` (writes only engine-private staging) |
| `exchange.export_template` | `sha256`, `path` | `ExportOutcome` | `templates.not_found`, `templates.identity_mismatch`, `exchange.output_exists{field: path}`, `exchange.output_unwritable{field: path}`, `exchange.package_over_bound` | `write` |
| `exchange.export_results` | `run_uid`, `result_ids: nonempty list[ResultId]` (explicit selection), `path` | `ExportOutcome` | `results.unknown_run`, `exchange.nothing_selected{field: result_ids}`, `exchange.result_not_exportable{result_id, reason}`, `exchange.scope_mismatch`, `results.retention_pending`, `exchange.snapshot_changed`, `templates.identity_mismatch`, `exchange.output_exists`, `exchange.output_unwritable`, `exchange.package_over_bound` | `write` |

Application errors use numeric JSON-RPC `error.code=-32000` and namespaced `error.data.code`; both clients decode the shared `EngineError(code, message, field, remedy, data)`. Validation shape failures use protocol `-32602`; CLI/TUI never parse prose to infer a type. **F18**

Every import error carries `data.steps` (where validation stopped), `data.effects` and a `remedy` naming the next action from the contract above: obtain a complete or uncorrupted export, use a supported format, or select or import the matching revision. Interfaces print `message` and `remedy` verbatim. A template mismatch is a verdict, not a job error, because the user may continue with the embedded revision from the same staging; `exchange.template_mismatch` is raised only when a client asks to add mismatched results to the selected revision. **R117, R121**

Capability flags: `can_import_template` / `can_import_results` (reason `exchange.wrong_package_kind`, `exchange.unsupported_format` or `exchange.corrupt_archive`) on `PackageSummary`; `can_export` on both export previews and per result (reasons from M02, for example `results.not_sealed`, or `templates.identity_mismatch`); `can_add` (reason `exchange.template_mismatch` or the exact result/run/trial/invalidation conflict code) and `embedded_option.can_import_embedded` on `ResultImportPreview`. None of these consults [M03](03-environment-readiness.md): exchange stays available with no harness installed. **R029**

**Events** (topic `exchange`):

| Event | Payload | Emitted when |
|---|---|---|
| `exchange.package.exported` | `kind, path, template_sha256, run_uid?, selected_result_ids, inspection_only` | An export job commits its file. |
| `exchange.import.completed` | `transaction_id, kind, template_sha256, run_uid?, template_created, target, added, skipped_identical` | A shared marker is durable, or a retry is an idempotent no-op. M01/M02 events are released only from the post-publication outbox, never from prepare/commit_view. |
| `exchange.import.rejected` | `kind, package_name, code, step` | An import job or command ends with an error. |

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `TemplateIdentity.compute(payload: CanonicalPayload)`, `.parse_definition(payload)`, `.check(sha)` | M01 | Strict v1/v2 descriptor dispatch, derived logical specification view, exact manifest validation and independent embedded/local recomputation; no alternate definition argument or live-source read. |
| `RevisionRegistry.prepare_staged(tx, staged, origin)`, `.commit_view(tx)`, `.rollback(tx, token)` | M01 | Transaction participant returning `Registration(sha256, created, token, transaction_id)`; same-tx retry recovers the original receipt. No `register_staged`/`withdraw` shortcut. |
| `RevisionReader.open(sha, view) -> FrozenRevision`, `.close()` / async context | M01 | Verified lease-backed canonical files and semantic baseline flags; release after output completion/failure. |
| `TemplateDirectory.describe(sha, view)`, `RelPath` | M01 | Labels/visibility and portable path validation using the same captured view. |
| `ImportRegistrar.read_incoming(staged_result_dir, staged_run_dir) -> IncomingResult` | M02 | M02 parses both selected records and run binding/terminal/invalidation files, including scoped immutable commit/history/check evidence and legacy absence, into IncomingResult. M17 assembles equal shared run records into ValidatedResultBatch, never implementing a second M02 codec. |
| `ImportRegistrar.classify(batch, view)`, `.prepare(tx, batch)`, `.commit_view(tx)`, `.rollback(tx, token)` | M02 | All run/trial/result/invalidation collisions and exact `ResultRegistration` receipts; same-tx retry keeps original created flags. |
| `RetainedResultReader.resolve_run(reference, view)`, `.run(run_uid, view)`, `.export_bundle(run_uid, rids, view)` | M02 | UID resolution, finalized readiness and pinned selected snapshots with full frozen rate/billing/launch evidence. |
| `ExportBundle` handle: `snapshot_digest`, scoped file openers/digests, `publication_guard()` async context, `close()` / async context | M02 | Required handle contract: acquisition under one M02 read snapshot verifies readiness and pins run-binding digest, terminal retention revision, selected fact versions/digests, committed review versions and invalidation revision. `publication_guard()` reacquires the run mutation lock, compares binding/retention/fact/invalidation versions and readiness, and holds it through output commit; a changed required version raises `SnapshotChanged`. New reviews do not invalidate the already pinned review version. Invalidation/readiness writers use that same lock; a later invalidation is after the export linearization point. `close()` releases every lease on success/failure/cancellation; no direct repository access by M17. |
| `RunBinding`, `TrialRef`, `RunInvalidation`, `Provenance.with_relay` | M02/shared | Preserve grouping, first invalidation and source origin; never mutate a launch binding or merge a label collision. |
| `PublicationTransactions`/`PublicationView`, transaction tokens | Shared Bootstrap/daemon | Shared write lock, captured visibility, sole durable marker and startup reader admission barrier. |
| `MachineIdentitySource.current() -> MachineIdentity` | M03 | Exporter/relay identity only; never replace result origin. |
| `JobRunner`, `jobs.get`, `jobs.cancel`, `events.subscribe`, `job.progress`, `job.finished` | M11 | Jobs and typed cursor replay/snapshot; recovery finishes before readers enter. |
| Library/Template and Results entrypoints; `TemplateScreen(sha)` / `ResultsScreen(sha)` navigation factories | M01/M02 | Entry/return destinations only. Inject M17 exchange factories into these entrypoints; inject destination factories into M17 tests without requiring real Library/Results screens. |

PackageSummary exposes declared-only safe variant summaries until M02 validation supplies `VariantResultProjectionV1` in ResultImportPreview and export planning. Show FINETUNE+QUANT, creator-role/date-kind precision, requested/effective evidence and annotation/mismatch states; content checks do not certify authorship or loaded weights. ResultImportConflict renders descriptor/annotation conflict codes and both digests/paths, disabling Add. Existing exclusions survive an older clean import or As recorded selection; there is no auto-adoption/catalog-save, model-load or source-fetch action. **R190**

### 4. Screens

M17 owns **all** `ImportScreen`, `ExportScreen`, `ImportResultsScreen`, `ExportResultsScreen` and `ResultPackageScreen` implementations in `axbenchmark/tui/screens/exchange.py`, all their view models in `tui/viewmodels/exchange.py`, and the `zip_picker.py` / `validation_order.py` widgets. Its fourteen artboards are ExportTemplate, ImportTemplate, ImportVerifying, ImportRejected, ImportDuplicate, ImportUnsafe, ImportIncomplete, ResultPackagePick, ResultPackage, ResultImport, ResultImportConflict, ResultMismatch, ResultEmbedded and ExportResult. M01/M02 own only Library/Results navigation entrypoints; no exchange state or host fragment is implemented in their screen files.

Shared rules follow M15: workers through the injected client, `ContentSwitcher` states, `check_action` from `ActionState` only, engine `message` and `remedy` printed verbatim. No exchange screen validates paths, compares digests or decides a disposition; it renders `steps`, error `data`, `effects` and capability flags.

The design's `ResultBenchmarkMode` / `ImportedBaselineDetails` and commit rows extend these existing view models and `exchange.*` projections: verified template/export/staged-import summaries carry M01's `definition_format`, `benchmark_type`, `legacy`, `target_mode`, `baseline_kind` and ordered task/primary-file references; result rows carry M02's retained policy/check summary and scoped commit evidence/status with actual failure or unverified cause. Show setup separately from competitor commits, and `not_recorded` for genuine legacy absence. Render packaged capture provenance without a refresh/source lookup action. `InspectPackage` remains envelope-only and `declared_only`; unavailable mode/commit facts wait for validated staging, never get inferred from a name, task count or source path. No ZIP envelope field, client-side Git execution or verdict calculation is added.

**M17 widgets.** `ZipPicker` in `axbenchmark/tui/widgets/zip_picker.py` supplies the shared `Input #zip-path` / `DirectoryTree #zip-browser` composition for template/result pickers, with debounced `exchange.inspect_package` labels and explicit no-selection/empty/error states. Labels are declared package information, not integrity verdicts.

**Shared widget** `ValidationOrder` — `axbenchmark/tui/widgets/validation_order.py`, a `Vertical #validation-order` of five rows rendered from `list[StepDTO]` (glyph from `state`, text "n · Title · detail", "not for a template ZIP" when `skipped`, "not reached" when `pending` after a failure). Used in ImportScreen, ImportResultsScreen and the `#import-steps` states of both.

```python
@dataclass(frozen=True, slots=True)
class StepVM:
    number: int
    title: str
    state: Literal["pending", "running", "done", "failed", "skipped"]
    detail: str

@dataclass(frozen=True, slots=True)
class RejectionVM:                                   # ImportScreen #import-rejected
    title: str                                       # "Template not imported · unsafe package"
    steps: tuple[StepVM, ...]
    detail: Literal["unsafe", "incomplete", "digest", "other"]   # from error code, selects #rejection-detail
    rows: tuple[tuple[str, str, bool], ...]          # (entry or requirement, text, failed)
    effects: tuple[tuple[str, str], ...]             # Extracted / Library / Ran, from ImportEffectsDTO
    remedy: str
    diagnostics_text: str                            # what `c` copies

def build_steps_vm(steps: Sequence[StepDTO]) -> tuple[StepVM, ...]: ...
def build_rejection_vm(error: ErrorInfo) -> RejectionVM: ...
def build_package_vm(summary: PackageSummary) -> ResultPackageVM: ...
def build_mismatch_vm(preview: ResultImportPreview) -> MismatchVM: ...
def build_embedded_vm(outcome: ImportOutcome, preview: ResultImportPreview) -> EmbeddedVM: ...
```

All view models live in `axbenchmark/tui/viewmodels/exchange.py`. M17's `build_template_import_vm`, `build_template_export_vm`, `build_result_import_vm` and `build_result_export_vm` compose the shared builders above. M01/M02 consume only typed navigation arguments/outcomes; they implement none of these builders.

Expose injected `ExchangeScreens.import_template(selected_sha256?)`, `.export_template(sha256)`, `.import_results(template_sha256, path?)` and `.export_results(run_uid)` factories through M15's route registry. Library/Template and Results callers test exact SHA/UID arguments using fake factories before M17.3 exists; M17 tests return navigation with fake M01/M02 factories. Real destinations are a later integration gate, never a circular prerequisite.

**ImportScreen** — `ModalScreen[ImportOutcome | None]`, dialog `#import`; `ContentSwitcher #import-body`. M17 implements the [M01 presentation/entry contract](01-template-library-identity.md#4-screens) and the complete states below:

| State / artboard | Trigger, content and binding |
|---|---|
| `#import-pick` / ImportTemplate | Shared ZipPicker labels from `exchange.inspect_package(path)`; `enter` / `#import` calls `exchange.import_template(path)` for a template ZIP. A result ZIP routes to ResultPackageScreen with the selected revision/path; when no revision is selected, display the choose-revision action instead of guessing a target. |
| `#import-steps` / ImportVerifying | ValidationOrder and `#import-progress` from job events. Here `esc` / explicit Cancel calls `jobs.cancel(job_id)`; before publication it rolls back, after publication the committed outcome wins. Unmount alone only unsubscribes. |
| `#import-rejected` / ImportRejected, ImportUnsafe, ImportIncomplete | ValidationOrder and `#rejection-detail` below; stopped at boundary/definition as supplied, compatibility skipped only for template imports. |
| `#import-duplicate` / ImportDuplicate | `template_created=false`: show existing identity without additions; `o` opens TemplateScreen(outcome.template_sha256), `esc` closes. |
| registered | `template_created=true`: dismiss with outcome and open TemplateScreen(outcome.template_sha256) through the injected factory. |

| `#rejection-detail` child | Shown for error code | Content |
|---|---|---|
| `#unsafe-detail`: `DataTable #unsafe-entries`, `Static .kv` | `exchange.unsafe_package` | Columns Entry, Problem from `data.entries`; kv rows Extracted / Library / Ran from `data.effects`; `remedy` below. |
| `#incomplete-detail`: `DataTable #completeness`, `Static #next-action` | `exchange.incomplete_package`, `exchange.unexpected_entries` | Columns Required content, In `<file>` from `data.requirements` (✓ / ✗ from `status`), or unexpected-path rows from `data.paths`; `#next-action` is `remedy`, including the statement that no SHA-256 was computed when the error data has no `computed_sha256`. |
| `#digest-detail` | `exchange.digest_mismatch` | Full declared/computed digests and differing paths, labels stacked in compact mode; `#show-digests` toggles file digests already in the error data without an API call. |
| `#other-detail`: `Static` | any other `exchange.*` code | `message` and `remedy`. |

| Binding | Action | API call |
|---|---|---|
| `esc`, `Button #close` | `dismiss` | none; `dismiss(None)`, back to the Library. |
| `c`, "Copy report" (incomplete) | `copy` | none; `app.copy_to_clipboard(vm.diagnostics_text)`. |
| `tab` | focus between `#close` and the detail table | none. |

The rejected state is entered from the `job.finished` event of `exchange.import_template` (or from `jobs.get(job_id)` after a reconnect); the screen keeps the `JobRef` it started and issues nothing else.

**ResultPackageScreen** — `axbenchmark/tui/screens/exchange.py`, `ModalScreen[bool]`, dialog `#result-package`, view model `ResultPackageVM`. Artboard ResultPackage. Pushed by ResultsScreen `i` as `ResultPackageScreen(template_sha256)`, or with `path` already chosen when ImportScreen's picker routes a result ZIP. Body `ContentSwitcher #result-package-body`:

| State | Content |
|---|---|
| `#package-pick` | Shown when no `path` was given: the `Input #zip-path` + `DirectoryTree #zip-browser` composition of ImportScreen's `#import-pick`, reused through `tui/widgets/zip_picker.py`. Drawn as the separate ResultPackagePick artboard. As in ImportScreen, highlighting a file in `#zip-browser` labels it from `exchange.inspect_package` (kind, template name and label, or `problem`); nothing is extracted. |
| `#package-contents-loading` | While `exchange.inspect_package` runs. |
| `#package-contents` | `Tree #package-tree` (height 9) from `contents`, `DataTable #provenance` (Result, Run label + UID, Trial, Origin, Relayed by, Source id) from `results`, `Static .kv` from `excluded`, and the line that inspecting reads the index and manifest only. |
| `#package-contents-error` | `problem` or the call's error, verbatim, with a Back action to `#package-pick`. |

| Binding | Action | API call |
|---|---|---|
| highlight in `#zip-browser` | `label` | `exchange.inspect_package(path)` for the highlighted file (debounced by ZipPicker); the result labels the row only. |
| mount with `path`; `enter` in `#package-pick` (on `#zip-path` or a highlighted file) | `inspect` | `exchange.inspect_package(path)` → `#package-contents`. |
| `enter`, `Button #import` "Validate and import" | `import` | `exchange.inspect_results(path, template_sha256)`; on the returned `JobRef`, `dismiss(True)` and the app pushes `ImportResultsScreen(job_ref, template_sha256)`. Dimmed unless `can_import_results.enabled`; the reason (for example a template ZIP chosen here) is shown in the footer hint. |
| `esc`, `Button #cancel` | `dismiss` | none; `dismiss(False)`. |
| `tab` | `focus_next` | none. |

**ImportResultsScreen** — M17's `ModalScreen[ImportOutcome | None]` in `tui/screens/exchange.py`, dialog `#import-results`, opened with the inspect JobRef and selected SHA. View model `build_result_import_vm(preview)` renders all preview dispositions, exact conflicts and capabilities. Its ContentSwitcher includes ResultImport, ResultImportConflict, ResultMismatch and ResultEmbedded; the artboard dialog ids remain state ids:

| State | Entered when | Content |
|---|---|---|
| `#import-steps` | job running | `ValidationOrder` from `job.progress`. |
| `#import-validated` / ResultImport | ready preview | Add and identical-skip rows, RunUid/origin/TrialRef, selection counts and `can_add`; no additions before publication. |
| `#import-conflict` / ResultImportConflict | any conflict | `#conflict-digests`, exact result/run/trial/invalidation code, both digests and differing paths; add disabled. |
| `#result-mismatch` | `job.finished` with `verdict == "template_mismatch"` | `ValidationOrder` (failed at step 3); `Static #identities`: Expected (full `expected_sha256`, label, "selected here · recomputed locally"), Received (full `received_sha256`, "embedded template, recomputed" and whether it equals the declared hash from `declared_matches_received`), Differs (`differing_paths`); labels stack above each 64-character digest in `.-compact`. `RadioSet #mismatch-choice` with two options: import the embedded template as its own revision and add `result_count` results; cancel. The first option is disabled from `embedded_option.can_import_embedded`. Body text states that the selected revision and its results stay unchanged. |
| `#result-embedded` | `exchange.import_results(…, target="embedded_revision")` returned | `ValidationOrder` from `ImportOutcome.steps` (all five done); `Static .kv` Library (new or existing revision, `template_created`, short SHA), Results (count, machine, judge group, template comparison scope, invalidation/inspection-only notice when present), selected revision unchanged with its result count; the line that importing ran neither the benchmark nor a judge. |

| Binding (state) | Action | API call |
|---|---|---|
| `ctrl+s`, `Button #add-results` (`#import-validated`) | `add` | `exchange.import_results(staging_id, target="selected")`; disabled unless `can_add`; success dismisses with the published ImportOutcome. |
| `Button #show-differences` (`#import-conflict`) | `expand` | none; expands differing paths already in the preview. |
| `esc`, `Button #close` (`#import-validated` / `#import-conflict`) | `dismiss` | none; dismiss(None), staging expires without additions. |
| `#mismatch-choice` change | — | none. |
| `Button #continue` (`#result-mismatch`) | `continue` | first option: `exchange.import_results(staging_id, target="embedded_revision")` → `#result-embedded`; errors render verbatim in the state. Second option: none, `dismiss(None)`. |
| `esc`, `Button #cancel` (`#result-mismatch`) | `dismiss` | none; staging expires in the engine. |
| `esc`, `Button #close` (`#result-embedded`) | `dismiss` | none; `dismiss(outcome)`. ResultsScreen refreshes from `results.import.registered`. |
| `o`, `Button #open-revision` (`#result-embedded`) | `open` | none; `dismiss(outcome)` and the app pushes `TemplateScreen(outcome.template_sha256)`. |

Subscriptions: `events.subscribe(["job:<job_id>"], after=cursor)` on mount for the inspect job, using `(epoch, seq)` and object revision guards; drop on unmount without cancellation. Reconnect uses the returned snapshot/replay/resync contract (or `jobs.get`) to restore state. `exchange.import.rejected` is not used by this screen; it serves the CLI and the future MCP client.

**ExportScreen** — M17's `ModalScreen[Path | None]` in `tui/screens/exchange.py`, artboard ExportTemplate, view model `build_template_export_vm(preview)`. Mount calls `exchange.template_export_preview(sha256)` and renders `#export-identity`, default `#export-path`, included/excluded `#export-contents` and engine `can_export`. `ctrl+s` / `#export-zip` calls `exchange.export_template(sha256, path)` once, follows its job, then shows/dismisses with the written path. Field errors mark the input; identity/other errors show message/remedy. Escape closes; leaving does not cancel the job.

**ExportResultsScreen** — M17's `ModalScreen[Path | None]` in `tui/screens/exchange.py`, artboard ExportResult, view model `build_result_export_vm(run, plan)`. Construction takes `run_uid`, never a displayed label. Mount loads `results.get_run(run_uid)` and `exchange.plan_result_export(run_uid, result_ids=None)` into `#export-selection`, default `#export-results-path`, and `#export-results-contents`/exclusions. Each row shows exact result/trial, original/effective status and engine capability; invalidation is inspection-only. `space` toggles the selected ID and requests `exchange.plan_result_export(run_uid, result_ids=selection)` so the engine validates the subset and returns `selected_result_ids`/`can_export`. `ctrl+s` / `#export-zip` submits `exchange.export_results(run_uid, plan.selected_result_ids, path)` only for the current enabled plan, follows the job and shows/dismisses with the path. An empty subset is a typed disabled/error state, never interpreted as all results. Path errors mark `#export-results-path`; escape closes without canceling ongoing work.

Both export screens have loading/empty/error/content states with Retry repeating only the failed load. Job subscriptions use M15's typed cursor manager and the same replay/resync rules as imports. ImportScreen choosing a result ZIP routes through the injected ResultsScreen(selected_sha) entrypoint and then M17 ResultPackageScreen(selected_sha, path), never `exchange.import_template`. Template/result registration events refresh Library/Results only after the shared marker commits.

### 5. CLI

| Command | API |
|---|---|
| `axbenchmark templates export TEMPLATE_SHA --output template.zip` | `exchange.export_template(sha256, path)` job; prints the written path. **R056** |
| `axbenchmark templates import template.zip` | `exchange.import_template(path)` job; prints the five steps as they finish, then the SHA-256 and "already present" when `template_created` is false. **R057** |
| `axbenchmark results export RUN_REF --output results.zip` | Resolve with M02 `results.resolve_run`, call `exchange.plan_result_export(run_uid, result_ids=None)`, require `plan.can_export.enabled`, and use `plan.selected_result_ids` (all retained IDs by default), then `exchange.export_results(run_uid, result_ids, path)` job. **R058** |
| `axbenchmark results import results.zip --template TEMPLATE_SHA` | `exchange.inspect_results(path, sha256)` job, then on `verdict == "ready"` `exchange.import_results(staging_id)`; prints added and skipped-identical counts. On `template_mismatch` prints expected, received and declared identities in full and fails with `exchange.template_mismatch`; on `conflict` fails with the exact result/run/trial/invalidation code and both digests. **R059, R121** |
| `axbenchmark results import results.zip --template TEMPLATE_SHA --as-separate-revision` | As above, then on `template_mismatch` `exchange.import_results(staging_id, target="embedded_revision")`. This option exposes the R121 alternative to the CLI because every API path must be reachable from it; it is an interface decision, not a new product behavior. |
| `axbenchmark exchange inspect ZIP` | `exchange.inspect_package` (generated from the registry). |
| `axbenchmark exchange export-preview TEMPLATE_SHA`, `axbenchmark exchange export-plan RUN_UID` | `exchange.template_export_preview`, `exchange.plan_result_export` (generated). |

Rejections exit with the CLI's "operation failed" code and print `message`, `remedy`, the step that failed and `effects`; `--json` prints the job's event stream and the typed error.

M17.1–2 package/round-trip tests dispatch embedded v1/v2 descriptors and preserve both benchmark modes, seven domains, exact input order/bytes and baseline executable flags after source deletion. Carry M02's inert invocation-scoped protocol/check/history/tree/ancestry/inventory evidence with setup origin and unchanged task-cutoff verdicts; never restore active Git metadata or run checks during import. Missing archived evidence stays not_recorded; a new-launch revision gate does not invalidate archive reading. Existing outer ZIP/manifest versions, atomic publication and portable digest rules remain unchanged. **R179, R180, R183**

### 6. Headless verification

These are required future executable checks, not test results from editing this specification. Child specs name exact proposed test files and commands.

| Level | Required evidence |
|---|---|
| Domain and archive | Boundaries include traversal/absolute/drive/control paths, non-NFC/case-fold/file-directory collisions, links/special files, encryption/method, index and actual inflated-byte/count/ratio limits. CRC/truncation/header disagreement and any inventory/hash/reference corruption reject atomically. M01 exact metadata/manifest bytes reject noncanonical descriptors, unknown fields, wrong roles and orphan baseline files. |
| Definition modes and source removal | Round-trip unchanged v1 built-in, one-task and zero-file repository golden bytes/hashes plus v2 one-shot/empty-shared and ordered multi-step fixtures with empty/folder baselines. Preserve CRLF/non-ASCII/no-final-LF primary bytes, task order, semantic executable flags and mode/legacy projections after deleting the original source. Patch source inspection/capture reads to fail: import/export/reuse still succeed from frozen payloads. Reject unknown versions, duplicate roles, missing primary files, invalid one-shot/multi-step cardinality and unlisted baseline files without upgrade or partial registration. |
| Mandatory commit exchange | Real M01/M02/M17 round trips preserve frozen policy/instruction/check/scope closure and scoped commit/tree/history/snapshot evidence for passed, missing/dirty/rewritten `FAIL` and unreadable-history `UNVERIFIED` tasks after workspace removal. Include unborn and setup-baseline starts, empty milestone commits and distinct invocations/trials; reject missing declared evidence or cross-scope references atomically. Genuine legacy absence remains `not_recorded` with unchanged bytes/hash/outcomes. Patch Git/process/model entrypoints to fail; import validates inert data without executing checks, fabricating verification or repairing commits. |
| Portable bindings | Import two originating machines' same label/configuration with different UIDs: result sets, trial means and export scopes remain separate. Reject conflicting immutable run binding, occupied trial slot, result snapshot or invalidation ID as a whole batch. Two T1 trials preserve distinct logs/screenshots and frozen counts through subset import; source origin survives A → B → C. |
| Context snapshot exchange | Real M02/M17 round trips preserve multi-capture native-only and selected pending/partial analyses, descriptor/source/cutoff digests, sealed record bytes and facts. Reject omitted required descriptors, duplicate/missing captures, scope mismatches, missing/extra/escaping sidecar references and different selected snapshots for one ResultId; accept genuine legacy absence unchanged. Later decisions cannot alter pinned ZIP bytes; crash/recovery publishes or rolls back sidecars with the whole collection. Read/export/import make zero classifier calls and never resume observer jobs. |
| Export/finalization | Delay usage, check/hardware writes and original reviews: export stays retention-pending. After real M11/M10/M18/M02 barrier, immediate export/import matches retained facts, rates/billing/coverage, finalization and review evidence. Concurrent additional reviews remain pinned; invalidation before output commit repins with non-comparable overlay or returns snapshot-changed. Cross-run/empty selection rejects. |
| Shared publication | Pause and crash before/after journal, each prepare, receipt write, commit_view, marker, cleanup and outbox step while another client lists, reads guessed IDs, launches, exports and deletes. Each captured view sees old or entire new state. Crash between prepare and receipt recovers original created flags. Pre-existing records never roll back; published transactions always roll forward, failure/retry is idempotent, failed rollback blocks readers with hidden data. |
| Cross-OS/modes | M01/M09/M16 golden payloads round-trip macOS ↔ Linux after entry reordering/compression/timestamp/permission changes. Template digests and exact descriptor bytes agree. Flip semantic executable flag with identical file bytes: digest changes; ZIP mode changes do not. Staging stays 0600, approved storage 0444/0555; M05/M08 working copies restore executable/non-executable behavior. |
| Real API/security | Temporary engine home, real archive/M01/M02/shared-marker adapters through `InProcessClient` and socket: typed F18 error envelope/field/remedy/steps/effects agree. Corrupt/unsafe failure preserves existing data; no secrets or unrelated files exported. Patch process/model/install entrypoints to fail during imports containing setup/postinstall scripts; import still validates without execution. Output path races never overwrite another file. Enforce `import-linter` boundaries. |
| Screen/client | Fake-client Pilot tests at wide and 80×24: all fourteen exchange boards, including duplicate/conflict/digest/export states, full digests, UID/origin distinctions, mode/stage/baseline/legacy and scoped commit rows, invalidation notice, exact action calls, loading/empty/error and capability reasons. Reconnect/replay does not regress completed publication; unmount does not cancel an import; the explicit ImportVerifying cancel binding honors the publication boundary. Real M15 integration proves no-harness export/import and separate-revision flow. |

**Wireframe follow-up (not an edit in this task):** update ResultPackage/ResultImport/ExportResult provenance and selection legends to show RunUid alongside colliding labels, explicit TrialRef, selected subset/frozen trial count and inspection-only invalidation. All five exchange screen legends target M17 `tui/screens/exchange.py`; Library/Results legends own navigation entrypoints only. Keep ResultPackagePick as its own board. M14's curated export binding must resolve UID and submit the explicit plan selection. Parent acceptance also requires the M02 ExportBundle guard/close and same-tx participant receipt contracts listed above to be reconciled in their owners before implementation.

## Human-review portability

[M12.5](../../M12/05-human-review-web.md) adds a tagged committed-review branch, not a runnable web artifact. M02 serializes reviewer/form-policy identity, human-authored category comments, rubric/evidence versions and original/additional review provenance without fake model fields. Export only committed reviews/dispositions under existing readiness leases; omit web credentials, bootstrap URLs, bearer sessions, mutable drafts and pending submission controllers. Import/view/offline reports never start a listener, open a human form, submit a grade or resume a foreign session. Explicit local human rejudge creates new authorized work and keeps the imported original and its group unchanged.

## Variant metadata portability

[Model variants](../../MODEL-VARIANTS.md) adds M02-owned immutable variant descriptors, artifact-manifest metadata, creator/date/source claims, requested/effective observations and annotation history to selected result packages under existing read leases and integrity inventories. Freeze the exact selected metadata view/version and validate variant ID/descriptor revision/digest conflicts instead of overwriting. Explicit external model-file records describe logical files and their digests; they are not unresolved payload-file references or authority to copy model weights. Only declared retained metadata/evidence sidecars are included.

Import and offline view make no Hub request, inference call, model load, annotation adoption or regrade. Preserve original identity/evidence tiers, date precision, missing facts, creator-role distinctions, confirmed mismatch exclusions and complete TrialRefs. Strip credentials, absolute source-machine paths and private endpoint locations from portable projections, without pretending a public alias is an exact content identity. Existing template identity, score, review and atomic publication contracts remain unchanged.

## SQLite authority and portable records — R191

[RESULTS-DATABASE.md](../../RESULTS-DATABASE.md) supersedes local `record.yaml`/run-file authority, while the existing canonical package paths and digest definitions remain unchanged. M02 generates pinned portable records from normalized SQLite and validates incoming records before mapping them to rows. Structured context analyses, grades, scores and provenance live in normalized tables; large source/observer/evidence payloads may remain referenced files. Exports never copy the live database as a replacement for the validated portable package.

The final shared publisher transaction inserts result rows, receipts/outbox and publication marker atomically after filesystem participants/evidence are durable. Incoming rows remain outside the live database until that transaction; views alone cannot conceal staging from raw read-only SQL. M01/M07/M16 file participants resolve visibility against the same SQLite marker and pinned PublicationView. Preserve existing collision, guard, lease and recovery behavior. Derived snapshots must identify exact retained inputs; imported unsupported or incomplete analysis versions remain inspection-only until validated/recomputed by M06, without changing raw results or invoking a model.
