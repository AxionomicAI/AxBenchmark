# Normalized SQLite results and analysis

Status: binding implementation supplement, requirement **R191**. This is a proposed storage and query contract; no application database or working benchmark engine is created by this document. It extends existing delivery children without adding a dependency node.

Build the solution from scratch against an empty SQLite database. There is no import/backfill of an older AxBenchmark installation, filesystem-results migration, dual-read fallback or compatibility requirement for obsolete record formats. Every retained result, measured statistic, quality grade and saved score analysis belongs in this one authoritative database. Users can open it read-only with ordinary SQLite tools, join stable views, and build graphs without parsing result JSON files. Large source snapshots, screenshots, logs and raw responses remain immutable content-addressed files; the database stores their identifiers, digests, safe relative locations and scope. Model manifests describe weights without copying those weights into result storage.

[results-v1.sql](sqlite/results-v1.sql) defines the concrete schema, constraints, indexes and public views. [analysis-examples.sql](sqlite/analysis-examples.sql) supplies eight executable query examples. [validate-schema.py](sqlite/validate-schema.py) checks the proposed DDL and queries in disposable databases. These artifacts are specification companions, not a migration runner or solution implementation.

The retained domain contracts remain [M02](reference/modules/02-retained-results-comparability.md), [M06 scoring](reference/modules/06-scoring-rankings.md), [benchmark statistics](BENCHMARK-STATISTICS.md), [model variants](MODEL-VARIANTS.md), [context monitoring](CONTEXT-MONITORING.md) and [quality judging](reference/modules/12-quality-judging.md). This supplement replaces filesystem JSON as the authority for structured results. It changes no metric formula, rubric, required-check gate, template identity, trial policy or model-comparison rule.

## Ownership and boundaries

| Owner | Required implementation |
|---|---|
| M11.1 shared foundation | SQLite connection/version capability checks and shared publication/operation-receipt transaction primitives. The connection and publication authority exist before M02.2; no dependency cycle. |
| M02.1 | Typed relational mapping and lossless domain reconstruction, exact-number encoding, immutable fact/review/analysis identities and error vocabulary. |
| M02.2 | Database repository, migrations, writer coordination, normalized rows, indexes/views, evidence references, analysis sink, read snapshots, backup and forward schema evolution. Replace the proposed `fs_repository.py` with `sqlite_repository.py`; retain the evidence file adapter. |
| M06.1 | Pure exact calculations, eligibility/exclusion details, selected review/weight/population provenance, per-trial Q, subject scores and all specialized ranking outputs. M02 persists these values; SQL never becomes a competing scorer. |
| M10/M12/M18 | Existing measurement, review and telemetry producers supply validated scoped values; M02 owns their retained representation. Human drafts/credentials remain M12.5 working state, not scores. |
| M17.2 | Validates canonical portable packages and stages participants. Its final publisher uses the shared live SQLite transaction; an imported SQLite file is not accepted as executable schema or an alternative import format. |
| M02.3/M06.2/M13/M14 | Expose saved analysis references/freshness, preserve offline use, and provide database discovery/snapshot actions without direct operational SQL writes. |

Default canonical location: `~/.axbenchmark/results/results.sqlite3`, resolved through the configured data root. The engine is the only supported writer. TUI/CLI operational features continue through engine APIs; external analysis has a deliberate read-only exception to the engine-only storage access rule. SQL read access exposes retained local data, so database, WAL, SHM, staging and evidence permissions remain private to the user.

M01 immutable template files and M07 reusable configuration YAML may remain file-backed. Frozen result/launch copies, measured values, committed reviews, scores and their analytical provenance are relational authority. The current canonical JSON/YAML contracts remain interchange and raw-provenance formats; they are not a second mutable source. Raw source envelopes may be retained as evidence, but no required score, measurement, grade, creator/date or comparison field may be available only inside a blob.

## Relational structure and grain

Portable RunUid, ConfigurationId, ResultId and ReviewId preserve their existing meanings. A configuration subject is **(RunUid, ConfigurationId)**; it is never just a model label, variant, configuration name or machine label. Internal `expected_trial_id`, exact-value IDs and database publication sequences are storage keys, not new portable benchmark identities. A result binds one unique expected trial; all expected trials exist even before their result is retained.

