// Proposed implementation ownership and API seams. Canvas placement never assigns file ownership.
import { writeFileSync } from 'node:fs';
const children = {
  M01: '01-template-library-identity.md', M02: '02-retained-results-comparability.md', M03: '03-environment-readiness.md', M04: '04-model-catalog.md', M05: '05-harness-execution-isolation.md', M06: '06-scoring-rankings.md', M07: '07-run-configuration.md', M08: '08-verification-evidence.md', M09: '09-default-inventory-benchmark.md', M10: '10-measurements-cost.md', M11: '11-run-orchestration.md', M12: '12-quality-judging.md', M13: '13-standalone-html-report.md', M14: '14-command-line-interface.md', M15: '15-terminal-interface.md', M16: '16-custom-template-planning.md', M17: '17-zip-exchange.md', M18: '18-hardware-monitoring.md',
};
const exchange = new Set(['ExportTemplate','ImportTemplate','ImportVerifying','ImportRejected','ImportDuplicate','ImportUnsafe','ImportIncomplete','ResultPackagePick','ResultPackage','ResultImport','ResultImportConflict','ResultMismatch','ResultEmbedded','ExportResult']);
const API = {
  LibraryScreen: 'templates.list/get; planning.unfinished; environment.report; runs.list. Delete: templates.delete(sha256,delete_plan_id); draft Delete: planning.discard.',
  TemplateScreen: 'templates.get/revisions/tasks/manifest; configs.list; results.list; templates.rename/verify/restore; typed navigation factories.',
  NewTemplateScreen: 'planning.defaults/inspect_repository/create_request; M16 planner factory.',
  ReviseScreen: 'templates.get/start_revision; M16 editor factory.',
  ApproveRevisionScreen: 'templates.approval_preview; templates.approve_revision(draft_id,base_version,copy_configs).',
  LaunchCheckScreen: 'jobs.get/cancel for existing runs.launch job; configs.launch_record; templates.restore/start_revision.',
  ResultsScreen: 'results.list(template_sha256,filters,tariff); M17 exchange and M13 report factories.',
  ResultScreen: 'results.get(result_id,sections); results.evidence; exact ResultId/TrialRef navigation.',
  RejudgeScreen: 'judging.rejudge_options/rejudge; returned job/batch identity.',
  ReportScreen: 'reports.status; reports.reveal(path); preserve committed path even when opener fails.',
  EnvironmentScreen: 'environment.report/explain/recheck/verification_plan/verify; catalog factory.',
  CatalogScreen: 'catalog.overview/entries/entry; catalog.refresh; separate model/account/rate factories.',
  OverrideScreen: 'catalog.entry.override_form; catalog.save_override/remove_override (model fields only).',
  BillingScreen: 'catalog.overview billing_form; catalog.save_account_override(harness,target,account_id,billing).',
  RatesScreen: 'catalog.rates; catalog.save_rate_override (Value, Unknown or Inherit; removal = Inherit). per_usd = currency units per 1 USD.',
  EntryPickerScreen: 'catalog.options/check_selection; configs.add_entry/update_entry.',
  EnvPolicyScreen: 'harness.policy; configs.update_entry.',
  CleanBlockedScreen: 'harness.policy; engine ActionState and typed clean-unavailable reason.',
  RunConfigScreen: 'harness.configuration/task/invocation/log; explicit TrialRef or ResultId; M08 evidence factory.',
  IsolationScreen: 'harness.isolation; read-only allocation facts.',
  ScoreBreakdownScreen: 'scoring.breakdown(result_id,judge_group); returned original/alternative measures.',
  WeightsScreen: 'scoring.weight_choices/preview_weights/validate_weights over RankingWeightsV2 (8 weights + directions + metric policy); configs.set_weights or analysis return value.',
  SetupScreen: 'configs.open/setup; configs.set_execution/set_judge/set_weights; catalog entry factory.',
  JudgeScreen: 'configs.judge_candidates/set_judge; M12 judge-capability factory.',
  ReviewLaunchScreen: 'configs.review; runs.launch(draft_id,preview_digest,execution adjustments).',
  LaunchRecordScreen: 'configs.launch_record(run_uid); runs.status; immutable frozen record.',
  TaskChecksScreen: 'verification.task/check/evidence; explicit ResultId/TrialRef/task/phase.',
  FinalRegressionScreen: 'verification.regression/check; separate final phase targets and outcomes.',
  ChecksScreen: 'verification.not_passed; returned cause/phase and scoped evidence.',
  ScreenshotsScreen: 'verification.screenshots/evidence; exact retained evidence references.',
  EvidenceViewerScreen: 'verification.evidence; results.read_evidence; opener on returned evidence.',
  VerifyProgressScreen: 'verification.progress; scoped run and verification status subscriptions.',
  JudgeInputScreen: 'verification.judge_input; recursively scrubbed evidence, no per-task screenshot/duration input.',
  InventoryAboutScreen: 'templates.contract; M07 configure factory; no M09 API namespace.',
  PromptsScreen: 'templates.prompts; immutable revision, no subscription.',
  CoverageScreen: 'templates.coverage/file; phase_counts + requirement/phases/observation/evidence fields.',
  VariantScreen: 'templates.lookalike; exact alternate SHA navigation.',
  DefaultChangesScreen: 'templates.list.default_notice; templates.set_default after confirmation.',
  MeasurementsScreen: 'measurements.result/task/trials; exact/display/billing/rate provenance from M10.',
  TimingScreen: 'measurements.timing(run_uid); phases remain separate.',
  ThroughputScreen: 'measurements.result/task scoped generation_rate observation: request pairs, basis, coverage, policy digest and limitations; never recomputed client-side.',
  DecisionEnginesScreen: 'decisions.profiles.list/get, decisions.capabilities; configs.set_context_monitoring / set_grading_selection for explicit role choice; no client readiness rules.',
  ProfileEditorScreen: 'decisions.profiles.save → new immutable version/digest; typed field errors (endpoint, auth reference, model binding).',
  ProfileTestScreen: 'decisions.profiles.test(probe mode) job; jobs.cancel; observation bound to the exact profile version/digest.',
  ContextDetailScreen: 'measurements.context.sessions/snapshot/history/segments/analysis with ContextTarget + AnalysisSelection; measurements.context.reclassify job only on explicit confirmation; snapshot/analysis.updated/gap events; capability can_reclassify.',
  ArtifactStatsScreen: 'measurements.result trial-scoped file_count/loc observation and retained snapshot inventory (M02 snapshot reader); counting policy digest.',
  CostBasisScreen: 'measurements.cost_bases; display currency and zero reasons from engine.',
  CurrencyEnergyScreen: 'measurements.accounting/preview_accounting/validate_accounting; configs.set_execution for setup; analysis returns tariff only.',
  RunScreen: 'runs.status/log; run:<run_uid>; runs.stop_preview/stop; explicit trial navigation.',
  RunHaltedScreen: 'runs.status; immutable invalidation overlay; retained facts preserved.',
  HarnessLiveScreen: 'harness.live/task/file/log; measurements.context.snapshot (latest, resolved ContextTarget) + snapshot.recorded events; bind resolved TrialRef, discard stale selection responses.',
  DetachScreen: 'unsubscribe only; attach/status command uses UID.',
  StopScreen: 'runs.stop_preview(run_uid,scope); runs.stop once on confirmation; ActionState gates.',
  StoppingScreen: 'runs.status + persisted StopReceipt; cleanup and retention/report disposition separate.',
  LockedScreen: 'runs.status edit restrictions; no mutation.',
  JudgingScreen: 'judging.status/stop(batch_id); RUN delegates runs.stop, REJUDGE cancels additional job only.',
  UngradedReviewScreen: 'judging.review(review_id); keep deficiencies/raw response; no Q or repair.',
  ReviewScreen: 'judging.review; results invalidation projection; raw/evidence actions only if enabled.',
  ProfilesScreen: 'judging.profiles/get_profile; M06 weight factory.',
  JudgeCapabilityScreen: 'judging.check_judge + returned capability; typed action back to M07; no substitution.',
  ReportGenerateScreen: 'reports.plan/generate; revalidate retention/invalidation and scope at submit.',
  ReportProgressScreen: 'job:<job_id>; jobs.cancel; reports.status for durable outcome/cache expiry.',
  HelpScreen: 'M15 registered navigation and action registry; no feature mutation.',
  PromptScreen: 'M15 dialog returns typed value; caller invokes configs.save_preset, scoring.export_weights or telemetry.export_csv.',
  PlannerScreen: 'planning.request/planner_options/start; explicit readiness consent via M03.',
  PlanningScreen: 'planning.session; planning + job:<job_id> topics; jobs.cancel explicitly.',
  PlanningFailedScreen: 'planning.session; planning.retry/discard; recovery does not invoke automatically.',
  PlanReviewScreen: 'planning.draft/draft_task; selected snapshot_label; planning.edit with base_version.',
  ServiceEditScreen: 'planning.draft; planning.edit(draft_id,base_version,service edit).',
  TaskEditorScreen: 'planning.draft_task; planning.edit(draft_id,base_version,task edit).',
  RegenerateScreen: 'planning.regenerate_preview/regenerate with base_version.',
  ApproveDraftScreen: 'planning.approval_preview; planning.approve(draft_id,base_version); stale preview must be reconfirmed.',
  ImportScreen: 'exchange.inspect_package/import_template; job:<id>; explicit jobs.cancel respects publication.',
  ExportScreen: 'exchange.template_export_preview/export_template; job:<id>.',
  ImportResultsScreen: 'exchange.inspect_results; exchange.import_results(staging_id,target); selected or embedded_revision only.',
  ExportResultsScreen: 'results.get_run; exchange.plan_result_export; exchange.export_results(run_uid,plan.selected_result_ids,path).',
  ResultPackageScreen: 'exchange.inspect_package/inspect_results; UID, origin and TrialRef preserved.',
  MonitoringScreen: 'telemetry.capabilities(sampling_interval_s); configs.set_execution; effective/observed interval labels.',
  CollectorGuideScreen: 'telemetry.guidance; environment.recheck; copy returned instructions only.',
  TelemetryScreen: 'telemetry.experiment(result_id); provisional/pending/finalized/error; telemetry.export_csv via shared prompt.',
  EnergyDetailScreen: 'telemetry.energy; selected/rejected physical-domain sources, reset/wrap/gap evidence.',
  WindowsScreen: 'telemetry.windows(result_id); explicit TrialRef on every sequential window.',
};
export const CONTRACT_ONLY = [
  ['M01','Library, Template*, RevisionDelete*, ReviseConfirm, LaunchCheck','Query loading/empty/error, stale selection, delete cancel/Escape call count, post-confirm race, cleanup_pending and expired token; approval version conflict; immutable baseline executable metadata; restore/invalidation races.','M01/04-library-screens.md'],
  ['M02','Results*, Result*, Rejudge, ReportReady','Same label/different UID, missing trial slots, retention pending, invalidation overlay preserving sealed facts, read failure; complete exact/display/rate/billing provenance in trial mean/min/max; opener failure retains path.','M02/03-results-screens.md'],
  ['M03','Environment*, CollectorGuide','Query/collector error, explicit model-call consent, source/age, changed read-only mode remedy, no commands executed by guidance.','M03/02-readiness-screens.md'],
  ['M04','Catalog*, ModelPicker*','Billing Value/Inherit/Unknown edit/reopen/account isolation; pending/field errors/cloud-local refusal; model save contains no billing; COP4000 and EUR save/reopen/freeze/export/import, unknown rate, USD identity; refresh cancel/replay/source failure.','M04/04-catalog-screens.md'],
  ['M05','RunConfig, TaskBlocked, ModelRejected, RunIsolation','Historical TrialRef selection, lost snapshot, observed versus requested settings, missing evidence, late old-trial responses and role-protection refusal.','M05/07-adapter-views-integration.md'],
  ['M06','Rankings*, Weights*, ScoreBreakdown*','Pinned population/readiness errors, missing trial slots, zero weighting, exact currency comparisons, invalidated entry and zero/partial values excluded as engine specifies; v1→v2 weight migration, missing direction, basis/policy/scope incompatibility, all-statistics-zero equivalence and references from the eligible cohort (R175, R176).','M06/02-rankings-screens.md'],
  ['M07','Setup*, JudgePicker, JudgeFallback, ReviewLaunch, TrialBudgetWarning, LaunchRecord, DecisionEngine*','Seven-board setup contract: review freshness, stale confirmation, frozen UID/billing/rates/provenance, durable initial_progress warning once, typed failed binding and no duplicate launch on reconnect; decision profiles: auth_unsupported edit, configured_not_ready recheck, loading/error/test-cancel, role choice invalidating the review digest, legacy typesafe/disabled migration.','M07/03-setup-review-screens.md'],
  ['M08','TaskChecks, FinalRegression, CheckOutcomes, CheckMissingCommit, CheckHistoryUnavailable, CheckT2WithoutUI, CheckMissingBrowser','Real observer execution, history unavailable vs failed commit, supported T2 data-only implementation, verification acknowledgement/persistence pending, identity mismatch, no target, unsupported codec, source selection and scoped evidence navigation.','M08/03-verification-screens.md'],
  ['M09','InventoryAbout, InventoryChecks, InventoryPrompts, InventoryVariant, InventoryUpgrade','All 30 rows scrollable; exact requirement/phase/observation/evidence DTOs, no also-checked assertion; T2 data-only and independent commits; missing built-in/invalid contract states.','M09/04-inventory-screens.md'],
  ['M10','Measurements*, ThroughputDetail, ArtifactStats, ContextDetail*, CostBasis, CurrencyEnergy, TariffAnalysis, TimingPhases','Missing rate, unverified_zero_cost, source currency absent, mixed-display USD, exact rational values and metadata in aggregates; finalization pending/error; trial and phase scoped measurements; unpaired/mixed-basis timing, incomplete request discovery, strict decode failures and snapshot mutation after capture (R174); context engine configured-but-unready, vision vs text-only profile, local deferral, active/complete/partial/failed analysis, reset and dropped history, imported history with inference disabled, stale cursor/target switches (R161–R166).','M10/03-measurement-screens.md'],
  ['M11','RunOverview, RunReattached, StopConfirm, StopCleanup, HarnessLive*, RunListDetail','Finalizing/retention_pending; report written/failed/cancelled/skipped/pending; stop original judging/finalizing with completed-configuration gate disabled; cleanup finished but retention failed; historical trial 1 while trial 2 active; snapshot/replay gaps.','M11/05-run-screens.md'],
  ['M12','Judging*, ReviewDetail, ReviewUngraded, JudgeCapability','Settling, persistence pending, interrupted/engine-lost, invalidated, missing artifact/raw response, partial cost; UID/TrialRef selection; RUN stop versus independent REJUDGE cancel; no resumed original model calls after recovery.','M12/03-judging-screens.md'],
  ['M13','ReportGenerate*, ReportProgress, ReportReady, ReportPage','Durable pending/failed/cancelled/skipped; retention/invalidation/readiness refusal, stale plan, output exists, persistence pending; commit wins late cancellation; opener warning retains committed path; exact currency/zero/trial provenance.','M13/04-report-jobs-screens.md'],
  ['M14','Cli*','RUN_REF ambiguity lists UID/origin; tariff amount/currency paired; typed errors vs usage exit codes; initial_progress warning once; stop judging/finalizing/retention_pending; every report disposition ends waiting.','M14/02-curated-cli-flows.md'],
  ['M15','HelpKeys, CommandPalette, WidgetStates, RunListDetail, Prompt*','Global palette/showcase/compact widget owned here; M11 maps fixture rows and handles messages. Real shell resize/focus restoration, disabled commands, typed EventCursor replay/resync, resolved UID attachment and once-only launch warning.','M15/03-tui-integration.md'],
  ['M16','Planner*, Planning*, Plan*','planning plus job topics, snapshot replacement, version-stale edit/approve, canonical closure and executable baseline metadata. PlanReview/PlanReopened T4 labels render; selection transitions remain Pilot tests.','M16/05-draft-editor-screens.md'],
  ['M17','All fourteen ZIP boards in the rendered ledger','All loading/empty/error states; exact UID/result/trial/invalidation conflict variants; subset export freeze/readiness guard; committed cancellation/recovery; early M01/M02 injected entrypoint tests and real later shell routing.','M17/03-exchange-screens.md'],
  ['M18','MonitoringSettings, Telemetry, EnergyDetail, SequentialEnergy','Observed/effective intervals, selected/rejected duplicate sources, proven wrap vs known-range reset, uncovered gaps; explicit TrialRef windows; provisional/close-pending/error and exact close receipt.','M18/05-telemetry-screens.md'],
];
export function boardContract(b,g) {
  let owner = g.id.match(/^m(\d{2})/)?.[1]; owner = owner ? `M${owner}` : 'M01';
  if (exchange.has(b.name)) owner='M17';
  if (['CommandPalette','WidgetStates','HelpKeys','RunListDetail'].includes(b.name) || b.special === 'system' || b.special === 'navmap') owner='M15';
  if (b.name==='CollectorGuide') owner='M03';
  if (b.name.startsWith('RevisionDelete')) owner='M01';
  const screen=(b.legend?.screen??b.special).split(' · ')[0];
  let api=API[screen];
  if (b.name.startsWith('RevisionDelete')) api='templates.get → current effect/delete_plan_id/ActionState; templates.delete on fresh confirmation; cancellation sends nothing.';
  if (b.name==='DraftDiscard') api='planning.discard(session_id or draft_id) only after shared M15 confirmation.';
  if (b.name==='TrialBudgetWarning') api='configs.review totals/token → fresh confirmation → runs.launch; never a local budget calculation.';
  if (b.name==='PlannerVerify') api='environment.verification_plan; environment.verify(consent=true); returned job + planning options refresh.';
  if (b.name.startsWith('Rankings')) api='scoring.rank/weight_choices; pinned ResultFilters/judge group; M10-prepared currency, trial and statistics summaries; selected metric comparison policy.';
  if (b.name==='CommandPalette') api='M15 action registry; contextual M01 delete_revision/discard_draft contributions obey ActionState.';
  if (b.name==='RunListDetail') api='M15 presentation-only widget/VM; no EngineClient imports. M11 RunScreen supplies rows and receives Selected/Search/Page/Action.';
  if (b.special) api=b.special==='report'?'M13 ReportArtifact; reports.plan/generate pinned population, browser-local alternative analysis.':'M15 shared theme/widget/navigation documentation; no standalone engine calls.';
  if (b.name.startsWith('Cli')) api='M14 curated CLI over published registry; results.resolve_run before UID-only calls; engine/jobs/reports durable status. See M14.2 exact command fixtures.';
  if (!api) throw new Error(`Missing ownership/API mapping: ${b.name} (${screen})`);
  return {owner,screen,api};
}
export function annotateOwnership(groups) {
  for(const g of groups) for(const b of g.boards) if(b.legend) {
    const c=boardContract(b,g);
    b.legend.notes.push(`Implementation owner ${c.owner}. API seam: ${c.api}`, 'Unrendered lifecycle/interaction acceptance cases are mapped in ownership-ledger.md; this static board is not a Textual runtime test.');
  }
}
export function writeOwnershipLedger(groups,system) {
  const all=[...system.map(b=>({b,g:{id:'system'}})),...groups.flatMap(g=>g.boards.map(b=>({b,g})))];
  const names=new Set(all.map(({b})=>b.name));
  const count=all.reduce((n,{b})=>n+(b.sizes??['wide']).length,0);
  const rows=all.map(({b,g})=>{
    const c=boardContract(b,g), sizes=b.sizes??['wide'];
    const links=sizes.map(size=>`[${size==='wide'?'120×40':'80×24'}](preview/${b.name==='NavMap'?'Main':b.name}${size==='compact'?'-80x24':''}.dc.html)`).join(' / ');
    return `| ${b.name} | ${links} | ${c.screen.replaceAll('|','/')} · ${b.title} | [${c.owner}](../../modules/${children[c.owner]}) | ${b.legend?.file??(b.special==='report'?'generated HTML artifact':'shared design reference')} | ${c.api.replaceAll('|','/')} |`;
  });
  const text=`# Screen, state, API and ownership ledger\n\nGenerated by \`node src/build.mjs\` from all four board catalogs and \`src/ownership.mjs\`. ${names.size} named states produce ${count} artboards. Each rendered row below is one static illustrative state with exactly the listed sizes; focus frames change focus appearance only. No API, worker, Textual Pilot test, live observer, lifecycle transition or browser-report calculation is implemented by these pictures. Proposed screen paths are implementation targets, not existing runtime files.\n\nModule parents/children are normative. Canvas placement and generator-file location do not assign implementation ownership. M17 owns all fourteen ZIP screens/states, VMs and ZIP/validation widgets in exchange.py; M01/M02 only open injected factories. M01 owns NewTemplateScreen. M03 owns CollectorGuideScreen. M12 owns judge_capability.py. M15 owns the global palette, showcase and compact RunListDetail widget; M11 supplies its real run data and handles actions. Shared ConfirmScreen/PromptScreen stay M15 while their callers own the single command.\n\nAll runtime queries use EngineClient. Event consumers use M15 SubscriptionHub with full EventCursor/revision/resync semantics; exact topics and errors stay in each owner spec. RunLabel is display-only; RunUid and explicit TrialRef/ResultId scope requests. Fictional IDs/models/dates in illustrations are not verified provider claims.\n\n## Rendered states\n\n| Artboard | Rendered sizes | Screen / rendered state | Owner | Proposed file / surface | Query, command or navigation seam |\n|---|---|---|---|---|---|\n${rows.join('\n')}\n\n## Contract-only future acceptance states\n\nThese cases are assigned to an existing screen and child below. They have no separate rendered artboard unless explicitly present above. They must be exercised against real view models/fake clients in the owning implementation and through later integration gates; a build of this directory does not pass them. The rows add lifecycle/error coverage, not product controls.\n\n| Owner | Existing screen/artboard family | Future test states and obligations | Child acceptance owner |\n|---|---|---|---|\n${CONTRACT_ONLY.map(([owner,boards,states,child])=>`| ${owner} | ${boards} | ${states} | [${child}](../../../${child}) |`).join('\n')}\n\nAdditional context-analysis, decision-engine setup and benchmark-statistics designs are specified in the [context-analysis design handoff](../../../CONTEXT-DESIGN-HANDOFF.md). These additions remain unrendered until new boards and acceptance states are implemented.\n\n## Static verification\n\nRun \`node src/build.mjs\`, \`node src/animation.mjs\` and \`node src/verify.mjs\` from this directory. The verifier checks all declared size/focus variants, grid boundaries, table/footer guards, exact M09 IDs/counts/phase totals/Pi failures, full deletion digests and cancellation/default focus, F16/F19 account/model/rate separation, F17 selected-task labels, all fourteen M17 ownership mappings, source/preview matching, links and exhaustive ledger coverage. Browser inspection supplements those structural checks; neither is a runtime Textual test.\n`;
  writeFileSync(new URL('../ownership-ledger.md', import.meta.url),text);
}
