# M01 — Template library and immutable identity

## Purpose and authority

This proposed contract gives implementers and reviewers the reusable benchmark definition and identity rules for AxBenchmark, a Python terminal application for developers and teams comparing coding-agent harnesses on representative, multi-step work. Users select or create work, execute harness/model configurations, collect measurements, obtain independent LLM reviews, and produce interactive reports; matching template identities enable results from other machines to join comparisons. This document describes required future behavior, not implemented functionality. [SPEC.md](../SPEC.md) remains authoritative for product behavior. The behavior below lives in the headless engine; the TUI and CLI reach it only through the `templates.*` API, as fixed by [the architecture decision](ARCHITECTURE.md) and applied in the Implementation section. **R001, R002, R003**

The library supports built-in, user-created, and imported templates, with the existing inventory application as its default. Independent execution on other machines and ZIP exchange are supported. Remote orchestration, hardware provisioning, and native Windows support are outside initial scope. Historical applications, results, and reviews remain preserved. **R008, R015**

## Conceptual data contracts

These are semantic summaries; the exact serialized descriptor is specified under Canonical definition contract. **R017, R018, R115**

| Concept | Required information and relationship |
|---|---|
| Library entry | Name, description, project type, task count, revision/SHA-256, saved configurations, and available results; includes built-in, custom, and imported entries. |
| Template revision | Approved project specification, ordered task prompts, starting files/fixtures, acceptance checks, execution protocol/rules, setup/start/stop instructions, and grading rubric. It is the reusable definition of the work. |
| Baseline | Actual starting content, including the captured snapshot for an existing repository; an origin-machine path cannot substitute for packaged content. |
| Dependency declaration | Required runtime dependencies; installed dependency directories and credentials are excluded from the portable definition. |
| Run configuration | Harnesses, providers, models, efforts, environment settings, judge, and scoring weights associated with one exact template revision. |
| Result reference | Recorded outcome of one configuration on one machine, bound to the exact revision it ran. |
| Identity manifest | Versioned canonical representation of benchmark-defining metadata and payload, normalized relative paths, and each payload file's content digest. |

The manifest and full frozen definition must be available to portable exchange; template ZIPs carry them together. This module supplies their identity semantics, while package handling belongs to [M17](17-zip-exchange.md). **R115, R118**

## Library and revision operations

**Browse and select.** Present every required library field and allow selection of an approved built-in, imported, or custom template. Executing that selection reuses its frozen tasks without invoking a planner or regenerating them. The default is the existing seven-task inventory benchmark, runnable without planning. The library also lists unfinished template drafts as rows marked "draft", with their state (planning, ready for review, failed) and last update; opening one resumes it where it was left, and discarding one asks for confirmation first. Drafts are persisted by [M16](16-custom-template-planning.md) and survive an engine exit. **R018, R030, R136**

**Default after an upgrade.** All built-in revisions stay available. When a release ships a newer built-in revision of the default (for example inventory r2), an installation with no results on its current default moves the default to the newest built-in revision; an installation with results keeps its current default and the library shows a notice: "Inventory r2 is available: what changed · results from r1 and r2 can't be compared · make r2 the default". The user moves the default only through that action. **R018, R136, R151**

**Create.** Accept a multiline project prompt, frontend/backend/fullstack choice, and empty-project or existing-repository-revision baseline choice through [M16](16-custom-template-planning.md). Approval supplies the frozen definition to this module. **R030**

**Duplicate and revise.** Users can duplicate or edit templates into revisions without modifying the approved original. Task, check, baseline, and rubric edits produce a new template revision; identity changes follow the content rules below. Approving a duplicate or revision whose computed SHA-256 equals an existing revision is blocked: approval is disabled with "Identical to <label> — nothing to approve" and an action that opens the existing revision. Renaming is done by editing the lineage display name, which never touches identity. Choosing duplicate or revise on a revision with an active run shows "This creates a new revision. The active run continues on <label>, and its results will not be comparable with the new revision." before the editor opens. Preserve existing inventory task prompt text and its bundled versioned acceptance checks and web rubric. A six-task variant is a different template, not the default seven-task benchmark. [M09](09-default-inventory-benchmark.md) defines that default's task behavior. **R018, R028, R136**

**Configure.** Store selections per template revision rather than as one global harness selection. Users can add or change configurations before a new run without changing template content or overwriting previous results. Imported work can use available destination harnesses: originating executable paths, credentials, and hardware are not requirements of the template. Selection defaults express convenience rather than model-quality recommendations. **R019, R037, R136**

**Delete.** A custom or imported revision can be deleted through the app (TUI or CLI) after confirmation stating what is removed: the revision, its saved configurations and, when it is the lineage's last revision, the template from the library. Deletion is refused for a built-in revision, for a revision with an active run, and for a revision with retained results, because results stay preserved and bound to their revision; the refusal names the reason. Approved files are read-only, so the app restores write permission only for the removal: it takes the revision folder out of use first, then makes only that folder's directories writable as removal requires, and never makes any other revision, or any file, writable. The revision's SHA-256 and label stay recorded as deleted in the lineage, so a label is never reused and a child revision still shows its parent. Deleting outside the app is not supported; folders whose modes were changed by other tools are reported by [M03](03-environment-readiness.md). **R015, R018, R067**

**Exchange and inspect results.** Expose import/export and the results associated with a revision. Delegate package validation to [M17](17-zip-exchange.md) and result retention to [M02](02-retained-results-comparability.md). Historical README runs stay in the repository untouched and are not shown in the app; a result is associated with a revision only through its verified SHA-256, never through a matching name or reported task count. **R015, R018, R028**

## Identity and launch invariants

Define one versioned, deterministic canonical-manifest serialization and compute its SHA-256. Identical definitions must hash identically on macOS and Linux. ZIP compression, entry order, timestamps, local absolute paths, machine identity, and display-only naming do not determine identity. **R118, R141**

The hash covers benchmark-defining metadata and payload, specifically the approved specification, ordered prompts, acceptance checks, required baseline files, execution protocol, and rubric definitions. Changing task order or any covered content creates a new revision. **R067, R118, R119**

Harness/model/effort selections, clean/current settings, concurrency, judge selection, pricing, and adjustable scoring weights belong to run or analysis configuration and do not change the template hash. They remain recorded and visible as comparison differences. Different machines also leave template identity unchanged. **R119, R141**

Before execution, recompute the approved template's SHA-256 and bind each result to that identity. Freeze the run configuration and original scoring weights separately before launch. Every configuration in a comparison receives the same approved task suite and grading profile. Approved revision files are written read-only on disk (files 0444, folders 0555), so accidental edits fail. Baseline executable intent is a hashed `executable: bool` in `metadata.json`; execution and verification copies restore regular files as 0644, executable files as 0755, and directories as 0755. Storage modes and ZIP permission bits never substitute for that flag. AxBenchmark itself makes a revision's folders writable only to remove it during deletion, or to remove the replaced tree after a restore. [M03](03-environment-readiness.md) reports approved revision folders whose modes were changed by anything else (a sync or cleaning tool, a manual `chmod`) with the fix, restoring the revision through the app; changed modes alone never change identity, and the launch identity check still applies. If template inputs still change during execution, the first detection halts the whole run with explicit-stop cleanup; unsealed execution results are interrupted and M11 appends one run-scoped invalidation with reason "template identity invalidated", approved/computed SHA-256 and changed paths. Every result from that run, including already sealed results, is excluded from comparisons without rewriting sealed facts; evidence remains retained. Do not silently assign a different identity to make the run appear valid. **R037, R067**

## Integration and unresolved choices

[M07](07-run-configuration.md) owns revision-scoped launch selections and their freeze. [M11](11-run-orchestration.md) checks identity during a run, halts the run on a detected change and records the interrupted results; this module supplies the check and its changed paths. [M15](15-terminal-interface.md) and [M14](14-command-line-interface.md) expose the library workflow as clients of this module's API. [M02](02-retained-results-comparability.md) retains result links, and [M17](17-zip-exchange.md) verifies cross-machine packages against the canonical identity. These contracts jointly support the selection-to-report workflow. **R002, R017, R018, R019, R067, R141**

The Implementation section fixes the descriptor and manifest schemas, canonical writer, path validation, revision naming and transactional storage layout; revision labels and lineage display names stay display-only. A duplicate or revision with unchanged benchmark content is never registered: its approval is blocked as described under Duplicate and revise. **R003, R018, R118**

## Acceptance criteria

- The library shows all required fields for built-in, custom, and imported templates; the default seven-task inventory template runs without planner calls. **R008, R018, R028, R136**
- Creating, duplicating, revising, importing, and exporting work preserves existing revisions and historical artifacts; independent saved configurations do not overwrite results. Approving content identical to an existing revision is blocked with an action to open it; renaming a lineage leaves every SHA-256 unchanged. **R015, R018, R019, R136**
- Unfinished drafts appear in the library with state and last update, reopen where they were left, survive an engine exit, and are discarded only after confirmation. **R018, R030**
- After an upgrade that ships a newer built-in default revision, an installation without results on its current default moves to it; one with results keeps its default and shows the notice with "make default"; every built-in revision stays available. **R018, R136**
- Changing each benchmark-defining input, including task order, changes its digest; changing only excluded run settings, machine, or display-only name does not. **R118, R119, R141**
- Built-in, planned and imported representations of the same canonical definition retain one SHA-256 across macOS/Linux and ZIP repackaging; the package contains the complete baseline and dependency declarations without installed dependency directories or credentials. **R115, R118, R141**
- Launch recomputes identity, freezes inputs and separate configuration/weights, and binds results accordingly. Approved revision files are read-only on disk. A detected input mutation halts the whole run and records each result as interrupted with both digests and the changed paths, without relabeling it. Duplicate or revise on a revision with an active run shows the non-comparability warning. **R067, R153**
- Deleting a custom or imported revision through the app asks for confirmation, removes its folder and saved configurations, records it as deleted in its lineage, and leaves every other revision's files and modes unchanged; during removal only that revision's directories become writable. Deleting a built-in revision, one with an active run, or one with retained results is refused with the reason and changes nothing. M03 reports a revision folder whose modes were changed outside the app, and restoring it brings back 0444/0555. **R015, R018, R067**
- Imported templates can be configured for destination harnesses without origin-machine paths, credentials, or hardware. Historical README runs are not shown in the app, and names or task counts never confer verified identity. **R019, R028**