```mermaid
erDiagram
    template_revision ||--o{ benchmark_run : defines
    benchmark_run ||--|{ run_configuration : freezes
    run_configuration ||--|{ expected_trial : requires
    expected_trial ||--o| retained_result : binds
    retained_result ||--o| result_seal : freezes
    retained_result ||--o{ review : assessed_by
    judge_group ||--o{ review : identifies
    review ||--o{ review_grade : contains
    rubric_version ||--|{ rubric_category : defines
    analysis_snapshot ||--|{ analysis_subject : compares
    analysis_subject ||--|{ analysis_trial : pins
    analysis_trial }o--o| review : selects
    analysis_subject ||--o{ analysis_ranking : ranks
    analysis_subject ||--o| analysis_score : measures
    variant_snapshot ||--o{ lineage_node : describes
    lineage_node ||--o{ lineage_edge : orders
```

The DDL is the column-level dictionary. This map identifies the grain and normal join direction; children inherit run/trial identity through parents instead of repeating labels and facts everywhere.

| Relations | Grain and purpose |
|---|---|
| `schema_migration`, `publication`, `operation_receipt`, `outbox_event` | Applied migration; atomic publication; durable idempotent operation; logical notification. No event-body secrets. |
| `exact_value` | One interned canonical rational pair; immutable numeric values reused by typed semantic columns. This is a number representation, not an arbitrary property/value facts store. |
| `source_observation`, `evidence_artifact` | One safe source retrieval and one unique retained content artifact. Paths never supply identity. |
| `rubric_version`, `rubric_category`, `rubric_criterion`, `rubric_anchor` | Frozen rubric, six ordered categories, their criteria, and anchored grade text. All six current families retain their exact frozen keys. |
| `template_revision`, `template_task` | Exact canonical template SHA and ordered task identities; prompt/source bytes stay referenced artifacts. |
| `machine_snapshot`, `machine_component`, `harness_release` | Immutable machine/OS facts and individually identified components; a captured harness/adapter release. |
| `model_checkpoint`, `artifact_manifest`, `model_artifact_file` | Source-qualified pinned checkpoint and versioned file manifest entries; manifest completeness stays explicit. |
| `variant_snapshot`, `lineage_node`, `lineage_edge`, `variant_root`, `variant_adapter` | Descriptor snapshot, transformation node, ordered parent edge, complete/partial root set, ordered active adapter composition and exact scales. Cycles fail. |
| `quantization_claim`, `precision_claim` | Typed native quantization parameters per node and separate stored/runtime/compute/cache precision facets. Unknown is not unquantized; training precision stays on its lineage node. |
| `creator`, `creator_claim`, `creator_claim_value`, `date_claim`, `date_claim_value`, `variant_annotation` | Role-specific creator/date claim slot, separately sourced values/alternatives and append-only corrected descriptor references. No comma-separated creator lists. |
| `benchmark_run`, `run_configuration`, `configuration_control`, `run_factor_weight`, `run_category_weight` | Immutable launch, subject, typed frozen comparison controls, original factor directions/weights and category weights. Jobs/concurrency and launch schema remain explicit. |
| `expected_trial`, `retained_result`, `result_seal`, `run_retention` | Complete required roster, observed result identity, execution freeze/receipt and full-roster terminal retention barrier. Missing result is distinguishable from absent roster. |
| `result_evidence`, `task_attempt`, `task_commit`, `check_result` | Scoped artifact binding, task execution attempt, ordered commit evidence and independent acceptance/infrastructure outcomes. |
| `inference_call`, `call_counter`, `generation_interval`, `trial_measurement`, `source_file_inventory` | Scoped call, native/detail counter, paired generation timing, sealed normalized trial summary and individual included/excluded file/LOC evidence. |
| `billing_snapshot`, `price_snapshot`, `price_rate`, `currency_rate`, `cost_observation`, `cost_component` | Frozen billing basis, dated price table/rates, run-frozen currency conversion, scoped charge/estimate and contributing quantities. |
| `hardware_series`, `hardware_sample` | Explicit host/trial/device/metric series and individual sample; shared host consumption never silently attributed to a competitor. |
| `context_capture`, `context_segment`, `context_snapshot`, `context_membership`, `context_count`, `context_gap` | Raw sanitized capture, segment, occupancy gauge, membership assertion, independently sourced count and coverage gap. |
| `context_analysis`, `context_classification` | Append-only decision-analysis identity and per-segment category; classification cannot manufacture native counts or membership. |
| `judge_group`, `review`, `review_grade`, `review_comment`, `review_evidence`, `review_deficiency`, `review_limitation`, `review_finalization` | Exact backend/group identity, one assessment, one valid category grade, three comment axes, admitted supporting references, typed deficiencies, limitations and shared-validator finalization. |
| `original_disposition`, `additional_disposition`, `run_invalidation`, `effective_variant_observation`, `variant_exclusion` | Durable judgment outcomes/pending originals, independent additional outcomes, run-wide invalidation and invocation/result-scoped served-identity evidence/exclusion. |
| `resource_revision`, `analysis_dependency` | Append-only source revision and the exact revision of each dependency selected by an analysis. |
| `analysis_snapshot`, `analysis_factor`, `analysis_category_weight`, `analysis_subject`, `analysis_trial` | Immutable request/input/algorithm policy, eight factors, six category weights, complete selected subjects and each subject's full expected trial roster with selected review IDs. |
| `analysis_trial_score`, `analysis_score`, `analysis_component`, `analysis_cost_projection`, `analysis_ranking`, `analysis_exclusion`, `analysis_finalization` | Per-trial Q, aggregate Q/combined score, raw/normalized/contribution values, currency/cost basis projections, each ranking kind's official rank/tie key, field/trial-specific exclusions and validated snapshot closure. |

