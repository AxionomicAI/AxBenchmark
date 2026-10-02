# M17 — Portable ZIP exchange and validation

## Purpose and authority

This proposed contract defines portable template and result exchange for AxBenchmark. It specifies future behavior, not implemented functionality; [SPEC.md](../SPEC.md) remains authoritative. Users export approved work, run AxBenchmark independently on another machine, and import its outcomes only after template and package integrity checks pass. Harness/model/effort selections remain saved per benchmark through [M07](07-run-configuration.md). **R009, R036**

Exchange supports macOS and Linux and preserves historical benchmark applications, results, and reviews. Remote orchestration, hardware provisioning, and native Windows support are outside initial scope. Transferring a ZIP does not provision or control the destination machine. **R015, R141**

## Package contracts

These contents describe required information. The serialization and archive layout are implementation decisions recorded under [Implementation](#implementation), not product requirements.

| Package | Required contents |
|---|---|
| Template ZIP | A versioned manifest and the complete frozen definition: project specification, ordered task prompts, starting files/fixtures, acceptance checks, setup/start/stop instructions, execution rules/protocol, and grading rubric. Required runtime dependencies are declared; installed dependency directories and credentials are excluded. **R115** |
| Existing-repository baseline | The actual starting snapshot captured from the selected committed revision, carried within the template. An originating-machine path or a later lookup of a moving branch cannot substitute for the packaged baseline. [M16](16-custom-template-planning.md) owns capture. **R068, R115** |
| Result ZIP | The exact template plus the selected run's result records, configuration, machine label and hardware/OS details, harness versions, timestamps, task outcomes, measurements with coverage, original weights, judge metadata and grades, generated artifact snapshots, and supporting evidence. A file-integrity manifest covers the result payload. **R116** |

Export only the selected template/run and its required supporting contents. Raw credentials and unrelated machine files must never enter the package. Source result identifiers and provenance survive import and every subsequent export; relaying a result through another machine must not replace its origin with that machine. [M02](02-retained-results-comparability.md) supplies retained records and these provenance semantics. **R116**

## Operations and identity boundary

**Export template.** Select an exact library revision and package its complete definition and manifest. **Export results.** Select a retained run and package its required records, evidence, and the exact template they reference. These operations preserve existing templates, results, reviews, and historical applications. **R015, R036, R115, R116**

**Import template.** Validate the package, recompute identity from its extracted definition, and register only after the digest matches its manifest. **Import results.** Select a local template revision, validate the embedded definition and payload, and add compatible results atomically. Names, filenames, or a declared hash alone never establish compatibility. **R036, R120, R142**

[M01](01-template-library-identity.md) owns the versioned deterministic canonical manifest and SHA-256 computation, including normalized relative paths and content digests. M17 must use that same identity contract for exports and imports. Identical definitions retain their digest across macOS/Linux and ZIP repackaging, regardless of compression, entry order, timestamps, local absolute paths, machine identity, or display-only naming. Changing benchmark-defining content changes identity; selecting different harnesses or machines does not. **R118, R119, R141**

## Validation order and atomic registration

1. **Establish a safe package boundary.** Inspect archive paths and reject escaping paths and links. Enforce bounded extraction before accepting contents, keeping unvalidated material outside registered library state. Corrupt archives, missing required contents, and unsupported formats fail with actionable explanations. **R117, R142**
2. **Validate the definition.** Check completeness against the template contract, then recompute its canonical digest from extracted content. For a template ZIP, require equality with the manifest's declared identity before registration. **R115, R120**
3. **Validate result compatibility.** For a result ZIP, independently recompute the embedded template and selected local template. Require the embedded recomputation, package-declared template hash, and local recomputation to agree. Verify result-payload digests, result-to-template references, and task identifiers against the validated template. **R116, R120**
4. **Resolve existing identities.** An already registered identical template or result is an idempotent success with no duplicate. Preserve distinct runs of the same configuration. Reject different payloads reusing an existing result identifier; never overwrite the original. **R122, R142**
5. **Register the accepted collection.** Only after every check succeeds may the template or selected run's results become available. Any validation failure leaves library registration and existing results unchanged, with no partial additions. **R117, R142**

Throughout import, contents are data. Do not execute packaged scripts, install dependencies, invoke a model, or modify an existing result. Executing an imported benchmark or rejudging an artifact requires a separate explicit action. [M05](05-harness-execution-isolation.md) owns execution and [M12](12-quality-judging.md) owns judging; neither is implicitly triggered by exchange. **R117**

## Failure and comparison invariants

For a template mismatch, reject adding results to the selected benchmark and show the expected and received template identities. Offer the user the separate action of importing the embedded template as another library revision and associating results with that matching revision, subject to the same validation. Never force-merge different templates or overwrite a local template to manufacture compatibility. **R121**

Diagnostics identify the failed requirement and a useful next action: obtain a complete or uncorrupted export, use a supported package format, or select/import the matching revision. Rejection is atomic even when an earlier part of the package was valid. Data with different template hashes cannot enter one comparison or ranking; [M02](02-retained-results-comparability.md) enforces that retained-data boundary. **R117, R122, R142**

The engine performs every exchange operation and validation; [M15](15-terminal-interface.md) and [M14](14-command-line-interface.md) are clients of the `exchange.*` API that start these operations and present their outcomes. The source leaves exact format versions, manifest serialization, extraction limits, storage layout, and atomic-registration mechanism to implementation design; the choices under [Implementation](#implementation) are those design decisions and add no product requirement. **R036, R115, R117**

## Acceptance scenarios

- Export on macOS, repackage with different ZIP ordering/compression/timestamps, then import on Linux: identity is unchanged. A changed prompt, task order, check, baseline, protocol, or rubric changes it; different harnesses or machines do not. **R141**
- Export an existing-repository template and a selected run: the packages contain every required definition and result group, including the actual baseline, dependency declarations, and integrity manifest. The template excludes installed dependency directories; exports exclude credentials and unrelated files. **R115, R116**
- Import another machine's result ZIP: every required content group, source identifier, provenance, and payload digest is preserved. The result joins only the independently verified matching revision. **R116, R120, R142**
- Import scripts and dependency declarations: nothing executes or installs and no model is invoked. Corrupt, incomplete, unsupported, escaping-path, link, or extraction-bound violations leave no partial registration. **R117, R142**
- Present mismatched identities: show expected/received values, preserve the selected template, and allow a separately validated embedded revision with its matching results. **R121**
- Reimport identical packages twice: no duplicates. Import a distinct run: retain it. Reuse its result identifier with conflicting content: reject without mutation. Different template hashes remain separate in comparisons. **R122, R142**

## Implementation

This section applies [ARCHITECTURE.md](ARCHITECTURE.md). Everything here is an implementation decision: package format, manifest serialization, extraction bounds, staging layout and the registration mechanism are chosen here so engineers can build them; the product contract above and [SPEC.md](../SPEC.md) are unchanged.

### 1. Engine component

Package `axbenchmark.engine.exchange`. It owns no template or result records: it reads revisions through [M01](01-template-library-identity.md) and retained results through [M02](02-retained-results-comparability.md), and registers through their application interfaces. It never starts a process; `import-linter` forbids `engine.exchange` from importing `subprocess`, `asyncio.subprocess`, `engine.harness`, `engine.judging` and `engine.runs`, so R117 is enforced by the build, not only by review.

**Package format** (implementation decision, version `axbenchmark-package/1`):

```
manifest.json                         package manifest (below); always the first entry
template/manifest.json                M01 canonical manifest of the embedded revision (listing only)
template/<RelPath>                    every file the canonical manifest lists, nothing else
results/<result_id>/record.yaml       result ZIP only: M02's record, config, reviews,
results/<result_id>/config.yaml         evidence and snapshots, as returned by
results/<result_id>/reviews/…           RetainedResultReader.export_bundle
results/<result_id>/evidence/… snapshots/…
```

`manifest.json` is UTF-8 JSON: `format`, `kind` (`template` | `result`), `exported_by` (machine id and label, app version), `exported_at`, `template` (`sha256` as declared, display `name` and `label`), `dependencies` (the template's declaration, copied for display), and for result packages `results: [{result_id, run_id, template_sha256, task_ids, files: [{path, sha256, size}]}]` plus `payload_digest`, the SHA-256 of the canonical serialization of `results` (keys sorted, compact separators, entries sorted by path bytes). Display fields, `exported_by` and `exported_at` are never identity inputs. Export writes entries in path order with a fixed timestamp (1980-01-01), mode 0644 and deflate, so repeated exports of the same content are byte-identical; import never relies on this. **R115, R116, R141**

**Domain** (`engine/exchange/domain/`, frozen slotted dataclasses, no I/O):

| Type or rule | Contents |
|---|---|
| `PackageKind` | `TEMPLATE`, `RESULT`. |
| `PackageFormat` | `SUPPORTED = ("axbenchmark-package/1",)`; `parse_manifest(bytes) -> PackageManifest` raises `UnsupportedFormat(found, supported)` or `ManifestInvalid(field)`. |
| `ArchiveEntry` | Raw central-directory row: `name: str`, `kind: file \| dir \| symlink \| hardlink \| special`, `size`, `compressed_size`, `encrypted`, `method`. |
| `ExtractionBounds` | `max_entries`, `max_entry_bytes`, `max_total_bytes`, `max_ratio`. Defaults, set in engine settings and overridable there: 50 000 entries, 1 GiB per entry, 4 GiB total, compression ratio 200. The values are implementation choices, not product limits. **R117** |
| `check_boundary(entries, bounds) -> BoundaryReport` | Pure. Each entry name must construct M01's `RelPath` (no absolute path, `..`, backslash, drive prefix, NUL); must be a regular file or directory (links and special files refused); no duplicate name, also after Unicode NFC and case folding (so a case-insensitive macOS volume cannot merge two entries); no encryption; method stored or deflate; sizes and ratio within `bounds`. The report lists every violating entry with a `BoundaryProblem` (`escapes`, `absolute`, `link`, `special_file`, `duplicate`, `encrypted`, `method`, `over_bound`). Nothing is extracted unless the report is clean. **R117, R142** |
| `CompletenessReport` | Rows `(requirement, status: present \| missing \| unexpected, detail)` for manifest, specification, ordered prompts, checks, setup/start/stop, protocol, rubric, baseline and dependency declaration. Built by `check_listing(canonical_listing, extracted)` (every listed path extracted with its size; nothing extracted under `template/` that the listing omits) plus M01's role check. **R115** |
| `IdentityAgreement` | `embedded_computed`, `declared`, `local_computed: Sha256 \| None`, `differing_paths`. `template_ok()` is `embedded_computed == declared`; `matches_selected()` additionally requires `local_computed == embedded_computed`. A declared hash, name or filename is never compared on its own. **R120, R121** |
| `check_references(results, template) -> list[ReferenceProblem]` | Each result's `template_sha256` equals the validated embedded identity; every `task_id` exists in its task list; each listed file's digest and size equal the extracted bytes; `payload_digest` recomputes. **R116, R120** |
| `ValidationRun` | The five ordered steps `BOUNDARY`, `DEFINITION`, `COMPATIBILITY`, `IDENTITIES`, `REGISTER` with state `pending \| running \| done \| failed \| skipped`. `advance(step)` refuses any step whose predecessors are not `done` or `skipped`; `REGISTER` is reachable only when steps 1–4 are `done` (step 3 is `skipped` for a template ZIP). A failure ends the run. This is the single place the order is enforced. **R117, R142** |
| `incoming_provenance(record, exported_by, package_name, payload_digest, imported_at)` | Marks the record `IMPORTED` with `ImportOrigin`, and appends `exported_by` as a relay through M02's `Provenance.with_relay` when it differs from the record's origin and last relay. `origin` and `source_result_id` are never changed. **R116** |
| `ImportEffects` | Facts attached to every outcome and rejection: `extracted_files: int`, `registered: bool`, `executed: Literal[False]`, `staging_removed: bool`. Screens print these instead of asserting them. **R117** |
| `EXCLUSIONS` | Fixed descriptive list returned as data by the export previews: credentials and secrets, installed dependency directories, files outside the revision or result directories, local absolute paths. **R115, R116** |
| Domain errors | `UnsafePackage(report)`, `CorruptArchive(detail)`, `UnsupportedFormat`, `WrongPackageKind(expected, found)`, `IncompletePackage(report)`, `UnexpectedEntries(paths)`, `TemplateDigestMismatch(declared, computed, differing_paths)`, `PayloadDigestMismatch(paths)`, `ReferenceMismatch(problems)`, `SelectedTemplateMismatch(agreement)`, `StagingExpired(id)`. |

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
    async def commit(self, tmp: Path, path: Path) -> None: ...         # os.replace
    async def abandon(self, tmp: Path) -> None: ...

class RegistrationJournal(Protocol):                                   # ~/.axbenchmark/exchange/journal
    async def begin(self, entry: JournalEntry) -> None: ...
    async def complete(self, import_id: ImportId) -> None: ...
    async def pending(self) -> Sequence[JournalEntry]: ...
```

Plus `Clock`, `IdGenerator`, `EventPublisher` from `engine/shared`, `JobRunner` from [M11](11-run-orchestration.md), and the other modules' application interfaces in part 3: `TemplateIdentity`, `RevisionRegistry`, `RevisionReader`, `TemplateDirectory` (M01), `ImportRegistrar`, `RetainedResultReader` (M02), `MachineIdentitySource` (M03).

**Application** (`engine/exchange/application/`, one class per use case):

| Use case | Kind | Behavior |
|---|---|---|
| `InspectPackage` | query | Reads the central directory and `manifest.json` only (bounded to 1 MiB), extracts nothing, and returns kind, format support, declared template, content groups, per-result provenance and `importable_as`. A corrupt or unsupported file is returned as `problem`, not raised, so a file picker can label it. |
| `PreviewTemplateExport` | query | `TemplateDirectory.describe` and the revision's manifest roles → included groups with counts, `EXCLUSIONS`, a default file name `<name>-<label>-<sha8>.zip` in the user's working directory, `can_export` (false with `templates.identity_mismatch` when M01's last check failed). |
| `PlanResultExport` | query | `RetainedResultReader.run` → exportable results with M02's `can_export`, included groups, `EXCLUSIONS`, default path `<run_id>-results.zip`. |
| `ExportTemplate` | job | `RevisionReader.open(sha)` (raises `IdentityMismatch` before any file is handed out), `OutputTarget.prepare`, writes `manifest.json`, `template/manifest.json` and the listed files only, then commits. Emits `exchange.package.exported`. **R115** |
| `ExportResults` | job | `RetainedResultReader.export_bundle(run, rids)` and `RevisionReader.open(bundle.template_sha256)`; writes the template, each result's files with digests, `payload_digest` and `exported_by` from `MachineIdentitySource`; commits. Only files enumerated by the two readers enter the archive. **R066, R116** |
| `ImportTemplate` | job | Steps 1–5 in one job: boundary; stage `template/` and `manifest.json`; listing and role completeness; `TemplateIdentity.compute` from staged bytes and compare with `declared`; `TemplateDirectory.describe(sha)` for step 4 (already present → idempotent success, nothing registered); `RevisionRegistry.register_staged(staged, origin=imported)`. Staging is discarded at the end in every case. **R117, R120, R122** |
| `InspectResults` | job | Steps 1–4 for a result ZIP against a selected local revision: boundary; stage; embedded definition completeness and `template_ok()`; `TemplateIdentity.check(selected)` for `local_computed`; `check_references`; then `ImportRegistrar.read_incoming` and `ImportRegistrar.classify` against the selected identity. Ends with a `StagedVerdict` of `ready`, `template_mismatch` (embedded template valid, selected revision differs) or `conflict`. Integrity failures raise and discard staging; the three verdicts keep staging until it expires. **R120, R121, R122** |
| `RegisterResults` | command | Re-opens the staged verdict. `target=selected` requires `ready` and calls `ImportRegistrar.register`; M02 re-classifies under its lock, so a conflict that appeared since inspection still rejects everything. `target=embedded_revision` requires `template_mismatch`, re-runs `IDENTITIES` against the embedded identity, and registers template and results together through the journal below. Emits `exchange.import.completed`; staging is discarded. **R121, R142** |
| `RecoverRegistrations` | startup | For each journal entry without `complete`, withdraws a template revision the entry created if M02 holds no results for it, then removes the entry; also sweeps expired staging. |

Two-store registration (embedded revision): M01's index write and M02's batch commit are separate commit points, so `RegisterResults` writes a journal entry (`import_id`, embedded `sha256`, staged result ids), calls `RevisionRegistry.register_staged`, then `ImportRegistrar.register`. If the second call fails, it calls `RevisionRegistry.withdraw(sha, registration_id)` when the first call returned `created=True`, and marks the entry complete only after both succeed or the withdrawal finishes. An engine crash between the calls is repaired by `RecoverRegistrations` before the API accepts calls. No reader ever sees the template without its results for longer than that window, and never after a failure. **R117, R142**

**Adapters** (`engine/exchange/adapters/`):

| Adapter | Implements |
|---|---|
| `zip_reader.py` | `ArchiveReader` on stdlib `zipfile`, run through `asyncio.to_thread`. `index` maps `ZipInfo` (`external_attr >> 16` for `S_IFLNK` and other non-regular types, flag bit 0 for encryption). `read` counts inflated bytes and stops at the limit; `extractall` is never used. `BadZipFile`, CRC errors and truncated archives become `CorruptArchive`. |
| `zip_writer.py` | `ArchiveWriter`: `ZipFile(mode="x")`, deterministic `ZipInfo` as described above, Zip64 allowed. |
| `fs_staging.py` | `StagingArea` under `~/.axbenchmark/exchange/staging/<staging_id>/` (dir 0700, files 0600, never executable), `os.open` with `O_CREAT \| O_EXCL \| O_NOFOLLOW`, resolved path checked to stay under the staging root; `verdict.json` beside `package/`. Expiry one hour after creation, matching how long M11 keeps finished jobs. |
| `fs_output.py` | `OutputTarget`: refuses an existing file, writes `<path>.axb-<id>.tmp` in the same directory, `fsync`, `os.replace`. |
| `fs_journal.py` | `RegistrationJournal`: one JSON file per import, temp + rename. |
| `rpc.py` | Maps `axbenchmark.api.exchange` DTOs to use-case inputs and domain results and errors to the codes in part 2; maps M01's `IdentityMismatch` to `templates.identity_mismatch` and M02's `ResultIdConflict` to `exchange.result_id_conflict`. Registers the `exchange` event topic. |

**Persisted state** (engine-owned; no interface reads it):

```
~/.axbenchmark/exchange/
  staging/<staging_id>/package/       extracted, boundary-checked package contents
  staging/<staging_id>/verdict.json   StagedVerdict: package path, selected sha, agreement, dispositions
  journal/<import_id>.json            two-store registrations in progress
```

Registered templates live in M01's library and imported results in M02's store; nothing under `exchange/` is ever read as library or result state.

**Processes owned:** none. Hashing and ZIP I/O run in worker threads inside the engine.

### 2. API surface (`exchange.*`)

DTOs live in `axbenchmark.api.exchange`. Templates are addressed by full 64-character SHA-256; resolving a prefix is the CLI's concern before the call. `ActionState = {enabled: bool, reason: str | None}` as in M01.

Shared models:

| Model | Fields |
|---|---|
| `StepDTO` | `step: boundary \| definition \| compatibility \| identities \| register`, `state: pending \| running \| done \| failed \| skipped`, `detail: str` (for example "recomputed 7d2e4a10 = declared"). |
| `ValidationProgress` | `steps: list[StepDTO]`, `files_hashed: int`, `files_total: int` — the `job.progress` payload of every import job. |
| `ImportEffectsDTO` | `extracted_files`, `registered`, `executed` (always false), `staging_removed`. Present in every import outcome and in the `data` of every import error. |
| `IdentityAgreementDTO` | `expected_sha256` (selected, recomputed locally), `received_sha256` (embedded, recomputed), `declared_sha256`, `declared_matches_received: bool`, `differing_paths: list[str]`, `expected_label`, `received_name`. |
| `ImportOutcome` | `kind: template \| results`, `template_sha256`, `template_name`, `template_label`, `template_created: bool`, `target: selected \| embedded_revision \| none`, `added: list[result_id]`, `skipped_identical: list[result_id]`, `steps`, `effects`. |
| `ExportOutcome` | `path`, `size`, `kind`, `template_sha256`, `result_ids`, `excluded: list[str]`. |

**Queries** (safety `read`):

| Method | Request | Response | Errors |
|---|---|---|---|
| `exchange.inspect_package` | `path` | `PackageSummary{path, file_name, kind: template \| result \| unknown, format, format_supported, template: {name, label, declared_sha256} \| None, contents: [ContentGroupDTO{label, detail, children}], results: [PackageResultDTO{source_result_id, run_id, result_count, origin{id, label}, relays: [{id, label}], exported_by}], excluded: [str], problem: ErrorInfo \| None, can_import_template: ActionState, can_import_results: ActionState}` | `exchange.file_not_found{field: path}` |
| `exchange.template_export_preview` | `sha256` | `TemplateExportPreview{sha256, name, label, default_path, included: [ContentLine{group, count, detail}], dependencies: [str], excluded: [str], can_export: ActionState}` | `templates.not_found` |
| `exchange.plan_result_export` | `run_id` | `ResultExportPlan{run_id, template: {name, label, sha256}, default_path, results: [ExportableResultDTO{result_id, status, machine, can_export}], included: [ContentLine], excluded: [str], can_export: ActionState}` | `results.unknown_run` |

**Commands**:

| Method | Request | Response | Errors | Safety |
|---|---|---|---|---|
| `exchange.import_results` | `staging_id`, `target: selected \| embedded_revision = selected` | `ImportOutcome` | `exchange.staging_expired`, `exchange.template_mismatch` (target `selected` on a mismatch verdict), `exchange.not_applicable{target}` (target `embedded_revision` without a mismatch verdict), `exchange.result_id_conflict`, `exchange.registration_failed` | `write` |

**Jobs** (return `JobRef`; progress `ValidationProgress` unless stated; cancel through `jobs.cancel`, which discards staging and adds nothing):

| Method | Request | Result | Errors | Safety |
|---|---|---|---|---|
| `exchange.import_template` | `path` | `ImportOutcome` (`kind=template`; `template_created=false` is the idempotent duplicate) | `exchange.file_not_found`, `exchange.corrupt_archive`, `exchange.unsupported_format{found, supported}`, `exchange.wrong_package_kind{expected, found}`, `exchange.unsafe_package{entries: [{path, problem, detail}]}`, `exchange.incomplete_package{requirements: [{requirement, status, detail}]}`, `exchange.unexpected_entries{paths}`, `exchange.digest_mismatch{declared_sha256, computed_sha256, differing_paths}`, `exchange.registration_failed` | `write` |
| `exchange.inspect_results` | `path`, `template_sha256` (selected local revision) | `ResultImportPreview{staging_id, expires_at, package_name, steps, verdict: ready \| template_mismatch \| conflict, selected: {name, label, sha256}, identities: IdentityAgreementDTO, rows: [PreviewRowDTO{source_result_id, run_id, origin, relays, disposition: add \| identical \| conflict, existing_digest, incoming_digest, differing_paths}], embedded_option: {embedded_sha256, already_registered, result_count, can_import_embedded: ActionState} \| None, can_add: ActionState}` | the template-import errors above for the embedded template, plus `templates.not_found`, `templates.identity_mismatch` (selected revision's files changed locally), `exchange.payload_digest_mismatch{paths}`, `exchange.reference_mismatch{problems: [{result_id, kind: template \| task_id \| file, detail}]}` | `read` (writes only engine-private staging) |
| `exchange.export_template` | `sha256`, `path` | `ExportOutcome` | `templates.not_found`, `templates.identity_mismatch`, `exchange.output_exists{field: path}`, `exchange.output_unwritable{field: path}` | `write` |
| `exchange.export_results` | `run_id`, `result_ids: list \| None` (None = every result with `can_export`), `path` | `ExportOutcome` | `results.unknown_run`, `exchange.nothing_selected{field: result_ids}`, `exchange.result_not_exportable{result_id, reason}`, `templates.identity_mismatch`, `exchange.output_exists`, `exchange.output_unwritable` | `write` |

Every import error carries `data.steps` (where validation stopped), `data.effects` and a `remedy` naming the next action from the contract above: obtain a complete or uncorrupted export, use a supported format, or select or import the matching revision. Interfaces print `message` and `remedy` verbatim. A template mismatch is a verdict, not a job error, because the user may continue with the embedded revision from the same staging; `exchange.template_mismatch` is raised only when a client asks to add mismatched results to the selected revision. **R117, R121**

Capability flags: `can_import_template` / `can_import_results` (reason `exchange.wrong_package_kind`, `exchange.unsupported_format` or `exchange.corrupt_archive`) on `PackageSummary`; `can_export` on both export previews and per result (reasons from M02, for example `results.not_sealed`, or `templates.identity_mismatch`); `can_add` (reason `exchange.template_mismatch` or `exchange.result_id_conflict`) and `embedded_option.can_import_embedded` on `ResultImportPreview`. None of these consults [M03](03-environment-readiness.md): exchange stays available with no harness installed. **R029**

**Events** (topic `exchange`):

| Event | Payload | Emitted when |
|---|---|---|
| `exchange.package.exported` | `kind, path, template_sha256, result_ids` | An export job commits its file. |
| `exchange.import.completed` | `kind, template_sha256, template_created, target, added, skipped_identical` | An import registers or is an idempotent no-op. M01's `templates.revision.registered` and M02's `results.import.registered` follow from the registrations themselves. |
| `exchange.import.rejected` | `kind, package_name, code, step` | An import job or command ends with an error. |

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `TemplateIdentity.compute(files, definition)`, `TemplateIdentity.check(sha)` (application interface) | M01 | Recompute embedded and selected identities with the one canonical contract. **R118, R120** |
| `TemplateIdentity.parse_definition(files) -> TemplateDefinition` raising `DefinitionIncomplete(missing_roles)` / `PayloadMissing(path)` (application interface) | M01 | Role completeness of a staged definition before hashing. **R115** |
| `RevisionRegistry.register_staged(staged, origin)` for a staged, already-hashed file set with `origin=imported` (package name, source machine), returning `Registration(sha256, created, registration_id)` | M01 | Step 5 for templates and embedded revisions; idempotent duplicates. **R120, R122** |
| `RevisionRegistry.withdraw(sha, registration_id)` (application interface) | M01 | Compensation when an embedded-revision registration's results fail to commit. **R142** |
| `RevisionReader.open(sha)` → `FrozenRevision` (files with digests, canonical manifest, name, label) | M01 | Template export from verified files only. |
| `TemplateDirectory.describe(sha)` | M01 | Step 4 "already present" and preview labels. |
| `RelPath` (domain type) | M01 | Entry-name normalization in `check_boundary`. |
| `ImportRegistrar.read_incoming(staged_result_dir) -> IncomingResult` raising `RecordInvalid` (application interface; M02 parses its own record format) | M02 | Turn staged `results/<id>/` into incoming records. |
| `ImportRegistrar.classify`, `ImportRegistrar.register` | M02 | Dispositions and atomic batch commit with re-classification under lock. **R122** |
| `RetainedResultReader.run`, `RetainedResultReader.export_bundle` (bundle includes each file's relative path, digest, size and an opener, plus the template SHA-256) | M02 | Result export content and plan. **R116** |
| `Provenance.with_relay` (domain) | M02 | Relay rule in `incoming_provenance`. |
| `MachineIdentitySource.current() -> MachineIdentity` (application interface) | M03 | `exported_by` in packages. |
| `JobRunner`, `jobs.get`, `jobs.cancel`, `events.subscribe`, `job.progress`, `job.finished` | M11 | Job execution and progress delivery. |
| ExportScreen, ImportScreen (`#import-pick`, `#import-steps`, digest-mismatch and duplicate states) | M01 | Host screens for M17's template states. |
| ResultsScreen `i` → ResultPackageScreen; ImportResultsScreen; ExportResultsScreen | M02 | Host screens for M17's result states. |

### 4. Screens

M17 owns the artboards ImportUnsafe, ImportIncomplete, ResultPackage, ResultMismatch and ResultEmbedded. Two of them are states inside screens whose other states belong to M01 (ImportScreen) and M02 (ImportResultsScreen); this part specifies only the M17 states and the shared validation-order widget. ExportTemplate, ImportTemplate, ImportVerifying, ImportRejected and ImportDuplicate are specified in M01; ResultImport, ResultImportConflict and ExportResult in M02; all of them call the methods above.

Shared rules are M01's and M02's: workers through the injected client, `ContentSwitcher` states, `check_action` from `ActionState` only, engine `message` and `remedy` printed verbatim. No exchange screen validates paths, compares digests or decides a disposition; it renders `steps`, error `data`, `effects` and capability flags.

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

View models live in `axbenchmark/tui/viewmodels/exchange.py`; M01's `import_vm` and M02's `build_import_vm` compose `build_steps_vm` and `build_rejection_vm` instead of re-implementing them.

**ImportScreen, M17 states** — `axbenchmark/tui/screens/exchange.py`, `ModalScreen[ImportOutcome | None]`, dialog `#import`. Artboards ImportUnsafe and ImportIncomplete are the `#import-rejected` state of M01's `#import-body`. Inside it: `ValidationOrder` (stopped at step 1 or 2, step 3 skipped), then `ContentSwitcher #rejection-detail` (id chosen here; the artboards draw its children) with:

| `#rejection-detail` child | Shown for error code | Content |
|---|---|---|
| `#unsafe-detail`: `DataTable #unsafe-entries`, `Static .kv` | `exchange.unsafe_package` | Columns Entry, Problem from `data.entries`; kv rows Extracted / Library / Ran from `data.effects`; `remedy` below. |
| `#incomplete-detail`: `DataTable #completeness`, `Static #next-action` | `exchange.incomplete_package`, `exchange.unexpected_entries` | Columns Required content, In `<file>` from `data.requirements` (✓ / ✗ from `status`); `#next-action` is `remedy`, including the statement that no SHA-256 was computed when the error data has no `computed_sha256`. |
| `#digest-detail` | `exchange.digest_mismatch` | M01's ImportRejected layout. |
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
| `#package-pick` | Shown when no `path` was given: the `Input #zip-path` + `DirectoryTree #zip-browser` composition of M01's `#import-pick`, factored into `tui/widgets/zip_picker.py`. This state is not drawn on the artboard. |
| `#package-contents-loading` | While `exchange.inspect_package` runs. |
| `#package-contents` | `Tree #package-tree` (height 9) from `contents`, `DataTable #provenance` (Result, Origin, Relayed by, Source id) from `results`, `Static .kv` from `excluded`, and the line that inspecting reads the index and manifest only. |
| `#package-contents-error` | `problem` or the call's error, verbatim, with a Back action to `#package-pick`. |

| Binding | Action | API call |
|---|---|---|
| mount with `path`; `enter` in `#package-pick` | `inspect` | `exchange.inspect_package(path)` → `#package-contents`. |
| `enter`, `Button #import` "Validate and import" | `import` | `exchange.inspect_results(path, template_sha256)`; on the returned `JobRef`, `dismiss(True)` and the app pushes `ImportResultsScreen(job_ref, template_sha256)`. Dimmed unless `can_import_results.enabled`; the reason (for example a template ZIP chosen here) is shown in the footer hint. |
| `esc`, `Button #cancel` | `dismiss` | none; `dismiss(False)`. |
| `tab` | `focus_next` | none. |

**ImportResultsScreen, M17 states** — class and file as M02 specifies (`tui/screens/results.py`; the M17 legends name `tui/screens/exchange.py`, see open questions), `ModalScreen[ImportOutcome]`, dialog `#import-results`. Artboards ResultMismatch and ResultEmbedded become two children of the screen's `ContentSwitcher`, beside M02's `#import-validated` and `#import-conflict`; the artboard dialog ids are kept as the state ids:

| State | Entered when | Content |
|---|---|---|
| `#import-steps` | job running | `ValidationOrder` from `job.progress`. |
| `#result-mismatch` | `job.finished` with `verdict == "template_mismatch"` | `ValidationOrder` (failed at step 3); `Static #identities`: Expected (full `expected_sha256`, label, "selected here · recomputed locally"), Received (full `received_sha256`, "embedded template, recomputed" and whether it equals the declared hash from `declared_matches_received`), Differs (`differing_paths`); labels stack above each 64-character digest in `.-compact`. `RadioSet #mismatch-choice` with two options: import the embedded template as its own revision and add `result_count` results; cancel. The first option is disabled from `embedded_option.can_import_embedded`. Body text states that the selected revision and its results stay unchanged. |
| `#result-embedded` | `exchange.import_results(…, target="embedded_revision")` returned | `ValidationOrder` from `ImportOutcome.steps` (all five done); `Static .kv` Library (new or existing revision, `template_created`, short SHA), Results (count, machine, judge group, "compared only with each other"), selected revision unchanged with its result count; the line that importing ran neither the benchmark nor a judge. |

| Binding (state) | Action | API call |
|---|---|---|
| `#mismatch-choice` change | — | none. |
| `Button #continue` (`#result-mismatch`) | `continue` | first option: `exchange.import_results(staging_id, target="embedded_revision")` → `#result-embedded`; errors render verbatim in the state. Second option: none, `dismiss(None)`. |
| `esc`, `Button #cancel` (`#result-mismatch`) | `dismiss` | none; staging expires in the engine. |
| `esc`, `Button #close` (`#result-embedded`) | `dismiss` | none; `dismiss(outcome)`. ResultsScreen refreshes from `results.import.registered`. |
| `o`, `Button #open-revision` (`#result-embedded`) | `open` | none; `dismiss(outcome)` and the app pushes `TemplateScreen(outcome.template_sha256)`. |

Subscriptions: `events.subscribe(["job:<job_id>"])` on mount for the inspect job, dropped on unmount; after a reconnect the snapshot (or `jobs.get`) restores the state. `exchange.import.rejected` is not used by this screen; it serves the CLI and the future MCP client.

**Screens of other modules that consume `exchange.*`**: ExportScreen (M01: `exchange.template_export_preview`, `exchange.export_template`), ImportScreen (M01: `exchange.inspect_package` per file in `#zip-browser`, `exchange.import_template`), ImportResultsScreen M02 states (`exchange.import_results` with `target="selected"`), ExportResultsScreen (M02: `exchange.plan_result_export`, `exchange.export_results`). When ImportScreen's picker selects a file whose `PackageSummary.kind` is `result`, `enter` dismisses with a route to ResultsScreen of the highlighted Library revision followed by `ResultPackageScreen(sha, path)`; it never calls `exchange.import_template` for it.

### 5. CLI

| Command | API |
|---|---|
| `axbenchmark templates export TEMPLATE_SHA --output template.zip` | `exchange.export_template(sha256, path)` job; prints the written path. **R056** |
| `axbenchmark templates import template.zip` | `exchange.import_template(path)` job; prints the five steps as they finish, then the SHA-256 and "already present" when `template_created` is false. **R057** |
| `axbenchmark results export RUN_ID --output results.zip` | `exchange.export_results(run_id, result_ids=None, path)` job. **R058** |
| `axbenchmark results import results.zip --template TEMPLATE_SHA` | `exchange.inspect_results(path, sha256)` job, then on `verdict == "ready"` `exchange.import_results(staging_id)`; prints added and skipped-identical counts. On `template_mismatch` prints expected, received and declared identities in full and fails with `exchange.template_mismatch`; on `conflict` fails with `exchange.result_id_conflict` and both digests. **R059, R121** |
| `axbenchmark results import results.zip --template TEMPLATE_SHA --as-separate-revision` | As above, then on `template_mismatch` `exchange.import_results(staging_id, target="embedded_revision")`. This option exposes the R121 alternative to the CLI because every API path must be reachable from it; it is an interface decision, not a new product behavior. |
| `axbenchmark exchange inspect ZIP` | `exchange.inspect_package` (generated from the registry). |
| `axbenchmark exchange export-preview TEMPLATE_SHA`, `axbenchmark exchange export-plan RUN_ID` | `exchange.template_export_preview`, `exchange.plan_result_export` (generated). |

Rejections exit with the CLI's "operation failed" code and print `message`, `remedy`, the step that failed and `effects`; `--json` prints the job's event stream and the typed error.

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain (pure, no I/O) | `check_boundary` table: `../x`, `/etc/x`, `a\b`, `C:x`, NUL, symlink and hardlink modes, FIFO, duplicate and case-fold duplicate names, encrypted entry, unsupported method, entry count, entry size, total size and ratio just under and over each bound. `ValidationRun` refuses `REGISTER` from any state but steps 1–4 done, and step 3 is `skipped` only for templates. `IdentityAgreement` with each of the three values differing. `check_references` for wrong template SHA, unknown task id, file digest and size mismatches and a tampered `payload_digest`. `incoming_provenance` keeps origin and source id through A → B → C and never records the origin as its own relay. `parse_manifest` rejects unknown formats and missing fields. |
| Use cases (fake ports) | In-memory `ArchiveReader` whose index under-reports sizes: `read` stops at the bound and nothing reaches `StagingArea` before the boundary step passes. A failure injected at every step leaves fake `RevisionRegistry` and `ImportRegistrar` with zero register calls and staging discarded (R117, R142). Identical template → `created=false`, one registry call, no new revision; identical results skipped; one conflicting result rejects the batch (R122). Embedded-revision path: `ImportRegistrar.register` failing after `RevisionRegistry.register(created=True)` triggers `withdraw`; a journal left pending at startup is recovered by `RecoverRegistrations`. Export uses only files enumerated by fake `RevisionReader` and `RetainedResultReader`; `IdentityMismatch` from `open` aborts before `OutputTarget.prepare`. |
| Identity across machines | Using M01's real `TemplateIdentity`: export, then rebuild the ZIP with reversed entry order, stored vs deflate, different timestamps and external attributes, and import: same SHA-256. Changing a prompt, task order, a check, a baseline file, the protocol or the rubric changes it; a result package from a different machine and harness carries the same template SHA-256 (R141). |
| API (`InProcessClient`, real adapters, temporary `HOME`, no interface) | A package builder in `tests/exchange/builders.py` produces valid, unsafe, incomplete, unsupported, corrupt, digest-mismatched, payload-tampered, mismatched-template and id-conflict packages. Each test asserts the error code and `data` fields, that M01's `index.yaml`, M02's `index.yaml` and result directories are byte-identical before and after a rejection, that `exchange/staging/` is empty afterwards, and the events emitted. During every import test `subprocess.Popen`, `asyncio.create_subprocess_exec`, `os.system` and the `os.exec*` family are patched to fail, with packages containing `setup.sh`, a `package.json` with `postinstall` and a `requirements.txt` (R117). Staged files are never executable. Export → import → export round trip keeps source ids and origin and appends one relay (R116). A credential value present in the test environment never appears in exported bytes (R066). `import-linter` contracts for `engine.exchange` pass. |
| Screens (fake client, `App.run_test()` / `Pilot`) | ImportScreen given a `job.finished` with `exchange.unsafe_package` shows `#unsafe-detail` with one row per entry and the effects from data; with `exchange.incomplete_package` shows `#completeness` and `#next-action`; `c` copies `diagnostics_text` and issues no call. ResultPackageScreen renders `#package-tree` and `#provenance` from a fixture `PackageSummary`, dims `#import` when `can_import_results.enabled` is false, and `enter` issues exactly `exchange.inspect_results(path, sha)`. ImportResultsScreen with a `template_mismatch` preview shows both digests in full at 80 columns, `#continue` with the first option issues exactly `exchange.import_results(staging_id, target="embedded_revision")`, and `esc` issues no call. View-model builders are tested without Textual. |
