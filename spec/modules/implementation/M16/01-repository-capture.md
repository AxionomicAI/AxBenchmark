# M16.1 — repository-capture

Parent: [M16](../../16-custom-template-planning.md#1-engine-component). Requirements: R007, R030, R068, R140, R149. Findings: F01, F10; shared F15.

Outcome: inspect a local repository, pin its committed revision and capture a complete portable baseline without changing source state.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M01.1](../M01/01-canonical-definition.md), [M11.1](../M11/01-engine-client-api.md) and [M11.2](../M11/02-events-jobs-lifecycle.md).

**Bootstrap-published contracts, allowed as injected fixtures:** M03 AssessOperation for create gating; M05 typed unregistered baseline/WorkspaceProvisioner; M08 semantic restoration. Their real adapters are later integration gates, not requirements to implement them here.

No harness/model call occurs in this child. Git is an installed local dependency; missing Git and unresolvable objects return typed inspection/capture errors.

## Exact proposed ownership

- `axbenchmark/engine/planning/domain/repository.py`, `requests.py`, `baseline.py`, and capture/request errors in `errors.py`.
- `axbenchmark/engine/planning/application/inspect_repository.py`, `create_request.py`, `capture_baseline.py`.
- `axbenchmark/engine/planning/adapters/git_cli.py`, `fs_snapshot.py`, `json_requests.py`.
- Capture/request declarations in `engine/planning/ports.py`; M16-owned DTOs and registration for inspect_repository/create_request/request in `axbenchmark/api/planning.py` and `engine/planning/adapters/rpc.py`.
- `tests/engine/planning/test_requests.py`, `test_git_capture.py`, `test_source_preservation.py`, `test_snapshot_modes.py`, `test_capture_faults.py`.
- `tests/api/test_planning_capture.py`; `tests/fixtures/planning/git/` scripts that create temporary repositories, never user repositories.

M16.2 owns session lifecycle, M16.3 canonical conversion, M01 identity, M05/M08 workspace copying and M17 archives. Extend shared files only in the named sections; do not implement another descriptor or restore format.

## Interfaces and bytes

Implement parent GitReader.inspect/tree/source_state, SnapshotStore.write/open/discard and RequestRepository with exact typed IDs and errors.

CreatePlanningRequest validates multiline prompt/type/baseline and pins a full commit object id. Later capture consumes that pin; it never resolves the submitted branch or HEAD again.

GitReader.tree streams `(path, mode, object_id, bytes)` from ls-tree/cat-file of the pinned commit. Export attributes cannot rewrite bytes because capture does not use git archive or the working tree.

Only regular Git modes 100644 and 100755 are accepted. Map them to SnapshotFile.executable false/true; reject symlinks, gitlinks/submodules, special modes and unsafe/colliding paths with exact path/cause.

Reuse M01 RelPath validation, including normalization/case-fold and file/directory collisions. Never follow a symlink or silently skip an unsupported tracked entry.

SnapshotStore writes engine-owned staging, hashes streamed bytes and publishes a complete BaselineSnapshot only after validation. Failed/cancelled partial writes cannot be opened as a valid snapshot.

An empty project is explicitly `kind=empty, files=()`; repository kind may also have zero files. No fallback substitutes empty for failed repository capture.

Stored snapshots use read-only file bytes; baseline.json retains semantic executable flags. M16.3 later writes these as hashed `metadata.json` baseline entries under baseline/.

Source path, commit label, capture time, excluded counts and source checks are provenance/display data outside canonical identity. Physical read-only modes never determine executable intent.

## Source preservation and failures

Allow only the parent's read-only Git commands with GIT_OPTIONAL_LOCKS=0 and GIT_TERMINAL_PROMPT=0; clear inherited GIT_DIR/GIT_WORK_TREE overrides. No checkout/stash/fetch/reset/config mutation is allowed.

Compare SourceState before and after: HEAD, raw index digest, working-tree file bytes/types/modes and status digest. Detect external changes but never revert or repair the source to make comparison pass.

Uncommitted staged/modified/untracked content is counted and excluded. The committed object tree alone supplies baseline bytes, including when index and working file differ.

A completed snapshot is retained for retry. Capture failure before completion can retry only the original pinned object; missing object data remains an explicit failure.

Read errors, unsupported file types and cancellation preserve source state and keep incomplete snapshots unavailable. Engine-owned temporary cleanup cannot traverse into the source repository.

## Board/data boundary

No screens are owned here. M01 NewTemplate/NewTemplateRepo/NewTemplateInvalid consume inspection/creation DTOs; M16 PlanningProgress displays capture steps and exclusion/source-preservation data.

The engine provides can_continue, problems, commit and exclusion notice. Interfaces never reinterpret Git status or silently change the revision.

## Acceptance and faults

```sh
pytest tests/engine/planning/test_requests.py tests/engine/planning/test_git_capture.py tests/engine/planning/test_source_preservation.py tests/engine/planning/test_snapshot_modes.py tests/engine/planning/test_capture_faults.py tests/api/test_planning_capture.py
```

1. Fixture has committed files, one staged change, one modified file and one untracked file: captured bytes equal the pinned committed tree, exclusion count is three and complete source state stays identical.
2. Move HEAD after request creation and after capture; neither the snapshot nor retry changes. Empty and empty-repository baselines retain their distinct explicit kinds.
3. Equal-byte executable launcher and regular file keep equal byte digests but distinct flags. Flip only the flag in canonical-conversion integration and identity changes.
4. Reject symlink/submodule/unsafe path, missing object, stream truncation and failed write; no partial snapshot opens, source stays unchanged and errors identify the path/step.
5. Inject cancellation at each stream/write/publication boundary; only a complete published snapshot is reusable. Simulate concurrent user edit: report source difference and preserve that edit.
6. Round-trip inspection and request DTOs through real InProcessClient/socket codec; stable error fields, safety metadata and no-harness create gating, with zero model calls.

## Real gate and pending parent work

Run source-preservation tests with actual Git on supported macOS/Linux. Integrate M16.3 → M01 storage → M05/M08 copying → M17 export/import: launchers restore 0755, regular files 0644 and directories 0755; approved storage remains 0444/0555.

**Pending parent obligations:** planner jobs, editing/approval, UI/reconnect, real execution/verification, canonical equality across authoring/import and all project-type journeys. This child proves capture, not complete planning or portable execution by itself.
