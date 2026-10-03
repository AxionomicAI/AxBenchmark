# Consolidated benchmark design handoff

Status: **45 pending design groups**, integrated against the current parent and bounded-child contracts. This is the latest handoff for the design engine. It specifies prototype work and later implementation acceptance; it does not claim that an application, API, native adapter, human review host or offline calculation has been implemented.

The reader is the designer implementing the next prototype pass. After reading, select a pass below, update the existing owned screen families, and deliver its named states, bindings, return paths and acceptance evidence. Stable IDs `BD-001`–`BD-045` identify requirements groups, **not 45 new screens**. Several groups deliberately share one editor, evidence viewer or report. Do not duplicate a screen for every rubric, provider, harness or profile.

## Authority and coverage

[Product SPEC](reference/SPEC.md), [architecture](../ARCHITECTURE.md), [supplement integration](SUPPLEMENT-INTEGRATION.md) and the current owner contracts govern behavior. [Child/test allocation](CHILD-TEST-MAP.md) governs requirement ownership; this handoff adds no API, module or dependency-graph edge. Proposed names below are design state names unless the owning child already declares a screen. If an old board, fixture, legend or navigation label disagrees with a current contract, update the illustration.

| Required source | Design groups |
|---|---|
| [Modes, current folders and task commits](BENCHMARK-MODES.md); [Cursor](M05/08-cursor-adapter.md); [OpenCode](M05/09-opencode-adapter.md) | BD-012–017; preserves one-shot, ordered multi-step, no-harness manual creation, immutable capture, six harnesses and mandatory commits. |
| [Context monitoring](CONTEXT-MONITORING.md); [decision engines](DECISION-ENGINES.md); [context companion](CONTEXT-DESIGN-HANDOFF.md) | BD-001–006; independent count, label and membership provenance, role selection, resource admission and retained analysis. |
| [Statistics](BENCHMARK-STATISTICS.md) | BD-036–040; four primary headings and complete eight-factor plan, evidence, policies and exact owner calculations. |
| [Backend](quality-judges/BACKEND.md), [mobile](quality-judges/MOBILE.md), [DevOps](quality-judges/DEVOPS.md), [agentic software](quality-judges/AGENTIC.md), [specification design](quality-judges/SPECIFICATION.md); [six-family registry](reference/modules/12-quality-judging.md#quality-profiles) | BD-018–023; common components with frozen family-specific content/evidence. |
| [Human review](M12/05-human-review-web.md) | BD-007–010 and BD-035; separate responsive browser controller, pending original lifecycle and real durable receipt. |
| [Model variants](MODEL-VARIANTS.md) | BD-024 and BD-041–045; ordered lineage, creator/date evidence, comparisons, annotations and blinding. |
| [SQLite results and analyses](RESULTS-DATABASE.md) | BD-033–035; discovery, snapshot, query guidance and saved-analysis freshness. |
| [API routes and existing launcher profiles](CROSS-HARNESS-COMPARISON.md) | BD-025–032; exact qualification, six-cell comparison and explicit treatments. BD-011 additionally covers independent judge routes and billed assessments without a Review. |

The 45 IDs correspond one-to-one to the collected pending groups from the eight feature passes, the residual boundary audit and the narrow judge-route/storage correction. The source table and each item make their coverage durable without depending on temporary agent reports. Original authoring journeys, current static context/statistics work and unrelated inventory/deletion designs remain required.

## Inspected prototype baseline and status vocabulary

Read-only inspection on 2026-10-03 of the four catalogs, source modules, [navigation](reference/design/wireframe-tui/navigation.md), [ownership ledger](reference/design/wireframe-tui/ownership-ledger.md), generated previews and the existing verifier confirmed **194 named boards, 233 size variants and 514 focus renders**. `node implementation/reference/design/wireframe-tui/src/verify.mjs` passed its static source/preview, grid, footer, ownership and fixture checks. This count excludes non-rendered system/artifact entries from focus renders; do not infer it by assigning every catalog entry a terminal render.

| Status | Meaning in this handoff |
|---|---|
| **Rendered-reference** | A named static board exists at its cataloged sizes and can be reused for layout. It is not evidence of the new fields, transitions, API behavior or runtime completeness. |
| **Update-needed** | Extend an existing rendered family; explicitly add missing sizes and states. Every group below remains pending even if its starting board is rendered. |
| **New** | No matching named board/page exists in the inspected inventory. Add it within the existing feature owner and navigation, preferably as a shared detail/modal when sufficient. |
| **Not-applicable** | A medium/control does not apply, with the reason stated. For example, the human form is not an 80×24 terminal board, and Human has no model-effort editor. This never means a required failure state may be omitted. |

Useful rendered references include `ContextDetail` and `DecisionEngines` at both sizes, their wide history/deferred/failure/reset/imported and profile/test variants, `HarnessLive` at both sizes, `ResultsStatistics` at both sizes, and wide `WeightsFactors`, `RankingsFactors`, `ScoreBreakdownFactors`, `ThroughputDetail`, `ArtifactStats` and `CliStatistics`. `RunListDetail` is compact only. `RubricProfiles`, `JudgeCapability`, `ReviewDetail`, `ReviewUngraded` and `ReportPage` exist, but their names do not establish six-family, Human, route, variant or database coverage.

No named manual-capture, API-access/existing-agent editor, route-qualification, harness-comparison editor, model-variant detail/compare, database-access or human-form board exists in this inventory. Existing `InventoryVariant` compares **template revisions**; it is not a model-variant screen. Existing `NewTemplateInvalid` illustrates a non-Git error and the old NewTemplate seam names `planning.inspect_repository`; replace those obsolete new-authoring claims with current-folder inspection and its actual errors. Do not restore a four/five-harness layout or require a planner merely because a board shows one.

## Contract shared by every design item

Each item below inherits the following requirements in addition to its named states and deliverables. A designer's inventory must record each as rendered, contract-only or not-applicable with a reason; a happy-state picture alone cannot close an item.

- **Terminal layouts:** deliver a 120×40 wide and 80×24 compact representative for every affected TUI family, with keyboard focus, scrolling, Back/Escape and resize transitions. Preserve selected stable IDs, full TrialRef, filter, draft/version, analysis cutoff and return focus. Compact detail may replace columns, but must keep availability, reason, pending state and the only recovery action reachable. Long Unicode paths, multiline prompts, many files and sixth/queued rows must not collide with the footer. Global shortcuts cannot consume editor text.
- **Common states:** show initial loading, valid empty, query error/Retry, disabled action with owner reason, pending save/job/durability, partial/unknown evidence, stale selection/version/cursor, failed/cancelled/interrupted recovery and persisted terminal result wherever the owner permits them. Label retained last-valid data and its age during failure; never display a failed fetch as an empty successful result. Carry the same `ActionState` into buttons, keys and palette; disabled actions issue no command. Explicit known zero, unknown, not exposed, not applicable and missing evidence are distinct.
- **Bindings:** use the exact owner EngineClient DTOs and methods below. Shorthand such as `results.list/get` means the two existing methods, not a new combined API. UI formats owner values; it does not calculate identity, readiness, coverage, means, token counts, scores, comparison eligibility or SQL. Async subscriptions use M15 `SubscriptionHub`, full `EventCursor={epoch,seq}`, object revisions, generation replacement/resync and stale-response rejection. Job following uses `job:<id>` and owner status after cache expiry. Unmount/detach is not cancellation; actual cancellation uses the owner action and settlement state.
- **Role/privacy boundaries:** competitor, optional planner, harness judge, native System One observer/grader, product-agent verification and Human remain separate roles/accounts. Ordinary API readiness does not enable a decision engine. Use only independently fictional `example-agent`, `example.invalid`, fixture models and fixture values. Do not inspect or copy private configuration, paths, settings, models, credentials or defaults into designs. Show credential presence and sanitized provenance only. Imported profiles/evidence remain inactive. Navigation, filtering, reweighting, save/registration, report viewing and import never start inference, qualification, a human host or artifact execution.
- **Browser media:** BD-009 owns the separate responsive Human controller. M13 owns the standalone offline report. Both need desktop/narrow layouts, keyboard focus, safe inert evidence and error states, but they have different credentials, actions and data. Terminal selectors/status still need both terminal sizes. Do not place weights, rankings or report controls in the anonymous form.
- **Per-item acceptance packet:** provide a source/board/page inventory keyed by BD ID, owner and R IDs; fixtures showing the fields/reasons; declared sizes; entry/return transitions; ordered focus and disabled-action annotations; exact query/command/event mapping; and screenshots or rendered evidence for the listed states. List remaining native/Textual/browser/runtime tests separately. Static transitions must demonstrate zero work on Back/navigation and one intended action on acceptance; real action-count proof belongs to implementation tests.

## Product behavior that every pass must preserve

### Manual authoring and immutable targets

Use independent **Benchmark type** (`One shot`, `Multi step`) and **Project type** (`Frontend`, `Backend`, `Fullstack`, `Mobile`, `DevOps`, `Agentic software`, `Specification design`). **Target mode** (`From scratch`, `Modify existing files`) is returned by inspection, never a toggle. All four benchmark/target combinations are valid. Agentic means the executable agent being built; specification means design/decomposition documents.

One shot offers one multiline editor **or** one prompt-file import, exactly one active input. Saved UTF-8 bytes become `T1`; preserve file bytes, whitespace, Unicode and line endings. Invalid UTF-8 or blank content produces field errors. Reading is not saving. No extra global specification, planner rewrite, task split or automatic repair task is introduced. One logical task may use multiple model/tool requests.

Multi step takes at least two explicitly ordered primary files, one per task. Show position/task ID, relative payload path, original filename, byte digest and imported/edited/generated provenance. Add/Replace/Remove/Move up/Move down are keyboard accessible; upload order and filename sort do not reorder execution. Below two is incomplete, not silently one shot. Optional common files are separate and add no tasks. Mode switching explicitly reviews/clears incompatible input. Fresh task sessions share the continuing isolated trial workspace; supplied future primaries are withheld, without claiming to hide content already in the baseline.

**Generate with planner** is a secondary explicit multi-step branch, retaining the existing seven-task default and reviewed model-call workflow. Manual import, inspection, capture, editing and approval work without a harness, Git or planner. Origin/capability controls regeneration; recovery never routes manual work to a model.

| Target state | Required presentation |
|---|---|
| Empty / administrative metadata only | From scratch, returned policy/exclusions and zero meaningful content; Continue follows `can_continue`. Empty directories and ignored VCS/OS metadata do not invent content. |
| Populated, dirty/staged/untracked, non-Git or Git subdirectory | Modify existing files; exact selected root, admitted count/bytes and exclusions. Current working bytes win over index/HEAD. Discovering parent Git context never broadens the root. |
| Meaningful content but none admitted | `baseline.no_admitted_files`, modify classification, path/reason and policy/folder remedy; Continue disabled. |
| Missing, unreadable, unsupported link/special entry, collision or required-input exclusion | Exact path and engine remedy; never a green empty state. No symlink following or client filesystem scan. |
| Loading/error/stale/source changed | Preserve inputs and labelled old facts; disable dependent continuation; explicit retry/reinspection/recapture with fresh token/version. No newly captured bytes under old consent. |

Capture copy: “Capture this folder once. Each configuration and trial works in its own copy. Your source folder stays unchanged.” Describe before/copy/after consistency, not an atomic-filesystem guarantee. Manual stages are `import_inputs → inspect → snapshot → source_unchanged → validate → persist`; no invented percentages, planner logs or cost. A durable complete draft alone is ready for review. Hide leaves a discoverable unfinished item; Cancel waits for owner cleanup; discard is a separate confirmed inactive-item action. Interrupted work reopens its durable state. Failed recapture preserves the last complete snapshot and draft with a visible unresolved refresh issue.

Review exact inputs/order, checks/protocol/services/dependencies/rubric, snapshot digest, policy/exclusions and issues. `planning.inspect_target` → `planning.create_manual` → `planning.operation`/job → `planning.draft`/`draft_task` → `planning.edit(base_version)` → `planning.approval_preview` → explicit `planning.approve(base_version=preview.version)` is the manual path. Recapture uses a new reviewed inspection and `planning.recapture`; it is not a public `baseline.capture` API. An approved refresh first creates an M01 revision and uses `templates.approval_preview/approve_revision`. Version conflicts retain recoverable edits for explicit resolution. Completed packaged bytes remain usable after the source disappears. Imported/approved data never refreshes automatically.

Inspection returns `TargetInspectionDTO` with its opaque target_inspection_id, derived mode, inventory/policy refs, counts, exclusions, problems and can_continue. `planning.create_manual(benchmark_type,project_type,target_inspection_id,inputs,evaluation_profile_refs,idempotency_key)` returns `JobRef → DraftDTO`; inputs discriminate exactly one prompt_text/prompt_file from an explicit ordered_spec_files list. Resolve creation/operation IDs from owner responses, never derive them from JobId. An explicitly empty authored suite says “No behavioral checks declared”; it proves no behavioral coverage. Unresolved rubric/evidence scope or required final-capture declarations remain approval issues; a prompt alone does not establish gradeability.

### Cursor/OpenCode selection and run layouts

The registry order is `claude_code`, `codex`, `grok_cli`, `pi`, `cursor_cli`, `opencode`. Preserve exact distribution/version/generation evidence and unknown capabilities; a launcher profile is a configuration of its native harness, not a seventh harness. Wide run views may use a scrolling two-column/three-row region; compact uses a reachable list/detail. Registry size and saved `jobs` are separate; preserve jobs 4/5 as well as 1 and 6. A configuration keeps its slot across all sequential trials. Never show an interleaved trial scheduler.

### Mandatory commit review and evidence

Every attempted competitor task ends with a new competitor-created Git commit, including an empty commit when no file change is needed. The locked instruction/check policy is separate from exact prompt bytes. Git is an execution prerequisite. Empty new-policy trials start with unborn HEAD; populated trials have one separate synthetic setup baseline commit. No source-folder mutation, engine-created competitor milestone, auto-push or repair call. Show process outcome, authored checks, protocol verdict and quality separately. Task-scoped evidence distinguishes advancement/ancestry, tree/in-scope dirty paths, setup versus competitor origin and unavailable history. A later task cannot repair an earlier verdict. Missing/dirty/rewritten evidence is not the same as unobservable history; legacy `not_recorded` is not a newly evaluated result.

Legacy v1 remains visibly legacy multi step even with one task, with original bytes/hash/baseline and inventory acceptance unchanged. The built-in inventory retains competitor initialization during T1. An incompatible legacy protocol requires an explicitly reviewed revision for a new run, without rewriting historical results or archives.

### Frozen rubric and evidence components

Render the six ordered categories and three comment axes from the exact frozen `ProfileSpec`/`ProfileDTO` and rubric ref/version/digest. Frontend and fullstack share web; there are seven project types and six families. Keep historical versions. All six grades remain required at nine exact half-step choices from 1 to 5, including zero-weight categories. Exact finite nonnegative edited weights need a positive total; only defaults must sum to 100. Raw business-category gates, measured ranking factors and grade validity stay with M06/M12. Never infer quality from file/spec count, task count, measurements or a passing structural test.

| Family | Evidence/readiness detail for shared components |
|---|---|
| Web | Frozen existing categories; actual final-regression captures for approved scope at 1440×1000 and 390×844, source and behavior. Machine vision support and Human renderer support are separate gates. |
| Backend (`backend/2`, legacy refs retained) | API/interface, data/invariant, failure/recovery and operating evidence scoped before approval; text by default. No invented enterprise features, UI coverage or browser prerequisite. |
| Mobile (`mobile/1`) | Native platform/device/build/state matrix, build-to-source binding, actual image bytes, semantic/accessibility, lifecycle and permission evidence. Wrong build/target and missing required cells remain deficiencies; web-size substitutes do not satisfy native evidence. |
| DevOps (`devops/1`) | Target/authority, validation, plan, dry_run, simulation, applied and rehearsal labels; a plan is not a deployment. Declared environments/access/cleanup matter; no automatic provisioning or unsafe apply from a viewer. |
| Agentic (`agentic/1`) | Final-product cases with per-boundary simulation/replay/live modes, product model/tools, effect authority, budgets and actual settlement. Builder/grader history is excluded. Product inference is auxiliary verification, not competitor or decision-observer usage. |
| Specification (`specification/1`) | `spec` is first; supplied brief/reference/parent authority versus candidate documents and approved read-only structural reports. Design maintainability and implementer usability label the existing comment axes. Empty services can be valid; candidate commands remain inert and structural success proves no implemented behavior. |

Required modality/coverage failures differ from an observed defect and from an unrequired image. Native/device/toolchain/access availability comes from M03/M08, assessment support from M12. No profile waiver, OCR, generated image description or hidden fallback supplies missing evidence. Local/mixed/unknown **actual upstream inference** uses M11 admission; a loopback gateway to remote inference is not local. Show local deferral, explicit overlap, and unknown server settlement with genuine lease/measurement intervals and without guessed energy subtraction.

## Screen and state change matrix

Pass order is a design-production order, not a change to the implementation DAG. Within a pass, share widgets/families; “After” identifies the content or interaction that must be available for review. Every item requires the common acceptance packet and both terminal sizes unless its medium is explicitly not applicable.

### Pass A — author, capture and freeze the benchmark

#### BD-012 — manual creation and target inspection

**Owner/R:** [M01.4](M01/04-library-screens.md); R177–R180, R183. **Status/evidence:** update-needed: `LibraryNoHarness`, `NewTemplate`, `NewTemplateRepo`, `NewTemplateInvalid`, `TemplateTasks`, `TemplateIdentity` are rendered references; mode/input/target states are new variants. **After:** shared shell only.

**Entry/return/bindings:** Library New → mode/domain and exact-input form → `planning.inspect_target` → explicit `planning.create_manual` JobRef handed to BD-013; Back restores form/focus. Template details read `templates.get/tasks/manifest`. No-harness Library keeps manual creation enabled.

**Content/states:** implement all manual/target cases above, independent selectors, primary order versus common context, exact-byte preview, locked commit instruction, derived counts/exclusions, invalid/duplicate/missing inputs, changed root, inspection error/stale response, legacy marker and source-independent reuse. **Deliver:** both-mode × both-target walkthroughs; a no-harness/no-Git manual path; replace obsolete non-Git rejection and planner-only legends without losing existing revision/export routes.

#### BD-013 — manual progress, ordered editor and approval

**Owner/R:** [M16.5](M16/05-draft-editor-screens.md), [M16.4](M16/04-planner-screens.md); R177–R180, R183. **Status/evidence:** new `ManualCaptureScreen`/`ManualCaptureFailedScreen`; update-needed rendered `PlanReview`, `PlanReopened`, `PlanEdit`, `PlanApprove`, `PlanApproveIdentical`, `PlannerPicker`. **After:** BD-012.

**Entry/return/bindings:** create/reopen from Library → `planning.operation`, `planning.draft/draft_task`; edit/reorder via `planning.edit(draft_id,base_version,edit)`; `planning.recapture`, `approval_preview`, `approve`; owner `planning` plus `job:<id>` subscriptions and `jobs.get/cancel`. Approval returns saved template; Back/Hide retains the durable operation and selected task. Optional planning separately uses `planning.defaults/create_request/planner_options/start`.

**Content/states:** manual stage progress, no planner log/cost, hide versus cancel/cleanup/discard, interruption/job-cache expiry, capture failed/changed, reorder below two, imported/edited/generated origin, exact checks and locked protocol digest, incomplete/stale/identical approval, conflict with recoverable draft and explicit recapture. Source removed after complete capture is not a blocker. **Deliver:** ordered-spec keyboard sequence and durable recovery storyboard; optional six-candidate planner branch with consent, unavailable/failed/interrupted states and return to the same review boundary. Preserve F17: one selected_task_id drives row, checks, snapshot label and editor; `planning.draft_task` returns them together. Existing static T4 labels pass, but delayed T3-after-T4, reopen, resize and compact full-digest transitions still need interaction evidence. Serialize acknowledged versioned edits before preview/approval; do not restore a hard-coded snapshot label.

#### BD-018 — author the domain scope and evidence plan

**Owner/R:** [M01.4](M01/04-library-screens.md), M16.4/M16.5; R184–R188. **Status/evidence:** update-needed `TemplateTasks/Identity`, `NewTemplate`, `Revise`, `PlannerPicker`, `PlanningProgress/Failed`, `PlanReview/Services/Edit/Approve`. **After:** BD-012–013.

**Entry/return/bindings:** selected template/draft → existing rubric/check/support-file editor → versioned `DraftEdit` through `planning.edit`; use `templates.get.rubric_summary`, planning request/session/draft/approval DTOs. Return restores exact task/file; a defining change invalidates the old approval preview.

**Content/states:** six-family ref/version/digest/category/comment labels; backend feature/evidence map, mobile native matrix, DevOps target/mode/authority, bounded agent cases/effects/budget, and supplied brief/reference precedence. Show incomplete scope, unresolved required modality, stale approval and valid document-only empty services. **Deliver:** one shared component populated for all six families, including modification/baseline obligations; no extra screen or planner request per family.

#### BD-024 — separate template and model variant navigation

**Owner/R:** [M04.4](M04/04-catalog-screens.md), [M09.4](M09/04-inventory-screens.md); R190; preserve M09 R008, R020–R028, R034, R046, R136, R149–R151. **Status/evidence:** rendered-reference `InventoryVariant` stays the template default/other-revision comparison; its navigation needs updating, and model detail/compare surfaces are new under BD-041–042. **After:** BD-012.

**Entry/return/bindings:** Library built-in details → `templates.lookalike` → return to the selected template revision; model links use M04 catalog refs and BD-041 instead. **Content/states:** label template hash/revision separately from model lineage; preserve loading/missing template/lookalike errors and disabled model navigation when no model ref exists. **Deliver:** route/label map showing both meanings without repurposing InventoryVariant; no Human browser surface applies.

### Pass B — readiness, profiles, independent roles and launch review

#### BD-014 — six-harness readiness and frozen launch basics

**Owner/R:** [M03.2](M03/02-readiness-screens.md), M04.4, [M07.3](M07/03-setup-review-screens.md); R177–R183. **Status/evidence:** update-needed `Environment/NoHarness/AuthFailed/Offline`, `Catalog`, `ModelPicker/Unknown`, `Setup`, `ReviewLaunch`, `LaunchRecord`. **After:** BD-013.

**Entry/return/bindings:** Library/Setup remedy → `environment.report/explain/recheck`, existing verification plan/explicit verify action → catalog via `catalog.options` → originating Setup. `configs.open/setup/review/launch_record` supply frozen projections; `runs.launch(draft_id,preview_digest,...)` is the sole launch action.

**Content/states:** all six ordered registry entries, Cursor vendor and OpenCode generation/version/private-runtime evidence; absent/auth/unknown/headless/unsupported-role/clean-policy cases; Git execution-only blocker; no guessed model/default/effort. Show mode, order, baseline/protocol, full trials and returned logical tasks/assessment totals; review and budget confirmation become stale on changes. **Deliver:** sixth-entry keyboard reachability, missing-Git manual-authoring return, unknown metric/capability examples, preserved jobs 4/5 and retained immutable LaunchRecord.

#### BD-004 — readiness remedies and shared navigation

**Owner/R:** M03.2/M04.4/[M15.3](M15/03-tui-integration.md); R167–R169, R172. **Status/evidence:** update-needed Environment/Catalog and current shell; reuse rendered DecisionEngines/ContextDetail. **After:** BD-014.

**Entry/return/bindings:** owner `DecisionReadiness`/capability reason → injected `DecisionEnginesScreen` or `ContextDetail` factory; return to the exact caller/selection. Register only current owner `measurements` events and shell factories. **Content/states:** API-ready but native System One unavailable, metadata versus executed identity, unknown actual locality, role unselected and offline retained access. Keep four root destinations and reachable configuration remedy, including loading/error/resync. **Deliver:** keyboard/palette/back route map at both sizes; no extra root destination, profile activation or inference on navigation.

#### BD-025 — API access and independently registered agent profiles

**Owner/R:** M04.4; R192–R194. **Status/evidence:** new API Access Profiles, chain/model/effort editor and Existing Agent inspect/register/detail within Catalog; existing Catalog/ModelPicker provide rendered entry/return references. **After:** BD-014.

**Entry/return/bindings:** Catalog or role-specific picker → `catalog.access_profiles.list/get/save/inspect/capabilities`, `catalog.existing_agent_profiles.list/get/inspect/register`; `AccessProfileVM`/`ExistingAgentProfileVM` return immutable refs to their caller. Metadata inspection is an explicit job; events are `catalog.access_profiles.updated/inspection_finished` on owner topics.

**Content/states:** Direct/OpenRouter/LiteLLM and ordered hops; client alias versus upstream model/revision/variant; native level/budget/disabled effort and mapping; allowed roles, credential presence, gateway versus inference locality and documented/qualified/observed evidence. Existing source is explicitly independently selected, never prefilled. Show accepted/unset/empty/ignored/unresolved declarations, required assets, unsupported dynamic wrapper, isolation/credential precedence, source/version conflicts, existing/clean/explicitly overridden treatment and preserved editor draft after error. Registration alone selects/qualifies nothing. **Deliver:** empty/inspect/save/stale/failure/detail states, structured conflict review and sanitized portable preview; no shell sourcing or private fixture data.

#### BD-026 — exact route qualification consent and result

**Owner/R:** M03.2; R192–R194. **Status/evidence:** new qualification review/progress/result under Environment, reusing its diagnostic job shell. **After:** BD-025.

**Entry/return/bindings:** explicit profile capability action → `environment.assess(operation=qualify_route)`/`RouteQualificationPlanV1` → explicit `environment.qualify_route` → shared job follow/cancel → `RouteQualificationOutcomeV1`; return to the same profile/cell for revalidation.

**Content/states:** separate generic default-model auth from exact installed distribution/adapter/model/effort/route; fixed read-only tool/stream fixture; bounded requests/attempts/output/time and evidenced optional money consent. Show unknown hidden retry/charge coverage, local/mixed/unknown queued admission, running, tool/protocol/stream/model/effort failures, cancel/timeout and unknown server settlement. Changed plan invalidates consent. **Deliver:** decline/Back makes no call, one accepted diagnostic action and its accounted result; no RunUid/TrialRef or benchmark score invented, no arbitrary prompt/probe escape.

#### BD-027 — all-six matrix and existing-profile conflicts

**Owner/R:** M07.3; R192–R194. **Status/evidence:** new Compare Across Harnesses/cell/profile/conflict states in Setup; update-needed ReviewLaunch/LaunchRecord. **After:** BD-025–026.

**Entry/return/bindings:** Setup → `configs.comparison_create/update/preview/export`, `configs.existing_agent_select` with tagged competitor/harness_judge target and expected revision; M04/M03 factories return refs/evidence. Review via `configs.review/get`; launch only `runs.launch`. `configs.comparison.updated` uses revisioned owner events. Back preserves draft/cell selection.

**Content/states:** every registry cell including missing, unverified, blocked and not_selected, exact common target and mappings, strict all/default jobs=1, explicit subset N/6, exploratory/helper scope and concurrency. Required qualification cannot be bypassed. Distinguish ordinary inherited optional unknowns from strict proof; source drift and model/effort/route conflicts require reviewed override or target change. Reveal helper/protocol effects and actual inference budget. Grading remains separately selected through `configs.set_grading_selection`. **Deliver:** full matrix at both sizes, stale review with preserved choices, structured existing/clean/overridden review and no hidden unavailable row or compatible-only fallback.

#### BD-001 — System One profiles and independent role setup

**Owner/R:** M07.3; R165, R167, R168, R172. **Status/evidence:** update-needed rendered DecisionEngines/Empty/Local/Missing, DecisionEngineEdit/Test/Tested, SetupNoEngine/GradingTextOnly, JudgePicker/ReviewLaunch. **After:** BD-004; share profile-list/editor primitives with BD-025 without conflating identity.

**Entry/return/bindings:** Setup/disabled context action → `decisions.profiles.list/get/save/test`, `decisions.capabilities`; return to role control. Monitor selection uses `configs.set_execution(context_monitoring=...)`; grading uses `configs.set_grading_selection` (legacy `configs.set_judge` remains harness-only). Save is a new profile version; explicit metadata and inference-test modes stay distinct.

**Content/states:** no profile, configured unavailable/unverified, READY but unselected, text-only/vision, native capability unknown, auth presence/error, model/version drift and separate monitor/grader refs. Review sanitized content/destination, threshold/pack/budget and local deferred/overlap/server_state_unknown policy. Human/harness and native counts stay available by their own gates. **Deliver:** missing list loading/error/compact/resize states, explicit cancellable test route, stale save recovery and zero role activation from save/navigation.

#### BD-007 — Human selection and launch totals

**Owner/R:** M07.3; R189, R184–R188. **Status/evidence:** update-needed Setup/JudgePicker/JudgeFallback/ReviewLaunch/TrialBudgetWarning/LaunchRecord; new Human variants, not another picker implementation. **After:** BD-014, BD-018, BD-001.

**Entry/return/bindings:** `configs.judge_candidates.backend_options` → Human → `configs.set_grading_selection(draft_id,grading_selection)` → `judging.check_judge` → `configs.review` → `runs.launch`; Back leaves selection unchanged until accepted. **Content/states:** self-declared reviewer UUID/label and frozen form-policy/version/digest, saved/restored choice, host/renderer unavailable and stale policy/reviewer preview. Human needs no API profile/model/effort/confidence; an absent context engine does not block it. Show logical assessments/human cases, zero machine counts, one post-seal queue and pending-quality completion. **Deliver:** all-family shared picker variants, unavailable renderer remedy, stale confirmation and no browser opening before all execution/verification/accounting seals.

#### BD-019 — domain prerequisites and assessment capability

**Owner/R:** M03.2/M04.4/M07.3/[M12.3](M12/03-judging-screens.md); R184–R188. **Status/evidence:** update-needed Environment, Catalog, Setup/JudgePicker, ReviewLaunch/LaunchRecord and M12-owned JudgeCapability. **After:** BD-018, BD-014, BD-007.

**Entry/return/bindings:** `environment.assess(operation=verify_artifact)` and explanations for verifier prerequisites; `configs.review/get`, `judging.check_judge` and injected `JudgeCapabilityScreen` for assessment. Its CHOOSE_JUDGE/OVERRIDE_CATALOG/RECHECK/BACK result returns to and revalidates the same draft.

**Content/states:** native missing device/toolchain/capture cell, unsupported/unknown verifier target, product model/tool access/authority unavailable, required modality/evidence failure, text-only domain with no browser prerequisite, Human renderer versus machine image support. Expose resource admission/settlement independently of capability. **Deliver:** compact remedy flows for native, text, product-agent local/deferred and gateway-remote cases; no invented cloud device, fallback model or evidence waiver.

#### BD-029 — independent planner and automated judge profiles

**Owner/R:** M12.3/M16.4; R192–R194, R167–R172. **Status/evidence:** update-needed JudgePicker/JudgeCapability/ReviewDetail and PlannerPicker/PlanningProgress/PlanningFailed; reuse BD-025 factories. **After:** BD-025–026, BD-001, BD-019.

**Entry/return/bindings:** role-permitted M04 profile selection returns to `configs.set_grading_selection`/`judging.check_judge` or existing planning request/session APIs under `PlanningScope`; `JudgeSelection`/`ReviewPlan` freeze the judge. Back restores caller choice; manual authoring never enters PlannerPicker.

**Content/states:** actual JudgeGroup model/effort/route/treatment distinct from competitor, source/executable/asset drift before fresh session, inherited optional limitations, stale selection and capability failure. System One remains unavailable despite generic API readiness; Human has no access profile. Planning has session identity/accounting and no fabricated benchmark run. **Deliver:** side-by-side role provenance with different fictional competitor/judge/planner choices, failures and source drift; no implicit copy or fallback across roles.

#### BD-041 — variant metadata editor and frozen selection

**Owner/R:** M04.4/M07.3; R190. **Status/evidence:** new SetupVariantDetailEditor; update-needed Catalog/ModelPicker/Setup/ReviewLaunch/LaunchRecord. **After:** BD-024, BD-025, BD-027.

**Entry/return/bindings:** `catalog.entry/entries/options/check_selection`; editor saves addressed `VariantOverrideDraftV1` via `catalog.save_override(expected_descriptor_revision,variant_metadata)`; return immutable `model_variant_ref` through `configs.add_entry/update_entry` and `configs.review`. **Content/states:** combined FINETUNE + QUANT, ordered multi-parent lineage/active adapters, exact root versus family, creator node/role, created/published/uploaded/observed date kind, range/precision, inherit/value/unknown and conflicting claims. Resolve ambiguous same-label candidates explicitly. Unverified metadata is nonblocking unless owner mismatch blocks; stale descriptor/cursor/review preserves edits. **Deliver:** scrollable lineage and provenance, selected control policy, editor conflict/revalidation and read-only frozen record; no invented creator/date or executed-weight proof.

#### BD-038 — complete ranking-plan handoff at setup

**Owner/R:** M07.3, M06.2 editor provider; R175–R176. **Status/evidence:** update-needed Setup/ReviewLaunch/LaunchRecord. **After:** BD-014; coordinate BD-037 before final pass acceptance.

**Entry/return/bindings:** Setup weights → M06 WeightsScreen → one `configs.set_weights` with complete validated `RankingWeightsV2`/policy envelope → `configs.review`; cancel returns original focus/values. **Content/states:** all eight exact originals, enabled directions/bases/policies, separate six quality weights and defaults; positive-unset direction, invalid/stale policy, unsupported source warning, failed save/stale review. Disabled null directions are preserved. **Deliver:** complete round-trip contract diagram and both-size summaries without recomputation or silently dropping extra factors; changed plan clears launch consent.

### Pass C — execution, evidence and measurements

#### BD-015 — six-harness live, queued and compact navigation

**Owner/R:** [M05.7](M05/07-adapter-views-integration.md), [M11.5](M11/05-run-screens.md), M15.3; R177–R183. **Status/evidence:** update-needed RunConfig/RunIsolation/RunOverview/RunQueued/RunSequential/RunReattached/HarnessLive; rendered-reference compact RunListDetail. **After:** BD-014, BD-027.

**Entry/return/bindings:** launch/attach → `runs.status`, `harness.configuration.describe`, `harness.task.log`, `harness.isolation.get`, `verification.task.get`; run/harness subscriptions preserve RunUid/configuration/full TrialRef. Return from historical evidence restores the selected lane/task, never latest trial.

**Content/states:** six reachable entries and queued rows, configuration slot across sequential trials, jobs versus lane count, one-shot T1 versus ordered primary filename, baseline/protocol, process versus commit outcome, stopped/failed/partial/reattached. Unknown Cursor/OpenCode fields remain unknown. **Deliver:** wide scrolling 2×3 and compact list/detail; focus sixth entry then resize/detach/reattach while another trial runs; single-task completion goes to final evidence, never fabricated T2.

#### BD-016 — mandatory task-commit evidence

**Owner/R:** [M08.3](M08/03-verification-screens.md), M02.3; R183, R177–R180. **Status/evidence:** update-needed TaskChecks/FinalRegression/CheckOutcomes/EvidenceViewer/ResultOrigin/ResultOutcomes; CheckMissingCommit/CheckHistoryUnavailable are references, new task-commit pending/pass/dirty/unverified variants needed. **After:** BD-013, BD-015.

**Entry/return/bindings:** task outcome → `verification.task.get`, `verification.regression.get`, `verification.not_passed.list`, `results.evidence/read_evidence`; return with exact result/trial/task/phase/check. **Content/states:** frozen origin/policy/check digest and immutable cutoff, unborn/start/end HEAD, setup/competitor commits, ancestry/tree/path inventory, ignored but required dirty paths, pending/FAIL/UNVERIFIED/not_recorded. Never equate protocol pass with behavioral coverage. **Deliver:** empty baseline first commit, populated synthetic baseline, no-change empty milestone, rewritten history, later-task non-repair and retained evidence after source deletion; no commit-management action/API.

#### BD-020 — domain evidence viewer and verification progress

**Owner/R:** M08.3/M11.5; R184–R188. **Status/evidence:** update-needed TaskChecks/FinalRegression/Screenshots/VerifyProgress/JudgeHandoff/EvidenceViewer/RunOverview; `JudgeInputScreen` uses the existing JudgeHandoff board family. **After:** BD-018–019, BD-015.

**Entry/return/bindings:** run or retained task → `verification.task.get/progress.get`, `verification.screenshots.list` with tagged `capture_context`, `verification.judge_input.get`, `results.evidence/read_evidence`; retain TrialRef/phase and return focus. **Content/states:** web pair versus variable native matrix/build/state or declared images; lifecycle/permissions/accessibility, backend data/recovery, DevOps modes, agent per-boundary simulation/replay/live with deferred/unknown settlement, supplied/candidate documents and structural-only claims. Required missing/unavailable differs from observed defect and unrequired image. **Deliver:** six-family fixtures, paged inert text/binary/image handling, loading/gap/invalidated/pending-durability states and explicit no-current-verification state; no viewer executes a candidate or adds checks.

#### BD-028 — effective route, treatment and accounting

**Owner/R:** M05.7/M11.5/[M10.3](M10/03-measurement-screens.md); R192–R194. **Status/evidence:** update-needed RunConfig/RunIsolation/ModelRejected/RunOverview/LaunchRecord/Measurements/CostBasis. **After:** BD-027, BD-015, BD-026.

**Entry/return/bindings:** live entry/detail → `harness.configuration.describe`, `harness.invocation.get`, `runs.status/get_launch`; the `harness.settings.observed` event and existing run/harness topics update projections. Cost detail uses `measurements.cost_bases` with full ResultFilters. Return keeps invocation/configuration/trial and comparison cutoff.

**Content/states:** requested/resolved/effective model/effort/route, exact profile/version/treatment, helper/request roster coverage and configuration-scoped mismatch. Separate prelaunch unsupported from actual failed/partial execution; retain all expected trials and sequential slot. Loopback remote charges, gateway-inclusive receipt versus additional fee, retry/helper cost, separate diagnostic accounts, unknown coverage/settlement and retained evidence stay inspectable. **Deliver:** partial roster/mismatch/cancel/recovery and remote-through-local-gateway examples; no inferred effective value from a requested setting or double-counted fee.

#### BD-043 — effective variant mismatch during execution

**Owner/R:** M05.7/M11.5; R190. **Status/evidence:** update-needed RunConfig/ModelRejected/RunOverview/RunFailures/HarnessLive/RunReattached, shared with BD-028. **After:** BD-041, BD-028.

**Entry/return/bindings:** selected configuration/invocation → `harness.configuration.describe`, `harness.invocation.get`, `harness.live.get`, `runs.status`; return to that explicit trial. **Content/states:** requested/resolved/effective evidence separately, alias reported versus confirmed full composition, unavailable proof versus known mismatch, affected configuration halted/later not_run while other lanes continue, historical trial evidence unchanged. **Deliver:** before-dispatch and mid-run mismatch variants at both sizes, stale-response/reattach and retained failure navigation; no hiding failed trials to produce a matched comparison.

#### BD-002 — context counts, labels and membership

**Owner/R:** M10.3/M11.5/M02.3; R161–R166, R169, R172. **Status/evidence:** update-needed rendered ContextDetail/History/Deferred/Failed/Reset/Imported/Retained and HarnessLive context panel. **After:** BD-001, BD-015.

**Entry/return/bindings:** HarnessLive or retained Measurements → `ContextTarget(result_id,invocation_id,session_id,agent_id,window_id)` and `AnalysisSelection`; `measurements.context.sessions/snapshot/history/segments/analysis`; explicit `reclassify` pins source/profile/pack/policy/budget/idempotency and returns job. Use snapshot.recorded/capture.closed/analysis.updated/gap.recorded on `measurements`. Return retains source/analysis cutoff and selected agent/window.

**Content/states:** current input versus observed history, native-only known total/unknown partition, all eleven labels, count method/fidelity/basis versus native/predicted label/confidence versus included/excluded/unknown membership. Show not_exposed hidden reasoning, unclassified/gaps/reset/compaction, native disagreement, pending/deferred/partial/failed/cancelled/disabled analysis and setup route. Do not fill a residual, force shares to 100%, pool nested windows or use billing as occupancy. **Deliver:** missing compact history/failure/control states, stale trial/agent/window/cursor walkthrough and retained/imported read-only fixtures with zero inference on open.

#### BD-006 — observer and verifier resource disclosure

**Owner/R:** [M18.5](M18/05-telemetry-screens.md); R169, R172; consume R187/R192–R193 locality/admission. **Status/evidence:** update-needed Telemetry/EnergyDetail/SequentialEnergy; WindowsScreen has owner contract but no separately named Windows board. **After:** BD-002, BD-019, BD-028.

**Entry/return/bindings:** result telemetry → `telemetry.experiment/energy/windows` and permitted `telemetry.export_csv`; frozen resource policy, real lease/measurement intervals and DecisionCall/profile/runtime/residency provenance are projections, not new UI calls. Return preserves result/TrialRef and chart range.

**Content/states:** deferred observer/product inference, live_local_overlap, server_state_unknown, known overlap versus unknown attribution, cloud-client/background scope, gaps/provisional/close-pending and disabled Windows in parallel mode. Whole-host energy retains background work; no guessed subtraction or automatic GPU change. **Deliver:** wide/compact intervals/coverage details and CSV refusal/retry states; local inference versus loopback-remote evidence and retained offline read.

#### BD-036 — primary statistics and evidence detail

**Owner/R:** M02.3/M10.3; R173–R174, R176. **Status/evidence:** update-needed Results/ResultsTrials/Measurements and rendered-reference ResultsStatistics/ThroughputDetail/ArtifactStats/MeasurementsTrials. **After:** BD-015–016.

**Entry/return/bindings:** `results.list/get` → scoped `measurements.result/task/trials`; detail returns to same full subject/trial/filter. **Content/states:** **Gen tok/s**, **In tok (cached)**, **Out tok (reasoning)**, **Files / LOC** beside time/cost; pooled numerator/denominator and per-trial range versus exact count means/ranges and separately labelled totals. Baseline-inclusive final size, matched-request subsets, timing/token/inventory policy and independent unknown cached/reasoning/files/LOC. No API/tool/session duration masquerades as generation time. **Deliver:** compact accessible summaries/details, known files/unknown LOC, missing/full-roster versus subset cases, supported/unsupported native timing and finalization-pending storage distinct from settled unknown evidence.

### Pass D — automated assessment, anonymous Human review and durable settlement

#### BD-003 — backend-aware judging progress and retained reviews

**Owner/R:** M12.3/M02.3; R167–R172, R189. **Status/evidence:** update-needed Judging/JudgingTrials/JudgingDone/ReviewDetail/ReviewUngraded/Rejudge. **After:** BD-029, BD-020, BD-007.

**Entry/return/bindings:** run/additional batch → `judging.status`, `CurrentSessionDTO.execution` tagged backend; `judging.check_judge`, explicit `judging.rejudge` and `judging.human.*` as appropriate. Existing judging/harness/results subscriptions preserve batch/result/full trial; return to original run or Results. **Content/states:** real harness process versus logical decision assessment/call/batch/lease (no fake PID), immutable profile/model/pack fingerprint, raw native answers, nullable confidence/cost, coverage/acceptance deficiencies and code_composed_from_decisions/model_authored/human_authored labels. Empty/waiting, queued, settling, persistence pending, interrupted, invalidated, missing raw response and failed/not-judged remain distinct. **Deliver:** three-backend shared progress/detail family, explicit additional-job stop versus run stop, unavailable decision branch without disabling saved/human/harness routes.

#### BD-021 — frozen rubric and domain review presentation

**Owner/R:** M12.3/[M12.5](M12/05-human-review-web.md); R184–R188. **Status/evidence:** update-needed RubricProfiles/Judging/ReviewDetail/ReviewUngraded; browser equivalent is new within BD-009. **After:** BD-018, BD-003.

**Entry/return/bindings:** Judging Profiles → `judging.profiles(template_sha256)`/`ProfileDTO.comment_axes`; retained `ReviewDetail`, `InputManifest`, `DomainEvidencePlan`, `ObservationContext`; form uses shared M12.1 validator through BD-009. Return keeps selected group/case; profile browsing never changes a retained rubric.

**Content/states:** exact frozen version/digest/order, all six grades even at zero weights, three scoped comment labels, domain modes/authority/coverage/gaps and actual required evidence. Missing required coverage, missing raw response and ungraded deficiencies are visible without a replacement score. **Deliver:** one schema-driven six-family component for terminal and responsive form; specification `spec` first and design-maintainability/implementer-usability labels; no file-count or metric-derived grade.

#### BD-044 — blinding across variants and grading backends

**Owner/R:** M12.3/M12.5; R190, R189, R184–R188. **Status/evidence:** update-needed Judging/ReviewDetail and new anonymous form/queue; reuse BD-021 rather than a separate privacy screen. **After:** BD-041, BD-021.

**Entry/return/bindings:** M12.1 recursive anonymous `AssessmentInput` allowlist and `judging.status`/Human `CaseView` govern the projection. Native trusted review/group provenance may show the judge's own variant; anonymous case/assessment has no competitor variant/detail endpoint. **Content/states:** competitor base/quant/fine-tune/adapter/merge, creator/date/proof/annotation identity absent from payload, DOM, URLs, labels, downloads and queue order. Preserve legitimate product-model terms and approved artifact semantics; Human has reviewer/form identity without model fields. **Deliver:** sentinel-bearing source fixture versus admitted JSON/DOM/evidence labels for all six families/three backends, including partial/unavailable evidence; state practical blinding limits without claiming erased human prior knowledge.

Trusted detail returns to its selected Judging/Results row; the anonymous form returns only to its own scoped queue through BD-009. A cross-media link cannot reveal competitor provenance to the case.

#### BD-008 — pending Human run, reopen, stop and recovery

**Owner/R:** M11.5/M12.3/[M14.2](M14/02-curated-cli-flows.md)/M15.3; R189. **Status/evidence:** update-needed RunOverview/RunReattached/Judging/JudgingTrials/JudgingDone/CliRun/CliStatusStop/StopConfirm/StopCleanup. **After:** BD-007, BD-015, BD-003.

**Entry/return/bindings:** post-seal original admission → `runs.status.human_review`, `judging.status.pending_human_cases`, `judging.human.status/reopen`; `judging.human.case.changed/batch.changed` use judging topic/EventCursor. Manual reopen returns to unchanged run/batch; `runs.stop` versus `judging.stop`/`jobs.cancel` follows original/additional scope.

**Content/states:** existing `judging`, `wait_reason=human_input`, “Awaiting human review”; pending/draft/submitting counts and trusted references, including current=None compact state. One automatic queue-open attempt after all seals; opener/headless/SSH failure, manual reopen, recovered pending with no automatic reopen, credential expiry, persistence/recovery error versus deliberate wait. Show accepted-intent drain then submitted/ungraded/skipped/cancelled/invalidated dispositions. Human wait releases automated FIFO/resources/leases. **Deliver:** close/detach/timeout settles nothing; headless private opener handoff separate from credential-free status; stop and additional cancellation with intact draft/receipt paths and final report still pending for originals.

#### BD-009 — responsive anonymous Human queue, evidence and form

**Owner/R:** M12.5; R189, R184–R188, R190–R191. **Status/evidence:** **new browser artifact**; no Human page exists in the prototype. Terminal form layout is not applicable; BD-007–008 own wide/compact selectors and status. **After:** BD-008, BD-021, BD-044.

**Entry/return/bindings:** single scoped local `/review/` queue opened by M12 after admission or explicit reopen; no report entry opens it. Use the exact M12.5 HTTP v1 table: `POST /api/v1/sessions`; session/case/evidence GETs; `PUT /api/v1/cases/{case_id}/draft` with If-Match/base_version; `POST .../submissions` or `.../skips` with Idempotency-Key; `GET /api/v1/operations/{operation_id}` until durable receipt. Form uses `CaseView`, shared exact-grade parts and `HumanCommitReceipt`; native clients use `judging.human.*`, not an exposed generic RPC proxy. Back to queue preserves only this case's acknowledged draft; the next case clears all fields/evidence selections.

**Content/states:** frozen anonymous permutation and opaque case/evidence aliases, six ordered sections with nine unselected half-step choices each, anchors, substantive rationale/admitted-evidence picker, three required comments and explicit limitations or deliberate empty-list choice. Actual web/native images and text-domain coverage/deficiencies appear as inert evidence. Show fresh unanswered, Unsaved/Saving/Saved(version)/Save failed/Conflict; linked field errors; explicit unable-to-assess reason and ungraded submission; skip reason preserving diagnostics; Submitting after 202 versus real committed receipt/read-only own answers. Include expired/revoked bootstrap/session, stale cursor, binding changed, inaccessible evidence, digest mismatch, partial text/range, oversized/unsupported image, rate limit, offline/network and unavailable storage. Exact accepted retry can return the same receipt despite old base_version; conflict never silently overwrites.

**Privacy/medium/deliver:** desktop queue/coverage beside evidence/form; narrow viewport stacks identical controls with visible submission state, keyboard fieldsets, focus/error summary, live save announcements and zoom. Deliver controller-layout references at desktop 1280×900 and narrow 390×844 plus zoom/reflow; these design test viewports do not redefine the benchmark artifact's web/native capture matrix. Include navigation/error-state storyboard and HTTP/status/action annotations for all six family fixtures. No prefilled grades, prior-case answers, benchmark metrics/weights/native IDs/builder lineage, other reviews, model controls, candidate execution/live preview, remote evidence, or report/export controls. Tokens appear only in the private bootstrap handoff and page memory per M12.5; never in fixture credentials, persisted DOM, URLs after exchange, logs or offline artifacts. Browser evidence and real persistence/security tests remain separate implementation gates.

#### BD-011 — actual JudgeGroup routes and billed assessments without reviews

**Owner/R:** M12.3/M02.3/[M13.1](M13/01-offline-report-artifact.md)/[M17.3](M17/03-exchange-screens.md); R191–R194. **Status/evidence:** update-needed Judging/ReviewDetail/ResultReviews/ReportPage/ResultPackage; new assessment diagnostic detail may extend existing evidence viewers. **After:** BD-029, BD-003.

**Entry/return/bindings:** trusted judging/result/report/package detail reads existing `judging.status`, `results.get/evidence/read_evidence` and report/exchange projections. `JudgeAssessmentIdentityV1`/`JudgeAssessmentReceipt` bind actual result/full trial, actual group, original/additional purpose and reserved_review_id. The internal `ResultRecorder.open_judge_assessment` is **not a user action or new public method**. Return to the selected group/assessment, independently of the competitor.

**Content/states:** judge access/launcher profile, model/effort/treatment differs from assessed competitor; original/additional groups remain separate. Pre-review, failed, cancelled and not_judged work may retain real billed calls/routes with partial/nonzero cost and **no Review or grade**. A reserved ReviewId is a reserved identity, never a completed review link. Show optional actual Review only after publication; inspect call evidence before/without it. Native System One/Human groups have no generic harness profile fields. Late applicable judge evidence can stale the selected-group analysis without changing competitor seal. **Deliver:** distinct competitor/judge provenance panels and pre-review → committed-review or no-review-disposition paths across terminal, offline HTML and ZIP contents; no hop/asset fan-out into duplicate score rows.

#### BD-010 — committed Human reviews in results, scores and output readiness

**Owner/R:** M02.3/M06.2/M10.3/M13.1–2/M13.4/M17.3; R189. **Status/evidence:** update-needed ResultReviews/Rejudge/ReviewDetail/ReviewUngraded/Rankings/ScoreBreakdown/TimingPhases/ReportGenerate/Progress/Ready/ReportPage/ResultPackage/ResultImport/ExportResult. **After:** BD-009, BD-011.

**Entry/return/bindings:** retained result → `RejudgeRequest(result_id,judge:JudgeSelection)`/explicit `judging.rejudge`; score DTOs from M06; `reports.plan/generate/status`; `exchange.plan_result_export` with wait_reason/human_pending_count. Reopen routes explicitly through M12/SystemOpener.open_review_url; ordinary result/report navigation returns without opening a host.

**Content/states:** self-declared reviewer/form-policy group distinct from machine/other reviewer; human_authored raw grades/comments/limitations and ungraded deficiencies. Model usage/API cost not applicable; labor unmeasured; human wait/edit/submit timing separate from competitor measurements. Pending original disables finalized report/export with counts/remedy; pending additional leaves original ready. Missing selected-review trial excludes the whole subject under owner rules, even with quality weight zero. **Deliver:** pending versus committed original/additional flows, no fabricated Q, committed inert HTML/ZIP with no drafts/session/credentials and no form/model invocation on offline read/reweight/import.

#### BD-035 — durable Human receipt and atomic export/import feedback

**Owner/R:** M12.5/M11.5/M17.3; R191, R189. **Status/evidence:** update-needed pending-run/ResultImport/ExportResult; new receipt and HumanRecoveryPending browser states reuse BD-009. **After:** BD-010.

**Entry/return/bindings:** accepted Human intent → `HumanSubmissionSink.commit` → actual M02 review/disposition receipt/publication → existing status projections; exchange uses current M17 canonical import/export ports and `PublicationView`. These internal ports annotate design transitions, not browser calls. Return preserves original operation/batch/result.

**Content/states:** working draft, accepted SUBMITTING, lost acknowledgement, typed HumanRecoveryPending, real SQL committed receipt, stop/invalidation race and exactly-once replay. Import exposes all accepted rows together; backup differs from selected canonical ZIP. **Deliver:** no success on HTTP 202/file copy, pending recovery remains pending, before/after publication and cancel-won/commit-won storyboard; private draft/controller material omitted from report, ZIP and database-backup claims.

### Pass E — inspect evidence, compare subjects and retain analysis

#### BD-022 — family-aware quality weights and report components

**Owner/R:** M06.2/M13.1–4; R184–R188. **Status/evidence:** update-needed Rankings/ScoreBreakdown/WeightsEditor/ReportGenerate/Defaults/Ready/ReportPage; share BD-037/039 components. **After:** BD-021.

**Entry/return/bindings:** Profiles/Setup/Rankings → `scoring.weight_choices/preview_weights/validate_weights` with rubric_ref; `ReportSnapshot`/`ProfileSpec`, `reports.plan/generate/status`, existing offline exact-analysis vectors. Return retains frozen group/rubric, selection and originals.

**Content/states:** dynamic family order including specification spec first; ref-bound defaults/presets, exact zero/positive validation and raw business gate independent of zero weight. Separate family/version/group and metric tables, unknown required coverage versus unrequired image, native captures and no-JS evidence. **Deliver:** all-six-family editor/breakdown/no-JS examples from one component; changing family selection cannot reinterpret retained grades or silently move the business gate.

#### BD-037 — eight ranking factors and exact breakdown

**Owner/R:** M06.2; R175–R176. **Status/evidence:** update-needed WeightsEditor/Invalid/Rankings/ScoreBreakdown; rendered-reference WeightsFactors/RankingsFactors/ScoreBreakdownFactors lacks complete compact/error coverage. **After:** BD-022, BD-036; completes BD-038 handoff.

**Entry/return/bindings:** `scoring.weight_choices/preview_weights/validate_weights/rank/breakdown/export_weights`; preset save via existing `configs.save_preset`. Setup says Use weights; analysis says Apply as alternative. Return complete plan, policies and caller selection; cancelled prompt sends no write.

**Content/states:** exact eight keys cost/time/quality/generation_rate/input_tokens/output_tokens/file_count/loc, separate quality weights, fixed cost/time lower and quality higher, five explicit higher/lower/unset selectors, basis/policy choices. Missing positive direction, malformed/negative/all-zero plan, incompatible/partial cohort, no qualifiers, persistence/query/export error; disabled extras stay visible without requiring data. Dynamic enabled reference/contribution rows, full expected roster and per-trial exclusions, originals/common-original/profile-default/alternative/reset distinctions. **Deliver:** keyboard/compact editor, field-specific invalid state, exact values beside approximate graphics, independent specialized ranks and no client arithmetic or new score formula.

#### BD-042 — variant comparison, facets and annotation history

**Owner/R:** M02.3/M06.2; R190. **Status/evidence:** new variant compare picker; update-needed Results/ResultOrigin/Rankings/RankingsTrials/ScoreBreakdown. **After:** BD-041, BD-043, BD-037.

**Entry/return/bindings:** `results.list/get` plus full `VariantFilterV1`; explicit `results.annotate_variant` with operation/prior-snapshot refs; `results.variant.annotated` refreshes owner projections. `scoring.rank/breakdown` carry complete comparison/control-signature/metadata selection. Return preserves pinned cohort/ref/cursor or exposes stale-resync remedy.

**Content/states:** As recorded/With annotations with visible differences/history and mandatory mismatch in both views; quantization/fine_tune weights_only/package/joint/exploratory modes; explicit Matched view/control-signature selection_required. Show field confounds/affected TrialRefs, creator node+role/date node+kind/range/precision filters, definite/possible/unknown date matches, Unknown sorted separately and stable IDs despite alias collisions. Strict variants hold harness fixed. **Deliver:** whole-subject counts, unknown/mismatch/filter-empty/stale/conflicting annotation states and explicit correction review; no automatic source lookup, favorable-trial selection or alteration of original metrics.

#### BD-030 — harness comparisons in retained results and rankings

**Owner/R:** M02.3/M06.2; R192–R194. **Status/evidence:** update-needed Results/detail/filter and Rankings/ScoreBreakdown, reuse BD-027 matrix presentation. **After:** BD-027, BD-028, BD-037, BD-042.

**Entry/return/bindings:** `results.list/get/evidence`, `ResultFilters.harness_comparison`, `scoring.rank/breakdown`, `HarnessComparisonSelectionV1`/`HarnessComparisonV1` and `AnalysisSnapshotRef`. Return retains matrix selection/cutoff and exact JudgeGroup. **Content/states:** harness axis separate from variant tier; confirmed/unverified/exploratory/mismatch independent of N/6; unavailable six-cell rows without zero scores. Show ordinary same-harness profile/treatment comparisons, whole subjects/trials/groups, actual failed trials, both-axes-varied factorial disclosure, late-evidence stale analysis and inert retained sources. **Deliver:** confirmed subset, exploratory all-six, unsupported row, mixed-axis and no-comparable results at both sizes; no invented score for an unselected or unmaterialized cell.

#### BD-033 — database path, info, snapshot and external-analysis guidance

**Owner/R:** M02.3/[M14.1](M14/01-registry-cli.md)/M14.2; R191. **Status/evidence:** new DatabaseInfo/DatabaseSnapshot within Results and CLI database presentation; reuse shared file/job dialogs. **After:** BD-036.

**Entry/return/bindings:** Results database action or `axbenchmark database path/info/snapshot --output PATH` → `database.path()`, `database.info(statistics="available"|"exact")`, `database.snapshot(output,overwrite=false)`; exact stats may return a cancellable statistics_job. Job follower/subscription preserves operation and output; return to Results without client SQL/file access.

**Content/states:** absent DB discovery without creation/migration, configured path/access, application/runtime/schema/view versions, publication, table/view grains/count availability, read-only guidance, explicit exact-count work. Snapshot output/progress/cancel/ready path-size-checksum-pin, protected source/target, existing-output conflict, busy/corrupt/unreadable/unsupported runtime/schema and migration failure remedies. **Deliver:** both terminal layouts and CLI text/JSON parity; guidance links to [versioned views and examples](RESULTS-DATABASE.md#public-sql-and-discovery) and [SQL examples](sqlite/analysis-examples.sql), recommends read-only/pinned snapshot queries, exact numerator/denominator versus approximate plots and grain-safe joins. Show database backup versus sanitized selected ZIP and evidence-file availability; no automatic SQL editor, mutation RPC, legacy migration/backfill or disclosure claim.

#### BD-034 — saved-analysis identity and freshness across surfaces

**Owner/R:** M02.3/M06.2/M13.1–4; R191. **Status/evidence:** update-needed Results/Rankings/ScoreBreakdown/ReportGenerate/Progress/Ready/ReportPage; shared provenance component is new. **After:** BD-033, BD-037, BD-042, BD-030, BD-011.

**Entry/return/bindings:** M02 `AnalysisSnapshotRef {analysis_id,analysis_digest,input_digest,publication_id,status,freshness}`, sink-backed `scoring.rank/breakdown`, `reports.plan/generate/status`, offline `AnalysisState`. Return preserves saved ref and full filter/roster/review/annotation dependency pin.

**Content/states:** saved/current, captured freshness, historical stale, pending or persistence-failed versus saved, changed cohort/review/annotation/judge-route dependency and typed snapshot-changed recovery. Historical inspection does not mark current; refresh requests owner analysis. Offline changes/download are explicitly unsaved local derivations tied to original saved ref; a static file cannot know later database changes. Exact values/official ties are separate from approximate geometry. **Deliver:** one shared badge/detail component across terminal and report, stale-before-recompute and lost-save-ack paths; no local “saved” success or reused ID for changed browser analysis.

### Pass F — standalone reports, portable archives, CLI and complete journeys

#### BD-005 — pinned context and decision provenance in output

**Owner/R:** [M13.3](M13/03-report-charts.md)/M13.4/M17.3; R164, R166, R171–R172. **Status/evidence:** update-needed ReportGenerate/ReportPage/ResultPackage/ExportResult; extend existing TASK_EVIDENCE part. **After:** BD-002, BD-003, BD-034.

**Entry/return/bindings:** pinned `ReportSnapshot`, per-capture `ContextAnalysisSelection`, backend-specific JudgeGroup through `reports.plan/generate/status` and M17 existing plan/export APIs. Return to originating result/report or package selection.

**Content/states:** native-only, no selected analysis, pending/partial/failed analysis as content notes, separate counts/labels/membership, no forced 100% chart. Two captures can select different analysis cutoffs. Classifier completion never gates report/export; ordinary capture durability and original reviews still do. Unknown future re-execution capability remains explicit. **Deliver:** no-JS retained context tables and static timeline/partition only where supported; immutable offline cutoff and ZIP summary without analysis resume, network call or profile activation.

#### BD-017 — authoring and commit provenance through report/ZIP/CLI

**Owner/R:** M13.1/M17.3/M14.2; R177–R183. **Status/evidence:** update-needed ReportPage/ExportTemplate/ResultPackage/ExportResult/CliHelp/Run/Doctor/Exchange. **After:** BD-016, BD-013.

**Entry/return/bindings:** retained template/run → `reports.generate`, `exchange.template_export_preview`, `exchange.inspect_package`, `exchange.plan_result_export`; CLI manual creation uses `planning.create_manual`. Existing owner factories return to selected template/run/UID.

**Content/states:** benchmark/domain/derived target/legacy, explicit stage order, immutable snapshot/history proof, scoped commits and source-independent imported baselines. `--spec` is the approved flag in both-mode examples, not `--spec-file`. Show invalid input, pending capture/retention, unsupported version and removed-source evidence without refreshing it. **Deliver:** wide/compact summaries plus no-JS/offline details and CLI goldens; no command creates competitor commits or executes imported checks; retain original built-in bytes and old-result interpretation.

#### BD-023 — domain evidence in retained clients and portable output

**Owner/R:** M02.3/M10.3/M14.2/M17.3/M15.3; R184–R188. **Status/evidence:** update-needed Results/ResultReviews/Rejudge/Measurements/CliRun/Status/Report/Exchange/ResultPackage/ResultImport/ExportResult. **After:** BD-020–021, BD-010.

**Entry/return/bindings:** `results.list/get/evidence`, retained measurement auxiliary projections and current exchange preview/import/export DTOs; M15 injected factories preserve result/trial/family. Return/reconnect never reruns evidence acquisition.

**Content/states:** frozen family/evidence summaries, partial/unknown coverage and modality, artifact_verification auxiliary usage distinct from competitor/grader/observer, offline inert files and imported unknown capabilities. **Deliver:** six-family wide/compact navigation/goldens, shared evidence-detail component and no-JS equivalent, missing evidence/remedy and all-or-none import feedback; no per-family duplicate screen or invented runtime proof.

#### BD-031 — full comparison matrix in offline reports

**Owner/R:** M13.1–4; R192–R194. **Status/evidence:** update-needed ReportGenerate/Progress/Ready/ReportPage and offline table/chart/what-if/export controls. **After:** BD-030, BD-034, BD-011.

**Entry/return/bindings:** `reports.plan/generate/status`, pinned `ReportSnapshot`, browser `AnalysisState`, M06 exact parity vectors and existing CSV/JSON exports. TUI returns to selected analysis; browser navigation is local and keeps original saved ref.

**Content/states:** no-JS full six-cell matrix, exact target/native effort/route/profile/treatment and cutoff, helper/retry cost coverage, one row per subject despite hops/assets, unavailable cells without fake chart points. Label harness/variant/factorial, saved engine analysis/freshness versus unsaved what-if and snapshot-changed error before publication. Include independent actual judge group and billed no-review evidence from BD-011. **Deliver:** desktop/narrow report layouts with inert network-disabled evidence, chart omissions and inspectable reasons, no current endpoint probe or automatic source refresh.

#### BD-032 — profile/route CLI, exchange and shell integration

**Owner/R:** M14.1–2/M15.3/M17.3; R192–R194. **Status/evidence:** update-needed CliHelp/Doctor/Run/Exchange, ResultPackage/ResultImportConflict/ExportResult and shared routes; new CLI/profile-detail variants within these families. **After:** BD-027, BD-026, BD-011.

**Entry/return/bindings:** current M04 profile methods, M03 `environment.qualify_route`, M07 `configs.existing_agent_select/comparison_export`, existing `runs.launch`; `exchange.inspect_package/inspect_results/plan_result_export/export_results/import_results` and M15 registry/SubscriptionHub. Return restores prior scope and stale revisions retain choices.

**Content/states:** inspect/register/select/probe are separate, explicit independently supplied source with no private defaults; six-cell JSON output, blocked exported plan, guarded no-overwrite output, inactive imported profiles, complete comparison roster with partial selected results, immutable profile/access/group/assessment conflicts, atomic import and failed publication. **Deliver:** CLI text/JSON and keyboard journeys; existing-agents/access-profiles/compare-harnesses commands use owner flags; `run --config` alone executes. Back/navigation performs zero calls; exported credentials/local source locators never appear.

#### BD-039 — statistics and eight-factor report analysis

**Owner/R:** M13.1–4; R173–R176. **Status/evidence:** update-needed ReportGenerate/Defaults/Progress/Ready/ReportPage; existing ReportPage is static reference, not production scorer evidence. **After:** BD-036–038, BD-031, BD-034.

**Entry/return/bindings:** complete `WeightSelectionDTO`/policies/filters through `reports.plan/generate/status`, saved AnalysisSnapshotRef, browser AnalysisState and shared M06 exact BigInt/rational parity. Return/cancel keeps original plan; report jobs follow owner status after cache expiry.

**Content/states:** four primary/no-JS statistics, pooled/count basis/coverage, dynamic enabled-factor stacks/legends, complete controls/export, original/default/alternative/reset and independent specialized-rank states. Distinguish settled unknown metric from pending timing/inventory/analysis durability; stale plan, snapshot_changed, bad/existing path, failed/pending persistence, cancel before commit, commit-won-cancel and opener warning retain path. **Deliver:** no-JS table/charts and responsive interactive controls with unsaved local label; exact tooltips/exports beside approximate geometry, zero network/inference and no invented statistical certainty.

#### BD-040 — statistics CLI, resize/reconnect and portable completeness

**Owner/R:** M14.1–2/M15.3/M17.3; R173–R176. **Status/evidence:** update-needed CliStatistics, composition journeys, ResultPackage/ExportResult. **After:** BD-036–038, BD-039.

**Entry/return/bindings:** registry-driven measurement/scoring/report DTOs, complete ranking plan, owner screen factories and current exchange inspect/export methods. Return and resync preserve plan, policy, exact filter/group and scope; CLI errors use owner field paths.

**Content/states:** pooled versus mean/total/source/coverage labels, field-specific direction errors, unknown cached/reasoning/files/LOC, portable partial content versus pending durability, output conflict/cancel and stale selection. **Deliver:** human/JSON goldens and one resize/reconnect walkthrough with all eight factors; portable package contents preserve policy/receipts/inventories without client ranking decisions or measured fields entering judge input.

#### BD-045 — portable variant comparison and provenance

**Owner/R:** M13.1–4/M14.1–2/M17.3; R190. **Status/evidence:** update-needed ReportGenerate/Defaults/ReportPage/ResultPackage/ResultImportConflict/ExportResult/CLI help; share BD-031/039 components. **After:** BD-042, BD-039, BD-032.

**Entry/return/bindings:** `reports.plan/generate(filters.variants=...)`, shared production offline M06 parity, registry `--params/--params-file`, `exchange.inspect_package/inspect_results/plan_result_export/export_results`; return preserves mode/scope/signature/metadata view and full roster.

**Content/states:** static/interactive lineage, creator-role/date-kind/precision/proof, pinned annotation and control selection, exploratory confounds and omitted points, declared-only package preview versus validated record integrity, descriptor/annotation conflicts, unknown versions, partial evidence and stale snapshot. Package metadata/evidence, never model weight binaries. **Deliver:** no-fetch no-JS and responsive interactive examples, CLI/ZIP text parity and all-or-none conflicts; unchanged complete subject/trial roster, original measurements and mandatory exclusions in both metadata views.

## Design delivery worklist and acceptance gates

Design passes A–F close the 45 pending groups above. Review shared content together: BD-038/037 are one setup/editor handoff; BD-021/009 are one rubric component rendered in two media; BD-011/034 share actual-group freshness; BD-031/039/045 are one offline report, not three reports. After each pass, update its acceptance inventory with actual rendered states/sizes and remaining contract-only interactions. Do not claim a group complete merely because another group names the same screen.

| Prototype source family | Next design-engine responsibility |
|---|---|
| [screens.mjs](reference/design/wireframe-tui/src/screens.mjs), [boards.mjs](reference/design/wireframe-tui/src/boards.mjs) | M01 Library/NewTemplate/Template and revision routes; exact manual inputs, modes, target inspection and no-harness states. |
| [screens-planning.mjs](reference/design/wireframe-tui/src/screens-planning.mjs), [boards-later.mjs](reference/design/wireframe-tui/src/boards-later.mjs) | Manual capture/editor/order/approval, domain scope and optional planner; actual screen ownership stays M16. |
| [screens-readiness.mjs](reference/design/wireframe-tui/src/screens-readiness.mjs), [screens-setup.mjs](reference/design/wireframe-tui/src/screens-setup.mjs), [screens-decisions.mjs](reference/design/wireframe-tui/src/screens-decisions.mjs), [boards-modules.mjs](reference/design/wireframe-tui/src/boards-modules.mjs) | Six registry entries; API/existing-agent/variant profiles, exact qualification, matrix, independent roles, review and full weight handoff. Add bounded source files only when the existing family becomes unwieldy. |
| [screens-execution.mjs](reference/design/wireframe-tui/src/screens-execution.mjs), [screens-run.mjs](reference/design/wireframe-tui/src/screens-run.mjs), [screens-tui.mjs](reference/design/wireframe-tui/src/screens-tui.mjs) | Configuration/trial navigation, queued sixth rows, settings/variant mismatch, human pending/recovery, detach/stop distinction. M15 compact widget presents M11 data/actions. |
| [screens-verify.mjs](reference/design/wireframe-tui/src/screens-verify.mjs), [screens-judging.mjs](reference/design/wireframe-tui/src/screens-judging.mjs) | Immutable commit/domain evidence, three grading backends, exact rubric labels and actual judge assessment/group provenance. |
| New Human browser prototype under the design workspace, owned by M12.5 | Separate anonymous queue/form/evidence/draft/receipt asset; mirror M12.5 shipped-form structure conceptually without implementing an actual listener, credential service or application. Add its own responsive-browser inventory and entry from the TUI storyboard. |
| [screens-context.mjs](reference/design/wireframe-tui/src/screens-context.mjs), [screens-measure.mjs](reference/design/wireframe-tui/src/screens-measure.mjs), [screens-telemetry.mjs](reference/design/wireframe-tui/src/screens-telemetry.mjs) | Counts/labels/membership, pooled/mean statistics, independent availability and actual resource admission/coverage. |
| [screens-results.mjs](reference/design/wireframe-tui/src/screens-results.mjs), [screens-report.mjs](reference/design/wireframe-tui/src/screens-report.mjs), [screens-exchange.mjs](reference/design/wireframe-tui/src/screens-exchange.mjs), [screens-cli.mjs](reference/design/wireframe-tui/src/screens-cli.mjs) | One retained analysis/comparison/provenance model across Results, database dialogs, standalone report, ZIP and CLI; M17 keeps its own dialogs. |
| [ownership.mjs](reference/design/wireframe-tui/src/ownership.mjs), [navigation.md](reference/design/wireframe-tui/navigation.md), [system.mjs](reference/design/wireframe-tui/src/system.mjs), [animation.mjs](reference/design/wireframe-tui/src/animation.mjs), [verify.mjs](reference/design/wireframe-tui/src/verify.mjs) | Register IDs/owner/API/CONTRACT_ONLY, focus/keys/legends/go links and walkthroughs before generation. Retain existing refinement/M09/deletion states and checks. |

Do not hand-edit generated preview, animation or ownership-ledger outputs. Snapshot the current catalogs first and regenerate from sources; do not overwrite unrelated work or restore an old global board count. Presentation filenames in owner contracts are proposed files under `solution/axbenchmark/`, not runtime files supplied by this handoff.

### Existing contract-only states carried into these passes

The inspected ledger's existing lifecycle/navigation cases remain required. Fold them into the groups below and their shared state variants; they do not require additional top-level screens or another numbered backlog. Use current owner contracts to correct obsolete ledger/navigation prose during the future prototype pass.

| Existing owner/family | Acceptance subcases and design groups |
|---|---|
| M01 Library/Template/RevisionDelete/Revise/LaunchCheck | BD-012–013: retain all six deletion references, Cancel-first focus, returned delete_plan_id/effect/refusal, post-confirm race, cleanup_pending/expired token, restore/invalidation, full hash and executable baseline metadata. Revision and draft deletion retain their different owner actions; cancelled confirmation writes nothing. |
| M02 Results/Result/ReportReady; M06 Rankings | BD-010/030/034/036–037: same label/different UID, missing full-roster trial, invalidated immutable facts, read failure, exact/display/rate/billing provenance and mean/range, missing conversion, unverified zero cost, no qualifiers and opener failure retaining the path. |
| M03 Environment/CollectorGuide; M04 Catalog | BD-014/019/025–026: source/age and collector error, changed read-only remedy, explicit diagnostic consent; guidance runs nothing. Preserve separate model override, account billing and rates forms with their one matching save each; inherit/value/unknown, account scope, unknown rate, USD identity and units per 1 USD remain visible. Failed/cancelled refresh retains usable old rows. |
| M05 RunConfig/TaskBlocked/ModelRejected/RunIsolation; M11 live/stop | BD-015/028/043/008: lost snapshot, protected-role refusal, missing evidence, late old-trial response, snapshot/replay gaps, finalizing/retention_pending and separate cleanup/retention/report state. Run stop can remain available during judging/finalizing; completed configuration stop follows its disabled capability. Every report written/failed/cancelled/skipped disposition ends its proper wait. |
| M07 Setup/review; M15 Help/Palette/WidgetStates/Prompt/RunListDetail | BD-004/014/027/038: once-only durable initial_progress warning, typed launch-binding failure, no duplicate launch on reconnect, stale consent, frozen UID/billing/rate provenance, actual event resync and return focus. Keep M15 presentation-only compact widget and M11 data/actions. Update old “4 of 4,” “up to four” and 2×2 navigation claims to the six-registry adaptive contract. |
| M08 verification; M09 inventory | BD-016/020/024: no target, unsupported codec, acknowledgement/storage pending versus observed failure, identity mismatch and exact phase/source selection. Preserve all 30 scrollable inventory checks, original task/history targets, T2 data-only evidence and independent commit checks; no display-only “also checked” claim. Missing built-in/invalid contract remains an error. |
| M10 measurements/context; M18 telemetry | BD-002/006/028/036: unpaired/mixed-basis timing, incomplete discovery, strict decode/inventory failure, no-rate/mixed-display money, source selection/rejection, real wrap versus reset/gap and actual requested/effective/observed intervals. Replace navigation's generic local-endpoint energy assumption with actual upstream locality and scoped owner accounting. |
| M12 judging; M13 report; M17 fourteen existing ZIP boards | BD-003/010–011/023/031–035/039/045: missing raw/artifact, partial cost, settling/engine-lost, invalidation, no resumed original model calls, commit-won cancellation, stale guarded output, subset readiness, UID/result/trial conflict and all-or-none recovery. Keep all M17 dialogs owned by M17; M01/M02 only inject entry/return factories. |
| M14 CLI; M16 planning/editor | BD-013/017/032/040: ambiguous RUN_REF lists UID/origin; paired tariff amount/currency, usage versus typed-error exit codes, one initial warning, all report dispositions. F17 static T4 label is already rendered; delayed selection/reopen/resize remains an interaction gate. Preserve full canonical closure, exact file bytes, versioned edits and regeneration recovery. |

The ledger's blanket “context additions unrendered” sentence is outdated for the named context/decision/statistics references listed above; only the missing states and runtime gates remain pending. Its old decision-config migration example does not authorize old-install migration/backfill: current contracts specify a fresh profile-based implementation with preserved historical archive/fixture bytes. Existing web screenshot counts describe the inventory fixture, not every domain's required evidence. Reconcile these precise labels in navigation, legends, ownership source and walkthroughs when regenerating designs.

### Required end-to-end walkthroughs

1. No harness/Git → Library New → one-shot exact input → empty/metadata-only target → manual capture/review/approval → saved template; execution disabled with remedy and zero planner calls.
2. Supplied multi-step → reorder/replace → populated non-Git or dirty Git subdirectory → exclusions → capture/exact approval → isolated trials/stages. Invalid UTF-8, duplicate input, excluded-only meaningful files and unsupported/unreadable entries cannot become scratch or approved partial content.
3. Source changed during capture, failed recapture, Hide/reopen, cancel/cleanup, interruption and expired job cache → durable state; edit/approve conflict → fresh preview. Approved source removal remains usable; refresh starts a new revision. Include legacy v1 with one task and unchanged built-in inventory.
4. Missing Git execution block → new-policy empty unborn HEAD and populated synthetic baseline → competitor first/empty milestone → pass/missing/dirty/rewritten/unreadable outcomes. Preserve separate process/check/grade, earlier-stage immutable verdict and artifacts. No repair/engine milestone.
5. Six native registry entries → Cursor/OpenCode provenance/clean/private-runtime limits → sixth queued configuration at jobs 1/4/5/6 → resize/detach/reattach/historical-trial evidence. One configuration spans all its sequential trials.
6. Independently fictional profile source → static inspect/register → existing/clean/overridden selection → model/effort/route conflict → explicit exact qualification with budget → all-six strict/subset/exploratory review. Generic auth success cannot substitute for qualification; stale source/consent preserves choices but blocks launch. Loopback remote inference retains remote accounting.
7. No System One profile → native readings/statistics/harness/Human still usable → explicit profile metadata/inference test → separate monitor/grader selection → context current/history/nested agents/gaps → local deferred/overlap/unknown-server state → two retained captures with different cutoffs. Reading/import never classifies.
8. Six rubric families → approved domain scope → prerequisite/modality failure or frozen evidence → final-artifact review. Include native wrong-build/required-cell gap, backend no-image, DevOps plan-only, agent mixed simulation/live boundaries and specification supplied-authority/structural-only. No new candidate action occurs in a judge/viewer.
9. Human selection → all-trial seal → one queue opener → fresh empty case → partial draft/save failure/conflict → validation errors → graded, explicit ungraded or skip → 202/storage delay → durable receipt. Next case clears fields. Tab close/expiry/detach/restart/opener failure stay pending; manual reopen recovers without auto-open/model call. Stop-versus-submit drains accepted intent; additional cancellation leaves original readiness intact.
10. Automated judge uses a different profile/model/effort from competitor → pre-review billed call → committed review **or** failed/not_judged with no Review. Inspect actual group/assessment/cost in retained results, report and ZIP; late judge evidence stales selected-group analysis without changing competitor facts.
11. Base/quantized fine-tune/multi-parent lineage → missing/conflicting creator/date proof → frozen setup → effective mismatch → affected full trials retained → As recorded/With annotations → fixed-harness Matched/control-signature versus varying-harness/factorial. Whole-subject filters, unknown dates and mandatory exclusions survive report/ZIP.
12. Four primary metrics → paired pooled throughput and full-roster means → all eight weights/directions/policies → invalid positive direction/incompatible cohort → original/default/alternative/reset → saved/current/stale analysis. Zero-weight unknown extra metrics do not exclude, while required grades/checks still apply; specialized ranks remain independent.
13. Absent database path/info creates nothing → explicit snapshot with busy/cancel/conflict/protected-path/ready outcomes → read-only grain/exact-value guidance. Retained/historical scores carry real pins; pending storage is never saved success. Canonical selected ZIP differs from analytics backup.
14. Reports plan/generate/progress/publication/opener warning and ZIP inspect/conflict/import/export across modes/domains/context/variants/routes. Pending original Human/durability blocks finalized output; pending classifier does not. Offline no-JS evidence and full matrix remain usable; local what-if/download is unsaved and never fetches or rejudges.

### Evidence required to close the design pass

**Static design gate:** all BD IDs map to registered source states or explicitly shared components; every applicable family has 120×40 and 80×24 evidence, focus/resize/return paths, error/recovery states and current owner API annotations. Inspect generated pages for clipping, footer overlap, inaccessible actions, unsafe markup and misleading unknown/zero/status labels. For the separate Human page and offline report, inspect desktop and narrow responsive layouts, keyboard/zoom, error focus and inert evidence. A board count is an inventory, not feature completion.

After future prototype edits, run from `spec/`:

```sh
node implementation/reference/design/wireframe-tui/src/build.mjs
node implementation/reference/design/wireframe-tui/src/animation.mjs
node implementation/reference/design/wireframe-tui/src/verify.mjs
python3 implementation/validate-specs.py --require-supplement-coverage
git diff --check
```

**Implementation gates still pending:** owning children must prove Textual/Pilot fake-client action counts and stale-response/epoch/revision handling; real engine DTO/codec/publication, exact arithmetic and M06/offline parity; native adapter/version/platform/evidence capabilities and resource admission; manual byte/order/source-safety/Git observations; SQLite snapshot/read-only/atomicity/freshness; and real M12.5 browser HTTP/auth/blinding/draft/receipt/stop/recovery behavior. Runtime browser tests must distinguish active loopback review from network-disabled `file://` report and exercise the existing platform opener. Unavailable providers/credentials/devices remain explicitly unverified. Passing document, SQL or static prototype checks satisfies none of those application gates.
