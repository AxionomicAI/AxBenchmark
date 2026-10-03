# M16.1 — repository-capture

Parent: [M16](../reference/modules/16-custom-template-planning.md#1-engine-component). Requirements: R007, R030, R068, R140, R149. Findings: F01, F10; shared F15. Binding extension: [BENCHMARK-MODES.md](../BENCHMARK-MODES.md).

Outcome: inspect the exact selected current folder and freeze admitted working-file bytes into a portable immutable baseline without changing the source. This is a proposed implementation contract; pinned committed capture remains a separate legacy v1 route.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M01.1](../M01/01-canonical-definition.md), [M11.1](../M11/01-engine-client-api.md) and [M11.2](../M11/02-events-jobs-lifecycle.md).

**Bootstrap-published contracts, allowed as injected fixtures:** M05 typed unregistered baseline/WorkspaceProvisioner and M08 semantic restoration. Their real adapters are later integration gates. Manual inspection/capture requires no installed harness, model, planner, M03 readiness or M04 catalog call. M16.2 is not a prerequisite. Git is optional for current folders and required only for explicit legacy committed capture.

## Exact proposed ownership

Source paths are relative to `solution/axbenchmark/`; test paths are relative to `solution/`.

- `engine/planning/domain/repository.py`, `requests.py`, `baseline.py`, and inspection/capture/request errors in `errors.py`.
- `engine/planning/application/inspect_repository.py` (current-folder and legacy use cases), `create_request.py`, `capture_baseline.py`.
- `engine/planning/adapters/fs_snapshot.py`, legacy-only `git_cli.py`, and inspection/request sections of `json_requests.py`.
- Capture/inspection/request declarations in `engine/planning/ports.py`; their DTOs and registration in `api/planning.py` and `engine/planning/adapters/rpc.py`.
- `tests/engine/planning/test_requests.py`, `test_folder_capture.py`, `test_git_capture.py`, `test_source_preservation.py`, `test_snapshot_modes.py`, `test_capture_faults.py`; `tests/api/test_planning_capture.py`.
- `tests/fixtures/planning/folders/` and `git/` create disposable fixtures, never user repositories.

M16.2 owns optional planner sessions; M16.3 owns manual-operation jobs, recapture orchestration, drafts and canonical conversion. M01 owns identity, M05/M08 workspace restoration and M17 archives. Extend shared files only in named sections; introduce no parallel descriptor, capture service or restore format.

## Interfaces and current-folder inspection

Implement the parent's `ReadOnlyFolderReader.inspect/inventory/read_files`, `BaselineCapture.capture(inspection_id, owner, base_version)`, `InspectionRepository`, `SnapshotStore.stage/publish/open/discard` and generation-only `RequestRepository` ports. Capture is an internal stage of manual-creation, recapture or planning jobs; there is no independent public `baseline.capture` API.

`planning.inspect_target(target_dir, exclusion_policy_ref?) -> TargetInspectionDTO` returns `target_inspection_id`, exact `target_dir`, `source_kind: folder`, `change_fingerprint`, `source_inventory_ref`, `admin_policy_ref`, `exclusion_policy_ref`, derived `target_mode` (nullable on unreliable inspection), meaningful/eligible/admitted counts, admitted bytes, path/reason/policy exclusions, typed `problems` and `can_continue`. Persist the reviewed inventory/policy binding; clients never infer emptiness or inspect Git themselves.

The selected directory may be non-Git, a worktree or a repository subdirectory. Never broaden it to a Git root. Inspect actual entries with read-only filesystem ports, without shell/Git subprocesses or hooks. Capture admitted current working bytes, including eligible modified, staged and untracked files and binary content. The working file wins when index and file differ; a staged deletion with an extant file includes that file, while a missing current file is absent. Git ignore rules do not define admission.

Determine meaningful emptiness **before** exclusions. The versioned administrative policy ignores `.git`, `.hg`, `.svn` (including metadata pointer files), `.DS_Store` and `Thumbs.db` without following them. Empty directories alone add no project content. Every other file or unsupported entry establishes nonempty content even if unreadable or later excluded. Failed inventory is an error, never an empty-folder inference.

