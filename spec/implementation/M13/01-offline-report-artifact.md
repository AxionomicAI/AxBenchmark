# M13.1 — offline-report-artifact

Parent: [M13 artifact contract](../reference/modules/13-standalone-html-report.md#1-engine-component). Requirements: R014, R016, R067, R077, R081, R116, R122–R127, R131, R133–R134, R143, R148, R153–R156. Findings: F02, F03, F07, F09; shared F06/F18.

Outcome: construct and publish one safe, portable HTML artifact from an eligible pinned retained snapshot, with full essential tables and review evidence readable without JavaScript. This is proposed work; no runtime is asserted.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M02.2 retention-services](../M02/02-retention-services.md), [M06.1 scoring-service](../M06/01-scoring-service.md) and [M10.2 final-accounting](../M10/02-final-accounting.md). Their real readers, exact arithmetic, publication view and receipt/readiness tests are required here.

**Bootstrap-published contracts, allowed as injected fixtures:** M01 template labels, M06 GradingProfiles backed by M12, M08 CheckIndex, M18 TelemetryDescriber, M11 lifecycle/publication guard and cancellation token, M12 original settlement. Fake pending/invalidated snapshots test admission; actual scheduler/judging/telemetry joins remain later integration gates.

Consume M06's authoritative `RankingService.analyse_population(population, group, selection) -> Analysis`. Its domain Population holds `view: PublicationView`, profile_id, resolved `profile: ProfileSpec`, `entries: Mapping[TrialRef, EffectiveResult]`, `groups: tuple[TrialGroup, ...]`, `measured: Mapping[tuple[RunUid, ConfigurationId], TrialSummary]`, prepared currency/applied tariff context, judge_groups and notices. Preserve frozen counts/expected refs/missing indices and every selected-judge review possibility. During capture resolve the frozen rubric through M06 GradingProfiles and verify `profile.profile_id == profile_id`; complete M10 preparation before scoring. No result/profile query or accounting is allowed inside the prepared-input call; DTO mapping stays in adapters.

## Exact proposed ownership

- `axbenchmark/engine/reports/domain/models.py`, `scope.py`, `contents.py`; value types use domain projections, never API imports.
- `axbenchmark/engine/reports/ports.py`: ResultSource, TemplateFacts, Analysis, TimelineFacts, ReportRenderer, ReportSink and ReportPublication contracts only; M13.4 adds job/ledger contracts.
- `axbenchmark/engine/reports/application/build_model.py`, `capture_snapshot.py`.
- `axbenchmark/engine/reports/adapters/results_source.py`, `template_facts.py`, `scoring_analysis.py`, `timeline_facts.py`, `fs_sink.py`, `publication.py`.
- `axbenchmark/engine/reports/adapters/html/renderer.py`, `assets/report.html.j2`, `assets/report.css`; M13.2–3 own JavaScript assets.
- `tests/engine/reports/test_snapshot.py`, `test_model.py`, `test_publication.py`, `test_renderer.py`, `test_evidence_safety.py`, `test_no_js_tables.py`.
- `tests/browser/reports/test_offline_artifact.py`; `tests/fixtures/reports/retained.json`, `hostile.json`, screenshot/evidence bytes with explicit result/trial refs.

## Inputs, interfaces and admission

Implement ReportScope, ReportSnapshot and ReportModel from the parent. M02 resolves UID/path/unambiguous label; origin_run_uid names one immutable run, never a label-derived identity. Preserve full SHA-256, origins, imported provenance, launch binding, ResultId and TrialRef.

A run request resolves to its template-wide filtered comparison. Distinct U/c and V/c remain separate subjects despite identical human labels. Read every expected trial for a selected subject; a subset import cannot reduce frozen trial_count or manufacture a complete mean.

`ResultSource.capture(scope) -> ReportSnapshot` pins one PublicationView and returns admitted EffectiveResults/TrialGroups, bindings, finalization receipts, original-review dispositions, review/invalidation versions and M10 projections. Pending accounting/seal/original judging yields reports.retention_pending; explicitly invalidated origin yields reports.identity_invalidated. Already invalidated results are excluded from template comparison admission with a count/reason.

`ReportAnalysis.analyse_population(population, group, selection) -> Analysis` delegates to M06 without duplicate scoring. M10 computes cost/time trial summaries, USD rationals and money projections; M06 adds quality, eligibility and ordering. Reports never read measurement/judging working files.

`ResultSource.evidence(snapshot, rid, task)` and `read_evidence(snapshot, rid, evidence_id)` use the same view and validate ResultId/TrialRef, digest and allowed retained path. Show original/effective status for admitted rows; invalidated original facts/reviews remain inspectable in M02, never inserted into report rankings.

