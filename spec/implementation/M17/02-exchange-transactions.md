# M17.2 — exchange-transactions

Parent: [M17](../reference/modules/17-zip-exchange.md#1-engine-component). Requirements: R015, R029, R036, R066, R115–R124, R134, R141–R143, R153–R155. Findings: F01, F02, F03, F06, F09, F10, F14, F18.

Outcome: real `exchange.*` operations export a consistent finalized selection and import a complete collection at one publication boundary. This child owns coordinator behavior, not template/result records or execution.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M17.1](01-archive-contract.md), M01.2 revision-storage/M01.3 library-service, M02.2 retention-services, and M11.1 engine-client-api/M11.2 events-jobs-lifecycle.

**Bootstrap-published contracts, allowed as injected fixtures:** M03 MachineIdentitySource; M11/M10/M18 finalized-run producer; M12 review producer; M05 launch action. The real M01/M02 participants and shared marker adapter are required here; fixtures for them are only fault-test controls, not the completion gate.

M01/M02 must publish same-tx prepare retry semantics and M02's ExportBundle guard/close contract specified by the parent before implementation. Later real execution/finalization is an integration gate, avoiding a prerequisite cycle.

## Ownership

Own proposed files:

- `axbenchmark/engine/exchange/application/inspect.py`, `export.py`, `import_template.py`, `register_results.py`, `recovery.py`; remaining `axbenchmark/engine/exchange/ports.py` sections.
- `axbenchmark/engine/exchange/adapters/fs_staging.py`, `fs_output.py`, `fs_journal.py`, `rpc.py`; `axbenchmark/api/exchange.py`.
- M17 coordinator and shared publication-marker binding in `axbenchmark/engine/daemon/composition.py`; shared `axbenchmark/engine/shared/publication.py` adapter under the Bootstrap-owned Protocol. Coordinate these shared-file edits with M11; no private competing marker.
- `tests/exchange/test_exports.py`, `test_inspection.py`, `test_registration.py`, `test_publication_recovery.py`, `test_exchange_api.py`, `test_no_execution.py`, `test_exchange_roundtrip.py`.

M01/M02 implement only their prepare/commit_view/rollback/data operations; M14 owns curated CLI handlers. Never read or write their private indexes directly.

Pin M02 export selections for each capture independently, including pending/partial/native-only analysis states and observer-account closure. Copy only leased descriptor/selected-sidecar openers under the supplement's portable mapping. Import through M02 read_incoming and the same SQLite rows/files/receipts/outbox/marker publication; no analysis merge or implicit observer resumption. Late annotations cannot extend an acquired ZIP or alter sealed facts. Capture closure/storage gates retention, classifier completion does not; all import/export/report reads remain model-free.

## Concrete interfaces and lifecycle

Implement the parent's queries/jobs/commands in `axbenchmark.api.exchange`, registered through M11. `inspect_package(path)` is bounded read-only inspection; `inspect_results(path, template_sha256)` returns JobRef then a staged preview; `import_results(staging_id, target)` publishes only after revalidation.

`plan_result_export(run_uid, result_ids=None)` freezes an explicit nonempty `selected_result_ids`; absent subset means all retained results, disabled if any is unavailable. `export_results(run_uid, result_ids, path)` requires that explicit selection and rejects cross-run/empty IDs; RunLabel is never an internal address.

Capture one PublicationView; acquire M02 `export_bundle(run_uid, rids, view)` and M01 `RevisionReader.open(sha, view)` leases. Export only allowlisted file openers and complete binding/rate/billing/terminal evidence. Partial trial selection keeps full frozen counts and missing slots.

Bundle acquisition pins run-binding digest, terminal readiness revision, selected sealed fact versions/digests, committed review versions and run invalidation revision. Its final `publication_guard()` holds the run mutation lock through output commit and rechecks binding/retention/facts/invalidation and readiness; changed versions fail or trigger explicit repinning. Later reviews do not replace pinned reviews.

An invalidated scope can export for inspection with its overlay and original template binding. A mutated template still fails M01 identity: restoration of approved bytes is required, never force-rebind. Release bundle, revision and PublicationView leases in every outcome; cancel/failure removes incomplete output.

