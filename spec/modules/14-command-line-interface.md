# M14 — Command-line and unattended access

Status: proposed requirements. [SPEC.md](../SPEC.md), especially Command-line access and execution acceptance, remains authoritative. These contracts describe implementation work, not existing functionality.

## Purpose and command contracts

The CLI opens the primary TUI and exposes unattended execution, observation, discovery, reporting and exchange. It is an interchangeable client of the [headless engine](ARCHITECTURE.md): every action uses the same published API as the TUI, and work outlives either interface. [R048–R060, R138, R150]

`RUN_REF` accepts a RunUid or a label identifying exactly one visible run. M02's `results.resolve_run(reference)` resolves it; ambiguity displays candidate UIDs, labels and origins and exits 1 without the dependent action. Subsequent API requests, subscriptions and follow-up commands use `run_uid`. `report RUN_DIR` additionally accepts an engine-owned retained-run directory reference through that resolver; the CLI never inspects retained directories itself. Display the human label alongside UID/origin where identity matters. [F02; R077, R122]

| Required signature | Input, outcome and delegated validation |
|---|---|
| `axbenchmark` | Open M15's TUI, including library/setup and readiness. No subcommand is needed. [R048] |
| `axbenchmark --attach RUN_REF` | Resolve once and open the existing run through M11/M15; no launch, restart or task replay. [R049; R046] |
| `axbenchmark run --config benchmark.yaml --no-tui` | Submit complete settings to M11's `runs.launch`; M07 validates/resolves them. Plain progress, no interactive questions. Print the final launch's trial-budget warning once, with totals, and continue. Completed runs exit 0 even with failed/unverified tasks or a failed completion report; stopped/interrupted runs exit 1 with the engine reason. Wait for the durable completion-report disposition unless `--no-wait-report`. [R050, R060, R134, R158] |
| `axbenchmark status RUN_REF` | Show persisted state, per-trial/task outcomes, saved failures, retention/report status and stop/interruption reason. `--json` is the scriptable task-outcome contract. [R051, R060] |
| `axbenchmark stop RUN_REF` | Explicitly request M11 run stop, including judging and finalization cleanup. Closing an interface is detach. [R052; R046, R139] |
| `axbenchmark models refresh` | M04 discovery/prices/rates refresh; preserve last-valid values and overrides on failure. Print source URL/retrieval date or failure/cached-value age per provider and rate source. Rates are never fetched during a run. [R053; R063, R064, R156] |
| `axbenchmark doctor` | M03 prerequisite guidance and distinct collector failures/remedies; optional sensors stay optional. Report changed approved revision modes (0444 files/0555 folders). No root mode or suggestion to run AxBenchmark elevated. `--verify` requires its explicit consent flow below. [R054, R103, R137] |
| `axbenchmark report RUN_DIR` | Resolve saved run and regenerate M13 standalone offline HTML without model calls. Always print the artifact path and open attempt; opener failure preserves success/location. Frozen display currency is unchanged; `--tariff AMOUNT_PER_KWH --tariff-currency CODE` supplies labelled alternative analysis. [R055, R125, R134] |
| `axbenchmark templates export TEMPLATE_SHA --output template.zip` | M01/M17 exact-revision portable definition export. [R056, R115] |
| `axbenchmark templates import template.zip` | M17 identity/package validation and atomic registration; invalid packages add nothing. [R057, R117, R120] |
| `axbenchmark results export RUN_REF --output results.zip` | Resolve UID, request M17's all-retained-results plan, and export its explicit selected IDs only when enabled; records, evidence, provenance and exact template remain together. [R058, R116] |
| `axbenchmark results import results.zip --template TEMPLATE_SHA` | M17 validates embedded/local identities, digests, references and task/trial identities before atomic import. [R059, R120] |

## Unattended execution and lifecycle