## SQLite analysis snapshot — R191

Use the [results database contract](../RESULTS-DATABASE.md) to retain/reuse M06's prepared-population output through M02 before publishing an engine-generated scored report. Pure `analyse_population` stays pure; the report use case owns the persistence call and final input/publication guard. Include analysis ID, input digest, exact values and stale/inspection limitations in the standalone payload; never open repository files or query SQLite directly from M13. A persistence failure cannot publish an artifact claiming saved analysis. Offline what-if values remain explicitly unsaved until retained by an engine operation.

## Artifact and publication

Keep all parent ReportParts present/locked. Static markup contains measured/quality trial rows, one full-roster summary row after each configuration's trials (means/min–max for counts/cost/time/quality; pooled generation with per-trial range), original analysis label, task/check evidence, screenshots, missing-data explanations and full template identity.

Domain fields map at the adapter boundary to complete M10 CostDTO/MeasuredDTO/RateUseDTO/BillingDTO/DisplayCurrencyDTO and contributor fields. Preserve exact reduced n/d plus engine display strings, frozen rates/sources/dates, declared-billing text and coverage. For mixed scopes embed the M10 USD view plus each run's frozen projection using its normal None default; a single-currency scope needs only its frozen view. Filter selection uses those projections; never accept alternative currency/rates.

Jinja autoescape/StrictUndefined protects static text. JSON islands encode `<`, `>`, `&` as literal `\u003c`, `\u003e`, `\u0026`, and escape U+2028/U+2029; use no template evaluation of data. Provenance URLs are inert text, not external href/src targets.

Inline trusted HTML/CSS/assets, CSP with matching script hashes, and validated PNG/JPEG/WebP data images. Unsupported evidence including active SVG is escaped text. Unreadable screenshot gets an explicit placeholder/warning. No competitor source/instruction is executable.

Stream into a target-directory temp file. `ReportPublication.publish(snapshot, pending, intent, overwrite)` serializes final readiness/version/invalidation recheck, cancel admission and final target collision check with M02/M11 shared publication/lifecycle state; fsync and atomic rename follow only if admitted. A check followed by an unlocked rename is insufficient.

A changed selected review/retention version returns reports.snapshot_changed; selected invalidation rejects the whole pending report. Later unrelated imports never enter the pin. Refuse resolved protected result-store destinations and overwrite=false collisions, including concurrent writers. Precommit failure deletes only the owned temp file.

M13.4 supplies durable publication intent/settlement. A commit that wins cancellation keeps path/digest and must recover successfully; no postcommit cancellation promise may erase it. Report files never target the protected retained-results directory. The explicit M02 analysis sink is the only retained derived write; no source-fact mutation or model/harness/judge port exists.

**Frozen domain contract.** ReportSnapshot/ReportModel and JSON islands embed exact resolved ProfileSpec/rubric/version/digest/signature/business/comment mappings, frozen evidence-plan/modality/coverage and domain ObservationContext refs. Compare the complete binding, not profile_id alone. Static no-JS quality tables use the family order; evidence sections render native matrix/build/lifecycle, DevOps modes, agent case modes and supplied/candidate document roles as inert content with gaps. Text domains need no image placeholder; only missing required images produce one. Metrics remain a separate table and never determine quality.

## Boards and supplied states

ReportPage: original static measured/quality tables, full SHA, every trial and summary, origin/UID, groups, evidence and no-JS explanation. Supply complete/partial/unknown/empty, missing screenshot, same-label runs, original/profile-default weights, frozen/missing/mixed currency and declared billing states.

Supply ReportGenerate/ReportGenerateDefaults counts/locked parts/readiness reasons and ReportReady artifact metadata; M13.4/M02 own those screens. No wireframe edit belongs here.

Extend `ReportSnapshot`, `ReportModel`, HTML JSON islands and no-JS measured rows with M10 `M10Statistic`, `GenerationAggregate`, `ArtifactStats`, retained policy bytes/digests and safe evidence/inventory refs. Make Gen tok/s, In tok (cached), Out tok (reasoning), Files / LOC primary columns. Preserve independent native detail/file/LOC availability, exact pooled N/D, count means/ranges and full frozen trial identities; label final snapshot baseline inclusion and partial matched subsets explicitly. Embed sufficient engine-prepared policy/basis projections for M13.2 selection without local measurement aggregation or runtime queries.

Carry M06 complete eight-factor originals/directions/policies and dynamic references/contributions into the pinned Population/Analysis. Report orchestration retains or reuses pure M06 output through M02 `AnalysisSnapshotSink` before guarded publish; embed analysis ID/input digest and distinguish later unsaved browser alternatives. No timing/snapshot/metric receipt or storage failure can be bypassed by a nonempty table.

