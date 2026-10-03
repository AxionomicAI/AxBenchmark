# M16 — Custom template authoring, planning and baseline capture

Status: proposed feature contract, not an implementation claim. [BENCHMARK-MODES.md](../../BENCHMARK-MODES.md) governs new authoring and refines the older [product specification](../SPEC.md); [M01](01-template-library-identity.md#canonical-definition-contract--axbenchmark-definition2) owns canonical v2. This module creates reusable benchmarks without modifying the selected source folder.

## Implementation children and completion gate

| Child | Delivery boundary | Completed prerequisites (all require Bootstrap) |
|---|---|---|
| [M16.1 — repository-capture](../../M16/01-repository-capture.md) | Read-only current-folder inspection/capture, semantic modes, preservation proof; legacy pinned Git compatibility | M01.1; M11.1–2 |
| [M16.2 — planning-jobs](../../M16/02-planning-jobs.md) | Optional idea → generated multi-step producer, selection, regeneration, sessions and recovery | M16.1; M03.1; M04.1–2; M05.1–2; M11.1–2 |
| [M16.3 — draft-approval](../../M16/03-draft-approval.md) | Manual draft factory/job, persistent edits, canonical conversion and atomic approval participant | M16.1; M01.1–3; M08.1/M12.1 validators; M16.2 is a later producer integration gate |
| [M16.4 — planner-screens](../../M16/04-planner-screens.md) | Optional planner selection, consent, progress, failure and reconnect | M16.2; M15.1–2 |
| [M16.5 — draft-editor-screens](../../M16/05-draft-editor-screens.md) | Manual capture/review and shared edit/approve screens; generated-draft integration | M16.3; M15.1–2; M16.4 for optional generation integration |

No new child, capture service or approval coordinator is introduced. M16.1 supplies capture to M16.3's manual factory; M16.3 can deliver before M16.2 and without harness readiness. Bootstrap publishes shared contracts/fixtures first. Full parent acceptance still requires M16.2 and real M01/M03/M04/M05/M07/M08/M10/M11/M12/M17 integration, every benchmark/project/target-mode combination, legacy compatibility, macOS/Linux restoration and M15 navigation at both sizes. Prototype corrections remain with their existing owner.

## Purpose and boundaries

`benchmark_type` (`one_shot`, `multi_step`), `project_type` (`frontend`, `backend`, `fullstack`, `mobile`, `devops`, `agentic`, `specification`) and derived `target_mode` (`from_scratch`, `modify`) are independent. All four benchmark-type × target-mode combinations are valid. The normal creation route needs no planner, model, installed harness or verification call before approval; local execution separately needs Git and the chosen usable competitor harness. **[R007, R030, R031]**

One shot preserves one exact UTF-8 prompt as task `T1`, with no shared specification, split, paraphrase or added repair task. Text input is encoded once as entered; prompt-file import retains its exact bytes, including CRLF, Unicode and absent final newline. Imported multi-step takes at least two supplied UTF-8 primary files in a user-reviewed order: N files produce N tasks. The order never comes from filesystem enumeration or upload completion. Files are staged and reviewed, never regenerated. Task-check/final-regression/grading phases are not extra competitor tasks.

An explicit idea → planner → reviewed multi-step route remains optional and defaults to seven tasks, including its authored final verification/fixes task; newly generated v2 drafts require at least two tasks. One shot never enters this route. Approved built-in/imported/custom reuse skips planning and uses its packaged baseline; existing v1 revisions, hashes, committed baselines and the seven original inventory tasks stay unchanged. M01 owns library revisions, M07 saved configurations and M09 built-in content. **[R030, R031, R136]**

## Inputs, outputs, and operations

| Operation | Inputs | Required outcome |
|---|---|---|
| Choose existing work | Approved revision | Reuse frozen tasks and packaged snapshot; no planner, source refresh or v1 rehash. |
| Inspect target | Selected directory and optional reviewed exclusion policy | Read-only inventory, derived mode, exclusions/counts, change token and actionable problems. Git is optional. |
| Create manually | Benchmark/project types, target inspection, exact one-shot prompt or ordered spec files, approved evaluation-profile references | Durable import/capture/validate/persist job returning an open draft; zero model calls or planner session. |
| Generate explicitly | Multiline idea, project type, target inspection, approved profiles, selected usable planner/model/effort | Current-folder capture and generated multi-step v2 draft, seven tasks by default. |
| Review and approve | Exact defining files, name, ordered tasks, checks/protocol/services/dependencies/rubric and completed capture | Existing M16.3/M01 publication transaction; generation/import alone is not approval. |
| Resume, recapture or discard | Persisted operation/draft and version tokens | Reopen exact saved state; explicit versioned recapture; confirmed discard. |

These are engine operations through `planning.*`, following the [headless architecture](../../../ARCHITECTURE.md). Clients display DTOs and do not infer emptiness, choose execution order, compute identity or invent checks.

## Optional planner selection and review

Only the explicit generation branch exposes planner harness/model/effort selection. Keep a valid previous choice; otherwise select the first usable, role-capable candidate in display order **Claude Code, Codex, Grok CLI, Pi, Cursor CLI, OpenCode**. Cursor CLI follows Pi and OpenCode follows Cursor; [M05.8](../../M05/08-cursor-adapter.md) and [M05.9](../../M05/09-opencode-adapter.md) must verify each installed adapter/version/generation and relevant role before selection; display never asserts planner/judge/competitor support. Use M03/M04's recorded harness default model and discovered effort default, not a quality recommendation. An unknown default model leaves the field empty and blocks generation. Unusable, undetermined or unsupported-role candidates never run. **[R031, R137]**

With no usable planner, only the optional generation branch shows “Verify now”. Explicit consent permits one minimal headless verification per selected harness through M03/M05; no verification or readiness gate is inserted into manual authoring. Generated content can be reviewed/edited/regenerated before approval. Services expose command/cwd/port/readiness validation. Identical-content approval is blocked with “Identical to <label> — nothing to approve”; later lineage renaming leaves identity unchanged.

## Baseline and approval invariants

New manual and generated definitions capture the selected current directory itself, including eligible dirty, staged and untracked working-file bytes; the index never overrides the working file. A selected Git subdirectory does not expand to its repository root. Read-only capture never initializes Git, checks out/stashes/cleans/resets, chmods, executes shell commands/hooks, writes to the source or copies results back. Staging is disjoint from the selected tree. Every configuration/trial gets an independent writable copy of one completed immutable snapshot. **[R068, R140]**

Derive target mode before portable exclusions. Empty directories and versioned administrative metadata alone are scratch (VCS internals `.git`/`.hg`/`.svn`, including pointer files, and OS metadata `.DS_Store`/`Thumbs.db`; enumerate policy version and ignored entries); any other file or unsupported entry is project content even if unreadable or excluded. An unreadable inventory is an error, never empty. Report exclusions/reasons, policy, eligible/admitted counts and bytes; do not blanket-exclude untracked or use Git ignore as the capture definition. Populated content with no admitted files fails `baseline.no_admitted_files`. Links/special entries require a path-specific error or explicit reviewed exclusion, never following. Required inputs cannot be silently excluded.

Capture compares deterministic pre-copy inventory, copied bytes/semantic executable flags and post-copy inventory (paths/types/digests/flags). A change triggers bounded retry or `baseline.source_changed`; no partial/cancelled capture becomes `baselineReady`. This is consistency evidence, not an atomic filesystem snapshot. POSIX execution is true if any source execution bit is set, recorded before storage becomes read-only. M01 validates normalized paths and case-fold/file-directory collisions; M05 restores bytes/flags into isolated copies and retains manifest-based diffs alongside mandatory repository observations, including for captures originating outside Git. Every attempted competitor task must satisfy the [mandatory task-commit protocol](../../BENCHMARK-MODES.md#mandatory-task-commits).

Inspection/capture tokens bind source inventory, exclusion policy and draft version. A changed inspection, active recapture or mismatched preview blocks draft approval with changed facts; explicit recapture and review are required. An unchanged completed capture can be approved without rereading a disappearing source: live source changes have no effect unless a later inspection/refresh is requested and detects a mismatch. Recapture of an open draft requires `base_version`; refreshing approved work opens a new revision first. Approved runs, retries and imports never consult the origin path or refresh its bytes.

Legacy `RepositoryRevision`/`GitReader` alone resolves a selected committed revision (default `HEAD`), excludes uncommitted content and records a pin; later reuse never resolves it again. Its source-preservation rules and zero-file repository shape remain legacy-only. No default current-folder flow requires Git or invents a Git repository.

M16.3 approval freezes versioned `required_per_task` policy, exact common commit instruction, executable check source/version and deliverable-scope rules through the existing execution-protocol document and M01 descriptor reference closure. No new metadata field or prompt/spec rewrite is added. Every attempted one-shot T1 or multi-step task must create a new competitor commit containing all scoped deliverables; no-change work still requires an explicit empty milestone. An explicitly empty authored acceptance suite cannot disable this mandatory protocol check. Missing policy/check/scope content blocks approval; commit compliance alone does not establish behavioral coverage. No engine auto-commit, extra repair invocation or later-task repair can satisfy an earlier missing milestone.

Git readiness is an execution prerequisite only. M05.2 creates disjoint repositories wholly in isolated new-policy trial workspaces: empty baselines start with unborn HEAD and no setup commit; populated captures receive one synthetic baseline commit before measured competitor work, excluded from competitor commit counts. Source Git internals/config/hooks/remotes are never copied or reused, and the original folder is never initialized or modified. Retain advancement/ancestry, start/end states and scoped committed/dirty-deliverable evidence under M05/M08; known violations fail and unavailable evidence remains unverified. Incompatible legacy launch requires an explicitly reviewed new revision without altering original v1 bytes/hash/history. M09 keeps its exact legacy branch: repository absent before T1, competitor initialization/first commit, then its original checks.

Manual drafts use approved/authored checks, services, execution protocol, dependencies and project-applicable rubric profiles. Explicit empty suites/documents are accepted only where their owning validators allow; emptiness conveys no behavioral coverage. The mandatory commit protocol is never an empty/optional document. Web grading requires M08/M12's final-capture declarations and both required viewports, with missing runtime evidence left unverified/ungraded. No model supplies missing validation content as a side effect.

Drafts and operation outcomes survive disconnect/engine exit under `~/.axbenchmark/drafts/`. Interrupted work becomes a visible failed operation; it never resumes a model/capture silently. Library rows distinguish capturing/importing, optional planning, ready for review and failure; discard requires confirmation.

## Acceptance criteria

1. Complete manual one-shot and supplied-spec multi-step creation/approval/execution for all project types with scratch and populated non-Git/dirty-Git folders, with zero planner calls and no authoring harness gate.
2. Preserve exact prompt/spec bytes and explicit order; one shot yields only T1, supplied N files yield N tasks, and edits/reorder/removal are optimistic-version mutations. Reject empty/invalid UTF-8, missing files, duplicate paths and invalid task counts without conversion.
3. Prove source bytes/types/modes, Git HEAD/index/status where present, and untracked roster unchanged on success, failure, cancellation and retry. Capture working bytes when index differs, selected subdirectories only, empty/VCS-only scratch, excluded-only error and source-change races.
4. Verify optional planner selection/readiness/consent/defaults and seven-task generation separately; generated primaries map one per task with optional shared context. Imported manual work cannot regenerate or acquire a planner silently.
5. Reuse/import approved v1/v2 without source access or planning; M09 hashes/prompts remain exact. Independent M05 copies retain flags, introduced-prefix inputs omit future engine-supplied specs, and M12 sees the whole-definition view once per file.
6. Exercise durable manual jobs, conflicts, explicit recapture and approval source guards; recover from disconnect/exit with no duplicate draft/snapshot/publication. Atomic M01/M16/M07 transaction behavior remains unchanged.
7. Verify checks/evidence/scoring, both TUI sizes, CLI parity and all typed failures through the real integrated modules. Fixture-only checks do not satisfy parent acceptance.

## Implementation

This section applies [ARCHITECTURE.md](../../../ARCHITECTURE.md). The new authoring behavior follows [BENCHMARK-MODES.md](../../BENCHMARK-MODES.md); versioned identity remains exclusively M01-owned. File names, paths, debounce intervals and step identifiers are engineering choices.

### 1. Engine component

Package `axbenchmark.engine.planning`. It owns target inspection and capture, manual-creation operations, optional generation requests/sessions, drafts from either producer or M01 revision seeds, and optional planner provenance. It never defines identity itself: `to_frozen` calls M01's `DefinitionCodec.write`, and approval participates in the shared publication transaction with M01's `RevisionRegistry`.

**Domain** (`engine/planning/domain/`, frozen slotted dataclasses and pure functions, no I/O):

| Type or rule | Contents |
|---|---|
| `BenchmarkType`, `ProjectType`, `DerivedTargetMode` | M01/runtime enums; type and project domain are independent. Target mode is a read-only projection from inspected meaningful content and the completed baseline, never a second defining field. |
| `BaselineChoice` | New: `CurrentFolder(target_inspection_id, selected_root, exclusion_policy_ref)`; legacy-only: `EmptyProject()` or `RepositoryRevision(path, revision="HEAD")`, resolved to `PinnedRevision`. No folder route substitutes the Git root. |
| `TargetInspection` | Opaque `target_inspection_id`, selected root, `source_kind: folder`, `change_fingerprint`, policy/admin-policy refs, inventory ref, meaningful/eligible/admitted counts and bytes, `target_mode` (null if inspection cannot classify reliably), exclusions with relative paths/reasons, problems, `can_continue`. Token binds reviewed facts. |
| `RepositoryInspection` | Legacy-only Git inspection: path/revision/commit/subject, tracked count, uncommitted summary and typed repository problems. It does not validate current folders. |
| `PlanningRequest` | Optional generation only: `request_id`, exact multiline idea, `benchmark_type=multi_step`, `project_type`, `definition_format=2`, `baseline: CurrentFolder`, approved evaluation-profile refs. Explicit legacy requests retain their version/pinned baseline. |
| `ManualCreation` | Durable `creation_id`, `idempotency_key`, request digest, benchmark/project type, target inspection binding, staged exact inputs/order, profile refs, snapshot ref, current job, bounded stage and terminal result/failure. No `PlanningSession`, `PlannerSelection` or invocation id. Same key+same input resumes/returns one operation; mismatched input returns conflict. |
| `validate_request` | Generation rejects whitespace-only idea, non-multi-step mode, invalid project/profile/inspection; manual validates its input union and current-folder facts without M03/M04 calls. No issue is defaulted away. |
| `PlannerSelection` | `harness`, `target`, `account_id`, `model_id` (always explicit; a selection without one is rejected with `ModelRequired`), `effort: Explicit(value) \| HarnessDefault() \| Contract(ref)`, optional `access_selection: RoutedAccessSelectionV1`, `existing_agent_selection: ExistingAgentSelectionV1`. The model is written into the approved revision's planner record, so provenance always names it. **[R031]** |
| `HARNESS_ORDER` | M03's `HarnessId` display order: Claude Code, Codex, Grok CLI, Pi, Cursor CLI, OpenCode. Not redefined here; M05.8/M05.9 verified role support is required in addition to readiness. **[R031]** |
| `PlannerCandidate` | `rank`, `harness`, `usability` (`USABLE`, `UNUSABLE`, `UNDETERMINED` from M03), `default_model: ModelRef \| None` (the harness's own default model recorded by M04 for this harness/provider/account, with source and date), `default_effort`, `supported_roles`, `reason \| None`. |
| `preselect_planner(previous, previous_check, candidates) -> PlannerPreselection` | Pure. A previous selection whose check passed and whose harness is `USABLE` and supports `Role.planner` is preselected. Otherwise candidates are walked in `HARNESS_ORDER`; the first with usability `USABLE` and verified planner-role support wins, with `default_model` (or no model when it is unknown) and `default_effort`; each other candidate is recorded `skipped` (with its reason: unusable, or `planning.harness_unconfirmed` when undetermined) or `not_reached`. An `UNDETERMINED` harness never wins. No winner → `None` with `planning.no_usable_planner`, listing the undetermined harnesses that a verification could confirm. The result records which branch was taken so the screen shows it without computing it. **[R031, R137]** |
| `selection_issues(selection, candidate)` | `UnsupportedRole` when planner capability is unverified/unsupported; `ModelRequired` when `model_id` is empty; `HarnessUnconfirmed` when the harness is `UNDETERMINED`; the harness's unusable reason when `UNUSABLE`. Applied by `StartPlanning` and `RetryPlanning`, and as `can_start`. **[R031]** |
| `BaselineSnapshot` | Complete immutable `snapshot_ref`, `digest`, `kind: empty \| folder \| repository` (repository legacy-only), admitted `SnapshotFile(path, sha256, size, executable)`, derived target mode, source inventory/change/policy refs, exclusions and capture time outside identity. Current-folder `SourceCheck` binds before/copied/after inventory equality; legacy additionally retains commit/excluded-uncommitted and Git source proof. Empty has no files; v2 folder must have files. |
| `CaptureStep` | Manual: `import_inputs`, `inspect`, `snapshot`, `source_unchanged`, `validate`, `persist`; optional planning adds `plan`, `check_draft`, `open_draft`. Legacy resolution is a separately labelled `resolve` step. State `todo \| now \| done \| failed \| not_applicable`; no LLM-planning label on a manual job. |
| `PlanningSession` | Optional-generation `session_id`, request, selection, snapshot, steps, attempts with M05 invocation/M11 job/outcome, `capturing \| planning \| failed \| drafted \| discarded`, draft id and update time. Complete snapshot survives failure; no partial draft. Startup converts active sessions to interrupted failure without automatic resume. Manual/recapture operation recovery follows the same rule without a planner session. |
| `DEFAULT_TASK_COUNT = 7` | Optional generation instruction only, with final verification/fixes last. New multi-step needs >=2; supplied inputs determine their own count and one shot remains exactly one. |
| `planner_brief(request, snapshot_summary, task_count) -> PlannerBrief` | Generation-only payload with idea/project/baseline/profile refs, v2 output selection and requested task count. |
| `PlanOutput` / `parse_planner_output(listing) -> GeneratedPlan` | Read `plan.json` task order/titles and optional shared-context paths; `tasks/<id>.md` are the primary specification files (existing generated T1…T7 map directly), >=2 for v2. `spec/00-project.md` is optional shared context, not a mandatory duplicate. Require declared acceptance/support files, protocol/services/dependencies and selected M12 rubric. Legacy parser retains its v1 specification requirement. Missing/invalid fields fail `PlanOutputInvalid`; no invented content. Display/plan.json stays outside payload. |
| `DraftText` / `DraftFile` | Retain original/generated bytes plus current authoritative UTF-8 bytes and display text. Decode strictly with no newline/Unicode normalization; merely opening a TextArea is not an edit. Import preserves bytes until explicit user edit supplies replacement UTF-8 bytes. Byte comparison determines edited state; display labels remain nondefining. |
| `DraftTask` | Stable `task_id`, display title, unique primary `prompt_path`, `DraftFile` exact bytes/ref, check bindings, optional sourcePath provenance; ordered by the draft's explicit task list. Source path is never execution order or portable identity. |
| `DraftOrigin` | `one_shot \| provided_specs \| planned \| revision \| duplicate`. New manual origins require `session_id=None`, `planner=None`, no invocation ids, and regeneration disabled. Revision/duplicate preserve the source format until an explicit upgrade. |
| `DraftCheck` | The `acceptance.v1` fields of [M08](08-verification-evidence.md) (check id, task id, title, kind, required, entry, needs, timeout) including mandatory requirement, phase, observation and failure-rule fields; plus display-only `origin: generated \| user`. Draft rows may be incomplete while editing, but approval validates the full M08 schema and bindings. |
| `ServiceRow` | `step` (`setup`, `start`, `ready`, `stop`, `test`), `command`, `cwd: RelPath` (relative to the project root), `port: int \| None`, `ready_check: str \| None`, `when`. `validate_service(row) -> tuple[FieldIssue, ...]`: command not empty; working directory relative, inside the project, no `..`; port an integer 1–65535 when given; readiness check present for `start`. Every issue names its field; nothing is defaulted. **[R031]** |
| `Draft` | `draft_id`, optimistic `version`, origin/source sha, definition format, benchmark/project type, optional session/planner, display name/last-task/update time, `shared_specifications`, ordered tasks, checks/support, services/dependencies/protocol/rubric and profile refs, completed `baseline_ref`, inspection/capture/version binding, `source_status: captured \| sourceChanged \| recapturing`, optional recapture/regeneration operation, open/approved state and approved sha. Legacy singular specification is retained only in the v1 branch. |
| `DraftEdit` | Name/title/exact task bytes/shared file/check/service edits plus `AddSpec`, `ReplaceSpec`, `ReorderSpecs`, `RemoveSpec`; all require `base_version`, increment on save and retain byte provenance. Imported sourcePath collisions, duplicate normalized payload paths, missing/unreadable/non-UTF-8 files fail before replacement. Removing below >=2 leaves an explicitly incomplete multi-step draft or is rejected visibly, never converts it; deleting one-shot T1 cannot approve. Benchmark-type change is an explicit action that visibly validates/clears incompatible content; it never invokes a planner. Reset-to-generated exists only for generated files. Approved drafts are immutable. |
| `RegenerationScope` | Task/all/shared specification scopes on planned multi-step drafts only; preserve edits outside scope and replace inside after validation/version check. Manual one-shot/provided-spec origins always return `NotPlanned`. |
| `draft_issues(draft)` | Validate the selected M01 v1/v2 shape (one-shot T1/empty shared, multi-step >=2, ordered unique primaries), nonempty strict UTF-8 input, complete capture with matching inspection/version and no sourceChanged/active recapture; full M08 check/support/phase/requirement bindings, service/protocol/dependency validators, mandatory versioned `required_per_task` instruction/check-source/deliverable-scope closure, and M12 rubric applicability/final-capture declarations. Explicit valid empty suites/documents are allowed; no mandatory generic setup/start/stop commands or global specification is invented. Seven is not a completeness rule. |
| `definition_input(draft, snapshot, rubric) -> DefinitionInput` | Pure version-dispatched mapping to M01's complete discriminated input: new manual/generated drafts select v2 with benchmark type, shared refs, ordered primaries and empty/folder baseline; legacy seeds retain the v1 format and original approved object; edits compute their ordinary new revision identity, and only an explicit upgrade selects v2. Required checks/protocol/services/dependencies/rubric and baseline executable flags remain; new approvals freeze the required task-commit policy/instruction/check source/scope within the existing protocol payload and reference closure, without changing authored task bytes. `to_frozen` passes exact bytes to the sole M01 `DefinitionCodec.write`; no M16 metadata schema/index/codec. Display/source paths, timestamps, Git labels and planner provenance stay outside identity. |
| `UnfinishedItem` | Durable creation/recapture/session/draft row with optional ids, origin, name, source label, stage/state/update, current job and terminal outcome. Manual active/failed routes reopen capture progress/failure, never planner picker; open drafts share review/editor with selected task. Optional sessions retain planning progress/failure; approved/discarded rows disappear. |
| Domain errors | `SourceChanged(changed_facts)`, `NoAdmittedFiles`, `InspectionStale`, `InputInvalid(path, reason)`, `IdempotencyConflict`, `RequestInvalid(issues)`, `NoUsablePlanner(undetermined)`, `UnsupportedRole`, `ModelRequired`, `SelectionContextMismatch`, `HarnessUnconfirmed(harness)`, `CaptureFailed(step, cause)`, `PlanOutputInvalid(missing)`, `DraftIncomplete(issues)`, `DraftApproved`, `DraftConflict(current_version)`, `EditInvalid(field_issues)`, `NotPlanned` (regeneration requested for a draft without a planner), `SessionNotFound`, `DraftNotFound`, `RequestNotFound`. |

**Ports** (`engine/planning/ports.py`, `typing.Protocol`):

```python
class ReadOnlyFolderReader(Protocol):     # M16.1; no shell/Git subprocess or source mutation
    async def inspect(self, target_dir: Path, policy_ref: str | None) -> TargetInspection: ...
    async def inventory(self, inspection: TargetInspection) -> SourceInventory: ...
    def read_files(self, inventory: SourceInventory) -> AsyncIterator[SnapshotBlob]: ...

class BaselineCapture(Protocol):          # M16.1 service consumed by M16.2/M16.3 jobs
    async def capture(self, inspection_id: str, owner: OperationRef, base_version: int | None) -> BaselineSnapshot: ...
    # Disjoint staging, before/copy/after barrier; no independent public baseline.capture API.

class ManualOperationRepository(Protocol): ...  # durable inputs/job/idempotency binding/outcome
class InspectionRepository(Protocol): ...       # reviewed inventory/policy tokens and changed facts

class GitReader(Protocol):                 # legacy committed-revision access only
    async def inspect(self, path: Path, revision: str) -> RepositoryInspection: ...
    def tree(self, path: Path, commit: str) -> AsyncIterator[TreeBlob]: ...   # path, mode, object id, bytes
    async def source_state(self, path: Path) -> SourceState: ...              # HEAD, raw index digest, working-tree content/type/mode digest and status digest

class SnapshotStore(Protocol):
    async def stage(self, owner: OperationRef, blobs: AsyncIterator[SnapshotBlob]) -> PendingSnapshot: ...
    async def publish(self, pending: PendingSnapshot, proof: SourceCheck) -> BaselineSnapshot: ...
    async def open(self, snapshot_ref: SnapshotRef) -> SnapshotHandle: ...        # read-only directory for M05
    async def discard(self, snapshot_ref: SnapshotRef) -> None: ...

class RequestRepository(Protocol): ...    # load/save PlanningRequest
class SessionRepository(Protocol): ...    # load/save/list PlanningSession, atomic replace
class DraftRepository(Protocol):          # load/save Draft with optimistic version check
    async def save(self, draft: Draft, expected_version: int | None) -> None: ...  # raises DraftConflict

class PlannerPreferences(Protocol):
    async def previous(self) -> PlannerSelection | None: ...
    async def remember(self, selection: PlannerSelection) -> None: ...
    async def approved(self, sha: Sha256, view: PublicationView) -> PlannerSelection | None: ...
    # Approved planner provenance is staged by DraftStore.prepare_approved in the same transaction, not a later write.

class PlannerOutputReader(Protocol):       # reads the planner's output tree after exit
    async def listing(self, attempt_dir: Path) -> PlanListing: ...
```

Manual creation injects capture, M01 registration, M08/M12 validators and job/storage ports only; it does not construct the planner/readiness/catalog adapters. Ports onto other modules, satisfied in `composition.py` by their application objects or thin adapters: `PlannerRunner` (M05 `HarnessExecution`, `Role.planner`, `PlanningScope(session_id, step)`), `ReadinessFacts` (M03 `ReadinessReport.last()` harness rows and `AssessOperation.assess("plan", prerequisites)`), `PlannerCatalog` (M04 `CatalogOptions.get` with the harness's recorded default model, `CatalogSelections.check`), `TemplateRegistration` (M01 `DefinitionCodec.write/read`, `TemplateIdentity.compute/verdict`, `RevisionRegistry.prepare/commit_view/rollback`), `RubricSource` (M12, rubric for a project type), `CheckFormat` (M08, `acceptance.v1` validation). Shared: `Clock`, `IdGenerator`, `EventPublisher`, `JobRunner`, `PublicationTransactions`, `PublicationView`, `TransactionId`, `RegistrationToken`. M07 `RevisionConfigs.prepare_copy/commit_view/rollback` participates when M01 approves a revision/duplicate with explicit configuration copying.

**Application** (`engine/planning/application/`, one class per use case, ports injected in `__init__`):

| Use case | Kind | Behavior |
|---|---|---|
| `RecoverDrafts` | startup | Recover requests, manual/recapture operations, optional sessions and drafts. Interrupted jobs become typed failures with complete snapshots kept and partial staging unpublished; persist owner terminal outcomes before admitting clients. Never repeat capture/model calls silently. |
| `GetPlanningDefaults` | query | Optional generation only: readiness/catalog preselection and `can_generate`. Manual `can_create` remains independent. M01 does not call this to enable manual creation. |
| `InspectTarget` | query | `ReadOnlyFolderReader.inspect` over exactly the selected directory; persist a token for inventory, derived mode, admin/exclusion policies and reviewed exclusions. Missing/not-directory/unreadable/path collision/excluded-only errors are actionable and never empty defaults. |
| `CaptureBaseline` | internal job stage | M16.1 reads actual working bytes into disjoint engine staging, validates M01 paths, compares pre/copy/post inventory and flags, then publishes snapshot. Policy/inventory drift invalidates the token; bounded retries cannot silently accept new reviewed facts. No source shell/hooks/init/write/chmod/copy-back. |
| `CreateManualDraft` | job | M16.3 factory persists idempotent request/job binding, stages exact prompt/spec bytes and order, calls M16.1 capture, validates approved profiles and complete defining files, then persists `Draft(origin=one_shot/provided_specs, session_id=None, planner=None)` and returns `DraftDTO`. Bounded import/capture/validate/persist stages never call a model or require a harness. Failure/cancel publishes no partial draft/baseline. |
| `RecaptureDraft` | job | Explicit open draft plus `base_version` and a new reviewed inspection; mark `recapturing`, capture safely, then optimistic swap of baseline/token and increment version for review. Concurrent edit, failure or cancellation keeps previous completed baseline and marks the unresolved refresh issue; approval stays blocked until explicit resolution. Approved source requires M01 new revision first. |
| `InspectRepository` | query | Explicit legacy-only `GitReader.inspect` resolves revision to commit and counts excluded uncommitted changes. Never called to validate a current folder. |
| `CreatePlanningRequest` | command | Explicit generation-only `validate_request`; persist idea, multi-step/v2 output selection, project/profile refs and target inspection. No copying/model call yet. Explicit legacy compatibility alone pins a commit. |
| `GetPlannerOptions` | query | Previous choice with its check outcome, candidates in `HARNESS_ORDER`, the preselection, the harness/model/effort choices for the harness shown (from `PlannerCatalog`, with the harness's default model marked), and, when nothing is usable, the no-usable-planner error with the undetermined harnesses a verification could confirm. Optional `selection` represents the currently shown fields: preserve it as `shown_selection`, recheck it through M03/M04 and derive `can_start`; initial load uses preselection. Its context must match supplied harness/target/account filters, otherwise return `planning.selection_context_mismatch`. **[R031, R137]** |
| `StartPlanning` | job | Validate planner role/selection/readiness, remember choice and persist session. M16.1 capture uses the reviewed current folder (legacy only uses pinned Git), commits complete snapshot, then `plan` establishes a disposable M05 copy, supplies brief, invokes; `check_draft` validates primary/shared v2 output and profiles; `open_draft` persists planned draft. Await drain/release/durable writes before terminal status. Failure keeps complete snapshot, creates no partial draft. |
| `RetryPlanning` | job | Failed generation reuses its complete snapshot for plan onward. If no complete capture exists, retry may use unchanged reviewed inventory; `baseline.source_changed` requires explicit reinspection/recapture, never a silent latest-folder update. Legacy retries only the original pinned commit. |
| `CancelPlanning` | internal | Bound to `jobs.cancel` for planning jobs: stops the planner invocation through `PlannerRunner`, awaits output/accounting drain and release, then persists `failed` with `planning.cancelled`; only then may the job become terminal. Cancelling regeneration preserves the previous complete draft. |
| `Discard` | command | Remove unfinished manual operation/session/draft and exclusively owned snapshot/staging after confirmation; refuse while its job runs. Never touch the original target. |
| `GetSession` | query | Session request_id, steps, attempts, failure, discard effect and capabilities. |
| `ListUnfinished` | query | Merge durable manual/recapture operations, optional sessions and drafts into latest-first rows; deduplicate an operation once its draft exists. Reopen points to the correct manual or generated screen and survives job-cache expiry. |
| `GetDraft`, `GetDraftTask` | query | The draft as review data with last_task_id and regeneration status; one task with generated/current text, same-task checks, intended after-task snapshot label and a line diff computed here. |
| `EditDraft` | command | `apply_edit` with the client's `base_version`; saves; publishes `planning.draft.updated`. |
| `PreviewRegeneration` | query | `regeneration_effect` for a scope, plus the planner that will be used. |
| `RegenerateDraft` | job | Invokes the draft's planner for the scope with optional guidance; `merge_regeneration`; a new draft version for review. Validate output before an optimistic `base_version` save; failure, cancellation or concurrent edit leaves the draft unchanged. Persist the regeneration job/outcome on the draft for reconnect after job-cache expiry. Refused for approved drafts and drafts without a planner. **[R030, R031]** |
| `PreviewApproval` | query | Capture `DraftStore.inspect -> DraftApprovalInput(version, frozen, capture_binding)` after source-status/active-operation guards; `TemplateIdentity.compute(frozen.payload)` for the SHA-256 the approval will register, `TemplateIdentity.verdict` for it, the name and the summary lines. An existing identity disables approval with `templates.identical_revision`. |
| `ApproveDraft` | command | Under the shared mutation lock call `DraftStore.inspect`, require its `DraftApprovalInput.version == base_version`, and revalidate completeness, source/capture/version guard and canonical identity; existing identity raises `IdenticalRevision`. Prepare `RevisionRegistry.prepare(tx, to_frozen(...), origin=custom, parent=None)` and `DraftStore.prepare_approved(tx, draft_id, version, sha)` including optional planner provenance (none for manual drafts). Await each `commit_view`, then one shared publication marker makes revision, lineage/display data, approved draft and provenance visible together. Before-marker faults roll back token-owned overlays only; after-marker faults roll forward cleanup/outbox. M01 owns library revision/duplicate coordination and registry invariants; M16 owns manual/planned approval coordination through the same public RevisionRegistry/DraftStore/PublicationTransactions ports. M01 adds M07 configuration copies only when explicitly requested. No coordinator reads another owner's private adapter/store or independently commits a participant. **F14, [R031, R136]** |

Provided to other modules (`application/interfaces.py`, in-engine Protocols, not API methods):

```python
class DraftStore(Protocol):               # M01 revise/duplicate drafts and their approval
    async def seed(self, source: DraftSeed, mode: DraftMode, name: str, scope: Sequence[ScopeHint]) -> DraftId: ...
    async def inspect(self, draft_id: DraftId) -> DraftApprovalInput: ...  # version + frozen: FrozenDraft; raises DraftNotFound, DraftIncomplete
    async def prepare_approved(self, tx: TransactionId, draft_id: DraftId, version: int, sha: Sha256) -> RegistrationToken: ...
    async def commit_view(self, tx: TransactionId) -> None: ...  # durable participant acknowledgement, never publication
    async def rollback(self, tx: TransactionId, token: RegistrationToken) -> None: ...
# DraftSeed (owned here): ApprovedRevision(sha256) | OnDiskTree(sha256, path) (the modified tree after a blocked launch);
# DraftMode: revision | duplicate; ScopeHint: task(task_id) | specification | checks | baseline | rubric (editor focus only).

# DraftApprovalInput (owned here): version: int, frozen: FrozenDraft, capture_binding: CaptureBinding. No unversioned approval read exists.

class PlannerRecord(Protocol):            # M07 judge preselection, second branch
    async def planner_selection(self, sha: Sha256) -> PlannerSelection | None: ...
```

**Adapters** (`engine/planning/adapters/`):

| Adapter | Implements | Notes |
|---|---|---|
| `git_cli.py` | legacy `GitReader` | Legacy route only: `asyncio.create_subprocess_exec("git", "-C", path, ...)` with an allowlist: `rev-parse`, `cat-file --batch`, `ls-tree -r -z`, `status --porcelain=v2 -z --untracked-files=all`, `log -1`. Environment `GIT_OPTIONAL_LOCKS=0` (status does not refresh the index), `GIT_TERMINAL_PROMPT=0`, no `GIT_DIR`/`GIT_WORK_TREE` from the user's shell. The tree comes from `ls-tree` + `cat-file`, not `git archive`, so export attributes cannot alter the committed content. Only regular `100644`/`100755` blobs are supported; reject symlinks/gitlinks/special modes with a path-specific capture error. No checkout, stash, fetch, reset, config change or hook execution is issued. Reads run without optional locks; never restore/revert concurrent user changes if before/after source state differs. **[R068, R140]** |
| `fs_snapshot.py` | `ReadOnlyFolderReader`, `SnapshotStore` | File-descriptor/lstat-based read-only inventory and disjoint staging; binary baseline bytes allowed, links not followed. Compare roster/type/content/semantic flags before and after; publish only complete proof. Store files 0444 and preserve executable flags in snapshot metadata, never infer them from physical storage. M05/M08 restore 0644/0755 files and 0755 directories. |
| `json_requests.py`, `json_sessions.py`, `json_drafts.py`, `draft_transactions.py` (extended for inspection/manual-operation records) | `RequestRepository`, `SessionRepository`, `DraftRepository`, `DraftStore`, inspection/manual-operation stores | JSON files under `~/.axbenchmark/drafts/planning/`, written by temp file + `os.replace` (fsync before rename) so they survive an engine exit; the draft version check and approval/regeneration admission serialize with the shared mutation transaction. Approval overlays and planner provenance resolve through one captured `PublicationView`; unpublished prepared changes remain invisible. |
| `yaml_preferences.py` | `PlannerPreferences` | `last-planner.yaml`, `approved-planners.yaml` (ruamel.yaml, projection of published draft provenance only). No credential values. |
| `planner_output.py` | `PlannerOutputReader` | Lists and reads the output tree written by the planner inside its disposable workspace; rejects symlinks and paths outside it. |
| `harness_planner.py` | `PlannerRunner` | Over M05 `HarnessExecution`: `Role.planner`, `PlanningScope(session_id, step)`, workspace = copy of the snapshot, record directory = `attempts/<n>/`. |
| `rpc.py` | — | Maps `axbenchmark.api.planning` DTOs to use cases and domain results and errors to the codes in part 2; registers the snapshot provider for the `planning` topic with M11's subscription service. The only file in the package importing `axbenchmark.api`. |

**Persisted state** (the engine is the only reader and writer):

```
~/.axbenchmark/planning/
  last-planner.yaml                  previous planner choice
  approved-planners.yaml             template sha256 -> planner selection (read by M07)
~/.axbenchmark/drafts/planning/      unfinished work; survives client disconnect and engine exit
  inspections/<id>.json              inventory/change/policy refs, counts, exclusions, derived mode
  operations/<id>/operation.json     manual/recapture stages, exact inputs/order, idempotency, job/outcome
  snapshots/<id>/baseline/ + baseline.json  completed immutable capture and consistency proof
  requests/<request_id>.json         optional idea, project type, folder inspection; legacy pin only
  sessions/<session_id>/
    session.json                     state, steps, attempts, failure, updated_at
    snapshot-ref.json               completed current-folder or legacy captured snapshot reference
    attempts/<n>/                    record directory handed to M05 (invocation.json, log.jsonl),
                                     input/ (brief), output/ (planner output as read)
  drafts/<draft_id>/
    draft.json                       Draft with version, name, last_task_id, edit marks and generated text
    files/                           current defining files (spec, tasks, checks/support, protocol, services, deps)
  .transactions/<tx>/                draft/provenance overlays, expected versions and exact rollback tokens
```

`~/.axbenchmark/drafts/` is shared with M07's setup drafts; M16 writes only under `drafts/planning/`. Recovery resolves unpublished rollback or published cleanup before admitting readers; it never repeats planning. Cross-store readers use the same publication view. Approved objects/tree are prepared through M01 before publication and become publicly visible at its shared marker; the draft stays as an approved, read-only record and is no longer listed as unfinished. Source folders are only read. Because drafts are on disk, the engine's idle exit does not consider them. **[R068, R140]**

**Processes owned**: no subprocess for manual inspection/capture. Legacy Git compatibility alone owns short-lived read-only `git` subprocesses. The planner harness process is started and owned by M05 as a child of `axbenchmarkd`, so planning continues when every client disconnects; only `jobs.cancel` stops it.

Draft/request/approval DTOs preserve the seven project types and one immutable rubric family/version/digest. `DraftEdit` permits explicit preapproval changes to the rubric and its evidence/scope files through the existing exact-byte edit/version mechanism; M12/M08 validate their closed schemas and cross-file reference closure. The derived `DomainEvidencePlan` and approval issues are returned in Draft/ApprovePreview, including required modalities, target/case coverage and authority/input gaps. No `metadata.json` field, latest-default substitution or silent generated waiver is added. Native target/lifecycle/accessibility matrix, backend API/data/recovery, DevOps plan-versus-applied claims, agent software cases and permitted inference/effects, and specification supplied-versus-candidate authority must be assessable before approval. Manual authoring invokes no planner/device/model; actual execution readiness is checked by M07/M03 later. **R184–R188**

**R191 approval transaction.** M16 working JSON drafts and approved provenance remain file-backed. After prepared participant files are durable, approval uses the shared SQLite transaction for operation receipt/outbox/marker even without result rows. Every PlannerRecord/unfinished/library/config reader resolves one PublicationView; no independent file marker publishes approval. Fault tests use a raw SQL reader alongside owner APIs and replay original tokens after response loss.

#### Integrated route/profile contracts (R192–R194)

PlannerSelection and planning request/session/attempt DTOs add optional RoutedAccessSelectionV1, ExistingAgentSelectionV1 and resolved access/existing plans independently selected for role planner. Effort accepts Contract only when backed by exact mapping; ordinary Explicit/HarnessDefault remains available. PlannerCatalog/M04 resolution reads stored facts; M03 assess(plan) checks prerequisites and M05 receives immutable plans under PlanningScope(session_id,step). Do not create RunUid/ConfigurationId/TrialRef, benchmark result or competitor binding for a planner.

M16.2 owns these selection/attempt extensions; M16.4 binds PlannerPicker/Progress/Failed to existing planning APIs plus M04 profile/catalog factories and explicit M03 diagnostics. Static registration alone never selects or runs a planner. Source/profile/executable/asset drift or required-role conflict blocks the next attempt, while optional inherited unknown settings stay disclosed. Sanitized route/variant evidence and planner usage live in existing session/attempt journals; imported refs remain inactive without local registration. Manual authoring constructs none of these runners. Tests cover independent planner/competitor/judge selection, source drift, no fake run, cancel/recovery with zero redispatch and unchanged manual flows.

### 2. API surface (`planning.*`)

DTOs live in `axbenchmark.api.planning`. `ActionState = {enabled: bool, reason: str | None}` where `reason` is an error code. Error notices carry the engine's `message` and `remedy`.

`DraftFileDTO` includes `path`, exact-byte storage reference/digest, strict UTF-8 `current` display text, optional original/generated refs and `edited`. `DraftCheckDTO` exposes the full M08 fields plus display origin/issues; `ServiceRowDTO` exposes `step, command, cwd, port?, ready_check?, when`; protocol/dependency/rubric detail exposes the approved frozen file references and validated display rows. `CaptureBinding` contains snapshot ref/digest, inspection token, reviewed policy refs and draft version. `SpecificationViewDTO` is M01's derived shared-plus-ordered-primary projection, never a serialized competing definition. M12 receives every file once; M05 receives shared context plus only the introduced task prefix/current primary, without promising to hide baseline/workspace content.

**Capability flags**

| Flag | Returned by | False when (reason) |
|---|---|---|
| `can_create`, `can_generate` | `planning.defaults` (optional branch) | `can_create` only authoring/storage availability; never a harness reason. `can_generate` may be blocked by `environment.no_harness`. |
| `can_continue` | `planning.inspect_target`; legacy `inspect_repository` | Current-folder inventory/input errors, `baseline.no_admitted_files`, stale/change token; repository errors only on the legacy method. |
| `can_start` | `planning.planner_options` | `planning.no_usable_planner`, `planning.unsupported_role`, `planning.harness_unconfirmed`, `planning.model_required`, `environment.no_harness`, `catalog.*` and `environment.*` reasons of the shown selection, passed through |
| `can_verify` | `planning.planner_options` (inside `no_usable_planner`) | no undetermined harness to confirm (`planning.nothing_to_verify`) |
| `can_cancel`, `can_retry`, `can_choose_planner`, `can_discard` | `planning.session` | `planning.not_running`, `planning.not_failed`, `planning.session_drafted`, `planning.session_running` |
| `can_reopen`, `can_discard` | `planning.unfinished` (per item) | `planning.session_running` for `can_discard`; `can_reopen` is always enabled for a listed item |
| `can_edit` | `planning.draft` | `planning.draft_approved` |
| `can_regenerate` | `planning.draft`, `planning.regenerate_preview` | `planning.draft_approved`, `planning.not_planned`, `planning.regeneration_running`, `environment.no_harness` |
| `can_approve` | `planning.draft`, `planning.approval_preview` | `planning.draft_incomplete`, `planning.draft_approved`, active regeneration/recapture, `baseline.source_changed`, `planning.inspection_stale`, `templates.identical_revision`. No harness gate. |

**Queries** (safety class `read`):

| Method | Request | Response | Errors |
|---|---|---|---|
| `planning.defaults` | — | `PlanningDefaults{preselection: PlannerLabelDTO \| None, branch: previous \| first_usable \| none, reason \| None, can_create, can_generate}`; optional generation defaults only | — |
| `planning.inspect_target` | `target_dir`, `exclusion_policy_ref?` | `TargetInspectionDTO{target_inspection_id, target_dir, source_kind: folder, change_fingerprint, source_inventory_ref, admin_policy_ref, exclusion_policy_ref, target_mode: DerivedTargetMode \| None, meaningful_entry_count, eligible_file_count, admitted_file_count, admitted_bytes, exclusions: [ExcludedPathDTO{path, reason, policy_ref}], problems: [ErrorInfo], can_continue}`; opaque inspection token binds reviewed inventory/policies | — (problems are data; errors never become scratch) |
| `planning.inspect_repository` | Legacy-only `path`, `revision="HEAD"` | Legacy `RepositoryInspectionDTO{path, revision, commit?, commit_subject?, tracked_files, uncommitted, exclusion_notice, problems, can_continue}` | — |
| `planning.request` | `request_id` | `PlanningRequestDTO{request_id, prompt, benchmark_type: multi_step, project_type, definition_format, target_inspection_id?, evaluation_profile_refs, baseline}`; version/pin retained only for legacy requests | `planning.unknown_request` |
| `planning.planner_options` | `request_id`, `harness?`, `target?`, `account_id?`, `selection?: PlannerSelectionDTO` | `PlannerOptions{previous: {selection, outcome: used \| invalid \| none, reason?}, candidates: [{rank, harness, label, readiness: CellDTO, usability: usable \| unusable \| undetermined, default_label, outcome: preselected \| skipped \| not_reached \| available, reason?}], preselection: PlannerSelectionDTO \| None, shown_selection: PlannerSelectionDTO \| None, fields{harnesses: [Option{harness, label, can_select, reason?}], models: [Option{model_id, label, can_select, is_harness_default, reason?}], default_model_source: SourceDTO \| None, efforts: [Option{value \| "harness_default", is_default}]}, no_usable_planner: NoUsablePlannerDTO{message, remedy, undetermined: [harness], can_verify} \| None, can_start}`; `preselection.model_id` is empty when the catalog does not know the harness's default model; undetermined harnesses are listed with `can_select: false` (`planning.harness_unconfirmed`) | `planning.unknown_request`, `planning.selection_context_mismatch` |
| `planning.session` | `session_id` | `PlanningSessionDTO{session_id, request_id, title, state, steps: [StepDTO{id, state, text, detail?, started_at?, ended_at?}], progress: float \| None, selection_label, job: JobRef \| None, attempts: [{n, invocation_id: InvocationId \| None, job_id: JobId, outcome: ExitClassification \| None, failure: ErrorInfo \| None}], failure: ErrorInfo \| None, draft_id \| None, discard_effect, capabilities}` | `planning.unknown_session` |
| `planning.operation` | `creation_id` or `operation_id` | `ManualOperationDTO{id, kind: manual_create \| recapture, stage, state, job: JobRef, steps, progress?, target_inspection_id, snapshot_ref?, draft_id?, result: DraftDTO?, failure?, capabilities, updated_at}`; durable terminal result/error survives job-cache expiry | `planning.unknown_operation` |
| `planning.unfinished` | `query: str=""` | `UnfinishedList{items: [UnfinishedItemDTO{operation_id?, creation_id?, session_id?, draft_id?, name, origin: DraftOrigin, source_label?, state: capturing \| importing \| planning \| ready_for_review \| failed, state_text, updated_at, reopen{screen: manual_progress \| manual_failed \| planning_progress \| planning_failed \| plan_review \| task_editor, operation_id?, session_id?, draft_id?, task_id?}, discard_effect, capabilities}]}`; newest first | — |
| `planning.draft` | `draft_id` | `DraftDTO{draft_id, version, state, origin: DraftOrigin, definition_format, benchmark_type, project_type, legacy, target_mode, source_status, last_task_id?, operation?, regeneration?, name{current, original?, generated?, edited}, bar_text, rubric_label, evaluation_profile_refs, baseline{snapshot_ref, digest, kind, files, target_inspection_id?, change_fingerprint?, exclusion_policy_ref?, exclusions, source_path?, commit?}, session_id?, planner_label?, shared_specifications: [DraftFileDTO], specification_view: SpecificationViewDTO, tasks: [DraftTaskRow{task_id, title, prompt_path, sourcePath?, byte_digest, check_count, state: imported \| generated \| edited \| added}], checks, services, dependencies, protocol, summary, invocation_ids, issues, capabilities}`; `specification_view` is derived; manual session/planner are null and invocation list empty | `planning.unknown_draft` |
| `planning.draft_task` | `draft_id`, `task_id` | `DraftTaskDTO{task_id, prompt_path, sourcePath?, snapshot_label, title, prompt: DraftFileDTO{current, exact_bytes_ref, byte_digest, original_bytes_ref?, generated_bytes_ref?, edited}, diff, checks, version, capabilities}`; exact bytes remain authoritative, display text never implicitly rewrites them | `planning.unknown_draft`, `planning.unknown_task` |
| `planning.regenerate_preview` | `draft_id`, `scope: task \| all \| specification`, `task_id?` | `RegeneratePreview{draft_id, version, planner_label, kept_edits: [str], replaced_edits: [str], result_text, can_regenerate}` | `planning.unknown_draft`, `planning.unknown_task`, `planning.not_planned` |
| `planning.approval_preview` | `draft_id` | `DraftApprovalPreview{draft_id, version, capture_binding, source_status, benchmark_type, project_type, target_mode, definition_format, name, label, lines, computed_sha256?, notes, issues, check_flags, verdict: new_identity \| existing_identity \| incomplete, existing_sha256?, existing_label?, verdict_text?, can_approve}`; show exact input/order/profile/baseline/exclusions. Incomplete or sourceChanged cannot approve; identical identity names the existing revision | `planning.unknown_draft` |

**Commands**:

| Method | Request | Response | Errors | Safety |
|---|---|---|---|---|
| `planning.create_request` | Explicit generation: `prompt`, `project_type`, `target_inspection_id`, `evaluation_profile_refs`, `benchmark_type=multi_step`; separately discriminated legacy baseline request only for compatibility | `PlanningRequestRef{request_id, definition_format, target_inspection_id?, commit?}` | `planning.prompt_empty`, `planning.invalid_project_type`, `planning.invalid_benchmark_type`, inspection/profile errors; legacy repository errors only for legacy request | `write` |
| `planning.edit` | `draft_id`, `base_version`, `edit: DraftEditDTO` (one of the `DraftEdit` variants with its fields) | `DraftTaskDTO` or `DraftDTO` for name, spec and service edits, with the new `version` | `planning.unknown_draft`, `planning.draft_approved`, `planning.draft_conflict{current_version}`, `planning.edit_invalid{fields}` (one `ErrorInfo` per invalid field, e.g. `name`, `command`, `cwd`, `port`, `ready_check`) | `write` |
| `planning.approve` | `draft_id`, `base_version` | `DraftApproved{sha256, template_id, label}` | `planning.unknown_draft`, `planning.draft_incomplete{issues}`, `planning.draft_approved`, `planning.draft_conflict{current_version}`, `baseline.source_changed{changed_facts}`, `planning.inspection_stale`, `planning.recapture_running`, `templates.identical_revision{existing_sha256, existing_label}`, `templates.*` from preparation (no publication); published cleanup faults retain the committed approval outcome | `write` |
| `planning.discard` | `operation_id`, `session_id` or `draft_id` (exactly one) | `{discarded: true}` | `planning.unknown_operation`, `planning.unknown_session`, `planning.unknown_draft`, `planning.operation_running`, `planning.session_running`, `planning.draft_approved` | `destructive` (deletes the snapshot and the unapproved draft) |

**Jobs** (return `JobRef`; progress through `job.progress` / `job.finished`; `jobs.get` and `jobs.cancel` address them):

| Method | Request | Progress payload | Result | Errors | Safety |
|---|---|---|---|---|---|
| `planning.create_manual` | `benchmark_type`, `project_type`, `target_inspection_id`, `inputs: {kind: one_shot, prompt_text \| prompt_file} \| {kind: provided_specs, ordered_spec_files: [InputFileRef, ...]}`, `evaluation_profile_refs`, `idempotency_key` | `{creation_id, step: import_inputs \| inspect \| snapshot \| source_unchanged \| validate \| persist, state, text, progress?}` | `DraftDTO`; return type is `JobRef -> DraftDTO` | `planning.input_invalid{path, reason}`, `planning.invalid_benchmark_type`, `planning.invalid_project_type`, `planning.idempotency_conflict`, inspection/capture/profile errors below, `planning.cancelled` | `write` |
| `planning.recapture` | `draft_id`, `base_version`, new `target_inspection_id`, `idempotency_key` | `{operation_id, draft_id, step, state, text, progress?}` | `DraftDTO` at new reviewed version | `planning.draft_conflict`, `planning.draft_approved`, `planning.recapture_running`, inspection/capture errors, `planning.cancelled` | `write` |
| `planning.start` | `request_id`, `selection: PlannerSelectionDTO` | `{session_id, step, state, text, progress?}` | `PlanningDraftRef{session_id, draft_id}` | `planning.unknown_request`, `planning.no_usable_planner`, `planning.unsupported_role{harness, role}`, `planning.harness_unconfirmed{harness}`, `planning.model_required{field: model}`, `catalog.*` and `environment.*` selection errors, `planning.capture_failed{step, cause}`, `planning.planner_failed{outcome, exit_code, message}`, `planning.output_invalid{missing}`, `planning.cancelled` | `write` |
| `planning.retry` | `session_id`, `selection?` (same planner when omitted) | as above | `PlanningDraftRef` | as above plus `planning.unknown_session`, `planning.not_failed` | `write` |
| `planning.regenerate` | `draft_id`, `scope`, `task_id?`, `guidance = ""`, `base_version` | `{draft_id, step, state, text}` | `DraftDTO` (new version) | `planning.unknown_draft`, `planning.draft_approved`, `planning.not_planned`, `planning.regeneration_running`, `planning.draft_conflict`, `planning.planner_failed`, `planning.output_invalid`, `planning.cancelled` | `write` |

`InputFileRef` is an engine-readable local path or uploaded immutable byte reference with an explicitly reviewed destination `RelPath`; repeated specs retain request order. The input discriminator must match `benchmark_type`. Exactly one of `prompt_text`/`prompt_file` is valid for one shot, and provided specs require at least two files. Strict UTF-8 decoding validates without normalizing. Duplicate sourcePath or payload-path/case-fold/file-directory collisions, missing/unreadable files, empty content, unsupported links and excluded required inputs produce field/path-specific failures. Original source paths are provenance, not canonical references. `evaluation_profile_refs` resolve approved exact checks/support, execution protocol, service/dependency definitions and applicable rubric; unresolved/incompatible profiles fail `planning.profile_invalid`, and explicit authored replacements use the same validators/editor. No implicit planner profile generation.

Current-folder failures include `baseline.target_not_found`, `baseline.not_directory`, `baseline.unreadable{path}`, `baseline.unsupported_entry{path}`, `baseline.path_collision{paths}`, `baseline.no_admitted_files`, `baseline.source_changed{changed_facts}`, `planning.inspection_stale`, `planning.capture_failed{step,cause}` and `planning.profile_invalid{fields}`. All leave source and prior complete draft content unchanged. An inspection for an already-bound source that detects changes records `sourceChanged` on that draft through the serialized owner update; preview/approval reject the stale binding. A recapture job accepts only an open draft/version; approved refresh begins with M01's revision flow. There is no live refresh on launch/retry/import.

Planner outcomes (`model_rejected`, `auth_failed`, `timed_out`, …) are M05's `ExitClassification` data, surfaced as `planning.planner_failed` with the M05 code in `cause`. The job's `JobRef.id` is recorded on the session attempt, so a reattaching client finds it through `planning.session`.

All job ids/cursors/outcomes use M11 `JobRef`, `JobStatus` and indivisible `EventCursor {epoch, seq}`. Attempts retain M05 `InvocationId`, `PlanningScope(session_id, step)` and typed `ExitClassification`; diagnostic verification uses M03 JobId plus M05 `VerificationScope`, never a RunUid/TrialRef or benchmark measurement. Before returning any accepted JobRef, persist its operation/input/idempotency or session/request/job binding; preflight refusal returns the typed error without a job. Snapshot providers expose revisioned manual-operation/session/draft objects and tombstones, including current job and durable terminal outcome. Job cache expiry falls back to these owner records, not a repeated model call. Regeneration stores `RegenerationStatus{job_id: JobId, state, result_version?, error?}` in the draft/domain DTO. It uses a projection revision for progress; only successful content replacement changes the editable base_version. Startup settles unfinished regeneration as interrupted without changing prior draft content.

Register exact planning event names separately from topics in M11. `planning` is the owner snapshot topic; only `job:<job_id>` or `jobs` carry job state, never bare `job`. All planning screens use M15's shared cursor manager: watermark before snapshots, idempotent replay, object revisions, generation replacement on epoch/compaction/overflow and fresh handoff on topic changes. Recover terminal navigation from snapshots exactly once; unmount only unsubscribes. Verification also follows `environment` and its own `job:<job_id>`; invocation cost refresh uses registered `measurements` events filtered by InvocationId.

**Events**:

| Event | Payload | Emitted when |
|---|---|---|
| `planning.session.started` | `session_id`, `request_id`, `selection_label`, `job_id` | `planning.start` or `planning.retry` accepted. |
| `planning.baseline.captured` | `operation_id?`, `session_id?`, `snapshot_ref`, `digest`, `kind`, `target_mode`, counts, exclusions/policy refs, source_check; legacy `commit?` | Complete snapshot passed the consistency barrier, before draft validation/publication. |
| `planning.session.failed` | `session_id`, `step`, `failure: ErrorInfo` | Any step failed, the job was cancelled, or `RecoverDrafts` found the session interrupted by an engine exit (`planning.interrupted`). |
| `planning.operation.started` / `planning.operation.failed` | `operation_id`, `creation_id?`, `job_id`, stage, failure? | Manual creation/recapture accepted or reaches durable failed/interrupted state. |
| `planning.draft.created` | `operation_id?`, `session_id?`, `draft_id` | Manual `persist` or generated `open_draft` finished; session absent for manual. |
| `planning.draft.updated` | `draft_id`, `version`, `change: edit \| regenerated \| recaptured \| source_changed` | An edit, generation, explicit recapture or source-status change was saved. |
| `planning.draft.approved` | `draft_id`, `sha256`, `template_id`, `label`, `transaction_id` | Only after shared publication of `planning.approve` or M01 revision approval through `DraftStore.prepare_approved`; durable outbox deduplicates delivery. |
| `planning.session.discarded` | `operation_id?`, `session_id?`, `draft_id?` | `planning.discard`. |

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `TemplateIdentity.compute`, `TemplateIdentity.verdict`, `RevisionRegistry.prepare(tx, draft, origin, parent)/commit_view/rollback`, `DefinitionCodec.write/read` (application Protocols), `FrozenDraft` (M01's registration input, with the display name beside the payload), error `templates.identical_revision` | M01 | Computed SHA-256 and identical-content block for the approval preview; registration on approval. |
| `templates.rename(template_id, name)` | M01 | Renaming after approval, as the lineage display name (TemplateScreen). |
| `ConfirmScreen` | M15 | Consent before `environment.verify`; Library "Discard draft". |
| Calls to M16-provided `DraftStore.seed` / `inspect` / `prepare_approved` / `commit_view` / `rollback` from `StartRevision` and `ApproveRevision` | M01 consumer; M16 provider | Revision and duplicate drafts edited in `TaskEditorScreen`; M01 coordinates their revision/config/draft transaction. |
| `ReadinessReport.last()` harness rows with `usability` (`USABLE`, `UNUSABLE`, `UNDETERMINED`) in display order, `AssessOperation.assess("plan", prerequisites)` (application Protocols); event `environment.report.updated` | M03 | Optional planner candidates, `can_generate`, `can_start`; refresh when readiness changes. **[R031, R137]** |
| `environment.verification_plan(harnesses)` (read-only consent text/targets), `environment.verify(consent=true, harnesses)` (job; one minimal headless call per harness through M05, outcome recorded in readiness, then `environment.report.updated`) | M03 | "Verify now" on the no-usable-planner error. **[R031, R137]** |
| `CatalogOptions.get(harness, target, account_id)`, `CatalogSelections.check(selection, required_capabilities)` (application Protocols over GetEffortChoices/CheckSelection), including the harness's own default model per harness/provider/account with source and date, read during catalog refresh without a model call | M04 | Preselected model and effort defaults; validity of a previous choice. **[R031]** |
| `HarnessExecution.establish` / `.invoke` / `.release` with `Role.planner`, `PlanningScope`, a baseline given as a typed unregistered snapshot with M01-validated paths and semantic executable flags, and `.stop_invocation` on job cancel | M05 | Headless planner on a disposable copy of the snapshot. **[R012, R068]** |
| `harness.invocation.get`, `harness.invocation.log(invocation_id, after_seq?)`, events `harness.task.started` / `harness.task.exited` for `PlanningScope` | M05 | Requested vs effective planner settings; "Open log" on a failed attempt. |
| `CheckFormat.parse/validate/validate_bindings` for `acceptance.v1` including requirement/phase/observation/failure rules and support references | M08 | Manual profiles, generated and edited checks use the format M08 runs, including valid explicit empty authored suites, the non-disableable mandatory per-task protocol check/source/scope, and final-capture declarations. |
| `RubricSource.for_project_type(project_type) -> RubricRef`, `.parse(document) -> RubricDefinition` | M12 | The complete rubric bytes/profile/applicability packaged with every manual or generated template; M12 `requirement_for(rubric)` supplies the frozen DomainEvidencePlan reference, criterion/coverage/modality obligations and exact profile/comment semantics. M08 validates approved check/target/capture/evaluation bindings: web pairs, native matrix, backend API/data/recovery, DevOps evidence modes, bounded product-agent cases or inert specification/reference closure. No domain gains an unrequested running app or screenshot requirement. **[R085]** |
| `InvocationObservationSink.accept(invocation_id, entry_id, scope, fact) -> ObservationReceipt`; `measurements.invocation(invocation_id)`, event `measurements.invocation.recorded` | M10 | Awaited scoped planner usage/exit records through M05, and separate planner cost in the draft summary, labelled outside the benchmark. |
| `JobRunner` port, `jobs.get`, `jobs.cancel`, `events.subscribe`, `job.progress`, `job.finished` | M11 | Manual creation/capture, recapture, optional planning/regeneration jobs, cancel and reattach. |

Consumers of this namespace: M01 NewTemplateScreen (`planning.inspect_target`, `planning.create_manual`; only explicit generation uses `planning.defaults`/`create_request`/`start`; `inspect_repository` is legacy-only), M01 LibraryScreen (`planning.unfinished`, `planning.discard`), M07 (`PlannerRecord`), M05/M17/M02 (the packaged baseline, through M01's registered revision).

### 4. Screens

[The benchmark design specification](../../BENCHMARK-DESIGN-SPEC.md) governs the six-harness ordering and commit-policy/evidence states. These are owner-DTO projections; screens never execute Git, provision repositories or compute commit verdicts.

M16.4 owns optional PlannerScreen/PlanningScreen/PlanningFailedScreen and M16.5 owns manual capture progress/failure and shared review/editor screens within `axbenchmark/tui/screens/planning.py`; view models in `axbenchmark/tui/viewmodels/planning.py`. Shared rules from M01 apply: loads run in `exclusive=True` workers through the injected `EngineClient`; data widgets sit in `ContentSwitcher`s with `#x`, `#x-loading`, `#x-empty`, `#x-error`; `check_action` returns `None` (dimmed, never hidden; Textual hides a binding on `False`) from the `ActionState` in the view model; error text is the engine's `message` and `remedy` verbatim. No screen selects a planner, decides which edits regeneration keeps, checks draft completeness or computes a digest; those come back from the engine.

```python
@dataclass(frozen=True)
class PlannerVM:
    previous_line: str; previous_failed: bool            # #previous-choice
    order_rows: tuple[CandidateRowVM, ...]                # #planner-order, outcome -> TCSS class
    harness_options: tuple[OptionVM, ...]; model_options: tuple[OptionVM, ...]; effort_options: tuple[OptionVM, ...]
    selected: PlannerSelectionDTO | None
    no_usable: NoUsableVM | None                          # #no-planner notice, undetermined harnesses, verify: ActionState
    start: ActionState

@dataclass(frozen=True)
class DraftVM:
    bar_text: str; tab_labels: tuple[str, str, str, str]
    name: str; name_edited: bool                          # #draft-name
    benchmark_type: str; project_type: str; target_mode: str
    origin: str; source_status: str
    specification_view: SpecificationViewDTO             # derived shared + ordered primaries
    task_rows: tuple[TaskRowVM, ...]                      # "~ edited" -> class -edited
    summary: tuple[tuple[str, str], ...]                  # #draft-summary
    services: tuple[ServiceRowVM, ...]; deps: tuple[tuple[str, str], ...]; protocol: tuple[tuple[str, str], ...]
    version: int
    actions: Mapping[str, ActionState]                    # edit, regenerate, approve

def planner_vm(opts: PlannerOptions) -> PlannerVM: ...
def manual_vm(op: ManualOperationDTO) -> ManualVM: ...     # capture/import labels, never planner labels
def session_vm(s: PlanningSessionDTO) -> SessionVM: ...      # steps glyphs, progress, failure notice
def draft_vm(d: DraftDTO, cost: InvocationAccountDTO | None) -> DraftVM: ...
def task_editor_vm(t: DraftTaskDTO) -> TaskEditorVM: ...
def service_edit_vm(row: ServiceRowDTO) -> ServiceEditVM: ...
def regenerate_vm(p: RegeneratePreview) -> RegenerateVM: ...
def approve_vm(p: DraftApprovalPreview) -> ApproveVM: ...
```

**ManualCaptureScreen / ManualCaptureFailedScreen** — M16.5 projections of `planning.operation(operation_id)` and M11 jobs, opened with the `JobRef` from `planning.create_manual` or `recapture`. Resolve the operation id from typed progress/owner snapshot, never derive it from a job id. Show “Importing inputs”, “Capturing folder”, “Validating” and “Saving draft”; no LLM planning, model/cost selector or planner log. Subscribe through M15's shared cursor manager to `planning` and `job:<id>`; successful terminal result opens `PlanReviewScreen(draft_id)`, which handles every origin. Failure shows the exact path/reason and remedy; sourceChanged exposes reinspection and explicit recapture/new-version actions. Hide/detach only unsubscribes; cancel calls `jobs.cancel`, waits cleanup and durable failure. Reopen uses owner state after job-cache expiry; resubmitting a creation with the same idempotency key cannot duplicate its draft. No manual failure screen redirects to a planner.

**PlannerScreen** — `ModalScreen[JobRef | None]`, artboards PlannerPicker, PlannerUnknownModel, PlannerNoUsable and shared PlannerVerify. Constructed with `request_id`, or with `session_id` when opened from PlanningFailedScreen ("Choose another planner").

| Aspect | Contract |
|---|---|
| Load | For a retry, obtain request_id from `planning.session(session_id)` first. `planning.planner_options(request_id)` → `#previous-choice` (✗ and reason when `outcome == invalid`), `#planner-order` (rank, harness, readiness cell, default, outcome; skipped rows muted, undetermined rows marked "not confirmed"), `#planner-fields` (harness `Select`, `Select #planner-model`, effort `RadioSet`) set to `shown_selection` (initially `preselection`). `#planner-model` shows the harness default marked from `is_harness_default` with `default_model_source`; when `preselection.model_id` is empty it shows "Pick a model" and `#start` is dimmed with `planning.model_required`. Switcher on `#planner-order`: loading, rows, error. |
| No usable planner | When `no_usable_planner` is set: `#planner-order-error` shows its `message` and `remedy` verbatim, the undetermined harnesses, and Button `#verify-now` (dimmed by `can_verify`); `#planner-fields` is disabled and nothing is preselected. |
| `#verify-now` | `environment.verification_plan(harnesses=undetermined)` then M15 `ConfirmScreen` using returned target names/versions and note verbatim; only `True` sends `environment.verify(consent=true, harnesses=<plan targets>)`; decline/escape calls nothing; the job's progress shows in `#planner-order-loading`; on `job.finished` the `environment.report.updated` reload preselects the first usable harness, or shows the error again with the recorded outcomes. |
| Field change | Harness/context change → `planning.planner_options(request_id, harness, target, account_id)` for context defaults; model/effort change → the same query with `selection=<shown fields>` to revalidate `can_start`. Preserve user fields from `shown_selection`; stale validation replies cannot replace newer input. |
| Subscriptions | `environment.report.updated` → reload options; `job.progress` / `job.finished` for its verify job. |
| `ctrl+s`, `#start` | `planning.start(request_id, selection)` (or `planning.retry(session_id, selection)`); dimmed by `can_start`; selection errors render under `#planner-fields` (`planning.model_required` marks `#planner-model`); success dismisses with the `JobRef` and opens PlanningScreen with that job id until its typed progress or planning snapshot supplies `session_id`; the screen never guesses a session id from the job id. |
| `esc`, `Back` | `dismiss(None)`; the app reopens M01's NewTemplateScreen filled from `planning.request(request_id)`. |

**PlanningScreen** — `ModalScreen[PlanningDraftRef | None]`, artboard PlanningProgress. Constructed with `session_id` when reopened, or the returned `JobRef` at initial start.

| Aspect | Contract |
|---|---|
| Load | Resolve session from the planning snapshot/job progress when necessary; `planning.session(session_id)` → `#planning-steps` (one line per `StepDTO`, glyph from `state`), `ProgressBar` (`total=None` when `progress` is `None`), elapsed from the `plan` step's `started_at`. |
| Subscriptions | `events.subscribe(["planning", "job:<job_id>"], cursor=EventCursor(epoch, seq))` through M15's manager, filtered to this session and its job: `job.progress` updates a step; `planning.baseline.captured` fills the snapshot and source lines; `job.finished` success → dismiss with the draft ref and the app pushes `PlanReviewScreen(draft_id)`; failure → the app replaces it with `PlanningFailedScreen(session_id)`. |
| `esc`, `Hide` | `dismiss(None)`; no call, planning continues in the engine. |
| `Cancel` | `jobs.cancel(job.id)`; dimmed by `can_cancel`. Terminal cancelled `JobStatus` arrives after cleanup with `planning.cancelled`; session snapshot/status supplies the durable failure if the event was missed. |

**PlanningFailedScreen** — `ModalScreen[str | None]`, artboards PlanningFailed and PlanningInterrupted. Constructed with `session_id`.

| Aspect | Contract |
|---|---|
| Load | `planning.session(session_id)` → `.notice.-error` (`failure.message`, verbatim), `#planning-steps`, `#planning-next` options enabled from `can_retry`, `can_choose_planner`, `can_discard`. |
| `#continue` with "Retry with the same planner" | `planning.retry(session_id)`; push `PlanningScreen(session_id)`. |
| `#continue` with "Choose another planner" | none; push `PlannerScreen(session_id=…)`. |
| `#continue` with "Discard the snapshot and close" | M15 ConfirmScreen using `planning.session.discard_effect`; only confirmed → `planning.discard(session_id)` and dismiss. |
| `Open log` | `harness.invocation.log(attempts[-1].invocation_id)` into a read-only `Log` view; absent invocation/log is unavailable, including capture/launch failures. |
| `esc` | `dismiss(None)`; the session and its snapshot are kept. |

**PlanReviewScreen** — `Screen`, artboards PlanReview, PlanReopened and PlanServices. Constructed with `draft_id`.

| Aspect | Contract |
|---|---|
| Load | `planning.draft(draft_id)` → `Input #draft-name` (`name.current`, "~ edited" from `name.edited`), `#draft-bar` (`bar_text`), `#draft-tabs` labels, derived whole-definition specification pane (shared context plus each ordered primary once), mode/target/exclusion/profile review, `#draft-tasks`, `#draft-summary`, Acceptance checks table, `#services`, `#deps`, `#protocol`. `DataTable.RowHighlighted` on `#draft-tasks` → `planning.draft_task(draft_id, task_id)` → `#task-detail`, selected checks and snapshot label from that same response. T4 selected means T4 checks and “after T4” snapshot label, never a hard-coded T3; PlanReview and PlanReopened share this mapping. Reject stale task responses after selection/version changes. Planner cost only when `invocation_ids` is nonempty; manual drafts show their origin and no planner cost. For generated drafts, `measurements.invocation(id)` supplies separate cost. Switcher on `#draft-tasks`: loading, rows, error; empty only when the engine returns no tasks (the draft then carries an issue). |
| Compact | The app shell sets `Screen.-compact`; TCSS hides `#draft-summary`. No call. |
| Subscriptions | `planning.draft.updated`, `planning.draft.approved` for this draft → reload; `job.progress` / `job.finished` of a regeneration job started from here → `#draft-bar` shows the step text, then reload; `measurements.invocation.recorded` for its invocation ids → refresh cost. |

| Binding | Action | API call |
|---|---|---|
| `#draft-name` `Input.Changed` | `rename_draft` | Debounced 500 ms → `planning.edit(draft_id, base_version, SetName)`; `planning.edit_invalid` marks the input `-invalid` with the message; `planning.draft_conflict` reloads. Disabled by `can_edit`; after approval the name is changed from M01's `TemplateScreen` (`templates.rename`). |
| `e`, `Edit task` | `edit` | On the Specification tab, select an actual shared or primary file in the derived view and edit its exact bytes with `SetSharedSpecification` or `SetTaskPrompt`; for tasks, push `TaskEditorScreen(draft_id, task_id)` for the highlighted row. On the Setup/start/stop tab, `e` on `#services` pushes `ServiceEditScreen(draft_id, step)` instead. Dimmed by `can_edit`. |
| `r`, `Regenerate…` | `regenerate` | none; push `RegenerateScreen(draft_id, scope=task, task_id)`. Dimmed by `can_regenerate`. |
| `a`, `Approve and save` | `approve` | none; push `ApproveDraftScreen(draft_id)`. Dimmed by `can_approve`. |
| `Move up/down`, `Add file`, `Remove file` | `edit_specs` | `planning.edit(draft_id, base_version, ReorderSpecs \| AddSpec \| RemoveSpec)` for multi-step; show numbered source/primary files. Reorder is a defining edit; removal below two leaves an incomplete draft visibly. One-shot exposes its sole exact prompt/import control. |
| `Recapture target` | `recapture` | Explicit new `planning.inspect_target(target_dir, exclusion_policy_ref?)`, review returned facts, then `planning.recapture(draft_id, base_version, target_inspection_id, idempotency_key)`; approved work must first open an M01 revision. |
| `1`–`4` | `show_tab` | none. |
| `esc` | `close` | none; pop. The draft stays on disk; the Library lists it as a "draft" row (`planning.unfinished`). |

**TaskEditorScreen** — `Screen`, artboard PlanEdit. Constructed with `draft_id` and `task_id`; also opened by M01's revise flow for a seeded draft.

| Aspect | Contract |
|---|---|
| Load | `planning.draft_task(draft_id, task_id)` → `#task-title`, `#task-text` (current), `#task-diff` (engine `diff` lines, `+` bold, `=` muted), `#task-checks` (`origin` shown as "generated" / "+ added by you", `issue` inline). The view model keeps `version`. |
| `#task-title`, `#task-text` changes | Debounced 500 ms → `planning.edit(draft_id, base_version, SetTaskTitle \| SetTaskPrompt)`; the response replaces `#task-diff` and `version`. `planning.draft_conflict` reloads the task and shows the notice. |
| `a` | `planning.edit(AddCheck{task_id})`; the returned check row is focused for its title, committed with `planning.edit(UpdateCheck)`. |
| `delete` on `#task-checks` | `planning.edit(RemoveCheck{check_id})`. |
| `ctrl+z` | `TextArea` undo; the resulting text change is sent as an ordinary edit. |
| `Reset to generated` | `planning.edit(ResetTask{task_id})`; enabled only when original generated bytes exist, never for manual input. |
| `Regenerate T…` | none; push `RegenerateScreen(draft_id, scope=task, task_id)`. Dimmed by `can_regenerate`. |
| `esc`, `#done` | none; pop (edits are already saved). In M01's revise flow the app then pushes `ApproveRevisionScreen(draft_id)`. |

All editing bindings are dimmed by `can_edit`. Opening/rendering an imported file never emits an edit or normalizes line endings; only explicit user changes replace its bytes. Serialize debounced edits and await their acknowledgement before Done, regeneration or approval preview; reload on conflict instead of replacing newer changes.

**ServiceEditScreen** — `ModalScreen[DraftDTO | None]`, artboard PlanServiceEdit, styled like the task editor. Constructed with `draft_id`, the `ServiceRowDTO` and the draft `version`.

| Aspect | Contract |
|---|---|
| Load | No call; `Input #service-command`, `#service-cwd`, `#service-port`, `#service-ready` from the row, each with a `Static .field-error` below it. |
| `ctrl+s`, `#save` | `planning.edit(draft_id, base_version, SetService{step, command, cwd, port, ready_check})`; success dismisses with the returned `DraftDTO`; `planning.edit_invalid{fields}` marks each named input `-invalid` and fills its `.field-error` with that field's message; `planning.draft_conflict` shows the notice and reloads the row. |
| `esc`, `#cancel` | `dismiss(None)`; no call. |

All fields are disabled and `#save` dimmed by `can_edit`.

**RegenerateScreen** — `ModalScreen[JobRef | None]`, artboard PlanRegenerate. Constructed with `draft_id`, initial scope and `task_id`.

| Aspect | Contract |
|---|---|
| Load | `planning.regenerate_preview(draft_id, scope, task_id)` → `.kv` (planner, kept and replaced edits, result); retain preview `version`. |
| `#regen-scope` change | Same query with the new scope. `#regen-guidance` changes issue no call. |
| `#regenerate` | `planning.regenerate(draft_id, scope, task_id, guidance, base_version=preview.version)`; dimmed by `can_regenerate`; dismiss with the `JobRef`, which the calling screen follows. |
| `esc`, `Cancel` | `dismiss(None)`. |

**ApproveDraftScreen** — `ModalScreen[bool]`, artboards PlanApprove and PlanApproveIdentical. Constructed with `draft_id`.

| Aspect | Contract |
|---|---|
| Load | `planning.approval_preview(draft_id)` → `.kv` from `lines` (including the name), `#draft-sha` (`computed_sha256` in full), retaining preview `version`, the notes; `issues` and `check_flags` listed above the buttons; `#approve` enabled from `can_approve`. |
| Blocked (`verdict == existing_identity`) | `verdict_text` ("Identical to <label> — nothing to approve") above the buttons; `#approve` dimmed with `templates.identical_revision`; Button `#open-existing` shown. |
| `enter`, `#approve` | `planning.approve(draft_id, base_version=preview.version)`; success dismisses `True` and the app replaces `PlanReviewScreen` with M01's `TemplateScreen(sha256)` on its Tasks tab and the RevisionSaved notification; errors render in the dialog. |
| `o`, `#open-existing` | none; dismiss `False` and push M01's `TemplateScreen(existing_sha256)`; the draft stays unfinished. |
| `esc`, `Back to draft` | `dismiss(False)`; no call. |

M01's **NewTemplateScreen** owns benchmark type, independent project type, target directory and exact one-shot prompt or ordered spec inputs. It calls `planning.inspect_target(target_dir, exclusion_policy_ref?) -> TargetInspectionDTO`, reviews mode/counts/exclusions/problems, then `planning.create_manual(benchmark_type, project_type, target_inspection_id, inputs, evaluation_profile_refs, idempotency_key) -> JobRef -> DraftDTO`. The app shows manual capture progress and the shared review/editor, with approval through the existing transaction. Only an explicit “Generate with planner” action uses `planning.defaults`, `create_request`, `PlannerScreen` and `start`; benchmark type stays multi-step. No harness or model picker appears as a manual prerequisite.

M01's **LibraryScreen** lists `planning.unfinished`; `enter` follows the typed manual/planned progress/failure/review/editor reopen target. “Discard draft” calls `planning.discard` only after M15 confirmation. Edits preserve `last_task_id`; stale responses cannot replace newer selected-task/version state.

### 5. CLI

These are proposed curated forms scheduled for [M14.2](../../M14/02-curated-cli-flows.md), not claims of a current executable. `axbenchmark templates create` is the plural namespace. CLI uses the same inspection, explicit-order/byte/profile review, capture and approval contracts; flags/defaults cannot bypass validation.

| Proposed command | Contract |
|---|---|
| `axbenchmark templates create --type one-shot --prompt TEXT --project-type frontend --target-dir PATH` | One exact text input; inspection and `planning.create_manual`; stream import/capture/validate/persist, then shared approval review. |
| `axbenchmark templates create --type one-shot --prompt-file FILE --project-type backend --target-dir PATH` | Exact prompt-file bytes; exactly T1, no planner. `--prompt` and `--prompt-file` are exclusive. |
| `axbenchmark templates create --type multi-step --spec FIRST --spec SECOND --project-type fullstack --target-dir PATH` | At least two primary files; repeated `--spec` argument order is authoritative. No added tasks. |
| `axbenchmark planning inspect-target PATH` | `planning.inspect_target`; show token, mode/counts, exclusions/policies and problems. |
| `axbenchmark planning generate --idea-file FILE --project-type TYPE --target-dir PATH` | Explicit optional generation: inspection, `create_request`, planner options and `start`; v2 multi-step/seven tasks by default. Selected/default known model must be explicit in the invocation record. |
| `axbenchmark planning inspect-repo PATH --revision REV` | Explicit legacy compatibility only; pinned committed baseline, never default current-folder selection. |
| `axbenchmark planning operation OPERATION_ID` / `planning status SESSION_ID` / `planning list` | Manual operation / optional planner session / all unfinished state and terminal outcomes. |
| `axbenchmark planning show DRAFT_ID --task ID` / `planning edit DRAFT_ID …` | Exact file view and versioned name/title/prompt/service/check/spec-list edits; CLI surfaces field errors and conflicts. |
| `axbenchmark planning recapture DRAFT_ID --target-dir PATH` | Explicit reinspection and review, then versioned `recapture` job. Approved work first opens a revision. |
| `axbenchmark planning regenerate DRAFT_ID --scope task\|all\|specification` | Planned multi-step drafts only; refuses manual origins. |
| `axbenchmark planning preview DRAFT_ID` / `planning approve DRAFT_ID` | Shared preview/version-bound approval; duplicate identity/sourceChanged/invalid profile blocks publication. |
| `axbenchmark planning discard --draft DRAFT_ID --yes` | Explicit confirmed destructive discard, rejected while an operation runs. |

Approved profile references are selected/reviewed through the same M16 API; the final flag spelling belongs to M14's registry. `--json` prints typed responses/events. Ctrl-C detaches and prints job status/cancel commands; failed jobs/refused approval exit 1 with the typed cause. Planner verification consent follows M03/M14 only on the generation route.

M16.5 manual capture/review/edit/approval requires M16.3 plus M15.1–2 and inherited client/job foundations; M16.4 is a later real navigation gate for optional planner generation, not a manual-screen implementation prerequisite. M16.2 generation uses >=2 ordered primary files and optional shared refs across all seven domains, consuming all six registry candidates with version-proven planner roles. Its retry reuses completed capture or requires explicit review of changed current-folder facts; it never defaults back to HEAD for new v2 authoring. Preserve explicitly declared v1 interpretation/provenance readers separately from any old-installation data migration obligation. **R177–R183**

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain and codec boundary | Derived mode before exclusions: empty/nested-empty, VCS/OS-administrative-only, ordinary-file, unsupported, unreadable and excluded-only. One-shot T1/empty shared; multi-step >=2; explicit-order/removal/type-switch issues. Strict UTF-8 with CRLF/Unicode/no-final-LF retained byte-for-byte until edit. Unique sourcePath/payload paths and case-fold/file-directory collisions. `definition_input` uses M01 v2 for new work and preserves unchanged v1 golden hashes/zero-file repository/one-task legacy meaning; no parallel metadata schema. |
| Source capture | Dirty Git (index differs from working bytes, staged deletion with current file), untracked files, binary content, non-Git, selected repository subdirectory, credential/cache exclusions and required-input exclusion error. Compare pre/copy/post path/type/bytes/semantic modes; inject content/roster/mode change, missing read permission, symlink/special entry, cancellation, staging overlap and retries. Failed/partial snapshots never ready; no source subprocess/hooks/init/chmod/write/copy-back. Legacy fixture separately proves committed-only pin and unchanged source HEAD/raw index/status/content. |
| Manual job/API | All benchmark/project/target-mode combinations with no harness installed and zero planner/readiness/catalog calls: inspect_target → create_manual → operation/draft → edit/reorder/remove → preview → approve. Missing/invalid/duplicate inputs and invalid profiles remain typed. Same idempotency key gives one operation/draft; conflicting request fails. Disconnect/engine exit/cache expiry recover durable outcomes without model/capture replay. Recapture races/version conflicts retain prior complete data; sourceChanged and active recapture block approval; explicit new revision refresh never mutates the approved source. |
| Optional generation | Previous valid planner retained; otherwise Claude Code → Codex → Grok CLI → Pi → Cursor CLI → OpenCode among usable verified planner roles only. Unknown model blocks start, undetermined readiness never runs, explicit verify consent only. Generate v2 T1…T7 primaries/shared optional; >=2 minimum; count five also accepted. Failed parser/invocation/cancel retains complete snapshot/no partial draft; retry never refreshes it. Manual one-shot/provided-spec regeneration refused. |
| Approval/publication | Real M01/M08/M12 validators accept approved profile content and explicit valid empties; reject missing required protocol/support/rubric/capture declarations and invalid task bindings. Reject missing versioned required-per-task policy/instruction/check source/scope; an empty authored suite cannot disable the mandatory protocol check. Preserve applicable UI capture/rubric validators and exact prompts. Fault all publication participants/marker/outbox boundaries: unpublished draft remains open/no revision/config copy; committed result and optional provenance recover exactly once. Identical canonical content blocks approval; display rename does not change hash. |
| Screens / CLI | Both 120×40 and 80×24: manual NewTemplate calls inspect_target/create_manual only; numbered spec list/order, exact imported bytes, mode/counts/exclusions/profile review, sourceChanged/recapture failures and optimistic conflicts. Manual progress never says LLM planning. Shared editor selected T4 renders T4 checks and after-T4 snapshot through resize/reopen/delayed responses; one-shot shows T1 final competitor stage. Optional planner verification and M14 create forms have parity. |
| Execution / exchange | Delete/change original after approval: M07/M11 launch, retries/reuse and M17 v1/v2 import consume packaged bytes without source access/planning. Every configuration/trial gets fresh identical flags/bytes. M05 fresh process per ordered step, same trial workspace state, shared/introduced-prefix pack only and manifest-based diffs alongside task repository evidence; Git readiness gates execution only, new-policy empty HEAD is unborn and populated setup commits never count as competitor work, every attempted task requires committed scoped delivery (empty milestone allowed), incompatible legacy launch requires a reviewed revision while M09 retains absent-repository T1 and its original checks; no future engine-supplied primary, no claim baseline information is hidden. M12 receives shared plus all primaries each once and one independent assessment per trial. Checks/regression/judging add no competitor tasks; required final capture evidence remains enforced. |

Existing ownership only: M16.1 extends `engine/planning/domain/repository.py`, `requests.py`, `baseline.py`, `application/inspect_repository.py`, `create_request.py`, `capture_baseline.py`, `adapters/fs_snapshot.py`, planning API and source-preservation/capture-fault fixtures. M16.3 extends `domain/drafts.py`, `draft_validation.py`, `definition_input.py`, `application/to_frozen.py`, `approval.py`, existing draft-store/manual-creation sections and conversion/approval/API fixtures. M16.2 supplies optional producer integration to that sink; M16.4–5 extend their existing screens/viewmodels/editor fixtures. Paths are proposed under `solution/axbenchmark/`; Bootstrap publishes the extended DTO fixtures before consumers. No child/node renumbering or second service/codec is introduced.

### 7. Cross-child acceptance and remaining gates

- **F01/F10:** Real M01 canonical conversion is shared by M16 and M17; unchanged M09/v1 vectors remain exact. New v2 mode/order/primary/shared/protocol/check/bytes/executable changes affect identity; name/title/source metadata do not. Restoration retains semantic flags while approved storage stays read-only.
- **R068/R140:** Current-folder consistency and read-only source proofs cover success/failure/retry/cancel on supported platforms; legacy Git pin proof remains separately scoped. Snapshot publication waits the barrier, and all run/import paths use packaged bytes.
- **F14:** Real M01/M07/M16 stores and concurrent readers see only the pre-publication open draft or complete approved revision/config/provenance tuple. Lost responses and recovery cannot duplicate results or silently add planner provenance to manual work.
- **F04/F05:** M11 owner snapshots, durable manual outcomes, `EventCursor{epoch,seq}`, replay/overflow/compaction/epoch resync, reconnect and terminal navigation cover both manual and planned routes. Reconnection/hide/detach never invokes or cancels a planner.
- **F17:** Shared review/editor preserves selected-task content/check/snapshot parity for manual and generated modes. Prototype changes and preview regeneration remain with their existing owner, outside this document edit.
- M16.3's execution prerequisite is M16.1, not M16.2; M16.2 remains mandatory before full parent completion. Parent acceptance also requires real optional supported-harness generation/cleanup and M03 consent, M08/M12 validations/evidence, separate M10 planner accounting, M01 revisions/duplicates, M07 saved configuration/judge preselection, M14 CLI and M15 full manual/generated author→run→verify journeys. Fixture-only child tests do not satisfy these gates.
