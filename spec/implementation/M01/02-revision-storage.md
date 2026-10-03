# M01.2 — revision-storage

Parent: [M01](../reference/modules/01-template-library-identity.md#1-engine-component). Requirements: R015, R067, R068, R115, R118, R140, R141. Findings: F10, F14.

Outcome: canonical revisions can be prepared, read, restored, audited and retired without exposing incomplete transactions or changing another revision's files. This child implements storage and in-engine interfaces, not public library commands.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap and [M01.1](01-canonical-definition.md), including its reference-validation fixtures and canonical vectors.

**Bootstrap-published contracts, allowed as injected fixtures:** shared `PublicationTransactions`, `PublicationView`, transaction tokens/read leases, `Clock` and `IdGenerator`. Use a deterministic transaction coordinator that can pause at each durability boundary; M11/M17's real coordinator is not an entry dependency. M02/M07/M16 stores are represented by prepared-participant fixtures, never reached through their files.

## Ownership and contracts

Own proposed files:

- `axbenchmark/engine/library/domain/revisions.py`: revision/lineage/tombstone records, registration tokens, mode deviations and read-lease value types.
- `axbenchmark/engine/library/adapters/object_store.py`, `revision_files.py`, `library_index.py`, `default_pointer.py`, `storage_recovery.py`.
- `axbenchmark/engine/library/application/registration.py`, `revision_reader.py`, `identity_check.py`, `restore_revision.py`, `audit_revision_modes.py`.
- `tests/library/test_object_store.py`, `test_revision_storage.py`, `test_registration_transactions.py`, `test_revision_recovery.py`, `test_mode_audit.py`, `test_read_leases.py`.

Extend the storage sections of `engine/library/ports.py`; M01.3 owns command orchestration and RPC wiring. Public in-engine interfaces are `RevisionRegistry.prepare/prepare_staged/commit_view/rollback`, `RevisionReader.open`, `RevisionPermissions.audit`, and `TemplateIdentity.check` in the parent. `commit_view` only acknowledges durable participant readiness; the shared marker publishes. Return `Registration(sha256, created, token, transaction_id)`. A new transaction’s `created=False` token reserves a pre-existing revision and never authorizes its deletion during rollback. Persist each intent and receipt atomically: same-transaction/same-intent `prepare` or `prepare_staged` returns the original token and `created` flag, including recovery before the coordinator journals that receipt. Different intent fails; rolled-back intents are not re-prepared.

Storage owns immutable objects, read-only revision generations and transaction overlays under `~/.axbenchmark/library/`; the parent specifies layout and journal rules. It does not own configurations, results or the shared publication journal. A read captures `PublicationView` and holds a lease until the `FrozenRevision` context exits. Staged ids remain unavailable to public readers. `FrozenRevision.baseline_files` carries executable flags but every stored file remains 0444. Workspace copying belongs to M05/M08.

Removal is post-publication garbage collection: wait for leases, retire the selected tree, add owner-write to only its directories, unlink files without changing their modes, and collect only objects unreferenced by live/built-in/staged/pinned revisions. Restore writes a verified new generation; old generation reclamation follows the same lease rule. Durable cleanup failure must be retained for recovery/readiness, not misreported as an uncommitted operation.

**Frozen domain contract.** RevisionReader verifies the existing rubric/check/support closure and returns the exact frozen domain evidence-plan/rubric binding; storage never upgrades family/version on open/restore. Native matrices, approved agent case/authority plans and supplied document reference packs remain immutable defining bytes, portable after source removal.

**SQLite publication binding.** Keep immutable template bytes and YAML overlays in this adapter. `PublicationView` pins the shared SQLite marker and read transaction; fsync prepared payloads before the coordinator commits its marker/operation receipt/outbox. A template-only approval still uses that same database authority. M11.1 supplies the foundation contract, M02.2 adds later result migrations; do not import its repository or create a filesystem commit marker.

## Integrated requirements

R191 — [authoritative SQLite results and analyses](../RESULTS-DATABASE.md).
R184, R185, R186, R187, R188 — frozen domain profile/evidence contracts: [R184](../quality-judges/BACKEND.md); [R185](../quality-judges/MOBILE.md); [R186](../quality-judges/DEVOPS.md); [R187](../quality-judges/AGENTIC.md); [R188](../quality-judges/SPECIFICATION.md).

R179 — [benchmark modes](../BENCHMARK-MODES.md).

`FrozenRevision` and registration/storage fixtures preserve the v1/v2 descriptor discriminant and exact baseline path/byte/executable inventory. V2 populated current-folder captures remain portable after their origin disappears; every trial copies from the published immutable revision lease, never the source path. Test non-Git, dirty/untracked/binary capture payloads and empty/folder distinctions through prepare/read/restore/recovery. Preserve archived v1 objects and M09 golden identities; add no old-installation backfill or implicit format upgrade.

## Acceptance and fault checks

**SQLite acceptance:** Fault durable file creation, participant readiness and the actual SQLite commit with a second read-only SQL connection. No marker or guessed-ID read admits partial revision/configuration/draft state; old leases survive. A rollback removes only newly staged unreferenced bytes.

**Domain acceptance:** Add exact-byte restore/open vectors across six families and corrupted plan/support refs; legacy payloads remain unchanged.

Run `pytest tests/library/test_object_store.py tests/library/test_revision_storage.py tests/library/test_registration_transactions.py tests/library/test_revision_recovery.py tests/library/test_mode_audit.py tests/library/test_read_leases.py`:

1. Write a full golden revision, inspect every mode, attempt ordinary-user writes, and prove files/directories are 0444/0555 including executable baseline files. Modify bytes and separately change modes: identity detects the former, mode audit detects the latter, and restore repairs both without re-pinning the approved digest.
2. Pause before/after object persistence, prepared tree creation, index overlay, participant acknowledgement and publication. Concurrent readers see either no new revision or the whole published revision. Guessed staged ids fail. A pre-existing duplicate remains visible and byte-identical through rollback.
3. Simulate process death at each boundary and restart. Before-marker transactions roll back only their own tokens; after-marker transactions roll forward. Include the crash after participant prepare is durable but before the coordinator journals its receipt: repeat the same prepare, recover the original token/created flag, then roll back only its creation. Test both prepare entry points and reject changed intent. An I/O error during rollback leaves data hidden and blocks recovery completion. An error after publication leaves a cleanup obligation and never withdraws committed data.
4. Hold a read lease during restore/delete; its bytes remain readable until release, new views select the new generation/tombstone, and reclamation then runs once. A spy sees `chmod` only for directories inside the intended retired tree. Another revision and shared objects preserve bytes/modes.
5. Audit ignores staging/retired trees. Two deliberate live-tree deviations return their exact paths/modes and remain unmodified by audit. Concurrent duplicate preparations converge to one live revision and token-specific rollback cannot remove the winner.

**Wireframes:** no UI. Supplies `TemplateIdentity`, `LaunchMismatch`, `RevisionDeletePending` and readiness mode-drift data; renderers are later owners.

**Real integration gate:** with M17.2/M02.2's real publication participants, pause an embedded-template/result import while M01 reads, launches/exports through consumers and deletes. No partial collections or guessed staged access are allowed. Real M07/M16 participants must also prove approval/deletion atomicity via M01.3. Run mode and restoration cases on macOS/Linux with ordinary user permissions.

**Pending parent obligations:** refusal/capability policy, revision/default/draft commands, APIs/events and transactional participant orchestration (M01.3); UI confirmation/navigation (M01.4); real import/workspace and readiness consumers.