Meaningfully empty yields `from_scratch` and v2 `kind=empty, files=()`; nonempty yields `modify` and v2 `kind=folder` with admitted files. Enumerate administrative, credential, dependency/cache and other portable exclusions with their actual paths/reasons and policy refs. Nonempty content with no admitted regular files fails `baseline.no_admitted_files`; it never becomes scratch. Required inputs cannot be silently excluded.

Reuse M01 RelPath validation for traversal, normalization/case-fold and file/directory collisions. Links/special entries require a path-specific failure or explicit reviewed exclusion; never follow an external target or treat unsupported content as an empty directory. No blanket exclusion of untracked files is permitted.

## Capture barrier and lifecycle

Use engine-owned staging disjoint from the selected tree, with file-descriptor/lstat-based reads that reject entry replacement or symlink traversal. Inventory relative paths, entry types, content digests and semantic executable flags deterministically. Compare reviewed/pre-copy inventory, streamed copied bytes/flags and post-copy inventory; publish only after agreement. This is consistency evidence, not an atomic filesystem snapshot claim.

Content, roster, type or mode drift causes bounded retry or `baseline.source_changed{changed_facts}`. A retry cannot silently accept a new reviewed inventory or policy; changed facts require explicit reinspection/recapture. Tokens bind inventory, policies, operation ownership and draft version where present. Stale or mismatched tokens fail `planning.inspection_stale`; concurrent edits/recaptures cannot approve an old preview.

`SnapshotStore.stage` yields an inaccessible pending snapshot; `publish(pending, SourceCheck)` alone makes a complete `BaselineSnapshot` available. Cancellation, failed reads/writes and failed proofs never set `baselineReady`. Emit `planning.baseline.captured` only after publication. Cleanup is confined to engine-owned staging and cannot traverse into the source.

Record `executable=true` when any POSIX source execution bit is set, before storing bytes read-only. Stored files are 0444; baseline metadata retains semantic flags. M16.3 passes admitted relative paths/bytes/flags into M01's versioned definition. Source absolute paths, timestamps, Git labels/status, exclusions and capture provenance remain outside canonical identity; physical storage modes are not executable intent.

A completed immutable snapshot may be reused after a later job failure. An incomplete retry must still match the reviewed inventory. M16.3 recapture accepts only an open draft and `base_version`; a failed/conflicting/cancelled recapture preserves the previous complete baseline and leaves refresh issues visible. An unchanged completed capture does not require rereading a disappearing source at approval. A later inspection detecting changed facts marks the binding stale; active recapture or unresolved source change blocks approval.

Approval binds one completed snapshot. Runs, retries, reuse and ZIP imports consume its packaged bytes, never refresh from the origin path. Explicit refresh of approved work first opens a new revision. M05/M08 materialize separate writable copies of the same bytes/flags for every configuration/trial; no competitor runs in the source. Capture and execution never initialize Git merely for diff evidence.

## Source preservation and legacy compatibility

Never write/chmod the source, initialize/commit/checkout/stash/clean/reset it, execute its hooks or copy results back. Preserve current bytes/types/modes and the untracked roster; where Git exists, preservation tests additionally assert HEAD/raw index/status unchanged without making Git a dependency of current-folder capture. Never repair or revert an external user edit to make a check pass.

Explicit legacy `planning.inspect_repository` and `RepositoryRevision` requests retain the parent's `GitReader.inspect/tree/source_state` semantics. Resolve the selected revision once to a full commit object id; later capture/retry uses that pin, never a freshly resolved HEAD. Missing Git or unavailable objects return typed legacy errors.

Legacy capture streams `ls-tree`/`cat-file` committed blobs, not `git archive` or working files; accepts only 100644/100755 regular files and rejects links/gitlinks/special modes. Count and exclude uncommitted staged/modified/untracked content only on this legacy route. Preserve its allowed zero-file `kind=repository` shape, v1 bytes and identity.