Extend `ReportSnapshot`, `ReportModel.scoring_inputs` and static/JSON sections with pinned `VariantResultProjectionV1`, immutable descriptor/manifests/lineage/creator/date/source evidence, all trial controls, annotation view/revision and `VariantComparisonV1`/policy bytes/digests. Capture complete subjects and all mandatory attribution exclusions from authoritative M02 SQLite under the same PublicationView. Guard publication against changed selected annotation/exclusion versions; do not silently switch metadata view or relabel old evidence with current catalog data.

Embed safe metadata/evidence only, no weight binaries/private endpoint/source paths or active external links. No-JS tables show FINETUNE+QUANT, creator roles, date kinds/precision, proof/confound labels and full-roster limitations. Annotation history is explicit; As recorded remains the default and cannot disable mandatory mismatch exclusions.

**Saved versus local provenance.** Keep `AnalysisSnapshotRef {analysis_id, analysis_digest, input_digest, publication_id, status, freshness}` from the acknowledged M02 sink in the initial ReportSnapshot/Model/outcome and table/chart detail. Freshness is explicitly as captured; an offline file cannot know later database changes. Report job ledgers remain working output state, not score authority. Browser filter/reweight/export produces an explicit unsaved local derivation tied to that original reference; it must not reuse the ID as proof the changed analysis was saved. Graph coordinates are approximate presentation; exact pairs and retained official ordinal/tie keys define the initial saved analysis.

**Route, comparison and profile interfaces.** Extend ReportSnapshot schema and prepared analysis inputs with FrozenHarnessComparisonV1, full registry cells, HarnessComparisonV1 classification/coverage, exact route/model/native-effort/profile/treatment refs and scoped observation/annotation cutoff. Read M02 normalized projections under the same PublicationView and retain M06-produced analysis links with existing AnalysisSnapshotSink. Evidence blobs are credential-free; no live catalog/profile resolution enters rendering. Default no-JS table renders all six cells and unavailable reasons without fake score rows, preserving separate JudgeGroup and variant-axis labels.

## Integrated requirements

R192, R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R191 — [authoritative SQLite results and analyses](../RESULTS-DATABASE.md).
R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R189 — [human review](../M12/05-human-review-web.md).

R184, R185, R186, R187, R188 — frozen domain profile/evidence contracts: [R184](../quality-judges/BACKEND.md); [R185](../quality-judges/MOBILE.md); [R186](../quality-judges/DEVOPS.md); [R187](../quality-judges/AGENTIC.md); [R188](../quality-judges/SPECIFICATION.md).

R173, R174, R176 — [benchmark statistics](../BENCHMARK-STATISTICS.md).

R164, R166, R171 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

R180, R183 — [benchmark modes](../BENCHMARK-MODES.md).

Extend `ReportModel.Header`, `TemplateFacts` and task details with format, benchmark/project/target mode, legacy marker, ordered stages and immutable baseline provenance plus frozen commit-policy/check references. Display separately the task process outcome, authored behavioral coverage and protocol verdict; a pass with no behavioral checks makes no behavior claim. Include scoped start/end HEAD/trees/new commits/prior tips/ancestry, setup origin, dirty-path/inventory causes and immutable evidence refs from M02, without creating a Git repository or rescanning the original folder.

Add no-JS/offline fixtures for one-shot and multi-step across seven domains, source/workspace removal, missing/dirty/unreadable commit evidence, and archived `not_recorded` fields. Verify report evidence matches M02/M17 digests and task cutoffs; later commits cannot heal earlier results. No scoring formula, full-roster, JudgeGroup or cost/throughput rule changes.

Extend pinned ReportSnapshot acquisition and TASK_EVIDENCE assembly with every capture's source digest/cutoff and ContextAnalysisSelection (native-only or analysis ID/ledger cutoff/digest/status/file closure). M02 supplies read-only prepared projections and leased evidence; late analysis cannot alter generated bytes or block a report once ordinary retention settles. Embed independent count/label/membership provenance, gaps/transitions and separate observer accounts. Preserve full decision backend/profile/capability/model/pack/group/commentary provenance in review data; no model or private working-store read occurs.

**Human report contract and acceptance:** Pin committed human reviews/dispositions and frozen self-declared reviewer/form-policy/group/rubric/evidence digests from M02, including human_authored commentary and explicit ungraded deficiencies. No draft, SUBMITTING intent, capability credential, controller script or live gateway URL enters HTML/JSON. Pending originals return reports.retention_pending with wait_reason=human_input and counts for the client, not a failed review. After complete original settlement, copy HTML alone and inspect all six raw grades/comments/limitations offline with JS disabled; no host/browser form creation or model/call fields. Human lifecycle duration is separate and model cost not applicable; additional pending human work cannot reopen settled original readiness.

