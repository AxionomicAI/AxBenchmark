# M16 — Custom template planning and baseline capture

Status: proposed feature contract. [The product specification](../SPEC.md) remains authoritative. This module enables an engineer to implement and verify creation of reusable custom benchmark work without modifying the user's source project.

## Purpose and boundaries

Support frontend, backend, and fullstack benchmarks, each either building a new project or modifying a snapshot of an existing local Git repository. Planning produces work that users can review and approve before competitors receive it. Selecting an already approved built-in, imported, or custom template instead reuses its frozen tasks and skips planning entirely. **[R007, R030, R031]**

The surrounding library retains the existing seven-task inventory benchmark as its default, runnable without generating tasks. Users can create, duplicate, revise, and import other templates, with different saved run configurations for each. [Template library and immutable identity](01-template-library-identity.md) owns those library operations and revisions; [the inventory benchmark](09-default-inventory-benchmark.md) owns the built-in content; [run configuration](07-run-configuration.md) owns saved execution selections. Custom creation must integrate with these behaviors. **[R136]**

## Inputs, outputs, and operations

| Operation | Conceptual inputs | Required outcome |
|---|---|---|
| Choose existing work | An approved template revision | Reuse its frozen tasks without invoking the planner. **[R030, R031]** |
| Describe custom work | A multiline project prompt; frontend, backend, or fullstack type; empty project or existing repository revision | A custom planning request reflecting all three choices. **[R007, R030]** |
| Capture the starting point | Empty-project selection, or a local Git repository and selected committed revision | A baseline retained with the template; repository selection defaults to committed `HEAD`. **[R068]** |
| Select and invoke a planner | Harness, model, and effort selections using the precedence below | Generated specification, ordered tasks, acceptance checks, and setup/start/stop instructions. **[R031]** |
| Review and save | Generated content and user edits or regeneration requests | User approval followed by a saved reusable template containing the approved work. **[R031]** |