Stage paths under private 0700 roots with 0600 files; archive reads hold stable handles, verdict bytes/digests are immutable and rechecked. Inspection expiry cannot reclaim transaction-held staging. Output commit is durable and no-clobber, including a destination created after preview.

## SQLite publication binding — R191

The [database spec](../RESULTS-DATABASE.md) fixes the concrete shared publication implementation: normalize validated result payloads into private staging, make file evidence durable, then have the final publisher insert live rows, receipts/outbox and the shared marker in one SQLite transaction. `commit_view` remains readiness only. Direct read-only base-table queries as well as owner APIs must see old or all new state. Do not attach or execute an incoming database's schema; canonical ZIP payload validation and portable facts/payload digests remain unchanged. A read-only analytics snapshot is not an alternate import format. Extend fault tests to actual concurrent SQLite readers, pre/post-commit crashes and safe evidence orphan cleanup.

## Shared publication and recovery

1. Journal transaction ID, immutable complete intent/digests and staging lease before any participant mutation.
2. Under the shared write lock, reclassify all collisions; call M01 `prepare_staged(tx, staged, origin)` and M02 `prepare(tx, batch)`. Journal exact revision/run/trial/result/invalidation tokens and created flags, including pre-existing reservations.
3. Same-tx retry returns original receipts. Recovery of a crash after prepare but before journal receipt repeats the immutable prepare once to recover tokens; conflicting intent fails. Once receipt exists, use it directly for rollback.
4. Call both `commit_view(tx)` acknowledgements, durably checkpoint journal/outbox, then `PublicationTransactions.publish(tx)`: the only commit point. No template-only visibility or early change event.
5. Before startup readers enter, unpublished transactions roll back only their created records and release existing reservations; published transactions finish cleanup/outbox delivery. Never delete prior records or withdraw published work. Failed rollback blocks startup with hidden data.
6. Cancellation before marker rolls back; afterward it reports committed outcome and finishes cleanup. Retry and logical outbox IDs are idempotent; disconnect cannot undo publication.

All reads/actions capture one view, including guessed-ID lookup, launch, export and delete. Conflict in any immutable run/trial binding, result snapshot or invalidation rejects the whole batch. An existing invalidation cannot be cleared by importing a clean snapshot.

Extend the M02-owned portable payload/reference closure with exact `M10Statistic`, `GenerationAggregate` pairings/N/D/rosters, `ArtifactStats` final manifest/inventories, retained policy bytes/version/digests, independent detail/metric availability and complete schema-2 original ranking maps/directions/policies. Transport exact canonical source bytes and evidence through pinned allowlisted openers; do not scan a workspace, recompute counts/means/rates, migrate installed state or reconstruct missing native receipts. A selected trial subset retains full frozen counts/missing slots. Measured artifact exclusion inventory is inert evidence, never an instruction to import active VCS/dependency state.

**Frozen domain contract.** Pinned M01 revision/M02 ExportBundle readers include all domain evidence and rubric closure, preserving exact version/digest/signature and recorded coverage/modality/modes through existing prepare/commit/publication transactions. Import uses owner parsers for acceptance.v1/v2 and rubric schemas; it never materializes a candidate runtime, substitutes current defaults or recollects missing proof. Unsupported interpretations have typed reasons; known contradictory/missing bound evidence rejects the whole batch.

Pin variant descriptor/annotation/exclusion revisions and selected metadata view with M02 ExportBundle and its final publication guard. Read/import uses M02 codecs and private staging; normalized variant rows/operations join the same rows+outbox+marker SQLite transaction, never a second metadata registry commit. Reclassify descriptor and annotation conflicts under the shared lock; one conflict rejects the whole batch. Existing mandatory exclusions cannot be cleared by importing an older clean snapshot or choosing As recorded; selected trials retain full immutable run binding and missing roster slots.

Import preserves evidence tiers and remote source claims offline without adopting them into live catalog overrides, resolving URLs, loading models or rerunning grading. This adds no new publication protocol and rewrites no canonical approved/archive bytes.

