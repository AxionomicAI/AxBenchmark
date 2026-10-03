# M17.3 — exchange-screens

Parent: [M17](../reference/modules/17-zip-exchange.md#4-screens). Requirements: R009, R015, R029, R036, R056–R059, R115–R124, R134, R142, R153–R154. Findings: F02, F06, F09, F14, F18.

Outcome: every template/result import and export dialog, ZIP picker, validation and separate-revision flow is fully usable over engine DTOs, including typed rejection and committed recovery outcomes. No screen computes identity, classifies conflicts or reads archive/store files.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M17.2](02-exchange-transactions.md), M15.1 tui-foundation and M15.2 tui-shell. Feature screens must use the shared workers, focus, modal and fake-client harness.

**Bootstrap-published contracts, allowed as injected fixtures:** M01 Library/Template and M02 Results navigation factories/DTOs, M15 route registry, clipboard and file picker platform service. M17 owns every exchange destination. Early M01/M02 entry tests inject M17 factories, and this child injects return destinations; real Library/Results screens are later integration gates, never circular prerequisites.

## Ownership

Own proposed files:

- `axbenchmark/tui/screens/exchange.py`: ImportScreen, ExportScreen, ImportResultsScreen, ExportResultsScreen and ResultPackageScreen, with every state.
- `axbenchmark/tui/viewmodels/exchange.py`: all template/result import/export, package, step, rejection, mismatch and embedded view-model builders.
- `axbenchmark/tui/widgets/validation_order.py` and `axbenchmark/tui/widgets/zip_picker.py`: one shared picker and validation widget used by M17 screens.
- `axbenchmark/tui/styles/exchange.tcss`; `tests/tui/test_exchange_viewmodels.py`, `test_exchange_screens.py`, `test_exchange_navigation.py`.

