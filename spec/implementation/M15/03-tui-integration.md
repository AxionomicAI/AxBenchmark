# M15.3 — tui-integration

Parent: [M15 screen integration](../reference/modules/15-terminal-interface.md#4-screens). Requirements: R002, R011, R029, R031, R034, R038–R049, R135, R139, R149–R150, R153–R154, R157–R158. Findings: F02/F04/F06/F13/F15/F18; preserve all upstream retention/currency/identity corrections.

Outcome: the real feature-owned screens and UID launcher compose into complete TUI journeys, including compact runs, reconnect and durable stop/report outcomes.

## Entry conditions

**Completed prerequisites:** [M15.2](02-tui-shell.md); feature screen children M01.4, M02.3, M03.2, M04.4, M05.7, M06.2, M07.3, M08.3, M09.4, M10.3, M11.5, M12.3, M13.4, M16.4–5, M17.3 and M18.5 with their required engine children; M14.1–2 launcher/curated flows. See [development sequence](../DEVELOPMENT-SEQUENCE.md) and owning parents for real-provider gates.

**Bootstrap contracts still injectable for faults:** controllable process/collector/model outputs, clock and delayed query/job/retention responses. They support deterministic race testing but cannot replace real storage, dispatcher, lifecycle, finalization or screens at this integration gate. Unavailable supported-host verification remains explicitly pending.

## Exact proposed ownership

- Production owner-factory bindings in `axbenchmark/tui/screen_registry.py`; composition-only additions to `app.py` and `__main__.py`.
- Composition-only binding of M15.1 `widgets/run_list_detail.py` and its presentation VM to the M11 owner factory; the widget/style implementation remains M15.1 and caller handlers remain M11.5.
- `tests/tui/test_feature_routes.py`, `test_run_list_detail.py`, `test_cross_view_focus.py`, `test_feature_actions.py`.
- `tests/integration/test_tui_no_harness.py`, `test_tui_author_launch.py`, `test_tui_trial_navigation.py`, `test_tui_detach_reconnect.py`, `test_tui_stop_report.py`, `test_tui_exchange_report.py`, `test_tui_cli_launcher.py`.
- `tests/tui/fixtures/integration/` journey/fault fixtures; owner artboard fixtures remain in each feature package.

M11 owns run.py/run VM and maps them to the already runnable M15.1 compact presentation component; M05 owns run configuration/log views. M15 does not reimplement or broadly edit those screens. M14 owns launcher.py/CLI ports; bind the already published signature, flag owner defects rather than add private compatibility APIs.

M12 owns tui/screens/judge_capability.py (M07 calls its factory); M03 owns CollectorGuide even on M18's board page. M01 owns NewTemplateScreen/NewTemplateRepo in tui/screens/new_template.py; M16 supplies planning/capture calls and subsequent planner/editor screens. M17 owns all template/result ZIP screens and states in tui/screens/exchange.py, all VMs in tui/viewmodels/exchange.py, and widgets/zip_picker.py plus validation_order.py. M01/M02 supply only Library/Results entrypoints through injected factories, with no exchange dialog fragments; M02 owns ReportReady, M13 its generation/progress. Factory registration never transfers screen ownership.

## Composition and scoped navigation

Register Library(M01), Environment(M03), Setup(M07), Run(M11) and Results(M02/M06), plus their documented owner factories. Run Help/palette/global key routes through the same owner actions; disabled reasons and registry safety remain intact. M15 owns shared CommandPalette/WidgetStates; feature children contribute entries/providers and fixtures only.

Bind main(*, attach: RunUid | None) -> int to M14 TuiLauncher exactly. CLI resolves RUN_REF first with results.resolve_run; launch passes LaunchResult.run_uid. The TUI only calls runs.status on that UID and observes it. No label parsing, repeat launch or engine/private-store import.

Use RunUid keys for rows, subscriptions and reports; display run_label plus origin, with UID available for collisions. Historical configuration/evidence/check/log paths always pass TrialRef or ResultId. Live-only entry resolves active trial and receives its explicit TrialRef before opening a historical-capable detail screen.

RunListDetail renders #lane-list(width 26), #detail, #lane-detail, #log-search and #log from M11 VM; no #lanes-table. It emits selected-configuration/task, search/page and navigation messages to M11 RunScreen. API calls remain in the screen, never the component.

Wide #lanes and compact #lane-list share one selected RunUid/configuration/TrialRef/task target. Resize 120×40 ↔ 80×24 changes presentation without recomposition; map hidden-widget focus to its visible counterpart while row, trial/task, scroll and active log query survive.

For compact log selection/search, RunScreen calls harness.task.log(target, task_id, limit=500, query?, after_seq?). Accept the returned resolved scope; filter appended lines by trial/task/invocation. after_seq is a task-log page position, not event resumption. Out-of-order query responses are rejected by M15.2 scope/epoch/load tokens.

Enter opens M05 RunConfigScreen(target), v opens M11 passive HarnessLiveScreen, s/S open configuration/run StopScreen with separate returned capabilities, d opens DetachScreen. Search submit issues one read; n only advances supplied matches. No action sends harness input or changes frozen setup.

M15.2 remains the sole hub: full epoch+seq, S-before-snapshot, newer revisions/tombstones, replacement generations and event-only owner re-query. Screen integration may not install direct/private subscription paths or sequence-only caches.

## Durable outcomes and action gates

Render engine can_stop_run through judging/finalizing/retention_pending, separately from disabled completed-configuration can_stop. StopScreen revalidates via runs.stop_preview and one confirmed runs.stop; lifecycle changes between preview/command surface typed errors verbatim.

StoppingScreen follows the matching durable stop_id in snapshots/events. Cleanup completion is separate from retention readiness; pending/error never appears completed. Stop during judging preserves completed reviews and remaining-not-judged reasons supplied by engine.

Watch jobs from initial snapshots and owner status after missed events/resync/cache expiry. Watched launches consume durable JobStatus.initial_progress (first final-preparation LaunchStep), separately from latest progress, before terminal handling and after engine restart. Recover engine totals/warning once per job ID per app instance using a shown-job set outside subscription reset state; never repeat launch or prelaunch consent. M14 uses the same durable source/dedup contract. Run report waits use RunStatus.retention/completion_report and reports.status; written/succeeded, failed, cancelled, skipped or typed pending error each resolves the local wait and shows its path/reason as returned. No additional model call or repeated navigation.

q, detach dialog, unmount and terminal close only release subscriptions/client. Engine work survives; frozen inputs, measurements and process invocation counts stay unchanged. Explicit cancellation belongs solely to the owner action; closing report/planning views is not cancellation.

## Exact board/state integration matrix

| Boards / owner | Integration obligation |
|---|---|
| Library, LibraryNoHarness, LibraryDrafts, Environment, CollectorGuide (M01/M03) | No-harness gate only model-dependent planning/execution; manual authoring/capture/approval and browse/import/saved-report remain reachable, readiness recheck updates via shell. |
| Catalog, CatalogOverride, CatalogRates and BillingScreen states (M04) | Route to owned catalog screens; model/account saves stay separate, currency units per 1 USD and billing provenance are engine text/data. |
| Setup, ReviewLaunch, TrialBudgetWarning, JudgeCapability (M07/M12) | Correct owner route and engine totals/reasons; consent Back/escape makes zero launch/verify calls; confirm once. |
| NewTemplate, NewTemplateRepo, NewTemplateInvalid (M01) | M01 NewTemplateScreen calls M16 inspect_target/create_manual and opens M16.5 manual progress/review; only explicit planner generation uses defaults/create_request and M16.4. |
| PlannerVerify, PlanningProgress, PlanReview, PlanApprove (M16) | Verification consent, planning progress/edit/approval handoff; inventory/approved reuse makes no planning call. |
| RunOverview, RunReattached, RunListDetail, HarnessLive/Streaming/Limited (M11/M15) | Six registry lanes/adaptive list-detail, trial-pinned logs, passive unavailable/source labels, detach/reconnect and interrupted offscreen reason. |
| StopConfirm, StopCleanup, ActiveLocked, Judging/JudgingDone (M11/M12) | Completed configuration versus run stop, judge cleanup, finalizing/retention pending/error, preserved frozen inputs. |
| ResultsTrials, TaskChecks, EvidenceViewer, MeasurementsTrials, RankingsTrials (M02/M08/M10/M06) | Distinct TrialRef/ResultId navigation during later live trial; engine measurements/currency/judge-group eligibility unchanged. |
| ExportTemplate, ImportTemplate, ImportVerifying, ImportRejected, ImportDuplicate, ImportUnsafe, ImportIncomplete (M17) | All screens/states use M17 exchange.py/VMs/widgets; M01 Library/Template routes via injected factories. Verify validation, rejection and export return navigation. |
| ResultPackagePick, ResultPackage, ResultImport, ResultImportConflict, ResultMismatch, ResultEmbedded, ExportResult (M17) | All result ZIP screens/states use the same M17 ownership; M02 Results is an injected entry/return destination only. Preserve UID/origin separation, explicit selection and atomic rejection. |
| ReportGenerate/Defaults, ReportProgress, ReportReady (M13/M02) | Durable failure/cancel/skip/pending/committed-path states and expired-job recovery; offline retained generation without models. |
| HelpKeys, CommandPalette, WidgetStates (M15) | Every real route, disabled reason, keyboard/mouse parity, wide/compact focus and reconnect state. |

Compose M02 Results/M10 Measurements primary statistic columns and scoped detail → M06 eight-factor editor/breakdown → M07 preset/freeze and M13 report handoff using the same complete engine plan and measurement DTOs. Five new factors default to zero; explicit higher/lower and selected policy are required when enabled. Preserve pooled generation N/D/ranges, count means, independent Files/LOC/detail availability, source limits and baseline-included labels through resize, filters, reconnect and imported data. M15 only wires owner views; shared widgets cannot implement metric aggregation or scoring.

**Frozen domain contract.** Compose all six frozen-family journeys through existing owner screens and API factories: author/approve, setup capability/target review, scoped verification/evidence, shared judging validation, rankings/report and inert exchange. Preserve rubric refs/category/comment meanings and coverage/modality/mode through navigation; a generic modality error opens M12 capability UI while domain verifier prerequisites open M03. No shell-owned alternate validator or family switch.

**Route, comparison and profile interfaces.** Compose the owner screen factories for M04 access/existing profiles, M03 targeted diagnostics, M07 comparison review and M06/M13/M17 retained evidence. Preserve owner DTOs, EventCursor/revision and typed ActionState; shell adds no model/effort fallback, alias evaluator or dispatcher. Navigation from a matrix cell carries exact harness/role/profile ref and returns to the same draft revision for revalidation; stale child results cannot overwrite edited selections.

## Integrated requirements

R192, R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R189 — [human review](../M12/05-human-review-web.md).

R184, R185, R186, R187, R188 — frozen domain profile/evidence contracts: [R184](../quality-judges/BACKEND.md); [R185](../quality-judges/MOBILE.md); [R186](../quality-judges/DEVOPS.md); [R187](../quality-judges/AGENTIC.md); [R188](../quality-judges/SPECIFICATION.md).

R173, R174, R175, R176 — [benchmark statistics](../BENCHMARK-STATISTICS.md).

R166, R172 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

R181, R182, R177, R178, R179, R180, R183 — [benchmark modes](../BENCHMARK-MODES.md); [Cursor](../M05/08-cursor-adapter.md) and [OpenCode](../M05/09-opencode-adapter.md) registry contracts.

Compose M01 exact-prompt/ordered-spec entry → M16.1 current-folder capture → M16.3 approval → M07 freeze → M11 task loop for both modes and empty/populated targets, without requiring a planner screen/harness for manual work. Keep seven project domains visible. Test sourceChanged/no-admitted-files/recapture, source-removed approved reuse, locked commit policy and M08 scoped pending/missing/dirty/unverified evidence using real owner APIs.

All six registry harnesses, their version/generation reasons and same-harness queued entries remain reachable in 120×40 adaptive lanes and 80×24 list/detail. Retain sixth-entry focus/trial/task/log scope on resize/reconnect, and keep explicit jobs=4/5 distinct from the registry default. Missing Git blocks execution while authoring survives; no interface adds a planner, fix task, commit or model call.

Register M07.3 DecisionEnginesScreen and M10.3 ContextDetail through existing feature navigation factories, retaining the four root destinations. Wire Environment/Catalog/setup remedies to the former and HarnessLive/retained Measurements to the latter with exact ResultId/TrialRef/invocation/session/agent/window and analysis pin. Shared SubscriptionHub uses registered measurements events and generation replacement; no inferred topic or engine arithmetic. Cross-feature tests retain disabled setup reasons, partial native data and local deferred/resource-unknown states without disabling unrelated harness/human/native workflows.

**Human end-to-end journey:** Bind M07 Human picker → M11 post-seal Awaiting human review → M12 progress/reopen/stop/detach → M12.5 trusted browser form → M02 retained review → M06/M13/M17 inspection. Add wide/compact pending-empty/draft/save failure/conflict/submitting/storage-pending/submitted/ungraded/skipped/cancelled/invalidated/recovered/opener-failure states. Only explicit reopen invokes judging.human.reopen; attach/navigation/resize never mints credentials, starts inference or settles a case. Assert unrelated runs proceed with zero held automated resources, original report stays deferred, and additional reviews leave completed originals intact. Browser grades use the owner validator; the TUI/shell adds no form or scoring logic.

## Acceptance and faults

**Route/profile acceptance:** Cross-feature wide/compact journeys cover explicit static inspection→registration→selection, ordinary inherited unknowns, strict blocked mapping, partial matrix, diagnostic consent/cancel and retained inert imports; ensure navigation/back makes zero model calls.

**Domain acceptance:** Exercise backend text, native matrix gaps, DevOps plan-only, bounded agent modes and document-only flows with real owners at both sizes; imported retained evidence and profile inspection make zero model or artifact calls.

Extend cross-view journeys at 120×40 and 80×24: capture two full trials, retain/export/import, inspect all four primary columns, enable each new factor/direction, reject unset direction, save/reload/reset/export, then open the offline report. Compare engine Fraction/production BigInt references/contributions/order; unknown disabled extras preserve legacy scores and missing positive factors identify full failing TrialRefs. Include same-label UIDs, file-known/LOC-unknown, delayed timing/inventory writes and no decision configuration/inference.

Extend existing fixtures for native-only and delayed/partial analysis, explicit local overlap/unknown attribution, distinct decision/harness/human fingerprints and offline or disabled-engine operation as applicable. Assert unchanged scope/digests, no fabricated values/calls, and no reclassification triggered by viewing, export/import or navigation.

```sh
pytest tests/tui/test_feature_routes.py tests/tui/test_run_list_detail.py tests/tui/test_cross_view_focus.py tests/tui/test_feature_actions.py tests/integration/test_tui_no_harness.py tests/integration/test_tui_author_launch.py tests/integration/test_tui_trial_navigation.py tests/integration/test_tui_detach_reconnect.py tests/integration/test_tui_stop_report.py tests/integration/test_tui_exchange_report.py tests/integration/test_tui_cli_launcher.py tests/contracts/test_tui_imports.py
```

1. Real storage/dispatcher and owner screens complete seven-domain, one-shot/multi-step author-or-reuse → configure → launch → observe → evidence/results → ZIP/HTML journeys. No-harness import/report and approved-template reuse make zero model/planner calls. Verify existing repository source remains unchanged.
2. Pilot all matrix routes at both sizes with keyboard/tab, palette, click/double-click and wheel. Six-harness and selected-subset resize preserves scope/focus/scroll; log search submits once. Assert NewTemplate routes to M01, every ZIP screen/state to M17, and shared palette/state infrastructure to M15; preserve injected Library/Results entry/return routes. Shared warnings/consent and stop cancellation make zero writes; confirmed actions submit once.
3. Run two trials with differing T1 logs/evidence while trial 2 is active; retained trial 1 stays selected. Import same-label/same-config runs from two origins; navigation, means/reports/exports never merge UIDs. Delay old queries across target/epoch switches and assert no stale data/error.
4. Through actual client/daemon, inject snapshot interleaving, older object revisions, deletion/recreation, duplicate log IDs, compaction, overflow and low-seq fresh epoch. Old generation events cannot regress screens or duplicate notifications/navigation.
5. Stop during active judging/finalization and failed-retention recovery with configurations completed. Verify actual cleanup and durable stop/review/retention/report status; no success-only wait hangs, no sealed facts are reopened, disabled config stop issues no command.
6. Drop connection after report completion, expire generic job cache and recover succeeded/failed/cancelled/skipped/pending states. Recover watched launch initial_progress after completion/cache expiry/restart and replay/resync: final warning appears once with engine totals, with no repeated consent/launch. Close/reattach during tasks and jobs via real process tests; same invocation counts/pids and no silent restart. Terminal close sends no stop/cancel.
7. Exercise M14 bare, resolved-UID attach, ambiguous RUN_REF and launch-to-TUI paths. Return correct exit/error behavior, no duplicated launch, no import-cycle/private file access. Validate every screen request/topic against the registry.

## Real gate and pending parent work

Require real owned services, persistent finalization/retention, M11 Unix-socket lifetime and process cleanup, plus actual Textual owner screens. Deterministic provider fixtures prove races; separately record supported macOS/Linux harness and collector checks and unavailable hardware limitations. Do not mark parent complete from fixtures alone.

**Pending parent obligations:** any failed provider gate and the parent's named board/ledger changes (UID/origin, trial scope, finalization/stop/report pending/reconnect). This child does not edit wireframes; M15 CommandPalette/WidgetStates and launch-recovery variants, M01 NewTemplate variants, and all M17 exchange.py/VM/widget legends with navigation-only M01/M02 entrypoints must be reflected in their ledger and regenerated by their owners before visual acceptance.
