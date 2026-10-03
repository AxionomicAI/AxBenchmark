# M14.2 — curated-cli-flows

Parent: [M14 command flows](../reference/modules/14-command-line-interface.md#5-cli). Requirements: R029, R045–R060, R063–R067, R076–R081, R103, R114–R125, R134, R137–R139, R150, R153–R158. Findings: F02, F03, F04, F06, F13, F18, F19; consume F14/F16.

Outcome: all product CLI signatures work through the engine, with unattended launch, UID-resolved observation/stop, explicit verification consent, durable report waits, safe exchange and real-socket exit/lifetime evidence.

## Entry conditions

**Completed implementation prerequisites:** [M14.1](01-registry-cli.md), M02.1–2 retained identity/storage/resolver, M03.1 readiness, M04.1–3 catalog, M05.1–2 process/isolation, M07.2 launch preparation, M11.3 scheduler and M11.4 stop/recovery, M12.2 judging, M13.4 report jobs and M17.2 exchange transactions. Their own completed dependencies include scoring/accounting/evidence retention.

**Bootstrap-published contracts, allowed as test fakes:** TuiLauncher/M15 navigation, deterministic harness/browser/sensor/price/rate adapters and clock/fault ports. Fakes are allowed at external process/provider boundaries, not as a substitute for real run/results/report persistence or dispatch in this child's integration gate.

Use the [foundation boundary](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries) and M14.1 clients/output/registry. No dependency on completed M15 feature screens for isolated CLI acceptance; real launcher/reattach is a pending parent integration.

## Exact proposed ownership

- `axbenchmark/cli/commands/run.py`, `runs.py`, `doctor.py`, `models.py`, `templates.py`, `results.py`, `report.py`; curated composition additions in `cli/app.py` and `launcher.py` only.
- `axbenchmark/cli/interactions/run.py`, `status.py`, `stop.py`, `doctor.py`, `catalog.py`, `exchange.py`, `report.py`, `references.py`; lifecycle/owner-recovery additions in existing `streams.py`.
- `axbenchmark/cli/presenters/run.py`, `status.py`, `doctor.py`, `catalog.py`, `exchange.py`, `report.py`; M14.1 owns shared output/error adapters.
- `tests/cli/test_run.py`, `test_status_stop.py`, `test_references.py`, `test_doctor_consent.py`, `test_catalog.py`, `test_exchange.py`, `test_report.py`, `test_artboards.py`.
- `tests/integration/test_cli_flows.py`, `test_cli_process_lifecycle.py`, `test_cli_report_recovery.py`; `tests/cli/fixtures/artboards/` and fault-controlled run/report scenarios.

Do not implement engine finalization, identity, catalog rules, ZIP validation or report rendering. Request missing provider contracts from their owner; never introduce private storage access or compatibility aliases.

## Database analysis access — R191

Add `axbenchmark database path`, `database info` and `database snapshot --output PATH` over the M02-owned `database.*` APIs in [RESULTS-DATABASE.md](../RESULTS-DATABASE.md). Path/info expose database/schema/view versions and read-only connection guidance; snapshot is an awaited job with an explicit output target and no overwrite by default. CLI does not open the operational writer or execute arbitrary SQL. Test JSON/text parity, paths with spaces, busy/version/storage failures, target collisions and snapshot completion. External tools may independently query the documented database read-only; snapshots support long graph/analysis work without holding the live read transaction.

## Public and internal interfaces

Implement every parent signature using its call table. RUN_REF is UID or unambiguous label through results.resolve_run(reference); ambiguous labels print all candidate UIDs/labels/origins, exit 1 and issue no dependent call. report also accepts an engine-owned retained directory reference.

Preserve UID/label strings; normalize explicit paths lexically to absolute paths without stat/open. Pass run_uid to every API/topic and follow-up command. Historical generated task/log/evidence calls carry ResultId or full TrialRef, including trial_index; only live status may resolve the active trial.

RunUnattended makes exactly one runs.launch(config_path,execution) call, follows its job and returned run UID. M07 validation is synchronous before staging. No preliminary configs.review, auto retry, fallback model or launch replay exists.

Read final LaunchStep.trial_budget_warning/message/totals from JobStatus.initial_progress in jobs.get/job snapshots as well as live progress. The write-once initial field is distinct from latest progress and survives finish/cache expiry/restart; inspect it before settling terminal snapshots. Print once per job in this invocation, retaining printed-job keys independently of replacement subscription dedup maps. Human warning goes to stderr; JSON emits one typed warning line. Never compute totals or read stdin; all-local >5 trials has no warning.

ShowStatus reads runs.status and judging.status, with configuration.describe for --details. JSON emits authoritative RunStatus including trial/task failures, outcome reason, retention and report state. A status query succeeds even for a stopped or retention-pending run.

StopRun resolves then calls runs.stop(run_uid,scope=run), follows its stop_id in snapshot/events and prints cleanup/outcomes. Curated stop itself supplies explicit consent without --yes. Run stop remains admitted during judging/finalizing/retention_pending under engine capability; completed configuration stop stays disabled/refused.

A completed run with failed/unverified tasks exits 0; stopped/interrupted/identity-invalidated exits 1. Typed binding/retention/persistence-pending exits 1 with UID/checkpoint/remedy without claiming terminal execution. All decoded domain errors exit 1, local usage/consent errors 2, unreachable/version/protocol failures 3.

Report following reads RunStatus.retention/completion_report and reports.status(completion_run_uid=run_uid), not a success-only event; reports.status accepts exactly one of completion_run_uid or report_id. M11 internally awaits CompletionReports.ensure/get/wait after durable retention/judging; CLI never calls that internal port.

Written/succeeded prints path/open attempt. Completed-run report failed/cancelled/skipped prints reason/regeneration command and exits 0. Typed retention/persistence pending exits 1; stopped/interrupted exits 1 without awaiting an artifact. --no-wait-report exits after terminal run outcome; engine reporting still continues.

Manual report resolves/get_run, calls reports.generate(scope={run_uid},tariff?), follows job and reports.status(report_id=job_id) on reconnect/resync/cache expiry. Success includes opener failure as warning/path and exits 0; generation error/cancel/skip exits 1. Never lose a committed artifact path when opening or persistence fails.

Pair --tariff AMOUNT_PER_KWH with --tariff-currency CODE: both absent retains recorded tariff, either alone exits 2 before dispatch with a message naming the missing flag, both supply TariffDTO {per_kwh,currency} intact. This is tariff-denomination input; --currency/--rate display-analysis overrides remain invalid. Never infer a currency or fetch new rates.

Doctor ordinary/collectors calls environment.recheck only. Verify --yes skips plan/prompt and sends one verify(consent=true); otherwise nonterminal exits 2 before connecting, interactive calls verification_plan then [y/N]. No/empty/EOF makes no verification call and exits 0. Only an explicitly interactive consent/authoring-review interaction reads stdin; unattended run never does.

RefreshModels delegates scope selection and fallback to catalog.refresh; print context/provider/rate source URL/date or failed-source kept-value age. Rates are currency units per 1 USD (COP 4000), account billing uses save_account_override and model effort/price uses save_override. No reciprocal or cross-scope mutation.

Results export calls results.resolve_run(reference) → exchange.plan_result_export(run_uid,result_ids=None) → exchange.export_results(run_uid,result_ids=plan.selected_result_ids,path=path) -> JobRef only for an enabled plan. None resolves all retained IDs on the plan; export requires an explicit nonempty list. Any unavailable selection disables the plan and exits 1 without export; race failures never shrink the selection. No private file enumeration or new curated subset flag exists; generated/API requests may use the published result_ids field. Other exchange operations preserve parent digests/trial/UID provenance and typed errors. No-harness exchange/reporting makes no model calls.

All followers reuse full EventCursor, revision/tombstone/entry dedup and replacement generations. Reconnect never repeats launch/stop/import. SIGINT/SIGHUP/SIGTERM/SIGKILL and terminal close only detach; typed owner status settles missed report/stop events. A second connection failure exits 3.

## Exact artboards and states

| Board | Fixtures/behavior required |
|---|---|
| CliHelp | All twelve signatures, --jobs, --no-wait-report, paired tariff flags, --yes policy and exits 0–3. |
| CliRun wide/compact | Final warning/frozen/scheduling, queued/running/verifying/judging/finalizing/retention_pending, complete/failed-task/stopped/interrupted/halted, report pending/written/failed/cancelled/skipped, detach/reconnect/resync. |
| CliInvalid | Ordered configs.incomplete checks/issues/source/remedy and no admitted work. |
| CliStatusStop | UID/origin/trial selection, saved failure, ambiguity, cleanup, already-stopped/refused configuration, stop during judge/finalize, pending retention and matching stop_id. |
| CliDoctor | Missing/auth/offline/permission/changed revision modes; verification consent/default-No/nonterminal; provider/rate failures with source ages and distinct account billing. |
| CliExchange | Export success, import added/identical/unsafe/digest/conflict, partial-retention refusal, report path/open warning, cancelled/skipped/pending/recovered status. |

Golden output at 120×40 and 80×24, CliRun compact below 100 columns. Engine text/remedies stay authoritative; full digests on mismatch, UID/origin on ambiguity, no color dependence. M15's RunReattached/Detach are integration consumers, not M14 screens.

Extend measurement/result/ranking/report human presenters with primary Gen tok/s, In tok (cached), Out tok (reasoning), Files / LOC fields from owner DTOs. Generation summaries say pooled with exact matched N/D available; token/file/LOC summaries say mean/range, final size includes baseline and missing detail remains unknown. Analysis inputs forward complete schema-2 weights/directions/policies through the registry/API path and preserve them in exported configs/reports; CLI supplies no scorer, native token estimator, artifact scanner or inferred direction. Existing tariff/currency, exit and whole-roster behavior is unchanged.

**Frozen domain contract.** Curated run/status/doctor/report/exchange presenters preserve frozen family/version/category labels and domain coverage/modality limitations. Show native missing target, DevOps plan-only, agent simulation/replay/live and specification structural-only evidence honestly; approved agent evaluation budget/authority and separate verification auxiliary use are printed from owner DTOs. No unattended fallback profile, app execution or grading call is introduced; text-only domains do not print missing-browser errors absent such a check.

Curated refresh/status/result/report formatting displays owner variant refs/facets, requested/resolved/effective proof, creator roles/date kinds/precision and comparison mode/confounds without claiming alias equality. Existing report/rank flows pass published `filters.variants` unchanged when selected through registry/API whole-request forms; do not invent private flags or recompute strict matching. `results.annotate_variant` uses explicit prior-snapshot and operation IDs, never automatic adoption on import/read. Print mismatch versus unverified separately and retain affected TrialRefs and exact remedy; a configuration model rejection follows existing exit/lifecycle policy.

**Database command ownership.** Add `cli/commands/database.py`, `interactions/database.py`, `presenters/database.py` and `tests/cli/test_database.py` within this child. `database path` prints configured path/presence/access; `database info` prints runtime/schema/view/catalog/count coverage and reports an optional explicit statistics job; `database snapshot --output PATH` awaits M02 output path/size/pin/checksum. No-output path/info remains discovery-safe. Reuse exact shared typed errors and snapshot follower; do not inspect private database files to improve output.

**Route, comparison and profile interfaces.** Bind `existing-agents inspect --alias ALIAS_NAME --source SOURCE_FILE`, `existing-agents register --inspection INSPECTION_ID --name PROFILE_NAME`, `configs existing-agent-select ... --role competitor|harness_judge`, access-profiles commands and compare-harnesses to their M04/M03/M07 methods. `compare-harnesses --config CONFIG --model-binding REF --effort-contract REF --access-profile REF --trials N` opens a revision-scoped draft; --harnesses is explicit subset, --mode exploratory discloses uncertainty, --output uses configs.comparison_export with guarded atomic no-overwrite. Otherwise return draft ID. Exact route qualification has --harness/--model-binding/--effort-contract/--budget and explicit bounded diagnostic confirmation. Existing `run --config FILE` alone launches after owner revalidation. Source paths remain local parameters; no example privately supplies them.

**Cross-harness and access-profile commands — R192–R193.**

Bind the curated `access-profiles list/inspect/qualify` and `compare-harnesses` commands from [CROSS-HARNESS-COMPARISON.md](../CROSS-HARNESS-COMPARISON.md#apis-cli-and-design-engine-handoff) to M04/M03/M07 APIs. Preview produces a full six-cell matrix and reviewed draft/save reference; execute via existing `axbenchmark run --config FILE` / `runs.launch`, never a separate scheduler. JSON carries all unsupported/unselected reasons, explicit effort/mapping and partial-coverage labels. Qualification requires its separately bounded diagnostic consent/budget and uses verification accounting. Parser tests ensure unsupported settings do not silently fall back and a loopback remote proxy retains remote-budget warnings.

**Existing alias/profile commands — R194.**

Expose the existing-agent inspect/register/select commands defined in [CROSS-HARNESS-COMPARISON.md](../CROSS-HARNESS-COMPARISON.md) through M04/M07 APIs. Print sanitized resolved harness, declaration sources, treatment, conflicts and unknown effective settings. No client shell evaluates an alias or sources startup files to make it available. Selection is explicit by profile/version/entry or matrix cell; existing run/export routes consume the reviewed draft. Test alias-not-on-PATH, dynamic-source refusal, missing profile, stale revision, credential presence-only output and explicit transformation labels.

## Integrated requirements

R192, R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R191 — [authoritative SQLite results and analyses](../RESULTS-DATABASE.md).
R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R189 — [human review](../M12/05-human-review-web.md).

R184, R185, R186, R187, R188 — frozen domain profile/evidence contracts: [R184](../quality-judges/BACKEND.md); [R185](../quality-judges/MOBILE.md); [R186](../quality-judges/DEVOPS.md); [R187](../quality-judges/AGENTIC.md); [R188](../quality-judges/SPECIFICATION.md).

R173, R175, R176 — [benchmark statistics](../BENCHMARK-STATISTICS.md).

R166, R168, R172 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

R177, R178, R180, R183, R181, R182 — [benchmark modes](../BENCHMARK-MODES.md); [Cursor](../M05/08-cursor-adapter.md) and [OpenCode](../M05/09-opencode-adapter.md) registry contracts.

Add `templates create --type one-shot --prompt TEXT|--prompt-file PATH --project-type TYPE --target-dir PATH` and `--type multi-step --spec PATH --spec PATH ...` using the parent's M16 manual API bindings. Preserve repeated spec-flag order; CLI only normalizes path syntax and passes exact text/file references, while the engine stages/validates bytes. Inspect target first, present engine mode/counts/exclusions and profile issues, then create the durable manual job with idempotency binding and use the shared explicit approval flow. No-harness/Git manual create/import/edit/approve invokes no planner/readiness/catalog model calls; Generate with planner is a separate explicit route.

Harness filters/completion derive all six registry IDs. Doctor/run/status render Git execution-only blockers, frozen mode/stage totals, locked commit policy and scoped commit failures/unverified causes; CLI never commits or repairs. Add parser/client tests for both modes, seven project types, ordered paths with spaces/Unicode, conflicting/invalid input forms, stale capture/approval, missing Git, Cursor/OpenCode capability errors and registry-derived jobs default with explicit 4/5 preserved. Human and JSON outputs retain the same owner fields.

Own curated `context sessions RESULT_ID`, `context snapshot/history/segments RESULT_ID --invocation … --session … --agent … --window …`, `context analysis RESULT_ID ANALYSIS_ID`, and `context reclassify RESULT_ID --source-digest … --decision-profile-ref … --question-pack-ref … --acceptance-policy … --budget … --resource-policy … --idempotency-key …`. Dispatch the exact measurements.context methods; reclassify returns the cancellable M11 job/analysis ID. Add `decisions profiles list/save/test` with immutable version/digest and explicit metadata versus resource-consuming inference mode. JSON preserves every provenance field; text preserves scope/nulls/coverage, deferred state and separate observer costs. No command infers another profile or promotes a generic chat route to READY.

**Human headless lifecycle:** run --no-tui follows state=judging/wait_reason=human_input as Awaiting human review with pending/submitting counts and durable batch reference. Explicit Human authorizes waiting after all seals; --no-wait-report bypasses only report following after terminal retention, never original human settlement. Print attach/status/stop and generic `api call judging.human.reopen` guidance; the initial/open-failure private handoff may show the scoped local URL, never a public bind/remote-sharing fallback. SIGINT detaches successfully and cancels nothing. Status/reconnect/restart does not auto-open a browser. Test SSH/opener failure, expired credentials/manual reopen, delayed submit receipt, skip, run stop versus additional cancellation and typed persistence errors; only real dispositions permit completion/report handling.

## Acceptance and faults

**Route/profile acceptance:** Parser/API tests cover inspect/register/select as separate actions, full six JSON cells, strict jobs=1, explicit subset, no implicit compatible-only launch, stale export, protected/existing output and route consent rejection. Exported blocked plans stay blocked; default-model smoke cannot satisfy qualify. No shell sourcing/private configuration read occurs.

**SQLite acceptance:** Use real daemon/M02 on a fresh root for path/info without writes, then initialize operational storage and snapshot during concurrent writes. Validate JSON/text parity, absent DB snapshot error, protected/same-source targets, output collision, busy/cancel/failure and complete standalone output.

**Variant acceptance:** CLI fixture flows preserve full filter/view/signature selection through rank/report, paginated metadata and offline export/import. Same-label variants remain separate, As recorded cannot clear a mismatch, conflicting annotation retries fail and no stdin prompt/model call/current metadata fetch is added.

**Domain acceptance:** Add human/JSON six-family golden flows with absent native/device/model prerequisites, retained unknown evidence and offline import/report. Assert exact owner calls and zero evaluation/regrade on viewing; existing exit/wait/detach semantics remain unchanged.

Add wide/compact human and JSON goldens for all four fields, pooled versus mean, partial pairs, independent files/LOC/cached/reasoning and enabled-policy exclusions. Through real clients save/load schema-2 weights, apply/reset/export and generate/import a report with all model ports disabled; compare exact values, full rosters, directions/policies, original digests and score vectors across CLI/TUI/HTML.

Extend existing fixtures for native-only and delayed/partial analysis, explicit local overlap/unknown attribution, distinct decision/harness/human fingerprints and offline or disabled-engine operation as applicable. Assert unchanged scope/digests, no fabricated values/calls, and no reclassification triggered by viewing, export/import or navigation.

```sh
pytest tests/cli/test_run.py tests/cli/test_status_stop.py tests/cli/test_references.py tests/cli/test_doctor_consent.py tests/cli/test_catalog.py tests/cli/test_exchange.py tests/cli/test_report.py tests/cli/test_artboards.py tests/integration/test_cli_flows.py tests/integration/test_cli_process_lifecycle.py tests/integration/test_cli_report_recovery.py
```

1. Exercise every signature with real dispatch/storage over socket and in-process clients. Duplicate same-label runs from two origins never select silently; report/export stay distinct. Two trials with different T1 logs/outcomes remain explicitly scoped while trial 2 runs.
2. `/dev/null` doctor verify without --yes exits 2 with zero calls; decline/EOF makes none, accept/--yes exactly one minimal call per listed harness. Six remote trials warn once across progress/replay/replacement snapshots and recover initial_progress after finish/cache expiry/restart without stdin; all-local warns zero times.
3. Start real subprocess run, SIGINT and SIGKILL it, reconnect and verify same task invocations/no interruption. Stop during execution, active judge, finalization and retention_pending; join children/services, retain committed reviews/facts, settle receipt/pending output and never hang report wait.
4. Completed failed/unverified tasks exit 0; stopped/interrupted/identity invalidation exits 1 with retained reason/digests/paths. Typed validation errors exit 1, parser errors 2, unreachable/mismatched engine 3; status of any known state exits 0.
5. Delay verification/measurement/energy/review durability, then immediately report/export. No sealed-result mutation or early report. Miss report success/failure/cancel/skip, expire job cache, crash/restart at lower seq and overflow/resync; durable status settles once without stale-state regression.
6. Race stop with report publication and detach with completion; success retains committed path, pending persistence prints path/checkpoint if available, failed opener exits 0. --no-wait-report does not await generation; report paired tariff flags map exactly and lone/forbidden flags send nothing.
7. No-harness report/exchange succeeds with model ports set to fail. Resolver/plan(None)/export(explicit IDs) call order is exact; unavailable/empty plan makes no export call and raced retention changes never omit IDs. Tampered/unsafe/conflicting ZIP adds nothing, identical reimport skips; frozen EUR/missing-rate/COP 4000/billing-scope fixtures preserve original bytes and source labels.

## Real integration and pending parent work

Compose actual M02/M03/M04/M05/M07/M10/M11/M12/M13/M17 services and storage, with deterministic external adapters; run real-socket process/consent/exit/race cases. Add real M15 default/attach launcher navigation and M17 round trips before parent acceptance; fake-client golden tests alone cannot close it.

**Pending parent obligations:** all M14.1 checks and real conformance with M15 main(*, attach: RunUid | None) -> int, M11 JobStatus.initial_progress/stop/report projections, M13 reports.status and M17 plan-to-explicit-selection export. M11 canonical launch arguments and typed-error exit 1 are shared; M06/M13 own their paired tariff flag examples. Update CLI boards for UID/trials, report/retention dispositions and --tariff-currency, plus M04 rate/billing and M15 attach examples. This spec task does not edit wireframes or claim runtime tests have run.
