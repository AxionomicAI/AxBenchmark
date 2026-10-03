# M15.1 — tui-foundation

Parent: [M15 terminal interface](../reference/modules/15-terminal-interface.md#1-engine-component). Requirements: R011, R038, R044, R047, R150; shared consent R031/R158. Findings: F15, F18; fixture contracts F02/F04/F06/F13.

Outcome: runnable shared widgets, pure presentation helpers and a fake-client screen harness, before feature engines or screens exist.

## Entry conditions

**Completed prerequisites:** Bootstrap package/test layout, published API schemas/registry, error envelope and M11 EngineClient/EventCursor/Subscription contracts from [ARCHITECTURE](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries). Authoritative ownership: M11 `axbenchmark/client/protocol.py` publishes EngineClient; `axbenchmark/api/events.py` publishes EventCursor/Subscription/EventEnvelope, with shared IDs/ActionState in `api/common.py`. Bootstrap publishes these contracts before M11.1 implements SocketClient/InProcessClient and M11.2 implements subscriptions. Their import smoke test must pass without feature adapters.

**Bootstrap contracts injected as fixtures:** feature DTO responses, capability flags, registered methods/topics/events and revisioned snapshots. No completed M11 daemon/scheduler, M01/M03 services, M15.2 shell or production feature screen is required. Do not replace published contracts with private DTOs.

## Exact proposed ownership

- `axbenchmark/tui/theme.py`, foundation section of `axbenchmark/tui/axbenchmark.tcss`.
- `axbenchmark/tui/viewmodels/common.py`, `format.py`, `glyphs.py`, `layout.py`, `run_list_detail.py`.
- `axbenchmark/tui/widgets/states.py`, `notice.py`, `pane.py`, `key_value.py`, `sha.py`, `searchable_log.py`, `run_list_detail.py`.
- `axbenchmark/tui/screens/base.py`, `confirm.py`, `prompt.py`, `file_view.py`.
- `axbenchmark/tui/ports.py`: UI-only host/subscription/navigation Protocols for base screens, implemented by a fixture host now and M15.2 later; EngineClient itself stays M11-owned.
- `axbenchmark/tui/testing/client.py`, `fixtures.py`, `harness.py`, `screens.py`; `tests/tui/fixtures/foundation/` stores owned DTO fixtures.
- `tests/tui/test_foundation_models.py`, `test_widgets.py`, `test_shared_modals.py`, `test_fake_client.py`, `test_screen_harness.py`.
- `tests/contracts/test_tui_imports.py`; add precise TUI rules to the Bootstrap import-linter configuration.

M15.2 adds lifecycle wiring to base.py; feature owners add their own screen/VM/style sections and fixtures. Do not create Library/Environment/Run placeholders in production screen modules.

## Interfaces and behavior

Use API/client boundary imports only. Pure builders accept API DTOs and return frozen display dataclasses; no Textual, I/O, client or engine imports. Re-export api.common.ActionState rather than define another capability schema.

The screen/client boundary passes public EngineError fields or API ErrorDTO to pure ErrorVM, preserving code/message/field/remedy/data without importing client error classes into viewmodels; ProtocolError keeps its numeric rpc_code separately. Namespaced application errors are decoded by the client from numeric outer -32000/data.code, never inferred from text.

Foundation helpers format engine-supplied values only: no money conversion, score calculation, trial resolution, eligibility, stop decisions or substituted unavailable values. RunUid/TrialRef/ResultId remain typed targets; run label/origin remain presentation.

StateSwitcher implements content/loading/empty/error with the parent's #x/#x-loading/#x-empty/#x-error IDs and Retry message. It accepts ErrorVM and an explicit retry action; retry cannot silently resubmit a write.

EngineScreen/AxModal establish typed host injection, fetch/render/actions/call seams, cancellation hooks and modal return values. The fixture host supplies subscription/load-token behavior for standalone tests; M15.2 implements the production lifecycle. The base never imports app.py or feature factories.

ConfirmScreen accepts ConfirmVM, starts focus on Cancel, returns False on cancel/escape and True only on explicit confirm. It issues no API call. Caller capabilities/warnings decide whether it appears; trial thresholds and model-call consent are not widget rules.

PromptScreen calls its injected submit(text) once, guards an in-flight submit against repeated Enter/click, and retains the form on typed error. Escape before submission calls nothing; closing during submitted work does not cancel its engine job. FileViewScreen renders supplied text/digest and copies it; never opens engine paths.

RunListDetail is an early presentation-only component: accept RunListDetailVM (stable row keys/labels/status, selected key, explicit scope display, detail rows, log lines/matches/state); emit Selected(key), Search(text), Page(after_seq), Action(name). Fixture rows test its compact layout without importing M11 run.py/run VM. M11.5 later maps its VM and handles these messages; M15.3 tests the real composition.

SearchableLog renders supplied lines/matches and emits search/page messages. The caller queries M05 with its explicit target; this widget owns no current-trial lookup or process input.

FakeEngineClient implements call/subscribe(topics, cursor: EventCursor | None)/close/connection_lost exactly. Validate requests/responses/events against Bootstrap registries. Record writes, reads, subscriptions and closes distinctly.

Test controls are respond, queue_subscription, defer_response and drop_connection from the parent. Fixtures include full subscription_id, epoch+seq, snapshot/replay mode, revisions/tombstones and stable entry IDs; malformed/unknown names fail early. No sequence-only event convenience path.

run_screen(screen_factory, client, size=(120,40)) constructs a fixture App with injected host and widgets using the same base constructor as production. Return its Pilot and recorded interactions; importing the harness cannot autostart an engine.

## Exact boards, states and callers

| Board/state | Foundation behavior and caller |
|---|---|
| DesignSystem, WidgetStates (M15-owned shared boards) | Feature children contribute fixtures only. Theme tokens, glyph+word, focus/disabled, loading/empty/error/content and retry; fixture screen renders every widget. |
| PromptSavePreset, PromptExportConfig, PromptExportCsv | Prompt shell only; M06/M07 callbacks save/export weights, M18 callback exports CSV through its public API. |
| TrialBudgetWarning | Generic ConfirmScreen fixture from M07's engine warning/totals; Back/Launch, no local threshold. M07 owns launch. |
| Verification consent / shared destructive confirmations | Generic confirmation from M03 verification_plan/M16 caller and owner-provided destructive data; zero calls on dismissal. |
| RunListDetail, RunListDetail-80x24 | Fixture-only rows/detail/log state and stable selection; no M11 RunScreen prerequisite. |
| Shared file viewer / log pane | Read-only contents, empty/error, search/matches and scrolling. Owning feature supplies exact scope/query. |

Render 120×40 and 80×24; breakpoint is w<100 or h<30. Keep modal buttons reachable and error/remedy visible. HelpKeys/CommandPalette are M15.2; actual RunListDetail/RunScreen wiring is tested by M11.5 and M15.3.

## Acceptance and faults

```sh
pytest tests/tui/test_foundation_models.py tests/tui/test_widgets.py tests/tui/test_shared_modals.py tests/tui/test_fake_client.py tests/tui/test_screen_harness.py tests/contracts/test_tui_imports.py
```

1. Import/run the fixture app with all feature adapters absent. Prove no engine startup, tmux, subprocess or private-store access; pure builders import no Textual and production imports no testing package.
2. Validate exact DTO/error round trips and unknown registry rejection. Distinguish application and protocol errors; retain field/remedy/UID/trial/currency/basis without reinterpretation.
3. Pilot every owned board at both sizes and boundary sizes; keyboard/tab/reverse-tab, click/buttons, wheel/log scroll and focus remain usable. Resize preserves entered text and selected log scope.
4. Confirm cancellation and escape make zero writes; confirmation returns once. Prompt rapid Enter plus click makes one submit; delayed errors preserve input and display mapped field/remedy. Disabled owner capability cannot submit.
5. Harness can deliver initial terminal job snapshots with immutable initial_progress separately from latest progress, replacement generations, lower-sequence new epoch and deferred stale query responses deterministically; test control outputs validate without a real scheduler.

## Real integration and pending parent work

An independent screen consumer can run these checked-in bases/widgets with FakeEngineClient; M15.2 must run them against real M11.1–2 before feature-screen integration. Foundation success makes no feature/provider claim.

**Pending parent obligations:** production connection/subscriptions/navigation/palette, real feature screens/UID launcher, real compact run integration, stop/report recovery and all M15.3 workflow/host gates. Foundation fixtures do not complete their feature owners' boards or consent workflows.