M07 resolves and freezes template, configurations, judge, environment, weights, display currency (default USD), rates and tariff. Missing/invalid settings produce typed issues and remedies, never unresolved execution or a prompt. There is no upper trial limit. M11's initial `LaunchStep` carries the **final** M07 totals and optional warning for any non-local configuration requesting more than five trials: configurations, trials, tasks, task runs and judge sessions. Print its engine message/totals once per launch job; all-local configurations suppress it. Do not run a preliminary CLI `configs.review` or calculate totals locally. [R050, R060, R066, R067, R158]

All planner, competitor and judge work is headless through M05. M11 normally runs one configuration per selected harness, up to four, with same-harness configurations queued and tasks sequential; `--jobs 1` selects sequential mode and the engine retains scheduling. Additional trials remain distinct results. [R012, R045, R077, R138]

Exit status describes the followed operation, not task pass rates. Completed runs exit 0 even with failed/unverified tasks; scripts inspect `status --json`. Stopped/interrupted runs exit 1 with their `outcome_reason`; template invalidation prints approved/computed SHA-256 and changed paths. Typed errors exit 1, parser/consent misuse 2 and engine transport/version failures 3. A typed binding/retention-pending failure exits 1 with UID/checkpoint and remedy without claiming the recovering run has ended. [R050, R051, R060, R153]

Completion-report waiting reads durable `RunStatus.retention`, `RunStatus.completion_report` and M13 `reports.status(completion_run_uid=…)`, including initial snapshots and reconnect. Written/succeeded prints the path/open attempt. Failed, cancelled or skipped prints the engine reason and regeneration command and settles the wait; a completed run still exits 0. Typed retention/persistence-pending errors settle the invocation with exit 1 and the recovery/status command; they are not completed report failures. Stopped/interrupted runs exit 1 without waiting for a completion artifact. `--no-wait-report` exits when the terminal run outcome is printed and gives `axbenchmark report <run_uid>`; the engine still schedules completion reporting. [R050, R134; F03, F13]

Closing, detaching, disconnecting or killing the CLI never requests stop/cancel or manufactures an interruption. Reattachment observes persisted execution without automatic retry/resume. An explicit stop remains available during judging, finalizing and `retention_pending` according to M11's run capability; a completed configuration is not independently stoppable. The CLI displays cleanup and durable pending/failure status instead of waiting forever for a success event. [R046, R049, R052, R060, R077, R138, R139]

## Shared validation and failure boundaries

M03 blocks local planning/execution with no supported harness while library, exchange and saved reporting remain accessible. M04 owns effort/model compatibility and fallback; the CLI never substitutes a model or fabricates readiness. M01/M17 own identity and safe atomic imports: reject unsafe/corrupt/unsupported/mismatched/conflicting packages with no partial addition, print full expected/received identities, and keep identical reimports idempotent. Imports never execute scripts, install dependencies or call models. [R029, R057, R059, R063–R065, R117, R120–R122]

M02 supplies retained records/provenance; M13 regenerates without fresh judging. Historical task/log/evidence/measurement requests carry explicit `ResultId` or `TrialRef {run_uid, configuration_id, trial_index}`. Only an actual live view may resolve its active trial from engine status; the CLI never silently uses current/last trial for a retained selection. Unknown, partial and not-exposed values remain explicit. [R076–R081, R125, R134, R154; F06]

M10 returns money already converted using frozen rates (price currency → USD → display currency); a missing rate stays unknown with `no_rate_conversion`. Mixed-display-currency analyses show USD with the engine label. No retained analysis/report command offers display-currency or rate overrides; only tariff is alternative analysis. M04 rate input/output uses **currency units per 1 USD** (`per_usd`; COP fixture `4000`), never a silent reciprocal. Account billing commands and model effort/price commands remain separate scopes. [R081, R114, R134, R156, R157; F19]

Approved revision files stay read-only. The CLI never changes permissions; M03 prints the engine remedy for altered modes. M01 deletion is a destructive generated command requiring `--yes`; the engine restores write permission only for removal.

## Acceptance criteria