**Composed transaction ownership.** Use the already initialized M11.1 shared connection plus M02.2 ordered result schema. The M17 publisher controls one connection/transaction for all accepted normalized rows, revision dependencies, receipts/outbox and marker after prepared files are durable; participants cannot commit independently. Staging may use private files or a private staging DB, never committed live base-table rows hidden by views. A `PublicationView` spans the SQLite pin and M01/M07/M16 marker-selected files, with bounded leases and unchanged conflict/retry rules.

**Route, comparison and profile interfaces.** Prepare route/profile/matrix projections with existing M02 codec/import participants and shared single SQLite publication. Profile/access snapshots arrive as inactive provenance only; local registration, credential resolution and installed qualification are never recreated during import. Reuse M02 immutable collision/conflict rules with typed exchange errors and all-or-none transaction/recovery; no partial matrix publishes. Export under pinned comparison/observation/annotation dependency revisions and evidence leases; exclude working M03/M04/M16 journals/private bindings.

## Integrated requirements

R192, R193, R194 — [controlled harness comparisons, API routes and existing profiles](../CROSS-HARNESS-COMPARISON.md).

R191 — [authoritative SQLite results and analyses](../RESULTS-DATABASE.md).
R190 — [model variants, lineage and comparison](../MODEL-VARIANTS.md).

R189 — [human review](../M12/05-human-review-web.md).

R184, R185, R186, R187, R188 — frozen domain profile/evidence contracts: [R184](../quality-judges/BACKEND.md); [R185](../quality-judges/MOBILE.md); [R186](../quality-judges/DEVOPS.md); [R187](../quality-judges/AGENTIC.md); [R188](../quality-judges/SPECIFICATION.md).

R174, R175, R176 — [benchmark statistics](../BENCHMARK-STATISTICS.md).

R164, R166, R171 — [context monitoring](../CONTEXT-MONITORING.md) and [decision engines](../DECISION-ENGINES.md).

R179, R180, R183 — [benchmark modes](../BENCHMARK-MODES.md).

Dispatch embedded definitions through M01's v1/v2 codec; preserve outer manifest/ZIP format, exact primary/shared/protocol/check bytes and baseline executable flags. Include format/mode/seven-domain/target/legacy projections and ordered stage refs without constructing another descriptor. Source paths are provenance only; source deletion cannot block imported execution. Archived v1/M09 hashes and outcomes remain unchanged, including one-task legacy labels and zero-file repository shapes.

Retain M02's scoped protocol/check identity and inert start/end commit/tree/history/ancestry/inventory/snapshot proofs, setup-versus-competitor origin and verdict causes. Never import active `.git` metadata/pointers/hooks/config/remotes/alternates, execute package checks or regenerate missing evidence. Reject malformed/cross-trial/missing declared proof references through owner schemas; historical unavailable fields stay not_recorded. Add both-mode empty/populated source-removed round trips with executable flags, empty milestones, missing/dirty/unreadable proofs and preserved original task-cutoff outcomes. New-launch compatibility remains M01/M07's revision gate, not an import rewrite.

**Human exchange contract and acceptance:** M02 supplies only committed human-authored reviews, self-declared reviewer/form-policy identity, exact rubric/evidence/group digests, raw grade parts/comments/limitations/deficiencies and original/additional disposition receipts. Pending original cases block finalized result export; a selected subset cannot bypass that full-run barrier. Exclude local drafts, human working journals, session tokens, loopback URLs and active controller assets. Inspect/import/round-trip graded/ungraded/skipped originals and additional groups without creating a host, automatic browser reopen, model call or new local verified identity. Display human groups and model cost not applicable; unresolved original waiting and actual persistence failure have distinct reasons. Reject forged machine fields or cross-case/result evidence through M02 codecs; retain six grades and exact score parity after offline reimport.

## Acceptance

**Route/profile acceptance:** Import/cancel/crash at every participant boundary retains all-or-none six-cell metadata and selected evidence. Conflicting profile ID/version/digest or cross-subject route source rejects with no endpoint calls, local registration, shell execution or model work.