## Implementation

This section applies [ARCHITECTURE.md](ARCHITECTURE.md). Everything here is a proposed implementation decision; no runtime implementation or passing runtime tests are claimed. The product contract above and [SPEC.md](../SPEC.md) govern behavior. Findings **F01, F10, F14, F17** are reconciled here.

### Bounded implementation children

Implement in this order; each child lists completed prerequisites separately from published contracts that may be faked. Parent acceptance also requires the real integrations listed in the children.

| Child | Bounded outcome |
|---|---|
| [M01.1 — canonical-definition](implementation/M01/01-canonical-definition.md) | One descriptor/manifest format, writer and reference validator for every producer. |
| [M01.2 — revision-storage](implementation/M01/02-revision-storage.md) | Transaction-scoped registration, immutable storage, restore, mode audit and recoverable removal. |
| [M01.3 — library-service](implementation/M01/03-library-service.md) | Revision/default/draft operations and `templates.*` over the real client foundations. |
| [M01.4 — library-screens](implementation/M01/04-library-screens.md) | Library/template/revision screens, typed navigation and deletion states. |

### 1. Engine component

Package `axbenchmark.engine.library`. The built-in inventory content is registered by `engine.library.builtin` ([M09](09-default-inventory-benchmark.md)) through the `BuiltinCatalog` port below; it adds no API methods.

#### Canonical definition contract — `axbenchmark-definition/1`

M01 owns the descriptor schema and writer; M09 authoring YAML and M16 draft data are inputs, while M17 validates and preserves their output. The public pure boundary is `DefinitionCodec.write(input: DefinitionInput, files: Sequence[PayloadFile]) -> CanonicalPayload` and `DefinitionCodec.read(payload: CanonicalPayload) -> TemplateDefinition`. `PayloadFile` is `(path: RelPath, role: PayloadRole, content: bytes)`; `CanonicalPayload` contains immutable payload files including the generated `metadata.json`; `TemplateDefinition` is always derived from those bytes. `DefinitionInput` has exactly the descriptor fields below, without a second definition object carried alongside serialized input. Authoring display metadata is supplied separately as `DisplayMetadata(name: str, description: str, task_titles: Mapping[TaskId, str])` to registration/UI, never to the writer. **F01, R115, R118–R120, R141**

All fields in this table are required, including empty arrays. Unknown keys at every level, duplicate JSON keys, invalid UTF-8, booleans in integer fields, non-finite numbers, unsupported versions and null values are rejected. Identifiers are case-sensitive strings matching `[A-Za-z][A-Za-z0-9_-]{0,63}`. Paths use `RelPath` below. There are no inferred default values.

| Field | Exact value / shape | Validation and payload role |
|---|---|---|
| `format` | Literal `"axbenchmark-definition/1"` | Descriptor format, independent of manifest version. |
| `project_type` | `"frontend"`, `"backend"` or `"fullstack"` | Defines required work and rubric applicability. |
| `specification` | `RelPath` | One existing `specification` file. |
| `tasks` | Nonempty ordered array of `{ "task_id": Id, "prompt_path": RelPath, "check_ids": [Id, ...] }` | Unique task ids and prompt paths; prompt role `task_prompt`. `check_ids` are unique per task and ordered as in the suite; an explicit empty list is allowed and means no task-specific checks. Task order is preserved. |
| `acceptance_checks` | `{ "suite_path": RelPath, "support_paths": [RelPath, ...] }` | Suite and every check runner/helper/fixture have role `acceptance_checks`; support paths are unique and sorted by UTF-8 path bytes. Suite is required even if its check list is empty. |
| `execution_protocol` | `RelPath` | Required `execution_protocol` file; execution rules and expected output entry point live here, not as references to missing future output files. |
| `services` | `RelPath` | Required `services` file containing approved setup/start/readiness/stop/test instructions; a no-service definition supplies an explicit empty instruction document in the owning format. |
| `rubric` | `{ "path": RelPath, "profile_id": Id }` | Existing `rubric` file whose parsed profile id equals the reference and whose profile supports `project_type`; M12 owns rubric content/version. |
| `dependencies` | `RelPath` | Required `dependencies` declaration file; an empty dependency declaration is explicit, never omitted. Installed directories and credentials are not payload. |
| `baseline` | `{ "kind": "empty" or "repository", "files": [{ "path": RelPath, "executable": bool }, ...] }` | `empty` requires `files: []`; `repository` allows zero or more regular-file entries, each with role `baseline`, under `baseline/`, unique and sorted by UTF-8 path bytes. `executable` is required even when false. Strip exactly the `baseline/` prefix to obtain the workspace path. No symlinks, submodules or special files. |

Example descriptor below is displayed with indentation for reading; the writer emits it compactly with sorted object keys and one trailing LF. Its referenced files must be supplied, so this example is a descriptor shape, not a stand-alone valid package.

```json
{
  "format": "axbenchmark-definition/1",
  "project_type": "frontend",
  "specification": "spec/00-project.md",
  "tasks": [{"task_id": "T1", "prompt_path": "tasks/T1.md", "check_ids": ["T1_commit"]}],
  "acceptance_checks": {"suite_path": "checks/acceptance.v1.json", "support_paths": ["checks/repository.py"]},
  "execution_protocol": "protocol/execution.yaml",
  "services": "protocol/services.yaml",
  "rubric": {"path": "rubric/web.v1.json", "profile_id": "web"},
  "dependencies": "deps.yaml",
  "baseline": {"kind": "empty", "files": []}
}
```

**Reference closure.** Exactly one payload entry is `metadata.json` with role `metadata`; `manifest.json` is reserved for the manifest and cannot be a payload path. Every other payload entry is referenced in the table, and every reference resolves to exactly one entry with its stated role. No orphan authoring file or undeclared baseline file is admitted. One file cannot serve different roles. The M08 `CheckFormat` schema supplies the suite's unique check ids, task ids and entry paths: every check belongs to a declared task, every task's `check_ids` equals the suite's checks for that task in suite order, and each entry/helper/fixture reference resolves into `support_paths`. M12's published `RubricSource.parse` schema validates `profile_id` and applicability. M05/M08 own the protocol/service/dependency content formats; all file-valued references in those formats are validated against declared payload or explicitly typed *future workspace output* references. Runtime paths such as `index.html` must not be mistaken for missing frozen payload. These parser contracts are available in Bootstrap; implementations can be fixture-injected for M01.1, then require real parsers at the integration gate.

**Canonical writing and reading.** `write` validates the input, NFC-normalizes authoring paths before checking collisions, sorts only set-like arrays (`support_paths` and baseline files), retains task and check order, and writes `json.dumps(..., sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)` encoded as UTF-8 plus one LF. No defining text-file bytes, line endings, whitespace or Unicode content are normalized. `read` requires the descriptor bytes to equal the canonical re-serialization; M17 rejects noncanonical descriptors rather than silently rehashing/relabeling them. The file list must contain only regular files with normalized unique paths; normalized/case-folded collisions and file/directory-prefix collisions are rejected for portable materialization. An untrusted archive is path-validated before a filesystem write. **F01**

The manifest is exactly `{ "format": "axbenchmark-manifest/1", "entries": [{ "path": RelPath, "role": PayloadRole, "sha256": lowercase_hex_64, "size": nonnegative_integer }, ...] }`; no extra fields are accepted. Entries are sorted by UTF-8 path bytes, and the manifest uses the same JSON settings and trailing LF. Each entry hashes the full bytes of its corresponding payload file, including `metadata.json`; the template identity hashes the canonical manifest bytes. The manifest itself is not an entry. Imports require exact manifest bytes and recomputed sizes/digests/roles/reference closure to agree. There is no independent empty-baseline digest: an empty baseline is the hashed `baseline` declaration, and the entire template still has its normal manifest digest.

**Executable semantics.** `BaselineFile(path, executable)` is derived from the descriptor. M16 maps Git regular-file modes 100644/100755 to false/true. Identical bytes with different flags produce different descriptor and template hashes. Approved storage remains 0444/0555 for both. `FrozenRevision.baseline_files` exposes bytes plus semantic flags; M05 competitor workspaces and M08 disposable verification copies write files as 0644/0755 and directories as 0755 from this contract. M17 ignores ZIP permission bits and preserves the descriptor flags. Source repository location/commit, display names/descriptions/task titles, authoring YAML, labels, generated approval timestamps and planner provenance remain outside the defining payload; changing a title embedded in actual prompt/check/rubric content still changes those defining bytes. **F10, R068, R115, R119, R140**

**Domain** (`engine/library/domain/`, frozen slotted dataclasses, no I/O):