- Exercise all twelve product signatures, plain unattended execution and bare-TUI launch. Invalid/incomplete settings print every typed issue; no prompt or work starts. [R048–R060]
- Resolve a UID and an unambiguous label; same-label imported/local runs fail with candidate UIDs/origins and no stop/export/report call. Each retained trial remains explicit while another trial runs. [R077, R122, R154]
- Test default concurrency, same-harness queues, sequential tasks and `--jobs 1`; both interfaces retain the same scheduling/headless behavior. [R045, R138]
- Detach/SIGKILL and reconnect without restarting tasks or recording interruption. Stop during execution, judging and finalization; cleanup joins children and preserves committed reviews/facts. Pending retention settles CLI waiting with typed reason rather than false completion. [R046, R049, R052, R060, R139]
- Completed failed/unverified tasks exit 0 and appear in `status --json`; stopped/interrupted or identity-invalidated runs exit 1. Recovery from an old-epoch cursor, overflow and snapshots cannot lose outcomes or replace newer state. [R050, R051, R060, R153; F04]
- `doctor --verify`: decline/empty/EOF calls no model, accepts or `--yes` makes exactly one minimal call per selected harness, nonterminal without `--yes` exits 2 with zero calls. Ordinary doctor makes no model calls; collector permission and changed revision-mode remedies remain visible. [R054, R103, R137]
- Six non-local trials print final LaunchStep warning/totals once across replay, terminal snapshots, cache expiry and restart via `JobStatus.initial_progress`, and continue without stdin; all-local trials print none. Report success/failure/cancel/skip/pending/reconnect/cache-expiry settles the wait; opener failure retains the path; `--no-wait-report` does not await artifact generation. [R050, R060, R134, R158]
- Refresh failures keep catalogs/overrides/prices/rates with source and age. COP `4000` is passed/displayed as currency units/USD; account billing never piggybacks on model override. Frozen EUR reporting and unknown missing-rate values preserve records; `report --currency EUR` exits 2. [R053, R055, R063, R064, R134, R156, R157]
- Results export makes resolver → plan(None) → export(explicit IDs) calls in order; unavailable/empty plans stop before export and raced retention changes cannot shrink the selection. Safe/idempotent package round trips and offline retained reporting work with no harness/model access; full digest mismatches, unsafe ZIPs and record conflicts add nothing. [R055–R059, R117, R120–R125]

## Implementation

M14 is a client only: parse arguments, call APIs, follow snapshots/events and present DTOs. It has no engine package/API namespace, persisted state or owned processes, and never reads/writes `~/.axbenchmark/`. The engine owns all work. [R150]

### 1. Engine component

`axbenchmark.client.connect(autostart=True)` is M11's detached-daemon connection entry; M14 neither forks execution workers nor implements transport. The client package follows these inward dependencies:

| Layer | Proposed paths and ownership | Imports |
|---|---|---|
| Presenters | `axbenchmark/cli/presenters/{run,status,doctor,catalog,exchange,report,engine,generic}.py`; pure API DTO/event → `Line` sequences, layout/column/glyph/SHA formatting only; state, reason, remedy and money labels come from engine | `api`, stdlib |
| Ports | `axbenchmark/cli/ports.py`: `Output`, `TuiLauncher`, `Interrupts`, `Consent`; EngineClient remains M11-owned | `api`, presenters |
| Interactions | `axbenchmark/cli/interactions/`: command interactions, `streams.py` snapshot/replay reducer/followers, `references.py` resolver wrapper; no business rules | ports, presenters, `api`, `client` Protocol |
| Adapters | `axbenchmark/cli/{app,output,consent,registry_commands}.py`, `cli/commands/`; Typer, path argument normalization, writers, SIGINT/terminal handling in `interrupts.py` | preceding layers, `typer`, `rich` |

The console entry is `axbenchmark/launcher.py:main`, which binds `TuiLauncher.__call__(*, attach: RunUid | None) -> int` to M15's `axbenchmark/tui/__main__.py:main(*, attach: RunUid | None) -> int`. Only this composition root imports both CLI and TUI; `cli` imports only `api`/`client` among application packages. Wireframe references to `axbenchmark/cli.py` become the package above.

