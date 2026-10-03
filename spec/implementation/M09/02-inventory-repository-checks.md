# M09.2 — inventory-repository-checks

Parent: [M09 observation catalog](../reference/modules/09-default-inventory-benchmark.md#versioned-inventory-observation-catalog). Requirements: R020–R028, R073–R076, R144. Findings: F11; preserve F01 identity closure.

Outcome: an implementer can execute repository, commit, README, runtime and direct-file observations without confusing absent metadata with a failed requirement. This is proposed implementation work.

## Entry conditions

**Completed implementation prerequisites:** [M09.1](01-inventory-package.md), [M08.1](../M08/01-verification-runtime.md), [M08.2](../M08/02-verification-adapters.md), including their real M05 snapshot and M02 retention prerequisites.

**Bootstrap-published contracts, allowed as injected fixtures:** M11 scheduling, M10 phase-summary consumer, M06 eligibility, M12 judge projection and M17 exchange. Fixture invocation records may model history; real history and Playwright adapters must execute this child's gate.

## Ownership

Own proposed package sources under `axbenchmark/engine/library/builtin/data/inventory_web_r1/checks/`:

- `repository.py`, `runtime.py` and initial `observers.py`/`observation_rules.v1.json` repository/runtime sections.
- Entries for the 13 checks below in M09.1's suite, coordinated as sequential edits; M09.1 retains catalog/schema ownership.
- `tests/builtin/test_repository_checks.py`, `test_commit_advancement.py`, `test_runtime_checks.py`, `test_check_classification.py`.
- `tests/builtin/fixtures/repository/` with seven task boundaries, read failures, README updates and multiple valid Git histories; `fixtures/runtime/` for native, library-backed and server-only entries.

M09.3 extends shared observer/rule sections later. Do not implement a private runner, alter M08 classification or write tooling into competitor source. Runtime implementation is frozen check payload, not M09 engine service code.

## Concrete checks and interfaces

Implement `T1_repository`, `T1_readme`, `T1_scaffold`, `T1_runtime`, `T1_direct_file`, `T1_commit`, `T2_commit`, `T3_commit`, `T4_commit`, `T5_commit`, `T6_readme`, `T6_commit`, `T7_commit`: **13** checks. The parent's remaining 17 belong to M09.3.

Every check consumes M08 `CheckContext`/`CheckTarget`, returns declared `ObservationRecord`s and uses `expect(check_id, observation)` only for the exact parent predicate. Resolve ResultId/TrialRef and phase before any snapshot/history read.

Implement `commit_advancement(context, task_id)` once with seven suite entries. Read captured task-start and task-end history/tree via M05/M08; never read a moving live workspace. A display `Unavailable(commit)` is independent from this observation.

T1 starts without Git and needs a new reachable commit. T2–T7 need a different end HEAD and a reachable commit absent at start representing task-delivered changes. Multiple commits and non-linear history are allowed. A legitimate empty T7 QA commit is allowed; fixed messages and timestamps are not required.

Record before/after snapshot ids, readable HEADs, new reachable commit ids and tree evidence. A readable unchanged HEAD/history is an observed failure. Missing/corrupt capture is unverified; never infer failure solely from absent display metadata or a later task's HEAD.

For final historical checks, reopen the same original task boundaries. A T7 commit cannot turn a missing T4 commit into a pass. Preserve unavailable metadata in the outcome even when repository evidence proves advancement.

T1 repository existence is historical. T1 README existence is observed on the target artifact; discover case-insensitive README basenames in the project without enforcing a root path. Empty content fails; exact prose/format does not matter.

T6 README update uses captured T6 start/end bytes and the task's new committed tree. Reusing a README change from T5, changing it only after T6 or leaving it uncommitted does not satisfy the declared observation.

Runtime checks open the actual copied `index.html` through `file:` with Python Playwright, without an application server. Separate observed server dependence from a missing browser, blocked verifier filesystem access or a browser crash.

Resolve HTML/scripts/imports and observed resource loads into a logged runtime closure. Identify framework/library provenance from content/dependencies actually used; do not fail on package manifests, test tools, filenames, authored CSS or unexecuted dev dependencies alone.

Unresolved dynamic/obfuscated dependency closure is unverified. A known loaded framework/runtime library is a requirement failure; a fully resolved native application closure passes. No fixed script paths or global symbols are required.

Use the parent's deadlines, phase targets, prerequisites and evidence kinds. Add no task obligation through diagnostics. Console messages, exit codes and screenshots alone do not establish application failure or passing requirements.

Freeze helper/rule bytes under `support_paths`; declare exact `entry` and `support_refs`. Suite/source/rule changes must change M01 identity; a build cannot ship undeclared helper imports.

## Observable states supplied

TaskChecks/FinalRegression receive individual commit outcomes with historical targets; CheckOutcomes distinguishes failed requirement, unavailable history, missing prerequisite and verifier error. InventoryChecks receives executable coverage rather than “also checked” copy.

Screens retain original unavailable commit metadata and show the executable expected/observed evidence separately. Historical screenshot evidence is not admitted to M12's delivered-artifact screenshot set.

## Integrated requirements

R183 — [benchmark modes](../BENCHMARK-MODES.md).

Preserve the built-in v1 descriptor, all eight original input byte streams, seven tasks, suite IDs and original acceptance predicates. It projects as legacy multi-step; T7 remains the authored QA/fixes task. Its declared per-task commit protocol is the compatible legacy execution branch: no repository before T1, competitor initialization and first commit within T1, then original advancement checks. Do not preinitialize, inject new instructions, duplicate mandatory checks or strengthen historical ancestry predicates. Extend package/repository integration fixtures to select this branch beside a new-policy v2 fixture and prove original bytes/hashes/outcomes stay unchanged; archive read/export never regrades.

## Acceptance and faults

Run `pytest tests/builtin/test_repository_checks.py tests/builtin/test_commit_advancement.py tests/builtin/test_runtime_checks.py tests/builtin/test_check_classification.py`; browser-marked direct-file cases are mandatory.

1. Build seven actual task boundaries with commits and README changes; all 13 owned checks pass at-task/final against their correct targets. Git and runner files remain outside immutable source snapshots.
2. Independently omit T2, T4 and T7 commits. Readable history yields the matching failed requirement; later commits never heal it. Unavailable display metadata plus readable advancement still passes; unreadable history remains unverified.
3. Accept multiple task commits and an empty T7 commit. Reject unchanged HEAD, missing repository, uncommitted delivered change and a T6 README change absent from its committed tree. Unsupported rewritten-history timing is unobservable.
4. Test nested/case-varied README, empty README, missing update and update in the wrong task. Retain before/after bytes/digests and observation evidence instead of inferring from timestamps.
5. Native direct-file apps with different layouts pass; actual loaded runtime library and proven server-only entry fail the matching checks. Test-only dependencies do not fail. Missing browser, unreadable closure and instrument crash are distinct unverified causes.
6. Stop/cancel the browser or history reader, inject runner/report errors and mutate suite identity. Ordinary faults follow M08; identity propagates fatally without being converted to a failed check.
7. Schema validation and M01 manifest closure include every helper/rule. Two trials with the same task ids retain separate historical refs; final results never relabel source task as T7.

## Real integration gate

Run these checks through real M05 snapshots, M08 disposable runner and M02 retention, then query both phases. Verify no changed source bytes or leaked browser/process resources. M10 totals preserve phase separation.

**Pending parent obligations:** M09.3's 17 data/behavior/QA checks and two complete conforming apps; M09.4 screens; released package pin, full planner-free runs, M17 exchange/M13 reports and macOS/Linux acceptance.
