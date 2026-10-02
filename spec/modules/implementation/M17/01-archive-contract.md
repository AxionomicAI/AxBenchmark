# M17.1 — archive-contract

Parent: [M17](../../17-zip-exchange.md#1-engine-component). Requirements: R066, R068, R115–R120, R122, R134, R140–R142, R153–R154. Findings: F01, F02, F03, F06, F09, F10.

Outcome: a bounded archive reader/writer and validated immutable package model that preserves M01 definitions and M02 retained snapshots exactly. This is proposed implementation work; validation creates no library/result records and executes no package content.

## Entry conditions

**Completed implementation prerequisites:** Bootstrap, [M01.1 canonical-definition](../M01/01-canonical-definition.md), and [M02.1 retained-records](../M02/01-retained-records.md), including their canonical and portable-binding vectors.

**Bootstrap-published contracts, allowed as injected fixtures:** M01 payload/reference parsers for checks, services and rubrics; M02 `ImportRegistrar.read_incoming(staged_result_dir, staged_run_dir)` and immutable ExportBundle content; shared IDs/TrialRef, clock and typed errors. M01/M02 filesystem registration, M11 jobs and real collectors are not entry dependencies.

## Ownership

Own proposed files, without changing the owners' canonical codecs:

- `axbenchmark/engine/exchange/domain/package.py`, `boundary.py`, `validation.py`, `provenance.py`.
- `axbenchmark/engine/exchange/adapters/zip_reader.py`, `zip_writer.py`; archive-only sections of `axbenchmark/engine/exchange/ports.py`.
- `tests/exchange/builders.py`, `test_package_format.py`, `test_archive_boundary.py`, `test_package_integrity.py`, `test_portable_bindings.py`, `test_archive_modes.py`.
- `tests/exchange/fixtures/manifest-v1.json`, `same-label-runs.json`, `two-trials.json`; malicious archives are generated in temporary directories by builders.

M17.2 owns staging/publication/API adapters and extends the remaining ports; M17.3 owns presentation. Coordinate shared port edits and preserve other workers' additions.

## Concrete interfaces

Implement `PackageFormat.parse_manifest(bytes) -> PackageManifest`, `check_boundary(entries, bounds) -> BoundaryReport`, `check_listing(manifest, files) -> CompletenessReport`, and `check_references(batch, definition) -> list[ReferenceProblem]` from the parent.

`ArchiveReader.index(path) -> ArchiveIndex` reads the central directory; `read(path, name, limit) -> AsyncIterator[bytes]` enforces actual streaming limits. `ArchiveWriter.write(dest_tmp, entries) -> int` consumes explicit PackEntries; no traversal of arbitrary source directories.

Use exactly `TemplateIdentity.compute(payload: CanonicalPayload)` and `.parse_definition(payload)`. Preserve M01 `metadata.json` and manifest bytes, compare canonical reserialization and recomputed digests, and validate role/reference closure. Never generate a competing descriptor from package display metadata.

Result packages contain one RunUid, the complete immutable RunBinding/terminal evidence and explicit `selected_result_ids`; each ResultId binds to one TrialRef and every evidence/review scope agrees. Preserve frozen trial counts and missing slots. Human RunLabel never participates in grouping or collision resolution.

The envelope's `integrity_digest` covers canonical envelope bytes excluding that field; its file rows cover every payload file. M02's distinct per-result `payload_digest` covers the pinned retained snapshot, including reviews/invalidations. Do not confuse either with M01 template SHA-256.

Retain finalization receipts, original-review dispositions, frozen prices/billing/rates including missing values, origin/source IDs and append-only invalidation. Parse without current catalog/measurement lookups. No selected subset can rewrite the immutable full-run binding.

ZIP type metadata may reject links/special files, but executable flags come exclusively from hashed `baseline.files[].executable`. Preserve exact bytes and flags while staging/approved files remain non-writable and staging non-executable.

M02 owns decoding both the selected result directories and shared run directory; M17 assembles their validated inputs without a second retained-record codec. Manifest-only provenance is labelled declared until those records confirm it.

## Boundary and failure rules

Reject escaping/absolute/drive/control paths, non-NFC paths, duplicates after NFC/case-folding, file/directory-prefix collisions, links/special files, encrypted entries and unsupported methods. Optional directory entries must be ancestors of inventoried files.

Apply entry count, individual/total inflated-byte and compression-ratio bounds both to the index and actual stream. Check local-header agreement, CRC and truncation; never call extractall. Nothing writes before the boundary report is clean.

Missing/unexpected inventory entries, wrong role/task/trial references, corrupt bytes and unsupported formats produce typed errors with paths/requirements. Staging disposal and registration atomicity belong to M17.2.

## Acceptance

Run `pytest tests/exchange/test_package_format.py tests/exchange/test_archive_boundary.py tests/exchange/test_package_integrity.py tests/exchange/test_portable_bindings.py tests/exchange/test_archive_modes.py`:

1. Round-trip built-in/planner canonical fixtures without rewriting metadata; display renames preserve identity, task order/protocol/executable-flag edits change it. Noncanonical JSON, duplicate keys and missing roles fail.
2. Exercise each path/kind/collision rule and each bound just below/above the limit. An index that underreports inflated bytes cannot bypass the running total or ratio guard. Corrupt CRC/header/truncated archives fail before registration.
3. Repack with reversed order, stored/deflate, timestamps and safe permission changes: exact canonical bytes/digest remain equal. Identical baseline bytes with opposite semantic flags stay distinct; archive permissions cannot override them.
4. Two machines' same-label/same-configuration different-UID runs stay separate. Two trials keep distinct T1 log/screenshot references. Reject cross-run results, occupied slots, duplicate selected IDs and mismatched frozen counts.
5. Corrupt each required file group and snapshot/envelope digest independently. Preserve unknown/partial measurements, frozen rates/billing sources and invalidation identity through serialization; no missing rate becomes a current lookup.
6. Export A → import B → export C preserves source origin/result ID and appends relay history without replacing the originating machine.

**Wireframes:** no UI; supplies ImportUnsafe, ImportIncomplete, ResultPackagePick/ResultPackage, ResultMismatch, ResultImportConflict and validation progress data for later children.

**Real integration gate:** M17.2 + real M01.2–3/M02.2 must import actual M09/M16 canonical packages on macOS and Linux. M05/M08 restore executable behavior from descriptor flags while approved revision modes remain 0444/0555. Record which OS checks were run.

**Pending parent obligations:** durable safe staging, pinned finalized export, atomic shared publication/recovery, API/jobs and no-execution guards (M17.2); all screens (M17.3); real finalization and cross-OS gates.
