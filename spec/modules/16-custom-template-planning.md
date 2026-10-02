# M16 — Custom template planning and baseline capture

Status: proposed feature contract. [The product specification](../SPEC.md) remains authoritative. This module enables an engineer to implement and verify creation of reusable custom benchmark work without modifying the user's source project.

## Implementation children and completion gate

| Child | Delivery boundary | Completed prerequisites (all require Bootstrap) |
|---|---|---|
| [M16.1 — repository-capture](implementation/M16/01-repository-capture.md) | Read-only pinned Git capture, semantic modes and source-preservation proof | M01.1; M11.1–2 |
| [M16.2 — planning-jobs](implementation/M16/02-planning-jobs.md) | Selection, generation/regeneration, persisted sessions and recovery | M16.1; M03.1; M04.1–2; M05.1–2; M11.1–2 |
| [M16.3 — draft-approval](implementation/M16/03-draft-approval.md) | Persistent edits, canonical conversion and atomic approval participant | M16.2; M01.1–3; M08.1/M12.1 validators |
| [M16.4 — planner-screens](implementation/M16/04-planner-screens.md) | Selection, consent, progress, failure and reconnect | M16.2; M15.1–2 |
| [M16.5 — draft-editor-screens](implementation/M16/05-draft-editor-screens.md) | Review/edit/regenerate/approve with selected-task parity | M16.3–4 |

These are proposed implementation packages, not completed software. Bootstrap publishes the contracts and fixtures before their consumers; each child distinguishes those from executable prerequisites. Parent acceptance additionally requires real M01/M03/M04/M05/M07/M08/M10/M11/M12/M17 integrations, all three project types and both baseline kinds, supported macOS/Linux capture/restoration, and M15 navigation at both sizes. Wireframe F17 correction and preview regeneration remain a separate parent obligation; this specification change does not edit the prototype.

## Purpose and boundaries

Support frontend, backend, and fullstack benchmarks, each either building a new project or modifying a snapshot of an existing local Git repository. Planning produces work that users can review and approve before competitors receive it. Selecting an already approved built-in, imported, or custom template instead reuses its frozen tasks and skips planning entirely. **[R007, R030, R031]**

The surrounding library retains the existing seven-task inventory benchmark as its default, runnable without generating tasks. Users can create, duplicate, revise, and import other templates, with different saved run configurations for each. [Template library and immutable identity](01-template-library-identity.md) owns those library operations and revisions; [the inventory benchmark](09-default-inventory-benchmark.md) owns the built-in content; [run configuration](07-run-configuration.md) owns saved execution selections. Custom creation must integrate with these behaviors. **[R136]**

## Inputs, outputs, and operations

| Operation | Conceptual inputs | Required outcome |
|---|---|---|
| Choose existing work | An approved template revision | Reuse its frozen tasks without invoking the planner. **[R030, R031]** |
| Describe custom work | A multiline project prompt; frontend, backend, or fullstack type; empty project or existing repository revision | A custom planning request reflecting all three choices. **[R007, R030]** |
| Capture the starting point | Empty-project selection, or a local Git repository and selected committed revision | A baseline retained with the template; repository selection defaults to committed `HEAD`. **[R068]** |
| Select and invoke a planner | Harness, explicit model, and effort selections using the precedence below | Generated specification, ordered tasks, acceptance checks, and setup/start/stop instructions. **[R031]** |
| Review and save | Generated content, the template name, and user edits or regeneration requests | User approval followed by a saved reusable template containing the approved work. **[R031]** |
| Resume or discard | An unfinished planning session or draft | Reopened where it was left, or removed after confirmation. **[R031, R149]** |

