# M17.2 — exchange-transactions

Parent: [M17](../../17-zip-exchange.md#1-engine-component). Requirements: R015, R029, R036, R066, R115–R124, R134, R141–R143, R153–R155. Findings: F01, F02, F03, F06, F09, F10, F14, F18.

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

## Concrete interfaces and lifecycle

Implement the parent's queries/jobs/commands in `axbenchmark.api.exchange`, registered through M11. `inspect_package(path)` is bounded read-only inspection; `inspect_results(path, template_sha256)` returns JobRef then a staged preview; `import_results(staging_id, target)` publishes only after revalidation.

`plan_result_export(run_uid, result_ids=None)` freezes an explicit nonempty `selected_result_ids`; absent subset means all retained results, disabled if any is unavailable. `export_results(run_uid, result_ids, path)` requires that explicit selection and rejects cross-run/empty IDs; RunLabel is never an internal address.

Capture one PublicationView; acquire M02 `export_bundle(run_uid, rids, view)` and M01 `RevisionReader.open(sha, view)` leases. Export only allowlisted file openers and complete binding/rate/billing/terminal evidence. Partial trial selection keeps full frozen counts and missing slots.

Bundle acquisition pins run-binding digest, terminal readiness revision, selected sealed fact versions/digests, committed review versions and run invalidation revision. Its final `publication_guard()` holds the run mutation lock through output commit and rechecks binding/retention/facts/invalidation and readiness; changed versions fail or trigger explicit repinning. Later reviews do not replace pinned reviews.

An invalidated scope can export for inspection with its overlay and original template binding. A mutated template still fails M01 identity: restoration of approved bytes is required, never force-rebind. Release bundle, revision and PublicationView leases in every outcome; cancel/failure removes incomplete output.

Stage paths under private 0700 roots with 0600 files; archive reads hold stable handles, verdict bytes/digests are immutable and rechecked. Inspection expiry cannot reclaim transaction-held staging. Output commit is durable and no-clobber, including a destination created after preview.

## Shared publication and recovery

1. Journal transaction ID, immutable complete intent/digests and staging lease before any participant mutation.
2. Under the shared write lock, reclassify all collisions; call M01 `prepare_staged(tx, staged, origin)` and M02 `prepare(tx, batch)`. Journal exact revision/run/trial/result/invalidation tokens and created flags, including pre-existing reservations.
3. Same-tx retry returns original receipts. Recovery of a crash after prepare but before journal receipt repeats the immutable prepare once to recover tokens; conflicting intent fails. Once receipt exists, use it directly for rollback.
4. Call both `commit_view(tx)` acknowledgements, durably checkpoint journal/outbox, then `PublicationTransactions.publish(tx)`: the only commit point. No template-only visibility or early change event.
5. Before startup readers enter, unpublished transactions roll back only their created records and release existing reservations; published transactions finish cleanup/outbox delivery. Never delete prior records or withdraw published work. Failed rollback blocks startup with hidden data.
6. Cancellation before marker rolls back; afterward it reports committed outcome and finishes cleanup. Retry and logical outbox IDs are idempotent; disconnect cannot undo publication.

All reads/actions capture one view, including guessed-ID lookup, launch, export and delete. Conflict in any immutable run/trial binding, result snapshot or invalidation rejects the whole batch. An existing invalidation cannot be cleared by importing a clean snapshot.

## Acceptance

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