| Type or rule | Contents |
|---|---|
| `RelPath` | Normalized payload path: relative, POSIX `/` separators, Unicode NFC, no empty, `.` or `..` segments, no backslash, colon, NUL/control characters or leading `/`. Canonical reader rejects non-NFC paths; the authoring writer normalizes before collision validation. Construction rejects anything else with `UnsafePath`. |
| `PayloadRole` | `metadata`, `specification`, `task_prompt`, `acceptance_checks`, `execution_protocol`, `services`, `rubric`, `baseline`, `dependencies`. |
| `ManifestEntry` | `path: RelPath`, `role: PayloadRole`, `sha256: Sha256`, `size: int`. |
| `CanonicalManifest` | `format = "axbenchmark-manifest/1"`, `entries: tuple[ManifestEntry, ...]`. `serialize() -> bytes`: UTF-8 JSON, keys sorted, `separators=(",", ":")`, `ensure_ascii=False`, `allow_nan=False`, entries sorted by the UTF-8 bytes of `path`, one trailing LF. `digest() -> Sha256` is SHA-256 of those bytes and is the template SHA-256. Physical file modes, timestamps, absolute roots, ZIP order and compression are never inputs; semantic baseline executable flags are covered through descriptor bytes. **R118, R141** |
| `TemplateDefinition` | The frozen parsed descriptor above: project type, ordered `TaskDef(task_id, prompt_path, check_ids)`, specification/protocol/services/dependency paths, check-suite and support paths, rubric reference and `BaselineFile(path, executable)` entries. Derived solely from `metadata.json`; UI titles come from excluded display metadata with task id as fallback. |
| `TemplateRevision` | `sha256`, `template_id` (local lineage id, never identity), `label` (`r1`, `r2`, display only), `parent_sha \| None`, `source: builtin \| custom \| imported`, `approved_at`, `manifest`, `definition`, `deleted_at \| None` (a deleted revision stays in its lineage as a tombstone: SHA-256, label, parent; no files). |
| `Lineage` | `template_id`, display name, description, `revisions` in creation order, duplicates (lineages created by duplicate from this one). Lineage is navigation only. The display name is the template's name everywhere; renaming changes only this field and never a revision's manifest or SHA-256. `validate_name(name)`: 1–80 characters after trimming, no control characters. |
| `IdentityCheck` | `approved: Sha256`, `computed: Sha256`, `changed: tuple[PathChange, ...]` (`path`, `kind: modified \| missing \| added`), `checked_at`; `matches` is `approved == computed`. |
| `FrozenDraft` | Registration input: `display: DisplayMetadata` (lineage name/description/task titles, carried beside the payload and never hashed), `payload: CanonicalPayload`. There is no caller-supplied independent `definition`. `RevisionRegistry.prepare` validates descriptor bytes and derives the definition, manifest and SHA-256 from this payload alone. Produced by M16 (`to_frozen`, `DraftStore.inspect`). |
| `RevisionDiff` | `diff(parent, child) -> RevisionDiff`: task-order moves, added/removed/modified entries by role, and the roles left unchanged. Drives the approval preview. |
| `DefaultPointer` | `default_sha256` of the built-in default revision, `set_by: install \| upgrade \| user`, `set_at`. |
| `choose_default(pointer, candidates, results_on) -> DefaultDecision` | Pure. `candidates` are the built-in revisions M09 reports as valid default candidates, newest last. No pointer (new installation) → newest. Pointer on the newest → unchanged. Pointer on an older candidate with no results (`results_on(pointer) == 0`) → newest, `set_by = upgrade`. Pointer on an older candidate with results → unchanged, plus `DefaultNotice(current, available = newest, changes = RevisionDiff(current, newest))`. Pointer on a revision that is no longer a valid candidate → newest candidate with results, else newest, and the notice when that is not the newest. **R018, R136** |
| `approval_verdict(computed, index) -> Verdict` | `new_identity`, or `existing_identity(existing_sha256, label)` when any registered or built-in revision has the computed SHA-256. An existing identity blocks approval (`IdenticalRevision`); it is never registered as a lineage pointer. |
| `READ_ONLY_FILE_MODE`, `READ_ONLY_DIR_MODE` | `0o444` and `0o555`, the modes of every materialized revision entry. `RevisionModeDrift(sha256, folder, template_name, label, deviations: tuple[ModeDeviation(path, kind: file \| directory, expected_mode, found_mode), ...], deviation_count)` describes a folder where any entry differs; M03 turns it into a readiness finding. **R067** |
| `deletion_check(revision, active_runs, result_count, config_count, reserved) -> DeletionPlan` | Pure. Refuses a built-in (`BuiltinReadonly`), a revision with an active run (`RevisionInUse(runs)`) or with retained results (`HasResults(count)`); an unresolved transaction reservation refuses with `PublicationPending`. Otherwise `DeletionPlan(sha256, label, config_count, removes_lineage, delete_plan_id)`, where `removes_lineage` is true when no other live revision remains in the lineage; its `effect` text is "Deletes <name> <label> (<short8>) and its N saved configurations. [The template leaves the library.] Results: none. This cannot be undone." **R015, R067** |
| `NOT_COVERED` | The fixed list of settings outside identity shown on the Identity tab: harness/provider/model/effort, environment mode, concurrency, judge, pricing and exchange rates, quality and ranking weights, machine/OS/hardware/executable paths, display name, ZIP order, timestamps. Returned as data so no interface hard-codes it. **R119, R141** |
| Domain errors | `UnsafePath`, `PayloadMissing(path)`, `DefinitionIncomplete(missing_roles)`, `DefinitionInvalid(field, reason)`, `NoncanonicalDefinition`, `PayloadRoleMismatch(path)`, `PublicationPending(transaction_id)`, `IdentityMismatch(check)`, `RevisionNotFound(sha)`, `DraftNotFound(id)`, `IdenticalRevision(existing_sha256, label)`, `NameInvalid(reason)`, `NotDefaultCandidate(sha)`, `BuiltinReadonly`, `RevisionInUse(runs)`, `HasResults(count)`, `RevisionDeleted(sha)`, `DeletePlanChanged`. |

**Ports** (`engine/library/ports.py`, `typing.Protocol`):

```python
class LibraryIndexRepository(Protocol):
    async def load(self, view: PublicationView) -> LibraryIndex: ...          # raises IndexUnreadable(path, os_error)
    async def prepare(self, tx: TransactionId, change: IndexChange) -> RegistrationToken: ...  # durable, invisible overlay
    async def rollback(self, tx: TransactionId, token: RegistrationToken) -> None: ...  # own unpublished changes only

class ObjectStore(Protocol):                           # content-addressed payload bytes
    async def put(self, data: AsyncIterator[bytes]) -> tuple[Sha256, int]: ...
    async def has(self, digest: Sha256) -> bool: ...
    def open(self, digest: Sha256) -> AsyncIterator[bytes]: ...

class DefaultPointerRepository(Protocol):
    async def load(self) -> DefaultPointer | None: ...   # raises PointerUnreadable(path, os_error)
    async def save(self, pointer: DefaultPointer) -> None: ...   # atomic replace

class RevisionFiles(Protocol):                         # materialized tree read by execution
    async def materialize(self, tx: TransactionId, manifest: CanonicalManifest) -> PreparedTree: ...  # invisible tree, files 0444/directories 0555
    async def replace(self, manifest: CanonicalManifest) -> None: ...       # restore: new read-only tree, then swap
    async def retire(self, sha: Sha256) -> RetiredTree: ...                  # rename revisions/<sha> to revisions/.del-<sha>; no mode change
    async def unretire(self, tree: RetiredTree) -> None: ...                 # rename back; used when the index write fails
    async def remove(self, tree: RetiredTree) -> None: ...                   # u+w on that tree's directories only, then remove
    def drift(self) -> AsyncIterator[RevisionModeDrift]: ...                 # lstat walk of revisions/<sha>; read only
    def scan(self, sha: Sha256, view: PublicationView) -> AsyncIterator[FileDigest]: ...   # path, sha256, size; streams hashing
    async def read_text(self, lease: RevisionReadLease, path: RelPath) -> str: ...

class BuiltinCatalog(Protocol):                        # implemented by engine.library.builtin (M09)
    def builtins(self) -> Sequence[BuiltinTemplate]: ...  # files, pinned approved digest, default_candidate, revision order

class ContractDescriber(Protocol):                     # implemented by engine.library.builtin (M09)
    def contract(self, sha: Sha256) -> FrozenContract | None: ...
    def coverage(self, sha: Sha256) -> CheckCoverage | None: ...
    def relation(self, entries: Sequence[LibraryEntry]) -> Mapping[Sha256, DefaultRelation]: ...
```

Plus shared ports: `PublicationTransactions` (one publication marker, captured read views and serialized mutations), `Clock`, `IdGenerator`, `EventPublisher`, and the other modules' application Protocols listed in part 3 (`ReadinessGate`, `RevisionConfigs`, `RevisionResults`, `DraftStore`, `CheckIndex`, `RubricIndex`, `ActiveRuns`).

**Application** (`engine/library/application/`, one class per use case, ports injected in `__init__`):