```python
class ExitCode(IntEnum):
    OK = 0
    FAILED = 1
    USAGE = 2
    ENGINE = 3

@dataclass(frozen=True, slots=True)
class Line:
    text: str
    style: Literal["plain", "bold", "muted", "ok", "fail", "warn"] = "plain"
    stream: Literal["out", "err"] = "out"

class Output(Protocol):
    json_mode: bool
    def result(self, model: BaseModel, human: Sequence[Line]) -> None: ...
    def event(self, envelope: EventEnvelope, human: Sequence[Line]) -> None: ...
    def error(self, err: EngineError) -> None: ...
    def notice(self, lines: Sequence[Line]) -> None: ...  # human only

class TuiLauncher(Protocol):
    def __call__(self, *, attach: RunUid | None) -> int: ...
class Interrupts(Protocol):
    def detach_requested(self) -> asyncio.Event: ...
class Consent(Protocol):
    def interactive(self) -> bool: ...  # stdin and stderr both terminals
    def ask(self, lines: Sequence[Line]) -> bool: ...  # only y/yes true; empty/EOF false

async def follow_job(client: EngineClient, job: JobRef, out: Output,
                     interrupts: Interrupts) -> JobFinished | Detached: ...
async def follow_run(client: EngineClient, run_uid: RunUid, out: Output,
                     interrupts: Interrupts) -> RunStatus | Detached: ...
```

Followers use `job:<job_id>` and `run:<run_uid>` with `EventCursor {epoch, seq}`. Render the initial snapshot, then process each envelope in cursor order; advance the last fully applied cursor even when a stale object update is skipped. Preserve stable object revisions, tombstones and append-entry IDs. Reconnect once with the full cursor on the unchanged topic set; a second transport failure exits 3 and leaves work owned by the engine. Replay keeps projections; snapshot/resync replaces projections and clears prior revision/dedup state, then installs the new subscription generation. Ignore obsolete-generation deliveries. Event-only topic resync re-queries its owner. Follow the shared M11 algorithm; do not invent a bare-sequence shortcut. [F04]

Job snapshots can already be terminal. Run snapshots can already contain stop completion, retention errors or report dispositions. Report jobs recover from `reports.status(report_id=job_id)` when a generic job expires or reconnect/resync needs owner state. A report wait uses durable owner/run status from the beginning, never only `reports.report.written` or `job.finished`. It does not call M13's internal `CompletionReports`; M11 awaits that port and publishes its durable projection.

SIGINT while following sets `Interrupts`, closes subscriptions, prints UID-based attach/status/stop commands (or jobs get/cancel) and exits 0. SIGHUP/SIGTERM/terminal close detach without output; SIGKILL requires no handler to preserve engine work. No signal handler sends any command. A changed connection/epoch never reissues `runs.launch` or repeats a destructive action.

`RunUnattended` makes one `runs.launch(config_path, execution)` call. Read the final-preparation `LaunchStep` from `JobStatus.initial_progress` in `jobs.get`/job snapshots as well as live progress; this write-once field is separate from latest `progress` and survives job finish, cache expiry and engine restart. Print its optional `trial_budget_warning` once per `job_id` in this CLI invocation, to stderr in human mode or one typed warning JSON line. Keep this printed-job set separate from subscription revision/dedup maps, so replay or replacement snapshots cannot repeat a warning; inspect initial_progress even when the job snapshot is already terminal. No preliminary review or warning acknowledgement exists. [R158]

`doctor --verify` is the sole stdin-reading interaction. With `--yes`, skip plan/prompt and send `environment.verify(consent=true, harnesses)`. Otherwise noninteractive exits 2 **before connection** with a message naming `--yes`; interactive calls `environment.verification_plan`, displays its harness labels/versions and one-minimal-call note, then `[y/N]` on stderr. No/empty/EOF exits 0 with “No verification call was made.” Only Yes submits verification. [R137]

