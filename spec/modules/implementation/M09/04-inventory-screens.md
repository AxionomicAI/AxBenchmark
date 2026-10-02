# M09.4 — inventory-screens

Parent: [M09 screens](../../09-default-inventory-benchmark.md#4-screens). Requirements: R008, R020–R028, R034, R046, R136, R149–R151. Finding: F11; canonical display separation from F01.

Outcome: implement the inventory views from published package facts, making phase targets and observation limits visible without adding a planner step. This is proposed screen work.

## Entry conditions

**Completed implementation prerequisites:** [M09.3](03-inventory-behavior-checks.md), M15.1 TUI foundation and M15.2 shell, including M11 engine/client foundations.

**Bootstrap-published contracts, allowed as injected fixtures:** M07 Setup navigation/configuration, M01 Library/Template/DefaultChanges screens and M08 evidence views. Publish the M01 CoverageDTO extension before screen implementation; a private fake-only field is insufficient.

## Ownership and boundaries

Own proposed `axbenchmark/tui/viewmodels/inventory.py`, inventory classes in `tui/screens/library.py` and `tui/screens/template.py`, and inventory selectors in `tui/styles/inventory.tcss`. Coordinate shared-file additive edits with M01's screen owner.

Own `tests/tui/test_inventory_viewmodels.py`, `test_inventory_screens.py`, `test_inventory_navigation.py`, `tests/tui/fixtures/inventory.py` and wide/compact screen snapshots.

Coordinate the parent's exact `checks-data.mjs`/renderer/navigation corrections and regenerated design previews with the design owner. M01 owns Library/default mutation flows; M08 owns check execution/evidence; this child renders immutable revision data only.

Do not read installed package data, local result files or historical README runs from the client. Consume `templates.contract`, `prompts`, `coverage`, `file`, `lookalike` through `EngineClient` and published DTOs.

## Boards and states

| Board | Screen/data | Required states |
|---|---|---|
| InventoryAbout | `InventoryAboutScreen`; contract rows, no planner | loaded/loading/error/retry, invalid built-in, configure disabled with reason |
| InventoryPrompts | `PromptsScreen`; all exact files in run order | loaded/loading/error, file selection, scroll/copy, long/non-ASCII prompt |
| InventoryChecks | `CoverageScreen`; 30 suite rows and detail | loaded/loading/error/retry, no checks, selected B/H check, long ids, unobservable explanation |
| InventoryVariant | `VariantScreen`; default/other comparison | loaded/loading/error, other unavailable, verified count/identity, no historical-result claim |
| Library | M01 entry integration | default built-in, older built-in, custom look-alike, `a` disabled on custom row |
| DefaultChanges | M01 upgrade integration | r2 available, existing results keep r1, no-results upgrade, explicit make-default capability |

The first four boards are M09-owned. Library/DefaultChanges remain M01-owned integration states; do not duplicate their commands/modal. Exercise 120×40 and 80×24 for every M09 state plus resize with focus/selection preserved.

## Concrete presentation contract

Pure view-model builders copy and format DTOs. They never compute identity/default status, reinterpret task coverage, infer unavailable results or parse the suite file to invent missing DTO fields.

About displays seven tasks, empty baseline, direct-file/native artifact contract, 30 checks and no planning requirement. Display edits do not change the frozen payload; the configure destination pins the selected SHA.

Prompts loads all UTF-8 strings once, preserves source text for display/copy, and swaps selected documents without API calls. Visual line wrapping must not mutate clipboard bytes. No editor, formatter or implicit revision creation belongs here.

Coverage consumes per-row requirement, phase/target, expected observation summary and evidence kinds; mixed R020/R021 rows under T1 retain their own requirement. Legacy `also_checked` is empty and has no visible claims panel.

Show `30 checks · 30 at task · 30 final (19 artifact, 11 history)`. At compact width split the bar, use Task/Check/Title table columns and selected-row `#check-detail` for remaining facts. All 30 rows are scrollable; do not truncate to the old 21-row height.

Selecting `T2_persistence` explains data-only observation with no T3 UI. Selecting `T4_commit` shows original task history in both phases and the distinction between readable missing commit (failed) and unavailable history (unverified).

Selecting T7 QA explains that competitor action evidence is needed; verifier-run browser success does not establish author QA. Left-open content lists unspecified fields/policies and “unobservable evidence is unverified, not an observed application failure.”

Variant derives default/other columns from M01 identity/lineage. Opening the other template passes its exact SHA; matching names/task counts never associate results. Old valid built-ins are not styled as look-alikes.

Library upgrade change lines come from M01's real descriptor/suite diff. Remove any example claiming T2 waits for rendered inventory. A revision's checks and counts stay pinned when the global default changes.

## Commands, errors and lifecycle

About `p`/`c` push self-loading prompts/coverage; enter/configure dismisses then opens M07 Setup with SHA and no planner. Escape closes/back; Tab/Shift+Tab move focus.

Prompts `c` switches coverage; `y` copies the selected unchanged text. Coverage `p` switches prompts; `o` makes exactly `templates.file(sha, suite_path)` then opens M15's read-only FileViewScreen.

Variant open-other dismisses and pushes M01 TemplateScreen with its returned SHA. Navigation itself sends no mutation. Footer, buttons and palette use the same capability/action source.

Each immutable screen loads in a worker with loaded/loading/error switcher; typed errors/reasons remain verbatim and Retry repeats only that query. Do not subscribe immutable revision views or fall back to stale text after load failure.

M01 owns the `templates` subscription for Library/default changes. Screen navigation preserves revision selection and does not reinterpret a historical package using today's default catalog.

## Acceptance and fixture corrections

Run `pytest tests/tui/test_inventory_viewmodels.py tests/tui/test_inventory_screens.py tests/tui/test_inventory_navigation.py` with Pilot keyboard/mouse/resize checks and pure-builder cases.

1. Every listed state renders at both sizes with all rows reachable, readable detail and stable focus. Long check ids/requirements do not clip; errors and disabled reasons remain visible.
2. Exact catalog/counts/phase targets match the API fixture. One unique suite has 30 rows, not 60; historical checks are never described as rerunning on T7. Prompt copy equals its input string exactly.
3. Assert navigation targets and exact query call counts, no planner/mutation calls, proper retry and suite-file errors. Library `a`, look-alike button and configure obey capabilities.
4. Synthetic Pi comparison: at-task failures `T5_remove`, `T5_persistence`, `T6_history`; final failures `T4_lookup`, `T5_remove`, `T6_history`; 27/30 each, one fixed and one regressed check. All seven commit checks remain explicit rows.
5. Separate fixtures show missing T4 commit still failed at final history, unavailable history unverified, passing T2 without management UI and missing-browser `T5_persistence`. Replace dotted check ids/log paths and use explicit task ids in design data.
6. r1/r2 default scenarios preserve both identities/counts and update only Library notice/current-default state. No historical repository run appears in result totals.

## Real integration gate

With real M01/M09 queries and M15 navigation, browse default → about → prompts → checks → file → configure, open a look-alike and inspect upgrade notice at both sizes without a harness. Then launch through M07/M11 and verify no planner invocation.

Compare real M08/M10 phase outcomes with catalog details, M02 retained results and M13/M17 consumers. Regenerate design previews from changed sources and verify catalog/target labels before parent sign-off.

**Pending parent obligations:** actual multi-trial runtime/finalization and cross-platform gates, real report/ZIP round trips and navigation-owner fixture reconciliation. A passing fake-client Pilot test is not evidence of these integrations.