M01/M02 own only Library/Results entrypoints using injected ExchangeScreens factories. M17 implements the preserved [M01 presentation/entry contract](../reference/modules/01-template-library-identity.md#4-screens) and all result exchange behavior in its parent; it writes no exchange fragments in results.py. M14 owns CLI. No wireframe source change is included here.

## Exact boards and states

| Board | M17 screen / state | Contract |
|---|---|---|
| ExportTemplate | ExportScreen | Identity/contents/exclusions/path preview; engine capability, export job, written path and typed errors. |
| ImportTemplate | ImportScreen `#import-pick` | Shared picker; template import or explicit result-package routing for the selected SHA. |
| ImportVerifying | ImportScreen `#import-steps` | Five engine steps/progress; explicit escape/Cancel uses jobs.cancel and respects committed outcome. |
| ImportRejected | ImportScreen `#import-rejected` → `#digest-detail` | Full declared/computed digests and differing paths; show-digests toggles existing data only. |
| ImportDuplicate | ImportScreen `#import-duplicate` | Existing SHA with no additions; open exact revision or close. New registration routes to its outcome SHA. |
| ImportUnsafe | ImportScreen `#import-body` → `#import-rejected` → `#unsafe-detail` | Engine boundary errors, entry/problem rows, steps and actual effects; close only. |
| ImportIncomplete | Same screen → `#incomplete-detail` | Completeness requirements/unexpected paths and remedy; copy report issues no API call. |
| ResultPackagePick | ResultPackageScreen `#result-package-body` → `#package-pick` | `#zip-path` + shared `#zip-browser`; inspect is explicit, highlight lookup is debounced. |
| ResultPackage | Same screen → `#package-contents` | `#package-tree`, provenance, RunUid/label/TrialRef, selected scope, exclusions; validation capability from engine. |
| ResultImport | ImportResultsScreen `#import-validated` | Add/identical-skip rows, scoped selection and can_add; add publishes through engine. |
| ResultImportConflict | ImportResultsScreen `#import-conflict` | Exact result/run/trial/invalidation conflict, both digests and expandable paths; add disabled. |
| ResultMismatch | ImportResultsScreen → `#result-mismatch` | Full selected/embedded/declared digests, changed paths, separate matching revision or cancel; never force-merge. |
| ResultEmbedded | Same screen → `#result-embedded` | Published outcome, added/skipped IDs and target revision; inspection-only invalidation notice; no benchmark/judge ran. |
| ExportResult | ExportResultsScreen | RunUid-scoped selection, frozen counts, origin/invalidation, path, contents/exclusions and export job. |

Own `#package-contents-loading`, `#package-contents-error` and an explicit empty-picker/no-selection state with disabled inspect. All screens retain their loading/empty/error/content lifecycle and typed Retry remedies.

All fourteen boards above are M17 implementations even when drawn on M01/M02 canvases. Their modules test only route arguments/outcomes; M17 owns complete screen rendering and API behavior.

ValidationOrder renders exactly five StepDTO rows and their engine states. A mismatch stops the selected-target attempt; explicit embedded import shows the new compatibility/identity pass and registration outcome. Never advance progress locally.

## Calls, subscriptions and scope

`ResultPackageScreen(template_sha256, path?)`: mount with path or picker enter → one `exchange.inspect_package(path)`; validate → one `exchange.inspect_results(path, template_sha256)` and route its JobRef to ImportResultsScreen in the same M17 screen module.

`#result-mismatch` continue with embedded choice → one `exchange.import_results(staging_id, target="embedded_revision")`; `ctrl+s` / add-results in the ready state calls `exchange.import_results(staging_id, target="selected")`; show-differences expands loaded data only. Close/cancel/navigation issues no mutation. Expiry is a typed engine error, not silently restarted import.

ImportScreen labels through inspect_package; template enter calls import_template once, result ZIP enter routes using the selected SHA. ExportScreen loads template_export_preview and ctrl+s calls export_template. ExportResultsScreen loads results.get_run plus plan_result_export(run_uid, result_ids=None); space toggles selection and replans with explicit IDs, then ctrl+s calls export_results(run_uid, plan.selected_result_ids, path) only when the current plan.can_export.enabled is true. No label lookup, inferred all-results subset or default live trial.

Subscribe to `job:<job_id>` through M15's cursor manager with `(epoch, seq)` and object revisions. Snapshot/replay/resync restores progress/outcome; out-of-order replay cannot regress published success. Unmount unsubscribes only; ImportVerifying escape/Cancel explicitly calls jobs.cancel and respects pre/post-publication behavior. Other close/navigation actions do not cancel jobs.

Render EngineError message/field/remedy and nested steps/effects without parsing prose. Conflict states show exact run/trial/result/invalidation code and both digests; colliding labels show origin and UID. Selection shows frozen trial count/missing slots and invalidation means inspection-only, never comparison eligibility.

ResultPackage/ExportResult content rows expose returned statistics/policy/inventory availability with independent Files/LOC and native timing/detail limitations. Distinguish settled partial/unknown evidence (portable) from pending durable finalization (export disabled). Preview/import carries exact full frozen trial counts and original eight-factor plan metadata without claiming that an imported metric is compatible or ranked; M06 owns those decisions and M10 owns aggregation.

**Frozen domain contract.** Package/ResultImport/Export view models show frozen family/version/digest, ordered category labels, required modality and domain coverage/source-role/mode summaries returned by M17. Label native missing target/build evidence, plan/dry-run versus applied observations, agent simulation/replay/live and supplied/candidate documents. Recorded unavailable evidence is not a fresh import failure; corrupt declared bindings use owner errors. No live preview, verifier or profile-upgrade action is added.

PackageSummary/ResultImportPreview/ResultExportPlan VMs show returned variant refs, combined facets, ordered lineage detail, creator roles/date kinds/precision, annotation view/history and requested/effective proof limitations. Initial manifest metadata is declared-only until validation; validation cannot certify authorship or actual loaded weights. ResultImportConflict includes typed variant descriptor/annotation conflicts and both digests/paths, with add disabled. Mandatory mismatch remains an attribution exclusion in every view, distinct from template mismatch/force-merge behavior. Export contents say model metadata/evidence only, weights excluded.

**Route, comparison and profile interfaces.** Extend ResultImport/Package/ExportResult VMs and existing exchange.preview/import/export DTO bindings with comparison axis/classification/coverage, profile treatment, inactive access/profile evidence and typed immutable-snapshot/binding conflicts. Preview distinguishes absent selected results from unsupported cells, preserving full matrix. Reuse after import directs an explicit local M04 registration/qualification flow, never an automatic action or imported credential lookup.

## Integrated requirements

R192, R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R189 — [human review](../M12/05-human-review-web.md).

R184, R185, R186, R187, R188 — frozen domain profile/evidence contracts: [R184](../quality-judges/BACKEND.md); [R185](../quality-judges/MOBILE.md); [R186](../quality-judges/DEVOPS.md); [R187](../quality-judges/AGENTIC.md); [R188](../quality-judges/SPECIFICATION.md).

R174, R176 — [benchmark statistics](../BENCHMARK-STATISTICS.md).

R164, R166, R171 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

R177, R178, R179, R180, R183 — [benchmark modes](../BENCHMARK-MODES.md).

Package/Export VMs render M17 owner DTO format, benchmark/project/target mode, legacy marker, primary order/count and baseline/protocol identity. ResultPackage and export contents additionally show the presence/availability of scoped task-commit proofs, setup origin and retained verdicts separately from process/behavioral status. Unknown historical evidence is not_recorded, not newly failed. Add wide/compact both-mode/source-deleted fixtures, seven domains and malformed/cross-scope proof rejection; preview/import never runs Git, a check, planner or model and cannot override the new-launch revision gate.

ResultPackage/ExportResult contents show per-capture source availability and native-only or selected analysis cutoff/status, plus sanitized backend/profile/group evidence. Preserve the engine-pinned selection through preview/export; pending or unavailable classification alone never disables a settled result export. Import remains read-only inspection followed by existing explicit publication, with no implicit profile selection, test or observer restart. Display source/analysis reference errors and unknown future protocol re-execution limits without guessing support. Add offline and late-analysis preview fixtures at both terminal sizes.

**Human exchange contract and acceptance:** M02 supplies only committed human-authored reviews, self-declared reviewer/form-policy identity, exact rubric/evidence/group digests, raw grade parts/comments/limitations/deficiencies and original/additional disposition receipts. Pending original cases block finalized result export; a selected subset cannot bypass that full-run barrier. Exclude local drafts, human working journals, session tokens, loopback URLs and active controller assets. Inspect/import/round-trip graded/ungraded/skipped originals and additional groups without creating a host, automatic browser reopen, model call or new local verified identity. Display human groups and model cost not applicable; unresolved original waiting and actual persistence failure have distinct reasons. Reject forged machine fields or cross-case/result evidence through M02 codecs; retain six grades and exact score parity after offline reimport.

## Acceptance

**Route/profile acceptance:** Fake-client compact/wide flows display full N/6 and inactive profiles, preserve choices on conflicting refs, and open retained evidence without probing endpoints. Import remains all-or-none and no synthetic scores/readiness appear.

**Variant acceptance:** Render wide/compact declared/unverified/confirmed/conflicting variants, month dates, missing creators, same-label distinct refs and post-seal mismatch. Import/view emits no catalog save, URL fetch, model load or annotation adoption; retry/close remains scoped and full frozen trial counts stay visible.

**Domain acceptance:** Add wide/compact six-family import/export fixtures with no-image text domains, missing native coverage and inert document commands. Preview/import keeps exact selected refs/groups and makes no model/device/cloud/check calls.

Add both-size package/export fixtures with complete file count/unknown LOC, missing native timing, partial matched subset, v2 policy/direction metadata and pending snapshot/metric receipt. Assert existing owner calls only, no client recomputation/scanning/zero filling, and same selection/unknown states after import return navigation.

Run `pytest tests/tui/test_exchange_viewmodels.py tests/tui/test_exchange_screens.py tests/tui/test_exchange_navigation.py` with fake-client `App.run_test()`/Pilot at wide size and 80×24:

1. Render all fourteen boards and each loading/empty/error state; focus, scrolling and full 64-character digests remain usable at compact size. Resize preserves path, selection, mismatch choice and job identity.
2. Picker highlight labels only; enter inspects once; validation submits once. Template/result kind mismatch dims action using ActionState and displays its reason. View models never call codecs/scorers/filesystems.
3. Unsafe/incomplete/digest failures display engine steps/effects and useful remedy. Copy report and close issue no API calls. Unexpected inventory errors render paths even without completeness rows.
4. Mismatch cancel changes nothing; embedded continue calls exact target and success opens only outcome.template_sha256. Conflict states show run-binding/trial/invalidation conflicts as well as result ID conflicts, with no force option.
5. Same-label origins/UIDs and two T1 trials stay distinguishable. Subset export submits exact IDs, no hidden extra results; retention-pending dims export and an invalidated finalized scope displays inspection-only.
6. Fake entry/return factories assert exact SHA/RunUid/path/JobRef arguments with no real Library/Results screens required. Disconnect during inspect/import, replay old progress after success and reopen after publication: state comes from snapshot/typed outcome; no duplicate command or misleading rollback claim. Escape/unmount cannot stop a committed transaction.

**Real integration gate:** M01.4 Library/Template and M02.3 Results entrypoints + M15.3 shell with real M17.2 API and all M17 exchange destinations: no-harness export/import, identical retry, conflict rejection and separate-revision journey. M14 validates the same error/selection flow headlessly; screen tests alone do not prove archive safety/publication.

**Wireframe follow-up:** ResultPackagePick remains a distinct board; All five exchange screen legends point to M17 `tui/screens/exchange.py`; M01/M02 legends own only entrypoint factories. Update provenance/selection legends for UID/TrialRef, subset counts and inspection-only status; preserve those ownership boundaries when wireframes are next edited.

**Pending parent obligations:** real macOS/Linux round trips, crash/concurrent-reader publication, finalization/invalidation races and all cross-module gates from M17.1–2. This child cannot establish those through fake-client success.
