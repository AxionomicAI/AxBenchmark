# M01.4 — library-screens

Parent: [M01](../reference/modules/01-template-library-identity.md#4-screens). Requirements: R002, R018, R019, R030, R067, R136, R149, R151. Findings: F17; F15 foundation ordering.

Outcome: users browse and inspect revisions, initiate owning-module workflows, and approve or refuse destructive actions through the same engine capabilities in wide and compact terminals.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M01.3](03-library-service.md), M15.1 `tui-foundation`, M15.2 `tui-shell`. Use their real fake-client harness, shared widgets/navigation and subscription lifecycle; no private substitutes.

**Bootstrap-published contracts, allowed as injected fixtures:** M02 result routes/DTOs, M03 environment routes, M07 Setup/configuration routes, M09 inventory-inspection routes, M16 planning/editor routes, M17 exchange routes, M11 run/launch routes. Their screens/services need not be implemented for navigation tests; route targets and parameter shapes must already be published. M14 implements CLI independently.

## Ownership and contracts

Own proposed files:

- `axbenchmark/tui/screens/library.py`, `template.py`, `new_template.py`, `revise.py`, `launch_check.py`.
- `axbenchmark/tui/viewmodels/library.py`, `template.py`, `new_template.py`, `revise.py`, `launch_check.py`.
- `axbenchmark/tui/commands/library.py`, `axbenchmark/tui/styles/library.tcss`.
- `tests/tui/test_library_screen.py`, `test_template_screen.py`, `test_new_template_screen.py`, `test_revision_screens.py`, `test_library_deletion.py`, `test_launch_check_screen.py`, `test_library_viewmodels.py`.

M15 owns `ConfirmScreen`/`PromptScreen`, app shell, central command-provider hook and route registry. Register this feature through those hooks. `CommandPalette` and `WidgetStates` are shared M15 shell/showcase boards: M01 contributes library command entries and library widget-state examples only, not their global implementation. **M17 owns `tui/screens/exchange.py` and exchange view models**, including Import/Export states drawn on the M01 canvas; this child implements only navigation to them. M16 owns planning/editor/review screens; this child owns NewTemplate, Revise and ApproveRevision entry dialogs. No filesystem, hashing, mode changes or account checks belong in these screens.

The parent's bindings/widgets and `templates.*` DTO tables define the contract. Engine `ActionState` controls buttons, keyboard and palette consistently. Initial/reconnect subscriptions use M15/M11's typed snapshot/cursor contract; view models cannot infer unobserved capability changes. Selecting a new row discards stale detail responses, so a deletion effect/token always belongs to the currently selected SHA.

## Wireframe/state coverage

Use [navigation](../reference/design/wireframe-tui/navigation.md) and the parent board contracts:

| Owned states or explicitly shared contributions | Required interaction |
|---|---|
| Library, LibraryDrafts, LibraryUpgrade, LibraryLookAlike, LibraryLoading, LibraryEmpty, LibraryError, LibraryNoHarness; library CommandPalette entries | Template Enter→M07 Setup; `o`→Template; draft Enter→M16 reopen. Display engine notices/counts, preserve selection/filter. |
| TemplateTasks, TemplateIdentity, TemplateConfigs, TemplateResults, RevisionSaved; library WidgetStates examples | Lazy tab fetch, full SHA copy, identity verification/restore, lineage rename and revision selection. |
| NewTemplate, NewTemplateRepo, NewTemplateInvalid, Revise, ReviseActiveRun, ReviseConfirm, ReviseIdentical | Field errors, repository validation, nonblocking active-run warning, canonical preview/duplicate refusal and open-existing action. |
| DraftDiscard; required additions RevisionDeleteConfirm/Builtin/ActiveRun/HasResults/Changed/Pending | Context-sensitive Delete/palette label. Confirm current effect/config count/lineage removal; default focus Cancel. Refusal reasons remain visible; race response refreshes state and requires new confirmation. |
| LaunchCheck, LaunchMismatch | Follow existing launch job, show both full digests/paths; restore or seed revision; cancel through owner. |

ImportTemplate/ImportVerifying/ImportRejected/ImportDuplicate/ExportTemplate are M17-owned states, governed exclusively by [M17 §4](../reference/modules/17-zip-exchange.md#4-screens). This child tests only injected `ExchangeScreens.import_template(selected_sha256?)` / `.export_template(sha256)` arguments, typed returned outcomes and Library/Template refresh; no picker, package-kind routing, exchange widget or view-model implementation belongs here. Wireframe source/preview modifications belong to the separate navigation refinement; required additions are explicitly listed above and in the parent.

## Acceptance and fault checks

Run `pytest tests/tui/test_library_screen.py tests/tui/test_template_screen.py tests/tui/test_new_template_screen.py tests/tui/test_revision_screens.py tests/tui/test_library_deletion.py tests/tui/test_launch_check_screen.py tests/tui/test_library_viewmodels.py` at 120×40 and 80×24:

1. Load every owned state, keyboard through all visible actions, resize mid-dialog and preserve selected SHA/filter/tab. Loading, no match, partial index error and no-harness notices do not hide browsing or saved results. Stale row-detail response cannot update the new row's Delete action.
2. Draft Delete confirms then sends exactly one `planning.discard`; template Delete confirms current effect/token then exactly one `templates.delete`. Cancel/Esc send zero mutations. Builtin/active/result/pending cases dim both binding and palette with the same reason. Race refusal keeps the row, shows engine message/remedy and refreshes; changed plan requires a second confirmation.
3. Approval retains preview `version` and sends it as `base_version`; a `planning.draft_conflict` reloads the preview and requires a fresh user approval, never an automatic retry. Identical approval disables keyboard/button/palette approval and opens the existing revision without discarding the draft. Active-run warning allows editor navigation. Rename issues one call and leaves full SHA unchanged. Lazy tabs do not issue duplicate loads on pure focus changes.
4. A scripted identity-mismatch launch shows approved/computed SHA and paths; Restore and Save revision each call their documented operation once. Reconnect/resync reloads authoritative state, and published deletion of the selected revision returns to Library without repeating deletion.
5. Pure view-model tests verify capability mapping and SHA formatting. Shared palette/showcase tests assert only library contributions and retain M15 ownership. Fake-client navigation checks assert exact route arguments for M02/M03/M07/M09/M11/M16/M17. For exchange, verify selected SHA or no SHA, `ImportOutcome`/`Path`/`None` handling, post-publication count refresh including `results.import.registered`, and no duplicate TemplateScreen push or direct exchange API call from M01; no provider implementation or process launch is inferred from route success.

**Real integration gate:** M15.3 composes these screens with actual M07/M16/M17 destinations and M01.3 service; complete create/approve/configure/reopen/import/export/delete and no-harness browsing journeys using real API connections, including reconnect during publication. M14 separately verifies delete `--yes` handling and engine-supplied plan tokens.

**Pending parent obligations:** real canonical producer/parser/workspace/exchange gates from M01.1–M01.3, built-in planner-free execution, run identity invalidation, and full macOS/Linux integration. Child screen snapshots alone cannot close those obligations.