Normalize actual filesystem arguments (`--config`, ZIP/input/output and explicit directory references) lexically against the CLI cwd before sending them; do not open/stat them. Preserve a UID or label string unchanged for engine resolution. A relative retained-directory reference must be explicit (`./…` or `../…`); a bare token is a UID/label. `--params-file` alone reads a client-supplied JSON request document; it must not become a private retained-store access path.

### 2. API surface

M14 owns no engine methods/events. Application errors use JSON-RPC integer `error.code=-32000`, namespaced `error.data.code`, message and optional field/remedy/details, decoded into `EngineError`. InProcessClient uses the identical codec; CLI prints fields verbatim without prose parsing. `ProtocolError(rpc_code, message, data)` remains distinct from application errors and maps to exit 3 as engine/protocol incompatibility; locally malformed parser/request input exits 2 before dispatch. [F18]

| Mode | stdout | stderr |
|---|---|---|
| Human | Results/progress, glyphs paired with words. No color when not TTY or `NO_COLOR`; cost/status text from engine. | Typed error code/message/field/remedy, transport failures, launch warning and permitted doctor consent prompt. |
| `--json` | Query/command response model as one document. Jobs/streams emit typed JSON lines: `{"event": EventEnvelope}` (full subscription ID/cursor/revisions), `{"subscription": Subscription}` on snapshot/resync, `{"warning": TrialBudgetWarningDTO}`, final `{"result": …}` or `{"error": {"code", "message", "field", "remedy", "data"}}`; detach uses `{"detached": {"run_uid": …}}` or `{"detached": {"job_id": …}}`. Protocol failures use a separate `{"protocol_error": {"rpc_code", "message", "data"}}` wrapper. Publish schemas for these client wrappers. | Only a transport failure before the writer exists or interactive doctor consent prompt; no human progress mixed into stdout. |

| Exit | Meaning |
|---|---|
| 0 | Successful operation, completed followed run regardless of task failures or settled completion-report failure/cancel/skip, status of any known state, detach, declined verification, or successful inspection/refresh with per-source findings. |
| 1 | Typed engine/owner error, including pending persistence/retention; refused stop/import; stopped/interrupted followed run. A separately requested report job cancelled/skipped without a successful artifact also exits 1. |
| 2 | Invalid parser usage, malformed local params, absent destructive generic `--yes`, or noninteractive verification without `--yes`; no engine request sent. |
| 3 | Unreachable/unstartable engine, incompatible API major or protocol failure; never coerce to a typed domain code. |

### 3. Requires from other modules

| Published interface | Owner | M14 use |
|---|---|---|
| `connect`, `EngineClient`, `InProcessClient`, `engine.hello/status/stop/methods` | M11 | Same registry/codec, autostart, status without autostart; stop refuses active runs/jobs with typed IDs/reasons. |
| `events.subscribe(topics,cursor?)`, `jobs.get/cancel`, revisioned `Subscription`/`EventEnvelope` | M11 | Durable-owner-aware followers, replay/resync, generic jobs. |
| `results.resolve_run(reference) -> RunResolutionDTO`, `results.get_run(run_uid)` | M02 | UID/unambiguous label and permitted retained-directory resolution; candidate UIDs/origins on `runs.ambiguous_run`. |
| `runs.launch(config_path,execution?) -> JobRef`, `JobStatus.initial_progress: LaunchStep`, `LaunchResult(run_uid,…)` | M11/M07 | One launch, retained final warning/totals from jobs.get/job snapshots after finish/cache expiry/restart; typed `configs.incomplete` before staging; no preview pass. |
| `runs.status(run_uid)`, `runs.stop(run_uid,scope,configuration_id?)`, run snapshots and stop receipts | M11/M12 | Task/trial/state display; judging/finalization stop, retention/error/report projection. |
| `judging.status(run_uid)`, `judging.batch.*`, `judging.review.finished` | M12/M11 routing | Run-related judging display; registered run stream carries the relevant events. |
| `harness.configuration.describe(run_uid,configuration_id)`; retained task APIs with explicit TrialRef/ResultId | M05 | Detailed settings and generated historical access without implicit trial selection. |
| `environment.recheck`, `verification_plan`, `verify(consent,harnesses?)` | M03 | Readiness/collectors/revision modes and explicit minimal-call consent. |
| `catalog.refresh`, price/rate events; model/account/rate command request schemas | M04 | Scope-filtered refresh, cached source ages, distinct overrides and units. |
| `reports.generate(scope={run_uid},tariff?)`, `reports.status` with exactly one of `report_id` or `completion_run_uid` | M13 | Manual report job and durable completion disposition/path; unknown job cache does not erase owner outcome. |
| `exchange.export_template/import_template`, `plan_result_export(run_uid,result_ids=None) -> ResultExportPlan`, `export_results(run_uid,result_ids: nonempty list[ResultId],path) -> JobRef`, `inspect_results` then `import_results(staging_id)` | M17 | Plan resolves all retained IDs and returns selected_result_ids/can_export; export requires the explicit list and revalidates it. Exact-revision export and atomic, idempotent imports remain engine-owned. |
| TUI launcher accepting resolved RunUid; module registry hints | M15/all owners | Default/attached TUI composition and generated access. |