These are behavioral operations. Following the [headless engine architecture](ARCHITECTURE.md), they run in the engine and are reached through the `planning.*` API; interfaces present their results and evaluate none of these rules. The API, storage and screens that implement them are recorded under [Implementation](#implementation). Planner execution uses [headless harness execution](05-harness-execution-isolation.md); template identity and freezing use [M01](01-template-library-identity.md).

## Planner selection and review

Expose planner harness/model/effort selection. Preselect a valid previous choice. If no valid previous choice exists, preselect the first detected usable harness in the display order **Claude Code, Codex, Grok, Pi**, together with its discovered model and effort defaults. A detected but unusable harness does not win this fallback. [Environment readiness](03-environment-readiness.md) and [model discovery](04-model-catalog.md) supply availability, validity, and discovered defaults. These preselection rules are conveniences rather than model-quality recommendations. **[R031]**

Generate the project specification, tasks, acceptance checks, and setup/start/stop instructions for the chosen project type and starting point. Default to seven ordered tasks, with final verification and fixes included as the last task. Seven is a default for custom work; it must not be described as a mandatory count for every custom template. **[R007, R031]**

Let the user review, edit, or regenerate the proposed content before approving and saving it. Generation alone is not approval. The saved template supplies the approved inputs for future runs; choosing it later must not regenerate tasks or require a planner call. Revising or duplicating a template follows the library's revision behavior, while changing saved run configurations remains a separate operation. **[R030, R031, R136]**

## Baseline and approval invariants

For an existing repository, snapshot the selected committed revision, defaulting to `HEAD`. Clearly explain that uncommitted changes are excluded. Preserve the source repository untouched, including its uncommitted work; do not make source changes part of the snapshot merely because they are present locally. The retained baseline is the committed content selected during creation. **[R068, R140]**

Later runs and imports use the template's packaged baseline. They must never resolve a moving branch or `HEAD` again to recover starting files. Every configuration receives its own independent copy of that same baseline and identical approved inputs. Source repositories and historical benchmark artifacts remain untouched throughout the workflow. [Execution isolation](05-harness-execution-isolation.md), [portable exchange](17-zip-exchange.md), and [retained results](02-retained-results-comparability.md) consume this contract. **[R068, R140]**

An invalid previous planner choice falls through to the specified usable-harness selection. If readiness prevents local planning, follow the readiness module's failure behavior. A failed baseline capture or generation cannot stand in for the required captured baseline or approved generated content; failure states must be verifiable. Do not substitute the live working tree or silently regenerate approved work to bypass a failure. **[R031, R068, R149]**

## Acceptance criteria

1. Create frontend, backend, and fullstack templates from multiline prompts using both empty projects and committed local repository baselines; complete planning, review, approval, execution, and verification end to end. **[R007, R030, R149]**
2. With a valid previous planner selection, retain that preselection. Without one, vary detected usable harnesses and verify Claude Code → Codex → Grok → Pi precedence and discovered model/effort defaults. **[R031]**
3. Generated output includes the specification, acceptance checks, setup/start/stop instructions, and seven tasks by default, ending in verification/fixes. Review, edit, and regenerate actions are available before approval and saving. **[R031]**
4. Capture a repository with committed and uncommitted changes. Verify exclusion is clearly explained, only the selected committed content becomes the baseline, and the source is unchanged. Move `HEAD` afterward: later runs and imports still use the captured baseline. Competitors receive identical approved inputs and independent copies; historical artifacts remain unchanged. **[R068, R140]**
5. Run approved built-in, imported, and custom templates without planning. Confirm the seven-task inventory default and integration with creation, duplication, revision, import, and separate saved configurations. **[R030, R031, R136]**
6. In the end-to-end workflows, verify TUI navigation/resizing and failure states with [the TUI](15-terminal-interface.md), checks with [verification](08-verification-evidence.md), and score calculations with [scoring](06-scoring-rankings.md). **[R149]**

## Implementation

This section applies [ARCHITECTURE.md](ARCHITECTURE.md). Everything here is an implementation decision; the product contract above and [SPEC.md](../SPEC.md) are unchanged by it. File names, paths, debounce intervals and step identifiers are engineering choices.

### 1. Engine component

Package `axbenchmark.engine.planning`. It owns planning requests, repository inspection and baseline capture, planning sessions (the planner invocation and its attempts), drafts (generated content plus user edits, for new templates and for revisions seeded by [M01](01-template-library-identity.md)), and the record of which planner produced an approved revision. It never registers identity itself: approval hands a frozen draft to M01's `RevisionRegistry`.

**Domain** (`engine/planning/domain/`, frozen slotted dataclasses and pure functions, no I/O):

| Type or rule | Contents |
|---|---|
| `ProjectType` | Enum `frontend`, `backend`, `fullstack`. **[R007]** |
| `BaselineChoice` | `EmptyProject()` or `RepositoryRevision(path: Path, revision: str = "HEAD")`. **[R068]** |
| `RepositoryInspection` | `path`, `is_repository`, `revision` as typed, `commit` (full object id) or `None`, `commit_subject`, `tracked_files`, `uncommitted: UncommittedSummary(staged, modified, untracked)`, `problems: tuple[RepositoryProblem, ...]` (`not_found`, `not_a_repository`, `revision_unresolvable`, `bare_repository`). |
| `PlanningRequest` | `request_id`, `prompt` (multiline, kept verbatim), `project_type`, `baseline: EmptyProject \| PinnedRevision(path, revision, commit)`. A repository revision is resolved to a commit when the request is created and never resolved again. **[R030, R068]** |
| `validate_request(prompt, project_type, baseline, inspection)` | Returns field issues: empty prompt (whitespace only), unknown type, any `RepositoryProblem`. No issue is repaired or defaulted away. |
| `PlannerSelection` | `harness`, `target`, `account_id`, `model_id`, `effort: Explicit(value) \| HarnessDefault()`. |
| `HARNESS_ORDER` | M03's `HarnessId` display order: Claude Code, Codex, Grok CLI, Pi. Not redefined here. **[R031]** |
| `PlannerCandidate` | `rank`, `harness`, `usability` (from M03), `default: PlannerSelection \| None` (discovered model and effort defaults from M04), `reason \| None`. |
| `preselect_planner(previous, previous_check, candidates) -> PlannerPreselection` | Pure. A previous selection whose check passed is preselected. Otherwise candidates are walked in `HARNESS_ORDER`; the first with usability `USABLE` and a discovered default wins; each other candidate is recorded `skipped` (with its reason, e.g. detected but unusable) or `not_reached`. No winner → `None` with `planning.no_usable_planner`. The result records which branch was taken so the screen shows it without computing it. **[R031]** |
| `BaselineSnapshot` | `kind: empty \| repository`, `commit`, `source_path` (display only, never identity), `files: tuple[SnapshotFile(path, sha256, size, mode: regular \| executable)]`, `excluded_uncommitted: int`, `captured_at`, `source_check: SourceCheck(head_before, head_after, status_digest_before, status_digest_after)`. Empty projects have zero files. **[R068, R140]** |
| `CaptureStep` | Ids `read`, `resolve`, `snapshot`, `source_unchanged`, `plan`, `check_draft`, `open_draft`; state `todo \| now \| done \| failed \| not_applicable` (repository steps are `not_applicable` for an empty project). |
| `PlanningSession` | `session_id`, `request`, `selection`, `snapshot \| None`, `steps`, `attempts: tuple[Attempt(n, invocation_id, job_id, outcome, failure)]`, `state: capturing \| planning \| failed \| drafted \| discarded`, `draft_id \| None`. A session in `failed` keeps its snapshot for a retry; it never holds a partial draft. **[R031, R149]** |
| `DEFAULT_TASK_COUNT = 7` | Written into the planner brief together with "the last task is final verification and fixes". It is an instruction default; no rule rejects a draft with another count. **[R007, R031]** |
| `planner_brief(request, snapshot_summary, task_count) -> PlannerBrief` | Pure. The input payload handed to the planner: prompt, project type, baseline description, the output layout below and the task-count default. |
| `parse_planner_output(listing) -> GeneratedPlan` | Validates the planner's output tree: `plan.json` (name, ordered task ids and titles), `spec/00-project.md`, `tasks/<id>.md` for every listed task, `checks/acceptance.v1.json`, `protocol/services.yaml` (setup, start, ready, stop, test), `deps.yaml`. Anything missing raises `PlanOutputInvalid(missing)`; nothing is filled in. **[R031]** |
| `DraftText` | `generated: str \| None`, `current: str`; `edited` is `generated is not None and current != generated`. The generated text is always kept beside an edit. |
| `DraftCheck` | The `acceptance.v1` fields of [M08](08-verification-evidence.md) (check id, task id, title, kind, required, entry, needs, timeout) plus `origin: generated \| user`. |
| `Draft` | `draft_id`, `version: int`, `origin: planned \| revision \| duplicate`, `source_sha256 \| None`, `session_id \| None`, `name`, `project_type`, `specification: DraftText`, `tasks: tuple[DraftTask(task_id, title: DraftText, prompt: DraftText, checks)]`, `services`, `dependencies`, `protocol`, `rubric_ref`, `baseline_ref`, `planner: PlannerSelection \| None`, `state: open \| approved`, `approved_sha256 \| None`. |
| `DraftEdit` | Union: `SetTaskTitle`, `SetTaskPrompt`, `ResetTask`, `AddCheck`, `UpdateCheck`, `RemoveCheck`, `SetSpecification`, `SetService`. `apply_edit(draft, edit) -> Draft` is pure, bumps `version` and refuses any edit on an approved draft (`DraftApproved`). |
| `RegenerationScope` | `Task(task_id)`, `AllTasks` (tasks, checks and services), `Specification`. `regeneration_effect(draft, scope) -> RegenerationEffect(kept_edits, replaced_edits)` and `merge_regeneration(draft, scope, plan) -> Draft`: edits inside the scope are replaced by the new generated text, edits outside it are kept. **[R031]** |
| `draft_issues(draft) -> tuple[DraftIssue, ...]` | Completeness for approval: specification present, at least one task, every task has a title and prompt, checks reference existing tasks, setup/start/stop present. Seven tasks is not checked. **[R031]** |
| `to_frozen(draft, snapshot, rubric) -> FrozenDraft` | Maps the draft to M01's `FrozenDraft` payload roles (`metadata`, `specification`, `task_prompt`, `acceptance_checks`, `execution_protocol`, `services`, `rubric`, `baseline`, `dependencies`). The baseline is the captured snapshot's files; nothing from the live working tree. **[R068]** |
| Domain errors | `RequestInvalid(issues)`, `NoUsablePlanner`, `CaptureFailed(step, cause)`, `PlanOutputInvalid(missing)`, `DraftIncomplete(issues)`, `DraftApproved`, `DraftConflict(current_version)`, `NotPlanned` (regeneration requested for a draft without a planner), `SessionNotFound`, `DraftNotFound`, `RequestNotFound`. |

**Ports** (`engine/planning/ports.py`, `typing.Protocol`):

```python
class GitReader(Protocol):                 # read-only Git access
    async def inspect(self, path: Path, revision: str) -> RepositoryInspection: ...
    def tree(self, path: Path, commit: str) -> AsyncIterator[TreeBlob]: ...   # path, mode, object id, bytes
    async def source_state(self, path: Path) -> SourceState: ...              # HEAD and status digest

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
    async def record_approved(self, sha: Sha256, selection: PlannerSelection) -> None: ...
    async def approved(self, sha: Sha256) -> PlannerSelection | None: ...

class PlannerOutputReader(Protocol):       # reads the planner's output tree after exit
    async def listing(self, attempt_dir: Path) -> PlanListing: ...
```

Ports onto other modules, satisfied in `composition.py` by their application objects or thin adapters: `PlannerRunner` (M05 `HarnessExecution`, `Role.planner`, `PlanningScope(session_id, step)`), `ReadinessFacts` (M03 `ReadinessReport.last()` harness rows and `AssessOperation("plan")`), `PlannerCatalog` (M04 `GetEffortChoices`, `CheckSelection`), `TemplateRegistration` (M01 `TemplateIdentity.compute`, `RevisionRegistry.register`), `RubricSource` (M12, rubric for a project type), `CheckFormat` (M08, `acceptance.v1` validation). Shared: `Clock`, `IdGenerator`, `EventPublisher`, `JobRunner`.

**Application** (`engine/planning/application/`, one class per use case, ports injected in `__init__`):

| Use case | Kind | Behavior |
|---|---|---|
| `GetPlanningDefaults` | query | Runs `preselect_planner` over current readiness and catalog facts and returns the preselection label and `can_create`. Backs the planner hint on M01's NewTemplateScreen. **[R031]** |
| `InspectRepository` | query | `GitReader.inspect`; resolves the typed revision (default `HEAD`) to a commit and counts uncommitted changes. Reads only. **[R068]** |
| `CreatePlanningRequest` | command | `validate_request`; pins the commit; saves the request. Nothing is copied yet. **[R030, R068]** |
| `GetPlannerOptions` | query | Previous choice with its check outcome, candidates in `HARNESS_ORDER`, the preselection, and the harness/model/effort choices for the harness shown (from `PlannerCatalog`). **[R031]** |
| `StartPlanning` | job | Validates the selection (`CheckSelection`, `AssessOperation("plan")`); remembers it as the previous choice; creates the session; runs steps `read` → `resolve` → `snapshot` (streams `GitReader.tree` of the pinned commit into `SnapshotStore`) → `source_unchanged` (compares `source_state` before and after) → `plan` (establishes a disposable copy of the snapshot through `PlannerRunner`, writes `planner_brief`, invokes) → `check_draft` (`parse_planner_output`, `CheckFormat`) → `open_draft` (creates the draft). Reports `job.progress` per step. Any failure leaves the session `failed`, keeps the snapshot and creates no draft. **[R031, R068, R140, R149]** |
| `RetryPlanning` | job | Same as the `plan` onward steps of `StartPlanning` on a `failed` session, with the same or a new selection; reuses the captured snapshot, never recaptures from the live tree. **[R068, R149]** |
| `CancelPlanning` | internal | Bound to `jobs.cancel` for planning jobs: stops the planner invocation through `PlannerRunner`; the session becomes `failed` with `planning.cancelled`. |
| `DiscardSession` | command | Removes an undrafted or unapproved session's snapshot and draft. Never touches the source repository. |
| `GetSession`, `ListSessions` | query | Session steps, attempts, failure and capabilities; open sessions and drafts for reattach. |
| `GetDraft`, `GetDraftTask` | query | The draft as review data, one task with generated text, current text and a line diff computed here. |
| `EditDraft` | command | `apply_edit` with the client's `base_version`; saves; publishes `planning.draft.updated`. |
| `PreviewRegeneration` | query | `regeneration_effect` for a scope, plus the planner that will be used. |
| `RegenerateDraft` | job | Invokes the draft's planner for the scope with optional guidance; `merge_regeneration`; a new draft version for review. Failure leaves the draft unchanged. Refused for approved drafts and drafts without a planner. **[R030, R031]** |
| `PreviewApproval` | query | `draft_issues`, `to_frozen`, `TemplateIdentity.compute` for the SHA-256 the approval will register, and the summary lines. |
| `ApproveDraft` | command | `draft_issues` must be empty; `RevisionRegistry.register(to_frozen(...), origin=custom, parent=None)`; `PlannerPreferences.record_approved`; marks the draft approved. All or nothing. **[R031, R136]** |

Provided to other modules (`application/interfaces.py`, in-engine Protocols, not API methods):

```python
class DraftStore(Protocol):               # M01 revise/duplicate drafts and their approval
    async def seed(self, source: DraftSeed, mode: DraftMode, name: str, scope: Sequence[ScopeHint]) -> DraftId: ...
    async def read(self, draft_id: DraftId) -> FrozenDraft: ...          # raises DraftNotFound, DraftIncomplete
    async def mark_approved(self, draft_id: DraftId, sha: Sha256) -> None: ...

class PlannerRecord(Protocol):            # M07 judge preselection, second branch
    async def planner_selection(self, sha: Sha256) -> PlannerSelection | None: ...
```

**Adapters** (`engine/planning/adapters/`):

| Adapter | Implements | Notes |
|---|---|---|
| `git_cli.py` | `GitReader` | `asyncio.create_subprocess_exec("git", "-C", path, ...)` with an allowlist: `rev-parse`, `cat-file --batch`, `ls-tree -r -z`, `status --porcelain=v2 -z --untracked-files=all`, `log -1`. Environment `GIT_OPTIONAL_LOCKS=0` (status does not refresh the index), `GIT_TERMINAL_PROMPT=0`, no `GIT_DIR`/`GIT_WORK_TREE` from the user's shell. The tree comes from `ls-tree` + `cat-file`, not `git archive`, so export attributes cannot alter the committed content. No checkout, stash, fetch or reset is ever issued. **[R068, R140]** |
| `fs_snapshot.py` | `SnapshotStore` | Writes blobs into `sessions/<id>/baseline/` (files 0444), hashing while writing; `baseline.json` records the `BaselineSnapshot`. |
| `json_repositories.py` | `RequestRepository`, `SessionRepository`, `DraftRepository` | JSON files written by temp file + `os.replace`; the draft version check runs under a per-draft `asyncio.Lock`. |
| `yaml_preferences.py` | `PlannerPreferences` | `last-planner.yaml`, `approved-planners.yaml` (ruamel.yaml). No credential values. |
| `planner_output.py` | `PlannerOutputReader` | Lists and reads the output tree written by the planner inside its disposable workspace; rejects symlinks and paths outside it. |
| `harness_planner.py` | `PlannerRunner` | Over M05 `HarnessExecution`: `Role.planner`, `PlanningScope(session_id, step)`, workspace = copy of the snapshot, record directory = `attempts/<n>/`. |
| `rpc.py` | — | Maps `axbenchmark.api.planning` DTOs to use cases and domain results and errors to the codes in part 2; registers the snapshot provider for the `planning` topic with M11's subscription service. The only file in the package importing `axbenchmark.api`. |

**Persisted state** (the engine is the only reader and writer):

```
~/.axbenchmark/planning/
  last-planner.yaml                  previous planner choice
  approved-planners.yaml             template sha256 -> planner selection (read by M07)
  requests/<request_id>.json         prompt, type, baseline choice with pinned commit
  sessions/<session_id>/
    session.json                     state, steps, attempts, failure
    baseline/ + baseline.json        captured committed tree, file digests, excluded count
    attempts/<n>/                    record directory handed to M05 (invocation.json, log.jsonl),
                                     input/ (brief), output/ (planner output as read)
  drafts/<draft_id>/
    draft.json                       Draft with version, edit marks and generated text
    files/                           current payload files (spec, tasks, checks, services, deps)
```

Approved content moves into M01's object store on registration; the draft stays as an approved, read-only record. Source repositories are only read. **[R068, R140]**

**Processes owned**: short-lived read-only `git` subprocesses. The planner harness process is started and owned by M05 as a child of `axbenchmarkd`, so planning continues when every client disconnects; only `jobs.cancel` stops it.

### 2. API surface (`planning.*`)

DTOs live in `axbenchmark.api.planning`. `ActionState = {enabled: bool, reason: str | None}` where `reason` is an error code. Error notices carry the engine's `message` and `remedy`.

**Capability flags**

| Flag | Returned by | False when (reason) |
|---|---|---|
| `can_create` | `planning.defaults` | no supported harness (`environment.no_harness`) |
| `can_continue` | `planning.inspect_repository` | any repository problem (`planning.repository_not_found`, `planning.not_a_repository`, `planning.revision_unresolvable`) |
| `can_start` | `planning.planner_options` | `planning.no_usable_planner`, `environment.no_harness`, `catalog.*` and `environment.*` reasons of the shown selection, passed through |
| `can_cancel`, `can_retry`, `can_choose_planner`, `can_discard` | `planning.session` | `planning.not_running`, `planning.not_failed`, `planning.session_drafted` |
| `can_edit` | `planning.draft` | `planning.draft_approved` |
| `can_regenerate` | `planning.draft`, `planning.regenerate_preview` | `planning.draft_approved`, `planning.not_planned`, `planning.regeneration_running`, `environment.no_harness` |
| `can_approve` | `planning.draft`, `planning.approval_preview` | `planning.draft_incomplete`, `planning.draft_approved`, `planning.regeneration_running` |

**Queries** (safety class `read`):

| Method | Request | Response | Errors |
|---|---|---|---|
| `planning.defaults` | — | `PlanningDefaults{preselection: PlannerLabelDTO \| None, branch: previous \| first_usable \| none, reason \| None, can_create}` | — |
| `planning.inspect_repository` | `path`, `revision = "HEAD"` | `RepositoryInspectionDTO{path, revision, commit \| None, commit_short, commit_subject, tracked_files, uncommitted{staged, modified, untracked, total}, exclusion_notice, problems: [ErrorInfo], can_continue}` | — (problems are data) |
| `planning.request` | `request_id` | `PlanningRequestDTO{request_id, prompt, project_type, baseline{kind, path?, revision?, commit?}}` | `planning.unknown_request` |
| `planning.planner_options` | `request_id`, `harness?`, `target?`, `account_id?` | `PlannerOptions{previous: {selection, outcome: used \| invalid \| none, reason?}, candidates: [{rank, harness, label, readiness: CellDTO, default_label, outcome: preselected \| skipped \| not_reached \| available, reason?}], preselection: PlannerSelectionDTO \| None, fields{harnesses: [Option], models: [Option{model_id, label, can_select, reason?}], efforts: [Option{value \| "harness_default", is_default}]}, can_start}` | `planning.unknown_request` |
| `planning.session` | `session_id` | `PlanningSessionDTO{session_id, title, state, steps: [StepDTO{id, state, text, detail?, started_at?, ended_at?}], progress: float \| None, selection_label, job: JobRef \| None, attempts: [{n, invocation_id, outcome, failure: ErrorInfo \| None}], failure: ErrorInfo \| None, draft_id \| None, capabilities}` | `planning.unknown_session` |
| `planning.sessions` | `open_only = True` | `[PlanningSessionSummary{session_id, title, state, draft_id?, updated_at}]` | — |
| `planning.draft` | `draft_id` | `DraftDTO{draft_id, version, state, origin, name, bar_text, project_type, rubric_label, baseline{kind, source_path?, commit?, files, excluded_uncommitted}, planner_label?, specification{markdown, edited}, tasks: [DraftTaskRow{task_id, title, check_count, state: generated \| edited \| added}], checks: [DraftCheckDTO], services: [ServiceRowDTO{step, command, when}], dependencies: [KvDTO], protocol: [KvDTO], summary: [KvDTO], invocation_ids: [str], issues: [ErrorInfo], capabilities}` | `planning.unknown_draft` |
| `planning.draft_task` | `draft_id`, `task_id` | `DraftTaskDTO{task_id, title{current, generated?, edited}, prompt{current, generated?, edited}, diff: [DiffLine{kind: same \| added \| removed, text}], checks: [DraftCheckDTO{check_id, title, kind, required, origin, issue?}], version, capabilities}` | `planning.unknown_draft`, `planning.unknown_task` |
| `planning.regenerate_preview` | `draft_id`, `scope: task \| all \| specification`, `task_id?` | `RegeneratePreview{planner_label, kept_edits: [str], replaced_edits: [str], result_text, can_regenerate}` | `planning.unknown_draft`, `planning.unknown_task` |
| `planning.approval_preview` | `draft_id` | `DraftApprovalPreview{name, label, lines: [KvDTO], computed_sha256, notes: [str], issues: [ErrorInfo], check_flags: [ErrorInfo], verdict: new_identity \| existing_identity, existing_sha256?, can_approve}` | `planning.unknown_draft` |

**Commands**:

| Method | Request | Response | Errors | Safety |
|---|---|---|---|---|
| `planning.create_request` | `prompt`, `project_type`, `baseline: {kind: empty} \| {kind: repository, path, revision = "HEAD"}` | `PlanningRequestRef{request_id, commit?}` | `planning.prompt_empty{field: prompt}`, `planning.invalid_project_type{field}`, `planning.repository_not_found{field: path}`, `planning.not_a_repository{field: path}`, `planning.revision_unresolvable{field: revision}`, `environment.no_harness` | `write` |
| `planning.edit` | `draft_id`, `base_version`, `edit: DraftEditDTO` (one of the `DraftEdit` variants with its fields) | `DraftTaskDTO` or `DraftDTO` for spec/service edits, with the new `version` | `planning.unknown_draft`, `planning.draft_approved`, `planning.draft_conflict{current_version}`, `planning.edit_invalid{field}` | `write` |
| `planning.approve` | `draft_id` | `DraftApproved{sha256, template_id, label}` | `planning.unknown_draft`, `planning.draft_incomplete{issues}`, `planning.draft_approved`, `templates.*` from registration (nothing registered) | `write` |
| `planning.discard` | `session_id` | `{discarded: true}` | `planning.unknown_session`, `planning.session_running`, `planning.draft_approved` | `destructive` (deletes the snapshot and the unapproved draft) |

**Jobs** (return `JobRef`; progress through `job.progress` / `job.finished`; `jobs.get` and `jobs.cancel` address them):

| Method | Request | Progress payload | Result | Errors | Safety |
|---|---|---|---|---|---|
| `planning.start` | `request_id`, `selection: PlannerSelectionDTO` | `{session_id, step, state, text, progress?}` | `PlanningDraftRef{session_id, draft_id}` | `planning.unknown_request`, `planning.no_usable_planner`, `catalog.*` and `environment.*` selection errors, `planning.capture_failed{step, cause}`, `planning.planner_failed{outcome, exit_code, message}`, `planning.output_invalid{missing}`, `planning.cancelled` | `write` |
| `planning.retry` | `session_id`, `selection?` (same planner when omitted) | as above | `PlanningDraftRef` | as above plus `planning.unknown_session`, `planning.not_failed` | `write` |
| `planning.regenerate` | `draft_id`, `scope`, `task_id?`, `guidance = ""`, `base_version` | `{draft_id, step, state, text}` | `DraftDTO` (new version) | `planning.unknown_draft`, `planning.draft_approved`, `planning.not_planned`, `planning.regeneration_running`, `planning.draft_conflict`, `planning.planner_failed`, `planning.output_invalid` | `write` |

Planner outcomes (`model_rejected`, `auth_failed`, `timed_out`, …) are M05's `ExitClassification` data, surfaced as `planning.planner_failed` with the M05 code in `cause`. The job's `JobRef.id` is recorded on the session attempt, so a reattaching client finds it through `planning.session`.

**Events**:

| Event | Payload | Emitted when |
|---|---|---|
| `planning.session.started` | `session_id`, `request_id`, `selection_label`, `job_id` | `planning.start` or `planning.retry` accepted. |
| `planning.baseline.captured` | `session_id`, `kind`, `commit?`, `files`, `excluded_uncommitted`, `source_check` | The `snapshot` and `source_unchanged` steps finished. |
| `planning.session.failed` | `session_id`, `step`, `failure: ErrorInfo` | Any step failed or the job was cancelled. |
| `planning.draft.created` | `session_id`, `draft_id` | `open_draft` finished. |
| `planning.draft.updated` | `draft_id`, `version`, `change: edit \| regenerated` | An edit or regeneration was saved. |
| `planning.draft.approved` | `draft_id`, `sha256`, `template_id`, `label` | `planning.approve` (or M01's revision approval through `DraftStore.mark_approved`). |
| `planning.session.discarded` | `session_id` | `planning.discard`. |

### 3. Requires from other modules

| Name | Owner | Purpose |
|---|---|---|
| `TemplateIdentity.compute`, `RevisionRegistry.register(draft, origin, parent)` (application Protocols), `FrozenDraft`, `DraftSeed` types | M01 | Computed SHA-256 for the approval preview; registration on approval. |
| Calls to `DraftStore.seed` / `read` / `mark_approved` from `StartRevision` and `ApproveRevision` | M01 | Revision and duplicate drafts edited in `TaskEditorScreen`. |
| `ReadinessReport.last()` harness rows with `usability` in display order, `AssessOperation("plan", prerequisites)` (application Protocols); event `environment.report.updated` | M03 | Planner candidates, `can_create`, `can_start`; refresh when readiness changes. **[R031, R137]** |
| `GetEffortChoices`, `CheckSelection` (application Protocols), including a discovered default model per context | M04 | Discovered model and effort defaults; validity of a previous choice. **[R031]** |
| `HarnessExecution.establish` / `.invoke` / `.release` with `Role.planner`, `PlanningScope`, a baseline given as an unregistered snapshot directory, and `.stop_invocation` on job cancel | M05 | Headless planner on a disposable copy of the snapshot. **[R012, R068]** |
| `harness.invocation.get`, `harness.invocation.log(invocation_id, after_seq?)`, events `harness.task.started` / `harness.task.exited` for `PlanningScope` | M05 | Requested vs effective planner settings; "Open log" on a failed attempt. |
| `CheckFormat.validate(document) -> Sequence[ErrorInfo]` for `acceptance.v1` | M08 | Planner and edited checks use the format M08 runs. |
| `RubricSource.for_project_type(project_type) -> RubricRef` | M12 | The rubric file packaged with a planned template. **[R085]** |
| `measurements.invocation(invocation_id)`, event `measurements.invocation.recorded` | M10 | Planner cost in the draft summary, labelled outside the benchmark. |
| `JobRunner` port, `jobs.get`, `jobs.cancel`, `events.subscribe`, `job.progress`, `job.finished` | M11 | Planning and regeneration jobs, cancel, reattach. |

Consumers of this namespace: M01 NewTemplateScreen (`planning.defaults`, `planning.inspect_repository`, `planning.create_request`), M07 (`PlannerRecord`), M05/M17/M02 (the packaged baseline, through M01's registered revision).

### 4. Screens

All M16 screens live in `axbenchmark/tui/screens/planning.py`; view models in `axbenchmark/tui/viewmodels/planning.py`. Shared rules from M01 apply: loads run in `exclusive=True` workers through the injected `EngineClient`; data widgets sit in `ContentSwitcher`s with `#x`, `#x-loading`, `#x-empty`, `#x-error`; `check_action` returns `None` (dimmed, never hidden; Textual hides a binding on `False`) from the `ActionState` in the view model; error text is the engine's `message` and `remedy` verbatim. No screen selects a planner, decides which edits regeneration keeps, checks draft completeness or computes a digest; those come back from the engine.

```python
@dataclass(frozen=True)
class PlannerVM:
    previous_line: str; previous_failed: bool            # #previous-choice
    order_rows: tuple[CandidateRowVM, ...]                # #planner-order, outcome -> TCSS class
    harness_options: tuple[OptionVM, ...]; model_options: tuple[OptionVM, ...]; effort_options: tuple[OptionVM, ...]
    selected: PlannerSelectionDTO | None
    start: ActionState

@dataclass(frozen=True)
class DraftVM:
    bar_text: str; tab_labels: tuple[str, str, str, str]
    task_rows: tuple[TaskRowVM, ...]                      # "~ edited" -> class -edited
    summary: tuple[tuple[str, str], ...]                  # #draft-summary
    services: tuple[ServiceRowVM, ...]; deps: tuple[tuple[str, str], ...]; protocol: tuple[tuple[str, str], ...]
    version: int
    actions: Mapping[str, ActionState]                    # edit, regenerate, approve

def planner_vm(opts: PlannerOptions) -> PlannerVM: ...
def session_vm(s: PlanningSessionDTO) -> SessionVM: ...      # steps glyphs, progress, failure notice
def draft_vm(d: DraftDTO, cost: InvocationAccountDTO | None) -> DraftVM: ...
def task_editor_vm(t: DraftTaskDTO) -> TaskEditorVM: ...
def regenerate_vm(p: RegeneratePreview) -> RegenerateVM: ...
def approve_vm(p: DraftApprovalPreview) -> ApproveVM: ...
```

**PlannerScreen** — `ModalScreen[JobRef | None]`, artboard PlannerPicker. Constructed with `request_id`, or with `session_id` when opened from PlanningFailedScreen ("Choose another planner").

| Aspect | Contract |
|---|---|
| Load | `planning.planner_options(request_id)` → `#previous-choice` (✗ and reason when `outcome == invalid`), `#planner-order` (rank, harness, readiness cell, default, outcome; skipped rows muted), `#planner-fields` (harness `Select`, `Select #planner-model`, effort `RadioSet`) preset to `preselection`. Switcher on `#planner-order`: loading, rows, error. |
| Field change | Harness change → `planning.planner_options(request_id, harness, target, account_id)` to reload model and effort options; model and effort changes issue no call. |
| Subscriptions | `environment.report.updated` → reload options. |
| `ctrl+s`, `#start` | `planning.start(request_id, selection)` (or `planning.retry(session_id, selection)`); dimmed by `can_start`; selection errors render under `#planner-fields`; success dismisses with the `JobRef` and the app pushes `PlanningScreen(session_id)`. |
| `esc`, `Back` | `dismiss(None)`; the app reopens M01's NewTemplateScreen filled from `planning.request(request_id)`. |

**PlanningScreen** — `ModalScreen[PlanningDraftRef | None]`, artboard PlanningProgress. Constructed with `session_id`.

| Aspect | Contract |
|---|---|
| Load | `planning.session(session_id)` → `#planning-steps` (one line per `StepDTO`, glyph from `state`), `ProgressBar` (`total=None` when `progress` is `None`), elapsed from the `plan` step's `started_at`. |
| Subscriptions | `events.subscribe(["planning", "job"], since_seq)` filtered to this session and its job: `job.progress` updates a step; `planning.baseline.captured` fills the snapshot and source lines; `job.finished` success → dismiss with the draft ref and the app pushes `PlanReviewScreen(draft_id)`; failure → the app replaces it with `PlanningFailedScreen(session_id)`. |
| `esc`, `Hide` | `dismiss(None)`; no call, planning continues in the engine. |
| `Cancel` | `jobs.cancel(job.id)`; dimmed by `can_cancel`. The failure then arrives as `job.finished` with `planning.cancelled`. |

**PlanningFailedScreen** — `ModalScreen[str | None]`, artboard PlanningFailed. Constructed with `session_id`.

| Aspect | Contract |
|---|---|
| Load | `planning.session(session_id)` → `.notice.-error` (`failure.message`, verbatim), `#planning-steps`, `#planning-next` options enabled from `can_retry`, `can_choose_planner`, `can_discard`. |
| `#continue` with "Retry with the same planner" | `planning.retry(session_id)`; push `PlanningScreen(session_id)`. |
| `#continue` with "Choose another planner" | none; push `PlannerScreen(session_id=…)`. |
| `#continue` with "Discard the snapshot and close" | `planning.discard(session_id)`; dismiss. |
| `Open log` | `harness.invocation.log(attempts[-1].invocation_id)` into a read-only `Log` view. |
| `esc` | `dismiss(None)`; the session and its snapshot are kept. |

**PlanReviewScreen** — `Screen`, artboards PlanReview and PlanServices. Constructed with `draft_id`.

| Aspect | Contract |
|---|---|
| Load | `planning.draft(draft_id)` → `#draft-bar` (`bar_text`), `#draft-tabs` labels, Specification pane, `#draft-tasks`, `#draft-summary`, Acceptance checks table, `#services`, `#deps`, `#protocol`. `DataTable.RowHighlighted` on `#draft-tasks` → `planning.draft_task(draft_id, task_id)` → `#task-detail`. Planner cost: `measurements.invocation(id)` for each id in `invocation_ids`, shown in the summary as returned. Switcher on `#draft-tasks`: loading, rows, error; empty only when the engine returns no tasks (the draft then carries an issue). |
| Compact | The app shell sets `Screen.-compact`; TCSS hides `#draft-summary`. No call. |
| Subscriptions | `planning.draft.updated`, `planning.draft.approved` for this draft → reload; `job.progress` / `job.finished` of a regeneration job started from here → `#draft-bar` shows the step text, then reload; `measurements.invocation.recorded` for its invocation ids → refresh cost. |

| Binding | Action | API call |
|---|---|---|
| `e`, `Edit task` | `edit` | none; push `TaskEditorScreen(draft_id, task_id)` for the highlighted row. Dimmed by `can_edit`. |
| `r`, `Regenerate…` | `regenerate` | none; push `RegenerateScreen(draft_id, scope=task, task_id)`. Dimmed by `can_regenerate`. |
| `a`, `Approve and save` | `approve` | none; push `ApproveDraftScreen(draft_id)`. Dimmed by `can_approve`. |
| `1`–`4` | `show_tab` | none. |
| `esc` | `close` | none; pop. The draft stays open in the engine (`planning.sessions` lists it). |

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

All editing bindings are dimmed by `can_edit`.

**RegenerateScreen** — `ModalScreen[JobRef | None]`, artboard PlanRegenerate. Constructed with `draft_id`, initial scope and `task_id`.

| Aspect | Contract |
|---|---|
| Load | `planning.regenerate_preview(draft_id, scope, task_id)` → `.kv` (planner, kept and replaced edits, result). |
| `#regen-scope` change | Same query with the new scope. `#regen-guidance` changes issue no call. |
| `#regenerate` | `planning.regenerate(draft_id, scope, task_id, guidance, base_version)`; dimmed by `can_regenerate`; dismiss with the `JobRef`, which the calling screen follows. |
| `esc`, `Cancel` | `dismiss(None)`. |

**ApproveDraftScreen** — `ModalScreen[bool]`, artboard PlanApprove. Constructed with `draft_id`.

| Aspect | Contract |
|---|---|
| Load | `planning.approval_preview(draft_id)` → `.kv` from `lines`, `#draft-sha` (`computed_sha256` in full), the notes; `issues` and `check_flags` listed above the buttons; `#approve` enabled from `can_approve`. |
| `enter`, `#approve` | `planning.approve(draft_id)`; success dismisses `True` and the app replaces `PlanReviewScreen` with M01's `TemplateScreen(sha256)` on its Tasks tab and the RevisionSaved notification; errors render in the dialog. |
| `esc`, `Back to draft` | `dismiss(False)`; no call. |

M01's **NewTemplateScreen** is the entry point and issues `planning.defaults`, `planning.inspect_repository` and `planning.create_request` (see M01 part 4); on success the app pushes `PlannerScreen(request_id)`.

### 5. CLI

Planning has no product command in [M14](14-command-line-interface.md); these commands exist because every API method must be reachable from the CLI and are generated from the registry. `--json` prints the response or the job's event stream.

| Command | API |
|---|---|
| `axbenchmark planning defaults` | `planning.defaults` |
| `axbenchmark planning inspect-repo PATH [--revision REV]` | `planning.inspect_repository` |
| `axbenchmark planning new --prompt-file FILE --type frontend\|backend\|fullstack (--empty \| --repo PATH [--revision REV])` | `planning.create_request`; prints the request id and pinned commit |
| `axbenchmark planning planners REQUEST_ID [--harness H]` | `planning.planner_options` |
| `axbenchmark planning start REQUEST_ID [--harness H --model M --effort E\|default]` | `planning.start` job with the given or preselected selection; streams steps; Ctrl-C detaches and prints the `status` and `cancel` commands |
| `axbenchmark planning status SESSION_ID` / `planning list` | `planning.session` / `planning.sessions` |
| `axbenchmark planning cancel SESSION_ID` | `jobs.cancel` for the session's job |
| `axbenchmark planning retry SESSION_ID [--harness … --model … --effort …]` | `planning.retry` job |
| `axbenchmark planning discard SESSION_ID --yes` | `planning.discard` (destructive; refuses without `--yes`) |
| `axbenchmark planning show DRAFT_ID [--task ID]` | `planning.draft` / `planning.draft_task` |
| `axbenchmark planning edit DRAFT_ID --task ID (--title T \| --prompt-file F)` | `planning.edit` with the draft's current version |
| `axbenchmark planning regenerate DRAFT_ID --scope task\|all\|specification [--task ID] [--guidance TEXT]` | `planning.regenerate` job |
| `axbenchmark planning preview DRAFT_ID` / `planning approve DRAFT_ID` | `planning.approval_preview` / `planning.approve`; prints the full SHA-256 |

Exit codes follow ARCHITECTURE.md: a failed planning job or a refused approval exits 1 with the typed error.

### 6. Headless verification

| Level | Tests |
|---|---|
| Domain | `preselect_planner`: valid previous choice kept; invalid previous choice falls through; every permutation of usable/unusable/undetected harnesses yields the first usable in Claude Code → Codex → Grok → Pi with its discovered defaults, detected-but-unusable recorded as skipped; nothing usable → `no_usable_planner`. `validate_request` rejects a whitespace prompt and each repository problem without defaulting. `parse_planner_output` rejects each missing part. `merge_regeneration` keeps edits outside the scope and replaces those inside. `draft_issues` accepts a five-task and a seven-task draft alike. `apply_edit` refuses on an approved draft and bumps the version. `to_frozen` contains only snapshot files. **[R007, R031, R068]** |
| Use cases (fake ports) | Fixture Git repository with committed files, a staged change, a modified file and an untracked file: `StartPlanning` snapshots exactly the committed tree of the pinned commit, reports `excluded_uncommitted = 3`, and the repository's HEAD, index bytes, working tree and status are byte-identical afterwards. Moving HEAD after `create_request` does not change the snapshot. A failing fake `PlannerRunner` (exit, timeout, invalid output, cancel) leaves the session `failed`, the snapshot kept, no draft, nothing registered; `RetryPlanning` reuses the snapshot without calling `GitReader.tree`. `ApproveDraft` with a failing `RevisionRegistry` leaves the draft open. `PlannerRecord.planner_selection` returns the selection only for revisions approved from a planned draft. **[R068, R140, R149]** |
| API (`InProcessClient`, no interface) | Full flow for frontend, backend and fullstack with empty and repository baselines against a scripted planner adapter: `create_request` → `planner_options` → `start` (`job.progress` per step, `planning.baseline.captured`, `planning.draft.created`) → `draft` → `edit` → `regenerate` → `approval_preview` → `approve` → `templates.list` shows the revision; launching it through M07/M11 records zero planner calls. `environment.no_harness` blocks `create_request` and `start` while `planning.draft` and `planning.sessions` still answer. A client disconnect during `start` does not stop the job; a new client finds it through `planning.session`. Every error code in part 2 is reachable; registry metadata gives kinds and safety classes. `import-linter` contract for `engine.planning` layers. **[R030, R031, R136, R137, R149]** |
| Screens (fake client, `App.run_test(size=(120, 40))` and `(80, 24)`) | PlannerScreen renders the invalid previous choice and skipped Grok row from a fixture and `ctrl+s` issues exactly one `planning.start`; `can_start: false` dims `#start`. PlanningScreen advances `#planning-steps` from scripted `job.progress`, `esc` issues no call, `Cancel` issues `jobs.cancel`, a failed `job.finished` replaces it with PlanningFailedScreen. Each `#planning-next` choice issues its single call. PlanReviewScreen marks edited rows `-edited`, hides `#draft-summary` when compact, and dims `e`/`r`/`a` from capabilities. TaskEditorScreen debounces typing into one `planning.edit` and reloads on `planning.draft_conflict`. RegenerateScreen re-queries the preview on scope change only. ApproveDraftScreen shows the full SHA-256 and `enter` issues exactly one `planning.approve`. View-model builders are tested without Textual. **[R149]** |
