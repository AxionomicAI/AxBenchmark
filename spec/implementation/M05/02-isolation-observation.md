# M05.2 — isolation-observation

Parent: [M05 baseline/isolation contract](../reference/modules/05-harness-execution-isolation.md#environment-and-baseline-contract). Requirements: R044, R047, R067–R072, R077, R115, R119, R138, R140, R153. Findings: F10 executable semantics, F06 scoped evidence, F09 mismatch routing and F04 passive subscriptions.

Outcome: independently provisioned trial workspaces restore the approved bytes/modes and expose passive observations with honest limitations. Proposed work; no current adapter capabilities are asserted.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M05.1](01-process-runtime.md), [M01.1](../M01/01-canonical-definition.md) and [M01.2](../M01/02-revision-storage.md).

**Bootstrap-published contracts, allowed as injected fixtures:** M03 installed inventory; M07 frozen entries; M08 verification leases; M10 observations; M11 invalidation/topic providers; M16 unregistered `BaselineSnapshot`; M12 judge factory inputs and M02 delivered `SnapshotRef`. Real M08/M11/M16 integration remains a parent gate.

Use M01’s actual canonical reader and revision store for baseline acceptance; a fake directory cannot prove F10. Inject the six registry harness control adapters until their child gates.

Own `domain/context_capture.py`, `application/context_capture.py`, `adapters/context_spool.py` and additive harness ports plus `tests/engine/harness/test_context_capture.py`. Produce sanitized `ContextObservation`s to M10's separate durable `ContextCaptureSink.accept`/`close` path, carrying complete trial/task/invocation/session/agent/window/request/phase identities and stable capture/entry/segment/source-range IDs; label synthetic identities. Native role, counter and actual input-membership evidence are independent.

A bounded RAM/disk spool and supervised capture worker keep stream reading independent of classification and lossy UI queues. Record durable source-range gaps on overflow and reserved closure/control records; inability to persist closure keeps finalization pending. Await accepted capture work and close every source after producers drain, including stop/partial/off/unavailable. No classifier completion, decision lease or prediction controls harness execution; hidden reasoning remains unexposed.

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

Retained statistics observation uses M10.1's canonical `RequestFactScope`, `RequestKey`, `GenerationTimingObserved` and `RequestRosterObserved`, separately from advisory `OutputDelta`/live rate/context signals. Preserve exact source timestamp/duration lexemes, clock identity/epoch/resolution, token/timing basis, receipt references and native versus synthetic IDs. Observe only attributable competitor work including descendants; unexposed child requests or clocks remain limitations. A terminal count alone is not a complete request identity roster.

At final delivery, retain the immutable snapshot manifest with ResultId/full TrialRef, template/baseline and delivered-scope digest for M02's pinned reader. Snapshot inventory identifies regular, link and special entries without following links; no later workspace watcher, task snapshot sum or Git history substitutes for final delivered contents. M10 alone applies versioned file/LOC counting and exclusions, including baseline files and excluding declared VCS/dependency/cache/engine-evidence paths.

Own `domain/variant_evidence.py` and `application/variant_observation.py` with `validate_variant_evidence(frozen, observed) -> confirmed|reported|declared|unverified|mismatch`. Preserve requested selection, source-resolved artifact and invocation-bound effective serving observations separately. `VariantObserved` carries proof scope/coverage, full TrialRef/invocation/request interval, immutable refs, observed time, effective control claims with explicit coverage and safe evidence; M02's separate recorder returns durable receipts. Alias/header/file-hash evidence alone cannot confirm loaded weights or complete active adapter/runtime composition.

Before every dispatch compare available effective evidence to the freeze; known contradiction refuses dispatch. Drift retains the last reliable observation cutoff and affected request/trial scope, conservatively the whole trial if unknown, then uses M05 stop/drain and M11 configuration halt. Capture only documented supported introspection without inference or model/server lifecycle actions. Unsupported observation settles unverified/unavailable and cannot earn strict comparison qualification.

**Route, comparison and profile interfaces.** Own access/profile materialization in existing isolation/settings adapters: verify immutable source/executable/asset digests before first and each later task spawn, compile safe declarations to the registered executable plus structured argv/env, copy only approved behavioral assets and redirect writable state into invocation-owned roots. Apply inherited declarations, explicit reviewed override set and mandatory role/isolation controls with retained source precedence. A conflicting unreviewed common model/effort/route fails before spawn; ordinary optional unknown declarations remain limitations. Existing treatment maps to CURRENT; clean maps to CLEAN and must pass full clean gates. Credentials resolve only at dispatch for the chosen hop/origin; no fallback to personal auth, redirects to other origins or global gateway edits. Retain source_fact_ref-linked route/variant observations via M05.1, and actual upstream locality independently of gateway CPU placement.

**Isolated API access profiles — R192–R193.**

