# M05.2 — isolation-observation

Parent: [M05 baseline/isolation contract](../reference/modules/05-harness-execution-isolation.md#environment-and-baseline-contract). Requirements: R044, R047, R067–R072, R077, R115, R119, R138, R140, R153. Findings: F10 executable semantics, F06 scoped evidence, F09 mismatch routing and F04 passive subscriptions.

Outcome: independently provisioned trial workspaces restore the approved bytes/modes and expose passive observations with honest limitations. Proposed work; no current adapter capabilities are asserted.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M05.1](01-process-runtime.md), [M01.1](../M01/01-canonical-definition.md) and [M01.2](../M01/02-revision-storage.md).

**Bootstrap-published contracts, allowed as injected fixtures:** M03 installed inventory; M07 frozen entries; M08 verification leases; M10 observations; M11 invalidation/topic providers; M16 unregistered `BaselineSnapshot`; M12 judge factory inputs and M02 delivered `SnapshotRef`. Real M08/M11/M16 integration remains a parent gate.

Use M01’s actual canonical reader and revision store for baseline acceptance; a fake directory cannot prove F10. Inject the four harness control adapters until their child gates.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/harness/domain/environment.py`, `policy.py`, `workspace.py`, `protocol.py`.
- `axbenchmark/engine/harness/application/establish.py`, `release.py`, `policy.py`, `snapshots.py`, `live.py`.
- `axbenchmark/engine/harness/adapters/fs_workspace.py`, `ports_local.py`, `browser_profiles.py`, `settings_files.py`, `baseline_bridge.py`.
- `tests/harness/test_baseline_restoration.py`, `test_resource_isolation.py`, `test_policy_assessment.py`, `test_passive_observation.py`, `test_judge_environment.py`; `tests/harness/fixtures/baselines/`.

The owned `domain/environment.py`, `policy.py`, establishment and filesystem/settings adapters implement `EnvironmentSpec.judge(scope: JudgingScope, artifact: SnapshotRef, artifact_root: Path, input_root: Path, scratch_root: Path, settings: RequestedSettings, policy: EnvironmentPolicy, record_dir: Path)`. Preserve `JudgingScope(review_id, result_id, trial, artifact_label)`.

Implement `HarnessExecution.establish/release/task_snapshot/materialize`, `HarnessResources.lease_verification(trial)/release_verification`, `HarnessLive.snapshot` and policy assessment. Fulfil M05.1’s ports; do not redefine its shared scope/error/record schemas.

Publish M05-owned protocol/dependency input parsers used by M01 reference closure, distinguishing frozen payload references from explicitly typed future workspace outputs. Inject M08’s service/check schema where it owns the format; do not invent a second template descriptor.

`BaselineSource` holds M01’s `FrozenRevision` publication lease through restoration. Read `baseline_files` from the hashed descriptor, including an explicit empty list; M16 snapshots must supply the same validated semantic entries before approval.

Strip exactly the `baseline/` prefix. Apply M01 `RelPath` validation, NFC/case-fold and file/directory collision checks. Reject symlinks, special files, submodules and escaping destinations before writing; never follow a source or destination link.

Create a fresh staging workspace, copy regular bytes, then set files to `0644`/`0755` from `executable` and directories to `0755` before publishing the allocation. Never copy approved storage modes or infer intent from ZIP permissions. Never chmod approved `0444`/`0555` entries.

Judge establishment binds M02’s materialized delivered snapshot; artifact/input roots are protected read-only, with distinct writable scratch/engine record roots only. Deny direct writes, repairs and traversal/symlink escapes; prove declared protection or return `harness.judge_protection_unavailable` before spawn. Never replace the artifact with a baseline, repair authoritative bytes or add a separate M12 process API.

A fresh `TrialRef` gets disjoint workspace, test data, port reservation and browser profile, even sequentially or for the same harness. Partial establishment rolls back only resources whose ownership was recorded for this allocation.

Assess all five clean categories independently. Any `cannot_disable` makes clean unavailable; absent is allowed only with evidence that the category does not exist. Never silently choose current. Current records sanitized relevant settings plus explicit requested overrides.

Permission controls must complete headlessly or return a blocked outcome. A permission profile is a recorded control contract, not a claim that arbitrary CLI processes provide OS sandbox guarantees. Record any limitation that prevents the requested policy.

Snapshot refs bind invocation/result/trial/task and preserve regular-file executable intent for M08 copies. Historical snapshot/diff lookup always requires explicit `TrialRef` or resolved `ResultId`; only the live snapshot may select an active trial and returns its resolved scope.

Watch workspace changes and compute task-start diffs without writing process input. Report rate/context/reasoning only from exposed evidence; unavailable remains unavailable and summaries are labelled. No observer alters permissions or retries an invocation.

`IdentityMismatch` from a revision open or later read propagates unchanged to the owning run operation/coordinator. Failed staging is cleaned; partial evidence is retained. Baseline mismatch is never merely a red isolation row while execution continues.

## Acceptance and faults

Run:

```sh
pytest tests/harness/test_baseline_restoration.py tests/harness/test_resource_isolation.py tests/harness/test_policy_assessment.py tests/harness/test_passive_observation.py tests/harness/test_judge_environment.py
```

1. Register a real M01 fixture with equal-byte executable launcher and ordinary file. Restore `0755`/`0644`, execute only the launcher directly, and confirm approved files/directories remain `0444`/`0555`. Repeat with the explicit empty baseline.
2. Reverse ZIP permissions in an M17 integration fixture while preserving descriptor flags; imported restoration matches local behavior. Advance the original repository branch; stored baseline bytes/modes do not change.
3. Reject traversal, absolute/drive paths, noncanonical Unicode, case collisions, file/directory collisions, symlinks and special files. Inject destination-link replacement during copy; refuse escape and leave outside sentinels unchanged.
4. Provision same-harness configurations and repeated trials concurrently/sequentially. Assert disjoint resources and semantic baseline equality. Inject occupied ports, browser setup failure and copy failure; rollback leaks no allocation and touches no other workspace.
5. Test every clean-category failure and a current-mode fixture containing credential-shaped data. No silent fallback, no raw secret in logs/fingerprint, explicit model/effort wins and user config bytes remain unchanged.
6. Slow or overflowing subscribers cannot delay fixture subprocess output. Missing token counts/rate/context stay unavailable; log offsets never become `EventCursor`. Diffs remain pinned when a new trial starts.
7. Inject mismatch before copy and during a later read; preserve the original identity check and reach the coordinator fixture. Reused pids or unrelated port owners are reported, never killed based only on port/cwd.
8. With a delivered snapshot and supplied judge roots, reject protected-root writes/repairs, nested traversal and symlink escapes while scratch/record writes succeed; authoritative bytes remain unchanged. Unsupported protection yields zero spawns through the existing M05 runtime.
9. Run real filesystem modes, bind allocation, browser-profile cleanup and watcher cancellation checks on macOS and Linux. Record platform versions; actual four-harness clean/current controls are deferred to adapter gates.

**UI boundary:** no screen code. Supply EnvPolicy/CleanModeBlocked category rows, RunIsolation ownership/blocked rows, and live available/unavailable observations to M05.7/M11.

**Pending parent obligations:** real adapter judge-root/clean controls, M12/M02 delivered-artifact integration, M17 imported round trip, M08 disposable copies, M11 invalidation/stop scheduling, M10 retained observations and M05.7 views. Fixture isolation does not establish a supported harness sandbox.
