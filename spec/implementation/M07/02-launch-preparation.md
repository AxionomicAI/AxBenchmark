# M07.2 — launch-preparation

Parent: [M07 launch contracts](../reference/modules/07-run-configuration.md#1-engine-component). Requirements: R032, R033, R037, R066, R067, R077, R080, R081, R106, R114, R145, R154, R156–R158. Findings: F02/F06 identity, F07 frozen currency, F15 foundations, F18 errors; preserve R158 without changing its policy.

Outcome: one owner-backed validation/resolution path for setup, review and unattended launch, producing immutable UID-bound configuration, original weights and accounting evidence. No competitor or judge process starts in this child.

## Entry conditions

**Completed implementation prerequisites:** [M07.1](01-configuration-drafts.md), [M03.1](../M03/01-readiness-service.md), [M04.1](../M04/01-catalog-resolution.md), [M04.2](../M04/02-catalog-discovery.md), [M04.3](../M04/03-price-rate-sources.md), [M06.1](../M06/01-scoring-service.md), and their Bootstrap/M11 foundation gates. Use real stored readiness/catalog/weight services in acceptance.

**Bootstrap-published contracts, allowed as injected fixtures:** M01 verified revision reader; M05 `HarnessInspection.assess_policy`; M10 `AccountingValidation`; M11 `SchedulingVocabulary`, `ExecutionDefaults`, UID reservation and launch-job coordinator; M12 `JudgeRequirements`/profile/session count; M16 `PlannerRecord`; M18 `MonitoringOptions`; M02 `RunBinding`/`ResultRecorder`. The scheduler, judging worker and collectors are later integrations, preventing dependency cycles.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/configs/domain/validation.py`, `judge_selection.py`, `launch.py`, `snapshots.py`, `budget.py`, `digests.py`.
- `axbenchmark/engine/configs/application/setup.py`, `review.py`, `launch.py`, `revalidate.py`; extend M07.1 DTOs/ports/RPC/composition with the parent's launch and fact contracts.
- `axbenchmark/engine/configs/adapters/launch_store.py`; `facts/readiness.py`, `catalog.py`, `rates.py`, `policy.py`, `weights.py`, `judging.py`, `planning.py`, `scheduling.py`, `monitoring.py`, `template.py` in the same adapters package.
- `tests/configs/test_setup_validation.py`, `test_judge_selection.py`, `test_launch_snapshots.py`, `test_launch_freeze.py`, `test_stale_review.py`, `test_trial_budget.py`, `test_launch_integration.py`.
- `tests/configs/fixtures/launch/` snapshots for known/unknown prices, COP/EUR/missing rates, declared-unknown billing, multiple same-harness entries and two same-label run UIDs.

Gather one coherent set of owner facts. Call M03 `AssessOperation.assess` and read `InstalledHarnesses.list`/`MachineIdentitySource.current`; before inspection preserve `environment.not_inspected`. Read M01 revision/identity under the publication view. Neither a fact read nor a launch triggers inspection, authentication verification or model discovery.

Use exact M04 `CatalogSelections.check(selection, required_capabilities)`, `CatalogOptions.get(harness, target, account_id)` and `ExchangeRates.snapshot(currencies) -> RateSet`. Subscribe to published `catalog.refresh.finished`, `catalog.prices.refreshed`, `catalog.rates.refreshed` and override events. No lookup alias or invented rate event is registered.

Resolve presets through M06 `WeightValidation.validate`. Apply M05 policy, M10 accounting, M11 trials/concurrency and M18 interval validation with unchanged owner codes. A rejected setter stores none of its patch; save can still retain structurally valid incomplete setups. Select saved usable judge, then usable planner, then first usable entry; report skipped reasons and never replace a USER choice.

The M12 bridge calls async `JudgeRequirements.check(template: Sha256, judge: JudgeSelection) -> JudgeCheck`. Preserve `usable`, `profile_id`, ordered default quality weights (`default_quality_weights` in the DTO), `requirement {screenshot_inspection, reason}`, capability state/source, readiness and reasons. The engine maps screenshot inspection to `image_input`; unsupported/unknown screenshot capability retains M12’s corresponding `judging.screenshot_inspection_*` reason. `session_count(configurations: int, trials: int) -> int` returns the exact product after positive-integer validation, without invoking a judge or capping trials.

Review resolves exclusions/policy adjustments before totals, facts and digests. `configs.review` returns complete `LaunchPreview`; missing rates are limitations and warnings never disable Launch. Draft launches require this preview digest. Re-resolve before staging; changed content, preset values, price/rate/billing/readiness evidence or adjustments yields `configs.review_stale` and zero committed records.

Freeze the catalog's complete pricing fields, billing kind/source/declaration/observation/label and needed rates, including the independent judge. Needed non-USD currencies are price currencies ∪ display currency ∪ tariff currency. Preserve unknown override provenance, source date, retrieval date and refresh evidence. COP `4000` means units per USD. No cost calculation, rate fetch or guessed value belongs here.

Display currency defaults to USD and is immutable with rates after launch. Later analysis may change tariff/weights only; M10/M06 own conversions and mixed-currency USD presentation. Preset/rate refreshes after commit cannot modify the frozen documents or their digests.

Keep separate configuration/weights digests and the complete M02 `RunBinding` digest. Use `freeze_configuration(run_uid, resolved, identity, run_label, launched_at)`, `freeze_weights(run_uid, resolved)`, `commit(run_uid)`, `discard(run_uid)`. Each stage binds the same resolved digest/identity; commit requires all parts and returns `FrozenLaunch`.

The complete binding records origin, verified template/baseline, all competitor ConfigurationIds, trial counts/settings, judge and accounting/weight evidence. Allocate the full shared `TrialRef {run_uid, configuration_id, trial_index}` roster, with 1-based indices; run labels and saved setup IDs are never trial/group keys. `LaunchRecords.get(run_uid)` returns exactly that immutable evidence to M02.

Identical staged/committed retries are idempotent; missing/mismatched parts return `configs.freeze_incomplete`, UID conflicts `configs.launch_conflict`. Discard deletes unpublished staging only; committed evidence returns `configs.launch_committed`. M11 must journal post-commit binding recovery and create every result through `ResultRecorder.open_result(TrialRef)` before launch success/execution.

R158 is exact: trials default 1, every positive whole number allowed without a ceiling; task timeout stays 3 h. Both Setup and Review always return task-run and judge-session totals. Only `trials > 5` plus at least one competitor target that is not an `EndpointRef` raises the warning; an independent cloud judge does not defeat the all-local competitor exception.

For the fixture 4 configurations × 6 trials × 7 tasks, show 168 task runs and M12's 24 judge sessions. TUI confirms that digest's warning; unattended launch emits its final resolved warning/totals and continues without prompting. Adjustments/stale re-review invalidate prior confirmation.

Revalidation changes draft projections atomically with revisioned events. Use typed cursors and the shared error envelope. `configs.launch.frozen` publishes only after durable complete freeze and does not itself announce a started run. Scrub all diagnostic text before any persisted/API/event/log output.

## States supplied to screens

| Exact board/state | Resolution supplied |
|---|---|
| Setup / SetupInvalid | Owner issues/limitations, totals, selected judge/weights, disabled review reasons. |
| JudgePicker / JudgeFallback | Ordered branch outcomes, engine fallback notice, independent explicit choice and supported options. |
| ReviewLaunch / TrialBudgetWarning | Resolved evidence and digest; exact task/judge totals and non-blocking budget payload. |
| LaunchRecord | UID/label, full roster/binding, original configuration/weights, redacted evidence and path. |
| Parent fault states | Incomplete setup, stale review, no inspection/harness, unknown/unsupported capability, clean-policy refusal and failed freeze. |

## Acceptance and faults

```sh
pytest tests/configs/test_setup_validation.py tests/configs/test_judge_selection.py tests/configs/test_launch_snapshots.py tests/configs/test_launch_freeze.py tests/configs/test_stale_review.py tests/configs/test_trial_budget.py tests/configs/test_launch_integration.py
```

1. Cover all judge branches, no usable candidate, saved versus USER origin and common rubric/profile; assert the M12 bridge signature, full JudgeCheck/default-weight mapping and exact session-count product; repeated same-harness entries remain distinct. Invalid efforts, weights, trials, tariff and interval return owner field errors without substitution.
2. Freeze USD/EUR prices, COP display and tariff-only GBP; include cached/reasoning prices, explicit unknown rate override and declared-unknown billing. Assert exact provenance/labels and no source/probe/model calls from review or freeze.
3. Refresh rates/edit presets after freeze; compare every immutable document/digest. Mixed-currency fixtures retain separate currencies for M10; no API accepts analysis display currency/rates.
4. Change each digest input between review and resolve, including file content and clean-policy adjustments; reject before staging. A transient gather timestamp alone leaves the digest stable; changed source dates/provenance do not.
5. Test trials 1/5/6/50/1000, invalid scalar inputs, one provider among local entries, all-local competitors with cloud judge, and exclusion of the last provider. Verify totals at all counts, warnings only at the specified boundary and no trial ceiling.
6. Fail identity check, each stage/write and commit; no partial launch is readable. Retry identical steps, mismatch weights to configuration, conflict a UID, and attempt discard after commit. Verify two same-label UIDs have disjoint TrialRefs and complete binding digests.
7. Exercise real clients and owner services with deterministic clock/IDs; inject catalog updates during subscription handoff, stale draft workers and restart. Scrub seeded diagnostics and assert no credential value leaks through files, errors or events.

## Real integration gate

Compose real M01 identity, M05 policy, M10 accounting, M11 scheduler, M12 judge requirements and M18 monitoring. Review/launch through TUI and M14 CLI; inspect M02's exact per-trial frozen binding and M17 round-trip. Crash after commit and midway through result binding: recover the same UID/roster without execution before completeness or deletion of frozen evidence.

**Pending parent obligations:** M07.3 rendering/confirmation, M11 bind recovery and warning delivery, M01/M16 atomic revision integration, M10 currency/tariff analysis and M02/M17 provenance preservation. Fake launch jobs and policy/judge/collector ports do not establish real provider execution.
