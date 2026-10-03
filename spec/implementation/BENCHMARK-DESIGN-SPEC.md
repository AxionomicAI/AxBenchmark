# Benchmark authoring, task commits and six-harness design handoff

Status: proposed design work for the design engine. This document specifies screen changes and acceptance gates; it does not claim those screens, APIs or harness integrations are implemented. Keep existing prototype work, including context analysis, decision engines and benchmark statistics. Reconcile the live catalogs before adding a proposed state ID; extend an existing matching state instead of duplicating it.

## Authority and reading order

| Read | Design responsibility |
|---|---|
| [Product SPEC](reference/SPEC.md), then [BENCHMARK-MODES](BENCHMARK-MODES.md), including [mandatory task commits](BENCHMARK-MODES.md#mandatory-task-commits) | Binding one-shot/multi-step, current-folder capture, isolated execution, per-task commit policy and legacy semantics. |
| [M01 library](reference/modules/01-template-library-identity.md), [M16 authoring](reference/modules/16-custom-template-planning.md) | Creation, typed inputs, jobs, drafts, exact-byte editing, versioned approval and public APIs. |
| [Cursor adapter](M05/08-cursor-adapter.md), [OpenCode adapter](M05/09-opencode-adapter.md), [M03 readiness](reference/modules/03-environment-readiness.md), [M04 catalog](reference/modules/04-model-catalog.md) | Executable/generation provenance, capability evidence, discovery, authentication and unsupported controls. Recheck vendor documentation before illustrating commands. |
| [M07 setup](reference/modules/07-run-configuration.md), [M11 orchestration](reference/modules/11-run-orchestration.md), [M15 shell](reference/modules/15-terminal-interface.md) | Frozen review, counts, registry-driven harness selection, live layouts and shared keyboard/focus behavior. |
| [CONTEXT-DESIGN-HANDOFF](CONTEXT-DESIGN-HANDOFF.md), [DECISION-ENGINES](DECISION-ENGINES.md), [BENCHMARK-STATISTICS](BENCHMARK-STATISTICS.md) | Companion surfaces and readiness gates that this pass must preserve. |
| [Navigation](reference/design/wireframe-tui/navigation.md), [ownership ledger](reference/design/wireframe-tui/ownership-ledger.md) | Existing routes, screen ownership, rendered sizes and contract-only cases; illustrative fixtures are not domain authority. |

For this refinement, the product SPEC, BENCHMARK-MODES and Cursor/OpenCode adapter contracts supersede old fixtures requiring a planner, a committed Git source or four/five harness lanes. Other owner contracts still govern transactions, identity, evidence and lifecycle behavior. Never copy obsolete fixture text into the new flows.

## Product choices and terminology

Use separate controls for **Benchmark type** (`One shot` / `Multi step`) and **Project type** (`Frontend` / `Backend` / `Fullstack` / `Mobile` / `DevOps` / `Agentic software` / `Specification design`). Display **Target mode** (`From scratch` / `Modify existing files`) as an engine-derived fact, never a toggle. Both benchmark types support both target modes.

One shot presents a multiline prompt editor or an import-from-file action, exactly one active input. Its saved UTF-8 bytes become the single task `T1`; file import preserves original bytes, whitespace, Unicode and line endings. Reading or previewing never resaves/normalizes a file. Invalid UTF-8 and empty/whitespace-only content show a field-specific error. Do not invent a separate global specification or shared-context editor for one shot.

Multi step presents an explicitly ordered list of at least two supplied primary specification files, one file per step. Show position, task ID, relative payload path, original filename, byte digest, validation and edited/imported state. Upload completion, filename sorting and filesystem order cannot change execution order. Provide Add, Replace, Remove, Move up and Move down; keyboard operation is required. Removing below two leaves a clearly incomplete draft or a visible refusal, never a conversion to one shot.

Changing benchmark type is explicit and visibly validates or clears incompatible inputs before continuing. Project type does not change task count. Optional shared specification files belong only to multi-step context and do not add steps. Distinguish those files from the primary ordered list.

**Generate with planner** is a secondary, explicit multi-step route for an idea; it keeps the existing reviewed planning workflow and seven-task default. Manual prompt/spec creation, inspection, capture, editing and approval make no model call and stay available without any installed harness. Hide or disable regeneration according to the engine's origin/capability facts; manual input never becomes a planner request as a recovery action.

Explain one shot with “1 competitor task per trial.” It can contain multiple harness API/tool calls. Checks, final capture, regression and grading are separate phases, not extra competitor tasks or an automatic repair pass. Multi-step stages use a continuing trial workspace and a fresh process/conversation per step; supplied files become available through the current step, with future primary files withheld. Do not claim to hide information already in the baseline.

## Screen and state change matrix

Names below are proposed board/state IDs, not new API methods. Reuse the named screen families. Every family needs 120×40 and 80×24 representative boards, with additional failures/variants and runtime interaction coverage as specified below.

| Existing surface → proposed states | Owner and presentation target | API seam and visible change |
|---|---|---|
| `Library`, `LibraryNoHarness` → `LibraryBenchmarkModes`, `LibraryManualNoHarness` | M01; `tui/screens/library.py`, `tui/viewmodels/library.py` | `templates.list/get`, `planning.unfinished`, `environment.report`; show benchmark/project type, task count, target mode and legacy marker. New/manual actions stay enabled without a harness; run capability remains independent. |
| `NewTemplate*` → `NewTemplateMode`, `NewTemplateOneShot`, `NewTemplateMultiStep`, `NewTemplateInputInvalid` | M01; `tui/screens/new_template.py`, `tui/viewmodels/new_template.py` | Hold explicit mode/project/exact inputs and reviewed profile refs; call `planning.inspect_target`, then `planning.create_manual`. Clear distinction between Continue to review and optional Generate with planner. |
| Target section → `TargetInspecting`, `TargetFromScratch`, `TargetModify`, `TargetExclusions`, `TargetInvalid`, `TargetChanged` | M01 creation host; M16 inspection/capture facts and recapture review | `planning.inspect_target`; render selected root, derived mode, counts/bytes, policy, exclusions, change token and path-specific problems. No client-side folder enumeration or emptiness rule. |
| New manual operation → `ManualCapture`, `ManualCaptureFailed`, `ManualCaptureInterrupted`, `ManualCaptureCancelling` | M16.5; `ManualCaptureScreen` / `ManualCaptureFailedScreen`, `tui/screens/planning.py`, `tui/viewmodels/planning.py` | `planning.operation`, `jobs.get/cancel`, `planning` and `job:<id>` subscriptions; import/capture/validate/persist, zero planner/model labels. Durable result opens shared draft review. |
| `PlanReview`, `PlanEdit`, `PlanReopened` → `DraftOneShotReview`, `DraftMultiStepReview`, `DraftSpecOrder`, `DraftInputEdit`, `DraftVersionConflict` | M16.5; shared `PlanReviewScreen` / `TaskEditorScreen` and planning view models | `planning.draft/draft_task/edit` with `base_version`; review exact inputs, order, evaluation definitions and capture. Restore selected task/input on reopen. |
| `PlanApprove*` → `DraftApprovalReady`, `DraftApprovalIncomplete`, `DraftApprovalStale`, `DraftRecapture` | M16.5 for new drafts; M01 revision flow remains owner of revision approval | `planning.approval_preview/approve/recapture`; show preview version, full identity, completed snapshot, issues and identical-revision outcome. Approved refresh opens M01 revision flow first. |
| `Planner*`, `Planning*` → `PlannerOptionalMultiStep` | M16.4; existing planning screens/view models | Explicit `planning.defaults/create_request/planner_options/start`; retain model-call consent and failed/interrupted recovery. Manual navigation never passes through these screens. |
| `TemplateTasks`, identity/details → `TemplateOneShot`, `TemplateMultiStep`, `TemplateLegacyV1` | M01; existing template detail screen/view model | `templates.get/tasks/manifest`; ordered primary files, shared context, target mode, snapshot and v1/v2 facts. One-task v1 stays “Legacy multi step,” never inferred one shot. |
| `Environment*` → `EnvironmentCursorMissing`, `EnvironmentCursorAuth`, `EnvironmentCursorUnknown`, `EnvironmentOpenCode`, `EnvironmentSixHarnesses`, `EnvironmentGitMissing` | M03; `tui/screens/environment.py`, existing readiness view model | Existing `environment.report/recheck/verification_plan/verify`; separately display installed provenance/generation, authentication, headless usability, Git execution readiness, source/age and remedy. Guidance does not install or log in automatically. |
| `Catalog*`, `ModelPicker*` → `CatalogCursor`, `ModelPickerCursorUnknown` | M04; existing catalog/model-picker screens/view models | M04 `catalog.*` choices/checks/refresh; exact model selection, source/date, unsupported or unknown effort/local endpoint. No guessed model names, defaults or flags. |
| `Catalog*`, `RunIsolation` → `CatalogOpenCode`, `OpenCodeGenerationUnknown`, `OpenCodePrivateBlocked`, `OpenCodeCleanBlocked` | M04 catalog; M05.7 execution details | Existing catalog/harness projections; generation-specific model/variant/native provider facts, private V2 runtime evidence, role/clean limitations. No generation or capability inferred from command name. |
| `Setup*`, `ReviewLaunch`, `LaunchRecord` → `SetupSixHarnesses`, `ReviewOneShot`, `ReviewMultiStep`, `ReviewRequiredCommits` | M07; `tui/screens/setup.py`, existing setup view models | `configs.open/setup/review`, existing mutations and `configs.launch_record`; modes, ordered stages, frozen capture, locked mandatory commit policy and returned trial/task totals. Include OpenCode after Cursor after Pi. |
| `CleanModeBlocked`, `RunConfig`, `RunIsolation` → `CursorCleanBlocked`, `CursorCapabilityLimited` | M05.7; existing execution screens/view models | Existing harness policy/configuration projections; separate unsupported category, requested/effective settings and evidence. Explicit current-mode choice is a reviewed change; never automatic fallback. |
| `RunOverview`, `RunReattached`, `RunListDetail`, `HarnessLive*` → `RunSixHarnesses`, `RunOneShot`, `RunMultiStep`, `HarnessLiveCursorLimited`, `HarnessLiveOpenCodeLimited` | M11 run/live data and actions; M15 presentation-only compact list/detail widget | `runs.status/log`, existing harness scoped APIs; all selected configurations reachable, task/trial identity and isolated snapshot visible, stage file named, unknown metrics retained. |
| `TaskChecks`, `RunConfig`, retained evidence → `TaskCommitPending`, `TaskCommitPassed`, `TaskCommitMissing`, `TaskCommitDirty`, `TaskCommitUnverified` | M08 verification facts, M05/M11 execution presentation; M02/M13 retained views | Existing verification/harness/result projections; task-scoped commit protocol status, start/end HEAD, commit/tree IDs, scope and causes. No new commit-management API. |
| Results/report/ZIP summaries → `ResultBenchmarkMode`, `ImportedBaselineDetails` | Existing M02/M13/M17 owners | Existing retained-result/report/exchange projections; preserve mode, stage order, legacy marker and packaged snapshot provenance. Import/reuse never refreshes a live source. |

Presentation paths in this matrix are proposed files relative to `solution/axbenchmark/`. The design engine changes prototype sources, not application implementation or engine contracts. M15 owns shared confirmations, focus, palette and layout primitives; feature owners supply DTOs, actions and API calls.

## Target inspection and capture experience

Label the picker **Target folder**. Accept an existing readable empty/populated directory, non-Git project, Git worktree or selected subdirectory. Show that exact root. A parent Git repository is context only; it cannot widen the selected root or replace current files with `HEAD`.

After inspection, display the returned state using these cases:

| State | Required presentation and action |
|---|---|
| Empty or administrative metadata only | “From scratch”; show ignored policy entries and zero meaningful content. Empty directories, `.git`/`.hg`/`.svn` metadata and `.DS_Store`/`Thumbs.db` follow the versioned engine policy. Continue depends on `can_continue`. |
| Populated, including dirty/staged/untracked files | “Modify existing files”; show admitted file count/bytes and exclusions. Explain that eligible current working-file bytes are captured, including changes outside commits; index/HEAD do not override them. |
| Non-Git folder / Git subdirectory | Normal valid source; no initialization of the original folder or “not a repository” capture error. Git setup occurs only in an isolated trial according to the frozen protocol. Show optional source Git provenance only when returned. |
| Excluded-only meaningful content | Keep modify classification with `baseline.no_admitted_files`; Continue disabled. Show excluded paths/reasons and review-policy/change-folder remedy; never turn it into scratch. |
| Missing/unreadable/unsupported/colliding entry | Exact path, reason and engine remedy; no green empty state. Symlinks are never followed; an explicit reviewed exclusion is available only if the engine permits it. |
| Inspecting or inspection failed | Loading state distinct from zero files; preserve user input and last labelled facts, disable dependent continuation, expose Retry. Ignore stale responses after path/policy change. |
| Source changed or inspection stale | Show changed facts, invalidate the affected preview, offer explicit reinspection and reviewed recapture. Never accept new bytes under an old confirmation. |

Exclusion details must remain accessible at compact width: relative path, reason, policy/version, admitted counts and any required-input conflict. Do not use “ignored by Git” as the definition of exclusion. Source paths/timestamps/Git labels are provenance; identity covers admitted relative paths, bytes and executable flags.

Before starting capture, use plain copy: “Capture this folder once. Each configuration and trial works in its own copy. Your source folder stays unchanged.” Do not promise an atomic filesystem snapshot; details can describe the engine's before/copy/after consistency check.

Manual progress shows `import_inputs → inspect → snapshot → source_unchanged → validate → persist` using returned stage states and indeterminate progress when no percentage exists. Publish “Ready for review” only for a complete durable draft; a completed file-copy bar alone is insufficient. No planner model, planning cost or synthetic planner log appears.

Separate **Hide** from **Cancel**. Hide/Escape detaches the view while work continues and leaves an unfinished Library row. Cancel issues `jobs.cancel`, displays cleanup/settlement, then the durable cancelled failure; partial capture never appears approved or ready. Discard is a separate confirmed action over an inactive operation/draft.

On engine interruption, reopen the durable failed operation without silently restarting capture. Retry respects the original idempotency binding; changed inventory requires explicit reinspection/review. Completed snapshots and previously complete draft content survive an unsuccessful recapture. Show the unresolved refresh issue and engine approval capability until the user resolves it.

An unchanged completed capture may be approved after its original source disappears. There is no background poll that refreshes approved bytes. **Refresh from folder** is explicit: `planning.recapture` for an open draft with its `base_version`; for an approved template, start a new revision first. Runs/retries/imports use packaged bytes.

## Review, approval and API behavior

The shared review screen shows name, origin, benchmark/project types, target mode, defining input files/order, exact checks/protocol/services/dependencies/rubric, completed snapshot digest, exclusions and source status. “Imported,” “Edited” and “Generated” describe file provenance. Reset-to-generated/regenerate only apply to generated files; manual origins have no planner selection or invocation cost.

One shot has a single prompt detail view and `T1` evidence target. Multi step has an ordered table with explicit move controls and a preview of the current primary file. Preserve optional common context separately. Read-only preview is not a save operation; editing saves explicit UTF-8 bytes and exposes the defining diff. No prettification, line-ending normalization or auto-paraphrase on navigation.

Show unresolved evaluation profiles and missing final-capture declarations as actionable approval issues. Valid explicit empty check suites convey “No behavioral checks declared,” not coverage or a passing score. UI grading needs the owner-required final artifact captures at both viewports; a prompt alone does not guarantee gradeability. Missing runtime evidence remains unverified/ungraded, not a trigger for a repair task.

| Action | Required engine sequence |
|---|---|
| Inspect selected folder | `planning.inspect_target(target_dir, exclusion_policy_ref?) → TargetInspectionDTO`; bind its opaque ID and returned facts to the shown form. |
| Create manually | `planning.create_manual(benchmark_type, project_type, target_inspection_id, inputs, evaluation_profile_refs, idempotency_key) → JobRef → DraftDTO`; one-shot discriminator has exactly one prompt input; provided-spec discriminator has the explicit ordered files. |
| Follow/reopen creation | `planning.operation(operation_id)` plus `jobs.get` and shared subscriptions; resolve owner IDs from typed responses, never derive them from the job ID. Terminal owner state survives job-cache expiry. |
| Edit/reorder | `planning.edit(draft_id, base_version, edit)`; update version only from success. A conflict reloads facts and retains recoverable unsaved input for an explicit user decision. |
| Recapture | New reviewed inspection, then `planning.recapture(draft_id, base_version, target_inspection_id, idempotency_key)` job; new version needs new review. Capture is an internal job stage, not a public `baseline.capture` namespace. |
| Approve new draft | `planning.approval_preview(draft_id)`, then `planning.approve(draft_id, base_version=preview.version)` on explicit action. Show identical/incomplete/stale outcomes and open-existing route; never retry approval automatically. |
| Generate optionally | Explicit `planning.create_request`/`planning.start` branch through planner selection; approved/generated drafts reuse the same review boundary. |

M01 revision approval keeps `templates.approval_preview/approve_revision` and its version guard; do not replace it with a second transaction. Publication, identity computation, completeness, mode classification and capability rules remain engine responsibilities. Palette, buttons and bindings all use the same returned `ActionState` and reason.

Every loading/error/empty/disabled view has a stable focus target and preserves entered inputs. Subscriptions use the M15 cursor manager with full epoch/sequence and projection revisions. Ignore late responses from another folder, draft, configuration or trial; recover terminal navigation once from owner snapshots. Unmounting sends no cancellation or approval.

## Mandatory commit review and evidence

Review and launch show a locked **Every task must commit** policy, its version/digest and the approved common instruction. Preserve exact prompt/spec bytes; the execution protocol supplies the instruction separately. Missing Git disables execution with a readiness remedy while manual authoring, capture and approval stay enabled, including non-Git source folders.

Show trial Git preparation separately from competitor work. Under the new policy, empty baselines get an isolated repository with unborn HEAD; the competitor creates its first commit. Populated baselines get one engine-created synthetic baseline commit before measured tasks; label it setup, exclude its work/time and commit from competitor task accounting, and preserve the capture identity separately. Never copy source Git internals or initialize/change the original folder. The legacy inventory keeps its repository-absent T1 start and competitor initialization/first commit.

After every attempted task, show the mandatory protocol check even if authored application checks are empty. Pending remains pending; pass requires new competitor-created commit advancement and all in-scope delivered changes committed. A no-change task still requires an explicit empty milestone commit. Known missing/invalid advancement, rewritten prior history or dirty in-scope delivery is **FAIL**; unreadable/missing history or snapshot evidence is **UNVERIFIED**, with its actual cause. Never-started tasks have no invented commit outcome.

Evidence panels bind `TrialRef`, `ResultId`, task and invocation: start/end HEAD (including absent/unborn), new commit IDs, commit/tree IDs, retained prior tip/ancestry, setup-versus-competitor origin, snapshot references, scoped staged/unstaged/untracked paths and exclusions. These Git IDs are evidence, not template SHA-256. Preserve artifacts/logs on failure; show process outcome, protocol check, application checks and grading separately. Use owner DTOs; no UI Git execution or local verdict calculation.

No engine commit on the competitor's behalf, extra model repair call, automatic task retry or later-task repair of an earlier milestone is permitted. Existing continuation/stop and outcome policies apply. Incompatible legacy commit protocols require a reviewed new revision before a new launch; old results, reading and export stay unchanged. Never retrofit old hashes or strengthen the built-in inventory's historical checks.

## Cursor/OpenCode selection and run layouts

Render the shared registry order **Claude Code, Codex, Grok CLI, Pi, Cursor CLI, OpenCode** (`cursor_cli`, then `opencode`). Counts and available parallelism come from engine projections and selected distinct harnesses, never a literal four/five or an assumption that all six are usable. Preserve existing same-harness scheduling rules and saved `jobs=4`/`jobs=5` values; adding support does not raise saved concurrency automatically.

Environment must distinguish missing binary, unverified/wrong executable provenance, login required, unusable headless mode, usable and unknown. Cursor's current documented executable is `agent`; a name match alone is not evidence of Cursor. Any installation/login instructions are returned/versioned guidance with a source, not an automatic install/login action. Never show an invented one-click installation command.

Catalog refresh/discovery uses metadata interfaces and makes zero model calls. Verification that calls a model remains explicit through the existing consented M03 diagnostic flow. Show model/default/effort sources and age; an unknown default leaves selection empty. Use fixture labels clearly marked illustrative, not asserted available model IDs. No Auto/dynamic model routing, fallback, guessed effort flags or unevidenced local endpoint selector.

OpenCode shows installed **V1/V2 generation + version** and capability sources. Both use `opencode`; the name alone proves neither generation. Model/variant and permissions controls follow the evidenced generation, never a combined V1/V2 form. V2 needs proven invocation-owned private server/state/resources; show blocked isolation and pending cleanup separately, with no personal/shared-server attachment. Metadata discovery performs no model call or automatic config migration/login.

OpenCode's documented native local providers/endpoints may be selectable when the installed generation/provider is verified; freeze that endpoint/model identity. Cursor's local endpoint remains unsupported unless evidenced. Do not copy Cursor's limitation onto OpenCode or promote OpenCode fallback tool/vision/context metadata to verified capability. A local OpenCode competitor is still a harness, separate from the System One decision-engine profile used for context classification/grading.

Clean-blocked details enumerate instructions, memories, plugins, hooks and MCP independently. `cannot_disable` or unverified required protections block the relevant launch; do not visually equate a custom config directory with complete isolation. Preserve explicit current-mode choice and re-review. Planner/judge image/read-only capabilities are role-specific, not inferred from competitor readiness.

At **120×40**, use a scrollable adaptive lane region: two columns and three rows for six configurations, keeping each lane's title/state/trial/task summary and action focus reachable. Keep the run header/frozen identity and footer fixed; detailed logs belong to the selected lane/detail view. Do not shrink six full log panels into unreadable columns. If content pressure requires list/detail even at wide size, use the same selection model and expose the layout switch.

At **80×24**, use M15's existing list/detail pattern: scrollable configuration selector plus one selected configuration's status/log; all six entries and queued states must be reachable. Preserve selected configuration, trial, task, focus and scroll position across resize. M11 supplies the view model and handles actions; the shared widget contains no engine client or scheduling logic.

Launch review displays returned totals with labels: `C configurations × T trials × N tasks = logical competitor tasks`; `N=1` for one shot and the approved primary-file count for new multi-step. For example, six configurations and three trials yield 18 one-shot tasks or 72 tasks for four supplied steps. These are fixture examples; runtime UI renders engine totals. Show Git setup, grading/verification phases separately and do not equate tasks to model requests or protocol checks.

Live/task details bind `RunUid`, configuration and explicit `TrialRef`/`ResultId`; show “Task 1 of 1” or the ordered step filename, current workspace snapshot and separate final verification/grading status. Retained past-trial navigation must not display current-trial logs. One-shot completion proceeds to final capture/checks, not a fabricated `T2` repair task.

Cursor/OpenCode usage/reasoning/context/cost may be unexposed. Render unknown with cause, never zero or a character-based token estimate. Cursor's documented `duration_api_ms` and OpenCode session/tool-inclusive duration do not establish generation time; **Gen tok/s** stays unknown without paired count/timing evidence. Keep native counts, inferred labels, parent/subagent scope and current-window membership separate.

No compatible configured READY decision engine disables new context analysis/reclassification and the decision-model scoring option only. Keep the setup action, native measurements, deterministic statistics/ranking, ordinary harness grading and saved/offline analysis readable according to their own capabilities. Preserve independent monitoring/grading role selection and the existing Gen/In/Out/Files/LOC columns and weight controls.

Legacy v1 fixtures retain their original task count, bytes/hash, baseline and visible legacy multi-step badge, including one-task v1. Approved/imported baselines remain usable after the originating folder disappears. Do not silently migrate v1, rewrite the built-in inventory or alter the current-default results upgrade rule.

## Prototype source worklist

Update sources below, preserving unrelated ongoing edits. Do not hand-edit generated `preview/*`, `animation.html` or `ownership-ledger.md`. Capture the current catalog inventory first; do not restore an old global board count.

| Source | Required design changes |
|---|---|
| [screens.mjs](reference/design/wireframe-tui/src/screens.mjs), [boards.mjs](reference/design/wireframe-tui/src/boards.mjs) | M01 forms, mode/legacy library/detail facts, no-harness manual entry, target states, focus/keys/legends and state registration. |
| [screens-planning.mjs](reference/design/wireframe-tui/src/screens-planning.mjs), [boards-later.mjs](reference/design/wireframe-tui/src/boards-later.mjs) | Manual progress/failure, exact-input review/order/recapture/approval variants; keep optional planning distinguishable and register M16 states. |
| [screens-readiness.mjs](reference/design/wireframe-tui/src/screens-readiness.mjs), [screens-execution.mjs](reference/design/wireframe-tui/src/screens-execution.mjs), [boards-modules.mjs](reference/design/wireframe-tui/src/boards-modules.mjs) | Cursor/OpenCode readiness/catalog, role, generation/private-runtime and clean-blocked projections; six-harness states with unknown facts and metadata-only guidance; missing-Git execution remedy. |
| [screens-setup.mjs](reference/design/wireframe-tui/src/screens-setup.mjs), [boards-modules.mjs](reference/design/wireframe-tui/src/boards-modules.mjs) | Six-harness selection and mode-specific launch review/counts, locked commit policy, profile failures, decision-engine gates and frozen record. |
| [screens-run.mjs](reference/design/wireframe-tui/src/screens-run.mjs), [screens-tui.mjs](reference/design/wireframe-tui/src/screens-tui.mjs), [boards-later.mjs](reference/design/wireframe-tui/src/boards-later.mjs) | Adaptive wide/compact run views, one-shot/multi-step progress, sixth-lane focus, unknown Cursor/OpenCode measurements and explicit historical-trial selection. |
| [screens-verify.mjs](reference/design/wireframe-tui/src/screens-verify.mjs), [boards-modules.mjs](reference/design/wireframe-tui/src/boards-modules.mjs) | Commit pending/pass/missing/dirty/unverified states and scoped immutable evidence; preserve original M09 acceptance fixtures. |
| [screens-results.mjs](reference/design/wireframe-tui/src/screens-results.mjs), [screens-report.mjs](reference/design/wireframe-tui/src/screens-report.mjs), [screens-exchange.mjs](reference/design/wireframe-tui/src/screens-exchange.mjs), [screens-cli.mjs](reference/design/wireframe-tui/src/screens-cli.mjs) | Carry mode/stage/baseline provenance through existing results, offline reports, ZIP and CLI examples without replacing statistics work. |
| [ownership.mjs](reference/design/wireframe-tui/src/ownership.mjs) | Update API mappings, owner assignment and `CONTRACT_ONLY`; include this handoff in the generated ledger template. Register every new screen mapping before build. |
| [navigation.md](reference/design/wireframe-tui/navigation.md), [system.mjs](reference/design/wireframe-tui/src/system.mjs) | Manual creation and optional planner branches, error/return/recapture paths, six harnesses, commit evidence and palette/help/nav-map routes; explicit disabled reasons. |
| [animation.mjs](reference/design/wireframe-tui/src/animation.mjs), [verify.mjs](reference/design/wireframe-tui/src/verify.mjs) | Add the required walkthroughs and structural/focus/link checks; retain context/statistics demonstrations and existing invariants. |

Use existing theme/grid/widget primitives. Keep screen IDs, rendered board names, `go:` links, focus targets, legend widget trees, ownership and navigation synchronized. Register M01 boards in `boards.mjs`, M03–M07 in `boards-modules.mjs`, M11/M15/M16 in `boards-later.mjs`; generator location does not transfer ownership. Keep refinement catalogs and existing deletion/verification states intact.

## Acceptance and delivery gates

Design deliverables: source changes, regenerated boards/ledger/animation, updated navigation, and a short inventory separating rendered states from contract-only interactions. Include both target modes for both benchmark types. Do not report the implementation, live APIs or Cursor/OpenCode runtime as complete from static illustrations.

Required end-to-end walkthroughs:

1. No harness installed → Library New → one-shot exact prompt → empty/metadata-only folder → manual capture/review/approval → saved template; execution disabled with remedy, no planner route or call.
2. Multi-step supplied files → explicit reorder → dirty Git subdirectory or non-Git populated folder → exclusions review → capture → exact review → approve; two trials/configurations show isolated copies of the same snapshot and ordered stages.
3. Excluded-only/unreadable/unsupported target and invalid/duplicate spec input → actionable path errors; sourceChanged during capture → bounded failure → explicit reinspection/recapture; never scratch fallback or partial approval.
4. Hide/reopen, cancel/cleanup, interrupted operation and job-cache expiry → durable correct state; edit/approve version conflict → fresh preview and explicit action, with no duplicate draft/publication.
5. Cursor/OpenCode missing/auth/unknown → metadata recheck/catalog selection → generation/clean/private-runtime refusal or evidenced usable setup → six-configuration launch review → wide/compact run → metrics unknown where unsupported. Cover verified OpenCode native local provider separately from decision-engine selection; verification calls remain explicitly consented.
6. One-shot final artifact capture and checks → grading/evidence/results; missing captures remain unverified/ungraded. No engine configured preserves native/statistics flows and disables only the governed decision features.
7. v1 and v2 ZIP/reuse after original-folder removal → mode/stages/captured bytes still inspectable, no live refresh; explicit approved-template refresh creates a new reviewed revision.
8. Missing Git → manual approval succeeds, run disabled; empty new-policy trial → unborn HEAD → competitor first commit; populated trial → separate synthetic baseline → competitor milestone. A no-change task creates an empty commit. Exercise pass, missing/dirty/rewritten FAIL and unreadable-history UNVERIFIED without losing artifacts, inventing grading coverage or repairing a prior stage.
9. Legacy inventory → repository absent before T1 → original competitor initialization/checks; incompatible legacy protocol → reviewed new revision required for launch, old reading/export unchanged. Preserve saved jobs 4/5; resize/reopen on the sixth configuration and verify commit evidence stays bound to its selected trial/task.

For each family, exercise Tab/Shift-Tab, Enter, Escape, scrolling, reorder controls, selection restoration and resize while a row/input is focused. Global shortcuts must not steal prompt text entry. Keep visible focus, textual statuses plus glyphs, labelled disabled reasons and readable wrapping; no state relies on color alone. Long Unicode paths, many specs/exclusions, multiline prompts and six lanes must not collide with the footer or hide the only recovery action.

After prototype edits, run from `spec/`:

```sh
node implementation/reference/design/wireframe-tui/src/build.mjs
node implementation/reference/design/wireframe-tui/src/animation.mjs
node implementation/reference/design/wireframe-tui/src/verify.mjs
git diff --check
```

**Static design gate:** verify all declared sizes/focus variants, clipping, board/link/ownership coverage and walkthrough transitions; inspect generated pages in a browser at both sizes. This validates pictures and navigation, not runtime behavior.

**Textual/Pilot gate:** owning implementation children exercise the same flows with typed fake clients, exact action counts, engine capability reasons, stale response/version/cursor handling, no-harness manual authoring and resize/focus preservation. Add no client-side identity, capture, readiness, token or scoring calculations.

**Real integration gate:** owners prove current-file byte/order/flag preservation, source unchanged on success/failure/cancel, isolated Git setup and mandatory commit observations, immutable per-trial copies, zero manual-planner calls, atomic approval, final evidence and v1/v2 ZIP round trips through real engine APIs. Cursor/OpenCode installed-version/generation/platform tests separately establish actual support and protections. Record unavailable credentials/platforms as unverified; passing the prototype build cannot satisfy either runtime gate.

The domain judge contracts also extend profile selection and review: [backend](quality-judges/BACKEND.md), [mobile](quality-judges/MOBILE.md), [DevOps](quality-judges/DEVOPS.md), [agentic software](quality-judges/AGENTIC.md) and [specification design](quality-judges/SPECIFICATION.md). Show the template-pinned profile/version, six domain categories, required evidence/coverage and capability reasons. Native mobile capture requirements come from its target matrix; text-domain judges do not require web images. Profile changes require a reviewed template revision, and measurement/ranking controls remain separate.

[Human quality review](M12/05-human-review-web.md) extends the judge selector with Human and adds pending-human status, saved draft, private open/reopen, submission/ungraded/skip and receipt states. The browser form and its evidence/privacy/keyboard/layout contract are owned by M12.5; M07/M12.3/M11/M14 only expose its shared engine actions. Execution completion opens one review queue; final automatic statistics-report opening follows original human settlement. No existing prototype regeneration or human-form implementation is claimed by this design reference.

[Model variant classification](MODEL-VARIANTS.md) adds catalog metadata/detail editing, requested-versus-effective launch review, quant/fine-tune/joint comparison controls, creator-role/date-kind facets and provenance/confound details in results and reports. The supplement owns the exact state inventory; preserve Unknown and declared states at both layout sizes. These comparison fields stay outside the anonymous automated/human quality-review inputs. No prototype changes are claimed here.
