# M03.2 — readiness-screens

Parent: [M03 screens](../reference/modules/03-environment-readiness.md#4-screens). Requirements: R029, R054, R067, R103, R137, R146, R150. Findings: M03 boards aligned; resolves F15 screen ordering and consumes F04/F05 subscription contracts.

Outcome: an implementer can deliver Environment/CollectorGuide views and guidance actions, keeping uncertainty visible and retained-data navigation usable without a harness. This is proposed client work, not evidence of implemented screens.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap; [M03.1](01-readiness-service.md); M15.1 `tui-foundation` and M15.2 `tui-shell` from the [foundation contract](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries). Reuse their widgets, modal base, subscription manager, navigation and focus restoration.

**Bootstrap-published contracts, allowed as injected fixtures:** M01 Library/Template identity navigation and capabilities; M04 Catalog entry; M18 MonitoringSettings→CollectorGuide handoff and verified guidance; M16 PlannerScreen's verification-plan/confirmation interaction; M14 doctor outcomes for parity. Their actual screens/CLI are real-integration gates, not entry dependencies. Inject navigation factories and schema-valid EngineClient responses; no private engine access.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/tui/screens/environment.py` (`EnvironmentScreen`, `CollectorGuideScreen`).
- `axbenchmark/tui/viewmodels/environment.py`, `axbenchmark/tui/styles/environment.tcss`.
- `tests/tui/test_environment_viewmodels.py`, `test_environment_screen.py`, `test_collector_guide_screen.py`, `test_environment_navigation.py`, `test_environment_subscription.py`.
- `tests/tui/fixtures/environment/ready.json`, `auth_failed.json`, `rechecked.json`, `offline.json`, `no_harness.json`, `collectors.json`, `revision_permissions.json`.

M03 owns these two screens even though CollectorGuide is drawn on M18's page. M18 owns the guidance content and the MonitoringSettings caller; M01 owns LibraryNoHarness, M16 owns PlannerScreen/"Verify now", M14 owns doctor and M15 owns global F2/navigation integration. Do not implement duplicate screens or confirmation logic in M03.

Use only the parent's API tables/bindings. `environment.report` and `environment.explain(ref)` supply text, provenance and `ActionState`s. View models format fields; they never infer authentication, convert cached information into verified access, recalculate readiness or decide whether a launch is safe. Keep engine-provided account, version, collector cause/scope and observation times visible.

On mount, use M15's `environment` snapshot subscription and follow each active `job:<job_id>`. Apply report revisions with the shared epoch/sequence cursor rules; changing a topic set starts a new handoff. On resync replace the report projection and rebind active jobs. Cancel stale explanation workers after row selection/unmount; removing a screen stops observation only. CollectorGuide shares the host's report subscription and reloads its selected explanation after report replacement.

## Boards, states and actions

| Exact board/state | Required view and action |
|---|---|
| Environment | Four harness rows plus runtimes/collectors, summary, model provenance, selected-row detail and F2 entry from the shared shell. |
| EnvironmentAuthFailed | Authentication rejection and its remedy; an installed executable still displays as installed. |
| EnvironmentRechecked | Current rows and before→after change toast only for this client's recheck; retain selection/focus. |
| EnvironmentOffline | Unknown authentication with last-known time, cached/bundled model source/age and available local facts. |
| EnvironmentNoHarness | Actionable plan/execute block and `still_available` data workflows; Escape returns to an operable library. |
| EnvironmentCollectors | All five distinct causes with scope/guidance; permission failure never suggests elevated AxBenchmark. |
| CollectorGuide (M18 artboard) | Cause, host, matching-platform commands, documentation, copy/open/recheck; mismatched-platform commands remain hidden. |
| Parent-defined states without separate boards | First-load spinner, query/job error with retry, in-progress recheck over retained rows, missing guide/copy actions dimmed, optional `#revision-permissions` warning and detail. No fabricated empty harness table: absence still has four rows. |

| Action | Required call/result |
|---|---|
| Environment `f5` or Recheck | One `environment.recheck(scope="all")`; follow its returned job. |
| `enter` / row detail | `environment.explain(ref)` for the selected row; late responses cannot replace another row. |
| `m`, `d`, `c`, `esc` | Catalog navigation, first guide, executable/guide/revision path copy, return respectively; respect returned action states and report failures. |
| CollectorGuide Recheck / `f5` | One `environment.recheck(scope="collectors")`; refresh the same explanation. |
| CollectorGuide copy/open | Copy only returned matching-platform commands or open its guide; never execute commands. |

## Acceptance and faults

Run:

```sh
pytest tests/tui/test_environment_viewmodels.py tests/tui/test_environment_screen.py tests/tui/test_collector_guide_screen.py tests/tui/test_environment_navigation.py tests/tui/test_environment_subscription.py
```

Use pure view-model tests and Textual `App.run_test()`/Pilot at 120×40 and 80×24 for declared wide/compact variants. Keep keyboard, mouse, focus, Escape, scroll and shortcut checks in the shared M15 harness.

1. Render every board fixture and parent-defined load/error/warning state. Assert exact rows, glyphs, summary and source/time text; offline/unknown/auth rejection never share a misleading ready label. A revision warning shows expected/found modes and the verbatim remedy without changing available actions.
2. Trigger every action once and assert only its documented client/navigation call. Disabled actions remain visible and dimmed. Recheck progress keeps existing rows; a failed recheck keeps the last report with the typed error/remedy. Missing guide, clipboard and opener failures show recoverable feedback.
3. Supply all five collector causes, absent commands and mismatched `verified_for`: copy/open states match returned actions, unsupported hardware has no install remedy, and no click runs setup or changes permissions.
4. Delay explanation A, select B, deliver B then A: detail remains B. Deliver an old report after a newer snapshot, reconnect with an old epoch and overflow a subscription: the screen retains only current state. Unmount during verify, remount and follow its job without resubmitting.
5. In a no-harness library/navigation fixture, F2 and Escape preserve browsing, ZIP import/export, saved results and report entry points while local plan/execute remain disabled. These fixtures exercise navigation calls, not fake claims that those real operations completed.
6. At the M16-owned confirmation seam, the plan lists exact harness names/versions and its budget statement; decline/Escape emits zero `environment.verify`, accept emits one consented request for the listed targets. M03 opening, row selection and recheck emit no verification request.

**Real integration gate:** repeat board transitions through M03.1 and the composed M01/M04/M05/M18 providers. Reach CollectorGuide from both Environment and real MonitoringSettings; return focus correctly. With no harness, complete real library/ZIP/saved-result/report workflows. Through real M16/M15 consent and M14 doctor, prove decline/noninteractive refusal calls nothing and explicit consent calls each selected harness once, with matching readiness outcomes.

**Pending parent obligations:** M03.1 real-provider/macOS/Linux gates; owning-module CLI, planner and launch integration; M15.3 cross-module navigation acceptance. Fake-client rendering, even for every board, does not complete M03.