## Acceptance and faults

**Route/profile acceptance:** Generate offline fixture artifact from confirmed subset, unverified all-six, helper mismatch and changed profile treatment; static output retains exact refs/coverage and unknowns. Snapshot-change guards catch late contradictory evidence; profile endpoints remain inert.

**SQLite acceptance:** A sink failure or stale input prevents a report claiming saved scores; one retained snapshot feeds initial tables/charts/outcome. Copy HTML alone, disable engine/network, reweight/filter/download and verify unsaved labels, unchanged original reference and exact Python/JS parity.

**Variant acceptance:** Generate from declared, confirmed, conflicting and partial variants then change catalog/annotations during publication. Pinned history/evidence is stable or guarded write fails; no archive/golden facts change. Source-deleted offline/no-network output preserves creator/date/lineage and full trials without model files, metadata fetches or score changes.

**Domain acceptance:** Render six families with all three backend groups after workspace/source removal and network/model disablement; preserve exact grades/refs, native images and explicit modality gaps. A diagram/link check cannot become executed-software proof, and browser alternatives keep the pinned rubric.

Extend renderer/no-JS/offline/pin tests for pooled 200 (range 50–300), exact count mean 7/2, baseline-included final snapshot, known files/unknown LOC, unknown detail tokens, partial pairing and missing trials. Delay timing/inventory/analysis persistence and assert no premature scored artifact. Move only HTML, remove source/workspace, disable network/model access and compare retained exact metrics/policies/digests and dynamic scoring inputs.

Extend existing fixtures for native-only and delayed/partial analysis, explicit local overlap/unknown attribution, distinct decision/harness/human fingerprints and offline or disabled-engine operation as applicable. Assert unchanged scope/digests, no fabricated values/calls, and no reclassification triggered by viewing, export/import or navigation.

```sh
pytest tests/engine/reports/test_snapshot.py tests/engine/reports/test_model.py tests/engine/reports/test_publication.py tests/engine/reports/test_renderer.py tests/engine/reports/test_evidence_safety.py tests/engine/reports/test_no_js_tables.py tests/browser/reports/test_offline_artifact.py
```

1. Generate with real retained readers/scorer/accounting, no harness/model access; copy only HTML to an empty directory and open file:// with networking disabled. Assert zero external requests, images loaded, full identity, intact essential tables with JavaScript disabled.
2. Parse hostile `</script>`, handlers, javascript URLs, braces, Unicode separators and scripted SVG across prompts/logs/reviews/labels. No data-created element/handler/script, dialog or request; CSP hashes match. Required price source URLs survive as inert text.
3. Same-label U/V runs and two trials with differing T1 evidence keep distinct paths/rows/means. Missing trial 2 retains frozen count and unknown/partial summary reasons; unrounded rational ordering survives serialization.
4. Delay each final accounting/seal/original-review disposition; capture cannot report ready early. Invalidate during read/render/embed and immediately before rename: no final artifact. Race publication/cancel and overwrite=false writers: exactly one admitted commit.
5. Full CostDTO metadata survives trial/mean/min/max: COP/EUR/missing rates, mixed USD, declared/unknown billing, 5/3 mean and partial coverage. Retained digests remain byte-identical. Include resolved ProfileSpec and disable result/profile/accounting ports before analyse_population; output must equal M06's captured query-backed analysis without another read.
6. Renderer/disk/full-directory/error/cancel before commit leaves no final artifact; fixed clock/input yields byte-identical output. No successful result may be synthesized from a stale plan.

## Real integration and pending parent work

Compose real M02/M06/M10 now. Before parent acceptance, M11/M12 must demonstrate delayed finalization and judging, invalidation after seal and guarded publish; M17 must preserve imported facts/evidence/rates. M18 must supply actual scope/coverage labels. Fixture guards alone do not certify lifecycle safety.

**Pending parent obligations:** M13.2 browser scorer/exports, M13.3 all chart groups, M13.4 durable jobs/screens/opening, M14/M15 end-to-end navigation and wireframe follow-ups in the parent. This child's static artifact does not complete M13.

### Automated judge assessment storage binding

Retain actual JudgeGroup route/profile labels and assessment/Review distinctions from the pinned M02 snapshot. Pending/failed/not_judged machine assessments may expose billed calls/routes with no Review; display those facts without placeholder grades or borrowed competitor configuration. Include judge-group/request-route dependency cutoffs in persisted analysis provenance; keep hops/assets from multiplying score rows.
