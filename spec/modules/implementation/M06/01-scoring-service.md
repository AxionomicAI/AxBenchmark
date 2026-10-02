# M06.1 — scoring-service

Parent: [M06](../../06-scoring-rankings.md#1-engine-component). Requirements: R067, R077, R080–R082, R092–R101, R114, R124, R131–R132, R145, R153–R155. Findings: F02, F07, F08, F09.

Outcome: an implementer can produce deterministic headless rankings and explanations from complete retained trial subjects. This proposed service owns eligibility and scoring; accounting and display amounts come from M10.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap and M11.1 `engine-client-api` / M11.2 `events-jobs-lifecycle` from the [foundation contract](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries). Their import/schema/client/registry tests must pass before this child starts. Full M02/M10/M12 implementations are not prerequisites.

**Bootstrap-published contracts, allowed as injected fixtures:** M02 `EffectiveResult`, `TrialGroup`, `RetainedResultReader`, `PublicationView`; M10 `CostAnalysis`, `MeasurementReader`, complete cost/display DTOs; M12 `ProfileCatalog`; M07 `WeightPresets`/preset YAML shape. Fixtures preserve full TrialRefs, frozen counts, immutable facts and overlay versions. Inject protocols only, with missing/late/error hooks; real producers are the integration gate below.

## Ownership

Own these proposed implementation files:

- `axbenchmark/engine/scoring/domain/weights.py`, `subjects.py`, `eligibility.py`, `quality.py`, `rankings.py`, `models.py`.
- `axbenchmark/engine/scoring/ports.py`, `application/interfaces.py`, `application/rank.py`, `breakdown.py`, `weights.py`.
- `axbenchmark/engine/scoring/adapters/results_population.py`, `profiles.py`, `presets.py`, `yaml_export.py`, `rpc.py`; `axbenchmark/api/scoring.py`.
- Only M06 method/provider registrations in `axbenchmark/engine/daemon/composition.py` and the shared API registry; coordinate those shared files with M11.
- `tests/engine/scoring/test_weights.py`, `test_subjects.py`, `test_eligibility.py`, `test_rankings.py`, `test_population.py`, `test_use_cases.py`, `test_vectors.py`; `tests/api/test_scoring.py`.
- `tests/fixtures/scoring_vectors.json`, with the normative inputs/expected values in [parent §6](../../06-scoring-rankings.md#6-headless-verification).

M13 owns its production `scoring.js` and JavaScript conformance runner. M10 owns cost/time aggregation, energy pricing, billing classification and currency conversion; do not duplicate them in this child. No result/judge/process mutation port is permitted. The only write is an explicit alternative-weight export through `WeightExportSink`.

## Interfaces and invariants

Publish M06-owned `Population` in `domain/models.py` and `RankingService.analyse_population(population, group, selection)` in `application/interfaces.py`. Implement `RankingService`, `WeightValidation`, `ScoringRules` and all six parent `scoring.*` methods. Preserve their errors, read/write safety classes and weight issue field paths. No jobs/events originate here; M02 owns retained-data notifications.

`Population` carries the pinned PublicationView, profile_id/resolved ProfileSpec, comparable entries by full TrialRef, full TrialGroups/frozen counts/missing indices, M10-prepared `measured[(RunUid, ConfigurationId)]: TrialSummary`, currency/tariff context, judge_groups and notices. These are domain types; adapters alone serialize DTO shapes. The pinned entry validates scope/weights and delegates to existing pure rules with zero result/profile queries, aggregation or conversion. Query-backed `analyse` prepares one Population and delegates. Supplied invalidation rejects the scope; later invalidation is caught by API refresh or M13 guarded publication.

1. Build `ConfigurationSubject=(run_uid, configuration_id)` from a pinned M02 TrialGroup and frozen roster. Read all expected indices; filters select subjects and judge selection projects reviews without dropping trials. Labels never identify a subject.
2. Capture one publication view and apply effective invalidation overlays before grouping. Already sealed facts/reviews remain unchanged; no invalidated trial enters minima/rankings. Breakdown resolves its result ID/full TrialRef and returns `scoring.not_comparable` with the overlay when invalidated.
3. Apply every default and relevant measurement gate to every trial. Missing trial/review, partial/unknown required measurement, or unverified zero in one trial excludes the complete subject even if its displayed mean is positive. Preserve the failing TrialRef and nested reason.
4. Retain zero API/energy/reported observations with their original basis. `cost_zero_unverified` excludes lowest-cost and positive-cost-weight rankings; cost weight zero skips that component before division and retains other gates. Positive unknown-billing costs remain usable with their limitation.
5. Preserve verified-zero full/zero contributions and the existing guarded zero-time combined-ranking state. Never emit NaN/Infinity. Use exact rational arithmetic for weights, quality, minima, scoring and ordering.
6. Pass M10 cost/time means and ranges unchanged. Every ranking, breakdown, shortlist and minimum retains USD calculation values separately from display currency/value, rates, coverage, basis and declared-billing labels.
7. Alternatives, tariff passthrough, reset and export cannot modify frozen records or invoke a judge. Original resolution uses one common set per judge group, independently for quality and ranking weights.

**M10 handoff:** require `CostAnalysis.display_currency_for(pinned_runs) -> DisplayCurrencyDTO`, `ranking_cost(EffectiveResult, tariff, display_currency=None) -> Cost`, and `MeasurementReader.trial_summary(TrialGroup, tariff, display_currency=None) -> TrialSummary`. Cost/time exact values must survive the DTO boundary as reduced rational strings. Import `CostDTO`, `MeasuredDTO`, `RateUseDTO`, `BillingDTO`; complete mean/min/max money projections are M10-owned. Public analysis requests have no currency/rate choice. Pass an internal USD override only for M10's mixed-currency fallback.

## Boards and supplied states

No UI implementation. Supply schema-valid responses for Rankings, RankingsProfileDefaults, RankingsTrials, RankingsAlternative, ScoreBreakdown, WeightsEditor and WeightsInvalid, including empty/uncomputable/partial/excluded/error/invalidation states. The [screen child](02-rankings-screens.md) consumes these responses; wireframe edits belong to a later design task.

## Acceptance and faults

Run the proposed suite:

```sh
pytest tests/engine/scoring tests/api/test_scoring.py
```

1. Assert every parent §6 vector exactly, including 230/3 versus 250/3 scores; no tolerance comparisons. Permutation and weight scaling preserve order. Missing/negative/nonfinite/unknown/all-zero weights return exact issue fields.
2. Import same-label U/c and V/c fixture records: two subjects retain distinct means, explicit result/trial links and deterministic ties. Missing U/c/2 or its selected-judge review cannot create a reduced roster.
3. Test zero estimates, zero energy, positive unknown-billing costs, verified zero, zero-weight bypass and guarded zero time. A zero estimate plus positive sibling trial remains excluded from positive-cost ranking despite positive mean.
4. Supply COP 4000/USD, EUR, per-run differing frozen EUR rates, missing display rate, missing price conversion and mixed display currencies. Assert USD score/order invariant and exact forwarded money metadata in all response locations; fake conversion methods fail if M06 calls arithmetic itself.
5. Seal U, add its review, invalidate during judging, then rank/explain through the adapter: U disappears and breakdown rejects; V remains. Byte digests remain unchanged. Repeat against imported overlays and fail any attempt to read live M10 working state.
6. Inject unreadable retained data, invalid tariffs, failing export sink and existing export target. Return typed errors without partial success or changed originals; explicit overwrite affects only the selected output path.
7. Capture query-backed `analyse` output and its Population for every vector, then disable all read/profile/accounting ports and compare prepared `analyse_population` exactly against that output. Assert missing trials/reviews retain exclusions, invalidated/inconsistent populations reject, and no new record enters the pin. Round-trip every query/command/error through both real clients with fake producer ports; validate registry/schema and import boundaries. Export expected vectors as reviewed fixtures, never deriving the oracle from the scorer under test.

## Real integration gate

Compose real M02 retention/import, M10 measurement projections, M12 profiles/reviews and M07 presets. Complete a repeated-trial retained run, seal/review, export/import and compare exact ranks, all money metadata and original fact digests; then append run invalidation and verify fresh reads reject the entire UID. Repeat same-label different-UID runs and the currency/zero fixtures through real accounting. No new model calls are needed for analysis.

M14 owns paired `--tariff AMOUNT_PER_KWH --tariff-currency CODE` parser/dispatch tests for scoring rank/explain: both absent uses recorded tariffs, either alone exits 2 without requests, both forward the exact TariffDTO; display-currency/rate overrides remain forbidden.

Require M13's real report adapter to construct this domain Population, call only `analyse_population` on its captured pin, and reject later invalidation at guarded publication. Require M13's actual offline BigInt scorer to pass the same JSON vectors under its test runner, including reasons, subject IDs, minima, exact values and display passthrough. Stub JavaScript or Python-only parity does not satisfy this gate.

**Pending parent obligations:** M06.2 screens; M07 setup validation/presets; M13 self-contained reports and offline controls; M14 CLI; M15 cross-module navigation. Their real-provider gates remain pending until exercised; fixture/API success alone does not complete M06.
