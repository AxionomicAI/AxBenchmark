# M13.4 — report-jobs-screens

Parent: [M13 jobs and screens](../../13-standalone-html-report.md#2-api-surface-reports). Requirements: R016, R035, R046, R055, R067, R131–R134, R139, R143, R148, R150, R153. Findings: F02, F03, F09, F18; shared F04/F05/F07/F08/F13/F15.

Outcome: plan/generate/open/reveal through the engine API and TUI, with durable completion dispositions and reconnect/cancel behavior that always resolves run report waits.

## Entry conditions

**Completed implementation prerequisites:** [M13.3](03-report-charts.md), M11.1 engine-client-api, M11.2 jobs-events, M15.1 tui-foundation and M15.2 tui-shell from the [foundation boundary](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries). Reuse clients/registry/subscription manager; do not implement a private transport or widget shell.

**Bootstrap-published contracts, allowed as injected fixtures:** M11 scheduler/lifecycle gate and RunStatus report projection, M12 original settlement, M02 ReportScreen factory, M06 AnalysisSelection, M14 command adapters. Real M11.4/M12.2/M14/M15 completion integration is mandatory before parent acceptance, not a circular entry condition.

## Exact proposed ownership

- `axbenchmark/engine/reports/application/plan.py`, `generate.py`, `completion.py`, `status.py`, `reconcile.py`, `reveal.py`; job/ledger additions to `ports.py` and application interfaces.
- `axbenchmark/engine/reports/adapters/system_opener.py`, `yaml_ledger.py`, `rpc.py`; M13-owned API models in `axbenchmark/api/reports.py`.
- M13 registration/composition additions in existing API registry and engine daemon composition only, coordinated with M11; no generic job/client implementation changes.
- ReportGenerateScreen/ReportProgressScreen portions of `axbenchmark/tui/screens/results.py` only; M02 retains ResultsScreen/ReportScreen. `tui/viewmodels/report.py`, report styles/factory registrations through M15.
- `tests/engine/reports/test_jobs.py`, `test_completion.py`, `test_recovery.py`, `test_opener.py`; `tests/api/test_reports.py`, `tests/integration/test_report_completion.py`.
- `tests/tui/test_report_viewmodels.py`, `test_report_generate.py`, `test_report_progress.py`, `test_report_navigation.py`; `tests/tui/fixtures/reports/` all named and error/reconnect variants.

## APIs and durable interfaces

Implement reports.plan, reports.generate, reports.status and reports.reveal exactly as parent. Public scopes are template_sha256 or run_uid; CLI labels/paths resolve through M02 with typed ambiguity/candidate UIDs/origins before generation. No display-currency/rate request field exists. M14's paired `--tariff AMOUNT_PER_KWH --tariff-currency CODE` forwards `TariffDTO {per_kwh, currency}` unchanged; both absent uses recorded tariff, either alone is a parser input error (exit 2, zero requests) naming the missing partner. Tariff currency denominates the amount and never switches the frozen display currency or fetches new rates.

ReportPlan returns scope/pin metadata, readiness/capabilities, locked parts, weights/tariff labels, counts and default target. It is advisory: GenerateReport recaptures/revalidates and cannot rely on old enabled state. ReportStatus persists report_id=job_id, pending/running/disposition, error, outcome/path and revision beyond job-cache expiry.

`CompletionReports.ensure(run_uid) -> ReportStatus`, `.get(run_uid) -> ReportStatus`, `.wait(run_uid) -> ReportDisposition` are awaited M11 ports. Key original completion intent uniquely by RunUid; use the parent's UID-suffixed default artifact path so two same-template/day completions cannot overwrite or block each other. M11 calls after M02 terminal retention and M12 durable original settlement; never trigger correctness from run.state.changed delivery.

ReportDisposition is succeeded(ReportOutcome), failed(ErrorDTO), cancelled(reason) or skipped(reason). Map succeeded to M11 completion_report.state=written; pending/running remain nonterminal. Stopped/interrupted/invalidated completion is skipped; unresolved retention/persistence returns typed reports.retention_pending/reports.persistence_pending instead of an endless wait.

Every typed application failure uses JSON-RPC outer integer -32000 and namespaced data.code with field/remedy/data, decoded identically by both clients. Protocol errors remain distinct. Preserve checkpoint/UID and committed artifact path in pending persistence errors.

## Publication, cancellation and recovery

Persist report intent/target/pinned digest before writes. Generate follows READ/SCORE/ESCAPE/EMBED/WRITE/OPEN; M13.1's guarded publish rechecks retention/review/invalidation versions and serializes commit with cancellation. A detected identity invalidation before publication refuses the selected scope.

Precommit cancel/failure discards the owned temp file and durably settles cancelled/failed. A rename already admitted wins late cancel: keep the artifact, finish/persist succeeded and show its path. Do not claim a cancelled job that later emits report.written.

Journal final path/digest/size before rename; recover after each checkpoint. Precommit orphan work settles without a model or regenerated new snapshot; committed matching file reconciles to success and ledger entry. Conflicting/corrupt file is a typed failure, never silently replaced.

Persist outcome before reports.report.written/job.finished and copy completion state to RunStatus before its notification. On storage failure expose pending error/path and retry the same intent. Restart or expired generic job cache consults owner status; missed notifications cannot lose success/failure/cancel/skip.

SystemOpener invokes macOS open/open -R or Linux xdg-open via argv without shell, bounded timeout. Record every attempt; failure is a warning in successful artifact outcome, not lost file or job failure. Recovery does not repeat an already recorded open attempt. Reveal accepts only known ledger paths and preserves path on failure.

## Exact boards and states

| Board/state | Required behavior |
|---|---|
| ReportGenerate | Full SHA, origin/UID scope, counts, groups, tariff/currency labels, locked contents, original/alternative radios, path and engine generate capability. |
| ReportGenerateDefaults | Exact profile-defaults label for differing originals; independent weight options and original sets; no client calculation. |
| ReportProgress | READ/SCORE/ESCAPE/EMBED/WRITE/OPEN steps, counts/bar, cancellation and typed failure/pending path. |
| ReportReady (M02-owned) | Committed path/size/count/groups/weights, opener warning and reveal action; never hide path. |
| ReportPage (artifact) | Integrate M13.1–3 output; not a Textual screen. |
| Additional states | Loading/form/empty/error, retention-pending, invalidated, stale plan, target exists/invalid path, running, cancellation pending, cancelled, skipped, failed, persistence pending, commit-won-cancel, reconnect/cache expiry. |

Render dialogs at 120×40 and 80×24. Preserve parent widget IDs #report-scope, #report-weights, #report-contents, #report-path, #generate, #report-steps and ContentSwitcher loading/empty/error variants. Show engine messages/remedies verbatim.

Mount generate calls reports.plan once; edited path/radio uses no call until ctrl+s/Generate invokes reports.generate once. Target-exists remedy reissues only with explicit overwrite=true. Escape/Cancel before submission dismisses without a write.

Progress mounts via events.subscribe([job:<id>], cursor=EventCursor) through M15 snapshot/replay manager. Apply object revisions/replacement generations; reports.status recovers expired jobs and owner state after resync. Escape/Cancel requests jobs.cancel; unmount/detach only unsubscribes. Durable success navigates to M02 ReportScreen once; other dispositions/pending errors render their reason and stop any local success-only wait.

## Acceptance and faults

```sh
pytest tests/engine/reports/test_jobs.py tests/engine/reports/test_completion.py tests/engine/reports/test_recovery.py tests/engine/reports/test_opener.py tests/api/test_reports.py tests/integration/test_report_completion.py tests/tui/test_report_viewmodels.py tests/tui/test_report_generate.py tests/tui/test_report_progress.py tests/tui/test_report_navigation.py
```

1. Both real clients round-trip every method/DTO/error/capability through the shared registry. Reject bare job topic/stale cursor forms and currency/rate overrides. Duplicate human labels require UID/origin resolution; same-template/day completed runs keep separate default paths.
2. Delay measurement/evidence append, receipt, seal and original-review dispositions; completion report starts only after terminal retention. Ordinary grading failure with durable disposition can settle, pending persistence cannot. No measurement append after seal.
3. Stop during judging/finalization or invalidate during render/before rename: unique completion status becomes skipped/failed/cancelled or typed pending as appropriate, no report wait hangs. Race cancel/guarded commit and assert exactly one outcome.
4. Crash before temp write/rename/ledger/open/disposition and after committed rename. Recover path/digest/terminal state without model calls, duplicate original jobs or regenerated content; inject failed persistence and verify typed pending path remains discoverable.
5. Failed opener/timeout/nonzero exit preserves successful artifact path; hostile path is a single argv value. Reveal unknown path fails. Copy resulting HTML alone and open file:// offline, with JS and without; all artifact/analysis/chart acceptance still holds.
6. Pilot every named/additional state at both sizes; each action issues its one documented API call. Overwrite/path errors stay on the field; disabled capability never invokes generate; detach never cancels. Success opens ReportReady exactly once.
7. Reconnect after missed success/failure/cancel/skip, expire job cache, change epoch, overflow/resync and deliver older revisions: snapshots/status preserve disposition/path, no stale success restores invalid state or duplicate navigation.
8. Real M14 run --no-tui/report waits terminate on all dispositions/pending errors and print opener warning/path. CLI fixtures cover both tariff flags forwarding `{per_kwh, currency}`, neither flag preserving recorded tariff, and each lone flag exiting 2 with zero requests; reject display-currency switching separately. Immediate report versus M17 imported output preserves exact costs, separate judge/trial groups and evidence; no harness installed/model access still permits retained reporting.

## Real integration and pending parent work

Compose M02/M06/M10/M11/M12/M13 with real storage and lifecycle gates, M14 CLI and M15 navigation. Re-run delayed finalization, judging stop, post-seal invalidation and recovery; M17 import/export and M18 telemetry must agree with report snapshots. Fakes alone cannot close this gate.

**Pending parent obligations:** all four children, real providers, direct-file platform/browser opening tests and wireframe updates named by the parent. M02 owns ReportReady and M15 shell integration; coordinate their UID/pending/outcome variants without duplicating screens. No runtime completion claim follows from these specs alone.