### 4. Screens

M14 owns plain terminal artboards, not Textual screens. Presenters implement the board's layout; requirements above override stale example IDs/wire contracts. Wide and compact variants are exercised at 120×40 and 80×24; CliRun selects compact below 100 columns.

| Artboard | Interaction/presenter and exact states |
|---|---|
| CliHelp | Root/generated help, twelve product signatures first, API access, exits 0–3; no engine mutation. |
| CliRun (wide, compact) | RunUnattended/run: launch steps/final warning, frozen record/scheduling, queued/running/verifying/judging/finalizing/retention_pending, completed/stopped/interrupted/halted, report pending/written/failed/cancelled/skipped, detach/reconnect/resync. |
| CliInvalid | RunUnattended/run: synchronous `configs.incomplete` issues/checks/remedies in engine order; no admitted launch work. |
| CliStatusStop | ShowStatus/StopRun/status: resolved UID/origin, explicit trials, outcomes/reasons, cleanup receipt, judging/finalization stop, pending retention and refused/ambiguous target. |
| CliDoctor | Doctor/VerifyHarnesses/RefreshModels with doctor/catalog presenters: missing harness/auth/offline/permission/altered revision modes, consent accepted/declined/nonterminal, cached prices/rates and account-vs-model labels. |
| CliExchange | Export/Import/RegenerateReport with exchange/report presenters: progress, added/identical, identity/unsafe/conflict errors, retained readiness, report disposition/path and opener warning. |

M07 ReviewLaunch copies the engine's `LaunchPreview.cli_command`; M14 does not build that TUI text. M15's default/reattach and M11 Detach/RunReattached screens consume UID-based commands; CLI resolves `--attach RUN_REF` before invoking `TuiLauncher(attach=run_uid)`.

### 5. CLI

Every run-reference command resolves exactly once. The results-export row spells out this shared step; the remaining rows start after resolution. Commands operate on returned UIDs, never a displayed label. Errors short-circuit later calls. Human and JSON output preserve engine authority.

