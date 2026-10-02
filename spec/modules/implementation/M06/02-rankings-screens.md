# M06.2 — rankings-screens

Parent: [M06 screens](../../06-scoring-rankings.md#4-screens). Requirements: R077, R081, R092–R101, R114, R124, R131, R145, R149, R153–R155. Findings: F02, F07, F08, F09; consume F04 subscription foundations.

Outcome: an implementer can deliver ranking, score explanation and weight-editing screens using engine-owned decisions, with traceable trials, currency and exclusions. Proposed UI work; wireframes are inputs and later design edits are outside this child-spec change.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap; [M06.1](01-scoring-service.md); M07.1 `configuration-drafts` for working presets; M15.1 `tui-foundation` and M15.2 `tui-shell` from the [foundation contract](../../ARCHITECTURE.md#executable-foundations-and-child-spec-boundaries). Reuse widgets, prompts, workers, cursor-aware subscriptions, focus and wide/compact harness.

**Bootstrap-published contracts, allowed as injected fixtures:** M02 ResultsScreen host/filter/inspection navigation; M10 currency/tariff DTOs and CurrencyEnergyScreen handoff; M13 ReportGenerateScreen; M12 ProfilesScreen and M07 setup callers. Inject schema-valid client responses and navigation factories until those owners integrate their real screens. Do not make their full implementations entry dependencies.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/tui/screens/rankings.py` (`RankingsPane`, `ScoreBreakdownScreen`) and `screens/weights.py` (`WeightsScreen`).
- `axbenchmark/tui/viewmodels/rankings.py`, `score_breakdown.py`, `weights.py`; `axbenchmark/tui/styles/rankings.tcss`, `weights.tcss`.
- The explicit import/mount seam in M02-owned `axbenchmark/tui/screens/results.py`; coordinate it with M02. Do not move or duplicate the ResultsScreen host.
- `tests/tui/test_rankings_viewmodels.py`, `test_rankings_screen.py`, `test_score_breakdown.py`, `test_weights_screen.py`, `test_rankings_navigation.py`, `test_rankings_subscription.py`.
- `tests/tui/fixtures/scoring/` JSON views for every board plus currency, missing data, zero, all-trial exclusion and invalidation variants.

Use only parent `scoring.*`, M07 `configs.save_preset`, M13 report navigation and M02 inspection navigation. Requests carry the current template/filter/judge/weight/tariff selection; result actions carry explicit result IDs/full TrialRefs, never a run label. Weight choices use the same filters as the active ranking.

View models format DTOs only. Render full `CostDTO` metadata for rows, means/ranges, minima, shortlists and breakdowns. USD calculation values remain separate from the engine-produced display amounts/codes, frozen rate source/date, basis, coverage and declared-billing labels. No conversion, quality calculation, eligibility, minimum selection or score computation belongs in UI. Money sort keys use supplied exact USD values.

There is no analysis currency/rate selector. A missing display conversion shows unknown and its reason while a known USD amount remains visible in detail; mixed-currency views show the engine's USD notice. Zero shown after rounding never becomes a verified-zero label. Partial and unverified-zero observations remain inspectable with the engine exclusion reason.

## Boards, states and actions

| Exact board/state | Contract |
|---|---|
| Rankings | Combined score, three shortlists, eligible minima, all trial entries, judge/filter selection and currency notice; original analysis labels remain visible. |
| RankingsProfileDefaults | Exact fallback label when originals differ; each result's frozen weights remain available as an alternative choice. |
| RankingsTrials | Each UID-scoped subject's frozen/observed count, every TrialRef, mean/min–max and named failing/missing trial; same-label origins/UIDs distinguish subjects. |
| RankingsAlternative | Alternative weights/tariff labels, reset to original, save preset, export weights and report handoff. |
| ScoreBreakdown | Subject plus selected trial identity; per-trial gates; common quality weights; typed measured/eligible-minimum money with exact contributions and engine rule text. |
| WeightsEditor | Independent quality/ranking inputs and normalized previews; profile defaults, common/result originals and saved presets. Setup primary action says “Use weights”; analysis says “Apply as alternative”. |
| WeightsInvalid | Engine field issues, percentages absent, disabled Apply/Save; raw invalid input stays editable. |
| Parent-defined states without separate boards | Loading, no comparable results, fewer than five, no qualifiers, zero-time uncomputable, unknown/partial/no-rate, invalidated open breakdown, query/export errors and retry. Preserve M02 inspection access. |

All boards have 120×40 wide and 80×24 compact verification. Use the parent's `#combined`, `#combined-loading`, `#combined-empty`, `#combined-error`, `#currency-label`, `#all-entries`, shortlist IDs, `#breakdown*`, `#weights*` and named inputs. Compact mode retains reasons, currency and identity, with scrolling where needed.

- First tab activation/filter/judge/tariff change calls `scoring.rank` with the full current selection. Breakdown/previous/next calls `scoring.breakdown` for the returned explicit result ID.
- Weight changes debounce `scoring.preview_weights`; Apply calls `validate_weights`, then the caller applies the returned values. Reset requests original weights; Restore defaults loads the distinct profile defaults.
- Save invokes `configs.save_preset` after the shared name prompt. Export invokes `scoring.export_weights`; existing-target error offers explicit overwrite. Report navigation forwards the complete current selection to M13.
- Honor engine capability states; typed errors render verbatim. Escape/cancel preserves the host selection and focus. Cancelled prompts issue no command.
- Subscribe to M02's event-only `results` topic through M15: sealed/import/review/invalidation changes re-query rank and any open breakdown. Resync re-queries; stale workers cannot overwrite newer selection or restore invalidated rows. Unmount stops observation only.

## Acceptance and faults

Run the proposed suite:

```sh
pytest tests/tui/test_rankings_viewmodels.py tests/tui/test_rankings_screen.py tests/tui/test_score_breakdown.py tests/tui/test_weights_screen.py tests/tui/test_rankings_navigation.py tests/tui/test_rankings_subscription.py
```

1. Render every board/state through pure view-model tests and Textual Pilot in both dimensions. Check keyboard/mouse, scroll, focus, resize and Escape; assertions cover visible currency, source/date, basis/billing and exact trial links.
2. Drive every action once and assert its exact client/navigation call. Applying/resetting preserves original records in the fake service; no UI path imports engine scoring/accounting, requests a judge or writes retained data.
3. Render COP 4000, EUR 0.90, differing frozen EUR rates, missing EUR display conversion and mixed-currency USD fallback from M06.1 vectors in main rows, ranges, shortlists, minima and breakdown. No unconditional dollar formatter or client conversion is allowed.
4. Render unverified zero with original estimate/energy basis and `cost_zero_unverified`; show positive unknown-billing cost with its limitation, verified-zero full contribution and zero-time unavailable score. Zero-cost weight does not remove business-grade/check exclusions.
5. Show same-label U/c and V/c separately. A missing/failing U/c/2 excludes U only and remains named in the table/breakdown; selection and previous/next links cannot switch UID accidentally.
6. Delay request A, change selection to B, return B then A; retain B. Deliver invalidation after a sealed/reviewed score, reconnect with a new epoch and force resync: old scores disappear and the open breakdown shows the typed overlay error with inspection access.
7. Exercise invalid input, missing profile, failed query, failed preset save/export, existing target, declined overwrite and cancelled prompt. Preserve inputs/selection, display errors and make Retry issue only the intended call.

## Real integration gate

Through real EngineClient/M06.1 and M02 ResultsScreen, inspect retained repeated trials, change filters/judge/weights/tariff, save/reload a real M07 preset, export/reload weights and generate a real M13 report. Compare exact engine order and all currency/billing metadata with the report generated through M06.1's pinned `analyse_population` seam; confirm originals and retained fact digests are unchanged. Invalidate the sealed run and verify all mounted views refresh.

**Pending parent obligations:** M06.1 real retention/accounting/profile integration and Python/JavaScript conformance; M07 setup and M12 profile entry points; M13 offline controls; M14 CLI parity; M15.3 complete navigation acceptance. Fake-client rendering does not claim these integrations complete.
