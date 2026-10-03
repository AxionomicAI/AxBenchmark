# M08.3 — verification-screens

Parent: [M08 screens](../reference/modules/08-verification-evidence.md#4-screens). Requirements: R034, R073–R076, R083, R134, R144, R149–R150, R153–R154. Findings: F06, F09, F11; consume shared F04/F15/F18 contracts.

Outcome: verification, evidence and judge-input views preserve the selected result/trial/phase through every navigation and reconnect. Screens present engine outcomes; they do not run checks, classify evidence or decide eligibility.

## Entry conditions

**Completed implementation prerequisites:** [M08.2](02-verification-adapters.md), M15.1 app shell/widgets and M15.2 navigation/subscription manager, plus Bootstrap and the completed M11 client/event foundations inherited by M08.2.

**Bootstrap-published contracts, allowed as injected fixtures:** M02 results-screen navigation, M05 run-configuration navigation, M06 eligibility text, M11 run status/invalidation, M12 judge-input context and M14 CLI parity. Their feature screens need not be reimplemented in this child; real navigation is a parent gate.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/tui/screens/verification.py` (TaskChecksScreen, FinalRegressionScreen, ChecksScreen, ScreenshotsScreen, VerifyProgressScreen, JudgeInputScreen, EvidenceViewerScreen).
- `axbenchmark/tui/viewmodels/verification.py`, `evidence.py`; `axbenchmark/tui/styles/verification.tcss`.
- `tests/tui/test_verification_viewmodels.py`, `test_task_checks.py`, `test_final_regression.py`, `test_check_outcomes.py`, `test_screenshots.py`, `test_verify_progress.py`, `test_judge_input.py`, `test_evidence_viewer.py`, `test_verification_trial_navigation.py`.
- `tests/tui/fixtures/verification/` DTO fixtures for two trials, two same-label UIDs, both phases, retained/imported rows, partial evidence, invalidation and errors.

Coordinate navigation-only additions in M02 `tui/screens/results.py`, M05 `tui/screens/run_config.py` and M15 app routes; those owners keep their implementations. M08 owns VerifyProgressScreen and imports no other feature engine. No wireframe files are owned by this child.

Use only `axbenchmark.api`/`client`. Pure frozen view models format labels/glyphs and preserve engine counts, causes, changes, evidence admission and eligibility text. Shared ActionState dims unsupported keys; every error shows decoded message/field/remedy without parsing prose.

`TaskChecksScreen(result_id, trial, task_id, phase, check_id?)` calls `verification.task.get(result_id, task_id, phase)`. Assert the returned TrialRef matches the selection; previous/next changes only task. FinalRegression opens the final phase explicitly; CheckOutcomes rows carry result/trial/task/phase.

`ScreenshotsScreen(result_id, task_id, phase, check_id?)` loads scoped captures; evidence actions retain that result ID and selected evidence ID. Two terminals' screenshot placeholders depict DTO dimensions; the system viewer opens actual images. Do not infer pass from image presence.

`VerifyProgressScreen(trial: TrialRef)` calls `verification.progress.get(trial)`. M05's `p` binding passes the already resolved trial; a historical selection never follows the active/latest trial. Hide/escape dismisses only and leaves verifier/service processes running.

Use M15's EventCursor `{epoch, seq}`, revision/entry deduplication and replacement-snapshot handling. Subscribe to registered verification/results/run events needed by the view; filter exact scopes. Cancel or discard stale query workers after result/trial/task/phase changes, including late evidence chunks.

`EvidenceViewerScreen(result_id, evidence_id?, task_id?)` uses M02 list/paged-read methods, with 256 KiB maximum content chunks requested as the user scrolls. Show phase/trial metadata; offsets are file offsets, never subscription cursors. Binary files have an external-view note, not decoded text.

Render observed values, console output, logs, filenames and error text inert, including markup/ANSI/control-character fixtures. Resolve paths only through the engine. Sealed evidence is immutable; an unsealed result refreshes the list on its retained-outcome/seal events without changing scope.

`JudgeInputScreen(result_id)` renders the engine's given/kept-apart lists. Only final-regression delivered-artifact screenshots appear in given; per-task captures and measurements remain excluded. Pending/invalidated state cannot start a judge; opening an evidence folder is merely inspection.

## Boards, states and bindings

| Exact board | Required states and behavior |
|---|---|
| TaskChecks, wide/compact | `#task-checks` ready/loading/pending/error, ordinary failed/unverified distinctions, unavailable commit and run-invalidated notice; `s/f/j/l`, task arrows and tab use parent mappings. |
| FinalRegression | Separate at-task/final columns, fixed/regressed/differs, missing-phase reason, pending/error; enter opens selected final check without changing trial. |
| CheckOutcomes | Cause legend/counts and M06 effect, filtered empty/error, explicit result/trial/phase; `/`, `c`, `o`/enter preserve selected row scope. |
| Screenshots | Paired 1440×1000/390×844 placeholders and exact evidence refs, no-capture/loading/error; `o` open and `f` reveal use selected ResultId. |
| VerifyProgress | Stages, partial rows, no active verification for selected trial, pending durability and run-invalidated/error; Hide/escape never stop. |
| JudgeHandoff | Given/excluded lists, pending/error/invalidation, final-phase folder capability; close/escape only dismiss. |
| EvidenceViewer | Paged text/binary note, no evidence/loading/error, phase metadata, compact `e` list toggle; `o/f` and end/scroll request only selected evidence. |

Retain parent widget IDs, ContentSwitcher states, action mappings and engine wording. Wide-to-80×24 resizing preserves selection, focus and scroll. Bars show resolved trial index/count, phase and run reason; missing evidence is not a positive result.

Required later wireframe reconciliation: VerifyProgress must carry TrialRef, all evidence/check bars and links show explicit trial/phase, identity halt must not resemble an ordinary unverified check, and inventory labels/counts must be generated from M09's revised catalog. Report these changes without editing wireframes in this spec task.

## Acceptance and faults

Run `pytest tests/tui/test_verification_viewmodels.py tests/tui/test_task_checks.py tests/tui/test_final_regression.py tests/tui/test_check_outcomes.py tests/tui/test_screenshots.py tests/tui/test_verify_progress.py tests/tui/test_judge_input.py tests/tui/test_evidence_viewer.py tests/tui/test_verification_trial_navigation.py` with Textual Pilot and import-linter checks.

1. Drive every parent binding at wide and 80×24. Verify exact API arguments, dimmed capabilities and loading/empty/error transitions; escape/Hide makes no execution command. Resizing preserves focus/selection without losing long failure reasons.
2. Select trial 1 while trial 2 runs, then traverse tasks, final checks, logs, screenshots, judge input and M05 progress. Every request remains on trial 1. Two UIDs with identical labels/configuration ids never merge rows.
3. Delay trial-1 queries/chunks until after selecting trial 2. Deliver newer snapshots then older events, restart at lower sequence and overflow a queue. No stale payload replaces the current view; no check restarts during reconnect.
4. Show process success with failed check, process failure with passing observations, unverified prerequisite, verifier exception, not run and identity halt. Display retained outcomes unchanged and engine eligibility text verbatim; no UI reclassification.
5. Page a two-chunk log, select another evidence file mid-read, display binary evidence and attempt open/reveal failures. Render HTML/Textual markup, ANSI sequences and malicious filenames inert; errors and retry remain on the exact result.
6. Keep post-task/final screenshot sets distinct; JudgeHandoff excludes every per-task screenshot and measurement category, including nested detail links. Pending durability does not display completed regression or enable a judge action.
7. Leave every screen while real verification continues under a fake client disconnect; UI teardown unsubscribes and cancels only view workers. Layer checks reject any engine/filesystem access in screens.

## Real integration gate

Compose real M02 retained readers, M05 navigation, M08 runtime/adapters, M10 awaited accounting and M11/M15 subscription handling. Navigate a two-trial frontend run and an imported result through all boards, stop/invalidate during verification, detach/reconnect and resize. Inspect actual paired PNGs/system-opener behavior on supported platforms.

Run R149 frontend/backend/existing-repository workflows with M06 score explanations and M14 CLI/API parity. UI fake fixtures establish presentation only; the headless run and retained evidence must independently agree.

**Pending parent obligations:** M09 production inventory coverage, M11 stop/recovery/invalidation/finalization integration, M12 real judge handoff and M13/M17 retained-evidence report/import gates. This child closes M08 rendering ownership, not those providers' implementations.