These are behavioral operations. Following the [headless engine architecture](ARCHITECTURE.md), they run in the engine and are reached through the `planning.*` API; interfaces present their results and evaluate none of these rules. The API, storage and screens that implement them are recorded under [Implementation](#implementation). Planner execution uses [headless harness execution](05-harness-execution-isolation.md); template identity and freezing use [M01](01-template-library-identity.md).

## Planner selection and review

Expose planner harness/model/effort selection. Preselect a valid previous choice. If no valid previous choice exists, preselect the first usable harness in the display order **Claude Code, Codex, Grok, Pi**, together with the harness's own default model recorded in the catalog and its discovered effort default. Only a harness confirmed usable counts: a detected but unusable harness, or one whose readiness is undetermined (for example login not yet confirmed), is never preselected and never runs for planning. When the catalog does not know the harness's default model, the model field stays empty and the user must pick one; the planner never runs without an explicit model, so the template's provenance names it. [Environment readiness](03-environment-readiness.md) and [model discovery](04-model-catalog.md) supply availability, validity, and discovered defaults. These preselection rules are conveniences rather than model-quality recommendations. **[R031]**

If no harness is usable, planning shows an error with a "Verify now" action. With the user's consent it makes one minimal headless call per harness to confirm login and headless operation, records each outcome in readiness, and then preselects the first usable harness. Nothing is preselected or run for planning without that confirmation. **[R031, R137]**

Generate the project specification, tasks, acceptance checks, and setup/start/stop instructions for the chosen project type and starting point. Default to seven ordered tasks, with final verification and fixes included as the last task. Seven is a default for custom work; it must not be described as a mandatory count for every custom template. **[R007, R031]**

Let the user review, edit, or regenerate the proposed content before approving and saving it. Generation alone is not approval. The review shows a template name field, prefilled from the planner's suggestion and editable before approval; after approval the name is the lineage display name, still editable without changing identity. Each setup/start/stop service row is editable (command, working directory, port, readiness check), with validation errors shown per field. Approving content whose computed SHA-256 equals an existing revision is blocked with "Identical to <label> — nothing to approve" and an action to open that revision. The saved template supplies the approved inputs for future runs; choosing it later must not regenerate tasks or require a planner call. Revising or duplicating a template follows the library's revision behavior, while changing saved run configurations remains a separate operation. **[R030, R031, R136]**

## Baseline and approval invariants

For an existing repository, snapshot the selected committed revision, defaulting to `HEAD`. Clearly explain that uncommitted changes are excluded. Preserve the source repository untouched, including its uncommitted work; do not make source changes part of the snapshot merely because they are present locally. The retained baseline is the committed content selected during creation. **[R068, R140]**

Later runs and imports use the template's packaged baseline. They must never resolve a moving branch or `HEAD` again to recover starting files. Every configuration receives its own independent copy of that same baseline and identical approved inputs. Source repositories and historical benchmark artifacts remain untouched throughout the workflow. [Execution isolation](05-harness-execution-isolation.md), [portable exchange](17-zip-exchange.md), and [retained results](02-retained-results-comparability.md) consume this contract. **[R068, R140]**

An invalid previous planner choice falls through to the specified usable-harness selection. If no harness is usable, show the error and its "Verify now" action described above; never fall back to an undetermined harness. A failed baseline capture or generation cannot stand in for the required captured baseline or approved generated content; failure states must be verifiable. Do not substitute the live working tree or silently regenerate approved work to bypass a failure. **[R031, R068, R149]**

Planning sessions and drafts are persisted under `~/.axbenchmark/drafts/` and survive a client disconnect and an engine exit. The library lists each unfinished one as a "draft" row with its state (planning, ready for review, failed) and last update; opening it resumes where it was left, and "Discard draft" removes it only after confirmation. A session that was planning when the engine exited is shown as failed, never resumed silently. **[R031, R149]**

## Acceptance criteria

1. Create frontend, backend, and fullstack templates from multiline prompts using both empty projects and committed local repository baselines; complete planning, review, approval, execution, and verification end to end. **[R007, R030, R149]**
2. With a valid previous planner selection, retain that preselection. Without one, vary usable, unusable and undetermined harnesses and verify Claude Code → Codex → Grok → Pi precedence over usable harnesses only, with the catalog's default model and discovered effort default; an unknown default model leaves the model empty and blocks starting until one is picked. With no usable harness, the error and "Verify now" appear, and after a confirmed verification the first usable harness is preselected. **[R031, R137]**
3. Generated output includes the specification, acceptance checks, setup/start/stop instructions, and seven tasks by default, ending in verification/fixes. Review, edit (including the template name and each service row), and regenerate actions are available before approval and saving; approval of content identical to an existing revision is blocked; renaming after approval leaves the SHA-256 unchanged. **[R031]**
4. Capture a repository with committed and uncommitted changes. Verify exclusion is clearly explained, only the selected committed content becomes the baseline, and the source is unchanged. Move `HEAD` afterward: later runs and imports still use the captured baseline. Competitors receive identical approved inputs and independent copies; historical artifacts remain unchanged. **[R068, R140]**
5. Run approved built-in, imported, and custom templates without planning. Confirm the seven-task inventory default and integration with creation, duplication, revision, import, and separate saved configurations. **[R030, R031, R136]**
6. Stop the engine during planning and with a draft under review: after restart both appear as library draft rows (the interrupted one as failed), reopen where they were left, and "Discard draft" removes them only after confirmation. **[R031, R149]**
7. In the end-to-end workflows, verify TUI navigation/resizing and failure states with [the TUI](15-terminal-interface.md), checks with [verification](08-verification-evidence.md), and score calculations with [scoring](06-scoring-rankings.md). **[R149]**

## Implementation

This section applies [ARCHITECTURE.md](ARCHITECTURE.md). Everything here is an implementation decision; the product contract above and [SPEC.md](../SPEC.md) are unchanged by it. File names, paths, debounce intervals and step identifiers are engineering choices.

### 1. Engine component

Package `axbenchmark.engine.planning`. It owns planning requests, repository inspection and baseline capture, planning sessions (the planner invocation and its attempts), drafts (generated content plus user edits, for new templates and for revisions seeded by [M01](01-template-library-identity.md)), and the record of which planner produced an approved revision. It never defines identity itself: `to_frozen` calls M01's `DefinitionCodec.write`, and approval participates in the shared publication transaction with M01's `RevisionRegistry`.

**Domain** (`engine/planning/domain/`, frozen slotted dataclasses and pure functions, no I/O):

| Type or rule | Contents |
|---|---|
| `ProjectType` | Enum `frontend`, `backend`, `fullstack`. **[R007]** |
| `BaselineChoice` | `EmptyProject()` or `RepositoryRevision(path: Path, revision: str = "HEAD")`. **[R068]** |
| `RepositoryInspection` | `path`, `is_repository`, `revision` as typed, `commit` (full object id) or `None`, `commit_subject`, `tracked_files`, `uncommitted: UncommittedSummary(staged, modified, untracked)`, `problems: tuple[RepositoryProblem, ...]` (`not_found`, `not_a_repository`, `revision_unresolvable`, `bare_repository`). |
| `PlanningRequest` | `request_id`, `prompt` (multiline, kept verbatim), `project_type`, `baseline: EmptyProject \| PinnedRevision(path, revision, commit)`. A repository revision is resolved to a commit when the request is created and never resolved again. **[R030, R068]** |
| `validate_request(prompt, project_type, baseline, inspection)` | Returns field issues: empty prompt (whitespace only), unknown type, any `RepositoryProblem`. No issue is repaired or defaulted away. |
| `PlannerSelection` | `harness`, `target`, `account_id`, `model_id` (always explicit; a selection without one is rejected with `ModelRequired`), `effort: Explicit(value) \| HarnessDefault()`. The model is written into the approved revision's planner record, so provenance always names it. **[R031]** |
| `HARNESS_ORDER` | M03's `HarnessId` display order: Claude Code, Codex, Grok CLI, Pi. Not redefined here. **[R031]** |
| `PlannerCandidate` | `rank`, `harness`, `usability` (`USABLE`, `UNUSABLE`, `UNDETERMINED` from M03), `default_model: ModelRef \| None` (the harness's own default model recorded by M04 for this harness/provider/account, with source and date), `default_effort`, `reason \| None`. |
| `preselect_planner(previous, previous_check, candidates) -> PlannerPreselection` | Pure. A previous selection whose check passed and whose harness is `USABLE` is preselected. Otherwise candidates are walked in `HARNESS_ORDER`; the first with usability `USABLE` wins, with `default_model` (or no model when it is unknown) and `default_effort`; each other candidate is recorded `skipped` (with its reason: unusable, or `planning.harness_unconfirmed` when undetermined) or `not_reached`. An `UNDETERMINED` harness never wins. No winner → `None` with `planning.no_usable_planner`, listing the undetermined harnesses that a verification could confirm. The result records which branch was taken so the screen shows it without computing it. **[R031, R137]** |
| `selection_issues(selection, candidate)` | `ModelRequired` when `model_id` is empty; `HarnessUnconfirmed` when the harness is `UNDETERMINED`; the harness's unusable reason when `UNUSABLE`. Applied by `StartPlanning` and `RetryPlanning`, and as `can_start`. **[R031]** |
| `BaselineSnapshot` | `kind: empty \| repository`, `commit`, `source_path` (display only, never identity), `files: tuple[SnapshotFile(path, sha256, size, executable: bool)]`, `excluded_uncommitted: int`, `captured_at`, `source_check: SourceCheck(before: SourceState, after: SourceState)`. Empty projects explicitly have kind `empty` and zero files. Git regular modes `100644`/`100755` map to false/true; unsupported symlinks, gitlinks/submodules and special modes fail capture without following or dropping them. **[R068, R140]** |
| `CaptureStep` | Ids `read`, `resolve`, `snapshot`, `source_unchanged`, `plan`, `check_draft`, `open_draft`; state `todo \| now \| done \| failed \| not_applicable` (repository steps are `not_applicable` for an empty project). |
| `PlanningSession` | `session_id`, `request`, `selection`, `snapshot \| None`, `steps`, `attempts: tuple[Attempt(n, invocation_id: InvocationId \| None, job_id: JobId, outcome: ExitClassification \| None, failure)]`, `state: capturing \| planning \| failed \| drafted \| discarded`, `draft_id \| None`, `updated_at`. A session in `failed` keeps its snapshot for a retry; it never holds a partial draft. `recover(session)`: a session found `capturing` or `planning` at engine start becomes `failed` with `planning.interrupted`; it is never resumed silently. **[R031, R149]** |
| `DEFAULT_TASK_COUNT = 7` | Written into the planner brief together with "the last task is final verification and fixes". It is an instruction default; no rule rejects a draft with another count. **[R007, R031]** |
| `planner_brief(request, snapshot_summary, task_count) -> PlannerBrief` | Pure. The input payload handed to the planner: prompt, project type, baseline description, the output layout below and the task-count default. |
| `parse_planner_output(listing) -> GeneratedPlan` | Validates the planner's output tree: `plan.json` (suggested template name, ordered task ids and titles), `spec/00-project.md`, `tasks/<id>.md` for every listed task, `checks/acceptance.v1.json` plus all declared runner/helper/fixture support files, `protocol/execution.yaml`, `protocol/services.yaml` (setup, start, ready, stop, test), `deps.yaml`. The engine supplies the selected M12 rubric bytes/ref; `plan.json` and display fields never enter the canonical payload. Anything missing raises `PlanOutputInvalid(missing)`; nothing is filled in. **[R031]** |
| `DraftText` | `generated: str \| None`, `current: str`; `edited` is `generated is not None and current != generated`. The generated text is always kept beside an edit. |
| `DraftCheck` | The `acceptance.v1` fields of [M08](08-verification-evidence.md) (check id, task id, title, kind, required, entry, needs, timeout) including mandatory requirement, phase, observation and failure-rule fields; plus display-only `origin: generated \| user`. Draft rows may be incomplete while editing, but approval validates the full M08 schema and bindings. |
| `ServiceRow` | `step` (`setup`, `start`, `ready`, `stop`, `test`), `command`, `cwd: RelPath` (relative to the project root), `port: int \| None`, `ready_check: str \| None`, `when`. `validate_service(row) -> tuple[FieldIssue, ...]`: command not empty; working directory relative, inside the project, no `..`; port an integer 1–65535 when given; readiness check present for `start`. Every issue names its field; nothing is defaulted. **[R031]** |
| `Draft` | `draft_id`, `version: int`, `origin: planned \| revision \| duplicate`, `source_sha256 \| None`, `session_id \| None`, `name` (`DraftText`: the planner's suggestion as `generated`, the user's text as `current`; never part of identity), `last_task_id \| None` (the task of the last task edit), `updated_at`, `project_type`, `specification: DraftText`, `tasks: tuple[DraftTask(task_id, title: DraftText, prompt: DraftText, checks)]`, `services`, `dependencies`, `protocol`, `rubric_ref`, `baseline_ref`, `planner: PlannerSelection \| None`, `state: open \| approved`, `approved_sha256 \| None`, `regeneration: RegenerationStatus \| None`. |
| `DraftEdit` | Union: `SetName`, `SetTaskTitle`, `SetTaskPrompt`, `ResetTask`, `AddCheck`, `UpdateCheck`, `RemoveCheck`, `SetSpecification`, `SetService(step, command, cwd, port, ready_check)`. `apply_edit(draft, edit, at) -> Draft` is pure, bumps `version`, sets `updated_at = at` and, for a task edit, `last_task_id`, validates `SetName` with M01's name rule and `SetService` with `validate_service` (`EditInvalid(field_issues)`, nothing applied), and refuses any edit on an approved draft (`DraftApproved`). After approval the name is changed only as the lineage display name through M01. |
| `RegenerationScope` | `Task(task_id)`, `AllTasks` (tasks, checks and services), `Specification`. `regeneration_effect(draft, scope) -> RegenerationEffect(kept_edits, replaced_edits)` and `merge_regeneration(draft, scope, plan) -> Draft`: edits inside the scope are replaced by the new generated text, edits outside it are kept. **[R031]** |
| `draft_issues(draft) -> tuple[DraftIssue, ...]` | Completeness for approval: specification present, at least one task, every task has a title and prompt, checks reference existing tasks, setup/start/stop present; full M08 check/support/phase bindings and M12 rubric profile/project-type are valid. M12 `requirement_for(rubric)` determines screenshot inspection; web suites declare the required final-regression capture pair through M08, rather than inventing rubric fields. No check may impose an obligation absent from its approved source. Seven tasks is not checked. **[R031]** |
| `definition_input(draft, snapshot, rubric) -> DefinitionInput` | Pure mapping to every required M01 `axbenchmark-definition/1` field: format, project type, specification, ordered tasks/check ids, suite/support paths, execution protocol, services, rubric path/profile, dependencies and explicit baseline. Baseline paths have `baseline/` prefix and required `executable: bool`; empty is `{kind: empty, files: []}`. Application `to_frozen` passes this input and exact file bytes to `DefinitionCodec.write`, returning `FrozenDraft(display, payload)` with generated canonical `metadata.json`. Name, task titles, edit marks, source path/commit, timestamps and planner records stay outside payload identity. **F01, F10, [R068, R118–R120]** |
| `UnfinishedItem` | One library draft row: `session_id \| None`, `draft_id \| None`, `name`, `origin`, `source_label \| None`, `state: planning \| ready_for_review \| failed`, `updated_at`, `reopen: ReopenTarget(screen: planning_progress \| planning_failed \| plan_review \| task_editor, session_id?, draft_id?, task_id?)`. `unfinished(sessions, drafts)`: a session `capturing`/`planning` → `planning` (reopen `planning_progress`); `failed` → `failed` (`planning_failed`); an open planned draft → `ready_for_review` (`plan_review`, retaining `last_task_id` when present); an open revision or duplicate draft → `ready_for_review` (`task_editor` at `last_task_id`, else the first task). Approved drafts and discarded sessions are not listed. |
| Domain errors | `RequestInvalid(issues)`, `NoUsablePlanner(undetermined)`, `ModelRequired`, `SelectionContextMismatch`, `HarnessUnconfirmed(harness)`, `CaptureFailed(step, cause)`, `PlanOutputInvalid(missing)`, `DraftIncomplete(issues)`, `DraftApproved`, `DraftConflict(current_version)`, `EditInvalid(field_issues)`, `NotPlanned` (regeneration requested for a draft without a planner), `SessionNotFound`, `DraftNotFound`, `RequestNotFound`. |

**Ports** (`engine/planning/ports.py`, `typing.Protocol`):

```python
class GitReader(Protocol):                 # read-only Git access
    async def inspect(self, path: Path, revision: str) -> RepositoryInspection: ...
    def tree(self, path: Path, commit: str) -> AsyncIterator[TreeBlob]: ...   # path, mode, object id, bytes
    async def source_state(self, path: Path) -> SourceState: ...              # HEAD, raw index digest, working-tree content/type/mode digest and status digest

class SnapshotStore(Protocol):
    async def write(self, session_id: SessionId, blobs: AsyncIterator[TreeBlob]) -> BaselineSnapshot: ...
    async def open(self, session_id: SessionId) -> SnapshotHandle: ...        # read-only directory for M05
    async def discard(self, session_id: SessionId) -> None: ...

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

Ports onto other modules, satisfied in `composition.py` by their application objects or thin adapters: `PlannerRunner` (M05 `HarnessExecution`, `Role.planner`, `PlanningScope(session_id, step)`), `ReadinessFacts` (M03 `ReadinessReport.last()` harness rows and `AssessOperation.assess("plan", prerequisites)`), `PlannerCatalog` (M04 `CatalogOptions.get` with the harness's recorded default model, `CatalogSelections.check`), `TemplateRegistration` (M01 `DefinitionCodec.write/read`, `TemplateIdentity.compute/verdict`, `RevisionRegistry.prepare/commit_view/rollback`), `RubricSource` (M12, rubric for a project type), `CheckFormat` (M08, `acceptance.v1` validation). Shared: `Clock`, `IdGenerator`, `EventPublisher`, `JobRunner`, `PublicationTransactions`, `PublicationView`, `TransactionId`, `RegistrationToken`. M07 `RevisionConfigs.prepare_copy/commit_view/rollback` participates when M01 approves a revision/duplicate with explicit configuration copying.

**Application** (`engine/planning/application/`, one class per use case, ports injected in `__init__`):

| Use case | Kind | Behavior |
|---|---|---|
| `RecoverDrafts` | startup | Loads persisted requests, sessions and drafts from `~/.axbenchmark/drafts/planning/`; applies `recover` to each session and publishes `planning.session.failed` for the ones it changed. |
| `GetPlanningDefaults` | query | Runs `preselect_planner` over current readiness and catalog facts and returns the preselection label and `can_create`. Backs the planner hint on M01's NewTemplateScreen. **[R031]** |
| `InspectRepository` | query | `GitReader.inspect`; resolves the typed revision (default `HEAD`) to a commit and counts uncommitted changes. Reads only. **[R068]** |
| `CreatePlanningRequest` | command | `validate_request`; pins the commit; saves the request. Nothing is copied yet. **[R030, R068]** |
| `GetPlannerOptions` | query | Previous choice with its check outcome, candidates in `HARNESS_ORDER`, the preselection, the harness/model/effort choices for the harness shown (from `PlannerCatalog`, with the harness's default model marked), and, when nothing is usable, the no-usable-planner error with the undetermined harnesses a verification could confirm. Optional `selection` represents the currently shown fields: preserve it as `shown_selection`, recheck it through M03/M04 and derive `can_start`; initial load uses preselection. Its context must match supplied harness/target/account filters, otherwise return `planning.selection_context_mismatch`. **[R031, R137]** |
| `StartPlanning` | job | Validates the selection (`selection_issues`, `CheckSelection`, `AssessOperation.assess("plan", prerequisites)`); remembers it as the previous choice; creates the session; runs steps `read` → `resolve` → `snapshot` (streams `GitReader.tree` of the pinned commit into `SnapshotStore`) → `source_unchanged` (compares `source_state` before and after) → `plan` (establishes a disposable copy of the snapshot through `PlannerRunner`, writes `planner_brief`, invokes) → `check_draft` (`parse_planner_output`, `CheckFormat`) → `open_draft` (creates the draft). Reports `job.progress` per step. Commit the complete snapshot before invocation; an incomplete capture stays unpublished. Await invocation drain, release and durable session/draft writes before terminal job status. Any failure leaves the session `failed`, keeps any complete snapshot and creates no draft. **[R031, R068, R140, R149]** |
| `RetryPlanning` | job | Same as the `plan` onward steps of `StartPlanning` on a `failed` session, with the same or a new selection; reuses a complete captured snapshot. If capture failed before one existed, retries capture from the original pinned commit only; never resolves HEAD again or reads working files as baseline. **[R068, R149]** |
| `CancelPlanning` | internal | Bound to `jobs.cancel` for planning jobs: stops the planner invocation through `PlannerRunner`, awaits output/accounting drain and release, then persists `failed` with `planning.cancelled`; only then may the job become terminal. Cancelling regeneration preserves the previous complete draft. |
| `Discard` | command | Removes an unfinished session (its snapshot and unapproved draft) or an unfinished revision/duplicate draft. Refused while the session's job runs. Never touches the source repository. |
| `GetSession` | query | Session request_id, steps, attempts, failure, discard effect and capabilities. |
| `ListUnfinished` | query | `unfinished(...)` over persisted sessions and drafts, newest update first, optional text filter on name; backs the Library draft rows and reattach. **[R031, R149]** |
| `GetDraft`, `GetDraftTask` | query | The draft as review data with last_task_id and regeneration status; one task with generated/current text, same-task checks, intended after-task snapshot label and a line diff computed here. |
| `EditDraft` | command | `apply_edit` with the client's `base_version`; saves; publishes `planning.draft.updated`. |
| `PreviewRegeneration` | query | `regeneration_effect` for a scope, plus the planner that will be used. |
| `RegenerateDraft` | job | Invokes the draft's planner for the scope with optional guidance; `merge_regeneration`; a new draft version for review. Validate output before an optimistic `base_version` save; failure, cancellation or concurrent edit leaves the draft unchanged. Persist the regeneration job/outcome on the draft for reconnect after job-cache expiry. Refused for approved drafts and drafts without a planner. **[R030, R031]** |
| `PreviewApproval` | query | Capture `DraftStore.inspect -> DraftApprovalInput(version, frozen)`; `TemplateIdentity.compute(frozen.payload)` for the SHA-256 the approval will register, `TemplateIdentity.verdict` for it, the name and the summary lines. An existing identity disables approval with `templates.identical_revision`. |
| `ApproveDraft` | command | Under the shared mutation lock call `DraftStore.inspect`, require its `DraftApprovalInput.version == base_version`, and revalidate completeness/canonical identity; existing identity raises `IdenticalRevision`. Prepare `RevisionRegistry.prepare(tx, to_frozen(...), origin=custom, parent=None)` and `DraftStore.prepare_approved(tx, draft_id, version, sha)` including planner provenance. Await each `commit_view`, then one shared publication marker makes revision, lineage/display data, approved draft and provenance visible together. Before-marker faults roll back token-owned overlays only; after-marker faults roll forward cleanup/outbox. M01 owns library revision/duplicate coordination and registry invariants; M16 owns planned approval coordination through the same public RevisionRegistry/DraftStore/PublicationTransactions ports. M01 adds M07 configuration copies only when explicitly requested. No coordinator reads another owner's private adapter/store or independently commits a participant. **F14, [R031, R136]** |

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

# DraftApprovalInput (owned here): version: int, frozen: FrozenDraft. No unversioned approval read exists.

class PlannerRecord(Protocol):            # M07 judge preselection, second branch
    async def planner_selection(self, sha: Sha256) -> PlannerSelection | None: ...
```

**Adapters** (`engine/planning/adapters/`):

| Adapter | Implements | Notes |
|---|---|---|
| `git_cli.py` | `GitReader` | `asyncio.create_subprocess_exec("git", "-C", path, ...)` with an allowlist: `rev-parse`, `cat-file --batch`, `ls-tree -r -z`, `status --porcelain=v2 -z --untracked-files=all`, `log -1`. Environment `GIT_OPTIONAL_LOCKS=0` (status does not refresh the index), `GIT_TERMINAL_PROMPT=0`, no `GIT_DIR`/`GIT_WORK_TREE` from the user's shell. The tree comes from `ls-tree` + `cat-file`, not `git archive`, so export attributes cannot alter the committed content. Only regular `100644`/`100755` blobs are supported; reject symlinks/gitlinks/special modes with a path-specific capture error. No checkout, stash, fetch, reset, config change or hook execution is issued. Reads run without optional locks; never restore/revert concurrent user changes if before/after source state differs. **[R068, R140]** |
| `fs_snapshot.py` | `SnapshotStore` | Writes blobs into `sessions/<id>/baseline/` (files 0444), hashing while writing; `baseline.json` records the semantic executable flag, never inferred from stored 0444 modes. Validate all entries before publishing a complete snapshot; source metadata is outside defining payload. M05/M08 restore regular files as 0644, executable files as 0755 and directories as 0755 from these flags. |
| `json_requests.py`, `json_sessions.py`, `json_drafts.py`, `draft_transactions.py` | `RequestRepository`, `SessionRepository`, `DraftRepository`, `DraftStore` | JSON files under `~/.axbenchmark/drafts/planning/`, written by temp file + `os.replace` (fsync before rename) so they survive an engine exit; the draft version check and approval/regeneration admission serialize with the shared mutation transaction. Approval overlays and planner provenance resolve through one captured `PublicationView`; unpublished prepared changes remain invisible. |
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
  requests/<request_id>.json         prompt, type, baseline choice with pinned commit
  sessions/<session_id>/
    session.json                     state, steps, attempts, failure, updated_at
    baseline/ + baseline.json        captured committed tree, file digests, excluded count
    attempts/<n>/                    record directory handed to M05 (invocation.json, log.jsonl),
                                     input/ (brief), output/ (planner output as read)
  drafts/<draft_id>/
    draft.json                       Draft with version, name, last_task_id, edit marks and generated text
    files/                           current defining files (spec, tasks, checks/support, protocol, services, deps)
  .transactions/<tx>/                draft/provenance overlays, expected versions and exact rollback tokens
```

`~/.axbenchmark/drafts/` is shared with M07's setup drafts; M16 writes only under `drafts/planning/`. Recovery resolves unpublished rollback or published cleanup before admitting readers; it never repeats planning. Cross-store readers use the same publication view. Approved objects/tree are prepared through M01 before publication and become publicly visible at its shared marker; the draft stays as an approved, read-only record and is no longer listed as unfinished. Source repositories are only read. Because drafts are on disk, the engine's idle exit does not consider them. **[R068, R140]**

**Processes owned**: short-lived read-only `git` subprocesses. The planner harness process is started and owned by M05 as a child of `axbenchmarkd`, so planning continues when every client disconnects; only `jobs.cancel` stops it.

### 2. API surface (`planning.*`)

DTOs live in `axbenchmark.api.planning`. `ActionState = {enabled: bool, reason: str | None}` where `reason` is an error code. Error notices carry the engine's `message` and `remedy`.

**Capability flags**

| Flag | Returned by | False when (reason) |
|---|---|---|
| `can_create` | `planning.defaults` | no supported harness (`environment.no_harness`) |
| `can_continue` | `planning.inspect_repository` | any repository problem (`planning.repository_not_found`, `planning.not_a_repository`, `planning.revision_unresolvable`) |
| `can_start` | `planning.planner_options` | `planning.no_usable_planner`, `planning.harness_unconfirmed`, `planning.model_required`, `environment.no_harness`, `catalog.*` and `environment.*` reasons of the shown selection, passed through |
| `can_verify` | `planning.planner_options` (inside `no_usable_planner`) | no undetermined harness to confirm (`planning.nothing_to_verify`) |
| `can_cancel`, `can_retry`, `can_choose_planner`, `can_discard` | `planning.session` | `planning.not_running`, `planning.not_failed`, `planning.session_drafted`, `planning.session_running` |
| `can_reopen`, `can_discard` | `planning.unfinished` (per item) | `planning.session_running` for `can_discard`; `can_reopen` is always enabled for a listed item |
| `can_edit` | `planning.draft` | `planning.draft_approved` |
| `can_regenerate` | `planning.draft`, `planning.regenerate_preview` | `planning.draft_approved`, `planning.not_planned`, `planning.regeneration_running`, `environment.no_harness` |
| `can_approve` | `planning.draft`, `planning.approval_preview` | `planning.draft_incomplete`, `planning.draft_approved`, `planning.regeneration_running`, `templates.identical_revision` |

**Queries** (safety class `read`):

| Method | Request | Response | Errors |
|---|---|---|---|
| `planning.defaults` | — | `PlanningDefaults{preselection: PlannerLabelDTO \| None, branch: previous \| first_usable \| none, reason \| None, can_create}` | — |
| `planning.inspect_repository` | `path`, `revision = "HEAD"` | `RepositoryInspectionDTO{path, revision, commit \| None, commit_short, commit_subject, tracked_files, uncommitted{staged, modified, untracked, total}, exclusion_notice, problems: [ErrorInfo], can_continue}` | — (problems are data) |
| `planning.request` | `request_id` | `PlanningRequestDTO{request_id, prompt, project_type, baseline{kind, path?, revision?, commit?}}` | `planning.unknown_request` |
| `planning.planner_options` | `request_id`, `harness?`, `target?`, `account_id?`, `selection?: PlannerSelectionDTO` | `PlannerOptions{previous: {selection, outcome: used \| invalid \| none, reason?}, candidates: [{rank, harness, label, readiness: CellDTO, usability: usable \| unusable \| undetermined, default_label, outcome: preselected \| skipped \| not_reached \| available, reason?}], preselection: PlannerSelectionDTO \| None, shown_selection: PlannerSelectionDTO \| None, fields{harnesses: [Option{harness, label, can_select, reason?}], models: [Option{model_id, label, can_select, is_harness_default, reason?}], default_model_source: SourceDTO \| None, efforts: [Option{value \| "harness_default", is_default}]}, no_usable_planner: NoUsablePlannerDTO{message, remedy, undetermined: [harness], can_verify} \| None, can_start}`; `preselection.model_id` is empty when the catalog does not know the harness's default model; undetermined harnesses are listed with `can_select: false` (`planning.harness_unconfirmed`) | `planning.unknown_request`, `planning.selection_context_mismatch` |
| `planning.session` | `session_id` | `PlanningSessionDTO{session_id, request_id, title, state, steps: [StepDTO{id, state, text, detail?, started_at?, ended_at?}], progress: float \| None, selection_label, job: JobRef \| None, attempts: [{n, invocation_id: InvocationId \| None, job_id: JobId, outcome: ExitClassification \| None, failure: ErrorInfo \| None}], failure: ErrorInfo \| None, draft_id \| None, discard_effect, capabilities}` | `planning.unknown_session` |
| `planning.unfinished` | `query: str = ""` | `UnfinishedList{items: [UnfinishedItemDTO{session_id?, draft_id?, name, origin: planned \| revision \| duplicate, source_label?, state: planning \| ready_for_review \| failed, state_text, updated_at, reopen: {screen: planning_progress \| planning_failed \| plan_review \| task_editor, session_id?, draft_id?, task_id?}, discard_effect, capabilities{can_reopen, can_discard}}]}`, newest update first | — |
| `planning.draft` | `draft_id` | `DraftDTO{draft_id, version, state, origin, last_task_id?, regeneration: RegenerationStatus \| None, name{current, generated?, edited}, bar_text, project_type, rubric_label, baseline{kind, source_path?, commit?, files, excluded_uncommitted}, planner_label?, specification{markdown, edited}, tasks: [DraftTaskRow{task_id, title, check_count, state: generated \| edited \| added}], checks: [DraftCheckDTO], services: [ServiceRowDTO{step, command, cwd, port?, ready_check?, when}], dependencies: [KvDTO], protocol: [KvDTO], summary: [KvDTO], invocation_ids: [str], issues: [ErrorInfo], capabilities}` | `planning.unknown_draft` |
| `planning.draft_task` | `draft_id`, `task_id` | `DraftTaskDTO{task_id, snapshot_label, title{current, generated?, edited}, prompt{current, generated?, edited}, diff: [DiffLine{kind: same \| added \| removed, text}], checks: [DraftCheckDTO{check_id, title, kind, required, origin, issue?}], version, capabilities}` | `planning.unknown_draft`, `planning.unknown_task` |
| `planning.regenerate_preview` | `draft_id`, `scope: task \| all \| specification`, `task_id?` | `RegeneratePreview{draft_id, version, planner_label, kept_edits: [str], replaced_edits: [str], result_text, can_regenerate}` | `planning.unknown_draft`, `planning.unknown_task` |
| `planning.approval_preview` | `draft_id` | `DraftApprovalPreview{draft_id, version, name, label, lines: [KvDTO], computed_sha256, notes: [str], issues: [ErrorInfo], check_flags: [ErrorInfo], verdict: new_identity \| existing_identity, existing_sha256?, existing_label?, verdict_text?, can_approve}`; with `existing_identity`, `verdict_text` is "Identical to <existing_label> — nothing to approve" and `can_approve` is disabled with `templates.identical_revision` | `planning.unknown_draft` |

**Commands**:

| Method | Request | Response | Errors | Safety |
|---|---|---|---|---|
| `planning.create_request` | `prompt`, `project_type`, `baseline: {kind: empty} \| {kind: repository, path, revision = "HEAD"}` | `PlanningRequestRef{request_id, commit?}` | `planning.prompt_empty{field: prompt}`, `planning.invalid_project_type{field}`, `planning.repository_not_found{field: path}`, `planning.not_a_repository{field: path}`, `planning.revision_unresolvable{field: revision}`, `environment.no_harness` | `write` |
| `planning.edit` | `draft_id`, `base_version`, `edit: DraftEditDTO` (one of the `DraftEdit` variants with its fields) | `DraftTaskDTO` or `DraftDTO` for name, spec and service edits, with the new `version` | `planning.unknown_draft`, `planning.draft_approved`, `planning.draft_conflict{current_version}`, `planning.edit_invalid{fields}` (one `ErrorInfo` per invalid field, e.g. `name`, `command`, `cwd`, `port`, `ready_check`) | `write` |
| `planning.approve` | `draft_id`, `base_version` | `DraftApproved{sha256, template_id, label}` | `planning.unknown_draft`, `planning.draft_incomplete{issues}`, `planning.draft_approved`, `planning.draft_conflict{current_version}`, `templates.identical_revision{existing_sha256, existing_label}`, `templates.*` from preparation (no publication); published cleanup faults retain the committed approval outcome | `write` |
| `planning.discard` | `session_id` or `draft_id` (exactly one) | `{discarded: true}` | `planning.unknown_session`, `planning.unknown_draft`, `planning.session_running`, `planning.draft_approved` | `destructive` (deletes the snapshot and the unapproved draft) |

**Jobs** (return `JobRef`; progress through `job.progress` / `job.finished`; `jobs.get` and `jobs.cancel` address them):

| Method | Request | Progress payload | Result | Errors | Safety |
|---|---|---|---|---|---|
| `planning.start` | `request_id`, `selection: PlannerSelectionDTO` | `{session_id, step, state, text, progress?}` | `PlanningDraftRef{session_id, draft_id}` | `planning.unknown_request`, `planning.no_usable_planner`, `planning.harness_unconfirmed{harness}`, `planning.model_required{field: model}`, `catalog.*` and `environment.*` selection errors, `planning.capture_failed{step, cause}`, `planning.planner_failed{outcome, exit_code, message}`, `planning.output_invalid{missing}`, `planning.cancelled` | `write` |
| `planning.retry` | `session_id`, `selection?` (same planner when omitted) | as above | `PlanningDraftRef` | as above plus `planning.unknown_session`, `planning.not_failed` | `write` |
| `planning.regenerate` | `draft_id`, `scope`, `task_id?`, `guidance = ""`, `base_version` | `{draft_id, step, state, text}` | `DraftDTO` (new version) | `planning.unknown_draft`, `planning.draft_approved`, `planning.not_planned`, `planning.regeneration_running`, `planning.draft_conflict`, `planning.planner_failed`, `planning.output_invalid`, `planning.cancelled` | `write` |

Planner outcomes (`model_rejected`, `auth_failed`, `timed_out`, …) are M05's `ExitClassification` data, surfaced as `planning.planner_failed` with the M05 code in `cause`. The job's `JobRef.id` is recorded on the session attempt, so a reattaching client finds it through `planning.session`.

All job ids/cursors/outcomes use M11 `JobRef`, `JobStatus` and indivisible `EventCursor {epoch, seq}`. Attempts retain M05 `InvocationId`, `PlanningScope(session_id, step)` and typed `ExitClassification`; diagnostic verification uses M03 JobId plus M05 `VerificationScope`, never a RunUid/TrialRef or benchmark measurement. Before returning an accepted planning JobRef, persist its session/request/job binding; preflight refusal returns the typed error without a job. Snapshot providers expose revisioned session/draft objects and tombstones, including current job and durable terminal outcome. Job cache expiry falls back to these owner records, not a repeated model call. Regeneration stores `RegenerationStatus{job_id: JobId, state, result_version?, error?}` in the draft/domain DTO. It uses a projection revision for progress; only successful content replacement changes the editable base_version. Startup settles unfinished regeneration as interrupted without changing prior draft content.

Register exact planning event names separately from topics in M11. `planning` is the owner snapshot topic; only `job:<job_id>` or `jobs` carry job state, never bare `job`. All planning screens use M15's shared cursor manager: watermark before snapshots, idempotent replay, object revisions, generation replacement on epoch/compaction/overflow and fresh handoff on topic changes. Recover terminal navigation from snapshots exactly once; unmount only unsubscribes. Verification also follows `environment` and its own `job:<job_id>`; invocation cost refresh uses registered `measurements` events filtered by InvocationId.

**Events**:

| Event | Payload | Emitted when |
|---|---|---|
| `planning.session.started` | `session_id`, `request_id`, `selection_label`, `job_id` | `planning.start` or `planning.retry` accepted. |
| `planning.baseline.captured` | `session_id`, `kind`, `commit?`, `files`, `excluded_uncommitted`, `source_check` | The `snapshot` and `source_unchanged` steps finished. |
| `planning.session.failed` | `session_id`, `step`, `failure: ErrorInfo` | Any step failed, the job was cancelled, or `RecoverDrafts` found the session interrupted by an engine exit (`planning.interrupted`). |
| `planning.draft.created` | `session_id`, `draft_id` | `open_draft` finished. |
| `planning.draft.updated` | `draft_id`, `version`, `change: edit \| regenerated` | An edit or regeneration was saved. |
| `planning.draft.approved` | `draft_id`, `sha256`, `template_id`, `label`, `transaction_id` | Only after shared publication of `planning.approve` or M01 revision approval through `DraftStore.prepare_approved`; durable outbox deduplicates delivery. |
| `planning.session.discarded` | `session_id?`, `draft_id?` | `planning.discard`. |

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `TemplateIdentity.compute`, `TemplateIdentity.verdict`, `RevisionRegistry.prepare(tx, draft, origin, parent)/commit_view/rollback`, `DefinitionCodec.write/read` (application Protocols), `FrozenDraft` (M01's registration input, with the display name beside the payload), error `templates.identical_revision` | M01 | Computed SHA-256 and identical-content block for the approval preview; registration on approval. |
| `templates.rename(template_id, name)` | M01 | Renaming after approval, as the lineage display name (TemplateScreen). |
| `ConfirmScreen` | M15 | Consent before `environment.verify`; Library "Discard draft". |
| Calls to M16-provided `DraftStore.seed` / `inspect` / `prepare_approved` / `commit_view` / `rollback` from `StartRevision` and `ApproveRevision` | M01 consumer; M16 provider | Revision and duplicate drafts edited in `TaskEditorScreen`; M01 coordinates their revision/config/draft transaction. |
| `ReadinessReport.last()` harness rows with `usability` (`USABLE`, `UNUSABLE`, `UNDETERMINED`) in display order, `AssessOperation.assess("plan", prerequisites)` (application Protocols); event `environment.report.updated` | M03 | Planner candidates, `can_create`, `can_start`; refresh when readiness changes. **[R031, R137]** |
| `environment.verification_plan(harnesses)` (read-only consent text/targets), `environment.verify(consent=true, harnesses)` (job; one minimal headless call per harness through M05, outcome recorded in readiness, then `environment.report.updated`) | M03 | "Verify now" on the no-usable-planner error. **[R031, R137]** |
| `CatalogOptions.get(harness, target, account_id)`, `CatalogSelections.check(selection, required_capabilities)` (application Protocols over GetEffortChoices/CheckSelection), including the harness's own default model per harness/provider/account with source and date, read during catalog refresh without a model call | M04 | Preselected model and effort defaults; validity of a previous choice. **[R031]** |
| `HarnessExecution.establish` / `.invoke` / `.release` with `Role.planner`, `PlanningScope`, a baseline given as a typed unregistered snapshot with M01-validated paths and semantic executable flags, and `.stop_invocation` on job cancel | M05 | Headless planner on a disposable copy of the snapshot. **[R012, R068]** |
| `harness.invocation.get`, `harness.invocation.log(invocation_id, after_seq?)`, events `harness.task.started` / `harness.task.exited` for `PlanningScope` | M05 | Requested vs effective planner settings; "Open log" on a failed attempt. |
| `CheckFormat.parse/validate/validate_bindings` for `acceptance.v1` including requirement/phase/observation/failure rules and support references | M08 | Planner and edited checks use the format M08 runs. |
| `RubricSource.for_project_type(project_type) -> RubricRef`, `.parse(document) -> RubricDefinition` | M12 | The complete rubric bytes/profile/applicability packaged with a planned template; M12 `requirement_for(rubric)` supplies the screenshot-inspection requirement, fulfilled by M08 final-regression captures. **[R085]** |
| `InvocationObservationSink.accept(invocation_id, entry_id, scope, fact) -> ObservationReceipt`; `measurements.invocation(invocation_id)`, event `measurements.invocation.recorded` | M10 | Awaited scoped planner usage/exit records through M05, and separate planner cost in the draft summary, labelled outside the benchmark. |
| `JobRunner` port, `jobs.get`, `jobs.cancel`, `events.subscribe`, `job.progress`, `job.finished` | M11 | Planning and regeneration jobs, cancel, reattach. |

Consumers of this namespace: M01 NewTemplateScreen (`planning.defaults`, `planning.inspect_repository`, `planning.create_request`), M01 LibraryScreen (`planning.unfinished`, `planning.discard`), M07 (`PlannerRecord`), M05/M17/M02 (the packaged baseline, through M01's registered revision).

### 4. Screens

M16.4 owns PlannerScreen/PlanningScreen/PlanningFailedScreen and M16.5 owns the review/editor screens within `axbenchmark/tui/screens/planning.py`; view models in `axbenchmark/tui/viewmodels/planning.py`. Shared rules from M01 apply: loads run in `exclusive=True` workers through the injected `EngineClient`; data widgets sit in `ContentSwitcher`s with `#x`, `#x-loading`, `#x-empty`, `#x-error`; `check_action` returns `None` (dimmed, never hidden; Textual hides a binding on `False`) from the `ActionState` in the view model; error text is the engine's `message` and `remedy` verbatim. No screen selects a planner, decides which edits regeneration keeps, checks draft completeness or computes a digest; those come back from the engine.

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
    task_rows: tuple[TaskRowVM, ...]                      # "~ edited" -> class -edited
    summary: tuple[tuple[str, str], ...]                  # #draft-summary
    services: tuple[ServiceRowVM, ...]; deps: tuple[tuple[str, str], ...]; protocol: tuple[tuple[str, str], ...]
    version: int
    actions: Mapping[str, ActionState]                    # edit, regenerate, approve

def planner_vm(opts: PlannerOptions) -> PlannerVM: ...
def session_vm(s: PlanningSessionDTO) -> SessionVM: ...      # steps glyphs, progress, failure notice
def draft_vm(d: DraftDTO, cost: InvocationAccountDTO | None) -> DraftVM: ...
def task_editor_vm(t: DraftTaskDTO) -> TaskEditorVM: ...
def service_edit_vm(row: ServiceRowDTO) -> ServiceEditVM: ...
def regenerate_vm(p: RegeneratePreview) -> RegenerateVM: ...
def approve_vm(p: DraftApprovalPreview) -> ApproveVM: ...
```

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
| Load | `planning.draft(draft_id)` → `Input #draft-name` (`name.current`, "~ edited" from `name.edited`), `#draft-bar` (`bar_text`), `#draft-tabs` labels, Specification pane, `#draft-tasks`, `#draft-summary`, Acceptance checks table, `#services`, `#deps`, `#protocol`. `DataTable.RowHighlighted` on `#draft-tasks` → `planning.draft_task(draft_id, task_id)` → `#task-detail`, selected checks and snapshot label from that same response. T4 selected means T4 checks and “after T4” snapshot label, never a hard-coded T3; PlanReview and PlanReopened share this mapping. Reject stale task responses after selection/version changes. Planner cost: `measurements.invocation(id)` for each id in `invocation_ids`, shown in the summary as returned. Switcher on `#draft-tasks`: loading, rows, error; empty only when the engine returns no tasks (the draft then carries an issue). |
| Compact | The app shell sets `Screen.-compact`; TCSS hides `#draft-summary`. No call. |
| Subscriptions | `planning.draft.updated`, `planning.draft.approved` for this draft → reload; `job.progress` / `job.finished` of a regeneration job started from here → `#draft-bar` shows the step text, then reload; `measurements.invocation.recorded` for its invocation ids → refresh cost. |

| Binding | Action | API call |
|---|---|---|
| `#draft-name` `Input.Changed` | `rename_draft` | Debounced 500 ms → `planning.edit(draft_id, base_version, SetName)`; `planning.edit_invalid` marks the input `-invalid` with the message; `planning.draft_conflict` reloads. Disabled by `can_edit`; after approval the name is changed from M01's `TemplateScreen` (`templates.rename`). |
| `e`, `Edit task` | `edit` | On the Specification tab, focus a TextArea whose debounced changes send `planning.edit(draft_id, base_version, SetSpecification)`; for tasks, push `TaskEditorScreen(draft_id, task_id)` for the highlighted row. On the Setup/start/stop tab, `e` on `#services` pushes `ServiceEditScreen(draft_id, step)` instead. Dimmed by `can_edit`. |
| `r`, `Regenerate…` | `regenerate` | none; push `RegenerateScreen(draft_id, scope=task, task_id)`. Dimmed by `can_regenerate`. |
| `a`, `Approve and save` | `approve` | none; push `ApproveDraftScreen(draft_id)`. Dimmed by `can_approve`. |
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
| `Reset to generated` | `planning.edit(ResetTask{task_id})`. |
| `Regenerate T…` | none; push `RegenerateScreen(draft_id, scope=task, task_id)`. Dimmed by `can_regenerate`. |
| `esc`, `#done` | none; pop (edits are already saved). In M01's revise flow the app then pushes `ApproveRevisionScreen(draft_id)`. |

All editing bindings are dimmed by `can_edit`. Serialize debounced edits and await their acknowledgement before Done, regeneration or approval preview; reload on conflict instead of replacing newer changes.

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

M01's **NewTemplateScreen** is the entry point and issues `planning.defaults`, `planning.inspect_repository` and `planning.create_request` (see M01 part 4); on success the app pushes `PlannerScreen(request_id)`. M01's **LibraryScreen** lists `planning.unfinished` items as draft rows; `enter` pushes the screen named by `reopen` (`PlanningScreen`, `PlanningFailedScreen`, `PlanReviewScreen`, or `TaskEditorScreen` at `task_id`), and "Discard draft" issues `planning.discard` after M15's `ConfirmScreen`. Every task edit records that task as `last_task_id`, so the next reopen returns to it.

### 5. CLI

Planning has no product command in [M14](14-command-line-interface.md); these commands exist because every API method must be reachable from the CLI and are generated from the registry. `--json` prints the response or the job's event stream.

| Command | API |
|---|---|
| `axbenchmark planning defaults` | `planning.defaults` |
| `axbenchmark planning inspect-repo PATH [--revision REV]` | `planning.inspect_repository` |
| `axbenchmark planning new --prompt-file FILE --type frontend\|backend\|fullstack (--empty \| --repo PATH [--revision REV])` | `planning.create_request`; prints the request id and pinned commit |
| `axbenchmark planning planners REQUEST_ID [--harness H]` | `planning.planner_options` |
| `axbenchmark planning start REQUEST_ID [--harness H --model M --effort E\|default]` | `planning.start` job with the given or preselected selection; streams steps; Ctrl-C detaches and prints the `status` and `cancel` commands. Without `--model` and with no known harness default it exits 1 with `planning.model_required`; with no usable harness it exits 1 with `planning.no_usable_planner`, whose remedy names M03's verify command (`axbenchmark doctor --verify`, `environment.verify`). |
| `axbenchmark planning status SESSION_ID` / `planning list [--filter TEXT]` | `planning.session` / `planning.unfinished` |
| `axbenchmark planning cancel SESSION_ID` | `jobs.cancel` for the session's job |
| `axbenchmark planning retry SESSION_ID [--harness … --model … --effort …]` | `planning.retry` job |
| `axbenchmark planning discard (SESSION_ID \| --draft DRAFT_ID) --yes` | `planning.discard` (destructive; refuses without `--yes`) |
| `axbenchmark planning show DRAFT_ID [--task ID]` | `planning.draft` / `planning.draft_task` |
| `axbenchmark planning edit DRAFT_ID (--name NAME \| --task ID (--title T \| --prompt-file F) \| --service STEP [--command C] [--cwd DIR] [--port N] [--ready CHECK])` | `planning.edit` with the draft's current version; field errors print one line per field |
| `axbenchmark planning regenerate DRAFT_ID --scope task\|all\|specification [--task ID] [--guidance TEXT]` | `planning.regenerate` job |
| `axbenchmark planning preview DRAFT_ID` / `planning approve DRAFT_ID` | `planning.approval_preview` / `planning.approve(base_version=preview.version)`; prints the full SHA-256; an identical revision exits 1 with `templates.identical_revision` naming it |

Exit codes follow ARCHITECTURE.md: a failed planning job or a refused approval exits 1 with the typed error.

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain | `preselect_planner`: valid previous choice kept; invalid previous choice and a previous choice on a now-undetermined harness fall through; every permutation of usable/unusable/undetermined/undetected harnesses yields the first usable in Claude Code → Codex → Grok → Pi with its recorded default model and effort, detected-but-unusable and undetermined recorded as skipped; an unknown default model yields a preselection with an empty model; nothing usable → `no_usable_planner` listing the undetermined harnesses. `selection_issues` returns `ModelRequired` for an empty model and `HarnessUnconfirmed` for an undetermined harness. `validate_service` reports each invalid field (empty command, `..` or absolute cwd, port 0 and 70000, `start` without readiness check). `unfinished` maps each session and draft state to its row state and reopen target; `recover` turns `planning` into `failed` with `planning.interrupted`. `validate_request` rejects a whitespace prompt and each repository problem without defaulting. `parse_planner_output` rejects each missing part. `merge_regeneration` keeps edits outside the scope and replaces those inside. `draft_issues` accepts a five-task and a seven-task draft alike. `apply_edit` refuses on an approved draft and bumps the version. `to_frozen` includes only captured baseline files with semantic flags and canonical defining content, excluding display/source/planner metadata. **[R007, R031, R068]** |
| Use cases (fake ports) | Fixture Git repository with committed files, a staged change, a modified file and an untracked file: `StartPlanning` snapshots exactly the committed tree of the pinned commit, reports `excluded_uncommitted = 3`, and the repository's HEAD, index bytes, working tree and status are byte-identical afterwards. Moving HEAD after `create_request` does not change the snapshot. A failing fake `PlannerRunner` (exit, timeout, invalid output, cancel) leaves the session `failed`, the snapshot kept, no draft, nothing registered; `RetryPlanning` reuses a complete snapshot without calling `GitReader.tree`; a failed incomplete capture retries only the pinned commit. `ApproveDraft` with any pre-publication participant failure leaves revision/configs invisible and draft open; post-publication recovery preserves the one committed result; with a fake `TemplateIdentity.verdict` returning `existing_identity` it raises `IdenticalRevision` and registers nothing. `RecoverDrafts` over a store written by a previous engine instance lists the open draft and turns a `planning` session into `failed`. `Discard` removes a revision draft by `draft_id` and refuses a running session. `PlannerRecord.planner_selection` returns the selection only for revisions approved from a planned draft. **[R068, R140, R149]** |
| API (`InProcessClient`, no interface) | Full flow for frontend, backend and fullstack with empty and repository baselines against a scripted planner adapter: `create_request` → `planner_options` → `start` (`job.progress` per step, `planning.baseline.captured`, `planning.draft.created`) → `draft` → `edit` → `regenerate` → `approval_preview` → `approve` → `templates.list` shows the revision; launching it through M07/M11 records zero planner calls. `environment.no_harness` blocks `create_request` and `start` while `planning.draft` and `planning.unfinished` still answer. With only undetermined harnesses, `planner_options` returns `no_usable_planner` and no preselection, and `start` with an undetermined harness fails with `planning.harness_unconfirmed`; after a fake `environment.verify` marks Codex usable, `planner_options` preselects it. `start` without a model fails with `planning.model_required`. `SetName` changes the draft name and the approved revision's lineage name but not its SHA-256. Stopping and restarting the `InProcessClient` engine over the same home keeps `planning.unfinished` items. A client disconnect during `start` does not stop the job; a new client finds it through `planning.session`. Every error code in part 2 is reachable; registry metadata gives kinds and safety classes. `import-linter` contract for `engine.planning` layers. **[R030, R031, R136, R137, R149]** |
| Screens (fake client, `App.run_test(size=(120, 40))` and `(80, 24)`) | PlannerScreen renders the invalid previous choice and skipped Grok row from a fixture and `ctrl+s` issues exactly one `planning.start`; `can_start: false` dims `#start`; an empty preselected model shows "Pick a model" with `#start` dimmed; a `no_usable_planner` fixture shows `#planner-order-error` and `#verify-now`, which opens `ConfirmScreen` and only on `True` issues exactly one `environment.verify`. PlanningScreen advances `#planning-steps` from scripted `job.progress`, `esc` issues no call, `Cancel` issues `jobs.cancel`, a failed `job.finished` replaces it with PlanningFailedScreen. Each `#planning-next` choice issues its single call. PlanReviewScreen marks edited rows `-edited`, hides `#draft-summary` when compact, and dims `e`/`r`/`a` from capabilities; typing in `#draft-name` debounces into one `planning.edit(SetName)`; `e` on the Setup/start/stop tab pushes `ServiceEditScreen`, whose `ctrl+s` issues exactly one `planning.edit(SetService)` and marks each field named in `planning.edit_invalid`. TaskEditorScreen debounces typing into one `planning.edit` and reloads on `planning.draft_conflict`. RegenerateScreen re-queries the preview on scope change only. ApproveDraftScreen shows the full SHA-256 and `enter` issues exactly one `planning.approve`; an `existing_identity` preview dims `#approve`, shows the "Identical to" text and `#open-existing`. View-model builders are tested without Textual. **[R149]** |

### 7. Cross-child acceptance and remaining gates

- **F01/F10:** actual M09 authoring, M16 draft conversion and M17 import of an equal definition produce identical canonical payload/manifest bytes and digest. Empty baseline is explicit. Name/task-title/source metadata changes preserve identity; task order, protocol, check or executable flag changes do not. Capture a 100755 launcher beside equal-byte 100644 data; local and imported M05/M08 copies restore 0755/0644 while approved storage stays 0444/0555.
- **R068/R140:** compare source HEAD, raw index, working-tree bytes/types/modes and status before/after success, parse/capture failure, retry and cancel. Staged/modified/untracked entries stay excluded; moved HEAD never changes the pin. Unsupported entries fail explicitly without partial snapshot publication or source repair.
- **F14:** fault each preparation, participant acknowledgement, marker and outbox boundary using real M01/M07/M16 stores and concurrent readers. Before publication observe the old open draft and no new revision/config copy; after publication observe the complete approved tuple. Lost response/recovery cannot duplicate revision/configs or lose planner provenance.
- **F04/F05:** actual client/registry tests reject bare `job`, replay an inter-snapshot progress update, replace old-epoch state, resync after compaction/overflow and recover a terminal job from owner state after cache expiry. Reconnection never invokes a planner; hide/detach never cancels one.
- **F17:** PlanReview/PlanReopened both select T4 and render T4 checks plus T4 snapshot label; switch/resize/reopen and delayed responses preserve the selected task. Prototype source/preview correction is still pending outside this spec edit.
- Parent completion additionally requires explicit-consent parity with M03/M14, real supported harness planning and cleanup, M08/M12 schema/rubric validation, separate M10 planner accounting, M01 revision/duplicate editor flows, M07 saved configuration/judge preselection, planner-free approved reuse and M15 full author→run→verify journeys. Fixture-only child tests do not satisfy these gates.
