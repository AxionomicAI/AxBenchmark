# M06.1 — scoring-service

Parent: [M06](../reference/modules/06-scoring-rankings.md#1-engine-component). Requirements: R067, R077, R080–R082, R092–R101, R114, R124, R131–R132, R145, R153–R155. Findings: F02, F07, F08, F09.

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
- `tests/fixtures/scoring_vectors.json`, with the normative inputs/expected values in [parent §6](../reference/modules/06-scoring-rankings.md#6-headless-verification).

M13 owns its production `scoring.js` and JavaScript conformance runner. M10 owns cost/time aggregation, energy pricing, billing classification and currency conversion; do not duplicate them in this child. No original-result/judge/process mutation port is permitted. Writes are an explicit alternative-weight export through `WeightExportSink` and append-only derived analysis retention through the M02-owned sink defined in [RESULTS-DATABASE.md](../RESULTS-DATABASE.md).

Retain the canonical backend-specific `JudgeGroup` fingerprint in Population, review selection and analysis input digests: harness identity/configuration; decision profile/version/digest, resolved identity, runtime/quantization, rubric/pack/mapping/evidence/acceptance policies; or human reviewer/form-policy identity. Decision confidence is acceptance provenance, never a score multiplier. Reweight already valid raw grades with unchanged exact formulas and full-roster gates; context labels/occupancy and all observer/grader costs stay outside competitor factors. Require zero inference for every analysis path.

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

**Frozen domain contract.** ProfileSpec and every quality weight operation resolve ProfileCatalog using exact rubric_ref/version/digest/category_signature. Extend WeightValidation.validate and preview/validate API requests with mandatory rubric_ref; M07 and retained-analysis adapters pass it, never a latest-family default. CategoryKey maps remain profile-defined, including specification spec in position 1; business eligibility reads profile.business_category rather than a fixed fourth column. Preserve exact nonnegative weights with positive total, individual zeroes and all six required 1–5 half-step grades. Existing formulas/full-trial/JudgeGroup gates are unchanged.

**Sink boundary.** Add `AnalysisSnapshotSink` to injected M02 contracts and `AnalysisSnapshotRef` to rank/breakdown response mappings. `RankingService.analyse` and API wrappers prepare inputs, call pure `analyse_population`, then await `retain(prepared, expected_input_digest=population.input_digest)`. An idempotent derived write is the declared exception to observational read safety; no direct SQL adapter is owned here.

## Persisted score snapshots — R191

Follow [RESULTS-DATABASE.md](../RESULTS-DATABASE.md) for the immutable analysis envelope and M02 sink. Pure `ScoringRules` and `analyse_population` remain side-effect-free; application/query/report orchestration persists or reuses the exact validated snapshot before returning completed engine score results. `scoring.rank`/`breakdown` remain safe observational API operations with an idempotent derived cache write; they cannot change source facts, reviews or settings. Return the persisted analysis ID/input digest and disclose stale or pending status. Storage failure returns a typed persistence error, never claims a saved score.

Store raw grades separately from exact quality/combined/component results, official ranks, exclusions, full expected trial membership, selected reviews/JudgeGroup, policies, weights/directions, cost basis and provenance/annotation view. Relative ranks belong to one comparison population. A changed cohort/input creates a new snapshot, not an overwritten model score. Reuse requires an exact input/selection digest match. Integer/rational values round-trip losslessly, and numeric plot projections never become ranking inputs. Add persistence/reuse/staleness/rollback fixtures using the published sink; real M02 SQLite integration must reproduce every existing score vector and preserve original fact hashes. Offline HTML alternatives are explicitly unsaved local calculations and require no engine connection.

## Boards and supplied states

No UI implementation. Supply schema-valid responses for Rankings, RankingsProfileDefaults, RankingsTrials, RankingsAlternative, ScoreBreakdown, WeightsEditor and WeightsInvalid, including empty/uncomputable/partial/excluded/error/invalidation states. The [screen child](02-rankings-screens.md) consumes these responses; wireframe edits belong to a later design task.

Extend owned domain/API declarations in place with the parent's eight-member `RankingComponent`, `RankingWeightsV2`, `RankingPlan`, `MetricPolicySelection`, five `ScoringEntry.metrics`, enabled-key `ReferenceValues` and `Contributions`; fixed cost/time-only minima and three-field contributions cannot be the authoritative shape. `WeightValidation.validate(profile_id, quality, ranking: RankingWeightsV2, metric_policies, rubric_ref=frozen_rubric_ref) -> ValidatedWeights` and preview/export requests preserve the complete exact eight-key maps, directions and selected policies. Defaults are 1:1:1:0:0:0:0:0; cost/time lower and quality higher are fixed, each positive new weight requires explicit direction. Recognize only valid explicit v1 three-key inputs in memory, retaining source bytes/version/digest; no old-install migration/backfill or v2 key filling.

`Population.measured` passes through M10's pooled generation and four full-trial count means, pairings, policies and independent coverage. Skip zero-weight components before lookup/policy/extrema/division. For COMBINED require known compatible per-trial and full-summary values under an explicit common selected policy; preserve `metric_unknown`, `metric_partial`, `metric_basis_incompatible`, `metric_policy_incompatible`, `metric_scope_incompatible` with metric and failing TrialRefs. Incompatible unresolved cohorts are uncomputable; do not select a favorable subset. Specialized rankings retain only their own factor requirements plus existing full-trial/JudgeGroup/grade/check gates.

Calculate all enabled references from the same post-gate cohort and exact Fraction factors/contributions. For new lower metrics use m/x, with m=0 giving 1 to proven zero and 0 to positives; higher uses x/M, with M=0 giving 1 to every proven complete zero. Quality stays Q/5 and existing cost-zero/currency/guarded-time rules stay separate. Recompute references after filtering/reweighting/invalidation; no per-entry normalization. Original-plan agreement includes effective normalized weights, enabled directions/policies after legacy normalization. Persist the full prepared analysis via the existing wrapper/sink, never within `analyse_population` or by rewriting original facts.

Own `domain/variant_comparison.py` and extend `Population` with per-subject `VariantResultProjectionV1`, all trial control snapshots, pinned metadata/annotation revision and `VariantComparisonSelectionV1`. Pure `classify_variant_subjects(population, selection) -> VariantComparisonV1[]` precedes the existing per-trial/JudgeGroup/metric gates. Exact template SHA and complete `(RunUid, ConfigurationId)` rosters are mandatory; equal variants never pool runs. Add `variant_identity_unknown`, `variant_lineage_unverified`, `variant_control_unknown`, `variant_control_mismatch`, `variant_effective_mismatch` reasons with field/evidence/affected TrialRefs to `ExclusionReason`.

Quantization fixes exact root and adaptation parent/composition; fine-tune fixes exact root, quant recipe and runtime/serving controls with explicit weights_only/package scope; joint labels both axes, exploratory retains uncertainties. Matched requires corroborated input/output lineage, confirmed effective identity and known/equal required controls for every trial, except policy-authorized variation fields. Unknowns never equal each other. Multiple control signatures return selection_required and candidate signatures until explicitly chosen; no favorable subset. Harness/version remains fixed for strict variant experiments, while harness comparison is a separate axis. Freeze classifications/control-policy/input digests in existing M02 analysis snapshots; score fractions/formulas and eight-factor rules do not change.

**Route, comparison and profile interfaces.** Extend rank/breakdown request and pure prepared-input schemas with optional `HarnessComparisonSelectionV1{comparison_ref, policy, allowed_classifications, observation_cutoff, annotation_selection}` and output `HarnessComparisonV1{comparison_axis=harness, classification, coverage, common_control_digest, cells, eligible_subjects, excluded_reasons}`. M02 readers resolve immutable inputs; pure M06 computes confirmed_same_model_effort, unverified_same_model_effort, exploratory or mismatch independently of all_registry/subset coverage and variant tier. Require complete relevant request/model/effort/helper/control evidence for confirmed. Only compatible full subjects with every expected trial/check/grade under one JudgeGroup enter selected extrema; explicit exploratory admits uncertainty but never known model-rejection exclusions. Freeze profile/treatment and observation cutoffs in PreparedAnalysisSnapshot dependency inputs/comparison_analysis_link. Varying harness and variant or material profile behavior gets disclosed exploratory/factorial treatment, not a false one-axis match.

## Integrated requirements

R192, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R191 — [authoritative SQLite results and analyses](../RESULTS-DATABASE.md).
R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R189 — [human review](../M12/05-human-review-web.md).

R184, R185, R186, R187, R188 — frozen domain profile/evidence contracts: [R184](../quality-judges/BACKEND.md); [R185](../quality-judges/MOBILE.md); [R186](../quality-judges/DEVOPS.md); [R187](../quality-judges/AGENTIC.md); [R188](../quality-judges/SPECIFICATION.md).

R175, R176 — [benchmark statistics](../BENCHMARK-STATISTICS.md).

R170, R171 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

**Human review acceptance:** Only committed server-validated GRADED reviews supply Q. Pending cases, drafts, explicit ungraded submissions, skips and cancellation preserve missing/invalid-review exclusions across the full expected roster, even with quality weight zero. Human reviewer/form-policy/version/digest and shared rubric/evidence/scope remain separate JudgeGroups; no averaging across reviewers or machine groups and no inferred model identity. Test equal raw-grade parity across all three backends, one pending trial excluding its whole subject, and a later additional human review leaving original selection unchanged. Display pending quality separately from known competitor measurements; reweight/filter/inspect never opens a form or invokes inference.

## Acceptance and faults

**Route/profile acceptance:** Exact arithmetic/rank vectors remain unchanged. Test confirmed N/6, unverified all-six, missing trial, known mismatch, material profile-treatment difference and changed observation cutoff. Unsupported cells produce no zero/rank; route/control joins never fan out score rows; extrema recompute solely from the selected eligible whole-subject cohort.

**SQLite acceptance:** Spy pure calculation for zero sink/SQL calls; then exercise wrapper reuse, changed cohort/dependency creating a new snapshot, stale-input refusal and failed commit. Compare every persisted exact score/component/rank against existing M06 vectors and require unchanged original facts/grades.

**Variant acceptance:** Add complete same-base quant, changed fine-tune+quant joint, declared/card-only lineage, hash-equal false authorship, unknown tokenizer, differing harness/hardware/concurrency and fine-tune package fixtures. Test every typed exclusion, signature selection and mandatory post-seal mismatch in both metadata views. Missing one trial/review excludes the whole subject; existing exact vectors and Python/production JS parity remain unchanged.

**Domain acceptance:** Extend Python/scoring_vectors fixtures across all six ordered signatures, each family defaults, relative scaling, a zero business weight with raw spec below 4, omitted zero-weight grade, all-zero and foreign-key maps. Every backend uses the same validated raw grades; measured token/price/LOC changes never alter Q or rubric interpretation.

Extend `test_weights.py`, `test_eligibility.py`, `test_rankings.py`, `test_vectors.py` and shared scoring vectors for complete/malformed v2 maps, direction/policy original disagreement, zero-weight unavailable extras and specialized-rank independence. Values 2/4 give lower 100/50 and higher 50/100; 0/4 and 0/0 test both zero conventions. Cost 2/4 plus rate 40/80 with equal positive cost/rate gives 75/75; exclude incomplete B and recompute A=100. Unknown new fields at zero weight preserve 230/3 and 250/3 exactly. Both client codecs and the real M13 BigInt runner must agree on factors, extrema, exclusions, rosters, ranks and saved-versus-unsaved provenance.

Add same-label harness/decision/human group fixtures, changed decision profile/pack/acceptance digests, missing selected-group trial reviews and separate observer costs. Assert exact original score vectors, exclusions and zero-inference reweighting remain unchanged.

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

### Automated judge assessment storage binding

Pin actual `judge_group` and `judge_request_routes` dependency revisions for retained analyses. The assessed competitor and its independently selected judge configuration are distinct. Reserved/pending/failed assessment identities and billed calls never supply a grade; only the selected actual validated Review can pass existing full-trial/JudgeGroup/business gates.
