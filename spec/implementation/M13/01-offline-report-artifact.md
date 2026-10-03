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

## Artifact and publication

Keep all parent ReportParts present/locked. Static markup contains measured/quality trial rows, one mean/min–max row after each configuration's trials, original analysis label, task/check evidence, screenshots, missing-data explanations and full template identity.

Domain fields map at the adapter boundary to complete M10 CostDTO/MeasuredDTO/RateUseDTO/BillingDTO/DisplayCurrencyDTO and contributor fields. Preserve exact reduced n/d plus engine display strings, frozen rates/sources/dates, declared-billing text and coverage. For mixed scopes embed the M10 USD view plus each run's frozen projection using its normal None default; a single-currency scope needs only its frozen view. Filter selection uses those projections; never accept alternative currency/rates.

Jinja autoescape/StrictUndefined protects static text. JSON islands encode `<`, `>`, `&` as literal `\u003c`, `\u003e`, `\u0026`, and escape U+2028/U+2029; use no template evaluation of data. Provenance URLs are inert text, not external href/src targets.

Inline trusted HTML/CSS/assets, CSP with matching script hashes, and validated PNG/JPEG/WebP data images. Unsupported evidence including active SVG is escaped text. Unreadable screenshot gets an explicit placeholder/warning. No competitor source/instruction is executable.

Stream into a target-directory temp file. `ReportPublication.publish(snapshot, pending, intent, overwrite)` serializes final readiness/version/invalidation recheck, cancel admission and final target collision check with M02/M11 shared publication/lifecycle state; fsync and atomic rename follow only if admitted. A check followed by an unlocked rename is insufficient.

A changed selected review/retention version returns reports.snapshot_changed; selected invalidation rejects the whole pending report. Later unrelated imports never enter the pin. Refuse resolved protected result-store destinations and overwrite=false collisions, including concurrent writers. Precommit failure deletes only the owned temp file.

M13.4 supplies durable publication intent/settlement. A commit that wins cancellation keeps path/digest and must recover successfully; no postcommit cancellation promise may erase it. No writes under retained results and no model/harness/judge port exist.

## Boards and supplied states

ReportPage: original static measured/quality tables, full SHA, every trial and summary, origin/UID, groups, evidence and no-JS explanation. Supply complete/partial/unknown/empty, missing screenshot, same-label runs, original/profile-default weights, frozen/missing/mixed currency and declared billing states.

Supply ReportGenerate/ReportGenerateDefaults counts/locked parts/readiness reasons and ReportReady artifact metadata; M13.4/M02 own those screens. No wireframe edit belongs here.

## Acceptance and faults

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

## SQLite analysis snapshot — R191

Use the [results database contract](../RESULTS-DATABASE.md) to retain/reuse M06's prepared-population output through M02 before publishing an engine-generated scored report. Pure `analyse_population` stays pure; the report use case owns the persistence call and final input/publication guard. Include analysis ID, input digest, exact values and stale/inspection limitations in the standalone payload; never open repository files or query SQLite directly from M13. A persistence failure cannot publish an artifact claiming saved analysis. Offline what-if values remain explicitly unsaved until retained by an engine operation.