| Use case | Kind | Behavior |
|---|---|---|
| `ListTemplates` | query | Built-ins first (default marked), then index entries; optional text filter on name, type, source. An unreadable index returns built-ins plus `index_error`, never an exception. Captures one `PublicationView` for the index, configuration and result counts; staged rows are never exposed. Adds config/result counts, capabilities (`can_delete` from `deletion_check`, including transaction reservations) and the current `DefaultNotice`, if any. Deleted revisions are not listed. **R018, R136** |
| `GetTemplate` | query | One revision's library fields, summaries, last identity check and capabilities, plus `active_run_notice` when `ActiveRuns.for_revision(sha)` is non-empty. **R067** |
| `ListRevisions` | query | Lineage tree for a template id; a missing lineage record still lists revisions by SHA-256 with `lineage_error`. |
| `GetTasks` | query | Ordered tasks, prompt Markdown, shared specification path, per-task check titles. |
| `GetManifest` | query | Manifest entries, template SHA-256, `NOT_COVERED`, last `IdentityCheck`. |
| `VerifyIdentity` | job | Streams `RevisionFiles.scan`, rebuilds the manifest, compares, records and publishes the check. Progress is files hashed of total. **R067** |
| `StartRevision` | command | Seeds a draft in M16's draft store from an approved revision (or from its modified on-disk tree after a blocked launch), with mode `revision \| duplicate`, name and scope hints. Returns the same `active_run_notice` as `GetTemplate`; the notice never blocks. **R067** |
| `PreviewApproval` | query | Captures `DraftStore.inspect(draft_id) -> DraftApprovalInput(version, frozen)`; computes that frozen payload's manifest/digest, `RevisionDiff` against the source, `approval_verdict` and copyable configuration count. Returns the same inspected `version` for approval. An `existing_identity` verdict disables approval with `templates.identical_revision`. |
| `ApproveRevision` | command | Under the shared mutation lock, calls `DraftStore.inspect` and requires `DraftApprovalInput.version == base_version`; otherwise raises `planning.draft_conflict` without mutation. Revalidates that inspected frozen payload and `approval_verdict`; an existing identity raises `IdenticalRevision` and registers nothing. Prepares its new revision (or lineage for `duplicate`), optional M07 configuration copies and `DraftStore.prepare_approved(tx, draft_id, inspected.version, sha)` under one transaction. Rechecks/reserves that same version through publication, serialized against edits/regeneration; a changed version cannot be silently approved. All participants become visible at the shared publication marker; failure before it rolls back only this transaction, while failure afterwards rolls forward. Display metadata is stored beside the revision, outside its payload. **R018, R019, R136** |
| `RenameLineage` | command | `validate_name`; sets the lineage display name in `index.yaml`. No manifest, digest, configuration or result changes. Built-in lineages are not renamed (`templates.builtin_readonly`). Also used by M16 after approval. |
| `SetDefault` | command | Moves the `DefaultPointer` to a built-in revision that M09 reports as a valid default candidate, `set_by = user`; clears the notice when it is the newest. |
| `RestoreRevision` | command | Writes a fresh read-only tree from the object store (or built-in package data) through `RevisionFiles.replace`, then re-verifies. The replaced tree is retired and removed with the same procedure as `DeleteRevision`, so a restore also clears a mode drift. |
| `DeleteRevision` | command | `deletion_check` with `ActiveRuns.for_revision`, `RevisionResults.counts` and `RevisionConfigs.summaries`; a refusal changes nothing. Under the shared mutation lock, repeat the refusal checks and validate the confirmed deletion plan against current config count/lineage state. Prepare an index tombstone and M07 configuration removals under one transaction, retaining the read-only tree for any earlier pinned read view. Publish both at one marker, then retire/reclaim the tree after existing read leases drain and publish `templates.revision.deleted`. Failure before publication leaves the live revision/configurations intact; failure afterwards schedules durable cleanup, never rolls back the visible deletion. A pending import token or active read/mutation lease prevents competing retirement; no command sees a missing tree for a visible revision. Only the retired tree's directories are made writable (owner write, added just before removing their entries); files keep 0444, since unlinking needs write permission on the containing directory only, and no other revision or object is touched. **R015, R067** |
| `AuditRevisionModes` | query (in-engine) | Streams `RevisionFiles.drift()` and returns every live revision folder whose files are not 0444 or directories not 0555, with template name and label from the index or `BuiltinCatalog`. Never changes a mode. Backs `RevisionPermissions` for M03. **R067** |
| `RegisterBuiltins` | startup | Runs M09's `LoadBuiltins` through `BuiltinCatalog`; computes each built-in's identity and compares it with its pinned digest; a mismatch lists it with `identity_status = mismatch`, it is never re-pinned. A built-in with contract violations stays listed as built-in but is never a default candidate, with `templates.builtin_invalid`. Then applies `choose_default` with `RevisionResults.counts` and saves the pointer when it changed. **R136** |
| `GetContract`, `GetPrompts`, `GetCoverage`, `GetFile`, `GetLookalike` | query | Back `templates.contract`, `.prompts`, `.coverage`, `.file`, `.lookalike`: payload files through `RevisionFiles`, contract, coverage and default relation through M09's `ContractDescriber`. |

Provided to other modules as application interfaces (in-engine Protocols, not API methods):

```python
class TemplateIdentity(Protocol):          # M09, M16, M17, M11, M05
    def compute(self, payload: CanonicalPayload) -> CanonicalManifest: ...  # validates descriptor/reference closure first
    def parse_definition(self, payload: CanonicalPayload) -> TemplateDefinition: ...  # delegates DefinitionCodec.read; no competing definition
    async def check(self, sha: Sha256) -> IdentityCheck: ...   # launch and in-run mutation detection
    def verdict(self, computed: Sha256) -> Verdict: ...         # M16 approval: new_identity | existing_identity(sha, label)
    # In a run, M11 calls check(); a check with matches=False is the first detection: M11 halts the whole run and
    # records each configuration as interrupted with reason "template identity invalidated" and this check's
    # approved, computed and changed paths. M01 never rebinds the result and never re-pins the revision.

class LineageNames(Protocol):              # M16 approval and post-approval rename
    async def rename(self, template_id: TemplateId, name: str) -> None: ...   # raises NameInvalid

class RevisionRegistry(Protocol):          # M16 approval, M17 import; never publishes alone
    async def prepare(self, tx: TransactionId, draft: FrozenDraft, origin: Origin,
                      parent: Sha256 | None) -> Registration: ...
    async def prepare_staged(self, tx: TransactionId, staged: StagedRevision,
                             origin: Origin) -> Registration: ...  # revalidates canonical descriptor/manifest
    async def commit_view(self, tx: TransactionId) -> None: ...  # asserts participant durable/ready; does not publish
    async def rollback(self, tx: TransactionId, token: RegistrationToken) -> None: ...
    # Registration(sha256, created: bool, token: RegistrationToken, transaction_id).
    # A new tx targeting pre-existing identical content returns created=False and reserves that revision.
    # Same-tx/same-intent prepare or prepare_staged returns the ORIGINAL token and created flag.
    # Persist intent + receipt atomically; retry cannot reinterpret its own prepared creation as pre-existing.
    # Same tx with different intent fails; rolled-back intents cannot be prepared again.
    # rollback cannot remove an existing record or any record from another transaction. A published tx cannot roll back.

class RevisionReader(Protocol):            # M05 workspaces, M07, M08, M12, M13, M17 export
    async def open(self, sha: Sha256, view: PublicationView | None = None) -> FrozenRevision: ...   # raises IdentityMismatch before handing out files

class TemplateDirectory(Protocol):         # M02, M17
    async def describe(self, sha: Sha256, view: PublicationView | None = None) -> TemplateLabel | None: ...   # name, revision label, built-in; None when unknown

class RevisionPermissions(Protocol):       # M03 readiness finding environment.revision_permissions_changed
    async def audit(self) -> Sequence[RevisionModeDrift]: ...   # read only; empty when every folder is 0444/0555
```

`RevisionReader.open` captures a view if none was supplied and returns a read lease released with `FrozenRevision.close()` (also an async context manager). It exposes lease-backed file reads (including `baseline_files`), not unchecked raw filesystem paths; directory handles preserve access if a generation is renamed. Reads remain valid until lease release; retirement and restore reclamation wait for those leases. Cross-store callers must pass their already captured view. Staged or unknown revisions are indistinguishable as `RevisionNotFound` to public callers. On any in-run mismatch, the caller forwards `IdentityMismatch` to M11’s `RunInvalidationCoordinator`; it must not relabel it as an ordinary check/judge failure. `RevisionReader.open` on a deleted revision raises `RevisionDeleted`, mapped to `templates.not_found` with `deleted: true`.