[CROSS-HARNESS-COMPARISON.md](../CROSS-HARNESS-COMPARISON.md) adds benchmark-owned config/env materialization and request route/effort observations. Never mutate global user settings or assume a separate config directory disables every harness integration. Bind observations to existing InvocationScope/TrialRef/request identity, deduplicate multi-hop usage evidence and keep helper/verification/observer roles separate. Route profile edits affect future launches; frozen runs retain the exact mapping/version. An unavailable injection or effective-observation mechanism is an explicit capability result.

**Existing-profile snapshots — R194.**

[CROSS-HARNESS-COMPARISON.md](../CROSS-HARNESS-COMPARISON.md) extends preparation with a named existing launcher profile, qualified behavior-asset bindings, treatment and override provenance. Resolve accepted static aliases into executable argv/env, then relocate writable runtime/profile state to the isolated task/trial tree. Do not copy a whole personal home/profile or session/history/auth cache. Include observable profile/treatment identity in invocation facts and preserve optional unsupported declarations as limitations. Verify originals stay unchanged across normal, failed and cancelled invocations, and reject required absolute-path writes that cannot be isolated. Existing/clean choice never weakens workspace or judge/diagnostic role restrictions.

## Integrated requirements

R192, R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R173, R174, R176 — [benchmark statistics](../BENCHMARK-STATISTICS.md).

R161, R162, R163, R164 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

R178, R179, R183 — [benchmark modes](../BENCHMARK-MODES.md).

Implement the parent's `CompetitorInputs`, `TaskCommitProtocolRef` and `TaskRepositoryEvidence` in the owned protocol/workspace/establishment/snapshot files. V2 one-shot sends T1's exact bytes once plus the separate approved common instruction; multi-step sends shared context and only the introduced primary prefix, each once. Keep one workspace/repository across fresh task sessions, with disjoint copies per trial. Baseline information already present stays visible; source folders remain read-only, and bytes/flags come from the approved capture after the origin disappears.

For new-policy empty captures initialize an isolated repository with unborn HEAD and no setup commit; populated captures get exactly one synthetic baseline commit including all admitted bytes/flags, even ignored paths, before measured work. Never reuse source `.git`, pointers, objects, index, hooks, config or remotes. Establish trial-scoped benchmark Git identity/settings with inherited personal env/config/signing/hooks/prompts disabled, no user writes or push; failure blocks before invocation. Preserve M09's absent-repository T1 branch unchanged.

Capture start before spawn and end after drainage: explicit absent/unborn/born HEAD, commit/tree ids, newly reachable commits, prior stage tips/ancestry, setup/competitor origin, scoped inventory/dirty paths/exclusions and immutable history/snapshot digests. Bind ResultId/TrialRef/task/InvocationId and await durable evidence receipts; M08 decides compliance. Never engine-commit a task, silently retry or repair; recovery only replays retained writes. Extend restoration/isolation tests for all four mode×target cases, ignored required deliverables, hostile personal Git settings, missing Git, no-change empty milestones and source/history preservation.

## Acceptance and faults

**Route/profile acceptance:** Byte-compare independently authored fixture source/assets before/after success, cancellation and failure; forbid startup sourcing, shell expansion, whole-home/session/auth copying and unisolatable writes. Tests cover source drift between tasks, missing binding credentials, two explicit credential declarations with qualified/unqualified precedence, model conflict awaiting review and source secrets scrubbed before hashes/events/export.

**Variant acceptance:** Exercise same alias/different bytes, same bytes/different creator claims, unknown composition, hidden routing, predispatch mismatch and mid-task drift. Durably retain affected intervals before finalization with no automatic retry/load/substitution; safe source evidence cannot expose private endpoints/paths. Baseline IdentityMismatch remains a separate run-wide error.

Add passive-observation fixtures for paired and unpaired native output/windows, concurrent child requests, missing roster membership, incompatible clocks/bases and storage delays. Pin the final manifest, mutate/delete the workspace and verify the M02 reader returns the same bytes/digest; links/external paths cannot enter a traversed inventory. No rate is synthesized from task elapsed time.

Throttle/fail the classifier and client queues while draining output: capture continues within bounds with durable gaps. Delay capture acknowledgements/closure and assert seal remains pending; retry IDs deduplicate, changed scopes conflict. Test exposed reasoning versus summary, synthetic IDs and unknown membership without guessed counts.

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
9. Run real filesystem modes, bind allocation, browser-profile cleanup and watcher cancellation checks on macOS and Linux. Record platform versions; actual six-harness clean/current controls are deferred to adapter gates.

**UI boundary:** no screen code. Supply EnvPolicy/CleanModeBlocked category rows, RunIsolation ownership/blocked rows, and live available/unavailable observations to M05.7/M11.

**Pending parent obligations:** real adapter judge-root/clean controls, M12/M02 delivered-artifact integration, M17 imported round trip, M08 disposable copies, M11 invalidation/stop scheduling, M10 retained observations and M05.7 views. Fixture isolation does not establish a supported harness sandbox.