| Command | Calls and output |
|---|---|
| `axbenchmark` / `--attach RUN_REF` | Require terminal stdin/stdout, otherwise exit 2 naming `run --no-tui` and `status`. Bare calls `TuiLauncher(attach=None)` with no CLI connection; attach resolves then calls launcher with UID. |
| `run --config FILE --no-tui [--jobs N] [--no-wait-report]` | `runs.launch(config_path,execution)` → follow launch job → follow `run:<run_uid>`; output final warning once, frozen/scheduling data, run logs/outcome, then durable report disposition as specified above. |
| `status RUN_REF [--details] [--json]` | `runs.status(run_uid)` and `judging.status(run_uid)`; details adds `harness.configuration.describe` per configuration. JSON prints authoritative RunStatus including explicit trial outcomes, retention and report state. |
| `stop RUN_REF` | `runs.stop(run_uid,scope="run")`, follow matching `stop_id` in snapshot/events to completed receipt or typed pending/error. Signature itself is explicit stop consent: no prompt/`--yes`. |
| `models refresh [--harness H] [--provider P]` | `catalog.refresh` then job/registered catalog events; context outcomes, source URLs/dates/ages, kept overrides/rates and catalog version. Filters resolve in M04. |
| `doctor [--collectors]` | `environment.recheck(scope="all" or "collectors")`; findings/remedies, permission fixes, revision-mode differences for all scope. No model calls. |
| `doctor --verify [--harness H …] [--yes]` | Consent sequence in section 1, then one verify job when authorized. Minimal call per listed/selected harness; only this interaction reads stdin. |
| `report RUN_DIR [--tariff AMOUNT_PER_KWH --tariff-currency CODE]` | `results.get_run(run_uid)` then `reports.generate(scope={run_uid},tariff?)`; job stream plus durable reports.status. Always print committed path, even if opening fails. |
| `templates export TEMPLATE_SHA --output PATH` / `templates import PATH` | `exchange.export_template(sha256,path)` / `exchange.import_template(path)`; counts/path/full identity or typed rejection. |
| `results export RUN_REF --output PATH` | `results.resolve_run(reference)` → `exchange.plan_result_export(run_uid,result_ids=None)` → require `plan.can_export.enabled` → `exchange.export_results(run_uid,result_ids=plan.selected_result_ids,path=path)` job; print path/count/contents. |
| `results import PATH --template TEMPLATE_SHA` | `exchange.inspect_results(path,template_sha256)` job then `exchange.import_results(staging_id)`; engine validates conflict/mismatch, CLI does not infer permission from preview. |
| `engine status` / `engine stop` | status connects with `autostart=False`; unavailable exits 3. Stop prints refusal IDs/reasons and run stop commands if active, otherwise exit confirmation. |

The simple results-export command requests all retained results through `result_ids=None` **on the plan only**. `ResultExportPlan.selected_result_ids` is the engine-resolved explicit nonempty list; if any selected result is unavailable, the disabled plan prints its typed reason and exits 1 without export. An empty list never means all. The export call revalidates this exact list against retention/scope changes and fails rather than silently omitting records. No new curated subset flag is introduced; generated/API access can pass the existing `result_ids` request field explicitly. The CLI does not enumerate retained files or infer IDs.

`TEMPLATE_SHA` passes as supplied; M01/M17 decide validity. The curated report alternative requires both `--tariff AMOUNT_PER_KWH` and `--tariff-currency CODE`; both absent retains the recorded tariff. Either flag alone is an actionable parser error (exit 2, zero requests) naming its missing partner. Both pass `TariffDTO {per_kwh,currency}` intact; tariff currency denominates the amount and is not a display-currency override. Do not infer a currency or fetch rates. This matches M10's existing CLI contract.

Registry-generated access implements all other published operations:

- Build namespace groups from registry request models, descriptions and `cli_name`/positional hints; scalar/enum/path/boolean fields become options, `_` becomes `-`. Handwritten curated paths take precedence. Whole requests use `--params JSON` or `--params-file PATH`, mutually exclusive with field inputs; parse/schema failures exit 2 before dispatch. No prompt resolves omitted required fields.
- `api list [--namespace NS]`, `api schema METHOD`, `api call METHOD [--params JSON | --params-file PATH] [--yes] [--json]` expose every method; queries/commands print results, jobs follow the common follower. Generated methods always remain reachable by canonical API name despite curated-name precedence.
- Generated/destructive `api call` requires `--yes` or exits 2 with zero calls; this includes `templates.delete` and generic `runs.stop`. `jobs.cancel` keeps M11's `write` safety and does not acquire a new `--yes` requirement. Curated `stop RUN_REF` is the documented explicit-consent exception. No generic destructive prompt exists.
- Preserve owner scope: M04 `models override`/`default` use entry/context APIs, `models billing` uses `catalog.save_account_override`, and `models rate CODE PER_USD` uses `catalog.save_rate_override` with currency units/USD. Billing is never added to model override. Complex owner hints must publish their typed input mapping; M14 does not infer account/context or reciprocals.
- M01 templates, M05 harness/log/isolation, M06 scoring, M07 configs/presets/run record, M08 checks, M09 prompts/checks and M10 measurements are generated owner-hinted commands. All generated commands accept `--json`. Retained requests require ResultId/TrialRef, and display-currency/rate analysis options are absent. `tariff` is a typed TariffDTO when present, not a fabricated display-currency switch.

