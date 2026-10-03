# M08.2 — verification-adapters

Parent: [M08 adapters and retention](../reference/modules/08-verification-evidence.md#adapters-engineverificationadapters). Requirements: R034, R067, R073–R076, R083, R134, R144, R149–R150, R153–R154. Findings: F03, F06, F09, F11.

Outcome: real repository/backend/Python Playwright observations on disposable copies, durable scoped evidence and a measurement-free judge handoff. This is a proposed implementation assignment.

## Entry conditions

**Completed implementation prerequisites:** [M08.1](01-verification-runtime.md), [M02.2](../M02/02-retention-services.md), [M03.1](../M03/01-readiness-service.md), and their Bootstrap/M11 foundation dependencies. Exercise the real M02 recorder and M05 snapshot/resource implementation from M08.1's prerequisites.

**Bootstrap-published contracts, allowed as injected fixtures:** M01 verified revision reader, M06 eligibility notes, M10 acknowledged observations/finalizer, M11 scheduler/coordinator, M12 evidence consumer, M09 inventory suite and M16 generated suite. Full inventory/judging/scheduler implementations are later real integration gates.

## Ownership and interfaces

Own proposed files under `axbenchmark/engine/verification/`:

- `adapters/suite_v1.py`, `runner_process.py`, `fs_copies.py`, `journal.py`, `services_process.py`, `opener.py`, `retention.py`, `rpc.py`.
- `adapters/verifier/__main__.py`, `context.py`, `browser.py`, `backend.py`, `repository.py`, `report.py`.
- `application/queries.py`, `judge_evidence.py`; extend M08.1 DTOs/ports without duplicating shared domain types.
- `tests/verification/test_suite_reader.py`, `test_runner_process.py`, `test_browser_evidence.py`, `test_repository_backend.py`, `test_service_cleanup.py`, `test_evidence_retention.py`, `test_judge_handoff.py`, `test_api.py`.
- `tests/verification/fixtures/browser/`, `backend/`, `repository/`, `reports/` for working/broken apps, two materially different conforming data implementations and malicious evidence text/path fixtures.

Wire feature factories through M11's `engine/daemon/composition.py` and registrations through `axbenchmark/api/registry.py`; coordinate these additive integration edits with their owner. M09 owns production inventory check modules, never this adapter package.

`SuiteSource.suite(sha)` reads through M01 `RevisionReader.open`, validates the frozen observation schema and approved instructions, and retains exact revision binding. Changed bytes propagate `IdentityMismatch`, never `SuiteInvalid` or a repaired/re-pinned suite.

`SnapshotSource.task_snapshot(trial, task)` and M05 materialization preserve immutable snapshots. `DisposableCopies.create/dispose`, `VerificationLeases.acquire(trial)/release` and `AppServices.start/stop` keep copies, test data, ports and browser profiles disjoint from competitors and other trials.

`CheckRunner.run(check, target, out_dir)` launches one verifier group per check, tooling cwd outside both competitor tree and copy, with explicit snapshot/result/trial/phase context. A process group owns its browser/services; drain logs and report before returning. Deadline/cancel/restart cleanup includes descendants and releases resources.

The runner executes only frozen strategies. `CheckContext.expect(expectation_id, observation)` raises the designated requirement assertion only after collecting the declared observable contradiction. Arbitrary exceptions, unresolved discovery, malformed reports and timeouts are infrastructure/unverified; known unavailable prerequisites use M03 reasons.

Accessible roles/names/labels, approved interfaces and logged deterministic discovery permit different conforming implementations. Read-only repository/data inspection and external instrumentation cannot patch application code or require invented DOM/storage schemas. A valid data-stage implementation without later UI must not fail for missing UI.

Repository observations include actual target/prior snapshot history when a declared commit-advancement obligation is checked. Readable history with no required new commit is a failed requirement; inaccessible snapshot/history is unverified. A displayed unavailable commit identity is not the executable observation.

Backend checks exercise the approved HTTP/interface contract and distinguish a demonstrated wrong application response from broken verifier transport/setup. Fullstack fixtures run their browser/backend workflow together; direct-file fixtures do not gain an unapproved mandatory application server.

Python Playwright uses fresh contexts with workflow-local continuity. Record meaningful interaction, keyboard steps, console/page errors and the declared observations. Each capture step produces 1440×1000 and 390×844 PNGs of the same logical workflow state; replay or viewport transition must not silently reset the subject.

`report.json` validates against the M08.1 report/observation contract before classification. Exit 0 or screenshots alone cannot pass. Capture evidence identifies result/trial/phase/check/step/viewport plus snapshot and digest; no task/final/trial path collision is permitted.

Use the parent's exact working/retained hierarchy and stable write operation IDs. Complete M02 evidence attachment before its referencing outcome; persist pending delivery journal and await M10 receipt before announcing task/final completion. Failure leaves recoverable state, no orphaned success or seal.

Stop/dispose failures retain logs and cleanup facts. Never delete a source snapshot or tooling directory while removing a copy; reject traversal/symlink escapes. Redact credentials in diagnostic output before retention; application observations remain inert text on API surfaces.

`AcceptanceEvidence.for_judge(result_id)` resolves the exact trial and final artifact. Project behavioral check evidence recursively: no execution duration, token/cost/hardware fields, per-task screenshot refs or historical-snapshot captures. Admit only final-regression delivered-artifact screenshots, both viewports for each included capture.

Final/post-task evidence remains separately queryable. `for_judge` before completed final regression raises `PhaseNotReady`; invalidated runs cannot start judging. M11 alone starts M12 after identity/finalization gates; a regression event is not a scheduler.

Implement the parent's query methods, `CheckSummaries.for_trial(trial, phase)`, evidence open/reveal and snapshot provider. Historical APIs resolve ResultId; progress requires TrialRef. Error responses use integer `-32000` and stable `data.code`; do not translate fatal identity into verification failure.

## States supplied to screens

TaskChecks receives pending/running/completed rows, exact trial/phase and ordinary errors. FinalRegression receives separate sides and changes; CheckOutcomes receives causes and M06 effects. Screenshots/EvidenceViewer receive confined refs/chunks; VerifyProgress receives scoped stages; JudgeHandoff receives allowed/excluded categories.

No TUI rendering here. Register `verification` topic snapshots with object revisions and EventCursor; client reconnect never reruns a check. Evidence commands use an injected system opener and cannot mutate execution or acceptance facts.

## Acceptance and faults

Run `pytest tests/verification/test_suite_reader.py tests/verification/test_runner_process.py tests/verification/test_browser_evidence.py tests/verification/test_repository_backend.py tests/verification/test_service_cleanup.py tests/verification/test_evidence_retention.py tests/verification/test_judge_handoff.py tests/verification/test_api.py`; real browser cases carry the `browser` marker and are a required integration run.

1. Real Playwright workflow/keyboard/console fixtures produce both PNG dimensions at exactly declared capture steps, preserve logical state and run outside the copy. Broken app behavior fails; missing Chromium and crashed instrumentation remain distinct unverified outcomes.
2. Run two different conforming data/browser implementations through shared observation contracts. Valid T2 data without T3 UI does not fail; ambiguous unsupported discovery is unverified. Real M09 catalog conformance remains a separate gate.
3. Use real repository history across task snapshots: commit advances, missing later commit, unavailable history and changed README. Backend/fullstack fixtures demonstrate passing and failing interface behavior without imposing a new layout/API.
4. Verify two trials and both phases retain distinct files/digests through M02 reads. Inject short writes, late logs, acknowledgment delay, duplicate delivery and crash; no completion or seal precedes durable retention/accounting acceptance.
5. Invalidate the suite during read/final verification/cleanup; preserve the fatal check and partial evidence to M11. Simultaneous cleanup failure cannot replace identity. Kill/cancel setup/browser/backend trees and restart; verify no children, ports or profiles leak.
6. Inspect the full nested judge payload for forbidden measurement fields and per-task screenshots; all included captures match the final artifact and required dimensions. Early/invalidated handoffs reject while retained evidence remains inspectable.
7. Exercise all query/error/command methods through socket and in-process clients. Reject cross-result evidence, traversal and scope mismatch; check projection replay/resync without duplicate records and import-linter boundaries.

## Real integration gate

Run approved frontend, backend and existing-repository templates through real M01/M02/M05/M08/M10/M11 services; immediately export/import and report after finalization, comparing phase/trial evidence and summaries. Run M09's exact versioned inventory suite on both conforming implementations and documented defects. Verify M12 consumes only the admitted final-artifact evidence.

**Pending parent obligations:** M08.3 screens/navigation, M09 production check catalog/coverage, M11 every terminal-path barrier, M12 judging integration and R149 product end-to-end tests. A fake runner or fake accounting sink is not evidence for this gate.
