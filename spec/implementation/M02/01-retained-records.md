# M02.1 — retained-records

Parent: [M02](../reference/modules/02-retained-results-comparability.md#1-engine-component). Requirements: R066, R067, R076–R082, R114, R116, R122–R124, R134, R143, R153–R155. Findings: F02, F03, F06, F09; preserve F07/F08 accounting fields.

Outcome: serializable immutable execution facts, portable run/result/trial bindings and append-only review/invalidation semantics. This is proposed implementation work, not evidence that the runtime exists.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap package/test layout, shared ID/value objects, deterministic fixture builders and import-boundary check; [M01.1](../M01/01-canonical-definition.md) canonical definition/identity implementation.

**Bootstrap-published contracts, allowed as injected fixtures:** M08 check/evidence schemas; M10 measurement/cost/coverage/rate schemas; M12 rubric/raw-grade/review schema; M07 complete credential-free frozen launch. These must validate published fields and scopes. Real verification, accounting and judging services are later integration gates, not entry dependencies.

Extend `RetainedResult`/execution evidence with versioned `context_capture/1` envelopes and context segment/snapshot/transition/gap kinds. Add `domain/context_evidence.py` and codec fixtures. Each declared capture source binds result/full TrialRef/task/invocation/session/agent/window, source digest and final `ContextClosureReceipt` (complete/partial/unavailable/off); sealed records cannot omit required envelopes. Keep classification, count and membership provenance independent. Source evidence enters `facts_digest`; append-only analysis, observer accounts and selected cutoff enter only `payload_digest`.

Publish the per-capture `ContextAnalysisSelection` descriptor from the supplement: one sorted capture row, source digest, and either native-only null or analysis ID/ledger cutoff/digest/status/file closure. Preserve credential-free decision profile/version/digest, capability/model/resource evidence, DecisionCall refs, raw answers and commentary/pack provenance in review/analysis records. `JudgeGroup` uses the full backend-specific fingerprint; no pooling by model label. Structured records map to authoritative SQLite; portable sidecars remain evidence representations, not another mutable database.

## Ownership and interfaces

Own proposed files:

- `axbenchmark/engine/results/domain/records.py`, `bindings.py`, `facts.py`, `reviews.py`, `invalidation.py`, `comparison.py`, `errors.py`.
- `axbenchmark/engine/results/serialization/record_codec.py`, `canonical_digest.py`; `axbenchmark/engine/results/schemas/retained-result-v1.schema.json`, `run-binding-v1.schema.json`, `run-invalidation-v1.schema.json`.
- `tests/results/test_record_codec.py`, `test_bindings.py`, `test_immutable_facts.py`, `test_review_append.py`, `test_invalidation_overlay.py`, `test_trial_grouping.py`; fixtures in `tests/results/golden/` (`run-binding.json`, `result-trial-1.json`, `result-trial-2.json`, `invalidation.json`, `digests.json`).

Use shared `RunUid`, `RunLabel`, `TrialRef` and `ResultId`; do not create alternative IDs. The parent defines exact fields, cardinalities, digest boundaries and errors. Export domain constructors and pure operations for `RunBinding`, `RetainedResult`, `EffectiveResult`, `TrialGroup`, `ComparisonScope`, `RunInvalidation`, review append, and import classification. No filesystem, daemon, provider calls or UI belong here.

`ResultId ↔ TrialRef` is one-to-one. Run binding covers the complete frozen launch even when a package selects only some results. Execution seal freezes `facts_digest`; reviews and invalidation change a later snapshot `payload_digest` without modifying that seal. Review IDs retry identically or conflict; an additional review cannot replace the original. A run invalidation overlays every trial, including ones loaded later.

Retain M10's `MeasurementSet.statistics`, `GenerationAggregate` and `ArtifactStats` losslessly in canonical codecs and normalized row mappings: full result/trial/request bindings, exact rational/null values, independent known/partial/unknown/detail states, full rosters, operator, paired N/D, policy bytes/version/digest, source clocks and safe receipt/inventory references. Extend frozen launch/original weights with complete schema-2 weights/directions/policies and original schema provenance. Missing archived fields stay unrecorded, not default-zero or recomputed.

Add `DeliveredSnapshotManifest`/`DeliveredSnapshotEntry` domain types in owned `facts.py`: immutable snapshot ref, ResultId/TrialRef, template/baseline/delivered-scope digest, complete/partial inventory and typed limitations; each safe relative entry carries kind, size/content digest and retained-byte reference where available. A complete manifest can establish file membership independently from text decoding. M10 owns classification/counting policies and values. Include metric values, request pairings, inventory/policy/source digests in `facts_digest`; derived alternative scores stay outside execution facts. Preserve the exact existing canonical/import bytes and payload meaning.

**Frozen domain contract.** Extend DefinitionAndLaunch, Review/RawGrades, JudgeGroup and evidence codecs with the exact frozen family/profile/rubric version/digest/signature, business/comment mapping, DomainEvidencePlan ref and typed ObservationContext/coverage. Bind native build/matrix, DevOps mode/target, agent case/per-boundary mode and specification supplied-authority/candidate-source roles to final snapshot digests. Preserve zero-weight grades and all three comment axes; unavailable evidence stays a limitation. Existing facts-versus-review digest/seal boundaries determine placement; no current catalog/default lookup.

Add owned `domain/variant_records.py` and `variant_filters.py` plus their record/schema codecs. `DefinitionAndLaunch` retains M07 `FrozenVariantSelectionV1`; `OriginAndExecution` retains ordered `VariantEvidenceV1` observations bound to ResultId/full TrialRef/invocation/request interval. `VariantAnnotationV1 {annotation_id, operation_id, subject, prior_snapshot_ref, author_source, recorded_at, kind, payload, evidence_refs}` is append-only, with `kind=claim_correction|effective_observation|attribution_exclusion` and exactly the corresponding replacement claim, late observation or exclusion payload; `VariantAttributionExclusionV1` binds affected TrialRefs/intervals and mandatory reason/evidence independently of metadata view.

Publish `VariantFilterV1` with exact-root/family, lineage/adaptation path, quant method/preset/storage/runtime precision, creator node/role/handle, date node/kind/range/precision/match mode, provenance/effective-proof state, annotation view/revision and `VariantComparisonSelectionV1`. `EffectiveResult` exposes `VariantResultProjectionV1 {requested, resolved, effective, descriptor, annotations, attribution_exclusions, metadata_view, publication_revision}`; selecting As recorded cannot remove a mandatory mismatch exclusion. Complete ConfigurationSubjects and rosters remain the grouping grain.

Use authoritative normalized SQLite mappings for immutable descriptors/manifests/nodes/edges/claims/observations and annotation operations. Launch/source/effective evidence before seal participates in facts; later annotations change only payload/derived projection revisions. Explicit absent archived metadata projects Unknown without rewriting canonical input bytes; same variant ID/revision with different descriptor bytes is a conflict.

**Relational codec closure.** Own `serialization/relational_codec.py` with typed row mappers for every retained DTO, including `domain_evidence_plan`/ordered bindings, `evidence_observation`, `delivered_snapshot`/entries, context native/synthetic identities and all eleven `context-labels/1` categories. Keep schema tags, seven project types, target/commit policy, frozen rubric and final snapshot refs queryable; bounded sanitized canonical policy/report artifacts retain full source detail. `variant_snapshot` conflicts on `(variant_id, descriptor_revision)`; annotation tags map to exclusive correction/observation/exclusion FKs and a durable operation receipt. Known/unknown effective controls stay typed. File-backed drafts and private journals never decode as committed facts.

## SQLite record mapping — R191

The [normalized database contract](../RESULTS-DATABASE.md) binds these domain records to typed relational facts, reviews, measurements, provenance and score snapshots. M02.1 owns lossless row/domain mapping invariants and canonical validation; M02.2 owns SQL, migrations and transactions. Preserve portable IDs and facts/payload digests independently of SQLite row order, surrogate keys or physical bytes. Cross-result evidence/review links, incomplete expected rosters, unknown measurements and invalidated scopes must not become valid through a join. Exact score/value representations round-trip without conversion through binary floating point.

**Route, comparison and profile interfaces.** Extend ResultFacts/FrozenRunBinding codecs with FrozenHarnessComparisonV1, immutable profile/hop/model/effort/capability snapshots, ConfigurationAccessBinding and ConfigurationExistingAgentBinding, plus RequestRouteObservationV1. Map these to the existing normalized access/profile/matrix/request tables; maintain six ordered cells even without results. Bind competitor access/profile to full run/configuration and harness-review access/profile to JudgeGroup independently, validating role/harness/model/mapping/inspection/treatment digests. Normalized unknown states/reasons and source references remain first-class. Observed route/model/effort source facts are stored once and VariantEvidenceV1.source_fact_ref links the shared evidence rather than carrying competing effective values; disagreement is additive. Planner and route diagnostics have no retained ResultId and stay in owner journals. ResultFilters adds optional `harness_comparison` (comparison ref, classification, coverage, selected route/model/effort/profile refs/treatment) independently of variant filters.

## Integrated requirements

R192, R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R191 — [authoritative SQLite results and analyses](../RESULTS-DATABASE.md).
R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R189 — [human review](../M12/05-human-review-web.md).

R184, R185, R186, R187, R188 — frozen domain profile/evidence contracts: [R184](../quality-judges/BACKEND.md); [R185](../quality-judges/MOBILE.md); [R186](../quality-judges/DEVOPS.md); [R187](../quality-judges/AGENTIC.md); [R188](../quality-judges/SPECIFICATION.md).

R174, R176 — [benchmark statistics](../BENCHMARK-STATISTICS.md).

R164, R171 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

R180, R183 — [benchmark modes](../BENCHMARK-MODES.md).

Extend `DefinitionAndLaunch`/bindings with the approved descriptor format, benchmark/project type, derived target/legacy view, ordered primary refs and frozen task-commit protocol/check/scope identity. These are projections of the bound template, not independent defining fields or source-path dependencies. `TaskOutcome` retains process and authored/protocol-origin CheckOutcomes separately; referenced `TaskRepositoryEvidence` binds ResultId/TrialRef/task/InvocationId, start/end absent/unborn/born HEAD, trees/new commits/prior tips/ancestry, setup origin, inventories and snapshot/history digests. Git IDs never replace template SHA or timing.

Extend retained codecs/digest fixtures for both modes and seven domains, source-removed baselines, no-change/missing/dirty commits and unreadable proof. Preserve archived v1 payload/outcome bytes; missing historical fields are explicit `not_recorded`, never invented failure, default policy injection or backfill. A later task cannot alter earlier sealed facts.

**Human record contract and acceptance:** `Review`/`JudgeGroup` codecs discriminate `human_review {reviewer_ref, form_policy_ref}` with immutable versions/digests, rubric/category/evidence/scope fingerprint and `human_authored` commentary. Reviewer UUID/optional label is self-declared; reject fabricated model/effort/confidence/InvocationId/DecisionCallId/PID fields. Preserve six raw grade parts, three frozen comment axes, explicit ungraded reason/deficiencies and receipt-bound original or additional disposition. Pending drafts/intents are M12 working state and never become Review rows. Round-trip graded, explicitly ungraded and skipped/cancelled originals plus additional reviews; identical committed ReviewId/digest retries preserve facts_digest and distinct groups.

## Acceptance and faults

**Route/profile acceptance:** Codec/SQL-facing fixture closure rejects wrong subject/role/harness, immutable-ref reuse, missing cell and mismatched duplicated selectors; selected configuration IDs are unique, unselected rows carry none. Multiple profile controls/assets/hops/reasons cannot multiply subjects, scores or observations. Portable snapshots contain no source paths/credential locators/secrets/raw shell.

**SQLite acceptance:** Round-trip domain→normalized rows→domain and current portable codecs for all tags/backends, giant exact fractions, half-step grades, null versus zero, pre-seal manifest entries and all annotation variants. Reject cross-template plans, schema/snapshot/call scope mismatch, duplicate descriptor revision with different bytes and fabricated human machine fields without rewriting canonical fixtures.

**Variant acceptance:** Round-trip complete/partial content, ordered adapters/merge roots, creator/date alternatives/precision and requested/resolved/effective states with full scope. Equal content with changed provenance retains execution identity; annotations retry identically or conflict and preserve facts_digest. Both metadata views retain post-seal mismatch exclusions; malformed explicit v1 refs reject without backfilling archived bytes.

**Domain acceptance:** Round-trip all six families and every evidence tag, three grading backends, zero-weight categories and partial coverage. Reject foreign final snapshot/build/case/brief refs and profile/signature mismatches; new reviews change payload only and leave original rubric/evidence bytes intact.

Extend codec/digest/immutable-facts tests with exact pooled N/D, count mean fractions, unknown cached/reasoning details, known file_count with partial LOC, binary/link inventory, missing trial and complete eight-key weights. Changed metric/policy/inventory bytes change the appropriate facts digest; pure reweighting/saved analysis does not. Foreign request/trial refs and unsafe inventory paths reject before retention; no archive backfill or workspace scan.

Add `tests/engine/results/test_context_evidence.py`: independently vary label/count/membership, closure status, source/analysis digest and backend fingerprint. Reject missing/cross-trial closure and invalid selected cutoffs; delayed analysis changes payload only, never sealed facts. Preserve archived input bytes without backfill.

Run `pytest tests/results/test_record_codec.py tests/results/test_bindings.py tests/results/test_immutable_facts.py tests/results/test_review_append.py tests/results/test_invalidation_overlay.py tests/results/test_trial_grouping.py`:

1. Same label/configuration on two machine-generated UIDs yields separate ordered trial groups. Rebinding one UID to another frozen launch, one result ID to another trial, or one trial to another result ID returns the named conflict with both bindings.
2. Two trials contain different T1 outcomes/log refs. Every serialization round trip preserves result ID, full TrialRef, task and phase. Mismatched body scope fails; `trial_index=0` and an index beyond frozen count fail.
3. Sealed measurement/evidence mutation fails. Identical original review retry is a no-op; a different second original fails; additional review cost stays separate. Review changes affect snapshot digest but leave facts digest unchanged. Import timestamp, local path and relay changes affect neither portable digest.
4. Invalidate an already sealed run with completed reviews. Both trials retain facts/reviews and original statuses while effective statuses become non-comparable. Repeat the detection without replacing first evidence; conflicting reuse of invalidation ID fails. Invalidation survives codec round trip.
5. Preserve unknown/partial values, numeric zero with its original cost basis, declared billing, frozen `per_usd` units and missing-rate reasons. M18 hardware envelopes retain explicit TrialRef while shared host series remains experiment-scoped; no codec attributes host energy to a competitor, substitutes zero, calculates rates or decides scoring eligibility. Credential values are structurally absent.

**Wireframes:** no rendering ownership. Fixtures provide the distinct rows/states for ResultsTrials, ResultsHalted, ResultOrigin, ResultOutcomes and ResultReviews.

**Real integration gate:** M08/M10/M12 producers serialize real outputs through these schemas; M17 archive round trips preserve the exact portable digests/bindings; M06 rejects the effective invalidated scope. Producer fixtures alone do not satisfy this gate.

**Pending parent obligations:** durable storage/finalization/publication/API (M02.2), clients (M02.3), and real cross-module integration.

### Automated judge assessment storage binding

Automated judging also publishes `JudgeAssessmentIdentityV1`/`JudgeAssessmentReceipt`: real result/full TrialRef, exact group/selected binding closure, original/additional purpose, stable assessment/reserved Review IDs and digest. A reserved ReviewId is not a Review. Closed codecs allow call/route/cost evidence and failed/not_judged disposition with no Review; actual machine Review links one unique assessment later. Human has no automated-assessment/model-route branch. Selected route/profile identities are semantic digest inputs; derived relational owner/binding/receipt keys are excluded from recursive hashes.