Most relations store facts once at their own key; dimensions and multivalued relationships are separate. `trial_measurement` is an intentional M10-normalized summary alongside raw receipts. `analysis_*` values are intentional immutable M06 materializations with complete input provenance, not independent mutable facts. The closed `configuration_control` vocabulary is a typed extension point for serving controls, not an unbounded metric EAV table: each key has an owner-defined value type/unit, required known/unknown slot and normalization version. New semantic fields require a reviewed schema/codec migration.

Foreign keys and composite keys express existence, rubric scope and subject membership. Scope triggers reject cross-template tasks, cross-result evidence/reviews, cross-configuration trials and lineage cycles. Append-only triggers reject update/delete of retained facts; separate finalization guards reject new execution rows after sealing and new review/analysis children after finalization. All child rows and their finalization marker are committed together. Direct writable SQLite access is unsupported and cannot replace domain validation.

## Exact values, missing data and semantic validation

`exact_value.numerator` is canonical signed decimal integer text; `denominator` is canonical positive decimal integer text. No plus signs, whitespace, leading zeroes, exponents or negative zero; zero is `0/1`. The engine reduces by GCD and interns the unique pair. SQL checks lexical form and nonzero denominator; arbitrary-precision reduction and semantic ranges are engine checks. SQLite numeric `REAL` values are approximate, so neither money nor official scoring uses them as authority. [SQLite floating-point documentation](https://sqlite.org/floatingpoint.html)

Token/file/LOC counts and trial counts/indices use canonical nonnegative/positive integer text to avoid an artificial signed-64-bit business limit. SQL ordering of such counts uses `ORDER BY length(value), value` for positive values; official rank ordering uses the retained exact ordinal and tie key, never approximate score sorting. Storage IDs/sequences and six-category ordinals remain SQLite integers. Exact values can represent negative hardware temperatures or a signed declared control; M06/M10 validators separately require nonnegative prices, weights, counts, durations and scores where their contracts require it.

Raw category grades use integer half-step units **2 through 10**: grade 4.5 is 9. They are not percentages. All six valid grades remain mandatory even at zero weight. `review_comment` preserves `code_quality`, the recorded `usability` or `developer_experience` key, and `specification`; the engine validates exactly those three axes without renaming the current domain fields. Explicit partial/unparseable review parts remain safe raw evidence plus structured deficiencies; an off-grid raw grade is never inserted as a valid `review_grade`.

Known zero has a stored value and complete coverage. File count and LOC have independent coverage/value slots: known file count can coexist with unavailable LOC. Unknown/unavailable/not-applicable has null value and an appropriate reason; partial retains the observed value plus partial coverage. Storage `complete` maps to the existing domain metric `known` state without changing canonical codecs. Never use `COALESCE(metric, 0)` in comparison math. The reference views return conservative null plotting projections outside their documented range instead of overflow/infinity; arbitrary-precision exact values remain queryable.

The following are mandatory engine transaction validators in addition to executable SQL constraints:

- Validate canonical ID/hash/UTC timestamp forms, positive full roster indices/counts and exactly one result binding; check every call, cost, hardware and evidence reference against its full owner scope and frozen template. Digest strings in the DDL are references, not proof that bytes were checked.
- Verify all frozen launch/control values, sanitized configuration/billing information, known six-category rubric/criterion signatures and source-normalization policies. Retain canonical policy definitions as referenced versioned artifacts while storing queryable values relationally. No digest alone substitutes for required retained configuration values.
- Enforce canonical rational reduction; owner-specific units/ranges; all eight factor entries; finite nonnegative weights with positive total; existing `lower`/`higher` directions, including nullable directions for disabled new factors and required directions when enabled. Use current defaults and all M06 exact test vectors.
- Require six grades, exact comment axes, substantive rationale, admitted evidence, explicit limitations and the complete M12 validator before review finalization; do not promote SQL row counts into proof of quality validity. Human pending/draft states are not failed/ungraded scores, and human groups have no fabricated model/call fields.
- Validate descriptor claim alternatives, creator roles/date precision, complete roots, immutable adapter/manifests, normalization policies and effective proof. Unknown controls do not match other unknown controls. Keep date precision/timezone and created/published/uploaded/observed distinct; generic SQL string date ranges cannot establish definite overlap for partial dates.
- Verify complete expected roster, sealed receipt/digests, required checks, original disposition settlement and all contribution relationships. Summary coverage must reconcile with raw receipts. Native detail counters included in their parent are not added twice; all-trial token/source means preserve incomplete members.
- Validate every analysis rank against its ranking kind and full M06 eligibility. Per-trial or aggregate Q can exist for a subject without an eligible combined rank. Pending/ineligible/failed snapshots have explicit typed exclusions and absent unavailable scores; no placeholder zero/rank.
- Validate all normalized rows/closure markers against their canonical digests before publication. Reference DDL is deliberately insufficient for these cross-row semantic checks; acceptance requires the actual domain codecs/validators, not arbitrary insertion of rows that merely satisfy FKs.

Generation throughput remains **sum of paired request output tokens / sum of their paired generation seconds**, using the selected compatible timing policy across complete trials. Do not average request/trial tok/s, divide by whole benchmark time or blend native and proxy timing. Files/LOC describe the immutable final snapshot, baseline included; keep the versioned inventory/exclusion/encoding rules. Competitor, judge, observer, verification and human lifecycle accounting remain separate roles. Context occupancy is a gauge at a snapshot, not additive traffic; labels, counts and membership retain separate provenance, and hidden thinking stays unknown when unexposed.

## Persisted scores and freshness

There is no timeless `model.score` column. A saved analysis binds its exact template SHA, input publication pin/digest, full selected subject roster, every expected trial/result, immutable selected ReviewId/JudgeGroup, category/factor weights and directions, algorithm version, scoring/metric/cost policies, frozen price/rate/tariff basis, variant comparison mode, descriptor/annotation view and all exclusions. Preserve per-trial Q, aggregate quality, each raw/normalized/weighted component, specialized cost/time/quality/other enabled ranks, combined score and official tie ordering. Scoring does not pool runs, machines, variants or judgment groups into a label average.

```python
class AnalysisSnapshotSink(Protocol):  # M02.2 storage; pure M06 prepares the value
    async def retain(
        self, prepared: PreparedAnalysisSnapshot, *, expected_input_digest: str
    ) -> AnalysisSnapshotRef: ...
# Ref: analysis_id, analysis_digest, input_digest, publication_id, status, freshness.
```

`PreparedAnalysisSnapshot` contains the normalized envelope/roster/values above and its canonical `request_digest`/`input_digest`. The input digest includes the exact selected dependency revision/publication IDs as well as their semantic digests, so revalidation after a semantic reversion cannot reuse an older stale snapshot. Canonical `(request_digest, input_digest)` is the idempotence key; an identical retry returns the existing reference, conflicting prepared bytes fail. Compute outside the writer transaction, then under the short transaction revalidate the expected dependency digest, write all values/roster/dependencies/finalization/receipt, and acknowledge only after durable commit. Changed inputs return `SnapshotChanged`; storage failure returns a typed `results.analysis_persistence_failed`, never a false saved-score response.

M06 `ScoringRules` and `analyse_population` remain pure. Engine application/query/report orchestration persists or reuses every completed original/result score and requested ranking analysis before returning its saved result. Alternate engine weights/cohorts generate another snapshot, never overwrite history or source facts. A standalone offline HTML what-if calculation can remain an explicitly **unsaved preview**; it makes no database/browser write and is not represented as a retained score. No new offline ingestion feature is required here.

Each fact/review/invalidation/variant-exclusion/annotation/definition/cohort change publishes its `resource_revision` in the **same transaction**, independently of whether any score is recomputed. Analyses register every dependency that could alter selection, eligibility, values or presentation: at least exact template cohort, selected runs/configurations, chosen reviews/group/rubric, metric/cost policies and selected metadata/annotation/control views. A cohort dependency changes when another qualifying run arrives; missing that dependency would falsely mark an old relative ranking current.

`analytics_analysis_status_v1` conservatively marks a snapshot stale if any recorded dependency has acquired a different later digest; no dependencies yields `unverified_dependencies`. This conservative history rule can keep a snapshot stale after an apparent reversion, which is safe: recompute/revalidate a new input snapshot rather than silently resurrect it. The `current` view excludes stale/unverified rows but still exposes pending/ineligible status; it does not turn current into eligible. The engine validates the complete dependency set and is the only authority for publishing `current` analytical inputs. Historical analyses remain inspectable with their original timestamps/inputs and visible stale status.

## Atomic publication, sealing and imports

The live database contains only published operations. Ordinary incremental execution may expose explicit unsealed results; private import staging and half-finalized review/analysis batches may never leak through base-table queries. Hiding committed staged rows in a convenience view is insufficient because users may query base tables directly.

1. Validate/prepare import DTOs and participant receipts in private staging, outside the live database. M17 `prepare` and `commit_view` continue to mean durable readiness, not independent publication. Repeating the same transaction/intent recovers original tokens/created flags; changed intent conflicts, and rolled-back registrations stay rolled back.
2. Write/fsync immutable evidence and M01/M07/M16 prepared file payloads first. Protect pre-existing identical content and verify references before publication. These prepared entries remain invisible to operational readers until their shared marker exists.
3. Through **one connection and one live SQLite transaction**, revalidate conflicts, insert the complete accepted normalized batch, source/dependency revisions, receipts and outbox, and its `publication` marker. This commit is the common visibility point. File-backed participants consult that SQLite marker; there is no separate filesystem marker that can commit independently.
4. A `PublicationView` owns a pinned SQLite read transaction and the matching marker set used by all participating readers. M01/M07 file reads use only immutable payloads admitted by that pin. Concurrent readers observe the previous collection or the entire new collection, including when querying raw SQLite tables.
5. Before commit, failure/cancellation rolls back rows/marker and removes only newly staged unreferenced files. After commit, recovery rolls forward acknowledgements/events; it never deletes published facts. Orphan durable files may be reconciled later; committed rows must never reference undurable/missing required evidence. Read leases and shared mutation guards protect active exports/snapshots.

The marker table is shared infrastructure; template/configuration/planner approvals use the same authority, even if they add no result rows. Individual participants must not open independent commits during final publication. Hashing, file copying, network calls, model inference, human waiting and scoring computation happen before the short writer critical section.

Execution sealing still verifies the actual M10 finalization receipt and exact accepted facts, evidence, hardware and context closure. Reviews, invalidations, context classification and variant annotations append separately after seal. A human submit first records its immutable M12 intent, then M02 commits review/grades/evidence, finalization, disposition, receipt and outbox together; recovery replays the same intent/ReviewId without regrading or reading a mutable draft. `run_retention` is admitted only when every expected trial/receipt and original terminal disposition has settled; pending human cases cannot supply that marker.

`facts_digest` and `payload_digest` remain canonical portable domain digests. Database row order, internal keys, SQLite file bytes, WAL pages, schema version and local exchange timestamps do not redefine them. Existing export pins/guarded `SnapshotChanged` behavior remain; do not hash a database file as a substitute for the canonical result-payload manifest. Snapshot backup is an analytics artifact, distinct from an M17 selected-run portable ZIP.

## Public SQL and discovery

All public views are suffixed `_v1`; incompatible column meaning or grain requires a new version. Keep old views during a documented compatibility window. Adding a column is additive; callers should name selected columns. Views require stock SQLite and no custom Python UDF or proprietary extension.

| View | Exactly one row per |
|---|---|
| `analytics_exact_value_v1` | Canonical number; exact pair plus conservative plotting approximation/state. |
| `analytics_trial_v1` | Expected trial, including not-retained/unsealed rows, coverage and effective exclusion flags. |
| `analytics_review_category_v1` | Finalized review/category, including valid partial fields in an explicitly ungraded review; filter outcome before quality statistics. |
| `analytics_analysis_status_v1` | Finalized saved analysis with status and dependency freshness. |
| `analytics_score_v1`, `analytics_current_score_v1` | Analysis subject, including excluded/pending subjects and null scores; current view additionally filters freshness. |
| `analytics_trial_score_v1` | Analysis subject/expected trial with a selected valid review and persisted Q. |
| `analytics_component_v1` | Analysis subject/factor with exact raw/normalized/contribution pairs and coverage. |
| `analytics_generation_pair_v1` | Scoped call with paired output/duration and timing basis. |
| `analytics_variant_creator_v1`, `analytics_variant_date_v1` | Claim slot/value alternative, including unknown slots; potentially multiple rows per descriptor/node. |
| `analytics_context_v1` | Context analysis/snapshot/segment/count basis, including separately qualified membership and classification. |

Join review categories, creators, dates, hardware samples and context segments only at their declared grain. Never join all of them onto score rows then `SUM(score)`; that creates fan-out. Filter multivalued facets with `EXISTS`, or aggregate each child independently first. The examples demonstrate same-benchmark quant/creator/date filtering, category profiles, cost/quality plots, pooled throughput, verification infrastructure distinctions, context rows, lineage graphs, and per-configuration In/Out tok and Files/LOC means. Exact date-range match tiers and strict Matched variants remain engine-derived semantics, not inferred by examples from aliases or string dates.

Register `database.path`, `database.info`, and `database.snapshot` on the shared engine API. `database.path -> {path, exists, schema_version, view_contract_version, access: read_only}` returns the real configured path, without creating an empty database as a side effect. `database.info` additionally returns application/runtime versions, journal mode, latest publication, table/view catalog with grain/PK/FK/index descriptions, row counts, migration state and backup availability; expensive statistics are explicit, cancellable work. Schema errors use typed remedies.

`database.snapshot({output, overwrite:false}) -> JobRef` performs online backup into a new temporary sibling, validates it, fsyncs and atomically publishes the destination. Completion includes path, schema/view version, snapshot publication boundary and checksum. An existing destination conflicts by default; an explicit overwrite request uses the existing file approval policy. No SQL-write RPC is added. M14 commands are `axbenchmark database path`, `axbenchmark database info`, and `axbenchmark database snapshot --output PATH`; snapshot path/size/progress and failed-job remedies are visible.

Read-only examples after implementation:

```sh
sqlite3 -readonly /path/to/results.sqlite3
# At the SQLite prompt:
SELECT analysis_id, run_uid, configuration_id, quality_approx
FROM analytics_current_score_v1;
```

```python
from pathlib import Path
from sqlite3 import connect
from fractions import Fraction
with connect(Path('/path/to/results.sqlite3').as_uri() + '?mode=ro', uri=True) as db:
    rows = db.execute('SELECT quality_num, quality_den FROM analytics_score_v1 WHERE quality_num IS NOT NULL')
    exact_quality = [Fraction(int(n), int(d)) for n, d in rows]
```

Graph tools may consume `_approx` columns; exact reproducibility uses numerator/denominator text. Long or shared analyses should use a snapshot, release read transactions promptly, and retain analysis IDs/template hashes in exported graph data. Read-only access is not anonymization: sharing the complete database is an explicit user action and differs from the sanitized selected-run M17 export.

## Runtime, migration and recovery

STRICT DDL needs SQLite **3.37.0** or newer and uses supported STRICT scalar types. The application must check the actual linked SQLite library, not assume the operating system CLI or Python version implies compatibility. [SQLite STRICT tables](https://sqlite.org/stricttables.html)

For live WAL operation, require **SQLite 3.51.3 or newer**: upstream identifies its WAL-reset fix there. This new implementation has no older-runtime compatibility exception. The syntax minimum is not the supported live runtime minimum. Use a local filesystem, one engine writer queue, short transactions, explicit `journal_mode=WAL`, `synchronous=FULL`, finite busy timeout and retry/cancellation policy. WAL permits concurrent readers and a writer, but has one writer at a time and relies on shared local memory; do not put the live store on a network filesystem. Bound snapshot read leases and monitor checkpoint backlog because long readers can retain WAL pages. [SQLite WAL operation and WAL-reset fix](https://sqlite.org/wal.html#walresetbug)

Enable and assert `PRAGMA foreign_keys=ON` on **every connection** before transactions. SQL foreign-key constraints do not make this setting automatic; nullable FKs also require semantic presence checks where a value is mandatory. Run both `foreign_key_check` and `integrity_check` in migration/snapshot verification. [SQLite foreign-key enforcement](https://sqlite.org/foreignkeys.html)

Online snapshots/backups use the SQLite backup API from a pinned consistent read, including committed WAL state. Never copy only the live `.sqlite3` file, delete its WAL manually, or set `immutable=1` on a changing live database. Backup to a temporary destination, verify it, close its connections and convert the destination to a standalone journal mode before publishing one portable database file; preserve evidence-reference availability separately. Backup contains the state at its reported snapshot pin, not writes committed after it. [SQLite backup API](https://sqlite.org/backup.html), [SQLite WAL files](https://sqlite.org/wal.html#the_wal_file)

The engine migration runner verifies `application_id`, `user_version`, ordered migration checksums and expected starting schema; rejects a newer unsupported version without writing. `schema_migration` receives the actual reviewed DDL checksum after creation, not a self-referential constant embedded into its own file. Migrations take an exclusive application maintenance lease, make a verified backup, perform transactional DDL/data conversion and validate invariants before updating the version. Failure preserves the prior readable database or restores the verified backup under the maintenance lease; never silently reset/drop user results. Runtime migration code is separate from the empty-database SQL companion.

Initial creation uses the empty-database v1 contract. Bootstrap publishes one unified migration manifest/checksum registry: M11.1 implements the minimal shared connection/publication/receipt segment, and M02.2 implements subsequent result/schema/view segments. These are ordered owned migrations in one database, not competing `user_version` registries; M02 must not rerun the full empty-database DDL over the foundation. The SQL companion composes their final v1 outcome for review and disposable tests. Forward migrations describe future versions only; do not implement a legacy-file migration, historical format adapter, backfill or fallback reader. Current-format M17 exchange between new implementations remains supported.

## Acceptance and verification boundary

Run the inert companion from `spec/`:

```sh
python3 implementation/sqlite/validate-schema.py
```

It creates only disposable databases, executes the DDL and every example, exercises exact fractions/large values/signed observations, zero versus unknown, full expected rosters, fan-out-safe provenance filters, pooled throughput, foreign/scope constraints, duplicate originals, immutable seals/finalizations, DAG cycles, atomic rollback, two-connection WAL visibility, staleness before recomputation, online backup and integrity/FK checks. This proves those SQL/query contracts on the reported SQLite runtime, not a working repository adapter, approved scoring formula implementation or application recovery.

Implementation acceptance additionally requires: lossless real M02/M10/M12/M18 codec round trips; complete M06 exact vectors and offline parity; property checks for all declared row grains and no trial cherry-picking; query plans using relevant indexes on representative retained populations; engine-enforced constraints listed above; M17/M01/M07/M16 crash injection before/after each file/DB publication boundary with direct SQL readers; export mutation guards; human intent/receipt replay; readonly/path/backup CLI/API behavior; empty-database creation, ordered shared/result migration composition and forward-migration rollback; disk-full/busy/cancel/error recovery; and inspection/report/SQL querying with model access disabled. Tests must validate required indexes and measured plans rather than an ungrounded universal latency promise.

No run, inference, grading, external service or real user database is needed to inspect these schema artifacts. Runtime implementation remains the responsibility of the existing owners above.