Use only the parent's read-only Git allowlist with `GIT_OPTIONAL_LOCKS=0`, `GIT_TERMINAL_PROMPT=0` and cleared inherited `GIT_DIR`/`GIT_WORK_TREE`. Compare legacy SourceState before/after (HEAD, raw index digest, working content/types/modes and status digest); source changes remain explicit failures, never a restoration instruction.

## Board/data boundary and failures

No screens are owned here. M01 creation and M16 capture/review views display engine-provided mode, counts, exclusions, policy, source checks, `can_continue` and typed problems. Manual progress says import/capture/validate, never LLM planning. M16.3 invokes this service from `planning.create_manual(...)` or versioned `planning.recapture(...)`; optional generation alone uses `create_request`/`start`.

Preserve parent error shapes: `baseline.target_not_found`, `baseline.not_directory`, `baseline.unreadable{path}`, `baseline.unsupported_entry{path}`, `baseline.path_collision{paths}`, `baseline.no_admitted_files`, `baseline.source_changed{changed_facts}`, `planning.inspection_stale` and `planning.capture_failed{step,cause}`. Errors preserve the source and previous complete data; no failed path silently falls back to an empty baseline.

## Acceptance and faults

The following are planned verification commands and gates, not evidence of an existing implementation:

```sh
pytest tests/engine/planning/test_requests.py tests/engine/planning/test_folder_capture.py tests/engine/planning/test_git_capture.py tests/engine/planning/test_source_preservation.py tests/engine/planning/test_snapshot_modes.py tests/engine/planning/test_capture_faults.py tests/api/test_planning_capture.py
```

1. Capture distinct HEAD/index/working bytes, staged deletion with current file, modified/untracked/binary files; admitted snapshot equals working files. Repeat outside Git, with Git absent and in a selected repository subdirectory; no root expansion or source mutation occurs.
2. Empty, nested-empty and VCS/OS-metadata-only directories yield scratch. Excluded-only content fails `baseline.no_admitted_files`; unreadable inventory never reports scratch. Show exact exclusions, reject required-input removal, and distinguish explicit reviewed link exclusion from following links.
3. Equal-byte executable/regular files retain different semantic flags; only byte/flag/path defining changes affect identity. Capture from a read-only source; restored copies use 0755/0644, approved bytes stay 0444 and directories restore 0755. No source chmod or Git initialization occurs.
4. Inject content/roster/type/mode changes between inspection, copy and recheck; policy changes, replaced symlinks, unsafe/colliding paths, staging overlap, read/write/truncation failures and cancellation at every boundary. No partial snapshot opens; typed changed facts/stale tokens require review and preserve external edits.
5. Round-trip inspection/capture outcomes through InProcessClient and socket codecs with no installed harness and zero readiness/catalog/model calls. Assert token/owner/version enforcement, bounded retry and event publication only after the consistency barrier; M16.3 rejects stale approval and retains prior data after recapture failure.
6. After completed capture, change/delete the original; approval without a new inspection and M05 copies/M17 export-import/run use the same packaged bytes. Each configuration/trial starts independently; execution cannot write/copy back into the source.
7. Separate legacy fixture proves committed-only bytes/excluded dirty changes, fixed pin across HEAD moves, zero-file repository compatibility and unchanged v1 vectors. Legacy errors/cancellation preserve HEAD/index/status/current bytes, modes and untracked roster.

## Real gate and pending parent work

Run actual filesystem source-preservation/restoration tests on supported macOS/Linux; legacy tests additionally use actual Git. Integrate M16.3 → M01 storage → M05/M08 isolated copies → M17 exchange for both v2 target modes and unchanged v1 packages. Compare executable semantics and source preservation across success, failure, retry and cancellation.

**Pending parent obligations:** manual draft publication/edit/recapture, optional planner integration, UI/reconnect, real execution/verification, canonical authoring/import equality and all benchmark/project-type journeys. M16.2 remains mandatory for full parent acceptance; it is not an implementation or authoring gate for this capture child.
