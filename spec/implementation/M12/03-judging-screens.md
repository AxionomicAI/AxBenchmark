# M12.3 — judging-screens

Parent: [M12 judging views](../reference/modules/12-quality-judging.md#4-screens). Requirements: R033, R035, R046, R077, R082–R091, R139, R144, R150, R153–R154. Findings: F06, F09, F13; shared F02/F04/F15/F18.

Outcome: view independent judging progress and retained reviews, profiles, capability failures and explicit additional rejudge entry without running assessment logic in a client.

## Entry conditions

**Completed implementation prerequisites:** [M12.2](02-judging-worker.md), M06.1 scoring, M15.1 tui-foundation and M15.2 tui-shell from the [foundation contract](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries). Reuse client, workers, typed subscription manager, modal/navigation factories and wide/compact harness.

**Bootstrap-published contracts, allowed as injected fixtures:** M02 ResultReviews/RejudgeScreen, M07 JudgeScreen/Setup, M08 EvidenceViewerScreen/JudgeInputScreen, M04 OverrideScreen, M06 ScoreBreakdownScreen/WeightsScreen and M11 RunScreen/stop/report statuses. Full consumer screens are real integration gates, not duplicate ownership here.

## Exact proposed ownership

- `axbenchmark/tui/screens/judging.py`: JudgingScreen, ReviewScreen, UngradedReviewScreen, ProfilesScreen.
- `axbenchmark/tui/screens/judge_capability.py`: JudgeCapabilityScreen and Action result; integrate via M07's injected factory without owning setup.py.
- `axbenchmark/tui/viewmodels/judging.py`, `judge_capability.py`; `tui/styles/judging.tcss`, `judge_capability.tcss`.
- Add these feature factories through the existing M15 navigation seam; no duplicate app shell/client/subscription implementation.
- `tests/tui/test_judging_viewmodels.py`, `test_judging_screen.py`, `test_review_screen.py`, `test_ungraded_review.py`, `test_profiles_screen.py`, `test_judge_capability.py`, `test_judging_navigation.py`, `test_judging_subscriptions.py`.
- `tests/tui/fixtures/judging/`: all named boards plus schema-valid loading/empty/error/stop/recovery/identity and same-label RunUid fixtures.

M02 owns RejudgeScreen and ResultReviews. M07 owns judge preselection/picker/setup. M08 owns evidence views, M06 weights/calculation/breakdown, M11 run stop and M14 CLI. Coordinate narrow factory additions with those owners, never reimplement their views.

Render `CurrentSessionDTO.execution` by its actual backend: harness InvocationId/PID/activity; decision immutable profile/version, logical assessment/DecisionCall IDs, queue/batch/lease progress and separate cost. Human pending case/form state comes from PendingHumanCaseDTO with current=None. Decision HTTP work has no process/history panel. Machine ReviewDetail retains native answers/distribution/confidence semantics, accepted/rejected reasons, evidence coverage and code-composed commentary provenance. Unknown cost/confidence is explicit. Decision capability errors link to M07.3 setup; harness/human review and saved reads remain available without a decision engine.

## APIs, identity and subscriptions

JudgingScreen accepts exactly one batch_id or run_uid and loads judging.status. Every row retains ResultId/TrialRef and frozen trial_count; RunLabel/origin are display metadata. No selection falls back to newest/current trial when a retained result is selected.

Subscribe to judging, harness and results through M15's full EventCursor manager; filter batch, invocation scope and RunUid/ResultId/TrialRef. Apply revisioned snapshots/upserts/tombstones and replacement generations; late older worker results cannot replace current selection.

Review bytes are immutable, but run invalidation changes eligibility/capabilities. ReviewScreen observes results.run.invalidated and reloads the projection, preserving the original grades with the interrupted/non-comparable notice. No UI mutation of raw review or template binding.

Pure view-model builders format engine grades, Q, anchors, costs, limitations and ActionState.enabled/reason. They never validate half-points, select screenshot input, calculate weights/quality, infer capability or decide comparison eligibility.

`None` raw_response disables raw action; missing/partial cost renders unknown/so-far with engine provenance, never zero. Non-graded review has no computed Q. Review text is inert data, never a markup/executable instruction surface.

## Exact boards and states

| Board/state | Required content and actions |
|---|---|
| Judging | Sequential anonymous artifact rows; backend-tagged current assessment or pending human cases, admitted/withheld input summary, separate judging cost/applicability and stop capability. |
| JudgingDone | Durable finished counts, graded/ungraded/failed/not-judged rows, validation notice and retained review actions; no implied retry. |
| JudgingTrials | Trial index/count per row, exact ResultId/TrialRef selection, distinct sessions and per-trial cost/outcome; no collapsed trial grade. |
| ReviewUngraded | Engine deficiencies by category/field, returned grades, kept comments/limitations/raw response and explicit scoring consequences. |
| ReviewDetail | Category grades/anchors/evidence, engine-computed Q under original weights, three comment sections, limitations, judge group and backend-specific separate cost/applicability. |
| RubricProfiles | All six profile families with their versioned six-category definitions/defaults, active frozen rubric/version/digest and evidence requirements, scale/anchors and navigation to M06 quality weights. Historical versions render as recorded. |
| JudgeCapability | Unsupported/unknown inspection or readiness evidence/source, template requirement and choose-judge/catalog-override/back actions; no silent substitution. |
| Parent states without separate boards | Loading, waiting/empty, typed error, queued, settling, persistence-pending error, stopped, interrupted/engine-lost, invalidated, missing artifact/raw response and partial cost. |

Use parent's widget IDs #judging-bar, #reviews, #current, #inputs, #ungraded, #open-ungraded, #grades, #comments, #review-meta, #validation, #kept, #consequences, #profiles and #judge-capability; ContentSwitcher states preserve focus and Retry.

Render every board at 120×40 and 80×24. Compact hides current-session pane but retains all row identities/trial labels, outcomes, input limitations and accessible scrolling/actions. Resize must not change the selected result or issue work.

## Bindings and navigation

Enter opens ReviewScreen for graded or UngradedReviewScreen for ungraded/failed retained review_id, from engine can_open. A diagnostic not-judged record remains inspectable when it has retained evidence; an absent review never produces a fabricated ID.

`p` opens ProfilesScreen; `d`/detach only unsubscribe/pop. `s` uses M15 ConfirmScreen then one judging.stop(batch_id). RUN routes to M11 run stop and shows settling/retention/report status; REJUDGE cancels only the additional job. Cancellation of the modal issues nothing.

Review `e` opens M08 evidence from exact refs; `b` opens M06 ScoreBreakdownScreen(result_id, judge_group) only if allowed; `r` opens retained raw response only if can_raw. Escape pops/dismisses without a mutation.

Profiles `w` opens M06 WeightsScreen in analysis context; M12 applies no weights. Capability `j`/choose returns CHOOSE_JUDGE, override returns OVERRIDE_CATALOG, back returns BACK; parent setup revalidates. If recheck becomes usable, return RECHECK.

M02's explicit RejudgeScreen displays selected judge/group/session contract/cost estimate and creates one judging.rejudge job after its own confirmation. M12 status observes that batch/job; merely opening any screen/imported review starts no model work.

Runs remain stoppable during original judging while completed configuration stop is disabled. Use returned capabilities and stop result, never infer these gates from a spinner or session PID. Report waits are M11/M14 status consumers, not a screen-owned loop waiting only for success events.

**Frozen domain contract.** Judging/Profiles/ReviewDetail/ReviewUngraded/Capability view models use frozen ProfileDTO comment_axes and category order plus input plan/coverage/modality fields. Show exact version/digest and separate groups, native matrix/build gaps, backend data/recovery, DevOps modes, agent case modes and supplied/candidate document roles. Specification code_quality is technical-design maintainability; developer_experience is implementer usability. Family/default browsing does not retarget a retained review or waive evidence.

Judging input summaries and human reopen navigation expose the M12.1 admitted anonymous projection only; competitor variant/lineage/creator/date/proof fields cannot leak via rows, links, filenames or form parameters. Retained ReviewDetail may inspect the automated judge's own role-separated variant evidence/group fingerprint; Human shows reviewer/form-policy identity and no model fields. Builder variant details belong to Results outside the assessment input surface.

**Route, comparison and profile interfaces.** Extend harness JudgePicker/JudgeCapability/ReviewDetail VMs with independent profile/route/mapping selection and declared versus qualified/effective evidence using `configs.set_grading_selection` and `judging.check_judge`, plus M04 profile factories. Profile choice is never copied from competitor cells; Human/System One own independent identity/readiness. Review detail shows the current JudgeGroup treatment and its usage, while anonymous artifact/evidence payloads exclude competitor aliases.

## Integrated requirements

R192, R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R189 — [human review](../M12/05-human-review-web.md).

R184, R185, R186, R187, R188 — frozen domain profile/evidence contracts: [R184](../quality-judges/BACKEND.md); [R185](../quality-judges/MOBILE.md); [R186](../quality-judges/DEVOPS.md); [R187](../quality-judges/AGENTIC.md); [R188](../quality-judges/SPECIFICATION.md).

R170, R172 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

**Human presentation acceptance:** At both sizes, `PendingHumanCaseDTO` with current=None displays Awaiting human review, pending/draft/submitting counts, durable save/version or storage error and `can_reopen_human`. `o` calls `judging.human.reopen(human_batch_ref)` once; status/resync never opens a browser or mints credentials. Cover opener failure, stale/conflict, restored pending, submitted/ungraded/skipped/cancelled/invalidated and accepted-intent drain during stop. A 202 stays Submitting; only the M02 receipt enables review detail. Browser/tab/credential expiry and TUI detach settle nothing. Trusted review detail labels self-declared reviewer and form policy, human-authored comments, model cost not applicable and labor unmeasured; no PID/model/confidence panel.

## Acceptance and faults

**Route/profile acceptance:** Fake-client profile conflict/stale/unknown cases preserve draft choice; choosing a ready OpenRouter/LiteLLM profile cannot enable decision grading/classification, and Human requests no API profile.

**Variant acceptance:** Seed unique variant/creator/date/provenance sentinels at every nested input/manifest/label/URL layer across all six rubric families and all three backends; assert absent from automated requests and human case JSON/DOM/evidence metadata while legitimate artifact model terms remain readable. Automated judge identity stays role-separated and human schemas reject model fields.

**Domain acceptance:** Extend both-size fixtures across six families, all backend tags, missing required modality and partial coverage. No web category alias, fixed fourth-column business gate or always-code label appears; all reads remain model-free.

Add wide/compact fixtures for both automated execution variants plus separate PendingHumanCaseDTO, deferred/resource-unknown decision calls, low-confidence ungraded review, missing raw answer and saved offline review. Assert explicit selection plus READY gates only decision actions; view/reweight/detach never dispatch inference or settle a pending human case.

```sh
pytest tests/tui/test_judging_viewmodels.py tests/tui/test_judging_screen.py tests/tui/test_review_screen.py tests/tui/test_ungraded_review.py tests/tui/test_profiles_screen.py tests/tui/test_judge_capability.py tests/tui/test_judging_navigation.py tests/tui/test_judging_subscriptions.py
```

1. Render every named board and supplied state in pure builders and Textual Pilot at both sizes; exercise focus, scrolling, keyboard/mouse and resize. Exact profile rows, original weights, trial IDs, costs and limitations remain visible.
2. Every accepted binding issues exactly the parent's documented call/factory arguments. Disabled raw/evidence/breakdown actions issue none; detach/modal cancel/escape never stop or rejudge. No computed grade/Q/weight appears from UI logic.
3. Stop an active original batch versus additional rejudge. Display durable remaining-not-judged status and typed persistence-pending/cleanup errors; preserve prior review rows. Repeated acknowledgement does not duplicate navigation or completed notices.
4. Load two trials with distinct T1 evidence and two same-label RunUids. Selected historical evidence/detail always addresses the explicit ResultId/TrialRef; current trial events never replace it.
5. Reconnect after missed completion, apply older revisions, change epoch, overflow/resync and unmount/remount; discard old-generation/late worker data and render durable settled/error status without hanging.
6. Invalidate while ReviewDetail is open: retain raw grades, show non-comparable reason, disable breakdown/rejudge and start no model. Capability unknown/missing raw response/malformed review shows exact reasons without guessing.
7. With model access disabled, open profiles, imported review and raw evidence; no invocation. Explicit M02 additional rejudge retains original review/group and separate new cost through real client/job navigation.

## Real integration gate

Through real EngineClient and M12/M11/M02/M05/M06/M07/M08/M15 owners, launch multiple trials, detach/reattach, inspect ungraded review, stop during judging, recover after engine loss and inspect identity invalidation after seal. Exercise explicit additional rejudge, separate grouping and M13 report/M17 import navigation; no private engine calls.

**Pending parent obligations:** M05 protected-role support; M11.4 terminal/recovery/invalidation; M14 CLI stop/report parity; M15.3 full navigation; real M13/M17 retained portability. Wireframe owners must add settling/persistence-pending/interrupted/invalidated/missing-raw variants, UID/trial fields and distinct run-stop/rejudge text; this child does not edit wireframes.

The [domain profile registry](../reference/modules/12-quality-judging.md#quality-profiles) extends these existing screens without new top-level navigation: web, backend, mobile, DevOps, agentic software, and specification design/decomposition. Show the native matrix or text-evidence coverage required by the selected frozen profile, distinguish candidate defects from unavailable evidence, and keep measurement/ranking displays separate. Specification `code_quality` commentary is labelled technical-design quality. Artifact-agent dependency/model names needed to understand the artifact are not claims identifying its builder. Profile changes use template revision/approval, never a post-run selector that reinterprets old grades.

## Human judge presentation

[M12.5](05-human-review-web.md) adds a Human option beside the two automated backends, with frozen local reviewer/form-policy references and the existing domain rubric. Show pending case counts, saved drafts, submitting/persistence errors, committed/ungraded/skipped states, and Open/reopen review actions through `judging.human.*`; never collect grades in a separate TUI validator. Browser failure exposes the local entry route and durable review reference. Closing this screen only detaches; Stop remains the existing run/additional-review action. Human pending work needs no model readiness or resource lease and does not hide separately completed execution statistics. The actual form deliberately excludes those statistics and earlier reviews until assessment completion.