**Adapters** (`engine/library/adapters/`): `YamlLibraryIndex` (ruamel.yaml, durable transaction overlays with temp file + `os.replace`; the shared publication marker controls visibility), `YamlDefaultPointer` (same write discipline), `FsObjectStore`, `FsRevisionFiles` (hashing in `asyncio.to_thread`, 1 MiB chunks, symlinks rejected as `UnsafePath`; materialized files `chmod 0444` and directories `0555` before the rename into place, so an edit through the normal file API fails; `replace` writes a new tree beside the old one and swaps by rename; `retire` renames within `revisions/`, which keeps normal directory modes; `remove` walks the retired tree bottom-up, adds owner write to each directory with `os.chmod` just before removing its entries, never changes a file's mode, and refuses any path outside `revisions/.del-*`; `drift` compares `stat.S_IMODE(os.lstat(p).st_mode)` with the expected modes and skips `.tmp-*` and `.del-*` trees), `PackageBuiltinCatalog` (in `engine/library/builtin/`, `importlib.resources`), and `rpc.py`, which maps `axbenchmark.api.templates` DTOs to use-case inputs and domain errors to the error codes in part 2.

**Persisted state** (the engine is the only reader and writer):

```
~/.axbenchmark/library/
  index.yaml                    lineages: template_id, display name, description, source, revisions
                                (sha256, label, parent_sha, origin, approved_at, deleted_at), last identity check
  default.yaml                  DefaultPointer (default_sha256, set_by, set_at)
  objects/sha256/ab/<digest>    content-addressed payload files, mode 0444, written once
  revisions/<sha256>/           manifest.json + materialized files, read by execution; files 0444, directories 0555
  staged/<transaction_id>/     index overlay and prepared revision references; invisible until published
  revisions/.del-<sha256>/      retired tree after publication/read-lease drain; never newly opened
```

Built-ins are never written to `index.yaml`, so an unreadable index cannot hide them. An unreadable `default.yaml` is reported as `index_error` and `choose_default` runs as if the pointer were on a revision that is no longer a candidate, so a default with results is kept rather than silently moved. Unfinished drafts are not stored here; [M16](16-custom-template-planning.md) persists them under `~/.axbenchmark/drafts/`. Registration order: content-addressed objects (idempotent), read-only staged tree, transaction-tagged index overlay, durable participant acknowledgement, then the coordinator's single publication marker. `commit_view` is only the acknowledgement; it is not a local commit point. Queries resolve the captured marker set against overlays; compaction into `index.yaml` cannot change the visible snapshot or discard data needed by pinned views. Imported result registration is coordinated by M17 with M02 and M01. If participant preparation became durable before its receipt reached the coordinator journal, recovery repeats the same transaction/intent to recover the original receipt before rollback; journaled receipts are used directly, never re-preparing rolled-back entries. M01 owns revision/duplicate approval coordination, optional config copies, deletion/config removal and registry invariants. M16 owns planned `ApproveDraft` coordination, including planner provenance, through the same public `RevisionRegistry`, `DraftStore` and `PublicationTransactions` ports. Each coordinator awaits participant `commit_view` acknowledgements and publishes one marker; neither accesses another owner's private store or independently commits a participant.

Deletion publishes the tombstone and configuration removal together, drains earlier read leases, retires and removes only the deleted tree, then collects objects unreferenced by any live, built-in, staged or pinned revision. Restore stages a replacement verified tree, atomically selects it and retires the old generation only after leases drain; it never mutates approved file bytes or modes in place. Journals retain exact transaction tokens, intended old/new references and cleanup steps. Recovery finishes **before** readers are admitted: unpublished work rolls back only records it created; published work finishes cleanup and event outbox delivery. Unresolved rollback blocks startup with an actionable error and keeps the transaction hidden. A raw `.del-*` filename is not evidence of a committed deletion; cleanup follows journal state. Disconnect after publication cannot withdraw a revision. Saved configurations ([M07](07-run-configuration.md)) and results ([M02](02-retained-results-comparability.md)) remain in their owners' stores. **F14**

**Processes owned**: none. Hashing runs in worker threads inside the engine; Git access for repository baselines belongs to [M16](16-custom-template-planning.md).

### 2. API surface (`templates.*`)

DTOs live in `axbenchmark.api.templates`. Every revision is addressed by its full 64-character `sha256`. `ActionState = {enabled: bool, reason: str | None}` where `reason` is an error code.

`TemplateCapabilities` (returned by `templates.list` per row and by `templates.get`; each flag is an `ActionState`):

| Flag | False when (reason) |
|---|---|
| `can_configure` | no supported harness (`environment.no_harness`) |
| `can_create` | no supported harness (`environment.no_harness`) |
| `can_revise`, `can_duplicate` | revision unknown (`templates.not_found`) |
| `can_rename` | built-in lineage (`templates.builtin_readonly`) |
| `can_delete` | built-in revision (`templates.builtin_readonly`), active run (`templates.revision_in_use`), retained results (`templates.has_results`), unresolved publication reservation (`templates.publication_pending`) |
| `can_export` | last identity check failed (`templates.identity_mismatch`) |
| `can_import` | always enabled |
| `can_about` | the row is not a built-in inventory revision, i.e. M09 has no contract for it (`templates.no_contract`) |
| `can_compare_default` | the row is not a look-alike of the default (`templates.not_lookalike`) |
| `can_make_default` | the row is not a valid built-in default candidate (`templates.not_default_candidate`) or is already the default (`templates.already_default`) |

**Queries** (safety class `read`):

| Method | Request | Response | Errors |
|---|---|---|---|
| `templates.list` | `query: str = ""` | `TemplateList{items: [TemplateRow], total: int, default_sha256, default_notice: DefaultNoticeDTO \| None, index_error: ErrorInfo \| None}`; `TemplateRow{sha256, template_id, name, project_type, source, task_count, label, is_default, default_relation: default \| lookalike \| none, config_count, result_count, identity_status, capabilities}`; `DefaultNoticeDTO{current_sha256, current_label, available_sha256, available_label, text, changes: [ChangeLine], can_make_default}` | none (index failure is `index_error`) |
| `templates.get` | `sha256` | `TemplateDetail{row fields, description, approved_at, baseline_summary, checks_summary{count, version}, rubric_summary{profile, categories}, saved_configs: [ConfigSummary{config_id, name, entry_count}], results: ResultCounts{total, local, imported, latest: RunSummary \| None}, last_check: IdentityCheckDTO \| None, active_run_notice: str \| None, delete_effect: str \| None, delete_plan_id: str \| None, capabilities}`; `delete_effect` is `DeletionPlan.effect` and `delete_plan_id` is an opaque plan token bound to sha/config count/last-revision status when `can_delete` is enabled; `active_run_notice` is "This creates a new revision. The active run continues on <label>, and its results will not be comparable with the new revision." | `templates.not_found`, `templates.index_unreadable` |
| `templates.revisions` | `template_id` | `RevisionTree{name, nodes: [RevisionNode{sha256, label, source, status, parent_sha256, created_at, config_count, result_count}], duplicates: [RevisionNode], lineage_error: ErrorInfo \| None}`; a deleted revision is a node with `status: deleted` and no counts | `templates.not_found` |
| `templates.tasks` | `sha256` | `TaskList{spec_path, tasks: [TaskDTO{task_id, title, prompt_path, prompt_markdown, checks: [CheckTitle]}], check_count}` | `templates.not_found`, `templates.payload_missing{path}` |
| `templates.manifest` | `sha256` | `ManifestView{format, sha256, entries: [ManifestEntryDTO{path, role, sha256, size}], not_covered: [str], last_check}` | `templates.not_found`, `templates.payload_missing{path}` |
| `templates.contract` | `sha256` | `TemplateContractDTO{sha256, name, label, source, is_default, rows: [ContractRowDTO{element, text}], left_open: [str], notes: [str], check_count, rubric_label, planning_required, capabilities{can_configure, can_show_prompts, can_show_checks}}` from M09's `ContractDescriber` | `templates.not_found`, `templates.no_contract` (not a built-in), `templates.builtin_invalid{violations}` |
| `templates.prompts` | `sha256` | `PromptsDTO{sha256, label, source, read_only, groups: [PromptGroupDTO{name, files: [PromptFileDTO{path, title, text, sha256}]}], note}`; files in run order, `text` is the payload bytes decoded as UTF-8 without normalization. Any revision. | `templates.not_found`, `templates.payload_missing{path}` |
| `templates.coverage` | `sha256` | `CoverageDTO{sha256, suite_path, suite_label, check_count, phase_counts: {unique, at_task, final_regression, final_artifact, final_history}, bar_text, tasks: [TaskCoverageDTO{task_id, title, covers, checks: [CheckRowDTO{check_id, title, kind, requirement, phases, observation_summary, evidence_kinds}]}], also_checked: [], left_open: [str], capabilities{can_open_suite}}`; rows/counts derive from M08's frozen definitions, with M09's `ContractDescriber` supplying built-in coverage. `check_count == phase_counts.unique`; `covers`/`left_open` are display text (empty for other revisions); `also_checked` stays empty | `templates.not_found`, `templates.no_checks` |
| `templates.file` | `sha256`, `path` | `FileDTO{path, text, sha256, media_type}` for one payload file, so no client reads `~/.axbenchmark/` or package data | `templates.not_found`, `templates.file_not_found{path}`, `templates.payload_missing{path}` |
| `templates.lookalike` | `sha256` | `LookalikeDTO{default: CompareColumnDTO, other: CompareColumnDTO, rows: [CompareRowDTO{label, default_value, other_value, emphasis}], capabilities{can_open_other}}` | `templates.not_found`, `templates.not_lookalike` |
| `templates.approval_preview` | `draft_id` | `ApprovalPreview{version: int, source{label, sha256}, computed_sha256, changes: [ChangeLine{kind: order \| added \| removed \| modified, subject}], unchanged: [str], verdict: new_identity \| existing_identity, existing_sha256 \| None, existing_label \| None, copyable_configs: int, can_approve: ActionState}`; with `existing_identity`, `can_approve` is `{enabled: false, reason: "templates.identical_revision"}` and the verdict text is "Identical to <existing_label> — nothing to approve" | `templates.draft_not_found`, `templates.draft_incomplete{missing_roles}` |

Coverage rows preserve M08’s `requirement: {id, source_ref, statement}` and `phases: [{phase, target, prerequisite_task_ids}]` exactly. `observation_summary` is engine-produced display text derived from the frozen `observation.strategy_ref` and `expected`; `evidence_kinds` is the frozen nonempty evidence-kind list. M01’s coverage `CheckRowDTO` is in `api.templates`, distinct from M08’s runtime outcome row. The released M09 catalog has **30 unique checks**, T1–T7 counts **6/4/5/2/6/4/3**, `phase_counts = {unique: 30, at_task: 30, final_regression: 30, final_artifact: 19, final_history: 11}`. These are derived and validated against the suite, not hard-coded for other templates. A complete trial may have 60 outcomes; that is neither suite size nor a combined phase denominator, and historical checks are never described as observing T7’s delivered artifact. **F11, R021–R028**

**Commands**:

| Method | Request | Response | Errors | Safety |
|---|---|---|---|---|
| `templates.start_revision` | `source_sha256`, `mode: revision \| duplicate`, `name`, `scope: [prompts, checks, baseline, rubric]`, `seed: approved \| on_disk = approved` | `RevisionDraftRef{draft_id, source_sha256, mode, active_run_notice: str \| None}` | `templates.not_found`, `templates.name_invalid{field}` | `write` |
| `templates.approve_revision` | `draft_id`, `base_version: int`, `copy_configs: bool = False` | `RevisionApproved{sha256, template_id, label, copied_configs: int}` | `templates.draft_not_found`, `templates.draft_incomplete`, `planning.draft_conflict{expected_version, actual_version}`, `templates.identical_revision{existing_sha256, existing_label}`, `configs.*` from the copy (nothing registered) | `write` |
| `templates.rename` | `template_id`, `name` | `LineageRenamed{template_id, name}` | `templates.not_found`, `templates.name_invalid{field: name}`, `templates.builtin_readonly` | `write` |
| `templates.set_default` | `sha256` | `DefaultSet{default_sha256, label}` | `templates.not_found`, `templates.not_default_candidate`, `templates.already_default` | `write` |
| `templates.restore` | `sha256` | `IdentityCheckDTO` after re-verification | `templates.not_found`, `templates.restore_unavailable{paths}` | `destructive` (discards on-disk edits) |
| `templates.delete` | `sha256`, `delete_plan_id` | `RevisionDeleted{sha256, template_id, label, removed_configs: int, lineage_removed: bool, cleanup_pending: bool}` | `templates.not_found`, `templates.builtin_readonly`, `templates.revision_in_use{runs}`, `templates.has_results{count}`, `templates.publication_pending`, `templates.delete_plan_changed` (refresh and reconfirm), `templates.delete_failed{path, os_error}` (unpublished: nothing changed); successful published deletion includes `cleanup_pending: bool`, with durable cleanup errors exposed by readiness | `destructive` (removes the revision's files and saved configurations; write permission is restored only on that revision's directories, only for the removal) |

**Jobs** (return `JobRef`; progress through `job.progress` / `job.finished`, cancel through `jobs.cancel`):

| Method | Request | Progress payload | Result | Errors | Safety |
|---|---|---|---|---|---|
| `templates.verify` | `sha256` | `{hashed: int, total: int, path}` | `IdentityCheckDTO{approved_sha256, computed_sha256, matches, changed: [{path, kind}], checked_at}` | `templates.not_found` | `read` |

A mismatch is a successful job with `matches: false`. The error code `templates.identity_mismatch{approved_sha256, computed_sha256, changed}` is raised by `RevisionReader.open` and `TemplateIdentity.check` callers, so `runs.launch` ([M11](11-run-orchestration.md)) and `exchange.export_template` ([M17](17-zip-exchange.md)) surface it unchanged. **R067**

**Events**:

| Event | Payload | Emitted when |
|---|---|---|
| `templates.revision.registered` | `template_id, sha256, label, origin: builtin \| approved \| imported, parent_sha256, created: bool` | A revision becomes visible after publication by approval, import or built-in registration; never during prepare. Transaction id is in the event envelope for deduplication. |
| `templates.identity.checked` | `sha256, matches, computed_sha256, changed_paths` | Any verification completes (verify job, launch, restore, in-run check). |
| `templates.revision.restored` | `sha256` | `templates.restore` re-materialized files. |
| `templates.revision.deleted` | `template_id, sha256, label, lineage_removed` | `templates.delete` committed. |
| `templates.lineage.renamed` | `template_id, name` | `templates.rename` or M16's post-approval rename through `LineageNames`. |
| `templates.default.changed` | `default_sha256, previous_sha256, set_by: install \| upgrade \| user` | `RegisterBuiltins` or `templates.set_default` moved the pointer. |

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `ReadinessGate.has_supported_harness()` (application Protocol), event `environment.report.updated` | M03 | `can_configure`/`can_create` capability flags; Library re-reads on change. |
| `environment.report` (`summary`, `capabilities`), `environment.recheck` | M03 | `#env-bar` text; palette "Recheck environment". |
| `RevisionConfigs.summaries(sha, view)`, `prepare_copy(tx, from_sha, to_sha)`, `prepare_remove(tx, sha)`, `commit_view(tx)`, `rollback(tx, token)` (application Protocol) | M07 | Config counts/names share the read view; transaction preparation returns exact tokens/counts for optional copies or deletion, never publishes independently. M07 implements these ports before parent integration. |
| `configs.list(template_sha256)`, `configs.duplicate`, event `configs.configuration.saved` | M07 | Configurations tab; count refresh. |
| `RevisionResults.counts(sha, view)` (application Protocol) | M02 | Result counts and latest run per revision. |
| `results.list(template_sha256)` (judge groups from its `judge_groups` facet), event `results.result.recorded` | M02 | Results tab; count refresh. **R028** |
| `DraftStore.seed(source: DraftSeed, mode, name, scope)`, `DraftStore.inspect(draft_id) -> DraftApprovalInput(version, frozen: FrozenDraft)`, `DraftStore.prepare_approved(tx, draft_id, version, sha)`, `commit_view(tx)`, `rollback(tx, token)` (application Protocol; `DraftSeed`, `DraftMode`, `ScopeHint` are M16's) | M16 | Revision/duplicate drafts and versioned approval input; `ApproveRevision` uses the inspected version for `prepare_approved` and the publication recheck. M16 independently coordinates planned `ApproveDraft` through the same public participant ports. |
| `planning.defaults`, `planning.inspect_repository`, `planning.create_request` | M16 | NewTemplateScreen planner hint, repository validation, Continue. |
| `planning.unfinished(query)`, `planning.discard(session_id? \| draft_id?)`, events `planning.session.*`, `planning.draft.*` | M16 | Library draft rows, reopen target, Discard draft. |
| `ActiveRuns.for_revision(sha) -> Sequence[ActiveRunRef(run_uid, run_label, origin)]` (application Protocol) | M11 | `active_run_notice` on `templates.get` and `templates.start_revision`; deletion refusal. **R067** |
| `environment.revision_permissions_changed` finding (consumer of `RevisionPermissions`) | M03 | Reports revision folders whose modes changed outside the app, with the restore fix; `doctor` prints it. |
| `ConfirmScreen`, `PromptScreen` | M15 | Discard draft, delete revision and make-default confirmations; rename prompt. |
| `CheckIndex.titles(definition)` (application Protocol) | M08 | Per-task check titles and counts. |
| `RubricIndex.summary(rubric)` (application Protocol, given the revision's `RubricDefinition`) | M12 | Rubric profile and category count. |
| Injected `ExchangeScreens.import_template(selected_sha256?)`, `.export_template(sha256)` route factories; typed `ImportOutcome \| None` and `Path \| None` outcomes | M17 | Library/Template exchange entries and return refresh; all picker/routing/dialog behavior belongs to [M17 §4](17-zip-exchange.md#4-screens). |
| `runs.launch` (job, progress steps `identity`, `config`, `weights`, `bind`), `runs.list(active=True)`, event `run.state.changed` | M11 | LaunchCheckScreen, `#env-bar` active run, `ctrl+r`. |
| In-run calls to `TemplateIdentity.check`; on `matches=False` the whole-run halt and the interrupted records with reason "template identity invalidated" | M11 | Identity invalidation during a run; M01 only supplies the check. **R067** |
| `jobs.cancel`, `jobs.get`, `events.subscribe` | M11 | Cancel import or verify; subscriptions. |

### 4. Screens

Shared rules: each screen loads in an `exclusive=True` worker through the injected `EngineClient`; each data widget sits in a `ContentSwitcher` with `#x`, `#x-loading`, `#x-empty`, `#x-error`; `check_action` returns `None` (dimmed, never hidden; Textual hides a binding on `False`) from the `ActionState` in the loaded view model; error notices print the engine's `message` and `remedy` verbatim. View models are plain dataclasses built by pure functions; SHA formatting (`short8`, `first16…last8`, full 64) is the only formatting logic. Pure navigation (push or pop a screen, switch a tab, copy to clipboard) issues no call; the pushed screen loads its own data.

```python
@dataclass(frozen=True)
class LibraryVM:
    rows: tuple[LibraryRowVM, ...]        # glyph ★ ◆ ↓, name, type, source, tasks, label, sha8, cfg, res
    drafts: tuple[DraftRowVM, ...]        # "draft", name, origin, state, last update
    count_label: str                      # "6", "0 of 6", "1 of 6"; "· 2 drafts" when drafts exist
    default_sha: str
    default_notice: DefaultNoticeVM | None
    index_error: ErrorVM | None
    actions: Mapping[str, ActionState]    # per selected row: template flags, or can_reopen/can_discard on a draft row

def library_vm(resp: TemplateList, drafts: UnfinishedList, query: str) -> LibraryVM: ...
def template_header_vm(detail: TemplateDetail) -> TemplateHeaderVM: ...
def approval_vm(preview: ApprovalPreview) -> ApprovalVM: ...
```

**LibraryScreen** — `axbenchmark/tui/screens/library.py`, view models in `tui/viewmodels/library.py` (`LibraryVM`, `TemplateDetailVM`). Artboards Library, LibraryLoading, LibraryEmpty, LibraryError, LibraryNoHarness, and the Library states with draft rows (W10) and the default-revision notice (D16).

| Aspect | Contract |
|---|---|
| Load | `templates.list(query)` and `planning.unfinished(query)` → `#library-body` (`#templates` / `-loading` / `-empty` / `-error`); template rows first, then one row per unfinished draft marked "draft" with its state (`planning`, `ready for review`, `failed`) and last update; cursor on `default_sha256`. `DataTable.RowHighlighted` on a template row → `templates.get(sha)` → `#detail-fields`, `#saved-configs`, `#summary` (compact); on a draft row the detail pane shows the draft row's own fields, no call. `#env-bar` ← `environment.report` (`summary`) and `runs.list(active=True)`. `#default-notice` (`.notice.-info`) above the table when `default_notice` is set, with its `text`, Buttons `#default-changes` and `#make-default`. |
| States | `#templates-loading` while the first list call runs. `#templates-empty` when `items == []` and `query` is set (the library always has built-ins). `#templates-error` when `index_error` is set, shown above the built-in rows that the response still contains. No-harness renders `capabilities.can_configure.enabled == False` with the engine's reason; `#configure` and the `enter`/`n` bindings are dimmed. On a draft row the template actions are not offered (dimmed; the draft row DTO carries only `can_reopen` and `can_discard`). |
| Subscriptions | `templates.revision.registered`, `templates.revision.deleted`, `templates.identity.checked`, `templates.lineage.renamed`, `templates.default.changed`, `configs.configuration.saved`, `results.result.recorded`, `results.import.registered` → re-issue `templates.list(query)`; `planning.session.*`, `planning.draft.*` → re-issue `planning.unfinished(query)`; `environment.report.updated`, `run.state.changed` → refresh `#env-bar`. |

| Binding | Action | API call |
|---|---|---|
| `enter`, `#configure` | `configure` | none; push Setup (M07) for the row's `sha256`. Dimmed by `can_configure`. |
| `enter` on a draft row | `reopen_draft` | none; push the screen named by the row's `reopen` target (M16's `PlanningScreen(session_id)`, `PlanningFailedScreen(session_id)`, `PlanReviewScreen(draft_id)`, or `TaskEditorScreen(draft_id, task_id)` for a revision or duplicate draft). Dimmed by `can_reopen`. |
| `delete` on a draft row ("Discard draft") | `discard_draft` | M15 `ConfirmScreen` with the row's `discard_effect`; on `True`, `planning.discard(session_id \| draft_id)`. Dimmed by `can_discard`. |
| `delete` on a template row ("Delete revision") | `delete_revision` | M15 `ConfirmScreen` with `delete_effect` from the loaded `TemplateDetail`; on `True`, `templates.delete(sha256, delete_plan_id)`; errors render the engine's `message` and `remedy`. Dimmed by `can_delete`, whose reason is shown (built-in, active run, retained results, pending publication). Cancel/Esc issues no mutation. A changed plan refreshes effect/token and requires a new confirmation. |
| `a` | `about` | none; push M09's `InventoryAboutScreen(sha256)`. Shown in the Footer, enabled only when `can_about` is enabled (a built-in inventory revision); dimmed otherwise. |
| `#why-not-default` (detail pane, look-alike rows) | `compare_default` | none; push M09's `VariantScreen(sha256)`. Dimmed by `can_compare_default`. |
| `#default-changes` | `toggle_default_changes` | none; shows or hides `default_notice.changes` under the notice. |
| `#make-default` | `make_default` | M15 `ConfirmScreen` ("Results from <current> and <available> can't be compared"); on `True`, `templates.set_default(available_sha256)`. Dimmed by `default_notice.can_make_default`. |
| `o`, `#open` | `open_template` | none; push `TemplateScreen(sha256)`. |
| `n` | `new_template` | none; push `NewTemplateScreen`. Dimmed by `can_create`. |
| `d` / `e` | `duplicate` / `revise` | `templates.get(sha256)` is already loaded; push `ReviseScreen(detail, mode)`, which shows `active_run_notice` when set. |
| `i` / `x`, `#export` | `import` / `export` | none; push injected `ExchangeScreens.import_template(selected_sha256)` / `.export_template(sha256)`. Import passes the selected template SHA, or no SHA for a draft/no template selection. `x` is dimmed by `can_export`. |
| `/` | `focus("#filter")` | `Input.Changed` (debounced 150 ms) → `templates.list(query)`. |
| `esc` | `clear_filter` | `templates.list()`. |
| `#retry` | `retry` | `templates.list(query)`. |
| `ctrl+r` | `reconnect` | none; with one active run, push the M11 run view for it from `#env-bar` data; with several, open the command palette filtered to M15's "Reconnect to run" hits (`RunCommands`), one per active run. Dimmed when there is none. |
| `f2` | `environment` | none; push M03 EnvironmentScreen. |
| `ctrl+p` | `command_palette` | `LibraryCommands` provider (`tui/commands/library.py`, registered through M15’s command-provider hook) yields one hit per binding above plus "Recheck environment" → `environment.recheck`; disabled hits carry the same `ActionState`. |
| `q` | `quit` | none; the app exits, runs continue in the engine. |

**TemplateScreen** — `axbenchmark/tui/screens/template.py`, view models in `tui/viewmodels/template.py` (`TemplateHeaderVM`, `RevisionTreeVM`, `TasksVM`, `ManifestVM`). Artboards TemplateTasks, TemplateIdentity, TemplateConfigs, TemplateResults, RevisionSaved; contributes library widget states to M15’s shared WidgetStates showcase. Constructed with one `sha256`.

| Aspect | Contract |
|---|---|
| Load | `templates.get(sha)` → `#identity-bar`, `#revision-facts`; `templates.revisions(template_id)` → `#revisions`. Tabs load on first activation: Tasks `templates.tasks(sha)` → `#tasks`, `#task-prompt`; Identity `templates.manifest(sha)` → `#identity-summary`, `#manifest`, `#not-covered` (rendered from `not_covered`); Configurations `configs.list(sha)` → `#configs`, `#config-entries`, `#config-summary`; Results `results.list(sha)` → `#results`, `#judge-groups`. |
| States | `#tasks-error` on `templates.payload_missing`; `#manifest-loading` while a `templates.verify` job runs (ProgressBar from `hashed/total`); `#manifest-error` when `last_check.matches` is false, listing `changed`; `#revisions-error` from `lineage_error` with the revisions still listed; `#configs-empty` / `#results-empty` when the owner returns no rows; `#tasks-empty` / `#manifest-empty` only for a response without approved tasks or manifest. |
| Subscriptions | `templates.identity.checked` and `templates.revision.restored` for this sha → reload header and manifest; `templates.revision.deleted` for this sha → pop to the Library with the notice "<label> deleted"; for another sha of this `template_id` → reload `#revisions`; `templates.revision.registered` for this `template_id` → reload `#revisions`; `templates.lineage.renamed` for this `template_id` → reload the header; `job.progress` / `job.finished` for its verify job; `configs.configuration.saved`, `results.result.recorded`, `results.import.registered` → reload the active tab and revision counts. |

| Binding or widget | Action | API call |
|---|---|---|
| `esc` | `app.pop_screen` | none; Library keeps selection and filter. |
| `1` … `4` | `show_tab` | none; first activation triggers that tab's load. |
| `e` / `d` | `revise` / `duplicate` | none; push `ReviseScreen(detail, mode)` with the loaded `TemplateDetail`. |
| `n`, `#rename` | `rename` | M15 `PromptScreen` prefilled with the display name; on a value, `templates.rename(template_id, name)`; `templates.name_invalid` reopens the prompt with the field marked. Dimmed by `can_rename`. Identity is unchanged. |
| `x`, Identity "Export ZIP" | `export` | none; push injected `ExchangeScreens.export_template(sha)`. Dimmed by `can_export`. |
| `enter`, `#configure` | `configure` | none; push Setup (M07). Dimmed by `can_configure`. |
| `c`, `#copy-sha` | `copy_sha` | none; `app.copy_to_clipboard(full sha256)`. |
| Identity "Verify again" | `verify` | `templates.verify(sha)`. |
| Identity "Restore files" | `restore` | M15 `ConfirmScreen` ("Rewrites this revision's files read-only from the stored content and discards any change on disk."); on `True`, `templates.restore(sha)`. The fix M03 names for a revision folder whose modes were changed, and for a failed identity check. |
| `r` (compact) | `pick_revision` | none; `OptionList` from the loaded `RevisionTree`; choosing a node replaces the screen with `TemplateScreen(node.sha256)`. Same for `Tree.NodeSelected` on `#revisions`. |
| Configurations "New configuration", "Edit" | — | none; push Setup (M07). |
| Configurations "Duplicate" | `duplicate_config` | `configs.duplicate(config_id)`. |
| Results "Open result", "Import results", "Export result ZIP" | — | none; push the M02/M17 screens for the selected run. |

After `templates.approve_revision` returns, the app replaces the screen with `TemplateScreen(new sha)` and calls `app.notify(f"Revision {label} saved · {short8}", severity="information", timeout=6)` (RevisionSaved).

**NewTemplateScreen** — `axbenchmark/tui/screens/new_template.py`, `ModalScreen[PlanningRequestRef | None]`, view model `NewTemplateVM` in `tui/viewmodels/new_template.py`. Artboards NewTemplate, NewTemplateRepo, NewTemplateInvalid. The calls are M16's; the screen holds only field values.

| Aspect | Contract |
|---|---|
| Load | `planning.defaults` → `#planner-hint`. |
| `#baseline-kind` change | Adds or removes `.-existing` on the dialog (shows `#repo-fields`); no call. |
| `#repo-path`, `#revision` `Input.Changed` (debounced) | `planning.inspect_repository(path, revision)` → `#repo-status`, `#revision-resolved`, the uncommitted-changes warning; `-invalid` on the input and `#continue` disabled from the response's `ActionState`. |
| `ctrl+s`, `#continue` | `planning.create_request(prompt, project_type, baseline)`; field errors mark the named input; success dismisses with the ref and the app pushes M16's `PlannerScreen(request_id)` (artboard PlannerPicker). |
| `esc`, `#cancel` | `dismiss(None)`; no call. |

**ReviseScreen** — `axbenchmark/tui/screens/revise.py`, `ModalScreen[RevisionDraftRef | None]`, view model `ReviseVM`. Artboard Revise. Opened with the source `TemplateDetail` already loaded by the caller.

| Binding or widget | API call |
|---|---|
| Load | No call; `#revise-active-run` (`.notice.-warning`) shows `active_run_notice` from the loaded `TemplateDetail` when set. It informs and never blocks. **R067** |
| `#revise-mode`, `#revise-name`, `#revise-scope` checkboxes | none; the scope checkboxes are editor hints and never decide identity. |
| `enter`, `#open-editor` | `templates.start_revision(source_sha256, mode, name, scope)`; `templates.name_invalid` marks `#revise-name`; success dismisses with the ref and the app pushes M16's TaskEditorScreen for `draft_id`. When that editor finishes, the app pushes `ApproveRevisionScreen(draft_id)`. |
| `esc`, `#cancel` | `dismiss(None)`. |

**ApproveRevisionScreen** — `axbenchmark/tui/screens/revise.py`, `ModalScreen[bool]`, view model `ApprovalVM`. Artboard ReviseConfirm.

| Aspect | Contract |
|---|---|
| Load | `templates.approval_preview(draft_id)` → `#revision-diff` (`changes`, `unchanged`), `#revision-digests` (source and computed, full), `#revision-verdict`, `#copy-configs` label from `copyable_configs`; retain `preview.version`; `#approve` enabled from `can_approve`. |
| Blocked (`verdict == existing_identity`) | `#revision-verdict` shows "Identical to <existing_label> — nothing to approve"; `#approve` dimmed with `templates.identical_revision`; `#open-existing` shown. To rename, the user edits the lineage display name instead. |
| `ctrl+s`, `#approve` | `templates.approve_revision(draft_id, base_version=preview.version, copy_configs=#copy-configs.value)`; success `dismiss(True)`; errors render in `#revision-verdict`. `planning.draft_conflict` reloads the preview and requires a fresh approval action; never automatically retries approval. |
| `o`, `#open-existing` | none; dismiss and push `TemplateScreen(existing_sha256)`; the draft stays open. |
| `esc`, `#back` | `dismiss(False)`; back to the editor, draft kept. |

**Exchange entry and return contracts** — M01 consumes M17-owned `ImportScreen`/`ExportScreen` through M15’s injected route registry. [M17 §4](17-zip-exchange.md#4-screens) is authoritative for **all** ZIP pickers, package-kind routing, dialogs, widget states, view models, job handling and return navigation. Links from M17 back to this section refer to these entry contracts only; M01 specifies no exchange presentation implementation.

| Entry / outcome | M01 consumer responsibility |
|---|---|
| `ExchangeScreens.import_template(selected_sha256?)` | Pass the selected revision’s full SHA when a template row is selected; pass none for a draft/no selection. Keep the Library filter/selection as the return context. M17 owns any choice of a result package and the required revision-selection/routing behavior; the Library issues no exchange API call. |
| `ExchangeScreens.export_template(sha256)` | Pass the current selected/full template SHA when `can_export` permits the entry. The M17 factory supplies the ExportScreen and owns its preview, path and export job. |
| Returned `ImportOutcome \| None` | A published outcome supplies `template_sha256` and `template_created`; refresh `templates.list(query)` and the current detail/counts from authoritative APIs. M17 invokes the injected M01 `TemplateScreen(outcome.template_sha256)` route when its own flow chooses to open the revision; the caller must not push it a second time. A `None` return preserves context and claims no import. |
| Returned `Path \| None` | Retain the written path supplied by M17 as the export outcome; `None` claims no exported artifact. No library registration or count change is inferred from export. |
| Publication/reconnect | Registration events refresh Library/Template only after publication. Handle `templates.revision.registered` and `results.import.registered` so imports into an existing revision refresh counts as well. Reconnect or return may reload authoritative data without repeating import/export. M17 owns result-package navigation through injected M02 result-view factories. |

Consumer tests inject these factories and typed outcomes; M17 tests the complete ImportTemplate/ImportVerifying/ImportRejected/ImportDuplicate/ExportTemplate behavior and every result-package state. No exchange widget or view-model behavior is delegated back to M01.

**LaunchCheckScreen** — `axbenchmark/tui/screens/launch_check.py`, `ModalScreen[LaunchDecision]`, view model `LaunchCheckVM`. Artboards LaunchCheck, LaunchMismatch. Opened by M07's ReviewLaunchScreen with the `JobRef` returned by `runs.launch`; the screen itself issues no launch call.

| Aspect | Contract |
|---|---|
| Subscriptions | `job.progress` for the launch job → `#launch-steps` (steps `identity`, `config`, `weights`, `bind` with their digests); `job.finished`. |
| `#launch-steps` | While the job runs; `#launch` is shown disabled. On success the modal dismisses with the run id and the app opens the M11 run view. |
| `#launch-blocked` | Job fails with `templates.identity_mismatch` → `#launch-digests` shows approved and computed SHA-256 in full and the changed paths. |
| `esc`, `#cancel` | While running: `jobs.cancel(job_id)`; when blocked: `dismiss(None)`. |
| `#restore` | `templates.restore(sha)`; on a matching result the modal returns to Setup so the user launches again. |
| `#save-revision` | `templates.start_revision(sha, mode=revision, name, scope=[], seed=on_disk)`; then the revise flow (editor, ApproveRevisionScreen). |

### 5. CLI

| Command | API |
|---|---|
| `axbenchmark templates export TEMPLATE_SHA --output template.zip` | `exchange.export_template` job (M17), which reads the revision through `RevisionReader`. **R056** |
| `axbenchmark templates import template.zip` | `exchange.import_template` job (M17), registering through `RevisionRegistry`. **R057** |
| `axbenchmark templates list [--filter TEXT]` | `templates.list` |
| `axbenchmark templates show TEMPLATE_SHA` | `templates.get` |
| `axbenchmark templates tasks TEMPLATE_SHA` | `templates.tasks` |
| `axbenchmark templates manifest TEMPLATE_SHA` | `templates.manifest` |
| `axbenchmark templates contract TEMPLATE_SHA`, `templates prompts TEMPLATE_SHA [--file PATH]`, `templates checks TEMPLATE_SHA`, `templates file TEMPLATE_SHA PATH`, `templates lookalike TEMPLATE_SHA` | `templates.contract`, `templates.prompts`, `templates.coverage`, `templates.file`, `templates.lookalike` (M09's screens) |
| `axbenchmark templates verify TEMPLATE_SHA` | `templates.verify` job; exit 1 when `matches` is false |
| `axbenchmark templates revisions TEMPLATE_ID` | `templates.revisions` |
| `axbenchmark templates revise TEMPLATE_SHA --mode revision\|duplicate --name NAME` | `templates.start_revision`; prints the draft id for M16's draft commands, and `active_run_notice` on stderr when set |
| `axbenchmark templates approve DRAFT_ID [--copy-configs]` | `templates.approval_preview`, then `templates.approve_revision(base_version=preview.version)`; a conflict requires a refreshed preview and explicit retry; exit 1 with `templates.identical_revision` naming the existing revision |
| `axbenchmark templates rename TEMPLATE_ID NAME` | `templates.rename` |
| `axbenchmark templates set-default TEMPLATE_SHA` | `templates.set_default` |
| `axbenchmark templates restore TEMPLATE_SHA --yes` | `templates.restore` (destructive; refuses without `--yes`) |
| `axbenchmark templates delete TEMPLATE_SHA --yes` | `templates.get` for the current effect/token, then `templates.delete(sha256, delete_plan_id)` (destructive; without `--yes` exits 2 and sends no mutation, per M14). The CLI never changes file modes itself. |

Only `export` and `import` are product commands ([M14](14-command-line-interface.md)); the others exist because every API method must be reachable from the CLI and are generated from the registry. `TEMPLATE_SHA` is the full 64-character SHA-256. `--json` prints the response model or the job's event stream.

### 6. Headless verification and parent acceptance

The child specs name the exact proposed test files and commands. Their contract/fixture gates are independent of later providers; passing them does not mark M01 integrated.

| Gate | Required evidence |
|---|---|
| Canonical identity | Golden descriptor/manifest bytes and SHA-256 on macOS and Linux; built-in/planned/imported inputs converge; canonical imports preserve bytes; malformed/duplicate keys, missing references, role mismatches and path collisions fail. Display rename is stable; prompt/check/rubric/task-order and executable-flag changes rehash. An empty baseline is explicit and still has a complete template manifest. |
| Storage and publication | Read-only 0444/0555 trees, restored working modes 0644/0755, identity drift detection and repair; injected failures before/after every prepare/publication/cleanup boundary; rollback cannot delete existing content. Concurrent readers observe complete before/after collections, including result/config counts, and guessed staged ids cannot launch/export/delete. Read leases prevent visible revisions losing their files. |
| Library API | Real M11.1–M11.2 `InProcessClient` with fixture providers: identical approval rejection, default upgrades with/without results, draft resume, no-harness browsing, index-error built-ins, transactional config copy and deletion. Typed errors and safety metadata match the registry; every documented method is exercised. |
| Deletion UI | 120×40 and 80×24; draft Delete calls `planning.discard`, revision Delete uses confirmation effect/token and calls `templates.delete`; Cancel/Esc mutates nothing. Built-in, active run, retained results and publication reservation stay dimmed with matching palette reason. A race after confirmation returns a typed refusal or changed-plan response, retains the row and refreshes capabilities. |
| Real parent integration | M09 package and M16 approval produce identical canonical payload for equal definitions; real M08/M12 format readers resolve references; M05/M08 copies preserve executable intent; M02/M07/M16 visibility participants and M17 imports pass crash/concurrency cases; M03 reports mode drift; M11 routes identity mismatch from every consumer into run invalidation; M14 and M15 expose the complete library journey. |

**F17 wireframe reconciliation required:** extend `design/wireframe-tui/src/boards.mjs` Library bindings, `LIB_STATES` and palette examples with `RevisionDeleteConfirm`, `RevisionDeleteBuiltin`, `RevisionDeleteActiveRun`, `RevisionDeleteHasResults`, `RevisionDeleteChanged` and `RevisionDeletePending`. Use `ConfirmScreen` with Cancel initially focused, current effect text/config count/last-lineage warning and the single selected revision. Keep `DraftDiscard` and its action distinct. Add wide/compact versions, cancellation edges back to the selected row, disabled reason states, and matching navigation/API ownership entries. In the navigation graph, `o` opens Template while Enter on a template opens M07 Setup; Enter on a draft reopens M16. Wireframe sources and previews are owned by the navigation refinement, not this module's implementation children.