### 6. Headless verification

| Level | Required evidence |
|---|---|
| Pure presenters | Golden output for all boards/states at both widths; full UID/ambiguity data, trial scope, unknown/partial money, currency/rate/billing labels, source age, remedies and opener path. No rule/calculation occurs in presentation. |
| Interactions with fake EngineClient/Output/Consent/Interrupts | Exact call order and zero extra calls. One launch and final-warning dedup, all exit/report/retention dispositions, explicit historical selection, typed errors, consent matrix, destructive guard, absolute paths and terminal-only TUI. Detach from every followed job/run sends no command. |
| Both clients and real engine registry | JSON schema-valid wrappers/responses; numeric wire vs decoded namespaced error parity; unknown method/protocol distinct. Every method reachable; model/account scopes and COP `4000` round trip. Snapshot-between-events, older revisions/tombstones, finished-before-subscribe, old epoch/lower seq, compaction/overflow and owner-status recovery. |
| Real socket subprocesses with injected harness/browser/sensor adapters | All signatures, genuine SIGINT/SIGKILL detach, autostart, no-autostart status, version failure, stdin `/dev/null` consent, persisted failed-task exit semantics, stop during judging/finalizing/pending with joined children. Correlate stop_id and never repeat launch after reconnect. |
| Real feature integration | M02/M03/M04/M05/M07/M11/M12/M13/M17 storage/services; delayed final accounting/seal/original review, immediately report/export, crash/reconnect/cache expiry, no-harness data paths, failed opener, unsafe/idempotent imports and same-label distinct runs. No model access during report/import. |
| Import boundaries | CLI only API/client imports; pure presenters exclude client/Typer/Rich; launcher alone combines TUI/CLI. No CLI private-store access, execution lifetime or business-rule duplication. |

### 7. Implementation children and completion gate

| Child | Bounded deliverable | Completed implementation prerequisites |
|---|---|---|
| [M14.1 — registry-cli](implementation/M14/01-registry-cli.md) | Typer composition, generated access/help/JSON, typed errors, destructive guard and shared stream substrate | M11.1 engine-client-api and M11.2 events-jobs-lifecycle; Bootstrap registry/DTO contracts |
| [M14.2 — curated-cli-flows](implementation/M14/02-curated-cli-flows.md) | Product commands, UID resolution, run/stop/report/consent flows and real-socket process acceptance | M14.1 and the relevant completed engine services listed by the child |

These children are proposed work packages, not implementation completion. Bootstrap contracts/fakes unblock isolated composition and presentation checks; they cannot substitute for actual storage/lifecycle/services in the parent gate. Parent completion requires both children, M15 real launcher/navigation and all real integration rows above.

**Pending integration and wireframe obligations:** verify M11's published durable `JobStatus.initial_progress` and stop/retention/report projections through real clients; M02's resolver must cover visible active and retained UIDs/labels with collision details. Exercise the M17 plan-to-explicit-selection export sequence, M13 durable status and M15's published resolved-UID launcher together. M11's canonical `runs.launch(config_path,execution)` and typed-error exit 1 are the shared contract.

Update existing CliHelp/CliRun/CliStatusStop/CliExchange examples to RUN_REF/UID-origin/trial and durable pending/cancel/skip/resync states, plus final LaunchStep warning source, paired `--tariff`/`--tariff-currency` flags and catalog rate units. M15 reattach/detach launcher examples and M04 separate billing/rate boards are their owners' work. Wireframes are not edited by this module-spec task; unchanged previews are not evidence these added states exist.
