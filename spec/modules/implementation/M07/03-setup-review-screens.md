# M07.3 — setup-review-screens

Parent: [M07 screens](../../07-run-configuration.md#4-screens). Requirements: R017, R019, R032, R033, R037, R066, R067, R077, R080, R081, R106, R114, R145, R154, R156–R158. Findings: F07 immutable currency, F04 subscriptions, F15 foundations, F18 errors.

Outcome: editable Setup, independent judge choice, complete launch review, exact budget confirmation and immutable launch inspection at both terminal sizes. Engine DTOs own every validity, total, provenance and action-state decision.

## Entry conditions

**Completed implementation prerequisites:** [M07.2](02-launch-preparation.md), M15.1 `tui-foundation` and M15.2 `tui-shell` from the [foundation contract](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries). Reuse workers, widgets, prompts, typed cursor subscriptions, navigation, focus and wide/compact harness.

**Bootstrap-published contracts, allowed as injected fixtures:** M01 `LaunchCheckScreen`; M04 `EntryPickerScreen`; M05 environment/clean-policy screens; M06 `WeightsScreen`; M10 `CurrencyEnergyScreen(mode="setup")`; M12 `JudgeCapabilityScreen` factory from `axbenchmark/tui/screens/judge_capability.py`; M18 `MonitoringScreen`; M11 launch-job responses. Use injected screen factories/client responses until real owners integrate; do not duplicate their screens or make every parent a prerequisite.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/tui/screens/setup.py` (`SetupScreen`, `JudgeScreen`, `ReviewLaunchScreen`) and `run_config.py` (`LaunchRecordScreen`).
- `axbenchmark/tui/viewmodels/setup.py`, `judge.py`, `review_launch.py`, `launch_record.py`; pure DTO-to-view mappings.
- `axbenchmark/tui/styles/setup.tcss`, `review_launch.tcss`, `launch_record.tcss`; register factories through the existing M15 navigation seam.
- `tests/tui/test_setup_viewmodels.py`, `test_setup_screen.py`, `test_judge_screen.py`, `test_review_launch.py`, `test_launch_record.py`, `test_setup_subscriptions.py`, `test_setup_navigation.py`.
- `tests/tui/fixtures/configs/` schema-valid JSON fixtures for each named board and loading/empty/error/stale variants.

Use only parent's `configs.*`, `catalog.options`, `runs.launch` and shared navigation. No screen imports engine validators, computes totals/weights, infers effort support or converts money. Use `ActionState.enabled/reason`; shared `EngineError` message/field/remedy renders unchanged.

Mount Setup with `configs.open`; reopen never-saved drafts by draft ID. Persist each successful edit via its one command; plain Escape/disconnect only ends observation. Configuration switching uses the shared unsaved-change confirmation and retries the same request with explicit discard only after acceptance.

Judge candidates come from `configs.judge_candidates`; selected harness options from `catalog.options`. `configs.set_judge` alone authorizes the explicit selection. Saved/planner/first-usable branch marks and fallback notice come from the engine; user choices stay independent of competitors.

On `judging.screenshot_inspection_unsupported` or `judging.screenshot_inspection_unknown`, Setup/JudgeScreen opens that M12 factory. M12 owns the modal, its `judging.check_judge` refresh and Action result; M07 handles CHOOSE_JUDGE, OVERRIDE_CATALOG then revalidate, RECHECK, or BACK without changing the judge implicitly. `setup.py` owns no JudgeCapabilityScreen implementation.

WeightsScreen returns validated values to one `configs.set_weights` call. CurrencyEnergyScreen setup mode returns accounting to one `configs.set_execution`; monitoring/environment pickers issue their owned mutation. Use engine limits/defaults and preserve raw invalid input beside its field error.

Review mounts `configs.review(draft_id, **adjustments)`. Launch issues `runs.launch(draft_id, preview_digest, **adjustments)` and hands its `JobRef` to M01 LaunchCheckScreen. Subscribe through M15 to `job:<job_id>` for that job; no bare `job` topic or `jobs.*` event is invented. Cancel uses the shared jobs flow, never deleting a frozen launch from the UI.

Budget confirmation belongs to the current preview digest. Launch/Back show the engine message and exact totals; cancel issues no launch. A new preview, draft change, stale-review error or clean-policy adjustment clears confirmation and requires a new review before another launch attempt.

Unattended warning behavior is M11/M14's path: print final resolved warning/totals and continue without prompting. Screen tests do not substitute for that CLI integration.

## Boards, states and actions

| Exact board/state | Required content and action |
|---|---|
| Setup | Revision pin, saved/draft selector, distinct entries, judge, both weight sets, concurrency/trials, monitoring, display currency/tariff and totals even with one trial. |
| SetupInvalid | `.-invalid`, owner issues and fix keys, disabled review; preserve inputs and optional non-blocking limitations. |
| JudgePicker | Engine branch marks, independent harness/model/effort, rubric/capabilities; Use issues one `configs.set_judge`. |
| JudgeFallback | Same picker with exact skipped-branch reasons and engine fallback warning; no quality recommendation. |
| JudgeCapability (M12-owned) | Injected capability modal; M07 handles its Action result and preserves the draft; implementation stays in `judge_capability.py`. |
| ReviewLaunch | Effective configuration/adjustments, frozen-ready prices/rates, source/date, billing declaration labels, totals, digest and Copy CLI capability. |
| TrialBudgetWarning | M15 ConfirmScreen, title “More than 5 trials”, budget/subscription message, task-run and judge-session totals, Launch/Back. |
| LaunchRecord | Read-only redacted YAML, UID plus display label, full TrialRef roster, binding digest, original weights/prices/rates; Copy path only. |
| Parent states without separate boards | Loading, no entries, file/pin error, invalid trials, missing capability, stale review, no rate, failed launch and unavailable launch record. |

Use parent widget IDs `#entries-*`, `#validation`, `#dirty`, `#execution-pane`, `#judge-pane`, `#weights-pane`, `#preselection`, `#review-*`, `#launch` and `#resolved-yaml`. Wide is 120×40; compact is 80×24, retaining currency, provenance, totals and identity with scrolling.

Bindings remain parent `a/e/del/p/j/w/c`, configuration/preset/concurrency selectors, `ctrl+s`, Enter review, `ctrl+l` launch and Escape. Tests assert each accepted action's exact API call; cancelled prompts issue none. Copy CLI/path copies only engine-returned text/path.

Setup/Review subscribe to `configs.draft`, selecting the current draft key. Apply revisioned snapshots/upserts/tombstones with full `EventCursor`; replace on resync and ignore old generation events. Relevant edits/revalidation disable Launch pending refreshed review; discard leaves the editor. Ignore late workers from a previous draft/preview.

Render billing labels including “declared by user” for known and unknown declarations. Rate lines use units per USD, source date/retrieval date and “supplied by user” where returned. No analysis display-currency/rate selector exists; LaunchRecord cannot edit any frozen field.

## Acceptance and faults

```sh
pytest tests/tui/test_setup_viewmodels.py tests/tui/test_setup_screen.py tests/tui/test_judge_screen.py tests/tui/test_review_launch.py tests/tui/test_launch_record.py tests/tui/test_setup_subscriptions.py tests/tui/test_setup_navigation.py
```

1. Render every board/state through pure view-model tests and Textual Pilot at both sizes; exercise keyboard/mouse, focus, resize, scrolling and Escape. Check full totals, source/date/billing and UID/trial labels survive compact layouts.
2. Drive every edit/select/save/discard/judge/preset/navigation action once and assert exact call arguments. Returned invalid raw trials stay visible; no client normalization, fallback selection, total recomputation or currency conversion occurs.
3. Show four configurations, six trials, seven tasks: 168 task runs and 24 judge sessions. Launch opens warning; Back/Escape call nothing; Launch calls once with the exact digest. At five trials/all-local competitors the engine gives no warning and no modal appears, even with a cloud judge.
4. Change a draft/rate/preset while review or confirmation is open; reject stale confirmation. Delay A then load B and return A last; keep B. Clean-policy adjustments obtain a new digest/totals and cannot reuse earlier consent.
5. Test epoch change, replayed older revision, discard tombstone, queue overflow and unmount/remount. No discarded draft/old review returns; unmount issues no mutating command and engine restart restores persisted edits.
6. Render missing conversion, explicit unknown declarations, source failure, unresolved judge, clean-policy refusal and typed RPC error. The remedy remains visible, retries are scoped, and optional limitations/warnings do not disable launch. Assert the M12 factory receives template/judge context and each capability-modal Action produces only the documented navigation/revalidation.
7. Inspect two runs with the same display label and different UIDs/rosters; requests use UID and read-only text remains immutable. Failed `runs.launch`/`configs.launch_record` leaves a recoverable error state with no invented success.

## Real integration gate

Through real EngineClient/M07 and integrated M01/M04/M05/M06/M10/M12/M18 screens (including the real M12 capability factory and all four Action returns), save/restart/reopen, adjust setup, review and launch with M11. Compare frozen M02 records against the approved preview. Run the same YAML via M14 with six provider trials: stderr shows warning/totals, stdin is never read, execution continues; repeat all-local and five-trial exceptions.

**Pending parent obligations:** M07.1 transactional approval/deletion and M07.2 real bind/recovery/accounting gates; M15.3 full navigation; M14 CLI parity; M02/M17 frozen evidence. Wireframe owners must maintain the seven-board/state ledger, add immutable UID/provenance fields and verify totals/confirmation freshness at both sizes; this child does not edit wireframe source.