**SQLite acceptance:** Run second-connection raw base-table reads at every prepare/commit/cancel/crash boundary, including template-only and combined imports. Precommit failure leaves old rows; postcommit failure recovers the whole batch/event receipts. Preserve exact canonical digests and reject imported executable schema.

**Variant acceptance:** Crash/race at variant-row, annotation receipt and marker boundaries; APIs and direct read-only SQL see the old or complete new batch. Change exclusion during export and reject stale publication. Reimport identical metadata retries safely; changed ID/revision content conflicts atomically and offline HTML preserves exact existing ranks/raw grades.

**Domain acceptance:** Fault-inject native image/agent trace/brief-reference file durability and profile digest conflicts through atomic publication. Offline reimport preserves original grades, modes, gaps and separate groups; failures expose no partial family/evidence registration.

Extend archive/roundtrip fixtures with complete and partial request timing, matched subset 400/5 with full output 600, pooled 200 and count mean 7/2, known files/unknown LOC, excluded/link/binary inventories, schema-2 directions/policies and preserved explicit v1 originals. Corrupt policy/receipt/inventory digests or cross-trial bindings and reject atomically; source deletion and ZIP reordering do not change statistics. Delayed metric/snapshot writes cannot pass finalization/export; Python/HTML rank parity survives reimport with network/model access disabled.

Extend existing fixtures for native-only and delayed/partial analysis, explicit local overlap/unknown attribution, distinct decision/harness/human fingerprints and offline or disabled-engine operation as applicable. Assert unchanged scope/digests, no fabricated values/calls, and no reclassification triggered by viewing, export/import or navigation.

Run `pytest tests/exchange/test_exports.py tests/exchange/test_inspection.py tests/exchange/test_registration.py tests/exchange/test_publication_recovery.py tests/exchange/test_exchange_api.py tests/exchange/test_no_execution.py tests/exchange/test_exchange_roundtrip.py`:

1. Pause/crash at every journal/prepare/receipt/commit_view/marker/outbox boundary with concurrent list/read/launch/export/delete clients: each captured view sees prior or full state, and guessed staged IDs remain unavailable.
2. Include a pre-existing template, run binding and result in failed batches; rollback preserves their bytes and recovers exact created flags. Published response-loss retries skip duplicates; failed rollback blocks reader admission; a resumed cleanup emits no duplicate logical change.
3. Same-label runs stay separate; conflicting RunBinding, occupied TrialRef slot, changed same-ID review snapshot or reused invalidation ID rejects atomically. Subset import retains original frozen trial counts and source origin.
4. Delay final measurements/hardware and original reviews: export is pending; after completion, immediate ZIP matches retained facts/rates/billing. Race additional review and invalidation against write/commit: coherent pinned review version, current invalidation or typed retry, no stale comparable output.
5. Template/integrity corruption, staging mutation, path races and destination races leave prior stores/output unchanged. Patch process/model/install entrypoints to fail during script-bearing imports; no execution occurs. Run import-linter boundaries.
6. Both socket and InProcessClient expose numeric transport codes and namespaced data.code with the same field/remedy/steps/effects. Exchange remains available without harnesses. macOS ↔ Linux round-trip preserves canonical bytes, modes, scope and provenance.

**Wireframes:** no screen code; API supplies all fourteen M17 template/result import/export boards and explicit publication/retention failures.

**Real integration gate:** real M01/M02/shared-marker adapters on macOS/Linux; M11.3–4/M08.2/M10.2/M18.2 finalized energy/stop cases and M12.2 original-review settlement; M06/M13 reject imported invalidations; M14 CLI submits explicit planned IDs. Fake sensors/harnesses do not establish provider support.

**Pending parent obligations:** M17.3 presentation, M15 cross-module journeys, and the real provider/platform gates above.

### Automated judge assessment storage binding

Atomically register the M02 codec's automated assessment/group/binding/call/optional-Review closure under the existing shared SQLite publisher. Preserve failed/not_judged call evidence without synthetic reviews, exact independent original/additional judge selections and inactive credential-free imports. Existing selected-record conflicts and publication/rollback semantics apply; no extra exchange transaction or reader is introduced.
